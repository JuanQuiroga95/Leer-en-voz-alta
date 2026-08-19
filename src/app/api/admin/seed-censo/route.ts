import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { textosCenso2023, divisionesDelAnio, type TextoSeed } from '@/lib/censo2023';
import { textosVidela } from '@/lib/textosVidela';

/**
 * Carga colecciones de textos desde el Panel de Administracion.
 *
 * Existe como endpoint y no solo como script de terminal porque DATABASE_URL esta
 * marcada como "sensitive" en Vercel: nadie puede leer su valor, pero el codigo que
 * corre en Vercel si la tiene. Asi se cargan los textos sin manipular la credencial.
 *
 * Es idempotente: no duplica textos ni asignaciones si se ejecuta varias veces.
 */

export const maxDuration = 60;

const colecciones: Record<string, { nombre: string; textos: TextoSeed[] }> = {
  censo2023: { nombre: 'Censo de Fluidez Lectora 2023', textos: textosCenso2023 },
  videla: { nombre: 'Fluidez Lectora Videla', textos: textosVidela },
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Sin body se carga la coleccion del censo (comportamiento original).
  const body = await request.json().catch(() => ({}));
  const clave = body?.set || 'censo2023';
  const coleccion = colecciones[clave];

  if (!coleccion) {
    return NextResponse.json({ error: `Colección desconocida: ${clave}` }, { status: 400 });
  }

  try {
    const creados: string[] = [];
    const yaExistian: string[] = [];
    let asignacionesNuevas = 0;

    for (const texto of coleccion.textos) {
      let registro = await prisma.text.findFirst({ where: { title: texto.title } });

      if (registro) {
        yaExistian.push(texto.title);
      } else {
        registro = await prisma.text.create({
          data: {
            title: texto.title,
            author: texto.author,
            level: texto.level,
            year: texto.year,
            content: texto.content,
            challenges: {
              create: texto.challenges.map(c => ({
                question: c.question,
                options: JSON.stringify(c.options),
                correctIdx: c.correctIdx,
              })),
            },
          },
        });
        creados.push(`${texto.year}° ${texto.title}`);
      }

      // Disponible como practica en todas las divisiones del año que corresponde.
      for (const division of divisionesDelAnio(texto.year)) {
        const yaAsignado = await prisma.textAssignment.findFirst({
          where: { textId: registro.id, mode: 'PRACTICA', division, userId: null },
        });
        if (yaAsignado) continue;

        await prisma.textAssignment.create({
          data: { textId: registro.id, mode: 'PRACTICA', division },
        });
        asignacionesNuevas++;
      }
    }

    return NextResponse.json({
      ok: true,
      coleccion: coleccion.nombre,
      creados,
      yaExistian,
      asignacionesNuevas,
      mensaje: creados.length
        ? `${coleccion.nombre}: se cargaron ${creados.length} textos y ${asignacionesNuevas} asignaciones de práctica.`
        : `${coleccion.nombre}: los ${yaExistian.length} textos ya estaban cargados. Se agregaron ${asignacionesNuevas} asignaciones nuevas.`,
    });
  } catch (error: any) {
    console.error('Error cargando textos:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al cargar los textos' },
      { status: 500 }
    );
  }
}
