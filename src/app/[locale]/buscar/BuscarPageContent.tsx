'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AiOrb from '@/components/ai-search/AiOrb';
import ChatHistory from '@/components/ai-search/ChatHistory';
import SearchInput from '@/components/ai-search/SearchInput';
import type { SearchInputHandle } from '@/components/ai-search/SearchInput';
import SuggestedQuestions from '@/components/ai-search/SuggestedQuestions';
import { useAiSearch } from '@/hooks/useAiSearch';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useIsMobile } from '@/hooks/useMediaQuery';

const AGENT_NAME = 'Kai';

export default function BuscarPageContent() {
  const locale = useLocale();
  const t = useTranslations('aiSearch');
  const isMobile = useIsMobile();
  const { messages, orbState, isLoading, error, sendMessage, reset, pendingRedirect, executePendingRedirect } = useAiSearch();
  const { speak } = useTextToSpeech(locale as 'es' | 'en');
  const [audioLevel, setAudioLevel] = useState(0);
  const [activated, setActivated] = useState(false);
  const inputRef = useRef<SearchInputHandle>(null);

  const hasMessages = messages.length > 0;
  const isRedirecting = orbState === 'success';

  // Speak assistant messages aloud, then redirect if pending
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      speak(lastMsg.content).then(() => {
        if (pendingRedirect) {
          setTimeout(() => executePendingRedirect(), 800);
        }
      });
    }
  }, [messages, speak, pendingRedirect, executePendingRedirect]);

  // Single click: activate + greeting + auto-start mic
  const handleOrbClick = useCallback(() => {
    if (activated) return;
    setActivated(true);

    const greeting = locale === 'es'
      ? '¡Hola! Soy Kai, tu ente inmobiliario. ¿En qué te ayudo hoy?'
      : 'Hi! I\'m Kai, your real estate guide. How can I help you today?';
    speak(greeting);

    setTimeout(() => {
      inputRef.current?.startListening();
    }, 3000);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [activated, locale, speak]);

  const handleSend = useCallback((text: string) => {
    if (!activated) setActivated(true);
    sendMessage(text);
  }, [activated, sendMessage]);

  const handleReset = useCallback(() => {
    reset();
    setActivated(false);
  }, [reset]);

  const handleAudioLevelChange = useCallback((level: number) => {
    setAudioLevel(level);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0a1e33] via-[#152d4a] to-[#0a1e33] overflow-hidden">
      {/* Minimal top bar */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
        </Link>

        {hasMessages && (
          <button
            onClick={handleReset}
            className="text-white/25 hover:text-white/50 text-xs transition-colors"
          >
            {t('newSearch')}
          </button>
        )}
      </div>

      {/* Fullscreen orb + particles — fills entire viewport */}
      <div className="absolute inset-0">
        <motion.div
          className={`absolute inset-0 ${!activated ? 'cursor-pointer' : ''}`}
          onClick={!activated ? handleOrbClick : undefined}
          animate={{
            scale: hasMessages ? 0.45 : 1,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <AiOrb state={orbState} audioLevel={audioLevel} />
        </motion.div>
      </div>

      {/* Floating thought bubbles — on top of particles */}
      <AnimatePresence>
        {!hasMessages && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <SuggestedQuestions
              onSelect={handleSend}
              isMobile={isMobile}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Main content overlay */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0 pointer-events-none">
        {/* Pre-activation: subtle CTA */}
        <AnimatePresence>
          {!activated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-white/20 text-sm font-light tracking-widest mt-40"
            >
              <motion.span
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {t('clickToWrite', { name: AGENT_NAME })}
              </motion.span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Chat history */}
        {hasMessages && (
          <div className="flex-1 w-full max-w-2xl mx-auto min-h-0 overflow-hidden pointer-events-auto mt-16">
            <ChatHistory messages={messages} />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 mx-4 mb-2 text-sm text-red-300 bg-red-500/10 rounded-lg text-center pointer-events-auto"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <AnimatePresence>
        {activated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-30 w-full max-w-2xl mx-auto pb-2"
          >
            <SearchInput
              ref={inputRef}
              onSend={handleSend}
              onListeningChange={() => {}}
              onAudioLevelChange={handleAudioLevelChange}
              isLoading={isLoading}
              disabled={isRedirecting}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
