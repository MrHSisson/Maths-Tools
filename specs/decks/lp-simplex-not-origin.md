# When the origin is not allowed: the simplex from a ≥ limit or a minimise (lesson deck)

**Status:** implemented (18 slides; built and pushed to the shared service 2026-11-22; unpublished)
**Deck:** `lp-simplex-not-origin` · **Strand:** Decision Mathematics · **Tool:** The Simplex Algorithm (`/lp-simplex`, behind Developing tools) · **Roadmap:** stage 6 (`docs/roadmaps/linear-programming.md`)

## What it is for

Stage 6 of the roadmap is where the algorithm stops starting at the origin: a minimise, a ≥ constraint, a lower bound or an equality each needs a change before the first pivot. The tool practises the changes; this deck gives the *reasons*, with the graph beside the table, the same way `lp-simplex-process` does for the main algorithm. It follows that deck: same look, and it reuses its problem, so the class meets the same region with one new limit.

Three ideas, in this order:

1. **The origin is a corner the simplex starts at, and a ≥ limit can cut it off.** The table says so with a negative right-hand side.
2. **The first pivot's only job is to get onto the region.** It goes in the row with the negative right-hand side, on a negative entry, and after it every right-hand side is positive, so the usual algorithm takes over.
3. **Minimising is maximising −C**, and a minimise often comes with a ≥ limit, so the two signals (the bottom row, and the right-hand side) can disagree at the start. The right-hand side is read first.

A lower bound and an equality are the same idea seen differently (move the origin; collapse the region to a line), so each gets one short slide.

## The worked problems (numbers from the engine, asserted in the build script)

**A.** Maximise P = 2x + 3y subject to 2x + y ≤ 10, x + 2y ≤ 8 (the earlier deck's problem) **and x + y ≥ 3**. The origin fails (0 + 0 ≥ 3). Region corners: (3, 0) P = 6, (5, 0) P = 10, (4, 2) P = 14, (0, 4) P = 12, (0, 3) P = 9. The engine's run: pivot on the −1 in the ≥ row, x column, giving x = 3, P = 6 (all right-hand sides positive); then two ordinary pivots through (5, 0) to the optimum (4, 2), P = 14. The same optimum as the earlier deck: the new limit was never the binding one.

**B.** Minimise C = 3x + 2y subject to x + y ≥ 4 and x + y ≤ 6 (a strip), written as maximise P = −C. At the start the bottom row has no negatives (it says stop) but the right-hand side has −4 (it says not allowed). Two pivots: (4, 0) with C = 12, then (0, 4) with P = −8, so **the minimum of C is 8**.

**C (one slide).** The lower bound y ≥ 1 on the earlier problem: Y = y − 1 moves the origin to (0, 1), which is allowed, and the problem is back in standard form with the same optimum (4, 2), P = 14 (P = 2x + 3Y + 3).

**D (one slide).** An equality, x + y = 5 on the earlier problem: written as ≤ and ≥ (or used as a row), the region collapses to a line from (2, 3) to (5, 0), and P = 13 at (2, 3).

## Decisions (Harry, 2026-11-22)

Reuse the earlier problem; either entry works for the first pivot (the deck says so, and that if a right-hand side would go negative the other entry is tried); one slide each for a lower bound and an equality; clarity over length.

## Slides (18)

| # | Slide | What it does |
|---|---|---|
| 1 to 2 | Title, learning objective | Explain why the simplex needs a changed start, and make the change |
| 3 | Where the simplex starts | The earlier problem; the origin is in the region, so the table can start there |
| 4 | Is the origin allowed? | A new limit, "at least 3 items in total"; the test 0 + 0 ≥ 3 is false; the origin is outside the shaded region |
| 5 | Writing a ≥ limit for the table | Multiply by −1 (the sign flips), then add the slack: −x − y + s₃ = −3 |
| 6 | The table says the same | The starting table with the −3 in red: s₃ = −3 is impossible, so the start is not allowed |
| 7 | Which entry do we pivot on? | A negative entry in the negative row: x gives (3, 0), y gives (0, 3), both positive; either works, we take x |
| 8 | Moving onto the region | The row operations (from the engine) and the new table: x = 3, P = 6, the jump on the graph |
| 9 | What did the pivot do? | s₃ is out of the table, so x + y = 3 exactly: we are on the limit's line |
| 10 | Then carry on as before | The walk (3, 0) → (5, 0) → (4, 2) with P = 6, 10, 14; the same optimum as before |
| 11 | Minimising | The strip; each corner's C, then P = −C; the smallest C is the largest P |
| 12 | Minimising: two signals | The bottom row says stop, the right-hand side (−4) says not allowed: the right-hand side comes first |
| 13 | The answer, with its sign | Two pivots, P = −8, so C = −P = 8 |
| 14 | A lower bound moves the origin | y ≥ 1, Y = y − 1: the origin moves to (0, 1) and is allowed; the same optimum |
| 15 | The new graph starts at 0 | The same problem redrawn with Y measured up from the line y = 1: the line is the new x axis (Y = 0, y = 1), the origin is (0, 0), the optimum (4, 1) is (4, 2) in x and y |
| 16 | An equality: the region is a line | x + y = 5 as two limits; the region is the line from (2, 3) to (5, 0); P = 13 at (2, 3) |
| 17 to 18 | Before you start the simplex; Watch out | The checks in order; four common slips |

## Checks and conventions

- Every number on a slide is computed by the engine and asserted in the build script (the pivots, the corners, the minimum). The row operations are written from the engine's own operations.
- Layout checked with `npm run deck -- check lp-simplex-not-origin --layout`, and every slide looked at with `review`.
- The shaded region is a small drawn picture (an SVG image of the polygon, in graph units), so it cannot disagree with the lines drawn over it.
- The same colours throughout: blue for the first limit, purple for the second, orange for the new ≥ limit, green for the walk, red for what is not allowed.

## Not in the deck

- **Practice sets.** The Simplex tool is not live, so generator slides would not work for the class; practice is in the tool, through the roadmap (stage 6). No authored question sets, so the ladder-and-traps checkpoint does not apply.
- **Unbounded and infeasible problems.** Left out of the tools by Harry's decision; this deck does not teach them either.
- **Exam-style chains.** Not built anywhere yet.
