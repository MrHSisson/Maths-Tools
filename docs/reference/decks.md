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
| `board` | A table to write on | `grid` (`head`, `rows`, `given`), `fill` (Filled in / Structure only / Blank: a corner control in the player), `size` |
| `practice` | One targeted question | `tool`, `intention` (misconception id), `bank` (question ids, in order), `generator` (level + the tool's Question Options), `prompt`, `size` |

Integrated elements still to come: Depth item, split discussion, retrieval starter, the core representations (listed as "Planned" in the library).

## Layouts (`src/decks/layouts.ts`)

A layout is a function that returns a pre-arranged slide of ordinary elements: title, learning objective, section divider, summary, key vocabulary, key definition, two columns, board, practice question, blank. `LAYOUTS` lists each with its sample content and when to use it; the editor's **Add slide** and the library both read it, and the built decks are written with the same functions (so a built deck and a teacher's slide are the same kind of thing). Add a layout only when a lesson needs it, after checking none in the family does the job.

## Built decks, edits and the teacher's own decks (`src/decks/store.ts`)

- **Built decks** are code (`src/decks/<tool>.ts`, listed in `src/decks/index.ts`, which stays data-only because the shell reads it). Slide ids are stable (`<deck>-<slug>`).
- **Edits are saved on this device** (localStorage) as the teacher makes them: an edited built deck is saved whole under `mt-deck:<id>` and **Reset** returns it to the original; a teacher's own deck (`my-…`) is listed in `mt-decks-mine`. Questions the teacher writes or edits are in `mt-deck-bank` (an edited built question keeps its id, so every deck using it sees the edit; "Back to the original" drops it).
- **Export** downloads the deck as JSON; **Import slides** appends a file's slides to the open deck. Copy / paste (Ctrl+C / Ctrl+V, or the slide's Copy button and "Paste a copied slide") works between slides and between decks.
- A shared store (so edits follow the teacher between devices) is the next step; the dashboard's Vercel Blob is the pattern.

## The player (`DeckPage.tsx`, `SlideCanvas.tsx`)

Arrow keys, Page Up/Down and Space move; Home and End jump; `j` opens the jump list; full screen. A practice element opens on its first hand-picked question; **Another question** works through the bank and then the generator; the answer, the working and the teacher notes (the misconception and where the question came from) are separate reveals (`a`, `w`, `t`; `r` another question). Ink is the site's one overlay: on while presenting, off in the editor and the library (`App.tsx`), cleared on every slide change (`mt-ink-clear`) and kept when a board's fill mode changes.

## The editor (`Editor.tsx`)

The slide strip on the left (Add slide from a layout), the canvas in the middle, the selected element's properties on the right (with no selection: the slide's title, family, order and the deck's summary). Click to select, drag to move, pull the handles to resize (a line has one handle at each end); positions snap to 10 units (hold Alt to place freely). Double-click text to edit it. Keys: Delete, Ctrl+Z / Ctrl+Shift+Z, Ctrl+D duplicate, Ctrl+C / Ctrl+V, arrows nudge (Shift for 1 unit), Page Up/Down change slide. Every `$…$` and question field is checked with KaTeX as it is typed; a question cannot be saved with broken maths, and a warning shows when its last step does not end on the answer. Text under `MIN_TEXT` is flagged as too small for the back of the room. Undo / redo keep 100 steps for the session.

## Hand-picked questions and misconception tags

A `BankQuestion` (`id`, `tool`, `level`, `tag`, `latex`, `answer`, `working`) is written against one tag in `src/shared/misconceptions.ts` (`<tool>-<slug>`): the shared vocabulary for deck questions and, as Depth and the banks are balanced together, Depth options. Built banks live in `src/decks/<tool>Bank.ts`; any deck may use any question. A tool's generator is offered as a backup through `src/decks/generators.ts` (the tool's own `__test.generateQuestion` and `TOOL_CONFIG`); add a tool there to make it available to practice elements.

## Tests

`src/tests/decks.test.ts`: every bank question (unique id, known tag, KaTeX, last step ends on the answer); every misconception; every layout and every built deck's slides (unique ids, elements on the canvas, text at least `MIN_TEXT`, KaTeX, rectangular boards); every built practice element (known intention, its questions exist and are written against it at the generator's level, the generator preset runs).
