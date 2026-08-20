/**
 * groq.ts
 * Cliente de Groq, elección del modelo de análisis y esquema de la respuesta.
 *
 * POR QUÉ EL MODELO NO ES UNA CONSTANTE
 * Groq da de baja modelos con cierta frecuencia. El 16/08/2026 apagó
 * `llama-3.3-70b-versatile`, que era el que usábamos, y la app quedó tirando un
 * 404 en medio de la clase. Acá se prueba una lista de candidatos y se usa el
 * primero que responda, así la próxima baja no vuelve a romper nada.
 *
 * POR QUÉ EL ESQUEMA ESTRICTO
 * Con `response_format: json_object` el modelo tiene que "acordarse" de escribir
 * JSON válido, y los gpt-oss son modelos de razonamiento: gastan tokens pensando
 * y a veces devuelven la respuesta vacía, lo que da un 400 `json_validate_failed`.
 * Con `json_schema` + `strict: true` la decodificación queda restringida al
 * esquema y el JSON válido está garantizado. Los modelos que no lo soportan caen
 * a `json_object`, que es lo que había antes.
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ModeloAnalisis {
  id: string;
  /** Si soporta `json_schema` con `strict: true` (decodificación restringida). */
  esquemaEstricto: boolean;
}

/**
 * Modelos de análisis, del preferido al de último recurso.
 * Los gpt-oss van primero por el esquema estricto; qwen es el otro reemplazo
 * que recomienda Groq para el llama-3.3-70b que dieron de baja.
 */
export const MODELOS_ANALISIS: ModeloAnalisis[] = [
  { id: 'openai/gpt-oss-120b', esquemaEstricto: true },
  { id: 'openai/gpt-oss-20b', esquemaEstricto: true },
  { id: 'qwen/qwen3.6-27b', esquemaEstricto: false },
];

/** Modelos de transcripción. Siguen vigentes; se dejan acá para tenerlos juntos. */
export const MODELO_TRANSCRIPCION = 'whisper-large-v3';
export const MODELO_TRANSCRIPCION_RAPIDA = 'whisper-large-v3-turbo';

/**
 * Techo de tokens de la respuesta.
 *
 * Sin un techo explícito, un modelo de razonamiento puede gastarse el
 * presupuesto pensando y devolver vacío. Alcanza de sobra para el análisis: lo
 * que lo hacía enorme era un arreglo con una entrada por cada palabra del texto,
 * que ya no se pide (ver ESQUEMA_ANALISIS).
 */
const MAX_TOKENS_ANALISIS = 2500;

/**
 * Forma exacta del análisis que espera la app.
 *
 * NO incluye el detalle palabra por palabra que se pedía antes: no lo usaba
 * ninguna pantalla y era la causa del problema. Para un texto de 366 palabras
 * eran 366 objetos, miles de tokens que se generaban para tirarse a la basura y
 * que hacían que la respuesta se cortara por la mitad. El resaltado palabra por
 * palabra lo calcula `textMatcher.matchWords` en el dispositivo, gratis y sin red.
 */
export const ESQUEMA_ANALISIS = {
  type: 'object',
  properties: {
    score: { type: 'integer', description: 'Del 0 al 100, precisión y completitud general' },
    ppm: { type: 'integer', description: 'Palabras por minuto correctas' },
    prosody: { type: 'integer', description: '1 bajo, 2 medio, 3 alto' },
    performanceLevel: { type: 'string', enum: ['Crítico', 'Medio', 'Avanzado'] },
    wordsReadCorrectly: { type: 'integer' },
    totalErrors: { type: 'integer' },
    omittedWords: { type: 'array', items: { type: 'string' } },
    substitutedWords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          said: { type: 'string' },
        },
        required: ['original', 'said'],
        additionalProperties: false,
      },
    },
    inventedWords: { type: 'array', items: { type: 'string' } },
    selfCorrectedWords: { type: 'array', items: { type: 'string' } },
    feedback: { type: 'string', description: 'Mensaje corto y motivador para el alumno' },
  },
  required: [
    'score', 'ppm', 'prosody', 'performanceLevel', 'wordsReadCorrectly',
    'totalErrors', 'omittedWords', 'substitutedWords', 'inventedWords',
    'selfCorrectedWords', 'feedback',
  ],
  additionalProperties: false,
} as const;

export function getGroqClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

/**
 * Último modelo que respondió bien. Evita reintentar en cada lectura uno que ya
 * sabemos que está apagado. Vive mientras viva la instancia de la función.
 */
let modeloConocido: string | null = null;

/** Solo para las pruebas: olvida el modelo recordado entre casos. */
export function _olvidarModeloConocido() {
  modeloConocido = null;
}

function candidatos(): ModeloAnalisis[] {
  const lista = [...MODELOS_ANALISIS];

  // Un modelo fijado a mano no sabemos si soporta esquema estricto: asumimos que no.
  const fijado = process.env.GROQ_ANALYSIS_MODEL?.trim();
  if (fijado && !lista.some(m => m.id === fijado)) {
    lista.unshift({ id: fijado, esquemaEstricto: false });
  }

  const orden = (m: ModeloAnalisis) => {
    if (m.id === modeloConocido) return 0;
    if (m.id === fijado) return 1;
    return 2;
  };
  return [...lista].sort((a, b) => orden(a) - orden(b));
}

/** ¿El error es "este modelo no existe", o es otra cosa? Exportada para poder probarla. */
export function esModeloNoDisponible(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  if (err?.status === 404) return true;
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('decommissioned') ||
    msg.includes('deprecated') ||
    msg.includes('model_not_found')
  );
}

/** ¿Falló por el formato de la respuesta y no por el modelo en sí? */
export function esProblemaDeFormato(e: unknown): boolean {
  const err = e as { status?: number; message?: string; code?: string };
  if (err?.code === 'json_validate_failed') return true;
  const msg = String(err?.message || '').toLowerCase();
  return (
    err?.status === 400 &&
    (msg.includes('json') || msg.includes('response_format') || msg.includes('schema'))
  );
}

/**
 * Pide el análisis probando los modelos disponibles en orden.
 *
 * Pasa al siguiente si el modelo no existe o si rechaza el formato pedido (por
 * ejemplo, un modelo que no soporta esquema estricto). Ante cualquier otro
 * problema (sin crédito, límite de peticiones) corta enseguida: probar otro
 * modelo no lo va a arreglar y solo haría esperar de más al alumno.
 */
export async function analizarConRespaldo(
  mensajes: ChatCompletionMessageParam[],
  /** Solo para las pruebas: por defecto usa el cliente real de Groq. */
  cliente?: Pick<OpenAI['chat']['completions'], 'create'>
): Promise<{ contenido: string; modelo: string }> {
  const chat = cliente ?? getGroqClient().chat.completions;
  const intentos = candidatos();
  let ultimoError: unknown;

  for (const modelo of intentos) {
    try {
      const completion = await chat.create({
        model: modelo.id,
        messages: mensajes,
        max_tokens: MAX_TOKENS_ANALISIS,
        temperature: 0.2,
        response_format: modelo.esquemaEstricto
          ? {
              type: 'json_schema',
              json_schema: { name: 'analisis_lectura', strict: true, schema: ESQUEMA_ANALISIS },
            }
          : { type: 'json_object' },
      } as Parameters<typeof chat.create>[0]);

      const contenido = (completion as { choices?: { message?: { content?: string } }[] })
        .choices?.[0]?.message?.content;

      // Respuesta vacía: el modelo se quedó sin tokens antes de escribir nada.
      // Como JSON vacío rompe más adelante, se trata como fallo y se prueba otro.
      if (!contenido || !contenido.trim()) {
        throw Object.assign(new Error('El modelo devolvió una respuesta vacía.'), {
          status: 400,
          code: 'json_validate_failed',
        });
      }

      if (modeloConocido !== modelo.id) {
        modeloConocido = modelo.id;
        console.log(`Groq: usando el modelo de análisis "${modelo.id}".`);
      }
      return { contenido, modelo: modelo.id };
    } catch (e) {
      ultimoError = e;
      if (!esModeloNoDisponible(e) && !esProblemaDeFormato(e)) throw e;
      const motivo = esModeloNoDisponible(e) ? 'ya no está disponible' : 'no devolvió un JSON válido';
      console.warn(`Groq: "${modelo.id}" ${motivo}, se prueba el siguiente.`);
      if (modeloConocido === modelo.id) modeloConocido = null;
    }
  }

  const detalle = ultimoError instanceof Error ? ultimoError.message : String(ultimoError);
  throw new Error(
    `Ningún modelo de análisis pudo responder (${intentos.map(m => m.id).join(', ')}). ` +
    `Último error: ${detalle}`
  );
}
