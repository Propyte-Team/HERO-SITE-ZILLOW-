import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

// ============================================================
// PROPERTY QUERIES
// ============================================================

export interface PropertyFilters {
  city?: string;
  zone?: string;
  type?: string;
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
  minRoi?: number;
  bedrooms?: number;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'roi';
}

export async function getProperties(client: Client, filters: PropertyFilters = {}) {
  let query = client
    .from('properties')
    .select('*, developers(name, logo_url, verified)', { count: 'exact' })
    .eq('published', true);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.zone) query = query.eq('zone', filters.zone);
  if (filters.type) query = query.eq('property_type', filters.type);
  if (filters.stage) query = query.eq('stage', filters.stage);
  if (filters.minPrice) query = query.gte('price_mxn', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_mxn', filters.maxPrice);
  if (filters.minRoi) query = query.gte('roi_projected', filters.minRoi);
  if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
  if (filters.featured) query = query.eq('featured', true);

  if (filters.search) {
    query = query.textSearch('fts', filters.search, { type: 'websearch', config: 'spanish' });
  }

  // Ordering
  switch (filters.orderBy) {
    case 'price_asc':
      query = query.order('price_mxn', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_mxn', { ascending: false });
      break;
    case 'roi':
      query = query.order('roi_projected', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function getPropertyBySlug(client: Client, slug: string) {
  return client
    .from('properties')
    .select('*, developers(name, logo_url, verified, slug)')
    .eq('slug', slug)
    .single();
}

export async function getSimilarProperties(client: Client, property: { id: string; city: string; property_type: string }, limit = 4) {
  return client
    .from('properties')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .neq('id', property.id)
    .or(`city.eq.${property.city},property_type.eq.${property.property_type}`)
    .limit(limit);
}

export async function getFeaturedProperties(client: Client, limit = 6) {
  return client
    .from('properties')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
}

// ============================================================
// LEAD QUERIES
// ============================================================

export async function createLead(client: Client, data: Record<string, unknown>) {
  return client.from('leads').insert(data).select().single();
}

export async function getLeads(client: Client, filters: { status?: string; limit?: number; offset?: number } = {}) {
  let query = client
    .from('leads')
    .select('*, properties(name, slug, city)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function updateLeadStatus(client: Client, id: string, status: string) {
  return client.from('leads').update({ status }).eq('id', id);
}

// ============================================================
// DEVELOPER QUERIES
// ============================================================

export async function getDevelopers(client: Client) {
  return client
    .from('developers')
    .select('*, properties(count)')
    .order('name');
}

export async function getDeveloperBySlug(client: Client, slug: string) {
  return client
    .from('developers')
    .select('*')
    .eq('slug', slug)
    .single();
}

// ============================================================
// ANALYTICS QUERIES
// ============================================================

export async function trackPropertyEvent(
  client: Client,
  propertyId: string,
  eventType: string,
  locale = 'es',
) {
  return client.from('property_views').insert({
    property_id: propertyId,
    event_type: eventType,
    locale,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
  });
}

export async function getPropertyStats(client: Client, propertyId: string) {
  return client
    .from('property_views')
    .select('event_type')
    .eq('property_id', propertyId);
}

// ============================================================
// ADMIN: PROPERTY CRUD
// ============================================================

export async function createProperty(client: Client, data: Record<string, unknown>) {
  return client.from('properties').insert(data).select().single();
}

export async function updateProperty(client: Client, id: string, data: Record<string, unknown>) {
  return client.from('properties').update(data).eq('id', id).select().single();
}

export async function deleteProperty(client: Client, id: string) {
  return client.from('properties').delete().eq('id', id);
}

// ============================================================
// ADMIN: BULK IMPORT
// ============================================================

export async function bulkInsertProperties(client: Client, properties: Record<string, unknown>[]) {
  return client.from('properties').insert(properties).select();
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function getCurrentProfile(client: Client) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
