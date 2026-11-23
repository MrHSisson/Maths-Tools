Strand: Maths

## 2026-11-23 — One inverse trig deck, with practice and a live solving-trig flow

Branch `ccr-038baa8d-pooiut`. Area: `specs/decks/inverse-trig-*.ts`, `src/decks/{SlideCanvas,WorkedPicture}.tsx`, `src/decks/data/inverse-trig-graphs.json`.

The three decks for arcsin, arccos and arctan are now one deck, `inverse-trig-graphs` (28 slides): one title, objective, discussion and summary; then for each function the animation, the domain-and-range slide, a "finding the other solutions" slide (the alternative angle, then + 2kπ, or + kπ for tan) and a "do they undo each other?" slide (f(f⁻¹ x) = x always, f⁻¹(f x) = x only on the restricted domain). The three single-function decks were deleted (their build scripts stay, since this deck reuses them).

Practice: three whiteboard slides (exact values, function then inverse, solving inverse equations; three authored questions each, every answer recomputed in the build) and a pinned textbook sheet in the same three styles (9, 9 and 10 parts) with an answer page. Their numbers differ from Exercise 7B questions 2 to 4.

A live flow follows: eight Solving Trig Equations generator slides, all in radians (cos, sin and tan from 0 to 2π; −π to π; 0 to 4π; calculator values; rearranging first; a multiple of θ), each opening on a question chosen by seed. To make the graph show, a generator slide in the full-width layout now draws a step's `graphBuild` graph beside the working (shared deck code: `WorkedPicture` type `graph`, `SlideCanvas`). Merge that code before pushing the deck, since the live site runs main. A seed only gives the same question while the tool and its options are unchanged.

Agent: Claude Code
Notes: no Build Log block (small change).
