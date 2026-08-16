#!/usr/bin/env python3
"""
Scope and price calculator for CMMC / 800-171 engagements.

Turns intake answers into an effort estimate and a fee, so pricing comes out of
the answers instead of instinct. Under-scoping fixed-fee compliance work is the
fastest way to lose money on it.

Usage:
    python3 scope_calculator.py --preset small
    python3 scope_calculator.py --users 45 --assets 60 --sites 2 --cloud hybrid \
        --docs none --deadline 90 --service docs

Edit RATE and the multipliers to match your own market and speed. The numbers
shipped here are illustrative starting points, not market research.
"""
import argparse, sys

RATE = 150.0  # your effective hourly rate, USD

# Baseline hours by service, for a small, simple, single-site client.
BASE_HOURS = {
    "scoping":  {"label": "Scoping session + boundary definition", "hours": 12},
    "gap":      {"label": "Gap assessment (110 requirements)",     "hours": 44},
    "docs":     {"label": "SSP + POA&M + policy set",              "hours": 96},
    "full":     {"label": "Gap assessment + full documentation",   "hours": 132},
    "retainer": {"label": "Monthly readiness retainer",            "hours": 16},
}

PRESETS = {
    "small":  dict(users=15,  assets=25,  sites=1, cloud="onprem", docs="none",    deadline=180, ot=False, subs=0),
    "medium": dict(users=60,  assets=90,  sites=2, cloud="hybrid", docs="partial", deadline=120, ot=True,  subs=3),
    "large":  dict(users=200, assets=310, sites=4, cloud="hybrid", docs="partial", deadline=90,  ot=True,  subs=8),
}


def multipliers(a):
    """Each factor returns (multiplier, human-readable reason)."""
    m = []

    if a.assets <= 25:    m.append((1.00, f"{a.assets} assets — baseline"))
    elif a.assets <= 75:  m.append((1.35, f"{a.assets} assets — moderate estate"))
    elif a.assets <= 150: m.append((1.75, f"{a.assets} assets — large estate"))
    else:                 m.append((2.30, f"{a.assets} assets — very large estate"))

    if a.users > 100:  m.append((1.20, f"{a.users} users — access review and training effort"))
    elif a.users > 50: m.append((1.10, f"{a.users} users"))

    if a.sites > 1:
        m.append((1.0 + 0.15 * (a.sites - 1), f"{a.sites} sites — physical controls repeat per site"))

    m.append({
        "onprem": (1.00, "On-premises only"),
        "cloud":  (1.10, "Cloud — shared responsibility to document"),
        "hybrid": (1.30, "Hybrid — two environments and the boundary between them"),
    }[a.cloud])

    m.append({
        "none":     (1.20, "No existing documentation — starting from nothing"),
        "partial":  (1.00, "Some documentation exists"),
        "good":     (0.80, "Good documentation — mostly needs updating"),
    }[a.docs])

    if a.ot:
        m.append((1.25, "OT / specialised assets need individual risk treatment"))
    if a.subs > 5:
        m.append((1.15, f"{a.subs} subcontractors — flow-down to verify"))
    elif a.subs > 0:
        m.append((1.05, f"{a.subs} subcontractor(s)"))

    if a.deadline < 60:
        m.append((1.40, f"{a.deadline} days — rush, displaces other work"))
    elif a.deadline < 90:
        m.append((1.20, f"{a.deadline} days — compressed"))

    return m


def main():
    p = argparse.ArgumentParser(description="Estimate CMMC engagement scope and fee.")
    p.add_argument("--preset", choices=PRESETS)
    p.add_argument("--service", choices=BASE_HOURS, default="full")
    p.add_argument("--users", type=int, default=15)
    p.add_argument("--assets", type=int, default=25)
    p.add_argument("--sites", type=int, default=1)
    p.add_argument("--cloud", choices=["onprem", "cloud", "hybrid"], default="onprem")
    p.add_argument("--docs", choices=["none", "partial", "good"], default="none")
    p.add_argument("--deadline", type=int, default=180, help="days until assessment")
    p.add_argument("--ot", action="store_true", help="OT / specialised assets present")
    p.add_argument("--subs", type=int, default=0, help="subcontractors receiving CUI")
    p.add_argument("--rate", type=float, default=RATE)
    a = p.parse_args()

    if a.preset:
        for k, v in PRESETS[a.preset].items():
            setattr(a, k, v)

    for name, val in (("users", a.users), ("assets", a.assets), ("sites", a.sites)):
        if val < 1:
            sys.exit(f"error: --{name} must be at least 1")

    svc = BASE_HOURS[a.service]
    mults = multipliers(a)
    total_mult = 1.0
    for factor, _ in mults:
        total_mult *= factor

    hours = svc["hours"] * total_mult
    cost = hours * a.rate

    print("=" * 66)
    print(f"  SCOPE ESTIMATE — {svc['label']}")
    print("=" * 66)
    print(f"\n  {a.users} users · {a.assets} assets · {a.sites} site(s) · "
          f"{a.cloud} · docs: {a.docs}")
    print(f"  {a.deadline} days to assessment · "
          f"{'OT present' if a.ot else 'no OT'} · {a.subs} subcontractor(s)\n")

    print(f"  Base hours{'':<34}{svc['hours']:>8.0f}")
    print(f"  {'-' * 50}")
    for factor, reason in mults:
        sign = "+" if factor > 1 else ("-" if factor < 1 else " ")
        print(f"  {sign} {reason:<42} x{factor:.2f}")
    print(f"  {'-' * 50}")
    print(f"  Estimated hours{'':<29}{hours:>8.0f}")
    print(f"  Combined multiplier{'':<25}x{total_mult:>7.2f}\n")

    print(f"  At ${a.rate:,.0f}/hr{'':<32}${cost:>10,.0f}")

    low, high = cost * 0.85, cost * 1.25
    print(f"\n  QUOTE BAND         ${low:>9,.0f}  -  ${high:>9,.0f}")
    print(f"  Quote the top of the band. You will find work you did not price.")

    weeks = hours / 25  # billable hours per week on one engagement
    print(f"\n  Duration at 25 billable hrs/week: {weeks:.0f} weeks")
    if a.deadline / 7 < weeks:
        print(f"  WARNING: the {a.deadline}-day deadline needs {weeks:.0f} weeks of")
        print("  work. Either add resource, cut scope, or decline. Do not accept a")
        print("  date you cannot hit — a missed CMMC deadline costs the client a contract.")

    print(f"\n  Deposit at 40%:    ${cost * 0.4:>9,.0f}")
    print(f"  Balance on delivery: ${cost * 0.6:>9,.0f}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
