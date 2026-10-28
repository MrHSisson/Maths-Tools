# ToolShell reference

**Read when:** Building or changing a ToolShell tool: the `ToolShellProps` interface, `defaults`, what the shell provides, sharing links, how Question Option changes behave.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

---

## `ToolShellProps` — complete interface

`ToolShellProps` is defined and exported from `src/shared/ToolShell.tsx`. Do not read that file — this section is the authoritative reference. <!-- R17 -->

```ts
export interface ToolShellProps {
  // ── Required ────────────────────────────────────────────────────────────────
  config: ToolConfig;
  infoSections?: InfoSection[];   // optional and normally omitted: "About this tool" reads <Tool>.about.ts and TOOL_CONFIG

  generateQuestion: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;

  /** Optional — omit it. ToolShell wraps generateQuestion with the standard
   *  retry-until-unique loop (makeUniqueQ) automatically. Only supply for
   *  non-standard uniqueness handling. */
  generateUniqueQ?: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    usedKeys: Set<string>,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;

  // ── Optional — layout & behaviour ───────────────────────────────────────────
  defaults?: ToolShellDefaults;

  // ── Optional — custom renderers ──────────────────────────────────────────────
  /** Replaces QuestionDisplay in all modes.
   *  compact: true=worksheet cell, undefined=regular whiteboard, false=worked-example/fullscreen.
   *  idx: worksheet cell index (pass to SVG as data-q-index).
   *  qo: live QO state — use for display-time decisions.
   *  fontClass: the active font-size Tailwind class (driven by the size chevrons —
   *    worksheetFontSize when compact, displayFontSize otherwise). Apply it so the
   *    chevrons actually resize text in a custom renderer; ignore it for diagrams
   *    that use hideFontControls. */
  questionRenderer?: (
    q: AnyQuestion,
    showAnswer: boolean,
    compact?: boolean,
    idx?: number,
    qo?: QOSnapshot,
    fontClass?: string,
  ) => JSX.Element | null;

  /** Replaces AnswerDisplay. Shown when answer is revealed. */
  answerRenderer?: (
    q: AnyQuestion,
    qo?: QOSnapshot,
  ) => JSX.Element | null;

  /** Replaces default step rendering in the worked-example step list. `reveal` is the fragment index showing on the
   *  current card (undefined = show everything: past steps, Show All) so a custom renderer can build itself up one
   *  beat at a time like a fragment-authored step (reference: Order of Operations' board-style lines). */
  stepRenderer?: (
    step: WorkingStep,
    qo?: QOSnapshot,
    reveal?: number,
  ) => JSX.Element | null;

  /** For steps whose working is a visual that EVOLVES (a place value table filling in): return just
   *  the visual (`false` for a caption-only step of the same tool — it joins the timeline while the picture stays on screen; `null` for any other step). In the cascade and Show All the list then carries only each
   *  step's caption (`step.plain`) and ONE visual — the current step's — updates in place beside it
   *  (above on narrow screens), instead of reprinting the table every step. */
  stepVisualRenderer?: (step: WorkingStep, qo?: QOSnapshot) => JSX.Element | null | false;

  /** Companion to `stepVisualRenderer`: keep every step's full working (its maths) in the list beside the
   *  picture instead of a caption-only timeline. For equation-led tools whose picture builds up with the
   *  working (see "Split worked example" below). */
  stepVisualKeepsWorking?: boolean;

  /** Companion to `stepVisualRenderer`: "side" (default) puts the picture beside the steps; "top" puts it
   *  full width above them — for wide, short pictures (number lines). */
  stepVisualPlacement?: "side" | "top";

  /** Called when a QO option changes. Return a reformatted copy of the question (same maths, different display),
   *  or null to leave it to the shell (which replays `displayOnly` options from the saved seed, else keeps the question).
   *  Usually unnecessary: mark the option `displayOnly` instead. */
  reformatQuestion?: (
    q: AnyQuestion,
    qo: QOSnapshot,
  ) => AnyQuestion | null;

  /** Custom print handler for diagram/SVG tools.
   *  Replaces the default handlePrint for worksheet PDF export.
   *  For SVG tools, pass the shared `handleDiagramPrint` directly — it measures
   *  nothing in the DOM (diagram heights are derived from the aspect ratio) and
   *  routes pagination through the same computeWorksheetLayout engine the text
   *  path uses, so diagrams get variable columns, sections and differentiated
   *  layout for free. `ctx` carries the live print setup (columns, etc.). */
  customPrintHandler?: (
    questions: AnyQuestion[],
    printMode: PrintMode,
    worksheetEl: HTMLElement | null,
    ctx: PrintContext,  // { toolName, difficulty, isDifferentiated, numColumns, instruction, layout, showBorders }
  ) => void;

  /** Optional. When provided, ToolShell shows a "Teach" mode — a PowerPoint-style
   *  deck the teacher presses through (→ / space / click; ← steps back). Omit it
   *  and no Teach tab appears. See "Teaching slides" below. */
  teachingSlides?: TeachingSlide[];

  /** Optional scaffold drawn inside the whiteboard's working box (e.g. a place
   *  value table to model on). A toolbar button in the box hides/shows it so the
   *  teacher can remove the scaffold. Whiteboard only (embedded + fullscreen);
   *  suppressed while the visualiser camera is on. `label` names the tooltip. */
  workingScaffold?: {
    label: string;
    /** "workingBox" (default) or "question" — inside the question box below the
     *  question (works with the default renderer or a `questionRenderer`); pair with `collapseWorkingByDefault`
     *  for a full-width scaffold. The hide button then sits in the question box. */
    placement?: "workingBox" | "workingCorner" | "question";
    cornerWidth?: number;   // px, for workingCorner (default 190)
    render: (q: AnyQuestion, showAnswer: boolean, qo?: QOSnapshot) => JSX.Element | null;
  };
}
```

## `defaults` — per-tool overrides

```ts
defaults?: {
  displayFontSize?: number;             // starting font size index 0–5, default 2 (text-3xl)
  worksheetFontSize?: number;           // starting font size index 0–5, default 1 (text-xl)
  numQuestions?: number;                // starting question count, default 15
  numColumns?: number;                  // starting column count, default 3
  fixedColumns?: boolean;               // hides the columns input entirely
  maxColumns?: number;                  // caps the columns input max (e.g. 3 = no 4-col option)
  maxColumnsByLevel?: Record<string, number>; // per-level override of maxColumns (e.g. { level3: 4 } for a text-only level on a diagram tool)
  maxColumnsByTool?: Record<string, number>;  // per-sub-tool override of maxColumns (beats maxColumnsByLevel)
  hideFontControls?: boolean;           // hides the text-size up/down chevrons (diagram-only tools)
  collapseWorkingByDefault?: boolean;   // whiteboard opens with the working/visualiser panel collapsed (diagram-heavy tools)
  worksheetFontControls?: boolean;      // with hideFontControls on, keep the chevrons on a text Worksheet (hidden only while a question sets `_fixedSizeCell: true`)
  workedExampleLayout?: "stacked" | "single"; // Step-by-Step layout: "stacked" (default) cascades; "single" replaces the card each press
  toolTabRows?: number[];               // split the sub-tool tab buttons across rows, e.g. [3, 2] for five sub-tools; omit for one row
  hideAnswerStep?: boolean;             // Worked Example: skip the separate green answer box. Only when the last working step states the exact final answer in every case (stress-test every sub-tool × level)
}
```

## Staged reveal — show a preview before the answer

A question may carry `_stagedReveal: "<button label>"` (e.g. `"Show Plot"`). In Whiteboard, fullscreen and Worked Example ToolShell then renders a separate toggle button **inside the question box** (below the renderer output; "Show Plot" ⇄ "Hide Plot"), leaving the toolbar's Show Answer untouched. Pressing it sets `qo.preview = true` (on the `QOSnapshot` passed to `questionRenderer`) so the tool can draw an intermediate state; Show Answer reveals everything, and the button hides once the answer is up. A new question / reformat resets it. Worksheets ignore it (renderers should honour `qo.preview` only when `compact !== true`). Reference: `src/tools/Number/Rounding.tsx` ("Students plot it").

**Per-page cap for diagram worksheets:** set `_densityFloorMm` on a tool's questions to override `handleDiagramPrint`'s default 40 mm density floor — a lower value means taller minimum rows, so fewer per page (30 → 12 per page at 2 columns for a ~2.6:1 diagram). A tool can also wrap `handleDiagramPrint` to adapt `ctx.numColumns` to the question count so a short sheet uses fewer, bigger columns (see `printRounding`). Questions with no SVG can set `_printText` to print a plain text cell on a diagram sheet (mixed-level / differentiated); a diagram tool whose text-only level should scale like any normal tool can route pure-text sheets to `handlePrint` instead.

## Shared prompt — said once on a worksheet

A worded question shaped `lines: ["Simplify:", "$maths$"]` (a maths-free prompt, then a line of only maths) has a **prompt** (`promptOf`, `src/shared/prompts.ts`). On the Whiteboard and Worked Example `QuestionDisplay` draws that prompt as a small slate line (half size) above the large maths, so the question carries the emphasis (the same look as a tab-wide `instruction`, but it works when the prompt varies per question). On the standard Worksheet, when every question shares the same prompt (and the tool has no `instruction` and no `questionRenderer`), ToolShell shows it once above the sheet on screen (print is unchanged: every printed cell keeps its prompt) and the on-screen cells carry only the maths. The Worksheet Settings popover has a **Say the prompt once** switch (on by default, shown only when a shared prompt exists) to put the prompt back in every cell. Otherwise each cell shows its prompt as a small label above the maths. Keep one prompt per question type, and the same wording across the types a sheet mixes (put the answer-form wording in every type's prompt), so a sheet can hoist it.

## Condensed wording — a Worksheet setting

A question may carry `_condensedLines` (`["$123.45$", "(3 d.p.)"]`: the question, then a small tag) beside its ordinary `lines`. When any question on the sheet has it, the Worksheet **Settings** popover shows a **Condensed wording** switch (off by default, remembered per tool for the session); on, the worksheet cells show the condensed form (`condensedOf`, `src/shared/prompts.ts`: the first line large, the tag at half size in slate via `_tagged`). It is a display setting, never a Question Option, and it does not regenerate anything; print and the whiteboard keep the full wording. Reference: Rounding's text questions (Level 3, and Significant Figures with the number line off). <!-- R15 -->

## Worksheet answers — in place of the question, one cell at a time

With answers up, a text cell shows its **answer** (large, green) instead of the question with the answer squeezed beneath it; a **double-tap** on a cell flips just that cell between question and answer (`flips` in `ToolShell`, keyed by question key), so answers can be revealed one at a time, and the Show Answers switch resets every cell. A cell with a picture (a `questionRenderer` question that is not `worded`) keeps the picture and gets the answer under it. The cell's regenerate button stops its own pointer-up so it never counts as half of a double-tap. <!-- ref -->

## Whiteboard answer — in place of the question

On the Whiteboard (embedded and fullscreen) a tool with the default question display shows its answer **instead of** the question when Show Answer is pressed: the question and the answer share one grid cell (`questionOrAnswer` in `WhiteboardView`), the one not showing is `visibility: hidden`, so the box is sized for the larger and nothing shrinks or jumps. A tool with a `questionRenderer` draws its own answer: where it adds a line under a picture, reserve that line's room with `visibility: hidden` rather than mounting it on reveal (Perimeter & Area). The question box also fit-scales its content (`ScaleToFit`, shrink only unless the working panel is collapsed), so a tall diagram or wordy question stays inside it.

## Fullscreen worksheet — fits itself to the screen

Fullscreen sizes the sheet's text itself (`wfs` in `ToolShell`): it starts from the largest size, waits for the maths to draw, steps down until the sheet fits the screen height, and stretches the rows to fill what is left. Pressing a text-size button takes over (an **Auto-fit** button then returns to it); it re-fits when the columns, the sheet or the window change. **Showing answers never re-fits** (that re-laid the page out): the fit draws every cell as its answer (`fsProbe`, the tallest it gets) and settles on one size, so Show Answers and per-cell flips never change the layout. Worksheet text sizes run `text-lg` to `text-7xl`. **Every cell stays the same size** (a standing priority): columns are `minmax(0, 1fr)`; once the text fits, the rows are `minmax(0, 1fr)` too and split the screen exactly (when it cannot fit, rows are `1fr` and the sheet scrolls, every row as tall as the tallest). A differentiated level's box spans the shared rows with a spacer row at the foot instead of bottom padding (a subgrid adds its padding to its last track, which made each column's last cell shorter), and each level says its own shared prompt once under its heading. <!-- R16 -->

## Working scaffold — content inside the working box

The working box is otherwise blank space (the teacher writes on it, or the visualiser camera fills it). A tool can put a **scaffold** in it with `workingScaffold` — e.g. the shared place value table, empty until Show Answer fills it. The box's button cluster gains a toggle that hides/shows the scaffold (session-only, default shown), so the teacher can remove it when students no longer need it. The scaffold is fit-scaled into the box. `qo.scaffoldVisible` (on the snapshot given to `questionRenderer`) is true while the scaffold is actually on screen, so a renderer can drop content the scaffold already shows (the decimal tool omits its inline "= answer" while its table shows the answer row). **Font sizers:** a tool with `hideFontControls` gets the size chevrons back while a `placement: "question"` scaffold is hidden (and the question stops auto-fitting to fill, so the chevrons work). **Placement:** default is the working box; `placement: "question"` draws it inside the question box under the question (and answer) instead — works with the default question display as well as a `questionRenderer`; third option, `placement: "workingCorner"` (+ `cornerWidth` px), pins a SMALL scaffold to the top-left of the working box (not fit-scaled, so the rest of the box stays free to write in; the hide button still works) — Order of Operations uses it for the BIDMAS pyramid (the hide button moves to the question box's cluster) — use it with `collapseWorkingByDefault: true` for a wide scaffold like a place value table, so it runs full width. References: `src/tools/Number/DecimalAddSub.tsx` and `src/tools/Number/PowersOfTen.tsx` (both `placement: "question"`; Powers of 10 still draws its filled grid through the question renderer in Worked Example, where the scaffold isn't shown).

## Collapsible working / visualiser panel

The whiteboard's right-hand **working / visualiser panel** can be collapsed via the **collapse button** (top-right of the panel) in both the embedded and fullscreen views. When collapsed, the panel is removed and the question box expands to fill the full width, with its contents **scaled up to fit** (`ScaleToFit`) so SVGs/diagrams and text genuinely grow into the reclaimed space — ideal for large diagrams in fullscreen. A **re-open button** (`PanelRightOpen`) then lives inside the question box's top-right control cluster (next to the font-size chevrons), so the panel is always recoverable — including fullscreen-expanded, and on diagram tools that hide the font controls. The **Fullscreen / Exit Fullscreen** button moves into that same cluster while the panel is collapsed, so it is always present (always last, after the panel re-open button, matching the open panel's collapse-then-fullscreen order). The panel is never gone for good; it stays available in every tool. State is session-only (resets on reload). Diagram-heavy tools can start collapsed with `defaults={{ collapseWorkingByDefault: true }}`. <!-- ref -->

Font size indices: `0=text-lg  1=text-xl  2=text-3xl  3=text-4xl  4=text-5xl  5=text-7xl`

## What ToolShell provides automatically (never re-implement) <!-- R10 -->

**"About this tool"** (`InfoModal` + `src/shared/about.ts`: burger menu item; the tool's purpose, then each sub-tool with its purpose, what its levels mean and its Question Options, all read from `TOOL_CONFIG` — no explanation of the modes; opens once per live tool per device from a plain address, `setLivePaths` in `App.tsx`, reset from the landing menu) — used by ToolShell, DecisionShell (built from its tabs' `blurb`, `levelLabels` and options) and CSShell, the word games, the Visualiser and the Parallel Lines Explorer (their hand-written notes, passed as `infoSections` to the shared `InfoModal`, which also opens once on a first visit). **The words live in `<Tool>.about.ts`** (`ABOUT: ToolAbout`: `purpose`; per sub-tool a `purpose` and one short plain line per level; and `options`, one plain sentence for every Question Option group by its id — the key, or `key@<levels>` where one key means different choices at different levels — shared by the tool or overridden per sub-tool; `applyAbout` writes it onto copies of the pools, switches and dropdowns as their `info`, so the About panel and the level pop-up (the (i) beside the level buttons, then a level) say the same thing; the options popover itself carries no (i) next to each option. The About panel shows the choices of each pool or dropdown as a plain list line under the explainer, and the level pop-up shows them as pills. **Write each explainer as what the group is for, never a list of its choices**: the level pop-up shows the choices as pills right under it (ticked ones highlighted), so "What to round to." is right and "What to round to: the nearest 10, 100 or 1000." is not (`levelLabels.test.ts` fails on a one-sentence `: a, b or c` tail; a sentence that explains what the choices *do* — "Skills gives single-skill questions. Exam style gives…" — is fine), and `levelLabels.test.ts` fails for any option left unexplained), applied with `applyAbout(TOOL_CONFIG, ABOUT)` just before `export const __test`; the same level text feeds the level (i) beside the level buttons, so the two always agree (`levelLabels.test.ts` requires them and limits their length; no jargon) · Whiteboard / Worked Example / Worksheet modes (the Worksheet has a Fullscreen button on the laptop layout: edge-to-edge sheet with its own columns, text size and answers bar) · **Teach mode (when `teachingSlides` supplied)** · difficulty toggle · QO popovers (dropdown, variables, multiSelect, differentiated) · tool tab buttons (auto-hidden when only one sub-tool) · font size controls · PDF print · info modal · home button · shareable links (URL ⇄ state sync + "Copy Link to Setup" menu item) · **step-by-step Worked Example (the cascade — earlier steps stay on screen, dimmed — with Show All as the alternative) with fragment walking and skill-link overlays** — tools only author `string[]` steps and `[[skill-id|term]]` markers; never re-implement the reveal or the overlay <!-- R10 R11 -->

## Shareable links — URL parameter format

ToolShell mirrors the current setup into the URL query string (`history.replaceState`, only non-default values), so the address bar is always bookmarkable and the burger menu's "Copy Link to Setup" copies it. Opening a link restores the full setup; a `mode=worksheet` link auto-generates the worksheet on arrival. Invalid/stale params fall back to defaults — old links never break. <!-- R18 -->

| Param | Meaning | Example |
|---|---|---|
| `tool` | sub-tool key (omitted for the first tab) | `tool=findingRoots` |
| `mode` | `example`, `worksheet` or `teach` (whiteboard is default) | `mode=worksheet` |
| `level` | `1` `2` `3` | `level=2` |
| `dd` | dropdown value for the current tool+level | `dd=fraction` |
| `vars` | variable toggles; `-` prefix = off | `vars=integerC,-negCoeff` |
| `ms` | multiSelect options; `-` prefix = off | `ms=bothNeg,-typeA` |
| `n` / `cols` | worksheet question count / columns | `n=20&cols=2` |
| `diff` | differentiated worksheet flag | `diff=1` |

Only the current tool+level's QO state is encoded (the URL reflects what is on screen). Differentiated per-level QO customisation and advanced-mode groups are not encoded. Tools get all of this for free — never re-implement URL handling in a tool file. <!-- R10 -->

## Shell failures name the part that broke (`shellDiagnostics.ts`)

Every screen of the shell (Whiteboard, Worked Example, Worksheet and its control panel, the phone layout, Depth, Teach, the advanced builder) runs inside a `ShellPartBoundary`. If one fails to draw, only that screen is replaced by a short message naming it with a **Try again** button; the menu, the tabs and the way home keep working. Generator calls (a new question, a worksheet, one regenerated cell, a Question Option change) run behind `attempt`: a throwing generator leaves the question or sheet on screen and shows a note naming what failed. Every failure is recorded by `reportShellFault` with the screen, sub-tool, level and mode: read it in the browser console as `window.__mtFaults`, or as a `[ToolShell:<part>]` console error. Tools add nothing; **never swallow an error inside a tool's own generator** (let it throw so the shell can name it). Checks: `src/tests/shellDiagnostics.test.ts`, and `npm run smoke:shell` (opens every screen of three representative tools at laptop, tablet and phone sizes in a real browser and fails naming any screen that reported a fault; needs Playwright, not a project dependency; `SMOKE_TOOLS=/rounding` narrows it). Run it after any change under `src/shared/`. **Lint:** `npm run lint` (ESLint, React hooks rules only; runs in CI beside the build and tests, and `smoke:shell` runs in CI as its own job). A new effect, memo or callback must list everything it reads. Where it should deliberately react to less, switch the check off on that line with a reason: `// eslint-disable-line react-hooks/exhaustive-deps -- deliberate: <why>` (`src/tests/hookDisables.test.ts` fails without it anywhere under `src/`). <!-- R12 R13 -->

## Single sub-tool — no tab buttons needed

If `config.tools` has exactly one key, the tool tab buttons are **automatically hidden**. Nothing special needed.

## `levels` — sub-tools with fewer than three levels

Not every topic has three honest difficulty rungs (e.g. number-base conversions: one nibble, then a
byte — the spec stops there). Set `levels` on the **sub-tool's `ToolEntry`** (per sub-tool, so tabs
in one tool can differ):

```ts
binaryShifts: { name: "Binary Shifts", …, levels: ["level1", "level2"] },
```

Unlisted levels are **hidden** everywhere — whiteboard/worked-example toggles, the worksheet level
row, the differentiated picker (two levels → a two-column differentiated sheet), the advanced
builder. With one level the
difficulty toggle (and Differentiated button) disappear, as tool tabs do with one sub-tool.
Switching tab clamps the level to the new sub-tool's set, and a `level=` URL param outside the set
falls back to its first level. The smoke tests skip hidden levels automatically. Put
difficulty *variety within* a level into QO pools, not extra levels. Reference:
`src/tools/Binary/NumberBases.tsx`.

---

**No repeats in recent questions.** `handleNewQuestion` (Whiteboard, Worked Example, phone view) draws through `useRecentQuestions` (`src/shared/recentQuestions.ts`): the question is a repeat if either its full content fingerprint (everything but `key`, `_seed`, `_qo`, the difficulty scores, `_category` and `working`) or its shown fingerprint (the wording, the answer and the text drawn on the picture: any `label`, `text` or `caption` field of the picture data) matches one of the last 15; it is regenerated up to 30 times. The check deliberately errs towards refusing. Tools add nothing; a tool never needs a hand-built key for this. <!-- ref -->

## QO-driven behaviour — how ToolShell reacts to option changes

**Changing a Question Option never throws the current question away** (Whiteboard and Worked Example; Worksheet is unaffected). The question on screen stays, and the *next* question follows the new options, so a teacher can change their mind without losing the question they are on. ToolShell tracks a `qoFingerprint`; when it changes: <!-- R14 -->

1. **Level or sub-tool changed** → a fresh `generateQuestion` (always). <!-- ref -->
2. **Otherwise**, if the tool supplies `reformatQuestion` and it returns a question → that replaces the current one (same maths, new display).
3. **Otherwise**, if every option that changed is **`displayOnly`** (on a dropdown, variable or multiSelect group; a dropdown with `workedExampleOnly` counts) → the shell **replays the question from its saved seed** with the new options: same numbers, new display, instantly, with no per-tool code. Every question generated for the Whiteboard / Worked Example carries `_seed` (`generateSeeded` / `replaySeeded`, `src/shared/seededGenerate.ts`, which runs the generator with a seeded `Math.random`).
4. **Otherwise** → nothing happens to the current question.

So to make an option reformat instantly, mark it `displayOnly: true` — nothing else. Only mark an option that changes how the SAME question is shown (decimal ↔ fraction, headings, a hint, a method of working); `src/tests/seededReformat.test.ts` replays every flagged variable and fails if the answer changes. Never flag an option that changes the numbers, the ranges or what is asked. A switch whose answer line is worded differently when flipped, with the same question and result (Best Buys' comparison unit), also sets `rewordsAnswer: true`; the test then checks the question text is identical instead of the answer. `reformatQuestion` below is still available for a tool that needs to rebuild its display by hand. <!-- R14 -->

**DecisionShell follows the same rule.** Changing a (non-top) Question Option leaves the current problem on screen and the next one follows the new options; a `ShellOption` marked `displayOnly: true` redraws the current problem at once from its saved seed (`_seed`). Changing the level, the tab, or a top-tier option still gives a fresh problem.

### `reformatQuestion` — implementation pattern

Store raw parameters on the question at generation time:

```ts
return {
  kind: "simple",
  // ...
  _rawValues: rv,    // store raw params so reformatQuestion can recompute display
  key: `...`,
  difficulty: level,
} as unknown as AnyQuestion;
```

Provide `reformatQuestion` alongside the generators:

```ts
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const rv = extras(q)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const built = buildDisplay(rv, qo.dropdownValue === "fraction");
  return {
    ...q,
    displayLatex: built.displayLatex,
    answerLatex: built.answerLatex,
    working: built.working,
  } as unknown as AnyQuestion;
};
```

Pass it to `<ToolShell reformatQuestion={reformatQuestion} />`.

**Reference implementation:** `src/tools/Algebra/CompletingTheSquare.tsx`

---
