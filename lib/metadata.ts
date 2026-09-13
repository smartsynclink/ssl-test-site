import type { Metadata } from 'next';
import { urlFor } from '@/sanity/image';
import type { Page, Settings } from './types';

/**
 * Page metadata. Everything client-specific comes from Sanity: the page's SEO
 * fields first, then Site Settings' default SEO. The canonical domain is the
 * NEXT_PUBLIC_SITE_URL env var when a deployment sets one, otherwise Site
 * Settings' site URL; with neither, no canonical is emitted rather than a guess.
 */
export function buildMetadata(page: Page | null, settings: Settings, path: string): Metadata {
  if (!page) return {};
  const seo = { ...settings.defaultSeo, ...stripEmpty(page.seo) };
  const title = page.seo?.title || page.title || settings.businessName;
  const description = seo.description;
  const image = seo.ogImage ? urlFor(seo.ogImage).width(1200).height(630).url() : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || settings.siteUrl;
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title,
    description,
    alternates: siteUrl ? { canonical: path } : undefined,
    robots: page.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title, description, url: siteUrl ? path : undefined, siteName: settings.businessName, type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

/** Empty strings in a page's SEO fields shouldn't hide the site-wide defaults. */
const stripEmpty = <T extends object>(o?: T) =>
  Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => v !== '' && v != null)) as Partial<T>;
