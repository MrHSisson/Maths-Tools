# Linear Programming (Decision Maths, chapter DD) — programme brief

**Status:** draft (2026-11-21). A plan to fill in once Harry's textbook chapters arrive. Nothing is built. Not `ready`: section 9 lists what the textbook must settle, and section 10 the decisions for Harry.

**What this is.** The research and the first shape of the build for AQA 7367 / 7366 chapter DD, written before the textbook so that the chapters can be read against a plan (sections 6 and 9 say what to pull out of them). It follows the pattern of the Further Mechanics brief (`specs/further-mechanics-mc.md`): single-skill generators first, an independent re-derivation of every answer, exam-style questions as a separate later pass from real papers.

---

## 1. What the specification asks for (AQA 7366 AS / 7367 A-level, section DD)

Source: the repo's copy `specs/exam/spec/aqa-discrete.md`, checked against AQA's subject-content page ([Optional application 3: Discrete mathematics](https://www.aqa.org.uk/subjects/mathematics/a-level/further-mathematics-7367/specification/subject-content/optional-application-3-discrete-mathematics)).

| Ref | Statement | AS | A-level | What it means for a generator |
|---|---|---|---|---|
| DD1 | Formulate constrained optimisation problems | Y | Y | worded problem → variables, constraints, objective |
| DD2 | Solve them by graphical methods | Y | Y | two variables: draw, find the feasible region, optimise (vertices or the objective line), integer solutions |
| DD3 | Simplex algorithm, maximising and minimising, with slack variables | N | Y | tableaux, pivoting, reading the answer |
| DD4 | Interpret a simplex tableau | N | Y | what the numbers mean: basic variables, slack, binding constraints, optimal or not |
| DF6 | Convert and solve higher-order games as linear programmes (chapter DF, A-level only) | N | Y | the bridge to game theory; see section 5 |

**AS or A2.** DD1 and DD2 are AS and A2. DD3 and DD4 are A2 only (the simplex algorithm was D2 content in the legacy course and is A-level only in this spec). So the tool's **Course** setting hides the simplex and tableau sub-tools at AS, as the mechanics tools hide A2 content.

**What the spec does not say** (to settle from the textbook and past papers, not to assume): the wording of "minimising" in the simplex (the usual route is to maximise the negative of the objective, but the textbook decides what AQA students are taught); whether only ≤ constraints appear in simplex questions (one third-party resource says so; it is not in the specification text, so treat it as unverified); whether the two-stage or Big-M method is examined (the spec names neither, and Edexcel's 9FM0 teaches two-stage; do not borrow it without evidence); whether sensitivity analysis or shadow prices are asked under "interpret".

## 2. What the research found

- **Legacy sources in the hub already.** `src/tools/Decision/decisionSpec.ts` chapter DD lists the AQA D1 "Linear Programming" and D2 "Simplex Algorithm" (with mark scheme) packs and Edexcel D1 and D2 topic questions on PMT (formation of problems, graphical, simplex). Graphical LP is legacy D1; simplex is legacy D2. The hub marks DD1 and DD2 as supported by D1/D2 questions and DD3, DD4 as supported by D2. DF6 has no legacy questions found.
- **Examiner-report evidence (AQA 7367/3D, June 2023 and June 2025,** [AQA June 2023 report](https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/2023/june/AQA-73673D-WRE-JUN23.PDF)**).** From the fragments the search returned: choosing the wrong pivot column was the most common simplex error (the rule is the most negative entry in the objective row, then the ratio test along that column); in 2025 some students used the simplex method where it was not the right tool, and just under half got all three inequalities right in a formulation part. These are the **misconceptions the generators and the working should name**. The report PDFs should be read in full when the textbook is in hand; I only had snippets.
- **The method conventions students meet** (from [Save My Exams](https://www.savemyexams.com/a-level/further-maths/edexcel/17/decision-1/revision-notes/linear-programming/simplex-algorithm/simplex-algorithm-slack-variables-and-initial-tableau) and the [PMT D2 simplex questions](https://pmt.physicsandmathstutor.com/download/Maths/A-level/D2/Topic-Qs/Edexcel-Set-1/D2%20Linear%20programming%20-%20Simplex%20algorithm.pdf), Edexcel, so the layout is not AQA's): the initial tableau has a column for the basic variable, one for each variable and slack, a value column and a θ (ratio) column; the pivot column is the most negative objective-row entry; the pivot row is the least positive θ; the algorithm stops when no objective-row entry is negative. AQA's own tableau layout, objective-row convention (P − 3x − 4y = 0 or the reverse) and names for the slack variables must come from the AQA textbook and past papers.
- **The graphical method** (D1): feasible region by shading (the exam convention for which side to shade is a **design decision**, section 10), then the optimum by vertex testing or by sliding the objective line; integer solutions by checking lattice points near the optimum. I found no source for the ruler method or integer checking beyond past papers, so those come from the textbook.
- **What the repo already has.** (a) A graph engine: `computeFeasibleRegion` and `optimiseLinear` (`src/shared/grapher/mathEngine.ts`) and a `linearProgramming` recipe that draws boundary lines, shades the polygon, dots vertices and labels the optimum (`recipes.ts`), with step-by-step builds in `SmartGrapher` (`GraphBuildSpec`, "Keep working" steps; Mixed Strategies already uses it). It clips to a window and is for pictures, not for exact vertices, so the generators need their own exact (rational) vertex arithmetic and may use the engine only to draw. (b) `DecisionShell`, the pattern for a tool with its own data field, written working and stepper (`src/shared/decision/`; Dimensional Analysis and the Mechanics tools are the models), and the Decision hub with a DD chapter card whose `toolIds` is empty. (c) The Mixed Strategies tool (game theory), which DF6 feeds into.
- **What is new.** A **tableau picture** (a table with the pivot column and row highlighted, the pivot element circled, row operations written beside it) and a **constraint-and-region picture** drawn by the generators' own exact geometry. Neither is one of the eight core representations (`docs/reference/pictures.md`); the tableau is a table and the region a coordinate graph, so each needs a short justification in the design note, as the mechanics diagram system had.

## 3. The shape of the tool

One tool, **Linear Programming** (`/linear-programming`, `hub: 'decision-overview'`), on `DecisionShell`, like Dimensional Analysis (own data field `lp`, written and drawn working). Sub-tools are single skills; **exam-style questions are a separate later pass from past papers** (the same decision as Mechanics).

| Sub-tool | Statement | Course | Levels (draft) | What the student does |
|---|---|---|---|---|
| `formulate` Formulate the problem | DD1 | AS, A2 | 1 two variables, all ≤ with a plain context · 2 mixed ≤ and ≥, "at least", "no more than" · 3 ratios and proportions ("at least twice as many…"), integer, three variables (A2 for the simplex set-up) | defines the variables, writes constraints and the objective; the answer is the set of inequalities and the objective, shown as the model solution |
| `region` Draw the feasible region | DD2 | AS, A2 | 1 lines with positive intercepts, ≤ only · 2 mixed, a vertical or horizontal boundary · 3 ≥ constraints, an unbounded region that the objective keeps bounded | draws the lines, shades (by the textbook's convention), labels the region R and finds its vertices |
| `optimise` Optimise graphically | DD2 | AS, A2 | 1 test the vertices · 2 the objective line, minimising and maximising · 3 integer solution near a non-integer vertex | finds the optimum point and value; integer case by checking lattice points |
| `setup` Set up the simplex | DD3 | A2 | 1 two variables, slack variables and the initial tableau · 2 three variables · 3 mixed ≥ only if the textbook teaches a method | writes slack variables, the equations and the initial tableau |
| `pivot` Choose and carry out a pivot | DD3 | A2 | 1 pivot column and row (the ratio test) · 2 the row operations for one iteration · 3 a full run to optimality | one iteration at a time, then the whole algorithm |
| `interpret` Interpret a tableau | DD4 | A2 | 1 read the solution and the objective value · 2 which constraints are binding and the slack · 3 is it optimal; what the next pivot would be; the effect of a change if the textbook examines it | reads the numbers |

`region` and `optimise` may merge into one sub-tool (`graph`) if the textbook treats them as one skill, and `setup` and `pivot` likewise; the textbook's section breaks decide (section 9). The hub pairs each sub-tool with exactly one statement (`decisionPairings.test.ts`).

## 4. How questions are generated (equations first, as in Mechanics)

A generator **never picks random constraints and solves them**; that gives empty regions, unbounded optima, ties and ugly vertices. It builds the answer first:

1. **Region.** Pick three to five boundary lines with whole-number intercepts so every vertex is a small rational point (a vertex is the intersection of two lines; reject if any vertex has a denominator above a limit the textbook's examples suggest, 3 or 4 at most). Reject an empty, degenerate (three lines through one vertex) or accidentally unbounded region.
2. **Objective.** Pick coefficients so the optimum is a **single vertex** (no ties along an edge) and, for the integer case, a non-integer optimum whose nearest feasible lattice point is **not** the rounded vertex (the classic trap), found by exhaustive search over the lattice.
3. **Story.** A context from a small library (a bakery, a factory, a farm, a charity) with realistic ranges, as for the mechanics contexts; constraints in words are generated from the same numbers, so the wording and the model cannot disagree.
4. **Simplex.** Start from the same model with only ≤ constraints (slack variables), so the tableau is integer; use **exact rational arithmetic** (a small fraction class, never floats) so every tableau entry is exact; require **non-degenerate pivots** (a unique least positive θ at every step), a bounded problem, two or three iterations to the optimum (the textbook's worked examples set the norm), and a first pivot choice that is not the "obvious wrong column" unless the question is meant to test it.

Rounding does not arise (all values are exact fractions); where the textbook asks for decimals, the rule is the textbook's.

## 5. DF6: game theory as linear programming

DF6 (A-level) converts a higher-order zero-sum game to an LP and solves it. It belongs to the chapter DF tool (Mixed Strategies) and is **not** part of the first build; the work needed is a game-to-LP formulation sub-tool and simplex on the converted problem, so it reuses `setup`/`pivot`. It should be planned with the DF textbook chapters and marked as the link in both hub cards.

## 6. Options (draft; align to the textbook)

Following the options vocabulary (Title Case; "Ask for", "Working Shown", "Answer Format"; exclusive pools apply one option per question): **Course** (AS | A2, default A2); **Ask for** (per sub-tool); **Constraint Types** (≤ only | ≤ and ≥); **Objective** (maximise | minimise | either); **Context** (no story | worded situation); **Integer Solutions** (not needed | required); **Shading** (shade the feasible region | shade out the unwanted regions, whichever the textbook uses); **Working Shown** for `optimise` (vertex testing | objective line); **Tableau Layout** (the textbook's column order and objective-row convention; display only). A change that alters the numbers throws the question away; one that only changes how the same question is shown redraws it (R14).

## 7. Tests every sub-tool must have

- **Independent reference.** The optimum is re-derived by a different route: for the graph, enumerate every pair of boundary lines, keep the feasible intersections and compare (and, for the integer case, a lattice search); for the simplex, the tableau's solution is compared with the vertex enumeration of the same model, and every pivot is re-done with row operations from scratch.
- **Acceptance examples** from the brief (section 9) reproduced line by line.
- **Guards** of section 4 (no ties, bounded, non-degenerate, vertices within the denominator limit) as tests over thousands of draws.
- **Smoke:** every KaTeX string and every picture renders; seeded replay (R45); a 30-question worksheet of different questions per level; Course AS shows nothing A2-only.

## 8. Build order

| Stage | Builds | Harry reviews |
|---|---|---|
| 0 | the corpus of styles (`specs/corpus/linear-programming-styles.md`) filled from the textbook; this brief made `ready` | the style list and the sub-tool split |
| 1 | `src/shared/decision/lp.ts` (exact rationals, vertex enumeration, lattice search, simplex), with its tests | the maths on worked examples |
| 2 | the region picture (reusing the grapher engine for drawing) and `formulate`, `region`, `optimise` | the look of the graph at the three sizes and in print |
| 3 | the tableau picture and `setup`, `pivot`, `interpret` (A2) | the tableau layout against the textbook's |
| 4 | the hub pairing, About words, calibration, phone/tablet/laptop check; Depth and Teach material later | go-live |
| later | DF6, exam-style chains from real papers | |

## 9. Filling this in from the textbook (the intake checklist)

For each chapter section, record in `specs/corpus/linear-programming-styles.md` (shapes only, never wording or numbers) every **worked example and exercise question style**: which statement, AS or A2, what is given and what is asked, and which sub-tool it belongs to. Then settle:

1. **Formulation conventions:** how variables are named and defined, how "at least", "no more than", ratios and integer limits are written, whether non-negativity is stated each time, whether three-variable formulation appears.
2. **Graphical conventions:** which region is shaded, how the feasible region is labelled, vertex testing versus the objective line (and the "parallel to the objective" ruler), integer checks, how a minimising problem is shown.
3. **Simplex conventions:** the tableau layout (columns, the objective row, the θ column, the basic-variable column), the names of slack variables, the pivot rule and what happens on a tie, how minimising is handled, whether ≥ constraints reach the simplex, how many iterations the examples take, the interpretation vocabulary ("slack", "binding", "basic", "non-basic", "shadow price"?).
4. **Interpretation:** exactly what a tableau must be read for (DD4) and any sensitivity questions.
5. **Two or three acceptance examples** with the exact values (made-up numbers are fine, checked by hand), for each sub-tool.
6. **Past-paper shapes** to note for the later exam-style pass: the typical chain (formulate → draw → optimise → simplex → interpret), marks per part, and the error patterns named in the examiner reports.

### 9a. What the textbook chapter settled (2026-11-21)

Source: chapter 4 "Linear programming" of the textbook Harry sent (sections 1 to 3, Exercises 4A to 4C, Work it out 4.1, Mixed practice 4); every question style is in `specs/corpus/linear-programming-styles.md` (rows L01 to L57). The chapter's own Y2 marker confirms AS = sections 1 and 2, A2 = section 3.

1. **Formulation.** Variables are defined in words with units ("x = number of …"); the objective is written "Maximise P = …" (or Minimise C), then "subject to:", one constraint per line, then non-negativity (x ≥ 0, y ≥ 0) and, when items are whole, "x, y are integers". Constraints from the textbook's contexts: resource use per item; "at least"; "at least twice as"; percentage shares; a "remainder" quantity eliminated by substitution (so the objective gains a constant); a ratio-of-capacities constraint ("enough for 30 of A or 50 of B"); data in a table. Non-negativity is stated every time. Three-variable formulation appears in section 1 (it carries no A-level marker, so it is AS content), with a reduction to two variables by using all the time.
2. **Graphical.** The textbook's rule is to **shade out the unwanted regions so the feasible region is the unshaded part**, but its objective-line example shades the feasible region instead and says so. Keep the brief's **Shading** option, default "shade out", and offer the other. Both optimisation methods are taught: **vertex testing** (a table of vertex and objective value) and the **sliding objective line** (two dashed parallel lines at two objective values and an arrow for increasing value); the textbook says the line method is better when coefficients change or variables are integers, and vertices are easier otherwise. Vertices are found exactly by solving simultaneous equations (fractions, or decimals only if exact). A minimising problem is the smallest vertex value. Integer solutions: check lattice points near the vertex, by a grid on the region or by a table of the greatest feasible y for each integer x; the "nearest integer is not always the optimum" trap is named in the book.
3. **Simplex.** The textbook's layout, to be reproduced exactly: columns **P, the variables, the slack variables, the right-hand side (header blank)**; the **first row is the objective row** (P − …, so the objective coefficients appear with flipped signs) and the first column is the P column (1 then 0s). **There is no basic-variable column and no θ column**: the ratios are written beside the tableau in the working ("8 ÷ 1 = 8 …"), and the working states the pivot. Slack variables are s, t, u … (or s₁, s₂ …). **Pivot rule:** the textbook allows any negative column; the usual rule is the most negative entry, and for equal ones the earliest column; the pivot row has the smallest non-negative ratio over positive entries in the pivot column (any one if tied); the row operations are written "new pivot row (NPR) = pivot row ÷ pivot", then "row n ± k × NPR". Keep **Pivot Column** as an option (the most negative one, or the one the question tells the student), since the textbook itself explores choosing another column and shows the same optimum is reached. The algorithm stops when no entry in the objective row is negative. **Minimising** is by maximising Q = −P (stated in the key point, with the condition that variables are non-negative and the origin is a vertex); the answer is then the negative of the maximum Q. **Only ≤ constraints reach the simplex as given**, but a ≥ constraint appears after being rewritten as a ≤ with a non-negative right-hand side (multiply by −1, which also covers right-hand sides of 0); no two-stage or Big-M method is taught. Examples take two to three iterations; a zero right-hand side in a constraint row (a zero ratio) occurs and is a Level 2 hazard. Fractions are advised to avoid rounding errors.
4. **Interpretation (DD4).** What a tableau must be read for: basic variables (column of 0s and a single 1) take their values from the final column; non-basic variables are 0; the value of P is read from the final column, **not** the objective row (a named common error); a zero slack means the constraint is at its limit (binding); optimal when the objective row has no negatives; a wrong pivot shows up as a negative final-column entry. **There is no sensitivity analysis or shadow price** in this chapter (so none in the first build); the only "what if" is the k-parameter in the graphical work and in one A2 mixed-practice question (rows L30, L55 of the corpus, left UNHOMED).
5. **Acceptance examples** (the textbook's own, by hand, for stage 1 tests): the ferry problem (maximise 3x + 5y, constraints 5x + 6y ≤ 50 and 2x + 4y ≤ 25: vertices (0,0), (10,0), (6.25, 3.125), (0, 6.25), optimum 34.375, integer optimum 33 at (6, 3)); the three-variable simplex problem (maximise 5x − 3y + 4z; optimum 34.8 at x = 0.4, y = 0.8, z = 8.8 after three iterations; the same optimum from every pivot order); the minimising simplex problem (minimise 2x + 5y − 6z; optimum −26 at x = 0, y = 2, z = 6).
6. **Past-paper shapes.** Two AQA chains are in the chapter (rows L33, L57 of the corpus). The AQA examiner reports are still to be read in full.

## 10. Decisions for Harry

1. **One tool or two.** Recommended: one (Linear Programming) with the six sub-tools above; the simplex is A2 and hidden at AS. Alternative: Graphical LP (AS and A2) and Simplex (A2) as two tools.
2. **Drawing convention.** Shade the feasible region, or shade out the unwanted region (the AQA and Edexcel legacy papers' convention, if that is what the textbook uses)? Recommended: follow the textbook, and offer the other as an option.
3. **Shell.** Recommended: `DecisionShell` with a written-and-drawn working (like Mechanics), not a network.
4. **The simplex scope.** Recommended: ≤ constraints and maximising only at first, with minimising by the textbook's method added once it is known; no two-stage method unless the textbook teaches it.
5. **Integer solutions.** Recommended: a Level 3 skill in `optimise`, with the rounding trap built in.
6. **DF6** is planned with the game-theory chapters, not now.
7. **Exam-style questions** are a later pass built from the real papers, as for Mechanics.

## 11. Appendix: sources

- AQA specification, section DD: [Optional application 3: Discrete mathematics](https://www.aqa.org.uk/subjects/mathematics/a-level/further-mathematics-7367/specification/subject-content/optional-application-3-discrete-mathematics) (the page's address mixes the AS and A-level codes; the repo's `specs/exam/spec/aqa-discrete.md` is the checked copy).
- AQA 7367/3D examiner reports: [June 2023](https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/2023/june/AQA-73673D-WRE-JUN23.PDF) (read in full before the exam-style pass; this plan used search fragments only).
- Method conventions (Edexcel, not AQA): [Save My Exams: slack variables and the initial tableau](https://www.savemyexams.com/a-level/further-maths/edexcel/17/decision-1/revision-notes/linear-programming/simplex-algorithm/simplex-algorithm-slack-variables-and-initial-tableau), [PMT D2 simplex topic questions](https://pmt.physicsandmathstutor.com/download/Maths/A-level/D2/Topic-Qs/Edexcel-Set-1/D2%20Linear%20programming%20-%20Simplex%20algorithm.pdf), [Flying Colours Maths: a student asks about the simplex algorithm](https://flyingcoloursmaths.co.uk/student-asks-simplex-algorithm/).
- Legacy packs already linked in the hub: AQA D1 and D2 linear programming and simplex, Edexcel D1 and D2 LP topic questions (`decisionSpec.ts`, chapter DD).
