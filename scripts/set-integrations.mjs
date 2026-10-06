/**
 * Copy the config's `integrations` block (GHL chat widget, reviews widget, booking
 * calendar, tracking IDs) into Site Settings without rebuilding the site: a
 * build-site run would overwrite edits made in Studio. Empty values are skipped,
 * so nothing already set is cleared.
 *
 * Usage: node --env-file=.env.local scripts/set-integrations.mjs [--config site.config.yaml]
 */
import { readFileSync } from 'node:fs';
import { createClient } from 'next-sanity';
import { parse } from 'yaml';

const i = process.argv.indexOf('--config');
const config = parse(readFileSync(i > -1 ? process.argv[i + 1] : 'site.config.yaml', 'utf8'));
const set = Object.fromEntries(Object.entries(config.integrations ?? {})
  .filter(([, v]) => v != null && v !== '').map(([k, v]) => [`integrations.${k}`, v]));
if (!Object.keys(set).length) { console.log('Nothing to set: the config\'s integrations block is empty.'); process.exit(0); }
if (!process.env.SANITY_API_WRITE_TOKEN) { console.error('SANITY_API_WRITE_TOKEN is not set'); process.exit(1); }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01', token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false,
});
// An open Studio draft would otherwise put the old values back when it is published.
const ids = ['siteSettings', ...(await client.getDocument('drafts.siteSettings') ? ['drafts.siteSettings'] : [])];
const tx = client.transaction();
for (const id of ids) tx.patch(id, p => p.setIfMissing({ integrations: {} }).set(set));
await tx.commit();
console.log(`✓ Site Settings → Integrations: ${Object.keys(set).map(k => k.slice(13)).join(', ')}`);
