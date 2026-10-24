# Tool Spec: Indices

**Status:** implemented (the Powers & Roots levels and the Negative & Fractional tab were reworked on 2026-10-19: see `specs/indices-extended.md`) <!-- built in `src/tools/Number/Indices.tsx`; see Implementation notes below -->

Source: Scheme of Learning *Y9H Unit 4 — Indices, Standard Form & Percentages*, Topics 1–4
(Powers/roots/index notation · Laws of indices · Zero, negative and fractional powers · Changing the
base and BIDMAS with indices), cross-checked against GCSE Maths (9–1) Number/Algebra content on indices
(N6, N7, N8 and the algebraic index laws, Higher tier).

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Indices |
| Tool id / URL path | `/indices` (id `indices`) |
| Category | Number — new landing group `Powers & standard form` (so the later Standard Form tool, SoL Topics 5–8, sits beside it) |
| Card description | Evaluate powers and roots, simplify with the laws of indices, and handle zero, negative and fractional powers and common-base problems, with working that expands the repeated factors. |
| Defaults | `numQuestions: 15` · `numColumns: 3` · `maxColumns: 3` (index expressions are wide) · fonts standard |

**Pedagogical intent:** after a lesson on this tool a student can read and evaluate index notation, apply
the three laws (×, ÷, power of a power) to numbers and to algebra with coefficients, interpret zero,
negative and fractional powers, and rewrite numbers with a common base to evaluate or solve. It follows
squares/cubes/BIDMAS (Order of Operations, Powers of 10) and precedes Standard Form (Topics 5–8) and
surds. One tool, four sub-tools, one per SoL topic, so the tabs read as the unit's route through the topic.

**Why one tool with four tabs (not four tools):** the four topics are one idea built up (notation → laws
→ extension of the laws → using the laws), share vocabulary and the same expanded-factor working, and a
teacher moves between them mid-lesson. Level 1/2/3 inside each tab gives the differentiation.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line | SoL topic |
|---|---|---|---|---|
| `powersRoots` | Powers & Roots | simple | "Work out:" (or "Write as a power:" for notation questions) | 1 |
| `indexLaws` | Index Laws | simple | "Simplify:" (or "Find n:" for missing-index questions) | 2 |
| `specialPowers` | Negative & Fractional | simple | "Work out:" / "Simplify:" / "Write without a negative index:" | 3 (zero, negative, fractional) |
| `commonBase` | Common Base | simple | "Write as a power of …:" / "Solve:" / "Work out:" | 4 |

All simple (KaTeX) questions — no diagrams. Each sub-tool has Levels 1–3.

---

## 3. Sub-tool detail

### Shared rules (all sub-tools)

- **Answer house style:** numeric answers as an integer or a fraction in lowest terms (`\dfrac`); index-form
  answers fully simplified — exponent 1 is not written (`x`, not `x^1`), coefficient 1 is not written
  (`x^3`, not `1x^3`), no zero exponent left in an answer unless the question is about `a^0`. Algebraic
  answers list variables alphabetically. No units.
- **Variables pool:** `x y a b m n p t` (never `e`, `i`, `l`, `o`). Numeric base pool per level below.
- **Working fragments:** every multi-move line is authored as a `string[]` (live modelling); each fragment
  is valid KaTeX alone.
- **Expand-first, then fade (the pedagogical spine):** the Level 1 worked examples for ×, ÷ and power of a power
  show the repeated-multiplication form *before* the rule, e.g. `x^3 × x^4 = (x×x×x)×(x×x×x×x) = x^7`, only
  when the expansion has ≤ 8 factors in total. Levels 2–3 **fade it**: they state the law in the label ("Same base,
  so add the indices:") and don't re-expand. The full teaching of *why* lives in the Teach deck
  (`specs/decks/indices.md`) and the Depth bank (`specs/depth/indices.md`); this tool's working keeps the Level 1
  expansion so it still stands alone while Teach is parked.
- **No keyword shortcuts in labels:** labels name the *law* ("Multiplying powers of the same base: add the
  indices"), never "bring the power down" style tricks.
- **Smart Progressor:** every pool option carries a `weight` (1 = easiest). The Smart Progressor then orders
  worksheets easy→hard. Calibration (`*.calibration.ts`) is a follow-up once the generators settle.

---

### Sub-tool: Powers & Roots (`powersRoots`)

#### 3.1 Question options

- **multiSelect** `questionPool` — "Question Types":
  - `notation` — "Index notation" — weight 1 — repeated multiplication ⇄ index form; name the base and power
  - `power` — "Evaluate powers" — weight 2 — defaultActive: true
  - `root` — "Evaluate roots" — weight 2 — defaultActive: true
  - `combined` — "Combined" — weight 3 — powers/roots added, subtracted, multiplied (BIDMAS-light)
  - `negatives` — "Negative bases" — weight 4 — `(−3)²` vs `−3²`, odd/even powers of negatives; **L2–L3 only**
  - `calculator` — "Calculator" — weight 4 — power/root keys, decimal bases, rounding; **L3 only**
- dropdown / variables: none
- **Per-level differences:** Level 1 pool = `notation`, `power`, `root` (`notation` defaultActive) ·
  Level 2 = `power`, `root`, `combined`, `negatives` (first three defaultActive) · Level 3 = `power`, `root`,
  `combined`, `negatives`, `calculator` (`combined`, `negatives` defaultActive).

#### 3.2 Levels

**Level 1 (notation and recall):**
- Parameters: `notation` — base 2–10, power 2–6, either direction (`6×6×6×6` → `6^4`; `7^3` → "base 7, power 3 / 7×7×7"); `power` — squares of 1–12, cubes of 1–5 and 10, and `2^n` n≤6, `10^n` n≤4; `root` — `√` of squares to 12², `∛` of 1, 8, 27, 64, 125, 1000.
- Constraints: `power` answers ≤ 10 000; roots always exact integers.
- Exclusions: base 1; power 1; `10^n` more than once per set.
- Misconceptions targeted: `4³` as `4×3` (base and power both ≥ 3 so 12 ≠ 64 visibly); squaring as doubling (bases ≥ 3); root as "halve" (√36 = 6 ≠ 18; avoid √4 = 2 = 4÷2 and √16 = 4 only once).

**Level 2 (GCSE recall + expressions):**
- Parameters: squares to 15², cubes 1–5 and 10, roots of those; `combined` — two terms `a^p ± b^q`, `a × b^p`, `√s ± ∛c`, `k × a²`; `negatives` — `(−b)^p` and `−b^p`, p ∈ {2,3,4}, b 2–6, and the mixed `(−2)³ + 3²` form.
- Constraints: all answers integers, |answer| ≤ 500; at least one `negatives` question per set shows the bracket/no-bracket pair as separate questions only if both are active (never both in one worksheet slot).
- Exclusions: answers of 0 or 1; `√s + ∛c` where either part is 1.
- Misconceptions targeted: `(−3)²` as `−9`; `−3²` as `9`; positive number "has only one square root" (appears in Depth, not here).

**Level 3 (stretch — fractions, decimals, calculator):**
- Parameters: `power` — `(a/b)^p` with a/b ∈ {1/2, 2/3, 3/4, 2/5, 3/2…}, p ∈ {2,3}; decimals `0.3²`, `0.2³`; `root` — `√(m/n)` of fraction squares, `√0.09`, `∛(−8)`; `combined` — three terms with a root (`2^5 − 3 × ∛64`); `calculator` — `a.b^p` (exact to ≤ 3 dp) or `√n` / `∛n` of a non-perfect n (n 20–500) rounded to 1 d.p.
- Constraints: fraction answers in lowest terms; calculator rounding is always 1 d.p. and the instruction line says so ("Give your answer to 1 d.p."); the exact-value check is `Math.round`-safe (reject n where the 2nd d.p. is exactly 5 at the boundary).
- Exclusions: perfect-power n in `calculator`; any decimal answer that terminates beyond 3 d.p. in `power`.
- Misconceptions targeted: `(2/3)³` as `2/3³` (numerator not cubed) and as `6/9`; `√(9/25)` as `3/25`; `∛(−8)` as "not possible".

#### 3.3 Worked example script

**L1, power — `4^3`**
1. `mStep("Write as repeated multiplication:", ["4^3", "= 4 \\times 4 \\times 4"])`
2. `mStep("Multiply two at a time:", ["= 16 \\times 4", "= 64"])`
3. `mStep("Answer:", "64")`

**L1, root — `√81`**
1. `mStep("Which number multiplied by itself makes 81?", "9 \\times 9 = 81")`
2. `mStep("Answer:", "9")`

**L2, combined — `3^2 + 2^3`**
1. `mStep("Work out each power first:", ["3^2 = 9", "2^3 = 8"])`
2. `mStep("Add:", ["9 + 8", "= 17"])`
3. `mStep("Answer:", "17")`

**L2, negatives — `(−2)^3 + 3^2`**
1. `mStep("Expand the bracketed power — the negative is part of the base:", ["(-2)^3", "= (-2) \\times (-2) \\times (-2)", "= -8"])`
2. `mStep("Work out the other power:", "3^2 = 9")`
3. `mStep("Add:", ["-8 + 9", "= 1"])`; Answer `1`.

**L3 — `(2/3)^3`**
1. `mStep("Cube the numerator and the denominator:", ["\\left(\\dfrac{2}{3}\\right)^3", "= \\dfrac{2^3}{3^3}"])`
2. `mStep("Work out each power:", "= \\dfrac{8}{27}")`; Answer `\dfrac{8}{27}`.

**L3, calculator — `√150` to 1 d.p.:** `mStep("Use the root key:", "\\sqrt{150} = 12.247\\ldots")` · `mStep("Round to 1 d.p.:", "12.2")` · Answer `12.2`. Pool includes an *estimate-first* step: `mStep("Estimate: it lies between 12² = 144 and 13² = 169, so about 12.", "…")`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Write $6 \times 6 \times 6 \times 6$ as a power | $6^4$ | four sixes multiplied → base 6, power 4 |
| 1 | Work out $4^3$ | $64$ | $4\times4\times4 = 16\times4 = 64$ |
| 1 | Work out $\sqrt{81}$ | $9$ | $9\times9 = 81$ |
| 2 | Work out $3^2 + 2^3$ | $17$ | $9 + 8$ |
| 2 | Work out $\sqrt{49} + \sqrt[3]{27}$ | $10$ | $7 + 3$ |
| 2 | Work out $(-2)^3 + 3^2$ | $1$ | $-8 + 9$ |
| 3 | Work out $\left(\frac{2}{3}\right)^3$ | $\frac{8}{27}$ | $\frac{2^3}{3^3}$ |
| 3 | Work out $2^5 - 3 \times \sqrt[3]{64}$ | $20$ | $32 - 3\times4 = 32-12$ |
| 3 | Work out $\sqrt{\frac{9}{25}}$ | $\frac{3}{5}$ | $\frac{\sqrt9}{\sqrt{25}}$ |
| 3 | Work out $\sqrt{150}$ (1 d.p.) | $12.2$ | $12.247\ldots$ rounded |

#### 3.5 Uniqueness

Key: sub-tool, level, pool option, all numeric parameters, operation signs. **Pool size:** L1 `root`+`power`+
`notation` ≈ 60+ distinct keys (OK for 24); L2 `negatives` alone is small (b 2–6 × p 2–4 × 2 forms = 30 —
acceptable); L3 `calculator` has ≥ 100 n values.

---

### Sub-tool: Index Laws (`indexLaws`)

#### 3.1 Question options

- **multiSelect** `lawPool` — "Laws":
  - `multiply` — "Multiply (add indices)" — weight 1 — defaultActive: true
  - `divide` — "Divide (subtract indices)" — weight 1 — defaultActive: true
  - `powerOfPower` — "Power of a power (multiply indices)" — weight 2 — defaultActive: true
  - `combined` — "Combined laws" — weight 4 — **L3 default**
  - `missingIndex` — "Find the missing index" — weight 4 — **L3 only**
- **multiSelect** `baseType` — "Base" (a normal mixable pool, not `exclusive`):
  - `numeric` — "Numbers (leave in index form)"
  - `algebraic` — "Letters"
  - `coefficients` — "With coefficients"
  - Level 1 offers `numeric`, `algebraic` (both defaultActive); Level 2 offers `algebraic`, `coefficients` (both defaultActive); Level 3 offers `coefficients`, `numeric` (the multi-base form), both defaultActive.
- **Per-level differences:** as above; `missingIndex` and `combined` appear at L3 only.

#### 3.2 Levels

**Level 1 (one law, one base, positive indices):**
- Parameters: base 2–9 numeric or a single letter; `multiply`: m, n 2–9; `divide`: m > n, m 4–12, n 2–8; `powerOfPower`: m, n 2–5.
- Constraints: answer exponent ≥ 2 (no `x^1`, no `a^0`); answers are left in index form, never evaluated; instruction "Simplify:" ("Give your answer as a single power" for numeric).
- Exclusions: exponents 1; `m = n` in division; `multiply` with m = n = 2 more than once per set (2+2 = 2×2 coincidence — the "add vs multiply" misconception must be visible: reject m = n = 2 entirely for `multiply`/`powerOfPower` since 2+2 = 2×2).
- Misconceptions targeted: `a²×a³ = a⁶` (m≠n and m+n ≠ m×n: reject (2,2) only); `(a²)³ = a⁵`; `2³×2⁴ = 4⁷`; cancelling bases in division.

**Level 2 (coefficients and several variables):**
- Parameters: coefficients 2–9 (multiply), dividend coefficient = divisor × k (k 2–6 so division is exact); one or two variables, indices 1–7; `powerOfPower` with a bracketed term `(kx^m)^n`, k 2–4, n 2–3.
- Constraints: all coefficients integers; no resulting exponent ≤ 0; a variable may appear with index 1 on input (`2a³b × 5a²b⁴`).
- Exclusions: coefficient product > 200; cases where a letter cancels completely.
- Misconceptions targeted: `(2x³)² = 2x⁶` (coefficient not squared — k ≥ 2 guarantees 2²≠2); `3x²×4x⁵ = 12x¹⁰` (multiplying indices); adding coefficients and multiplying indices.

**Level 3 (combined laws, multiple bases, missing indices):**
- Parameters: `combined` — `(kx^a y^b)^n × cx^d y^e`, and algebraic fractions `(px^a y^b)/(qx^c y^d)` with p = q × k; numeric multi-base `2^a × 3^b × 2^c × 3^d` collected to `2^(a+c) × 3^(b+d)`; `missingIndex` — `5^n ÷ 5^3 = 5^4`, `x^a × x^5 = x^{11}`, `(x^n)^3 = x^{12}`.
- Constraints: every result exponent positive; every fraction question divides exactly; missing-index answer is an integer 2–12.
- Exclusions: more than 3 distinct bases; any intermediate exponent > 20.
- Misconceptions targeted: applying the outer power to the variable but not the coefficient; adding unlike bases (`2³×3² = 6⁵`) — surfaced by the multi-base form where the student must keep bases separate.

#### 3.3 Worked example script

**L1, multiply — `x^3 × x^4`**
1. `mStep("Write out each power:", ["x^3 \\times x^4", "= (x \\times x \\times x) \\times (x \\times x \\times x \\times x)"])`
2. `mStep("Count the x's — same base, so add the indices:", ["= x^{3+4}", "= x^7"])`
3. `mStep("Answer:", "x^7")`

**L1, divide — `x^8 ÷ x^3`**
1. `mStep("Write as a fraction and cancel:", ["\\dfrac{x^8}{x^3}", "= \\dfrac{x \\times x \\times x \\times x \\times x \\times x \\times x \\times x}{x \\times x \\times x}"])`
2. `mStep("Same base, so subtract the indices:", ["= x^{8-3}", "= x^5"])`; Answer `x^5`.

**L1, power of a power — `(y^2)^4`**
1. `mStep("Four lots of y²:", ["(y^2)^4", "= y^2 \\times y^2 \\times y^2 \\times y^2"])`
2. `mStep("Add the indices — or multiply 2 by 4:", ["= y^{2+2+2+2}", "= y^8"])`; Answer `y^8`.

**L2 — `3x^2 × 4x^5`**
1. `mStep("Multiply the coefficients:", "3 \\times 4 = 12")`
2. `mStep("Add the indices of x:", "x^{2+5} = x^7")`
3. `mStep("Put them together:", ["3x^2 \\times 4x^5", "= 12x^7"])`; Answer `12x^7`.

**L2 — `(2x^3)^2`**
1. `mStep("Apply the power to everything inside the bracket:", ["(2x^3)^2", "= 2^2 \\times (x^3)^2"])`
2. `mStep("Square the number; multiply the indices:", ["= 4 \\times x^{3 \\times 2}", "= 4x^6"])`; Answer `4x^6`.

**L3 — `(2x^3y)^2 × 3xy^4`**
1. `mStep("Expand the bracket first:", ["(2x^3y)^2", "= 4x^6y^2"])`
2. `mStep("Multiply the coefficients:", "4 \\times 3 = 12")`
3. `mStep("Add the indices of each letter:", ["x^{6+1} = x^7", "y^{2+4} = y^6"])`
4. `mStep("Answer:", "12x^7y^6")`

**L3, missing index — `5^n ÷ 5^3 = 5^4`:** `mStep("Divide: subtract the indices:", "n - 3 = 4")` · `mStep("Solve:", ["n = 4 + 3", "n = 7"])` · Answer `n = 7`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Simplify $5^3 \times 5^4$ | $5^7$ | add indices 3+4 |
| 1 | Simplify $x^8 \div x^3$ | $x^5$ | subtract 8−3 |
| 1 | Simplify $(y^2)^4$ | $y^8$ | multiply 2×4 |
| 2 | Simplify $3x^2 \times 4x^5$ | $12x^7$ | 3×4, 2+5 |
| 2 | Simplify $12a^6 \div 3a^2$ | $4a^4$ | 12÷3, 6−2 |
| 2 | Simplify $(2x^3)^2$ | $4x^6$ | $2^2$, 3×2 |
| 2 | Simplify $2a^3b \times 5a^2b^4$ | $10a^5b^5$ | 2×5; a: 3+2; b: 1+4 |
| 3 | Simplify $(2x^3y)^2 \times 3xy^4$ | $12x^7y^6$ | $4x^6y^2 \times 3xy^4$ |
| 3 | Simplify $\dfrac{6x^5y^3}{2x^2y}$ | $3x^3y^2$ | 6÷2; 5−2; 3−1 |
| 3 | Find $n$: $5^n \div 5^3 = 5^4$ | $n = 7$ | n−3 = 4 |
| 3 | Simplify $2^3 \times 3^2 \times 2^4 \times 3$ | $2^7 \times 3^3$ | collect bases: 3+4; 2+1 |

#### 3.5 Uniqueness

Key: law, base/letters, every coefficient and exponent. **Pool size:** L1 is the tightest (single law, bases 2–9 ×
exponent pairs) — comfortably > 100; L2/L3 algebraic pools are large. L3 `missingIndex` is a small sub-pool
(≈ 40) but mixes with `combined` in a default set.

---

### Sub-tool: Negative & Fractional (`specialPowers`)

#### 3.1 Question options

- **multiSelect** `questionPool` — "Question Types":
  - `zero` — "Zero power" — weight 1 — defaultActive: true
  - `negative` — "Negative powers" — weight 2 — defaultActive: true
  - `unitFraction` — "Roots as powers (1/n)" — weight 2 — defaultActive: true
  - `fractionBase` — "Negative powers of fractions" — weight 3 — **L2–L3**
  - `generalFraction` — "Powers like 2/3" — weight 3 — **L2–L3**
  - `algebraic` — "With letters" — weight 4 — **L2–L3**
  - `combinedNegFrac` — "Negative fractional powers" — weight 5 — **L3 only**
- dropdown / variables: none
- **Per-level differences:** L1 = `zero`, `negative`, `unitFraction` · L2 adds `fractionBase`, `generalFraction`, `algebraic` (all but `algebraic` active) · L3 adds `combinedNegFrac`; defaults at L3 = `generalFraction`, `fractionBase`, `algebraic`, `combinedNegFrac`.

#### 3.2 Levels

**Level 1 (meaning of the new powers):**
- Parameters: `zero` — `a^0` for a ∈ {2–12, 20, 100}; `negative` — `a^{-n}` with a ∈ {2,3,4,5,10}, n 1–3, asked as "Write as a fraction" (`2^{-3}` → `1/8`) and the reverse (`1/25` → `5^{-2}`); `unitFraction` — `a^{1/2}` for squares ≤ 144, `a^{1/3}` for 8, 27, 64, 125.
- Constraints: all answers exact (integer or unit fraction); `2^{-3}`-style answers shown as `\dfrac{1}{8}` not `0.125`.
- Exclusions: a = 1; negative-power denominators > 1000; `0^0`.
- Misconceptions targeted: `a⁰ = 0` or `= a`; `2⁻³ = −8` or `−6`; `a^{1/2} = a ÷ 2` (choose a so a/2 ≠ √a — reject a = 4).

**Level 2 (fractions and algebra):**
- Parameters: `fractionBase` — `(a/b)^{-n}`, a/b from {2/3, 3/4, 1/2, 2/5, 3/5…}, n 1–2 → `(b/a)^n`; `generalFraction` — `a^{m/n}` with a a perfect nth power: 8^{2/3}, 27^{2/3}, 16^{3/4}, 4^{3/2}, 125^{2/3}; `negative` also at fraction-ish forms `4^{-1/2}`; `algebraic` — `x^{-n}` ⇄ `1/x^n`, `3x^0 = 3`, `(2x)^0 = 1`, `2x^{-2}` → `2/x²`.
- Constraints: answers exact; `generalFraction` always solved root-first in the script.
- Exclusions: results > 500; `a^{m/n}` with a not a perfect nth power; `x^{-1}` (kept for Depth).
- Misconceptions targeted: flipping only the numerator or not flipping at all; `3x⁰ = 1` (vs 3) — `3x^0` and `(3x)^0` are separate questions so both errors are visible; `27^{2/3}` as `27²÷3`.

**Level 3 (combined and algebraic):**
- Parameters: `combinedNegFrac` — `8^{-2/3}`, `(9/4)^{-3/2}`, `16^{-3/4}`, `(27/8)^{-2/3}`; `algebraic` — `(8x^6)^{1/3}`, `(16x^4)^{-1/2}`, `4x^{-2} × 3x^5`, `(x^{-2})^3`, `x^{-3} ÷ x^{-5}`.
- Constraints: results are exact; algebraic answers written with positive indices in the form asked (instruction line says "with positive indices" when the answer would otherwise contain a negative one).
- Exclusions: any step whose intermediate exceeds 4 digits; more than one variable.
- Misconceptions targeted: a negative sign in the index making the answer negative; doing the power before the root and getting unmanageable numbers (the worked example always roots first); `(16x^4)^{-1/2}` losing the coefficient.

#### 3.3 Worked example script

**L1, negative — `2^{-3}`**
1. `mStep("A negative power means the reciprocal:", ["2^{-3}", "= \\dfrac{1}{2^3}"])`
2. `mStep("Work out the power:", "= \\dfrac{1}{8}")`; Answer `\dfrac{1}{8}`.

**L1, zero — `5^0`:** `mStep("Divide a power by itself:", ["5^3 \\div 5^3", "= 5^{3-3}", "= 5^0"])` · `mStep("Anything divided by itself is 1:", "5^3 \\div 5^3 = 1")` · Answer `1`. (This is the division-law derivation from the SoL.)

**L2, `27^{2/3}`**
1. `mStep("The denominator is the root; the numerator is the power:", "27^{\\frac{2}{3}} = \\left(\\sqrt[3]{27}\\right)^2")`
2. `mStep("Take the root first:", ["= 3^2", "= 9"])`; Answer `9`.

**L2, `(2/3)^{-2}`:** `mStep("Flip the whole fraction to remove the negative:", ["\\left(\\dfrac{2}{3}\\right)^{-2}", "= \\left(\\dfrac{3}{2}\\right)^2"])` · `mStep("Square top and bottom:", "= \\dfrac{9}{4}")`.

**L3, `8^{-2/3}`**
1. `mStep("Negative power: reciprocal:", ["8^{-\\frac{2}{3}}", "= \\dfrac{1}{8^{\\frac{2}{3}}}"])`
2. `mStep("Root first, then the power:", ["8^{\\frac{2}{3}} = \\left(\\sqrt[3]{8}\\right)^2", "= 2^2 = 4"])`
3. `mStep("Answer:", "\\dfrac{1}{4}")`

**L3, `(16x^4)^{-1/2}`:** reciprocal → `1/(16x^4)^{1/2}` → "Take the square root of each part: `√16 = 4`, `(x^4)^{1/2} = x^2`" → Answer `\dfrac{1}{4x^2}`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Work out $5^0$ | $1$ | $5^3 \div 5^3 = 5^0 = 1$ |
| 1 | Write $2^{-3}$ as a fraction | $\frac{1}{8}$ | reciprocal of $2^3$ |
| 1 | Work out $49^{\frac{1}{2}}$ | $7$ | square root of 49 |
| 2 | Work out $\left(\frac{2}{3}\right)^{-2}$ | $\frac{9}{4}$ | flip: $\left(\frac{3}{2}\right)^2$ |
| 2 | Work out $27^{\frac{2}{3}}$ | $9$ | $(\sqrt[3]{27})^2 = 3^2$ |
| 2 | Work out $16^{\frac{3}{4}}$ | $8$ | $(\sqrt[4]{16})^3 = 2^3$ |
| 2 | Write $x^{-3}$ with a positive index | $\frac{1}{x^3}$ | reciprocal |
| 2 | Work out $3x^0$ | $3$ | $3 \times 1$ |
| 3 | Work out $8^{-\frac{2}{3}}$ | $\frac{1}{4}$ | $\frac{1}{(\sqrt[3]{8})^2}$ |
| 3 | Work out $\left(\frac{9}{4}\right)^{-\frac{3}{2}}$ | $\frac{8}{27}$ | $\left(\frac{4}{9}\right)^{\frac{3}{2}} = \left(\frac{2}{3}\right)^3$ |
| 3 | Simplify $(16x^4)^{-\frac{1}{2}}$ | $\frac{1}{4x^2}$ | reciprocal; $\sqrt{16}=4$, $(x^4)^{\frac12}=x^2$ |
| 3 | Simplify $4x^{-2} \times 3x^5$ | $12x^3$ | 4×3; −2+5 |

#### 3.5 Uniqueness

Key: pool option, base/fraction, every index numerator/denominator. **Pool size:** L1 `zero` is small (≈ 12) — combined with
`negative` and `unitFraction` the default L1 set gives > 60; `unitFraction` alone is ≈ 16 (note for the
implementer: if a teacher leaves only `zero` ticked the retry loop will repeat — acceptable, flag in the
info modal). L2/L3 pools ≥ 40 each.

---

### Sub-tool: Common Base (`commonBase`)

#### 3.1 Question options

- **multiSelect** `questionPool` — "Question Types":
  - `writeAsPower` — "Write as a power" — weight 1 — defaultActive: true
  - `solveIndex` — "Solve an index equation" — weight 3 — defaultActive: true
  - `evaluate` — "Simplify and evaluate" — weight 3 — defaultActive: true
  - `interms` — "Express in terms of …" — weight 5 — **L3 only**
- **multiSelect** `basePool` — "Bases used": `two` (2) · `three` (3) · `five` (5) · `ten` (10) — `two` and `three` defaultActive; `five` and `ten` default off. Per-level: L1 `two`, `three`, `five`, `ten` available; L2–L3 same.
- **Per-level differences:** L1 = `writeAsPower`, `solveIndex`, `evaluate` (`evaluate` off); L2 = adds fractional/negative targets; L3 adds `interms`.
- **BIDMAS with indices (SoL bullet):** not a separate pool here — see §7 (decision 1).

#### 3.2 Levels

**Level 1 (match the base, positive indices):**
- Parameters: `writeAsPower` — write 8, 16, 32, 64 as powers of 2; 9, 27, 81 as powers of 3; 25, 125 as powers of 5; 100, 1000 as powers of 10; `solveIndex` — `2^x = 32`, `3^x = 81`, `5^x = 125`, `10^x = 1000` (x 2–6); `evaluate` (off by default) — `2^3 × 2^2`, `3^4 ÷ 3^2` evaluated to a number.
- Constraints: x is a positive integer ≤ 6; instruction names the target base for `writeAsPower`.
- Exclusions: x = 1; bases outside the active `basePool`.
- Misconceptions targeted: `8 = 2⁴` (wrong power — keep a powers table in `workingScaffold`); `2^x = 32` as `x = 16` (dividing instead of matching).

**Level 2 (negative and fractional targets, different bases to match):**
- Parameters: `writeAsPower` — `1/8 = 2^{-3}`, `1/9 = 3^{-2}`, `0.01 = 10^{-2}`, `1/25`; `solveIndex` — both sides need converting: `4^x = 8` (x = 3/2), `9^x = 27` (3/2), `8^x = 4` (2/3), `2^{x+1} = 32` (4), `2^x = \frac{1}{16}` (−4); `evaluate` — `2^5 × 4^3 ÷ 8^2` (= 32), `9^2 × 3^{-3}`, `27 × 3^{-2}`.
- Constraints: fractional answers in lowest terms; `evaluate` answers are integers or unit fractions; every `evaluate` question is solvable by writing everything in one base.
- Exclusions: bases that are not powers of one common prime within the active `basePool`; x = 0.
- Misconceptions targeted: using the laws before the bases match (`2^5 × 4^3 = 8^8`); `4^x = 8` answered as `x = 2` (4² = 16); cancelling bases (`2^5 ÷ 2^2 = 1^3`).

**Level 3 (two-sided conversion, algebraic exponents, "in terms of"):**
- Parameters: `solveIndex` — `4^{x+1} = 8^{x-1}` (x = 5), `9^x = \frac{1}{27}` (−3/2), `2^{x+3} = 4^{x-1}` (5), `27^x = 9^{x+1}`; `interms` — "Given that `2^x = a`, write `4^x` / `2^{x+3}` / `8^x` in terms of `a`" (`a^2`, `8a`, `a^3`); `evaluate` — `4^{\frac12} × 8^{\frac23} × 2^{-3}`, `(2^{-1})^3 × 16^{\frac34}`.
- Constraints: every equation has a single integer or simple-fraction solution; `interms` answers are monomials in `a` with positive integer coefficient/index.
- Exclusions: equations whose two sides reduce to identical expressions (infinite solutions); more than two distinct original bases.
- Misconceptions targeted: forgetting to apply the multiplier to the whole exponent (`4^{x+1}` → `2^{2x+1}`, not `2^{2x+2}`); sign errors when equating indices.

#### 3.3 Worked example script

**L1, write as a power — `32` as a power of `2`:** `mStep("Keep multiplying by 2 until you reach 32:", "2, 4, 8, 16, 32")` · `mStep("Count the 2s:", "32 = 2 \\times 2 \\times 2 \\times 2 \\times 2 = 2^5")` · Answer `2^5`.

**L1, solve — `3^x = 27`:** `mStep("Write 27 as a power of 3:", "27 = 3^3")` · `mStep("Same base, so the indices are equal:", ["3^x = 3^3", "x = 3"])` · Answer `x = 3`.

**L2, solve — `4^x = 8`**
1. `mStep("Plan: both numbers are powers of 2 — write them with base 2:", ["4 = 2^2", "8 = 2^3"])`
2. `mStep("Replace and use (aᵐ)ⁿ = aᵐⁿ:", ["(2^2)^x = 2^3", "2^{2x} = 2^3"])`
3. `mStep("Same base, so the indices are equal:", "2x = 3")`
4. `mStep("Solve:", ["x = \\dfrac{3}{2}"])`; Answer `x = \dfrac{3}{2}`.

**L2, evaluate — `2^5 × 4^3 ÷ 8^2`**
1. `mStep("Plan: write every number with base 2:", "4 = 2^2, \\quad 8 = 2^3")`
2. `mStep("Rewrite each power:", ["2^5 \\times (2^2)^3 \\div (2^3)^2", "= 2^5 \\times 2^6 \\div 2^6"])`
3. `mStep("Multiply: add the indices. Divide: subtract.", ["= 2^{5+6-6}", "= 2^5"])`
4. `mStep("Answer:", "32")`

**L3, solve — `4^{x+1} = 8^{x-1}`:** base 2 both sides → `2^{2(x+1)} = 2^{3(x-1)}` → `2x + 2 = 3x - 3` → `x = 5`. Check step: `4^6 = 4096 = 8^4`.

**L3, in terms of — `2^x = a`, `4^x`:** `mStep("Write 4 as a power of 2:", "4^x = (2^2)^x")` · `mStep("Rearrange the index so 2^x appears:", ["= (2^x)^2", "= a^2"])` · Answer `a^2`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Write $32$ as a power of $2$ | $2^5$ | five 2s multiplied |
| 1 | Solve $3^x = 27$ | $x = 3$ | $27 = 3^3$ |
| 1 | Write $1000$ as a power of $10$ | $10^3$ | three 10s |
| 2 | Write $\frac{1}{9}$ as a power of $3$ | $3^{-2}$ | $\frac{1}{3^2}$ |
| 2 | Solve $4^x = 8$ | $x = \frac{3}{2}$ | $2^{2x} = 2^3$ |
| 2 | Work out $2^5 \times 4^3 \div 8^2$ | $32$ | $2^{5+6-6} = 2^5$ |
| 3 | Solve $4^{x+1} = 8^{x-1}$ | $x = 5$ | $2x+2 = 3x-3$ |
| 3 | Solve $9^x = \frac{1}{27}$ | $x = -\frac{3}{2}$ | $3^{2x} = 3^{-3}$ |
| 3 | Given $2^x = a$, write $4^x$ in terms of $a$ | $a^2$ | $(2^x)^2$ |

#### 3.5 Uniqueness

Key: pool option, every base and exponent, the equation sides. **Pool size:** L1 `writeAsPower` ≈ 12 and `solveIndex` ≈ 16
combine to > 24; L2/L3 equations are parameterised (coefficients on x, constants) giving > 60.

---

## 4. Variety requirements

- Numeric-base spread: across a worksheet, no base more than ~3 times; weight the `Index Laws` numeric questions across bases 2–9, with 2, 3, 5, 10 still common (the Common Base tool needs them).
- Exponent spread: indices span the allowed range; do not cluster on 2 and 3.
- Algebra: rotate letters; two-variable questions at L2–L3 use two *different* letters from the pool.
- Question *shape* mix: for `indexLaws`, mix `multiply` / `divide` / `powerOfPower` so no two consecutive questions use the same law (Smart Progressor sorts by weight; ties are shuffled).
- No worded questions, so no name pool.

---

## 5. Info modal content

Draft `INFO_SECTIONS` (the shell adds Modes and Question Options):

- **Powers & Roots** (icon: 🔢) — *Overview:* Index notation, squares, cubes and roots, from recall to combined expressions. · *Level 1 — Green:* Writing repeated multiplication as a power, squares to 12², small cubes and their roots. · *Level 2 — Amber:* Squares to 15², cubes, and expressions; negative bases for the (−3)² vs −3² trap. · *Level 3 — Red:* Powers and roots of fractions and decimals, calculator keys with rounding.
- **Index Laws** (icon: ✖️) — *Overview:* Multiplying, dividing and powers of powers, numeric then algebraic. The working expands the repeated factors before stating the rule. · *Level 1:* One law, one base, answers left in index form. · *Level 2:* Coefficients and two letters, including bracketed terms such as (2x³)². · *Level 3:* Combined laws, algebraic fractions, several bases and missing indices.
- **Negative & Fractional** (icon: ➖) — *Overview:* Zero, negative and fractional powers, built from the laws of indices. · *Level 1:* a⁰, a⁻ⁿ and unit-fraction roots. · *Level 2:* Negative powers of fractions, powers like 2/3, algebraic forms. · *Level 3:* Negative fractional powers and algebraic expressions.
- **Common Base** (icon: 🧮) — *Overview:* Write numbers as powers of one base so the laws apply, then use that to solve index equations and evaluate. · *Level 1:* Write numbers as positive powers; solve with matching bases. · *Level 2:* Negative targets, different bases to match, evaluate expressions. · *Level 3:* Equations with x on both sides, express in terms of a letter.

---

## 6. Representations, scaffolds & companions (not blocking the first build)

- **First build:** text working with the expand-first fragments above — no new representation.
- **Working scaffold (recommended, small):** a powers table (`2¹ … 2⁶`, `3¹ … 3⁴`, `5¹ … 5³`, `10¹ … 10⁴`) as `workingScaffold` with `placement: "question"`, hide-able, on the Common Base tab (SoL: "keep a table of powers of 2, 3, 5 and 10 visible").
- **Candidate representation prong (needs a design decision):** a *pattern table* extending powers of 2 or 10 downward (…8, 4, 2, 1, ½, ¼, ⅛) to reveal `a⁰` and `a⁻ⁿ`. This is a sibling of the place value table (powers of 10 headers already exist there) — extend that rather than invent a new one. Hook for a later `Negative & Fractional` pass.
- **Teach deck (drafted, parked-gated):** `specs/decks/indices.md` — the teacher's initial input, one lesson per SoL topic/tab (genuine hooks only, explanation, model, we-do, embedded Depth diagnostics, then a hand-off to Whiteboard/Worksheet/Depth with pre-set Question Options). One new scene (`indexExpand`, factor tiles; the ÷ picture also gives the zero and negative powers). Never blocks the tool.
- **Depth bank (drafted, ungated):** `specs/depth/indices.md` — 43 items across the four tabs, built from this unit's
  misconceptions. Ships with the tool (no gate). Its optional "Write it out" scaffold reuses the deck's tile component.
- **Build order suggestion:** tool (this spec) → Depth bank → deck (once the dev-gate decision in `docs/BACKBENCH.md` is revisited).
- **Skills:** parked — no work here.

---

## 7. Open decisions (answer before this goes `ready`)

1. **BIDMAS with indices** (SoL Topic 4 bullet). Order of Operations (`/order-of-operations`) already covers BIDMAS with indices, brackets and roots. Recommendation: do **not** duplicate it — add a `See also: Order of Operations` line in the info modal and keep one small pool here only if you want index-specific bracket traps (`(2×3)²` vs `2×3²`). Choose: (a) cross-link only, (b) add a small `Indices & brackets` pool to Powers & Roots.
2. **Group name on the landing page** — `Powers & standard form` (recommended, matches the next tool) or `Indices`.
3. **Tab 3 label** — "Negative & Fractional" (zero is in the info modal) vs "Zero, Negative & Fractional" (full SoL name, wider tab on phones).
4. **Calculator pool** in Powers & Roots L3 (rounding to 1 d.p.) — keep, or move to a later calculator-skills tool.
5. **Prime factorisation in index form** (`360 = 2³ × 3² × 5`) and HCF/LCM in index form are GCSE indices content that this SoL block doesn't list; there is no prime-factor tool in the repo. Candidate follow-up tool, not in this build.
6. **Standard form** (Topics 5–8) is a separate sibling tool (`standard-form`), to be specced next; it will reuse the Index Laws working helpers.

---

## 8. Out of scope / future ideas

- Standard form (sibling spec), surds (exists), exponential growth/decay, compound interest (Percentages tool), logarithms (A-level).
- Indices on a calculator beyond the Powers & Roots L3 `calculator` pool.
- Algebraic index equations with letters as bases.

---

## Implementation notes (what was built, and where it differs)

Open decisions in §7 were answered as recommended: group **Powers & standard form**; tab 3 **Negative & Fractional**; the calculator pool stays in Powers & Roots Level 3; BIDMAS is cross-linked to Order of Operations rather than duplicated; prime factorisation in index form is not built (a follow-up).

Differences from the draft above:
- **Level 3 defaults** for Powers & Roots: fractions/decimals, roots of fractions/decimals, combined and negatives are all on, so a fresh Level 3 shows its own content (the draft had them off).
- **Common Base Level 2** does not offer "Express in terms of a letter" (it is Level 3 only, as §3 says).
- **Depth bank** has 74 items, not 43: the draft's one Start here per tab was changed to one per level (the shell's quick check), and extra items were added so each Question Option, switched on alone, leaves at least three items (the repo's Depth guard). See `specs/depth/indices.md`.
- **Lessons** were built on the shell (see `CLAUDE.md` → Lessons). The Teach deck step is not built yet.
