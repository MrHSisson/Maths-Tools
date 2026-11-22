Strand: Maths

## 2026-11-21 — Formulating Linear Programmes: "Formulate a problem" Level 2 (chunk F6, part), and the common slip as a step

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lpProblem.ts`, `lpGenL23.ts`, `lpGen.ts`, `lpSolve.ts`, `LpWorking.tsx`, `types.ts` (the `slip` row kind removed), `src/tools/Decision/FormulatingLP.tsx`, the three LP test files, the pathway.

- **The common slip is now a step, not a box in the working area.** The last step of a question is "Common slip", said in plain text in the caption on the right; it adds nothing to the page. In a problem, the slips for the objective and each constraint are one final step, "Common slips".
- **Formulate a problem, Level 2.** The constraints now include percentages, ratios, shares of the total, decimal amounts per item and fixed totals ("exactly"); the profit can be **price minus cost** ("each loaf sells for £14 and costs £6": the working shows 14 − 6 = 8, and the slip is using the price); and the question can say that **only whole numbers of items can be made**, so the model ends "x, y, z are integers" (new option Integers: Say So or Leave Out).
- **Tests:** the problem tests now run at both levels in two, three and four variables (non-empty region, a single best corner, every lattice point checked by the meaning of each sentence, the wording carrying every number, valid KaTeX, the slips in the last step's caption).
- **Deliberately not done:** the rest of Level 2 in the brief (pack variables, unit conversions, per-packet scaling, a single-variable objective, the data as a table), and Level 3 of `problem` (F7). Strict operators are still left out of problems; equalities appear only from fixed totals and "exactly" comparisons.

Agent: Claude Code
Notes: Build Log block "Linear Programming: problem Level 2, slips as a step (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
