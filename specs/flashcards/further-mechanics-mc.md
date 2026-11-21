# Flashcards: Further Maths, starting with Mechanics MC (Work, Energy and Power) — design and the first card set

**Status:** implemented (2026-11-21, revised the same day twice after Harry's reviews), except printing the cards and the chapters after MC. Harry approved it for the Further Mechanics hub with the recommended answers to the open questions (facts and short conditions only; per-device boxes; printing later). Live at `/further-maths-flashcards`. A student asked for flashcards; Harry wants a revamp of the Computer Science cards for Further Maths: key formulas, equations, properties. This file holds the design; the first card set is Work, Energy and Power, written from the textbook chapter while it was in the conversation. **The card wording is original: facts and formulae only, never the textbook's sentences.**

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
  kind: "formula" | "definition" | "implication" | "mistake";   // the group a student revises by
  front: string; back: string;   // text with $...$ for maths (KaTeX); the front is always a clear prompt
  reverse?: boolean; name?: string;   // formula and definition cards: also shown back to front, the name being the answer
  picture?: { scene: Scene; on: "front" | "back" | "both" };   // a mechanics diagram, on a card of any group
  note?: string;              // one line of "why", shown under the answer
}
```

**Four groups (revised 2026-11-21, after Harry's second review).** A student revises by what a card asks, not by how hard it is, so there is no essential/derived split (the first version had one) and no separate headers for methods, units or properties:
- **Formulas:** state the formula or equation for a quantity or principle ("State the formula for the work done by a force F at an angle θ to the direction of motion…").
- **Definitions:** what a term means, with the units and standard values to know ("Define the watt", "What is meant by a light string?").
- **Implications:** what a situation tells you ("A vehicle reaches its maximum speed. What does this imply?" → a = 0, so the resultant force is 0, T = R). The results that used to be separate "derive" and "method" cards are written as implications of the situation they come from.
- **Common mistakes:** the slips examiners see and the correct move ("What is the common mistake when using x in Hooke's law?").

**Wording.** A front is a full prompt that says what the answer must contain: "State…", "Define…", "What does this imply?", "What is the common mistake…?". Never a bare noun phrase. Reversed (back to front) cards show the formula or definition and ask "Which quantity or principle is this formula for?", and the card's `name` is the answer.

### How a student uses it

- **Choose by topic and group.** The home screen has a topic filter (MC1 to MC7, AS or AS and A2) and then four decks, Formulas, Definitions, Implications and Common mistakes, plus a Mixed deck. A deck shows how many cards it has and where the student stands. Tapping one revises the ten that most need work.
- **Three piles, shown on every deck.** Every card is in a pile: **learning**, **getting there** or **secure** (and **new** before it is met), shown as a coloured bar on each deck. Not yet sends a card back to learning; Got it moves it up one pile; a secure card is only shown again after a week. A student therefore sees a few small decks and where they stand on each, never one long list; the piles are per card and are summarised per deck, so a whole course of hundreds of cards never shows as hundreds of separate boxes.
- **The card turns over** (a real flip, a still crossfade if the device asks for reduced motion). Tap or press space.
- **Two ratings:** **Not yet** or **Got it** (keys 1 and 2). A Not yet card comes round once more in the same session.
- **Memory kept on the device** (no accounts).
- **Also back to front** (off by default, so a deck is not doubled): formula and definition cards asked the other way round.
- **Keyboard and touch,** phone, tablet and laptop as for every tool (`useLayoutMode()`).

### How it looks

The site's quiet style: a white card, slate border and soft shadow, KaTeX at a large size, the group as a coloured label with its name (the word is always there, never colour alone), the statement and an A2 tag small beside it. The back shows the answer with the question small above it. Decks are cards with a pile bar. Diagram cards show a **mechanics diagram** on one or both faces (labels written with an `ask` show "?" on the front and the value on the back).

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

The cards are the data in `src/flashcards/mechanicsMC.ts`, which is the source of truth (the tests and the dashboard give the live counts; this file does not list them, so the two cannot disagree). The rules the set follows, checked by `src/tests/flashcards.test.ts`:

- every card is a formula, definition, implication or common mistake; each group is big enough to be a deck and small enough to revise in a sitting; every statement MC1 to MC7 has cards;
- every front is a clear prompt (formulas begin "State…", definitions "Define…" or "What…", implications end "What does this imply?", mistakes begin "What is the common mistake…");
- only formula and definition cards are reversed, each with a `name`; every picture draws cleanly with its answer hidden and shown;
- all maths is valid KaTeX; ids are unique and never reused;
- wording is original: facts, formulae and conditions, never the textbook's sentences.
