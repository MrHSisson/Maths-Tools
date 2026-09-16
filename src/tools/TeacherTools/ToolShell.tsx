// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SHELL — template for new tools
//
// To create a new tool from this template:
//   1. Copy this file to src/tools/<Category>/<ToolName>.tsx
//   2. Replace ToolType, TOOL_CONFIG, INFO_SECTIONS, and generateQuestion
//   3. Add one entry to src/registry.ts — the route and landing-page card
//      are generated from it automatically
//
// Everything BELOW the tool-specific section is provided by src/shared/ToolShell.tsx
// and requires no modification. Shell improvements flow to all tools automatically.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type TeachingSlide,
  type ToolMultiSelect,
  randInt, pick, step, tStep, mStep, fracStr, mStr, pickActive, fmt, weightOf,
} from "../../shared";
import { getDevMode, useDevMode } from "../../devMode";

// ── NAVIGATION ────────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button — no React Router.
// ─────────────────────────────────────────────────────────────────────────────

// ── KATEX RENDERING RULES ────────────────────────────────────────────────────
//
//   Prose words only (no numbers/operators) → plain text
//   Everything else → KaTeX:
//
//   Numbers in prose     → mStr(n)          e.g. "weighs " + mStr(16) + " kg"
//   Fractions in prose   → fracStr(n,d)     e.g. fracStr(3,4) + " of the bag"
//   Pure maths step      → step(latex)      e.g. step("16 \\div 8 = 2")
//   Prose label + maths  → mStep(label, latex)
//   Genuinely numberless prose step → tStep(text)  (rare)
//
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION — REPLACE EVERYTHING IN THIS BLOCK FOR EACH NEW TOOL
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "tool1" | "tool2" | "tool3"; // ← one per key in TOOL_CONFIG.tools

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────
//
// Each tool entry drives the QO popovers and worksheet cells automatically.
//
// Fields:
//   name              — button label
//   instruction?      — prompt above the question ("Solve:", "Simplify:", etc.)
//   variables         — toggle switches: [{ key, label, defaultValue }]
//   dropdown          — segmented selector: { key, label, options, defaultValue }
//   multiSelect?      — multi-toggle pool: { key, label, options }
//   difficultySettings — per-level overrides for dropdown/variables/multiSelect

const QUESTION_TYPES_MS: ToolMultiSelect = {
  key: "questionPool",
  label: "Question Types",
  options: [
    { value: "typeX", label: "Type X", defaultActive: true  },
    { value: "typeY", label: "Type Y", defaultActive: true  },
    { value: "typeZ", label: "Type Z", defaultActive: false },
  ],
};

// ── DEV-GATED SMART PROGRESSOR DEMO ──────────────────────────────────────────
// Reference pattern for a weighted, mutually-exclusive 2-option pool (see
// CLAUDE.md → "QO control types" and "Smart Progressor"). Because BOTH
// options carry a `weight`, ToolShell's QO popovers render this as one
// compact click-to-cycle button (None → Mixed → Exclusive) instead of a
// full pill row — see CycleSelect in shared/components/QOPopovers.tsx — and
// the worksheet automatically sorts/roughly-balances by it, no extra wiring
// needed beyond generateQuestion reading the picked value (below). TWO such
// pools are defined here specifically so the popover shows them sitting
// inline side by side (each button is only as wide as its own label/state
// text) rather than stacking full-width blocks.
//
// Kept dev-gated (behind Developing-tools mode) here because it's a template
// illustration, not a real question axis for this stub tool — copy the
// pattern into a real tool's TOOL_CONFIG/generateQuestion and drop the
// getDevMode()/useDevMode() gating once it's a genuine feature, not a demo.
const NEGATIVE_COEFFS_DEMO: ToolMultiSelect = {
  key: "negCoeffDemo", label: "Negatives (demo)",
  options: [
    { value: "nonNegative", label: "Non-negative", defaultActive: true,  weight: 1 },
    { value: "negative",    label: "Negative",      defaultActive: false, weight: 2 },
  ],
};

const BIGGER_NUMBERS_DEMO: ToolMultiSelect = {
  key: "biggerNumbersDemo", label: "Bigger nums (demo)",
  options: [
    { value: "small", label: "Small", defaultActive: true,  weight: 1 },
    { value: "big",   label: "Big",   defaultActive: false, weight: 2 },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Tool Name",

  tools: {

    // Tool 1: toggle switches + multiSelect pool
    tool1: {
      name: "Sub-Tool 1",
      variables: [
        { key: "option1", label: "Option A", defaultValue: false },
        { key: "option2", label: "Option B", defaultValue: false },
      ],
      dropdown: null,
      multiSelect: QUESTION_TYPES_MS,
      difficultySettings: null,
    },

    // Tool 2: worded questions with dropdown
    tool2: {
      name: "Sub-Tool 2",
      variables: [
        { key: "includeExtra", label: "Include extras", defaultValue: false },
      ],
      dropdown: {
        key: "questionType",
        label: "Question Type",
        useTwoLineButtons: true,
        options: [
          { value: "typeA", label: "Type A", sub: "Straightforward" },
          { value: "typeB", label: "Type B", sub: "In context"      },
          { value: "typeC", label: "Type C", sub: "Mixed"           },
        ],
        defaultValue: "typeA",
      },
      difficultySettings: null,
    },

    // Tool 3: per-level difficultySettings (dropdown/variables vary by level)
    tool3: {
      name: "Sub-Tool 3",
      instruction: "Solve:",
      variables: [],
      dropdown: {
        key: "method",
        label: "Method",
        useTwoLineButtons: false,
        options: [
          { value: "method1", label: "Method 1" },
          { value: "method2", label: "Method 2" },
          { value: "method3", label: "Method 3" },
        ],
        defaultValue: "method1",
      },
      difficultySettings: {
        level1: {
          dropdown: {
            key: "method", label: "Method", useTwoLineButtons: false,
            options: [{ value: "method1", label: "Method 1 (only)" }],
            defaultValue: "method1",
          },
          variables: [],
        },
        level2: {
          dropdown: {
            key: "method", label: "Method", useTwoLineButtons: false,
            options: [
              { value: "method1", label: "Method 1" },
              { value: "method2", label: "Method 2" },
            ],
            defaultValue: "method1",
          },
          variables: [
            { key: "showHint", label: "Show hint", defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "method", label: "Method", useTwoLineButtons: false,
            options: [
              { value: "method1", label: "Method 1" },
              { value: "method2", label: "Method 2" },
              { value: "method3", label: "Advanced"  },
            ],
            defaultValue: "method1",
          },
          variables: [
            { key: "showHint",       label: "Show hint",       defaultValue: false },
            { key: "extraChallenge", label: "Extra challenge",  defaultValue: false },
          ],
        },
      },
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Sub-Tool 1", icon: "📐", content: [
    { label: "Overview",         detail: "Describe what Sub-Tool 1 does." },
    { label: "Level 1 — Green",  detail: "Describe Level 1 questions." },
    { label: "Level 2 — Yellow", detail: "Describe Level 2 questions." },
    { label: "Level 3 — Red",    detail: "Describe Level 3 questions." },
  ]},
  { title: "Sub-Tool 2", icon: "➕", content: [
    { label: "Overview",         detail: "Describe what Sub-Tool 2 does." },
    { label: "Type A",           detail: "Describe Type A questions." },
    { label: "Type B",           detail: "Describe Type B questions." },
    { label: "Type C",           detail: "Describe Type C questions." },
  ]},
  { title: "Sub-Tool 3", icon: "🔢", content: [
    { label: "Overview",         detail: "Describe what Sub-Tool 3 does." },
    { label: "Level 1 — Green",  detail: "Method 1 only." },
    { label: "Level 2 — Yellow", detail: "Methods 1 & 2 with optional hint." },
    { label: "Level 3 — Red",    detail: "All three methods including Advanced." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "Grid of questions with PDF export." },
    { label: "Teach",          detail: "Optional slide deck of key ideas (only appears when the tool provides teachingSlides)." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Dropdowns",    detail: "Select the question style or method for the active tool and level." },
    { label: "Toggles",      detail: "Level-specific options such as hints or extra challenge." },
    { label: "Differentiated", detail: "QO popover shows all three levels so each column can be customised independently." },
  ]},
];

// ── 4. Question interface ─────────────────────────────────────────────────────
//
// Question kinds (import AnyQuestion, SimpleQuestion, WordedQuestion from shared):
//   "simple"  → { display, displayLatex?, answer, answerLatex?, answerSuffix?, working[], key, difficulty }
//   "worded"  → { lines[], answer, answerLatex?, answerSuffix?, working[], key, difficulty }
//   working[] → use step(), tStep(), mStep() from shared helpers
//
// ── 5. Helpers (imported above) ───────────────────────────────────────────────
//
//   randInt(min, max)          → random integer
//   pick(arr)                  → random element
//   fracStr(n, d)              → "$\frac{n}{d}$" for InlineMath
//   mStr(x)                    → "$x$" wraps a number/expression for InlineMath
//   pickActive(values, options) → random active multiSelect value
//   step(latex)                → pure KaTeX working step
//   tStep(text)                → plain text working step (prose only)
//   mStep(label, latex, unit?) → prose label + KaTeX
//   fmt(n, dp?)                → number to string, trailing zeros stripped

// ── 6. Question generator ─────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  const id = Math.floor(Math.random() * 1_000_000);

  // ── Tool 1: simple kind ──────────────────────────────────────────────────
  if (t === "tool1") {
    let a = randInt(1, 9);
    let b = randInt(1, 9);
    // DEV-GATED SMART PROGRESSOR DEMO — see NEGATIVE_COEFFS_DEMO's comment
    // above and App()'s devMode-conditional config merge below. getDevMode()
    // (not the reactive hook — this is a plain function, called fresh on
    // every generation) gates reading the demo axes at all: with the groups
    // absent from config (devMode off), pickActive would otherwise treat
    // both options as "active" by default (neither key is in
    // multiSelectValues), so this check keeps the demo fully inert when off.
    // Two independent weighted axes combine by summing their weightOf() —
    // a simple, defensible choice; a real tool would decide this per case.
    let difficultyScore: number | undefined;
    if (getDevMode()) {
      const negTier = pickActive(multiSelectValues, NEGATIVE_COEFFS_DEMO.options);
      const sizeTier = pickActive(multiSelectValues, BIGGER_NUMBERS_DEMO.options);
      if (sizeTier === "big") { a += 10; b += 10; }
      if (negTier === "negative") b = -b;
      difficultyScore = weightOf(NEGATIVE_COEFFS_DEMO.options, negTier) + weightOf(BIGGER_NUMBERS_DEMO.options, sizeTier);
    }
    const sumLatex = b < 0 ? `${a} - ${Math.abs(b)}` : `${a} + ${b}`;
    const sum = a + b;
    const q: AnyQuestion = {
      kind: "simple",
      display: sumLatex,
      displayLatex: sumLatex,
      answer: `${sum}`,
      answerLatex: `${sum}`,
      working: [step(`${sumLatex} = ${sum}`)],
      key: `t1-${level}-${a}-${b}-${id}`,
      difficulty: level,
    };
    return difficultyScore === undefined ? q : ({ ...q, _difficultyScore: difficultyScore } as unknown as AnyQuestion);
  }

  // ── Tool 2: worded kind ──────────────────────────────────────────────────
  if (t === "tool2") {
    const d = pick([2, 3, 4, 5, 6, 8, 10]);
    const k = randInt(2, 12);
    const amount = d * k;
    const numer = level === "level1" ? 1 : randInt(2, d - 1);
    const answerVal = (numer * amount) / d;
    return {
      kind: "worded",
      lines: [
        `A bag of flour weighs ${mStr(amount)} kg.`,
        `A recipe needs ${fracStr(numer, d)} of the bag.`,
        "How many kg is that?",
      ],
      answer: `${answerVal} kg`,
      answerLatex: `${answerVal}`,
      answerSuffix: "kg",
      working: [
        mStep("Divide by the denominator:", `${amount} \\div ${d} = ${amount / d}`),
        mStep("Multiply by the numerator:", `${amount / d} \\times ${numer} = ${answerVal}`),
        mStep("Answer:", `${answerVal}`, "kg"),
      ],
      key: `t2-${level}-${d}-${k}-${numer}-${id}`,
      difficulty: level,
    };
  }

  // ── Tool 3: simple kind with instruction ─────────────────────────────────
  const a = randInt(1, 9), b = randInt(1, 9);
  return {
    kind: "simple",
    display: `${a} × ${b}`,
    displayLatex: `${a} \\times ${b}`,
    answer: `${a * b}`,
    answerLatex: `${a * b}`,
    working: [step(`${a} \\times ${b} = ${a * b}`)],
    key: `t3-${level}-${a}-${b}-${id}`,
    difficulty: level,
  };
};

// Worksheet uniqueness is automatic — ToolShell wraps generateQuestion with the
// standard retry-until-unique loop. No generateUniqueQ needed.

// ── 7. TEACHING SLIDES (optional) ─────────────────────────────────────────────
//
// Pass `teachingSlides` to ToolShell to add a "Teach" tab. The teacher first
// picks a category (Concepts / True or False / Spot the Mistake), then presses
// through that category's slides one beat at a time (→ / space / click; ← steps
// back; Esc back to the menu). Omit the prop and no Teach tab appears.
//
// Every slide has a `category: "concept" | "trueFalse" | "spotMistake"` and an
// optional `phase: "iDo" | "weDo" | "youDo"` (corner badge). Empty categories
// show as "Coming soon". Keep `title` a short TOPIC — the changing caption is the
// voice. Slides are hand-authored, misconception-driven (no generators). Two kinds:
//
//   static (default) — body blocks + one optional `reveal` (press to reveal):
//     block types: { t:"text", s } (｢$...$｣ inline maths, **bold**),
//                  { t:"math", s }, { t:"bars", bars:[{num,den,label?}] },
//                  { t:"verdict", value:boolean },
//                  { t:"note", tone?:"good"|"bad"|"plain", label?, s }  (no emoji)
//
//   anim — a scene choreographed across several beats, one caption per beat:
//     { type:"split", num, den, factor, shadeByOne?, predict? }  cuts one piece per press
//     { type:"equivalents", num, den, factors:number[] }         reveals one ×factor equivalent per beat
//     { type:"combine", a, b, sumLabel }                         two shaded bars flow into one
//   (beat count is derived from the scene — supply that many captions.)
//   Full authoring guide: CLAUDE.md → "Teaching slides".
//
// Delete this constant (and the teachingSlides prop below) if your tool has no deck.

const TEACHING_SLIDES: TeachingSlide[] = [
  {
    kind: "anim", category: "concept", phase: "iDo",
    title: "Equivalent fractions",
    scene: { type: "split", num: 1, den: 2, factor: 2 },
    steps: [
      "Here is $\\dfrac{1}{2}$.",
      "Split the first half…",
      "…and the second half.",
      "Now it's $\\dfrac{2}{4}$ — the shaded amount hasn't changed.",
    ],
  },
  {
    kind: "anim", category: "concept", phase: "youDo",
    title: "Equivalent fractions",
    scene: { type: "equivalents", num: 1, den: 2, factors: [2, 3, 4, 5] },
    steps: [
      "Find two fractions equal to $\\dfrac{1}{2}$ — write two down first.",
      "Splitting into 2 gives one…",
      "…into 3, another…",
      "…into 4…",
      "…into 5. Any two are correct.",
    ],
  },
  {
    // Title is the TOPIC; the statement being judged goes in a prominent body block.
    category: "trueFalse", phase: "youDo",
    title: "True or false?",
    body: [
      { t: "math", s: "2 + 3 = 6" },
      { t: "text", s: "Decide before you reveal." },
    ],
    reveal: [
      { t: "verdict", value: false },
      { t: "note", tone: "good", label: "Correct", s: "$2 + 3 = 5$." },
    ],
    revealLabel: "Reveal",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// Suppress unused import warnings for helpers that aren't used in the stub generator.
void (tStep as unknown); void (fmt as unknown);

// Exposes internals to the generator smoke-test suite (src/tests/generators.test.ts).
// Every tool must export this. Add `levels: ["level1", "level2"]` if some levels
// are coming soon.
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  // Reactive (useDevMode, not the plain getDevMode() used inside
  // generateQuestion above) so toggling Developing-tools mode and coming
  // back to this page — no hard reload needed — shows/hides the demo pool
  // correctly. TOOL_CONFIG itself stays a plain module constant; only this
  // one sub-tool's multiSelect is overridden per render.
  const devMode = useDevMode();
  const config: ToolConfig = !devMode ? TOOL_CONFIG : {
    ...TOOL_CONFIG,
    tools: {
      ...TOOL_CONFIG.tools,
      tool1: { ...TOOL_CONFIG.tools.tool1, multiSelect: [QUESTION_TYPES_MS, NEGATIVE_COEFFS_DEMO, BIGGER_NUMBERS_DEMO] },
    },
  };
  return (
    <ToolShell
      config={config}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      teachingSlides={TEACHING_SLIDES}
    />
  );
}
