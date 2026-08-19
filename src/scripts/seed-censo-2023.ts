/**
 * seed-censo-2023.ts
 *
 * Carga colecciones de textos de fluidez lectora y las asigna en modo PRACTICA
 * a todas las divisiones del año que corresponde.
 *
 * Es idempotente: si el texto ya existe por título, no lo duplica, y las
 * asignaciones se crean solo si no estaban.
 *
 * Uso:  npx tsx src/scripts/seed-censo-2023.ts [censo2023|videla|todos]
 *       (sin argumento carga censo2023)
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { textosCenso2023, divisionesDelAnio, type TextoSeed } from '../lib/censo2023';
import { textosVidela } from '../lib/textosVidela';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });



const colecciones: Record<string, { nombre: string; textos: TextoSeed[] }> = {
  censo2023: { nombre: 'Censo de Fluidez Lectora 2023 (DGE Mendoza)', textos: textosCenso2023 },
  videla: { nombre: 'Fluidez Lectora Videla', textos: textosVidela },
};

async function main() {
  const arg = process.argv[2] || 'censo2023';
  const claves = arg === 'todos' ? Object.keys(colecciones) : [arg];

  for (const clave of claves) {
    if (!colecciones[clave]) {
      console.error(`Colección desconocida: "${clave}". Opciones: ${Object.keys(colecciones).join(', ')}, todos`);
      process.exit(1);
    }
  }

  for (const clave of claves) {
    await cargarColeccion(clave);
  }

  console.log('¡Listo! Los textos ya están disponibles en la pestaña PRÁCTICA de cada curso.');
}

async function cargarColeccion(clave: string) {
  const { nombre, textos } = colecciones[clave];
  console.log(`\nCargando textos de ${nombre}...\n`);

  for (const texto of textos) {
    let registro = await prisma.text.findFirst({ where: { title: texto.title } });

    if (registro) {
      console.log(`⏭️  "${texto.title}" ya existía, no se duplica.`);
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
      const palabras = texto.content.split(/\s+/).filter(w => w.length > 0).length;
      console.log(`✅ "${texto.title}" — ${texto.year}° año, ${palabras} palabras, ${texto.challenges.length} preguntas.`);
    }

    // Asignar como PRACTICA a todas las divisiones del año que corresponde.
    const divisiones = divisionesDelAnio(texto.year);
    let nuevas = 0;

    for (const division of divisiones) {
      const yaAsignado = await prisma.textAssignment.findFirst({
        where: { textId: registro.id, mode: 'PRACTICA', division, userId: null },
      });
      if (yaAsignado) continue;

      await prisma.textAssignment.create({
        data: { textId: registro.id, mode: 'PRACTICA', division },
      });
      nuevas++;
    }

    console.log(`   → ${nuevas} asignaciones nuevas de práctica (${divisiones.join(', ')})\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
