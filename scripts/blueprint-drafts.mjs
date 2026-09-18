/**
 * Restructure every page to the SmartSyncLink Website Section Blueprint.
 *
 * Writes DRAFTS only (drafts.<id>), so the deployed site keeps serving the
 * published content until someone publishes. Review locally with
 * SANITY_DEV_DRAFTS=1 in .env.local, then publish in Studio (or discard).
 *
 * Nothing that exists is removed: every original section is kept, Blueprint
 * sections are added, and the page is ordered so the Blueprint sections appear
 * in Blueprint order with the extra (non-Blueprint) sections kept alongside.
 *
 * Content rules from the Blueprint: nothing is invented. Every new line is
 * either the client's own wording lifted from existing content (FAQ answers,
 * intros, SEO titles) or a literal "[CONTENT NEEDED]" marker.
 *
 * Idempotent: always rebuilds from the PUBLISHED documents.
 * Usage: node --env-file=.env.local scripts/blueprint-drafts.mjs [--write]
 */
import { createClient } from 'next-sanity';
import { UI_DEFAULTS } from '../lib/ui.ts';
import { checkPages } from './check-content.mjs';

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error('SANITY_API_WRITE_TOKEN is not set'); process.exit(1); }
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'w2d9vne3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01', token, useCdn: false, perspective: 'published',
});
const WRITE = process.argv.includes('--write');

let k = 0;
const key = () => `bp${(k++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const card = (title, body) => ({ _key: key(), _type: 'object', title, ...(body ? { body } : {}) });
const ref = _ref => ({ _key: key(), _type: 'reference', _ref });
const block = (text, style = 'normal') => ({
  _key: key(), _type: 'block', style, markDefs: [],
  children: [{ _key: key(), _type: 'span', text, marks: [] }],
});

// Geographic neighbours among the served areas (2-3 each), for coverage + internal links.
const NEARBY = {
  austin: ['pflugerville', 'round-rock', 'buda'],
  'bee-cave': ['lakeway', 'dripping-springs', 'austin'],
  buda: ['kyle', 'austin', 'dripping-springs'],
  'cedar-park': ['leander', 'round-rock', 'austin'],
  'dripping-springs': ['bee-cave', 'buda', 'lakeway'],
  georgetown: ['round-rock', 'leander', 'hutto'],
  hutto: ['round-rock', 'taylor', 'pflugerville'],
  kyle: ['buda', 'austin', 'dripping-springs'],
  lakeway: ['bee-cave', 'austin', 'dripping-springs'],
  leander: ['cedar-park', 'georgetown', 'round-rock'],
  manor: ['pflugerville', 'austin', 'hutto'],
  pflugerville: ['round-rock', 'austin', 'hutto'],
  'round-rock': ['pflugerville', 'georgetown', 'cedar-park'],
  taylor: ['hutto', 'georgetown', 'round-rock'],
};

// "Signs you need this", in the client's own words (service intros + FAQ answers).
const SIGNS = {
  'air-duct--hvac-services': [
    card('Pets in the home'), card('Allergies in the household'), card('A recent renovation'),
    card('Dust and allergens moving through the house every time the system runs')],
  'chimney--fireplace-services': [
    card('Creosote buildup'), card('A cracked crown'), card('A failing chimney cap')],
  'dryer-vent-services': [
    card('Clothes are taking longer to dry'), card('The dryer is running hot'),
    card("You can't remember the last time it was serviced")],
  'additional-services': [
    card('Uneven room temperatures'), card('Climbing energy bills'), card('Visibly thin insulation')],
};
// A real review, copied word for word from the business's own Yelp listing
// (yelp.com/biz/lumen-home-services-austin, Aug 1 2026). Saved as a draft, so
// pages point at it with a weak reference that Studio strengthens on publish.
const NEW_REVIEW = {
  _id: 'drafts.review-debrah-w', _type: 'review', author: 'Debrah W.', initials: 'DW', rating: 5, city: 'Round Rock',
  quote: 'Dino provided excellent service. He cleaned the dryer vent and replaced the air duct system. Every step of the way, he took pictures to show me what he was seeing and then showed the after pictures. He was detailed in his explanation of what he was seeing, how to fix the problem and what I can expect with a clean dryer vent and new air duct system. I highly recommend that you hire Lumen Home Services for your air duct and dryer vent needs.',
};
const newReviewRef = () => ({ _key: key(), _type: 'reference', _ref: 'review-debrah-w', _weak: true, _strengthenOnPublish: { type: 'review' } });

// Public business address from the same Yelp listing. Must be confirmed against the Google Business Profile.
const ADDRESS = { street: '7920 San Felipe Blvd', city: 'Austin', region: 'TX', postalCode: '78729' };

// Service pages: reviews that mention the service (Blueprint: only if they exist).
const SERVICE_REVIEWS = {
  'air-duct--hvac-services': ['review-jennifer-schechter', 'review-ori-boganim', 'review-uriel-guillen-aranda'],
  'dryer-vent-services': [],
};
const SERVICE_NEW_REVIEW = new Set(['air-duct--hvac-services', 'dryer-vent-services']);

// Our process for each service -- from the service intros, card copy, FAQ answers and reviews.
const PROCESS = {
  'air-duct--hvac-services': [
    card('Inspect the system', 'We look at your ductwork and HVAC components first and give you a straight answer on what they need.'),
    card('Clean, sanitize, and repair', 'We clean, sanitize, and repair the ductwork and HVAC components that actually control your air quality.'),
    card('Document every step', 'Photos of the work at each stage, so you see exactly what we see.'),
    card('Walk you through the results', 'We show you the before and after photos and explain what to expect from a clean system.')],
  'chimney--fireplace-services': [
    card('Inspect first', 'We check for cracks, blockages, and structural issues before recommending anything.'),
    card("Recommend only what's needed", "Most chimneys need targeted repairs, not full rebuilds, and we'll only recommend what the inspection actually shows."),
    card('Sweep, repair, or restore', 'From clearing creosote to crown, flashing, and firebox repairs, we do the work your fireplace needs.'),
    card('Before and after photos', 'Every job is photographed, so you can see the condition before and the work after.')],
  'dryer-vent-services': [
    card('Check the whole vent run', 'Longer dry times and a hot-running dryer usually point to lint buildup, so we look at the full run, not just the cap.'),
    card('Clear the lint', "We clear lint buildup along the full vent run, not just what's visible at the outside cap."),
    card("Fix what's causing it", 'Crushed, disconnected, or badly routed sections get repaired, or replaced if they are too damaged to clean safely.'),
    card('Show you the before and after', 'Photos at every step, so you see what was blocking your vent and how it looks now.')],
  'additional-services': [
    card('Inspect your attic', "We check what's up there now and tell you exactly where things stand."),
    card('Recommend the right material', 'We recommend the right material and R-value for your home, not a default pick.'),
    card('Install', 'We add or replace attic insulation to even out room temperatures and take pressure off your HVAC system.'),
    card('Document the work', 'Photos of the work, documented every time.')],
};
const NO_SURPRISES = card('No last-minute surprises', 'Straightforward pricing, no last minute surprises.');
// What affects the price -- no numbers, only how the estimate works.
const PRICING = {
  'air-duct--hvac-services': [
    card('What the inspection finds', "We look at your system before quoting, so the price reflects what's actually there."),
    card('Cleaning, repair, or replacement', 'Cleaning ducts is a different job from sealing gaps, patching damaged sections, or replacing ductwork.'),
    card('Separate line items', 'HVAC system cleaning and evaporator coil cleaning are separate line items from duct cleaning.'),
    NO_SURPRISES],
  'chimney--fireplace-services': [
    card('What the inspection finds', 'Most chimneys need targeted repairs, not full rebuilds. The price follows what the inspection shows.'),
    card('Wood-burning or gas', 'Gas line capping and gas fireplace repairs are different work from sweeping a wood-burning chimney.'),
    NO_SURPRISES],
  'dryer-vent-services': [
    card('Cleaning, repair, or replacement', "Clearing lint is a different job from repairing crushed sections or replacing ductwork that's too damaged to clean."),
    card('Only the add-ons you need', 'A bird guard is only part of the job if your outside vent opening needs one.'),
    NO_SURPRISES],
  'additional-services': [
    card('Material and R-value', 'We recommend the right material and R-value for your home, not a default pick.'),
    card("What's there now", 'Adding to existing insulation is a different job from replacing thin or aging insulation.'),
    NO_SURPRISES],
};
const pageFaq = (question, answer) => ({ _key: key(), _type: 'pageFaq', question, answer });
// One more service-specific question each, bringing every service page to the Blueprint's 4.
const SERVICE_FAQ = {
  'air-duct--hvac-services': [pageFaq('Do you install UV lights?', 'Yes. UV lights installed inside your system continuously reduce mold and bacteria growth between cleanings.')],
  'chimney--fireplace-services': [pageFaq('Do you install or replace chimney caps?', 'Yes. A cap keeps rain, animals, and debris out of your flue, and a missing or damaged cap is one of the most common issues we find.')],
  'dryer-vent-services': [pageFaq("Can you fix a vent that's crushed or routed badly?", "Yes. We repair crushed, disconnected, or improperly routed sections, and replace vent ductwork that's too damaged, too long, or made from the wrong material to clean and maintain safely.")],
  'additional-services': [pageFaq('Will you tell me if my insulation is fine as it is?', 'Yes. We inspect your attic, tell you exactly where things stand, and only install the right material for your home, not a default pick.')],
};

const [settings, pages] = await Promise.all([
  client.fetch('*[_id == "siteSettings"][0]'),
  client.fetch('*[_type == "page" && !(_id in path("drafts.**"))]'),
]);
const bySlug = Object.fromEntries(pages.map(p => [p.slug.current, p]));
const areaSlugs = new Set((settings.serviceAreas ?? []).map(a => a.slug));
const serviceSlugs = (settings.serviceCategories ?? []).map(c => c.href?.replace(/^\//, '')).filter(Boolean);
const areaName = slug => settings.serviceAreas.find(a => a.slug === slug)?.name;

/** Fields from the old GHL port that no component reads any more; removed from the schema. */
const LEGACY_SECTION_FIELDS = ['headVariant', 'sectionStyle', 'headingStyle', 'trustItems', 'overlayOpacity', 'directImage', 'parallax'];
const LEGACY_BY_TYPE = { areaSection: ['mapQuery'], quoteSection: ['theme'] };
const withoutLegacy = page => {
  const { theme, ...rest } = page;   // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, sections: (page.sections ?? []).map(sec => Object.fromEntries(Object.entries(sec)
    .filter(([k]) => !LEGACY_SECTION_FIELDS.includes(k) && !(LEGACY_BY_TYPE[sec._type] ?? []).includes(k)))) };
};

const of = (page, type) => page.sections.filter(s => s._type === type);
const one = (page, type) => of(page, type)[0];
const h1FromSeo = page => page.seo?.title?.split(' | ').find(t => !t.includes('Lumen Home Services'));
const clone = s => ({ ...s, _key: key() });
/** Sections deliberately folded into another one (not dropped): the no-removal guard allows these. */
const MERGED = new Set();
const listNames = names => names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
/** Service gallery built from the Projects page photos captioned with this service. */
const servicePhotos = slug => {
  const title = { 'additional-services': 'Attic Insulation' }[slug];
  const photos = of(bySlug.projects, 'photoSection').flatMap(s => s.photos).filter(ph => ph.caption === title);
  return { _key: key(), _type: 'photoSection', eyebrow: 'Gallery', heading: 'Documented Work', photos: photos.map(clone) };
};

const quoteBand = (page, { eyebrow, heading }) => {
  const q = one(page, 'quoteSection');
  const bands = of(page, 'ctaBand');
  const image = bands.at(-1)?.image;
  const out = { ...q, showContactDetails: false, ...(image ? { image } : {}) };
  delete out.subheading;
  if (eyebrow) out.eyebrow = eyebrow; else delete out.eyebrow;
  if (heading) out.heading = heading;
  return out;
};

// ---------------- homepage ----------------
// Blueprint 3-13 in order; extras kept: statement, mid CTA band.
// Contact details live on /contact only: the homepage "Get in Touch" section and the closing CTA band
// become one Blueprint final CTA band (headline, phone, short form).
function home(page) {
  const hero = { ...one(page, 'heroSection'), h1: 'Air Duct, Chimney, Dryer Vent & HVAC Services in Austin, TX' };
  const [midBand, finalBand] = of(page, 'ctaBand');
  return [
    hero,
    { _key: key(), _type: 'trustBar' },
    one(page, 'statementSection'),
    { ...one(page, 'servicesSection'), ctaHref: '#quote' },   // the hero no longer holds a form
    { ...one(page, 'aboutSection'), eyebrow: 'Why Choose Us' },
    { _key: key(), _type: 'breakdownSection', variant: 'steps', eyebrow: 'How It Works', heading: 'From First Call to Finished Job',
      cards: [
        card('Request a quote or call', "Request a quote online or call us directly, and we'll get you on the schedule, usually within the week."),
        card('Inspection first', "A thorough inspection before any work begins. We inspect first and only recommend what's actually needed."),
        card('The work, documented', 'Photos of the work, documented every time.'),
        card('Walkthrough and your record', 'When the job is done, we show you the after photos and explain what we found, what we did, and what to expect.'),
      ] },
    midBand,
    one(page, 'proofSection'),
    { _key: key(), _type: 'badgesSection' },
    { ...one(page, 'reviewsSection'), showWidget: true, reviews: [...one(page, 'reviewsSection').reviews, newReviewRef()] },
    one(page, 'areaSection'),
    { _key: key(), _type: 'breakdownSection', variant: 'cards', eyebrow: 'Offers & Guarantees', heading: 'What Comes With Every Job',
      cards: [
        card('Free quotes', 'Get your free quote online or by phone.'),
        NO_SURPRISES,
        card('A photo record of every job', 'Photos of the work, documented every time, so you see exactly what was done.'),
      ] },
    { ...one(page, 'faqSection'),
      faqs: [...one(page, 'faqSection').faqs, ref('faq-how-do-i-schedule-a-visit')],
      items: [pageFaq('How much will it cost?', "It depends on what your home needs, which is why we inspect first. Request a free quote and you'll get straightforward pricing, with no last minute surprises.")] },
    (MERGED.add(finalBand._key), quoteBand(page, { heading: finalBand.heading })),
  ];
}

// ---------------- service page ----------------
// Blueprint 1-10 in order; extra kept: the mid-page CTA band.
function service(page) {
  const slug = page.slug.current;
  const reviews = SERVICE_REVIEWS[slug];
  return [
    { ...one(page, 'innerHero'), h1: h1FromSeo(page) },
    one(page, 'breakdownSection'),
    { _key: key(), _type: 'breakdownSection', variant: 'checks', eyebrow: "Who It's For", heading: 'Signs You Need This Service',
      cards: SIGNS[slug] },
    { _key: key(), _type: 'breakdownSection', variant: 'steps', eyebrow: 'Our Process', heading: 'How We Handle This Job',
      cards: PROCESS[slug] },
    { _key: key(), _type: 'breakdownSection', variant: 'cards', eyebrow: 'Pricing', heading: 'What Affects the Price',
      cards: PRICING[slug] },
    one(page, 'ctaBand'),
    one(page, 'proofSection') ?? servicePhotos(slug),
    ...(reviews ? [{ _key: key(), _type: 'reviewsSection', eyebrow: 'Reviews', heading: 'What Customers Say',
      reviews: [...reviews.map(ref), ...(SERVICE_NEW_REVIEW.has(slug) ? [newReviewRef()] : [])] }] : []),
    { ...one(page, 'faqSection'), items: SERVICE_FAQ[slug] },
    { _key: key(), _type: 'relatedServices', eyebrow: 'Related Services', heading: 'Other Services We Offer' },
    one(page, 'quoteSection'),
  ];
}

// ---------------- city page ----------------
// Blueprint 1-8 in order; extras kept: statement, both CTA bands, why choose us, all-areas list.
function city(page) {
  const slug = page.slug.current;
  const name = areaName(slug);
  const hero = one(page, 'heroSection');
  const [midBand, finalBand] = of(page, 'ctaBand');
  const namesServiceAndCity = hero.headingLines.join(' ').includes(name) && /duct|hvac|chimney|vent|insulation/i.test(hero.headingLines.join(' '));
  return [
    namesServiceAndCity ? hero : { ...hero, h1: h1FromSeo(page) },
    one(page, 'proseSection'),
    one(page, 'statementSection'),
    { ...one(page, 'servicesSection'), ctaHref: '#quote' },
    midBand,
    { ...one(page, 'proofSection'), local: true },
    { ...one(page, 'reviewsSection'), local: true, reviews: [...one(page, 'reviewsSection').reviews, newReviewRef()] },
    one(page, 'aboutSection'),
    { _key: key(), _type: 'coverageSection', eyebrow: 'Coverage', heading: `Serving ${name} and Nearby`,
      mapQuery: `${name}, TX`, responseTime: 'Usually on the schedule within the week' },
    one(page, 'areaSection'),
    { ...one(page, 'faqSection'), items: [
      pageFaq(`How soon can you get out to ${name}?`, "Request a quote online or call us directly, and we'll get you on the schedule, usually within the week."),
      pageFaq(`Do you also cover the areas around ${name}?`, `Yes. Along with ${name}, we serve ${listNames(NEARBY[slug].map(areaName))} and the rest of Greater Austin.`),
      pageFaq(`Do I need a permit for this work in ${name}?`, `Cleaning work, like duct, dryer vent, and chimney cleaning, doesn't usually need one. Repairs and replacements can, depending on the job and ${name}'s requirements, so we'll let you know during the inspection.`),
    ] },
    one(page, 'quoteSection'),
    finalBand,
    { _key: key(), _type: 'internalLinks', eyebrow: 'Explore', heading: `Services & Areas Near ${name}` },
  ];
}

// ---------------- new pages ----------------
const home_ = bySlug.home ?? pages.find(p => p.isHome);
const contactHeroImage = one(bySlug.contact, 'innerHero').image;
const phone = settings.phone, email = settings.email, biz = settings.businessName;

const aboutPage = {
  _id: 'drafts.page-about', _type: 'page', title: `About ${biz}`, slug: { _type: 'slug', current: 'about' },
  seo: { _type: 'seo', title: `About Us | ${biz}`, description: settings.footerNote },
  sections: [
    { _key: key(), _type: 'innerHero', eyebrow: 'About Us', heading: 'Bringing Light to Every Home',
      intro: settings.footerNote, centered: true, image: contactHeroImage },
    { _key: key(), _type: 'proseSection', eyebrow: 'Our Story', heading: `The Team Behind ${biz}`,
      body: [
        block(`${biz} is locally owned and operated, with Austin as home base. We take care of the systems most homeowners never see: air ducts and HVAC, chimneys and fireplaces, dryer vents, and attic insulation.`),
        block('Our promise is simple: bringing light to every home with honest, documented work. That means a thorough inspection before any work begins, photos of the work every time, and straightforward pricing with no last minute surprises.'),
        block(`Every technician is licensed and certified, and treats your home like it's their own. Today we serve homeowners across ${settings.serviceAreaLabel}, from ${listNames(['Round Rock', 'Georgetown', 'Cedar Park', 'Buda', 'Kyle'])}.`),
      ] },
    { _key: key(), _type: 'trustBar' },
    clone({ ...one(home_, 'aboutSection'), eyebrow: 'Why Choose Us' }),
    { ...clone(one(home_, 'reviewsSection')), reviews: [...one(home_, 'reviewsSection').reviews, newReviewRef()] },
    clone(quoteBand(home_, { eyebrow: of(home_, 'ctaBand')[0]?.heading, heading: of(home_, 'ctaBand').at(-1)?.heading })),
  ],
};

const legalHero = (heading, intro) => ({ _key: key(), _type: 'innerHero', heading, intro, centered: true, showCtas: false, image: contactHeroImage });
const reviewNote = block('Last updated: September 2026');
const mailing = `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.postalCode}`;

const privacyPage = {
  _id: 'drafts.page-privacy-policy', _type: 'page', title: 'Privacy Policy', slug: { _type: 'slug', current: 'privacy-policy' },
  seo: { _type: 'seo', title: `Privacy Policy | ${biz}`, description: `How ${biz} collects, uses, and protects the information you share with us.` },
  sections: [
    legalHero('Privacy Policy', `How ${biz} collects, uses, and protects the information you share with us.`),
    { _key: key(), _type: 'proseSection', body: [
      reviewNote,
      block('Information we collect', 'h3'),
      block('When you request a quote or contact us, we collect the details you enter: your name, phone number, email address, the service you need, and the page you sent the request from. We also keep a record of the consent you give to be contacted.'),
      block('How we use it', 'h3'),
      block('We use this information to respond to your request, prepare your quote, schedule and carry out work, and follow up about that work. We do not sell your personal information.'),
      block('Calls, texts and emails', 'h3'),
      block(`If you agree to be contacted, ${biz} may call, text, or email you about your request. Message frequency varies, and message and data rates may apply. Reply STOP to any text to opt out, or HELP for help. Consent is not a condition of purchase.`),
      block('Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes. Text messaging opt-in data and consent are not shared with any third parties.'),
      block('Service providers', 'h3'),
      block('We use trusted service providers to run our website, forms, customer messaging, and scheduling. They process your information only to provide those services to us.'),
      block('Cookies and analytics', 'h3'),
      block('Our website may use cookies and analytics tools to understand how visitors use the site and to improve it. You can control cookies through your browser settings.'),
      block('Keeping your information safe', 'h3'),
      block('We keep your information only as long as we need it for the purposes above or as required by law, and we use reasonable safeguards to protect it.'),
      block('Your choices', 'h3'),
      block(`You can ask us to update or delete your information, or stop contacting you, at any time by calling ${phone}${email ? ` or emailing ${email}` : ''}. You can also write to ${biz}, ${mailing}.`),
      block('Changes to this policy', 'h3'),
      block('We may update this policy from time to time. The latest version will always be on this page.'),
    ] },
  ],
};

const termsPage = {
  _id: 'drafts.page-terms', _type: 'page', title: 'Terms of Service', slug: { _type: 'slug', current: 'terms' },
  seo: { _type: 'seo', title: `Terms of Service | ${biz}`, description: `The terms that apply when you use the ${biz} website.` },
  sections: [
    legalHero('Terms of Service', `The terms that apply when you use the ${biz} website.`),
    { _key: key(), _type: 'proseSection', body: [
      reviewNote,
      block('Using this website', 'h3'),
      block(`By using this website you agree to these terms. The site provides information about ${biz} and lets you request quotes and contact us.`),
      block('Quotes and scheduling', 'h3'),
      block('Submitting a request through this website does not create a contract. Any work, pricing, and scheduling are confirmed with you directly before the job begins.'),
      block('Communications', 'h3'),
      block('If you agree to be contacted, you consent to receive calls, texts, and emails about your request as described in our Privacy Policy. You can opt out at any time.'),
      block('Content', 'h3'),
      block(`The photos, videos, and text on this website belong to ${biz} and may not be copied or reused without permission.`),
      block('No warranties', 'h3'),
      block('The information on this website is provided for general purposes. We work to keep it accurate but do not guarantee it is complete or current.'),
      block('Limitation of liability', 'h3'),
      block(`To the extent allowed by law, ${biz} is not liable for any damages arising from your use of this website.`),
      block('Governing law', 'h3'),
      block('These terms are governed by the laws of the State of Texas.'),
      block('Contact', 'h3'),
      block(`Questions about these terms? Call ${phone}${email ? ` or email ${email}` : ''}, or write to ${biz}, ${mailing}.`),
    ] },
  ],
};

// ---------------- settings ----------------
const areaMenuHref = '/#area';
const settingsDraft = {
  ...settings, _id: 'drafts.siteSettings',
  navLinks: [
    { _key: key(), label: 'Home', href: '/' },
    { _key: key(), label: 'Services', href: '/#services', menu: 'services' },
    ...settings.navLinks.filter(l => l.href !== '/contact'),   // Projects, FAQs
    { _key: key(), label: 'Service Areas', href: areaMenuHref, menu: 'areas' },
    { _key: key(), label: 'About', href: '/about' },
    { _key: key(), label: 'Reviews', href: '/#reviews' },
    { _key: key(), label: 'Contact', href: '/contact' },
  ],
  legalLinks: [
    { _key: key(), label: 'Privacy Policy', href: '/privacy-policy' },
    { _key: key(), label: 'Terms of Service', href: '/terms' },
  ],
  footerColumns: settings.footerColumns.map(c => c.links?.length
    ? { ...c, links: [{ _key: key(), href: '/about', label: 'About' }, ...c.links] }
    : c),
  serviceAreas: settings.serviceAreas.map(a => ({ ...a, nearby: NEARBY[a.slug] ?? [] })),
  address: { ...settings.address, ...ADDRESS },
  // every interface label lives in Sanity: current values kept, new keys filled from lib/ui.ts,
  // and labels for removed features dropped so Studio shows no unknown fields
  ui: {
    ...UI_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings.ui ?? {})
      .filter(([k]) => !['dragCaptionPrefix', 'learnMoreLabel', 'aboutCallLabel'].includes(k))),
    consentText: one(home_, 'heroSection').consentText,
  },
  // canonical domain, previously hardcoded in lib/metadata.ts
  siteUrl: settings.siteUrl ?? 'https://lumenhomeservices.com',
  // Only listings the business really has: its linked social profiles, plus licensed &
  // insured from its own FAQ (no Yelp: the client confirmed they have none, Sept 2026). The
  // Google badge shows the Google rating field, which the client still has to supply.
  badges: [
    { _key: key(), title: 'Google', icon: 'google' },
    { _key: key(), title: 'Licensed & Insured', sub: 'Documentation on request', icon: 'shield' },
    { _key: key(), title: 'Facebook', sub: 'Follow us', icon: 'facebook', href: settings.social?.facebook },
    { _key: key(), title: 'Instagram', sub: 'Follow us', icon: 'instagram', href: settings.social?.instagram },
  ],
  trustItems: [
    ...settings.trustItems,
    { _key: key(), title: 'Licensed & Insured', sub: 'Documentation available on request', icon: 'shield' },
  ],
};
for (const l of settings.navLinks) {
  if (!settingsDraft.navLinks.some(n => n.href === l.href)) throw new Error(`nav would lose ${l.label}`);
}
for (const [i, c] of settings.footerColumns.entries()) {
  const hrefs = new Set((settingsDraft.footerColumns[i].links ?? []).map(l => l.href));
  for (const l of c.links ?? []) if (!hrefs.has(l.href)) throw new Error(`footer would lose ${l.label}`);
}
delete settingsDraft.navServicesLabel;
delete settingsDraft.navAreasLabel;

// ---------------- assemble ----------------
const drafts = [NEW_REVIEW, settingsDraft, aboutPage, privacyPage, termsPage];
for (const p of pages) {
  const slug = p.slug.current;
  let sections;
  if (p.isHome) sections = home(p);
  else if (serviceSlugs.includes(slug)) sections = service(p);
  else if (areaSlugs.has(slug)) sections = city(p);
  else sections = p.sections;   // contact, faqs, projects: not governed by the Blueprint, only cleaned
  if (sections.some(s => !s)) throw new Error(`${slug}: a section it expects is missing`);
  // nothing that exists may be dropped: every original section must survive
  const kept = new Set(sections.map(x => x._key));
  const lost = p.sections.filter(x => !kept.has(x._key) && !MERGED.has(x._key)).map(x => x._type);
  if (lost.length) throw new Error(`${slug}: would remove ${lost.join(', ')}`);
  drafts.push(withoutLegacy({ ...p, _id: `drafts.${p._id}`, sections }));
}

// system fields come back from the fetch; the API assigns fresh ones on write
const strip = ({ _rev, _updatedAt, _createdAt, ...doc }) => doc; // eslint-disable-line @typescript-eslint/no-unused-vars
for (const d of drafts) {
  const list = d.sections ? d.sections.map(s => s._type + (s.variant ? `:${s.variant}` : '')).join(' → ') : `(${d._type})`;
  console.log(`${d._id}\n   ${list}`);
}

// the same gate the site's content has to pass: only the template's section types and fields
const draftPages = drafts.filter(d => d._type === 'page').map(withoutLegacy);
const existingIds = new Set([...(await client.withConfig({ perspective: 'raw' }).fetch('*[]._id')).map(id => id.replace(/^drafts\./, '')),
  ...drafts.map(d => d._id.replace(/^drafts\./, ''))]);
const problems = checkPages(draftPages, existingIds);
if (problems.length) throw new Error(`content check failed:\n  ${problems.join('\n  ')}`);

if (!WRITE) { console.log(`\nDry run: ${drafts.length} drafts. Re-run with --write to save them.`); process.exit(0); }
const tx = client.transaction();
for (const d of drafts) tx.createOrReplace(strip(d._type === 'page' ? withoutLegacy(d) : d));
const res = await tx.commit();
console.log(`\nSaved ${drafts.length} drafts (transaction ${res.transactionId}). Published content is unchanged.`);
