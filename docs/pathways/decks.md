# Decks
- **Status:** building
- **Updated:** 2026-10-31

## Intention
Whole lessons on their own page (`/decks/<id>`, also reached from a tool's burger menu): a stripped-down PowerPoint built around the site's own pieces (boards, practice questions, question grids, Depth cards, live generators). Harry refines the decks Claude builds, adds slides to them and builds his own. This pathway also absorbs the old **Slides** question (which of four slide surfaces survive) and **Lessons and Teach decks**: the plan is to fold the Teach tab and lesson decks into decks, then retire them.

## Progress
- Developing-tools gated. Player (keys, jump list, full screen, ink), slide editor (type on the slide, equation editor, smart guides, align, layers, undo, copy and paste, export and import), slide library, saving shared between devices (private Blob), boards with fill modes.
- Skill practice slides open on their own fixed questions (five or more per slide, with working matching the generator), optional misconception notes, and an optional one-note **slide brief** per slide (Lesson thread lists them all). Three shared question layouts (full-width, workspace right, workspace left). Depth cards are standalone full-slide faces.
- Generator slides with central configuration, book activities, Send to a deck, optional camera in the Whiteboard layout.
- First deck: Estimation, a rough first version that the Year 9 deck below replaced.
- Decided with Harry (2026-10-27): decks have their own place; hand-picked questions and Depth are built together as intentional designs; decks Claude builds are ordinary decks in the same format.
- Editor header and toolbar redesigned (2026-10-28): a menu bar (File, Edit, Insert, Slide, View), New slide, grouped Insert / Shapes / Questions, quick controls for the selection, a back arrow, a keyboard shortcuts window; panels start shut on a phone.
- Decks are data (2026-10-29): JSON in `src/decks/data/`, the shared copy is master, `npm run deck` pulls, pushes, builds and checks. A lesson-plan template, a slide features list and a house-style page (`docs/design/LESSON_STYLE.md`) shape each build.
- The Year 9 Estimation deck (44 slides, built from `specs/decks/estimation-y9.md`) replaced the first one, with seven new Estimation Depth cards; Estimation division now spreads its answers across the 2 to 12 tables; the Rounding tool runs in generator slides. Not yet taught: refine it after a real lesson.
- Deck builder and checks (2026-10-29): `src/decks/builder.ts` (slide kinds, question builders that write the tool's working and check it) and `deckChecks.ts` (maths, answers, set sizes, Depth numbers, generators, text fit); `npm run deck -- build|check [--layout]`. Question builders exist for Estimation and Rounding only.
- Quieter question slides (2026-10-29): no Solution options, More menu, teacher-guidance button or Print on book activities; Show all sits between the step arrows; authored sets are labelled Deliberate practice, generators General practice.
- Published decks (2026-10-29): a frozen read-only copy anyone can play (first-slide cards with an (i) on the landing page's **Decks** tab), and the editor, deck list and slide library behind the admin password. Publishing works once this is merged and deployed; nothing is published yet.
- Ratio table and bar model slide pieces (2026-10-30): both in the Insert menu and Add slide, with Filled in / Structure only / Blank and click-by-click building; the bar model is a shared picture (`src/shared/barModel.ts`) the ratio tools can reuse.
- Manipulating ratios deck (2026-10-31): 42 slides on the Ratio Manipulation tool, with the tool's own ratio tables and bar models in the fixed questions' working, and three pinned A5 worksheets.
- Pinned worksheets (2026-10-31): up to three printable worksheets per lesson, A5 with an answer sheet, printed from File → Worksheets and cued by a Worksheet slide that shows the answers on a click.
- Deck engine (2026-10-31): text and grids fit their boxes, one Depth design shared with the tool page, merge-safe rebuilds, the `preflight` / `verify` process and a written checklist, version history, change layout and slide templates in the editor.
- Lessons pilots (dev-gated): Indices (2 lessons) and Rounding (2 lessons); Fractions +/- has a Teach tab. Nothing live yet.

## Next steps
- Teach from the Year 9 Estimation deck, note what to change, then publish it (Publish this deck in the editor, after the merge).
- Match the slides' look to Harry's PowerPoints (needs one or two examples) and fill the "Look" section of `docs/design/LESSON_STYLE.md`.
- Question builders for more tools as decks need them; refresh the smoke scripts' slide numbers for the new deck.
- Remove the legacy bank code (`practice`, `grid.bank`, `estimationBank`, `materializeDeck`); add teacher notes per slide and an outline view for wording edits.
- The remaining core representations as slide elements (place value table, number line, area model, algebra tiles, counters, prime factor tiles), each with a blank state; draw ratio-table working in generator slides and allow it in fixed questions; a visible timer; match-up and sort.
- Editor: group / ungroup, rotate, a tablet check (laid out for a laptop).
- Decide which slide surfaces survive (leaning: keep decks and Depth, fold the Teach tab and skill slides in), try the lesson pilots with a class, retire the Teach tab and lesson decks, and decide when decks go live.
- Side tasks for decks, done when a deck needs them (not before): more slide pieces (place value table, number line, area model, counters, algebra tiles, prime factor tiles), Depth banks and fixed-question builders for tools that lack them. `npm run deck -- preflight <tool>` shows what a tool is missing.

## Where to read more
`docs/reference/decks.md`, `docs/design/LESSONS.md`, `docs/reference/depth-teach-lessons.md`, `specs/decks/`.
