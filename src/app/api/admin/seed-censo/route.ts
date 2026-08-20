import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { buscarColeccion, COLECCIONES } from '@/lib/colecciones';

/**
 * Carga colecciones de textos desde el Panel de Administración.
 *
 * Existe como endpoint y no solo como script de terminal porque DATABASE_URL está
 * marcada como "sensitive" en Vercel: nadie puede leer su valor, pero el código que
 * corre en Vercel sí la tiene. Así se cargan los textos sin manipular la credencial.
 *
 * Es idempotente: no duplica textos si se ejecuta varias veces. Tampoco crea
 * asignaciones: desde que los textos de práctica se muestran por año (ver
 * `src/app/api/alumno/texts`), alcanza con que el texto exista y tenga su año.
 */

export const maxDuration = 60;

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Cuántos textos de cada colección ya están cargados, para mostrarlo en el panel.
  const cargados = await prisma.text.findMany({ select: { title: true } });
  const titulos = new Set(cargados.map(t => t.title));

  return NextResponse.json({
    colecciones: COLECCIONES.map(c => ({
      clave: c.clave,
      nombre: c.nombre,
      descripcion: c.descripcion,
      total: c.textos.length,
      yaCargados: c.textos.filter(t => titulos.has(t.title)).length,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const coleccion = buscarColeccion(body?.set || 'censo2026');

  if (!coleccion) {
    return NextResponse.json({ error: `Colección desconocida: ${body?.set}` }, { status: 400 });
  }

  try {
    const creados: string[] = [];
    const yaExistian: string[] = [];

    for (const texto of coleccion.textos) {
      const registro = await prisma.text.findFirst({ where: { title: texto.title } });

      if (registro) {
        // Ya estaba: refrescamos año y dificultad por si cambiaron en el código.
        if (registro.year !== texto.year || registro.level !== texto.level) {
          await prisma.text.update({
            where: { id: registro.id },
            data: { year: texto.year, level: texto.level },
          });
        }
        yaExistian.push(texto.title);
        continue;
      }

      await prisma.text.create({
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

    return NextResponse.json({
      ok: true,
      coleccion: coleccion.nombre,
      creados,
      yaExistian,
      mensaje: creados.length
        ? `${coleccion.nombre}: se cargaron ${creados.length} textos. Ya están disponibles en la pestaña Práctica del año que corresponde.`
        : `${coleccion.nombre}: los ${yaExistian.length} textos ya estaban cargados.`,
    });
  } catch (error: any) {
    console.error('Error cargando textos:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al cargar los textos' },
      { status: 500 }
    );
  }
}
