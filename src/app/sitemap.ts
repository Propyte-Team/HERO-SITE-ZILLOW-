import type { MetadataRoute } from 'next';
import { getAllProperties } from '@/data/properties';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://propyte.com';
  const properties = getAllProperties();
  const locales = ['es', 'en'];

  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/propiedades', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/desarrolladores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contacto', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  for (const property of properties) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/propiedades/${property.slug}`,
        lastModified: new Date(property.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return entries;
}
