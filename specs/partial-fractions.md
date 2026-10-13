# Tool Spec: Partial Fractions

**Status:** implemented <!-- built ad hoc from the teacher's description; dev-gated (enabled: false) until reviewed -->

**Route:** `/partial-fractions` · **Category:** Pure Mathematics (A-Level) · **File:** `src/tools/Algebra/PartialFractions.tsx`

## What it teaches
Expressing p(x)/q(x) as a sum of fractions with linear denominators (Year 13), then, at the top end, dividing first when the numerator is too big.

## Sub-tools (tabs) and levels
| Tab | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Two fractions** | (x+a)(x+b); one factor is x | (px+q)(x+a); (px+q)(rx+s) | repeated (x+a)² or (px+q)² → A/(x+a) + B/(x+a)² |
| **Three fractions** | three monic factors; one is x | one factor (px+q) | (x+a)(x+b)² ; (px+q)(x+a)² |
| **Divide first** | quadratic ÷ quadratic (Q a number) | cubic ÷ quadratic (Q linear), denominator shown expanded | cubic denominator: Q a number or linear; repeated factor, Q linear |

## Question Options
- **Denominator** pool (one form per question, weighted for the Smart Progressor).
- **Denominator shown as**: Factorised / Expanded (the working factorises first). Expanded is on by default on Divide first, Levels 2–3.
- Worked Example dropdown **Working**: Full working / Constants only.

## Construction (always exact)
Integer constants A, B, C are chosen first and the numerator is assembled from them (N = Σ A·(denominator ÷ factor^k)); for Divide first N = Q·D + R. So every answer is integer and the working re-derives it.

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
