# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. At the **start of a new
conversation** read only the top few entries to see where we're up to (older
months are in `docs/history/`); add an entry at the **end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `docs/TASKS.md` · `docs/pathways/` — what is open and what is being built. *The plan.*
- `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` — the two purpose-built shells' architecture.
- `docs/GLOSSARY.md` — canonical names for every element. *The vocabulary.*
- **`docs/PATCH_NOTES.md` (this file)** — what actually happened, session by session. *The history.*

The site hosts **two subjects** and they are tracked separately below: **Maths**
(the bulk of the app, built on `ToolShell`) and **Computer Science** (a younger
strand on its own `CSShell`). See `CLAUDE.md` → "Two subjects — repository map".
Keep the split even when a session only touches one.

> **This file is history, not status.** For "where are we now / what's next", see
> `docs/TASKS.md` and `docs/pathways/` — the planning surfaces. This file is the newest-first record
> of what each session shipped.

> **Entries name the agent.** Each entry ends with an `Agent: Codex` or `Agent: Claude Code` line and a `Notes:` line naming its planner Build Log block (tagged `agent:codex` or `agent:claude-code`). Entries go inside the Maths or Computer Science section below, never above this introduction.

> **Dates** are the commit dates of the session's work. Newest first within each
> strand. An entry is a *session's worth* of work, not a per-commit changelog —
> group by what was actually built and link the tool/page it touched.

---

# Maths

### 2026-10-28 — Planning docs replaced by tasks and pathways; agent hand-off; Overview note
- **What:** `docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md` are retired. The plan is now `docs/TASKS.md` (smaller to-dos), `docs/pathways/` (one file per large development: status, intention, progress, next steps). The dashboard's Developments tab has a drop-down between Tasks, Pathways and Feature tracker (the old Tool notes view without the in-development / wants-to-change boxes) (pathways show one stage chip; pathways grouped in progress, ideas, done, paused; a rolling-out pathway shows x/n live tools from a tool fact); the old To look at, Settled decisions and Future views are gone. Settled decisions moved to a planner archive note.
- Dashboard: the Next up view is removed (List and Matrix remain).
- **Agents:** anyone can work anywhere, one agent per area at a time, coordinated through the planner note Maths Tools - Handoff (`AGENTS.md`, `CLAUDE.md`). New planner note Maths Tools - Overview (tools index, being worked on, added in the last month).
- Code: `scripts/adminDocs.mjs` (reads tasks and pathways), `src/admin/PlanPages.tsx`, `AdminPage.tsx`, `DevelopmentsPage.tsx` (now "Tool notes"). References to the old docs updated across docs, specs and code comments.
- **Not done:** old patch notes not yet moved to the planner Build Log; `CLAUDE.md` not yet slimmed; retired planner pages (tool pages, Tool Index, Feature Guide, Development Prongs) not yet cleared; branch not merged.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Tasks and pathways replace the planning docs (Claude Code)".

### 2026-10-28 — CI on main was red: a rare Order of Operations mistake question
- CI on `main` failed on the merges of #109 and #110 in `orderOfOperations.test.ts` (build, lint and the shell smoke check passed). Cause: the "−3² as 9" mistake question only applies when the random expression starts with a negative number, and the generator tried 80 times before giving up (a teacher would then silently get a different question type) while the test sampled 40; both missed about 1 run in 60. The generator now tries 400 times and the test samples 400, which passed 60 runs in a row.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Swap sides: question left or right in every two-sided layout of the shell
- **What:** a per-device setting that mirrors the Whiteboard's question and working box (embedded and fullscreen, with the divider drag measured from the question's side) and the Worked Example's steps and picture. Set from the landing-page menu ("Two-sided layouts: Question left / Question right"), each tool's menu ("Swap Sides") and a button on the fullscreen bars. Phone and tablet layouts are single column and are unchanged.
- Code: `useSwapSides` / `setSwapSides` in `layoutMode.ts`, `SwapSidesButton.tsx`, `WhiteboardView.tsx`, `WorkedExampleSteps.tsx`, `MenuDropdown.tsx`, `LandingPage.tsx`. Not yet: DecisionShell's own splits. Reference: `docs/reference/toolshell.md`; Features: "Swap sides".
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Whiteboard: answer replaces the question, content fits the box; scalene triangles in Perimeter & Area
- **Fits the box:** the Whiteboard's question box now shrinks its content to fit (it only grew content when the working panel was collapsed), so a tall diagram or a wordy question, with or without its answer, no longer runs out of the box. Perimeter & Area overflowed by up to 111px at laptop size; now 0, and Percentages, Ratio Sharing, Best Buys, Speed Distance Time and Ratio Manipulation measure 0 at laptop and tablet sizes.
- **Answer replaces the question:** on the Whiteboard (embedded and fullscreen) a text question is swapped for its answer, large and green, in the same place, as a Worksheet cell already does; the box is sized for the larger of the two so nothing shrinks or jumps. Picture tools (their own `questionRenderer`) keep the picture; Perimeter & Area now reserves room for its answer line so the picture does not shrink when the answer appears. The other picture tools still add their answer beneath the picture and are not yet changed.
- **Scalene triangles** (Perimeter & Area, Standard Shapes, Level 2, on by default): eight whole-number triangles built from two Pythagorean triples sharing the height, with all three sides and the height labelled; Level 3 (find a missing length) now offers right-angled, isosceles and scalene triangles: the area is given and either the height or the width is the marked length (the "Triangle" option is renamed Right-Angled Triangle). The working draws the dashed rectangle round the triangle: area of the rectangle = 2 × area of the triangle; area of the rectangle = width × height; then width or height = area ÷ the other. Tests added (`perimeterArea.test.ts`).
- Code: `WhiteboardView.tsx` (`questionOrAnswer`, `fit`), `ScaleToFit.tsx`, `perimeterArea/shapes.ts` (`SCALENE`), `pools.ts`.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Keep Depth cards standalone

Depth now uses a full-slide question face and a full-slide answer face, preserving the cast, speech bubbles, Feathers, diagnostic feedback, diagrams and complete reasoning. Removed its workspace layout picker and split solution stepper, plus redundant navigation on single cards. Saved older workspace settings are ignored during presentation and normalized on edit/export without changing content. Shared layouts remain available for ordinary fixed question sets and live generators; Depth retains its own menu entry.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.


### 2026-10-28 — Restore Depth characters and blue-white deck paper

Restored the existing Depth cast, speech bubbles and Feathers in the shared question renderer and card picker. The old conversion preserved claims as text but omitted the artwork and owl prompts. Cards now keep their canonical question nudge and answer takeaway through save/export, with optional editing and the existing Feathers mute preference. Older Depth copies gain missing artwork hints without replacing teacher edits. All three question layouts remain available. Deck paper, writing spaces, previews and the surrounding page now use a light blue-white tint instead of a white canvas.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.


### 2026-10-28 — Shared question layouts and quieter workspaces

Fixed sets, live generators and Depth cards now share three editor-selected layouts: Full-width, Workspace right and Workspace left. Question content, briefs and order remain independent of display, with Apply/Cancel, undo and draft recovery covering layout settings. A fixed set’s camera remains connected between questions and while viewing teaching guidance. Camera actions/device selection sit under one Workspace options menu; permanent camera headers were removed. Question entries are grouped in Add slide and the library. Reduced page margins, panel padding and built-layout insets give more space to the lesson; saved custom element positions remain intact.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.


### 2026-10-28 — Whiteboard generator slides with optional visualiser

Added a Whiteboard generator layout: generated question left, blank writing workspace right; solution reveal moves the question upward and unfolds canonical steps beneath it while retaining the workspace. Add it through the slide layouts, generator configuration or Send to a deck. The Estimation whole-number Whiteboards slide demonstrates it. Camera visualiser is optional per slide and starts only on request during presentation, with device selection, retry and a return to blank working. Reused the tool-shell camera hook and fixed stream cleanup, including camera requests completing after exit. Editor previews remain camera-free.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.


### 2026-10-28 — Slide-owned skill sets and question briefs

Replaced shared-bank browsing with a direct Skill practice editor: question, answer and worked steps, Add my own question, ordered sets, optional teaching details and classroom preview. Briefs record the skill focus, exclusions, count, progression, examples and generator solution reference; they can be copied into chat and saved with the set in one undo step. The same briefing process applies when Claude plans a lesson independently. Depth has its own picker. Estimation’s practice and exit questions are embedded with their slides, retaining notes and legacy import support. Fixed working now includes Original and matches generator reveal construction, including fraction grouping, through a shared helper.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.


### 2026-10-28 — Deck lesson thread and calmer question controls

Added a saved teaching brief for each slide and a central Lesson thread editor with the ordered purposes visible together. Filled every Estimation slide’s brief, including generator inclusion/exclusion criteria and evidence for the next move; generator configuration now shows that brief. Added the authoring rule so AI-built decks record the intended questions before selecting presets. Question displays tuck secondary answer/guidance actions and solution jumps into disclosure controls, leaving the question and progressive working primary.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Deck solutions: question right, unfolding working left
- Curated and generator questions now share a side-by-side solution stepper matching the tools’ numbered timeline: the question moves smoothly right as the working opens on the left; earlier steps dim and the current step is highlighted.
- Previous/Next step, progress dots and Show All / Step-by-Step give control over the solution. The answer is the final green A row. Hiding working returns to the centred question; changing question resets the solution.
- Classroom and popup previews use the same component. Long working scrolls within its column; narrow popup previews stack question above working; reduced-motion settings remove transitions and fades.
- Added state tests and `npm run smoke:solutions` for layout, answer disclosure, backwards steps, keyboard navigation, generator resets, diagnostics and responsive previews. Updated the existing workspace browser check for the new controls.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo reference, feature guide and project status updated.

### 2026-10-27 — Five questions per misconception-practice slide
- Added build rule R42 and the authoring checklist: start each misconception-practice slide with at least five distinct, fixed examples at the intended level, with deliberate variation and question-specific teaching guidance.
- Expanded Estimation from 14 to 40 fixed questions: all eight practice sequences now have five questions. Short diagnostic checks and exit tickets keep their intended role; teachers can still choose shorter sequences.
- Built-deck tests enforce the minimum and distinct content. An Estimation check verifies correct rounding and the specific wrong method against every recorded answer and expected response.
- Updated the deck reference, lesson-building checklist, spec guidance and project status.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)".

### 2026-10-27 — Questions workspace: misconception-led authoring and deck-owned sequences
- Replaced side-panel question pickers with a central **Questions** workspace: rendered library cards, filters, built practice and existing Depth material, authoring, sequence ordering and classroom preview.
- Added open-response, multiple-choice, compare-claims and find-the-error content, with misconception descriptions, rationale, expected wrong responses and follow-ups. Custom descriptions and labelled drafts support other tools.
- Edits belong to the deck; Apply is one undo step, library saving creates an explicit new copy, and exports embed question content. Legacy questions adapt without changing their sources; missing references stay visible. Built-in Depth visuals are preserved as references and protected against incompatible content edits.
- Player: previous/next question, count and sequence end; answers hidden initially; staged explanations and clearly marked teacher guidance. Curated sequences no longer fall through to general generators. Tool-page captures open the same workspace.
- Estimation: added example-specific guidance and corrected two examples whose wrong method gave the correct answer (451 − 123 and (58 + 47) / 19 now distinguish those methods).
- Verification: content/API regression tests and browser checks for draft recovery, source isolation, undo/redo, portable export, diagnostics, custom authoring, diagrams and phone/tablet/laptop layouts. `npm run smoke:questions` repeats the core browser flow without writing shared teacher content.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo reference, feature guide, glossary and project status updated.

### 2026-10-27 — Deck generators: central configuration popup
- Generator questions, book activities and practice backups now open **Configure generator**, with the tool’s tabs, shared level controls, roomy Question Options and a slide preview. The side panel holds a summary and the Configure button.
- New generator elements and layouts open configuration automatically; existing ones also open on double-click. Apply saves the draft as one undo step; Cancel, Escape and the backdrop discard it. The dialog traps focus and suspends editor shortcuts, with stacked controls and preview on narrow screens.
- Question pools retain a choice unless optional, dependent options honour their requirements, and changing question type keeps a supported level. Custom instructions update immediately on the slide.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo documentation updated.

### 2026-10-27 — Deck editor: findable slides, hideable and resizable panels, grouped menus
- **Panels:** the slide strip and the properties panel hide, resize and remember their state; `\` hides or shows both for a bigger canvas.
- **Finding things:** a slide finder, a compact list view, drag to reorder, hover duplicate / delete, "Practice" slides named by their misconception; an "On this slide" list of every element (front first) to select what is hidden and change its layer.
- **Menus:** Add slide grouped by kind with what each is for; Lesson pieces (board, practice, Depth, grid, generator, book activity) with a line each; File (export, import, reset); a keys panel replaces the paragraph under the properties.
- **Properties** are collapsible sections that remember open or shut; the selection's own controls come first.
- **Generators and questions:** a searchable tool picker grouped by strand; a live preview of what a generator or book-activity slide will ask (with the answer); a question browser for the hand-picked bank (filters, search, rendered maths and answers, add several at once, misconception matches first); "Back to the tool's defaults". Menus no longer clip inside the narrow panels.
- **Estimation deck, from Harry's feedback:** the board's Filled in / Structure only / Blank control moved from above the board (where it collided with the slide's prompt) to the player's bottom bar, with `b` to cycle; the discussion slide now asks where the first significant figure is in $0.039$ instead of "nearer 0 or 1" (not about significant figures).
- **Pictures:** paste an image straight from the clipboard, or drop an image file onto the slide, instead of going through a file.
- Code: `src/decks/EditorChrome.tsx` (new), `moveIndex` in `geometry.ts` (tested). Reference: `docs/reference/decks.md`.
- Notes: planner Build Log, "2026-10-27 — Decks: editor navigation and panels".

### 2026-10-27 — Generators wired into decks: generator slides, book activities, Send to a deck
- **Every question tool's generator works in a deck** (`src/decks/generators.ts`): loaded through the registry and the tool's own `__test` export, with its own tabs, levels and Question Options, and its defaults wherever a slide says nothing. Tools with their own picture print are left out for now. A test loads every listed tool and asks a question on every tab and level.
- **Generator slide:** the tool's generator live, like its Whiteboard: opens on the same question every time (a seed), New question, the working one step at a time, the answer.
- **Book activity slide:** eight (or any number of) numbered generated questions, answers on demand, New set, and Print through the tool page's worksheet print.
- **Send to a deck** (tool page burger menu, Developing-tools mode): the current setup as a generator slide or book activity, or the question on screen as a hand-picked practice slide, added to the end of a deck.
- The editor's generator panel (also the practice question's backup) offers the tool's own tabs, levels, option pools, switches and dropdown. Practice questions may leave the misconception unnamed; worded questions and text steps carry over.
- Estimation deck: two Whiteboard generator slides and a decimals book activity (28 slides).
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Deck editor: type on the slide, equation editor, alignment; Depth, discussion and grids; shared between devices
- **Type on the slide:** double-click a text box (or Enter) and type in place; the box grows to fit; one undo step per edit; a new text box opens ready to type.
- **Equation editor** (`src/decks/EquationEditor.tsx`): a visual maths field (MathLive 0.111.0, loaded only when opened, using the bundled KaTeX fonts), a palette of structures and symbols, and the LaTeX underneath. Adds an equation element, edits one, inserts maths at the caret, and opens from the question editor's fields.
- **Alignment:** Shift-click and drag-a-box selection; pink smart guides snap edges and centres to the slide and to other elements; resize edges snap too; line up and space evenly; layers for a selection; pictures keep their shape. Pure geometry in `src/decks/geometry.ts` (tested).
- **New elements and layouts:** a Depth item drawn flat on the slide (no stage or panel inside the slide), a question grid (quickfire block, retrieval starter, exit ticket), click order ("appears on click n") with the split discussion layout (prompt, key point, question, answer). New families Depth, Discussion, Retrieval.
- **Estimation Depth bank** (`src/tools/Number/EstimationDepth.ts`, 12 items, a Start here per level), on the tool page and in the deck. Its numbers differ from the deck's practice questions and boards (they first shared 48 × 31, 6.1 ÷ 0.48 and (34 + 21) ÷ 11, so a Depth check repeated what the class had just done); `decks.test.ts` now fails on any Depth slide that reuses a deck's numbers. Wrong options carry the shared misconception tag (new optional `DepthOption.tag`). The Estimation deck is now 25 slides with three Depth checks, a discussion and an exit ticket.
- **Shared between devices:** saves go in the background to `/api/decks` (private Vercel Blob: a blob per deck, an ETag-guarded index and question store); opening the list or a deck pulls newer copies; offline it keeps working on the device.
- Tests: `deckGeometry.test.ts`, `estimationDepth.test.ts`, `decksApi.test.ts`, and Depth / grid / step checks in `decks.test.ts`.
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Decks: whole lessons on their own page, with a slide editor (Estimation first)
- **New `/decks` page, player and editor** (`src/decks/`, `docs/reference/decks.md`). A deck is a whole lesson for the projector; a slide is a 16:9 canvas of elements. Listed from the landing page's Developing-tools menu and from the tool's burger menu ("Deck: Estimation", Developing-tools mode).
- **Player:** arrow keys / Space, progress bar, jump list (`j`), full screen, one accent colour per slide family (none green, yellow or red). Ink is on every presented slide and clears when the slide changes (`mt-ink-clear` in `InkOverlay`); it stays when a board's fill mode changes, and is off in the editor.
- **Elements:** text with `$…$` maths, rectangles and ellipses, lines and arrows, images, a **board** (a table with a corner control: Filled in / Structure only / Blank) and a **practice question** (a hand-picked bank written against one misconception, "Another question", separate answer / working / teacher-notes reveals, and the tool's own generator as the backup).
- **Editor** (Edit in the player): slide strip with Add slide from ten layouts, drag / resize / layer, snapping, undo / redo, a properties panel per element, a **question editor** (write a new question or edit a built one; KaTeX checked as you type), copy / paste between slides and decks, Export and Import slides, Reset to the original. Edits and new decks are saved on the device.
- **Slide library** (`/decks/library`): every layout with sample content, grouped by family, and the planned pieces.
- **Misconception tags** (`src/shared/misconceptions.ts`): one vocabulary for deck questions and, as it grows, Depth options. Seven for Estimation.
- **Estimation deck:** 20 slides, 14 hand-picked questions across the three levels, each practice slide aimed at one trap.
- `src/tests/decks.test.ts` checks every bank question, misconception, layout and built slide (on the canvas, text size, KaTeX, boards) and every practice element (known intention, questions written against it, the generator preset runs). Checked in Chromium at 1366×768 (player, editor, question editor, image upload, library, new deck).
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Tabs in the options popover; tidy-up list cleared; Future under Developments
- **Tabs in the Question Options popover.** A level with many options now shows small pill tabs at the top of the popover (**Questions · Numbers · Method · Display**) and one tab's groups at a time, on the laptop popover, the differentiated-worksheet popover and the phone / tablet options sheet. A group says where it sits with `tab` (`QOTab` in `src/shared/types.ts`); untagged groups sit on Questions, and tabs only appear when a level's groups fall on two or more. The six walls are tagged: Rounding, Comparing & Ordering Numbers, Binomial Expansion (through the shared `pool` helper in `shared/binomial.tsx`), File Sizes, Speed Distance Time and Order of Operations. `src/tests/qoTabs.test.ts` fails on a level with more than 12 choices on one tab, or an unknown tab name. Checked at laptop and phone sizes. A tabbed popover stays one narrow column (no tab holds more than four groups), so the wide two-column layout now only applies to an untabbed popover with more than four groups, and the `qoColumns` default that forced it (Rounding only) is gone.
- **Rolled out to every tool.** Every option group on all 42 tools with Question Options now carries a tab, and groups are always listed Questions → Numbers → Method → Display. The popover picks its layout from the level's size (`qoLayout`): more than 8 choices → tabs; 8 or fewer → just the order (small headers for middle-sized levels were tried and dropped). The shared Place value groups carry their own tab. `qoTabs.test.ts` now fails on any untagged group, and on a level above 8 choices whose groups sit on one tab (Solving Linear Equations Level 1's "Larger x on" moved to Questions for this).
- **Tidy-up list cleared.** "Question Options that are walls" is settled by the tabs; "Built, but only on a handful of tools" is settled as *grow each capability in that tool's review*. Both moved to Settled decisions in `docs/TIDY_UP.md`.
- **Dashboard:** Future developments is now an entry in the Developments drop-down rather than its own top tab.
- Notes: planner Build Log, "Options popover tabs; tidy-up list cleared".

### 2026-10-27 — No repeats in the last 15 questions (Whiteboard, Worked Example, Decision tools)
- **New Question never repeats one of the last 15 on screen.** `src/shared/recentQuestions.ts` fingerprints a question by its content (a stable JSON of the question without its bookkeeping fields: `key`, `_seed`, `_qo`, the difficulty scores, `_category`, `working`), keeps the last 15 fingerprints, and regenerates up to 30 times until the new one is not among them. `ToolShellCore` (Whiteboard, Worked Example, phone view) and `DecisionShell` (window of 8, since its pools are smaller) both use it. Replaying a seed, restoring a recent or pinned question, and share links are untouched.
- **Errs towards refusing.** A question has two fingerprints and is a repeat if either matches: the full content, and the shown one (the wording, the answer and the text drawn on the picture: any `label`, `text` or `caption` field of the picture data). So a repeat that differs only in a field the student never sees (a random id, a shuffled order) is still caught; the cost is that a question whose picture alone differs, with the same wording and answer, is refused too. A picture-only question has no shown fingerprint, so it is not refused as "the same" as every other. Measured over all 344 tool-levels at default options: 1.15 generations per click on average, and only Indices > Common Base (level 1) runs out of different questions and accepts a repeat.
- **Why a fingerprint rather than the `key`:** measured over the generators, 114 of 344 tool-levels can produce two questions with identical content but different keys (the random id), and 3 have hand-written keys so coarse that different questions collide. The check is built to over-refuse rather than under-refuse (see above). A pool too small to avoid a repeat accepts one after 30 tries.
- **Worksheets use the same check (Harry's call).** `makeUniqueQ` (worksheets, differentiated sheets, Smart Progressor pools), a single-cell regenerate (both shells) and the advanced WorksheetBuilder's regenerate now refuse a question whose fingerprints match one already on the sheet, instead of comparing keys. `makeUniqueQ` also renames a colliding key (`~2`) so every cell keeps its own key (cell identity, flips) without ever refusing a different question for it. This settles rule R2: **never append a random id to a key**; `CLAUDE.md` and both reference files say so. Measured over a 30-question sheet at default options: 1.94 generations per question (the key check, fooled by random ids, was 1.01), and 8 tool-levels (Circle Properties circumference and area, Non-Linear Simultaneous Equations level 3, Indices Common Base, Basic Angle Facts right angle) have fewer than 30 different questions, so a long sheet repeats after 100 tries. The key check used to hide that. Tools with their own key-based `generateUniqueQ` (Angles in Parallel Lines, Equations of Lines, Bearings, Circle Properties) are not changed.
- **Pools widened so a 30-question sheet never repeats (Harry's call).** Non-Linear Simultaneous Equations level 3 (both sub-tools): 19 and 20 circle-and-line questions became 73 and 70 (generated by script and checked: both intersections lie on the circle and the line, and the quadratic's roots match; the banks' random key suffix is gone, the key is the entry's own). Indices > Common Base level 1: indices up to 2^8, 3^5, 5^4, 10^5 instead of 5, and either side of the equals sign for "Write as a power" and "Solve for x" (16 became 44). Circle Properties: dimensions 2–36 instead of a list of 20 (decimals 1.5–34.5), giving 32 for whole numbers. Basic Angle Facts > 90° level 3 was a fault of the check, not the generator: its question is the picture, so the **shown fingerprint now includes the text drawn on the picture** (any `label`, `text` or `caption` field), which tells "Find x" with different angle expressions apart (26 became 237). `src/tests/recentQuestions.test.ts` now fails if any tool level cannot fill a 30-question sheet at default options. Indices is calibrated, so its bands were regenerated (`CALIBRATE=1 npx vitest run src/tests/indicesDifficulty.test.ts`, with `docs/calibration/INDICES_DIFFICULTY.md`); the cut points moved by about a tenth of a point in several sub-tools as well as Common Base.
- **Left as is (Harry's call):** Circle Properties has 32 whole-number questions at default options, so a sheet of more than 32 will repeat; the new pool test allows one repeat in 30 and would flag a level that falls below a full sheet.
- Tests: `src/tests/recentQuestions.test.ts` (16): both fingerprints, the 15-question window, `makeUniqueQ` (random id, colliding key), every tool level against the 15-question window, and every tool level filling a 30-question sheet.
- Notes: planner Build Log, "No repeats in the last 15 questions".

### 2026-10-27 — CLAUDE.md split: reference moved to docs/reference/, rules kept in a checklist
- `CLAUDE.md` went from about 35,000 to about 14,000 tokens. The shared-library reference moved, byte for byte, into six files in **`docs/reference/`** (`toolshell`, `options-and-calibration`, `questions-and-working`, `pictures`, `depth-teach-lessons`, `shell-extras`), indexed from `CLAUDE.md` with a "read when" line each. Only seven lines of the original changed (pointers).
- **Rules checklist** in `CLAUDE.md`: every never / always / must rule from the moved text, one line each (R1–R41). Each rule's id is written in a comment beside the sentence it summarises in the reference file.
- **`src/tests/claudeDocs.test.ts`** keeps the two in step: every reference file is indexed and every link resolves; every never / always / must line in a reference file carries a rule id (or `ref` for a plain description); every id is in the checklist and every checklist rule is tagged; and `CLAUDE.md` is capped at 64,000 characters so it cannot quietly regrow.
- Source comments and docs that named a moved `CLAUDE.md` section now name the reference file. The reference both said to append a random id to a question key and that a random number in the key defeats the repeat check (R2); settled later the same day (see "No repeats in the last 15 questions").
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

### 2026-10-27 — Future developments tab and note; back bench trimmed
- **Future developments** is a new home for ideas that are not scheduled, so they are not lost and not read while working: `docs/FUTURE.md` (layered Question Options popover, skill drill-downs, complexity stepper, and an Accessibility section holding colour schemes), shown on a new **Future** tab on the Tools dashboard (`scripts/adminDocs.mjs` writes a `future` section into `adminDocs.json`), with a matching planner note **Maths Tools — Future Developments**. `CLAUDE.md` says to open it only when Harry asks. The back bench (`docs/BACKBENCH.md`) is the Skills library only again.
- **Tidy-up list:** very large files and parked ideas are no longer loose items; `.pptx` export, the slide-strip builder, slide templates and saved lessons were removed from the ideas (they will be looked at in a different capacity).
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

### 2026-10-26 — Perimeter & Area: Perimeter rewritten from scratch
- **New tool `perimeter-and-area`** (`/perimeter-and-area`; `/perimeter` redirects), replacing the old Perimeter, which was deleted. Four tabs: **Counting on a Grid** (rectangles, then L/T/staircase shapes, then a scale of 2 or 5 cm per square), **Standard Shapes** (rectangles, squares, regular polygons; triangles, parallelograms and trapezia built from Pythagorean triples so the picture is in proportion; then find a missing length from a perimeter or area), **Compound Shapes** (L, T, staircase and cross shapes with missing sides found from the opposite sides; notches and holes, where the inside edge counts) and **With Algebra** (write and simplify a perimeter, solve for x from a perimeter, expand an area, an algebraic L-shape). Arcs and circles stay in Circle Properties.
- **One geometry model** (`src/shared/shapes/model.ts`): every picture, label, answer and working step is derived from the shape's points, so they cannot disagree. The label placer is greedy (a few checks per label) instead of trying 3ⁿ positions.
- **Working walks the picture:** each step lights the edges or rectangles it is about (the missing-side step lights the matching sides on both edges of the shape), the area methods draw the split or the cut-outs, and a bounding-rectangle shortcut is offered for shapes with no notch.
- **Options:** Ask for / Given, Shape Types, Units (same, or mixed with metres only for whole tens of cm from 50 up), Scales, Sides Given, Method for Perimeter and Area (display only), and a "Show the Split" switch.
- **Reduced Labelling** is a new switch (Standard Shapes Levels 1–2, where it is on by default, and Compound Shapes at every level, off by default). It leaves out only the labels the drawing already implies, so nothing needs working out. Standard Shapes: a rectangle's two neighbouring sides, one side of a square, and the equal-side ticks; switch it off and every side is labelled and the ticks go. Compound Shapes: a side the same length as a labelled one that is directly opposite it (the same stretch, like the two inner legs of an n-shape or a bridge) or a step away on a staircase, with no tick marks; the top and bottom of a notch are never twinned, however equal they are. A left-out side appears in green as the working finds it; a frame loses one side across and one up from both its outside and its hole.
- **Reduced Labelling pairs with Some Missing** (Sides Given, now just All Sides or Some Missing): the twins are implied, and the ? sides are still found by adding or taking away. The working finds the twins first.
- **A missing side is never a copy.** In Compound Shapes a side that goes missing (?) or unlabelled must be a sum or difference of other sides and may not be the same length as any other side (so a U's equal slot walls and equal outer sides are never chosen); the generator redraws the shape until one qualifies. `perimeterArea.test.ts` checks it.
- Each label is joined to its side by a thin dashed line, as in the old tool, and **labels are fitted to the whole picture**: every pill tries a grid of spots (slid along its side, pushed further out, inside the shape or on its own line when there is no room) and is scored against the outline, the dashed helper lines, the other pills (touching or cramped), the leaders and the picture's edge; the picture's padding grows to fit its widest label. `src/tests/shapeLabels.test.ts` checks ~2,900 generated pictures: no pill overlaps another or sits on a line.
- Test `src/tests/perimeterArea.test.ts` re-derives every answer, label, height and missing side from the drawn points, and checks the pool is big enough. Checked in a real browser: all four tabs, every level, Whiteboard, Worked Example (forward and back) and Worksheet, with no console errors.
- Built dev-gated on 2026-10-26; **live from 2026-10-27**, after the label placing, Reduced Labelling and missing-side rules above were settled and the tool was checked at phone, tablet and laptop sizes (the `enabled: false` flag was removed). Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

### 2026-10-26 — Back button crashed the working on Simplifying's ratio table
- Pressing Back in the Worked Example of Simplifying (the ratio table that gains a row per step) replaced the working with an error message: the shared ratio table kept the arrows it had measured for the longer table for one render after going back, and tried to draw an arrow for an operation that no longer existed. It now draws only the arrows that have an operation. The other ratio-table tools were not affected (their table keeps all its rows and hides parts instead of removing them).
- Checked in a real browser: forward to the answer and back to step 1 for whole numbers, units, decimals and fractions, in both Method settings.
- Notes: Build Log block "File Sizes live, Ratio Manipulation, explainers in the right places, Perimeter & Area" (same session).

### 2026-10-26 — Explainers out of the options popover, into the level pop-up
- **No (i) beside each Question Option.** The hover (i) on every option group and switch in the options popover (ToolShell) and the hover note / line under each option heading (Decision tools, laptop and phone/tablet sheets) are gone. The explainers stay where they were meant to be: the opening "About this tool" panel, and the level (i): tap a level and each option group at that level shows its one-sentence explainer under its title (a switch's explainer beside its name).
- **Explainers no longer relist the choices.** The level pop-up shows each group's explainer and then the choices as pills, so about 130 explainers (all the `<Tool>.about.ts` files and the Decision tools' `info`) were cut from "What to round to: the nearest 10, 100, 1000, or whole number." to "What to round to." The choices are still listed where there are no pills: "About this tool" now shows each pool's or dropdown's choices as a plain line under its explainer (the level pop-up shows them as pills). A test (`levelLabels.test.ts`) fails on a one-sentence `: a, b or c` tail; explainers that say what the choices *do* stay. Rule written into `CLAUDE.md`.
- **Decision tools** gained the same level drill-down: the level (i) now opens a level to show the options on offer there, with their explainers (before it only listed the level descriptions).
- Notes: Build Log block "File Sizes live, Ratio Manipulation, explainers in the right places, Perimeter & Area" (same session).

### 2026-10-26 — Ratio Manipulation: Simplifying Ratios merged in, new Equivalent Ratios tab
- **Fractions ↔ Ratios is now Ratio Manipulation** (id `ratio-manipulation`, `/ratio-manipulation`; the old `/fraction-to-ratio` redirects). Five tabs in teaching order: Forming Ratios, **Simplifying**, **Equivalent Ratios**, Fraction to Ratio, Ratio to Fraction. The never-live Simplifying Ratios tool is gone; its generators moved into `ratioSimplifying.ts`.
- **Simplifying** has one tab and Question Options for the first time. *Question Types* (one drawn per question, balanced): whole numbers, different units (`2 m : 50 cm`), decimals, fractions, letters (the old Algebraic tab) and already simplest. *Ask for*: simplest form, `1 : n` or `n : 1` (whole numbers only, the others grey out; answers always terminate). The level sets how hard whichever type is drawn.
- **Equivalent Ratios** (new): Level 1 is an A–D pick where each wrong option names its mistake (added instead of multiplied, one part scaled, swapped, one out); Level 2 scales directly by a whole number (`2 : 5 = 4 : ?`, with Ask for first / second part and Scale Up / Down); Level 3 simplifies then scales (`4 : 10 = 6 : ?`, never a whole-number factor directly). Levels 2–3 work on the ratio table (`rStepSolve`), so the tool also offers the ratio table printable.
- **Simplifying works on the ratio table too** (whole numbers, units, decimals and fractions; letters keep their step list): one table gains a row per step (`÷ 2`, `÷ 3`…, or `× 10` first for decimals), with three columns for three-part ratios. The shared ratio table's step caption says "every part" instead of "both" for three or more columns.
- **Simplifying has a Method choice:** Prime Steps (one `÷ p` row per prime, the default) or HCF (one `÷ HCF` row). With letters the number comes out first (one step in HCF mode, one per prime otherwise), then each letter in its own step, so two letters give two letter steps. It only changes the working, so it redraws the same question at once and is hidden from the Worksheet options.
- Test `src/tests/ratioManipulation.test.ts` re-derives every Question Type and level independently. Checked in a real browser: all five tabs, the worked example's ratio table, the old route's redirect, `npm run smoke:shell`.
- Notes: Build Log block "File Sizes live, Ratio Manipulation, explainers in the right places, Perimeter & Area" (same session).

### 2026-10-26 — File Sizes goes live; tools with no fate settled; Decision exam-style questions become a prong
- **File Sizes** (`/file-sizes`: text, images, sound; calibrated) is live: `enabled: false` removed, spec marked live, facts regenerated.
- **Decision tools:** Travelling Salesperson, Route Inspection and Mixed Strategies are no longer loose ends. They join a new prong, **Decision exam-style questions** (`docs/PROJECTS.md`), and go live through it as they get exam chains like Critical Path Analysis and Network Flows.
- **Simplifying Ratios** is to be merged into a separate ratio tool once its Question Options are listed; **Perimeter** is to be reworked from a fresh brief. Both recorded in `docs/TIDY_UP.md` §1 item 1 and its settled decisions.
- Notes: Build Log block "File Sizes live, Ratio Manipulation, explainers in the right places, Perimeter & Area" (same session).

### 2026-10-26 — Times Tables route renamed with a redirect; group labels on one wording and one case
- **`/timestables` is now `/times-tables`** (id `times-tables`). Registry entries can carry `aliases`: the old address redirects to the new one, keeping any query string, so printed or saved links still open the tool. The dashboard note was copied to the new id.
- **Group labels (the heading over a pool or dropdown) are Title Case and one word per idea:** "Method" (how it is worked), "Working Shown" (how much working), "Answer Format", "Ask for", "Operation". About 45 labels changed (for example "Working method" → "Method", "Division working" → "Working Shown", "Answer Display" → "Answer Format", "Answer Type" → "Ask for", "Table starts" → "Table Starts"). `levelLabels.test.ts` fails on a label that is not Title Case or that returns to a retired wording.
- Notes: Build Log block "Question data typed in one place; Question Option labels on one vocabulary" (same session).

### 2026-10-26 — Quick items: slides become a prong, Decision option sentences in the popover, one About panel on the last two sandboxes
- **Slides** (the four slide surfaces: Teach tab, lesson decks, Depth stage, skill slides) moved off the tidy-up list into `docs/PROJECTS.md` as their own prong, with the leaning kept (keep Depth and lesson decks; fold the Teach tab and skill slides into them). The Developments list is now 5 cards.
- **Decision options** now show their explanation where you choose them: a hover (i) beside each option's heading in the laptop popover, a line under the heading in the phone and tablet sheets (the same sentences "About this tool" already used).
- **Visualiser and Parallel Lines Explorer** dropped their own copies of the info box: both use the shared panel (hand-written notes), open it once on a first visit and call the menu item "About this tool", like every other tool.
- Notes: Build Log block "Question data typed in one place; Question Option labels on one vocabulary" (same session).

### 2026-10-26 — Printables: ready-made sheets named, wrapped into the shell and put on the tools that warrant them
- **One heading, one print path.** `ToolShell` takes `printables` (a list of `Printable` sheets: one SVG cell on an A4 grid) and the burger menu lists them under a "Printables" heading; `printPrintable` prints them. The old `menuItems` prop (only Rounding used it) is gone from both shells; Critical Path's "Print templates…" sits under the same heading.
- **Five shared sheets** (`src/shared/printables.ts`): integer number lines, decimal place value tables, binary place value tables, ratio tables (with a box for each scale factor) and coordinate grids. Rounding keeps its own blank lines (same geometry as its questions) through the same path.
- **Enabled only where it warrants it:** Integers and Rounding (number lines), Decimals, Powers of 10 and Comparing & Ordering (place value), Number Bases and Binary Arithmetic (binary), Speed Distance Time (ratio table), Equations of Lines and Simultaneous: Substitution (grids). The rule (the working is built on a picture the student fills in) is a test: `src/tests/printables.test.ts`. The dashboard has a Printables filter (a new fact in `toolFacts`).
- Checked in a real browser: the menu heading and each sheet's print page open without console errors; the sheets fill the A4 page.
- Notes: Build Log block "Question data typed in one place; Question Option labels on one vocabulary" (same session).

### 2026-10-26 — Question underscore fields typed; Question Option labels on one vocabulary
- **`QuestionExtras`** (`src/shared/questionExtras.ts`, exported from `shared`) lists every underscore field a tool hangs on a question for the shell (`_diagram`, `_rawValues`, `_stagedReveal`, `_stepFocus`, `_aspect`, `_printText`, `_sectionIdx`, the calibration scores…), with real types for what the shell reads and `unknown` for what only one tool reads. `extras(q)` reads them and `withExtras(q, {…})` builds a tagged copy. Every `(q as any)._x` and `(q as unknown as { _x?: T })._x` in the shell and 25 tools now goes through `extras(q)`; `as any` casts in the app fell from 111 to 13 (three read `window`; the rest are in the standalone PDF generator, Rounding's cell drawing and one diagram helper): the shell's own reads of a question's fields (`displayLatex`, `lines`, `answerLatex`) are typed by narrowing on `q.kind`, and the dead "frac" question kind (nothing produced it) was removed from print, the worksheet view and the question display.
- **Test** `src/tests/questionExtras.test.ts`: source may only mention fields the interface lists (a typo like `_stageReveal` now fails the build instead of silently doing nothing), every listed field is used, and no new `(q as any)._x`.
- **Question Option labels:** 22 group labels renamed so the same words are spelt the same way: tick-several pools are plural (Question Types, Operations, Bases, Coefficients, Solution Types) and "Find" / "Ask" became "Ask for". A test in `src/tests/levelLabels.test.ts` fails on a clash or those two synonyms.
- **Strand homes settled:** Binary & Number Bases joins Computer Science (group "Binary & number bases" beside "Computer systems"); the Visualiser moves to a new **Classroom** strand and the internal pages to **Workshop**, both shown on every subject tab (`subject: 'All subjects'`, `inBand` in the landing page). Folders unchanged.
- **Registry ids corrected:** sixteen ids renamed so each is its route without the slash and kebab-case (`ratio` → `ratio-sharing`, `circles` → `circle-properties`, `Recipes` → `recipes`…). Routes did not change, so no link needed a redirect; the dashboard notes were copied to the new ids. `src/tests/registryIds.test.ts` enforces the rule. The notes service (`api/tool-notes.ts`) gained a `remove` action (`{tool, remove: true}`) to clear the old ids' notes once the branch is merged and deployed.
- Notes: Build Log block "Question data typed in one place; Question Option labels on one vocabulary" (same session).

### 2026-10-25 — About this tool rebuilt around the sub-tools; every level description rewritten
- **The panel now says one thing, the same way for every tool:** what the whole tool is for, then each sub-tool with its purpose; opening a sub-tool shows what each level means and what its Question Options do. No explanation of the modes, no hand-written notes (ToolShell and Decision tools). It reads the same level text as the level (i), which stays as the quick version for the current tab.
- **New `<Tool>.about.ts` for 42 ToolShell tools** (`ABOUT: ToolAbout`, applied by `applyAbout`): a purpose for the tool, a purpose for each of 110 sub-tools, and one short plain line per level. All level descriptions were rewritten (shorter, no jargon such as "QO", "distractor", "radicand"); several sub-tools that shared one copied description (Simultaneous scaling, Number Bases, Data Units, Ratio Sharing, Speed Distance Time) now say what is particular to them. Old `levelLabels` removed from the tool files. Decision tools get a `purpose` and tab blurbs; the panel lists the tabs on offer. `levelLabels.test.ts` now requires a purpose at every level of the tree and limits the length and jargon.
- The tool template and `npm run new-tool` create the `.about.ts` stub. CS topics and the word games keep their hand-written notes (without the modes section).
- **Every Question Option is now explained** (about 390 pools, switches and dropdowns across 42 tools): a plain sentence on what it is for and what its choices mean (for example what "Extended Range" extends), written in `<Tool>.about.ts` (`options`, by option id) and applied as the option's `info`, so "About this tool" and the hover note in the options popover are one text. `describeOptions` shows it instead of "A switch, off to start with"; a test fails for any option left unexplained. The Decision tools' options (course, practice, network size and the rest, 36 in all) are explained too: `ShellOption.info`, written inline in each tool, shown in the About panel (not in the Decision options popover); a test fails for any option without one.
- **Hand-written `INFO_SECTIONS` deleted** from every ToolShell and Decision tool (48 files, plus the template); `infoSections` is now optional on `ToolShell`. CS topics and the word games keep theirs because the panel still shows them.
- Notes: Build Log block "Two states for a tool" (same session).

### 2026-10-25 — "About this tool": one click-through panel, opens on a tool's first visit
- **Tool Information is now "About this tool"** (`InfoModal`, `src/shared/about.ts`): a summary (the tool's Overview) and the ways to use it, then a list of topics that each open their detail with a Back button. The **Question Options topic is written from `TOOL_CONFIG`** (pools, switches and dropdowns, with the levels each is offered at), so it is never stale; the hand-written "Modes" and "Question Options" sections are dropped when the generated ones exist. Quiet card style; a full-screen sheet on a phone. Every ToolShell tool, the Decision tools and the word games get it with no per-tool change; the Computer Science topics use it too (their own box was replaced; the ways to use it are Learn / Study / Cards / Quiz / Fill / Exam).
- **First visit:** a live tool opens the panel once per device (remembered in browser storage), never from a shared link, lesson step or set-up worksheet, and never when storage is blocked. **Show tool tips again** on the landing-page menu resets it.
- The level (i) beside the level buttons is unchanged (its click-through pop-up stays); the card's "per-level teaching text" remains a later extra for that (i).
- Tests: `src/tests/aboutTool.test.ts` (generated options, summary/topic split, first-visit rules, every tool describes its options); checked in a real browser at laptop and phone size (first visit opens, second does not, shared link does not).
- Notes: Build Log block "Two states for a tool" (same session).

### 2026-10-25 — One way to order a worksheet: calibration; option weights retired
- **Eight tools calibrated** (each question scored from the question itself, a 1500-per-cell sample cut into eight bands, a committed `<Tool>.calibration.ts` and a report in `docs/calibration/`): Decimal Add/Sub, Speed Distance Time, File Sizes, Factor Theorem, Partial Fractions, Indices and Surds, joining the pilot Order of Operations. Rubrics are in each report (steps of the working, size of the numbers, structure).
- **Option weights are gone.** `weight` on options, `weightOf`, the weighted-pool detection and the "sort by weight" path are removed. `ToolConfig.calibrated` marks a calibrated tool (shows the Smart Progressor switch); `ToolMultiSelect.balanced` keeps a variety pool roughly even on a short sheet (Rounding's zero kinds, Speed Distance Time's mixed types), in both the calibrated and the plain path. The tool template no longer demonstrates weights. The dashboard drops the duplicate "Smart Progressor" feature (Calibrated covers it).
- **Shared test kit** `src/tests/calibrationKit.ts` (`calibrationTests`): table shape, every question carries its score and band, a fresh sample uses the bands sensibly (allowing for tied scores), and the config flag. Each tool's test is about 25 lines; `CALIBRATE=1 npx vitest run <test>` regenerates its table and report.
- **File Sizes fix found while sampling:** some tick combinations (a short message answered only in KB) had no exact question and threw; it now offers every unit rather than fail.
- **Decided:** a level with only a few kinds of question keeps few distinct scores (honest, not padded); Card 3 now holds only the slide-surfaces question.
- Notes: Build Log block "Two states for a tool" (same session).

### 2026-10-25 — Two states for a tool: live or not live
- **Five visibility switches became two.** `hidden`, `parked` and the separate parked gate (`?parked=1`, `src/parkedMode.ts`) are gone; a tool is live or `enabled: false` (shown with Developing-tools mode). The Tools dashboard, and the 11 technique previews, are no longer fake tools: they are `PAGES` in `src/registry.ts`, with no state and no card. The Skill Library is simply not live; skill drill-down links in worked examples now follow Developing-tools mode.
- **Dashboard:** states are Live / Not live; stat cards updated; `npm run facts` regenerated (79 tools). Docs (`CLAUDE.md`, glossary, features, projects, back bench) and `scripts/notesPages.mjs` use the two-state wording.
- **Decided:** card 3 now holds only the weights-vs-calibration and slide-surface questions; the visibility part is under Settled decisions.
- Notes: Build Log block "Two states for a tool".

### 2026-10-25 — Admin tidy, the level (i) on every tool, options keep your question
- **Admin pages:** the Developments, Features and Build guide pages show content only (the process notes, how-to checklists and "read from docs/…" lines are gone from the page); Developments has a dropdown for its three views instead of side-scrolling tabs; long text and table cells are chunked into bullets, and tables become stacked cards on a phone.
- **Level (i) on every ToolShell tool.** Each sub-tool now carries `levelLabels` (one plain line per level) in its `TOOL_CONFIG`; the Level 1/2/3 entries were taken out of the burger-menu Tool Information. Tapping a level in the (i) opens a fuller pop-up: the level's description, what can be chosen at that level (read from the config) and a **Switch to Level N** button. On a phone the (i) sits beside the Difficulty / Level title in the options sheet. `src/tests/levelLabels.test.ts` fails if a sub-tool has none. Four tools gained wording (Non-Linear Formula, Ordering, Basic Angle Facts Mixed, Rounding's sig-fig tabs) and five were reworded to be short (Solving Linear Equations, both angle tools, Perimeter, Rounding).
- **Colour scheme removed** from the burger menu in every tool (ToolShell, DecisionShell, Visualiser, the two PDF generators and the Parallel Lines explorer); renderers still receive the value `"default"`. Parked in `docs/TIDY_UP.md` §3 as a long-term accessibility update that needs a rework.
- **Changing a Question Option no longer regenerates the question** (ToolShell and DecisionShell). The question on screen stays and the next one follows the new options. Options marked `displayOnly` redraw the current question at once from its saved seed (`src/shared/seededGenerate.ts`: questions and Decision problems carry `_seed`), which gives every tool the instant reformat with no per-tool code; level, sub-tool and top-tier changes still give a fresh question. `src/tests/seededReformat.test.ts` replays every flagged option and fails if the answer changes.
- **Developments page reshaped.** The decision tree is merged into one flat, searchable "To look at" list of 16 numbered cards. Every card has the same shape (a short header with its number and a Finish / Fold / Remove / Decide mark, then What we found, Why it matters, Suggested move, To decide, Leaning), written in `docs/TIDY_UP.md` §1 and read by the dashboard. Settled decisions have their own tab, a table of the decision, what we chose and when (its own section at the end).
- **Dashboard fixes:** the Matrix view now works on a phone (it was falling back to the list; it is now one card per tool showing what it has and what it is missing). Settled decisions collapse like the other cards, are unnumbered and list the most recently settled first.
- **Shell split (no change for teachers).** `ToolShell.tsx` went from about 2,450 lines to a 60-line lessons wrapper plus `ToolShellCore.tsx` at about 990. Moved out, each on its own commit and checked in a browser at phone, tablet and laptop sizes: share-link reading/writing (`shellUrl.ts`, with tests), starting Question Option state and the display-only rule (`shellOptions.ts`), saved worksheet setup (`shellPersist.ts`), worksheet generation and regeneration (`worksheetGenerate.ts`, with tests), what happens to the question when options change (`questionLifecycle.ts`, with tests), fullscreen worksheet fitting (`useWorksheetFit.ts`), the Visualiser camera (`useVisualiser.ts`), the level helpers (`levelOptions.ts`; the unused `derivedLevelLabels` is gone), and the screens as components (`WhiteboardView`, `WorkedExampleView`, `WorksheetView`, `WorksheetControls`, `NarrowShell`, `LessonBar`). The one open piece (a lint tool) is `docs/TIDY_UP.md` item 1.
- **Shell safeguards.** Each screen of the shell runs inside `ShellPartBoundary`: if it fails, only that screen shows a message naming it (with Try again) and the rest of the page keeps working. Generator calls run behind `attempt`, so a throwing generator leaves the question or sheet on screen and shows a note. Every failure is recorded with the screen, sub-tool, level and mode (`shellDiagnostics.ts`, `window.__mtFaults`). New: `src/tests/shellDiagnostics.test.ts` and `npm run smoke:shell` (a real-browser check of every screen at laptop, tablet and phone sizes). Renamed the screen components' parameter `P` to `props`; the dashboard's Developments text in `CLAUDE.md` now matches the page.
- **Lint added, then finished.** ESLint with the React hooks rules (`npm run lint`, run in CI; `eslint.config.js`) now covers every file under `src` with none left off. Fixed missing dependencies in the Escape-key, Visualiser, worked-example, `ExpandingBrackets`, `SystemArchitecture` and `ParallelLinesInteractive` code; every deliberate exception (shell, `SmartGrapher`, `DecisionShell`, tools) says why, enforced by `src/tests/hookDisables.test.ts`. CI also runs `npm run smoke:shell` as its own job. The To look at list is now 15 cards.
- **Three quick items cleared.** The last local `randInt` / `pick` copies (five tools, four Decision files) now use the shared ones; 148 exports no other file used are un-exported (and a dead helper deleted), with `src/tests/localExports.test.ts` to keep it that way; and `src/tests/dashboardCounts.test.ts` explains why the dashboard lists 79 of 80 registry entries. The To look at list is now 12 cards. The one occasionally failing test seen in earlier full runs was identified: Order of Operations' Level 1 "Spot the mistake" on the times-tables grid finds nothing in about 1 draw in 700 (the app then falls back to an Evaluate question, so teachers never see it); the test now allows a few draws.
- **More options redraw instantly.** Fractions "Whole & Part Method", Powers of 10 "10ⁿ notation", Percentages "Unitary method" and Ratio Sharing "Numerical method" are flagged `displayOnly` (checked by `seededReformat.test.ts`). Basic Angle Facts "Always horizontal" is left alone on purpose: its rotation shares the random sequence, so flipping it would change the numbers.
- **`colorScheme` removed from the renderer API.** `questionRenderer`, `answerRenderer`, `stepRenderer`, `stepVisualRenderer`, the working scaffold's `render` and `WorkedExampleSteps` no longer take it (it was always `"default"`); about 35 files updated, found by the type-check, and `CLAUDE.md` shows the new signatures. Best Buys "Force unitary method" now redraws instantly (a new `rewordsAnswer` flag on a display-only switch tells the test to check the question is identical rather than the answer); the Decision story-text question is parked until a Decision tool is reworked. The To look at list is now 11 cards.
- **Two diagram tools on the shared printer.** Basic Angle Facts and Angles in Parallel Lines now print through `handleDiagramPrint` (about 200 lines of hand-rolled printing deleted; the printed parallel-lines answers keep the reason behind each angle via a new `_printAnswer`; both now have the standard column choice). Recipes keeps its own print, because its tables are not pictures. The dev-mode working-chains card is gone: the question already sits on each tool's dashboard note. The To look at list is now 10 cards.
- Docs updated: `CLAUDE.md` (QO-driven behaviour, `levelLabels`, DecisionShell), `docs/FEATURES.md`, `docs/HOW_A_TOOL_IS_BUILT.md`, `docs/TIDY_UP.md`, `docs/PROJECTS.md`.
- Notes: Build Log, "Admin tidy, level (i), options keep your question".

### 2026-10-24 — Feature guide: every feature named and described
- New `docs/FEATURES.md`: the name and purpose of each feature (modes, controls, worksheet settings, instant reformat, Tool Information (i), Smart Progressor, calibration, developing picture, representations, and the dashboard's own parts), in plain language. Shown on the dashboard as a new **Features** tab (searchable, one card per feature, grouped); read by `scripts/adminDocs.mjs` into `adminDocs.json` (run `npm run facts`). Mirrored in the planner as "Maths Tools — Feature Guide". `CLAUDE.md` says to add an entry whenever a feature is built.
- Notes: Build Log, "Feature guide".

### 2026-10-24 — Tidy-up pass: no-ops removed, small fixes, Developments by feature
- **Developments → Differs from the standard** now opens on a **By feature** list: each thing a tool can have beyond the standard (Depth, Lessons, Teach deck, Developing picture, Calibrated, Smart Progressor, Scaffold, instant reformat, own print layout, skill links, not on ToolShell, each picture type) with the tools that have it as clickable chips (dashed = not live). The written per-tool notes sit below.
- **Removed (nothing used them):** `plainDisplay`, `cycleDisplay`, `cycleStateLabels`, the `fixedQuestions` and `comingSoonLevels` shell options (and the "Coming soon" level tooltip), Teach `phase`, the `answerFontClass` prop of `WorkedExampleSteps`, and six dead exports.
- **Fixed:** the Tool Shell template page is no longer public; `useLayoutMode()` gained `short` and `narrow` so Decision and CS shells honour "View as"; Recipes no longer puts `\text{}` in steps (the smoke test now fails new uses; Collecting Like Terms and Non-linear Sim Eq are allow-listed until their review); Equations of Lines' gradient counter no longer lives at module level; the landing page gives Binary & Number Bases the Computer Science colours; the four PDF generators and the shared printers open their print window through one `openPrintWindow`.
- **One `formatNumber` / `texNumber`** in `shared/math.ts` (a comma from four digits up, negatives and every decimal kept); Estimation and Powers of 10 use it, Rounding's significant-figures numbers now take the comma from four digits too (4,372); the Negative Operations PDF helper that shared the name is now `cleanCell`.
- `docs/TIDY_UP.md` (and so the Developments page) now lists only what is still open: finished items and the decision-tree rows for them were removed.
- **Decided:** the barrel rule is amended (named sub-paths allowed; `CLAUDE.md`); legacy Flow Networks ideas stay; skill drill-down markers stay in, parked; the dev-mode working chains stay for now and are settled inside each tool's review.
- Notes: Build Log, "Tidy-up pass 2026-10-24".

### 2026-10-24 — Dashboard tidy: one top bar, type as a dropdown, phone layout
- One set of tabs (Tools · Developments · Build guide) replaces the two stacked tab bars; the kind tabs (Tools / Sandboxes / Games / PDF generators / Workshop) became a "what to show" dropdown beside Filters. Compact header (icon buttons, smaller title on phones); sort moves into Filters on phones. No horizontal scroll at 390px.
- Notes: Build Log, "Dashboard: Developments and How a tool is built".

### 2026-10-24 — Dashboard: Developments and "How a tool is built"
- The Tools dashboard has a top bar: **Tools · Developments · How a tool is built**. Developments: the decision tree and what-is-loose list (from `docs/TIDY_UP.md`), every tool's "Differs from the standard" notes, and what is in development / to change / open questions, grouped by strand and searchable. How a tool is built: a plain-language map of a tool file and the files around it (`math.ts`, registry, shell, helpers, prints, tests, generated facts…) and what to be aware of.
- New `docs/HOW_A_TOOL_IS_BUILT.md` (the source) and `scripts/adminDocs.mjs` → `src/generated/adminDocs.json` (run by `npm run facts` and prebuild; stale test added in `adminNotes.test.ts`). New `src/admin/DevelopmentsPage.tsx`.
- Notes: Build Log, "Dashboard: Developments and How a tool is built".

### 2026-10-24 — Audit findings recorded as a decision tree (no code changed)
- `docs/TIDY_UP.md` §1 J now ends with a per-area decision table (options and a leaning for each of the twelve findings, including what `shared/math.ts` could hold next). Nothing in it is started; Harry picks a branch and decides it before any code moves.
- Notes: Build Log, "Audit findings recorded as a decision tree".

### 2026-10-24 — One home for gcd, lcm and shuffle
- New `src/shared/math.ts` (`gcd`, `lcm`, `gcdAll`, `shuffle`), exported from the barrel; about 27 local copies replaced (tools, surds, Teach deck, Decision generators; the CS `shuffleArr` is now an alias). `gcd` is always non-negative; `lcm` is 0 when either input is 0; `shuffle` is Fisher–Yates and returns a new array.
- Three biased `sort(() => Math.random() - 0.5)` shuffles (AnglesInParallelLines, TSP/MST/CPA generators, Comparing & Ordering) now use the unbiased one. Times Tables no longer relies on in-place shuffling.
- Left alone on purpose: Mixed Strategies' own `a || 1` gcd, and the three different `formatNumber`s (TIDY_UP §1 J item 2).
- Test: `src/tests/math.test.ts` (negatives, zero, unbiased shuffle).
- Notes: Build Log, "One home for gcd, lcm and shuffle".

### 2026-10-24 — Code audit: shell against tool logic
- A static sweep of `src/` is written up as `docs/TIDY_UP.md` §1 J (twelve findings, most valuable first: the 2,100-line `ToolShellCore`, helpers re-written in tools, tools reaching around the barrel, dev-mode branches inside generators, no-op options).
- Fixed straight away: the template taught the old cycle-button look; four tools carried a verbatim copy of `makeUniqueQ` (removed; the shell wraps it); stale comments on the no-op option types; `CLAUDE.md` named four identifiers that no longer exist.
- Notes: Build Log block "2026-10-24 — Tools dashboard reshaped…" (last paragraph).

### 2026-10-24 — The dashboard is the working record
- Decided with Harry: per-tool notes are updated **on the dashboard** as work happens, and the planner is updated **at each session** from it. `CLAUDE.md` ("The tracking habit") and `docs/TIDY_UP.md` §2a now say so; planner tool pages keep their Review blocks as history only.
- Notes: Build Log block "2026-10-24 — Tools dashboard reshaped…" (last paragraph).

### 2026-10-24 — First pass of the dashboard notes
- Every tool on the Tools dashboard now has a plan status and a "Differs from / adds to the standard" note; 26 have a representation, 44 a "wants to change", 13 an "in development" line and 15 an open question. Only empty fields were filled (nothing Harry or an earlier session wrote was changed), and the differs-from, representation and status text is derived from the generated facts, so it is as true as the code today.
- "Wants to change" lists only what the plan already names: Question Options with five or more controls at one level (the grouping pass), the closing answer step still to do, the three hand-rolled print grids, and the pictures the prongs list (Iteration and Completing the Square graphs, Recipes ratio table, bar models for fractions and percentages, Estimation number line). Open questions are the go-live and keep-or-fold decisions already on `docs/TIDY_UP.md`.
- Left blank on purpose: **Review** (a judgement Harry makes when a tool is reached) and **Representation agreed**. These notes are a draft to correct, not a verdict.
- Notes: Build Log block "2026-10-24 — Tools dashboard reshaped…" (the later update lists this pass).

### 2026-10-24 — The tracking habit written down; planner pages generated from the code
- `CLAUDE.md` gained **The tracking habit**: what to do at the start, during and end of a session, a table of which event updates the repo, the dashboard and the planner, and seven rules (never type what the code can count; code > repo > notes; link don't restate; planner tool pages are generated then lightly authored; planner mechanics; what "done" means; a check before ending).
- New `scripts/notesPages.mjs` (with `src/tests/dumpToolConfigs.test.ts`, skipped unless `DUMP_CONFIGS=1`) builds the text of each tool's planner page (At a glance, What it does, Sub-tools, Levels, Question options, Defaults) from `toolFacts.json` and the tools' own configs. It writes a JSON file only; pasting into the planner stays a manual step.
- The planner's 63 tool pages were rebuilt this way; Data Units and Binary Counting pages added; the old per-level Question options blocks merged. Final cross-check: `npm run facts` leaves no diff, `npm test` and the type-check pass, the dashboard notes' states match the registry (the Skill Library is "shelved" there and "parked" in the registry, which is the same thing), and no repo doc still names a retired planner note.
- Notes: Build Log block "2026-10-24 — Tools dashboard reshaped…" (its "Update later on 2026-10-24" section).

### 2026-10-24 — Repo, notes and admin as three views of one project
- `CLAUDE.md` gained **How the three sources work together**: the repo is everything needed to continue; the notes (planner) are the deeper per-session record the repo can reference; the admin page is the site and its development at a glance. Each points to the others — a patch-notes entry ends with a `Notes:` line naming its Build Log block, and the Build Log names the branch and the repo entry. Where they disagree the code wins, then the repo docs, then the notes. The end-of-session routine is now repo → admin → notes, with a Build Log block every session.
- `docs/PATCH_NOTES.md` now holds October 2026 on; older months moved to `docs/history/PATCH_NOTES_to_2026-09.md`. The closed-migration section and the parked Skill library's authoring detail were condensed in `CLAUDE.md` (the latter moved to `docs/BACKBENCH.md`). Hand-written counts that the dashboard generates were removed from `PROJECTS.md`.
- What would bring the notes and admin sides in line (an overview front door on `/admin`, keeping the planner's state lines current, one per-tool record) is in `docs/TIDY_UP.md` §2a, for discussion.
- Notes: Build Log block "2026-10-24 — Tools dashboard reshaped; repo scrubbed and streamlined; repo, notes and dashboard as three views of one project". The notes were audited the same day: Features, Tool Index and Development Prongs now point to the dashboard for counts instead of typing them.

### 2026-10-24 — Repo docs scrubbed against the code and the live site
- **Rewritten:** `README.md` (it listed jsPDF and html2canvas, which are not dependencies; a stale file tree and tool lists; and the wrong domain — production is `maths-tools-phi.vercel.app`, confirmed in Vercel) and `docs/PROJECTS.md` (now current state only: the session-by-session history it carried is in this file and git; wrong claims fixed — Indices, Partial Fractions and Binomial Expansion are live, Depth is on four tools, Smart Progressor on 12, the Decision tools are not all dev-gated, 14 Critical Path skill tabs).
- **Removed:** `docs/TOOL_AUDIT.md` (the finished August audit; the Tool review cycle replaced it), the four finished one-off audits in `docs/audits/`, the generic "Session rhythm" sections in both architecture plans, and the Teach decks half of `docs/BACKBENCH.md` (decks are active as lesson decks).
- **Corrected:** `CLAUDE.md` (eight core representations, not six; four undocumented `defaults` options added; categories table matches the registry; five build types including Depth; the doc map), `docs/GLOSSARY.md`, `docs/design/LESSONS.md` (the "plain pills / cycle button" rule no longer exists), the Decision architecture plan (status, module layout and increment ladder now describe what is built), `specs/` statuses and READMEs (broken relative links, Depth folder), and two code comments (`devMode.ts` header, a `NonLinearSimEq` TODO).
- `docs/PATCH_NOTES.md`: date headings made one level (`###`) throughout.
- Findings that are code decisions, not doc edits, are in `docs/TIDY_UP.md` §1 D and G (notably: the Tool Shell template page is registered live).

### 2026-10-23 — Tidy-up inventory (planning only)
- Added to the inventory: burger-menu printable sheets (Rounding only; to be named and rolled out), the two information (i)s (move beside the tool title, expand into an "About this tool" panel), and a section on writing down how we build tools, lessons/decks and roll capabilities out.
- Replaced the consolidation plan with `docs/TIDY_UP.md`: an inventory of split ends (features on only a few tools, two ways of doing one job, dead options, undecided tools, naming drift, doc drift), each marked finish / fold / remove / decide, with guardrails for later.

### 2026-10-23 — Dashboard: tool panel tidied
- The scattered green and struck-through pills in the tool panel are now two aligned boxes: a key/value table, and a two-column "Has" checklist with the same filled / hollow dots as the Matrix.

### 2026-10-23 — Dashboard: phone layout, calmer notes
- Phone: shorter header, one-line notes warning, Overview folded by default (smaller cards when opened), scrolling kind tabs, two clean toolbar rows, and strand names left to the headings so tools start near the top.
- Notes panel: each field reads as plain text and opens in a fixed-size box on tap (no resize handle, nothing that grows). On a phone the notes come before the code facts.

### 2026-10-23 — Dashboard: collapsible, columns, Matrix
- Strand headings collapse (click one, or Collapse all / Expand all); the Overview cards collapse to a one-line summary; a Columns button hides State / Has / Representation / Note. All remembered per device.
- New **Matrix** view: one row per tool, a filled or hollow dot for each thing a finished tool should have (Depth, Lessons, Teach, developing picture, calibration, Smart Progressor, scaffold, spec, picture agreed, reviewed), with a count of how many have it at the foot.

### 2026-10-23 — Dashboard: one state, grouped list, Next up, calmer filters
- The State column no longer says "In development" twice: availability (from the code) is the pill, and the note's status shows as "Plan: …" only when it adds something.
- The list is grouped under strand headings (or A–Z / by state), with a sticky header and a tidier row (strand moved to the heading, shell under the name). Filters sit behind one button with a count. A **Next up** view lists tools worth picking up (ready to go live, open questions, planned changes, in progress), with the reasons shown.

### 2026-10-23 — Dashboard: kinds, so a technique is not weighed like a tool
- Every registry entry now has a derived `kind`: **tool**, **sandbox**, **game**, **generator** or **workshop** (internal pages: Tool Shell template, Technique/Skill libraries, the 11 technique previews). Of 79 entries, 51 are teaching tools.
- `/admin` has a tab per kind and opens on Tools; the Live / In development / Hidden / Parked counts, strands, shells and feature filters follow the tab. Feature chips and the "no agreed representation" count only apply to tools.

### 2026-10-22 — Tools dashboard (`/admin`)

- New Developing-tools-gated **Tools dashboard**: every tool (79) with live / in development / hidden / parked, shell, sub-tools and what it has (Depth, lessons, Teach, developing picture, calibration, Smart Progressor, scaffold, tests, spec, pictures used); stat cards and filters (strand, shell, has/missing per feature, agreed representation, need attention); a drawer per tool with the facts and editable notes (status, in development, wants to change, differs from / adds to, representation + agreed, review, open questions). Linked from the landing menu under Developing tools.
- **Facts are generated from code** (`scripts/toolFacts.mjs` → `src/generated/toolFacts.json`, run before every build, `npm run facts`; a test fails if stale). **Notes are shared and live**: `api/tool-notes.ts` (Vercel function) stores them in one private Blob with ETag-checked merges so Harry and Claude can both write; a device-only fallback keeps the dashboard usable until the Blob store is connected.
- **Live and verified on the branch preview (2026-10-22):** Blob store + `ADMIN_KEY` set up by Harry, `*.vercel.app` allowed in the Claude environment; Claude read and wrote notes through the API (first notes: the three word games). Two bugs found and fixed on the way: the function couldn't import from `src/` (shared logic now in `api/_notes.ts`), and conditional writes failed on a weak ETag (now taken from `head()`).

### 2026-10-22 — Words Bingo goes live; word-game setup page rebalanced

- **Words Bingo is no longer dev-gated** (Hangman and Pairs stay behind Developing-tools mode). Interactive Tools gains sub-headings: **Games** (the three word games) and **Sandboxes & explorers** (Algebra Tiles, Negative Counters, Parallel Lines, P-Value, Grapher Lab), via the registry `group` field.
- Shared setup page (`SetupScreen`): topics across the top, then three even cards (Level, Clues, the game's own options), then a full-width Start button. Bingo now uses it too.

### 2026-10-22 — Maths word games: Hangman and Pairs, key stages, shared word bank

- **Shared library** `src/shared/mathsWords/` (words, pictures, `ClueView`, filter panel, setup screen, confetti, URL params). Words Bingo now draws from it; new tools `/maths-words-hangman` and `/maths-words-pairs` (both `enabled: false`).
- **Key stages:** every word is tagged KS2 / KS3 / KS4 and a Level selector (KS2 default) filters the pool in every game; the word bank shows the badge and a filter. ~60 harder words added (Pythagoras, chord/arc/sector/tangent, standard form, surds, histogram, box plot, tree diagram, quadratics, proof…), with new pictures for them. Simultaneous equations is KS4.
- **Hangman:** clue on one side, balloons that pop on wrong guesses (6/8/10), on-screen and physical keyboard, Another clue, Reveal a letter (costs a balloon), Give up, saved/lost tally.
- **Pairs:** word ↔ clue memory cards, 6/8/10 pairs, solo (attempts) or two teams (turns, points), optional peek, flip animation, confetti.
- **Bingo:** the revealed word no longer overlaps the clue (own reserved row); progress dots replaced by an x/25 counter.

### 2026-10-22 — Maths Words Bingo (new standalone game, dev-gated)

- New tool `/maths-words-bingo` (`src/tools/Interactive/WordsBingo.tsx`, data + game logic in `WordsBingoData.ts`, pictures in `src/shared/components/BingoPics.tsx`), registered `enabled: false`. Standalone by design (a game, not a question generator).
- Class bingo: students write 9 of 25 words; the caller shows a clue (definition, symbol/number or picture), never the word. KS2 and below plus a few recognisable KS3 words; four packs: Shapes & angles, Number & operations, Fractions (generated, simplest form only: bar, pie and symbol clues), Measures & data.
- **Flow:** setup → all 25 words full screen (staggered pop-in) → Start calling collapses the board away → just the central clue, with a progress-dot strip. Show board brings the 25 back with revealed words ticked.
- **Cycle out unknown words:** tap a word on the opening board to swap it for a fresh one (same pack where possible, never conflicting, never one already cycled out; `swapWord`). In play, Skip for now sends the word later in the deck and it returns with a different clue.
- **Dynamism:** bouncing-dots draw before each clue, clue pop-in, flip-reveal of the word, optional thinking-time ring (10/20/30s, auto-reveals), confetti on a valid bingo.
- Settings: packs (mixed boards take an even share per pack), clue types, bingo = line / four corners / full house, thinking time. Words that could share a clue never share a board (`CONFLICTS`). Check bingo verifies a claim against the words called. Printable word list + blank 3×3 grid. URL holds `seed`, `packs`, `clues`, `win`, `timer` (swaps are not stored).
- **Content pass:** fractions cut to a core 15 (halves, thirds, quarters, fifths, a sixth, an eighth, tenths) plus fraction vocabulary (numerator, denominator, equivalent, improper, mixed number, simplify, common denominator, fraction wall…); every fraction can show as a bar model, a fraction circle or a symbol. Drawn 3D pictures for cube, cuboid, cylinder, cone, sphere, pyramid and triangular prism; new pictures for number line, fraction wall and pie chart; extra words (whole number, square root, ratio, inverse operation, coordinates, pie chart).
- **Word bank:** a browsable view (button on setup and on the opening board) listing every word with all its clues (definitions, rendered symbols, pictures), filter by pack, search by word or definition, and the words each one can never share a board with.
- **Expanded to 237 words in six packs:** Shapes & angles (55: heptagon/decagon, semicircle, net, horizontal/vertical/diagonal, protractor, transformations, clockwise, origin…), Number & operations (51: roman numerals, power, BIDMAS, ≤ ≥ ≠, infinity, triangular numbers…), Fractions & percentages (32: percentage and decimal equivalents, kept apart from their fraction on a board), Measures, time & money (41: clocks as pictures, AM/PM, calendar, money, temperature, area and volume units), and two new packs, Data & probability (31: averages, graphs, Venn, chance vocabulary) and Algebra & patterns (27: expressions, equations, sequences, function machines, axes). New pictures: clocks, cube net, semicircle, lines, line graph, scatter graph, Venn diagram, function machine.
- `src/tests/wordsBingo.test.ts` covers unique ids and clues, KaTeX, no word in its own definition, conflict groups, boards from every pack, seed repeatability, clue rotation and swapping.

### 2026-10-21 — Negative laws deck reworked; fraction notation stays simple; answer form default
- The negative-laws deck now follows the method: write the negative index as a fraction, form the single fraction, cancel (x⁻²×x⁵ = (1/x²)×x⁵ = x⁵/x², tiles cancel); divide by a negative uses Keep, Change, Flip; (x⁻²)³ and (x⁻²)⁻³ are written with the inside as a fraction (a negative power flips it). The tile scene takes a `head` / `tail` line so the picture's equation matches the slide.
- Depth checks no longer repeat the slide before them: the zero deck uses (5x)⁰, the laws deck uses y⁻⁴×y⁷, a spot-the-error on a⁻⁶÷a⁻² and on (y⁻³)², and make-your-own.
- Negative & Zero Indices, Level 1, Fractions notation: now only the fraction forms of the same bare questions (x^a/x^b, 1/x^a × x^b, (1/x^a)^b). Before, Divide and Power of a power pulled in Level 2 shapes (a product on the bottom, a power of a ratio).
- Answer form: **Leave negatives** is now the first, default button; Positive indices is the second.
- Negative & Zero Indices no longer has any weighted options (question types, notation, bases, answer form), so the Smart Progressor has nothing to order by and its toggle is not offered: worksheets stay in random order instead of opening with the zero-index questions (answer 1).
- Writing Indices: a coefficient only goes with a letter, so at Levels 2 and 3 **Numbers** is greyed out ("needs Powers like 2/3" / a type that can use a number base) while only coefficient types are ticked, and a coefficient question always uses a letter even if Numbers is ticked. Before, ticking Numbers with only "Negative with a coefficient" quietly produced Level 1-style questions with no coefficient.
- Lesson labels say "Practice" (not "Practise").

### 2026-10-21 — Zero and negative powers lesson rebuilt
- Lesson now runs: Teach (zero and negative powers) → Practise writing negative indices in **Writing Indices** (whiteboard, then worksheet; negative indices only, letters and numbers) → Teach (the index laws still hold with negative indices) → Practise the laws in **Negative & Zero Indices** (whiteboard, worksheet) → Extend. The first deck's hand-off now points at the Writing Indices practice. The separate "Index laws with negative indices" lesson is folded in.
- Negative & Zero Indices: **Notation** (Powers / Fractions) is now a mixable pool, so both can be ticked and a sheet mixes them; with answers left as negatives the prompt reads **"Write in index form:"** instead of "Simplify:". The lesson's practice steps use both notations and leave negatives.
- The "index laws with negative indices" deck is rewritten to show WHY each law still holds, using only 'a negative index means one over': the laws on three separate lines, then tiles for x⁻²×x⁵ (it becomes x⁵ over x², cancel) and x³÷x⁻², and worked lines for x⁻³×x⁻², (x⁻²)³ and (x⁻²)⁻³, each ending with the law's arithmetic. The Depth checks that repeated what the slide before had just explained are gone from this deck (the Extend step after practice stays).
- Depth checks are back in the negative-laws deck, each a NEW question placed after the slide that teaches the idea (x⁻⁴×x⁷, spot Ben's a⁻⁶÷a⁻² error, (m⁻³)⁻², make-your-own x⁻⁷), not a repeat of the worked example.
- Lesson-step decks and Depth slides get more of the screen: the page drops its top padding and the slide uses a smaller chrome allowance (`LESSON_CHROME_REM`, 12.5rem instead of 16rem), with the page no longer capped at 6xl.
- The coefficients lesson and its deck are removed: Indices now has only **Laws of indices** (no negatives) and **Zero and negative powers**.

### 2026-10-21 — Fullscreen worksheet: showing answers no longer re-lays the page out
- The fullscreen auto-fit now measures the sheet with every cell drawn as its answer (the tallest it gets), then settles on one size. Showing or hiding answers, or flipping cells, never changes the size or layout again. Previously Show Answers refitted from scratch, so the text jumped and shrank because fractions are taller than questions.

### 2026-10-21 — Prompt line is quiet on the board
- A "prompt + maths" question (`lines: ["Simplify…:", "$maths$"]`) now draws the prompt as a small slate line above the maths on the whiteboard and worked example, so the question carries the emphasis. This is the same look as a tab-wide `instruction` (as in Expanding Brackets) but works for tools whose prompt varies by question or answer form, like Indices.

### 2026-10-21 — Depth plays inside the lesson deck; index laws with negative indices; hotbar docks flush
- A lesson's Depth step now plays inside the deck surface (same size and chrome as Teach slides, "← Lesson" back, "Next step ▸" at the end) instead of sending you to the Depth tab; the Depth tab's own sizing is back to how it was.
- New **Index laws with negative indices** deck and lesson (`negative-laws`): multiply (add), divide (subtract — subtracting a negative adds), power of a power (multiply, mind the signs), two answer forms, with real Depth checks, then practise, a fraction-answer practise, a four-type worksheet and an always/sometimes/never extend. The zero/negative lesson no longer jumps to other tabs.
- Fullscreen worksheet fit lets a tall fraction answer use its cell padding, so showing all answers shrinks the text less.
- The pen hotbar docks to the bottom/top edge from a wider reach (and by the bar's own edge), so it no longer floats with a gap above the bottom.

### 2026-10-21 — One slide size, a collapsible step bar, answers in place of questions
- Teach slides and Depth stages out of full screen now share one width rule (`src/shared/slideSize.ts`): the height left after the page's chrome, 16:9. They measured the same at 1366×768 (910px) and 1920×943 (1152px).
- The lesson step bar can be collapsed to a tiny "n/N" tab (remembered per device) and hides itself whenever anything is full screen (worksheet, whiteboard, worked example, Teach or Depth present), via an `html[data-mt-fs]` flag (`src/shared/fullscreenFlag.ts`).
- Worksheet cells with answers up now show the ANSWER, large, instead of the question with the answer squeezed under it. Double-tap a cell to flip it between question and answer, so answers can be revealed one at a time; the Show Answers switch resets every cell. The regenerate button is its own target (it never counts as half of a double-tap). Picture cells keep the picture with the answer under it.

### 2026-10-21 — Lessons: bigger slides, no trapped menu, compact step bar; new coefficients lesson; hotbar docks back
- A deck opened by a lesson step is now larger: the page's title and tabs are hidden while it plays (the step bar and the "← Lesson" button are the way round), so the slide gets about 7rem more height.
- Fixed the "trapped" Teach menu: the page's link loses its `deck` parameter after the first URL sync, which brought the deck menu back behind "← Lessons". A lesson's deck now remembers it was opened by a lesson, and its back button returns to the lesson overview.
- Removed the cream band under the page (a spacer I had added for the step bar). The step bar is now a small pill (Step n of N · Back · Next · ×) with the step title as its tooltip.
- Ink hotbar: a flat bar pushed against a side edge now docks vertical there (before, the pointer had to reach the edge, a bar-length beyond where the bar stops, so it felt as if it would not go back).
- New lesson **Negative powers with coefficients and brackets** (Level 2 of Negative & Zero Indices): a deck (a coefficient with a negative index, "only the letter has the index", brackets carry everything, a you-do), practise, worksheet and a Depth extend. The divide scene now writes the coefficient result for every pair of powers.

### 2026-10-21 — Fullscreen worksheet: every cell the same size
- Fixed: in a differentiated fullscreen sheet the last cell of every column was shorter than the rest (the level box's padding was being added to its last row), and the sheet ran past the screen. The box now ends in a spacer row, rows split the screen exactly once the text fits, and columns are always equal widths. Measured equal cell width and height in 9 cases (standard, with answers, differentiated, diagram, many questions).
- Differentiated sheets say each level's shared prompt once under the level heading (the Say the prompt once switch covers it), which is what lets them fit the screen.

### 2026-10-21 — Fullscreen worksheet fits the screen; condensed wording
- Fullscreen worksheet: the text size fits itself to the screen (largest size that fits, rows stretched to fill), re-fitting on changes; the size buttons take over and an Auto-fit button brings it back. Worksheet sizes now go up to `text-7xl`.
- **Condensed wording** is a switch in the Worksheet Settings popover (not a Question Option): `123.45` over `(3 d.p.)` instead of "Round 123.45 to 3 decimal places." It shows only when the sheet's questions carry a condensed form (Rounding's text questions today), is off by default, and changes the screen sheet only. Questions carry `_condensedLines` beside their full lines.

### 2026-10-21 — Worksheets say a shared prompt once
- When every question on a standard worksheet opens with the same prompt line ("Simplify, giving your answer with positive indices:"), the sheet shows it once above the questions and the cells carry just the maths (screen only: print is unchanged). Mixed prompts, differentiated sheets and tools with their own renderer keep per-cell prompts (now a quiet label). Helpers in `src/shared/prompts.ts`. A **Say the prompt once** switch in the Worksheet Settings popover (shown only when the sheet has a shared prompt; on by default, remembered per tool for the session) turns it off.
- Indices Level 1: zero-index questions use the same prompt as the others, so a Negative & Zero Indices sheet has one prompt.

### 2026-10-21 — Lesson step bar always in reach; worksheet maths easier to read
- The running lesson's step bar is now a card floating bottom-left of the screen (above the bottom bar on phone and tablet) instead of sitting under the header, so Back / Next never scroll off; it also shows in fullscreen and on the narrow layout.
- On-screen worksheet cells: maths is larger (`.ws-math` in `src/index.css`), superscripts and fractions are lifted from KaTeX's 70%, text cells have less padding, and a prompt line above a pure-maths line ("Simplify:") is a smaller, lighter label so the maths dominates. Print is unchanged.

### 2026-10-21 — Zero and negative powers lesson: the pattern of dividing
- New Teach scene `indexPattern`: a column of powers of one base going down the index, with a "÷ base" chip between rows in the base's tile colour; rows below a chosen index take two beats (predict, then reveal).
- The Zero and negative powers deck now opens with the notation again (base and index), then 5³ → 5² → 5¹ → 5⁰ ("why 5? because 5 is the base"), a check on 5⁰, the pattern carried on to 5⁻¹, 5⁻², 5⁻³, what a negative index means, the same pattern with base 2 to predict, and only then the tile cancelling as a second view.

### 2026-10-20 — Negative & Zero Indices: Level 1 is bare terms again
- Level 1 zero-index questions no longer include 7n⁰ or (7n)⁰, and Divide-to-negative no longer divides coefficients (12x³ ÷ 4x⁵); coefficients start at Level 2.

### 2026-10-20 — Lessons page
- The burger menu no longer lists every lesson: one **Lessons…** item opens a full-page list of lesson cards (title, summary, step count); picking one opens its overview.

### 2026-10-20 — Indices goes live
- Removed `enabled: false` from the Indices registry entry; it now shows on the landing page without Developing-tools mode.

### 2026-10-20 — Identify Sig. Figs: combined zeros, no full stop after the number
- Level 3 gains a **Combined** zeros button: numbers mixing two or more kinds (0.00305 leading + trapped, 0.0450, 3050…); whole-number-only gives trapped + trailing.
- The Circle / Underline prompts no longer end in a full stop that read as a decimal point (170. / 125.12.).

### 2026-10-20 — Worksheet fullscreen (every ToolShell tool)
- A Fullscreen button in the worksheet's top-right corner (laptop layout) opens the sheet over the whole screen, edge to edge: slim bar with Columns − / +, text size, Show / Hide Answers and Exit (Esc). Opens with at least 3 columns. Not yet on the phone / tablet layout or the Advanced worksheet builder.

### 2026-10-20 — Identify Sig. Figs: underline instead of write
- The single-figure task now says "Underline the 3rd significant figure of …" and the answer shows the number with that digit underlined (option renamed Underline one).

### 2026-10-20 — Indices: Writing Indices tab and one shared ladder
- New **Writing Indices** tab holds everything that is only a change of form: negative indices (x⁻³ ↔ 1/x³, 3x⁻² ↔ 3/x²) and roots ↔ powers (∛x ↔ x^(1/3), x^(2/3), negative fractional), with a Letters / Numbers base option.
- **Negative & Zero** and **Fractional Indices** now match Index Laws: Level 1 bare terms, Level 2 a coefficient (or bracket / root of a bracket), Level 3 two letters and combined or negative-fractional laws. Negative & Zero gains a Notation option (Powers | Fractions: x³/x⁵, x³ ÷ 1/x²). Fractional gains a two-letters generator.
- Depth items re-levelled and added for all four tabs; lesson / Teach presets re-pointed.
- Identify Sig. Figs (Rounding): worksheet no longer capped at 2 columns (new `maxColumnsByTool` default).

### 2026-10-19 — Negative & Zero Indices: rebuilt on the agreed ladder
- Level 1: the laws in power notation (zero index, x³ ÷ x⁵, laws with a negative index, power of a power; write-between-forms is optional). Level 2: the same laws as fractions (fraction bar, reciprocals, x³ ÷ 1/x², power of a fraction). Level 3: coefficients, brackets, two letters, combined.
- New Letters / Numbers base option on every level; number-base answers are a single power kⁿ. Depth items re-levelled and three fraction-notation items added.

### 2026-10-19 — Indices: numbers tab, Negative & Zero Indices, Fractional Indices
- **Powers & Roots** is now the numbers tab. L1 recaps squares, cubes and their roots (plus index notation; combined and negative bases as options); L2 is zero and negative powers (`7⁻¹`, `3⁻²` as a fraction, `5⁰`, writing `1/25` as a power of 5); L3 is fractional and negative fractional powers (`49^{1/2}`, `16^{1/4}`, `27^{2/3}`, `8^{-2/3}`), with a Calculator option. A **Bases** selector (whole numbers · fractions · decimals) is on every level; fraction and decimal bases are chosen so roots are exact.
- **Negative & Zero Indices** (the old Negative & Fractional tab, key `specialPowers`): L1 write between forms, the zero index, `x³ ÷ x⁵` and laws with a negative index; L2 powers of powers `(x⁻²)⁻⁴`, bracketed terms, coefficients; L3 dividing with coefficients, two letters, combined, number bases. **Answer form** option: positive indices (default) or leave negatives.
- **Fractional Indices** (new tab): L1 write between root and index form (square to 5th roots, `x^{2/3}` ⇄ `(∛x)²`, a Negative indices option); L2 the laws with fractional indices (multiply, divide, power of a power; different denominators and negatives optional); L3 roots of brackets, coefficients, negative fractional.
- New `IndicesCore.ts` (exact rationals, monomials with rational exponents, house-style formatting), `IndicesNumbers.ts`, `IndicesAlgebra.ts`. Tests recompute every numeric answer with exact arithmetic (`_idx`) and every algebra answer by evaluating question and answer at numbers.
- Depth bank re-pointed to the new tabs and levels (about 25 new items); lesson and deck presets re-pointed. **Not done:** new lessons and decks for the laws with negative and fractional indices.

### 2026-10-19 — Network Flows, Explain and justify: the earlier parts' results are handed over
- Standing alone, the reasoning questions (a pipe switched off, increasing a pipe, which pipe to upgrade, a restriction, a section blocked, a new pipe, two pipes bigger) now state the maximum flow and draw it on the picture; the ones that need the minimum cut also mark it. Claims name the cut they use and the impossible-flow question names its cut, so a 1–2 mark question is only the reasoning. Exam question chains are unchanged (their earlier parts supply this). `PartCtx.facts.given`, `giveFlow` in `flowParts.ts`; tests in `flowReason.test.ts`.

### 2026-10-19 — Decision topic chooser: small groups sit side by side
- `TopicChooser` now wraps its groups in a row: a group with one or two topics takes only the width it needs and shares a row with its neighbours when there is room (Network Flows: Supersource and Explaining and justifying now sit beside Cuts and maximum flow; CPA pairs up on wide screens). Tiles are 176px wide (were 188). On a narrow in-page chooser a one-topic group takes half a row.

### 2026-10-18 — Network Flows: parts library, Explain and justify, two-figure questions
- **Parts library** (`flowParts.ts`): every exam part is a `PartDef` (idea, tier, `build` that returns null if the network does not suit). The six old hand-written chains are now **recipes** (`flowExam.ts`) that the composer fills, retrying until every part fits; the existing exam tests pass unchanged apart from three that assumed a fixed final part.
- **New reasoning parts**, each recomputed by an independent check in `flowReason.test.ts`: cut as an upper bound, flow vs cut (equal / range), claim that a flow is maximal or that a cut is the maximum, supersource and supersink in words, forced arcs and impossible flows on min/max networks, a pipe switched off, a restriction that may have no effect.
- **Explain and justify** tab (Network Flows, Skills): one tile, an **Idea** Question Option (AS and A-level lists), three levels = network size with more judgement at higher levels. Earlier-specification ideas are marked * and off by default.
- **Two-figure questions** (`ExamPart.figure`): the picture is named Figure 1 / 2 and follows the active part; a printed paper gives each figure above its parts. First user: the A-level chain **Forced flows, then augment**. Also new: AS **Table of cuts** chain, `drawFlow`, `cutTable`, `maxFlowReason`.
- **Practise this** under every answered exam part (`PRACTISE`, `ExamPart.practise`): opens the skills tab or the Explain and justify idea.
- **Corpus** `specs/corpus/network-flows.md`: all current A-level (7), AS (9) and legacy (35) questions as part chains, with `gap:` rows for what cannot be built yet; `flowCorpus.test.ts` checks every part exists and the marks add up.
- Find a flow asks for a value close to the maximum by default (earlier today, see entry above).

### 2026-10-18 — Network Flows: Find a flow asks for a value close to the maximum
- **Find a flow** used to ask for a flow of whatever value the sampled routes happened to give (usually two or three routes), so a bigger network only meant more arcs, not a harder question. It now defaults to a value **1–3 below the true maximum flow** (1–2 at Level 1), built route by route by the same greedy method, and rejected unless it takes at least 2 (Level 1) / 3 (Levels 2–3) routes. The class has to use nearly the whole network. Works on capacity-only and min/max networks (on min/max the maximum is found from a feasible start).
- **Flow to find** option: *Close to the maximum* (default) · *A lower set value* (the old behaviour) · *Any feasible flow* (min/max only) · *Mixed*. `FlowGenOptions.target` gains `"near"`. Tests in `src/tests/flow.test.ts` check the value is 1–3 below the recomputed maximum, the flow is feasible and at least half the arcs carry flow.

### 2026-10-18 — Partial Fractions goes live
- Removed `enabled: false` from its registry entry: **Partial Fractions** now appears on the landing page (A-Level → Pure Mathematics) for everyone, alongside Factor Theorem and Binomial Expansion.

### 2026-10-18 — Binomial Expansion goes live
- Removed `enabled: false` from its registry entry: **Binomial Expansion** now appears on the landing page (A-Level → Pure Mathematics) for everyone. Factor Theorem was already live.

### 2026-10-18 — Binomial Expansion: no repeated questions, 4 d.p., footnote everywhere
- **Worksheets no longer repeat questions:** question keys had a random number in them, so the shared "no duplicates" retry never fired. Keys now describe the question. Expand Level 1 also has "up to x³" on by default so a sheet has enough different questions. A test generates a 12-question sheet per tab and level.
- **Approximation:** new **Answer** option, "To 4 d.p." (default) or "Not rounded"; the question asks for 4 decimal places and the working has a rounding step.
- The "* beyond standard questioning" footnote now also appears in the differentiated-worksheet popover.
- Spec, Info text and registry description updated for the seven tabs.

### 2026-10-18 — Binomial Expansion: asterisked options
- Options beyond the usual exam range carry an asterisk: **¼ to ⅘***, **x⁴***, **Divide first*** (partial fractions) and **Three different*** (Range of validity). All are off by default.
- **Question Options (all tools):** any popover with an option whose label ends in "*" shows "* beyond standard questioning" at the bottom. No tool wiring needed: just end the label with an asterisk.

### 2026-10-18 — Binomial Expansion: Find the unknown tab
- **New tab: Find the unknown** (after Range of validity). The power n is known (AQA: (a + bx)ⁿ, any rational n); a bracket constant is found from a given coefficient. Level 1: a from the coefficient of x. Level 2: a from the coefficient of x² (a² = …). Level 3: (a + bx)ⁿ, b from a coefficient, or a and b from the first two terms.
- Selectors: sign and size of n; **When two values fit** (Sign given, or Both values); **Then ask for** (Just the unknown, A coefficient, Range of validity, as part (b)); Level 3 also Unknown and Given.
- `expandWorking` moved into the shared binomial module so the new tab can reuse it.

### 2026-10-18 — Binomial Expansion: minus signs
- Step labels now use a true minus sign (−) throughout, and u is written without ambiguity: "u = −x/3", "u = 2x/3" (not "u = -1/3x").

### 2026-10-18 — Binomial Expansion: clearer names
- Tab "One bracket below" is now **Fractions: one bracket**. The sign selector is headed **Sign of n** (the size one stays "Size of n").

### 2026-10-18 — Binomial Expansion: Range of validity tab, wider Approximation, working safeguards
- **New tab: Range of validity** (after With partial fractions). Only the range is asked. Level 1: one bracket (a + bx)ⁿ. Level 2: two brackets with different bounds, ranges overlapped. Level 3: partial-fraction denominators: three different brackets or one repeated, any numerator.
- **Approximation widened:** it now uses the same sign and size power selectors as Expand (so ¼ to ⅘ are available) and can expand up to x² or x³.
- **Power of a fraction, Written as:** Roots now works on every level (it only took effect on Level 3), and defaults to Powers.
- **Safeguards:** no leading "1(…)" (and −1 shown as "−(…)") in the working; no "|x| < 1 ⇒ |x| < 1"; and when both brackets give the same bound (1 ± x over 1 ± x) the working says "both give the same condition" instead of "take the smaller". A test checks all three across every tab and level.

### 2026-10-18 — Binomial Expansion: Expand follows the same ladder
- **Expand (a + bx)ⁿ** now matches the fraction tabs: the level is the bracket. Level 1 (1 ± x), no k; Level 2 (1 + kx), k whole (±2 to ±5) or a fraction by a selector; Level 3 (a + bx). Any power at any level.
- Power size buttons now say what they are: Whole · ½, ⅓, 3/2 · ¼ to ⅘ (not "Standard / Extended"). Coefficient-of-x option keys renamed (kWhole, kFrac) so they no longer clash with the power size's "whole".

### 2026-10-18 — Binomial Expansion: defaults, smaller buttons, Work out x
- **QO buttons (all tools):** `OptionGrid` now sits four to a row when the labels fit, three if not, otherwise two (a short last row is centred; buttons with a `sub` line keep two). The fraction power groups got short labels (1, 2, 3 · √ and ∛ · ¼ to ⅘) so they fit one row.
- **Defaults:** Ask for is just "The expansion", and Written as is just Powers (Roots and fractions opt-in).
- **Approximation:** new "Work out x" option: the student finds the x to substitute (bracket = the number), as parts (a)(b)(c).

### 2026-10-18 — Binomial Expansion: fraction powers grouped
- On One bracket below and Power of a fraction the power selector (7 and 6 buttons) is now three groups: **Whole** (1, 2, 3 · 2, 3), **Roots** (√, ∛) and **Extended** (¼ ¾, ⅕ to ⅘, off by default).

### 2026-10-18 — Binomial Expansion: extended fractions opt-in
- Extended fractions (¼, ¾, ⅕ to ⅘) are off by default in Expand, and ¼ ¾ / ⅕ to ⅘ are off by default in One bracket below and Power of a fraction (they give large numbers); tick them to use them.

### 2026-10-18 — Binomial Expansion: power n as two selectors
- Expand's Power n is now two selectors: **Positive / Negative** and **Whole · Standard fractions (½, 3/2, ⅓) · Extended fractions (¼, ¾, ⅕ to ⅘)**. Negatives of every fraction are included. Whole needs Negative (positive whole n is Year 1). Level 1 has no Extended; the Coefficient of x selector is as before.
- A selector with a single option is never shown: Level 1's Coefficient of x, Approximation's Levels 1–2 "Ask for", and Partial fractions' Level 2 "Denominator" are gone.

### 2026-10-18 — Binomial fractions: working
- A numerator raised to a positive whole number is no longer taken apart (no more pulling the 4 out of 4 − x): it is expanded as it stands. Only the denominator's constant comes out, and the step now shows where it comes from, e.g. (3 − 2x)³ = 3⁻³(1 − ⅔x)⁻³ = 1/27 (…).

### 2026-10-18 — Binomial Expansion: exam-style parts
- Questions asking for the range now label parts like an exam paper: (a) expand, (b) state the range of values of x for which the expansion is valid. With partial fractions: (a) partial fractions, (b) expand, (c) range.

### 2026-10-18 — Binomial Expansion: roots below the line, quarters and fifths
- **One bracket below** now takes roots: the denominator bracket can be raised to √, ∛, ¼ or ¾, ⅕ to ⅘ (e.g. (2 + x)/√(1 − 2x)); the numerator stays any px + q. All on by default; a root at Level 3 uses a perfect-power constant (4/9 · 8/27 · 16/81 · 32/243).
- **Fractional powers widened** to the quarters and fifths (nothing smaller): Expand (Level 2 on, Level 3 off) and Power of a fraction (on every level), written as ⁴√ / ⁵√ roots or powers.

### 2026-10-18 — Binomial fractions: roots follow the ladder in the numerator too
- The numerator is any px + q only when the power is a positive whole number. For √ and ∛ the numerator is expanded as well, so it follows the same ladder as the denominator (1 ± x, 1 + kx, a + bx with a a perfect power).

### 2026-10-18 — Binomial fractions: levels follow the denominator
- On One bracket below and Power of a fraction the level is now the **denominator bracket** (Green 1 ± x, Yellow 1 + kx, Red a + bx); the numerator is any px + q, which widens the pool. The power is an option on every level, all ticked by default (denominator to the power 1/2/3; fraction squared, cubed, √, ∛). Roots use perfect-power constants, so they are available from Level 1.

### 2026-10-18 — Binomial Expansion: numerator order
- A linear numerator is written constant first (3 − x, not −x + 3); quadratics and above stay highest power first. Series answers stay ascending.

### 2026-10-18 — Binomial Expansion: one tool, five sub-tools
- Binomial Expansion is **one tool** with five tabs: Expand (a + bx)ⁿ · One bracket below (no partial fractions needed: (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹) · Power of a fraction (squared, cubed, √, ∛) · With partial fractions (two or more different brackets below) · Approximation. The fraction and partial-fraction generators are modules (`BinomialFractions.ts`, `BinomialPartialFractions.ts`), shared maths and the range number line are in `src/shared/binomial.tsx`. Still dev-gated; one registry entry; spec rewritten; three test files drive the one tool.

### 2026-10-18 — Binomial Expansion: wider Level 1, no L1/L2 overlap, rational forms
- **Level 1** has a much bigger pool: whole k from ±1 to ±5 and each expression written as powers or as roots / reciprocals (new Written as option).
- **Level 2** can no longer repeat a Level 1 question: Level 1's powers only appear with a fractional k there; the new powers (−3, −4, 3/2, −3/2, ⅓) take any k. Level 2 also adds (px + q)/(1 + kx), expanded directly.
- **Level 3** adds ((px + q)/(rx + s)) raised to 1, 2, 3, √ or ∛, expanded as a product of two brackets (no partial fractions), with the range the smaller of the two bounds. Tests check these numerically against the true function and the overlap rule.

### 2026-10-18 — A-level (i) on every tool; repeated-root working; descending numerators
- The **(i) beside the level buttons** (what each level means, current one marked) is now on every A-level tool: Factor Theorem, Partial Fractions, Binomial Expansion (new `levelLabels` on each sub-tool) and all four levelled Decision tools. One shared `LevelInfoDialog` serves ToolShell and DecisionShell.
- **Repeated roots:** the one constant the roots cannot reach is found by letting x = 0 (an equation in every constant, A + B + C = …) and then using the constants already found; if a root is 0 another value of x is used. Partial Fractions and Binomial Expansion both.
- Binomial Expansion writes numerators in descending powers (answers stay ascending).

### 2026-10-18 — One QO button style site-wide; Binomial Expansion condensed and opens expanded
- **Question options, everywhere:** the shared `OptionGrid` (QOPopovers) now draws every ToolShell pool and dropdown, and the Decision shell, as well-spaced single buttons, two to a row, an odd last one centred, with an optional small `sub` line under a short label. The None / Mixed / Exclusive cycle button and the joined strip are gone (`cycleDisplay` / `plainDisplay` are no-ops). A popover with more than four sections splits into two columns with a thin grey divider automatically. CLAUDE.md updated. Shortening individual tools' long option labels is a per-tool pass still to do.
- **Binomial Expansion condensed:** shorter question wording (one line per ask), the worked examples roughly halved (Partial fractions Level 2 from about 15 steps to 8: no generic-formula step, one step per fraction, one "add like terms" line, two range steps, no repeated answer step), and a one-line-per-level info.
- **A-level tools open expanded:** Binomial Expansion and Partial Fractions start with the working panel collapsed (`collapseWorkingByDefault`), so the question fills the box.

### 2026-10-18 — Decision options: short labels with a descriptive line
- Critical Path's option buttons now sit two to a row with a short label and, where it helps, a smaller descriptive line underneath (`choices[].sub`), e.g. Small / 1 to 9, Early / As early as possible, Whole / Plain rectangles, so no label wraps or stacks.

### 2026-10-18 — Decision options: spaced single buttons, split popover
- Question Options in the Decision shell are now well-spaced single buttons, never more than two to a row (an odd last one sits centred on its own row); the segmented strip is gone. A list of more than four options splits into two columns with a thin grey divider (the Split QO layout). Tick-any options use the same buttons. ToolShell's own QO controls are unchanged.

### 2026-10-18 — Decision tick-any options match the segmented style
- Tick-any options in the Decision shell now look like the single-choice rows (a bordered strip, ticked cells filled navy). A few short choices sit in one joined row; a long or larger set wraps into two columns separated by hairlines, so nothing is squeezed.

### 2026-10-18 — Binomial Expansion built (dev-gated)
- New ToolShell tool `/binomial-expansion` (Pure Mathematics, A-level, AQA 7357 Year 2; `enabled: false` until reviewed): **Expand (a + bx)ⁿ**, **With partial fractions**, **Approximation**, three levels each, multi-select option pools, answers as exact fractions with the range in modulus form (|x| < c, plus −c < x < c).
- The partial-fraction tab runs the whole chain in the working (divide first if improper, constants by substitution and equating coefficients, each term as a constant × (1 + kx)ⁿ, expand, add by powers, then the range), with a number line showing each term's interval and the overlap. Every question is re-derived by an independent series division and throws on a mismatch.
- `specs/binomial-expansion.md` is `implemented`; `src/tests/binomialExpansion.test.ts` covers the spec's sample answers and every generated question.

### 2026-10-18 — A print-templates page
- Critical Path's burger menu has one **Print templates…** item (replacing the individual print items) opening a page: pick a template on the left, see the A4 sheet as it will print, and press Print. Templates: 2 grids (portrait / landscape), 4 grids, network space + 3 grids, and the new **2 blank, 2 squared, interweaved**. Each grid has a black L-shaped axis (left and bottom) — no box borders, and blank boxes are plain space. Opt-in per Decision tool with `config.printTemplates`.

### 2026-10-18 — Levelled histograms built in time order; more print templates
- **Resource levelling:** the levelled histogram (and the choose-one options) is now stacked in order of start time, with nothing kept along the bottom for being critical, which is the order the working draws it in. Before, the picture was stacked critical-first but drawn start-first, so a block could float over a gap part-way through the working. A test now checks that no block floats at any step. The working states the method (start order, wait for workers, prefer activities with float, drop and split).
- **Print templates:** the burger menu also has *network space + 3 grids* (an empty box for the network / path analysis, then Gantt, histogram and levelled-histogram grids) and *4 grids*, each box 50 × 20 squares (3.3 mm).

### 2026-10-18 — Printable blank grids for histograms and Gantt charts
- Critical Path's burger menu has **Print blank grids** (A4 portrait, 3.8 mm squares, or landscape, 4.5 mm): two grids per page, each 50 squares across by 20 up, a heavier line every 5 squares, nothing else, so students add their own scales and labels. New `config.menuItems` on DecisionShell for tool-specific burger items; the grid is `printGrid.ts`.

### 2026-10-18 — Step dots on one line
- A long working (e.g. 36 steps) no longer wraps its progress dots onto several rows: the strip is one line, a window around the current step with the dots at each edge fading out, beside the usual "Step n of N" counter.

### 2026-10-18 — Exam (?) takes over the working space; levelling pictures switch with arrows
- In exam-style questions the **(?)** now takes over the whole right-hand side: a slim card with the part's question (and a Question button back), then the working in the same auto-scrolling cascade as the other worked examples, with Back / Next step, step counter, Show all, and the answer as the last beat. `StepCascade` moved to its own file so both views share it.
- Resource levelling: the network, cascade chart and float table are now shown one at a time, switched with < and > (replacing the side scroll).

### 2026-10-18 — Cascade/Gantt chart: three levels reshaped
- Renamed **Cascade/Gantt chart**.
- **Level 1:** the network is given with its times; draw the chart (as early as possible). **Level 2:** the network is given *without* its times: do the forward and backward passes, then draw the chart. **Level 3:** times given, every activity as late as possible.
- New **Activities** option (8–9 / 10–12, tick-any): Level 1 starts on 8–9, the others on 10–12.

### 2026-10-18 — Resource levelling: references in a side scroll
- The network, cascade chart and table of floats (with workers) now sit in a row you scroll sideways above the histogram, each with the full height and the width it needs; the histogram stays in view below. The "Histogram shown with" option is gone (all three are always there).

### 2026-10-18 — Critical Path: options reshaped, tabs merged, no multiple choice
- **Tick-any options.** New `multi` option type in DecisionShell: several choices can be ticked (never none), a question draws one at random, and until the teacher changes the ticks the option follows the level (so Level 3 selects what Level 3 needs). Every "By level" and "Either" choice is gone: "either" is just both ticked. Applied to Numbers, Critical paths, Workers per activity, Blocks (Whole blocks / Includes a stepped block), Start times, Chart, Critical activities, Style, Where is x, Answer asked, Question (reason, allocation).
- **Merged tabs:** Float + Critical paths are one tab ("Float and critical paths", Question option: float / every critical path / which must start first). Clock times is no longer a tab: Forward pass has a "Finish time as" option (minutes / clock time); the second-project level is dropped.
- **Multiple choice removed:** the "choose the correct histogram" and "circle one of four" options, and the exam tabs "Missing values" and "Choose the levelled histogram" (also excluded from mixed papers).
- **Legacy-only tabs asterisked:** Worker allocation and the exam tab "Levelling and worker allocation" (the only ones absent from the current AS / A-level papers), with a note in the Info.
- "Whole blocks" now only constrains the histogram given in a levelling question; the levelled answer may need a block to drop (requiring both stalled Level 3).

### 2026-10-18 — Critical Path: every question is in context
- The Plain / In context option is gone: every Critical Path question now names a project (a shed, a school play, a website…) with its own units. The generator still supports plain questions.

### 2026-10-18 — Decision shell: question container a little taller
- The question container is taller (window height less 1.5rem) with its inside padding trimmed (1rem), so scrolled to, it fills the screen and no sliver of the toolbar peeks above it. Applies to stepped questions and the exam layout.

### 2026-10-18 — Topic chooser sized to what is in it
- The open chooser is as tall as the tiles currently showing; it no longer reserves the height of the tallest AS / A-level × Skills / Exam combination. It still pushes the page down as before (no floating panel).

### 2026-10-18 — Critical Path Analysis goes live
- Removed `enabled: false` from its registry entry: the tool now appears on the landing page for everyone, no Developing-tools mode needed.

### 2026-10-18 — Decision shell: top-bar-free fullscreen, level (i), level-change fix
- Fullscreen has no top bar at all now: just the toolbar, then the picture and the working. Exit fullscreen (and Sandbox) sit in the picture's top-left corner, where the page's Fullscreen button is. The right column uses the same scrollbar as everywhere else.
- **Bug fixed:** changing level reset the AS / A-level choice (a per-level default overwrote it), so an A-level sub-tool vanished and the chooser said "Choose a topic". A level change now only moves options that were still on the old level's default.
- **Level information moves to an (i)** beside the level buttons: a pop-up listing this sub-tool's levels with the current one marked. Opt-in per tool with `config.levelInfo`; demoed in Critical Path (its burger-menu "Levels" section is gone).

### 2026-10-18 — Resource histograms drawn the way a person draws them
- No more searching for the "best" stacking. The order is fixed: critical path 1 along the bottom, then the other critical activities, then everything else by earliest start; each block drops onto whatever is under it, so there are never gaps underneath.
- A block that has to drop is drawn as separate rectangles, **each labelled** (so you may see E twice). The working says so.
- Levelled histograms use the same rule. "Whole blocks only" still rejects any question that needs a split.

### 2026-10-18 — Decision shell: the question folds once the working starts; levelling read against the cascade chart
- Once the working starts, the question box folds to one line (tap to open it again), giving the steps more room. It reopens on the next question.
- **Resource levelling** now shows the histogram with the cascade (Gantt) chart, floats dashed and on the same time axis, with the activity being placed lit on both. New option "Histogram shown with": Cascade chart (default) · Table of floats · Network.

### 2026-10-18 — Decision shell: a calmer fullscreen
- The heavy blue title bar is gone. Fullscreen now has one slim muted line (title, level, quiet Sandbox and Exit buttons) above the same level / Question Options / New Question toolbar as the page, on the page background.
- The picture and Working cards use the regular layout's rounded, bordered, soft-lift style; the answer card is labelled Working. Space is left on the right for the ink pen button.

### 2026-10-18 — A slim, rounded scrollbar site-wide
- The classic scrollbar (wide track, arrow buttons, square thumb) is replaced everywhere by a thin rounded pill (10px, a soft slate thumb that darkens on hover and press, no arrow buttons, transparent track) for the page and every scroll pane (`src/index.css`; Firefox gets the equivalent standard properties).

### 2026-10-18 — Topic chooser: no jumping when a filter changes
- Choosing AS / A-level or Skills / Exam style used to change how many tiles (and rows of tiles) the open chooser showed, so everything below it jumped. The chooser now lays every combination of its filters in the same cell and shows only the current one, so the open panel keeps the height of the tallest and the toolbar and question container stay put (measured: the toolbar's position is identical across every filter change, in Critical Path and Network Flows).

### 2026-10-18 — Decision shell toolbar: Question Options in the exact centre
- The toolbar is three cells like ToolShell's: the level buttons at the start, **Question Options always in the exact centre** (measured on the window's centre on every tab, whatever the number of levels), pin and New Question at the end. The blank reserved slot beside a tab with fewer than three levels is gone. Narrower windows wrap as before.

### 2026-10-18 — Decision shell: the question container fills the screen
- On a laptop-size window the Decision tools' question container (the picture, question and steps, or the exam parts) is now as tall as the window less an equal margin above and below it (about 1.25rem each): scroll down to it and it fills the screen. The topic chooser and the toolbar sit above it. Previously its height was capped (430–580px) so the chooser, toolbar and container shared one screen. `STAGE_H` in `layout.ts`; applies to every Decision tool (Network Flows, MST, TSP, Route Inspection, Critical Path).
- Tablets keep the shorter working area (`STAGE_H_TABLET`, the old rule) because of the fixed bottom action bar; phones are unchanged.

### 2026-10-18 — Critical Path Analysis: topic chooser with pictures (dev-gated)
- The tool now uses the same collapsible **topic chooser** as Network Flows instead of the stacked toggles and tab pills: a collapsed row ("AS · SKILLS" over the topic) that opens into the AS | A-level and Skills | Exam style filters (Practice | Worksheet joins them for exam questions) and grouped topic tiles — Building the network; Times, floats and critical paths; Changes and reasoning; Charts and resources; AS exam style questions; A-level exam style questions.
- Every tile has a one-line blurb and a small picture (`CpaTileArt`): the same mini activity network with the topic's feature drawn on it (a float pill, a missing x, a clock, a cascade strip, a stepped histogram, a limit line, worker lanes, three options…); exam tiles reuse their skill's picture with a marks badge.
- Phone and small tablets keep the click-through start screens (course, practice, topic). No generator, toolbar or exam-view change.

### 2026-10-18 — Critical Path Analysis: exam-style questions (AS and A-level, dev-gated)
- New **Practice | Exam style** switch (beside AS / A-level). Eleven chains built from the skill generators on one shared network: AS — Network then a change or a claim (AS Q2/Q3), Times and Glyn's claim (Q4), Effect of a change (Q5/Q1), Clock times and a second project (Q8), Missing values (Q6/Q7); A-level — Times and a cascade chart (AL Q1/Q3), Table, histogram and levelling (Q5), Histogram and levelling (Q2), Which to shorten and a limitation (Q6), Choose the levelled histogram (Q4), and a legacy-style Levelling and worker allocation. Plus "Any AS / A-level exam question". Levels are the paper sizes (8–9, 10–12 activities).
- Same experience as Network Flows exam style: reveal each part's answer with its B1/M1/A1/E1/R1 lines, (?) for the stepped working on the pinned picture, Worksheet with Print (paper with blank figures to draw on, then the mark scheme).
- Shared-shell changes: `ExamPart.stepView` / `blankStep` (a tool whose pictures are whole steps), `SolveStep.examChart`, `fixed` network option in `generateCpa`, `allocWorkers`; "1 mark" singular in the exam header.
- Spec: `specs/cpa-exam-questions.md`. Tests: `src/tests/cpaExam.test.ts` (every chain builds with the listed parts and marks; every model answer re-derived independently).

### 2026-10-18 — Critical Path Analysis: the current-spec gaps closed (dev-gated)
From the re-check in `specs/exam/critical-path-analysis.md` §12, built as levels and options of existing tabs plus two reasoning tabs:
- **Delays and changes** now has three levels (a set delay; a critical activity made quicker; a delay given as a range — "up to d days", answered as a threshold at the float — or an activity removed) and an **Answer asked** option: the project time, or the earliest start and latest finish of named later activities (AS Q1b, Q5b; AL Q3c).
- **Clock times** Level 2: a second small project timed partly in seconds that must finish with the main one — convert to minutes, total, latest start (AS Q8c).
- **Critical paths** Question option: **which activity must start first** and why (AS Q8b(i)).
- **Missing time** Level 2: a missing earliest start or latest finish in a filled-in box, and an **Answer** option to circle one of four values (usual slips as the wrong options) (AS Q6, Q7).
- **Resource levelling** Question option: **choose the correct levelled histogram** from three (one obeys the limit and precedence; one breaks the limit; one is shorter only by ignoring precedence) (AL Q4).
- New **Explain and justify** tab (AS): written reasoning marked against mark points (the tool cannot mark free text, so the working shows the evidence, then the marks and a model answer). Level 1 explain the effect of a change (delay of up to d / activity removed); Level 2 comment on a claim (a stated finish time; Glyn's "add the critical durations") (AS Q3b, Q4c; AL Q3c). New A-level tab **Limits of the model** (AL Q6c): a limitation and its effect (travel time, fixed durations, unlimited workers, cost).
- Tests re-derive every answer independently (range threshold, removal, named activities' times, seconds conversion, which-first, missing box values, the three histogram options classified by limit and precedence, claim verdicts, Glyn's sum).

### 2026-10-17 — Critical Path Analysis: A-level Which to shorten (dev-gated) — the last A-level tab
- New A-level tab **Which to shorten** (`ShortenData`, `solveShorten`): one activity can be reduced to take only 1 unit of time; which gives the smallest minimum completion time, and why? The working explains that only critical activities can help, then tries each one (the passes are redone on the picture, with the new duration), builds the comparison table of new minimum times, and concludes. When the saving is less than the full reduction it names the other path that becomes critical.
- Three levels: one critical path where the longest critical activity is best; two critical paths (only an activity on both helps; the others save nothing); a near-critical path that makes a shorter critical activity better than the longest (10–12 activities, the trap).
- Tests: every result is recomputed by an independent path listing; the best activity is unique; non-critical activities save nothing; each case holds (longest is best / two paths / the longest is not best).
- With this, all 13 tabs of `specs/cpa-skill-tools.md` exist (AS 8, A-level 5).

### 2026-10-17 — Critical Path Analysis: histogram with 10–12 activities and several workers; A-level Worker allocation (dev-gated)
- **Resource histogram** levels are now: 8–9 activities one worker each; 10–12 one worker each; **10–12 with one to three workers each** (possible now stepped blocks cannot get stuck). A **Workers per activity** option (histogram and levelling) overrides the level; the histogram's peak limit is 10 workers.
- New A-level tab **Worker allocation** (`allocateWorkers`, `solveAlloc`): each activity needs one worker. **Smallest team**: the project must finish in the minimum time, so the critical path keeps Worker 1 busy throughout; the working places each other activity on the lowest-numbered free worker and ends by showing that one fewer worker is slower. **A fixed team**: level the histogram for the new minimum time, then allocate. The chart has a row for each worker (`GanttView` reused). Three levels (8–9 smallest team; 8–9 fixed team; 10–12 either); a **Question** option overrides.
- Tests: every activity has one worker, nobody does two at once, precedence and finish time hold, the critical path is on Worker 1, and (up to nine activities) the team size or time equals an independent brute-force search, including that one fewer worker cannot reach the minimum.

### 2026-10-17 — Critical Path Analysis: stepped histogram blocks (dev-gated)
- Histogram and levelling blocks can now be **stepped**: a block sits on whatever is under it, so where the blocks below change height (the critical path along the bottom going from 2 workers to 3) its bottom edge steps up or down with them while it stays as many workers high as it needs — the "jump" seen in exam histograms. Previously every block was a rigid rectangle and any network needing a step was thrown away.
- New **Blocks** Question Option (histogram and levelling): Stepped blocks allowed (default), Include a stepped block, Whole blocks only (the old behaviour). Drawn as polygons (`HistogramView`); the working explains each step ("the blocks under it get taller, 2 to 3 workers, so it steps up with them"). Stacking is hole-free by construction (`stepStack`: orders by start, finish and length tried, fewest steps kept).
- Tests: a hand-built 2-then-3 case, and generated histograms and levelled histograms check bottom edges, no holes, the independent workers-over-time profile and that every stepped block is explained.

### 2026-10-17 — Critical Path Analysis: the harder cases built for depth of understanding (dev-gated)
- **More than one critical path** now works on the Cascade chart, Resource histogram and Resource levelling (the Critical paths option reaches them): only the first critical path sits end to end on the shared row / along the bottom of the histogram; the other critical activities get rows of their own (or are stacked with the rest).
- **Cascade chart: complete a partly drawn chart** (Chart option): the critical activities and about half of the others are given; the working draws only the rest.
- **Resource histogram: as late as possible** (Start times option).
- **Resource levelling Level 3** now needs a critical activity to be held up (the trap of delaying only non-critical activities); the generator tries every limit for a network, which also fixes an occasional "no suitable histogram" failure.
- Tests cover each (first path end to end, no shared rows, given bars, late starts, no holes, a critical activity delayed).

### 2026-10-17 — Critical Path Analysis: A-level Resource levelling (dev-gated)
- New A-level tab **Resource levelling** (`levelSchedule`, `overLimit`, `stackBlocks` in `cpa.ts`; `solveLevel`): the histogram with no limit is given with a dashed limit line and the over-limit times shaded; the working builds the levelled histogram one activity at a time (an activity starts when everything before it is finished and enough workers are free, otherwise it waits; delayed blocks are amber). Answer: the minimum completion time and the activities delayed.
- The finish time is the true minimum: an exhaustive search over placement orders, cut off by the critical-path bound. Three levels: delays fit inside the float (one worker each); the project takes longer (1–3 workers each); two or more delays (10–12 activities).
- Tests: the schedule keeps every precedence and the limit, the profile and over-limit ranges are re-derived, and (up to nine activities) the minimum completion time equals an independent brute-force search.

### 2026-10-17 — Critical Path Analysis: A-level Resource histogram (dev-gated)
- New A-level tab **Resource histogram** (`HistogramView`, `histogramData` in `cpa.ts`, `solveHistogram`): the network with its times above, the workers each activity needs (when they differ), and the histogram built one block at a time: critical activities along the bottom, then each other activity stacked at its earliest start with no gaps, then a check. Every block is labelled; no float is drawn.
- The generator keeps only networks that stack with no holes (blocks are rectangles, so one does not always exist): a small search over each block's height. Three levels: 8–9 activities one worker each; 8–9 with 1–3 workers each; 10–12 one worker each.
- Tests re-derive every block and the workers-over-time profile independently, and check no overlaps, no holes, critical activities on the bottom.

### 2026-10-17 — Decision shell toolbar: level buttons always shown, Question Options fixed in place; cascade chart reads bottom to top
- **DecisionShell:** a tool with levels always shows the level buttons, even a tab with only Level 1; the slot is as wide as the tool's most levels, and **Question Options** is always present (greyed when a question type has nothing to choose), so it sits in the same place on every tab and every Decision tool, as in ToolShell.
- **Cascade chart** rows now run from the bottom up: the critical row (or activity A) sits just above the time axis.

### 2026-10-17 — Critical Path Analysis: missing time off the critical path; changes recalculated box by box (dev-gated)
- **Missing time** has a new Question Option **Where is x**: On the critical path (the equation, as before), **Not on it** (find the largest x that keeps the minimum time: x ≤ latest finish − earliest start of the activity; the working finds the earliest start, then the latest finish, then the bound) or Either.
- **Delays and changes** now recalculates on the picture: the new duration, each earliest start that changes (left to right), each latest finish that changes (right to left), then the new floats and critical path. Boxes move one beat at a time instead of all appearing at once.
- Tests: x = bound keeps the minimum time and bound + 1 lengthens it (independent recomputation); at most one time moves per beat and the last beat equals the recalculated network.

### 2026-10-17 — Critical Path Analysis: A-level begins — course switch, Cascade chart, Level 3 passes (dev-gated)
- **AS | A-level course switch** (top row, as Network Flows): AS shows the nine network-skill tabs, A-level shows **Cascade chart** (more A-level tabs to follow).
- **Cascade (Gantt) chart** (`GanttView`, `cascadeData` in `cpa.ts`, `solveCascade`): the network with its times above, the chart below, built one beat at a time (critical activities, then each other activity with its float). Float is a dashed block after the bar (before it, for late starts). Options: critical activities **in sequence on one row** or **each on its own row**; **Blocks** or **Thin bars**. Three levels: 8–9 activities early, 10–12 early, 10–12 as late as possible.
- **Level 3 (10–12 activities)** for Forward pass and Full analysis (tabs now declare 1–3 levels each; the tool allows three).
- Tests: `cpaSkills.test.ts` re-derives every bar, float and row from an independent path listing.

### 2026-10-17 — Critical Path Analysis: the AS skill tabs (dev-gated)
- `critical-path` is now nine tabs, one skill each: network from a table, **table from a network**, forward pass, full analysis, float, **critical paths** (one path, then several), **missing time** (x from the critical path), **delays and changes** (a delay against the float, then a shortened critical activity) and **clock times** (finish and latest start as clock times).
- Levels are per tab: new `ShellSubTool.levels` in DecisionShell (a tab with one level hides the picker). Project size is now two levels (6–7, 8–9 activities); the generator still builds 10–12 for A-level exam questions later.
- New: `cpa.ts` kinds and `CpaExtra`, `cpaSolve.ts` working for each, `durLabels` and `tableDone` view states; tests `cpaSkills.test.ts` re-derive each answer independently (path listing, recomputing after the change, clock arithmetic).
- Not built yet: the A-level tabs (cascade chart, resource histogram, levelling, worker allocation, which to shorten) and the AS / A-level course switch.

### 2026-10-17 — Critical Path Analysis: exam research and dedicated-skill plan (docs only)
- `specs/exam/critical-path-analysis.md`: Exam Topic Report from the AS, A-level and legacy papers (38 CPA questions, part types, archetypes, examiner-report errors, exemplars).
- `specs/cpa-skill-tools.md`: 13 dedicated skill tabs (4 built) with levels and build order; 10 exam-style chains banked for later. No code changed.

### 2026-10-17 — Significant figures Lesson 2: rounding to significant figures (dev-gated lesson, two decks)
- **New lesson** *Rounding to significant figures* on Rounding → Significant Figures (burger menu → Lessons, Developing-tools mode): a Depth bridge ("decimal places or significant figures?"), teach → practise → (labelled number line once) → set at Level 1 (no zeros or trapped zeros), teach → practise → set → extend at Level 2 (leading or trailing), practise → set → extend at Level 3. `RoundingLessons.ts` (`rounding-sig-figs`); spec `specs/decks/sig-figs.md` now implemented for both lessons.
- **Two decks** (`RoundingSfTeach.ts`): *Rounding to significant figures* (4612, 4670 to 2 s.f., 46 to 1 s.f., 3.052 with a trapped zero as the last digit kept, 62.48 to 3 s.f.) and *Zeros when you round* (0.0472, 0.00836, 4.96 → 5.0, 0.0396 → 0.040, 46720 → 47000, 3480). Same explicit conventions as Lesson 1: before / after, a concrete "to 2 s.f." every time (no algebraic n), each rule worked on at least two numbers, real Depth checks, **Write this down** slides (the four rounding rules: find the last digit you keep, look at the next digit, deal with the rest, keep zeros at the end of a decimal).
- **New Teach scene `sfRound`** (`raw`, `sf`): count the significant figures (leading zeros greyed first), the last digit kept, the next digit that decides, the verdict (with the 9 carry), what happens to the rest (zeros before the point, removed after it), then the answer row with the same marks as the tool. Shared `roundToSf` (exact digit-string rounding) drives the answer row.
- **Nine new Depth items on the Significant Figures tab** that follow the zeros ladder (`RoundingSfDepth.ts`; the older sf items follow the "ideas" levels): the bridge, a trapped zero as the digit that goes up, a whole number of 2 s.f. being the same length (9960 → 10,000), leading zeros, placeholders, keeping a trailing zero, the range that rounds to 4600, a trapped-zero carry (30,061 to 3 s.f.), 0.045 versus 0.0450, and working back from 8.0.
- Tests: `src/tests/sigFigLessons.test.ts` now also checks, for every rounding slide, a caption per beat, the final answer against an independent digit-string rounding, the digit kept and the digit that decides, the 5-or-more verdict, plus every number in the new Depth items.

### 2026-10-17 — Significant figures Lesson 1: identifying significant figures (dev-gated lesson, two decks)
- **New lesson** *Identifying significant figures* on Rounding → Identify Sig. Figs (burger menu → Lessons, Developing-tools mode): teach → practise → set at Level 1 (no zeros or trapped zeros), teach → practise → set → extend at Level 2 (leading or trailing), practise → set → extend at Level 3 (all four). `RoundingLessons.ts`; spec `specs/decks/sig-figs.md` (Lesson 2, rounding to significant figures, is not built).
- **Two decks** (`RoundingSfTeach.ts`): *Where do significant figures start?* and *Zeros at the start and the end*. Explicit by design: one fixed wording of the rules, **before / after** (never left / right), concrete numbers (no algebraic n), a three-question routine for any zero (non-zero before me? non-zero after me? decimal point?), a hook for trailing zeros (12 cm versus 12.00 cm), real Depth checks by id, and a **Write this down** slide of the four rules.
- **New Teach scene `sigFigs`** (`mode: count | kinds | routine`): digit boxes labelled 1st, 2nd, 3rd…, the three kinds of zero named in turn with a key, or the routine asked of one zero with the digits before / after outlined.
- **Shared classification and boxes:** `src/shared/sigFigs.ts` (`classifySf`) and `SfBoxRow` now serve the tool and the decks. Marks everywhere: trapped zero = green underline, a trailing zero that counts (after a decimal point) = amber underline, leading and placeholder zeros grey; the tool's digit boxes got the amber underline and a one-line key.
- Tests: `src/tests/sigFigLessons.test.ts` (steps name real tabs, levels, options, decks, Depth items; a caption for every beat; every number a deck shows matches an independent counter; each routine slide asks exactly the questions its zero needs and reaches the right verdict).

### 2026-10-17 — Rounding: ends first, per-level column cap, Identify Sig. Figs, new Significant Figures levels
- **Rounding Level 2:** "Reveal ends & midpoint — Before the plot" adds whiteboard steps **Show Ends → Show Plot → Show Answer** (`_stagedReveal` may now be a list of labels; `qo.previewStage` counts the steps shown).
- **Level 3 worksheets** can use up to 4 columns: new `defaults.maxColumnsByLevel` in ToolShell (Rounding: `{ level3: 4 }`).
- **Route Inspection** shows the **sum of all the edges under the diagram** while the question is first shown (new optional `DecisionProblem.caption`, drawn under the picture by DecisionShell).
- **Partial Fractions** no longer opens with the working panel collapsed, which had scaled the question up to 3× on the whiteboard and in full screen (so it jumped in size against the worksheet).
- **New Rounding tab — Identify Sig. Figs** (`specs/rounding-identify-sf.md`): mark, name (1st/2nd/3rd) or count the significant figures; digit-box picture with every trapped zero underlined; text worksheets; own Depth bank (`RoundingSfIdDepth.ts`, 11 items).
- **Significant Figures re-levelled** (`specs/rounding-sf-levels.md`): both sig fig tabs share one **zeros ladder** — Level 1 none or trapped, Level 2 leading or trailing, Level 3 all four — chosen with a plain "Zeros" button set (one kind per question, even split). The number line is now an option at Levels 1–2 (Off by default / Labelled / Blank); Level 3 has none. Questions place the zero where it matters (trapped zero among the first n+1 digits; trailing zeros in the number or kept in the answer, e.g. 4.96 → 5.0). New "Numbers" option (whole numbers / decimals) on both tabs.
- Tests: answers for every level × zero kind are checked against an independent digit-string rounding (`src/tests/roundingOptions.test.ts`).

### 2026-10-17 — Landing page menu: View as, Developing tools
- The landing page's Developing tools button became a **burger menu** (top right) holding the Developing tools switch (still password-protected) and a new **View as: Auto | Mobile | Tablet | Desktop** setting that makes every tool treat this device as a phone, tablet or desktop (for previewing, or when a device guesses wrong; kept on the device, with an amber dot on the burger while anything is switched on). The shells, sandboxes and diagram split all read it through `useLayoutMode()`. A place for more settings later.

### 2026-10-17 — Tablet layout (both shells)
- Three layout modes from one hook (`useLayoutMode`, `src/shared/layoutMode.ts`): phone ≤640px, tablet 641–1180px (or a touch device up to 1400px, e.g. an iPad Pro landscape), laptop above. A tablet gets the phone's interaction model laid out landscape: the click-through start screens (wider), the fixed bottom bar with text labels (kept clear of the pen button) and the stepper in the same column; **ToolShell** keeps the Whiteboard on tablets (offered on the start screen, then the big-screen page for it), two-column worksheet cards, a wider Worked Example column; **DecisionShell** puts the picture beside the question and steps. Held upright, a tablet uses the phone's stacked arrangement with a dismissible "works best in landscape" note.

### 2026-10-17 — Audit fixes
- Five parallel audits (exam maths, layout, pins and print, code and docs, other new tools) found and fixed: the claim explanation wrongly said a pipe in the shown minimum cut was "not in a minimum cut"; the restricted-vertex working started from a flow that broke the cap (now builds up from nothing to the right answer); step controls clipped and the toolbar wrapping at 640–860px (the working now stacks below 1024px, controls tidied, actions stay right-aligned); the laptop height (STAGE_H minimum); the ink pen swallowing burger-menu print items; Critical Path float badges crossed by routed arrows; recent questions recording start-screen questions on phones; the recent / pinned menu appearing in exam Worksheet mode; LaTeX in recent labels; duplicate SVG marker ids on printed sheets; the print popup now opens at the click; generating a sheet is one question at a time with a message when fewer than asked can be made; the chooser's hidden tiles are out of the tab order; parts carry a typed `role` instead of the print code matching prompt wording. New tests: question keeper lists, restricted-vertex working. CLAUDE.md and the Decision shell plan now document the chooser, exam views, printing, keeper and layout.

### 2026-10-17 — Final flows are shown without the supersource / supersink
- Where a network needed a supersource / supersink to augment, the flows themselves (the exam answer figure for the augmentation part and its mark scheme / print, and the flow step of the working in both the exam and the Supersource / supersink skill) are drawn on the network as the question gave it, not on the one with S and T added. The augmenting steps (potentials, paths) still use the extended network.

### 2026-10-17 — Exam print: no supersource / supersink pre-drawn
- Where a question asks for a supersource / supersink to be added, none of its printed networks has one (the student adds it): the add-it part gets a blank network that is then reused for the potentials and augmenting paths (with a note saying so), and the augmentation part adds only the blank for the maximum flow. The mark scheme still shows the added arcs.

### 2026-10-17 — Exam worksheet: its own settings, preview, and the switch in the chooser
- Worksheet mode no longer shows the practice toolbar or uses the question on screen: like the other tools it has its own settings in the panel (Level, Question Options, Questions, then Generate / Show Answers / Print), and every question is newly generated.
- Click a generated question to open it in full (the network and its parts, answers and working as when practising), with previous / next question and Close.
- The Practice | Worksheet switch moved into the collapsible chooser at the top (beside the course and Skills / Exam style switches; the collapsed row shows it too). Phones keep it as tabs.

### 2026-10-17 — Exam worksheets work like the other tools' Worksheet mode
- Exam-style questions get **Practice | Worksheet** tabs (as Whiteboard / Worked Example / Worksheet elsewhere). Worksheet: set Questions (1–10), **Generate** (uses the level and options above), look at the questions on the page, **Show Answers**, and the green **Print** split button with Print Both / Questions / Answers. The burger-menu print item and dialog are gone. Both prints all question papers first, then all mark schemes.

### 2026-10-17 — Exam print: X questions, collated
- Burger menu → **Print exam questions (PDF)…** asks how many (1–10) and whether to include mark schemes. The question on screen plus X − 1 new ones with the same chain, level and options are generated, then printed as every question paper first and every mark scheme after (Question n of X on each). `examSetHtml` / `printExam(inputs, { schemes })` in `printExam.ts`.

### 2026-10-17 — Exam layout: context with the picture, two-way switch
- The context sentence (and marks / time) now sits above the network, so the right-hand side is all parts. The a / b / c tab pills are gone: a two-way switch **Show individually | Show all parts** replaces them, with "Part n of N" beside it (and "Show all answers" only in the Show all parts view); in the individual view Back / Show answer / Next stay fixed at the foot.

### 2026-10-17 — Exam print: one shared network for potentials and augmentation
- When a question asks for the potentials and then flow augmentation, they are worked on the SAME network (potentials crossed out and updated as the paths are used), so the paper gives one blank network with the potentials part (with a note saying so) and the augmentation part only adds a second blank one for the maximum flow. Augmentation without a potentials part (the supersource chain) still gets two (potentials and paths; maximum flow).

### 2026-10-17 — Exam print: two networks for flow augmentation
- The augmentation part now also asks the student to show the maximum flow on the network, and the printed paper gives two blank networks under its table: both blank (no capacities, no flows): one for the potentials and the augmenting paths, one for the maximum flow. The potentials part gets one blank copy too.

### 2026-10-17 — Exam questions: print to PDF, tidier header
- **Print to PDF:** the burger menu has "Print question and mark scheme (PDF)" on an exam question. Sheet 1 is the question paper: name / date, the network, each part with its marks and room to answer (ruled lines, a blank copy of the network under parts answered on it, an Augmenting path / Extra flow table for augmentation). Sheet 2 is the mark scheme: each answer (the filled-in network where it is drawn) and its B1 / M1 / A1 / E1 / R1 lines. `src/shared/decision/printExam.ts`; the shell renders the network pictures to SVG for it.
- **Header and Show answer:** the exam card is slimmer (title, marks and time, the context, part tabs and the One part / All parts switch; Show all answers at its top right). In the one-part view the Back · Show answer · Next bar is fixed at the foot of the parts.

### 2026-10-17 — Decision shell layout tidy-up
- The working area (picture + question + steps, or picture + exam parts) is now one laptop-screen tall (`STAGE_H` in `layout.ts`, about the height of a normal tool's question box) and both columns fill it, instead of a tall page with empty space. The page is narrower (1180px) like the other tools.
- The toolbar matches the normal shells: levels left, Question Options centre, pin + New Question right; the topic chooser card has the same padding and height.
- Step controls: one wide primary button (Show working / Next step / Show answer) beside Back, with the step count, dots and Show all on a row below, so the label no longer gets squeezed.
- Exam parts: the part strip and Back / Next stay fixed (the part scrolls between them); All parts is a scrolling list that collapses the context card to make room.

### 2026-10-17 — Exam style: the (?) plays the real working
- The (?) beside an exam answer now plays the step-by-step working exactly as Worked Example does (numbered steps, earlier ones dimmed, Back / Next; always stepped, no Show all), and the picture beside it follows each step (the augmenting path lights up, the potentials update, the cut line is drawn…). The steps come from the same solver as the skills tabs (`ExamPart.working`, built by `working()` in `flowExam.ts`), so exam and skills can't disagree. Parts with no matching skill (claims, which pipe to upgrade, the bound statements) keep their written explanation. Tests check each part's working ends at the model answer.

### 2026-10-17 — Exam style layout: one part at a time
- Exam questions show one part at a time under a card with the context (collapsible) and a strip of part tabs (a) (b) (c)…, with a tick on any part whose answer has been revealed, plus Back / Next. An **All parts** switch lists the whole question in a box that scrolls on a big screen (the page no longer grows). The picture is pinned in view on both desktop and phone, so it can no longer end up behind or far above the parts (it was pushed out of sight on the restricted-vertex / split-vertex part).

### 2026-10-17 — Recent and pinned questions (both shells)
- A **Recent & pinned questions** item in the burger menu that pops out a panel beside it (inline on a phone) (ToolShell and DecisionShell): **Recent questions** (the last 5 you moved on from, newest first, so an accidental New Question is one tap to undo) and **Pinned** (up to 5 you keep on purpose, with a Pin / Unpin this question button). The pin is also a button in the toolbar beside New Question (filled while the question is pinned; on phone it sits in the bottom bar). Picking one puts back the exact question (its level, tab and options too) without regenerating it. Memory only: gone on reload; not shown in Worksheet mode. `src/shared/questionKeeper.ts` (`useQuestionKeeper`), section in `MenuDropdown`.

### 2026-10-17 — Network Flows: one collapsible topic chooser
- The course / practice / topic rows are replaced by a single container at the top: collapsed it is one row (topic ▾), opened it expands in place into AS / A-level and Skills / Exam style filters and grouped topic tiles with a one-line description. Picking a tile generates a question and leaves the chooser open (only its header row collapses it); there are no previous / next arrows. The toolbar (level, Question Options, New Question) is unchanged and always visible; on phone the old click-through start screens (course → practice → topic) are kept.
- Network (capacity only / min and max) moved into Question Options. Opt-in for any Decision tool via `config.chooser` (`ShellChooser`, `ShellSubTool.blurb`); `src/shared/decision/TopicChooser.tsx`. Topic tiles carry mini diagrams (`ShellChooser.art`, `FlowTileArt.tsx`); the level descriptions moved from under the toolbar into the burger menu Info (the shell adds a "Levels" section from `levelLabels`).

### 2026-10-17 — Network Flows: exam format simplified, exam-sized networks
- Exam style questions: no tick boxes or self-marked score. Show answer reveals just the answer, with the marks it earns listed underneath; a **(?)** beside it opens the step-by-step explanation.
- Answers that can be drawn go on the diagram: the potentials part and the add-a-supersource/supersink parts reveal only the filled-in figure (the question gives the blank one), with no written blurb. Printing will reuse the blank figure.
- Level 3 exam questions use exam-sized 9–10 vertex networks (Pipeline, Double ladder, Hub; two-by-two and three-source supersource networks).

### 2026-10-17 — Network Flows: A-level exam-style questions
- The **Practice** switch (Skills / Exam style) now shows for A-level too. Three new chains: **Augment and prove** (potentials → flow augmentation from a given flow with an "Augmenting path / Extra flow" table → prove it maximal with a cut → comment on a claim about upgrading a pipe; at Level 3 on a capacity-only network a restricted vertex), **Supersink, augment and prove** (adds the supersource / supersink first, with lower and upper capacities on min/max networks) and **Lower capacities, claims and upgrades** (a cut with a backward arc, a claimed maximum flow above the cut, which one pipe to upgrade). 6–11 marks each.
- Every claim is decided by recomputing the maximum flow with the pipe raised; the upgrade question is only asked when exactly one pipe helps; the proof uses a minimum cut with several vertices on each side; claim parts always end in an explicit verdict (the examiners' commonest lost mark). Network sizes are the 6–7 and 8 vertex templates (AQA's largest are about 10 plus S/T).
- Fixed: the exam layout kept its open parts and ticks when a new question was generated; it now resets with each question.

### 2026-10-17 — Network Flows: AS exam-style questions
- New **Practice** switch under AS: **Skills** (the existing tabs) or **Exam style**. Exam style has four tabs: **Any exam question**, **Cuts and bounds**, **Flow in = flow out** and **Supersource / supersink**. Spec: `specs/flow-exam-questions.md`; measured against the supplied AQA question dataset (AS 7366/2D).
- Each question is one network (in a water / gas / oil / cooling-pipe context with units) and a chain of lettered parts with marks (4–6 marks): e.g. value of a named cut → write down a cut of a given value → deduce the bound on the maximum flow (weak inequality, theorem named). Reveal a part's **model answer**, then **tick each mark** of its mark scheme (B1 / M1 / A1 / E1 / R1); a running self-marked score and a suggested time are shown. The picture changes to show each part's own working (the cut, the solved arc, the added supersource arcs).
- Questions are generated, not banked: every number comes from the existing solver, and the tests recompute the cut values, bounds, conservation and minimum cut independently. Levels are network size (6–7 vertices, then 8); Level 3 supersource questions have several sources and sinks.
- Shell: a problem can carry `exam` data, which swaps in the new `ExamView` layout (phone included); sub-tool tabs and options can depend on several other options at once, and an option that becomes hidden returns to its default (so switching to A-level can never leave a hidden Exam style setting behind); `levelLabels` accepts a `default` entry.
- Not built yet: A-level exam chains, printable question and mark-scheme sheet.

### 2026-10-16 — Network Flows: two more AS question types, AS cuts forward-only
- New AS tab **Table of cuts**: a list of cuts is given (Level 1: every cut of the network, so the smallest is the maximum flow; Levels 2–3: six cuts, so the smallest is an upper bound: maximum flow ≤ it). Each is worked through one beat at a time, with a running table of the values.
- New AS tab **Max flow by inspection**: find the maximum flow by sending as much as possible along routes from S to T (the routes alone reach the maximum), then a cut of the same value is the reason; a possible flow is indicated on every arc.
- **AS cuts** (Cut values, Max flow = min cut and the two new tabs) add only the arcs from the S side to the T side. An arc coming back is not labelled or mentioned and nothing is deducted; the "Include a backward arc" option is now A-level only.
- Tests for all three behaviours.

### 2026-10-16 — Network Flows: checked against AQA
- A research note on the AQA specs confirms the split: AS 7366 is DC1–DC4 (interpret flows, value of a cut, max flow–min cut, supersources / supersinks); A-level 7367 adds DC5–DC7 (augmentation, upper and lower capacities, restricted nodes). That is the split built. Max flow = min cut now names the theorem and uses the weak inequality AQA mark schemes ask for. Recorded in `specs/flow-networks.md`, with two possible AS additions (max flow by inspection; a table of all cuts).

### 2026-10-16 — Network Flows: AS and A-level in one tool
- New top-row **Course** switch (AS / A-level, A-level by default). **AS** (capacity-only networks): Find a flow, Missing flow, Cut values, **Max flow = min cut** (new) and **Supersource / supersink** (AS version). **A-level** keeps everything else: Flow from potentials, Augment flow, Max flow & min cut by augmentation, Node capacities, Min and max networks, and the augmentation-based Supersource / supersink.
- **Max flow = min cut (AS):** a maximal flow is shown; find a cut whose capacity equals it (forward arcs full, backward arcs empty), so the flow is maximal. No potentials or augmentation.
- **Supersource / supersink (AS):** add the super vertices and give the capacity of each added arc; no flow shown.
- Shell: `ShellSubTool.when` and `ShellOption.when` show a tab or option only for certain values of another option; changing course moves you to the first tab still available (also on the phone start screens). Tests added for both new AS questions. Spec note in `specs/flow-networks.md`.

### 2026-10-15 — Rounding: printable blank number lines
- Burger menu → **Print blank number lines (A4)** (boxes under the ends and middle) or **…every mark** (a box under every mark): one A4 page of 18 empty number lines in two columns, no questions, for students to fill in. Same line geometry as the questions.
- Shell: ToolShell gains an optional `menuItems` prop, so any tool can add its own burger-menu items (printables and the like); the items are marked `data-trusted-click`, so printing works with the ink overlay on.

### 2026-10-14 — Critical Path Analysis: plain lines, no arrow list
- Arrows in the activity network are plain lines (no arrowheads); they always run left to right.
- "Network from a table" no longer ends with an answer line listing every arrow (it only repeated the picture); the working now ends on the completed network.

### 2026-10-14 — Critical Path Analysis: tidier networks, table that never scrolls
- Networks are drawn tidier: the generator keeps the tidiest of several acceptable networks (scored on crossings, arrows routed round the boxes and long steep diagonals), prefers arrows between neighbouring columns, and allows far fewer crossings (none at Levels 1–2; about 0.5 on average at Level 3, which keeps its one arrow that skips a column).
- "Network from a table": the exam-format table is the question and shrinks to fit (no scrollbar); once the network starts to appear it becomes the same table laid across the top, scaled to the width, so it stays visible without clipping or scrolling.

### 2026-10-14 — Critical Path Analysis: more than one critical path
- New Question Option **Critical paths** (Full analysis and Float): One (default), More than one (two or three), Either. A second critical path is made by adding a non-critical activity's float to its duration, so the minimum time is unchanged. Every critical path is highlighted and named in the working and the answer; the prompt asks for "every critical path" when the option is not One. Tested against the independent every-path reference for all three settings.

### 2026-10-14 — Critical Path Analysis (new Decision tool, dev-gated)
- New tool **Critical Path Analysis** (`/critical-path`, Decision Maths, `enabled: false`), activity on node with Start and End boxes: **Network from a table**, **Forward pass**, **Full analysis** (forward and backward pass, critical activities, critical path, minimum time) and **Float** (total float). Three levels by project size (6–7, 8–9, 10–12 activities); Numbers and Setting options. Spec: `specs/critical-path.md`.
- New `ActivityNodeView` (the exam box: earliest start | duration | latest finish; arrows routed round boxes when they skip a column; boxes fill in as the working goes; amber compared, blue current, green critical). Maths, layout and generator in `shared/decision/cpa.ts`, working in `cpaSolve.ts`. The shell gains a `noSandbox` option (the vertex-moving sandbox does not apply here).
- Every generated table lists immediate predecessors only, has a single critical path, and lays out with no arrow through a box. `src/tests/cpa.test.ts` reproduces the reference diagram (46 minutes, critical B–C–E) and checks every generated question against an independent list-every-path reference.
- On a phone the picture keeps a readable size and scrolls sideways, following the box being worked on.
- Out of scope for now: Gantt / cascade charts, resource histograms, dummy activities, free and independent float.

### 2026-10-14 — Partial Fractions: phone-readable working
- The substitution step ("Let x = 5/3…") was one long line that shrank to tiny text on a phone. It is now two steps: the substitution, then "Solve for A:". "Equate coefficients" is split the same way.
- Shared `FitWidth` (Worked Example maths lines) now clips only sideways, so tall fractions and big brackets are no longer shaved top and bottom.

### 2026-10-14 — Partial Fractions: Fractions guarantee, generator tidy
- A repeated monic factor, (x + a)², can only give whole constants, so Level 3 "Repeated (x + a)²" with Fractions used to quietly return whole numbers (after 1,500 wasted attempts). Fractions is now greyed (`requires`) on Level 3 Two fractions unless a form that can give fractions is on, and (x + a)² always uses whole numbers.
- Fractions mode now guarantees a fractional constant for every other form (it used to let about 1 in 60 cubic-denominator questions through with all-whole constants).
- Tidy: unbiased factor shuffle, dead code removed. New test generates every tab × level × form × constants × negative-x combination.

### 2026-10-13 — Lessons: structure notes, and Negative x off by default
- Partial Fractions "Negative x in numerator" now starts off.
- New `docs/design/LESSONS.md` records how lessons and lesson decks are structured and what the Indices pilot taught us (split at conceptual boundaries, levels isolated, Depth bridges, 16:9 slots, light full screen, checks after the model, peer pools as plain pills). `CLAUDE.md`, `docs/GLOSSARY.md`, `docs/PROJECTS.md`, `docs/BACKBENCH.md` and `specs/decks/indices.md` point to it.

### 2026-10-13 — Partial Fractions: tidy Question Options
- The Denominator, Shown as and Constants pools are plain pill rows (they are peer choices, not easy/hard pairs, so the None/Mixed/Exclusive cycle buttons were wrong and their long labels overlapped). Labels shortened ("Shown as", "Expanded", "Fractions", "Negative x in numerator").

### 2026-10-13 — A-level: expanded Whiteboard, no negative x in the numerator
- Factor Theorem and Partial Fractions open their Whiteboard with the working panel collapsed, so the question fills the width.
- Partial Fractions: new Question Option "Negative x terms in the numerator" (on by default). Off keeps every x coefficient of the displayed numerator positive; the constant term can still be negative. Tested on every tab and level.
- Teach: the reshuffled coefficient tiles also show the × between the last coefficient and the letters (multiply and power slides).

### 2026-10-13 — Teach: coefficient tiles reshuffle when multiplying
- In "Multiplying with coefficients" the two coefficient chips slide to the front (3 × 4) on the numbers beat, followed by all the x tiles, so the numbers sit together and the 7 copies of x are counted as one group. The power-of-a-bracket slide does the same: the boxes fade and the coefficients (2 × 2) slide to the front, followed by all six x tiles.

### 2026-10-13 — Indices: two lessons, negatives kept to the second
- Lesson 1 "Laws of indices (no negatives)": laws deck, practise, worksheet, then the coefficients deck, practise, worksheet and the 6x⁶ Depth extension. Lesson 2 "Zero and negative powers": the "what if the bottom is bigger?" Depth question, the negatives deck, practise, worksheet and two Depth extensions. The separate "Zero and negative powers (Level 1)" lesson was folded into lesson 2 (its Depth items are still in the bank).

### 2026-10-13 — Teach decks: lighter full screen, inline Depth buttons, no bracket spills
- Full screen now sits on a light backdrop instead of near-black. Feathers and Teacher notes moved into the Back / Full screen / Next row (the note opens as a pop-over above it), so the slide gets the freed height.
- `RichText` and `InlineMath` keep a bracket or punctuation mark glued to the maths beside it, so a line can no longer break after "(" or leave a lone ")".
- A hand-off from a deck (e.g. to the Worksheet) now moves a running lesson to its matching step, so the step bar stays in step. The opening "Repeated doubling" slide is shorter.

### 2026-10-13 — Indices: tidier QO menus and a calmer power-of-a-power slide
- Question Options: shorter labels, peer pools (Numbers / Letters, Two letters / Several numbers) are plain pills rather than None/Mixed/Exclusive cycle buttons, and the shared QO popover wraps pools with many or long options into a grid. Level 2 Index Laws no longer has a Base control (it always has a coefficient). The grid change also affects other tools with more than four or long options.
- Teach deck: the power-of-a-power scene drops the separate "letters: 3 + 3 + 3 + 3" line and the repeated-bracket chain; the bracket boxes show the copies and one line carries the indices and answer.

### 2026-10-13 — Teach decks: Depth checks now look like Depth
- The check questions inside a Teach deck were plain slides built from the Depth item. They are now a new `depth` slide kind that plays the real Depth stage (navy stage, speakers, lettered options, the owl with Feathers, misconceptions on the answer): the question on one press, the answer on the next. `DepthMode` gained an `embedded` mode (deck owns the slide and keys; no picker, Present or follow-on buttons). Feathers and Teacher notes stay under the slide.

### 2026-10-13 — Teach decks: no stray fades, one scale, no opening Depth check
- **Stray fades fixed.** Moving between two slides that use the same scene (multiply → multiply, divide → divide) reused the picture, so last slide's tiles and result line faded OUT on the new slide. Each slide now mounts fresh.
- **One scale.** Slide content is laid out at a single design width and scaled to the card, so type sizes and proportions are identical on every slide and every screen (a laptop gets a smaller slide, not a more cramped one; measured on a 1366×640 window: every slide within 0.86–1.0 of ideal, before it varied 0.5–1.0). The embedded slide is also taller (it uses the room under the header).
- **No Depth check at the start.** Nothing has been taught yet, so the opening checks are removed: the Laws deck opens on the hook and explanation; the coefficients deck's Mei check now follows the multiply slide.

### 2026-10-13 — Index Laws: levels no longer overlap; coefficients taught in the deck
- **Level isolation.** Level 1 never has a coefficient (numbers, or one plain letter). **Level 2 always has a coefficient** on one letter (3x² × 4x⁵, 12b⁷ ÷ 3b³, (2x³)², and multiply-then-divide). **Level 3** is two letters with coefficients (3a³b × 4a²b⁴, (2x²y³)³), the combined and missing-index types (which always carry coefficients), or several number bases. The old Level 2 plain-letter and two-letter-without-coefficient questions are gone, and the Level 3 single-letter coefficient questions that duplicated Level 2 are replaced. A test per level enforces it.
- Depth items that named the old options were reworked (12b⁷ ÷ 3b³ at Level 2; the two-letter explain moved to Level 3).
- **New Teach lesson "Laws of indices with coefficients"** (Index Laws tab) and a matching lesson in the burger menu: starts from the 3x² × 4x⁵ = 12x¹⁰ slip, then the two jobs (numbers do arithmetic, indices follow the laws), multiply, divide and (2x³)² with white number chips beside the x tiles, two Depth checks, a you-do, and hand-offs set to Level 2. The `indexExpand` scene gained `coefs`.
- Teach decks: card and Depth slide are confirmed the same box (measured at two screen sizes).

### 2026-10-13 — Teach decks: full screen no longer clips; Back / Next stay put
- Full screen lays the slide out at a fixed design width and scales it to the card on both axes, so it grows with the screen and no longer spills past the left and right edges.
- The slide area has one fixed height (the 16:9 card plus a strip for a Depth check's Feathers / Teacher notes), and the beat counter has a reserved slot, so Back, Full screen and Next sit in exactly the same place on every slide.

### 2026-10-13 — Indices: a power of a power taught as repeated multiplication
- The power-of-a-power slide now says what the power means: (x³)² is x³ × x³, and multiplying adds the indices, 3 + 3 = 6. A second slide does (x³)⁴ = x³ × x³ × x³ × x³, so 3 + 3 + 3 + 3 = 3 × 4 = 12: multiply the indices. The tile picture is the bracket written out that many times in a row, with × between, and the sum underneath.
- The Level 1 worked solution for a power of a power follows the same story (write the bracket n times, add the indices, adding m n times is m × n).

### 2026-10-13 — Teach decks: one shape, full screen, reached through lessons
- Every slide (card, scene, Depth check) is now the same 16:9 shape, with Back / Full screen / Next under it. The I do / We do / You do banners are gone.
- **Full screen** on every deck (overlay plus native fullscreen; content scales up). It ends by itself when the deck is left: a hand-off button, or the lesson's next step opens Whiteboard / Worksheet / Depth. In a lesson, the last slide's button reads "Next step" and moves the lesson on.
- Lesson decks no longer have a "Teach" tab in the header: they are reached through the lessons in the burger menu (the lesson step is labelled "Slides"). A tool with an old category deck (`teachingSlides`, e.g. Fractions) keeps its tab.
- Depth picker: card titles with maths ($a^2 \times a^3$) now render, and cards share a height with a footer line ("3 choices" / "Open question").

### 2026-10-13 — Teach decks: the Depth stage is the card
- A Depth check in a deck no longer sits as a navy stage inside a white card: the stage itself is the slide, sized to the deck's height, with Feathers / Teacher notes under it and the deck's Back / Next beneath.

### 2026-10-13 — Indices: no doubled instruction
- Removed the tab-wide "Simplify:" / "Work out or simplify:" / "Write, solve or work out:" from the Index Laws, Negative & Fractional and Common Base tabs. Every question already carries its own prompt, so the screen showed two ("Simplify:" above "Write as a single power:"). A test now checks no tab has an instruction and every question opens with its own prompt.

### 2026-10-13 — Partial Fractions: AQA A-level scope, fractional constants, (a − bx) factors
- Scoped to AQA A-level Mathematics (not Further): noted in the file, info modal and spec; no irreducible quadratics or cubed factors.
- New **Constants** option: Whole numbers or Fractions (A = 3/2, answered as 3/(2(x + 1))). In Fractions mode the numerator is chosen and the constants solved exactly; Level 1 whole, Level 2 both, Level 3 fractions.
- New **(a − bx)** factors (e.g. (1 − 2x), (3 − x)) at Level 2 and, optionally, repeated at Level 3, shown constant-first as an exam would.
- Test now covers whole and fractional constants for every form.

### 2026-10-13 — Indices: one lesson from the laws to negative powers
- The Index Laws lesson now runs in eight steps across two tabs: Teach (laws) → Practise → Set it → a Depth question, "what if the bottom power is bigger?" → Teach (zero and negative powers) → Practise → Set it → Extend. A lesson step can now name its own tab (`LessonStep.tool`), so a lesson can move from one topic to the next.
- New Teach lesson **Zero and negative powers** (Negative & Fractional tab): equal powers cancel to 1 → the open question x⁵ ÷ x⁸ with tiles → what a negative index means (true/false) → the halving pattern → 2³ ÷ 2⁵ with a prediction → you do → hand-off. New Depth item `indices-il-bottom-bigger`.

### 2026-10-13 — Indices: divide to a negative power
- Negative & Fractional gains **Divide to a negative power** (on at Levels 1–2, off at Level 3): x⁵ ÷ x⁸ = x⁻³ = 1/x³, for letters, numbers (2³ ÷ 2⁵ = 1/4) and with coefficients (Level 2). Working: subtract the indices, then a negative index means one over the positive index. Three Level 1 Depth items for it and a test.

### 2026-10-13 — Indices: multiply then divide
- Index Laws gains a **Multiply then divide** option, e.g. $\dfrac{x^3 \times x^5}{x^2}$ (letters, numbers, and with coefficients): add the indices on the top, then subtract the bottom's. Off by default at Level 1, on at Levels 2–3. Three Depth items (diagnose, explain, extend) for it, and a test for the answers.

### 2026-10-13 — Partial Fractions (new tool, dev-gated)
- New tool **Partial Fractions** (`/partial-fractions`, Pure Mathematics, `enabled: false`): Two fractions, Three fractions and Divide first (polynomial division to Q + R/q, then split R/q), Levels 1–3 each, with distinct, non-monic and repeated linear factors and an option to show the denominator expanded. Spec: `specs/partial-fractions.md`.
- Built from the answer (integer constants first), so every question is exact; working substitutes each root and equates coefficients for the one leftover constant. `src/tests/partialFractions.test.ts` checks the identity for every form at three levels.

### 2026-10-13 — Indices: Laws of indices Teach lesson
- New Teach **lesson** for the Index Laws tab (dev-gated): hook (repeated doubling) → check → what an index tells you → I do ×2 (x³ × x⁵ and 2³ × 2⁴) → we do divide (x⁸ ÷ x³) → we do power of a power (the class predicts) → the three laws → three checks → you do → hand-off buttons (Whiteboard / Worksheet / Depth, pre-set).
- Shared: new `indexExpand` Teach scene (factor tiles: multiply / divide / power / expand), `TeachLesson` + `teachingLessons` on ToolShell (menu lists the lessons on the current tab), `handoff` slide block (opens a pre-set Whiteboard / Worksheet / Depth in place), and a `teach` lesson-step kind (`deck=` in the link) so the Laws lesson now starts on the deck.
- Checks are built from the Depth bank by id (`checkSlide`), not copied. `src/tests/indicesTeach.test.ts` covers captions per beat, KaTeX, hand-offs and checks.

### 2026-10-13 — Route Inspection: non-triangle-inequality contexts
- New **Triangle inequality** option (Either / Obeys it / Breaks it) on the route tabs, working at every level: "Obeys" repairs weights so no edge is beaten by a detour; "Breaks" makes an edge joining two odd vertices slower than going round, and the cheapest pairing uses that detour; at least one is beaten (lengths switch to a time/cost context). Tests cover all three levels.
- Setting option gains **In context (times, costs)**: van and ferry journey times, rail and toll charges, where a direct edge can be slower or dearer than going round. The existing context is now labelled lengths. Prompts say "total time/cost"; answers carry minutes / pounds. Spec and info modal updated.

### 2026-10-13 — Route Inspection: working steps through each pairing
- With four odd vertices the worked solution now has one beat per pairing (AB + CD, then AC + BD, then AD + BC), each showing the shortest route and length of every pair with the routes lit on the network, then a "Cheapest pairing" beat comparing totals. Replaces the single beat listing every pair.

### 2026-10-12 — Indices tool and Lessons (first build)
- New tool **Indices** (`/indices`, dev-gated) from `specs/indices.md`: four sub-tools (Powers & Roots, Index Laws, Negative & Fractional, Common Base), Levels 1–3, Question Option pools weighted for the Smart Progressor, expanded working in the Level 1 examples.
- Depth bank `IndicesDepth.ts` (74 items, every tab × level has diagnose, explain and extend; one Start here per level).
- **Lessons** (new, shared): an ordered run of steps inside one tool (Depth, Whiteboard, Worked Example, Worksheet), listed in the burger menu under "Lessons". A step is a shareable-link setup, so no tool state is added. A step bar shows progress; the lesson stays in the URL (`lesson=`, `step=`). `src/shared/lessons.ts`, `ToolShell` (wrapper remounts the core per step), `MenuDropdown`.
- Powers & Roots: each question carries its own prompt (e.g. "Write as a power:", "Give your answer to 1 decimal place:") instead of one tab-wide instruction. Each level is now its own ladder: Level 1 one operation on small numbers; Level 2 larger numbers, roots to 20² and brackets; Level 3 fractions, decimals, three-term sums and calculator work.
- Audit of Index Laws, Negative & Fractional and Common Base: every question carries its own prompt; Index Laws Level 1 is one law on one base, Level 2 two letters or coefficients, Level 3 several bases in one product (numbers) and combined laws; Negative & Fractional Level 1 keeps to small whole-number and unit-fraction cases; Common Base Level 3 evaluates with fractional and negative indices, and Level 2 solves avoid x = 1.
- Route Inspection and Travelling Salesperson are dev-gated (`enabled: false` in the registry), so they show only in Developing-tools mode.
- Developing tools now asks for a password to turn on (`src/devAccess.ts`). It is a plain check to keep casual visitors out, not security. Turning it off stays free.
- The Teach tab is behind Developing-tools mode instead of the parked gate. Skills stay parked.
- Lessons are behind Developing-tools mode, like Teach: with the mode off there is no Lessons menu section, no lesson bar, and an open lesson closes.
- Two example lessons on Indices: laws of indices (Level 1) and zero and negative powers (Level 1).
- A lesson opens on its own overview screen: one clickable card per step. The step bar's title returns to the overview.
- Tests: `indices.test.ts` (generator invariants), `indicesLessons.test.ts` (every preset names a real option, item and level; URL round trip).

### 2026-10-11 (18) — Smart Progressor: generate extra, then pick evenly by band
- ToolShell worksheet generation (`calibratedBlock`): for a calibrated tool it generates a candidate pool (8× n, 60–400) and `spreadByBand` picks n spread evenly across the bands present, easy→hard, mingling within a band. Other tools keep the quota + sort path.
- New helper `spreadByBand` (shared) with tests; BIDMAS end-to-end check.

### 2026-10-11 (17) — Calibration becomes the standard Smart Progressor process
- New `src/shared/calibration.ts`: once a tool is happy, every **sub-tool × level** is sampled with 1500 questions across *random combinations of all its options* (`randomSetup`, `sampleCalibration`), cut into eight bands of about an eighth each (`quantileCuts`) and written to a committed `<Tool>.calibration.ts` table plus a markdown report (`calibrationReport`).
- Questions carry `_rawDifficulty` (scored from the question itself), `_category` (a fingerprint for the report) and `_difficultyScore` = its band from the table (`bandFromTable`). Worksheets sort by band as before; same-band questions mingle.
- BIDMAS is the pilot: bands are now per sub-tool (Evaluate, Fix-it) × level, replacing the hand-set per-level cuts. Report regenerated from 9,000 questions; new tests check the helpers, the tables, and a fresh 1000+ sample per cell.
- Process written into CLAUDE.md (Smart Progressor) and `docs/PROJECTS.md`.

### 2026-10-11 (16) — BIDMAS: questions ranked into eight bands, mingling within a band
- A worksheet is now ordered by **band 1–8**, not the fine score: every question's `_difficultyScore` is its band (`bandOf` / `difficultyBand`, cut points `BAND_CUTS` per level = the 12.5% … 87.5% quantiles of the level's calibration sample). Questions in the same band keep their random order (the sort is stable), but a band-8 question never comes before a band-1 one. Bands are relative to the level, so a Level 1 sheet runs 1–8 across its own questions.
- The calibration report gained the band table (cut points and the share of questions in each band) and a "Bands" column per category showing which bands its questions fall in (so you can see categories mingle). `orderDifficulty.test.ts` fails if a generator change lets a band fall under 5% or over 22% of a level's questions.

### 2026-10-11 (15) — BIDMAS: difficulty scored from the question, with a calibration report
- `_difficultyScore` is now `difficultyOf(ast)`: the summed cost of every calculation the line needs (a hard table fact costs more than an easy one, division a little more than the matching multiplication, a carry or exchange, a negative, a decimal, powers, roots) plus the cost of reading it (brackets, nesting, fraction bars) — replacing the option weights, which scored (11 × 9) − (12 × 7) as easier than 9 ÷ 3 + 2. Applied to Evaluate, Insert brackets and Spot the Mistake / Is it correct (which previously had no score at all, so their worksheets weren't ordered).
- `docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md`: generated from ~3,600 questions — the rubric, the spread by level and by option, and 321 categories (operation sequence · hardest recall · what makes the line awkward) from easiest to hardest. Regenerate with `CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts`. `orderDifficulty.test.ts` pins nine "this is harder than that" pairs, that each level is harder on average than the one below, and negatives / decimals harder than whole numbers.
- Option weights stay (they drive the even split of Focus / Numbers across a worksheet); only the sort uses the new score.

### 2026-10-11 (14) — BIDMAS Times tables: stretch up to × 5; selector runs most to least restricted
- The stretch product is now a two-digit number × 2, 3, 4 **or 5** (36 × 5 allowed). The Times tables selector now reads **Within 12 × 12 · 12 × 12 + stretch · Any numbers** (most restricted to least); Any numbers is still the default.

### 2026-10-11 (13) — BIDMAS: Numbers drawn as a plain multi-select, still weighted
- The Numbers option (whole / negatives / decimals) drew as a click-to-cycle button at Level 2 because both options carried a difficulty weight. New shared flag `plainDisplay` on a multiSelect (the opposite of `cycleDisplay`) draws a weighted 2-option pool as ordinary tick-boxes. BIDMAS Numbers keeps its weights (whole 1, negatives 2, decimals 3), so negatives still count as harder for the easy-to-hard worksheet order and the even split.

### 2026-10-11 (12) — BIDMAS: Times tables option (12 × 12 grid questions)
- New single-choice Question Option **Times tables** on both tabs (Evaluate, Spot the Mistake) at every level: **Any numbers** (default, as before) · **Within 12 × 12** · **12 × 12 + stretch**. Within 12 × 12: every × has both numbers ≤ 12; every ÷ is a fact from the grid (divisor and answer ≤ 12 — 144 ÷ 12 but not 96 ÷ 2); squares to 12², cubes to 4³ (and 2⁴, 3⁴, 2⁵), roots of the squares to 144; whole numbers only (Decimals greys out). Stretch adds a two-digit number × 2, 3, 4 or 5 (36 × 3) and asks for one in about half the questions.
- Implemented as a check on every × ÷ power and root the line performs (`evalNode`'s `log`, `ttVerdict`), applied to Evaluate, Insert brackets and Spot the Mistake — including the student's *wrong* working. Fixed a fallback that dropped the option when a draw failed. New `orderTimesTables.test.ts`. The Depth bank is unchanged. The printed grid is a separate resource.

### 2026-10-11 (11) — Factor Theorem is live
- Removed `enabled: false`: Factor Theorem now shows under **A-Level → Pure Mathematics** for everyone (Year 12 · (x − c) and Year 13 · (ax − b), long division with a Result-only option).

### 2026-10-11 (10) — Adding vertices: roomier layout; landing page by level (GCSE Maths / A-Level / Computer Science)
- **Split vertices (Node capacities):** the working used to squeeze the two halves into the vertex's old spot (±82 px), crowding arcs and labels. Now the first half stays put, the second half sits one **gap** to its right and everything further right moves along, so no existing arc is squeezed. The gap fits the new arc's labels (longer on min and max networks, where the pill is wider); the pill and circled flow sit at opposite ends of it. New `splitLayout.test.ts` checks split networks and the supersource / supersink network against the same no-clash measure as the templates (flow view spotless; potentials view tolerates a rare arrow brushing a reversed arc).
- **Landing page:** the subject tabs are now **GCSE Maths · A-Level · Computer Science** (registry default subject is `GCSE Maths`). A-Level holds **Pure Mathematics** (Factor Theorem — moved out of Algebra) and **Decision Mathematics** (MST, TSP, Route Inspection, Network Flows, Mixed Strategies, Network Sandbox).

### 2026-10-11 (9) — Supersource / supersink arcs are sums; min/max restricted vertices
- Replaced the "unlimited (∞)" arcs: a supersource / supersink arc now carries exactly what leaves the source (arrives at the sink), so its capacity is the **sum** of those arcs' capacities (8 + 6 = 14); on a min and max network it is **[Σ minimums, Σ maximums]**. (Not "min of the mins / max of the maxes": the flow into S₁ is the total leaving it, so the bounds add.)
- **Restricted vertices on a min and max network:** the split arc X₁X₂ is **[max(Σ minimums arriving, Σ minimums leaving), min(restriction, Σ maximums arriving, Σ maximums leaving)]** — again sums, not min / max of the arcs. The generator only restricts a vertex below what its arcs could carry. The working states the rule.
- Both Node capacities and Supersource / supersink now offer Capacity only / Min and max. Removed the ∞ display code and its test; new `superFlow.test.ts` checks the sums and the split bounds in both modes.

### 2026-10-11 (8) — Supersource / supersink: no supply or demand limit
- The question's several sources are **S₁, S₂…** and sinks **T₁, T₂…** with **no supply / demand tags or numbers**; the working adds supersource **S** / supersink **T** joined by arcs of **unlimited capacity, drawn ∞**. Potentials on those arcs also show ∞, and captions never print the large stand-in number. The "supply 8" key chip is gone; the generator re-checks that 1–3 / 1–4 augmentations remain once the limits are lifted. New `superFlow.test.ts`.
- AQA check (recorded in `specs/flow-networks.md`): a web search of the published content list surfaced supersources/supersinks, augmentation and arcs with upper and lower capacities but did **not** surface restricted vertex capacities. Harry has since confirmed restricted nodes **are** in AQA scope, so Node capacities is core, not an extension (the search result was incomplete).

### 2026-10-11 (7) — Glossary terms: solid underline, floating definition card
- Underlined terms in Decision-tool working are now a quiet solid underline (not dotted) with a soft highlight on hover. The definition opens as a **floating card** under the word (above it if there is no room): title, definition, arrow pointing at the word, clamped inside the screen, portalled so the scrolling working box never clips it. Hover on a mouse; tap on a phone; Esc, a tap elsewhere or scrolling closes it.

### 2026-10-11 (6) — Decision tools: shorter steps, definitions behind underlined terms
- Rewrote the worked-solution captions across **MST, TSP, Route Inspection, Network Flows and Mixed Strategies** to the new house style (≤ 12 words typical; never restate what the diagram, chips, badges or trail show). Roughly 60% fewer words: e.g. Kruskal `CE (3): add.` / `CD (8): C–E–D already joined → cycle. Reject.`; MST set notation ("pieces", "Tree: {…}") removed; Prim on a table is one beat per edge at Levels 2–3 (two at Level 1); TSP table lists only the entries that need a route; nearest neighbour `F → A (9)`; Route Inspection drops the repeated degree/odd-vertex/pairing lists; Flows augmentation is two beats per round (`SA 3 → 1, AD 6 → 4…`), final potentials and reinterpret-as-flows lists replaced by the diagram, node-capacity and supersource intros are one beat.
- New **glossary** (`src/shared/decision/glossary.tsx`): the definitions and reasons that used to sit in captions (cycle, minimum spanning tree, degree, odd vertex, Eulerian / semi-Eulerian, complete network, nearest neighbour, upper / lower bound, potential, flow-augmenting path, supersource / supersink, cut, maximal flow). The first time a term appears in a solution it is dotted-underlined; hover or press for the definition. The shell finds terms by pattern, so captions carry no markup. `glossary.test.ts` fails if a term is never used.
- `DecisionProblem.level` (MST sets it) so a solver can adapt; tests updated for the new beat shapes. House style recorded in `docs/architecture/DECISION_SHELL_PLAN.md`.

### 2026-10-11 (5) — Network Flows: E₁/E₂ split vertices, S₁/S₂ sources, roomier labels
- **Node capacities:** a restricted vertex split in two is now written **E₁** (takes the arcs arriving) and **E₂** (takes the arcs leaving), with subscript digits, in the diagram, the prompts and the working (new arc `E₁E₂`), instead of E and E′. `splitNodes` gains `inNode`.
- **Supersource / supersink:** the question's several sources are now labelled **S₁, S₂…** (top to bottom) and its sinks **T₁, T₂…**, so the **S** and **T** the working adds are distinct and identifiable; the working names the new arcs `S → S₁`.
- **Label room:** the layout was solved with space reserved for the potential arrows even though no view draws potentials beside the flow and bounds. `layoutNetwork` now takes which labels each arc draws this beat (`LabelUse`); with no potentials the flow circle and min/max pill move to a clearly roomier spot on the arc (and potential-only views ignore the pill). Cramped arcs (gap < 8px) on the Hexagon and Big network drop to none. `flowLayout.test.ts` checks each state with its own label set.

### 2026-10-11 (4) — Factor Theorem: merged with the Worked Example / phone branch; phone-friendly substitution
- Merged `ccr-d2950dee-0myw1h` (Worked Example pre-steps box, fullscreen bar, phone fixes, Ordering Numbers working) into this branch and checked the long division in the step-by-step Worked Example at desktop and phone width — no conflicts beyond `PATCH_NOTES.md`.
- Long substitution lines (Year 13 fractions, quartics) now split into "Substitute" and "Evaluate" steps so they stay readable on a phone; the long-division divisor no longer wraps.

### 2026-10-11 (3) — Factor Theorem: "Division working" option
- New Question Option (Whiteboard / Worked Example only): **Long division** (default, the paper layout) or **Result only** (skips the long division and shows just `f(x) = factor × quotient`) — the bottom and top grain of the polynomial-division technique. Switching it reformats the current question in place (same maths), via `reformatQuestion`.

### 2026-10-11 (2) — Polynomial long division representation
- New shared `ldStep` / `LongDivision` / `longDivisionStepRenderer` (`src/shared/longDivision.ts`, `components/LongDivision.tsx`): divisor left of a bracket, quotient above the bar, product rows underlined, remainder with the next term brought down, terms kept in power columns — as in the textbook's Worked Example 4.5. Supports non-monic divisors and `a`-parameter polynomials. Factor Theorem uses it for every divide step (cubic, quadratic, quartic's two-stage division). Tested in `src/tests/longDivision.test.ts`.

### 2026-10-11 (1) — Factor Theorem tool (Year 12 and Year 13)
- New `src/tools/Algebra/FactorTheorem.tsx` (`/factor-theorem`, `enabled: false` — dev-gated until reviewed). Two sub-tools: **Year 12 · (x − c)** (whole-number test values) and **Year 13 · (ax − b)** (fractional test values, e.g. `f(−1/2)`).
- Question types per level (Smart Progressor weighted pools): decide / factorise given a factor (L1); show + solve, find a factor by trial, unknown coefficient, two unknowns (L2, Y12) or show + solve, unknown coefficient (L2, Y13); only one real root (discriminant), exact surd answers, quartics, factor containing k (Y12) or a, two unknowns / trial (Y13) (L3).
- Worked solutions: set factor = 0, substitute (live-modelled fragments), divide, factorise, solve. Trial steps list ± (factor of constant ÷ factor of leading coefficient) in size order up to the first zero. Division is drawn as a paper-style long division (see the entry above) followed by a "So: f(x) = (factor)(quotient)" line.
- Generators build from the factor list, so the coefficients, roots and every unknown are derived from one source; internal checks throw on mismatch and `generateQuestion` retries.

### 2026-10-10 (31) — Phone action bar steady; Ordering Numbers working less repetitive

- Phone action bar: constant padding/border so the Show/Hide answer button no longer shifts 5px when toggled.
- Ordering Numbers working: compared numbers are shown to the same number of decimal places (0.92 > 0.90, not 0.92 > 0.9).
- When one column places several numbers, the comparison is stated once; later steps for that column read "Same column — 0.839 is the 2nd largest."
- A column whose digits differ but places nobody yet no longer claims "every number still matches": it says the digits are not all the same and shows the groups (−14 and −17 (1) < −8 and −5 (0)). Whole-number comparisons keep their place value (−10 vs 0, not −1 vs −0), and repeated prefixes are shown once.
- Phone: every new screen (start, topic, mode, sub-tool) opens scrolled to the top so the header bar is showing, and reloads no longer restore an old scroll position.
- Phone action bar: taller (4.1rem) so the Show/Hide answer row gets the same even padding as the Done button on the options sheet (it was squeezed to ~7px below the button).
- Worked Example fullscreen now uses the same top bar as the Whiteboard's fullscreen (level toggle, Question Options, New Question, Show/Hide Answer); Exit fullscreen moved into the question box's corner cluster after the text-size chevrons.
- Phone Worked Example: the Whiteboard's table button now sits in the question box's corner; it brings the steps' representation (place value table, BIDMAS pyramid…) up before the steps begin (off by default), and from the first step the steps' own picture takes over. Desktop unchanged.

### 2026-10-10 (30) — Phone worked example: Show All scrolls, steady bottom edge; Ordering Numbers explains each comparison

- Phone Worked Example, Show All: the working now sits in its own bounded box that scrolls, so every step can be reached (it had collapsed to a clipped strip).
- The page is returned to the top when switching Step-by-Step / Show All and the stepped footer no longer nudges the window on phone, so the answer card ends the same distance above the bottom bar in both views.
- Ordering Numbers: a step that places a number now states the comparison itself ("-0.6 is greater than -0.7, so -0.69 is the largest"), with a note that for negatives the smaller digit is the greater number, and "a positive number is always greater than a negative one" on the sign column.

### 2026-10-10 (29) — Page background lighter again
- `PAGE_BG` `#f5f6f9` → `#f8f9fb` (the original page colour; cards now stand out by border, shadow and inner-pane shadow rather than backdrop); recessed panes `#f9fafc` → `#fbfcfd`.

### 2026-10-10 (28) — Page background a little lighter
- `PAGE_BG` `#f0f2f6` → `#f5f6f9`; the recessed panes (`getStepBg`) `#f6f7fa` → `#f9fafc` so they stay a step lighter than the page.

### 2026-10-10 (27) — Question and working panes read as recessed wells
- The grey question / working panes were the same grey as the page behind the card. They are now lighter (`getStepBg` `#f6f7fa`) with a soft inner shadow that fades in from the edge (`shadow-pane` token in `tailwind.config.js`) on top of the `slate-300` border — the whiteboard question and working boxes, and the worked-example step cards and answer box.
### 2026-10-10 (26) — Stronger tool pills and mode tabs; Data Units scale starts on the relevant units
- Tool-tab pills (ToolShell and DecisionShell): inactive pills get a `slate-300` border, a small shadow and darker text; the active pill gets a matching border and shadow. Mode tabs: the rule under them is `slate-300` and inactive labels `slate-600`.
- Data Units: "Scale: only the relevant units" is now on by default (the whiteboard ladder shows just the units from start to target); switch it off to see every unit.
### 2026-10-10 (25) — Cards and panes defined by borders and shadow, on a light page
- The cards were too close to the page. Fix is definition, not a dark backdrop: page `PAGE_BG` (`#f0f2f6`, `shared/colors.ts`) is only a touch darker than before; card borders `slate-200` → `slate-300`; `shadow-card` / `shadow-lift` are stronger; the grey panes inside cards (whiteboard question and working boxes, worked-example step cards and answer box) now have a `slate-300` border. ToolShell, DecisionShell and CSShell; the landing page and standalone sandboxes are unchanged.

### 2026-10-10 (24) — Worked example: the answer is the same size as the working
- Measured every ToolShell tool on a phone and desktop: the answer's maths was 1.21× the step maths in the card layouts (AnswerDisplay's own sizing), smaller than the maths rows in the keep-working timelines, and different again in the Decision shell, so it varied tool to tool (16 / 16.8 / 19.4 / 20.3 px on a phone).
- Now one rule in `WorkedExampleSteps`: the answer is bold green at the size of the working it follows — card layouts use the card body size (the user's text-size chevrons no longer resize only the answer), keep-working timelines the maths size, caption-only timelines (and tStep-only tools) the caption size. `AnswerDisplay` takes `matchSteps` for this; Order of Operations' redundant answerRenderer was removed so it follows the rule. Decision shell answer line = step caption size (was +2px).
### 2026-10-10 (23) — Phone worked example fixes; Decision shell matches the phone shell
- **Boxed steps:** in the caption-timeline worked examples (Speed, Distance & Time etc.) a step the picture doesn't claim (e.g. "Write as hours and minutes") was drawn as a grey "Step 8" card among flat rows; it is now the same flat row, carrying its maths.
- **Ratio table: why the middle row.** `rStepSolve` adds a beat when a ÷ then × chain goes through a middle row — "18 doesn't scale to 63 by a whole number. 9 is a common factor of 18 and 63 (18 ÷ 2 = 9, 9 × 7 = 63), so use 9 as a stepping stone." (Skipped when start → end is already a whole-number step.)
- **Angle / geometry tools on a phone:** the question view now shows the prompt ("Find x") with the diagram small; tap to enlarge, tap to shrink; once the answer starts it sits in the small picture slot as before. (`diagramSplitQuestion`; tools whose drawing carries its own prompt show the diagram only.)
- **Decision tools on a phone** now follow the ToolShell phone Worked Example: the whole question (not a collapsed one-liner), the picture, then — after Show answer — the working in its own scrolling box with the question shrunk to two lines (tap for all) and the colour key folded away; the stepper (‹ step n of N, Step-by-Step ⇄ Show All, progress segments, ›) is fixed above a bottom bar of Options · Show/Hide answer · New question.
### 2026-10-10 (22) — Phone Back steps through the start screens
- On a phone, Back (swipe) now goes tool → mode screen → topic screen → landing page, instead of straight to the landing page. `ToolShell` mirrors the start-screen stage into history (one entry per screen); tapping a breadcrumb or ‹ unwinds the skipped entries. Shareable-link URL sync now keeps the history marker. Verified in a 390px browser (multi-topic tool). `DecisionShell` uses the same scheme (verified on Network Flows, MST, TSP, Route Inspection).

### 2026-10-10 (21) — Decision Maths and CS tools go live
- Un-gated (`enabled: false` removed): Minimum Spanning Tree, Travelling Salesperson, Route Inspection (Decision Maths); 1.1.2 CPU Performance, Data Units, Binary Counting (Computer Science). Mixed Strategies, Network Sandbox, Simplifying Ratios and Perimeter stay gated. Open before wider use: AQA wording of the TSP lower bound; real-phone check.

### 2026-10-10 (20) — Ratio regrouped
- Ratio group (Fractions of Amounts, Simplifying Ratios (dev), Fractions ↔ Ratios, Ratio Sharing) in teaching order; Proportion & rates unchanged.

### 2026-10-10 (19) — Geometry regrouped
- Angles group: Angles: Facts, Angles: Triangles, Angles: Quadrilaterals, Angles: Parallel Lines, Bearings. Shapes & measures: Perimeter (dev), Circle Properties.

### 2026-10-10 (18) — Algebra regrouped
- Algebra is now Expressions (Collecting Like Terms, Expanding Brackets, Surds), Solving equations (Linear Equations, Simultaneous: Elimination, Simultaneous: Substitution, Completing the Square, Iteration) and Graphs (Equations of Lines, moved from Geometry). Tile renamed Linear Equations.

### 2026-10-10 (17) — Names and Number regrouping
- Landing-page tool names condensed (e.g. Powers of 10, Fractions +/−, Equations of Lines, Binary Arithmetic).
- Number is now Number sense (Ordering Numbers, Powers of 10, Rounding, Estimation), Calculation (Integers +/−, Decimals +/−, Order of Operations) and Fractions, decimals & percentages. Surds moved to Algebra → Expressions. Ratio & Proportion unchanged.

### 2026-10-10 (16) — Phone breadcrumb
- The phone nav bar shows a tappable breadcrumb under the title (topic › mode › level in the maths tools; option › question type › level in the network tools). Each part reopens the start screen where it was chosen (level opens Options).

### 2026-10-10 (15) — Colour schemes dev-gated; contained phone working box
- The Colour Scheme picker (menu) only appears with Developing-tools mode on, and ToolShell / DecisionShell force the default scheme otherwise.
- Phone worked example: the card is a fixed-height container (viewport minus header and dock); the picture sits in its own box and the working scrolls inside a closed, bordered box. No fade, no page scroll.

### 2026-10-10 (14) — Phone auto-scroll
- Phone worked example: every step press scrolls the newest line of working into view just above the docked controls (page and the split-picture list), so the last step is never hidden; the first paint is left alone.

### 2026-10-10 (13) — One phone dock
- Phone worked example: the stepper and the action bar are one dock on a shared grid: row 1 ‹ step label + progress track ›, row 2 Options · Show/Hide answer · New (icon), side buttons in matching 56px columns.

### 2026-10-10 (12) — Stepper docked to the bottom bar
- Phone worked example: the step controls are a full-width strip fixed directly above the bottom action bar (the bar drops its own top rule while steps show), with a spacer and a soft fade so the working scrolls cleanly behind it.

### 2026-10-10 (11) — Phone hotbar and level selector
- Ink hotbar on a phone-width flat bar is two rows (tools + close above, colours spread beneath). `DifficultyToggle` gains `fullWidth` (equal thirds) for the option sheets; topic chips use 1px borders.

### 2026-10-10 (10) — Phone click-through start
- Phone (ToolShell): topic → mode screens before the tool; the tool page has no menus at the top, and Options (topic, mode, level, question options) is a button in the fixed bottom bar (also in Depth). A link with `mode`/`tool`/`level` skips the start.
- Phone (DecisionShell): the big either/or option and question type are click-through screens; the tool page keeps only New question + Options at the bottom.

### 2026-10-10 (9) — Slim phone header
- Phone (ToolShell and DecisionShell): the nav bar carries the tool title (Home as an icon), and the mode tabs and Options share one row (Options names the topic and level). Everything above the question is about 95px, down from about 320px.

### 2026-10-10 (8) — Teach deck restyled
- Slide card and category menu use `shadow-card`, 1px borders, a thinner colour accent, semibold type, a softer phase badge and 1px nav buttons; category menu rows carry a colour dot instead of a thick left bar. Slides, scenes and beats unchanged.

### 2026-10-10 (7) — Sandboxes restyled
- Algebra Tiles, Negative Counters, Parallel Lines Explorer, Grapher Lab, Visualiser and the Decision sandbox board: cooler background, `shadow-card` / `shadow-lift`, 1px slate borders and dividers. Boards, tiles and toolbars otherwise unchanged.

### 2026-10-10 (6) — Phone sizing
- Phone worked example: question text fixed at `text-xl` (no desktop size controls), step pictures (ratio table, place value, graphs) shrink to fit a 24dvh box, and a custom question diagram to a 34dvh box.

### 2026-10-10 (5) — Phone pen tab; style through the Generators and library pages
- Phone: the ink opener is a slim edge tab mid-screen on the right (no longer a round button over the step buttons).
- Generators, p-value, Skill Library and Technique Library: cooler background, smaller semibold titles, `shadow-card`, 1px borders.

### 2026-10-10 (4) — Container shadows, more surfaces
- `shadow-card` / `shadow-lift` tokens (tailwind.config.js); containers across ToolShell, DecisionShell, Depth, Worksheet builder and landing tiles use them. CSShell and the Systems Architecture page pick up the cooler background, smaller title and flat pill tabs.

### 2026-10-10 (3) — Calmer chrome across ToolShell and DecisionShell
- Cooler page background, softer cards (1px borders, light shadow), smaller semibold titles without divider rules, sub-tool pills and underline mode tabs, quieter Level / Options controls and top-tier segmented switch. CLAUDE.md gains a short "Visual direction" section.

### 2026-10-10 (2) — Phone options sheet, Depth audit, calmer landing page
- Phone Question Options (ToolShell and DecisionShell) are a full-screen sheet of card sections with a bottom Done; the settings chip now says Options; Decision tools get the same fixed bottom New question bar.
- Depth audit: Rounding's items tagged by tab (nearest / dp / sf) with +14 items so every tab keeps diagnose/explain/extend per level. Order of Operations filters by its Focus options (needs) by design, not by tab.
- Landing page: removed the jump-back and strand chips; flat grey tiles, quiet strand headings with a colour dot, search-first hero, two underline subject tabs, no background blobs.

### 2026-10-10 — Depth by sub-tool, phone overhaul, landing page
- Depth: `DepthItem.tool` may be an array; Speed/Distance/Time's general items are now tagged by the quantity they ask for (+7 items so every tab keeps diagnose/explain/extend at each level).
- Phone (ToolShell): tighter question text, fixed bottom action bar (New / Show answer; Generate / Show all on worksheets), step nav pinned above it, compact header; ink button lifted clear of the bar.
- Landing page: "Jump back in" (last tools opened, per device) and sticky strand chips.
- Not yet audited: Rounding's untagged Depth items against its tabs.

### 2026-10-09 (late, 6) — Layout: desktop mode, phone stage, landing page
- Desktop mode (≈980px): Decision tools use a two-column grid instead of flex-wrap (no more fully vertical layout); ToolShell worked-example split starts at `md`; control-bar buttons no longer wrap their labels.
- Phone Decision tools: the question (collapsed to one line) and the picture are pinned above the scrolling working; a Graph | Table switch shares the stage (automatically Table on steps that build it).
- Landing page: tool cards are compact title tiles with an (i) that opens the description; tighter hero.

### 2026-10-09 (late, 5) — Travelling Salesperson: table of least distances built from scratch, matrix promoted
- The table starts empty and is filled row by row; each entry says whether the direct edge or a shorter route is used, so students see the shortest distance is not always the direct edge. When the initial weights already obey the triangle inequality, one check beat replaces the build.
- The matrix sits directly under the question (desktop right column; after the graph on phones).

### 2026-10-09 (late, 4) — Travelling Salesperson: no pre-filled box, phone order, beaten edges tested
- **Table steps:** the "Entries to find" chip box is gone. From the second step it listed every missing entry WITH its answer before the steps reached them (and cluttered the panel); the table now shows what is missing (a blank, or the direct edge a shorter route will beat) and each step fills in one entry. Tests assert no entry's answer appears before its own step.
- **Joined but beaten:** tests check that every level can set a direct edge beaten by a shorter route (Level 1 complete networks, Level 2 with 'breaks', Level 3), that its own step reads "A–D has a direct edge of 37, but A–B–E–D = 33 is shorter", and that the table shows the direct edge before and the replacement after.
- **Phone order (Decision tools):** question, then the graph, then the working steps (then the table). The desktop two-column layout is unchanged.

### 2026-10-09 (late, 3) — Travelling Salesperson: work on the complete network, then interpret the route
- After the table of least distances is complete it is DRAWN as the complete network K (every pair joined, each weight the table entry, changed entries purple); nearest neighbour and the deleted-vertex lower bound run on that picture, where every leg is a single edge, instead of on the sparse original. For an upper bound the working ends by interpreting the tour as a real route in the original network (each leg replaced by its shortest route, drawn on the original). The table question ends by drawing the complete network too.
- Plumbing: `SolveStep.network` (a beat can draw its own network; `edgeStates` then refer to its edges), `DecisionProblem.complete` (a complete network keeps its own layout; a practical one is redrawn on the bank's K4–K6 layout), validate.ts checks each beat's edges against the network it draws, the sandbox shows such beats as drawn.

### 2026-10-09 (late, 2) — Travelling Salesperson: "Initial weights" option (holds / broken / either)
- Distance questions matter too, so a new QO decides whether the INITIAL network obeys the triangle inequality: **Holds** (no direct edge beaten by a route; in-context questions use distances; Level 3 then needs a table entry with a route of 3+ edges), **Broken** (at least one beaten direct edge at every level; in-context questions use journey times or costs), **Either** (default mix). Every question still builds the table of least distances first and solves the classical problem on it. Applies to all four question types.

### 2026-10-09 (late) — Travelling Salesperson: initial networks need not be metric; tours no longer just round the outside
- **Model (agreed):** EVERY question starts from an initial network with arbitrary weights — no triangle inequality imposed, and pairs may be unjoined. The first step is always the complete network of LEAST distances (a metric by construction); the classical problem is then solved on that table. (An interim "table taken as given" path was built and removed: it solved the classical problem on a non-metric table, which is not the method.)
- **Levels:** 1 — a complete network (K4–K6) whose weights need not satisfy the inequality: 0–3 entries are beaten by a route through other vertices and replaced; 2 — a practical network with at most one beaten direct edge; 3 — one to three beaten direct edges. In-context questions describe the weights as distances only when nothing is beaten; otherwise as journey times or costs.
- **Outside ring:** weights are different whole numbers NOT scaled to the drawing (every question says the diagram is not to scale); a nearest-neighbour tour that is just the outline of the drawing is rejected; 60% of upper-bound questions require a tour that is not already optimal. Before: outside-ring 50% (L2) / 33% (L3), upper bound already optimal ~72%.

### 2026-10-09 (end of day) — fullscreen worked example: sizes and the remaining audit fixes
- Fullscreen working text back to about page size; the representation column is wider (two-thirds) and the picture scales up to fill it (`ScaleToFit` moved to `shared/components/ScaleToFit.tsx`). Control bar is one row at every width (icons under 1100 px). Esc closes an open popover before leaving fullscreen (`usePopover`). Decision's fullscreen: controls clear of the pen, bigger diagram share, smaller working text. `RatioTable` arrows now survive an ancestor's scale.

### 2026-10-09 (later still) — Network Flows: supersource / supersink
- New **Supersource / supersink** tab: several sources (each with a supply) and/or several sinks (each with a demand) are drawn without S and T and tagged "supply c" / "demand c"; the working adds the supersource / supersink with arcs of those capacities, runs the max-flow working, and reads the answer back per source and sink. New dedicated templates (`SUPER_TEMPLATES`), `superParts` / `chooseSuper` / `solveSuper`, `FlowViewState.nodeTags`; "Sources and sinks" option (Any / sources / sinks / both).

### 2026-10-09 (later) — Node capacities and the Route Inspection tool
- **Network Flows → Node capacities** (new tab): a vertex with a maximum throughput is shown ringed and tagged "max c"; the working splits it into X → X′ joined by an arc of that capacity, then runs the usual max-flow working on the split network and ends on the cut through a split arc. `splitNodes` / `chooseNodeCaps` / `solveNodeCap`; `FlowViewState` gained `net`, `labelPos`, `nodeCaps`. The Capacity-only / Min-and-max row is hidden on this tab.
- **Route Inspection** (new Decision tool, dev-gated): Degrees & type, Closed route, Start and finish. Networks from the graph bank (`GRAPH_POLICY.routeInspection`); unique cheapest pairing; working ends with a real route (Hierholzer). Independent CI reference in `validate.ts`. Spec: `specs/route-inspection.md`.

### 2026-10-09 — Network Flows set-value flows & cut line, bigger ratio tables, worked-example fullscreen
- **Cut values** now draws the dashed cut on the question at every level (Level 3 used to give only the node sets).
- **Find a flow** on min/max networks can ask for a feasible flow *of a set value* ("find a flow of 12"): the minimums are met first, then the flow is topped up on routes with room. New "Flow to find" option (Either / Any feasible flow / A flow of a set value); capacity-only networks always ask for a value.
- **Ratio table** is larger everywhere (text, padding, arrows, operation labels) and takes a `scale` prop.
- **Worked Example fullscreen** — new on `ToolShell` (button beside the text-size chevrons; Esc exits). Redesigned later the same day after review: it is now simply the ordinary worked example filling the screen — question centred at the top, then the steps with the picture beside them for split tools (side-by-side from tablet width), Back / Next pinned at the foot clear of the pen button, ← / → / Space step, under a slim bar with level, Question Options, New Question, Show Answer and Exit. Tools see the normal worked-example render (`qo.fullscreen` is NOT set — that flag means the whiteboard's fullscreen). `WorkedExampleSteps` gained a `fullscreen` prop. See `docs/audits/WORKED_EXAMPLE_FULLSCREEN_AUDIT_2026-10-09.md`. `DecisionShell`'s fullscreen gained the same controls row, the distance matrix, larger question text and a scrolling working column.

### 2026-10-09 — Decision tools: graph bank, static questions, sandbox overlay

- **Graph bank** (`shared/decision/graphBank.ts`): ~25 hand-authored undirected graphs — the nine Network Flows shapes plus wheels, prism, cube, grids, triangle strip, chorded polygons, house and K4–K6 — with weight-label positions optimised once and baked, and an independent clearance test for every drawing (and every mirrored variant). Minimum Spanning Tree and Travelling Salesperson now draw from it (no more per-question random layouts); questions are also mirrored and re-lettered for variety. A tool can add shapes to the bank for its own content.
- **Questions are static.** Vertices can no longer be dragged and the picture can no longer be panned or zoomed in a question (`NetworkView` is a pure static renderer; the zoom pill is gone).
- **Sandbox overlay.** A **Sandbox** button on every Decision picture (and in fullscreen) opens the same drawing in an overlay at the current step — with its own Back / Next, draggable vertices (flow labels re-lay-out live), pan / zoom, table, weights and grid switches. Works for Network Flows too (circled flows, potentials and the cut line carry over).
- **Network Sandbox page** rebuilt on the same board: pick any bank graph, random graph, new weights, mirror, click a weight to edit, show the table. Matches the question drawings exactly.
- Shared pieces: `PanZoom`, `SandboxBoard` / `SandboxOverlay`, `CanvasExtras` on `renderCanvas`.
- **Which graph for which tool:** an explicit policy in the bank (`GRAPH_POLICY`) — MST gets planar 5–12 vertex graphs, TSP only K4–K6 / sparse 4–6, Network Flows keeps its own source→sink shapes — enforced by tests. Seven large graphs (9–12 vertices) added for MST; Level 3 is now 8–9 vertices; new **Network size → Very large (10–12)** option on Kruskal's and Prim's. Label positions are baked per mirror orientation.

### 2026-10-09 — Decision graph tools: audit, rebuild, Augment flow working

- **Minimum Spanning Tree** rebuilt (dev-gated): Kruskal's, Prim's on the network and Prim's on a table; three levels (graph size); procedural crossing-free networks with all-different weights; named cycles; numbered chosen edges; sorted-edge and candidate chip lists; Setting and Ask-for options.
- **Travelling Salesperson** rebuilt (dev-gated): nearest neighbour (one or two starts), deleted-vertex lower bound, both bounds with the interval, table of least distances. Complete networks use different weights and are not drawn to scale; vertex counts balanced.
- **Network Flows (live): Augment flow working** — potentials labelled once and read, not recalculated; after each path the potentials update (changed arcs listed) and the next path is found on them; two or three augmentations, ending with the new flow value. Max flow shares the same rounds. Other flow questions untouched.
- **Shell:** step boxes no longer clip (padding, newest step shown from its top, smaller question on short screens, wrapping); zoom pill never covers a vertex; matrix scrolls sideways; chips card (also in fullscreen); per-problem legend / matrix mode; per-sub-tool level labels.
- **Fix:** `generateRandomNetwork` could return a disconnected network (a spanning-tree edge refused by the degree cap).
- **CI:** independent references for Prim / Kruskal order, the deleted-vertex bound (exhaustive) and the optimal tour (permutations); brute-force spanning-tree test; hand-worked K5.
- Full audit, AQA check and next steps: `docs/audits/DECISION_TOOLS_AUDIT_2026-10-09.md`.

### 2026-10-08 — Network Flows goes live

- Removed `enabled: false` from the `network-flows` registry entry: the tool now shows on the landing page (Decision Mathematics) for everyone. Other Decision tools (TSP, network sandbox) keep their own gates.
- Agreed next build: supersource / supersink and restricted capacity at a node (Edexcel and AQA exam items); phone check on a real device.

### 2026-10-08 — Decision shell: phone layout borrowed from ToolShell

- At ≤640px `DecisionShell` now follows ToolShell's narrow pattern: compact header and title, ONE settings banner ("Augment flow · Min and max / Level 2") with a **Change** drawer holding the network type, question type, level and Question Options (instead of the two tab rows and the control bar), a full-width New Question button, and a shorter canvas and answer area. The diagram fits the width; fullscreen (two columns when the phone is turned sideways) gives the detail. Other Decision tools (MST / TSP / CPA) get the same declutter for free.

### 2026-10-08 — Network Flows: audit fixes (display, shell, help)

- **Display**: the circled flow grows to hold three- and four-digit numbers; the bounds pill, potential arrows and flow circle now also keep clear of *other* arcs' lines (so the crossing arcs in the big network stay readable); on a phone the diagram keeps a readable size and pans sideways inside its own box (or goes fullscreen) instead of shrinking to a few pixels.
- **Shell**: options hidden for the current sub-tool no longer reach the generator or the URL; if question generation fails the page offers a reload; arrow keys no longer step while the info box is open or while typing.
- **Wording**: Missing flow says which earlier-found arc makes the next one solvable; capacity-only cut working no longer talks about minimums; the Max flow question says "maximum flow" throughout.
- **Help and docs**: in-app help now covers the Numbers option, the Find-a-flow method, fullscreen and Show all; `PROJECTS.md`, the spec and `DECISION_SHELL_PLAN.md` brought up to date.

### 2026-10-08 — Network Flows: fullscreen, Show all, Max flow working

- **Fullscreen** now takes the whole working area — the network, the question, the working and the step controls (and the colour key) — not just the diagram, with larger working text. Esc or Exit leaves it.
- **Show all** is a true toggle: pressing it again in the same place returns to the step you were on (it used to throw you back to the question). The arrow keys no longer step while the info box is open or while typing.
- **Max flow working** lists every potential that changes after each augmentation (old → new), then shows the final potentials in full, then reads the flows off them arc by arc (flow = maximum − potential increase) before the cut.
- **Cut confirmation** that is just the source (or sink) alone is allowed again, but only about one question in five at Levels 2–3 (Level 1 networks are small enough that it still comes up).

### 2026-10-08 — Network Flows: Find a flow is now a real method; cut labels

- **Find a flow**: the answer is built the way a student would, route by route (`buildFlowByPaths`). Capacity-only: take the route with the most spare capacity, send as much as it carries but no more than still needed, repeat until the target value. Min and max: take the arc furthest below its minimum, route through it (preferring routes through other arcs still below their minimum), send what it needs, repeat until every arc meets its minimum. The working states the method and tracks "still needed" / "still below their minimum" after each route; questions the method cannot solve in 2–5 routes are not set.
- **Cut labels** (+max / −min) are now placed clear of every other label, vertex, arc and the dashed line itself, staying close to the crossing they belong to.

### 2026-10-08 — Network Flows: more networks, bigger numbers, logic check

- **More networks**: two new templates ("Zigzag" at Level 1, "Tower" at Level 3) and more optional/reversible arcs on Mini hub and Double hub — 9 layouts, about 320 distinct networks (230 with a reversed arc).
- **Numbers option** (Question Options → Numbers): Small (up to ~20), Tens (10 to 200) or Hundreds (100 to 2000). Every capacity, minimum and flow is multiplied, so the maths is identical; the diagram is stretched left-to-right (×1.35 / ×1.45) so four-digit labels have room.
- **Label layout**: `layoutNetwork` now places every arc's labels together (an arc re-solves with its neighbours' labels as obstacles, and the bounds pill may slide), and `flowLayout.test.ts` checks every variant at all three number sizes.
- **Logic check** (`flowLogic.test.ts`, every sub-tool × level × mode × scale): the commodity is conserved at every inner vertex, nothing enters S or leaves T, whole numbers within bounds, no fixed `[k, k]` arc, value out of S = value into T, max flow = brute-force min cut, cut answers = brute force, and no stray un-scaled number in a prompt or working caption. It found one real bug: the Augment prompt said "three" paths when there were four.

### 2026-10-08 — Network Flows: audit fixes (layout, depth, variety)

- **Layout**: one shared geometry module (`flowGeometry.ts`) places every pill, flow circle and potential arrow; `flowLayout.test.ts` checks *every* variant of every template (each optional-arc subset × 0–2 reversed arcs, worst-case two-digit numbers, all label states) for overlaps and for labels nearer another arc than their own.
- **Depth**: Augment flow lists 2–3 paths (up to 4 at Level 3) with differing increases; Max flow runs up to 5 augmentations at Level 3, mostly by 2 or more, with an interior minimum cut.
- **Missing flow**: solved at vertices of degree 3+, an interior arc at Levels 2–3, chained pairs more common as networks grow; min/max arcs are no longer fixed `[k, k]`.
- **Variety**: new "Mini hub" (Level 1) and "Double hub" (Level 3) templates; capacity-only networks occasionally leave an arc unused so a potential decrease of 0 appears.

### 2026-10-08 — Network Flows: first build (Decision Maths, dev-gated)

- **`/network-flows`** (registry `enabled: false`): Potentials, Cut values, Augment flow, and Max flow & min cut,
  on capacity-only or min/max networks, Levels 1–3, each with a step-by-step worked solution.
- **Five network styles** from the textbook shapes — Diamond, Fan, Ladder, Hexagon and the big 8-node network
  (two declared crossing pairs; up to two arcs reversed at Level 3).
- **Maths in one place:** `src/shared/decision/flow.ts` (potentials, labelling, augmenting paths, max flow, cuts);
  questions are built flow-first (`flowGenerate.ts`) so a feasible flow always exists.
- **`FlowView`:** circled flow beside the arc, two small potential arrows (along / against) like the textbook, green
  augmenting path with dashed backward steps, shaded S side, red ticks and a dotted cut line.
- **`DecisionShell`** gained sub-tool tabs, Question Options (Capacity only / Min and max), a custom canvas and a canvas footer.
- CI: `src/tests/flow.test.ts` asserts the spec's reference numbers (flow 15 → 22 via SADET 2, SBCET 2, SBCFT 3;
  second network max flow 20; cut values 26, 28, 35) and sweeps every template × level × sub-tool × mode against a
  brute-force minimum cut.
- **Layout pass (same day):** every arc of all five templates has an explicit, hand-mapped position for its bounds label,
  circled flow and potential arrows; while augmenting, the flows and min/max labels are hidden (potentials + path only) and
  restored in a final "reinterpret" beat; `?tpl=<id>` pins a template for checking layouts.
- **Initial flow sub-tool (same day):** "Given paths" (take 3 along SABCT, 5 along SAT… write the flow on every arc) and
  "Find a flow" (any feasible flow on a min/max network, or a flow of value V on a capacity-only one). Many answers are
  valid, so the answer is one valid flow and `isFeasibleFlow` is the checker; the working builds the flow path by path
  (amounts add on shared arcs), then checks every vertex balances and every arc is within its bounds.
  `DecisionShell` options can now be limited to certain sub-tool tabs.
- **Visibility pass (same day):** the cut is now a smooth **dashed line** (`cutCurve.ts` — traced from the geometry, so it
  works for any cut, even one that loops round a node; the red ticks sit exactly where it crosses each cut arc). The
  Solution sidebar is now a **fading cascade** (earlier steps stay on screen, dimmed; the current step is highlighted),
  keeps the question on screen, and shows the final answer in its own card — for every Decision tool. Diagram labels are
  slightly larger.
- **One continuous cut line:** a cut is only ever set (and a minimum cut only ever drawn) when it can be shown as a single
  unbroken dashed line that crosses every cut arc exactly once and no other arc; the generator filters on this, CI asserts it
  for every cut question and every minimum cut.
- **Initial flow variety:** the question's paths are now chosen first (not recovered from a random flow), so routes through the
  cross arcs (SABT, SBCT, SABCT…) appear as often as the direct ones; Levels 2–3 always include one, Level 1 usually. The
  capacity-only "find a flow of value V" answer is the flow the question was built around, no longer a shortest-path build
  (which only ever used SAT, SBT, SCT).
- **Cuts and augmenting paths (same day):** the red ticks on the cut arcs are gone (the dashed line, shaded S side and the
  +max / −min labels remain). **Augment flow** now asks for ALL the flow-augmenting paths — always two or three (Level 1
  forward-only, Level 3 includes one with a backward step) — and the working finds each path and its bottleneck in turn, then
  lists them together (noting when they share arcs, so they cannot all be used at full amount at once).
- **New shell + levels by size (same day):** `DecisionShell` is rebuilt on the standard tool shell's page — nav bar, title, tool
  tabs, **Whiteboard / Worked Example** modes, a control bar (level toggle, Question Options popover, New Question, Show
  Answer or Back / Next / Show all), the menu with Info and Copy link, and the setup mirrored in the URL. The graph gets the
  width (a sticky large canvas in Worked Example, fullscreen on request); there is no worksheet or print mode for these tools.
  **Network Flows levels are now graph size** (1 = 4–5 vertices, 2 = 6–7, 3 = 8); Capacity only / Min and max is chosen only by the
  selector (default capacity only, kept when the level changes), as are Arcs (some reversed), Cuts (forward arcs only), Paths
  (include a backward step) and the Initial flow question style. Networks vary per question: optional arcs (the Fan's rungs, the
  Ladder's diagonal, the Big network's cross arcs) and a **hexagon hub** where any of S, A, B can feed the centre vertex and it can
  feed D, E, T (hundreds of networks); every arc has hand-mapped label positions.
- **One worked model (later the same day):** the Decision shell has no Whiteboard / Show Answer any more — every question is
  worked through (graph + fading steps, Back / Next / Show all), because every question of this complexity needs its steps.
  In the Potentials working an arc that shows its potentials drops its flow circle and min/max label (they swap arc by arc).
  Min/max questions now use real minimums: every arc carries flow and at most about one arc in seven has a minimum of 0.
- **Question, then Answer (later the same day):** every Decision question opens as the question alone (the network as given)
  with an empty **Answer** section and a "Show working" button; the working then builds up one step at a time like the other
  tools' worked examples — each new step fades in, earlier steps stay at half strength on a numbered timeline in a scrolling
  box that follows the newest step and fades out at the top — and the answer arrives last as a green "A" line. Controls: Back /
  Next / Show all ⇄ Step by step, a dot strip (question · steps · answer), arrow keys. The page header was tightened so the graph
  sits higher.
- **Controls at the foot; arrows either side (same day):** the step controls (◀ back · "Step n of N" · Show all ⇄ Step by step ·
  next ▶ · the dot strip) moved out of the question control bar to the foot of the Answer section, whose working area has a fixed
  height so they never move; the control bar keeps only level, Question Options and New Question. On the diagram the two
  potential arrows now sit on either side of the arc — the forward one beside it, the backward one on the opposite side.
- **Two tiers (same day):** Capacity only ⇄ Min and max is now the **top tier** (big either/or tabs above everything), with the
  question styles beneath it — Flow from paths, Find a flow, Potentials, Cut values, Augment flow, Max flow & min cut (Initial
  flow's two styles are separate tabs now). It is no longer in Question Options, which keeps only the small dials (Arcs, Cuts,
  Paths). `ShellOption.top` puts any option in the top tier.
- **Reverse is part of every question (same day):** the Arcs / Cuts / Paths options are gone — every network now has at least one arc
  pointing back against the flow (reversed rungs, hub arcs, cross arcs), every cut question includes an arc coming back across the
  cut, and every augment / max-flow question uses a backward step. Question Options is now just the top-tier Network switch. Cut
  labels sit on the opposite side of the arc from the flow circle.
- **Tabs reworked (same day):** dropped **Flow from paths**; added **Missing flow** (one or two arcs show "?" — find each with flow in =
  flow out at a vertex that has just one unknown; every missing arc is findable in order); reversed the potentials question to
  **Flow from potentials** (the arrows and bounds are shown, not the flows — each arc swaps to its flow as it is read off, then the
  flow value). Tabs now: Find a flow · Missing flow · Flow from potentials · Augment flow · Cut values · Max flow & min cut.
- **Wording and options (same day):** the potentials are now called **potential increase** (maximum − flow, along the arrow) and
  **potential decrease** (flow − minimum, against it) everywhere. A backward arc in a cut and a backward step in the paths are no
  longer forced into every question — they are Question Options ("Include a backward arc" on Cut values; "Include a backward step"
  on Augment flow and Max flow) — but every network still has at least one reversed arc so they can occur (they do in roughly
  35–85 % of questions anyway). Augment flow lists **every** flow-augmenting path, backward steps included.
- Phone width checked (stacks, no sideways scroll; the graph is sticky only on wide screens). Still to do: Harry's-notes update.

### 2026-10-07 — Notes and docs sweep: cast documented

- New `docs/design/CAST.md` (the eight named characters, Feathers, rules); linked from the `CLAUDE.md` documentation map.
- `DEPTH_SPEC_TEMPLATE.md` now names the cast for speakers and covers Feathers `prompt` / `takeaway` and the pyramid switch.
- `docs/PROJECTS.md` Depth section notes the cast and Feathers.
- Harry's notes refreshed: Characters, Build Log, Features, Prongs, Different From & Additional To Tool Shell (re-verified by search), Representations, Tool Index, and the Order of Operations, Speed Distance & Time and Rounding pages.

### 2026-10-07 — Depth: switch the BIDMAS pyramid off

Items that show the BIDMAS pyramid now have a **Scaffold → BIDMAS pyramid** switch in the slide's side rail (same place and style as the number line's switches). It starts **on**, applies to both the question and answer slides, and is kept between questions. Depth only.

### 2026-10-07 — Depth: Feathers talks

The owl now speaks on every Depth slide, in a bubble beside him at the foot of the slide (and beside him under the slide on a phone): a **nudge to the class on the question slide** ("Decide who you agree with, then say why.") and a **takeaway on the answer slide** ("Same row of the pyramid means equal priority: start from the left."). Every item gets a default from its shape (tap-the-line, who-is-right, multiple choice, explain, extend) via `feathersLine`, and an item may override with its own `prompt` / `takeaway` (eight Order of Operations items carry hand-written takeaways). A **Feathers** button under the slide switches the bubbles off per device. Depth only for now. Tests: every item has a short line and every authored one renders.

### 2026-10-07 — Depth: the cast is named; the owl is Feathers

The eight characters have names — **Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal** — and the owl is **Feathers** (`CAST_NAMES`, `MASCOT_NAME`). Every speaker in the Order of Operations, Rounding and Speed, Distance & Time banks now uses one of these names (no more one-off Jack / Zoe / Dev…), so a name always draws its own face (`assignCast` matches cast names directly). Cross-references between items were updated, and lines that used he/she for a named speaker were reworded to avoid pronouns. New speaker names should come from the cast; glossary updated.

### 2026-10-07 — Depth: a cast of eight, drawn like the owl (then made more natural and detailed)

*Braid:* removed — that character now has plain long straight hair with a side parting.

*Fixes:* the fringe was drawn lower than the top of the head, so a pale crescent of skin showed above the hair (everyone looked bald-ish) — every hairstyle now covers the crown; and the open-mouth tongue poked out below the mouth — it is now clipped inside it.

*Follow-up:* the cast is now plainer and richer — natural hair and colours only (no spiky or bright hair, no headband or earrings), muted tops with their own details (crew neck, polo collar and buttons, hoodie with drawstrings, cardigan over a tee, stripes), strand lines and sheen on the hair, ears, a nose with bridge light, lips, soft chin shadow and, on some, lashes, freckles or thin glasses.

The Depth speakers are now a **cast of eight** (`CAST` in `DepthArt.tsx`) in the owl's style: bust-length figures with soft gradients on skin, hair and clothes, big shiny eyes (white, iris, pupil, two highlights), blush, a gradient shirt with collar and a ground shadow. Each has their own hair (long wavy, fade, bob, messy, afro puff, spiky, braid with headband, curls), and some freckles, glasses or earrings. A speaker's name picks one of the eight and keeps it, and two speakers on one slide never share a face (`assignCast`). `Avatar` now takes `member` instead of `index`/`name`.

### 2026-10-07 — Order of Operations: no repeated lines in the working

Each Worked Example step is now **one line** — the sum as it stands, with the move underlined (and the left-to-right arrow over a run) — and an arrow down to the next step's line, or to the Answer. Previously every step also wrote its result, which was then repeated as the next step's first line and again as the Answer.

### 2026-10-07 — Depth: friendlier people; two overlapping Order of Operations items cut

**Depth speakers redrawn** (`Avatar` in `DepthArt.tsx`): head-and-shoulders in a round "profile picture" with a pastel backdrop, six skin tones, seven hair colours, six hairstyles (short, side fringe, long, curly, bun, pigtails), a shirt, brows, nose, cheeks, three smiles and optional glasses. A character is now keyed by **name**, so Ayla (or Ben, Zoe…) looks the same on every slide in every tool. **Order of Operations bank (now 32):** cut *Reading the pyramid* and *Sana's subtraction* (the add-first Explain items overlapped Zoe's and Tia's); routes re-pointed.

### 2026-10-07 — Order of Operations: working written like a board; pyramid says "&"

**Worked Example** now follows how it is written on a board: the line with the move **underlined** (not boxed), an **arrow down** to the next line with the rest of the sum pulled down, and — when two or more equal-priority operations are left in a row — a **left-to-right arrow over that run** (`3 + 5 × 2 − 9` → underline `5 × 2` → `3 + 10 − 9` with the arrow over it → `13 − 9` → `4`). The second line fades in on the next press. A lone × or ÷ gets no arrow; a `× ÷` run inside a longer sum gets the arrow over just that run. Engine: `Hl.arrows` + `stepFlat` runs; renderer `oooStepRenderer`. Shell: `stepRenderer` now receives the fragment `reveal` index as a 4th argument (documented in `CLAUDE.md`). **Pyramid:** the equal-priority tiles read `D ÷ & M ×` / `A + & S −` (was "="). Checked in the live app; tests assert the exact lines.

### 2026-10-07 — Order of Operations: the pyramid stops implying an order; six Depth items on "add first"

From a Y9 class: students did **add before subtract** (BIDMAS letters read as a list) and read the pyramid's left-to-right *across a tier* as an order of working (A is left of S, so add first). Two fixes. (1) **The BIDMAS pyramid** (shared `BidmasPyramid`): D M and A S are no longer split in half by a vertical rule; each is now **one tile** reading `D ÷ = M ×` / `A + = S −` with the caption "equal priority: left to right in the question"; when a step is being worked its operation is underlined. (2) **Six new Level 1 Depth items** (bank now 34): *Reading the pyramid*, *BIDMAS says A then S* (Ayla vs Ben), *Zoe and the pyramid*, *Spot the error* (`30 − 12 + 5 → 13`), *The sign stays with its number* (`20 − 8 + 3 = 20 + (−8) + 3`), and *Add first: always, sometimes or never?*. Numbers asserted in `orderOfOperations.test.ts`; spec `specs/depth/order-of-operations.md` updated.

### 2026-10-07 — Order of Operations: Focus follows the ticked operations

Unticking an operation now greys out the Level 1 Focus options it makes impossible: untick × and ÷ (or + and −) and *× ÷ before + −* and *Both* grey out (struck through, with a "Needs × or ÷ and + or −" tooltip) while *Left to right* stays; tick them again and they come back as they were. New shared, opt-in mechanism: a multiSelect option's `requires` (shape of `DepthItem.needs`), rendered by the QO popover, with `unmetRequires` / `maskUnmetOptions` helpers the generator uses so a greyed option is never drawn. Documented in `CLAUDE.md`.

### 2026-10-07 — Order of Operations: choose the operations

New **Operations** Question Option on Evaluate (all levels): tick which of + − × ÷ can appear. Left to right with only × ÷ gives 24 ÷ 4 × 2 style lines, with only + − gives 20 − 8 + 3; × ÷ before + − can be limited to, say, × and +. A fraction bar counts as ÷. All four on by default (nothing changes); if the ticked operations can't make the chosen Focus another ticked Focus is used, and only then is the restriction dropped. Spot the Mistake is unchanged (its questions are built around named mistakes). Tests in `orderOfOperations.test.ts`.

### 2026-10-07 — Speed, Distance & Time: the ratio table starts with what we know

The worked example's ratio table no longer arrives with its rows complete. New shared helper `rStepSolve` (`src/shared/ratioTable.ts`): the known values go in first with the unknown cell as a grey "?" (5 mph for 6 hours starts as 5 | 1 over ? | 6), then one press each for *how do we get from 1 to 6?* (the arrow on the time side only), *do the same to the miles* (the arrow on the other side), and the calculation filling the blank (5 × 6 = 30, the new cell highlighted). Multi-step Level 3 chains repeat the three presses per row. Used by all three sub-tools (a find-the-time question drives from the distance side). `RatioTableData` gains `opSides` and `fresh`; `rStepBuild` is unchanged for other tools. Tested in `src/tests/ratioTableSolve.test.ts`.

### 2026-10-07 — Speed, Distance & Time: Depth bank

32 curated diagnose / explain / extend items (`SpeedDistanceTimeDepth.ts`, spec `specs/depth/speed-distance-time.md`), levelled by idea — *Which calculation?* · *Minutes and hours* · *Awkward times & averages* — and live on all four tabs. The tool already had its fourth **Mixed** sub-tool (random Speed / Distance / Time), so the bank covers it with its own items ("Which question fits?", "Does the rule always work?", "One journey, three questions") alongside the shared ones; Speed, Distance and Time each get tab-specific diagnose items. Misconceptions covered include multiplying/dividing the wrong way, 30 min as 0.30 h, 1 h 20 as 1.2 h, 1.75 h as 1 h 75 min, and averaging two speeds. Numbers asserted in `src/tests/speedDistanceTimeDepth.test.ts`.

### 2026-10-06 — Ink overlay and the Rounding Depth bank go live

Both pieces built on this branch are now **ungated**: the **ink overlay** (write anywhere on any tool page — pen, eraser with part / whole-line modes, thickness and size menus, undo, a movable hotbar that docks to the side edges; see the entries below) and the **Rounding Depth bank** (25 items with the number-line scaffold). The overlay is mounted once in `App.tsx` (every tool page; not the landing page or the two sandboxes, which have their own board) and the bank is passed straight to `ToolShell`. Convention added to `CLAUDE.md`: a control that needs a genuine click (a popup — Print) carries `data-trusted-click`.

### 2026-10-06 — Ink overlay: write anywhere on a tool page (built dev-gated)

A transparent layer over every tool page (`src/shared/components/InkOverlay.tsx`, mounted once in `App.tsx`; **Developing-tools mode only**; not on the landing page or the two sandboxes, which have their own board). A pencil button opens a hotbar: **Freeze** (page live, ink stays) · **Pen** · **Eraser** · Undo · Clear · colours. In Draw, a **drag inks** and a **short still tap is forwarded** to the element underneath (pointer/mouse/click events), a long still press draws a dot, and a stylus always inks. Forwarded taps are synthetic, so anything needing a real click is marked `data-trusted-click` (currently the Print buttons): tapping it freezes the layer with "Frozen — tap again". The hotbar is **movable**: drag the grip — docked against a side edge it turns vertical (default: right edge, middle; flat along the bottom on a phone), anywhere else it lies flat; the position is remembered (`mt-ink-hotbar`) and a double-click on the grip resets it. **Pen and eraser options:** four pen thicknesses (stored per stroke) and three eraser sizes (a ring shows the size at the pointer). The options live in small **flyout menus** that open perpendicular to the bar (a column above/below a flat bar, a row to the side of a vertical one) when you tap the already-active Pen or Eraser — a corner tick marks the buttons that have one — so the hotbar itself never changes size or placement; the eraser works in **Part** mode (rubs out just the bit it passes over, splitting a line) or **Whole line** mode (deletes the entire continuous line it touches, measured to the line segments so fast strokes are caught); choices are remembered (`mt-ink-prefs`). **Performance:** the stroke being drawn is one `<path>` written straight to the DOM once a frame (coalesced pointer events for fidelity, near-duplicate points dropped), committed strokes are memoised, the eraser ring is moved without React state, and erasers return the same array when nothing was hit — main-thread work per pointer move fell from ~1.6 ms (3.0 ms with 150 strokes) to ~0.3 ms regardless of how much ink is on screen, and an eraser sweep over empty space from 3.4 ms to 0.3 ms. **Undo** is now a real history (strokes, erase gestures and Clear each undo as one step; Ctrl/Cmd+Z). The snap zone is tight (28 px) and the edge you are about to dock to lights up while dragging; a plain click on the grip leaves the dock alone, and the drop uses the release position (not a render-lagged state). Ink is stored in screen (viewport) coordinates, like a screen-annotation tool — it stays put when the page re-lays out (the Whiteboard fullscreen changes page height and scroll, which made page-anchored ink slide), clears on route change and is hidden when printing. Tested in `src/tests/inkOverlay.test.ts` and headlessly (gating, drag, tap-forward, freeze, hint, erase, fullscreen).

### 2026-10-06 — Depth: no scrollbars, optional number line, new owl

Depth slides never scroll: the panel content is now fit-scaled (`FitBox` in `DepthMode.tsx`) to the 16:9 panel at every screen size. A tool-drawn picture (`visual.type: "custom"`) is now a scaffold with two separate switches in the slide's side rail — **Number line** and **Plot the point** (the second needs the first) — both off to begin with and kept between questions; the answer slide always shows the fully plotted picture. The owl mascot is redrawn (gradient body, feather chest, tufts, brows, talons).

### 2026-10-05 — Rounding: Depth bank (dev-gated)

25 curated diagnose / explain / extend items on **Rounding** (`RoundingDepth.ts`, spec `specs/depth/rounding.md`), levelled by idea — *Which way?* · *Which digit decides?* · *Edge cases & accuracy* — and shown on every tab, with d.p. / s.f.-specific items scoped by `tool` + `needs`. Includes the "round the digit but keep everything else" misconception (31.04 → 30.04). **Dev-gated:** the bank only appears with Developing-tools mode on. Level 1–2 items draw a number line through a new generic `visual: { type: "custom", render }` hook in the shared Depth mode (`RoundingDepthLine.ts` is the line). Numbers asserted in `src/tests/roundingDepth.test.ts`. Not built: letting the tool itself generate decimals under a whole-number target (see the spec's follow-ups).

### 2026-10-05 — Order of Operations and Depth go live; landing-page grouping
- **Un-gated:** Order of Operations no longer carries `enabled: false`, and the Depth mode no longer needs Developing-tools mode — it shows for any tool that passes `depthItems`.
- **Landing-page grouping:** the lone "Order of operations" group (which could never hold a second tool) is replaced by a broader **"Operations & calculation"** group holding Adding & Subtracting Integers and Order of Operations, with room for the rest of the four operations (multiplication/division methods, negatives, powers) to join it. Same fix as the Functional Skills catch-all: a group should name a strand of the scheme of work, not one tool.

### 2026-10-05 — Depth: filling the thin spots
- Audited every Question Option on its own (each sub-tool × level × option, other pools at default) for how many Depth items stay available. Several settings had no Explain or Extend item at all (Left to right, ×-first, +-first, Brackets, Powers, −3² as 9, Nested brackets).
- Seven new items (bank is now 28): Sana's subtraction and Samuel's division (L1 explain), Matilda's brackets and Amir's negative (L2 explain), two L2 always/sometimes/never items (`2a² = (2a)²`, `−n²` is negative), Lena's nested brackets (L3 explain). Worked numbers are asserted in `orderOfOperations.test.ts`.
- New guard in `depth.test.ts`: no single Question Option may leave fewer than 3 items, or only diagnose items, for any tab and level. Every setting now has at least 3 items and a non-diagnose one.

### 2026-10-05 — Depth follows the Question Options
- Depth now shows the same Question Options control as the other modes and reads the same state, so what is ticked in Whiteboard / Worked Example / Worksheet is what Depth sees.
- New optional `needs` on a Depth item (clauses that must all hold; each an option value or an array of which one must be on). Items whose needs aren't met are greyed out in the picker with what they need ("Needs Focus: Roots") and listed after the available ones; purpose counts count only what's available.
- Only items at the current level are filtered; the Start here check and cross-level follow-up links are never blocked. A clause naming no option offered on the current sub-tool/level is skipped, so one list serves Evaluate's focus families and Spot the Mistake's mistake types.
- Order of Operations bank: all items except "make your own" and "how many answers" now carry `needs` (e.g. root questions need Roots, `−3²` also needs Negatives).
- New shared `depthUnmet` helper; tests check every named option exists at the item's level, that default options still leave diagnose + explain + extend at every level on every tab, and the clause logic.

### 2026-10-05 — Order of Operations: Spot the Mistake fits its question box
- Spot the Mistake used the default worded display, so every line was set at full size and overflowed the whiteboard box. It now has its own `questionRenderer`: a small lead-in, ONE aligned block of working (every `=` lines up), a small ask line, and the answer (plus "they …" note) appended on the whiteboard.
- Questions carry a `_fix` block (`intro`, `mathTex`, `ask`, `answerTex`, `note`) next to the existing `lines`, so print/worksheet text is unchanged. The maths scales down (never up) to the width it is given using CSS `zoom`, so long root/fraction lines shrink instead of clipping.
- Evaluate questions fall through to the standard display. Test added: every generated fixIt question has renderable KaTeX in `_fix`.
- Checked: all 45 questions per level fit the box with the answer shown at 1280 and 1024 wide; no horizontal overflow at phone width in whiteboard, worked example and worksheet.

### 2026-10-05 — Depth slides redesigned: two slides, designed not app-like, voting removed
- A Depth question is now **two slides** — question, then answer (← / → / Space or a Question | Answer switch) — instead of progressive builds.
- Designed like a classroom slide (after the White Rose examples, not copying them): navy (site blue) 16:9 stage, left rail (DEPTH wordmark, level + purpose pills, owl), left-aligned white panel with a purpose-coloured top bar (restyled away from the White Rose look), **cartoon speakers with speech bubbles**, big type, and an original owl **mascot** (question mark / tick). New `DepthArt.tsx` (SVG `Avatar`, `Mascot`, `Badge`).
- **Voting removed** (+ / − tallies and the "In the room" line). Tap-the-wrong-line working and the corner pyramid stay.
- **Present fixed**: it is now a full-screen overlay that works in every browser (it used to rely on the element-fullscreen API alone, which fails silently on Safari / iPad / embedded views), with native fullscreen added where available; Esc leaves. The stage reserves room for the controls so nothing is cropped.
- In-browser audit: all 21 questions fit their stage on both slides at 1280 and 1024 wide.

### 2026-10-05 — BIDMAS pyramid moved into the question
- Whiteboard: the pyramid is now a small scaffold pinned to the **top-left of the working box** (new shared `workingScaffold` placement `"workingCorner"`, `cornerWidth`), instead of filling the box, which stays free to write in. (`"question"` placement now also works without a `questionRenderer`.) `ToolShell` now renders a question-placed scaffold with the default question display too (it used to need a `questionRenderer`).
- Worked Example: the picture beside the steps is smaller.
- Depth slide: the pyramid sits small in the corner of the question section (visible from the start, lit once the answer is revealed) instead of in the reasoning band.

### 2026-10-05 — Depth questions become interactive 16:9 slides
- A Depth question is now a **slide**: a fixed 16:9 stage that scales with its width (phones keep a flowing column), a title bar with level and purpose, and a **Present** (fullscreen) button.
- **Builds like PowerPoint**: `→` / `Space` / Next steps through question → answer → one reasoning line per press; `←` goes back; Show all / Hide answer.
- **Interactive**: speech bubbles for "Jack says…"; tap the line of working you think is wrong (the answer marks the first mistake and dims what follows); **class votes** under each choice with percentages and an **"In the room"** line naming the most common misconception; the BIDMAS pyramid beside the reasoning (e.g. A and S lit together for `20 − 8 + 3`). Teacher notes moved behind a toggle so a projected slide never shows them.
- BIDMAS bank upgraded to use them (speakers on the Jack/Jo, Matthew, Priya, Kofi, Elena, Jamal, Ana items; tappable working; pyramid on 6 items).
- Fix: opening `?mode=depth&item=<id>` without a level now adopts the item's level (it used to fall back to the picker).
- Tests: bank test covers speakers / working / visuals; an in-browser audit confirmed all 21 slides fit their stage at 1280 and 1024 wide. 542 tests pass; build clean.

### 2026-10-05 — Depth: curated diagnose / explain / extend questions (pilot on Order of Operations)
- New ToolShell mode **Depth** (`depthItems` prop; `src/shared/depth.ts`, `src/shared/components/DepthMode.tsx`): a bank of fixed, hand-written questions picked by purpose (Diagnose · Explain · Extend) and level, instead of a pre-planned deck. Two beats per item (question → answer + reasoning), named misconceptions on every wrong option, adaptive "class secure / not secure" links (can cross levels), a cross-level **Start here** quick check, deep links (`?mode=depth&level=2&item=<id>`), phone layout. Dev-gated (Developing-tools mode) while piloted.
- Pilot bank: 21 items on Order of Operations (`OrderOfOperationsDepth.ts`) — 7 per level, covering the Matthew/Jack/Jo "who is right" style, the student-working error, `−3²` vs `(−3)²`, `√(9+16)`, the fraction bar, always/sometimes/never, and build-your-own.
- `src/tests/depth.test.ts` validates any bank (ids, one correct option per multiple choice, a misconception for every wrong option, links resolve, every purpose at every level, one Start here per level, every `$…$` renders); `orderOfOperations.test.ts` asserts every number the bank states.
- Docs: CLAUDE.md "Depth" section, `DEPTH_SPEC_TEMPLATE.md`, glossary, PROJECTS prong. 541 tests pass; build clean.

### 2026-10-05 — Order of Operations rebuilt around ideas; BIDMAS pyramid
- **Levels are now ideas, each building on the one below** (spec: `specs/order-of-operations.md`): L1 *Who goes first?* (× ÷ before + −, left to right) · L2 *Things that jump the queue* (brackets, powers; a bracket may contain a Level 1 line) · L3 *Symbols that act as brackets* (roots, fraction bar, nested brackets). `levelOf` rejects any draw that isn't its level, so a harder idea never appears lower and levels never overlap. Tests assert it.
- Selectors cut from an 8-way row to **Focus** (3 options per level) and a separate **Numbers** choice (L2–3, default Whole). Mistakes and tasks align to the levels; Insert brackets starts at Level 2. Sub-tool 2 renamed "Spot the Mistake".
- New mistakes at Level 3: root of part only, fraction bar not a bracket (`flattenGroups`).
- **New shared `BidmasPyramid`** (B ( ) / I ² ³ / D ÷ | M × / A + | S −): a whiteboard scaffold, and in the Worked Example the picture beside the steps, lighting the tier in use (equal-priority partner softly). Steps carry `extra.pyramid`.
- 530 tests pass; build clean.

### 2026-10-05 — BIDMAS checked against worksheets; Decimal Add/Sub Level 3 d.p. is a max
- Order of Operations: students' working is now shown line by line in Spot the mistake (reproduces the worksheet's 9 + 4 × 3 + 2 → 13 × 3 + 2 → 39 + 2 → 41); new **Is it correct?** task ("Matthew says … Is Matthew correct?"); extra shapes from the worksheets (a² + b × c², 7 × (8 ÷ 4)², (a + b)³, √s + b², …) and longer insert-brackets lines (3–5 terms, ÷, occasional 1).
- **Bug fix:** Insert brackets dropped an operator when the brackets were not at the end of the line (e.g. `(3² + 6) − 71`). The test now strips the brackets back out and compares with the original line.
- Decimals Add/Sub Level 3: "Decimal places" is now a single-choice **Max decimal places** (with an info icon) — the longest number has up to that many d.p.

### 2026-10-05 — Decimal Add/Sub: exchanges at Level 2, decimal places at Level 3
- Level 2: new **Carries needed** (Adding) / **Exchanges needed** (Subtracting) pool — 1, 2 or 3+ — one drawn per question and weighted so the Smart Progressor orders a worksheet 1 → 3+. 3+ subtraction uses wholes up to 999 and shows the hundreds column.
- Level 3 (both sub-tools): a **Decimal places** pool now applies (made a max in the entry above).
- `compute` now returns the carry and exchange counts; `src/tests/decimalAddSub.test.ts` checks both pools.

### 2026-10-05 — Order of Operations (BIDMAS): new tool, dev-gated
- New ToolShell tool `src/tools/Number/OrderOfOperations.tsx` (Number → "Order of operations", `enabled: false`; brief: `specs/order-of-operations.md`). It grows the Functional Skills generator's BIDMAS skill into whiteboard / worked example / worksheet with negatives, decimals, squares and cubes, square roots, fraction bars and nested brackets.
- Two sub-tools: **Evaluate**, and **Brackets & Mistakes** (insert one pair of brackets to make a statement true, or find a student's BIDMAS mistake — six mistake types by level).
- Worked example rewrites the line one stage at a time and boxes the part being done (amber `\colorbox`), labelled by stage ("Indices:", "Divide (left to right):", "Brackets — add:"). Roots and fraction bars act as brackets; same-priority chains go one operation per step so left-to-right is visible.
- One small expression engine (tree + BIDMAS stepper + straight evaluator) produces the working, the answer and the generator's validity checks, so they cannot drift. Content is two weighted pools (Question Types × Numbers) per level, so the Smart Progressor orders a sheet easy to hard.
- `src/tests/orderOfOperations.test.ts`: the brief's reference examples line by line, stepper vs evaluator across every family × number mode, mistake answers differ from the right ones, inserted brackets are unique. Build clean; 476 tests pass.

### 2026-10-04 — The answer as its own step (inline chains)
- A final step written as an inline chain ending in a result ("x = 180° − 146°" · "= 34°") used to turn the whole step green with the answer tucked on the end. It now splits into two steps: the working, then the answer as a step of its own, labelled "Answer:" — numbered, green dot, large bold green maths ("x = 34°"). New shared helper `splitAnswerStep(steps)` (src/shared/helpers.ts) does the split from the chain's own left-hand side; `withDiagramSteps` applies it automatically, so every diagram tool gets it, and the picture reveals the answer on that answer step (not a step early). Answer steps (the last step when `hideAnswerStep` is set) are drawn larger and green in the split timeline.
- Other split tools can adopt it with one call on their working; a general automatic version for non-diagram tools is the obvious follow-up.

### 2026-10-04 — Angles in Triangles: real solving steps (via the techniques engine); bigger, centred maths
- The working is now authored the way the techniques engine writes it: a labelled reason step with its equation centred and large ("Angles in a triangle add up to 180°" → x + x + 58° = 180°), then the solving as explicit moves from `solveLinearEquationSteps` at full grain ("Subtract 58° from both sides", "Divide both sides by 2"). Covers Level 1, isosceles (apex- and base-given), both split-triangle variants and the exterior-angle questions; ∠D₁/∠D₂ and the interior angle are solved the same way, so they are solved steps in the picture as well as the working. When the techniques prong lands (grain toggle, more techniques) these steps are already in the right shape — change `GRAIN` or swap a block.
- `solveLinearEquationSteps` gained an optional `unit` (LaTeX suffix for the constants, e.g. `^\circ`), with plain-text step titles (°). Also fixed a pre-existing slip: its two fragments per move repeated the left-hand side and ran together ("2x = 180 − 582x = 122"); they now chain ("2x = 180° − 58° = 122°") — improves the dev-mode linear solve in `NonLinearSimEq` too.
- Keep-working rows (all split tools): maths one size larger (text-3xl; 2xl on a phone).
- Angle labels: when several labels crowd one vertex the best-separated spot is used; 0 overlaps across 50 Level 3 questions checked.

### 2026-10-04 — Split worked example: one look; diagrams show what the working finds
- The two split flavours now share one look: the keep-working steps (geometry tools, Equations of Lines, the simultaneous equations tools, Mixed Strategies) lost their grey backing cards and sit as flat numbered rows on the same spine as the caption timeline, each still carrying its own label and maths; the answer is the same green "A" line. Earlier steps still fade back.
- Angles in Triangles diagrams now show values the working finds, once it finds them: the interior angle at the exterior vertex (step 2), ∠D in the split triangles (both the first ∠D and the straight-line partner), and the second equal base angle in isosceles questions — drawn in green so "found" reads differently from "given". Mechanism: `_step` (the step index) is on each step's picture copy alongside `_focus`; angles carry `appearsAt` / `showAtStep`. Labels on a shared vertex no longer overlap (collision-avoiding label placement).

### 2026-10-04 — Instruction lines no longer lost when a tool has a custom renderer
- ToolShell suppressed a sub-tool's instruction ("Find the gradient of the line connecting:", "Simplify:", "Solve simultaneously:", "Work out:", "Find the perimeter:") on the Whiteboard, fullscreen and Worked Example whenever the tool supplied its own `questionRenderer`, and none of those renderers drew it themselves — so it never appeared. The shell now always shows the configured instruction above the question (worksheets already did). Affects Properties of Line Equations, Collecting Like Terms, Simultaneous Equations (substitution), Decimal Add/Sub and Perimeter; tools with no instruction (the angle / circle / bearing diagrams) are unchanged.

### 2026-10-04 — Line Equations: gradient worked as a triangle
- Properties of Line Equations (Gradients and Line Equations tabs): the gradient working is now drawn as a triangle on the graph — mark the points; join them and complete a right-angled triangle (shaded); read the change in y (green vertical leg, labelled Δy = …); then the change in x (purple horizontal leg, Δx = …); then divide, m = Δy ÷ Δx. Signed values follow the order the points were given, so negative gradients and swapped point order read correctly. The Line Equations tab reuses it, then substitutes and solves for c.
- Shared grapher: new `Segment` primitive (labelled line segment between two points, appears at a build step; legs of a gradient triangle, rise / run markers) — `segments` on `SmartGrapher` / `GraphBuildSpec`, drawn in `drawGraph`.

### 2026-10-04 — Per-step highlighting: Angles in Triangles
- In the split Worked Example, each step now lights the angles it is about: they glow amber (arc, wedge and label) while the others fade, with the unknown kept in blue — e.g. "sum to 180°" lights all three, "known + known + x" lights the two given angles, "x = 180° − …" lights x. Covers every question type (Level 1, isosceles, split triangle both variants, exterior angle both ways); the unlabelled angle at D shows no emphasis.
- Mechanism: a question carries `_stepFocus` (one entry per step); `withDiagramSteps` puts each on the per-step copy as `_focus`, and the tool's own renderer reads it (`TriangleDiagram` takes a `focus` prop). Test `src/tests/geometryFocus.test.ts` checks every focus index is a real angle. Other geometry tools next (same pattern).

### 2026-10-04 — Geometry tools on the two-view (split) worked example
- Basic Angle Facts, Angles in Triangles, Angles in Quadrilaterals, Angles in Parallel Lines, Properties of Circles, Bearings and Perimeter now use the split Worked Example: the diagram sits in the picture slot beside the steps (above them on a phone), each step keeping its working, with the answer drawn on the final step. Once the answer is showing, the question box above shrinks to the one-line prompt ("Find x") so the diagram is never shown twice (Bearings and Circles, whose drawings carry their own prompt, show none). Whiteboard, worksheets and printing are unchanged. Equations of Lines already used the split.
- Built once in shared: `src/shared/diagramSplit.tsx` (`withDiagramSteps`, `diagramStepVisual`, `diagramSplitQuestion`), switched on per tool with three one-liners — any diagram tool that stores its drawing on `_diagram` can opt in. Per-step highlighting (lighting the angles each step uses) is the natural next step — **started with Angles in Triangles** (next entry). Build clean, 426 tests pass.

### 2026-10-04 — Functional Skills Generator: topic tabs
- The skill picker now shows one topic at a time: a row of topic tabs at the top of the left half only (Number facts · Calculation (arithmetic, negatives and BIDMAS) · Place value · Properties · Fractions · FDP & units — one row on a desktop, two on a narrower laptop, scrolling sideways on a phone), level with the worksheet builder on the right with a count badge of the skills already picked in each, then only that topic's tiles. The page is far shorter (about 1,430px → about 980px with a few skills picked) and is slightly wider (max-w-6xl) so the tabs fit. Each skill's **options now live in the left container**: once a skill is added its tile gets an Options bar, and the open skill's options show in a panel under the tiles (tiles keep their places); a skill's options **open automatically when it is added**; the right-hand "Your worksheet" panel keeps just the − / + counts and remove buttons, with a small options icon that jumps to the skill on the left. Decluttered: smaller title and a shorter subtitle, Clear all moved beside the skill count (Settings alone in the panel header). Settings and PDF generation unchanged; tiles slightly larger and easier to read.

### 2026-10-04 — Go-live calls: Surds live, Perimeter dev-gated
- Surds: `enabled: false` removed; now live on the landing page.
- Perimeter: set `enabled: false` (dev-gated) — thin options and outdated; Simplifying Ratios stays gated pending work.
- Dropped the "(BETA)" from Perimeter's display name.
- Build clean, 402 tests pass.

### 2026-10-04 — Tool Review blocks seeded (planner)
- All 35 ToolShell tool notes in Harry's planner now carry a filled Review block: content, readiness, sandbox fit, techniques, worked solution, Smart Progressor, mobile, audit findings.
- 27 were seeded from `docs/TOOL_AUDIT.md`; 8 newer tools (Rounding, Comparing & Ordering, Adding & Subtracting Decimals, Speed Distance & Time, Mixed Strategies, Surds, Binary Operations, Number Bases) from specs and `docs/PROJECTS.md`.
- Worked-solution lines reflect the live single-answer / picture status and the 19 tools still needing a closing answer step.
- Status field is "seeded from audit" or "seeded from specs" until each tool is reviewed in person.

### 2026-10-03 — Negative counters (shared representation + sandbox)

- **Shared representation:** `src/shared/counters.ts` + `components/Counters.tsx` — yellow = +1, red = −1 (the algebra tiles'
  yellow/red), zero pairs, ghosted "taken away" counters, each labelled +1 / −1 so colour isn't the only cue. Working-step support
  (`cStep`, `countersStepRenderer`, `countersStepVisual`) so a board can develop beside the captions like the place value table.
- **Sandbox tool:** `/negative-counters` (Interactive Tools) — drag from the tray or tap, Move / Flip / Take away, Add zero pair,
  Remove zero pairs, Tidy, live value readout, and a "When +1 meets −1" setting: pair up (circled zero pair) or collapse to nothing. Standalone by design (like Algebra Tiles).
- **Representation table ("mat"):** a + row above a − row (rules between rows and labels), counters aligned in columns so a + over a − is a
  zero pair. Shared as `matBoard` / `layout: "mat"`; in the sandbox as a draggable **Table** board (counters snap into columns of their own row, swapping if the cell is taken;
  flip moves a counter between rows; pair up shades matched columns, collapse cancels them).
- **Notes workflow:** Harry's planner now holds the human-readable layer (Build Log, Feature Tracker with linked feature blocks, Representations); `CLAUDE.md` "Ending a session" gained a step to update it each session.
- Not yet wired into a question tool — Integer Add/Sub is the first target (representation switch: counters → number line).
- **Sandbox layout now matches Algebra Tiles:** blue header with burger menu (Value Summary toggle), narrow panel (Table / Collapse / + Pair / ZP buttons, undo / clear / tidy, Positive and Negative counters), dot-grid canvas with a floating dark Move / Flip / Take away hotbar, and a Value bar along the bottom. Behaviour unchanged.
- **Sandbox has the full Algebra Tiles toolbar:** floating bottom bar with Select, Grab/pan, Pen, Eraser, Clear drawings and the five pen colours, plus Flip and Take away. Ink, counters, table and dot grid pan and zoom together (burger menu: Zoom, Reset view). The bar and ink helpers now live in `src/shared/components/BoardTools.tsx` (`DrawHotbar`, `HotBtn`, `eraseNear`, `strokePath`) and Algebra Tiles imports them from there, so the two stay identical.
- **Sandbox tuning:** counters are smaller (38 px, was 52) so the board and boxes are in proportion; in the Table, pressing the **+** or **−** row label adds a counter to that row; a zero pair now behaves like a PowerPoint group — one press picks up both (boxed pair highlights, Table: the whole column moves and swaps with the target column), a quick second press breaks it apart and moves just that counter. Fixes table counters jumping when dragged (they had no x / y of their own).
- **Removed Friday Phonecalls** (`CallSelector`, `/call-selector`): file, registry entry and drift-check line deleted; doc mentions cleaned up.
- **Zero pairs are boxed, not circled:** a + stacked over a − inside a rounded blue frame (shared `PairBox` / `pairBoxStyle`), instead of a ring on each counter plus a shaded column. Applies to the mat table, free-standing `zeroPairs` rows, and the sandbox (Free: pairs stack and box when dropped together or added with + Pair; Table: each matched column is boxed). Unpaired counters sit outside the boxes.

### 2026-10-03 — Developing worked-example visuals rolled out (graphs, ratio tables, place value, number lines)

- **Split layout polish:** the answer in the split is a green **A** line on the timeline (no box/outline); thin custom
  scrollbar (`.thin-scroll`); `detachLast` on the place value table sets Comparing & Ordering's Order column apart.
- **SmartGrapher step builds:** new `step` prop + `step` tags on series / points / guides / regions; `graphStep` /
  `graphStepVisual` helpers. New split variant `stepVisualKeepsWorking` (maths cards stay beside the picture).
- **Wired:** Equations of Lines (points plot, line drawn, y-intercept picked out; new "mark the points" step; graph now
  also in Worked Example), Non-linear Sim. Eq. (curve, then line, then solutions), Mixed Strategies L3 (lines, then peak).
- **Ratio table:** `rStepBuild` grows one table a row per step; Speed/Distance/Time moved onto the caption-only split.
- **Powers of 10:** the grid now develops (number placed, direction, digits slide) beside captions.
- **Number lines:** Integer Add/Sub (start point, then the jump) and Rounding's number-line method (ends, number and halfway,
  half shaded, answer ringed) develop full width above the steps (`stepVisualPlacement="top"`).

### 2026-10-03 — Duplicate green answer box retired across ToolShell tools

- **Rolled `hideAnswerStep: true` out beyond Surds** to 15 more tools whose last working step already
  states the exact final answer (audited over ~150 draws per sub-tool × level, default and all-options-on QO):
  ExpandingBrackets, SolvingLinearEquations, AnglesInQuadrilaterals, AnglesInTriangles, Bearings,
  CircleProperties, PerimeterTool, Estimation, FractionMultDiv, IntegerAddSub, Percentages, Rounding,
  SimplifyingRatios, BinaryAddition, NumberBases. The final step now carries the green ring instead.
- **Not yet migrated** (last step is not the answer, so the flag would hide it): CollectingLikeTerms,
  CompletingTheSquare, Iterations, NonLinearSimEq, SimultaneousEquations, MixedStrategies,
  AnglesInParallelLines, BasicAngleFacts, EquationsOfLines, ComparingOrderingNumbers, DecimalAddSub,
  FractionsAddSub, PowersOfTen, BestBuys, FractionToRatio, FractionsOfAmounts, RatioSharing, Recipes,
  SpeedDistanceTime. Each needs its working to end on the answer first.

### 2026-10-01 — Full-screen app: light system bars, immersive on Android

Manifest `display` is now `fullscreen` (falls back to standalone) and `theme_color` /
`background_color` / `<meta name="theme-color">` / `html` background are the light page colour
(`#f5f3f0`), so the status/navigation bars never show as navy bars. Reinstall the home-screen app
for Android to pick up manifest changes.

### 2026-10-01 — Installable web app (full screen on mobile)

Added `public/manifest.webmanifest` (`display: standalone`, `fullscreen` preferred), app icons
(`favicon.svg`, 192/512 PNG, maskable 512, `apple-touch-icon.png`) and the iOS/Android meta tags
in `index.html` (`viewport-fit=cover`, theme colour, web-app-capable). Once "Add to Home Screen" is
used on a phone, the site opens with no browser address/search bar. No service worker (no offline
caching, so no stale-deploy risk).

### 2026-10-01 — Worksheet text-size chevrons restored on text worksheets
`hideFontControls` (set for the whiteboard's scaled table/diagram) was also removing the text-size chevrons from the Worksheet, even when the sheet was plain text. New ToolShell default **`worksheetFontControls`**: with `hideFontControls` on, the Worksheet keeps its chevrons unless a question in the sheet sets `_fixedSizeCell: true` (a grid/diagram cell drawn at a fixed size). Set on Adding & Subtracting Decimals (grids on → `_fixedSizeCell`, chevrons hidden; grids off → chevrons back), Powers of 10 and Adding & Subtracting Integers (text-only worksheets). Checked headless: 2 chevrons on those text worksheets, 0 with decimal grids on, 0 on a diagram tool (Angles in Triangles) as before.

### 2026-10-01 — Mobile pass on the evolving-visual worked examples
Checked decimals, Comparing & Ordering and Ratio Sharing at 390px (phone): the picture panel was widening to its content (a grid item grows to fit) and overflowing the screen. Fixes: the layout is `grid-cols-1` with `min-w-0` panel and list (table and bars now fit the screen; the table is above the timeline on phones); `FitWidth` is now exported and also shrinks its box to the scaled height (it used to leave a blank gap) — Ratio Sharing's bar model uses it so long bars scale down instead of overflowing; the place value table is more compact on phones (smaller digits, narrower operator gutter) and in words-heading mode shows the letters on phones (the words do not fit a column; full words from `sm` up); Comparing & Ordering's question line shrinks on a phone (`min(1em, 5.5vw)`) so a list of numbers stays on screen. Measured: no element wider than the viewport on any of these worked examples or their whiteboards at 390px, no console errors; `npm test` 395, build clean.

### 2026-10-01 — Ratio Sharing on the evolving-visual cascade
Ratio Sharing's worked example now shows **one bar model updating in place** beside a timeline of captions, instead of redrawing the bars on several cards. Every bar step (`bStep`) now carries a one-line caption in `plain` (e.g. "Value of 1 part: £60 ÷ 5 = £12."), the bar drawing was pulled out into `barVisual` (the old heading cards reuse it), and `ratioStepVisual` is the tool's `stepVisualRenderer`. Shared change: `stepVisualRenderer` may now return `false` for a **caption-only step** — it sits in the timeline as a numbered line while the picture from the nearest earlier picture step stays on screen (the total / value-of-1-part / identify steps here). Sharing, known-amount, difference and mixed all checked headless (one visual panel on every press, no console errors); `npm test` 395 and build clean. Audit result for the other tools: nothing else repeats a picture per step.

### 2026-10-01 — Evolving-visual cascade: lighter look
The captions beside the evolving table are now a **timeline** instead of grey cards: numbered dots on a thin vertical line, the current step in a ringed navy dot with bold dark text, earlier steps muted and faded, bigger caption text, no boxes — so more history fits in the scroll area. The table sits in its own white bordered panel, centred. Applies only to steps with a `stepVisualRenderer` (decimals, Comparing & Ordering); ordinary step cards are unchanged.

### 2026-10-01 — Evolving-visual cascade: captions in a fixed scroll area
In the side-by-side layout (table + step captions) the captions now sit in a **fixed-height scroll area** the same height as the table, instead of growing the page: it follows the current step (smooth auto-scroll to the newest caption) and **fades out at the top** once older steps scroll away. The page height stays constant however many steps there are (decimals Level 3, six steps: page 1091px before and after, caption list scrolling 267px of 839px). On narrow screens the table sits on top and the caption list is capped at 20rem and scrolls.

### 2026-10-01 — Evolving visual in the cascade (one table, updating in place)
A table reprinted on every cascade card clogged the page, so steps whose working is a picture now use a **`stepVisualRenderer`** (new `ToolShell` / `WorkedExampleSteps` prop). For those steps the cascade list shows only the caption (`step.plain`), and a single visual — the current step's — sits beside the list (sticky on wide screens; above it on narrow ones) and updates in place on every press, with ← retracing it. Show All shows all the captions plus the final visual once. Steps with no visual renderer, and the `single` layout, are unchanged. Wired for the decimal add/subtract tool (`placeValueStepVisual`, new shared export) and Comparing & Ordering (its own visual, with the "Order: 1 = …" caption). Checked headless: after each of three presses on both tools the cards grow 2→3→4 while exactly one table is on the page.
Not yet applied: ratio tables (Speed/Distance/Time), whose steps are different tables rather than one evolving picture.

### 2026-10-01 — Cascading Step-by-Step Worked Example is live for every tool
Step-by-Step navigation in Worked Example is no longer Developing-tools-gated, and its default layout is now the **cascade** (`workedExampleLayout: "stacked"` — earlier steps stay visible, dimmed, the current one ringed, nav footer anchored) instead of the single replace-the-card layout. Show All remains the alternative via the toggle. A tool can still opt back into the single-card layout with `defaults.workedExampleLayout: "single"`. `ToolShell` no longer reads dev mode for this (`stepThroughEnabled` always on). Checked headless outside dev mode on fractions, decimals, comparing/ordering and Powers of 10: Step-by-Step toggle present, cards accumulate per press (decimals: 1→4 cards over three presses), no console errors; table steps stack cleanly.

### 2026-10-01 — Landing page: tool groups + search
New optional `group` on registry entries (`ToolMeta.group`); the landing page draws a small sub-heading per group inside a category, in order of first appearance (ungrouped categories render as before). Number is grouped in scheme-of-work order: Place value & decimals (Comparing & Ordering, ×÷ 10ⁿ, add/subtract decimals) · Rounding & estimation · Integers · Fractions & percentages · Roots & surds. New search box under the subject toggle filters cards by name/description/group at word starts ("round" finds Rounding, not "around a point"), hides empty categories, and shows a no-match message. Checked headless: group headings, search results and clear all work, no console errors.
**Grouping extended to Algebra** (Expressions · Equations · Quadratics & iteration), **Ratio & Proportion** (Ratio & sharing · Proportion & rates) and **Geometry** (Angles · Shapes & measures · Lines & bearings), each ordered by scheme of work. Left ungrouped: Generators, Interactive, Teacher, Decision Maths, Computer Science and Binary (4 or fewer tools each, or dev-only).

### 2026-10-01 — Comparing & Ordering moved onto the shared place value table
`ComparingOrderingNumbers` no longer has its own table: the Worked Example steps and a new whiteboard scaffold draw with the shared `PlaceValueTable` — `[Sign] · whole places · decimal places · Order`, decimal point on the Ones edge, same letters/words headings and "Words in column headings" switch as the other tools. **Shared table gained two cell features:** `circle` ("on" for a deciding digit, "dim" for an unwritten zero that decides) and `badge` (filled value, used for the rank), in both the HTML and SVG renderers. The column scan is now per place (whole numbers up to 20 at Level 2 get Tens + Ones columns and "the tens digit" / "the ones digit" steps, replacing the single "whole-number part" column). **Whiteboard:** the working box shows the numbers already written in (no circles, empty Order) with an "Order: 1 = smallest/largest" caption; Show Answer fills Order (no circles — see below); the table button hides it. **Whiteboard reveal kept simple:** Show Answer only fills the Order column — no circled digits (that detail lives in the Worked Example, so the plain reveal isn't cognitively heavy).
**Full-width layout:** the whiteboard scaffold uses `placement: "question"` with the working panel collapsed (as Powers of 10 / decimals do), via a small `questionRenderer` (tighter line spacing, answer line reserved so Show Answer never rescales the box; default text-xl) — the half-width box squeezed up to six rows. Shared fix: the empty rank badge / circle spans are `align-middle`, so an empty Order cell no longer makes its row taller than a filled one (the table was ~40px taller before Show Answer). Checked headless: table box identical before/after Show Answer on Order (512×201) and Compare. **Fix:** Order's display shuffle is now stored on the question, so a display-only change (headings switch, direction wording) no longer reshuffles the numbers.
Verified: `tsc`, `npm run build`, `npm test` (395) clean; headless — Compare L1, Order L2/L3 whiteboard and worked example render the shared table with letters and words headings, no console errors.

### 2026-10-01 — Place value table unification (shared columns, headings toggle) — Powers of 10 moved onto it
**Shared (`src/shared/placeValue.ts`, `PlaceValueTable.tsx`):** one canonical column catalogue, `pvColumnSet(whole, dec)` (M … O . t … mth) giving both letters (`H T O t h th`) and full words (`Tens`, `Tenths`…), so a place carries the same label in every tool. New `headerStyle: "letters" | "words"` + `columnNames` on `PlaceValueTableData` (HTML and SVG both honour it; long words shrink to fit). New shared `PV_WORD_HEADERS_VAR` ("Words in column headings" QO switch, read live at render time via `qo.variables`, so toggling it never regenerates the question), `pvDisplay` (shared row height, no tint, heading style), `pvSlice` (promoted from the decimal tool), `PV_CELL_H` and `PV_TABLE_START_DD`. `placeValueStepRenderer` now reads the heading switch from `qo`.
**Decimal add/subtract:** builds on the shared helpers, gains the headings switch (whiteboard, worked example, worksheet grids). No behaviour change otherwise.
**Powers of 10:** same tool, updated representation — shared column set (labels now `HTh TTh Th … tth hth mth`, replacing `HTt/TTt/Tt/htth`), shared row height, and the whiteboard grid is the same three-row table (input / move / output) empty or filled so it no longer resizes on Show Answer; headings switch added. Level 3 statement unchanged.
Verified: `npm test` (395) and `tsc` clean; headless — grid box 983×235 identical before/after Show Answer (levels 1–2), add/sub 804×248 unchanged, words headings render on both tools, no console errors.
**Next:** migrate Comparing & Ordering onto the shared table (needs a circled-digit cell, sign column, rank column).

*Older entries (before October 2026) are in `docs/history/PATCH_NOTES_to_2026-09.md`.*


---

# Computer Science

### 2026-10-27 — 1.1.3 Embedded Systems; System Architectures retired
- **New tool `embedded-systems`** (`/embedded-systems`, id `1.1.3`), on the CS shell like 1.1.1 and 1.1.2 (pure data, `__topic` checked by `validateTopic`): four Learn lessons (one with a box schematic of a washing machine's embedded controller: inputs, CPU, ROM program, outputs), 13 core cards, 4 fill-ins, 6 misconception checks, 8 exam questions with a 6-mark discussion, 3 synoptic questions (with 1.1.1, 1.1.2 and 1.2.1). Brief `specs/cs/embedded-systems.md` (implemented). The J277 wording for 1.1.3 is purpose, characteristics and examples; real-time operating systems, firmware and microcontrollers are not in it, so they are flagged beyond spec (the old tool taught RTOS as core).
- **Retired the original `system-architecture` tool** (all of 1.1 in one hand-built file): 1.1.1, 1.1.2 and now 1.1.3 each have their own tool. Its registry entry, file and test entry are gone.
- Dashboard note for `system-architecture` stays until this branch is merged, then is removed with the other old ids.
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

### 2026-10-10 — File Sizes (`/file-sizes`, dev-gated) and the shared unit ladder
- New ToolShell tool, brief `specs/file-sizes.md`: **Text**, **Images**, **Sound** — number of things × bits per thing, then walk the ladder (bits ÷ 8 → bytes ÷ 1000 → KB → MB). Three levels each (L1 bits only; L2 the exam shape; L3 colours that are not powers of two, several images, kHz / minutes to convert, comparing, reverse questions), Question Options per level (task pool weighted for the Smart Progressor, characters / resolution / answer units), exact BigInt arithmetic, answers in KB / MB always whole or one decimal.
- New shared representation: **file-size recipe** (`shared/fileSizeRecipe.ts`, `components/FileSizeRecipe.tsx`) — three or four boxes joined by × and =, filling left to right, with the unit ladder lighting each hop, and a doubling chain (1 bit → 2 colours …) for colour questions. Whiteboard: the empty recipe and ladder in the working box, filled by Show Answer. Worked Example: one picture beside the working (keep-working flavour, so each line still shows its label and maths).
- **Extraction:** the ladder and the tenths helpers moved out of Data Units into `shared/dataUnits.ts` and `components/UnitLadder.tsx` (Data Units imports them back; its tests pass unchanged). `UnitLadder` gained a stepwise `reach` and `maxUnit`.
- Deviations from the brief: Worked Example uses the keep-working split (label + maths per step) rather than caption-only, so the maths stays on screen; names in "X saves a …" framings are not used; a reverse question whose size is given in bits (a sample row) has one step before the answer; question text starts one whiteboard font size smaller (`displayFontSize: 1`) because the questions are sentences.

### 2026-10-04 — Binary Operations on the shared place value table (stage 3 of 3)
- Binary Addition worked examples: one place value table (128 … 1, nibble rule) walks the sum a column at a time — the current column highlighted, each carry written above the column it lands in, the result row filling in — with captions in the same wording as Binary Counting ("1 + 1 = 2, which is 10 in binary: write the 0 and carry the 1…"). A run of all-zero columns on the left is one step. The register check ends on a "Carry of 1 lost — overflow" banner when the sum exceeds 255. Three-number sums are two tables (add the first two, then the third).
- Binary Shifts worked examples: the register plus spare columns on the side the bits leave from; row 1 the number (the bits about to be lost marked red), row 2 the result with the vacated cells as blue placeholder zeros and the lost bits in red outside the register. Level 2 adds the denary conversions (place-value sums) and the ×/÷ effect, with overflow / underflow explained.
- Shared table: new `lost` tone (red) for bits that leave the register. The duplicated KaTeX place-value grid is gone from the Binary tools; the green A line carries each answer (own "Answer:" steps and `hideAnswerStep` removed). Questions, levels, options and worksheets unchanged. Build clean, 426 tests pass. This completes the Binary place-value extension (Counting sandbox → Number Bases → Binary Operations).

### 2026-10-04 — Number Bases moved onto the shared place value table (stage 2 of 3)
- Number Bases' worked examples now use the shared place value table (`pvStep` snapshots with the base-aware columns: 128 … 1 for binary, 16 and 1 for hex, a heavier rule per nibble) instead of hand-built KaTeX grids — one table updates in place beside short plain-text captions (`stepRenderer` / `stepVisualRenderer`, as in Decimal Add/Sub). All six directions covered; the green A line now carries the answer (its own "Answer:" step and `hideAnswerStep` removed).
- Questions, levels, options and worksheets unchanged. Build clean, 426 tests pass. Stage 3 (Binary Operations: shifts and addition) still to do.

### 2026-10-04 — Data Units tool; Binary Counting controls tidied
- New ToolShell tool `/data-units` (`src/tools/Binary/DataUnits.tsx`, dev-gated): convert between bits, nibbles, bytes, KB, MB, GB, TB, PB on the OCR ×1000 scale, with ×1024 in brackets. Level = length of the walk along the scale (1 step / 2 steps / 3–5). Sub-tools: **Bytes & Above** (Direction, whole/decimal, wording pools) and **Bits & Nibbles** (×4 / ×2 hops, scenario wording). Whiteboard shows the scale as a ladder in the working box (start filled, target outlined, path lit on Show Answer). Exact BigInt maths. Brief: `specs/data-units.md`; test `src/tests/dataUnits.test.ts`.
- Data Units scale: centred in the working box; new QO switch "Scale: only the relevant units" shows just the start-to-target units, larger.
- Binary Counting: options menu moved out of the burger into the toolbar (an Options button); every toolbar button now shares one 44px size/style.

### 2026-10-04 — Binary Counting sandbox + base-aware place value table (stage 1 of 3)
- New standalone sandbox `/binary-counting` (`src/tools/Binary/BinaryCounting.tsx`, dev-gated): denary, binary and optional hex place value tables side by side, 1–8 bits, step / play counting, readout of the current number's place-value sum and how many bits flip.
- "Add a bit" builds the n-bit table from the (n−1)-bit one: the first half appears with a 0 in front, then "Copy it again with a 1 in front" reveals the second half (rule between halves, new bit tinted). Past 4 bits the table pages 16 rows at a time — the last four bits repeat on every page — instead of listing 256.
- Shared place value table now handles other bases: `pvBaseColumnSet(2|16, digits)` / `pvBaseCells` (headings are place values 128…1 / 16, 1; "Powers" gives 2⁷…2⁰), `groupEvery` (heavier rule per nibble), and a `current` row tone.
- Default view is an **odometer** — one big row per base that counts up in place, the digits that just turned over tinted blue — with the full list of rows as a second view ("Full list").
- **One press = one whole count** (no staged reveal). The odometers (denary · binary · optional hex) sit side by side; the whole carry chain shows at once — a carry mark above each column that received one, turned-over digits tinted — with one card listing each column ("2s: 1 + 1 = 2 (10 in binary) → write 0, carry 1"). At all ones the next press shows **overflow** (red) and wraps to 0.
- Cleaner controls: a bits stepper, count controls (reset / back / auto-play / big →) and an Odometer | List switch in one toolbar; everything else (hex, power headings, highlight, explanations, slower play) lives in the header menu. An earlier beat-by-beat "step 1 of 4" version was dropped as confusing.
- New shared model `src/shared/carry.ts` (`rippleIncrement(n, base, width)` — beats for any of base 2/10/16) so Number Bases / Binary Operations can narrate carries and overflow the same way.
- Brief: `specs/cs/binary-counting.md`. Stages 2–3 (move Number Bases, then Binary Operations shifts/addition onto the shared table) still to do.
- Build clean, 406 tests pass (new `placeValueBases.test.ts`).

> The CS strand is deliberately tracked apart from Maths: it's a different
> subject with its own pedagogy (knowledge/recall, not question generation), its
> own tools, and its own shell (`CSShell`, not `ToolShell`). It's younger than the
> Maths side — expect it to grow fast.

*Older entries (before October 2026) are in `docs/history/PATCH_NOTES_to_2026-09.md`.*
