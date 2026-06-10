# Maths Tools

A collection of interactive maths tools for classroom teaching and independent practice, built around the **"I Do, We Do, You Do"** pedagogy. Each tool supports three modes — Whiteboard, Worked Example, and Worksheet — with three difficulty levels and PDF export.

Deployed at: [maths-tools.vercel.app](https://maths-tools.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Maths rendering | KaTeX (loaded via CDN) |
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
├── CLAUDE.md                   # Instructions for Claude Code (AI development)
├── index.html                  # Vite HTML entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
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
| Computer Science | `src/tools/ComputerScience/` | System Architectures |

---

## Tool Architecture

### Shared Shell (v2.3+)

All current tools import from `src/shared/` and follow a common pattern. A tool file contains only its own logic:

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

### Adding a New Tool

1. Copy `src/tools/TeacherTools/ToolShell.tsx` as a template
2. Save to `src/tools/<Category>/<ToolName>.tsx`
3. Add one entry to the correct category in `src/registry.ts` — the route and landing-page card are generated from it
4. Run `npm run build` — must pass with zero TypeScript errors
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
