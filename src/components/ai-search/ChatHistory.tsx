'use client';

import { useRef, useEffect } from 'react';
import type { ConversationMessage } from '@/types/ai-search';
import ChatBubble from './ChatBubble';

interface ChatHistoryProps {
  messages: ConversationMessage[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth">
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
