/**
 * List every [CONTENT NEEDED] gap the running site shows, page by page. The
 * site's own components decide what is missing, so this list always matches
 * what a visitor would see. Feeds the "missing facts" part of REVIEW.md.
 *
 * Usage: node scripts/content-gaps.mjs [http://localhost:3000] [--content content]
 */
import { readdirSync, readFileSync } from 'node:fs';

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3000';
const i = process.argv.indexOf('--content');
const dir = `${i > -1 ? process.argv[i + 1] : 'content'}/pages`;
const pages = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

let total = 0;
for (const p of pages.sort((a, b) => (b.isHome ? 1 : 0) - (a.isHome ? 1 : 0) || a.slug.localeCompare(b.slug))) {
  const path = p.isHome ? '/' : `/${p.slug}`;
  const res = await fetch(base + path);
  // scripts carry the same text as RSC payload; only the rendered markup counts
  const html = (await res.text()).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!-- -->/g, '');
  const gaps = [...new Set([...html.matchAll(/\[CONTENT NEEDED\]\s*([^<]*)/g)].map(m => decode(m[1].trim())))];
  if (!res.ok) gaps.unshift(`page returned HTTP ${res.status}`);
  if (gaps.length) console.log(`${path}\n  - ${gaps.join('\n  - ')}`);
  total += gaps.length;
}
console.log(`${total} gap(s) across ${pages.length} pages`);
