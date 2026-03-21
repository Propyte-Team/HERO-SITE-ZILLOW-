'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Locale = 'es' | 'en';

interface TextToSpeechHook {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

const VOICE_LANG_MAP: Record<Locale, { preferred: string; fallbackPrefix: string }> = {
  es: { preferred: 'es-MX', fallbackPrefix: 'es' },
  en: { preferred: 'en-US', fallbackPrefix: 'en' },
};

const RATE_MAP: Record<Locale, number> = {
  es: 0.85,
  en: 0.88,
};

const PAUSE_BETWEEN_SENTENCES_MS = 300;

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

  const preferFemale = (list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const femaleKeywords = /female|mujer|femenin|woman/i;
    return list.find((v) => femaleKeywords.test(v.name)) ?? list[0];
  };

  if (exactMatches.length > 0) return preferFemale(exactMatches) ?? exactMatches[0];
  if (regionMatches.length > 0) return preferFemale(regionMatches) ?? regionMatches[0];

  const anyMatch = voices.find((v) => v.lang.toLowerCase().startsWith(fallbackPrefix));
  if (anyMatch) return anyMatch;

  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits text into sentences at punctuation boundaries.
 */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?;]+[.!?;]?/g);
  return (parts || [text]).map((s) => s.trim()).filter(Boolean);
}

export function useTextToSpeech(locale: Locale = 'es'): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cancelledRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined';

  // Voices are loaded asynchronously in some browsers.
  useEffect(() => {
    if (!isSupported) return;

    const handleVoicesChanged = () => {
      voicesLoadedRef.current = true;
    };

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported]);

  /**
   * Speaks a single sentence and returns a Promise that resolves when done.
   * Includes a timeout fallback for browsers where onend doesn't fire.
   */
  const speakSentence = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!isSupported || cancelledRef.current) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = RATE_MAP[locale];
        utterance.pitch = 1.0;

        const voices = speechSynthesis.getVoices();
        const voice = pickVoice(voices, locale);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = VOICE_LANG_MAP[locale].preferred;
        }

        // Timeout fallback: rough estimate of speech duration
        const timeoutMs = Math.max(3000, text.length * 80);
        const timeout = setTimeout(() => {
          resolve();
        }, timeoutMs);

        utterance.onend = () => {
          clearTimeout(timeout);
          resolve();
        };
        utterance.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };

        speechSynthesis.speak(utterance);
      });
    },
    [isSupported, locale],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    cancelledRef.current = true;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing speech before starting
      speechSynthesis.cancel();
      cancelledRef.current = false;

      const sentences = splitSentences(text);

      setIsSpeaking(true);

      for (let i = 0; i < sentences.length; i++) {
        if (cancelledRef.current) break;

        await speakSentence(sentences[i]);

        // Pause between sentences (not after the last one)
        if (i < sentences.length - 1 && !cancelledRef.current) {
          await delay(PAUSE_BETWEEN_SENTENCES_MS);
        }
      }

      setIsSpeaking(false);
    },
    [isSupported, speakSentence],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        cancelledRef.current = true;
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { isSpeaking, isSupported, speak, stop };
}
