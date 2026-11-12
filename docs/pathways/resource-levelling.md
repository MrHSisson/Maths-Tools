# Resource histogram and resource levelling
- **Status:** building
- **Updated:** 2026-11-08 (later session: print grid, basket Reload, Show N − 1)

## Intention
Rework the A-Level **Resource histogram** and **Resource levelling** tabs of the Critical Path tool so that they only generate questions students could reasonably meet in an exam, and so that the levelling walkthrough teaches a method that finds the true minimum (quick sums and one ranked list) with a developing picture. Full design: `specs/resource-levelling.md`.

## Progress
- 2026-11-07: research and design done with Harry (11 real exam questions, the OUP and Cambridge chapters, several thousand generated questions). The method found the true minimum every time; one-pass rules did not. Real-question data is stored for tests only: `src/tests/fixtures/levelling-real.json`.
- 2026-11-07 to 2026-11-08: **the tool build is done** (branch `claude/new-session-6gg0my`, on top of `main`, not merged). What exists, and where it departs from the plan (full list in `specs/resource-levelling.md`, "As built"):
  - **Method:** `levelMethod` (quick sums, one ranked list, tries) beside `levelSchedule` in `cpa.ts`; tested against the fixture, random networks and an independent solver.
  - **Levelling tab:** three levels and the filters; options *Ask for*, *Workers per activity* and *Question size* (Level 3 ones use the new Decision shell field `forLevels`); the six-step walkthrough (histogram, first clash, quick-sum table, each try drawn with ghost and arrow, a step per knock-on clash, the check, the answer with a written "Write it up" card).
  - **Histogram tab:** Level 1 draw (network size option), Level 2 draw with several workers, Level 3 cut the peak within the float (fewest / show N / show N − 1 is not enough (total work ÷ workers, no levelling); worker-days and must-run floors, must-run stretches shaded on the cascade chart).
  - **Drawing order:** critical along the bottom, then longest first, no holes or overhangs.
  - **Decided differently from the plan:** no daily totals row; text kept to a line or two per step; Levels 1 and 2 need exactly one try; queue questions are left out by the tries cap, not a rule on heavy tasks (a heavy-task rule would drop Legacy Q11); "new start of the last activity" is not offered at levelling Level 3.
  - **Later the same day (branch `claude/focused-hopper-nndnwu`):** a fine grid on blank print histograms; **Reload** on each print-basket question; and the histogram Level 3 ask "Show N − 1 is not enough", which needs only the sum (total work ÷ workers) or the must-run activities, no sliding.
  - **Independent testing:** five test agents (accuracy against their own solver, drawn geometry, appearance of each tab, option fuzzing) found no mathematical error and no overlap or hole; their presentation and wording findings are fixed.

- 2026-11-12: **Level 3 Question size** (branch `claude/levelling-question-size`, not merged). "Most tries" is replaced by *Question size*: Short (the knock-on's own best option clears it, 2 tries), Exam (default: one knock-on, 2 tries, may go back to a first-list option that clears at once) and Stretch (up to 2 knock-ons, 3 tries; not encouraged). Quick sums are capped at 6 / 6 / 9. Real questions: Legacy Q4 fits all three, Q11 and Q14 fit Stretch only, Q15 and 29.2B Q1 (3+ knock-ons) are spot-it questions and fit none, by Harry's decision. Supply and speed: 30 questions for each size and workers setting all generated, about 0.2 to 0.4 s each and 1.1 s at most; walkthroughs are 8 steps (Short, Exam) and 8 to 10 (Stretch); Exam goes back to the first list in about 1 question in 10.

## Next steps
- Check the new levelling and histogram steps on phone and tablet, then merge `claude/new-session-6gg0my` (a PR has not been opened).
- Generation time: histogram Level 3 and Level 2 can still take up to about a second now and then.
- "Last start" is still a selectable wording at levelling Level 3 (the shell cannot hide one choice by level); it asks for the time there.
- Print basket: questions can be saved and printed later, on this device or by link (`printBasket.ts`).
- Printing: question and answer sheets exist for the histogram and levelling tabs (one question per A4 page); several questions per sheet and squared-paper histograms are not built.
- Later, via `docs/pathways/decision-exam-questions.md`: a CPA corpus file and levelling exam parts on the new engine (the exam-style chains still use the older levelling question; plan in the spec; not a priority).

## Where to read more
`specs/resource-levelling.md` (start with "As built"), `specs/cpa-skill-tools.md`, `specs/exam/critical-path-analysis.md`, `src/shared/decision/cpa.ts` (`levelMethod`, `cutSearch`), `src/shared/decision/cpaSolve.ts` (`solveLevelMethod`, `solveHistogramCut`), `src/tools/Decision/CriticalPath.tsx`, `src/tests/levellingMethod.test.ts`.
