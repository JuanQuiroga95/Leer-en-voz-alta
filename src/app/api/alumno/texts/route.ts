import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ALUMNO') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const texts = await prisma.text.findMany({
      include: {
        challenges: true,
        progress: {
          where: { userId: session.userId }
        }
      }
    });
    
    return NextResponse.json({ texts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching texts' }, { status: 500 });
  }
}
