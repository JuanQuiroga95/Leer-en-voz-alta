/**
 * reconocedorLocal.ts
 * Reconocimiento de voz corriendo entero dentro del navegador (Vosk sobre WebAssembly).
 *
 * POR QUÉ ESTE CAMINO
 * Cualquier transcripción en el servidor tiene un piso de latencia de una ida y
 * vuelta por red: aunque el audio pese nada, es más de un segundo. Acá el modelo
 * corre en el dispositivo, así que los resultados parciales salen en décimas de
 * segundo y no cuestan nada por uso.
 *
 * POR QUÉ NO CONFUNDE COMO UNA TRANSCRIPCIÓN GENERAL
 * Nosotros ya sabemos qué texto tiene que leer el alumno. En vez de pedirle al
 * reconocedor que adivine entre todo el español, le pasamos como gramática las
 * palabras de ESE texto: no puede devolver nada que no esté ahí. Eso sube mucho
 * la precisión y de paso lo hace más rápido.
 *
 * CONVIVE CON LA GRABACIÓN
 * Se engancha a la misma `MediaStream` que ya está usando `MediaRecorder`, a través
 * de Web Audio. A diferencia de la Web Speech API, esto no pelea por el micrófono,
 * así que también funciona en Android.
 *
 * El modelo pesa unos 40 MB. Se baja una sola vez por dispositivo (queda en la
 * caché del navegador) y mientras tanto el resaltado sigue andando por el camino
 * anterior; este toma el control recién cuando está listo.
 */

import type { Model, KaldiRecognizer } from 'vosk-browser';
import { normalizeWord } from './textMatcher';

/** Dónde está el modelo empaquetado. Servido por Vercel desde `public/`. */
const URL_MODELO = '/modelos/vosk-es.tar.gz';

/**
 * Tamaño del bloque de audio que se le pasa al reconocedor. Más chico baja la
 * latencia pero llama más seguido; 4096 muestras son ~85 ms a 48 kHz.
 */
const MUESTRAS_POR_BLOQUE = 4096;

export interface OpcionesReconocedor {
  /** La misma stream que está grabando, para no abrir un segundo micrófono. */
  stream: MediaStream;
  /** Texto que el alumno tiene que leer: define el vocabulario permitido. */
  textoReferencia: string;
  /** Se llama con el texto reconocido hasta el momento, muchas veces por segundo. */
  onTexto: (texto: string) => void;
}

export interface ReconocedorActivo {
  detener: () => void;
}

/**
 * El modelo se baja y se compila una sola vez por pestaña, aunque el alumno lea
 * varios textos seguidos. Guardamos la promesa, no el resultado, para que dos
 * lecturas casi simultáneas no disparen dos descargas.
 */
let modeloPrometido: Promise<Model> | null = null;

function cargarModelo(): Promise<Model> {
  if (!modeloPrometido) {
    modeloPrometido = import('vosk-browser')
      .then(vosk => vosk.createModel(URL_MODELO))
      .catch(err => {
        // Si falló, la próxima lectura vuelve a intentar en vez de quedar rota.
        modeloPrometido = null;
        throw err;
      });
  }
  return modeloPrometido;
}

/**
 * Arma la gramática: las palabras del texto, sin repetir.
 *
 * `[unk]` es obligatorio. Sin él, el reconocedor está forzado a devolver SIEMPRE
 * alguna palabra de la lista, así que ante una tos o una duda inventa la que más
 * se le parezca y el resaltado avanza solo. Con `[unk]` puede decir "esto no era
 * ninguna" y el cursor se queda quieto, que es lo correcto.
 */
function armarGramatica(texto: string): string {
  const palabras = new Set<string>();
  for (const bruta of texto.split(/\s+/)) {
    const limpia = normalizeWord(bruta);
    if (limpia.length > 0) palabras.add(limpia);
  }
  return JSON.stringify([...palabras, '[unk]']);
}

/**
 * Arranca el reconocimiento local. Devuelve `null` si este dispositivo no puede
 * (sin WebAssembly, modelo que no baja, memoria insuficiente): en ese caso el
 * llamador se queda con el camino que ya venía usando.
 */
export async function iniciarReconocedorLocal(
  opciones: OpcionesReconocedor
): Promise<ReconocedorActivo | null> {
  const { stream, textoReferencia, onTexto } = opciones;

  let modelo: Model;
  try {
    modelo = await cargarModelo();
  } catch (err) {
    console.warn('No se pudo cargar el modelo de reconocimiento local:', err);
    return null;
  }

  let contexto: AudioContext | null = null;
  let reconocedor: KaldiRecognizer | null = null;

  try {
    const Contexto: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    contexto = new Contexto();

    reconocedor = new modelo.KaldiRecognizer(contexto.sampleRate, armarGramatica(textoReferencia));

    // Lo definitivo se acumula; lo parcial es la frase que se está diciendo ahora.
    // Hay que sumar las dos: el parcial se vacía cada vez que una frase se cierra.
    let definitivo = '';

    reconocedor.on('result', (mensaje) => {
      if (!('result' in mensaje) || !('text' in mensaje.result)) return;
      const texto = mensaje.result.text;
      if (!texto) return;
      definitivo += texto + ' ';
      onTexto(definitivo.trim());
    });

    reconocedor.on('partialresult', (mensaje) => {
      if (!('result' in mensaje) || !('partial' in mensaje.result)) return;
      const completo = (definitivo + mensaje.result.partial).trim();
      if (completo) onTexto(completo);
    });

    const fuente = contexto.createMediaStreamSource(stream);
    const procesador = contexto.createScriptProcessor(MUESTRAS_POR_BLOQUE, 1, 1);

    procesador.onaudioprocess = (evento) => {
      try {
        reconocedor?.acceptWaveform(evento.inputBuffer);
      } catch {
        // Un bloque suelto que falla no debe cortar la lectura.
      }
    };

    // El nodo de procesamiento solo corre si la cadena llega al destino. Va por un
    // volumen en cero: necesitamos que procese, no que el alumno se escuche a sí mismo.
    const silencio = contexto.createGain();
    silencio.gain.value = 0;

    fuente.connect(procesador);
    procesador.connect(silencio);
    silencio.connect(contexto.destination);

    return {
      detener: () => {
        procesador.onaudioprocess = null;
        try { fuente.disconnect(); } catch { /* ya desconectado */ }
        try { procesador.disconnect(); } catch { /* ya desconectado */ }
        try { silencio.disconnect(); } catch { /* ya desconectado */ }
        try { reconocedor?.remove(); } catch { /* ya liberado */ }
        // El modelo NO se libera: sirve para la próxima lectura sin volver a bajarlo.
        contexto?.close().catch(() => { /* ya cerrado */ });
      },
    };
  } catch (err) {
    console.warn('No se pudo iniciar el reconocimiento local:', err);
    try { reconocedor?.remove(); } catch { /* nada que liberar */ }
    contexto?.close().catch(() => { /* nada que cerrar */ });
    return null;
  }
}
