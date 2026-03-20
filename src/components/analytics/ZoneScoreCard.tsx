'use client';

import type { ZoneScore } from '@/lib/supabase/queries';

interface ZoneScoreCardProps {
  score: ZoneScore;
  compact?: boolean;
}

function ScoreGauge({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = Math.PI * radius; // half circle
  const fillPct = Math.min(100, Math.max(0, value)) / 100;
  const strokeDashoffset = circumference * (1 - fillPct);

  // Color based on score
  const color =
    value >= 70 ? '#059669' : // green
    value >= 50 ? '#D97706' : // amber
    value >= 30 ? '#EA580C' : // orange
    '#DC2626'; // red

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 16 }}>
      <svg
        width={size}
        height={size / 2 + 8}
        viewBox={`0 0 ${size} ${size / 2 + 8}`}
      >
        {/* Background arc */}
        <path
          d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-2xl font-bold" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}

function MetricPill({ label, value, suffix = '' }: { label: string; value: number | null; suffix?: string }) {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center px-3 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </span>
    </div>
  );
}

export function ZoneScoreCard({ score, compact = false }: ZoneScoreCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{score.zone}</h3>
          <p className="text-xs text-gray-500">{score.city}</p>
          {score.cluster_label && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-teal-50 text-teal-700">
              {score.cluster_label}
            </span>
          )}
        </div>
        <ScoreGauge value={score.score ?? 0} size={compact ? 64 : 80} />
      </div>

      {!compact && (
        <div className="flex flex-wrap justify-center gap-1 mt-3 border-t border-gray-100 pt-3">
          <MetricPill
            label="Ocupación"
            value={score.median_occupancy ? Math.round(score.median_occupancy) : null}
            suffix="%"
          />
          <MetricPill
            label="ADR"
            value={score.median_adr ? Math.round(score.median_adr) : null}
            suffix=""
          />
          <MetricPill
            label="RevPAR"
            value={score.revpar ? Math.round(score.revpar) : null}
          />
          <MetricPill
            label="Listings"
            value={score.active_listings}
          />
          {score.price_to_rent_ratio && (
            <MetricPill
              label="P/R Ratio"
              value={Math.round(score.price_to_rent_ratio * 10) / 10}
              suffix="x"
            />
          )}
        </div>
      )}

      {/* Component breakdown */}
      {!compact && (
        <div className="mt-3 space-y-1">
          <ComponentBar label="Yield" value={score.yield_component} />
          <ComponentBar label="Ocupación" value={score.occupancy_component} />
          <ComponentBar label="ADR Growth" value={score.adr_growth_component} />
          <ComponentBar label="Baja Oferta" value={score.supply_pressure_component} />
        </div>
      )}
    </div>
  );
}

function ComponentBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  const color =
    v >= 70 ? 'bg-teal-500' :
    v >= 50 ? 'bg-amber-500' :
    v >= 30 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-500 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${Math.min(100, v)}%`, transition: 'width 0.5s ease' }}
        />
      </div>
      <span className="w-8 text-gray-600 text-right">{Math.round(v)}</span>
    </div>
  );
}
