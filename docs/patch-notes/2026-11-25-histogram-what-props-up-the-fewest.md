Strand: Maths

## 2026-11-25 — Critical Path histogram: show what props up the fewest workers

Branch `claude/stoic-goldberg-xmi9tw`. Area: `src/shared/decision/cpa.ts` (`proveFewest`, `floorSentence`), `cpaSolve.ts` (`propView`), `representations/GanttView.tsx`, `representations/HistogramView.tsx`, `src/tools/Decision/CriticalPath.tsx`, `src/tests/levellingMethod.test.ts`.

- **Every "fewest" and "show N − 1 is not enough" question now shows where activities overlap and cannot slide clear within their float.** Before, only about a third of them did: when the total work ÷ the time also gave the answer, that sum was used and no overlap was drawn.
- **Order of proof:** (1) one moment where the activities that must be running add up to the answer (red stretches on the cascade chart and a dashed line at that time, as before, now chosen first); (2) new: the shortest stretch of time whose guaranteed work ÷ its length needs the answer. That stretch is shaded as a band on the cascade chart and on the histogram, and the sentence says how much of each activity must fall inside it however it is slid; (3) only if nothing shorter works, all the work ÷ the minimum time.
- The answer sheet and the "Why no fewer" / "Must run together" steps use the same sentence (`floorSentence`), so the working and the answer cannot disagree.
- Measured over 150 generated one-, several- and mixed-worker questions, a moment or a window proves the answer in every one-worker question and in about 55–60% of several- and mixed-worker ones; the rest are the "show N is enough" questions, which never claimed a minimum.
- Not done: "Show that N is enough" questions still do not draw a proof (they do not claim N is the fewest); the dashboard Review for the Critical Path tool is not set; the planner Build Log is not written.
Agent: Claude Code
Notes: planner Build Log block not written (still to do).
