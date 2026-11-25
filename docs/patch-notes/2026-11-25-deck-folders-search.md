Strand: Maths

## 2026-11-25 — Search across every deck, reconciled with the list view (deck folders, step 4)

Branch `claude/confident-rubin-7kdxat`. Area: `api/_folders.ts`, `api/decks.ts`, `src/decks/folders.ts`, `src/components/FolderView.tsx`, `src/components/DeckGallery.tsx`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **Search.** A search box at the top of By class and By topic looks through every deck, in every folder and in none (a word in the title or summary, any case, up to 60 results). Each result shows which folder it is in, and a folder whose name matches shows as a chip that opens it. Escape or the cross clears it. Signed out it searches published decks only.
- **Same list and sorting as the list view already in `main`** (PR 169): search results use the folder list's columns (name, band, slides, made, edited) and its Previews toggle, and show the folder each deck is in under its title. One `editedAt` field, one sort, one list view: the two parallel step 4 branches were reconciled here, and this note's earlier sort dropdown and list were dropped in favour of that one.
- The list and search read no slide pictures (`previews=0`), so a big folder or a long result list opens lighter; the signed-out search works the same way.
- **Server code, so merge before use.** The live site runs `main`'s API, so search needs this merged and deployed.
- All four steps of the deck folders pathway are now built. Left for later: dropping the old category tables once By topic has been used for a while.

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
