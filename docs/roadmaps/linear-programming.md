# Linear programming: a roadmap through the tools

**What this is.** A route for a class to follow, in order, through the tools and their levels, the way a class follows a textbook chapter. Each stage says what the students should be able to do, which tool, sub-tool and level to use (with the option that matters), and where to stop for textbook exercises. It is not a deck: the deck for the simplex idea is `lp-simplex-process`, and it fits at stage 6.

**Where the exercise numbers come from.** The stops are taken from the question-style list in `specs/corpus/linear-programming-styles.md`, which records, for each style, the textbook exercise it was seen in. **T4** is the Cambridge chapter 4, **T14** and **T30** the Oxford chapters 14 and 30. The numbers are the ones recorded when those chapters were read; where only part of an exercise was noted it says "includes". **Check them against your own copy before the lesson**, and add the ones I could not see. The two tools are `enabled: false`: use them with Developing tools on.

**The shape.** Formulate (stages 1 to 3) → draw and read the region (stage 4, tool not built yet) → the simplex (stages 5 to 10). Each level is its own set of questions, so a student who is ready for Level 2 never meets a Level 1 question again.

## Part A. Formulating (DD1)

| Stage | Tool, sub-tool, level | Students can… | Textbook stop-off |
|---|---|---|---|
| **1. One constraint** | **Formulating › Write a constraint › Level 1.** Styles: Resource Use first, then Comparisons. Two variables, then three | Write "each loaf uses 15 minutes" as 15x + 10y ≤ 300 in lowest terms, and "x is at least twice y" as x ≥ 2y; say what each letter means | **T4 Ex4A 4** (variables, objective, constraints), worked examples WE4.1 to WE4.3; **T4 Ex4A 1** (which point fits the words); **T4 MP3** (a list of wordy constraints) |
| **2. Constraints from proportions** | **Write a constraint › Level 2.** Tick one style at a time: Percentage Of One Kind, Percentage Of The Total, Ratios (x : y at least 2 : 3), Shares Of The Total, Decimal Amounts, Fractional Amounts. Three variables for Percentage Of Several Kinds | Turn a percentage, a ratio or a decimal per item into a constraint with the letters on both sides (3x ≥ 2y), and clear decimals or fractions | **T4 WE4.5, WE4.6, WE4.4** (percentages, at least twice); **T14 Ex1** (decimal amounts, bounds on sales), **T14 Ex1B 6** ("at least one A to every k B"), **T14 Ex2** (each at least a third of the whole) |
| **3. The whole model** | **Formulate a problem › Level 1**, then **Level 2** (a percentage, a ratio, a decimal, a unit change, a pack or a price minus cost, each question), then **Level 3** (the Situations: Exactly Half, A Remainder, A Relation Between Kinds, Either-Or Limits, A Blend To Minimise). Use Resource Limits to go from one to three limits | Choose variables, write the objective, write every constraint and the non-negativity, say "integers"; when a question says "using only x and y", substitute out the rest; know a blend is the one problem that minimises | **T4 Ex4A 4, 5** (a table of amounts), **T4 WE4.4 (turf), WE4.6** (substituting out a remainder), **T4 MP9** (packs), **T4 MP11** (the AQA 2015 problem), **T14 Ex1B 1 to 7**, **T14 Ex4** (half the sales are type C), **T14 Ex5** (blends) |

**Gate before stage 4:** a student can write a full model from a short story without help.

## Part B. The region (DD2)

| Stage | Tool | Students can… | Textbook stop-off |
|---|---|---|---|
| **4. Draw it, find the best corner** | **Not built yet** (a Graphical tool is planned; see `specs/linear-programming-tools.md`). Use the textbook and the board | Draw each line, shade the feasible region, find the corners, test each corner or slide the objective line, say why a whole-number answer needs a check | **T4 Ex4A 3, 6**, **T4 Ex4B 1 to 3 and 5 to 10** (vertices, sliding line, integers), **T4 MP1, MP4, MP13**, **T14 Ex1A 2, Ex1B 5** |

This stage is the one gap in the tools. The questions that need it are tagged `region` and `optimise` in the corpus.

## Part C. The simplex (DD3, DD4)

The first four stages here use **Level 1**: two variables, the inequalities given in symbols. Then **Level 2** is three variables in words or a table. **Level 3** needs a change of form.

| Stage | Tool, sub-tool, level | Students can… | Textbook stop-off |
|---|---|---|---|
| **5. The start** | **Simplex › Set up the tableau › Level 1**, then **Read a tableau › Level 1** (the optimal tableau) | Add a slack variable to each constraint, write the objective as P − 2x − 3y = 0, write the initial tableau, and read the value of every variable and of P from a tableau | **T4 Ex4C 1** (the initial tableau), **T4 Ex4C 4** (read the values), **T4 MP5** (equations with slack variables), **T30 Assessment 1a** (name the slacks) |
| **6. Why it works** | **The deck `lp-simplex-process`**, with its graph beside the table | Say why the most negative entry is the way to go, what the ratio test is for, what the row operations do, and what the bottom row says when it stops | (the deck's worked problem) |
| **7. One step, then the whole run** | **One pivot › Level 1**, first with **Pivot: Pivot Given** (the row operations only), then the student chooses; then **Solve a problem › Level 1** (two iterations) | Choose the pivot column and row from the θ-values, divide the pivot row, clear the column, and repeat until no negative is left | **T4 Ex4C 2, 5** (choose the pivot), **Ex4C 6** (one iteration), **Ex4C 7** (solve), **T4 WE4.12, WE4.13, WE4.15**; **T4 MP2, MP8** |
| **8. In words, three variables** | **Set up the tableau › Level 2**, **One pivot › Level 2** (part-way through a run), **Solve a problem › Level 2** (a situation in words or a table), **Read a tableau › Level 2** (not yet optimal) | Simplify the constraints, set up from a story, take three iterations, say what a slack variable means in the story with its units, and say why a tableau is not optimal | **T4 Ex4C 8, 9, 10** (context, the meaning of a zero slack), **T4 WE4.14 to WE4.17**, **T4 MP10, MP14**; **T30 Ex30.1A 2, 4**, **Ex30.1B 6, 7** (tables of decimal amounts), **T30 Assessment 4** |
| **9. Whole numbers** | **Is it practical? › Level 1**, **Level 2**, **Level 3** | Say why a fractional optimum cannot be made, find the best whole-number plan (round down; add where there is room; check the bound), and know that rounding to the nearest can break a constraint | **T4 Ex4B 9, 10** and the "common error" after WE4.8 (integers, graphically); **T30 Ex30.1B 8** (boxes of vegetables, not a solution of the original problem) |
| **10. When it does not start at the origin** | **Solve a problem › Level 3** and **Set up the tableau › Level 3**, ticking Starting Form one at a time: Minimise, A ≥ Constraint, A Lower Bound, An Equality; **One pivot › Level 3** (a negative right-hand side); **Method** (Substitute And Split, or Use As Rows); **Read a tableau › Level 3** (the problem the tableau shows) | Minimise by maximising P = −C; rewrite a ≥ constraint and start by pivoting on a negative entry; handle y ≥ 4 by Y = y − 4 or as one more constraint; handle an equation as two inequalities or as a row | **T4 WE4.17, Ex4C 9, MP14** (minimise); **T30 Ex 4, review 3** (a ≥ start); **T30 Ex30.1B 2** (lower bounds), **Ex30.1B 11** (an equality); **T4 MP8, T30 Ex30.1A 2, 4** (from a tableau back to the problem) |

**Gate at the end:** a student can take a worded problem, set it up, solve it by the tableau, state the answer in context with the meaning of each slack variable, and say whether it is practical.

## Not in the tools (use the books)

- **The graphical stage** (stage 4), the parameter k in the objective (**T4 Ex4B 6, MP7, MP12**), redundant constraints (**T4 Ex4A 7, 8**), unbounded and infeasible problems (**T30 Ex30.1B 12**).
- **The full exam chains** (**T4 MP10, MP11** are AQA past-paper questions): the tools build the skills; the chain is the exam-style pass, not built yet.
- **A zero-sum game as a linear programme** (**T30 section 30.2**): it belongs to the game theory chapter.

## Using it

1. Run each stage's level, with the option named, until the class is secure, then do the textbook stop-off. The tools' worked solutions use the same layout as the books (the Cambridge style by default; **Tableau Layout** switches to the Oxford style).
2. If a stage is too easy, go to the next level of the same sub-tool, not back: the levels do not overlap.
3. A stage with an asterisk on an option button (for example **4 × 4\***, **Ask If Practical\***) is an extension that is unlikely to come up. Leave it for the last.
