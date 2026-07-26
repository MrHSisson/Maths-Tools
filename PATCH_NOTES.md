# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. Read this at the
**start of a new conversation** to see where we're up to; append to it at the
**end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `DEV_ROADMAP.md` — Maths: what's unfinished and what's next. *The Maths plan.*
- `CS_ROADMAP.md` — Computer Science: what to build next. *The CS plan.*
- `CS_SHELL_PLAN.md` — the CS revision-tool shell (`CSShell`) migration.
- `GLOSSARY.md` — canonical names for every element. *The vocabulary.*
- **`PATCH_NOTES.md` (this file)** — what actually happened, session by session. *The history.*

The site hosts **two subjects** and they are tracked separately below: **Maths**
(the bulk of the app, built on `ToolShell`) and **Computer Science** (a younger
strand on its own `CSShell`, with its own roadmap). See `CLAUDE.md` → "Two
subjects — repository map". Keep the split even when a session only touches one.

> **Dates** are the commit dates of the session's work. Newest first within each
> strand. An entry is a *session's worth* of work, not a per-commit changelog —
> group by what was actually built and link the tool/page it touched.

---

## Where we're up to (snapshot — 2026-07-25)

**Maths — current focus:** the **PDF generators** (`Times Tables`, `Functional
Skills`) had a big UI/quality pass in July; the **techniques engine** and
**skill library** are the main in-development threads (both dev-gated), and the
**SmartGrapher** is now embeddable and driving the Level 3 graphs in
`Mixed Strategies` and `NonLinearSimEq`. Migration of the last old-shell tools
(see `CLAUDE.md` → "migrate an old tool") is the standing backlog.

**Computer Science — current focus:** the strand now has **two tools** —
`SystemArchitecture` (the original quiz) and the new `CpuArchitecture` (OCR J277
1.1.1) — and its own **`CSShell`** (`src/shared/cs/`) is being extracted so future
sub-topics are authored as *data*, not bespoke code. The shell extraction is
**in progress** (`CS_SHELL_PLAN.md`); the next tools and topics are in
`CS_ROADMAP.md`. The landing page now bands tools by subject.

**Best next steps** are tracked in `DEV_ROADMAP.md`; this file records what's
already done.

---

# Maths

## 2026-07-26 — Migrated Fractions of Amounts onto ToolShell
Took the largest remaining old-shell **question generator** (`FractionsOfAmounts`,
~1,850 lines) and brought it onto the shared **`ToolShell`** (~600 lines). All the
maths generation — Finding Amounts (L1 unit / L2 non-unit / L3 fractional answers),
the worded contexts (L1 direct/indirect, L2 unit-conversion, L3 two-step keep/give
with money or items, optional "answer as fraction of original"), and Expressing as
a Fraction (L1 simplify-by-HCF, L2 direct/indirect contexts, L3 one/two-step) — is
preserved verbatim; only the return shape and shell changed. Questions now use the
shared `WordedQuestion` kind, working steps use `mStep`/`tStep` with **live-modelling
fragments** (each `= …` link reveals separately), and all the bespoke UI, popovers,
and hand-rolled PDF `handlePrint` were deleted in favour of ToolShell's built-ins.
Per-level Question Options (denominator range, question type, conversion hint, steps,
etc.) are re-expressed as ToolShell `difficultySettings` dropdowns/variables, so
whiteboard/worked-example/worksheet/differentiated/share-links all come for free.
Money is kept KaTeX-safe with `\pounds`. Dropped the non-functional Level-3 "Answer
Format" control (it never affected generation). Added the `__test` export (smoke
suite now covers all 9 sub-tool×level cases, 40 unique questions each) and moved the
tool out of the migration backlog in `organisation.test.ts`, `CLAUDE.md` and
`DEV_ROADMAP.md`. Build clean, 249 tests pass.

## 2026-07-25 — Repo consolidation + organisation audit
Housekeeping session, no tool code. **Consolidated three parallel branches into
`main`**: merged the CS/CPU work (PR #38) and this changelog (PR #39), and cleared
a stale already-merged branch — `main` is now the single source of truth again.
Ran an **organisation audit** and actioned four pickup-friction fixes: added a
**documentation map** to `CLAUDE.md` and `README.md` (one table saying which doc to
read when); **removed a contradiction** where a CS tool sat in the Maths migration
backlog (CS tools target `CSShell`, never `ToolShell`); made `npm run new-tool`
**refuse `--category ComputerScience`** (it only scaffolds the Maths `ToolShell`, so
CS tools were being pointed at the wrong shell); and **refreshed the README** to name
the two-subject architecture and link the doc set. Then added the **CI drift-check**
(`src/tests/organisation.test.ts`) — it reads every tool's source and fails the build
if a tool is un-categorised, if a migrated tool is left in the backlog, if a ToolShell
tool lacks `__test`, or if a tool file isn't registered; it's now the authoritative
shell-status list, with `CLAUDE.md` pointing to it. Considered and **dropped** the
`CLAUDE.md`/`SHARED_API.md` split — it trades away the single-file "no source needed"
guarantee for a shorter read, not worth it yet.

## 2026-07-21 → 07-23 — PDF generators: Functional Skills + Times Tables
**Functional Skills generator** got a full redesign: a two-pane browse/build
layout with tap-to-add skill tiles, a single worksheet editor, per-skill count
arrows, an anchored options pop-over, and instructions moved into a burger menu
with settings in a pop-out. Added **fraction arithmetic** (add, subtract,
multiply, divide) to the skill set. Tiles now stay two-wide at all widths.
**Times Tables generator** was realigned to the same house style: question
options moved into a popover, a centred flowing setup layout, and new fact
controls — exclude ×2/÷2, ×5/÷5, ×10/÷10 (grouped under one header),
suppress-commutative (n/n=1), and a "suppress n=1" option. Fixed the question
distribution over-representing squares and ×1 facts, and de-duplicated
missing-factor / division questions with a refreshable full preview.

## 2026-07-18 → 07-19 — SmartGrapher, techniques engine, and the reference docs
Big infrastructure session. Added **SmartGrapher**, an embeddable canvas graphing
component: multiple curves on one graph with auto-intersections, extended curve
families (trig, exp, log, reciprocal, modulus), linear-programming feasible
regions, a regions/guides shading layer, and Cluster A recipes (sketch, solve,
transform, tangent). It now renders the **Mixed Strategies** Level 3 graph and is
integrated into **NonLinearSimEq** (migrated to v2.3 in the same session).
Added the **techniques engine** (`src/shared/techniques/`) for reusable
pedagogical working steps — grain-aware (brief / standard / full) — with a
dev-only **Technique Library** viewer at `/techniques` and a **Grapher Lab** test
bench at `/grapher`. Created the reference docs **`DEV_ROADMAP.md`** and
**`GLOSSARY.md`**, plus a technique audit and a skills-to-develop backlog.

## 2026-07-16 — Mixed Strategies (game theory)
New **Mixed Strategies** tool (zero-sum game theory): find optimal mixed
strategies and the value of a game from its payoff matrix. Labelled payoff table,
KaTeX labels, the answer replaces the matrix on the whiteboard, and it's
dev-gated (`enabled: false`) for now.

## 2026-07-13 — Binomial hypothesis testing + Recipes migration
Added **critical regions** to the binomial hypothesis-test / p-value tool, made
p-value and critical region a mode toggle (one at a time), and reworked the
controls into a full-width panel with sliders and even option groups (max trials
raised to 200). Migrated **RecipesTool** to the v2.3 ToolShell.

## 2026-07-09 — Best Buys migration + slide/scaling polish
Migrated **Best Buys** to the shared ToolShell. Polished the teaching-slide
system: the skill overlay goes near-fullscreen, slides auto-scale to fit the card
(no scrollbars at any size), and `ScaleToFit` now shrinks below 1× when content
would clip (fixing fullscreen split view). Codified the "size for readability,
never to fill" slide principle in `CLAUDE.md`.

## 2026-07-05 → 07-08 — Skill library, Teach decks, worked-example fragments
The pedagogy engine landed. Added the **skill library** (`src/shared/skills/`,
browsable at `/skills`), **`[[skill-id|term]]` skill-link drill-downs**, and
**worked-example fragment reveal** (one board-mark per press) — all dev-gated.
Added the **Teach** slide-deck mode (`teachingSlides`) with a category menu,
phase badges (I-do/We-do/You-do), and animated scenes; reworked the **LCM** skill
as a beat-by-beat walkthrough and added **LCM from prime factors** with the core
**prime-factor tile** representation and Venn strike-off. Fixed fixed-height slide
cards so they don't jump. Migrated the **fraction** tools (add/subtract,
multiply/divide) to v2.3 and added the **Bearings** tool.

## 2026-06-28 — Developing-tools mode + worksheet builder + migrations
Added the global **Developing-tools mode** (homepage toggle, `src/devMode.ts`)
that gates all in-progress work. Worksheet builder gained a classic two-pane
layout for general use with sections kept dev-only, a builder column picker, and
tidier action rows. Migrated **Iteration** and **Simultaneous Equations
(Elimination)** to v2.3, fixed jittery zoom on the collapsible panel, and added
several **Algebra Tiles** manipulation improvements (Extract, overlap-safe
duplication).

## 2026-06-13 → 06-18 — Foundations: shell, worksheet builder, first tools
The v2.3 groundwork. Added the collapsible **working/visualiser panel** and
`hideFontControls`, the **WorksheetBuilder** for mixing sub-tools, and the
`Unpublished/` exclusion from build/test/deploy. Built **Angles in
Quadrilaterals** (three levels, SVG diagrams, exterior-angle overlays),
**Collecting Like Terms**, and refined **Multiple Variables**. Fixed a run of
SVG scaling / worksheet-cell clipping issues and made the font-size chevrons work
in custom renderers.

---

# Computer Science

> The CS strand is deliberately tracked apart from Maths: it's a different
> subject with its own pedagogy (knowledge/recall, not question generation), its
> own tools, and its own shell (`CSShell`, not `ToolShell`). It's younger than the
> Maths side — expect it to grow fast.

## 2026-07-24 — CPU Architecture tool + CS shell foundations
The session that turned CS from a single quiz into a real strand. Built the
**`CpuArchitecture`** tool (`/cpu-architecture`, enabled) — spec-tagged,
exam-realistic, mobile-first OCR J277 1.1.1 revision with Learn mode,
self-marking, mark-scheme reveal and misconception handling. Began extracting a
reusable **`CSShell`** (`src/shared/cs/` — `types.ts`, `ui.tsx`, `tooltip.tsx`,
`context.tsx`) so future sub-topics (1.1.2 → 1.6) are authored as *data*, not
bespoke code — deliberately **separate** from the maths `ToolShell` (CS tools are
knowledge/recall, not generators). Reworked the **landing page** to band tools by
subject (Mathematics / Computer Science), and added the CS reference docs
**`CS_ROADMAP.md`** and **`CS_SHELL_PLAN.md`**. *(Merged to `main` as PR #38.)*

## Origins — `SystemArchitecture`
**`SystemArchitecture`** was the original and, until the CPU tool, only CS tool:
a standalone **quiz tool** ("1.1 — System Architectures"), never on the maths
shell by design. It's the reference for what the new `CSShell` is generalising.

## Next for CS
Tracked in **`CS_ROADMAP.md`** (what to build) and **`CS_SHELL_PLAN.md`** (the
shell migration). In short: finish extracting `CSShell` from the CPU tool, then
author the remaining 1.1.x sub-topics as content files against it.

---

## Keeping this current

At the **end of a session**, before you push:

1. Add an entry under the strand you touched (**Maths** or **Computer Science**),
   newest first, dated with the session's commit date.
2. Write it as *what shipped*, in plain English — one short paragraph, linking the
   tool/page/file it changed. Group the session's commits; don't transcribe them.
3. Update the **"Where we're up to"** snapshot if the current focus moved.
4. If the work opened or closed a roadmap item, reflect that in `DEV_ROADMAP.md`
   too — this file is the history, that file is the plan.
