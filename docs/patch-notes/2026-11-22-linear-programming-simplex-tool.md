Strand: Maths

## 2026-11-22 — The Simplex Algorithm: engine, designed numbers and four sub-tools (chunks S0 to S5), not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lpSimplex.ts`, `lpSimplexGen.ts`, `lpSimplexSolve.ts`, `SxWorking.tsx` (new); `src/tools/Decision/SimplexAlgorithm.tsx` (new tool, `/lp-simplex`, `enabled: false`, linked from the Decision hub's DD card); small edits to `types.ts` (the `sx` data field and the `sxView` step), `DecisionShell.tsx` (picture height), `registry.ts`, `decisionSpec.ts` and two test lists.

- **The engine** (`lpSimplex.ts`): the textbooks' algorithm in exact fractions. Objective row first; most negative entry is the pivot column; smallest θ over the positive entries is the pivot row; divide, then clear the column; stop when no entry in the objective row is negative. Minimising by P = −C; a ≥ constraint multiplied by −1, and a negative right-hand side starts with a pivot on a negative entry of that row; a lower bound substituted out (X = x − a); an equality as a pair. Checked against a brute-force search of every vertex in every starting form.
- **Designed numbers** (`lpSimplexGen.ts`): a problem is built from a whole optimum, the constraints that bind there and a whole dual, then the real algorithm is run and the problem is kept only if every tableau on the way is inside the level's budget (denominators 1 to 4 at Level 1; 1 to 6, 8 and 10 at Level 2; 1 to 10 at Level 3; a limit on iterations, size of entry and non-whole entries; no ties).
- **Four sub-tools:** Set up the tableau (also Tableau To Problem), One pivot (including the negative-right-hand-side start), Solve a problem (every iteration, then every variable and P, then the answer in the question's own terms), Read a tableau (optimal or not, the values, binding constraints and slack meanings).
- **Levels:** 1 two variables, standard form; 2 up to three variables and a situation in words (the data is scaled, then simplified); 3 up to four variables and four constraints, and a change of form first (minimise, ≥, lower bound, equality).
- **The working** is the page a student writes: the tableau as a table with the pivot column, row and cell highlighted, the θ-values beside it, and the row operations beside the new tableau. **Tableau Layout** option (display only): Cambridge style (NPR = R3 ÷ 2) or Oxford style (a Basic variable column and numbered rows, R5 = R1 + 8 × R6). Slack variables are s₁, s₂ … and every number is a fraction.
- **Options:** Variables, Constraints, Direction, Wording, Starting Form, Tableau Layout.
- **Tests** (`src/tests/lpSimplex.test.ts`): engine against brute force at all three levels; every tableau within budget with no ties for every level and sub-tool; Level 1 limits; a situation reads naturally; 30 different questions; every step of every kind in both layouts renders as KaTeX; the ending states the engine's optimum. The seeded-replay and worksheet-fill tests pick the tool up automatically.
- **Checked** in headless Chromium at laptop and phone width: no console errors; the tableau renders and steps.
- **Deliberately not done:** "is it practical?" (needs a designed fractional optimum), the zero-θ hazard, a Pivot Column option, unbounded and infeasible problems, exam-style chains and parametric tableaux, DF6 games; a tablet check, a real printer check, the brief's go-live items and the dashboard notes.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Simplex engine and four sub-tools (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
