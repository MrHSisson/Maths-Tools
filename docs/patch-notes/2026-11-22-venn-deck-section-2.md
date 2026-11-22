Strand: Maths

## 2026-11-22 — Venn, HCF and LCM deck: section 2, prime factors in a Venn (slides 8 to 27)

Branch `claude/venn-hcf-lcm-deck-section-2-a744m1` (from main 9a8f72a). Area: `specs/decks/venn-hcf-lcm.build.ts`, `src/decks/data/venn-hcf-lcm.json`, `src/shared/misconceptions.ts`.

- **Slides 8 to 27 added to the one deck `venn-hcf-lcm`** (27 slides so far): divider, quickfire, prime tiles to drag, tiles to number (6), the rule (10 and 15), the check (multiply each circle back), prime factors in a Venn (6), book work (9, 3 × 3), repeated-primes divider, model 8 and 12, discussion (Mei puts all three 2s in the middle), repeated primes (6), two special pictures side by side (nothing shared; one inside the other), special cases (6), two read-a-Venn-backwards grids, book work (9), **Worksheet 1** (slide 25, three A4 pages of three Venns, the first three carrying some tiles) and two authored Depth cards (a tile in the middle that is not in both; can the middle be empty). No three Depth slides together.
- **Every pair is computed and asserted** from `src/shared/venn.ts`: its factorisations, the kind it must be (one shared prime, two, repeated and matched one for one, shared in full, three or more in the middle, one inside the other, nothing shared), an LCM of at most 500, and never asked twice. `assertFreshNumbers` keeps the worked numbers (10, 15, 8, 12, 9, 4, 18) and the Depth numbers (54, 80, 27, 32) out of every set. Repeated-prime questions carry the "every copy in the middle" slip as a wrong answer, checked to differ from the right one.
- **Two new misconception tags**: `venn-middle-not-shared` and `venn-empty-middle-error`, used by the two Depth cards.
- **Book work is just the two numbers, big and plain** (the factorisations are on the printed worksheet, Harry), with the quiet middle-tile count on the first six of each nine.
- **Checked**: build, lint, `npm run deck -- check venn-hcf-lcm --layout` (27 slides, no spill at rest, with the working open or answers shown) and a look at every review sheet.
- **Deliberately not done:** sections 3 and 4 (HCF, LCM: slides 28 to 46); the editor's Venn options panel (still not browser-checked); dashboard Review.
- **Next:** section 3 (HCF from the Venn, slides 28 to 35) on a new branch from main, then section 4.

Agent: Claude Code
Notes: Maths Tools — Handoff block "Claude Code — claude/hcf-lcm-venn-lesson-diz7dz (Venn, HCF and LCM deck)"; the Build Log block is written at the end of the whole deck.
