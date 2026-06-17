import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Todos los progresos completados con info del usuario
    const progresses = await prisma.readingProgress.findMany({
      where: { status: 'COMPLETADO' },
      include: { user: true },
      orderBy: { updatedAt: 'asc' }
    });

    // 1. Textos completados por División
    const divMap: Record<string, number> = {};
    progresses.forEach(p => {
      const div = p.user.division || 'Sin División';
      divMap[div] = (divMap[div] || 0) + 1;
    });
    const readingsByDivision = Object.keys(divMap).map(k => ({
      name: k,
      completados: divMap[k]
    }));

    // 2. Historial de Promedios por Día
    const dateMap: Record<string, { sum: number; count: number }> = {};
    progresses.forEach(p => {
      const dateStr = p.updatedAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { sum: 0, count: 0 };
      }
      dateMap[dateStr].sum += (p.score || 0);
      dateMap[dateStr].count += 1;
    });
    
    const scoreHistory = Object.keys(dateMap).map(k => ({
      date: k,
      promedio: Math.round(dateMap[k].sum / dateMap[k].count)
    }));

    // Datos extra
    const avgPlatformScore = progresses.length > 0 
      ? Math.round(progresses.reduce((acc, p) => acc + (p.score || 0), 0) / progresses.length)
      : 0;

    return NextResponse.json({
      readingsByDivision,
      scoreHistory,
      avgPlatformScore,
      totalReadings: progresses.length
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
