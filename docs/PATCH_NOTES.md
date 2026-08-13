# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. Read this at the
**start of a new conversation** to see where we're up to; append to it at the
**end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `docs/PROJECTS.md` — where every prong is up to and what's next. *The plan* (absorbs the old roadmaps).
- `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` — the two purpose-built shells' architecture.
- `docs/GLOSSARY.md` — canonical names for every element. *The vocabulary.*
- **`docs/PATCH_NOTES.md` (this file)** — what actually happened, session by session. *The history.*

The site hosts **two subjects** and they are tracked separately below: **Maths**
(the bulk of the app, built on `ToolShell`) and **Computer Science** (a younger
strand on its own `CSShell`). See `CLAUDE.md` → "Two subjects — repository map".
Keep the split even when a session only touches one.

> **This file is history, not status.** For "where are we now / what's next", see
> `docs/PROJECTS.md` — the single planning surface. This file is the newest-first record
> of what each session shipped.

> **Dates** are the commit dates of the session's work. Newest first within each
> strand. An entry is a *session's worth* of work, not a per-commit changelog —
> group by what was actually built and link the tool/page it touched.

---

# Maths

## 2026-08-13 — New "Interactive Tools" category; Parallel Lines Explorer published, GrapherLab and AlgebraTiles regrouped
Introduced a new landing-page category, **Interactive Tools** (`src/tools/Interactive/`, lime →
green gradient), for freeform manipulative/canvas tools as distinct from the worksheet-generator
tools on `ToolShell`. Moved `AlgebraTiles.tsx` and `GrapherLab.tsx` out of `TeacherTools/` into the
new folder (import paths, `organisation.test.ts`'s `STANDALONE_BY_DESIGN` list, and both `CLAUDE.md`
and `docs/PROJECTS.md`'s tool-location references updated to match); `GrapherLab` keeps its existing
`enabled: false` dev-gate — it's a test bench, not a finished classroom tool. Also published a new
**Parallel Lines Explorer** (`/parallel-lines-explorer`, live) into the category, built from the
archived `Unpublished/ParallelLinesInteractive.tsx` v1 draft: a full-screen, pannable canvas where a
transversal (drag the blue handle) crosses one or two parallel lines plus an optional non-parallel
line, with click-to-reveal angle sectors (A–H, plus M–P for the non-parallel line), a settings menu
(line visibility, angle-of-view presets, offset, handle visibility), recentre/reset/fullscreen
controls, and its own info modal — all pre-existing, working code. The only functional fix needed
was a missing Home-button handler (the draft's button had no `onClick` at all); the default export
was renamed to `App` to match the repo's convention. Left `Unpublished/ParallelLinesInteractive.tsx`
in place — a genuinely new build from it, not a migration, so it stays available as reference
material per `CLAUDE.md`'s rule for that folder. Verified with `npm run build` (0 errors), `npm test`
(280 pass, unchanged — the tool is standalone by design, no `__test` needed), and a headless
Playwright pass: both new routes load with zero console/page errors, and screenshots confirm the
canvas renders correctly (parallel lines, transversal, colour-coded angle sectors) and the landing
page shows the new category with Algebra Tiles and Parallel Lines Explorer live, Grapher Lab
correctly DEV-badged.

## 2026-08-13 — New Percentages tool, built from the archived v1 draft
Brought `Unpublished/Percentages.tsx` (an old, never-registered v1 draft) onto the shared
**ToolShell** as a fresh v2.3 build (`src/tools/Number/Percentages.tsx`, ~370 lines) and published
it live (no `enabled: false`). Three sub-tools: **Finding Percentages** (Multiplier vs. Chunking
methods, with a decimal-amounts toggle; Chunking builds the percentage from 10%/1% and, at Level 1,
50%/25% shortcuts), **Percentage Change** (increase/decrease/mixed direction, an optional "show
multiplier working" step, and a Level 3 compound two-step change), and **Reverse Percentages**
(sales/VAT/general contexts, an optional unitary-method working path, Level 3 large increases or
very small percentage changes). All maths was rewritten cleanly against the v2.3 conventions rather
than ported verbatim — money values are rounded to the nearest penny at *every* step via a dedicated
`money()` helper (a spot-check first caught the old approach compounding rounding error across a
chained calculation, e.g. a two-step change showing `£103.0302`; fixed by re-rounding after each
multiplication rather than only stripping floating-point noise). Verified with `npm run build`
(0 errors), `npm test` (280 pass, 9 new), and an ad-hoc 7,200-question generation sweep checking for
NaN/undefined/Infinity across every tool × level × QO combination, plus manual spot-checks of the
chunking, compound-change and unitary-method working. `Unpublished/Percentages.tsx` is left in place
per `CLAUDE.md`'s "leave alone" rule for that folder — this is a new build inspired by it, not a
migration of it.

## 2026-08-13 — Housekeeping: undev-gated Powers of Ten; deleted superseded Unpublished/ archives
`PowersOfTen` finished its ToolShell migration on 2026-07-26 but the registry's `enabled: false`
flag was never flipped afterward, leaving a done tool hidden behind Developing-tools mode — removed
it, so the tool is now publicly listed. Also deleted three files from `Unpublished/`
(`ExpandingBrackets.tsx`, `FractionMultDiv.tsx`, `FractionsAddSub.tsx`) — old v1.x drafts fully
superseded by their live v2.3 counterparts (`Algebra/ExpandingBrackets`, `Number/FractionMultDiv`,
`Number/FractionsAddSub`, all confirmed rendering `<ToolShell/>`). Left `Unpublished/Perimeter.tsx`
in place — it's byte-identical to `src/tools/Geometry/PerimeterTool.tsx`, which is itself still
on the old shell and dev-gated (`enabled: false`, BETA), so there is no newer version to treat it
as superseded by. Build clean (0 TS errors), 271 tests pass.

## 2026-07-29 — Docs reorganised into a `docs/` folder
Housekeeping: moved the loose organisational docs off the repo root into a
structured `docs/` tree, leaving only `CLAUDE.md` (auto-loaded, must stay at
root) and `README.md` beside the app config. New layout: `docs/PROJECTS.md`,
`docs/PATCH_NOTES.md`, `docs/GLOSSARY.md`; `docs/architecture/` (`CS_SHELL_PLAN.md`,
`DECISION_SHELL_PLAN.md`); `docs/design/` (`DESIGN_STUDIO.md`, `TOOL_DESIGNER_PROMPT.md`)
with the four fill-in templates under `docs/design/templates/`. All cross-references
(the `CLAUDE.md` documentation map, doc-to-doc pointers, `scripts/new-tool.mjs`
guidance, the `specs/**` READMEs, and `// See …` source comments) were updated to
the new repo-relative paths; the historical entries below keep their original
bare filenames. No code or behaviour changed — `npm run build` and `npm test`
clean. Also removed a stray duplicate `README.md` row from the doc map.

## 2026-07-28 — Decision Maths increment 1: the MST thin vertical slice
Built the first end-to-end path of the `DecisionShell` (Layers 1+2+one tool), per
`DECISION_SHELL_PLAN.md`. **Layer 1 — representation library** (`src/shared/decision/`): promoted the
Network Sandbox spike into two **pure renderers** — `NetworkView` (SVG graph, pan/zoom/drag, edges
coloured by a `SolveStep`'s states: idle/considering/tree/rejected; framed by an auto-fitted viewBox)
and `MatrixView` (distance matrix with per-cell highlight/strike) — plus `types.ts` (the authoring
contracts: `NetworkTemplate`, `DecisionProblem`, `SolveStep`, `DecisionShellProps`,
`DecisionProblemExport`) and `templating.ts` (`sampleTemplate`: samples each edge weight in its
`[min,max]`, coin-flips optional edges → a concrete, always-connected `Network`). **Layer 2 — thin
`DecisionShell`**: full-canvas navy chrome with **Question** mode (network + prompt) and **Solution**
mode (forward/back stepper over `SolveStep[]`, network + matrix + caption + running total updating in
sync, with a "show all" jump to the terminal state). No print, no sandbox-expand, no Prim yet. **The
tool** — `MinimumSpanningTree` (`enabled:false`): one crossing-free 6-node template (mandatory edges
span every node, two optional extras) + **Kruskal's algorithm** emitting one beat per considered edge
(accept into tree / reject as a cycle, with a running total), one question type, one level. **CI**:
`validate.ts` (`validateProblem` + an independent Prim MST reference) and `src/tests/decision.test.ts`
discover every `__problem`-exporting Decision tool and assert templates sample to real-node networks
with in-range weights, the network is connected, every `SolveStep` references real edges/cells, and
solve()'s total **matches the brute-force MST** — what makes generate-fast safe. Registered under
Decision Mathematics; added to the standalone list in `organisation.test.ts`. Build clean (0 TS
errors); `npm test` **271 pass** (new decision suite). Verified on screen: Question + Solution
mid-walk (green tree edges, a red-dashed rejected edge, matrix cell struck, running total).

## 2026-07-28 — Decision Maths: design session + DECISION_SHELL_PLAN.md
Turned the Network Sandbox spike into an agreed build plan. A design session settled five decisions:
(1) a **new `DecisionShell`** — a purpose-built, network-native question-generator shell parallel to
ToolShell/CSShell; (2) **parameterised templates** for generation — hand-authored crossing-free
network *shapes* with declared degrees of freedom (weight ranges, optional edges), plus an advanced
"free" bypass behind a clarity warning; (3) **stepper + show-all** worked answers (animate edge
highlight/discount + matrix/table in sync); (4) **sandbox = both** — expand-the-generated-network AND
a free-build mode sharing editing primitives with the bypass; (5) **MST thin slice first**. Wrote
**`DECISION_SHELL_PLAN.md`** (mirrors `CS_SHELL_PLAN.md`): a three-layer architecture (representation
library → DecisionShell → independent MST/TSP/CPA tools), the authoring contracts (`NetworkTemplate`,
`DecisionProblem`, `SolveStep`, `DecisionShellProps`), a `validateProblem` CI plan, a seven-step
increment plan (thin MST slice → breadth → sandbox → print → TSP → CPA → onward), and a "▶ Resume
here" kickoff block. Indexed it in the `CLAUDE.md` doc map. Docs-only — no `src/` changes.

## 2026-07-28 — Decision Maths spike: a standalone Network Sandbox (pre-shell exploration)
First step toward supporting **Decision / Discrete Mathematics** (AQA Further Maths: MST —
Prim/Kruskal, Dijkstra, Chinese postman, TSP, critical path analysis, network flows, LP).
Established *why* ToolShell is the wrong home for this family: its whiteboard is a rigid
`480px` working panel + `480px` question box inside `max-w-6xl`, and its question model is a
KaTeX string with a flat `WorkingStep[]` — whereas a decision-maths problem *is* a data
structure (`{nodes, edges}`, activity lists, LP constraints) rendered as a full-canvas diagram
+ matrix + stepped table. The CS strand's `CSShell` is the precedent: a parallel shell, not an
extension of ToolShell. Rather than design that shell up front, shipped a deliberate **spike**:
`src/tools/Decision/NetworkSandbox.tsx` — a standalone, full-screen, pannable/zoomable workspace
(chrome borrowed from `AlgebraTiles`, not the constrained ToolShell pane) that renders a weighted
network well: draggable nodes, edge weight labels, a live distance matrix, directed/undirected
and grid toggles, two sample networks. New **Decision Mathematics** category in `src/registry.ts`
(rose theme in `LandingPage.tsx`), tool `enabled: false` (dev-only) while we explore details
before committing to a `DecisionShell`. Added to `STANDALONE_BY_DESIGN` in `organisation.test.ts`.
Build clean, 268 tests pass, 0 page errors, rendering eyeballed.

## 2026-07-26 — Design Studio: a repo-linked brief pipeline for all four build types
Extended the maths-only spec pipeline (`TOOL_DESIGNER_PROMPT.md` + `TOOL_SPEC_TEMPLATE.md`
+ `specs/`) into a **single entry point for every kind of build** — designed *with Claude in
a normal chat, repo linked*, then handed to Claude Code. New **`DESIGN_STUDIO.md`** is the one
doc you point a chat at: it reads `GLOSSARY.md` + the relevant `CLAUDE.md` section + an
existing example, asks *"maths tool / CS tool / technique / Teach deck?"*, then routes to the
matching fill-in template. Added three new templates alongside the existing maths one —
**`CS_TOPIC_SPEC_TEMPLATE.md`** (J277 revision topics, mirroring the `CSTopic` shape: spec
tags, glossary, Learn beats, cards, cloze, exam mark schemes, synoptic, myths — the fact-based
sweet spot with almost no generation logic), **`TECHNIQUE_SPEC_TEMPLATE.md`** (a reusable
working-step move at brief/standard/full grains, with step titles + fragments), and
**`TEACH_DECK_SPEC_TEMPLATE.md`** (misconception-driven slides, I-do→We-do→You-do on one
coherent example, scenes from the existing families). Each template is self-teaching (inline
authoring guidance) and stays about **pedagogy/content, not code**. Completed briefs land in
typed homes — maths tools at `specs/`, and new `specs/cs/`, `specs/techniques/`, `specs/decks/`
subfolders (each with a README). Wired the new pipeline into `CLAUDE.md` (doc map +
"Implementing from a spec"), `README.md`, `specs/README.md`, and added a repo-linked note to
`TOOL_DESIGNER_PROMPT.md`. Docs-only — no `src/` changes; build and tests unaffected.

## 2026-07-26 — Migrated Powers of 10 onto ToolShell (full-width place value grid)
Brought `PowersOfTen` (the "Multiplying & Dividing by 10ⁿ" tool, ~1,240 lines) onto the
shared **`ToolShell`** (~400 lines). The tool's exceptional requirement is its **place value
grid** — a wide table (7 columns at L1, 13 at L2/L3) that must span the whole container, not
the shell's usual question/working split. The workaround needs **no shell changes**: the
entire grid renders through a custom **`questionRenderer`**, and the tool starts with the
working panel collapsed via `defaults.collapseWorkingByDefault`, so the question box goes
full-width and `ScaleToFit` grows the grid into the reclaimed space (the panel stays
recoverable via the shell's re-open button). Two grid states are preserved deliberately:
the **whiteboard** shows a blank scaffold to model on (Show Answer fills it in and reveals
`= answer`), the **worked example** shows the filled grid plus the shell's verbal working
steps + answer card, and the **worksheet** is text-only (`v × 10ⁿ = answer`) so the default
text print handler works with no custom code. Level 3's extreme numbers keep the original
"all digits move N places" statement instead of a grid. The `10ⁿ` toggle became a pure
`reformatQuestion` display switch (raw params stored on the question, display rebuilt on
toggle — no regeneration); display strings use KaTeX with `{,}` thousands separators and
`10^{n}`. All maths generators are preserved verbatim. Added the `__test` export and moved
the tool out of the migration backlog in `organisation.test.ts`, `CLAUDE.md` and
`DEV_ROADMAP.md`. Build clean, 264 tests pass.

## 2026-07-26 — Migrated Fractions & Ratios onto ToolShell
Brought `FractionToRatio` (the "Fractions & Ratios" tool, ~1,330 lines) onto the shared
**`ToolShell`** (~470 lines). All three sub-tools and their maths generators are preserved
verbatim: **Forming Ratios** (counts / total-with-remainder / constraint-based, with the
3-Way and Simplest Form toggles), **Fraction to Ratio** (complementary part / three-part
remainder / quantity-based, with the Different Denominators toggle and the Given
dropdown), and **Ratio to Fraction** (part-to-whole / composite / part-to-part, with the
Simplest Form toggle and Target dropdown). The bespoke shell was deleted in favour of
ToolShell's built-ins: the hand-rolled `handlePrint`, difficulty toggle, standard/
differentiated QO popovers, info modal, presenter/fullscreen chrome and the local KaTeX
loader all go away. Local `step`/`mStep`/`tStep`/`fracStr`/`mStr`/`randInt`/`pick` now come
from `../../shared`; the ratio-specific helpers (`frac`, `rLatex`, `rStr`, simplification,
common-denominator) stay local. Per-level Question Options map onto `difficultySettings`
dropdowns/variables, so whiteboard / worked-example / worksheet / differentiated /
share-links / PDF export all come for free. Added the `__test` export (smoke suite now
covers all three sub-tools × three levels) and moved the tool out of the migration backlog
in `organisation.test.ts` and `CLAUDE.md`. Build clean, 182 tests pass.

## 2026-07-26 — Migrated Angles in a Triangle onto ToolShell
Brought the largest remaining **live** old-shell tool (`AnglesInTriangles`, ~1,335
lines) onto the shared **`ToolShell`** (~625 lines) — the first **SVG/diagram** tool
migrated onto the shared shell's `handleDiagramPrint` path (after `AnglesInQuadrilaterals`
set the pattern). All the geometry and question generation is preserved verbatim:
Level 1 basic triangle (with the No/Sometimes/Always-90° dropdown and the below-20°
toggle), Level 2 isosceles (give apex / give base / mixed), and Level 3 extended
angles (split-triangle and exterior-angle variants). The bespoke shell — the
hand-rolled `handlePrint` with its fixed 3×5 grid, the difficulty toggle, dropdown/
variable popovers, info modal and fullscreen chrome (~745 lines) — was deleted in
favour of ToolShell's built-ins. The `TriangleDiagram` SVG now uses a **square viewBox**
(so it never overflows its panel and prints at aspect 1 with no per-question `_aspect`)
and a **reveal answer-band** baked into the SVG like the quadrilaterals tool. Per-level
Question Options map onto `difficultySettings` dropdowns/variables, so whiteboard /
worked-example / worksheet / differentiated / share-links / variable-column diagram
printing all come for free. Working steps use `tStep` (a faithful port of the old
plain-text lines; techniques wiring — `applyAngleFact` — is a later pass). Added the
`__test` export (smoke suite now covers all three levels) and moved the tool out of the
migration backlog in `organisation.test.ts`, `CLAUDE.md` and `DEV_ROADMAP.md`. Build
clean, 173 tests pass.

## 2026-07-26 — Migrated Fractions of Amounts onto ToolShell
Took the largest remaining old-shell **question generator** (`FractionsOfAmounts`,
~1,850 lines) and brought it onto the shared **`ToolShell`** (~600 lines). All the
maths generation — Finding Amounts (L1 unit / L2 non-unit / L3 fractional answers),
the worded contexts (L1 direct/indirect, L2 unit-conversion, L3 two-step keep/give
with money or items, optional "answer as fraction of original"), and Expressing as
a Fraction (L1 simplify-by-HCF, L2 direct/indirect contexts, L3 one/two-step) — is
preserved verbatim; only the return shape and shell changed. Questions now use the
shared `WordedQuestion` kind, working steps use `mStep`/`tStep` with **live-modelling
fragments** (each `= …` link reveals separately), and all the bespoke UI, popovers,
and hand-rolled PDF `handlePrint` were deleted in favour of ToolShell's built-ins.
Per-level Question Options (denominator range, question type, conversion hint, steps,
etc.) are re-expressed as ToolShell `difficultySettings` dropdowns/variables, so
whiteboard/worked-example/worksheet/differentiated/share-links all come for free.
Money is kept KaTeX-safe with `\pounds`. Dropped the non-functional Level-3 "Answer
Format" control (it never affected generation). Added the `__test` export (smoke
suite now covers all 9 sub-tool×level cases, 40 unique questions each) and moved the
tool out of the migration backlog in `organisation.test.ts`, `CLAUDE.md` and
`DEV_ROADMAP.md`. Build clean, 249 tests pass.

## 2026-07-25 — Repo consolidation + organisation audit
Housekeeping session, no tool code. **Consolidated three parallel branches into
`main`**: merged the CS/CPU work (PR #38) and this changelog (PR #39), and cleared
a stale already-merged branch — `main` is now the single source of truth again.
Ran an **organisation audit** and actioned four pickup-friction fixes: added a
**documentation map** to `CLAUDE.md` and `README.md` (one table saying which doc to
read when); **removed a contradiction** where a CS tool sat in the Maths migration
backlog (CS tools target `CSShell`, never `ToolShell`); made `npm run new-tool`
**refuse `--category ComputerScience`** (it only scaffolds the Maths `ToolShell`, so
CS tools were being pointed at the wrong shell); and **refreshed the README** to name
the two-subject architecture and link the doc set. Then added the **CI drift-check**
(`src/tests/organisation.test.ts`) — it reads every tool's source and fails the build
if a tool is un-categorised, if a migrated tool is left in the backlog, if a ToolShell
tool lacks `__test`, or if a tool file isn't registered; it's now the authoritative
shell-status list, with `CLAUDE.md` pointing to it. Considered and **dropped** the
`CLAUDE.md`/`SHARED_API.md` split — it trades away the single-file "no source needed"
guarantee for a shorter read, not worth it yet.

## 2026-07-21 → 07-23 — PDF generators: Functional Skills + Times Tables
**Functional Skills generator** got a full redesign: a two-pane browse/build
layout with tap-to-add skill tiles, a single worksheet editor, per-skill count
arrows, an anchored options pop-over, and instructions moved into a burger menu
with settings in a pop-out. Added **fraction arithmetic** (add, subtract,
multiply, divide) to the skill set. Tiles now stay two-wide at all widths.
**Times Tables generator** was realigned to the same house style: question
options moved into a popover, a centred flowing setup layout, and new fact
controls — exclude ×2/÷2, ×5/÷5, ×10/÷10 (grouped under one header),
suppress-commutative (n/n=1), and a "suppress n=1" option. Fixed the question
distribution over-representing squares and ×1 facts, and de-duplicated
missing-factor / division questions with a refreshable full preview.

## 2026-07-18 → 07-19 — SmartGrapher, techniques engine, and the reference docs
Big infrastructure session. Added **SmartGrapher**, an embeddable canvas graphing
component: multiple curves on one graph with auto-intersections, extended curve
families (trig, exp, log, reciprocal, modulus), linear-programming feasible
regions, a regions/guides shading layer, and Cluster A recipes (sketch, solve,
transform, tangent). It now renders the **Mixed Strategies** Level 3 graph and is
integrated into **NonLinearSimEq** (migrated to v2.3 in the same session).
Added the **techniques engine** (`src/shared/techniques/`) for reusable
pedagogical working steps — grain-aware (brief / standard / full) — with a
dev-only **Technique Library** viewer at `/techniques` and a **Grapher Lab** test
bench at `/grapher`. Created the reference docs **`DEV_ROADMAP.md`** and
**`GLOSSARY.md`**, plus a technique audit and a skills-to-develop backlog.

## 2026-07-16 — Mixed Strategies (game theory)
New **Mixed Strategies** tool (zero-sum game theory): find optimal mixed
strategies and the value of a game from its payoff matrix. Labelled payoff table,
KaTeX labels, the answer replaces the matrix on the whiteboard, and it's
dev-gated (`enabled: false`) for now.

## 2026-07-13 — Binomial hypothesis testing + Recipes migration
Added **critical regions** to the binomial hypothesis-test / p-value tool, made
p-value and critical region a mode toggle (one at a time), and reworked the
controls into a full-width panel with sliders and even option groups (max trials
raised to 200). Migrated **RecipesTool** to the v2.3 ToolShell.

## 2026-07-09 — Best Buys migration + slide/scaling polish
Migrated **Best Buys** to the shared ToolShell. Polished the teaching-slide
system: the skill overlay goes near-fullscreen, slides auto-scale to fit the card
(no scrollbars at any size), and `ScaleToFit` now shrinks below 1× when content
would clip (fixing fullscreen split view). Codified the "size for readability,
never to fill" slide principle in `CLAUDE.md`.

## 2026-07-05 → 07-08 — Skill library, Teach decks, worked-example fragments
The pedagogy engine landed. Added the **skill library** (`src/shared/skills/`,
browsable at `/skills`), **`[[skill-id|term]]` skill-link drill-downs**, and
**worked-example fragment reveal** (one board-mark per press) — all dev-gated.
Added the **Teach** slide-deck mode (`teachingSlides`) with a category menu,
phase badges (I-do/We-do/You-do), and animated scenes; reworked the **LCM** skill
as a beat-by-beat walkthrough and added **LCM from prime factors** with the core
**prime-factor tile** representation and Venn strike-off. Fixed fixed-height slide
cards so they don't jump. Migrated the **fraction** tools (add/subtract,
multiply/divide) to v2.3 and added the **Bearings** tool.

## 2026-06-28 — Developing-tools mode + worksheet builder + migrations
Added the global **Developing-tools mode** (homepage toggle, `src/devMode.ts`)
that gates all in-progress work. Worksheet builder gained a classic two-pane
layout for general use with sections kept dev-only, a builder column picker, and
tidier action rows. Migrated **Iteration** and **Simultaneous Equations
(Elimination)** to v2.3, fixed jittery zoom on the collapsible panel, and added
several **Algebra Tiles** manipulation improvements (Extract, overlap-safe
duplication).

## 2026-06-13 → 06-18 — Foundations: shell, worksheet builder, first tools
The v2.3 groundwork. Added the collapsible **working/visualiser panel** and
`hideFontControls`, the **WorksheetBuilder** for mixing sub-tools, and the
`Unpublished/` exclusion from build/test/deploy. Built **Angles in
Quadrilaterals** (three levels, SVG diagrams, exterior-angle overlays),
**Collecting Like Terms**, and refined **Multiple Variables**. Fixed a run of
SVG scaling / worksheet-cell clipping issues and made the font-size chevrons work
in custom renderers.

---

# Computer Science

> The CS strand is deliberately tracked apart from Maths: it's a different
> subject with its own pedagogy (knowledge/recall, not question generation), its
> own tools, and its own shell (`CSShell`, not `ToolShell`). It's younger than the
> Maths side — expect it to grow fast.

## 2026-07-27 — CS shell increment 8: 1.1.2 CPU Performance as pure data + the CSTopic validator
The payoff increment — the first sub-topic authored **entirely as data** on the `CSTopic`
contract, no bespoke code. Added **`src/tools/ComputerScience/CpuPerformance.tsx`**: one
`CPU_PERFORMANCE: CSTopic` object + `export const __topic` + `export default () => <CSShell
topic={CPU_PERFORMANCE} />`, registered in `src/registry.ts` (`enabled: false` pending the
user's content review) and added to `CS_TOOLS` in `organisation.test.ts`. Content is the OCR
J277 **1.1.2** spec — clock speed, cache size, number of cores, and combining them: specTags
(the four requirements + bare synoptic partners 1.1.1 / 1.1.3 / 1.2.1), glossary (+beyond-spec
thread/bottleneck/hit/miss/overclocking), **five Learn lessons** — two with their own FOCUSED
`BoxSchematic` (a CPU/cache/RAM diagram contrasting a short cache "hit" hop with a long "miss"
trip out to RAM, and a four-core diagram for parallel work), the overview / clock-speed /
combining lessons deliberately diagram-free — 12 core cards (+2 beyond-spec), 4 cloze, 5 myths,
8 exam questions (mcq → an 8-mark extended response, with mark schemes + `**bold**` model
answers) and 2 synoptic questions spanning 1.1.1 and 1.1.3 with per-tag attribution. Also
landed the deferred **`src/shared/cs/validate.ts`** (`validateTopic`) + **`src/tests/cs-topics.test.ts`**,
which discovers every `__topic`-exporting CS tool and asserts: card/exam/cloze specTags are
declared; MCQ `answerIndex` is in range; each cloze `[slot]` has a matching word; myth/card/
exam/cloze ids are unique; predict beats carry both a question and an answer; every diagram
lesson resolves a schematic (or is deliberately `kind: "text"`); and — the documented caveat —
the **per-tag synoptic markScheme attribution** is declared (not the bare top-level synoptic
`specTags`, which would false-fail the 1.1.1 canary). Added `export const __topic` to
`CpuArchitecture.tsx` too, so the canary is validated the same way. **Small shell enhancement
to support the two-diagram design:** `TopicScenes` gained a `schematics` map and `Lesson` a
`scene` key (a diagram lesson picks a named schematic; omitting it falls back to the topic's
single `schematic`, so the 1.1.1 canary is untouched) plus a `kind: "text"` for deliberately
diagram-free lessons; `LearnMode` resolves per lesson and drops the scene panel entirely for
text lessons. Both new diagrams were rendered and eyeballed before pushing. Green: build clean,
**268 tests pass** (+4). Ticked
increment 8 in `CS_SHELL_PLAN.md` and refreshed the Resume-here block. **Next (increment 9):**
roll the same data-only pattern through 1.1.3 → 1.6, and consider moving synoptic to a shared
cross-topic bank now that there is >1 topic.

## 2026-07-27 — CS shell increment 7: CSShell assembled (the final extraction)
Completed the `CSShell` extraction — the CS revision shell is now a real, reusable shell.
Introduced the **`CSTopic`** contract in `src/shared/cs/types.ts` (`id` / `title` /
`specTags` / `glossary` + all the content arrays — `lessons`, `scenes`, `cards`, `cloze`,
`myths`, `exam`, `synoptic`, `info`), the whole authoring surface for a knowledge topic.
Built **`src/shared/cs/CSShell.tsx`** by lifting the shell scaffold that lived in
`CpuArchitecture`'s `App()`: the sticky header + home button, the desktop top-tabs +
mobile `BottomNav`, the burger menu (topic-info + beyond-spec toggle), the topic-info
modal, the beyond-spec filtering (now inline `topic.cards/cloze/exam.filter`), the
quiz/spot sub-toggle, the exam-section chips + hints toggle, and the activity routing that
renders the six modes + `LearnMode` — all wired from a single `topic` prop and wrapped in
`<TopicProvider>` (the `SPEC_DESCRIPTIONS` / `GLOSSARY` wiring folded in). Reduced
**`CpuArchitecture.tsx` to pure data**: its content consts + a `CPU_TOPIC: CSTopic` object
+ `export default () => <CSShell topic={CPU_TOPIC} />` — **560 lines, down from 779**, and
it's the canary: builds clean, 264 tests pass, behaves pixel-identically. Exported
`CSShell` + the `CSTopic` / `TopicScenes` types from the barrel. Also added **content-driven
activity hiding**: `CSShell` derives which of the six activities a topic backs from its data
(Learn↔`lessons`, Study/Cards/Quiz↔`cards`, Spot↔`myths`, Fill↔`cloze`, Exam↔`exam`/`synoptic`)
and auto-hides the rest from the desktop tabs and mobile `BottomNav` (nav hidden entirely for
a single-activity topic); the Quiz MCQ/Spot sub-toggle and the exam-section chips filter the
same way — so a data-only topic can omit whole modes with no extra config. `CpuArchitecture`
backs all six, so it's unchanged. The `validate.ts` CSTopic
CI checker is deferred to increment 8 (documented in `CS_SHELL_PLAN.md`, with the synoptic
top-level-`specTags` caveat that would otherwise false-fail the canary). Ticked increment 7
in `CS_SHELL_PLAN.md` and refreshed the Resume-here block. **Next (increment 8):** author
**1.1.2 CPU Performance** as one pure-data `CSTopic` — the payoff proof — and add the
CSTopic validator alongside it.

## 2026-07-27 — CS shell increment 6: ExamMode
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted **ExamMode**
— the exam/synoptic activity: command-word chips with a "what it's asking" guide, mark
tariffs, MCQ auto-mark, self-marking against a mark scheme, context re-rolls, and the
model-answer reveal — out of the tool and into **`src/shared/cs/modes/ExamMode.tsx`**. It's
now self-contained and content-driven: it takes `questions` (exam) + `synoptic` props and
reads spec descriptions from the topic context via `SpecBadge`; `MARK_FORMATS` /
`COMMAND_GUIDE` come from shared. The pure `resolvePrompt` helper and the `MarkPips`
sub-component moved into the mode with it. The topic's `EXAM_QUESTIONS` /
`SYNOPTIC_QUESTIONS` stay as **topic data** in `CpuArchitecture.tsx`, which now just renders
`<ExamMode questions={exam} synoptic={SYNOPTIC_QUESTIONS} … />` and shed its now-unused
imports. Exported `ExamMode` from the barrel. All six recall modes now live in the shell;
Exam behaves identically — builds clean and 264 tests pass. Ticked increment 6 in
`CS_SHELL_PLAN.md`. Next (final extraction): assemble `CSShell` and reduce `CpuArchitecture`
to `export default () => <CSShell topic={CPU_TOPIC} />`.

Also switched the session-handoff kickoff convention: kickoff blocks now use a fenced
`text` code block instead of the old `>>>` / `<<<` delimiters (which render as nested
blockquotes and break the paste boundary), and the rule now forbids naming a branch — every
kickoff starts from an up-to-date `main` on the session's own fresh branch. Updated
`CLAUDE.md` and the `CS_SHELL_PLAN.md` Resume-here block.

## 2026-07-27 — CS shell increment 5: LearnMode
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted **LearnMode**
— the lesson picker plus the stepped predict / flow / analogy / trace engine — out of the
tool and into **`src/shared/cs/modes/LearnMode.tsx`**. The engine was already generic; the
coupling to unpick was that it hard-wired `BoxSchematic` / `TraceTable` and the topic's
`LESSONS` / `LEGEND` / `CPU_SCHEMATIC` / `CPU_TRACE` consts. It now takes `lessons` plus a
**`scenes` config** (`{ schematic?, trace?, legend? }`) and maps each lesson's `kind`
descriptor to a representation (schematic → `BoxSchematic`, trace → `TraceTable`), so the
mode is topic-agnostic. The lesson content and CPU representation configs stay as **topic
data** in `CpuArchitecture.tsx`, which now renders `<LearnMode lessons={LESSONS}
scenes={{ schematic: CPU_SCHEMATIC, trace: CPU_TRACE, legend: LEGEND }} />`. Exported
`LearnMode` + the `LearnScenes` type from the barrel. The extraction preserves every beat,
gate and keyboard control, so Learn behaves identically; builds clean and 264 tests pass.
Ticked increment 5 in `CS_SHELL_PLAN.md`. Next: ExamMode, then assemble `CSShell`.

## 2026-07-27 — CS shell increment 4: data-driven representations
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Generalised the
hard-coded `CpuDiagram` into a reusable **`BoxSchematic`** and lifted **`TraceTable`**,
both into **`src/shared/cs/representations/`**. Each is now driven purely by a config
object: `BoxSchematic` takes a `SchematicConfig` (nodes + roles + dashed containers +
buses + free annotations, with an animated value token flowing between two nodes), and
`TraceTable` takes a `TraceConfig` (rows + role palette). The CPU box layout that used to
live inside the component — `PARTS` / `ROLE_COLOR` / `ROLE_TINT` — is now **topic data**
(`CPU_SCHEMATIC` / `CPU_TRACE` in `CpuArchitecture.tsx`), so other CS topics can supply
their own layouts against the same primitive. Added the representation types to
`types.ts` and exported both components from the barrel. The extraction preserves every
coordinate and colour, so the CPU diagram renders identically; builds clean and 264
tests pass. Ticked increment 4 in `CS_SHELL_PLAN.md`. Next: LearnMode (scene registry),
then ExamMode, then assemble `CSShell`.

## 2026-07-27 — CS shell increment 3: self-contained recall modes
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted the
five recall modes — **Study, Flashcards, Quiz, Spot-the-Mistake and Fill-in** — out
of the tool and into **`src/shared/cs/modes/`**, each parametrised purely by its
content prop (`cards` / `myths` / `exercises`) and reading glossary/spec data from the
topic context provider. The one topic-coupled helper (`buildChoices`, which drew MCQ
distractors from a module global) now takes the visible card pool as an argument, so
the modes carry no topic state. `CpuArchitecture.tsx` drops ~480 lines and imports the
modes from `../../shared/cs`; it builds clean and behaves identically (264 tests pass).
Ticked increment 3 in `CS_SHELL_PLAN.md`. Next: representations (`BoxSchematic`,
`TraceTable`), then LearnMode and ExamMode, then assemble `CSShell`.

## 2026-07-24 — CPU Architecture tool + CS shell foundations
The session that turned CS from a single quiz into a real strand. Built the
**`CpuArchitecture`** tool (`/cpu-architecture`, enabled) — spec-tagged,
exam-realistic, mobile-first OCR J277 1.1.1 revision with Learn mode,
self-marking, mark-scheme reveal and misconception handling. Began extracting a
reusable **`CSShell`** (`src/shared/cs/` — `types.ts`, `ui.tsx`, `tooltip.tsx`,
`context.tsx`) so future sub-topics (1.1.2 → 1.6) are authored as *data*, not
bespoke code — deliberately **separate** from the maths `ToolShell` (CS tools are
knowledge/recall, not generators). Reworked the **landing page** to band tools by
subject (Mathematics / Computer Science), and added the CS reference docs
**`CS_ROADMAP.md`** and **`CS_SHELL_PLAN.md`**. *(Merged to `main` as PR #38.)*

## Origins — `SystemArchitecture`
**`SystemArchitecture`** was the original and, until the CPU tool, only CS tool:
a standalone **quiz tool** ("1.1 — System Architectures"), never on the maths
shell by design. It's the reference for what the new `CSShell` is generalising.

---

## Keeping this current

At the **end of a session**, before you push:

1. Add an entry under the strand you touched (**Maths** or **Computer Science**),
   newest first, dated with the session's commit date.
2. Write it as *what shipped*, in plain English — one short paragraph, linking the
   tool/page/file it changed. Group the session's commits; don't transcribe them.
3. Update the moved prong's **Where it's at** line (and *At a glance* row) in
   `PROJECTS.md` — that is the single status/plan surface; this file is history only.
4. If the work is part of a **multi-session build**, give the user a copy-paste kickoff
   block in chat if they want to continue — but **do not save it anywhere**; kickoffs are
   generated on demand from `PROJECTS.md` (see *"Ending a session / session kickoffs"* in
   `CLAUDE.md`).
