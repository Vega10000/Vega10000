# System and Communications Protection Policy

| | |
|---|---|
| **Policy ID** | POL-SC-13 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Protect information as it moves and where it rests, and keep the boundary between our systems and everything else deliberate.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Send CUI only through approved channels. Not personal email, not consumer file-sharing.
2. Check you are on the VPN before working with CUI remotely.
3. Do not set up your own network equipment, wireless access point, or cloud service.

## 4. What the organisation does

- The external boundary is controlled by a deny-by-default firewall; internal segmentation separates the CUI environment.
- CUI is encrypted in transit and at rest using FIPS-validated cryptography.
- Split tunnelling is disabled; all remote traffic routes through organisational egress controls.
- Publicly accessible components sit in a separated subnetwork and hold no CUI.

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
| 3.13.1 | Monitor, control, and protect communications at the external boundaries and key internal boundar... |
| 3.13.2 | Employ architectural designs, software development techniques, and systems engineering principle... |
| 3.13.3 | Separate user functionality from system management functionality. |
| 3.13.4 | Prevent unauthorized and unintended information transfer via shared system resources. |
| 3.13.5 | Implement subnetworks for publicly accessible system components that are physically or logically... |
| 3.13.6 | Deny network communications traffic by default and allow network communications traffic by excep... |
| 3.13.7 | Prevent remote devices from simultaneously establishing non-remote connections with organization... |
| 3.13.8 | Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission... |
| 3.13.9 | Terminate network connections associated with communications sessions at the end of the sessions... |
| 3.13.10 | Establish and manage cryptographic keys for cryptography employed in organizational systems. |
| 3.13.11 | Employ FIPS-validated cryptography when used to protect the confidentiality of CUI. |
| 3.13.12 | Prohibit remote activation of collaborative computing devices and provide indication of devices ... |
| 3.13.13 | Control and monitor the use of mobile code. |
| 3.13.14 | Control and monitor the use of Voice over Internet Protocol (VoIP) technologies. |
| 3.13.15 | Protect the authenticity of communications sessions. |
| 3.13.16 | Protect the confidentiality of CUI at rest. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
