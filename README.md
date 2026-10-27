# Maths Tools

A web app of interactive teaching tools, hosting **two subjects** on one site:

- **Mathematics** — question-generator tools built around the **"I Do, We Do, You Do"** pedagogy (GCSE strands plus an A-level Pure and Decision
  Mathematics band). Most tools offer Whiteboard, Worked Example and Worksheet modes with difficulty levels, differentiated worksheets and print; some
  add Depth (curated diagnose / explain / extend questions).
- **Computer Science** — OCR J277 GCSE knowledge and revision tools (Learn · Study · Cards · Quiz · Fill · Exam) on a separate shell, `CSShell`, plus
  procedural generators (binary, number bases, data units) on the maths shell.

The landing page bands tools by subject. Which tools exist, and which are live or still in development, is shown on the **Tools dashboard** (`/admin`,
Developing-tools mode) — it is generated from the code, so it is the one list that is never out of date.

Deployed at: [maths-tools-phi.vercel.app](https://maths-tools-phi.vercel.app)

### Documentation

| Doc | Job |
|---|---|
| `CLAUDE.md` | The rules — conventions, the Rules checklist, how to build a tool. Start here. The shared-API reference is in `docs/reference/`. |
| `docs/PROJECTS.md` | The plan — where every prong is up to and what's next. |
| `docs/TIDY_UP.md` | What is loose and needs tidying (current priority). |
| `docs/PATCH_NOTES.md` · `docs/history/` | Session-by-session history (Maths / CS), newest first; `docs/history/` holds the older months. |
| `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` | The `CSShell` / `DecisionShell` architecture. |
| `docs/GLOSSARY.md` | Canonical name for every element. |
| `docs/BACKBENCH.md` | Paused work (the Skills library). |
| `docs/design/` | Designing a build with Claude: `DESIGN_STUDIO.md` routes to the right fill-in template in `docs/design/templates/`; `LESSONS.md` (lessons and decks) and `CAST.md` (Depth characters). |
| `specs/` | The completed briefs each tool or deck was built from. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Maths rendering | KaTeX (bundled via npm; the print window loads it from a CDN) |
| Charts | Recharts (the P-Value Grapher) |
| Print / PDF | the browser's print dialog, through shared print handlers (`src/shared/print.ts`, `printDiagram.ts`) |
| Icons | Lucide React |
| Tests | Vitest (`npm test`) |
| Shared tool notes | Vercel Blob behind `api/tool-notes.ts` |
| Deployment | Vercel |
| CI | GitHub Actions (`.github/workflows/ci.yml`: `npm run build` and `npm test`) |

---

## Project Structure

```
├── .github/workflows/ci.yml   # CI — type-check, build and run the tests on every push and pull request to main
├── api/                       # Vercel functions (tool notes for the Tools dashboard)
├── docs/                      # Plans, history, architecture, design notes (see the table above)
├── scripts/                   # new-tool scaffold, toolFacts generator, notesPages (planner page text)
├── specs/                     # Build briefs
├── src/
│   ├── registry.ts            # Single source of truth — every tool's route, card data and lazy import
│   ├── App.tsx                # Routes generated from the registry
│   ├── components/            # LandingPage and the tool error boundary
│   ├── admin/                 # The Tools dashboard
│   ├── generated/             # toolFacts.json (written by scripts/toolFacts.mjs before every build)
│   ├── shared/                # ToolShell and everything tools share
│   │   ├── decision/          #   DecisionShell and the network / graph library
│   │   ├── cs/                #   CSShell (revision tools)
│   │   ├── grapher/           #   SmartGrapher
│   │   ├── skills/ techniques/ mathsWords/ components/ …
│   ├── tools/                 # One folder per strand: Number, Algebra, Proportion, Geometry, Decision,
│   │                          #   Binary, ComputerScience, Generators, Interactive, TeacherTools
│   └── tests/                 # Vitest suites (generator smoke tests, solver checks, drift checks)
├── CLAUDE.md                  # Instructions for Claude Code (AI development)
├── vercel.json                # SPA rewrite rule for client-side routing
└── package.json, tsconfig.json, tailwind.config.js, vite.config.ts
```

---

## Tool Architecture

### Three shells, by kind of tool

- **`ToolShell`** (`src/shared/`) — maths **question generators**: Whiteboard / Worked Example / Worksheet, plus Depth, Teach and lessons where a tool supplies them.
- **`DecisionShell`** (`src/shared/decision/`) — network-native Decision Maths tools (graphs, flows, critical paths), with a step-through solution and exam-style practice.
- **`CSShell`** (`src/shared/cs/`) — Computer Science **knowledge / revision** tools. See `docs/architecture/CS_SHELL_PLAN.md`.

A ToolShell tool file contains only its own logic — `TOOL_CONFIG`, `INFO_SECTIONS` and `generateQuestion` — and the shell provides navigation, modes, Question Options,
levels, worksheet generation, print, shareable links and the rest. The full reference is in `docs/reference/` (indexed from `CLAUDE.md`).

### Modes (ToolShell)

| Mode | Description |
|---|---|
| **Whiteboard** | A single question displayed large, for whole-class teaching |
| **Worked Example** | The question with its step-by-step solution revealed one mark at a time |
| **Worksheet** | A grid of questions with optional answers, printable; standard or differentiated (a column per level) |
| **Depth** | A bank of fixed, curated questions by purpose and level (only where a tool supplies one) |

### Shareable links

The URL always reflects the current setup (mode, level, sub-tool, question options), so any configured state can be bookmarked or copied with the burger menu's
**Copy Link to Setup**.

### Adding a New Tool (Maths)

1. **Design** the tool with Claude in a chat (this repo linked) via `docs/design/DESIGN_STUDIO.md`, which outputs a brief in `specs/`.
2. **Scaffold**: `npm run new-tool -- --name "Display Name" --category Folder --path /url-path` — copies the template and registers it in `src/registry.ts` (not live until `enabled: false` is removed).
3. **Implement** the tool-specific section (usually Claude Code working from the brief).
4. Run `npm run build` (zero TypeScript errors) and `npm test`, then commit and push.

Computer Science revision tools are authored as data for `CSShell`; `npm run new-tool` refuses `--category ComputerScience`. Full instructions are in `CLAUDE.md`; the helper API and the gotchas are in `docs/reference/`.

---

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Regenerate tool facts, type-check and build for production
npm test          # Generator smoke tests and the drift checks
npm run facts     # Regenerate src/generated/toolFacts.json after changing a tool or the registry
npm run preview   # Preview the production build locally
```

---

## CI / Deployment

**CI** runs on every push and pull request to `main` via `.github/workflows/ci.yml`: it installs with `npm ci`, runs `npm run build` and then `npm test`. A red tick means a
TypeScript error, a broken build or a failing test — do not merge until it is green.

**Deployment** is handled by Vercel on every push to `main`. `vercel.json` has a catch-all rewrite so that React Router's client-side routes work on direct URL access.
