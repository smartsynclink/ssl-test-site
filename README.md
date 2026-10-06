# SmartSyncLink construction template

The website template for SmartSyncLink's home-services clients: Next.js 16 +
Sanity, built to the Website Section Blueprint. The code is the same for every
client. Each client gets their own repo, Sanity project and Vercel project, and
everything client-specific (copy, facts, photos, brand colours and font) lives in
their Sanity project.

## Make a new client site

1. **Install the plugin** (once per machine), in Claude Code:
   ```
   /plugin marketplace add smartsynclink/ssl-test-site
   /plugin install site-builder@smartsynclink
   ```
2. **Fill in a config**: copy `site.config.example.yaml`, fill in the client's facts,
   and put any photos next to it. Facts only. Leave empty whatever the client
   hasn't confirmed.
3. **Run the three commands**:
   - `/new-site <this repo's URL> <path/to/config.yaml>`: new local repo, new Sanity
     project, all copy written to the Blueprint, build verified, `REVIEW.md` for Shay.
   - `/push-site`: commits and pushes to a private GitHub repo.
   - `/deploy-site`: Vercel project, env vars, production deploy, smoke test.
4. **By hand** (the commands list these): add the GHL token to `.env.local`,
   create the Sanity webhook, point the domain's DNS, run the GHL workflows and
   a test lead named "TEST – delete me".

Logins needed on the machine: `gh`, `vercel`, and Sanity (`pnpm exec sanity login`).

## How content gets in

- `site.config.yaml`: facts (business, brand, services, areas, reviews, images, IDs).
- `content/`: the copy, written by `/new-site` in the format of `kit/examples/`
  (one real page of every kind).
- `scripts/build-site.mjs`: validates both and writes them to Sanity. It refuses
  unknown section types, broken links, missing pages, copied example text and
  unreadable brand colours, and it never overwrites another business's dataset.

After launch, content is edited in Studio at `/studio`.

## Scripts

| Script | What it does |
|---|---|
| `scripts/build-site.mjs` | config + content → Sanity (dry run unless `--write`) |
| `scripts/check-content.mjs` | checks what's in Sanity: section types, references, brand (`--self-test` for the check itself) |
| `scripts/content-gaps.mjs` | lists every `[CONTENT NEEDED]` the running site shows |
| `scripts/publish-drafts.mjs` | publishes reviewed Studio drafts in one go |
| `scripts/ghl-check.mjs` | lists a GHL location's pipelines and stage IDs (read-only) |

Run them with `node --env-file=.env.local scripts/<name>.mjs`.

## Environment

`.env.local` (and the Vercel project): `NEXT_PUBLIC_SANITY_PROJECT_ID`,
`NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`,
`GHL_PRIVATE_INTEGRATION_TOKEN`, `GHL_LOCATION_ID`, `GHL_PIPELINE_ID`,
`GHL_PIPELINE_STAGE_ID`. Local only: `SANITY_API_WRITE_TOKEN` (scripts) and
`SANITY_DEV_DRAFTS=1` (show drafts on localhost).
