# Building a tool — spec, scaffold, registry, shared imports

**Read when:** you are building a new tool (from a spec in `specs/` or an ad-hoc request), adding a registry entry, choosing the shared imports, or looking for the reference implementation of a pattern. The rules that load every session are in `CLAUDE.md`; this is the how-to that used to sit there.

## Implementing from a spec (`specs/`)

The preferred pipeline: the user designs the build conversationally with **Claude in a chat** (this repo linked; entry point `docs/design/DESIGN_STUDIO.md`), which outputs a completed brief following the matching fill-in template. **Five build types**, each with its own template and home:

| Build type | Template | Brief lives in |
|---|---|---|
| Maths tool (question generator) | `docs/design/templates/TOOL_SPEC_TEMPLATE.md` | `specs/<tool-id>.md` |
| CS tool (J277 revision topic) | `docs/design/templates/CS_TOPIC_SPEC_TEMPLATE.md` | `specs/cs/<topic-id>.md` |
| Technique (reusable working-step block) | `docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md` | `specs/techniques/<technique-id>.md` |
| Teach deck (a tool's Teach-mode slides) | `docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md` | `specs/decks/<tool-id>.md` |
| Depth bank (a tool's curated questions) | `docs/design/templates/DEPTH_SPEC_TEMPLATE.md` | `specs/depth/<tool-id>.md` |

The deep maths-tool pedagogy guide (`docs/design/TOOL_DESIGNER_PROMPT.md`) still stands and is usable as claude.ai Project instructions; `docs/design/DESIGN_STUDIO.md` routes the maths branch to it.

When the user provides a brief (pasted, or already in `specs/`):

1. Save it to the right path for its type (table above) if not already there.
2. Only implement briefs with `Status: ready`. If sections are missing or ambiguous, ask before building — otherwise build **without further questions**.
3. The brief's **acceptance/correctness reference** defines correctness — verify it before pushing:
   - maths tool → sample questions produce those shapes with matching answers and working;
   - CS tool → cards/exam questions match their answers and **mark schemes**;
   - technique → the worked numeric example matches at each grain;
   - Teach deck → the slides reproduce the coherent example beat-by-beat;
   - Depth bank → `depth.test.ts` passes and the bank's numbers match the brief's acceptance reference.
4. Take the "About this tool" words (`<Tool>.about.ts`: the tool's purpose, each sub-tool's purpose and one plain line per level) from the brief's info section.
5. After it builds clean and tests pass, change the brief's status line to `**Status:** implemented` in the same commit.

For ad-hoc requests without a brief, gather the details in "What to ask the user for" below (maths tools), or from the relevant template's sections (other types).

---

## How to create a new tool — complete checklist

### 1. Scaffold the tool file

```bash
npm run new-tool -- --name "Display Name" --category <Folder> --path /url-path --description "One sentence."
```

This copies the canonical template (`src/tools/TeacherTools/ToolShell.tsx`) to `src/tools/<Folder>/<DisplayName>.tsx` and registers it in `src/registry.ts` with `enabled: false`. (Manual alternative: copy the template and add the registry entry yourself.)

### 2. Fill in the tool-specific section only

- Types → TOOL_CONFIG → `<Tool>.about.ts` (the words) → generateQuestion
- `generateUniqueQ` is **not needed** — ToolShell wraps `generateQuestion` with the standard retry-until-unique loop automatically. Only write one for non-standard uniqueness handling.
- Keep the `export const __test = { TOOL_CONFIG, generateQuestion }` export — the CI smoke tests discover tools through it. Add `levels: ["level1", "level2"]` to it if the tool offers fewer than three levels.
- Leave the imports and `export default function App()` unchanged.

### 3. Registry entry (`src/registry.ts` — single registration point)

`src/registry.ts` is the single source of truth for every tool. `App.tsx` generates the route (lazy-loaded — each tool builds as its own chunk) and `LandingPage.tsx` renders the card from it, grouped into subject bands by each category's `subject` field (default `"GCSE Maths"`; set `"A-Level"` for A-Level strands such as Pure and Decision Mathematics, and `"Computer Science"` for CS strands). Do **not** edit `App.tsx` or `LandingPage.tsx` to add a tool — everything is driven from the registry entry. The scaffold script adds the entry; review it and remove `enabled: false` when the tool is ready to go live:

```ts
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence.', load: () => import('./tools/Category/MyNewTool') }
```

Optionally add `group: 'Sub-group name'` (e.g. `'Place value & decimals'`) so the landing page lists the tool under a small sub-heading inside its category; groups appear in order of first appearance, so keep a category's entries ordered by scheme of work. Tools with no `group` stay ungrouped. The landing page also has a search box (matches the start of words in name, description or group).

A tool's `id` is its `path` without the slash, lower-case words joined by hyphens (`src/tests/registryIds.test.ts` fails otherwise); it is also the key of the tool's dashboard note, so never rename one without copying that note to the new id. When a **route** changes, keep the old address working with `aliases: ['/old-path']` on the entry: it redirects, query string and all, to the new route (Times Tables moved from `/timestables`). <!-- ref -->

A strand's tools can be opened from one hub page: give each tool `hub: '<hub tool id>'` and the landing page shows only the hub's card (the search box still finds the tools; routes are unchanged). Decision Maths does this with `/decision-overview` (the AQA 7367 spec-code page, `SpecLanding` with `public`).

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

## Old tools — the migration is closed

Every tool that belongs on `ToolShell` has been migrated; **`src/tests/organisation.test.ts` is authoritative** (it fails the build if a tool is un-categorised, a ToolShell tool lacks `__test`, or a tool file isn't registered). Standalone by design, never migrated: the four PDF Generators, `AlgebraTiles`, `NegativeCounters`, `ParallelLinesInteractive`, `GrapherLab`, `SkillLibrary`, `Visualiser`, `p-value`, the word games, and the Decision (`DecisionShell`) and Computer Science (`CSShell`) tools. If an old hand-rolled tool ever appears: use the shared import set below, delete its local types and UI, keep `TOOL_CONFIG`, the `.about.ts` words and the generation maths, author working with `mStep` / `step` / `tStep`, render `<ToolShell … />`, keep `export const __test`, and update `organisation.test.ts`. <!-- ref -->

---

## Shared library (`src/shared/`) — complete API reference

Tools import the core API from `"../../shared"`. Where a family has its own sub-path, import it by name from there: `shared/decision/` (Decision tools), `shared/cs/` (CS tools), `shared/mathsWords/` (word games), and the stand-alone modules a tool needs that the barrel does not list (`shared/layoutMode`, `shared/colors`, `shared/depth`, `shared/calibration`, `shared/binomial`). Tools never import another tool, and `shared/` never imports from `tools/`. Never read the shared source files to discover the API: it is documented in the reference files (index below). <!-- ref -->

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

The full export list is `src/shared/index.ts`; each export is documented in the reference files below.


---

## Categories and file locations

| Category (as in `src/registry.ts`) | Folder | LandingPage gradient |
|----------|--------|---------------------|
| Generators | `src/tools/Generators/` | blue → indigo |
| Number | `src/tools/Number/` | cyan → sky |
| Algebra | `src/tools/Algebra/` | purple → fuchsia |
| Ratio & Proportion | `src/tools/Proportion/` | emerald → teal |
| Geometry | `src/tools/Geometry/` | amber → orange |
| Pure Mathematics (A-level) | `src/tools/Algebra/` (Factor Theorem, Partial Fractions, Binomial Expansion) | indigo → blue |
| Decision Mathematics (A-level) | `src/tools/Decision/` | rose → red |
| Classroom (Visualiser, Name Wheel, Advent Calendar; its own landing tab) and Workshop (internal pages, Developing-tools mode only, same tab) | `src/tools/TeacherTools/` | violet → purple |
| Interactive Tools | `src/tools/Interactive/` | lime → green |
| Computer Science, group "Binary & number bases" (procedural generators on ToolShell) beside group "Computer systems" (CSShell revision topics) | `src/tools/Binary/` and `src/tools/ComputerScience/` | slate → slate |
| Computer Science | `src/tools/ComputerScience/` | slate → slate |

---

## Reference implementations — which file to look at

| Pattern | Reference file |
|---------|---------------|
| Standard v2.3 tool (simple questions) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Multi-type generators behind a Question Types pool; missing-value working on the ratio table (`rStepSolve`) | `src/tools/Proportion/RatioManipulation.tsx` (`ratioSimplifying.ts`, `ratioEquivalent.ts`) |
| Diagram/SVG tool with shared print (`handleDiagramPrint`) | `src/tools/Geometry/AnglesInQuadrilaterals.tsx` |
| Diagram/SVG tool with a longer printed answer (`_printAnswer`) | `src/tools/Geometry/AnglesInParallelLines.tsx` |
| `reformatQuestion` (instant display reformat) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Multi-group `multiSelect` | search for `ToolMultiSelect[]` in `src/tools/` |
| `difficultySettings` per-level QO | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Sub-tools with fewer than 3 levels (`ToolEntry.levels`) | `src/tools/Binary/NumberBases.tsx` |

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
   - Level 1 / 2 / 3 — what changes at each level (or fewer than three)
   - QO options: dropdowns, variables, multiSelect
   - `instruction`? e.g. "Simplify:", "Solve:", "Find:"
7. **Worked example steps** — how the solution is explained at each level
8. **Defaults** — non-standard font size, question count, column constraints

Claude drafts `<Tool>.about.ts` from the above — the user does not need to write it.

