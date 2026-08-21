/**
 * sincronizar-esquema.mjs
 * Aplica el esquema de Prisma a la base antes de compilar.
 *
 * POR QUÉ EXISTE
 * El proyecto no usa migraciones y DATABASE_URL está marcada como "sensitive" en
 * Vercel, así que no hay forma de aplicar un cambio de esquema a mano. Sin este
 * paso, agregar una tabla implicaría que el código la use y no exista.
 *
 * POR QUÉ NO CORTA EL BUILD SI FALLA
 * Esto corre en cada deploy de una app que usa una escuela entera. Si un día la
 * base no responde, es mucho peor quedarse sin sitio que quedarse sin una tabla
 * nueva: lo viejo sigue funcionando igual. Entonces avisa fuerte y deja seguir.
 * Las pantallas que dependen de una tabla recién agregada están preparadas para
 * decir que todavía no está lista, en vez de romperse.
 */

import { spawnSync } from 'node:child_process';

const linea = '─'.repeat(60);

if (!process.env.DATABASE_URL) {
  console.warn(`\n${linea}`);
  console.warn('AVISO: no hay DATABASE_URL, se saltea la sincronización del esquema.');
  console.warn('La aplicación se compila igual.');
  console.warn(`${linea}\n`);
  process.exit(0);
}

console.log('\nSincronizando el esquema con la base de datos…');

// Sin --accept-data-loss a propósito: así solo aplica cambios que agregan cosas
// y se planta si algo implicara borrar datos de la escuela.
const r = spawnSync('npx', ['prisma', 'db', 'push'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (r.status === 0) {
  console.log('Esquema sincronizado.\n');
  process.exit(0);
}

console.warn(`\n${linea}`);
console.warn('AVISO: no se pudo sincronizar el esquema con la base de datos.');
console.warn('La aplicación se compila y se publica igual: lo que ya funcionaba');
console.warn('sigue funcionando. Lo que dependa de una tabla nueva va a avisar');
console.warn('que todavía no está disponible.');
console.warn(`${linea}\n`);

// Salida 0 a propósito: el build tiene que seguir.
process.exit(0);
