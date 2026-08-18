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
| The per-tool pedagogy + readiness audit (criteria and live findings) | `docs/TOOL_AUDIT.md` |
| Shell architecture + contracts | `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` |
| What actually shipped, session by session | `docs/PATCH_NOTES.md` |
| Canonical names for every element | `docs/GLOSSARY.md` |
| Designing a new build in chat (pre-code) | `docs/design/DESIGN_STUDIO.md` + the spec templates |

---

## Priorities — three lenses, not equal weight

Everything below serves one of three audiences. They are **not equally weighted right now** —
this section is the standing lens for deciding what to pick up next, read it before choosing a
prong to build:

1. **Teacher-facing advancement — current priority.** New tools, and features a teacher reaches
   for *during* a lesson instead of leaving the software. SmartGrapher is the model case: a quick
   in-lesson graph instead of tabbing out to Desmos/GeoGebra. New question types, broader sub-tool
   coverage, and new tools built from `specs/` all count too. This is what actually gives a teacher
   more to use — default build effort here.
2. **Student-led self-teaching — currently dormant.** The Skills library and the Worked Example
   mode's step-by-step fragment reveal, i.e. a learner working through content alone. Real,
   dev-gated, and not being retired — but **not currently pushed** as a use case, so it shouldn't
   be where effort concentrates. Worked Example is also, in practice, the least-used of ToolShell's
   three modes.
3. **Tool-building infrastructure — means, not end.** ToolShell and the techniques engine (generic
   structures for building working steps). Necessary to build tiers 1 and 2, but not a goal on its
   own — a tool ships fine with thinner working steps, and techniques are a quality investment, not
   a blocker. Build only as far as a specific tier-1 (or tier-2) need actually requires, not as a
   standalone completeness sweep across all tools.

The boundaries blur deliberately: techniques serve both tier 1 (real worksheet/whiteboard working
steps) and tier 2 (worked-example fragment reveal + skill links) — building one often touches the
other. Teach decks are nominally a teacher tool (front-of-class delivery) but are authoring-heavy
and still the least mature prong, so in practice they sit behind new-tool/utility work until a
session specifically picks them up. When in doubt: a new tool or an in-lesson utility beats another
pedagogy-engine sweep.

---

## At a glance

| Prong | Status | One-line |
|---|---|---|
| **Maths Tool Audit** | ✅ | All 27 tools audited — see `docs/TOOL_AUDIT.md`; findings now drive the four prongs below |
| **Tool expansion (Part 2)** | 🚧 | Per-tool content-growth backlog (new question types, broader coverage) — **tier-1 priority**, needs a dedicated sequencing pass |
| **SmartGrapher** | ✅ | Mature, embeddable; used in 3 tools — **tier-1 priority**: wire into more tools opportunistically |
| **Techniques engine** | 🚧 | Engine built; only 1 tool converted — build on demand for tier-1 needs, not a standalone sweep (see Priorities) |
| **Skills library** | ⏸ | Engine + backlog ready; 2 skills built — tier-2 (student-led), not a current priority |
| **Core representations** | ⏸ | 3 of 6 visual families have Teach scenes — feeds Skills/Teach decks (tier 2), paused alongside them |
| **Teach decks** | ⏸ | Engine built; one partial deck exists — least mature prong, secondary to tier-1 work |
| **Old-shell migration** | ✅ | Backlog empty; Generators are standalone by design, not migration targets |
| **Computer Science shell** | ⏸ | Parked while the Maths Tool Audit is in progress |
| **Decision Maths** | ⏸ | Parked while the Maths Tool Audit is in progress |

Status keys: ✅ done · 🚧 in progress · ⬜ not started · ⏸ paused (deliberately not a current priority).

---

# Maths Tool Audit

**Complete.** A systematic, per-tool review of every Maths ToolShell question generator — all 27
tools across Number, Algebra, Ratio & Proportion, and Geometry are now audited, findings logged in
`docs/TOOL_AUDIT.md`. The four Maths pedagogy prongs beneath this one (Techniques engine, Skills
library, Core representations, Teach decks) plus SmartGrapher now **take their next steps from this
audit's findings** — see the refreshed technique/skill tables below.

**Where it's at.** All four categories complete. From Number: two tools (`FractionsAddSub`,
`Percentages`) came out close to reference quality; the other four are "live but flagged for
expansion" on content depth, with `PowersOfTen`'s working steps the weakest found in that category
(two fixed-template sentences, no computed numeric line). From Algebra: `NonLinearSimEq` — the
repo's one techniques-engine conversion — turned out to be a genuine hybrid (its highest-frequency
sub-tool still hand-rolls its solve chain), confirming both of its previously-known working-step
gaps still present at the exact generator-code level; `CompletingTheSquare.tsx`, the named
shell-wiring reference, is equally unconverted on the techniques/fragment axis. From Ratio &
Proportion: the audit's clearest live/gated contrast — `SimplifyingRatiosTool` (dev-gated) is
recommended to **stay gated**, being the only tool with zero QO control and zero visual
representation, next to its live sibling `RatioSharingTool` which has both; `FractionsOfAmounts`
came out reference-quality. From Geometry: a category-wide finding that six of the eight tools build
every working step through `tStep()` only, making them structurally incapable of the fragment
convention (not just thin authors of it); a second split where only 4 of 8 tools use the shared
`handleDiagramPrint` — two of the three hand-rolled holdouts are the very files `CLAUDE.md` names as
the SVG/renderer references, and two of those three hand-rolled handlers have confirmed functional
bugs (`BasicAngleFacts` silently drops section headers on differentiated worksheets;
`CircleProperties`' Differentiated toggle does nothing at all); and `PerimeterTool` — named in
`docs/TOOL_AUDIT.md`'s own intro as the example of why a live `enabled` flag can't be trusted as a
quality signal — confirmed exactly that prediction (well-engineered shell, thinnest QO richness of
the whole audit). `PROJECTS.md`'s skills table had zero Geometry rows before this pass; two are now
proposed (`apply-angle-fact`, `unit-conversion`) to seed it, alongside a new
`sumPerimeter`/`deriveMissingSide` technique. Several content bugs and doc-drift findings surfaced
across all four categories (`CollectingLikeTerms`' info text vs. its generator; a redundant no-op
step in `SolvingLinearEquations`; `CLAUDE.md`'s reference-implementations table not actually naming
`FractionToRatio.tsx`), findings only, not fixed. The full methodology, scope list, per-tool
template, and every individual finding in full detail live in **`docs/TOOL_AUDIT.md`**.

**Why this exists, in short:** the four pedagogy prongs and SmartGrapher each had their own
backlog, but priority between them (and between tools) had been picked anecdotally, not from a
real view of per-tool need. This audit produced that view. It asked two separate questions of every
tool: (1) how far behind the shared pedagogy systems is it (an *infrastructure* gap — expected of
almost every tool, feeds the existing prong backlogs), and (2) judged blind to whether the tool is
currently live or dev-gated, does it stand on its own as a complete, well-rounded tool, or does it
feel thin/limited (a *standalone readiness* gap — feeds a new tool-parity backlog, including a
recommended live/gated status per tool). The full detail on both, plus the exact grep/inspection
technique for finding conventions debt (non-standard column caps, hidden font controls, bespoke
print handlers, etc.) and why the current `enabled` flag can't be trusted as a quality signal, is
in `docs/TOOL_AUDIT.md`.

**Next steps run on two tracks**, deliberately kept separate because they need different kinds of
attention: **Part 1 roadmap** (below) sequences the *infrastructure* work — techniques, skills,
representations, Teach decks, SmartGrapher — by leverage, and is ready to build from directly. **Part
2 — Tool expansion** (below that) is the *content-growth* backlog per tool — new question types,
broader sub-tool coverage, scope decisions — and needs a dedicated pedagogy/product pass, not a
leverage score. A few smaller items sit outside both tracks and can be picked up any time without a
design conversation:
- The one gating sign-off: whether to act on `SimplifyingRatiosTool`'s "stay gated" recommendation.
- ✅ **`CircleProperties` fixed (2026-08-18)** — migrated its hand-rolled fixed-3×5-grid
  `customPrintHandler` onto the shared `handleDiagramPrint`, fixing the confirmed Differentiated
  silent-no-op bug and the `fixedColumns`/missing-`hideFontControls` debt in one pass (its diagrams
  are always square, so the default `_aspect` of 1 needed no extra work). `BasicAngleFacts` (dropped
  section headers) and `AnglesInParallelLines` still need the same migration.
- ✅ **`EquationsOfLines` fixed (2026-08-18)** — wired SmartGrapher into all three sub-tools
  (`gradient`/`equation`/`missing`): a live line-through-the-known-points graph now reveals on the
  Whiteboard once the answer is shown, the tool's single highest-leverage Part 1 gap per the audit.
- Whether to unpark Computer Science and/or Decision Maths now that the audit blocking them is done
  (see their sections below) — not a call this audit makes for you.

## Part 1 roadmap — the aligned, cross-prong build order

> **Priority note (2026-08-18).** This roadmap sequences the *pedagogy engine* (Techniques /
> Skills / Core representations / Teach decks) by cross-tool leverage — but per the Priorities
> section above, that engine is tier-3 infrastructure serving a currently-dormant tier-2 (student
> self-teaching), so it's **secondary to tier-1 work** (new tools, teacher in-lesson utilities like
> SmartGrapher — see "Tool expansion" and "SmartGrapher" below). Tier 0's already-built,
> zero-new-work items are still worth flipping on opportunistically. Treat the rest as background
> to pick up when tier-1 work isn't available, not the active queue.

Techniques, Skills, Core representations, Teach decks, and SmartGrapher stay **five separate prongs**
below — each keeps its own "Where it's at" and detail table — but they gate each other constantly (a
representation unlocks a skill; a skill and a technique are usually the same move at two different
grains), so building each prong in its own priority order wastes the leverage the audit found. This
roadmap sequences the *next build* across all five together, scored by leverage — how many tools each
item unlocks — per the audit's own Part 1 scoring rule. Each item is tagged with the prong it
belongs to and names the exact table row it refers to; nothing here replaces the prong sections
below, it's the cross-cutting view sitting on top of them. Update this roadmap (not just the tables)
whenever a tier's items ship, so it stays the one place that answers "what's next, across all of it."

**Tier 0 — Wire what's already built, no new engine work:** ✅ **built, dev-gated pending sign-off**
(see `docs/PATCH_NOTES.md`, 2026-08-15) — both items are live in code but only visible with
Developing-tools mode on; a non-dev user sees unchanged output until promoted.
- **[Skill]** Link the two unlinked `lcm` consumers — `SimultaneousEquations` and `FractionToRatio`
  both compute an LCM and never mark it, and the skill is already ✅ built. Two `[[lcm|LCM]]` markers.
  ✅ done (dev-mode only).
- **[Technique]** Wire `NonLinearSimEq`'s `linear` sub-tool onto the already-built
  `solveLinearEquationSteps` instead of its hand-rolled solve chain — fixes the confirmed `−1x`
  display bug for free, and gives `solveLinearEquation` its first real second consumer. ✅ done
  (dev-mode only) — the original hand-rolled chain is kept as `legacySolvePos`/`legacySolveNeg` and
  stays what a live user sees until this is reviewed and the dev-mode branch is deleted/promoted.

**Tier 1 — The one decision that unblocks the most downstream work:**
- **[Representation]** Algebra tiles vs. area model — which ships next. Algebra tiles now gates more
  combined demand than the pre-audit guess assumed: the `solve-linear-equation` skill (3 consumers)
  plus the `collect-like-terms` skill (2 consumers) = **5 tool-consumers** waiting on one
  representation. Area model gates the `expand-double-brackets` skill, the `factorise-quadratic`
  skill, and the `completeTheSquare` technique — real, but **~3 tool-consumers** today. Algebra
  tiles has the stronger case, a reversal of the pre-audit "prioritise by blockage" guess further
  down this doc.
- **[Representation]** Rule on the Geometry open question — does an angle/circle/polygon diagram
  need a 7th core representation, or is "the diagram is its own representation" a legitimate standing
  exemption? Raised independently by all 8 Geometry tools in the audit (see `docs/TOOL_AUDIT.md`'s
  Geometry category summary). Doesn't block Tier 2's `apply-angle-fact` — that can ship text-first
  either way — but does decide whether a Geometry Teach deck is ever buildable.

**Tier 2 — Highest-leverage builds, start now (don't wait on Tier 1):**
These ship without a representation decision — the same `(none — text)` pattern
`substitute-into-formula`/`rearrange-formula` already use:
- **[Technique + Skill]** `applyAngleFact` / `apply-angle-fact` — needed by **5 of 8 Geometry tools**
  (`BasicAngleFacts`, `AnglesInTriangles`, `AnglesInQuadrilaterals`, `AnglesInParallelLines`,
  `Bearings`), the single biggest demand signal in the whole audit.
- **[Technique]** `collectLikeTerms` — 3 consumers (`CollectingLikeTerms`, `ExpandingBrackets`,
  `SolvingLinearEquations`). The technique itself doesn't need algebra tiles; only its matching skill
  does (Tier 1).
- **[Technique]** `solveLinearEquation` adoption — already 🚧 grain-aware and built; `SolvingLinearEquations`
  just needs to actually call it (a zero-new-import integration point it currently doesn't use).
- **[Skill]** `rearrange-formula` — 4 consumers (`Iterations`, `NonLinearSimEq`, `EquationsOfLines`,
  `CircleProperties`), text-only, no blockers.
- **[Skill]** `unitary-method` — 3 consumers across two categories (`Percentages`, `RecipesTool`,
  `BestBuys`), bar model already exists.
- **[Skill]** `simplify-fraction` — 3 consumers (`FractionsAddSub`, `FractionMultDiv`,
  `FractionsOfAmounts`), bar model already exists.

**Tier 3 — Two-consumer items, sequence opportunistically:**
**[Technique + Skill]** `expandBrackets` / `expand-double-brackets` (blocked on Tier 1's area-model
call) · **[Skill]** `fraction-of-amount` · **[Skill]** `hcf` · **[Skill]** `substitute-into-formula` ·
**[Skill]** `convert-mixed-improper` · **[Skill]** `simplify-ratio` · **[Skill]** `unit-conversion`
(bar model / prime tiles / text — no blockers except `expandBrackets`).

**Tier 4 — Single-tool items:**
Everything else in the technique/skill tables below — real demand, but each unlocks exactly one
tool. Fill-in work between the tiers above, not a queue of its own.

**Cross-cutting, any time:**
- **[Grapher]** ✅ `EquationsOfLines` wired onto SmartGrapher (2026-08-18). `CompletingTheSquare`,
  `Iterations` still confirmed unwired — both cheap (existing presets fit directly), no dependency
  on anything above.
- **[Technique]** Runtime grain toggle ("Detailed working" brief↔full) — the one shell-level change
  still on the Techniques engine list.
- **[Deck]** Teach decks stay the least mature prong (1 deck, 1 category built) — reasonable to leave
  last unless a second proof-of-format deck is wanted as a parallel, low-stakes task.

## Part 2 — Tool expansion

> **Tier-1 priority (see Priorities above).** This is the actual content-growth backlog — new
> question types, broader sub-tool coverage, scope a tool should grow into. It's what gives a
> teacher more to use, so it's the default place to look for the next build once the sequencing
> pass below happens — ahead of the pedagogy-engine roadmap in Part 1.

**Scope, precisely:** this is the audit's Part 2 *standalone-readiness content* findings — missing
question types, narrow sub-tool coverage, scope a tool should grow into — the items that need a
pedagogy/product decision (which topics matter most to teach next), not just an engineering one.
**The print-handler bugs and the `SimplifyingRatiosTool` gating call are deliberately not part of
this list** (see the mechanical items above) — they're fixes and a sign-off, not expansion decisions.

The actual expansion backlog — per-tool findings like "no worded/contextual question type,"
"`formingRatios`' QO is flat across levels," "no squared-single-bracket question in
`ExpandingBrackets`," "no parallel/perpendicular question in `EquationsOfLines`" — isn't resequenced
here yet. It needs a tool-by-tool prioritisation pass of its own, sequencing by which topics matter
most to expand next rather than by the raw size of the gap, which is a separate session's work.
`docs/TOOL_AUDIT.md`'s 36 per-tool entries — the Part 2 section of each — are the full source list
for that pass when it happens.

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

> **Sequencing note.** The Maths Tool Audit (`docs/TOOL_AUDIT.md`) is now complete — the
> technique-audit and skills tables below have been refreshed with real per-tool demand from all
> 27 tools ("needed by `<tool>`" annotations throughout), and the **"Maths Tool Audit" section above
> now has a dedicated "Part 1 roadmap"** that sequences the actual build order across all five
> prongs by leverage — read that first. The bullet-point "possible next steps" under each prong
> below still mostly predate the audit and are kept as background context, not the active queue.

## Techniques engine

> **Tier-3 (infrastructure) — build on demand, not a sweep.** Serves both tier-1 tools (real
> worksheet/whiteboard working) and tier-2 self-teaching (worked-example fragment reveal). A tool
> ships fine without it — only convert a tool onto the engine when a tier-1 need (a new tool, or
> making an existing one presentable) actually calls for it, not as a standalone completeness goal.

**Where it's at.** When tools moved onto the shared ToolShell they lost their hand-written working
steps and fell back to thin "jump to the answer" wrappers. The **techniques engine**
(`src/shared/techniques/`) restores that pedagogy *once, reusably* — titled, fragmented,
grain-aware (brief / standard / full) working blocks. The **engine and its viewer (`/techniques`)
are built**, and six techniques exist — but **only one tool (`NonLinearSimEq`) has been
converted**, so most tools still show thin working. The value is real but latent until the sweep
happens. **The viewer itself was reworked 2026-08-17**: every technique (including the composed
Full Worked Example) now has its own real tool page (`/techniques/<slug>`, e.g.
`/techniques/quadratic-formula`) built on a shared `TechniquePreviewPage`, rendering through the same
`WorkedExampleSteps` component (now extracted out of `ToolShell.tsx`) every real tool's Worked
Example uses — replacing the earlier popup overlay, which is now removed. That's the pattern for any
new technique going forward: a thin page + a `pageUrl` entry in `TechniqueLibrary.tsx`, not a popup.
See `docs/PATCH_NOTES.md` for the full list of rendering bugs fixed along the way.

**Possible next steps (background, pre-audit — see the sequencing note above):**
- Add a runtime **"Detailed working" toggle** so a teacher can flip grain (brief ↔ full) live — the one shell change on the list.
- **Sweep more tools** onto the engine — start with the high-frequency moves below.
- Grow the technique library as the sweep needs new moves.
- Add a **CI shape-check** (every method emits ≥N titled steps, no duplicate consecutive lines) once enough tools are converted.
- Close the known medium-grain gaps in `NonLinearSimEq`, both **confirmed still present at the exact
  generator-code level** by the Tool Audit's Algebra pass: (1) the `(2x−5)²` expansion isn't shown —
  `buildWorking`'s substitute/expand-and-rearrange steps never compute an unsimplified intermediate,
  and the `BankEntry`/`FormBankEntry` data model has nowhere to store one even if a step were added,
  so this needs a data-model change, not just a new `w.step()` call; (2) the cosmetic `−1x`-should-
  be-`−x` bug lives specifically in the `linear` sub-tool's own `solvePos`/`solveNeg` helpers, which
  interpolate a computed combined coefficient raw instead of routing it through the file's own
  `nextT`/`coef()` sanitizer that every other code path in the file already uses correctly — the fix
  is to route that one value through the existing sanitizer, or better, to stop hand-rolling that
  sub-tool's solve chain and call the already-built `solveLinearEquationSteps` instead (see the
  technique-audit table below).

**Detail — techniques built:** `quadraticFormulaSteps` (grain-aware), `solveLinearEquationSteps`
(grain-aware), `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`.
Reference conversion: `NonLinearSimEq.tsx` (uses `standard` grain).

**Detail — the technique audit (build backlog; start high-frequency).** Status: ✅ built · 🚧 partial · ⬜ needed.

*Algebra & cross-cutting*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | **high** | 🚧 grain-aware version exists — needed by `SolvingLinearEquations` (zero-new-import integration point — already re-exported from `"../../shared"`) and now wired into `NonLinearSimEq`'s `linear` sub-tool (Tier 0, 2026-08-15), fixing the confirmed `−1x`-should-be-`−x` display bug — but **dev-mode-only for now**: a live user still sees the old hand-rolled chain (`legacySolvePos`/`legacySolveNeg`) until this is reviewed and promoted |
| `expandBrackets` | single / double / squared brackets (FOIL, grid) | **high** | ⬜ — needed by `ExpandingBrackets` (also needs a squared-single-bracket question type its own spec calls for but the tool lacks) and `NonLinearSimEq` (confirmed gap: `(2x−5)²` expansion never shown, no field in the data model to hold it) |
| `substitute` | substitute a value/expression into an equation or formula | **high** | 🚧 substitute-back only — needed by `NonLinearSimEq` |
| `collectLikeTerms` | gather like terms | med | ⬜ — needed by `CollectingLikeTerms`, `ExpandingBrackets`, and (for its opening "reduce x's" move) `SolvingLinearEquations` |
| `makeSubject` / rearrange | rearrange for one variable | med | 🚧 brief only — needed by `NonLinearSimEq` |
| `factoriseQuadratic` | factorise → set factors to zero → roots | med | 🚧 read-the-roots half exists — needed by `NonLinearSimEq` |
| `quadraticFormula` | formula → substitute → discriminant → roots | med | ✅ |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | low | ⬜ — note: `CompletingTheSquare.tsx` is the repo's named shell-wiring reference but is itself fully unconverted on this axis (Tool Audit, Algebra pass) |
| `solveByElimination` | scale, add/subtract to eliminate | med | ⬜ — needed by `SimultaneousEquations`; cheaper than a fresh build since two of its three moves (substitute-back, solve-linearly) already exist in the engine and this tool already hand-derives correct elimination logic to lift |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | **med** *(bumped from low)* | ⬜ — `Iterations`' three sub-tools (iterate / rearrange-then-iterate / bound-test) map almost 1:1 onto this technique, a complete ready-made spec rather than an inferred need (Tool Audit, Algebra pass) |

*Number*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `simplifyFraction` | divide num & den by a common factor | **high** | ⬜ |
| `fractionOfAmount` | ÷ by denominator, × by numerator | **high** | ⬜ — needed by `FractionsOfAmounts` (Tool Audit, Ratio & Proportion pass) |
| `convertMixedImproper` | mixed ⇄ improper | med | ⬜ |
| `addSubtractFractions` | common denominator (LCM), add/subtract, regroup | med | ⬜ — needed by `FractionsAddSub` |
| `multiplyDivideFractions` | keep-flip-change, multiply across | med | ⬜ — needed by `FractionMultDiv` |
| `roundToSigFig` | round each value to 1 s.f. | med | ⬜ — needed by `Estimation` |
| `directedNumberAddSub` | start position → jump direction/size from sign rules → land | low | ⬜ — new, needed by `IntegerAddSub` (Tool Audit, Number pass) |
| `scaleByPowerOfTen` | count the zeros → state direction → show the digit shift | low | ⬜ — new, needed by `PowersOfTen` (Tool Audit, Number pass) |
| `percentageOfAmount` | multiplier vs. chunking decomposition | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `percentageChange` | build multiplier from 100 ± % | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `reversePercentage` | unitary method — find 1%, then scale | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |

*Ratio & Proportion*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `shareInRatio` | total parts → 1 part → each share | **high** | ⬜ — needed by `RatioSharingTool`, the category's sole real demand signal |
| `convertFractionRatio` | fraction ⇄ ratio | med | ⬜ — needed by `FractionToRatio`; that tool also needs `simplifyRatio` (below) for its `formingRatios` sub-tool |
| `simplifyRatio` | divide parts by a common factor | med | ⬜ — needed by `FractionToRatio` (`formingRatios`) and `SimplifyingRatiosTool` (numeric sub-tool); `SimplifyingRatiosTool`'s algebraic sub-tool is genuinely broader than this row's spec (also cancels shared variables/powers) — fold that scope in when built |
| `unitPriceCompare` | price ÷ quantity, compare | low | ⬜ — needed by `BestBuys`; the row's current spec only covers the `unitCost` sub-tool — `specialOffers`' real move is "resolve a deal structure to an effective price, then compare," a compound move one stage ahead — broaden the description or add a sibling row |
| `scaleRecipe` | scale ingredients by a factor | low | ⬜ — needed by `RecipesTool`'s `linearScaling` sub-tool; the row's spec doesn't cover `constraints`' actual move ("find each ingredient's per-serving rate, divide stock, take the minimum") — needs a second bullet or a sibling row (e.g. `limitingIngredient`) |

*Geometry*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line/point | **high** | ⬜ — needed by `BasicAngleFacts`, `AnglesInTriangles` (the cleanest demand signal — "the reasoning IS the move" genuinely holds there), `AnglesInQuadrilaterals` (richest demand signal, working already states the rule name every branch), `AnglesInParallelLines` (partial fit — rule-naming without shown arithmetic), and `Bearings` (a specific unstated back-bearing justification) — five of eight Geometry tools (Tool Audit, Geometry pass) |
| `gradientIntercept` | gradient formula, `y = mx + c`, solve for c | med | ⬜ — needed by `EquationsOfLines`; an unusually cheap conversion, since the tool already hand-computes the exact three-step shape correctly (Tool Audit, Geometry pass) |
| `circleFormula` | circumference / area / arc / sector | med | ⬜ — needed by `CircleProperties`, an unusually complete match: the tool alone demonstrates all four named sub-moves (Tool Audit, Geometry pass) |
| `sumPerimeter` / `deriveMissingSide` | add all given sides; for rectilinear shapes, use opposite-side equality to find missing lengths first | low–med | ⬜ — new, needed by `PerimeterTool`; none of the other three Geometry rows cover this move (Tool Audit, Geometry pass) |

~24 candidates, six built. Frequency concentrates on a handful — `solveLinearEquation`,
`expandBrackets`, `substitute`, `simplifyFraction`, `collectLikeTerms`, `makeSubject`,
`shareInRatio`, `fractionOfAmount`, `applyAngleFact` — build those first; each doubles as a needed
skill. Old-shell rows (`fractionOfAmount`, `convertFractionRatio`, `applyAngleFact`) are inferred —
confirm the exact moves when those tools migrate. **This table is exactly the kind of thing the
Tool Audit's Part 1 (Infrastructure alignment) cross-references per tool** — as each tool is
audited, update the priority/status columns here with real demand rather than the inferred
guesses above.

## Skills library

> **Tier-2 (student-led) — paused, not currently pushed.** The site isn't currently positioning
> itself as a self-teaching tool, so this isn't a current investment target. Not being retired —
> just not where the next session's effort should default to.

**Where it's at.** Small slide-sequences that each teach **one prerequisite skill**
(`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill-id|term]]`
links in worked examples. **Two skills exist** (`lcm`, `lcm-prime-factors` — LCM two ways). CI
validates every skill. A clear backlog is tied to which representation each skill needs — the cheap
ones sit on scenes that already exist; the rest wait on the representation work below.

**Possible next steps (background, pre-audit — see the sequencing note above):**
- Build the **cheap, high-value cluster** on existing scenes — equivalent-fractions, simplify-fraction, HCF, share-in-ratio, fraction-of-amount, convert-mixed-improper.
- Sequence the skills that need a **new scene** (solve-linear-equation, expand-double-brackets, directed-number) alongside the representation work.
- **Unify skills with techniques** — let a skill's full teaching and a technique's full output share one source, so they can't drift; prototype on one skill.
- **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.

**Detail — skills to develop** (a skill is the drill-down teaching for a prerequisite a tool *uses
but doesn't teach*; the representation column signals effort — existing scene = cheap).

| Skill (id) | Teaches | Representation / scene | Priority | Status |
|---|---|---|---|---|
| `lcm` / `lcm-prime-factors` | lowest common multiple | number line `multiples`; prime tiles `factorTree`/`primeVenn` | — | ✅ — unlinked consumers found: `SimultaneousEquations`' `lcm` sub-tool (Algebra pass), `FractionToRatio`'s L2 "LCD:" step (Ratio & Proportion pass) — both compute the value but never link it |
| `equivalent-fractions` | scale num & den by the same factor | **bar model** `split`/`equivalents` *(exist)* | **high** | ⬜ — needed by `FractionsAddSub` |
| `simplify-fraction` | divide num & den by the HCF | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv`, and now `FractionsOfAmounts` (its `asFraction` sub-tool, three consumers total) |
| `hcf` | highest common factor | **prime tiles** `primeVenn` *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts` (`asFraction`'s HCF step) and `RecipesTool` (its L2 HCF-based scaling step) — first named consumers |
| `share-in-ratio` | total parts → 1 part → each share | **bar model** *(exists)* | **high** | ⬜ — needed by `RatioSharingTool`, the category's sole real demand signal |
| `fraction-of-amount` | ÷ by denominator, × by numerator | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts`, a near-exact fit since the tool's own working already narrates the bar-model method; `CircleProperties`' `sectors` sub-tool (θ/360 × formula) is also a structurally identical, cross-topic unnamed consumer (Tool Audit, Geometry pass) |
| `convert-fraction-ratio` | express a fraction as a complementary part:part ratio, and the reverse | **bar model** *(existing `split`/`equivalents` scenes — cheap)* | med | ⬜ — new, needed by `FractionToRatio` (Tool Audit, Ratio & Proportion pass); its `convertFractionRatio` technique row had no matching skill row before this pass, breaking the pairing pattern every other row follows |
| `solve-linear-equation` | do the same to both sides | **algebra tiles** / number line *(no tile scene yet)* | **high** | ⬜ — needed by `SolvingLinearEquations`, and now also `BasicAngleFacts` (its L3 algebraic sub-tools) and `AnglesInQuadrilaterals` (its algebra-form questions) — two more unlinked consumers (Tool Audit, Geometry pass) |
| `expand-double-brackets` | grid / area of each term pair | **area model** *(no scene yet)* | **high** | ⬜ — needed by `ExpandingBrackets` |
| `collect-like-terms` | group matching terms | **algebra tiles** *(no scene yet)* | med | ⬜ — needed by `CollectingLikeTerms`, `ExpandingBrackets` |
| `convert-mixed-improper` | mixed ⇄ improper fraction | **bar model** *(exists)* | med | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv` |
| `round-to-significant-figure` | find the place value, round | **number line** *(exists)* | med | ⬜ — needed by `Estimation` |
| `factorise-quadratic` | find the factor pair | **area model** *(no scene yet)* | med | ⬜ — needed by `NonLinearSimEq` |
| `substitute-into-formula` | replace letters with values | *(none — text)* | med | ⬜ — needed by `NonLinearSimEq`, and now also `EquationsOfLines` ("Substitute into y = mx + c") (Tool Audit, Geometry pass) |
| `rearrange-formula` | inverse operations to change subject | *(none — text / algebra tiles)* | med | ⬜ — needed by `Iterations`, `NonLinearSimEq`, and now also `EquationsOfLines` (`missing` sub-tool) and `CircleProperties` (L3 rearranging `C=2πr`/`A=πr²`) — a third and fourth consumer (Tool Audit, Geometry pass) |
| `simplify-ratio` | divide parts by a common factor | **bar model** *(exists)* | med | ⬜ — needed by `FractionToRatio` (`formingRatios`) and `SimplifyingRatiosTool` (numeric sub-tool) |
| `directed-number` | add/subtract/multiply negatives | **negative counters** *(no scene yet)* | med | ⬜ — needed by `IntegerAddSub` |
| `factor-pairs` | list the factor pairs of n | **prime tiles** *(exists)* | low | ⬜ |
| `place-value` | read the column value of a digit | *(none — closest fit is number line; PowersOfTen's own grid doesn't map onto any of the six)* | low | ⬜ — new, needed by `PowersOfTen` (Tool Audit, Number pass) |
| `keep-flip-change` | reciprocal + multiply for fraction division | **bar model** *(no scene authored yet for this specific move)* | low | ⬜ — new, needed by `FractionMultDiv` (Tool Audit, Number pass) |
| `percentage-to-multiplier` | convert a percentage to a decimal multiplier | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `unitary-method` | find 1%, then scale to the target | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass), and now also `RecipesTool` and `BestBuys` (Tool Audit, Ratio & Proportion pass) — three tools across two categories hand-roll this exact reasoning unlinked, the clearest cross-category demand signal found so far |
| `apply-angle-fact` | identify which angle rule applies (sum to 180/360, isosceles, exterior, vertically opposite) | *(none — angle diagrams sit outside the six-representation vocabulary; open question, see Core representations)* | **high** | ⬜ — new, pairs with the `applyAngleFact` technique; needed by `AnglesInQuadrilaterals` (richest demand signal), `BasicAngleFacts`, `AnglesInTriangles`, `AnglesInParallelLines`, `Bearings` (Tool Audit, Geometry pass) — `PROJECTS.md`'s skills table had zero Geometry rows before this pass |
| `unit-conversion` | convert between units of the same quantity (mm/cm/m, etc.) before calculating | *(none — closest fit is number line, same open-question status as `place-value`)* | med | ⬜ — new, needed by `PerimeterTool` (both sub-tools' L3) and `FractionsOfAmounts` (`worded` sub-tool) — two cross-category demand signals (Tool Audit, Ratio & Proportion and Geometry passes) |

Build the cheap cluster (top six after `lcm`) first — all on existing bar-model / prime-tile scenes,
each a prerequisite several tools link to. The equally-wanted `solve-linear-equation`,
`expand-double-brackets`, `collect-like-terms`, `factorise-quadratic`, `directed-number` need a **new
scene type**, so sequence them with the representation work.

## Core representations

> **Tier-2/3 — paused alongside Skills/Teach decks.** Its consumers (Skills library, Teach decks)
> are both currently dormant, so a new representation isn't unlocking tier-1 work right now. Revisit
> once Skills/Teach decks are picked back up.

**Where it's at.** The site commits to **six core visual representations** as a shared vocabulary,
so the same bar model a student meets in fractions reappears in ratio. New visuals must reuse one of
the six; new scenes extend an existing `TeachScene` family in `TeachingDeck.tsx`. **Three have
animated scene families built**: bar model (`split`/`combine`/`equivalents`), number line
(`multiples`), prime factor tiles (`factorTree`/`primeVenn`). **Three don't yet.** These are the
biggest lever on the Maths side — each new representation unlocks a cluster of skills and decks.
**Open question surfaced by the Tool Audit's Geometry pass:** none of the six obviously cover an
angle/circle/polygon SVG diagram — every Geometry tool independently hit this same gap, and the
diagram itself appears to function as its own representation, outside the six-vocabulary system
entirely. Recorded as a standing open question (`docs/TOOL_AUDIT.md`'s Geometry category summary),
not assigned an owner — a decision on whether Geometry needs a seventh representation, or is
legitimately exempt, is still open.

**Possible next steps — superseded by the audit's Tier 1 finding, see the "Part 1 roadmap" in the
Maths Tool Audit section above.** Kept here for background only: build an area-model scene family
(unlocks `expand-double-brackets`, `factorise-quadratic`, `completeTheSquare`); build algebra-tile
scenes (unlocks `solve-linear-equation`, `collect-like-terms`); build negative counters (unlocks
`directed-number`). **The audit resolved the "prioritise by blockage" call this list used to leave
open**: algebra tiles now gates 5 tool-consumers across its two skills vs. area model's ~3 — algebra
tiles has the stronger case, ahead of negative counters' single consumer (`directed-number`,
`IntegerAddSub` only).

**Detail — the six and their scene status.** Bar model ✅ (`split`/`combine`/`equivalents`) · number
line ✅ (`multiples`) · prime factor tiles ✅ (`factorTree`/`primeVenn`) · area model ⬜ (no scenes) ·
algebra tiles ⬜ (manipulative only) · negative counters ⬜ (nothing yet). Prime tiles are coloured by
the prime (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink) so the same prime looks the same everywhere;
composites stay plain numbers. Adding a scene type: extend the `TeachScene` union, add its beat count
to `sceneMaxStep`, render it in `SceneView` — animate opacity/transform only, reserve space for
everything (the standing scene contract).

## Teach decks

> **Teacher-facing in nature, but secondary in practice.** Front-of-class lesson delivery is
> squarely tier-1, but this is the least mature, most authoring-heavy prong — one partial deck for
> one tool. Behind new-tool/utility work until a session specifically wants to prove the format
> further, not because it's the wrong audience.

**Where it's at.** A slide-based "teaching part of the lesson" (`TeachingDeck`), dev-gated. The
**engine is built and proven** — hand-authored, misconception-driven slides the teacher presses
through one beat at a time. **Content is the thin part**: only `FractionsAddSub` has a deck, and
only its *Concepts* category (an I-do → We-do → You-do sequence on equivalent fractions). Its other
two categories (True/False, Spot the Mistake) are stubbed "Coming soon", and no other tool has a
deck yet. So the open question is less "what to build" and more "what proves the format".

**Possible next steps (background, pre-audit — see the sequencing note above):**
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

> **Tier-1 priority.** The model case for "teacher-facing advancement" — a quick in-lesson graph
> instead of leaving the software. Wiring it into more tools is one of the highest-value, lowest-
> effort things to pick up next (see the still-unwired candidates below).

**Where it's at.** A **mature**, embeddable, data-driven graph component (`src/shared/grapher/`)
with its own test bench at `/grapher`. Live in three tools (Mixed Strategies L3 lower-envelope,
NonLinearSimEq two-curves-plus-intersection, and — wired 2026-08-18 — EquationsOfLines'
line-through-the-known-points graph across all three sub-tools) and **self-validating** — it
derives the graph from the
answer data and refuses to draw if they disagree, so a data inconsistency omits the graph rather than
drawing wrong geometry. Less a "project", more a reusable utility to reach for. The Tool Audit's
Algebra pass confirmed both `CompletingTheSquare` and `Iterations` are still fully unwired (zero
grapher usage found in either file) despite already being named candidates below — `Iterations` in
particular is now flagged as the highest-leverage unwired candidate found so far, since the tool is
fundamentally about visualising convergence to a root yet has zero visual content today, and the
`quadratic`/`cubic`/`custom` presets already cover its formula types directly. Also confirmed:
`NonLinearSimEq`'s own ellipse limitation (only pure circles get a graph — two-thirds of its Level-3
non-linear questions draw no curve, since ellipse isn't a supported series type) is disclosed in the
tool's own info modal, not a silent gap.

**Possible next steps (background, pre-audit — SmartGrapher fit is now also part of the Tool Audit's
Part 1 per tool, see `docs/TOOL_AUDIT.md`):**
- ✅ **Equations of Lines** wired (2026-08-18) — a line-through-the-known-points graph for all
  three sub-tools (`gradient`/`equation`/`missing`), revealed on the Whiteboard alongside the answer.
- Add graphs to the remaining candidates — **Completing the Square** (parabola + vertex, confirmed
  still unwired), **Iterations** (the curve and the root being approached, confirmed still unwired
  and now the top candidate).
- Add an **ellipse preset** if/when a tool needs ellipse-and-line (presets today: linear · quadratic · cubic · circle · custom) — would close `NonLinearSimEq`'s disclosed ellipse gap.
- Mostly: pull it in opportunistically when building or migrating any coordinate/quadratic tool.

## Old-shell migration

**Where it's at.** Older tools hand-roll their own UI (~800–1,300 lines); v2.3 tools use the shared
ToolShell (~250–350). **The migration backlog is now empty** — `SimplifyingRatiosTool` (the last
entry) has been brought onto ToolShell, keeping its numeric and algebraic ratio-simplification
maths verbatim; it stays `enabled: false` pending a decision on going live.
`src/tests/organisation.test.ts` is the CI-enforced source of truth for which tool is on which
shell. The four Generators tools (`TimesTablesGenerator`, `MultiplicationGenerator`,
`NegativeOperationsGenerator`, `FunctionalSkillsGenerator`) are **not** migration targets — they
exist to batch-produce PDF worksheets, a different purpose from ToolShell's
whiteboard/worked-example/worksheet model, and are now categorised standalone-by-design rather than
backlog.

This prong is **done** as far as shell architecture goes — it's not fed by the Tool Audit the way
the pedagogy prongs above are. The audit's Part 2 (standalone readiness) will separately produce a
recommended live/gated status per tool, including for `SimplifyingRatiosTool` — see
`docs/TOOL_AUDIT.md`. That's tracked there, not here, since it's a content-readiness question, not
a shell-migration one.

**Possible next steps:**
- If the Generators family ever grows well past four, revisit whether a dedicated **Generator shell** is worth building — not needed today.

**Detail.** Enabled/done: `FractionsOfAmounts`, `AnglesInTriangles`, `NonLinearSimEq`, `PowersOfTen`,
`FractionToRatio`, `PerimeterTool` (techniques wiring still to add on some). Migrated but dev-gated:
`SimplifyingRatiosTool`. Standalone by design (never migrate): `SystemArchitecture`, `AlgebraTiles`,
`ParallelLinesInteractive`, `GrapherLab`, `Visualiser`, `CallSelector`, `p-value`, `SkillLibrary`,
`TechniqueLibrary`, and the four Generators tools (PDF-batch output, different purpose).
`organisation.test.ts` holds the authoritative lists — update it when a tool moves.

---

# Computer Science

> **⏸ Parked.** Not a current priority while the Maths Tool Audit (see above) is in progress. Kept
> here so the plan isn't lost — pick back up once the Maths audit and its resulting backlog are in
> hand.

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

**Possible next steps (spitball — pick on the day, once unparked):**
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

> **⏸ Parked.** Not a current priority while the Maths Tool Audit (see above) is in progress. Kept
> here so the plan isn't lost — pick back up once the Maths audit and its resulting backlog are in
> hand.

AQA A-level Further Maths, **Discrete Mathematics** (graphs & networks: MST, TSP, CPA, Dijkstra,
route inspection, flows, LP). A network-native shell (`DecisionShell`, `src/shared/decision/`),
parallel to the others; contracts and the full increment plan live in `docs/architecture/DECISION_SHELL_PLAN.md`.

## Decision tools

**Where it's at.** **Increment 1 shipped** — the first end-to-end slice: pure `NetworkView` +
`MatrixView` renderers, a thin shell with a **Question** mode and a **Solution** stepper
(forward/back through the algorithm one beat at a time, with a running total and a "show all"),
and one tool — **Minimum Spanning Tree** (Kruskal's algorithm). CI checks each tool's solver
against an independent brute-force reference. Deliberately narrow so far: one network template,
one question type, one level. Also now available: `src/shared/decision/randomNetwork.ts`'s
`generateRandomNetwork()` — a procedural, provably crossing-free network generator (Euclidean MST +
crossing-checked extra edges) harvested from an old archived draft, with a best-effort
`routeInspection` mode for a future Route Inspection / Chinese Postman tool. Not wired into any
tool yet — see `DECISION_SHELL_PLAN.md` → "Templating model" for the detail.

**Possible next steps (spitball — pick on the day, once unparked):**
- Broaden MST — add **Prim's** (network walk + Prim-on-the-matrix), more question types (apply Prim from node X, list rejected edges), Levels 1–3, more templates.
- Add the **expand-to-sandbox** — open the generated network in an interactive, annotatable canvas.
- Add **worksheet print** via the existing diagram-print engine.
- Start a **second tool** once MST feels complete — TSP reuses the same renderers; CPA needs two new views.
- Build **Route Inspection (Chinese Postman)** on top of `generateRandomNetwork`'s `routeInspection` mode — the odd-degree-nudge groundwork already exists.

**Detail.** The full increment ladder (MST breadth → sandbox → print → TSP → CPA → onward) and the
per-strand representation budget live in `docs/architecture/DECISION_SHELL_PLAN.md` → "Increment plan" — that doc owns
the ladder. We're on **increment 1 ✅**; **increment 2 (MST breadth)** is next.

---

*Keeping this current: when a session moves a prong, update its **Where it's at** line and its *At a
glance* row here, alongside the `docs/PATCH_NOTES.md` history entry. Next-step bullets are spitball — prune
the done/ruled-out ones. Keep the deep tables above accurate as work lands. The Maths Tool Audit's
own progress is tracked in `docs/TOOL_AUDIT.md`, not duplicated here — mirror only its category
status (⬜/🚧/✅) into the At-a-glance row above.*
(Standing authoring principles — e.g. "never store the same fact twice" — live in `CLAUDE.md`, not here.)*
