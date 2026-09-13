/**
 * Publish reviewed drafts: every draft page, review and Site Settings becomes the
 * published document in one transaction, and its draft is removed -- what Studio's
 * Publish button does, for all of them at once.
 *
 * Runs the content gate first, so nothing outside the template's section types
 * can go live. Referenced documents (reviews) are published before the pages
 * that point at them, and draft-only weak references are made strong.
 *
 * Usage: node --env-file=.env.local scripts/publish-drafts.mjs [--write]
 */
import { createClient } from 'next-sanity';
import { checkPages } from './check-content.mjs';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'w2d9vne3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01', token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'raw',
});
const TYPES = ['review', 'faq', 'project', 'videoItem', 'siteSettings', 'page'];   // publish order: referenced first

const drafts = (await client.fetch('*[_id in path("drafts.**") && _type in $types]', { types: TYPES }))
  .sort((a, b) => TYPES.indexOf(a._type) - TYPES.indexOf(b._type));
const ids = new Set((await client.fetch('*[]._id')).map(id => id.replace(/^drafts\./, '')));

/** Weak references are how drafts point at unpublished documents; published content uses strong ones. */
const strengthen = v => Array.isArray(v) ? v.map(strengthen)
  : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== '_weak' && k !== '_strengthenOnPublish').map(([k, x]) => [k, strengthen(x)]))
    : v;

const problems = checkPages(drafts.filter(d => d._type === 'page'), ids);
if (problems.length) { console.error(`✗ not publishing, content check failed:\n  ${problems.join('\n  ')}`); process.exit(1); }

const byType = drafts.reduce((m, d) => ({ ...m, [d._type]: (m[d._type] ?? 0) + 1 }), {});
console.log(`${drafts.length} drafts to publish:`, byType);
if (!process.argv.includes('--write')) { console.log('Dry run. Re-run with --write to publish.'); process.exit(0); }

const tx = client.transaction();
for (const d of drafts) {
  const { _id, _rev, _updatedAt, _createdAt, ...doc } = strengthen(d);   // eslint-disable-line @typescript-eslint/no-unused-vars
  tx.createOrReplace({ ...doc, _id: _id.replace(/^drafts\./, '') }).delete(_id);
}
const res = await tx.commit();
console.log(`✓ published ${drafts.length} documents (transaction ${res.transactionId})`);
