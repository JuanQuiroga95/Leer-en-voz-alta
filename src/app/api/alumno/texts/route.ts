import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { anioDeDivision, normalizarDificultad } from '@/lib/colecciones';

/**
 * Textos que ve un alumno, separados en Práctica y Evaluación.
 *
 * PRÁCTICA: todos los textos del año del alumno, sin que nadie tenga que
 * asignarlos. Un alumno nuevo de 1° ve los textos de 1° apenas entra. Se suman
 * los textos que el profesor le haya asignado a mano como práctica, aunque sean
 * de otro año (por ejemplo, uno más fácil para alguien que necesita reforzar).
 *
 * EVALUACIÓN: solo lo que el profesor asigna explícitamente. Estas afectan las
 * estadísticas y solo el profesor puede reiniciarlas, así que nunca son automáticas.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ALUMNO') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alumno = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { division: true },
    });

    const anio = anioDeDivision(alumno?.division);

    const assignments = await prisma.textAssignment.findMany({
      where: {
        OR: [
          { userId: session.userId },
          ...(alumno?.division ? [{ division: alumno.division }] : []),
        ],
      },
      include: {
        text: {
          include: {
            challenges: true,
            progress: { where: { userId: session.userId } },
          },
        },
      },
    });

    // Textos del año del alumno: la base de la pestaña Práctica.
    const textosDelAnio = anio
      ? await prisma.text.findMany({
          where: { year: anio },
          include: {
            challenges: true,
            progress: { where: { userId: session.userId } },
          },
          orderBy: [{ level: 'asc' }, { title: 'asc' }],
        })
      : [];

    type TextoConModo = (typeof textosDelAnio)[number] & {
      mode: string;
      assignmentId: string | null;
      dificultad: string;
    };

    const evaluacion: TextoConModo[] = [];
    const practica: TextoConModo[] = [];
    const vistos = new Set<string>();

    const agregar = (
      texto: (typeof textosDelAnio)[number],
      mode: string,
      assignmentId: string | null
    ) => {
      const clave = `${texto.id}-${mode}`;
      if (vistos.has(clave)) return;
      vistos.add(clave);

      const entrada: TextoConModo = {
        ...texto,
        mode,
        assignmentId,
        dificultad: normalizarDificultad(texto.level),
        progress: texto.progress.filter(p => p.mode === mode),
      };

      if (mode === 'EVALUACION') evaluacion.push(entrada);
      else practica.push(entrada);
    };

    // Las asignaciones explícitas van primero: si el profesor asignó un texto,
    // queremos conservar su assignmentId y no la versión automática.
    for (const a of assignments) agregar(a.text, a.mode, a.id);
    for (const t of textosDelAnio) agregar(t, 'PRACTICA', null);

    return NextResponse.json({ evaluacion, practica, alumno: { ...alumno, anio } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching texts' }, { status: 500 });
  }
}
