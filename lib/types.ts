import type { SanityImage } from '@/sanity/image';

export type Settings = {
  businessName: string;
  logo?: SanityImage;
  phone: string;
  phoneHref: string;
  email?: string;
  serviceAreaLabel?: string;
  hours?: string;
  footerNote?: string;
  social?: { facebook?: string; instagram?: string; yelp?: string };
  serviceCategories?: { id: string; title: string; blurb?: string; href?: string;
    image?: SanityImage; services?: string[] }[];
  serviceAreas?: { name: string; slug?: string }[];
  navLinks?: { label: string; href: string }[];
  navServicesLabel?: string;
  navAreasLabel?: string;
  headerCtaLabel?: string;
  headerCtaHref?: string;
  footerColumns?: { title: string; fromServiceCategories?: boolean;
    links?: { label: string; href: string }[] }[];
  footerContactTitle?: string;
  trustItems?: { title: string; sub?: string; icon?: string }[];
  ui?: Record<string, string>;
  serviceAreasNote?: string;
  integrations?: {
    ghlFormUrl?: string; ghlFormHeight?: number;
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
