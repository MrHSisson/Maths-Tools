# Depth, Teach decks, lessons and skills

**Read when:** Authoring a Depth bank, a Teach deck, a lesson, or touching the Skill library.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

---

## One slide size

A Teach slide and a Depth stage out of full screen use the same width (`slideSlotWidth()`, `src/shared/slideSize.ts`: the height left after `SLIDE_CHROME_REM` of page chrome, 16:9). Use it for any new 16:9 slide surface.

## Depth — a bank of curated questions (diagnose · explain · extend)

**Depth** is a ToolShell mode (a "Depth" tab beside Whiteboard / Worked Example / Worksheet) holding **fixed, hand-written questions** that go beyond generated practice. It is the lighter, adaptive successor to a presentation deck: the teacher dips in by **purpose** and **level**, in whatever order the class needs, instead of pressing through a pre-planned sequence. Where a tool already shows the model (BIDMAS pyramid, place value table…), a dedicated model deck is unnecessary.

```tsx
<ToolShell depthItems={DEPTH_ITEMS} … />   // items: DepthItem[] — see src/shared/depth.ts
```

- **The question never moves.** The question zone (speakers, working, prompt, options) is drawn the same on both beats; the answer beat only marks things in place (the right option, the first wrong line) and fades into a gap reserved below, so nothing reflows when the answer is revealed. Type is modest (question ≈ 1.05em, options 0.95em, answer 0.8em of a 40px base on the deck's 1600 × 900 slide): a slide that is crowded is shrunk by the fit box, so do not make the base bigger to compensate. <!-- R34 -->
- **An item is two slides**: the **question** slide, then the **answer** slide (`←` / `→` / `Space`, or the Question | Answer switch). Each is designed like a classroom slide, not app UI: a navy 16:9 stage (the site blue) with a left rail (plain DEPTH wordmark, level pill, purpose pill in the purpose's accent colour, and the owl mascot — a question mark on the question slide, a tick on the answer slide), a white left-aligned panel topped with a purpose-coloured bar, cartoon speakers with speech bubbles and big type. The stage's type scales with its width (container-query units; phones get a normal flowing column). **Present** fills the screen — an overlay that works in every browser, plus native fullscreen where the browser allows; `Esc` leaves. `$...$` is inline maths in every string.
- **Interactive pieces** (all optional per item): `speakers` draw cartoon faces with speech bubbles ("Jack says…"); `working` shows lines of working the class can tap to pick the one they think is wrong (the answer slide marks `wrongLine` as the first mistake and dims the lines that follow from it); `options` are lettered tiles (the answer slide marks the correct one and names the misconception behind each wrong one); `visual` shows a picture in the panel's corner (currently `{ type: "pyramid", strong, soft }`, the BIDMAS pyramid — visible from the start, lit on the answer slide; a **Scaffold → BIDMAS pyramid** switch in the side rail hides it, kept between questions). There are no teacher notes and no speech bubbles from Feathers: the owl is a mascot only (a question mark's worth of "thinking" on the question, "knowing" on the answer). Artwork lives in `DepthArt.tsx` (original SVG: `Avatar`, `Mascot`, `Badge`). <!-- R34 -->
- **Three purposes**: `diagnose` (surface a misconception — who is right? multiple choice where every wrong option **names the misconception it reveals**, shown on the answer beat), `explain` (unpick reasoning — explain this mistake, spot the error in working), `extend` (go deeper — always/sometimes/never, convince me, make your own). <!-- R34 -->
- **Level-aware**: the picker shows the current level's items (the level toggle sits above it), filterable by purpose. `startHere: true` on one diagnose item per level feeds the **Start here** quick check (one question per level, in order — shows where the class is).
- **Follows the Question Options**: Depth shows the same Question Options control as the other modes (same state, so what is ticked in Whiteboard / Worked Example / Worksheet is what Depth sees). An item may list `needs` — clauses that must all hold, each an option `value` or an array of which at least one must be on (e.g. `[["indices", "bracketsIndices"], "negatives"]`). Items whose needs aren't met are **greyed out** in the picker with "Needs Focus: Roots", so a class building up never gets a question it can't meet. Needs are checked only for items at the current level (cross-level links and the Start here check are never blocked); a clause naming no option offered on the current sub-tool/level is skipped, so one list can name a generator's options on several tabs (Evaluate's focus families and Spot the Mistake's mistake types). Omit `needs` for an item that is always possible. `depthUnmet` (shared) does the check; `depth.test.ts` verifies every named option exists, that default options still leave diagnose, explain and extend at every level, and that no single option leaves fewer than 3 items (or only diagnose items) — write items so every Question Option has something to offer. <!-- R35 -->
- **Feathers (the owl) is a mascot, he does not talk** (changed 2026-11-01): he sits in the answer gap, thinking on the question and knowing on the answer, with no speech bubble and no mute button. `prompt` / `takeaway` / `teacherNote` were removed from every bank and are retired fields in `DepthItem`: nothing draws them and a new bank does not write them. Speakers are the eight named cast (Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal — `CAST_NAMES`); name speakers from that list. <!-- R34 -->
- **Adaptive without a script**: `ifNotSecure` / `ifSecure` point at an easier/related item or an extension; the answer beat offers them as buttons (a link may cross levels; `ifSecure` never goes down). <!-- R34 -->
- **Authoring rules**: the `title` shows on the picker so it must not give the answer away; items are **fixed** (never generated — generated "Is it correct?" / "Spot the mistake" tasks stay in the tool's own practice); give each wrong option a `misconception`; ids are `<tool>-<slug>` (URL-safe, used by `?item=`). <!-- R34 -->
- **Gating**: none — Depth is live wherever a tool passes `depthItems` for the current sub-tool (an item with no `tool` shows on every tab). URL: `?mode=depth&level=2&item=<id>`.
- **Tests**: expose the bank as `__test.depthItems` — `src/tests/depth.test.ts` checks unique ids, well-formed items, one correct option per multiple-choice item with a named misconception for every wrong one, links that resolve, diagnose + explain + extend at every level, one Start here per level, and that every `$...$` renders. Assert the bank's numbers in the tool's own test (see `OrderOfOperations`).
- **Spec**: `docs/design/templates/DEPTH_SPEC_TEMPLATE.md` → `specs/depth/<tool-id>.md`. Reference bank: `src/tools/Number/OrderOfOperationsDepth.ts` (32 items).

## Teaching slides — the "Teach" deck  (authoring guide)

The **Teach** deck (`TeachingDeck`, `src/shared/TeachingDeck.tsx`) is a slide-based "teaching part of the lesson": the teacher picks a category, then presses through hand-authored, misconception-driven slides one **beat** at a time before moving to Whiteboard / Worksheet. This section is the complete guide to authoring them.

**Developing-tools gated.** Decks only show when Developing-tools mode is on (`useDevMode()` in `ToolShell.tsx`, `showTeach`). A tool with `teachingSlides` gets a Teach tab; lesson decks (`teachingLessons`) have NO tab: they are reached through a lesson step (burger menu → Lessons). Remove the gate when a deck is classroom-ready and should go fully live.

**Add a deck to a tool.** Define an array in the tool file and pass it: `<ToolShell teachingSlides={TEACHING_SLIDES} … />`. No prop → no Teach tab. Reference implementation: `src/tools/Number/FractionsAddSub.tsx` (`TEACHING_SLIDES`); a minimal one in the `ToolShell.tsx` template.

**`SlideDeck`** is the reusable core: it plays a flat `TeachingSlide[]` one beat per press (keyboard included) and is exported from shared. `TeachingDeck` wraps it with the category menu; the skill-library overlay (`SkillOverlay`) plays a skill's slides through it directly. New slide-playing surfaces should reuse it, not reimplement beats. The slide card is **fixed-height** (62vh embedded; `fill` makes it fill the host — the skill overlay is near-fullscreen with a slim dimmed rim) with the nav controls (Back / beat counter / Next) inside the card's bottom edge — the whole surface is teaching space, no external button row. Every beat's content is laid out from the first press — captions stack in one grid cell sized to the tallest, static reveals reserve their space with the Reveal button overlaying it — so the card never resizes mid-slide. Content that would exceed the card **auto-scales down to fit** (CSS transform, measured per slide) — slides never show scrollbars, on any screen size. Scenes must follow the same rule: reserve space for everything (opacity, not mounting). <!-- R32 -->

**Size for readability, never to fill.** The container claims the screen; the content does not. Scenes and text are authored at a size chosen for legibility from the back of a classroom — fit-scaling only ever scales content *down*, and nothing is ever inflated to occupy empty card space. Whitespace around a slide is calm framing, not waste; a slide that fills its card edge-to-edge is harder to read, not better. <!-- R32 -->

**Authoring philosophy — read before writing slides.**
- Slides are **specific, hand-authored, misconception-driven examples** — NOT generated. The randomised/varied side is exactly what Whiteboard and Worksheet are for; do not add generators here. <!-- R33 -->
- Prefer an **I-do → We-do → You-do** arc within a category, on **one coherent example** (e.g. keep the same fraction across the three). You-do should make the student **predict/answer** before the reveal.
- `title` is a short **topic label** (e.g. "Equivalent fractions"), not a sentence — it renders small and muted. The **changing caption is the voice**; put the teaching there.
- No emoji. Palette is navy shade + slate cut-lines + white cards. Keep to it. Every slide is the same 16:9 shape (card, scene and Depth stage alike); there are no I do / We do / You do banners. The Back / Full screen / Next row sits under the card; full screen is an overlay that ends when the deck unmounts (a hand-off or the lesson moving on).

**Slide model (`TeachingSlide`).** Every slide has `category: "concept" | "trueFalse" | "spotMistake"` (`TeachCategory`). Two kinds:

```ts
// static (default kind) — body blocks, then one optional `reveal` (one extra beat / a Reveal button)
{ category: "trueFalse", title: "$2+3=6$",
  body:   [{ t: "text", s: "Decide first." }],
  reveal: [{ t: "verdict", value: false }, { t: "note", tone: "good", label: "Correct", s: "$2+3=5$." }],
  revealLabel: "Reveal" }

// anim — a scene choreographed across beats, ONE caption per beat
{ kind: "anim", category: "concept", title: "Equivalent fractions",
  scene: { type: "split", num: 3, den: 5, factor: 2 },
  steps: ["Here is $\\dfrac{3}{5}$…", "Split the first fifth…", /* one per piece */ "…$\\dfrac{6}{10}$." ] }
```

**`TeachBlock` types (static slides):** `{ t:"text", s }` (`$...$` inline maths, `**bold**`) · `{ t:"math", s }` (large centred KaTeX) · `{ t:"bars", bars:[{num,den,label?}] }` (static shaded bars) · `{ t:"verdict", value:boolean }` (TRUE/FALSE pill) · `{ t:"note", tone?:"good"|"bad"|"plain", label?, s }` (bordered note, coloured left rule, **no emoji**).

**`TeachScene` types (anim slides)** — the beat count is **derived from the scene**, so `steps` must supply one caption per beat (fewer is allowed; the last caption persists — avoid that with `predict`): <!-- R32 -->

| scene | beats (max step = beats−1) | what it does |
|---|---|---|
| `{ type:"split", num, den, factor, shadeByOne?, predict? }` | `den + 2` (`+1` if `predict`, `+num` if `shadeByOne`) | cuts ONE original piece into `factor` per press (shaded area never moves), then shows the equation `num/den = (num·f)/(den·f)`. `predict` holds the answer at `?/?` for one extra beat (You-do). | <!-- ref -->
| `{ type:"equivalents", num, den, factors:number[] }` | `factors.length + 1` | beat 0 is the prompt; each later beat reveals one `×factor` equivalent — for a "find two equivalent fractions" You-do (`factors:[2,3,4,5]` gives the four common answers). |
| `{ type:"multiples", a, b }` | `lcm/a + lcm/b + 2` | LCM walkthrough: each press writes the next multiple (a's list up to the LCM, then b's); the shared value highlights when it lands, and the final beat states `LCM(a, b)`. |
| `{ type:"factorTree", n }` | `Ω(n) + 1` (Ω = prime factors with multiplicity) | builds n's factor tree one split per press, always dividing out the smallest prime; composites are plain numbers, each prime becomes a coloured tile as it's produced; final beat states the product. | <!-- ref -->
| `{ type:"primeVenn", a, b }` | `(total primes across regions) + 2` | both factor lists shown as tile rows up front; each press crosses the next tile(s) off the list(s) and places the prime in the Venn (a shared prime strikes one tile off EACH list and puts a single tile in the middle); final beat multiplies everything for the LCM. |
| `{ type:"combine", a, b, sumLabel }` | `2` | two shaded bars (common denominator) flow into one. |

**Lessons in the deck (`teachingLessons`).** Instead of the category menu a tool can pass `teachingLessons={TEACH_LESSONS}` (`TeachLesson { id, title, summary, tool, slides }`, one per sub-tool topic; the Teach menu lists the lessons on the current tab). A static slide may carry a `{ t: "handoff", buttons: [{ label, to: { tool, step } }] }` block: the buttons open a pre-set Whiteboard / Worksheet / Depth in place (`step` is a lesson-step setup — `setupParams` in `src/shared/lessons.ts`). Build diagnostic check slides from the Depth bank by id rather than copying them: a `{ kind: "depth", item }` slide plays the real Depth stage inside the deck (question beat, then answer beat; `checkSlide(id)` in `IndicesTeach.ts`). A lesson step of kind `teach` (`deck: "<lesson id>"`) opens a deck; a lesson step may name its own `tool` so a lesson moves on to another tab. Reference: `src/tools/Number/IndicesTeach.ts` (Laws of indices) and `src/tests/indicesTeach.test.ts`. The `indexExpand` scene (`multiply` · `divide` · `power` · `expand`; factor tiles, one tile per copy of the base) carries index laws; its optional `head` / `tail` strings replace the equation line above / below the picture (e.g. `x^-2 × x^5 = 1/x² × x^5 = x⁵/x²` over the cancelling tiles).

**Adding a new scene type:** extend the `TeachScene` union, add its beat count to `sceneMaxStep`, and render it in `SceneView` (+ a component). Drive animation with CSS transitions on SVG (opacity/transform), no libraries — see `SplitScene`. The URL `mode=teach` deep-links to the deck.

## Lessons — ordered steps inside a tool

A **lesson** is an ordered run of steps inside one tool (`docs/GLOSSARY.md` §5c). It is the teacher's sequence: a Depth item to diagnose, a Whiteboard or Worked Example to practise, a Worksheet to set, a Depth item to extend.

- **Developing-tools gated.** Lessons only appear when Developing-tools mode is on (`ToolShell` wrapper, `useDevMode()`), the same as Teach. Structure and learnings: `docs/design/LESSONS.md`.
- **A lesson may cross tabs:** a step names its own `tool`; the lesson's `tool` is where the overview opens. A deck hand-off moves a running lesson to the next step of the same kind and tool.
- **Declare** lessons on the tool's default export: `<ToolShell lessons={LESSONS} … />` (see `src/tools/Number/IndicesLessons.ts`). The burger menu has one **Lessons…** item that opens a lessons page (`LessonsPage`, a card per lesson); lessons are never on the landing page. <!-- R36 -->
- **A step is a shareable-link setup.** Its `kind` (`depth` · `whiteboard` · `example` · `worksheet`), `level`, `item`, `ms`, `vars`, `dd`, `n`, `cols` and `diff` are the same parameters the URL already carries (`src/shared/lessons.ts`). Give every Question Option the step needs, by value.
- **A lesson's deck is full-size and self-contained:** while a lesson step's deck plays, the page's title and tabs are hidden (`compact`) and its back button ("← Lesson") returns to the lesson overview; a deck opened by a lesson never shows the deck menu. The step bar is a small bottom-left pill that can be collapsed to a tab and hides itself while anything is full screen (`useFullscreenFlag`, `src/shared/fullscreenFlag.ts`). <!-- ref -->
- **A Depth step plays inside the deck surface** (`SlideDeck` with one `{kind:"depth"}` slide, "← Lesson" back, Next step ▸ at the end) with the page title/tabs/top padding hidden and the slide given more room (`LESSON_CHROME_REM`), so Teach and Depth steps share one size and chrome; the Depth tab itself is unchanged.
- **The deck is not the container.** A Teach deck (when it exists) is only one possible step; a lesson can be Depth → Worksheet with no deck.
- **Tests**: `src/tests/indicesLessons.test.ts` is the pattern. Every preset names a real sub-tool, level, option and Depth item on that sub-tool.
- **Opening a lesson shows its overview** (one card per step). A card opens that step; the step bar's title returns to the overview, and Finish on the last step does too. The close button leaves the lesson.
- A running lesson keeps `lesson=<id>&step=<n>` in the URL (`lesson=<id>` alone on the overview). Changing mode or options mid-step is allowed; the step bar stays until Finish or the close button.

---

## Skill library (`src/shared/skills/`)

Small, reusable slide sequences that each teach **one** core skill pedagogically, on hand-picked model-friendly exemplar numbers. They are the drill-downs behind `[[skill-id|term]]` markers, and are browsable at `/skills` (the **Skill Library** page — registered `enabled: false`, so it shows only with Developing-tools mode on).

```ts
interface SkillDef {
  id: string;           // kebab-case, referenced by [[id|term]] markers; variants use <base>-<method>
  title: string;        // variants of one skill share the SAME title — /skills groups on it
  method?: string;      // variant label when a skill has multiple methods, e.g. "From times tables"
  description: string;  // one sentence, shown on the Skill Library card
  category: string;     // landing-page strand name (Number, Algebra, …)
  slides: TeachingSlide[];   // same slide types as the Teach deck
}
```

**While the library is on the back bench** (`docs/BACKBENCH.md`) the `[[skill-id|term]]` markers render as plain text unless Developing-tools mode is on, and the smoke tests still fail on a marker whose id is not in `SKILLS`. The authoring rules (variants, adding a skill, exemplars, the existing skills) are kept in `docs/BACKBENCH.md` → "Authoring a skill" for when the library resumes. Two skills exist: `lcm` and `lcm-prime-factors`.

CI (`src/tests/skills.test.ts`) validates every skill: unique kebab-case ids, every KaTeX string renders, anim slides never supply more captions than beats. <!-- ref -->

---
