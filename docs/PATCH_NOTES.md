# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. Read this at the
**start of a new conversation** to see where we're up to; append to it at the
**end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `docs/PROJECTS.md` — where every prong is up to and what's next. *The plan* (absorbs the old roadmaps).
- `docs/TOOL_AUDIT.md` — the Maths Tool Audit's methodology and live per-tool findings log. *The current priority.*
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

## 2026-08-19 — Worksheet Builder unification: classic/full split removed
Built the prong scoped 2026-08-18. `WorksheetBuilder` (`src/shared/WorksheetBuilder.tsx`) is now a
single implementation — `classic={!devMode}` is gone, and worksheet-building no longer differs by
Developing-tools mode. Kept every "full" feature (sections, per-section heading/shuffle/columns) but
rebuilt the UI around classic's preferred model, since the complaint was the *structure*, not the
feature set:
- Persistent two-pane layout always (group list left, selected group's QO options in a fixed panel
  right) — replaces full's inline accordion-under-the-row, which reflowed the list on every edit.
- Sections are opt-in and invisible until used: a flat, unsplit list has zero section chrome, matching
  old classic exactly. Splitting creates section header strips (heading, Shuffle, per-section columns)
  only once they're needed.
- Section breaks are created **in place** via a hover-reveal "+ Split section" control in the gap
  between any two group rows, replacing full's append-only "Add section" button at the bottom of the
  list — a break can now go anywhere, not just at the end.
- Decluttered the section header strip (dropped divider pipes and the "col" label; smaller column
  picker) and made the global column picker in the Design line context-sensitive (shows only while
  unsplit; per-section pickers take over once split).
`ToolShell.tsx`'s two `<WorksheetBuilder>` call sites no longer pass `classic`. `npm run build` clean,
`npm test` 304/304 passing. Still open: URL-sync for the Builder's groups/sections, and a `CLAUDE.md`
`WorksheetBuilder` reference section — both tracked in `docs/PROJECTS.md`.

## 2026-08-18 — Worksheet Builder's undocumented classic/full split, scoped for tomorrow
Findings-only session, no code changed. `docs/PROJECTS.md` gains a new prong, **Worksheet Builder
unification**, scoping a previously undocumented gap for the next build session: `WorksheetBuilder`
(`src/shared/WorksheetBuilder.tsx`) silently renders two different builders depending on
Developing-tools mode (`classic={!devMode}`) — a flat classic mode (one global column count, no
sections) versus a full sectioned mode (per-section headings/shuffle/columns) — on top of a third,
separate "Standard Worksheet" surface in `ToolShell.tsx` that was never gated at all. The aim for
next session: unify classic/full into one always-live builder and remove the gate entirely — worksheet
mode should never differ by dev-mode state. The prong entry records the full current-state
breakdown plus the open design call (sectioning always-on vs opt-in vs hybrid) and a recommended
default, ready to pick up cold.

## 2026-08-18 — New `parkedMode` gate: Skill Library + Teach decks split off from Developing-tools mode
`Developing-tools mode` had been conflating two different things: work currently in the pipeline
(in-progress tools, the Technique Library, Grapher Lab) and content that's dormant/not a current
focus (the Skill Library, Teach decks) but isn't literally broken either. Flipping the one visible
toggle showed both at once, which read as "here's everything unfinished" when really only the first
group is.
- Added `src/parkedMode.ts` — a second, stronger gate with **no visible UI toggle**. It only unlocks
  via `?parked=1` in the URL (persisted in localStorage afterwards, same mechanism as `devMode`, and
  the param is stripped from the address bar once read).
- `registry.ts`'s `ToolMeta` gained a `parked?: boolean` field; the `skill-library` entry now sets it.
  `App.tsx` gained a `ParkedRoute` guard — a parked tool's route 404s outright without the flag,
  stronger than an ordinary `enabled: false` tool (whose route still works by direct URL).
- `LandingPage.tsx`'s `visibleIn()` now treats `parked` tools as requiring `parkedMode` specifically
  — Developing-tools mode alone no longer reveals them.
- `ToolShell.tsx`: `showTeach` and the Worked Example's `onOpenSkill` (the skill-link click handler)
  now key off `parkedMode` instead of `devMode`. The step-by-step fragment reveal itself
  (`stepThroughEnabled`) is unchanged — still gated by ordinary Developing-tools mode.
- Verified with a headless-browser check across all four states: `/skills` 404s with no flags and
  with `devMode` alone; unlocks with `?parked=1`; the Teach tab on `FractionsAddSub` behaves
  identically (present only once `parkedMode` is on, regardless of `devMode`). `npm run build`
  clean, `npm test` 304/304.
- Docs updated: `CLAUDE.md`'s Teach-deck and skill-link sections, `docs/PROJECTS.md`'s dev-gating
  callout (now "Two separate gates — do not conflate them").

## 2026-08-18 — Two tier-1 fixes from the retagged audit: EquationsOfLines grapher + CircleProperties print
Picked the two cheapest, highest-value `[T1 exception]` items surfaced by the retagging pass above.
- **`EquationsOfLines`** — wired SmartGrapher into all three sub-tools (`gradient`/`equation`/
  `missing`): a line through the known points (plus the missing-value point for that sub-tool)
  reveals on the Whiteboard once the answer is shown, matching the pattern `NonLinearSimEq` already
  established. Closes the tool's own "zero visual content despite its name" gap — the audit's single
  highest-leverage Part 1 finding for it.
- **`CircleProperties`** — migrated its hand-rolled, fixed-3×5-grid `customPrintHandler` onto the
  shared `handleDiagramPrint`, fixing the confirmed bug where the Differentiated toggle silently
  produced an identical flat sheet. Also dropped `fixedColumns: true` in favour of `maxColumns: 4`
  (restores the Columns control) and added `hideFontControls: true` to match every sibling diagram
  tool (the font-size chevrons had no effect on the diagram anyway). Diagrams are always square, so
  the default `_aspect` of 1 needed no extra work.
- Both verified with `npm run build` (zero TS errors), `npm test` (304/304 passing), and a headless
  browser check confirming both render with no console errors.

## 2026-08-18 — Project docs reorganised around a teacher/student/infra priority lens
`docs/PROJECTS.md` and `docs/TOOL_AUDIT.md` findings-only, no code changed.
- Added a `## Priorities` section to `PROJECTS.md` splitting all work into three tiers: **tier-1**
  teacher-facing advancement (new tools, in-lesson utilities like SmartGrapher — current priority),
  **tier-2** student-led self-teaching (Skills library, Worked Example fragment reveal — currently
  dormant), **tier-3** tool-building infrastructure (ToolShell, the Techniques engine — build on
  demand, not a standalone sweep). Flagged the At-a-glance table, the Part 1 roadmap, and each
  pedagogy-prong section (Techniques/Skills/Core representations/Teach decks/SmartGrapher)
  accordingly; elevated "Tool expansion (Part 2)" and SmartGrapher as the active backlog.
- Retagged all 27 `docs/TOOL_AUDIT.md` tool entries plus its 4 category summaries against the same
  lens: a `Priority tag` line under each Part 1 heading calling out tier-1 exceptions (confirmed
  live bugs, unwired SmartGrapher fits, cheap wins that fix something a teacher sees today) against
  the tier-2/3 default; the Working-step depth bullet is now split-tagged where it conflated
  working-step *content* quality (tier-1) with `string[]` *fragmentation* mechanics (tier-2/3, only
  matters for the dev-gated Worked Example reveal). No finding's substance changed — only which ones
  are flagged as worth picking up next.

## 2026-08-17 — Technique Library: popup → real per-technique pages
Reworked the Technique Library's preview from a near-fullscreen popup into what the previous
session's `NonLinearSimEq`/Tier 0 work made clear the audit needed: an **honest, page-level**
preview that renders through the exact same viewer a real tool's Worked Example uses, not a
bespoke mockup that can drift out of sync.
- Extracted `WorkedExampleSteps` (`src/shared/components/WorkedExampleSteps.tsx`) out of
  `ToolShell.tsx` — the single step-viewer both a real tool and every technique preview now render
  through. `ToolShell.tsx`'s own single-card behaviour is unchanged (verified pixel-for-pixel at every
  stage); the extraction only added an opt-in `layout: "single" | "stacked"` and `hideAnswerStep` prop,
  both defaulted off.
- Added a **Stacked** layout alongside the original **Single card** one — earlier steps stay visible
  or a scrolling trail as you press through, instead of replacing the card each time — after
  comparing both live and choosing Stacked as the preferred direction. Fixed several bugs surfaced by
  real (including real-mobile-device) testing along the way: wide KaTeX lines clipping instead of
  shrinking to fit (a proper flex-centred + `getBoundingClientRect` fix, not the naive `scrollWidth`
  approach that undercounts left-side overflow), the current step's emphasis ring being clipped by the
  scroll container's implicit `overflow-x`/`overflow-y` auto-clipping, inconsistent gaps before the
  answer box, and the answer's font size not matching the working cells'.
- Added `hideAnswerStep`: a technique preview has no data model for a genuinely separate "answer"
  distinct from its last working step, so reusing the last step's own latex as a fake "Answer" card
  showed the same content twice. Step-by-step now simply ends on the last real step; every live tool
  (which has a real, distinct answer) is unaffected — verified untouched.
- Converted **all seven** techniques (Quadratic Formula, Solving a Linear Equation, Reading Roots
  from Factors, Substituting Back, Making the Subject, Solving a Linear Chain, Full Worked Example)
  from the library's popup overlay to their own real tool pages at `/techniques/<slug>` — each a thin
  `TechniquePreviewPage` wrapper, `enabled:false` + `hidden:true` (reachable via its route and the
  library's own card, never listed as its own landing-page tile). The popup overlay itself, and its
  now-dead state, were removed from `TechniqueLibrary.tsx`.
- Reintroduced autoscroll in Stacked layout, this time correctly: diagnosed that the container's
  "bounded, internally-scrolling" design never actually engages (`TechniquePreviewPage`'s root only
  sets `minHeight:100vh`, not `height`, so nothing downstream is genuinely height-constrained — the
  internal scroll body's `scrollHeight` always equals its `clientHeight`, confirmed via Playwright; the
  whole *page* grows and scrolls instead). Replaced the old "scroll the current card into view" effect
  — which aligned the wrong element and let the nav footer creep off the bottom of the viewport — with
  one that captures the footer's on-screen position immediately before each Prev/Next/dot press and,
  once the new content has painted, scrolls the window by exactly how far the footer moved. Symmetric
  for growing forward and shrinking back; a no-op outside Stacked layout, so Single card and every live
  tool trigger zero window scrolls (verified).
- All dev-gated / exploratory (this is preview tooling for reviewing technique output, not a
  user-facing tool); build clean, all 304 tests pass.

## 2026-08-15 — Tier 0 of the Part 1 roadmap (Skill + Technique wiring), dev-gated
Both zero-new-engine-work items from `docs/PROJECTS.md`'s Part 1 roadmap Tier 0, built but kept
**behind Developing-tools mode** pending sign-off — non-dev users see unchanged output.
- **Skill**: linked the two unlinked `lcm` consumers found by the audit. `SimultaneousEquations`'
  `lcm` sub-tool now shows an explicit `[[lcm|LCM]]`-linked "find the LCM" step before scaling both
  equations (dev-mode only — the step didn't exist before, so it's gated rather than just the link);
  `FractionToRatio`'s existing "LCD:" working-step label becomes `[[lcm|LCM]]`-linked in dev mode
  (unchanged wording otherwise).
- **Technique**: `NonLinearSimEq`'s `linear` sub-tool now routes its post-substitution solve through
  the shared `solveLinearEquationSteps` technique instead of its hand-rolled `solvePos`/`solveNeg`
  chain, fixing the audit-confirmed `−1x`-should-be-`−x` display bug (the combined coefficient is
  now formatted through `solveLinearEquationSteps`' own `coef()`/`signed()` sanitizers instead of
  being interpolated raw) and adding an explicit "Expand the brackets" step. The original hand-rolled
  chain is kept verbatim as `legacySolvePos`/`legacySolveNeg` and stays what non-dev users see;
  `getDevMode()` picks the branch in `buildWorking`.
- Verified with scratch checks (not committed): 8000 sampled `linear` questions with `negEq1`/
  `zeroForm`/`negSol` on (the settings that actually allow negative coefficients, so the bug can
  fire) reproduced `-1x`/`-1b`/etc. 372 times with dev mode off, matching pre-existing behaviour;
  the same 8000-sample run with dev mode forced on showed zero occurrences, confirming both the fix
  and the gate. `npm run build` clean, `npm test` (304 tests) passing throughout.

## 2026-08-14 — Spot-checked the audit and fixed the CLAUDE.md doc-drift it found
No tool code changed — a verification pass on the completed Tool Audit, plus two doc corrections.
**Spot-check**: directly re-read source for 8 claims spanning 6 tools across 3 categories, including
the two highest-stakes findings in the whole audit — `NonLinearSimEq`'s `−1x`-should-be-`−x` bug and
missing `(2x−5)²` expansion (both confirmed exactly, including root cause: `solvePos`/`solveNeg`
interpolate a computed coefficient raw instead of routing it through the file's own `nextT`/`lead`
sanitizer, and `expandedLatex` is computed directly from final simplified coefficients with no
intermediate ever stored) — and `CircleProperties`' print-handler bug (confirmed: the function
signature literally only accepts 3 of the 4 `customPrintHandler` parameters, silently dropping
`ctx.isDifferentiated`). `CollectingLikeTerms`' info-modal/generator mismatch also confirmed exactly.
Found and fixed two small counting inaccuracies (`AnglesInQuadrilaterals`' Level 1 multiSelect count —
2 groups, not 1; `BasicAngleFacts`' distinct hex-token count — 19, not 18); one apparent discrepancy
(`FractionsOfAmounts`' "52 fragment uses") turned out to be the spot-check's own undercount, not an
audit error. **Doc-drift fixes**: added a caveat to `CLAUDE.md`'s Diagram-tools reference
implementations (`AnglesInParallelLines.tsx`/`BasicAngleFacts.tsx`) clarifying they're the reference
for SVG element conventions only, not the print-handler pattern — both hand-roll a fixed-grid
`customPrintHandler` that CLAUDE.md's own "Printing SVG worksheets" section tells tools not to do;
points readers to `AnglesInQuadrilaterals.tsx` for print instead. Corrected `docs/TOOL_AUDIT.md`'s own
methodology text, which had falsely claimed `FractionToRatio.tsx`/`RatioSharingTool.tsx` were "named
in `CLAUDE.md`" when only two of the four cited files actually are. Marked all three resolved findings
in their originating `TOOL_AUDIT.md` entries so they don't get rediscovered.

## 2026-08-14 — Built the Part 1 roadmap and Part 2 scope from the completed Tool Audit
No code changed — this session turned the completed Maths Tool Audit's findings into an actual build
order. Added a **"Part 1 roadmap"** to `docs/PROJECTS.md`'s Maths Tool Audit section: five tiers
sequencing the next build across all five infrastructure prongs (Techniques, Skills, Core
representations, Teach decks, SmartGrapher) together by leverage, rather than each prong picking its
own priority in isolation — Tier 0 is free wins (wiring already-built pieces), Tier 1 is the one
representation decision (algebra tiles now has a stronger leverage case than area model — 5
tool-consumers vs. ~3, reversing the pre-audit guess), Tier 2 is the highest-leverage builds that can
start immediately (`applyAngleFact`, needed by 5 of 8 Geometry tools, is the single biggest demand
signal found), Tier 3/4 are smaller items, plus a cross-cutting list (SmartGrapher wiring, the grain
toggle, Teach decks). Also scoped a **"Part 2 — Tool expansion"** section, explicitly defined as the
per-tool content-growth backlog needing a pedagogy/product decision (new question types, broader
sub-tool coverage) — deliberately excluding the two confirmed print-handler bugs and the
`SimplifyingRatiosTool` gating call, which are mechanical/sign-off items that don't need the same
depth of involvement and are called out separately. Updated the Core representations section's
"prioritise by blockage" bullet, which the audit's findings now actually answer. Confirmed via the
audit: exactly one tool (`SimplifyingRatiosTool`) is recommended for dev-gating, and it's already
gated — no live tool was recommended for new gating.

## 2026-08-14 — Ran the Maths Tool Audit's Geometry category (8 tools) — audit complete
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all eight
Geometry tools (`AnglesInQuadrilaterals`, `BasicAngleFacts`, `AnglesInTriangles`,
`AnglesInParallelLines`, `Bearings`, `CircleProperties`, `EquationsOfLines`, `PerimeterTool`) and
logged the full per-tool entries — **this completes the Maths Tool Audit: all 27 tools across
Number, Algebra, Ratio & Proportion, and Geometry are now audited.** Headline Geometry findings: six
of the eight tools build every working step through `tStep()` only, making them structurally
incapable of the fragment-reveal convention (a category-wide finding, not six separate ones); only 4
of 8 tools use the shared `handleDiagramPrint` — the other 4 hand-roll a fixed-grid print handler
that directly contradicts `CLAUDE.md`'s explicit instruction, and two of those three hand-rolled
handlers have confirmed functional bugs (`BasicAngleFacts` silently drops section headers on
differentiated worksheets; `CircleProperties`' Differentiated toggle does nothing at all, with no
error). Notably, two of the three hand-rolled holdouts are the very files `CLAUDE.md` names as the
SVG/renderer reference implementations. `PerimeterTool` — named in `docs/TOOL_AUDIT.md`'s own intro
as the example of why a live `enabled` flag can't be trusted as a quality signal — confirmed exactly
that prediction: well-engineered shell migration, thinnest QO richness of the whole audit.
`EquationsOfLines` turned out not to be a diagram tool at all despite its category, confirming its
SmartGrapher gap is still fully unaddressed. `PROJECTS.md`'s skills table had zero Geometry rows
before this pass; two are now proposed (`apply-angle-fact`, `unit-conversion`) alongside a new
`sumPerimeter`/`deriveMissingSide` technique. Updated `docs/PROJECTS.md`'s technique/skill tables and
flipped the Maths Tool Audit's status to complete, with a short "possible next steps" list for
picking up the audit's findings (a sign-off pass on `SimplifyingRatiosTool`'s "stay gated"
recommendation, fixing the two confirmed print-handler bugs, and building from the refreshed
technique/skill demand signals rather than the pre-audit guesses). No `enabled` flags changed.

## 2026-08-14 — Ran the Maths Tool Audit's Ratio & Proportion category (6 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all six Ratio &
Proportion tools (`RatioSharingTool`, `SimplifyingRatiosTool`, `RecipesTool`, `FractionToRatio`,
`FractionsOfAmounts`, `BestBuys`) and logged the full per-tool entries. Headline result: the clearest
live/gated contrast found in the audit so far — `SimplifyingRatiosTool` (dev-gated) is recommended to
**stay gated**, judged blind to its current status, being the only tool in the whole audit with
literally zero QO control and zero visual representation, while its live sibling `RatioSharingTool`
ships with both a working bar model and real controls. `FractionsOfAmounts` came out reference-quality
(52 genuine fragment-array uses, the strongest QO differentiation of the pass). Two existing technique
rows (`scaleRecipe`, `unitPriceCompare`) turned out to only describe half their tool's actual content —
`RecipesTool`'s Constraints sub-tool and `BestBuys`' Special Offers sub-tool each do a materially
different move. The `unitary-method` skill (proposed for `Percentages` in the Number pass) now has two
more unconsumed demand signals here — three tools across two categories hand-roll the same "find 1,
then scale" reasoning unlinked. A new skill, `convert-fraction-ratio`, is proposed for `FractionToRatio`,
whose technique row had no matching skill row at all. Two documentation-drift findings also surfaced:
`CLAUDE.md`'s reference-implementations table doesn't actually name `FractionToRatio.tsx` despite
`docs/TOOL_AUDIT.md`'s own methodology text citing it, and doesn't describe `RatioSharingTool.tsx` as a
"multi-group multiSelect" example (it's single-group throughout) — recorded as findings, not corrected.
Updated `docs/PROJECTS.md`'s technique/skill tables accordingly. No `enabled` flags changed (the
`SimplifyingRatiosTool` recommendation is recorded only, per the audit's own rule not to act on
recommendations mid-pass). Next: Geometry category (8 tools) — the final one.

## 2026-08-14 — Ran the Maths Tool Audit's Algebra category (7 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all seven
Algebra tools (`CollectingLikeTerms`, `SolvingLinearEquations`, `CompletingTheSquare`, `Iterations`,
`SimultaneousEquations`, `NonLinearSimEq`, `ExpandingBrackets`) and logged the full per-tool entries.
Headline results: `NonLinearSimEq` — the repo's one techniques-engine conversion — turned out to be a
genuine hybrid rather than a full delegation (its highest-frequency `linear` sub-tool still hand-rolls
its solve chain), which is why both of its previously-known working-step gaps are now **confirmed
still present at the exact generator-code level**: the `(2x−5)²` expansion is never shown (the data
model has nowhere to store an unsimplified intermediate) and a computed ±1 coefficient renders as
literal `−1x` because that path bypasses the sanitizer used everywhere else in the file.
`CompletingTheSquare.tsx` — the repo's own named shell-wiring reference — is equally unconverted on
the techniques/fragment axis, a useful calibration that "reference implementation" is an
architectural claim, not a pedagogy-infrastructure one. `SimultaneousEquations` (the Elimination
sibling) is not carried along by `NonLinearSimEq`'s "converted" status, despite arguably broader Part
2 content — a clean example of Part 1/Part 2 findings diverging on sibling tools. Two unrelated
content bugs surfaced (not fixed): `CollectingLikeTerms`' info-modal text disagrees with its own
generator's option count, and `SolvingLinearEquations` has a redundant no-op working step in two of
three levels. `Iterations` was flagged as the highest-leverage unwired SmartGrapher candidate found so
far (already named in `PROJECTS.md`, proven elsewhere in the same category, zero visual content
today). Updated `docs/PROJECTS.md`'s technique/skill tables with new demand notes and one priority
bump (`solveByIteration`: low → med). No `enabled` flags changed. Next: Ratio & Proportion category (6
tools).

## 2026-08-14 — Ran the Maths Tool Audit's Number category (6 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all six Number
tools (`IntegerAddSub`, `Estimation`, `PowersOfTen`, `FractionsAddSub`, `FractionMultDiv`,
`Percentages`) against Part 1 (infrastructure alignment) and Part 2 (standalone readiness), and
logged the full per-tool entries in `docs/TOOL_AUDIT.md`. Headline results: `FractionsAddSub` and
`Percentages` are close to reference quality (worded contexts, fragmented working, genuine level
restructuring) and are worth treating as Number-strand quality bars; the other four are "live but
flagged for expansion," with `PowersOfTen`'s two fixed-template working steps (no computed numeric
line) the weakest finding of the pass, and its Level 3 dropping its own place-value-grid
representation entirely. Surfaced several new Part 1 backlog items not previously tracked —
`directedNumberAddSub` and `scaleByPowerOfTen` techniques, a `place-value` skill, and a
previously-nonexistent percentages technique/skill family (`percentageOfAmount`, `percentageChange`,
`reversePercentage`, `percentage-to-multiplier`, `unitary-method`) — added to `docs/PROJECTS.md`'s
technique/skill tables with demand notes. No `enabled` flags changed. Next: Algebra category (7
tools).

## 2026-08-14 — Set up the Maths Tool Audit; reorganised the planning docs around it
No code changed — this session designed and documented a new initiative rather than shipping a
tool change. Created **`docs/TOOL_AUDIT.md`**: a self-contained methodology + live findings log
for a systematic pass over all 27 Maths ToolShell question generators (Number, Algebra, Ratio &
Proportion, Geometry). Each tool gets two separate assessments — **Part 1: infrastructure
alignment** (how far behind the techniques engine, skills library, core representations, Teach
decks, and SmartGrapher is this tool — an expected gap, feeds the existing prong backlogs) and
**Part 2: standalone readiness**, judged *blind to the tool's current `enabled` status* (question
variety vs GCSE spec coverage, QO richness, whether levels genuinely restructure the problem,
working-step depth, a conventions/anomaly scan for undocumented deviations from the ToolShell
baseline — column caps, hidden font controls, bespoke print handlers — and a recommended live/gated
status). Documented why neither git history (nearly all 27 tools share one bulk-import commit date)
nor the current `enabled` flag (has historically tracked shell-migration readiness, not content
quality — e.g. `PerimeterTool` went live on shell-verification grounds alone) can be trusted as
maturity signals, so both must be judged from the file content itself. Reorganised
**`docs/PROJECTS.md`**: added a new "Maths Tool Audit" prong as the current top priority, added a
sequencing note to the four pedagogy prongs (Techniques engine, Skills library, Core
representations, Teach decks) and SmartGrapher pointing their future next-steps at the audit rather
than ad hoc picks, and moved Computer Science and Decision Maths to the bottom of the doc marked
**⏸ Parked** while the audit is in progress. Updated `CLAUDE.md`'s documentation map with a
`docs/TOOL_AUDIT.md` row. The audit itself has not started — the next session should open
`docs/TOOL_AUDIT.md` and begin with the Number category.

## 2026-08-13 — Migrated SimplifyingRatiosTool onto ToolShell; reclassified the Generators as standalone
Brought `SimplifyingRatiosTool` (~820 lines, hand-rolled shell) onto **ToolShell** (~330 lines) —
the last entry in the old-shell migration backlog. Both sub-tools kept their maths verbatim:
**Numeric Ratios** (2-part at Levels 1–2, 3-part at Level 3, simplified by repeated prime division)
and **Algebraic Ratios** (cancelling a numeric common factor and any shared variable/power across
three escalating levels). Working steps now use `step`/`mStep` with proper KaTeX (the old algebraic
formatter used unicode superscripts, invalid in KaTeX — replaced with `^{n}`). Stays `enabled: false`
pending a go-live decision. Also reclassified the four Generators tools (`TimesTablesGenerator`,
`MultiplicationGenerator`, `NegativeOperationsGenerator`, `FunctionalSkillsGenerator`) in
`organisation.test.ts` from `MIGRATION_BACKLOG` to `STANDALONE_BY_DESIGN` — they batch-produce PDF
worksheets, a different purpose from ToolShell's whiteboard/worked-example/worksheet model, and were
never real migration candidates. The migration backlog is now empty. Updated `CLAUDE.md` and
`docs/PROJECTS.md` to match. Build clean, 304 tests pass (up from 298 — the new tool's `__test`
export is now covered by the generator smoke suite).

## 2026-08-13 — Moved Mixed Strategies into Decision Mathematics
Landing-page tweak: moved `mixed-strategies` (`src/tools/MixedStrategies.tsx` →
`src/tools/Decision/`) out of Probability & Statistics into Decision Mathematics, alongside Network
Sandbox and Minimum Spanning Tree — it's game-theory/zero-sum-game content, which fits the Decision
Maths strand better than classic probability/statistics. Fixed its now-one-level-deeper `../shared`
import to `../../shared`. Probability & Statistics is left defined with an empty tools list — the
landing page already renders a "Coming soon" placeholder for an empty category rather than showing
nothing, so the strand stays available for a real future probability/stats tool. Build clean, 298
tests pass, confirmed visually.

## 2026-08-13 — Moved P-Value Grapher into Interactive Tools
Landing-page tweak: moved `p-value` (`src/tools/TeacherTools/p-value.tsx` → `src/tools/Interactive/`)
out of Teacher Tools into the Interactive Tools category, alongside Algebra Tiles, Parallel Lines
Explorer and Grapher Lab — matching folder-per-category convention. Updated
`organisation.test.ts`'s `STANDALONE_BY_DESIGN` list to the new path. Build clean, 298 tests pass,
confirmed visually: the tool now appears under Interactive Tools and no longer under Teacher Tools.

## 2026-08-13 — Published Perimeter
Removed `enabled: false` from the registry entry now that the ToolShell migration (see the entry
above) is verified working — it's live on the landing page. Build clean, 298 tests pass.

## 2026-08-13 — Migrated Perimeter onto ToolShell (following the AnglesInTriangles pattern)
Brought `PerimeterTool` (1,372 lines, hand-rolled shell including a full camera/presenter feature)
onto **ToolShell** (~660 lines) using `AnglesInTriangles` as the template. Both sub-tools —
**Polygons** (regular shapes at Level 1, irregular tick-marked shapes at Level 2, mixed cm/mm/m
units at Level 3) and **Rectilinear Shapes** (all sides given, then 1–2 derived missing sides, then
mixed units) — keep their maths and the sophisticated pill-label placement algorithm (tries multiple
candidate positions per label, scores by mutual clearance) verbatim. Dropped the camera/presenter
feature entirely: it was generic whiteboard chrome unrelated to perimeter questions specifically,
and the shell's own fullscreen already covers "make the diagram big for the class." Swapped the
hand-rolled SVG-capture print/PDF generator for the shared `handleDiagramPrint`, which required
computing a real `_aspect` per rectilinear question (its bounding box isn't square, unlike polygons)
— extracted into a `rectSmallWH()` helper shared between generation-time sizing and the actual
worksheet-cell renderer so the two can never drift apart.

**Fixed a real bug found during the port**: the Level 3 "Mixed units" checkbox in the original tool
was wired into `TOOL_CONFIG` but never actually read by the generator — `mixUnits` was hardcoded to
`level === "level3"`, so toggling the checkbox off had no effect. Verified with a 40-sample direct
generation check: before the fix this would have shown 40/40 mixed regardless of the toggle; after,
it's 40/40 mixed when on and 0/40 when off, as the label promises.

**A deliberate simplification**: the original showed a per-shape prompt ("Find the perimeter of the
rhombus") plus a separate "Give your answer in cm" banner for mixed-unit questions. The shape-name
prompt now lives in the tool's own whiteboard/worked-example title (via a custom `questionRenderer`,
shown only there — worksheet cells are diagram-only, matching the `AnglesInTriangles` convention);
the separate mixed-units banner was dropped since the edge labels already show the mixed units
directly.

Verified with `npm run build` (0 errors), `npm test` (298 pass, 6 new), and a thorough headless
Playwright pass: both sub-tools × all three levels in whiteboard (blank and revealed — including
confirming the shell provides no automatic answer overlay in whiteboard mode, unlike worked example,
so the tool renders its own inline "= answer"), worked example (steps + the shell's own answer card,
confirmed to appear automatically without any tool-side code), standard and differentiated worksheets,
and the print/PDF output for both sub-tools (diagrams correctly proportioned, answers page matching)
— zero console errors throughout. Left `enabled: false` — not asked to publish it live this session.
Removed from `organisation.test.ts`'s `MIGRATION_BACKLOG` and `CLAUDE.md`/`docs/PROJECTS.md`'s
tracking lists; also caught and fixed two unrelated stale/incorrect lines in `docs/PROJECTS.md`
while auditing this section (a leftover "migrate FractionToRatio" bullet from a July migration, and
"the Generators" wrongly listed as never-migrate when four of them are in the CI-enforced backlog).

## 2026-08-13 — Published Adding & Subtracting Integers
Removed `enabled: false` from the registry entry now that the ToolShell migration (see the entry
above) is verified working — it's live on the landing page. Build clean, 292 tests pass.

## 2026-08-13 — Migrated Adding & Subtracting Integers onto ToolShell (number line as a full-width diagram)
Brought `IntegerAddSub` (472 lines, hand-rolled shell) onto **ToolShell** (~330 lines). The tool's
number line got the same treatment `PowersOfTen`'s place-value grid got: rendered entirely through
a custom `questionRenderer`, with the working panel starting collapsed
(`defaults.collapseWorkingByDefault`) so the question box goes full-width and `ScaleToFit` grows the
diagram into the reclaimed space. Two number-line states — a blank scaffold (line + arrowheads, no
ticks) and a worked diagram (ticks, start/end points, jump arrow) — switch on `showAnswer`, reused
identically across whiteboard and worked-example mode via one component (matching the grid's
blank/filled split). This is a behaviour improvement over the original, which only ever showed a
static blank line in whiteboard mode and never filled it in — Show Answer now fills the whiteboard's
number line too, consistent with how the place-value grid already behaves. SVGs use `viewBox` +
`width:100%` per the diagram-tool convention rather than the original's fixed pixel dimensions.
Level 1 keeps its Mixed/Addition/Subtraction dropdown via `difficultySettings` (Levels 2–3 have a
fixed operation, so the dropdown is `null` there — "add a negative" / "subtract a negative"
respectively). Worksheet stays text-only, so the default print handler needs no custom code. Left
`enabled: false` (dev-gated) — not asked to publish it live this session. Verified with `npm run
build` (0 errors), `npm test` (292 pass, 3 new), and a headless Playwright pass across all three
modes and all three levels: blank/filled whiteboard, worked example with working steps, worksheet
text grid, and the Level 2/3 dropdown correctly disappearing — zero console errors throughout.
Removed from `organisation.test.ts`'s `MIGRATION_BACKLOG` and `CLAUDE.md`/`docs/PROJECTS.md`'s
dev-gated-leftovers lists.

## 2026-08-13 — Retired the Unpublished/ archive folder
Deleted `Unpublished/GraphGenerator.tsx` (its planar-network-generation algorithm was harvested into
`src/shared/decision/randomNetwork.ts` this session — see the entry above) and
`Unpublished/ParallelLinesInteractive.tsx` (now near-byte-identical to the published
`src/tools/Interactive/ParallelLinesInteractive.tsx`, differing only by the two intentional fixes
made when it was published). With both gone the folder held nothing but its own `README.md`, so
removed the folder entirely along with its references: the `Unpublished/` section in `CLAUDE.md`,
the tree entries and `tsconfig.json` callout in `README.md`, and the now-unneeded
`"exclude": ["Unpublished"]` in `tsconfig.json`. Historical mentions in this file and in
`docs/architecture/DECISION_SHELL_PLAN.md` are left as-is — they're an accurate record of where
things came from, not live pointers. Build clean, 289 tests pass (unaffected — the folder was never
part of the app).

## 2026-08-13 — Harvested a procedural network generator for Decision Maths
Added `src/shared/decision/randomNetwork.ts`'s `generateRandomNetwork()`: given only a node count,
builds a connected, provably crossing-free weighted `Network` — the procedural counterpart to
`sampleTemplate()`'s hand-authored `NetworkTemplate` sampling, and the "free bypass" building block
`DECISION_SHELL_PLAN.md` had flagged but not built. Harvested from `Unpublished/GraphGenerator.tsx`
(an old, never-registered v1 draft) after recognising its planar-layout algorithm was directly
relevant to the Decision Maths work: it built a spanning tree plus extra edges while checking for
straight-line crossings, and had a "Route inspection" toggle that manipulates the graph until exactly
2 or 4 nodes have odd degree — precisely the solvability condition for the Route Inspection/Chinese
Postman problem, a Decision Maths topic still unbuilt.

The port was not verbatim. The draft's own crossing-avoidance had two real gaps, both caught by a
new independent CI check (`src/tests/decisionRandomNetwork.test.ts`, which re-implements the crossing
test rather than trusting the generator's own logic, mirroring `validate.ts`'s independent-brute-force
pattern): (1) its greedy "nearest reachable, skip if crossing" spanning-tree walk could paint itself
into a corner at higher node counts and fell back to adding a crossing edge anyway — fixed by building
the true Euclidean MST instead, which is geometrically guaranteed non-crossing by construction, so the
fallback (and its crossing risk) is no longer needed at all; (2) the degree-1-leaf patch and the
route-inspection nudge both called `addEdge` directly, bypassing the crossing check entirely — fixed
so every added edge everywhere goes through the same check, falling back to leaving a node unpatched
rather than accepting a crossing. Both gaps were silently invisible in the original draft because its
(also-ported-and-then-deliberately-dropped) curve-routing step visually papered over any crossing
afterward — `NetworkView` only renders straight edges, so this port keeps output restricted to what's
already renderable rather than extending the shell. The route-inspection nudge is now honestly
documented as best-effort (an empirical sweep showed it lands on 2-or-4 odd nodes the large majority
of the time but not always) rather than asserting a guarantee it can't keep under the no-crossing
constraint. Exported from the `src/shared/decision` barrel; not yet wired into any tool. Verified with
`npm run build` (0 errors) and `npm test` (289 pass, 9 new). `docs/architecture/DECISION_SHELL_PLAN.md`
and `docs/PROJECTS.md` updated with the finding and the module.

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
