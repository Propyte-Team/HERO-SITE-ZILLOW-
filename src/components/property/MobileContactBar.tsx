'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Calendar } from 'lucide-react';
import type { Property } from '@/types/property';

interface MobileContactBarProps {
  property: Property;
}

export default function MobileContactBar({ property }: MobileContactBarProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

  const msg = locale === 'es'
    ? `Hola, me interesa ${property.name} (Ref: ${property.id}).`
    : `Hi, I'm interested in ${property.name} (Ref: ${property.id}).`;

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-30 md:hidden">
      <div className="flex gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <button className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#00B4C8] hover:bg-[#009AB0] text-white font-semibold rounded-lg transition-colors text-sm">
          <Calendar size={18} />
          {t('scheduleVisit')}
        </button>
      </div>
    </div>
  );
}
