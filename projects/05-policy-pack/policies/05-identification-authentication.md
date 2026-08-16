# Identification and Authentication Policy

| | |
|---|---|
| **Policy ID** | POL-IA-05 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Make sure people and devices are who they claim to be before they get access to anything.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Your password must be at least 14 characters. A passphrase is easier to remember and harder to break.
2. Never reuse your work password anywhere else.
3. Approve a multifactor prompt only when you triggered it. If one arrives unexpectedly, deny it and report it.
4. Never store a password in a document, spreadsheet, or script. Use the password manager.

## 4. What the organisation does

- Every user has a unique identifier; shared accounts are prohibited.
- Multifactor authentication is required for all privileged access and all network access.
- Inactive accounts are disabled automatically after the defined period.
- Passwords are stored only as salted hashes and are never transmitted in clear text.

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
| 3.5.1 | Identify system users, processes acting on behalf of users, and devices. |
| 3.5.2 | Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to al... |
| 3.5.3 | Use multifactor authentication for local and network access to privileged accounts and for netwo... |
| 3.5.4 | Employ replay-resistant authentication mechanisms for network access to privileged and non-privi... |
| 3.5.5 | Prevent reuse of identifiers for a defined period. |
| 3.5.6 | Disable identifiers after a defined period of inactivity. |
| 3.5.7 | Enforce a minimum password complexity and change of characters when new passwords are created. |
| 3.5.8 | Prohibit password reuse for a specified number of generations. |
| 3.5.9 | Allow temporary password use for system logons with an immediate change to a permanent password. |
| 3.5.10 | Store and transmit only cryptographically-protected passwords. |
| 3.5.11 | Obscure feedback of authentication information. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
