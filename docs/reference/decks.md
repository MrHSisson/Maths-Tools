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
| `questions` | A curated sequence of deck-owned questions | `items: CuratedQuestion[]`, optional `size`; open response, multiple choice, compare claims, find the first error |
| `practice` | Legacy bank references | Read for compatibility; converted to deck copies when editing/exporting. Generator fallback is no longer used. |
| `grid` | Several open-response questions at once | Embedded `items`, `cols`, `size`; legacy `bank` references remain readable. Rich diagnostics belong in a Questions activity. |
| `generator` | The tool's generator live, like its Whiteboard | `tool`, `preset` (`sub`, `level`, the tool's Question Options), `seed` (the first question, the same every time), `prompt` (blank: the tool's instruction); New question, the shared side-by-side solution stepper, the answer (keys `n`, `s`, `a`) |
| `worksheet` | A book activity: `count` generated questions, numbered | `tool`, `preset`, `count`, `cols`, `seed`; answers on demand, New set, Print (the tool page's worksheet print, `handlePrint`) |
| `depth` | One of a tool's Depth items, drawn flat on the slide in the deck's style (`DepthFlat.tsx`) | `tool`, `item` (an id in the tool's `__test.depthItems`); Show answer turns it to the answer in place |

Any element may carry `step` (1, 2, …): it appears on that click when presenting (Next reveals a slide's next click before moving on; Back hides it). The split discussion layout uses it for its fixed order: prompt, key point, question, answer. Still to come: the core representations, a timer, match-up and sort (listed as "Planned" in the library).

## Layouts (`src/decks/layouts.ts`)

A layout is a function that returns a pre-arranged slide of ordinary elements: title, learning objective, section divider, summary, key vocabulary, key definition, two columns, board, practice question, quickfire block, Depth question, split discussion, retrieval starter, exit ticket, blank. Families: Lesson (structure), Language, Teach, Practice, Depth, Discussion, Retrieval. `LAYOUTS` lists each with its sample content and when to use it; the editor's **Add slide** and the library both read it, and the built decks are written with the same functions (so a built deck and a teacher's slide are the same kind of thing). Add a layout only when a lesson needs it, after checking none in the family does the job.

## Built decks, edits and the teacher's own decks (`src/decks/store.ts`)

- **Built decks** are code (`src/decks/<tool>.ts`, listed in `src/decks/index.ts`, which stays data-only because the shell reads it). Slide ids are stable (`<deck>-<slug>`).
- **Edits are saved on this device** (localStorage) as the teacher makes them: an edited built deck is saved whole under `mt-deck:<id>` and **Reset** returns it to the original; a teacher's own deck (`my-…`) is listed in `mt-decks-mine`. Question copies are embedded in each deck. Editing them changes that deck only and participates in deck undo. `mt-deck-bank` is the separate personal library: **Save a copy to my library** creates a new id, never updates every use. Legacy personal edits remain readable. <!-- ref -->
- **Export** materializes legacy question references and downloads the complete question content, including misconception descriptions and teaching guidance, as JSON; **Import slides** appends a file's slides to the open deck. Copy / paste (Ctrl+C / Ctrl+V, or the slide's Copy button and "Paste a copied slide") works between slides and between decks.
- **Shared between devices** (`src/decks/cloud.ts`, `api/decks.ts`, `api/_decks.ts`): every save is sent in the background (a moment after the last change) to `/api/decks`, which keeps each deck in its own private Vercel Blob (`decks/<id>.json`), an index (`decks-index.json`) and the shared questions (`deck-questions.json`); the index and questions are written with their ETag, like the dashboard notes. Opening the deck list or a deck pulls any copy newer than the device's (`syncFromCloud`, comparing the deck's own `updatedAt`); nothing is pulled while editing. Header `x-admin-key` as for `/api/tool-notes`. A deck over 4 MB (large pictures) is refused with a message. Where the service is not reachable (the local dev server, no connection) the decks keep working on the device and the status line says so.

## The player (`DeckPage.tsx`, `SlideCanvas.tsx`)

Arrow keys, Page Up/Down and Space move slides; Home and End jump; `j` opens the jump list; full screen. Curated activities have **Previous question**, **Next question**, a question count and an explicit end of sequence. Answers start hidden on every question. **Show working** moves the question smoothly from the centre to the right and opens the unfolding solution on the left. Previous / Next step, progress dots and **Show all / Step-by-Step** navigate its numbered timeline; earlier steps dim, the newest is highlighted, and the final answer has a green A marker. **Show answer** (`a`) jumps to that final solution; `w` advances one beat; **Teacher guidance** (`t`) remains separate. Guidance replaces the student content and is explicitly labelled visible on this display. Choices and worked lines can be selected before the reveal. Curated sequences never fall through to a generator; add a generator activity separately. Answer notation belongs to the authored content (Estimation explicitly includes approximation). Curated questions, generator questions and workspace previews share `src/shared/components/SolutionStepper.tsx`. The question stays in the same DOM node during the move. Hiding the working returns it to the centre; changing question clears solution progress. Long solutions follow the newest step inside their own column, keeping question and navigation in place. A narrow popup stacks question above working; the 16:9 classroom canvas keeps the split. Reduced-motion preferences disable the drift and fades. Ink clears on a question or slide change. <!-- ref -->


## The editor (`Editor.tsx`, `EditorPanels.tsx`, `geometry.ts`, `EquationEditor.tsx`)

The slide strip on the left (Add slide from a layout), the canvas in the middle, the selection's properties on the right (with no selection: the slide's title, family, order and the deck's summary).

- **Select:** click; Shift-click adds or removes; drag on empty space draws a selection box; Ctrl+A selects the slide.
- **Move and resize:** drag; pull the handles (a line has one at each end). Pink **smart guides** appear when an edge or centre lines up with the slide's edges or centre lines or with another element, and the element snaps to them; otherwise positions snap to a 10-unit grid; hold Alt to place freely. A picture keeps its shape from a corner (Shift to stretch). The geometry is pure and tested (`src/tests/deckGeometry.test.ts`).
- **Line up:** left / centre / right / top / middle / bottom, against the slide (one selected) or the selection's box (several); space three or more evenly across or down; layer (front, forward, back, behind all).
- **Type on the slide:** double-click a text box (or Enter with it selected) and type into it in place; the box grows to fit; Esc or a click elsewhere finishes; the whole edit is one undo step. A new text box opens ready to type.
- **Equation editor:** a visual maths field (MathLive 0.111.0, loaded only when it opens and using the KaTeX fonts the site bundles, so no CDN): type `/` for a fraction, `^` for a power, arrows between boxes; a palette of structures (fraction, mixed number, power, root, brackets, column vector, standard form, recurring dot) and symbols; the LaTeX underneath. It adds an equation element, edits one (double-click), inserts `$…$` at the caret of the text being typed, and opens from the question editor's fields. The result is checked with KaTeX (what slides use) before it can be used.
- **Click order:** "Appears when presenting" sets an element's `step`; the canvas shows a numbered badge.
- Keys: Delete, Ctrl+Z / Ctrl+Shift+Z, Ctrl+D duplicate, Ctrl+C / Ctrl+V (also between decks), arrows nudge (Shift for 1 unit), Page Up/Down change slide. Every `$…$` and question field is checked with KaTeX as it is typed; a question cannot be saved with broken maths, and a warning shows when its last step does not end on the answer. Text under `MIN_TEXT` is flagged as too small for the back of the room. Undo / redo keep 100 steps for the session.

### Generator configuration

Generator questions and book activities use the central **Configure generator** dialog (`src/decks/GeneratorDialog.tsx`). New generator elements and generator layouts open it automatically; existing elements have a **Configure generator…** button in their properties and open on double-click. The side panel keeps a setup summary and the element’s placement controls.

The dialog loads the tool’s own tabs, available levels and Question Options, with spacious option groups, the shared level selector and a scaled slide preview. Book activities also offer question count and columns; generator slides and activities can override the instruction and choose a different first question or set. Optional pools may be emptied; other pools keep at least one choice, and dependent options are disabled until their requirements are met. Switching a question type selects a supported level.

Configuration stays in a draft until **Apply to slide**, which saves it as one undo step. **Cancel**, Escape and clicking the backdrop discard the draft. The native modal dialog traps focus and makes the editor inert; editor keyboard shortcuts are suspended while it is open. At narrow widths the controls and preview stack, with the actions kept visible.

## Questions workspace

**Questions…** (toolbar, selected element, or double-click) opens `QuestionWorkspace.tsx`. Browse the built practice bank, personal library and every available ToolShell Depth bank using rendered cards and filters for tool, level, purpose, format, source and misconception. Preview question, answer, explanation and guidance before adding it. **Create / Edit** offers four formats and the existing equation editor. **Sequence** previews, reorders (buttons or drag), edits and removes the deck copies. The side panel holds a summary and placement controls only. Grids offer only open-response content.

Configuration stays in a draft until **Apply to deck**, which is one undo step. Cancel, Escape and the backdrop discard it. New questions must be added to the sequence or explicitly discarded before applying. Unsaved workspace drafts recover after reload from sessionStorage, without changing the saved deck. Native dialog handles focus trapping; tab navigation supports arrows, Home and End, and background editor shortcuts are suspended. The equation editor's Escape closes only that nested editor. <!-- ref -->

### Question content and teaching quality

`CuratedQuestion` version 2 is a serializable format union shared with the API in `api/_questions.ts`: common title, tool, level, purpose, student question, answer, explanation, status, misconception description, optional related misconceptions, rationale, expected wrong responses and a follow-up. Each copied question can retain source provenance. Custom misconception descriptions are editable; authors do not need to add registry code. Text uses `$…$` inline maths; worked-error lines use LaTeX. Invalid maths cannot be applied or saved to the library. Incomplete teaching guidance can be retained as a labelled draft. Marking practice/diagnose content ready requires rationale, misconception, an expected error with reasoning, and a follow-up. <!-- ref -->

A tag is not evidence that a question diagnoses thinking. Ask for working, record the actual wrong response this example can produce, and check that it differs from the correct answer. The Estimation pilot now supplies example-specific guidance. Two examples were replaced because their intended wrong method produced the right answer: `est-06` now uses 451 − 123; `est-14` uses (58 + 47) / 19. Existing Depth items keep their purpose, claims, options, errors and reasoning, including all tagged misconceptions; untagged extension/reasoning activities remain available without inventing diagnostic labels.

### Building a practice sequence

**Default minimum: five distinct, fixed questions per authored misconception-practice slide.** This is the starting point for a lesson build, not a limit: add more where the idea needs it. Keep the intended level and misconception consistent, vary the place values/operations/structure deliberately, and order from a clear first example to a useful transfer example. Each question includes its own answer, working, expected wrong response, reasoning and follow-up. Verify that the stated wrong method actually gives that response and that it differs from the correct answer; a generic tag or five different ids is insufficient. The built-deck tests enforce the minimum and distinct content. <!-- R42 -->

Build checklist: (1) name the misconception and level; (2) author the five-or-more examples with their teaching guidance; (3) verify correct and incorrect methods; (4) add every question to the slide's sequence and check it in the player. A single Depth diagnostic, discussion or short exit ticket keeps its intended length. Teachers can still create drafts and choose shorter sequences; the build standard does not block their edits. Estimation's eight practice sequences each contain five questions (40 total). <!-- R42 -->

### Compatibility and visuals

`materializeDeck` in `questions.ts` converts legacy `practice` and `depth` elements into embedded `questions`, and adds embedded grid content. Opening the editor prepares a working copy but does not write a migration or alter the source bank. Save/export and tool-page captures use the prepared content. Missing sources become explicit placeholders; they are never filtered out. Export/import works with an empty personal library. The API accepts both legacy and version-2 library entries and validates nested question content in decks. <!-- ref -->

Compiled Depth visuals remain explicit `{tool,item}` references: render functions are never serialized. The workspace previews the original visual and locks the linked student-facing content until **Remove diagram and unlock content** is chosen. Guidance is independently editable. If a built-in visual is unavailable in a future version, the deck keeps its question content and displays a replacement warning. This is a built-in visual dependency, not a general diagram authoring system. <!-- ref -->

A `BankQuestion` remains the legacy built-bank authoring shape, optionally with `title` and `teaching` metadata, adapted into version-2 questions. Built banks and tool-page Depth banks remain code. Existing Depth numbers still differ from the lesson's practice numbers; keep that check when authoring.

## Tests

`curatedQuestions.test.ts` checks independent copies, legacy adaptation, missing references, portable export/import, all diagnostic formats, built-in visual references, ready guidance and API validation. Existing decks, geometry and Depth suites remain in place. Start `npm run dev`, then run `npm run smoke:questions` with Playwright and Chromium installed. Optional `SMOKE_URL`, `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` select an existing server and browser. It checks editing, Apply/Cancel, undo/redo, source isolation, export, draft recovery, Depth discovery, responsive modal actions and classroom sequencing. It intercepts sharing requests so no teacher's shared content is modified. Screenshots go to a temporary directory.

`solutionStepper.test.ts` checks question/step/answer disclosure and bounded progress. `npm run smoke:solutions` checks the actual left/right positions and stable question node, staged answers, backwards navigation, Show All, progress dots, keyboard controls, generator reset, diagnostic choices, narrow previews and reduced motion. It uses the same optional browser/server environment settings as `smoke:questions` and intercepts sharing requests.
