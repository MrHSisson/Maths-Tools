# Tool Spec: Binomial Expansion

**Status:** implemented

AQA A-level Mathematics (7357), Year 2. **One tool, five sub-tools (tabs)**, built on `ToolShell` like Factor Theorem and Partial Fractions (Whiteboard / Worked Example / Worksheet, Levels 1–3, no Depth bank or Teach deck). Route `/binomial-expansion`, `src/tools/Algebra/BinomialExpansion.tsx`; the fraction and partial-fraction generators live in `BinomialFractions.ts` and `BinomialPartialFractions.ts` (modules, not routes) and the shared maths in `src/shared/binomial.tsx` (exact fractions, the binomial series, the range-of-validity number line, option helpers). Dev-gated (`enabled: false`) until reviewed.

| Tab | Case |
|---|---|
| Expand (a + bx)ⁿ | a single bracket |
| One bracket below | a fraction with **one** bracket in the denominator: no partial fractions needed |
| Power of a fraction | that fraction squared, cubed, √ or ∛ |
| With partial fractions | **two or more different** brackets in the denominator: partial fractions first |
| Approximation | use a small x in an expansion to estimate a value |

Everything is exact (rational arithmetic); the range of validity is written in modulus form, |x| < c (the answer line also gives −c < x < c). Numerators are written highest power first; series answers stay ascending. Positive whole-number n (Year 1) and integration are out of scope.

## 1. Expand (a + bx)ⁿ and Approximation

**Expand (a + bx)ⁿ.** Options (all tick-any): Power n, Coefficient of x, Written as (powers / roots and fractions), Ask for (expansion · expansion and range · one coefficient), Expand up to (x² · x³ · x⁴).
- **Level 1:** (1 + kx)ⁿ, whole k from ±1 to ±5, n = −1, −2, ½, −½, written as powers or as roots and reciprocals; up to x².
- **Level 2 (never a Level 1 question):** the powers Level 1 lacks (−3, −4, 3/2, −3/2, ⅓) with any k, or Level 1's powers with a *fractional* k; up to x³.
- **Level 3:** (a + bx)ⁿ with a ≠ 1: aⁿ is taken out first (a a perfect power so aⁿ is rational).

Working: take out the constant (Level 3) · expand with n and u = kx substituted, one term per fragment · simplify · multiply by aⁿ · range (number line). The answer line gives the result.

**Approximation.** Substitute a small x into the expansion to estimate a value (Level 1: expansion given; Level 2: expand first; Level 3: a ≠ 1, and "why can't this x be used?").

Samples: (1 + 2x)⁻¹ → 1 − 2x + 4x², |x| < ½ · (1 − 3x)^{1/2} → 1 − (3/2)x − (9/8)x², |x| < ⅓ · (4 + x)^{−1/2} → ½ − x/16 + 3x²/256, |x| < 4 · (1 + 4x)^{1/2} → 1 + 2x − 2x², |x| < ¼; (1 + 4x)^{1/2} ≈ 1 + 2x − 2x² with x = 0.01 gives 1.0198 (calculator 1.019804…).

## 2. One bracket below · Power of a fraction

A fraction with one bracket below is a product: (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹. Expand each bracket (the numerator is a polynomial, the denominator a binomial series), multiply, then multiply by any constants taken out. The range is the smaller of the brackets' ranges; a positive whole-number power of the numerator puts no limit on x.
- **One bracket below** — Level 1: (px + q)/(1 + kx). Level 2: (px + q)/(r + sx), r taken out. Level 3: the denominator bracket squared or cubed.
- **Power of a fraction** — ((px + q)/(r + sx))ᵉ. Level 1: e = 2, denominator 1 + kx. Level 2: e = 2 or 3, any constants. Level 3: √ (e = ½) or ∛ (e = ⅓), constants chosen so aⁿ is rational and the two ranges differ.
- Options: Ask for, Expand up to; Denominator power (Level 3, one bracket below); Fraction raised to; Written as (Level 3, power tab).

Working: take out the constants / write as a product · expand each bracket · multiply (up to xᵐ) · multiply by the constants · range (one or two intervals, then the smaller).

## 3. With partial fractions

The denominator has two or more different brackets, so: (improper: divide first) · partial fractions · constants by substitution of each root · the one constant a repeated root cannot reach by **letting x = 0** (an equation A + B + C = …, then the two constants already found; another x if a root is 0) · each fraction as constant × (1 + kx)ⁿ and expanded · add like terms · range for each, then the smaller (number line).
- **Level 1:** (1 + ax)(1 + bx), linear or constant numerator, up to x². **Level 2:** factors with a constant other than 1, up to x³. **Level 3:** a repeated factor, or divide first.
- The two ranges always differ, so taking the smaller is a real decision. Constants are whole numbers.
- Samples: (5 − x)/((1 + x)(1 − 2x)) = 2/(1 + x) + 3/(1 − 2x) → 5 + 4x + 14x² + 22x³, |x| < ½ · (5 + x)/((2 − x)(1 + 3x)) = 1/(2 − x) + 2/(1 + 3x) → 5/2 − (23/4)x + (145/8)x² − (863/16)x³, |x| < ⅓.

## 4. Acceptance

`src/tests/binomialExpansion.test.ts`, `binomialFractions.test.ts`, `binomialPartialFractions.test.ts` (all drive the one tool): the sample answers above; every generated question matches an independent series (series division for partial fractions; the true function numerically for fractions); the stated range is the smaller bound; Level 2 never repeats a Level 1 question; the repeated-root working uses x = 0; every KaTeX string renders.
