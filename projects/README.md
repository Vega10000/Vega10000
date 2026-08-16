# CMMC / NIST 800-171 Consulting Toolkit

Every project referenced on the profile page, built out with step-by-step
instructions, working tools, and the marketing and monetization material to
turn them into income.

Everything here runs with **Python 3 standard library only**. No dependencies,
no install.

---

## Start here

New to this folder? Read `ROADMAP.md`. It says which projects to build first
and why the order matters.

Want to see something work right now:

```bash
python3 projects/02-gap-assessment-scoring-model/score.py \
        projects/02-gap-assessment-scoring-model/data/sample-assessment.csv

python3 projects/04-poam-burndown-tracker/burndown.py --asof 2026-09-01

python3 projects/08-client-intake-questionnaire/scope_calculator.py --preset medium
```

---

## The projects

| # | Project | Build time | What it earns |
|---|---|---|---|
| [01](01-cmmc-documentation-kit/) | CMMC Documentation Kit | 15–25 h | $99–$299 product; baseline for $6k–$18k builds |
| [02](02-gap-assessment-scoring-model/) | Gap Assessment Scoring Model | 8–12 h | Engine behind $2.5k–$6k assessments |
| [03](03-system-boundary-scoping-workbook/) | System Boundary Scoping Workbook | 4–6 h | $500–$1,500 scoping sessions |
| [04](04-poam-burndown-tracker/) | POA&M Burn-Down Tracker | 5–8 h | The hook into $2k–$5k/mo retainers |
| [05](05-policy-pack/) | Policy Pack — 14 policies | 10–14 h | $49–$99 standalone or bundled |
| [06](06-vulnerability-management-program/) | Vulnerability Management Program | 12–20 h | Proof of hands-on skill; $1k–$3k add-on |
| [07](07-home-compliance-lab/) | Home Compliance Lab | 15–25 h | Makes everything else credible |
| [08](08-client-intake-questionnaire/) | Client Intake Questionnaire | 4–6 h | Makes everything else profitable |

**Total: roughly 75–125 hours.** At 12 hours a week, about ten weeks.

## Marketing and monetization

| Document | Covers |
|---|---|
| [marketing/POSITIONING.md](marketing/POSITIONING.md) | The niche, the message, the claims you must not make |
| [marketing/LEAD-MAGNET.md](marketing/LEAD-MAGNET.md) | The free asset and the five-email sequence |
| [marketing/OUTREACH.md](marketing/OUTREACH.md) | Finding buyers, cold email, LinkedIn, referrals |
| [monetization/PRODUCT-LADDER.md](monetization/PRODUCT-LADDER.md) | Five rungs from free to retainer, with honest revenue numbers |
| [monetization/LAUNCH-90-DAY.md](monetization/LAUNCH-90-DAY.md) | Week by week for the first 90 days |
| [monetization/LEGAL-AND-RISK.md](monetization/LEGAL-AND-RISK.md) | Entity, insurance, contracts, the claims that get you reported |

**Read `LEGAL-AND-RISK.md` before you take a dollar.** Section 6 in particular —
your employment contract may already restrict this.

---

## Three things to get right

### 1. The numbering

NIST SP 800-171 requirements are numbered **3.1.1 – 3.14.7** across **14
families**, not 800-53 IDs (AC-2, IA-5, SC-7). A CMMC deliverable using 800-53
numbering is flagged immediately. Everything here uses the correct scheme.

Also: CMMC Level 2 is tied to **Rev. 2**. Rev. 3 exists and is structured
differently. Do not mix them in one document.

### 2. The scoring weights are unverified

The DoD Assessment Methodology assigns each requirement 5, 3, or 1 points. This
repo ships **every requirement at 5, flagged `weight_verified=no`**, because
publishing guessed weights would give a client a wrong SPRS score.

Before any client use: set the weights from the current official methodology
and mark them verified. `score.py` warns until you do. This is the highest-value
two hours in the folder.

### 3. You cannot certify anyone

Only an authorised C3PAO certifies. You deliver readiness and documentation.
Every piece of marketing must be clear about this.

---

## Regenerating

The 110 requirements, the policy pack, and the implementation statements are
generated from one source of truth:

```bash
python3 projects/_generator/generate.py    # controls CSV + statements + sample
python3 projects/_generator/policies.py    # the 14 policies
```

Edit `_generator/controls_data.py` and regenerate rather than editing outputs by
hand — otherwise the CSV, the statements, and the policies drift apart.

---

## Disclaimer

Templates and educational material, not legal or compliance advice. Nothing
here guarantees any certification or assessment outcome. Verify against current
NIST and DoD publications, and have an attorney review anything you put in
front of a paying client.
