Strand: Maths

## 2026-11-22 — Further Mechanics: the Elastic Strings and Springs tool (MC4, MC6)

Branch `claude/vigilant-cerf-3a5oah` (on top of the Power commit). Area: `src/tools/FurtherMechanics/Elastic.tsx` and `elastic/`, `mechanicsSpec.ts`, tests and docs.

- **Elastic Strings and Springs built, not yet live** (`/elastic-strings`, `enabled: false`, Developing-tools mode). The last of the four Work, Energy and Power tools, on `DecisionShell` with the mechanics diagrams and the written working. Three sub-tools: **Hooke's Law** (the tension or thrust from a length or an extension; the extension, the stiffness k or the modulus; a mass hanging in equilibrium: extension, length, modulus or mass; a particle between two vertical strings), **Elastic Potential Energy** (the energy stored from a length or an extension, the work done between two lengths, the modulus or the length from the energy) and **Elastic Energy Problems** (a spring or string released on a smooth table: the energy stored then the speed at the natural length or at a given extension; a particle dropped from the support of a string: the greatest extension, the distance below the support, the acceleration at the lowest point, the greatest speed; and at A2 a rough table: the speed, or how far it slides after the string goes slack). `elastic` stays one sub-tool, because its Setting pool has three values.
- Options: Course, Diagram, Spring or String, Setting, Ask for, Given As (the new length or the extension), Units Given (lengths in cm), g. A given force or energy is rounded to 3 s.f. and the answer recomputed from the shown value.
- `src/tests/elastic.test.ts`: the brief's acceptance examples (24 N, 0.118 m, 7.875 J, 4.8 J and 4.0 m s⁻¹, 0.790 m, 39.6 m s⁻², 5.01 m s⁻¹), every generated answer put back into its law or energy equation (the drop's quadratic root found independently by bisection), every KaTeX string and scene in all three Diagram modes, the Course setting, and 30 different questions per level. The hub pairs MC4 and MC6 with the sub-tools.
- Not done: two strings to two points A and B (A2 resolving), a slope or rope in the elastic problems, "show that" mode, energy-bar pictures, friction drawn on the table picture, a real phone, tablet and printer check, printing a saved question, Harry's review and go-live.

Agent: Claude Code
Notes: Build Log block "Further Mechanics: Elastic (Claude Code)" (tag agent:claude-code), branch `claude/vigilant-cerf-3a5oah`.
