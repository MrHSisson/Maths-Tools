# Deck specs

A deck is built from a lesson plan (`docs/design/templates/LESSON_PLAN_TEMPLATE.md`) or from a request in chat; either is enough. What a slide can hold: `docs/design/SLIDE_FEATURES.md`.

Decks are data: `src/decks/data/<id>.json`, with the shared copy as master (see `docs/reference/decks.md`). Rules for question slides (at least five fixed questions, working matching the generator) are R42 and R43 in `CLAUDE.md`.

`indices.md` and `sig-figs.md` here are older Teach-deck designs, kept as history.
