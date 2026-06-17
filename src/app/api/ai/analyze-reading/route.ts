import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const referenceText = formData.get('referenceText') as string | null;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Faltan datos (audio o referenceText)' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' }, { status: 500 });
    }

    const buffer = await audioFile.arrayBuffer();
    
    // 1. Instanciar Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const base64Audio = Buffer.from(buffer).toString('base64');

    // 2. Analizar el audio directamente con Gemini Multimodal
    const prompt = `
Eres un profesor experto en evaluar fluidez lectora en niños de secundaria.
Vas a escuchar un audio donde un alumno lee en voz alta. 
El texto original que debía leer es el siguiente:
"${referenceText}"

Compara lo que escuchas con el texto original y devuelve un análisis en formato JSON estricto con esta estructura:
{
  "transcription": "La transcripción exacta de lo que escuchaste decir al alumno en el audio",
  "score": (entero del 0 al 100 evaluando precisión y completitud),
  "omittedWords": [arreglo de palabras del texto original que faltaron],
  "inventedWords": [arreglo de palabras que leyó mal o inventó],
  "feedback": "mensaje corto motivador y constructivo para el estudiante en español"
}`;

    let resultString = '';
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Audio,
            mimeType: audioFile.type || 'audio/webm',
          },
        },
        { text: prompt }
      ]);
      resultString = result.response.text();
    } catch (e: any) {
      console.error("Gemini Error:", e);
      return NextResponse.json({ error: `Error de Gemini: ${e.message}` }, { status: 500 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultString);
      if (typeof parsedResult.score !== 'number') parsedResult.score = 0;
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return NextResponse.json({ error: "El análisis devuelto por la IA no tiene el formato correcto." }, { status: 500 });
    }

    const transcriptText = parsedResult.transcription || "Transcripción no disponible";
    const analysis = {
      score: parsedResult.score,
      omittedWords: parsedResult.omittedWords || [],
      inventedWords: parsedResult.inventedWords || [],
      feedback: parsedResult.feedback || "Sin feedback"
    };

    // 3. Subir a Vercel Blob (si está configurado)
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
