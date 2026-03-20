import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRentalEstimate } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';

interface RentalEstimateProps {
  city: string;
  propertyType?: string;
  bedrooms?: number;
  zone?: string;
  locale: string;
}

export async function RentalEstimate({
  city,
  propertyType,
  bedrooms,
  zone,
  locale,
}: RentalEstimateProps) {
  const t = await getTranslations({ locale, namespace: 'rentalEstimate' });
  const supabase = await createServerSupabaseClient();

  if (!supabase) return null;

  const { data, fallback } = await getRentalEstimate(
    supabase,
    city,
    propertyType || 'departamento',
    bedrooms,
    zone,
  );

  if (!data || data.sample_size < 3) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('title')}
        </h3>
        <p className="text-sm text-gray-500">
          {fallback ? t('cityLevel', { city }) : t('zoneLevel', { zone: zone || city })}
        </p>
      </div>

      {/* Median rent — hero number */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-cyan-50 to-green-50 p-5">
        <p className="text-sm font-medium text-gray-600">{t('medianRent')}</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatPrice(data.median_rent_mxn)}
          <span className="text-base font-normal text-gray-500"> /{t('perMonth')}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('range')}</p>
          <p className="text-sm font-semibold text-gray-800">
            {formatPrice(data.p25_rent_mxn)} – {formatPrice(data.p75_rent_mxn)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('average')}</p>
          <p className="text-sm font-semibold text-gray-800">
            {formatPrice(data.avg_rent_mxn)}
          </p>
        </div>
        {data.avg_rent_per_m2 && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t('pricePerM2')}</p>
            <p className="text-sm font-semibold text-gray-800">
              ${data.avg_rent_per_m2.toFixed(0)} /m²
            </p>
          </div>
        )}
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('basedOn')}</p>
          <p className="text-sm font-semibold text-gray-800">
            {data.sample_size} {t('comparables')}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed">
        {t('disclaimer')}
      </p>
    </section>
  );
}
