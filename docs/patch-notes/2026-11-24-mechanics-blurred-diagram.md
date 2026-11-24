Strand: Maths

## 2026-11-24 — Further Mechanics: blurred diagram with a Reveal button

Branch `claude/peaceful-mccarthy-amt1m9`. Area: `src/shared/mechanics/`, `src/tools/FurtherMechanics/`. The Diagram option on Work Done, Energy, Power and Elastic has a new choice, "Blurred until revealed". The picture shows blurred behind a "Reveal diagram" button, so students draw it themselves first; it clears when pressed, when the working starts, and blurs again on a new question. Printed worksheets leave the picture out for blurred questions. Shared rule: `DiagramDisplay` gains `"blurred"` (acts as `given` once revealed); the canvas is `MechCanvas`. Not made the default.

Agent: Claude Code
Notes: Build Log block to be added by the next planner update (planner not updated this session).
