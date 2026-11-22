Strand: Maths

## 2026-11-21 — Linear Programming: the maths core (chunk F0), library only

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lp.ts`, `src/tests/lp.test.ts`, `docs/pathways/linear-programming.md` (no tool, no registry entry, no UI: nothing teachers see).

- **`lp.ts` is built.** Exact fractions (the `Fr` of `dim.ts`); the `Var`, `Constraint` (coeffs, op of ≤ ≥ = < >, rhs, source, kind, `holds`) and `Model` types from brief section 9; the tidy rule (whole-number coefficients, lowest terms, leading coefficient positive with the operator flipped on a negation, strict operators kept strict); the relationship rule (`relationship`, `percentOf`, `ratioOf`: clear the fraction, move to the left, combine like terms, B may be the total); the blend rule (`blend`); the either-or rule (`eitherOr`: x/a + y/b ≤ T becomes (b/g)x + (a/g)y ≤ Tab/g, any number of products); `linear` for resource uses, bounds, totals and decimal amounts; `intercept`, `tidyHolds`, `feasible`, `objective`.
- **`holds` is independent.** Each constructor writes the meaning from the sentence's own numbers (sum of A against m times the sum of B; the actual share of the actual mix; the capacity share x/a + y/b), never from the tidy coefficients.
- **Tests** (`src/tests/lp.test.ts`, seeded): every worked example of brief 2 and 4.6, the blend examples and the decimal-amount examples; thousands of random draws in 2, 3 and 4 variables check integer coefficients, gcd 1, positive leading coefficient, and that `holds` agrees with the tidy inequality at every lattice point (0 to 30, 0 to 12, 0 to 8), counting boundary points (false for strict operators there).
- **A rule worth knowing:** the tidy form divides by the common factor of the coefficients *and* the right-hand side, so `80x ≤ 500` becomes `4x ≤ 25`, and `2x + 4y ≤ 5` stays as it is (coefficient gcd 2). The generators build whole-number right-hand sides by construction, so their constraints always have coefficient gcd 1.
- **Deliberately not done:** `lpGen.ts`, the stepper, the `constraint` sub-tool (F1 onward), any registry entry.

Agent: Claude Code
Notes: Build Log block "Linear Programming: maths core F0 (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
