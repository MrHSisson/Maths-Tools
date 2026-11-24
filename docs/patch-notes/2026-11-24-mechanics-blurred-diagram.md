Strand: Maths

## 2026-11-24 — Further Mechanics: blurred diagram with a Reveal button

Branch `claude/peaceful-mccarthy-amt1m9`. Area: `src/shared/mechanics/`, `src/tools/FurtherMechanics/`, `src/shared/decision/DecisionShell.tsx`.

- **Blurred by default.** The Diagram option on Work Done, Energy, Power and Elastic has a new default, "Blurred until revealed". The picture and the information taken from the question (the givens) are blurred, with two buttons: **Reveal Full** (the whole picture, givens clear) and **Build Diagram** (givens clear, the picture drawn up part by part as the working goes on). Starting the working without choosing counts as Reveal Full; a new question blurs again. The Diagram option is gone from the popover: the picture always starts blurred. Printed worksheets leave the picture out for blurred questions. Shared rule: `DiagramDisplay` gains `"blurred"`; the canvas is `MechCanvas`.
- **Enlarge the question, everywhere in the Decision shell.** The enlarge button (the question stage first built for Simplex and Formulating LP) is now on every Decision tool, not an opt-in: the question shown large and centred, laptop and tablet landscape. `config.questionStage` now only adds a figure. Further Mechanics adds its diagram to the stage only when the question gives it (`MECH_STAGE`). ToolShell tools do not have it yet.

- **Question kinds are tick-any, not either/or.** In Work Done, Power and Energy the options that choose a kind of question are now multi (tick several to mix, tick one to restrict): Force Acts (with / against the motion, both by default), By or Against gravity (both by default), Setting (Work Done, work-energy and conservation), Context, Motion, Vehicle, Resistance, Angle Given As, Data, Forces, Parts Shown, Velocity As. Each keeps its old default except the two direction options. The shell's `when` rule now reads a multi option's ticks, so "Working Shown" still appears only when a slope can be drawn. Course, g, units and answer format stay single.

Agent: Claude Code
Notes: Build Log block to be added by the next planner update (planner not updated this session).
