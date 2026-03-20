'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import VoiceButton from './VoiceButton';
import type { VoiceButtonHandle } from './VoiceButton';

interface SearchInputProps {
  onSend: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
  onAudioLevelChange: (level: number) => void;
  isLoading: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface SearchInputHandle {
  focus: () => void;
  startListening: () => void;
}

const SearchInput = forwardRef<SearchInputHandle, SearchInputProps>(function SearchInput({
  onSend,
  onListeningChange,
  onAudioLevelChange,
  isLoading,
  disabled,
  autoFocus = true,
}, ref) {
  const t = useTranslations('aiSearch');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<VoiceButtonHandle>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    startListening: () => voiceRef.current?.startListening(),
  }));

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleVoiceResult(transcript: string) {
    if (transcript.trim()) {
      onSend(transcript.trim());
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border-t border-white/10 rounded-t-2xl"
    >
      <VoiceButton
        ref={voiceRef}
        onResult={handleVoiceResult}
        onListeningChange={onListeningChange}
        onAudioLevelChange={onAudioLevelChange}
        disabled={isLoading || disabled}
      />

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={t('placeholder')}
        disabled={isLoading || disabled}
        maxLength={500}
        className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white placeholder:text-white/40 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#00B4C8]/40 disabled:opacity-50 transition-all border border-white/10"
      />

      <button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00B4C8] text-white flex items-center justify-center hover:bg-[#009AB0] disabled:opacity-20 disabled:hover:bg-[#00B4C8] transition-colors"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </form>
  );
});

export default SearchInput;
