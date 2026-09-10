/**
 * Extract the site's content from the live pages' inline DATA block.
 *
 * Each page's script opens with a `/* ==== DATA ==== *​/` section holding plain
 * object/array literals (business, serviceCategories, faqs, reviews, ...). We
 * slice that section out and evaluate it in a locked-down vm context, which is
 * far more reliable than scraping the rendered DOM.
 *
 * Usage: node scripts/extract-content.mjs <clean-html-dir> <out.json>
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const [dir, out] = process.argv.slice(2);
const DATA_VARS = ['business', 'serviceCategories', 'categoryPage', 'areaSlug',
  'serviceAreas', 'heroImages', 'galleryItems', 'videoItems', 'faqs', 'reviews',
  'trustItems', 'contacts'];

const pages = {};
for (const file of readdirSync(dir).filter(f => f.endsWith('.html'))) {
  const html = readFileSync(join(dir, file), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const src = scripts[scripts.length - 1];
  const start = src.indexOf('var business');
  // data ends at the first function declaration or RENDER section, whichever
  // comes first -- inner pages carry no section comments at all.
  const end = src.search(/\n\s*function\s|\/\*\s*=+\s*RENDER/);
  if (start < 0 || end < 0) { console.warn(`skip ${file}: no DATA block`); continue; }

  const ctx = vm.createContext(Object.create(null));
  vm.runInContext(src.slice(start, end), ctx, { timeout: 2000 });
  const data = {};
  for (const k of DATA_VARS) if (ctx[k] !== undefined) data[k] = ctx[k];

  // page-level bits that live in the markup, not the DATA block.
  // These are pulled with regex from raw HTML, so entities need decoding.
  const unesc = (t) => t?.replace(/&(amp|lt|gt|quot|#0?39|apos|nbsp);/g, (_, e) =>
    ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#039': "'", apos: "'", nbsp: ' ' })[e] ?? _);
  const title = unesc(html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim());
  const desc = unesc(html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1]);
  // CTA band images on landing pages are assigned by script, not markup
  const ctaBandImages = [...src.matchAll(
    /ctaBand\d+(?:Bg|Img)"\)(?:\.style)?\.(?:backgroundImage|src)\s*=\s*"(?:url\(')?([^"')]+)/g)
  ].map(m => m[1]);

  const h1 = unesc(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  pages[file.replace(/\.html$/, '')] = { title, description: desc, h1, ctaBandImages, ...data };
}

writeFileSync(out, JSON.stringify(pages, null, 2));
const names = Object.keys(pages);
console.log(`extracted ${names.length} pages -> ${out}`);
const a = pages['austin'];
console.log(`  austin: ${a.faqs?.length} faqs, ${a.reviews?.length} reviews, ` +
  `${a.galleryItems?.length} gallery, ${a.serviceAreas?.length} areas, ` +
  `${a.serviceCategories?.length} categories`);
