# Tool Spec: Network Flows — Exam style questions (AS first)

**Status:** implemented (AS and A-level). Built on `DecisionShell` inside `src/tools/Decision/NetworkFlows.tsx`; generator `src/shared/decision/flowExam.ts`; layout `src/shared/decision/ExamView.tsx`; tests `src/tests/flowExam.test.ts`.

## Why
The skills tabs drill one skill each. The target is AQA exam questions, which are **one network followed by a chain of parts** (3–7 marks at AS) in a fixed order. This adds an "Exam style" practice mode that generates those chains, with a model answer and a mark scheme the student self-marks against. Evidence: the measured AQA question dataset the teacher supplied (AS 7366/2D, 2018–2025).

## Decisions (teacher, 2026-10-17)
1. **Placement:** a **Practice** switch (Skills / Exam style) inside Network Flows, beside AS / A-level. Exam style is **AS only** for now; the switch is hidden for A-level.
2. **Marking:** the student sees the question, reveals each part's answer (just the answer, with the marks it earns listed under it) and marks themselves. A **(?)** beside the answer opens the step-by-step explanation. No tick boxes, no score, no typed-answer marking.
3. **Scope:** AS first. A-level chains (augmentation from a given flow, prove maximal, critique a claim, restricted node) come later.

## Generated, not banked
Questions are generated from part-chain templates, so every number comes from the existing solver and each mark scheme line is built from the working. Real AQA questions are not reproduced; the questions are original, in the same style. A small hand-picked set of contexts supplies units and wording.

## The three AS chains (one tab each, plus "Any exam question")
| Tab | Parts (marks) | Dataset source |
|---|---|---|
| **Cuts and bounds** (`examCut`) | (a) value of a named cut (1) · (b) write down a cut with a given value (1) · (c) deduce the bound on the maximum flow and justify it (2) = **4** | AS 2022 Q2, 2018, 2019 |
| **Flow in = flow out** (`examFlow`) | (a) one missing arc (2) · (b) a second missing arc (2) or the value of the flow (1) · (c) prove the maximum flow is at most V with a cut (2) = **5–6** | AS 2024 Q8 |
| **Supersource / supersink** (`examSuper`) | (a) list the sources and sinks (2) · (b) add a supersource / supersink with capacities (2) · (c) value of a cut in the new network (1) · (d) deduce the bound (1) = **6** | AS 2018 Q4, 2021 Q3 |

**Levels** are the network size, as elsewhere: Level 1 uses 6–7 vertex networks, Levels 2–3 use the 8-vertex networks (AS papers use 7–9 nodes). At Level 3 the supersource chain has several sources **and** sinks.

## Mark scheme
One line per mark, each worth 1: `B1` (independent), `M1` (method), `A1` (accuracy), `E1` (explanation), `R1` (reasoned argument), with `F` for follow-through. Wording is original but follows the stable pattern of the real schemes:
- cut value: B1, units condoned; only arcs from the S side to the T side are added (no minimums at AS);
- bound on the maximum flow: **must be a weak inequality (≤)**; equality is not accepted; E1 for naming the maximum flow–minimum cut theorem ("the maximum flow is less than or equal to the value of any cut");
- conservation: M1 flow in = flow out at a named vertex, A1 the value;
- supersource / supersink: M1 the arcs, in the correct direction, to the right vertices; A1 capacities at least the total capacity of the arcs leaving each source (or arriving at each sink);
- proving a bound with a cut: M1 identifies the cut, R1 completes the argument with the theorem.

## Correctness (the tests check)
- Every part's marks equal its scheme lines; total marks and suggested time (about 1.1 minutes a mark) are consistent.
- Cut values and bounds are recomputed independently (`cutCapacity` / brute-force minimum cut); (c) in "Cuts and bounds" is always the smaller of the two cuts and never claims equality.
- "Flow in = flow out": the missing flows satisfy conservation; the cut in (c) has exactly the stated value, which is the minimum cut.
- "Supersource / supersink": the listed sources and sinks match the network; the added arcs carry at least the stated totals.
- The picture reveals each part's own state when its answer is shown (the cut, the solved flow, the added arcs).

## A-level chains (built 2026-10-17)
Same layout and marking. The Practice switch now shows for both courses. Networks are the 6–7 and 8 vertex templates at Levels 1–2 and the exam-sized 9–10 vertex templates (`EXAM_TEMPLATES`, `EXAM_SUPER_TEMPLATES`) at Level 3. The **Network** choice (capacity only / min and max) applies to the augmentation chains; the lower-capacity chain always has lower and upper capacities.
| Tab | Parts (marks) | Dataset source |
|---|---|---|
| **Augment and prove** (`examAug`) | (a) potential increases and decreases (2) · (b) flow augmentation from the given flow, with an "Augmenting path / Extra flow" table (3–4: M1, A1, A1, B1 value) · (c) prove the flow maximal with a cut (2) · (d) comment on a claim that increasing one pipe raises the maximum flow (2) · (e) at Level 3 on a capacity-only network, a restricted vertex (2) = **9–11** | A-level specimen Q6, 2019 Q7, 2022 Q8 |
| **Supersink, augment and prove** (`examAugSuper`) | (a) add the supersource / supersink with capacities, lower AND upper in min/max mode (2) · (b)–(d) as above = **9–10** | A-level 2022 Q8, 2024 Q8 |
| **Lower capacities, claims and upgrades** (`examLower`) | (a) value of a cut with a backward arc, subtracting its lower capacity (1) · (b) what it means for the maximum flow, in context with units (1) · (c) comment on a claimed maximum flow that is above the cut (2) · (d) which one pipe to upgrade, and the new maximum flow (2) = **6** | A-level 2023 Q4, 2019 Q7(c) |
Rules from the dataset applied: the augmentation extras must total the uplift and the answer needs units; the proof names the maximum flow–minimum cut theorem; a claim question ends in an explicit verdict ("correct" / "incorrect"), the examiners' commonest lost mark; the "which pipe" question is only asked when exactly one pipe's upgrade helps. The claim's truth is decided by recomputing the maximum flow with the pipe raised, never by a rule of thumb. The proof uses a minimum cut with several vertices on each side, not just S or T.

## Not built yet
Tier 3 "stretch beyond AQA" sizes (inferred, not measured); a mixed set of different exam chains in one print; exam mode for the A-level ToolShell tools (Factor Theorem first: the layout would be shared). A running score across questions is **not wanted**. Printing is built (see below).

## Answers on the diagram (2026-10-17)
If an answer can be drawn on the figure it goes on the figure, not in text. A part with `onDiagram` has no written model answer: the question shows the **blank figure** (the network with capacities and the given flow) and revealing the answer fills it in: the potential increases and decreases (A-level), or the added supersource / supersink arcs with their capacities. Parts whose answer is a calculation or a sentence (cut sums, conservation, bounds, claims) stay as text. **Printing (later):** a sheet draws each `onDiagram` part's blank figure beneath the question for the student to complete (the base `examView`, with no `view` applied), and the filled-in `view` on the mark scheme page.

## Layout (2026-10-17)
One part at a time by default: a context card (collapsible), the part card with Back / Show answer / Next (the context sits above the network; no lettered tabs, just a Show individually | Show all parts switch), and Show all answers. **Show all parts** shows every part in a scrolling list (fixed height on a big screen). The picture is sticky in both views, so a long list or answer never leaves it behind. This is the layout every exam-style tool will share (Network Flows first; A-level ToolShell tools such as Factor Theorem later, through an "Exam" mode).

## The (?) working (2026-10-17)
`ExamPart.working` holds the skill solver's steps for parts that match a skill: cut value (AS cuts, flow in = flow out cuts, lower-capacity cut), missing flow, supersource / supersink (first two beats at A-level), flow from potentials, flow augmentation to the maximum flow, prove maximal with a cut, restricted vertex (node capacities). The (?) plays them like Worked Example and the pinned picture follows each step. Parts with no skill (bound statements, claims, which pipe to upgrade) show `explain` lines instead.

## Printing (2026-10-17)
Burger menu → "Print question and mark scheme (PDF)". Sheet 1: name / date, marks and time, the context, the network, then each part with its marks and room to answer; a part whose answer is drawn on the network gets a blank copy of the network, flow augmentation gets an Augmenting path / Extra flow table and TWO blank copies of the network (1: potentials and augmenting paths; 2: the maximum flow), and the potentials part one blank copy — blank means no capacities and no flows (the question picture above carries them), other parts get ruled lines (more for more marks). Sheet 2 (new page): the mark scheme, each part's answer (filled-in network for drawn answers) and its mark lines. Possible next: several questions per print, a worksheet of mixed exam chains.

Potentials followed by augmentation share ONE blank network (the potentials are crossed out and updated on it as the paths are used); the augmentation part then adds one more for the maximum flow. Augmentation with no potentials part before it gets two.

Printing several: Print exam questions… asks for a count (1–10) and whether to include mark schemes; the on-screen question plus new ones with the same settings are printed as all the question papers followed by all the mark schemes.

Printing is a Worksheet tab beside Practice, like the other tools: Questions (1–10) · Generate · Show Answers · Print (Both / Questions / Answers, the same green split button). The preview shows each question's network and parts; Show Answers adds the model answers.
