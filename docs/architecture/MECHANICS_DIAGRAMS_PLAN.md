# Mechanics diagrams — architecture plan

**Status:** draft (2026-11-20); the foundation (stage 1) is being built, in new files only, with no question generators. Written from the 109 question styles in `specs/corpus/mechanics-mc-question-styles.md`.

**Read when:** building or extending any Further Mechanics tool that shows a picture of a body, a surface, a string or spring, a force or a graph. The tools that need it are listed in `specs/further-mechanics-mc.md`. Read `docs/reference/pictures.md` first (the eight core representations, the shape model, how diagram tools print).

## 1. Why this is its own piece of work

Mechanics questions are nearly all pictures: in the 109 styles gathered so far, **most need a diagram** (the inventory below maps them), and the diagram is what turns a wordy question into one a student can start. The picture also carries the working: forces are named, positions are labelled, and a step such as "the component of the weight down the slope" must point at a thing on the screen.

The geometry tools already show the pattern (a question holds `_diagram` data; one renderer draws it at worksheet, whiteboard and worked-example sizes; a shared handler prints it). Mechanics needs the same pattern with a different vocabulary, drawn once and reused by all four tools and by exam chains, decks and Depth cards.

**Principle: one scene model, one renderer, a few template builders.** A generator never draws. It fills in a small set of numbers; a template builder turns them into a *scene*; the renderer draws any scene. A new diagram is a new template builder, not a new renderer.

## 2. What has to be drawn (the inventory)

Fifteen templates cover the 109 styles (style ids in brackets). A style may use more than one.

| # | Template | Shows | Styles served |
|---|---|---|---|
| D1 | **Horizontal motion** | a body on level ground with the driving, resistive and weight/normal forces, a distance marker, start and end points; variants: car, lorry, cyclist, crate, train (engine plus coaches) | S01, S02, S07, S08, S10, S19, S30–S33, S35, S36, S55–S60, S65, S68, S86, S87 |
| D2 | **Force at an angle** | the force drawn at θ to the direction of motion, with the θ arc and the resolved component F cos θ (and F sin θ) | S11–S14, S96, S97 |
| D3 | **Incline** | a body on a slope with the angle α to the horizontal, the distance along the slope, the vertical height gained, and any forces (weight and its components, driving, resistance, tension, friction) | S15–S18, S20–S24, S34, S37, S38, S45, S94, S95, S97–S100, S101, S109 |
| D4 | **Vertical motion** | a ground (datum) line, heights h₁ and h₂, the body at each position, the starting speed u and final speed v | S03–S05, S09, S39–S45, S47, S51 |
| D5 | **Path profile** | a hill-and-valley or layered profile (air then water) with labelled heights and distances for a multi-stage journey | S06, S49 |
| D6 | **Pulley or lift** | a string over a pulley with a load, a crane or a lift cage | S47, S51 |
| D7 | **Horizontal spring or string** | a fixed wall or point, the natural length l, the extension or compression x, the mass, the position names A, O, B | S70–S72, S75–S78, S102, S107, S108 |
| D8 | **Vertical string snapshot** | a fixed point O, the string at its natural length, in equilibrium and at its lowest point, with the mass at each position and the levels marked | S73, S79–S83, S105, S106 |
| D9 | **Two strings** | two strings to a mass: parallel (one fixed point), or to two points A and B on a level with the angles α and β | S74, S91 |
| D10 | **String on a slope** | a string fixed at A on an incline, the mass at B and C, the natural length and the positions | S92, S93, S103 |
| D11 | **Two particles through a hole** | a particle on a rough table joined over an edge to a hanging particle | S104 |
| D12 | **Force–displacement graph** | f(x) against x with the area shaded between x₁ and x₂ | S64–S67, S69 |
| D13 | **Speed–time graph** | a trapezium or piecewise graph with labelled speeds and times | S90 |
| D14 | **Energy bars** | KE, GPE and EPE as stacked bars at two or three positions, with the work done between them | the working for S21–S24, S34, S42–S50, S78–S83, S92–S93, S105–S108 |
| D15 | **Force diagram** | the body as a particle with every force labelled and resolved components, drawn on request (a step "draw a clearly labelled diagram") | S91, S94, S95, S97, S109, and any worked solution |

Not drawn: plain formula items with no set-up (S25 to S27, S39 to S41 in their simplest form), proofs (S84, S88), and the classification and modelling items, which are Depth or deck cards.

**D14 is the one new core representation.** `docs/reference/pictures.md` asks that a new representation has a reason: the energy-bar picture is the book's own device for conservation of energy ("the sum of KE and GPE stays the same, so a loss in one is a gain in the other"), it carries MC2, MC3, MC6 and the mixed problems, and no existing representation fits (the bar model is for parts of a whole, not for a quantity that changes form). It joins the list of core representations when it is built.

## 3. The scene model

A scene is plain data, in schematic units (not metres), so it can be tested, mirrored, serialised into a question, and drawn at any size.

```ts
// src/shared/mechanics/scene.ts  (sketch of the contract)
type Pt = { x: number; y: number };

interface Scene {
  w: number; h: number;                 // viewBox, e.g. 500 x 320
  elements: Element[];                  // drawn in order
  mirrored?: boolean;                   // the whole scene flipped left to right
}

type Element =
  | Ground | Incline | Datum            // surfaces and levels
  | Body                                // block, particle, car, lorry, train, cyclist, person, ball, sledge, cage
  | Spring | StringEl | Pulley | Hole   // elastic things and the pieces they pass over
  | Force                               // an arrow: kind, label, angle, from a body anchor
  | Motion                              // a velocity or acceleration arrow
  | Dim                                 // a dimension line: a distance, a height, the natural length l, the extension x
  | Arc                                 // an angle mark with its label
  | Marker                              // a named point A, B, C, O, with a small dot or tick
  | Graph                               // D12 and D13
  | EnergyBars;                         // D14

interface Base { id: string; reveal?: number; focus?: string[] } // reveal: the step at which it appears; focus: names a step can light
```

Every element carries `reveal` (the working step at which it appears) and a stable `id`, so a worked example **builds the picture as the working goes on**: the slope first, then the weight arrow, then its component along the slope, then the height. This is the same idea as `Focus` in the shape drawing (`src/shared/shapes/drawing.ts`) and the `step` tag in `SmartGrapher`; the renderer lights what a step names.

### Schematic, not to scale

Mechanics diagrams in the textbook and the papers are schematic: arrow length is never the force. The renderer treats lengths and angles this way:

- **Angles are drawn true** (an incline at 15° is drawn at 15°, clamped to between 10° and 80° so it stays readable). A student who measures it should not be misled.
- **Force arrows** have fixed lengths by kind; a driving force is not longer because it is bigger. Where a *comparison* is the point (tension against weight at equilibrium), the template may scale arrows, and says so with a note "not to scale" turned off.
- **Natural length and extension** (D7, D8) are drawn in proportion, clamped so the extension is always visible and never more than three times the natural length.
- **Distances along a path** are drawn in proportion only when two are compared in the question (e.g. 15 m and 5 m on a profile).

## 4. Components (what gets built, in order)

All of it under `src/shared/mechanics/`, with the tools importing from there and `shared/` never importing from `tools/`.

| File | Job |
|---|---|
| `scene.ts` | the types above, plus `mirrorScene`, a bounding-box calculator and a validator |
| `bodies.tsx` | the body glyphs: particle (dot), block, car, lorry, train (engine plus coaches), cyclist, climber, child on a slide, ball, sledge, boat, crane block or lift cage. Each is drawn in a unit box with named **anchors** (centre, base, front, top) so forces attach the same way to every glyph. Exam questions model everything as a particle: a block or dot is the default and a context glyph is an option |
| `surfaces.tsx` | ground with hatching, the incline (with its angle and the right-angle mark at the foot), the datum line, the table edge and the hole for D11 |
| `elastics.tsx` | the spring (coils), the string (a plain line, with a natural-length mark and an extension stretch), the pulley and the cord over it |
| `forces.tsx` | arrows with a head, an optional double head for the resultant, a label, an angle arc, a resolved-component pair drawn dashed; **a fixed colour and line style per kind** (below) |
| `dims.tsx` | dimension lines with end ticks and a label pill (distance, height, natural length, extension), placed parallel to the thing measured and clear of everything else |
| `graphs.tsx` | D12 and D13: axes, a curve or polyline, the shaded area, labelled values |
| `energyBars.tsx` | D14 |
| `labels.ts` | label placement. Reuse the approach and the code of `src/shared/shapes/labels.ts` (candidate spots around each anchor, collision tests against segments and boxes); do not write a second solver |
| `templates/` | one builder per template D1 to D15: `buildHorizontal(params) → Scene`, and so on. Each documents its parameters, what it randomises and its mirroring rule |
| `MechDiagram.tsx` | the one renderer: scene in, `<svg>` out; honours `reveal`, `focus` and `showAnswer`; sizes by the `compact` rule in `pictures.md` (worksheet ~180px, whiteboard ~340px, worked example ~500px) |
| `print.ts` | the SVG data-q-index wiring so the existing shared print handlers work (see below) |

### Force kinds: colour is never the only cue

| Kind | Colour | Line | Always labelled as |
|---|---|---|---|
| Weight | slate | solid | `mg` or the value (N) |
| Driving or tractive force | green | solid | `T`, `D` or the value |
| Resistance, friction | red | solid | `R`, `F` or the value |
| Tension, thrust | blue | solid | `T` or `T₁`, `T₂` |
| Normal reaction | grey | solid | `R` |
| Resolved component | same colour as its force | dashed | `F cos θ`, `mg sin α` |
| Velocity or acceleration | black | double line or open head | `v`, `a`, `u` |

Every arrow has a text label as well as its colour and style, and a black and white print keeps all of these distinct.

## 5. Randomisation, mirroring and clarity

- **Mirroring.** Every template can flip left to right (the motion goes either way), so questions do not all look the same. Labels flip with it and the text never mirrors.
- **Which things vary per question:** the body glyph, the direction, the slope angle (inside its clamp), the positions named (A and B, P and Q, X and Y), and whether the unknown is shown as `?`, `x` or a letter.
- **Which things never vary:** the force colours, the label conventions, the unit of the label (N, m, m s⁻¹).
- **Labels placed by search, not by hand,** with a hard rule that no label overlaps an arrow, a dimension line or another label. A scene that cannot place all its labels is rejected and re-drawn with a different mirror or angle; the renderer **never silently drops a label**.
- **Labels the student must find stay as `?` or a letter** until Show answer (as in the geometry tools).

## 6. Where each picture shows

- **Question:** the scene with its givens and the unknown as `?`.
- **Worked example:** the same scene built up by `reveal`, one thing per step, beside the written working; the answer lands on the picture last.
- **Whiteboard and worksheet:** the scene at the sizes in the table; printed through the shared diagram print, with a printed mark scheme drawing the answer values on it.
- **Exam style (a later, separate pass from actual past papers):** a lettered part could name a template and a reveal stage, and parts that continue the story keep the same scene and add to it. Nothing for this is built now.
- **Decks and Depth:** the same scene can be embedded in a slide (see `docs/reference/decks.md`); a deck authors a scene from the same builders.

The question stores its scene (`_diagram`, `extras(q)._diagram`) so the print and the step views read the same object, and the diagram is **derived from the numbers by the template builder**, never stored twice (rule R5): change the mass and the label changes.

## 7. Tests and checks

- **Geometry:** a drawn angle equals the scene's angle; a dimension line is parallel to what it measures; every anchor lies inside the viewBox.
- **Rendering, many seeds:** each template builds and draws for 200 random parameter sets, both mirrors, each size, with no throw and no unplaced label.
- **Label clarity:** no label rectangle intersects another label, an arrow or a dimension line (reuse `segHitsRect` and `rectGap`).
- **Consistency with the numbers:** the labels shown equal the question's numbers; a "find" quantity shows `?` until the answer is revealed.
- **Print:** the SVG carries `data-q-index`, no fixed pixel height, prints in black and white with every force still identifiable (R31 in `CLAUDE.md`).
- **Layout:** checked by hand at phone (390×800), tablet (1180×820 and 820×1180) and laptop (1366×768); diagrams use `useLayoutMode()` and never read the window width themselves.

## 8. Build order for the diagrams

The diagram work is staged so each stage unblocks a tool, and none is built ahead of the tool that needs it.

1. **Foundation:** `scene.ts`, `MechDiagram.tsx`, `labels.ts`, `forces.tsx`, `dims.tsx`, `surfaces.tsx`, particle and block glyphs. Prove it end to end on **D1 Horizontal motion** and **D4 Vertical motion** (they serve Force and Distance, Work and Gravity, Kinetic and Potential Energy: the first tool and a half).
2. **D3 Incline and D2 Force at an angle:** the A2 layer of Work Done, then the slope settings of Energy and Power.
3. **D14 Energy bars:** with the Energy tool, as the working picture for conservation.
4. **D5 Path profile, D6 Pulley, D12 and D13 graphs:** Several Forces, Variable Force, Power from Motion Data.
5. **D7 to D10 elastic scenes:** the Elastic tool; D8 and D10 are the hardest (several positions in one frame).
6. **D11 and the context glyphs** (car, lorry, cyclist, train…): last; they are polish on a working picture.

A reasonable first review point: **after stage 1, show Harry the D1 and D4 scenes at the three sizes, in print, before anything else is drawn.** The look is decided there, once.

## 8b. What is built so far (2026-11-20, `src/shared/mechanics/`, no question generators)

**Templates built:** D1 horizontal motion, D4 vertical motion, D7 spring or elastic string on a horizontal table, D8 spring or elastic string hanging (one to three positions). Not yet: D2, D3, D5, D6, D9 to D15.

**Elements:** surfaces (ground, wall, ceiling, datum), bodies (block, particle, faint ghost copies), force arrows, dimension lines, angle arcs, named points, level lines, **springs and strings** (a coil for a spring, a plain blue line for an elastic string, a plain dark line for a string, and a `slack` curve for a string that is not taut) and pulleys.

**Adding a picture by parts (a developing picture).** Every element belongs to a named *part* (`part`), and the scene lists its parts in natural build order (`parts`): for the horizontal template "the ground and the body", "the motion", "the forces", "the distance moved". A tool decides when each part appears:

```ts
const scene = buildInOrder(buildHorizontal(params), ["setting", "measure", "forces"]); // one part per working step
<MechDiagram scene={scene} step={k} />                                                  // the first k parts; the newest has a warm band
```

`stageParts(scene, { forces: 3 })` sets the step of chosen parts only, `stepCount(scene)` says how many steps the picture needs, and `partsAt(scene, k)` says what is on show (for a caption such as "now add the forces"). Labels are **placed once for the whole picture**, so nothing moves as parts are added.

**Whether the diagram is given.** One rule, `displayStep(display, view)`, wrapped by the `MechPicture` component:

| `display` | With the question | At working step k | With the answer |
|---|---|---|---|
| `given` (the question supplies its diagram) | the picture (parts at step 0; a part the working adds, such as a resolved component, is held back) | the picture plus the parts added by step k | all of it, answer values shown |
| `build` (no diagram given: it is drawn up as the working goes on) | nothing | the parts added by step k | all of it |
| `hidden` (a words-only question) | nothing | nothing | nothing |

A tool sets `display` from its Question Option, so the same question can be a diagram question or a words question.

## 9. Risks and open decisions

- **Glyph quality.** Hand-drawn SVG pictograms of cars, cyclists and trains can look amateur. Mitigation: the default is the exam convention (a block or a dot), glyphs are options, and each glyph is a small simple silhouette in one stroke colour. Harry decides whether the glyphs are worth the effort after seeing D1.
- **Label collisions in D8 and D10,** which stack several positions and several dimensions in one frame. Mitigation: build those last, with the placement solver proven on D1 to D4, and allow the template to widen the viewBox.
- **Two pictures per question** (the diagram and the written working) compete for room on a phone. Mitigation: the decided pattern from Dimensional Analysis (one scrolling page on a phone, the diagram first, the working below).
- **Do we draw a force diagram for every question,** or only on request (D15)? Proposal: on request, and always in the worked example for resolving questions (A2).
- **Whether the diagram is part of the question or the answer** in skill tools: proposal: always part of the question where the question is about a physical set-up; never for pure-formula items (a plain "find the KE of 1.2 t at 72 km h⁻¹" needs no picture).
