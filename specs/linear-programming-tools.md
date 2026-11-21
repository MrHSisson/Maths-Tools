# Linear Programming — the tools, matched to the question styles

**Status:** plan, 2026-11-21 (not a brief; the first build, Formulating, has its own: `specs/linear-programming-formulate.md`). Built from the 57 styles in `specs/corpus/linear-programming-styles.md` (rows L01 to L57, from textbook chapter 4) and the shape of the book itself. Nothing is built.

## 1. One tool or three (this revises decision 1 of the brief)

The brief recommended one Linear Programming tool with six sub-tools. Having read the chapter, **three tools, one per textbook section**, fit better:

| Tool | Textbook | Statements | Course | Why separate |
|---|---|---|---|---|
| **Formulating Linear Programmes** (`lp-formulate`) | section 1, Ex 4A | DD1 | AS, A2 | the biggest skill set (two sub-tools), no graph needed, and it can merge and go live on its own |
| **Graphical Linear Programming** (`lp-graphical`) | section 2, Ex 4B | DD2 | AS, A2 | needs the region picture; all exact vertex arithmetic |
| **The Simplex Algorithm** (`lp-simplex`) | section 3, Ex 4C | DD3, DD4 | A2 only | needs the tableau picture; hidden whole at AS rather than by an option |

Each sits under the Decision hub's DD chapter card (its `toolIds` is empty today). Each sub-tool pairs with exactly one statement (`decisionPairings.test.ts`). All three share one maths core, `src/shared/decision/lp.ts` (exact fractions, vertex enumeration, lattice search, simplex), built before any tool. This costs Harry one decision (section 5).

## 2. Sub-tools and the styles each one takes

`Level 1 to 3` are drafts; the in-depth levels for Formulating are in its own brief. "New" means a style the textbook does not contain but the specification or the brief needs (marked N).

### Tool 1: Formulating Linear Programmes (DD1)

Two sub-tools, two levels each, two to four variables (revised 2026-11-21: the first plan had seven sub-tools, which split one skill, translating a sentence into an inequality, by constraint type, when the exam sets them mixed). The level of the first sub-tool is how direct the constraint is.

| Sub-tool | Skill | Level 1: direct | Level 2: indirect | Styles |
|---|---|---|---|---|
| `constraint` Write a constraint | one constraint (or a pair) from a short situation | resource use (10x + 15y ≤ 300); comparisons (x at least twice y and z combined); differences, bounds, totals | percentages (of a variable, of several combined, of the total); ratios; blends and averages; decimal amounts per item; either-or limits (x/60 + y/45 ≤ 1) | L02, L04, L05, L07, L09 wording, L11, L03, N1 to N5, L60 to L67, L70, L73, L74 |
| `problem` Formulate a problem | variables, objective `P = …`, all constraints, non-negativity, integers, mixed | the Level 1 styles with `P = …` | adds the Level 2 styles, price minus cost, packs, units, table, a remainder, "exactly half" | L01, L02, L05 to L08, L12, L13, L14a, L68, L69, L71, L72 |

Every constraint is written with whole-number coefficients in lowest terms. A third sub-tool, **Test and spot** (L09; N7: which point is feasible, which of three formulations is right), is a later addition.

### Tool 2: Graphical Linear Programming (DD2)

| Sub-tool | Skill | Styles | Notes |
|---|---|---|---|
| `region` Feasible region | draw the lines, shade out (or shade in) and find the exact vertices | L10, L20, L21, L22 | the Shading option; vertices exact, fractions |
| `optimise` Optimise | vertex table or sliding objective line, maximise and minimise | L23 to L27, L31 | decimals and fractions in the coefficients; a given diagram |
| `integer` Integer solutions | the true integer optimum, and the trap | L28, L29, L13b to d | grid of lattice points or the table of greatest y for each x |
| `range` Changing the objective (later) | the values of k where the optimal vertex changes; the edge case | L30 | UNHOMED in the corpus; do after the first three |
| `redundant` Redundant constraints (later) | name them and show why | L32 | UNHOMED; do after the first three |

### Tool 3: The Simplex Algorithm (DD3, DD4; A2)

| Sub-tool | Skill | Styles | Notes |
|---|---|---|---|
| `setup` Set up the tableau | slack variables, the objective row, the initial tableau; the reverse | L40, L41, L42, L44, L54 | the textbook layout (objective row first, no θ column); ≥ rewritten as ≤; minimise as Q = −P (L43 set-up part) |
| `pivot` Pivot | choose the pivot (ratio test) and carry out one iteration | L45, L46, L49 | row operations "row n ± k × NPR"; the zero ratio |
| `solve` Solve to optimality | iterate to the end and give the optimum | L43, L47, L48 | two or three iterations; the first-column option |
| `interpret` Interpret a tableau | read the values; binding constraints; optimal or not | L50, L51, L52, L53, L56 | values from the final column, never the objective row |

### Later passes

| Pass | Styles |
|---|---|
| Exam-style chains from the real papers | L33 (AQA 2015, the graph chain), L57 (AQA 2016, the simplex chain), L55 (a tableau with a parameter k), L12 (the long formulation), L14 |
| Game theory as an LP (DF6) | planned with the game theory chapters; reuses `setup`, `pivot`, `solve` |

Every corpus row has a home except L55 (parametric tableau), which goes to the exam-style pass.

## 3. What the tools share

- **`lp.ts`** (the maths core, no React): exact fractions, `Constraint`, `Objective`, `Model`, feasible-region vertices by pairing boundary lines, lattice search, tableau and pivot. Every answer is re-derived by a different route in tests (brief, section 7).
- **The story library:** one set of contexts (bakery, workshop, farm, café, charity) used by all three tools, so a student sees the same situation formulated, drawn and then run through the simplex.
- **Pictures:** Formulating needs no new picture (a data table; possibly the bar model for "fraction of capacity used"). Graphical needs the region picture; Simplex the tableau picture. Each needs a short reason that it is not one of the eight core representations (`docs/reference/pictures.md`).
- **Chaining:** a problem formulated in Tool 1 carries into Tool 2 and Tool 3 unchanged (same numbers), which is what makes the exam-style pass cheap.

## 4. Order of building

1. `lp.ts` model, fractions and the formulation checks (needed by everything).
2. **Tool 1, Formulating**, in the chunks of its brief (capacity first).
3. `lp.ts` geometry, the region picture, Tool 2.
4. `lp.ts` simplex, the tableau picture, Tool 3.
5. Hub pairings and go-live; exam-style chains; DF6.

## 5. Decision for Harry

Three tools (this plan) or one tool with all sub-tools (the brief)? Recommended: three, because section 1 can merge and go live alone, the simplex is A2-only and hides whole, and the tool tabs stay short. If one tool is preferred, the sub-tool lists above carry over unchanged.
