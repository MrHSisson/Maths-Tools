Strand: Maths

## 2026-11-24 — Decks by class, on a new folder engine (deck folders, step 1)

Branch `claude/confident-rubin-7kdxat`. Area: `api/_folders.ts`, `api/_db.ts`, `api/_deckStore.ts`, `api/decks.ts`, `src/decks/folders.ts`, `src/components/FolderView.tsx`, `src/components/DecksTab.tsx`, `src/components/DeckGallery.tsx`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **By class, signed in only, and the default view.** A heading per year (7, 8, 9, 10, 11, A-Level), the classes in it as buttons (7M1; 9M6, 9M3, 9M2; 12FM, 13MA, 13FM) with a deck count, and, on click, that class's decks as the usual preview cards, most recently made first from the left. Signed out, the page shows only the published list: no tabs, no classes. The choice of view is remembered on the device.
- **Built on folders, not a fixed list.** Folders of any depth live in new tables (`maths.deck_folders`, `maths.deck_folder_items`) in a named tree; the class tree is seeded once. A deck can be in several folders. Filing never touches a deck, so decks, their links and published copies are unaffected. Step 1 draws year and class only; the data and tests already hold folders six levels deep.
- **Loaded on open.** Only the opened folder's decks and their first slides are read.
- **New "made" date.** `maths.decks.created_at` is set when a deck is first saved; existing decks were back-filled from their earliest saved version (an approximation).
- **Server code, so merge before use.** The live site runs `main`'s API, so By class needs this merged and deployed first.
- Next (see the pathway): the explorer screen (breadcrumbs, new folder, rename, move, drag), By topic on the same folders, then sort, list view and search.

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
