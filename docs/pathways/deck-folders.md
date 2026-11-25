# Deck folders
- **Status:** building
- **Updated:** 2026-11-25

## Intention
Decks in a file-explorer structure: folders inside folders, to a sensible depth, for the Decks page's two views (By class and By topic), instead of a fixed two-level strand list and a fixed class list. A deck can sit in several folders (like a shortcut; the deck is never copied). One folder engine and one explorer screen serve both views. Decks themselves are never touched by filing, so Harry's decks, their links and their published copies are not disrupted. Decided with Harry, 2026-11-24. All four steps are built.

## Progress
- 2026-11-24, **step 1 (merged, PR 164):** the folder engine (`api/_folders.ts`, tables `maths.deck_folders` and `maths.deck_folder_items`, a `class` and a `topic` tree) and By class running on it. The class tree is seeded once with Harry's years and classes. By class is signed-in only and the default view. A deck's made date is new (`maths.decks.created_at`).
- 2026-11-24, **step 2 (merged, PR 164):** the explorer screen: a breadcrumb trail, subfolder tiles beside the deck cards, any depth (capped at 6), New folder, rename, reorder, Move into…, delete (a folder's decks go up to its parent and its subfolders move up a level; no deck is deleted), and drag a deck card or a folder onto a folder tile or a breadcrumb. Rules live in `applyFolderOp` and are tested. A touch screen uses Move into…; a phone browses only.
- 2026-11-24, **step 3 (on its branch, not merged):** By topic runs on the same explorer. The existing strands, topics and filing are copied once into the `topic` tree (same ids and order; decks carrying a strand but unfiled are filed under it; the old `deck_categories` and `deck_filing` tables are left in place, no longer read). The old categories code, API reads and writes, Manage categories controls and their tests are removed. New with this step: a **Not filed** tile (so a deck in no folder is always reachable), a read-only **public** explorer for signed-out visitors (published decks, topic tree only), the editor's About the deck as folder checklists for both trees, the dashboard's deck list filtering by topic folder, the `deck` CLI's `categories` and `file` commands on folders, and a brand-new deck filed under the strand it carries on its first save. The New deck / Slide library / Check for changes toolbar is back on the signed-in page (it had been missing from the By class view).
- 2026-11-25, **step 4, the list view (merged, PR 169):** a plain **list view** is the default for a folder's decks (title, band tag, slides, made, edited, published; click a column heading to sort), with the preview cards kept as a toggle. Folders are rows in the list, and the list reads no slide pictures. The band is the existing lesson pitch.
- 2026-11-25, **step 4, search (on its branch, not merged):** search across every deck (title or summary; results show each deck's folder; matching folders as chips; also for the signed-out view, published decks only), using the same list and sorting. The two step 4 branches were reconciled on 2026-11-25: one `editedAt` field, one sort, one list view.

- 2026-11-25, **placing a deck in two places (on the branch, not merged):** the "Add a deck…" dropdown is gone. A drag always moves a deck; **Repeat** on a deck starts a placing mode where the folders are browsed and **Place here** adds the second place (one deck in several folders, not a copy). The tree reads no longer carry a list of every deck's title.

## Next steps
- **Once By topic has been used for a while:** drop the old `maths.deck_categories` and `maths.deck_filing` tables and the migration that reads them.
- **Possible:** a New deck made inside the open folder files itself there; reorder decks by hand inside a folder; filter by band; search inside slide text.

## Where to read more
- `docs/reference/decks-building.md` ("Decks in folders")
- `docs/FEATURES.md` ("Decks in folders")
