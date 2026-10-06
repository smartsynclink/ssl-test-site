import { DM_Sans, Inter, Montserrat, Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import type { DEFAULT_BRAND, FontKey } from '@/lib/brand';

// One family carries the whole site: 800 for display, 400-600 for copy.
// Self-hosted by next/font, so there is no render-blocking font request.
export const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// The fonts a client can pick instead (Site Settings → Brand). Not preloaded,
// so a site only downloads the one it uses.
// ponytail: the default is always preloaded, even when a client picks another (one wasted font file); move each font into its own route group if that matters
// (next/font only accepts literal options, hence the repetition.)
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false });
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', preload: false });
const poppins = Poppins({ subsets: ['latin'], display: 'swap', preload: false, weight: ['400', '500', '600', '700', '800'] });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', preload: false });

export const FONTS = {
  inter, montserrat, poppins, 'dm-sans': dmSans,
} satisfies Record<Exclude<FontKey, typeof DEFAULT_BRAND.font>, { style: { fontFamily: string } }>;
