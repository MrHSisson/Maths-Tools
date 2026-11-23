# The simplex algorithm: what is the table doing? (lesson deck)

**Status:** implemented
**Deck:** `lp-simplex-process` · **Strand:** Decision Mathematics · **Tool:** The Simplex Algorithm (`/lp-simplex`, behind Developing tools)

## Agreed approach

An explanation deck, built the evening before a lesson, from Harry's own account of the method ("start at the origin, push a variable as far as it goes, rewrite the other equations, look for more room, staircase") and the follow-up question "what tells us the trade-off when moving x down a little gives more overall?". One worked problem is followed from start to finish, with a graph beside the table so the class sees the table walk from corner to corner.

**The problem:** maximise P = 2x + 3y subject to 2x + y ≤ 10 and x + 2y ≤ 8. It was chosen because the second pivot makes y come back down (from 4 to 2) while x goes up, which is the trade-off. Corners: (0, 0) 0, (0, 4) 12, (4, 2) 14, (5, 0) 10. The walk is (0, 0) → (0, 4) → (4, 2).

## Slides (18)

| # | Slide | What it does |
|---|---|---|
| 1 to 2 | Title, learning objective | Explain what each step is doing, and why |
| 3 | The problem | The problem and the graph; corners, then their values of P, on clicks |
| 4 | The big idea | Start at the origin; walk to a better corner; stop when no edge goes uphill |
| 5 | Slack variables | The equations; what a slack variable is; the start (s₁ = 10, s₂ = 8, P = 0) |
| 6 | The starting table | The table (no basic-variable column: a variable's value is read from its column of a single 1); how to read it |
| 7 | Which way? | The bottom row: −2 and −3 are how fast P grows; the most negative gives y |
| 8 | How far? | The ratios 10 ÷ 1 and 8 ÷ 2; the smallest is 4; the arrow up the y axis |
| 9 | Why only positive entries? | Row 2 as s₂ = 8 − 2y runs out at y = 4; a negative entry (s = 8 + 2y) never runs out, and 8 ÷ (−2) = −4 would be a limit behind us; a zero entry does not touch the limit |
| 10 | Moving there | The row operations (NPR = R3 ÷ 2, R1 + 3 × NPR, R2 − NPR), then the new table |
| 11 | Read the new corner | y = 4, s₂ = 0 (that limit is used up), P = 12; is there more to gain? |
| 12 | The trade-off | −½ under x: +2 directly, but y falls by ½ (−1½): net +½. The bottom row already did the sum |
| 13 | How far again? | 6 ÷ 3/2 = 4 and 4 ÷ 1/2 = 8: x goes to 4, y comes down to 2 |
| 14 | Moving again | The second set of row operations, the final table |
| 15 | When do we stop? | No negatives: P = 14 − ⅓s₁ − (4/3)s₂, so any move lowers P |
| 16 | The whole journey | A table of the steps, the graph with the whole walk; (5, 0) never visited |
| 17 to 18 | The simplex rules; Watch out | The four rules; four common slips |

## Checks

Every number on a slide is computed in the build script by the real engine (`lpSimplex.ts`) and asserted against the plan (the two pivots, the trade-off −½, the final bottom row ⅓ and 4/3, every corner's P by brute force). The row operations on slides 9 and 13 are written from the engine's own operations. The tables have no basic-variable column (Harry, 2026-11-22). Layout checked at 1600 × 900 for spills and overlaps; the graph's labels were moved where a line ran through them.

## Not in the deck

A practice set or a generator slide: the Simplex tool is not live (`enabled: false`), so a generator slide would not work for the class. The shadow-price idea (⅓ and 4/3 are the value of an extra unit of each limit) is left out: beyond AQA, and Harry can say it aloud from the final bottom row.
