# System Boundary Scoping Interview

Run this **before** assessing a single control. Scope is the highest-leverage
decision in a CMMC engagement: every asset you bring in scope must meet 110
requirements, be documented, and be assessed. Scoping too wide is the most
expensive mistake a small contractor can make, and it is usually made by
default rather than by decision.

**Time:** 90 minutes to 3 hours depending on size.
**Who must be present:** someone who knows the contracts, someone who knows the
network, and someone who knows how work actually gets done. The third person is
the one who tells you about the shadow process the other two forgot.

---

## Part 1 — Does CUI exist here at all?

Start here. Some companies are told they need CMMC Level 2 and do not.

| # | Question | Answer |
|---|---|---|
| 1.1 | Which contracts contain DFARS 252.204-7012? | |
| 1.2 | Does any contract flow down CUI from a prime? | |
| 1.3 | What has the customer actually designated as CUI, in writing? | |
| 1.4 | Is any of it CUI Specified (export-controlled, ITAR/EAR)? | |
| 1.5 | Could the work be done without receiving CUI at all? | |

> **1.5 is worth real time.** If a company can restructure so CUI never enters
> its environment — the prime holds it, or work happens in the customer's
> enclave — that is often cheaper than compliance. Say so. You will lose that
> engagement and gain a reputation.

## Part 2 — Where does CUI come from and go?

Trace it end to end. Do not accept "it's on the file server" — find out how it
got there.

| # | Question | Answer |
|---|---|---|
| 2.1 | How does CUI arrive? (email, portal, SFTP, physical media, generated here) | |
| 2.2 | Who receives it first, and on what device? | |
| 2.3 | Where is it saved? Name the exact share, folder, or bucket. | |
| 2.4 | Who opens it after that, and on what? | |
| 2.5 | Is it ever emailed internally? Externally? | |
| 2.6 | Does it ever land on a laptop, phone, or USB drive? | |
| 2.7 | Does it go to a subcontractor or partner? How? | |
| 2.8 | Is it printed? Where does paper end up? | |
| 2.9 | Is it in backups? Where do those live? | |
| 2.10 | How is it destroyed, and who records that? | |

### The questions that find the shadow paths

These uncover the flows people forget. Ask all of them.

| # | Question | Answer |
|---|---|---|
| 2.11 | Has anyone ever used personal email to move a file "just once"? | |
| 2.12 | Does anyone use Dropbox, Google Drive, or WeTransfer for work? | |
| 2.13 | Does anyone work from a personal computer, ever? | |
| 2.14 | Who has admin rights on their own machine? | |
| 2.15 | Are there shared logins anywhere — a machine, a portal, a shop-floor PC? | |
| 2.16 | Is there equipment nobody administers any more? | |
| 2.17 | Does an outside IT provider have remote access? What can they reach? | |

## Part 3 — Asset classification

Classify every asset. The categories come from the CMMC scoping guidance.

| Category | Definition | Requirement |
|---|---|---|
| **CUI asset** | Processes, stores, or transmits CUI | All 110 requirements; assessed |
| **Security protection asset** | Provides security capability to the CUI environment (SIEM, firewall, MDM, backup) | All 110 requirements; assessed |
| **Contractor risk managed asset** | Could access CUI but is not intended to, and is managed by policy | Documented; assessed only for the policy |
| **Specialised asset** | IoT, OT, test equipment, government property, restricted systems | Documented with a risk treatment; limited assessment |
| **Out of scope** | Cannot access CUI, physically or logically separated | Not assessed — separation must be demonstrable |

Complete `asset-inventory.csv` with one row per asset.

> **The out-of-scope claim must be provable.** "It doesn't have CUI on it" is
> not separation. If an asset is on the same flat network as a CUI asset, an
> assessor will treat it as in scope. Separation means VLANs with enforced
> rules, separate identity, or physical isolation — and you must be able to
> demonstrate it.

## Part 4 — The reduction conversation

Now that scope is visible, ask what could shrink it. This is where you earn
your fee.

| # | Option | Applicable? | Saving |
|---|---|---|---|
| 4.1 | Move CUI into a single enclave rather than the whole network | | |
| 4.2 | Adopt a compliant cloud (GCC High or equivalent) and stop storing CUI locally | | |
| 4.3 | Segment the shop floor / OT network away from CUI entirely | | |
| 4.4 | Stop CUI reaching mobile devices | | |
| 4.5 | Consolidate file storage to one controlled location | | |
| 4.6 | Move printing/scanning of CUI to one controlled device | | |
| 4.7 | End personal-device access entirely | | |

Every "yes" removes assets from assessment. Quantify it: *"Consolidating to one
enclave takes 34 assets out of scope, which is roughly N weeks of assessment
and documentation work you no longer pay for."*

## Part 5 — Boundary statement

Write the paragraph that goes in SSP Section 4. It must survive being read
aloud to an assessor.

> The CUI system boundary consists of [DESCRIPTION]. CUI enters via [ENTRY],
> is stored in [LOCATION], processed by [SYSTEMS], and transmitted via
> [MEANS]. The boundary is separated from [OUT OF SCOPE] by [MECHANISM].
> Specialised assets within the boundary are [LIST], each with the risk
> treatment documented in Section 4.2.

---

## Output of this session

1. Completed `asset-inventory.csv`, every asset classified
2. A data-flow description good enough for SSP Section 3
3. The boundary statement above
4. A scope-reduction list with estimated savings
5. An asset count that drives the fixed fee for the rest of the engagement

**Do not quote a fixed price before this session.** Quote the scoping session
itself, then price the remaining work off the asset count. This is how you stop
losing money on fixed-fee compliance work.
