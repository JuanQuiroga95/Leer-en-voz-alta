import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { fileNameForMimeType } from '@/lib/audioFormat';

/**
 * Transcripción en vivo mientras el alumno lee.
 *
 * El cliente manda una VENTANA de los últimos segundos de audio, no la lectura
 * entera: así el tamaño del envío y el tiempo de transcripción quedan constantes
 * y el resaltado no se va atrasando a medida que avanza la lectura.
 *
 * Como los chunks de webm/opus posteriores al primero no llevan cabecera, el
 * cliente le pega adelante el primer chunk (que sí la tiene). Devolvemos la
 * `duracion` que efectivamente decodificó Whisper para que el cliente pueda
 * comprobar que el recorte se entendió bien y, si no, volver a mandar todo.
 *
 * Usa whisper-large-v3-turbo: bastante más rápido y barato que el modelo grande,
 * que es lo que importa para el seguimiento en vivo. El análisis final de la
 * lectura sigue usando whisper-large-v3 por precisión.
 */

// Con ventana el audio es chico; el margen cubre reintentos y arranques en frío.
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

    // verbose_json trae `duration`: cuántos segundos de audio decodificó realmente.
    // Lo usa el cliente para validar que la ventana recortada se entendió bien.
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'es',
      // Whisper limita el prompt a 224 tokens; recortamos el texto de referencia.
      prompt: referenceText ? referenceText.slice(0, 600) : undefined,
      temperature: 0,
      response_format: 'verbose_json',
    });

    return NextResponse.json({
      text: transcription.text || '',
      duracion: (transcription as { duration?: number }).duration ?? null,
    });
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
