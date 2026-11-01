# Manipulating ratios: builds the two hand-written nine-question book work slides (replacing pinned Worksheets 1 and 2)
# into src/decks/data/manipulating-ratios.json, and recomputes every answer by counting equal parts.
# Run: python3 -I specs/decks/_check/ratio-bookwork-build.py
import json
from fractions import Fraction
from math import gcd
PATH = "src/decks/data/manipulating-ratios.json"
def F(n, d): g = gcd(n, d); return (n // g, d // g)
def tex(f): return f"$\\frac{{{f[0]}}}{{{f[1]}}}$"
def bar(rows, brace=None):
    d = {"parts": [], "rows": rows}
    if brace: d["sideBrace"] = {"label": brace}
    return "@bar " + json.dumps(d, separators=(",", ":"))
def row(name, units, role=None):
    r = {"name": name, "units": units}
    if role: r["role"] = role
    return r
cap = lambda s: s[0].upper() + s[1:]

# kind "total": num parts over the sum of all; kind "part": num parts over the (single) den part. ratio is as written in the question.
# wrong = fractions a wrong method gives, which must differ from the answer.
W1 = [
 ("green : yellow", ["green", "yellow"], (2, 7), "total", [0], None, "What fraction of the counters are green?", [(2, 7)]),
 ("bananas : grapes", ["bananas", "grapes"], (4, 5), "total", [1], None, "Find the fraction of the fruit that are grapes.", [(5, 4)]),
 ("adults : children", ["adults", "children"], (3, 8), "total", [1], None, "Write children as a fraction of the total.", [(8, 3)]),
 ("Year 7s : Year 8s", ["Year 7s", "Year 8s"], (12, 8), "total", [0], None, "What fraction of the pupils are Year 7s?", [(12, 8), (12, 20)]),
 ("red : blue", ["red", "blue"], (10, 6), "total", [0], None, "What fraction of the marbles are red?", [(10, 6)]),
 ("apples : oranges", ["apples", "oranges"], (9, 21), "total", [1], None, "Find the fraction of the fruit that are oranges.", [(21, 9)]),
 ("strawberry : lemon : orange", ["strawberry", "lemon", "orange"], (3, 5, 4), "total", [1], None, "What fraction of the sweets are lemon?", [(5, 3), (5, 7)]),
 ("roses : tulips : daisies", ["roses", "tulips", "daisies"], (5, 3, 4), "total", [1, 2], None, "What fraction of the flowers are not roses?", [(3, 12), (7, 5)]),
 ("walk : car : bicycle", ["walk", "car", "bicycle"], (6, 7, 5), "total", [1, 2], None, "What fraction of the pupils are travelling on tyres?", [(7, 18), (6, 18), (12, 6)]),
]
W2 = [
 ("wins : losses", ["wins", "losses"], (3, 4), "part", [0], 1, "Write the number of wins as a fraction of the number of losses.", [(3, 7)]),
 ("green : yellow", ["green", "yellow"], (5, 2), "part", [0], 1, "Find the green counters as a fraction of the yellow counters.", [(5, 7), (2, 5)]),
 ("Year 7s : Year 8s", ["Year 7s", "Year 8s"], (4, 9), "part", [1], 0, "Write the number of Year 8s as a fraction of the number of Year 7s.", [(9, 13), (4, 9)]),
 ("bananas : grapes", ["bananas", "grapes"], (6, 9), "part", [0], 1, "Find bananas as a fraction of grapes.", [(6, 15), (6, 9)]),
 ("red : blue", ["red", "blue"], (14, 8), "part", [0], 1, "What fraction of blue are red?", [(14, 22), (8, 14)]),
 ("adults : children", ["adults", "children"], (15, 6), "part", [1], 0, "Write the number of children as a fraction of the number of adults.", [(6, 21), (15, 6)]),
 ("football : squash : tennis", ["football", "squash", "tennis"], (4, 3, 5), "part", [2], 0, "Find the number of people who chose tennis as a fraction of the number who chose football.", [(5, 12), (5, 8)]),
 ("roses : tulips : daisies", ["roses", "tulips", "daisies"], (2, 7, 3), "part", [0, 2], 1, "Write roses and daisies together as a fraction of tulips.", [(5, 12), (2, 7)]),
 ("sopranos : altos : tenors", ["sopranos", "altos", "tenors"], (6, 4, 5), "part", [0, 2], 1, "Write the singers who are not altos as a fraction of the altos.", [(11, 15), (15, 4)]),
]

def question(prefix, i, spec):
    ctxname, names, r, kind, num, den, words, wrongs = spec
    n = sum(r[j] for j in num); d = sum(r) if kind == "total" else r[den]
    ans = F(n, d)
    # independent check: lay out the equal parts and count
    cells = [j for j, v in enumerate(r) for _ in range(v)]
    if kind == "total": assert Fraction(sum(1 for c in cells if c in num), len(cells)) == Fraction(*ans)
    else: assert Fraction(sum(1 for c in cells if c in num), sum(1 for c in cells if c == den)) == Fraction(*ans)
    for w in wrongs: assert F(*w) != ans or w != F(*w), (prefix, i, "wrong method gives the answer", w)   # an unsimplified fraction is the 'not simplified' trap
    g = 1
    for v in r: g = gcd(g, v)
    s = [v // g for v in r]                       # the ratio the bar is drawn from (simplified)
    steps = []
    rowsets = lambda roles: [row(cap(names[j]), s[j], roles.get(j)) for j in range(len(r))]
    if g > 1:
        steps.append(f"Simplify the ratio first: divide every part by {g}.\n$" + " : ".join(map(str, r)) + " = " + " : ".join(map(str, s)) + "$")
    steps.append("Bar model: draw a row of boxes for each part of the ratio.\n" + bar(rowsets({})))
    ns = sum(s[j] for j in num); ds = sum(s) if kind == "total" else s[den]
    if kind == "total":
        picked = " and ".join(names[j] for j in num)
        steps.append(f"Shade the boxes we want ({ns}). The total is every box: {sum(s)} parts.\n" + bar(rowsets({j: "numerator" for j in num}), f"total: {sum(s)} parts"))
        steps.append("$" + " + ".join(map(str, s)) + f" = {sum(s)}$")
        steps.append("The denominator is the total: every part added.")
    else:
        roles = {j: "numerator" for j in num}; roles[den] = "denominator"
        steps.append(f"Compare the boxes we want ({ns}) with the {names[den]} boxes ({ds}).\n" + bar(rowsets(roles)))
        steps.append(f"The denominator is the {names[den]} only: this is part : part, not part : whole.")
        steps.append("Do not add the parts: we are not finding a fraction of the total.")
    steps.append(f"Answer: {tex(F(ns, ds))}")
    assert F(ns, ds) == ans
    return {"version": 2, "id": f"{prefix}{i}", "title": f"{ctxname} = {' : '.join(map(str, r))} {words}", "tool": "ratio-manipulation",
            "level": "level1" if kind == "total" else "level2", "purpose": "practice", "format": "open",
            "question": [f"{ctxname} = ${' : '.join(map(str, r))}$", words], "answer": [tex(ans)], "explanation": steps,
            "rationale": "", "expectedErrors": [], "followUp": "", "status": "ready"}, ans

d = json.load(open(PATH))
byid = {s["id"]: s for s in d["slides"]}
for sid, prefix, title, specs in (("mr-w1", "mr-bw1-", "Book work: of the total", W1), ("mr-w2", "mr-bw2-", "Book work: of a part", W2)):
    items, answers = [], []
    for i, sp in enumerate(specs, 1):
        q, a = question(prefix, i, sp); items.append(q); answers.append(a)
    assert len(set(answers)) == 9, answers
    s = byid[sid]
    s["family"] = "retrieval"; s["title"] = title
    s["els"] = [{"kind": "grid", "x": 20, "y": 40, "w": 1560, "h": 830, "bank": [], "cols": 3, "id": f"{sid}-grid", "items": items}]
    print(title, [f"{a[0]}/{a[1]}" for a in answers])
json.dump(d, open(PATH, "w"), indent=1, ensure_ascii=False); open(PATH, "a").write("\n")
print("ALL CHECKS PASSED")
