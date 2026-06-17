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

    let transcriptText = '';
    try {
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'es',
      });
      transcriptText = transcription.text;
    } catch (e: any) {
      console.error("OpenAI Whisper Error:", e);
      return NextResponse.json({ error: "No se pudo transcribir el audio. Verificá que la OPENAI_API_KEY esté correctamente configurada." }, { status: 500 });
    }

    // 2. Analyze reading fluency and accuracy against referenceText
    let resultString = '';
    try {
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
      resultString = completion.choices[0]?.message?.content || '{}';
    } catch (e: any) {
      console.error("OpenAI GPT-4o Error:", e);
      return NextResponse.json({ error: "No se pudo generar el análisis. Verificá que la OPENAI_API_KEY esté correctamente configurada." }, { status: 500 });
    }

    let analysis;
    try {
      analysis = JSON.parse(resultString);
      if (typeof analysis.score !== 'number') analysis.score = 0;
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return NextResponse.json({ error: "El análisis devuelto por OpenAI no tiene el formato correcto." }, { status: 500 });
    }

    // 3. Upload to Vercel Blob
    let audioUrl = null;
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const blobName = `audio_${Date.now()}.webm`;
        const blobResult = await put(blobName, buffer, { access: 'public', contentType: 'audio/webm' });
        audioUrl = blobResult.url;
      } else {
        console.warn("BLOB_READ_WRITE_TOKEN no está configurado. Se omite la subida del audio.");
      }
    } catch (e: any) {
      console.error("Vercel Blob Upload Error:", e);
      // No rompemos la app, solo no guardamos el audio
    }

    return NextResponse.json({
      transcription: transcriptText,
      analysis,
      audioUrl: audioUrl
    });

  } catch (error: any) {
    console.error('Error general in analyze-reading API:', error);
    return NextResponse.json({ error: "Error inesperado en el servidor al procesar tu solicitud." }, { status: 500 });
  }
}
