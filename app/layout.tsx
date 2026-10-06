import type { CSSProperties } from 'react';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import { sanityFetch } from '@/sanity/client';
import { BRAND_QUERY } from '@/lib/queries';
import { brandProblem, type Brand } from '@/lib/brand';
import { FONTS, jakarta } from './fonts';
import './globals.css';

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Mounts the click-to-edit overlay that Studio's Presentation tool talks to.
  // Only in Draft Mode, so the public site never ships the visual-editing
  // bundle. Without this, Presentation reports "Unable to connect to visual
  // editing" and stays stuck on the published perspective.
  const { isEnabled: isDraft } = await draftMode();

  // Client brand from Site Settings. Empty (or unusable) values keep the
  // template's tokens in globals.css; the data-* flags switch on the shades
  // derived from a custom colour.
  const fetched = await sanityFetch<Brand | null>({ query: BRAND_QUERY, tags: ['siteSettings'] });
  const brand = fetched && !brandProblem(fetched) ? fetched : {};
  const font = brand.font && brand.font in FONTS ? FONTS[brand.font as keyof typeof FONTS] : undefined;
  const style = {
    '--gold': brand.accent || undefined,
    '--ink': brand.dark || undefined,
    '--font': font && `${font.style.fontFamily}, system-ui, sans-serif`,
  } as CSSProperties;

  return (
    <html lang="en" className={jakarta.variable} style={style}
      data-accent={brand.accent ? '' : undefined} data-dark={brand.dark ? '' : undefined}>
      <body>
        {children}
        {isDraft && <VisualEditing />}
      </body>
    </html>
  );
}
