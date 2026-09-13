import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Page sections. Each block is deliberately thin: copy and per-page choices
 * live here, while repeated data (services, areas, NAP) is read from
 * siteSettings at render time so it can never drift between pages.
 */

const head = [
  defineField({ name: 'headVariant', type: 'string',
    description: 'Modifier class on the section head in the original (wide, gallery).' }),
  defineField({ name: 'eyebrow', type: 'string' }),
  defineField({ name: 'heading', type: 'string' }),
  defineField({ name: 'subheading', type: 'text', rows: 2 }),
];

export const heroSection = defineType({
  name: 'heroSection', title: 'Hero', type: 'object',
  fields: [
    defineField({
      name: 'layout', type: 'string', initialValue: 'showcase',
      options: { list: [
        { title: 'Showcase (live before/after + photo cards)', value: 'showcase' },
        { title: 'Split (quote form beside the headline)', value: 'split' },
      ], layout: 'radio' },
      description: 'Showcase sends the main button to the quote form further down the page.',
    }),
    defineField({ name: 'h1', title: 'H1 (main service + city)', type: 'string',
      description: 'Blueprint H1, shown above the headline. Leave empty when the headline already names the service and city.' }),
    defineField({ name: 'headingLines', type: 'array', of: [{ type: 'string' }],
      description: 'One entry per rendered line, e.g. "Breathe Easier." / "Live Safer."' }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({ name: 'images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Crossfading background images. The first is the LCP image and is preloaded.' }),
    defineField({ name: 'formHeading', type: 'string', initialValue: 'Get Your Free Quote' }),
    defineField({ name: 'formHeadingEmphasis', type: 'string', initialValue: 'Free Quote',
      description: 'Trailing part of the heading, rendered in gold italic.' }),
    defineField({ name: 'consentText', type: 'text', rows: 3,
      description: 'Stored verbatim with every submission as TCPA consent evidence.' }),
    defineField({ name: 'trustItems', type: 'array', of: [{ type: 'string' }] }),
  ],
  preview: { select: { subtitle: 'intro' }, prepare: ({ subtitle }) => ({ title: 'Hero', subtitle }) },
});

export const innerHero = defineType({
  name: 'innerHero', title: 'Hero (inner page)', type: 'object',
  fields: [
    defineField({ name: 'h1', title: 'H1 (service + city)', type: 'string',
      description: 'Blueprint H1, shown above the headline. Leave empty on pages that are not a service.' }),
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string', validation: r => r.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({ name: 'showCtas', title: 'Show call + quote buttons', type: 'boolean', initialValue: true }),
    defineField({ name: 'centered', type: 'boolean', initialValue: true }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }] }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: `Inner hero — ${title ?? ''}` }) },
});

export const statementSection = defineType({
  name: 'statementSection', title: 'Statement', type: 'object',
  fields: [
    defineField({ name: 'text', type: 'string', validation: r => r.required() }),
    defineField({ name: 'emphasis', type: 'string',
      description: 'The trailing phrase drawn with the gold underline.' }),
  ],
  preview: { select: { title: 'text' }, prepare: ({ title }) => ({ title: `Statement — ${title ?? ''}` }) },
});

export const servicesSection = defineType({
  name: 'servicesSection', title: 'Services grid', type: 'object',
  fields: [...head,
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Services grid' }) },
});

export const ctaBand = defineType({
  name: 'ctaBand', title: 'CTA band', type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: r => r.required() }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'overlayOpacity', type: 'number', initialValue: 0.42,
      description: 'Landing pages use 0.42; inner pages use 0.68.' }),
    defineField({ name: 'showCall', type: 'boolean', initialValue: true }),
    defineField({ name: 'directImage', type: 'boolean', initialValue: false,
      description: 'Render the image as a bare <img class="bg-img"> (landing band 2).' }),
    defineField({ name: 'parallax', type: 'boolean', initialValue: true,
      description: 'Fixed-attachment background. The first band on landing pages uses it.' }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({ title: `CTA band — ${title ?? ''}`, media }) },
});

export const proofSection = defineType({
  name: 'proofSection', title: 'Proof (before/after + video)', type: 'object',
  fields: [...head,
    defineField({ name: 'category', type: 'string',
      description: 'Used by the project filter bar to show/hide this section.' }),
    defineField({ name: 'sectionStyle', type: 'string',
      description: 'Inline style copied from the original markup. Leave alone.' }),
    defineField({ name: 'local', type: 'boolean', initialValue: false,
      description: 'City page: show jobs tagged with this city, and flag [CONTENT NEEDED] when there are none.' }),
    defineField({ name: 'projects', type: 'array', of: [{ type: 'reference', to: [{ type: 'project' }] }] }),
    defineField({ name: 'videos', type: 'array', of: [{ type: 'reference', to: [{ type: 'videoItem' }] }] }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Proof / gallery' }) },
});

export const faqSection = defineType({
  name: 'faqSection', title: 'FAQ', type: 'object',
  fields: [...head,
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'reference', to: [{ type: 'faq' }] }],
      description: 'Flat list. Leave empty when using groups below.' }),
    defineField({ name: 'items', title: 'Questions for this page only', type: 'array',
      description: 'Local or service-specific questions that do not belong in the shared FAQ library.',
      of: [defineArrayMember({ type: 'object', name: 'pageFaq', fields: [
        defineField({ name: 'question', type: 'string', validation: r => r.required() }),
        defineField({ name: 'answer', type: 'text', rows: 4, validation: r => r.required() }),
      ], preview: { select: { title: 'question', subtitle: 'answer' } } })] }),
    defineField({ name: 'needed', type: 'string',
      description: 'Questions still missing, e.g. "Local questions: permits, HOA rules". Renders as [CONTENT NEEDED].' }),
    defineField({ name: 'groups', title: 'Grouped questions', type: 'array',
      description: 'Used by the FAQs page, which splits questions under headings.',
      of: [defineArrayMember({ type: 'object', name: 'faqGroup', fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'faqs', type: 'array',
          of: [{ type: 'reference', to: [{ type: 'faq' }] }] }),
      ], preview: { select: { title: 'title' } } })] }),
    defineField({ name: 'sectionStyle', type: 'string',
      description: 'Inline style copied from the original markup. Leave alone.' }),
    defineField({ name: 'headingStyle', type: 'string',
      description: 'Inline style copied from the original markup. Leave alone.' }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { select: { n: 'faqs' }, prepare: ({ n }) => ({ title: 'FAQ', subtitle: `${n?.length ?? 0} questions` }) },
});

export const aboutSection = defineType({
  name: 'aboutSection', title: 'Why choose us (+ video)', type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'headingEmphasis', type: 'string',
      description: 'Trailing phrase rendered in gold italic.' }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({ name: 'bullets', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'video', type: 'reference', to: [{ type: 'videoItem' }] }),
    defineField({ name: 'showCall', type: 'boolean', initialValue: false }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: `About — ${title ?? ''}` }) },
});

export const areaSection = defineType({
  name: 'areaSection', title: 'Service area', type: 'object',
  fields: [...head,
    defineField({ name: 'mapQuery', type: 'string', description: 'e.g. "Austin,TX". The map loads only on interaction.' }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Service area' }) },
});

export const reviewsSection = defineType({
  name: 'reviewsSection', title: 'Reviews', type: 'object',
  fields: [...head,
    defineField({ name: 'reviews', type: 'array', of: [{ type: 'reference', to: [{ type: 'review' }] }] }),
    defineField({ name: 'local', type: 'boolean', initialValue: false,
      description: 'City page: show reviews from this city, and flag [CONTENT NEEDED] when there are none.' }),
    defineField({ name: 'showWidget', title: 'Show Google reviews widget', type: 'boolean', initialValue: false,
      description: 'Uses the GHL reviews widget URL from Site Settings.' }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Reviews' }) },
});

export const quoteSection = defineType({
  name: 'quoteSection', title: 'Quote / contact', type: 'object',
  fields: [...head,
    defineField({
      name: 'theme', type: 'string', initialValue: 'dark',
      options: { list: [{ title: 'Dark (home & city pages)', value: 'dark' },
                        { title: 'Light (inner pages)', value: 'light' }], layout: 'radio' },
      description: 'Matches the two variants in the original stylesheet.',
    }),
    defineField({ name: 'sectionStyle', type: 'string',
      description: 'Inline style copied from the original markup. Leave alone.' }),
    defineField({ name: 'showContactDetails', type: 'boolean', initialValue: true,
      description: 'Off = final CTA band (headline, phone, short form), as the Blueprint asks for.' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true },
      description: 'Background for the CTA band layout.' }),
    defineField({ name: 'formHeading', type: 'string', initialValue: 'Get Your Free Quote' }),
    defineField({ name: 'formHeadingEmphasis', type: 'string', initialValue: 'Free Quote',
      description: 'Trailing part of the heading, rendered in gold italic.' }),
    defineField({ name: 'consentText', type: 'text', rows: 3 }),
  ],
  preview: { select: { subtitle: 'theme' }, prepare: ({ subtitle }) => ({ title: 'Quote form', subtitle }) },
});

export const bookingSection = defineType({
  name: 'bookingSection', title: 'Booking calendar', type: 'object',
  description: 'Renders nothing unless a calendar URL is set in Site Settings.',
  fields: [...head,
    defineField({ name: 'buttonLabel', type: 'string', initialValue: 'Book an appointment' }),
  ],
  preview: { prepare: () => ({ title: 'Booking calendar' }) },
});

export const breakdownSection = defineType({
  name: 'breakdownSection', title: 'Cards / steps / checklist', type: 'object',
  description: "What's included, how it works, signs you need this, pricing, offers.",
  fields: [...head,
    defineField({ name: 'variant', type: 'string', initialValue: 'cards',
      options: { list: [
        { title: 'Cards', value: 'cards' },
        { title: 'Numbered steps (a real sequence only)', value: 'steps' },
        { title: 'Checklist', value: 'checks' },
      ], layout: 'radio' } }),
    defineField({ name: 'cards', type: 'array', of: [{ type: 'object', fields: [
      { name: 'title', type: 'string' },
      { name: 'body', type: 'text', rows: 3 },
    ], preview: { select: { title: 'title', subtitle: 'body' } } }] }),
  ],
  preview: { select: { n: 'cards' },
    prepare: ({ n }) => ({ title: 'Cards / steps / checklist', subtitle: `${n?.length ?? 0} items` }) },
});

export const filterBar = defineType({
  name: 'filterBar', title: 'Project filter bar', type: 'object',
  fields: [
    defineField({ name: 'filters', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string', description: 'Matches a section category below.' },
    ], preview: { select: { title: 'label', subtitle: 'value' } } }] }),
  ],
  preview: { prepare: () => ({ title: 'Project filter bar' }) },
});

export const photoSection = defineType({
  name: 'photoSection', title: 'Photo grid', type: 'object',
  fields: [...head,
    defineField({ name: 'category', type: 'string' }),
    defineField({ name: 'photos', type: 'array', of: [{ type: 'object', fields: [
      { name: 'image', type: 'image', options: { hotspot: true } },
      { name: 'alt', type: 'string', description: 'Differs from the caption in the original.' },
      { name: 'caption', type: 'string' },
    ], preview: { select: { title: 'caption', media: 'image' } } }] }),
  ],
  preview: { select: { n: 'photos' },
    prepare: ({ n }) => ({ title: 'Photo grid', subtitle: `${n?.length ?? 0} photos` }) },
});

export const mapSection = defineType({
  name: 'mapSection', title: 'Map', type: 'object',
  fields: [...head,
    defineField({ name: 'mapQuery', type: 'string', initialValue: 'Austin,TX' }),
  ],
  preview: { prepare: () => ({ title: 'Map' }) },
});

export const proseSection = defineType({
  name: 'proseSection', title: 'Long-form copy', type: 'object',
  description: 'Used for the per-city SEO copy.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'body', type: 'array', of: [
      defineArrayMember({ type: 'block', styles: [{ title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' }, { title: 'H3', value: 'h3' }] }),
    ] }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: `Copy — ${title ?? ''}` }) },
});

export const trustBar = defineType({
  name: 'trustBar', title: 'Trust bar', type: 'object',
  description: 'Built from Site Settings: trust items, licence number, Google rating, brand logos.',
  fields: [defineField({ name: 'note', type: 'string', hidden: true })],
  preview: { prepare: () => ({ title: 'Trust bar' }) },
});

export const badgesSection = defineType({
  name: 'badgesSection', title: 'Badges & listings', type: 'object',
  description: 'The badges from Site Settings (Google, Yelp, credentials).',
  fields: [...head],
  preview: { prepare: () => ({ title: 'Badges & listings' }) },
});

export const relatedServices = defineType({
  name: 'relatedServices', title: 'Related services', type: 'object',
  description: 'Links to the other service pages, from Site Settings.',
  fields: [...head],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: `Related services — ${title ?? ''}` }) },
});

export const coverageSection = defineType({
  name: 'coverageSection', title: 'Coverage (city page)', type: 'object',
  description: 'Map, response time and nearby areas for this city.',
  fields: [...head,
    defineField({ name: 'mapQuery', type: 'string', description: 'e.g. "Round Rock, TX"' }),
    defineField({ name: 'responseTime', type: 'string', description: 'Only what the client states. Empty = [CONTENT NEEDED].' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: `Coverage — ${title ?? ''}` }) },
});

export const internalLinks = defineType({
  name: 'internalLinks', title: 'Internal links (city page)', type: 'object',
  description: 'Links back to every service page and to nearby city pages.',
  fields: [...head],
  preview: { prepare: () => ({ title: 'Internal links' }) },
});

export const sectionTypes = [
  heroSection, innerHero, statementSection, servicesSection, ctaBand, proofSection,
  faqSection, aboutSection, areaSection, reviewsSection, quoteSection, bookingSection,
  proseSection, breakdownSection, filterBar, photoSection, mapSection,
  trustBar, badgesSection, relatedServices, coverageSection, internalLinks,
];
