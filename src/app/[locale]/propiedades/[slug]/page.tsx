import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPropertyBySlug, getSimilarProperties, getAllProperties } from '@/data/properties';
import { formatPrice } from '@/lib/formatters';
import PropertyPageContent from './PropertyPageContent';
import SchemaMarkup from '@/components/shared/SchemaMarkup';

export async function generateStaticParams() {
  return getAllProperties().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return {};

  const t = await getTranslations({ locale, namespace: 'stages' });
  const description = property.description[locale as 'es' | 'en'] || property.description.es;

  return {
    title: `${property.name} — ${formatPrice(property.price.mxn)} | Propyte`,
    description: description.slice(0, 155),
    openGraph: {
      title: property.name,
      description,
      images: [{ url: property.images[0], width: 800, height: 450 }],
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.name,
      description,
      images: [property.images[0]],
    },
    alternates: {
      languages: {
        es: `/es/propiedades/${slug}`,
        en: `/en/properties/${slug}`,
        'x-default': `/es/propiedades/${slug}`,
      },
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const property = getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const similar = getSimilarProperties(property, 4);

  return (
    <>
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description: property.description[locale as 'es' | 'en'],
          url: `https://propyte.com/${locale}/propiedades/${slug}`,
          image: property.images[0],
          offers: {
            '@type': 'Offer',
            price: property.price.mxn,
            priceCurrency: 'MXN',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: property.location.city,
            addressRegion: property.location.state,
            addressCountry: 'MX',
          },
        }}
      />
      <PropertyPageContent property={property} similar={similar} locale={locale} />
    </>
  );
}
