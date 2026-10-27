# Lessons — structure and learnings

How a **lesson** is put together on the site, and what building the Indices pilot taught us. Read this before authoring a lesson, a Teach
deck or a lesson-step sequence. The mechanics (types, props, URL format) are in `docs/reference/depth-teach-lessons.md` ("Lessons", "Teaching slides"); the words are
in `docs/GLOSSARY.md` §5c–6; the Indices design record is `specs/decks/indices.md`. Pilot code: `src/tools/Number/IndicesLessons.ts`,
`IndicesTeach.ts`, `IndicesDepth.ts`.

## 1. What a lesson is

A lesson is the teacher's **sequence**, in the order a class meets it: **teach → practise → set → extend**. Each stop is one *lesson step*,
a shareable-link setup (a Teach deck, a Depth item, a Whiteboard / Worked Example, or a Worksheet).

- **Reached from the burger menu only** (Developing-tools mode). There is no "Teach" header tab: a tool with `teachingLessons` has decks
  that only open through a lesson step (`kind: "teach"`, `deck: "<id>"`). A tool with only `teachingSlides` still gets the Teach tab.
- **A lesson may cross tabs.** A step can name its own `tool`, so one lesson runs Index Laws → Zero & negative powers. (The old "never
  crosses tools" rule is gone.) The lesson's own `tool` is where its overview opens.
- **Opening a lesson shows the overview** (one card per step); a card opens that step; the step bar's title returns to the overview.
- **The step bar follows the class.** A hand-off button on a deck (Practise / Set it / Reason about it) opens that activity *and* moves the
  lesson to the next step of the same kind on the same tool, so the bar never lags behind where the teacher is.

## 2. One idea per lesson, isolated by content

The first Indices lesson tried to carry everything (laws, then negatives, then a second tab) and the pieces blurred. What worked:

| Lesson | Contains | Deliberately excludes |
|---|---|---|
| **Laws of indices (no negatives)** | laws deck → practise → worksheet (L1), then **coefficients** deck → practise → worksheet → extend (L2) | any zero or negative index |
| **Zero and negative powers** | a Depth bridge ("what if the bottom is bigger?") → negatives deck → practise → worksheet → two extends | the laws themselves (assumed) |

Rules that came out of it:
- **Split a lesson at a conceptual boundary** (positive-only vs negatives), not at a tool boundary. Within a lesson, order by **load**:
  plain letters/numbers first, then add one new thing (coefficients).
- **Levels are isolated.** Level 1 is the bare idea; Level 2 *always* has the new ingredient (a coefficient); Level 3 mixes. Never let a Level 1
  question appear at Level 2. If a Level 2 option can't be unticked, don't offer a control for it.
- **The bridge between lessons is a question, not a slide.** A Depth item that exposes the gap ("what happens when the bottom is bigger?") makes
  the next lesson feel needed. Depth items stay in the bank; a lesson only references them by id.
- **Don't keep two lessons that overlap.** When a new lesson absorbed an older one, the old one was removed (its Depth items stay in the bank).

## 3. Teach decks inside a lesson

- **Every slide is the same 16:9 slot** (card, scene and Depth stage alike). Content is laid out at one design width (`FS_DESIGN_W = 760`)
  and scaled to the slot, so type and proportions are identical on every screen. Full screen is the same slide, bigger — on a **light**
  backdrop, with Back / Full screen / Next in a fixed row so they never move.
- **No I-do / We-do / You-do banners.** The arc is carried by the order of the slides and the captions.
- **Never open with a check.** A Depth question at the start of a deck asks about something not yet taught. Checks go *after* the model
  they test. (They are real Depth slides: `{ kind: "depth", item }` plays the Depth stage itself, question beat then answer beat; Feathers
  and Teacher notes sit in the deck's button row rather than under the slide.)
- **No stray fades.** A new slide mounts fresh (`key={idx}`) so a reused scene doesn't animate carry-over from the last slide; every beat's
  content is laid out from the first press (opacity, not mounting).
- **Show each fact once.** A slide that draws the tiles, writes "letters: 3 + 3 + 3 + 3 = 12", writes the equation chain *and* captions the
  same thing is too busy. Pick the picture, one line and one caption, each carrying something different.
- **Sentences never break around maths.** A bracket or punctuation mark touching `$…$` is glued to it (`RichText`, `InlineMath`), so a line
  can't end on "(" or start with ")".
- **Group like with like.** With coefficients, tiles *reshuffle* (3 × 4 × x x x …) so the numbers sit together and the letters are counted
  as one group — the picture does the "two jobs" idea.
- **Teach the mechanism the class will reuse.** Power of a power is *write the bracket n times*, then the multiply law adds the indices
  (m + m + … = m × n) — not a memorised "multiply the indices".
- **Hand off with presets.** The last slide's buttons open a Whiteboard / Worksheet / Depth already set to the level and Question Options just
  taught. Test the presets (`indicesLessons.test.ts`).
- **Sizing check.** Look at the real slide at 1280×720: nothing may be clipped, the slide plus the button row must fit under the site header
  (the slot's width budget uses `100vh − 20rem`, `− 6rem` in full screen).

## 4. Question Options that serve a lesson

- **Every pool is drawn as the same well-spaced buttons** (`OptionGrid`); there is no separate look for peers versus an easy ↔ hard pair. Use an `exclusive` pool for true either/or settings (Numbers / Letters, Factorised / Expanded, Whole / Fractions).
- **Short labels.** If it needs a sentence, it goes in the info (i), not the button. `OptionGrid` fits four buttons to a row, then three, then two, so short labels keep a pool on one line.
- **No single-option controls.** If a level has one choice, remove the control (Level 2 Index Laws has no Base pool).
- **A restricting toggle is off by default when the safe case is the common one** (Partial Fractions "Negative x in numerator" is off, so
  the numerator's x terms are positive unless asked for).
- **Depth banks must cover every option.** Every named option needs ≥ 3 items (`depth.test.ts`); when a pool changes, add or retarget items
  rather than loosening the test.

## 5. Checklist for a new lesson

1. Name the one idea and what it excludes; split if it carries two.
2. Order steps teach → practise → set → extend; add a Depth bridge if the next lesson is the answer to a question.
3. Author decks as 16:9 slides, one idea each; checks after the model, by Depth id; hand-off with presets.
4. Isolate levels; give every step's `ms` every option it needs, by value.
5. Add `__test` exports and tests: `indicesLessons.test.ts` is the pattern (every step names a real tool, level, option, Depth item).
6. Look at it at 1280×720 and on a phone; update `docs/PATCH_NOTES.md`, `docs/PROJECTS.md` and Harry's notes.

## 6. Open questions

- Where the deck (not the lesson) still needs a Teach tab for tools without lessons — and whether decks go fully live (they are
  Developing-tools gated) once Indices has been taught from.
- Lessons for Powers & Roots and Common Base (specs/decks/indices.md lessons 1 and 4) are not built.
- Whether Level 2 coefficient material wants its own Depth bridge at the start of lesson 1's second half.
