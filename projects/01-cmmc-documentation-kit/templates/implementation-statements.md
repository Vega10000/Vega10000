# Implementation statements — NIST SP 800-171 Rev. 2

All 110 security requirements, in order, each with a starter implementation
statement. Paste the relevant block into Section 6 of the SSP template.

## How to use this

Every statement below is a **starting point, not an answer**. Each one describes a
common, defensible implementation. Your job on an engagement is to read it against
what the organization actually does and rewrite it until it is true.

- Anything in `[SQUARE BRACKETS]` is a decision you must fill in. A delivered
  document still containing brackets is an unfinished document.
- If the organization does not do what the statement says, **change the statement**
  and open a POA&M item. Do not leave text that describes a control they do not have.
  An SSP that overstates implementation is a false statement to the government.
- Each statement should answer: who does it, how, how often, and how you would prove it.

## Status values

Use exactly these, so the SSP and the scoring model agree:

| Status | Meaning |
|---|---|
| `implemented` | Fully meets the requirement, with evidence available |
| `partial` | Some elements in place, gaps remain — must have a POA&M item |
| `not_implemented` | Not in place — must have a POA&M item |
| `not_applicable` | Requirement does not apply; justification is mandatory |

---

## 3.1 — Access Control (AC) · 22 requirements

### 3.1.1

**Requirement.** Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).

**Implementation.** All access to systems in the CUI environment requires a named, individually assigned account. Accounts are created only on approved written request from a manager and are provisioned by [ROLE]. Shared and generic accounts are prohibited. Device access is limited to assets on the approved inventory; unmanaged devices cannot join the network.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.2

**Requirement.** Limit system access to the types of transactions and functions that authorized users are permitted to execute.

**Implementation.** Access is granted through role-based groups rather than per-user permissions. Each role is documented with the systems, shares, and functions it permits. Users receive only the roles their job requires, approved by their manager and reviewed [QUARTERLY].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.3

**Requirement.** Control the flow of CUI in accordance with approved authorizations.

**Implementation.** CUI is confined to the defined system boundary. Firewall rules and share permissions prevent CUI from moving to out-of-scope systems. Egress paths that could carry CUI (email, file sharing, removable media) are restricted to approved, controlled services documented in the SSP.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.4

**Requirement.** Separate the duties of individuals to reduce the risk of malevolent activity without collusion.

**Implementation.** Security-relevant duties are divided so no single individual can act unchecked. [DESCRIBE THE SPLIT: e.g. the person who approves access requests is not the person who provisions them; the person who administers systems is not the sole reviewer of audit logs.] Where headcount prevents full separation, the compensating review is documented here.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.5

**Requirement.** Employ the principle of least privilege, including for specific security functions and privileged accounts.

**Implementation.** Users receive the minimum access needed for their role. Administrative rights are granted only to designated personnel and only on the systems they administer. Local administrator rights are removed from standard workstations. Privileged access is reviewed [QUARTERLY] and revoked when no longer required.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.6

**Requirement.** Use non-privileged accounts or roles when accessing nonsecurity functions.

**Implementation.** Administrators hold two accounts: a standard account for daily work (email, browsing, documents) and a separate privileged account used only for administrative tasks. Privileged accounts are technically prevented from accessing email and the internet.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.7

**Requirement.** Prevent non-privileged users from executing privileged functions and capture the execution of such functions in the audit logs.

**Implementation.** Privileged functions are restricted to members of the administrative groups; standard users are denied by policy and by configuration. Execution of privileged functions and all privilege-escalation events are logged and forwarded to [LOG SYSTEM] for review.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.8

**Requirement.** Limit unsuccessful logon attempts.

**Implementation.** Accounts lock after [N] consecutive failed logon attempts within [N] minutes and remain locked for [N] minutes or until an administrator unlocks them. The setting is enforced centrally through [GROUP POLICY / MDM] so it cannot be changed locally.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.9

**Requirement.** Provide privacy and security notices consistent with applicable CUI rules.

**Implementation.** An approved system use notification banner is displayed at logon on all systems in the CUI environment. The banner states that the system is for authorized use only, that activity is monitored, and that use constitutes consent to monitoring. Banner text is enforced centrally.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.10

**Requirement.** Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.

**Implementation.** Systems lock automatically after [15] minutes of inactivity and display a screen saver that conceals the previous screen contents. Re-authentication is required to resume. The setting is enforced centrally and users cannot disable it. Users are trained to lock manually when stepping away.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.11

**Requirement.** Terminate (automatically) a user session after a defined condition.

**Implementation.** User sessions terminate automatically after [DEFINED CONDITION: e.g. 30 minutes of inactivity for remote sessions, or at end of the defined maximum session length]. Remote and privileged sessions are terminated on the shorter timer.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.12

**Requirement.** Monitor and control remote access sessions.

**Implementation.** Remote access is permitted only through the [VPN / approved remote access solution]. All remote sessions are logged with user, source address, and duration, and those logs are reviewed [WEEKLY]. Remote access is enabled only for users with a documented business need.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.13

**Requirement.** Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.

**Implementation.** All remote access sessions are encrypted using [FIPS-VALIDATED MECHANISM, e.g. TLS 1.2+ / IPsec] as configured in [SOLUTION]. Unencrypted remote access protocols are blocked at the firewall.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.14

**Requirement.** Route remote access via managed access control points.

**Implementation.** All remote access is routed through a single managed concentrator at [LOCATION/DEVICE]. No system in the CUI environment accepts inbound remote sessions directly; the firewall denies such connections.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.15

**Requirement.** Authorize remote execution of privileged commands and remote access to security-relevant information.

**Implementation.** Remote execution of privileged commands is limited to named administrators and requires connection through the managed access point with multifactor authentication. Each authorization is documented and reviewed [QUARTERLY]. Remote access to security-relevant information (logs, configurations, security tooling) is restricted to the same group.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.16

**Requirement.** Authorize wireless access prior to allowing such connections.

**Implementation.** Wireless access is authorized in writing before a device is permitted to connect. Only devices on the approved inventory can join the corporate wireless network; all others are placed on an isolated guest network with no route to the CUI environment.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.17

**Requirement.** Protect wireless access using authentication and encryption.

**Implementation.** Corporate wireless uses [WPA2-Enterprise / WPA3-Enterprise] with [802.1X] authentication against [IDENTITY PROVIDER] and AES encryption. Pre-shared keys are not used on networks that carry CUI. Legacy protocols (WEP, WPA, TKIP) are disabled.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.18

**Requirement.** Control connection of mobile devices.

**Implementation.** Mobile devices connect only after enrollment in [MDM SOLUTION], which enforces encryption, screen lock, and remote wipe. Unenrolled devices cannot access CUI. The mobile device inventory is maintained by [ROLE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.19

**Requirement.** Encrypt CUI on mobile devices and mobile computing platforms.

**Implementation.** Full-disk encryption is enforced on all laptops and mobile devices via [BITLOCKER / FILEVAULT / MDM POLICY]. Encryption status is verified centrally, and devices reporting as unencrypted are blocked from the network until remediated.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.20

**Requirement.** Verify and control/limit connections to and use of external systems.

**Implementation.** Use of external systems (personal devices, third-party cloud services, partner networks) to store or process CUI is prohibited unless explicitly approved and documented. Approved external connections are listed in the SSP with the terms that govern them.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.21

**Requirement.** Limit use of portable storage devices on external systems.

**Implementation.** Organization-owned portable storage containing CUI may not be used on external systems. USB mass storage is [BLOCKED BY DEFAULT] through [GROUP POLICY / ENDPOINT CONTROL], with exceptions granted in writing and recorded.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.1.22

**Requirement.** Control CUI posted or processed on publicly accessible systems.

**Implementation.** CUI is prohibited on public-facing systems. Content destined for the public website or social media is reviewed and approved by [ROLE] before publication. Publicly accessible systems are reviewed [QUARTERLY] to confirm no CUI is present.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.2 — Awareness and Training (AT) · 3 requirements

### 3.2.1

**Requirement.** Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.

**Implementation.** All personnel complete security awareness training at hire and annually thereafter. Training covers CUI handling, phishing, password practices, physical security, and incident reporting. Completion is tracked by [ROLE] and records are retained for [3] years.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.2.2

**Requirement.** Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.

**Implementation.** Personnel with security responsibilities (administrators, incident responders, the security officer) receive role-specific training beyond general awareness, appropriate to their duties. Training is documented and refreshed annually.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.2.3

**Requirement.** Provide security awareness training on recognizing and reporting potential indicators of insider threat.

**Implementation.** Annual awareness training includes a module on insider threat indicators and the mechanism for reporting concerns. Reporting channels are stated in the training and do not require reporting through the individual's own management chain.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.3 — Audit and Accountability (AU) · 9 requirements

### 3.3.1

**Requirement.** Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.

**Implementation.** Audit logging is enabled on all systems in the CUI environment. Logged events include logon/logoff, privilege use, account management, object access to CUI locations, policy changes, and system events. Logs are forwarded to [LOG SYSTEM] and retained for [90 DAYS ONLINE / 1 YEAR ARCHIVED].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.2

**Requirement.** Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions.

**Implementation.** Every user has a unique individual account; shared accounts are prohibited. Administrators use named privileged accounts rather than built-in shared accounts. Audit records capture the acting user ID, so any action can be traced to one individual.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.3

**Requirement.** Review and update logged events.

**Implementation.** The list of logged event types is reviewed [ANNUALLY] and after any significant system change or incident, to confirm it still captures what is needed for investigation. Changes are approved by [ROLE] and recorded.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.4

**Requirement.** Alert in the event of an audit logging process failure.

**Implementation.** [LOG SYSTEM] generates an alert to [ROLE] when a log source stops reporting, when log storage approaches capacity, or when the logging service fails. Alerts are actioned within [DEFINED TIME].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.5

**Requirement.** Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.

**Implementation.** Logs from endpoints, servers, network devices, and cloud services are centralized in [LOG SYSTEM], which correlates events across sources. Correlated alerts are reviewed [DAILY/WEEKLY] by [ROLE] and escalated to the incident response process when warranted.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.6

**Requirement.** Provide audit record reduction and report generation to support on-demand analysis and reporting.

**Implementation.** [LOG SYSTEM] provides search, filtering, and reporting across retained audit records, allowing on-demand analysis without altering the original records.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.7

**Requirement.** Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.

**Implementation.** All systems synchronize time via NTP against [AUTHORITATIVE SOURCE, e.g. the domain controller, which syncs to time.nist.gov]. Time stamps in audit records use [UTC]. Synchronization failures are alerted.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.8

**Requirement.** Protect audit information and audit logging tools from unauthorized access, modification, and deletion.

**Implementation.** Audit records are forwarded off the originating host to [LOG SYSTEM], where access is restricted to [ROLE] and records are write-once for the retention period. Local log permissions prevent modification by standard users.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.3.9

**Requirement.** Limit management of audit logging functionality to a subset of privileged users.

**Implementation.** Only members of [SECURITY ADMIN GROUP] can configure logging, change retention, or manage the log platform. General system administrators can read logs but cannot alter logging configuration or delete records.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.4 — Configuration Management (CM) · 9 requirements

### 3.4.1

**Requirement.** Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.

**Implementation.** Documented baseline configurations exist for each system type in the CUI environment (workstation, server, network device). A hardware and software inventory is maintained in [INVENTORY TOOL/REGISTER] and reconciled [QUARTERLY]. Baselines are versioned and updated through the change process.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.2

**Requirement.** Establish and enforce security configuration settings for information technology products employed in organizational systems.

**Implementation.** Security settings are derived from [CIS BENCHMARKS / DISA STIGs] and enforced centrally via [GROUP POLICY / MDM / CONFIGURATION MANAGEMENT]. Deviations require documented approval. Compliance with the baseline is verified [QUARTERLY].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.3

**Requirement.** Track, review, approve or disapprove, and log changes to organizational systems.

**Implementation.** Changes to systems in the CUI environment are raised as change requests, reviewed and approved by [ROLE/CHANGE BOARD] before implementation, and recorded in [CHANGE LOG] with requester, approver, date, and description. Emergency changes are documented retroactively within [DEFINED TIME].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.4

**Requirement.** Analyze the security impact of changes prior to implementation.

**Implementation.** Each change request includes a security impact assessment covering the effect on the system boundary, CUI flow, and existing security requirements. Changes with material security impact are tested in [TEST ENVIRONMENT] before production.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.5

**Requirement.** Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.

**Implementation.** Only authorized administrators may implement approved changes. Logical restrictions are enforced through privileged group membership; physical restrictions through controlled access to server and network equipment areas. Change implementation is logged.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.6

**Requirement.** Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.

**Implementation.** Systems are built from a hardened baseline that installs only the roles, features, and applications required for their function. Unnecessary services, roles, and default applications are removed or disabled as part of the build.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.7

**Requirement.** Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.

**Implementation.** A list of permitted programs, ports, protocols, and services is documented and enforced. Host firewalls deny inbound traffic by default. Nonessential services are disabled in the baseline, and the permitted list is reviewed [ANNUALLY].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.8

**Requirement.** Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.

**Implementation.** [APPLICATION ALLOWLISTING via AppLocker / WDAC / equivalent] is enforced on systems in the CUI environment, permitting execution only of approved software. The approved software list is maintained by [ROLE] and changes follow the change process.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.4.9

**Requirement.** Control and monitor user-installed software.

**Implementation.** Standard users cannot install software; local administrator rights are removed. Software installation requests are approved by [ROLE] and installed by administrators. Installed software is monitored through [INVENTORY TOOL] and unauthorized software is investigated and removed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.5 — Identification and Authentication (IA) · 11 requirements

### 3.5.1

**Requirement.** Identify system users, processes acting on behalf of users, and devices.

**Implementation.** Each user is assigned a unique identifier in [IDENTITY PROVIDER]. Service and process accounts are individually named, documented, and tied to a responsible owner. Devices are identified by hostname and asset tag and recorded on the inventory.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.2

**Requirement.** Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.

**Implementation.** All users authenticate against [IDENTITY PROVIDER] before access is granted. Service accounts authenticate using managed credentials. Devices authenticate to the network using [802.1X / certificate / domain membership].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.3

**Requirement.** Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.

**Implementation.** Multifactor authentication is enforced for all privileged accounts (local and network) and for all network access by non-privileged accounts, using [MFA SOLUTION] with [FACTORS]. MFA cannot be bypassed; exceptions are not permitted.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.4

**Requirement.** Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.

**Implementation.** Network authentication uses replay-resistant mechanisms: [KERBEROS / TLS-PROTECTED AUTHENTICATION / TIME-BASED OR CHALLENGE-RESPONSE MFA]. Legacy protocols vulnerable to replay (LM, NTLMv1) are disabled.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.5

**Requirement.** Prevent reuse of identifiers for a defined period.

**Implementation.** User identifiers are never reused. Identifiers of departed personnel are retained in a disabled state and are not reissued to new users, preserving the audit trail.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.6

**Requirement.** Disable identifiers after a defined period of inactivity.

**Implementation.** Accounts inactive for [45] days are automatically disabled. A [MONTHLY] report of inactive accounts is reviewed by [ROLE], and accounts disabled for [90] days without justification are removed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.7

**Requirement.** Enforce a minimum password complexity and change of characters when new passwords are created.

**Implementation.** Password policy enforces a minimum length of [14] characters and complexity requirements, enforced centrally through [GROUP POLICY / IDENTITY PROVIDER]. New passwords must differ from the previous password by more than a single character.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.8

**Requirement.** Prohibit password reuse for a specified number of generations.

**Implementation.** Password history is enforced at [24] generations, preventing reuse of recent passwords. The setting is enforced centrally and cannot be overridden locally.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.9

**Requirement.** Allow temporary password use for system logons with an immediate change to a permanent password.

**Implementation.** Temporary passwords issued for new accounts or resets are unique per user, communicated through a verified channel, and flagged to require change at first logon.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.10

**Requirement.** Store and transmit only cryptographically-protected passwords.

**Implementation.** Passwords are stored only as salted cryptographic hashes by [IDENTITY PROVIDER] and are never stored in clear text. Authentication traffic is encrypted in transit. Storage of passwords in scripts, documents, or configuration files is prohibited; secrets are held in [PASSWORD MANAGER / SECRETS STORE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.5.11

**Requirement.** Obscure feedback of authentication information.

**Implementation.** Password entry is masked on all interfaces. Authentication failure messages do not reveal whether the username or the password was incorrect.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.6 — Incident Response (IR) · 3 requirements

### 3.6.1

**Requirement.** Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.

**Implementation.** A documented Incident Response Plan defines the phases of incident handling, the response team and their roles, severity definitions, and escalation paths. Contact details are maintained and the plan is available offline. Users are trained to report suspected incidents to [CHANNEL].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.6.2

**Requirement.** Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.

**Implementation.** Incidents are recorded in [TRACKING SYSTEM] with timeline, actions, and outcome, and reported to [DESIGNATED OFFICIAL]. Cyber incidents affecting covered defense information are reported to DoD via https://dibnet.dod.mil within 72 hours as required by DFARS 252.204-7012.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.6.3

**Requirement.** Test the organizational incident response capability.

**Implementation.** The incident response capability is tested at least [ANNUALLY] through a tabletop exercise or simulated incident. Results, gaps, and corrective actions are documented and folded back into the plan.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.7 — Maintenance (MA) · 6 requirements

### 3.7.1

**Requirement.** Perform maintenance on organizational systems.

**Implementation.** Scheduled maintenance (patching, firmware updates, hardware servicing) is performed on a documented cadence by authorized personnel and recorded in [MAINTENANCE LOG] with date, system, activity, and technician.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.7.2

**Requirement.** Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.

**Implementation.** Maintenance is performed only by authorized personnel using approved tools. Diagnostic and maintenance tools are inventoried and controlled; tools brought in by third parties are inspected and approved before use.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.7.3

**Requirement.** Ensure equipment removed for off-site maintenance is sanitized of any CUI.

**Implementation.** Equipment leaving the facility for maintenance or repair is sanitized of CUI beforehand using [METHOD], or the storage media is removed and retained. Sanitization is documented and verified by [ROLE] prior to release.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.7.4

**Requirement.** Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.

**Implementation.** Any media containing diagnostic or test programs is scanned for malicious code on an isolated system before use in the CUI environment. Media that cannot be scanned is not permitted.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.7.5

**Requirement.** Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.

**Implementation.** Remote maintenance sessions require multifactor authentication through the managed remote access solution. Sessions are monitored while active and terminated immediately on completion; the remote access account is disabled when not in use.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.7.6

**Requirement.** Supervise the maintenance activities of maintenance personnel without required access authorization.

**Implementation.** Maintenance personnel without authorization to access CUI are escorted and supervised by an authorized employee for the duration of their work. Supervision is recorded in the maintenance log.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.8 — Media Protection (MP) · 9 requirements

### 3.8.1

**Requirement.** Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.

**Implementation.** Digital and paper media containing CUI are stored in locked containers or controlled rooms accessible only to authorized personnel. Media is not left unattended in unsecured areas; a clean-desk practice applies to CUI in hard copy.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.2

**Requirement.** Limit access to CUI on system media to authorized users.

**Implementation.** Access to media containing CUI is limited to users with a documented need. Digital media access is enforced by file permissions; physical media is held in controlled storage with access limited to [ROLE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.3

**Requirement.** Sanitize or destroy system media containing CUI before disposal or release for reuse.

**Implementation.** Media containing CUI is sanitized or destroyed before disposal or reuse using methods consistent with NIST SP 800-88. Paper is cross-cut shredded. Destruction is recorded in [DISPOSAL LOG] with date, media, method, and person responsible.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.4

**Requirement.** Mark media with necessary CUI markings and distribution limitations.

**Implementation.** Media containing CUI is marked with the CUI designation and any applicable distribution limitations, in line with 32 CFR Part 2002 and the applicable contract. Marking is covered in annual awareness training.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.5

**Requirement.** Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.

**Implementation.** Media containing CUI transported outside controlled areas is logged out and in, is encrypted or otherwise protected, and remains in the custody of an authorized individual or an approved courier with tracking.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.6

**Requirement.** Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.

**Implementation.** Digital media containing CUI is encrypted with [FIPS-VALIDATED MECHANISM] before leaving a controlled area. Unencrypted media may only be transported under the alternative physical safeguards documented here.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.7

**Requirement.** Control the use of removable media on system components.

**Implementation.** Removable media use is [BLOCKED BY DEFAULT] through [ENDPOINT CONTROL]. Exceptions require written approval, are limited to organization-issued encrypted media, and are recorded.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.8

**Requirement.** Prohibit the use of portable storage devices when such devices have no identifiable owner.

**Implementation.** Portable storage devices without an identifiable owner are prohibited. Endpoint controls block unknown devices, and users are trained never to connect found or unattributed media.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.8.9

**Requirement.** Protect the confidentiality of backup CUI at storage locations.

**Implementation.** Backups containing CUI are encrypted at rest using [FIPS-VALIDATED MECHANISM] and stored at [LOCATION] with access restricted to [ROLE]. Restoration is tested [ANNUALLY] and offsite backup providers are covered by an agreement addressing CUI protection.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.9 — Personnel Security (PS) · 2 requirements

### 3.9.1

**Requirement.** Screen individuals prior to authorizing access to organizational systems containing CUI.

**Implementation.** Personnel are screened before being granted access to systems containing CUI, in accordance with [SCREENING STANDARD] and any contract-specific requirements. Screening completion is recorded by [HR/ROLE] before account provisioning.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.9.2

**Requirement.** Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.

**Implementation.** A documented offboarding process disables all accounts, revokes physical access, and recovers organization-issued equipment and media within [SAME DAY / DEFINED TIME] of separation. Transfers trigger an access review so permissions match the new role and prior access is removed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.10 — Physical Protection (PE) · 6 requirements

### 3.10.1

**Requirement.** Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.

**Implementation.** Physical access to facilities and to areas housing systems that process or store CUI is limited to authorized personnel through [ACCESS CONTROL MECHANISM]. Server and network equipment is in a locked room or locked rack with access limited to [ROLE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.10.2

**Requirement.** Protect and monitor the physical facility and support infrastructure for organizational systems.

**Implementation.** The facility and supporting infrastructure are protected by [LOCKS / ALARM / CAMERAS] and monitored during and outside business hours. Alarm and camera events are reviewed following any suspected physical security incident.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.10.3

**Requirement.** Escort visitors and monitor visitor activity.

**Implementation.** Visitors sign in, are issued a visitor badge, and are escorted by an employee at all times while in areas where CUI is processed or stored. Visitors are never left unattended in those areas.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.10.4

**Requirement.** Maintain audit logs of physical access.

**Implementation.** Physical access is logged through [BADGE SYSTEM / VISITOR LOG] recording name, date, time in and out, and purpose. Logs are retained for [1 YEAR] and reviewed by [ROLE] on a [MONTHLY] basis or following an incident.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.10.5

**Requirement.** Control and manage physical access devices.

**Implementation.** Keys, badges, and other physical access devices are inventoried and issued to named individuals by [ROLE]. Devices are recovered at separation, and locks or codes are changed when a device is lost or unrecoverable. The inventory is reconciled [ANNUALLY].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.10.6

**Requirement.** Enforce safeguarding measures for CUI at alternate work sites.

**Implementation.** Remote and alternate work sites are covered by a documented telework standard requiring encrypted organization-issued devices, VPN for access to CUI, a private workspace, locked storage for hard-copy CUI, and prohibition of shared or public networks without VPN.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.11 — Risk Assessment (RA) · 3 requirements

### 3.11.1

**Requirement.** Periodically assess the risk to organizational operations, organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.

**Implementation.** A documented risk assessment is performed [ANNUALLY] and after significant change, identifying threats, vulnerabilities, likelihood, and impact to CUI. Results are recorded in the risk register, briefed to leadership, and drive POA&M priorities.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.11.2

**Requirement.** Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.

**Implementation.** Authenticated vulnerability scans of all systems in the CUI environment are performed [MONTHLY] using [SCANNER], and out-of-cycle when a significant vulnerability is announced. Scan reports are retained and reviewed by [ROLE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.11.3

**Requirement.** Remediate vulnerabilities in accordance with risk assessments.

**Implementation.** Vulnerabilities are remediated on a risk-based schedule: [CRITICAL within 15 days, HIGH within 30, MEDIUM within 90]. Remediation is tracked to closure and verified by rescan. Vulnerabilities that cannot be remediated in the window are risk-accepted in writing by [ROLE] and tracked on the POA&M.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.12 — Security Assessment (CA) · 4 requirements

### 3.12.1

**Requirement.** Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.

**Implementation.** Security requirements are assessed at least [ANNUALLY] against the NIST SP 800-171 DoD Assessment Methodology. Assessment results, including the score and supporting evidence, are documented and retained.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.12.2

**Requirement.** Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.

**Implementation.** Every deficiency identified in assessment is recorded on the Plan of Action and Milestones with a named owner, remediation plan, and milestone date. The POA&M is reviewed [MONTHLY] and items are closed only with evidence.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.12.3

**Requirement.** Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.

**Implementation.** Continuous monitoring includes [MONTHLY] vulnerability scanning, [WEEKLY] log review, [QUARTERLY] access reviews, and [QUARTERLY] baseline configuration checks. Results are recorded and deviations raised through the POA&M.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.12.4

**Requirement.** Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.

**Implementation.** This System Security Plan documents the system boundary, environment of operation, implementation of each of the 110 security requirements, and connections to external systems. It is reviewed and updated [ANNUALLY] and after significant change, under version control with a documented revision history.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.13 — System and Communications Protection (SC) · 16 requirements

### 3.13.1

**Requirement.** Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.

**Implementation.** Communications are controlled at the external boundary by [FIREWALL] with a deny-by-default ruleset, and at key internal boundaries by [VLAN SEGMENTATION / INTERNAL FIREWALL] separating the CUI environment from the rest of the network. Boundary traffic is logged and reviewed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.2

**Requirement.** Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.

**Implementation.** Security is addressed in system design decisions: the CUI environment is segmented, least functionality and least privilege are applied at build time, and changes are subject to security impact analysis. [IF SOFTWARE IS DEVELOPED: secure development practices and code review apply.]

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.3

**Requirement.** Separate user functionality from system management functionality.

**Implementation.** Administrative interfaces are separated from user-facing functionality. Management interfaces are reachable only from [ADMIN NETWORK/VLAN] by privileged accounts and are not exposed to general users or the internet.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.4

**Requirement.** Prevent unauthorized and unintended information transfer via shared system resources.

**Implementation.** Systems are configured to clear shared resources between uses, using operating system defaults for memory and storage object reuse. Temporary files and virtual memory are protected by full-disk encryption, and shared storage uses per-user permissions.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.5

**Requirement.** Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.

**Implementation.** Publicly accessible components are placed in a DMZ separated from internal networks by firewall rules that deny direct inbound traffic to internal systems. No CUI resides on systems in the DMZ.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.6

**Requirement.** Deny network communications traffic by default and allow network communications traffic by exception.

**Implementation.** Perimeter and host firewalls deny all traffic by default; only explicitly approved flows are permitted. The ruleset is documented with business justification per rule and reviewed [ANNUALLY] to remove rules no longer needed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.7

**Requirement.** Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (split tunneling).

**Implementation.** Split tunneling is disabled on the VPN client; all traffic from connected remote devices is routed through the organization's network and egress controls while the tunnel is established. The setting is enforced by policy and cannot be changed by the user.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.8

**Requirement.** Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.

**Implementation.** CUI in transit is protected with [FIPS-VALIDATED CRYPTOGRAPHY]: TLS 1.2 or higher for web and email, encrypted VPN for remote access, and SFTP or equivalent for file transfer. Unencrypted transmission of CUI is prohibited.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.9

**Requirement.** Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.

**Implementation.** Network sessions are terminated at session end or after [DEFINED PERIOD] of inactivity. VPN and remote sessions disconnect after [30] minutes idle, enforced by the concentrator rather than the client.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.10

**Requirement.** Establish and manage cryptographic keys for cryptography employed in organizational systems.

**Implementation.** Cryptographic keys and certificates are generated, distributed, stored, rotated, and revoked under a documented key management practice. Keys are held in [KEY STORE / TPM / MANAGED SERVICE] with access limited to [ROLE]. Certificate expiry is monitored.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.11

**Requirement.** Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.

**Implementation.** Cryptographic modules used to protect CUI are FIPS 140-2 or 140-3 validated. [LIST MODULES AND CMVP CERTIFICATE NUMBERS.] FIPS mode is enabled where the platform requires it to operate in a validated configuration.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.12

**Requirement.** Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.

**Implementation.** Remote activation of cameras and microphones is disabled by policy. Collaboration software indicates clearly when a camera or microphone is active, and users are trained on physical camera covers and mute practice in areas where CUI is discussed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.13

**Requirement.** Control and monitor the use of mobile code.

**Implementation.** Mobile code (JavaScript, ActiveX, Java applets, macros) is controlled through browser and application policy. Office macros from the internet are blocked by default; exceptions require approval and are signed.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.14

**Requirement.** Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.

**Implementation.** VoIP use is limited to the approved [SOLUTION], configured with encryption for signalling and media, placed on a segmented VLAN, and monitored. Unapproved VoIP applications are blocked.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.15

**Requirement.** Protect the authenticity of communications sessions.

**Implementation.** Session authenticity is protected using TLS with server certificate validation, mutual authentication where supported, and session tokens that are invalidated at logout. Downgrade to unauthenticated protocols is blocked.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.13.16

**Requirement.** Protect the confidentiality of CUI at rest.

**Implementation.** CUI at rest is protected by full-disk encryption on endpoints and servers, and by [SERVICE-SIDE ENCRYPTION] in approved cloud storage, using FIPS-validated mechanisms. Encryption status is verified centrally.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

## 3.14 — System and Information Integrity (SI) · 7 requirements

### 3.14.1

**Requirement.** Identify, report, and correct system flaws in a timely manner.

**Implementation.** System flaws are identified through vendor advisories, vulnerability scanning, and monitoring. Patches are applied on a risk-based schedule: [CRITICAL within 15 days, HIGH within 30, others within 90]. Patch status is tracked and exceptions are recorded on the POA&M.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.2

**Requirement.** Provide protection from malicious code at designated locations within organizational systems.

**Implementation.** [ENDPOINT PROTECTION] is deployed on all workstations and servers in the CUI environment, with real-time protection enabled and centrally managed. Email is filtered for malicious attachments and links at the gateway. Coverage is verified centrally.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.3

**Requirement.** Monitor system security alerts and advisories and take action in response.

**Implementation.** [ROLE] monitors security advisories from CISA, vendors, and [OTHER SOURCES]. Relevant advisories are assessed for applicability, and action is taken through the patch or change process within [DEFINED TIME]. Assessment and action are recorded.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.4

**Requirement.** Update malicious code protection mechanisms when new releases are available.

**Implementation.** Malicious code protection signatures and engines update automatically at least [DAILY]. The management console reports update status, and endpoints failing to update are investigated.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.5

**Requirement.** Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.

**Implementation.** Real-time scanning is enabled on all endpoints for files downloaded, opened, or executed. Full system scans run [WEEKLY]. Scan results and detections are reported centrally and actioned by [ROLE].

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.6

**Requirement.** Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.

**Implementation.** Inbound and outbound traffic is monitored at the boundary by [FIREWALL/IDS], and endpoint telemetry is collected by [EDR]. Events are forwarded to [LOG SYSTEM] and reviewed [DAILY/WEEKLY]; detections are escalated to the incident response process.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________

### 3.14.7

**Requirement.** Identify unauthorized use of organizational systems.

**Implementation.** Unauthorized use is identified through review of authentication logs, alerting on anomalous logons (unusual hours, locations, or volumes), and periodic access reviews. Suspected unauthorized use is handled as an incident.

**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  
**Responsible role.** ______________________  
**Evidence.** ______________________
