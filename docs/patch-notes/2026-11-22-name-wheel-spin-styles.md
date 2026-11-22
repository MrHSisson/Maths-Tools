Strand: Maths

## 2026-11-22 — Name Wheel: three spin styles

The Name Wheel (still behind Developing-tools mode) can now spin in three ways, chosen per wheel under **Wheel settings → Spin style** and saved with that wheel:

- **Classic**: the existing round wheel, pointer at the top.
- **Carnival**: an upright prize wheel with bulbs round the rim, a peg at every slice edge and a red flapper on the right that is pushed down as each peg passes. The slices move top to bottom.
- **Case**: names as a row of cards that slide across the screen past a marker in the middle and slow to a stop, like opening a case. The strip is wider than the wheel on laptop and tablet, and about three cards wide on a phone.

All three use the same tick sound, the same colours, the same winner dialog (with confetti and balloons) and the same "Remove from wheel" choice, and the reduced-motion shortcut still applies. Extra entries per name still weight the chance. Older saved wheels open as Classic.

Also fixed: `Confetti` and `Balloons` shared one React key, which logged a duplicate-key warning after every spin. The Name Wheel registry description now says four colour sets (it said six) and mentions the spin styles.

Checked in headless Chromium at laptop (1366×768), tablet (820×1180) and phone (390×800): for every style the name the dialog announces is the card or slice drawn under the pointer, and a spin logs no console errors.

Not done: sound is the same tick for every style (no separate carnival clack); the strip has no "tiny label" mode because cards always show a readable name.

Branch: `claude/vigilant-noether-bm951n`. Files: `src/tools/TeacherTools/NameWheel.tsx`, `src/registry.ts` (description only), `src/generated/toolFacts.json`.
Agent: Claude Code
Notes: Maths Tools — Build Log block "2026-11-22 — Name Wheel: three spin styles (Claude Code)". Handoff block and dashboard Review not updated.
