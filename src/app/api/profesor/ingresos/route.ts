import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { armarCsv, fechaCorta } from '@/lib/reportes';

/**
 * Registro de ingresos a la plataforma, para que el profesor tenga control de
 * quiénes están entrando.
 *
 * Se puede ver por curso o de un alumno en particular. Muestra cuántas veces
 * entró cada uno, cuándo fue la última vez y hace cuántos días, que es el dato
 * que sirve para detectar a alguien que dejó de entrar.
 *
 * Solo se registran ingresos desde que existe esta función: los alumnos que
 * venían usando la plataforma antes aparecen en cero hasta que vuelvan a entrar.
 */

export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'PROFESOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const userId = searchParams.get('userId');
  const formato = searchParams.get('formato');
  const dias = Math.min(Number(searchParams.get('dias')) || 30, 365);
  const desde = new Date(Date.now() - dias * DIA_MS);

  try {
    // ─────────── Historial de un alumno ───────────
    if (userId) {
      const alumno = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, legajo: true, division: true },
      });
      if (!alumno) return NextResponse.json({ error: 'No se encontró ese alumno.' }, { status: 404 });

      const eventos = await prisma.loginEvent.findMany({
        where: { userId, createdAt: { gte: desde } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, division: true },
        take: 500,
      });

      if (formato === 'csv') {
        const csv = armarCsv(
          ['Fecha', 'Hora', 'Curso en ese momento'],
          eventos.map(e => [
            fechaCorta(e.createdAt),
            e.createdAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            e.division || '',
          ])
        );
        return respuestaCsv(csv, `ingresos-${alumno.name.replace(/\s+/g, '-').toLowerCase()}`);
      }

      return NextResponse.json({ alumno, dias, eventos, total: eventos.length });
    }

    // ─────────── Resumen por curso ───────────
    const alumnos = await prisma.user.findMany({
      where: { role: 'ALUMNO', ...(division ? { division } : {}) },
      select: { id: true, name: true, legajo: true, division: true },
      orderBy: [{ division: 'asc' }, { name: 'asc' }],
    });

    const ids = alumnos.map(a => a.id);

    // Dos consultas agrupadas en vez de una por alumno: con un curso entero,
    // consultar de a uno hace decenas de viajes a la base.
    const enRango = ids.length
      ? await prisma.loginEvent.groupBy({
          by: ['userId'],
          where: { userId: { in: ids }, createdAt: { gte: desde } },
          _count: { _all: true },
          _max: { createdAt: true },
        })
      : [];

    const historico = ids.length
      ? await prisma.loginEvent.groupBy({
          by: ['userId'],
          where: { userId: { in: ids } },
          _count: { _all: true },
          _max: { createdAt: true },
        })
      : [];

    const porUsuarioRango = new Map(enRango.map(g => [g.userId, g]));
    const porUsuarioTotal = new Map(historico.map(g => [g.userId, g]));
    const ahora = Date.now();

    const filas = alumnos.map(a => {
      const r = porUsuarioRango.get(a.id);
      const t = porUsuarioTotal.get(a.id);
      const ultimo = t?._max.createdAt || null;
      return {
        id: a.id,
        nombre: a.name,
        legajo: a.legajo,
        division: a.division,
        ingresosEnRango: r?._count._all || 0,
        ingresosTotales: t?._count._all || 0,
        ultimoIngreso: ultimo,
        diasSinEntrar: ultimo ? Math.floor((ahora - ultimo.getTime()) / DIA_MS) : null,
      };
    });

    if (formato === 'csv') {
      const csv = armarCsv(
        ['Alumno', 'Legajo', 'Curso', `Ingresos (${dias} días)`, 'Ingresos totales', 'Último ingreso', 'Días sin entrar'],
        filas.map(f => [
          f.nombre, f.legajo, f.division, f.ingresosEnRango, f.ingresosTotales,
          f.ultimoIngreso ? fechaCorta(f.ultimoIngreso) : 'Nunca',
          f.diasSinEntrar ?? '',
        ])
      );
      return respuestaCsv(csv, division ? `ingresos-${division.replace(/[°\s]/g, '')}` : 'ingresos-general');
    }

    return NextResponse.json({
      division: division || null,
      dias,
      resumen: {
        alumnos: filas.length,
        entraronEnRango: filas.filter(f => f.ingresosEnRango > 0).length,
        nuncaEntraron: filas.filter(f => f.ingresosTotales === 0).length,
      },
      filas,
    });
  } catch (error: any) {
    // P2021 = la tabla no existe todavia. Pasa si el deploy no pudo sincronizar
    // el esquema; conviene decirlo con claridad y no como un error generico.
    if (error?.code === 'P2021') {
      return NextResponse.json({
        error: 'El registro de ingresos todavía no está disponible: falta crear la tabla en la base de datos. Se crea sola en el próximo despliegue.',
        faltaTabla: true,
      }, { status: 503 });
    }
    console.error('Error armando el registro de ingresos:', error);
    return NextResponse.json({ error: error?.message || 'Error al leer los ingresos' }, { status: 500 });
  }
}

function respuestaCsv(csv: string, nombre: string) {
  // El BOM es lo que hace que Excel abra los acentos bien en español.
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
