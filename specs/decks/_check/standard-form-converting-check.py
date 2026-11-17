"""Recompute every number in specs/decks/standard-form-converting.md by exact decimal arithmetic (not the generator's code).
Checks: each conversion is right; the coefficient is in [1, 10); no (digits, power) pair is used twice; the tempting wrong answers differ."""
from decimal import Decimal
import sys

# (id, direction, ordinary, coefficient, power)
ITEMS = [
  # hook (discussion only)
  ("hook-sun","toStd","150000000","1.5",8), ("hook-cell","toStd","0.000007","7",-6),
  ("hook-atom","toStd","0.00000000000000000000000000167","1.67",-27),
  # worked
  ("w-large","toStd","4700000","4.7",6), ("w-large-back","toOrd","630000","6.3",5),
  ("w-small","toStd","0.00058","5.8",-4), ("w-small-back","toOrd","0.016","1.6",-2),
  # whiteboards
  ("wb-L1","toStd","56000","5.6",4), ("wb-L2","toStd","8100000","8.1",6), ("wb-L3","toStd","270000000","2.7",8),
  ("wb-S1","toStd","0.0042","4.2",-3), ("wb-S2","toStd","0.000063","6.3",-5), ("wb-S3","toStd","0.00074","7.4",-4),
  # set A: large, to standard form
  ("A1","toStd","7000","7",3), ("A2","toStd","92000","9.2",4), ("A3","toStd","640000000","6.4",8),
  ("A4","toStd","358000","3.58",5), ("A5","toStd","2040000","2.04",6), ("A6","toStd","100000","1",5),
  # set B: large, to ordinary
  ("B1","toOrd","50000","5",4), ("B2","toOrd","3900000","3.9",6), ("B3","toOrd","7100","7.1",3),
  ("B4","toOrd","265000","2.65",5), ("B5","toOrd","40700000","4.07",7), ("B6","toOrd","648.2","6.482",2),
  # set C: small, to standard form
  ("C1","toStd","0.006","6",-3), ("C2","toStd","0.00091","9.1",-4), ("C3","toStd","0.000008","8",-6),
  ("C4","toStd","0.0364","3.64",-2), ("C5","toStd","0.00305","3.05",-3), ("C6","toStd","0.82","8.2",-1),
  # set D: small, to ordinary
  ("D1","toOrd","0.002","2",-3), ("D2","toOrd","0.059","5.9",-2), ("D3","toOrd","0.000083","8.3",-5),
  ("D4","toOrd","0.00145","1.45",-3), ("D5","toOrd","0.000602","6.02",-4), ("D6","toOrd","0.47","4.7",-1),
  # set E: mixed
  ("E1","toStd","56700000","5.67",7), ("E2","toOrd","0.00031","3.1",-4), ("E3","toStd","0.000046","4.6",-5),
  ("E4","toOrd","8040000","8.04",6), ("E5","toStd","940000","9.4",5), ("E6","toStd","0.0705","7.05",-2),
  # exit ticket
  ("X1","toStd","17000000","1.7",7), ("X2","toStd","0.00036","3.6",-4), ("X3","toOrd","0.0052","5.2",-3),
]
# stretch, in parts: (id, shown coefficient, shown power, coefficient, power)
PARTS = [("P1","24",5,"2.4",6), ("P2","0.7",4,"7",3), ("P3","365",3,"3.65",5), ("P4","0.052",-2,"5.2",-4), ("P5","480",-5,"4.8",-3)]

bad = 0
seen = {}
for i, d, o, c, p in ITEMS:
    v = Decimal(o)
    ok = Decimal(c).scaleb(p) == v and Decimal(1) <= Decimal(c) < Decimal(10)
    # independent route: adjusted() is the exponent of the leading digit
    ok = ok and v.adjusted() == p and v.scaleb(-p).normalize() == Decimal(c).normalize()
    if not ok: print("WRONG", i, o, c, p); bad += 1
    digits = c.replace(".", "").rstrip("0") or "0"
    key = (digits, p)
    if not i.startswith("hook") and key in seen: print("REPEATED", i, "with", seen[key]); bad += 1
    seen[key] = i
for i, sc, sp, c, p in PARTS:
    if Decimal(sc).scaleb(sp) != Decimal(c).scaleb(p): print("WRONG", i); bad += 1

# tempting wrong answers must differ from the right one
def zeros_power(o, p):          # power = number of zeros in the ordinary number (large) or after the point (small)
    s = o.rstrip("0") if "." in o and p < 0 else o
    return (len(o) - len(o.rstrip("0"))) if p > 0 else (len(o.split(".")[1]) - len(o.split(".")[1].lstrip("0")))
for i in ["A2","A4","A5","C2","C4","C5"]:
    _, _, o, c, p = next(t for t in ITEMS if t[0] == i)
    z = zeros_power(o, p)
    wrong = z if p > 0 else -z
    print(i, "zeros-count power", wrong, "vs right", p, "OK" if wrong != p else "SAME (not a trap)")
print("FAILED" if bad else "all conversions correct,", bad, "problems")
sys.exit(1 if bad else 0)
