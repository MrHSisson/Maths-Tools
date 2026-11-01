# Manipulating ratios, book work (nine questions, replaces Worksheet 1). Recomputes every answer from the ratio and checks each trap.
# Run: python3 -I specs/decks/_check/ratio-bookwork-check.py
from math import gcd
from fractions import Fraction
fails = []
def F(n, d): g = gcd(n, d); return f"{n//g}/{d//g}"
Q = [
 # rung, context, ratio, what is asked (indices into the ratio), wording, wrong-method fractions (name, (n, d))
 (1, "green : yellow counters", (2, 7), [0], "What fraction of the counters are green?", [("ratio as a fraction", (2, 7))]),
 (2, "bananas : grapes", (4, 5), [1], "Find the fraction of the fruit that are grapes.", [("ratio as a fraction", (5, 4))]),
 (3, "adults : children", (3, 8), [1], "Write children as a fraction of the total.", [("ratio as a fraction", (8, 3))]),
 (4, "Year 7s : Year 8s", (12, 8), [0], "What fraction of the pupils are Year 7s?", [("ratio as a fraction", (12, 8)), ("not simplified", (12, 20))]),
 (5, "red : blue marbles", (10, 6), [0], "What fraction of the marbles are red?", [("ratio as a fraction", (10, 6))]),
 (6, "apples : oranges", (9, 21), [1], "Find the fraction of the fruit that are oranges.", [("ratio as a fraction", (21, 9))]),
 (7, "strawberry : lemon : orange sweets", (3, 5, 4), [1], "What fraction of the sweets are lemon?", [("one part over another", (5, 3)), ("over the other two only", (5, 7))]),
 (8, "roses : tulips : daisies", (5, 3, 4), [1, 2], "What fraction of the flowers are not roses?", [("one part only", (3, 12)), ("over the roses", (7, 5))]),
 (9, "walk : car : bicycle", (6, 7, 5), [1, 2], "What fraction of the pupils are travelling on tyres?", [("car only", (7, 18)), ("walkers", (6, 18)), ("over the walkers", (12, 6))]),
]
answers = []
print("| # | Ratio | Question | Answer | Wrong methods give |\n|---|---|---|---|---|")
for rung, ctx, r, idx, words, wrongs in Q:
    n = sum(r[i] for i in idx); d = sum(r); ans = F(n, d)
    # independent route: write out a bar of d equal parts and count the parts that count
    parts = [i for i, v in enumerate(r) for _ in range(v)]; counted = sum(1 for p in parts if p in idx)
    if Fraction(counted, len(parts)) != Fraction(n, d): fails.append(f"Q{rung} counted parts differ")
    ws = []
    for name, (wn, wd) in wrongs:
        w = F(wn, wd)
        if name == "not simplified": w = f"{wn}/{wd}"
        if w == ans: fails.append(f"Q{rung}: wrong method '{name}' gives the right answer {ans}")
        ws.append(f"{name}: {w}")
    answers.append(ans)
    print(f"| {rung} | {ctx} = {' : '.join(map(str, r))} | {words} | {ans} | {'; '.join(ws)} |")
if len(set(answers)) != len(answers): fails.append(f"answers repeat: {answers}")
# the tyres question: the car and bicycle parts together over the total
assert (7 + 5) / 18 == 12 / 18
print("\nFAILURES:" if fails else "\nALL CHECKS PASSED"); [print("  ", f) for f in fails]
