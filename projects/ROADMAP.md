# Build Order

The projects are numbered by topic, not by the order you should build them.
This is the order.

## Build in this sequence

### 1. Home Compliance Lab (project 07) — build first

Everything else is written *against* something. Without the lab you are writing
compliance documentation from imagination, and it reads that way.

Build it, then deliberately break it (step 5 of its guide). The realistic
problems you introduce are the findings you will meet in every real environment.

**Stop condition:** you can reach the CUI share from the engineering workstation
and provably cannot from the reception workstation.

### 2. Scoping Workbook (project 03)

Short, and it is the first thing you sell. Run it against your own lab. You
will find the interview misses things — fix it before it meets a client.

**Stop condition:** every lab asset is classified with a written justification.

### 3. Gap Assessment Scoring Model (project 02)

Assess your own lab against all 110. This is where you actually learn 800-171 —
not from reading it, but from having to decide whether a specific machine meets
a specific requirement.

**Verify the weights here.** Two hours with the official DoD methodology.

**Stop condition:** a score for your lab you could defend to an assessor.

### 4. CMMC Documentation Kit (project 01)

The largest build, and much easier now: you have an assessed environment to
write about. Rewrite all 110 statements while the assessment is fresh.

**Stop condition:** a complete SSP for your lab with no `[BRACKETS]` remaining.

### 5. POA&M Tracker (project 04)

The findings from step 3 become POA&M items. Small build; do it while the
findings are in front of you.

### 6. Policy Pack (project 05)

Generated already. Rewrite the "What you must do" sections in your own voice,
then cross-check each policy against the SSP you wrote in step 4.

### 7. Vulnerability Management Program (project 06)

Run three real scan cycles in the lab. This takes calendar time, so start the
scanning early even if you write it up later.

### 8. Client Intake Questionnaire (project 08)

Last, because you now know what you actually need to ask, and roughly how long
the work takes.

---

## Why not build the product first

The instinct is to build the sellable kit immediately. It produces a worse
product and a worse consultant.

Templates written without having assessed a real environment are generic, and
buyers can tell. More importantly, the first client who asks *"how do we handle
a shop-floor PC three people share?"* needs an answer, and the only way to have
one is to have met that problem.

The lab is not preparation for the work. It is the work, done once with nothing
at stake.

---

## Doing this alongside a job

At 10–15 hours a week the whole sequence runs about ten weeks. Realistic split:

| Weeks | Focus |
|---|---|
| 1–2 | Lab (07) |
| 3 | Scoping (03) + start marketing groundwork |
| 4–5 | Assessment (02), verify the weights |
| 6–8 | Documentation kit (01) — the long one |
| 9 | POA&M (04), policies (05) |
| 10 | VM programme (06), intake (08) |

Start outreach in week 3, not week 10. Compliance sales cycles run 30–90 days,
so conversations started early close around the time you have something to sell.

**Do not wait until everything is perfect.** The kit at 80% with a real worked
example beats a perfect kit nobody has seen.
