Strand: Maths

## 2026-11-26 — Stage 5 lesson deck: Why rounding fails

Branch `claude/beautiful-noether-aczmnn` (restarted from the latest `main` after PR #158 merged). Area: `specs/decks/lp-simplex-whole.{md,build.ts}`, `src/decks/data/lp-simplex-whole.json`, `src/tools/Decision/SimplexRoadmap.tsx`, `docs/roadmaps/linear-programming.md`, `docs/pathways/linear-programming.md`.

- **New deck `lp-simplex-whole`** (10 slides): a stall makes tables and chairs, maximise P = 3x + 4y subject to x + y ≤ 6 and x + 3y ≤ 11. The simplex gives (7/2, 5/2), P = 41/2. Why rounding to the nearest is not safe ((4, 3) breaks both limits), the optimum as an upper bound (P ≤ 20), the whole-number points around it, a table testing the four, and the best plan (4, 2) with P = 20, which reaches the bound; an orange sliver on the graph shows that nothing with P above 20 is a whole-number point. The problem was found by searching small problems for one where every move shows up; every number is computed by the engine or by brute force over the region's whole-number points and asserted in the build script.
- **Left out on purpose:** a three-variable slide (the tool covers that method; clarity over length) and any practice set (the Simplex tool is not live, so practice is in the tool through the roadmap).
- **Roadmap:** the page's stage 5 now links to the deck instead of showing a planned placeholder.
- **Checked:** the deck's content and layout checks and the deck tests (no off-canvas element, no spill or overlap), every slide looked at in the render. Pushed to the shared service, unpublished.
- **Deliberately not done:** publishing the deck; a real-printer and tablet check of the Simplex print (still open from the last merge).

Agent: Claude Code
Notes: no planner Build Log block yet for this session (to add).
