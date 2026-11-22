# The simplex algorithm: a roadmap through the tools

**What this is.** A route for a class to follow, in order, through the simplex tools and their levels, the way a class follows a textbook chapter. (The same route is a page at `/lp-roadmap` in Developing-tools mode, with a button for each piece of practice that opens the tool on the right sub-tool, level and option; the stages are data in `src/tools/Decision/SimplexRoadmap.tsx`, so keep the two in step. The page also gives each stage its scale, what it is doing and what it builds towards, which this table does not.) Each stage says what the students should be able to do and which sub-tool and level to use (with the option that matters). It is not a deck: the deck for the idea is `lp-simplex-process` and it is stage 2.

**Assumed.** Formulating is done: students can write a model (objective, constraints, non-negativity) from a story, and can draw a region and read its corners. This roadmap starts at the slack variables.

**The shape.** Each level is its own set of questions, so a student who is ready for Level 2 never meets a Level 1 question again. Level 1 is two variables with the inequalities given; Level 2 is three variables in words or a table; Level 3 needs a change of form. The scale grows stage by stage: 2 variables, one step then a whole run, a story with 3 variables, interpreting the answer, then a change of form with 3 or 4 variables.

| Stage | Tool, sub-tool, level | Students can… |
|---|---|---|
| **1. The start** | **Set up the tableau › Level 1**, then **Read a tableau › Level 1** (the optimal tableau) | Add a slack variable to each constraint, write the objective as P − 2x − 3y = 0, write the initial tableau, and read the value of every variable and of P from a tableau |
| **2. Why it works** | **The deck `lp-simplex-process`**, with its graph beside the table | Say why the most negative entry is the way to go, what the ratio test is for, what the row operations do, and what the bottom row says when it stops |
| **3. One step, then the whole run** | **One pivot › Level 1**, first with **Pivot: Pivot Given** (the row operations only), then the student chooses; then **Solve a problem › Level 1** (two iterations) | Choose the pivot column and row from the θ-values, divide the pivot row, clear the column, and repeat until no negative is left |
| **4. In words, three variables** | **Set up the tableau › Level 2**, **One pivot › Level 2** (part-way through a run), **Solve a problem › Level 2** (a situation in words or a table), **Read a tableau › Level 2** (not yet optimal) | Simplify the constraints, set up from a story, take three iterations, say what a slack variable means in the story with its units, and say why a tableau is not optimal |
| **5. Whole numbers** | **Is it practical? › Level 1**, **Level 2**, **Level 3**; a deck is planned (below) | Say why a fractional optimum cannot be made, find the best whole-number plan (round down; add where there is room; check the bound), and know that rounding to the nearest can break a constraint |
| **6. When it does not start at the origin** | **Solve a problem › Level 3** and **Set up the tableau › Level 3**, ticking Starting Form one at a time: Minimise, A ≥ Constraint, A Lower Bound, An Equality; **One pivot › Level 3** (a negative right-hand side); **Method** (Substitute And Split, or Use As Rows); **Read a tableau › Level 3** (the problem the tableau shows); a deck is planned (below) | Minimise by maximising P = −C; rewrite a ≥ constraint and start by pivoting on a negative entry; handle y ≥ 4 by Y = y − 4 or as one more constraint; handle an equation as two inequalities or as a row; go from a tableau back to the problem |

**Gate at the end:** a student can take a worded problem, set it up, solve it by the tableau, state the answer in context with the meaning of each slack variable, and say whether it is practical.

## Textbook exercises

**Whole exercises, at the end, never single questions** (decided 2026-11-22): a stop-off is only useful as the full exercise, so one is set only once everything in it can be done. Cambridge is chapter 4 (T4), Oxford chapter 30 (T30); the question numbers are from the corpus (`specs/corpus/linear-programming-styles.md`), recorded when the chapters were read, so check an exercise against your own copy before setting it.

- **T4 Exercise 4C: after stage 6.** The questions recorded from it (1 to 10) are all skills covered by then (the initial tableau, choosing the pivot, one iteration, solving, reading the values, a story with a zero slack, minimising, the study-and-sleep problem). Question 8 also asks whether a different first pivot column changes the final tableau: students can try it by hand; the tool does not ask it (dropped by Harry, 2026-11-22).
- **T4 Exercises 4A and 4B** are not on this route: 4A is formulating (assumed) and 4B is solving graphically, which belongs with the Graphical tool (not built). **T4 Mixed practice** mixes graphical and simplex questions, so it waits for the graphical work.
- **T30 Exercises 30.1A and 30.1B are not placed.** Parts of them fit stages 4, 5 and 6, but 30.1B includes a question on a miscopied number that makes the problem infeasible or unbounded, which the tools and this route do not cover, so it cannot be set whole; 30.1A has to be checked question by question against the book first.

## Decks planned (agreed with Harry, 2026-11-22)

Stages 3 and 4 are procedural practice, which the tool does better than a deck; stage 1 is covered well enough by the deck for stage 2. Two decks are planned, both with the graph beside the table:

- **Stage 5, "Why rounding fails":** the feasible region with the whole-number points near the optimum, the optimum as an upper bound, the points that fit, and why rounding to the nearest can break a constraint.
- **Stage 6, "Not starting at the origin":** why a ≥ constraint makes the origin infeasible, what a negative right-hand side is saying, why the first pivot goes on a negative entry, and why minimising is maximising −C.

Neither is built. Order of work: a short brief (`specs/decks/`), the look card, Harry's yes, then the build.

## Not in the tools (use the books)

- The parameter k in the tableau (**T4 MP12**), a tableau that shows unboundedness (**T4 MP6**), and a miscopied number that makes the problem infeasible or unbounded (**T30 Ex30.1B 12**): left for the exam-style pass.
- **The full exam chains** (**T4 MP10, MP11** are AQA past-paper questions): the tools build the skills; the chain is the exam-style pass, not built yet.
- **A zero-sum game as a linear programme** (**T30 section 30.2**): it belongs to the game theory chapter.

## Using it

1. Run each stage's level, with the option named, until the class is secure, then move on. The tool's worked solutions use the same layout as the books (the Cambridge style by default; **Tableau Layout** switches to the Oxford style).
2. If a stage is too easy, go to the next level of the same sub-tool, not back: the levels do not overlap.
3. An option button with an asterisk (for example **4 × 4\***, **Ask If Practical\***) is an extension that is unlikely to come up. Leave it for the last.
