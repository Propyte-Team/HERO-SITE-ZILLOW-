import { getTranslations } from 'next-intl/server';
import Hero from '@/components/home/Hero';
import ExploreCategories from '@/components/home/ExploreCategories';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import TrendingMarket from '@/components/home/TrendingMarket';
import WhyPropyte from '@/components/home/WhyPropyte';
import DeveloperBanner from '@/components/home/DeveloperBanner';
import AppDownloadBanner from '@/components/home/AppDownloadBanner';
import RecentBlog from '@/components/home/RecentBlog';
import SchemaMarkup from '@/components/shared/SchemaMarkup';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: {
      languages: {
        es: '/es',
        en: '/en',
        'x-default': '/es',
      },
    },
  };
}

export default function HomePage() {
  return (
    <>
      <SchemaMarkup type="organization" />
      <Hero />
      <ExploreCategories />
      <FeaturedProperties />
      <TrendingMarket />
      <WhyPropyte />
      <DeveloperBanner />
      <AppDownloadBanner />
      <RecentBlog />
    </>
  );
}
