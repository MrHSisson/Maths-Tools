# Tool Spec: Network Flows — Exam style questions (AS first)

**Status:** implemented (AS only; A-level to follow). Built on `DecisionShell` inside `src/tools/Decision/NetworkFlows.tsx`; generator `src/shared/decision/flowExam.ts`; layout `src/shared/decision/ExamView.tsx`; tests `src/tests/flowExam.test.ts`.

## Why
The skills tabs drill one skill each. The target is AQA exam questions, which are **one network followed by a chain of parts** (3–7 marks at AS) in a fixed order. This adds an "Exam style" practice mode that generates those chains, with a model answer and a mark scheme the student self-marks against. Evidence: the measured AQA question dataset the teacher supplied (AS 7366/2D, 2018–2025).

## Decisions (teacher, 2026-10-17)
1. **Placement:** a **Practice** switch (Skills / Exam style) inside Network Flows, beside AS / A-level. Exam style is **AS only** for now; the switch is hidden for A-level.
2. **Marking:** the student sees the question, reveals a model answer part by part, and **ticks the marks they earned** against a mark scheme. There is no typed-answer marking.
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

## Not built yet
A-level exam chains; printable question and mark-scheme sheet; a running score across questions; Tier 3 "stretch beyond AQA" sizes (inferred, not measured).
