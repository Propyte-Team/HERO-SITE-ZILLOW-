import { getTranslations } from 'next-intl/server';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import type { DevelopmentFinancialsRow } from '@/lib/supabase/types';

interface InvestmentSummaryProps {
  financials: DevelopmentFinancialsRow;
  locale: string;
}

export default async function InvestmentSummary({ financials, locale }: InvestmentSummaryProps) {
  const t = await getTranslations({ locale, namespace: 'simulator' });

  const metrics = [
    {
      label: t('grossYield'),
      value: financials.rent_yield_gross,
      format: 'pct',
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('netYield'),
      value: financials.rent_yield_net,
      format: 'pct',
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('capRate'),
      value: financials.cap_rate,
      format: 'pct',
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('cashOnCash'),
      value: financials.cash_on_cash_pct,
      format: 'pct',
      color: financials.cash_on_cash_pct && financials.cash_on_cash_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: t('irr5yr'),
      value: financials.irr_5yr,
      format: 'pct',
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('irr10yr'),
      value: financials.irr_10yr,
      format: 'pct',
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('breakeven'),
      value: financials.breakeven_months,
      format: 'months',
      color: 'text-[#2C2C2C]',
    },
    {
      label: t('netCashFlow'),
      value: financials.monthly_net_flow,
      format: 'price',
      color: financials.monthly_net_flow && financials.monthly_net_flow >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
  ];

  const estimatedRent = financials.estimated_rent_residencial;

  return (
    <div className="bg-[#F4F6F8] rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">{t('investmentAnalysis')}</h2>
        <span className="px-2 py-0.5 bg-[#5CE0D2]/15 text-[#5CE0D2] text-xs font-medium rounded-full">
          {t('mlEstimated')}
        </span>
      </div>

      {estimatedRent && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">{t('estimatedMonthlyRent')}</div>
          <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(estimatedRent)}</div>
          {financials.estimated_rent_vacacional && (
            <div className="text-sm text-gray-400 mt-1">
              {t('vacacional')}: {formatPrice(financials.estimated_rent_vacacional)}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
            <div className={`text-lg font-bold ${metric.color}`}>
              {metric.value == null
                ? '—'
                : metric.format === 'pct'
                  ? formatPercentage(metric.value)
                  : metric.format === 'months'
                    ? `${metric.value} ${t('months')}`
                    : formatPrice(metric.value)}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {t('mlDisclaimer')} · v{financials.model_version}
      </p>
    </div>
  );
}
