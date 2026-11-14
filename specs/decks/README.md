# Deck specs

A deck is built from a lesson plan (`docs/design/templates/LESSON_PLAN_TEMPLATE.md`) or from a request in chat; either is enough. What a slide can hold: `docs/design/SLIDE_FEATURES.md`. How Harry's decks are shaped (read before planning one): `docs/design/LESSON_STYLE.md`.

Decks are data: `src/decks/data/<id>.json`, with the shared copy as master (see `docs/reference/decks.md`). Rules for question slides (at least five fixed questions, working matching the generator) are R42 and R43 in `CLAUDE.md`.

`indices.md` and `sig-figs.md` here are older Teach-deck designs, kept as history.

A build script is the worked example of the shared pieces: `factors-hcf-systematic-listing.build.ts` (plan `factors-hcf-systematic-listing.md`). Before building a whole deck, run `npm run deck -- looks <script>` for the look card and get Harry's yes on it; after building, `npm run deck -- review <id>` and look at every sheet (`docs/design/DECK_BUILD_CHECKLIST.md`).
