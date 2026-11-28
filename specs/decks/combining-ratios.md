# Deck plan: Combining ratios

**Status:** draft plan (nothing built). Written from the repo docs, not from running a generator.
**Deck id:** `combining-ratios` · **Tool:** `ratio-manipulation` (new tab `combiningRatios`, `specs/ratio-manipulation-combining.md`) · **Representation:** the ratio table, three columns wide (A, B, C), given rows first, then scaled rows with arrows

**The one idea:** to join A : B and B : C, make the shared part (B) the same number in both ratios, then write them as one. Everything in the lesson is that sentence, a little harder each time.

**Starting point (assumed, say if wrong):** pupils can simplify ratios and write equivalent ratios by scaling (the Manipulating Ratios deck), and can find a common multiple of two numbers (the Multiples deck, `multiples-systematic-listing`). The usual errors: stacking the ratios (`5 : 2 : 4 : 5`), adding the gap instead of multiplying, scaling each ratio by its own shared part.

---

## Slide plan

One lesson, or two with the divider before Section 4 as the pick-up point (Harry to say). Each divider is a pick-up point; the slide after it is a four-question recap.

| Section | Slides | Picture | Question slides (brief) |
|---|---|---|---|
| Opening | Title · Learning objective | | |
| 1. Joining ratios (the shared part matches) | Divider · discussion: "red : blue = 2 : 3 and blue : green = 3 : 5. Is there a ratio of red : blue : green?" · Key definition: the **shared part** (the link) · board: the two rows go in, B is 3 in both, the answer row appears · fixed set · generator | ratio table, three wide (Structure only, built by click) | Fixed set (Level 1): the linking part already matches; tests joining without repeating B. Generator: Level 1. |
| 2. Scaling one ratio | Divider · discussion: "2 : 3 and 6 : 5: the B's are different. Can we still join them?" · board: `5 : 2` and `4 : 5`, the arrow `× 2` from row 1 to row 3 · "Which ratio do we scale, and why?" (the one whose shared part is smaller) · fixed set · generator · book work (3 × 4) | ratio table with an arrow that skips a row | Fixed set (Level 2): tests spotting the ratio to scale and the factor; larger part sometimes in the first ratio, sometimes the second. Generator: Level 2. |
| 3. Scaling both | Divider · discussion: "5 and 3: no whole number takes one to the other" · common multiples of 5 and 3, listed (a link to the Multiples deck) · board: `2 : 5` and `3 : 4`, two arrows (`× 3` from row 1, `× 5` from row 2), the two B's turn the same colour · "Why 15?" · fixed set · generator · pinned worksheet (A4, 12, with answers) | the same table, two arrows (left and right gutter) | Fixed set (Level 3): both ratios need scaling; tests the multiple, not just "multiply by the other one". Generator: Level 3. |
| 4. Order and direction | Divider · discussion: "A : B : C = 6 : 15 : 20. What is B : C : A? Is it 6 : 15 : 20?" (the numbers must follow their letters) · board: the answer row, then read off in the order asked, each value under its letter · board: `B : A = 2 : 5` goes into the row as `A = 5`, `B = 2` (the headers do the flipping); the shared part first, then last, in both · fixed sets (answer order; ratios given either way round; both together) · generator ("Answer Order: Different", "Ratios Given: Either Way Round") | the same table; columns never move; an explicit "write them in the order asked" line | Fixed sets with the numbers of Section 1 first (nothing to scale, so order is the only new thing), then with a scale-one question, then scale-both. |
| 5. Three ratios (extension; can be cut) | Divider · board: `A : B`, `B : C`, `C : D`, link B first, then C · fixed set (chain) · generator ("Ratios: Three") | the same table, four columns | Fixed set: Level 1 then Level 2 at three ratios. |
| Language and wording | Context wording ("red : blue" instead of A : B) appears from Section 1; a short "reading the wording" slide before the Level 3 set (which letter is the shared one?) | | |
| End | Summary · Depth cards (at the end of Sections 2 and 3; never three Depth slides in a row, R44) | | |

Q-slide layouts: the fixed sets use **Workspace right** (the table builds on the right as the steps unfold); generator slides use the same. Book work and worksheet slides carry no title (`docs/design/LESSON_STYLE.md`).

---

## What already exists, and what must be built first

| Need | Exists? | Built as |
|---|---|---|
| Ratio table slide element | Yes (`ratioTable`: `table`, `fill` as a board, `staged`) | **Extend:** an arrow from any row to a later row (`from` / `to`), three or four columns, empty cells. The same change goes in the shared component (`specs/ratio-manipulation-combining.md`, 3.2b). Its own chunk, on `main` before the deck is pushed. |
| A generator for the practice slides | No | The Combining Ratios tab (tool spec). Chunk 2. |
| A fixed-question builder with the tool's working | No (`Q.ratioSimplify`, `Q.ratioFraction` exist) | `Q.ratioCombine(id, level, spec)` made with the tab's generator code, answer checked from the parts. Built with the tab. |
| A Depth bank for the tab | No | Three items per Question Option and level, from the misconceptions in the tool spec. Chunk 3. |
| Multiples (common multiples) | Yes (a separate deck) | Referenced only. |
| Lesson thread, dividers, Key definition, discussion layout | Yes | Used as is. |

**Order of work (small merges, `AGENTS.md`):** (1) the table change in the shared component and the deck element; (2) the Combining Ratios tab behind Developing-tools mode with `Q.ratioCombine`; (3) the Depth bank; (4) the deck, built after the look card is approved (`npm run deck -- looks`); (5) Section 4 (three ratios) if kept.

---

## Question ladders (to agree with Harry before any question is written)

The routine in `docs/design/DECK_BUILD_CHECKLIST.md` applies: plan the ladder and the traps with Harry, recompute every answer by a second route, show him a table, then build. At least five distinct questions per fixed set (R42), each slide with a one- or two-sentence brief (R43). Authored questions have no levels; difficulty is the order.

| Set | Rungs, easiest first | Traps to build in |
|---|---|---|
| 1. Joining | shared part matches; shared part 1; first ratio's shared part larger numbers; a context; one with the context's names reversed | stacking (`5 : 2 : 2 : 9`) |
| 2. Scale one | factor 2 on the first ratio; factor 2 on the second; factor 3; factor 4; the shared part 1 scaled to 5 (a `1 : 5`); a context | adding the gap; scaling the wrong ratio |
| 3. Scale both | 5 and 3; 3 and 4; 4 and 5; 2 and 9; 7 and 3; a context | scaling each by its own shared part; stopping when one B matches |
| 4. Order and direction | answer in order with matching shared parts; answer reversed (`C : B : A`); answer rotated (`B : C : A`); a given flipped (`B : A`); shared part first in both; shared part last in both; the same with one ratio scaled | reordering the numbers but not the letters; joining in the order the ratios are listed; reading the flipped given as written |
| 5. Three ratios (if kept) | matches throughout; one ratio scaled; two links to make equal | forgetting the third ratio |

Numbers already used by the worked examples and discussions are not asked about again (the build script asserts it). Candidates: 2 : 3 and 3 : 5 (Section 1 discussion), 5 : 2 and 4 : 5 (Section 2 board), 2 : 5 and 3 : 4 (Section 3 board).

---

## What I need from Harry (the lesson plan template, `docs/design/templates/LESSON_PLAN_TEMPLATE.md`)

1. **Class and length:** year group, set or attainment, one lesson or two, the calculator.
2. **Section 4 (order and direction)** sits after the scaling sections so scaling and order are never new at once. Do you want it there, or earlier (straight after Section 1, using the matching-part numbers)? **Section 5 (three ratios):** in this deck, or its own later deck?
3. **Book work or worksheet** for each section (the deck plans one take-home piece per idea, not both). Draft above: book work after Section 2, an A4 worksheet after Section 3.
4. The open questions in `specs/ratio-manipulation-combining.md` §7.
