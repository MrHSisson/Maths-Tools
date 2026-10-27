# Question Options, difficulty and calibration

**Read when:** Writing `TOOL_CONFIG`: option types, pools, per-level settings, calibrating a tool, balanced pools.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

---

## TOOL_CONFIG format

```ts
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Displayed at top of page",
  tools: {

    subtool1: {
      name: "Button label",
      instruction: "Solve:",          // optional — shown above question in all modes

      variables: [],                  // toggle switches — prefer multiSelect instead
      dropdown: null,                 // single-select segmented buttons, or null
      multiSelect: {                  // default QO control — reach for this first
        key: "questionPool",
        label: "Question Types",
        options: [
          { value: "a", label: "Type A", defaultActive: true  },
          { value: "b", label: "Type B", defaultActive: true  },
          { value: "c", label: "Type C", defaultActive: false },
        ],
      },
      difficultySettings: null,       // null = same options at all levels
      levels: ["level1", "level2"],   // optional — omit for all three (see `levels` below)
      // purpose and levelLabels are written in <Tool>.about.ts (applyAbout), not here
    },

  },
};
```

### QO control types

| Control | When to use |
|---------|------------|
| `multiSelect` | **Default.** Pool of question types, multiple can be active. Use `pickActive(values, options)` in the generator. |
| `dropdown` | A single mutually-exclusive setting (e.g. method choice, display format). |
| `variables` | Independent on/off toggles. Use sparingly — prefer `multiSelect`. |

**The deciding test between `multiSelect` and `variables` is mutual exclusivity, not difficulty.**
A `multiSelect` pool is for any option set where exactly **one** member applies to a given
question — the generator draws one active option per question via `pickActive`, rendered as the
same row-of-cells UI either way. That covers pure variety (Units: mph vs km/h vs m/s) *and* an
ordinal difficulty ladder (easiest rung `defaultActive: true`; the worksheet's easy-to-hard order
comes from calibrating the tool, see below, never from the options) — difficulty-vs-variety doesn't <!-- R19 -->
decide the control type. A `ToolVariable` (boolean toggle) is for a
property that's genuinely **independent** — switching it on doesn't replace anything, and if
several such toggles are on at once, **all of them apply to the same question simultaneously**
(rare, but real — e.g. "allow negative coefficients" and "allow non-integer constants" both true
on one question, stacking rather than choosing between them).

**Before converting a boolean into a multiSelect ladder, check combinability first.** If the
property can stack with a sibling property on one question, it must stay independent — either as <!-- R19 -->
its own `ToolVariable`, or as its own separate multiSelect pool — never merged into the same pool <!-- R19 -->
as something it can coexist with, since a pool only ever picks **one** of its options per
question. Model a genuinely ordinal, mutually-exclusive option set as one pool (easiest rung
`defaultActive: true`, harder rungs `false`) rather than a standalone toggle.

**Even a plain on/off property becomes a 2-option pool, not a boolean, once it's mutually
exclusive per question.** A boolean toggle only ever applies to the *whole worksheet* — "negative
coefficients" as `allowNegative: boolean` means every question can potentially get one, or none
ever do; there's no way for question 3 specifically to draw "non-negative" while question 9 draws
"negative". If that per-question distinction is what you actually want (e.g. a quadratic tool
where non-negative coefficients are the easier case), it's a 2-option `multiSelect` pool —
`{ value: "nonNegative" }` / `{ value: "negative" }` — exactly like a 3+
option ladder, just with two rungs. Expect this to come up often: **most existing boolean QO
options that gate a per-question property will turn into 2-option pools** once they're audited
against the mutual-exclusivity test, not just the ones that already had 3+ named states like SDT's
Times Tables.

**Pool size.** At its default options every level of a tool needs enough different questions to fill a 30-question worksheet; `src/tests/recentQuestions.test.ts` checks it, comparing questions by content (the words, the answer, the text drawn on the picture), not by `key`. A level whose pool is smaller than a sheet needs a wider range, not an exception. <!-- ref -->

**Question-option buttons are one look everywhere (`OptionGrid`, `src/shared/components/QOPopovers.tsx`).** Every pool and dropdown in a QO popover — ToolShell and DecisionShell alike — is drawn as well-spaced single buttons: four to a row when the (short) labels fit the popover width, three if not, otherwise two (a short last row is centred; any option with a `sub` line keeps two to a row). Keep each label short so the powers/groups of a pool sit on one row, and put any detail in the option's `sub` (a smaller line under the label) rather than a long label. A 2-option pool is just two buttons (the old None / Mixed / Exclusive cycle button is gone). A popover with more than four sections and no tabs splits automatically into two columns with a thin grey divider (the Split QO layout; the Decision popover does the same); a tabbed popover stays one narrow column. DecisionShell options may also be `multi` (tick-any; see `ShellOption.multi`) and take `choices[].sub`. **A label that ends in an asterisk marks something beyond standard questioning** (off by default): the standard, inline and differentiated popovers then show "* beyond standard questioning" at the bottom automatically — end the label with `*`, nothing else to wire. A selector with a single option is never shown. A question's `key` describes the question (never a random number); the repeat check compares content, so the key does not decide it. <!-- R2 R21 -->

**Tabs in the options popover (`tab` on every group).** Each `ToolDropdown`, `ToolMultiSelect` and `ToolVariable` takes `tab: "questions" | "numbers" | "method" | "display"` (what is asked · the numbers used · how it is worked, its pictures, hints and scaffolds · how it is written, its notation, wording, answer format and diagram display), and every group on every tool carries one (`src/tests/qoTabs.test.ts`). Groups are listed in that order on every tool. How the popover (standard, differentiated and the phone / worksheet panel) shows them depends on the level's number of choices (`qoLayout`, `src/shared/components/QOPopovers.tsx`): **more than 8** → small pill tabs, one tab at a time, one narrow column; **5 to 8 over three or more groups** → the tab names as small headers over their groups (left out when a tab's only group has the same name); **fewer** → the groups in tab order with nothing added. Groups that all sit on one tab get neither tabs nor headers, so a level above 8 choices has to spread over at least two tabs (the test checks it). A `requires` can still name an option on another tab. Shared groups carry their own tab (`PV_WORD_HEADERS_VAR` is Display, `PV_TABLE_START_DD` is Method). In a config written inline, type the literal: `tab: "numbers" as const`.

**Rungs must be mutually exclusive, not overlapping caps, and any "harder" property must be <!-- R26 -->
guaranteed, not just more likely.** An "up to 20" rung that silently includes every "up to 10"
value too doesn't read as strictly harder than the rung below it — give each rung its own disjoint
range (e.g. a scale factor drawn from 11-20, not 1-20) instead of a rising single-sided cap. Same
for a qualitative property like "the answer is a decimal": if the underlying generation only makes
a decimal *possible* (e.g. ~80% of draws), a chunk of that rung's questions render indistinguishably
from the easier rungs on a printed sheet — find the exact mathematical condition that produces the
property and reject/retry any draw that fails it (see `SpeedDistanceTime.tsx`'s
the decimals rung's draw in `SpeedDistanceTime.tsx` (`TABLES_TIER` / `decimalsMode`): `D` is only ever whole when the drawn speed is a multiple of the shape's
`pp`, so rejecting that one case guarantees every decimals-tier answer is a genuine decimal).
Reference: `DIFFICULTY_TIER` in `src/tools/Proportion/SpeedDistanceTime.tsx`.

**Group labels are one vocabulary** (the heading over a pool or dropdown; `src/tests/levelLabels.test.ts` enforces it): Title Case ("Question Types", "Working Shown", "Ask for"); a pool you can tick several of is plural; one spelling per label across the site; and one word per idea: "Method" (how it is worked), "Working Shown" (how much working), "Answer Format" (how the answer is written), "Ask for" (what the question asks for, never "Find" or "Ask"). <!-- R20 -->

**Peer pools.** Two options that are *peers* (Factorised / Expanded, Whole / Fractions, Numbers / Letters) are ordinary buttons like every other pool; keep labels short (detail goes in the info or the option's `sub`), and never offer a control with a single option. See `docs/design/LESSONS.md` §4. <!-- R21 -->

**`exclusive: true` — a single-choice pool.** Set it on a `ToolMultiSelect` when its options are mutually exclusive settings, not a mixable pool (e.g. "labelled line" vs "every mark"): picking one option turns the others off (radio behaviour) and the generator's `pickActive` always sees exactly one. Use it instead of a `dropdown` when a level already uses its one dropdown slot, or when several such choices sit side by side. Give exactly one option `defaultActive: true`. Reference: the label / fill-in / plot pools in `src/tools/Number/Rounding.tsx`. <!-- R22 -->

**`requires` on a multiSelect option — greyed out unless other options are on.** An option may list `requires: [clause, …]`; every clause must hold, a clause being an option `value` from any pool of the same sub-tool + level, or an array of values of which at least one is on (same shape as `DepthItem.needs`). While unmet the option is greyed, struck through and unclickable, with a "Needs × or ÷ and + or −" tooltip; the teacher's own tick is kept and returns when the requirement is met. The popover does this by itself; the *generator* must also ignore a blocked option: `pickActive(maskUnmetOptions(pools, resolveMultiSelectValues(pools, msv)), options)` (a pool is never emptied by the mask, so keep a fallback). Reference: Order of Operations' Level 1 Focus vs its Operations pool. <!-- R23 -->

**`dropdown.workedExampleOnly`** — set this `true` only when the dropdown changes nothing but
the displayed working (a "Method" choice like Ratio Table vs Decimal, or FOIL vs Grid arrows) —
the question and answer are identical across every option. ToolShell then hides it from the
Worksheet mode QO popover (standard and differentiated), where it would have no visible effect,
while still showing it in Whiteboard and Worked Example mode. Never set it on a dropdown that <!-- R24 -->
changes the question's numbers, structure, or answer (e.g. a method that also changes the
coefficient sizes) — those must stay visible in Worksheet mode. <!-- R24 -->

**`ToolVariable` extras** — `worksheetOnly` (only offered in Worksheet mode), `info` (the switch's explainer, shown in "About this tool" and the level pop-up, never beside the switch) and `capsColumns: n` (while on, worksheet columns are limited to n — on screen, in the Columns input and in print ctx — so the worksheet matches what prints). Reference: the "Grids on worksheet" switch in `src/tools/Number/DecimalAddSub.tsx`. <!-- R11 -->

### `difficultySettings` — per-level QO overrides

```ts
difficultySettings: {
  level1: { variables: [], dropdown: null },
  level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
  level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
}
```

Each level independently overrides `dropdown`, `variables`, and/or `multiSelect`. Omitted keys inherit the tool-level default.

### Calibrating a tool — the one way a worksheet is ordered easy to hard

There are no option weights. An option can't tell two questions from the same option apart, so once a tool is happy we **calibrate** it (`src/shared/calibration.ts`, pilot: `src/tools/Number/OrderOfOperations.tsx`; every calibrated tool has a committed `<Tool>.calibration.ts` and a report in `docs/calibration/`):

1. **Score the question.** Each generated question carries `_rawDifficulty` (cost computed from the question itself — the steps of its working, the size of its numbers, its structure — never from the option that made it), `_category` (a coarse fingerprint for the report) and `_difficultyScore: bandFromTable(BANDS, subTool, level, raw)`. `largestNumber(text)` (shared) helps with "size of the numbers". Put the rubric in a `rank(...)` function beside the generator and explain it in a comment. <!-- R25 -->
2. **Say so.** Set `calibrated: true` on the `ToolConfig` (it makes the Worksheet show the **Smart Progressor** switch, and the tool's test checks it).
3. **Test and sample.** The tool's test file calls `calibrationTests({ name, config, generate, bands, tableFile, reportFile, regenerate, rubric })` from `src/tests/calibrationKit.ts` (copy `src/tests/decimalAddSubDifficulty.test.ts`): it checks the table, that every question carries its score and band, and that a fresh 1000+ sample uses the bands sensibly. `CALIBRATE=1 npx vitest run <test file>` samples 1500 questions per **sub-tool × level** across *random combinations of all its options* (`randomSetup`), cuts each cell into eight bands (`quantileCuts`) and rewrites `<Tool>.calibration.ts` and the report (run it twice the first time: the first run writes the table the other tests then read).
4. **Use — generate extra, then pick.** For a calibrated tool the standard Worksheet tab generates a pool of candidates (8× the question count, 60–400) and `spreadByBand` picks n spread as evenly as possible across the bands the ticked options can reach (a short band hands its slots on), sorted easy→hard, same-band questions mingling. Wired once in ToolShell (`calibratedBlock`); the Smart Progressor switch turns it off. Standard and differentiated worksheets only — the advanced builder never comes through here. Recalibrate after any generator change (the test fails when a fresh sample no longer fits the table). <!-- ref -->

A level that has only a few kinds of question (one fixed shape) gets few distinct scores; that is honest, and the test allows for it.

### Balanced pools — a variety pool kept even on a worksheet

Set `balanced: true` on a `ToolMultiSelect` (not on difficulty) when a short sheet shouldn't be left to chance: a Speed / Distance / Time mix, the kinds of zero in Rounding. `pickActive`'s per-question random draw can land 9/4/2 over 15 questions; `ToolShell` (`buildQuotaOverrides`, internal) builds one `multiSelectValues` override per slot, drawn independently at random but retried until every active option's count is within ±1 of its fair share (6/5/4 is a normal outcome). Pools without the flag keep varying randomly. It applies to calibrated and uncalibrated tools alike on the standard Worksheet tab, and follows the same **Smart Progressor** switch (off = plain random draws). Nothing else to wire.

---
