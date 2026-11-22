Strand: Maths

## 2026-11-22 — The Simplex Algorithm: a pivot given, and the data as a table, not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `lpSimplexGen.ts`, `lpSimplexSolve.ts`, `src/tools/Decision/SimplexAlgorithm.tsx`, `src/tests/lpSimplex.test.ts`.

- **Pivot Given (corpus L46):** One pivot has a new **Pivot** option, Student Chooses or Pivot Given. When given, the question names the pivot (by column and row, or by column and basic variable in the Oxford layout) and the working goes straight to dividing the pivot row and the row operations, with no column or θ steps. It works with the negative-right-hand-side start too.
- **Data as a table (corpus L80):** the **Wording** option gains **A Table**. A situation's limits, the use of each resource per item and the profit per item are shown in a table beside the question (the picture), and the student formulates, simplifies decimals to whole numbers, and sets up or solves. Levels 2 and 3, Set up, Solve and Is it practical?.
- **Tests:** the pivot the question names is the pivot the working uses (both layouts, three levels); the table holds every limit, use and profit and renders as KaTeX.
- **Decided not to build (exam-style notes):** L85 (mark-style short parts) and L57 (the full exam chain).
- **Not checked:** the table on screen at phone, tablet and laptop width.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Simplex, pivot given and table (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
