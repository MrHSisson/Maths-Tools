# Maths Tools — Claude Code Instructions

## What this project is

A React/TypeScript app of interactive maths tools for teachers. Each tool has three modes — Whiteboard, Worked Example, Worksheet — and supports Levels 1–3 with differentiated worksheets and PDF export. Deployed to Vercel.

**Claude's job:** build complete new tools end-to-end when given a spec, then commit and push. The user provides the maths content; Claude writes all the code.

---

## Branch convention

All development goes on `claude/tool-shell-deployment-Wix8A`. Push to that branch after every new tool or change. Never push to `main` directly.

---

## How to create a new tool (complete checklist)

### Step 1 — Create the tool file

Copy the template from `src/tools/TeacherTools/ToolShell.tsx`. Save to:
- `src/tools/<Category>/<ToolName>.tsx` for categorised tools (Algebra, Geometry, Number, etc.)
- `src/tools/<ToolName>.tsx` for root-level tools (Ratio, Fractions, etc.)

Replace the tool-specific section only. **Do not modify imports or the final `export default function App()` block** — those are fixed.

The tool-specific section contains:
1. `ToolType` — string union matching the keys in `TOOL_CONFIG.tools`
2. `TOOL_CONFIG` — `pageTitle` + `tools` object (see format below)
3. `INFO_SECTIONS` — modal content explaining the tool
4. `generateQuestion()` — all question generation logic
5. `generateUniqueQ()` — always the same deduplication wrapper (copy verbatim)

**Critical:** both `generateQuestion` and `generateUniqueQ` must be typed as `(tool: string, ...)` not `(tool: ToolType, ...)`. Cast inside the body: `const t = tool as ToolType;`

### Step 2 — Register the route in `src/App.tsx`

Add import under the correct category comment:
```tsx
import MyNewTool from './tools/Category/MyNewTool';
```

Add route inside `<Routes>` under the correct category comment:
```tsx
<Route path="/my-new-tool" element={<MyNewTool />} />
```

### Step 3 — Register the card in `src/components/LandingPage.tsx`

Find the correct category in the `categories` array and add to its `tools` array:
```ts
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence description.', ready: 'v1.0' }
```

Add `enabled: false` if the tool is not ready to show publicly.

### Step 4 — Build and verify

```bash
npm run build
```

Must complete with zero TypeScript errors. The chunk size warning is expected and can be ignored.

### Step 5 — Commit and push

```bash
git add src/tools/... src/App.tsx src/components/LandingPage.tsx
git commit -m "Add <ToolName> tool"
git push
```

---

## Shared library (`src/shared/`)

All new tools import from `src/shared/` — never copy-paste boilerplate.

```ts
import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  randInt, pick, step, mStep, tStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";
```

### Key imports

| Import | Purpose |
|--------|---------|
| `ToolShell` | The shell component — render this in the default export |
| `ToolConfig` | Type for `TOOL_CONFIG` |
| `InfoSection` | Type for `INFO_SECTIONS` |
| `DifficultyLevel` | `"level1" \| "level2" \| "level3"` |
| `AnyQuestion` | `SimpleQuestion \| WordedQuestion` |
| `randInt(min, max)` | Random integer inclusive |
| `pick(arr)` | Random array element |
| `step(latex)` | Pure KaTeX working step |
| `mStep(label, latex, unit?)` | Prose label + KaTeX |
| `tStep(text)` | Plain text step (no numbers) |
| `fracStr(n, d)` | `"$\frac{n}{d}$"` for InlineMath |
| `mStr(x)` | `"$x$"` wraps number/expression for InlineMath |
| `pickActive(values, opts)` | Random active multiSelect value |
| `fmt(n, dp?)` | Number to string, trailing zeros stripped |

---

## TOOL_CONFIG format

```ts
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Displayed at top of page",
  tools: {
    subtool1: {
      name: "Button label",
      instruction: "Solve:",        // optional — shown above question
      useSubstantialBoxes: false,   // true = card cells, false = compact
      variables: [                  // toggle switches
        { key: "showHint", label: "Show hint", defaultValue: false },
      ],
      dropdown: {                   // segmented selector (or null)
        key: "method", label: "Method", useTwoLineButtons: false,
        options: [{ value: "a", label: "Method A" }],
        defaultValue: "a",
      },
      multiSelect: null,            // multi-toggle pool (or object)
      difficultySettings: null,     // null = same options all levels
                                    // or: { level1: {...}, level2: {...}, level3: {...} }
    },
  },
};
```

`difficultySettings` per level can override `dropdown`, `variables`, and `multiSelect` independently.

---

## Question kinds

### SimpleQuestion
```ts
{
  kind: "simple",
  display: "3 + 4",           // plain text fallback
  displayLatex: "3 + 4",      // KaTeX expression (use for all maths)
  answer: "7",
  answerLatex: "7",
  answerSuffix: "kg",         // optional unit after answer
  working: [step("3 + 4 = 7")],
  key: `unique-key-${id}`,
  difficulty: level,
}
```

### WordedQuestion
```ts
{
  kind: "worded",
  lines: [
    `A bag weighs ${mStr(16)} kg.`,   // mStr wraps numbers/expressions
    `Find ${fracStr(3,4)} of it.`,    // fracStr for fractions
    "What is the answer?",            // plain prose stays plain
  ],
  answer: "12 kg",
  answerLatex: "12",
  answerSuffix: "kg",
  working: [
    mStep("Divide:", "16 \\div 4 = 4"),
    mStep("Multiply:", "4 \\times 3 = 12"),
  ],
  key: `unique-key-${id}`,
  difficulty: level,
}
```

### Working step types
- `step("latex")` — pure KaTeX, centred. Use for any line containing maths.
- `mStep("label:", "latex", "unit?")` — prose label left, KaTeX right.
- `tStep("text")` — plain text only. Only for genuinely numberless prose.

**Rule:** if a sentence contains any number or operator, use `step()` or `mStep()`, not `tStep()`.

---

## KaTeX rendering rules

| Content | Approach |
|---------|---------|
| Numbers or operators in prose | `mStr(n)` → wraps in `$...$` |
| Fractions in prose | `fracStr(n, d)` → `$\frac{n}{d}$` |
| Pure maths step | `step("latex")` |
| Prose label + result | `mStep("label:", "latex")` |
| Purely numberless prose | `tStep("text")` |
| Question display (simple) | `displayLatex: "latex string"` |

Never use `\text{}` inside `step()`. Never put prose words inside `$...$`.

---

## Categories (LandingPage)

| Category name | Folder | Gradient |
|--------------|--------|---------|
| Generators | `src/tools/Generators/` | blue-indigo |
| Number | `src/tools/Number/` | cyan-sky |
| Algebra | `src/tools/Algebra/` | purple-fuchsia |
| Ratio & Proportion | `src/tools/` (root) | orange-amber |
| Geometry | `src/tools/Geometry/` | green-emerald |
| Probability & Statistics | `src/tools/` (root) | rose-pink |
| Teacher Tools | `src/tools/TeacherTools/` | slate-gray |
| Computer Science | `src/tools/` (root) | teal-cyan |

---

## What Claude needs to build a tool (spec format)

When a user asks for a new tool, ask for (or infer from context):

1. **Tool name** — display name, e.g. "Multiplying Fractions"
2. **URL path** — e.g. `/multiplying-fractions`
3. **Category** — which section on the landing page
4. **Description** — one sentence for the landing page card
5. **Sub-tools** — list of sub-tool names (the tab buttons at the top)
6. **For each sub-tool:**
   - Question type: simple (one expression), worded (multi-line context), or fraction
   - Level 1: what makes it easy (small numbers, integer answers, etc.)
   - Level 2: what adds difficulty
   - Level 3: what makes it hardest
   - Any options: toggles (e.g., "Include negatives"), dropdowns (e.g., method choice)
   - instruction? (e.g., "Simplify:", "Solve:", "Find:")
7. **Worked example steps** — how to explain the solution at each level

INFO_SECTIONS can be drafted by Claude from the above — no need for the user to write it.

---

## Example: minimal complete tool file structure

```
src/tools/Algebra/MyTool.tsx
─────────────────────────────
imports (from ../../shared)
ToolType = "subtool1" | "subtool2"
TOOL_CONFIG: ToolConfig = { ... }
INFO_SECTIONS: InfoSection[] = [ ... ]
generateQuestion(tool: string, level, variables, dropdownValue, multiSelectValues): AnyQuestion
generateUniqueQ(tool: string, level, variables, dropdownValue, usedKeys, multiSelectValues): AnyQuestion
void(tStep, fmt, pickActive) — suppress unused warnings if not used
export default function App() { return <ToolShell config=... infoSections=... generateQuestion=... generateUniqueQ=... /> }
```

---

## Common mistakes to avoid

- Do NOT type `generateQuestion` or `generateUniqueQ` with `tool: ToolType` — use `tool: string` and cast internally
- Do NOT import `useNavigate` — tools use `window.location.href = "/"` for home navigation
- Do NOT add `enabled: false` to LandingPage unless the tool genuinely shouldn't be visible yet
- Do NOT forget `void(tStep, fmt, pickActive)` suppression for helpers imported but not used in the specific tool
- Do NOT skip the build check before committing
