/**
 * seed-textos.ts
 *
 * Carga colecciones de textos de fluidez lectora desde la terminal.
 *
 * Normalmente esto se hace desde el Panel de Administración, porque DATABASE_URL
 * está marcada como "sensitive" en Vercel y no se puede leer para correr esto
 * localmente. Queda como alternativa para cuando sí se tiene la credencial.
 *
 * Es idempotente: si el texto ya existe por título, no lo duplica; solo refresca
 * su año y su dificultad.
 *
 * Uso:  npx tsx src/scripts/seed-textos.ts [clave|todos]
 *       npx tsx src/scripts/seed-textos.ts            (lista las colecciones)
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { COLECCIONES, buscarColeccion } from '../lib/colecciones';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log('Colecciones disponibles:\n');
    for (const c of COLECCIONES) {
      console.log(`  ${c.clave.padEnd(12)} ${c.textos.length} textos — ${c.nombre}`);
    }
    console.log('\nUso: npx tsx src/scripts/seed-textos.ts [clave|todos]');
    return;
  }

  const claves = arg === 'todos' ? COLECCIONES.map(c => c.clave) : [arg];

  for (const clave of claves) {
    if (!buscarColeccion(clave)) {
      console.error(`Colección desconocida: "${clave}". Opciones: ${COLECCIONES.map(c => c.clave).join(', ')}, todos`);
      process.exit(1);
    }
  }

  for (const clave of claves) {
    await cargarColeccion(clave);
  }

  console.log('¡Listo! Los textos ya están disponibles en la pestaña PRÁCTICA del año que corresponde.');
}

async function cargarColeccion(clave: string) {
  const coleccion = buscarColeccion(clave)!;
  console.log(`\n${coleccion.nombre}\n${'─'.repeat(coleccion.nombre.length)}`);

  for (const texto of coleccion.textos) {
    const registro = await prisma.text.findFirst({ where: { title: texto.title } });

    if (registro) {
      await prisma.text.update({
        where: { id: registro.id },
        data: { year: texto.year, level: texto.level },
      });
      console.log(`⏭️  ${texto.year}° "${texto.title}" ya existía.`);
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

    const palabras = texto.content.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`✅ ${texto.year}° [${texto.level}] "${texto.title}" — ${palabras} palabras, ${texto.challenges.length} preguntas.`);
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
