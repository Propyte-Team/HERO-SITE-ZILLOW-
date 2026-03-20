import { NextRequest, NextResponse } from 'next/server';
import type { AiSearchRequest, AiSearchResponse } from '@/types/ai-search';
import { getMarketContext, countDevelopments } from '@/lib/ai-search/market-data-fetcher';
import { buildSystemPrompt } from '@/lib/ai-search/system-prompt';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function extractCityFromMessages(messages: Array<{ role: string; content: string }>): string | undefined {
  const cityPatterns = [
    'cancún', 'cancun', 'playa del carmen', 'playa', 'tulum',
    'puerto morelos', 'cozumel', 'mérida', 'merida', 'bacalar', 'guadalajara',
  ];
  const cityMap: Record<string, string> = {
    'cancún': 'Cancún', 'cancun': 'Cancún',
    'playa del carmen': 'Playa del Carmen', 'playa': 'Playa del Carmen',
    'tulum': 'Tulum', 'puerto morelos': 'Puerto Morelos',
    'cozumel': 'Cozumel', 'mérida': 'Mérida', 'merida': 'Mérida',
    'bacalar': 'Bacalar', 'guadalajara': 'Guadalajara',
  };

  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  for (const pattern of cityPatterns) {
    if (allText.includes(pattern)) {
      return cityMap[pattern];
    }
  }
  return undefined;
}

// ── LLM Provider abstraction ──

type LLMProvider = 'groq' | 'gemini';

function detectProvider(): { provider: LLMProvider; apiKey: string } {
  // Prefer Groq (generous free tier: 14,400 req/day)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) return { provider: 'groq', apiKey: groqKey };

  // Fallback to Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) return { provider: 'gemini', apiKey: geminiKey };

  throw new Error('No AI API key configured (GROQ_API_KEY or GEMINI_API_KEY)');
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Groq API error:', response.status, errText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiContents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Route handler ──

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Detect provider
  let provider: LLMProvider;
  let apiKey: string;
  try {
    ({ provider, apiKey } = detectProvider());
  } catch {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  // Parse and validate request
  let body: AiSearchRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, locale = 'es' } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }
  if (messages.length > 10) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 400 });
  }

  for (const msg of messages) {
    if (!msg.content || msg.content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
    }
  }

  try {
    // Detect city from conversation to fetch relevant market data
    const detectedCity = extractCityFromMessages(messages);
    const marketContext = await getMarketContext(detectedCity);

    // Build system prompt with real data
    const systemPrompt = buildSystemPrompt(locale, marketContext);

    // Call LLM
    const rawText = provider === 'groq'
      ? await callGroq(apiKey, systemPrompt, messages)
      : await callGemini(apiKey, systemPrompt, messages);

    // Parse JSON response
    let parsed: AiSearchResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        type: 'question',
        message: rawText || (locale === 'es'
          ? 'Disculpa, no entendí bien. ¿Podrías repetirme qué tipo de propiedad buscas?'
          : 'Sorry, I didn\'t quite get that. Could you tell me what type of property you\'re looking for?'),
      };
    }

    // If redirect, count matching developments
    if (parsed.type === 'redirect' && parsed.filters) {
      const count = await countDevelopments(parsed.filters);
      parsed.resultCount = count;
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
