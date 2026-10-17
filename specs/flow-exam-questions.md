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

## Answers on the diagram
If an answer can be drawn on the figure it goes on the figure, not in text. A part with `onDiagram` has no written model answer: the question gives the network and revealing the answer fills it in — the potential increases and decreases (A-level; potentials only, no flows), or the added supersource / supersink arcs with their capacities. Parts whose answer is a calculation or a sentence (cut sums, conservation, bounds, claims) stay as text. The supersource / supersink are only a device for the working: they are never pre-drawn where the student adds them, and the final flow is drawn on the network as the question gave it. Each part carries a typed `role` (`potentials` · `augment` · `superAdd`) so printing never reads the wording.

## Layout
Context (title, marks, time, the setting sentence) above the network. Right-hand side: a **Show individually | Show all parts** switch and "Part n of N". Individually: the part card with **Back · Show answer / Hide answer · Next** fixed at the foot (no lettered tabs); **Show all parts**: every part in a scrolling list, with Show all answers. The picture is pinned in view in both views (sticky on a phone). On a big screen the whole area is one laptop screen tall (`STAGE_H`); from `lg` down it stacks. This is the layout every exam-style tool will share (Network Flows first; A-level ToolShell tools such as Factor Theorem later, through an "Exam" mode).

## The (?) working
`ExamPart.working` holds the skill solver's steps for parts that match a skill: cut value (AS cuts, flow-in-equals-flow-out cuts, lower-capacity cut), missing flow, supersource / supersink (first two beats at A-level), label the potentials (the first beat of the augmentation working), flow augmentation to the maximum flow, prove maximal with a cut, restricted vertex (node capacities, building up from no flow). The (?) plays them stepped (no Show all), like Worked Example, and the pinned picture follows each step. Parts with no skill (bound statements, claims, which pipe to upgrade) show `explain` lines instead.

## Practice | Worksheet and printing
The **Practice | Worksheet** switch sits in the topic chooser (tabs on a phone or portrait tablet). Worksheet mode is like the other tools': its own Level / Question Options, **Questions** (1–10), **Generate** (a fresh set, never the question on screen), the questions as clickable cards (click one to open it in full with its parts, answers and working), **Show Answers**, and the green **Print** split button (Both / Questions / Answers). All question papers print first, then all mark schemes (`printExam.ts`; "Question n of X").
- **Paper:** name / date, marks and time, the context, the network, then each part with its marks and room to answer (ruled lines, more for more marks). Potentials get one blank network; flow augmentation gets an Augmenting path / Extra flow table and a blank network for the maximum flow; potentials followed by augmentation share ONE blank network (potentials crossed out and updated on it); where a supersource / supersink is to be added, the add-it part's blank network is reused for the potentials and paths, and none of these has them drawn. Blank means no capacities and no flows (the question picture above carries them).
- **Mark scheme:** each part's answer (the filled-in network for drawn answers) and its B1 / M1 / A1 / E1 / R1 lines.
- The print window is opened at the click (before the slow rendering) so browsers do not treat it as an unrequested popup.
