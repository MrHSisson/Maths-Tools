# Maths Tools

A web app of interactive teaching tools, hosting **two subjects** on one site:

- **Mathematics** — question-generator tools built around the **"I Do, We Do, You Do"** pedagogy. Each supports three modes — Whiteboard, Worked Example, Worksheet — with three difficulty levels and PDF export, on the shared `ToolShell`.
- **Computer Science** — OCR J277 GCSE knowledge/revision tools (Learn · Study · Cards · Quiz · Fill · Exam) on a separate shell, `CSShell`. Younger and growing.

The landing page bands tools by subject. The two shells are deliberately separate — see the "Two subjects — repository map" in `CLAUDE.md`.

Deployed at: [maths-tools.vercel.app](https://maths-tools.vercel.app)

### Documentation

| Doc | Job |
|---|---|
| `CLAUDE.md` | The rules — conventions, shared-API reference, how to build a tool. Start here. |
| `PROJECTS.md` | The plan — where every prong is up to and what's next (Maths + CS + Decision, in one place). |
| `PATCH_NOTES.md` | Session-by-session history (Maths / CS), newest first. |
| `CS_SHELL_PLAN.md` · `DECISION_SHELL_PLAN.md` | The `CSShell` / `DecisionShell` architecture. |
| `GLOSSARY.md` | Canonical name for every element. |
| `DESIGN_STUDIO.md` | The one entry point for designing a build with Claude (chat), repo linked — routes to the template for a maths tool / CS tool / technique / Teach deck. |
| `TOOL_SPEC_TEMPLATE.md` · `CS_TOPIC_SPEC_TEMPLATE.md` · `TECHNIQUE_SPEC_TEMPLATE.md` · `TEACH_DECK_SPEC_TEMPLATE.md` · `TOOL_DESIGNER_PROMPT.md` · `specs/` | The spec pipeline — a fill-in template per build type, plus the completed briefs. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Maths rendering | KaTeX (bundled via npm; print documents still use the CDN) |
| Charts | Recharts |
| PDF export | jsPDF + html2canvas |
| Icons | Lucide React |
| Deployment | Vercel |
| CI | GitHub Actions |

---

## Project Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline — type-checks and builds on every push to main
├── src/
│   ├── components/
│   │   └── LandingPage.tsx     # Home page — renders categories/cards from the registry
│   ├── shared/                 # Shared shell used by all v2.3+ tools
│   │   ├── ToolShell.tsx       # Main shell component (modes, nav, QO controls, print)
│   │   ├── print.ts            # PDF/print handler
│   │   ├── types.ts            # Shared TypeScript types (ToolConfig, AnyQuestion, etc.)
│   │   ├── helpers.ts          # Generation helpers (randInt, pick, step, mStep, etc.)
│   │   ├── katex.ts            # KaTeX rendering utilities
│   │   ├── colors.ts           # Shared colour tokens
│   │   ├── index.ts            # Barrel export for src/shared/
│   │   └── components/         # Sub-components used by ToolShell
│   │       ├── DifficultyToggle.tsx
│   │       ├── InfoModal.tsx
│   │       ├── MathRenderer.tsx
│   │       ├── MenuDropdown.tsx
│   │       ├── PrintSplitButton.tsx
│   │       ├── QOPopovers.tsx
│   │       └── QuestionDisplay.tsx
│   ├── tools/
│   │   ├── Algebra/
│   │   │   ├── CompletingTheSquare.tsx
│   │   │   ├── ExpandingDoubleBracketsFOIL.tsx
│   │   │   ├── ExpandingDoubleBracketsGRID.tsx
│   │   │   ├── ExpandingSingleBracketsFOIL.tsx
│   │   │   ├── ExpandingSingleBracketsGRID.tsx
│   │   │   ├── Iterations.tsx
│   │   │   ├── NonLinearSimEq.tsx
│   │   │   ├── SimultaneousEquations.tsx
│   │   │   └── SolvingLinearEquations.tsx
│   │   ├── ComputerScience/
│   │   │   └── SystemArchitecture.tsx
│   │   ├── Generators/
│   │   │   ├── FunctionalSkillsGenerator.tsx
│   │   │   ├── MultiplicationGenerator.tsx
│   │   │   ├── NegativeOperationsGenerator.tsx
│   │   │   └── TimesTablesGenerator.tsx
│   │   ├── Geometry/
│   │   │   ├── AnglesInTriangles.tsx
│   │   │   ├── BasicAngleFacts.tsx
│   │   │   ├── CircleProperties.tsx
│   │   │   ├── EquationsOfLines.tsx
│   │   │   └── PerimeterTool.tsx
│   │   ├── Number/
│   │   │   ├── Estimation.tsx
│   │   │   ├── IntegerAddSub.tsx
│   │   │   └── PowersOfTen.tsx
│   │   ├── Proportion/
│   │   │   ├── BestBuys.tsx
│   │   │   ├── FractionToRatio.tsx
│   │   │   ├── FractionsOfAmounts.tsx
│   │   │   ├── RatioSharingTool.tsx
│   │   │   ├── RecipesTool.tsx
│   │   │   └── SimplifyingRatiosTool.tsx
│   │   └── TeacherTools/
│   │       ├── CallSelector.tsx
│   │       ├── p-value.tsx
│   │       ├── ToolShell.tsx   # Canonical template for new tools
│   │       └── Visualiser.tsx
│   ├── registry.ts             # Single source of truth — every tool's path, card data, lazy import
│   ├── App.tsx                 # Routes generated from the registry (lazy-loaded chunks)
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles
├── Unpublished/                 # Old/in-progress tools — not built, not registered, not migrated
├── CLAUDE.md                   # Instructions for Claude Code (AI development)
├── index.html                  # Vite HTML entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json               # excludes Unpublished/
├── vercel.json                 # SPA rewrite rule for client-side routing
└── vite.config.ts
```

---

## Tool Categories

| Category | Folder | Tools |
|---|---|---|
| Generators | `src/tools/Generators/` | Times Tables, Negative Operations, Multiplication Methods, Functional Skills |
| Number | `src/tools/Number/` | Adding & Subtracting Integers, Estimation, Powers of Ten |
| Algebra | `src/tools/Algebra/` | Solving Linear Equations, Completing the Square, Iteration, Simultaneous Equations (×2), Expanding Brackets (×4) |
| Ratio & Proportion | `src/tools/Proportion/` | Dividing Ratios, Simplifying Ratios, Recipes, Fractions↔Ratios, Fractions of Amounts, Best Buys |
| Geometry | `src/tools/Geometry/` | Circle Properties, Basic Angle Facts, Angles in Triangles, Line Equations, Perimeter |
| Probability & Statistics | *(coming soon)* | — |
| Teacher Tools | `src/tools/TeacherTools/` | Visualiser, Tool Shell (template), Friday Phonecalls, P-Value Grapher |
| Computer Science *(separate subject — see below)* | `src/tools/ComputerScience/` | System Architectures, CPU Architecture (OCR J277 1.1.1) |

---

## Tool Architecture

### Two shells, by subject

Maths and Computer Science tools use **different** shared shells — they are different products and never mix:

- **`ToolShell`** (`src/shared/`) — the Maths shell for **question generators** (Whiteboard / Worked Example / Worksheet). This is the "shared shell" the rest of this section describes.
- **`CSShell`** (`src/shared/cs/`) — the Computer Science shell for **knowledge/revision** tools (Learn / Study / Cards / Quiz / Fill / Exam). See `CS_SHELL_PLAN.md`.

### Shared Shell (v2.3+) — Maths

Maths tools import from `src/shared/` and follow a common pattern. A tool file contains only its own logic:

```
Tool file = TOOL_CONFIG + INFO_SECTIONS + generateQuestion + generateUniqueQ
```

Everything else — navigation, mode switching, QO controls, difficulty levels, worksheet generation, PDF print — is handled by `ToolShell` from `src/shared/`.

### Tool Modes

| Mode | Description |
|---|---|
| **Whiteboard** | Single question displayed large, for whole-class teaching |
| **Worked Example** | Question with step-by-step solution revealed progressively |
| **Worksheet** | Grid of questions with optional answers, exportable to PDF |

Worksheets support three layouts:
- **Standard** — single difficulty level, configurable question count and columns
- **Differentiated** — three levels side by side on one sheet, independently configured

### Shareable links

The URL always reflects the current setup (mode, level, sub-tool, question options), so any configured state can be bookmarked or copied via the burger menu's **Copy Link to Setup**. A link pointing at worksheet mode generates the worksheet on arrival — one click from bookmark to teaching.

### Adding a New Tool (Maths)

This is the **Maths** path (question generators on `ToolShell`). Computer Science tools use `CSShell` and are authored as data — `npm run new-tool` refuses `--category ComputerScience`; follow `CS_SHELL_PLAN.md` instead.

1. **Design** the tool with Claude in a chat (this repo linked) via `DESIGN_STUDIO.md` — or the standalone *Tool Designer* project (`TOOL_DESIGNER_PROMPT.md`) — which outputs a completed spec (`TOOL_SPEC_TEMPLATE.md`) saved to `specs/<tool-id>.md`. CS tools, techniques and Teach decks have their own templates and homes — `DESIGN_STUDIO.md` routes to each.
2. **Scaffold**: `npm run new-tool -- --name "Display Name" --category Folder --path /url-path` — copies the template and registers it in `src/registry.ts`
3. **Implement** the tool-specific section (usually done by Claude Code working from the spec)
4. Run `npm run build` (zero TypeScript errors) and `npm test` (generator smoke tests)
5. Commit and push

Full instructions, helper API reference, and gotchas are in `CLAUDE.md`.

---

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check + production build
npm run preview   # Preview the production build locally
```

---

## CI / Deployment

**CI** runs on every push to `main` via `.github/workflows/ci.yml`. It installs dependencies and runs `npm run build`. A red CI tick means a TypeScript error or broken build — do not deploy until it is green.

**Deployment** is handled automatically by Vercel on every push to `main`. The `vercel.json` contains a catch-all rewrite rule so that React Router's client-side routes work correctly on direct URL access.
