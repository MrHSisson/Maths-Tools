# Manipulating ratios: builds the hand-written twelve-question Worksheet 3 (a mixture), kept as the pinned, printable worksheet
# into src/decks/data/manipulating-ratios.json, and recomputes every answer by laying out and counting the equal parts.
# Run: python3 -I specs/decks/_check/ratio-w3-build.py
import json
from fractions import Fraction
from math import gcd
from functools import reduce
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
joined = lambda xs: " and ".join(xs)

# (context, names, ratio, kind, numerator parts, denominator parts (part kind only), question, wrong methods)
# kind "total": the wanted parts over every part; kind "part": the wanted parts over the named part(s) only (part : part).
# Ladder: 1-5 two parts (3 and 5 simplify), 6-8 three parts, 9 three parts that simplify, 10 two parts over one, 11 four parts, 12 two parts over two.
W3 = [
 ("boys : girls", ["boys", "girls"], (5, 7), "total", [1], None, "What fraction of the class are girls?", [(7, 5)]),
 ("cats : dogs", ["cats", "dogs"], (3, 8), "part", [0], [1], "Write the number of cats as a fraction of the number of dogs.", [(3, 11), (8, 3)]),
 ("salt : sugar", ["salt", "sugar"], (6, 14), "total", [0], None, "What fraction of the mixture is salt?", [(6, 14)]),
 ("flour : butter", ["flour", "butter"], (10, 4), "part", [1], [0], "Write the amount of butter as a fraction of the amount of flour.", [(4, 14), (10, 4)]),
 ("blue : green", ["blue", "green"], (18, 6), "total", [1], None, "What fraction of the paint is green?", [(6, 18)]),
 ("wins : draws : losses", ["wins", "draws", "losses"], (7, 4, 5), "total", [0], None, "What fraction of the games were wins?", [(7, 9), (7, 4)]),
 ("cyclists : walkers : drivers", ["cyclists", "walkers", "drivers"], (3, 7, 2), "part", [2], [1], "Write the number of drivers as a fraction of the number of walkers.", [(2, 12), (7, 2)]),
 ("apples : pears : plums", ["apples", "pears", "plums"], (4, 6, 5), "total", [0, 2], None, "What fraction of the fruit is not pears?", [(6, 15), (4, 15), (9, 6)]),
 ("red : yellow : blue", ["red", "yellow", "blue"], (12, 20, 28), "total", [2], None, "What fraction of the paint is blue?", [(28, 12), (28, 32)]),
 ("small : medium : large", ["small", "medium", "large"], (2, 7, 4), "part", [0, 2], [1], "Write the small and large drinks together as a fraction of the medium drinks.", [(6, 13), (2, 7)]),
 ("oats : raisins : nuts : seeds", ["oats", "raisins", "nuts", "seeds"], (5, 3, 4, 2), "total", [2, 3], None, "What fraction of the mix is neither oats nor raisins?", [(8, 14), (6, 8), (4, 14)]),
 ("7A : 7B : 7C : 7D", ["7A", "7B", "7C", "7D"], (3, 4, 5, 6), "part", [0, 1], [2, 3], "Write 7A and 7B together as a fraction of 7C and 7D together.", [(7, 18), (11, 7)]),
]

def question(i, spec):
    ctx, names, r, kind, num, den, words, wrongs = spec
    cells = [j for j, v in enumerate(r) for _ in range(v)]
    n = sum(r[j] for j in num)
    d = sum(r) if kind == "total" else sum(r[j] for j in den)
    ans = F(n, d)
    # independent check: count the equal parts
    if kind == "total": assert Fraction(sum(1 for c in cells if c in num), len(cells)) == Fraction(*ans)
    else: assert Fraction(sum(1 for c in cells if c in num), sum(1 for c in cells if c in den)) == Fraction(*ans)
    for w in wrongs: assert Fraction(*w) != Fraction(*ans), (i, "wrong method gives the answer", w)
    g = reduce(gcd, r)
    s = [v // g for v in r]
    rowsets = lambda roles: [row(cap(names[j]), s[j], roles.get(j)) for j in range(len(r))]
    steps = []
    if g > 1: steps.append(f"Simplify the ratio first: divide every part by {g}.\n$" + " : ".join(map(str, r)) + " = " + " : ".join(map(str, s)) + "$")
    steps.append("Bar model: draw a row of boxes for each part of the ratio.\n" + bar(rowsets({})))
    ns = sum(s[j] for j in num); ds = sum(s) if kind == "total" else sum(s[j] for j in den)
    if kind == "total":
        steps.append(f"Shade the boxes we want ({ns}). The total is every box: {sum(s)} parts.\n" + bar(rowsets({j: "numerator" for j in num}), f"total: {sum(s)} parts"))
        steps.append("$" + " + ".join(map(str, s)) + f" = {sum(s)}$")
        steps.append("The denominator is the total: every part added.")
    else:
        roles = {j: "numerator" for j in num}; roles.update({j: "denominator" for j in den})
        steps.append(f"Compare the boxes we want ({ns}) with the {joined([names[j] for j in den])} boxes ({ds}).\n" + bar(rowsets(roles)))
        steps.append(f"The denominator is the {joined([names[j] for j in den])} only: this is part : part, not part : whole.")
        steps.append("Do not add every part: we are not finding a fraction of the total.")
    steps.append(f"Answer: {tex(F(ns, ds))}")
    assert F(ns, ds) == ans
    return {"version": 2, "id": f"mr-bw3-{i}", "title": f"{ctx} = {' : '.join(map(str, r))} {words}", "tool": "ratio-manipulation", "level": "level3",
            "purpose": "practice", "format": "open", "question": [f"{ctx} = ${' : '.join(map(str, r))}$", words], "answer": [tex(ans)], "explanation": steps,
            "rationale": "", "expectedErrors": [], "followUp": "", "status": "ready"}, ans

d = json.load(open(PATH))
slide = {x["id"]: x for x in d["slides"]}["mr-w3"]
sheet = [e for e in slide["els"] if e["kind"] == "worksheet"][0]
items, answers = [], []
for i, sp in enumerate(W3, 1):
    q, a = question(i, sp); items.append(q); answers.append((a, sp))
assert len(set(a for a, _ in answers)) == 12, answers
assert len({sp[2] for _, sp in answers}) == 12
# The sheet stays a pinned, printable worksheet (the slide is the hand-out cue and the answers on a click); `frozen` is the set it prints,
# written here by hand. It applies only while `sig` matches the sheet's tool, preset, count and seed, so do not change the seed.
sig = json.dumps([sheet["tool"], sheet["preset"], sheet["count"], sheet.get("seed", 1)], separators=(",", ":"))
assert sheet["count"] == 12 and sheet.get("pin")
sheet["frozen"] = {"sig": sig, "questions": [
    {"kind": "worded", "lines": q["question"], "answer": f"{a[0]}/{a[1]}", "answerLatex": f"\\frac{{{a[0]}}}{{{a[1]}}}", "working": [], "key": f"mr-w3-{i}", "difficulty": "level3"}
    for i, (q, (a, _)) in enumerate(zip(items, answers), 1)]}
print([f"{a[0]}/{a[1]}" for a, _ in answers])
json.dump(d, open(PATH, "w"), indent=1, ensure_ascii=False); open(PATH, "a").write("\n")
print("ALL CHECKS PASSED")
