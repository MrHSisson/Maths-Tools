# The cast — Depth characters

The people and the owl who appear on Depth slides. Plain-English version lives in Harry's notes (*Maths Tools — Characters*); this file is the technical rule set. Art: `src/shared/components/DepthArt.tsx` (original SVG, no libraries).

## The eight

Names are fixed and in `CAST_NAMES` order (index = `CAST` index):

| # | Name | Look (summary) |
|---|---|---|
| 0 | Ruby | wavy auburn hair, freckles, teal crew top |
| 1 | Kofi | short fade, deep brown skin, gold hoodie |
| 2 | Mei | black bob, glasses, purple cardigan |
| 3 | Ben | brown side parting, green polo |
| 4 | Amara | dark coils, pink striped top |
| 5 | Leo | blond side parting, blue hoodie |
| 6 | Priya | long dark hair, orange polo |
| 7 | Jamal | dark curls, glasses, grey cardigan |

**Feathers** is the owl (`MASCOT_NAME`, `Mascot`). He is the one non-human voice.

## Rules

- **Speakers on Depth items must be named from `CAST_NAMES`.** `assignCast(names)` gives each name its own face (a cast name always gets its own member; any other name is hashed to a free member), so one name = one face within a slide set.
- **Style:** natural, detailed, nothing that draws attention (no spiky hair, no odd features). Representation should be present but not the point. No tongues, no bald crescents, no braids (removed after review).
- **Pronouns:** never assumed in item text or notes; write speech in first person ("Ruby says…") and avoid gendered references.
- **Feathers speaks only in Depth** (decided 2026-10-07): a bubble on every slide — a nudge on the question, a takeaway on the answer. Lines come from `feathersLine(item, onAnswer)`; an item can set `prompt` / `takeaway`. Keep lines short, class-facing, never the answer. A Feathers button under the slide mutes him per device (`mt-depth-feathers`).
- Class-secure / not-secure buttons stay in the teacher's voice, not Feathers'.

## Adding or changing a member

1. Add to `CAST` and `CAST_NAMES` (same index), keep `CAST_SIZE` consistent.
2. Update the table above and the Characters note.
3. Render all faces in one React tree to check them (separate renders collide on gradient ids).
4. `npm test` — `depth.test.ts` checks speakers/bubbles.
