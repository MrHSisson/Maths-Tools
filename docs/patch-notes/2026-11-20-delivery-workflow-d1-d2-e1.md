Strand: Maths

## 2026-11-20 — Delivery workflow, steps D1, D2 and E1: lighter startup docs and a maths check

Branch `claude/great-heisenberg-5a3nko`. Area: `CLAUDE.md`, `docs/reference/` (new `building-a-tool.md`, `decks-building.md`, `decks-editor.md`, `decks-text-and-print.md`), `docs/pathways/delivery-workflow.md`.

- **Less to read at the start of every session.** `CLAUDE.md` is 30 KB instead of 40 KB (the build-a-tool how-to moved to `docs/reference/building-a-tool.md`), and the 83 KB decks reference is four topic files, each with its own "Read when", so a deck session reads the part it needs. No rule was dropped (the docs test checks every rule id is still tagged).
- **Token baseline recorded** (the cost of a long session is the conversation re-read each turn, not file reading, so no code-graph tool was added).
- **Solving Trig Equations spot-checked in Wolfram:** 12 generated questions across all three levels, in degrees and radians, matched an independent `Solve` over the stated range.

Agent: Claude Code
Notes: Build Log block not yet written.
