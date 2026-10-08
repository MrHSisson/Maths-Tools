# Network Flows — question audit (2026-10-08)

How it was done: a harness generated ~13,500 questions (every tab × Capacity/Min-max × level × option, 120–250 each) and measured
errors, speed, duplicates, variety and "easy default" patterns; four independent reviewer agents hand-checked 162 sample questions
with their own code and read 40 screenshots; a browser sweep drove 72 questions to their last step. The harness was temporary and is
not kept.

## Solid
- **Maths:** 0 errors in 162 independently re-derived samples (answers, every caption number, directions of reversed arcs). 0 failures,
  0 duplicates, 0 bad captions and 0 answer mismatches over ~13,500 generated questions; slowest 203 ms. Browser sweep: 0 page errors.

## Bugs (confirmed by measurement)
1. Missing flow prints "x = 5 = 5" when nothing is subtracted — 41 % of questions.
2. Capacity-only Max flow captions say "potential decrease = flow − minimum" — 100 % of them (no minimum exists).
3. The Flow-from-potentials prompt never names "potential increase / decrease" — 100 %.
4. Layout (screenshot review): potential numbers touch the bounds pill on diagonal and short arcs (fan rungs worst); the big network's two
   crossings have four numbers within ~60 px; cut labels sit on the red line / on arcs.

## Easy defaults / low depth
- Max flow: 50–65 % of augmentations at Levels 2–3 are +1; augmentations per question are 2 (L2) / 3 (L3), never 5+; the starting flow is
  always within ~3–8 of the maximum; ~43 % of L3 minimum cuts are {S,A}/{S,B} and ~23 % are {…,E/F} (source or sink end); L1 min cut = {S}
  in 17–19 %.
- Augment: always 2–3 paths (and the prompt states the count); increases cluster at 2–3 (1 when a backward step is required); in 30–65 %
  of questions every path has the SAME increase; L3 path lengths are only 4 or 6; the Diamond is only 12–20 % of L1 augment questions.
- Missing flow: ~80 % of L1 missing arcs touch S or T; 8–12 % (L1/L2) and ~25 % (L3) of steps solve at a vertex with only two arcs (the
  answer just copies its neighbour); only 11–29 % of two-missing questions chain; in min/max the bounds play no part.
- Cuts: only ~8 distinct cuts at L1, ~20 at L2, ~14 at L3 (the one-line rule); ~47 % of default cuts have no backward arc; in capacity-only
  a backward arc always has minimum 0 (the subtraction is vacuous); in min/max 2–10 % of backward arcs have minimum 0 ("− 0").
- Potentials (capacity-only): every arc carries flow, so a potential decrease of 0 / an unused arc never appears; flows are small (1–8).
- Find a flow: the working is a decomposition of the answer, not a method; cap targets are sometimes max−1 and sometimes trivial,
  unrelated to level; many min/max arcs are fixed [k,k].
- Variety: five templates only; Level 3 is a single template (40 arc variants); Level 1 has just 6 arc variants.

## Checked and found NOT to be a problem
- "Include a backward step" really forces it: the maximum cannot be reached without a backward step in 85–100 % of those questions
  (15–83 % naturally without the option).
