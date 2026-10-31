# Building a deck: what has gone wrong, and the guard for each

Read before building or changing a deck (after `docs/reference/decks.md`). Every row is something that cost a round of feedback; the right-hand column is the thing that now catches it, or the rule that stops it. **If a guard says "rule", nothing catches it automatically: check it by hand before showing Harry.**

## The process (every deck)

1. **Preflight each tool the lesson uses:** `npm run deck -- preflight <tool-id>`. It says whether the tool draws on every tab and level, whether a mixed set is really mixed, whether it has a Depth bank and whether it has a fixed-question builder. Whatever is missing is built **as part of this deck** (the next sections say how), never skipped and never left for review to find. A tool with no Depth bank gets none in the deck unless Harry asks for a bank.
2. **Plan** the lesson on the skeleton below, with a "what already exists" table against the tool.
3. **Build** the script, using only `Q.*` builders for authored questions and `S.*` for slides. If a picture the lesson needs is not a slide piece yet, note it for the deck's side-task list (below) and use a plain-words version for now.
4. **Verify:** `npm run deck -- verify <id>` (content, layout, printed worksheets, the deck's Depth cards). Fix everything it reports before Harry sees the deck.
5. **Show it, then push** (`npm run deck -- push <id>`; pull first if Harry may have edited).

### The lesson skeleton

Title · Learning objective · Starter (retrieval grid, optional) · for each idea: Divider → teach with a picture (ratio table, bar model, board) → discussion (a claim to test) → fixed set (5 or more, the tool's own working) → live generator · **then ONE take-home piece per idea or stage: a pinned worksheet (A4, 12, with answers) OR book work (3 × 4), not both** · Depth card at the end of each section (numbers the deck does not use elsewhere) · Summary. Sections are pick-up points, not timed.

### Side tasks that deck work uncovers (not built until a deck needs them)

More pictures as slide pieces (place value table, number line, area model, counters, algebra tiles, prime factor tiles); Depth banks for tools without one; builders for tools without one. Keep this list in `docs/pathways/decks.md`.

## Before building

| Pitfall | Guard |
|---|---|
| The tool cannot do what the lesson needs (a level missing, two kinds that cannot be mixed in a set, wording that hides the idea) | Write the plan, then a "what already exists" table against the tool (see `specs/decks/manipulating-ratios.md`). Change the tool first, as its own step, with its own tests. |
| The tool's levels do not match the lesson's stages | Agree with Harry which level is which stage before building; re-level the tool if that is simpler than working around it. |
| A mixed option set is secretly one-sided (rejection sampling favoured the easy kind: Level 3 was nearly all "of the total") | Any generator with a pool of kinds needs a test that counts the kinds over many questions (`ratioFractionOf.test.ts`). Choose the kind once, then retry the numbers within it. |
| Fixed questions that do not look like the tool's (hand-typed working, different wording) | Every authored set comes from a `Q.*` builder that calls the tool's own code. If there is none, extract the generator's inner function so the builder can call it (`ratioFromFraction.ts` is the pattern). `Q.open` is the last resort. |

## While building

| Pitfall | Guard |
|---|---|
| Text too big or too small for its box | Automatic: text boxes and grids fit themselves; do not set sizes by hand in a build script. Boxes of the same role on a slide share one size. |
| A discussion slide that asks nothing, or repeats the slide before | Checked: the prompt must contain a question; two slides in a row may not ask the same text. A discussion needs a claim to test, two views, or a mistake to find, not an instruction. |
| Depth cards reusing the deck's numbers | Checked (deck check). Pick the Depth numbers early; a book-work set that uses the same numbers will clash later. |
| Book work cramped or off-standard | **Standard grid is 3 × 4** (12 questions). 2 × 6 is for printed worksheets only. Instructions that are the same for every question go once in the subtitle. A set that mixes two forms must not repeat a pair (8 : 20 as 1 : n and 20 : 8 as n : 1). Mixed forms in a random order, equal numbers of each. |
| Answers shown under the question | Grids replace the question with its answer, and a double-tap flips one box. |
| Printed worksheets spilling | `npm run smoke:deck-print -- <id>` counts the pages of every pinned sheet (questions and answers); it must be 1. A4 holds 12 questions at 20px. |
| Buttons of different sizes on different slides | One look for every slide button: `slideButton` in `src/decks/slideButton.ts` (26 units, 48 tall); the Depth slide takes the same size. Never style a new slide button by hand. |
| Names in words where the real thing is shorter ("pound coins") | Write money as £1, 50p, £10. Prefer symbols a pupil would write. |
| Questions in the order of the sentence every time | Vary the order asked (red to blue, then blue to red); three-part ratios asked out of order. |

## Before showing it

1. `npm run deck -- verify <id>` runs the content check, the layout check, the one-page print check (if it has pinned worksheets) and the Depth-card audit (if it has Depth cards). The single pieces are `check <id> --layout`, `npm run smoke:deck-print -- <id>` and `npm run smoke:depth-slides`.
2. Look at one picture per kind of slide, not every slide: a contact sheet of the new kinds.
3. `npm run lint`, `npm test`, then `npm run deck -- push <id>` (pull first if Harry may have edited).

## Tooling traps (for the session itself)

- `npm install` first. Start the dev server with `nohup npx vite --port 5191 --strictPort --host 127.0.0.1 &`; it dies between commands, so check before each browser script.
- Decks and the editor need `localStorage["mt-dev-mode"]="1"` in a script.
- Never `pkill -f` a pattern that appears in your own command: it kills the shell.
- The shared copy of a deck is master: `npm run deck -- pull <id>` before editing, `push` after. Build scripts live outside the repo and rebuild with `--replace`.
- The print window loads KaTeX from a CDN, which a sandbox cannot reach: the print smoke reads it from `node_modules`.
- A test that fails after a rename is usually `localExports` (an export nothing imports) or `claudeDocs` (a never/always/must sentence needs `<!-- ref -->`).
