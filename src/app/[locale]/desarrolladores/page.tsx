import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import B2BHero from '@/components/developers/B2BHero';
import B2BValueProp from '@/components/developers/B2BValueProp';
import B2BProcess from '@/components/developers/B2BProcess';
import B2BForm from '@/components/developers/B2BForm';
import SchemaMarkup from '@/components/shared/SchemaMarkup';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('developersTitle'),
    description: t('developersDescription'),
    alternates: {
      languages: {
        es: '/es/desarrolladores',
        en: '/en/developers',
        'x-default': '/es/desarrolladores',
      },
    },
  };
}

export default function DevelopersPage() {
  return (
    <>
      <SchemaMarkup type="professionalService" />
      <B2BHero />
      <B2BValueProp />
      <B2BProcess />
      <B2BForm />
    </>
  );
}
