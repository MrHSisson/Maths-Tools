# Questions, working steps and KaTeX

**Read when:** Writing a generator: the question types and their fields, the helpers, working steps and fragments, skill links, KaTeX rules.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

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
Always create `WorkingStep` objects via the helpers (`step`, `mStep`, `tStep`) — never construct raw objects. <!-- R1 -->

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
- Keys must be unique within a worksheet — include all parameters that vary the question <!-- R2 -->
- Always append a random `id` (`Math.floor(Math.random() * 1_000_000)`) to prevent false duplicates <!-- R2 -->
- Store tool-specific data (diagram, raw params) in underscore fields: `_diagram`, `_rawValues`, etc. Cast through `unknown`: `} as unknown as AnyQuestion`
- Every underscore field is declared once in `QuestionExtras` (`src/shared/questionExtras.ts`) — add a new one there first (a test fails on a field it does not list). A field only your tool reads is `unknown` there.
- Retrieve in renderers with the typed reader, never `as any`: `const d = extras(q)._rawValues as MyType | undefined` (`extras` is exported from `"../../shared"`; `withExtras(q, { _diagram: d })` builds a tagged copy) <!-- R3 -->
- `answerSuffix` is always plain text — never put units inside KaTeX <!-- R4 -->
- **Never store the same fact twice.** Derive every representation of an answer — surd ⇄ decimal ⇄ numeric ⇄ graph — from one computation, so they cannot drift out of sync. <!-- R5 -->

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
| `formatNumber(n)` / `texNumber(n)` | `(n: number \| string) => string` | Thousands commas from 1,000 up (`1,234`); `texNumber` uses `{,}` for KaTeX. Never rounds | <!-- ref -->
| `fracStr(n, d)` | `(n: number \| string, d: number \| string) => string` | `"$\\frac{n}{d}$"` for InlineMath |
| `mStr(x)` | `(x: number \| string) => string` | `"$x$"` — wraps value for InlineMath |
| `pickActive(values, opts)` | `(values: Record<string, boolean>, options: {value: string}[]) => string` | Random active multiSelect value |
| `fmt(n, dp?)` | `(n: number, dp?: number) => string` | Number → string, trailing zeros stripped, default 2dp |
| `ansEq(answer)` | `(answer: string) => string` | Prepends `"= "` unless answer already contains `=` |
| `normalizeMultiSelect(ms)` | `<T>(ms?: T \| T[] \| null) => T[]` | Normalises single/array multiSelect config |
| `sortByDifficulty(questions)` | `<Q extends {key: string}>(questions: Q[]) => Q[]` | Stable ascending sort by each question's `_difficultyScore` (the calibrated band); no-op if none is set. Used inside `ToolShell`'s worksheet generation — never call it in a tool file | <!-- R6 -->
| `buildQuotaOverrides(groups, baseValues, numQuestions)` | `(groups: {key: string; balanced?: boolean; options: {value: string}[]}[], baseValues: Record<string, boolean>, numQuestions: number) => Record<string, boolean>[]` | One `multiSelectValues` override per worksheet slot, keeping a `balanced` group's active options roughly (not exactly) evenly split; other groups pass through untouched. Called automatically by `ToolShell`'s worksheet generation — never call it in a tool file | <!-- R6 -->

### Working step rendering — how each type appears

| Call | Renders as |
|------|-----------|
| `step("16 \\div 4 = 4")` | Centred KaTeX — no label |
| `mStep("Divide by 4:", "16 \\div 4 = 4")` | Left-aligned prose label, centred KaTeX below |
| `mStep("Answer:", "12", "kg")` | Same as above, plain-text unit after KaTeX |
| `tStep("Simplify the fraction.")` | Plain text only — zero KaTeX |

**Pick `mStep` by default.** Use `step` when a label would be redundant (e.g. a chain of equals steps). Use `tStep` only for genuinely numberless prose (rare).

**Never use `\text{}` inside `step()` or `mStep()`.** Never put prose words inside `$...$`. <!-- R7 -->

### Working-step fragments — live modelling (author these by default)

`step()` and `mStep()` accept the latex as a **`string[]` of ordered fragments**. In the step-by-step Worked Example (live for every tool), the line then reveals one fragment per press — *live modelling*: the line is written in the order a teacher would write it on the board, and the pause between presses is the class's thinking time. Everywhere else (show-all mode, print, worksheets, tests) the fragments join into one normal KaTeX line, so fragments can never diverge from the printed working. All fragments are laid out immediately (hidden ones at opacity 0), so the line never reflows and ← exactly retraces →. <!-- ref -->

```ts
mStep("Convert the first fraction:", ["\\dfrac{1}{11}", "= \\dfrac{1 \\times 13}{11 \\times 13}", "= \\dfrac{13}{143}"])
```

**The board-writing rule:** a fragment is the next *mark a teacher would write* — a whole decision (an operator with its operand, a complete `= …` link), never a lone token. Fragment any line containing two or more written moves; 2–4 fragments per step is the norm. <!-- R8 -->

| Line shape | Fragmentation |
|---|---|
| Apply an operation | `start` → `× operation applied` → `= result` |
| Equals chain | one fragment per `= …` link |
| Substitution | expression → expression with values → `= result` |
| Single fact (`LCM = 143`) | no fragments — arrives whole |

Each fragment must be valid KaTeX **on its own** (the smoke tests render them individually). <!-- R8 -->

### Skill links — `[[skill-id|term]]` drill-downs

A prose label (`mStep` label or `tStep` text) may mark a term as a drill-down into the **skill library**:

```ts
mStep(`Find the common denominator — the [[lcm|LCM]] of ${d1} and ${d2}:`, `${cl}`)
```

The dotted-underline, clickable rendering only appears when Developing-tools mode is on (`skillLinks` on the Worked Example view; `onOpenSkill` is `undefined` otherwise) — clicking it plays the skill's slides in an overlay, then returns to the same step. With Developing-tools mode off (the ordinary case), the step-by-step Worked Example still works, but every marker renders as bare term text, same as classic mode — `SkillLabel` degrades silently with no `onOpenSkill` (see `src/shared/skills/index.tsx`). In classic mode (and in `plain`/print) only the bare term shows too — the helpers strip markers from `plain` automatically. The smoke tests fail on any marker whose id isn't in the skill registry, so a dangling link can't ship.

**When to link:** whenever a step's label names a prerequisite skill the tool *uses* but doesn't *teach* (LCM, equivalent fractions, factor pairs…). If the skill doesn't exist yet, create it (see "Skill library" below) in the same commit.

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

- `verticalAlign` must be `"baseline"` — `"middle"` drops spans below the baseline <!-- R9 -->
- `displayMode` is always `false` — wrap in a `<div>` for block display <!-- R9 -->
- Plain-text answers: never wrap in `katexSpan()` in the print handler — `£`, `<`, `>` crash KaTeX silently <!-- R9 -->
- In print CSS: set `font-size` on `.katex-render .katex` (inner span), not on `.katex-render` — the wrapper causes KaTeX to compound the scaling
- **Thousands separators**: plain `,` inside KaTeX math mode adds a thin space — `2,400` renders as "2, 400". Use `{,}`: `2{,}400`. Use the shared `texNumber(n)` (and `formatNumber(n)` for prose): a comma from 1,000 up, negatives and every decimal kept.
- **`\text{}` in steps**: never use `\text{}` inside `step()` or `mStep()` — use `tStep()` for prose <!-- R7 -->

---
