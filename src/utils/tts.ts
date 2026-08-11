'use client';

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

/**
 * Carga las voces del navegador de forma async-safe.
 * Se resuelve cuando las voces están listas (a veces tarda en Chrome/Vercel prod).
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesLoaded = true;
      resolve(voices);
      return;
    }

    // Todavía no cargaron, esperamos el evento
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    };

    // Fallback por si el evento nunca dispara (pasa en algunos navegadores)
    setTimeout(() => {
      if (!voicesLoaded) {
        cachedVoices = window.speechSynthesis.getVoices();
        resolve(cachedVoices);
      }
    }, 1000);
  });
}

/**
 * Busca la mejor voz en español disponible, con fallbacks en cascada.
 * Prioridad: Laura (Windows) > cualquier es-ES > cualquier es-* > primera voz disponible
 */
export async function getBestSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = voicesLoaded ? cachedVoices : await loadVoices();

  if (voices.length === 0) {
    console.warn('[TTS] No hay voces disponibles en este navegador/dispositivo');
    return null;
  }

  const laura = voices.find(v => v.name.includes('Laura'));
  if (laura) return laura;

  const helena = voices.find(v => v.name.includes('Helena'));
  if (helena) return helena;

  const sabina = voices.find(v => v.name.includes('Sabina'));
  if (sabina) return sabina;

  const esES = voices.find(v => v.lang === 'es-ES');
  if (esES) return esES;

  const esAny = voices.find(v => v.lang.startsWith('es'));
  if (esAny) return esAny;

  console.warn('[TTS] No se encontró voz en español, usando la primera disponible:', voices[0]?.name);
  return voices[0] ?? null;
}

/**
 * Función principal para que Yachaq hable.
 * IMPORTANTE: debe llamarse dentro de un evento de click/tap del usuario,
 * no automáticamente en un useEffect, o Safari/iOS la bloquea.
 */
export async function speak(text: string, options?: { rate?: number; pitch?: number; volume?: number; onStart?: () => void; onEnd?: () => void }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[TTS] speechSynthesis no disponible en este entorno');
    options?.onEnd?.();
    return;
  }

  // Cancelar cualquier audio previo para que no se solapen
  window.speechSynthesis.cancel();

  const voice = await getBestSpanishVoice();
  const utterance = new SpeechSynthesisUtterance(text);

  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'es-ES';
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = options?.pitch ?? 1;
  utterance.volume = options?.volume ?? 1;

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
