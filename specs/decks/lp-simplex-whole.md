# Why rounding fails: whole numbers and the simplex answer (lesson deck)

**Status:** implemented (10 slides; built and pushed to the shared service; unpublished)
**Deck:** `lp-simplex-whole` · **Strand:** Decision Mathematics · **Tool:** The Simplex Algorithm › Is it practical? (`/lp-simplex`, behind Developing tools) · **Roadmap:** stage 5 (`docs/roadmaps/linear-programming.md`)

## What it is for

Stage 5 is where the answer stops being a number to quote and becomes a plan to check. The tool practises the steps; this deck gives the *reasons*, with the graph beside the working, as the earlier two decks do. It follows the tool's own method so the class meets the same words: the optimum is not practical, it gives an upper bound, test the whole-number points either side of it, take the best.

Four ideas, in this order:

1. **The simplex answer can be a plan we cannot make.** The corner has fractions in it.
2. **Rounding to the nearest is not safe.** It can land outside the region, so every candidate must be tested.
3. **The optimum is an upper bound.** A whole-number plan is also a plan for the linear programme, so it cannot beat the optimum; with whole-number coefficients its value is a whole number, so at most the whole number just below.
4. **The best practical plan is found by testing the whole-number points around the optimum**, and if one reaches the bound, no practical plan can do better. Rounding every value down is always practical but not necessarily best.

## The worked problem (numbers from the engine and brute force, asserted in the build script)

A stall makes tables (x) and chairs (y). **Maximise P = 3x + 4y subject to x + y ≤ 6 and x + 3y ≤ 11.** The simplex gives x = 7/2, y = 5/2, P = 41/2. It was found by searching small problems for one where every move shows up:

- **Round to the nearest:** (4, 3), which breaks both limits (7 > 6 and 13 > 11).
- **Round down:** (3, 2), practical, P = 17, but not the best.
- **The four points around the optimum:** (3, 2) P = 17, (4, 2) P = 20 are practical; (3, 3) breaks the second limit only (12 > 11); (4, 3) breaks both.
- **The bound:** P = 41/2, so a whole-number plan has P at most 20.
- **The best plan:** (4, 2), P = 20. It reaches the bound, so no practical plan can do better, and it is the only whole-number point with P = 20 (brute force over every whole-number point of the region).

The graph has the region shaded, its whole-number points as dots, the four points around the optimum coloured (green practical, red not), and the profit line P = 41/2 slid down to P = 20, where it meets (4, 2).

## Decisions (Harry asked for the deck, 2026-11-26; the open questions were settled on my recommendations)

Keep the stall problem; keep the sliver picture; **no three-variable slide** (clarity over length, and the tool covers that method with its "room left" table).

## Slides (10)

| # | Slide | What it does |
|---|---|---|
| 1 to 2 | Title, learning objective | Explain why the simplex answer may not be a plan, and find the best whole-number one |
| 3 | The simplex answer | The problem and the graph; the optimum (7/2, 5/2), P = 41/2; "we cannot make 3½ tables" |
| 4 | Can we just round? | 7/2 → 4 and 5/2 → 3 gives (4, 3); both limits fail (7 > 6, 13 > 11); the graph shows it outside the region |
| 5 | An upper bound | A whole-number plan is also a plan for the programme, so P ≤ 41/2 (the orange profit line); its P is whole, so P ≤ 20 |
| 6 | The whole-number points | The dots inside the region; the four around the optimum, green inside and red outside |
| 7 | Test the four points | A table of the two checks and P for each; (3, 3) fails the second limit only |
| 8 | The best practical plan | (4, 2) reaches the bound; the orange sliver (P > 20) holds no whole-number point; rounding down gives (3, 2), P = 17, practical but not best |
| 9 to 10 | Finding the best whole-number plan; Watch out | The method in order; four common slips |

## Checks and conventions

- Every number on a slide is computed by the engine or by brute force over the region's whole-number points, and asserted in the build script.
- Layout checked with `npm run deck -- check lp-simplex-whole --layout`, and every slide looked at with `review`.
- Fractions, not decimals or mixed numbers, in working (decided 2026-11-21); "3½ tables" appears only in words where the class reads it aloud.
- Same colours as the other two decks: blue and purple for the limits, orange for the optimum and the profit line, green for what is allowed, red for what is not.

## Not in the deck

- **Practice sets.** The Simplex tool is not live, so generator slides would not work for the class; practice is in the tool, through the roadmap (stage 5), at three levels. No authored question sets, so the ladder-and-traps checkpoint does not apply.
- **A best plan that does not reach the bound.** The tool's problems are designed so a point does reach it; a problem where none does (search further out) is not taught here.
- **Branch and bound and other integer methods.** Beyond the specification.
