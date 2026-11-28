Strand: Maths

## 2026-11-28 — Graphical linear programming (DD2): the brief and chunk G0 (the maths)

Branch `ccr-bf77c579-nv8nom`. Area: `specs/linear-programming-graphical.md`, `docs/pathways/linear-programming.md`. Plus `src/shared/decision/lpGraph.ts` and `src/tests/lpGraph.test.ts`.

- **New brief `specs/linear-programming-graphical.md`, status `ready`**, written after Harry's answers. Three skill sub-tools: Draw the region, Solve a problem, Integer solutions. The sliding line (default) and the vertex table are a display switch on the same question, not a regeneration. Starting From (A Situation, Inequalities, Diagram Given) covers form-draw-solve, draw-solve and just solve. Shade out by default with R in an enclosed region; Shade In is a tick.
- **Scope:** two variables, at most four constraints (five with a bound such as x ≥ 3), at most three of the form ax ± by, whole-number coefficients, no simplex. Levels are kinds of region and line (origin side; bounds, vertical or horizontal lines and a negative coefficient; a region away from the origin, a line through the origin, a minimise). The integer best point is one of the four around the optimum; Level 2 is the case where it is not the nearest.
- **Picture:** a new SVG region picture with its R27 reason, `data-q-index` and no fixed height (R31). Build chunks G0 (shared maths and test) to G6 (go live) are in the brief.
- **G0 built:** `lpGraph.ts`, the exact maths for the Graphical tool (ordered vertices, enclosed or open region, shade-out test point, intercepts, objective line, vertex table, whole points, the four points around an optimum, the constraint-count rule), reusing `vertices`, `bestVertices` and `opHolds`. Its test checks the ferry problem by hand and 150 seeded random regions against the grapher's own clipped polygon, `optimiseLinear`, a fine-grid scan and a brute-force whole-point search. No picture or tool yet.
- **Deliberately not done:** the picture (G1) and the tool (G2 onward); range, redundant constraints, a From Formulating start and the exam-style chain stay later.
- **Still outstanding from the last session:** the simplex tools have not been looked at in the browser on phone, tablet and laptop, nor printed on a real printer; the dashboard notes for those tools and a planner Build Log block were not written.

Agent: Claude Code
Notes: no planner Build Log block yet for this session (to add).
