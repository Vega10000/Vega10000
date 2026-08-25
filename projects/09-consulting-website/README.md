# 09 — Consulting Website & Client Tools

**What it is.** A single self-contained web page that works as profile,
portfolio, and working toolset: a filterable project repository, an interview
request builder, a client onboarding tracker, an independent contractor
agreement generator, and a marketing KPI dashboard.

**Why it matters.** Every other project in this folder produces something you
deliver *to* a client. This is the thing that gets you the client. It is also
the only project here that a hiring manager or prospect will actually look at,
which makes it the highest-leverage hour-for-hour build in the set.

**Build time.** 10–16 hours from the existing source.
**Sells as.** Nothing directly. It is the top of the funnel for everything else.

**Source:** [`site/index.html`](../../site/index.html) at the repository root —
one file, no build step, no dependencies, no external requests.

---

## What is already built

| Section | What it does |
|---|---|
| Profile | Positioning statement, availability, contact |
| Services | Three tiers with price bands |
| Project repository | Search, multi-tag filter, sort, expandable case notes |
| Skills matrix | 30 skills across 6 domains, filterable |
| Certifications | Timeline filtered by earned / in progress / planned |
| Interview request | Builds a structured request and a prefilled `mailto:` |
| Client onboarding | 5 stages, 30 steps, progress saved to the browser |
| Contract generator | IC agreement from scope presets and clause toggles |
| Traffic dashboard | 8 KPIs, trend, channel breakdown, funnel |

Plus SEO scaffolding: meta description, Open Graph, Twitter card, and JSON-LD
for `Person`, `ProfessionalService` with an offer catalog, and `FAQPage`.

---

## Step-by-step

### Step 1 — Replace every placeholder (2–3 hours)

The source is annotated. Search for these markers and replace each:

| Marker | What to change |
|---|---|
| `EDIT:identity` | Display name, role line, summary paragraph |
| `EDIT:status` | Availability and location pills |
| `EDIT:stats` | Headline figures and the sparkline series |
| `EDIT:services` | Service descriptions and price bands |
| `EDIT:projects` | The project entries — replace with your real work |
| `EDIT:skills` | Proficiency levels (1 working / 2 proficient / 3 advanced) |
| `EDIT:certs` | Certifications and dates |
| `EDIT:rates` | Contract generator default rates |
| `EDIT:contact` | Email address — appears in three places |

**Do this before showing anyone.** The shipped content is plausible sample text,
not verified fact. A stat you cannot defend is worse than no stat.

### Step 2 — Rewrite the project entries against this folder

The eight projects here each have a README with a Problem / Approach / Outcome
framing. That maps directly onto the card structure in the `PROJECTS` array.
Use the real ones — you built them.

### Step 3 — Host it somewhere indexable (1 hour)

A published Artifact is private and never crawled. For search traffic it needs
a real domain.

**GitHub Pages** is free and works with this repo:

1. Settings → Pages
2. Source: the branch holding the site, folder `/site`
3. Wait for the build, then confirm the URL loads

**Then replace the seven `REPLACE-ME.com` placeholders** in the metadata block
with your real domain. Until you do, the canonical tag and Open Graph URLs point
at nothing, and link previews will be broken everywhere you share it.

Alternatives: Netlify or Cloudflare Pages (drag the file in), or your own domain.
A custom domain is worth the $12/year — `yourname.com` converts better than
`username.github.io`.

### Step 4 — Make the share card (1 hour)

`og:image` currently points at `share-card.png`, which does not exist yet.
Create a 1200×630 image with your name, the positioning line, and nothing else.
Put it at the site root.

Every LinkedIn post, every email, every message containing your link renders
this. A broken share image makes the whole thing look unfinished.

### Step 5 — Wire up real analytics (1 hour)

The dashboard reads numbers you type in — a static page cannot measure its own
traffic. To get real numbers, add a privacy-respecting analytics script:

- **Plausible** or **Fathom** — paid, no cookie banner needed, simple exports
- **GA4** — free, heavier, and requires a cookie notice in most jurisdictions

Then paste the weekly export into the dashboard's dataset panel. Format is
documented in the panel itself: `week, sessions, visitors, engaged, avg seconds,
tool uses, contact clicks, enquiries, spend`.

Track the funnel from `marketing/LEAD-MAGNET.md`: page → email → call → paid.

### Step 6 — Add the lead magnet (2 hours)

The strongest missing piece. Build the scoping worksheet from
`marketing/LEAD-MAGNET.md` and put a capture form above the fold.

The page currently converts to *email you*, which is a large ask for a cold
visitor. A free worksheet is a small ask, and it gives you a list — the only
marketing asset you own outright.

Static hosting has no backend, so use a form service: Formspree, Netlify Forms,
Tally, or ConvertKit. Most have a usable free tier.

### Step 7 — Test it properly (1 hour)

- [ ] Every placeholder replaced
- [ ] Light and dark themes both legible
- [ ] Works at 375px wide, no horizontal scroll
- [ ] Contract generator produces sensible output for each fee model
- [ ] Interview request builds a valid `mailto:` link
- [ ] Onboarding tracker survives a page reload
- [ ] Share card renders — test with LinkedIn's Post Inspector
- [ ] Structured data validates — Google Rich Results Test
- [ ] Loads in under two seconds on a phone

---

## The legal note that applies here

The contract generator produces a **template, not legal advice**, and the page
says so on screen and in the generated document. Keep that disclaimer. Removing
it to make the page look more authoritative is the kind of decision that ends
badly — see `monetization/LEGAL-AND-RISK.md`.

If you sell the generator's output as a service, have an attorney review the
template once. See section 3 of that document.

---

## What this is worth

It is not a product. It is the reason a prospect believes you before you have
spoken to them, and the artifact you send after a conversation instead of a CV.

Two things make it work harder than a normal portfolio site:

1. **The tools are usable by visitors.** A prospect who runs the onboarding
   tracker or the contract generator has spent five minutes with your thinking.
   That is the whole job of a portfolio.
2. **It shows rather than claims.** "I build practical compliance tooling" is a
   claim. A working scope calculator is evidence.
