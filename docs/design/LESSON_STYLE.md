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

## Words and definitions

- The definition students write down comes early, in the first section: a vocabulary slide, then a key definition in formal wording.

## Depth

- New Depth cards are authored for the tool when it has none that fit. They use numbers the deck's own questions don't, and sit at the end of a section.

## Slides

- Board and slide titles fit on one line (about 38 characters at the board title size); no fraction in a large title; prompts one line.
- No More menu, no teacher-guidance button, no Print on book activities. The question is centred.
- Book activities: whole numbers 12 questions in 3 columns; fractions and decimals 8 in 2 columns.
- A slide brief only where Claude chose the content; one or two sentences.
- Run `npm run smoke:deck-layout -- <deck id>` before handing a deck over.

## Workflow

- Harry sends a lesson plan (`docs/design/templates/LESSON_PLAN_TEMPLATE.md`) or just a request. Claude replies with a plan as tables in `specs/decks/<id>.md` for review, then builds.
- Harry edits wording in the player. Claude pulls the shared copy before changing anything (`npm run deck -- pull <id>`).
- One plan file per deck, no per-slide essays.

## Look (not yet written)

How the slides look (fonts, colours, backgrounds, how titles and pictures sit) has not been matched to Harry's PowerPoints yet. Slides are plain white with a small coloured bar per kind of slide. Attach one or two typical PowerPoints (or screenshots) and this section gets filled from them.
