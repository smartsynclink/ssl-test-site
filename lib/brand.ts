/**
 * Client brand: an accent colour, a dark colour and a font, set in Site
 * Settings → Brand (written there from the client's config). Anything left
 * empty keeps the template's own look, so a site with no brand renders exactly
 * as the template does: gold on warm ink, Plus Jakarta Sans.
 */
export const DEFAULT_BRAND = { accent: '#c9a227', dark: '#15130f', font: 'plus-jakarta-sans' } as const;

/** Fonts a client can pick. app/fonts.ts self-hosts each one with next/font. */
export const FONT_OPTIONS = [
  { title: 'Plus Jakarta Sans (template default)', value: 'plus-jakarta-sans' },
  { title: 'Inter', value: 'inter' },
  { title: 'Montserrat', value: 'montserrat' },
  { title: 'Poppins', value: 'poppins' },
  { title: 'DM Sans', value: 'dm-sans' },
] as const;
export type FontKey = (typeof FONT_OPTIONS)[number]['value'];

export type Brand = { accent?: string; dark?: string; font?: FontKey };

const HEX = /^#[0-9a-f]{6}$/i;
const MUTED_ON_DARK = '#aaa292';   // the faintest text the template puts on the dark colour

/** WCAG contrast ratio of two #rrggbb colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Why a brand can't be used, or undefined when it can. Buttons put the dark
 * colour as text on the accent, and dark bands put light text on the dark
 * colour, so both pairs must pass WCAG AA (4.5:1).
 */
export function brandProblem(brand: Brand): string | undefined {
  for (const k of ['accent', 'dark'] as const) {
    if (brand[k] && !HEX.test(brand[k])) return `${k} must be a hex colour like #c9a227, got "${brand[k]}"`;
  }
  if (brand.font && !FONT_OPTIONS.some(f => f.value === brand.font)) return `font "${brand.font}" is not one of the template's fonts`;
  const accent = brand.accent || DEFAULT_BRAND.accent;
  const dark = brand.dark || DEFAULT_BRAND.dark;
  const onAccent = contrast(accent, dark);
  if (onAccent < 4.5) return `dark text on the accent is ${onAccent.toFixed(1)}:1, needs 4.5:1 -- use a lighter accent or a darker dark colour`;
  const onDark = contrast(dark, MUTED_ON_DARK);
  if (onDark < 4.5) return `light text on the dark colour is ${onDark.toFixed(1)}:1, needs 4.5:1 -- use a darker dark colour`;
}
