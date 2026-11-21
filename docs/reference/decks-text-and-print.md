# Decks — text sizing, rebuilding and printing

**Read when:** changing the lesson thread, automatic text sizing, the one Depth design, a rebuild that keeps the teacher's edits, or printing slides. (Part of the decks reference; the model, pages and storage are in `decks.md`.)

### Lesson thread and quieter controls

Each slide has one optional `brief` (a string, at most 4000 characters): what its questions test, or the key skill. It is edited in three places: **Brief (optional)** under This slide in the properties panel, the slide brief box in the question editor, and **Lesson thread**. Write it for question slides when planning, before choosing content; most other slides need none. <!-- R43 -->

**Lesson thread** (header button or Slide menu) lists every slide in order with its one brief box; the open slide is highlighted and focused. **Copy briefs for chat** copies every written brief with slide numbers and titles. Apply saves the whole draft as one undo step; Cancel/Escape discards it. A slide with a brief shows it (two lines) above its thumbnail in the strip; slides without one show nothing. Generator configuration shows the slide’s brief when it has one. Older decks with the four teaching-note boxes (`intent`) or the brief form (`questionBrief`) still load and save: `withBriefs` (`questionBrief.ts`) folds purpose, question focus, exclusions and progression into the one note when the editor opens them. Briefs survive duplicate, save, share and JSON export/import; the classroom renderer omits them.

Questions show **Show working** (a generator slide also has New question). Once working opens, Previous/Next step carry the reveal with **Show all** between them; there is no More menu. Keyboard shortcuts stay available (`a` answer, `w` next step, `f` Feathers on a Depth card). A small label in the slide's corner names the kind of practice: **Deliberate practice** for authored questions, **General practice · Level n** on a generator slide.

The browser smoke scripts that open Estimation by slide number (`smoke:solutions`, `smoke:layouts`, `smoke:whiteboard`, `smoke:questions`, `smoke:depth-art`, `smoke:thread`) were written for the first Estimation deck and need their slide numbers refreshed before they will pass; `smoke:published` and `smoke:deck-layout` do not depend on them. <!-- ref -->

Verification: `npm run smoke:thread` exercises draft cancellation, Apply/reload persistence, the generator’s contextual brief and phone/tablet/laptop layouts (Playwright/Chromium configuration as for the other smoke scripts).

`skillQuestions.test.ts` checks portable briefs, bank-free built practice, optional guidance, legacy resolution, final answers and generator-versus-authored solution parity. The question browser smoke checks direct authoring, copying briefs, atomic undo, custom drafts, export, Depth selection, responsive actions and classroom sequencing.

`npm run smoke:whiteboard` checks left/right placement, upward contraction, unchanged workspace bounds, reset, reduced motion, editor Apply/Cancel and camera opt-out. It uses simulated cameras to verify video playback, device switching, denial/retry, no preview access and cleanup including late permission completion. `whiteboardDeck.test.ts` covers the layout and portable data contract.

`questionLayouts.test.ts` covers shared display validation, content/brief preservation, custom geometry and portable round trips. `npm run smoke:layouts` checks all three layouts on the same five-question set, hidden camera controls, continuity across questions/guidance, Apply/Cancel/undo/recovery, Depth’s standalone exclusion and the grouped menu on phone/tablet/laptop sizes.

`depthArtwork.test.ts` verifies cast claims and canonical Feathers text survive conversion, copying and portable saves, that old copies regain only missing hints, and that malformed metadata is rejected. `npm run smoke:depth-art` checks live cast/mascot SVGs, question/answer prompts, mute, picker graphics, standalone editor previews at phone/tablet/laptop sizes, old edited copies and the white slide and light grey page colours.

## Automatic text sizing, and the manual override

Text that has a predetermined size fits its box by default, and any of it can be set by hand. An element's `size` is the **most** it will be while Auto is on; `fixed: true` is the manual override, drawn at exactly `size`. Pressing bigger or smaller or typing a size in the editor sets `fixed`; **Auto** (the toolbar pill, **Auto size** in the panel) turns fitting back on. The number shown is what is on screen (elements report the size they are drawn at, `src/decks/shownSize.ts`, from the editor canvas only), so the first press of bigger or smaller starts from the fitted size, not from the maximum. Steps are 2 below 40, 4 to 79, 6 from 80; the size box goes down to 12 (under 26 shows amber).

| Element | Auto | `fixed` (by hand) |
|---|---|---|
| `text` | is the largest whole size (found by bisection, not 7% steps; down to 20) at which the text is no taller than 75% of its box (`FIT_FILL` in `SlideCanvas.tsx`: the one number to change); boxes with the same role (titles 60 and over, body 40 to 59, labels under 40) share the smallest | exactly `size`; the content check reports a text that does not fit |
| `maths` | the largest size at which the equation fills no more than 75% of its box (`FIT_FILL`) | exactly `size` |
| `grid` (quickfire, retrieval, exit ticket, hand-written book work) | drawn in the same cells as a book activity (`BookCell`); is the largest size at which the question (and, separately, the answer) fills no more than 75% of its cell's width and height (`BOOK_FILL`), whatever `size` was saved | exactly `size` (the question is drawn at 0.7 of it) |
| `worksheet` (book activity) | is the largest size at which the question (and, separately, the answer) fills no more than 75% of its cell's width and height (`BOOK_FILL` in `SlideCanvas.tsx`: change that one number to make Auto bigger or smaller) (a book-work sum stays on one line: `.deck-nowrap`) | exactly `size` |
| `board` | the **header row and the body are fitted separately** (a long heading does not shrink the numbers, nor the reverse); each cell's text is at most 75% of its row's height and fits its column, measured on the filled-in table so revealing does not change it | exactly `size` |
| `questions` | shrinks from `size` (capped at 64) until the question and working fit | exactly `size` (to 140), no cap and no shrink |
| `generator` | a long worded question is set smaller (`wordedSize`) | the question at exactly `size`, the working at about 0.45 of it |
| `ratioTable` | scales down to fit its box | no scale-down: the cell text is exactly `size` |
| `bar` | fits its box by itself; `size` is the text size, set by hand (no Auto) | |

**Answers have their own size** on a book activity (`worksheet`) and a `grid`: `answerSize` and `answerFixed`, fitted on their own (by default up to the question's size) so a short answer is not shrunk to the question's size, or the question to the answer's. In the editor the toolbar's **Questions | Answers** switch shows every book activity and grid on the slide with its answers up (`forceAnswers`, not saved), and the size control and **Auto** then set the answer size. Question and answer text are measured separately by `data-part="q"` / `"a"` (`partOverflows`).

The content check only reports a text box that cannot fit even at the minimum (26). Do not add per-slide shrink helpers to a build script, and do not set sizes by hand in one. <!-- ref -->

## One Depth design

A Depth item looks the same in a deck and on the tool page because both draw `DepthSlide` (speakers, working, picture, question, options side by side, answer, Feathers). To change how Depth looks, change that component, not a deck or the tool page. The tool's Depth section (`DepthMode`) only adds the picker, the level, the follow-on buttons and Present around it. Presenting, a Depth card has one click: Next shows the answer and Back returns to the question (the button and `a` also work). Depth-shaped questions written in the deck (claims, choices, a mistake to find) are drawn by the same slide, so every Depth face looks alike. A deck's Depth card is a `kind: "depth"` reference; to customise a card for one lesson, write an ordinary question (Questions) instead. <!-- ref -->

Every button drawn on a slide (Show answers, New question, Show working, Previous / Next question, the Depth slide's controls) uses `slideButton` (`src/decks/slideButton.ts`): 26 slide units of text in a 48-unit-tall button. Use it for any new slide button instead of styling one by hand. <!-- ref -->

## Rebuilding without losing edits, versions, layouts and templates

- **A rebuild keeps your edits.** Every slide a build writes carries `built`, a hash of the slide as built (`src/decks/merge.ts`). `npm run deck -- build <script> --replace` replaces only slides whose hash still matches, keeps edited slides and slides added in the editor (in place), drops built slides that were not edited and are no longer in the script, and prints what it kept. `--force` overwrites everything. A deck built before slides were stamped is replaced once, and is safe from then on. `npm run deck -- diff <id>` (after a pull) lists the edited and added slides, so what was changed can be learned from, not overwritten.
- **More commands:** `preflight <tool>`, `verify <id>`, `builders`, `sheet <id> 7,13,20` (one picture of those slides), `new <id> <tool>` (preflight plus a build-script skeleton).
- **Version history (editor, File).** Up to six snapshots per deck are kept on the device: one while editing (every ten minutes), one before an update from another device replaces the local copy, and any saved by hand. Restore puts one back and can be undone. <!-- ref -->
- **Layout (editor, top menu)** changes the open slide to another layout and carries its content over (texts to texts, questions to questions, a picture to a picture); anything with no place in the new layout stays where it was. **Save as a template** (Slide menu) keeps a slide on the device, and it then appears under *My templates* in Add slide.

## Printing slides

`PrintSlidesDialog.tsx` (File → Print slides…, and **Print slides** in the player) prints chosen slides 1, 2, 4 or 8 to an A4 sheet, each slide 1 to 8 times (`repeatSlides`); the page is shared into equal slots with each slide centred in its slot, and faint dashed cut lines (`cutLines`) run between slots, so 2 to a sheet cuts exactly in half; **Fill to edges** (`slotAlign`) instead pushes the outer rows and columns to the page edge so the spare paper falls at the cut; the sums (grid, page turn, millimetre sizes, key-point families) are in `slidePrint.ts` and tested in `slidePrint.test.ts`. The pages are drawn into a hidden `#slide-print` area of the page, and the browser's print hides everything else (`body > *:not(#slide-print)`). Each slide cell has `contain: strict`, or Chromium shrinks the whole print to fit the 1600-wide canvas inside it. <!-- ref -->

A `grid` or `worksheet` element has `align`: `left` (the default) or `center`, set under **Questions in their cells** in the toolbar's **Style** menu. It positions the question, and the answer that replaces it, within the cell; the number stays at the left. <!-- ref -->

**Where the controls live.** The ribbon holds every setting, including content: a table's cells, the generator and worksheet settings and a text box's words open as popovers from Home (`Menu` with `panel`, 460 px wide). Home formats what is selected, Insert adds things, Design is the slide's own settings, Arrange is placement. The right-hand panel holds one thing: the list of what is on the slide (`ObjectList`), to pick a thing or change what is in front. <!-- ref -->

**Flowcharts** (`flowchart.ts`, tested in `flowchart.test.ts`): `flowchartEls(prefix, nodes, edges, area)` returns ordinary shape, text and line elements for a flowchart (steps as boxes, questions as ovals, Yes and No results in green and red, arrows between them), so it saves, shares and prints like anything else and each part can be moved by hand afterwards. Nodes sit on a grid (`col` may be fractional), take an optional `step` (the click on which the node appears; an arrow appears on the later of its two ends' clicks, so a loop back to an earlier box waits for the box it leaves) and an optional size; an arrow between nodes not in line bends once (`route` "hv" or "vh"). The Primes and divisibility deck uses it for the rules for 3, 11 and 7, each on a key point slide (family `language`) beside the rule and an example. <!-- ref -->

**The full-screen controls** (`PlayerBar.tsx`): one small bar, the same on every slide so it never changes size: a grip, Back, the slide count, Next, **Slide options** and **Leave full screen**. What a slide can offer (how much of a board, table or picture is filled in, a timer, Jump to a slide, Print slides, the 1 to 100 grids and a book activity's sheets) is in the Slide options pop-out (the timer's minutes in two rows of five). The grip drags the bar along the bottom (its place is remembered on the device); it keeps its right edge out of the ink pencil's corner (`barLeft`), and rises above the ink pencil or hotbar if one is in its way (`liftAbove`; the ink controls carry `data-ink-bar`). It fades out when the mouse rests, and stays while the pop-out is open or it is being dragged. The deck list (`/decks`) has no description or sync line under its title. <!-- ref -->

Authored rectilinear worksheets print four questions per A4 page (2 × 2, one page per kind of question), plus a matching worked key. Generated diagram sheets keep six per A4 page. The Year 7 rectilinear lesson has twelve authored questions across three pupil pages.
