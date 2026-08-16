# 02 — Gap Assessment Scoring Model

**What it is.** A scoring engine that takes an assessment of all 110 NIST SP
800-171 requirements and produces a defensible score plus a ranked remediation
order.

**Why it matters.** A list of failed controls is not a plan. Clients need to
know what to fix first and why that order. This turns an assessment into a
sequenced roadmap where every point is traceable to a specific finding.

**Build time.** 8–12 hours.
**Sells as.** The engine behind every $2.5k–$6k gap assessment you deliver.

---

## Run it now

```bash
cd projects/02-gap-assessment-scoring-model
python3 score.py data/sample-assessment.csv
```

Output: score out of 110, status breakdown, unjustified N/A warnings, and a
remediation order ranked by points recovered per unit of effort.

---

## The weights problem — read this before any client use

The DoD Assessment Methodology assigns each requirement **5, 3, or 1 points**,
subtracted from a starting score of 110. This repo ships **every requirement at
5 and flagged `weight_verified=no`**, because publishing guessed weights would
hand a client a wrong SPRS score, and a wrong score submitted to SPRS is a
problem with a federal contract attached to it.

`score.py` prints a loud warning until you fix this.

**To fix it:** get the current *NIST SP 800-171 DoD Assessment Methodology* from
the DoD CIO / DIBCAC site, set the `weight` column in
`data/nist-800-171-r2-controls.csv` from the official table, and set
`weight_verified=yes`. Budget two hours. It is the single highest-value two
hours in this whole folder — it is what makes your number real.

---

## Step-by-step

### Step 1 — Understand the scoring model

- Start at 110
- Subtract the weight of each requirement not met
- Minimum is −203, so negative scores are normal and expected
- `partial` counts as **not met**. The methodology allows partial credit for
  only two specific requirements. Assuming credit you have not earned is how a
  self-assessment becomes an inaccurate submission.
- `not_applicable` costs nothing **but requires written justification**.
  Unjustified N/A is the first thing an assessor challenges.

### Step 2 — Verify the weights (see above)

### Step 3 — Build the assessment worksheet

`data/sample-assessment.csv` is the format: `id, status, evidence, notes`.

For a real engagement, produce it as an Excel workbook with a dropdown on
`status` so clients cannot type free text. One row per requirement, 110 rows.

### Step 4 — Calibrate the effort model

`EFFORT` in `score.py` estimates remediation effort per requirement, used only
for ranking (never for the score). The shipped values are a starting point.
After two or three real engagements, replace them with your measured numbers.
This is proprietary knowledge that accumulates — it is what makes your
remediation order better than a competitor's.

### Step 5 — Wrap it in a report

The script output is for you. The client gets a document:

1. **Executive summary** — the score, what it means, what it costs to fix
2. **Scope** — what was assessed (from project 03)
3. **Methodology** — the DoD methodology, how you assessed, what evidence you saw
4. **Findings** — by family, each with requirement, current state, gap, risk
5. **Remediation roadmap** — the ranked order, phased into 30/60/90 days
6. **Appendix** — full 110-requirement table

The executive summary is what gets read. Write it last and write it for someone
who will not read past page one.

---

## Files

| Path | What it is |
|---|---|
| `score.py` | The scoring engine |
| `data/nist-800-171-r2-controls.csv` | All 110 requirements with weights |
| `data/sample-assessment.csv` | Worked example so it runs immediately |

## Usage

```bash
python3 score.py my-client.csv                    # score an assessment
python3 score.py my-client.csv --csv-out find.csv # export ranked findings
```
