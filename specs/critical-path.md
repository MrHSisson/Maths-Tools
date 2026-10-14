# Critical Path Analysis (activity networks from precedence tables) — Decision Maths

**Status:** draft — not ready to build. Open items: the AQA 7367 wording for this topic is unconfirmed (aqa.org.uk could not be reached when this was written), and the questions at the end need an answer. Tool (when built): `src/tools/Decision/CriticalPath.tsx` · maths `src/shared/decision/cpa.ts` · working `cpaSolve.ts` · views `representations/ActivityNodeView.tsx` (increment 1), `GanttView.tsx` and `HistogramView.tsx` (later) · tests `src/tests/cpa.test.ts`. Follows the Decision shell (`docs/architecture/DECISION_SHELL_PLAN.md`, increment 6), not ToolShell.

## What it teaches
AQA A-level Further Maths (Discrete) / Edexcel D1: turn a precedence table into an **activity-on-node** network; forward and backward pass; critical activities, critical path and minimum project time; float. Later: cascade (Gantt) charts, resource histograms and scheduling with a limited number of workers.

## The picture (reference diagram)
Activity on node, left to right in columns, one box per activity. Box = three cells: **earliest start | duration | latest finish**, the activity letter above. Arrows run from an activity to each activity that directly follows it. A start and finish are not drawn (activities with no predecessor sit at the left; the project time is the largest finish). Arrows that skip a column are routed round the boxes in between, never through them.

Reference example (from the teacher's exam-style diagram):

| Activity | Duration | Immediately preceded by | Earliest start | Latest finish | Float |
|---|---|---|---|---|---|
| A | 18 | — | 0 | 26 | 8 |
| B | 8 | — | 0 | 8 | 0 |
| C | 16 | B | 8 | 24 | 0 |
| D | 9 | A, C | 24 | 35 | 2 |
| E | 22 | C | 24 | 46 | 0 |
| F | 11 | D | 33 | 46 | 2 |
| G | 13 | A, C | 24 | 46 | 9 |

Minimum project time **46**; critical activities **B, C, E** (critical path B–C–E). This must be reproduced exactly by `cpa.test.ts`.

## Question types (sub-tools / tabs)
| Tab | Question | Answer |
|---|---|---|
| Network from a table (`cpaNetwork`) | A precedence table is given. Draw the activity network. | the network (checked as a set of precedence arrows) |
| Forward pass (`cpaForward`) | Network (or table) with durations. Find every earliest start time and the minimum project time. | earliest starts, project time |
| Full analysis (`cpaFull`) | Forward and backward pass, then the critical activities, critical path and minimum time. | boxes filled, critical path, project time |
| Float (`cpaFloat`) | Complete network given. Find the total float of each non-critical activity. | float per activity |

Later increments (not in the first build): **Cascade chart** (Gantt: draw or read one, critical activities, float shown as dashed bars) and **Resource histogram / scheduling** (a given number of workers; lower bound on the number of workers; a schedule meeting the deadline).

## Levels and options
- **Level 1:** 6–7 activities, at most 2 start activities, one clear critical path, whole-number durations.
- **Level 2:** 8–9 activities, two starting activities, one or more activities that wait for two others (the D in the reference), a non-critical activity with float.
- **Level 3:** 10–12 activities, an activity that skips a column (the A→G arrow in the reference), a second near-critical path, and an activity with float of 1.
- **Options:** Duration size (small 1–9 / medium 5–25) · Setting (plain letters / in context: building a shed, a school play, a website launch) · Show times on arrows or in boxes is **not** an option: the box layout is the standard.
- The worked-example dropdown "Working" (full / times only) follows the maths tools' convention.

## Correctness (the build must guarantee)
- The network is acyclic, every non-start activity has at least one predecessor, and every activity can reach the end.
- **Table to network:** the precedence table lists immediate predecessors only (no redundant ones such as D waiting for A and for B when B already precedes A). The generator removes any predecessor reachable another way.
- Every generated question's answer is recomputed by an independent reference (`referenceCpa` in `validate.ts`, a plain longest-path computation) and compared with the walkthrough; a mismatch fails CI, as the other Decision tools do.
- At least one critical path; more than one only at Level 3 and only when asked for. Floats are never negative; critical activities have float 0.
- Generated networks lay out cleanly: boxes in columns by earliest start order, no box overlap, no arrow crossing a box, as few arrow crossings as possible. A table whose layout fails these checks is rejected and redrawn.

## Working (one `SolveStep` per move, board-writing style)
1. (Table) place the activities with no predecessor, then each next activity once all its predecessors are placed; add its arrows.
2. Forward pass: fill the earliest start of each activity in order. Where an activity has several predecessors, show the finish times of each and take the largest (the "largest of 18 and 24" beat).
3. Minimum project time: the largest earliest finish.
4. Backward pass: from the project time, fill the latest finish of each activity in reverse order. Where an activity has several successors, show the latest start of each and take the smallest.
5. Float, then critical activities (float 0, highlighted), then the critical path as a highlighted chain.

## Data model (so Gantt and histograms can follow without rework)
`ActivityProblem { activities: { id, duration, predecessors: string[], workers?: number }[] }`. `workers` is unused in the first build but already present, so the resource histogram only adds a view and a scheduler. Layout (`column`, `row` per activity) is computed from the data by `layoutActivities()` and not stored in the problem.

## Info section content
Precedence table; activity-on-node network; earliest start, latest finish; forward pass (largest), backward pass (smallest); float = latest finish − earliest start − duration; critical activity (float 0) and critical path; minimum project time. The info modal states clearly which of these the tool covers.

## Acceptance
- The reference example above is reproduced exactly (earliest starts, latest finishes, floats, project time 46, critical B–C–E) at every walkthrough beat.
- Every generated question is cross-checked against `referenceCpa`, and the independent-predecessor rule above holds for every table.
- Layout checks pass for 1,000 generated problems per level (no overlap, no arrow through a box).
- Phone: boxes remain legible; the diagram is pan/zoomable inside its window like the other Decision networks.

## Open questions
1. Please confirm against AQA 7367 whether the tool should include dummy activities (an activity-on-arc form) — this spec assumes **not**, because the reference diagram is activity on node.
2. Float types: total float only, or also free and independent float? The first build is total float only.
3. Should the "start" and "end" activities be drawn as explicit boxes? The reference diagram does not, and the spec assumes not.
4. Is the Gantt chart a **cascade chart** (each activity drawn at its earliest start, float as a dashed extension), or the scheduling-with-workers chart, or both? Both need new views; the order would follow the answer.
