'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { getFeaturedProperties } from '@/data/properties';

export default function FeaturedProperties() {
  const t = useTranslations('featured');
  const tStages = useTranslations('stages');
  const locale = useLocale();
  const properties = getFeaturedProperties().slice(0, 6);

  return (
    <section className="py-12 md:py-16 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/propiedades`}
            className="hidden md:flex items-center gap-1.5 text-[#00B4C8] font-semibold hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => {
            const formattedPrice = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(property.price.mxn);

            return (
              <Link
                key={property.id}
                href={`/${locale}/propiedades/${property.slug}`}
                className="group block"
              >
                <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Image container */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={property.images[0]}
                      alt={`${property.name} - ${property.location.city}`}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Save button */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                      aria-label="Guardar"
                    >
                      <Heart size={16} className="text-gray-600" />
                    </button>
                    {/* Badge */}
                    {property.badge && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md shadow-sm ${
                          property.badge === 'preventa'
                            ? 'bg-[#F5A623] text-white'
                            : property.badge === 'nuevo'
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-[#00B4C8] text-white'
                        }`}>
                          {tStages(property.badge)}
                        </span>
                      </div>
                    )}
                    {/* Photo count */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                      {property.images.length} fotos
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Price */}
                    <div className="text-xl font-bold text-[#2C2C2C] mb-1">
                      {formattedPrice}
                    </div>

                    {/* Specs row */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      {property.specs.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed size={14} /> <strong>{property.specs.bedrooms}</strong> rec
                        </span>
                      )}
                      {property.specs.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath size={14} /> <strong>{property.specs.bathrooms}</strong> ba
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Maximize size={14} /> <strong>{property.specs.area}</strong> m²
                      </span>
                    </div>

                    {/* Name & Location */}
                    <h3 className="font-semibold text-[#2C2C2C] text-sm mb-1 line-clamp-1">
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{property.location.zone}, {property.location.city}</span>
                    </div>

                    {/* ROI badge */}
                    {property.roi.projected > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-[#00B4C8]/10 text-[#009AB0] text-xs font-bold rounded-full">
                        ROI {property.roi.projected}% anual
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href={`/${locale}/propiedades`}
            className="inline-flex items-center gap-1 text-[#00B4C8] font-semibold"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
