Strand: Maths

## 2026-11-25 — Repeat a deck into a second folder; no more "Add a deck" dropdown

Branch `claude/confident-rubin-7kdxat`. Area: `src/components/FolderView.tsx`, `src/components/DeckList.tsx`, `src/decks/folders.ts`, `api/_folders.ts`, `api/decks.ts`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **The same deck in two places.** Each deck has a **Repeat** button (list, preview card and search results). Press it, browse the folders as normal, open the folder where the deck should also appear, and press **Place here**. It is one deck shown in both places, not a copy, so changing it changes it everywhere. **Cancel** leaves the mode; Place here is off at the top level and in Not filed, and reads Already here where the deck already is.
- **Dragging only moves.** A drag takes a deck out of the open folder and into the target, so a deck stays in one place unless Repeat is used. The "Add a deck…" dropdown is gone.
- The take-out cross removes a deck from just the open folder (its other places stay).
- The folder reads no longer include a list of every deck's title (it only fed the dropdown).
- The deck editor's About the deck still has its folder tick boxes, which is how a deck is moved on a touch screen (a touch screen cannot drag).
- **Server code, so merge before use** (the API change is small; the rest is the screen).

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
