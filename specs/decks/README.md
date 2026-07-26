# Teach deck specs

Completed Teach-deck briefs, one per file, named `<tool-id>.md` (the tool the
deck attaches to — e.g. `fractions-add-sub.md`). Briefs follow
`../../TEACH_DECK_SPEC_TEMPLATE.md` and are produced by designing in a chat with
the repo linked (see `../../DESIGN_STUDIO.md`).

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the deck's design record |

## Workflow

1. Design the deck in a chat: *"Read `DESIGN_STUDIO.md` and let's design a Teach
   deck for <tool>."* It outputs a completed brief with `Status: ready`.
2. Start a Claude Code session: *"Create `specs/decks/<tool-id>.md` with the
   following content, then implement it"* — and paste the brief.
3. Claude Code authors the `teachingSlides` array in the tool file (adding any new
   scene type the brief flags), validates it, flips the status to `implemented`,
   and pushes.
