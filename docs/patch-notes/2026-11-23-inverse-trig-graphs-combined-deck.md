Strand: Maths

## 2026-11-23 — One inverse trig deck, with practice and a live solving-trig flow

Branch `ccr-038baa8d-pooiut`. Area: `specs/decks/inverse-trig-*.ts`, `src/decks/{SlideCanvas,WorkedPicture}.tsx`, `src/decks/data/inverse-trig-graphs.json`.

The three decks for arcsin, arccos and arctan are now one deck, `inverse-trig-graphs` (21 slides): one title, objective, discussion and summary; then for each function the animation, the domain-and-range slide, a "finding the other solutions" slide (the alternative angle, then + 2kπ, or + kπ for tan) and a "do they undo each other?" slide (f(f⁻¹ x) = x always, f⁻¹(f x) = x only on the restricted domain). The three single-function decks were deleted (their build scripts stay, since this deck reuses them).

Practice: three whiteboard slides (exact values, function then inverse, solving inverse equations; three authored questions each, every answer recomputed in the build) and a pinned textbook sheet in the same three styles (9, 9 and 10 parts) with an answer page. A second pinned sheet (Questions 4 to 7, at the end) has solving in an interval (sketch a graph, then use symmetry), a counter-example (two parts), rearranging first (three parts) and a multiple of the angle (sin 2θ, cos 3θ and so on); its answers are found by scanning for roots in the build, not by the symmetry the pupils use. A textbook sheet can now start its numbering above 1 (`firstQuestion`) and a question can have fewer than five parts (`few`). The practice whiteboards now start their working from a sketch of the restricted graph and use its symmetry. Their numbers differ from Exercise 7B questions 2 to 4.

The live solving slides were taken out again (the lesson uses the Solving Trig Equations tool itself). A generator slide in the full-width layout still draws a step's `graphBuild` graph beside the working (shared deck code: `WorkedPicture` type `graph`, `SlideCanvas`), keeps an equation and its range on one line (`FitLine`), and no longer prints the answer twice (a closing "Answer:" step that repeats the answer box is dropped, and the graph kept). A seed only gives the same question while the tool and its options are unchanged.

Agent: Claude Code
Notes: no Build Log block (small change).
