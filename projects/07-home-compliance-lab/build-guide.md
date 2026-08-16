# Lab Build Guide

Concrete steps. Assumes VirtualBox on a 16 GB machine; Proxmox works the same
way with better snapshots.

## 1. Firewall first

1. Download OPNsense or pfSense
2. New VM, 1 GB RAM, two network adapters: adapter 1 bridged (WAN), adapter 2 internal (LAN)
3. Install, assign interfaces, set the LAN to `10.10.10.1/24`
4. Reach the web UI from a VM on the internal network
5. Create VLANs 10 (CUI), 20 (business), 30 (guest/OT)
6. Firewall rules:
   - VLAN 20 → VLAN 10: **block**
   - VLAN 30 → anything internal: **block**
   - VLAN 10 → WAN: allow only what is needed
7. **Test each rule.** An untested rule is a belief, not a control.

## 2. Domain controller

1. Windows Server evaluation ISO from Microsoft
2. VM: 4 GB RAM, 60 GB disk, network on VLAN 10
3. Install, set a static IP `10.10.10.10`
4. Add roles: Active Directory Domain Services, DNS
5. Promote to DC, forest `lab.local`
6. Create OUs: `Engineering`, `Business`, `Service Accounts`
7. Create users: `jrivera` (engineer), `spatel` (reception), `admin-jr` (privileged)
8. Create share `\\DC-01\CUI` and put marked files in it
9. Set NTFS permissions so only Engineering can read it

## 3. Workstations

1. Windows 11 evaluation ISO
2. WS-01: 4 GB, VLAN 10, join domain, log in as `jrivera`
3. WS-02: 2 GB, VLAN 20, join domain, log in as `spatel`
4. From WS-02, try to reach `\\DC-01\CUI` — **it should fail.** If it succeeds,
   your segmentation is wrong. Fix it before continuing.

## 4. Scanner

1. Ubuntu Server VM, 4 GB, VLAN 10
2. Install Nessus Essentials (free, 16 IPs)
3. Create a domain scan account
4. Configure an authenticated scan against DC-01, WS-01, WS-02
5. Run it and confirm the report says credentials succeeded

## 5. Break it deliberately

Now make it realistic:

```
- Create local account "shopfloor" on WS-02, password never expires,
  and pretend three people use it
- Skip Windows Update on WS-01 for two cycles
- Add "spatel" to the local Administrators group on WS-02
- Create user "mjones", disable nothing, and treat them as having left
- Add a firewall rule allowing VLAN 20 -> VLAN 10 on port 445
  with no description
- Remove the password policy from the Business OU
- Grant Everyone read on a subfolder of the CUI share
```

Write down what you did. This list is your answer key.

## 6. Assess it

Run the full workflow: scope it (03), assess it (02), document it (01), track
it (04), fix the top items, reassess.

Compare your findings against the answer key. Anything you missed is a gap in
your own process — that is the most valuable output of this entire lab.

## 7. Snapshot

Snapshot every VM at "built and broken". You will want to reset to this state
repeatedly.

---

## Cost

Zero. Windows evaluations are 180 days and renewable; everything else is free
permanently. The only real cost is the RAM and about 20 hours.
