/**
 * textMatcher.ts
 * Utilidad de comparación de texto para el seguimiento en tiempo real de lectura.
 * Compara palabras habladas contra el texto de referencia usando distancia de Levenshtein.
 */

export type WordStatus = 'correct' | 'close' | 'wrong' | 'pending' | 'current';

export interface WordMatch {
  word: string;         // Palabra original del texto
  status: WordStatus;   // Estado de coincidencia
  spokenAs?: string;    // Qué dijo el alumno (si aplica)
}

/**
 * Normaliza una palabra: quita acentos, pasa a minúsculas, quita puntuación.
 */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-zA-Z0-9ñÑ]/g, '') // Solo letras y números (conservar ñ)
    .toLowerCase();
}

/**
 * Une la transcripción de una ventana de audio con lo que ya veníamos acumulando.
 *
 * En el seguimiento en vivo no mandamos toda la lectura cada vez, sino los últimos
 * segundos. Como las ventanas se solapan, la nueva transcripción repite palabras que
 * ya teníamos: buscamos el solape más largo entre el final de lo acumulado y el
 * principio de la ventana, y agregamos solo lo que sigue.
 *
 * El solape se compara de forma tolerante (no exacta) porque Whisper transcribe cada
 * ventana por separado y suele variar alguna palabra, meter una muletilla o cambiar
 * la puntuación. Exigir coincidencia exacta hacía que el empalme fallara y se
 * duplicara media lectura, y con palabras duplicadas el resaltado deja huecos.
 *
 * `maxNuevas` acota el destrozo cuando aun así no se encuentra el solape: como las
 * ventanas se solapan por diseño, solo puede haber unas pocas palabras nuevas por
 * ciclo. Sin ese tope se agregaría la ventana entera y se duplicaría todo.
 */
export function mergeSpokenWords(
  acumuladas: string[],
  ventana: string[],
  maxNuevas?: number
): string[] {
  if (ventana.length === 0) return acumuladas;
  if (acumuladas.length === 0) return [...ventana];

  const maxSolape = Math.min(acumuladas.length, ventana.length);
  const cola = acumuladas.slice(-maxSolape).map(normalizeWord);
  const cabeza = ventana.slice(0, maxSolape).map(normalizeWord);

  // Proporción mínima de palabras que deben coincidir para aceptar un solape.
  const UMBRAL = 0.6;

  for (let k = maxSolape; k >= 1; k--) {
    let coincidencias = 0;
    for (let i = 0; i < k; i++) {
      const a = cola[cola.length - k + i];
      const b = cabeza[i];
      if (a === b || similarity(a, b) >= 0.8) coincidencias++;
    }
    // Con una sola palabra de solape exigimos coincidencia exacta: una coincidencia
    // suelta es demasiado fácil de encontrar por casualidad.
    const aceptable = k === 1 ? coincidencias === 1 : coincidencias / k >= UMBRAL;
    if (aceptable) return [...acumuladas, ...ventana.slice(k)];
  }

  // No se encontró solape. Agregamos solo lo último de la ventana, que es lo único
  // que puede ser nuevo de verdad.
  const nuevas = maxNuevas !== undefined ? ventana.slice(-maxNuevas) : ventana;
  return [...acumuladas, ...nuevas];
}

/**
 * Calcula la distancia de Levenshtein entre dos strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Similitud entre dos palabras YA normalizadas (0 a 1).
 *
 * Es la version caliente: la alineación la llama decenas de miles de veces por
 * cuadro, así que evita volver a normalizar y descarta por longitud antes de
 * calcular la distancia, que es lo caro.
 */
function similitudNormalizada(a: string, b: string): number {
  if (a === b) return 1;
  const largoA = a.length;
  const largoB = b.length;
  if (largoA === 0 || largoB === 0) return 0;

  const maxLen = largoA > largoB ? largoA : largoB;

  // La distancia nunca baja de la diferencia de longitudes: si con eso solo ya no
  // llega al umbral, no hace falta calcularla.
  const difLargo = largoA > largoB ? largoA - largoB : largoB - largoA;
  if (1 - difLargo / maxLen < SIM_MINIMA) return 0;

  return 1 - distanciaEnDosFilas(a, b) / maxLen;
}

/** Levenshtein con dos filas planas: sin matrices por llamada, que es lo que más pesaba. */
function distanciaEnDosFilas(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  let previa = new Uint16Array(m + 1);
  let actual = new Uint16Array(m + 1);

  for (let j = 0; j <= m; j++) previa[j] = j;

  for (let i = 1; i <= n; i++) {
    actual[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const costo = ca === b.charCodeAt(j - 1) ? 0 : 1;
      const sustituir = previa[j - 1] + costo;
      const eliminar = previa[j] + 1;
      const insertar = actual[j - 1] + 1;
      actual[j] = sustituir < eliminar
        ? (sustituir < insertar ? sustituir : insertar)
        : (eliminar < insertar ? eliminar : insertar);
    }
    const tmp = previa; previa = actual; actual = tmp;
  }

  return previa[m];
}

/**
 * Calcula la similitud normalizada entre dos palabras (0 a 1).
 */
export function similarity(a: string, b: string): number {
  return similitudNormalizada(normalizeWord(a), normalizeWord(b));
}

/**
 * Tokeniza un texto en un array de palabras, preservando el texto original.
 */
export function tokenizeText(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/** Ancho de banda de la alineación: cuántas palabras de desfasaje se toleran. */
const BANDA = 40;
/** Parecido mínimo para considerar que dos palabras son la misma. */
const SIM_MINIMA = 0.5;
/** Parecido a partir del cual se da por bien leída (debajo queda "casi"). */
const SIM_CORRECTA = 0.8;
/** Costo de saltear una palabra del texto (el alumno la omitió o no se reconoció). */
const COSTO_OMISION = -0.35;
/** Costo de descartar una palabra dicha (ruido, muletilla, repetición). */
const COSTO_SOBRANTE = -0.35;
/** Castigo de emparejar dos palabras que no se parecen. */
const CASTIGO_DISTINTAS = -0.6;

/**
 * Compara las palabras habladas contra las de referencia y devuelve el estado de cada una.
 *
 * Usa alineación por programación dinámica (estilo Needleman-Wunsch) en vez de ir
 * emparejando palabra por palabra hacia adelante. La diferencia importa: el método
 * codicioso decide cada palabra sin poder arrepentirse, así que un tramo mal
 * reconocido lo dejaba trabado o lo mandaba a engancharse con la palabra equivocada
 * más adelante. La alineación elige la correspondencia que mejor explica TODA la
 * lectura de una vez, y por eso absorbe omisiones, inserciones y sustituciones.
 *
 * El cálculo se limita a una banda diagonal (`BANDA`): la lectura avanza en orden,
 * así que no hace falta considerar desfasajes grandes, y así el costo queda lineal
 * en vez de cuadrático. Esto corre varias veces por segundo en el celular del alumno.
 *
 * NO marca palabras como "wrong" en tiempo real (solo correct/close/pending/current).
 * Las omisiones se evalúan al final, cuando se detiene la grabación.
 */
export function matchWords(
  referenceWords: string[],
  spokenWords: string[]
): WordMatch[] {
  const results: WordMatch[] = referenceWords.map(word => ({
    word,
    status: 'pending' as WordStatus,
  }));

  if (results.length === 0) return results;
  if (spokenWords.length === 0) {
    results[0].status = 'current';
    return results;
  }

  const n = referenceWords.length;
  const m = spokenWords.length;

  // Normalizamos una sola vez: dentro del bucle esto se llamaría miles de veces.
  const ref = referenceWords.map(normalizeWord);
  const dic = spokenWords.map(normalizeWord);

  // Sin la banda esto sería n*m; con ella, n*(2*BANDA).
  const dentro = (i: number, j: number) => Math.abs(i - j) <= BANDA;
  const MUY_MALO = -Infinity;

  // puntajes[i][j] = mejor puntaje alineando las primeras i de referencia con las
  // primeras j dichas. Guardamos también de dónde vino cada celda para reconstruir.
  const puntajes: Float64Array[] = [];
  const origen: Int8Array[] = [];   // 1 = emparejar, 2 = omisión, 3 = sobrante
  for (let i = 0; i <= n; i++) {
    puntajes.push(new Float64Array(m + 1).fill(MUY_MALO));
    origen.push(new Int8Array(m + 1));
  }

  puntajes[0][0] = 0;
  for (let i = 1; i <= n && dentro(i, 0); i++) {
    puntajes[i][0] = puntajes[i - 1][0] + COSTO_OMISION;
    origen[i][0] = 2;
  }
  for (let j = 1; j <= m && dentro(0, j); j++) {
    puntajes[0][j] = puntajes[0][j - 1] + COSTO_SOBRANTE;
    origen[0][j] = 3;
  }

  for (let i = 1; i <= n; i++) {
    const desde = Math.max(1, i - BANDA);
    const hasta = Math.min(m, i + BANDA);
    for (let j = desde; j <= hasta; j++) {
      const sim = similitudNormalizada(ref[i - 1], dic[j - 1]);
      const valorEmparejar = sim >= SIM_MINIMA ? sim : CASTIGO_DISTINTAS;

      let mejor = puntajes[i - 1][j - 1] + valorEmparejar;
      let de: number = 1;

      const porOmision = puntajes[i - 1][j] + COSTO_OMISION;
      if (porOmision > mejor) { mejor = porOmision; de = 2; }

      const porSobrante = puntajes[i][j - 1] + COSTO_SOBRANTE;
      if (porSobrante > mejor) { mejor = porSobrante; de = 3; }

      puntajes[i][j] = mejor;
      origen[i][j] = de;
    }
  }

  // Reconstrucción. Arrancamos desde el final de lo DICHO, no del texto: el alumno
  // todavía va por la mitad y el resto del texto no está leído.
  let mejorI = 0;
  let mejorPuntaje = MUY_MALO;
  for (let i = 0; i <= n; i++) {
    if (dentro(i, m) && puntajes[i][m] > mejorPuntaje) {
      mejorPuntaje = puntajes[i][m];
      mejorI = i;
    }
  }

  let i = mejorI;
  let j = m;
  let ultimaLeida = -1;

  while (i > 0 || j > 0) {
    const de = origen[i][j];
    if (de === 1 && i > 0 && j > 0) {
      const sim = similitudNormalizada(ref[i - 1], dic[j - 1]);
      if (sim >= SIM_MINIMA) {
        results[i - 1].status = sim >= SIM_CORRECTA ? 'correct' : 'close';
        results[i - 1].spokenAs = spokenWords[j - 1];
        if (i - 1 > ultimaLeida) ultimaLeida = i - 1;
      }
      i--; j--;
    } else if (de === 2 && i > 0) {
      i--;
    } else if (de === 3 && j > 0) {
      j--;
    } else if (i > 0) {
      i--;
    } else {
      j--;
    }
  }

  // La palabra "current" es la primera pendiente después de lo ya leído.
  for (let k = ultimaLeida + 1; k < results.length; k++) {
    if (results[k].status === 'pending') {
      results[k].status = 'current';
      break;
    }
  }

  return results;
}

/**
 * Calcula PPM (Palabras Por Minuto) según la fórmula del Censo de Mendoza.
 * PPM = (Palabras leídas - Errores) × 60 / Tiempo en segundos
 */
export function calculatePPM(wordsRead: number, errors: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  return Math.round(((wordsRead - errors) * 60) / timeSeconds);
}

/**
 * Determina el nivel de desempeño según las tablas del Censo de Mendoza, ajustado por año escolar.
 * Umbrales propuestos (Secundaria):
 * - 1° y 2°: Crítico < 110, Medio 110-135, Avanzado > 135
 * - 3°: Crítico < 125, Medio 125-155, Avanzado > 155
 * - 4° y 5°: Crítico < 140, Medio 140-175, Avanzado > 175
 */
export function getPerformanceLevel(ppm: number, year: number = 1): { level: string; color: string; description: string } {
  let criticoThreshold = 100;
  let medioThreshold = 181;

  if (year <= 2) {
    criticoThreshold = 110;
    medioThreshold = 135;
  } else if (year === 3) {
    criticoThreshold = 125;
    medioThreshold = 155;
  } else {
    criticoThreshold = 140;
    medioThreshold = 175;
  }

  if (ppm < criticoThreshold) {
    return {
      level: 'Crítico',
      color: '#c0392b',
      description: `Carece de la automatización elemental requerida para textos de nivel ${year}° año.`
    };
  } else if (ppm <= medioThreshold) {
    return {
      level: 'Medio',
      color: '#e8a020',
      description: 'Nivel medio esperado, capaz de sostener un ritmo de lectura continuo.'
    };
  } else {
    return {
      level: 'Avanzado',
      color: '#2e8b57',
      description: 'Lectura óptima y experta; alta velocidad de decodificación automática.'
    };
  }
}

/**
 * Determina el nivel de comprensión según la cantidad de respuestas correctas (escala Mendoza).
 */
export function getComprehensionLevel(
  correct: number, 
  total: number
): { level: string; color: string } {
  const ratio = total > 0 ? correct / total : 0;
  
  if (ratio === 1) return { level: 'Avanzado', color: '#2e8b57' };
  if (ratio >= 0.7) return { level: 'Satisfactorio', color: '#2d6a9f' };
  if (ratio >= 0.5) return { level: 'Básico', color: '#e8a020' };
  if (ratio > 0) return { level: 'Debajo del básico', color: '#e07020' };
  return { level: 'Muy por debajo del básico', color: '#c0392b' };
}
