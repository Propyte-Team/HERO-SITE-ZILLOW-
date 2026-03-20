import { getTranslations } from 'next-intl/server';
import BuscarPageContent from './BuscarPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aiSearch' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/buscar`,
      languages: {
        es: '/es/buscar',
        en: '/en/buscar',
        'x-default': '/es/buscar',
      },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    },
  };
}

export default function BuscarPage() {
  return <BuscarPageContent />;
}
