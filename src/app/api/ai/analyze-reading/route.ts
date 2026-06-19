import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

// Lazy init para evitar error de build cuando no hay GROQ_API_KEY
function getGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const referenceText = formData.get('referenceText') as string | null;
    const readingTimeSeconds = formData.get('readingTimeSeconds') as string | null;
    const yearStr = formData.get('year') as string | null;
    const year = yearStr ? parseInt(yearStr, 10) : 1;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Faltan datos (audio o referenceText)' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Falta configurar GROQ_API_KEY en Vercel." }, { status: 500 });
    }

    const groq = getGroqClient();

    const timeSeconds = readingTimeSeconds ? parseInt(readingTimeSeconds, 10) : 60;
    const totalWords = referenceText.split(/\s+/).filter(w => w.length > 0).length;

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

    // 2. Analyze reading fluency with expanded census metrics using LLaMA (en Groq)
    let resultString = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Modelo más grande y capaz para formateo JSON complejo
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres un profesor experto en evaluar fluidez lectora en niños de secundaria, siguiendo la metodología del Censo de Fluidez y Comprensión Lectora de la DGE de Mendoza, Argentina.

Vas a recibir:
- El texto original que el alumno debía leer
- La transcripción de lo que realmente leyó (generada por Whisper)
- El tiempo que tardó en leer (en segundos)
- La cantidad total de palabras del texto original

Compara ambos textos y devuelve un análisis en formato JSON estricto con la siguiente estructura:
{
  "score": (entero del 0 al 100 evaluando precisión y completitud general),
  "ppm": (entero: Palabras Por Minuto correctas. Calcula: (palabras correctamente leídas × 60) / tiempo_en_segundos),
  "prosody": (entero 1-3, donde 3=Alto: lectura expresiva que respeta entonación y puntuación, 2=Medio: respeto intermitente por puntuación, 1=Bajo: lectura monótona o muy entrecortada),
  "performanceLevel": (string: "Crítico", "Medio" o "Avanzado" dependiendo del año del alumno, para ${year}° año calcula: si es 1-2(Critico<110, Avanzado>135), si es 3(Critico<125, Avanzado>155), si es 4-5(Critico<140, Avanzado>175)),
  "wordsReadCorrectly": (entero: cantidad de palabras que leyó correctamente),
  "totalErrors": (entero: cantidad total de errores de lectura),
  "omittedWords": [arreglo de palabras del texto original que el alumno se salteó],
  "substitutedWords": [arreglo de objetos {"original": "palabra_del_texto", "said": "lo_que_dijo"} para sustituciones],
  "inventedWords": [arreglo de palabras que leyó mal o inventó que no son sustituciones claras],
  "selfCorrectedWords": [arreglo de palabras donde el alumno se corrigió a sí mismo - estas NO cuentan como error],
  "wordByWordAnalysis": [arreglo de objetos {"expected": "palabra_esperada", "status": "correct|substituted|omitted|invented"} para cada palabra del texto original, EN ORDEN],
  "feedback": "mensaje corto motivador y constructivo para el estudiante en español, mencionando lo que hizo bien y dando un consejo específico para mejorar"
}

REGLAS DE EVALUACIÓN (basadas en el Censo de Fluidez de Mendoza):
- Las SUSTITUCIONES cuentan como error (leer "casa" por "causa")
- Las OMISIONES cuentan como error (saltarse palabras)
- El DELETREO o SILABEO sistemático indica dificultades graves de decodificación
- Las VACILACIONES LEVES, REPETICIONES y AUTOCORRECCIONES NO cuentan como error
- PPM = (Palabras leídas correctamente × 60) / Tiempo en segundos
- Prosodia nivel 3: respeta entonación y puntuación de forma sistemática
- Prosodia nivel 2: respeto intermitente, pausas inapropiadas en pasajes complejos
- Prosodia nivel 1: no respeta pausas ni entonación, lectura monótona o entrecortada`
          },
          {
            role: 'user',
            content: `Texto original (${totalWords} palabras):\n${referenceText}\n\nTranscripción del alumno:\n${transcriptText}\n\nTiempo de lectura: ${timeSeconds} segundos\nTotal de palabras del texto: ${totalWords}\n\nIMPORTANTE: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido, sin ningún otro texto de introducción o cierre.`
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
      if (typeof analysis.ppm !== 'number') {
        // Fallback: calcular PPM manualmente
        const correctWords = analysis.wordsReadCorrectly || (totalWords - (analysis.totalErrors || 0));
        analysis.ppm = timeSeconds > 0 ? Math.round((correctWords * 60) / timeSeconds) : 0;
      }
      if (typeof analysis.prosody !== 'number') analysis.prosody = 1;
      if (!analysis.performanceLevel) {
        // Fallback robusto importando la función (si fuera posible) o replicando la lógica
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

        if (analysis.ppm < criticoThreshold) analysis.performanceLevel = 'Crítico';
        else if (analysis.ppm <= medioThreshold) analysis.performanceLevel = 'Medio';
        else analysis.performanceLevel = 'Avanzado';
      }
      if (!Array.isArray(analysis.omittedWords)) analysis.omittedWords = [];
      if (!Array.isArray(analysis.substitutedWords)) analysis.substitutedWords = [];
      if (!Array.isArray(analysis.inventedWords)) analysis.inventedWords = [];
      if (!Array.isArray(analysis.wordByWordAnalysis)) analysis.wordByWordAnalysis = [];
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
