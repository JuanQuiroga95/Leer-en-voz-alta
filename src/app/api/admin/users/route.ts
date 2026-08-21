import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { armarCsv } from '@/lib/reportes';

/** Contraseña con la que se crean los usuarios nuevos. */
const CONTRASENA_POR_DEFECTO = '123456';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formato = new URL(request.url).searchParams.get('formato');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        legajo: true,
        name: true,
        role: true,
        division: true,
        createdAt: true,
        // Solo para la exportacion, y nunca se devuelve: se usa para saber si la
        // contraseña sigue siendo la de fabrica. Ver mas abajo.
        ...(formato === 'csv' ? { password: true } : {}),
      }
    });

    // Exportacion real de los usuarios cargados, que es distinto de la plantilla
    // de ejemplo: sirve para comprobar que una importacion entro completa.
    if (formato === 'csv') {
      const ordenados = [...users].sort((a, b) =>
        (a.division || '').localeCompare(b.division || '') || a.name.localeCompare(b.name)
      );

      // Las contraseñas se guardan encriptadas y no se pueden leer, asi que no se
      // puede "exportar la contraseña" de alguien que ya la cambio. Lo que si se
      // puede es comprobar si todavia es la de fabrica, y en ese caso mostrarla.
      // Al que ya la cambio se le avisa, en vez de imprimir una contraseña que no
      // funciona y hacer perder tiempo al profe frente al curso.
      const bcrypt = await import('bcryptjs');
      const contrasenas = await Promise.all(
        ordenados.map(async u => {
          const hash = (u as { password?: string }).password;
          // Se comprueba que sea un hash de bcrypt antes de comparar: `compare`
          // devuelve false ante cualquier texto raro, y eso se leería como
          // "ya la cambió" cuando en realidad no sabemos qué pasó.
          if (!hash || !/^\$2[aby]\$/.test(hash)) return '(no se pudo saber)';
          try {
            return (await bcrypt.compare(CONTRASENA_POR_DEFECTO, hash))
              ? CONTRASENA_POR_DEFECTO
              : '(ya la cambió)';
          } catch {
            return '(no se pudo saber)';
          }
        })
      );

      const csv = armarCsv(
        ['Nombre', 'Usuario', 'Contraseña', 'Curso', 'Rol', 'Fecha de alta'],
        ordenados.map((u, i) => [
          u.name,
          u.legajo,
          contrasenas[i],
          u.division || '',
          u.role,
          u.createdAt.toLocaleDateString('es-AR'),
        ])
      );
      // El BOM es lo que hace que Excel abra los acentos bien en español.
      return new NextResponse('﻿' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

function generateBaseLegajo(fullName: string) {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'user';
  if (parts.length === 1) return parts[0];
  const name = parts[0];
  const lastNameInitial = parts[parts.length - 1].charAt(0);
  // remove accents and special chars
  const cleanBase = `${name}${lastNameInitial}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  return cleanBase || 'user';
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const usersInput = Array.isArray(body.users) ? body.users : [body];
    
    // Using bcrypt to hash the default password once for performance
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash(CONTRASENA_POR_DEFECTO, 10);

    const existingUsers = await prisma.user.findMany({ select: { legajo: true, name: true, division: true } });
    const legajosSet = new Set(existingUsers.map(u => u.legajo));

    // Clave para no cargar dos veces al mismo chico. Importar una lista de curso
    // es algo que se reintenta (se corta la conexion, se duda de si funciono), y
    // sin esto cada reintento duplica el curso entero.
    const claveAlumno = (nombre: string, division?: string | null) =>
      `${nombre.trim().toLowerCase().replace(/\s+/g, ' ')}|${(division || '').trim().toLowerCase()}`;
    const yaExisten = new Set(existingUsers.map(u => claveAlumno(u.name, u.division)));

    const usersToCreate = [];
    const duplicados: string[] = [];

    for (const input of usersInput) {
      if (!input.name) continue;

      const clave = claveAlumno(input.name, input.division);
      if (yaExisten.has(clave)) {
        duplicados.push(input.name);
        continue;
      }
      yaExisten.add(clave);

      let base = generateBaseLegajo(input.name);
      let counter = 1;
      let candidateLegajo = `${base}${counter}`;
      while (legajosSet.has(candidateLegajo)) {
        counter++;
        candidateLegajo = `${base}${counter}`;
      }
      legajosSet.add(candidateLegajo);

      usersToCreate.push({
        name: input.name,
        division: input.division || null,
        role: input.role || 'ALUMNO',
        legajo: candidateLegajo,
        password: defaultPasswordHash
      });
    }

    const createdUsers = await prisma.$transaction(
      usersToCreate.map(data => prisma.user.create({ data }))
    );

    return NextResponse.json({
      message: 'Usuarios creados',
      count: createdUsers.length,
      duplicados,
      users: createdUsers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creando usuarios' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'Usuario borrado' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error borrando usuario' }, { status: 500 });
  }
}
