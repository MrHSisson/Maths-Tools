"""Recompute every number in specs/decks/standard-form-converting.md by exact decimal arithmetic (not the generator's code).
Checks: each conversion is right and the coefficient is in [1, 10); each "in parts" number equals its answer; no (digits, power)
pair is used by two questions (worked examples and the hook may repeat each other); the number of zeros is not the power where
the plan says that trap is caught."""
from decimal import Decimal
import sys

# (id, direction, ordinary, coefficient, power)
ITEMS = [
  # hook (discussion) and worked examples (may repeat one another, never a question)
  ("hook-sun","toStd","150000000","1.5",8), ("hook-cell","toStd","0.000007","7",-6),
  ("hook-atom","toStd","0.00000000000000000000000000167","1.67",-27),
  ("w-1000","toStd","2000","2",3), ("w-chain","toStd","32000","3.2",4), ("w-chain-back","toOrd","32000","3.2",4),
  ("w-small1","toStd","0.003","3",-3), ("w-small2","toStd","0.00058","5.8",-4), ("w-small-back","toOrd","0.016","1.6",-2),
  # whiteboards: large to standard form (WL), back (WF), small to standard form (WS), back (WT), mixed (WM)
  ("WL1","toStd","60000","6",4), ("WL2","toStd","450000","4.5",5), ("WL3","toStd","91000","9.1",4),
  ("WL4","toStd","7300000","7.3",6), ("WL5","toStd","862000","8.62",5), ("WL6","toStd","3050000","3.05",6), ("WL7","toStd","100000","1",5),
  ("WF1","toOrd","90000","9",4), ("WF2","toOrd","5400","5.4",3), ("WF3","toOrd","2800000","2.8",6),
  ("WF4","toOrd","725000","7.25",5), ("WF5","toOrd","30600000","3.06",7), ("WF6","toOrd","834.6","8.346",2),
  ("WS1","toStd","0.0007","7",-4), ("WS2","toStd","0.025","2.5",-2), ("WS3","toStd","0.00046","4.6",-4),
  ("WS4","toStd","0.000019","1.9",-5), ("WS5","toStd","0.00802","8.02",-3), ("WS6","toStd","0.4","4",-1),
  ("WT1","toOrd","0.002","2",-3), ("WT2","toOrd","0.037","3.7",-2), ("WT3","toOrd","0.00092","9.2",-4),
  ("WT4","toOrd","0.00501","5.01",-3), ("WT5","toOrd","0.26","2.6",-1),
  ("WM1","toStd","83000000","8.3",7), ("WM2","toOrd","0.000045","4.5",-5), ("WM3","toStd","0.00061","6.1",-4),
  ("WM4","toOrd","7040000","7.04",6), ("WM5","toStd","540000","5.4",5),
  # worksheet, question 1: large to standard form (j to l are in parts, listed below)
  ("1a","toStd","4000","4",3), ("1b","toStd","70000","7",4), ("1c","toStd","53000","5.3",4), ("1d","toStd","620000","6.2",5),
  ("1e","toStd","18000000","1.8",7), ("1f","toStd","475000","4.75",5), ("1g","toStd","2900000000","2.9",9),
  ("1h","toStd","306000","3.06",5), ("1i","toStd","1000000","1",6),
  # question 2: large to ordinary
  ("2a","toOrd","30000","3",4), ("2b","toOrd","8000000","8",6), ("2c","toOrd","2400","2.4",3), ("2d","toOrd","670000","6.7",5),
  ("2e","toOrd","59000000","5.9",7), ("2f","toOrd","135000","1.35",5), ("2g","toOrd","40800","4.08",4),
  ("2h","toOrd","7620000","7.62",6), ("2i","toOrd","2500000000","2.5",9), ("2j","toOrd","327400","3.274",5),
  ("2k","toOrd","60050","6.005",4), ("2l","toOrd","918","9.18",2),
  # question 3: small to standard form (j to l are in parts)
  ("3a","toStd","0.0003","3",-4), ("3b","toStd","0.08","8",-2), ("3c","toStd","0.045","4.5",-2), ("3d","toStd","0.0092","9.2",-3),
  ("3e","toStd","0.0000063","6.3",-6), ("3f","toStd","0.0158","1.58",-2), ("3g","toStd","0.000407","4.07",-4),
  ("3h","toStd","0.0000835","8.35",-5), ("3i","toStd","0.3","3",-1),
  # question 4: small to ordinary
  ("4a","toOrd","0.005","5",-3), ("4b","toOrd","0.00007","7",-5), ("4c","toOrd","0.014","1.4",-2), ("4d","toOrd","0.00083","8.3",-4),
  ("4e","toOrd","0.0000036","3.6",-6), ("4f","toOrd","0.00625","6.25",-3), ("4g","toOrd","0.000049","4.9",-5),
  ("4h","toOrd","0.00207","2.07",-3), ("4i","toOrd","0.94","9.4",-1), ("4j","toOrd","0.05381","5.381",-2),
  ("4k","toOrd","0.001002","1.002",-3), ("4l","toOrd","0.00000077","7.7",-7),
]
# in parts: (id, shown number, shown power, coefficient, power)
PARTS = [
  ("WP1","50",6,"5",7), ("WP2","25",5,"2.5",6), ("WP3","640",2,"6.4",4), ("WP4","480",-5,"4.8",-3),
  ("WP5","0.9",7,"9",6), ("WP6","0.38",8,"3.8",7), ("WP7","0.052",-2,"5.2",-4),
  ("1j","36",4,"3.6",5), ("1k","810",3,"8.1",5), ("1l","0.74",8,"7.4",7),
  ("3j","750",-6,"7.5",-4), ("3k","0.6",-2,"6",-3), ("3l","0.081",-3,"8.1",-5),
]
EXEMPT = ("hook", "w-")
bad = 0
seen = {}
def claim(i, c, p):
    global bad
    digits = c.replace(".", "").rstrip("0") or "0"
    key = (digits, p)
    if not i.startswith(EXEMPT) and key in seen: print("REPEATED", i, "with", seen[key]); bad += 1
    if not i.startswith(EXEMPT): seen[key] = i
for i, d, o, c, p in ITEMS:
    v = Decimal(o)
    ok = Decimal(c).scaleb(p) == v and Decimal(1) <= Decimal(c) < Decimal(10) and v.adjusted() == p
    if not ok: print("WRONG", i, o, c, p); bad += 1
    claim(i, c, p)
for i, sc, sp, c, p in PARTS:
    if Decimal(sc).scaleb(sp) != Decimal(c).scaleb(p) or not (Decimal(1) <= Decimal(c) < Decimal(10)): print("WRONG", i); bad += 1
    if Decimal(1) <= Decimal(sc) < Decimal(10): print("NOT IN PARTS", i); bad += 1
    claim(i, c, p)

# the chain for a large number written as digits x 10^k, where the number's own zeros differ from the power: the trap "power = zeros"
def zeros_power(o):
    if "." in o: f = o.split(".")[1]; return -(len(f) - len(f.lstrip("0")))
    return len(o) - len(o.rstrip("0"))
caught = [i for i, d, o, c, p in ITEMS if d == "toStd" and not i.startswith(("hook", "w-")) and zeros_power(o) != p]
same = [i for i, d, o, c, p in ITEMS if d == "toStd" and not i.startswith(("hook", "w-")) and zeros_power(o) == p]
print("zeros-count power differs (trap caught):", " ".join(caught))
print("zeros-count power equals the answer (no trap):", " ".join(same))
print("FAILED" if bad else "all conversions correct,", bad, "problems;", len(ITEMS) + len(PARTS), "numbers checked")
sys.exit(1 if bad else 0)
