# CS Topic Spec: <Topic Name>

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

A completed copy of this template is everything Claude Code needs to build a
Computer Science revision topic end-to-end with **zero follow-up questions**.
Save completed briefs as `specs/cs/<topic-id>.md`.

> **What this is.** CS tools are **knowledge/revision** tools on the `CSShell`
> (see `CS_SHELL_PLAN.md`), *not* question generators — so there are **no L1/L2/L3
> difficulty levels**, no Whiteboard/Worksheet, and almost **no generation
> logic**. A topic is authored as **data**: the facts, the cards, the exam
> questions and their mark schemes. That makes this brief mostly **content
> authoring** — the sweet spot for designing in a chat.
>
> **Three principles (from the J277 brief — `CS_ROADMAP.md`):**
> 1. **Spec fidelity** — every card / question carries a **spec tag**; anything
>    off-spec is a clearly-flagged "Beyond spec" layer, excluded by default.
> 2. **Exam realism** — real OCR J277 formats and mark tariffs; a synoptic
>    section that spans sub-topics.
> 3. **Mobile-first** — short phone-sized revision sessions are the primary use.
>
> **Before filling this in:** read `CS_SHELL_PLAN.md` (the `CSTopic` shape and the
> six activities) and skim the pilot topic `CpuArchitecture.tsx` (OCR 1.1.1) for
> the standard each section is held to.

---

## 1. Overview

| Field | Value |
|---|---|
| Topic name | <!-- e.g. "CPU Performance" --> |
| Spec sub-topic | <!-- OCR J277 reference, e.g. "1.1.2" --> |
| Topic id / URL path | <!-- `/cpu-performance` — the id is the path without the slash --> |
| Paper / component | <!-- e.g. "Component 1 (J277/01) — Computer Systems" --> |
| Card description | <!-- one sentence for the landing page card --> |
| Activities provided | <!-- default is all six: Learn · Study · Cards · Quiz (+ Spot the Mistake) · Fill · Exam. Name any you're deliberately omitting (the nav auto-hides them) and why. --> |

**Revision intent (2–3 sentences):** what should a student be able to recall and
do after a session on this topic, and how does it connect to neighbouring
sub-topics (its natural synoptic partners)?

---

## 2. Spec tags (spec fidelity)

<!-- The exact OCR spec statements this topic covers. Each gets a stable id of
     the form `<sub-topic>-R<n>` (R = requirement) and the statement text
     verbatim-ish. EVERY card, cloze, exam and myth below cites one of these ids,
     so list them first. These become the `specTags` map in the topic file. -->

| Tag id | Spec statement |
|---|---|
| `1.1.2-R1` | <!-- e.g. "The purpose and characteristics of clock speed." --> |
| `1.1.2-R2` | |
| `1.1.2-R3` | |

---

## 3. Glossary

<!-- The key terms a student must know, each with a short, student-facing
     definition. These drive the touch-first tooltips (tap a term anywhere in the
     tool to see its definition). Keep each to one sentence. Cards/lessons name
     which of these terms to underline. -->

| Term | Student-facing definition (one sentence) |
|---|---|
| <!-- clock speed --> | <!-- how many instruction cycles the CPU carries out each second, measured in hertz. --> |
| | |

---

## 4. Learn — taught lessons

<!-- The "Learn" activity is a taught walkthrough the student presses through one
     BEAT at a time (like a Teach deck, but for CS). Author it in prose — no code.
     A topic has one or more lessons; each lesson is a short sequence of beats.

     Beat types available (mix as suits the idea):
       • plain    — a sentence of teaching (optionally highlighting parts of a scene).
       • predict  — a You-do beat: pose a question, the student thinks, THEN the
                    next beat gives the answer. Use these to make Learn active.
       • flow     — a token animates between two parts of a diagram/scene
                    (e.g. an address travelling PC → MAR). Only for scene lessons.
       • analogy  — a "Think of it like…" concrete anchor for the whole lesson.

     A lesson MAY use a CS core representation (a "scene"). The existing/planned
     representations (see CS_SHELL_PLAN.md) are:
       box schematic (labelled boxes with tokens flowing along edges) ·
       trace table (register/field values changing per beat) ·
       bar-compare (planned, 1.1.2) · number line / place-value (planned, data rep) ·
       network stack / topology (planned, 1.3).
     Definition-heavy topics need NO scene — plain + predict + analogy beats are
     enough. A diagram-heavy topic naming a scene that doesn't exist yet is a
     real build cost — flag it here so the implementer budgets for it. -->

### Lesson: <title>  — covers `<tag(s)>`
- **Representation / scene:** none  <!-- or: "bar-compare (NEW — must be built)" / "box schematic (exists)" -->
- **Analogy (optional):** <!-- "Think of clock speed like…" -->
- **Beats:**
  1. (plain) <!-- teaching sentence --> 
  2. (predict) <!-- question posed --> → answer: <!-- … -->
  3. …

<!-- Repeat for each lesson. -->

---

## 5. Cards (flashcards / Quiz)

<!-- Each card is a Q→A recall pair. The SAME cards power both Cards (flip) and
     Quiz (MCQ) — so give distractors (wrong-but-plausible options) for any card
     that should appear as multiple choice. `explain` is the feedback shown after
     answering: the "why" or a memory hook. Cite a spec tag on every card. Mark
     `beyond spec: yes` for enrichment cards (excluded from default sessions). -->

| Spec tag | Question | Answer | Distractors (for MCQ) | Explain (feedback) | Beyond spec? |
|---|---|---|---|---|---|
| `1.1.2-R1` | | | | | no |
| | | | | | |

---

## 6. Fill (cloze)

<!-- Fill-in-the-gap sentences. Mark each gap by wrapping the missing word in
     [SQUARE BRACKETS]. `words` is the pool shown to drag/pick from = the correct
     answers PLUS a few distractors. Keep each exercise to 1–3 gaps. -->

| Spec tag | Title | Sentence (gaps in [brackets]) | Word pool (answers + distractors) |
|---|---|---|---|
| `1.1.2-R1` | | <!-- "A higher [clock] speed means more [cycles] per second." --> | <!-- clock, cycles, cores, cache --> |
| | | | |

---

## 7. Exam questions

<!-- Real J277-style questions with realistic mark tariffs. Formats (fixed set):
       mcq       — multiple choice, 1 mark, options + which index is correct.
       state     — State / Identify: the fact only, low tariff.
       short     — Describe: what happens, in order; usually 2–3 marks.
       scenario  — Apply to a given scenario (use {context} placeholders + a list
                   of contexts to swap in).
       extended  — Explain / discuss; make AND justify each point; 6+ marks.

     For each: the prompt, marks, a hint, the MARK SCHEME as a list of
     mark-earning points, and a model answer (mark **bold** the parts that earn
     marks). MCQ also needs the options and the correct one. This mark scheme is
     the correctness reference Claude Code builds the self-marking against. -->

### Q<n> — format: `<format>` — <marks> mark(s) — `<tag>`
- **Prompt:** 
- **Contexts (scenario only):** 
- **Options + correct (mcq only):** 
- **Hint:** 
- **Mark scheme (one bullet per mark):**
  - 
- **Model answer:** <!-- prose; **bold** the mark-earning phrases -->

<!-- Repeat for each exam question. Aim for a spread across formats and across
     the spec tags. -->

---

## 8. Synoptic questions (cross-topic)

<!-- Questions that span THIS topic and a neighbour (the "natural synoptic
     partners" from §1). Attribute marks per spec tag. Omit this section only if
     the topic genuinely has no near neighbour yet — but prefer to include at
     least one, since synoptic recall is a J277 discriminator. -->

### SQ<n> — spans `<tag-a>` + `<tag-b>` — format `<format>` — <marks> mark(s)
- **Prompt:** 
- **Hint:** 
- **Mark scheme by tag:**
  - `<tag-a>`: 
  - `<tag-b>`: 
- **Model answer:** 

---

## 9. Myths — Spot the Mistake / True or False

<!-- Common misconceptions for this topic. Each is a statement the student judges
     true/false, with the correction shown after. These power the Spot-the-Mistake
     part of Quiz. Draw them from the misconceptions the teacher actually sees. -->

| Spec tag | Statement | True / False | Why (the correction) |
|---|---|---|---|
| `1.1.2-R1` | <!-- "A CPU with a higher clock speed is always faster." --> | False | <!-- "Not necessarily — cores and cache also matter…" --> |
| | | | |

---

## 10. Beyond spec (enrichment, flagged)

<!-- Anything genuinely interesting but OFF the J277 spec. It's included only as a
     clearly-badged "Beyond spec" layer and excluded from default sessions. List
     it here (as cards/facts) or write "none". -->

---

## 11. Info modal content

<!-- Teacher-facing notes: one section per activity or theme, each a list of
     { label, detail } rows (1–2 sentences each). What a teacher needs to know to
     use the topic well — what's covered, what's deliberately beyond spec, how it
     links synoptically. -->

### <section title>
- **<label>:** <detail>

---

## 12. Out of scope / future ideas (optional)

<!-- Deliberate exclusions, a representation you chose NOT to build yet, sub-topics
     this should later link to synoptically — so the implementer doesn't guess. -->
