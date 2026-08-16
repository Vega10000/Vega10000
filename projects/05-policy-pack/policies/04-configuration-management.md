# Configuration Management Policy

| | |
|---|---|
| **Policy ID** | POL-CM-04 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Keep systems in a known, deliberate state, so that a change is something we decided rather than something that happened.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Do not install software yourself. Request it and it will be installed for you.
2. Do not change security settings on your machine, including firewall and antivirus.
3. If you need something that is blocked, ask -- there is usually an approved way.

## 4. What the organisation does

- Documented baseline configurations exist for each system type and are enforced centrally.
- Changes are requested, security-impact assessed, approved, and logged before implementation.
- Systems are built with least functionality: only required roles, features, and applications.
- A hardware and software inventory is maintained and reconciled quarterly.

## 5. Roles and responsibilities

| Role | Responsibility |
|---|---|
| [Information Security Officer] | Owns this policy, reviews it annually, and handles exceptions |
| [IT Administrator] | Implements and maintains the technical controls behind it |
| Managers | Approve access for their staff and confirm it is still needed at review |
| All personnel | Follow this policy and report anything that looks wrong |

## 6. Exceptions

Any exception must be requested in writing, include a business justification and
a compensating control, be approved by the policy owner, carry an expiry date,
and be recorded on the POA&M. Undocumented exceptions are policy violations.

## 7. Compliance

Failure to follow this policy may result in loss of access and disciplinary
action up to termination. Where a violation involves CUI, it is handled as a
security incident under the Incident Response Policy.

## Appendix A — Control mapping

This policy supports the following NIST SP 800-171 Rev. 2 requirements. The
System Security Plan carries the implementation detail for each.

| Requirement | Summary |
|---|---|
| 3.4.1 | Establish and maintain baseline configurations and inventories of organizational systems (includ... |
| 3.4.2 | Establish and enforce security configuration settings for information technology products employ... |
| 3.4.3 | Track, review, approve or disapprove, and log changes to organizational systems. |
| 3.4.4 | Analyze the security impact of changes prior to implementation. |
| 3.4.5 | Define, document, approve, and enforce physical and logical access restrictions associated with ... |
| 3.4.6 | Employ the principle of least functionality by configuring organizational systems to provide onl... |
| 3.4.7 | Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and... |
| 3.4.8 | Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or den... |
| 3.4.9 | Control and monitor user-installed software. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
