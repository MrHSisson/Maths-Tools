# How Harry's decks are built

A living page, one screen long. Read it before planning or building a deck; change a line here whenever feedback changes a rule, so the next deck starts right. Source so far: the Year 9 Estimation deck review (2026-10-29).

## Shape

- **One deck per topic**, worked through in order and picked up mid-slide. It is built for about two lessons, with no fixed timings.
- **Section dividers are the pick-up points.** The slide after the divider where a lesson is likely to restart is a recap of four quick questions.
- **Order of a section:** worked board → deliberate practice → general practice → book activity → Depth. Starters and exit tickets only where they earn their place.
- **Easiest first:** whole numbers, then fractions, then decimals (or whatever the pupils' route needs).

## Questions

- **Deliberate practice** is one authored set of 6 or 7 questions (never fewer than 5), climbing gently. **General practice** is the generator slide straight after it.
- **Edge cases are few and sit at the end of a set**, one of each kind, never several in a row: too many cost morale. The generator already avoids the awkward ones.
- Calculators are available, so numbers are not limited to mental arithmetic beyond what the method needs. Worked boards end with a **Calculator** column beside the estimate.
- Answers should spread across the tool's range, not pile on 5, 10 and 2. Check the generator's answers before relying on it.
- Authored working matches the generator's method and labels.
- **Independent book work uses fresh questions**, rather than repeating worked examples or whiteboard practice. For common multiples, reversing the numbers does not make a new question.

## Words and definitions

- The definition students write down comes early, in the first section: a vocabulary slide, then a key definition in formal wording.

## Depth

- New Depth cards are authored for the tool when it has none that fit. They use numbers the deck's own questions don't, and sit at the end of a section.

## Slides

- **Ratio tables and bar models start Structure only too**, and are built up by click (staged) where the lesson models them.
- **When modelling multiples**, show the repeated addition with arrows between consecutive terms and the +n beneath each arrow.
- **Boards (tables) are always Structure only**, never Blank or Filled in: the given column shows and the class fills the rest. It is the default for a new board.
- Board and slide titles fit on one line (about 38 characters at the board title size); no fraction in a large title; prompts one line.
- No More menu, no teacher-guidance button, no Print on book activities. The question is centred.
- **Book work and worksheet slides have no title** (decided 2026-11-01): the questions fill the slide so they project as large as possible. Only an instruction the pupils need ("Copy into books and simplify") goes above them, in one line. `S.bookWork` builds one. Nine long questions fit as 3 × 3.
- **Book activities default to 12 questions in 3 columns (4 rows).** An explicit request for another count takes precedence, such as nine questions in 3 × 3. Decks built before 2026-10-29 may still have 8 in 2.
- A slide brief only where Claude chose the content; one or two sentences.
- **Starters** use the Starter layout (2 × 2 numbered boxes); a timer can be saved on the slide (Slide settings → Timer) or called in the player.
- **Questions Claude authors follow the routine** in `docs/design/DECK_BUILD_CHECKLIST.md` (plan the ladder and traps with Harry first, recompute every answer, show him a table); authored questions have no levels.
- **A deck Harry edits can still be changed by Claude**: saves are merged by slide and element (his version wins a clash); pull before changing anything.
- Run `npm run deck -- check <deck id> --layout` before handing a deck over.

## Looking right on a projector (decided with Harry, 2026-11-14)

These are built into `src/decks/pieces.ts` (`LOOK`, `S.whiteboard`, `S.plainBook`, `S.exitRows`, `S.pairModel`, `quiet`, `hintLine`, `mathsStack`, `mathsGrid`): use the pieces, do not hand-place and hand-size a slide that one of them draws.

- **Hints are quiet.** Small and grey, never as big as the question: a tiny grey line under a number in book work (`Hint: 3 pairs`), the count in small grey brackets after a number on a whiteboard (`60 (6 pairs)`).
- **Two numbers, one line.** A question about two numbers keeps them on one line (in the sentence, as the headings of a table, or in one expression with their counts). Each factor pair, or step, has its own line, lined up; never two pairs of one number side by side.
- **Whiteboards are full-width and centred**, with the question kept short (under 170 characters, which is what the player centres), at size 56 (60 with a table), inset 48. Help climbs: partly completed, then a count, then nothing; the last whiteboard in a section has no help and a friendly number.
- **Whiteboard numbers are bigger than book numbers**, so a factor or answer is not seen at a glance and pupils have to use the method.
- **Book work is plain big numbers** (size 100, centred) with the instruction once at the top: nine questions, 3 × 3, six with a hint and the last three with none, beginning to stretch. The exit ticket is one question to a row.
- **Titles sit in the same place** on the same kind of slide (`titleEls`); the deck check warns when one does not.
- **No drawn imitation of a calculator or other device.** Say what to type and what it shows, in plain text, one step per click; draw a device only if it can be a real, working piece.
- **Fresh numbers.** The numbers of a worked example or discussion are not asked about in any question, no number is asked about twice inside a section, the exit ticket uses numbers used nowhere else and no pair repeats (`assertFreshNumbers`; `build` fails on a repeat).
- **Pitch and plain words.** Check the class profile in the plan before choosing numbers. Prefer plain words to jargon and acronyms, and keep each slide self-contained: a slide does not rely on something shown three slides earlier.

## Workflow

- Harry sends a lesson plan (`docs/design/templates/LESSON_PLAN_TEMPLATE.md`) or just a request. Claude replies with a plan as tables in `specs/decks/<id>.md` for review.
- **The look card comes next, before the whole deck is built:** `npm run deck -- looks <script>` writes contact sheets of one slide of each kind in every state (each question, the working open, the answers shown). Harry says yes, or what to change, on those pictures; then the rest is built with `npm run deck -- build` (see `docs/reference/decks.md`).
- **After building, look.** `npm run deck -- review <id>` writes a contact sheet of every slide with all its clicks revealed; the checks cannot tell whether a deck looks right, so look at every sheet before showing it.
- **When feedback reverses an earlier decision, show a before and after** (a look-card picture) and confirm it, instead of rebuilding on a reading of the words.
- **A deck does not rely on code that is not on main.** The live site runs main, so a deck that needs a changed player or shared component looks different there until it is merged. Merge first, or send Harry the branch preview link with the deck (`push`, `verify` and `review` warn when the branch changes such code).
- Harry edits wording in the player. Claude pulls the shared copy before changing anything (`npm run deck -- pull <id>`).
- One plan file per deck, no per-slide essays.

## Look (not yet written)

How the slides look (fonts, colours, backgrounds, how titles and pictures sit) has not been matched to Harry's PowerPoints yet. Slides are plain white with a small coloured bar per kind of slide. Attach one or two typical PowerPoints (or screenshots) and this section gets filled from them.
