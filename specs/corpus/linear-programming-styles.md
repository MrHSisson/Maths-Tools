# Corpus: Linear Programming (chapter DD) — running list of question styles

**Status:** first fill, 2026-11-21, from the textbook chapter Harry sent (Chapter 4 "Linear programming": sections 1 to 3, Exercises 4A to 4C, Work it out 4.1, Mixed practice 4). Past papers still to add. Add rows whenever a source shows a style; do not delete rows.

**Purpose.** Same as the Further Mechanics list (`specs/corpus/mechanics-mc-question-styles.md`): record each *style* (the shape of a question, never its wording or numbers) so that sub-tools can be formed from the styles and every worked example and exercise question has a home. See `specs/linear-programming.md` section 9 for what the textbook settled.

**Rules.** Shapes only. One row per style. `Home` is a sub-tool key (`formulate`, `region`, `optimise`, `setup`, `pivot`, `interpret`) or `UNHOMED` while none covers it; when several UNHOMED rows share a skill, propose a sub-tool.

**Correction, 2026-11-21.** Section 1 of the chapter and Mixed practice 11 carry no A-level marker, so three-variable formulation (L08) and the 2015 chain (L12, L33) are AS content. Only section 3 and the Y2-marked Mixed practice questions are A2.

**Sources.**
- **T4**: the Cambridge textbook (A-Level Further Mathematics for AQA Discrete Student Book, Year 1 & 2), chapter 4 Linear programming (WE = worked example, Ex = exercise question, MP = Mixed practice question). Y2 marks A-level only content (section 3 and the Y2 MP questions); sections 1 and 2 are AS and A-level.
- **AQA**: two Mixed practice questions are marked as AQA past-paper questions (2015, 2016): shapes recorded below as chain patterns for the later exam-style pass.

## Formulate (DD1)

| ID | Style (shape only) | Source | Stmt | AS/A2 | Home |
|---|---|---|---|---|---|
| L01 | Choose variables for a worded two-variable problem (state what each letter means, with units when appropriate), then write the objective and say maximise or minimise | T4 WE4.1a,b; Ex4A 4a | DD1 | AS | formulate |
| L02 | Write every constraint from a context where each item uses a fixed amount of a limited resource (length and mass; fruit and water; mixing and finishing time), plus non-negativity and (when items are whole) "integers" | T4 WE4.1c, WE4.3; Ex4A 4b | DD1 | AS | formulate |
| L03 | A resource constraint given only as "enough for A or for B" (a ratio of capacities), turned into a single inequality by assuming a number of units | T4 WE4.3 (the filling) | DD1 | AS | formulate |
| L04 | Constraints given in a table of quantities used per unit and amounts available (five ingredients, two products) | T4 Ex4A 5 | DD1 | AS | formulate |
| L05 | "At least" and "at least twice as" relations between two quantities (one of them a lower bound, one a ratio) | T4 WE4.4 | DD1 | AS | formulate |
| L06 | A remainder variable eliminated by substitution (the third use of the total is the total minus the other two), so the objective is written in two variables with a constant | T4 WE4.4 (turf cost); WE4.6b (sleep time) | DD1 | AS | formulate |
| L07 | Percentage constraints on shares of a total (a range of percent of calories; a minimum percent of study time), turned into linear inequalities | T4 WE4.5, WE4.6 | DD1 | AS | formulate |
| L08 | Three-variable formulation, then the same problem reduced to two variables by using up all the time | T4 WE4.6a,b | DD1 | AS | formulate |
| L09 | Choose which of four points is feasible given a word constraint ("more than three times") | T4 Ex4A 1 | DD1 | AS | formulate |
| L10 | Decide which of four points is NOT in a feasible region given its inequalities | T4 Ex4A 2 | DD2 | AS | region |
| L11 | Write constraints on two variables as inequalities from a short wordy list ("non-negative", "at most", "no more than three times") | T4 MP3 | DD1 | AS | formulate |
| L12 | A problem with a unit change (tonnes against kilograms), several ingredients, a "must make at least" and an extra condition ("exactly half is …") that turns a three-variable set into two variables; show the constraints become the given list | AQA 2015 in T4 MP11a,b | DD1 | AS | formulate |
| L13 | Whole-number packs (loaves and trays of six buns): define variables so the objective is linear in the pack count, then solve and say why the real profit might be lower than the model's | T4 MP9 | DD1, DD2 | AS | formulate, optimise |
| L14 | A problem set up in a recognisable earlier worked context and re-run with changed numbers (the study-and-sleep problem, solved by simplex) | T4 Ex4C 10 | DD1, DD3 | A2 | formulate, setup |

## Draw the region and optimise (DD2)

| ID | Style (shape only) | Source | Stmt | AS/A2 | Home |
|---|---|---|---|---|---|
| L20 | Draw the feasible region for a list of constraints by shading out the unwanted regions; the feasible region is the unshaded part; plot each line from two points (including a vertical or horizontal line and a line given by a ratio) | T4 WE4.2; Ex4A 3 | DD2 | AS | region |
| L21 | Plot a region for two constraints on a grid with the feasible region shaded (not shaded out): the same skill drawn the other way round | T4 WE4.7a | DD2 | AS | region |
| L22 | Find the exact vertices of the feasible region by solving adjacent boundary lines (fractions or exact decimals), from the list of borders | T4 WE4.8; Ex4B 5; Ex4A 6 | DD2 | AS | region |
| L23 | Optimise by testing every vertex, written in a table of vertex and objective value | T4 WE4.8; Ex4B 2, 3; MP1, MP4a | DD2 | AS | optimise |
| L24 | Optimise by a sliding objective line (two dashed lines at two objective values, arrow of increasing objective), either to find the optimal vertex or to read it off a given diagram | T4 WE4.7a; Ex4B 1 (minimise, diagram given) | DD2 | AS | optimise |
| L25 | Minimising objective on a given region (smallest value at a vertex); an objective with a negative coefficient | T4 Ex4B 1; MP4b | DD2 | AS | optimise |
| L26 | Optimal vertex is given; compute the optimal value of the objective at it | T4 Ex4B 2 | DD2 | AS | optimise |
| L27 | Solve a problem with fractional constraint coefficients (and one with decimal coefficients) | T4 Ex4B 7, 8; MP13 | DD2 | AS | optimise |
| L28 | Integer solution: the optimum at a non-integer vertex; check nearby lattice points, either by a grid of integer points on the region or by listing the greatest feasible y for each integer x and the objective value, to identify the true integer optimum | T4 WE4.8, WE4.9; Ex4B 9, 10 | DD2 | AS | optimise |
| L29 | The trap: with an objective gradient close to a boundary's gradient the best integer point is not next to the optimal vertex | T4 Common error after WE4.8 | DD2 | AS | optimise (built into level 3) |
| L30 | The objective's coefficient is a parameter k: for what range of k does the optimal vertex change; the value of k where an edge becomes optimal (more than one optimal vertex) | T4 WE4.7b; Ex4B 6; MP7 | DD2 | AS | UNHOMED (propose a later `range` sub-tool, or an extension of `optimise`) |
| L31 | A constraint or the objective is changed and the problem is re-solved (new vertices, new optimum) | T4 WE4.7c | DD2 | AS | optimise |
| L32 | Redundant constraints: name them from a formulation and explain algebraically why they do not matter; for what values of a parameter a constraint is redundant; find the vertices in terms of that parameter | T4 Ex4A 7, 8 | DD2 | AS | UNHOMED (propose a `region` extension or a later `redundant` sub-tool) |
| L33 | Full AQA-style chain: write four constraints, show the changed set, draw them on given axes and label the region R, write the objective in two variables, find the best point by an objective line, state the profit and the amount of each product | AQA 2015 in T4 MP11 | DD2 | AS | exam-style pass (later) |

## Simplex (DD3, DD4; A-level only)

| ID | Style (shape only) | Source | Stmt | AS/A2 | Home |
|---|---|---|---|---|---|
| L40 | Rewrite ≤ constraints as equations with slack variables (non-negative); sometimes with decimal coefficients and with a ≥ constraint that must first be turned into ≤ | T4 WE4.10; MP5 | DD3 | A2 | setup |
| L41 | Write the objective in the form P − (linear function) = 0 (sign flip of every coefficient); rewrite each constraint with a non-negative RHS, flipping a ≥ to ≤ where needed; add slack variables | T4 WE4.11 | DD3 | A2 | setup |
| L42 | Write the initial tableau (columns: objective variable P, the variables, the slack variables, the right-hand side, unlabelled; objective row first); also its matrix equation | T4 WE4.11; Ex4C 1 | DD3 | A2 | setup |
| L43 | Minimising: replace the objective with Q = −P, build and solve the tableau, then give the minimum as −(max Q); sometimes with a constant in the objective | T4 WE4.17; Ex4C 9; MP14 | DD3 | A2 | setup, pivot |
| L44 | Spot the correct initial tableau among three candidates and name the errors in the others (sign error in the objective row; wrong sign handling when minimising) | T4 Work it out 4.1 | DD3 | A2 | setup (an error-spotting presentation) |
| L45 | Choose the pivot: most negative objective-row entry for the column, ratio test over positive entries in that column, state the pivot (and show the ratios) | T4 WE4.12; Ex4C 2, 5; MP2, MP8b | DD3 | A2 | pivot |
| L46 | Carry out one iteration given the pivot: divide the pivot row, then replace each other row by a multiple of the new pivot row (written as "row n ± k × NPR") | T4 WE4.13; Ex4C 6; MP8c | DD3 | A2 | pivot |
| L47 | Solve a full problem to optimality (two or three iterations), giving the values of all variables, slack and the optimum; includes a tableau that must be built first | T4 WE4.15, WE4.16; Ex4C 7, 9, 10; MP10, MP14 | DD3 | A2 | pivot |
| L48 | Same problem with a different first pivot column: investigate whether the final tableau changes (it does not) | T4 WE4.16b; Ex4C 8 | DD3 | A2 | pivot (as an option on the run) |
| L49 | A given tableau with a zero in the RHS of a constraint row (zero ratio) | T4 WE4.12; Ex4C 5 | DD3 | A2 | pivot (a Level 2 hazard) |
| L50 | Read off the values of every variable (basic variables from the column of 0s and a single 1 across to the final column; non-basic are 0), and the objective value | T4 WE4.14; Ex4C 4 | DD4 | A2 | interpret |
| L51 | Say what a zero slack value means (the constraint is at its limit, binding) and which constraints are binding | T4 WE4.14, WE4.15, WE4.17; Ex4C 8c; MP10c | DD4 | A2 | interpret |
| L52 | Is this tableau optimal for a maximise problem? (no negative entry in the objective row), with an explanation | T4 Key point 4.8; Ex4C 3 | DD4 | A2 | interpret |
| L53 | From a tableau, deduce without further work something about the maximum (that the objective row has a negative entry so it is not optimal, and what the pivot column would say about boundedness) | T4 MP6 | DD4 | A2 | interpret |
| L54 | Reverse: from an initial tableau write the linear programming formulation it represents (with the objective) | T4 MP8a | DD3 | A2 | setup (a reverse direction) |
| L55 | A tableau containing a parameter k after one iteration: find the pivot used, the optimal solution in terms of k, and k from the optimal value | T4 MP12 | DD4 | A2 | UNHOMED (a parametric tableau; propose to leave to the exam-style pass) |
| L56 | The simplex output of a worded problem interpreted in the original context (hours of study, sleep) | T4 Ex4C 10; Ex4C 8c | DD4 | A2 | interpret |
| L57 | Full AQA-style chain: display the problem in a tableau, identify and justify the pivot, two iterations, interpret and state the slack values | AQA 2016 in T4 MP10 | DD3, DD4 | A2 | exam-style pass (later) |

## Notes for the later exam-style pass

- Both AQA questions in the chapter are multi-part chains: formulate or tableau → iterate → interpret, with the working asked for at each stage; 2015 is a graph chain (constraints, change of constraint, draw, objective, optimum); 2016 is a three-variable simplex chain.
- The textbook itself names these error patterns (use them as misconceptions in working): graph gradients wrong when plotting a line; taking an approximate vertex off a graph; assuming the integer optimum is next to the optimal vertex; wrong pivot element (shows as a negative RHS); reading values from the objective row instead of the final column; sign errors when writing the objective row; forgetting to negate when minimising.
- Past papers 7366 and 7367 Paper 3D and legacy D1 and D2 to be added.

## Second textbook: Oxford, Further Mathematics (AS & A-Level), Chapter 14 "Linear programming and game theory 1" (T14), section 14.1 only (2026-11-21)

The game theory half is ignored. T14 = worked examples 1 to 5 and Exercises 14.1A, 14.1B. Rows added; the first-textbook rows are unchanged.

| ID | Style (shape only) | Source | Stmt | AS/A2 | Home |
|---|---|---|---|---|---|
| L60 | Per-item amounts given as decimals (kg per kg, hours per chair) with a stock or hours available; tidied to whole numbers by a multiplier; two or three variables | T14 Ex1, Ex4 | DD1 | AS | constraint L2 (Decimal Amounts) |
| L61 | Upper limits on sales or demand for each item ("can sell at most …"), and a minimum order for each ("at least … litres of each") | T14 Ex1, Ex5 | DD1 | AS | constraint L1 (bounds) |
| L62 | "Each must get at least a third of the whole" for each variable: a pair of share constraints of the total | T14 Ex2 | DD1 | AS | constraint L2 (fractions, pair) |
| L63 | "At least one A to every k B" where A is one or several variables, and "at least one X to every Y" (a fraction below 1) | T14 Ex1B 6 | DD1 | AS | constraint L1 (multiples, m below 1) |
| L64 | Blend: each source has known percentages of components; the mix must have at least p% of one component (share of the whole mix) | T14 Ex5 | DD1 | AS | constraint L2 (Blends) |
| L65 | Average or concentration over the mix: investments with interest rates, overall at least 8%; drinks with alcohol percentages, at least 20% alcohol | T14 Ex1B 2, 4 | DD1 | AS | constraint L2 (Blends) |
| L66 | Amount of a component in the mix at most or at least a quantity (at most 30 ml of alcohol; at least 100 ml of liquid in all) | T14 Ex1B 2 | DD1 | AS | constraint L2 (Decimal Amounts) and L1 (total) |
| L67 | A fixed total with an equality (each packet contains exactly 60 chews; 50 places filled), and a bound on each type ("no more than 30 of each type") | T14 Ex1B 6, 7 | DD1 | AS | constraint L1 (exactly, each); problem L2 |
| L68 | Per-packet scaling: stock of an ingredient shared over N packets so the per-packet amount is stock ÷ N, with grams and kilograms | T14 Ex1B 7 | DD1 | AS | problem L2 (units) |
| L69 | Capacity of vehicles against people carried (a car carries 5, a minibus 12, 80 to carry), and a limit on drivers capping the number of vehicles | T14 Ex1B 1 | DD1 | AS | problem L1 or L2 (resource ≥, total bound) |
| L70 | Variables are running times at rates per hour ("process 4 tonnes of paper per hour") with a consignment to process: a requirement ≥ | T14 Ex2 | DD1 | AS | constraint L1 (resource ≥), a context with time variables |
| L71 | Objective: cost minimised; profit in pence per item written in pounds; a single-variable objective ("investment in bonds as great as possible") | T14 Ex1, Ex1B 4 | DD1 | AS | problem |
| L72 | "Half of the sales are type C" turns three variables into two (`z = x + y`), the objective and all constraints rewritten by substitution; also "50 places, rewrite to minimise C = 8x + 3y + 600" | T14 Ex4b, Ex1B 6b | DD1 | AS | problem L2 (confirms L06, L08, L12) |
| L73 | A fixed total of land or money is split between two uses, with "no more than 25 in all" and "more than 15 of either type" | T14 Ex1B 5, 4 | DD1 | AS | constraint L1; problem L1 |
| L74 | Strict wording ("more than", "fewer than") and the dotted-boundary convention for < and > | T14 note; T4 Ex4A 1 | DD1, DD2 | AS | constraint (strict operators throughout, decided 2026-11-21, no option); graphical (dotted line) |
| L75 | Graphical: given a formulation (with lower bounds like x ≥ 10), draw the feasible region and one position of the objective line, then find the optimum; check the integer points near the vertex satisfy every constraint (not obvious from the graph) | T14 Ex1A 2, Ex1B 5, Ex4 | DD2 | AS | graphical `region`, `optimise`, `integer` |
| L76 | Graphical edge case: objective line parallel to a boundary, so every point on the boundary is optimal | T14 summary | DD2 | AS | graphical (`range`, later) |
