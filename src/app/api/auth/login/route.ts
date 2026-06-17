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
