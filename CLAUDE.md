# Maths Tools — Claude Code Instructions

## What this file is

CLAUDE.md is read automatically by Claude Code at the start of every session in this repository. It replaces the need to re-read the codebase each time. Everything Claude needs to build tools correctly — conventions, APIs, checklists, gotchas — lives here.

---

## What this project is

A React/TypeScript/Vite app of interactive maths tools for teachers. Each tool has three modes — Whiteboard, Worked Example, Worksheet — with Levels 1–3, differentiated worksheets, and PDF export. Deployed to Vercel. CI runs on every push via `.github/workflows/ci.yml`.

**Claude's job:** build complete new tools end-to-end from a user spec. The user provides the maths content; Claude writes all the code, registers the route, and pushes.

---

## Branch convention

All development goes on `claude/tool-shell-deployment-Wix8A`. Push to that branch after every new tool or change. Never push to `main` directly.

---

## How to create a new tool — complete checklist

### 1. Create the tool file

- Copy `src/tools/TeacherTools/ToolShell.tsx` (the canonical template)
- Save to `src/tools/<Category>/<ToolName>.tsx` or `src/tools/<ToolName>.tsx` for root-level tools
- Fill in the tool-specific section only (Types → TOOL_CONFIG → INFO_SECTIONS → generateQuestion → generateUniqueQ)
- Leave the imports and `export default function App()` unchanged

### 2. Register in `src/App.tsx`

Add import under the correct category comment:
```tsx
import MyNewTool from './tools/Category/MyNewTool';
```
Add route inside `<Routes>`:
```tsx
<Route path="/my-new-tool" element={<MyNewTool />} />
```

### 3. Register in `src/components/LandingPage.tsx`

Add to the correct category's `tools` array:
```ts
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence.', ready: 'v1.0' }
```
Add `enabled: false` only if the tool should not be publicly visible yet.

### 4. Build

```bash
npm run build
```
Must complete with zero TypeScript errors. The chunk size warning is expected and harmless.

### 5. Commit and push

```bash
git add src/tools/... src/App.tsx src/components/LandingPage.tsx
git commit -m "Add <ToolName> tool"
git push
```

---

## How to migrate an old tool to v2.3

Old tools (v1.x) embed their own shell — UI components, state management, local type definitions — making them 800–1,300 lines. v2.3 tools use the shared ToolShell and are ~250–350 lines.

### Identifying old tools

Check the landing page `ready` version. Any tool below `v2.0` uses an old shell. The file will have a large self-contained component and no `import { ToolShell } from "../../shared"` line.

### Migration checklist

1. **Replace all imports** — the entire import block becomes the minimal shared import set (see below)
2. **Delete all local type definitions** — `type Question`, `type ToolSettings`, etc. are replaced by `AnyQuestion`, `ToolConfig`, etc. from shared
3. **Keep TOOL_CONFIG content, update its type** — change the local type annotation to `: ToolConfig`
4. **Keep INFO_SECTIONS content, update its type** — change to `: InfoSection[]`
5. **Keep all math generation functions** — the question logic is reusable as-is
6. **Convert question return types** — replace local `Question` with `AnyQuestion`; use `SimpleQuestion` or `WordedQuestion` structure
7. **Convert working steps** — replace `{ type: 'step', content: '...' }` objects with `mStep()` / `step()` / `tStep()` calls
8. **Delete all UI code** — remove every React component below the generators (DifficultyToggle, QO popovers, InfoModal, MenuDropdown, the main component, all `useState`/`useEffect`)
9. **Replace the export** — the entire component becomes `export default function App() { return <ToolShell ... /> }`
10. **Update landing page version** to `v2.3`

### Old pattern → new pattern

| Old (v1.x) | New (v2.3) |
|---|---|
| `import { useNavigate } from 'react-router-dom'` | Remove entirely |
| `const navigate = useNavigate(); navigate('/')` | `window.location.href = "/"` |
| `type Question = { display, answer, working, ... }` | `import { type AnyQuestion }` from shared |
| `type ToolSettings = { ... }` | `import { type ToolConfig }` from shared |
| `type InfoSection = { ... }` | `import { type InfoSection }` from shared |
| `{ type: 'step', content: 'Round: 34 → 30' }` | `mStep("Round to 1 s.f.:", "34 \\to 30")` |
| `{ type: 'step', content: 'Calculate: 4 × 3 = 12' }` | `mStep("Calculate:", "4 \\times 3 = 12")` |
| Custom `getQuestionUniqueKey` + display-based dedup | Use `q.key` directly in `generateUniqueQ` |
| `export default function ToolNameTool()` with full JSX | `export default function App() { return <ToolShell ... /> }` |
| `displayType: 'fraction'` with custom HTML renderer | `displayLatex: "\\dfrac{num}{den}"` on SimpleQuestion |
| `declare global { interface Window { katex: any } }` | `const w = () => window as any` |

### What the shared ToolShell provides (never re-implement these)

Whiteboard / Worked Example / Worksheet modes · difficulty toggle · QO popovers (dropdown, variables, multiSelect, differentiated) · tool tab buttons · font size controls · PDF print · colour scheme picker · info modal · home button

---

## Shared library (`src/shared/`)

All new tools import from `src/shared/` — never copy-paste boilerplate from old tools.

### Minimal import set for a new tool

```ts
import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  randInt, pick, step, mStep, tStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";
```

### Helper reference

| Helper | Purpose |
|--------|---------|
| `randInt(min, max)` | Random integer, inclusive both ends |
| `pick(arr)` | Random element from array |
| `step(latex)` | Pure KaTeX working step — centred, use for any line with maths |
| `mStep(label, latex, unit?)` | Prose label + KaTeX result, label left-aligned |
| `tStep(text)` | Plain text step — only when zero numbers/operators in the sentence |
| `fracStr(n, d)` | `"$\frac{n}{d}$"` — fraction for InlineMath lines |
| `mStr(x)` | `"$x$"` — wraps a number/expression for InlineMath lines |
| `pickActive(values, opts)` | Picks a random active value from a multiSelect state |
| `fmt(n, dp?)` | Number to string, trailing zeros stripped, default 2dp |

### Working step rendering — how each type appears on screen

| Helper call | Renders as |
|-------------|------------|
| `step("16 \\div 4 = 4")` | Centred KaTeX — no label. Use for pure maths lines. |
| `mStep("Divide by 4:", "16 \\div 4 = 4")` | Left-aligned prose label on one line, centred KaTeX below it. Use when the step needs a word description. |
| `mStep("Answer:", "12", "kg")` | Same as above, with plain-text unit appended after the KaTeX. |
| `tStep("Simplify the fraction.")` | Plain text only — no KaTeX at all. Use only when the sentence contains zero numbers or operators. |

Pick `mStep` by default for worked examples. Use `step` when the label would be redundant (e.g. a chain of equals steps). Use `tStep` only for genuinely numberless prose (rare).

---

## `ToolShellProps` — the four required props + defaults

```tsx
<ToolShell
  config={TOOL_CONFIG}
  infoSections={INFO_SECTIONS}
  generateQuestion={generateQuestion}
  generateUniqueQ={generateUniqueQ}
  defaults={{ ... }}           // optional — see below
/>
```

### `defaults` — per-tool overrides

```ts
defaults?: {
  displayFontSize?: number;    // starting font size index 0–5, default 2 (text-3xl)
  worksheetFontSize?: number;  // starting font size index 0–5, default 1 (text-xl)
  numQuestions?: number;       // starting question count, default 15
  fixedQuestions?: boolean;    // hides the questions input entirely
  numColumns?: number;         // starting column count, default 3
  fixedColumns?: boolean;      // hides the columns input entirely
  maxColumns?: number;         // caps the columns input max (e.g. 3 = no 4-col option)
}
```

Font size indices: `0=text-lg  1=text-xl  2=text-3xl  3=text-4xl  4=text-5xl  5=text-7xl`

Use `fixedQuestions` when a tool always generates a specific count (e.g. exactly 12 questions for a 3×4 grid). Use `maxColumns` when 4 columns is never appropriate for the question type. Use `fixedColumns` when the column count must never change at all.

---

## TOOL_CONFIG format

```ts
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Displayed at top of page",
  tools: {

    subtool1: {
      name: "Button label",
      instruction: "Solve:",        // optional — shown above question in all modes

      variables: [],                // toggle switches — prefer multiSelect instead
      dropdown: null,               // single-select segmented buttons, or null
      multiSelect: {                // default QO control — reach for this first
        key: "questionPool",
        label: "Question Types",
        options: [
          { value: "a", label: "Type A", defaultActive: true  },
          { value: "b", label: "Type B", defaultActive: true  },
          { value: "c", label: "Type C", defaultActive: false },
        ],
      },
      difficultySettings: null,     // null = same options all levels
    },

  },
};
```

### QO control types — when to use each

| Control | When to use |
|---------|------------|
| `multiSelect` | **Default choice.** Options describe what's in the question pool. Multiple can be active. At least one must stay active. Use `pickActive(values, options)` in the generator to pick randomly from active options. |
| `dropdown` | A single setting that changes the question type (e.g. method choice). Mutually exclusive. |
| `variables` | Binary toggles for independent on/off options (e.g. "Include negatives"). Use sparingly — prefer multiSelect. |

### `difficultySettings` — per-level overrides

```ts
difficultySettings: {
  level1: { dropdown: { ...level1Version }, variables: [] },
  level2: { dropdown: { ...level2Version }, variables: [{ key: "showHint", label: "Show hint", defaultValue: false }] },
  level3: { dropdown: { ...level3Version }, variables: [...] },
}
```

Each level can independently override `dropdown`, `variables`, and/or `multiSelect`. Omitting a key at a level inherits the tool-level default.

---

## Question kinds — required fields

### `SimpleQuestion`
```ts
{
  kind: "simple",
  display: "3 + 4",           // plain-text fallback
  displayLatex: "3 + 4",      // KaTeX expression — use for all maths content
  answer: "7",                // plain-text fallback
  answerLatex: "7",           // KaTeX expression for the answer
  answerSuffix: "kg",         // optional plain-text unit after answerLatex
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

### Key rules
- Keys must be unique within a worksheet — include all parameters that vary the question
- Always append a random `id` (`Math.floor(Math.random() * 1_000_000)`) to prevent false duplicates
- `answerSuffix` is always plain text — never put units inside KaTeX

---

## KaTeX rendering — the rules (check every question)

| Content | Correct approach |
|---------|----------------|
| Number or operator in prose | `mStr(n)` — e.g. `"A bag weighs " + mStr(16) + " kg."` |
| Fraction in prose | `fracStr(n, d)` — e.g. `fracStr(3, 4) + " of the bag"` |
| Ratio in prose | `mStr("3:4")` — no spaces around colon; `3 : 4` adds KaTeX operator spacing |
| Pure maths working step | `step("16 \\div 4 = 4")` |
| Prose label + maths result | `mStep("Divide:", "16 \\div 4 = 4")` |
| Genuinely numberless prose | `tStep("Simplify the fraction.")` — only if zero numbers/operators |
| Question display | `displayLatex: "..."` on SimpleQuestion |
| `\frac` vs plain expression | `fracStr` / `\frac` containers use `1em`; all others use `0.826em` |

**Never use `\text{}` inside `step()`.** Never put prose words inside `$...$`.

### KaTeX gotchas
- `verticalAlign` must be `"baseline"` — `"middle"` drops spans below the text baseline
- `displayMode` is always `false` — wrap in a `<div>` for block display
- Plain-text answers: if a tool's answers are plain strings (no `answerLatex`), never wrap them in `katexSpan()` in the print handler — characters like `£`, `<`, `>` crash KaTeX silently and produce a blank print window
- In print CSS: set `font-size` on `.katex-render .katex` (inner span), not on `.katex-render` — setting it on the wrapper causes KaTeX to compound the scaling
- **Thousands separators**: a plain `,` inside KaTeX math mode adds a thin space — `2,400` renders as "2, 400". Use `{,}` instead: `2{,}400` renders correctly. When formatting large numbers for use inside `step()` or `mStep()` LaTeX strings, replace commas: `const fmtK = (n: number) => formatNumber(n).replace(/,/g, "{,}")`

---

## TypeScript / build rules (check before committing)

- `generateQuestion` and `generateUniqueQ` must be typed `(tool: string, ...)` — cast internally: `const t = tool as ToolType;`
- Never use `useNavigate` — home navigation uses `window.location.href = "/"`
- Never import `react-router-dom` inside a tool file
- Never add `declare global` — use `const w = () => window as any` for untyped globals
- Unused shared helpers must be suppressed: `void (tStep as unknown); void (fmt as unknown); void (pickActive as unknown)` — add only for helpers actually unused in the specific tool
- `_variables` and `_dropdownValue` use `_` prefix in the stub generator to signal intentional non-use
- `currentQuestion` initialised via `useState` initialiser, never `null`
- If `AnyQuestion` for a tool does not include `"frac"` kind, remove any `q.kind === "frac"` branches — they cause TS2367

---

## PDF print — edge cases to check

- `totalPages`, `printMode`, and any other `var` referenced inside a function declaration must be declared in the injected script's **outer scope** (above `buildPage` and the `.map()` calls) — declaring them inside `buildPage` causes "not defined" at runtime
- Params that appear only as `${...}` in the HTML string are invisible to TypeScript — use distinct names (e.g. `pMode` not `printMode`) and add `void (param as unknown)` suppressions immediately before the `html` template literal
- If a tool has only worded questions, remove the `"simple"` and `"frac"` branches from `questionToHtml` — TS2367 at build time otherwise

---

## Categories and file locations

| Category | Folder | LandingPage gradient |
|----------|--------|---------------------|
| Generators | `src/tools/Generators/` | blue → indigo |
| Number | `src/tools/Number/` | cyan → sky |
| Algebra | `src/tools/Algebra/` | purple → fuchsia |
| Ratio & Proportion | `src/tools/Proportion/` | orange → amber |
| Geometry | `src/tools/Geometry/` | green → emerald |
| Probability & Statistics | `src/tools/` (root) | rose → pink |
| Teacher Tools | `src/tools/TeacherTools/` | slate → gray |
| Computer Science | `src/tools/ComputerScience/` | teal → cyan |

---

## What to ask the user for (new tool spec)

Request these — or infer from context — before writing a tool:

1. **Tool name** — display name, e.g. "Multiplying Fractions"
2. **URL path** — e.g. `/multiplying-fractions`
3. **Category** — which section on the landing page
4. **Description** — one sentence for the landing page card
5. **Sub-tools** — names of the tab buttons (1–5)
6. **For each sub-tool:**
   - Question type: simple (single expression), worded (multi-line context), or fraction
   - Level 1 — what makes it easiest
   - Level 2 — what adds difficulty
   - Level 3 — what makes it hardest
   - QO options: any dropdowns, toggles, or multiSelect pools
   - `instruction`? e.g. "Simplify:", "Solve:", "Find:"

7. **Worked example steps** — how the solution is explained at each level
8. **Defaults** — any non-standard font size, question count, or column constraints

Claude drafts `INFO_SECTIONS` from the above — the user does not need to write it.
