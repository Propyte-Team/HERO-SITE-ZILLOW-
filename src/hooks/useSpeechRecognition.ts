'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  audioLevel: number;
  start: () => void;
  stop: () => void;
}

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useSpeechRecognition(locale: string = 'es'): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

  const stopAudioAnalysis = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // Microphone access denied — speech recognition still works, just no audio level
    }
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = locale === 'es' ? 'es-MX' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results: SpeechRecognitionResult[] = [];
      for (let i = 0; i < event.results.length; i++) {
        results.push(event.results[i]);
      }
      const text = results.map(r => r[0].transcript).join('');
      setTranscript(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      stopAudioAnalysis();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioAnalysis();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioAnalysis();
  }, [locale, startAudioAnalysis, stopAudioAnalysis]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  return { isListening, transcript, isSupported, audioLevel, start, stop };
}
