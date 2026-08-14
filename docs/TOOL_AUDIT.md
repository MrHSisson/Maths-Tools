# Maths Tool Audit

**This document is two things at once: the audit's methodology (Part A) and the live audit
log (Part B).** It is written to be fully self-contained — a fresh session with no memory of
the conversation that designed this audit should be able to open this file alone and correctly
run it. Do not assume prior chat context; everything needed is below.

**Status: complete — all 27 tools audited (27/27).** Number, Algebra, Ratio & Proportion, and
Geometry are all done — see "Audit log" below for the full per-tool findings, grouped by category.
This audit's own findings should now feed the four Maths pedagogy prongs and SmartGrapher's next
steps (see `docs/PROJECTS.md`'s "Sequencing note"), and Part 2's status recommendations (in
particular, `SimplifyingRatiosTool`'s "stay gated") are ready for a human sign-off pass — this doc
records recommendations only, per its own rule not to act on them mid-audit.

---

## What this is and why it exists

Four Maths pedagogy prongs exist — the **techniques engine**, the **skills library**, **core
representations**, and **Teach decks** — plus the **SmartGrapher** utility. Each has its own
backlog in `docs/PROJECTS.md`, but which tool gets attention next has so far been picked ad hoc,
not from any systematic view of actual per-tool need. This audit fixes that: it goes through
every Maths ToolShell question generator once, tool by tool, and produces a comparable set of
findings that then feed back into those existing backlogs (and a new one — see Part 2 below) so
future work can be sequenced by real leverage instead of guesswork.

**This is a diagnosis pass, not a fix pass.** Findings only. Do not edit a tool's code because
something looks thin or wrong mid-audit — record it and move on. The temptation to fix-as-you-go
is real; resist it, or the audit never finishes and the backlog never gets built.

**Two things this audit explicitly does NOT do while it's running:**
- It does not flip any tool's `enabled` flag. Part 2 below produces a *recommended* status per
  tool — going live, gating, or staying as-is is a separate sign-off decision to make once a
  category's audit is complete and reviewed, not something that happens automatically as a
  byproduct of auditing.
- It does not touch Computer Science or Decision Maths tools. Both of those shells are
  deliberately parked while this audit runs — see `docs/PROJECTS.md`'s "At a glance" table.

### Why the current `enabled` flag can't be trusted as a quality signal

Historically, a tool graduating from `enabled: false` to live has tracked **shell-migration
readiness**, not **content quality**. For example, `PerimeterTool` went live specifically because
"the ToolShell migration is verified working" (see `docs/PATCH_NOTES.md`, 2026-08-13) — that's an
engineering check, not a review of whether its question design is any good. So a tool being live
today doesn't mean its content was ever actually reviewed, and a tool being gated doesn't mean its
content is bad — it might just be sitting there for an unrelated historical reason. **Part 2 below
must be judged blind to the tool's current status**, and the audit records current-vs-recommended
status side by side so the gap between them is visible.

### Why git history won't help with provenance either

A tempting shortcut would be "check when the tool was first committed to gauge its age/maturity."
This doesn't work here: nearly every one of the 27 in-scope tools shares the **same first-commit
date (2026-06-24)** — the fingerprint of a single bulk-import/migration event, not organic
individual build dates. The only tools with a distinct, later first-commit date are
`FractionsAddSub` / `FractionMultDiv` (2026-07-06), `Bearings` (2026-07-07), and `Percentages`
(2026-08-13) — these are plausibly more recently authored or reworked and can be treated as
reasonable "what good looks like" reference points alongside the named reference implementations
below. For everything else, don't bother checking git blame — judge maturity from the file's
actual content instead.

---

## Scope

**In scope: 27 tools**, all ToolShell Maths question generators, grouped by category (folder).
This is the complete list — nothing in these four categories is excluded.

### Number (6)
| Tool | File | Route |
|---|---|---|
| Adding & Subtracting Integers | `src/tools/Number/IntegerAddSub.tsx` | `/integer-add-and-subtract` |
| Estimation | `src/tools/Number/Estimation.tsx` | `/estimation` |
| Multiplying & Dividing by 10ⁿ | `src/tools/Number/PowersOfTen.tsx` | `/powers-of-ten` |
| Adding & Subtracting Fractions | `src/tools/Number/FractionsAddSub.tsx` | `/add-subtract-fractions` |
| Multiplying & Dividing Fractions | `src/tools/Number/FractionMultDiv.tsx` | `/multiply-divide-fractions` |
| Percentages | `src/tools/Number/Percentages.tsx` | `/percentages` |

### Algebra (7)
| Tool | File | Route |
|---|---|---|
| Collecting Like Terms | `src/tools/Algebra/CollectingLikeTerms.tsx` | `/collecting-like-terms` |
| Unknowns on Both Sides | `src/tools/Algebra/SolvingLinearEquations.tsx` | `/solving-linear-equations` |
| Completing the Square | `src/tools/Algebra/CompletingTheSquare.tsx` | `/completing-the-square` |
| Iteration | `src/tools/Algebra/Iterations.tsx` | `/iterations` |
| Simultaneous Equations (Elimination) | `src/tools/Algebra/SimultaneousEquations.tsx` | `/simultaneous-equations-elimination` |
| Simultaneous Equations (Substitution) | `src/tools/Algebra/NonLinearSimEq.tsx` | `/simultaneous-equations-substitution` |
| Expanding Brackets | `src/tools/Algebra/ExpandingBrackets.tsx` | `/expanding-brackets` |

### Ratio & Proportion (6)
| Tool | File | Route |
|---|---|---|
| Dividing Ratios | `src/tools/Proportion/RatioSharingTool.tsx` | `/ratio-sharing` |
| Simplifying Ratios | `src/tools/Proportion/SimplifyingRatiosTool.tsx` | `/simplifying-ratios` *(enabled: false)* |
| Recipes | `src/tools/Proportion/RecipesTool.tsx` | `/recipes` |
| Converting Fractions and Ratios | `src/tools/Proportion/FractionToRatio.tsx` | `/fraction-to-ratio` |
| Fractions of Amounts | `src/tools/Proportion/FractionsOfAmounts.tsx` | `/fractions-of-amounts` |
| Best Buys | `src/tools/Proportion/BestBuys.tsx` | `/best-buys` |

### Geometry (8)
| Tool | File | Route |
|---|---|---|
| Properties of Circles | `src/tools/Geometry/CircleProperties.tsx` | `/circle-properties` |
| Basic Angle Facts | `src/tools/Geometry/BasicAngleFacts.tsx` | `/basic-angle-facts` |
| Angles In Triangles | `src/tools/Geometry/AnglesInTriangles.tsx` | `/angles-in-triangles` |
| Angles in Parallel Lines | `src/tools/Geometry/AnglesInParallelLines.tsx` | `/angles-in-parallel-lines` |
| Angles In Quadrilaterals | `src/tools/Geometry/AnglesInQuadrilaterals.tsx` | `/angles-in-quadrilaterals` |
| Bearings | `src/tools/Geometry/Bearings.tsx` | `/bearings` |
| Properties of Line Equations | `src/tools/Geometry/EquationsOfLines.tsx` | `/equations-of-lines` |
| Perimeter (BETA) | `src/tools/Geometry/PerimeterTool.tsx` | `/perimeter` |

**Probability & Statistics** is currently an empty category (no tools) — nothing to audit there.

### Explicitly out of scope
- The four **Generators** tools (`TimesTablesGenerator`, `MultiplicationGenerator`,
  `NegativeOperationsGenerator`, `FunctionalSkillsGenerator`) — PDF-batch-output tools, a
  different product from ToolShell's whiteboard/worked-example/worksheet model.
- **Computer Science** tools (`SystemArchitecture`, `CpuArchitecture`, `CpuPerformance`) — a
  different shell (`CSShell`), parked per `docs/PROJECTS.md`.
- **Decision Maths** tools (`NetworkSandbox`, `MinimumSpanningTree`, `MixedStrategies`) — a
  different shell (`DecisionShell`), parked per `docs/PROJECTS.md`.
- **Standalone-by-design** tools: `AlgebraTiles`, `ParallelLinesInteractive`, `GrapherLab`,
  `Visualiser`, `CallSelector`, `p-value`, `SkillLibrary`, `TechniqueLibrary` — manipulatives and
  dev-only pages, not question generators.

---

## Methodology

Every tool gets **two separate assessments**. Keep them separate in the write-up — they answer
different questions, feed different backlogs, and get prioritised on different logic.

### Part 1 — Infrastructure alignment

*How far behind the shared pedagogy systems is this tool?* Almost every tool will score "behind"
here, because the infrastructure itself is new and adoption has been deliberately gradual — a low
score is not a quality judgement, it's an enrichment to-do list. Findings here feed directly into
the existing backlog tables in `docs/PROJECTS.md` (technique audit table, skills backlog table,
representation status, Teach deck section) — **cross-reference those tables by ID** rather than
inventing new names; if a tool needs a technique/skill that doesn't exist in those tables yet,
that's itself a finding (a new row to propose).

1. **Techniques** — does the tool use the techniques engine (`src/shared/techniques/`) for its
   worked-example steps, or does it still have thin "jump to the answer" working? Which named
   technique(s) from `CLAUDE.md`'s technique table / `PROJECTS.md`'s technique audit table does it
   need? (Reference: `NonLinearSimEq.tsx` is the only tool converted so far — use it to judge what
   "converted" looks like.)
2. **Skills** — which terms in this tool's working steps are prerequisites the tool *uses but
   doesn't teach* (LCM, HCF, equivalent fractions, directed number, etc.)? Should any of them carry
   a `[[skill-id|term]]` marker? Does the target skill already exist in `src/shared/skills/` /
   `PROJECTS.md`'s skills table, or is it a new one to propose?
3. **Representations** — would one of the six core representations (bar model, number line, area
   model, algebra tiles, negative counters, prime factor tiles — see `CLAUDE.md` → "Core
   representations") clarify this tool's content? Is the representation it needs one of the three
   with existing `TeachScene` families (bar model, number line, prime tiles) or one of the three
   without (area model, algebra tiles, negative counters)?
4. **Teach deck** — is there a natural I-do → We-do → You-do example here worth turning into a
   deck? (Only one deck exists today, `FractionsAddSub`, and only its Concepts category — so this
   is "would this make a good second/third proof point," not an expectation every tool gets one
   soon.)
5. **SmartGrapher** — does this tool have coordinate/curve content (lines, quadratics, intersections)
   that could use the shared grapher (`src/shared/grapher/`) but currently doesn't?

### Part 2 — Standalone readiness

*Judged blind to the tool's current `enabled` status.* The question is: if a teacher opened this
tool today with zero context, does it feel like a complete, well-rounded tool, or does it feel
thin, limited, or dated? This is a fairness pass — some currently-live tools may fail it, some
currently-gated tools may pass it easily. Use the strongest tools found by this audit as the internal
quality bar: `CompletingTheSquare.tsx` and `AnglesInQuadrilaterals.tsx` (also named in `CLAUDE.md` →
"Reference implementations — which file to look at" for their respective build patterns — shell
wiring and shared print, not standalone content quality), plus `FractionToRatio.tsx` and
`RatioSharingTool.tsx` (not in that `CLAUDE.md` table, but confirmed strong Part 2 performers in this
audit's Number/Ratio & Proportion passes) — when a tool looks thinner than these, that's the gap to
describe. (A prior version of this line claimed all four were "named in `CLAUDE.md`" — checked
directly during a post-audit verification pass and found not to hold for two of them; corrected here.)

1. **Question-type / sub-tool breadth vs spec coverage** — how many genuinely different question
   *shapes* does the tool generate? Does it cover what a GCSE question on this topic would
   actually test, or a narrow slice of it? A single sub-tool with one rigid template is a strong
   "under-developed" signal.
2. **QO richness** — does the tool give real teacher control via `multiSelect`/`dropdown`/
   `variables`, or is it a fixed generator with no options? (Cheap to check: `grep -n
   "multiSelect:\|dropdown:\|difficultySettings:" <file>`.)
3. **Level progression** — do Levels 1→3 genuinely restructure the problem (different question
   shape, different method demanded), or just scale the numbers up?
4. **Working-step depth** — does the worked example actually explain reasoning (proper `mStep`/
   `step` sequences), or does it just land on an answer?
5. **Conventions & anomaly scan** — for every deviation from the ToolShell baseline defaults,
   record what it does and why:
   - `grep -n "defaults=\|questionRenderer=\|customPrintHandler=\|hideFontControls\|fixedColumns\|maxColumns\|collapseWorkingByDefault" <file>`
   - For each override found (non-standard starting font size, a column cap or `fixedColumns`
     lock, `hideFontControls`, a bespoke `customPrintHandler` instead of the shared
     `handleDiagramPrint`, etc.), tag it **Justified** (there's a comment or a clear structural
     reason — e.g. a diagram-heavy tool hiding font controls), **Unclear** (plausible reason but
     undocumented, needs a decision), or **Debt** (looks like a leftover constraint with no
     apparent reason, e.g. a column count fixed at 3 with no comment while every sibling tool
     allows 1–4).
   - Also check the **absence** of an override where one might be expected — e.g. a diagram tool
     that doesn't hide font controls, or doesn't cap columns, when its peers all do.
6. **UI / visual consistency** — does the tool look native to the current shell, or does it still
   carry old-shell visual leftovers (hardcoded hex colours instead of the shared colour helpers,
   inconsistent spacing/typography)? This one genuinely needs eyes-on — run the dev server and
   look at Whiteboard, Worked Example, and Worksheet modes rather than inferring from source only.
7. **Recommended status** — given everything above, should this tool be: *stay live as-is*,
   *live but flagged for expansion* (list what's missing), *should be gated pending work* (if
   currently live), or *ready to graduate* (if currently gated and actually fine)? State this next
   to the tool's *current* status so the gap is visible. **Do not act on this recommendation
   during the audit** — record it only.

### A note on what "infrastructure gaps" vs "standalone gaps" mean for prioritisation later

Part 1 findings are **shared infrastructure** — building one missing technique, skill, or
representation pays off across every tool that needs it, so those findings should eventually be
scored by *leverage* (how many tools does this unblock). Part 2 findings are **bespoke,
tool-specific content work** — expanding one tool's question variety doesn't help any other tool,
so those findings should be scored by *how far below the category's own bar this tool is, and how
core the topic is*. Keep these two kinds of finding in visibly separate buckets; don't merge them
into one flat priority list later.

---

## How to actually run a session on this

1. Pick the next unaudited category from "Audit log" below (Number first, unless already done).
2. For each tool in that category, open the file and work through Part 1 then Part 2 above. For
   the read-heavy part, a background `Explore` or `general-purpose` agent per tool (or per small
   batch) can produce the structured notes without burning the main session's context — the
   synthesis/judgement calls are what need a human-reviewable pass, not the raw file reading.
3. Fill in that category's entries below using the per-tool template.
4. Do not fix anything found. Do not flip any `enabled` flags.
5. When the category is done: update `docs/PROJECTS.md`'s technique/skill/representation/Teach-deck
   tables with the real demand signal this category surfaced (e.g. "this technique is now needed by
   4 tools, not 2"), and append any Part 2 status recommendations to a short summary at the top of
   this doc's "Audit log" section for later review.
6. Append a `docs/PATCH_NOTES.md` entry noting which category was audited (findings only — no code
   changed, so no build/test verification is needed for an audit-only session).

### Per-tool entry template

Copy this block for each tool as it's audited:

```
### <Tool display name> — `<file path>`
Route: `<route>` · Current status: <Live | Dev-gated (enabled: false)>

**Part 1 — Infrastructure alignment**
- Techniques: <thin/converted — which technique(s) needed, cross-ref PROJECTS.md id>
- Skills: <which terms should link, which skill ids — existing or new>
- Representations: <which of the six would help, existing scene or new needed>
- Teach deck: <worth it? natural I-do/We-do/You-do example, if any>
- SmartGrapher: <fit or not>

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: <assessment>
- QO richness: <assessment>
- Level progression: <assessment>
- Working-step depth: <assessment>
- Conventions/anomaly scan: <each override found + Justified/Unclear/Debt tag>
- UI/visual consistency: <assessment — note if dev server wasn't checked>
- **Recommended status:** <recommendation> (current: <Live/Dev-gated>)

**Notes:** <anything else worth flagging that doesn't fit the above>
```

---

## Audit log

*Status per category: ⬜ not started · 🚧 in progress · ✅ complete.*

### Number — ✅ complete
- [x] Adding & Subtracting Integers (`IntegerAddSub.tsx`)
- [x] Estimation (`Estimation.tsx`)
- [x] Multiplying & Dividing by 10ⁿ (`PowersOfTen.tsx`)
- [x] Adding & Subtracting Fractions (`FractionsAddSub.tsx`)
- [x] Multiplying & Dividing Fractions (`FractionMultDiv.tsx`)
- [x] Percentages (`Percentages.tsx`)

**Category summary.** Two tools (`FractionsAddSub`, `Percentages`) are close to reference quality on
Part 2 — worded contexts, fragmented working, genuine level restructuring — and are worth treating
as internal quality bars for the Number strand alongside `CompletingTheSquare.tsx`/`FractionToRatio.tsx`.
The other four are all "live but flagged for expansion" on Part 2, with the weakest working-step
depth in `PowersOfTen` (two fixed-template `tStep`s, no computed numeric line, and the tool's own
place-value-grid representation disappears entirely at Level 3). Every tool in the category is
equally thin on Part 1 (no technique/skill hookups) — that's expected/universal per the methodology,
not a per-tool signal. Concrete new backlog items surfaced this pass: a `directedNumberAddSub`
technique, a `scaleByPowerOfTen` technique, a `place-value` skill (none of these existed in
`PROJECTS.md`'s tables before this pass), and — the biggest single gap — a completely missing
percentages technique/skill family (`percentageOfAmount`, `percentageChange`, `reversePercentage`,
plus `percentage-to-multiplier` and `unitary-method` skills), none of which had any row in
`PROJECTS.md` despite `Percentages.tsx` being a 3-sub-tool, worded, fragment-heavy tool. All of
these have been added to `PROJECTS.md`'s technique/skill tables — see that doc for the updated rows.
`PowersOfTen`'s place-value grid also doesn't map cleanly onto any of the six core representations
(closest is number line, but it's structurally a grid) — flagged as an open question rather than a
finding with a clear next step.

### Adding & Subtracting Integers — `src/tools/Number/IntegerAddSub.tsx`
Route: `/integer-add-and-subtract` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; working is hand-rolled inline. None of the
  six built techniques fit (this is directed-number arithmetic, not algebra), and `PROJECTS.md`'s
  technique-audit table had no row for it either — **new technique proposed**: `directedNumberAddSub`
  (start position → jump direction/size from sign rules → land), low-frequency but foundational.
- Skills: No `[[skill-id|term]]` markers. This tool doesn't consume an unlinked prerequisite — it
  effectively *is* the directed-number primitive. `PROJECTS.md`'s `directed-number` skill row
  (med priority, negative counters, no scene yet) names this tool's domain directly; it's the
  natural home for that skill once negative counters exist.
- Representations: Uses a **bespoke** number-line SVG (`BlankNumberLineSVG`/`WorkedNumberLineSVG`),
  not the shared `multiples` scene family. The better-fitting representation per `CLAUDE.md`'s table
  is actually **negative counters** ("directed numbers, integer add/sub, zero pairs" is this tool's
  exact spec) — which has no manipulative or scenes yet. Sits at the intersection of two gaps.
- Teach deck: Strong candidate — I-do (add a positive) → We-do (add a negative) → You-do (subtract a
  negative, predict direction) on one running example, mirroring `FractionsAddSub`'s deck. Would need
  a new "jump" anim scene rather than reusing `split`/`combine`/`equivalents`.
- SmartGrapher: No fit — no coordinate/curve content.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, single rigid shape (`a op b` / `a + (−b)` /
  `a − (−b)`). No worded/contextual questions (temperature, elevation, bank balance), no two-step
  jumps, no missing-value or ordering questions — a strong "under-developed" signal.
- QO richness: One 3-option dropdown (Mixed/Addition/Subtraction), active at Level 1 only — Levels 2
  and 3 hard-code `dropdown: null` since the operation is fixed by level. No `multiSelect`, no
  `variables`. Real control exists for exactly one of three levels.
- Level progression: Genuinely structural — L1 free choice, L2 always "add a negative," L3 always
  "subtract a negative," correctly modelling the sign-rule progression. Weakness: magnitude barely
  changes across levels, so there's no "harder numbers" axis at all.
- Working-step depth: Two-step `mStep` with fragmented board-writing for the jump computation, but no
  explanation of *why* adding/subtracting a negative moves a particular direction — the actual
  teaching point of L2/L3 is performed but not stated. The zero-answer case falls back to a bare
  `tStep` with no computed line.
- Conventions/anomaly scan: `questionRenderer` (custom, **Justified** — needed for the number line,
  explained in-file) · `collapseWorkingByDefault: true` (**Justified** by an in-file comment, but
  only 2 tools in the repo use this default — even diagram-heavy siblings like
  `AnglesInQuadrilaterals`/`BasicAngleFacts`/`Bearings` don't, despite similarly large SVGs; not debt,
  but an unreviewed precedent) · `hideFontControls: true` (**Justified**, consistent with every other
  diagram tool) · `numQuestions: 5, numColumns: 2, maxColumns: 4` (**Unclear** — plausible given the
  wide number-line viewBox, but undocumented and more conservative than any sibling diagram tool) ·
  absence of `customPrintHandler` is **Justified and commented** — worksheet cells are text-only.
- UI/visual consistency: Not checked live. From source: hardcoded hex colours are confined to the SVG
  diagram, matching the reference diagram tool `AnglesInParallelLines.tsx` — standard practice, not an
  outlier. Two inline `style={{ color: ... }}` spans bypass the shared colour helpers, but 20 tool
  files repo-wide do the same (including the technique-engine reference `NonLinearSimEq.tsx`) — the
  prevailing norm, not tool-specific debt. `colorScheme` received but unused, matching the reference
  diagram tool.
- **Recommended status:** Live but flagged for expansion — solid number-line diagram and level logic,
  but narrow question breadth and thin QO control outside Level 1. (current: Live)

**Notes:** The strongest infrastructure lever here is that this tool is the natural first consumer of
a **negative counters** representation once built (0 of 6 core representations currently without any
scene work) — `CLAUDE.md`'s own representation table names "integer add/sub" as its use case.

### Estimation — `src/tools/Number/Estimation.tsx`
Route: `/estimation` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; all working is hand-rolled `mStep` (3 steps:
  Original → Round to 1 s.f. → Calculate). This is exactly the gap `PROJECTS.md`'s `roundToSigFig`
  row already named (priority med, ⬜) — Estimation is the clearest demand signal for that row.
- Skills: The core prerequisite (rounding to 1 s.f.) is never linked. `PROJECTS.md`'s
  `round-to-significant-figure` skill (number line, exists, med priority, ⬜) is exactly this skill —
  the "Round to 1 s.f.:" labels across all three levels are candidate link sites once it's built.
- Representations: Number line fits and is one of the three existing scene families, though the
  specific "round to nearest power-of-ten boundary" visual isn't identical to the existing `multiples`
  scene — likely a small new usage within the number-line family rather than a new representation.
- Teach deck: Reasonable candidate — "round each number to 1 s.f., then estimate" is a natural
  I-do/We-do/You-do arc with a simple number-line "which power of ten am I closer to" reveal. Not
  urgent, worth listing alongside FractionsAddSub as a second/third proof point.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, but internally varied — 4-operation multiSelect
  at L1/L2, two structurally distinct L3 shapes (nested fraction-bar expression, or fraction-plus-term).
  Every question is `kind: "simple"` though — **no worded/context estimation question anywhere**
  (e.g. "roughly how much would 29 items at £3.98 each cost?"), a real spec-coverage gap given how
  much of GCSE estimation is examined in context.
- QO richness: Good — real `multiSelect`/`variables` wired through per-level `difficultySettings`.
  Genuine teacher control, not a fixed generator.
- Level progression: Strong — L1 (whole numbers) → L2 (adds decimals) → L3 is a genuinely different
  question *shape* (nested fraction-bar/fraction+term expressions), one of the better structural
  escalations seen in this pass.
- Working-step depth: Thin relative to the site's own convention — every `mStep` passes a single
  string, never a `string[]` fragment array, so none of this tool's working benefits from the
  dev-gated fragment reveal that `CLAUDE.md` says to author by default. The steps also don't explain
  *why* 1 s.f. rounding lands where it does — close to "jump to the rounded values, then the answer."
- Conventions/anomaly scan: Zero matches on the override grep — fully vanilla ToolShell usage, no
  overrides at all, nothing to tag. A clean baseline (correctly, since there's no diagram content).
- UI/visual consistency: Not checked live. From source: no hardcoded hex colours, no custom renderers
  — relies entirely on the shared `QuestionDisplay`/`AnswerDisplay`, so it should be visually native
  to the shell by construction.
- **Recommended status:** Live but flagged for expansion — missing worded/context question variety, no
  fragment-based working steps, no technique/skill hookup for its core "round to 1 s.f." move.
  (current: Live)

**Notes:** The one sub-tool's internal QO variety is genuinely good design and shouldn't be undersold
— the gap here is content breadth and working-step polish, not the QO plumbing.

### Multiplying & Dividing by 10ⁿ — `src/tools/Number/PowersOfTen.tsx`
Route: `/powers-of-ten` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — `buildDisplay` produces exactly two generic `tStep`s (template sentences, e.g.
  "X has N zeros...") with **no computed arithmetic line at all** — not even a plain `v × 10ⁿ = answer`
  line. Thinner than `IntegerAddSub`'s working. No existing technique covers "scale by a power of ten"
  — **new technique proposed**: `scaleByPowerOfTen` (count the zeros → state direction → show the
  digit shift numerically), likely low priority but currently the tool's biggest single gap.
- Skills: No markers. The unlinked assumed prerequisite is **place value** (reading grid columns) —
  no `place-value` id existed anywhere in `PROJECTS.md`'s skills table — **new skill proposed**.
- Representations: The tool's core pedagogy (the place-value grid, `PlaceValueGrid`) doesn't map onto
  any of the six core representations — closest in spirit to number line, but structurally a grid.
  Flagged as an open question, not a finding with a clear owner. Also notable: **the grid disappears
  entirely at Level 3** (numbers "too big to grid," replaced by a plain text card) — the tool's one
  distinguishing pedagogical device is absent for a third of its difficulty range.
- Teach deck: Plausible (I-do ×10 → We-do ÷100 → You-do predict the shift for ×1000), but can't reuse
  an existing `TeachScene` family — the place-value grid would need a wholly new scene type.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, single shape (`v × 10ⁿ` or `v ÷ 10ⁿ`). No
  worded/contextual questions, no standard-form connection despite L3 dealing with very large/small
  numbers (a natural bridge left unmade), no reverse-direction ("which power of 10?") question type.
- QO richness: One dropdown (Mixed/Multiply/Divide) and one purely-display variable (`powersNotation`),
  `difficultySettings: null` — identical QO options at all three levels, unlike the reference tools'
  per-level QO. No `multiSelect`.
- Level progression: Underlying number ranges progress well (whole → decimals → extreme numbers), but
  L3's progression costs the tool its own visual model — a real regression, since the diagram is most
  of the explanatory value and it vanishes exactly when the maths gets hardest.
- Working-step depth: Weakest point of this tool — two fixed-template `tStep`s reused verbatim across
  every question at a given operation, no `mStep`, no fragments, no rendering of the actual numeric
  shift. Sits well below `CompletingTheSquare`/`FractionToRatio`'s bar — the single biggest Part 2 gap
  found in this pass.
- Conventions/anomaly scan: Same pattern as `IntegerAddSub` — `questionRenderer` (**Justified**,
  needed for the grid) · `reformatQuestion` (**Justified and exemplary** — correctly implements the
  `CLAUDE.md` display-swap pattern for `powersNotation`, matching the reference `CompletingTheSquare`
  pattern) · `collapseWorkingByDefault: true` (**Justified** in-file, same "only 2 tools use this"
  caveat as `IntegerAddSub`) · `hideFontControls: true` (**Justified**) · `numQuestions: 5,
  numColumns: 2, maxColumns: 4` (**Unclear**, same reasoning as `IntegerAddSub`) · absence of
  `customPrintHandler` is **Justified and commented** (worksheet cells are text-only).
- UI/visual consistency: Not checked live. From source: minimal hardcoded hex (1 hit) plus the same
  repo-wide `style={{ color: ... }}` pattern as `IntegerAddSub` — not an outlier. No SVG at all — the
  grid is an HTML `<table>`, unusual among diagram tools (siblings are pure SVG) but not wrong; it
  does mean this tool sits entirely outside the SVG-print conventions rather than opting out of them.
- **Recommended status:** Live but flagged for expansion — narrower than `IntegerAddSub` in both
  question breadth and especially working-step depth; the Level 3 loss of its own representation is a
  specific, fixable gap worth prioritising over broader content work. (current: Live)

**Notes:** The largest gap between "infrastructure debt" (expected/universal) and "content thinness"
(specific to this tool) found in this pass — the two generic `tStep`s in `buildDisplay` are the
cheapest, highest-value fix candidate found across the whole category, since the actual numeric
working (`vin × power = vout`) is already fully computed and just isn't being shown.

### Adding & Subtracting Fractions — `src/tools/Number/FractionsAddSub.tsx`
Route: `/add-subtract-fractions` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; working is hand-built inline
  (`improperMethodWorking`/`separatePartsWorking`), but the pedagogy is genuinely good (see Part 2).
  `PROJECTS.md`'s `addSubtractFractions` row (med priority, ⬜) is exactly this move — a
  straightforward cross-reference. Converting would mean extracting these into a grain-aware
  technique other worded fraction tools could reuse.
- Skills: One marker already present and correct — `[[lcm|LCM]]` in the level-3 path. Gaps: the
  "Simplify" step never links `[[simplify-fraction|Simplify]]` (high priority in `PROJECTS.md`, bar
  model exists, ⬜); "Convert to an improper fraction" is a `convert-mixed-improper` candidate (med,
  ⬜); the level-2 "write over a common denominator" step could link `equivalent-fractions` (high, ⬜).
- Representations: Bar model is the obvious fit and is exactly what the tool's own Teach deck already
  uses (`split`/`equivalents`) — but Whiteboard/Worked-Example/Worksheet modes carry no visual at all,
  purely symbolic KaTeX working.
- Teach deck: Already has one — the only deck that exists site-wide. Only Concepts is built
  (equivalent fractions via `split`/`equivalents`); True/False and Spot-the-Mistake are stubbed
  "Coming soon." Natural next beats are readily available from this tool's own content (e.g. Spot the
  Mistake on "add the denominators too"; True/False on whether a same-denominator L1 question needs
  an LCM step at all).
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Two sub-tools, each with a full three-level progression plus a
  genuine second *method* (Whole & Part Method vs convert-to-improper) for mixed numbers — broader
  than a single rigid template, close to full GCSE spec coverage for the topic. Main gap: no
  worded/contextual fraction-addition problems (everything is a bare symbolic expression).
- QO richness: Strong — both sub-tools carry a Multi-select (Addition/Subtraction), a per-sub-tool
  dropdown (Answer Format: Improper/Mixed), and `difficultySettings` injecting a level-3 variable.
  Five distinct variables total, well above a "fixed generator."
- Level progression: Genuine restructuring — L1 same-denominator, L2 one-denominator-a-multiple-of-
  the-other (requires scaling), L3 unrelated/coprime denominators requiring LCM. Each level demands a
  materially different method.
- Working-step depth: Excellent — the strongest part of the tool. Every step uses `mStep` with prose
  labels and 2–3-fragment arrays for live modelling; the mixed-number "whole & part method" explicitly
  models regrouping/borrowing with dedicated steps — pedagogical care above a "jump to the answer" tool.
- Conventions/anomaly scan: Only override found is `defaults={{ numQuestions: 12, numColumns: 3 }}`.
  `numQuestions: 12` vs the 15 baseline is undocumented — **Unclear** (plausible: fraction questions
  take more board space, but unexplained). `numColumns: 3` matches baseline, not really an override.
  Correct absence of diagram-only props (`hideFontControls` etc.) for a text/KaTeX tool.
- UI/visual consistency: Not checked live. From source: no hardcoded hex colours — all styling through
  shared components, no old-shell visual leftovers detected.
- **Recommended status:** Stay live as-is — the strongest Number tool in this pass and matches its
  billing as a "what good looks like" reference point. Remaining gaps: missing worded/contextual
  question variant, two stubbed Teach categories. (current: Live)

**Notes:** The cleanest example in the category of the fragment-array "board-writing rule" being
followed correctly throughout. Worth pointing future audit entries at this file's
`improperMethodWorking`/`separatePartsWorking` split as a model for keeping multiple methods
architecturally separate from the core maths via `RawValues` + `reformatQuestion`.

### Multiplying & Dividing Fractions — `src/tools/Number/FractionMultDiv.tsx`
Route: `/multiply-divide-fractions` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; working entirely hand-built
  (`multiplySteps`/`divideSteps`). `PROJECTS.md`'s `multiplyDivideFractions` row (med, ⬜) names the
  needed move — a cross-reference, not a new discovery. The Keep-Flip-Change move (`divideSteps`) is a
  clean, self-contained candidate for extraction once that technique is built.
- Skills: Zero `[[skill-id|term]]` markers anywhere (vs. the sibling tool's one). Two clear unlinked
  candidates: "Simplify" (→ `simplify-fraction`, high priority, bar model exists, ⬜) and "Convert to
  an improper fraction" (→ `convert-mixed-improper`, med, ⬜). "Keep, flip, change" itself names a
  specific taught method not in either the technique-audit or skills tables — **flag as a new
  skill/technique candidate**, self-contained and teachable like the `lcm` skill entry.
- Representations: Bar model would fit, but — unlike the sibling tool — this tool has **no Teach deck
  at all**, no existing visual proof point to lean on. Multiplication is also a natural area-model
  candidate (grid of fractional side-lengths), but area model has no `TeachScene` family yet, so that
  would be new representation work.
- Teach deck: None exists — a real gap relative to the sibling tool, which is the one deck that exists
  site-wide. A natural I-do → We-do → You-do arc is available on the same coherent example (e.g.
  $\frac23 \times \frac34$ as "area of a rectangle with fractional sides"). Worth proposing as the
  second deck to prove breadth.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Two sub-tools, each with a three-level progression and an
  Operations multiSelect. Reasonable core-move coverage, but narrower than the sibling tool: no
  worded/contextual questions, and no equivalent to the sibling's "Whole & Part Method" — less genuine
  method-variety than the Add/Sub tool offers.
- QO richness: Moderate — both sub-tools carry a multiSelect and a dropdown, plus `difficultySettings`
  injecting one variable each at specific levels (three variables total vs. the sibling's five). Two
  levels expose no variables at all beyond Operations/Format.
- Level progression: Genuine restructuring for both sub-tools (non-simplifying → simplifying → integer
  operand; proper×mixed → mixed×whole → mixed×mixed with a range extension) — matches its
  INFO_SECTIONS description accurately.
- Working-step depth: Good but shallower than the sibling — many steps are **single-fragment** (a
  whole latex string, not a `string[]`) where the board-writing rule calls for splitting (e.g.
  Keep-Flip-Change is a two-move line authored as one fragment). Not wrong, but a live-modelling depth
  gap relative to the sibling and the stated authoring convention.
- Conventions/anomaly scan: Same single override as the sibling — `defaults={{ numQuestions: 12,
  numColumns: 3 }}`, same **Unclear** tag on the undocumented `numQuestions: 12`. Correct absence of
  diagram-only props.
- UI/visual consistency: Not checked live. From source: no hardcoded hex colours, no bespoke JSX
  beyond the `App()` wrapper — no old-shell visual leftovers detectable from source.
- **Recommended status:** Live but flagged for expansion — solid, spec-covering maths and a clean
  `reformatQuestion`/`RawValues` architecture matching its sibling, but noticeably thinner on three
  fronts: no Teach deck, no skill-link markers despite two clear candidates, shallower step
  fragmentation. None blocking, but this is the lesser of the two 2026-07-06 "reference point" tools
  and shouldn't be assumed equally mature just because it shares a first-commit date. (current: Live)

**Notes:** If a Keep-Flip-Change skill/technique is built per the Part 1 finding, this tool becomes
its first natural consumer via a `[[keep-flip-change|...]]`-style marker.

### Percentages — `src/tools/Number/Percentages.tsx`
Route: `/percentages` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin by the strict "uses the engine" test, but the hand-rolled working is genuinely deep
  (see Part 2) — closer to what a converted tool's *output* should look like than a thin wrapper. More
  importantly, **no technique in `PROJECTS.md` covered this domain at all** before this pass — **three
  new technique rows proposed**: `percentageOfAmount` (multiplier vs chunking), `percentageChange`
  (build multiplier from 100 ± %), `reversePercentage` (unitary "find 1%, then scale" method). All
  three sub-tools here are demand signal #1 for these new rows.
- Skills: Two clear unlinked candidates, **neither existed anywhere in `PROJECTS.md`'s skills table**
  before this pass: converting a percentage to a decimal multiplier, and the **unitary method** (find
  1%, then scale) used throughout `reversePercentages`. Both named directly in step labels but never
  marked — a bigger gap than `Estimation`'s, since it's a missing category, not an unfilled row.
- Representations: Bar model is the designated representation for percentages per `CLAUDE.md`'s table
  and already has an existing `TeachScene` family — a *cheap* representation gap (existing scene, not
  new work). Currently zero visual representation anywhere in this tool.
- Teach deck: Very strong candidate — "find 10% by splitting into ten strips" (bar model, I-do)
  building to chunking (We-do) is natural, and reverse percentages is a well-known misconception zone
  (subtracting the % instead of dividing by the multiplier) — a strong "Spot the Mistake" candidate,
  one of the two stubbed categories in the only existing deck. Worth prioritising as the second deck.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (`findingPercentages`, `percentageChange`,
  `reversePercentages`) — good structural breadth, and unlike `Estimation` every question is `kind:
  "worded"` with real context (items, prices, VAT, a population-in-thousands L3 scenario).
  `findingPercentages` offers 2 methods; `percentageChange` covers increase/decrease/mixed plus a
  genuinely different L3 compound two-step change; `reversePercentages` covers 3 contexts and splits
  L3 into two distinct sub-shapes. One gap: no "express A as a percentage of B" comparison question
  type — `findingPercentages` only goes percentage → amount, never the reverse framing.
- QO richness: A dropdown (2–3 options) plus one variable toggle per sub-tool. Real control, though
  `difficultySettings: null` for all three sub-tools means identical QO options at every level (e.g.
  the unitary-method toggle is selectable even at Level 1) — not necessarily wrong, but a deviation
  from the pattern seen elsewhere and worth a decision. **Unclear**.
- Level progression: The standout part of this tool — genuine structural escalation at every sub-tool,
  not number-scaling (e.g. L3 forces the chunking method to decompose fractional percentages like
  12.5%; `percentageChange` L3 introduces a genuine compound two-stage change). Close to best-in-class
  for the categories read so far.
- Working-step depth: Strong, and the clearest evidence this is more recently/carefully authored than
  `Estimation` — fragments are used throughout, following the "author by default" convention the
  sibling tool ignores. The chunking method is a real pedagogical decomposition (10s/1s, plus 50s/25s
  at L1) with per-part steps and a recombination step, not a jump to the answer.
- Conventions/anomaly scan: Zero matches on the override grep — fully vanilla, no debt.
- UI/visual consistency: Not checked live. From source: no hardcoded hex colours; a `gbp()` helper for
  KaTeX currency with an in-file comment explicitly citing the "never a literal £ inside KaTeX"
  gotcha from `CLAUDE.md` — a positive quality signal consistent with being the most recently
  authored/reworked tool in the repo.
- **Recommended status:** Stay live as-is, with minor expansion notes (add an "A as % of B" comparison
  question type; hook up the bar-model representation and the two proposed skills once they exist).
  Close to reference quality already — arguably itself a candidate to name alongside
  `CompletingTheSquare.tsx`/`FractionToRatio.tsx` as an internal quality bar for Number worded tools,
  once the two Part 1 gaps (technique family, skill markers) are addressed. (current: Live)

**Notes:** The contrast with `Estimation` is instructive for the audit's own methodology point: both
tools are equally thin on Part 1, but visibly different on Part 2 — worded contexts vs bare
expressions, fragmented steps vs flat steps, genuine method depth vs minimal explanation. Percentages
needs the same infrastructure work as Estimation despite being far ahead of it on content quality.

### Algebra — ✅ complete
- [x] Collecting Like Terms (`CollectingLikeTerms.tsx`)
- [x] Unknowns on Both Sides (`SolvingLinearEquations.tsx`)
- [x] Completing the Square (`CompletingTheSquare.tsx`)
- [x] Iteration (`Iterations.tsx`)
- [x] Simultaneous Equations — Elimination (`SimultaneousEquations.tsx`)
- [x] Simultaneous Equations — Substitution (`NonLinearSimEq.tsx`)
- [x] Expanding Brackets (`ExpandingBrackets.tsx`)

**Category summary.** `NonLinearSimEq` (Substitution) confirms its billing as the repo's one
techniques-engine conversion, but the audit found the conversion is a genuine hybrid, not a full
delegation — its highest-frequency "linear" sub-tool still hand-rolls its solve chain rather than
calling the already-built `solveLinearEquationSteps`, which is exactly why both of `PROJECTS.md`'s
previously-known gaps in this tool are still present (confirmed at the generator-code level, not
just asserted): the `(2x−5)²` expansion is never shown (the data model has nowhere to store an
unsimplified intermediate), and a computed coefficient of ±1 renders as literal `−1x` instead of
`−x` because that code path bypasses the sanitizer (`coef()`/`nextT`) used everywhere else in the
file. Its Elimination-method sibling, `SimultaneousEquations.tsx`, is **not** carried along by that
"one tool converted" status — it has no technique import and no SmartGrapher — despite arguably
**broader** Part 2 content (four sub-tools including a 9-shape worded one) than the substitution
tool, a clean example of Part 1 and Part 2 findings diverging in different directions on sibling
tools. `CompletingTheSquare.tsx` — the repo's own named reference for shell wiring and
`reformatQuestion` — turns out to be an unconverted, non-fragmented tool on the techniques/skills
axis exactly like every other tool audited so far; its reference status is architectural, not a
techniques-engine claim, and shouldn't be read as one. Two concrete, unrelated content bugs also
surfaced (findings only, not fixed): `CollectingLikeTerms`' own info-modal text says its Level 3
"Spot the Like Term" has five options, but the generator always produces six; and
`SolvingLinearEquations` has a redundant "Isolate constant:" step that performs no visible operation
in two of its three levels (the constant is already isolated by that point), while the same step
title *does* real work in the third level — a labelling inconsistency alongside the redundancy.
Two representation-shaped gaps repeat the Number-category pattern of a tool being the natural first
consumer of an unbuilt representation: `CollectingLikeTerms`/`SolvingLinearEquations` for algebra
tiles (no scenes yet), and `ExpandingBrackets`/`CompletingTheSquare` for area model (no scenes yet,
and both are *already* the named use case for it in `CLAUDE.md`'s representation table). `Iterations`
is flagged as the highest-leverage unwired SmartGrapher candidate of the whole pass — `PROJECTS.md`
already names it by name as a next step, the infrastructure is proven elsewhere in this exact
category (`NonLinearSimEq`), and the tool currently has zero visual content despite being
fundamentally about visualising convergence to a root.

### Collecting Like Terms — `src/tools/Algebra/CollectingLikeTerms.tsx`
Route: `/collecting-like-terms` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; all working is hand-built
  (`buildCollectWorkingSteps`, `finishMCQ`). `PROJECTS.md`'s `collectLikeTerms` row (med priority, ⬜)
  is a direct cross-reference. Given this tool covers three genuinely distinct sub-tool shapes plus a
  fully worked-out "subtraction case" taxonomy (positive-only / stays-positive / crosses-zero), it's a
  stronger demand signal than most other med-priority rows.
- Skills: No `[[skill-id|term]]` markers. This isn't a missing-link gap so much as confirmation this
  tool **is** the primary teaching ground for `PROJECTS.md`'s `collect-like-terms` skill row (algebra
  tiles, med priority, no scene yet, ⬜). Notably, the tool's own bespoke `stepRenderer`
  (colour-underlined term groups, `UNDERLINE_COLORS`) is already a working, non-tile visual grouping
  device — worth a look as a cheap fallback/prototype before investing in full tile scenes.
- Representations: **Algebra tiles** is the designated representation ("collecting terms, solving
  equations, factorising") — one of three representations with no `TeachScene` family yet. This tool
  would be the natural first consumer once tile scenes are built, mirroring `IntegerAddSub`/negative
  counters from the Number pass.
- Teach deck: Strong candidate — the three built-in "subtraction cases" already form a natural
  I-do → We-do → You-do arc on one running variable, with "predict which direction the running total
  crosses zero" a ready-made You-do beat. Blocked on the same algebra-tile scene gap, though the deck
  could plausibly reuse the tool's own colour-underline visual directly rather than waiting.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools — Spot the Like Term (worded MCQ,
  term-identification), Single Variable, Multiple Variables — genuinely good spec coverage, broader
  than most Number-category tools. Gap: no worded/contextual question anywhere (e.g. a perimeter
  framing) — everything is a bare symbolic expression or abstract MCQ term.
- QO richness: Uneven. Subtools 2/3 are rich — two multiSelect groups per level via
  `difficultySettings`, genuine teacher control. Subtool 1 is thin by contrast — `variables: []`,
  `dropdown: null`, no multiSelect at L1/L2 at all; only L3 gets one toggle. A teacher gets zero
  control over Spot-the-Like-Term at two of its three levels.
- Level progression: Strong across all three sub-tools, genuinely restructuring rather than scaling
  numbers — e.g. subtool 1 escalates single-var/exactly-1-correct (L1) → negative coefficients + a
  same-coefficient distractor trap (L2) → 0–3 correct of 6 options with optional two-variable targets
  and commutativity traps (L3).
- Working-step depth: Genuinely good but structurally different from the Number reference tools.
  Subtool 1 explains reasoning for *every* option (an mStep/tStep pair per option, real depth).
  Subtools 2/3 underline like terms by colour via a custom `stepRenderer`, then one mStep per
  collectable group. However **no working step in this file ever uses the `string[]` fragment
  convention** — every mStep's latex is a single joined string, so the dev-gated fragment reveal gets
  nothing extra beyond the underline step itself, a real depth gap relative to `FractionsAddSub`.
- Conventions/anomaly scan: `questionRenderer` (**Justified** — two genuinely different display
  shapes) and `stepRenderer` (**Justified** — the first custom `stepRenderer` seen in this audit, a
  clean, well-scoped use of the extension point for the colour-underline step). No `defaults=` block
  at all — correct absence for a KaTeX/JSX-only tool, matching `Estimation`'s clean baseline.
  **Unclear**: subtool 1's on-screen MCQ display is a bespoke bordered grid built from a `_mcq` field
  not present in the plain `lines`/`answer` fields the default text print path uses — whether the
  worksheet PDF actually reproduces the coloured MCQ box or falls back to a plainer rendering couldn't
  be confirmed from source alone.
- UI/visual consistency: Not checked live. From source: hardcoded hex colours present
  (`UNDERLINE_COLORS` + several inline `style={{ color: ... }}`) but match the prevailing repo-wide
  pattern already found in 20+ tool files in the Number pass — not tool-specific debt.
- **Recommended status:** Stay live as-is — one of the stronger tools seen in this audit so far
  structurally, flagged for expansion on QO control at subtool 1's L1/L2 and on working-step
  fragmentation. (current: Live)

**Notes:** A genuine content/documentation bug: `INFO_SECTIONS`'s "Spot the Like Term" Level 3
description says *"Five options with zero, one, or two correct answers"*, but the generator always
produces **six** options with **zero to three** correct — a real mismatch between what the info modal
tells a teacher to expect and what the tool generates, worth a follow-up fix outside this
findings-only pass. Also worth naming as a positive: the "subtraction cases" QO taxonomy's partial-sum
logic (guaranteeing genuine up-/down-crossing behaviour) is unusually rigorous generator engineering,
well above what the working-step fragment gap alone would suggest.

### Unknowns on Both Sides — `src/tools/Algebra/SolvingLinearEquations.tsx`
Route: `/solving-linear-equations` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — imports only base shared helpers, never `solveLinearEquationSteps`, even though
  it's re-exported from the exact same `"../../shared"` barrel the tool already imports from — a
  zero-new-import integration point. `solveLinearEquationSteps(a, b, c, v, grain)` solves `a·v+b=c`,
  exactly the tool's own post-reduction form, and a direct call would both replace the hand-rolled
  final steps and fix a real working-step defect (below). What the built technique doesn't cover is
  the tool's actual headline move — collecting x terms from both sides before that form even applies
  — which is `PROJECTS.md`'s `collectLikeTerms` row (med, ⬜). So this tool spans two technique rows:
  `solveLinearEquation` (**high**, 🚧 grain-aware exists) for the finishing moves, `collectLikeTerms`
  for the opening move — worth noting that cross-reference in the table.
- Skills: No markers anywhere. This tool's own domain is exactly `PROJECTS.md`'s
  `solve-linear-equation` skill (**high**, algebra tiles/number line, no tile scene yet, ⬜) — it
  doesn't consume that skill, it **is** the skill's target domain, the natural home once a tile scene
  exists.
- Representations: **Algebra tiles** — no `TeachScene` family yet. Zero visual representation
  anywhere currently.
- Teach deck: Strong candidate structurally (I-do collect-x → We-do brackets → You-do negative
  x-coefficient, predict-then-reveal), but blocked on the same algebra-tile scene gap as
  Representations — unlike `FractionsAddSub`'s deck, which could reuse already-built scenes.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, but three structurally distinct shapes (L1
  plain, L2 brackets, L3 negative x-coefficients) — genuinely more shape variety than a rigid
  template. Gap: every question is symbolic/bare, no worded/contextual "unknowns on both sides"
  question (e.g. equal-perimeter or equal-cost framing).
- QO richness: The strongest of any Algebra/Number tool read so far — seven distinct multiSelect
  groups wired through a genuinely per-level `difficultySettings` block, matching the
  `CompletingTheSquare` reference pattern and better-differentiated than `Percentages`' identical-at-
  every-level QO. No `dropdown` used anywhere — not wrong, just a design choice worth noting.
- Level progression: Genuine restructuring — L1 constant-sign handling, L2 requires bracket expansion,
  L3 requires handling negative x-coefficients (a materially different reduction, since x terms
  combine by addition rather than subtraction). One of the better-structured progressions in this
  pass.
- Working-step depth: A real, concrete defect. No fragment arrays anywhere — every step is one flat,
  pre-collapsed string embedding a `\rightarrow` jump. Worse, in two of the three levels' branches the
  "Isolate constant:" step is a **no-op** — it restates the exact same equation the prior step already
  ended on, because the constant is already isolated by then, presenting a working line that performs
  no visible operation. In the third level's branch, the same step *title* does perform real work
  (combining terms into a single coefficient) — the same label means two different things in different
  branches of the same tool, a labelling inconsistency alongside the redundancy. Swapping in
  `solveLinearEquationSteps` for the final stage would fix both the redundancy and add fragment
  support for free.
- Conventions/anomaly scan: Zero matches on the full override grep — fully vanilla ToolShell usage,
  same clean baseline as `Estimation`.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, no bespoke
  renderers — should be visually native to the shell by construction.
- **Recommended status:** Live but flagged for expansion — the strongest QO/level-progression design
  read in this audit so far, undercut by thin/partly-broken working-step depth and a total absence of
  worded/contextual questions. The techniques-engine gap here is unusually cheap to close (no new
  import needed, the exact-shape function already exists). (current: Live)

**Notes:** The generators fall back to a single hardcoded literal question if 200 random attempts
can't satisfy an active multiSelect combination — not confirmed to trigger in practice, but worth a
follow-up check given how many combinations are now exposed per level, since it could mean some QO
combinations silently serve the same static question repeatedly across a worksheet.

### Completing the Square — `src/tools/Algebra/CompletingTheSquare.tsx`
Route: `/completing-the-square` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin by the strict "uses the engine" test — no `src/shared/techniques/` import, despite
  `CLAUDE.md` naming this file as **the** reference for shell wiring and `reformatQuestion`.
  `PROJECTS.md`'s `completeTheSquare` row is itself **low priority, ⬜ (not built)** — the repo's own
  "look here" file is, by the audit's infrastructure lens, exactly as unconverted as every other tool.
  It's a good *architectural* reference (props wiring, `RawValues`/`buildDisplay`/`reformatQuestion`
  separation) but not a techniques-engine reference, and those are different claims worth keeping
  distinct in the audit record.
- Skills: No markers, but genuinely thin on link sites rather than missing them — every step label
  ("Factor out N", "Half the coefficient of x", "Complete the square", …) is the technique's own core
  content, not an unlinked prerequisite. No obvious existing skill-id candidate.
- Representations: **Area model** is `CLAUDE.md`'s designated representation for completing the
  square directly, alongside expanding brackets — no `TeachScene` family yet, and this strengthens
  the case for prioritising area-model scene work, since it would unlock two Algebra tools at once.
- Teach deck: Strong candidate — all three sub-tools already share one coherent underlying move
  (halve b, form `(x+p)²`, adjust the constant), exactly the "one running example, three framings" arc
  the authoring guide asks for.
- SmartGrapher: **Named directly in `PROJECTS.md`'s own backlog** ("parabola + vertex") as an
  unactioned next step — confirmed zero grapher usage in the file. Strong fit: `roots` (x-intercepts)
  and `turning` (vertex) are exactly the coordinate content SmartGrapher is built for, including the
  "no real roots" case rendering naturally as a parabola that never crosses the x-axis.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (`completing`, `roots`, `turning`) is genuine
  spec breadth. `roots` correctly handles the "no real roots" edge case and produces clean integer
  square roots where possible rather than always leaving a surd. Gap: no worded/contextual question
  anywhere, and no explicit link from `roots`/`turning` back to a graph.
- QO richness: Genuinely strong and correctly the `CLAUDE.md`-named reference example for per-level
  `difficultySettings`. L1 has no dropdown/variables at all, L2 introduces Display format and an
  Integer +c toggle, L3 adds Negative Coefficients — QO complexity scales with mathematical
  complexity rather than being flat, exactly the pattern `ExpandingBrackets` lacks.
- Level progression: Strong and structural — L1 monic integer p, L2 monic half-integer p (motivating
  the Display toggle), L3 non-monic with an extra "factor out a" step lower levels never see.
- Working-step depth: Solid in content, every step correctly narrates the named move. **But every
  single step is a whole-string latex, never a `string[]` fragment array** — a genuinely notable
  finding precisely because this is the named reference tool: the "author fragments by default" rule
  sits right next to this file's own reference callout in `CLAUDE.md`, but isn't demonstrated in it.
- Conventions/anomaly scan: One override, `defaults={{ numQuestions: 6, numColumns: 2 }}` —
  undocumented, and markedly lower than any other tool audited so far in either category (**Unclear**;
  a plausible reason exists — multi-line LaTeX display wanting more board space — but unstated).
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours — the cleanest
  result of any tool read in this pass, consistent with the file's billing as an architectural
  reference.
- **Recommended status:** Stay live as-is — strong Part 2 fundamentals earn its status as the named
  shell-wiring reference. The caveats are Part 1 gaps that don't undermine that but do need to be
  visible: unbuilt technique, no skill links, an unaddressed SmartGrapher fit named in `PROJECTS.md`'s
  own backlog, and no fragment-array steps anywhere. (current: Live)

**Notes:** The double-duty this file plays (architecture reference *and* audit subject) is worth
being honest about: excellent for shell-wiring/`reformatQuestion`, but not evidence that
"reference-implementation" tools are automatically ahead on the techniques-engine or
fragment-authoring fronts — on those axes it's exactly as unconverted as every Number-category tool.
Useful calibration for whoever picks up the `completeTheSquare` technique row next: it means
retrofitting the repo's own flagship example, not a neglected corner tool.

### Iteration — `src/tools/Algebra/Iterations.tsx`
Route: `/iterations` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no `src/shared/techniques/` import; all working hand-rolled via three
  near-identical local formatter helpers shared across two sub-tools. `PROJECTS.md`'s
  `solveByIteration` row ("change-of-sign interval, iterate, bound-test", low priority, ⬜) maps
  almost 1:1 onto this tool's three sub-tools (iterate / rearrange-then-iterate / bound-test) — unlike
  most audited tools where a candidate technique is inferred, here it's a complete, ready-made spec,
  making this the clearest already-built demand signal found so far. **Priority bumped med** in
  `PROJECTS.md` on the strength of this finding (see that doc).
- Skills: No markers. `genRearranging`'s opening moves (`x²=ax+b` → `x=√(ax+b)`) are literally the
  `rearrange-formula` skill (med, ⬜, no scene yet) — a real, currently-unmarked link site. The
  "change of sign" reasoning in `genVerification` names a specific taught method with no existing
  skills-table row — better captured as part of the proposed `solveByIteration` technique/skill
  pairing than as a standalone skill, mirroring `IntegerAddSub`'s "this tool IS the primitive"
  pattern from the Number pass.
- Representations: None of the six fit. The natural visual (a cobweb/staircase diagram between
  `y=x` and `y=f(x)`) sits outside the six-representation vocabulary entirely — it's SmartGrapher
  territory, not a `TeachScene` family. Flagged as an open question, same treatment as `PowersOfTen`'s
  place-value grid in the Number pass.
- Teach deck: Plausible and lower-cost than most candidates — a Root Verification I-do/We-do/You-do
  arc needs only static `TeachBlock`s (text/math/verdict/note), not a new scene family, since it's
  arithmetic evaluation rather than a visual transformation.
- SmartGrapher: **Strong, explicitly-named fit currently unwired.** `PROJECTS.md`'s SmartGrapher
  section names Iteration by name ("the curve and the root being approached"). Zero grapher usage
  found in the file — no diagram of any kind. Existing presets (quadratic/cubic/custom) already cover
  this tool's formula types directly, and it's already proven inside `NonLinearSimEq` in this same
  category. The single highest-leverage, most concretely-named Part 1 gap found in this pass.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (`numerical`, `rearranging`, `verification`)
  covering the standard iteration trio — genuinely better topic-spec coverage than most
  single-sub-tool tools audited so far. All questions are worded prose with inline maths, reasonable
  for this notation-heavy topic.
- QO richness: Uneven and the weakest part of this tool. `verification` has **zero QO options at all**
  — a fully fixed generator. `rearranging`'s formula type (quadratic/cubic/fractional) is hard-locked
  to level with no independent selector, unlike `numerical`'s equivalent `formulaType` dropdown — an
  inconsistency between sibling sub-tools. No `multiSelect` is used anywhere in the file at all.
- Level progression: Two of three sub-tools escalate well (`numerical`, `verification`); `rearranging`
  is the outlier — its "levels" actually encode formula family rather than difficulty within one
  family, conflating two axes kept independent elsewhere in the same tool.
- Working-step depth: Flat throughout — zero fragment arrays anywhere; every iteration line is one
  long pre-collapsed string containing the full substitution-to-result chain. The maths is all
  computed and shown, just never split into board-writing moves — the same "content present,
  presentation flat" pattern as `Estimation`.
- Conventions/anomaly scan: One override, `defaults={{ numColumns: 2 }}` — undocumented; plausible
  given long worded prose lines, but unstated (**Unclear**).
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, no bespoke
  renderers.
- **Recommended status:** Live but flagged for expansion — genuinely good topic breadth undercut by
  thin/inconsistent QO control and uniformly flat working-step depth. The standout finding is that
  this is a topic fundamentally about visualising convergence to a root, currently with zero visual
  content, while the fix (SmartGrapher) is mature, proven in the same category, and already named for
  this exact tool in `PROJECTS.md`. (current: Live)

**Notes:** One of the few tools in this audit to use zero multiSelect groups at all, in direct
contrast to its category neighbour `SolvingLinearEquations` (seven groups).

### Simultaneous Equations (Elimination) — `src/tools/Algebra/SimultaneousEquations.tsx`
Route: `/simultaneous-equations-elimination` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import; all working hand-built. `PROJECTS.md`'s `solveByElimination`
  row (med, ⬜) is the exact match. Notably, part of this tool's conversion cost is smaller than a
  fresh build: it hand-re-derives a substitute-back move that duplicates what the already-built
  `substituteBackSteps`/`solveLinearlySteps` technique helpers do — the exact two functions
  `NonLinearSimEq` already imports — so only `solveByElimination` itself is genuinely missing from
  the engine.
- Skills: No markers. The LCM sub-tool computes an actual LCM of two coefficients as its core
  mechanic but never names or links `[[lcm|LCM]]` — an already-built (✅) skill with a clear, cheap,
  currently-missing link site.
- Representations: No clean fit among the six — closest is algebra tiles, but a stretch (tiles model
  one-variable balance, not eliminating a variable across two equations). No urgent gap.
- Teach deck: Reasonable but not urgent — "why does adding/subtracting eliminate a variable" is a
  genuine arc, and the three-method structure (direct/scale/LCM) is a natural You-do prediction
  exercise. No existing scene family fits, so this would need new work.
- SmartGrapher: **Fit exists but is weaker than the sibling's.** Every sub-tool solves a pair of
  straight lines with one intersection — a legitimate, currently-unused fit — but two straight lines
  crossing once is a much less visually informative picture than a line meeting a parabola/circle at
  0–2 points (surds, double roots, no-solution cases), plausibly why this sibling wasn't converted
  alongside `NonLinearSimEq` rather than an oversight.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Four sub-tools — `elimination` (direct), `scaling` (one
  coefficient a multiple), `lcm` (coprime, needing LCM scaling), and `worded` (9 distinct shapes
  across levels, three of them tying simultaneous equations to triangle perimeter/angle-sum geometry —
  a real cross-topic worded gap most tools in this audit lack). One of the widest sub-tool/shape
  counts seen in the audit so far.
- QO richness: Strong and genuinely differentiated — a shared elimination-style QO set (variable,
  rearrangement dropdown, an operation multiSelect active at Level 1 only) plus a worded sub-tool
  whose QO redesigns per level rather than repeating a static option set.
- Level progression: Genuine structural escalation matching the case-type logic — L1 restricted to a
  chosen operation's natural sign case, L2 forces the equal-and-negative case (the one that actually
  confuses students, since the same-looking operation behaves differently), L3 a full mixture. Close
  to best-in-class for the audit so far, on par with `Percentages`.
- Working-step depth: Solid and reasoned, with one systematic gap. The working explicitly *explains
  the elimination choice* via a dedicated reasoning step — stating logic most Number-category tools
  were flagged for omitting — and one generic working-builder correctly covers every worded shape.
  **But every step across the whole file is a plain string, never a fragment array** — despite being
  reasoning-rich, none of it benefits from the dev-gated fragment reveal.
- Conventions/anomaly scan: `defaults={{ numQuestions: 12, numColumns: 2 }}` — same undocumented
  `numQuestions: 12` pattern as the fraction tools (**Unclear**); `numColumns: 2` plausibly justified
  by the wide two-equation `gathered` KaTeX block, but unstated. Notably **absent**: no `maxColumns`
  cap, while its sibling `NonLinearSimEq` pairs the identical `numQuestions/numColumns` pair with an
  explicit `maxColumns: 3` for the same wide-layout reasoning — a genuine inconsistency between two
  tools sharing the same display shape (**Debt-leaning Unclear**). Everything else on the anomaly
  grep is correctly absent for a pure text/KaTeX tool.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours and zero bespoke
  JSX beyond the shell wrapper — should be visually native to the shell by construction, the cleanest
  possible source-level signal available.
- **Recommended status:** Live but flagged for expansion — strong Part 2 fundamentals (breadth, QO,
  level progression, working reasoning all above the audit's average bar so far), held back only by
  the missing fragment convention and the `maxColumns` inconsistency with its sibling. Nothing argues
  for gating; the gaps are polish-level. (current: Live)

**Notes:** Comparison with its sibling `NonLinearSimEq.tsx` is instructive: the "one tool converted"
status does **not** extend to this tool, and the gap is real, not cosmetic (no technique import, no
grapher, no custom renderer). But on raw Part 2 content the two are closer than that infrastructure
gap suggests — this tool's sub-tool/shape breadth and per-level QO redesign are arguably *broader*
than the substitution tool's. Not as mature on infrastructure alignment, not obviously behind on
standalone content quality — exactly the kind of divergence the audit's own methodology predicts can
happen, and the two facts shouldn't be conflated into one score. This tool is the clearest available
second candidate (after `NonLinearSimEq`) for building out `solveByElimination`, since it already has
correct, well-reasoned elimination logic to lift into the engine.

### Expanding Brackets — `src/tools/Algebra/ExpandingBrackets.tsx`
Route: `/expanding-brackets` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import; all working hand-built. `PROJECTS.md`'s `expandBrackets`
  row ("single / double / squared brackets (FOIL, grid)", **high**, ⬜) is the exact match — this
  tool is that row's primary demand signal, the highest-priority unbuilt technique in the whole
  Algebra table. But the row's own spec says "squared brackets" and this tool has **no squared-single-
  bracket question type** (e.g. expanding `(x+5)²` to a trinomial) — its `outsidePower` option only
  ever governs an algebraic multiplier *outside* the bracket, never a bracket raised to a power. A
  genuine spec-coverage gap worth folding into the technique's build brief.
- Skills: No markers. Two concrete unlinked candidates: the "Collect like terms:" step and the
  "Combine:" step both do exactly the collect-like-terms move without linking it — `collect-like-terms`
  (med, algebra tiles, no scene yet, ⬜) is the right target for both. `expand-double-brackets` itself
  (**high**, area model, no scene yet, ⬜) *is* this tool's domain rather than an unlinked
  prerequisite — confirmation the row is correctly scoped here, not a new proposal.
- Representations: **Area model** — no `TeachScene` family yet, the biggest single infrastructure gap
  this tool exposes. It already hand-rolls its own bespoke grid diagram that is conceptually an area
  model (a multiplication table of term-pairs) but as a one-off component, not the shared system — a
  clear case for what the future area-model scene should generalise.
- Teach deck: Plausible candidate — I-do (single FOIL) → We-do (double FOIL) → You-do (predict the
  middle term) is natural, and the tool's dual FOIL/Grid framing maps cleanly onto an I-do/We-do split.
- SmartGrapher: No fit — purely symbolic content, correctly absent.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (`expand`, `simplify`, `double`) is decent
  breadth, and the dual FOIL/Grid method choice (including "Both" side-by-side) is a genuinely good
  feature not seen elsewhere in the categories audited so far. Real gaps: no squared-single-bracket
  type (named in the technique's own spec), no worded/contextual questions at all — an "area of a
  rectangle" framing would be natural and would also motivate the area-model representation.
- QO richness: Real control on `expand`/`simplify` (a Method dropdown, a Multiplier Type multiSelect),
  `double` correctly has only the Method dropdown. But **all three sub-tools set
  `difficultySettings: null`** — identical QO options at every level, unlike the `CompletingTheSquare`
  reference pattern; a Level 1 student can still toggle "Algebraic" multiplier or "Both" methods,
  undocumented and a real deviation from the sibling in the same category.
- Level progression: Genuinely structural for both generators — real escalation, not just bigger
  numbers, in both `expand` and `double`. One **Unclear**: at tool-level 3 in `simplify`, one bracket
  is always hard while the second is capped to never reach the hardest tier — a deliberate-looking but
  uncommented choice.
- Working-step depth: The tool's real strength (FOIL/Grid diagrams) is also its explanatory weakness —
  no step narrates *why* a negative multiplier flips a sign, precisely where L3 gets hard. No fragment
  arrays anywhere — every step arrives as one whole KaTeX string.
- Conventions/anomaly scan: The one grep hit (`defaults={{ numQuestions: 15, numColumns: 3 }}`) isn't
  actually an override — it restates ToolShell's own baseline, **Justified (no-op)**. A real,
  unflagged design gap found instead: the FOIL/Grid diagrams are wired through `stepRenderer` for the
  Worked Example only — they **never appear on the Whiteboard's main question view or in worksheet
  PDFs**, so this tool's best pedagogical asset is invisible in the two modes most teachers use
  day-to-day. Also: `pickActive` is imported but explicitly voided as unused in favour of a custom
  multiplier-reading function — plausibly necessary (computing a "mixed" tri-state `pickActive` alone
  can't), but the unused-import suppression instead of removing it looks like a leftover.
- UI/visual consistency: Not checked live. From source: 6 hardcoded hex colours, more than most tools
  audited so far, but a deliberate FOIL-style multi-colour arrow scheme — legitimate in intent. A real
  checkable-from-source inconsistency: `stepRenderer`'s `colorScheme` is correctly used for the
  surrounding card background but is **never passed down** into the FOIL/Grid diagram components, so
  the diagrams' colours stay fixed regardless of the teacher's colour-scheme choice while the card
  around them changes.
- **Recommended status:** Live but flagged for expansion — the FOIL/Grid dual-method feature is a
  genuine strength above the category baseline, but the tool is thinner than `CompletingTheSquare` on
  QO-per-level restructuring, has zero working-step fragmentation, is missing a spec-named
  squared-bracket type, and its best visual asset is invisible outside the dev-gated Worked Example.
  (current: Live)

**Notes:** The strongest single demand signal in the Algebra category for two `PROJECTS.md` rows at
once — `expandBrackets` (already **high**) and `expand-double-brackets` (already **high**) — both
already correctly name this tool as the reason they exist. The genuinely new findings are the
squared-bracket spec gap and the diagram-invisible-outside-Worked-Example architecture point.

### Simultaneous Equations (Substitution) — `src/tools/Algebra/NonLinearSimEq.tsx`
Route: `/simultaneous-equations-substitution` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: **Converted, but partially** — the only tool in the repo built on
  `src/shared/techniques/` (the `workings()` builder plus `quadraticFormulaSteps`,
  `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`, `standard`
  grain), but it's a hybrid, not a full delegation: the "linear" sub-tool never calls the grain-aware
  `solveLinearEquationSteps` (which already has the sanitizer that would have prevented the ×1
  cosmetic bug below) — it hand-rolls its own solve chain and only borrows a generic titling wrapper.
  The "expand" move used by two of its three sub-tools isn't a technique at all — no `expandBrackets`
  technique exists yet, and this tool is itself the concrete demand signal for building it, exactly
  why the expansion gap below exists. **"Converted" should be read as "converted for
  rearrange/substitute-back/quadratic-formula/factor-roots," not for the ax+b=c solve or the
  expand-a-square move** — those two are precisely the seams where hand-rolled string-building
  remains.
- Skills: No markers. Three clear unlinked candidates, all already existing `PROJECTS.md` rows and
  named directly in this tool's own step titles: "Substitute equation (2) into equation (1)" →
  `substitute-into-formula` (med, ⬜); "Rearrange equation (2) to make X the subject" →
  `rearrange-formula` (med, ⬜); "Set each factor equal to zero and solve" → `factorise-quadratic`
  (med, area model, no scene yet, ⬜). None need new rows, all three already exist, just unconsumed.
- Representations: The un-shown `(2x−5)²` expansion below is exactly what an **area model** would
  clarify (a grid of `2x` and `−5` against themselves) — no `TeachScene` family yet. The "linear"
  sub-tool's solve chain would similarly benefit from algebra tiles — also no scenes yet. This tool
  sits at the same "intersection of two unbuilt representations" pattern as `IntegerAddSub` in the
  Number pass, for different representations.
- Teach deck: Strong, unusually on-the-nose candidate — a Spot the Mistake slide on "expand
  `(2x−5)²`" (the common error of writing `4x²−25`, forgetting the cross term) would directly
  dramatize this tool's own confirmed Gap 1 on its own worked example. Would need a new area-model
  scene, so a second/third proof point, not a quick win.
- SmartGrapher: **Real, working fit** — one of only two tools using it. Genuinely self-validating:
  it checks every stored solution actually lies on the drawn curve and silently omits the graph
  rather than draw wrong geometry if it doesn't — a real quality bar other tools don't have. One
  disclosed, deliberate limitation: only pure circles get a graph — ellipses (two-thirds of Level-3
  non-linear questions) draw no curve, because ellipse isn't a supported series type. This is
  honestly documented in the tool's own info modal, a known and disclosed scope limit, not a silent
  gap — but it does mean SmartGrapher coverage on this tool's own hardest content is only ~1/3.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (`linear`, `factorising`, `formula`) covering
  linear-linear, quadratic-linear (factorisable and formula-required), and circle/ellipse-linear at
  Level 3 — close to full spec coverage, broader than most tools audited so far. One consistent gap
  with the rest of the audit: "worded" here is purely a layout device for numbered equation lines,
  not contextual richness the way it is in `Percentages`/`FractionsAddSub` — no real-world
  substitution scenario anywhere.
- QO richness: Strong and level-aware — a signs multiSelect plus level-2-only extra variables for
  `linear`; a coefficient multiSelect (circle vs ellipse difficulty) shared by `factorising`/`formula`,
  plus a surd/decimal display dropdown on `formula` since its roots are irrational. Real,
  differentiated control per sub-tool.
- Level progression: One of the strongest seen in the audit so far — genuinely different question
  *shape* at each level for all three sub-tools, not number-scaling; L3 switches `factorising`/
  `formula` to an entirely different equation family (circle/ellipse) rather than just harder numbers.
- Working-step depth: Deep and mostly technique-driven — rearrange → substitute → solve (multi-row) →
  substitute back, well above a "jump to the answer" tool, and `formula`'s quadratic-formula step
  genuinely uses live-model fragments. But the hand-rolled substitution/expand-and-rearrange steps are
  each a single-element array — no fragment reveal at all — the direct authoring-level symptom of the
  expansion gap: there's no intermediate to fragment because none is computed.
- Conventions/anomaly scan: `questionRenderer` (**Justified** — two numbered equation lines plus the
  post-reveal graph), plus bespoke `answerRenderer`/`stepRenderer` (**Justified**, unique among tools
  audited so far — for the solution lines and the graph-carrying working step).
  `defaults={{ numQuestions: 12, numColumns: 2, maxColumns: 3 }}` — same undocumented
  `numQuestions: 12` pattern as the fraction tools (**Unclear**); `numColumns/maxColumns` plausibly
  justified by the two-line equations but unstated. `hideFontControls` correctly absent (`fontClass`
  is properly wired through). No `customPrintHandler` — **Justified**, this is text/KaTeX content and
  the graph is whiteboard-only, gated to never appear on worksheets.
- UI/visual consistency: Not checked live. From source: hardcoded hex colours are more numerous than
  most tools audited so far, but consistent with, not worse than, the repo-wide norm already
  established in the Number pass (this file is itself one of the 20 cited examples of that pattern).
- **Recommended status:** Stay live, but this is the one tool in the repo where the Part 1 gaps are
  worth fixing on their own merits rather than deferred to a category sweep — both are small,
  generator-level, single-function fixes (route the computed coefficient through the existing
  sanitizer; extract and expose the squared-bracket expansion as its own step) that would make this
  tool's working genuinely match its "reference conversion" billing. Content breadth and level design
  are already ahead of every tool audited in the Number pass; the ellipse no-graph limitation is
  disclosed and fine as-is. (current: Live)

**Notes:** Both previously-known gaps in this tool (`PROJECTS.md`'s Techniques-engine section) are
confirmed still present, at the exact generator code level: `buildWorking` (`substitute` /
`expand-and-rearrange` steps) never computes or stores an unsimplified intermediate for
`(2x−5)²`-style expansions — the `BankEntry`/`FormBankEntry` data model has nowhere to carry one, so
this isn't a missing render call but a data-model gap. The cosmetic `−1x` bug lives specifically in
the "linear" sub-tool's own `solvePos`/`solveNeg` helpers, which interpolate a computed combined
coefficient raw instead of routing it through the file's own `nextT`/`coef()` sanitizer that every
other code path in the file correctly uses. This tool is the right reference point for judging
"converted" on future passes, but with a caveat: check each sub-tool's actual step-building code, not
just the import list — a tool can legitimately mix technique-driven steps with hand-rolled ones, as
this one does for its highest-frequency sub-tool.

### Ratio & Proportion — ✅ complete
- [x] Dividing Ratios (`RatioSharingTool.tsx`)
- [x] Simplifying Ratios (`SimplifyingRatiosTool.tsx`)
- [x] Recipes (`RecipesTool.tsx`)
- [x] Converting Fractions and Ratios (`FractionToRatio.tsx`)
- [x] Fractions of Amounts (`FractionsOfAmounts.tsx`)
- [x] Best Buys (`BestBuys.tsx`)

**Category summary.** This category produced the audit's clearest live/gated contrast so far:
`SimplifyingRatiosTool` (dev-gated) is recommended to **stay gated**, judged blind to its current
status — it's the only tool in the whole audit (all three categories) with literally zero QO control
and zero visual representation, while its immediate sibling in the same landing-page section,
`RatioSharingTool` (live), ships with both a working bar model and real "Find" controls; placed side
by side they'd read as one finished tool and one thin one. `FractionsOfAmounts` came out as reference
quality — the best working-step fragment density seen since `FractionsAddSub`/`Percentages` (52
fragment-array uses) and the strongest QO differentiation of the pass. Two existing technique rows
(`scaleRecipe`, `unitPriceCompare`) turned out to only describe half of their tool's actual content —
`RecipesTool`'s Constraints sub-tool and `BestBuys`' Special Offers sub-tool each do a materially
different move than the row's one-line spec suggests, both flagged for the row description to be
broadened or split rather than assumed covered. The `unitary-method` skill (proposed during the
Number pass for `Percentages`) now has two more unconsumed demand signals here (`RecipesTool`,
`BestBuys`) — three tools across two categories hand-roll the identical "find 1, then scale"
reasoning with no link, the clearest cross-category signal found so far. A new skill is proposed —
`convert-fraction-ratio` — since `FractionToRatio`'s named technique row has no matching skill row at
all, breaking the technique↔skill pairing pattern that holds everywhere else. Two research agents also
independently found that documentation claims didn't hold up against source: `CLAUDE.md`'s reference-
implementations table doesn't actually name `FractionToRatio.tsx` (despite this doc's own Part 2
methodology text citing it as a quality-bar reference), and doesn't describe `RatioSharingTool.tsx` as
a "multi-group multiSelect" example (it's single-group throughout, unlike `SolvingLinearEquations.tsx`/
`CollectingLikeTerms.tsx`, which do use that pattern) — recorded here as findings, not corrected, since
this pass is findings-only. *(The `FractionToRatio.tsx` citation gap is now fixed — see the
`FractionToRatio` entry's Notes below. The `RatioSharingTool.tsx` "multi-group multiSelect" claim was
never actually a `CLAUDE.md` error — that row was already correct, pointing to a grep search rather
than a named file — so no doc fix was needed there.)*

### Dividing Ratios — `src/tools/Proportion/RatioSharingTool.tsx`
Route: `/ratio-sharing` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import; hand-built bar-model/numerical-method steps.
  `PROJECTS.md`'s `shareInRatio` row (**high**, ⬜) is an exact match, and this tool is the primary —
  arguably sole — real demand signal for it in the category (`RecipesTool` scales, it doesn't share).
- Skills: No markers. This tool **is** `share-in-ratio`'s (bar model, exists, **high**, ⬜) target
  domain, not an unlinked-prerequisite gap. One structural note: every ratio is pre-guaranteed
  coprime, so the tool never asks a student to simplify first — it doesn't implicitly consume
  `simplify-ratio` either.
- Representations: **Bar model** already implemented — uniquely so in the category — but as a bespoke
  component (`BarRow`), not built on the shared `split`/`combine`/`equivalents` scene family. A real,
  working visual, but a parallel one-off rather than the shared vocabulary — the thing to generalise
  from if a Teach deck gets built here.
- Teach deck: Strong, ready-made candidate — the tool's three question types (sharing / known amount
  / given difference) already form a natural I-do/We-do/You-do arc on one running ratio. Blocked on
  porting the bespoke bar model into the shared scene system first.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Four sub-tools (sharing / known / difference / mixed) is
  genuinely good breadth. Two real gaps: every ratio in every sub-tool is exactly **two-part** — a
  3-person ratio-sharing question (a common GCSE shape, and one the tool's own page title implies)
  never appears; and every question is money-in-£, no non-monetary context anywhere.
- QO richness: Real control — a multiSelect plus a numerical-method toggle per sub-tool, correctly and
  transparently disabled at Level 3 (matching the info modal's own disclosure rather than silently
  overriding it) — a genuinely good transparency practice not universal in this audit.
- Level progression: Weaker than the QO/breadth axis — almost entirely numeric-range escalation, not a
  structural shape change. The one genuine qualitative shift is L3 forcing the numerical method and
  losing the bar model entirely — the same "the tool's own best pedagogical asset disappears exactly
  when the maths gets hardest" pattern flagged for `PowersOfTen`, here disclosed but not softened by
  the disclosure.
- Working-step depth: The bar-model working is rich and correctly narrates each stage, confirmed
  rendered in both Whiteboard and Worked Example — a genuine strength. But every numerical-method
  `mStep` is a single whole-string latex; zero fragment arrays anywhere, despite several lines being
  textbook 2–3-fragment candidates.
- Conventions/anomaly scan: `stepRenderer` (**Justified** — the only way to render the bar model). No
  `questionRenderer` (**Justified**, correct absence — only the working needs a diagram).
  `defaults={{ displayFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 2 }}` —
  `numQuestions: 5` matches the category norm; `displayFontSize: 1` undocumented (**Unclear**);
  `maxColumns: 2` is the tightest cap of any Proportion tool with a `defaults` block, no comment
  explaining the halving versus siblings with similarly-worded content (**Unclear, leaning Debt**).
- UI/visual consistency: Not checked live. From source: the heaviest hardcoded-hex usage found in the
  audit so far (8+ distinct tokens). `colorScheme` is correctly threaded through the bar fill colours
  — a genuine positive — but borders and all diagram text stay fixed regardless of scheme, a partial
  inconsistency rather than full colour-scheme support.
- **Recommended status:** Live but flagged for expansion — the strongest Ratio & Proportion tool on
  infrastructure (the only one with a working, non-dev-gated visual model) and on QO/breadth, but the
  two-part-only ratio limit is a real spec-coverage gap for a tool literally about dividing into
  ratios, and the L3 bar-model loss repeats a pattern already flagged elsewhere. (current: Live)

**Notes:** Two documentation claims checked against source didn't fully hold up (see category
summary) — worth a caution for future sessions taking "reference file" claims at face value rather
than a criticism of this tool itself, which is genuinely solid.

### Simplifying Ratios — `src/tools/Proportion/SimplifyingRatiosTool.tsx`
Route: `/simplifying-ratios` · Current status: Dev-gated (enabled: false)

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `simplifyRatio` row (med, ⬜) matches the
  numeric sub-tool exactly; the algebraic sub-tool is genuinely broader than the row's current spec
  (it also cancels shared variables and variable powers, not just numeric factors) — worth folding
  into the eventual build brief. This tool is the clear primary demand signal for the row.
- Skills: No markers. This tool **is** `simplify-ratio`'s (bar model, exists, med, ⬜) target domain,
  same pattern as its sibling. One soft, optional candidate: the algebraic sub-tool's variable-power
  cancellation touches index-law reasoning with no named row anywhere — flagged as a minor possible
  new skill, not a confirmed gap.
- Representations: **Bar model** — a cheap gap (existing scene, no new work), but unlike its sibling
  `RatioSharingTool` this tool has **zero** visual representation anywhere — no `questionRenderer`/
  `stepRenderer`/`answerRenderer` at all, pure KaTeX/text throughout.
- Teach deck: Plausible but less dramatic than its sibling — no natural misconception "trap." A
  workable I-do/We-do/You-do arc exists on the repeated-division working the numeric sub-tool already
  performs, a reasonable second-tier candidate, not urgent.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Two sub-tools. Numeric shifts from 2-part to 3-part at L3 — a
  real shape change. Algebraic varies genuinely across three factor-type shapes and their
  combinations — closer to full coverage of "what counts as an algebraic ratio to simplify" than a
  rigid template. Consistent gap: no worded/contextual question anywhere in either sub-tool.
- QO richness: **Zero.** No `multiSelect`, no `variables`, no per-level QO override at all in either
  sub-tool — the flattest QO profile found anywhere in this audit so far, across all three categories.
  A teacher gets no control beyond level and sub-tool tab — the methodology's own "fixed generator, no
  options" under-developed signal applies directly and unambiguously.
- Level progression: Uneven between sub-tools. Numeric L1→L2 is pure number-range scaling, L2→L3 is
  the one real structural jump (2-part → 3-part). Algebraic is genuinely structural at every step —
  on par with some of the better Algebra-category progressions, clearly ahead of its own numeric
  sibling.
- Working-step depth: Split findings. The algebraic sub-tool uses `mStep` with proper prose labels —
  good discipline. The numeric sub-tool deviates from the "pick `mStep` by default" convention
  entirely — every step is a bare, unlabelled `step()` line with nothing narrating why a given prime
  was chosen. Both sub-tools carry zero fragment arrays anywhere.
- Conventions/anomaly scan: One grep hit, mostly no-op restatements of the ToolShell baseline
  (**Justified, no-op**); `numQuestions: 5` matches the category norm. Everything else correctly
  absent for a pure KaTeX/text tool — a clean baseline.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, no bespoke JSX —
  the cleanest possible source-level signal, consistent with `CLAUDE.md` naming this file as the
  architectural reference for ratio simplification. The caveat: "native" here also means visually
  bare — nothing to look at beyond KaTeX text, unlike its sibling.
- **Recommended status:** **Not ready to graduate as-is — recommend staying gated pending expansion**,
  judged blind to its current status per the methodology's own test. The maths is sound and, on
  level-progression structure and source cleanliness, this tool is genuinely ahead of several tools
  already live elsewhere in the audit. But it fails the standalone-readiness bar on the two axes a
  teacher would notice fastest: it is the **only** tool in the entire audit so far with literally zero
  QO control of any kind, and zero visual representation for a topic whose designated representation
  already has a built, reusable scene family — while its immediate sibling in the same landing-page
  section ships live with both. Minimum bar to graduate: at least one multiSelect/variable and hooking
  up the bar model before flipping `enabled`. (current: Dev-gated)

**Notes:** One structural inconsistency outside Part 1/2 proper: unlike every other retry loop in
either sibling file (all bounded, ~100–200 attempts with a hardcoded fallback), one internal coprime-
pair helper retries via an unbounded `while` loop with no attempt cap — very unlikely to hang given
the small integer ranges involved, but worth a look if this pattern is ever copied elsewhere.

### Recipes — `src/tools/Proportion/RecipesTool.tsx`
Route: `/recipes` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `scaleRecipe` row (low, ⬜) accurately
  matches the Linear Scaling sub-tool's core move, but does **not** describe the Constraints
  sub-tool's move at all — that sub-tool's actual mechanic is "find each ingredient's per-serving
  rate, divide stock by it, take the minimum," a rate-then-bottleneck move structurally closer to a
  min-of-several-unit-rates comparison than "scale by a factor." The row's description should gain a
  second bullet or a sibling row (e.g. `limitingIngredient`) rather than being assumed to cover both.
- Skills: No markers. Two clean, unlinked candidates: the HCF-based L2 scaling step names the
  already-built `hcf` skill (prime tiles, **high**, ⬜) — a direct parallel to `SimultaneousEquations`'
  unlinked LCM finding from the Algebra pass; and the L3 "find for 1 unit" step is literally the
  `unitary-method` skill (bar model exists, med, ⬜) — a second, currently-unconsumed demand signal
  for that skill.
- Representations: **Bar model** fits Linear Scaling cleanly and cheaply (the existing `split`/
  `equivalents` scenes generalise almost directly). Constraints is a weaker fit — its bottleneck logic
  could plausibly be shown as parallel bars, but this isn't a scene that exists today.
- Teach deck: Reasonably strong candidate for Linear Scaling specifically — I-do/We-do/You-do on one
  running recipe, and unusually cheap since it could reuse already-built bar-model scenes rather than
  needing new scene work.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Only **two** sub-tools (linearScaling / constraints) — worth
  correcting against the assumption that an ~870-line file implies several: roughly 240 of those lines
  are a bespoke PDF print handler, not question variety. Each sub-tool is internally well-structured,
  but no question ever asks the reverse direction (given a scaled recipe, find the original), and no
  crossover with cost (a natural bridge to `BestBuys`) is attempted.
- QO richness: Uneven. `linearScaling` has one variable and one multiSelect, `difficultySettings: null`
  — identical QO at all three levels, the same "flat across levels" pattern flagged elsewhere in this
  audit. `constraints` is better-differentiated, and its L3 deliberately drops a toggle that would be
  a no-op at that level (**Justified**, not an oversight — checked against the generator logic).
- Level progression: Genuinely structural in both sub-tools. `linearScaling`: whole-number multiplier
  → HCF-based scale factor → coprime base/target requiring the unitary method, a clean three-method
  escalation matching its own info text exactly. `constraints`: single/3-ingredient/1-limiting →
  multi/4-ingredient/2-limiting → multi/4-ingredient/all-limiting — a real complexity increase.
- Working-step depth: A specific, checkable gap relative to this category's own reference tools.
  Every working line uses bare `step()` — zero `mStep()`, zero `tStep()` — so no line anywhere carries
  a prose label, a direct contrast with `RatioSharingTool`/`FractionToRatio`, which label essentially
  every step. The Constraints sub-tool also invents a bespoke multi-line working shape rendered via a
  custom `stepRenderer` rather than using the documented `extra` field on `WorkingStep` — functionally
  fine, but sidesteps the one extension point named for exactly this case, and the CI smoke test's
  per-fragment KaTeX validation can't see inside it the way it validates `step()`'s `frags`.
- Conventions/anomaly scan: `questionRenderer`/`stepRenderer` (**Justified** in need, `stepRenderer`
  **Unclear** in implementation per the `extra`-field point above). `customPrintHandler` (**Justified**
  that one is needed — the shared text path can't render a table — but it reimplements a full
  pagination engine from scratch rather than adapting the shared `computeWorksheetLayout` engine SVG
  tools get for free, **Unclear-to-Debt**, worth a look if table-shaped questions recur elsewhere).
  `numQuestions: 9` — undocumented, well below the 15 baseline (**Unclear**).
- UI/visual consistency: Not checked live. From source: the table's cell background correctly reacts
  to colour scheme, but the text colour is hardcoded black throughout — an asymmetry, changing scheme
  visibly changes shading but not ink colour.
- **Recommended status:** Live but flagged for expansion — two well-structured, genuinely
  level-progressive sub-tools undercut by a working-step depth gap that's unusually easy to point at
  (zero labelled steps in a category where the reference tools label nearly every step), a
  narrower-than-it-looks sub-tool count, and a non-standard `WorkingStep` extension pattern. Nothing
  argues for gating. (current: Live)

**Notes:** The `scaleRecipe` row needs a decision, not just a status flip: either broaden its
description to cover the Constraints move, or add a second row — as written it only names half of
what this tool does.

### Converting Fractions and Ratios — `src/tools/Proportion/FractionToRatio.tsx`
Route: `/fraction-to-ratio` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `convertFractionRatio` row (med, ⬜)
  matches the `fractionToRatio`/`ratioToFraction` sub-tools' core move. A second row also applies:
  `simplifyRatio` (med, ⬜) is a verbatim match for `formingRatios`' simplification helpers, which
  prime-factor-divide down to simplest form exactly as that row describes — this tool is relevant to
  two rows, only one currently cross-referenced.
- Skills: No markers. Two unlinked candidates: the L2 common-denominator path computes and labels an
  "LCD:" step — the already-built (✅) `lcm` skill, unmarked, the same "unlinked consumer" pattern
  flagged for `SimultaneousEquations` in the Algebra pass; and `formingRatios`' simplification steps
  directly match the existing `simplify-ratio` row. Bigger-picture gap: **no `convert-fraction-ratio`
  skill row exists at all** — only the technique row — breaking the technique↔skill pairing pattern
  used everywhere else. **New skill proposed:** `convert-fraction-ratio`, bar model (existing scenes —
  cheap), since this tool's core move is a clean, self-contained, bar-model-friendly idea exactly like
  the paired rows elsewhere.
- Representations: **Bar model** — designated representation, existing scenes, a cheap gap. The
  tool's own arithmetic already does the bar-model computation implicitly. Currently zero visual
  representation anywhere.
- Teach deck: Strong, unusually cheap candidate — needs no new scene family (`split`/`equivalents`
  already suit fraction-of-a-whole content, the same scenes `FractionsAddSub`'s deck uses), one of the
  cheapest unbuilt deck candidates found in the audit so far.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools, each with a genuinely distinct three-level
  progression — 9 structurally different question shapes total, every question worded with real
  context — strong spec coverage, on par with `FractionsAddSub`/`Percentages`. One gap: no algebraic-
  form ratio/fraction question, no combined question crossing both conversion directions in one item.
- QO richness: Uneven, and the unevenness is itself a finding. `fractionToRatio`/`ratioToFraction` use
  genuine per-level `difficultySettings`. `formingRatios` — plausibly the tool's highest-traffic
  sub-tool — has `dropdown: null, difficultySettings: null`: its two toggles are flat, identical at
  every level, zero QO differentiation, unlike its two siblings in the same file.
- Level progression: Very strong — every sub-tool restructures method at each level, not just numbers.
  `ratioToFraction`'s L3 "part-to-part, not part-to-whole" framing is a genuine, well-flagged
  misconception zone. One of the stronger showings in the audit so far.
- Working-step depth: A real, concrete gap, notable precisely because of this tool's claimed
  reference status. Every `mStep` call passes a single pre-joined string — zero genuine fragment-array
  usage anywhere — the same specific gap the audit found in `CompletingTheSquare.tsx` itself,
  reinforcing that "reference implementation" status in this repo has so far tracked shell-wiring, not
  fragment-authoring maturity.
- Conventions/anomaly scan: `displayFontSize`/`worksheetFontSize`/`maxColumns` overrides are no-ops
  restating the baseline (**Justified, no-op**). `numQuestions: 5` and `numColumns: 2` are genuine,
  undocumented reductions — `numQuestions: 5` is the lowest value seen across the entire audit so far
  (previous low was `CompletingTheSquare`'s 6) — **Unclear**.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, zero inline
  styles — the cleanest possible source-level signal.
- **Recommended status:** Stay live as-is on Part 2 fundamentals — genuinely strong breadth,
  worded-context coverage, and level progression, on par with the Number category's strongest tools.
  But `formingRatios`' flat QO and the fragment-array gap should be visible in the record, since they
  undercut the tool's claimed reference-implementation billing exactly the way it undercut
  `CompletingTheSquare.tsx`'s. Neither is gating-severity. (current: Live)

**Notes:** The most actionable finding here is the missing `convert-fraction-ratio` skill row — the
only tool audited so far whose named technique row has no matching skill row at all. It's also cheap
to fill in: bar model, existing scenes, no new representation work. Separately, a documentation-drift
finding: `CLAUDE.md`'s reference-implementations table doesn't actually name this file, despite this
audit doc's own Part 2 methodology text citing it as a quality-bar reference (see category summary).
*(Fixed in a post-audit verification pass — this doc's own methodology text at "Part 2 — Standalone
readiness" no longer misattributes the citation to `CLAUDE.md`.)*

### Fractions of Amounts — `src/tools/Proportion/FractionsOfAmounts.tsx`
Route: `/fractions-of-amounts` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s Number-section `fractionOfAmount` row
  (**high**, ⬜) is a verbatim match for this tool's core move — every sub-tool's working repeats the
  identical "find the value of one part, then multiply by the numerator" pattern. That row currently
  has no "needed by" annotation — this tool is the direct, obvious, highest-frequency demand signal
  for it and should be named there.
- Skills: No markers. Two clear candidates, both already existing high-priority rows: `fraction-of-
  amount` (**high**, bar model exists, ⬜) — this tool's `findFraction` sub-tool and the opening moves
  of its other two sub-tools **are** this skill's target domain, the same "tool IS the primitive"
  pattern found for `IntegerAddSub`; and `simplify-fraction`/`hcf` — `asFraction` explicitly computes
  and labels an HCF step in five separate places, never linked to either row (a third consumer for
  `simplify-fraction`, the first-ever named consumer for `hcf`).
- Representations: **Bar model** — designated representation, existing scenes, a cheap gap, and a
  closer, more direct fit than almost any other tool audited so far, since the working steps already
  narrate exactly what the bar model would show (divide into equal strips, shade some). Currently
  zero visual representation anywhere.
- Teach deck: Strong, cheap candidate for the same reason as `FractionToRatio` — no new scene needed,
  and `findFraction`'s clean two-step method is an ideal running example. The two tools would share
  the same bar-model scene work if built together.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools with strong, complementary coverage —
  `findFraction` (escalating unit → non-unit → fractional-answer), `worded` (contextual, including a
  unit-conversion dimension unique to this tool in the category, plus genuine two-step L3 chains), and
  `asFraction` (the inverse skill, including its own one-step/two-step L3 split). Together they cover
  both directions of the topic plus a worded/contextual layer most single-direction tools lack. Real
  gap: no mixed-number fraction operand anywhere, and despite the tool's own name and its designated
  representation, no visual representation of any kind.
- QO richness: Strong and the most differentiated tool in this category pass — `dropdown`/`variables`/
  `difficultySettings` used extensively and genuinely per-level in all three sub-tools. No sub-tool
  here has the flat/undifferentiated QO gap `FractionToRatio`'s `formingRatios` sub-tool showed.
- Level progression: Genuinely structural across all three sub-tools — `findFraction`'s L3 changes the
  answer type itself, `worded`'s L2 introduces a real unit-conversion prerequisite and L3 genuine
  two-stage chains, `asFraction`'s L3 splits into 1-step/2-step variants. On par with the strongest
  level-progression tools found in the Number/Algebra passes.
- Working-step depth: **The strongest single finding in this pass.** 52 genuine fragment-array uses
  across the file — every "find one part / multiply by numerator" pair, every unit-conversion step,
  every multi-stage worded chain uses the `string[]` fragment convention, matching or exceeding
  `FractionsAddSub`'s billing as the category's fragment-authoring model. `tStep` is also used
  correctly for pure-reasoning lines, keeping computed and stated-fact steps architecturally distinct.
- Conventions/anomaly scan: Zero matches on the full override grep — the file doesn't even pass a
  `defaults` prop, running on the full shared baseline. Fully vanilla, the cleanest possible
  anomaly-scan result.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, zero inline
  styles — should be visually native to the shell by construction.
- **Recommended status:** Stay live as-is — the stronger of the two tools audited alongside it on
  Part 2, arguably close to reference quality for the category (strong worded/unit-conversion breadth,
  best-in-category QO differentiation, best working-step fragment density seen since
  `FractionsAddSub`/`Percentages`). The only content-shaped gap worth flagging is the complete absence
  of the bar-model visual its own designated representation names directly. (current: Live)

**Notes:** Five separate rejection-sampling loops exist in this file, each with a hardcoded literal
fallback question if exhausted — the same pattern the Algebra pass flagged for `NonLinearSimEq`'s
fallback, not confirmed to trigger but worth a follow-up check given how many constrained-generation
branches this file has. Also worth naming as a positive: the money helpers split KaTeX-safe from
plain-text currency exactly like `Percentages.tsx`'s `gbp()` helper the Number pass called out as a
positive quality signal — this tool follows the same convention correctly throughout.

### Best Buys — `src/tools/Proportion/BestBuys.tsx`
Route: `/best-buys` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `unitPriceCompare` row (low, ⬜) accurately
  matches the Unit Cost sub-tool's core move, but undersells Special Offers, whose real move is
  "resolve a deal structure into an effective total quantity/price first, then compare" — a compound
  move one reasoning stage ahead of plain unit-price comparison. Same shape of finding as
  `RecipesTool`'s `scaleRecipe` gap — worth extending the row's description rather than assuming one
  technique covers both sub-tools as-is.
- Skills: No markers. The entire tool is built on the **unitary method** — named explicitly in-UI via
  a "Force unitary method" toggle — a direct, on-the-nose consumer of the `unitary-method` skill (bar
  model exists, med, ⬜), now a **third** tool across two categories (`Percentages`, `RecipesTool`,
  `BestBuys`) found to hand-roll this exact reasoning unlinked — the clearest cross-category demand
  signal for that skill's priority found so far. Special Offers' percentage-discount branches also
  name an unlinked percentage-of-amount move.
- Representations: **Bar model** fits Unit Cost cleanly and cheaply — splitting two packs into
  equal-sized "per unit" strips to compare heights is close to a direct reuse of the existing `split`
  scene family. Special Offers is a looser fit, needing the same bar-model-plus-percentage combination
  flagged as missing in the `Percentages` audit entry.
- Teach deck: Strong, on-the-nose candidate — "compare the totals, not the unit prices" is a
  well-known GCSE error, and Special Offers' L3 case (forcing two different calculation routes) is a
  ready-made Spot the Mistake beat, structurally similar to the reverse-percentages candidate flagged
  for `Percentages`.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Two sub-tools (`unitCost`, `specialOffers`) covering both halves
  of the GCSE spec, each with real internal variety by product/deal type rather than one reused
  template. Gap: no question ever asks for the actual best-value amount saved or unit price itself —
  every answer is a comparison verdict, a narrower answer-shape range than most audited tools.
- QO richness: Sharply uneven, the most extreme split-personality result found in the category.
  `unitCost` is genuinely strong and level-aware — L1 has zero controls, matching the `CompletingTheSquare`
  reference pattern of QO complexity scaling with maths complexity, then L2/L3 add real controls.
  `specialOffers`, by contrast, has **zero QO options at all, at every level** — a fully fixed
  generator, the same "zero-control" pattern flagged for `Iterations`' `verification` sub-tool.
- Level progression: Strong and structural in both sub-tools — `unitCost` escalates count-based →
  metric-with-conversion → deliberately-close-unit-prices; `specialOffers` escalates multi-buy/
  multipack → percentage-discount/bulk → mixed offer types requiring two calculation routes in one
  question — one of the cleaner three-level escalations seen in this audit.
- Working-step depth: Deliberately, consistently flat — every working line is `tStep()` (correctly
  citing the documented £-inside-KaTeX gotcha up front), so the tool is structurally incapable of the
  fragment-reveal convention, not a thin-authoring problem the way `Estimation`'s single-string
  `mStep`s were. Content-wise the chains are thorough — deeper step-count than most tools audited so
  far, just architecturally flat.
- Conventions/anomaly scan: Zero matches on the full override grep — fully vanilla, the cleanest
  possible baseline. Worth noting as a design point: the unitary/conversions toggles are exactly the
  kind of pure-display QO `reformatQuestion` exists for, but neither is implemented — toggling
  regenerates an entirely fresh question rather than reformatting in place, a legitimate default but a
  missed opportunity given how naturally these toggles fit the pattern.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours anywhere — the
  cleanest possible source-level signal in this pass.
- **Recommended status:** Live but flagged for expansion — `unitCost` is one of the stronger-designed
  single sub-tools read in this audit (clean level-aware QO, genuine structural progression, thorough
  working), but `specialOffers` sitting at zero QO options across all three levels is a concrete gap
  directly comparable to `Iterations`' weak point, and both sub-tools share the category-wide absence
  of technique/skill hookups. Nothing argues for gating. (current: Live)

**Notes:** The `unitPriceCompare` row has the same "covers one sub-tool cleanly, undersells the other"
shape flagged for `RecipesTool`'s `scaleRecipe` row — worth resolving both the same way when these
findings get folded back into the technique table.

### Geometry — ✅ complete
- [x] Properties of Circles (`CircleProperties.tsx`)
- [x] Basic Angle Facts (`BasicAngleFacts.tsx`)
- [x] Angles In Triangles (`AnglesInTriangles.tsx`)
- [x] Angles in Parallel Lines (`AnglesInParallelLines.tsx`)
- [x] Angles In Quadrilaterals (`AnglesInQuadrilaterals.tsx`)
- [x] Bearings (`Bearings.tsx`)
- [x] Properties of Line Equations (`EquationsOfLines.tsx`)
- [x] Perimeter (`PerimeterTool.tsx`)

**Category summary.** Geometry is architecturally different from the first three categories — all
but one tool (`EquationsOfLines`) are SVG diagram tools, so the audit's usual "fragment-array
working steps" finding shows up here as something sharper: six of the eight tools
(`BasicAngleFacts`, `AnglesInTriangles`, `AnglesInQuadrilaterals`, `AnglesInParallelLines`,
`Bearings`, `PerimeterTool`) build every working line through `tStep()` only — plain `\text{...}`
prose, never real KaTeX math mode — which makes them **structurally incapable** of the
`string[]` fragment convention, not just thin authors of it. Only `CircleProperties.tsx` and
`EquationsOfLines.tsx` use real `mStep`/`step` with computed KaTeX. This is a category-wide
convention, confirmed independently by three separate research agents, not a per-tool defect —
worth surfacing as a single standing finding rather than six repeated ones. A second category-wide
split: only 4 of the 8 tools (`AnglesInTriangles`, `Bearings`, `PerimeterTool`,
`AnglesInQuadrilaterals`) use the shared `handleDiagramPrint`; the other 4
(`AnglesInParallelLines`, `BasicAngleFacts`, `CircleProperties`) hand-roll a fixed-grid
`customPrintHandler` that directly contradicts `CLAUDE.md`'s explicit instruction not to do
that — notably, **two of the three are the very files `CLAUDE.md` itself names as the SVG/renderer
reference implementations** (`AnglesInParallelLines.tsx`, `BasicAngleFacts.tsx`), while
`AnglesInQuadrilaterals.tsx` (correctly named as the `handleDiagramPrint` reference specifically)
is the one that gets it right. Two of the three hand-rolled handlers have confirmed functional bugs,
not just missing flexibility: `BasicAngleFacts`' handler silently drops section headers on
Advanced/differentiated worksheets, and `CircleProperties`' handler doesn't accept the `ctx`
parameter at all, so clicking "Differentiated" and printing produces the identical flat, undifferentiated
sheet with no error or indication anything went wrong. None of the six core representations map onto
an angle/circle/polygon diagram — this repeats across every tool in the category independently and
is recorded once here as a standing open question, the same treatment given to `PowersOfTen`'s
place-value grid and `Iterations`' cobweb diagram in earlier passes: the diagram itself appears to
function as its own representation, outside the six-representation vocabulary. `PROJECTS.md`'s
skills table has **zero Geometry rows** — a category-wide gap none of the prior three categories
had; two new skills are proposed here (`apply-angle-fact`, `unit-conversion`) to seed it. A new
technique is also proposed (`sumPerimeter`/`deriveMissingSide`) since `PerimeterTool`'s core move
has no match among the three existing Geometry technique rows. `PerimeterTool` — explicitly named
in this doc's own intro as the example of why a live `enabled` flag can't be trusted as a quality
signal — turns out to confirm exactly that prediction: its ToolShell/`handleDiagramPrint` migration
is genuinely well-engineered (better than `CircleProperties`' print path, in fact), but its content
is the thinnest on QO richness of the whole category (zero `multiSelect`/`dropdown` anywhere,
teacher-facing controls at only 2 of 6 level×sub-tool combinations) — shell-verified, content
unreviewed until now, precisely as predicted. `EquationsOfLines` turns out not to be a diagram tool
at all despite its category (zero SVG, pure KaTeX) — confirming `PROJECTS.md`'s SmartGrapher gap for
it is still fully unaddressed, the tool's single highest-leverage fix.

### Angles In Quadrilaterals — `src/tools/Geometry/AnglesInQuadrilaterals.tsx`
Route: `/angles-in-quadrilaterals` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `applyAngleFact` row (**high**, ⬜) is an
  exact match and this tool is by far the richest demand signal for it in the category — every
  branch states the applied fact as its own first working line ("Angles in a quadrilateral sum to
  360°", "Opposite angles in a {shape} are equal", etc.), directly confirming the row's own
  parenthetical, "the reasoning IS the move."
- Skills: No markers, and — worth flagging on its own — **`PROJECTS.md`'s skills table has zero
  Geometry rows at all**. This tool is the clearest candidate to seed one: **new skill proposed**,
  `apply-angle-fact` (drill-down for "which angle rule applies here"), pairing with the
  `applyAngleFact` technique row the same way every other row is paired elsewhere in the table.
  Separately, the algebra-form questions (`x`, `x+a`, `ax`, `ax+b`) are a genuine second, unlinked
  consumer of the already-built `solve-linear-equation` skill (**high**, ⬜, currently named only
  for `SolvingLinearEquations`).
- Representations: None of the six fit — same open-question status raised for the whole category.
- Teach deck: Structurally plausible (each level's find-type taxonomy is already an
  I-do/We-do/You-do-shaped case set), but more expensive than most decks logged so far — nothing in
  the built `TeachBlock`/`TeachScene` types can render an angle diagram, so this needs a genuinely
  new scene type, not a reuse.
- SmartGrapher: No fit, correctly absent.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: One sub-tool on paper, but internally spans three structurally
  distinct shape families across levels (general convex quadrilateral / kite & arrowhead /
  parallelogram-rhombus-trapezium with parallel-line reasoning) plus an optional exterior-angle
  overlay and four algebraic-expression forms — genuinely close to full GCSE spec coverage,
  including the arrowhead reflex-angle case. Real gap: no worded/contextual framing anywhere.
- QO richness: **The strongest QO differentiation seen in the whole audit so far** — real per-level
  `difficultySettings` with 2, 3, and 4 multiSelect groups at levels 1/2/3 respectively, plus a
  level-2-only variable, QO complexity scaling with mathematical complexity beyond even the
  `CompletingTheSquare` reference pattern.
- Level progression: Genuinely structural, one of the best in the audit — three materially
  different rule sets across levels, not a numbers-get-bigger progression.
- Working-step depth: A real, specific gap, worth stating plainly since this is the named reference
  file. Every line is a plain `{ text: string }` converted via `tStep()` — no line ever renders
  through real KaTeX math mode, and (since `tStep` takes a single string) zero fragment arrays
  anywhere. This is the category-wide pattern (see category summary), not unique to this file — but
  the category's own `CircleProperties.tsx` already demonstrates the alternative is achievable, so
  the gap is checkable and fixable in-category.
- Conventions/anomaly scan: `questionRenderer` (**Justified**). `customPrintHandler={handleDiagramPrint}`
  **directly verified** — imported and passed through unmodified, exactly matching `CLAUDE.md`'s own
  code sample. Worth flagging as a category finding: this makes it one of only 4 of 8 Geometry tools
  that actually follow the documented pattern — and the two files `CLAUDE.md` names for SVG
  conventions specifically (`AnglesInParallelLines`, `BasicAngleFacts`) are exactly the ones that
  don't. `defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true }}` — **Justified**, the
  least restrictive column policy of any diagram tool in the category, appropriate for a squarish
  diagram.
- UI/visual consistency: Not checked live. From source: 15 hardcoded hex colours, all confined to
  the SVG, in line with siblings — not an outlier. `colorScheme` received as `_cs` and never used —
  every diagram colour is fixed regardless of light/dark scheme, a plausible, checkable gap.
- **Recommended status:** Stay live as-is — on breadth, QO richness and level-progression structure
  this is arguably the strongest tool audited in the whole pass, and it correctly earns its billing
  as the shared-print reference (verified directly, more rigorously followed than either of the two
  files `CLAUDE.md` names for SVG conventions). The honest caveat, precisely because this is the
  flagship reference file: its working-step authoring sits below what this same category's
  `CircleProperties.tsx` already demonstrates is achievable — a genuine, fixable Part 2 gap, not a
  Part 1 infrastructure gap. (current: Live)

**Notes:** The `applyAngleFact`/"the reasoning IS the move" framing holds up well against this
file's actual generator code — the gap isn't that the reasoning is missing, it's that it's currently
authored as un-typeset prose (`tStep`) rather than properly fragmented KaTeX (`mStep`/`step`), a
presentation-layer fix, not a content rewrite.

### Basic Angle Facts — `src/tools/Geometry/BasicAngleFacts.tsx`
Route: `/basic-angle-facts` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `applyAngleFact` row is an exact,
  on-the-nose match — this tool doesn't consume the technique, it **is** the technique's primary
  demand signal across all five sub-tools (right angle, straight line, around a point, vertically
  opposite, mixed).
- Skills: No markers. One concrete, previously-unnoted cross-category link site: the Level 3
  algebraic sub-tools reduce every question to a one- or two-step linear equation in x — literally
  the domain of the existing `solve-linear-equation` skill (**high**, no tile scene yet, ⬜),
  previously named only for `SolvingLinearEquations`. This tool is a second, currently-unlinked
  consumer, worth adding to its row.
- Representations: None of the six fit — same category-wide open question.
- Teach deck: Plausible candidate — Vertically Opposite's own two Level 1 variants (Matching →
  Calculation) already form a natural I-do/We-do arc. Blocked on the same missing-representation
  gap as the whole category.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Five sub-tools, each with three structurally distinct per-level
  generator functions plus an orthogonal algebraic-expression axis multiplying the shape count
  further — one of the broadest raw generator surfaces seen in the audit so far, genuinely covering
  the GCSE spec's four core angle facts. No worded/contextual framing anywhere, a fair gap for this
  topic (unlike similar Number/Ratio gaps), so lower-priority than elsewhere.
- QO richness: Strong overall, genuine per-level `difficultySettings` on most sub-tools. One real,
  unexplained asymmetry: Vertically Opposite never exposes the decimals toggle its three sibling
  sub-tools all support — VO angles are integer-only at every level with no comment explaining the
  omission (**Unclear**).
- Level progression: Genuinely structural across all five sub-tools, not number-scaling. Vertically
  Opposite's progression is particularly good — a genuine method change at every step, on par with
  the audit's best-in-class level designs.
- Working-step depth: **The flattest working-step architecture found in the audit so far.** Every
  line across all five sub-tools is built via `tStep()` only — confirmed zero `mStep`/`step` calls
  anywhere. Per `CLAUDE.md`'s own KaTeX rules, `tStep` is meant for genuinely numberless prose, but
  here it's used for real equations (`"3x = 60°"`) that render as literal escaped text, never true
  KaTeX. Every other "flat" tool audited so far had at least used single-string `mStep`/`step`
  (upgradable to fragments later) — this tool's own step type makes that upgrade impossible without
  a rewrite.
- Conventions/anomaly scan: `questionRenderer` (**Justified**). `customPrintHandler` (hand-rolled,
  fixed 3×5 grid) — **Debt.** `CLAUDE.md`'s own diagram-tools section explicitly instructs against
  exactly this pattern. Worse: the handler's Advanced/sectioned path silently falls through to the
  flat layout with no section-header/divider logic at all — an Advanced worksheet built with this
  tool silently loses its section grouping in the printed PDF, a real functional defect, not just a
  missing feature. `fixedColumns: true, numColumns: 3` pairs consistently with the hardcoded print
  grid but forecloses the density flexibility `handleDiagramPrint` gives for free — **Debt-leaning**,
  three category siblings expose `maxColumns` instead. `hideFontControls: true` — **Justified**.
  Also found outside the grep: the purely-cosmetic "Show right angle square symbol" toggle
  regenerates an entirely new question rather than reformatting in place — a missed
  `reformatQuestion` opportunity, the same pattern flagged for `BestBuys` in the Ratio & Proportion
  pass.
- UI/visual consistency: Not checked live. From source: **37 hardcoded hex colour occurrences
  across 19 distinct tokens** — the new high-water mark across every category audited so far,
  eclipsing `RatioSharingTool`'s previous "heaviest" callout. `colorScheme` received and unused,
  consistent with the repo-wide norm.
- **Recommended status:** Live but flagged for expansion — strong sub-tool/level-progression breadth
  and QO richness, undercut by the audit's flattest-yet working-step architecture, a print-path
  convention gap with a confirmed functional bug (dropped section headers), and the heaviest
  hex-colour usage found so far. Nothing here argues for gating. (current: Live)

**Notes:** Worth flagging for whoever next edits `CLAUDE.md`'s Diagram-tools section: this file is
named as the reference for SVG/renderer conventions, and correctly follows the SVG element
requirements (`viewBox`, no fixed pixel height, `data-q-index`), but a reader could reasonably
assume "reference implementation" also covers the print-handler pattern, which it explicitly does
not — the same "architectural reference ≠ full-stack reference" caution the Algebra pass raised for
`CompletingTheSquare.tsx`. *(Fixed in a post-audit verification pass — `CLAUDE.md` now carries an
explicit caveat on both this file's and `BasicAngleFacts.tsx`'s reference-implementation citations,
pointing print-handler seekers to `AnglesInQuadrilaterals.tsx` instead.)*

### Angles In Triangles — `src/tools/Geometry/AnglesInTriangles.tsx`
Route: `/angles-in-triangles` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import, confirming `PROJECTS.md`'s own "techniques wiring still
  to add on some" caveat for this migrated group literally, not just generically. `applyAngleFact`
  is an unusually exact match: this tool's sub-shapes hit *isosceles* (Level 2) and *exterior angle*
  (Level 3) by name, plus the basic 180°-sum case. Unlike `AnglesInParallelLines`, "the reasoning IS
  the move" genuinely holds here — see Working-step depth — making this tool arguably the single
  best demand signal for the row found in the audit so far.
- Skills: No markers. This tool is the primitive for the 180°-sum and isosceles facts. Level 3's
  exterior-angle sub-tool genuinely assumes "angles on a straight line sum to 180°" as an unre-taught
  prior fact — a real unlinked-prerequisite candidate for the new `apply-angle-fact` skill proposed
  above, which `AnglesInParallelLines`' straight-line rule and `BasicAngleFacts.tsx` are also natural
  teaching grounds for.
- Representations: Same category-wide open question.
- Teach deck: Plausible arc, needs a wholly new scene family, same blocker as its sibling.
- SmartGrapher: No fit, correctly absent.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, but one of the strongest internal structural
  varieties in the whole Geometry pass — L1 scalene with optional right angle, L2 isosceles
  apex-or-base-given, L3 splits into two genuinely different diagram families (an internal-cevian
  split triangle, and an exterior-angle/extended-side family with four distinct diagram shapes
  total). No worded/contextual framing — expected and not a gap for pure diagram geometry.
- QO richness: A per-level dropdown plus one repeated variable at every level, but **zero
  multiSelect anywhere** — a real, checkable gap relative to `AnglesInParallelLines`, which at least
  has one multiSelect group at Level 1. A teacher never gets a "which question types are active"
  pool control at any level here.
- Level progression: Genuinely one of the strongest in the whole audit — a real method/shape change
  every level, matching its own info text's description exactly. Comparable in quality to
  `Percentages`/`SimultaneousEquations`.
- Working-step depth: **The strongest working-step depth found in the Geometry category**, though
  still constrained to plain-text `tStep()` only (the category norm, not a tool-specific flaw).
  Crucially, unlike `AnglesInParallelLines`, the arithmetic is actually shown, not skipped — a
  genuine 5-step reveal of the real reasoning at L1, and L3 correctly sequences two separate named
  facts before landing on the answer. Correctly wired via the `tStep()` helper rather than raw
  objects — the opposite finding from its sibling.
- Conventions/anomaly scan: `questionRenderer` (**Justified**). `customPrintHandler={handleDiagramPrint}`
  — **Justified and exemplary**, matching `AnglesInQuadrilaterals.tsx` verbatim, in direct contrast
  to its sibling's hand-rolled grid. `defaults={{ numColumns: 3, maxColumns: 4, hideFontControls:
  true }}` — **Justified**, identical to the category's own established reference pattern. One
  additional positive: the SVG's `viewBox` is deliberately square-normalised around the fitted
  content specifically so `handleDiagramPrint` needs no per-question `_aspect` — a genuinely careful,
  print-path-aware design decision, called out explicitly in-file.
- UI/visual consistency: Not checked live. From source: 13 hardcoded hex occurrences, 10 distinct
  tokens — moderate, well below its sibling's 24 and below `RatioSharingTool`'s prior high-water
  mark. `colorScheme` received and unused — the repo-wide pattern.
- **Recommended status:** Stay live as-is — one of the stronger Part 2 performers in the Geometry
  category (genuinely structural level progression, the best-demonstrated working-step reasoning in
  the category, correct and exemplary use of the shared print path). The real gaps are Part 1 (no
  technique/skill hookup, despite being an unusually clean demand signal) and one concrete Part 2
  gap: zero multiSelect anywhere. (current: Live)

**Notes:** `PROJECTS.md`'s "techniques wiring still to add on some" caveat is confirmed literally
true for this specific tool — worth correcting the implicit assumption that "migrated" tracked
pedagogy maturity, the same way this doc's own intro already warns `enabled` does. This tool is also
the strongest available argument that "the reasoning IS the move" is an accurate description of a
diagram tool's working — its sibling `AnglesInParallelLines` is a weaker fit for the same
annotation, a useful contrast for whoever writes the technique's build brief.

### Angles in Parallel Lines — `src/tools/Geometry/AnglesInParallelLines.tsx`
Route: `/angles-in-parallel-lines` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `applyAngleFact` is the exact match, covering 3 of its 5
  named cases directly — but the row's own annotation, "the reasoning IS the move," only partly
  holds here (see Working-step depth): the working states the rule name and jumps straight to the
  final value with no shown arithmetic, unlike `AnglesInTriangles`' fuller demonstration — worth a
  caveat on the row when this finding is folded back in.
- Skills: No markers. This tool is the primitive, not a consumer, for its own rules; a future
  `apply-angle-fact` skill (proposed above) would naturally draw on its "straightLine" rule variants
  as a teaching ground.
- Representations: Same category-wide open question.
- Teach deck: Plausible I-do/We-do/You-do arc, needs an entirely new scene family — a
  second/third-tier candidate, not cheap.
- SmartGrapher: No fit, correctly absent.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Single sub-tool, but internally strong — all 5 standard GCSE
  parallel-line facts modelled, plus 4 canvas orientations for genuine spatial variety. No
  worded/contextual framing — a non-issue for this inherently diagrammatic topic.
- QO richness: One dropdown plus a 5-option multiSelect, but the multiSelect is **only active at
  Level 1** — plausibly justified (L2/L3 deliberately chain across all rule types by design) but
  undocumented in `INFO_SECTIONS`, unlike `RatioSharingTool`'s transparent L3 disclosure —
  **Unclear**.
- Level progression: Genuinely strong and structural — L1 single-step, L2 forced two-rule chain, L3
  a "hidden-link" mode requiring an intermediate unlabelled angle to be found first. L3 additionally
  exposes a "‹ Method N of M ›" browser letting a teacher cycle through every valid two-rule route
  between two angles when more than one exists — a genuinely novel, sophisticated feature not seen
  elsewhere in this audit, a real positive worth calling out, backed by deliberate generator rigor
  (blocking functionally-interchangeable rule pairs from chaining).
- Working-step depth: **The category's weakest working depth found so far, and a concrete standards
  deviation, not just thinness.** Every step is a raw `{ type: "tStep", ... }` object literal built
  directly in the generator — the file imports `tStep` but explicitly voids it as unused, bypassing
  the helper `CLAUDE.md` is explicit about ("Always create `WorkingStep` objects via the helpers...
  never construct raw objects"). Content-wise, each step states the rule name and the final value
  with **no shown arithmetic** — contrast directly with `AnglesInTriangles.tsx`, which for the same
  "sum to 180" fact walks the full four-line derivation. Same category, same tStep-only constraint,
  materially different depth.
- Conventions/anomaly scan: `questionRenderer`/`answerRenderer` (**Justified**). `customPrintHandler`
  is a **fully hand-rolled, fixed 3×5 grid** — **Debt**, directly contradicting `CLAUDE.md`'s
  explicit instruction, stated in the very section that names this exact file as the SVG/renderer
  reference. Concrete cost: bypassing `handleDiagramPrint` loses variable-column density, section
  support, and differentiated-layout scaling — this worksheet is permanently 15-per-page regardless
  of input. `fixedColumns: true` — **Debt-leaning** (consistent with the hand-rolled grid, but no
  sibling Geometry tool locks columns this way). `numQuestions: 9` doesn't match the print handler's
  own 15-per-page assumption — **Unclear**.
- UI/visual consistency: Not checked live. From source: **24 hardcoded hex-colour occurrences, 11
  distinct tokens** — the heaviest hex usage found in the audit until `BasicAngleFacts`' 37
  surpassed it in this same category. SVG element requirements are otherwise fully compliant
  (`viewBox`, no fixed pixel height, `preserveAspectRatio`, conditional `data-q-index`).
- **Recommended status:** Live but flagged for expansion — content coverage (5 rules, genuine
  3-level structural progression, the Method-browser feature) is strong enough that nothing argues
  for gating. But this is a case where "reference implementation" status is doing real work the file
  doesn't fully back up: the hand-rolled print path contradicts a documented rule this same file is
  cited to exemplify, and the raw-`WorkingStep` / thin-arithmetic working is a concrete quality gap
  a future tool built by copying this file would inherit. (current: Live)

**Notes:** The double-duty problem flagged for `CompletingTheSquare.tsx` repeats here in a sharper
form: cited by name as the SVG/renderer reference, but behind (not ahead of) its own category
siblings on the two axes most checkable from source (print-path convention, `WorkingStep`
construction). The SVG element conventions are genuinely worth copying; the print handler and raw
working-step construction are not.

### Bearings — `src/tools/Geometry/Bearings.tsx`
Route: `/bearings` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. No existing row names bearings directly, but there's a
  real, currently-unconsumed connection to `applyAngleFact`: the tool's own info modal states Level
  2 route questions can be asked "as a back bearing along the path," and the generator does include
  the reverse direction as a candidate — but the working never states the actual angle-fact reasoning
  that justifies it (the two North lines at connected points are parallel, so co-interior/alternate
  angles give back bearing = bearing ± 180). A real, specific gap `applyAngleFact` would directly
  fill, arguably the cleanest demand signal for that row found so far, since it's the one case where
  "the reasoning IS the move" bites hardest.
- Skills: No unlinked-prerequisite gap — this tool's own domain (reading a bearing from a diagram)
  has no current technique/skill table entry as either target, worth a light-touch new row once the
  `applyAngleFact` gap above is scoped, not urgent.
- Representations: Same category-wide open question.
- Teach deck: Strong, genuinely on-the-nose candidate — the tool's own info modal explicitly calls
  out the "'A from B'" misconception (measuring from the wrong point) as the thing students get
  backwards. A Spot the Mistake slide on this would directly dramatize the tool's stated #1
  misconception, similar in shape to the reverse-percentages/best-buys candidates flagged earlier.
  Blocked on the same missing-representation gap as everywhere else in Geometry.
- SmartGrapher: No fit — correctly absent.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: A single sub-tool, but with real internal shape variety —
  L1 a 2-point diagram, L2 a 3-point connected route testing both forward and back bearings, L3
  dresses the same structure as named real places with mixed phrasing specifically to test the "from"
  misconception. The tool is explicitly and honestly scoped to *reading/identifying* a bearing — it
  never asks a student to *calculate* one arithmetically (e.g. the back bearing by adding/subtracting
  180°). A disclosed scope limit, comparable to `NonLinearSimEq`'s ellipse limitation, but a real
  spec-coverage ceiling for a standard GCSE sub-skill — the one concrete expansion candidate.
- QO richness: Thin relative to the tool's polish elsewhere — one multiSelect, repeated identically
  at all three levels with no level-specific narrowing — the same "QO doesn't scale with level"
  pattern flagged **Unclear** for `Percentages`/`ExpandingBrackets`. Given the level structure
  genuinely does restructure, the flat QO under-sells that progression.
- Level progression: One of the stronger progressions in the audit so far — a genuine shape change
  at each step, not just widening number ranges, on par with `NonLinearSimEq`/`SimultaneousEquations`'
  best-in-class designs.
- Working-step depth: Shares `BasicAngleFacts`' exact flaw — `tStep()` is the only step-builder used
  anywhere, every line including the numeric answer is plain prose in `\text{}`, structurally
  incapable of a fragment reveal. Genuinely notable given this tool's other signals of careful,
  more-recent authorship — the working-step architecture is identically thin to its less-polished
  category neighbour, undercutting its "what good looks like" reference billing on this one axis.
- Conventions/anomaly scan: `questionRenderer` (**Justified**). `customPrintHandler={handleDiagramPrint}`
  — **Justified and exemplary**, matching `CLAUDE.md`'s own code sample verbatim, and going a step
  further: the renderer emits a second, hidden SVG copy with the answer drawn on specifically so the
  print path's answer pages show the bearing arc, not just the bare numeric answer — a subtlety not
  spelled out in `CLAUDE.md`'s own example. `defaults={{ numColumns: 3, maxColumns: 4,
  hideFontControls: true }}` — **Justified**, the sanctioned pattern. Not caught by the grep but
  worth recording: this tool supplies its own `generateUniqueQ`, deduping a worksheet on the bearing
  *value* per level rather than the random per-question key — a genuinely more careful engineering
  choice, used by only 8 tools repo-wide, most from later/more-polished passes.
- UI/visual consistency: Not checked live. From source: only 5 hardcoded hex occurrences, all
  distinct, tightly scoped to the diagram's own colour constants — the cleanest diagram-tool result
  seen in the audit so far by a wide margin.
- **Recommended status:** Stay live as-is on Part 2 fundamentals — the strongest engineering quality
  signal of the tools in this pass (correct shared print-path adoption including the hidden
  answer-copy pattern, custom value-based worksheet dedup, minimal hex usage, honest scope
  disclosure), and a genuinely strong level progression. The two things worth tracking: the flat
  QO-per-level profile, and — the most load-bearing finding — that its working-step depth is exactly
  as architecturally thin as `BasicAngleFacts`', which matters more given this tool's "what good
  looks like" billing (per this doc's own methodology note on its distinct later first-commit date).
  On infrastructure wiring and print conventions it earns that billing; on working-step pedagogy it
  does not, and shouldn't be assumed to just because of the later commit date. (current: Live)

**Notes:** The `applyAngleFact`-shaped gap here (back bearings tested but never justified via the
parallel-North-lines fact) is the more actionable Part 1 finding of the tools in this pass — a
single, well-scoped working-step enhancement rather than a new technique needing invention from
scratch, since this tool already generates the exact geometric situation the fact would explain.

### Properties of Circles — `src/tools/Geometry/CircleProperties.tsx`
Route: `/circle-properties` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `circleFormula` row (med, ⬜) is an exact
  and complete match — this tool covers all four named sub-moves (circumference, area, arc, sector),
  unlike most cross-references found elsewhere in the audit which only partially match. Level 3 of
  both `circumference` and `area` also independently exercises a `rearrange-formula`-shaped move — a
  second, currently-unlisted-for-this-tool consumer of that existing skill's paired technique.
- Skills: No markers. The L3 rearrangement steps map to `rearrange-formula` (med, ⬜). More
  interesting: the `sectors` sub-tool's θ/360 × (formula) move is structurally identical to the
  existing `fraction-of-amount` skill — a cross-topic, unnamed consumer of that high-priority,
  bar-model-backed row worth flagging even though it's an unusual domain match.
- Representations: Same category-wide open question — the tool's own SVG already functions as the
  visual, geometry diagrams appear to sit outside the six-representation vocabulary entirely.
- Teach deck: Plausible candidate — mixing up radius/diameter in `C=2πr` vs `C=πd` is a classic
  misconception, and the sectors sub-tool's L1→L2→L3 progression is a ready-made
  I-do/We-do/You-do arc on "what fraction of the full circle." Blocked on the same representation
  gap — no existing scene family a circle deck could reuse.
- SmartGrapher: No fit — a circle diagram isn't graphed as y=f(x).

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools. `circumference`/`area` each cover both formula
  variants plus a genuine reverse-direction L3; `sectors` adds a 3-way multiSelect crossed with 3
  levels — real breadth, arguably the widest single-file spec coverage seen in the Geometry pass.
  Confirmed gap: every question is bare `kind: "simple"` — no real-world context (wheels, tracks,
  pizza, clocks) anywhere.
- QO richness: Real control — a decimals/π-form toggle on all three sub-tools plus a genuine 3-option
  multiSelect on `sectors`. But `difficultySettings: null` on all three means identical QO at every
  level — a teacher can select "Perimeter"-only sector questions even at Level 1 semicircles — the
  same "flat across levels" pattern flagged elsewhere as **Unclear**.
- Level progression: Genuinely structural, one of the stronger showings in the audit —
  `circumference`/`area` teach the r↔d relationship at L1→L2 rather than just scaling numbers, and
  L3 reverses the whole problem direction requiring rearranging/square-rooting. `sectors`' L1→L2→L3
  is a clean, escalating structural ladder.
- Working-step depth: Real KaTeX throughout — 17 `mStep` + 19 `step` calls, correct
  "Given → formula → substitute → Answer" chains for every branch, and a properly-implemented
  `reformatQuestion` for the instant π↔decimal toggle matching the documented `CompletingTheSquare`
  pattern exactly — a genuine positive, and (see category summary) rare for this category. Gap: zero
  fragment-array usage anywhere — the same gap found in most tools audited across every category.
- Conventions/anomaly scan: `fixedColumns: true` — **Debt**, directly contradicting `CLAUDE.md`'s
  diagram-tool guidance verbatim; its concrete effect is that the Columns control is hidden from the
  teacher entirely. `customPrintHandler` — **Debt, the clearest single anomaly found in this pass.**
  Hand-rolls a fixed 3×5 grid — exactly the anti-pattern `CLAUDE.md` names and tells tools not to do
  — and its function signature only accepts 3 of the 4 parameters ToolShell provides, silently
  ignoring `ctx.isDifferentiated`. Since the Differentiated toggle isn't gated by `fixedColumns`, a
  teacher can click Differentiated and print, and get the identical flat 3×5 sheet with zero
  differentiation applied and no error — a genuine, source-confirmable functional gap. This tool
  would be the most direct beneficiary of migrating to `handleDiagramPrint` of any Geometry tool
  checked. Absence of `hideFontControls` — **Unclear, leaning Debt**: every sibling diagram tool
  checked across the whole audit sets it, and here the diagram's font is entirely hard-coded and
  never threaded through `fontClass`, so the font-size control shown to the teacher has no visible
  effect on the diagram at all.
- UI/visual consistency: Not checked live. From source: SVG requirements otherwise fully compliant —
  a clean, better-than-`PerimeterTool` implementation in this specific respect. Hex colours present
  but consistent with the repo-wide norm. `_colorScheme` received and unused.
- **Recommended status:** Live but flagged for expansion — strong maths content (best-in-category
  level progression and breadth so far), but the print/worksheet path is a genuine outlier: the one
  Geometry tool reimplementing the exact fixed-grid pattern `handleDiagramPrint` was built to retire,
  with a concrete, confirmable consequence (Differentiated silently does nothing). Migrating to
  `handleDiagramPrint` would be the highest-leverage, most mechanical fix surfaced anywhere in this
  audit pass. Nothing here argues for gating. (current: Live)

**Notes:** The `circleFormula`/`rearrange-formula` cross-references are unusually clean matches —
worth prioritising `circleFormula` if a second technique gets built after the high-frequency
Algebra/Number ones already queued, since this one file alone demonstrates all four of its named
sub-moves. This is also the first tool in the whole audit where a print/worksheet *architecture*
anomaly, not a content-quality one, is the standout Part 2 finding — worth keeping visible separately
from the pedagogy-content findings per the methodology's "don't merge the two buckets" instruction.

### Properties of Line Equations — `src/tools/Geometry/EquationsOfLines.tsx`
Route: `/equations-of-lines` · Current status: Live

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. `PROJECTS.md`'s `gradientIntercept` row (med, ⬜,
  "gradient formula, y=mx+c, solve for c") is a near-verbatim match for what this file already
  hand-computes in exactly that three-step shape — an unusually cheap conversion target, since the
  moves already exist correctly sequenced, just not extracted.
- Skills: No markers, and — as with `AnglesInQuadrilaterals` — `PROJECTS.md`'s skills table has no
  Geometry rows at all. Two concrete unlinked-consumer findings against existing rows:
  `substitute-into-formula` (currently only named for `NonLinearSimEq`) — this tool's "Substitute
  into y=mx+c" steps are a second consumer; `rearrange-formula` (currently named for
  `Iterations`/`NonLinearSimEq`) — the `missing` sub-tool's subject-rearrangement branches are a
  genuine third consumer of the exact same skill.
- Representations: None of the six fit, same as the rest of the category. Unlike other Geometry
  tools, though, there is currently **no visual of any kind** for a topic that is inherently visual —
  the natural fix is SmartGrapher, not a new core representation, mirroring `Iterations`' finding
  exactly: the six-representation vocabulary doesn't cover this content, but a mature adjacent tool
  does.
- Teach deck: Plausible and comparatively cheap — the tool's own three sub-tools already form a
  natural I-do/We-do/You-do arc, and could plausibly ship using only static `TeachBlock`s without a
  new scene type, since the pedagogy is fully symbolic rather than diagram-dependent.
- SmartGrapher: **Confirmed, definitively, not wired in** — zero grapher usage anywhere in the file.
  This directly resolves `PROJECTS.md`'s open "possible next step" naming this tool by name — nothing
  has been done. Given the tool is literally titled "Properties of Line Equations" and has zero
  visual content of any kind, this is the single highest-leverage Part 1 gap found for this tool:
  the `linear` preset is a direct, off-the-shelf fit for every sub-tool here.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Three sub-tools (gradient, equation, missing), reasonable
  coverage of the core moves. A real, specific spec-coverage gap for a tool titled "**Properties** of
  Line Equations": no parallel/perpendicular-line question anywhere — arguably the single most
  standard GCSE "properties of a line" question type, currently entirely absent. No line-intersection
  question either (a natural SmartGrapher tie-in).
- QO richness: Moderate — `gradient`/`equation` share genuine per-level differentiation; the
  `missing` sub-tool has one multiSelect but `difficultySettings: null` — identical QO at all three
  levels, the same "flat across levels" pattern, and an inconsistency against its own sibling
  sub-tools in the same file which do differentiate.
- Level progression: Structurally consistent but comparatively shallow next to
  `AnglesInQuadrilaterals`' three-different-rule-sets pattern — the same one axis reused everywhere
  (positive integers → negative integers → fractional gradients). The L2→L3 step is a genuine method
  change (fraction arithmetic), but the question *shape* never changes — closer to numeric-range
  escalation than structural restructuring.
- Working-step depth: Comparatively strong for the category — real `mStep` sequences with genuinely
  computed, narrated intermediate values, a clear step up from the `tStep`-flattened-prose pattern
  found in most of this category's diagram tools. The one consistent gap matching the rest of the
  audit: zero fragment-array usage anywhere, despite the underlying maths already being multi-part.
- Conventions/anomaly scan: The only match is `defaults={{ worksheetFontSize: 2 }}` — bumping the
  documented default of 1. Plausible (long KaTeX fraction/equation strings need more room) but
  undocumented, and genuinely idiosyncratic: only 3 tools site-wide set `worksheetFontSize` at all,
  and the other two pair it with a coordinated set of overrides at value 1 — this file sets it alone,
  at 2, matching no existing precedent closely enough to call Justified (**Unclear**). Everything
  else correctly absent — this is, despite its category, not actually a diagram tool.
- UI/visual consistency: Not checked live. From source: zero hardcoded hex colours, no bespoke JSX —
  should be visually native to the shell by construction, the same clean-baseline signal as
  `Estimation`/`SolvingLinearEquations`.
- **Recommended status:** Live but flagged for expansion — solid, correctly-computed core maths with
  above-category working-step quality, but two concrete, fixable gaps stand out: a full absence of
  any visual for an inherently visual topic, with the fix (SmartGrapher) mature and already named for
  this exact tool; and no parallel/perpendicular-line question type, a genuine spec-coverage gap
  inside this tool's own stated scope. Neither argues for gating — both are additive. (current: Live)

**Notes:** This tool does not actually match the "all 8 Geometry tools are diagram/SVG tools"
assumption — verified directly: no `<svg>` element, no `questionRenderer`, no `_diagram` field, none
of the diagram-only `defaults`. Structurally it's a pure KaTeX/worded generator, identical in shape
to Algebra-category tools like `CompletingTheSquare`/`SolvingLinearEquations`, not to its own
category siblings — exactly why it's the one Geometry tool named as a SmartGrapher candidate rather
than an SVG-diagram candidate in `PROJECTS.md`.

### Perimeter — `src/tools/Geometry/PerimeterTool.tsx`
Route: `/perimeter` · Current status: Live *(registry display name is literally "Perimeter (BETA)" —
fully live and discoverable on the landing page despite the label)*

**Part 1 — Infrastructure alignment**
- Techniques: Thin — no technique import. Unlike `CircleProperties`, this tool's core moves have
  **no matching row at all** among the three existing Geometry technique rows — none fit "sum the
  sides" or "derive a missing rectilinear side from opposite-side equality." **New technique
  proposed:** `sumPerimeter`/`deriveMissingSide` (add all given sides; for rectilinear shapes, use
  opposite-side equality to find 1–2 missing lengths before summing), low-to-med priority, needed by
  exactly this tool. `PROJECTS.md`'s own migration detail already flags this tool by name
  ("techniques wiring still to add on some") — this audit confirms that note is accurate: zero
  technique wiring exists anywhere in the file.
- Skills: No markers — the file doesn't even import `mStep`/`step` (see Working-step depth). The
  clearest unlinked prerequisite is **unit conversion** (mm↔cm↔m) — both sub-tools' Level 3
  explicitly narrates a full unit-conversion chain. **No `unit-conversion` skill row exists anywhere
  in `PROJECTS.md`** — this is the second tool in the whole audit to hand-roll this exact move
  unlinked (`FractionsOfAmounts`' `worded` sub-tool was flagged for the same move in the Ratio &
  Proportion pass, with no row proposed there either). **New skill proposed:** `unit-conversion` (no
  clear representation — similar open-question status to `PowersOfTen`'s `place-value` finding),
  now with two cross-category demand signals.
- Representations: Same category-wide open question — the tool's own diagram (with a genuinely
  sophisticated tick-mark/pill-placement system, see Notes) already functions as the visual.
- Teach deck: A weaker candidate than most tools audited so far — "add up all the sides" has less
  inherent misconception texture than fraction/ratio/percentage content. The rectilinear L2
  missing-side derivation is a plausible, if modest, You-do beat. Not urgent.
- SmartGrapher: No fit.

**Part 2 — Standalone readiness**
- Question/sub-tool breadth vs spec: Two sub-tools with genuinely good geometric variety —
  `polygons` covers 5 regular shapes at L1 and 4 irregular tick-marked shapes at L2 with a real,
  toggle-gated L3 structural option; `rectilinear` uses 8 distinct hand-built template shapes
  (L-shapes, T-shapes, staircases, a cross). Real gaps: every question is bare `kind: "simple"`, no
  real-world framing anywhere despite perimeter being naturally contextual; no question ever asks
  for a missing side given the perimeter; and the L3 "mixed units" move is architecturally identical
  in both sub-tools, reading as one repeated conversion drill rather than two distinct L3 ideas.
- QO richness: **The thinnest of the two tools audited alongside it, and thin in absolute terms.**
  Zero `dropdown`, zero `multiSelect` anywhere despite `CLAUDE.md` naming multiSelect "the default QO
  control." The only real control is two boolean toggles, each active at exactly one level. L1 of
  both sub-tools, and L3 of `rectilinear`, expose zero teacher-facing options at all — a flatter QO
  profile than every tool audited except `SimplifyingRatiosTool` (recommended to stay gated partly
  *because of* an identical zero-QO finding).
- Level progression: Genuinely structural for `rectilinear` (a real method change at L2) and for
  `polygons`' L1→L2 jump (a real shift in what "equal sides" means geometrically). Weaker for both
  sub-tools' L3: "same shapes, but convert units first" is a bolted-on arithmetic step rather than a
  new geometric idea, the same "L3 = conversion drill" shape in both sub-tools.
- Working-step depth: **The weakest finding across the tools audited in this session, and
  structurally different from mere thin authoring.** The file imports only `tStep` — `step`/`mStep`
  are never imported at all — so it is structurally incapable of a fragment reveal, not just thin in
  authoring it. **Important calibration:** this is not `PerimeterTool`-specific — the same check
  across the rest of the category confirms `BasicAngleFacts`, `AnglesInTriangles`,
  `AnglesInQuadrilaterals`, `AnglesInParallelLines`, and `Bearings` all follow the identical
  tStep-only convention; only `EquationsOfLines`/`CircleProperties` break from it. A genuine,
  category-wide pattern, not something this tool invented — but still the single largest
  working-step-depth gap of the tools audited in this session.
- Conventions/anomaly scan: `customPrintHandler={handleDiagramPrint}` — **Justified, and the correct
  reference pattern**, deliberately swapped in per `docs/PATCH_NOTES.md`'s 2026-08-13 migration entry
  for the tool's old hand-rolled PDF generator, with a dedicated helper extracted specifically so the
  print-time aspect value can never drift from the on-screen rendering — genuinely careful
  engineering, a direct positive contrast with `CircleProperties`' bespoke handler. `hideFontControls:
  true` — **Justified**, correct and consistent. `numColumns: 3, maxColumns: 4` — matches
  `AnglesInQuadrilaterals`'s exact values — **Justified**, textbook. `numQuestions: 9` — undocumented,
  below the 15 baseline (**Unclear**, less extreme than similar findings elsewhere). Minor,
  source-only observation: neither SVG sets `preserveAspectRatio`, unlike every other SVG checked
  this session — very likely a no-op (the SVG default), but a real, undocumented deviation.
- UI/visual consistency: Not checked live. From source: both SVGs correctly use a computed viewBox,
  never a fixed pixel height. 16 distinct hardcoded hex values, consistent with the repo-wide norm.
  `_cs` received and unused.
- **Recommended status:** Live but flagged for expansion — and this is exactly the test case this
  doc's own intro names it as. The `enabled` flag going live tracked a real, verified engineering
  fact (the ToolShell/`handleDiagramPrint` migration is genuinely well done — better-engineered than
  `CircleProperties`' print path, in fact), but content quality is a separate, lower-scoring axis:
  this is the thinnest tool on QO richness of the tools audited in this session, and structurally
  incapable of the fragment-reveal convention (though that specific gap is category-wide). Nothing
  here argues the shell itself is unsound or that the tool should be gated — the underlying maths and
  diagram-placement engineering are solid — but "BETA" in its own display name plus this profile
  argues against treating it as done; it reads as exactly what this doc's intro predicted:
  shell-verified, content-unreviewed until now. (current: Live)

**Notes:** The pill-placement algorithm — brute-force scoring all 3ⁿ candidate-position assignments
to maximise minimum pairwise clearance between labels — is genuinely sophisticated engineering,
explicitly called out in `docs/PATCH_NOTES.md`'s migration entry as carried over verbatim, a clear
positive relative to most diagrams audited so far. This is a case where the diagram/interaction
engineering is well ahead of the pedagogy-content layer sitting on top of it — worth keeping those
two observations separate when this feeds back into `PROJECTS.md`. Also worth flagging: since this
tool imports neither `step` nor `mStep`, and `CircleProperties` in the same category does, the
Geometry category's own reference bar is internally split — a future session naming a Geometry "what
good looks like" tool should pick one of the angle-fact tools or `CircleProperties`, not assume they
share a convention.

*(Entries get appended below each category's checklist as tools are audited, using the template
above. Tick the checkbox and flip the category status once every tool in it has an entry.)*

---

*This doc is referenced from `docs/PROJECTS.md`'s "Maths Tool Audit" section (the umbrella entry
in the At-a-glance table) and from `CLAUDE.md`'s documentation map. Keep both in sync with this
doc's actual progress — flip the category status here, then mirror it in `PROJECTS.md`.*
