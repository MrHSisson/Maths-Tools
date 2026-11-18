# Trigonometric symmetry and periodicity in radians: builds the hand-written nine-question worksheet (from Harry's Word worksheet) as a
# pinned, printable worksheet in the Textbook layout, into src/decks/data/trig-symmetry-radians.json, and recomputes every answer
# numerically (for BOTH solutions of each given condition, so no answer depends on which x was picked).
# Run: python3 -I specs/decks/_check/trig-symmetry-build.py
import json
from math import pi, sin, cos, tan, asin, acos, atan, isclose

PATH = "src/decks/data/trig-symmetry-radians.json"
SP = " "          # an em space: kept by the browser (an ordinary space would collapse), so parts sit side by side on a line
FN = {"sin": sin, "cos": cos, "tan": tan}

# An argument is  a·(π/2) + s·x  and is written exactly as on the worksheet.
def arg(latex, a, s): return (latex, a, s)
P_MX = arg("\\pi - x", 2, -1);        P_PX = arg("\\pi + x", 2, 1);        P_2MX = arg("2\\pi - x", 4, -1)
P_NX = arg("-x", 0, -1);              P_2PX = arg("2\\pi + x", 4, 1);      P_3MX = arg("3\\pi - x", 6, -1);   P_3PX = arg("3\\pi + x", 6, 1)
H_MX = arg("\\dfrac{\\pi}{2} - x", 1, -1);   H_PX = arg("\\dfrac{\\pi}{2} + x", 1, 1)
T_MX = arg("\\dfrac{3\\pi}{2} - x", 3, -1);  T_PX = arg("\\dfrac{3\\pi}{2} + x", 3, 1)
F_MX = arg("\\dfrac{5\\pi}{2} - x", 5, -1)
NH_PX = arg("-\\dfrac{\\pi}{2} + x", -1, 1); NH_MX = arg("-\\dfrac{\\pi}{2} - x", -1, -1)
X_MP = arg("x - \\pi", -2, 1);        X_M2P = arg("x - 2\\pi", -4, 1)
PLAIN = arg("x", 0, 1)

def part(fn, a, expect): return (fn, a, expect)      # one expression to evaluate and the answer written on the key
def given(fn, a, value): return (fn, a, value)         # fn(arg) = value

# (section, stem, [groups]); a group is (letter or None, given, [parts]).
# Sections: 1 symmetry around 0, π, 2π; 2 around π/2, 3π/2; 3 extension. Answers are the worksheet's own key (checked below).
QUESTIONS = [
 (1, "Given {g}, find:", [(None, given("sin", PLAIN, "0.6"), [part("sin", P_MX, "0.6"), part("sin", P_PX, "-0.6"), part("sin", P_2MX, "-0.6"), part("sin", P_NX, "-0.6"), part("sin", P_2PX, "0.6")])]),
 (1, "Given {g}, find:", [(None, given("cos", PLAIN, "0.4"), [part("cos", P_MX, "-0.4"), part("cos", P_PX, "-0.4"), part("cos", P_2MX, "0.4"), part("cos", P_NX, "0.4"), part("cos", P_3MX, "-0.4")])]),
 (1, "Given {g}, find:", [(None, given("tan", PLAIN, "2.5"), [part("tan", P_MX, "-2.5"), part("tan", P_PX, "2.5"), part("tan", P_2MX, "-2.5"), part("tan", P_NX, "-2.5"), part("tan", P_3PX, "2.5")])]),
 (1, "Evaluate each set of expressions for the given negative values:", [
   ("a", given("sin", PLAIN, "-0.3"), [part("sin", P_MX, "-0.3"), part("sin", P_PX, "0.3"), part("sin", P_2MX, "0.3"), part("sin", P_NX, "0.3")]),
   ("b", given("cos", PLAIN, "-0.7"), [part("cos", P_MX, "0.7"), part("cos", P_PX, "0.7"), part("cos", P_2MX, "-0.7"), part("cos", P_NX, "-0.7")]),
   ("c", given("tan", PLAIN, "-1.2"), [part("tan", P_MX, "1.2"), part("tan", P_PX, "-1.2"), part("tan", P_2MX, "1.2"), part("tan", P_NX, "1.2")])]),
 (2, "Given {g}, find:", [(None, given("sin", H_PX, "0.1"), [part("sin", H_MX, "0.1"), part("sin", T_MX, "-0.1"), part("sin", T_PX, "-0.1"), part("sin", NH_PX, "-0.1"), part("sin", F_MX, "0.1")])]),
 (2, "Given {g}, find:", [(None, given("cos", H_MX, "0.8"), [part("cos", H_PX, "-0.8"), part("cos", T_MX, "-0.8"), part("cos", T_PX, "0.8"), part("cos", NH_PX, "0.8"), part("cos", NH_MX, "-0.8")])]),
 (2, "Given {g}, find:", [(None, given("tan", H_MX, "3"), [part("tan", H_PX, "-3"), part("tan", T_MX, "3"), part("tan", T_PX, "-3"), part("tan", arg("-\\dfrac{\\pi}{2} - x", -1, -1), "3"), part("tan", arg("-\\dfrac{\\pi}{2} + x", -1, 1), "-3")])]),
 (3, "Reversed brackets: given each value, find:", [
   ("a", given("sin", PLAIN, "0.5"), [part("sin", X_MP, "-0.5"), part("sin", X_M2P, "0.5")]),
   ("b", given("cos", PLAIN, "0.9"), [part("cos", X_MP, "-0.9"), part("cos", X_M2P, "0.9")]),
   ("c", given("tan", PLAIN, "1.5"), [part("tan", X_MP, "1.5"), part("tan", X_M2P, "1.5")])]),
 (3, "Cross-function phase shifts: given each value, find:", [
   ("a", given("sin", PLAIN, "0.7"), [part("cos", H_MX, "0.7"), part("cos", H_PX, "-0.7"), part("cos", T_MX, "-0.7"), part("cos", T_PX, "0.7")]),
   ("b", given("cos", PLAIN, "0.2"), [part("sin", H_MX, "0.2"), part("sin", H_PX, "0.2"), part("sin", T_MX, "-0.2"), part("sin", T_PX, "-0.2")]),
   ("c", given("tan", PLAIN, "4"), [part("tan", H_MX, "0.25"), part("tan", H_PX, "-0.25")])]),
]
# the parts' arguments are looked up by their LaTeX, so the expression on the page and the one tested are the same thing
ARGS = {"x": PLAIN}
for a in [P_MX, P_PX, P_2MX, P_NX, P_2PX, P_3MX, P_3PX, H_MX, H_PX, T_MX, T_PX, F_MX, NH_PX, NH_MX, X_MP, X_M2P]: ARGS[a[0]] = a

def solutions(fn, a0, s0, value):
    """Every x (several turns of each) that satisfies fn(a0·π/2 + s0·x) = value."""
    v = float(value)
    base = {"sin": lambda: [asin(v), pi - asin(v)], "cos": lambda: [acos(v), -acos(v)], "tan": lambda: [atan(v)]}[fn]()
    period = pi if fn == "tan" else 2 * pi
    us = [u + k * period for u in base for k in (-1, 0, 2)]
    return [s0 * (u - a0 * pi / 2) for u in us]          # s0 is ±1, so dividing by s0 is multiplying by it

def check(fn_g, arg_g, value, parts, where):
    xs = solutions(fn_g, arg_g[1], arg_g[2], value)
    for x in xs:
        assert isclose(FN[fn_g](arg_g[1] * pi / 2 + arg_g[2] * x), float(value), abs_tol=1e-9), (where, "given not met", x)
        for fn, a, expect in parts:
            got = FN[fn](a[1] * pi / 2 + a[2] * x)
            assert isclose(got, float(expect), abs_tol=1e-9), (where, fn, a[0], "expected", expect, "got", got, "x", x)
    return len(xs)

tex_given = lambda fn, a, value: f"{tex_part(fn, a)} = {value}"
tex_part = lambda fn, a: f"\\{fn}\\left({a[0]}\\right)" if "\\dfrac" in a[0] else f"\\{fn}({a[0]})"
neg = lambda t: t.replace("-", "−")                      # real minus signs on the key
LETTERS = "abcde"

def table(rows, gap="\\qquad"):
    """A left-aligned table of LaTeX cells (rows of cells), inside one $...$ so KaTeX draws it: aligned columns, stacked fractions.
    (KaTeX has no @{...} column separators, so the gap between columns is a \\qquad on the end of each cell but the last.)"""
    n = max(len(r) for r in rows)
    pad = lambda r: [c + (gap if k < n - 1 else "") for k, c in enumerate(r + [""] * (n - len(r)))]
    body = " \\\\[0.85em] ".join(" & ".join(pad(r)) for r in rows)
    return "$\\begin{array}{" + "l" * n + "}" + body + "\\end{array}$"
lab = lambda c: f"(\\mathrm{{{c}}})\\;"

def lines_and_answer(stem, groups):
    if len(groups) == 1:
        _, g, parts = groups[0]
        cells = [lab(LETTERS[j]) + tex_part(fn, ARGS[a[0]]) for j, (fn, a, _) in enumerate(parts)]
        keys = [lab(LETTERS[j]) + "{" + e + "}" for j, (_, _, e) in enumerate(parts)]      # braces make the minus a sign, not a subtraction
        qrows, arows = [cells[:3], cells[3:]], [keys]                  # the key is one row per question
        lines = [stem.format(g=f"${tex_given(g[0], ARGS[g[1][0]], g[2])}$"), table([r for r in qrows if r])]
        plain = SP.join(f"({LETTERS[j]}) {neg(e)}" for j, (_, _, e) in enumerate(parts))       # the key is plain text, so the slide can show it at any size
        return lines, plain, table([r for r in arows if r], "\\;\\;\\;")
    qrows, arows, plain = [], [], []
    for letter, g, parts in groups:
        qrows.append([lab(letter) + tex_given(g[0], ARGS[g[1][0]], g[2]) + "\\colon"] + [tex_part(fn, ARGS[a[0]]) for fn, a, _ in parts])
        arows.append([lab(letter)] + ["{" + e + "}" for _, _, e in parts])
        plain.append(f"({letter}) " + ", ".join(neg(e) for _, _, e in parts))
    return [stem, table(qrows)], SP.join(plain), table(arows, "\\;\\;\\;")

HEADERS = {1: "Section 1: Symmetry around 0, π and 2π<div style=\"font-size:0.8em;font-weight:400;color:#374151\">Non-calculator practice. Use sketches of the sin, cos and tan graphs in radians to evaluate each expression.</div>",
           2: "Section 2: Symmetry around π/2 and 3π/2", 3: "Section 3: Extension"}
COLS = 1
import os
FONT_PX = int(os.environ.get("FONT_PX", "15"))   # the Textbook layout sets every slot to the tallest question, so the size decides whether a sheet fits one page
TOOL, PRESET, COUNT, SEED, ID = "solving-trig-equations", {"sub": "solve", "level": "level1"}, len(QUESTIONS), 1, "ts-w1"
qs, keys, seen = [], [], set()
for i, (sec, stem, groups) in enumerate(QUESTIONS, 1):
    for letter, g, parts in groups: check(g[0], ARGS[g[1][0]], g[2], parts, f"question {i}{letter or ''}")
    lines, ans, ans_tex = lines_and_answer(stem, groups)
    q = {"kind": "worded", "lines": lines, "answer": ans, "answerLatex": ans_tex.strip("$"), "working": [], "key": f"{ID}-{i}", "difficulty": "level1", "_sectionIdx": sec - 1, "_sectionCols": COLS}
    if sec not in seen: q["_sectionHeader"] = HEADERS[sec]; seen.add(sec)
    qs.append(q); keys.append(ans)

sig = json.dumps([TOOL, PRESET, COUNT, SEED], separators=(",", ":"))
TITLE = "Trig symmetry and periodicity in radians"
sheet = {"kind": "worksheet", "x": 80, "y": 230, "w": 1440, "h": 630, "tool": TOOL, "preset": PRESET, "count": COUNT, "cols": COLS, "seed": SEED, "prompt": "", "view": "key", "size": 15,   # the slide's answer view is three columns at this size: long answers stay small, the printed key is the readable copy
        
         "pin": {"title": TITLE, "paper": "A4", "layout": "list", "borders": False, "fontPx": FONT_PX}, "id": f"{ID}-3",
         "frozen": {"sig": sig, "questions": qs}}
slide = {"id": ID, "family": "practice", "title": f"Worksheet: {TITLE}", "els": [
    {"kind": "text", "x": 100, "y": 50, "w": 1400, "h": 100, "text": f"Worksheet: {TITLE}", "size": 56, "colour": "#0f172a", "bold": True, "id": f"{ID}-1"},
    {"kind": "text", "x": 100, "y": 150, "w": 1400, "h": 56, "text": "Hand out the worksheet. Press A for the answers.", "size": 36, "colour": "#64748b", "id": f"{ID}-2"},
    sheet]}
deck = {"id": "trig-symmetry-radians", "title": TITLE, "strand": "Pure Mathematics", "tool": TOOL, "toolPath": "/solving-trig-equations",
        "summary": "A printable worksheet on the symmetry and periodicity of sin, cos and tan in radians: evaluate expressions such as sin(π − x) from a given value without a calculator. Three sections (symmetry around 0, π and 2π; around π/2 and 3π/2; extension) and an answer sheet.",
        "slides": [slide], "questionVersion": 2}
json.dump(deck, open(PATH, "w"), indent=1, ensure_ascii=False); open(PATH, "a").write("\n")
for i, k in enumerate(keys, 1): print(i, k)
print("ALL CHECKS PASSED")
