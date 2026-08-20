import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * Borrado de datos desde el Panel de Administración.
 *
 * Pensado para dejar el sistema en cero antes de empezar a usarlo de verdad, y
 * para corregir cargas de prueba sin tener que tocar la base de datos a mano.
 *
 * Dos recaudos, porque esto no se puede deshacer:
 *
 * 1. SIEMPRE se puede simular primero (`simular: true`): devuelve exactamente
 *    cuántos registros se verían afectados, sin tocar nada. El panel obliga a
 *    pasar por ahí antes de habilitar el botón de borrar.
 * 2. Los alcances que afectan a varias personas (un curso entero o todo el
 *    sistema) exigen escribir una palabra de confirmación. Un clic de más no
 *    alcanza para vaciar la escuela.
 *
 * No borra usuarios: eso se hace de a uno en la tabla de abajo del panel, para
 * que nunca sea el efecto secundario de un borrado de datos.
 */

// Borrar muchos audios de Vercel Blob puede tardar; damos margen.
export const maxDuration = 120;

/** Qué se puede borrar. El panel arma las opciones a partir de esto. */
export const TIPOS_DE_DATO = [
  {
    clave: 'lecturas',
    nombre: 'Lecturas',
    detalle: 'Borra las lecturas completas: nota, audio, análisis y devolución. Es lo que deja las estadísticas en cero.',
    destructivo: true,
  },
  {
    clave: 'audios',
    nombre: 'Solo los audios',
    detalle: 'Borra las grabaciones pero conserva la lectura, la nota y el análisis. Sirve para liberar espacio sin perder resultados.',
    destructivo: false,
  },
  {
    clave: 'analisisIA',
    nombre: 'Solo el análisis de la IA',
    detalle: 'Borra el puntaje y el detalle que generó la IA. La lectura y la devolución del profe quedan.',
    destructivo: false,
  },
  {
    clave: 'devoluciones',
    nombre: 'Solo las devoluciones del profe',
    detalle: 'Borra el comentario y la nota que puso el profesor. La lectura queda.',
    destructivo: false,
  },
  {
    clave: 'trofeos',
    nombre: 'Trofeos',
    detalle: 'Borra los trofeos ganados.',
    destructivo: true,
  },
  {
    clave: 'asignaciones',
    nombre: 'Asignaciones',
    detalle: 'Borra las asignaciones hechas por el profesor. Los textos de práctica del año siguen apareciendo solos.',
    destructivo: true,
  },
] as const;

type ClaveTipo = (typeof TIPOS_DE_DATO)[number]['clave'];
const CLAVES = new Set<string>(TIPOS_DE_DATO.map(t => t.clave));

/** Palabra que hay que escribir para los alcances que afectan a varias personas. */
export const PALABRA_CONFIRMACION = 'BORRAR';

interface Cuerpo {
  alcance?: 'global' | 'division' | 'alumno';
  division?: string;
  userId?: string;
  tipos?: string[];
  /** Para las lecturas: todas, o solo las de un modo. */
  modo?: 'TODAS' | 'EVALUACION' | 'PRACTICA';
  simular?: boolean;
  confirmacion?: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const cuerpo: Cuerpo = await request.json().catch(() => ({}));
  const { alcance, division, userId, modo = 'TODAS', simular = true } = cuerpo;
  const tipos = (cuerpo.tipos || []).filter(t => CLAVES.has(t)) as ClaveTipo[];

  if (!alcance || !['global', 'division', 'alumno'].includes(alcance)) {
    return NextResponse.json({ error: 'Falta indicar el alcance.' }, { status: 400 });
  }
  if (alcance === 'division' && !division) {
    return NextResponse.json({ error: 'Falta indicar el curso.' }, { status: 400 });
  }
  if (alcance === 'alumno' && !userId) {
    return NextResponse.json({ error: 'Falta indicar el alumno.' }, { status: 400 });
  }
  if (tipos.length === 0) {
    return NextResponse.json({ error: 'Elegí al menos un tipo de dato para borrar.' }, { status: 400 });
  }

  // Los alcances que tocan a varias personas exigen escribir la palabra.
  const necesitaPalabra = alcance !== 'alumno';
  if (!simular && necesitaPalabra && cuerpo.confirmacion !== PALABRA_CONFIRMACION) {
    return NextResponse.json(
      { error: `Para este alcance hay que escribir "${PALABRA_CONFIRMACION}" para confirmar.` },
      { status: 400 }
    );
  }

  try {
    // A quiénes alcanza. En global es null: no se filtra por usuario.
    let usuarios: { id: string; name: string }[] | null = null;
    if (alcance === 'division') {
      usuarios = await prisma.user.findMany({
        where: { division, role: 'ALUMNO' },
        select: { id: true, name: true },
      });
    } else if (alcance === 'alumno') {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
      if (!u) return NextResponse.json({ error: 'No se encontró ese alumno.' }, { status: 404 });
      usuarios = [u];
    }

    const ids = usuarios?.map(u => u.id) ?? null;
    // Un curso sin alumnos no debe convertirse en "borrar todo".
    const filtroUsuario: Prisma.ReadingProgressWhereInput = ids ? { userId: { in: ids } } : {};
    const hayAQuienBorrar = ids === null || ids.length > 0;

    const filtroLecturas: Prisma.ReadingProgressWhereInput = {
      ...filtroUsuario,
      ...(modo !== 'TODAS' ? { mode: modo } : {}),
    };

    const resumen: Record<string, number> = {};

    if (!hayAQuienBorrar) {
      for (const t of tipos) resumen[t] = 0;
      return NextResponse.json({
        simulado: simular,
        alcance,
        alumnos: 0,
        resumen,
        mensaje: 'Ese curso no tiene alumnos cargados: no hay nada para borrar.',
      });
    }

    // ---- Conteo (sirve para la simulación y para el informe final) ----
    if (tipos.includes('lecturas')) {
      resumen.lecturas = await prisma.readingProgress.count({ where: filtroLecturas });
    }
    if (tipos.includes('audios')) {
      resumen.audios = await prisma.readingProgress.count({
        where: { ...filtroLecturas, audioUrl: { not: null } },
      });
    }
    if (tipos.includes('analisisIA')) {
      resumen.analisisIA = await prisma.readingProgress.count({
        where: { ...filtroLecturas, NOT: { aiAnalysis: { equals: Prisma.DbNull } } },
      });
    }
    if (tipos.includes('devoluciones')) {
      resumen.devoluciones = await prisma.readingProgress.count({
        where: { ...filtroLecturas, OR: [{ feedback: { not: null } }, { grade: { not: null } }] },
      });
    }
    if (tipos.includes('trofeos')) {
      resumen.trofeos = await prisma.trophy.count({ where: ids ? { userId: { in: ids } } : {} });
    }
    if (tipos.includes('asignaciones')) {
      resumen.asignaciones = await prisma.textAssignment.count({
        where: ids ? { OR: [{ userId: { in: ids } }, ...(division ? [{ division }] : [])] } : {},
      });
    }

    if (simular) {
      return NextResponse.json({
        simulado: true,
        alcance,
        alumnos: usuarios?.length ?? null,
        resumen,
      });
    }

    // ---- Borrado real ----

    // Los audios se borran de Vercel Blob ANTES que las filas: después de borrar
    // la fila ya no sabríamos qué archivo corresponde y quedaría ocupando espacio.
    let audiosBorrados = 0;
    if (tipos.includes('lecturas') || tipos.includes('audios')) {
      audiosBorrados = await borrarAudios(filtroLecturas);
    }

    if (tipos.includes('lecturas')) {
      const r = await prisma.readingProgress.deleteMany({ where: filtroLecturas });
      resumen.lecturas = r.count;
    } else {
      // Las siguientes solo tienen sentido si la lectura no se borró entera.
      if (tipos.includes('audios')) {
        const r = await prisma.readingProgress.updateMany({
          where: { ...filtroLecturas, audioUrl: { not: null } },
          data: { audioUrl: null },
        });
        resumen.audios = r.count;
      }
      if (tipos.includes('analisisIA')) {
        const r = await prisma.readingProgress.updateMany({
          where: filtroLecturas,
          data: { aiScore: null, aiAnalysis: Prisma.DbNull },
        });
        resumen.analisisIA = r.count;
      }
      if (tipos.includes('devoluciones')) {
        const r = await prisma.readingProgress.updateMany({
          where: filtroLecturas,
          data: { feedback: null, grade: null },
        });
        resumen.devoluciones = r.count;
      }
    }

    if (tipos.includes('trofeos')) {
      const r = await prisma.trophy.deleteMany({ where: ids ? { userId: { in: ids } } : {} });
      resumen.trofeos = r.count;
    }
    if (tipos.includes('asignaciones')) {
      const r = await prisma.textAssignment.deleteMany({
        where: ids ? { OR: [{ userId: { in: ids } }, ...(division ? [{ division }] : [])] } : {},
      });
      resumen.asignaciones = r.count;
    }

    console.log(
      `Borrado por ${session.userId}: alcance=${alcance} ${division || userId || ''} ` +
      `tipos=${tipos.join(',')} modo=${modo} => ${JSON.stringify(resumen)}`
    );

    return NextResponse.json({
      simulado: false,
      alcance,
      alumnos: usuarios?.length ?? null,
      resumen,
      audiosBorrados,
    });
  } catch (error: any) {
    console.error('Error al borrar datos:', error);
    return NextResponse.json({ error: error?.message || 'Error al borrar los datos' }, { status: 500 });
  }
}

/**
 * Borra de Vercel Blob los audios que coincidan con el filtro.
 *
 * Si esto falla no se corta el borrado: es preferible dejar algún archivo
 * huérfano ocupando espacio antes que dejar los datos a medio borrar, que es
 * mucho más confuso de arreglar después.
 */
async function borrarAudios(filtro: Prisma.ReadingProgressWhereInput): Promise<number> {
  const conAudio = await prisma.readingProgress.findMany({
    where: { ...filtro, audioUrl: { not: null } },
    select: { audioUrl: true },
  });

  const urls = conAudio.map(p => p.audioUrl).filter((u): u is string => !!u);
  if (urls.length === 0) return 0;

  try {
    const { del } = await import('@vercel/blob');
    // De a tandas: una sola llamada con cientos de URLs suele pasarse de tiempo.
    const TANDA = 100;
    for (let i = 0; i < urls.length; i += TANDA) {
      await del(urls.slice(i, i + TANDA));
    }
    return urls.length;
  } catch (e) {
    console.error('No se pudieron borrar algunos audios de Vercel Blob:', e);
    return 0;
  }
}

/** El panel usa esto para armar las opciones sin duplicar la lista. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const divisiones = await prisma.user.findMany({
    where: { role: 'ALUMNO', division: { not: null } },
    select: { division: true },
    distinct: ['division'],
    orderBy: { division: 'asc' },
  });

  const alumnos = await prisma.user.findMany({
    where: { role: 'ALUMNO' },
    select: { id: true, name: true, division: true },
    orderBy: [{ division: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({
    tipos: TIPOS_DE_DATO,
    palabraConfirmacion: PALABRA_CONFIRMACION,
    divisiones: divisiones.map(d => d.division).filter(Boolean),
    alumnos,
  });
}
