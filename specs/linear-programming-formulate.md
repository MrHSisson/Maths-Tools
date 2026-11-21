# Formulating Linear Programmes (DD1) — brief

**Status:** draft, revised 2026-11-21 (two sub-tools, two levels each; first drafted with seven sub-tools and three levels). The first build of the Linear Programming family (`specs/linear-programming-tools.md`). Not `ready` until Harry answers section 11. Nothing is built.

**What this is.** A tool, `lp-formulate`, on `DecisionShell` (own data field `lp`, written working, no network), with **two sub-tools, each with two levels**:

1. **Write a constraint** (`constraint`): a short situation, and the student writes one constraint (or a small set). **Level 1: direct** (resource use and direct comparisons). **Level 2: indirect** (percentages, ratios, either-or limits).
2. **Formulate a problem** (`problem`): the whole thing, mixed, as the exam sets it: variables, the objective (`P = …`), every constraint, non-negativity, integers. Level 1 uses the Level 1 styles; Level 2 the Level 2 styles and the extras.

A student learns each style on its own (sub-tool 1), then meets them mixed (sub-tool 2). The answer is the **model solution shown by the stepper**; the student is not marked on typed input. **The number of variables is controllable, 2 to 4** (option Variables, default Two). **Every constraint is shown, and answered, with whole-number coefficients in lowest terms.**

Sources: textbook chapter 4 section 1 and Exercise 4A (corpus rows L01 to L09, L11 to L14), the AQA specification DD1, and Harry's cases: `10x + 15y ≤ 300`; "x should be twice y and z combined"; "x should be 40 percent of y (or of y and z combined, or of the total)"; the either-or limit "at most 60 of one and 45 of another" giving `x/60 + y/45 ≤ 1`.

---

## 1. The levels

| | Level 1: direct | Level 2: indirect |
|---|---|---|
| **`constraint`** | **Resource use** (`10x + 15y ≤ 300`) and **direct comparisons** (a multiple of a variable or of several combined; a difference; a bound; a total). Whole-number coefficients that can be read straight off the sentence. | **Percentages** (of one variable, of several combined, of the total, "p% more than"), **ratios**, and **either-or limits** (`x/60 + y/45 ≤ 1`, rate and time, three or four products). |
| **`problem`** | variables, **objective `P = …` (profit per item given)**, resource limits and direct comparisons, non-negativity | adds the Level 2 styles, and price minus cost, pack variables, unit conversions, a table, "integers", a remainder to substitute out, "exactly half" |

Corpus styles: `constraint` L1 L02 L04 L05 L09(wording) L11 · L2 L03 L05 L07 and new styles (sections 3 and 4). `problem` L1 L01 L02 L05 · L2 L03 L06 to L08 L12 L13 L14a. **Test and spot** (L09, N7: which point is feasible; which of three formulations is right) is a later third sub-tool (section 10).

Each level is a wide range, so a **Constraint Styles** pool (section 8) lets a teacher drill one style at a time; all of them mixed is the default. Calibration (R25, R26) measures the rungs.

---

## 2. One rule for every relationship (shared by both levels)

A relationship says the amounts in a group **A** compare with a multiple of the amounts in a group **B**:

`Σ(A)  ⟨op⟩  m · Σ(B)`   where `m` is a rational number (`m = p/q` in lowest terms; a percentage is `p/100` reduced) and `⟨op⟩` is at least, at most or exactly.

To tidy: multiply by `q` (clearing the fraction), move everything to the left, combine like terms (when B is the **total**, A's variables appear on both sides). The tidy form has **whole-number coefficients in lowest terms**.

| The sentence (examples) | A | B | m | Tidy form |
|---|---|---|---|---|
| "x at least twice y" | x | y | 2 | `x − 2y ≥ 0` |
| "x at least twice y and z combined" | x | y, z | 2 | `x − 2y − 2z ≥ 0` |
| "x no more than three times y" | x | y | 3 | `x − 3y ≤ 0` |
| "x is exactly 40% of y" | x | y | 2/5 | `5x − 2y = 0` |
| "x is at most 40% of y and z combined" | x | y, z | 2/5 | `5x − 2y − 2z ≤ 0` |
| "x is at least 40% of the total" | x | x, y, z | 2/5 | `3x − 2y − 2z ≥ 0` |
| "x is at most 25% of the total" (two variables) | x | x, y | 1/4 | `3x − y ≤ 0` |
| "x is 20% more than y" | x | y | 6/5 | `5x − 6y = 0` |
| "the ratio of x to y is at least 2 : 3" | x | y | 2/3 (x/y) | `3x − 2y ≥ 0` |

Other direct styles outside the rule: a difference ("x exceeds y by at least 5": `x − y ≥ 5`); a bound ("at most 40 of x": `x ≤ 40`); a total ("no more than 50 in all": `x + y ≤ 50`); a percentage of a fixed total ("x supplies at most 20% of the 2500 calories, 80 each": `80x ≤ 500`, a plain number).

**Integer coefficients, always.** The generator picks `m` from a pool whose reduced form keeps the coefficients small: multiples 2, 3, 4, 3/2, 5/2; percentages 10, 20, 25, 30, 40, 50, 60, 75, 80 (and 20, 25, 50 "more than"). It rejects a draw whose tidy coefficients exceed 20 (Level 1: 9). A test asserts, for every constraint of every kind: all coefficients integers, `gcd = 1`, leading coefficient positive.

**The check that is taught (the book's own):** try a number. "If y = 15 and z = 5, then x is at least 40" tells a student whether it is `x ≥ 2(y + z)` or `y + z ≥ 2x`. The reversal is the named slip. For a total: "x is 40% of the total, so x is 40% of x + y + z, not of y + z" is the second named slip (the pair "of y" against "of the total").

**Wording.** Every sentence says its operator: at least, at most or exactly ("should be" alone is never used; a generator would otherwise draw an ambiguous sentence).

---

## 3. `constraint` — Level 1: direct

- **Resource use:** items use a limited resource: `ax + by (+ cz + dw) ≤ c`, or `≥` for a minimum to be met ("each X supplies 10 units, each Y 15, at least 300 needed"). Whole numbers, coefficients 2 to 20, round totals, matching units, "if only X is made" gives a whole number of items. Working: "X uses 10 each, so x of them use 10x. Y uses 15 each, so y use 15y. Together at most 300: `10x + 15y ≤ 300`." Slip: the coefficients written the wrong way round; the check: "if only X is made, 10x ≤ 300, so x ≤ 30".
- **Direct comparisons:** the multiples of section 2 with whole-number `m` (and 3/2, 5/2), A one variable and B one variable or several combined (with 3 or 4 variables); a difference; a bound; a total. Operators at least, at most and exactly.
- **Constraints Asked** (option): **One** constraint, or **Two** (two of the same level's styles; the bridge to `problem`).

## 4. `constraint` — Level 2: indirect

- **Percentages:** of one variable ("x is 40% of y"), of several combined ("40% of y and z combined"), of the total ("at least 40% of the total"), "p% more than" or "p% less than" (`x = 1.2y`, `x = 0.8y`), a range ("between 20% and 30% of the total": a pair). The working shows the decimal or fraction, the substitution and the tidying line by line, including the bracket for the total (`x ≥ 0.4(x + y + z)` → `x ≥ 0.4x + 0.4y + 0.4z` → `0.6x ≥ 0.4y + 0.4z` → multiply by 5 → `3x ≥ 2y + 2z`).
- **Ratios:** "the ratio of x to y is at least 2 : 3" → `3x − 2y ≥ 0` (cross-multiplying); "x : y : z = 1 : 2 : 3" gives a pair.
- **Either-or limits** (Harry's case; the book has one example and no exercise), below.

### 4.1 The mathematics

Several products share one resource (a machine, an oven, a worker, a field). Used alone the resource makes at most `a` of X, or at most `b` of Y. Then one X uses `1/a` of it and one Y uses `1/b`, so the share used is `x/a + y/b`, which cannot exceed the whole:

`x/a + y/b ≤ 1`

Multiply by `L = lcm(a, b)`; with `g = gcd(a, b)`: `(b/g) x + (a/g) y ≤ ab/g`, so the coefficient of x comes from the *other* number (60 and 45: `g = 15`, `3x + 4y ≤ 180`). Three or four products: `x/a + y/b + z/c (+ w/d) ≤ 1`, multiplied by their lcm. The check that catches nearly every slip is the **intercepts**: `y = 0` must give `x = a`, and `x = 0` must give `y = b`.

### 4.2 Ways it is given (the option **Capacity Given As**, an exclusive pool)

| Option | The question says | The constraint |
|---|---|---|
| Most You Could Make | at most 60 of A, or at most 45 of B, in the time available | `x/60 + y/45 ≤ 1` |
| Rate And Time | 60 A an hour or 45 B an hour, for 8 hours | `x/60 + y/45 ≤ 8` (also `3x + 4y ≤ 1440`) |
| Time Per Item | each A takes 1 minute, each B takes 4/3 minutes, 8 hours (480 minutes) | `x + (4/3) y ≤ 480` (also `3x + 4y ≤ 1440`); includes the minutes-to-hours conversion |
| Share Of A Requirement | each A supplies 1/60 of the daily requirement, each B 1/45 | `x/60 + y/45 ≥ 1` (a minimising situation) |

### 4.3 Method shown (the option **Capacity Method**, display only; the working changes, the numbers do not)

- **Fractions Of Capacity:** "One A uses 1/60 of the capacity, so x of them use x/60. One B uses 1/45, so y use y/45. Together at most the whole capacity: `x/60 + y/45 ≤ 1`. Multiply by 180 (the lowest common multiple of 60 and 45): `3x + 4y ≤ 180`."
- **Common Units:** the book's way: "Suppose the capacity is 180 units. Then each A uses 3 and each B uses 4, so `3x + 4y ≤ 180`."
- **Both:** the first, then a line saying the second gives the same result.

### 4.4 The check shown at the end of every solution

"Check: if only A is made (y = 0) then 3x ≤ 180, so x ≤ 60, the most of A. If only B is made (x = 0) then 4y ≤ 180, so y ≤ 45. ✓" It teaches a student to test their own work, and it is the test the graphical tool uses to plot the line from its intercepts.

### 4.5 The slips the working names

| Slip | Wrong constraint | Why the check catches it |
|---|---|---|
| multiplying instead of dividing | `60x + 45y ≤ 1` | `y = 0` gives `x ≤ 1/60`, not 60 |
| two separate limits ("and", not "or") | `x ≤ 60` and `y ≤ 45` | allows 60 of A and 45 of B together |
| adding the capacities | `x + y ≤ 105` | allows 105 of A alone |
| swapping the coefficients when clearing fractions | `4x + 3y ≤ 180` | `y = 0` gives `x ≤ 45` |
| forgetting the time | `3x + 4y ≤ 1` (rate form, 8 hours missed) | `y = 0` gives `x ≤ 1/3` |

### 4.6 Worked examples (hand-checked, for the tests)

1. **60 and 45:** "A baker's oven can bake at most 60 loaves or at most 45 cakes in a day, or a mixture." `x/60 + y/45 ≤ 1`, `3x + 4y ≤ 180`.
2. **30 and 50** (the book's): `x/30 + y/50 ≤ 1`, `5x + 3y ≤ 150`.
3. **Rate and time:** 60 an hour or 45 an hour, 8 hours: `x/60 + y/45 ≤ 8`, `3x + 4y ≤ 1440`; intercepts (480, 0) and (0, 360).
4. **Three products (60, 45, 36):** `3x + 4y + 5z ≤ 180`.
5. **Requirement:** `x/60 + y/45 ≥ 1`, `3x + 4y ≥ 180`.
6. **Percentages (two variables, three):** "x at least 40% of the total" with three variables `3x − 2y − 2z ≥ 0`; "x is exactly 40% of y and z combined" `5x − 2y − 2z = 0`; "x is 20% more than y" `5x − 6y = 0`.

---

## 5. `problem` — Formulate a problem

The whole model: **variables** (the noun and units), **objective** (`P = …`, and maximise or minimise), **constraints**, **non-negativity**, **integers** where the items are whole; laid out as the book does ("Maximise P = …", "subject to:", one constraint per line).

| Level | Constraints | Objective and variables | Textbook |
|---|---|---|---|
| 1 | resource limits and direct comparisons, two to four variables | **`P = …` from a profit per item**, maximise | WE4.1, Ex4A 4 |
| 2 | adds percentages, ratios, either-or limits, ≥ | profit is price minus cost (the slip is to use the price); a pack variable (a tray of six: six times the item's profit); unit conversions; "integers"; the data as a table; a **remainder** substituted out (the book's turf, giving a constant in the objective); "exactly half" relations; with 3 variables, using up all the time to remove one | WE4.3 to 4.6, Ex4A 5, MP3, MP9, MP11b |

**The remainder:** a total `T` split over the uses; the last use is `T − x − y` (never defined as a variable); its non-negativity gives `x + y ≤ T`; the objective is written with the substitution (4x + 5y + 3(40 − x − y) = 120 − x + 2y). Nothing in `problem` is new maths, only assembly, so the generator reuses the rules of `constraint`.

---

## 6. Contexts

One shared library, used by all three LP tools later. Each context states two to four items (with plural nouns), the units, a profit range, and the constraint styles it supports (resource use; comparisons, percentages and "combined"; either-or; remainder). Suggested set: a bakery (loaves, cakes, pies, buns), a print shop (posters, leaflets, flyers, cards), a workshop (chairs, tables, stools, shelves), a farm (crops; land is a total with a remainder), a café (lunch deals), a charity (kinds of parcel), a study plan (hours as a total). Realistic ranges only; no real brands. The variable letters are `x, y` / `x, y, z` / `w, x, y, z` (the book's own order for four).

## 7. Generation: equations first (as in Mechanics)

A generator never writes the words first. For each constraint it picks the **integer form**, derives everything else, then writes the sentence from the same numbers, so wording and model cannot disagree.

- **Resource use:** coefficients and amount whole, the amount round, at least one "if only this item is made" answer a whole number of items.
- **Relationships:** pick `A`, `B` (disjoint, or `B` = the total), `m` from the pools of section 2, the operator; the tidy form by the clearing rule; reject over the coefficient bound. With **Variables = Two** the "combined" styles are not offered (they need three) and the generator falls back to single-variable ones (R23).
- **Either-or:** pick the capacities from a pool of natural numbers (12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120, 150), all different; `g = gcd`, coefficients `L/a`, `L/b`, right-hand side `L`. Reject a coefficient above 9 (two or three products) or 12 (four), or a right-hand side above 1500. For rate and time pick `T` from 2, 3, 4, 5, 6, 8, 10 hours; for time per item the minutes per item are `60/a`, `60/b`, rejected unless a "nice" fraction (1, 2, 3/2, 4/3, 5/2…).
- **`problem`:** assemble from the same generators, then check with `lp.ts` that the region is non-empty, bounded where it must be, and the optimum is at one vertex (so the model can be reused by the graphical tool). This needs an LP solver for three and four variables, which `lp.ts` has anyway for the simplex.
- **Story:** a context that supports the style; the sentence is a template filled from the same numbers.

## 8. Options (draft; the shell's vocabulary: Title Case, "Ask For", "Working Shown", "Answer Format")

| Option | Where | Values | Effect |
|---|---|---|---|
| Variables | both, both levels | Two; Three; Four (default Two) | changes the numbers: throws away |
| Constraint Styles | `constraint` | Level 1: Resource Use; Comparisons. Level 2: Percentages; Ratios; Either-Or (several ticked; each question draws one) | changes the numbers |
| Constraints Asked | `constraint` | One; Two | changes what is asked: throws away |
| Operator | `constraint` Comparisons and Percentages | At Least; At Most; Exactly (several ticked) | changes the numbers |
| Percentages Of | `constraint` Level 2 | One Variable; Several Combined; The Total (several ticked; Combined and Total need three variables) | changes the numbers |
| Capacity Given As | Either-Or | Most You Could Make; Rate And Time; Time Per Item; Share Of A Requirement (exclusive pool) | changes the numbers |
| Capacity Method | Either-Or | Fractions Of Capacity; Common Units; Both | display only |
| Objective | `problem` | Maximise Profit; Minimise Cost; Either | changes the numbers |
| Integers | `problem` | Say So; Leave Out | changes what is asked: throws away |
| Data Shown | both | Sentences; Table | display only |
| Answer Format | both | As Written; Whole Numbers; Both | display only |
| Working Shown | both | Full; Constraints Only | display only (worked example only) |

Options meaningful at one level only are shown only there (a `requires` option, R23: the generator ignores a blocked option and keeps a fallback). Each option has an `info` sentence (R40) and an `.about.ts` explainer (R11). A group with a single option is not shown (R21).

## 9. Data model, working and tests

**Data model** (`src/shared/decision/lp.ts` and `lpGen.ts`, no React):

```ts
type Fr = readonly [number, number];               // exact, as dim.ts
interface Var { sym: string; noun: string; units?: string; integer: boolean }
interface Constraint {
  coeffs: Fr[]; op: "≤" | "≥" | "="; rhs: Fr;      // canonical: whole numbers, lowest terms
  source: string;                                    // the worded rule it came from
  kind: "resource" | "multiple" | "percent" | "ratio" | "bound" | "capacity" | "remainder";
  holds: (point: Fr[]) => boolean;                   // the meaning in plain terms, written independently of coeffs
}
interface Model { vars: Var[]; sense: "max" | "min"; obj: Fr[]; objConst: Fr; constraints: Constraint[] }
```

**Working (the stepper):** variables; objective (for `problem`); one step per constraint with the words, the translation, the tidying (each line), the check (4.4 for either-or; try-a-number for relationships); then the complete model in the book's layout. A "Common slip" line is shown with the answer, never before. **Picture:** none required; a **bar model** of capacity (one whole bar, a part for A, a part for B, the rest spare) is a candidate for either-or, if `docs/reference/pictures.md` agrees it is one of the core eight; the data table is plain. Print: the worksheet has space to write the model; the answer sheet prints the model solution.

**Tests:**
- **Meaning agrees with algebra:** `holds` against the canonical inequality at every lattice point 0 to 30 (two variables), 0 to 12 (three) and 0 to 8 (four), and at the intercepts, for thousands of draws per sub-tool, level and variable count. `holds` is the independent route: each rule states its meaning as a plain predicate on the original sentence's numbers (for a percentage: the share computed as a fraction of the group's sum; for either-or: the capacity share from `a`, `b`), a different formula from the canonical coefficients.
- **Whole-number form:** every constraint has integer coefficients, `gcd = 1`, leading coefficient positive, within the level's bound.
- **Either-or:** intercepts on the line; fraction form equals the whole-number form at every tested point; rate, time-per-item and most-you-could-make forms agree for the same `a`, `b`, `T`.
- **Wording:** every number in the model is in the sentence and the reverse (a regex over generated text); the operator word is always present; no unreplaced template slot.
- **Acceptance examples:** 3 and 4.6 and the book's worked examples 4.1, 4.3, 4.4, 4.5, 4.6 reproduced line by line.
- **`problem`:** every generated model has a non-empty feasible region and (when the objective is given) a single optimal vertex.
- **Standard:** every KaTeX string renders; seeded replay (R45); a 30-question worksheet of different questions per level, sub-tool and variable count; the fallback rate measured (AGENTS.md).

## 10. Build chunks (each merges on its own; AGENTS.md "small chunks")

| Chunk | Contents | Behind |
|---|---|---|
| F0 | `lp.ts`: exact fractions, `Model`, `Constraint`, the clearing rule, lowest terms, `holds`; tests | nothing (library only) |
| F1 | `lpGen.ts` resource use and direct comparisons (all variable counts and operators); the stepper `LpWorking`; the `constraint` sub-tool on `DecisionShell`, **Level 1**; About words; tests | `enabled: false` (`levels: ["level1"]`) |
| F2 | **Level 2, either-or limits** (Harry's priority): the four forms, three and four products, the check, the slips | `enabled: false` |
| F3 | Level 2, percentages and ratios | `enabled: false` (Level 2 complete) |
| F4 | `problem` Level 1 (with `P = …`); the contexts shared with F1 to F3 | `enabled: false` |
| F5 | `problem` Level 2 (price minus cost, packs, units, table, integers, remainder, "exactly half"); calibration; phone, tablet and laptop check | `enabled: false` |
| F6 | the Decision hub's DD chapter card; spec status; go-live | the switch |
| later | **Test and spot** (a third sub-tool or an "Ask For": which point is feasible; which of three formulations is right), the exam-style chain | |

Either-or is built before percentages and ratios because it is the skill the book has no exercise for; swap F2 and F3 if Harry prefers. `src/registry.ts`, `src/shared/index.ts` and the hub files are shared: each edit is minimal and in its own chunk.

## 11. Decisions for Harry

1. Three tools or one (`specs/linear-programming-tools.md`, section 5).
2. **Is the objective only in `problem`** (Level 1 has `P = …`), or should `constraint` also be able to ask for it (an "Ask For: Constraint | Objective | Both")? Recommended: only in `problem`.
3. Build order: Level 1, then either-or, then percentages and ratios (recommended), or the order of the levels?
4. Default Capacity Method: Fractions Of Capacity (recommended, it is what Harry described), or Both?
5. The bar model for capacity: yes, or leave it plain?
6. Either-or answer: fraction form, whole-number form, or either? Recommended: either accepted, both shown.
7. Four variables is beyond what the book sets (it uses two or three, and `w, x, y, z` only in the simplex): keep it as a stretch option, default Two?
