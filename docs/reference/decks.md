# Decks — whole lessons, and the slide editor

**Read when:** Building or changing a deck, a slide layout, a deck element, a slide-owned question set, the player or the editor.

A **deck** is one combined, directed lesson for the projector, played at `/decks/<id>`. It is also a small slide editor, a stripped-down PowerPoint around the site's own pieces: a teacher can refine a deck Claude built, add slides to it, or build their own. Decks wrap what the site already has (generators, authored question sets, boards), so a lesson stays in one place; tool pages are unchanged. Decks are the intended successor to the per-tool Teach deck and Lessons modes. Plan: `docs/PROJECTS.md` → Decks.

## Pages

| Address | What |
|---|---|
| `/decks` | Every deck (built, edited on this device, and the teacher's own), **New deck**, and the Slide library link |
| `/decks/library` | Every slide layout with sample content, grouped by family, plus the planned pieces |
| `/decks/<id>` | The player; **Edit** opens the editor (`?edit=1`), **Present** returns |

Reached from the landing page's Developing-tools menu ("Decks") and the tool's burger menu ("Deck: <title>", Developing-tools mode, via `decksForPath`).

## The model (`src/decks/types.ts`)

- A **deck** is `{ id, title, summary, tool?, toolPath?, slides }`.
- A **slide** is `{ id, family, title, intent?, questionBrief?, els }`: a canvas `CANVAS_W × CANVAS_H` (1600 × 900) units, scaled to fit. The family sets its accent bar (`FAMILY_STYLE`; none is green, yellow or red, the level colours); the title names it in the jump list and the slide strip.
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
| `generator` | The tool's generator live, like its Whiteboard | `tool`, `preset` (`sub`, `level`, the tool's Question Options), `seed` (the first question, the same every time), `prompt` (blank: the tool's instruction); New question, the shared solution stepper, the answer (keys `n`, `s`, `a`); optional `presentation: "whiteboard"` and `visualiser` enable the question-left/workspace-right layout |
| `worksheet` | A book activity: `count` generated questions, numbered | `tool`, `preset`, `count`, `cols`, `seed`; answers on demand, New set, Print (the tool page's worksheet print, `handlePrint`) |
| `depth` | One of a tool's Depth items, drawn flat on the slide in the deck's style (`DepthFlat.tsx`) | `tool`, `item` (an id in the tool's `__test.depthItems`); Show answer turns it to the answer in place |

Any element may carry `step` (1, 2, …): it appears on that click when presenting (Next reveals a slide's next click before moving on; Back hides it). The split discussion layout uses it for its fixed order: prompt, key point, question, answer. Still to come: the core representations, a timer, match-up and sort (listed as "Planned" in the library).

## Layouts (`src/decks/layouts.ts`)

A layout is a function that returns a pre-arranged slide of ordinary elements: title, learning objective, section divider, summary, key vocabulary, key definition, two columns, board, skill practice, quickfire block, Depth card, split discussion, retrieval starter, exit ticket, blank. Families: Lesson (structure), Language, Teach, Practice, Depth, Discussion, Retrieval. `LAYOUTS` lists each with its sample content and when to use it; the editor's **Add slide** and the library both read it, and the built decks are written with the same functions (so a built deck and a teacher's slide are the same kind of thing). Add a layout only when a lesson needs it, after checking none in the family does the job.

## Built decks, edits and the teacher's own decks (`src/decks/store.ts`)

- **Built decks** are code (`src/decks/<tool>.ts`, listed in `src/decks/index.ts`, which stays data-only because the shell reads it). Slide ids are stable (`<deck>-<slug>`).
- **Edits are saved on this device** (localStorage) as the teacher makes them: an edited built deck is saved whole under `mt-deck:<id>` and **Reset** returns it to the original; a teacher's own deck (`my-…`) is listed in `mt-decks-mine`. Question copies are embedded in each deck. Editing them changes that deck only and participates in deck undo. `mt-deck-bank` retains old personal library records for legacy reference resolution. Ordinary authoring has no library browse or save action. <!-- ref -->
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
- Keys: Delete, Ctrl+Z / Ctrl+Shift+Z, Ctrl+D duplicate, Ctrl+C / Ctrl+V (also between decks), arrows nudge (Shift for 1 unit), Page Up/Down change slide. Every `$…$` and question field is checked with KaTeX as it is typed; a question cannot be saved with broken maths, and incomplete questions can be saved as drafts. Text under `MIN_TEXT` is flagged as too small for the back of the room. Undo / redo keep 100 steps for the session.

### Generator configuration

Generator questions and book activities use the central **Configure generator** dialog (`src/decks/GeneratorDialog.tsx`). New generator elements and generator layouts open it automatically; existing elements have a **Configure generator…** button in their properties and open on double-click. The side panel keeps a setup summary and the element’s placement controls.

The dialog loads the tool’s own tabs, available levels and Question Options, with spacious option groups, the shared level selector and a scaled slide preview. Book activities also offer question count and columns; generator slides and activities can override the instruction and choose a different first question or set. Optional pools may be emptied; other pools keep at least one choice, and dependent options are disabled until their requirements are met. Switching a question type selects a supported level.

Configuration stays in a draft until **Apply to slide**, which saves it as one undo step. **Cancel**, Escape and clicking the backdrop discard the draft. The native modal dialog traps focus and makes the editor inert; editor keyboard shortcuts are suspended while it is open. At narrow widths the controls and preview stack, with the actions kept visible.

### Whiteboard generator slides

**Add slide → Whiteboard generator** adds the tool-shell Whiteboard arrangement: question on the left, blank writing space on the right. Use the existing deck pen to model working in the blank space. When **Show working** opens the solution, the question contracts upward in its own left panel; the generator’s numbered steps unfold below it, with backwards navigation and final answer reveal. The workspace stays the same size and position, and existing ink remains during the reveal. **New question** resets the solution and clears ink. Ordinary generator and authored-question slides keep their existing side-by-side reveal.

This is a generator element with `presentation: "whiteboard"`, retaining its ordinary `tool`, `preset`, `seed`, instruction and size. `whiteboardSlide` creates the layout; old generator elements without the flag keep their original appearance. **Configure generator → Slide layout** switches either layout in one Apply/Cancel draft. The whiteboard layout also offers **Offer camera visualiser when presenting** (`visualiser`, enabled by default). Tool-page **Send to a deck** offers the whiteboard layout separately. The Estimation whole-number Whiteboards slide demonstrates it; its fraction generator remains in the original layout.

**Start visualiser** explicitly opens a document camera/webcam in the right panel. It uses the shared `useVisualiser` hook, prefers an external camera, offers an accessible device selector, fits the complete feed without cropping, and keeps the stream in place while questions or solution steps change. **Stop visualiser** returns to blank working space. Permission/no-camera errors offer Retry and remain recoverable with Stop. Thumbnails and editor/configuration previews do not request a camera. Stream tracks are stopped on exit/unmount, replacement, and when an asynchronous request completes after exit. Streams, permissions and device IDs are runtime state and are excluded from deck saves/exports. <!-- ref -->

The shared solution stepper accepts `layout: "split" | "stacked"`, defaulting to split. Stacked changes only the left panel’s question/working positions; it retains the same canonical solution contents, progress controls, scroll-following and reduced-motion behaviour.

## Slide-owned question editor

**Skill practice** (toolbar, selected element or double-click) opens `QuestionWorkspace.tsx` directly on this slide’s ordered set. Select a question, edit **Question**, **Answer**, **Worked steps**, or use **Add my own question**. Duplicate, move earlier/later and Remove change the same draft. **Teaching details · optional** holds title, tool/level, alternative formats and misconception guidance. Grids offer open-response content. There is no bank browser, source filter, library registration or Save to library.

**Question brief** expands above the set: skill/slide title, teaching purpose, question focus, requested count (default five), exclusions, progression, examples and generator solution reference. The saved `questionBrief` contains `{count, exclude, progression, examples, solution: {tool, sub, level}}`; title and purpose/focus reuse `Slide.title` and `Slide.intent`. **Copy question brief** produces plain text with the deck name and stable slide ID for chat. Solution reference is a guide to authoring, not a generate button. Changing a brief leaves existing questions and teacher-entered working intact. Mixed-level checks retain each question’s own level.

**Apply to slide** saves title, brief and questions as one undo step. Cancel/Escape discards the draft; an unsaved draft recovers after reload from sessionStorage. Empty questions can be saved as drafts, and shorter sets are allowed. Ready content has a title, question, answer and valid format-specific content. Teaching metadata is optional. Invalid maths blocks Apply with a clear message. The native dialog keeps focus inside; nested equation editing remains available.

**Depth card** is a separate layout and picker: tool, level, search, Preview card and Use this card. Its initial tool is the deck’s tool. Existing cards keep their claims, options, worked-error lines, explanations and diagrams. The tool-page Depth mode remains available. Ordinary practice does not load the Depth library.

### Planning and authoring a set

Whether planning independently or following Harry’s requirements, write the slide’s teaching intention and question brief before authoring. Derive missing briefs from the lesson objective, prerequisites and ordered progression; supplied constraints take precedence. Store fixed questions directly with their slide. The same brief editor is available in Lesson thread; the classroom display omits it. <!-- R43 -->

Author at least five distinct fixed questions per skill-practice slide by default, deliberately varying the permitted operands and structures. Include correct answers and worked solutions. Diagnostics and exit tickets can stay short. Optional misconception guidance has example-specific incorrect responses; verify those differ from the correct answer. Teachers can save drafts or choose shorter sets without a hard minimum. <!-- R42 -->

Solutions match the referenced generator’s method, labels, notation, ordering and reveal boundaries, including its Original step where present. Inspect actual generator working before authoring. Estimation’s fixed sets and generator use `src/shared/estimationWorking.ts` for canonical Original/Round/Calculate assembly; authored fractions also retain the Numerator reveal and parentheses. Each canonical step becomes one reveal, followed by the separate final answer. User-written working stays editable. <!-- R42 -->

The Estimation lesson embeds eight five-question practice sets and a mixed exit ticket with their own briefs. Legacy bank definitions remain compatibility data; new authoring does not depend on lookups. Existing teaching notes are preserved, and Depth keeps its original reasoning.

### Compatibility and visuals

`materializeDeck` in `questions.ts` converts legacy `practice` and `depth` elements into embedded `questions`, and adds embedded grid content. Opening the editor prepares a working copy but does not write a migration or alter the source bank. Save/export and tool-page captures use the prepared content. Missing sources become explicit placeholders; they are never filtered out. Export/import works with an empty personal library. The API accepts both legacy and version-2 library entries and validates nested question content in decks. <!-- ref -->

Compiled Depth visuals remain explicit `{tool,item}` references: render functions are never serialized. The workspace previews the original visual and locks the linked student-facing content until **Remove diagram and unlock content** is chosen. Guidance is independently editable. If a built-in visual is unavailable in a future version, the deck keeps its question content and displays a replacement warning. This is a built-in visual dependency, not a general diagram authoring system. <!-- ref -->

A `BankQuestion` remains the legacy built-bank authoring shape, optionally with `title` and `teaching` metadata, adapted into version-2 questions. Built banks and tool-page Depth banks remain code. Existing Depth numbers still differ from the lesson's practice numbers; keep that check when authoring.

## Tests

`curatedQuestions.test.ts` checks independent copies, legacy adaptation, missing references, portable export/import, all diagnostic formats, built-in visual references, optional guidance and API validation. Existing decks, geometry and Depth suites remain in place. Start `npm run dev`, then run `npm run smoke:questions` with Playwright and Chromium installed. Optional `SMOKE_URL`, `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` select an existing server and browser. It checks editing, Apply/Cancel, undo/redo, source isolation, export, draft recovery, Depth discovery, responsive modal actions and classroom sequencing. It intercepts sharing requests so no teacher's shared content is modified. Screenshots go to a temporary directory.

`solutionStepper.test.ts` checks question/step/answer disclosure and bounded progress. `npm run smoke:solutions` checks the actual left/right positions and stable question node, staged answers, backwards navigation, Show All, progress dots, keyboard controls, generator reset, diagnostic choices, narrow previews and reduced motion. It uses the same optional browser/server environment settings as `smoke:questions` and intercepts sharing requests.


### Lesson thread and quieter controls

Each slide carries optional `intent: { purpose, questionFocus, evidence, next }` for the ordered teaching thread. Write it before choosing content, whether authoring independently or from Harry’s instructions; practice slides also carry the structured question brief. Read the thread before changing the sequence. <!-- R43 -->

**Lesson thread** opens a central ordered map from the editor. Selecting a slide shows four editable fields; Apply saves the complete draft as one undoable change, while Cancel/Escape discards it. Slide thumbnails show the purpose and visibly flag missing briefs. Generator configuration repeats the current slide’s brief alongside its settings. The Estimation pilot has a complete thread, including explicit whole-number transfer, decimal book activity and compound-fraction transfer briefs. Older personal decks remain compatible and show missing purposes for their authors to fill in. Briefs survive duplicate, save, share and JSON export/import; the classroom renderer omits them.

Questions initially show **Show working**, plus **More** for answer shortcuts and teacher guidance. Once working opens, its existing Previous/Next step controls carry the reveal; the redundant outer working button disappears. **Solution options** holds Show all and individual step jumps. Generator slides retain New question. Keyboard shortcuts stay available. More closes on action, focus leaving or Escape.

Verification: `npm run smoke:thread` exercises draft cancellation, Apply/reload persistence, the generator’s contextual brief and phone/tablet/laptop layouts (Playwright/Chromium configuration as for the other smoke scripts).

`skillQuestions.test.ts` checks portable briefs, bank-free built practice, optional guidance, legacy resolution, final answers and generator-versus-authored solution parity. The question browser smoke checks direct authoring, copying briefs, atomic undo, custom drafts, export, Depth selection, responsive actions and classroom sequencing.

`npm run smoke:whiteboard` checks left/right placement, upward contraction, unchanged workspace bounds, reset, reduced motion, editor Apply/Cancel and camera opt-out. It uses simulated cameras to verify video playback, device switching, denial/retry, no preview access and cleanup including late permission completion. `whiteboardDeck.test.ts` covers the layout and portable data contract.
