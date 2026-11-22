Strand: Maths

## 2026-11-22 — Further Mechanics: gaps in Work Done and Energy, printing, hub tidy-ups

Branch `claude/vigilant-cerf-3a5oah`. Area: `src/tools/FurtherMechanics/workDone/`, `energy/`, `WorkDone.tsx`, `Energy.tsx`, tests and docs.

- **Work Done, Several Forces: a road given by its angle (A2).** A new situation, "Up a slope by its angle": the work done by the driving force, against gravity (the height gained is the distance along the road times sin α, so the working finds it first) and against the resistance. The force is chosen large enough to pull the load up.
- **Work Done, Variable Force: a stopping distance.** At Level 3 a vehicle moving at a given speed, with the engine off or a constant driving force, against a resistance that grows with distance, is asked how far it travels before it stops. The energy equation gives a quadratic (formula), a cube root, or, for a resistance in x² with a driving force, the cubic that has to be solved numerically. A new "Ask for" option at Level 3 chooses the speed or the stopping distance.
- **Energy, Work-Energy Principle: a rough slope (A2) and a pulley.** Setting gained "Rough slope (A2)" (a slope given by its angle, with friction μ times the normal reaction: the speed after sliding down it, the distance a particle projected up it travels before it stops, or the coefficient of friction from a speed) drawn as a force diagram with the weight resolved, and "Raised over a pulley" (a load raised from rest by a constant pulling force: the speed at the top, or the force from the speed), drawn with the pulley picture. At AS the rough slope falls back to the ordinary slope.
- Tests extended in `workDone.test.ts` and `energy.test.ts` (the stopping distance put back into the energy equation with a numerical integral; the friction and pulley answers closed against their equations; KaTeX, scenes and the Course setting).
- Not done: energy-bar pictures as the working picture (D14), a descending slope in the pulley-free picture, the real phone, tablet and printer check, Harry's review and go-live.

- **A saved mechanics question now prints with its picture** (all four Work, Energy and Power tools). They set `skillSheet`; the Decision shell's saved-question print puts the diagram under each question (with a working box) and prints the worked answer (each step's caption and lines) on the answers page; a question with Diagram set to None prints without a picture. Checked in Chromium: save a question, Print saved questions, Print both.
- **Hub.** The Dimensional Analysis tile "Any exam question" is now "Exam-style questions", and kinetic and potential energy and conservation of energy are listed under both MC2 and MC3 (the pairing test now forbids a sub-tool twice under one statement instead of twice anywhere).

Agent: Claude Code
Notes: Build Log block "Further Mechanics: Work Done and Energy gaps (Claude Code)" (tag agent:claude-code), branch `claude/vigilant-cerf-3a5oah`.
