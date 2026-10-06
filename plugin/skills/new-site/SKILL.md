---
name: new-site
description: Build a finished client website from the SmartSyncLink template repo and a site.config.yaml -- new local repo, new Sanity project, all page copy written to the Website Section Blueprint, brand applied, build verified, review list for Shay. Use when the user runs /new-site or asks to create a new client site from the template.
argument-hint: <template-repo-url> <path/to/site.config.yaml> [target-folder]
disable-model-invocation: true
---

# /new-site

Arguments: $ARGUMENTS
1. Template repo URL (e.g. `https://github.com/smartsynclink/ssl-test-site`)
2. Path to the client's `site.config.yaml` (format: `site.config.example.yaml` in the template)
3. Optional target folder. Default: `~/Development/sites/<setup.slug>`

The result is a local repo holding the client's site, its own Sanity project filled
with the content, and a `REVIEW.md` for Shay. Nothing is pushed or deployed: that is
`/push-site` and `/deploy-site`.

**How the site works:** the template code is the same for every client. Everything
client-specific is content in the client's own Sanity project, written by
`scripts/build-site.mjs` from two inputs: `site.config.yaml` (facts, given) and
`content/` (copy, which YOU write). The script checks everything and refuses to
write anything broken, so fix what it reports instead of working around it.

Say which step you are on as you go. Stop and tell the user when a step fails in a
way you can't fix yourself; never skip a check to get to the end.

## 1. Preflight

- Read the config. If `setup.slug` is empty, derive one from `business.name`
  (lowercase, hyphens) and write it into the config. Required: `business.name`,
  `business.phone`, at least one service. Anything else missing is fine: it becomes
  a gap in REVIEW.md, never a guess.
- If the target folder already exists, stop and ask; never overwrite it.
- Check the tools: `node --version` (22+), `pnpm --version`, `git`.

## 2. Make the repo

```bash
git clone --depth 1 <template-url> <target> && cd <target>
rm -rf .git && git init -q -b main
# template-only files that don't belong in a client site
rm -rf plugin .claude-plugin clients public/video public/img kit/test.config.yaml
```

Copy the config to `<target>/site.config.yaml`. If it references images, copy
each referenced file too, keeping the same relative paths, so the paths in the
config still resolve from its new location. Then `pnpm install`.

## 3. Create the client's Sanity project

Check the login first: `pnpm exec sanity projects list`. If you are not logged in,
ask the user to run `pnpm exec sanity login` in their own terminal (in the new
folder) and wait. Never handle their password.

Skip project creation if `setup.sanityProjectId` is already set (reuse it). Otherwise:

```bash
pnpm exec sanity projects create "<business.name>" --dataset production --dataset-visibility public -y --json
# add --organization <id> when setup.sanityOrganization is set
```

Then make two tokens and allow local Studio. **Never print a token**: parse the
JSON in a pipe and append straight to `.env.local`.

```bash
P=<projectId>
token() {   # label, role, env var name: creates a token and appends it to .env.local unseen
  pnpm exec sanity tokens add "$1" --role "$2" --project-id $P --yes --json | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      const j = JSON.parse(s), k = j.key ?? j.token;
      if (!k) { console.error("no token in output; fields: " + Object.keys(j)); process.exit(1); }
      console.log(process.argv[1] + "=" + k);
    })' "$3" >> .env.local
}
token "site-builder write" editor SANITY_API_WRITE_TOKEN
token "site read" viewer SANITY_API_READ_TOKEN
pnpm exec sanity cors add http://localhost:3000 --credentials --project-id $P
```

Finish `.env.local` (append, don't print values):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<projectId>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_REVALIDATE_SECRET=<output of: openssl rand -hex 32>
GHL_LOCATION_ID=<setup.ghl.locationId>
GHL_PIPELINE_ID=<setup.ghl.pipelineId>
GHL_PIPELINE_STAGE_ID=<setup.ghl.stageId>
```

Leave out GHL lines whose value is empty. Record `setup.sanityProjectId` in
`site.config.yaml`. Don't ask for a GHL token here: GHL is connected separately with
`/connect-ghl`, before or after deploying. Until then the quote form asks visitors to call.

## 4. Gather the business context

Read the config's `context`. Fetch the current website (home, services, about,
contact pages) and the Google Business Profile link if given. Note tone, how they
describe their work, real claims and their source. This is the raw material; the
config's facts always win over anything on the old site.

## 5. Write the content

Read first, in the new repo:
- `kit/examples/` -- a real, finished site (Lumen Home Services) in the exact format
  build-site reads. One page of every kind: `home`, `air-duct--hvac-services`
  (a service page), `austin` (a city page), `about`, `contact`, `faqs`, `projects`,
  `privacy-policy`, `terms`, plus `settings.json` and `faqs.json`.
- `sanity/schemas/sections.ts` -- the 22 section types and what each field is for.
- the header comment of `scripts/build-site.mjs` -- the content format.

Write, in the new repo:
- `content/settings.json` -- like the example: nav, footer, legal links, footer note,
  trust items, badges, consent text (`ui.consentText`), `serviceBlurbs` (one per service id).
- `content/faqs.json` -- the shared FAQ library: `[{ id, question, answer }]`.
- `content/pages/<slug>.json` -- one per page: `home` (with `"isHome": true`), one per
  service (`slug` = the service's slug), one per area (`slug` = the area's slug), and
  `about`, `contact`, `faqs`, `projects`, `privacy-policy`, `terms`.

Each page kind keeps **exactly the section types and order of its example**. That
order is the Website Section Blueprint; don't drop, add or reorder sections. Write
all-new copy for this client; the example only shows shape, depth and length.

With more than 6 areas, write the city pages in parallel with subagents (3-4 cities
each). Give each one: the config, `kit/examples/pages/austin.json`, the rules below,
and the angles other city pages already use, so no two read alike.

### Content rules (Blueprint, non-negotiable)

- **Never invent facts.** Years in business, licences, insurance, certifications,
  warranties, guarantees, financing, prices, response times, team size, "family-owned",
  "24/7", awards, job counts: only when the config or the context states them.
  When a fact is missing, leave the field empty or leave the claim out. The site
  renders `[CONTENT NEEDED]` from missing data itself; **never type that text** (the
  build refuses it). For questions still missing on a page, use `faqSection.needed`.
- **Facts come from the config, exactly.** Never write the phone, address, hours,
  rating or licence into copy: the site renders them from Site Settings, so they can
  never drift. Use `business.name` character for character wherever you name the business.
- **Reviews are never retyped.** Reference them by author (`"reviews": ["Debrah W."]`);
  the quote text comes from the config untouched. City pages use reviews from that
  city where there are any (`"local": true` does the filtering).
- **City pages must be genuinely local.** Real, accurate local detail (climate,
  housing stock, neighbourhoods, what that means for this trade) written for this
  business. Never claim jobs, customers or a presence in a city unless the config or
  context says so. No two city pages may share paragraphs or read like find-and-replace.
- **SEO:** every page gets its own `seo.title` (≤ 60 chars, service + city + business)
  and `seo.description` (≤ 155 chars). Never reuse one page's SEO on another.
- **Links** point to pages that exist (`/<slug>`, `/#services`, `/contact#quote`). The
  build checks this.
- **Legal pages:** adapt the example's Privacy Policy and Terms to this business
  (name, contact email, state, services, SMS consent). Flag them for client review.
- **Tone:** match the client's own voice from their site and reviews. Plain,
  confident, specific. No hype words ("best-in-class", "unparalleled"), no em-dash
  chains, no lists of three adjectives.

## 6. Build it into Sanity

```bash
node --env-file=.env.local scripts/build-site.mjs           # dry run: validates everything
node --env-file=.env.local scripts/build-site.mjs --write   # only once the dry run is clean
```

The dry run lists every problem (unknown section types or fields, missing pages,
broken links or references, example text copied from Lumen, unreadable brand
colours). Fix the content and re-run until it is clean. Re-running `--write` on
this new project needs `--force` once pages exist; that's expected here.

## 7. Prove it builds and renders

```bash
pnpm lint && pnpm build
pnpm start -p 3123   # in the background
node scripts/content-gaps.mjs http://localhost:3123
node --env-file=.env.local scripts/check-content.mjs
```

Open the home page, one service page and one city page (browser tool if available,
otherwise `curl`) and check the business name, brand colours and copy are right. Stop
the server.

## 8. Write REVIEW.md

In the repo root, for Shay:

```markdown
# <Business> -- review before launch
## Missing facts            (from content-gaps.mjs, grouped by page)
## Images still needed      (from build-site's "images still missing" line)
## Claims to confirm        (every factual claim in the copy + where it came from)
## Unconfirmed config facts (anything marked UNCONFIRMED in site.config.yaml)
## Legal pages              (Privacy + Terms need the client's own review)
## Next                     (/push-site, then /deploy-site; GHL token if missing)
```

## 9. Report

Tell the user: the folder, the Sanity project ID and Studio at
`http://localhost:3000/studio` (after `pnpm dev`), page count, and the REVIEW.md
headline numbers. Nothing is committed yet; `/push-site` does that.
