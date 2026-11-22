# The Simplex tool against the textbooks (coverage and extras)

**Written 2026-11-22**, after chunks S0 to S5, "Is it practical?" and the tie / degenerate change. Source rows are in `specs/corpus/linear-programming-styles.md` (L40 to L57 from the Cambridge book, L77 to L87 from the Oxford book). Nothing here is copied from a textbook: the rows are our own descriptions of what each exercise asks. The tool is built (`/lp-simplex`, `enabled: false`); this note says what it covers, what it leaves out and what it adds beyond the books. **Extras are listed, not removed.**

## 1. Coverage, row by row

| Row | What the books ask | In the tool | Status |
|---|---|---|---|
| L40 | Slack variables and equations (decimals; a ≥ turned into ≤) | Set up: equations with s₁, s₂; decimals in the worded problems; a ≥ at Level 3 | covered |
| L41 | The objective as P − … = 0; every constraint with the right sign | Set up and Solve show the objective row and the multiplied-by-−1 step | covered |
| L42 | The initial tableau (also its matrix equation) | The tableau yes; the matrix equation is **left out by decision** (2026-11-22: it is another way of writing the same tableau, not a question type for a generator) | decided: not here |
| L43 | Minimise by Q = −P; sometimes with a constant | Minimise at Level 3 (P = −C), the constant only through a lower bound | partly (the books say Q; we say P) |
| L44 | Spot the correct initial tableau among three, name the errors | not built | gap |
| L45 | Choose the pivot, show the ratios | One pivot: the column, the θ-values, the pivot, highlighted | covered |
| L46 | Carry out one iteration **given** the pivot | One pivot always asks the student to choose the pivot as well; a "pivot given" version is not separate | partly |
| L47 | Solve to optimality (two or three iterations), all variables, slack and optimum; build the tableau first | Solve: two to four iterations, the tableau built first, every variable, slack and P | covered |
| L48 | A different first pivot column; same optimum | **dropped by Harry (2026-11-22)** | dropped |
| L49 | A zero in a right-hand side (zero ratio) | ties and degenerate problems arise from Level 2, with a note for θ = 0 | covered (extended) |
| L50 to L52 | Read every variable; zero slack means binding; optimal or not | Read a tableau | covered |
| L53 | Deduce from a tableau something about boundedness | not built; **a note for the exam-style pass** (2026-11-22) | exam-style note |
| L54, L83 | From an initial tableau write the problem and say what the slacks mean | Set up, Direction: Tableau To Problem. The slack meaning is generic ("the amount of constraint k not used"), not in a story | partly |
| L55 | A tableau with a parameter k | not built; **a note for the exam-style pass** (2026-11-22) | exam-style note |
| L56, L82 | The output interpreted in the story, units, every slack explained | Solve and Read a tableau with a situation in words | covered |
| L57 | A full exam-style chain | not built (Harry: not today) | gap, by decision |
| L77 | A ≥ start: pivot on a negative entry in the negative row | Level 3, Starting Form: A ≥ Constraint (Set up, One pivot, Solve) | covered |
| L78 | Lower bounds by X = x − a | Level 3, Starting Form: A Lower Bound | covered |
| L79 | An equality: eliminate a variable, **or** two inequalities; compare | the pair of inequalities only; the elimination method is not built | partly |
| L80 | A **table** of decimal amounts, simplified to integers, the amount left over | decimals and a simplification step in worded problems; the data is never shown as a table | partly |
| L81 | Four variables and four constraints; why the optimum is not practical, a practical plan | Level 3 four variables, four constraints; Is it practical? | covered (extended, see below) |
| L84 | Error analysis (infeasible, unbounded) | not built (unbounded left out by Harry) | gap, by decision |
| L85 | Short mark-style parts ("state and explain why this is the pivot") | the steps explain every choice, but the questions are not split into marked parts | gap |
| L86 | Name the slacks and write the objective with them | the equations name the slacks; the objective row is P − 3x − 2y = 0 (checked against the book: not yet) | to check |
| L87 | A game as a linear programme (DF6) | not built, belongs to the game theory chapter | later |

**How comprehensive is it?** The core of DD3 and DD4 in both books is built: set up, pivot, a full run, reading a tableau, the three non-standard starts, the story with units, the reverse direction. What is missing is **presentation styles, not maths**: the data as a table, mark-style short parts, the matrix equation, spot-the-error, the equality-by-elimination method, and (by decision) unbounded, infeasible, parametric and the exam chain.

## 2. What we added or stretched beyond what the books show (flagged; nothing removed)

1. **Is it practical? is a whole sub-tool, with a method the books do not show.** The books ask "explain why this is not practical, find a practical plan" about one problem (L81). We add: the upper-bound argument (a practical plan is a plan of the linear programme; with whole coefficients its value is a whole number; so at most the floor of the optimum), a table of the whole-number points around the optimum, and for three or more fractional variables the "room left" method (round down, then add to the variables whose coefficients total the rise needed). The books' own method may be rounding and testing only. The designed problems always have a practical point that reaches the bound, which real exam questions need not.
2. **Whole Numbers** on Solve and Read a tableau (and the Optimum: Find It First option): ours.
3. **Rounding to the nearest is not safe** notes: ours (a standard teaching point, but not in the exercises we read).
4. **Four variables and four constraints throughout.** The books have one four-variable table (L81); we allow four variables in Set up, One pivot, Solve and Read a tableau at Level 3.
5. **Ties and degenerate problems from Level 2**, built deliberately (one problem in three), with a note that either choice reaches the same optimum. The books have a zero ratio once (L49); ties are not discussed in the rows we read.
6. **Level 1 has no ties and no degenerate problems**; the Level 2 and 3 budgets (denominators, iterations, size of entry) are ours, designed from the denominators the books show.
7. **The θ-values written beside the tableau** (in the working column) rather than in the working underneath. The Cambridge book has no θ column; its ratios are in the working (the Oxford book has a Basic variable column; I did not confirm whether it has a θ column).
8. **Both layouts** (Cambridge NPR, Oxford Row column) as a display option: from the books, but the option and the shared numbering are ours.
9. **Situations in generated contexts** (bakery, print shop, workshop, café, craft stall) with scale factors (×2, ×5, ×10 or decimals) and a simplification step: the idea is the books' (L80), the contexts are ours.
10. **P = −C for minimising** where the Cambridge book uses Q = −P. The idea is the same; the letter differs.
11. **Reverse (Tableau To Problem) in the Set up sub-tool**, with the option label ours.

## 3. To decide with Harry

- Do the extras in section 2 stay as they are? (1 and 2 are the largest.)
- Which gaps in section 1 are wanted next: the data as a table (L80), mark-style parts (L85), a "pivot given" version (L46), spot-the-error (L44), the matrix equation (L42), equality by elimination (L79)?

## 4. Decisions recorded 2026-11-22

- **L53 and L55** are notes for the exam-style pass, not generator questions. **L42** (the matrix equation) has no place in the generator.
- **A standing rule for this tool: no question type may be always the same.** A question type that would be one fixed example (or only ever differ in its numbers) is not built as a generator question; it is a learning aid, or an exam-style note. Variety to check in the built sub-tools: the stem wording, the starting form, the size, whether a tie or a zero θ turns up, and whether the answer is whole.
