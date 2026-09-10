import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import './globals.css';

// Weights and styles match the original site's Google Fonts request, but
// self-hosted so there is no render-blocking request to fonts.googleapis.com.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lumen Home Services',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Mounts the click-to-edit overlay that Studio's Presentation tool talks to.
  // Only in Draft Mode, so the public site never ships the visual-editing
  // bundle. Without this, Presentation reports "Unable to connect to visual
  // editing" and stays stuck on the published perspective.
  const { isEnabled: isDraft } = await draftMode();

  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body>
        {children}
        {isDraft && <VisualEditing />}
      </body>
    </html>
  );
}
