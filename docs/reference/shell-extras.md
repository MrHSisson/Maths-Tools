# Shell extras: ink, printables, question keeper, DecisionShell, PDF print

**Read when:** Touching ink, printables, recent/pinned questions, a Decision tool, or a hand-written print handler.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

---

## Ink overlay — writing anywhere (app-level, never per tool) <!-- R37 -->

`src/shared/components/InkOverlay.tsx` is mounted **once in `App.tsx`** and appears on every tool page (not the landing page; not the Algebra Tiles / Negative Counters sandboxes, which have their own board and hotbar — add a route to `NO_INK` for any new sandbox). A pencil button opens a movable hotbar: **Freeze** (the page is live, the ink stays) · **Pen** · **Eraser** · Undo · Clear · colours; tap the active Pen / Eraser again for its options flyout (pen thickness; eraser size and **Part** vs **Whole line**). In Draw a drag inks and a short still tap is **forwarded** to the element underneath, so buttons keep working. Never re-implement drawing in a tool, and never add per-tool ink wiring. <!-- R37 -->

- **Forwarded taps are synthetic**, so the browser refuses anything that needs a genuine click (popups — Print). Mark such a control **`data-trusted-click`**: tapping it while drawing freezes the layer ("Frozen — tap again") so the second tap is a real click. Fullscreen / Present / the visualiser camera do *not* need it.
- Ink is stored in **screen (viewport) coordinates** (page-anchored ink slid when the Whiteboard fullscreen re-laid out the page) and clears on route change; it is hidden when printing.
- Hotbar position (`mt-ink-hotbar`) and pen / eraser choices (`mt-ink-prefs`) are remembered per device. The bar never changes size when the tool changes — options live in flyout menus that open perpendicular to it. Pure helpers (`dockFromDrop`, `placeHotbar`, `classifyPress`, `eraseAt`) are unit-tested in `src/tests/inkOverlay.test.ts`. <!-- ref -->

## Printables — ready-made sheets in the burger menu (`src/shared/printables.ts`)

A **printable** is an A4 sheet with no generated questions, for the class to fill in: one SVG cell repeated on a grid (`Printable { label, hint, title, cell, columns, rows }`). Pass sheets to the shell and the burger menu lists them under one **Printables** heading, all printed through the one `printPrintable` path (a print window with the A4 page, margins and grid): `<ToolShell printables={PRINTABLES} … />` with a module-level `const PRINTABLES = [numberLineSheet()]`. Shared sheets: `numberLineSheet` (integer line −10 to 10), `placeValueSheet` (H T O . t h th), `binarySheet` (128 to 1), `ratioTableSheet` (with a box for each scale factor), `gridSheet` (coordinate grids, −10 to 10); Rounding builds its own blank lines from its diagram's geometry. **Only a tool whose working is built on a picture the student draws or fills in on a blank offers one** (a number line, place value table, ratio table or graph): `src/tests/printables.test.ts` fails for a ToolShell tool that has `printables` without one of those representations. A new kind of sheet is a new function in `printables.ts` returning a `Printable`, never a print routine in a tool. DecisionShell's `printTemplates` (blank grids and boxes for histograms and Gantt charts) appears under the same heading. The dashboard has a **Printables** feature filter. <!-- R38 -->

## Recent and pinned questions — in both shells (never per tool) <!-- R39 -->

`src/shared/questionKeeper.ts` (`useQuestionKeeper`, `MAX_KEPT = 5`) is wired once in `ToolShell` and once in `DecisionShell`: the burger menu's **Recent & pinned questions** item pops out the last 5 questions you moved on from (newest first, no repeats) and up to 5 pinned ones, and `PinButton` (`src/shared/components/PinButton.tsx`) sits beside New Question in the toolbar (phone: the bottom bar). Memory only (gone on reload); hidden in Worksheet mode. Picking one restores the exact question and its level / tab / options without regenerating it (`ToolShell` guards the QO effect with `restoredQ`). `MenuDropdown` takes `keeper` for this and `printables` (below). Tools add nothing.

## DecisionShell (`src/shared/decision/`) — network-native tools, quick reference

Full plan: `docs/architecture/DECISION_SHELL_PLAN.md`. Shell-level options a Decision tool can use (all opt-in):

- **`config.chooser: ShellChooser`** — one collapsible topic chooser at the top (desktop; phones keep the click-through start screens) instead of the big tabs and tab row: `filters` (the `top` option keys shown as segmented filters inside it), `groups` (titled lists of sub-tool keys) and optional `art(key)` mini pictures. `ShellSubTool.blurb` is the tile's one-liner; `ShellSubTool.when` / `ShellOption.when` accept an array (every condition must hold) so a course or practice switch can hide tabs and options. Picking a tile leaves the chooser open. Reference: `src/tools/Decision/NetworkFlows.tsx` (art: `FlowTileArt.tsx`). <!-- ref -->
- **Option notes** — every `ShellOption` carries an `info` sentence (what it is for; shown in "About this tool" and under the option's title when a level is opened from the level (i); never as an (i) beside the option in the popover or sheets); `levelLabels.test.ts` fails for one without. <!-- R40 -->
- **Layout** — the working area is one laptop screen tall (`STAGE_H` in `layout.ts`, both columns fill it) from `lg` up and stacks below; the toolbar is the ToolShell one (levels · Question Options · pin + New Question). `config.levelLabels` become a "Levels" Info section automatically.
- **Parts library + recipes (Network Flows; the pattern for every Decision exam)** — `shared/decision/flowParts.ts` holds one `PartDef` per question idea (`build(ctx)` → `ExamPart[]` or `null` when the network does not suit it; it may leave `ctx.facts` for later parts); `flowExam.ts` holds the recipes (slots = pools of part ids) and `composeFlowExam`, which samples a network and retries. Add a part to the library and a slot to a recipe — never write a part inside a chain. A recipe may have a `second` figure (`ExamPart.figure`); every part gets `partId` and a `practise` target (`PRACTISE`) for the "Practise this" link. The **Explain and justify** tab (`FLOW_IDEAS`, `generateFlowReason`) is a one-part exam built from the same parts; ideas marked `legacy` are off until ticked. Paper questions are tagged as part chains in `specs/corpus/<tool>.md`, checked by `flowCorpus.test.ts`. Spec: `specs/flow-parts-library.md`. <!-- R40 -->
- **Exam-style questions** — a generator may return `DecisionProblem.exam` (`ExamData`: intro, marks, minutes, `parts: ExamPart[]` with `prompt`, `marks`, `scheme` (B1/M1/A1/E1/R1), `model` answer lines (empty + `onDiagram` when the answer is drawn on the picture), `explain`, `working: SolveStep[]` (the skill solver's steps, played stepped behind the (?)), `view` (the picture for the part's answer) and `role`). `ExamView` shows one part at a time (Show individually | Show all parts) with Back / Show answer / Next fixed at the foot; **Practice | Worksheet** (the switch lives in the chooser) generates a set, previews each question and prints it with the normal green Print split button (Both / Questions / Answers) through `printExam.ts` (papers first, then mark schemes; blank networks where the student draws). Reference generator: `src/shared/decision/flowExam.ts`; spec `specs/flow-exam-questions.md`.

## PDF print — edge cases

`handlePrint(…, opts)` takes optional `{ paper: "A4" | "A5", fontPx, compactAnswers }`: A5 prints a 148 × 210 mm page (10 mm margins) for sheets that go under the visualiser or two to an A4 sheet, `fontPx` sets the question text size, and `compactAnswers` lays an answers-only print out from the answers' own heights instead of the questions'. The defaults are the A4 behaviour every tool page uses. Deck worksheets use all three: `docs/reference/decks.md`.

- `totalPages`, `printMode`, and any `var` referenced inside a function declaration must be declared in the injected script's **outer scope** — declaring them inside `buildPage` causes "not defined" at runtime <!-- R41 -->
- Params appearing only as `${...}` in the HTML string are invisible to TypeScript — use distinct names (e.g. `pMode` not `printMode`) and add `void (param as unknown)` suppressions before the template literal
- If a tool has only worded questions, remove `"simple"` and `"frac"` branches from `questionToHtml` — TS2367 otherwise
- For SVG tools use `handleDiagramPrint` (via `customPrintHandler`) — the text `handlePrint` has no SVG support

---
