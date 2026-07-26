# Technique specs

Completed technique briefs, one per file, named `<technique-id>.md` (the exported
function name, e.g. `solve-linear-equation.md`). Briefs follow
`../../TECHNIQUE_SPEC_TEMPLATE.md` and are produced by designing in a chat with
the repo linked (see `../../DESIGN_STUDIO.md`).

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the technique's design record |

## Workflow

1. Design the technique in a chat: *"Read `DESIGN_STUDIO.md` and let's design a
   new technique."* It outputs a completed brief with `Status: ready`.
2. Start a Claude Code session: *"Create `specs/techniques/<technique-id>.md` with
   the following content, then implement it"* — and paste the brief.
3. Claude Code adds the technique to `src/shared/techniques/` (and its matching
   skill if the brief calls for one), validates it, flips the status to
   `implemented`, and pushes.
