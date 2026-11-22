Strand: Maths

## 2026-11-22 — The Simplex Algorithm: "Is it practical?" (whole-number solutions), not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lpSimplexWhole.ts` (new); edits to `lpSimplexGen.ts`, `lpSimplexSolve.ts`, `src/tools/Decision/SimplexAlgorithm.tsx`, `src/tests/lpSimplex.test.ts`.

- **A fifth sub-tool, Is it practical?** The optimum of the linear programme has a fraction in it, but only whole numbers make sense. The question asks why the optimum is not practical and for the best practical plan. **Optimum** option: given, or find it first with the simplex algorithm (the whole working, then the whole-number part).
- **Whole Numbers option on Solve a problem and Read a tableau:** the same question is added to a solve or to a tableau, so the whole-number part can follow any run.
- **The working:** why the optimum is not practical; the upper bound (a practical plan is a plan of the linear programme, and with whole coefficients its value is a whole number, so at most the whole number below the optimum); a table of the whole-number points either side of the optimum (each fractional variable rounded down and up) with every constraint ticked or crossed and P; the best practical point, which reaches the bound, so nothing can be better. Notes: rounding to the nearest can break a constraint; rounding down is practical but not always best. A situation in words gives the plan in its own words ("make 24 shelves and 5 chairs, for a profit of £131").
- **Designed numbers:** the problem is built so that a vertex with fractions in it is the best point (a positive whole dual-style design with whole objective coefficients, so the optimal value is usually a fraction too), then kept only if a feasible whole-number point reaches the bound. Level 1: two variables, any practical neighbour. Level 2: the best plan is not just everything rounded down. Level 3: also rounding to the nearest breaks a constraint, up to four variables. Standard form only.
- **Tests:** the best practical plan equals the true best whole-number plan found by trying every point (two and three variables), reaches the bound, and the working renders in both layouts.
- **Deliberately not done:** problems where no practical point reaches the bound (the best plan then needs a longer check); an unbounded or infeasible problem; practical for the non-standard forms (minimise, ≥, lower bound).
- **Ties and degenerate cases (Harry's call):** allowed naturally from Level 2. One problem in three is built degenerate. The working names the tied columns or rows (either choice reaches the optimum) and explains a θ of 0. Level 1 stays tie-free. The Pivot Column option is dropped.
- **Whole Numbers mixed:** on Solve and Read a tableau the optimum may be whole (the answer is "practical") or not; the Is it practical? sub-tool always has a fraction.
- **Engine:** a tableau records its basis, so a degenerate tableau is read correctly; a tableau given to be read must show one unit column per constraint.

- **Room left (three or more fractional variables):** the working rounds down, finds the room left in each constraint, and lists the sets of variables whose coefficients give exactly the rise needed to reach the bound, each checked against the room; the full table stays for one or two fractional variables.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Simplex, is it practical (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
