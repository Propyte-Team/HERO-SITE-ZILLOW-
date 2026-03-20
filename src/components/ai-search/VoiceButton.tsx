'use client';

import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceButtonProps {
  onResult: (transcript: string) => void;
  onListeningChange: (listening: boolean) => void;
  onAudioLevelChange: (level: number) => void;
  disabled?: boolean;
}

export interface VoiceButtonHandle {
  startListening: () => void;
  stopListening: () => void;
}

const VoiceButton = forwardRef<VoiceButtonHandle, VoiceButtonProps>(function VoiceButton({
  onResult,
  onListeningChange,
  onAudioLevelChange,
  disabled,
}, ref) {
  const locale = useLocale();
  const { isListening, transcript, isSupported, audioLevel, start, stop } = useSpeechRecognition(locale);

  useImperativeHandle(ref, () => ({
    startListening: start,
    stopListening: stop,
  }));

  useEffect(() => {
    onListeningChange(isListening);
  }, [isListening, onListeningChange]);

  useEffect(() => {
    onAudioLevelChange(audioLevel);
  }, [audioLevel, onAudioLevelChange]);

  // Send transcript when speech ends
  useEffect(() => {
    if (!isListening && transcript) {
      onResult(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stop : start}
      disabled={disabled}
      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isListening
          ? 'bg-red-500/80 text-white animate-pulse'
          : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/70'
      } disabled:opacity-30`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
});

export default VoiceButton;
