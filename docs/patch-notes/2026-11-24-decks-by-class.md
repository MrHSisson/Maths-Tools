Strand: Maths

## 2026-11-24 — Decks by class

Branch `claude/confident-rubin-7kdxat`. Area: `api/_classes.ts`, `api/_db.ts`, `api/_deckStore.ts`, `api/decks.ts`, `src/decks/classes.ts`, `src/components/ClassView.tsx`, `src/components/DecksTab.tsx`, `src/tests/deckClasses.test.ts`, docs.

- **A second way to organise the Decks page: By class.** A heading per year (7, 8, 9, 10, 11, A-Level), the classes in it as buttons (7M1; 9M6, 9M3, 9M2; 12FM, 13MA, 13FM) with a deck count, and, on click, that class's decks most recently made first. The choice is remembered on the device.
- **Light list.** A class's decks are fetched one class at a time as plain rows (title, summary, slides, made date) with no first-slide preview and no deck body.
- **A deck can be in several classes.** Stored in a new table, `maths.deck_classes`, apart from the decks. Signed in, a class has Add a deck and a remove cross; signed out, published decks only.
- **New "made" date.** `maths.decks.created_at` is set when a deck is first saved; existing decks were back-filled from their earliest saved version (an approximation).
- **Server code, so merge before use.** The live site runs `main`'s API, so the class view needs this merged and deployed first.
- Not done: choosing classes from the deck editor's About the deck, a class view on the phone-only preview flow beyond the same list, editable years and classes, and the Years 8, 10 and 11 classes (none given yet).

Agent: Claude Code
Notes: Build Log block not written (the planner was not used this session).
