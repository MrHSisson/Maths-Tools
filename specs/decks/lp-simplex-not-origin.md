# When the origin is not allowed: the simplex from a ≥ limit or a minimise (lesson deck)

**Status:** plan, for Harry's review (the look card is built; nothing else is)
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

## Slides (about 17)

| # | Slide | What it does |
|---|---|---|
| 1 to 2 | Title, learning objective | Explain why the simplex needs a changed start, and make it |
| 3 | Where the simplex starts | Recap on the earlier problem: the origin is the first corner, and it is allowed |
| 4 | Add a limit | "At least 3 in total", x + y ≥ 3: the region changes |
| 5 | **Is the origin allowed?** (look card) | The shaded region, the test 0 + 0 ≥ 3 → false, the origin outside |
| 6 | Writing a ≥ limit | Multiply by −1 to make it ≤; add the slack: −x − y + s₃ = −3 |
| 7 | **The table says the same** (look card) | The starting table, the −3 in red: s₃ = −3 is impossible |
| 8 | Which entry? | The pivot must be a negative entry in that row; both x and y work here, either keeps every right-hand side positive |
| 9 | **Moving onto the region** (look card) | The row operations and the new table: x = 3, P = 6, the jump on the graph |
| 10 | Then carry on | The ordinary steps from the earlier deck, in one slide with the graph walk (3, 0) → (5, 0) → (4, 2) |
| 11 | Why it works | A negative slack is a limit broken; the pivot makes it a boundary line |
| 12 | Minimising | The sliding line on the strip; the smallest C is the largest P = −C |
| 13 | **Minimising: two signals** (look card) | Bottom row says stop, right-hand side says not allowed; read the right-hand side first |
| 14 | The answer, with the sign | P = −8, so C = 8: the sign slip is the trap |
| 15 | Two more starts | A lower bound (the origin moves) and an equality (a line) |
| 16 to 17 | The rules; Watch out | The checks, in order; common slips |

## Checks and conventions

- Every number on a slide is computed by the engine and asserted in the build script (the pivots, the corners, the minimum). The row operations are written from the engine's own operations.
- Layout checked with `npm run deck -- check lp-simplex-not-origin --layout`, and every slide looked at with `review`.
- The shaded region is a small drawn picture (an SVG image of the polygon, in graph units), so it cannot disagree with the lines drawn over it.
- The same colours throughout: blue for the first limit, purple for the second, orange for the new ≥ limit, green for the walk, red for what is not allowed.

## Not in the deck

- **Practice sets.** The Simplex tool is not live, so generator slides would not work for the class; practice is in the tool, through the roadmap (stage 6). No authored question sets, so the ladder-and-traps checkpoint does not apply.
- **Unbounded and infeasible problems.** Left out of the tools by Harry's decision; this deck does not teach them either.
- **Exam-style chains.** Not built anywhere yet.

## Questions for Harry

1. **Is the earlier problem the right one to reuse?** It gives continuity (same region, same optimum 14) but means the new limit is never the binding one. A different problem would make the ≥ limit matter at the optimum.
2. **Which entry to pivot on?** In problem A both the x and y entries in the ≥ row work. The deck shows both and takes x. Should it say "either" or fix one rule (for example "the most negative entry in the row", with a tie broken left to right)?
3. **Should the lower bound and equality get a slide each, or a fuller treatment?** They are one slide each in this plan.
