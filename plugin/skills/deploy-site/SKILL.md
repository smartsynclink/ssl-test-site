---
name: deploy-site
description: Deploy a client site (built by /new-site, pushed by /push-site) to its own Vercel project -- create and link the project, copy the env vars, connect GitHub for auto-deploys, deploy to production, allow the URL in Sanity, smoke-test it. Use when the user runs /deploy-site or asks to put a client site on Vercel.
argument-hint: "[site-folder]"
disable-model-invocation: true
---

# /deploy-site

Arguments: $ARGUMENTS -- optional site folder (default: the current folder).

Running this command is the go-ahead to create the Vercel project and deploy.
Read `site.config.yaml` for `setup.*` throughout.

## 1. Preflight

- `git remote get-url origin` works and `git status --short` is empty: deploy what's
  on GitHub. If not, tell the user to run `/push-site` first.
- `.env.local` has `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_API_READ_TOKEN` and
  `SANITY_REVALIDATE_SECRET`. If `GHL_PRIVATE_INTEGRATION_TOKEN` or any `GHL_*`
  ID is missing, warn: the quote form will ask visitors to call until they are added
  and the site is redeployed. Carry on.
- `vercel whoami` works; otherwise ask the user to run `vercel login` in their own
  terminal. Never handle their password.
- Team: `setup.vercelTeam`. If empty, run `vercel teams ls`, ask the user which
  one, and record it. Project name: `setup.vercelProject`, else `setup.slug`.

## 2. Create and link the project

```bash
vercel project add <project> --scope <team>      # "already exists" is fine
vercel link --yes --project <project> --team <team>
# `project add` leaves the preset on "Other", which fails the deploy ("No Output Directory named dist")
vercel api "/v9/projects/<project>?teamId=<team>" -X PATCH -f framework=nextjs --silent
vercel project inspect <project> --scope <team> | grep "Framework Preset"   # must say Next.js
vercel git connect --yes                          # auto-deploy on every push to main
```

If `git connect` fails (usually the Vercel GitHub app has no access to that
organisation), carry on: deploys then happen from this command only. Tell the user
how to fix it (Vercel → project → Settings → Git) at the end.

## 3. Environment variables

Copy these from `.env.local` to **production** and **preview**, without printing
any value:

```bash
bash -c 'set -a; . ./.env.local; set +a
for name in NEXT_PUBLIC_SANITY_PROJECT_ID NEXT_PUBLIC_SANITY_DATASET SANITY_API_READ_TOKEN SANITY_REVALIDATE_SECRET \
            GHL_PRIVATE_INTEGRATION_TOKEN GHL_LOCATION_ID GHL_PIPELINE_ID GHL_PIPELINE_STAGE_ID; do
  [ -n "${!name}" ] || { echo "skip $name (not set)"; continue; }
  for env in production preview; do
    printf "%s" "${!name}" | vercel env add "$name" "$env" --force --yes >/dev/null && echo "set $name ($env)"
  done
done'
```

Never copy `SANITY_API_WRITE_TOKEN` (only the local scripts use it; a write token
on Vercel is a risk with no use) or `SANITY_DEV_DRAFTS`.

## 4. Deploy

```bash
vercel deploy --prod --yes
```

Note the production URL it prints (`https://<project>.vercel.app` or similar).

## 5. Allow the site in Sanity

Studio at `/studio` and draft preview only work from allowed origins:

```bash
pnpm exec sanity cors add https://<production-url-host> --credentials --project-id <setup.sanityProjectId>
```

Also add `setup.domain` the same way when it is set.

## 6. Smoke test

`curl -s -o /dev/null -w "%{http_code}"` must return 200 for `/`, one service page,
one city page, `/contact` and `/studio`. The home page HTML must contain
`business.name`. If anything fails, read the deployment logs
(`vercel inspect <url> --logs`), fix it, `/push-site`, and deploy again.

## 7. Domain (when `setup.domain` is set)

```bash
vercel domains add <domain-host> <project> --scope <team>
```

It prints the DNS records to set at the registrar. That change is the client's or
Shay's; list the records in the report.

## 8. Record and report

Write `setup.vercelTeam`, `setup.vercelProject` and the production URL into
`site.config.yaml` (leave it uncommitted; the next `/push-site` saves it).

Report the live URL, the smoke-test results, and what is still manual:
- **Sanity webhook** (pages refresh seconds after a publish instead of within the hour):
  sanity.io/manage → project → API → Webhooks → Create: URL
  `https://<domain or production URL>/api/revalidate`, dataset `production`,
  trigger on create/update/delete, projection `{_type}`, HTTP POST, secret = the
  `SANITY_REVALIDATE_SECRET` value in `.env.local` (tell the user where it is, don't print it).
- **DNS** records from step 7, if any.
- **GHL** (Shay): token if it was missing, missed-call text back, instant-reply
  workflows, and the final test lead from desktop and phone. Every test lead must be
  named "TEST – delete me" so nobody mistakes it for a real customer.
- **REVIEW.md**: gaps still to fill before the domain goes live.
