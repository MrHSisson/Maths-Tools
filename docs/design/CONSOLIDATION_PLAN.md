# Consolidation plan — half term, October 2026

**Principle (decided 2026-10-23): round up and improve what exists before adding anything new.** The site is powerful but a teacher
has to understand its machinery to use it. This plan tightens the things already built — Question Options, tool transparency, lessons
and slide style, the build path and the dashboard — and parks new mechanisms until those are solid.
Status: **goals agreed in outline, nothing built.** Open decisions are in §8.

## 0. What done looks like after 9 days

| Thread | Done when |
|---|---|
| **Question Options** | Every option sits in a named section. The popover shows the question itself first and tucks "how it is shown and worked" behind one row. The four worst tools are audited and under the cap. A test enforces sections and the cap. |
| **Slide style** | A house style is agreed *together* (§3) and written down once as `lessonStyle`. Slide templates exist. Indices decks run on them. One new lesson is built from the templates in a day. |
| **Transparency** | Every tool shows a one-line setup summary and has a generated "what can this tool do?" page. |
| **Build path** | One staged path (idea → live) written down; the dashboard derives each tool's stage from the facts. |

**Not doing:** the complexity stepper, a slide-strip lesson builder, saved lessons, `.pptx` export (all parked, §6).

## 1. Question Options — a second layer, by what an option *does*

Counted over every ToolShell sub-tool × level (342 cells; Decision tools not included): the **median is 4 options**, so most tools are
fine. About a dozen are heavy — Rounding (Significant figures L1/L2: **20 options in 8 groups**), Ordering Numbers (18), Binomial
Expansion (15), File Sizes (15), Speed/Distance/Time (14), Order of Operations (13), Decimals +/− (12), Partial Fractions (11),
Angles in Quadrilaterals (11).

**The groups already fall into families.** Reading every option group's label across the site, they cluster naturally:

| Layer | Section | What it controls | Typical labels today |
|---|---|---|---|
| **1 · The question** | **What's asked** | which task the question is | Question types · Ask for · Find · Operations · Direction of ask |
| | **The numbers** | what values appear | Number type · Size of n · Sign · Decimal places · Constants · Difficulty |
| **2 · How it is shown and worked** | **Notation and wording** | how the question is written | Notation · Written as · Wording · Time notation · Units shown |
| | **Method** | how it is solved | Method · Working method · Numerical method |
| | **The answer** | what form the answer takes | Answer format · Answer in · Rounded |
| | **Support** | scaffolds for the class | Scaffolds · Words in column headings · Table starts · Grids |

Why two layers: **layer 1 changes which questions come up; layer 2 changes how the same question is presented or solved.** That is the
distinction a teacher actually thinks in, and it is why a heavy tool feels like a wall — everything is shown at one level. Many layer 2
options are already instant display changes (`reformatQuestion`), so they are safe to flip mid-lesson.

What it looks like:
- The popover opens on **layer 1**, grouped under its two section headings. Layer 2 sits behind one row, **"How it is shown and worked"**,
  with a count of what has been changed from the default ("2 changed"), so nothing is hidden silently.
- Inside layer 2 the four sections are headings, not tabs: one scroll, no hunting.
- **The cap applies to layer 1:** at most about 8 options visible on first open. Layer 2 is unlimited but folded.
- A tool with few options (most of them) shows no layers at all — the popover looks as it does today.

How to build it, without disturbing what exists:
1. Add an optional `section` to pools, toggles and dropdowns (one of the six). **Auto-suggest it from the label** with a keyword table,
   then confirm tool by tool during the audit. A test fails if an option has none.
2. The shared popover (standard, inline and differentiated, plus Depth, which shares it) renders layers and sections. One change, every tool.
3. **Option audit of the heavy dozen**, one at a time, folded into the Tool review cycle: merge options that never differ in practice,
   turn mutually exclusive sets into one `exclusive` pool or dropdown, drop what nobody would tick, and move families that belong to a
   different level or tab.
4. **Good defaults.** A teacher should be able to open a tool, pick a level and teach without touching Question Options. Review each
   level's default-ticked set for that test.
5. **Cap test:** layer 1 ≤ ~8 per level, like the Depth coverage rule, so a tool cannot quietly grow back.

## 2. Transparency — see what a tool, its levels and options do

Generate it from `TOOL_CONFIG` so it is never stale:

- **Setup summary** under the toolbar: one plain sentence from the active options — "Level 2 · decimals to 2 d.p. · negatives on".
  Uses option labels; add an optional `summary` phrase only where a label is not a phrase. Sections give it an order: question first.
- **Tool map** (burger menu → "What can this tool do?"): per sub-tool, per level, what is on and off, laid out by the same sections.
  Also the home for the plain description of each level (Decision tools already have `config.levelLabels`; give ToolShell the same).
- **Dashboard:** layer 1 options per level as a fact and a Matrix column, so the heavy tools show up and the cap is visible.

## 3. Lessons and slide style — worked out together

Today (Indices is the pilot): a lesson is a step list in TypeScript and each Teach slide is a hand-assembled array of blocks
(`IndicesTeach.ts` is 518 lines). The arc is already agreed and written as a comment — *hook → check before → explain → I do → we do →
check after → you do → hand-off* — but nothing enforces it, so each deck re-invents its layout and the practice steps repeat the same
Whiteboard / Worksheet pair by hand.

**Slide style is decided with Harry, not by Claude alone.** Day 1 is a style session:
1. Claude builds a **style board** on a dev page: one real slide (the Indices "multiplying powers" model) shown in two or three variants
   side by side at 1280×720 — how wordy, how big, where the picture sits, what the caption looks like, colour and emphasis.
2. Harry picks, mixes and rejects. The same exercise on a second slide type (a check, a misconception) so the choices hold across types.
3. What is chosen is written down once as `lessonStyle` (sizes, caption length, palette, standard wording such as "Practice" / "Set it" /
   "Extend") and every template reads it. Until then no template work starts.

**Slide templates** (one small constructor per slide type, so an author fills in slots instead of laying out blocks). Starting list,
to be revised in the style session:

| Template | Slots | Built-in behaviour |
|---|---|---|
| Hook | prompt, reveal | only if the hook is true; reveal on one press |
| Explain | one idea, one picture | picture + one line + one caption, nothing more |
| Model (I do) | scene, captions | one beat per press, same example throughout |
| Try together (We do) | scene, captions | same shape as Model with a predict beat |
| Check | Depth item id | plays the real Depth item; refuses to be first in a deck |
| Misconception | wrong working, why | the "spot the error" pattern in one place |
| You do / Hand-off | presets | buttons open Whiteboard / Worksheet / Depth already set |

**Rules checked by a test** so a deck cannot drift: caption length, one idea per slide, no check as the first slide, hand-off required,
picture and text not competing. The existing rules in `docs/design/LESSONS.md` become the checks.

**Lesson recipe**: a helper that expands one line — "teach deck, practise (whiteboard + worksheet) at level 2 with these options,
extend with this Depth item" — into the full step list, so `IndicesLessons.ts` shrinks and every lesson has the same shape.

Then **migrate Indices and Rounding onto the templates** (screens unchanged unless the style session changed them on purpose) and build
the next lesson from scratch with them as the test.

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
| 5 Review | review block filled, options sectioned and within the cap, phone / tablet / laptop checked | Reviewed ✓ |
| 6 Live | owner sign-off; `enabled` removed | Live |

- **Definition of live** becomes a checklist the dashboard can compute (spec, tests, within the cap, reviewed) instead of prose.
- Plan status values map onto these stages so the dashboard and the build path say the same thing.
- The scaffold command also drops the brief stub, so stage 1 is never skipped.

## 5. Dashboard follow-ons

Layer 1 options per level · Lesson ✓ column · stage derived from the facts · quick-edit of Plan status and Review in the row.

## 6. Parked ideas (recorded so they are not lost; not to be built yet)

- **Complexity stepper** — a `Complexity ◀ 3 of 7 ▶` control that sets a tool's options from an authored ladder of rungs. A rung is the
  same thing as a lesson-step setup (`level`, `ms`, `vars`, `dd`), and calibrated tools could derive theirs from measured difficulty
  bands. Revisit once §1–§3 land: with sectioned options and good defaults it may not be needed.
- **Slide-strip lesson builder** — a lesson shown as a PowerPoint-style strip of slides to reorder, duplicate and present. Needs the
  templates first.
- **Saved lessons** — lessons stored like the dashboard notes so they can be edited in the browser without code.
- **.pptx export** — render each slide to an image with real title and notes; needs a spike to see how KaTeX and scenes come out.

## 7. The 9 days

| Day | Work | Needs Harry |
|---|---|---|
| 1 | **Style session** (slide style board, §3). Then: add `section` to the option types and the keyword auto-suggest; list every option with its suggested section | The style choices; a glance at the suggested sections |
| 2 | Layered popover in the shared component (layer 1 open, layer 2 folded with "n changed"); sections test | Look at it on a heavy tool |
| 3 | Option audit and defaults, round 1: Rounding, Ordering Numbers, Binomial Expansion, File Sizes | Review each tool's proposed option list |
| 4 | Cap test; layer 1 count on the dashboard; setup summary line | — |
| 5 | Generated Tool map page; slide templates built from the agreed style | Look at the first templates |
| 6 | Migrate Indices decks onto the templates; `lessonStyle` rules test | Compare before and after |
| 7 | Lesson recipe helper; migrate Indices and Rounding lessons; build one new lesson from scratch | Pick the new lesson topic |
| 8 | Option audit round 2: Speed/Distance/Time, Order of Operations, Decimals, Partial Fractions, Angles in Quadrilaterals | Review option lists |
| 9 | Build-path doc; stage and gate columns on the dashboard; update Harry's planner notes; tidy | Sign off |

Slack: day 8 is the one to drop or stretch. Day 1's style session gates days 5–7, so it is the one day not to skip.

## 8. Decisions needed

1. **Sections** — are the six right (What's asked, The numbers, Notation and wording, Method, The answer, Support) and is the split into
   "the question" and "how it is shown and worked" the one you think in? Anything that belongs somewhere else?
2. **Which tools first** for the audit — the worst four as listed, or those you teach from most?
3. **Option cap** — a hard limit enforced by a test (recommended) or a flag on the dashboard?
4. **Style session** — when on day 1, and which slide should we start from? (Proposed: Indices "multiplying powers", then a check and a
   misconception slide.)
