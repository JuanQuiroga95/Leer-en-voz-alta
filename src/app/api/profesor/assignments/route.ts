import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Obtener todas las asignaciones
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'PROFESOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const assignments = await prisma.textAssignment.findMany({
      include: {
        text: { select: { id: true, title: true, author: true, level: true, year: true } },
        user: { select: { id: true, name: true, legajo: true, division: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const texts = await prisma.text.findMany({
      select: { id: true, title: true, author: true, level: true, year: true },
      orderBy: { title: 'asc' }
    });

    const students = await prisma.user.findMany({
      where: { role: 'ALUMNO' },
      select: { id: true, name: true, legajo: true, division: true },
      orderBy: [{ division: 'asc' }, { name: 'asc' }]
    });

    // Divisiones reales de la escuela
    const divisions = getDivisiones();

    return NextResponse.json({ assignments, texts, students, divisions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching assignments' }, { status: 500 });
  }
}

// POST: Crear una nueva asignación
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'PROFESOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { textId, mode, targetType, division, userId } = await request.json();
    // targetType: "division" o "student"

    if (!textId || !mode || !targetType) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    if (!['EVALUACION', 'PRACTICA'].includes(mode)) {
      return NextResponse.json({ error: 'Modo inválido' }, { status: 400 });
    }

    if (targetType === 'division' && !division) {
      return NextResponse.json({ error: 'Falta la división' }, { status: 400 });
    }

    if (targetType === 'student' && !userId) {
      return NextResponse.json({ error: 'Falta el alumno' }, { status: 400 });
    }

    // Verificar que no exista ya la misma asignación
    const existing = await prisma.textAssignment.findFirst({
      where: {
        textId,
        mode,
        ...(targetType === 'division' ? { division } : { userId }),
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Este texto ya está asignado con ese modo al destino seleccionado' }, { status: 409 });
    }

    const assignment = await prisma.textAssignment.create({
      data: {
        textId,
        mode,
        ...(targetType === 'division' ? { division } : { userId }),
      }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating assignment' }, { status: 500 });
  }
}

// DELETE: Eliminar una asignación
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'PROFESOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la asignación' }, { status: 400 });
    }

    await prisma.textAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting assignment' }, { status: 500 });
  }
}

function getDivisiones(): string[] {
  const divs: string[] = [];
  // 1° a 3°: 5 divisiones
  for (const año of [1, 2, 3]) {
    for (const div of ['1ra', '2da', '3ra', '4ta', '5ta']) {
      divs.push(`${año}° ${div}`);
    }
  }
  // 4° y 5°: 4 divisiones
  for (const año of [4, 5]) {
    for (const div of ['1ra', '2da', '3ra', '4ta']) {
      divs.push(`${año}° ${div}`);
    }
  }
  return divs;
}
