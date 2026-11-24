Strand: Maths

## 2026-11-24 — By topic on the folder explorer (deck folders, step 3)

Branch `claude/confident-rubin-7kdxat`. Area: `api/_folders.ts`, `api/decks.ts`, `api/_db.ts`, `src/decks/folders.ts`, `src/decks/FileUnder.tsx`, `src/components/FolderView.tsx`, `src/components/DecksTab.tsx`, `src/components/DeckGallery.tsx`, `src/admin/DecksSection.tsx`, `scripts/deck.mjs`, `src/tests/deckFolders.test.ts`, docs, `docs/pathways/deck-folders.md`.

- **By topic is the same file explorer as By class.** Your strands, topics and filing were copied once into the new topic folders (same order, same filing; decks that carried a strand but were never filed went into it). You can now make folders inside folders there too. The old tables are left in place and no longer read.
- **Not filed.** A deck in no folder is under a **Not filed** tile at the top level, so nothing is unreachable. A brand-new deck is filed under the strand it carries when first saved.
- **Signed-out visitors** get a read-only explorer over the topic folders with published decks only: no tabs, no editing, no admin key. The class folders stay signed-in only.
- **Folder choices in the deck editor.** About the deck has tick boxes for the topic folders and the class folders.
- **Toolbar back.** New deck, Slide library and Check for changes show again on the signed-in page (they had been missing from the By class view).
- **Retired:** the old categories code, its API reads and writes, the Manage categories controls and their tests. The dashboard's deck list filters by topic folder; the `deck` CLI's `categories` and `file` commands work on folders (`--tree class` for classes).
- **Server code, so merge before use.** The live site runs `main`'s API, so this needs merging and deploying; the first read of the topic tree does the one-time copy.
- Next: sort, list view and search (step 4).

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
