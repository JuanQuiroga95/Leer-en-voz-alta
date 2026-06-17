import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { File } from 'buffer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const referenceText = formData.get('referenceText') as string | null;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Faltan datos (audio o referenceText)' }, { status: 400 });
    }

    // Convert Blob to File object for OpenAI SDK
    const buffer = await audioFile.arrayBuffer();
    const file = new globalThis.File([buffer], 'audio.webm', { type: audioFile.type || 'audio/webm' });

    // 1. Transcribe audio with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'es',
    });

    const transcriptText = transcription.text;

    // 2. Analyze reading fluency and accuracy against referenceText
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Eres un profesor experto en evaluar fluidez lectora en niños de secundaria.
Vas a recibir el texto original que el alumno debía leer, y la transcripción de lo que realmente leyó.
Compara ambos textos y devuelve un análisis en formato JSON estricto con la siguiente estructura:
{
  "score": (entero del 0 al 100 evaluando precisión y completitud),
  "omittedWords": [arreglo de palabras que faltaron],
  "inventedWords": [arreglo de palabras que leyó mal o inventó],
  "feedback": "mensaje corto motivador y constructivo para el estudiante en español"
}`
        },
        {
          role: 'user',
          content: `Texto original:\n${referenceText}\n\nTranscripción del alumno:\n${transcriptText}`
        }
      ]
    });

    const resultString = completion.choices[0]?.message?.content;
    let analysis;
    try {
      analysis = JSON.parse(resultString || '{}');
    } catch (e) {
      analysis = { score: 0, feedback: "Error procesando el análisis." };
    }

    // 3. Upload to Vercel Blob
    const { put } = await import('@vercel/blob');
    const blobName = `audio_${Date.now()}.webm`;
    const blobResult = await put(blobName, buffer, { access: 'public', contentType: 'audio/webm' });

    return NextResponse.json({
      transcription: transcriptText,
      analysis,
      audioUrl: blobResult.url
    });

  } catch (error: any) {
    console.error('Error in analyze-reading API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
