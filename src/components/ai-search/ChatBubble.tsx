'use client';

import { motion } from 'framer-motion';
import type { ConversationMessage } from '@/types/ai-search';
import MarketInsightCard from './MarketInsightCard';

interface ChatBubbleProps {
  message: ConversationMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isRedirect = message.responseType === 'redirect';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed ${
          isUser
            ? 'bg-[#00B4C8]/10 text-[#1E3A5F] border border-[#00B4C8]/20'
            : isRedirect
              ? 'bg-[#22C55E]/10 text-[#1E3A5F] border border-[#22C55E]/30'
              : 'bg-white text-[#2C2C2C] shadow-sm border border-gray-100'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00B4C8]" />
            <span className="text-xs font-medium text-[#00B4C8]">Propyte AI</span>
          </div>
        )}

        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Market data card for answer type */}
        {message.responseType === 'answer' && message.marketData && (
          <MarketInsightCard data={message.marketData} />
        )}

        {/* Redirect indicator */}
        {isRedirect && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#22C55E]">
            <motion.div
              className="w-3 h-3 border-2 border-[#22C55E] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Redirigiendo a resultados...
          </div>
        )}
      </div>
    </motion.div>
  );
}
