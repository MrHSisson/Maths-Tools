# CS topic specs

Completed Computer Science revision-topic briefs, one per file, named
`<topic-id>.md` (the tool's URL path without the slash — e.g.
`cpu-performance.md`). Briefs follow `../../CS_TOPIC_SPEC_TEMPLATE.md` and are
produced by designing in a chat with the repo linked (see `../../DESIGN_STUDIO.md`).

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the topic's design record |

## Workflow

1. Design the topic in a chat: *"Read `docs/design/DESIGN_STUDIO.md` and let's design a new CS
   tool."* It outputs a completed brief with `Status: ready`.
2. Start a Claude Code session: *"Create `specs/cs/<topic-id>.md` with the
   following content, then implement it"* — and paste the brief.
3. Claude Code builds the topic on the `CSShell` (see `../../CS_SHELL_PLAN.md`),
   validates it, flips the status to `implemented`, and pushes.
