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
 * Calcula la similitud normalizada entre dos palabras (0 a 1).
 */
export function similarity(a: string, b: string): number {
  const normA = normalizeWord(a);
  const normB = normalizeWord(b);
  if (normA === normB) return 1;
  if (normA.length === 0 || normB.length === 0) return 0;
  const dist = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return 1 - dist / maxLen;
}

/**
 * Tokeniza un texto en un array de palabras, preservando el texto original.
 */
export function tokenizeText(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Compara las palabras habladas contra las de referencia y devuelve un array con el estado de cada palabra.
 * 
 * Algoritmo: avanza secuencialmente por las palabras de referencia.
 * Para cada palabra hablada, busca la mejor coincidencia en una ventana de ±3 palabras
 * alrededor de la posición esperada para tolerar omisiones y repeticiones.
 */
export function matchWords(
  referenceWords: string[],
  spokenWords: string[],
  currentWordIndex?: number
): WordMatch[] {
  const results: WordMatch[] = referenceWords.map(word => ({
    word,
    status: 'pending' as WordStatus,
  }));

  if (spokenWords.length === 0) {
    if (currentWordIndex !== undefined && currentWordIndex < results.length) {
      results[currentWordIndex].status = 'current';
    }
    return results;
  }

  let refPointer = 0;
  const WINDOW = 3; // Ventana de búsqueda para tolerar omisiones

  for (let s = 0; s < spokenWords.length; s++) {
    const spoken = spokenWords[s];
    let bestMatch = -1;
    let bestSim = 0;

    // Buscar en una ventana alrededor del pointer actual
    const searchStart = Math.max(0, refPointer - 1);
    const searchEnd = Math.min(referenceWords.length - 1, refPointer + WINDOW);

    for (let r = searchStart; r <= searchEnd; r++) {
      // Solo considerar palabras que aún no fueron marcadas como correct
      if (results[r].status === 'correct') continue;
      
      const sim = similarity(referenceWords[r], spoken);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = r;
      }
    }

    if (bestMatch >= 0) {
      if (bestSim >= 0.85) {
        results[bestMatch].status = 'correct';
        results[bestMatch].spokenAs = spoken;
      } else if (bestSim >= 0.5) {
        results[bestMatch].status = 'close';
        results[bestMatch].spokenAs = spoken;
      } else {
        results[bestMatch].status = 'wrong';
        results[bestMatch].spokenAs = spoken;
      }

      // Marcar las palabras omitidas entre el pointer y el match
      for (let skip = refPointer; skip < bestMatch; skip++) {
        if (results[skip].status === 'pending') {
          results[skip].status = 'wrong';
        }
      }

      refPointer = bestMatch + 1;
    }
  }

  // Marcar la palabra actual (donde va el lector)
  if (currentWordIndex !== undefined && currentWordIndex < results.length) {
    if (results[currentWordIndex].status === 'pending') {
      results[currentWordIndex].status = 'current';
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
