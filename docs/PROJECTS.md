# Projects — the plan for everything in flight

The **single planning surface** for the whole repo. Where every prong is up to, what we
*could* do next, and the deep detail behind each.

**How it's laid out.** A scan-able *At a glance* table, then one section per prong. Each
prong has:

- **Where it's at** — the honest current state, in a few sentences.
- **Possible next steps** — *options to spitball from*, not a fixed queue. We pick the right
  one on the day. Prune the ones we've done or ruled out.
- **Detail** — the deep lists (technique audit, skills-by-representation, spec order). Skip it
  for the overview; open it when you actually pick the prong up.

**The loop.** You plan from this doc. When a session ships something, I log *what shipped* to
`docs/PATCH_NOTES.md` (the history) and refresh the prong's **Where it's at** + its *At a glance* row
here. One place you read, one place I record.

**Session kickoffs (on demand, never saved).** When you're firing off several sessions in a
sitting, ask **"kickoff for `<prong>`"** and I'll generate a fresh copy-paste starter block from
that prong's entry — a one-line where-we-are, the exact task we picked, the minimal files to
read, and the verification bar. These are generated fresh each time from the live status here;
we deliberately **don't** store standing prompts (they just rot). The recipe I build them from
lives in `CLAUDE.md` → "Ending a session / session kickoffs".

| For… | See |
|---|---|
| Conventions / how to build | `CLAUDE.md` |
| Shell architecture + contracts | `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` |
| What actually shipped, session by session | `docs/PATCH_NOTES.md` |
| Canonical names for every element | `docs/GLOSSARY.md` |
| Designing a new build in chat (pre-code) | `docs/design/DESIGN_STUDIO.md` + the spec templates |

---

## At a glance

| Prong | Status | One-line |
|---|---|---|
| **Computer Science shell** | 🚧 | Shell done; 2 of ~15 J277 topics authored as data |
| **Decision Maths** | 🚧 | New shell live; first tool (MST) shipped as a thin slice |
| **Techniques engine** | 🚧 | Engine built; only 1 tool converted so far |
| **Skills library** | 🚧 | Engine + backlog ready; 2 skills built |
| **Core representations** | 🚧 | 3 of 6 visual families have Teach scenes |
| **Teach decks** | 🚧 | Engine built; one partial deck exists |
| **SmartGrapher** | ✅ | Mature, embeddable; used in 2 tools |
| **Old-shell migration** | 🚧 | Most tools migrated; a handful remain |

Status keys: ✅ done · 🚧 in progress · ⬜ not started.

---

# Computer Science

An OCR **J277 GCSE Computer Science** revision area. CS tools are **knowledge/revision** tools,
not question generators — a different product from the Maths tools, on their own shell (`CSShell`,
`src/shared/cs/`). Each tool covers a spec sub-topic through six activities: **Learn · Study ·
Cards · Quiz (+ Spot the Mistake) · Fill · Exam** (synoptic questions, self-marking). Guiding
principles: **spec fidelity** (every card/question carries a `specTag`; off-spec content is a
flagged "Beyond spec" layer), **exam realism** (J277 formats + mark tariffs), **mobile-first**.

## CS revision shell

**Where it's at.** The shell is **fully built** — six modes driven by a single `topic` data
object, two representations so far (box schematic, trace table), and a CI validator
(`validateTopic`) that checks every topic. The payoff is proven: **two topics now ship as pure
data files** — 1.1.1 CPU Architecture (the pilot/reference) and 1.1.2 CPU Performance. So the
remaining spec is *authoring*, not engineering. The architecture and extraction steps live in
`docs/architecture/CS_SHELL_PLAN.md`.

**Possible next steps (spitball — pick on the day):**
- Author the next sub-topic as data — **1.1.3 Embedded Systems** is the natural follow-on (mostly definitional, few new diagrams).
- Or do a synoptic partner first — **1.2.1 Primary storage (RAM/ROM)** pairs tightly with 1.1.1 (MAR/MDR ↔ RAM).
- Pull synoptic questions out of individual topic files into a **shared cross-topic bank** keyed by tag-pairs (now worthwhile with >1 topic).
- Build a new representation when a topic demands it (data representation → place-value/number-line; networks → stack/topology).
- Keep the pipeline honest — a `Status: ready` brief in `specs/cs/` before each topic.

**Detail.**

*Built so far:*
- ✅ **1.1.1 CPU Architecture** (`/cpu-architecture`) — the pilot/reference. Full six modes with taught diagram walkthroughs, predict beats, animated data flow, a value trace; exam with MCQ/state/short/scenario/extended + synoptic, self-marking, model answers, command-word guidance.
- ✅ **1.1.2 CPU Performance** (`/cpu-performance`) — authored entirely as a `CSTopic` data object.
- ✅ **1.1 System Architectures** (`/system-architecture`) — the original tool, left in place; superseded in approach by the 1.1.1 rebuild; not on the new shell.

*Spec order to roll through (Component 1, Paper J277/01), each a data topic:*
- ⬜ **1.1.3 Embedded Systems** — mostly definitional.
- ⬜ **1.2.1 Primary storage (RAM/ROM)** — the other 1.1.1 synoptic partner.
- ⬜ **1.2.2–1.2.4 Secondary storage / units / data representation** — data representation needs number-line / place-value representations.
- ⬜ **1.3 Networks**, **1.4 Network security**, **1.5 Systems software**, **1.6 Ethical/legal/environmental** — Networks needs a stack/topology representation; the later strands are largely prose + scenario.

*Representations (the recurring design cost):* existing from 1.1.1 are the **box schematic** (to be generalised) and the **trace table**. Likely additions: **bar-compare** (1.1.2), **place-value/number-line** (data representation), **network stack/topology** (1.3). Budget ~1–2 new representations per *strand*, not per topic.

*Nice-to-haves (deferred):* spaced-repetition / Leitner progress + per-spec-tag mastery, and RAG self-rating — both need a persistence/account layer that doesn't exist yet.

---

# Decision Maths

AQA A-level Further Maths, **Discrete Mathematics** (graphs & networks: MST, TSP, CPA, Dijkstra,
route inspection, flows, LP). A network-native shell (`DecisionShell`, `src/shared/decision/`),
parallel to the others; contracts and the full increment plan live in `docs/architecture/DECISION_SHELL_PLAN.md`.

## Decision tools

**Where it's at.** **Increment 1 shipped** — the first end-to-end slice: pure `NetworkView` +
`MatrixView` renderers, a thin shell with a **Question** mode and a **Solution** stepper
(forward/back through the algorithm one beat at a time, with a running total and a "show all"),
and one tool — **Minimum Spanning Tree** (Kruskal's algorithm). CI checks each tool's solver
against an independent brute-force reference. Deliberately narrow so far: one network template,
one question type, one level.

**Possible next steps (spitball — pick on the day):**
- Broaden MST — add **Prim's** (network walk + Prim-on-the-matrix), more question types (apply Prim from node X, list rejected edges), Levels 1–3, more templates.
- Add the **expand-to-sandbox** — open the generated network in an interactive, annotatable canvas.
- Add **worksheet print** via the existing diagram-print engine.
- Start a **second tool** once MST feels complete — TSP reuses the same renderers; CPA needs two new views.

**Detail.** The full increment ladder (MST breadth → sandbox → print → TSP → CPA → onward) and the
per-strand representation budget live in `docs/architecture/DECISION_SHELL_PLAN.md` → "Increment plan" — that doc owns
the ladder. We're on **increment 1 ✅**; **increment 2 (MST breadth)** is next.

---

# Mathematics — pedagogy engine

Four interlocking prongs. A **skill** is usually a **technique**'s full-grain teaching rendered on
a **representation**; a **Teach deck** strings those together into a lesson. Progress on one often
unblocks the others — so read these together when planning a Maths session.

> **Dev-mode gating.** Most of this is behind Developing-tools mode (`src/devMode.ts`, toggle on
> the landing page). When ON it reveals: `enabled:false` tools (badged **DEV**), the step-by-step
> **Worked Example** (fragment reveal + skill-link overlays), and the **Teach** deck mode. Dev-only
> pages: **Skill Library** (`/skills`), **Technique Library** (`/techniques`), **Grapher Lab**
> (`/grapher`).

## Techniques engine

**Where it's at.** When tools moved onto the shared ToolShell they lost their hand-written working
steps and fell back to thin "jump to the answer" wrappers. The **techniques engine**
(`src/shared/techniques/`) restores that pedagogy *once, reusably* — titled, fragmented,
grain-aware (brief / standard / full) working blocks. The **engine and its viewer (`/techniques`)
are built**, and six techniques exist — but **only one tool (`NonLinearSimEq`) has been
converted**, so most tools still show thin working. The value is real but latent until the sweep
happens.

**Possible next steps (spitball — pick on the day):**
- Add a runtime **"Detailed working" toggle** so a teacher can flip grain (brief ↔ full) live — the one shell change on the list.
- **Sweep more tools** onto the engine — start with the high-frequency moves below.
- Grow the technique library as the sweep needs new moves.
- Add a **CI shape-check** (every method emits ≥N titled steps, no duplicate consecutive lines) once enough tools are converted.
- Close the known medium-grain gaps in `NonLinearSimEq` (the `(2x−5)²` expansion isn't shown; cosmetic `− 1x` should be `− x`) — both need the generator to expose structure, not display strings.

**Detail — techniques built:** `quadraticFormulaSteps` (grain-aware), `solveLinearEquationSteps`
(grain-aware), `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`.
Reference conversion: `NonLinearSimEq.tsx` (uses `standard` grain).

**Detail — the technique audit (build backlog; start high-frequency).** Status: ✅ built · 🚧 partial · ⬜ needed.

*Algebra & cross-cutting*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | **high** | 🚧 grain-aware version exists |
| `expandBrackets` | single / double / squared brackets (FOIL, grid) | **high** | ⬜ |
| `substitute` | substitute a value/expression into an equation or formula | **high** | 🚧 substitute-back only |
| `collectLikeTerms` | gather like terms | med | ⬜ |
| `makeSubject` / rearrange | rearrange for one variable | med | 🚧 brief only |
| `factoriseQuadratic` | factorise → set factors to zero → roots | med | 🚧 read-the-roots half exists |
| `quadraticFormula` | formula → substitute → discriminant → roots | med | ✅ |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | low | ⬜ |
| `solveByElimination` | scale, add/subtract to eliminate | med | ⬜ |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | low | ⬜ |

*Number*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `simplifyFraction` | divide num & den by a common factor | **high** | ⬜ |
| `fractionOfAmount` | ÷ by denominator, × by numerator | **high** | ⬜ |
| `convertMixedImproper` | mixed ⇄ improper | med | ⬜ |
| `addSubtractFractions` | common denominator (LCM), add/subtract, regroup | med | ⬜ |
| `multiplyDivideFractions` | keep-flip-change, multiply across | med | ⬜ |
| `roundToSigFig` | round each value to 1 s.f. | med | ⬜ |

*Ratio & Proportion*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `shareInRatio` | total parts → 1 part → each share | **high** | ⬜ |
| `convertFractionRatio` | fraction ⇄ ratio | med | ⬜ |
| `simplifyRatio` | divide parts by a common factor | med | ⬜ |
| `unitPriceCompare` | price ÷ quantity, compare | low | ⬜ |
| `scaleRecipe` | scale ingredients by a factor | low | ⬜ |

*Geometry*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line/point | **high** | ⬜ (diagram tools — the reasoning IS the move) |
| `gradientIntercept` | gradient formula, `y = mx + c`, solve for c | med | ⬜ |
| `circleFormula` | circumference / area / arc / sector | med | ⬜ |

~24 candidates, six built. Frequency concentrates on a handful — `solveLinearEquation`,
`expandBrackets`, `substitute`, `simplifyFraction`, `collectLikeTerms`, `makeSubject`,
`shareInRatio`, `fractionOfAmount`, `applyAngleFact` — build those first; each doubles as a needed
skill. Old-shell rows (`fractionOfAmount`, `convertFractionRatio`, `applyAngleFact`) are inferred —
confirm the exact moves when those tools migrate.

## Skills library

**Where it's at.** Small slide-sequences that each teach **one prerequisite skill**
(`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill-id|term]]`
links in worked examples. **Two skills exist** (`lcm`, `lcm-prime-factors` — LCM two ways). CI
validates every skill. A clear backlog is tied to which representation each skill needs — the cheap
ones sit on scenes that already exist; the rest wait on the representation work below.

**Possible next steps (spitball — pick on the day):**
- Build the **cheap, high-value cluster** on existing scenes — equivalent-fractions, simplify-fraction, HCF, share-in-ratio, fraction-of-amount, convert-mixed-improper.
- Sequence the skills that need a **new scene** (solve-linear-equation, expand-double-brackets, directed-number) alongside the representation work.
- **Unify skills with techniques** — let a skill's full teaching and a technique's full output share one source, so they can't drift; prototype on one skill.
- **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.

**Detail — skills to develop** (a skill is the drill-down teaching for a prerequisite a tool *uses
but doesn't teach*; the representation column signals effort — existing scene = cheap).

| Skill (id) | Teaches | Representation / scene | Priority | Status |
|---|---|---|---|---|
| `lcm` / `lcm-prime-factors` | lowest common multiple | number line `multiples`; prime tiles `factorTree`/`primeVenn` | — | ✅ |
| `equivalent-fractions` | scale num & den by the same factor | **bar model** `split`/`equivalents` *(exist)* | **high** | ⬜ |
| `simplify-fraction` | divide num & den by the HCF | **bar model** *(exists)* | **high** | ⬜ |
| `hcf` | highest common factor | **prime tiles** `primeVenn` *(exists)* | **high** | ⬜ |
| `share-in-ratio` | total parts → 1 part → each share | **bar model** *(exists)* | **high** | ⬜ |
| `fraction-of-amount` | ÷ by denominator, × by numerator | **bar model** *(exists)* | **high** | ⬜ |
| `solve-linear-equation` | do the same to both sides | **algebra tiles** / number line *(no tile scene yet)* | **high** | ⬜ |
| `expand-double-brackets` | grid / area of each term pair | **area model** *(no scene yet)* | **high** | ⬜ |
| `collect-like-terms` | group matching terms | **algebra tiles** *(no scene yet)* | med | ⬜ |
| `convert-mixed-improper` | mixed ⇄ improper fraction | **bar model** *(exists)* | med | ⬜ |
| `round-to-significant-figure` | find the place value, round | **number line** *(exists)* | med | ⬜ |
| `factorise-quadratic` | find the factor pair | **area model** *(no scene yet)* | med | ⬜ |
| `substitute-into-formula` | replace letters with values | *(none — text)* | med | ⬜ |
| `rearrange-formula` | inverse operations to change subject | *(none — text / algebra tiles)* | med | ⬜ |
| `simplify-ratio` | divide parts by a common factor | **bar model** *(exists)* | med | ⬜ |
| `directed-number` | add/subtract/multiply negatives | **negative counters** *(no scene yet)* | med | ⬜ |
| `factor-pairs` | list the factor pairs of n | **prime tiles** *(exists)* | low | ⬜ |

Build the cheap cluster (top six after `lcm`) first — all on existing bar-model / prime-tile scenes,
each a prerequisite several tools link to. The equally-wanted `solve-linear-equation`,
`expand-double-brackets`, `collect-like-terms`, `factorise-quadratic`, `directed-number` need a **new
scene type**, so sequence them with the representation work.

## Core representations

**Where it's at.** The site commits to **six core visual representations** as a shared vocabulary,
so the same bar model a student meets in fractions reappears in ratio. New visuals must reuse one of
the six; new scenes extend an existing `TeachScene` family in `TeachingDeck.tsx`. **Three have
animated scene families built**: bar model (`split`/`combine`/`equivalents`), number line
(`multiples`), prime factor tiles (`factorTree`/`primeVenn`). **Three don't yet.** These are the
biggest lever on the Maths side — each new representation unlocks a cluster of skills and decks.

**Possible next steps (spitball — pick on the day):**
- Build an **area-model** scene family (unlocks expanding brackets, completing the square, factorising).
- Build **algebra-tile** scenes (the manipulative exists at `/algebra-tiles`, but no scenes) — unlocks solving equations, collecting like terms.
- Build **negative counters** (no manipulative or scenes yet) — unlocks directed number, used almost everywhere.
- Prioritise by **blockage** — pick the representation gating the most wanted skills, not by novelty (area model and negative counters each gate several).

**Detail — the six and their scene status.** Bar model ✅ (`split`/`combine`/`equivalents`) · number
line ✅ (`multiples`) · prime factor tiles ✅ (`factorTree`/`primeVenn`) · area model ⬜ (no scenes) ·
algebra tiles ⬜ (manipulative only) · negative counters ⬜ (nothing yet). Prime tiles are coloured by
the prime (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink) so the same prime looks the same everywhere;
composites stay plain numbers. Adding a scene type: extend the `TeachScene` union, add its beat count
to `sceneMaxStep`, render it in `SceneView` — animate opacity/transform only, reserve space for
everything (the standing scene contract).

## Teach decks

**Where it's at.** A slide-based "teaching part of the lesson" (`TeachingDeck`), dev-gated. The
**engine is built and proven** — hand-authored, misconception-driven slides the teacher presses
through one beat at a time. **Content is the thin part**: only `FractionsAddSub` has a deck, and
only its *Concepts* category (an I-do → We-do → You-do sequence on equivalent fractions). Its other
two categories (True/False, Spot the Mistake) are stubbed "Coming soon", and no other tool has a
deck yet. So the open question is less "what to build" and more "what proves the format".

**Possible next steps (spitball — pick on the day):**
- Deepen the exemplar — fill out FractionsAddSub's remaining categories so one deck is complete end-to-end.
- Or prove breadth — author a first deck for a *different* tool, to test the format on another topic.
- Sketch a deck for a non-fraction topic (angles, ratio) to check the scene library actually covers it.
- Reconsider what categories a deck should even have — the current three (Concepts / True-False / Spot-the-Mistake) are a starting guess, not settled.
- Decide the bar for **coming out from behind the dev gate** (`showTeach` in `ToolShell.tsx`) — needs ≥1 genuinely classroom-ready deck.

**Detail.** Authoring guide is in `CLAUDE.md` → "Teaching slides". Slides are specific, hand-authored,
misconception-driven — *not* generated (the varied side is what Whiteboard/Worksheet are for). Prefer
I-do → We-do → You-do within a category on one coherent example. Reference: `FractionsAddSub.tsx`
(`TEACHING_SLIDES`).

---

# Mathematics — tools & utilities

## SmartGrapher

**Where it's at.** A **mature**, embeddable, data-driven graph component (`src/shared/grapher/`)
with its own test bench at `/grapher`. Live in two tools (Mixed Strategies L3 lower-envelope,
NonLinearSimEq two-curves-plus-intersection) and **self-validating** — it derives the graph from the
answer data and refuses to draw if they disagree, so a data inconsistency omits the graph rather than
drawing wrong geometry. Less a "project", more a reusable utility to reach for.

**Possible next steps (spitball — pick on the day):**
- Add graphs to more tools — **Equations of Lines** (lines/gradients/intercepts), **Completing the Square** (parabola + vertex), **Iterations** (the curve and the root being approached).
- Add an **ellipse preset** if/when a tool needs ellipse-and-line (presets today: linear · quadratic · cubic · circle · custom).
- Mostly: pull it in opportunistically when building or migrating any coordinate/quadratic tool.

## Old-shell migration

**Where it's at.** Older tools hand-roll their own UI (~800–1,300 lines); v2.3 tools use the shared
ToolShell (~250–350). **Most are migrated**, and `src/tests/organisation.test.ts` is the CI-enforced
source of truth for which tool is on which shell. A few remain: one user-facing tool and a few
dev-gated ones. Migration is also the natural moment to add techniques-based working and, where
relevant, a graph and `__test` coverage.

**Possible next steps (spitball — pick on the day):**
- Migrate the remaining enabled tool — **`FractionToRatio`**.
- **Decide finish-vs-delete** on the dev-gated leftovers (`IntegerAddSub`, `SimplifyingRatiosTool`, `PerimeterTool`).
- Pair each migration with a **techniques pass**, so a tool regains its pedagogy, not just the shell.

**Detail.** Enabled/done: `FractionsOfAmounts`, `AnglesInTriangles`, `NonLinearSimEq`, `PowersOfTen`
(techniques wiring still to add on some). Standalone by design (never migrate): the Generators,
`SystemArchitecture`, `AlgebraTiles`, `ParallelLinesInteractive`, `GrapherLab`, `Visualiser`,
`CallSelector`, `p-value`, `SkillLibrary`, `TechniqueLibrary`. `organisation.test.ts` holds the
authoritative lists — update it when a tool moves.

---

*Keeping this current: when a session moves a prong, update its **Where it's at** line and its *At a
glance* row here, alongside the `docs/PATCH_NOTES.md` history entry. Next-step bullets are spitball — prune
the done/ruled-out ones. Keep the deep tables above accurate as work lands.
(Standing authoring principles — e.g. "never store the same fact twice" — live in `CLAUDE.md`, not here.)*
