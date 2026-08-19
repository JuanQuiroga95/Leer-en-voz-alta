import { useState, useRef, useCallback, useEffect } from 'react';
import { pickRecordingMimeType, fileNameForMimeType } from './audioFormat';

/** Cada cuánto mandamos el audio acumulado a transcribir mientras el alumno lee. */
const LIVE_INTERVAL_MS = 5000;
/** Primer envío anticipado, para que el resaltado arranque sin dejar la pantalla muerta. */
const LIVE_FIRST_MS = 2500;
/** Timeslice del MediaRecorder: necesitamos chunks disponibles antes de que termine la grabación. */
const CHUNK_MS = 1000;
/**
 * Tope de audio acumulado que seguimos mandando en vivo (~3 MB).
 * Vercel corta los request bodies alrededor de 4,5 MB; pasado ese punto dejamos de
 * seguir en vivo, pero la grabación continúa normal y el análisis final no se ve afectado.
 */
const LIVE_MAX_BYTES = 3 * 1024 * 1024;

export type LiveStatus = 'idle' | 'starting' | 'active' | 'error';

export interface StartRecordingOptions {
  /** Si se pasa, se transcribe en vivo para ir resaltando el texto mientras se lee. */
  referenceText?: string;
}

/**
 * Graba el audio de la lectura y, en paralelo, lo va transcribiendo para poder
 * resaltar las palabras en tiempo real.
 *
 * IMPORTANTE — por qué no se usa la Web Speech API:
 * abrir `webkitSpeechRecognition` a la vez que `MediaRecorder` funciona en Chrome
 * de escritorio pero NO en Chrome de Android, donde el reconocedor nativo necesita
 * el micrófono en exclusiva: arranca, nunca recibe audio y nada se resalta.
 * Acá usamos un único micrófono y mandamos el audio acumulado a Whisper (Groq)
 * cada pocos segundos, que se comporta igual en computadora y en celular.
 *
 * Se manda el audio COMPLETO desde el inicio en cada ciclo, no el último fragmento:
 * los chunks de webm/opus posteriores al primero no llevan cabecera y no se pueden
 * decodificar sueltos.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Transcripción en vivo
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveWords, setLiveWords] = useState<string[]>([]);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>('');

  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveFirstTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveInFlightRef = useRef(false);
  const liveAbortRef = useRef<AbortController | null>(null);
  const liveSeqRef = useRef(0);          // secuencia enviada
  const liveAppliedSeqRef = useRef(0);   // última secuencia aplicada (descarta respuestas fuera de orden)
  const referenceTextRef = useRef<string>('');

  const stopLiveTranscription = useCallback(() => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }
    if (liveFirstTimerRef.current) {
      clearTimeout(liveFirstTimerRef.current);
      liveFirstTimerRef.current = null;
    }
    if (liveAbortRef.current) {
      liveAbortRef.current.abort();
      liveAbortRef.current = null;
    }
    liveInFlightRef.current = false;
  }, []);

  /** Manda a transcribir todo lo grabado hasta ahora y actualiza las palabras detectadas. */
  const sendLiveChunk = useCallback(async () => {
    // Si el ciclo anterior sigue en vuelo, salteamos este: preferimos perder una
    // actualización antes que encolar peticiones y quedar cada vez más atrasados.
    if (liveInFlightRef.current) return;
    if (audioChunks.current.length === 0) return;

    liveInFlightRef.current = true;
    const seq = ++liveSeqRef.current;
    const controller = new AbortController();
    liveAbortRef.current = controller;

    try {
      const mimeType = mimeTypeRef.current || 'audio/webm';
      const blob = new Blob(audioChunks.current, { type: mimeType });

      // Lectura demasiado larga: dejamos de seguir en vivo antes de chocar con el
      // límite de tamaño del request. La grabación y el análisis final siguen igual.
      if (blob.size > LIVE_MAX_BYTES) {
        stopLiveTranscription();
        return;
      }

      const formData = new FormData();
      formData.append('audio', blob, fileNameForMimeType('parcial', mimeType));
      if (referenceTextRef.current) {
        formData.append('referenceText', referenceTextRef.current);
      }

      const res = await fetch('/api/ai/transcribe-live', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // Descartamos respuestas que llegan tarde y pisarían una más reciente.
      if (seq <= liveAppliedSeqRef.current) return;
      liveAppliedSeqRef.current = seq;

      const text: string = data.text || '';
      setLiveTranscript(text);
      setLiveWords(text.split(/\s+/).filter((w: string) => w.length > 0));
      setLiveStatus('active');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      // Un fallo puntual (rate limit, red del celular) no corta la lectura:
      // reintentamos solo en el siguiente ciclo.
      console.warn('Transcripción en vivo falló, se reintenta:', err?.message || err);
    } finally {
      liveInFlightRef.current = false;
      liveAbortRef.current = null;
    }
  }, [stopLiveTranscription]);

  const startRecording = useCallback(async (options?: StartRecordingOptions) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const preferredMimeType = pickRecordingMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      // Si el navegador ignoró nuestra preferencia, mandamos lo que realmente grabó.
      mimeTypeRef.current = recorder.mimeType || preferredMimeType || 'audio/webm';

      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeTypeRef.current });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      // timeslice: sin esto los datos recién llegan al parar y no habría nada que transcribir en vivo.
      recorder.start(CHUNK_MS);
      setIsRecording(true);

      referenceTextRef.current = options?.referenceText || '';
      if (referenceTextRef.current) {
        liveSeqRef.current = 0;
        liveAppliedSeqRef.current = 0;
        setLiveTranscript('');
        setLiveWords([]);
        setLiveStatus('starting');
        liveFirstTimerRef.current = setTimeout(sendLiveChunk, LIVE_FIRST_MS);
        liveTimerRef.current = setInterval(sendLiveChunk, LIVE_INTERVAL_MS);
      }
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setLiveStatus('error');
      const nombre = err?.name || '';
      if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
        alert('No diste permiso para usar el micrófono.\n\nTocá el candado al lado de la dirección web, entrá en "Permisos" y activá el micrófono. Después recargá la página.');
      } else if (nombre === 'NotFoundError') {
        alert('No se encontró ningún micrófono en este dispositivo.');
      } else {
        alert('No se pudo acceder al micrófono. Revisá que ninguna otra app lo esté usando y volvé a intentar.');
      }
    }
  }, [sendLiveChunk]);

  const stopRecording = useCallback(() => {
    stopLiveTranscription();
    setLiveStatus('idle');
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  }, [stopLiveTranscription]);

  const resetRecording = useCallback(() => {
    stopLiveTranscription();
    audioChunks.current = [];
    setAudioBlob(null);
    setLiveStatus('idle');
    setLiveTranscript('');
    setLiveWords([]);
    setAudioUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [stopLiveTranscription]);

  // Cortar timers y peticiones si el componente se desmonta a mitad de la lectura.
  useEffect(() => stopLiveTranscription, [stopLiveTranscription]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    /** mimeType real de la grabación, necesario para nombrar bien el archivo al enviarlo. */
    audioMimeType: mimeTypeRef.current,
    liveStatus,
    liveTranscript,
    liveWords,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
