import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { progressId } = await request.json();
    
    // Elimar el progreso
    await prisma.readingProgress.delete({
      where: { id: progressId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error resetting progress' }, { status: 500 });
  }
}
