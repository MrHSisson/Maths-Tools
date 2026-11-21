# Linear Programming (Decision Maths, chapter DD)
- **Status:** idea
- **Updated:** 2026-11-21

## Intention
Question generators for AQA 7366 / 7367 section DD: formulating a constrained optimisation problem (DD1), solving it graphically (DD2), the simplex algorithm with slack variables (DD3, A-level) and interpreting a tableau (DD4, A-level). Built like the Mechanics tools: single-skill sub-tools on `DecisionShell`, an independent re-derivation of every answer, exam-style questions as a separate later pass from real past papers. DF6 (a game as a linear programme) is planned with the game theory chapter.

## Progress
- 2026-11-21. Researched and planned, nothing built. `specs/linear-programming.md` is the draft brief (the specification, what the research found, six proposed sub-tools, equations-first generation with exact fractions, tests, build order, an intake checklist and seven decisions for Harry); `specs/corpus/linear-programming-styles.md` is the empty list of question styles to fill from the textbook chapters Harry is sending. AQA's examiner reports were read only as search fragments.
- 2026-11-21 (later). Textbook chapter 4 read in full (sections 1 to 3, all exercises and Mixed practice). `specs/corpus/linear-programming-styles.md` is filled (rows L01 to L57, with three UNHOMED styles: a parameter k in the objective, redundant constraints, a parametric tableau) and the brief has a new section 9a with what the textbook settled: formulation conventions, the shade-out versus shade-feasible rule, vertex and sliding-line methods, the integer trap, the simplex layout (objective row first, no basic-variable or θ column, ratios in the working), the pivot rule, minimising by Q = −P, ≥ constraints reaching the simplex only after rewriting as ≤, no sensitivity analysis. The brief is still `draft` until Harry answers section 10.

## Next steps
- Harry answers the decisions in section 10 of the brief (the textbook supports the recommended answers; see 9a), then the brief becomes `Status: ready`. Two points the textbook changes from the draft: the tableau has no θ or basic-variable column, and the simplex takes ≥ constraints only after rewriting them as ≤.
- Read the AQA 7367/3D examiner reports in full for the misconceptions to name in the working.
- Build in small merges: the maths core (`lp.ts`: exact rationals, vertex enumeration, lattice search, simplex) with its tests; the region picture and the graphical sub-tools; the tableau picture and the simplex sub-tools; the hub pairing and go-live.
- Fill the Decision hub's DD chapter card (its `toolIds` is empty) when the first sub-tool is built.

## Where to read more
`specs/linear-programming.md`, `specs/corpus/linear-programming-styles.md`, `specs/exam/spec/aqa-discrete.md`, `docs/architecture/DECISION_SHELL_PLAN.md`, `specs/further-mechanics-mc.md` (the model brief).
