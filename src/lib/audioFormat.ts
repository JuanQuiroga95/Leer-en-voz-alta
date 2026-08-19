/**
 * audioFormat.ts
 * Utilidades para manejar el formato de audio que produce MediaRecorder en cada plataforma.
 *
 * Chrome/Android/Firefox graban en `audio/webm;codecs=opus`, pero Safari (iPhone/iPad)
 * graba en `audio/mp4`. La API de transcripción de Groq valida el formato por la
 * EXTENSIÓN del archivo, así que mandar un mp4 llamado "audio.webm" falla.
 */

/** Formatos que MediaRecorder puede producir y que Groq Whisper acepta, en orden de preferencia. */
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

/**
 * Elige el mejor mimeType soportado por este navegador.
 * Devuelve '' si no hay ninguno explícito (el navegador usará su default).
 */
export function pickRecordingMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

/** Traduce un mimeType de audio a la extensión de archivo que espera Groq Whisper. */
export function extensionForMimeType(mimeType: string | undefined): string {
  const base = (mimeType || '').split(';')[0].trim().toLowerCase();
  switch (base) {
    case 'audio/mp4':
    case 'audio/x-m4a':
      return 'm4a';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/flac':
      return 'flac';
    case 'audio/webm':
    default:
      return 'webm';
  }
}

/** Nombre de archivo con la extensión correcta para el mimeType dado. */
export function fileNameForMimeType(baseName: string, mimeType: string | undefined): string {
  return `${baseName}.${extensionForMimeType(mimeType)}`;
}
