Strand: Maths

## 2026-11-24 — Decks by class

Branch `claude/confident-rubin-7kdxat`. Area: `api/_classes.ts`, `api/_db.ts`, `api/_deckStore.ts`, `api/decks.ts`, `src/decks/classes.ts`, `src/components/ClassView.tsx`, `src/components/DeckGallery.tsx`, `src/components/DecksTab.tsx`, `src/tests/deckClasses.test.ts`, docs.

- **A second way to organise the Decks page, for signed-in use: By class.** A heading per year (7, 8, 9, 10, 11, A-Level), the classes in it as buttons (7M1; 9M6, 9M3, 9M2; 12FM, 13MA, 13FM) with a deck count, and, on click, that class's decks as the usual preview cards, most recently made first from the left. Signed out, the page shows only the published list: no tabs and no classes. The choice of view is remembered on the device.
- **Loaded on click.** Only the clicked class's decks and their first slides are read, so the view never loads every deck's preview.
- **A deck can be in several classes.** Stored in a new table, `maths.deck_classes`, apart from the decks. Add a deck and a remove cross on each card (not on a phone).
- **New "made" date.** `maths.decks.created_at` is set when a deck is first saved; existing decks were back-filled from their earliest saved version (an approximation).
- **Server code, so merge before use.** The live site runs `main`'s API, so the class view needs this merged and deployed first.
- Not done: choosing classes from the deck editor's About the deck, editable years and classes, and classes for Years 8, 10 and 11 (none given yet).

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
