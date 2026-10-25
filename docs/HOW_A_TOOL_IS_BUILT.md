# How the repo builds a tool

How a tool is put together, in plain language: what is in a tool file and what each of the shared pieces around it is for.

## The big picture

A tool is one file that says what questions to make. Everything else (the three modes, the buttons, printing, links, the pictures that build up) is done by a shared shell, so the tool file only holds the maths.

- You (or a spec in `specs/`) say what the tool should teach.
- The tool file turns that into questions and worked answers.
- One line in `src/registry.ts` puts it on the site. Nothing else needs editing to add a route or a landing-page card.
- The shell (`src/shared/ToolShell.tsx`) wraps the tool and gives it Whiteboard, Worked Example, Worksheet, printing, share links and the rest.
- Tests check every tool automatically.
- A script reads the code and writes the facts the dashboard shows. You never type those.

## What is inside a tool file

A tool lives in `src/tools/<Strand>/<Name>.tsx`. In order, a tool file holds:

| Part | What it is | Be aware |
|---|---|---|
| Types | The small shapes the tool uses for its own numbers | Local to the file. Do not redefine shared types |
| `TOOL_CONFIG` | The tabs (sub-tools), the levels (and a plain line for what each level means, `levelLabels`, shown in the (i) beside the level buttons), and the Question Options (the switches a teacher can tick; mark one `displayOnly` if it only changes how the same question is shown) | Options that are alternatives belong in one pool; switches that can stack are separate. See "Question Options" in `CLAUDE.md` |
| `INFO_SECTIONS` | The text in the Tool Information box (burger menu); level descriptions do not go here | Comes from the spec's info section |
| `generateQuestion` | Makes one question: the display, the answer and the worked steps | Must give every question a `key` that describes it (never just a random number) so a worksheet does not repeat |
| `export const __test` | Hands the config and generator to the automatic tests | Never delete it. The build fails if a shell tool lacks it |
| `export default function App()` | Renders `<ToolShell … />` | Leave as the template has it |

Sample questions in the spec (the "acceptance reference") are the definition of correct: check your tool produces those shapes and answers.

## What the shell does for you (do not rebuild it)

Whiteboard, Worked Example (step by step, with the line building up one mark at a time), Worksheet (columns, differentiated levels, fullscreen), PDF printing, the level buttons, Question Options popovers, the (i) box, share links, recent and pinned questions, the ink pen on every page, and Teach / Lessons / Depth when a tool supplies them. A tool never writes its own buttons, popovers, print window or link handling.

## The files around a tool

| File or folder | What it is for | Be aware |
|---|---|---|
| `src/registry.ts` | The one list of every tool: id, path, name, description, strand, whether it is live | `enabled: false` means in development (only shows with Developing tools on). Never edit `App.tsx` or the landing page to add a tool |
| `src/shared/ToolShell.tsx` | The shell for question generators | About 2,100 lines in one component; change with care (see the decision tree) |
| `src/shared/index.ts` | The barrel: the one door tools import through | Tools import from `../../shared` only. Several tools still reach around it (a recorded decision) |
| `src/shared/types.ts` | Shared shapes: questions, steps, config, options | Underscore fields on a question (`_diagram`, `_rawValues`…) are the private hand-over between tool and shell and are not type-checked |
| `src/shared/helpers.ts` | Everyday generator helpers: `randInt`, `pick`, `step`, `mStep`, `tStep`, `fracStr`, `pickActive`, `fmt` | `mStep` is the default way to write a working step. Never put `\text{}` inside a step |
| `src/shared/math.ts` | Shared number maths: `gcd`, `lcm`, `gcdAll`, `shuffle` | `gcd` is never negative; `lcm` is 0 if either number is 0; `shuffle` is fair and returns a new list. Use these, do not write local copies. More helpers are listed as decisions |
| `src/shared/prompts.ts` | Says a shared prompt ("Simplify:") once on a worksheet | A question shaped as a maths-free line then a maths-only line gets this for free |
| `src/shared/print.ts`, `printDiagram.ts`, `worksheetLayout.ts` | Printing: text sheets, picture sheets, and the page-fill engine both share | Picture tools pass `handleDiagramPrint` and never hand-roll a print grid |
| `src/shared/layoutMode.ts` | Decides phone, tablet or laptop layout, including the "View as" override | Never read `matchMedia` yourself; use `useLayoutMode()` |
| `src/shared/placeValue.ts`, `ratioTable.ts`, `counters.ts`, `sigFigs.ts`, `carry.ts`, `longDivision.ts` | The pictures (representations) and their data | Pick one of the eight core pictures before inventing a new one |
| `src/shared/components/` | The shared screens and widgets (question display, popovers, tables, Depth stage, ink pen) | Tools use these through the barrel |
| `src/shared/depth.ts`, `lessons.ts`, `TeachingDeck.tsx` | Depth questions, lessons, and Teach slide decks | Optional extras a tool opts into |
| `src/shared/calibration.ts` | Measures how hard questions are so worksheets run easy to hard | Re-run the calibration after any change to a calibrated generator |
| `src/shared/decision/`, `src/shared/cs/` | The two other shells (Decision Maths; Computer Science revision) | Separate by design; they do not use `ToolShell` |
| `src/tests/` | The automatic checks | `generators.test.ts` renders every maths string for every tool; `organisation.test.ts` fails if a tool is unregistered or uncategorised |
| `src/generated/toolFacts.json` | The facts the dashboard shows, read from the code | Never edit by hand. Run `npm run facts` after changing a tool or the registry, and commit the result |
| `src/admin/` | The dashboard itself | Reads the generated facts and the notes |
| `api/` | The small server piece that stores the dashboard notes | Cannot import from `src/` |
| `specs/` | Briefs: what to build, with the sample answers that define correct | Only briefs marked `Status: ready` are built; mark `implemented` when done |
| `scripts/` | `new-tool` (scaffolds a tool), `toolFacts` (the facts), `notesPages` (planner pages), `adminDocs` (these dashboard pages) | Run through `npm run …` |
| `docs/` | The written project: plan, tidy-up list, history, glossary, design notes | See the documentation map in `CLAUDE.md` |
| `CLAUDE.md` | The rules Claude reads every session | The single source of truth for conventions |

## Extra files that sit beside a tool

A bigger tool can have helper files next to it, named after it:

- `<Tool>Depth.ts` holds the Depth questions (for example `OrderOfOperationsDepth.ts`).
- `<Tool>Lessons.ts` holds the lesson steps; `<Tool>Teach.ts` holds the Teach slides.
- `<Tool>.calibration.ts` holds the measured difficulty table. It is written by a test run, not by hand.
- Large tools split their maths into `…Core.ts`, `…Algebra.ts` and so on (Indices does this).

Each of these is optional and only appears when the tool passes it to the shell.

## Things to be aware of

- Import from `../../shared` only; never import another tool.
- Never edit a generated file. Run `npm run facts` and commit the result; a test fails if it is stale.
- Keep `__test`. Without it the tool is not checked.
- Keys must describe the question so a worksheet does not repeat itself.
- Check the three screen sizes (phone, tablet, laptop) by hand for anything with a custom picture.
- Developing tools mode hides unfinished things (tools with `enabled: false`, Teach decks, lessons). A tool goes live by deleting `enabled: false`.
- A worksheet generated from a calibrated tool is spread across measured difficulty; the Smart Progressor switch turns this off.
- Work on a fresh branch, run `npm install` first, and make sure `npm run build` and `npm test` pass before pushing.

## Making a new tool, in order

1. Have a brief in `specs/` (or answer the questions in `CLAUDE.md`).
2. `npm run new-tool -- --name "Display Name" --category <Folder> --path /url --description "One sentence."` copies the template and registers it as in development.
3. Fill in the types, `TOOL_CONFIG`, `INFO_SECTIONS` and `generateQuestion`; write worked steps with `mStep`.
4. Check the sample questions from the brief come out right.
5. `npm install`, `npm run build`, `npm test`.
6. Run `npm run facts` and commit the JSON.
7. Remove `enabled: false` when it is ready to go live.
8. Update the tool's dashboard notes, the patch notes, and the planner Build Log.
