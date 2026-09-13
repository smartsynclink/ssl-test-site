import type { SanityImage } from '@/sanity/image';

export type Settings = {
  businessName: string;
  logo?: SanityImage;
  phone: string;
  phoneHref: string;
  email?: string;
  serviceAreaLabel?: string;
  address?: { street?: string; city?: string; region?: string; postalCode?: string };
  licenseNumber?: string;
  googleRating?: number;
  googleReviewCount?: number;
  brandLogos?: (SanityImage & { alt?: string })[];
  badges?: { _key: string; title: string; sub?: string; icon?: string; logo?: SanityImage; href?: string }[];
  legalLinks?: { label: string; href: string }[];
  hours?: string;
  footerNote?: string;
  social?: { facebook?: string; instagram?: string; yelp?: string };
  serviceCategories?: { id: string; title: string; blurb?: string; href?: string;
    image?: SanityImage; services?: string[] }[];
  serviceAreas?: { name: string; slug?: string; nearby?: string[] }[];
  navLinks?: { label: string; href: string; menu?: 'services' | 'areas' }[];
  headerCtaLabel?: string;
  headerCtaHref?: string;
  footerColumns?: { title: string; fromServiceCategories?: boolean;
    links?: { label: string; href: string }[] }[];
  footerContactTitle?: string;
  trustItems?: { title: string; sub?: string; icon?: string }[];
  ui?: Record<string, string>;
  serviceAreasNote?: string;
  integrations?: {
    ghlFormUrl?: string; ghlFormHeight?: number; reviewsWidgetUrl?: string;
    chatWidgetId?: string; chatWidgetResourcesUrl?: string;
    calendarEmbedUrl?: string; gtmId?: string; ga4Id?: string; metaPixelId?: string;
  };
};

export type Section = { _key: string; _type: string; [k: string]: unknown };

export type Page = {
  _id: string; title: string; slug: { current: string };
  theme: 'landing' | 'inner'; isHome?: boolean;
  sections?: Section[];
  seo?: { title?: string; description?: string; ogImage?: SanityImage; noIndex?: boolean };
};
