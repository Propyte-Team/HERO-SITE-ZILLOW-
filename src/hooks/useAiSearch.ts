'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { OrbState, ConversationMessage, AiSearchResponse, SearchFilters } from '@/types/ai-search';

interface UseAiSearchReturn {
  messages: ConversationMessage[];
  orbState: OrbState;
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
  pendingRedirect: string | null;
  executePendingRedirect: () => void;
}

function filtersToSearchParams(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.zone) params.set('zone', filters.zone);
  if (filters.type) params.set('type', filters.type);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.minPrice) params.set('priceMin', String(filters.minPrice));
  if (filters.maxPrice) params.set('priceMax', String(filters.maxPrice));
  if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms));
  if (filters.minRoi) params.set('roiMin', String(filters.minRoi));
  if (filters.search) params.set('search', filters.search);
  return params.toString();
}

export function useAiSearch(): UseAiSearchReturn {
  const router = useRouter();
  const locale = useLocale();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);

    // Add user message
    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setOrbState('thinking');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const conversationHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory, locale }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en el servicio de IA');
      }

      const data: AiSearchResponse = await response.json();

      // Add assistant message
      const assistantMsg: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        responseType: data.type,
        filters: data.filters,
        marketData: data.marketData,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Handle state transitions based on response type
      if (data.type === 'redirect' && data.filters) {
        setOrbState('success');
        // Store redirect URL — the page component will navigate after speech ends
        const params = filtersToSearchParams(data.filters);
        setPendingRedirect(`/${locale}/propiedades${params ? '?' + params : ''}`);
      } else {
        setOrbState('speaking');
        // Return to idle after "speaking" animation
        setTimeout(() => setOrbState('idle'), 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Algo salió mal';
      setError(errorMessage);
      setOrbState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, locale]);

  const executePendingRedirect = useCallback(() => {
    if (pendingRedirect) {
      router.push(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [pendingRedirect, router]);

  const reset = useCallback(() => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    setMessages([]);
    setOrbState('idle');
    setIsLoading(false);
    setError(null);
    setPendingRedirect(null);
  }, []);

  return { messages, orbState, isLoading, error, sendMessage, reset, pendingRedirect, executePendingRedirect };
}
