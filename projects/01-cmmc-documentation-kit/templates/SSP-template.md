# System Security Plan

**[ORGANISATION NAME]** · CUI Environment
NIST SP 800-171 Rev. 2 / CMMC Level 2

| | |
|---|---|
| **System name** | [SYSTEM NAME] |
| **Organisation** | [LEGAL ENTITY NAME] |
| **CAGE code** | [CAGE] |
| **System owner** | [NAME, TITLE, EMAIL] |
| **Security officer** | [NAME, TITLE, EMAIL] |
| **Authorising official** | [NAME, TITLE] |
| **Version** | 1.0 |
| **Date** | [DATE] |
| **Review cycle** | Annually and after significant change |

## Revision history

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | [DATE] | [NAME] | Initial issue |

---

## 1. Purpose and scope

This System Security Plan describes how [ORGANISATION] protects Controlled
Unclassified Information (CUI) received or generated under its contracts, and
documents the implementation of all 110 security requirements in NIST SP
800-171 Rev. 2, as required by DFARS 252.204-7012 and CMMC Level 2.

It covers the systems, people, and processes inside the CUI system boundary
defined in Section 4. Systems outside that boundary are listed as out of scope
with the reasoning for their exclusion.

## 2. System description

**What the system does.** [Plain-English description of the business purpose.
What work happens here? What contracts does it support? Someone unfamiliar with
the company should understand this paragraph.]

**Environment type.** [On-premises / Cloud / Hybrid]

**Users.** [Number of users, categories: employees, contractors, third parties]

### 2.1 Components

| Type | Description | Count | Notes |
|---|---|---|---|
| Workstations | [e.g. Windows 11 Enterprise laptops] | [N] | |
| Servers | [e.g. Windows Server 2022 file/DC] | [N] | |
| Network devices | [firewall, switches, wireless] | [N] | |
| Cloud services | [e.g. Microsoft 365 GCC High] | [N] | |
| Mobile devices | [managed phones/tablets] | [N] | |

A full inventory is maintained separately and reconciled quarterly. See
`asset-inventory.csv`.

## 3. CUI and data flow

### 3.1 Information types

| Type | Description | Where it enters | Where it rests |
|---|---|---|---|
| CUI | [Category, e.g. CUI//SP-CTI] | [e.g. customer SFTP] | [e.g. \\fileserver\projects] |
| Internal | [business data, not CUI] | | |

### 3.2 Data flow

Describe CUI end to end. An assessor reads this to check the boundary is right:

1. **Entry.** [How does CUI arrive? Email, portal, physical media, generated in-house?]
2. **Processing.** [Which systems and applications touch it?]
3. **Storage.** [Exactly where does it rest? Name shares, buckets, folders.]
4. **Transmission.** [How does it move internally and externally?]
5. **Disposal.** [How is it destroyed and who records that?]

## 4. System boundary

### 4.1 In scope

Systems that process, store, or transmit CUI, and systems that provide security
protection to them.

| Asset | Type | Role in the CUI environment | Justification |
|---|---|---|---|
| | | | |

### 4.2 Specialised assets

Assets that cannot be fully secured but are in the environment (IoT, OT, test
equipment, government property). Each needs a documented risk treatment.

| Asset | Type | Why it cannot meet all requirements | Risk treatment |
|---|---|---|---|
| | | | |

### 4.3 Out of scope

| Asset / system | Why it is out of scope | How separation is enforced |
|---|---|---|
| | | |

> **Scoping is the highest-leverage decision in this document.** Every asset you
> bring in scope must meet 110 requirements and will be assessed. Scope narrowly
> and defensibly. See the System Boundary Scoping Workbook.

## 5. Roles and responsibilities

| Role | Name | Responsibility |
|---|---|---|
| System owner | | Accountable for the system and this plan |
| Security officer | | Owns the security programme, POA&M, and this document |
| IT administrator | | Implements and operates technical controls |
| Managers | | Approve and review access for their staff |
| All personnel | | Follow policy; report incidents |

## 6. Security requirement implementation

The core of this document. One entry per requirement, all 110, in order.

Paste from `implementation-statements.md` and edit each until it describes what
this organisation actually does. Every entry needs:

- **Requirement** — the text from 800-171
- **Implementation** — how it is met here, specifically. Who, how, how often.
- **Status** — `implemented` / `partial` / `not_implemented` / `not_applicable`
- **Responsible role**
- **Evidence** — what you would show an assessor

Anything not fully implemented needs a POA&M item. Anything marked not
applicable needs a written justification.

> **Do not overstate.** An SSP claiming a control you do not have is a false
> statement to the government under a federal contract. "Partial, with a POA&M
> item" is a normal, acceptable answer. A fabricated "implemented" is not.

*[INSERT ALL 110 IMPLEMENTATION STATEMENTS HERE]*

## 7. Plan of Action and Milestones

Deficiencies are tracked in the POA&M, maintained separately and reviewed
monthly. Current summary:

| | Count |
|---|---|
| Requirements implemented | |
| Partially implemented | |
| Not implemented | |
| Not applicable | |
| **Assessment score** | **/110** |

## 8. Continuous monitoring

| Activity | Frequency | Owner | Evidence produced |
|---|---|---|---|
| Vulnerability scanning | Monthly | | Scan reports |
| Log review | Weekly | | Review records |
| Access review | Quarterly | | Signed review |
| Baseline configuration check | Quarterly | | Compliance report |
| POA&M review | Monthly | | Updated POA&M |
| Risk assessment | Annually | | Risk register |
| Incident response test | Annually | | Exercise report |
| SSP review | Annually | | This document, versioned |

## 9. System interconnections

| External system | Organisation | Data exchanged | Protection | Agreement |
|---|---|---|---|---|
| | | | | |

## 10. Approval

By signing, the authorising official accepts the risk described in this plan.

| | |
|---|---|
| **Name** | |
| **Title** | |
| **Signature** | |
| **Date** | |

---

## Appendix A — Evidence index

| Requirement | Evidence | Location | Last refreshed |
|---|---|---|---|
| | | | |

## Appendix B — Definitions

**CUI** — Controlled Unclassified Information, as defined in 32 CFR Part 2002.
**System boundary** — the set of assets that process, store, or transmit CUI, plus those providing security protection to them.
**Specialised asset** — an asset in the environment that cannot fully meet the requirements, documented with a risk treatment.
**SPRS** — Supplier Performance Risk System, where DoD self-assessment scores are submitted.
