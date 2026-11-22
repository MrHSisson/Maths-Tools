Strand: Maths

## 2026-11-22 — Name Wheel: three spin styles

The Name Wheel can now spin in three ways, chosen per wheel under **Wheel settings → Spin style** and saved with that wheel:

- **Classic**: the existing round wheel, pointer at the top.
- **Carnival**: a tall reel, like a slot machine: the names scroll top to bottom past a marker line in the middle and slow to a stop. It is the Case strip turned vertical (an earlier version drew an upright prize wheel with a flapper; that was replaced because it was not what was wanted).
- **Case**: names as a row of cards that slide across the screen past a marker in the middle and slow to a stop, like opening a case. The strip is wider than the wheel on laptop and tablet, and about three cards wide on a phone.

All three use the same tick sound, the same colours, the same winner dialog (with confetti and balloons) and the same "Remove from wheel" choice, and the reduced-motion shortcut still applies. Extra entries per name still weight the chance. Older saved wheels open as Classic.

Also fixed: `Confetti` and `Balloons` shared one React key, which logged a duplicate-key warning after every spin. The Name Wheel registry description now says four colour sets (it said six) and mentions the spin styles.

Checked in headless Chromium at laptop (1366×768), tablet (820×1180) and phone (390×800): for every style the name the dialog announces is the card or slice drawn under the pointer, and a spin logs no console errors.

Carnival and Case spins are deliberately long and suspenseful: about 9.5 to 12 seconds (Classic stays at 5 to 7), 90 to 130 cards, and a gentler slow-down so the last couple of seconds are a crawl. A device set to reduce motion (macOS Reduce motion, Windows animation effects off) still gets a one-second spin, but Wheel settings now has "Full-length spin even if the device reduces motion" (saved on this device) to override that.

A win now has the full celebration: a short rising fanfare (generated in the browser, on the same Sounds switch as the tick, which is now labelled "Sounds (tick and fanfare)"), bigger and longer confetti and balloons, and a new `Fireworks` component (`src/shared/components/Fireworks.tsx`: rockets climb and burst into trailing sparks). `Confetti` and `Balloons` gained optional `scale` and `force` props (defaults unchanged, so the Advent Calendar is unaffected). Confetti, balloons and fireworks draw nothing on a device set to reduce motion, as before, but the Wheel settings box "Full spins and celebrations even if the device reduces motion" now turns them back on along with the full-length spin.

Not done: the tick is the same for every style (no separate clack); the strips have no "tiny label" mode because cards always show a readable name.

The Name Wheel is now live: `enabled: false` is removed from its registry entry, so it is on the landing page under Classroom without Developing-tools mode.

Branch: `claude/vigilant-noether-bm951n`. Files: `src/tools/TeacherTools/NameWheel.tsx`, `src/registry.ts` (description only), `src/generated/toolFacts.json`.
Agent: Claude Code
Notes: Maths Tools — Build Log block "2026-11-22 — Name Wheel: three spin styles (Claude Code)". Handoff block and dashboard Review not updated.
