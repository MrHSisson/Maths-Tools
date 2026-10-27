# Projects — the plan for everything in flight

The **single planning surface** for the whole repo: where every prong is up to, and what we *could* do next. It is current state and
options, not history — what shipped, session by session, is in `docs/PATCH_NOTES.md`.

**What counts as a prong.** A *development prong* is a feature or capability we build once and roll out across tools (or a strand we
build up). **Ongoing practice** (reviewing each tool, making everything work on a phone) is not a prong. **Paused** work lives on the back
bench (`docs/BACKBENCH.md`).

**How it's laid out.** *How the work is organised*, an *At a glance* table, the ongoing practices, then one section per prong, each with
**Where it's at** (the honest current state) and **Possible next steps** (options to spitball from, not a queue — prune the done ones).

**The loop.** You plan from this doc. When a session ships something, log *what shipped* in `docs/PATCH_NOTES.md` and refresh the
prong's **Where it's at** and its *At a glance* row here.

**Session kickoffs (on demand, never saved).** Ask **"kickoff for `<prong>`"** and a fresh copy-paste starter block is built from that
prong's entry (one-line where-we-are, the exact task, the minimal files to read, the verification bar). Standing prompts are deliberately
not stored — they rot. The recipe is in `CLAUDE.md` → "Ending a session / session kickoffs".

Status keys: ✅ done · 🚧 in progress · ⬜ not started · ⏸ paused (deliberately not a current priority).

---

| For… | See |
|---|---|
| Conventions / how to build | `CLAUDE.md` |
| What is loose and what to tidy first (current priority) | `docs/TIDY_UP.md` |
| Shell architecture + contracts | `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` |
| Paused work (Skills library, Teach decks) | `docs/BACKBENCH.md` |
| What actually shipped, session by session | `docs/PATCH_NOTES.md` |
| Canonical names for every element | `docs/GLOSSARY.md` |
| Designing a new build in chat (pre-code) | `docs/design/DESIGN_STUDIO.md` + the spec templates |
| Every tool's live state and what it has | the Tools dashboard (`/admin`, Developing-tools mode) |

---

## How the work is organised

1. **Current priority — the tidy-up.** Tidy, fix and level what exists before adding anything: `docs/TIDY_UP.md`.
2. **Development prongs** — features and strands we build and roll out: **Techniques engine** · **Worked solutions** · **Smart Progressor** ·
   **Depth** · **Lessons and Teach decks** · **Core representations** · **Sandboxes & viewports** · **Slides**.
3. **Strands** — areas of the site that stand on their own: **Pure Maths (A-level)**, **Computer Science**, **Decision Maths** (with its own prong below, **Decision exam-style questions**),
   **Maths word games**.
4. **Ongoing practice** — the **Tool review cycle** and the **mobile / narrow view**.
5. **Back bench** — the **Skills library** (see `docs/BACKBENCH.md`).

Stand-alone tools with no prong: the **Visualiser** and the four PDF **Generators**. Old-shell migration is **closed** (backlog empty;
CI-guarded by `organisation.test.ts`).

---

## At a glance

| Prong / strand | Status | One line |
|---|---|---|
| **Tidy-up** | 🚧 current priority | Inventory written (`docs/TIDY_UP.md`); small fixes done (2026-10-24); 2026-10-25: the level (i) is on every tool, colour schemes removed, Question Options keep the question; 2026-10-26: question underscore fields typed (`QuestionExtras`), option labels on one vocabulary, registry ids and strand homes settled (the list is now decisions and the bigger jobs) — what remains is the bigger decisions |
| **Techniques engine** | 🚧 | Engine and library built; ten techniques; used by Surds, Simultaneous Equations (Substitution, dev-only branch) and Angles in Triangles; most tools still hand-roll their working |
| **Worked solutions** | 🚧 | Step-by-step reveal is live for every ToolShell tool; the developing picture and the closing answer step are rolling out tool by tool (Matrix → Developing picture) |
| **Smart Progressor** | ✅ one mechanism | Calibration: eight tools score each question and order worksheets easy to hard (Matrix → Calibrated); option weights are retired; a few variety pools are `balanced` |
| **Depth** | ✅ live where a tool has a bank | Shared mode; banks on Order of Operations, Rounding (incl. Identify Sig. Figs), Speed, Distance & Time and Indices (Matrix → Depth) |
| **Decks** | 🚧 Developing-tools only | Whole-lesson decks at `/decks/<id>` with a slide editor (type on the slide, equation editor, smart guides, align, click order) and the site's own pieces (boards, practice questions, question grids, Depth items); decks and edits shared between devices; first deck is Estimation (with a new Depth bank); next: core representations, teach from it and refine |
| **Slides** | 🚧 to decide | Four surfaces play slides (Teach tab, lesson decks, the Depth stage, skill slides); `SlideDeck` is the shared core; which survive is the open question |
| **Lessons and Teach decks** | 🚧 Developing-tools only | Indices (2 lessons) and Rounding (2 lessons); a Teach tab on Fractions +/−; nothing live yet |
| **Core representations** | 🚧 | Eight representations; negative counters built as a component and a sandbox; signed bar model and double number line not started |
| **Sandboxes & viewports** | 🚧 | Algebra Tiles, Negative Counters and Parallel Lines Explorer live; Grapher Lab dev-gated; SmartGrapher is a viewport in three tools |
| **Pure Maths (A-level)** | 🚧 | Factor Theorem, Partial Fractions and Binomial Expansion live; exam-style parts and a class review of Binomial Expansion to come |
| **Computer Science** | ⏸ | Revision shell with two live topics as data (CPU Architecture, CPU Performance); procedural generators live (Binary Operations, Number Bases, Data Units, Binary Counting, File Sizes) |
| **Decision Maths** | 🚧 | Live: Minimum Spanning Tree, Critical Path Analysis, Network Flows (three tabs Developing-tools only). Dev-gated: Travelling Salesperson, Route Inspection, Mixed Strategies, Network Sandbox (going live through the exam-style prong) |
| **Decision exam-style questions** | 🚧 | Exam chains built for Critical Path Analysis and Network Flows (parts library + recipes); Minimum Spanning Tree, Travelling Salesperson, Route Inspection and Mixed Strategies still to get them, which is also their route to go-live (2026-10-26) |
| **Maths word games** | 🚧 | Words Bingo live; Hangman and Pairs built, dev-gated |
| **Tools dashboard** | ✅ | `/admin`: facts read from the code, shared notes, kinds, List / Matrix / Next up views; Developments, Features and Build guide pages show content only (2026-10-25) |
| *Tool review cycle* | ♻ ongoing | Per-tool notes; not a prong |
| *Mobile / narrow view* | ♻ standing rule | Shipped for every tool |
| *Skills library* | 🪑 bench | See `docs/BACKBENCH.md` |

---

# Ongoing practice

## Tool review cycle

**Not a prong** — a review each tool goes through when we reach it, so we think about what is best for *that* tool instead of working to
one global backlog.

- **Each tool has its own note** — its page in Harry's planner, and its notes on the Tools dashboard — with a **Review** block.
- **The Review block asks:**
  - Content: new question types, broader sub-tool coverage, scope the tool should grow into?
  - Readiness: should it be live, stay gated, or change its level / option structure?
  - Sandbox fit: would a sandbox viewport (tiles, counters, graph) help, and does it integrate cleanly?
  - Techniques: which technique blocks would replace hand-rolled working?
  - Worked solution: does the last step state the answer; is there a developing picture that fits?
  - Smart Progressor: is it calibrated, and does a harder-looking boolean belong in a rung pool?
  - Mobile: checked on a narrow viewport?
- **The standard to review against:** `CompletingTheSquare` and `AnglesInQuadrilaterals` for shell wiring and shared print, `RatioManipulation` and
  `RatioSharingTool` for content quality.
- Which tools are live, in development or hidden is on the dashboard, not here. The tools that are not live (the Decision tools) go live through the Decision exam-style questions prong below; the old
  tidy-up item for them is closed (`docs/TIDY_UP.md`, Settled decisions).

## Mobile / narrow view

**Not a prong — a standing rule, always considered.** Every tool must work on a phone. ToolShell and DecisionShell swap to a
click-through launcher (mode → topic → difficulty) with a breadcrumb, a fixed bottom bar (New question + Options), a full-screen Options
sheet and a docked Worked Example stepper, at zero per-tool cost. New bespoke renderers and sandboxes must be checked at phone width before
shipping; tablet (641–1180px, or touch up to 1400px) uses the same model laid out landscape. Outstanding checks live in each tool's
Review block. Still needs a real-phone pass overall.

---

# Development prongs

> **One gate.** **Developing-tools mode** (`src/devMode.ts`, the landing-page toggle) reveals everything not live: `enabled: false` tools
> (including the Skill Library), Teach decks and lessons, the Technique Library, Grapher Lab and a few tabs inside live tools. A tool is
> live or not live; non-tool routes (the Tools dashboard, technique previews) are `PAGES` in the registry.

## Techniques engine

**Where it's at.** The engine (`src/shared/techniques/`) restores titled, fragmented, grain-aware (brief / standard / full) working
blocks once, reusably. Ten techniques exist: `quadraticFormulaSteps`, `solveLinearEquationSteps` (optional `unit`), `solveFactorsSteps`,
`substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`, and the four surd techniques (`simplifySurdSteps`, `collectLikeSurdsSteps`,
`expandSurdBracketsSteps`, `rationaliseDenominatorSteps` — all genuinely three-grain). Each has a preview page at
`/techniques/<slug>`, listed in the Technique Library (`/techniques`, dev-gated). Three tools use it: **Surds** (all four, at full grain
at every level), **Simultaneous Equations (Substitution)** and **Angles in Triangles** (solving at full grain with a degree unit). Most tools
still show hand-rolled or thin working.

**Known gaps.**
- The answer-step split (`splitAnswerStep`) only recognises the full-grain inline chain; the technique should mark its own result as the answer.
- No `collectLikeTerms` or angle-facts technique yet; `GRAIN` is a per-tool constant until a grain toggle exists.
- Simultaneous Equations (Substitution) still keeps its hand-rolled chain (`legacySolvePos` / `legacySolveNeg`) for everyone and shows
  the technique-based chain only in Developing-tools mode, pending review. The `(2x−5)²` expansion is never shown (the data model has nowhere to
  hold it).

**Possible next steps.**
- A runtime **"Detailed working" toggle** so a teacher can flip grain live — the one shell-level change on the list.
- Sweep more tools onto the engine, high-frequency moves first (below); add a CI shape-check once enough tools are converted.

**Technique backlog** (status ✅ built · 🚧 partial · ⬜ needed). Frequency concentrates on a handful — `solveLinearEquation`, `expandBrackets`,
`substitute`, `simplifyFraction`, `collectLikeTerms`, `makeSubject`, `shareInRatio`, `fractionOfAmount`, `applyAngleFact`.

| Technique | Move | Priority | Status |
|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | **high** | 🚧 built; adopted by Angles in Triangles; needed by Solving Linear Equations |
| `expandBrackets` | single / double / squared brackets (FOIL, grid) | **high** | ⬜ needed by Expanding Brackets and Simultaneous Equations (Substitution); needs a general-term arg shape (the surd version exists) |
| `substitute` | substitute a value or expression into an equation | **high** | 🚧 substitute-back only |
| `collectLikeTerms` | gather like terms | med | ⬜ Collecting Like Terms, Expanding Brackets, Solving Linear Equations |
| `makeSubject` | rearrange for one variable | med | 🚧 brief only |
| `factoriseQuadratic` | factorise → set to zero → roots | med | 🚧 read-the-roots half exists |
| `quadraticFormula` | formula → substitute → discriminant → roots | med | ✅ |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | low | ⬜ |
| `solveByElimination` | scale, add or subtract to eliminate | med | ⬜ Simultaneous Equations (Elimination); cheaper than a fresh build |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | med | ⬜ Iteration's three sub-tools map almost 1:1 |
| `simplifyFraction` · `fractionOfAmount` | divide by a common factor; ÷ denominator, × numerator | **high** | ⬜ |
| `convertMixedImproper` · `addSubtractFractions` · `multiplyDivideFractions` | mixed ⇄ improper; common denominator; keep-flip-change | med | ⬜ |
| `roundToSigFig` | round each value to 1 s.f. | med | ⬜ Estimation |
| `directedNumberAddSub` · `scaleByPowerOfTen` | jump by sign rules; shift the digits | low | ⬜ |
| `percentageOfAmount` · `percentageChange` · `reversePercentage` | multiplier / chunking; build from 100 ± %; unitary method | med | ⬜ Percentages |
| `shareInRatio` | total parts → 1 part → each share | **high** | ⬜ Ratio Sharing |
| `convertFractionRatio` · `simplifyRatio` | fraction ⇄ ratio; divide parts by a common factor | med | ⬜ |
| `unitPriceCompare` · `scaleRecipe` | price ÷ quantity; scale ingredients | low | ⬜ Best Buys and Recipes need broader specs than these rows |
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line or point | **high** | ⬜ five of the eight Geometry tools; the biggest single demand |
| `gradientIntercept` · `circleFormula` · `sumPerimeter` | gradient and `y = mx + c`; circumference, area, arc, sector; add sides / derive a missing side | low–med | ⬜ |

Rows for tools that have not been converted are inferred demand; confirm the exact moves when each tool is reviewed.

## Worked solutions

**Where it's at.** The solved-example format, delivered by ToolShell's Worked Example mode and the shared `WorkedExampleSteps`; a tool
supplies per-step data and renderers. Built:
- **Step-by-step reveal** — the cascade (earlier steps stay, dimmed) with Show All, and **working-step fragments** that reveal one written mark per press. Live for every ToolShell tool.
- **Developing picture** (`stepVisualRenderer`) — one picture that updates beside (or above) the steps, in three layouts. Which tools have one: Matrix → Developing picture.
- **Graph builds** — SmartGrapher plots and highlights with the working (`graphStep` / `graphStepVisual`).
- **Diagram tools** (`src/shared/diagramSplit.tsx`) — the geometry tools show the diagram in the picture slot, with per-step emphasis on Angles in Triangles.
- **Single answer** — where the last step already states the answer, `hideAnswerStep` shows it in a green ring; a final inline chain also splits into the working plus an **Answer:** step (`splitAnswerStep`).
- **Rewrite-the-line working** (Order of Operations) and the **gradient triangle** (Properties of Line Equations).

**Possible next steps.**
- **A closing answer step for the tools that lack one** — each needs its working to end on the answer first (find them: ToolShell tools without `hideAnswerStep`).
- **More diagram highlighting** for Quadrilaterals, Basic Angle Facts, Parallel Lines, Bearings, Circles and Perimeter (Triangles is the reference).
- Make the answer-step split automatic and grain-robust (see Techniques engine).
- **More pictures:** Iteration and Completing the Square graph builds; a Rounding digit-rule picture; Recipes on a ratio table; fractions and percentages on a bar model; Estimation and fractions on a number line.
- **Sandbox integration** — Algebra Tiles, Negative Counters and SmartGrapher as viewports in solving steps (see Sandboxes & viewports); picture composites (a step carrying two pictures).
- The runtime grain toggle (see Techniques engine).

## Depth

**Where it's at.** A bank of fixed, hand-written questions a teacher dips into by purpose (diagnose · explain · extend) and level: a shared
ToolShell mode (`depthItems` prop, "Depth" tab) that follows the Question Options, with a two-slide question → answer, named misconceptions
on every wrong option, adaptive links, a cross-level **Start here** check, deep links, a phone layout and a Present mode. Speakers are a named
cast of eight and Feathers the owl speaks on every slide (`docs/design/CAST.md`). Spec template: `docs/design/templates/DEPTH_SPEC_TEMPLATE.md`.
Live banks: **Order of Operations** (`OrderOfOperationsDepth.ts`), **Rounding** (`RoundingDepth.ts`, with a number-line scaffold) and **Identify
Sig. Figs** (`RoundingSfIdDepth.ts`, on its own tab), **Speed, Distance & Time** (`SpeedDistanceTimeDepth.ts`, all four tabs) and **Indices**
(`IndicesDepth.ts`); briefs in `specs/depth/`.

**Possible next steps.**
- Harry reviews the live banks for wording, missing misconceptions and routes (Speed/Distance/Time, Rounding, BIDMAS, Indices).
- Re-level the Significant Figures Depth bank onto the zeros ladder the tab now uses (`specs/rounding-sf-levels.md`), or add zero-themed items.
- Add a Depth section to the tool spec template and write a bank as each tool passes through the Tool review cycle.
- A printable hinge-question sheet from a chosen set of items.

## Decks

**Where it's at.** `src/decks/` (reference: `docs/reference/decks.md`). A **deck** is a whole lesson on its own page (`/decks`, `/decks/<id>`), reached from the tool's burger menu too (Developing-tools mode). A slide is a 16:9 canvas of elements: text with maths, equations, shapes, lines and arrows, images, a **board** (Filled in / Structure only / Blank), a **practice question** (hand-picked bank written against a misconception tag, with the tool's generator as backup), a **question grid** (quickfire, retrieval starter, exit ticket) a **Depth item** (drawn flat on the slide, no stage inside the slide), a **generator** question (any tool's generator live, like its Whiteboard) and a **book activity** (a printable set of generated questions). The central **Questions** workspace now combines practice and Depth browsing, four authoring formats, misconception guidance, editable sequences and classroom previews. Questions belong to each deck, participate in undo and export with their content; generators no longer take over curated sequences. Generators are configured in a central popup with spacious Question Options, a preview and Apply / Cancel (one undo step), including book activities and practice backups. Every ToolShell question tool's generator is wired in (`src/decks/generators.ts`), and a tool page's burger menu has **Send to a deck**. Any element can appear on a later click (the split discussion uses it). The **editor** (Edit in the player) has typing on the slide, a visual **equation editor** (MathLive), multi-select, smart guides, line up and space evenly, layers, undo, a question editor, copy and paste between decks, Export / Import. The **Slide library** (`/decks/library`) shows every layout and what is planned. Saves are kept on the device and **shared between devices** through `/api/decks` (private Vercel Blob). The first deck is **Estimation** (28 slides, 14 hand-picked questions, three Depth checks, a discussion, an exit ticket); Estimation now has a **Depth bank** (12 items) on its tool page too.

**Decided with Harry (2026-10-27).** Decks have their own place and are also reached from the tool's burger menu. Hand-picked questions and Depth are built together as intentional designs (balance and presentation may change). Decks are a stripped-down PowerPoint built around the site's own pieces: Harry refines the decks Claude builds, adds slides to them and builds his own; the decks Claude builds are ordinary decks in the same format.

**Possible next steps.**
- Teach from the Estimation deck and refine pacing, layout and what was missing (the brief's phase 5).
- The core representations as elements, each with a blank state (ratio table first), and a visible timer.
- Match-up and sort; a printable handout of a question grid.
- Editor: group / ungroup, rotate, a slide notes field for the teacher, a check at tablet size (laid out for a laptop).
- The next deck, built with its tool (Depth bank and practice bank together); fold the Teach tab and lesson decks into decks, then retire them (see **Slides** below); decide when decks go live.

## Slides

**Where it's at.** Slides play on four surfaces that share one core, `SlideDeck` (`src/shared/TeachingDeck.tsx`): the **Teach tab** (a tool's `teachingSlides`, Developing-tools gated), **lesson decks** (`teachingLessons`, reached from a lesson step), the **Depth stage** (fixed questions, a question slide then an answer slide, live wherever a tool has a bank) and **skill slides** (the Skill Library overlay, on the back bench). All four use the same 16:9 size (`slideSlotWidth`) and the same fixed-height card, auto-scaling and beat model; the scene types (split, equivalents, multiples, factor tree, prime Venn, combine, index expand) are shared.

**The question to settle.** Four surfaces for one job means a feature or a fix is made more than once, and teachers can meet inconsistent behaviour. Which surfaces survive, and what the others fold into. **Leaning:** keep Depth and the lesson decks; fold the Teach tab and skill slides into them (a Teach deck becomes a lesson step; the skill overlay plays the same decks). This is a design decision with Harry before any build.

**Possible next steps.** Decide the surfaces; list what each one has that the others lack (category menu, hand-offs, Depth checks inside a deck, the overlay's return to a working step); fold the Teach tab into lessons for the one tool that has it (Fractions +/−); settle whether skill slides return from the back bench (`docs/BACKBENCH.md`). See also **Lessons and Teach decks** and `docs/design/LESSONS.md`.

## Lessons and Teach decks

**Where it's at (Developing-tools gated).** A lesson is an ordered run of steps inside a tool — teach → practise → set → extend — reached from
the burger menu's Lessons page; steps can cross tabs, and a Depth step plays inside the deck surface. Structure and what the pilot taught:
`docs/design/LESSONS.md`.
- **Indices:** two lessons — **Laws of indices** (no negatives) and **Zero and negative powers** — with decks that play real Depth checks.
- **Rounding:** two lessons — **Identifying significant figures** and **Rounding to significant figures** (`RoundingLessons.ts`, decks in `RoundingSfTeach.ts`, zeros-ladder Depth items in `RoundingSfDepth.ts`).
- **Fractions +/−** has a Teach tab of slides (`teachingSlides`), reached without a lesson.

**Possible next steps.** Try both pilots with a class and check them on a phone, in full screen and with a real touch double-tap; decide when lesson
decks go live; lessons for Indices Level 2 and 3 negative powers, Fractional Indices and Writing Indices; whether Teach decks are retired for
tools that adopt Depth (`docs/BACKBENCH.md`).

## Smart Progressor

**Where it's at.** Orders a worksheet easy → hard by **calibration** (settled 2026-10-25, option weights retired): each question is scored from the question itself, a sample of 1500 per sub-tool × level is cut into eight bands (`<Tool>.calibration.ts` and a report in `docs/calibration/`), and the worksheet generates a pool and picks evenly across the bands reached (`spreadByBand`). Calibrated: Order of Operations (the pilot), Decimal Add/Sub, Speed Distance Time, File Sizes, Factor Theorem, Partial Fractions, Indices and Surds (`calibrated: true` on the config; the dashboard's Calibrated filter lists them). Process in `docs/reference/options-and-calibration.md` → Calibrating a tool. A `balanced: true` pool (Rounding's zero kinds, Speed Distance Time's mixed types) is kept roughly even on a short sheet by the same Worksheet switch.

**Possible next steps.** Calibrate further tools as they are finished (the process and `calibrationKit` test helper make a tool about a rubric and a 30-line test); check a calibrated sheet with a class.

## Core representations

**Where it's at.** The site commits to **eight core representations** as a shared vocabulary, so the same bar model a student meets in fractions
reappears in ratio (table in `docs/reference/pictures.md` → Core representations). New visuals must reuse one of them.
- **Teach-deck scene families built:** bar model (`split` / `combine` / `equivalents`), number line (`multiples`), prime factor tiles (`factorTree` / `primeVenn`), plus the Indices and significant-figures scenes. **Not yet:** area model, algebra tiles, negative counters.
- **Working-step representations, live:** place value table (decimals, binary and hex via `pvBaseColumnSet`; Number Bases and Binary Operations), ratio table (`SpeedDistanceTime`), negative counters (`CounterBoard`, with the + / − table), the carry ripple (`src/shared/carry.ts`).
- **Evolving pictures:** the Geometry diagrams (per-step emphasis, derived values in green) and the grapher's labelled `Segment`.

**Progressions and composites (direction agreed, mostly not built).** Pictures should be the next step from what the student already knows:
double number line → ratio table; negative counters → bar model with negatives → number line. A question may need two at once (a ratio
table beside the grapher for gradients). Needed: the missing shared components (a *signed* bar model, a double number line), a representation
switch on tools that span a progression, and composite visuals (a step carrying two pictures — likely a small extension to
`stepVisualRenderer`).

**Open questions.** Algebra tiles or the area model next (algebra tiles gates more tools)? Does an angle / circle / polygon diagram need its own
representation, or is "the diagram is its own picture" a legitimate exemption? Per-level or teacher-chosen representation; is the signed bar
model a new family or a variant of the bar model?

## Sandboxes & viewports

**The idea.** A sandbox is built **as a tool on its own first**, usable standalone in a lesson, then **built into question tools as a viewport**
on the solving. All share a layout and toolbar (`DrawHotbar` in `src/shared/components/BoardTools.tsx`). The agreed pattern: **standalone tool →
lab bench** (a dev-gated page that feeds the embeddable component question data at each step) **→ embedded viewport.**

**Where it's at.**
- **Algebra Tiles** (`/algebra-tiles`) — live, standalone. Needs a shared representation component before it can be a viewport.
- **Negative Counters** (`/negative-counters`) — live, standalone, same layout. The shared `CounterBoard` already draws the same counters in worked solutions; using it as a viewport in Integer Add/Sub is deliberately held until the sandbox is right.
- **SmartGrapher** (`src/shared/grapher/`) — a mature, self-validating embeddable graph, already a viewport in Properties of Line Equations, Simultaneous Equations (Substitution) and Mixed Strategies. Needs better use, not a project of its own.
- **Grapher Lab** (`/grapher`, dev-gated) — SmartGrapher's test bench and the model for the other two benches.
- **Parallel Lines Explorer** (`/parallel-lines-explorer`) — live interactive.

**Possible next steps.** Lab benches for counters and tiles; define the viewport pattern (embedded via `questionRenderer` / `stepVisualRenderer`);
extract an Algebra Tiles representation component; counters as a viewport in Integer Add/Sub, then the signed bar model → number line
progression; SmartGrapher on Completing the Square (parabola + vertex) and Iteration (curve and root — the top unwired candidate), and an ellipse
preset for Simultaneous Equations (Substitution), whose ellipse questions draw no curve today.

---

# Strands

## Pure Maths (A-level)

**Where it's at.** **Factor Theorem**, **Partial Fractions** and **Binomial Expansion** (AQA Year 2; seven tabs: Expand, Fractions: one bracket,
Power of a fraction, With partial fractions, Range of validity, Find the unknown, Approximation) are live, with a shared (i) level guide, asterisked
extensions and exam-style parts. **Next:** exam-style questions (Factor Theorem first) and a class review of Binomial Expansion.

## Maths word games (Words Bingo · Hangman · Pairs)

Standalone, projector-first games on one shared word bank (`src/shared/mathsWords/`). Landing page: Interactive Tools ▸ **Games**.

**Where it's at.** **Words Bingo is live**; **Hangman** and **Pairs** are built and dev-gated (`enabled: false`) pending a classroom test and a go-live call.
- **Word bank:** 237 words in six packs (Shapes & angles, Number & operations, Fractions & percentages, Measures time & money, Data & probability, Algebra & patterns), each tagged **KS2 / KS3 / KS4**. A game draws from chosen packs × key stages (default KS2) × clue types (definition, symbol, picture); conflict groups stop ambiguous words sharing a board.
- **Bingo:** all 25 words full screen, Start collapses to the central clue, Skip, Reveal, thinking-time ring, Check bingo, print sheet. **Hangman:** clue + balloons that pop, keyboard, Reveal a letter. **Pairs:** word ↔ clue memory cards, solo or two teams.
- **Banked ideas (not started):** Connect 4, Odd one out, Sort it, Guess the word, Taboo-style describing, a "Maths Word Games" landing hub, drag-to-match for Pairs.
- **Possible next:** more KS2 words for the thin packs (Algebra, Data), more pictures, phone / tablet checks of Hangman and Pairs, go-live for both.

## Computer Science

> **⏸ Parked as a priority**; worked on on request.

An OCR **J277 GCSE Computer Science** area. Revision tools are knowledge tools, not question generators — a different product on their own shell
(`CSShell`, `src/shared/cs/`): six activities (**Learn · Study · Cards · Quiz · Fill · Exam**), spec fidelity (every card and question carries a `specTag`),
exam realism, mobile-first. Architecture and extraction steps: `docs/architecture/CS_SHELL_PLAN.md`.

**CS revision shell — where it's at.** Fully built: six modes driven by one `topic` data object, two representations (box schematic, trace table) and
a CI validator (`validateTopic`). Three topics ship as pure data: **1.1.1 CPU Architecture** (the reference), **1.1.2 CPU Performance** and **1.1.3 Embedded Systems**, which together cover all of 1.1. The original all-in-one
**System Architectures** tool (`/system-architecture`) was retired on 2026-10-27, once each part had its own.
- **Next (once unparked):** author **1.2.1 Primary storage** (the other 1.1.1 synoptic partner, and where ROM/RAM live); pull synoptic questions into a shared cross-topic bank; build a new representation when a topic demands one (data representation → place-value / number-line; networks → stack / topology); keep a `Status: ready` brief in `specs/cs/` before each topic.
- Later strands: 1.2.2–1.2.4 storage / units / data representation, 1.3 Networks, 1.4 Network security, 1.5 Systems software, 1.6 Ethical, legal and environmental. Spaced repetition and RAG self-rating need a persistence layer that does not exist.

**CS procedural generators (on `ToolShell`) — where it's at.** The procedural half of J277 1.2.4 is built as question generators in
`src/tools/Binary/` (registry category "Computer Science", group "Binary & number bases"); `ToolEntry.levels` lets each sub-tool have only the levels the spec supports. **Live:**
Binary Operations (Addition, Shifts), Number Bases, Data Units (`specs/data-units.md`), Binary Counting (`specs/cs/binary-counting.md`) and
**File Sizes** (`/file-sizes`: text, images, sound; `specs/file-sizes.md`; live 2026-10-26), all on the shared base-aware place value table and carry ripple.
- **Next:** the units ladder as an evolving picture in Data Units; compression (J277 1.2.5) as its own tool; the deferred pixel-picture and sampled-wave sub-tools; classroom feedback on Number Bases, Binary Operations and Binary Counting.

## Decision Maths (A-level strand)

AQA A-level Further Maths **Discrete Mathematics**: graphs and networks. A network-native shell (`DecisionShell`, `src/shared/decision/`) parallel to the
others; contracts and the increment plan are in `docs/architecture/DECISION_SHELL_PLAN.md`, and each tool has a brief in `specs/`. The P-Value Grapher
(statistics) is a live interactive that belongs to the same A-level strand.

**Where it's at.**
- **Live:**
  - **Network Flows** (`specs/flow-networks.md`): Capacity only ⇄ Min and max, six question styles, nine network styles, supersource / supersink and node-capacity tabs, exam-style practice (AS and A-level chains, stepped working, Practice | Worksheet with print), and a parts library with recipes (`flowParts.ts`, `flowExam.ts`; `specs/flow-parts-library.md`). **Three tabs are Developing-tools only** (`DEV_ONLY_TABS`): Explain and justify, Table of cuts (exam), Forced flows then augment (exam).
  - **Minimum Spanning Tree** (Kruskal, Prim, Prim on a table) — generated crossing-free networks with all weights different.
  - **Critical Path Analysis** (`specs/cpa-skill-tools.md`, `specs/cpa-exam-questions.md`) — 14 skill tabs across AS and A-level plus 11 exam-style chains; cascade and Gantt charts, resource histogram and levelling, worker allocation.
- **Dev-gated (`enabled: false`):** **Travelling Salesperson** (nearest neighbour, lower bound, both bounds, table of least distances), **Route Inspection** (three tabs), **Mixed Strategies** (ToolShell, needs an answer check and review) and the **Network Sandbox** support page.
- Shared across them: the graph bank and sandbox overlay (`graphBank.ts`), CI validators that re-derive each answer independently, recent / pinned questions in both shells.

**Open checks and next steps.**
- Network Flows: eyeball the two-figure exam question and the Explain tab on a real phone and tablet; print a two-figure paper from a real browser; corpus gaps (`specs/corpus/network-flows.md`); move CPA onto the parts / recipes pattern.
- CPA: check the phone layout of the Gantt chart and histograms.
- Go-live of Travelling Salesperson, Route Inspection and Mixed Strategies is decided (2026-10-26): they go live through the **Decision exam-style questions** prong below.
- Next tools: Dijkstra; Route Inspection extras (adding an edge to make a network Eulerian, six odd vertices); best lower bound over every vertex for TSP.

---

## Decision exam-style questions (prong)

**Decided 2026-10-26.** Exam-style questions are the shape every Decision tool should end up with, so the work is a prong of its own (like Slides), not a clause of each tool. Critical Path Analysis and Network Flows are the pilots; the other Decision tools get the same treatment, and for the three that are not yet live it doubles as the route to go-live.

**What it is.** A question is an exam chain of parts (intro, marks, minutes, model answer, mark scheme, stepped working behind the (?), a picture per part) composed from a **parts library** and **recipes**, shown one part at a time and printed as paper then mark scheme (`src/shared/decision/flowParts.ts`, `flowExam.ts`, `ExamView`, `printExam.ts`; specs `flow-parts-library.md`, `flow-exam-questions.md`, `cpa-exam-questions.md`). Paper questions are tagged as part chains in `specs/corpus/<tool>.md` and checked by a corpus test, so a recipe is anchored to what the boards actually ask.

**Where it's at.** Network Flows has the full pattern (parts library, recipes, Explain and justify, two-figure questions, Practice | Worksheet). Critical Path Analysis has 11 exam chains but is not yet on the parts/recipes pattern. Minimum Spanning Tree is live as skill practice only. Travelling Salesperson, Route Inspection and Mixed Strategies are dev-gated with no exam chains.

**Possible next steps** (options, not a queue):
- Move CPA onto the parts library and recipes so all three share one pattern.
- Exam chains for Minimum Spanning Tree (Kruskal, Prim, table form), then Route Inspection and Travelling Salesperson (bounds, nearest neighbour); each needs its corpus tagged first.
- Mixed Strategies: an answer check and review, then exam-style parts (game theory is a different shape from the networks, so decide whether it shares the recipes or only the exam view).
- A go-live checklist per tool: exam chains, corpus, validators that re-derive each answer, phone/tablet/laptop check, then remove `enabled: false`.
- Dijkstra and the Route Inspection extras listed under Decision Maths come after the existing tools have chains.

---

## Tools dashboard (`/admin`)

**Where it's at.** Built and working in Developing-tools mode (burger menu → Tools dashboard). **Facts** (state, kind, shell, sub-tools, Depth, lessons, Teach,
developing picture, calibration, scaffold, tests, spec, pictures used) are generated from the code (`scripts/toolFacts.mjs` →
`src/generated/toolFacts.json`, run before every build, `npm run facts`; a test fails if stale). **Notes** (status, in development, what we want to change,
differs from the standard, representation + agreed, review stage, open questions) are shared and live: one private Vercel Blob behind
`api/tool-notes.ts`; Harry edits in the dashboard, Claude through the same API (`CLAUDE.md` → Tools dashboard). **Views:** one tab per kind (Tools,
Sandboxes, Games, PDF generators, Workshop), and List (grouped by strand, collapsible, column picker), Matrix (a dot per capability) and Next up. It is
the interactive overview of this plan and the planner, not a replacement for either.

**Possible next:** max options per level and a Lesson column on the Matrix; a stage derived from the facts; quick-edit of Plan status and Review in the row.

---

*Keeping this current: when a session moves a prong, update its **Where it's at** line and its *At a glance* row here, alongside the
`docs/PATCH_NOTES.md` entry. Next-step bullets are spitball — prune the done and ruled-out ones. Paused work is in `docs/BACKBENCH.md`. The live
per-tool review is in each tool's note. Standing authoring principles live in `CLAUDE.md`, not here.*
