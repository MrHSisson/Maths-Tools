# Tasks

Smaller things to do: checks, consistency fixes, tidy-ups and one-off jobs. Larger developments are **pathways** in `docs/pathways/`. Building or reviewing one tool is tracked in that tool's dashboard note, not here.

**A task is added only when Harry asks for it, or when it has been suggested in chat and Harry approves.** Do not add tasks (or pathway next steps) on your own initiative; suggest them in chat instead.

**Format:** one `### ` heading per task under a status heading, then a line on what and why, and `Links:` if it has any. Status headings: In progress · Open · Recurring · Done (recent). Move a task when its status changes; delete done tasks after a month.

## In progress

Nothing at the moment.

## Open

### Decks: see and push deck changes before they are merged (previews, a bypass secret, a tolerant server)
Banked 2026-11-17 at Harry's request. **Why:** deck data lives in Vercel Blob on the live server, which validates every question with the code on `main`. So a deck that uses something new (a shape, a field) is refused until the code is merged, and a branch's preview deployment is behind the Vercel login, so Claude cannot push to it or check it. Harry then cannot see the work. **Do, in order:**
1. **Merge code before content.** Code that changes the deck data format (`api/_rectilinear.ts`, validators, the renderers) goes to `main` in its own small merge; the deck content is pushed straight after. Add this rule to `AGENTS.md`.
2. **Harry (about five minutes, in the Vercel dashboard):** project `maths-tools` → Settings → Deployment Protection → *Protection Bypass for Automation* → add a secret (give it to Claude through the secure credential form, never in chat). Then Storage → create a second Blob store and connect it to **Preview only** (Production keeps the current store), so a preview never writes to the live decks. Check first whether previews currently share the production store; if they do, pushing from a preview changes the live deck.
3. **Claude:** make `scripts/deck.mjs` send the bypass secret (`x-vercel-protection-bypass`) when `DECKS_URL` is a preview; copy the live decks into the preview store once (`backup` writes them into the repo); make `push` refuse to write to the live store from a branch with unmerged deck code and push to the preview instead (today it only warns).
4. **Claude:** make the server tolerant: `api/_rectilinear.ts` / `api/_decks.ts` accept unfamiliar optional fields and shapes after a dimension sanity check, and the app shows "needs the latest version" for a question it cannot draw instead of crashing the slide. Tests for both. (This only helps once merged; it does not fix an unmerged branch.)
5. Document the setup (store split, secret name, how to push to a preview) in `docs/reference/decks.md` and `docs/design/DECK_BUILD_CHECKLIST.md`.
**Done 2026-11-17:** the rectilinear branch was merged (PR #139) and the deck pushed once the deploy finished, so the capital I, unequal steps and the new worksheet are on the live deck. Steps 1–5 above are still open.
Links: `scripts/deck.mjs`, `api/_decks.ts`, `docs/reference/decks.md`

### Standard Form: finish the tool and take it live
Banked 2026-11-15 at Harry's request. The tool (`/standard-form`, four sub-tools: Converting, Multiplying & Dividing, Adding & Subtracting, Comparing & Ordering) is built and **went live on 2026-11-17 at Harry's request** (no longer dev-gated; the review below is still open). Still to build or decide: a spec file `specs/standard-form.md` and the "About this tool" review; a Depth bank (the "which of these is in standard form?" multiple choice and the misconception options belong there, not in the generator); a Teach deck and lesson; calibration; a phone and tablet check of the Converting picture (a 3-digit coefficient with a large power is about 12 columns wide); whether calculator-style coefficients (Multiplying & Dividing) should be on by default; whether the place value shift picture (digits slide a column, the power rolls by 1) should also be used on Multiplying & Dividing when the coefficient is adjusted, and on Adding & Subtracting when a term is matched; a printable blank place value grid; and an optional play button that runs the whole slide on its own. Review notes go on the tool's dashboard note.
Links: `src/tools/Number/StandardForm.tsx`, `StandardFormConvert.ts`, `StandardFormMulDiv.ts`, `StandardFormAddSub.ts`, `StandardFormGrid.ts`, `src/shared/components/PlaceValueShift.tsx`, `src/tests/standardForm.test.ts`, `docs/reference/pictures.md` (place value shift), `docs/PATCH_NOTES.md` (2026-11-15).

### Prime factorisation lesson (factor trees)
Banked 2026-11-15 at Harry's request. **Deck built 2026-11-18 (`prime-factor-trees`, 29 slides; awaiting Harry's review and a push to the shared copy).** Earlier:  the plan is `specs/decks/prime-factor-trees.md` (agreed with Harry; he draws the trees himself, so the deck is questions and answers only). A **Factor tree slide piece** was built on branch `ccr-8fd397fb-lwfz38` but this deck does not use it; still to do: the sets and the table for Harry, four misconception tags, the look card, the deck. Original note: A lesson on prime factorisation using factor trees: the Phase 3 sketch in `specs/decks/primes-and-divisibility.md` is the starting point, with the existing `factorTree` Teach scene and the prime factor tiles representation. Needs a lesson plan first (`docs/design/templates/`), then a deck; consider whether a Prime Factorisation tool follows.
Links: `specs/decks/primes-and-divisibility.md`, `docs/pathways/decks.md`, `docs/design/LESSON_STYLE.md`.

### Deck clicker: try it with Harry's USB clicker
Banked 2026-11-15. The deck player now reads a USB presentation clicker's keys (Page Down/Up, arrows, Enter, media keys; `.` blanks the screen, F5 full screen, K shows a key test) but has **not been tried with the real clicker**: in a deck press K, press each button and note what shows; if it still does nothing, map the key in `src/decks/clickerKeys.ts`.
Links: `src/decks/clickerKeys.ts`, `src/decks/DeckPage.tsx`, `docs/reference/decks.md`.

### Worksheet formats: textbook style and more on a page
Banked 2026-11-03 at Harry's request, not started. The printed worksheet (pinned worksheets: File → Worksheets, and the tool pages' Worksheet) feels limited: the cell structure caps how much fits on a page. Idea: a **textbook-style** option (flowing columns, thin dividers instead of boxed cells, lettered parts) that fits 20 to 30 questions on a page while still looking clean and well divided; the tool pages already have a Worksheet / Textbook layout (`layout: "grid" | "list"`) that a pinned worksheet could offer under that name. Still to settle with Harry: whether this is the printed sheet or the on-slide book work (assumed: the printed sheet), the page sizes (A5 by default today), and how many questions a sheet may hold.
Links: `src/decks/worksheets.ts`, `src/shared/print.ts`, `docs/reference/decks.md` (pinned worksheets).

### Questions render inside their containers
Check that every tool's questions, working and pictures stay inside their boxes at phone, tablet and laptop sizes. Picked up tool by tool during reviews.

## Recurring

### Tool review cycle
Each tool is reviewed when we reach it; the record is that tool's dashboard note.

### Three screen sizes
Anything visual is checked at phone, tablet and laptop (see `CLAUDE.md`).

## Done (recent)

### Critical Path: a backward pass of its own
Done 2026-11-10. A **Backward pass** sub-tool (AS, skills practice, three levels like Forward pass): every earliest start is given with the minimum time at End, and the student fills in the latest finishes, working back from End. Paired with DE2 on the Decision Maths hub; Full analysis moved to DE3.
Links: `src/tools/Decision/CriticalPath.tsx`, `src/shared/decision/cpa.ts` (`cpaBackward`), `src/shared/decision/cpaSolve.ts`, `src/tools/Decision/decisionSpec.ts`.
