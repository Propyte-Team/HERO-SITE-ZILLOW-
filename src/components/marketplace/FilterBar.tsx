'use client';

import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import type { Filters } from '@/hooks/useFilters';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onOpenAdvanced: () => void;
  resultCount: number;
}

export default function FilterBar({ filters, onFilterChange, onOpenAdvanced, resultCount }: FilterBarProps) {
  const t = useTranslations('marketplace');

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.city}
          onChange={e => onFilterChange('city', e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#00B4C8] focus:outline-none"
          aria-label={t('filterLocation')}
        >
          <option value="">{t('filterLocation')}</option>
          <option value="Tulum">Tulum</option>
          <option value="Playa del Carmen">Playa del Carmen</option>
        </select>

        <select
          value={filters.type}
          onChange={e => onFilterChange('type', e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#00B4C8] focus:outline-none"
          aria-label={t('filterType')}
        >
          <option value="">{t('filterType')}</option>
          <option value="departamento">Departamento</option>
          <option value="penthouse">Penthouse</option>
          <option value="casa">Casa</option>
          <option value="terreno">Terreno</option>
          <option value="macrolote">Macrolote</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.priceMin || ''}
            onChange={e => onFilterChange('priceMin', Number(e.target.value) || 0)}
            placeholder="Min $"
            className="h-10 w-28 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#00B4C8] focus:outline-none"
            aria-label="Minimum price"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            value={filters.priceMax < 50_000_000 ? filters.priceMax : ''}
            onChange={e => onFilterChange('priceMax', Number(e.target.value) || 50_000_000)}
            placeholder="Max $"
            className="h-10 w-28 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#00B4C8] focus:outline-none"
            aria-label="Maximum price"
          />
        </div>

        <select
          value={filters.roiMin || ''}
          onChange={e => onFilterChange('roiMin', Number(e.target.value) || 0)}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#00B4C8] focus:outline-none"
          aria-label={t('filterRoi')}
        >
          <option value="">{t('filterRoi')}</option>
          <option value="5">5%+</option>
          <option value="10">10%+</option>
          <option value="15">15%+</option>
          <option value="20">20%+</option>
        </select>

        <button
          onClick={onOpenAdvanced}
          className="h-10 px-4 flex items-center gap-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal size={16} />
          {t('moreFilters')}
        </button>

        <span className="ml-auto text-sm text-gray-500">
          {t('results', { count: resultCount })}
        </span>
      </div>
    </div>
  );
}
