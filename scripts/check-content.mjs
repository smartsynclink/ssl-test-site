/**
 * Content gate: the template's section types are a closed list.
 *
 * Sanity only enforces the schema inside Studio; anything written through the
 * API (a seed, a migration, the future config → site command) is stored as-is,
 * and the site quietly skips section types it doesn't know. This check makes
 * that loud. It reads the allowed section types and their fields straight from
 * sanity/schemas/sections.ts, so there is no second list to keep in sync.
 *
 * Fails on: unknown section types, fields a section type doesn't define,
 * duplicate section keys, references to documents that don't exist, and
 * literal "[CONTENT NEEDED]" text stored in content (placeholders are rendered
 * from missing data, never written).
 *
 * CLI: node --env-file=.env.local scripts/check-content.mjs   (checks what localhost shows: drafts over published)
 *      node scripts/check-content.mjs --self-test                (the gate's own test, no network)
 */
import { createClient } from 'next-sanity';

const { sectionTypes } = await import('../sanity/schemas/sections.ts');
const SYSTEM = new Set(['_key', '_type']);
const allowed = new Map(sectionTypes.map(t => [t.name, new Set(t.fields.map(f => f.name))]));

/** Returns a list of problems; empty means the pages only use the template's components. */
export function checkPages(pages, existingIds) {
  const problems = [];
  for (const page of pages) {
    const where = `/${page.isHome ? '' : page.slug?.current ?? page._id}`;
    const keys = new Set();
    for (const [i, section] of (page.sections ?? []).entries()) {
      const at = `${where} section ${i + 1} (${section._type})`;
      const fields = allowed.get(section._type);
      if (!fields) { problems.push(`${at}: unknown section type -- not one of the template's ${allowed.size} components`); continue; }
      for (const k of Object.keys(section)) {
        if (!SYSTEM.has(k) && !fields.has(k)) problems.push(`${at}: field "${k}" is not defined for ${section._type}`);
      }
      if (keys.has(section._key)) problems.push(`${at}: duplicate _key ${section._key}`);
      keys.add(section._key);
    }
    // ponytail: nested objects (cards, photos) are not field-checked; add a recursive walk if generated content starts nesting new shapes
    const json = JSON.stringify(page);
    if (json.includes('[CONTENT NEEDED]')) problems.push(`${where}: "[CONTENT NEEDED]" text is stored in content`);
    for (const [, ref] of json.matchAll(/"_ref":"([^"]+)"/g)) {
      if (!existingIds.has(ref) && !ref.startsWith('image-') && !ref.startsWith('file-')) problems.push(`${where}: reference to missing document ${ref}`);
    }
  }
  return problems;
}

if (process.argv.includes('--self-test')) {
  const page = { _id: 'page-x', slug: { current: 'x' }, sections: [
    { _key: 'a', _type: 'heroSection', headingLines: ['Hi'] },
    { _key: 'b', _type: 'testimonialCarousel', slides: [] },
    { _key: 'c', _type: 'faqSection', heading: 'Q', colour: 'red' },
    { _key: 'c', _type: 'ctaBand', heading: '[CONTENT NEEDED] x' },
    { _key: 'd', _type: 'reviewsSection', reviews: [{ _type: 'reference', _ref: 'review-ghost' }] },
  ] };
  const problems = checkPages([page], new Set());
  for (const e of ['unknown section type', 'field "colour"', 'duplicate _key', '[CONTENT NEEDED]', 'missing document review-ghost']) {
    if (!problems.some(p => p.includes(e))) throw new Error(`gate missed: ${e}`);
  }
  if (checkPages([{ ...page, sections: [page.sections[0]] }], new Set()).length) throw new Error('valid page flagged');
  console.log('check-content self-test ok');
  process.exit(0);
}

if (process.argv[1]?.endsWith('check-content.mjs')) {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'w2d9vne3',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2024-10-01', token: process.env.SANITY_API_READ_TOKEN, useCdn: false, perspective: 'drafts',
  });
  const [pages, ids] = await Promise.all([
    client.fetch('*[_type == "page"]'),
    client.withConfig({ perspective: 'raw' }).fetch('*[]._id'),
  ]);
  const existing = new Set(ids.map(id => id.replace(/^drafts\./, '')));
  const problems = checkPages(pages, existing);
  console.log(problems.length
    ? `✗ ${problems.length} problem(s):\n  ${problems.join('\n  ')}`
    : `✓ ${pages.length} pages use only the template's ${allowed.size} section types`);
  process.exit(problems.length ? 1 : 0);
}
