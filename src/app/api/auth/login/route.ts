import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { legajo, password } = await request.json();

    if (!legajo || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { legajo }
    });

    if (!user) {
      return NextResponse.json({ error: 'Legajo o contraseña incorrectos' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ error: 'Legajo o contraseña incorrectos' }, { status: 401 });
    }

    await createSession(user.id, user.legajo, user.role);

    // Queda registrado para que el profesor pueda ver quién entró y cuándo.
    // Si esto falla no se corta el login: un problema al registrar la visita
    // nunca puede dejar a un alumno afuera de la clase.
    try {
      await prisma.loginEvent.create({
        data: { userId: user.id, division: user.division, role: user.role },
      });
    } catch (e) {
      console.error('No se pudo registrar el ingreso:', e);
    }

    return NextResponse.json({
      success: true, 
      role: user.role,
      redirect: user.role === 'ADMIN' ? '/admin' : user.role === 'PROFESOR' ? '/profesor' : '/alumno'
    });

  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
