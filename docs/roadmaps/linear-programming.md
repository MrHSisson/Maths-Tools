# The simplex algorithm: a roadmap through the tools

**What this is.** (The same route is a page at `/lp-roadmap` in Developing-tools mode, with a button for each piece of practice that opens the tool on the right sub-tool, level and option; the stages are data in `src/tools/Decision/SimplexRoadmap.tsx`, so keep the two in step.) A route for a class to follow, in order, through the simplex tools and their levels, the way a class follows a textbook chapter. Each stage says what the students should be able to do, which sub-tool and level to use (with the option that matters), and where to stop for textbook exercises. It is not a deck: the deck for the idea is `lp-simplex-process` and it is stage 2.

**Assumed.** Formulating is done: students can write a model (objective, constraints, non-negativity) from a story, and can draw a region and read its corners. This roadmap starts at the slack variables.

**Where the exercise numbers come from.** The stops are taken from the question-style list in `specs/corpus/linear-programming-styles.md`, which records, for each style, the textbook exercise it was seen in. **T4** is the Cambridge chapter 4, **T30** the Oxford chapter 30. The numbers are the ones recorded when those chapters were read; where only part of an exercise was noted it says "includes". **Check them against your own copy before the lesson**, and add the ones I could not see. The tool (`/lp-simplex`) is `enabled: false`: use it with Developing tools on.

**The shape.** Each level is its own set of questions, so a student who is ready for Level 2 never meets a Level 1 question again. Level 1 is two variables with the inequalities given; Level 2 is three variables in words or a table; Level 3 needs a change of form.

| Stage | Tool, sub-tool, level | Students can… | Textbook stop-off |
|---|---|---|---|
| **1. The start** | **Set up the tableau › Level 1**, then **Read a tableau › Level 1** (the optimal tableau) | Add a slack variable to each constraint, write the objective as P − 2x − 3y = 0, write the initial tableau, and read the value of every variable and of P from a tableau | **T4 Ex4C 1** (the initial tableau), **T4 Ex4C 4** (read the values), **T4 MP5** (equations with slack variables), **T30 Assessment 1a** (name the slacks) |
| **2. Why it works** | **The deck `lp-simplex-process`**, with its graph beside the table | Say why the most negative entry is the way to go, what the ratio test is for, what the row operations do, and what the bottom row says when it stops | (the deck's worked problem) |
| **3. One step, then the whole run** | **One pivot › Level 1**, first with **Pivot: Pivot Given** (the row operations only), then the student chooses; then **Solve a problem › Level 1** (two iterations) | Choose the pivot column and row from the θ-values, divide the pivot row, clear the column, and repeat until no negative is left | **T4 Ex4C 2, 5** (choose the pivot), **Ex4C 6** (one iteration), **Ex4C 7** (solve), **T4 WE4.12, WE4.13, WE4.15**; **T4 MP2, MP8** |
| **4. In words, three variables** | **Set up the tableau › Level 2**, **One pivot › Level 2** (part-way through a run), **Solve a problem › Level 2** (a situation in words or a table), **Read a tableau › Level 2** (not yet optimal) | Simplify the constraints, set up from a story, take three iterations, say what a slack variable means in the story with its units, and say why a tableau is not optimal | **T4 Ex4C 8, 9, 10** (context, the meaning of a zero slack), **T4 WE4.14 to WE4.17**, **T4 MP10, MP14**; **T30 Ex30.1A 2, 4**, **Ex30.1B 6, 7** (tables of decimal amounts), **T30 Assessment 4** |
| **5. Whole numbers** | **Is it practical? › Level 1**, **Level 2**, **Level 3** | Say why a fractional optimum cannot be made, find the best whole-number plan (round down; add where there is room; check the bound), and know that rounding to the nearest can break a constraint | **T4 Ex4B 9, 10** and the "common error" after WE4.8 (integers, graphically); **T30 Ex30.1B 8** (boxes of vegetables, not a solution of the original problem) |
| **6. When it does not start at the origin** | **Solve a problem › Level 3** and **Set up the tableau › Level 3**, ticking Starting Form one at a time: Minimise, A ≥ Constraint, A Lower Bound, An Equality; **One pivot › Level 3** (a negative right-hand side); **Method** (Substitute And Split, or Use As Rows); **Read a tableau › Level 3** (the problem the tableau shows) | Minimise by maximising P = −C; rewrite a ≥ constraint and start by pivoting on a negative entry; handle y ≥ 4 by Y = y − 4 or as one more constraint; handle an equation as two inequalities or as a row; go from a tableau back to the problem | **T4 WE4.17, Ex4C 9, MP14** (minimise); **T30 Ex 4, review 3** (a ≥ start); **T30 Ex30.1B 2** (lower bounds), **Ex30.1B 11** (an equality); **T4 MP8, T30 Ex30.1A 2, 4** (from a tableau back to the problem) |

**Gate at the end:** a student can take a worded problem, set it up, solve it by the tableau, state the answer in context with the meaning of each slack variable, and say whether it is practical.

## Not in the tools (use the books)

- The parameter k in the tableau (**T4 MP12**), a tableau that shows unboundedness (**T4 MP6**), and a miscopied number that makes the problem infeasible or unbounded (**T30 Ex30.1B 12**): left for the exam-style pass.
- **The full exam chains** (**T4 MP10, MP11** are AQA past-paper questions): the tools build the skills; the chain is the exam-style pass, not built yet.
- **A zero-sum game as a linear programme** (**T30 section 30.2**): it belongs to the game theory chapter.

## Using it

1. Run each stage's level, with the option named, until the class is secure, then do the textbook stop-off. The tool's worked solutions use the same layout as the books (the Cambridge style by default; **Tableau Layout** switches to the Oxford style).
2. If a stage is too easy, go to the next level of the same sub-tool, not back: the levels do not overlap.
3. An option button with an asterisk (for example **4 × 4\***, **Ask If Practical\***) is an extension that is unlikely to come up. Leave it for the last.
