import { defineField, defineType } from 'sanity';
import { UI_DEFAULTS } from '../../lib/ui';

/**
 * Single source of truth for everything that appears on more than one page:
 * NAP, nav, the service taxonomy, service areas, and third-party integration
 * IDs. Requirement: name/address/phone here must match the Google Business
 * Profile exactly -- they are rendered into the header, footer, contact block
 * and LocalBusiness JSON-LD from this one document.
 */
export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'business', title: 'Business (NAP)', default: true },
    { name: 'nav', title: 'Navigation' },
    { name: 'taxonomy', title: 'Services & Areas' },
    { name: 'integrations', title: 'Integrations' },
    { name: 'seo', title: 'Default SEO' },
  ],
  fields: [
    defineField({
      name: 'businessName', type: 'string', group: 'business', validation: r => r.required(),
      description: 'Must match the Google Business Profile exactly.',
    }),
    defineField({ name: 'logo', type: 'image', group: 'business', options: { hotspot: true } }),
    defineField({
      name: 'phone', type: 'string', group: 'business', validation: r => r.required(),
      description: 'Display format, e.g. (512) 678-0620. Must match GBP exactly.',
    }),
    defineField({
      name: 'phoneHref', type: 'string', group: 'business', validation: r => r.required(),
      description: 'Dial format, e.g. tel:+15126780620',
    }),
    defineField({ name: 'email', type: 'string', group: 'business' }),
    defineField({
      name: 'address', type: 'object', group: 'business',
      description: 'Optional. Only render this if it matches GBP exactly.',
      fields: [
        { name: 'street', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'region', type: 'string' },
        { name: 'postalCode', type: 'string' },
      ],
    }),
    defineField({ name: 'serviceAreaLabel', type: 'string', group: 'business', description: 'e.g. Greater Austin, TX' }),
    defineField({ name: 'licenseNumber', type: 'string', group: 'business',
      description: 'Shown in the trust bar and footer. Leave empty until the client provides it.' }),
    defineField({ name: 'googleRating', type: 'number', group: 'business',
      description: 'Google Business Profile star rating, e.g. 4.9. Never estimate.',
      validation: r => r.min(1).max(5) }),
    defineField({ name: 'googleReviewCount', type: 'number', group: 'business' }),
    defineField({
      name: 'badges', title: 'Badges & listings', type: 'array', group: 'business',
      description: 'Platforms and credentials the client really has (Google, Yelp, Thumbtack, BBB, awards). Never add one they do not hold.',
      of: [{ type: 'object', name: 'badge', fields: [
        { name: 'title', type: 'string' },
        { name: 'sub', type: 'string', description: 'e.g. "5.0 rating". Left empty on the Google badge, the Google rating above is used.' },
        { name: 'icon', type: 'string', options: { list: ['google', 'yelp', 'facebook', 'instagram', 'shield', 'star', 'check'] },
          description: 'Built-in mark. Upload a logo instead for any other platform or award.' },
        { name: 'logo', type: 'image' },
        { name: 'href', type: 'url', description: 'Link to the listing or certificate.' },
      ], preview: { select: { title: 'title', subtitle: 'sub', media: 'logo' } } }],
    }),
    defineField({ name: 'brandLogos', type: 'array', group: 'business',
      description: 'Brand / manufacturer logos for the trust bar. Only brands the client actually carries.',
      of: [{ type: 'image', fields: [{ name: 'alt', type: 'string', title: 'Brand name' }] }] }),
    defineField({ name: 'hours', type: 'string', group: 'business', description: 'e.g. Sun – Fri, 9:00 AM – 6:00 PM' }),
    defineField({
      name: 'social', type: 'object', group: 'business',
      fields: [
        { name: 'facebook', type: 'url' },
        { name: 'instagram', type: 'url' },
        { name: 'yelp', type: 'url' },
      ],
    }),

    defineField({
      name: 'navLinks', title: 'Header links', type: 'array', group: 'nav',
      description: 'In order. Blueprint menu: Home · Services · Service Areas · About · Reviews · Contact.',
      of: [{ type: 'object', name: 'navLink', fields: [
        { name: 'label', type: 'string' },
        { name: 'href', type: 'string' },
        { name: 'menu', type: 'string', description: 'Open a dropdown instead of a plain link.',
          options: { list: [{ title: 'Services', value: 'services' }, { title: 'Service areas', value: 'areas' }] } },
      ], preview: { select: { title: 'label', subtitle: 'href' } } }],
    }),
    defineField({ name: 'headerCtaLabel', type: 'string', group: 'nav', initialValue: 'Request a Quote' }),
    defineField({ name: 'headerCtaHref', type: 'string', group: 'nav', initialValue: '/contact#quote' }),
    defineField({
      name: 'footerColumns', title: 'Footer columns', type: 'array', group: 'nav',
      description: 'The Services column is generated from the service categories if left empty.',
      of: [{ type: 'object', name: 'footerColumn', fields: [
        { name: 'title', type: 'string' },
        { name: 'fromServiceCategories', type: 'boolean',
          description: 'Fill this column from the service categories instead of the links below.' },
        { name: 'links', type: 'array', of: [{ type: 'object', name: 'footerLink', fields: [
          { name: 'label', type: 'string' },
          { name: 'href', type: 'string' },
        ], preview: { select: { title: 'label', subtitle: 'href' } } }] },
      ], preview: { select: { title: 'title' } } }],
    }),
    defineField({
      name: 'footerContactTitle', type: 'string', group: 'nav', initialValue: 'Contact',
    }),
    defineField({
      name: 'legalLinks', title: 'Legal links (footer)', type: 'array', group: 'nav',
      of: [{ type: 'object', name: 'legalLink', fields: [
        { name: 'label', type: 'string' },
        { name: 'href', type: 'string' },
      ], preview: { select: { title: 'label', subtitle: 'href' } } }],
    }),
    defineField({
      name: 'footerNote', type: 'text', rows: 3, group: 'nav',
    }),
    defineField({
      name: 'trustItems', title: 'Trust bar', type: 'array', group: 'taxonomy',
      of: [{ type: 'object', name: 'trustItem', fields: [
        { name: 'title', type: 'string' },
        { name: 'sub', type: 'string' },
        { name: 'icon', type: 'string', options: { list: ['clock', 'pin', 'camera', 'heart', 'shield', 'star'] } },
      ], preview: { select: { title: 'title', subtitle: 'sub' } } }],
    }),
    defineField({
      name: 'ui', title: 'Interface copy', type: 'object', group: 'nav',
      description: 'Every button label, form message and screen-reader label. {tokens} are filled in automatically.',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'consentText', type: 'text', rows: 3,
          description: 'Consent line under every quote form (modal included). Stored with each lead as TCPA evidence.' },
        ...Object.entries(UI_DEFAULTS).map(([name, initialValue]) => ({ name, type: 'string' as const, initialValue })),
      ],
    }),

    defineField({
      name: 'serviceCategories', title: 'Service categories', type: 'array', group: 'taxonomy',
      description: 'Drives the mega menu, the services grid, and the form dropdown.',
      of: [{ type: 'object', fields: [
        { name: 'id', type: 'string', validation: r => r.required() },
        { name: 'title', type: 'string', validation: r => r.required() },
        { name: 'blurb', type: 'text', rows: 2 },
        { name: 'image', type: 'image', options: { hotspot: true } },
        { name: 'href', type: 'string' },
        { name: 'services', type: 'array', of: [{ type: 'string' }] },
      ], preview: { select: { title: 'title', subtitle: 'blurb' } } }],
    }),
    defineField({
      name: 'serviceAreas', title: 'Service areas', type: 'array', group: 'taxonomy',
      of: [{ type: 'object', fields: [
        { name: 'name', type: 'string' },
        { name: 'slug', type: 'string' },
        { name: 'nearby', type: 'array', of: [{ type: 'string' }],
          description: 'Slugs of 2–3 nearby served areas, linked from this city page.' },
      ], preview: { select: { title: 'name', subtitle: 'slug' } } }],
    }),
    defineField({
      name: 'serviceAreasNote', type: 'string', group: 'taxonomy',
      description: 'e.g. "& surrounding Greater Austin areas"',
    }),

    defineField({
      name: 'integrations', type: 'object', group: 'integrations',
      description: 'Public IDs only. Secrets (webhook URLs, API tokens) belong in environment variables, never here.',
      fields: [
        { name: 'ghlFormUrl', type: 'url', title: 'GHL form embed URL',
          description: 'Leave empty to render the built-in custom form instead.' },
        { name: 'ghlFormHeight', type: 'number', title: 'GHL form height (px)',
          description: 'Reserve this height so the embed causes no layout shift.' },
        { name: 'chatWidgetId', type: 'string', title: 'GHL chat widget ID' },
        { name: 'chatWidgetResourcesUrl', type: 'url' },
        { name: 'reviewsWidgetUrl', type: 'url', title: 'GHL reviews widget URL',
          description: 'The iframe src from the GHL Reputation reviews widget embed code.' },
        { name: 'calendarEmbedUrl', type: 'url', title: 'GHL booking calendar URL',
          description: 'Leave empty to hide the booking section entirely.' },
        { name: 'gtmId', type: 'string', title: 'Google Tag Manager ID' },
        { name: 'ga4Id', type: 'string', title: 'GA4 measurement ID' },
        { name: 'metaPixelId', type: 'string', title: 'Meta Pixel ID' },
      ],
    }),

    defineField({ name: 'siteUrl', type: 'url', group: 'seo',
      description: 'Live domain, e.g. https://example.com. Used for canonical links; NEXT_PUBLIC_SITE_URL overrides it per deployment.' }),
    defineField({ name: 'defaultSeo', type: 'seo', group: 'seo' }),
  ],
  preview: { select: { title: 'businessName' }, prepare: ({ title }) => ({ title: title ?? 'Site Settings' }) },
});
