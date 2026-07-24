# Computer Science Shell — architecture plan

Status: **in progress** (increment 1 landed). This doc is the reference for turning
the one-off `CpuArchitecture` tool into a reusable **CS shell**, so future
knowledge-heavy CS sub-topics (1.1.2 → 1.6) are authored as *data*, not bespoke code.

Read this before building the next CS tool.

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
                       (CSTopic + Scene union added when CSShell is assembled)  ⬜
  glossary.tsx         GlossaryText(glossary), SpecBadge(descriptions)       ⬜
  modes/
    StudyMode  FlashcardMode  QuizMode(+Spot)  FillInMode                    ⬜
    LearnMode  ExamMode                                                       ⬜
  representations/     the CS "scheme of work" — data-configurable visuals
    BoxSchematic.tsx   generalised CpuDiagram: nodes + edges + flow tokens    ⬜
    TraceTable.tsx     generalised register/field trace                       ⬜
    …                  BarCompare / NumberLine / StackDiagram as needed       ⬜
  CSShell.tsx          header · nav · beyond-spec · info · activity routing   ⬜
  validate.ts          CI contract checker for a CSTopic                      ⬜
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
3. ⬜ **Self-contained modes** — Study, Flashcard, Quiz+Spot, FillIn — parametrised by
   props (cards / cloze / myths / glossary).
4. ⬜ **Representations** — `CpuDiagram → BoxSchematic`, `TraceTable`; move the CPU node
   layout into topic data.
5. ⬜ **LearnMode** with the scene registry (predict/flow/analogy engine is already generic).
6. ⬜ **ExamMode** (formats, synoptic, self-mark, model answer, command word).
7. ⬜ **Assemble `CSShell`**; reduce `CpuArchitecture.tsx` to
   `export default () => <CSShell topic={CPU_TOPIC} />`, where `CPU_TOPIC` is the
   extracted data. Pixel-identical result = extraction correct.
8. ⬜ **Build 1.1.2 as pure data** to prove the payoff, then roll through 1.1.3 → 1.6.

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

---

## Open decisions / risks

- **Representations are the recurring cost.** Definition-heavy topics need almost none
  (static + analogy beats); diagram-heavy strands (networks, logic) need new scene
  renderers — budget ~1–2 per new *strand*, not per topic.
- **Synoptic questions** become cross-topic. The `specTags: string[]` type already
  anticipates it, but once there is >1 topic they should move to a **shared synoptic
  bank** keyed by tag-pairs rather than living inside one topic file.
- **Per-topic activity opt-out.** A topic declares which activities it provides; the nav
  auto-hides the rest (same idea as ToolShell hiding tabs for a single sub-tool).
- **Update `CLAUDE.md`** to document the CS shell the way it documents ToolShell, so
  future sessions author topics as data instead of re-deriving all of this.

---

## Payoff

A new knowledge-heavy sub-topic drops from ~1,900 bespoke lines to **one content file**
(+ occasionally one scene renderer), with consistent UX and a single place to fix bugs
(e.g. the shorter-lesson step-clamp crash is fixed once in the shell for every topic).
