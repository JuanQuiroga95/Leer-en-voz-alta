import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profesor = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, division: true }
    });

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

    const divisions = [...new Set(students.map(s => s.division).filter(Boolean))] as string[];

    const texts = await prisma.text.findMany({
      select: { id: true, title: true, author: true, level: true, year: true },
      orderBy: { title: 'asc' }
    });

    const assignments = await prisma.textAssignment.findMany({
      include: {
        text: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      profesor: {
        name: profesor?.name || 'Profesor',
        division: profesor?.division || null,
      },
      students,
      divisions,
      texts,
      assignments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching dashboard' }, { status: 500 });
  }
}
