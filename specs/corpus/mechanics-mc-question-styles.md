# Corpus: Further Mechanics MC — running list of question styles

**Status:** started 2026-11-20. Add to it whenever a source (textbook, past paper) shows a question style; do not delete rows.

**Purpose.** Past-paper questions chain several skills (MC1 + MC2 + MC3 in one question), so they are poor for single-skill tools. This list records each *style* (the shape of a question, never its wording or numbers) so that styles with no sub-tool yet can be grouped, and a new sub-tool formed when enough of them share a skill. Textbook exercises are the main source because they isolate one skill at a time.

**Rules.** Shapes only: do not copy textbook wording or numbers into the repo. One row per style. `Home` is a sub-tool name, or `UNHOMED` while no sub-tool covers it. When several UNHOMED rows share a skill, propose a sub-tool in the "Candidate sub-tools" section and tell Harry.

**Sources.** `CUP1` = Cambridge A Level Further Maths for AQA, Mechanics Student Book Year 1/AS: Ch 1 Section 1 (worked examples WE1.x, Exercise 1A) and Ch 5 Section 3 (WE5.12 to 5.15, Exercise 5C).

**AS or A2.** MC1 at AS has no Fd cos θ (see `specs/exam/spec/aqa-mechanics.md`). Rows marked A2 are the cos θ layer.

## Planned MC1 sub-tools (draft, see the chat discussion)

1. Force × Distance · 2. Work Done by Gravity · 3. Force at an Angle (A2) · 4. Work on a Slope (A2) · 5. Several Forces

## Styles

| ID | Style (shape only) | Source | Stmt | AS/A2 | Home |
|---|---|---|---|---|---|
| S01 | Find work done: force and distance along the line of motion, SI units | CUP1 WE1.1, 1A Q1, Q5 | MC1 | AS | 1 Force × Distance |
| S02 | As S01 with kN and km given, answer asked in kJ | CUP1 WE1.2 | MC1 | AS | 1 |
| S03 | Find work against gravity (mg × height), g = 9.8, answer to 2 s.f. | CUP1 WE1.3, 1A Q2 | MC1 | AS | 2 Work Done by Gravity |
| S04 | Find work done by gravity on a falling body, g = 10 stated | CUP1 1A Q4 | MC1 | AS | 2 |
| S05 | Work by gravity given, find the height descended | CUP1 1A Q3 | MC1 | AS | 2 |
| S06 | Gravity over the whole drop, resistance over stages (air, then water) with different forces and distances | CUP1 WE1.4 | MC1 | AS | 5 Several Forces |
| S07 | Journey with driving force, resistance and a height change: work by each force, distance given in km | CUP1 WE1.5 | MC1 | AS | 5 |
| S08 | Driving force against two resistances (wind, friction): work by the driver, total work against resistances | CUP1 1A Q6 | MC1 | AS | 5 |
| S09 | Raise a load against gravity and a resistance: total work done | CUP1 1A Q7 | MC1 | AS | 5 |
| S10 | Two-step: work and driving force give the distance, then work against a resistance | CUP1 1A Q8 | MC1 | AS | 5 (Level 3) |
| S11 | Find work done by a force at a constant angle to the movement | CUP1 WE5.12, 5C Q1, Q2 | MC1 | A2 | 3 Force at an Angle |
| S12 | Force at an angle, work given: find the distance | CUP1 5C Q3, Q8 | MC1 | A2 | 3 |
| S13 | Force at an angle, work and distance given: find the force | CUP1 5C Q4 | MC1 | A2 | 3 |
| S14 | Force at an angle, work, force and distance given: find the angle (inverse cos) | CUP1 5C Q5 | MC1 | A2 | 3 |
| S15 | Work done against gravity walking up a slope: mass and distance along the slope, angle to horizontal, resolved with the angle to the vertical | CUP1 WE5.13 | MC1 | A2 | 4 Work on a Slope |
| S16 | Gain in PE moving up a plane: mass in grams, distance along plane | CUP1 5C Q6 | MC2 | A2 | 4 (PE wording) |
| S17 | Loss in PE descending a plane | CUP1 5C Q7 | MC2 | A2 | 4 (PE wording) |
| S18 | Loss of PE for a block released on a smooth plane | CUP1 5C Q9a | MC2 | A2 | 4 |
| S19 | Work done by a rope tension parallel to a slope | CUP1 5C Q10a | MC1 | AS | 5 / 1 |
| S20 | Change in PE of a block dragged up a smooth slope | CUP1 5C Q10b | MC2 | A2 | 4 |
| S21 | Gain in KE of a block that descends a smooth plane from rest (work done by gravity = gain in KE) | CUP1 5C Q9b | MC3 | A2 | UNHOMED |
| S22 | Speed of a block after being dragged up a smooth slope (work by rope − PE gain = KE gain, then v) | CUP1 5C Q10c | MC3 | A2 | UNHOMED |
| S23 | Speed at the bottom of a slide from rest, using work done by gravity along the slope = KE gain | CUP1 WE5.14 | MC3 | A2 | UNHOMED |
| S24 | Box projected up a smooth plane: distance to rest by conservation of energy (KE start = PE gain) | CUP1 WE5.15 | MC2 + MC3 | A2 | UNHOMED |

## Unhomed styles

S21 to S24 (work-energy on a slope, find the KE gain, the speed or the distance). They share one skill, "apply work done = change in KE (or conservation of energy)", which is MC2 and MC3, not MC1.

## Candidate sub-tools

- **Work-energy on a slope** (from S21 to S24): not MC1. Decide when the MC2/MC3 tools are planned; see the Work, Energy and Power row in `docs/pathways/further-mechanics.md`.

## Open questions

- Does the PE wording on a slope (S16, S17, S18, S20) belong to MC1 sub-tool 4 or to an MC2 tool? The textbook puts it in the same exercise as Fd cos θ.
