# Consolidation plan — half term, October 2026

**Principle (decided 2026-10-23): round up and improve what exists before adding anything new.** The site is powerful but a teacher
has to understand its machinery to use it. This plan tightens the five things that are already built — Question Options, tool
transparency, lessons, the build path and the dashboard — and parks new mechanisms until those are solid.
Status: **proposal, nothing built.** Decisions needed are in §8.

## 1. Question Options — fix the heavy tools, don't add a layer

Counted over every ToolShell sub-tool × level (342 cells; Decision tools not included):

- **Median is 4 options, so most of the site is fine.** The pain is concentrated in about a dozen tools.
- Heaviest cells: Rounding (Significant figures L1/L2: **20 options in 8 groups**), Ordering Numbers (up to 18), Binomial Expansion (15),
  File Sizes (15), Speed/Distance/Time mixed (14), Order of Operations (13), Decimals +/− (12), Partial Fractions (11),
  Angles in Quadrilaterals (11).
- Cause: every distinction a question can vary on became an option. That is real control, but it hands the teacher the *design* of the
  difficulty instead of a sensible starting point.

What to do with what we have:

1. **Option audit of the heavy dozen**, one tool at a time (this folds into the existing Tool review cycle): merge options that never
   differ in practice, turn mutually exclusive sets into one `exclusive` pool or a dropdown, drop options nobody would tick, and move
   whole families that belong to a different level or a different tab.
2. **Good defaults.** A teacher should be able to open a tool, pick a level and teach without touching Question Options. Review each
   level's default-ticked set for that test.
3. **"More options" fold in the popover (shared, once).** Show the first few groups; the rest sit behind a "More options" row, so a
   heavy tool opens small. No new concept for teachers, just less on screen.
4. **A cap with a test.** At most ~8 options visible per level on first open (the rest behind "More options"). Enforced like the Depth
   coverage rule, so a tool cannot quietly grow back.

## 2. Transparency — see what a tool, its levels and options do

Generate it from `TOOL_CONFIG` so it is never stale:

- **Setup summary** under the toolbar: one plain sentence from the active options — "Level 2 · decimals to 2 d.p. · negatives on".
  Uses option labels; add an optional `summary` phrase only where a label is not a phrase.
- **Tool map** (burger menu → "What can this tool do?"): per sub-tool, per level, what is on and off. Also the home for the plain
  description of each level (Decision tools already have `config.levelLabels`; give ToolShell the same).
- **Dashboard:** max options per level as a fact and a Matrix column, so the heavy tools show up and the cap is visible.

## 3. Lessons — easier to build, with slide templates and rules

Today (Indices is the pilot): a lesson is a step list in TypeScript and each Teach slide is a hand-assembled array of blocks
(`IndicesTeach.ts` is 518 lines). The arc is already agreed and written as a comment — *hook → check before → explain → I do → we do →
check after → you do → hand-off* — but nothing enforces it, so each deck re-invents its layout and the practice steps repeat the same
Whiteboard / Worksheet pair by hand.

**Slide templates** (one small constructor per slide type, so an author fills in slots instead of laying out blocks):

| Template | Slots | Built-in behaviour |
|---|---|---|
| Hook | prompt, reveal | only if the hook is true; reveal on one press |
| Explain | one idea, one picture | picture + one line + one caption, nothing more |
| Model (I do) | scene, captions | one beat per press, same example throughout |
| Try together (We do) | scene, captions | same shape as Model with a predict beat |
| Check | Depth item id | plays the real Depth item; refuses to be first in a deck |
| Misconception | wrong working, why | the "spot the error" pattern in one place |
| You do / Hand-off | presets | buttons open Whiteboard / Worksheet / Depth already set |

**Rules and preferences in one place** (`lessonStyle`), checked by a test so a deck cannot drift:
- Caption length, one idea per slide, no check as the first slide, hand-off required, picture or text but not both competing.
- Style preferences (sizes, palette, wording such as "Practice" / "Set it" / "Extend") stored once instead of repeated in each deck.
- The existing rules from `docs/design/LESSONS.md` become the checks.

**Lesson recipe**: a helper that expands one line — "teach deck, practise (whiteboard + worksheet) at level 2 with these options,
extend with this Depth item" — into the full step list, so `IndicesLessons.ts` shrinks and every lesson has the same shape.

Start by **migrating Indices and Rounding onto the templates** and checking nothing changes on screen, then author the next lesson
with the templates from scratch. A friendlier lesson builder, a slide-strip view and PowerPoint export are parked (§6) until this
foundation is in.

## 4. The path for building a tool

The pieces exist but are scattered across the spec templates, `TOOL_DESIGNER_PROMPT`, `CLAUDE.md`, the review cycle, the dashboard notes
and Harry's planner. One path with gates, shown on the dashboard:

| Stage | Done when | Where it shows |
|---|---|---|
| 0 Idea | a dashboard note exists | Plan status = Idea |
| 1 Brief | `specs/<id>.md` is `Status: ready` (acceptance examples included) | Spec ✓ |
| 2 Scaffold | tool registered `enabled: false`, builds, smoke tests pass | In development |
| 3 Core | generator + working + info, matches the brief's correctness reference | tests ✓ |
| 4 Teaching layer | Depth bank, lesson on the templates, developing picture (those that fit) | Matrix dots |
| 5 Review | review block filled, option audit done (≤ cap), phone / tablet / laptop checked | Reviewed ✓ |
| 6 Live | owner sign-off; `enabled` removed | Live |

- **Definition of live** becomes a checklist the dashboard can compute (spec, tests, within the option cap, reviewed) instead of prose.
- Plan status values map onto these stages so the dashboard and the build path say the same thing.
- The scaffold command also drops the brief stub, so stage 1 is never skipped.

## 5. Dashboard follow-ons

Max options per level · Lesson ✓ column · stage derived from the facts · quick-edit of Plan status and Review in the row.

## 6. Parked ideas (recorded so they are not lost; not to be built yet)

- **Complexity stepper** — a `Complexity ◀ 3 of 7 ▶` control that sets a tool's options from an authored ladder of rungs, so a teacher can
  use a tool without understanding each option. A rung is the same thing as a lesson-step setup (`level`, `ms`, `vars`, `dd`), and
  calibrated tools (Order of Operations) could derive theirs from the measured difficulty bands. Revisit once §1–§3 land: with fewer, better
  options and good defaults it may not be needed.
- **Slide-strip lesson builder** — a lesson shown as a PowerPoint-style strip of slides (Teach, Depth, live tool slide, Worksheet) to
  reorder, duplicate and present. Needs the templates (§3) first.
- **Saved lessons** — lessons stored like the dashboard notes so they can be edited in the browser without code.
- **.pptx export** — render each slide to an image with real title and notes; needs a spike to see how KaTeX and scenes come out.

## 7. Suggested order (9 days, adjust freely)

| Days | Work |
|---|---|
| 1–2 | Option audit and defaults for the worst four: Rounding, Ordering Numbers, Binomial Expansion, File Sizes |
| 3 | "More options" fold in the shared popover + the option-cap test; dashboard max-options column |
| 4 | Setup summary line; generated Tool map page |
| 5–6 | Slide templates + `lessonStyle` rules test; migrate Indices Teach decks onto them, screens unchanged |
| 7 | Lesson recipe helper; migrate Indices and Rounding lessons; author one new lesson from scratch to test it |
| 8 | Option audit for the next group: Speed/Distance/Time, Order of Operations, Decimals, Partial Fractions, Angles in Quadrilaterals |
| 9 | Build-path doc, stage and gate columns on the dashboard; update the planner notes |

## 8. Decisions needed

1. **Which tools first** for the option audit — the worst four as listed, or others you teach from most?
2. **Template set** — is the list in §3 right (Hook, Explain, Model, Try together, Check, Misconception, You do / Hand-off)? Anything you
   always want that is missing, or anything you would never use?
3. **Option cap** — hard limit enforced by a test (recommended), or a soft guideline shown on the dashboard?
4. **Slide style** — any strong preferences now (fonts, colours, how wordy a slide can be) to bake into `lessonStyle`?
