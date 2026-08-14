# Maths Tool Audit

**This document is two things at once: the audit's methodology (Part A) and the live audit
log (Part B).** It is written to be fully self-contained — a fresh session with no memory of
the conversation that designed this audit should be able to open this file alone and correctly
run it. Do not assume prior chat context; everything needed is below.

**Status: in progress — Number complete (6/27).** The next session picking this up should continue
with Algebra (see "Audit log" below) and work through the remaining categories (Algebra, Ratio &
Proportion, Geometry) in order, one category per session/pass.

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
currently-gated tools may pass it easily. Use the reference implementations named in `CLAUDE.md`
→ "Reference implementations — which file to look at" as the internal quality bar (e.g.
`CompletingTheSquare.tsx`, `FractionToRatio.tsx`, `AnglesInQuadrilaterals.tsx`, `RatioSharingTool.tsx`)
— when a tool looks thinner than these, that's the gap to describe.

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

### Algebra — ⬜ not started
- [ ] Collecting Like Terms (`CollectingLikeTerms.tsx`)
- [ ] Unknowns on Both Sides (`SolvingLinearEquations.tsx`)
- [ ] Completing the Square (`CompletingTheSquare.tsx`)
- [ ] Iteration (`Iterations.tsx`)
- [ ] Simultaneous Equations — Elimination (`SimultaneousEquations.tsx`)
- [ ] Simultaneous Equations — Substitution (`NonLinearSimEq.tsx`)
- [ ] Expanding Brackets (`ExpandingBrackets.tsx`)

### Ratio & Proportion — ⬜ not started
- [ ] Dividing Ratios (`RatioSharingTool.tsx`)
- [ ] Simplifying Ratios (`SimplifyingRatiosTool.tsx`)
- [ ] Recipes (`RecipesTool.tsx`)
- [ ] Converting Fractions and Ratios (`FractionToRatio.tsx`)
- [ ] Fractions of Amounts (`FractionsOfAmounts.tsx`)
- [ ] Best Buys (`BestBuys.tsx`)

### Geometry — ⬜ not started
- [ ] Properties of Circles (`CircleProperties.tsx`)
- [ ] Basic Angle Facts (`BasicAngleFacts.tsx`)
- [ ] Angles In Triangles (`AnglesInTriangles.tsx`)
- [ ] Angles in Parallel Lines (`AnglesInParallelLines.tsx`)
- [ ] Angles In Quadrilaterals (`AnglesInQuadrilaterals.tsx`)
- [ ] Bearings (`Bearings.tsx`)
- [ ] Properties of Line Equations (`EquationsOfLines.tsx`)
- [ ] Perimeter (`PerimeterTool.tsx`)

*(Entries get appended below each category's checklist as tools are audited, using the template
above. Tick the checkbox and flip the category status once every tool in it has an entry.)*

---

*This doc is referenced from `docs/PROJECTS.md`'s "Maths Tool Audit" section (the umbrella entry
in the At-a-glance table) and from `CLAUDE.md`'s documentation map. Keep both in sync with this
doc's actual progress — flip the category status here, then mirror it in `PROJECTS.md`.*
