import { useState, useRef, useCallback, useEffect } from 'react';
import { pickRecordingMimeType, fileNameForMimeType } from './audioFormat';
import { mergeSpokenWords } from './textMatcher';
import { iniciarReconocedorLocal, type ReconocedorActivo } from './reconocedorLocal';

/** Cada cuánto mandamos audio a transcribir mientras el alumno lee. */
const LIVE_INTERVAL_MS = 1500;
/** Primer envío anticipado, para que el resaltado arranque sin dejar la pantalla muerta. */
const LIVE_FIRST_MS = 1200;
/** Timeslice del MediaRecorder: necesitamos chunks disponibles antes de que termine la grabación. */
const CHUNK_MS = 1000;
/**
 * Cuántos segundos de audio manda cada ciclo en modo ventana.
 * Bastante más largo que el intervalo: así las ventanas se solapan y se pueden
 * empalmar aunque se saltee algún ciclo. También le da contexto a Whisper.
 */
const LIVE_WINDOW_MS = 10000;
const LIVE_WINDOW_CHUNKS = Math.ceil(LIVE_WINDOW_MS / CHUNK_MS);
/**
 * Ritmo de lectura rápido (con margen) para acotar cuántas palabras pueden ser
 * nuevas en un ciclo. Un alumno de secundaria lee a unas 2-4 palabras por segundo.
 */
const PALABRAS_POR_SEGUNDO = 5;
/** Ciclos que esperamos tras un 429 de Groq antes de volver a pedir. */
const CICLOS_ESPERA_429 = 4;
/**
 * Tope de reinicios del reconocedor local. Se corta solo tras cada silencio largo y
 * lo reactivamos, pero si falla siempre este tope evita un bucle cerrado de reintentos.
 */
const MAX_REINICIOS_WEBSPEECH = 60;
/**
 * Tope de audio acumulado que seguimos mandando en el modo de respaldo (~3 MB).
 * Vercel corta los request bodies alrededor de 4,5 MB; pasado ese punto dejamos de
 * seguir en vivo, pero la grabación continúa normal y el análisis final no se ve afectado.
 */
const LIVE_MAX_BYTES = 3 * 1024 * 1024;

export type LiveStatus = 'idle' | 'starting' | 'active' | 'error';

/**
 * De dónde salen las palabras que se están resaltando, de mejor a peor:
 * `modelo`     = modelo local con el vocabulario del texto (instantáneo y preciso)
 * `navegador`  = reconocedor del navegador, Web Speech (rápido, menos preciso)
 * `servidor`   = Whisper por red (siempre funciona, más de un segundo de retraso)
 */
export type LiveFuente = 'ninguna' | 'modelo' | 'navegador' | 'servidor';

export interface StartRecordingOptions {
  /** Si se pasa, se transcribe en vivo para ir resaltando el texto mientras se lee. */
  referenceText?: string;
}

/** El truco de pegar la cabecera solo sirve en contenedores por clusters (webm/ogg). */
function soportaVentana(mimeType: string): boolean {
  const base = (mimeType || '').split(';')[0].trim().toLowerCase();
  return base === 'audio/webm' || base === 'audio/ogg';
}

// --- Reconocimiento local del navegador (Web Speech API) ---
// TypeScript no trae estos tipos; declaramos lo mínimo que usamos.

interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly length: number;
  [i: number]: { readonly transcript: string };
}
interface EventoReconocimiento extends Event {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [i: number]: ResultadoReconocimiento };
}
interface Reconocedor extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoReconocimiento) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type ConstructorReconocedor = new () => Reconocedor;

function obtenerReconocedor(): ConstructorReconocedor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Graba el audio de la lectura y, en paralelo, lo va transcribiendo para poder
 * resaltar las palabras en tiempo real.
 *
 * Hay dos caminos para el resaltado y se eligen solos, en este orden:
 *
 * 1. RECONOCIMIENTO LOCAL (Web Speech API) — el rápido.
 *    Corre dentro del dispositivo, sin red, con resultados parciales en décimas de
 *    segundo. Es el único modo de que el resaltado vaya casi al instante.
 *    No siempre se puede: en Chrome de Android el reconocedor nativo quiere el
 *    micrófono en exclusiva y, como `MediaRecorder` ya lo tiene, arranca pero nunca
 *    recibe audio. Por eso no miramos la plataforma: lo intentamos siempre y nos
 *    quedamos con él solo si entrega resultados.
 *
 * 2. WHISPER EN EL SERVIDOR (Groq) — el que siempre funciona.
 *    Arranca en paralelo desde el comienzo y se apaga apenas el reconocimiento
 *    local da señales de vida. Si el local nunca responde, este queda como estaba.
 *    Tiene un piso de latencia de un segundo y pico: es una ida y vuelta por red.
 *
 * El análisis final de la lectura SIEMPRE usa el audio grabado con Whisper, sin
 * importar cuál de los dos haya resaltado en vivo. El reconocimiento local se abre
 * después de que `MediaRecorder` tomó el micrófono, así que la grabación no se ve
 * afectada aunque el reconocedor falle.
 *
 * MODO VENTANA (el normal, webm/ogg):
 * cada ciclo manda solo los últimos ~10 segundos, con el primer chunk pegado
 * adelante porque es el único que lleva la cabecera del contenedor. El envío pesa
 * siempre lo mismo, así que el retraso del resaltado no crece con la lectura.
 * Las transcripciones sucesivas se empalman con `mergeSpokenWords`.
 *
 * MODO COMPLETO (respaldo):
 * manda todo lo grabado desde el inicio, como antes. Se usa en Safari (audio/mp4,
 * donde no se puede recortar así) y si detectamos que el recorte no se decodificó
 * bien: si Whisper informa haber procesado mucho más audio del que mandamos,
 * quiere decir que el contenedor recortado lo confundió y volvemos a este modo.
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
  const modoVentanaRef = useRef(false);
  /** Palabras acumuladas en modo ventana (en modo completo se reemplazan enteras). */
  const palabrasRef = useRef<string[]>([]);
  /** Cuándo se aplicó la última transcripción, para acotar cuántas palabras pueden ser nuevas. */
  const ultimoAplicadoTsRef = useRef(0);
  /** Ciclos pendientes de saltear tras chocar con el límite de peticiones. */
  const saltearCiclosRef = useRef(0);

  // Reconocimiento local: cuando entrega resultados, es la fuente del resaltado.
  const webSpeechRef = useRef<Reconocedor | null>(null);
  const usandoWebSpeechRef = useRef(false);
  /** Texto ya dado por definitivo por el reconocedor (sobrevive a los reinicios). */
  const webSpeechFinalizadoRef = useRef('');
  const webSpeechActivoRef = useRef(false);

  // Modelo local: el mejor camino. Tarda en estar listo la primera vez (baja ~40 MB),
  // asi que arranca en segundo plano y toma el control cuando puede.
  const modeloLocalRef = useRef<ReconocedorActivo | null>(null);
  const usandoModeloRef = useRef(false);
  const [liveFuente, setLiveFuente] = useState<LiveFuente>('ninguna');

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

  const detenerModeloLocal = useCallback(() => {
    usandoModeloRef.current = false;
    const activo = modeloLocalRef.current;
    modeloLocalRef.current = null;
    activo?.detener();
  }, []);

  const detenerWebSpeech = useCallback(() => {
    webSpeechActivoRef.current = false;
    const r = webSpeechRef.current;
    webSpeechRef.current = null;
    if (r) {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      try { r.abort(); } catch { /* ya estaba parado */ }
    }
  }, []);

  /**
   * Arranca el reconocimiento local del navegador.
   *
   * Corre dentro del dispositivo, sin red: los resultados parciales llegan en unas
   * décimas de segundo, contra el segundo y pico que tarda cualquier ida y vuelta
   * al servidor. Es el único camino para que el resaltado vaya casi al instante.
   *
   * No todos los equipos lo permiten mientras `MediaRecorder` tiene el micrófono
   * (en Chrome de Android el reconocedor arranca pero nunca recibe audio). Por eso
   * no miramos la plataforma: lo intentamos siempre y comprobamos si llega algo.
   * Si no llega, sigue mandando a Whisper como hasta ahora. Importante: el
   * reconocedor se abre DESPUÉS de que MediaRecorder ya tomó el micrófono, así que
   * la grabación nunca se ve afectada aunque el reconocedor falle.
   */
  const iniciarWebSpeech = useCallback(() => {
    const Ctor = obtenerReconocedor();
    if (!Ctor) return;

    let r: Reconocedor;
    try {
      r = new Ctor();
    } catch {
      return;
    }

    r.continuous = true;
    r.interimResults = true;   // los parciales son los que dan la sensación de instantáneo
    r.lang = 'es-AR';

    webSpeechFinalizadoRef.current = '';
    webSpeechActivoRef.current = true;
    let reinicios = 0;

    r.onresult = (e) => {
      let parcial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) webSpeechFinalizadoRef.current += res[0].transcript + ' ';
        else parcial += res[0].transcript + ' ';
      }

      const texto = (webSpeechFinalizadoRef.current + parcial).trim();
      if (!texto) return;
      // El modelo local es mejor: si ya esta a cargo, este se calla.
      if (usandoModeloRef.current) return;
      reinicios = 0;   // está entregando resultados: los reinicios previos no cuentan

      // Llegó audio: el reconocimiento local funciona en este equipo. Cortamos el
      // envío a Whisper, que ya no hace falta para el resaltado.
      if (!usandoWebSpeechRef.current) {
        usandoWebSpeechRef.current = true;
        stopLiveTranscription();
        setLiveFuente('navegador');
      }

      const palabras = texto.split(/\s+/).filter(w => w.length > 0);
      palabrasRef.current = palabras;
      setLiveWords(palabras);
      setLiveTranscript(texto);
      setLiveStatus('active');
    };

    r.onerror = (e) => {
      // Errores de los que no se vuelve: no tiene sentido reintentar, seguimos con
      // Whisper. Sin esto `onend` reintentaría en bucle cerrado y calentaría el equipo.
      const motivo = e.error || '';
      if (motivo === 'not-allowed' || motivo === 'service-not-allowed' || motivo === 'audio-capture') {
        webSpeechActivoRef.current = false;
      }
      // El resto (`no-speech`, `network`, `aborted`) son pasajeros: los maneja onend.
    };

    r.onend = () => {
      // El reconocedor se corta solo tras un silencio largo. Mientras el alumno
      // siga grabando lo reactivamos para no perder el resto de la lectura.
      if (!webSpeechActivoRef.current) return;
      if (reinicios >= MAX_REINICIOS_WEBSPEECH) {
        webSpeechActivoRef.current = false;
        return;
      }
      reinicios++;
      try { r.start(); } catch { /* todavía no terminó de cerrar */ }
    };

    try {
      r.start();
      webSpeechRef.current = r;
    } catch {
      webSpeechActivoRef.current = false;
    }
  }, [stopLiveTranscription]);

  /** Arma el blob a mandar: la ventana de los últimos segundos, o todo si estamos en modo completo. */
  const armarBlobEnVivo = useCallback((mimeType: string): { blob: Blob; segundos: number } | null => {
    const chunks = audioChunks.current;
    if (chunks.length === 0) return null;

    if (!modoVentanaRef.current || chunks.length <= LIVE_WINDOW_CHUNKS) {
      return {
        blob: new Blob(chunks, { type: mimeType }),
        segundos: (chunks.length * CHUNK_MS) / 1000,
      };
    }

    // chunks[0] lleva la cabecera del contenedor; sin ella el recorte no se decodifica.
    const ventana = chunks.slice(-LIVE_WINDOW_CHUNKS);
    return {
      blob: new Blob([chunks[0], ...ventana], { type: mimeType }),
      segundos: ((ventana.length + 1) * CHUNK_MS) / 1000,
    };
  }, []);

  /** Manda a transcribir y actualiza las palabras detectadas. */
  const sendLiveChunk = useCallback(async () => {
    // Si el ciclo anterior sigue en vuelo, salteamos este: preferimos perder una
    // actualización antes que encolar peticiones y quedar cada vez más atrasados.
    if (liveInFlightRef.current) return;
    if (audioChunks.current.length === 0) return;
    // Ya hay un reconocedor mas rapido a cargo del resaltado.
    if (usandoWebSpeechRef.current || usandoModeloRef.current) return;
    // Estamos esperando a que se libere el límite de peticiones.
    if (saltearCiclosRef.current > 0) {
      saltearCiclosRef.current--;
      return;
    }

    liveInFlightRef.current = true;
    const seq = ++liveSeqRef.current;
    const eraVentana = modoVentanaRef.current;
    const controller = new AbortController();
    liveAbortRef.current = controller;

    try {
      const mimeType = mimeTypeRef.current || 'audio/webm';
      const armado = armarBlobEnVivo(mimeType);
      if (!armado) return;
      const { blob, segundos } = armado;

      // Solo puede pasar en modo completo: la ventana pesa siempre lo mismo.
      // Lectura demasiado larga, dejamos de seguir en vivo antes de chocar con el
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

      // Límite de peticiones de Groq (un curso entero leyendo a la vez). En vez de
      // insistir cada ciclo y empeorarlo, esperamos unos turnos antes de reintentar.
      if (res.status === 429) {
        saltearCiclosRef.current = CICLOS_ESPERA_429;
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // Descartamos respuestas que llegan tarde y pisarían una más reciente.
      if (seq <= liveAppliedSeqRef.current) return;

      const text: string = data.text || '';
      const palabrasVentana = text.split(/\s+/).filter((w: string) => w.length > 0);

      // ¿El recorte se decodificó como esperábamos? Si Whisper dice haber procesado
      // mucho más audio del que mandamos, el contenedor recortado lo confundió:
      // volvemos a mandar todo desde el inicio y descartamos esta respuesta.
      if (eraVentana && typeof data.duracion === 'number' && data.duracion > segundos * 2 + 5) {
        console.warn(
          `Recorte de audio no soportado (mandamos ${segundos}s, se decodificaron ${data.duracion}s). ` +
          'Se sigue en vivo mandando la lectura completa.'
        );
        modoVentanaRef.current = false;
        return;
      }

      liveAppliedSeqRef.current = seq;

      // En modo ventana la respuesta cubre solo los últimos segundos: hay que
      // empalmarla con lo anterior. En modo completo ya viene la lectura entera.
      let palabras: string[];
      if (eraVentana) {
        // Tope de palabras nuevas si el empalme no logra alinear: lo que entra en el
        // tiempo transcurrido leyendo rápido, con margen.
        const ahora = Date.now();
        const desde = ultimoAplicadoTsRef.current || ahora - LIVE_INTERVAL_MS;
        const segundos = Math.min((ahora - desde) / 1000, LIVE_WINDOW_MS / 1000);
        const maxNuevas = Math.max(2, Math.ceil(segundos * PALABRAS_POR_SEGUNDO));
        palabras = mergeSpokenWords(palabrasRef.current, palabrasVentana, maxNuevas);
        ultimoAplicadoTsRef.current = ahora;
      } else {
        palabras = palabrasVentana;
      }

      palabrasRef.current = palabras;
      setLiveWords(palabras);
      setLiveTranscript(palabras.join(' '));
      setLiveStatus('active');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Un fallo puntual (rate limit, red del celular) no corta la lectura:
      // reintentamos solo en el siguiente ciclo.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Transcripción en vivo falló, se reintenta:', msg);
    } finally {
      liveInFlightRef.current = false;
      liveAbortRef.current = null;
    }
  }, [armarBlobEnVivo, stopLiveTranscription]);

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
        palabrasRef.current = [];
        ultimoAplicadoTsRef.current = 0;
        saltearCiclosRef.current = 0;
        modoVentanaRef.current = soportaVentana(mimeTypeRef.current);
        setLiveTranscript('');
        setLiveWords([]);
        usandoWebSpeechRef.current = false;
        usandoModeloRef.current = false;
        setLiveFuente('servidor');
        setLiveStatus('starting');
        liveFirstTimerRef.current = setTimeout(sendLiveChunk, LIVE_FIRST_MS);
        liveTimerRef.current = setInterval(sendLiveChunk, LIVE_INTERVAL_MS);
        // Se intenta despues de que MediaRecorder ya tomo el microfono: si este
        // equipo no lo permite, el reconocedor no recibe nada y seguimos con Whisper.
        iniciarWebSpeech();

        // El modelo local es el mejor de los tres pero la primera vez tiene que bajar
        // ~40 MB. Arranca en segundo plano y toma el control recien cuando esta listo;
        // hasta entonces resalta cualquiera de los otros dos. Si el dispositivo no da,
        // devuelve null y no se toca nada.
        iniciarReconocedorLocal({
          stream,
          textoReferencia: referenceTextRef.current,
          onTexto: (texto) => {
            if (!texto) return;
            if (!usandoModeloRef.current) {
              usandoModeloRef.current = true;
              stopLiveTranscription();     // Whisper ya no hace falta
              detenerWebSpeech();
              setLiveFuente('modelo');
            }
            const palabras = texto.split(/\s+/).filter(w => w.length > 0);
            palabrasRef.current = palabras;
            setLiveWords(palabras);
            setLiveTranscript(texto);
            setLiveStatus('active');
          },
        }).then(activo => {
          if (!activo) return;
          // La lectura pudo haber terminado mientras el modelo cargaba.
          if (mediaRecorder.current?.state !== 'recording') {
            activo.detener();
            return;
          }
          modeloLocalRef.current = activo;
        });
      }
    } catch (err: unknown) {
      console.error('Error accessing microphone:', err);
      setLiveStatus('error');
      const nombre = err instanceof Error ? err.name : '';
      if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
        alert('No diste permiso para usar el micrófono.\n\nTocá el candado al lado de la dirección web, entrá en "Permisos" y activá el micrófono. Después recargá la página.');
      } else if (nombre === 'NotFoundError') {
        alert('No se encontró ningún micrófono en este dispositivo.');
      } else {
        alert('No se pudo acceder al micrófono. Revisá que ninguna otra app lo esté usando y volvé a intentar.');
      }
    }
  }, [sendLiveChunk, iniciarWebSpeech, stopLiveTranscription, detenerWebSpeech]);

  const stopRecording = useCallback(() => {
    stopLiveTranscription();
    detenerWebSpeech();
    detenerModeloLocal();
    setLiveStatus('idle');
    setLiveFuente('ninguna');
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  }, [stopLiveTranscription, detenerWebSpeech, detenerModeloLocal]);

  const resetRecording = useCallback(() => {
    stopLiveTranscription();
    detenerWebSpeech();
    detenerModeloLocal();
    usandoWebSpeechRef.current = false;
    setLiveFuente('ninguna');
    audioChunks.current = [];
    palabrasRef.current = [];
    ultimoAplicadoTsRef.current = 0;
    setAudioBlob(null);
    setLiveStatus('idle');
    setLiveTranscript('');
    setLiveWords([]);
    setAudioUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [stopLiveTranscription, detenerWebSpeech, detenerModeloLocal]);

  // Cortar timers, peticiones y reconocedor si el componente se desmonta a mitad de la lectura.
  useEffect(() => () => {
    stopLiveTranscription();
    detenerWebSpeech();
    detenerModeloLocal();
  }, [stopLiveTranscription, detenerWebSpeech, detenerModeloLocal]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    /** mimeType real de la grabación, necesario para nombrar bien el archivo al enviarlo. */
    audioMimeType: mimeTypeRef.current,
    liveStatus,
    /** 'local' = reconocimiento del navegador (instantáneo); 'servidor' = Whisper. */
    liveFuente,
    liveTranscript,
    liveWords,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
