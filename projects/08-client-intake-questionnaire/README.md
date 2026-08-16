# 08 — Client Intake Questionnaire

**What it is.** A structured intake that turns a vague inquiry into a
fixed-scope proposal in one call, with a calculator that prices off the answers.

**Why it matters.** Under-scoped engagements are the fastest way to lose money
on fixed-fee compliance work. Pricing should come out of the answers, not
instinct.

**Build time.** 4–6 hours.
**Sells as.** Nothing — it is the thing that makes everything else profitable.

---

## Run the calculator

```bash
python3 projects/08-client-intake-questionnaire/scope_calculator.py --preset medium --service full
```

Output: base hours, every multiplier with its reason, a quote band, a duration
estimate, and a warning when the deadline is not achievable.

---

## Step-by-step

### Step 1 — Use the questionnaire on the first call

`questionnaire.md`. Ten minutes of questions before you talk about price.

### Step 2 — Calibrate the multipliers

The shipped values in `scope_calculator.py` are illustrative starting points,
not market research. After three real engagements, replace them with your
measured hours. Track actual time per engagement from the start — that data is
the difference between a business and a hobby.

### Step 3 — Never quote on the first call

> "Let me put together a scoped proposal based on what you've told me. You'll
> have it within two business days."

This buys you thinking time, signals that you scope rather than guess, and lets
you write a proposal that anchors on outcome instead of hours.

### Step 4 — Quote the top of the band

The calculator gives a band. Quote the top. You will find work you did not
price — you always do — and a fixed fee with no margin becomes an hourly rate
that drops every week.

### Step 5 — Respect the deadline warning

When the calculator says the deadline is not achievable, believe it. Add
resource, cut scope, or decline. A missed CMMC deadline costs the client a
contract, and that is the one failure mode that ends your referral pipeline
permanently.

---

## The disqualifying answers

Some prospects are not worth taking. Walk away when:

- **No contract actually requires CMMC.** They read an article. Tell them, and
  ask them to come back when a contract requires it.
- **They want certification, not readiness.** If they think you can certify
  them, correct it immediately. Only an authorised C3PAO certifies.
- **The deadline is impossible and they will not move it.** You will fail
  publicly and they will blame you.
- **They will not commit anyone internally.** Compliance needs a client-side
  owner. Without one you will write documents describing controls nobody
  implements.
- **They want the cheapest possible option.** They will refund, dispute, and
  tell people you were expensive.

Saying no to bad engagements is how consulting businesses survive their first
year.
