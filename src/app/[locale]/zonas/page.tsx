import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoneScores } from '@/lib/supabase/queries';
import { ZoneScoreCard } from '@/components/analytics/ZoneScoreCard';
import { MarketAlertBanner } from '@/components/analytics/MarketAlertBanner';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Zone Intelligence — Vacation Rental Market Scores | Propyte'
    : 'Inteligencia de Zonas — Scores del Mercado de Renta Vacacional | Propyte';
  const description = isEn
    ? 'Compare investment zones in Cancun with AI-powered scores. Occupancy rates, ADR trends, RevPAR, seasonal patterns and supply-demand analysis for each zone.'
    : 'Compara zonas de inversión en Cancún con scores potenciados por IA. Tasas de ocupación, tendencias de ADR, RevPAR, estacionalidad y análisis de oferta-demanda por zona.';

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: isEn ? 'en_US' : 'es_MX' },
    alternates: {
      languages: {
        es: '/es/zonas',
        en: '/en/zonas',
        'x-default': '/es/zonas',
      },
    },
  };
}

export default async function ZonasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const supabase = await createServerSupabaseClient();
  const scores = supabase ? await getZoneScores(supabase, 'Cancun') : [];

  // Sort by score descending
  const sorted = [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isEn ? 'Investment Zone Rankings — Cancun' : 'Rankings de Zonas de Inversión — Cancún',
    description: isEn
      ? 'AI-powered zone intelligence scores for vacation rental investment in Cancun'
      : 'Scores de inteligencia de zonas para inversión en renta vacacional en Cancún',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <a href={`/${locale}`} className="hover:text-gray-700">
            {isEn ? 'Home' : 'Inicio'}
          </a>
          {' / '}
          <span className="text-gray-900 font-medium">{isEn ? 'Zones' : 'Zonas'}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEn ? 'Zone Intelligence' : 'Inteligencia de Zonas'}
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            {isEn
              ? 'AI-powered investment scores for vacation rental zones in Cancun'
              : 'Scores de inversión potenciados por IA para zonas de renta vacacional en Cancún'}
          </p>
        </div>

        {/* Alerts */}
        <div className="mb-6">
          <MarketAlertBanner city="Cancun" maxAlerts={2} />
        </div>

        {/* Zone Grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((score) => {
              const slug = score.zone
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[\/]/g, '-');
              return (
                <a key={score.id} href={`/${locale}/zonas/${slug}`} className="block">
                  <ZoneScoreCard score={score} />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">
              {isEn
                ? 'Zone scores are being computed. Check back soon.'
                : 'Los scores de zona están siendo calculados. Vuelve pronto.'}
            </p>
          </div>
        )}

        {/* Methodology */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {isEn ? 'Methodology' : 'Metodología'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isEn
              ? 'Zone Intelligence Scores (0-100) combine five weighted components: rental yield (30%), occupancy rate (25%), ADR growth (20%), supply pressure (15%), and market liquidity (10%). Data sources include AirDNA vacation rental metrics and 140K+ rental comparables from 8+ portals. Scores are updated weekly.'
              : 'Los Zone Intelligence Scores (0-100) combinan cinco componentes ponderados: yield de renta (30%), tasa de ocupación (25%), crecimiento de ADR (20%), presión de oferta (15%) y liquidez de mercado (10%). Las fuentes incluyen métricas de AirDNA y 140K+ comparables de renta de 8+ portales. Los scores se actualizan semanalmente.'}
          </p>
        </div>
      </main>
    </>
  );
}
