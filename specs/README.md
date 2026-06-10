# Tool specs

Completed tool specifications, one per file, named `<tool-id>.md` (the tool's
URL path without the slash). Specs follow `../TOOL_SPEC_TEMPLATE.md` and are
produced by the Tool Designer project (see `../TOOL_DESIGNER_PROMPT.md`).

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the tool's design record |

## Workflow

1. Design the tool in the *Tool Designer* claude.ai project; it outputs a
   completed spec with `Status: ready`.
2. Start a Claude Code session: *"Create `specs/<tool-id>.md` with the
   following content, then implement it"* — and paste the spec.
3. Claude Code builds the tool, validates its generator against the spec's
   acceptance set, flips the spec's status to `implemented`, and pushes.

The spec stays in this folder after implementation — it documents the
pedagogy and is the starting point for future changes to the tool.
