Strand: Maths

## 2026-11-22 — HCF & LCM from a Venn: the second Venn deck (26 slides)

Branch `claude/gracious-fermat-ryi4y3` (from main 6224570). Area: `specs/decks/hcf-lcm-from-venn.build.ts`, `src/decks/data/hcf-lcm-from-venn.json`, `scripts/deck.mjs` and `scripts/deckReview.mjs` (small), `specs/decks/venn-hcf-lcm.md`.

- **A new deck, `hcf-lcm-from-venn`** (sections 3 and 4 of the Venn plan; it follows "Venn Diagrams & Product of Primes"). Title, objective; **HCF from the Venn** (divider, quickfire recap, *Why the middle?* with 12 and 18 as lists of factors beside prime tiles, the key point with the HCF line on a click, four build slides, book work of nine with a visualiser slide for the answers, a Depth card); **LCM from the Venn** (the same shape, the key point shows the HCF and then the LCM line for 12 and 18, four build slides, book work of nine, visualiser slide, a Depth card); then the **Worksheet slides** divider and two blank worksheets (HCF, LCM: nine Venns each, with the numbers, factorisations and an HCF and an LCM line under each).
- **The look that is new:** the build slides (numbers as prime tiles, Venn, prime buttons) now carry the **answer line top right on one click** ("HCF = 2 × 3 = 6", "LCM = 2 × 2 × 3 × 3 × 5 = 180"), computed from the two numbers. Waiting for Harry's yes on it before the deck is pushed to the shared service.
- **Slimmed on purpose (Harry's reviews of deck 1):** four build slides a run, no read-the-Venn grids (the plan's slides 32 and 40 are cut: the row of four small Venns looked thin), no Mei-style discussion slide, the 216 discussion became a Depth card ("Do you agree with Amara? 26 and 65: LCM = 26 × 65"), Depth cards one speaker and "do you agree?", never two on one stretch, no exit ticket yet.
- **Every pair is computed and asserted** (`venn.ts`): the kind it must be, an LCM of at most 500, the HCF and LCM from the Venn equal the arithmetic, never asked twice in this deck or in deck 1; `assertFreshNumbers` keeps 12 and 18 (worked) and 25, 63, 26, 65 (Depth) out of every set. Wrong answers are run and checked to differ (HCF: multiplying every tile; 0 for an empty middle; LCM: multiplying only the middle; a × b).
- **Tooling:** the `review` and `sheet` commands now press Next for a Venn's staged cards and HCF/LCM lines, so those clicks show in the contact sheets.
- **Checked:** build, lint, full tests (the first run had one flake, the known Work Done test; the rerun passed 3,196), `npm run deck -- check hcf-lcm-from-venn --layout` (26 slides, no warnings) and every review sheet looked at. **Not checked:** the printed worksheets on paper, touch drag on a tablet, the camera on a real device.
- **Deliberately not done:** the deck is not pushed to the shared service or merged, no PR; the exit ticket and summary; stage 2 (combinations, trees).

Agent: Claude Code
Notes: Maths Tools — Build Log, "HCF & LCM from a Venn (Claude Code)".
