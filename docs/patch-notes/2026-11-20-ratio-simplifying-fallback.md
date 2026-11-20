Strand: Maths

## 2026-11-20 — Ratio Manipulation: 1 : n and n : 1 questions no longer fall back to "simplest form"

Branch `claude/great-heisenberg-5a3nko`. Area: `src/tools/Proportion/ratioSimplifying.ts`, `src/tests/ratioManipulation.test.ts`.

- **A rare wrong question fixed.** When a worksheet asked for "Write the ratio in the form 1 : n" or "n : 1" with whole numbers, the generator drew random ratios and gave up after 300 tries; at Level 2 (whose parts are narrow) that happened about once in 10,000 questions and the question silently became "Simplify the ratio" instead. It was also why `ratioManipulation.test.ts` failed now and then in CI. The generator now lists every ratio that can be asked and draws one, so the question is always the kind asked, with the same chance for each ratio as before (measured: 0 misses in 160,000 questions, from about 1 in 8,000 at Level 2). Level 3 (three parts) is unchanged.

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
