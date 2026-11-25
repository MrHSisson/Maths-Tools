Strand: Maths

## 2026-11-25 — Solving Trig Equations: a draggable range bar

Branch `claude/relaxed-cannon-ppjzr2`. Area: `src/shared/types.ts`, `src/shared/components/QOPopovers.tsx`, `src/shared/calibration.ts`, `src/tools/Algebra/SolvingTrigEquations.tsx` (+ `.about.ts`), `src/tools/Algebra/trigEquations.ts`, `src/tests/trigEquations.test.ts`.

- **The four Range buttons are now one bar.** Eleven dots, −4π to 6π, with a handle at each end to drag (or the arrow keys); at least two dots stay on. Quick buttons under the bar jump to 0 to 2π, 0 to 4π, −π to π and −2π to 2π. One range per sheet (it used to mix the ticked ranges). Default 0 to 2π at every level.
- **Wide ranges work.** The cap of 6 solutions now grows with the range (about two per turn of the function), so any bar setting finds questions.
- **A new shared option: `ToolMultiSelect.rangeBar`.** A pool drawn as a bar: its options are the dots, the ticked run is the range, the generator reads the first and last ticked. Saved state, share links, levels and the worksheet builder are unchanged because it is still a multiSelect. Other tools can use it.
- **The range sits on its own line** under the equation (whiteboard, worked example and worksheet).
- Level 1 now also opens on "2 sin θ = 1" so the one fixed range still gives a full 30-question sheet.
- Not done: an old shared link that ticked the previous range ids falls back to 0 to 2π; the Handoff note and dashboard review were not updated (the planner was unreachable this session).

Agent: Claude Code
Notes: Build Log block not written (the planner was unreachable); see this entry.
