#!/usr/bin/env python3
"""
Generates the 14-policy pack, one file per 800-171 family.

Design rule: policies are written to be READ BY EMPLOYEES, not only by
assessors. Most policy templates fail on implementation, not documentation --
staff never follow a document they cannot understand. So each policy states the
requirement, who owns it, and what a person actually has to do, in that order.
Control mappings live in an appendix so the body stays readable.

Run:  python3 projects/_generator/policies.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controls_data import FAMILIES, CONTROLS

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "05-policy-pack", "policies")

# purpose, staff-facing rules, owner-facing responsibilities
BODY = {
"3.1": ("Control who can reach company systems and the information in them, so that access is deliberate and reviewable rather than accumulated by accident.",
  ["Use only the account issued to you. Never share it, and never use someone else's.",
   "Lock your screen whenever you step away. Systems also lock on their own, but do not rely on that.",
   "Do not connect to company systems from a personal device unless it has been approved and enrolled.",
   "Connect through the VPN whenever you are working away from the office.",
   "If you can reach something you do not need for your job, report it rather than using it."],
  ["Access is granted by role, approved in writing by the requester's manager before provisioning.",
   "Administrators hold a separate privileged account, used only for administrative work.",
   "All access is reviewed quarterly; access no longer needed is removed within five business days.",
   "Remote access is permitted only through the managed access point, with multifactor authentication."]),
"3.2": ("Make sure everyone knows the risks their work creates and how to handle information correctly, because most incidents start with a person, not a machine.",
  ["Complete security awareness training when you join and every year after.",
   "Report anything that looks wrong immediately -- a strange email, an unexpected prompt, a door propped open.",
   "You will never be penalised for reporting something that turns out to be nothing.",
   "If you handle CUI, know what that means for the files you touch."],
  ["Awareness training is delivered at hire and annually, covering CUI handling, phishing, passwords, physical security, and reporting.",
   "Personnel with security duties receive additional role-specific training.",
   "Training includes insider-threat indicators and a reporting route that does not require going through one's own manager.",
   "Completion records are retained for three years."]),
"3.3": ("Keep a record of what happened on company systems, so that a question about who did what has an answer.",
  ["Your activity on company systems is logged. This is normal and applies to everyone.",
   "Do not attempt to disable, clear, or alter logging on any system.",
   "If you notice a system behaving oddly after a change, say so -- logs are more useful with context."],
  ["Logging is enabled on all systems in the CUI environment and forwarded to central collection.",
   "Logged events include logons, privilege use, account management, access to CUI locations, and policy changes.",
   "Logs are retained per the retention standard, protected from modification, and reviewed on the defined cadence.",
   "Only the security administrator group can change logging configuration."]),
"3.4": ("Keep systems in a known, deliberate state, so that a change is something we decided rather than something that happened.",
  ["Do not install software yourself. Request it and it will be installed for you.",
   "Do not change security settings on your machine, including firewall and antivirus.",
   "If you need something that is blocked, ask -- there is usually an approved way."],
  ["Documented baseline configurations exist for each system type and are enforced centrally.",
   "Changes are requested, security-impact assessed, approved, and logged before implementation.",
   "Systems are built with least functionality: only required roles, features, and applications.",
   "A hardware and software inventory is maintained and reconciled quarterly."]),
"3.5": ("Make sure people and devices are who they claim to be before they get access to anything.",
  ["Your password must be at least 14 characters. A passphrase is easier to remember and harder to break.",
   "Never reuse your work password anywhere else.",
   "Approve a multifactor prompt only when you triggered it. If one arrives unexpectedly, deny it and report it.",
   "Never store a password in a document, spreadsheet, or script. Use the password manager."],
  ["Every user has a unique identifier; shared accounts are prohibited.",
   "Multifactor authentication is required for all privileged access and all network access.",
   "Inactive accounts are disabled automatically after the defined period.",
   "Passwords are stored only as salted hashes and are never transmitted in clear text."]),
"3.6": ("Handle security incidents in a defined way, so that response is fast and consistent rather than improvised.",
  ["Report a suspected incident immediately through the published channel. Do not wait to be sure.",
   "Do not investigate on your own, and do not delete anything -- evidence matters.",
   "Do not discuss an incident outside the response team unless told to.",
   "If a device may be compromised, disconnect it from the network but leave it powered on."],
  ["The Incident Response Plan defines phases, roles, severity levels, and escalation.",
   "Incidents are recorded with a timeline and reported to the designated official.",
   "Cyber incidents affecting covered defense information are reported to DoD at dibnet.dod.mil within 72 hours.",
   "The response capability is tested at least annually and the plan updated from what the test finds."]),
"3.7": ("Make sure maintenance keeps systems healthy without becoming a way in.",
  ["Do not let anyone work on company equipment unless they have been authorised and, where required, escorted.",
   "Do not take equipment off site for repair without going through IT.",
   "Report equipment behaving strangely after servicing."],
  ["Maintenance is performed by authorised personnel on a documented schedule and recorded in the maintenance log.",
   "Equipment leaving for off-site maintenance is sanitised of CUI, or its storage media is removed and retained.",
   "Remote maintenance requires multifactor authentication and the session is terminated on completion.",
   "Maintenance personnel without CUI access authorisation are escorted throughout."]),
"3.8": ("Protect information on media -- disks, drives, and paper -- through its whole life, including disposal.",
  ["Store CUI in the approved locations only. Not on your desktop, not in personal cloud storage.",
   "Do not use USB drives unless issued and approved. Never plug in a drive you found.",
   "Lock away hard-copy CUI when you leave your desk.",
   "Do not put CUI in a regular bin. Use the shredder or the secure disposal bin."],
  ["Media containing CUI is physically controlled and securely stored, with access limited to authorised users.",
   "Media is marked with the CUI designation and applicable distribution limitations.",
   "Media is sanitised or destroyed to NIST SP 800-88 before disposal or reuse, and the disposal is logged.",
   "Media leaving controlled areas is encrypted and its custody tracked."]),
"3.9": ("Make sure the people who get access have been screened, and that access ends when employment does.",
  ["Expect a screening check before you receive access to systems holding CUI.",
   "Return all equipment, badges, and keys on your last day.",
   "If you change role, expect your access to change with it."],
  ["Personnel are screened before access to CUI systems is authorised, per the screening standard and any contract requirement.",
   "Offboarding disables all accounts, revokes physical access, and recovers equipment on the day of separation.",
   "Role changes trigger an access review so permissions match the new role and prior access is removed."]),
"3.10": ("Control who can physically reach systems and information, because physical access defeats most technical controls.",
  ["Wear your badge where it can be seen.",
   "Do not hold the door for someone you do not recognise, however awkward that feels.",
   "Escort your visitors the whole time they are here.",
   "Do not prop open doors to controlled areas."],
  ["Physical access to facilities and to areas housing CUI systems is limited to authorised personnel.",
   "Server and network equipment is kept in a locked room or locked rack.",
   "Visitors sign in, are badged, and are escorted in areas where CUI is processed or stored.",
   "Physical access logs are retained for a year and reviewed monthly."]),
"3.11": ("Understand what could go wrong before it does, and fix the things that matter most first.",
  ["Report anything that looks like a weakness, including in a process rather than a system.",
   "Do not delay a patch or reboot when asked -- that window is a deliberate risk decision.",
   "Do not install unapproved software; it arrives with its own vulnerabilities."],
  ["A documented risk assessment is performed annually and after significant change, feeding the risk register.",
   "Authenticated vulnerability scans run monthly and out-of-cycle when a significant vulnerability is announced.",
   "Remediation follows a risk-based schedule; anything not remediated in the window is risk-accepted in writing and tracked on the POA&M."]),
"3.12": ("Check that the controls we say we have are actually working, and track the ones that are not.",
  ["Answer assessment questions honestly. An accurate 'no' is more useful than an optimistic 'yes'.",
   "If a control gets in the way of your work, say so -- a control people route around is not working."],
  ["Security requirements are assessed at least annually against the DoD Assessment Methodology.",
   "Every deficiency is recorded on the POA&M with a named owner and a milestone date.",
   "The POA&M is reviewed monthly; items close only with evidence.",
   "The System Security Plan is reviewed annually and after significant change, under version control."]),
"3.13": ("Protect information as it moves and where it rests, and keep the boundary between our systems and everything else deliberate.",
  ["Send CUI only through approved channels. Not personal email, not consumer file-sharing.",
   "Check you are on the VPN before working with CUI remotely.",
   "Do not set up your own network equipment, wireless access point, or cloud service."],
  ["The external boundary is controlled by a deny-by-default firewall; internal segmentation separates the CUI environment.",
   "CUI is encrypted in transit and at rest using FIPS-validated cryptography.",
   "Split tunnelling is disabled; all remote traffic routes through organisational egress controls.",
   "Publicly accessible components sit in a separated subnetwork and hold no CUI."]),
"3.14": ("Keep systems free of malicious code and catch problems while they are still small.",
  ["Do not disable antivirus or endpoint protection.",
   "Install updates when prompted. Do not defer indefinitely.",
   "Do not open unexpected attachments or enable macros because a document asks you to.",
   "Report anything that looks like malware immediately, even if you think you closed it in time."],
  ["Endpoint protection is deployed on all systems, centrally managed, with real-time scanning enabled.",
   "Flaws are remediated on a risk-based schedule; exceptions are recorded on the POA&M.",
   "Security advisories are monitored, assessed for applicability, and actioned.",
   "Inbound and outbound traffic and endpoint telemetry are monitored for indicators of attack."]),
}

TEMPLATE = """# {name} Policy

| | |
|---|---|
| **Policy ID** | {pid} |
| **Owner** | [ROLE — e.g. Information Security Officer] |
| **Approved by** | [NAME, TITLE] |
| **Effective date** | [DATE] |
| **Review cycle** | Annually, and after any significant change |
| **Version** | 1.0 |

## 1. Purpose

{purpose}

## 2. Scope

This policy applies to all employees, contractors, and third parties who access
[ORGANISATION]'s information systems or handle Controlled Unclassified
Information (CUI), and to every system inside the CUI system boundary as defined
in the System Security Plan.

## 3. What you must do

If you use company systems, these apply to you:

{staff}

## 4. What the organisation does

{org}

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
{mapping}

---
*Template. Replace every [BRACKETED] value and delete anything that does not
describe what your organisation actually does. A policy stating a practice you
do not follow is a finding, not a control.*
"""

def main():
    os.makedirs(OUT, exist_ok=True)
    by_fam = {}
    for cid, req, _ in CONTROLS:
        by_fam.setdefault(".".join(cid.split(".")[:2]), []).append((cid, req))

    written = []
    for i, (pre, abbr, name, _n) in enumerate(FAMILIES, start=1):
        purpose, staff, org = BODY[pre]
        mapping = "\n".join(
            f"| {cid} | {req[:96]}{'...' if len(req) > 96 else ''} |"
            for cid, req in by_fam[pre])
        doc = TEMPLATE.format(
            name=name, pid=f"POL-{abbr}-{i:02d}", purpose=purpose,
            staff="\n".join(f"{n}. {s}" for n, s in enumerate(staff, 1)),
            org="\n".join(f"- {o}" for o in org),
            mapping=mapping)
        slug = name.lower().replace(" and ", "-").replace(" ", "-")
        path = os.path.join(OUT, f"{i:02d}-{slug}.md")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(doc)
        written.append(os.path.basename(path))
    return written

if __name__ == "__main__":
    for w in main():
        print("wrote", w)
