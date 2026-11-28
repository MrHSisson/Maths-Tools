# Graphical Linear Programming (DD2) — brief

**Status:** `ready` (Harry answered the design questions on 2026-11-28; section 11 lists what he decided and what was settled by default). Nothing is built. The second tool of the Linear Programming family (`specs/linear-programming-tools.md`, "Tool 2"); the first (Formulating, `specs/linear-programming-formulate.md`) and the third (Simplex) are built behind `enabled: false`.

**What this is.** A tool `lp-graphical` on `DecisionShell` (own data field, written working, no network), under the Decision hub's DD card, with **three sub-tools, each a skill**:

1. **Draw the region** (`region`): from the constraints, draw each line (continuous for a non-strict boundary, dotted for a strict one), shade out the unwanted side, label the feasible region **R** when it is enclosed, and find the exact vertices.
2. **Solve a problem** (`solve`): optimise a two-variable objective over the region, to maximise or minimise. The method is **sliding objective line (default) or vertex table, switched on the same question without regenerating it** (section 5).
3. **Integer solutions** (`integer`): the optimum is not whole, the items are, so find the best whole-number point.

Later (not in this brief's build): `range` (the values of k for which the optimal vertex changes: corpus L30), `redundant` (corpus L32), a "From Formulating" start, and the exam-style chain (L33). Corpus rows covered here: L10, L13 (the real-profit remark), L20 to L22, L23 to L29, L31.

Sources: textbook chapter 4 sections 1 and 2, Exercises 4A and 4B (corpus rows above; the textbook is copyright and in Harry's private Drive, see `specs/sources.md`), the AQA specification DD2, `specs/linear-programming.md` section 9a.

---

## 1. Scope rules (Harry, 2026-11-28)

- **Two variables only. No simplex** (the simplex is its own tool).
- **At most four constraints, plus the axes** (x ≥ 0, y ≥ 0). **Five** only when the extra one is a bound such as x ≥ 3 or y ≥ 2. **No more than three constraints of the form ax ± by ≤ c** in any question.
- **Whole-number coefficients, always**, in constraints and objective (a graphical problem is set up with whole numbers; fractions and decimals are not coefficients here). Fractions appear only in vertex coordinates and in the working.
- A constraint drawn from two whole-number intercepts where it has them: the generator chooses the right-hand side so both intercepts of a sloped line are whole (`2x + 3y ≤ 12` meets the axes at 6 and 4).
- Strictness: a strict inequality (`<`, `>`) appears from Level 2 and is drawn dotted; the working says the boundary is not in the region.

## 2. Starting From (the three ways a question begins)

An option, **Starting From**, three tick buttons (a question draws one of those ticked; no "Either" button):

| Tick | What the student gets | What they do |
|---|---|---|
| **A Situation** | a short context (the story library of `lpGen`, same contexts as Formulating) | form the constraints and objective, draw, solve |
| **Inequalities** | the constraints and the objective written out | draw, solve |
| **Diagram Given** | the region already drawn (solve and integer only) | solve (use the picture) |

`region` offers the first two (it is the drawing skill). The default is **Inequalities** at Level 1 and **A Situation** from Level 2. The forming step reuses the Formulating wording and shows the same model Formulating would, so a student sees one model formulated, drawn and solved; there is no direct link to Formulating's generator in this build.

## 3. Levels: what really differs

A level is a kind of region and line, not a size and not "given or drawn" (that is Starting From).

| | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Region** | two or three sloped constraints, positive coefficients, a bounded region on the origin side (all `≤`) | adds **bounds** (x ≥ 3, y ≥ 2) and a **vertical or horizontal line** (x ≤ 8), mixed `≤` and `≥`, a strict boundary, up to five constraints | the region is **away from the origin**: `≥` constraints, so (0, 0) is not in it; and a **line through the origin** from a relation ("at least twice as many x as y", `y ≤ 2x`) |
| **Objective** | maximise P = ax + by, a, b > 0 | maximise with a **negative coefficient** (P = 3x − 2y), where the best vertex is not top right | **minimise a cost** (C = ax + by), the best vertex nearest the origin side of the region; some regions are open (unbounded) in the direction that does not matter |
| **`integer`** | the best whole point is the nearest one (rounding the optimum works) | the **trap**: the best whole point is not the nearest to the optimum, and the nearest may not even be feasible | (same as Level 2 with minimise and a region away from the origin) |

`region` and `solve` have **three levels**; `integer` has two (its regions follow Level 1 and Level 2 of `solve`; a minimise whole-number question is a Level 2 question). **Ensure no higher level can draw a lower-level question** (as in the other LP tools): every Level 2 question has a bound, a vertical or horizontal line, a negative coefficient or a trap; every Level 3 question has a region away from the origin, a line through the origin or a minimise.

**The integer trap, as Harry sees it.** The best whole-number point is always one of the **four whole points around the optimum** (the two floors and ceilings of x and y), and only a feasible one counts. Level 2 builds the case where it is **not the point nearest to the optimum**: round-to-nearest is infeasible or worse than another of the four. The earlier plan of a far-away best point (corpus L29, gradient close to a boundary's) is dropped on Harry's word.

## 4. The picture (a new representation: the reason, R27)

The region picture is a **coordinate graph of lines, half-planes and points**, drawn from the exact vertices: axes with whole-number ticks and a faint grid, each boundary line a letter (A, B, C) with its constraint written in a **key below the graph** (continuous or dotted), the **unwanted side of each line a translucent grey block** (overlaps are darker, so the feasible region is the white part; Harry, 2026-11-28, after trying hatching and then ticks), **R** printed inside an enclosed region, vertices as dots whose coordinates appear on hover, tap or focus (always in print, and in a step that is about them), and, in `solve` and `integer`, the objective lines (two dashed lines at two objective values and an arrow for increasing value) and the lattice points (dots on the region, the best ringed). It is none of the eight core representations (`docs/reference/pictures.md`: bar model, place value table, ratio table, counters and the others are for numbers and quantities, not for a plane with several lines); it is the figure the textbook and every exam answer use. The reason, one sentence in the design note: *the question is about where lines cut and which side holds the region, which no existing representation can show*.

Rules it must meet:

- The `<svg>` emits `data-q-index` and has **no fixed pixel height** (R31); it shrinks to fit, with a phone-height cap (about 40vh on a phone) and a larger box on tablet and laptop; labels stay readable at 390 px.
- The whole picture is built in steps so the stepper reveals it one line at a time: axes, then each line in order with its shading, then R, then vertices, then objective lines or lattice points. Reserve space for everything (R32); opacity, not mounting.
- **Shade out** is the default, drawn as translucent grey blocks; colour is never the only cue (the letter on the line and in the key, and the dotted style). With **Shade In** the feasible region is tinted instead.
- It prints: `config.skillPrint` puts the picture under each question and the model picture on the answers page, on the shared grid print (`handleDiagramPrint`, never a hand-written grid).
- The engine (`computeFeasibleRegion`, `optimiseLinear` in `src/shared/grapher/mathEngine.ts`) is used in tests as an independent cross-check, not to draw: the picture uses the generator's exact (fraction) vertices.

## 5. Options

Every option that can mix is **tick buttons**: two ticks that may both be on, never "Either" or "Both" buttons; options are Title Case.

| Option | Where | Buttons | Display only? |
|---|---|---|---|
| **Starting From** | all | A Situation · Inequalities · Diagram Given (solve and integer only) | no (changes what is asked) |
| **Shading** | region, solve | **Shade Out** (on) · Shade In | **yes** (the same question, drawn the other way) |
| **Method** | solve | **Sliding Line** (on) · Vertex Table | **yes** (see below) |
| **Integer Method** | integer | **Lattice Grid** (on) · Greatest y For Each x | **yes** |
| **Working Shown** | all | Full Working · Answer And Vertices · Answer Only | **yes** |
| **Picture Extras** | solve, integer | Grid Lines · Lattice Dots | **yes** |

- **Method is the switch Harry asked for.** A `solve` question stores both solutions (the objective-line positions and the vertex table, from one computation: R5), and the Method ticks choose which the working and the answer show; ticking the other changes the display on the same question, never regenerates it (R14, `displayOnly`). If both are ticked, both are shown, line first. If neither is ticked the default (Sliding Line) is used.
- Defaults are the sliding line because that is how the students are taught; the vertex table is the check and the method for tidy coefficients. The sliding line working says which vertex the line touches last (or first, when minimising), at which two objective values the dashed lines were drawn, and that the result is the vertex the table gives.
- `region` has no Method (it ends at the vertices).
- Question size is set by the level, not an option; there is no Size option in this tool.

## 6. Generation: the answer first

Never random constraints solved afterwards. The generator **builds the region and the answer, then writes the questions around them** (as Mechanics and the Simplex tool do).

1. Choose the **feasible polygon**: three or four sloped constraints and any bounds, each from whole-number intercepts, such that every vertex is a small rational point (denominators 1 to 6; a vertex at denominator 8 only as a fixed test example), the region is non-empty with **non-empty interior**, and every constraint is **active** (it touches the region in an edge). No redundant constraint at these levels (L32 is a later sub-tool).
2. Choose the **objective** (whole coefficients) so that **one vertex is strictly best, with no tie along an edge** (the objective's gradient is never parallel to a boundary): `bestVertices` returns exactly one point, checked by exact comparison with every neighbour. An optimum on an axis, using one variable, is allowed as the occasional question (about 1 in 8), not the usual one.
3. A limit is never smaller than one of its own coefficients (10x + 50y ≤ 40 reads as a mistake).
4. **Integer questions:** pick a vertex that is not whole, so the best whole point is a genuine search; the four surrounding whole points are computed, and a brute-force search of every lattice point in the region **must agree the best one is among them**. Level 1 keeps those where the nearest point is best; Level 2 keeps those where the nearest is infeasible or worse.
5. Draw again within the generator when a draw is rejected (under 1 in 100 expected, AGENTS.md); a fall-back marked `_fallback: true` otherwise. A generator draws everything through `Math.random` and keeps no state (R45).
6. A **Situation** question picks a context and wording from the Formulating story library, with the unit and noun per variable (R2: the question key names every parameter that varies it, so a 30-question worksheet can be filled with different questions at every level).

## 7. The working (what the stepper shows)

- **`region`**: (1) the constraints as inequalities (if from a situation: the formulation, with the common slip named); (2) each line, from two points (its intercepts, or a point and the vertical or horizontal line), continuous or dotted; (3) which side to shade out, by testing (0, 0) (a point on the line is not a test), and the shading; (4) R if enclosed, with a sentence if it is open; (5) the vertices, each by solving the two boundary equations, with the check that it satisfies the other constraints. Slips named: shading the wrong side, a solid line for a strict inequality, testing a point on the line.
- **`solve`**: the region as above (when the diagram is not given), then **Sliding line** (two dashed lines at two objective values, the arrow, the last vertex touched, its coordinates by solving) and/or **Vertex table** (vertex, objective value, the best marked), then the statement in context with units. Minimising reads the smallest value; a negative coefficient is shown to move the best vertex.
- **`integer`**: the optimum, why it is not usable, the four surrounding points (feasible or not, with the check) or the lattice grid or the table of the greatest y for each x, the best whole point and its value, and the remark that it is below the non-integer optimum (corpus L13: the real profit may be lower than the model's).

## 8. Data model, files and tests

- `src/shared/decision/lpGraph.ts` (the maths, no React): exact lines and half-planes over `Fr`, the polygon as ordered vertices and edges (reusing `vertices`, `bestVertices` and `opHolds` from `lp.ts`, not rewriting them), shade-out half-planes, objective-line positions, the lattice points of a region and the four surrounding points. `lpGraphGen.ts` (the designed generators), `lpGraphSolve.ts` (the working), `LpGraphPicture.tsx` (the picture), `src/tools/Decision/GraphicalLP.tsx` (`/lp-graphical`, `enabled: false`).
- **Independent re-derivation in tests** (as `lp.test.ts` does): (a) every vertex is rechecked against every constraint by `holds` written independently of the coefficients; (b) the vertices from `computeFeasibleRegion` (floating point, the grapher's own clipping) match the exact ones; (c) the optimum equals a **brute-force scan** over a fine rational grid (step 1/12) of the whole region, not a vertex search; (d) the best whole point equals a brute-force search of every lattice point (and lies among the four surrounding points); (e) the nearest-point rule: Level 1 integer questions have the nearest feasible, Level 2 have it infeasible or worse; (f) a single best vertex always, and gradient never parallel to a boundary; (g) the constraint-count rule: at most four constraints (five with a bound), at most three sloped; (h) level exclusivity: no Level 2 or 3 feature in a lower level, and no Level 1 question at a higher level; (i) strict boundaries are dotted, non-strict continuous; R present exactly when the region is enclosed; (j) the picture emits `data-q-index` and no fixed pixel height, and a stepper never changes the size of the picture; (k) Method and Shading toggles do not change the question (`reformatQuestion`, same key and answer); (l) seeded replay (R45), a 30-question worksheet of different questions at every level and option setting, and every KaTeX string renders.
- **Acceptance examples (hand-checked, the textbook's own ferry problem):** maximise 3x + 5y subject to 5x + 6y ≤ 50 and 2x + 4y ≤ 25, x, y ≥ 0: vertices (0, 0), (10, 0), (6.25, 3.125) and (0, 6.25); optimum 34.375 at (6.25, 3.125); the best whole point 33 at (6, 3), with (6, 4), (7, 3) and (7, 4) infeasible. It is a test example only (its vertex has denominator 8, above the generator's limit).

## 9. Build chunks (each merges on its own)

| Chunk | What | Notes |
|---|---|---|
| **G0** | `lpGraph.ts` and its test (the maths, the four surrounding points, the brute-force cross-checks) | shared piece with a test; no UI. **Built 2026-11-28** |
| **G1** | the region picture `LpGraphPicture.tsx` and its test (R27 reason in `docs/reference/pictures.md`; phone, tablet, laptop) | picture only. **Built 2026-11-28** |
| **G2** | the tool behind `enabled: false` with `region` (three levels), the DD hub link, `decisionSpec.ts` DD2 comment | the stepper, print, About. **Built 2026-11-28** |
| **G3** | `solve` (three levels, Method, Starting From) | |
| **G4** | `integer` (two levels) | |
| **G5** | deck content (a graphical-LP teaching deck; after the code is merged: see AGENTS.md "Deck data format") | |
| **G6** | the switch (go live), dashboard Review, planner Build Log, the three screen sizes and the print on a real printer | Harry's decision |

After these: `range`, `redundant`, a "From Formulating" start, and the exam-style chain (L33).

## 10. Contexts and wording

The story library of Formulating (bakery, workshop, farm, café, charity) with whole-number items; the objective is a profit to **maximise** or a cost to **minimise**; units are named. A "Situation" question never says "x, y" before it defines them. A minimise has a natural wording only with a minimum requirement (at least 12 units of …), so Level 3's minimise is always a situation about meeting requirements or a plain inequality list.

## 11. Decided (Harry, 2026-11-28)

1. **Shading:** shade out, then put **R in the region when it is enclosed**. The Shade In tick is kept as an option (the textbook's objective-line figure shades the feasible region); default Shade Out.
2. **Shape:** the first asked-for shape was "one sub-tool per method". Harry also wants to switch between the sliding line and the vertex table **without regenerating** the question, so the sub-tools are the **skills** (region, solve, integer) and the **method is a switch**. The three starts he gave (form, draw and solve; draw and solve from given inequalities; just solve) are the Starting From option.
3. **Chaining:** no simplex (two variables only), at most four constraints (five with bounds like x ≥ 3, y ≥ 2), at most three of the form ax ± by. No direct link to Formulating's generator in this build.
4. **Method:** sliding line is how the students solve, so it is the default; the question can be switched to the vertex table without regenerating.
5. **Levels:** the kind-of-region steps of section 3, but with **whole-number coefficients only** (fractions and decimals are not how a problem is set up).
6. **The integer trap:** the best whole point is one of the **four points around the optimum**, not necessarily the nearest.
7. **Picture:** a new SVG region picture, with the R27 reason in section 4 (Harry agreed).

**Settled by default, change on request** (not asked): the Working Shown buttons and the Picture Extras and Integer Method options in section 5; `integer` having two levels; the Level 3 contents (a region away from the origin, a line through the origin, a minimise); five constraints only with a bound.
