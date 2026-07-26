# Teach Deck Spec: <Tool Name>

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

A completed copy of this template is everything Claude Code needs to author a
**Teach deck** for an existing tool with **zero follow-up questions**. Save
completed briefs as `specs/decks/<tool-id>.md`.

> **What a Teach deck is** (see `CLAUDE.md` → "Teaching slides — the Teach deck",
> and `GLOSSARY.md` §6). The **Teach** mode is the *teaching part of the lesson*:
> a PowerPoint-style deck the teacher presses through one **beat** at a time
> before moving to Whiteboard / Worksheet. A deck attaches to one tool via its
> `teachingSlides` prop. Reference deck: `FractionsAddSub.tsx` (`TEACHING_SLIDES`).
>
> **Authoring philosophy — read before writing slides:**
> - Slides are **specific, hand-authored, misconception-driven examples** — NOT
>   generated. The randomised side is exactly what Whiteboard and Worksheet are
>   for; there are no generators here.
> - Prefer an **I-do → We-do → You-do** arc within a category, on **one coherent
>   example** (keep the same numbers across the three). You-do makes the student
>   **predict/answer** before the reveal.
> - `title` is a short **topic label** ("Equivalent fractions"), not a sentence —
>   the **changing caption is the voice**; put the teaching there.
> - **No emoji.** Palette is fixed (navy + slate + white cards; phase badge
>   top-right). **Size for readability, never to fill** — content is authored big
>   enough to read from the back of the room; the card only ever scales it *down*.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool this deck attaches to | <!-- e.g. "Adding & Subtracting Fractions" (`src/tools/Number/FractionsAddSub.tsx`) --> |
| Topic taught | <!-- one line: "equivalent fractions as the route to a common denominator" --> |
| Categories filled | <!-- which of: Concepts · True or False · Spot the Mistake (one or more) --> |

**Teaching intent (2–3 sentences):** what misconception(s) does this deck confront,
and what should a student understand after pressing through it that a bare worked
example wouldn't give them?

---

## 2. Categories

<!-- A deck has up to three categories (the menu the teacher picks from):
       concept      — "Concepts": the taught idea, usually an I-do→We-do→You-do arc.
       trueFalse    — "True or False": judge a statement, then reveal.
       spotMistake  — "Spot the Mistake": find the error in shown working.
     Fill the ones this deck provides; leave the rest for later (they show
     "Coming soon"). Design each category as its own slide sequence below. -->

| Category | Providing now? | One-line aim |
|---|---|---|
| Concepts (`concept`) | | |
| True or False (`trueFalse`) | | |
| Spot the Mistake (`spotMistake`) | | |

---

## 3. Slides — per category

<!-- For EACH category you're providing, list its slides in order. For each slide
     specify:
       • kind    — static or anim.
       • phase   — iDo / weDo / youDo (the corner badge), if using the arc.
       • title   — the short topic label (not a sentence).
     Then, by kind:

     STATIC slide — body blocks, then one optional reveal (one extra beat / a
     Reveal button). Block types:
       text     — a sentence ($...$ inline maths, **bold**).
       math     — a large centred maths line.
       bars     — static shaded bar model(s): list each bar's num/den/label.
       verdict  — a TRUE / FALSE pill.
       note     — a bordered note, tone good/bad/plain, optional label. NO emoji.

     ANIM slide — a scene choreographed across beats, ONE caption per beat. Pick a
     scene from an existing family (beat count is fixed by the scene):
       bar model:          split · combine · equivalents
       number line:        multiples
       prime factor tiles: factorTree · primeVenn
     Give the scene's parameters and exactly one caption per beat. If NO existing
     scene fits, that's a real build cost (a new scene type) — flag it and pick
     the closest core representation (bar model, number line, area model, algebra
     tiles, negative counters, prime factor tiles). Every visual must reuse one of
     the six; a brand-new representation needs a stated reason. -->

### Category: <name>

#### Slide 1 — kind: `<static|anim>` — phase: `<iDo|weDo|youDo>` — title: "<label>"
<!-- static: -->
- **Body:**
  - <!-- e.g. text: "Here is 3/5." -->
- **Reveal (optional):** 
- **Reveal button label:** <!-- default "Reveal" -->
- **Misconception targeted:** 

<!-- anim: -->
- **Scene:** <!-- e.g. split: num 3, den 5, factor 2  (or "equivalents: 3/5, factors [2,3]") -->
- **New scene type needed?** no <!-- or: "yes — describe it" -->
- **Captions (one per beat):**
  1. <!-- "Here is 3/5…" -->
  2. …
- **Misconception targeted:** 

<!-- Repeat per slide, then per category. -->

---

## 4. The coherent example(s)

<!-- State the actual numbers each category walks, and confirm the I-do / We-do /
     You-do slides share them (e.g. "all three Concepts slides use 3/5"). This is
     the correctness reference: Claude Code reproduces these exact examples. -->

- Concepts: 
- True or False: 
- Spot the Mistake: 

---

## 5. Out of scope / future ideas (optional)

<!-- Categories deferred to "Coming soon", a scene worth building later, follow-on
     decks for sibling tools. Note also whether the Teach tab should ship dev-gated
     (default today) or is classroom-ready. -->
