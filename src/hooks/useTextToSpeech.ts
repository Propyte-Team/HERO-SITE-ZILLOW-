'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Locale = 'es' | 'en';

interface TextToSpeechHook {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

const VOICE_LANG_MAP: Record<Locale, { preferred: string; fallbackPrefix: string }> = {
  es: { preferred: 'es-MX', fallbackPrefix: 'es' },
  en: { preferred: 'en-US', fallbackPrefix: 'en' },
};

/**
 * Picks the best available voice for the given locale.
 * Priority: exact match (es-MX) → any regional match (es-*) → default.
 * Within each tier, female voices are preferred for a friendly assistant feel.
 */
function pickVoice(voices: SpeechSynthesisVoice[], locale: Locale): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const { preferred, fallbackPrefix } = VOICE_LANG_MAP[locale];

  const exactMatches = voices.filter((v) => v.lang === preferred);
  const regionMatches = voices.filter(
    (v) => v.lang.startsWith(fallbackPrefix) && v.lang !== preferred,
  );

  // Prefer female voices within a tier — many engines include "female" or "mujer" in the name.
  const preferFemale = (list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const femaleKeywords = /female|mujer|femenin|woman/i;
    return list.find((v) => femaleKeywords.test(v.name)) ?? list[0];
  };

  if (exactMatches.length > 0) return preferFemale(exactMatches) ?? exactMatches[0];
  if (regionMatches.length > 0) return preferFemale(regionMatches) ?? regionMatches[0];

  // Last resort: any voice matching the prefix loosely
  const anyMatch = voices.find((v) => v.lang.toLowerCase().startsWith(fallbackPrefix));
  if (anyMatch) return anyMatch;

  return null;
}

export function useTextToSpeech(locale: Locale = 'es'): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined';

  // Voices are loaded asynchronously in some browsers.
  // We eagerly trigger the load so they are ready when speak() is called.
  useEffect(() => {
    if (!isSupported) return;

    const handleVoicesChanged = () => {
      voicesLoadedRef.current = true;
    };

    // Some browsers (Chrome) fire voiceschanged, others (Safari) return voices immediately.
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Trigger initial load
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing speech before starting a new one
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = speechSynthesis.getVoices();
      const voice = pickVoice(voices, locale);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        // Fall back to BCP-47 tag so the engine picks its default for the locale
        utterance.lang = VOICE_LANG_MAP[locale].preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isSupported, locale],
  );

  // Cleanup on unmount — stop any ongoing speech
  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { isSpeaking, isSupported, speak, stop };
}
