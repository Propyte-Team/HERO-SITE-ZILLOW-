import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { TrendingUp, BarChart3, DollarSign, Users, ArrowUpRight } from 'lucide-react';

export default function TrendingMarket() {
  const t = useTranslations('trending');
  const locale = useLocale();

  const stats = [
    { icon: TrendingUp, value: '12-15%', label: t('stat1Label'), color: 'text-[#22C55E]' },
    { icon: DollarSign, value: '+25%', label: t('stat2Label'), color: 'text-[#5CE0D2]' },
    { icon: Users, value: '30%', label: t('stat3Label'), color: 'text-[#F5A623]' },
    { icon: BarChart3, value: '+18%', label: t('stat4Label'), color: 'text-[#1A2F3F]' },
  ];

  const zones = [
    { name: 'Playacar', trend: '+12%' },
    { name: '5ta Avenida', trend: '+15%' },
    { name: 'Tulum Centro', trend: '+18%' },
    { name: 'Zamá', trend: '+14%' },
    { name: 'Aldea Zamá', trend: '+16%' },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#F4F6F8] rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mb-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Trending zones */}
        <div className="bg-[#1A2F3F] rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-white mb-4">{t('zonesTitle')}</h3>
          <div className="space-y-3">
            {zones.map((zone) => (
              <Link
                key={zone.name}
                href={`/${locale}/propiedades?zone=${encodeURIComponent(zone.name)}`}
                className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-lg transition-colors group"
              >
                <div>
                  <span className="text-white font-semibold">{zone.name}</span>
                  <span className="text-white/60 text-sm ml-3">Ver propiedades</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#22C55E] font-bold text-sm">{zone.trend}</span>
                  <ArrowUpRight size={16} className="text-[#22C55E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6 text-center">
          Fuentes: datos estimados basados en análisis de mercado de la Riviera Maya. Rendimientos pasados no garantizan resultados futuros.
        </p>
      </div>
    </section>
  );
}
