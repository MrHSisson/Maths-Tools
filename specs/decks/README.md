# Teach deck specs

Completed Teach-deck briefs, one per file, named `<tool-id>.md` (the tool the
deck attaches to — e.g. `fractions-add-sub.md`). Briefs follow
`../../docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md` and are produced by designing in a chat with
the repo linked (see `../../docs/design/DESIGN_STUDIO.md`).

## Lifecycle

| Status | Meaning |
|---|---|
| `draft` | Still being designed — do not implement |
| `ready` | Complete — Claude Code implements it without further questions |
| `implemented` | Built and merged — kept as the deck's design record |

## Workflow

1. Design the deck in a chat: *"Read `docs/design/DESIGN_STUDIO.md` and let's design a Teach
   deck for <tool>."* It outputs a completed brief with `Status: ready`.
2. Start a Claude Code session: *"Create `specs/decks/<tool-id>.md` with the
   following content, then implement it"* — and paste the brief.
3. Claude Code authors the `teachingSlides` array in the tool file (adding any new
   scene type the brief flags), validates it, flips the status to `implemented`,
   and pushes.

## Whole-lesson slide question briefs

This applies when Claude plans a lesson independently as well as when Harry supplies the requirements. First write the ordered teaching thread from the objective, prerequisites and intended progression. Harry’s constraints take precedence; he does not need to write every slide brief.

For each skill-practice slide record:

| Field | Content |
|---|---|
| Skill | The named skill / slide title |
| Teaching purpose | What understanding this develops or checks |
| Question focus | Required operations, representations and number ranges |
| Avoid | Exclusions, if any |
| Number of questions | Five by default; short diagnostics and exit tickets can be shorter |
| Variation / progression | What changes and why this order |
| Reference examples | Optional examples from Harry or the lesson design |
| Solution reference | Matching generator, sub-tool and level |

Author questions, answers and worked steps directly on the slide, without shared-bank registration. Inspect the referenced generator and match its method, step labels, notation, ordering and reveal boundaries. Verify the arithmetic and every brief constraint. For optional misconception notes, check the actual wrong method gives a different answer. Retain fixed sets and briefs together through edits and exports. Teachers can add questions directly through Add my own question, without completing teaching metadata. Depth cards remain separately selectable; live generators do not populate authored sets.

Choose each question slide’s presentation independently of its content: Full-width, Workspace right or Workspace left. The same choices apply to fixed sets and live generators. Depth cards are standalone full-slide question and answer faces; they have no split stepper or workspace layout. Save the layout in the editor; retain the set and generator-consistent working when changing it.
