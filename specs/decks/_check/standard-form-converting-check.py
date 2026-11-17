"""Recompute every number in specs/decks/standard-form-converting.md and the deck built from it (standard-form.build.ts) by exact decimal
arithmetic, independently of the build script. The numbers live in standard-form-converting.json, which the build script also reads.
Checks: each conversion is right and the coefficient is in [1, 10); each "in parts" number equals its answer and really is outside 1 to 10;
no (digits, power) pair is used by two questions, and no question uses a hook or worked-example pair; which questions the
'power = number of zeros' trap is caught by; which fit the tool's place value grid."""
from decimal import Decimal
import json, os, sys

D = json.load(open(os.path.join(os.path.dirname(__file__), "standard-form-converting.json")))
HOOK_AND_WORKED, WORKED_PARTS, QUESTIONS, QUESTION_PARTS = D["hookAndWorked"], D["workedParts"], D["questions"], D["questionParts"]
bad = 0
def digits_of(c): return c.replace(".", "").rstrip("0") or "0"
def check(i, c, p, v):
    global bad
    if not (Decimal(1) <= Decimal(c) < Decimal(10) and Decimal(c).scaleb(p) == v and v.adjusted() == p):
        print("WRONG", i); bad += 1
used = {(digits_of(c), p): i for i, d, o, c, p in HOOK_AND_WORKED}
for i, d, o, c, p in HOOK_AND_WORKED: check(i, c, p, Decimal(o))
for i, sc, sp, c, p in WORKED_PARTS:
    if Decimal(sc).scaleb(sp) != Decimal(c).scaleb(p) or Decimal(1) <= Decimal(sc) < Decimal(10): print("WRONG", i); bad += 1
    used[(digits_of(c), p)] = i
seen = {}
def claim(i, c, p):
    global bad
    k = (digits_of(c), p)
    if k in used: print("USES A WORKED OR HOOK NUMBER:", i, "with", used[k]); bad += 1
    if k in seen: print("REPEATED", i, "with", seen[k]); bad += 1
    seen[k] = i
for i, d, o, c, p in QUESTIONS: check(i, c, p, Decimal(o)); claim(i, c, p)
for i, sc, sp, c, p in QUESTION_PARTS:
    if Decimal(sc).scaleb(sp) != Decimal(c).scaleb(p) or Decimal(1) <= Decimal(sc) < Decimal(10): print("WRONG", i); bad += 1
    claim(i, c, p)

def zeros_power(o):
    if "." in o: f = o.split(".")[1]; return -(len(f) - len(f.lstrip("0")))
    return len(o) - len(o.rstrip("0"))
std = [(i, o, p) for i, d, o, c, p in QUESTIONS if d == "toStd"]
caught = [i for i, o, p in std if zeros_power(o) != p]
same = [i for i, o, p in std if zeros_power(o) == p]
print(f"zeros-count power differs from the answer in {len(caught)} of {len(std)} to-standard-form questions; matches in:", " ".join(same))

# the tool's place value grid runs from 10^9 (billions) down to 10^-6 (millionths): which questions can show it?
def grid_fits(c, p):
    d = len(digits_of(c))
    return p <= 9 and p - (d - 1) >= -6
outside = [i for i, d, o, c, p in QUESTIONS if not grid_fits(c, p)]
print(f"outside the grid (10^9 to 10^-6), {len(outside)} of {len(QUESTIONS)} questions:", " ".join(outside))
print("FAILED" if bad else "all conversions correct,", bad, "problems;", len(QUESTIONS) + len(QUESTION_PARTS), "questions and", len(HOOK_AND_WORKED) + len(WORKED_PARTS), "worked or hook numbers checked")
sys.exit(1 if bad else 0)
