# 05 — Policy Pack (14 Core Policies)

**What it is.** One policy per NIST SP 800-171 family, written to be read by
employees rather than only by auditors.

**Why it matters.** Most policy templates are unreadable, so staff never follow
them and the organisation fails on *implementation* rather than documentation.
An assessor interviews employees. If nobody can describe the policy, the policy
does not exist.

**Build time.** 10–14 hours.
**Sells as.** $49–$99 standalone, or bundled into the documentation kit.

---

## The 14

| # | Policy | Family |
|---|---|---|
| 01 | Access Control | 3.1 |
| 02 | Awareness and Training | 3.2 |
| 03 | Audit and Accountability | 3.3 |
| 04 | Configuration Management | 3.4 |
| 05 | Identification and Authentication | 3.5 |
| 06 | Incident Response | 3.6 |
| 07 | Maintenance | 3.7 |
| 08 | Media Protection | 3.8 |
| 09 | Personnel Security | 3.9 |
| 10 | Physical Protection | 3.10 |
| 11 | Risk Assessment | 3.11 |
| 12 | Security Assessment | 3.12 |
| 13 | System and Communications Protection | 3.13 |
| 14 | System and Information Integrity | 3.14 |

Regenerate after editing the source:

```bash
python3 projects/_generator/policies.py
```

---

## The design rule that makes these different

Every policy leads with **"What you must do"** — numbered, plain, addressed to
the employee — before **"What the organisation does."** Control mappings live in
an appendix so the body stays readable.

Compare to a typical template that opens with three paragraphs of scope
boilerplate and a control cross-reference table. Nobody reads those, which is
why nobody follows them.

Test: hand one to someone with no security background. If they cannot say what
they personally have to do after two minutes, rewrite it.

---

## Step-by-step

### Step 1 — Read the generated policies

They are complete drafts, not outlines. Read all 14 to see the pattern.

### Step 2 — Rewrite section 3 of each in your own voice

"What you must do" is the section that carries the product. Make each rule
concrete, specific, and something a person can actually comply with. Cut
anything vague — "users shall exercise appropriate care" means nothing.

### Step 3 — Check every policy against the SSP

Policy and SSP must agree. If the policy says quarterly access reviews and the
SSP says annual, that is a finding. Cross-check before delivery, every time.

### Step 4 — Add the approval block

Each needs an owner, an approver, an effective date, and a review cycle. An
unsigned, undated policy is a draft, and an assessor will treat it as one.

### Step 5 — Convert to .docx

```bash
for f in projects/05-policy-pack/policies/*.md; do
  pandoc "$f" -o "${f%.md}.docx"
done
```

---

## Common failure to avoid

Do not ship a policy describing a practice the organisation does not follow.
It is worse than having no policy: it documents a control you are provably not
meeting, and you handed them the evidence. If they do not do it, either change
the policy or open a POA&M item to start doing it.
