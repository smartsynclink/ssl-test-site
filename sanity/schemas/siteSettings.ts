import { defineField, defineType } from 'sanity';

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
      of: [{ type: 'object', name: 'navLink', fields: [
        { name: 'label', type: 'string' },
        { name: 'href', type: 'string' },
      ], preview: { select: { title: 'label', subtitle: 'href' } } }],
    }),
    defineField({ name: 'navServicesLabel', type: 'string', group: 'nav', initialValue: 'Services' }),
    defineField({ name: 'navAreasLabel', type: 'string', group: 'nav', initialValue: 'Service Areas' }),
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
      name: 'footerNote', type: 'text', rows: 3, group: 'nav',
    }),
    defineField({
      name: 'trustItems', title: 'Trust bar', type: 'array', group: 'taxonomy',
      of: [{ type: 'object', name: 'trustItem', fields: [
        { name: 'title', type: 'string' },
        { name: 'sub', type: 'string' },
        { name: 'icon', type: 'string', options: { list: ['clock', 'pin', 'camera', 'heart'] } },
      ], preview: { select: { title: 'title', subtitle: 'sub' } } }],
    }),
    defineField({
      name: 'ui', title: 'Interface copy', type: 'object', group: 'nav',
      description: 'Button labels, form placeholders and messages.',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'stickyCallLabel', type: 'string', initialValue: 'Call Now' },
        { name: 'stickyQuoteLabel', type: 'string', initialValue: 'Request a Quote' },
        { name: 'contactPhoneLabel', type: 'string', initialValue: 'Phone' },
        { name: 'contactEmailLabel', type: 'string', initialValue: 'Email' },
        { name: 'contactAreaLabel', type: 'string', initialValue: 'Service Area' },
        { name: 'contactHoursLabel', type: 'string', initialValue: 'Hours' },
        { name: 'namePlaceholder', type: 'string', initialValue: 'Full name' },
        { name: 'phonePlaceholder', type: 'string', initialValue: 'Phone number' },
        { name: 'emailPlaceholder', type: 'string', initialValue: 'Email' },
        { name: 'servicePlaceholder', type: 'string', initialValue: 'Service needed' },
        { name: 'serviceOtherOption', type: 'string', initialValue: 'Not sure / other' },
        { name: 'submitLabel', type: 'string', initialValue: 'Request My Quote' },
        { name: 'submittingLabel', type: 'string', initialValue: 'Sending…' },
        { name: 'successTitle', type: 'string', initialValue: "Thanks, we've got your request." },
        { name: 'successBody', type: 'string', initialValue: "We'll reach out shortly, or call" },
        { name: 'errorName', type: 'string', initialValue: 'Name required' },
        { name: 'errorPhone', type: 'string', initialValue: 'Valid phone required' },
        { name: 'errorEmail', type: 'string', initialValue: 'Valid email required' },
        { name: 'errorService', type: 'string', initialValue: 'Please select a service' },
        { name: 'errorConsent', type: 'string', initialValue: 'Please agree to continue' },
        { name: 'errorSubmit', type: 'string', initialValue: 'Something went wrong. Please call' },
        { name: 'beforeLabel', type: 'string', initialValue: 'Before' },
        { name: 'afterLabel', type: 'string', initialValue: 'After' },
        { name: 'dragLabel', type: 'string', initialValue: 'Drag' },
        { name: 'dragCaptionPrefix', type: 'string', initialValue: 'Drag to compare.' },
        { name: 'learnMoreLabel', type: 'string', initialValue: 'Learn More' },
        { name: 'aboutCallLabel', type: 'string', initialValue: 'Call Now' },
        { name: 'backToTopLabel', type: 'string', initialValue: 'Back to top' },
        { name: 'srName', type: 'string', initialValue: 'Full Name' },
        { name: 'srPhone', type: 'string', initialValue: 'Phone' },
        { name: 'srEmail', type: 'string', initialValue: 'Email' },
        { name: 'srService', type: 'string', initialValue: 'Service Needed' },
        { name: 'videoUnmuteLabel', type: 'string', initialValue: 'Tap to unmute' },
        { name: 'videoMuteLabel', type: 'string', initialValue: 'Tap to mute' },
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
        { name: 'calendarEmbedUrl', type: 'url', title: 'GHL booking calendar URL',
          description: 'Leave empty to hide the booking section entirely.' },
        { name: 'gtmId', type: 'string', title: 'Google Tag Manager ID' },
        { name: 'ga4Id', type: 'string', title: 'GA4 measurement ID' },
        { name: 'metaPixelId', type: 'string', title: 'Meta Pixel ID' },
      ],
    }),

    defineField({ name: 'defaultSeo', type: 'seo', group: 'seo' }),
  ],
  preview: { select: { title: 'businessName' }, prepare: ({ title }) => ({ title: title ?? 'Site Settings' }) },
});
