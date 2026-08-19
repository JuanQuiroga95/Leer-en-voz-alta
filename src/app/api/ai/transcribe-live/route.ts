import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { fileNameForMimeType } from '@/lib/audioFormat';

/**
 * Transcripción en vivo mientras el alumno lee.
 *
 * El cliente manda cada ~5 segundos TODO el audio grabado hasta ese momento
 * (no un fragmento suelto: los chunks de webm/opus posteriores al primero no
 * tienen cabecera y no se pueden decodificar por separado).
 *
 * Usa whisper-large-v3-turbo: bastante más rápido y barato que el modelo grande,
 * que es lo que importa para el seguimiento en vivo. El análisis final de la
 * lectura sigue usando whisper-large-v3 por precisión.
 */

// El audio acumulado crece con la lectura; damos margen suficiente en Vercel.
export const maxDuration = 30;

function getGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Falta configurar GROQ_API_KEY.' }, { status: 500 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    // El texto que el alumno debería estar leyendo se usa como "prompt" para
    // orientar a Whisper hacia el vocabulario correcto (nombres propios, etc.).
    const referenceText = (formData.get('referenceText') as string | null) || '';

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'Falta el audio.' }, { status: 400 });
    }

    const groq = getGroqClient();
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || 'audio/webm';
    const file = await toFile(buffer, fileNameForMimeType('lectura', mimeType), { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'es',
      // Whisper limita el prompt a 224 tokens; recortamos el texto de referencia.
      prompt: referenceText ? referenceText.slice(0, 600) : undefined,
      temperature: 0,
    });

    return NextResponse.json({ text: transcription.text || '' });
  } catch (error: any) {
    // Un fallo puntual (rate limit, red) no debe romper la lectura en curso:
    // el cliente ignora el error y reintenta en el siguiente ciclo.
    console.error('Error en transcribe-live:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Error al transcribir' },
      { status: 500 }
    );
  }
}
