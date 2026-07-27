# Computer Science Shell — architecture plan

Status: **in progress** (increments 1–8 landed — the CS shell is fully assembled AND
the payoff is proven: 1.1.2 CPU Performance is authored as pure data on the `CSTopic`
contract, guarded by the `validateTopic` CI check. Next: increment 9 rolls the same
data-only pattern through 1.1.3 → 1.6, and moves synoptic to a shared cross-topic bank
now that there is >1 topic).
This doc is the reference for turning
the one-off `CpuArchitecture` tool into a reusable **CS shell**, so future
knowledge-heavy CS sub-topics (1.1.2 → 1.6) are authored as *data*, not bespoke code.

Read this before building the next CS tool.

---

## ▶ Resume here — next session (keep current)

This is the copy-paste kickoff for the next conversation, inside a fenced code block
(triple backtick, language `text`). **Whoever lands an increment rewrites this block** so
it always points at the true next step (see the end-of-session rule in `PATCH_NOTES.md`).
If the shell is finished, replace this with "Shell complete — see stage 8 (author
topics as data)".

```text
Continue the CS revision build-out (Maths-Tools repo) — author the next J277 sub-topic
as pure data (increment 9).

Setup: work on THIS session's assigned branch — it's already cut fresh from main at
session start. Do NOT check out or create any other branch. First confirm the baseline
is current (git fetch origin main; the branch should be level with origin/main). Then
run: npm install (node_modules isn't present in a fresh container).

Where we're up to: increments 1–8 of CS_SHELL_PLAN.md are DONE. The CS shell is fully
assembled (src/shared/cs/ owns everything — the six modes, LearnMode, the BoxSchematic +
TraceTable representations, and CSShell.tsx driven by one `topic` prop) AND the payoff is
proven: TWO topics are now pure data — CpuArchitecture.tsx (1.1.1) and CpuPerformance.tsx
(1.1.2), each a single CSTopic object + a two-line default export + `export const __topic`.
A CI validator (src/shared/cs/validate.ts → validateTopic, run by src/tests/cs-topics.test.ts
over every `__topic`-exporting CS tool) makes authoring-as-data safe. Green: build clean,
268 tests pass. Read CS_SHELL_PLAN.md first (this block + the ticked increment list + the
"author a topic" model near the top). Skim CpuPerformance.tsx as the current shape/quality
bar for a data-only topic. Do NOT re-read the shell internals — they're done.

Next increment (9): author the NEXT sub-topic (1.1.3 Embedded systems, then onward toward
1.6) exactly like 1.1.2 — one src/tools/ComputerScience/<Topic>.tsx = a CSTopic object +
`export const __topic` + `export default () => <CSShell topic={X} />`, registered in
src/registry.ts (subject "Computer Science", enabled:false until reviewed) and added to
CS_TOOLS in src/tests/organisation.test.ts. Fill every content array from the OCR J277
spec (get a `Status: ready` brief in specs/cs/ first, per CLAUDE.md). Reuse BoxSchematic /
TraceTable; only add a new scene renderer if nothing fits (scene contract in this doc).
The validator auto-covers the new topic once it exports `__topic`.

ALSO consider this increment (open decision, now unblocked with >1 topic): move synoptic
questions out of individual topic files into a SHARED cross-topic bank keyed by tag-pairs,
so a 1.1.1↔1.1.2 question lives once, not duplicated in both topics. Weigh it before
authoring a third topic's synoptic set.

Verify before pushing: npm run build (zero TS errors) and npm test (all pass — count grows
with the new topic). Manually re-check each new exam question against its mark scheme and
each cloze against its slots. Then tick increment 9 in CS_SHELL_PLAN.md, add a
PATCH_NOTES.md entry (CS strand), refresh this "▶ Resume here" block, and commit + push.
```

---

## Why a separate shell (not the maths ToolShell)

`src/shared/ToolShell.tsx` is built around **question generation** — Whiteboard /
Worked Example / Worksheet, `generateQuestion`, KaTeX, PDF print. CS revision tools
are a different product: **knowledge/recall** — Learn / Study / Cards / Quiz / Fill /
Exam. They never generate questions or print worksheets.

So we do **not** reuse ToolShell. We build a parallel **`CSShell`** that borrows
ToolShell's *philosophy* — data-driven authoring, a shared component library, and a
small curated set of **core visual representations** — but shares none of its code.
This matches `CLAUDE.md`, which lists the CS tools as standalone by design.

---

## Target authoring model

A new sub-topic should be **one content file** plus a two-line tool file:

```ts
// src/tools/ComputerScience/topics/CpuPerformance.ts
export const CPU_PERFORMANCE: CSTopic = {
  id: "1.1.2", title: "CPU Performance",
  specTags: { "1.1.2-R1": "Clock speed…", "1.1.2-R2": "Cores…", "1.1.2-R3": "Cache…" },
  glossary: { … },
  lessons: [ … ],   // stepped beats: predict / flow / analogy / scene
  cards:   [ … ],   // { specTag, q, a, distractors, explain }
  cloze:   [ … ],
  exam:    [ … ],   // { format, marks, markScheme, modelAnswer }
  synoptic:[ … ],
  myths:   [ … ],
  info:    [ … ],
};
```
```tsx
// CpuPerformance.tsx — the whole tool
export default () => <CSShell topic={CPU_PERFORMANCE} />;
```

Everything the student sees — nav, touch-first glossary, self-marking, model answers,
command-word chips, predict beats, the crash-safe steppers — comes from the shell.

---

## Module layout (target)

```
src/shared/cs/
  index.ts             barrel export
  ui.tsx               NAVY, CARD_SHADOW, TAB_SHADOW, useIsMobile, boldText, shuffleArr,
                       parseCloze, BeyondBadge, SegRow                       ✅ done
  tooltip.tsx          CSTooltip, registerTooltip, showTooltip, TooltipOverlay,
                       parseGlossaryText(glossary, …)                        ✅ done
  types.ts             SpecTag, ExamFormat, MARK_FORMATS, COMMAND_GUIDE,
                       FlashCard, ClozeExercise, ExamQuestion, SynopticQuestion,
                       MythItem, Flow, LessonStep, Lesson, InfoSection         ✅ done
                       SchematicConfig/Node/Container/Text/Bus, TraceConfig/Row ✅ done
                       CSTopic + TopicScenes contract                          ✅ done
  glossary.tsx         GlossaryText(glossary), SpecBadge(descriptions)          ✅ done (in context.tsx)
  modes/
    StudyMode  FlashcardMode  QuizMode(+Spot)  FillInMode                    ✅ done
    LearnMode  (lessons + scenes config → BoxSchematic / TraceTable)          ✅ done
    ExamMode   (formats, synoptic, self-mark, model answer, command word)     ✅ done
  representations/     the CS "scheme of work" — data-configurable visuals
    BoxSchematic.tsx   generalised CpuDiagram: nodes + containers + flow token ✅ done
    TraceTable.tsx     generalised register/field trace                       ✅ done
    …                  BarCompare / NumberLine / StackDiagram as needed       ⬜
  CSShell.tsx          header · nav · beyond-spec · info · activity routing   ✅ done
  validate.ts          CI contract checker for a CSTopic                      ✅ done (increment 8)
```

---

## The crux: representations as data

Today `CpuDiagram` hard-codes the CPU box layout. The *pattern* — labelled boxes that
highlight, with tokens flowing along edges — recurs across CS (memory hierarchy,
storage devices, the network stack, logic circuits). Generalise it into a
**`BoxSchematic`** driven by data:

```ts
scene: { type: "schematic",
  nodes: [{ id:"pc", x,y,w,h, label:"PC", role:"addr" }, …],
  edges: [["cpu","ram"]],
  flow:  { from:"pc", to:"mar", label:"addr", kind:"addr" } }
```

The CPU diagram then becomes **data inside the topic file**, and other topics supply
their own node layouts against the same primitive — so every schematic across CS looks
and behaves consistently. Lessons reference a scene by descriptor; the shell renders it
through a `SCENES` registry (exactly how the maths `TeachingDeck` maps `TeachScene` →
`SceneView`). `TraceTable` generalises the same way (rows = fields, values per beat).

**Doctrine (mirrors CLAUDE.md's six core representations):** a curated set; topics pick
from it; a brand-new representation needs a reason.

---

## Migration plan — incremental, CpuArchitecture as the canary

No big-bang. Each step compiles, builds, screenshots green, and **CpuArchitecture keeps
working the whole way** — it is the regression test.

1. **✅ Extract zero-coupling utilities + the tooltip/glossary machinery** into
   `src/shared/cs/{ui,tooltip}.tsx`. Proves the seam (shared singleton + the
   "inject topic data" pattern via `parseGlossaryText(glossary, …)`). Behaviour identical.
2. ✅ **`types.ts`** — shared type contract lifted (types + `MARK_FORMATS` +
   `COMMAND_GUIDE`). `CpuArchitecture` imports them; its `GlossaryText` / `SpecBadge`
   stay as thin topic-bound wrappers (they fold into `CSShell` in step 7).
3. ✅ **Self-contained modes** — Study, Flashcard, Quiz+Spot, FillIn — lifted into
   `src/shared/cs/modes/`, parametrised purely by their content props (cards / cloze /
   myths) and reading glossary/spec data from the topic context. `buildChoices` now
   takes the visible card pool instead of a topic global. `CpuArchitecture` imports the
   five modes and behaves identically (canary green: build clean, 264 tests pass).
4. ✅ **Representations** — `CpuDiagram → BoxSchematic`, `TraceTable` lifted into
   `src/shared/cs/representations/`, both driven purely by a config (nodes/roles/
   containers/buses/annotations for the schematic; rows/roles for the trace). The CPU
   box layout is now topic data (`CPU_SCHEMATIC` / `CPU_TRACE` in `CpuArchitecture.tsx`).
   Canary green: build clean, 264 tests pass; SVG output byte-identical.
5. ✅ **LearnMode** lifted into `src/shared/cs/modes/LearnMode.tsx`, topic-agnostic. The
   predict/flow/analogy/trace engine is unchanged; a topic passes `lessons` plus a
   `scenes` config (`{ schematic?, trace?, legend? }`) that wires the lesson's `kind`
   descriptor to a representation (schematic → `BoxSchematic`, trace → `TraceTable`).
   `CpuArchitecture` renders `<LearnMode lessons={LESSONS} scenes={{ schematic: CPU_SCHEMATIC,
   trace: CPU_TRACE, legend: LEGEND }} />`. Canary green: build clean, 264 tests pass.
6. ✅ **ExamMode** lifted into `src/shared/cs/modes/ExamMode.tsx`, self-contained and
   content-driven: it takes `questions` (exam) + `synoptic` props and reads spec
   descriptions from the topic context via `SpecBadge`; `MARK_FORMATS` / `COMMAND_GUIDE`
   come from shared. The pure `resolvePrompt` helper and the `MarkPips` sub-component
   moved into the mode. The topic's `EXAM_QUESTIONS` / `SYNOPTIC_QUESTIONS` stay as data
   in `CpuArchitecture.tsx`. Canary green: build clean, 264 tests pass.
7. ✅ **`CSShell` assembled** in `src/shared/cs/CSShell.tsx` — the header, desktop
   top-tabs + mobile `BottomNav`, the burger menu (topic info + beyond-spec toggle), the
   info modal, the beyond-spec filtering (now inline `topic.cards/cloze/exam.filter`), the
   quiz/spot sub-toggle, the exam-section chips and the activity routing (six modes +
   LearnMode) all lift out of `CpuArchitecture`'s `App()` and wire from one `topic` prop,
   wrapped in `<TopicProvider>`. A new `CSTopic` contract in `types.ts` (id/title/specTags/
   glossary + lessons/scenes/cards/cloze/myths/exam/synoptic/info) is the whole authoring
   surface. `CpuArchitecture.tsx` is reduced to its content consts + a `CPU_TOPIC: CSTopic`
   object + `export default () => <CSShell topic={CPU_TOPIC} />` (560 lines, from 779).
   Canary green: build clean, 264 tests pass, behaves identically. (validate.ts deferred to
   increment 8 — see the CI section's synoptic-tag caveat.) Also landed **content-driven
   activity hiding**: the nav shows only the activities a topic backs (see "Open decisions →
   Per-topic activity opt-out"), so a data-only topic can omit whole modes for free.
8. ✅ **Built 1.1.2 (CPU Performance) as pure data** — `src/tools/ComputerScience/
   CpuPerformance.tsx` is one `CPU_PERFORMANCE: CSTopic` object + a two-line default
   export, registered `enabled: false` pending review. Every content array is filled
   from the OCR J277 1.1.2 spec (clock speed / cache / cores / combining): specTags
   (four requirements + bare synoptic partners 1.1.1 / 1.1.3 / 1.2.1), glossary,
   five lessons — two with their own FOCUSED reused `BoxSchematic` (a CPU/cache/RAM
   hit-vs-miss diagram, a four-core diagram), the other three deliberately
   diagram-free (`kind: "text"`) — no new renderer, cards (+2 beyond-spec), cloze, myths,
   exam (mcq→extended-8, realistic tariffs + mark schemes + model answers) and
   synoptic (spanning 1.1.1 and 1.1.3, per-tag attribution). Alongside it landed
   `src/shared/cs/validate.ts` (`validateTopic`) + `src/tests/cs-topics.test.ts`,
   which discovers every `__topic`-exporting CS tool and asserts: card/exam/cloze
   specTags declared; MCQ answerIndex in range; each cloze `[slot]` has a matching
   word; myth/card/exam/cloze ids unique; predict beats carry both question and
   answer; every diagram lesson resolves a schematic (or is `kind:"text"`); and the
   per-tag synoptic markScheme attribution is declared (NOT the bare top-level synoptic
   specTags — the caveat below). Both CpuArchitecture (canary) and CpuPerformance pass.
   This increment also made a **small shell enhancement** to enable the two-diagram
   design: `TopicScenes` gained a `schematics` map and `Lesson` a `scene` key (a diagram
   lesson names one; omitting it falls back to the single `schematic`, so the canary is
   untouched) + a `kind:"text"` for diagram-free lessons; `LearnMode` resolves per lesson
   and hides the scene panel for text lessons. Both new diagrams were rendered/eyeballed
   before pushing. Green: build clean, 268 tests pass (+4). Next: roll through 1.1.3 → 1.6.

---

## Session rhythm — when to break

Token cost is dominated by two things: (1) per-turn cost grows with the length of a
single session, because the whole conversation history is reprocessed every turn, and
(2) reading screenshots back as images is very expensive and they persist in context.
This shell is deliberately structured so that **breaking between sessions is cheap** —
you don't pay to "reintegrate constant context" if you stop and start at the right place.

**Break at an increment boundary.** Every migration step above is a self-contained unit
that is committed, pushed, and leaves `CpuArchitecture` building and behaving identically
(it is the canary). That is the correct place to stop — never mid-extraction.

**Aim for ~1–2 increments per session, then break.** A single long session gets
disproportionately expensive toward the end; three short sessions cost far less than one
long one doing the same work. Don't push to "finish it all" in one go.

**A fresh session reintegrates cheaply — by design.** To resume, a new conversation needs
only: (a) this doc — the migration checklist shows exactly what's done and what's next;
(b) the small already-extracted `src/shared/cs/*` files; and (c) `git fetch` + checkout of
the branch, then `npm install`. It does **not** need the old conversation, and it should
**not** re-read the whole ~1,600-line `CpuArchitecture.tsx` — read only the region being
extracted next (grep for the component, read that slice).

**Keep verification cheap.** Prefer headless assertions (`pageerrors=0`, a DOM text check
like `tooltipShown=1`) over reading screenshots back as images. Reserve real screenshots
for genuine layout/visual judgement, at modest resolution, and only a couple per session.

**Keep the checklist honest.** Tick the migration steps here (and the module-layout table)
as each lands, so the next session resumes without re-deriving state.

---

## CI: a CSTopic validator (`validate.ts`)

The analog of the maths generator smoke test. For every topic, assert:

- every card / exam / cloze `specTag` is declared in `specTags`;
- MCQ `answerIndex` is in range; each cloze `[slot]` has a matching word;
- `myth` ids unique; predict lesson steps have both a question and an answer;
- every lesson `scene.type` is a registered representation;
- (later) every `[[skill|term]]`-style marker, if adopted, resolves.

Wire it into the vitest suite so authoring mistakes fail at CI — this is what makes
"author fast" safe.

**Caveat (found assembling CSShell):** a `SynopticQuestion`'s top-level `specTags` names
the *sub-topics it spans* (e.g. `["1.1.1", "1.1.2"]`) — bare sub-topic ids that are **not**
necessarily keys in the topic's `specTags` map (which holds `"1.1.1-R3"`-style requirement
tags + the synoptic partners). Validate the **per-tag `markScheme` attribution** on synoptic
questions, not their top-level `specTags`, or the CPU canary false-fails.

---

## Open decisions / risks

- **Representations are the recurring cost.** Definition-heavy topics need almost none
  (static + analogy beats); diagram-heavy strands (networks, logic) need new scene
  renderers — budget ~1–2 per new *strand*, not per topic.
- **Synoptic questions** become cross-topic. The `specTags: string[]` type already
  anticipates it, but once there is >1 topic they should move to a **shared synoptic
  bank** keyed by tag-pairs rather than living inside one topic file.
- **Per-topic activity opt-out.** ✅ **Done** (increment 7). `CSShell` derives which of the
  six activities a topic backs from its content — Learn needs `lessons`, Study/Cards/Quiz
  need `cards`, Spot needs `myths`, Fill needs `cloze`, Exam needs `exam`/`synoptic` — and
  the desktop tabs + mobile `BottomNav` auto-hide the rest (nav hidden entirely for a
  single-activity topic, same idea as ToolShell hiding tabs for one sub-tool). The Quiz
  MCQ/Spot sub-toggle and the exam-section chips filter the same way. No extra authoring:
  omitting a content array hides its activity. `CpuArchitecture` backs all six, so it is
  unaffected.
- **Update `CLAUDE.md`** to document the CS shell the way it documents ToolShell, so
  future sessions author topics as data instead of re-deriving all of this.

---

## Payoff

A new knowledge-heavy sub-topic drops from ~1,900 bespoke lines to **one content file**
(+ occasionally one scene renderer), with consistent UX and a single place to fix bugs
(e.g. the shorter-lesson step-clamp crash is fixed once in the shell for every topic).
