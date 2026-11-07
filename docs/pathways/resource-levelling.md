# Resource histogram and resource levelling
- **Status:** idea
- **Updated:** 2026-11-07

## Intention
Rework the A-Level **Resource histogram** and **Resource levelling** tabs of the Critical Path tool so that they only generate questions students could reasonably meet in an exam, and so that the levelling walkthrough teaches a method that finds the true minimum (quick sums and one ranked list) with a developing picture. Full design: `specs/resource-levelling.md`.

## Progress
- 2026-11-07: research and design done with Harry. Checked against 11 real exam questions (A-level pack Q2, Q5; legacy pack Q1, Q2, Q4, Q8, Q9, Q11, Q14, Q15, Q17), the OUP and Cambridge textbook chapters, and several thousand generated questions. The method found the true minimum every time; one-pass rules did not. Real questions have at most 2 clashes, a peak at most 2 over the limit, and 1–2 changes; the current Level 3 goes far beyond that.
- Decided:
  - **Histogram tab:** Level 1 one worker (network size as an option), Level 2 several workers, Level 3 cut the peak within float.
  - **Levelling tab:** Level 1 one worker with no knock-on, Level 2 several workers with no knock-on, Level 3 knock-on with a Maximum tries option (3 / 5 / 8, default 8).
  - **Drawing:** critical path on the bottom row, then longest to shortest upwards; stepped blocks allowed; no holes or overhangs.
  - **Not built:** "tick the correct histogram". Worker allocation is untouched. Heavy-task queue questions are parked.
- Real-question data is stored for tests only: `src/tests/fixtures/levelling-real.json`.

## Next steps
- Histogram tab: the new stacking order in the renderer; merge Levels 1 and 2; the new Level 3 (cut the peak within float) with its walkthrough and floors.
- Levelling tab: implement the method beside `levelSchedule`; the generation filters and three levels; the question options (wording, workers, Maximum tries).
- Levelling walkthrough: the six-step developing picture, the tries count, the model answer layout and the write-up.
- Tests: invariants (method equals solver, filters hold, tries within the cap, quick-sum floor property); the real-question fixtures; update the old Level 3 assertions in `cpaSkills.test.ts`.
- Later, via `docs/pathways/decision-exam-questions.md`: a CPA corpus file and levelling exam parts (plan in the spec; not a priority).

## Where to read more
`specs/resource-levelling.md`, `specs/cpa-skill-tools.md`, `specs/exam/critical-path-analysis.md`, `src/shared/decision/cpa.ts`, `src/shared/decision/cpaSolve.ts`, `src/tools/Decision/CriticalPath.tsx`.
