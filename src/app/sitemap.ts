import type { MetadataRoute } from 'next';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

const BASE_URL = 'https://propyte.com';
const LOCALES = ['es', 'en'];
const CITIES = ['cancun', 'playa-del-carmen', 'tulum', 'merida'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/propiedades', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/desarrollos', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/desarrolladores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/corredores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/built', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/quienes-somos', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/estructura', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/nosotros/equipo-comercial', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contacto', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/buscar', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  // ── City pages ────────────────────────────────
  for (const city of CITIES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/desarrollos/${city}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.85,
      });
    }
  }

  // ── Dynamic development pages ────────
  try {
    const supabase = await createServiceRoleClient() || await createServerSupabaseClient();
    const { data: developments } = await supabase
      .from('developments')
      .select('slug, updated_at')
      .eq('published', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (developments) {
      for (const dev of developments) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE_URL}/${locale}/desarrollos/${dev.slug}`,
            lastModified: new Date(dev.updated_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Supabase not connected — fall back to static data
    const { getAllProperties } = await import('@/data/properties');
    const properties = getAllProperties();
    for (const property of properties) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/propiedades/${property.slug}`,
          lastModified: new Date(property.createdAt),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  return entries;
}
