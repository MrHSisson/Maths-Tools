# Specs — design briefs for Claude Code

Completed design briefs, produced by thinking a build through with **Claude in a
normal chat** (repo linked; see `../DESIGN_STUDIO.md`) and implemented by **Claude
Code**. Four kinds of build, each with its own template and home:

| Build | Template | Briefs live in |
|---|---|---|
| **Maths tool** (question generator) | `../TOOL_SPEC_TEMPLATE.md` | `./<tool-id>.md` (this folder) |
| **CS tool** (J277 revision topic) | `../CS_TOPIC_SPEC_TEMPLATE.md` | `./cs/<topic-id>.md` |
| **Technique** (reusable working-step block) | `../TECHNIQUE_SPEC_TEMPLATE.md` | `./techniques/<technique-id>.md` |
| **Teach deck** (a tool's Teach-mode slides) | `../TEACH_DECK_SPEC_TEMPLATE.md` | `./decks/<tool-id>.md` |

Maths-tool briefs sit at the root of this folder (as `<tool-id>.md`); the other
three kinds sit in the typed subfolders above, each with its own README.

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the design record |

## Workflow

1. Design the build in a chat with this repo linked: *"Read `docs/design/DESIGN_STUDIO.md`
   and let's design a …"*. It reads `docs/GLOSSARY.md`, the relevant `CLAUDE.md`
   section and an existing example, then outputs a completed brief (`Status:
   ready`).
2. Start a Claude Code session: *"Create `specs/<…>/<id>.md` with the following
   content, then implement it"* — and paste the brief.
3. Claude Code builds it, validates against the brief, flips the status to
   `implemented`, and pushes.

A brief stays in its folder after implementation — it documents the pedagogy and
is the starting point for future changes.

> The maths-tool route also has a deep, standalone pedagogy guide,
> `../TOOL_DESIGNER_PROMPT.md` (usable as claude.ai Project instructions).
> `docs/design/DESIGN_STUDIO.md` points to it for the maths branch.
