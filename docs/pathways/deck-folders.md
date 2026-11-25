# Deck folders
- **Status:** building
- **Updated:** 2026-11-24

## Intention
Decks in a file-explorer structure: folders inside folders, to a sensible depth, for the Decks page's two views (By class and By topic), instead of a fixed two-level strand list and a fixed class list. A deck can sit in several folders (like a shortcut; the deck is never copied). One folder engine and one explorer screen serve both views. Decks themselves are never touched by filing, so Harry's decks, their links and their published copies are not disrupted. Decided with Harry, 2026-11-24.

## Progress
- 2026-11-24, **step 1 done (on the branch, not merged):** the folder engine (`api/_folders.ts`, tables `maths.deck_folders` and `maths.deck_folder_items`, a `class` and a `topic` tree) and By class running on it, drawn from the folders (`src/components/FolderView.tsx`, `src/decks/folders.ts`). The class tree is seeded once with Harry's years and classes. The screen is unchanged for Harry: a heading per year, the classes as buttons, a folder's deck cards (with previews) most recently made first, loaded only when the folder is opened. Signed in only; By class is the default view. A deck's made date is new (`maths.decks.created_at`). There were no class assignments to migrate: the earlier class tables were never deployed.

- 2026-11-24, **step 2 done (on the branch, not merged):** the explorer screen for the `class` tree: a breadcrumb trail, subfolder tiles beside the deck cards, any depth (capped at 6), New folder, rename, reorder, Move into…, delete (a folder's decks go up to its parent and its subfolders move up a level; no deck is deleted), and drag a deck card or a folder onto a folder tile or a breadcrumb. Rules live in `applyFolderOp` and are tested. A touch screen uses Move into… and Add a deck… instead of dragging; a phone browses only.

## Next steps
- **Step 3, By topic on the same engine (it uses the explorer already built):** copy the strands, topics and `deck_filing` into the `topic` tree (a migration; the old tables stay until the new view has been used), swap the By topic view, then retire `api/_categories.ts` and the Manage categories controls.
- **Step 4, sort, list view and search:** sort by made, last edited or name; a list/grid toggle; one search across every folder.

## Where to read more
- `docs/reference/decks-building.md` ("Decks in folders")
- `docs/FEATURES.md` ("Decks by class")
