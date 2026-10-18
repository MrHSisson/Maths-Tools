# Tool Spec: Critical Path Analysis — Exam style questions

**Status:** implemented (AS and A-level), 2026-10-18. Built on `DecisionShell` inside `src/tools/Decision/CriticalPath.tsx`; generator `src/shared/decision/cpaExam.ts`; layout `ExamView.tsx` (shared with Network Flows); canvas `ExamCanvas` in the tool; tests `src/tests/cpaExam.test.ts`. Evidence: `specs/exam/critical-path-analysis.md` (AS 7366, A-level, legacy papers).

## Why
The skill tabs drill one skill each (`specs/cpa-skill-tools.md`). The papers set **one network followed by a chain of lettered parts** with marks. This adds a **Practice | Exam style** switch beside AS / A-level; each chain is built from the same generators and solvers as the skill tabs, on one shared network, so a model answer and its stepped working cannot drift from the skills.

## How it behaves
- Same as Network Flows exam style: the student reveals each part's answer (with its B1 / M1 / A1 / E1 / R1 mark lines under it), marks themselves, and opens the (?) to play the step-by-step working on the pinned picture. No typed answers, no scoring.
- The pinned picture is the network (and whatever the question gives: the precedence table, the workers table, three options). Where the answer is drawn (a network, a cascade chart, a histogram, a levelled histogram) the part says "Shown on the diagram" and the chart appears under the network when the answer is open.
- **Worksheet** generates several questions; **Print** gives the paper (a blank figure under each part whose answer is drawn: blank axes, a network with only Start and End) then the mark scheme.
- Levels are the size of the papers: **Level 1: 8–9 activities, Level 2: 10–12**. "Choose the levelled histogram" stays at 8–9 (its second level has several workers each).
- Generated, not banked: real questions are not reproduced; every number comes from the solvers.

## AS chains (`exAsAny` picks one)
| Tab | Parts (marks) | Paper |
|---|---|---|
| **Network, then a change or a claim** (`exBuild`) | (a) construct the network from the table and fill in earliest start / latest finish (4: M1 A1 B1 B1F) · (b) the new minimum time after an activity is extended (2: M1 A1F) **or** comment on a claimed finish time (2: E1 E1) = **6** | AS Q2, Q3 |
| **Times and Glyn's claim** (`exClaim`) | (a)(i) times (3) · (a)(ii) minimum time (1) · (b) critical activities (1) · (c)(i) show "add the critical durations" is false (1) · (c)(ii) when it is true (1) = **7** (always two critical paths) | AS Q4 |
| **Effect of a change** (`exChange`) | shape 1: (a) critical path (1) · (b) effect of a delay on the earliest start / latest finish of named activities (3) = **4**; shape 2: (a) times (3) · (b) a delay "up to d": does the minimum time increase? (2) = **5** | AS Q5, Q1 |
| **Clock times and a second project** (`exClock`) | (a)(i) precedence table from the network (1) · (a)(ii) times (2) · (b)(i) which activity must start first and why (2) · (b)(ii) clock finish time (1) · (c)(i) durations in minutes of a second project timed partly in seconds (1) · (c)(ii) latest time to start it (2) = **9** | AS Q8 |
| **Missing values** (`exMissing`) | (a) a missing earliest start or latest finish x, circle one of four (1) · (b) another, y (1) · (c) a statement about the duration d of a critical activity, circle one (1) = **3** | AS Q6, Q7 |

## A-level chains (`exAlAny` picks one)
| Tab | Parts (marks) | Paper |
|---|---|---|
| **Times and a cascade chart** (`exCascade`) | (a)(i) times (2) · (a)(ii) critical path **or** the float of an activity (1) · (b) cascade chart, early start, floats shown (3: M1 A1 A1) · **(c)** the effect of removing a critical activity (2), with the critical-path variant = **8** (the float variant = **6**) | AL Q1, Q3 |
| **Table, histogram and levelling** (`exTable`) | (a)(i) network from the table (2) · (a)(ii) times (3) · (b) both critical paths (1) · (c)(i) resource histogram, critical path on the bottom, one worker each (2) · (c)(ii) the effect of a worker limit on the minimum time (2: M1 R1) = **10** (always two critical paths) | AL Q5 |
| **Histogram and levelling** (`exHist`) | (a) critical path (1) · (b) resource histogram, workers per activity given (3) · (c) the minimum time with a worker limit, levelled histogram drawn (3) = **7** | AL Q2 |
| **Which to shorten and a limitation** (`exShorten`) | (a) times (2) · (b) which activity to reduce to 1, with a reason (3: M1 M1 R1) · (c) a limitation of the model and its effect (2: B1 E1) = **7** | AL Q6 |
| **Choose the levelled histogram** (`exPick`) | (a) tick the correctly levelled histogram of three (1) = **1** | AL Q4 |
| **Levelling and worker allocation** (`exAlloc`) | (a) times (2) · (b) critical paths (1) · (c) histogram (3) · (d)(i) minimum time with a limit (2) · (d)(ii) allocate the activities to that many workers (2) = **10** — in the style of the earlier specification (worker allocation is not in the current papers) | legacy |

## Built from the skill generators
Every part is a skill generator run on the shared network (`fixed`): table from a network, full analysis, critical paths (and "which first"), delays and changes (a set delay, a range, a removal, named activities), clock times (a second project), missing values, explain and justify (claims, Glyn, limitations), cascade chart, histogram (stepped blocks), levelling (and choosing a histogram), worker allocation, which to shorten. The mark scheme lines are the papers' (AQA wording, adapted to the generated numbers). Hand-built where there is no skill tab: the minimum-time part, a float part, a circle-one statement about d.

## Tests (`src/tests/cpaExam.test.ts`)
Every chain at both levels builds with exactly the parts and marks above, the mark codes are valid, every part has a model answer or an answer picture and working. The answers are re-checked against the independent reference: asClaim (minimum time, critical activities, the sum of the critical durations); asBuild (the change's new time recomputed, a claim's verdict); asChange (both shapes, the named activities' recalculated times); asClock (clock arithmetic, exactly one critical source activity, the seconds conversion); asMissing (x, y and d, four distinct options); alCascade (float or critical path, a complete cascade chart, the removed activity critical); alTable, alHist (histogram early starts, the levelled limit and time); alShorten (the named activity is the true best); alPick (exactly one valid histogram); alAlloc (levelling and allocation use the same limit and finish time).

## Not built
- Exam questions that need the student to draw the network from a table at A-level beyond `exTable`; late-start histograms and cascade charts as exam parts (the skill tabs have them).
- Typed-answer marking, scoring, timers (as in Network Flows).
