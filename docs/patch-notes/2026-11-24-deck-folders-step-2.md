Strand: Maths

## 2026-11-24 — Decks as a file explorer (deck folders, step 2)

Branch `claude/confident-rubin-7kdxat`. Area: `api/_folders.ts`, `api/decks.ts`, `src/decks/folders.ts`, `src/components/FolderView.tsx`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **By class is now a file explorer.** A breadcrumb trail, the opened folder's subfolders as tiles (decks and folders inside each) and its decks below as the usual preview cards, most recently made first from the left. Folders go inside folders, up to six levels.
- **Edit the folders in place** (not on a phone): New folder, rename, reorder, Move into…, delete, and drag a deck card or a folder onto a folder tile or a breadcrumb. Add a deck… still puts a deck in a second folder.
- **Safe by rules, tested on the server:** names unique among siblings, no folder inside itself, the depth cap, no moving between kinds of folders, and **deleting a folder never deletes a deck** (its decks go up to its parent; its subfolders move up a level).
- **Server code, so merge before use.** The live site runs `main`'s API, so the explorer needs this merged and deployed first.
- Next (see the pathway): By topic on the same folders (a migration of the existing strands and filing), then sort, list view and search.

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
