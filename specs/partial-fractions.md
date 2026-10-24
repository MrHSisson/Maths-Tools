# Tool Spec: Partial Fractions

**Status:** implemented <!-- built ad hoc from the teacher's description; now live -->

**Route:** `/partial-fractions` · **Category:** Pure Mathematics (A-Level) · **File:** `src/tools/Algebra/PartialFractions.tsx`

## Scope: AQA A-level Mathematics (7357), not Further Maths
Linear factors including (a − bx) and (px + q); a repeated factor squared; at most three fractions; constant numerators; improper fractions divided first. Irreducible quadratic factors and cubed factors are Further Maths and deliberately excluded. (I could not confirm the exact specification wording online; check against the current AQA 7357 spec, section on partial fractions.)

## What it teaches
Expressing p(x)/q(x) as a sum of fractions with linear denominators (Year 13), then, at the top end, dividing first when the numerator is too big.

## Sub-tools (tabs) and levels
| Tab | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Two fractions** | (x+a)(x+b); one factor is x | (px+q)(x+a); (px+q)(rx+s) | repeated (x+a)² or (px+q)² → A/(x+a) + B/(x+a)² |
| **Three fractions** | three monic factors; one is x | one factor (px+q) | (x+a)(x+b)² ; (px+q)(x+a)² |
| **Divide first** | quadratic ÷ quadratic (Q a number) | cubic ÷ quadratic (Q linear), denominator shown expanded | cubic denominator: Q a number or linear; repeated factor, Q linear |

## Question Options
- **Denominator** pool (one form per question, weighted for the Smart Progressor), including (a − bx) factors.
- **Constants**: Whole numbers / Fractions (A = 3/2). Level 1 whole, Level 2 both, Level 3 fractions. In Fractions mode the numerator is chosen first and the constants solved exactly.
- **Denominator shown as**: Factorised / Expanded (the working factorises first). Expanded is on by default on Divide first, Levels 2–3.
- Worked Example dropdown **Working**: Full working / Constants only.

## Construction (always exact)
Whole-number constants are chosen first and the numerator assembled from them (N = Σ A·(denominator ÷ factor^k)). Fractional constants: the numerator is chosen and the constants solved exactly (substitute each root, equate the x^(n−1) coefficient for a repeated factor). Divide first: N = Q·D + R. The working re-derives every constant and throws on a mismatch.

## Working
1. (Divide first) expand the denominator, one division step per quotient term, then write Q + R/D.
2. (Expanded denominator) factorise it.
3. Write the partial-fraction form, multiply through by the denominator.
4. Let x be the root of each factor (substitute), solving for that factor's top-power constant.
5. A repeated factor's remaining constant: equate coefficients of the highest power of x.
6. Write the answer.

## Acceptance
Every generated question satisfies the identity N/D ≡ Q + Σ A/(factor)^k at several exact x values, and every constant in the working is re-derived (a mismatch throws). `src/tests/partialFractions.test.ts`.

## Not covered (possible next)
Irreducible quadratic factors, fractional constants, Depth bank, Teach deck.

- **Negative x in numerator** (variable, off by default): when off, every x coefficient of the displayed numerator is positive (its constant can still be negative); on allows negative x terms. Pools Denominator / Shown as / Constants are plain pill rows (peer choices, not easy-hard pairs).
