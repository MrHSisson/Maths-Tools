Strand: Maths

## 2026-11-20 — Delivery workflow, step C2: decks and a full device

Branch `claude/great-heisenberg-5a3nko`. Area: `src/decks/store.ts`, `src/components/DecksTab.tsx`, `src/tests/deckSync.test.ts`; pathway `docs/pathways/delivery-workflow.md`.

- **Storage safety net.** When a deck cannot be saved on the device because its storage is full, the device now frees space and tries again: the saved versions of the other decks first, then their base copies, then this deck's own older versions. A deck is never dropped to make room.
- **Honest "Check for changes".** If a deck still cannot be kept after that, the Decks page says "Storage full: could not keep <deck> on this device" instead of "Updated". Previously the save failed silently and the message still said "Updated", which is how the decks vanished from the page.
- Tests: a device with a small quota (space freed and the save kept; nothing left to free reports the failure and names the deck).

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
