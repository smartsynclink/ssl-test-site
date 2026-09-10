import type { Metadata } from 'next';
import { urlFor } from '@/sanity/image';
import type { Page, Settings } from './types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lumenhomeservices.com';

export function buildMetadata(page: Page | null, settings: Settings, path: string): Metadata {
  if (!page) return {};
  const title = page.seo?.title ?? page.title ?? settings.businessName;
  const description = page.seo?.description;
  const image = page.seo?.ogImage ? urlFor(page.seo.ogImage).width(1200).height(630).url() : undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: path },
    robots: page.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title, description, url: path, siteName: settings.businessName, type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}
