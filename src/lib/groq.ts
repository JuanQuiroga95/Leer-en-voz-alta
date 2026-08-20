/**
 * groq.ts
 * Cliente de Groq y elección del modelo de análisis.
 *
 * POR QUÉ ESTO NO ES UNA CONSTANTE
 * Groq da de baja modelos con cierta frecuencia. El 16/08/2026 apagó
 * `llama-3.3-70b-versatile`, que era el que usábamos, y la app quedó tirando un
 * 404 en medio de la clase: el alumno grababa su lectura y no recibía nada.
 *
 * Para que no vuelva a pasar, el modelo no está clavado en el código:
 * se prueba una lista de candidatos y se usa el primero que responda. Si Groq
 * apaga otro, la app sigue andando sola con el siguiente de la lista.
 *
 * Además `GROQ_ANALYSIS_MODEL` permite fijar uno desde las variables de entorno
 * de Vercel, sin tocar el código ni esperar un deploy.
 */

import OpenAI from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

/**
 * Modelos de análisis, del preferido al de último recurso.
 * Los dos primeros son los que Groq recomienda como reemplazo de llama-3.3-70b.
 */
export const MODELOS_ANALISIS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-20b',
];

/** Modelo de transcripción. Sigue vigente; se deja acá para tenerlos juntos. */
export const MODELO_TRANSCRIPCION = 'whisper-large-v3';
export const MODELO_TRANSCRIPCION_RAPIDA = 'whisper-large-v3-turbo';

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

function candidatos(): string[] {
  const fijado = process.env.GROQ_ANALYSIS_MODEL?.trim();
  const lista = [...MODELOS_ANALISIS];
  if (fijado) lista.unshift(fijado);
  if (modeloConocido) lista.unshift(modeloConocido);
  return [...new Set(lista)];
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

/**
 * Pide un análisis probando los modelos disponibles en orden.
 *
 * Solo pasa al siguiente si el modelo no existe. Ante cualquier otro problema
 * (sin crédito, límite de peticiones, JSON mal formado) corta enseguida: probar
 * otro modelo no lo va a arreglar y solo haría esperar de más al alumno.
 */
export async function analizarConRespaldo(
  parametros: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>,
  /** Solo para las pruebas: por defecto usa el cliente real de Groq. */
  cliente?: Pick<OpenAI['chat']['completions'], 'create'>
): Promise<{ contenido: string; modelo: string }> {
  const chat = cliente ?? getGroqClient().chat.completions;
  const intentos = candidatos();
  let ultimoError: unknown;

  for (const modelo of intentos) {
    try {
      const completion = await chat.create({ ...parametros, model: modelo });
      if (modeloConocido !== modelo) {
        modeloConocido = modelo;
        console.log(`Groq: usando el modelo de análisis "${modelo}".`);
      }
      return { contenido: completion.choices[0]?.message?.content || '{}', modelo };
    } catch (e) {
      ultimoError = e;
      if (!esModeloNoDisponible(e)) throw e;
      console.warn(`Groq: el modelo "${modelo}" ya no está disponible, se prueba el siguiente.`);
      if (modeloConocido === modelo) modeloConocido = null;
    }
  }

  const detalle = ultimoError instanceof Error ? ultimoError.message : String(ultimoError);
  throw new Error(
    `Ninguno de los modelos de análisis está disponible en Groq (${intentos.join(', ')}). ` +
    `Último error: ${detalle}`
  );
}
