Strand: Maths

## 2026-11-21 — Formulating Linear Programmes: reachable from the Decision hub; "Formulate a problem", Level 1 (chunk F5), not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/tools/Decision/decisionSpec.ts` (the DD chapter's `toolIds`), `src/shared/decision/lpProblem.ts` (new), `lp.ts`, `lpGen.ts`, `lpSolve.ts`, `src/tools/Decision/FormulatingLP.tsx`, `src/tests/lpProblem.test.ts` (new), the brief's status line and the pathway.

- **The hub.** The Linear programming card (DD) on the Decision hub now lists Formulating Linear Programmes. The tool is still `enabled: false`, so the card shows it, and the link works, only in Developing-tools mode.
- **A second sub-tool, Formulate a problem (Level 1).** The question gives a situation, a profit (or a cost) per item and the limits, and **names no variables**: the student assigns them. The working builds the whole model: the variables, the objective (`P = 16x + 3y + 8z`, or `C = …` to minimise), each constraint worked as in Write a constraint (its working shown while it is written, then kept as one line), non-negativity, and the model in the book's layout ("Maximise P = …, subject to: …"). Each constraint's common slip is shown only with the finished model. Two to four variables.
- **Maximise a profit or minimise a cost** (the Objective option): resource limits (at most) with a profit per item, or amounts that must be supplied (at least) with a cost per item (the dietician setting), plus one direct comparison (a multiple, a difference, a bound or a total).
- **Every model is checked** with the new exact corner-point routines in `lp.ts` (`vertices`, `bestVertices`): the region is not empty, there is a single best corner, and it is a plan that does something, so the same models can feed the graphical tool later. The tests re-check this independently, by the meaning of each sentence at every lattice point.
- **Deliberately not done:** Levels 2 and 3 of `problem` (F6 and F7: price minus cost, packs, unit conversions, integers, a table, remainders, blends, either-or); the Data Shown option; strict inequalities and equalities in a problem (an objective over a region with a strict edge has no best point on the real numbers: they come back with "integers" at Level 2); the brief's `problem` section is still `draft`, so the choices above are mine to confirm.

Agent: Claude Code
Notes: Build Log block "Linear Programming: hub link and Formulate a problem, Level 1 (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
