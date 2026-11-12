# Resource levelling (lesson deck)

**Status:** implemented
**Deck:** `resource-levelling` · **Strand:** Decision Mathematics · **Tool:** Critical Path Analysis (Resource levelling tab)

## Agreed approach

A short, plain-English deck (8 slides) for the essentials. Words are kept simple: "no limit" stands for the unlimited time and levels are not mentioned. The one acronym, LFT (latest finish time), appears only on the quick-sum slide and is given in the table, because the lesson has no path analysis to work it out from. Every slide carries the numbers it needs, so none depends on an earlier slide. Most practice is on the Critical Path generator (Resource levelling); the detail (latest finish times, float, levels) is built in afterwards by Harry.

The quick sum in plain words: hold an activity back, work out when it now finishes, see how many days that is past its LFT, and add that on to the project time with no limit. It is a floor: the project cannot finish sooner, but may finish later, so the smallest quick sum is tried first.

## Slides

| # | Slide | What it does |
|---|---|---|
| 1 | Resource levelling | Title |
| 2 | The problem | Histogram of eight activities, one worker each, 2 workers available; clash at days 12 to 16 (E, F, G) |
| 3 | The quick sum | Why it helps: a fast estimate, a floor, so try the smallest first |
| 4 | Working out quick sums | Self-contained table: G, E, F with restart day, length and LFT given; the class fills finish day, days past LFT and quick sum (24, 27, 29; no limit 23) |
| 5 | Try the smallest | G held until day 16; no clash left; minimum 24 days |
| 6 | The routine | Five steps, one per click |
| 7 | When a try leaves another clash | Numbers only: no limit 21; C 22, D 26, E 26; trying C leaves a clash with F 23, G 22, H 29; try G; minimum 22 |
| 8 | In the exam | Look first, then the routine, then draw a histogram that fits (2 of 3 marks) |

## Checks

The worked networks were run through `levelMethod` before going on a slide; the histograms use the tool's stacking rule. Quick-sum answers are plain arithmetic.
