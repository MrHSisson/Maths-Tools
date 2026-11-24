Strand: Maths

## 2026-11-24 — Search, sort and list view for decks (deck folders, step 4)

Branch `claude/confident-rubin-7kdxat`. Area: `api/_folders.ts`, `api/decks.ts`, `src/decks/folders.ts`, `src/components/FolderView.tsx`, `src/components/DeckGallery.tsx`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **Search.** A search box at the top of By class and By topic looks through every deck, in every folder and in none (a word in the title or summary, any case, up to 60 results). Each result shows which folder it is in, and a folder whose name matches shows as a chip that opens it. Escape or the cross clears it. Signed out it searches published decks only.
- **Sort.** Most recently made, last edited, or name (A to Z, with "Unit 2" before "Unit 10"), for an opened folder and for search results.
- **List view.** Pictures or a compact list, with the same Edit, take-out and drag as the cards.
- Your sort and layout are remembered on the device. Decks now carry a last-edited time on these reads (for a published deck, when it was last published).
- **Server code, so merge before use.** The live site runs `main`'s API, so search needs this merged and deployed.
- All four steps of the deck folders pathway are now built. Left for later: dropping the old category tables once By topic has been used for a while.

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
