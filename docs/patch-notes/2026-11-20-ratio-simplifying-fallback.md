Strand: Maths

## 2026-11-20 — A generator that fails now and then is asked again; Ratio Manipulation's fall-backs are marked

Branch `claude/great-heisenberg-5a3nko`. Area: `src/tools/Proportion/ratioSimplifying.ts`, `src/tests/ratioManipulation.test.ts`.

- **The rule.** A generator that fails less than 1 time in 100 is simply asked again: `makeUniqueQ` (every ToolShell tool) now draws again, up to three more times, when a generator throws or returns its fixed fall-back marked `_fallback: true`, and only then keeps the fall-back or throws the last error (so a real fault is still named). At 1 in 100 or more the plan is an authored fall-back bank, and for a generator that fails most of the time a very large authored set or a generator built to pass. Written in `AGENTS.md` and `docs/reference/questions-and-working.md`; `src/tests/fallbackRates.test.ts` (run with `FALLBACK_RATES=1`) measures how often a generator falls back.
- **Ratio Manipulation.** Its fall-backs (Simplifying, Equivalent Ratios, Fraction to Ratio) are marked, so the rare case where Level 2 "1 : n" or "n : 1" gave up (about 1 in 10,000 questions, which showed as "Simplify the ratio" and made `ratioManipulation.test.ts` fail now and then) is redrawn instead of reaching the sheet. Measured over all 36 option settings (20,000 questions each): nothing else falls back, so no reserve bank is needed. The generator's own drawing is unchanged.

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
