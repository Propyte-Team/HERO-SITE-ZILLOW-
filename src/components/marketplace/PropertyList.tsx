'use client';

import { useTranslations } from 'next-intl';
import PropertyCard from '@/components/ui/PropertyCard';
import type { Property } from '@/types/property';

interface PropertyListProps {
  properties: Property[];
  sortBy: string;
  onSortChange: (sort: 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date') => void;
}

export default function PropertyList({ properties, sortBy, onSortChange }: PropertyListProps) {
  const t = useTranslations('marketplace');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <span className="text-sm text-gray-500">{t('results', { count: properties.length })}</span>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#00B4C8] focus:outline-none"
          aria-label={t('sortBy')}
        >
          <option value="relevance">{t('sortRelevance')}</option>
          <option value="price_asc">{t('sortPriceAsc')}</option>
          <option value="price_desc">{t('sortPriceDesc')}</option>
          <option value="roi">{t('sortRoi')}</option>
          <option value="date">{t('sortDate')}</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">{t('noResults')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noResultsSuggestion')}</p>
          </div>
        ) : (
          properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))
        )}
      </div>
    </div>
  );
}
