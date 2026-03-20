'use client';

import { motion } from 'framer-motion';
import type { MarketDataPayload } from '@/types/ai-search';

interface MarketInsightCardProps {
  data: MarketDataPayload;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-[#00B4C8]">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default function MarketInsightCard({ data }: MarketInsightCardProps) {
  const hasData = data.occupancy || data.adr || data.avgRent || data.totalListings;
  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 p-3 rounded-xl bg-[#F4F6F8] border border-gray-100"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.occupancy != null && (
          <StatItem
            label="Ocupación"
            value={`${(data.occupancy * 100).toFixed(0)}%`}
          />
        )}
        {data.adr != null && (
          <StatItem
            label="ADR"
            value={`$${data.adr.toLocaleString()}`}
          />
        )}
        {data.avgRent != null && (
          <StatItem
            label="Renta promedio"
            value={`$${data.avgRent.toLocaleString()}`}
          />
        )}
        {data.totalListings != null && (
          <StatItem
            label="Listados activos"
            value={data.totalListings.toLocaleString()}
          />
        )}
        {data.yieldGross != null && (
          <StatItem
            label="Yield bruto"
            value={`${data.yieldGross.toFixed(1)}%`}
          />
        )}
      </div>
    </motion.div>
  );
}
