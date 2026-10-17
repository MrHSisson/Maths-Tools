# Critical Path Analysis — dedicated skill tools (plan) and banked exam-chain ideas

**Status:** draft (planning only, nothing built). Source evidence: `specs/exam/critical-path-analysis.md` (AS, A-level, legacy papers).
Existing tool: `src/tools/Decision/CriticalPath.tsx` (tabs `cpaNetwork`, `cpaForward`, `cpaFull`, `cpaFloat`); maths `cpa.ts`, working `cpaSolve.ts`, view `ActivityNodeView.tsx`.

## Principle

**One tool tab = one skill.** Each tab drills a single procedure on its own, with its own picture, three levels, Question Options and a stepped working
solution behind the (?). Nothing is a mini exam question. Only once the skills exist do we string them into exam-style chains (Part B).
Every tab starts from a generated project (a precedence table plus durations from `cpa.ts`), so all tabs share one maths core and cannot disagree.

## Part A — the dedicated skills

| # | Skill (tab) | Student does | Picture | Levels (what changes) | Status |
|---|---|---|---|---|---|
| 1 | **Network from a table** `cpaNetwork` | draw the activity network | table in, network out | size 6–7 / 8–9 / 10–13; skip arrows | built |
| 2 | **Table from a network** `cpaTable` | read immediate predecessors off a network | network in, table out | size; a skip arrow; redundant arrows to spot | new |
| 3 | **Forward pass** `cpaForward` | earliest start of every activity, project time | network with boxes | 1 / 2–3 predecessors; skip arrow | built |
| 4 | **Backward pass + float** `cpaFull`, `cpaFloat` | latest finish, float, critical activities | network with boxes | size; greatest float; all floats | built |
| 5 | **Critical paths** `cpaPaths` | list every critical path, state the time | network, critical boxes | one path / two paths / near-critical | partly built (option) |
| 6 | **Missing times** `cpaUnknown` | find an unknown duration or start from the critical path or project time | partly filled network | 1, 2, 3 unknowns; multiple choice; inequality (`x ≤ …`) | new |
| 7 | **Delays and changes** `cpaChange` | decide the effect of a delay or shortening: new project time, activities that move, maximum delay | network + stated change | delay less than / equal to / more than float; shorten a critical activity (second path limits) | new |
| 8 | **Cascade (Gantt) chart** `cpaCascade` | draw the cascade chart: critical row, others at earliest start, float shown | blank time axis → bars | early starts only; float shown; late starts; complete a partly drawn chart | new |
| 9 | **Resource histogram** `cpaHistogram` | draw the workers-over-time histogram, no holes, labelled blocks | time axis + stacked blocks | one worker each; several; given a cascade first | new |
| 10 | **Resource levelling** `cpaLevel` | delay a non-critical activity into its float to meet a worker limit; new time | histogram over the limit | limit just under the peak; two clashes; a critical activity must move | new |
| 11 | **Worker allocation** `cpaWorkers` | assign activities to a set number of workers; minimum workers | cascade with lanes | 2 workers / 3; time limit | new |
| 12 | **Which activity to shorten** `cpaShorten` | pick the critical activity whose reduction saves most | network | one path / two paths | new |
| 13 | **Context and units** `cpaContext` | convert units, add a clock start time, float in a small project | worded + network | minutes only / seconds / clock times | new |

**Sharing the picture work.** The cascade chart (8), histogram (9), levelling (10) and allocation (11) are one family: a time-axis view (`GanttView`, `HistogramView`) over
the same `Schedule` from `cpa.ts` (activity → start, finish, worker count, float). Build the schedule model and views once, then each tab is a different
question over it. This matches `DECISION_SHELL_PLAN.md` ("CPA needs two new views").

**Proposed build order** (each unit is a session): (1) Table from a network + Missing times + Delays and changes (all on the existing network picture; these cover most of AS);
(2) Cascade chart (introduces `GanttView` and the schedule model; includes "complete a partly drawn chart");
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
2. AS-only versus A-level tabs: hide the A-level tabs under the course switch (as Network Flows does)?
3. Histogram/cascade: print as SVG worksheet cells (`handleDiagramPrint`-style) or as exam-style blank axes in the Decision exam printer?
