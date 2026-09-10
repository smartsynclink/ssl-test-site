import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sanityFetch, client } from '@/sanity/client';
import { PAGE_QUERY, SETTINGS_QUERY, SLUGS_QUERY } from '@/lib/queries';
import SiteShell from '@/components/SiteShell';
import { buildMetadata } from '@/lib/metadata';
import type { Page, Settings } from '@/lib/types';

// No route-level `export const revalidate`: it is required to be a static
// literal, so it cannot be relaxed in development, and it caches the rendered
// page even when the underlying fetch is uncached. Next derives the route's
// revalidate from its fetches instead, so sanityFetch controls it -- 3600s in
// production, uncached in dev so Studio edits appear on refresh.
// Only the slugs that exist in Sanity are served; anything else 404s rather
// than being generated on demand.
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(SLUGS_QUERY);
  return slugs.filter(Boolean).map(slug => ({ slug }));
}

const load = (slug: string) => Promise.all([
  sanityFetch<Page>({ query: PAGE_QUERY, params: { slug }, tags: [`page:${slug}`, 'page'] }),
  sanityFetch<Settings>({ query: SETTINGS_QUERY, tags: ['siteSettings'] }),
]);

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await load(slug);
  return buildMetadata(page, settings, `/${slug}`);
}

export default async function SlugPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params;
  const [page, settings] = await load(slug);
  if (!page) notFound();
  return <SiteShell page={page} settings={settings} />;
}
