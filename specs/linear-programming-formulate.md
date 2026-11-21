# Formulating Linear Programmes (DD1) — brief

**Status:** draft (2026-11-21). The first build of the Linear Programming family (`specs/linear-programming-tools.md`). Not `ready` until Harry answers section 11. Nothing is built.

**What this is.** A tool, `lp-formulate`, on `DecisionShell` (own data field `lp`, written working, no network), whose sub-tools each teach one skill of turning a worded problem into variables, objective and constraints. It is built like Work Done (`src/tools/FurtherMechanics/WorkDone.tsx`: single-skill sub-tools, an independent re-derivation of every answer, exam-style chains a later pass). The answer is the **model solution shown by the stepper**; the student is not marked on typed input.

Sources: textbook chapter 4 section 1 and Exercise 4A (worked examples 4.1 to 4.6; the corpus rows L01 to L09, L11 to L14), the AQA specification DD1, and Harry's request for the either-or case ("at most 60 of one and 45 of another", giving 1/60 x + 1/45 y ≤ 1).

---

## 1. The skills, as sub-tools

Seven sub-tools, all DD1, all AS and A2 (section 1 of the book carries no A-level marker; three variables appear there). Order is the order a lesson would go.

| Key | Name | The one skill | Corpus styles |
|---|---|---|---|
| `objective` | Variables and objective | choose and define the variables (with units); write the objective; say maximise or minimise | L01, L13 |
| `resources` | Resource limits | "each item uses … and there is … available" becomes `ax + by ≤ c` | L02, L04 |
| `capacity` | Either-or limits | "at most 60 of A or 45 of B" becomes `x/60 + y/45 ≤ 1`, then whole numbers | L03 and N1 to N5 |
| `relations` | Relationships | "at least twice as many", "no more than three times", percentages and ratios | L05, L07, L09 wording, L11 |
| `remainder` | Totals and remainders | the part not used is the total minus the others; substitute | L06, L08, L12b |
| `model` | Full formulation | all of the above in one problem | L01 to L08, L12a, L13a, L14a |
| `check` | Test and spot | is a point feasible; which formulation is right and what is wrong in the others | L09, N7 |

---

## 2. The either-or limit (`capacity`) in depth

### 2.1 The mathematics

Two products share one resource (a machine, an oven, a worker, a field). Used alone the resource makes at most `a` of X, or at most `b` of Y. Then one X uses `1/a` of the resource and one Y uses `1/b` of it, so the share used is `x/a + y/b`, which cannot exceed the whole resource:

`x/a + y/b ≤ 1`

To clear the fractions multiply by `L = lcm(a, b)`. With `g = gcd(a, b)`:

`(b/g) x + (a/g) y ≤ ab/g`

so the coefficient of x comes from the *other* number (60 and 45: `g = 15`, `3x + 4y ≤ 180`). Three products: `x/a + y/b + z/c ≤ 1`, multiplied by their lcm.

The check that catches nearly every slip: **the intercepts**. Putting `y = 0` must give `x = a`, and `x = 0` must give `y = b`; both must lie exactly on the line.

### 2.2 Ways the situation is given (the option **Capacity Given As**, an exclusive pool)

| Option | The question says | The constraint | Level |
|---|---|---|---|
| Most You Could Make | at most 60 of A, or at most 45 of B, in the time available | `x/60 + y/45 ≤ 1` | 1 |
| Rate And Time | 60 A an hour or 45 B an hour, for 8 hours | `x/60 + y/45 ≤ 8` (also `3x + 4y ≤ 1440`) | 2 |
| Time Per Item | each A takes 1 minute, each B takes 4/3 minutes, 8 hours (480 minutes) | `x + (4/3) y ≤ 480` (also `3x + 4y ≤ 1440`) | 2 |
| Share Of A Requirement | each A supplies 1/60 of the daily requirement, each B 1/45 | `x/60 + y/45 ≥ 1` (a minimising problem) | 3 |

Four checks run on the numbers in every row: `(a, 0)` and `(0, b)` (scaled by the time) lie on the line; the whole-number form is in lowest terms; the fraction form and the whole-number form are equal at every lattice point tested.

### 2.3 Method shown (the option **Capacity Method**, display only; the working changes, the numbers do not)

- **Fractions Of Capacity:** "One A uses 1/60 of the capacity, so x of them use x/60. One B uses 1/45, so y use y/45. Together at most the whole capacity: x/60 + y/45 ≤ 1." Then: "Multiply by 180 (the lowest common multiple of 60 and 45): 3x + 4y ≤ 180."
- **Common Units:** the textbook's way (worked example 4.3): "Suppose the capacity is 180 units. Then each A uses 3 and each B uses 4, so 3x + 4y ≤ 180." (Choose the unit count as `L`.)
- **Both:** the first, then a line saying the second gives the same result.

### 2.4 The check shown at the end of every `capacity` solution

"Check: if only A is made (y = 0) then 3x ≤ 180, x ≤ 60, which is the most of A. If only B is made (x = 0) then 4y ≤ 180, y ≤ 45. ✓" It is the step that teaches a student to test their own work, and it is the same test the later graphical tool uses to plot the line from its intercepts.

### 2.5 The misconceptions the working names ("Common slip" lines)

| Slip | Wrong constraint | Why the check catches it |
|---|---|---|
| multiplying instead of dividing | `60x + 45y ≤ 1` | `y = 0` gives `x ≤ 1/60`, not 60 |
| two separate limits ("and", not "or") | `x ≤ 60` and `y ≤ 45` | allows 60 of A and 45 of B together |
| adding the capacities | `x + y ≤ 105` | allows 105 of A alone |
| swapping the coefficients when clearing fractions | `4x + 3y ≤ 180` | `y = 0` gives `x ≤ 45` |
| forgetting the right-hand side's scale | `3x + 4y ≤ 1` (with the rate form's 8 hours missed) | `y = 0` gives `x ≤ 1/3` |

(These are also the wrong options in `check`.)

### 2.5b Levels for `capacity` (mutually exclusive ranges, R26)

| Level | What changes | The numbers |
|---|---|---|
| 1 | two products, "most you could make" form, total = 1, **fraction form only is asked**, intercepts both ≤ 100 | coefficients after clearing at most 9, `L` at most 360 |
| 2 | **rate and time** or **time per item**; the student gives both the fraction and the whole-number form; two resources (one either-or, one "each uses…") | coefficients at most 15, `L` at most 1500 |
| 3 | **three products**, or the ≥ requirement form, or time per item given in minutes against a total in hours (a unit conversion inside the constraint) | coefficients at most 15; the minimising version |

### 2.6 Worked examples (hand-checked, for the tests and the first look)

1. **60 and 45, most-you-could-make.** "A baker's oven can bake at most 60 loaves or at most 45 cakes in a day, or a mixture." `x/60 + y/45 ≤ 1`, `3x + 4y ≤ 180`.
2. **30 and 50** (the book's example 4.3): `x/30 + y/50 ≤ 1`, `5x + 3y ≤ 150`.
3. **Rate and time:** "60 an hour or 45 an hour, for 8 hours": `x/60 + y/45 ≤ 8`, `3x + 4y ≤ 1440`; intercepts (480, 0) and (0, 360).
4. **Three products (60, 45, 36):** `x/60 + y/45 + z/36 ≤ 1`, lcm 180, `3x + 4y + 5z ≤ 180`.
5. **Requirement (≥):** `x/60 + y/45 ≥ 1`, `3x + 4y ≥ 180`.

---

## 3. The other sub-tools in depth

### 3.1 `objective` — variables and objective

- **Variables:** "x = number of …" with the noun and the units; a pack, a tray, a batch where the item is sold in sixes (L13): then the profit coefficient is the profit per pack, six times the profit per item. A question may ask only for the variables, or only the objective.
- **Objective:** maximise profit, revenue, total number, or minimise cost. **Profit is price minus cost** (Level 2): the common slip is to use the price. The wrong choice in `check`.
- **Levels:** 1 profit per item given; 2 price and cost given (profit worked out) and a pack variable; 3 a cost objective with a fixed charge, or two kinds of cost.

### 3.2 `resources` — resource limits

- Items use quantities of one limited resource: `ax + by ≤ c`. Level 1: one resource, units already matching. Level 2: units to convert (minutes against hours, kg against tonnes). Level 3: three or four resources from a **table** (the display option Data Shown: Sentences or Table; display only).
- The model solution lists each constraint with the words it came from. Each line includes the units.

### 3.3 `relations` — relationships between the amounts

Slots: `x ≥ ky` ("at least k times as many x as y", "no more than k times"); a bound ("at least 10 of x"); a percentage of the total (`x ≥ 0.2(x + y)`, shown in two steps: the translation, then the tidy form `4x − y ≥ 0`); a range of percentages (two constraints); a ratio ("x to y at least 2 to 3": `3x ≥ 2y`); a difference ("x exceeds y by at least 5"). The textbook's own check is taught as a step: **try a number** (if x = 15, the flowers are at least 30, so `y ≥ 2x` and not `x ≥ 2y`). The reversal is the named slip. Percentages of a **fixed total** (the book's 2500 calories) become plain numbers.

- **Levels:** 1 one relationship, whole-number ratio; 2 percentages and "at most"/"at least" mixed; 3 percentage of a total that includes the variables themselves, or two relationships on three variables.

### 3.4 `remainder` — totals and remainders

A total `T` is split over three uses; the third is the remainder. The remainder variable is not defined: it is `T − x − y`, which must be non-negative, giving the constraint `x + y ≤ T`; the objective is written with the substitution (4x + 5y + 3(40 − x − y) = 120 − x + 2y in the book). Three-variable version (time: study, study, sleep): define three variables, then use up all the time to remove one (the book's example 4.6b). The "exactly half is Supreme" form (L12b): a stated relation between variables removes one.

- **Levels:** 1 the remainder only (cost of the unused part); 2 the remainder plus a relation; 3 three variables, then reduction to two.

### 3.5 `model` — full formulation

All of the parts together, in the order the exam asks: define variables, objective, constraints, non-negativity and "integers". Contexts draw two or three kinds of constraint from the library below (including an either-or one). Levels: 1 two kinds; 2 three kinds and units; 3 three variables or a table, a fixed total with a remainder, and integer or not (L13d: why the real profit may be lower).

### 3.6 `check` — test and spot

- **Test a point:** four points, which is feasible (L09), and "which constraint does this point break". The student evaluates; no picture.
- **Spot the error:** the Work it out 4.1 shape. Three candidate formulations of the same worded problem, one correct; the others each carry one named slip from the list in section 2.5 or 3.3. The model solution names the slip for each wrong one. Levels: 1 one wrong thing per candidate; 2 candidates differ in several places; 3 all three look reasonable and differ only in inequality direction or a coefficient.

---

## 4. Contexts

One shared library, used by all three LP tools later. Each context states: the two (or three) items, the plural noun phrases for "make", the units, a profit range, a resource name and whether it fits either-or, rate, time-per-item or share-of-requirement. Suggested set: a bakery (loaves, cakes), a print shop (posters, leaflets), a workshop (chairs, tables), a farm (two crops; land is a total with a remainder), a café (two lunch deals), a charity (two kinds of parcel), a gym or study plan (hours as a total). Realistic ranges only; no real brands.

## 5. Generation: equations first (as in Mechanics)

A generator never writes the words first. For each constraint it picks the **integer form**, derives everything else from it, then writes the sentence from the same numbers.

- **Either-or:** pick the items' capacities `a, b` from a pool of natural numbers (12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120, 150) with `a ≠ b`; `g = gcd(a, b)`, coefficients `b/g` and `a/g`, right-hand side `ab/g`. Reject when a coefficient exceeds the level's bound, or the right-hand side exceeds the level's bound. For rate and time pick `T` from 2, 3, 4, 5, 6, 8, 10 hours; for time per item the minutes per item are `60/a`, `60/b` when the rate is per hour (rejected if not a "nice" fraction: 1, 2, 3/2, 4/3, 5/2, …).
- **Resources:** pick the coefficient matrix and available amounts so a nonempty region exists with a sensible optimum (a later check, since Tool 2 will use the same model).
- **Relations:** pick the multiplier `k` (2, 3, 4, 3/2), the percentage (10 to 90 in tens or twenty-fives) and the direction; tidy form from the same numbers.
- **Remainder:** pick the total, the three unit costs (all different), and the bounds.
- **Story:** choose a context that matches the constraint kind; the sentence is a template filled from the same numbers, so wording and model cannot disagree. The step cascade shows each constraint's source words next to it.

## 6. Data model (no React, `src/shared/decision/lp.ts` and `lpGen.ts`)

```ts
type Fr = readonly [number, number];               // exact, as dim.ts
interface Var { sym: string; noun: string; units?: string; integer: boolean }
interface Constraint {
  coeffs: Fr[]; op: "≤" | "≥" | "="; rhs: Fr;      // canonical, all integers after tidying
  source: string;                                    // the worded rule it came from
  kind: "resource" | "capacity" | "relation" | "percent" | "remainder" | "bound";
  holds: (point: Fr[]) => boolean;                   // the meaning in plain terms, written independently of coeffs
}
interface Model { vars: Var[]; sense: "max" | "min"; obj: Fr[]; objConst: Fr; constraints: Constraint[] }
```

`holds` is the independent route in the tests: each rule states its *meaning* as a plain predicate on a point (for the either-or limit: the share of capacity used, computed from the capacities `a` and `b` with a different formula from the canonical coefficients), and a test checks `holds` and the canonical inequality agree at every lattice point from 0 to 30 in each variable, plus the intercepts.

## 7. Display and working

- **Question:** a worded problem (KaTeX only for the algebra; plain text for prose); a data table when the option asks. Fractions are shown as fractions in the fraction form. Whole-number forms never use units inside KaTeX (R4).
- **Working (the stepper):** step 1 variables; step 2 objective; step 3 onward one per constraint, each showing the words, the translation, the tidy form (and for `capacity` the check of 2.4); a final step with the complete model in the textbook's layout ("Maximise P = …", "subject to:", one constraint per line, non-negativity and integers). A "Common slip" line appears in the step where it matters, never before the student has tried (Show Answer reveals them).
- **Picture:** none required. Candidate: a **bar model** of the capacity (one whole bar, a part for the share used by A, a part for B, the rest spare), if `docs/reference/pictures.md` agrees it is one of the core eight. Decide when `capacity` is built.
- **Print:** the worksheet prints the questions with space to write the model; the answer sheet prints the model solution.
- Phone, tablet and laptop sizes as for every Decision tool.

## 8. Options (draft; the shell's vocabulary: Title Case, "Ask For", "Working Shown", "Answer Format")

| Option | Where | Values | Effect |
|---|---|---|---|
| Capacity Given As | `capacity` | Most You Could Make; Rate And Time; Time Per Item; Share Of A Requirement (exclusive pool) | changes the numbers: throws the question away |
| Capacity Method | `capacity` | Fractions Of Capacity; Common Units; Both | display only |
| Products | `capacity`, `model` | Two; Three | changes the numbers |
| Constraint Types | `model` | Resource Limits; Either-Or Limits; Relationships; Totals And Remainders (several may be ticked; each constraint slot draws one) | changes the numbers |
| Objective | `objective`, `model` | Maximise Profit; Minimise Cost; Either | changes the numbers |
| Integers | `model` | Say So; Leave Out | changes what is asked: throws away |
| Data Shown | `resources`, `model` | Sentences; Table | display only |
| Answer Format | all | As Written; Whole Numbers; Both | display only |
| Working Shown | all | Full; Constraints Only | display only (worked example only) |

Each option has an `info` sentence (R40) and an `.about.ts` explainer (R11). Groups with a single option are not shown (R21).

## 9. Tests

- **Meaning agrees with algebra:** `holds` against the canonical inequality at every lattice point 0 to 30 (two variables) and 0 to 12 (three), and at the intercepts, for thousands of draws per sub-tool and level.
- **Capacity:** intercepts on the line; the whole-number form in lowest terms; fraction form equals the whole-number form at every tested point; time-per-item and rate forms agree with the most-you-could-make form for the same `a`, `b`, `T`.
- **Wording:** every number in the model appears in the sentence and every number in the sentence is in the model (a regex over generated text); no unreplaced template slot.
- **Spot the error:** exactly one candidate is correct; each wrong candidate fails `holds` at a named test point and is labelled with its slip.
- **Acceptance examples** of 2.6 and the book's worked examples 4.1, 4.3, 4.4, 4.5, 4.6 reproduced line by line.
- **Standard:** every KaTeX string renders; seeded replay (R45); a 30-question worksheet of different questions per level and per sub-tool; the fallback rate measured (AGENTS.md).

## 10. Build chunks (each merges on its own; AGENTS.md "small chunks")

| Chunk | Contents | Behind |
|---|---|---|
| F0 | `lp.ts`: exact fractions, `Model`, `Constraint`, lowest-terms, tidy form, `holds`; tests | nothing (library only) |
| F1 | `lpGen.ts` capacity and resources generators and the contexts; `LpWorking` (the stepper); the `capacity` and `resources` sub-tools on `DecisionShell`; About words; tests | `enabled: false` |
| F2 | `objective`, `relations` | `enabled: false` |
| F3 | `remainder`, `check` | `enabled: false` |
| F4 | `model` (the chain), calibration, phone/tablet/laptop check | `enabled: false` |
| F5 | hub pairings (the DD chapter card), spec statuses, go-live | the switch |

`capacity` is first because it is the skill the book has no exercise for. `src/registry.ts`, `src/shared/index.ts` and the hub files are shared: each edit is minimal and in its own chunk.

## 11. Decisions for Harry

1. Three tools or one (`specs/linear-programming-tools.md` section 5).
2. Is the model solution shown enough, or should the student type constraints and be checked (a bigger build: an expression-equivalence checker)? Recommended: model solution now; checking a later extension.
3. Order: `capacity`, then `resources`, then the rest (recommended), or `objective` first because it is the start of every problem?
4. Is "Both" the default for Capacity Method? Recommended: Fractions Of Capacity, because it is what Harry described.
5. The bar model for capacity: yes or leave it plain?
6. Is a student expected to give the constraint in fraction form, whole-number form, or either? Recommended: either accepted, both shown.
