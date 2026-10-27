# Decks — whole lessons, and the slide editor

**Read when:** Building or changing a deck, a slide layout, a deck element, a hand-picked question bank, the player or the editor.

A **deck** is one combined, directed lesson for the projector, played at `/decks/<id>`. It is also a small slide editor, a stripped-down PowerPoint around the site's own pieces: a teacher can refine a deck Claude built, add slides to it, or build their own. Decks wrap what the site already has (generators, hand-picked banks, boards), so a lesson stays in one place; tool pages are unchanged. Decks are the intended successor to the per-tool Teach deck and Lessons modes. Plan: `docs/PROJECTS.md` → Decks.

## Pages

| Address | What |
|---|---|
| `/decks` | Every deck (built, edited on this device, and the teacher's own), **New deck**, and the Slide library link |
| `/decks/library` | Every slide layout with sample content, grouped by family, plus the planned pieces |
| `/decks/<id>` | The player; **Edit** opens the editor (`?edit=1`), **Present** returns |

Reached from the landing page's Developing-tools menu ("Decks") and the tool's burger menu ("Deck: <title>", Developing-tools mode, via `decksForPath`).

## The model (`src/decks/types.ts`)

- A **deck** is `{ id, title, summary, tool?, toolPath?, slides }`.
- A **slide** is `{ id, family, title, els }`: a canvas `CANVAS_W × CANVAS_H` (1600 × 900) units, scaled to fit. The family sets its accent bar (`FAMILY_STYLE`; none is green, yellow or red, the level colours); the title names it in the jump list and the slide strip.
- An **element** is a box (`id, x, y, w, h` in canvas units; a line runs from `(x, y)` to `(x + w, y + h)`, so its `w`/`h` may be negative) and one of:

| `kind` | What | Notes |
|---|---|---|
| `text` | Text, `$…$` inline maths, a new line per line | `size` (≥ `MIN_TEXT` = 26), `bold`, `colour`, `align`, `middle` |
| `shape` | Rectangle or ellipse | `fill`, `stroke`, `strokeWidth`, `radius` |
| `line` | Line or arrow | `colour`, `width`, `arrow` |
| `image` | A picture, stored as a data URL | Large images are scaled to the canvas and saved as JPEG on upload |
| `maths` | An equation on its own | `latex`, `size`, `colour`, `align`; made and changed in the equation editor |
| `board` | A table to write on | `grid` (`head`, `rows`, `given`), `fill` (Filled in / Structure only / Blank: a corner control in the player), `size` |
| `practice` | One targeted question | `tool`, `intention` (misconception id), `bank` (question ids, in order), `generator` (level + the tool's Question Options), `prompt`, `size` |
| `grid` | Several hand-picked questions at once (quickfire block, retrieval starter, exit ticket) | `bank`, `cols`, `size`; answers on demand |
| `generator` | The tool's generator live, like its Whiteboard | `tool`, `preset` (`sub`, `level`, the tool's Question Options), `seed` (the first question, the same every time), `prompt` (blank: the tool's instruction); New question, the working one step at a time, the answer (keys `n`, `s`, `a`) |
| `worksheet` | A book activity: `count` generated questions, numbered | `tool`, `preset`, `count`, `cols`, `seed`; answers on demand, New set, Print (the tool page's worksheet print, `handlePrint`) |
| `depth` | One of a tool's Depth items, drawn flat on the slide in the deck's style (`DepthFlat.tsx`) | `tool`, `item` (an id in the tool's `__test.depthItems`); Show answer turns it to the answer in place |

Any element may carry `step` (1, 2, …): it appears on that click when presenting (Next reveals a slide's next click before moving on; Back hides it). The split discussion layout uses it for its fixed order: prompt, key point, question, answer. Still to come: the core representations, a timer, match-up and sort (listed as "Planned" in the library).

## Layouts (`src/decks/layouts.ts`)

A layout is a function that returns a pre-arranged slide of ordinary elements: title, learning objective, section divider, summary, key vocabulary, key definition, two columns, board, practice question, quickfire block, Depth question, split discussion, retrieval starter, exit ticket, blank. Families: Lesson (structure), Language, Teach, Practice, Depth, Discussion, Retrieval. `LAYOUTS` lists each with its sample content and when to use it; the editor's **Add slide** and the library both read it, and the built decks are written with the same functions (so a built deck and a teacher's slide are the same kind of thing). Add a layout only when a lesson needs it, after checking none in the family does the job.

## Built decks, edits and the teacher's own decks (`src/decks/store.ts`)

- **Built decks** are code (`src/decks/<tool>.ts`, listed in `src/decks/index.ts`, which stays data-only because the shell reads it). Slide ids are stable (`<deck>-<slug>`).
- **Edits are saved on this device** (localStorage) as the teacher makes them: an edited built deck is saved whole under `mt-deck:<id>` and **Reset** returns it to the original; a teacher's own deck (`my-…`) is listed in `mt-decks-mine`. Questions the teacher writes or edits are in `mt-deck-bank` (an edited built question keeps its id, so every deck using it sees the edit; "Back to the original" drops it).
- **Export** downloads the deck as JSON; **Import slides** appends a file's slides to the open deck. Copy / paste (Ctrl+C / Ctrl+V, or the slide's Copy button and "Paste a copied slide") works between slides and between decks.
- **Shared between devices** (`src/decks/cloud.ts`, `api/decks.ts`, `api/_decks.ts`): every save is sent in the background (a moment after the last change) to `/api/decks`, which keeps each deck in its own private Vercel Blob (`decks/<id>.json`), an index (`decks-index.json`) and the shared questions (`deck-questions.json`); the index and questions are written with their ETag, like the dashboard notes. Opening the deck list or a deck pulls any copy newer than the device's (`syncFromCloud`, comparing the deck's own `updatedAt`); nothing is pulled while editing. Header `x-admin-key` as for `/api/tool-notes`. A deck over 4 MB (large pictures) is refused with a message. Where the service is not reachable (the local dev server, no connection) the decks keep working on the device and the status line says so.

## The player (`DeckPage.tsx`, `SlideCanvas.tsx`)

Arrow keys, Page Up/Down and Space move; Home and End jump; `j` opens the jump list; full screen. A practice element opens on its first hand-picked question; **Another question** works through the bank and then the generator; the answer, the working and the teacher notes (the misconception and where the question came from) are separate reveals (`a`, `w`, `t`; `r` another question). Ink is the site's one overlay: on while presenting, off in the editor and the library (`App.tsx`), cleared on every slide change (`mt-ink-clear`) and kept when a board's fill mode changes.

## The editor (`Editor.tsx`, `EditorPanels.tsx`, `geometry.ts`, `EquationEditor.tsx`)

The slide strip on the left, the canvas in the middle, the selection's properties on the right. The chrome lives in `EditorChrome.tsx` (`usePref`, `Menu`, `Section`, `Splitter`, `SlideStrip`, `ObjectList`); the canvas and editing in `Editor.tsx`.

- **Panels:** both side panels hide and show (top bar toggles, or `\` for both), resize by dragging their edge (double-click resets), and remember their width and open state on the device (`usePref`, keys `mt-deck-*`). The canvas refits by itself.
- **Slide strip:** a finder (matches a slide's title, kind and the words on it), pictures or a compact list (the list scales to 28+ slides), drag to reorder (not while filtering), hover to duplicate or delete, and the open slide scrolls into view. A bare "Practice" title shows the misconception it targets (`slideLabel`). **Add slide** is grouped by kind, with a line saying what each layout is for.
- **Top bar:** shapes, text, equation and image stay one click away; the site's pieces (board, practice, Depth, grid, generator, book activity) sit in **Lesson pieces** with a line each; export, import and reset are under **File**; the keys are under the keyboard icon.
- **Properties:** the selection's own controls come first; the rest are collapsible sections that remember open or shut (Click order, Line up and layer, Position and size, **On this slide**). **On this slide** lists every element front first, click to select (Shift adds), arrows change the layer: use it to find something hidden behind something else.

- **Select:** click; Shift-click adds or removes; drag on empty space draws a selection box; Ctrl+A selects the slide.
- **Move and resize:** drag; pull the handles (a line has one at each end). Pink **smart guides** appear when an edge or centre lines up with the slide's edges or centre lines or with another element, and the element snaps to them; otherwise positions snap to a 10-unit grid; hold Alt to place freely. A picture keeps its shape from a corner (Shift to stretch). The geometry is pure and tested (`src/tests/deckGeometry.test.ts`).
- **Line up:** left / centre / right / top / middle / bottom, against the slide (one selected) or the selection's box (several); space three or more evenly across or down; layer (front, forward, back, behind all).
- **Type on the slide:** double-click a text box (or Enter with it selected) and type into it in place; the box grows to fit; Esc or a click elsewhere finishes; the whole edit is one undo step. A new text box opens ready to type.
- **Equation editor:** a visual maths field (MathLive 0.111.0, loaded only when it opens and using the KaTeX fonts the site bundles, so no CDN): type `/` for a fraction, `^` for a power, arrows between boxes; a palette of structures (fraction, mixed number, power, root, brackets, column vector, standard form, recurring dot) and symbols; the LaTeX underneath. It adds an equation element, edits one (double-click), inserts `$…$` at the caret of the text being typed, and opens from the question editor's fields. The result is checked with KaTeX (what slides use) before it can be used.
- **Click order:** "Appears when presenting" sets an element's `step`; the canvas shows a numbered badge.
- Keys: Delete, Ctrl+Z / Ctrl+Shift+Z, Ctrl+D duplicate, Ctrl+C / Ctrl+V (also between decks), arrows nudge (Shift for 1 unit), Page Up/Down change slide. Every `$…$` and question field is checked with KaTeX as it is typed; a question cannot be saved with broken maths, and a warning shows when its last step does not end on the answer. Text under `MIN_TEXT` is flagged as too small for the back of the room. Undo / redo keep 100 steps for the session.

## Hand-picked questions and misconception tags

A `BankQuestion` (`id`, `tool`, `level`, `tag`, `latex`, `answer`, `working`) is written against one tag in `src/shared/misconceptions.ts` (`<tool>-<slug>`): the shared vocabulary for deck questions and Depth options (a wrong `DepthOption` names its misconception in words and may carry the same `tag`). Estimation's Depth bank (`src/tools/Number/EstimationDepth.ts`) was written with its practice bank and uses the tags. A Depth check asks something new: its numbers differ from those of the deck's practice questions, boards and slide text (numbers with two or more significant figures; `decks.test.ts` checks every built deck), so write a tool's Depth items and its practice questions with different numbers from the start. Built banks live in `src/decks/<tool>Bank.ts`; any deck may use any question. A tool's generator is offered as a backup through `src/decks/generators.ts` (the tool's own `__test.generateQuestion` and `TOOL_CONFIG`); add a tool there to make it available to practice elements.

## Tests

`src/tests/decks.test.ts`: every bank question (unique id, known tag, KaTeX, last step ends on the answer); every misconception; every layout and every built deck's slides (unique ids, elements on the canvas, text at least `MIN_TEXT`, KaTeX, rectangular boards); every built practice element (known intention, its questions exist and are written against it at the generator's level, the generator preset runs); every Depth element's item exists in its tool's bank; grid questions exist; steps are whole numbers. `src/tests/deckGeometry.test.ts` (guides, align, distribute) and `src/tests/decksApi.test.ts` (what the API accepts, the index).
