import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener el profesor para saber su división
    const profesor = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, division: true }
    });

    // Obtener TODOS los alumnos con su progreso, agrupados por división
    const students = await prisma.user.findMany({
      where: { role: 'ALUMNO' },
      include: {
        progress: {
          include: { text: true },
          orderBy: { updatedAt: 'desc' }
        }
      },
      orderBy: [{ division: 'asc' }, { name: 'asc' }]
    });

    // Obtener todas las divisiones únicas
    const divisions = [...new Set(students.map(s => s.division).filter(Boolean))] as string[];

    // Obtener todos los textos disponibles
    const texts = await prisma.text.findMany({
      select: { id: true, title: true, author: true, level: true, year: true },
      orderBy: { title: 'asc' }
    });

    return NextResponse.json({
      profesor: {
        name: profesor?.name || 'Profesor',
        division: profesor?.division || null,
      },
      students,
      divisions,
      texts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching dashboard' }, { status: 500 });
  }
}
