# 07 — Home Compliance Lab

**What it is.** A small-business environment built to be assessed —
deliberately imperfect, so the documentation you write against it is realistic.

**Why it matters.** Practising compliance on a clean environment teaches
nothing. Real environments have legacy systems, shared accounts, and
undocumented exceptions. This is the test bed for every other project here, and
the source of the awkward findings that make your templates believable.

**Build time.** 15–25 hours.
**Sells as.** Nothing directly — it is what makes everything else credible, and
it is what you demo in an interview.

---

## Minimum viable lab

Runs on one machine with 16 GB RAM. VirtualBox or Proxmox, both free.

| VM | Purpose | Spec |
|---|---|---|
| DC-01 | Windows Server, domain controller + file server | 4 GB |
| WS-01 | Windows 11 domain-joined workstation | 4 GB |
| WS-02 | Second workstation, different user role | 2 GB |
| FW-01 | pfSense or OPNsense firewall | 1 GB |
| SCAN-01 | Linux with Nessus Essentials | 4 GB |

Windows Server and Windows 11 evaluation editions are free for 180 days and
renewable. Everything else is free permanently.

If you have less RAM: DC-01, WS-01, and FW-01 alone are enough to do real work.

---

## Step-by-step

### Step 1 — Network design first

Three VLANs, because segmentation is the control you will be asked about most:

| VLAN | Purpose | Rule |
|---|---|---|
| 10 | CUI enclave — DC, file server, engineering workstation | No outbound except approved |
| 20 | General business — reception, general workstations | No route to VLAN 10 |
| 30 | Guest / OT simulation | Internet only, no internal routing |

Build the firewall first and get the rules right before adding hosts.

### Step 2 — Build the domain

Install Windows Server, promote to domain controller, create an OU structure
and a handful of users in different roles. Create a file share and put some
files in it marked as CUI.

### Step 3 — Join the workstations

Domain-join both. Give them different users with different access, so access
review has something to review.

### Step 4 — Bake in the realistic problems

**This is the step that makes the lab valuable.** A clean lab teaches nothing.
Deliberately introduce:

- A shared admin account that three "people" use
- One machine two patch levels behind
- A file share with inherited permissions nobody understands
- A user with local admin rights they do not need
- An account belonging to someone who "left" six months ago
- A firewall rule with no documented justification
- No password policy on one OU

These are the findings you will meet in every real environment. Documenting
around them is the skill.

### Step 5 — Instrument it

Enable audit logging on the domain and file server. Install Nessus and run an
authenticated scan. Enable Windows Firewall logging.

### Step 6 — Assess your own lab

Run the full workflow end to end:

1. Scoping interview against the lab (project 03)
2. Assess all 110 requirements (project 02)
3. Write the SSP (project 01)
4. Build the POA&M (project 04)
5. Remediate the top items and reassess

You now have a complete worked example — and you will have found gaps in your
own templates, which is the real point.

### Step 7 — Make it rebuildable

Script the build, or snapshot every VM. You will break it, and rebuilding by
hand three times is how a lab quietly dies.

---

## What this gives you in an interview

Most candidates for a GRC role have read about 800-171. Being able to say *"I
built an environment with a shared admin account and a legacy box, assessed it,
scored it, and wrote the SSP and POA&M — here is what I found and here is what
I fixed first"* puts you in a different category entirely.

Bring the artifacts. A redacted SSP and POA&M from your own lab is the single
strongest thing you can put in front of a hiring manager.
