# Flashcards: Further Maths, starting with Mechanics MC (Work, Energy and Power) — design and the first card set

**Status:** implemented (2026-11-21), except printing the cards and the chapters after MC. Harry approved it for the Further Mechanics hub with the recommended answers to the open questions (facts and short conditions only; per-device boxes; printing later). Live at `/further-maths-flashcards`. A student asked for flashcards; Harry wants a revamp of the Computer Science cards for Further Maths: key formulas, equations, properties. This file holds the design; the first card set is Work, Energy and Power, written from the textbook chapter while it was in the conversation. **The card wording is original: facts and formulae only, never the textbook's sentences.**

**Spec statements covered:** MC1 to MC7 (`specs/exam/spec/aqa-mechanics.md`). AS or A2 is a flag on each card (A2 cards are the cos θ, resolving, slope and vector ones), the same Course idea as the MC tools (`specs/further-mechanics-mc.md` §4.5).

## 1. What exists, and what is missing

The Computer Science precedent (`src/shared/cs/modes/FlashcardMode.tsx`, content in each `CSShell` topic) is a **flip card with a plain-text front and back, previous and next, shuffle and reset**. It has no maths rendering (a formula has to be typed as text), no way for a student to say "I knew that", no memory between visits, no filtering, no pictures, and it is a mode of a CS topic page rather than something the Further Maths pages can use. Its dark gradient card also differs from the quiet style the site is moving to (`CLAUDE.md`, Visual direction).

## 2. Proposal

**A shared flashcard component, `src/shared/flashcards/`, used by any page, with the cards as data.** The CS cards are left alone (they can adopt it later).

### Card model (one source, several uses)

```ts
interface Card {
  id: string;                 // "mc3-ke": also the key of the student's memory of it, so never rename or reuse one
  statement: string;          // "MC3"
  course: "AS" | "A2";        // A2 for the cos θ, resolving, slope and vector cards
  kind: "definition" | "formula" | "derive" | "property" | "unit" | "method" | "error" | "diagram";   // the header
  tier: "essential" | "derived";
  front: string; back: string;   // text with $...$ for maths (KaTeX)
  reverse?: boolean;          // formula and definition cards: also shown back to front ("Name it")
  picture?: { scene: Scene; on: "front" | "back" | "both" };   // a mechanics diagram
  note?: string;              // one line of "why", shown under the answer
}
```

**Headers (revised 2026-11-21, after Harry's review).** Every card begins with a header saying what is asked: **Definition**, **Formula**, **Derive**, **Property**, **Unit**, **Method**, **Common error** or **Diagram**. The front names the thing, the header says what to do with it ("Derive: the greatest height reached by an object projected upwards at speed u").

**Essential and derived.** *Essential* cards are the results and facts to know: definitions, formulae, units, properties, the key methods and the traps. *Derived* cards ask the student to work something out from the essentials (a short derivation or a worked method for a particular set-up): good practice in generic terms, but not something to memorise. Every **Derive** card is derived; some **Method** cards are too. The setup screen offers "Essentials only" (the default) or "Essentials and derivations". The first set was cut from 75 cards to 66, of which 48 are essential.

### How a student uses it

- **The card turns over** (a real flip, a still crossfade if the device asks for reduced motion). Tap or press space.
- **Two ratings, not three:** **Not yet** or **Got it** (keys 1 and 2). The first design had a middle "Nearly", which changed little. A Not yet card goes back to box 1 and comes round once more in the same session; a Got it card moves up one box (a new card goes to box 2), and the box sets when it is due again (two days, a week).
- **Memory kept on the device** (no accounts), so the cards that were not yet known come back sooner.
- **Pick a set:** statements (MC1 to MC7), AS or A2, the kinds of card (the headers), essentials only or with derivations, session length, and **both ways round** for formula and definition cards.
- **Short sessions:** 10 cards, then the weakest statements.
- **Keyboard and touch,** phone, tablet and laptop as for every tool (`useLayoutMode()`).

### How it looks

The site's quiet style: a white card, slate border and soft shadow, KaTeX at a large size, the header as a coloured label with its name (the word is always there, never colour alone), the statement and an A2 or Derived tag small beside it. The back shows the answer with the question small above it. Diagram cards show a **mechanics diagram** on one or both faces (labels written with an `ask` show "?" on the front and the value on the back).

### Where it lives

- **Further Mechanics hub:** a Flashcards entry next to each chapter, so a student on MC lands on the MC set.
- **A page `/further-maths-flashcards`** with the chapter chooser (Pure, Mechanics, Decision…) as sets are written.
- **Printable:** the same cards as a cut-out sheet and as a one-page formula mat (`src/shared/printables.ts`), because students also want paper.
- **Decks and lessons** can embed a card set as a retrieval slide later.

### Why a student would use it more than a list

Cards are **short and single-idea, written for retrieval**, and the traps are cards of their own ("the difference of the squares, not the square of the difference"). The **method** cards ("which principle: work-energy or conservation?") are the thing the generator tools cannot teach and that students find hardest.

## 3. Open questions for Harry

1. **Content rule:** key formulas, units, conditions, methods and traps only, or also definitions in full sentences (for the written "state" questions)? Recommended: facts and short conditions; full definitions only where the spec asks students to state them.
2. **Where first:** the Further Mechanics hub (recommended; the MC set is ready) or a standalone page for all of Further Maths.
3. **Memory:** per-device boxes (recommended, no accounts) or no memory at all (simpler, but then it is only a flip deck).
4. **Printing:** cut-out cards in a first release, or later?
5. **Teacher view:** a teacher cannot see a student's boxes (they are on the student's device). Is that acceptable, or do you want a shareable "weak cards" link?

## 4. Build plan (as built)

1. The shared card component, the card data type, the storage of boxes, the page and its tests (no content beyond a handful of cards).
2. The MC set below as `src/flashcards/mechanicsMC.ts`, with the diagram cards added once the cards can show a picture.
3. The Further Mechanics hub entry, the printable sheets, and the dashboard and docs entries (`docs/FEATURES.md`, a pathway).
4. Further chapters (MA, MB, MD, ME, then Pure and Decision) as card sets, each authored from its own source.

## 5. The MC card set

The cards are the data in `src/flashcards/mechanicsMC.ts`, which is the source of truth (as of 2026-11-21: 58 text cards and 8 diagram cards; the dashboard and the tests give the live counts). This file no longer lists them, so the two cannot disagree. The rules the set follows, checked by `src/tests/flashcards.test.ts`:

- every card has a header and a tier; every Derive card is derived; the essentials are the smaller part of the set and every statement MC1 to MC7 has essential cards;
- only formula and definition cards are reversed; every diagram card has a picture that draws cleanly with its answer hidden and shown;
- all maths is valid KaTeX; ids are unique and never reused;
- wording is original: facts, formulae and conditions, never the textbook's sentences.
