import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

// Inicializamos usando la librería de OpenAI, pero apuntamos a los servidores de Groq.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const referenceText = formData.get('referenceText') as string | null;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Faltan datos (audio o referenceText)' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Falta configurar GROQ_API_KEY en Vercel." }, { status: 500 });
    }

    const buffer = await audioFile.arrayBuffer();
    const fileForGroq = await toFile(Buffer.from(buffer), 'audio.webm', { type: audioFile.type || 'audio/webm' });

    // 1. Transcribe audio with Whisper (en Groq)
    let transcriptText = '';
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fileForGroq,
        model: 'whisper-large-v3', // Modelo abierto ultra rápido en Groq
        language: 'es',
      });
      transcriptText = transcription.text;
    } catch (e: any) {
      console.error("Groq Whisper Error:", e);
      return NextResponse.json({ error: `Error Transcripción Groq: ${e.message}` }, { status: 500 });
    }

    // 2. Analyze reading fluency and accuracy against referenceText with LLaMA 3 (en Groq)
    let resultString = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama3-8b-8192', // Modelo Llama 3 en Groq
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
      console.error("Groq LLaMA Error:", e);
      return NextResponse.json({ error: `Error Análisis Groq: ${e.message}` }, { status: 500 });
    }

    let analysis;
    try {
      analysis = JSON.parse(resultString);
      if (typeof analysis.score !== 'number') analysis.score = 0;
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return NextResponse.json({ error: "El análisis devuelto no tiene el formato correcto." }, { status: 500 });
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
