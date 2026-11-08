# Resource histogram and resource levelling
- **Status:** building
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

- 2026-11-07 (session 1 of 3): levelling engine and generator built. `levelMethod` (quick sums, ranked list, tries) sits beside `levelSchedule` in `cpa.ts`; `cpaLevel` has the three levels and filters (`levelLevel`); the levelling tab has *Ask for*, *Workers per activity (Level 3)* and *Most tries (Level 3)*; `src/tests/levellingMethod.test.ts` covers the fixture, random networks and the level invariants. Decisions: Levels 1 and 2 need exactly 1 try (the spec table says 1-2 for Level 2; the kickoff's "top option leaves no clash" was followed); Level 2 workers are 1 to 4 each with the largest at least 3; "new start of the last activity" is only offered where one activity ends the project, which excludes the 10-12 activity networks, so Level 3 falls back to the time; the exam chains still use the old `levelType` question.
- 2026-11-07 (session 2 of 3): the levelling walkthrough. `solveLevelMethod` (cpaSolve.ts) gives the six steps (histogram, first clash, quick sums, a try per option with ghost and arrow, a knock-on step per extra clash, the check, the final answer with the write-up and model answer); `HistViewState` and `HistogramView` gained dim, clash band, ghost, knock-on and a histogram per try (`LevelData.tryHist`); the quick-sum table appears in the reference panel on its step. A daily-totals row under the histogram (in the spec) was tried and removed at Harry's request; the spec's totals-row mentions are superseded. The exam chains still use the old walkthrough (no method data).
- 2026-11-07 (after session 2): walkthrough text cut to a line or two per step; new drawing order (critical bottom, then longest first, no holes or overhangs) in `stepStack` for the earliest-start histograms and the three-level levelled pictures.
- 2026-11-07 (session 3): the histogram tab. Levels 1 and 2 (drawing, one or several workers, network size option) and Level 3 cut the peak within the float (`CutData`, `cutSearch`, `solveHistogramCut`): fewest / show N / can it be N − 1, floors (worker-days, must-run), at most two moves, cascade chart with float tails beside the histogram. The must-run stretches are described in words, not shaded.
- 2026-11-08: heavy-task queue exclusion. A literal rule ("most tasks need more than half the workers") was tried and dropped: it flags Legacy Q11 (7 of 9 tasks heavy), a real Level 3 question, and misses A-Level Q2 (5 of 11) and OUP Q3. What excludes the queue questions is the tries cap: the four "beyond caps" fixture questions need 72, 14, 40 and 69 tries against a most of 8, so they cannot be generated; a test checks it. Spec wording to update: the queue exclusion is by tries, not by share of heavy tasks.

## Next steps
- Histogram tab: the new stacking order in the renderer; merge Levels 1 and 2; the new Level 3 (cut the peak within float) with its walkthrough and floors.
- Levelling walkthrough: the six-step developing picture, the tries count, the model answer layout and the write-up.
- Shade the must-run stretches on the cascade chart (spec: "shade these stretches on the Gantt chart").
- Generation time of histogram Level 2 (a second or more now and then).
- Check the new levelling steps on phone and tablet.
- Check Level 3 generation time (a fit can take about a second); the Level 3 options show on every level of the tab (the shell cannot hide an option by level).
- Later, via `docs/pathways/decision-exam-questions.md`: a CPA corpus file and levelling exam parts (plan in the spec; not a priority).

## Where to read more
`specs/resource-levelling.md`, `specs/cpa-skill-tools.md`, `specs/exam/critical-path-analysis.md`, `src/shared/decision/cpa.ts`, `src/shared/decision/cpaSolve.ts`, `src/tools/Decision/CriticalPath.tsx`.
