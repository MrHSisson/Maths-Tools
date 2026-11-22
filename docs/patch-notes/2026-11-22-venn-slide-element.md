Strand: Maths

## 2026-11-22 — The Venn slide element: draggable cards, prime tiles, HCF and LCM lines (no deck yet)

Branch `claude/hcf-lcm-venn-lesson-diz7dz` (merge 2 of the Venn plan). Area: `src/decks/{types,Venn,vennLayout,SlideCanvas,EditorChrome,EditorPanels,Editor,layouts,builder,deckChecks}`, `src/tests/vennLayout.test.ts`, docs (FEATURES, SLIDE_FEATURES, GLOSSARY, `docs/reference/decks.md`).

- **New slide piece `venn`**: a box with an optional label, two circles with rule labels, and cards (words, numbers or coloured prime tiles). A card with a region sits there; a card without one starts scattered round the outside. In the player every card drags with a finger, stylus or mouse and stays where it is dropped: no checking, not saved, put back when the slide is left. The drag does not start a phone swipe; with the Pen on, the pen takes the touch.
- **Clicks**: cards can appear one per click (`staged`), then an HCF line and/or an LCM line (`lines`), computed from the placed prime tiles with `hcfLine` / `lcmLine`. The diagram is drawn at one size with room kept for the lines, so it does not shift.
- **Layouts**: `vennSlide` (full slide) and `vennRowSlide` (four small Venns in a row, a to d, with a line under each on a click); both are in Add slide and the slide library, and in the builder's `S`.
- **Editor**: "Venn diagram" in Add, and a Venn options panel (labels, cards with tile and region, prime tiles for two numbers placed or scattered, one per click, the two lines, card size).
- **Deck check**: fails prime tiles that are not where the two numbers' factors go (the wrong Venn cannot be authored); warns about an answer line with nothing to multiply, empty cards and more than 12 scattered cards.
- **Checked** at tablet 1180×820 and laptop 1366×768 in headless Chromium: drag, one-per-click, answer lines, the row of four. A phone only previews decks, so no phone-specific work.
- **Deliberately not done:** the Venn worksheet print format (merge 3), the deck itself, dashboard Review (no tool changed).

Agent: Claude Code
Notes: Maths Tools — Handoff block "claude/hcf-lcm-venn-lesson-diz7dz".
