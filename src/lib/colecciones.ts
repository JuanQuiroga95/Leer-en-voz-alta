/**
 * colecciones.ts
 * Registro único de las colecciones de textos y de la escala de dificultad.
 *
 * Lo usan el endpoint de carga del Panel de Administración, el script de terminal
 * y el panel del profesor. Agregar una colección acá la hace aparecer en todos.
 */

import { textosCenso2023, type TextoSeed } from './censo2023';
import { textosVidela } from './textosVidela';
import { textosCenso2026 } from './textosCenso2026';
import { textosMitologia } from './textosMitologia';

/**
 * Escala de dificultad de un texto, de menor a mayor.
 *
 * Es independiente del año: dentro de un mismo año conviven textos más y menos
 * exigentes, y es justamente lo que el profesor necesita para elegir. No confundir
 * con el nivel de desempeño del alumno (Crítico/Medio/Avanzado), que se calcula a
 * partir de las palabras por minuto y vive en `textMatcher.getPerformanceLevel`.
 */
export const NIVELES_DIFICULTAD = ['Básico', 'Intermedio', 'Avanzado'] as const;
export type NivelDificultad = (typeof NIVELES_DIFICULTAD)[number];

/** Color de la etiqueta de dificultad, para que se lea de un vistazo. */
export const COLOR_DIFICULTAD: Record<string, { texto: string; fondo: string }> = {
  'Básico': { texto: '#2f855a', fondo: '#c6f6d5' },
  'Intermedio': { texto: '#b7791f', fondo: '#fefcbf' },
  'Avanzado': { texto: '#c53030', fondo: '#fed7d7' },
};

/**
 * Normaliza los nombres viejos de dificultad.
 *
 * Las primeras colecciones se cargaron con "Medio" y algún texto quedó sin nivel.
 * Como esos textos ya están en la base de datos de la escuela, se traducen acá en
 * vez de pedir una migración: cualquier valor desconocido cae en "Intermedio".
 */
export function normalizarDificultad(valor: string | null | undefined): NivelDificultad {
  const limpio = (valor || '').trim().toLowerCase();
  if (limpio === 'básico' || limpio === 'basico') return 'Básico';
  if (limpio === 'avanzado') return 'Avanzado';
  return 'Intermedio';   // incluye el viejo "Medio" y los vacíos
}

export interface Coleccion {
  /** Clave estable: la usa el endpoint de carga. No cambiarla una vez publicada. */
  clave: string;
  nombre: string;
  descripcion: string;
  textos: TextoSeed[];
}

export const COLECCIONES: Coleccion[] = [
  {
    clave: 'censo2026',
    nombre: 'Censo de Fluidez Lectora 2026',
    descripcion: 'Textos oficiales del censo 2026 (DGE Mendoza), uno por año.',
    textos: textosCenso2026,
  },
  {
    clave: 'mitologia',
    nombre: 'Mitología y leyendas',
    descripcion: 'Mitos y leyendas del mundo y de Argentina, dos por año.',
    textos: textosMitologia,
  },
  {
    clave: 'censo2023',
    nombre: 'Censo de Fluidez Lectora 2023',
    descripcion: 'Textos oficiales del censo 2023 (DGE Mendoza), uno por año.',
    textos: textosCenso2023,
  },
  {
    clave: 'videla',
    nombre: 'Fluidez Lectora Videla',
    descripcion: 'Biografías y textos culturales, dos por año.',
    textos: textosVidela,
  },
];

export function buscarColeccion(clave: string): Coleccion | undefined {
  return COLECCIONES.find(c => c.clave === clave);
}

/** Año de secundaria a partir de la división del alumno ("3° 2da" → 3). */
export function anioDeDivision(division: string | null | undefined): number | null {
  const m = (division || '').match(/(\d)\s*°/);
  if (!m) return null;
  const anio = Number(m[1]);
  return anio >= 1 && anio <= 5 ? anio : null;
}
