export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success';

export type AiResponseType = 'question' | 'redirect' | 'answer';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  responseType?: AiResponseType;
  filters?: SearchFilters;
  marketData?: MarketDataPayload;
}

export interface SearchFilters {
  city?: string;
  zone?: string;
  type?: string;
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minRoi?: number;
  search?: string;
}

export interface MarketDataPayload {
  occupancy?: number;
  adr?: number;
  avgRent?: number;
  medianRent?: number;
  totalListings?: number;
  yieldGross?: number;
}

export interface AiSearchRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  locale: string;
}

export interface AiSearchResponse {
  type: AiResponseType;
  message: string;
  filters?: SearchFilters;
  marketData?: MarketDataPayload;
  resultCount?: number;
}
