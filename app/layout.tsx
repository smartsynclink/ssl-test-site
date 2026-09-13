import { Plus_Jakarta_Sans } from 'next/font/google';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import './globals.css';

// One family carries the whole site: 800 for display, 400-600 for copy.
// Self-hosted by next/font, so there is no render-blocking font request.
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Mounts the click-to-edit overlay that Studio's Presentation tool talks to.
  // Only in Draft Mode, so the public site never ships the visual-editing
  // bundle. Without this, Presentation reports "Unable to connect to visual
  // editing" and stays stuck on the published perspective.
  const { isEnabled: isDraft } = await draftMode();

  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        {children}
        {isDraft && <VisualEditing />}
      </body>
    </html>
  );
}
