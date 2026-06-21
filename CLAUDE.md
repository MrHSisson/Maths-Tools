# Maths Tools — Claude Code Instructions

## What this file is

CLAUDE.md is read automatically by Claude Code at the start of every session. It is the single source of truth for this codebase — every interface, type, export, and convention is documented here so no shared source files need to be read before starting work.

---

## What this project is

A React/TypeScript/Vite app of interactive maths tools for teachers. Each tool has three modes — Whiteboard, Worked Example, Worksheet — with Levels 1–3, differentiated worksheets, and PDF export. Deployed to Vercel. CI runs on every push via `.github/workflows/ci.yml`.

**Claude's job:** build complete new tools end-to-end from a user spec. The user provides the maths content; Claude writes all the code, registers the route, and pushes.

---

## The `Unpublished/` folder — leave alone

`Unpublished/` (repo root, sibling to `src/`) holds old v1.x tool files that are not ready to publish and not registered anywhere — a personal archive/reference area, not part of the app.

It is deliberately kept **outside** `src/` and is explicitly excluded in `tsconfig.json`, so it cannot break `tsc`, the Vite build, the vitest smoke tests (`src/tools/**/*.tsx` glob), or Vercel deploys, no matter how broken the contents are.

**Never**, unless the user explicitly asks for a specific file in this folder:
- Migrate, fix, or build any tool from here to v2.3
- Move its contents into `src/`, or register anything from it in `src/registry.ts`
- Treat it as part of the "migrate old tools" backlog in the section below

Reading a file here for reference (e.g. porting maths logic into a brand-new v2.3 tool) is fine.

---

## Branch convention

Each Claude Code session works on its own freshly created branch (e.g. `claude/<session-name>`), branched from an up-to-date `main`. Never push directly to `main`.

### The cycle for each session

1. **Run `npm install` first.** The container clones the repo fresh — `node_modules/` does not exist until you install. Without it, `tsc` resolves to the system-global TypeScript and reports thousands of false errors. With it, the build is completely clean.
2. **Start from a fresh, up-to-date `main`.** Pull before branching.
3. **Do all the session's work on that one branch.** One branch per logical unit of work.
4. **Open a PR and merge it into `main`** when work is complete and build is clean.
5. **Delete the branch once merged.**
6. **Repeat for the next session on a brand new branch off the latest `main`.**

### Conflict-resolution discipline

- Resolve conflicts by hand — never with a broad regex-based script.
- After resolving, run `npm install && npm run build` and confirm zero errors — not just a grep for a hand-picked subset of codes.
- Prefer a regular merge over a squash merge for branches that contain merge commits.

### Concurrent sessions

Keep concurrent sessions on disjoint files/tools. Two sessions editing the same file will produce merge conflicts.

---

## Implementing from a spec (`specs/`)

The preferred pipeline: the user designs the tool conversationally in a claude.ai Project (instructions in `TOOL_DESIGNER_PROMPT.md`), which outputs a completed spec following `TOOL_SPEC_TEMPLATE.md`. Specs live in `specs/<tool-id>.md`.

When the user provides a spec (pasted, or already in `specs/`):

1. Save it to `specs/<tool-id>.md` if not already there.
2. Only implement specs with `Status: ready`. If sections are missing or ambiguous, ask before building — otherwise build **without further questions**.
3. The spec's **sample questions (acceptance set)** define correctness: verify the generator produces questions of those shapes with matching answers and working steps before pushing.
4. Take INFO_SECTIONS content from the spec's info modal section.
5. After the tool builds clean and tests pass, change the spec's status line to `**Status:** implemented` in the same commit.

For ad-hoc requests without a spec, gather the details in "What to ask the user for" below.

---

## How to create a new tool — complete checklist

### 1. Scaffold the tool file

```bash
npm run new-tool -- --name "Display Name" --category <Folder> --path /url-path --description "One sentence."
```

This copies the canonical template (`src/tools/TeacherTools/ToolShell.tsx`) to `src/tools/<Folder>/<DisplayName>.tsx` and registers it in `src/registry.ts` with `enabled: false`. (Manual alternative: copy the template and add the registry entry yourself.)

### 2. Fill in the tool-specific section only

- Types → TOOL_CONFIG → INFO_SECTIONS → generateQuestion
- `generateUniqueQ` is **not needed** — ToolShell wraps `generateQuestion` with the standard retry-until-unique loop automatically. Only write one for non-standard uniqueness handling.
- Keep the `export const __test = { TOOL_CONFIG, generateQuestion }` export — the CI smoke tests discover tools through it. Add `levels: ["level1", "level2"]` to it if some levels are coming soon.
- Leave the imports and `export default function App()` unchanged.

### 3. Registry entry (`src/registry.ts` — single registration point)

`src/registry.ts` is the single source of truth for every tool. `App.tsx` generates the route (lazy-loaded — each tool builds as its own chunk) and `LandingPage.tsx` renders the card from it. Do **not** edit `App.tsx` or `LandingPage.tsx`. The scaffold script adds the entry; review it and remove `enabled: false` when the tool is ready to go live:

```ts
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence.', ready: 'v2.3', load: () => import('./tools/Category/MyNewTool') }
```

### 4. Build, test and push

```bash
npm install     # required — node_modules/ is not present in a fresh container
npm run build   # must complete with zero TypeScript errors
npm test        # generator smoke tests — validates keys + every KaTeX string
git add src/tools/... src/registry.ts specs/...
git commit -m "Add <ToolName> tool"
git push
```

---

## How to migrate an old tool to v2.3

Old tools (v1.x) are 800–1,300 lines with embedded UI. v2.3 tools use the shared ToolShell and are ~250–350 lines.

### Identifying old tools

Check the tool's `ready` version in `src/registry.ts`. Any tool below `v2.0` uses an old shell. The file will have no `import { ToolShell } from "../../shared"` line.

Tools currently needing migration (v1.x as of this writing):
- `src/tools/Number/IntegerAddSub.tsx` — v1.4, number line diagram questions
- `src/tools/Number/PowersOfTen.tsx` — v1.4, place value table questions
- `src/tools/Proportion/SimplifyingRatiosTool.tsx` — v1.4
- `src/tools/Proportion/FractionToRatio.tsx` — v1.4
- `src/tools/Algebra/` — several v1.4 expanding brackets tools (some `enabled: false`)
- `src/tools/Geometry/` — AnglesInTriangles, CircleProperties
- Generator tools (`TimesTablesGenerator`, etc.) — v1.0, primarily PDF-generation tools

### Migration checklist

1. Replace all imports with the minimal shared import set
2. Delete all local type definitions — use `AnyQuestion`, `ToolConfig`, etc. from shared
3. Keep TOOL_CONFIG content, annotate as `: ToolConfig`
4. Keep INFO_SECTIONS content, annotate as `: InfoSection[]`
5. Keep all math generation functions
6. Convert question return types — use `SimpleQuestion` or `WordedQuestion` structure
7. Convert working steps — `mStep()` / `step()` / `tStep()`
8. Delete all UI code (DifficultyToggle, popovers, InfoModal, MenuDropdown, all `useState`/`useEffect`)
9. Delete any local `generateUniqueQ` — ToolShell provides the retry loop automatically
10. Replace the export with `export default function App() { return <ToolShell ... /> }`
11. Add `export const __test = { TOOL_CONFIG, generateQuestion }` so the CI smoke tests cover the tool
12. Update the tool's `ready` version in `src/registry.ts` to `v2.3`

### Old pattern → new pattern

| Old (v1.x) | New (v2.3) |
|---|---|
| `import { useNavigate } from 'react-router-dom'` | Remove entirely |
| `const navigate = useNavigate(); navigate('/')` | `window.location.href = "/"` |
| `type Question = { display, answer, working, ... }` | `import { type AnyQuestion }` from shared |
| `type ToolSettings = { ... }` | `import { type ToolConfig }` from shared |
| `{ type: 'step', content: '...' }` | `mStep(...)` / `step(...)` / `tStep(...)` |
| Custom `getQuestionUniqueKey` + display-based dedup | Use `q.key` directly in `generateUniqueQ` |
| `export default function ToolNameTool()` with full JSX | `export default function App() { return <ToolShell ... /> }` |
| `displayType: 'fraction'` with custom HTML renderer | `displayLatex: "\\dfrac{num}{den}"` on SimpleQuestion |
| `declare global { interface Window { katex: any } }` | `const w = () => window as any` |

---

## Shared library (`src/shared/`) — complete API reference

All tools import exclusively from `"../../shared"`. Never read the shared source files to discover the API — it is fully documented here.

### Minimal import set for a new tool

```ts
import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  randInt, pick, step, mStep, tStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";
```

For tools using `reformatQuestion`, `stepRenderer`, or QO snapshots, also import:
```ts
import { type WorkingStep, type QOSnapshot } from "../../shared";
```

For diagram/SVG tools also import:
```ts
import { type PrintMode } from "../../shared";
```

### All available exports from `src/shared/`

**Types** (use `type` keyword in imports):
`DifficultyLevel` · `PrintMode` · `AnyQuestion` · `SimpleQuestion` · `WordedQuestion` · `WorkingStep` · `ToolConfig` · `ToolEntry` · `ToolDropdown` · `ToolMultiSelect` · `ToolMultiSelectConfig` · `ToolVariable` · `DifficultyLevelSettings` · `InfoSection` · `InfoItem` · `QOSnapshot` · `ToolShellDefaults` · `ToolShellProps`

**Components / hooks**:
`ToolShell` · `MathRenderer` · `InlineMath` · `QuestionDisplay` · `AnswerDisplay` · `DifficultyToggle` · `StandardQOPopover` · `DiffQOPopover` · `InlineQOPanel` · `InfoModal` · `MenuDropdown` · `PrintSplitButton`

**Helpers**:
`randInt` · `pick` · `fracStr` · `mStr` · `pickActive` · `normalizeMultiSelect` · `step` · `tStep` · `mStep` · `fmt` · `ansEq` · `makeUniqueQ`

**Utilities**:
`loadKaTeX` · `handlePrint` · `LV_COLORS` · `LV_LABELS` · `LV_HEADER_COLORS` · `getQuestionBg` · `getStepBg`

---

## Key types — full definitions

### `WorkingStep`
```ts
interface WorkingStep {
  type: string;       // "step" | "mStep" | "tStep"
  latex: string;      // KaTeX string — always present
  plain: string;      // plain-text fallback
  label?: string;     // mStep only — left-aligned prose label
  unit?: string;      // mStep only — plain-text unit appended after KaTeX
  extra?: unknown;    // arbitrary payload for tool-specific use
}
```
Always create `WorkingStep` objects via the helpers (`step`, `mStep`, `tStep`) — never construct raw objects.

### `QOSnapshot`
```ts
interface QOSnapshot {
  level: DifficultyLevel;                 // "level1" | "level2" | "level3"
  variables: Record<string, boolean>;     // variable key → current on/off value
  dropdownValue: string;                  // current dropdown selection
  multiSelectValues: Record<string, boolean>; // option value → active
}
```
Passed to renderer props and `reformatQuestion` so they can read the live QO state without separate prop-drilling.

### `SimpleQuestion`
```ts
{
  kind: "simple";
  display: string;          // plain-text fallback
  displayLatex?: string;    // KaTeX — use for all maths content
  answer: string;           // plain-text fallback
  answerLatex?: string;     // KaTeX answer
  answerSuffix?: string;    // plain-text unit after answerLatex (never put units in KaTeX)
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;            // reserved — do not use
}
```

### `WordedQuestion`
```ts
{
  kind: "worded";
  lines: string[];          // each line can contain $...$ for InlineMath
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;
}
```

### `AnyQuestion`
```ts
type AnyQuestion = SimpleQuestion | WordedQuestion;
```

### Key rules for questions
- Keys must be unique within a worksheet — include all parameters that vary the question
- Always append a random `id` (`Math.floor(Math.random() * 1_000_000)`) to prevent false duplicates
- Store tool-specific data (diagram, raw params) in underscore fields: `_diagram`, `_rawValues`, etc. Cast through `unknown`: `} as unknown as AnyQuestion`
- Retrieve in renderers: `const d = (q as any)._rawValues as MyType | undefined`
- `answerSuffix` is always plain text — never put units inside KaTeX

---

## `ToolShellProps` — complete interface

`ToolShellProps` is defined and exported from `src/shared/ToolShell.tsx`. Do not read that file — this section is the authoritative reference.

```ts
export interface ToolShellProps {
  // ── Required ────────────────────────────────────────────────────────────────
  config: ToolConfig;
  infoSections: InfoSection[];

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
    colorScheme: string,
    compact?: boolean,
    idx?: number,
    qo?: QOSnapshot,
    fontClass?: string,
  ) => JSX.Element | null;

  /** Replaces AnswerDisplay. Shown when answer is revealed. */
  answerRenderer?: (
    q: AnyQuestion,
    colorScheme: string,
    qo?: QOSnapshot,
  ) => JSX.Element | null;

  /** Replaces default step rendering in the worked-example step list. */
  stepRenderer?: (
    step: WorkingStep,
    colorScheme: string,
    qo?: QOSnapshot,
  ) => JSX.Element | null;

  /** Called when a QO option changes, before falling back to full regeneration.
   *  Return a reformatted copy of the question (same maths, different display),
   *  or null to let ToolShell generate a fresh question instead.
   *  Use this for instant display-mode switches (e.g. decimal ↔ fraction). */
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
}
```

### `defaults` — per-tool overrides

```ts
defaults?: {
  displayFontSize?: number;             // starting font size index 0–5, default 2 (text-3xl)
  worksheetFontSize?: number;           // starting font size index 0–5, default 1 (text-xl)
  numQuestions?: number;                // starting question count, default 15
  fixedQuestions?: boolean;             // hides the questions input entirely
  numColumns?: number;                  // starting column count, default 3
  fixedColumns?: boolean;               // hides the columns input entirely
  maxColumns?: number;                  // caps the columns input max (e.g. 3 = no 4-col option)
  comingSoonLevels?: DifficultyLevel[]; // levels shown but disabled — "Coming soon" on hover
  hideFontControls?: boolean;           // hides the text-size up/down chevrons (diagram-only tools)
  collapseWorkingByDefault?: boolean;   // whiteboard opens with the working/visualiser panel collapsed (diagram-heavy tools)
}
```

### Collapsible working / visualiser panel

The whiteboard's right-hand **working / visualiser panel** can be collapsed via the **collapse button** (top-right of the panel) in both the embedded and fullscreen views. When collapsed, the panel is removed and the question box expands to fill the full width, with its contents **scaled up to fit** (`ScaleToFit`) so SVGs/diagrams and text genuinely grow into the reclaimed space — ideal for large diagrams in fullscreen. A **re-open button** (`PanelRightOpen`) then lives inside the question box's top-right control cluster (next to the font-size chevrons), so the panel is always recoverable — including fullscreen-expanded, and on diagram tools that hide the font controls. The panel is never gone for good; it stays available in every tool. State is session-only (resets on reload). Diagram-heavy tools can start collapsed with `defaults={{ collapseWorkingByDefault: true }}`.

Font size indices: `0=text-lg  1=text-xl  2=text-3xl  3=text-4xl  4=text-5xl  5=text-7xl`

### What ToolShell provides automatically (never re-implement)

Whiteboard / Worked Example / Worksheet modes · difficulty toggle · QO popovers (dropdown, variables, multiSelect, differentiated) · tool tab buttons (auto-hidden when only one sub-tool) · font size controls · PDF print · colour scheme picker · info modal · home button · shareable links (URL ⇄ state sync + "Copy Link to Setup" menu item)

### Shareable links — URL parameter format

ToolShell mirrors the current setup into the URL query string (`history.replaceState`, only non-default values), so the address bar is always bookmarkable and the burger menu's "Copy Link to Setup" copies it. Opening a link restores the full setup; a `mode=worksheet` link auto-generates the worksheet on arrival. Invalid/stale params fall back to defaults — old links never break.

| Param | Meaning | Example |
|---|---|---|
| `tool` | sub-tool key (omitted for the first tab) | `tool=findingRoots` |
| `mode` | `example` or `worksheet` (whiteboard is default) | `mode=worksheet` |
| `level` | `1` `2` `3` | `level=2` |
| `dd` | dropdown value for the current tool+level | `dd=fraction` |
| `vars` | variable toggles; `-` prefix = off | `vars=integerC,-negCoeff` |
| `ms` | multiSelect options; `-` prefix = off | `ms=bothNeg,-typeA` |
| `n` / `cols` | worksheet question count / columns | `n=20&cols=2` |
| `diff` | differentiated worksheet flag | `diff=1` |

Only the current tool+level's QO state is encoded (the URL reflects what is on screen). Differentiated per-level QO customisation and advanced-mode groups are not encoded. Tools get all of this for free — never re-implement URL handling in a tool file.

### Single sub-tool — no tab buttons needed

If `config.tools` has exactly one key, the tool tab buttons are **automatically hidden**. Nothing special needed.

### `comingSoonLevels`

```ts
defaults={{ comingSoonLevels: ["level3"] }}
```

Listed levels are greyed out and unclickable with a "Coming soon" tooltip. The Differentiated button and level selectors in advanced worksheet mode also respect this.

---

## QO-driven behaviour — how ToolShell reacts to option changes

ToolShell tracks a `qoFingerprint` computed from the current dropdown value, variable values, and multiSelect values. Whenever the fingerprint changes (i.e. any QO option changes), the following happens **in whiteboard and worked-example modes only** (worksheet mode is unaffected):

1. If `reformatQuestion` is provided, call it with the current question and new QO snapshot.
   - If it returns a non-null question → swap in the reformatted question without regenerating. Use this for pure display changes (e.g. decimal ↔ fraction) where the underlying maths is unchanged.
   - If it returns `null` → fall through to step 2.
2. Call `generateQuestion` to generate a fresh question.

Changing the difficulty level or active sub-tool always triggers a fresh `generateQuestion` (they are separate deps).

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
  const rv = (q as any)._rawValues as RawValues | undefined;
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

## Helper reference

| Helper | Signature | Purpose |
|--------|-----------|---------|
| `randInt(min, max)` | `(min: number, max: number) => number` | Random integer, inclusive both ends |
| `pick(arr)` | `<T>(arr: T[]) => T` | Random element from array |
| `step(latex, plain?)` | `(latex: string, plain?: string) => WorkingStep` | Pure KaTeX working step |
| `mStep(label, latex, unit?)` | `(label: string, latex: string, unit?: string) => WorkingStep` | Prose label + KaTeX |
| `tStep(text)` | `(text: string) => WorkingStep` | Plain-text only step |
| `fracStr(n, d)` | `(n: number \| string, d: number \| string) => string` | `"$\\frac{n}{d}$"` for InlineMath |
| `mStr(x)` | `(x: number \| string) => string` | `"$x$"` — wraps value for InlineMath |
| `pickActive(values, opts)` | `(values: Record<string, boolean>, options: {value: string}[]) => string` | Random active multiSelect value |
| `fmt(n, dp?)` | `(n: number, dp?: number) => string` | Number → string, trailing zeros stripped, default 2dp |
| `ansEq(answer)` | `(answer: string) => string` | Prepends `"= "` unless answer already contains `=` |
| `normalizeMultiSelect(ms)` | `<T>(ms?: T \| T[] \| null) => T[]` | Normalises single/array multiSelect config |

### Working step rendering — how each type appears

| Call | Renders as |
|------|-----------|
| `step("16 \\div 4 = 4")` | Centred KaTeX — no label |
| `mStep("Divide by 4:", "16 \\div 4 = 4")` | Left-aligned prose label, centred KaTeX below |
| `mStep("Answer:", "12", "kg")` | Same as above, plain-text unit after KaTeX |
| `tStep("Simplify the fraction.")` | Plain text only — zero KaTeX |

**Pick `mStep` by default.** Use `step` when a label would be redundant (e.g. a chain of equals steps). Use `tStep` only for genuinely numberless prose (rare).

**Never use `\text{}` inside `step()` or `mStep()`.** Never put prose words inside `$...$`.

---

## TOOL_CONFIG format

```ts
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Displayed at top of page",
  tools: {

    subtool1: {
      name: "Button label",
      instruction: "Solve:",          // optional — shown above question in all modes

      variables: [],                  // toggle switches — prefer multiSelect instead
      dropdown: null,                 // single-select segmented buttons, or null
      multiSelect: {                  // default QO control — reach for this first
        key: "questionPool",
        label: "Question Types",
        options: [
          { value: "a", label: "Type A", defaultActive: true  },
          { value: "b", label: "Type B", defaultActive: true  },
          { value: "c", label: "Type C", defaultActive: false },
        ],
      },
      difficultySettings: null,       // null = same options at all levels
    },

  },
};
```

### QO control types

| Control | When to use |
|---------|------------|
| `multiSelect` | **Default.** Pool of question types, multiple can be active. Use `pickActive(values, options)` in the generator. |
| `dropdown` | A single mutually-exclusive setting (e.g. method choice, display format). |
| `variables` | Independent on/off toggles. Use sparingly — prefer `multiSelect`. |

### `difficultySettings` — per-level QO overrides

```ts
difficultySettings: {
  level1: { variables: [], dropdown: null },
  level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
  level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
}
```

Each level independently overrides `dropdown`, `variables`, and/or `multiSelect`. Omitted keys inherit the tool-level default.

---

## Question kinds — required fields

### `SimpleQuestion`
```ts
{
  kind: "simple",
  display: "3 + 4",           // plain-text fallback
  displayLatex: "3 + 4",      // KaTeX expression — use for all maths content
  answer: "7",
  answerLatex: "7",
  answerSuffix: "kg",         // optional plain-text unit
  working: [ step("3 + 4 = 7") ],
  key: `tool-level-a-b-${id}`,
  difficulty: level,
}
```

### `WordedQuestion`
```ts
{
  kind: "worded",
  lines: [
    `A bag weighs ${mStr(16)} kg.`,
    `Find ${fracStr(3, 4)} of it.`,
    "How many kg?",
  ],
  answer: "12 kg",
  answerLatex: "12",
  answerSuffix: "kg",
  working: [
    mStep("Divide by denominator:", "16 \\div 4 = 4"),
    mStep("Multiply by numerator:", "4 \\times 3 = 12"),
    mStep("Answer:", "12", "kg"),
  ],
  key: `tool-level-d-k-n-${id}`,
  difficulty: level,
}
```

---

## Diagram tools — custom renderers and SVG printing

For SVG-based tools (angle geometry, number lines, etc.).

**Reference implementations:** `src/tools/Geometry/AnglesInParallelLines.tsx` and `src/tools/Geometry/BasicAngleFacts.tsx`

### Storing diagram data

```ts
return {
  kind: "simple",
  display: "find x",
  answer: `x = ${xVal}°`,
  working: [...],
  key: `tool-level-${id}`,
  difficulty: level,
  _diagram: diagramData,
} as unknown as AnyQuestion;
// Retrieve: const d = (q as any)._diagram as DiagramData | undefined;
```

### `questionRenderer` — compact context table

| `compact` value | Context | Typical maxWidth |
|---|---|---|
| `true` | Worksheet cell | ~180px |
| `undefined` | Regular whiteboard panel (480px fixed) | ~340px |
| `false` | Worked example or fullscreen whiteboard | ~500px |

```tsx
const questionRenderer = (q, showAnswer, _cs, compact, idx, _qo) => {
  const d = (q as any)._diagram as DiagramData | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <MySVGDiagram d={d} showAnswer={showAnswer} qIndex={idx} />
    </div>
  );
};
```

### SVG element requirements

```tsx
<svg
  viewBox="0 0 500 500"
  style={{ display: "block", width: "100%", height: "auto" }}
  preserveAspectRatio="xMidYMid meet"
  {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
>
```

- Never use a fixed pixel height — causes overflow in the whiteboard panel
- `data-q-index` is required for the print handler to locate the SVG in the DOM

### Printing SVG worksheets — use the shared `handleDiagramPrint`

**Do not hand-write a `customPrintHandler` with a fixed grid.** Pass the shared
`handleDiagramPrint` (exported from `"../../shared"`) straight to ToolShell:

```ts
import { ToolShell, handleDiagramPrint } from "../../shared";

<ToolShell
  questionRenderer={questionRenderer}
  customPrintHandler={handleDiagramPrint}
  defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true }}
/>
```

How it works: a diagram has no measured height — only an aspect ratio — so
`handleDiagramPrint` *derives* each cell height from the chosen column width
(`cellHeight = columnWidth ÷ aspect`, aspect defaults to 1 for square diagrams),
feeds those synthetic heights to the same unit-tested `computeWorksheetLayout`
engine the text path uses, and renders the planned pages. Everything is computed
app-side and written as static HTML — no probe, no measurement round-trip.

This means SVG worksheets get, for free and with no per-tool code:
- **Variable columns = diagram size** — fewer columns → bigger diagrams, more →
  smaller/denser. Expose it by *not* setting `fixedColumns` (use `maxColumns` to
  cap, default columns via `numColumns`).
- **Sections** (advanced worksheets) — per-section columns, headers, dividers.
- **Differentiated** three-column layout and **arbitrary question counts** that
  flow across pages.

The old fixed **3×5 = 15** preset is gone. Diagrams render at their natural
square size (top-aligned), not stretched to fill the page.

**Requirements on the tool:** the worksheet `questionRenderer` must emit an
`<svg data-q-index={idx}>` (see SVG element requirements above) so the handler can
clone it. For non-square diagrams, store `_aspect` (= viewBoxWidth ÷ viewBoxHeight)
on the question; it defaults to 1.

**Reference:** `src/tools/Geometry/AnglesInQuadrilaterals.tsx`.

---

## KaTeX rendering — the rules

| Content | Correct approach |
|---------|----------------|
| Number or operator in prose | `mStr(n)` — e.g. `"A bag weighs " + mStr(16) + " kg."` |
| Fraction in prose | `fracStr(n, d)` |
| Ratio in prose | `mStr("3:4")` — no spaces around colon |
| Pure maths working step | `step("16 \\div 4 = 4")` |
| Prose label + maths result | `mStep("Divide:", "16 \\div 4 = 4")` |
| Genuinely numberless prose | `tStep("Simplify the fraction.")` |
| Question display | `displayLatex: "..."` on SimpleQuestion |

### KaTeX gotchas

- `verticalAlign` must be `"baseline"` — `"middle"` drops spans below the baseline
- `displayMode` is always `false` — wrap in a `<div>` for block display
- Plain-text answers: never wrap in `katexSpan()` in the print handler — `£`, `<`, `>` crash KaTeX silently
- In print CSS: set `font-size` on `.katex-render .katex` (inner span), not on `.katex-render` — the wrapper causes KaTeX to compound the scaling
- **Thousands separators**: plain `,` inside KaTeX math mode adds a thin space — `2,400` renders as "2, 400". Use `{,}`: `2{,}400`. Pattern: `const fmtK = (n: number) => formatNumber(n).replace(/,/g, "{,}")`
- **`\text{}` in steps**: never use `\text{}` inside `step()` or `mStep()` — use `tStep()` for prose

---

## TypeScript / build rules

- `generateQuestion` must be typed `(tool: string, ...)` — cast internally: `const t = tool as ToolType;`
- Never use `useNavigate` — use `window.location.href = "/"`
- Never import `react-router-dom` inside a tool file
- Never add `declare global` — use `const w = () => window as any` for untyped globals
- Unused shared helpers: suppress with `void (tStep as unknown)` etc. — only for helpers actually imported but unused
- `currentQuestion` initialised via `useState` initialiser, never `null`
- If a tool's questions never include `"frac"` kind, remove any `q.kind === "frac"` branches — they cause TS2367
- `ToolShellProps` renderer props use `JSX.Element | null` return types in their signatures — TypeScript accepts this fine once `@types/react` is installed via `npm install`

### Build correctness — zero errors expected

With `npm install` run, `npm run build` should produce **zero TypeScript errors**. Any error in the output is a real problem to fix.

If you see a flood of TS7026 / TS2307 / TS2503 / TS2875 errors, `node_modules/` is missing — run `npm install` first.

```bash
npm install && npm run build 2>&1 | grep "error TS"
# should return nothing
```

### Generator smoke tests — `npm test`

CI also runs `npm test` (Vitest, `src/tests/generators.test.ts`). The suite discovers every tool exporting `__test = { TOOL_CONFIG, generateQuestion }` and, for each sub-tool × level with default QO settings, generates 40 questions asserting: no throw, unique non-empty keys, and every KaTeX string (`displayLatex`, `answerLatex`, working-step latex, `$...$` segments in worded lines) renders under `katex.renderToString` with `throwOnError`. This catches `£`/`<` in KaTeX, malformed latex, and key collisions at CI time. **Every new or migrated tool must keep its `__test` export.** Restrict levels with `levels: ["level1", "level2"]` when a level is coming soon.

---

## PDF print — edge cases

- `totalPages`, `printMode`, and any `var` referenced inside a function declaration must be declared in the injected script's **outer scope** — declaring them inside `buildPage` causes "not defined" at runtime
- Params appearing only as `${...}` in the HTML string are invisible to TypeScript — use distinct names (e.g. `pMode` not `printMode`) and add `void (param as unknown)` suppressions before the template literal
- If a tool has only worded questions, remove `"simple"` and `"frac"` branches from `questionToHtml` — TS2367 otherwise
- For SVG tools use `handleDiagramPrint` (via `customPrintHandler`) — the text `handlePrint` has no SVG support

---

## Categories and file locations

| Category | Folder | LandingPage gradient |
|----------|--------|---------------------|
| Generators | `src/tools/Generators/` | blue → indigo |
| Number | `src/tools/Number/` | cyan → sky |
| Algebra | `src/tools/Algebra/` | purple → fuchsia |
| Ratio & Proportion | `src/tools/Proportion/` | emerald → teal |
| Geometry | `src/tools/Geometry/` | amber → orange |
| Probability & Statistics | `src/tools/` (root) | pink → rose |
| Teacher Tools | `src/tools/TeacherTools/` | violet → purple |
| Computer Science | `src/tools/ComputerScience/` | slate → slate |

---

## Reference implementations — which file to look at

| Pattern | Reference file |
|---------|---------------|
| Standard v2.3 tool (simple questions) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Standard v2.3 tool (worded questions) | `src/tools/Proportion/SimplifyingRatios.tsx` *(check if migrated)* |
| Diagram/SVG tool with shared print (`handleDiagramPrint`) | `src/tools/Geometry/AnglesInQuadrilaterals.tsx` |
| Diagram/SVG tool (renderer/SVG conventions) | `src/tools/Geometry/AnglesInParallelLines.tsx` |
| `reformatQuestion` (instant display reformat) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Multi-group `multiSelect` | search for `ToolMultiSelect[]` in `src/tools/` |
| `difficultySettings` per-level QO | `src/tools/Algebra/CompletingTheSquare.tsx` |

---

## What to ask the user for (new tool spec)

**Only for ad-hoc requests with no spec.** The preferred route is a completed `specs/<tool-id>.md` (see "Implementing from a spec" at the top of this file) — if one exists or the user can produce one via the Tool Designer project, use that instead of asking these questions.

1. **Tool name** — display name, e.g. "Multiplying Fractions"
2. **URL path** — e.g. `/multiplying-fractions`
3. **Category** — which section on the landing page
4. **Description** — one sentence for the landing page card
5. **Sub-tools** — names of the tab buttons (1–5). One sub-tool → tabs hidden automatically.
6. **For each sub-tool:**
   - Question type: simple, worded, or diagram/SVG
   - Level 1 / 2 / 3 — what changes at each level (or "coming soon")
   - QO options: dropdowns, variables, multiSelect
   - `instruction`? e.g. "Simplify:", "Solve:", "Find:"
7. **Worked example steps** — how the solution is explained at each level
8. **Defaults** — non-standard font size, question count, column constraints, coming-soon levels

Claude drafts `INFO_SECTIONS` from the above — the user does not need to write it.
