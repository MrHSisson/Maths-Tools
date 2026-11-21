# Formulating Linear Programmes (DD1) — brief

**Status:** draft, revised 2026-11-21 (two sub-tools; the first draft had seven). The first build of the Linear Programming family (`specs/linear-programming-tools.md`). Not `ready` until Harry answers section 11. Nothing is built.

**What this is.** A tool, `lp-formulate`, on `DecisionShell` (own data field `lp`, written working, no network), with **two sub-tools**:

1. **Write a constraint** (`constraint`): a short situation, and the student writes one constraint (sometimes a small set). The **level is the style of constraint**: 1 resource use, 2 comparisons and percentages, 3 either-or limits.
2. **Formulate a problem** (`problem`): the whole thing, mixed, as the exam sets it: define the variables, write the objective, write every constraint, say non-negativity and integers. Its levels use the same styles as the first sub-tool, added level by level.

So a student learns each style of constraint on its own (sub-tool 1), then meets them mixed (sub-tool 2). The answer is the **model solution shown by the stepper**; the student is not marked on typed input. Built like Work Done (`src/tools/FurtherMechanics/WorkDone.tsx`): an independent re-derivation of every answer, exam-style chains a later pass.

Sources: textbook chapter 4 section 1 and Exercise 4A (worked examples 4.1 to 4.6; corpus rows L01 to L09, L11 to L14), the AQA specification DD1, and Harry's requests: the resource case (10 used for x, 15 for y, 300 in total: 10x + 15y ≤ 300) and the either-or case ("at most 60 of one and 45 of another", giving 1/60 x + 1/45 y ≤ 1).

---

## 1. The two sub-tools and their levels

| | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **`constraint` Write a constraint** (levels = style) | **Resource use:** each x uses 10, each y uses 15, 300 available: `10x + 15y ≤ 300` | **Comparisons and percentages:** "at least twice as many", "at most 30% of the total", bounds, ratios | **Either-or limits:** "at most 60 of A or 45 of B": `x/60 + y/45 ≤ 1`; rate and time; three products |
| **`problem` Formulate a problem** (levels = how many styles, and the objective) | two variables, resource limits only; objective given as a profit per item; define variables, objective, constraints, non-negativity | adds comparisons and percentages; profit is price minus cost; a pack variable; units; "integers"; data as a table | adds either-or limits, a remainder to substitute out, three variables, "exactly half" |

Corpus styles: `constraint` L1 L02 L04 L09(wording) · L2 L05 L07 L11 · L3 L03 (and new styles N1 to N5, section 3). `problem` L1 L01 L02 · L2 L01 L05 L07 L13 · L3 L03 L06 L08 L12 L14a. A third sub-tool, **Test and spot** (L09, N7: which point is feasible; which of three formulations is right and what is wrong in the others), is a later addition (section 10).

---

## 2. `constraint` — Level 1: resource use

A short situation: two items each use some of one limited resource; the amount available is stated.

- **Forms:** `ax + by ≤ c` ("each X uses 10 minutes, each Y uses 15, there are 300 minutes": `10x + 15y ≤ 300`); `≥` when a minimum has to be met ("each X supplies 10 units, each Y 15, at least 300 are needed"); a single-item version (one resource used by one item) as the very first step in the level.
- **Numbers:** whole numbers, coefficients 2 to 20, right-hand side a round number, units matching (no conversion at this level). The constraint is given back with its non-negativity ("x ≥ 0, y ≥ 0" shown once; the book states it every time).
- **Constraints Asked** (the option, section 8): **One** constraint, or **Two** (two resources of the same style, so the student writes a pair, which is the bridge to `problem`).
- **Working:** "x = number of X, y = number of Y. X uses 10 each, so x of them use 10x. Y uses 15 each, so y use 15y. Together at most 300: 10x + 15y ≤ 300."
- **Common slip** (shown with the answer): the coefficients written the wrong way round (`15x + 10y`), or the total used as a coefficient; the check is to test a simple case: "if only X is made, 10x ≤ 300, so x ≤ 30".

## 3. `constraint` — Level 2: comparisons and percentages

The constraint relates the two amounts to each other, or to the total. The right-hand side is usually 0 (or a small number) and the tidy form moves everything to one side.

| Style | The sentence | Translation → tidy form |
|---|---|---|
| multiple | "at least twice as many X as Y" | `x ≥ 2y` → `x − 2y ≥ 0` |
| multiple, at most | "no more than three times as many Y as X" | `y ≤ 3x` → `3x − y ≥ 0` |
| difference | "X exceeds Y by at least 5" | `x ≥ y + 5` → `x − y ≥ 5` |
| bound | "at most 40 of X", "at least 10 of Y" | `x ≤ 40`, `y ≥ 10` |
| total | "no more than 50 in all" | `x + y ≤ 50` |
| ratio | "the ratio of X to Y is at least 2 : 3" | `x/y ≥ 2/3` → `3x ≥ 2y` → `3x − 2y ≥ 0` |
| percentage of the total | "at least 20% of the items are X" | `x ≥ 0.2(x + y)` → `4x − y ≥ 0` |
| percentage, at most | "at most 30% are Y" | `y ≤ 0.3(x + y)` → `3x − 7y ≥ 0` |
| a range of percentages | "between 20% and 30% are X" | two constraints (a pair) |
| percentage of a fixed total | "X supplies at most 20% of the 2500 calories, 80 each" | `80x ≤ 500` |

- **The check that is taught (the book's own):** try a number. "If x = 15 then y must be at least 30" tells a student whether it is `y ≥ 2x` or `x ≥ 2y`. The reversal is the named slip.
- **Percent of the total** includes the variables themselves, so the tidy form comes from `0.2(x + y)`: the working shows the bracket, then the tidying, step by step.
- **Constraint Styles** (the option, a pool; several can be ticked; each question draws one): Multiples; Bounds And Totals; Ratios; Percentages. Percentages are the hardest and are ticked by default only from the shell's default level settings (decided at calibration).

## 4. `constraint` — Level 3: either-or limits

The case Harry asked for. The book has one example (worked example 4.3) and no exercise.

### 4.1 The mathematics

Two products share one resource (a machine, an oven, a worker, a field). Used alone the resource makes at most `a` of X, or at most `b` of Y. Then one X uses `1/a` of it and one Y uses `1/b`, so the share used is `x/a + y/b`, which cannot exceed the whole:

`x/a + y/b ≤ 1`

Multiply by `L = lcm(a, b)`; with `g = gcd(a, b)`:

`(b/g) x + (a/g) y ≤ ab/g`

so the coefficient of x comes from the *other* number (60 and 45: `g = 15`, `3x + 4y ≤ 180`). Three products: `x/a + y/b + z/c ≤ 1`, multiplied by their lcm. The check that catches nearly every slip is the **intercepts**: `y = 0` must give `x = a`, and `x = 0` must give `y = b`.

### 4.2 Ways it is given (the option **Capacity Given As**, an exclusive pool)

| Option | The question says | The constraint |
|---|---|---|
| Most You Could Make | at most 60 of A, or at most 45 of B, in the time available | `x/60 + y/45 ≤ 1` |
| Rate And Time | 60 A an hour or 45 B an hour, for 8 hours | `x/60 + y/45 ≤ 8` (also `3x + 4y ≤ 1440`) |
| Time Per Item | each A takes 1 minute, each B takes 4/3 minutes, 8 hours (480 minutes) | `x + (4/3) y ≤ 480` (also `3x + 4y ≤ 1440`); includes the minutes-to-hours conversion |
| Share Of A Requirement | each A supplies 1/60 of the daily requirement, each B 1/45 | `x/60 + y/45 ≥ 1` (a minimising situation) |

The option **Products** (Two | Three) adds a third item (60, 45, 36: `3x + 4y + 5z ≤ 180`).

### 4.3 Method shown (the option **Capacity Method**, display only; the working changes, the numbers do not)

- **Fractions Of Capacity:** "One A uses 1/60 of the capacity, so x of them use x/60. One B uses 1/45, so y use y/45. Together at most the whole capacity: x/60 + y/45 ≤ 1. Multiply by 180 (the lowest common multiple of 60 and 45): 3x + 4y ≤ 180."
- **Common Units:** the book's way: "Suppose the capacity is 180 units. Then each A uses 3 and each B uses 4, so 3x + 4y ≤ 180."
- **Both:** the first, then a line saying the second gives the same result.

### 4.4 The check shown at the end of every solution

"Check: if only A is made (y = 0) then 3x ≤ 180, so x ≤ 60, the most of A. If only B is made (x = 0) then 4y ≤ 180, so y ≤ 45. ✓" It teaches a student to test their own work, and it is the same test the graphical tool uses to plot the line from its intercepts.

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

---

## 5. `problem` — Formulate a problem

The whole model: **variables** (the noun and units), **objective** (and maximise or minimise), **constraints**, **non-negativity**, **integers** where the items are whole. The model solution is laid out as the book does it ("Maximise P = …", "subject to:", one constraint per line).

| Level | Constraint styles | Objective and variables | Textbook |
|---|---|---|---|
| 1 | resource limits only (two or three of the Level 1 constraint style), all ≤ | profit per item given; two variables | WE4.1, Ex4A 4 |
| 2 | adds comparisons, percentages, bounds (Level 2 style) and ≥ | profit is price minus cost (the slip is to use the price); a pack variable (a tray of six: the coefficient is six times the item's); unit conversions; "integers"; the data as a table | WE4.4, WE4.5, Ex4A 5, MP3, MP9 |
| 3 | adds either-or limits, a **remainder** to substitute out, **three variables**, "exactly half" relations | a cost objective with a constant after substitution; three variables reduced to two by using all the time | WE4.3, WE4.4, WE4.6, MP11b |

**The remainder** (the book's turf): a total `T` is split three ways and the third use is the remainder `T − x − y`. It is never defined as a variable; non-negativity of the remainder gives `x + y ≤ T`; the objective is written with the substitution (4x + 5y + 3(40 − x − y) = 120 − x + 2y). **Three variables** (study, study, sleep): define all three, then use up all the time to remove one (the book's example 4.6b). **The pieces are the `constraint` levels** — nothing here is new maths, only the assembly, so the generator reuses the Level 1 to 3 rules of `constraint`.

---

## 6. Contexts

One shared library, used by all three LP tools later. Each context states the two or three items, the units, a profit range, and which constraint styles it supports (resource use, comparisons, percentages, either-or, remainder). Suggested set: a bakery (loaves, cakes), a print shop (posters, leaflets), a workshop (chairs, tables), a farm (two crops; land is a total with a remainder), a café (two lunch deals), a charity (two kinds of parcel), a study plan (hours as a total). Realistic ranges only; no real brands.

## 7. Generation: equations first (as in Mechanics)

A generator never writes the words first. For each constraint it picks the **integer form**, derives everything else, then writes the sentence from the same numbers, so wording and model cannot disagree.

- **Resource use:** coefficients and the available amount whole numbers, the amount a round number, and at least one of the "if only this item is made" answers a whole number of items.
- **Comparisons and percentages:** pick the multiplier `k` (2, 3, 4, 3/2), the percentage (10 to 90 in tens or twenty-fives) and the direction; the tidy form from the same numbers; reject a percentage whose tidy form needs a coefficient above 20.
- **Either-or:** pick the capacities `a, b` from a pool of natural numbers (12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120, 150) with `a ≠ b`; `g = gcd(a, b)`; coefficients `b/g`, `a/g`, right-hand side `ab/g`. Reject a coefficient above 9 (Products Two) or 12 (Three), or a right-hand side above 1500. For rate and time pick `T` from 2, 3, 4, 5, 6, 8, 10 hours; for time per item the minutes per item are `60/a`, `60/b`, rejected unless a "nice" fraction (1, 2, 3/2, 4/3, 5/2…).
- **`problem`:** assemble from the same generators, then reject an empty or unbounded feasible region and an objective that has no sensible optimum (the model will be used by the graphical tool later, so it must be a good problem).
- **Story:** pick a context that supports the style; the sentence is a template filled from the same numbers.

## 8. Options (draft; the shell's vocabulary: Title Case, "Ask For", "Working Shown", "Answer Format")

| Option | Where | Values | Effect |
|---|---|---|---|
| Constraints Asked | `constraint` (all levels) | One; Two | changes what is asked: throws away |
| Constraint Styles | `constraint` Level 2 | Multiples; Bounds And Totals; Ratios; Percentages (several ticked) | changes the numbers |
| Capacity Given As | `constraint` Level 3 | Most You Could Make; Rate And Time; Time Per Item; Share Of A Requirement (exclusive pool) | changes the numbers |
| Products | `constraint` Level 3, `problem` | Two; Three | changes the numbers |
| Capacity Method | `constraint` Level 3, `problem` Level 3 | Fractions Of Capacity; Common Units; Both | display only |
| Objective | `problem` | Maximise Profit; Minimise Cost; Either | changes the numbers |
| Integers | `problem` | Say So; Leave Out | changes what is asked: throws away |
| Data Shown | both | Sentences; Table | display only |
| Answer Format | both | As Written; Whole Numbers; Both | display only |
| Working Shown | both | Full; Constraints Only | display only (worked example only) |

Options that only make sense at one level are shown only there (a `requires` option, R23: the generator ignores one that is blocked and keeps a fallback). Each option has an `info` sentence (R40) and an `.about.ts` explainer (R11). A group with a single option is not shown (R21).

## 9. Data model, working and tests

**Data model** (`src/shared/decision/lp.ts` and `lpGen.ts`, no React):

```ts
type Fr = readonly [number, number];               // exact, as dim.ts
interface Var { sym: string; noun: string; units?: string; integer: boolean }
interface Constraint {
  coeffs: Fr[]; op: "≤" | "≥" | "="; rhs: Fr;      // canonical, whole numbers after tidying
  source: string;                                    // the worded rule it came from
  kind: "resource" | "multiple" | "percent" | "ratio" | "bound" | "capacity" | "remainder";
  holds: (point: Fr[]) => boolean;                   // the meaning in plain terms, written independently of coeffs
}
interface Model { vars: Var[]; sense: "max" | "min"; obj: Fr[]; objConst: Fr; constraints: Constraint[] }
```

**Working (the stepper):** variables; objective (for `problem`); one step per constraint with the words, the translation, the tidy form (and, for either-or, the check of 4.4); then the complete model in the book's layout. A "Common slip" line is shown with the answer, never before the student has tried. **Picture:** none required; a **bar model** of capacity (one whole bar, a part for A, a part for B, the rest spare) is a candidate for Level 3, if `docs/reference/pictures.md` agrees it is one of the core eight; the data table is plain. Print: the worksheet has space to write the model; the answer sheet prints the model solution.

**Tests:**
- **Meaning agrees with algebra:** `holds` against the canonical inequality at every lattice point 0 to 30 (two variables) and 0 to 12 (three), and at the intercepts, for thousands of draws per sub-tool and level. `holds` is the independent route: each rule states its meaning as a plain predicate (for either-or: the share of capacity used from `a` and `b`, a different formula from the canonical coefficients).
- **Either-or:** intercepts on the line; the whole-number form in lowest terms; the fraction form equals the whole-number form at every tested point; rate, time-per-item and most-you-could-make forms agree for the same `a`, `b`, `T`.
- **Wording:** every number in the model is in the sentence and the reverse (a regex over generated text); no unreplaced template slot.
- **Acceptance examples:** 4.6 and the book's worked examples 4.1, 4.3, 4.4, 4.5, 4.6 reproduced line by line.
- **`problem`:** every generated model has a non-empty feasible region (found by `lp.ts`) and a single optimal vertex when the objective is given.
- **Standard:** every KaTeX string renders; seeded replay (R45); a 30-question worksheet of different questions per level and per sub-tool; the fallback rate measured (AGENTS.md).

## 10. Build chunks (each merges on its own; AGENTS.md "small chunks")

| Chunk | Contents | Behind |
|---|---|---|
| F0 | `lp.ts`: exact fractions, `Model`, `Constraint`, lowest terms, tidy form, `holds`; tests | nothing (library only) |
| F1 | `lpGen.ts` resource use; the stepper `LpWorking`; the `constraint` sub-tool on `DecisionShell` at **Level 1**; About words; tests | `enabled: false` (`levels: ["level1"]`) |
| F2 | **Level 3, either-or limits** (Harry's priority): all four forms, Products, the check, the slips | `enabled: false` (levels 1 and 3 for now) |
| F3 | Level 2: comparisons and percentages | `enabled: false` |
| F4 | `problem` Levels 1 and 2; contexts shared with F1 to F3 | `enabled: false` |
| F5 | `problem` Level 3 (either-or, remainder, three variables); calibration; phone, tablet and laptop check | `enabled: false` |
| F6 | the Decision hub's DD chapter card; spec status; go-live | the switch |
| later | Test and spot (a third sub-tool or an "Ask For" option: which point is feasible; which of three formulations is right), the exam-style chain | |

Either-or is built before Level 2 because it is the skill the book has no exercise for; swap F2 and F3 if Harry prefers the order of the levels. `src/registry.ts`, `src/shared/index.ts` and the hub files are shared: each edit is minimal and in its own chunk.

## 11. Decisions for Harry

1. Three tools or one (`specs/linear-programming-tools.md`, section 5).
2. Model solution shown (recommended), or the student types constraints and is checked (a bigger build, an expression-equivalence checker; a later extension)?
3. Build order: Level 1, then **either-or**, then Level 2 (recommended, as the book has no exercise on either-or), or the order of the levels?
4. Percentages: in Level 2 with the comparisons, or a harder tier of their own? (A percentage of the total including the variables is much harder than "twice as many".)
5. Default Capacity Method: Fractions Of Capacity (recommended, it is what Harry described), or Both?
6. The bar model for capacity: yes, or leave it plain?
7. Is a student expected to give the either-or constraint in fraction form, whole-number form, or either? Recommended: either accepted, both shown.
