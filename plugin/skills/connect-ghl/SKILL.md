---
name: connect-ghl
description: Connect a client site (built by /new-site) to the client's GoHighLevel sub-account -- quote-form leads into the "Website Leads" pipeline, plus the GHL chat, reviews and booking widgets. Use when the user runs /connect-ghl or asks to link a site to GHL.
argument-hint: "[site-folder] [ghl-location-id]"
disable-model-invocation: true
---

# /connect-ghl

Arguments: $ARGUMENTS -- optional site folder (default: the current folder) and the
GHL location ID (default: `setup.ghl.locationId` in `site.config.yaml`; else ask).

What it connects:
- **Leads.** The quote form sends each request to GHL: contact, `website lead` tag,
  a note with the request and consent record, and an opportunity in
  **Website Leads → New Lead**. Needs the token and three IDs as env vars.
- **Widgets** (optional): chat widget, reviews widget, booking calendar. They live in
  Sanity Site Settings, are public, and need no deploy.

Shay's side must exist first in that client's sub-account: the **Website Leads**
pipeline with a **New Lead** stage, and a **Private Integration** token with access to
contacts and opportunities. If either is missing, stop and say so.

The client's GHL account is live. Never create, change or delete anything in GHL
from here. The only GHL call this command makes is the read-only check in step 3.

## 1. Preflight

In the site folder: `site.config.yaml` and `.env.local` exist (it's a site from
`/new-site`). Read the config's `setup.ghl` and `integrations`.

## 2. The token (the user adds it, never you)

```bash
grep -q '^GHL_PRIVATE_INTEGRATION_TOKEN=.' .env.local && echo present || echo missing
```

If missing, ask the user to open `.env.local` in the site folder and add one line,
`GHL_PRIVATE_INTEGRATION_TOKEN=<token>`, then wait. The token must never be pasted into
this chat, and never printed or echoed by any command you run. (GHL → client
sub-account → Settings → Private Integrations. Shay shares it through a one-time
secret link, never over Upwork or email.)

## 3. IDs: location, then pipeline and stage

Set `GHL_LOCATION_ID=<location id>` in `.env.local` (replace the line if it exists).
Then run the read-only check:

```bash
node --env-file=.env.local scripts/ghl-check.mjs
```

- ✓ with one "New Lead" stage: it prints `GHL_PIPELINE_ID=...` and
  `GHL_PIPELINE_STAGE_ID=...`. Set both in `.env.local` (IDs, not secrets, so
  writing them is fine).
- Several "New Lead" stages: show the pipelines and ask which one website leads go to.
- No "New Lead" stage, or a 401/403/422: stop and pass on the hint it printed; that's
  Shay's side to fix.

Record the three IDs in `site.config.yaml` under `setup.ghl` (locationId, pipelineId,
stageId). Never the token.

## 4. Widgets (optional)

Ask the user for any of these not already in the config's `integrations`, and say
"skip" is fine for each:
- `chatWidgetId`: GHL → Sites → Chat Widget → the widget's ID
- `reviewsWidgetUrl`: GHL → Reputation → Widgets → the `src` URL from the embed code
- `calendarEmbedUrl`: GHL → Calendars → the calendar's share/embed URL. Leave it empty
  unless the client takes bookings online; it adds a booking tab to the quote popup.

Write them into `integrations` in `site.config.yaml`, then:

```bash
node --env-file=.env.local scripts/set-integrations.mjs
```

This updates Site Settings in place (no rebuild, Studio edits kept). With the Sanity
webhook set up, the live site shows them within seconds, otherwise within the hour.

## 5. Put the env vars live

If the site is already on Vercel (`.vercel/project.json` exists), copy the four GHL
vars to production and preview without printing them, then redeploy:

```bash
bash -c 'set -a; . ./.env.local; set +a
for name in GHL_PRIVATE_INTEGRATION_TOKEN GHL_LOCATION_ID GHL_PIPELINE_ID GHL_PIPELINE_STAGE_ID; do
  for env in production preview; do
    printf "%s" "${!name}" | vercel env add "$name" "$env" --force --yes >/dev/null && echo "set $name ($env)"
  done
done'
vercel deploy --prod --yes
```

If it isn't deployed yet, say that `/deploy-site` will copy them.

## 6. Report, and what's left for Shay

Report what's connected (leads yes/no; each widget) and the live URL. Leave the config
change uncommitted (the next `/push-site` saves it). Then list Shay's GHL checklist:

- **Instant reply** (SMS + email): workflow trigger **Contact Tag → Tag Added →
  `website lead`**, in lowercase, because GHL lowercases tags. Not "Contact Created":
  returning customers wouldn't trigger it.
- **Allow duplicate opportunities** (pipeline settings). Without it, GHL rejects a
  returning customer's second request with `OPPORTUNITY_NO_DUPLICATE`.
- **Missed-call text back**: needs a GHL phone number on the sub-account.
- **Test leads**: one from a desktop and one from a phone, through the live quote form,
  name **"TEST – delete me"** and a message saying it's a test. Check that the contact,
  `website lead` tag, consent note and New Lead opportunity appear and the instant reply
  arrives. Then Shay deletes the test contacts. Don't delete anything in GHL yourself.
