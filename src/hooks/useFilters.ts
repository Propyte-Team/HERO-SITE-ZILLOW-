'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Property, PropertyStage, PropertyUsage } from '@/types/property';

export interface Filters {
  search: string;
  city: string;
  type: string;
  priceMin: number;
  priceMax: number;
  roiMin: number;
  stage: PropertyStage | '';
  usage: PropertyUsage | '';
}

const defaultFilters: Filters = {
  search: '',
  city: '',
  type: '',
  priceMin: 0,
  priceMax: 50_000_000,
  roiMin: 0,
  stage: '',
  usage: '',
};

export function useFilters(properties: Property[]) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date'>('relevance');

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.city) count++;
    if (filters.type) count++;
    if (filters.priceMin > 0) count++;
    if (filters.priceMax < 50_000_000) count++;
    if (filters.roiMin > 0) count++;
    if (filters.stage) count++;
    if (filters.usage) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    let result = properties.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.zone.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.city && p.location.city !== filters.city) return false;
      if (filters.type && p.specs.type !== filters.type) return false;
      if (p.price.mxn < filters.priceMin) return false;
      if (p.price.mxn > filters.priceMax) return false;
      if (filters.roiMin && p.roi.projected < filters.roiMin) return false;
      if (filters.stage && p.stage !== filters.stage) return false;
      if (filters.usage && !p.usage.includes(filters.usage)) return false;
      return true;
    });

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price.mxn - b.price.mxn);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price.mxn - a.price.mxn);
        break;
      case 'roi':
        result.sort((a, b) => b.roi.projected - a.roi.projected);
        break;
      case 'date':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [properties, filters, sortBy]);

  return { filters, filtered, updateFilter, clearFilters, activeFilterCount, sortBy, setSortBy };
}
