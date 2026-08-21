import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { anioDeDivision } from '@/lib/colecciones';
import {
  armarReporteAlumno,
  redactarInforme,
  nivelPorPpm,
  objetivoDelAnio,
  armarCsv,
  fechaCorta,
  type LecturaResumen,
} from '@/lib/reportes';

/**
 * Reportes para el profesor: de un alumno, de un curso o de toda la escuela.
 *
 * `formato=csv` devuelve una planilla descargable; sin eso devuelve JSON, que es
 * lo que usa la pantalla del informe imprimible.
 *
 * El de un alumno incluye además el texto redactado para mandarle a la familia.
 */

export const maxDuration = 60;

interface ProgresoConTexto {
  updatedAt: Date;
  mode: string;
  score: number;
  grade: number | null;
  aiScore: number | null;
  aiAnalysis: unknown;
  text: { title: string } | null;
}

/** Saca las métricas del análisis de la IA, que se guarda como JSON suelto. */
function metricas(p: ProgresoConTexto): { ppm: number | null; prosodia: number | null } {
  const a = (p.aiAnalysis || {}) as { ppm?: unknown; prosody?: unknown };
  return {
    ppm: typeof a.ppm === 'number' && a.ppm > 0 ? a.ppm : null,
    prosodia: typeof a.prosody === 'number' && a.prosody > 0 ? a.prosody : null,
  };
}

function aLectura(p: ProgresoConTexto): LecturaResumen {
  const m = metricas(p);
  return {
    fecha: p.updatedAt,
    titulo: p.text?.title || 'Texto eliminado',
    modo: p.mode,
    ppm: m.ppm,
    score: typeof p.aiScore === 'number' ? p.aiScore : (typeof p.score === 'number' ? p.score : null),
    prosodia: m.prosodia,
    nota: p.grade,
  };
}

const incluirTexto = { text: { select: { title: true } } };

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'PROFESOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'general';
  const userId = searchParams.get('userId');
  const division = searchParams.get('division');
  const formato = searchParams.get('formato');
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  const rango = {
    ...(desde ? { gte: new Date(desde) } : {}),
    ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
  };
  const filtroFecha = Object.keys(rango).length ? { updatedAt: rango } : {};

  try {
    // ─────────── Reporte de un alumno ───────────
    if (tipo === 'alumno') {
      if (!userId) return NextResponse.json({ error: 'Falta el alumno.' }, { status: 400 });

      const alumno = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, legajo: true, division: true },
      });
      if (!alumno) return NextResponse.json({ error: 'No se encontró ese alumno.' }, { status: 404 });

      const progresos = await prisma.readingProgress.findMany({
        where: { userId, ...filtroFecha },
        include: incluirTexto,
        orderBy: { updatedAt: 'asc' },
      });

      const anio = anioDeDivision(alumno.division);
      const reporte = armarReporteAlumno(progresos.map(aLectura), anio);
      const informe = redactarInforme(alumno.name, reporte, anio);

      const ingresos = await prisma.loginEvent.count({ where: { userId } });
      const ultimoIngreso = await prisma.loginEvent.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (formato === 'csv') {
        const csv = armarCsv(
          ['Fecha', 'Texto', 'Modo', 'PPM', 'Comprensión', 'Prosodia', 'Nota del profe'],
          reporte.detalle.map(l => [fechaCorta(l.fecha), l.titulo, l.modo, l.ppm, l.score, l.prosodia, l.nota])
        );
        return respuestaCsv(csv, `reporte-${alumno.name.replace(/\s+/g, '-').toLowerCase()}`);
      }

      return NextResponse.json({
        tipo, alumno, anio, reporte, informe,
        ingresos: { total: ingresos, ultimo: ultimoIngreso?.createdAt || null },
      });
    }

    // ─────────── Reporte de un curso o general ───────────
    const filtroAlumnos = tipo === 'curso' && division
      ? { role: 'ALUMNO' as const, division }
      : { role: 'ALUMNO' as const };

    if (tipo === 'curso' && !division) {
      return NextResponse.json({ error: 'Falta el curso.' }, { status: 400 });
    }

    const alumnos = await prisma.user.findMany({
      where: filtroAlumnos,
      select: {
        id: true, name: true, legajo: true, division: true,
        progress: { where: filtroFecha, include: incluirTexto, orderBy: { updatedAt: 'asc' } },
        _count: { select: { logins: true } },
      },
      orderBy: [{ division: 'asc' }, { name: 'asc' }],
    });

    const filas = alumnos.map(a => {
      const anio = anioDeDivision(a.division);
      const r = armarReporteAlumno(a.progress.map(aLectura), anio);
      return {
        id: a.id,
        nombre: a.name,
        legajo: a.legajo,
        division: a.division,
        anio,
        lecturas: r.lecturas,
        evaluaciones: r.evaluaciones,
        ppmPromedio: r.ppmPromedio,
        ppmUltima: r.ppmUltima,
        comprensionPromedio: r.comprensionPromedio,
        nivel: r.nivel,
        tendencia: r.tendencia,
        objetivo: r.objetivo,
        ingresos: a._count.logins,
      };
    });

    if (formato === 'csv') {
      const csv = armarCsv(
        ['Alumno', 'Legajo', 'Curso', 'Lecturas', 'Evaluaciones', 'PPM promedio', 'PPM última', 'Objetivo del año', 'Comprensión', 'Nivel', 'Evolución', 'Ingresos'],
        filas.map(f => [
          f.nombre, f.legajo, f.division, f.lecturas, f.evaluaciones,
          f.ppmPromedio, f.ppmUltima, f.objetivo.critico, f.comprensionPromedio,
          f.nivel, f.tendencia, f.ingresos,
        ])
      );
      return respuestaCsv(csv, tipo === 'curso' ? `reporte-${division!.replace(/[°\s]/g, '')}` : 'reporte-general');
    }

    // Resumen del grupo. Solo cuenta a quienes tienen lecturas: incluir a los que
    // no leyeron hundiría el promedio y daría una imagen falsa del curso.
    const conDatos = filas.filter(f => f.ppmPromedio !== null);
    const resumen = {
      alumnos: filas.length,
      conLecturas: conDatos.length,
      sinLecturas: filas.length - conDatos.length,
      totalLecturas: filas.reduce((a, f) => a + f.lecturas, 0),
      ppmPromedio: conDatos.length
        ? Math.round(conDatos.reduce((a, f) => a + (f.ppmPromedio || 0), 0) / conDatos.length)
        : null,
      porNivel: {
        Crítico: conDatos.filter(f => f.nivel === 'Crítico').length,
        Medio: conDatos.filter(f => f.nivel === 'Medio').length,
        Avanzado: conDatos.filter(f => f.nivel === 'Avanzado').length,
      },
    };

    return NextResponse.json({ tipo, division: division || null, resumen, filas });
  } catch (error: any) {
    console.error('Error armando el reporte:', error);
    return NextResponse.json({ error: error?.message || 'Error al armar el reporte' }, { status: 500 });
  }
}

function respuestaCsv(csv: string, nombre: string) {
  // El BOM es lo que hace que Excel abra los acentos bien en español.
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

export { nivelPorPpm, objetivoDelAnio };
