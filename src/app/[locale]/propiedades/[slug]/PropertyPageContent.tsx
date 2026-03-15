'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPrice } from '@/lib/formatters';
import ImageGallery from '@/components/property/ImageGallery';
import PropertySpecs from '@/components/property/PropertySpecs';
import FinancialSimulator from '@/components/property/FinancialSimulator';
import ContactSidebar from '@/components/property/ContactSidebar';
import MobileContactBar from '@/components/property/MobileContactBar';
import SimilarProperties from '@/components/property/SimilarProperties';
import ContactForm from '@/components/property/ContactForm';
import Badge from '@/components/ui/Badge';

interface PropertyPageContentProps {
  property: Property;
  similar: Property[];
  locale: string;
}

export default function PropertyPageContent({ property, similar, locale }: PropertyPageContentProps) {
  const t = useTranslations('property');
  const tStages = useTranslations('stages');
  const [expanded, setExpanded] = useState(false);

  const description = property.description[locale as 'es' | 'en'] || property.description.es;

  return (
    <div className="pb-24 md:pb-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
        {/* Gallery */}
        <ImageGallery images={property.images} alt={property.name} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{property.name}</h1>
                {property.badge && (
                  <Badge type={property.badge} label={tStages(property.badge)} />
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-500 mb-3">
                <MapPin size={16} />
                <span>{property.location.zone}, {property.location.city}, {property.location.state}</span>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C]">{formatPrice(property.price.mxn)}</div>
            </div>

            {/* Specs */}
            <PropertySpecs property={property} />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] mb-3">{t('description')}</h2>
              <div className={`text-gray-600 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
                {description}
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[#00B4C8] text-sm font-medium mt-2 hover:underline"
              >
                {expanded ? t('readLess') : t('readMore')}
              </button>
            </div>

            {/* Financial Simulator */}
            <FinancialSimulator property={property} />

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] mb-3">{t('location')}</h2>
              <div className="bg-[#F4F6F8] rounded-xl h-48 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p>{property.location.zone}, {property.location.city}</p>
                  <p className="text-xs mt-1">{property.location.address}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] mb-4">{t('contactAdvisor')}</h2>
              <ContactForm propertyId={property.id} propertyName={property.name} />
            </div>

            {/* Similar Properties */}
            <SimilarProperties properties={similar} />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <ContactSidebar property={property} />
          </div>
        </div>
      </div>

      {/* Mobile Contact Bar */}
      <MobileContactBar property={property} />
    </div>
  );
}
