import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

// ============================================================
// DEVELOPMENT QUERIES (replaces old property queries)
// ============================================================

export interface DevelopmentFilters {
  city?: string;
  zone?: string;
  zoneId?: string;
  plaza?: string;
  type?: string;        // property_types contains
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
  minRoi?: number;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'roi' | 'units';
}

export async function getDevelopments(client: Client, filters: DevelopmentFilters = {}) {
  let query = client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)', { count: 'exact' })
    .eq('published', true)
    .is('deleted_at', null);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.zone) query = query.eq('zone', filters.zone);
  if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
  if (filters.plaza) query = query.eq('plaza', filters.plaza);
  if (filters.type) query = query.contains('property_types', [filters.type]);
  if (filters.stage) query = query.eq('stage', filters.stage);
  if (filters.minPrice) query = query.gte('price_min_mxn', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_min_mxn', filters.maxPrice);
  if (filters.minRoi) query = query.gte('roi_projected', filters.minRoi);
  if (filters.featured) query = query.eq('featured', true);

  if (filters.search) {
    query = query.textSearch('fts', filters.search, { type: 'websearch', config: 'spanish' });
  }

  switch (filters.orderBy) {
    case 'price_asc':
      query = query.order('price_min_mxn', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price_min_mxn', { ascending: false });
      break;
    case 'roi':
      query = query.order('roi_projected', { ascending: false, nullsFirst: false });
      break;
    case 'units':
      query = query.order('available_units', { ascending: false, nullsFirst: false });
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

export async function getDevelopmentBySlug(client: Client, slug: string) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
}

export async function getDevelopmentWithUnits(client: Client, slug: string) {
  // Get development
  const { data: dev, error: devError } = await client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (devError || !dev) return { data: null, error: devError };

  // Get its units
  const { data: units, error: unitsError } = await client
    .from('units')
    .select('*')
    .eq('development_id', dev.id)
    .is('deleted_at', null)
    .order('unit_number', { ascending: true });

  return {
    data: { ...dev, units: units || [] },
    error: unitsError,
  };
}

export async function getSimilarDevelopments(client: Client, dev: { id: string; city: string; stage: string }, limit = 4) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .is('deleted_at', null)
    .neq('id', dev.id)
    .or(`city.eq.${dev.city},stage.eq.${dev.stage}`)
    .limit(limit);
}

export async function getFeaturedDevelopments(client: Client, limit = 6) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .eq('featured', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getDevelopmentsByCity(client: Client, city: string) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)', { count: 'exact' })
    .eq('published', true)
    .eq('city', city)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
}

export async function getCityCounts(client: Client) {
  // Returns count of developments per city
  return client
    .from('developments')
    .select('city', { count: 'exact', head: false })
    .eq('published', true)
    .is('deleted_at', null);
}

// ============================================================
// UNIT QUERIES
// ============================================================

export async function getUnitBySlug(client: Client, slug: string) {
  return client
    .from('units')
    .select('*, developments(name, slug, city, zone, developers(name, logo_url))')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
}

export async function getAvailableUnits(client: Client, developmentId: string) {
  return client
    .from('units')
    .select('*')
    .eq('development_id', developmentId)
    .eq('status', 'disponible')
    .is('deleted_at', null)
    .order('price_mxn', { ascending: true });
}

// ============================================================
// CONTACT/LEAD QUERIES (unified)
// ============================================================

export async function createContact(client: Client, data: Record<string, unknown>) {
  return client.from('contacts').insert(data).select().single();
}

export async function getContacts(client: Client, filters: { status?: string; temperature?: string; limit?: number; offset?: number } = {}) {
  let query = client
    .from('contacts')
    .select('*, developments:source_development_id(name, slug, city)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.temperature) query = query.eq('temperature', filters.temperature);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function updateContactStatus(client: Client, id: string, status: string) {
  return client.from('contacts').update({ status }).eq('id', id);
}

// ============================================================
// DEVELOPER QUERIES
// ============================================================

export async function getDevelopers(client: Client) {
  return client
    .from('developers')
    .select('*, developments(count)')
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
// ANALYTICS: WEB EVENTS
// ============================================================

export async function trackWebEvent(
  client: Client,
  developmentId: string,
  eventType: string,
  locale = 'es',
) {
  // Aggregate into fact_web_events (daily)
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  const columnMap: Record<string, string> = {
    view: 'page_views',
    whatsapp_click: 'whatsapp_clicks',
    call_click: 'call_clicks',
    form_submit: 'form_submissions',
    share: 'shares',
    save: 'saves',
  };

  const column = columnMap[eventType] || 'page_views';

  // Try upsert with increment
  const { error } = await client.rpc('increment_web_event', {
    p_event_date: today,
    p_week_start: weekStart,
    p_development_id: developmentId,
    p_column: column,
  });

  // Fallback: direct insert if RPC not available
  if (error) {
    return client.from('fact_web_events').upsert({
      event_date: today,
      week_start: weekStart,
      development_id: developmentId,
      page_type: 'detail',
      [column]: 1,
    }, { onConflict: 'event_date,development_id,page_type' });
  }
}

// ============================================================
// ANALYTICS: DASHBOARD QUERIES
// ============================================================

export async function getInventorySnapshot(client: Client, developmentId: string, weeks = 12) {
  return client
    .from('fact_inventory_weekly')
    .select('*')
    .eq('development_id', developmentId)
    .order('week_start', { ascending: false })
    .limit(weeks);
}

export async function getLeadsByWeek(client: Client, zoneId?: string, weeks = 12) {
  let query = client
    .from('fact_leads')
    .select('week_start, channel_id, qualified, converted')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10));

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

export async function getMarketingSpend(client: Client, weeks = 12) {
  return client
    .from('fact_marketing_spend')
    .select('*')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10))
    .order('week_start', { ascending: false });
}

export async function getMmmData(client: Client, zoneId?: string) {
  let query = client
    .from('mv_mmm_weekly')
    .select('*')
    .order('week_start', { ascending: true });

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

// ============================================================
// RENTAL ESTIMATE QUERIES
// ============================================================

export interface RentalEstimate {
  city: string;
  zone: string | null;
  property_type: string;
  bedrooms: number | null;
  rental_type: string;
  sample_size: number;
  median_rent_mxn: number;
  avg_rent_mxn: number;
  p25_rent_mxn: number;
  p75_rent_mxn: number;
  min_rent_mxn: number;
  max_rent_mxn: number;
  avg_rent_per_m2: number | null;
  last_updated: string;
}

/**
 * Get rental estimate by querying rental_comparables directly.
 * Computes aggregates in JS since Supabase REST doesn't support percentile_cont.
 * Falls back: zone+type+beds → city+type+beds → city+type → city.
 */
export async function getRentalEstimate(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
  rentalType: string = 'residencial',
): Promise<{ data: RentalEstimate | null; fallback: boolean }> {
  const MIN_SAMPLE = 3;

  // Build queries in fallback order
  const attempts: Array<{ filter: Record<string, unknown>; isFallback: boolean }> = [];

  if (zone && propertyType && bedrooms) {
    attempts.push({ filter: { city, zone, property_type: propertyType, bedrooms, rental_type: rentalType }, isFallback: false });
  }
  if (propertyType && bedrooms) {
    attempts.push({ filter: { city, property_type: propertyType, bedrooms, rental_type: rentalType }, isFallback: true });
  }
  if (propertyType) {
    attempts.push({ filter: { city, property_type: propertyType, rental_type: rentalType }, isFallback: true });
  }
  attempts.push({ filter: { city, rental_type: rentalType }, isFallback: true });

  for (const attempt of attempts) {
    let query = client
      .from('rental_comparables')
      .select('monthly_rent_mxn, area_m2, bedrooms, zone')
      .eq('active', true);

    for (const [key, value] of Object.entries(attempt.filter)) {
      if (value != null) {
        query = query.eq(key, value);
      }
    }

    const { data } = await query.order('monthly_rent_mxn', { ascending: true });

    if (data && data.length >= MIN_SAMPLE) {
      const prices = data.map((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn).sort((a: number, b: number) => a - b);
      const areas = data
        .filter((d: { area_m2: number | null }) => d.area_m2 && d.area_m2 > 0)
        .map((d: { area_m2: number; monthly_rent_mxn: number }) => d.monthly_rent_mxn / d.area_m2);

      const median = prices[Math.floor(prices.length / 2)];
      const p25 = prices[Math.floor(prices.length * 0.25)];
      const p75 = prices[Math.floor(prices.length * 0.75)];
      const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      const avgPerM2 = areas.length >= 3
        ? Math.round((areas.reduce((a: number, b: number) => a + b, 0) / areas.length) * 100) / 100
        : null;

      return {
        data: {
          city,
          zone: zone || null,
          property_type: propertyType || 'departamento',
          bedrooms: bedrooms || null,
          rental_type: rentalType,
          sample_size: prices.length,
          median_rent_mxn: median,
          avg_rent_mxn: avg,
          p25_rent_mxn: p25,
          p75_rent_mxn: p75,
          min_rent_mxn: prices[0],
          max_rent_mxn: prices[prices.length - 1],
          avg_rent_per_m2: avgPerM2,
          last_updated: new Date().toISOString(),
        },
        fallback: attempt.isFallback,
      };
    }
  }

  return { data: null, fallback: true };
}

/**
 * Get both residential and vacation rental estimates.
 */
export async function getRentalEstimates(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
): Promise<{ residencial: RentalEstimate | null; vacacional: RentalEstimate | null }> {
  const [residencial, vacacional] = await Promise.all([
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'residencial'),
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'vacacional'),
  ]);

  return {
    residencial: residencial.data,
    vacacional: vacacional.data,
  };
}

// ============================================================
// ML RENTAL ESTIMATES & DEVELOPMENT FINANCIALS
// ============================================================

export async function getDevelopmentFinancials(client: Client, developmentId: string) {
  const { data, error } = await client
    .from('development_financials')
    .select('*')
    .eq('development_id', developmentId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getMlRentalEstimates(client: Client, developmentId: string) {
  const { data } = await client
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .order('bedrooms', { ascending: true });

  return data || [];
}

export async function getMlRentalEstimateForUnit(
  client: Client,
  developmentId: string,
  unitType: string,
  bedrooms: number,
) {
  const { data } = await client
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .eq('unit_type', unitType)
    .eq('bedrooms', bedrooms)
    .single();

  return data || null;
}

// ============================================================
// ADMIN: DEVELOPMENT CRUD
// ============================================================

export async function createDevelopment(client: Client, data: Record<string, unknown>) {
  return client.from('developments').insert(data).select().single();
}

export async function updateDevelopment(client: Client, id: string, data: Record<string, unknown>) {
  return client.from('developments').update(data).eq('id', id).select().single();
}

export async function deleteDevelopment(client: Client, id: string) {
  // Soft delete
  return client.from('developments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
}

export async function bulkInsertDevelopments(client: Client, developments: Record<string, unknown>[]) {
  return client.from('developments').insert(developments).select();
}

// ============================================================
// ADMIN: UNIT CRUD
// ============================================================

export async function createUnit(client: Client, data: Record<string, unknown>) {
  return client.from('units').insert(data).select().single();
}

export async function updateUnit(client: Client, id: string, data: Record<string, unknown>) {
  return client.from('units').update(data).eq('id', id).select().single();
}

export async function bulkInsertUnits(client: Client, units: Record<string, unknown>[]) {
  return client.from('units').insert(units).select();
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

// ============================================================
// HELPERS
// ============================================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function getWeeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return getWeekStart(d);
}

// ============================================================
// BACKWARD COMPAT: old function names mapping to new
// ============================================================

/** @deprecated Use getDevelopments() */
export const getProperties = getDevelopments;
/** @deprecated Use getDevelopmentBySlug() */
export const getPropertyBySlug = getDevelopmentBySlug;
/** @deprecated Use getSimilarDevelopments() */
export const getSimilarProperties = getSimilarDevelopments;
/** @deprecated Use getFeaturedDevelopments() */
export const getFeaturedProperties = getFeaturedDevelopments;
/** @deprecated Use createContact() */
export const createLead = createContact;
/** @deprecated Use getContacts() */
export const getLeads = getContacts;
/** @deprecated Use createDevelopment() */
export const createProperty = createDevelopment;
/** @deprecated Use updateDevelopment() */
export const updateProperty = updateDevelopment;
/** @deprecated Use deleteDevelopment() */
export const deleteProperty = deleteDevelopment;
/** @deprecated Use bulkInsertDevelopments() */
export const bulkInsertProperties = bulkInsertDevelopments;
