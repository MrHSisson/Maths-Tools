# Corpus: Further Mechanics MC — running list of question styles

**Status:** started 2026-11-20. Add to it whenever a source (textbook, past paper) shows a question style; do not delete rows.

**Purpose.** Past-paper questions chain several skills (MC1 + MC2 + MC3 in one question), so they are poor for single-skill tools. This list records each *style* (the shape of a question, never its wording or numbers) so that styles with no sub-tool yet can be grouped, and a new sub-tool formed when enough of them share a skill. Textbook exercises are the main source because they isolate one skill at a time.

**Rules.** Shapes only: do not copy textbook wording or numbers into the repo. One row per style. `Home` is a sub-tool name, or `UNHOMED` while no sub-tool covers it. When several UNHOMED rows share a skill, propose a sub-tool in the "Candidate sub-tools" section and tell Harry.

**Sources.** `CUP1` = Cambridge A Level Further Maths for AQA, Mechanics Student Book Year 1/AS: Ch 1 Section 1 (worked examples WE1.x, Exercise 1A) and Ch 5 Section 3 (WE5.12 to 5.15, Exercise 5C) Ch 1 Section 2 (WE1.6 to 1.10, Exercise 1B) Ch 1 Section 3 (WE1.11 to 1.13, Exercise 1C) and Ch 1 Section 4 (WE1.14 to 1.19, Exercise 1D; MC7 AS).

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
| S21 | Gain in KE of a block that descends a smooth plane from rest (work done by gravity = gain in KE) | CUP1 5C Q9b | MC3 | A2 | UNHOMED (MC3 candidate: B) |
| S22 | Speed of a block after being dragged up a smooth slope (work by rope − PE gain = KE gain, then v) | CUP1 5C Q10c | MC3 | A2 | UNHOMED (MC3 candidate: B) |
| S23 | Speed at the bottom of a slide from rest, using work done by gravity along the slope = KE gain | CUP1 WE5.14 | MC3 | A2 | UNHOMED (MC3 candidate: B) |
| S24 | Box projected up a smooth plane: distance to rest by conservation of energy (KE start = PE gain) | CUP1 WE5.15 | MC2 + MC3 | A2 | UNHOMED (MC3 candidate: B) |
| S25 | Find kinetic energy from mass and speed, answer in kJ | CUP1 1B Q1 | MC3 | AS | UNHOMED (MC3 candidate: A) |
| S26 | KE and mass given: find the speed (reject the negative root); tonnes, kJ and answer in km/h | CUP1 WE1.6, 1B Q3 | MC3 | AS | UNHOMED (MC3 candidate: A) |
| S27 | KE and speed given: find the mass | CUP1 1B Q2 | MC3 | AS | UNHOMED (MC3 candidate: A) |
| S28 | Loss of KE when speed changes, speeds given in km/h (convert with ÷ 3.6) | CUP1 WE1.7 | MC3 | AS | UNHOMED (MC3 candidate: A) |
| S29 | Increase in KE when velocity changes, velocities as i, j vectors (speed² by Pythagoras), mass in tonnes | CUP1 WE1.8 | MC3 | A2 | UNHOMED (MC3 candidate: E) |
| S30 | Work-energy, horizontal, from rest: constant force and distance, find the speed | CUP1 WE1.9 | MC3 | AS | UNHOMED (MC3 candidate: B) |
| S31 | Work-energy with resistance only (no driving force): find the final speed after a distance, speed in km/h both ways | CUP1 WE1.10 | MC3 | AS | UNHOMED (MC3 candidate: B) |
| S32 | Force on a smooth floor, speeds at A and B: increase in KE, then work done, then the distance AB | CUP1 1B Q4 | MC3 | AS | UNHOMED (MC3 candidate: B) |
| S33 | Braking from u to v: loss of KE, then work done by the brakes given the work against resistance | CUP1 1B Q5 | MC3 | AS | UNHOMED (MC3 candidate: C) |
| S34 | Smooth slide with starting speed and a height drop (not a distance along the slope): speed at the bottom | CUP1 1B Q6 | MC2 + MC3 | AS | UNHOMED (MC3 candidate: D) |
| S35 | Average resistive force from the speed change over a thickness; mass in grams, thickness in cm | CUP1 1B Q7 | MC3 | AS | UNHOMED (MC3 candidate: C) |
| S36 | Braking force needed: mass in tonnes, speeds in km/h, distance and a known resistance | CUP1 1B Q8 | MC3 | AS | UNHOMED (MC3 candidate: C) |
| S37 | Slope with length and vertical drop, starting from rest, final speed given: find the resistance | CUP1 1B Q9 | MC2 + MC3 | AS | UNHOMED (MC3 candidate: D) |
| S38 | Up a hill: driving force, friction, distance along the road, vertical rise, starting speed: find the final speed | CUP1 1B Q10 | MC2 + MC3 | AS | UNHOMED (MC3 candidate: D) |
| S39 | Increase in PE when a mass is raised; also loss of PE for a mass in tonnes with g = 10 | CUP1 1C Q1, Q2 | MC2 | AS | UNHOMED (MC2 candidate: F) |
| S40 | PE gained given: find the height climbed | CUP1 1C Q3 | MC2 | AS | UNHOMED (MC2 candidate: F) |
| S41 | PE lost given and the height in cm: find the mass | CUP1 1C Q4 | MC2 | AS | UNHOMED (MC2 candidate: F) |
| S42 | Projectile or fall, no resistance, as a chain of parts: initial KE, PE lost, KE at the bottom, then speed (mass in grams) | CUP1 1C Q5, Q7 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: G) |
| S43 | As S42 for a diver, plus a part asking for the modelling assumptions (no calculation) | CUP1 1C Q6 | MC2 + MC3 | AS | UNHOMED (G; part d is a Depth or deck card) |
| S44 | Thrown upward, no external force: speed after rising a given height, then the maximum height (all KE becomes PE) | CUP1 WE1.11 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: G) |
| S45 | Projected down a smooth chute with a starting speed and a vertical drop: PE loss, then speed at the bottom | CUP1 1C Q9 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: G) |
| S46 | Slide with change in height and the speed at the bottom from rest: work done against resistance (GPE1 + KE1 = GPE2 + KE2 + work against resistance) | CUP1 1C Q8 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: H) |
| S47 | Sledge down a track (length and vertical drop, both speeds): the average resistance | CUP1 1C Q10 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: H) |
| S48 | Tension in a string over a pulley and a speed change: find the height gained (the unknown height is in the work and the PE) | CUP1 WE1.12 | MC2 + MC3 | AS | UNHOMED (MC2 candidate: H) |
| S49 | Rest to rest over several stages (a descent, a flat, a climb): total work by the rider, then the average driving force | CUP1 WE1.13 | MC1 + MC2 + MC3 | AS | UNHOMED (MC2 candidate: H) |
| S50 | Up a hill from rest: increase in KE, increase in PE, then with resistance and the work by the rider find the distance | CUP1 1C Q11 | MC1 + MC2 + MC3 | AS | UNHOMED (MC2 candidate: H) |
| S51 | Average power of a lift or crane: work against gravity ÷ time; mass in tonnes, time in seconds, minutes or hours; a lift with a maximum load | CUP1 WE1.14, 1D Q2, Q3, Q6, Q8 | MC7 (+ MC1) | AS | UNHOMED (MC7 candidate: I) |
| S52 | Average power of the brakes: loss of KE (speeds in km/h, mass in tonnes) ÷ time | CUP1 1D Q1 | MC7 (+ MC3) | AS | UNHOMED (MC7 candidate: I) |
| S53 | Work done from a power rating and a time, answer in kJ (rearrange power = work ÷ time) | CUP1 WE1.15 | MC7 | AS | UNHOMED (MC7 candidate: I) |
| S54 | Pump: mass from litres and density, then PE gain per second, KE gain per second, and the pump's power; or a mass rate given | CUP1 WE1.16, 1D Q9 | MC7 (+ MC2, MC3) | AS | UNHOMED (MC7 candidate: I) |
| S55 | Power = force × speed: find the power from a driving force and a speed in km/h; or find the tractive force from power in MW | CUP1 1D Q4, Q5 | MC7 | AS | UNHOMED (MC7 candidate: J) |
| S56 | Constant speed, power given: total resistance (tractive force = resistance) | CUP1 WE1.17 | MC7 | AS | UNHOMED (MC7 candidate: J) |
| S57 | Constant speed at one power, then a higher power: the acceleration (new tractive force − unchanged resistance = ma) | CUP1 WE1.18 | MC7 | AS | UNHOMED (MC7 candidate: K) |
| S58 | At an instant: power, speed, acceleration and mass given, find the total resistance | CUP1 1D Q10 | MC7 | AS | UNHOMED (MC7 candidate: K) |
| S59 | Constant power and constant resistance: the greatest acceleration while the speed rises (it is greatest at the lowest speed) | CUP1 1D Q11 | MC7 | AS | UNHOMED (MC7 candidate: K) |
| S60 | At an instant: power, resistance, mass and acceleration given, find the speed (a quadratic in the speed) | CUP1 1D Q12 | MC7 | AS | UNHOMED (MC7 candidate: K) |
| S61 | Resistance proportional to a power of the speed (kv^½ or kv^(3/2)): find k from one state, then the maximum power or maximum speed, or show k is a value | CUP1 WE1.19, 1D Q13 | MC7 | AS | UNHOMED (MC7 candidate: L) |
| S62 | Rocket at constant power, no resistance: the time for a speed change (power × t = change in KE), then the acceleration at a given speed | CUP1 1D Q14 | MC7 (+ MC3) | AS | UNHOMED (MC7 candidate: I / K) |
| S63 | Constant speed at maximum power, displacement as an i, j vector: tractive force from power ÷ speed, then work done over the displacement | CUP1 1D Q7 | MC7 (+ MC1) | A2 | UNHOMED (MC7 candidate: M) |

## Unhomed styles

S21 to S63: every style that applies kinetic energy or the work-energy principle (MC3, with MC1 and MC2 inside the chain). The textbook's Section 2 (Exercise 1B) now gives these clean single-skill sources.

## Candidate sub-tools (MC3)

Proposed from S21 to S38, to be agreed with Harry before any brief:

- **A. Kinetic Energy**: find KE, speed or mass; convert km/h, tonnes, grams; loss or gain in KE (S25 to S28).
- **B. Work-energy, horizontal**: constant force, find the speed or distance; resistance only (S30 to S32, S21).
- **C. Resistive and braking force**: from a speed change over a distance, find the force (S33, S35, S36).
- **D. Work-energy with gravity**: slopes and falls, by distance along the slope or by height; find speed, distance or resistance (S22, S23, S24, S34, S37, S38).
- **E. KE with vectors (A2)**: velocities as i, j vectors (S29).

## Candidate sub-tools (MC2, from Section 3)

- **F. Gravitational PE**: find the PE change, the height or the mass; conversions (S39 to S41, with S16 to S20).
- **G. Conservation of mechanical energy**: only gravity acts, find the speed, the KE, the PE or the maximum height (S42 to S45, with S34).
- **H. Energy with driving and resistive forces**: the full equation GPE1 + KE1 + work by driving forces − work against resistances = GPE2 + KE2; find a speed, a force, a distance or a height (S46 to S50, with S37, S38).

**Overlap with MC3.** MC3 candidate D (S22, S23, S24, S34, S37, S38) and MC2 candidates G and H are the same physical question solved by two methods: work done by gravity as a force (MC3), or GPE with conservation of energy (MC2). The book says so itself ("you do not need to include work done by gravity"). Rather than two near-identical tools, one could build D, G and H once, with a Method option (work by gravity, or GPE and KE).

## Candidate sub-tools (MC7 power, AS, from Section 4)

- **I. Average Power**: power = work ÷ time, or work = power × time, for lifts, brakes and pumps (S51 to S54, S62a).
- **J. Power = Force × Speed**: find the power, the tractive force or the resistance at constant speed (S55, S56).
- **K. Power and Acceleration**: power gives the tractive force, then F = ma; find the acceleration, a resistance or a speed at an instant (S57 to S60, S62b).
- **L. Variable Resistance**: resistance as kv^n, find k, the maximum speed or the maximum power (S61).
- **M. Power with vectors (A2)**: S63.

**What this section shows.** MC7 questions chain a work or energy calculation inside a power question (S51, S52, S54, S62 hold MC1, MC2 or MC3 inside). Keeping I to M single-skill means the energy part is given or is one plain step. MC7 A2 (resolving, power on a slope) has not been seen yet.

## Open questions

- Does the PE wording on a slope (S16, S17, S18, S20) belong to MC1 sub-tool 4 or to an MC2 tool? The textbook puts it in the same exercise as Fd cos θ.
- Do the MC2 PE questions (S16 to S20) and the gravity-and-KE chains (S34, S37, S38) belong in separate MC2 and MC3 tools, or in one Work and Energy tool?
- Should energy questions with gravity be one set of sub-tools with a Method option (work-energy, or GPE and KE), instead of separate MC2 and MC3 versions?
