# Maths Tool Audit

**This document is two things at once: the audit's methodology (Part A) and the live audit
log (Part B).** It is written to be fully self-contained — a fresh session with no memory of
the conversation that designed this audit should be able to open this file alone and correctly
run it. Do not assume prior chat context; everything needed is below.

**Status: in progress — Number and Algebra complete (13/27).** The next session picking this up
should continue with Ratio & Proportion (see "Audit log" below), then Geometry.

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
