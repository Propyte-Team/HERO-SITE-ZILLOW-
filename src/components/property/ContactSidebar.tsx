'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Calendar, Clock } from 'lucide-react';
import type { Property } from '@/types/property';

interface ContactSidebarProps {
  property: Property;
}

export default function ContactSidebar({ property }: ContactSidebarProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

  const messages: Record<string, string> = {
    es: `Hola, me interesa ${property.name} (Ref: ${property.id}). Vi su sitio web.`,
    en: `Hi, I'm interested in ${property.name} (Ref: ${property.id}). I saw your website.`,
  };

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messages[locale] || messages.es)}`;

  return (
    <div className="sticky top-24 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white font-bold text-sm">
          P
        </div>
        <div>
          <p className="font-semibold text-[#2C2C2C]">{t('contactAdvisor')}</p>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-lg transition-colors mb-3"
      >
        <MessageCircle size={20} />
        {t('whatsappContact')}
      </a>

      <button className="flex items-center justify-center gap-2 w-full h-12 bg-[#00B4C8] hover:bg-[#009AB0] text-white font-semibold rounded-lg transition-colors mb-4">
        <Calendar size={20} />
        {t('scheduleVisit')}
      </button>

      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
        <Clock size={12} />
        {t('responseTime')}
      </div>
    </div>
  );
}
