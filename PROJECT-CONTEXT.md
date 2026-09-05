# Project Context — Cybersecurity Profile and Webpage

A single brief covering everything built so far. Upload this as knowledge to the
claude.ai Project named **"Cybersecurity Profile and Webpage"** so any future
chat starts with the full picture instead of re-deriving it.

Last updated: 2026-09-05

---

## 1. Who this is for

**Vega10000** (jamalburns224@gmail.com, github.com/Vega10000).

Positioning (revised Sept 2026): **GRC / compliance analyst specialising in NIST
SP 800-171 Rev 2 and DFARS 252.204-7012 for small defense contractors** —
10-to-100-person machine shops, engineering firms, and suppliers.

The old pitch was "get CMMC-certified before your deadline." That deadline no
longer exists (see §2.0). The pitch is now: **your CMMC deadline is gone, your
DFARS obligation is not** — an accurate SPRS score, a real SSP, and a working
POA&M are still contractually required, and DIBCAC still spot-checks.

Holds Security+. Pursuing CMMC Certified Professional (CCP). Goal is a
GRC/compliance role plus consulting and product income alongside it.

---

## 2.0 REGULATORY STATUS — read this first

**On 13 July 2026 the Department suspended CMMC Phase 2** and stood up a CMMC
Reform Task Force to review the whole programme.

**Suspended:** Level 2 third-party (C3PAO) assessments, Level 3 DIBCAC
assessments, the 10 November 2026 Phase 2 date, and the related contract
designations (affected solicitations to be amended).

**NOT suspended — still binding:**
- DFARS 252.204-7012
- NIST SP 800-171 Rev 2, all 110 requirements
- The self-assessment and a current, accurate SPRS score (Phase 1 was never suspended)
- 72-hour cyber incident reporting to DIBNET; cloud security requirements
- DIBCAC spot-checks against self-reported scores

**In motion:** the Task Force RFI closed 14 Aug 2026; recommendations are due on
or about **13 September 2026** and had not been published as of 5 Sep 2026.

**Action for whoever picks this up:** re-verify this section before using it.
It is the most volatile content in the whole project, the page carries a visible
"verified as of" date, and a stale status board is a specific checkable claim
that has gone wrong. If the Task Force report has landed, section 02 of the
website and this section both need rewriting.

**Why this is good news commercially, honestly framed:** the panic-buying market
is gone, but so is most competitors' pitch. A consultant who can state precisely
what changed and what did not is differentiated right now. And an inaccurate
SPRS score carries False Claims Act exposure whether or not an assessor is
scheduled — that risk did not move on 13 July.

## 2. What exists

### 2.1 The website

- **Source:** `site/index.html` — one self-contained file, no build step, no
  dependencies, no external network requests
- **Published artifact:** https://claude.ai/code/artifact/d0a68471-9f67-4f75-a6f7-076a9b9f5dc0
- **Branch:** `claude/web-page-artifact-ticacn` on `Vega10000/Vega10000`

Eleven sections: profile, **CMMC status board** (dated, sourced — the highest-value
content on the page right now), services, project repository (search + multi-tag filter +
sort + expandable case notes), skills matrix, certifications timeline,
interview request builder, client onboarding tracker, contractor agreement
generator, marketing dashboard, contact.

Design: cool slate ground with a single ultramarine accent, transitional serif
for headings, system sans for body, monospace only for genuine machine text.
Deliberately not the terminal-green security-portfolio cliché. Full light and
dark theme support across all three viewer states.

### 2.2 The projects folder

`projects/` — 47 files, ~41,000 words. Nine projects, each with a README
covering what it is, why it matters, build time, what it earns, and numbered
build steps.

| # | Project | Build time |
|---|---|---|
| 01 | CMMC Documentation Kit | 15–25 h |
| 02 | Gap Assessment Scoring Model | 8–12 h |
| 03 | System Boundary Scoping Workbook | 4–6 h |
| 04 | POA&M Burn-Down Tracker | 5–8 h |
| 05 | Policy Pack (14 policies) | 10–14 h |
| 06 | Vulnerability Management Program | 12–20 h |
| 07 | Home Compliance Lab | 15–25 h |
| 08 | Client Intake Questionnaire | 4–6 h |
| 09 | Consulting Website & Client Tools | 10–16 h |

Plus `marketing/` (positioning, lead magnet, outreach) and `monetization/`
(product ladder, 90-day launch plan, legal and risk).

`projects/ROADMAP.md` gives the build order, which is **not** the numbering
order — build the lab (07) first, because everything else is written against it.

### 2.3 Working tools (Python 3 stdlib only, no dependencies)

```bash
python3 projects/02-gap-assessment-scoring-model/score.py \
        projects/02-gap-assessment-scoring-model/data/sample-assessment.csv
python3 projects/04-poam-burndown-tracker/burndown.py --asof 2026-09-01
python3 projects/08-client-intake-questionnaire/scope_calculator.py --preset medium
```

Generators — edit the source and regenerate rather than hand-editing outputs,
or the CSV, statements, and policies drift apart:

```bash
python3 projects/_generator/generate.py    # controls CSV + statements + sample
python3 projects/_generator/policies.py    # the 14 policies
```

---

## 3. Decisions and corrections already made

Carry these forward. Re-litigating them wastes time.

### 3.1 Control numbering was corrected

Earlier drafts of this material used **800-53 control IDs** (AC-2, IA-2, CM-2,
SC-7). That is wrong for 800-171. NIST SP 800-171 uses **3.1.1 – 3.14.7 across
14 families**. A CMMC deliverable citing 800-53 IDs is flagged immediately.

All material has been rebuilt with correct numbering and verified: 110
requirements, family counts matching the standard, no stray 800-53 IDs outside
text that explains what not to use.

Family counts: 3.1 AC (22), 3.2 AT (3), 3.3 AU (9), 3.4 CM (9), 3.5 IA (11),
3.6 IR (3), 3.7 MA (6), 3.8 MP (9), 3.9 PS (2), 3.10 PE (6), 3.11 RA (3),
3.12 CA (4), 3.13 SC (16), 3.14 SI (7).

Also: CMMC Level 2 is tied to **Rev. 2**. Rev. 3 exists and is structured
differently. Never mix them in one document.

### 3.2 Scoring weights are deliberately unverified

The DoD Assessment Methodology assigns each requirement 5, 3, or 1 points. Those
values were **not** guessed. Every requirement ships at 5 with
`weight_verified=no`, and `score.py` warns until they are set from the official
methodology.

**This is the highest-value open task in the whole project.** Two hours with the
official DoD Assessment Methodology PDF turns an indicative number into a real
one. Do not let anyone shortcut it — a wrong SPRS score is a problem with a
federal contract attached.

### 3.3 Revenue expectations were reset

Earlier material projected a $0 → $100k → $400k trajectory. The material now
carries a realistic first year of **$30k–$65k of side income**, and names the
ceiling: one person at 15 billable hours a week tops out around $115k of service
revenue. Getting past that requires raising rates, productising, subcontracting,
or not selling hours — a deliberate choice, not drift.

Products alone are not a business. At $149, twenty sales is $3,000. Products
build trust and capture email addresses; services are where the money is.

### 3.4 Certification claims are constrained

**Only an authorised C3PAO certifies anyone.** Vega10000 delivers *readiness and
documentation*. Every piece of marketing must be clear about this. Claiming or
implying a CMMC credential not held is a complaint to the Cyber AB, and
competitors do report it.

Say: "CMMC readiness", "assessment preparation", "800-171 documentation".
Never: "I'll certify you", "guaranteed to pass", "government approved".

### 3.5 The page was rebuilt around the suspension (Sept 2026)

Title, meta description, Open Graph, JSON-LD FAQ, hero, services, several
project blurbs, the certification note, and the interview topic list were all
rewritten to lead with DFARS/SPRS rather than a CMMC certification deadline. A
new section 02 carries the dated status board. Structure and tooling were kept —
they were tested and working; only content changed.

### 3.6 All page content is placeholder

Every project, statistic, certification, and price band on the website is
plausible sample content, **not verified fact**. The source is annotated with
`EDIT:` markers. This must be replaced before the page is shown to anyone.

---

## 4. Open tasks, in priority order

0. **Re-verify the regulatory status** — the Task Force report was due ~13 Sep
   2026. If it has landed, section 02 of the site and §2.0 here are both stale.
   This outranks everything else because the page states a dated claim.
1. **Verify the DoD scoring weights** (2 h) — see 3.2. Blocks real client use.
2. **Replace every `EDIT:` placeholder** in `site/index.html` (2–3 h) — blocks
   showing the page to anyone.
3. **Check the employment contract** for outside-work, non-compete, and
   IP-assignment clauses. An IP-assignment clause could mean this entire kit
   belongs to a current employer. See `monetization/LEGAL-AND-RISK.md` §6.
   **Do this before taking a single client.**
4. **Host the site on a real domain** — a claude.ai artifact is private and
   never indexed by search engines. GitHub Pages from `/site` works. Then
   replace the seven `REPLACE-ME.com` placeholders in the metadata.
5. **Create the share card** — `og:image` points at `share-card.png`, which does
   not exist. 1200×630. Every link preview renders it.
6. **Build the lab** (project 07) — everything else is written against it.
7. **Entity + E&O insurance** before the first paid engagement.
8. **Recalibrate the scope calculator** after three real engagements. Its
   multipliers compound to 3.78× on the medium preset, which may be aggressive.
   Track actual hours from engagement one.

---

## 5. Constraints to respect in future work

- **Python 3 standard library only.** No dependencies in any tool here.
- **The website is one self-contained file.** No external requests — a strict
  CSP blocks them in the artifact viewer anyway. Inline everything.
- **Generated content has a single source.** Edit `_generator/controls_data.py`
  and regenerate; never hand-edit the CSV, the statements, or the policies.
- **Never fabricate authoritative values.** Control weights, requirement text,
  and regulatory citations get verified against primary sources or flagged as
  unverified. This project sells accuracy.
- **Every legal artifact carries its disclaimer.** The contract generator says
  on screen and in its output that it is a template needing attorney review.
  Do not remove that to look more authoritative.

---

## 6. Repository layout

```
Vega10000/Vega10000  (branch: claude/web-page-artifact-ticacn)
├── README.md                    GitHub profile readme (untouched)
├── PROJECT-CONTEXT.md           this file
├── site/
│   └── index.html               the website, one self-contained file
└── projects/
    ├── README.md                index of all nine projects
    ├── ROADMAP.md               build order and why it differs from numbering
    ├── _generator/              single source of truth for control data
    │   ├── controls_data.py     all 110 requirements + starter statements
    │   ├── generate.py          builds CSV, sample, implementation statements
    │   └── policies.py          builds the 14 policies
    ├── 01-cmmc-documentation-kit/
    ├── 02-gap-assessment-scoring-model/
    ├── 03-system-boundary-scoping-workbook/
    ├── 04-poam-burndown-tracker/
    ├── 05-policy-pack/
    ├── 06-vulnerability-management-program/
    ├── 07-home-compliance-lab/
    ├── 08-client-intake-questionnaire/
    ├── 09-consulting-website/
    ├── marketing/
    └── monetization/
```

---

## 7. Disclaimer

Templates and educational material, not legal or compliance advice. Nothing here
guarantees any certification or assessment outcome. Verify against current NIST
and DoD publications, and have an attorney review anything placed in front of a
paying client.
