# Specs — design briefs for Claude Code

Completed design briefs, produced by thinking a build through with **Claude in a
normal chat** (repo linked; see `../docs/design/DESIGN_STUDIO.md`) and implemented by **Claude
Code**. Five kinds of build, each with its own template and home:

| Build | Template | Briefs live in |
|---|---|---|
| **Maths tool** (question generator) | `../docs/design/templates/TOOL_SPEC_TEMPLATE.md` | `./<tool-id>.md` (this folder) |
| **CS tool** (J277 revision topic) | `../docs/design/templates/CS_TOPIC_SPEC_TEMPLATE.md` | `./cs/<topic-id>.md` |
| **Technique** (reusable working-step block) | `../docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md` | `./techniques/<technique-id>.md` |
| **Teach deck** (a tool's Teach-mode slides) | `../docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md` | `./decks/<tool-id>.md` |
| **Depth bank** (a tool's curated questions) | `../docs/design/templates/DEPTH_SPEC_TEMPLATE.md` | `./depth/<tool-id>.md` |

Maths-tool briefs sit at the root of this folder (as `<tool-id>.md`), together with a few cross-cutting briefs for the Decision tools (`flow-*.md`, `cpa-*.md`); the other
kinds sit in the typed subfolders above. Two further folders are not builds: `exam/` (specification content and past-paper topic reports, from `../docs/design/templates/EXAM_TOPIC_REPORT_TEMPLATE.md`) and `corpus/` (paper questions tagged as part chains).

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
> `../docs/design/TOOL_DESIGNER_PROMPT.md` (usable as claude.ai Project instructions).
> `docs/design/DESIGN_STUDIO.md` points to it for the maths branch.
