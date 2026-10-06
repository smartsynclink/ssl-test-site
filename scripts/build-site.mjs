/**
 * Build a client's site in Sanity from site.config.yaml (facts) and content/
 * (the copy, written by the /new-site prompt).
 *
 * Every document gets a deterministic _id (page-<slug>, faq-<id>, review-<author>),
 * so a re-run replaces the same documents instead of duplicating them. Nothing
 * is written without --write; the dry run validates everything and prints what
 * would be written.
 *
 *   site.config.yaml            facts: business, brand, services, areas, reviews, images, ...
 *   content/settings.json       site-wide copy: nav, footer, trust items, badges, consent, blurbs
 *   content/faqs.json           [{ id, question, answer }]
 *   content/pages/<slug>.json   { title, slug, isHome?, seo, sections: [...] }
 *
 * Content format (kit/examples/ has a real page of every kind):
 *   - sections use only the template's section types and fields (scripts/check-content.mjs)
 *   - reviewsSection.reviews: review authors from the config
 *   - faqSection.faqs / groups[].faqs: ids from content/faqs.json
 *   - proseSection.body: one string per paragraph; "## " / "### " start a heading
 *   - no images: they come from the config's `images` block
 *
 * Usage: node --env-file=.env.local scripts/build-site.mjs [--write] [--force]
 *        [--config site.config.yaml] [--content content] [--out docs.json]
 *   --force  overwrite a dataset that already has a site (replaces Studio edits)
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient } from 'next-sanity';
import { parse } from 'yaml';
import { checkPages } from './check-content.mjs';

const { brandProblem } = await import('../lib/brand.ts');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : fallback; };
const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');
const CONFIG = resolve(arg('--config', 'site.config.yaml'));
const CONTENT = resolve(arg('--content', 'content'));

// Words that only belong to the example business in kit/examples. Generated copy
// containing one of them (when the client's config doesn't) was copied, not written.
const EXAMPLE_ONLY = ['Lumen', 'Dino', 'Daisy Apparel', 'San Felipe'];

const problems = [];
const fail = msg => problems.push(msg);
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

const config = parse(readFileSync(CONFIG, 'utf8'));
const settingsCopy = readJson(`${CONTENT}/settings.json`);
const faqs = readJson(`${CONTENT}/faqs.json`);
const pages = readdirSync(`${CONTENT}/pages`).filter(f => f.endsWith('.json')).sort()
  .map(f => readJson(`${CONTENT}/pages/${f}`));

const slugify = s => String(s).toLowerCase().normalize('NFKD')
  .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
const compact = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)));

// ---------- config checks (a hand-edited file: check everything the site relies on) ----------
const biz = config.business ?? {};
if (!biz.name) fail('config: business.name is required');
if (!biz.phone) fail('config: business.phone is required');
const services = config.services ?? [];
const areas = config.areas ?? [];
if (!services.length) fail('config: at least one service is required');
for (const [list, what] of [[services, 'service'], [areas, 'area']]) {
  const seen = new Set();
  for (const x of list) {
    if (!x.slug || !(x.title ?? x.name)) fail(`config: every ${what} needs a slug and a ${what === 'area' ? 'name' : 'title'}`);
    if (seen.has(x.slug)) fail(`config: duplicate ${what} slug "${x.slug}"`);
    seen.add(x.slug);
  }
}
for (const s of services) if (!s.id) fail(`config: service "${s.title}" needs an id`);
const areaSlugs = new Set(areas.map(a => a.slug));
for (const a of areas) for (const n of a.nearby ?? []) if (!areaSlugs.has(n)) fail(`config: area "${a.slug}" lists nearby "${n}", which is not a served area`);
const brand = compact(config.brand ?? {});
const brandIssue = brandProblem(brand);
if (brandIssue) fail(`config: brand: ${brandIssue}`);
const reviews = config.reviews ?? [];
for (const r of reviews) if (!r.author || !r.quote) fail('config: every review needs an author and a quote');

// ---------- images (local files, relative to the config) ----------
const images = config.images ?? {};
const base = dirname(CONFIG);
const files = new Set();
const file = p => { if (!p) return undefined; const abs = resolve(base, p); if (!existsSync(abs)) fail(`config: image not found: ${p}`); files.add(abs); return abs; };
// Placeholder until upload: { __file } is swapped for a real asset reference in --write.
const img = (p, extra = {}) => (p ? { _type: 'image', __file: file(p), ...extra } : undefined);

// ---------- documents ----------
const reviewId = author => `review-${slugify(author)}`;
const reviewDocs = reviews.map(r => compact({
  _id: reviewId(r.author), _type: 'review', author: r.author, quote: r.quote, rating: r.rating ?? 5, city: r.city, initials: r.initials,
}));
const faqDocs = faqs.map(q => ({ _id: `faq-${q.id}`, _type: 'faq', question: q.question, answer: q.answer }));
const projectDocs = (images.projects ?? []).map(p => compact({
  _id: `project-${slugify(p.title)}`, _type: 'project', title: p.title, caption: p.caption, category: p.category, city: p.city,
  beforeImage: img(p.before), afterImage: img(p.after),
}));
const videoDocs = (images.videos ?? []).map(v => compact({
  _id: `video-${slugify(v.title)}`, _type: 'videoItem', title: v.title, caption: v.caption,
  video: { _type: 'file', __file: file(v.file) }, poster: img(v.poster),
}));
// Videos have no category field in Sanity, so the config's category is only used for placement.
const category = new Map([...(images.projects ?? []).map(p => [`project-${slugify(p.title)}`, p.category]),
  ...(images.videos ?? []).map(v => [`video-${slugify(v.title)}`, v.category])]);
const ref = _ref => ({ _type: 'reference', _ref });
const byCategory = (docs, cat) => docs.filter(d => !cat || !category.get(d._id) || category.get(d._id) === cat).map(d => ref(d._id));

const authors = new Map(reviewDocs.map(d => [d.author, d._id]));
const block = text => {
  const [, hashes, rest] = text.match(/^(#{2,3}) (.*)$/) ?? [];
  return { _type: 'block', style: hashes ? `h${hashes.length}` : 'normal', markDefs: [],
    children: [{ _type: 'span', text: hashes ? rest : text, marks: [] }] };
};
const toFaqRef = (id, where) => { if (!faqDocs.some(d => d._id === `faq-${id}`)) fail(`${where}: unknown faq id "${id}"`); return ref(`faq-${id}`); };

function section(s, page) {
  const where = `/${page.isHome ? '' : page.slug} ${s._type}`;
  const out = { ...s };
  if (s.reviews) out.reviews = s.reviews.map(a => authors.has(a) ? ref(authors.get(a)) : (fail(`${where}: no review by "${a}" in the config`), null)).filter(Boolean);
  if (s.faqs) out.faqs = s.faqs.map(id => toFaqRef(id, where));
  if (s.groups) out.groups = s.groups.map(g => ({ ...g, faqs: (g.faqs ?? []).map(id => toFaqRef(id, where)) }));
  if (s.items) out.items = s.items.map(i => ({ _type: 'pageFaq', ...i }));
  if (s._type === 'proseSection' && s.body) out.body = s.body.map(block);
  const pageImage = images.pages?.[page.slug];
  if (s._type === 'heroSection') out.images = [img(pageImage), ...(pageImage ? [] : (images.hero ?? []).map(p => img(p)))].filter(Boolean);
  if (s._type === 'innerHero' && pageImage) out.image = img(pageImage);
  if ((s._type === 'ctaBand' || s._type === 'quoteSection') && images.cta) out.image = img(images.cta);
  if (s._type === 'proofSection') { out.projects = byCategory(projectDocs, s.category); out.videos = byCategory(videoDocs, s.category); }
  if (s._type === 'aboutSection' && videoDocs[0]) out.video = ref(videoDocs[0]._id);
  if (s._type === 'photoSection') out.photos = (images.photos?.[s.category || 'all'] ?? []).map(ph => compact({ image: img(ph.file), alt: ph.alt, caption: ph.caption }));
  return compact(out);
}

const pageDocs = pages.map(p => ({
  _id: `page-${p.slug}`, _type: 'page', title: p.title, slug: { _type: 'slug', current: p.slug },
  ...(p.isHome ? { isHome: true } : {}),
  ...(p.seo ? { seo: { _type: 'seo', ...p.seo } } : {}),
  sections: (p.sections ?? []).map(s => section(s, p)),
}));

const blurbs = settingsCopy.serviceBlurbs ?? {};
const copy = { ...settingsCopy }; delete copy.serviceBlurbs;
const digits = String(biz.phone ?? '').replace(/\D/g, '');
const settingsDoc = compact({
  ...copy,
  _id: 'siteSettings', _type: 'siteSettings',
  businessName: biz.name, phone: biz.phone,
  // ponytail: US numbers only (10 digits, or 11 with the leading 1); add a phoneHref config field for other countries
  phoneHref: `tel:+${digits.length === 10 ? '1' : ''}${digits}`,
  email: biz.email, address: biz.address && compact(biz.address), hours: biz.hours,
  serviceAreaLabel: biz.serviceAreaLabel, licenseNumber: biz.licenseNumber,
  googleRating: biz.google?.rating, googleReviewCount: biz.google?.reviewCount,
  social: biz.social && compact(biz.social),
  logo: img(images.logo),
  brand: Object.keys(brand).length ? brand : undefined,
  serviceCategories: services.map(s => compact({
    id: s.id, title: s.title, blurb: blurbs[s.id], href: `/${s.slug}`, services: s.services, image: img(images.services?.[s.id]),
  })),
  serviceAreas: areas.map(a => compact({ name: a.name, slug: a.slug, nearby: a.nearby })),
  serviceAreasNote: config.areasNote,
  integrations: config.integrations && compact(config.integrations),
  siteUrl: config.setup?.domain,
});

// ---------- content checks ----------
const slugs = new Set(pages.map(p => p.slug));
if (pages.filter(p => p.isHome).length !== 1) fail('content: exactly one page must have "isHome": true');
for (const s of services) if (!slugs.has(s.slug)) fail(`content: no page for service "${s.title}" (pages/${s.slug}.json)`);
for (const a of areas) if (!slugs.has(a.slug)) fail(`content: no page for area "${a.name}" (pages/${a.slug}.json)`);
for (const id of Object.keys(blurbs)) if (!services.some(s => s.id === id)) fail(`content: serviceBlurbs has unknown service id "${id}"`);
const home = pages.find(p => p.isHome)?.slug;
const allJson = JSON.stringify([settingsDoc, pageDocs, faqDocs]);
for (const [, href] of allJson.matchAll(/"(?:href|ctaHref|headerCtaHref)":"(\/[^"#?]*)/g)) {
  const path = href.slice(1);
  if (path && path !== home && !slugs.has(path)) fail(`content: link to /${path}, which is not a page`);
}
const configText = JSON.stringify(config);
for (const w of EXAMPLE_ONLY) if (allJson.includes(w) && !configText.includes(w)) fail(`content: "${w}" comes from the example business, not this client`);

// Every document must be unique, and pages may only use the template's section types.
const docs = [settingsDoc, ...reviewDocs, ...faqDocs, ...projectDocs, ...videoDocs, ...pageDocs];
const ids = new Set();
for (const d of docs) { if (ids.has(d._id)) fail(`duplicate document ${d._id} (two pages, reviews or faqs with the same slug)`); ids.add(d._id); }

// Sanity keys every object in an array; derive them from the path so re-runs are stable.
const withKeys = (v, path) => Array.isArray(v)
  ? v.map((x, i) => withKeys(x && typeof x === 'object' && !Array.isArray(x)
    ? { _key: createHash('sha1').update(`${path}.${i}`).digest('hex').slice(0, 12), ...x } : x, `${path}.${i}`))
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withKeys(x, `${path}.${k}`)])) : v;
const finalDocs = docs.map(d => withKeys(d, d._id));
problems.push(...checkPages(finalDocs.filter(d => d._type === 'page'), ids));

// ---------- report ----------
if (arg('--out')) writeFileSync(arg('--out'), JSON.stringify(finalDocs, null, 2));
const missingImages = [
  !images.logo && 'logo',
  ...services.filter(s => !images.services?.[s.id]).map(s => `service photo: ${s.title}`),
  !images.hero?.length && 'home hero photo',
  !images.cta && 'CTA band background',
  !projectDocs.length && 'before/after projects',
].filter(Boolean);
console.log(`${pageDocs.length} pages, ${faqDocs.length} faqs, ${reviewDocs.length} reviews, ${projectDocs.length} projects, ${videoDocs.length} videos, ${files.size} files to upload`);
if (missingImages.length) console.log(`images still missing: ${missingImages.join(', ')}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s), nothing written:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
if (!WRITE) { console.log('✓ valid. Dry run: add --write to save to Sanity.'); process.exit(0); }

// ---------- write ----------
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01', token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'raw',
});
if (!process.env.SANITY_API_WRITE_TOKEN) { console.error('SANITY_API_WRITE_TOKEN is not set'); process.exit(1); }

// Never overwrite another business, and never overwrite an existing site without --force.
const existing = await client.fetch('{ "name": *[_id == "siteSettings"][0].businessName, "pages": count(*[_type == "page"]) }');
if (existing.name && existing.name !== biz.name) {
  console.error(`✗ this Sanity dataset belongs to "${existing.name}", not "${biz.name}". Check NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.`);
  process.exit(1);
}
if (existing.pages && !FORCE) {
  console.error(`✗ the dataset already has ${existing.pages} pages. Re-run with --force to replace them (this overwrites edits made in Studio).`);
  process.exit(1);
}

// Sanity stores identical files once, so re-uploading on a re-run creates no duplicates.
const uploaded = new Map();
for (const abs of files) {
  const kind = /\.(mp4|mov|webm)$/i.test(abs) ? 'file' : 'image';
  const asset = await client.assets.upload(kind, readFileSync(abs), { filename: abs.split('/').pop() });
  uploaded.set(abs, asset._id);
  console.log(`  + ${kind} ${abs.split('/').pop()}`);
}
const swap = v => Array.isArray(v) ? v.map(swap) : v && typeof v === 'object'
  ? (v.__file ? (({ __file, ...rest }) => ({ ...rest, asset: ref(uploaded.get(__file)) }))(v) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)])))
  : v;

// Documents this script made earlier (its id patterns) that are no longer in the content: a renamed
// page, a removed faq. Documents created in Studio have random ids and are never touched.
const OURS = /^(page|faq|review|project|video)-/;
const all = await client.fetch('*[_type in ["page", "faq", "review", "project", "videoItem"]]._id');
const stale = all.filter(id => OURS.test(id) && !ids.has(id));
const drafts = all.filter(id => id.startsWith('drafts.') && ids.has(id.slice(7)));
if (drafts.length) console.warn(`! ${drafts.length} unpublished Studio draft(s) will still show over the new content in Studio: ${drafts.join(', ')}`);
const tx = client.transaction();
for (const d of finalDocs) tx.createOrReplace(swap(d));
for (const id of stale) tx.delete(id);
await tx.commit();
console.log(`✓ wrote ${finalDocs.length} documents${stale.length ? `, removed ${stale.length} stale: ${stale.join(', ')}` : ''}`);
