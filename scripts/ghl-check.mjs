/**
 * Read-only GoHighLevel check: confirms the Private Integration token works for the
 * sub-account and prints its pipelines and stages with their IDs, so the
 * GHL_PIPELINE_ID / GHL_PIPELINE_STAGE_ID values can be copied without guessing.
 * Nothing is created or changed in GHL.
 *
 * Usage: node --env-file=.env.local scripts/ghl-check.mjs
 */
const { GHL_PRIVATE_INTEGRATION_TOKEN: token, GHL_LOCATION_ID: locationId } = process.env;
const base = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';
const version = process.env.GHL_API_VERSION || '2021-07-28';

if (!token || !locationId) {
  console.error('Add GHL_PRIVATE_INTEGRATION_TOKEN and GHL_LOCATION_ID to .env.local first.');
  process.exit(1);
}

const res = await fetch(`${base}/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`, {
  headers: { Authorization: `Bearer ${token}`, Version: version, Accept: 'application/json' },
  signal: AbortSignal.timeout(15_000),
});
if (!res.ok) {
  const hint = res.status === 401 ? 'the token is wrong or was revoked'
    : res.status === 403 ? 'the token is missing the opportunities scope, or belongs to a different sub-account'
    : res.status === 400 || res.status === 422 ? 'check GHL_LOCATION_ID' : 'see the response below';
  console.error(`✗ GHL answered ${res.status} (${hint})\n${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}

const { pipelines = [] } = await res.json();
console.log(`✓ Token works for location ${locationId}. ${pipelines.length} pipeline(s):\n`);
for (const p of pipelines) {
  console.log(`  ${p.name}   GHL_PIPELINE_ID=${p.id}`);
  for (const s of p.stages ?? []) {
    const isNew = /new\s*lead/i.test(s.name);
    console.log(`     ${isNew ? '→' : ' '} ${s.name}   GHL_PIPELINE_STAGE_ID=${s.id}`);
  }
}
const match = pipelines.flatMap(p => (p.stages ?? []).filter(s => /new\s*lead/i.test(s.name)).map(s => ({ p, s })));
console.log(match.length === 1
  ? `\nAdd to .env.local and Vercel:\nGHL_PIPELINE_ID=${match[0].p.id}\nGHL_PIPELINE_STAGE_ID=${match[0].s.id}`
  : match.length ? '\nMore than one "New Lead" stage -- pick the pipeline the website leads belong in.'
  : '\nNo stage called "New Lead" yet -- create it in GHL (Opportunities → Pipelines), then run this again.');
