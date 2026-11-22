Strand: Maths

## 2026-11-22 — Venn, HCF and LCM deck: the look card approved, section 1 built (slides 1 to 7)

Branch `claude/venn-hcf-lcm-deck-qmkg07` (merge 4a of the Venn plan). Area: `specs/decks/venn-hcf-lcm.build.ts` (new, the build script), `src/decks/data/venn-hcf-lcm.json` (the deck snapshot), `src/decks/SlideCanvas.tsx` (the Venn sheet slide).

- **Look card approved by Harry** (one slide of each kind: drag, key-point Venn, grid of four, question set, discussion, worksheet). Built as is.
- **Section 1 of 4, "A first look at a Venn"** (an idea, not a lesson: no worksheet, discussion, book work or Depth): title, objective, four drag slides (pets and 3-letter words, can fly and has feathers, is red and is a fruit with no shapes, even and multiple of 3 for numbers 1 to 12) and an "If time: sort into a Venn" set of five fixed questions (even / multiple of 5, multiple of 4 / 6, odd / square, less than 10 / even, factor of 12 / 18) with something in both circles and something in neither across the set.
- **Every sort is computed** in the build script and asserted (who goes in the middle, on one side, in neither), and the sorting answers are saved from the same computation (R42; not shown on a click, as in the plan).
- **The factorisations under each Venn on the worksheet slide** were cramped and ran together along the bottom ("10 = 2 × 5 15 = 3 × 5"). They are now larger, centred and one to a line; the answer lines the same.
- **Checked:** `deck check venn-hcf-lcm --layout` (no spills, overlaps or runs off the slide), and one contact sheet of every slide.
- **Deliberately not done:** sections 2 to 4 (slides 8 to 46), the Depth cards (no bank: authored in section 2), a larger grid of four Venns, the "count in small print" on the fade.
- **Next:** section 2 (slides 8 to 27, with Worksheet 1 as slide 25), then HCF, then LCM.

Agent: Claude Code
Notes: Maths Tools — Handoff block "claude/hcf-lcm-venn-lesson-diz7dz" (update 2026-11-22, deck session).
