import { getTranslations } from 'next-intl/server';
import MarketplaceContent from './MarketplaceContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('marketplaceTitle'),
    description: t('marketplaceDescription'),
    alternates: {
      canonical: `/${locale}/propiedades`,
      languages: {
        es: '/es/propiedades',
        en: '/en/properties',
        'x-default': '/es/propiedades',
      },
    },
  };
}

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
