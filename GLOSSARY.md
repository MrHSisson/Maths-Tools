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
| **ToolShell** | The shared shell that gives every tool its modes, options, print, etc. Tools render `<ToolShell …/>`. | `src/shared/ToolShell.tsx` |

> ⚠️ **Strand vs Grain.** "Strand" is a topic category. The detail level of working
> is **grain** (§4). Don't say "strand" for detail level.

---

## 2. Modes — the tabs across the top of a tool

| Term | Means |
|---|---|
| **Mode** | Which view of a tool is showing: Whiteboard, Worked Example, Worksheet, or Teach. |
| **Whiteboard** | Single question on screen with a working/visualiser panel. The main teaching surface. |
| **Worked Example** | The full step-by-step solution to one question. |
| **Worksheet** | A printable grid of questions with PDF export. |
| **Teach** | The slide-deck teaching mode (dev-gated; only when a tool supplies a deck). |
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
spine of the matching skill. Browse skills at **`/skills`** (dev mode).

---

## 6. Teach decks

| Term | Means |
|---|---|
| **Deck** | The whole Teach-mode slide sequence for a tool. |
| **Deck category** | A group of slides within a deck: **Concepts**, **True or False**, **Spot the Mistake** (`concept` / `trueFalse` / `spotMistake`). |
| **Phase** | The teaching arc badge on a slide: **I-do / We-do / You-do** (`iDo` / `weDo` / `youDo`). |
| **Slide** | One card in a deck. Either **static** (body blocks + one reveal) or **anim** (a scene choreographed across beats). |
| **Beat** | One press within an anim slide — the unit of reveal. |
| **Scene** | The animated diagram inside an anim slide (e.g. `split`, `multiples`, `factorTree`). |
| **Scene family** | A group of scenes built on the same core representation. |

---

## 7. Visuals

| Term | Means | In code |
|---|---|---|
| **Core representation** | One of the six canonical visual models: **bar model, number line, area model, algebra tiles, negative counters, prime factor tiles**. Every new visual must reuse one. | see CLAUDE.md |
| **SmartGrapher** (a.k.a. **the grapher**) | The embeddable coordinate-graph component. | `src/shared/grapher/` |
| **Series** | One plotted curve/line on a grapher. | `GraphSeries` |
| **FOI** | A "feature of interest" — a marked point (root, vertex, intersection…). | `FOI` |

---

## 8. Dev / release state

| Term | Means | In code |
|---|---|---|
| **Developing-tools mode** (a.k.a. **dev mode**) | The global switch that reveals unfinished work. | `useDevMode()`, `mt-dev-mode` |
| **Dev-gated / DEV-badged** | A tool that only shows in dev mode. | `enabled: false` in the registry |
| **Hidden** | A tool never listed anywhere (route still works). | `hidden: true` |

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
