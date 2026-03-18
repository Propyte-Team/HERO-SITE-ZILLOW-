'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateMonthlyPayment,
  calculateROI,
  calculateCashOnCash,
  calculateBreakeven,
  calculateProjectedValue,
  calculateCapRate,
  calculateGrossYield,
  calculateNetYield,
  calculateIRR,
} from '@/lib/calculator';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import type { Property } from '@/types/property';

interface FinancialSimulatorProps {
  property: Property;
  mlEstimatedRent?: number;
}

export default function FinancialSimulator({ property, mlEstimatedRent }: FinancialSimulatorProps) {
  const t = useTranslations('simulator');

  const [downPaymentPct, setDownPaymentPct] = useState(property.financing.downPaymentMin);
  const [months, setMonths] = useState(property.financing.months[1] || property.financing.months[0]);
  const [interestRate, setInterestRate] = useState(property.financing.interestRate);
  const [monthlyRent, setMonthlyRent] = useState(mlEstimatedRent || property.roi.rentalMonthly);
  const [appreciation, setAppreciation] = useState(property.roi.appreciation);

  const price = property.price.mxn;
  const downPayment = price * (downPaymentPct / 100);
  const totalInvested = downPayment;

  const results = useMemo(() => {
    const monthly = calculateMonthlyPayment(price, downPaymentPct, months, interestRate);
    const roi1 = calculateROI(price, downPaymentPct, monthlyRent * 12, appreciation, 1);
    const roi3 = calculateROI(price, downPaymentPct, monthlyRent * 12, appreciation, 3);
    const roi5 = calculateROI(price, downPaymentPct, monthlyRent * 12, appreciation, 5);
    const cashOnCash = calculateCashOnCash(monthlyRent * 12, totalInvested);
    const breakeven = calculateBreakeven(totalInvested, monthlyRent);
    const projectedValue = calculateProjectedValue(price, appreciation, 5);

    const annualRent = monthlyRent * 12;
    const annualRentNet = annualRent * 0.75;
    const grossYield = calculateGrossYield(annualRent, price);
    const netYield = calculateNetYield(annualRent, price);
    const capRate = calculateCapRate(annualRentNet, price);
    const monthlyNet = monthlyRent * 0.75 - monthly;

    // IRR: cash flows for 5yr and 10yr
    const annualNetFlow = monthlyNet * 12;
    const sale5 = calculateProjectedValue(price, appreciation, 5);
    const remaining5 = Math.max(0, price * (1 - downPaymentPct / 100) - monthly * 60);
    const cf5 = [-totalInvested, ...Array(4).fill(annualNetFlow), annualNetFlow + sale5 - remaining5];
    const irr5 = calculateIRR(cf5);

    const sale10 = calculateProjectedValue(price, appreciation, 10);
    const remaining10 = Math.max(0, price * (1 - downPaymentPct / 100) - monthly * 120);
    const cf10 = [-totalInvested, ...Array(9).fill(annualNetFlow), annualNetFlow + sale10 - remaining10];
    const irr10 = calculateIRR(cf10);

    return { monthly, roi1, roi3, roi5, cashOnCash, breakeven, projectedValue, grossYield, netYield, capRate, monthlyNet, irr5, irr10 };
  }, [price, downPaymentPct, months, interestRate, monthlyRent, appreciation, totalInvested]);

  return (
    <div className="bg-[#F4F6F8] rounded-xl p-6 md:p-8">
      <h2 className="text-xl font-semibold text-[#2C2C2C] mb-6">{t('title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyPrice')}</label>
            <div className="h-11 px-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center text-sm font-semibold text-gray-500">
              {formatPrice(price)}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium text-gray-700">{t('downPayment')}</label>
              <span className="font-semibold">{downPaymentPct}% ({formatPrice(downPayment)})</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={downPaymentPct}
              onChange={e => setDownPaymentPct(Number(e.target.value))}
              className="w-full accent-[#5CE0D2]"
              aria-valuemin={10}
              aria-valuemax={100}
              aria-valuenow={downPaymentPct}
              aria-label={t('downPayment')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('term')}</label>
            <div className="flex gap-2 flex-wrap">
              {property.financing.months.map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${months === m ? 'bg-[#5CE0D2] text-white border-[#5CE0D2]' : 'border-gray-200 hover:border-[#5CE0D2]'}`}
                >
                  {m} {t('months')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('interestRate')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={15}
                step={0.5}
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-24 h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
                aria-label={t('interestRate')}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">{t('monthlyRent')}</label>
              {mlEstimatedRent && (
                <span className="px-1.5 py-0.5 bg-[#5CE0D2]/15 text-[#5CE0D2] text-[10px] font-medium rounded">
                  {t('mlEstimated')}
                </span>
              )}
            </div>
            <input
              type="number"
              min={5000}
              max={100000}
              step={1000}
              value={monthlyRent}
              onChange={e => setMonthlyRent(Number(e.target.value))}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              aria-label={t('monthlyRent')}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium text-gray-700">{t('appreciation')}</label>
              <span className="font-semibold">{appreciation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={appreciation}
              onChange={e => setAppreciation(Number(e.target.value))}
              className="w-full accent-[#5CE0D2]"
              aria-valuemin={0}
              aria-valuemax={20}
              aria-valuenow={appreciation}
              aria-label={t('appreciation')}
            />
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">{t('monthlyPayment')}</div>
            <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(results.monthly)}</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-3">{t('projectedRoi')}</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-[#5CE0D2]">{results.roi1.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">{t('years1')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#5CE0D2]">{results.roi3.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">{t('years3')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#5CE0D2]">{results.roi5.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">{t('years5')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">{t('cashOnCash')}</div>
            <div className={`text-xl font-bold ${results.cashOnCash >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {results.cashOnCash.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">{t('breakeven')}</div>
            <div className="text-xl font-bold text-[#2C2C2C]">
              {results.breakeven === Infinity ? '—' : `${results.breakeven} ${t('months')}`}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">{t('projectedValue')}</div>
            <div className="text-xl font-bold text-[#2C2C2C]">{formatPrice(results.projectedValue)}</div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5CE0D2] rounded-full"
                style={{ width: `${Math.min((results.projectedValue / price) * 50, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatPrice(price)}</span>
              <span>{formatPrice(results.projectedValue)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('grossYield')}</div>
              <div className="text-lg font-bold text-[#5CE0D2]">{formatPercentage(results.grossYield)}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('netYield')}</div>
              <div className="text-lg font-bold text-[#5CE0D2]">{formatPercentage(results.netYield)}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('capRate')}</div>
              <div className="text-lg font-bold text-[#5CE0D2]">{formatPercentage(results.capRate)}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('netCashFlow')}</div>
              <div className={`text-lg font-bold ${results.monthlyNet >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {formatPrice(Math.round(results.monthlyNet))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500 mb-3">{t('irrProjected')}</div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-[#5CE0D2]">
                  {results.irr5 != null ? formatPercentage(results.irr5) : '—'}
                </div>
                <div className="text-xs text-gray-400">{t('irr5yr')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#5CE0D2]">
                  {results.irr10 != null ? formatPercentage(results.irr10) : '—'}
                </div>
                <div className="text-xs text-gray-400">{t('irr10yr')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 leading-relaxed">{t('disclaimer')}</p>
    </div>
  );
}
