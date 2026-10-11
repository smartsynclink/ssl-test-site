---
name: make-config
description: Turn a client's onboarding-form submission (any of the four SmartSyncLink plan forms, from GHL, Notion, or pasted answers) into the site.config.yaml that /new-site builds from, plus a MISSING.md of what the form didn't give us. Use when the user runs /make-config or asks to make a site config from onboarding answers.
argument-hint: "<submission file, Notion URL, or pasted answers> [output-folder]"
disable-model-invocation: true
---

# /make-config

Arguments: $ARGUMENTS
1. The submission: a file (text, Markdown, CSV or JSON copied/exported from the GHL
   contact or the Notion "Onboarding Submissions" page), a Notion page URL, or the
   answers pasted after the command.
2. Optional output folder. Default: `~/Clients/<slug>/`.

Result: `<folder>/site.config.yaml` (what `/new-site` takes) and `<folder>/MISSING.md`
(what to ask the client or fill in before building). Nothing is created anywhere else.

## The rules

- **Copy, never invent.** Every value comes from the submission, word for word
  (trim spaces only). If the form didn't give it, leave it empty. The site shows
  `[CONTENT NEEDED]` there and MISSING.md lists it. Never guess a licence, rating, year,
  price, review or address.
- **Derived values get a `# CHECK:` comment**, saying why (e.g. a colour picked from the
  word "navy", services grouped into categories, nearby cities). Every CHECK also goes in
  MISSING.md.
- **Never copy** Tax ID / EIN, the CP 575 file, or anything from the AI-assistant,
  qualification, booking/calendar, staff or automation questions. They aren't for the
  website, and the config ends up in a GitHub repo.
- **Valid YAML:** put values containing `: `, ` #`, quotes or a leading special
  character in quotes, and long text in `>-` blocks. Postal codes and anything with a
  leading zero go in quotes.
- **All four plan forms** (Website Only, Sync Starter, Smart Site Link, Elite Link)
  share the same website questions. Map whatever is present and ignore the rest. Note
  the plan in `context.notes` if you can tell it from the questions present.

## 1. Read the submission

- **File or pasted text:** read it.
- **Notion URL:** read it with the Notion tools if this session can see that workspace.
  If not, ask the user to open the page, select all, copy, and paste it into a file,
  then use that file.
- Labels differ slightly between GHL and Notion; the table below lists both. Treat
  "Empty", "N/A", "-" and blank as no answer.

## 2. Get the config's shape

Use `site.config.example.yaml` from the template, the local copy if you're inside the
template repo, otherwise:

```bash
curl -fsSL https://raw.githubusercontent.com/smartsynclink/ssl-test-site/main/site.config.example.yaml
```

Write the client's config in exactly that structure and key order, keeping its comments
where they help. Fields with no answer stay present and empty.

## 3. Map the answers

| Config field | Form question (GHL) / Notion property | How |
|---|---|---|
| `business.name` | "Doing as Business Name" / Doing Business As Name; else "Your Official Legal Business Name" / Legal Business Name | DBA wins. `# CHECK: must match Google Business Profile exactly` |
| `business.phone` | "Business Phone # (where you want calls forwarded to)" / Business Phone (Call Forwarding); else the contact Phone | Keep their format, e.g. `(512) 555-0100`. `# CHECK: forwarding number — confirm it's the number to show (as on Google)` |
| `business.email` | "Business Email Address"; else the contact Email | |
| `business.address.*` | Business Street Address / City / State / Postal Code | Postal code quoted. `# CHECK: show on the site? Remove for service-area businesses` |
| `business.hours` | "What are your business hours…" (Elite form only) | Word for word |
| `business.serviceAreaLabel` | derived from Service Areas + business city/state | e.g. `Greater Austin, TX`. CHECK |
| `business.founded` | a year stated in About Us / Business Highlights | Only an explicit year. "10+ years" goes to notes, not here |
| `business.licenseNumber` | a licence number stated anywhere | Only an explicit number |
| `business.google.*` | "Existing Google Reviews" | Only if it states a rating and/or count |
| `business.social.*` | "Social Platform Links" | facebook / instagram / yelp. Other networks go in notes |
| `business.credentials` | Business Highlights / About Us | Only explicit ones ("Licensed & Insured", "EPA certified") |
| `brand.accent`, `brand.dark` | "Color Palette" | Hex codes as given: brightest → accent (buttons), darkest → dark (header/footer). Colour *names* → pick a close hex, `# CHECK: from "<their words>"`. Font: leave empty |
| `services[]` | "Service List" / Services / Offers (also Bookable Services, Service 1–5 Name) | Keep their service names exactly. Use their headings as categories when there are any; otherwise group into 2–6 categories (CHECK). Each category: short `id`, `title`, kebab-case `slug`, `services` list |
| `areas[]` | "Service Areas" | One per city: `name`, kebab `slug`, `nearby` = 2–3 geographically closest cities from the same list (CHECK). Main city first |
| `areasNote` | derived | e.g. `& surrounding Dallas areas` (CHECK) |
| `reviews[]` | "Testimonials/Reviews to Feature" (+ "Review Highlight Notes") | Only actual quoted reviews with a named author: `author`, `quote` (exact), `city` if stated, `rating` (5 unless stated), `source` if stated. A note like "will send later" → no reviews, list in MISSING |
| `faqs[]` | "FAQ 1–5 Question / Answer" | Split into question + answer, keep their wording |
| `offers.*` | Current Discounts/Promotions, Pricing Details, Business Highlights | Only warranty / financing / guarantee that are explicitly offered |
| `images.logo` | "Logo Upload" | If it's a file URL: download to `<folder>/images/logo.<ext>` (`curl -fsSL -o …`) and set `images/logo.<ext>`. If not downloadable, list in MISSING |
| `context.website` | "Current Website URL" / Business Website | |
| `context.notes` | everything below | One labelled paragraph each, client's words: industry; About Us Info; Business Highlights; How You Serve Customers; Website Purpose; Primary CTA; Pricing Approach + Details; Current Discounts/Promotions; What to Keep from Current Site (+ specify); Content Bullet Points; Review Highlight Notes; Style Reference Links (the design is the template's; references only guide tone); Media Status + Media Drive Link; Do you have a Google Business Profile?; Additional Notes; plan |
| `setup.slug` | from `business.name` | lowercase, hyphens, short (e.g. `acme-roofing`) |
| `setup.domain` | "Domain Name" | `https://<domain>` |
| everything else (`integrations`, `setup.ghl`, Sanity/Vercel/GitHub) | not on the form | Leave empty: GHL comes from Shay (`/connect-ghl`), the rest from the other commands |

## 4. Write MISSING.md

In the output folder, short and scannable:

```markdown
# <Business> -- missing before /new-site
## Not answered on the form       (empty fields the client skipped)
## Not asked on the form          (licence number, Google rating + count + profile link, year founded,
                                   warranty/financing, hours (non-Elite plans), brands carried, photos per slot)
## Please check                   (every CHECK in the config, and why)
## Photos                         (logo status; Media Drive link → put photos in images/ and list them
                                   under `images:` — hero, one per service, before/after projects)
## For launch, not the website    (domain registrar; domain used for email → keep its MX records when
                                   changing DNS; GA/GTM/Pixel "already have" → ask for the IDs; GHL → GHL Setup Guide)
## Ignored                        (one line: AI assistant, booking, Tax ID / CP 575, automation answers)
## Message for the client         (ready for Shay to paste into an email or text, see below)
```

Only list what applies to this client. MISSING.md is for Shay: the sections above are
his checklist.

**Message for the client** is the one part written to the client. It's a short, friendly
note in plain words (no "config", "CHECK", "slug" or technical terms), addressed by the
contact's first name. It lists only what the client can answer: skipped questions,
things the form didn't ask, photos to send, and a quick yes/no on CHECK items they'd know
(e.g. "Should your street address show on the website?", "Is (555) 010-0199 the number
customers should call?"). Leave out launch notes, ignored answers and anything Shay
decides himself. End with how to reply (just answer this message, or send photos to the
Drive folder).

## 5. Check and report

- If you're inside the template repo (or have it locally), validate:
  `node scripts/build-site.mjs --config <folder>/site.config.yaml --config-only`. Fix
  anything it reports. Otherwise `/new-site` validates it as its first step.
- Never echo Tax ID or other private numbers back in the chat.
- Report: the two files, the counts (services, areas, reviews, FAQs), the number of
  CHECKs and missing items, and the next step:
  `/new-site https://github.com/smartsynclink/ssl-test-site <folder>/site.config.yaml`.
  Building now is fine; gaps show as `[CONTENT NEEDED]` until filled.
