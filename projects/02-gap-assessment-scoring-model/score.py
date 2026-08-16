#!/usr/bin/env python3
"""
NIST SP 800-171 / SPRS scoring model.

Reads an assessment CSV, joins it to the control library, and prints a score
plus a remediation order ranked by points-per-unit-of-effort.

Usage:
    python3 score.py data/sample-assessment.csv
    python3 score.py my-client.csv --controls data/nist-800-171-r2-controls.csv
    python3 score.py my-client.csv --csv-out findings.csv

Assessment CSV columns:  id, status, evidence, notes
Statuses: implemented | partial | not_implemented | not_applicable

HOW THE SCORE WORKS
    Start at 110. Subtract the weight of every requirement not fully met.
    'partial' is scored as NOT met -- the DoD methodology has no partial credit
    except for two specific requirements, and assuming credit you have not
    earned is how a self-assessment becomes an inaccurate government
    submission. Where the official methodology does allow partial credit, set
    it explicitly in the controls CSV.

    'not_applicable' costs nothing but REQUIRES a written justification. An
    unjustified N/A is the single most common finding an assessor will push
    back on.

BEFORE CLIENT USE
    Verify every weight against the current DoD Assessment Methodology and set
    weight_verified=yes in the controls CSV. Until then this reports an
    INDICATIVE score, and says so.
"""
import argparse, csv, os, sys
from collections import defaultdict

VALID = {"implemented", "partial", "not_implemented", "not_applicable"}
MET = {"implemented", "not_applicable"}

# Rough remediation effort, used only to rank the fix order (not part of the score).
EFFORT = {
    "3.5.3": 3, "3.13.11": 5, "3.4.8": 5, "3.3.5": 4, "3.14.6": 4,
    "3.1.3": 3, "3.13.1": 3, "3.11.2": 2, "3.12.4": 3, "3.8.9": 2,
}
DEFAULT_EFFORT = 2


def read_controls(path):
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        sys.exit(f"error: {path} has no rows")
    out = {}
    for r in rows:
        try:
            r["weight"] = int(r["weight"])
        except (KeyError, ValueError):
            sys.exit(f"error: bad or missing weight for {r.get('id','?')} in {path}")
        out[r["id"]] = r
    return out


def read_assessment(path, controls):
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    seen, problems = {}, []
    for i, r in enumerate(rows, start=2):
        cid = (r.get("id") or "").strip()
        status = (r.get("status") or "").strip().lower()
        if not cid:
            continue
        if cid not in controls:
            problems.append(f"line {i}: unknown requirement id {cid!r}")
            continue
        if status not in VALID:
            problems.append(f"line {i}: {cid} has invalid status {status!r}")
            continue
        if cid in seen:
            problems.append(f"line {i}: duplicate entry for {cid}")
            continue
        seen[cid] = {"status": status,
                     "evidence": (r.get("evidence") or "").strip(),
                     "notes": (r.get("notes") or "").strip()}
    missing = [c for c in controls if c not in seen]
    return seen, problems, missing


def main():
    ap = argparse.ArgumentParser(description="Score a NIST SP 800-171 assessment.")
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("assessment")
    ap.add_argument("--controls", default=os.path.join(here, "data", "nist-800-171-r2-controls.csv"))
    ap.add_argument("--csv-out", help="write the ranked findings to this path")
    args = ap.parse_args()

    controls = read_controls(args.controls)
    assessed, problems, missing = read_assessment(args.assessment, controls)

    unverified = sum(1 for c in controls.values() if c.get("weight_verified", "no") != "yes")

    print("=" * 68)
    print("  NIST SP 800-171 Rev. 2 ASSESSMENT SCORE")
    print("=" * 68)

    if problems:
        print("\nDATA PROBLEMS (these rows were not scored):")
        for p in problems[:15]:
            print("  -", p)
        if len(problems) > 15:
            print(f"  ... and {len(problems)-15} more")
    if missing:
        print(f"\nNOT ASSESSED: {len(missing)} requirements have no row and are")
        print("counted as NOT MET. An incomplete assessment is not a passing one.")
        print("  " + ", ".join(missing[:12]) + (" ..." if len(missing) > 12 else ""))

    score, deductions, counts = 110, [], defaultdict(int)
    na_no_justification = []

    for cid, ctl in controls.items():
        entry = assessed.get(cid)
        status = entry["status"] if entry else "not_implemented"
        counts[status] += 1
        if status == "not_applicable" and entry and not entry["notes"]:
            na_no_justification.append(cid)
        if status not in MET:
            score -= ctl["weight"]
            deductions.append({
                "id": cid, "family": ctl["family_name"], "status": status,
                "weight": ctl["weight"], "effort": EFFORT.get(cid, DEFAULT_EFFORT),
                "requirement": ctl["requirement"],
            })

    total = len(controls)
    met = counts["implemented"] + counts["not_applicable"]

    print(f"\n  SCORE: {score} out of 110")
    print(f"  {'(INDICATIVE — weights unverified)' if unverified else '(weights verified)'}")
    print(f"\n  implemented      {counts['implemented']:3}")
    print(f"  partial          {counts['partial']:3}   scored as NOT met")
    print(f"  not implemented  {counts['not_implemented']:3}")
    print(f"  not applicable   {counts['not_applicable']:3}")
    print(f"  {'-'*30}")
    print(f"  met              {met:3} of {total}   ({met/total*100:.0f}%)")

    if na_no_justification:
        print(f"\n  WARNING: {len(na_no_justification)} 'not_applicable' entries have no")
        print("  justification in the notes column. Assessors challenge these first.")
        print("  " + ", ".join(na_no_justification[:10]))

    if unverified:
        print(f"\n  WARNING: {unverified} of {total} weights are unverified (all defaulted")
        print("  to 5). Set them from the current DoD Assessment Methodology and mark")
        print("  weight_verified=yes before giving this number to a client.")

    # Remediation order: most points recovered per unit of effort.
    deductions.sort(key=lambda d: (-(d["weight"] / d["effort"]), d["id"]))
    print("\n" + "=" * 68)
    print("  REMEDIATION ORDER — cheapest route to a higher score first")
    print("=" * 68)
    print(f"  {'#':>3}  {'REQ':<9} {'PTS':>3} {'EFF':>3} {'VALUE':>5}  REQUIREMENT")
    running = score
    for i, d in enumerate(deductions[:20], 1):
        running += d["weight"]
        print(f"  {i:>3}. {d['id']:<9} {d['weight']:>3} {d['effort']:>3} "
              f"{d['weight']/d['effort']:>5.1f}  {d['requirement'][:52]}")
    if deductions:
        top = deductions[:10]
        print(f"\n  Closing the top 10 moves the score from {score} to "
              f"{score + sum(d['weight'] for d in top)}.")
    else:
        print("  Nothing outstanding — every requirement is met.")

    if args.csv_out:
        with open(args.csv_out, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=["id", "family", "status", "weight",
                                               "effort", "requirement"])
            w.writeheader()
            w.writerows(deductions)
        print(f"\n  findings written to {args.csv_out}")

    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
