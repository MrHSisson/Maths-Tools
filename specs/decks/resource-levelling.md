# Resource levelling (lesson deck)

**Status:** implemented
**Deck:** `resource-levelling` · **Strand:** Decision Mathematics · **Tool:** Critical Path Analysis (Resource levelling tab)

## Agreed approach

A formal version of the routine to teach from. Levels 1 and 2 are taught and practised first (on the tool); Level 3 is looked at. The one idea to nail is the quick sum: what it is, how it is worked out, and why the smallest goes first. No live generator: the tool is used for practice, and the deck's own questions are pure quick-sum questions with no pictures.

## Slides

| # | Slide | What it does |
|---|---|---|
| 1–3 | Title, objective, key vocabulary | Clash, option, quick sum, try, knock-on |
| 4–5 | The activities, the earliest start histogram | Level 1 worked example (8 activities, one worker each, limit 2). Clash 12 to 16 (E, F, G) |
| 6–8 | Definitions | Clash; option; quick sum = unlimited time + (new finish − LFT) |
| 9–10 | Quick sums at the first clash; why smallest first | G 24, E 27, F 29 (unlimited 23); a quick sum is a floor |
| 11–12 | The routine; try G | Five steps; levelled histogram, minimum 24 |
| 13 | Quick sums (7 questions) | Formula, finishes by its LFT, which first, and "can it finish below its quick sum?" |
| 14–18 | Level 2 | Several workers (limit 6): clash 8 to 12 (D 3 + E 4); E 28, D 30; try E, minimum 28 |
| 19 | Your turn | Levels 1 and 2 on the tool, with the routine card |
| 20–22 | Level 3 | A try that leaves a clash (unlimited 21: C 22 leaves a clash, G 22 clears, minimum 22); going back (unlimited 25: H 25 leaves a clash, G 26 from the first list is next, minimum 26) |
| 23 | Discuss | Is the smallest quick sum always the minimum? (No: only if its try leaves no clash) |
| 24 | In the exam | Look first, then the routine, then draw it (2 of 3 marks) |
| 25–26 | Exit ticket, summary | Quick sum; which first; can the minimum be below the smallest quick sum? |

## Checks

Every worked network was run through `levelMethod` (quick sums, tries, minimum) before it went on a slide; histograms are drawn with the tool's own stacking rule (critical along the bottom, longest first, stepped blocks). Quick-sum answers are plain arithmetic (unlimited time + (new finish − LFT), or unlimited time when the activity finishes by its LFT).
