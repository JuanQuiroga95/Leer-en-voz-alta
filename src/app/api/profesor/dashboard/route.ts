import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const students = await prisma.user.findMany({
      where: { role: 'ALUMNO', division: '2° B' }, // Asumiendo que el profe tiene 2°B
      include: {
        progress: {
          include: {
            text: true
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
    
    return NextResponse.json({ students });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching dashboard' }, { status: 500 });
  }
}
