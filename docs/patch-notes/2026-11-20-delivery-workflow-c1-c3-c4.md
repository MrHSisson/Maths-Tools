Strand: Maths

## 2026-11-20 — Delivery workflow, steps C1, C3 and C4: decks before their code, and a small device

Branch `claude/great-heisenberg-5a3nko`. Area: `api/_decks.ts`, `api/_questions.ts`, `api/_questionDisplay.ts`, `api/_rectilinear.ts`, `api/_deckStore.ts`, `src/decks/store.ts`, `src/decks/newerCode.tsx`, `src/decks/SlideCanvas.tsx`, the Decks page, dashboard and Add-to-deck dialogs.

- **Deck content can be saved before the code that draws it is merged.** The shared service keeps a question that uses something a newer site adds (a question format, a rectilinear shape or version), refuses anything else malformed, and tells the pusher what it kept. The site shows "This needs a newer version of the site; it will appear once its code is merged." in its place (and for an element kind it does not know, or one that fails to draw) while the rest of the slide carries on; the deck check lists it as a warning. This applies to the live server once merged and deployed.
- **The device holds few decks.** The Decks page, a tool's menu, the dashboard and the Add-to-deck dialogs list decks from the shared list (each deck's filing, tool, slides by kind and first slide), a deck is fetched when opened, a whole-list check refreshes only the decks held here, and the device keeps the 8 most recently used (never dropping unsent work). This is the lasting fix for the full-storage problem that hid decks.
- The stale deck-preview task in `docs/TASKS.md` is corrected (Neon, not Blob).
- Not done: allow rules so a deck push needs no prompt (C5) and a separate preview database with a bypass secret (C6) both need Harry.

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
