# Access Control Policy

| | |
|---|---|
| **Policy ID** | POL-AC-01 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Control who can reach company systems and the information in them, so that access is deliberate and reviewable rather than accumulated by accident.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Use only the account issued to you. Never share it, and never use someone else's.
2. Lock your screen whenever you step away. Systems also lock on their own, but do not rely on that.
3. Do not connect to company systems from a personal device unless it has been approved and enrolled.
4. Connect through the VPN whenever you are working away from the office.
5. If you can reach something you do not need for your job, report it rather than using it.

## 4. What the organisation does

- Access is granted by role, approved in writing by the requester's manager before provisioning.
- Administrators hold a separate privileged account, used only for administrative work.
- All access is reviewed quarterly; access no longer needed is removed within five business days.
- Remote access is permitted only through the managed access point, with multifactor authentication.

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
| 3.1.1 | Limit system access to authorized users, processes acting on behalf of authorized users, and dev... |
| 3.1.2 | Limit system access to the types of transactions and functions that authorized users are permitt... |
| 3.1.3 | Control the flow of CUI in accordance with approved authorizations. |
| 3.1.4 | Separate the duties of individuals to reduce the risk of malevolent activity without collusion. |
| 3.1.5 | Employ the principle of least privilege, including for specific security functions and privilege... |
| 3.1.6 | Use non-privileged accounts or roles when accessing nonsecurity functions. |
| 3.1.7 | Prevent non-privileged users from executing privileged functions and capture the execution of su... |
| 3.1.8 | Limit unsuccessful logon attempts. |
| 3.1.9 | Provide privacy and security notices consistent with applicable CUI rules. |
| 3.1.10 | Use session lock with pattern-hiding displays to prevent access and viewing of data after a peri... |
| 3.1.11 | Terminate (automatically) a user session after a defined condition. |
| 3.1.12 | Monitor and control remote access sessions. |
| 3.1.13 | Employ cryptographic mechanisms to protect the confidentiality of remote access sessions. |
| 3.1.14 | Route remote access via managed access control points. |
| 3.1.15 | Authorize remote execution of privileged commands and remote access to security-relevant informa... |
| 3.1.16 | Authorize wireless access prior to allowing such connections. |
| 3.1.17 | Protect wireless access using authentication and encryption. |
| 3.1.18 | Control connection of mobile devices. |
| 3.1.19 | Encrypt CUI on mobile devices and mobile computing platforms. |
| 3.1.20 | Verify and control/limit connections to and use of external systems. |
| 3.1.21 | Limit use of portable storage devices on external systems. |
| 3.1.22 | Control CUI posted or processed on publicly accessible systems. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
