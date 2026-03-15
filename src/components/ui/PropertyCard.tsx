'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import type { Property } from '@/types/property';
import Badge from './Badge';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const tStages = useTranslations('stages');

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(property.price.mxn);

  return (
    <Link href={`/${locale}/propiedades/${property.slug}`} className="group block">
      <article className="rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 group-hover:-translate-y-1">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={property.images[0]}
            alt={`${property.name} - ${property.location.city}`}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {property.badge && (
            <div className="absolute top-3 left-3">
              <Badge type={property.badge} label={tStages(property.badge)} />
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-lg font-bold text-[#2C2C2C]">{formattedPrice}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-[#2C2C2C] text-base mb-1 line-clamp-1">{property.name}</h3>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin size={14} />
            <span>{property.location.zone}, {property.location.city}</span>
          </div>

          {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0) && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {property.specs.bedrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bed size={14} />
                  <span>{property.specs.bedrooms}</span>
                </div>
              )}
              {property.specs.bathrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bath size={14} />
                  <span>{property.specs.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Maximize size={14} />
                <span>{property.specs.area} m²</span>
              </div>
            </div>
          )}

          {property.specs.bedrooms === 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Maximize size={14} />
              <span>{property.specs.area.toLocaleString('es-MX')} m²</span>
            </div>
          )}

          {property.roi.projected > 0 && (
            <div className="mt-2 text-sm font-medium text-[#00B4C8]">
              ROI {property.roi.projected}%
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
