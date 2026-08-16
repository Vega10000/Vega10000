#!/usr/bin/env python3
"""
POA&M burn-down reporter.

Turns a POA&M CSV into the status view a client's leadership will actually read:
what is overdue, what is due next, who owns it, and how many assessment points
are still tied up in open items.

Usage:
    python3 burndown.py
    python3 burndown.py poam.csv --asof 2026-09-01

Why this exists: POA&Ms die because nobody owns them and nothing forces a
review. A report that names an owner and a slip count turns the document from a
compliance artifact into a management tool. Run it monthly and send the output.
"""
import argparse, csv, os, sys
from collections import defaultdict
from datetime import date, datetime

OPEN_STATES = {"not started", "in progress"}


def parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None


def load_weights(path):
    if not path or not os.path.exists(path):
        return {}
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            return {r["id"]: int(r["weight"]) for r in csv.DictReader(fh)}
    except (KeyError, ValueError):
        return {}


def bar(done, total, width=30):
    if total == 0:
        return "-" * width
    filled = round(width * done / total)
    return "#" * filled + "." * (width - filled)


def main():
    ap = argparse.ArgumentParser(description="Report on POA&M progress.")
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("poam", nargs="?", default=os.path.join(here, "poam.csv"))
    ap.add_argument("--asof", help="report date, YYYY-MM-DD (default: today)")
    ap.add_argument("--controls", default=os.path.join(
        here, "..", "02-gap-assessment-scoring-model", "data",
        "nist-800-171-r2-controls.csv"))
    args = ap.parse_args()

    if args.asof and not parse_date(args.asof):
        sys.exit("error: --asof must be YYYY-MM-DD")
    asof = parse_date(args.asof) or date.today()

    with open(args.poam, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        sys.exit("error: POA&M has no rows")

    weights = load_weights(args.controls)
    overdue, upcoming, done, unowned, no_evidence = [], [], [], [], []
    by_owner = defaultdict(lambda: {"open": 0, "done": 0, "overdue": 0})
    by_risk = defaultdict(int)

    for r in rows:
        status = (r.get("status") or "").strip().lower()
        owner = (r.get("owner") or "").strip() or "UNASSIGNED"
        due = parse_date(r.get("milestone_due"))

        if status == "completed":
            done.append(r)
            by_owner[owner]["done"] += 1
            if not (r.get("evidence_of_closure") or "").strip():
                no_evidence.append(r)
        elif status in OPEN_STATES:
            by_owner[owner]["open"] += 1
            by_risk[(r.get("risk") or "Unspecified").strip()] += 1
            if owner == "UNASSIGNED":
                unowned.append(r)
            if due and due < asof:
                r["_days"] = (asof - due).days
                overdue.append(r)
                by_owner[owner]["overdue"] += 1
            elif due:
                r["_days"] = (due - asof).days
                upcoming.append(r)

    total, closed_n = len(rows), len(done)

    print("=" * 70)
    print(f"  POA&M BURN-DOWN  ·  as of {asof.isoformat()}")
    print("=" * 70)
    print(f"\n  [{bar(closed_n, total)}]  {closed_n}/{total} closed "
          f"({closed_n / total * 100:.0f}%)\n")

    if weights:
        open_ids = {(r.get("control_id") or "").strip() for r in rows
                    if (r.get("status") or "").strip().lower() in OPEN_STATES}
        recoverable = sum(weights.get(cid, 0) for cid in open_ids if cid in weights)
        print(f"  Assessment points tied up in open items: {recoverable}")
        print("  Closing every open item raises the score by that much.\n")

    if overdue:
        print(f"  OVERDUE - {len(overdue)} item(s)")
        for r in sorted(overdue, key=lambda x: -x["_days"]):
            print(f"    {r['item_id']:<9} {r['control_id']:<9} {r['_days']:>4}d late  "
                  f"{r['owner'] or 'UNASSIGNED':<12} {r['weakness'][:36]}")
        print()

    if upcoming:
        print(f"  DUE NEXT - {len(upcoming)} item(s)")
        for r in sorted(upcoming, key=lambda x: x["_days"])[:8]:
            print(f"    {r['item_id']:<9} {r['control_id']:<9} in {r['_days']:>3}d   "
                  f"{r['owner'] or 'UNASSIGNED':<12} {r['weakness'][:36]}")
        print()

    if by_risk:
        print("  OPEN BY RISK")
        for risk in ("High", "Medium", "Low", "Unspecified"):
            if by_risk.get(risk):
                print(f"    {risk:<12} {by_risk[risk]}")
        print()

    print("  BY OWNER")
    print(f"    {'OWNER':<14} {'OPEN':>4} {'OVERDUE':>8} {'CLOSED':>7}")
    for owner, s in sorted(by_owner.items(), key=lambda kv: -kv[1]["overdue"]):
        print(f"    {owner:<14} {s['open']:>4} {s['overdue']:>8} {s['done']:>7}")

    if unowned:
        print(f"\n  WARNING: {len(unowned)} open item(s) have no owner. An unowned")
        print("  POA&M item does not get done. Assign it before the next review.")
    if no_evidence:
        print(f"\n  WARNING: {len(no_evidence)} item(s) are Completed with no evidence")
        print("  of closure. An assessor will treat those as still open:")
        for r in no_evidence[:5]:
            print(f"    {r['item_id']} ({r['control_id']})")

    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
