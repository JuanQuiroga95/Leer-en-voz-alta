import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ALUMNO') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { progressId } = await request.json();

    // Verificar que el progreso pertenece al alumno y es de práctica
    const progress = await prisma.readingProgress.findUnique({
      where: { id: progressId }
    });

    if (!progress) {
      return NextResponse.json({ error: 'Progreso no encontrado' }, { status: 404 });
    }

    if (progress.userId !== session.userId) {
      return NextResponse.json({ error: 'No podés reiniciar el progreso de otro alumno' }, { status: 403 });
    }

    if (progress.mode !== 'PRACTICA') {
      return NextResponse.json({ error: 'Solo podés reiniciar lecturas de práctica' }, { status: 403 });
    }

    await prisma.readingProgress.delete({
      where: { id: progressId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error resetting practice' }, { status: 500 });
  }
}
