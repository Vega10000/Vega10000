#!/usr/bin/env python3
"""
Builds the control-derived deliverables from controls_data.py:

  02-gap-assessment-scoring-model/data/nist-800-171-r2-controls.csv
  02-gap-assessment-scoring-model/data/sample-assessment.csv
  01-cmmc-documentation-kit/templates/implementation-statements.md

Run from the repo root:  python3 projects/_generator/generate.py
"""
import csv, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controls_data import FAMILIES, CONTROLS

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FAM_BY_PREFIX = {f[0]: f for f in FAMILIES}

def family_of(cid):
    return FAM_BY_PREFIX[".".join(cid.split(".")[:2])]

# ---------------------------------------------------------------------------
# DoD Assessment Methodology weights.
#
# The DoD Assessment Methodology assigns each requirement 5, 3, or 1 points,
# subtracted from a starting score of 110. This file ships every requirement at
# the most common value (5) and flags them unverified, because publishing
# guessed weights would produce a wrong SPRS score for a client.
#
# BEFORE ANY CLIENT USE: open the current "NIST SP 800-171 DoD Assessment
# Methodology" PDF from the DoD CIO / DIBCAC site, set the weight column from
# the official table, and change weight_verified to "yes". score.py warns
# loudly until you do.
# ---------------------------------------------------------------------------
DEFAULT_WEIGHT = 5

def build_controls_csv():
    path = os.path.join(ROOT, "02-gap-assessment-scoring-model", "data", "nist-800-171-r2-controls.csv")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "family_prefix", "family_abbr", "family_name",
                    "requirement", "weight", "weight_verified"])
        for cid, req, _ in CONTROLS:
            pre, abbr, name, _n = family_of(cid)
            w.writerow([cid, pre, abbr, name, req, DEFAULT_WEIGHT, "no"])
    return path

def build_sample_assessment():
    """A worked example so score.py can be run the moment the repo is cloned."""
    path = os.path.join(ROOT, "02-gap-assessment-scoring-model", "data", "sample-assessment.csv")
    rng = random.Random(11)   # fixed seed: the sample is stable across regens
    statuses = ["implemented"] * 7 + ["partial", "not_implemented", "not_applicable"]
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "status", "evidence", "notes"])
        for cid, _req, _stmt in CONTROLS:
            s = rng.choice(statuses)
            ev = "" if s in ("not_implemented",) else f"see evidence/{cid}/"
            w.writerow([cid, s, ev, ""])
    return path

def build_implementation_statements():
    path = os.path.join(ROOT, "01-cmmc-documentation-kit", "templates", "implementation-statements.md")
    lines = []
    A = lines.append
    A("# Implementation statements — NIST SP 800-171 Rev. 2")
    A("")
    A("All 110 security requirements, in order, each with a starter implementation")
    A("statement. Paste the relevant block into Section 6 of the SSP template.")
    A("")
    A("## How to use this")
    A("")
    A("Every statement below is a **starting point, not an answer**. Each one describes a")
    A("common, defensible implementation. Your job on an engagement is to read it against")
    A("what the organization actually does and rewrite it until it is true.")
    A("")
    A("- Anything in `[SQUARE BRACKETS]` is a decision you must fill in. A delivered")
    A("  document still containing brackets is an unfinished document.")
    A("- If the organization does not do what the statement says, **change the statement**")
    A("  and open a POA&M item. Do not leave text that describes a control they do not have.")
    A("  An SSP that overstates implementation is a false statement to the government.")
    A("- Each statement should answer: who does it, how, how often, and how you would prove it.")
    A("")
    A("## Status values")
    A("")
    A("Use exactly these, so the SSP and the scoring model agree:")
    A("")
    A("| Status | Meaning |")
    A("|---|---|")
    A("| `implemented` | Fully meets the requirement, with evidence available |")
    A("| `partial` | Some elements in place, gaps remain — must have a POA&M item |")
    A("| `not_implemented` | Not in place — must have a POA&M item |")
    A("| `not_applicable` | Requirement does not apply; justification is mandatory |")
    A("")
    A("---")
    A("")
    current = None
    for cid, req, stmt in CONTROLS:
        pre, abbr, name, count = family_of(cid)
        if pre != current:
            current = pre
            A(f"## {pre} — {name} ({abbr}) · {count} requirements")
            A("")
        A(f"### {cid}")
        A("")
        A(f"**Requirement.** {req}")
        A("")
        A(f"**Implementation.** {stmt}")
        A("")
        A("**Status.** `implemented` / `partial` / `not_implemented` / `not_applicable`  ")
        A("**Responsible role.** ______________________  ")
        A("**Evidence.** ______________________")
        A("")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return path

if __name__ == "__main__":
    for p in (build_controls_csv(), build_sample_assessment(), build_implementation_statements()):
        print("wrote", os.path.relpath(p, ROOT))
    print(f"{len(CONTROLS)} requirements across {len(FAMILIES)} families")
