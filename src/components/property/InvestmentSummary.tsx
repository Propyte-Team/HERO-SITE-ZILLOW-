import { getTranslations } from 'next-intl/server';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import {
  getClosingCostRate,
  calculateClosingCosts,
  calculateTotalInvestment,
  calculateGrossYield,
  calculateNetYield,
  calculateCapRate,
  calculateCashOnCash,
  calculateBreakeven,
  calculateIRR,
} from '@/lib/calculator';
import type { DevelopmentFinancialsRow } from '@/lib/supabase/types';

interface InvestmentSummaryProps {
  financials: DevelopmentFinancialsRow;
  locale: string;
  price?: number | null;
  state?: string | null;
  estimatedRent?: number | null;
}

export default async function InvestmentSummary({
  financials,
  locale,
  price,
  state,
  estimatedRent,
}: InvestmentSummaryProps) {
  const t = await getTranslations({ locale, namespace: 'simulator' });

  // Use comparables-based rent if available, else ML estimate
  const rentUsed = estimatedRent || financials.estimated_rent_residencial;
  const hasPrice = price && price > 0;
  const hasState = !!state;
  const showSmartAnalysis = hasPrice && hasState && rentUsed && rentUsed > 0;

  // Compute metrics from real data when possible
  let closingRate = 0;
  let closingCosts = 0;
  let totalInvestment = 0;
  let computedMetrics: {
    grossYield: number;
    netYield: number;
    capRate: number;
    cashOnCash: number;
    breakeven: number;
    monthlyNetFlow: number;
    irr5yr: number | null;
    irr10yr: number | null;
  } | null = null;

  if (showSmartAnalysis) {
    closingRate = getClosingCostRate(state);
    closingCosts = calculateClosingCosts(price, state);
    totalInvestment = calculateTotalInvestment(price, state);

    const annualRent = rentUsed * 12;
    const annualRentNet = annualRent * 0.75;
    const monthlyNetFlow = Math.round(rentUsed * 0.75);

    const grossYield = calculateGrossYield(annualRent, totalInvestment);
    const netYield = calculateNetYield(annualRent, totalInvestment);
    const capRate = calculateCapRate(annualRentNet, totalInvestment);
    const cashOnCash = calculateCashOnCash(annualRentNet, totalInvestment);
    const breakeven = calculateBreakeven(totalInvestment, monthlyNetFlow);

    // IRR: assume 8% annual appreciation, 30% down payment
    const appreciation = 0.08;
    const downPct = 0.30;
    const downPayment = totalInvestment * downPct;
    const annualMortgage = 0; // simplified: no financing for IRR calc
    const annualNetFlow = annualRentNet - annualMortgage;

    const saleValue5yr = price * Math.pow(1 + appreciation, 5);
    const cf5 = [-downPayment, ...Array(4).fill(annualNetFlow), annualNetFlow + saleValue5yr - (totalInvestment - downPayment)];
    const irr5yr = calculateIRR(cf5);

    const saleValue10yr = price * Math.pow(1 + appreciation, 10);
    const cf10 = [-downPayment, ...Array(9).fill(annualNetFlow), annualNetFlow + saleValue10yr - (totalInvestment - downPayment)];
    const irr10yr = calculateIRR(cf10);

    computedMetrics = {
      grossYield,
      netYield,
      capRate,
      cashOnCash,
      breakeven: breakeven === Infinity ? 0 : breakeven,
      monthlyNetFlow,
      irr5yr,
      irr10yr,
    };
  }

  // Use computed metrics if available, else fall back to ML pre-computed
  const m = computedMetrics;
  const metrics = [
    {
      label: t('grossYield'),
      value: m ? m.grossYield : financials.rent_yield_gross,
      format: 'pct' as const,
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('netYield'),
      value: m ? m.netYield : financials.rent_yield_net,
      format: 'pct' as const,
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('capRate'),
      value: m ? m.capRate : financials.cap_rate,
      format: 'pct' as const,
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('cashOnCash'),
      value: m ? m.cashOnCash : financials.cash_on_cash_pct,
      format: 'pct' as const,
      color: (m ? m.cashOnCash : financials.cash_on_cash_pct ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: t('irr5yr'),
      value: m ? m.irr5yr : financials.irr_5yr,
      format: 'pct' as const,
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('irr10yr'),
      value: m ? m.irr10yr : financials.irr_10yr,
      format: 'pct' as const,
      color: 'text-[#5CE0D2]',
    },
    {
      label: t('breakeven'),
      value: m ? m.breakeven : financials.breakeven_months,
      format: 'months' as const,
      color: 'text-[#2C2C2C]',
    },
    {
      label: t('netCashFlow'),
      value: m ? m.monthlyNetFlow : financials.monthly_net_flow,
      format: 'price' as const,
      color: (m ? m.monthlyNetFlow : financials.monthly_net_flow ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
  ];

  const displayRent = rentUsed || financials.estimated_rent_residencial;

  return (
    <div className="bg-[#F4F6F8] rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">{t('investmentAnalysis')}</h2>
        <span className="px-2 py-0.5 bg-[#5CE0D2]/15 text-[#5CE0D2] text-xs font-medium rounded-full">
          {computedMetrics ? (locale === 'en' ? 'Comparables-based' : 'Basado en comparables') : t('mlEstimated')}
        </span>
      </div>

      {/* Total Investment Breakdown */}
      {showSmartAnalysis && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{locale === 'en' ? 'Property price' : 'Precio del inmueble'}</span>
            <span className="font-medium">{formatPrice(price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              {locale === 'en' ? 'Closing costs' : 'Escrituración'} ({Math.round(closingRate * 100)}%)
            </span>
            <span className="font-medium">{formatPrice(closingCosts)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-700">
              {locale === 'en' ? 'Total investment' : 'Inversión total'}
            </span>
            <span className="font-bold text-gray-900">{formatPrice(totalInvestment)}</span>
          </div>
        </div>
      )}

      {displayRent && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">{t('estimatedMonthlyRent')}</div>
          <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(displayRent)}</div>
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
        {showSmartAnalysis
          ? (locale === 'en'
            ? `Analysis based on market comparables. Closing costs: ${Math.round(closingRate * 100)}% (${state}). Expense ratio: 25%.`
            : `Análisis basado en comparables de mercado. Escrituración: ${Math.round(closingRate * 100)}% (${state}). Ratio de gastos: 25%.`)
          : t('mlDisclaimer')
        }
        {' · v'}{financials.model_version}
      </p>
    </div>
  );
}
