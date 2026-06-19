import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { progressId, feedback, grade } = await request.json();

    if (!progressId) {
      return NextResponse.json({ error: 'Falta progressId' }, { status: 400 });
    }

    const updateData: any = {};
    if (feedback !== undefined) updateData.feedback = feedback;
    if (grade !== undefined) updateData.grade = parseInt(grade, 10);

    await prisma.readingProgress.update({
      where: { id: progressId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving teacher feedback:', error);
    return NextResponse.json({ error: 'Error al guardar la devolución' }, { status: 500 });
  }
}
