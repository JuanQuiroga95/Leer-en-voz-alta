import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ALUMNO') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener el alumno para saber su división
    const alumno = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { division: true }
    });

    // Buscar asignaciones para este alumno (por userId o por división)
    const assignments = await prisma.textAssignment.findMany({
      where: {
        OR: [
          { userId: session.userId },
          ...(alumno?.division ? [{ division: alumno.division }] : []),
        ]
      },
      include: {
        text: {
          include: {
            challenges: true,
            progress: {
              where: { userId: session.userId }
            }
          }
        }
      }
    });

    // Separar por modo y deduplicar por textId+mode
    const seen = new Set<string>();
    const evaluacion: any[] = [];
    const practica: any[] = [];

    for (const a of assignments) {
      const key = `${a.textId}-${a.mode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const textWithMode = {
        ...a.text,
        mode: a.mode,
        assignmentId: a.id,
        // Filtrar progreso por modo
        progress: a.text.progress.filter((p: any) => p.mode === a.mode)
      };

      if (a.mode === 'EVALUACION') {
        evaluacion.push(textWithMode);
      } else {
        practica.push(textWithMode);
      }
    }

    return NextResponse.json({ evaluacion, practica });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching texts' }, { status: 500 });
  }
}
