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


### 2026-10-29 — Estimation deck rebuilt for Year 9; seven new Estimation Depth cards
- **What:** the Estimation deck is rebuilt from `specs/decks/estimation-y9.md`: one deck of 45 slides in four sections (rounding to 1 s.f., whole numbers, fractions, decimals), each with a worked board (with the calculator answer beside the estimate), a five-question authored set and a generator slide; the definition of *estimate* to write down; book activities; exit tickets. Rounding practice builds from two-digit numbers to a short edge-case set (95, 996, 450, 305, 349). Seven new Depth cards for Estimation: Rounding 649, The calculator slip, Nearly equal numbers, Does the size make sense?, Over or under?, Make an estimate of 0.3, Stopping part-way; three new misconception tags. The Rounding tool now runs in deck generator slides (nearest, decimal places, significant figures); its digit-box picture moved to `src/shared/components/RoundDigits.tsx`, and deck generator slides draw prose working steps wrapped.
- **Not done:** the legacy bank code is still in place; teacher notes and an outline view are not built; no class has used the deck yet.
- Files: `src/decks/data/estimation.json`, `src/tools/Number/EstimationDepth.ts`, `src/shared/{misconceptions.ts,components/RoundDigits.tsx}`, `src/decks/{SlideCanvas,generators}.ts(x)`, `src/tools/Number/Rounding.tsx`, tests that named old slides, docs.
- Agent: Claude Code
- Notes: planner Build Log and Handoff not updated this session (to do).

### 2026-10-29 — Decks are data; lesson-plan template and slide features list
- **What:** a deck is now a JSON file in `src/decks/data/` (listed automatically; Estimation moved there, with Harry's saved edits merged in: his extra Whiteboard slide and the reworded discussion slide). The shared copy is the master: `npm run deck -- pull|push|list` (`scripts/deck.mjs`). Added `docs/design/templates/LESSON_PLAN_TEMPLATE.md` (short, everything optional) and `docs/design/SLIDE_FEATURES.md` (what can go on a slide); `specs/decks/README.md` rewritten. The test that demanded a brief on every question slide now treats briefs as optional.
- **Not done:** the merged Estimation JSON is **not yet pushed** to the shared copy (Harry's current cloud version is unchanged); legacy bank code still in place; teacher notes and an outline view not built. Estimation is a rough first deck, expected to be rebuilt.
- Files: `src/decks/{index,estimation,layouts}.ts`, `src/decks/data/estimation.json`, `scripts/deck.mjs`, `src/tests/decks.test.ts`, docs above.
- Agent: Claude Code
- Notes: planner Build Log and Handoff not updated this session (to do).

### 2026-10-29 — Decks: one optional slide brief; a cleaner question editor
- **What:** the four teaching-note boxes per slide (purpose, question focus, look for, next move) and the question brief form (count, avoid, progression, examples, solution reference) are replaced by one optional **slide brief**: a sentence or two on what the slide's questions test, or the key skill. Edit it under This slide in the properties panel, at the top of the question editor (with **Copy for chat**), or in **Lesson thread**, which is now one list of every slide with its brief box and **Copy briefs for chat**. The slide strip no longer shows "Purpose not yet written" on every slide.
- Estimation keeps briefs on its 15 question, generator and Depth slides only (purpose and question focus merged into one note); the other slides have none. Older saved decks still load: their notes fold into the one brief when the editor opens them (`withBriefs`), and the save API still accepts the old fields.
- **Question editor** rebuilt: questions listed down the left (amber number = unfinished, **Add question** underneath), the selected question's fields in the middle with icon buttons (duplicate, move, remove) and a small **Σ Insert maths** link per field, and the live preview on the right with a compact layout switch. Everything is on screen at once on a laptop; columns stack on smaller screens.
- **No more blue tint:** slides, writing spaces and question previews are plain white, and the page around them (player, editor, deck list) uses the site's usual light grey (`src/decks/theme.ts`).
- Rule **R43** rewritten (`CLAUDE.md`): a brief is optional; Claude writes one per question slide when planning, not for every slide.
- Code: `src/decks/questionBrief.ts` (new helpers), `LessonMap.tsx`, `QuestionWorkspace.tsx`, `QuestionAuthor.tsx`, `QuestionLayoutPicker.tsx` (compact), `Editor.tsx`, `EditorChrome.tsx`, `GeneratorDialog.tsx`, `estimation.ts`, `types.ts`, `api/_decks.ts`; `QuestionBrief.tsx` removed. Tests and the questions, layouts and lesson-thread smoke scripts updated. Docs: `docs/reference/decks.md`, `GLOSSARY.md`, `FEATURES.md`, `design/LESSONS.md`, `specs/decks/README.md`, `pathways/decks.md`.
- **Not done:** branch not merged; no PR opened.
- Agent: Claude Code.
- Notes: Build Log block "Decks: one slide brief, cleaner question editor (Claude Code)".

### 2026-10-28 — Deck editor: menu bar, toolbar and cleaner menus
- **What:** the deck editor's single row of unlabelled icons is replaced by two rows. The header has a back arrow to the deck list, the deck's name with the save status, a menu bar (**File**, **Edit**, **Insert**, **Slide**, **View**, each item with its key where it has one), the panel toggles, **Lesson thread** and **Present**. The toolbar has undo / redo, **New slide** (layouts grouped by kind), Text, Equation, Image, **Shapes** and **Questions** (was "Lesson pieces"), then controls that follow the selection: slide navigation when nothing is selected; size, bold, alignment and colour for text; edit, size and colour for an equation; fill and outline for a shape; colour and arrowhead for a line; Edit questions / Configure for question sets and generators; **Arrange**, duplicate and delete for anything.
- The slide buttons (earlier, later, duplicate, copy, delete) moved from the properties panel to the Slide menu (the strip still has hover duplicate / delete). Keyboard shortcuts open in a window (View menu or `?`). On a phone both panels start shut and only one opens at a time, so the slide gets the screen.
- Checked at 1920, 1366, 1180, 1024 and 390 wide; the toolbar fits on one line down to 1024. Build, tests, lint and the questions, layouts, Depth artwork, lesson thread and whiteboard smoke tests pass.
- Code: `src/decks/Editor.tsx`, `src/decks/EditorChrome.tsx` (`MenuItem` shortcut / tick rows, `MenuDivider`, `BarDivider`, `ShortcutsDialog`, bare menu-bar buttons), `src/index.css` (`no-scrollbar`). Docs: `docs/reference/decks.md`, `docs/FEATURES.md`, `docs/pathways/decks.md`.
- **Not done:** branch not merged; no PR opened.
- Agent: Claude Code.
- Notes: Build Log block "Deck editor: menu bar and toolbar (Claude Code)".

### 2026-10-28 — Planning docs replaced by tasks and pathways; agent hand-off; Overview note
- **What:** `docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md` are retired. The plan is now `docs/TASKS.md` (smaller to-dos), `docs/pathways/` (one file per large development: status, intention, progress, next steps). The dashboard's Developments tab has a drop-down between Tasks, Pathways and Feature tracker (the old Tool notes view without the in-development / wants-to-change boxes) (pathways show one stage chip; pathways grouped in progress, ideas, done, paused; a rolling-out pathway shows x/n live tools from a tool fact); the old To look at, Settled decisions and Future views are gone. Settled decisions moved to a planner archive note.
- Dashboard rebuilt: a side menu (bottom bar on a phone), a drawer for detail (tool profile, tasks, pathways, features), pathways stacked (in progress, then ideas, with Done and Paused folded), tasks as compact rows, features and the build guide as plain single columns; status shown as a dot and a word instead of chips; the Next up view removed; the tool profile now shows what the tool does (from its About words), its recent patch-note entries and last-changed date, a Review status dropdown just under the Has dots, each section foldable; the Matrix is a real table on a phone too (name column sticky, all columns fit at 390 wide) (the status, in-development, wants-to-change, differs-from, representation and open-question note fields were deleted from the shared store; only the Review of Maths Words Bingo was kept). Code: `src/admin/` (`AdminPage`, `ToolsSection`, `ToolProfile`, `ui`, `PlanPages`, `DevelopmentsPage`).
- **Agents:** anyone can work anywhere, one agent per area at a time, coordinated through the planner note Maths Tools - Handoff (`AGENTS.md`, `CLAUDE.md`). New planner note Maths Tools - Overview (tools index, being worked on, added in the last month).
- Code: `scripts/adminDocs.mjs` (reads tasks and pathways), `src/admin/PlanPages.tsx`, `AdminPage.tsx`, `DevelopmentsPage.tsx` (now "Tool notes"). References to the old docs updated across docs, specs and code comments.
- **Slimmed:** October entries up to the 26th moved to `docs/history/PATCH_NOTES_2026-10.md` (the planner Build Log already holds the per-session record); `CLAUDE.md` cut from 538 to about 400 lines (the session workflow, record routine and dashboard notes API moved to `AGENTS.md`); the planner's per-tool pages, Tool Index, Feature Guide, Development Prongs, Future Developments and Different From notes deleted (in the planner trash for 30 days; Network Flows' page was kept because it carries two completed to-dos). `scripts/notesPages.mjs` and its dump test removed.
- **Not done:** branch not merged.
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

*Older entries are in `docs/history/` (October 2026 up to the 26th in `PATCH_NOTES_2026-10.md`; before October in `PATCH_NOTES_to_2026-09.md`). The fuller record of each session is the planner Build Log.*

---

# Computer Science


### 2026-10-27 — 1.1.3 Embedded Systems; System Architectures retired
- **New tool `embedded-systems`** (`/embedded-systems`, id `1.1.3`), on the CS shell like 1.1.1 and 1.1.2 (pure data, `__topic` checked by `validateTopic`): four Learn lessons (one with a box schematic of a washing machine's embedded controller: inputs, CPU, ROM program, outputs), 13 core cards, 4 fill-ins, 6 misconception checks, 8 exam questions with a 6-mark discussion, 3 synoptic questions (with 1.1.1, 1.1.2 and 1.2.1). Brief `specs/cs/embedded-systems.md` (implemented). The J277 wording for 1.1.3 is purpose, characteristics and examples; real-time operating systems, firmware and microcontrollers are not in it, so they are flagged beyond spec (the old tool taught RTOS as core).
- **Retired the original `system-architecture` tool** (all of 1.1 in one hand-built file): 1.1.1, 1.1.2 and now 1.1.3 each have their own tool. Its registry entry, file and test entry are gone.
- Dashboard note for `system-architecture` stays until this branch is merged, then is removed with the other old ids.
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".
