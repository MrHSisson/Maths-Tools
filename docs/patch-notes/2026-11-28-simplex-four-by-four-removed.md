Strand: Maths

## 2026-11-28 — Simplex: Read a tableau in context at both levels; 4 × 4 removed

Branch `claude/sleepy-keller-ntgciq`. Area: `src/tools/Decision/SimplexAlgorithm.tsx`, `src/shared/decision/lpSimplexGen.ts`, `lpSimplexSolve.ts`, `src/tests/lpSimplex.test.ts`, `docs/roadmaps/linear-programming.md`.

- **Read a tableau can be in context at both levels** (new Wording option: inequalities, a situation, a table). Reading a tableau gives the whole situation, and the working says each slack variable in its words ("40 hours of labour is not used"). Writing the problem from a tableau names the quantities in order ("the limits on labour, paint and timber, in that order"), and the working says what each variable and each slack stands for. This had been lost when Read a tableau went to two levels.
- **4 × 4 is removed everywhere.** The Size option is now only 2 × 2 or 2 × 3 at Level 1; Levels 2 and 3 are three variables and three constraints. The generator no longer draws four variables. Read a tableau's own Size is 2 × 2 or 3 × 3.
- **AGENTS.md:** an agent ends every push with the branch's Vercel preview link.

Agent: Claude Code
Notes: no planner Build Log block yet for this session (to add).
