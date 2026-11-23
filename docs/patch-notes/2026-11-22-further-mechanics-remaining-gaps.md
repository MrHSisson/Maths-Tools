Strand: Maths

## 2026-11-22 — Further Mechanics: energy bars and the remaining gaps

Branch `claude/vigilant-cerf-3a5oah`. Area: `src/tools/FurtherMechanics/` (`energy/bars.ts`, `power/train.ts`, `elastic/`), `Energy.tsx`, `Elastic.tsx`, `Power.tsx`, tests and docs.

- **Energy bars as the working picture (D14).** A new "Working Picture" option in Energy (Conservation of Energy and the Work-Energy Principle: level, slope, rough slope, pulley) and Elastic Energy Problems swaps the diagram for energy bars: a Start column and an End column, each stacked from gravitational, elastic and kinetic energy and work done or lost, always the same height so the equation is seen balancing; a dashed line shows what is conserved when only gravity and the spring do work. The bars appear once the energy equation has been written. Read from each question's own inputs, so no builder changed.
- **Elastic.** A smooth slope (A2) for the dropped string: the same working with g sin α, drawn with the slope-and-string picture (greatest extension, distance, acceleration, greatest speed). Hooke's Law: a particle on two strings fixed at two points on one level (A2): the extensions, the cosine rule for the angles, resolving horizontally for the second modulus and vertically for the mass, drawn with the two-strings picture. A Show That switch gives the answer in the question and the working proves it.
- **Force and Speed.** A train of an engine and coaches (the acceleration of the whole train, then the tension in the coupling by treating the coaches alone) and, at A2, a constant force and a displacement as vectors: the work as F·d and the average power. Both are options at Level 3.
- Tests: bars columns are the same height in every setting; the slope, the two-points and the train and vector answers are put back into their equations; every KaTeX line and scene in all three Diagram modes; A2 settings are not offered at AS.
- Not done: Depth and Teach material, calibration, the real phone, tablet and printer check, Harry's review and go-live, exam-style questions.

Agent: Claude Code
Notes: Build Log block "Further Mechanics: energy bars and the remaining gaps (Claude Code)" (tag agent:claude-code), branch `claude/vigilant-cerf-3a5oah`.
