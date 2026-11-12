# Critical Path Analysis — Resource histogram and Resource levelling (rework spec)

**Status:** implemented (tool build, 2026-11-08): the histogram and levelling tabs, the method, the walkthroughs and the options. Still planned: the exam-style parts (see the last sections) and a phone and tablet check. Pathway: `docs/pathways/resource-levelling.md`.

## As built (2026-11-08) — where the build differs from the plan below

Read this first; the sections below are the original plan and some details were changed on purpose.

- **Question size (2026-11-12) replaces "Most tries":** the *Question size* option (Level 3 only, `forLevels`; default Exam) shapes Level 3. Every Level 3 question's first try leaves a clash (the one knock-on every size allows). **Short:** the smallest option at that knock-on clash clears it (2 tries, at most 6 quick sums, no going back). **Exam:** still one knock-on and 2 tries, but the next try may go back to an option from the first list (when every option the knock-on added is bigger) as long as it clears at once; at most 6 quick sums. **Stretch:** up to 2 knock-ons (3 tries, at most 9 quick sums), where the go-back try may leave a clash and its best option then clears it; not encouraged. Quick sums are the whole ranked list. Levels 1 and 2 still resolve on the first try. Real questions: Legacy Q4 fits all three; Legacy Q11 and Q14 (two knock-ons) fit Stretch only; Legacy Q15 (three) and OUP 29.2B Q1 with 11 workers (five) fit none: those need 3+ knock-ons, are spot-it questions rather than the method, and come from the older Legacy pack, so they are deliberately not covered. Code: `LEVEL_SIZES`, `levelCounts`, `levelFits` in `cpa.ts`; `levelSize` replaces `levelMaxTries`. An old saved or shared `levelTries` value is ignored and the size is Exam. Where this spec below says "Maximum tries" or "tries cap", read the size's shape.
- **Exam technique (Harry, 2026-11-12):** questions the routine handles badly (queues of heavy activities such as A-Level Q2; they need dozens of tries) are heuristic: look for the pattern first (do activities needing over half the workers, or two or more workers, never overlap? add them up), then use the method, and if both feel like a dead end draw a levelled histogram anyway, which earns 2 of 3 marks even if it is not optimal. The answer there is the time only, since the order of activities is not unique. No "spot it" question style is built: the pattern is not one rule (it fits A-Level Q2 only), and a generator would cover about one real question in ten. The deck `resource-levelling` teaches this as its last slide.
- **Method and engine:** as planned. `levelMethod` (cpa.ts) returns the minimum, the tries and the ranked list; `levelSchedule` stays the ground truth. Ties on the list: an option with float first, then the larger float, then letter. Tested against the real questions, 120 random networks, and by five independent test agents (their own brute-force solver agreed on about 160 questions).
- **Levels 1 and 2 need exactly one try** (the first option tried leaves no clash). The table's "1–2" for Level 2 was not followed, so Legacy Q2(e) (two tries) counts as Level 3. Level 2 workers are one to four each with the largest at least three; Level 3 workers are an option (one / 2 to 4 / 1 to 4).
- **Queue questions** (most tasks need over half the workers) are left out by the size caps, not by a rule on the share of heavy tasks: such a rule would drop Legacy Q11, a real Level 3 question, and miss A-Level Q2. The four "beyond caps" fixture questions need 14 to 72 tries against a most of 8; a test checks it.
- **Last start** (new start of the last activity) needs a network that ends in one activity; the 10–12 activity networks never do, so Level 3 asks for the time instead.
- **Walkthrough:** the six steps as planned, with these changes: **no daily totals row** (taken out; the picture is clearer without it), the step text is a line or two, each try is drawn as its own histogram, and the reference picture (network, cascade chart, floats) is one picture at a time behind arrows, with the quick-sum table taking its place on its own step. The model answer is a written "Write it up" card (numbered lines and the filled-in write-up) on the final step only. Options that cannot beat the answer show as "pending" chips, not greyed.
- **Drawing order:** critical along the bottom, then longest first, no holes or overhangs, in `stepStack`. The exam-style chains' levelling picture keeps its older start-time order.
- **Histogram tab:** (Level 3 shows the network with the critical path and the cascade chart behind arrows, so precedence can be read.) Levels 1 and 2 draw (network size is a Level 1 option); Level 3 cuts the peak: fewest workers, show N is enough, or can it be N − 1, with the worker-days and must-run floors (must-run stretches are shaded red on the cascade chart, with the busiest time marked; that step switches to the cascade chart by itself). At most two activities move (pushed ones count). A floor that proves the answer is needed for "fewest" and "N − 1"; otherwise the question asks to show N.
- **Question Options:** *Ask for*, *Workers per activity* and *Question size* (levelling); *Network size*, *Workers per activity* and *Ask for* (histogram). Options that belong to one level use the new Decision shell field `forLevels`, so they appear only at that level. "Most tries" is the spec's "Maximum tries".
- **Workers notation:** when activities need different numbers of workers they are written D(3): the network boxes, the cascade chart rows and bars, histogram block labels, the clash sentence, the write-up, and the peak and must-run steps. One-worker questions keep plain letters.
- **Histogram given or drawn (Level 3):** an option; *Given* is the default. **Printing and the print basket:** the Resource histogram and Resource levelling tabs have "Print this question (A4)" and "Print the answer sheet (A4)" in the burger menu: network with times and critical path, cascade chart with floats, then the histograms (given, or blank to draw), on one A4 page. A printer icon beside the pin (and the menu) saves a question to a **print basket** (up to 30, kept in the browser, a saved question is its tab, level, options and seed) which prints questions, answers or both, one page each, and can be carried to another device as a link.
- **Exam-style chains** still use the old levelling question and the older greedy walkthrough (no method data, no size caps).
- **Not checked:** phone and tablet layouts of the new steps.
**Scope:** the A-Level **Resource histogram** and **Resource levelling** tabs of the Critical Path tool. Worker allocation (legacy, starred) is out of scope and untouched.

## Why this rework

Research with Harry (2026-11-07) against 11 real exam questions (A-level pack Q2, Q5; legacy pack Q1, Q2, Q4, Q8, Q9, Q11, Q14, Q15, Q17), two textbooks (OUP chapter 29, Cambridge chapter 5) and several thousand generated questions found:

- **Real questions are small.** At most 2 clashes in the earliest-start histogram, a peak at most 2 over the limit, and one or two changes fix them. Levelling parts carry 1–3 marks.
- **The current generator goes well beyond that.** Level 3 needs a median of 4 changes (up to 6); about half of Level 3 questions hold up 5+ activities; Level 2 overshoots the peak by 3+ in about a third of questions.
- **Simple one-pass rules are not safe.** "Hold the activity with most float" and "earliest LFT first" each get some real questions wrong (A-Level Q2: 108 instead of 96; A-Level Q5: 69 instead of 66; Legacy Q11: 29 instead of 27).
- **The method below always found the true minimum** in every test: 11/11 real questions, 250/250 exam-like generated questions, 300/300 tool questions and 4,651 random networks. Tested, not proven.
- **The current walkthrough** narrates the winning schedule as if it were a greedy sweep; it never shows the options or why nothing is faster.
- **"Which activities are delayed" is often not unique** (in more than half of generated questions there are several valid sets with the same minimum). The finish time, the extra time and the new start of the last activity are unique.

The solver (`levelSchedule`, exhaustive and tested against brute force) stays as the ground truth.

## The method (student-facing)

Five steps, one loop:

1. Draw the histogram (every activity at its earliest start) and the limit line. If nothing is over the limit, there is nothing to level.
2. At the **first clash**, do the **quick sum** for each activity running in it (including activities that started before the clash). Rank them in a list.
3. Try the smallest on the list (tie: take one with float).
4. No clash left? That is the minimum. Write it up.
5. A clash left? Do the quick sums at the new clash, add them to the same list, and go back to 3 — always taking the smallest on the **whole** list.

**Definitions**

- **Clash:** a time when the activities running need more workers than the limit.
- **Option:** hold back one activity in the clash until the next activity in the clash finishes.
- **Quick sum:** unlimited time + (new finish − LFT) of the activity held back; if it still finishes before its LFT the time is unchanged. At a later clash, use this or the time the route already has, whichever is bigger. It is a floor: an option can finish later than its quick sum, never earlier.
- **Try:** one option checked — the hold-back and its knock-ons followed on a row of daily totals. Not a drawing.
- **Knock-on:** an activity that must start later because something it waits for now finishes later.

**Why it works:** a try with no clash left finishes exactly on its quick sum, and every other option finishes at or above its own quick sum. So the first clash-free try reached, smallest first, cannot be beaten.

**Special case (not taught as the method):** when most tasks need more than half the workers, the project is effectively a queue (A-Level Q2; OUP Example 2(c)). Intuition beats the method there; such questions are excluded from the levels (as built: by the tries cap; see "As built").

## Drawing rules (both tabs, every histogram the tool draws)

- **Stacking order:** critical activities on the bottom row; then the remaining activities, longest first, working upwards; shorter activities on top. This keeps steps rare.
- **Stepped blocks are allowed** (a block drops down a row when the block beneath it ends). **No holes and no overhanging blocks** (AQA mark schemes do not condone overhangs; Cambridge "common error" box).
- Float is never drawn on a histogram.
- Every piece of a stepped block is labelled when it is wide enough.
- Check how the current renderer orders the stack (`HistogramView.tsx`, the `histShape` "whole"/"jump" options, and the "no hole-free stack" retry in `cpa.ts`) and change the ordering to the rule above.

## Tab 1 — Resource histogram

| Level | What students do | Examples |
|---|---|---|
| 1 | Draw the earliest-start histogram, one worker each | Exam drawing parts; OUP Example 1(a) |
| 2 | The same with several workers per task (heights, stepped blocks) | A-Level Q2(b) |
| 3 | **Cut the peak within float**: fewest workers for the minimum time; "show it can be done with N"; "can it be done with N − 1?"; a given limit that needs no extra time | OUP 29.2B Q1(b) (16 → 13), Legacy Q1(f) |

- Current Levels 1 and 2 (one worker, 8–9 and 10–12 activities) merge into the new Level 1, with **network size** as a question option. Current Level 3 (several workers) becomes Level 2.
- **Question options:** activities at earliest or latest start (Cambridge worked example 5.9); network size (Level 1); workers per task at Level 3 (one each / several / mixed).
- **Level 3 generation:** the peak must be reducible without extending the project; at most 2 activities must move (80–87% of generated questions need only one).
- **Level 3 method:** slide an activity in the peak within its float (every quick sum stays at the unlimited time); move any successor it pushes (float is shared along a chain); recheck the totals for a new peak.
- **Level 3 walkthrough:** the histogram with the peak highlighted beside the Gantt chart with float tails; the slide shown with its knock-on; the totals rechecked. Justify the answer with whichever floor proves it:
  - **Worker-days floor:** total worker-days ÷ project time, rounded up (the textbooks' worker-hours argument). Proves 98% of one-worker questions.
  - **Must-run floor:** each activity must be running from its latest start to its earliest finish; add those workers at each time and take the largest (shade these stretches on the Gantt chart). Proves about 40% of several-worker questions.
  - Otherwise use "show that N workers can complete it on time" wording, which only needs a valid schedule.

## Tab 2 — Resource levelling (the limit forces extra time)

| Level | Definition | Tries | Real examples |
|---|---|---|---|
| 1 | One worker each; the top option on the quick-sum list leaves no clash | 1 | A-Level Q5, Legacy Q17 |
| 2 | Several workers per task; the top option leaves no clash | 1 (as built; see "As built") | Legacy Q2, Legacy Q9 |
| 3 | Knock-on: the top option leaves a clash; one or several workers | up to the Maximum tries option | Legacy Q4, Q11, Q14, Q15 |

"No knock-on" allows a second clash in the starting histogram as long as the first fix clears it (A-Level Q5, Legacy Q2).

**Generation filters (every level)**

- The limit forces extra time (minimum > unlimited time).
- At most 2 clashes in the earliest-start histogram; peak at most limit + 2.
- The limit is at least the largest worker requirement of any single task.
- Level 1: every task needs one worker. Level 2: several workers (largest task needs at least 3). Level 3: either, controlled by the workers question option.
- Level 3: tries (counted by the method in this spec) at most the **Maximum tries** option.

Supply checked in testing: about 1 in 4 one-worker candidates qualifies for Level 1, more than half of several-worker candidates for Level 2, and about 74% of knock-on candidates fit within 8 tries.

**Question options**

- **Wording:** minimum completion time; minimum extra time; new earliest start of the last activity (only when one activity ends the project); "explain the effect of only N workers" (A-Level Q5 style). Do **not** build a "tick the correct levelled histogram" wording.
- **Workers per task** (Level 3): one each / several / mixed.
- **Maximum tries** (Level 3): up to 3 / up to 5 / up to 8 (default 8). Use "up to 3" for a first lesson on knock-ons.

**Answers**

- Only ask for values that are unique (finish, extra time, new start of the last activity).
- Where the model answer names delayed activities, label it as one valid way; other valid sets exist.

**Engine**

- Implement the method above (the ranked list) beside `levelSchedule`. The walkthrough and the tries count come from the method; the answer is checked against `levelSchedule`.

## The levelling walkthrough (developing picture)

The cascade chart and float table (earliest start, LFT, float) stay visible beside the picture throughout.

| Step | Picture | Text |
|---|---|---|
| 1. The histogram | Earliest-start histogram, the limit line, clashes shaded and labelled "needs 10 / limit 9" (the daily totals row was dropped) | "Without a limit the project takes 18 days." |
| 2. The first clash | Blocks in the clash highlighted, the rest dimmed; at Level 2 the worker sum is shown ("4 + 2 + 4 = 10") | The mark-scheme sentence: "D, E and F cannot all run at the same time: 10 > 9." |
| 3. Quick sums | A ranked table: hold back, waits until, new finish, LFT, quick sum; ties marked | "Smallest first; tie: take one with float." |
| 4. The try | The held block ghosted at its old place with an arrow to its new place; knock-ons in amber; the totals row updated | "No clash left, so the finish (23) equals its quick sum: this is the minimum." |
| 5. The check | The list as chips; options that cannot beat the answer greyed | "1 option checked; the others can't beat 23." |
| 6. Final answer | The levelled histogram drawn once, using the drawing rules | The answer in the chosen wording, then the write-up |

- **Level 3** adds a step between 4 and 5 for each knock-on: the new clash highlighted, its quick sums joining the list (the chips grow), then the next try as step 4.
- **Ties** in the walkthrough are broken by float, then by letter, so the walkthrough is deterministic.
- **Picture needs** (extend `HistViewState` as needed): a dimmed set, a labelled clash band, a ghost-and-arrow for the held block, a knock-on highlight, a totals row. The option list can use the existing `StepList` chips.

**The model answer (what a student writes)**

1. The clash sentence (the planned totals row under the cascade chart was dropped).
2. The quick sums.
3. One line per try, e.g. "hold E until 34 → no clash, finish 23".
4. The answer, then the write-up below (as built: one final histogram, and a "Write it up" card).

**Write-up template**

"____ and ____ cannot run at the same time, as that needs __ workers and only __ are available. ____ waits until ____ finishes, so ____ starts later. The new minimum completion time is ____."

## Validation

- **Invariant tests** on generated questions at every level:
  - the method's answer equals `levelSchedule`'s minimum;
  - the level filters hold (clashes, peak, extra time, workers, knock-on definition);
  - tries never exceed the Maximum tries option;
  - every option's finish is at or above its quick sum, and a clash-free try finishes exactly on it.
- **Real-question fixtures:** `src/tests/fixtures/levelling-real.json` (supplied with this spec). Numbers and mark-scheme answers only, for our use; never served as questions. Test that the solver reproduces every `minimumTime`, and that the method does for every entry whose `fits` is a levelling level.
- **Existing tests to update:** the levelling assertions in `src/tests/cpaSkills.test.ts` that require Level 3 to delay at least two activities including a critical one.

## Not in this build

- **Tick the correct levelled histogram:** not created.
- **Worker allocation:** untouched (legacy, starred).
- **Heavy-task queue questions** (A-Level Q2, OUP 29.2B Q3 with 4 or 5 workers): parked. If revisited, give them their own walkthrough based on the queue: tasks that cannot run beside each other are added up.
- **Split activities** (OUP 29.2A Q2(b)): not AQA; activities are always continuous.

## Exam-style questions — plan (not a priority build)

This belongs to `docs/pathways/decision-exam-questions.md` ("Move CPA onto the parts library and recipes"). When that work starts:

1. Create `specs/corpus/critical-path.md` in the same shape as `specs/corpus/network-flows.md`, tagging every paper question as a chain of parts.
2. Build the levelling parts on this spec's engine.

**Proposed levelling parts**

- `histogramDraw`, `peakWorkers` — draw the earliest-start histogram; state the workers needed.
- `cutPeakFloat` — fewest workers for the minimum time / show N suffices.
- `levelTime`, `levelExtra`, `levelStartLast` — minimum time, extra time, new start of the last activity.
- `levelExplain` — "explain the effect of N workers" (clash sentence + knock-on + time).

**First-pass tagging of the levelling-related questions supplied** (to be checked by Harry; marks from the papers and the exam report)

| Source | Q | Levelling parts | Notes |
|---|---|---|---|
| AL | 2 | `histogramDraw`(3) → `levelTime`(3) | 4 workers; 96 days; heavy-task queue, beyond the caps |
| AL | 4 | `skip:mcqLevelledHistogram`(1) | Not built |
| AL | 5 | `histogramDraw`(2) → `levelExplain`(2) | 2 members; 66 days; levelling Level 1 |
| L | 1 | `levelTime`(1) [(f), 2 workers] → one-worker time [(g)] | (f) fits in float: 34 hours; histogram Level 3 |
| L | 2 | `histogramDraw`(5) → `levelStartLast` + `levelExtra`(2) | 9 workers; J at 22, 5 days; levelling Level 2 |
| L | 4 | `levelExtra`(3) | 8 workers; 3 days; levelling Level 3 |
| L | 8 | `levelExtra`(3) | 6 workers; 5 days; beyond the caps (spot it: C starts day 12) |
| L | 9 | `levelExtra`(3) | 7 workers; 1 day; levelling Level 2 |
| L | 11 | `levelExtra`(3) | 3 workers; 3 days; levelling Level 3 |
| L | 14 | `levelTime`(2) | 2 workers; 28 days; levelling Level 3 |
| L | 15 | `levelTime`(2) | 2 workers; 31 days; levelling Level 3 |
| L | 17 | `levelExtra`(2) | 2 workers; 1 hour; levelling Level 1 |

The rest of each question (forward and backward pass, critical path, float, cascade chart, network from a table) is tagged with the general CPA parts when the corpus is written. Legacy Q19, Q21, Q22, Q23 and Q24 have not been read.

## Teaching sequence (for the lesson materials, not the tool)

1. **Histograms and cutting the peak within float.** OUP Example 1(a)/(b) and Example 2(b); Cambridge Exercise 5B Q1 (which graphs are histograms) and its no-holes / no-overhangs box; 29.2B Q1(b); Legacy Q1(f); the worker-hours argument (Cambridge Exercise 5B Q8).
2. **When the limit forces extra time.** A-Level Q5 as the worked example (the tie, and why holding C back fails); Legacy Q2; tool Levels 1–2; 29.2B Q1(c).
3. **Knock-on clashes and exam technique.** Legacy Q4 or Q11 as the worked example; tool Level 3 with Maximum tries "up to 3"; 29.2B Q4; OUP Example 2(c) and A-Level Q2 as the queue special case; a full past-paper question with the write-up template.

The OUP worked examples give only a Gantt chart (no precedence table), so their answers have not been verified by computation.

## Where the code is

- Generators: `src/shared/decision/cpa.ts` (`cpaHistogram` near line 863; `cpaLevel` near lines 895–1000; `levelSchedule`, `levelOptions`).
- Walkthroughs: `src/shared/decision/cpaSolve.ts` (`solveLevel`, from about line 590).
- Picture: `src/shared/decision/representations/HistogramView.tsx`; `HistViewState` in `cpa.ts`; `SolveStep` in `types.ts`.
- Levels and options: `src/tools/Decision/CriticalPath.tsx` (level mapping near lines 100–145; option menus near 640–700).
- Tests: `src/tests/cpaSkills.test.ts`.
- Background: `specs/cpa-skill-tools.md`, `specs/exam/critical-path-analysis.md`, `specs/cpa-exam-questions.md`.
