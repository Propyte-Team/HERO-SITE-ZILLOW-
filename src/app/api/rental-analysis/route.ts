import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RENT_BOUNDS } from '@/lib/calculator';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const city = searchParams.get('city');

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch development financials with development info
    let devQuery = supabase
      .from('development_financials')
      .select(`
        *,
        developments!inner(
          id, slug, name, city, zone, state, stage,
          property_types, price_min_mxn, price_max_mxn,
          images, published, deleted_at
        )
      `)
      .is('developments.deleted_at', null)
      .eq('developments.published', true);

    if (city) {
      devQuery = devQuery.eq('developments.city', city);
    }

    const { data: financials, error: finError } = await devQuery
      .order('rent_yield_gross', { ascending: false })
      .limit(100);

    // 2. Fetch rental comparables (paginated) — with price bounds filter
    const allComparables: Array<{
      city: string; property_type: string; bedrooms: number | null;
      monthly_rent_mxn: number; area_m2: number | null; rental_type: string;
      zone: string | null; is_furnished: boolean | null;
      source_portal: string; scraped_at: string;
    }> = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page } = await supabase
        .from('rental_comparables')
        .select('city, zone, property_type, bedrooms, monthly_rent_mxn, area_m2, rental_type, is_furnished, source_portal, scraped_at')
        .eq('active', true)
        .gte('monthly_rent_mxn', RENT_BOUNDS.MIN)
        .lte('monthly_rent_mxn', RENT_BOUNDS.MAX)
        .range(offset, offset + pageSize - 1);
      if (!page || page.length === 0) break;
      allComparables.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    const comparables = allComparables;

    // Source stats (computed server-side to avoid inflating payload)
    const sourceMap: Record<string, number> = {};
    let latestScraped = '';
    for (const r of comparables) {
      const src = r.source_portal || 'otro';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
      if (r.scraped_at && r.scraped_at > latestScraped) latestScraped = r.scraped_at;
    }
    const sourceStats = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate comparables by city
    const cityStats: Record<string, {
      city: string;
      count: number;
      avg_rent: number;
      median_rent: number;
      min_rent: number;
      max_rent: number;
      avg_rent_m2: number | null;
      by_type: Record<string, { count: number; avg_rent: number }>;
      by_bedrooms: Record<string, { count: number; avg_rent: number }>;
    }> = {};

    if (comparables) {
      for (const row of comparables) {
        if (!cityStats[row.city]) {
          cityStats[row.city] = {
            city: row.city,
            count: 0,
            avg_rent: 0,
            median_rent: 0,
            min_rent: Infinity,
            max_rent: 0,
            avg_rent_m2: null,
            by_type: {},
            by_bedrooms: {},
          };
        }
        const cs = cityStats[row.city];
        cs.count++;
        cs.avg_rent += row.monthly_rent_mxn;
        cs.min_rent = Math.min(cs.min_rent, row.monthly_rent_mxn);
        cs.max_rent = Math.max(cs.max_rent, row.monthly_rent_mxn);

        // By type
        const pt = row.property_type || 'otro';
        if (!cs.by_type[pt]) cs.by_type[pt] = { count: 0, avg_rent: 0 };
        cs.by_type[pt].count++;
        cs.by_type[pt].avg_rent += row.monthly_rent_mxn;

        // By bedrooms
        const beds = String(row.bedrooms ?? 'N/A');
        if (!cs.by_bedrooms[beds]) cs.by_bedrooms[beds] = { count: 0, avg_rent: 0 };
        cs.by_bedrooms[beds].count++;
        cs.by_bedrooms[beds].avg_rent += row.monthly_rent_mxn;
      }

      // Compute averages
      for (const cs of Object.values(cityStats)) {
        cs.avg_rent = Math.round(cs.avg_rent / cs.count);
        if (cs.min_rent === Infinity) cs.min_rent = 0;

        for (const bt of Object.values(cs.by_type)) {
          bt.avg_rent = Math.round(bt.avg_rent / bt.count);
        }
        for (const bb of Object.values(cs.by_bedrooms)) {
          bb.avg_rent = Math.round(bb.avg_rent / bb.count);
        }
      }

      // Compute median per city
      const cityRents: Record<string, number[]> = {};
      for (const row of comparables) {
        if (!cityRents[row.city]) cityRents[row.city] = [];
        cityRents[row.city].push(row.monthly_rent_mxn);
      }
      for (const [c, rents] of Object.entries(cityRents)) {
        rents.sort((a, b) => a - b);
        cityStats[c].median_rent = rents[Math.floor(rents.length / 2)];
      }

      // Rent per m2
      const cityM2: Record<string, number[]> = {};
      for (const row of comparables) {
        if (row.area_m2 && row.area_m2 > 0) {
          if (!cityM2[row.city]) cityM2[row.city] = [];
          cityM2[row.city].push(row.monthly_rent_mxn / row.area_m2);
        }
      }
      for (const [c, vals] of Object.entries(cityM2)) {
        if (cityStats[c]) {
          cityStats[c].avg_rent_m2 = Math.round(
            (vals.reduce((a, b) => a + b, 0) / vals.length) * 100
          ) / 100;
        }
      }
    }

    // 3. Model summary
    const modelInfo = financials && financials.length > 0
      ? { version: financials[0].model_version, last_computed: financials[0].last_computed }
      : null;

    return NextResponse.json({
      comparables: comparables.map(r => ({
        city: r.city,
        zone: r.zone,
        pt: r.property_type,
        beds: r.bedrooms,
        rent: r.monthly_rent_mxn,
        m2: r.area_m2,
        rt: r.rental_type,
        fur: r.is_furnished,
      })),
      developments: (financials || []).map((f: Record<string, unknown>) => {
        const dev = f.developments as Record<string, unknown> | null;
        return {
          id: f.development_id,
          slug: dev?.slug,
          name: dev?.name,
          city: dev?.city,
          zone: dev?.zone,
          stage: dev?.stage,
          price_min: dev?.price_min_mxn,
          price_max: dev?.price_max_mxn,
          image: (dev?.images as string[])?.[0] || null,
          roi_annual_pct: f.roi_annual_pct,
          irr_5yr: f.irr_5yr,
          irr_10yr: f.irr_10yr,
          cash_on_cash_pct: f.cash_on_cash_pct,
          breakeven_months: f.breakeven_months,
          monthly_net_flow: f.monthly_net_flow,
          cap_rate: f.cap_rate,
          rent_yield_gross: f.rent_yield_gross,
          rent_yield_net: f.rent_yield_net,
          estimated_rent: f.estimated_rent_residencial,
          estimated_rent_vac: f.estimated_rent_vacacional,
        };
      }),
      city_stats: Object.values(cityStats).sort((a, b) => b.count - a.count),
      source_stats: sourceStats,
      data_freshness: latestScraped || null,
      model: modelInfo,
      total_comparables: comparables?.length || 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('Rental analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
