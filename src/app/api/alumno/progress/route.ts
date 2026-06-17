import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ALUMNO') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { textId, aiScore, aiAnalysis, challengesScore } = await request.json();
    const finalScore = aiScore + challengesScore; // Por ejemplo, suma de IA y Retos

    const progress = await prisma.readingProgress.create({
      data: {
        userId: session.userId,
        textId: textId,
        status: 'COMPLETADO',
        score: finalScore,
        aiScore: aiScore,
        aiAnalysis: aiAnalysis,
      }
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error saving progress' }, { status: 500 });
  }
}
