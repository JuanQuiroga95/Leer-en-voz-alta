import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        legajo: true,
        name: true,
        role: true,
        division: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ users });
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
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const existingUsers = await prisma.user.findMany({ select: { legajo: true } });
    const legajosSet = new Set(existingUsers.map(u => u.legajo));

    const usersToCreate = [];

    for (const input of usersInput) {
      if (!input.name) continue;

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

    return NextResponse.json({ message: 'Usuarios creados', count: createdUsers.length, users: createdUsers });
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
