# Tool Spec: Binomial Expansion

**Status:** implemented

AQA A-level Mathematics (7357), Year 2. **One tool, five sub-tools (tabs)**, built on `ToolShell` like Factor Theorem and Partial Fractions (Whiteboard / Worked Example / Worksheet, Levels 1–3, no Depth bank or Teach deck). Route `/binomial-expansion`, `src/tools/Algebra/BinomialExpansion.tsx`; the fraction and partial-fraction generators live in `BinomialFractions.ts` and `BinomialPartialFractions.ts` (modules, not routes) and the shared maths in `src/shared/binomial.tsx` (exact fractions, the binomial series, the range-of-validity number line, option helpers). Dev-gated (`enabled: false`) until reviewed.

| Tab | Case |
|---|---|
| Expand (a + bx)ⁿ | a single bracket |
| Fractions: one bracket | a fraction with **one** bracket in the denominator: no partial fractions needed |
| Power of a fraction | that fraction squared, cubed, √ or ∛ |
| With partial fractions | **two or more different** brackets in the denominator: partial fractions first |
| Range of validity | only the range is asked: one bracket, two brackets whose ranges overlap, then partial-fraction denominators (three brackets or a repeat). Sits after With partial fractions |
| Find the unknown | the power n is known; a constant in the bracket is found from a coefficient of the expansion, then used to go on. After Range of validity |
| Approximation | use a small x in an expansion to estimate a value: the same power selectors as Expand, up to x² or x³, optionally working out x |

Everything is exact (rational arithmetic); the range of validity is written in modulus form, |x| < c (the answer line also gives −c < x < c). Numerators are written highest power first; series answers stay ascending. Positive whole-number n (Year 1) and integration are out of scope.

**Power n (Expand)** is two selectors: sign (Positive · Negative) and size (Whole · Standard fractions ½, 3/2, ⅓ · Extended fractions ¼, ¾, ⅕–⅘, not on Level 1); Whole needs Negative; the negatives of every fraction are included. A selector with one option is hidden.

## 1. Expand (a + bx)ⁿ and Approximation

**Expand (a + bx)ⁿ.** Options (all tick-any): Power n, Coefficient of x, Written as (powers / roots and fractions), Ask for (expansion · expansion and range · one coefficient), Expand up to (x² · x³ · x⁴).
- **The level is the bracket, as on the fraction tabs.** **Level 1:** (1 ± x)ⁿ, no k. **Level 2:** (1 + kx)ⁿ, k ±2 to ±5 or a fraction (a Coefficient of x selector: Whole numbers · Fractions). **Level 3:** (a + bx)ⁿ with a ≠ 1: aⁿ is taken out first (a a perfect power so aⁿ is rational).
- **Any power at any level**, chosen with two selectors: sign (Positive · Negative) and size (Whole · ½, ⅓, 3/2 · ¼ to ⅘, the last off by default); Whole needs Negative. Up to x² / x³ / x⁴ is its own option.

Working: take out the constant (Level 3) · expand with n and u = kx substituted, one term per fragment · simplify · multiply by aⁿ · range (number line). The answer line gives the result.

**Approximation.** Substitute a small x into the expansion to estimate a value (Level 1: expansion given; Level 2: expand first; Level 3: a ≠ 1, and "why can't this x be used?").

Samples: (1 + 2x)⁻¹ → 1 − 2x + 4x², |x| < ½ · (1 − 3x)^{1/2} → 1 − (3/2)x − (9/8)x², |x| < ⅓ · (4 + x)^{−1/2} → ½ − x/16 + 3x²/256, |x| < 4 · (1 + 4x)^{1/2} → 1 + 2x − 2x², |x| < ¼; (1 + 4x)^{1/2} ≈ 1 + 2x − 2x² with x = 0.01 gives 1.0198 (calculator 1.019804…).

## 2. Fractions: one bracket · Power of a fraction

A fraction with one bracket below is a product: (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹. Expand each bracket (the numerator is a polynomial, the denominator a binomial series), multiply, then multiply by any constants taken out. The range is the smaller of the brackets' ranges; a positive whole-number power of the numerator puts no limit on x.
- **The level is the denominator bracket** (the numerator is any px + q), the same ladder as Expand: **Level 1** 1 ± x · **Level 2** 1 + kx (|k| ≥ 2) · **Level 3** a + bx (a ≥ 2).
- **The power is an option on every level, all ticked by default:** *Fractions: one bracket*: the denominator bracket to a power, grouped as Whole (1, 2, 3), Roots (√, ∛) or Extended (¼ ¾, ⅕–⅘; off by default), the numerator staying any px + q; a root denominator at Level 3 needs a perfect-power constant (4, 9 · 8, 27 · 16, 81 · 32, 243). *Power of a fraction*: the whole fraction squared, cubed, √, ∛, or to a quarter / fifth power (¼, ¾, ⅕–⅘). The numerator is any px + q only for a whole-number power. For a root the numerator is expanded too, so it follows the same ladder as the denominator (Level 1: 1 ± x; Level 2: 1 + kx; Level 3: a + bx with a a perfect power: 1, 4, 9 or 1, 8, 27), and Levels 2 and 3 keep the two ranges different.
- Options: Denominator power (one bracket below); Fraction raised to and Written as (power of a fraction); Ask for; Expand up to.

Working: take out the constants / write as a product · expand each bracket · multiply (up to xᵐ) · multiply by the constants · range (one or two intervals, then the smaller).

## 3. With partial fractions

The denominator has two or more different brackets, so: (improper: divide first) · partial fractions · constants by substitution of each root · the one constant a repeated root cannot reach by **letting x = 0** (an equation A + B + C = …, then the two constants already found; another x if a root is 0) · each fraction as constant × (1 + kx)ⁿ and expanded · add like terms · range for each, then the smaller (number line).
- **Level 1:** (1 + ax)(1 + bx), linear or constant numerator, up to x². **Level 2:** factors with a constant other than 1, up to x³. **Level 3:** a repeated factor, or divide first.
- The two ranges always differ, so taking the smaller is a real decision. Constants are whole numbers.
- Samples: (5 − x)/((1 + x)(1 − 2x)) = 2/(1 + x) + 3/(1 − 2x) → 5 + 4x + 14x² + 22x³, |x| < ½ · (5 + x)/((2 − x)(1 + 3x)) = 1/(2 − x) + 2/(1 + 3x) → 5/2 − (23/4)x + (145/8)x² − (863/16)x³, |x| < ⅓.

## 3b. Find the unknown

AQA 7357 gives (a + bx)ⁿ for any rational n, so n stays known (the 2020 Paper 1 style: a constant in the bracket or the series is found); the unknown is a (or b). Options: the sign and size of n (as Expand); **When two values fit** (Sign given · Both values: a quadratic in a or b has two roots; with a sign given the question says "where a > 0"); **Then ask for** (Just the unknown · A coefficient · Range of validity, as part (b)); Level 3 also **Unknown** (b · a and b) and **Given** (coefficient of x · x²).
- **Level 1:** (1 + ax)ⁿ, the coefficient of x is given (linear in a). **Level 2:** (1 + ax)ⁿ, the coefficient of x² is given (a² = …). **Level 3:** (a + bx)ⁿ (a a perfect power), b from a coefficient, or a and b from the first two terms (a > 0).
- Working: the coefficient formula with the unknown · solve (a² then ±, then the sign) · for a part (b) the found bracket is expanded (coefficient) or its range stated.

## 4. Acceptance

`src/tests/binomialExpansion.test.ts`, `binomialFractions.test.ts`, `binomialPartialFractions.test.ts` (all drive the one tool): the sample answers above; every generated question matches an independent series (series division for partial fractions; the true function numerically for fractions); the stated range is the smaller bound; Level 2 never repeats a Level 1 question; the repeated-root working uses x = 0; every KaTeX string renders.
