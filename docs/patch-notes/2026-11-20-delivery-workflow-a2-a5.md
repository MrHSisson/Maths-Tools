Strand: Maths

## 2026-11-20 — Delivery workflow, steps A2 to A5: faster Decision tests and CI

Branch `claude/great-heisenberg-5a3nko`. Area: `src/shared/decision/cpa.ts`, `src/tests/` (flow layout split, levelling sample), `.github/workflows/ci.yml`, `scripts/selectTests.mjs`.

- **Critical Path questions are built to be valid instead of rejected.** Level 3 networks now come out of the generator already tidy, with an arrow that skips a column, a near-critical activity and one critical path, so a question takes about 30 ms instead of about 480 ms (Shorten 5.3 s to 0.4 s). Every rule a network must pass is unchanged; Level 3 networks are slightly tidier (fewer crossings). Levels 1 and 2 are unchanged. The layout search is also about 4× faster with identical results.
- **Tests:** the Network Flows layout checks are split over four files (same 19 checks), and one multiplied sample in the levelling tests is smaller (30 to 12 seeded runs). The full suite is 157 files in about 4 minutes locally (it was about 6 to 7).
- **CI:** tests run across four runners, the browser smoke check runs only when it can be affected, a push to `main` is compared with the commit before it, and a newer push to a pull request cancels the older run. Not yet seen running on GitHub.
- Not done: Level 3 resource levelling questions are still slow (about 0.8 s each); fixing it means redesigning how they are built.

Agent: Claude Code
Notes: Build Log block not yet written.
