# The Simplex Algorithm (DD3, DD4; A-level) — plan

**Status:** `draft`. Nothing is built. This is the plan for the third tool of the Linear Programming family (`specs/linear-programming-tools.md`, Tool 3), written on 2026-11-21 after the Formulating tool (F0 to F7) was built. It answers two worries of Harry's: **(1)** random generation will give horrific numbers, unlike the questions in the books; **(2)** the answers must look like the answers the books and the exams give. Sections 2 and 3 are those two answers; sections 4 to 9 are the tool built around them.

**Read first:** `specs/linear-programming.md` section 9a (what the first textbook settled), `specs/corpus/linear-programming-styles.md` (rows L40 to L57, and the new rows L77 to L87 from the second textbook), `docs/pathways/linear-programming.md`. **Sources** (copyright, never committed): the first textbook (Cambridge chapter 4, section 3) and, new today, **the Oxford chapter 30, "Linear programming and game theory 2"** (34 pages, uploaded by Harry; section 30.1 simplex, Exercises 30.1A and 30.1B, worked Examples 1 to 4, section 30.2 games as LPs, summary, review and the Assessment). It is recorded in `specs/sources.md`. Nothing from either book is copied here: the numbers in this plan are ours, or statistics about the books' numbers.

---

## 0. The plan in one page

**The numbers.** A random linear programme is almost always ugly. Measured today (480 000 random draws, exact fractions, the textbook's own method): with coefficients 1 to 8 and no further care, only **about 3%** of two- and three-variable problems keep every number in every tableau to a denominator of 5 or less, and under 1% keep it to 3. Textbook tableaux sit at denominators 2, 3, 4, 5 (occasionally 8), and their optima are mostly whole numbers. So the generator will not draw a problem and hope. It will **design the answer first** (the optimal point, which constraints are binding, a dual) and build the objective and the right-hand sides from it, so the optimum is whole by construction, **then run the real algorithm on it and keep it only if every tableau on the way is nice** (a "niceness budget", section 2.3). Measured: that keeps **23% to 39%** of draws at denominator ≤ 5 (up to 32% at ≤ 3 with small coefficients), the optimum is whole in every one, and 3-variable problems take 2 to 4 iterations like the books'. It is a rejection loop over microsecond runs, so cost is nothing. A fixed bank of hand-checked problems backs it up, and a test measures the numbers of every generated problem.

**The answers.** The model answer is not "the optimum"; it is the **page a student writes**: standard form with slack variables, the initial tableau, the pivot with its θ-values and the reason, each iteration with its row operations written ("R5 = R1 + 8 × R6"), the optimality sentence, the **full reading-off** (every variable, slack included, and P, from the value column), and the **statement in context with units and what each slack means**. Both books do it this way, and the exam's mark scheme pays for each of those lines (section 3). The layout of the two books differs a little, so it is an option, and the working is built from one exact simplex that is independently re-derived.

**Build order:** S0 a numbers study and the exact simplex core (no UI), S1 `setup`, S2 `pivot`, S3 `solve`, S4 `interpret`, S5 the non-standard starts (≥ constraints, minimise, lower bounds, equalities), S6 go-live; the exam-style pass and Games as LPs (DF6) after. Eight decisions for Harry are in section 9.

---

## 1. What the two books settle

**AQA.** DD3: use the simplex algorithm for maximising and minimising an objective including slack variables. DD4: interpret a simplex tableau. A2 only (the whole tool is hidden at AS rather than by an option).

**Both books agree on:** the method (standard form with slack variables; objective row `P − … = 0`; the most negative objective-row entry gives the pivot column; θ-values over the positive entries of that column, smallest gives the pivot row; divide the pivot row by the pivot, then clear the column; stop when the objective row has no negative entry); **exact fractions in the working, never decimals** (the Oxford book says so as a margin note); minimising by maximising `P = −C`; a ≥ constraint rewritten as ≤ by multiplying by −1; ties in θ chosen at random (so the answer must not depend on it); the value of P read from the value column; slack variables as the unused part of a resource.

**They differ in layout and in some content:**

| | Cambridge (first book) | Oxford (second book) |
|---|---|---|
| Columns | P, the variables, the slacks, right-hand side (header blank) | the same, with a **Basic variable** column on the left and a **Value** header |
| Working column | none: the row operation is written beside the table | a **Row** column on the right: R1, R2, R3 at the start; each new row is the next number, with its definition, "R5 = R1 + 100 × R6", "R6 = R2 ÷ 5" |
| θ-values | in the working beside the table ("8 ÷ 1 = 8, …") | in the working, one per positive entry: "R2: 60 ÷ 3 = 20, R3: 40 ÷ 1 = 40", and the pivot is highlighted in the table |
| Row operations | "new pivot row (NPR) = pivot row ÷ pivot", then "row n ± k × NPR" | "divide R3 by 2", "subtract 3 × R6", "add 8 × R6" and the Row column |
| Slack names | s, t, u … (or s₁, s₂) | **s, t, u** with x, y; **r, s, t** with x, y, z (Assessment); s₁ … in the game tableau |
| Starting at a point that is not the origin | "≥ rewritten as ≤" | the same, and then: **pivot on a negative coefficient in the row with the negative right-hand side** (before the algorithm proper) to reach a first basic feasible solution |
| Other methods shown | the first-pivot-column investigation (the optimum does not change) | **lower-bound substitution** (X = x − 10); **equality constraints** (eliminate a variable, or two inequalities); a student who **miscopies** a constraint and meets an infeasible or unbounded problem |

**What the exercises ask, in shape** (new rows L77 to L87 of the corpus): write the equations with slack variables and name the slack; rewrite the objective as an equation in them; set up the tableau; one iteration with the pivot justified; two iterations; solve to the end; read a tableau (state every variable and the optimum); say what each slack means in the story (with units, after undoing any simplification of the constraints); say why the optimum is **not practical** (a fraction of a box) and find a practical plan; reverse (tableau to formulation); decimal-per-unit tables (juices, sauces) simplified to integer coefficients; a non-standard start; error analysis. The Assessment questions carry marks that show the structure of an exam answer (section 3.1).

---

## 2. The numbers problem

### 2.1 Why random is horrific, and what controls it

Every entry of every tableau of a problem `Ax ≤ b` is a ratio of two determinants taken from the constraint matrix with the identity next to it (a minor of `[A | I]`). The **denominator divides the determinant of the basis the algorithm is in**; the first tableau has determinant 1, and each pivot changes one column. So **a pivot on 7 puts sevenths in the table**, and a pivot after a pivot multiplies the trouble. Random coefficients make large, mixed determinants, so denominators of 7, 11, 13, 29 appear in the second and third tableaux, and the student cannot do arithmetic like that by hand. The books avoid it by choosing problems whose path stays at determinants 1, 2, 3, 4, 5.

**What was measured today** (Python, exact `Fraction`s, textbook method: most negative column, smallest θ; rejected if a tie occurred or the problem finished in one iteration; right-hand sides drawn from round values; objective coefficients 1 to 9). The figure is the share of **all** draws whose every tableau, including the value column and the objective row, has every denominator at most *d*:

| Size | Coefficients | ≤ 3 | ≤ 5 | ≤ 6 | ≤ 12 |
|---|---|---|---|---|---|
| 2 variables, 2 constraints | 1 to 8 | 0.6% | 2.8% | 4.7% | 12.0% |
| 2 variables, 3 constraints | 1 to 8 | 0.3% | 1.6% | 3.1% | 9.3% |
| 3 variables, 3 constraints | 1 to 8 | 0.4% | 2.8% | 5.0% | 13.8% |
| 3 variables, 3 constraints | 0 to 5 (sparse, small) | 8.0% | 19.2% | 21.9% | 31.9% |

So **small, sparse coefficients (0 to 5, many 0s and 1s) matter more than anything else**, and the books' constraints really are like that (`x + 3z ≤ 30`, `2x + y ≤ 40`).

**Rejecting after the fact is cheap but low-yield; designing first is better.** The measured comparison for the same sizes with small coefficients (0 to 5):

| Method | Size | Usable | Denominators ≤ 3 | ≤ 5 | ≤ 12 | Optimum |
|---|---|---|---|---|---|---|
| draw everything, filter | 3 × 3 | 41.0% | 8.0% | 19.2% | 31.9% | any fraction |
| **design the optimum, then filter** | 3 × 3 | 59.6% | 7.3% | **22.9%** | 39.8% | **always whole** |
| design, coefficients 0 to 3 | 3 × 3 | 44.3% | **22.0%** | 28.1% | 42.0% | always whole |
| design, coefficients 0 to 5 | 2 × 2 | 53.7% | 16.5% | **39.0%** | 49.1% | always whole |
| design, coefficients 0 to 3 | 2 × 3 | 41.1% | **32.2%** | 36.0% | 41.2% | always whole |

(Every figure is a share of all draws; every problem kept has 2 or 3 iterations, rarely 4, as in the books. "Usable" means no tie and at least two iterations. The script is `scripts/lpSimplexNumbersStudy.py`; chunk S0 turns it into a test.) A stricter idea, demanding that **every** square minor of the constraint matrix is small, was also tried and rejected: it is too restrictive (3 × 3 problems with entries up to 7 almost never pass), and the path test below is the one that matters.

### 2.2 What textbook numbers look like (the profile the generator must match)

Taken from the worked examples, the Exercises 30.1A and 30.1B, the Assessment and the first book's chapter (statistics only, no questions copied):

- **Size.** Two variables with two to four constraints; three variables with two to four constraints; one four-variable, four-constraint table (boxes). Three variables with three constraints is the staple of the worked examples and the 10-mark exam question.
- **Coefficients.** Bare problems: whole numbers 0 to about 8, many 0s and 1s, one or two with a negative coefficient. Worded problems arrive as tables of **decimal amounts per unit** (0.01 to 0.6) or amounts that simplify (30x + 50y ≤ 2800 becomes 3x + 5y ≤ 280; 700x + 400y ≤ 40 000 becomes 7x + 4y ≤ 400): the student simplifies first, and the working must undo it at the end.
- **Right-hand sides.** Round: 4 to 170 for bare problems, up to several thousand in context.
- **Iterations.** Two or three for a student to do; exam parts ask "one iteration", then "a second", or give the tableau after a stage.
- **Denominators in tableaux.** 2, 3, 4, 5, with 8 occasionally; shown as mixed numbers (2½, 1⅔, 4⅗, 72½) or fractions.
- **Answers.** The variables are whole in most worked examples; the others are halves, thirds, fifths (22.5 ha and 42.5 ha; ⅓ and 2⅓), and **P is a whole number or a simple fraction even when the variables are not** (8⅓ for a minimum). Slack values are whole or half.
- **Ties and zeros.** A zero in the right-hand side (a zero θ) appears as a deliberate hazard once; ties are never relied upon.

### 2.3 The generation method: design the answer first, then check the path

1. **Pick the size** (variables 2 to 4 and constraints 2 to 4 by level and option) and **a sparse coefficient matrix** `A` from a pool by level (Level 1: entries from `{0, 1, 1, 2, 2, 3}`; Level 2: `{0 … 5}`; Level 3: `{0 … 8}`), at least one positive entry in every column so the region is bounded.
2. **Design the optimum.** Pick the optimal point `x*` (whole numbers 1 to 9 on the basic variables, 0 on the others), which `k` constraints are binding there, and a **dual** `y` (whole numbers 1 to 4 on the binding constraints, 0 on the rest). Then `b = A·x*` on the binding rows and `b = A·x* + (a whole slack)` on the others; the objective is `c = Aᵀy` on the basic variables, and `c = Aᵀy − (1 to 3)` on the others (so no other point ties). The optimum is `x*`, **unique, whole, with whole optimal value `y·b`**, and the slack of each constraint is whole. Reject non-positive data.
3. **Run the real algorithm** (exact fractions, the book's rules: most negative column, smallest θ, earliest on a tie) and **keep the problem only if the niceness budget holds on the whole path:**

| Budget | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Largest denominator in any tableau | 3 | 5 | 6 (8 only in a story) |
| Iterations the student does | 2 | 2 to 3 | 3 to 4 |
| Ties in the pivot column or the θ-values | none | none | none (a zero θ only when the style asks) |
| Largest absolute entry (outside the value column) | 30 | 60 | 120 |
| Entries that are not whole, over the whole path | at most 8 | at most 14 | at most 24 |
| Value column and optimum | whole | whole | whole, or a stated fraction ⅓ ⅔ ½ ⅕ in an "interpret" style |
| The same optimum if the student takes another first column | yes (the book's investigation) | yes | yes |

4. **Dress it in a story last** (section 5): the numbers decide the story's units, never the reverse.
5. **A bank** of 30 hand-checked problems per level (the textbook's shapes with our own numbers) is the fallback if a rare option set leaves too few candidates (the loop gives up after a fixed number of tries and draws from the bank, as `lpProblem` does with its fallback) and the source of the **acceptance examples** the tests reproduce line by line.

### 2.4 Guards (all in the tests, none chance failures)

- **Niceness is tested, not assumed:** for every problem of every level, sub-tool and option set in a seeded run of thousands, the budget of 2.3 holds over every tableau of the working. A second test measures the **distribution** (denominators, entry sizes, iterations, the share of whole optima) against the profile of 2.2, so a generator that drifts towards ugly numbers fails.
- **The algorithm is checked by an independent route:** the optimum equals the best corner point from `vertices`/`bestVertices` (already in `lp.ts`); the optimal value equals the dual objective `y·b`; every basic column is a unit column; the slack of each constraint equals `b − A·x*`; each tableau equals `B⁻¹[A | I | b]` computed directly; and the **same optimum is reached from every first column** (the book's investigation).
- **Every KaTeX string renders**, with fractions as `\frac` and mixed numbers per the option, no `\text` in rows; seeded replay (R45); 30 different questions per level and sub-tool.

---

## 3. The style of answer

### 3.1 The model answer, line by line (what the stepper builds and the printed answer shows)

The Oxford Assessment gives the marks an exam attaches to each line, and the first book's two AQA chains do the same; the order below is what a mark scheme follows.

1. **The problem in standard form** (setup): the objective as `P − 6x − 8y = 0` (or in the first book's `P − … = 0` rows), each constraint as an equation with its slack (`4x + 3y + s = 1500`), the non-negativity of all variables **including the slacks**. If it was given in words, a first line **defines the variables** ("x = number of …", units) and writes the inequalities, simplifying if the data has a common factor (and saying so). *Marks: the formulation, then the slack form.*
2. **The name of the slack variables**, and what they are ("s and t are slack variables: the unused part of each resource"), and the objective rewritten as an equation in them when asked.
3. **The initial tableau**, objective row first, the layout of section 3.2. *Marks: the tableau.*
4. **The pivot, justified.** The pivot column ("most negative entry in the objective row: −8, the y column"), the θ-values written out for the **positive** entries only ("R2: 1500 ÷ 3 = 500, R3: 500 ÷ 2 = 250"), the smallest chosen, the pivot named and highlighted. *Marks: the column, the ratios, the pivot, the reason.*
5. **One iteration**: the new pivot row (pivot row ÷ pivot) first, then each other row as `row ± k × new pivot row`, each written beside the table; the resulting tableau in exact fractions. *Marks: a mark for the pivot row, one per other row, one for the table.*
6. **The test for optimality, said in words:** "there is a negative entry (−2) in the objective row, so this is not optimal; the x column is next", or "there are no negative entries in the objective row, so this is optimal". *Marks: the explanation.*
7. **Reading the tableau** (DD4): the basic variables (a column of 0s and a single 1, in the row they sit in) take their values from the value column; every other variable is 0; **P is read from the value column of the objective row**, not from the coefficients. State **all** variables: "y = 16, x = 12, u = 18, z = 0, s = 0, t = 0, P = 44". *Marks: each value.*
8. **The statement in context**, with units: "maximum profit £6050 by planting 22.5 ha of wheat and 42.5 ha of potatoes", and **what the non-zero slack means** ("t = 72.5 is 7250 kg of fertiliser left over": the units of the original problem, not of the simplified constraint). A zero slack means the constraint is binding ("all the labour is used").
9. **If asked: is it practical?** A fraction of a bag or a box is not ("explain why this solution is not practical", then "find a practical plan with a profit of …"); the working shows the integer search.

The sub-tools (section 4) each own a slice of this list; `solve` puts the whole list together.

### 3.2 Layout, naming and number format (options, not hard-coded)

| Option | Values | Notes |
|---|---|---|
| Tableau Layout | **Textbook A** (the first book: no basic-variable column, row operations beside the table) · **Textbook B** (the second: a Basic variable column, and a Row column R1, R2, … with definitions) | display only; same numbers. **Decision 1.** |
| Slack Names | s, t, u … · r, s, t (with x, y, z) · s₁, s₂ … | display only; with 3 or 4 variables the default avoids a clash |
| Number Format | Fractions · Mixed numbers | display only; the final answer also gives the decimal when it terminates ("22.5 ha") |
| Row Operations | Written beside the table · Hidden (a "show the steps" key) | display only |
| Pivot Column | The most negative entry · Any negative entry (the student's choice, shown) · As the question says | changes the numbers' path, not the optimum (the investigation) |
| Show θ | Working · Table column | display only |

Every row operation is written in the form the book uses and nothing else; row numbers are consecutive (Textbook B). The pivot is highlighted in the tableau it is chosen from. Fractions are exact; a tableau never shows a decimal.

### 3.3 The stock wording (so every answer reads the same, and a marker can find the mark)

- "The most negative entry in the objective row is −8, so the y column is the pivot column."
- "θ-values: R2 1500 ÷ 3 = 500; R3 500 ÷ 2 = 250. The smallest is 250, so R3 is the pivot row and the pivot is 2."
- "There is still a negative entry (−2) in the objective row, so the solution is not optimal: another iteration."
- "There are no negative entries in the objective row, so the solution is optimal."
- "The basic variables are … ; the others are 0. P = … (from the value column)."
- "s = 0 so the first constraint is binding: all of the … is used. t = 72.5 means 72.5 units of … are unused" (with the story's units).
- A **non-standard start**: "the constraint x + y ≥ 2 is written −x − y ≤ −2, so the origin is not feasible: pivot on the −1 in that row to get a basic feasible solution first."
- A **minimise**: "to minimise C, maximise P = −C; the minimum of C is −(the maximum of P)".

### 3.4 Slips the working names (shown with the answer, never before, as a step of their own)

Reading P from the objective row; reading the optimum from the wrong tableau; a ratio taken over a zero or negative entry; choosing the smallest θ **among all rows** instead of the positive entries (shows as a negative value-column entry: "wrong pivot"); the objective row's signs left unflipped (initial tableau); not flipping the sign of every term when moving to `P − … = 0`; the right-hand side of a ≥ constraint left negative; dividing the pivot row but not clearing another row; forgetting that the minimum is −Q; quoting a simplified constraint's slack in the simplified units; "x = 22.5" given as a plan for whole items.

---

## 4. The sub-tools and levels

Four sub-tools on `DecisionShell` (the written working is the picture, as in `lp-formulate`; a new picture, the **tableau** with the pivot highlighted and the row operations beside it, is a small shared component `LpTableau`; section 6). Each sub-tool pairs with one specification statement.

| Sub-tool | Statement | The student | Levels |
|---|---|---|---|
| **`setup` Set up the tableau** | DD3 | rewrite as equations with slack variables, name them, write the initial tableau; the reverse (tableau to formulation, and what s and t mean) | L1 two variables, ≤ constraints, whole coefficients; L2 three variables, a constraint that simplifies, decimals per unit; L3 minimise, a ≥ constraint, a constant in the objective |
| **`pivot` Pivot** | DD3 | choose the pivot with the θ-values and the reason; carry out one iteration; a given tableau | L1 two variables, one iteration; L2 three variables and the zero θ; L3 explain the choice among columns, a second iteration |
| **`solve` Solve to optimality** | DD3, DD4 | iterate to the end and give the full reading and the statement in context | L1 two iterations; L2 three variables, two or three iterations; L3 four constraints, minimise, mixed-number answers |
| **`interpret` Interpret a tableau** | DD4 | read a tableau: optimal or not and why; every variable and P; binding constraints and the meaning of each slack in the story; is it practical | L1 final tableau, whole answers; L2 a mid-run tableau, explain not optimal; L3 a story with units after simplification |

**Non-standard starts (chunk S5, Level 3 of `setup`, `pivot` and `solve`):** a minimise (P = −C); a ≥ constraint (rewrite ≤, then pivot on a negative coefficient in the row with the negative right-hand side to the first basic feasible tableau); a lower bound (substitute X = x − a); an equality (eliminate a variable, or two inequalities). Each is a **Starting Form** pool (a multi-select, default Standard), so the AS-friendly standard case stays clean and the rest is opt-in.

**Options** (draft, in the shell's vocabulary): Variables (Two, Three, Four; multi-select); Constraints (Two, Three, Four); Starting Form (Standard, Minimise, A ≥ Constraint, A Lower Bound, An Equality); Context (A bare problem, A story, A table); Answer Asked (Every Variable, The Optimum Only); the display options of 3.2. Each carries an `info` sentence (R40) and the explainer words (R11).

**Exam-style pass (later, from real papers):** the chains of the Assessment and of AQA 2016 (display in a tableau [2], state and justify a pivot [2], one iteration [4], explain not optimal [1], find the optimum [5]), the "tableau after iteration k given" parts (state the solution and the significance of the slacks), a parametric tableau (L55). Marks and a mark scheme per part, as the Dimensional Analysis and CPA exam views do.

---

## 5. Stories, and linking to Formulating

One set of contexts is shared with `lp-formulate`: bakery, workshop, farm, café, drinks and feeds (blends), a garden centre. The simplex tool needs **numbers that suit the algorithm**, so the story is dressed on the designed numbers:

- The designed constraint `3x + 5y ≤ 280` becomes labour 30 and 50 man-hours per hectare with 2800 available (multiply by 10), or fertiliser 700 and 400 kg per hectare with 40 tonnes available (multiply by 100, and the tonnes-to-kilograms step). The student **simplifies first** (the Formulating tool's tidy rule: whole numbers, lowest terms), the working undoes the scale at the end (a slack of 72.5 is 7250 kg).
- Decimal-per-unit tables (juices, sauces) are generated as the integer constraint ÷ 10, 20, 50 or 100, so the student's tidying gives back the designed integers.
- Profits are the designed objective coefficients times a unit (£1 → £10, £0.25 → pence), so every objective is a whole multiple of a small integer and "P = 6050" is natural.
- A context supplies names, units and the sentence for the slack's meaning ("unused labour", "oats left over"); **no context is chosen that cannot carry the designed numbers**.
- **Integer solutions** (boxes of vegetables, bicycles) come with a designed optimum that is whole in the *original* variables for most questions; a few, in the "interpret" style, are deliberately fractional (22.5 ha) so "is it practical?" has something to say, and a practical neighbour with a stated profit is designed to exist.

---

## 6. The picture and the print

- **`LpTableau`** (shared, in `src/shared/decision/`): a table with the headers and row labels of the chosen layout; the pivot cell highlighted; the new cells of this step in blue; the row operation written beside each new row (as the working-page rows already are in `LpWorking`); fractions drawn with `\frac` or as mixed numbers; it never scrolls (scaled to its panel, as `LpCanvas` does). It is a small new representation; `docs/reference/pictures.md` needs a short reason it is not one of the eight core ones (it is a table whose rows are the working).
- **Phone:** the tableau is the first thing in the question and each step's rows are one open page, like `LpSolution`; tablets and laptops show the picture beside the step.
- **Print:** a worksheet question has the problem and **blank tableau grids** (the number of rows and columns drawn from the designed size, and the layout option), the answer page the finished tableaux, θ-values and statement; the print basket takes it (the tool is a skill-sheet tool).

---

## 7. Tests (every sub-tool and level)

- The niceness budget, the distribution against the profile, the independent verification of the optimum and of every tableau, the same-optimum-from-every-column check (2.4).
- **Acceptance examples reproduced line by line**, from our own bank (numbers chosen to match the *shapes* of the books' worked examples): a two-variable run of two iterations with a mixed-number tableau; a three-variable run of three iterations; a minimise; a ≥ constraint with the first pivot on a negative entry; the zero θ; the story whose slack has units after a ×100 scale.
- Wording: every number of the story is in the tableau and the reverse; the operator and slack names are consistent with the options; no unreplaced slot.
- Standard: every KaTeX string renders; seeded replay; 30 different questions per level and sub-tool; the fallback rate of the designed generator measured and reported.

---

## 8. Build chunks (each merges on its own)

| Chunk | Contents | Behind |
|---|---|---|
| S0 | **The numbers study as a test, and the exact simplex core** in `lp.ts` (`simplexPath(c, A, b)` returning every tableau, pivots and θ-values in `Fr`, with the independent checks of 2.4); the designed generator `lpSimplexGen.ts` (steps 1 to 3 of 2.3) and the niceness budget; the bank skeleton; tests. **No UI, no registry.** The study's script is kept in `scripts/` so the acceptance rates can be re-measured | nothing (library only) |
| S1 | `setup` sub-tool, Levels 1 and 2 (standard form, slack names, the initial tableau, the reverse), `LpTableau`, layout options; About words | `enabled: false` |
| S2 | `pivot` (the θ-values, the reason, one iteration), the zero θ hazard | `enabled: false` |
| S3 | `solve` (the full model answer of 3.1, in context with units), Level 3 sizes | `enabled: false` |
| S4 | `interpret` (read a tableau, binding constraints, meaning of slack, is it practical) | `enabled: false` |
| S5 | Starting Form: minimise, ≥, lower bound, equality; the wording and slips for each | `enabled: false` |
| S6 | the Decision hub's DD3 and DD4 links, spec pairing and tests, the dashboard notes, a real printer check, go-live | the switch |
| later | the exam-style chains and parametric tableaux; **Games as LPs (DF6)** with the game theory chapter (the shape is in corpus L87: add a constant so every payoff is non-negative, `P = v`, the probabilities' sum as one constraint, subtract the constant back) | |

S0 is the chunk that answers worry (1) with data before any interface is built: if the study's acceptance rates fall short for a size, the pools or the budget are adjusted there, not later.

---

## 9. Decisions for Harry

1. **Tableau layout:** the first book's (no basic-variable column, row operations beside the table) or the second's (a Basic variable column and a Row column R1, R2 …)? Proposed: offer both as the option **Tableau Layout**, default the **second book's**, since it is the more explicit and matches the Assessment's marks; or default whichever your class uses.
2. **Slack letters:** s, t, u with every variable count, or r, s, t when the variables are x, y, z? Proposed: r, s, t with three variables, s, t with two (so a letter never clashes with x, y, z), s₁ … with four.
3. **Fractions or mixed numbers** in a tableau by default? Proposed: mixed numbers in the tableau (both books use them), fractions in the working lines, the decimal in the final statement when it terminates.
4. **How much weight on non-standard starts** (≥ constraints, lower bounds, equalities)? Proposed: all four, but only at Level 3 and opt-in (S5), so the standard case is untouched.
5. **Is-it-practical questions:** whole-number plans from a fractional optimum (boxes, bicycles) are a feature of the second book. Proposed: in `interpret` only, with a designed practical neighbour; the simplex itself stays on the real numbers.
6. **Unbounded and infeasible problems** (the error-analysis question) are outside the AQA wording. Proposed: leave to the exam-style pass, if at all.
7. **A numbers floor:** is "no denominator above 5 at Level 2" the right feel for your students? The study makes this a dial, not a rewrite.
8. **Order of build:** S0 first (data before interface), then `setup`, `pivot`, `solve`, `interpret`: as in section 8, or `solve` earlier?

---

## 10. What was taken from the sources (no copyrighted content is here)

From the **Oxford chapter 30** (read in full 2026-11-21): the layout and column conventions (3.1, 3.2), the slack naming, the Row-column notation, the non-standard start (pivot on a negative entry in the negative row), lower-bound substitution, equality handling, the table-driven word problems with simplification, the "explain the slack in the original units" idea, the "not practical" follow-up, the mark structure of the Assessment, and the statistics in 2.2. Its section 30.2 (games as LPs) is DF6 and is only noted. From the **Cambridge chapter 4**: everything already in section 9a of `specs/linear-programming.md` and rows L40 to L57. The numbers in sections 2 and 3 are measured or invented here.
