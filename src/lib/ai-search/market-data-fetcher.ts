import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDevelopments, getAirdnaMarketSummary } from '@/lib/supabase/queries';

export interface MarketContext {
  totalDevelopments: number;
  cityCounts: Record<string, number>;
  priceRange: { min: number; max: number };
  airdna?: {
    occupancy: number | null;
    adr: number | null;
    activeListings: number | null;
  };
}

// Map city names to AirDNA market keys
const CITY_TO_MARKET: Record<string, string> = {
  'Cancún': 'cancun',
  'Cancun': 'cancun',
  'Playa del Carmen': 'playa-del-carmen',
  'Tulum': 'tulum',
  'Puerto Morelos': 'puerto-morelos',
  'Cozumel': 'cozumel',
  'Mérida': 'merida',
  'Merida': 'merida',
  'Bacalar': 'bacalar',
};

export async function getMarketContext(city?: string): Promise<MarketContext> {
  const supabase = await createServerSupabaseClient();

  const defaultContext: MarketContext = {
    totalDevelopments: 0,
    cityCounts: {},
    priceRange: { min: 0, max: 0 },
  };

  if (!supabase) return defaultContext;

  try {
    // Fetch city counts and price range in parallel
    const [devResult, priceResult] = await Promise.all([
      supabase
        .from('developments')
        .select('city')
        .eq('published', true)
        .is('deleted_at', null),
      supabase
        .from('developments')
        .select('price_min_mxn')
        .eq('published', true)
        .is('deleted_at', null)
        .not('price_min_mxn', 'is', null)
        .order('price_min_mxn', { ascending: true }),
    ]);

    const devs = devResult.data || [];
    const prices = priceResult.data || [];

    // Count by city
    const cityCounts: Record<string, number> = {};
    for (const d of devs) {
      if (d.city) {
        cityCounts[d.city] = (cityCounts[d.city] || 0) + 1;
      }
    }

    const context: MarketContext = {
      totalDevelopments: devs.length,
      cityCounts,
      priceRange: {
        min: prices[0]?.price_min_mxn || 0,
        max: prices[prices.length - 1]?.price_min_mxn || 0,
      },
    };

    // If a specific city was mentioned, fetch AirDNA data
    if (city) {
      const market = CITY_TO_MARKET[city];
      if (market) {
        const airdna = await getAirdnaMarketSummary(supabase, market);
        if (airdna) {
          context.airdna = {
            occupancy: airdna.current_occupancy,
            adr: airdna.current_adr,
            activeListings: airdna.active_listings,
          };
        }
      }
    }

    return context;
  } catch {
    return defaultContext;
  }
}

/**
 * Count how many developments match the given filters.
 */
export async function countDevelopments(filters: {
  city?: string;
  type?: string;
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 0;

  try {
    const { count } = await getDevelopments(supabase, {
      ...filters,
      limit: 1,
    });
    return count || 0;
  } catch {
    return 0;
  }
}
