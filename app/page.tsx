import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sanityFetch } from '@/sanity/client';
import { HOME_QUERY, SETTINGS_QUERY } from '@/lib/queries';
import SiteShell from '@/components/SiteShell';
import { buildMetadata } from '@/lib/metadata';
import type { Page, Settings } from '@/lib/types';

// No route-level `export const revalidate`: it is required to be a static
// literal, so it cannot be relaxed in development, and it caches the rendered
// page even when the underlying fetch is uncached. Next derives the route's
// revalidate from its fetches instead, so sanityFetch controls it -- 3600s in
// production, uncached in dev so Studio edits appear on refresh.

const load = () => Promise.all([
  sanityFetch<Page>({ query: HOME_QUERY, tags: ['page:home', 'page'] }),
  sanityFetch<Settings>({ query: SETTINGS_QUERY, tags: ['siteSettings'] }),
]);

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await load();
  return buildMetadata(page, settings, '/');
}

export default async function HomePage() {
  const [page, settings] = await load();
  if (!page) notFound();
  return <SiteShell page={page} settings={settings} />;
}
