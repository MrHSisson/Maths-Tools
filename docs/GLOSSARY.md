# Glossary — shared vocabulary for Maths Tools

The canonical name for every element of the site, so we can be precise when
discussing changes. If a term here has a code name, that's the one to use.

> **Quick example of precise phrasing:**
> *"Change the **standard grain** of the **expand-brackets technique** so the
> **step title** reads … and the second **fragment** shows …"* —
> unambiguous, because *grain*, *technique*, *step title* and *fragment* each mean
> exactly one thing below.

---

## 1. Structure — how the site is organised

| Term | Means | In code |
|---|---|---|
| **Tool** | One interactive resource with its own page/route (e.g. *Completing the Square*). One entry in the registry. | `ToolMeta` in `src/registry.ts`; the tool file in `src/tools/…` |
| **Sub-tool** | A tab within a tool (e.g. *Linear*, *Factorising*, *Formula* in the sim-eq tool). Hidden automatically if a tool has only one. | keys of `TOOL_CONFIG.tools` |
| **Strand** | A landing-page **category** grouping (Number, Algebra, Ratio & Proportion, Geometry, …). *Not* a detail level. | `CATEGORIES[].name`; `category` on skills |
| **Registry** | The single source of truth listing every tool. | `src/registry.ts` |
| **Kind** | What a registry entry is, so a technique preview never counts as a whole tool: **tool**, **sandbox**, **game**, **generator** or **workshop** (internal). | `kind` in `src/generated/toolFacts.json`; `kindOf` in `scripts/toolFacts.mjs` |
| **Shell** | The shared frame a family of tools runs in: **ToolShell** (maths question generators: modes, options, print…), **DecisionShell** (network-native tools) or **CSShell** (revision tools). Tools render `<ToolShell …/>` etc. | `src/shared/ToolShell.tsx`, `src/shared/decision/`, `src/shared/cs/` |

> ⚠️ **Strand vs Grain.** "Strand" is a topic category. The detail level of working
> is **grain** (§4). Don't say "strand" for detail level.

---

## 2. Modes — the tabs across the top of a tool

| Term | Means |
|---|---|
| **Mode** | Which view of a tool is showing: Whiteboard, Worked Example, Worksheet, Depth, or Teach. |
| **Whiteboard** | Single question on screen with a working/visualiser panel. The main teaching surface. |
| **Worked Example** | The full step-by-step solution to one question. |
| **Worksheet** | A printable grid of questions with PDF export. |
| **Printable** | A ready-made A4 sheet with no generated questions (blank number lines, place value tables, ratio tables, coordinate grids) listed under "Printables" in the burger menu. |
| **Depth** | The mode of curated, fixed questions to diagnose, explain and extend (live; shown only when a tool supplies a bank). Successor to dedicated model decks. |
| **Teach** | The slide-deck teaching mode (Developing-tools only; a tab when a tool supplies slides, otherwise reached through a lesson step). |
| **Working / visualiser panel** | The collapsible right-hand panel on the Whiteboard. |

---

## 3. A question and its options

| Term | Means | In code |
|---|---|---|
| **Question** | One generated item. Two kinds: a **simple question** (one expression) or a **worded question** (lines of text with maths). | `AnyQuestion` = `SimpleQuestion \| WordedQuestion` |
| **Instruction** | The prompt above a question ("Solve simultaneously:", "Find:"). | `instruction` on a sub-tool |
| **Level** (a.k.a. **difficulty**) | Level 1 (green), Level 2 (yellow), Level 3 (red). | `DifficultyLevel` = `level1\|level2\|level3` |
| **Question Options (QO)** | The whole set of per-question controls in the "Question Options" popover. | — |
| **Dropdown** | A single-choice QO control (segmented buttons). | `ToolDropdown` |
| **Multi-select** | A pool of question-type options, several active at once. **The default QO control.** | `ToolMultiSelect` |
| **Variable** | An independent on/off toggle QO control. Use sparingly. | `ToolVariable` |
| **Per-level QO** | QO controls that differ by level. | `difficultySettings` |
| **Differentiated worksheet** | A worksheet with a column per level. | the "Differentiated" button |

When naming a specific control, say e.g. *"the `coeffs` multi-select"* or *"the
`negEq1` variable"* (use the control's `key`).

---

## 4. Working, steps and the techniques engine

| Term | Means | In code |
|---|---|---|
| **Working** | The ordered list of steps that solves a question. | `question.working: WorkingStep[]` |
| **Step** | One row of the working. Three kinds below. | `WorkingStep` |
| **Titled step** | A step with a prose **step title** + maths. The normal step. | `mStep(title, latex)` |
| **Plain step** | A maths line with no title (a continuation row). | `step(latex)` |
| **Note step** | A prose-only step (no maths). | `tStep(text)` |
| **Step title** | The prose label on a titled step ("Substitute into the quadratic formula"). | the `label` of an `mStep` |
| **Fragment** | A piece of a **single** step's line that reveals one at a time (live modelling). Fragments join into one line everywhere except stepped mode. | `string[]` passed to `step`/`mStep` |
| **Live modelling** | Revealing fragments one press at a time, as a teacher writes on a board. | the stepped Worked Example |
| **Technique** | A reusable block that emits titled + fragmented steps for **one recurring move** (e.g. the quadratic formula). Authored once, reused across tools. | `src/shared/techniques/` |
| **Grain** | A technique's level of detail: **brief** (assume the move, one line) · **standard** (default worked-example grain) · **full** (every micro-step — the fundamental teaching pattern). | `Grain` = `brief\|standard\|full` |
| **Workings builder** | The fluent authoring helper a tool uses to assemble its working from bespoke steps + technique blocks. | `workings()` |

> To name a technique's output precisely: *"the **full grain** of `quadraticFormulaSteps`"*
> or *"the **standard grain** of the expand-brackets technique."*

Browse them all at **`/techniques`** (dev mode).

---

## 5. Skills — the drill-down teaching

| Term | Means | In code |
|---|---|---|
| **Skill** | A short, self-contained **slide sequence** teaching one prerequisite (e.g. *Lowest Common Multiple*), with visuals. | `SkillDef` in `src/shared/skills/` |
| **Skill link** | A `[[skill-id\|term]]` marker in a step title that drills down into a skill. | `SKILL_MARKER_RE` |
| **Skill variant / method** | Two ways to teach the same skill (LCM *from times tables* vs *from prime factors*) — separate skills, shared title, a `method` label. | `method` on `SkillDef` |

**Skill vs Technique:** a *skill* teaches with **slides + visuals** (the drill-down); a
*technique* narrates with **working steps**. A technique's **full grain** is the text
spine of the matching skill. Browse skills at **`/skills`** (Developing-tools mode).

---

## 5b. Depth — curated questions

| Term | Means |
|---|---|
| **Depth bank** | A tool's fixed set of curated questions (`depthItems`), shown in Depth mode. |
| **Depth item** | One question: a question beat, then an answer + reasoning beat. |
| **Purpose** | What an item is for: **Diagnose** (surface a misconception), **Explain** (unpick reasoning), **Extend** (go deeper). |
| **Start here** | The quick check: one diagnose item per level, in order, to show where the class is. |
| **Misconception (option)** | The named wrong idea a wrong choice reveals, shown on the answer beat. |
| **Class secure / not secure** | The two follow-up links on an answer: an extension, or an easier/related item. |
| **The cast** | The eight characters who speak in Depth items: **Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal** (`CAST` / `CAST_NAMES` in `DepthArt.tsx`). Items name their speakers from this list; a name always draws the same face. |
| **Feathers** | The owl mascot (`Mascot`): thinking on the question slide, ticking on the answer slide. |

---

## 5c. Lessons — ordered steps inside a tool

| Term | Means |
|---|---|
| **Lesson** | An ordered run of steps (teach → practise → set → extend) listed in a tool's burger menu. Steps may name another sub-tool tab, so a lesson can cross tabs. See `docs/design/LESSONS.md`. |
| **Lesson step** | One stop in a lesson: a Teach deck (`teach`), a Depth item, or a Whiteboard / Worked Example / Worksheet setup. |
| **Hand-off** | A button on a deck's last slide that opens a pre-set Whiteboard / Worksheet / Depth and moves the lesson to its matching step. |
| **Depth slide** | A deck slide (`kind: "depth"`) that plays a real Depth item inside the deck: question beat, then answer beat. |
| **Lesson bar** | The strip under the tool header that shows the lesson, the step, and Back / Next / Finish. |

## 6. Teach decks

| Term | Means |
|---|---|
| **Teach deck** | The whole Teach-mode slide sequence for a tool (Developing-tools only; being replaced by the whole-lesson **Deck** in §6a). |
| **Deck category** | A group of slides within a deck: **Concepts**, **True or False**, **Spot the Mistake** (`concept` / `trueFalse` / `spotMistake`). |
| **Phase** | Legacy field (`iDo` / `weDo` / `youDo`); no longer drawn on slides. |
| **Slide** | One card in a deck. Either **static** (body blocks + one reveal) or **anim** (a scene choreographed across beats). |
| **Beat** | One press within an anim slide — the unit of reveal. |
| **Scene** | The animated diagram inside an anim slide (e.g. `split`, `multiples`, `factorTree`). |
| **Scene family** | A group of scenes built on the same core representation. |

---

### 6a. Decks — whole lessons on their own page
- **Deck** — one directed lesson that can span tools: an ordered list of slide configs, played at `/decks/<id>` (it is not a Teach deck, which belongs to one tool and is being retired). Reference: `docs/reference/decks.md`.
- **Slide family** — Lesson (structure), Language, Teach, Practice, Depth, Discussion, Retrieval. Each has one accent and one job.
- **Element** — one thing on a slide's canvas: text, equation, shape, line, image, board, practice question, question grid, Depth item, generator question or book activity.
- **Generator question / book activity** — a tool's own generator on a slide: one question at a time like the Whiteboard, or a printable numbered set.
- **Send to a deck** — the tool page's burger-menu item that turns the current setup or question into a deck slide.
- **Click order (step)** — the click on which an element appears when presenting.
- **Layout** — a pre-arranged slide a new slide starts from (title, objective, board…); shown in the Slide library.
- **Board** — an element the teacher writes on; its **fill mode** is Filled in, Structure only or Blank.
- **Hand-picked question / bank** — a practice question written against one misconception tag; the generator is its backup.
- **Misconception tag** — an id in `src/shared/misconceptions.ts`, shared by deck questions and (as it grows) Depth options.

## 7. Visuals

| Term | Means | In code |
|---|---|---|
| **Core representation** | One of the eight canonical visual models: **bar model, number line, area model, algebra tiles, negative counters, prime factor tiles, place value table, ratio table**. Every new visual must reuse one. | see CLAUDE.md |
| **Two-view worked example** (a.k.a. **split worked example**) | The Worked Example with the steps on one side and ONE picture on the other that updates as you press. Two flavours: **caption timeline** (the picture does the working) and **keep-working** (flat numbered rows carrying each step's maths). | `stepVisualRenderer`, `stepVisualKeepsWorking` |
| **Answer step** | The final step as its own numbered green step labelled "Answer:" (split from an inline chain's last link). | `splitAnswerStep` |
| **Per-step focus** | What a diagram lights up for the current step (e.g. the angles that step is about); the rest fades. | `_stepFocus` → `_focus` |
| **Derived value** | A value the working finds, drawn on the diagram from the step that finds it (green). | `appearsAt`, `_step` |
| **Odometer** | Binary Counting's view: one big place-value row per base, counting up in place. | `BinaryCounting.tsx` |
| **Unit ladder / scale** | Data Units' bit–nibble–byte–KB…PB ladder with ×1000 (×1024) steps, drawn in the working box. | `UnitLadder` in `src/shared/components/UnitLadder.tsx` |
| **SmartGrapher** (a.k.a. **the grapher**) | The embeddable coordinate-graph component. | `src/shared/grapher/` |
| **Series** | One plotted curve/line on a grapher. | `GraphSeries` |
| **FOI** | A "feature of interest" — a marked point (root, vertex, intersection…). | `FOI` |

---

## 8. Dev / release state

| Term | Means | In code |
|---|---|---|
| **Developing-tools mode** (a.k.a. **dev mode**) | The global switch that reveals unfinished work. | `useDevMode()`, `mt-dev-mode` |
| **Dev-gated / DEV-badged** | A tool that only shows in dev mode (**not live**). | `enabled: false` in the registry |
| **Page** | A route that is not a tool (the Tools dashboard, technique previews): no state, no card. | `PAGES` in `src/registry.ts` |
| **State** (on the Tools dashboard) | **Live** or **Not live** (`enabled: false`), read from the registry. A tool's separate **Plan status** (idea → shelved) is a note written by hand. | `availabilityOf` in `src/admin/facts.ts` |

---

## 9. Anti-ambiguity — say this, not that

| Say | Not | Because |
|---|---|---|
| **grain** (brief/standard/full) | "strand", "level", "mode" | *strand* = category; *level* = difficulty; *mode* = the tab |
| **strand** | "category" is fine too | one landing-page grouping |
| **sub-tool** | "tab", "tool" | *tool* = the whole page |
| **step title** | "label", "heading" | the prose on a titled step |
| **fragment** | "sub-step", "part" | a reveal-piece of ONE line |
| **technique** | "skill", "step block" | *skill* = the slide drill-down |
| **skill** | "technique", "deck" | *deck* = a tool's Teach slides |
| **Question Options / QO** | "settings", "options" | the per-question control popover |
| **Level 1/2/3** | "grade", "tier" | the difficulty toggle |
