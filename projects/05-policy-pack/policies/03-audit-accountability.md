# Audit and Accountability Policy

| | |
|---|---|
| **Policy ID** | POL-AU-03 |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

Keep a record of what happened on company systems, so that a question about who did what has an answer.

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

1. Your activity on company systems is logged. This is normal and applies to everyone.
2. Do not attempt to disable, clear, or alter logging on any system.
3. If you notice a system behaving oddly after a change, say so -- logs are more useful with context.

## 4. What the organisation does

- Logging is enabled on all systems in the CUI environment and forwarded to central collection.
- Logged events include logons, privilege use, account management, access to CUI locations, and policy changes.
- Logs are retained per the retention standard, protected from modification, and reviewed on the defined cadence.
- Only the security administrator group can change logging configuration.

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
| 3.3.1 | Create and retain system audit logs and records to the extent needed to enable the monitoring, a... |
| 3.3.2 | Ensure that the actions of individual system users can be uniquely traced to those users so they... |
| 3.3.3 | Review and update logged events. |
| 3.3.4 | Alert in the event of an audit logging process failure. |
| 3.3.5 | Correlate audit record review, analysis, and reporting processes for investigation and response ... |
| 3.3.6 | Provide audit record reduction and report generation to support on-demand analysis and reporting... |
| 3.3.7 | Provide a system capability that compares and synchronizes internal system clocks with an author... |
| 3.3.8 | Protect audit information and audit logging tools from unauthorized access, modification, and de... |
| 3.3.9 | Limit management of audit logging functionality to a subset of privileged users. |

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
