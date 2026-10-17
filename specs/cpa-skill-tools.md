# Critical Path Analysis — dedicated skill tools (plan) and banked exam-chain ideas

**Status:** draft (planning only, nothing built). Source evidence: `specs/exam/critical-path-analysis.md` (AS, A-level, legacy papers).
Existing tool: `src/tools/Decision/CriticalPath.tsx` (tabs `cpaNetwork`, `cpaForward`, `cpaFull`, `cpaFloat`); maths `cpa.ts`, working `cpaSolve.ts`, view `ActivityNodeView.tsx`.

## Principle

**One tool tab = one skill.** Each tab drills a single procedure on its own, with its own picture, three levels, Question Options and a stepped working
solution behind the (?). Nothing is a mini exam question. Only once the skills exist do we string them into exam-style chains (Part B).
Every tab starts from a generated project (a precedence table plus durations from `cpa.ts`), so all tabs share one maths core and cannot disagree.

## Part A — the dedicated skills

**Course split.** One tool with the course switch (as Network Flows has): **AS** shows 7 tabs, **A-level** shows 11. Levels are set per tab and per course, not forced to three:
a tab may have 1, 2 or 3 levels, and a shared tab uses one 3-rung scale where **AS shows rungs 1–2 and A-level shows rungs 2–3** (so the same maths, a harder slice).
Evidence for the split is the report's census: cascade, histogram, levelling and worker allocation appear only on A-level and legacy papers; table-from-network, claim/comment and
clock-time context appear only on AS (and legacy).

| # | Skill (tab) | AS | A-level | Levels | What changes between levels | Status |
|---|---|---|---|---|---|---|
| 1 | **Network from a table** `cpaNetwork` | yes | yes | shared scale, 3 rungs: AS 1–2, A-level 2–3 | 6–7 activities / 8–9 with a skip arrow / 10–13 with several merges | built |
| 2 | **Table from a network** `cpaTable` | yes | no | AS 2 | no skip arrow / a skip arrow (and a redundant arrow to avoid) | new |
| 3 | **Forward pass** `cpaForward` | yes | yes | shared 3 rungs: AS 1–2, A-level 2–3 | 1 predecessor each / 2–3 predecessors / skip arrows, larger | built |
| 4 | **Backward pass and float** `cpaFull`, `cpaFloat` | yes | yes | shared 3 rungs: AS 1–2, A-level 2–3 | as above; float of one activity / all floats | built |
| 5 | **Critical paths** `cpaPaths` | no (inside Full analysis) | yes | A-level 2 | one path to list in full / two critical paths and a near-critical path | partly built (option) |
| 6 | **Missing times** `cpaUnknown` | yes | yes | AS 1, A-level 2 | AS: one unknown, multiple choice. A-level: two unknowns; an inequality (`x ≤ …`) | new |
| 7 | **Delays and changes** (incl. claim and comment) `cpaChange` | yes | yes | AS 2, A-level 1 | AS: delay less than / equal to / more than the float; then shorten or remove a critical activity. A-level: one level, a change where a second critical path limits the effect | new |
| 8 | **Cascade (Gantt) chart** `cpaCascade` | no | yes | A-level 2 | early starts with float shown / late starts, or complete a partly drawn chart | new |
| 9 | **Resource histogram** `cpaHistogram` | no | yes | A-level 2 | one worker each / several workers per activity | new |
| 10 | **Resource levelling** `cpaLevel` | no | yes | A-level 2 | one clash, limit just under the peak / two clashes, or a critical activity must move | new |
| 11 | **Worker allocation** `cpaWorkers` | no | yes | A-level 1 | assign to k workers; minimum workers (k is a Question Option) | new |
| 12 | **Which activity to shorten** `cpaShorten` | no | yes | A-level 1 | pick the critical activity saving most; a second critical path is a Question Option | new |
| 13 | **Context and units** `cpaContext` | yes | no | AS 1 | worded project; minutes / seconds and a clock start time are Question Options | new |

Tab count: **AS 7** (1, 2, 3, 4, 6, 7, 13), **A-level 11** (1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12). Four tabs are one level only because the evidence gives one
difficulty: worker allocation (3 occurrences), which to shorten, context (one AS question) and A-level changes. Where a single level needs variety, use Question Options, not levels.

**Sharing the picture work.** The cascade chart (8), histogram (9), levelling (10) and allocation (11) are one family: a time-axis view (`GanttView`, `HistogramView`) over
the same `Schedule` from `cpa.ts` (activity → start, finish, worker count, float). Build the schedule model and views once, then each tab is a different
question over it. This matches `DECISION_SHELL_PLAN.md` ("CPA needs two new views").

**Proposed build order** (each unit is a session): (1) **all AS tabs first**: Table from a network, Missing times, Delays and changes, Context and units (all on the existing network picture, so the AS course is complete before the A-level work starts);
(2) A-level: Cascade chart (introduces `GanttView` and the schedule model; includes "complete a partly drawn chart");
(3) Resource histogram; (4) Levelling + Worker allocation; (5) Which to shorten, Context and units, critical-path tab.

**For every tab** (shell rules): levels via `config.levelLabels`; stepped working behind the (?) from `cpaSolve.ts`; Practice | Worksheet with print; the picture answer
checked structurally (a set of arrows, a set of bars) not by pixels; independent re-derivation test in `cpa.test.ts` style (brute-force longest path, brute-force schedule check).

**Evidence driving tab design** (details in the report §3 and §8): levelling and explanation parts score lowest; the histogram fails on holes and missing labels; the cascade
chart fails on float not shown or started too late; the backward pass slips on activities with two successors; students vaguely explain "effect of a delay" instead of
comparing delay with float. The tabs' marking hints and Depth items should target exactly these.

## Part B — banked exam-style chains (build after Part A)

Each chain strings finished tabs in the order the papers do. Marks follow the paper convention (B1/M1/A1/E1/R1). Model on `specs/flow-exam-questions.md`.

**AS**
- **A — Table → network → times → what-if/claim** (AS Q2-style): draw network (1) → forward/backward pass, minimum time (2) → critical path (3) → effect of a delay vs float (4) → claim comment (5).
- **B — Given network → times → claim** (AS Q4-style): times and float, then judge a stated claim with a number.
- **C — Completed network → effect of a change**: remove or lengthen an activity; new critical path/time.
- **D — Context with clock time** (AS Q8-style): worded project, convert units and start time, finish clock time, float of the second small project.
- **E — Unknown values, multiple choice**: choose the value that fits a given critical path.

**A-level**
- **F — Times + float + cascade chart** (AL Q3-style).
- **G — Table → network → critical paths → histogram → levelling** (AL Q5-style, two critical paths).
- **H — Worker allocation** (minimum workers, time on k workers).
- **I — Which activity to speed up, with a second critical path** (AL Q6b-style).
- **J — Model critique**: why the model is unrealistic (fixed durations, unlimited workers); written answers, marked with E1/R1 keywords from the mark scheme.

Marks, wording, givens, variation space and sample answers for each archetype are in the report (§2, §4–§7, §9).

## Open questions for the user
1. Order: start with unit (1) above, or the cascade chart first?
2. (Settled in this draft) AS-only and A-level-only tabs sit behind the course switch, as Network Flows does; check the table above.
3. Histogram/cascade: print as SVG worksheet cells (`handleDiagramPrint`-style) or as exam-style blank axes in the Decision exam printer?
