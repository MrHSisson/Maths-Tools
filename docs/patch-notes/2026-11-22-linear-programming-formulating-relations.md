Strand: Maths

## 2026-11-22 — Formulating: relations stay as relations; ratios are written as ratios, not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lp.ts`, `lpGen.ts`, `lpGenL23.ts`, `lpSolve.ts`, the Formulating tests, `src/tools/Decision/FormulatingLP.tsx`. Harry's two notes while previewing.

- **Relations are not forced to "≤ a constant".** A constraint that says how the letters compare (a ratio, a percentage or a share of the others, a multiple: "x is at least twice y", "the ratio of x to y is at least 2 : 3") now ends in whole numbers and lowest terms with the letters on both sides: **3x ≥ 2y**, **3x ≤ y + z**, **5x = 6y**. The working no longer takes everything to the left and multiplies by −1 to put the first letter positive: it translates, multiplies out any bracket, combines a letter that is on both sides, clears the decimals or fractions, divides by a common factor, and stops. A note says the line is just as correct as one with 0 on the right (the rearranged form would only be needed to feed a simplex tableau). The "check with a number" and the common slip show both sides of the relation. A constraint with a constant on the right (a resource limit, a bound, a difference) is unchanged, and so are blends.
- **Ratios are written as ratios.** The "one for every" wording is gone. A ratio constraint is **"The ratio of the number of A to the number of B must be at least 2 : 3"**, and A can be two kinds combined ("the ratio of the number of A and B combined to the number of C must be at least 1 : 2", working: the two added together, divided by C, then 2(x + y) ≥ z). Shares of the total ("one third of the total") stay in words: they are a fraction, not a ratio. The style's option button now reads "x : y at least 2 : 3".
- **Tests:** the worked examples were rewritten to the new lines (3x ≥ 2y; 3x ≥ 2y + 2z by collecting and clearing 0.6x ≥ 0.4y + 0.4z; 2(x + y) ≥ z), and every random draw still agrees with its meaning, renders as KaTeX and ends on the constraint it shows.
- **Not changed:** the Simplex tool keeps its own tidy form (a ≤ constraint with a slack); a constraint in the Formulating model is a relation or a ≤ constant as it is said.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Formulating relations and ratios (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
