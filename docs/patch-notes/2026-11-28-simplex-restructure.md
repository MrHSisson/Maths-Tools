Strand: Maths

## 2026-11-28 — Simplex restructure: Non-standard problems, One pivot folded into Solve, harder Level 3 wording

Branch `claude/sleepy-keller-ntgciq`. Area: `src/tools/Decision/SimplexAlgorithm.tsx`, `src/tools/Decision/SimplexRoadmap.tsx`, `src/shared/decision/lpSimplexGen.ts`, `lpSimplexSolve.ts`, `src/tests/lp*`, `docs/roadmaps/linear-programming.md`, `docs/pathways/linear-programming.md`.

- **New sub-tool Non-standard problems.** Each level is its own change of form: Level 1 a lower bound, Level 2 a minimise or a ≥ constraint, Level 3 an equality. Options: Work Through (To The Optimum, First Pivot, Set Up Only), Starting Form (Level 2), Method (Substitute And Split, or Use As Rows) and Wording (inequalities, or a situation: "at least 2 soups", "at least 40 minutes must be used", "exactly 13 metres"). A minimise is always given as inequalities (a mixed-sign cost has no natural situation). A two-variable minimise always finishes in one pivot, so minimise starts at Level 2.
- **Set up and Solve no longer change form.** Level 3 is now a situation with harder limits: a percentage of a whole ("each flyer needs 20% of the printing time", 100% available) or an either-or limit ("enough for 6 posters or 3 leaflets"). New option Limit Types (both on by default); at least one limit in a question is one of them. The working shows the fractions and the clearing, and slack variables are read in the limit's own terms. A table of the data stays Level 2.
- **One pivot is no longer a sub-tool.** Solve has Work Through (To The Optimum, One Iteration), Start From (The Initial Tableau, A Later Tableau; two ticks) and Pivot (Student Chooses, Pivot Given). Non-standard problems has Work Through: First Pivot (the old Level 3 negative right-hand side).
- **Read a tableau has two levels:** Level 1 reads any tableau, Level 2 writes the problem the tableau shows. New options Size (2 × 2, 3 × 3, 4 × 4) and Which Tableau (The Optimal Tableau, One Not Yet Optimal; two ticks). Level 2 of the old tool could never be optimal; now it can.
- **Is it practical?** keeps its three levels (round down is best; it is not; rounding to the nearest breaks a constraint). Wording is now its own option at every level.
- **Generator fixes:** no limit is smaller than one of its own coefficients (10x + 50y ≤ 40 is gone); an optimum with a single non-zero variable is the exception (about 1 in 8) not the rule; a Level 2 data table no longer has a double rule under its first row; Read a tableau questions now state the whole situation (and show its table).
- **Degenerate cases are treated as normal.** They are no longer built on purpose or rejected (about 4% of Level 2 and 10% of Level 3 Solve questions are degenerate naturally); the working still explains a tie and a θ of 0. A Degenerate Cases option was built and then removed for this reason.
- **Formulating LP:** the unused Capacity Method option (its Common Units choice was never built) is removed.
- **Checked:** `npm run build` and the whole test suite pass; main merged in (no conflicts). The roadmap page and `docs/roadmaps/linear-programming.md` follow the new sub-tools and options.
- **Deliberately not done:** ratios and a percentage of a total in the simplex situations (a zero right-hand side gives a degenerate start); mixed changes of form in one question (the generator draws one); looking at the tools in the browser or the print on a real printer.

Agent: Claude Code
Notes: no planner Build Log block yet for this session (to add).
