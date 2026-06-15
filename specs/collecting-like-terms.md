# Tool Spec: Collecting Like Terms

**Status:** implemented

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Collecting Like Terms |
| Tool id / URL path | `/collecting-like-terms` |
| Category | Algebra |
| Card description | Practise identifying and collecting like terms across single and multiple variable expressions, from basic addition to multi-variable simplification. |
| Defaults | standard |

**Pedagogical intent:** Students should be able to identify like terms within an expression, group them by type, and simplify by collecting each group — understanding that only terms with identical variables and powers can be combined. This tool sits after introduction to algebraic notation and term types, and before expanding brackets or simplifying algebraic fractions.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `subtool1` | Spot the Like Term | simple | Circle the like term: |
| `subtool2` | Single Variable | simple | Simplify: |
| `subtool3` | Multiple Variables | simple | Simplify: |

---

## 3. Sub-tool detail

---

### Sub-tool: Spot the Like Term (`subtool1`)

#### 3.1 Question options (QO)

- **multiSelect** `questionPool` — "Question Types":
  - `singleVar` — "Single variable terms" — defaultActive: true
  - `withPowers` — "Include squared and higher powers" — defaultActive: true
  - `withConstants` — "Include constants as distractors" — defaultActive: true

- **Per-level differences:**
  - L1: `singleVar` defaultActive: true, `withPowers` defaultActive: true, `withConstants` defaultActive: true. Two-variable targets not available.
  - L2: same as L1. Negative coefficients always active (not a QO toggle).
  - L3: additional toggle — `twoVariableTargets` — "Two-variable target terms" — defaultActive: false. Five options shown. Instruction line reads: "Circle any like terms. There may be zero."

#### 3.2 Levels

**Level 1 (confidence builder):**
- Parameters:
  - Target term: `a * v^n` where variable `v` drawn from {x, y, c, a, w, v, m, n, s, t, k}, power `n` in 1–5, coefficient `a` in 2–9, all positive.
  - 4 options displayed in randomised order.
  - Exactly 1 correct answer (true like term).
- Option construction:
  - **True like term:** same variable, same power, different coefficient (drawn from 2–9, excluding `a`).
  - **Distractor A (shares coefficient only):** same coefficient `a`, different variable, different power.
  - **Distractor B (shares variable only):** same variable `v`, different coefficient, different power.
  - **Distractor C (shares power only):** same power `n`, different variable, different coefficient. May be a constant (e.g. `5`) when `n = 1` or as a wild card slot.
  - **Wild card (shares nothing):** different variable, different power, different coefficient. May be a constant.
  - From the three distractor types (A, B, C) plus wild card, always include the wild card and at least two of A, B, C — totalling exactly 3 distractors + 1 true like term = 4 options.
- Constraints:
  - All four options must be visually distinct.
  - No option may be identical to the target term.
  - Coefficient of true like term must differ from target coefficient.
  - All coefficients positive at L1.
- Exclusions:
  - Do not generate a distractor that accidentally matches the target on both variable and power (that would be a second correct answer).
  - Do not reuse the same variable letter for two different distractor roles in the same question.
- Misconceptions targeted:
  - "Same coefficient means like term" — Distractor A shares the coefficient but differs on both variable and power, so a student fixating on the number alone circles a wrong answer.
  - "Same variable means like term" — Distractor B shares the variable but has a different power, catching students who ignore the power.
  - "Same power means like term" — Distractor C shares the power but has a different variable.

**Level 2 (standard KS3/GCSE domain):**
- Parameters:
  - Target term: `a * v^n`, coefficient `a` in 2–9, **always positive**. Power `n` in 1–5. Variable from full pool.
  - 4 options in randomised order. Exactly 1 correct answer.
  - Negative coefficients now appear on distractors and the true like term (same magnitude as target, sign may vary).
- Option construction:
  - **True like term:** same variable, same power. Coefficient may be positive or negative, and need not equal `a` in magnitude.
  - **Near miss A:** same variable `v`, adjacent or nearby power (n ± 1, staying in 1–5). Coefficient is `+a` or `-a` (magnitude echoed from target).
  - **Near miss B:** different variable, same power `n`. Coefficient is `+a` or `-a` (magnitude echoed from target).
  - **Wild card:** a constant (e.g. `4` or `-4`) or a two-variable term (e.g. `4xy`), coefficient magnitude echoed where possible.
- Constraints:
  - Target is always positive coefficient.
  - Near miss A and Near miss B both echo the target coefficient magnitude (± sign varies randomly).
  - True like term coefficient may differ in both magnitude and sign from target.
  - All four options visually distinct.
- Exclusions:
  - Do not generate near miss A and near miss B with identical expressions.
  - Do not allow any distractor to share both variable and power with the target.
- Misconceptions targeted:
  - "Same coefficient AND same variable = like term" — Near miss A has both but wrong power; student who uses this rule circles it wrongly.
  - "Same coefficient AND same power = like term" — Near miss B has both but wrong variable.
  - "Negative coefficient means different term type" — True like term may be negative while target is positive, exposing this misconception.
  - The coefficient echo across near misses maximises surface similarity, so students cannot rely on the number to discriminate.

**Level 3 (stretch):**
- Parameters:
  - **Single-variable mode (default):** target `a * v^n`, coefficient in 2–9 positive or negative, power 1–5. 5 options displayed. 0, 1, or 2 correct answers. Instruction line: "Circle any like terms. There may be zero."
  - **Two-variable mode (QO toggle):** target `a * v^n * w^m`, combined power n + m ≤ 5, n ≥ 1, m ≥ 1. Variables `v` and `w` drawn from pool (distinct letters). 5 options.
- Single-variable option construction (5 options, 0–2 correct):
  - When 1 correct: true like term (same variable, same power, any coefficient including negative).
  - When 2 correct: true like term + a negative-coefficient version (e.g. target `3x²`, correct answers `7x²` and `-5x²`).
  - When 0 correct: all 5 options are distractors — wrong variable, wrong power, or constant.
  - Remaining options (up to 5 total): near miss (wrong power), near miss (wrong variable), wild card (constant or two-variable term), coefficient echo distractor.
- Two-variable option construction (5 options, 0–2 correct):
  - **True like term:** same variables, same powers on each, different coefficient.
  - **Commutativity trap:** variables swapped in order (e.g. `yx^2` if target is `x^2 * y`) — this IS a like term and counts as a correct answer. Always included in two-variable questions.
  - **Near miss A:** same variables, one power nudged by 1 (e.g. `x^3 * y` if target is `x^2 * y`).
  - **Near miss B:** one variable replaced by a third letter, same powers.
  - **Wild card:** single-variable term sharing one of the target's variables (e.g. `3x`).
  - When 2 correct answers: true like term + commutativity trap.
  - When 1 correct: commutativity trap only (tests the most targeted misconception), or true like term only.
  - When 0 correct: all 5 are distractors.
- Constraints:
  - All 5 options visually distinct.
  - Combined power of two-variable target and all two-variable options ≤ 5.
  - Target coefficient may be positive or negative at L3.
  - The "may be zero" hint is always shown in the instruction line at L3 regardless of whether a specific question has zero correct answers.
- Exclusions:
  - Do not generate a question where 3 or more options are correct.
  - Do not allow two options to be identical.
- Misconceptions targeted:
  - "Variable order matters in a term" — commutativity trap catches students who reject `yx^2` as unlike `x^2 * y`.
  - "Negative coefficient = different term type" — negative true like term when target is positive (and vice versa).
  - "There must always be at least one answer" — 0-correct case breaks conditioned expectation.
  - "Both variables present = like term" — near miss B has both variables but wrong power on one.

#### 3.3 Worked example script

**L1 example — target: `3x^2`, options: `5x^2`, `3x^3`, `3y`, `7`**

1. `tStep("Check each option — a like term must share the same variable AND the same power.")`
2. `mStep("Check 5x^2:", "")` then `tStep("Same variable x, same power 2 — this IS a like term ✓")`
3. `mStep("Check 3x^3:", "")` then `tStep("Same variable x, but power is 3 not 2 — different power, not a like term ✗")`
4. `mStep("Check 3y:", "")` then `tStep("Same coefficient, but different variable — not a like term ✗")`
5. `mStep("Check 7:", "")` then `tStep("No variable — a constant, not a like term ✗")`
6. `mStep("Answer:", "5x^2")`

**L2 example — target: `4x^2`, options: `-7x^2`, `4x^3`, `-4y^2`, `4`**

1. `tStep("Check each option — same variable AND same power required. Sign does not affect term type.")`
2. `mStep("Check -7x^2:", "")` then `tStep("Same variable x, same power 2. The negative sign does not change the term type — this IS a like term ✓")`
3. `mStep("Check 4x^3:", "")` then `tStep("Same variable x, same coefficient magnitude, but power is 3 not 2 — different power, not a like term ✗")`
4. `mStep("Check -4y^2:", "")` then `tStep("Same power 2, same coefficient magnitude, but different variable — not a like term ✗")`
5. `mStep("Check 4:", "")` then `tStep("No variable — a constant, not a like term ✗")`
6. `mStep("Answer:", "-7x^2")`

**L3 single-variable example — target: `3x^2`, options: `7x^2`, `-5x^2`, `3x^3`, `4y^2`, `6`**

1. `tStep("Check each option — there may be zero like terms or more than one. Sign does not affect term type.")`
2. `mStep("Check 7x^2:", "")` then `tStep("Same variable x, same power 2 — this IS a like term ✓")`
3. `mStep("Check -5x^2:", "")` then `tStep("Same variable x, same power 2. Negative sign does not change the term type — this IS a like term ✓")`
4. `mStep("Check 3x^3:", "")` then `tStep("Same variable x, but power is 3 not 2 — different power, not a like term ✗")`
5. `mStep("Check 4y^2:", "")` then `tStep("Same power 2, but different variable — not a like term ✗")`
6. `mStep("Check 6:", "")` then `tStep("No variable — a constant, not a like term ✗")`
7. `mStep("Answer:", "7x^2 \text{ and } -5x^2")`

**L3 two-variable example — target: `4x^2 y`, options: `5x^2 y`, `3yx^2`, `4x^3 y`, `4x^2 z`, `3x`**

1. `tStep("Check each option — every variable and every power must match. Variable order does not matter. There may be zero like terms.")`
2. `mStep("Check 5x^2 y:", "")` then `tStep("Same variables x and y, same powers 2 and 1 — this IS a like term ✓")`
3. `mStep("Check 3yx^2:", "")` then `tStep("Variables are x and y in a different order — variable order does not matter. Same powers — this IS a like term ✓")`
4. `mStep("Check 4x^3 y:", "")` then `tStep("Same variables, but power of x is 3 not 2 — different power, not a like term ✗")`
5. `mStep("Check 4x^2 z:", "")` then `tStep("Power of x matches, but z is not the same as y — different variable, not a like term ✗")`
6. `mStep("Check 3x:", "")` then `tStep("Only one variable — missing y entirely, not a like term ✗")`
7. `mStep("Answer:", "5x^2 y \text{ and } 3yx^2")`

#### 3.4 Sample questions (acceptance set)

| Level | Target | Options (randomised in display) | Answer | Key working |
|---|---|---|---|---|
| 1 | `5x` | `3x` ✓, `5x^2`, `5y`, `7` | `3x` | Same variable x, same power 1 |
| 1 | `4x^3` | `9x^3` ✓, `4x^2`, `4y^3`, `2z` | `9x^3` | Same variable x, same power 3 |
| 1 | `2y^2` | `8y^2` ✓, `2y^4`, `2x^2`, `5` | `8y^2` | Same variable y, same power 2 |
| 2 | `4x^2` | `-7x^2` ✓, `4x^3`, `-4y^2`, `4` | `-7x^2` | Same variable, same power; sign irrelevant |
| 2 | `3m^3` | `-5m^3` ✓, `3m^4`, `-3n^3`, `-3` | `-5m^3` | Same variable, same power; sign irrelevant |
| 2 | `6t` | `6t^2`, `-6y`, `-2t` ✓, `6` | `-2t` | Same variable t, same power 1; sign irrelevant |
| 3 | `3x^2` | `7x^2` ✓, `-5x^2` ✓, `3x^3`, `4y^2`, `6` | `7x^2` and `-5x^2` | Both share variable x and power 2 |
| 3 | `2k^4` | `3k^3`, `2m^4`, `5`, `-k^4` ✓, `2k` | `-k^4` | Same variable k, same power 4; sign irrelevant |
| 3 (2-var) | `4x^2 y` | `5x^2 y` ✓, `3yx^2` ✓, `4x^3 y`, `4x^2 z`, `3x` | `5x^2 y` and `3yx^2` | Both match on all variables and powers; order irrelevant |

#### 3.5 Uniqueness

Key parameters: target variable, target power, coefficient of target, coefficient of true like term, distractor types used.

**Pool size:** variable pool of 11 letters × powers 1–5 × coefficients 2–9 = very large. No pool size concern at any level.

---

### Sub-tool: Single Variable (`subtool2`)

#### 3.1 Question options (QO)

- **multiSelect** `subtractionCases` — "Question Types":
  - `positiveOnly` — "Positive terms only" — defaultActive: true
  - `subtractionPositive` — "Subtraction (positive result)" — defaultActive: false
  - `crossingZero` — "Crossing zero (negative result)" — defaultActive: false

- **multiSelect** `termOptions` — "Term Options":
  - `noCoefficients` — "No coefficients (x + x + x...)" — defaultActive: false
  - `includeConstant` — "Include a constant term" — defaultActive: false
  - `includeSquare` — "Include an x² term" — defaultActive: false

- **Per-level differences:**
  - L1: `includeConstant` and `includeSquare` not available (greyed out — single variable type only at L1). `noCoefficients` available.
  - L2: all options available. `positiveOnly` defaultActive: true, others defaultActive: false.
  - L3: `subtractionPositive` and `crossingZero` defaultActive: true. `includeConstant` and `includeSquare` defaultActive: true. `noCoefficients` available.

#### 3.2 Levels

**Level 1 (confidence builder):**
- Parameters:
  - Variable drawn from {x, y, c, a, w, v, m, n, s, t, k}.
  - **With coefficients:** 2–4 terms, each coefficient in 2–9, same variable throughout, power always 1.
  - **No coefficients mode:** 2–8 bare variable terms (e.g. x + x + x - x), each term is just the variable with no written coefficient.
  - Subtraction cases controlled by `subtractionCases` QO.
- Constraints:
  - All terms share the same variable and power (always 1 at L1) — exactly one group to collect.
  - Answer is a single term `bv` where b ≠ 0.
  - With coefficients: b in range −36 to 36 (sum of up to 4 terms with coefficients up to 9).
  - No coefficients mode: up to 8 terms; result coefficient is a non-zero integer.
- Exclusions:
  - Answer coefficient must not be 0 (exclude degenerate cancellation to nothing unless crossingZero is active and result is non-zero).
  - Exclude coefficient of 1 or -1 on any individual term (answer `x` is fine, but input `1x` should display as `x`).
  - Do not generate expressions where all terms are identical (e.g. 3x + 3x + 3x — varies coefficients).
- Misconceptions targeted:
  - `x + x + x = x^3` — all L1 questions use power 1 exclusively; answer is always `bx` never `x^3`, making the exponent misconception produce a visibly wrong answer.
  - `x + x + x = 3` — coefficient misconception; result always retains the variable.

**Level 2 (standard KS3/GCSE domain):**
- Parameters:
  - Variable from full pool. 2–4 terms in the main variable (power 1), plus optionally 1 constant or 1 x^2 term (controlled by QO).
  - Coefficients 2–9 (positive and negative depending on `subtractionCases`).
- Constraints:
  - At least one pair of like (variable) terms must be present and collectable.
  - If `includeConstant` active: exactly one constant term present; it cannot be collected with variable terms.
  - If `includeSquare` active: exactly one x^2 term present (coefficient 2–9); it cannot be collected with x terms.
  - If both `includeConstant` and `includeSquare` active: both may appear in the same question (one of each).
  - Answer form: simplified expression with collected variable term(s) plus any uncollectable terms written last.
- Exclusions:
  - Exclude answers where variable terms cancel to 0 unless `crossingZero` is active.
  - Exclude expressions already fully simplified (only one variable term from the start).
  - Do not collect constants with variable terms; do not collect x^2 with x terms.
- Misconceptions targeted:
  - "Collect everything" — presence of constant or x^2 term exposes students who add all coefficients regardless.
  - "x and x^2 are like terms" — x^2 distractor sits visually alongside x terms; collecting them produces a wrong answer.
  - Crossing zero: `3x - 5x` answered as `2x` — parameters chosen so the wrong subtraction order gives a positive result that differs from the correct negative result.

**Level 3 (stretch):**
- Parameters:
  - Variable from full pool. 3–6 terms total. Mix of `v`, `v^2`, `v^3`, and constants controlled by QO (all defaultActive: true at L3).
  - Coefficients 2–9, positive and negative (subtraction defaultActive: true).
  - Powers up to 3 for the main variable (x, x^2, x^3 may all appear).
- Constraints:
  - **Guaranteed collectable pair:** generator seeds at least one pair of like terms first (e.g. two x terms, or two x^2 terms), then adds singleton unlike terms around them. Every question has something to collect.
  - Two distinct term types must be present minimum (e.g. x terms + x^2 terms, or x terms + constant).
  - Answer lists collected groups in descending power order, constants last.
- Exclusions:
  - Do not generate an expression that simplifies to a single term (all unlike terms cancel to one).
  - Exclude expressions where every term type has exactly one representative and nothing collects.
  - Exclude degenerate total cancellation to 0.
- Misconceptions targeted:
  - `ax^2 + bx` collected as `(a+b)x^2` or `(a+b)x` — different powers treated as like.
  - `3x^2 - x^2` answered as `3` — variable dropped from answer.
  - `-3x - 5x` answered as `-2x` or `2x` — negative coefficient arithmetic errors.

#### 3.3 Worked example script

**Colour underline convention (applies to Sub-tools 2 and 3):** The first `tStep` in every worked example instructs the student to underline like terms. The implementation must render this step by displaying the expression with each distinct term group underlined in a different colour — colour 1 for the first term type, colour 2 for the second, colour 3 for constants. These underlines appear **only in the worked example step**, never on the question display in whiteboard or worksheet modes. Singleton terms that cannot be collected still receive a colour underline in their own colour so the student can see they have been identified but left uncollected.

**L1 example — `3x + 5x + 2x`**
1. `tStep("Underline the like terms — they all share the same variable and power.")` — render all like terms with a colour underline in colour 1; this underline is part of the worked example display, not shown on the question itself
2. `mStep("Collect the x terms:", "3x + 5x + 2x = 10x")`
3. `mStep("Answer:", "10x")`

**L1 crossing zero example — `3x - 5x`**
1. `tStep("Underline the like terms.")` — render both terms with a colour underline in colour 1; underline shown in worked example only
2. `mStep("Collect the x terms:", "3x - 5x = -2x")`
3. `mStep("Answer:", "-2x")`

**L2 example with constant — `4x + 3 + 2x`**
1. `tStep("Underline the like terms — use one colour for x terms, a second for the constant.")` — x terms underlined in colour 1, constant underlined in colour 2; underlines shown in worked example only
2. `mStep("Collect the x terms:", "4x + 2x = 6x")`
3. `tStep("The constant 3 has no variable — it cannot be collected with the x terms.")`
4. `mStep("Answer:", "6x + 3")`

**L2 example with x^2 — `3x^2 + 5x - 2x`**
1. `tStep("Underline the like terms — x terms in one colour, x² in another.")` — x terms underlined in colour 1, x² term underlined in colour 2; underlines shown in worked example only
2. `mStep("Collect the x terms:", "5x - 2x = 3x")`
3. `tStep("The x² term cannot be collected with the x terms — different powers.")`
4. `mStep("Answer:", "3x^2 + 3x")`

**L3 example — `4x^2 + 3x - x^2 - 5x + 2`**
1. `tStep("Underline the like terms — a different colour for each term type.")` — x² terms underlined in colour 1, x terms in colour 2, constant in colour 3; underlines shown in worked example only
2. `mStep("Collect the x^2 terms:", "4x^2 - x^2 = 3x^2")`
3. `mStep("Collect the x terms:", "3x - 5x = -2x")`
4. `tStep("The constant 2 cannot be collected — it has no variable.")`
5. `mStep("Answer:", "3x^2 - 2x + 2")`

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | `3x + 2x + x` | `6x` | 3+2+1=6 |
| 1 | `x + x + x + x - x` | `3x` | 1+1+1+1-1=3 (no coefficients mode) |
| 1 | `7m + 4m - 3m` | `8m` | 7+4-3=8 |
| 2 | `5x + 3 + 2x` | `7x + 3` | 5x+2x=7x; 3 unchanged |
| 2 | `4x^2 + 3x - x` | `4x^2 + 2x` | 3x-x=2x; x^2 unchanged |
| 2 | `3x - 7x + 4` | `-4x + 4` | 3-7=-4; 4 unchanged |
| 3 | `4x^2 + 3x - x^2 - 5x + 2` | `3x^2 - 2x + 2` | 4-1=3 for x^2; 3-5=-2 for x |
| 3 | `-2y^2 + 4y - 3y^2 - y` | `-5y^2 + 3y` | -2-3=-5 for y^2; 4-1=3 for y |
| 3 | `5k^3 - 3k + 2k^3 + k - 4` | `7k^3 - 2k - 4` | 5+2=7 for k^3; -3+1=-2 for k |

#### 3.5 Uniqueness

Key parameters: variable letter, all term coefficients, all term powers, expression structure (number of terms, which are positive/negative).

**Pool size:** variable pool 11 × coefficient combinations per term 2–9 × 2–4 terms = very large at all levels. No pool size concern.

---

### Sub-tool: Multiple Variables (`subtool3`)

#### 3.1 Question options (QO)

- **multiSelect** `subtractionCases` — "Question Types":
  - `positiveOnly` — "Positive terms only" — defaultActive: true
  - `subtractionPositive` — "Subtraction (positive result)" — defaultActive: false
  - `crossingZero` — "Crossing zero (negative result)" — defaultActive: false

- **multiSelect** `termOptions` — "Extra Term Types":
  - `noCoefficients` — "No coefficients (x + y + x...)" — defaultActive: false
  - `includeConstant` — "Include a constant term" — defaultActive: false
  - `includeSquare` — "Include squared terms" — defaultActive: false

- **Per-level differences:**
  - L1: `includeConstant` and `includeSquare` not available. `noCoefficients` available.
  - L2: all options available. `positiveOnly` defaultActive: true.
  - L3: `subtractionPositive` and `crossingZero` defaultActive: true. `includeConstant` and `includeSquare` defaultActive: true.

#### 3.2 Levels

**Level 1 (confidence builder):**
- Parameters:
  - Exactly 2 distinct variables, both drawn from {x, y, c, a, w, v, m, n, s, t, k} (distinct letters).
  - 3–4 terms total. Both variables must appear in every expression.
  - **With coefficients:** coefficients 2–9, all positive (unless subtraction cases active).
  - **No coefficients mode:** bare variable terms only, up to 8 terms total, both variables present.
  - Powers always 1 at L1.
- Constraints:
  - At least one collectable pair in variable A (minimum 2 terms in variable A).
  - Variable B appears at least once (may be a singleton — student must recognise it cannot be collected alone, or there may be 2 of it).
  - Answer always contains both variable terms (neither cancels to 0).
  - Both variables present in every generated expression — non-negotiable at all levels of Sub-tool 3.
- Exclusions:
  - Do not generate expressions where one variable has only a single term AND it would be cleaner to just have one variable (Sub-tool 2 territory).
  - Exclude answer coefficient of 0 on either variable unless `crossingZero` is active.
  - Exclude expressions where both variables have exactly 1 term (nothing to collect).
- Misconceptions targeted:
  - "Collect all terms regardless of variable" — e.g. `3x + 2y + x` wrongly gives `6xy` or `6x`; distinct variables make this produce a clearly wrong answer.
  - "Terms with different variables can be combined" — both variables always present so students cannot avoid the decision.

**Level 2 (standard KS3/GCSE domain):**
- Parameters:
  - Exactly 2 distinct variables, both always present. Powers still 1 unless `includeSquare` active.
  - 3–5 terms total. Coefficients 2–9, positive and/or negative per `subtractionCases`.
  - If `includeConstant` active: one constant term added.
  - If `includeSquare` active: one squared term (either variable^2) added alongside the linear terms.
  - If both active: both may appear together.
- Constraints:
  - At least one collectable pair guaranteed (seeded first in generation).
  - Both variables present in every expression.
  - Answer in form: collected variable A term + collected variable B term + any uncollectable terms.
- Exclusions:
  - Same as L1 exclusions, plus: do not collect squared terms with linear terms of the same variable.
  - Exclude expressions where neither variable has a collectable pair (both singletons with extras only).
- Misconceptions targeted:
  - "x and x^2 are like terms" — if `includeSquare` active, x^2 sits alongside x terms tempting collection.
  - "Constants can be collected with variable terms" — constant term present but uncollectable.
  - Crossing zero with two variables present: student may apply correct sign to one variable and wrong sign to the other.

**Level 3 (stretch):**
- Parameters:
  - Exactly 2 distinct variables, both always present. Powers 1–2 per variable (x, x^2, y, y^2 all possible).
  - 4–6 terms total. Coefficients 2–9, positive and negative (subtraction defaultActive: true).
  - Constants optional (QO). Squared terms optional (QO) — when active, squared versions of both variables may appear.
- Constraints:
  - **Both variables must have at least one collectable pair** (generator seeds a pair for variable A AND a pair for variable B before adding any singletons). This is the key L3 constraint — students are always collecting two groups, not one.
  - Combined powers per term: each individual term is univariate at L3 (e.g. `3x^2` or `2y`, never `3x^2 y`) — multi-variable terms within a single term are Sub-tool 1 L3 territory.
  - Answer lists terms in order: highest power of variable A first, then variable B terms, then constants.
- Exclusions:
  - Do not generate expressions that degenerate to a single variable (both y terms must not cancel to 0, etc.).
  - Exclude any expression where one variable ends up with 0 collected coefficient.
  - No xy product terms in any expression in this sub-tool.
- Misconceptions targeted:
  - "Collect x and x^2 together" — if `includeSquare` active, both appear and must be kept separate.
  - "Collect x terms and y terms together because both are letters" — two distinct variable groups always present.
  - Negative coefficient errors across two simultaneous groups — student correctly handles one and makes sign error on the other.

#### 3.3 Worked example script

**L1 example — `3x + 2y + x`**
1. `tStep("Underline the like terms — use a different colour for each variable.")` — x terms underlined in colour 1, y terms in colour 2; underlines shown in worked example only
2. `mStep("Collect the x terms:", "3x + x = 4x")`
3. `tStep("There is only one y term — it cannot be collected, so it stays as it is.")`
4. `mStep("Answer:", "4x + 2y")`

**L1 example with collectable pair in both variables — `3x + 2y + x + 4y`**
1. `tStep("Underline the like terms — use a different colour for each variable.")` — x terms underlined in colour 1, y terms in colour 2; underlines shown in worked example only
2. `mStep("Collect the x terms:", "3x + x = 4x")`
3. `mStep("Collect the y terms:", "2y + 4y = 6y")`
4. `mStep("Answer:", "4x + 6y")`

**L2 example with constant — `5x + 3y - 2x + 4`**
1. `tStep("Underline the like terms — a different colour for each variable, and a third for the constant.")` — x terms underlined in colour 1, y terms in colour 2, constant in colour 3; underlines shown in worked example only
2. `mStep("Collect the x terms:", "5x - 2x = 3x")`
3. `tStep("There is only one y term — it stays as it is.")`
4. `tStep("The constant 4 has no variable — it cannot be collected.")`
5. `mStep("Answer:", "3x + 3y + 4")`

**L3 example — `4x^2 + 3y - x^2 + 2y - 5`**
1. `tStep("Underline the like terms — a different colour for each term type.")` — x² terms underlined in colour 1, y terms in colour 2, constant in colour 3; underlines shown in worked example only
2. `mStep("Collect the x^2 terms:", "4x^2 - x^2 = 3x^2")`
3. `mStep("Collect the y terms:", "3y + 2y = 5y")`
4. `tStep("The constant -5 cannot be collected — it has no variable.")`
5. `mStep("Answer:", "3x^2 + 5y - 5")`

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | `3x + 2y + x` | `4x + 2y` | 3x+x=4x; 2y singleton |
| 1 | `2m + 3n + 4m + n` | `6m + 4n` | 2+4=6 for m; 3+1=4 for n |
| 1 | `x + y + x + y + x` | `3x + 2y` | no-coefficients mode; 3 x's, 2 y's |
| 2 | `5x + 3y - 2x + 4` | `3x + 3y + 4` | 5-2=3 for x; y singleton; 4 constant |
| 2 | `4a + 2b - 3a + b` | `a + 3b` | 4-3=1 for a; 2+1=3 for b |
| 2 | `3x^2 + 2y + x^2 - y` | `4x^2 + y` | 3+1=4 for x^2; 2-1=1 for y |
| 3 | `4x^2 + 3y - x^2 + 2y - 5` | `3x^2 + 5y - 5` | 4-1=3 for x^2; 3+2=5 for y |
| 3 | `2m + 3n^2 - 5m + n^2 - 2` | `-3m + 4n^2 - 2` | 2-5=-3 for m; 3+1=4 for n^2 |
| 3 | `6k^2 + 4t - 2k^2 - t + 3t` | `4k^2 + 6t` | 6-2=4 for k^2; 4-1+3=6 for t |

#### 3.5 Uniqueness

Key parameters: both variable letters, all term coefficients, all term powers, expression structure.

**Pool size:** 11-choose-2 variable pairs × coefficient combinations = very large. No pool size concern.

---

## 4. Variety requirements

- **Variable distribution:** across a worksheet, variable letters should be spread across the full pool — do not default to x in every question. Actively rotate through the pool so a 15-question worksheet uses at least 6 distinct variable letters.
- **Coefficient spread:** spread coefficients across the range 2–9. Do not cluster on small values (2, 3). Ensure roughly even distribution across a worksheet.
- **Power spread (Sub-tool 1 and Sub-tool 2 L3 / Sub-tool 3 L3):** spread powers 1–5 across questions; do not cluster on power 1.
- **Term count variety:** for sub-tools 2 and 3, vary the number of terms across a worksheet — do not generate all 3-term or all 4-term questions.
- **Subtraction case interleaving:** when multiple `subtractionCases` are active, distribute case types as evenly as possible across the worksheet rather than clustering (e.g. do not generate all positive-only questions first).
- **Unlike term type interleaving (Sub-tool 2 L2 and Sub-tool 3 L2):** when both `includeConstant` and `includeSquare` are active, interleave question types across the worksheet — not all constants first.
- **Sub-tool 1 distractor rotation:** across a worksheet, rotate which distractor slot (A, B, C, wild card) carries which misconception type. Do not always put the same distractor type in the same visual position.
- **Sub-tool 1 correct answer position:** distribute the true like term position (1st, 2nd, 3rd, 4th option) evenly across a worksheet — do not allow it to cluster in one position.

---

## 5. Info modal content

**Section 1 — Spot the Like Term**
- icon: 🔍
- content:
  - { label: "Overview", detail: "Students are shown a target term and must identify which option(s) are like terms. Like terms must share both the same variable and the same power — the coefficient is irrelevant to term type." }
  - { label: "Level 1 — Green", detail: "Single-variable target terms with powers 1–5. Exactly one correct answer. Each distractor is wrong on a single criterion (variable or power), with a wild card wrong on both." }
  - { label: "Level 2 — Yellow", detail: "Negative coefficients introduced. Near misses echo the target's coefficient magnitude (with varying sign) to maximise the trap for students who fixate on the number. Exactly one correct answer." }
  - { label: "Level 3 — Red", detail: "Five options with zero, one, or two correct answers — always flagged in the instruction line. Optional two-variable target terms. Includes commutativity traps (e.g. yx² as a like term of x²y)." }

**Section 2 — Single Variable**
- icon: 🔤
- content:
  - { label: "Overview", detail: "Students simplify expressions by collecting all like terms. Worked examples show colour-coded underlines grouping each term type before collecting." }
  - { label: "Level 1 — Green", detail: "Single variable, powers of 1 only, 2–4 terms. No coefficients mode available for pure x + x + x style practice up to 8 terms. Subtraction and crossing zero are QO options." }
  - { label: "Level 2 — Yellow", detail: "Introduces constants and x² terms as optional QO toggles, each acting as uncollectable terms students must leave in the answer. Subtraction and crossing zero available." }
  - { label: "Level 3 — Red", detail: "Expressions with x, x², x³ and constants mixed together. At least one collectable pair always guaranteed. Students must sort, collect each group, and order the answer by descending power." }

**Section 3 — Multiple Variables**
- icon: 🔡
- content:
  - { label: "Overview", detail: "Students simplify expressions containing two distinct variables. Both variables are always present in every question — students must identify and collect each variable group independently." }
  - { label: "Level 1 — Green", detail: "Exactly two variables, powers of 1, positive coefficients (unless subtraction options active). At least one collectable pair guaranteed. No coefficients mode available." }
  - { label: "Level 2 — Yellow", detail: "Adds optional constants and squared terms as extra uncollectable or separately-collectable types. Subtraction and crossing zero available as QO options." }
  - { label: "Level 3 — Red", detail: "Both variables always have a collectable pair — students collect two groups simultaneously. Squared terms for both variables optional. Subtraction and crossing zero defaultActive." }

---

## 6. Out of scope / future ideas

- **xy product terms** (e.g. `3xy + 2xy`) — deliberately excluded from all sub-tools. These constitute a distinct skill and should be a separate tool.
- **Algebraic fractions** (e.g. `x/2 + x/3`) — out of scope; follows this tool in the teaching sequence.
- **Collecting with brackets** (e.g. `2(x + 3) + 3x`) — out of scope; requires expanding first.
- **Three-variable expressions** in Sub-tool 3 — considered but excluded to avoid visual overload in worksheet cells. Could be added as a L3 QO toggle in a future revision.
- **Diagram sub-tool** — a number-line or algebra-tile visual representation of collecting was considered but judged too expensive relative to pedagogical gain at this stage.
