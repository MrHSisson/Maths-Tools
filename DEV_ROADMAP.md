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

### Technique audit — the backlog of moves

Candidate techniques extracted from the working steps of all published tools
(`mStep` step-titles by grep for v2.3 tools; the 3 old-shell tools' moves inferred
from topic and to be **confirmed on migration**). This is the build backlog for the
engine above — start with the high-frequency rows. Status: ✅ built · 🚧 partial · ⬜ needed.

Method: `grep -hoE 'mStep\(\s*[\`"'"'"']...' src/tools` gives the raw move vocabulary;
the same move is worded many ways (`Expand:` / `Expand brackets:` / `Expand the
square brackets:`), so the clustering below normalises them.

**Algebra & cross-cutting**

| Technique | Move | Used by (tool · sub-tool) | Priority | Status |
|---|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | SolvingLinearEquations, EquationsOfLines, CompletingTheSquare, SimEq | **high** | 🚧 `solveLinearEquationSteps` (grain-aware) exists |
| `expandBrackets` | expand single / double / squared brackets (FOIL, grid) | ExpandingBrackets, CompletingTheSquare, SolvingLinearEquations, SimEq | **high** | ⬜ |
| `substitute` | substitute a value/expression into an equation or formula | SimEq, EquationsOfLines, NonLinearSimEq, CompletingTheSquare | **high** | 🚧 `substituteBackSteps` exists (substitute-back only) |
| `collectLikeTerms` | gather like terms | CollectingLikeTerms, ExpandingBrackets | med | ⬜ |
| `makeSubject` / rearrange | rearrange an equation for one variable | SimEq, EquationsOfLines, NonLinearSimEq | med | 🚧 `makeSubjectSteps` exists (brief only) |
| `factoriseQuadratic` | factorise → set factors to zero → roots | CompletingTheSquare, NonLinearSimEq | med | 🚧 `solveFactorsSteps` (read-the-roots half) exists |
| `quadraticFormula` | formula → substitute → discriminant → roots | NonLinearSimEq (+ any quadratic) | med | ✅ `quadraticFormulaSteps` (grain-aware) |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | CompletingTheSquare | low | ⬜ (self-contained; good skill) |
| `solveByElimination` | scale equations, add/subtract to eliminate | SimultaneousEquations | med | ⬜ |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | Iterations | low | ⬜ |

**Number**

| Technique | Move | Used by | Priority | Status |
|---|---|---|---|---|
| `simplifyFraction` | divide num & den by a common factor | FractionsAddSub, FractionMultDiv | **high** | ⬜ (foundational sub-move) |
| `fractionOfAmount` | ÷ by denominator, × by numerator | FractionsOfAmounts *(old shell)* | **high** | ⬜ |
| `convertMixedImproper` | mixed ⇄ improper fraction | FractionsAddSub, FractionMultDiv | med | ⬜ (shared sub-move) |
| `addSubtractFractions` | common denominator (LCM), add/subtract, regroup | FractionsAddSub | med | ⬜ (already links `[[lcm]]`) |
| `multiplyDivideFractions` | keep-flip-change, multiply across | FractionMultDiv | med | ⬜ |
| `roundToSigFig` | round each value to 1 s.f. | Estimation | med | ⬜ (foundational) |

**Ratio & Proportion**

| Technique | Move | Used by | Priority | Status |
|---|---|---|---|---|
| `shareInRatio` | total parts → 1 part → each share | RatioSharingTool | **high** | ⬜ |
| `convertFractionRatio` | fraction ⇄ ratio | FractionToRatio *(old shell)* | med | ⬜ |
| `simplifyRatio` | divide parts by a common factor | FractionToRatio, SimplifyingRatiosTool *(dev)* | med | ⬜ |
| `unitPriceCompare` | price ÷ quantity, compare | BestBuys | low | ⬜ |
| `scaleRecipe` | scale ingredients by a factor | RecipesTool | low | ⬜ |

**Geometry**

| Technique | Move | Used by | Priority | Status |
|---|---|---|---|---|
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line/point | AnglesInTriangles *(old shell)*, BasicAngleFacts, AnglesInQuadrilaterals, AnglesInParallelLines | **high** | ⬜ (diagram tools — the reasoning IS the move) |
| `gradientIntercept` | gradient formula, `y = mx + c`, solve for c | EquationsOfLines | med | ⬜ |
| `circleFormula` | circumference / area / arc / sector | CircleProperties | med | ⬜ (self-contained) |

**Reading of the audit:** ~24 candidate techniques; six exist in some form. Frequency
concentrates on a handful — `solveLinearEquation`, `expandBrackets`, `substitute`,
`simplifyFraction`, `collectLikeTerms`, `makeSubject`, `shareInRatio`,
`fractionOfAmount`, `applyAngleFact`. Build those first; they cover most tools and
each doubles as a needed skill (§2). Old-shell rows (`fractionOfAmount`,
`convertFractionRatio`, `applyAngleFact`) are inferred — confirm the exact moves when
those tools migrate (§6).

---

## 2. Skills library

Small slide-sequences that each teach ONE core skill (`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill-id|term]]` markers.

**State:** 🚧 only two skills exist — `lcm` (from times tables) and `lcm-prime-factors`. CI validates every skill.

**Next:**
- ⬜ **Skill ⇄ technique unification** — a skill's `full`-grain teaching and a technique's `full` output are the *same pedagogy*. Let a skill embed a technique's `full` steps as its (text) spine so there is one source; the skill layers visuals on top. Prototype on one skill.
- ⬜ **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.

### Skills to develop

Derived from the technique audit (§1): a skill is the drill-down teaching for a
prerequisite a tool *uses but doesn't teach*. The **Representation / scene** column
also signals effort — skills on an existing scene family are cheap; those needing a
new scene type (area model, negative counters) cost more (§3). Many of these ARE a
technique's `full` grain — build the two together. Status: ✅ done · ⬜ needed.

| Skill (id) | Teaches | Needed by | Representation / scene | Priority | Status |
|---|---|---|---|---|---|
| `lcm` / `lcm-prime-factors` | lowest common multiple | add/subtract fractions | number line `multiples`; prime tiles `factorTree`/`primeVenn` | — | ✅ |
| `equivalent-fractions` | scale num & den by the same factor | add/subtract fractions, simplify fraction, fraction↔ratio | **bar model** `split`/`equivalents` *(exist)* | **high** | ⬜ |
| `simplify-fraction` | divide num & den by the HCF | fractions, ratios | **bar model** *(exists)* | **high** | ⬜ |
| `hcf` | highest common factor | simplify fraction, simplify ratio, factorise | **prime tiles** `primeVenn` *(exists)* | **high** | ⬜ |
| `share-in-ratio` | total parts → 1 part → each share | RatioSharingTool | **bar model** *(exists)* | **high** | ⬜ |
| `fraction-of-amount` | ÷ by denominator, × by numerator | FractionsOfAmounts | **bar model** *(exists)* | **high** | ⬜ |
| `solve-linear-equation` | do the same to both sides | SolvingLinearEquations, EquationsOfLines, SimEq | **algebra tiles** or number line *(tiles: no scene yet)* | **high** | ⬜ |
| `expand-double-brackets` | grid / area of each term pair | ExpandingBrackets, CompletingTheSquare, SimEq | **area model** *(no scene yet)* | **high** | ⬜ |
| `collect-like-terms` | group matching terms | CollectingLikeTerms, ExpandingBrackets | **algebra tiles** *(no scene yet)* | med | ⬜ |
| `convert-mixed-improper` | mixed ⇄ improper fraction | FractionsAddSub, FractionMultDiv | **bar model** *(exists)* | med | ⬜ |
| `round-to-significant-figure` | find the place value, round | Estimation | **number line** *(exists)* | med | ⬜ |
| `factorise-quadratic` | find the factor pair | CompletingTheSquare, NonLinearSimEq | **area model** *(no scene yet)* | med | ⬜ |
| `substitute-into-formula` | replace letters with values | EquationsOfLines, SimEq, iteration | *(none — text)* | med | ⬜ |
| `rearrange-formula` | inverse operations to change subject | EquationsOfLines, SimEq | *(none — text / algebra tiles)* | med | ⬜ |
| `simplify-ratio` | divide parts by a common factor | FractionToRatio, SimplifyingRatiosTool | **bar model** *(exists)* | med | ⬜ |
| `directed-number` | add/subtract/multiply negatives | expand, solve, substitute (everywhere) | **negative counters** *(no scene yet)* | med | ⬜ |
| `factor-pairs` | list the factor pairs of n | hcf, factorise | **prime tiles** *(exists)* | low | ⬜ |

**Build order.** The cheap, high-value cluster first — `equivalent-fractions`,
`simplify-fraction`, `hcf`, `share-in-ratio`, `fraction-of-amount`,
`convert-mixed-improper` — all sit on the **existing bar-model / prime-tile scenes**,
and each is a prerequisite several tools link to. `solve-linear-equation`,
`expand-double-brackets`, `collect-like-terms`, `factorise-quadratic` and
`directed-number` are equally wanted but need a **new scene type** (area model,
algebra-tile or negative-counter scenes — §3), so they cost more; sequence them with
that scene work.

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
