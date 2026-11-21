# Linear Programming, Simplex plan (specs/linear-programming-simplex.md section 2): how often a random problem gives textbook-looking tableaux, and how much designing the optimum first helps.
# Exact fractions, the textbook method (most negative column, smallest theta). Run: python3 scripts/lpSimplexNumbersStudy.py (about 1 minute). Chunk S0 of the plan turns this into a test.
import random, itertools, sys
from fractions import Fraction as F
from math import gcd

random.seed(2026)

def simplex(c, A, b, rule="most"):
    """maximise c.x s.t. A x <= b, x>=0 ; returns (status, iterations, tableaux list) with exact fractions"""
    m, n = len(A), len(c)
    # tableau rows: objective first. columns: x (n), slack (m), rhs
    T = [[F(-ci) for ci in c] + [F(0)] * m + [F(0)]]
    for i in range(m):
        T.append([F(a) for a in A[i]] + [F(1 if j == i else 0) for j in range(m)] + [F(b[i])])
    path = [ [r[:] for r in T] ]
    ties = False
    for it in range(30):
        obj = T[0][:-1]
        neg = [(v, j) for j, v in enumerate(obj) if v < 0]
        if not neg:
            return "opt", it, path, ties
        mv = min(v for v, j in neg)
        cols = [j for v, j in neg if v == mv]
        if len(cols) > 1:
            ties = True
        col = cols[0]
        ratios = [(T[i][-1] / T[i][col], i) for i in range(1, m + 1) if T[i][col] > 0]
        if not ratios:
            return "unbounded", it, path, ties
        mr = min(r for r, i in ratios)
        rows = [i for r, i in ratios if r == mr]
        if len(rows) > 1:
            ties = True
        row = rows[0]
        p = T[row][col]
        T[row] = [v / p for v in T[row]]
        for i in range(m + 1):
            if i != row and T[i][col] != 0:
                f = T[i][col]
                T[i] = [vi - f * vr for vi, vr in zip(T[i], T[row])]
        path.append([r[:] for r in T])
    return "cycle", 30, path, ties

def stats(path):
    maxden, maxnum, nonint = 1, 0, 0
    for T in path:
        for r in T:
            for v in r:
                maxden = max(maxden, v.denominator)
                maxnum = max(maxnum, abs(v.numerator))
                if v.denominator != 1:
                    nonint += 1
    return maxden, maxnum, nonint

def run(n, m, apool, cpool, bpool, N=60000, label=""):
    res = {"valid": 0, "den<=2": 0, "den<=3": 0, "den<=5": 0, "den<=6": 0, "den<=12": 0}
    res2 = {"valid": 0}
    for _ in range(N):
        A = [[random.choice(apool) for _ in range(n)] for _ in range(m)]
        c = [random.choice(cpool) for _ in range(n)]
        b = [random.choice(bpool) for _ in range(m)]
        # every variable must appear in some constraint with a positive coefficient (bounded)
        if any(all(A[i][j] == 0 for i in range(m)) for j in range(n)):
            continue
        st, it, path, ties = simplex(c, A, b)
        if st != "opt" or ties or it < 2:
            continue
        res["valid"] += 1
        md, mn, ni = stats(path)
        for k in (2, 3, 5, 6, 12):
            if md <= k:
                res[f"den<={k}"] += 1
        # last tableau all-integer variable values?
    v = res["valid"]
    print(f"{label:34s} valid(no ties, >=2 its)={v:6d}  " + "  ".join(f"{k}:{100*res[k]/N:5.2f}%" for k in res if k != "valid"))

pool_small = [0, 1, 1, 2, 2, 3, 3, 4, 5]
pool_text = list(range(1, 9))
cp = list(range(1, 10))
bp = [10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 50, 60, 72, 80, 90, 100, 120]
print("percent of ALL draws that give a textbook-looking solution path (max denominator over every tableau, no ties, at least 2 iterations)")
for (n, m) in [(2, 2), (2, 3), (3, 2), (3, 3)]:
    run(n, m, pool_text, cp, bp, label=f"{n} vars {m} constr  coeffs 1-8")
    run(n, m, pool_small, cp, bp, label=f"{n} vars {m} constr  coeffs 0-5")

print()
print("CONSTRUCTIVE: accept A only if every square minor of [A|I] (entries, 2x2, 3x3) has |det| <= D; b = multiple of lcm of the minors")
def minors(A, n, m):
    out = set()
    rows = range(m); cols = range(n)
    for k in range(1, min(n, m) + 1):
        for R in itertools.combinations(rows, k):
            for C in itertools.combinations(cols, k):
                sub = [[F(A[r][c]) for c in C] for r in R]
                # determinant
                def det(M):
                    if len(M) == 1: return M[0][0]
                    if len(M) == 2: return M[0][0]*M[1][1]-M[0][1]*M[1][0]
                    return sum((-1)**j * M[0][j] * det([row[:j]+row[j+1:] for row in M[1:]]) for j in range(len(M)))
                d = abs(det(sub))
                out.add(int(d))
    return out

def lcm(a, b): return a * b // gcd(a, b)

def run2(n, m, apool, D, N=40000, label=""):
    accA = 0; good = 0; its = {}; allint = 0; mx = []
    for _ in range(N):
        A = [[random.choice(apool) for _ in range(n)] for _ in range(m)]
        if any(all(A[i][j] == 0 for i in range(m)) for j in range(n)): continue
        ms = minors(A, n, m)
        if 0 in ms and False: pass
        nz = [x for x in ms if x > 0]
        if not nz or max(nz) > D: continue
        accA += 1
        L = 1
        for x in nz: L = lcm(L, x)
        c = [random.choice(cp) for _ in range(n)]
        b = [L * random.randint(1, 4) for _ in range(m)]
        st, it, path, ties = simplex(c, A, b)
        if st != "opt" or ties or it < 2: continue
        good += 1
        its[it] = its.get(it, 0) + 1
        md, mn, ni = stats(path)
        mx.append(md)
        if all(v.denominator == 1 for v in path[-1][0]): allint += 1
    print(f"{label:30s} A accepted {100*accA/N:5.1f}%  usable problems {100*good/N:5.2f}% of draws; iterations {dict(sorted(its.items()))}; max denominator seen {max(mx) if mx else 0}; objective row final all-integer {100*allint/max(good,1):.0f}%")

for D in (3, 4, 5, 6):
    print(f"-- D = {D}")
    for (n, m) in [(2, 2), (2, 3), (3, 3)]:
        run2(n, m, list(range(0, 8)), D, label=f"{n} vars {m} constr")

print()
print("DESIGNED OPTIMUM: choose the optimal vertex x* (whole numbers), which constraints are binding, a dual y (whole), then build b and c so that x* is the unique optimum")
def designed(n, m, apool):
    A = [[random.choice(apool) for _ in range(n)] for _ in range(m)]
    kx = random.randint(1, min(n, m))
    basicx = random.sample(range(n), kx)
    xs = [random.randint(1, 9) if j in basicx else 0 for j in range(n)]
    binding = random.sample(range(m), kx)
    b = []
    for i in range(m):
        v = sum(A[i][j] * xs[j] for j in range(n))
        b.append(v if i in binding else v + random.randint(1, 9))
    y = [random.randint(1, 4) if i in binding else 0 for i in range(m)]
    c = []
    for j in range(n):
        s = sum(y[i] * A[i][j] for i in range(m))
        if j in basicx:
            c.append(s)
        else:
            c.append(s - random.randint(1, 3))
    if any(ci < 1 for ci in c): return None
    if any(b[i] <= 0 for i in range(m)): return None
    return A, b, c, xs

def run3(n, m, apool, N=60000, label=""):
    stat = {"ok": 0, 3: 0, 5: 0, 6: 0, 12: 0}; its = {}; reach = 0
    for _ in range(N):
        d = designed(n, m, apool)
        if not d: continue
        A, b, c, xs = d
        st, it, path, ties = simplex(c, A, b)
        if st != "opt" or ties or it < 2: continue
        stat["ok"] += 1
        last = path[-1]
        md, mn, ni = stats(path)
        for k in (3, 5, 6, 12):
            if md <= k: stat[k] += 1
        its[it] = its.get(it, 0) + 1
    print(f"{label:28s} usable {100*stat['ok']/N:5.1f}%  den<=3 {100*stat[3]/N:5.2f}%  <=5 {100*stat[5]/N:5.2f}%  <=6 {100*stat[6]/N:5.2f}%  <=12 {100*stat[12]/N:5.2f}% of draws; iterations {dict(sorted(its.items()))}")

for (n, m) in [(2, 2), (2, 3), (3, 3)]:
    run3(n, m, [0, 1, 1, 2, 2, 3, 4, 5], label=f"{n} vars {m} constr (0-5)")
    run3(n, m, [0, 1, 2, 3], label=f"{n} vars {m} constr (0-3)")
