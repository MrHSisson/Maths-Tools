# Programme Spec: Further Mechanics MC — Work, Energy and Power (four tools, fifteen sub-tools)

**Status:** draft (2026-11-20). Not `ready`: section 2 lists the decisions Harry still has to make. Nothing is built from this until he says so, and each tool then gets its own brief (or is built straight from its section here).

**Evidence:** the 109 question styles in `specs/corpus/mechanics-mc-question-styles.md` (S01 to S109), drawn from the Cambridge A Level Further Maths for AQA Mechanics Year 1/AS textbook (the work-energy-power chapter, Chapter 5 sections 1, 2 and 4, Exercises 1A to 1D, 5A to 5D, Mixed practice 1 and 5) and the AQA past-paper questions inside it (2008 to 2015). This document quotes **shapes, never the textbook's wording or numbers**; every acceptance example below uses numbers made up for this brief.

**Specification statements:** MC1 to MC7 (`specs/exam/spec/aqa-mechanics.md`). The AS and A2 split falls inside MC1 and MC7 (no Fd cos θ and no resolving at AS), so it is a setting, not a separate set of tools (section 4.5).

**Out of scope:** exam-style questions (section 8).

**Companion documents:**
- `docs/architecture/MECHANICS_DIAGRAMS_PLAN.md`: how every picture is drawn (read before any sub-tool that needs a diagram).
- `specs/dimensional-analysis.md` and `src/tools/FurtherMechanics/DimensionalAnalysis.tsx`: the pilot of this route, built on `DecisionShell`. **Read both before writing any code**; they show how a Further Mechanics tool is structured, how the options and exam chains work and how the tests re-derive every answer.
- `docs/pathways/further-mechanics.md`: where this sits in the chapter plan.

---

## 1. Purpose, and the problem this solves

Past-paper questions on this chapter are **chains**: a single question runs MC1, then MC2, then MC3 (and often MC7) across its parts, so a bank of them cannot tell a teacher which *single skill* a class is missing. The tools here separate the skills: each sub-tool drills one idea, with the numbers varying and the level and options changing what is asked, and the exam-style chains (phase 2, section 8) put the skills back together the way the papers do.

The textbook exercises are the **source of the skill list and the difficulty ladder**, because they isolate one idea at a time and run from routine to harder. The past-paper questions in the mixed practice are the **source of the chains**.

**After a lesson built on these tools** a student can: calculate work done by a force in every standard set-up (in the line of motion, at an angle, against gravity, on a slope, with several forces, with a variable force); calculate KE, GPE and EPE and apply the work-energy principle and conservation of energy; apply Hooke's law; and calculate and use power.

---

## 2. Decisions

### 2.1 Settled in the design chat (2026-11-20)

- **Four tools, fifteen sub-tools** (section 3), not one tool per exam question type. Variety comes from **levels and Question Options (QO)**, so each sub-tool can give hundreds of different questions.
- **Skills only.** This programme builds the skill sub-tools and nothing exam-style. Exam-style chains are a **separate later pass, built from actual past-paper questions** (Harry, 2026-11-20); the question styles in the corpus file that come from the textbook's mixed practice are used here only to find single skills, never to generate exam questions.
- **Proofs, classification and "state your assumptions" items are not generators.** They become Depth cards or deck slides (section 7).
- **Diagrams are a first-class deliverable**, drawn by one shared system (`docs/architecture/MECHANICS_DIAGRAMS_PLAN.md`).
- **Count correction.** In chat I called this "thirteen sub-tools". The four-tool table I gave summed to fourteen; the full style mapping needs a separate **Work and Gravity** sub-tool (the textbook teaches mgh as its own idea), so the honest count is **fifteen**. Two sub-tools (Work-Energy, Elastic Energy Problems) are wide and may split when built (section 9).

### 2.2 Decisions for Harry (recommended answer first)

| # | Decision | Recommended | Why it matters |
|---|---|---|---|
| D1 | **Shell** | `DecisionShell` with the diagram as the picture and the written working beside it, as Dimensional Analysis | Gives the Practice \| Exam style switch, the chooser tiles, hand-picked saved questions for printing, stepped working behind the (?) and a mark scheme. The alternative, `ToolShell` with `diagramSplit`, gives Whiteboard / Worked Example / Worksheet but no exam view. The pathway file already settled `DecisionShell` for MA |
| D2 | **AS and A2** | One tool-level **Course** setting, AS or A2 (section 4.5). AS hides the A2-only sub-tools and options; A2 shows everything | The pathway file lists this as an open decision. A year option is the only choice that keeps one sub-tool serving both |
| D3 | **g** | An option, g = 9.8 (default) or g = 10, with the working stating the value used | The textbook and papers use both; mark schemes accept either when stated |
| D4 | **Rounding** | Answers to 3 significant figures, working carried at full precision; model answers state "3 s.f." and the mark scheme note "2 s.f. also accepted when g = 9.8" | The textbook mixes 2 s.f. (when g = 9.8) and 3 s.f. The AQA papers accept either. One rule keeps generated answers consistent |
| D5 | **Diagram glyphs** | The block or particle is the default (the exam convention); context glyphs (car, cyclist, train) are an option added after Harry sees the first scenes | Cars and cyclists are the biggest drawing cost for the least maths value |
| D6 | **Energy Method option** | One option in Work-Energy, **Method: work done by gravity \| GPE and KE**, rather than two near-identical tools | The textbook itself says "you do not need to include work done by gravity" when using the combined equation: the same question, two methods |
| D7 | **Where the build starts** | Work Done (the first tool), with the diagram foundation, then Energy, Power, Elastic | Section 9 |

---

## 3. The tools and sub-tools

Every style (S-number) in `specs/corpus/mechanics-mc-question-styles.md` is assigned to exactly one home below, or to a non-generator home (section 7).

| Tool (hub chapter MC) | Statements | Sub-tool | Key | Levels | Styles |
|---|---|---|---|---|---|
| **1. Work Done** `/work-done` | MC1, MC5 | Force and Distance | `fd` | 3 | S01, S02, S19 |
| | | Work and Gravity | `grav` | 3 | S03, S04, S05, S15 |
| | | Force at an Angle (A2) | `angle` | 3 | S11, S12, S13, S14, S96 |
| | | Several Forces | `several` | 3 | S06, S07, S08, S09, S10, S97 |
| | | Variable Force | `variable` | 3 | S64, S65, S66, S67, S68, S69 |
| **2. Energy** `/energy` | MC2, MC3 | Kinetic and Potential Energy | `kepe` | 3 | S16, S17, S18, S20, S25, S26, S27, S28, S29, S39, S40, S41 |
| | | Work-Energy Principle | `workenergy` | 3 | S22, S30, S31, S32, S33, S35, S36, S37, S38, S46, S47, S48, S49, S50, S98, S100 |
| | | Conservation of Energy | `conserve` | 3 | S21, S23, S24, S34, S42, S43, S44, S45, S99 |
| **3. Elastic Strings and Springs** `/elastic-strings` | MC4, MC6 | Hooke's Law | `hooke` | 3 | S70, S71, S72, S73, S74, S91 |
| | | Elastic Potential Energy | `epe` | 2 | S75, S76, S77 |
| | | Elastic Energy Problems | `elastic` | 3 | S78, S79, S80, S81, S82, S83, S92, S93, S102, S103, S105, S106, S107, S108 |
| **4. Power** `/power` | MC7 | Average Power | `avgpower` | 3 | S51, S52, S53, S54, S62 (part a) |
| | | Force and Speed | `forcespeed` | 3 | S55, S56, S57, S58, S59, S60, S61, S62 (part b), S63, S86, S87 |
| | | Power on a Slope (A2) | `powerslope` | 3 | S94, S95, S101, S109 |
| | | Power from Motion Data | `motion` | 2 | S89, S90 |

**Not generators:** S84, S85, S88 (proof and equation-choice items: Depth or deck cards), S43 part d (state the modelling assumptions), and the classification of forces from the textbook introduction. **Exam chain only:** S104 (two particles through a hole).

**Hub, ids and routes.** The hub entry already exists (`further-mechanics`, `/further-mechanics`). Each tool is a registry entry with `hub: 'further-mechanics'`, `enabled: false` until its go-live checklist (section 9) is done, with ids `work-done`, `energy`, `elastic-strings`, `power`, files in `src/tools/FurtherMechanics/`, and `mechanicsSpec.ts` updated so each statement lists its tool (the page already shows this for MA).

**Sub-tools that exist only at A2** are hidden when Course is AS: Force at an Angle, Power on a Slope, and the `slope`, vector and friction settings inside other sub-tools (4.5).

---

## 4. Shared foundations (built once, used by every sub-tool)

### 4.1 The mechanics core: `src/shared/mechanics/`

A pure-maths library with **no React**, imported by the generators, the working builders and the tests. It is the equivalent of `dim.ts` for Dimensional Analysis.

- **Quantities and units.** A `Quantity` carries a value and a unit; conversions are exact and tested: tonnes to kg, g to kg, km to m, cm to m, kN and MN to N, kW and MW to W, km h⁻¹ to m s⁻¹ (÷ 3.6), minutes and hours to seconds, J to kJ, litres to kg (1 litre of water = 1 kg).
- **Constants.** `g` as 9.8 or 10 (D3), the density of water 1000 kg m⁻³.
- **Formulae, each one function with its own unit test:** work (F d, F d cos θ, m g h, ∫ f), KE, GPE, EPE (kx²/2 and λx²/2l), Hooke's law, power (W/t, F v), work-energy and conservation as an equation builder, and the standard resolutions (weight component down a slope = m g sin α).
- **A small solver** for the equations the problems produce: linear, quadratic (extension from conservation of energy, speed in the quadratic cases), and a bracketing solver for the one cubic (S69). It is used by the **validators**, never to produce a question (R5: questions are built equations-first, below).
- **Significant figures and rounding** through the existing `sigFigs` helpers; one function applies the D4 rule.
- **`Quantity` formatting** with the house units (`kJ`, `m s⁻¹`, `km h⁻¹`) so text and KaTeX agree. No units inside KaTeX where `answerSuffix` can carry them (R4).

### 4.2 Equations-first generation (R5)

A generator **never picks random givens and solves for the unknown**; that produces ugly, sometimes impossible questions. It does this instead:

1. Pick the **story** (a context, section 4.3) and the **physical quantities that build it** (a mass, a height, a speed) from that context's realistic ranges.
2. Derive the **other quantities** by the formulae of 4.1, so the whole set is consistent.
3. **Round the givens** to friendly numbers (two or three significant figures, a multiple of 5 for a speed in km h⁻¹) *before* deriving the answer, so the shown givens are the ones that give the shown answer.
4. Ask for one of the quantities: the "Ask for" option picks which is the unknown and which are given.
5. **Reject** the draw if it breaks a guard: a negative or zero quantity where one is impossible, a speed outside the context's range, a result that does not need the intended idea (a "work against gravity" with a height of 0.1 m), an answer in exact multiples that make the working trivial, or two questions in a worksheet with the same content fingerprint (R2).

For "find the unknown from the work done" questions the unknown is chosen first and the work is derived from it, so the answer is a clean number to three significant figures.

### 4.3 The context library

One shared table, as the worded situations are for Dimensional Analysis: **a context has a name, a body, realistic ranges, units shown, and the questions it can serve.** Ranges stop a cyclist of 800 kg or a car at 3 m s⁻¹.

| Context | Mass | Speed | Distance / height | Typical forces | Serves |
|---|---|---|---|---|---|
| cyclist and bicycle | 60 to 110 kg | 3 to 15 m s⁻¹ | 100 m to 2 km; hill rises 5 to 40 m | drive 20 to 150 N, resistance 10 to 90 N | work, energy, power, slopes |
| car | 800 to 1800 kg | 8 to 35 m s⁻¹ (30 to 125 km h⁻¹) | 50 m to 3 km | drive 500 to 4000 N, resistance 300 to 1500 N | power, work-energy, slopes |
| van, lorry | 1.5 to 40 tonnes | 8 to 30 m s⁻¹ | 50 m to 3 km | resistance 1 to 8 kN, braking 5 to 80 kN | braking, power |
| train | 60 to 800 tonnes | 15 to 60 m s⁻¹ | 200 m to 5 km | resistance 5 to 60 kN | braking, power, carriages |
| crate, box, parcel, block | 0.5 to 200 kg | 0.5 to 10 m s⁻¹ | 1 to 50 m | 5 to 400 N | work, slopes, Hooke |
| sledge, child on a slide | 20 to 80 kg | 1 to 12 m s⁻¹ | slide 3 to 25 m, drop 1 to 8 m | resistance 5 to 60 N | slopes, conservation |
| climber, person, athlete | 50 to 100 kg | 1 to 10 m s⁻¹ | 5 to 60 m | | gravity, power |
| crane, lift | 0.5 to 5 tonnes | n/a | 5 to 80 m in 10 to 120 s | | average power |
| ball, stone, projectile | 0.05 to 2 kg | 5 to 40 m s⁻¹ | height 2 to 60 m | | conservation, fall |
| bullet | 5 to 20 g | 100 to 500 m s⁻¹ | through 2 to 20 cm | resistance 1 to 20 kN | work-energy |
| diver, bungee jumper | 50 to 100 kg | | 3 to 70 m | | conservation, elastic |
| pump (water) | 100 to 3000 litres per minute | 1 to 12 m s⁻¹ ejected | lift 3 to 40 m | | average power |
| boat | 1 to 10 tonnes | 2 to 15 m s⁻¹ | | | KE (vectors) |
| particle (abstract) | 0.1 to 20 kg | | | | every sub-tool, no story |

The Context option (below) lets a teacher choose **particle (no story)** or **a worded situation**; the particle is the default at Level 1.

### 4.4 Wording and working

**Question wording** comes from small banks of phrasings per style, varied so a worksheet does not read the same each time ("find the work done by", "calculate the work done against"), and uses the textbook's standard phrases: "propulsive force", "resistance to motion", "work done against gravity", "using g = 9.8 m s⁻²". Every question states what is **modelled** where it matters (a smooth plane, no air resistance, a light string).

**Working steps** follow the textbook's own layout, which is also the house step style (`docs/reference/questions-and-working.md`, rules R1, R7, R8):

1. **State the formula** in words or symbols (`Work done = force × distance`), caption "Use the definition of work done".
2. **Convert units to SI first** when needed, as its own step (`75 kN = 75 000 N`), caption naming the conversion.
3. **Substitute** (`= 25 × 5`), then the **answer with its unit** and the accuracy stated.
4. **Total work in a chain** is stated as `total work = work by propulsive forces − work against resistive forces` before it is used.
5. **Energy problems write the equation first** (`GPE₁ + KE₁ + work by driving force − work against resistance = GPE₂ + KE₂`), then the zero terms with a caption saying why each is zero ("starts from rest, so KE₁ = 0"), then solve.
6. **Choice of zero level for GPE** is stated.
7. The final line is the answer in the context ("the speed at the bottom is 8.8 m s⁻¹"), with the accuracy note.

Steps are built with `step` / `mStep` / `tStep`, never as raw objects (R1); each fragment is the next whole mark a teacher would write and valid KaTeX on its own (R8); prose goes through `tStep` (R7).

### 4.5 The AS and A2 layer

`Course` is a tool-level setting (AS | A2), stored and shared like other settings, default **A2** (the superset).

| What changes at AS | Rule |
|---|---|
| No `Fd cos θ` | Force at an Angle and Work on a slope are hidden. A "force at an angle" never appears |
| No resolving in MC7 | Power on a Slope is hidden; the constant-speed and acceleration questions are horizontal only |
| No vector forms | The velocity-as-vectors KE items (S29) and the vector-displacement power item (S63) are hidden |
| Slope questions with weight components | Slope settings in `grav`, `kepe`, `workenergy`, `conserve` are hidden, because they need mg sin α (S15 to S18, S20 to S24, S97 to S100) |
| Hooke's law with two strings to two points, and slope and friction elastic problems | hidden at AS (S91, S92, S93, S103, S107): they need resolving or friction |

At AS a slope is always given by its length and its vertical drop (as in the textbook's AS exercises), never by an angle, so it needs no resolving. Each style carries an `as: boolean` flag from the corpus file, and a test asserts that no question generated at Course AS contains an A2-only idea.

### 4.6 The options vocabulary

Options follow `docs/reference/options-and-calibration.md` and the label rules (`levelLabels.test.ts`): Title Case labels, one spelling, "Ask for", "Answer Format", "Working Shown", "Method". Exclusive pools apply exactly one option per question (R19). Options shared across the tools, so the vocabulary is the same everywhere:

| Option | Kind | Values |
|---|---|---|
| **Context** | exclusive | particle (no story) · worded situation |
| **Ask for** | exclusive | the quantity asked, defined per sub-tool |
| **Units Given** | exclusive | standard units only · includes conversions (km, kN, tonnes, g, cm, km h⁻¹) |
| **g** | exclusive | 9.8 · 10 |
| **Answer Format** | exclusive | answer in the unit given · answer in a requested unit (kJ, km h⁻¹) |
| **Method** (energy tools) | exclusive | work done by gravity · GPE and KE |
| **Setting** (slope tools) | exclusive | horizontal · vertical · slope (A2) |

Changing an option never throws the current question away unless it changes the numbers (R14).

### 4.7 Tests every tool must have

- **Independent re-derivation.** Every generated question's answer is recomputed by `src/shared/mechanics` through a *different route* from the generator's (the solver, or the algebra rearranged another way) and agreed to 1e-9 relative. Dimensional Analysis does this in `dim.test.ts`.
- **Acceptance set.** Each sub-tool's acceptance examples in section 5 are reproduced exactly by the generator seeded with their givens, line by line in the working.
- **Smoke tests** through the shared `__test = { TOOL_CONFIG, generateQuestion }` convention, if the tool is on `ToolShell`; the equivalent validator for `DecisionShell` tools is `validateProblem` (`src/shared/decision/validate.ts`).
- **KaTeX validity** of every string and every fragment.
- **Seeded replay** (R45): a seed rebuilds the same question; no module state.
- **Worksheet uniqueness** (R2): 30 different questions at default options for every level.
- **Course test** (4.5): nothing A2-only at Course AS.
- **Guard tests** for the reject rules of 4.2.
- **Diagram tests** (`MECHANICS_DIAGRAMS_PLAN.md`, section 7).
- **Calibration** of each level's difficulty (R25, R26): scores come from the question, never from the option that produced it.

---

## 5. The sub-tools

Each section: what it is for, the levels, the options, how the generator builds a question (equations first), the working, the diagram it needs, **acceptance examples** (made-up numbers, checked), and the traps. Level ladders follow the order of the textbook exercises (routine to harder). "Ask for" values are the unknown.

Conventions: **g = 9.8** unless stated; answers to 3 s.f.; the `Units Given` option adds conversions at Level 2 and above wherever it is shown. A diagram is **D1 to D15** from `MECHANICS_DIAGRAMS_PLAN.md`.

---

### Tool 1: Work Done

#### 5.1 Force and Distance (`fd`), 3 levels

**For:** work = force × distance along the line of motion; a force opposing the motion; units; a rope or tension acting along a slope or surface.
**Styles:** S01, S02, S19. **Diagram:** D1 (a body on level ground with the force and distance), D3 for the rope along a slope. A bare "find the work" with no set-up needs none.
**Levels:** 1 whole numbers in standard units, find the work · 2 decimals and conversions (kN, km), answer asked in kJ · 3 find the force or the distance from the work done; a force that opposes the motion.
**QO:** *Ask for* (work · force · distance; at Level 3 the last two) · *Units Given* · *Force Acts* (with the motion · against the motion) · *Answer Format* (J · kJ) · *Context*.
**Generator:** pick F and d, derive W; for "find F" pick F, d, derive W, ask for F. Guard: a force and distance in the context's range.
**Working:** formula → convert → substitute → answer with unit (the textbook's WE1.1 and 1.2 shape).
**Acceptance:** A tractor applies a 4.2 kN driving force over 0.35 km. Work = 4200 × 350 = 1 470 000 J = **1470 kJ**. (Conversion steps shown: 4.2 kN = 4200 N, 0.35 km = 350 m.)
**Traps:** giving J when kJ was asked; km not converted; "work done against resistance" is a positive amount.

#### 5.2 Work and Gravity (`grav`), 3 levels

**For:** work done by or against gravity = mgh; weight as a force that resists or promotes motion; the equivalent with a slope (A2).
**Styles:** S03, S04, S05, S15. **Diagram:** D4 (vertical motion, datum and height), D3 for the slope setting.
**Levels:** 1 find the work given m and h · 2 find the height or the mass from the work done; mass in grams or tonnes · 3 worded situations (lifting, climbing, descending) and, at A2, a slope given as the distance along it and the angle.
**QO:** *Setting* (vertical · slope, A2) · *Ask for* (work · height · mass) · *By or Against* (against gravity · by gravity) · *g* (9.8 · 10) · *Units Given* · *Context*.
**Generator:** pick m, h (or d and α for the slope), derive W = m g h. On a slope, h = d sin α; the textbook resolves with the angle to the *vertical* (cos(90° − α)); the working states both, and a **Working Shown** option chooses "angle to the vertical (as in the textbook)" or "m g sin α".
**Working:** weight = mg → work = weight × height; on a slope, the height gained → work. An accuracy caption ("you used g to 2 s.f., so 2 s.f.") appears only if Harry chooses the 2 s.f. convention (decision D4).
**Acceptance:** A 64 kg climber does 12 000 J of work against gravity: height = 12 000 ÷ (64 × 9.8) = **19.1 m**. Slope (A2): a 48 kg walker goes 120 m along a slope at 12° to the horizontal: work against gravity = 48 × 9.8 × 120 × sin 12° = **11.7 kJ** (11 736 J; the same value from 48 × 9.8 × cos 78° × 120).
**Traps:** forgetting g; the angle to the vertical versus the horizontal; mass in grams.

#### 5.3 Force at an Angle (`angle`, A2), 3 levels

**For:** work = F d cos θ; the component perpendicular to motion does no work; finding F, d or θ.
**Styles:** S11 to S14, S96. **Diagram:** D2 with the resolved component, always.
**Levels:** 1 find the work · 2 find the force or the distance · 3 find the angle (inverse cosine), or find the work then the power (S96).
**QO:** *Ask for* (work · force · distance · angle · work then power) · *Answer Format* (J · kJ) · *Context* (a sledge, a towed car, a suitcase strap).
**Generator:** pick F, θ (5° to 60°), d, derive W; for the angle case pick θ and derive W so that cos θ is not a nice value (otherwise the inverse is guessed).
**Working:** formula (Key point: W = F cos θ × d) → substitute → answer; the angle case rearranges to cos θ = W ÷ (F d) and uses the inverse.
**Acceptance:** A 40 N force at an angle to the direction of motion does 900 J of work over 30 m: cos θ = 900 ÷ (40 × 30) = 0.75, so **θ = 41.4°** (3 s.f.).
**Traps:** calculator in radians; confusing the angle to the horizontal and the angle to the motion.

#### 5.4 Several Forces (`several`), 3 levels

**For:** totals: work by a driving force, against resistances, by and against gravity, over different distances or stages; a journey with a height change; and the two-step question (find a distance first).
**Styles:** S06 to S10, S97. **Diagram:** D1, D5 (profile or layers), D6, D3 for the slope and tow-rope forms.
**Levels:** 1 two forces (a driving force and a resistance, or two resistances over different distances) · 2 a journey with a driving force, a resistance, a height change, each part asked in turn (a, b, c) · 3 the two-step question, resistances in stages, or gravity plus a force at an angle on a slope (A2: S97).
**QO:** *Stages* (one stage · two stages) · *Ask for* (work by each force · total work against resistance · total work done · a distance then a work) · *Units Given* · *Slope* (A2) · *Context*.
**Generator:** pick the forces and distances, derive each work; for the two-step pick the final distance first, so the first step recovers a clean distance.
**Working:** one line per force ("work done by the engine = driving force × distance"), then the total with the statement of 4.4 item 4.
**Acceptance:** A van of mass 1400 kg is driven 2.4 km along a road with a driving force of 900 N against a resistance of 350 N, and the road falls 15 m. Work by the engine = **2 160 000 J**; by gravity = 1400 × 9.8 × 15 = **205 800 J**; against resistance = 350 × 2400 = **840 000 J**.
**Traps:** using the distance along the road for gravity (it needs the height); a km not converted; adding work by and against.

#### 5.5 Variable Force (`variable`), 3 levels

**For:** work = ∫ f(x) dx; finding a constant or a limit; a driving force against a resistance that varies with distance, then the speed by the work-energy principle.
**Styles:** S64 to S69. **Diagram:** D12 (the shaded area) for the integral questions; D1 for the vehicle questions.
**Levels:** 1 integrate a polynomial or kx between limits · 2 other forms (square root, trigonometric with limits in π, 1/x) and find a constant k (with its units) or a limit from the work · 3 a constant driving force against a variable resistance, from rest, then the speed (S65, S68); the two-variable case solved numerically (S69).
**QO:** *Force Form* (multiple tickable: polynomial · power kx^n · square root · trigonometric · reciprocal) · *Ask for* (work · constant k · a limit · a speed · a stopping distance) · *Answer Format* (decimal · exact form with ln).
**Generator (equations first):** pick f and the limits, **integrate with the shared symbolic helper**, and check the answer with a numerical integrator (the validator); for "find k" pick k first; for "find the limit exactly" pick the limit and derive the work as ln or a rational. The cubic (S69) is generated by choosing the stopping point first.
**Working:** the integral written out, the antiderivative in brackets, the limits substituted, then (Level 3) the work-energy equation.
**Acceptance:** Work by f(x) = 3x² + 2 from x = 1 to x = 4 is [x³ + 2x] = (64 + 8) − (1 + 2) = **69 J**. A 800 kg vehicle from rest has a constant driving force of 600 N and a resistance of 0.02x² N; after 90 m: work by driving force 54 000 J, against resistance 0.02 × 90³ ÷ 3 = 4860 J, so ½ × 800 × v² = 49 140 and **v = 11.1 m s⁻¹**.
**Traps:** forgetting the lower limit; sign of the work against resistance; units of k (N m⁻¹ for kx).

---

### Tool 2: Energy

#### 5.6 Kinetic and Potential Energy (`kepe`), 3 levels

**For:** evaluating KE = ½mv² and GPE = mgh, finding a mass, a speed or a height, a loss or a gain between two states, and KE with velocity vectors (A2).
**Styles:** S16 to S18, S20, S25 to S29, S39 to S41. **Diagram:** D4 for height; D3 for the slope (A2); none for the plain evaluations.
**Levels:** 1 find the KE or the GPE · 2 find the mass, the speed or the height; km h⁻¹, tonnes, grams, cm · 3 a loss or gain between two states (speeds in km h⁻¹; PE on a slope, A2; velocity vectors i and j, A2).
**QO:** *Energy* (kinetic · gravitational potential) · *Ask for* (energy · mass · speed · height · change in energy) · *Setting* (vertical · slope, A2) · *Velocity As* (a speed · a vector, A2) · *Units Given* · *Answer Format* (J · kJ; speed in m s⁻¹ or km h⁻¹) · *g*.
**Generator:** pick the state(s), derive the energy; for "find the speed" pick v and derive KE, with the negative root rejected explicitly in the working (S26).
**Working:** formula → convert (km h⁻¹ ÷ 3.6, tonnes × 1000) → substitute → answer; for vectors, speed² by Pythagoras first.
**Acceptance:** A 1.2 tonne car at 72 km h⁻¹: v = 20 m s⁻¹, KE = ½ × 1200 × 20² = **240 kJ**. A 3.5 kg mass raised 14 m gains 3.5 × 9.8 × 14 = **480 J** (3 s.f.). Vectors (A2): speed² goes from 3² + 4² = 25 to 4.5² + 4.5² = 40.5; with 2000 kg the gain is ½ × 2000 × 15.5 = **15.5 kJ**.
**Traps:** v² as (v²) in the vector case (use speed², not the vector); km h⁻¹ left unconverted.

#### 5.7 Work-Energy Principle (`workenergy`), 3 levels

**For:** work done by the total force = change in KE: horizontal motion with driving and resistive forces; finding a speed, a distance, a resistance or a braking force; the same with gravity on a vertical drop or a slope when the method is "work done by gravity".
**Styles:** S22, S30 to S33, S35 to S38, S46 to S50, S98, S100. **Diagram:** D1 for level ground, D3 for slopes, D14 (energy bars) as the working picture; D6 for the pulley case.
**Levels:** 1 a constant force from rest over a distance, find the speed or the distance (horizontal) · 2 resistance and braking: find the force from a speed change over a distance (bullet, train, car), mass in tonnes and grams, speeds in km h⁻¹ · 3 with gravity: a slope or a fall with driving and resistive forces, find a speed, a resistance, a distance, or the work done by a rider over several stages; A2: friction on a slope and projection up a rough slope.
**QO:** *Setting* (horizontal · vertical · slope A2) · *Ask for* (speed · distance · resistance or braking force · work done by the driver · angle of a slope A2) · *Method* (work done by gravity · GPE and KE; only for vertical and slope settings) · *Forces* (driving force only · resistance only · both) · *Units Given* · *Answer Format*.
**Generator:** pick the states (u, v), the distance and the resistive force, derive the missing force or work so the equation balances; for the slope setting pick d, α and the forces, then the speeds follow; guard that KE stays positive.
**Working:** the work-energy equation (textbook Key point: total work = ½mv² − ½mu²), each work term on its own line, then the solve. With *Method: GPE and KE* the working writes the combined equation (4.4 item 5) and omits work done by gravity.
**Acceptance:** A truck of 8 tonnes slows from 54 to 36 km h⁻¹ (15 to 10 m s⁻¹) over 200 m against a 1500 N resistance. Loss of KE = ½ × 8000 × (15² − 10²) = 500 000 J = (B + 1500) × 200, so the braking force **B = 1000 N**. A cyclist and bicycle (80 kg) start at 9 m s⁻¹ up a road, 400 m long, rising 18 m, with driving force 60 N and resistance 25 N: KE_final = ½ × 80 × 81 + 35 × 400 − 80 × 9.8 × 18 = 3128 J, so **v = 8.84 m s⁻¹**.
**Traps:** sign of the work done against gravity going up and down; using the slope length for gravity; the resistive force on the wrong side of the equation.

#### 5.8 Conservation of Energy (`conserve`), 3 levels

**For:** only gravity does work: GPE + KE is constant. Fall and projection, speeds, the maximum height, a slide or chute with a starting speed, on a vertical drop or a slope (A2).
**Styles:** S21, S23, S24, S34, S42 to S45, S99. **Diagram:** D4, D3 (A2), D14.
**Levels:** 1 a drop from rest, find the speed or the height · 2 projected with a starting speed up or down: the speed after a height, the maximum height, the multi-part chain KE → PE lost → KE at the bottom → speed (S42) · 3 a slide, chute or plane (A2 slope) given by length or by drop, speed after a distance, how far before stopping.
**QO:** *Setting* (vertical · slope A2) · *Starts* (from rest · projected down · projected up) · *Ask for* (final speed · maximum height · speed after a given height · distance along a slope) · *Parts Shown* (one answer · the chain a, b, c, d) · *Context* (ball, stone, skier, package, jumper) · *g*.
**Generator:** pick h₁, h₂ (or d and α), u, derive v from `½mv² = ½mu² + mg(h₁ − h₂)`; the chain mode asks KE, PE lost, KE at the bottom and the speed as lettered parts.
**Working:** the equation `GPE₁ + KE₁ = GPE₂ + KE₂`; the zero level is stated; the mass cancels and the working says so when the mass is not asked for.
**Acceptance:** A 0.2 kg ball is thrown vertically up at 18 m s⁻¹: maximum height = 18² ÷ (2 × 9.8) = **16.5 m**. Its speed at 6 m above the start: v² = 324 − 2 × 9.8 × 6 = 206.4, **v = 14.4 m s⁻¹**.
**Traps:** the zero level; the same quantity used as a distance along the slope and a height.

---

### Tool 3: Elastic Strings and Springs

#### 5.9 Hooke's Law (`hooke`), 3 levels

**For:** T = kx and T = λx/l; strings and springs (a thrust in a spring); the extension from a length; equilibrium: a mass hanging, a horizontal force, two strings.
**Styles:** S70 to S74, S91. **Diagram:** D7 (horizontal), D8 (hanging), D9 (two strings).
**Levels:** 1 find the tension or thrust from the natural length, the modulus and the length · 2 find k or λ, an extension or compression, or the force from a given compression; a mass hanging in equilibrium · 3 two strings in equilibrium (parallel, then to two points A and B, A2 resolving by the cosine rule and components).
**QO:** *Setting* (horizontal spring · hanging · two parallel strings · two strings to two points A2) · *Ask for* (tension or thrust · extension or compression · stiffness k · modulus λ · distance below the support) · *Given As* (length · extension) · *Spring or String* (a spring can be compressed) · *Units Given* (cm, g).
**Generator:** pick λ, l and the extension, derive the tension; for hanging pick m, l, λ and derive x = mgl/λ; two strings: pick D and the two moduli so mg is shared.
**Working:** the extension is written as `length − natural length` as its own line; `T = λx/l`; equilibrium `T − mg = 0`. For two strings at A2: the cosine rule for angles, resolve horizontally then vertically.
**Acceptance:** λ = 90 N, l = 1.5 m, length 1.9 m: x = 0.4, **T = 24 N**. A 0.8 kg mass hangs from a string with l = 0.6 m and λ = 40 N: x = (0.8 × 9.8 × 0.6) ÷ 40 = **0.118 m**.
**Traps:** using the whole length for x; the compression of a spring; units cm to m.

#### 5.10 Elastic Potential Energy (`epe`), 2 levels

**For:** EPE = λx²/2l or kx²/2; the work done stretching between two lengths; finding the modulus or a length from EPE or the work.
**Styles:** S75 to S77. **Diagram:** D7.
**Levels:** 1 EPE for a given extension, or from a length · 2 work between two lengths (difference of squares), find λ or a length from the work or the EPE.
**QO:** *Ask for* (EPE · work between two lengths · modulus · length) · *Spring or String* · *Units Given*.
**Generator:** pick λ, l, x₁, x₂, derive the work; for the inverse pick the answer first.
**Working:** extensions as their own step; `(λ/2l)(x₂² − x₁²)`; the common-error caption (difference of squares, not square of the difference) appears as a *Tip*, never as part of the model answer.
**Acceptance:** λ = 60 N, l = 0.8 m, stretched from 1.0 m to 1.3 m (extensions 0.2 and 0.5): work = (60 ÷ 1.6)(0.5² − 0.2²) = 37.5 × 0.21 = **7.875 J** (7.88 J to 3 s.f.).
**Traps:** the square of the difference.

#### 5.11 Elastic Energy Problems (`elastic`), 3 levels

**For:** conservation of energy with an elastic term: GPE + EPE + KE; release from a stretched or compressed position, a drop on a string, the position of greatest speed, the acceleration at the lowest point, and (A2) friction, slopes, rope, and several stages.
**Styles:** S78 to S83, S92, S93, S102, S103, S105 to S108. **Diagram:** D7, D8, D10, D14.
**Levels:** 1 a spring or string released on a smooth horizontal table: the EPE, then the speed at the natural length (or at a given distance) · 2 a mass dropped on a string (vertical): the maximum extension (a quadratic), the acceleration at the lowest point, the extension at greatest speed (a = 0), the maximum speed · 3 A2: a rough horizontal surface or rope (friction, several stages), a smooth or rough slope, deriving v² as a function of x, "show that the particle does not reach A".
**QO:** *Setting* (horizontal smooth · vertical · slope A2 · rough horizontal A2) · *Ask for* (speed at the natural length · maximum extension · speed at a point · distance from the support when at rest · acceleration at the lowest point · maximum speed) · *Starts* (stretched, at rest · dropped from the support · held below the support) · *Show That* (a switch: the answer is given and the working proves it) · *g*.
**Generator (equations first):** pick m, l, λ and the release; derive the extension by solving the quadratic from `mg(l + x) = λx²/2l` independently with the shared solver for the **validator**, and pick the starting data so the roots are real and positive; the max-speed case uses the equilibrium extension x = mgl/λ.
**Working:** the energy equation with the **zero terms captioned** (the textbook's WE5.10: KE₁ = KE₂ = 0, EPE₁ = 0 at O), the quadratic with the positive root taken and why, then the acceleration from `T − mg = ma` where asked.
**Acceptance:** A 0.6 kg mass is held on a smooth table with a spring (λ = 120 N, l = 0.5 m) compressed to 0.3 m (compression 0.2 m): EPE = 120 × 0.2² ÷ (2 × 0.5) = **4.8 J**; released, at the natural length ½ × 0.6 × v² = 4.8 gives **v = 4.0 m s⁻¹**. A 2 kg mass dropped from O on a string with l = 1.2 m, λ = 150 N: 62.5x² − 19.6x − 23.52 = 0 gives the maximum extension **x = 0.790 m** and, at the lowest point, a = λx/(lm) − g = **39.6 m s⁻²** upward. Greatest speed: equilibrium extension 0.1568 m, so **v = 5.01 m s⁻¹**.
**Watch:** the widest sub-tool (14 styles). If the Setting pool makes the options unwieldy, split it into "Horizontal Surfaces" and "Vertical and Slopes" (section 9).
**Traps:** distance fallen = natural length + extension; the quadratic's negative root; the wrong zero level.

---

### Tool 4: Power

#### 5.12 Average Power (`avgpower`), 3 levels

**For:** power = work ÷ time; work = power × time; lifts, cranes, climbers, brakes; the pump (a rate of PE plus a rate of KE); and the rocket at constant power (time from `P t = ΔKE`).
**Styles:** S51 to S54, S62 (part a). **Diagram:** D4 or D6 for lifts, D4 with a flow arrow for the pump, none for the plain ones.
**Levels:** 1 average power from a work done (or a mass, a height and a time), in W or kW · 2 work from a power and a time; the brakes (KE loss over time, speeds in km h⁻¹) · 3 the pump (litres to kg; PE per second and KE per second; power of the pump), the rocket (find the time).
**QO:** *Ask for* (power · work · time · mass rate) · *Doing the Work* (lifting · braking · pumping · accelerating) · *Time Given In* (seconds · minutes · hours) · *Answer Format* (W · kW) · *g*.
**Generator:** pick m, h, t (or the rate) and derive P; for the pump pick the flow and heights, derive per-second energies.
**Working:** work (as a named step) → power = work ÷ time; the pump is three lettered steps (PE gain per second, KE gain per second, sum).
**Acceptance:** A crane lifts a 3.2 tonne block 28 m in 40 s: work = 3200 × 9.8 × 28 = 878 080 J, so P = 878 080 ÷ 40 = **22.0 kW** (21 952 W).
**Traps:** a tonne not converted; minutes not seconds; kW and W in the answer.

#### 5.13 Force and Speed (`forcespeed`), 3 levels

**For:** P = Fv; the tractive force; constant speed (driving force = resistance); acceleration at an instant (F = ma); a resistance that depends on the speed (kv, kv^n); a train with carriages.
**Styles:** S55 to S63, S86, S87. **Diagram:** D1 (a car, lorry, cyclist or train with the forces).
**Levels:** 1 find the power, the tractive force or the speed; at constant speed find the resistance · 2 acceleration at an instant: find the acceleration, a resistance, or the speed (a quadratic); increasing the power at constant resistance · 3 resistance kv (find k, the maximum power, the acceleration at another speed); a train of engine plus coaches; (A2) vector displacement and the work done.
**QO:** *Motion* (constant speed · accelerating) · *Resistance* (constant · proportional to speed · proportional to a power of the speed) · *Ask for* (power · tractive force · resistance · acceleration · speed · k · maximum power · maximum speed) · *Units Given* (km h⁻¹, kW, MW) · *Vehicle* (car · lorry · cyclist · train with coaches).
**Generator (equations first):** pick m, v, the resistance and the acceleration, derive T = R + ma and P = Tv; for kv pick k and the maximum speed, derive P_max = k v_max². The "find the speed" question picks the speed first and derives the quadratic's coefficients.
**Working:** tractive force from `P = Tv`, resultant force, then F = ma; "constant speed: the resultant force is zero" as its own caption.
**Acceptance:** A car at a constant 72 km h⁻¹ (20 m s⁻¹) with 36 kW: resistance = 36 000 ÷ 20 = **1800 N**. A 1100 kg car with 30 kW at 15 m s⁻¹ against 900 N: T = 2000 N, a = (2000 − 900) ÷ 1100 = **1.0 m s⁻²**. Resistance 30v: maximum speed 30 m s⁻¹ with power 27 kW gives k = 27 000 ÷ 900 = 30; at full power at 18 m s⁻¹ with m = 1200 kg: T = 1500, R = 540, **a = 0.8 m s⁻²**.
**Traps:** km h⁻¹ left unconverted; power in kW; using the power as the force; the sign of the resultant.

#### 5.14 Power on a Slope (`powerslope`, A2), 3 levels

**For:** P = Fv with resolving: constant speed up or down a slope; the greatest steady speed; the time to reach a speed at constant power (work-energy); the slope angle from the power and acceleration; resistance kv on a slope.
**Styles:** S94, S95, S101, S109. **Diagram:** D3 with the force diagram (D15), always in the worked example.
**Levels:** 1 constant speed up a slope at a given power: find the speed, the power or the resistance · 2 down a slope; the greatest steady speed on a hill at the same power; find the angle from the power, speed and acceleration · 3 time to reach a speed from rest at constant power (work done by the engine = resistance work + KE + PE; time = work ÷ power); resistance kv up a hill (quadratic in v).
**QO:** *Direction* (up · down) · *Ask for* (speed · power · angle · time · maximum speed) · *Angle Given As* (degrees · sin θ) · *Resistance* (constant · kv) · *Units Given*.
**Generator:** pick m, α, R and v; derive T = R ± mg sin α and P = Tv; for the angle question pick α last and compute the power from it.
**Working:** a force diagram, resolving along the slope, then P = Tv; the energy equation for the time question.
**Acceptance:** A 1000 kg car, power 24 kW, resistance 600 N, up a 5° hill: T′ = 600 + 1000 × 9.8 × sin 5° = 1454 N, so speed = 24 000 ÷ 1454 = 16.5 m s⁻¹ = **59.4 km h⁻¹**. A 1200 kg car, 4° incline, resistance 700 N, 30 kW, from rest to 12 m s⁻¹ over 90 m: work by engine = 700 × 90 + ½ × 1200 × 144 + 1200 × 9.8 × 90 × sin 4° = 223 230 J, so **t = 7.44 s**.
**Traps:** the weight component with the wrong trig function; forgetting the resistance when finding T′.

#### 5.15 Power from Motion Data (`motion`), 2 levels

**For:** power = F v where the force and the speed come from a speed–time graph or from a displacement function s(t).
**Styles:** S89, S90. **Diagram:** D13 (speed–time) for the graph form; none for s(t).
**Levels:** 1 s(t) a polynomial: differentiate for v and a, F = ma (with or without a resistance), P at a time · 2 a piecewise speed–time graph: the engine's power while accelerating, at constant speed, and the power of the brakes while slowing.
**QO:** *Data* (a speed–time graph · a displacement function) · *Phase Asked* (accelerating · constant speed · decelerating) · *Resistance* (none · constant).
**Generator:** pick the graph breakpoints (times and speeds) or the polynomial, derive a and v; guards so the phases are positive length and the speeds readable from the graph.
**Working:** read v and a off the graph (a caption names the segment), F = R + ma, P = Fv.
**Acceptance:** s = 2t² + t with a particle of mass 0.4 kg: v = 4t + 1, a = 4, F = 1.6 N; at t = 3, v = 13 and **P = 20.8 W**.
**Traps:** the braking power taken as the whole braking force times speed, forgetting the resistance helps.

---

## 6. What needs to be generated (inventory)

| Artefact | Quantity | Where |
|---|---|---|
| Mechanics core library | formulae, units, solver, rounding | `src/shared/mechanics/` |
| Context library | ~14 contexts with ranges | `src/shared/mechanics/contexts.ts` |
| Wording banks | phrasing sets per style | `src/shared/mechanics/words.ts` |
| Generators | 15 sub-tools | `src/shared/mechanics/gen*.ts` |
| Working builders | the step builders of 4.4, one family per tool | `src/shared/mechanics/working*.ts` |
| Written-working picture | the page a student writes, beside the diagram | the `DimWorking.tsx` pattern |
| Scene model, renderer, 15 templates, glyphs | see `MECHANICS_DIAGRAMS_PLAN.md` | `src/shared/mechanics/` |
| Tool files | 4 | `src/tools/FurtherMechanics/` |
| `.about.ts` words | one per tool: tool purpose, each sub-tool's purpose, one line per level, an explainer per option group (R11) | alongside each tool |
| Registry entries and hub wiring | 4 + `mechanicsSpec.ts` | `src/registry.ts`, `mechanicsSpec.ts` |
| Depth and deck items | section 7 | `src/` Depth banks, `specs/depth/`, `specs/decks/` |
| Tests | re-derivation, acceptance, guards, diagrams, Course | `src/tests/` |
| Docs | FEATURES (`npm run facts`), PATCH_NOTES, pathway progress, the tools dashboard notes | `docs/` |

---

## 7. Not generators: Depth cards and deck slides

These are authored by hand (R33, R34), not generated.

- **Classifying forces:** propulsive or resistive; work done by or against; weight as either, depending on the direction of motion (the textbook introduction). A set of Depth items, each wrong option naming its misconception.
- **Modelling assumptions** (S43 part d): "what did you assume?" (no air resistance, a particle, a light string).
- **The proofs and equation choices:** S84 (work stretching a string by integration), S88 (the work-energy relation from F = ma and v² = u² + 2as), S85 (which energy equation is right: a spot-the-error card).
- **Misconception cards for the traps** listed in section 5 (the angle to the vertical, the square of the difference, the zero level of GPE, km h⁻¹).
- **A "which method?" Depth set** (work-energy, conservation, F = ma, power), the decision students find hardest, and which the single-skill tools cannot teach by themselves.

Rule R44 (never three Depth slides back to back in a deck) and the deck checklist (`docs/design/DECK_BUILD_CHECKLIST.md`) apply when these go into a lesson.

---

## 8. Exam-style questions: out of scope here

Exam-style chains (lettered parts, marks, a mark scheme) are **not part of this programme**. They will be a separate pass, built from **actual past-paper questions** tagged as chains of parts in a corpus (the pattern of `specs/corpus/network-flows.md` and `src/shared/decision/dimExam.ts`), after the skill sub-tools exist. Nothing in sections 3 to 7 generates one. The skill sub-tools are built so that a later chain can call them as parts, but no chain machinery, parts library or mark scheme is built now. The one thing built here that serves both is the diagram system.

---

## 9. Build order, milestones and review points

Each stage ends with something Harry can look at. Nothing goes live until the go-live checklist (the Decision tools' list in `docs/pathways/further-mechanics.md`: exam chains, corpus, validators, phone / tablet / laptop check, then remove `enabled: false`).

| Stage | Builds | Harry reviews |
|---|---|---|
| 0 | `src/shared/mechanics/` core (units, formulae, solver, rounding), the context library, and the tests of 4.7 | the formulae list and the context table |
| 1 | the diagram foundation (`scene.ts`, renderer, labels, forces, dims) and D1 and D4 | **the look of the diagrams at the three sizes and in print** (the single most important review) |
| 2 | **Tool 1 Work Done**, AS sub-tools first: `fd`, `grav`, `several` | question variety, wording, the working layout |
| 3 | D3 and D2; the A2 sub-tools of Tool 1: `angle`, the slope settings; the Course setting | AS and A2 behaviour |
| 4 | `variable` and D12; Tool 2 Energy: `kepe`, `workenergy`, `conserve`; D14 (energy bars); the Method option | the energy picture and the Method option |
| 5 | Tool 4 Power: `avgpower`, `forcespeed`, `powerslope`, `motion`; D5, D6, D13 | the power working |
| 6 | Tool 3 Elastic: `hooke`, `epe`, `elastic`; D7 to D10 | whether `elastic` should split |
| 7 | Depth and deck items (section 7) | the cards |
| 8 | context glyphs (cars, cyclists, trains), polish, calibration, the phone / tablet / laptop check, go-live | the go-live decision |

**Built so far (2026-11-21).** Stage 0 (the core, `src/shared/mechanics/core.ts` and `contexts.ts`) and stage 1 (the diagram system) are done, and **Tool 1 Work Done** is built with all five sub-tools (stages 2, 3 and the `variable` part of 4), behind Developing-tools mode (`/work-done`). **Tool 2 Energy** (`kepe`, `workenergy`, `conserve`) is built too, behind Developing-tools mode (`/energy`); its pulley case, A2 friction on a slope and energy-bar pictures are not yet in. Not yet in Work Done: the slope setting of Several Forces (S97), the cubic stopping-point question (S69) and a stopping-distance ask.

**Sizing.** The core library and the diagram foundation are the largest single pieces; each tool after that is a smaller, repeatable build, because the generators sit on the same library and the same renderer. The diagrams are the biggest risk to the timetable (see their plan, section 9).

**Possible splits.** `workenergy` (16 styles) and `elastic` (14 styles) are the two wide sub-tools. If their option pools become hard to explain (R11) or the Setting pool grows past four values, split: Work-Energy into "Horizontal" and "Slopes and Falls", Elastic into "Horizontal Surfaces" and "Vertical and Slopes". The style lists above split cleanly.

---

## 10. Risks and open questions

- **The decisions of 2.2.** D1 to D7 need Harry's answer before stage 2.
- **Diagram quality and cost** (the diagrams plan, section 9): the largest unknown.
- **Question pools.** Each sub-tool must clear 30 different questions per level at default options (R2). The contexts and the equations-first generation make that easy for the numerical tools; the checks are for the narrow ones (`epe` has only two levels; `motion` is two).
- **The textbook's numbers and wording are not reproduced** here or in any generator. Where a paper-style question is wanted in the later exam pass, it is rebuilt from a style, never copied.
- **AS/A2 boundaries** come from `specs/exam/spec/aqa-mechanics.md`; the textbook's **A** marker identifies A2 content. Where the two differ, the spec wins; confirm each flag in the corpus file before stage 3.
- **The MC4 and MC6 evidence** is a single textbook section and the mixed practice; if a spec statement needs a style the textbook never shows (for example MC4 with a spring in a vertical equilibrium with two masses), the style list is extended before the sub-tool is built.
- **Further Mechanics chapters MB, MD, ME** reuse this machinery (units, the scene model, the written-working picture); nothing here is MC-specific except the formulae and the sub-tools.

---

## 11. Appendix: the acceptance set in one place

Every example from section 5, for the implementer's test file (the numbers are made up for this brief and checked by hand):

| Sub-tool | Given | Answer |
|---|---|---|
| `fd` | 4.2 kN over 0.35 km | 1 470 000 J = 1470 kJ |
| `grav` | 64 kg, 12 000 J against gravity | 19.1 m |
| `grav` (A2) | 48 kg, 120 m along 12° slope | 11 736 J = 11.7 kJ |
| `angle` (A2) | 40 N, 30 m, 900 J, find θ | 41.4° |
| `several` | 1400 kg, 900 N, 350 N, 2.4 km, 15 m fall | 2 160 000 J; 205 800 J; 840 000 J |
| `variable` | f = 3x² + 2, x from 1 to 4 | 69 J |
| `variable` | 800 kg, 600 N, resistance 0.02x², 90 m | 11.1 m s⁻¹ |
| `kepe` | 1.2 tonne at 72 km h⁻¹ | 240 kJ |
| `kepe` | 3.5 kg raised 14 m | 480 J |
| `kepe` (A2) | 2000 kg, (3i+4j) to (4.5i+4.5j) | 15.5 kJ |
| `workenergy` | 8 t, 15 to 10 m s⁻¹, 200 m, 1500 N | braking force 1000 N |
| `workenergy` | 80 kg cyclist up 18 m rise, 400 m | 8.84 m s⁻¹ |
| `conserve` | 0.2 kg at 18 m s⁻¹ upward | max height 16.5 m; 14.4 m s⁻¹ at 6 m |
| `hooke` | λ 90 N, l 1.5 m, length 1.9 m | 24 N |
| `hooke` | 0.8 kg, l 0.6 m, λ 40 N | 0.118 m |
| `epe` | λ 60 N, l 0.8 m, 1.0 m to 1.3 m | 7.875 J |
| `elastic` | spring λ 120 N, l 0.5 m, compressed 0.2 m, 0.6 kg | EPE 4.8 J; 4.0 m s⁻¹ |
| `elastic` | 2 kg dropped, l 1.2 m, λ 150 N | x = 0.790 m; 39.6 m s⁻²; max speed 5.01 m s⁻¹ |
| `avgpower` | 3.2 tonne, 28 m, 40 s | 22.0 kW |
| `forcespeed` | 36 kW at 72 km h⁻¹ | 1800 N |
| `forcespeed` | 1100 kg, 30 kW, 15 m s⁻¹, 900 N | 1.0 m s⁻² |
| `forcespeed` | resistance 30v, v_max 30 m s⁻¹, 27 kW, m 1200 kg, at 18 m s⁻¹ | 0.8 m s⁻² |
| `powerslope` (A2) | 1000 kg, 24 kW, 600 N, 5° | 59.4 km h⁻¹ |
| `powerslope` (A2) | 1200 kg, 30 kW, 700 N, 4°, 0 to 12 m s⁻¹ over 90 m | 7.44 s |
| `motion` | s = 2t² + t, 0.4 kg, t = 3 | 20.8 W |
