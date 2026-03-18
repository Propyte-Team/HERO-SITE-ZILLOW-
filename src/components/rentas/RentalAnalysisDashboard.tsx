'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  TrendingUp, Building2, MapPin, BarChart3, ArrowUpRight,
  Filter, ChevronDown, Loader2,
} from 'lucide-react';
import { formatPrice, formatPercentage } from '@/lib/formatters';

// ── Types ────────────────────────────────────────────
interface DevelopmentFinancial {
  id: string;
  slug: string;
  name: string;
  city: string;
  zone: string | null;
  stage: string;
  price_min: number | null;
  price_max: number | null;
  image: string | null;
  roi_annual_pct: number | null;
  irr_5yr: number | null;
  irr_10yr: number | null;
  cash_on_cash_pct: number | null;
  breakeven_months: number | null;
  monthly_net_flow: number | null;
  cap_rate: number | null;
  rent_yield_gross: number | null;
  rent_yield_net: number | null;
  estimated_rent: number | null;
  estimated_rent_vac: number | null;
}

interface CityStat {
  city: string;
  count: number;
  avg_rent: number;
  median_rent: number;
  min_rent: number;
  max_rent: number;
  avg_rent_m2: number | null;
  by_type: Record<string, { count: number; avg_rent: number }>;
  by_bedrooms: Record<string, { count: number; avg_rent: number }>;
}

interface AnalysisData {
  developments: DevelopmentFinancial[];
  city_stats: CityStat[];
  model: { version: string; last_computed: string } | null;
  total_comparables: number;
}

const CITIES = ['Cancun', 'Playa del Carmen', 'Tulum', 'Merida', 'Puerto Morelos', 'Cozumel', 'Bacalar'];

type SortKey = 'rent_yield_gross' | 'irr_5yr' | 'cap_rate' | 'cash_on_cash_pct' | 'estimated_rent' | 'price_min';

// ── Component ────────────────────────────────────────
export default function RentalAnalysisDashboard({ locale }: { locale: string }) {
  const t = useTranslations('rentas');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('rent_yield_gross');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : '';
        const res = await fetch(`/api/rental-analysis${params}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch rental analysis:', e);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchData();
  }, [selectedCity]);

  const sortedDevelopments = useMemo(() => {
    if (!data?.developments) return [];
    return [...data.developments].sort((a, b) => {
      const va = (a[sortBy] as number) ?? -Infinity;
      const vb = (b[sortBy] as number) ?? -Infinity;
      return vb - va;
    });
  }, [data?.developments, sortBy]);

  const selectedCityStat = useMemo(() => {
    if (!data?.city_stats || !selectedCity) return null;
    return data.city_stats.find(cs => cs.city === selectedCity) || null;
  }, [data?.city_stats, selectedCity]);

  // Global aggregates
  const globalStats = useMemo(() => {
    if (!data?.developments.length) return null;
    const devs = data.developments.filter(d => d.rent_yield_gross != null);
    if (!devs.length) return null;

    const avgYield = devs.reduce((s, d) => s + (d.rent_yield_gross || 0), 0) / devs.length;
    const avgCapRate = devs.reduce((s, d) => s + (d.cap_rate || 0), 0) / devs.length;
    const avgIrr = devs.filter(d => d.irr_5yr != null);
    const avgIrr5 = avgIrr.length ? avgIrr.reduce((s, d) => s + (d.irr_5yr || 0), 0) / avgIrr.length : null;
    const avgRent = devs.filter(d => d.estimated_rent).reduce((s, d) => s + (d.estimated_rent || 0), 0) / devs.filter(d => d.estimated_rent).length;

    return { avgYield, avgCapRate, avgIrr5, avgRent, count: devs.length };
  }, [data?.developments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5CE0D2]" />
      </div>
    );
  }

  if (!data || (!data.developments.length && !data.city_stats.length)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <BarChart3 size={48} className="text-gray-300" />
        <p className="text-gray-500 text-center">{t('noData')}</p>
        <p className="text-sm text-gray-400 text-center">{t('noDataHint')}</p>
      </div>
    );
  }

  const hasDevelopments = data.developments.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[#0F1923] text-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-[#5CE0D2]/20 text-[#5CE0D2] text-xs font-semibold rounded-full uppercase tracking-wider">
                {t('badge')}
              </span>
              {data.model && (
                <span className="text-xs text-gray-400">
                  v{data.model.version}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              {t('heroTitle')}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-2xl font-bold text-[#5CE0D2]">{data.total_comparables.toLocaleString()}</div>
                <div className="text-gray-400">{t('totalComparables')}</div>
              </div>
              {hasDevelopments && (
                <div>
                  <div className="text-2xl font-bold text-[#5CE0D2]">{data.developments.length}</div>
                  <div className="text-gray-400">{t('analyzedDevelopments')}</div>
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-[#5CE0D2]">{data.city_stats.length}</div>
                <div className="text-gray-400">{t('cities')}</div>
              </div>
              {globalStats?.avgYield && (
                <div>
                  <div className="text-2xl font-bold text-[#5CE0D2]">{formatPercentage(globalStats.avgYield)}</div>
                  <div className="text-gray-400">{t('avgYield')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* City Stats Cards */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {data.city_stats.map(cs => (
            <button
              key={cs.city}
              onClick={() => setSelectedCity(selectedCity === cs.city ? '' : cs.city)}
              className={`rounded-xl p-4 text-left transition-all border ${
                selectedCity === cs.city
                  ? 'bg-[#5CE0D2] text-white border-[#5CE0D2] shadow-lg shadow-[#5CE0D2]/20'
                  : 'bg-white border-gray-100 hover:border-[#5CE0D2] hover:shadow-md'
              }`}
            >
              <div className="text-xs font-medium opacity-75 mb-1">{cs.city}</div>
              <div className="text-lg font-bold">{formatPrice(cs.median_rent)}</div>
              <div className="text-[10px] opacity-60">{cs.count} listings</div>
            </button>
          ))}
        </div>
      </section>

      {/* City Detail Breakdown */}
      {selectedCityStat && (
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin size={20} className="text-[#5CE0D2]" />
              <h2 className="text-xl font-bold text-gray-900">{selectedCityStat.city}</h2>
              <span className="text-sm text-gray-400">{selectedCityStat.count} {t('listings')}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard label={t('avgRent')} value={formatPrice(selectedCityStat.avg_rent)} />
              <StatCard label={t('medianRent')} value={formatPrice(selectedCityStat.median_rent)} />
              <StatCard label={t('minRent')} value={formatPrice(selectedCityStat.min_rent)} />
              <StatCard label={t('maxRent')} value={formatPrice(selectedCityStat.max_rent)} />
              <StatCard label={t('rentPerM2')} value={selectedCityStat.avg_rent_m2 ? `$${selectedCityStat.avg_rent_m2}/m²` : '—'} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* By property type */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('byPropertyType')}</h3>
                <div className="space-y-2">
                  {Object.entries(selectedCityStat.by_type)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([type, stat]) => (
                      <div key={type} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-400">({stat.count})</span>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(stat.avg_rent)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* By bedrooms */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('byBedrooms')}</h3>
                <div className="space-y-2">
                  {Object.entries(selectedCityStat.by_bedrooms)
                    .sort((a, b) => {
                      const na = a[0] === 'N/A' ? -1 : Number(a[0]);
                      const nb = b[0] === 'N/A' ? -1 : Number(b[0]);
                      return na - nb;
                    })
                    .map(([beds, stat]) => (
                      <div key={beds} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{beds === 'N/A' ? 'N/A' : `${beds} ${t('bedrooms')}`}</span>
                          <span className="text-xs text-gray-400">({stat.count})</span>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(stat.avg_rent)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Development Rankings */}
      {hasDevelopments && <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('rankingTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('rankingSubtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:border-[#5CE0D2] focus:outline-none cursor-pointer"
              >
                <option value="rent_yield_gross">{t('sortYield')}</option>
                <option value="irr_5yr">{t('sortIrr')}</option>
                <option value="cap_rate">{t('sortCapRate')}</option>
                <option value="cash_on_cash_pct">{t('sortCashOnCash')}</option>
                <option value="estimated_rent">{t('sortRent')}</option>
                <option value="price_min">{t('sortPrice')}</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('thDevelopment')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('thPrice')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('thEstRent')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">{t('thYield')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">{t('thCapRate')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('thIrr5')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('thCashFlow')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('thBreakeven')}</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedDevelopments.map((dev, i) => (
                  <tr key={dev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {dev.image && (
                          <img
                            src={dev.image}
                            alt={dev.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{dev.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin size={10} />
                            {dev.zone ? `${dev.zone}, ` : ''}{dev.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-gray-700">
                      {dev.price_min ? formatPrice(dev.price_min) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="text-sm font-semibold text-[#5CE0D2]">
                        {dev.estimated_rent ? formatPrice(dev.estimated_rent) : '—'}
                      </div>
                      {dev.estimated_rent_vac && (
                        <div className="text-[10px] text-gray-400">{t('vac')}: {formatPrice(dev.estimated_rent_vac)}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-gray-700 hidden md:table-cell">
                      {dev.rent_yield_gross != null ? formatPercentage(dev.rent_yield_gross) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-gray-700 hidden md:table-cell">
                      {dev.cap_rate != null ? formatPercentage(dev.cap_rate) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-gray-700 hidden lg:table-cell">
                      {dev.irr_5yr != null ? formatPercentage(dev.irr_5yr) : '—'}
                    </td>
                    <td className={`px-5 py-4 text-right text-sm font-medium hidden lg:table-cell ${
                      (dev.monthly_net_flow ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                    }`}>
                      {dev.monthly_net_flow != null ? formatPrice(dev.monthly_net_flow) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-500 hidden lg:table-cell">
                      {dev.breakeven_months != null ? `${dev.breakeven_months} m` : '—'}
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/${locale}/desarrollos/${dev.slug}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#5CE0D2]/10 text-gray-400 hover:text-[#5CE0D2] transition-colors"
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-gray-400 text-center">
          {t('disclaimer')}
          {data.model && ` · ${t('modelVersion')}: ${data.model.version}`}
        </p>
      </section>}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
