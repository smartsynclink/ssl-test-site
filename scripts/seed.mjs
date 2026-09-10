/**
 * Seed the Sanity dataset from the extracted live-site content.
 *
 * Idempotent: every document gets a deterministic _id and is written with
 * createOrReplace, and uploaded assets are cached in .sanity-assets.json so a
 * re-run does not re-upload the same media. Safe to run repeatedly.
 *
 * Usage: node scripts/seed.mjs <seed.json>
 */
// createClient is re-exported by next-sanity; no extra dependency needed.
import { createClient } from 'next-sanity';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error('SANITY_API_WRITE_TOKEN is not set'); process.exit(1); }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'w2d9vne3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
});

const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const CACHE = '.sanity-assets.json';
const assetCache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

const slugify = s => String(s).toLowerCase().normalize('NFKD')
  .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
const key = () => Math.random().toString(36).slice(2, 12);

/** Upload a remote asset once and return a Sanity reference. */
async function asset(url, kind = 'image') {
  if (!url) return undefined;
  if (!assetCache[url]) {
    const res = await fetch(url);
    if (!res.ok) { console.warn(`  ! ${res.status} ${url}`); return undefined; }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = url.split('/').pop();
    const doc = await client.assets.upload(kind, buf, { filename });
    assetCache[url] = doc._id;
    writeFileSync(CACHE, JSON.stringify(assetCache, null, 2));
    console.log(`  + ${kind} ${filename} (${(buf.length / 1024).toFixed(0)}kb)`);
  }
  const _ref = assetCache[url];
  return kind === 'image'
    ? { _type: 'image', asset: { _type: 'reference', _ref } }
    : { _type: 'file', asset: { _type: 'reference', _ref } };
}

const ref = _ref => ({ _type: 'reference', _ref, _key: key() });
const rel = h => (h ?? '').replace('https://lumenhomeservices.com', '') || undefined;
/** First non-phone CTA in a section; phone CTAs are rebuilt from settings. */
const primaryCta = s => (s.ctas ?? []).find(c => !c.href?.startsWith('tel:'));
const hasCall = s => (s.ctas ?? []).some(c => c.href?.startsWith('tel:'));
const pages = Object.entries(data);
const any = pages.find(([s]) => s === 'austin')[1];

// ---------- shared documents ----------
const docs = [];
const faqId = q => `faq-${slugify(q).slice(0, 40)}`;
const reviewId = n => `review-${slugify(n)}`;
const projectId = t => `project-${slugify(t)}`;
const videoId = t => `video-${slugify(t)}`;

const allFaqs = new Map(), allReviews = new Map(),
      allProjects = new Map(), allVideos = new Map();
for (const [, p] of pages) {
  for (const r of p.reviews ?? []) allReviews.set(r.name, r);
  // sections carry the page's own FAQ/gallery content; the DATA block is only
  // a fallback for landing pages and is already merged in by the extractor
  for (const s of p.sections ?? []) {
    for (const f of s.faqs ?? []) allFaqs.set(f.q, f);
    for (const g of s.projects ?? []) allProjects.set(g.title, g);
    for (const v of s.videos ?? []) allVideos.set(v.title, v);
  }
}

console.log(`uploading assets...`);
for (const [q, f] of allFaqs)
  docs.push({ _id: faqId(q), _type: 'faq', question: f.q, answer: f.a });
for (const [n, r] of allReviews)
  docs.push({ _id: reviewId(n), _type: 'review', author: r.name, quote: r.quote,
    initials: n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(), rating: 5 });
for (const [t, g] of allProjects)
  docs.push({ _id: projectId(t), _type: 'project', title: g.title, caption: g.desc,
    beforeImage: await asset(g.before), afterImage: await asset(g.after) });
for (const [t, v] of allVideos)
  docs.push({ _id: videoId(t), _type: 'videoItem', title: v.title, caption: v.desc,
    video: await asset(v.video, 'file') });

// ---------- site settings ----------
const cats = [];
for (const c of any.serviceCategories ?? []) {
  cats.push({ _key: key(), id: c.id, title: c.title, blurb: c.blurb,
    href: (any.categoryPage?.[c.id] ?? '').replace('https://lumenhomeservices.com', ''),
    image: await asset(c.image), services: c.services });
}
docs.push({
  _id: 'siteSettings', _type: 'siteSettings',
  businessName: 'Lumen Home Services',
  logo: await asset('https://assets.cdn.filesafe.space/N6dAknawTy7yJ5MGdoHt/media/6a9920624f990c6db2cd9596.webp'),
  footerNote: 'Licensed, certified, and locally owned — bringing light to every home with honest, documented work across Greater Austin, TX.',
  phone: any.business.phone, phoneHref: any.business.phoneHref, email: any.business.email,
  serviceAreaLabel: 'Greater Austin, TX',
  hours: 'Sun – Fri, 9:00 AM – 6:00 PM',
  social: {
    facebook: 'https://www.facebook.com/LumenHomeServices',
    instagram: 'https://www.instagram.com/lumenhomeservices.tx',
    yelp: 'https://www.yelp.com/biz/lumen-home-services-austin',
  },
  navLinks: [
    { _key: key(), label: 'Projects', href: '/projects' },
    { _key: key(), label: 'FAQs', href: '/faqs' },
    { _key: key(), label: 'Contact', href: '/contact' },
  ],
  navServicesLabel: 'Services',
  navAreasLabel: 'Service Areas',
  headerCtaLabel: 'Request a Quote',
  headerCtaHref: '/contact#quote',
  footerColumns: [
    { _key: key(), title: 'Services', fromServiceCategories: true, links: [] },
    { _key: key(), title: 'Company', links: [
      { _key: key(), label: 'Projects', href: '/projects' },
      { _key: key(), label: 'Reviews', href: '/#reviews' },
      { _key: key(), label: 'Service Area', href: '/#area' },
      { _key: key(), label: 'FAQs', href: '/faqs' },
      { _key: key(), label: 'Request a Quote', href: '/contact#quote' },
    ] },
  ],
  footerContactTitle: 'Contact',
  trustItems: [
    { _key: key(), title: '5+ Years Experience', sub: 'Locally owned & operated', icon: 'clock' },
    { _key: key(), title: 'Serving Austin & Surrounding Areas', sub: 'Residential home services', icon: 'pin' },
    { _key: key(), title: 'Before & After Documentation', sub: 'Every job photographed', icon: 'camera' },
    { _key: key(), title: 'Customer Satisfaction Focused', sub: 'Professional & reliable service', icon: 'heart' },
  ],
  ui: {
    stickyCallLabel: 'Call Now', stickyQuoteLabel: 'Request a Quote',
    contactPhoneLabel: 'Phone', contactEmailLabel: 'Email',
    contactAreaLabel: 'Service Area', contactHoursLabel: 'Hours',
    namePlaceholder: 'Full name', phonePlaceholder: 'Phone number',
    emailPlaceholder: 'Email', servicePlaceholder: 'Service needed',
    serviceOtherOption: 'Not sure / other',
    submitLabel: 'Request My Quote', submittingLabel: 'Sending…',
    successTitle: "Thanks, we've got your request.",
    successBody: "We'll reach out shortly, or call",
    errorName: 'Name required', errorPhone: 'Valid phone required',
    errorEmail: 'Valid email required', errorService: 'Please select a service',
    errorConsent: 'Please agree to continue',
    errorSubmit: 'Something went wrong. Please call',
    beforeLabel: 'Before', afterLabel: 'After', dragLabel: 'Drag',
    dragCaptionPrefix: 'Drag to compare.',
    learnMoreLabel: 'Learn More', aboutCallLabel: 'Call Now', backToTopLabel: 'Back to top',
    srName: 'Full Name', srPhone: 'Phone', srEmail: 'Email', srService: 'Service Needed',
    videoUnmuteLabel: 'Tap to unmute', videoMuteLabel: 'Tap to mute',
  },
  serviceCategories: cats,
  serviceAreas: (any.serviceAreas ?? []).map(n => ({ _key: key(), name: n, slug: any.areaSlug[n] })),
  serviceAreasNote: '& surrounding Greater Austin areas',
  integrations: {},
});

// ---------- pages ----------
const CITY = new Set(Object.values(any.areaSlug ?? {}));
for (const [slug, p] of pages) {
  const isHome = slug === 'home';
  const theme = isHome || CITY.has(slug) ? 'landing' : 'inner';
  const sections = [];
  for (const s of p.sections ?? []) {
    const base = { _key: key(), _type: s._type };
    if (s._type === 'heroSection') {
      const images = [];
      for (const u of p.heroImages ?? []) {
        const a = await asset(u);
        if (a) images.push({ ...a, _key: key() });
      }
      sections.push({ ...base, headingLines: s.headingLines, intro: s.intro,
        formHeading: s.formHeading, formHeadingEmphasis: s.formHeadingEmphasis,
        consentText: s.consentText, images });
    } else if (s._type === 'proofSection') {
      const pc = primaryCta(s);
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading, subheading: s.subheading,
        headVariant: s.headVariant, sectionStyle: s.sectionStyle,
        category: s.category, ctaLabel: pc?.label, ctaHref: rel(pc?.href),
        projects: (s.projects ?? []).map(g => ref(projectId(g.title))),
        videos: (s.videos ?? []).map(v => ref(videoId(v.title))) });
    } else if (s._type === 'faqSection') {
      const fc = primaryCta(s);
      const grouped = (s.groups ?? []).length > 0;
      sections.push({ ...base, heading: s.heading, ctaLabel: fc?.label, ctaHref: rel(fc?.href),
        sectionStyle: s.sectionStyle, headingStyle: s.headingStyle,
        faqs: grouped ? [] : (s.faqs ?? []).map(f => ref(faqId(f.q))),
        groups: grouped ? s.groups.map(g => ({ _key: key(), title: g.title,
          faqs: g.faqs.map(f => ref(faqId(f.q))) })) : undefined });
    } else if (s._type === 'breakdownSection') {
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading, subheading: s.subheading,
        cards: (s.cards ?? []).map(c => ({ _key: key(), title: c.title, body: c.body })) });
    } else if (s._type === 'filterBar') {
      sections.push({ ...base,
        filters: (s.filters ?? []).map(f => ({ _key: key(), label: f.label, value: f.value })) });
    } else if (s._type === 'photoSection') {
      const photos = [];
      for (const ph of s.photos ?? []) {
        const img = await asset(ph.src);
        if (img) photos.push({ _key: key(), image: img, alt: ph.alt, caption: ph.caption });
      }
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading,
        category: s.category, photos });
    } else if (s._type === 'mapSection') {
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading,
        subheading: s.subheading, mapQuery: decodeURIComponent(s.mapQuery ?? 'Austin,TX') });
    } else if (s._type === 'innerHero') {
      const img = await asset(s.bgImage);
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading, intro: s.intro,
        centered: !!s.centered, image: img ? { ...img, alt: s.bgAlt } : undefined });
    } else if (s._type === 'reviewsSection') {
      const rc = primaryCta(s);
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading, subheading: s.subheading,
        ctaLabel: rc?.label, ctaHref: rel(rc?.href),
        reviews: (p.reviews ?? []).map(r => ref(reviewId(r.name))) });
    } else if (s._type === 'proseSection') {
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading,
        body: (s.body ?? []).map(b => ({ _type: 'block', _key: key(), style: b.style,
          children: [{ _type: 'span', _key: key(), text: b.text, marks: [] }] })) });
    } else if (s._type === 'ctaBand') {
      const c = primaryCta(s);
      sections.push({ ...base, heading: s.heading, overlayOpacity: s.overlayOpacity,
        image: await asset(s.bgImage), showCall: hasCall(s), parallax: !!s.parallax, directImage: !!s.directImage,
        ctaLabel: c?.label, ctaHref: rel(c?.href) });
    } else if (s._type === 'aboutSection') {
      const c = primaryCta(s);
      const v = [...allVideos.keys()][1] ?? [...allVideos.keys()][0];
      sections.push({ ...base, heading: s.heading, intro: s.intro, bullets: s.bullets,
        headingEmphasis: s.headingEmphasis,
        showCall: hasCall(s), ctaLabel: c?.label, ctaHref: rel(c?.href),
        video: v ? { _type: 'reference', _ref: videoId(v) } : undefined });
    } else if (s._type === 'quoteSection') {
      sections.push({ ...base, eyebrow: s.eyebrow, heading: s.heading, subheading: s.subheading,
        consentText: s.consentText, theme: theme === 'landing' ? 'dark' : 'light',
        formHeading: s.formHeading, formHeadingEmphasis: s.formHeadingEmphasis,
        sectionStyle: s.sectionStyle, showContactDetails: true });
    } else {
      const c = primaryCta(s);
      const rest = Object.fromEntries(Object.entries(s)
        .filter(([k, v]) => !['_type', 'ctas', 'bgImage'].includes(k) && v != null));
      sections.push({ ...base, ...rest,
        ...(c ? { ctaLabel: c.label, ctaHref: rel(c.href) } : {}) });
    }
  }
  docs.push({
    _id: `page-${slug}`, _type: 'page',
    title: p.h1 ?? p.title ?? slug,
    slug: { _type: 'slug', current: isHome ? 'home' : slug },
    theme, isHome,
    sections,
    seo: { _type: 'seo', title: p.title, description: p.description },
  });
}

// ---------- write ----------
console.log(`\nwriting ${docs.length} documents...`);
let tx = client.transaction();
for (const d of docs) tx = tx.createOrReplace(d);
await tx.commit();

const counts = docs.reduce((a, d) => ({ ...a, [d._type]: (a[d._type] ?? 0) + 1 }), {});
console.log('done:', counts);
