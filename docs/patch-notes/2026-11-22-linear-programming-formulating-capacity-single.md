Strand: Maths

## 2026-11-22 — Formulating: fractions of capacity only; the single aim is off by default, not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `lpGenL23.ts`, `lpGen.ts`, `lpProblem.ts`, `lpSolve.ts`, `src/tools/Decision/FormulatingLP.tsx`, the Formulating tests.

- **Capacity Method is gone.** Harry: keep the fractions of capacity ("one loaf uses 1/60 of the oven…", then multiply by the lowest common multiple); remove the common-units route. The either-or working is now always fractions, the option, the "Both" choice and the common-units step are removed.
- **Single Aim** (some questions only ask to make as many of one kind as possible) is now an option on Formulate a problem, Levels 2 and 3: **Left Out** (the default) or **Included\***. It comes from one exercise in the Oxford chapter 14, so it is left out unless asked for. Tests: never drawn by default, drawn when included.

Agent: Claude Code
Notes: Build Log block "Linear Programming: fractions only and the single aim (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
