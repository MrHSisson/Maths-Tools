# Maths Tool Audit

**This document is two things at once: the audit's methodology (Part A) and the live audit
log (Part B).** It is written to be fully self-contained — a fresh session with no memory of
the conversation that designed this audit should be able to open this file alone and correctly
run it. Do not assume prior chat context; everything needed is below.

**Status: not started.** No tool has been audited yet. The next session picking this up should
start with Number (see "Audit log" below) and work through the categories in order, one category
per session/pass.

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

### Number — ⬜ not started
- [ ] Adding & Subtracting Integers (`IntegerAddSub.tsx`)
- [ ] Estimation (`Estimation.tsx`)
- [ ] Multiplying & Dividing by 10ⁿ (`PowersOfTen.tsx`)
- [ ] Adding & Subtracting Fractions (`FractionsAddSub.tsx`)
- [ ] Multiplying & Dividing Fractions (`FractionMultDiv.tsx`)
- [ ] Percentages (`Percentages.tsx`)

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
