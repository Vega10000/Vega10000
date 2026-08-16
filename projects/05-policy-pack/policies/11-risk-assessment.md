# Risk Assessment Policy

| | |
|---|---|
| **Policy ID** | POL-RA-11 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Understand what could go wrong before it does, and fix the things that matter most first.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Report anything that looks like a weakness, including in a process rather than a system.
2. Do not delay a patch or reboot when asked -- that window is a deliberate risk decision.
3. Do not install unapproved software; it arrives with its own vulnerabilities.

## 4. What the organisation does

- A documented risk assessment is performed annually and after significant change, feeding the risk register.
- Authenticated vulnerability scans run monthly and out-of-cycle when a significant vulnerability is announced.
- Remediation follows a risk-based schedule; anything not remediated in the window is risk-accepted in writing and tracked on the POA&M.

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
| 3.11.1 | Periodically assess the risk to organizational operations, organizational assets, and individual... |
| 3.11.2 | Scan for vulnerabilities in organizational systems and applications periodically and when new vu... |
| 3.11.3 | Remediate vulnerabilities in accordance with risk assessments. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
