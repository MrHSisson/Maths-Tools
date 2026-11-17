"""Recompute every number in specs/decks/standard-form-converting.md by exact decimal arithmetic (not the generator's code).
Checks: each conversion is right and the coefficient is in [1, 10); each "in parts" number equals its answer and really is
outside 1 to 10; no (digits, power) pair is used by two questions, and no question uses a hook or worked-example pair;
and which questions the 'power = number of zeros' trap is caught by."""
from decimal import Decimal
import sys

# (id, direction, ordinary, coefficient, power)
HOOK_AND_WORKED = [
  ("hook-sun","toStd","150000000","1.5",8), ("hook-cell","toStd","0.000007","7",-6),
  ("hook-atom","toStd","0.00000000000000000000000000167","1.67",-27),
  ("w-1000","toStd","2000","2",3), ("w-chain","toStd","32000","3.2",4), ("w-chain-back","toOrd","32000","3.2",4),
  ("w-0.02","toStd","0.02","2",-2), ("w-0.35","toStd","0.35","3.5",-1), ("w-0.00058","toStd","0.00058","5.8",-4),
  ("w-small-back","toOrd","0.016","1.6",-2), ("w-small-back2","toOrd","0.0037","3.7",-3),
]
# in parts, worked: (id, shown number, shown power, coefficient, power)
WORKED_PARTS = [("w-320","320",2,"3.2",4), ("w-32","32",3,"3.2",4), ("w-0.8","0.8",3,"8",2)]

QUESTIONS = [
  # WL: large to standard form
  ("WL1","toStd","60000","6",4), ("WL2","toStd","5000000","5",6), ("WL3","toStd","45000","4.5",4), ("WL4","toStd","380000","3.8",5),
  ("WL5","toStd","7200000","7.2",6), ("WL6","toStd","91000000","9.1",7), ("WL7","toStd","536000","5.36",5),
  ("WL8","toStd","2840000","2.84",6), ("WL9","toStd","4070000","4.07",6), ("WL10","toStd","100000000","1",8),
  # WF: large to ordinary
  ("WF1","toOrd","700000","7",5), ("WF2","toOrd","40000000","4",7), ("WF3","toOrd","3500","3.5",3), ("WF4","toOrd","620000","6.2",5),
  ("WF5","toOrd","89000000","8.9",7), ("WF6","toOrd","14600","1.46",4), ("WF7","toOrd","5080000","5.08",6),
  ("WF8","toOrd","931700","9.317",5), ("WF9","toOrd","648.2","6.482",2),
  # WS: small to standard form
  ("WS1","toStd","0.7","7",-1), ("WS2","toStd","0.09","9",-2), ("WS3","toStd","0.0004","4",-4), ("WS4","toStd","0.38","3.8",-1),
  ("WS5","toStd","0.0062","6.2",-3), ("WS6","toStd","0.00083","8.3",-4), ("WS7","toStd","0.000071","7.1",-5),
  ("WS8","toStd","0.0258","2.58",-2), ("WS9","toStd","0.000419","4.19",-4), ("WS10","toStd","0.00306","3.06",-3),
  ("WS11","toStd","0.0000052","5.2",-6), ("WS12","toStd","0.1","1",-1),
  # WT: small to ordinary
  ("WT1","toOrd","0.03","3",-2), ("WT2","toOrd","0.0008","8",-4), ("WT3","toOrd","0.0025","2.5",-3), ("WT4","toOrd","0.061","6.1",-2),
  ("WT5","toOrd","0.00094","9.4",-4), ("WT6","toOrd","0.000017","1.7",-5), ("WT7","toOrd","0.00436","4.36",-3),
  ("WT8","toOrd","0.000705","7.05",-4), ("WT9","toOrd","0.59","5.9",-1), ("WT10","toOrd","0.0208","2.08",-2),
  # WM: mixed
  ("WM1","toStd","28000000","2.8",7), ("WM2","toStd","0.000046","4.6",-5), ("WM3","toOrd","3300000","3.3",6), ("WM4","toOrd","0.0081","8.1",-3),
  ("WM5","toStd","0.0705","7.05",-2), ("WM6","toStd","640000","6.4",5), ("WM7","toOrd","57200","5.72",4), ("WM8","toStd","0.0000093","9.3",-6),
  ("WM9","toOrd","0.049","4.9",-2), ("WM10","toStd","710000000","7.1",8),
  # worksheet 1: large to standard form; 2: large to ordinary; 3: small to standard form; 4: small to ordinary
  ("1a","toStd","4000","4",3), ("1b","toStd","70000","7",4), ("1c","toStd","53000","5.3",4), ("1d","toStd","920000","9.2",5),
  ("1e","toStd","18000000","1.8",7), ("1f","toStd","475000","4.75",5), ("1g","toStd","2900000000","2.9",9), ("1h","toStd","306000","3.06",5),
  ("1i","toStd","1000000","1",6), ("1j","toStd","1280000","1.28",6), ("1k","toStd","90700000","9.07",7), ("1l","toStd","6150000","6.15",6),
  ("2a","toOrd","30000","3",4), ("2b","toOrd","8000000","8",6), ("2c","toOrd","2400","2.4",3), ("2d","toOrd","670000","6.7",5),
  ("2e","toOrd","59000000","5.9",7), ("2f","toOrd","135000","1.35",5), ("2g","toOrd","40800","4.08",4), ("2h","toOrd","7620000","7.62",6),
  ("2i","toOrd","2500000000","2.5",9), ("2j","toOrd","327400","3.274",5), ("2k","toOrd","60050","6.005",4), ("2l","toOrd","918","9.18",2),
  ("3a","toStd","0.0003","3",-4), ("3b","toStd","0.08","8",-2), ("3c","toStd","0.045","4.5",-2), ("3d","toStd","0.0092","9.2",-3),
  ("3e","toStd","0.0000063","6.3",-6), ("3f","toStd","0.0158","1.58",-2), ("3g","toStd","0.000407","4.07",-4), ("3h","toStd","0.0000835","8.35",-5),
  ("3i","toStd","0.3","3",-1), ("3j","toStd","0.00725","7.25",-3), ("3k","toStd","0.0000604","6.04",-5), ("3l","toStd","0.0013","1.3",-3),
  ("4a","toOrd","0.005","5",-3), ("4b","toOrd","0.00007","7",-5), ("4c","toOrd","0.014","1.4",-2), ("4d","toOrd","0.00027","2.7",-4),
  ("4e","toOrd","0.0000036","3.6",-6), ("4f","toOrd","0.00625","6.25",-3), ("4g","toOrd","0.000049","4.9",-5), ("4h","toOrd","0.00207","2.07",-3),
  ("4i","toOrd","0.94","9.4",-1), ("4j","toOrd","0.05381","5.381",-2), ("4k","toOrd","0.001002","1.002",-3), ("4l","toOrd","0.00000077","7.7",-7),
]
# in parts, whiteboards only (large: a coefficient too big; small: too big with a negative power, or too small)
QUESTION_PARTS = [
  ("WPL1","40",3,"4",4), ("WPL2","15",4,"1.5",5), ("WPL3","62",7,"6.2",8), ("WPL4","240",2,"2.4",4), ("WPL5","900",5,"9",7),
  ("WPL6","735",3,"7.35",5), ("WPL7","1600",4,"1.6",7), ("WPL8","4080",2,"4.08",5),
  ("WPS1","70",-4,"7",-3), ("WPS2","74",-4,"7.4",-3), ("WPS3","390",-6,"3.9",-4), ("WPS4","125",-4,"1.25",-2),
  ("WPS5","0.6",-3,"6",-4), ("WPS6","0.9",7,"9",6), ("WPS7","0.38",8,"3.8",7), ("WPS8","0.047",-2,"4.7",-4),
]
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
print("FAILED" if bad else "all conversions correct,", bad, "problems;", len(QUESTIONS) + len(QUESTION_PARTS), "questions and", len(HOOK_AND_WORKED) + len(WORKED_PARTS), "worked or hook numbers checked")
sys.exit(1 if bad else 0)
