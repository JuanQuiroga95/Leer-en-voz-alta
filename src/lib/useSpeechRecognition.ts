/**
 * useSpeechRecognition.ts
 * Hook de React para reconocimiento de voz en tiempo real usando la Web Speech API.
 * Optimizado para español argentino y lectura de niños/adolescentes.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Tipos para la Web Speech API (no están en los tipos estándar de TS)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface SpeechRecognitionResult {
  transcript: string;      // Todo lo transcripto hasta ahora (final)
  interimTranscript: string; // Transcripción parcial en progreso
  allWords: string[];      // Todas las palabras finales
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [allWords, setAllWords] = useState<string[]>([]);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');
  const shouldRestartRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Limpiar instancia anterior
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-AR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
          finalTranscriptRef.current = finalText;
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(finalText.trim());
      setInterimTranscript(interim);

      // Actualizar array de todas las palabras (finales + interim)
      const combinedText = (finalText + ' ' + interim).trim();
      const words = combinedText.split(/\s+/).filter(w => w.length > 0);
      setAllWords(words);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      // 'no-speech' y 'aborted' son normales, los ignoramos.
      // El onend se encarga de reiniciar.
    };

    recognition.onend = () => {
      // Chrome detiene la escucha periódicamente (cada ~30s de silencio o al límite del audio).
      // Reiniciamos automáticamente si debemos seguir escuchando.
      if (shouldRestartRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (err) {
              console.warn("No se pudo reiniciar speech recognition:", err);
              // Intentar una última vez con delay más largo
              restartTimeoutRef.current = setTimeout(() => {
                if (shouldRestartRef.current) {
                  try { recognition.start(); } catch { /* give up */ }
                }
              }, 1000);
            }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setAllWords([]);

    try {
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => setIsListening(false);
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
  }, []);

  const resetRecognition = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }
    recognitionRef.current = null;
    finalTranscriptRef.current = '';
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    setAllWords([]);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    allWords,
    startListening,
    stopListening,
    resetRecognition,
  };
}
