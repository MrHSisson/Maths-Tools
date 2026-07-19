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
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence.', load: () => import('./tools/Category/MyNewTool') }
```

The registry entry has no version/`ready` field — tools carry no version label. The landing page shows only a "Dev" badge for `enabled: false` tools; there is no version badge.

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

Old tools are 800–1,300 lines with embedded UI. v2.3 tools use the shared ToolShell and are ~250–350 lines.

### Identifying old tools

The reliable shell indicator is the code, not any registry field (tools carry no version label). A v2.3 tool imports `ToolShell` from `"../../shared"` and renders `<ToolShell … />` in its `App()`; an old tool has neither and hand-rolls its own shell. Confirm with:

```bash
grep -L "<ToolShell" src/tools/**/*.tsx   # files that do NOT render the shared shell
```

Tools currently needing migration (still on an embedded old shell, enabled):
- `src/tools/Proportion/FractionsOfAmounts.tsx`
- `src/tools/Proportion/FractionToRatio.tsx`
- `src/tools/Geometry/AnglesInTriangles.tsx`
- `src/tools/ComputerScience/SystemArchitecture.tsx` — a quiz tool, not a question generator
- Generator tools (`TimesTablesGenerator`, etc.) — primarily PDF-generation tools

Dev-gated (`enabled: false`) and therefore lower priority: `IntegerAddSub`, `PowersOfTen`, `SimplifyingRatiosTool`, `PerimeterTool`.

AlgebraTiles, SkillLibrary, Visualiser, CallSelector and p-value are standalone by design (not question tools) and never migrate to ToolShell — they are not part of the backlog above even though they don't use the shared shell.

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
12. Remove the tool from the migration backlog list in this file (registry entries carry no version field to update)

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
`DifficultyLevel` · `PrintMode` · `AnyQuestion` · `SimpleQuestion` · `WordedQuestion` · `WorkingStep` · `ToolConfig` · `ToolEntry` · `ToolDropdown` · `ToolMultiSelect` · `ToolMultiSelectConfig` · `ToolVariable` · `DifficultyLevelSettings` · `InfoSection` · `InfoItem` · `QOSnapshot` · `ToolShellDefaults` · `ToolShellProps` · `TeachingSlide` · `TeachBlock` · `TeachBar` · `TeachScene` · `TeachCategory` · `SkillDef`

**Components / hooks**:
`ToolShell` · `TeachingDeck` · `SlideDeck` · `MathRenderer` · `InlineMath` · `QuestionDisplay` · `AnswerDisplay` · `DifficultyToggle` · `StandardQOPopover` · `DiffQOPopover` · `InlineQOPanel` · `InfoModal` · `MenuDropdown` · `PrintSplitButton` · `SkillLabel` · `SkillOverlay`

**Helpers**:
`randInt` · `pick` · `fracStr` · `mStr` · `pickActive` · `normalizeMultiSelect` · `step` · `tStep` · `mStep` · `fmt` · `ansEq` · `makeUniqueQ` · `stripSkillMarkers` · `SKILL_MARKER_RE` · `slideMaxStep`

**Skill library**: `SKILLS` · `getSkill` (see "Skill library" section)

**Utilities**:
`loadKaTeX` · `handlePrint` · `LV_COLORS` · `LV_LABELS` · `LV_HEADER_COLORS` · `getQuestionBg` · `getStepBg`

---

## Key types — full definitions

### `WorkingStep`
```ts
interface WorkingStep {
  type: string;       // "step" | "mStep" | "tStep"
  latex: string;      // KaTeX string — always present (joined from frags when authored in parts)
  plain: string;      // plain-text fallback (skill markers stripped)
  label?: string;     // mStep only — left-aligned prose label; may contain [[skill-id|term]] markers
  unit?: string;      // mStep only — plain-text unit appended after KaTeX
  frags?: string[];   // set automatically when step()/mStep() get a string[] — see "fragments"
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

  /** Optional. When provided, ToolShell shows a "Teach" mode — a PowerPoint-style
   *  deck the teacher presses through (→ / space / click; ← steps back). Omit it
   *  and no Teach tab appears. See "Teaching slides" below. */
  teachingSlides?: TeachingSlide[];
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

Whiteboard / Worked Example / Worksheet modes · **Teach mode (when `teachingSlides` supplied)** · difficulty toggle · QO popovers (dropdown, variables, multiSelect, differentiated) · tool tab buttons (auto-hidden when only one sub-tool) · font size controls · PDF print · colour scheme picker · info modal · home button · shareable links (URL ⇄ state sync + "Copy Link to Setup" menu item) · **step-by-step Worked Example with fragment walking and skill-link overlays (dev-gated)** — tools only author `string[]` steps and `[[skill-id|term]]` markers; never re-implement the reveal or the overlay

### Teaching slides — the "Teach" deck  (authoring guide / leap-off point)

The **Teach** deck (`TeachingDeck`, `src/shared/TeachingDeck.tsx`) is a slide-based "teaching part of the lesson": the teacher picks a category, then presses through hand-authored, misconception-driven slides one **beat** at a time before moving to Whiteboard / Worksheet. This section is the complete guide to authoring them.

**Status / where it's up to.** The feature is **gated behind Developing-tools mode** (`devMode`) — the Teach tab only shows when dev mode is on, so it can ship unfinished. Only `FractionsAddSub` has a deck so far: the **Concepts** category runs an I-do → We-do → You-do sequence on equivalent fractions (3/5 ×2, 3/5 ×3, then "find two"). **True or False and Spot the Mistake are empty** ("Coming soon" in the menu) — build them next as authored slides. When the deck is classroom-ready, remove the dev gate in `ToolShell.tsx` (`showTeach`).

**Add a deck to a tool.** Define an array in the tool file and pass it: `<ToolShell teachingSlides={TEACHING_SLIDES} … />`. No prop → no Teach tab. Reference implementation: `src/tools/Number/FractionsAddSub.tsx` (`TEACHING_SLIDES`); a minimal one in the `ToolShell.tsx` template.

**`SlideDeck`** is the reusable core: it plays a flat `TeachingSlide[]` one beat per press (keyboard included) and is exported from shared. `TeachingDeck` wraps it with the category menu; the skill-library overlay (`SkillOverlay`) plays a skill's slides through it directly. New slide-playing surfaces should reuse it, not reimplement beats. The slide card is **fixed-height** (62vh embedded; `fill` makes it fill the host — the skill overlay is near-fullscreen with a slim dimmed rim) with the nav controls (Back / beat counter / Next) inside the card's bottom edge — the whole surface is teaching space, no external button row. Every beat's content is laid out from the first press — captions stack in one grid cell sized to the tallest, static reveals reserve their space with the Reveal button overlaying it — so the card never resizes mid-slide. Content that would exceed the card **auto-scales down to fit** (CSS transform, measured per slide) — slides never show scrollbars, on any screen size. Scenes must follow the same rule: reserve space for everything (opacity, not mounting).

**Size for readability, never to fill.** The container claims the screen; the content does not. Scenes and text are authored at a size chosen for legibility from the back of a classroom — fit-scaling only ever scales content *down*, and nothing is ever inflated to occupy empty card space. Whitespace around a slide is calm framing, not waste; a slide that fills its card edge-to-edge is harder to read, not better.

**Authoring philosophy — read before writing slides.**
- Slides are **specific, hand-authored, misconception-driven examples** — NOT generated. The randomised/varied side is exactly what Whiteboard and Worksheet are for; do not add generators here.
- Prefer an **I-do → We-do → You-do** arc within a category, on **one coherent example** (e.g. keep the same fraction across the three). You-do should make the student **predict/answer** before the reveal.
- `title` is a short **topic label** (e.g. "Equivalent fractions"), not a sentence — it renders small and muted. The **changing caption is the voice**; put the teaching there.
- No emoji. Palette is navy shade + slate cut-lines + white cards; the phase badge sits in the top-right corner. Keep to it.

**Slide model (`TeachingSlide`).** Every slide has `category: "concept" | "trueFalse" | "spotMistake"` (`TeachCategory`) and an optional `phase: "iDo" | "weDo" | "youDo"` (`TeachPhase`, shown as the corner badge). Two kinds:

```ts
// static (default kind) — body blocks, then one optional `reveal` (one extra beat / a Reveal button)
{ category: "trueFalse", phase: "youDo", title: "$2+3=6$",
  body:   [{ t: "text", s: "Decide first." }],
  reveal: [{ t: "verdict", value: false }, { t: "note", tone: "good", label: "Correct", s: "$2+3=5$." }],
  revealLabel: "Reveal" }

// anim — a scene choreographed across beats, ONE caption per beat
{ kind: "anim", category: "concept", phase: "iDo", title: "Equivalent fractions",
  scene: { type: "split", num: 3, den: 5, factor: 2 },
  steps: ["Here is $\\dfrac{3}{5}$…", "Split the first fifth…", /* one per piece */ "…$\\dfrac{6}{10}$." ] }
```

**`TeachBlock` types (static slides):** `{ t:"text", s }` (`$...$` inline maths, `**bold**`) · `{ t:"math", s }` (large centred KaTeX) · `{ t:"bars", bars:[{num,den,label?}] }` (static shaded bars) · `{ t:"verdict", value:boolean }` (TRUE/FALSE pill) · `{ t:"note", tone?:"good"|"bad"|"plain", label?, s }` (bordered note, coloured left rule, **no emoji**).

**`TeachScene` types (anim slides)** — the beat count is **derived from the scene**, so `steps` must supply one caption per beat (fewer is allowed; the last caption persists — avoid that with `predict`):

| scene | beats (max step = beats−1) | what it does |
|---|---|---|
| `{ type:"split", num, den, factor, shadeByOne?, predict? }` | `den + 2` (`+1` if `predict`, `+num` if `shadeByOne`) | cuts ONE original piece into `factor` per press (shaded area never moves), then shows the equation `num/den = (num·f)/(den·f)`. `predict` holds the answer at `?/?` for one extra beat (You-do). |
| `{ type:"equivalents", num, den, factors:number[] }` | `factors.length + 1` | beat 0 is the prompt; each later beat reveals one `×factor` equivalent — for a "find two equivalent fractions" You-do (`factors:[2,3,4,5]` gives the four common answers). |
| `{ type:"multiples", a, b }` | `lcm/a + lcm/b + 2` | LCM walkthrough: each press writes the next multiple (a's list up to the LCM, then b's); the shared value highlights when it lands, and the final beat states `LCM(a, b)`. |
| `{ type:"factorTree", n }` | `Ω(n) + 1` (Ω = prime factors with multiplicity) | builds n's factor tree one split per press, always dividing out the smallest prime; composites are plain numbers, each prime becomes a coloured tile as it's produced; final beat states the product. |
| `{ type:"primeVenn", a, b }` | `(total primes across regions) + 2` | both factor lists shown as tile rows up front; each press crosses the next tile(s) off the list(s) and places the prime in the Venn (a shared prime strikes one tile off EACH list and puts a single tile in the middle); final beat multiplies everything for the LCM. |
| `{ type:"combine", a, b, sumLabel }` | `2` | two shaded bars (common denominator) flow into one. |

**Adding a new scene type:** extend the `TeachScene` union, add its beat count to `sceneMaxStep`, and render it in `SceneView` (+ a component). Drive animation with CSS transitions on SVG (opacity/transform), no libraries — see `SplitScene`. The URL `mode=teach` deep-links to the deck.

### Shareable links — URL parameter format

ToolShell mirrors the current setup into the URL query string (`history.replaceState`, only non-default values), so the address bar is always bookmarkable and the burger menu's "Copy Link to Setup" copies it. Opening a link restores the full setup; a `mode=worksheet` link auto-generates the worksheet on arrival. Invalid/stale params fall back to defaults — old links never break.

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
| `step(latex, plain?)` | `(latex: string \| string[], plain?: string) => WorkingStep` | Pure KaTeX working step; array = reveal-in-parts fragments |
| `mStep(label, latex, unit?)` | `(label: string, latex: string \| string[], unit?: string) => WorkingStep` | Prose label + KaTeX; array = fragments; label may carry `[[skill-id\|term]]` |
| `tStep(text)` | `(text: string) => WorkingStep` | Plain-text only step |
| `stripSkillMarkers(s)` | `(s: string) => string` | Replaces every `[[skill-id\|term]]` marker with its bare term |
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

### Working-step fragments — live modelling (author these by default)

`step()` and `mStep()` accept the latex as a **`string[]` of ordered fragments**. In the dev-gated step-by-step Worked Example, the line then reveals one fragment per press — *live modelling*: the line is written in the order a teacher would write it on the board, and the pause between presses is the class's thinking time. Everywhere else (show-all mode, print, worksheets, tests) the fragments join into one normal KaTeX line, so fragments can never diverge from the printed working. All fragments are laid out immediately (hidden ones at opacity 0), so the line never reflows and ← exactly retraces →.

```ts
mStep("Convert the first fraction:", ["\\dfrac{1}{11}", "= \\dfrac{1 \\times 13}{11 \\times 13}", "= \\dfrac{13}{143}"])
```

**The board-writing rule:** a fragment is the next *mark a teacher would write* — a whole decision (an operator with its operand, a complete `= …` link), never a lone token. Fragment any line containing two or more written moves; 2–4 fragments per step is the norm.

| Line shape | Fragmentation |
|---|---|
| Apply an operation | `start` → `× operation applied` → `= result` |
| Equals chain | one fragment per `= …` link |
| Substitution | expression → expression with values → `= result` |
| Single fact (`LCM = 143`) | no fragments — arrives whole |

Each fragment must be valid KaTeX **on its own** (the smoke tests render them individually).

### Skill links — `[[skill-id|term]]` drill-downs

A prose label (`mStep` label or `tStep` text) may mark a term as a drill-down into the **skill library**:

```ts
mStep(`Find the common denominator — the [[lcm|LCM]] of ${d1} and ${d2}:`, `${cl}`)
```

In the dev-gated Worked Example the term renders with a dotted underline; clicking it plays the skill's slides in an overlay, then returns to the same step. In classic mode (and in `plain`/print) only the bare term shows — the helpers strip markers from `plain` automatically. The smoke tests fail on any marker whose id isn't in the skill registry, so a dangling link can't ship.

**When to link:** whenever a step's label names a prerequisite skill the tool *uses* but doesn't *teach* (LCM, equivalent fractions, factor pairs…). If the skill doesn't exist yet, create it (see "Skill library" below) in the same commit.

---

## Core representations — the visual vocabulary

Every taught visual on the site (skill slides, Teach decks, and eventually whiteboard visualisers) is built from **six core representations**. Consistency is the point: a student who met the bar model in fractions meets the *same* bar in ratio — the representation library is the site's visual scheme of work.

| Representation | Carries | Scene family (TeachingDeck) |
|---|---|---|
| **Bar model** | fractions, ratio, proportion, percentages | `split` · `combine` · `equivalents` |
| **Number line** | integers, rounding, inequalities, sequences, multiples | `multiples` |
| **Area model** | multiplication, expanding brackets, completing the square | *(none yet)* |
| **Algebra tiles** | collecting terms, solving equations, factorising | *(manipulative exists; no scenes yet)* |
| **Negative counters** | directed numbers, integer add/sub, zero pairs | *(manipulative planned; no scenes yet)* |
| **Prime factor tiles** | HCF/LCM, factors, prime decomposition | `factorTree` · `primeVenn` |

**The rule: before authoring any new visual, pick one of the six.** A brand-new representation needs a reason. New scenes extend an existing family in `TeachingDeck.tsx` (grouped by family comments in the `TeachScene` union) and follow the standing scene contract: beat count derived from the scene, reserve space for everything (opacity, not mounting), animate only opacity/transform.

Prime factor tiles are **coloured squares keyed by the prime** (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink — `tileColor` in TeachingDeck), so the same prime looks the same in a factor tree, a Venn region, and a factor list. Composites stay plain numbers; only primes become tiles.

---

## Skill library (`src/shared/skills/`)

Small, reusable slide sequences that each teach **one** core skill pedagogically, on hand-picked model-friendly exemplar numbers. They are the drill-downs behind `[[skill-id|term]]` markers, and are browsable at `/skills` (the **Skill Library** page — registered `enabled: false`, so it shows on the landing page only in Developing-tools mode).

```ts
interface SkillDef {
  id: string;           // kebab-case, referenced by [[id|term]] markers; variants use <base>-<method>
  title: string;        // variants of one skill share the SAME title — /skills groups on it
  method?: string;      // variant label when a skill has multiple methods, e.g. "From times tables"
  description: string;  // one sentence, shown on the Skill Library card
  category: string;     // landing-page strand name (Number, Algebra, …)
  slides: TeachingSlide[];   // same slide types as the Teach deck
}
```

**Skill variants — same skill, different method.** When a skill is taught more than one way (LCM from times tables vs from prime factors), each method is a **separate skill with its own id** (`lcm`, `lcm-prime-factors`), its own exemplars suited to *its* representation, and the same `title` + a `method` label. The `/skills` page groups same-titled variants onto one card with a row per method. **The link site chooses the method**: a step author writes `[[lcm|LCM]]` where numbers are small and `[[lcm-prime-factors|LCM]]` where listing multiples would be absurd — pick the variant whose exemplars match the context the student is coming from.

**Adding a skill:** create `src/shared/skills/<id>.ts` exporting a `SkillDef`, add it to `SKILLS` in `src/shared/skills/index.tsx`, and add a row to the table below. The `/skills` page and CI pick it up automatically.

**Authoring rules:**
- Skills are **stand-alone taught walkthroughs** — the drill-down a student presses on mid-question. **No I-do/We-do/You-do phases and no practice questions**: those belong to a tool's Teach deck, not here. Teach the idea, then walk a demonstration.
- **Reveal by parts, walkthrough pacing.** Prefer `anim` scenes that build one press at a time (each press = the next mark a teacher would write — same board-writing rule as working-step fragments) over static slides with a single Reveal button. A static `reveal` is acceptable only for one short closing fact. If no existing scene fits the skill, add a generic scene type to TeachingDeck (see "Adding a new scene type").
- **Examples cover the skill's distinct cases — never an arbitrary count.** List the cases first, then give one walked example per case (median: an odd-length list and an even-length one; prime-factor LCM: distinct spares, a repeated shared prime, one number contained in the other). The first case gets the full scaffold; later cases fade it (e.g. trees compressed to stated factor lists). An example that repeats an already-covered case is padding — cut it.
- Shape: a short definition slide, then the case examples.
- **Exemplars are hand-picked friendly numbers, never the question's numbers** — the question that links here brings its own numbers to the worked example; the skill teaches the *idea*. Never author a visual that only formats well for small numbers and then feed it large ones.
- One level deep: skill slides never link to other skills.
- Claude drafts the slides from the maths; the user reviews the pedagogy on the `/skills` page in dev mode.

**Existing skills:**

| id | Title | Method | Category | Exemplars |
|---|---|---|---|---|
| `lcm` | Lowest Common Multiple | From times tables | Number | 4 & 6, then 5 & 3 — multiples listed one per press (`multiples` scene) |
| `lcm-prime-factors` | Lowest Common Multiple | From prime factors | Number | trees for 12 & 18, then Venns covering the cases: 12 & 18 (distinct spares), 8 & 12 (repeated shared prime), 9 & 18 (one number inside the other) (`factorTree`, `primeVenn`) |

CI (`src/tests/skills.test.ts`) validates every skill: unique kebab-case ids, every KaTeX string renders, anim slides never supply more captions than beats.

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
`handleDiagramPrint` *derives* a synthetic cell height from the column width and
feeds it to the same unit-tested `computeWorksheetLayout` engine the text path
uses. The fed height is capped at a **density floor** (~40 mm) so a page packs
~5 rows (matching the old fixed grid) rather than a few oversized squares; at
render time each cell is grown back toward the full column width, but never past
it, so few-question sheets still get big diagrams without floating in whitespace.
Everything is computed app-side and written as static HTML — no probe, no
measurement round-trip.

This means SVG worksheets get, for free and with no per-tool code:
- **Variable columns = density/size** — more columns → more per row (denser),
  fewer columns → wider cells and bigger diagrams. Expose it by *not* setting
  `fixedColumns` (use `maxColumns` to cap, default columns via `numColumns`).
- **Sections** (advanced worksheets) — per-section columns, headers, dividers.
- **Differentiated** three-column layout and **arbitrary question counts** that
  flow across pages.

The old fixed **3×5 = 15** preset is gone, but the density it gave is preserved:
15 questions in 3 columns still fit one page, while pages with only a few
diagrams now render them larger.

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

CI also runs `npm test` (Vitest, `src/tests/generators.test.ts`). The suite discovers every tool exporting `__test = { TOOL_CONFIG, generateQuestion }` and, for each sub-tool × level with default QO settings, generates 40 questions asserting: no throw, unique non-empty keys, and every KaTeX string (`displayLatex`, `answerLatex`, working-step latex, **each fragment individually**, `$...$` segments in worded lines) renders under `katex.renderToString` with `throwOnError`. It also asserts every `[[skill-id|term]]` marker resolves to a registered skill and that markers never leak into `plain`. This catches `£`/`<` in KaTeX, malformed latex, key collisions and dangling skill links at CI time. **Every new or migrated tool must keep its `__test` export.** Restrict levels with `levels: ["level1", "level2"]` when a level is coming soon.

`src/tests/skills.test.ts` separately validates every skill in the skill library (see "Skill library" section).

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
