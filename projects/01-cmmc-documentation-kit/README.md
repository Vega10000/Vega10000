# 01 — CMMC Documentation Kit

**What it is.** The complete documentation set a small defense contractor needs
for CMMC Level 2: a System Security Plan, a POA&M, a 14-policy pack, and
pre-written implementation statements for all 110 NIST SP 800-171 Rev. 2
requirements.

**Why it matters.** Most small contractors do not fail CMMC for lack of
security. They fail because nobody wrote down what they already do. This is the
artifact an assessor opens first.

**Build time.** 15–25 hours to a sellable v1.
**Sells as.** A $99–$299 template kit, and the working baseline for every
$6k–$18k documentation engagement you run.

---

## Before you start: the numbering trap

NIST SP 800-171 requirements are numbered **3.1.1 through 3.14.7** across **14
families**. They are *not* the 800-53 control IDs (AC-2, IA-5, SC-7). 800-53 is
the catalog 800-171 was derived from, but a CMMC deliverable citing AC-2 style
IDs gets flagged immediately, and you will not get a second look from that
client.

Also: CMMC Level 2 is currently tied to **Rev. 2**. Rev. 3 exists and is
structured differently. Do not mix them in one document.

---

## Step-by-step

### Step 1 — Read the source (3 hours, unavoidable)

Download and read, in this order:

1. **NIST SP 800-171 Rev. 2** — csrc.nist.gov. Chapter 3 is the 110 requirements.
2. **NIST SP 800-171A** — the assessment procedures. This tells you what an
   assessor actually checks for each requirement. It is the difference between
   guessing and knowing.
3. **DFARS 252.204-7012** — the clause that creates the obligation.
4. **CMMC scoping guidance** — the asset categories in project 03.

You cannot skip this. Every hour here saves five later, and a client will ask
you something that is only answerable if you have read 800-171A.

### Step 2 — Take the generated statements

`templates/implementation-statements.md` has all 110 requirements with a starter
implementation statement each. Generated from `_generator/controls_data.py`.

To regenerate after editing the source data:

```bash
python3 projects/_generator/generate.py
```

### Step 3 — Rewrite the statements in your own voice (6–10 hours)

This is the actual work and the actual product. For each of the 110:

- Read the requirement, then read the 800-171A assessment objectives for it
- Rewrite the starter statement so it answers: **who** does it, **how**,
  **how often**, and **how you would prove it**
- Keep the `[BRACKETS]` — they mark the decisions the client must make
- Cut anything that reads like boilerplate. If it could apply to any company,
  it is not helping anyone

Aim for 60–120 words per statement. Shorter is not better if it leaves an
assessor asking a follow-up question.

### Step 4 — Build the SSP shell (2 hours)

`templates/SSP-template.md` is the container. Check that:

- Section 4 (system boundary) is prominent — it drives everything
- Section 6 is clearly the core, with a slot for each of the 110
- The revision history table is present; assessors check version control
- Every `[BRACKET]` is genuinely a client decision, not laziness on your part

### Step 5 — Build the POA&M (1 hour)

Use `projects/04-poam-burndown-tracker/poam.csv` as the structure. Minimum
viable columns: item ID, requirement, weakness, risk, plan, owner, opened,
milestone due, status, evidence of closure.

**Evidence of closure is the column most templates omit and the one assessors
care about most.** "Completed" with no evidence is treated as still open.

### Step 6 — Attach the policy pack (already generated)

`projects/05-policy-pack/policies/` — 14 policies, one per family.

### Step 7 — Write the quick-start guide (2 hours)

Buyers who cannot get started will refund. One page:

1. Scope your environment (point at project 03)
2. Do the gap assessment (point at project 02)
3. Document what exists in the SSP
4. Track what does not in the POA&M
5. Work the POA&M and reassess

### Step 8 — Convert to sellable formats (3 hours)

Markdown is the master. For sale, produce `.docx` and `.xlsx`, because buyers
edit in Word and Excel:

```bash
pandoc templates/SSP-template.md -o SSP-Template.docx
```

Then in Word: add a cover page, set instructional text in grey italic so buyers
can find and delete it, add a header/footer with version and page numbers, and
build a table of contents from the heading styles.

### Step 9 — Test it on a real environment

Fill it in completely for the lab in project 07. You will find gaps in your own
template within the first hour. Ship only after this.

---

## Contents

| Path | What it is |
|---|---|
| `templates/SSP-template.md` | The System Security Plan container |
| `templates/implementation-statements.md` | All 110 requirements + starter statements |
| `../04-poam-burndown-tracker/poam.csv` | POA&M structure |
| `../05-policy-pack/policies/` | 14 policies |

## Quality bar before you sell it

- [ ] All 110 requirements present and correctly numbered 3.1.1–3.14.7
- [ ] Every statement rewritten, none left as generated
- [ ] Filled in end-to-end against a real environment at least once
- [ ] Instructional text visually distinct and easy to delete
- [ ] `.docx` and `.xlsx` versions open cleanly in Office
- [ ] Version number and date on every document
- [ ] A licence file stating what buyers may and may not do with it
- [ ] A disclaimer: template, not legal or compliance advice, no guarantee of
      certification outcome

## The claim you must not make

Do not say or imply that buying this makes anyone CMMC certified, or that you
can certify them. Certification comes from an authorised C3PAO. You produce
documentation and readiness. Marketing that blurs this is the fastest way to a
complaint you cannot defend.
