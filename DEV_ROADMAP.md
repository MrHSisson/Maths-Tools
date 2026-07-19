# Dev Roadmap — Maths Tools

The working reference for everything **in development** behind Developing-tools mode.
Pick this up to see what's being built, what state it's in, and where to start next.
Status keys: ✅ done · 🚧 in progress · ⬜ not started.

> Conventions, APIs and how-to-build-a-tool live in `CLAUDE.md`. This file is the
> *roadmap* — what's unfinished and what's next. Keep it current as work lands.

---

## Developing-tools mode — what it gates

A global switch (`src/devMode.ts`, `mt-dev-mode` in localStorage; toggle on the
landing page). When ON it reveals:

- Tools registered `enabled: false` (landing page shows them, badged **DEV**).
- The step-by-step **Worked Example** mode in every ToolShell tool (fragment reveal + skill-link overlays).
- The **Teach** slide-deck mode (only where a tool supplies `teachingSlides`).

**Dev-only pages** (registered `enabled: false`, reached from the landing page in dev mode or by direct URL):

| Page | Path | Purpose |
|---|---|---|
| Skill Library | `/skills` | Browse skill slide-sequences (drill-downs behind `[[skill\|term]]`) |
| Technique Library | `/techniques` | Browse working-step techniques, rendered at each grain |
| Grapher Lab | `/grapher` | Test bench for the embeddable SmartGrapher |

---

## 1. Working steps & the Techniques engine

**Why:** when tools moved onto the shared ToolShell, each tool's hand-authored
working steps were lost and replaced by thin wrappers that jumped straight to
answers (generic titles, no substitution shown, a duplicated "Solution" line). The
techniques engine restores per-tool pedagogy *once, reusably*.

**The engine** (`src/shared/techniques/`):
- ✅ `workings()` builder — mandatory titles, `.use(techniqueBlock)`, drops consecutive-identical lines (bans the "restate the answer" duplicate).
- ✅ Technique blocks return titled + fragmented `WorkingStep[]`. Fragments = one *built-up line* (equals-chain); separate lines = separate steps.
- ✅ **Grain** (`brief / standard / full`) — the same move at three levels of detail. `full` is the fundamental teaching pattern (= the text spine of the matching skill); `brief` assumes it. Author-set per call.
- ✅ Viewer at `/techniques` shows each grain-aware technique at all three grains.

**Techniques so far:** `quadraticFormulaSteps` (grain-aware), `solveLinearEquationSteps` (grain-aware), `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`.

**Reference implementation:** ✅ `NonLinearSimEq.tsx` — the only tool converted so far. Its `buildWorking` runs through the builder + techniques (uses `standard` grain).

**Next:**
- ⬜ **Runtime grain toggle** (approved fast-follow) — a "Detailed working" QO switch in ToolShell so a teacher can flip brief↔full live. This is the one shell change on the roadmap.
- ⬜ **Sweep the other tools** onto the builder + techniques (see migration backlog §6). This is where the *other* migrated tools get their lost pedagogy back.
- ⬜ **Structured input for `full` grain.** Techniques that take pre-built strings from a generator (the sim-eq rearrange/solve chains) can only go as deep as the strings allow. Going `full` there needs the *generator* to expose structure (coefficients, not display strings). Decide tool-by-tool.
- ⬜ **Grow the technique library** as the sweep needs new moves (expand brackets, simplify fraction, collect like terms, share in a ratio, …).
- ⬜ **CI shape-check** — assert every method question emits ≥N titled steps and has no duplicate consecutive lines. Hold until enough tools are converted (a global assert would flag the un-converted ones).

**Known medium-grain gaps in NonLinearSimEq** (need generator structure to fix):
- ⬜ "Expand and rearrange to equal zero" jumps to the collected quadratic — the `(2x−5)²` expansion isn't shown.
- ⬜ Cosmetic `− 1x` (should be `− x`) in some parabola expansions.

---

## 2. Skills library

Small slide-sequences that each teach ONE core skill (`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill-id|term]]` markers.

**State:** 🚧 only two skills exist — `lcm` (from times tables) and `lcm-prime-factors`. CI validates every skill.

**Next:**
- ⬜ **Author more skills** for the prerequisites tools link to (equivalent fractions, factorise a quadratic, solve a linear equation, rearrange to make x the subject, …).
- ⬜ **Skill ⇄ technique unification** — a skill's `full`-grain teaching and a technique's `full` output are the *same pedagogy*. Let a skill embed a technique's `full` steps as its (text) spine so there is one source; the skill layers visuals on top. Prototype on one skill.
- ⬜ **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.

---

## 3. Core representations & Teach scenes

The six core representations (bar model, number line, area model, algebra tiles,
negative counters, prime factor tiles) are the site's visual vocabulary — see
CLAUDE.md. New visuals must reuse one; new scenes extend an existing `TeachScene`
family in `TeachingDeck.tsx`.

**State:** scene families exist for bar model (`split`/`combine`/`equivalents`),
number line (`multiples`), prime factor tiles (`factorTree`/`primeVenn`).

**Next:**
- ⬜ Area model — no scenes yet (multiplication, expanding brackets, completing the square).
- ⬜ Algebra tiles — manipulative exists (`/algebra-tiles`), no scenes.
- ⬜ Negative counters — planned, no manipulative or scenes.

---

## 4. Teach decks (the "Teach" mode)

Slide-based teaching part of a lesson (`TeachingDeck`), gated behind dev mode.

**State:** 🚧 only `FractionsAddSub` has a deck, and only its **Concepts** category
(I-do → We-do → You-do on equivalent fractions). **True or False** and **Spot the
Mistake** are empty ("Coming soon").

**Next:**
- ⬜ Author True/False and Spot the Mistake for FractionsAddSub.
- ⬜ Add decks to more tools.
- ⬜ **Remove the dev gate** (`showTeach` in `ToolShell.tsx`) once a deck is classroom-ready.

---

## 5. SmartGrapher — the embeddable graph

`src/shared/grapher/` — an embeddable canvas graph (curves, regions, intersections). Its own tests; test bench at `/grapher`.

**Integrated in:**
- ✅ `MixedStrategies` (Level 3 lower-envelope plot).
- ✅ `NonLinearSimEq` — two curves + intersection points (the solutions). **Self-validating**: only draws when the stored solutions genuinely lie on the derived curves, so a data inconsistency omits the graph rather than drawing wrong geometry.

**Limitations / notes:**
- Presets are `linear · quadratic · cubic · circle · custom`. **No ellipse preset**, so ellipse-and-line questions carry no graph.
- The self-validating guard is the pattern to reuse: derive the graph from the answer data and refuse to draw if they disagree.

**Next — candidate tools to add a graph to:**
- ⬜ `EquationsOfLines` / `Properties of Line Equations` — lines, gradients, intercepts.
- ⬜ `CompletingTheSquare` — parabola + vertex.
- ⬜ `Iterations` — the curve and the root being approached.
- ⬜ Any future quadratic/coordinate tool.

---

## 6. Tool migration backlog (old shell → v2.3 ToolShell)

Old tools hand-roll their own shell (no `<ToolShell>`); v2.3 tools use the shared shell. Migration is also the moment to add the techniques-based working (§1) and, where relevant, a graph (§5) and `__test` coverage.

**Enabled/live (user-facing — higher priority):**
- ⬜ `src/tools/Proportion/FractionsOfAmounts.tsx`
- ⬜ `src/tools/Proportion/FractionToRatio.tsx`
- ⬜ `src/tools/Geometry/AnglesInTriangles.tsx`
- ✅ `src/tools/Algebra/NonLinearSimEq.tsx` — done (reference for techniques + grapher).

**Dev-gated (`enabled: false`) — lower priority; decide finish-vs-delete:**
- ⬜ `IntegerAddSub`, `PowersOfTen`, `SimplifyingRatiosTool`, `PerimeterTool`.

**Standalone by design (never migrate):** the Generators, `SystemArchitecture` (quiz), `AlgebraTiles`, `Visualiser`, `CallSelector`, `p-value`, `SkillLibrary`, `TechniqueLibrary`, `GrapherLab`.

**Test coverage:** ✅ `RatioSharingTool`, `AnglesInParallelLines`, `EquationsOfLines` had `__test` added this cycle. Every migrated tool must keep its `__test` export.

---

## 7. Data-integrity principle (lesson from the NonLinearSimEq banks)

The Level-3 question banks stored several independently-authored answer fields
(surd-y, numeric-y, decimals) that had drifted out of sync — the grapher exposed it.
Fixed by **deriving every representation from one computation** (`bankToFormQuestion`
recomputes surds/decimals/points from `A,B,disc,linM,linD`).

**Principle:** never store the same fact twice. Derive surd ⇄ decimal ⇄ numeric ⇄
graph from a single source so they cannot disagree. Apply when authoring any new
answer data.

---

## Suggested starting points

1. **Runtime "Detailed working" grain toggle** (small, high-value, unblocks classroom use of grain).
2. **Migrate one user-facing old-shell tool** (`FractionsOfAmounts` or `AnglesInTriangles`) onto techniques — proves the sweep pattern and grows the library.
3. **Skill ⇄ technique unification** on one skill — closes the single-source-of-pedagogy loop.
