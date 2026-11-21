# Linear Programming — the tools, matched to the question styles

**Status:** plan, 2026-11-21 (not a brief; the first build, Formulating, has its own: `specs/linear-programming-formulate.md`). Built from the 57 styles in `specs/corpus/linear-programming-styles.md` (rows L01 to L57, from textbook chapter 4) and the shape of the book itself. Nothing is built.

## 1. One tool or three (this revises decision 1 of the brief)

The brief recommended one Linear Programming tool with six sub-tools. Having read the chapter, **three tools, one per textbook section**, fit better:

| Tool | Textbook | Statements | Course | Why separate |
|---|---|---|---|---|
| **Formulating Linear Programmes** (`lp-formulate`) | section 1, Ex 4A | DD1 | AS, A2 | the biggest skill set (seven sub-tools), no graph needed, and it can merge and go live on its own |
| **Graphical Linear Programming** (`lp-graphical`) | section 2, Ex 4B | DD2 | AS, A2 | needs the region picture; all exact vertex arithmetic |
| **The Simplex Algorithm** (`lp-simplex`) | section 3, Ex 4C | DD3, DD4 | A2 only | needs the tableau picture; hidden whole at AS rather than by an option |

Each sits under the Decision hub's DD chapter card (its `toolIds` is empty today). Each sub-tool pairs with exactly one statement (`decisionPairings.test.ts`). All three share one maths core, `src/shared/decision/lp.ts` (exact fractions, vertex enumeration, lattice search, simplex), built before any tool. This costs Harry one decision (section 5).

## 2. Sub-tools and the styles each one takes

`Level 1 to 3` are drafts; the in-depth levels for Formulating are in its own brief. "New" means a style the textbook does not contain but the specification or the brief needs (marked N).

### Tool 1: Formulating Linear Programmes (DD1)

| Sub-tool | Skill (one sentence) | Styles | Notes |
|---|---|---|---|
| `objective` Variables and objective | define the variables with units, write the objective and say maximise or minimise | L01; L13 (pack units); part of L02 | profit is price minus cost; a variable that counts packs, not items |
| `resources` Resource limits | write a "uses per item, amount available" constraint | L02, L04 | units conversion; data as a table |
| `capacity` Either-or limits | "at most 60 of A or 45 of B" becomes x/60 + y/45 ≤ 1, then 3x + 4y ≤ 180 | L03; N1 to N5 (the styles in the Formulating brief) | the first priority of Harry's; the book has one example and no exercise |
| `relations` Relationships | "at least twice as many", percentages, ratios, "no more than" | L05, L07, L11 | the reversed-inequality error; test a number |
| `remainder` Totals and remainders | the unused part of a total becomes a variable eliminated by substitution | L06, L08, L12b | objective gains a constant; three variables reduced to two |
| `model` Full formulation | the whole problem: variables, objective, every constraint, non-negativity and integers | L01 to L08, L12a, L13a, L14a, N6 | the chain Harry's students meet; built last, from the parts above |
| `check` Test and spot | is this point feasible; which of three formulations is right and what is wrong with the others | L09; N7 (the Work it out 4.1 shape, for formulations) | the misconceptions made visible |

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
