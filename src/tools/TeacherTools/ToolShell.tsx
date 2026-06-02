// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SHELL — template for new tools
//
// To create a new tool from this template:
//   1. Copy this file to src/tools/<Category>/<ToolName>.tsx
//   2. Replace ToolType, TOOL_CONFIG, INFO_SECTIONS, and generateQuestion
//   3. Register the route in src/App.tsx and the card in src/components/LandingPage.tsx
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
  randInt, pick, step, tStep, mStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";

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
      multiSelect: {
        key: "questionPool",
        label: "Question Types",
        options: [
          { value: "typeX", label: "Type X", defaultActive: true  },
          { value: "typeY", label: "Type Y", defaultActive: true  },
          { value: "typeZ", label: "Type Z", defaultActive: false },
        ],
      },
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
  _multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  const id = Math.floor(Math.random() * 1_000_000);

  // ── Tool 1: simple kind ──────────────────────────────────────────────────
  if (t === "tool1") {
    const a = randInt(1, 9), b = randInt(1, 9);
    return {
      kind: "simple",
      display: `${a} + ${b}`,
      displayLatex: `${a} + ${b}`,
      answer: `${a + b}`,
      answerLatex: `${a + b}`,
      working: [step(`${a} + ${b} = ${a + b}`)],
      key: `t1-${level}-${a}-${b}-${id}`,
      difficulty: level,
    };
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

// ── 7. generateUniqueQ ────────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// Suppress unused import warnings for helpers that aren't used in the stub generator.
void (tStep as unknown); void (fmt as unknown); void (pickActive as unknown);

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
    />
  );
}
