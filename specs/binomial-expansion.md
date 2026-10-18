# Tool Spec: Binomial Expansion

**Status:** draft <!-- awaiting the teacher's approval; Claude Code only implements specs marked `ready` -->

**Route:** `/binomial-expansion` · **Category:** Pure Mathematics (A-Level) · **File:** `src/tools/Algebra/BinomialExpansion.tsx`

Built on `ToolShell` like Factor Theorem and Partial Fractions: Whiteboard / Worked Example / Worksheet, Levels 1–3 (Green / Yellow / Red). **No Depth bank, no Teach deck** (A-level tools follow this format).

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Binomial Expansion |
| Tool id / URL path | `/binomial-expansion` |
| Category | Pure Mathematics (A-Level) |
| Card description | Expand (a + bx)ⁿ for negative and fractional n, state where it is valid, use it to approximate, and expand a fraction by splitting it into partial fractions first |
| Defaults | standard |

**Scope: AQA A-level Mathematics (7357), Year 2.** The binomial expansion of (a + bx)ⁿ for any rational n, with its range of validity |bx/a| < 1 (proof not required) and its use for approximation; expanding an algebraic fraction by writing it in partial fractions first (linear factors, one possibly repeated, at most three fractions, constant numerators; an improper fraction is divided first). Positive-integer n (Year 1) is assumed known and is not a tab. Integration is out of scope.

**Pedagogical intent.** After a lesson a student can expand (a + bx)ⁿ up to a stated power for any rational n, give the range of x for which it is valid, use it to estimate a value, and carry the whole chain through for a rational function: partial fractions, expand each part, collect, and take the smaller range. It follows Partial Fractions (reiterated inside the working) and sits at the top of the Year 2 algebra sequence.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `expand` | Expand (a + bx)ⁿ | simple | "Expand, in ascending powers of x:" (the line adapts to what is asked: see QO) |
| `partial` | With partial fractions | simple | "Express in partial fractions, then expand:" |
| `approx` | Approximation | worded | — |

All three show answers as exact fractions. Ranges of validity are written in modulus form, **|x| < c**, in the question's answer and the working (the answer line also gives −c < x < c once).

---

## 3. Sub-tool detail

Notation: u = kx, so (1 + u)ⁿ = 1 + nu + n(n−1)/2! u² + n(n−1)(n−2)/3! u³ + n(n−1)(n−2)(n−3)/4! u⁴ + … , valid for |u| < 1. (a + bx)ⁿ = aⁿ(1 + (b/a)x)ⁿ, valid for |x| < |a/b|. All arithmetic is exact (rational).

### Sub-tool: Expand (a + bx)ⁿ (`expand`)

#### 3.1 Question options (multiSelect pools, Smart Progressor weights)
- **Power n** (one per question): `neg` n = −1, −2, −3 · `half` n = ½, −½ · `three` n = 3/2, −3/2, 1/3.
- **Expand up to** : x² · x³ · x⁴ (a pool; the question draws one). Default follows the level.
- **Ask for**: `expansion` the first terms in ascending powers · `coef` the coefficient of one named power · `validity` the range of x as well as the expansion (so the answer is the expansion and |x| < c) · `both`.
- **Constants** (Level 2 up): `whole` k, a, b whole numbers · `frac` k a simple fraction, such as ½ or −⅔.

#### 3.2 Levels
- **Level 1 (Green):** (1 + kx)ⁿ with whole k ∈ {±1, ±2, ±3}, n from `neg` or `half` (n = −1, −2, ½, −½), expand to x², ask for the expansion and the range.
- **Level 2 (Yellow):** (1 + kx)ⁿ with k negative or a simple fraction, n also from `neg` (−3) and `three`, expand to x³, coefficient questions allowed.
- **Level 3 (Red):** (a + bx)ⁿ with a ≠ 1, so aⁿ is taken out first: a is chosen so aⁿ is rational (a perfect square for ±½ and ±3/2, a perfect cube for ⅓; any a from 2 to 5 for integer n), b a whole number; expand to x² or x³; the range is |x| < |a/b|.

#### 3.3 Worked example script
1. Write (a + bx)ⁿ in the form aⁿ(1 + (b/a)x)ⁿ (Level 3; skipped when a = 1). Fragments: factor out, then the new bracket.
2. Name u = (b/a)x and write the formula with n and u substituted, one term per fragment.
3. Substitute u and simplify each term (two or three terms; one step per term group).
4. Multiply by aⁿ (Level 3).
5. State the range: |u| < 1 so |x| < |a/b|.
6. Answer (green line).

The visual (stepVisualRenderer, placement "top", `stepVisualKeepsWorking` false): a number line with the open interval (−c, c) shaded on the range step.

#### 3.4 Sample questions (acceptance set)
| Question | Answer |
|---|---|
| (1 + 2x)⁻¹, up to x² | 1 − 2x + 4x²; valid for |x| < ½ |
| (1 − 3x)^{1/2}, up to x² | 1 − (3/2)x − (9/8)x²; valid for |x| < ⅓ |
| (4 + x)^{−1/2}, up to x² | ½ − x/16 + 3x²/256; valid for |x| < 4 |
| (1 + 4x)^{1/2}, up to x² | 1 + 2x − 2x²; valid for |x| < ¼ |

#### 3.5 Uniqueness
Key = tab, n, a, b (or k), expand-to, ask, plus a random id.

---

### Sub-tool: With partial fractions (`partial`)

A fraction f(x) = N(x) / D(x) is given with D a product of linear factors. The student writes it in partial fractions (reiterating the Partial Fractions tool: substitute the root of each factor, equate coefficients for a repeated factor), expands each term, collects the powers of x and gives the range of x.

#### 3.1 Question options
- **Denominator** (one form per question): `distinct` (1 + ax)(1 + bx) · `scaled` (c + dx)(e + fx), taking the constant out of each · `repeated` (1 + ax)(1 + bx)² or (1 + ax)² · `improper` degree of N ≥ degree of D, divided first.
- **Numerator**: `linear` (px + q) · `constant`.
- **Expand up to**: x² · x³ (default follows the level).
- **Ask for**: `expansion` the first terms · `coef` one named coefficient · `validity` adds the range of x.
- Question wording (always): "Express f(x) = … in partial fractions. Hence find the first (three or four) terms in the expansion of f(x) in ascending powers of x. State the range of values of x for which the expansion is valid."

#### 3.2 Levels
- **Level 1 (Green):** `distinct`, linear numerator, factors (1 + ax)(1 + bx) with a, b ∈ {±1, ±2, ±3}, |a| ≠ |b| (so the two ranges differ and the smaller must be chosen), expand to x².
- **Level 2 (Yellow):** `scaled` factors with a constant other than 1 (e.g. (2 − x)(1 + 3x)), expand to x³, constant or linear numerator.
- **Level 3 (Red):** `repeated` ((1 + ax)(1 + bx)², or A/(1+ax) + B/(1+bx) + C/(1+bx)²), or `improper` (numerator quadratic, denominator a quadratic: divide first, the polynomial part contributes to the low powers); expand to x² or x³.

Partial-fraction constants are whole numbers (chosen first, the numerator built from them); no fractional constants in this tab.

#### 3.3 Worked example script
1. (Improper only) divide first: Q + R/D.
2. Partial fractions: write N/D ≡ A/(…) + B/(…), multiply through, substitute each root (and equate coefficients for the repeated factor). The step label carries `[[partial-fractions|partial fractions]]`.
3. Write each fraction as a constant × (1 + kx)ⁿ (taking the constant out of a scaled factor).
4. Expand each term to the required power (one fragment-built step per term).
5. Collect: add the coefficients of each power of x (a small table of rows per term, then the total row).
6. Range of validity: one line per term (|kx| < 1 gives |x| < …), then "the expansion is valid when both are, so |x| < (the smaller)".
7. Answer (green line).

The visual (number line, placement "top"): each term's interval drawn on its own line, the overlap highlighted in the final step.

#### 3.4 Sample questions (acceptance set)
| f(x) | Partial fractions | Expansion | Valid for |
|---|---|---|---|
| (5 − x) / ((1 + x)(1 − 2x)) | 2/(1 + x) + 3/(1 − 2x) | 5 + 4x + 14x² + 22x³ | |x| < ½ |
| (5 + x) / ((2 − x)(1 + 3x)) | 1/(2 − x) + 2/(1 + 3x) | 5/2 − (23/4)x + (145/8)x² − (863/16)x³ | |x| < ⅓ |

Both are also verified by expanding N/D directly (series division): the coefficients must match.

#### 3.5 Uniqueness
Key = denominator form, factors, numerator, expand-to, plus a random id.

---

### Sub-tool: Approximation (`approx`)

A worded question: a binomial expansion (given or to find) is used with a small value of x to estimate a number.

#### 3.1 Question options
- **Ask for**: `use` use the expansion with x = … to estimate a value · `valid` decide whether a given x can be used and say why.
- **Expand up to**: x² · x³.

#### 3.2 Levels
- **Level 1 (Green):** the expansion is given as a line of the question (e.g. "(1 + 4x)^{1/2} ≈ 1 + 2x − 2x²"); substitute a small x (such as 0.01) to estimate √1.04, and compare with the calculator value.
- **Level 2 (Yellow):** expand (1 + kx)ⁿ yourself first, then use x to estimate a value such as 1/√0.98 or ∛1.06.
- **Level 3 (Red):** choose the value of x that makes (a + bx)ⁿ equal a given number (including a ≠ 1, e.g. (4 + x)^{1/2} with x = 0.2 for √4.2), and `valid` questions: "Explain why x = … cannot be used with this expansion".

#### 3.3 Worked example script
1. Expand (Levels 2–3, or reference the given expansion).
2. State the range of validity.
3. Choose / check x: show |bx/a| < 1 (or fails).
4. Substitute x term by term (fragments), add.
5. Compare to the calculator value to a stated number of decimal places (a tStep).
6. Answer.

#### 3.4 Sample questions
| Question | Answer |
|---|---|
| (1 + 4x)^{1/2} ≈ 1 + 2x − 2x²; use x = 0.01 to estimate √1.04 | 1 + 0.02 − 0.0002 = 1.0198 (calculator 1.019804…) |
| Explain why x = ¼ cannot be used in the expansion of (1 + 4x)^{1/2} | |4x| = 1 is not less than 1, so the expansion is not valid |

#### 3.5 Uniqueness
Key = n, a, b, x, ask, plus a random id.

---

## 4. Variety requirements
- Never a repeated (n, k, expand-to) within one worksheet; a worksheet of 15 at Level 1 mixes n = −1, −2, ½, −½.
- In `partial`, the two ranges of validity always differ (|a| ≠ |b| after constants are taken out), so the "take the smaller" decision is real.
- Signs: both positive and negative k appear from Level 1; the (−x) sign is the commonest slip.

## 5. Info modal content (INFO_SECTIONS)
- **Scope:** AQA A-level Mathematics (7357), Year 2; what is and is not covered.
- **Expand (a + bx)ⁿ:** the formula; taking a out first; the range |bx/a| < 1.
- **With partial fractions:** the chain, one line per step; why the range is the smaller one.
- **Approximation:** substituting a small x; why x must be in the range.
- **Levels** per tab; **Question options** per pool.
- **Not covered:** positive-integer n (Year 1), integration, irreducible quadratic factors.

## 6. Out of scope / future ideas
- A graph of the function beside its first partial sums, showing agreement inside the range and divergence outside it (SmartGrapher) as a visual for the validity step.
- Fractional partial-fraction constants.
- Depth bank and Teach deck: deliberately not part of A-level tools.

## 7. Tests (acceptance)
- `src/tests/binomialExpansion.test.ts`: for every generated question, the exact coefficients match an independent series computation (rational arithmetic); for `partial`, the sum of the expanded partial fractions equals series division of N/D to the stated power; the stated range equals the minimum of each factor's bound; every KaTeX string renders; the four `expand` and two `partial` samples above reproduce exactly.
