# 04 — POA&M Burn-Down Tracker

**What it is.** A Plan of Action and Milestones with a reporting script that
shows what is overdue, what is next, who owns it, and how many assessment
points are tied up in open items.

**Why it matters.** POA&Ms go stale the week after they are written because
nobody owns them and nothing forces a review. This makes the POA&M a management
tool rather than a compliance artifact filed and forgotten.

**Build time.** 5–8 hours.
**Sells as.** Part of every engagement, and the natural hook into a
$2k–$5k/month retainer.

---

## Run it now

```bash
python3 projects/04-poam-burndown-tracker/burndown.py --asof 2026-09-01
```

---

## Step-by-step

### Step 1 — Understand what a POA&M must contain

For each deficiency: what is wrong, the risk, the plan, **a named owner**, a
milestone date, current status, and **evidence of closure**.

The last one is the column most templates omit and the one assessors care about
most. "Completed" with no evidence is treated as still open — the script warns
you about exactly this.

### Step 2 — Use the CSV structure

`poam.csv`. Keep the column names; the script depends on them. Status values
are `Not Started`, `In Progress`, `Completed`.

### Step 3 — Run it monthly and send the output

The report names people. That is the point — an unowned POA&M item does not get
done, and a named owner with a slip count creates the accountability that makes
remediation actually happen.

### Step 4 — Build the client-facing version

Excel, with:

- Conditional formatting: overdue red, due within 30 days amber, closed green
- A summary sheet with open/closed counts and the score projection
- Data validation on status and risk so free text cannot creep in
- A locked structure so clients cannot break the formulas

### Step 5 — Connect it to the score

The script reads the control weights and reports the points tied up in open
items. That single number — *"closing these raises your score by 30"* — is the
one that gets remediation budget approved. Lead with it.

---

## The retainer conversation

This tool is your retainer pitch, and it writes itself. At handover:

> "Your POA&M has 14 open items across four owners. Two are already overdue.
> If nobody runs this monthly it will look exactly the same in six months, and
> your assessment date will not move. I run the monthly review, chase the
> owners, and keep the evidence trail current, for $X a month."

You are not selling maintenance. You are selling the thing that makes the work
they already paid for actually pay off.
