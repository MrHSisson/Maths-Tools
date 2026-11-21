Strand: Maths

## 2026-11-21 — Formulating Linear Programmes: "Write a constraint", Level 1 (chunk F1), not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `src/shared/decision/lpGen.ts`, `lpSolve.ts`, `LpWorking.tsx` (new); `src/tools/Decision/FormulatingLP.tsx` (new tool, `/lp-formulate`, `enabled: false`); small edits to `src/shared/decision/types.ts` (the `lp` data field and `lpView` step), `DecisionShell.tsx` (picture height for the `lp` field), `src/registry.ts`, and three test lists (`organisation`, `printBasket`, `localExports`-clean).

- **The tool.** One sub-tool, **Write a constraint**, Level 1: a short situation and the student writes exactly one constraint, in whole numbers and lowest terms. **Resource use** (`10x + 15y ≤ 300`, divided by 5 to `2x + 3y ≤ 60`; minimum-to-meet contexts too) and **direct comparisons** (a multiple of one variable or of several combined, a difference, a bound including "of each", a total), with all five operators (at least, at most, exactly, more than, fewer than) and two, three or four variables. Six settings (bakery, print shop, workshop, café, craft stall, a dietician's meal).
- **The working** is the page a student would write, built a line at a time: the variables; the translation of the words; clearing a fraction, multiplying out brackets, moving everything to the left, multiplying by −1 to put the first coefficient positive (and reversing the sign); a **check** (for resource use, "if only loaves are made"; otherwise a number that fits the words and that the slip does not allow, closest to the boundary); then the constraint boxed with the **common slip** shown only with the answer. A strict operator stays strict, with a note that the boundary is not allowed (and what `x > 15` means for whole numbers).
- **Options:** Variables (Two, Three, Four; tick any) and Constraint Styles (Resource Use, Comparisons). Skill worksheets print with the print basket.
- **Tests** (`src/tests/lpGen.test.ts`, seeded): the brief's worked examples reproduced line by line; over 3,000 draws, the constraint is tidy, its meaning (from the sentence's own numbers) agrees with its coefficients, the wording carries every number and the operator word, every piece of working renders as KaTeX with no `\text`, the slip is a different constraint that the check point exposes, and 30 questions of a worksheet differ.
- **Checked** at phone, tablet and laptop width in headless Chromium: no console errors; the working fits its panel; the phone shows the whole solution as one page.
- **Deliberately not done:** Levels 2 and 3 (F2 to F4: either-or, percentages, ratios, blends), Working Shown, Data Shown, the `problem` sub-tool; the Decision hub's DD chapter card; the dashboard notes for the new tool; the brief stays `ready` (it is only partly built); a real printer check.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Write a constraint, Level 1 (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
