Strand: Maths

## 2026-11-22 — Venn diagrams, HCF and LCM: planned, and the shared logic built (nothing teachers see yet)

Branch `claude/hcf-lcm-venn-lesson-diz7dz`. Area: `specs/decks/venn-hcf-lcm.md`, `src/shared/venn.ts`, `src/tests/venn.test.ts`, `src/shared/misconceptions.ts`.

- **The plan** (`specs/decks/venn-hcf-lcm.md`): one continuous deck, 46 slides in stage 1. A short intro of full-screen draggable Venns (words, then numbers), then prime factors in a Venn, then HCF (multiply the middle), then LCM (multiply everything), with the factorisations always given and no trees. Questions are projected full-width and worked on the board; the HCF and LCM questions have a one-line answer reveal; two printed Venn worksheets. Stage 2 (the combinations, trees) is listed, not planned.
- **Shared logic built** (`src/shared/venn.ts`): splits two numbers' prime factors into left, middle and right (repeats matched one for one), gives the HCF and LCM, the answer lines ("HCF = 2 × 3 = 6"), the factor-list Venn, and flags for which pairs catch which trap. Tested for every pair from 2 to 130 and for the plan's candidate pairs.
- **Seven new misconception tags** (`venn-*`), and the prime tiles take the factor tree's colours, so the Venn and the tree agree.
- **Deliberately not done:** the Venn slide element and its draggable cards, the Venn worksheet print format, the deck itself, the dashboard Review (no tool changed). No task or pathway added: that waits for Harry.

Agent: Claude Code
Notes: Maths Tools — Handoff block "claude/hcf-lcm-venn-lesson-diz7dz" (Build Log block to be added when the element lands).
