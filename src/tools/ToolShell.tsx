import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── ROUTING NOTE ─────────────────────────────────────────────────────────────
// To add navigation in production (Vercel deployment):
//   1. Import the navigate hook from your routing library
//   2. Call it inside App() to get a navigate function
//   3. Change the Home button onClick to call navigate("/")
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX — loaded once from CDN, injected into page head
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || w().katex) { resolve(); return; }
      // CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
      // JS
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

// ── Math render component ─────────────────────────────────────────────────────
//
// KATEX GOTCHAS — read before implementing a new tool:
//
//   1. KaTeX renders its content at 1.21em internally. To match surrounding text,
//      the container is set to fontSize: 0.826em (= 1/1.21) for non-fraction
//      expressions. Fractions use 1em — their internal scaling looks correct as-is.
//
//   2. verticalAlign must be "baseline" not "middle". KaTeX spans set to "middle"
//      drop below the text baseline, making numbers appear lower than prose.
//
//   3. displayMode is always false. If you want an expression on its own line,
//      wrap <MathRenderer> in a <div>. Never use displayMode: true.
//
//   4. In print CSS, set font-size on .katex-render .katex (the inner KaTeX span),
//      not on .katex-render itself — otherwise KaTeX compounds the scaling.
//
//   5. Ratios in prose: use mStr("3:4") — no spaces around the colon.
//      KaTeX renders "3:4" correctly. "3 : 4" adds operator spacing.
//

interface MathProps {
  latex: string;
  style?: CSSProperties;
  className?: string;
}

const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);

  useEffect(() => {
    loadKaTeX().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      w().katex.render(latex, ref.current, {
        displayMode: false,   // always inline — separate lines handled by wrapping div
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, ready]);

  const hasFrac = latex.includes("\\frac");
  return <span ref={ref} className={className} style={{display:"inline", verticalAlign:"baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style}} />;
};

// ── Popover hook & button — available to QO popovers in the tool section ──────

const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open?"bg-blue-900 border-blue-900 text-white":"bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
  </button>
);

// Also available in tool section: TogglePill, SegButtons, LV_LABELS, LV_HEADER_COLORS

const LV_LABELS:Record<string,string> = {level1:"Level 1",level2:"Level 2",level3:"Level 3"};
const LV_HEADER_COLORS:Record<string,string> = {level1:"text-green-600",level2:"text-yellow-500",level3:"text-red-600"};

// TogglePill and SegButtons are available for use in tool-specific QO popovers.
// They are defined here so they are in scope for the tool section above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TogglePill = ({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={()=>onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked?"bg-blue-900":"bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?"translate-x-7":"translate-x-1"}`}/>
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SegButtons = ({value,onChange,opts}:{value:string;onChange:(v:string)=>void;opts:{value:string;label:string}[]}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt=>(
      <button key={opt.value} onClick={()=>onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// TOOL-SPECIFIC SECTION — REPLACE EVERYTHING IN THIS BLOCK FOR EACH NEW TOOL
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════
//
// This section defines:
//   1. ToolType & DifficultyLevel — string union types
//   2. TOOL_CONFIG — drives QO popovers, tool names, and cell style automatically
//   3. INFO_SECTIONS — content for the info modal
//   4. AnyQuestion — question interface(s) for this tool
//   5. Question generators — one per tool, covering all levels
//   6. generateUniqueQ — deduplication wrapper
//
// ── HOW TOOL_CONFIG DRIVES THE QO POPOVER ────────────────────────────────────
//
// Each tool entry in TOOL_CONFIG.tools can have:
//
//   name: string
//     — displayed as the sub-tool button label
//
//   useSubstantialBoxes: boolean
//     — true  = card-style cells with padding and shadow (good for multi-line)
//     — false = compact cells (good for short single-line questions)
//
//   variables: [{ key, label, defaultValue: boolean }, ...]
//     — renders as toggle switches in the QO popover
//     — received in generateQuestion as: variables[key]
//
//   dropdown: { key, label, options: [{value, label, sub?}], defaultValue,
//               useTwoLineButtons? } | null
//     — renders as a segmented button selector in the QO popover
//     — received in generateQuestion as: dropdownValue
//     — useTwoLineButtons: true shows label + sub on two lines per button
//
//   difficultySettings: { level1, level2, level3 } | null
//     — if set, each level can override the dropdown and/or variables
//     — the QO popover shows per-level sections in differentiated mode
//     — if null, the same options apply at every level
//
// ── WHAT THE SHELL CALLS ─────────────────────────────────────────────────────
//
//   generateQuestion(tool, level, variables, dropdownValue) → AnyQuestion
//     Called for whiteboard/worked example (one question at a time).
//
//   generateUniqueQ(tool, level, variables, dropdownValue, usedKeys) → AnyQuestion
//     Called for worksheet generation. usedKeys prevents duplicates.
//
// ── QUESTION KINDS ───────────────────────────────────────────────────────────
//
//   "simple"  → { display, answer, answerLatex? }
//   "frac"    → { latex, answerLatex }   displayed as: Find [fraction] of [n]
//   "worded"  → { lines[], answer, answerLatex? }   multi-line with InlineMath
//   "asFrac"  → { lines[], answer, answerLatex }    same, answerLatex required
//   All kinds require: kind, key, difficulty, working[]
//
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "tool1" | "tool2" | "tool3"; // ← one per key in TOOL_CONFIG.tools
type DifficultyLevel = "level1" | "level2" | "level3";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG = {
  pageTitle: "Tool Name",

  tools: {

    // Tool 1: two toggle switches, no dropdown, compact cells
    tool1: {
      name: "Sub-Tool 1",
      useSubstantialBoxes: false,
      variables: [
        { key: "option1", label: "Option A", defaultValue: false },
        { key: "option2", label: "Option B", defaultValue: false },
      ],
      dropdown: null,
      difficultySettings: null,
    },

    // Tool 2: worded questions — demonstrates plain text + KaTeX rendering contract.
    // Lines are rendered via InlineMath: prose is plain text, maths is in $...$
    tool2: {
      name: "Sub-Tool 2",
      useSubstantialBoxes: true,
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

    // Tool 3: difficultySettings — dropdown options and toggles vary per level.
    // In differentiated mode the QO popover shows all three levels with their
    // own options independently.
    tool3: {
      name: "Sub-Tool 3",
      // instruction: optional prompt shown above the question in all modes.
      // Scales at 0.8× the display/worksheet font size. Omit or set to ""
      // to disable for a tool. e.g. "Simplify:", "Solve:", "Find the value of:"
      instruction: "Solve:",
      useSubstantialBoxes: false,
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
            { key: "showHint",       label: "Show hint",         defaultValue: false },
            { key: "extraChallenge", label: "Extra challenge",   defaultValue: false },
          ],
        },
      },
    },

  } as Record<string, {
    name: string;
    instruction?: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: {
      key: string; label: string; useTwoLineButtons?: boolean;
      options: { value: string; label: string; sub?: string }[];
      defaultValue: string;
    } | null;
    difficultySettings: Record<string, {
      dropdown?: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
      variables?: { key: string; label: string; defaultValue: boolean }[];
    }> | null;
  }>,
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS = [
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
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Dropdowns",        detail: "Select the question style or method for the active tool and level." },
    { label: "Toggles",          detail: "Level-specific options such as hints or extra challenge." },
    { label: "Differentiated",   detail: "In differentiated mode the QO popover shows all three levels so each column can be customised independently." },
  ]},
];

// ── 4. Question interface ─────────────────────────────────────────────────────
// Rendering contract:
//   Prose (labels, instructions, connective words) → plain text / JSX spans
//   Mathematical content (numbers, expressions, fractions, algebra, etc.) → KaTeX
//
// For "simple" questions: set displayLatex to the LaTeX expression string.
// For "worded" questions: use InlineMath lines with $...$ around maths spans.
// For "frac" questions:   set latex to the full LaTeX fraction expression.
// Working steps:          always set step.latex to a genuine LaTeX string.

interface SimpleQuestion {
  kind: "simple";
  display: string;        // plain-text fallback (shown if displayLatex absent)
  displayLatex?: string;  // KaTeX expression — use for all mathematical content
  answer: string;         // plain-text fallback (shown if answerLatex absent)
  answerLatex?: string;   // KaTeX expression for the answer
  answerSuffix?: string;  // plain-text unit/label appended after answerLatex e.g. "kg", "cm²"
  working: { type: string; latex: string; plain: string; label?: string; unit?: string }[];
  key: string;
  difficulty: string;
}

// WordedQuestion: prose context with embedded maths.
// lines[] are rendered via InlineMath — use mStr(n) for numbers, fracStr(n,d) for fractions.
// Prose words stay as plain text. Ratios use $n:d$ (no spaces around the colon).
interface WordedQuestion {
  kind: "worded";
  lines: string[];
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;  // plain-text unit/label appended after answerLatex e.g. "kg"
  working: { type: string; latex: string; plain: string; label?: string; unit?: string }[];
  key: string;
  difficulty: string;
}

type AnyQuestion = SimpleQuestion | WordedQuestion;

// ── 5. Helpers ────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

// fracStr: produces an InlineMath-compatible fraction string.
// e.g. "A recipe uses " + fracStr(3,4) + " of the bag."
const fracStr = (n: number | string, d: number | string) => `$\\frac{${n}}{${d}}$`;

// mStr: wraps any mathematical content (numbers, expressions, operators, ratios)
// for inline rendering via InlineMath. Use for individual numbers and symbols in prose.
// e.g. "A bag weighs " + mStr(16) + " kg."
// e.g. "The ratio is " + mStr("3:4") + " red to blue."   ← no spaces around colon
// e.g. "Split into " + mStr("3 + 5") + " parts."
const mStr = (x: number | string) => `$${x}$`;

// Three working step types — choose based on content:
//
//   step(latex)          — pure KaTeX. Use for any line containing maths.
//                          All numbers, operators, expressions → KaTeX.
//                          e.g. step("16 \\div 8 = 2")
//                          e.g. step("\\frac{3}{8} \\times 24 = 9")
//                          Never use \\text{} to embed prose labels inside step().
//
//   tStep(text)          — plain text only. Use ONLY for genuinely numberless
//                          prose — e.g. tStep("Simplify the fraction.")
//                          If the sentence contains any number or operator,
//                          use mStep() instead.
//
//   mStep(label, latex)  — prose label (no numbers) + KaTeX on the right.
//                          Use when a word introduces a mathematical result.
//                          e.g. mStep("Divide by the denominator:", "16 \\div 8 = 2")
//                          e.g. mStep("Red =", "\\frac{3}{8}")

const step  = (latex: string, plain?: string) =>
  ({ type: "step",  latex, plain: plain ?? latex });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${text}}`, plain: text });
const mStep = (label: string, latex: string, unit?: string) =>
  ({ type: "mStep", latex, plain: `${label} ${latex}${unit ? " " + unit : ""}`, label, unit });

// fmt: format a number to dp decimal places, stripping trailing zeros.
// Default is 2dp. e.g. fmt(3.5) → "3.5", fmt(3.0) → "3"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fmt = (n: number, dp = 2): string => n.toFixed(dp).replace(/\.?0+$/, "");

// ── 6. Question generators ────────────────────────────────────────────────────
//
// RENDERING RULES:
//   • Prose words only (no numbers/operators) → plain text
//   • Everything else → KaTeX:
//
//   Numbers in prose     → mStr(n)          e.g. "weighs " + mStr(16) + " kg"
//   Fractions in prose   → fracStr(n,d)     e.g. fracStr(3,4) + " of the bag"
//   Pure maths step      → step(latex)      e.g. step("16 \\div 8 = 2")
//   Prose label + maths  → mStep(label, latex)
//   Genuinely numberless prose step → tStep(text)  (rare)
//
// `variables` — state of all toggles for the active tool/level.
// `dropdownValue` — selected option key from the dropdown.

const generateQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,   // ← use variables[key] in your generator
  _dropdownValue: string,                // ← use dropdownValue to branch on selected option
): AnyQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);

  // ── Tool 1: simple kind — pure maths, displayLatex renders via KaTeX ─────
  if (tool === "tool1") {
    const a = randInt(1, 9), b = randInt(1, 9);
    return {
      kind: "simple",
      display: `${a} + ${b}`,
      displayLatex: `${a} + ${b}`,       // numbers & operators → KaTeX as-is
      answer: `${a + b}`,
      answerLatex: `${a + b}`,
      working: [
        step(`${a} + ${b} = ${a + b}`),  // genuine LaTeX, not \text{...}
      ],
      key: `t1-${level}-${a}-${b}-${id}`,
      difficulty: level,
    };
  }

  // ── Tool 2: worded kind — prose as plain text, maths via $...$ ───────────
  // Demonstrates the InlineMath rendering contract:
  //   • Connective words, units, labels → plain text outside $...$
  //   • Only fractions go inside $...$ via fracStr()
  //   • Plain numbers in prose stay as plain text — never in $...$
  if (tool === "tool2") {
    const d = pick([2, 3, 4, 5, 6, 8, 10]);
    const k = randInt(2, 12);
    const amount = d * k;
    const numer = level === "level1" ? 1 : randInt(2, d - 1);
    const answerVal = (numer * amount) / d;
    return {
      kind: "worded",
      lines: [
        `A bag of flour weighs ${mStr(amount)} kg.`,          // number → mStr
        `A recipe needs ${fracStr(numer, d)} of the bag.`,    // fraction → fracStr
        "How many kg is that?",                                // pure prose → plain
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

  // ── Tool 3: simple kind with instruction ──────────────────────────────────
  const a = randInt(1, 9), b = randInt(1, 9);
  return {
    kind: "simple",
    display: `${a} \u00d7 ${b}`,
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
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// END OF TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════




const LV_COLORS:Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};

const getQuestionBg = (cs:string) => ({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg    = (cs:string) => ({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

// ── QuestionDisplay — renders any question's main display ─────────────────────

const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => {
  const anyQ = q as any;
  if (anyQ.kind === "frac") {
    const parts = anyQ.latex.split(/\\text\{ of \}/);
    const fracLatex = parts[0].trim();
    const number = parts[1]?.trim() ?? "";
    return (
      <div className={`${cls} font-semibold text-center`} style={{color:"#000",lineHeight:1.5}}>
        <span>Find </span><MathRenderer latex={fracLatex} /><span> of {number}</span>
      </div>
    );
  }
  if (anyQ.kind === "simple") {
    const anyQ = q as any;
    return (
      <div className={`${cls} font-semibold text-center`} style={{color:"#000",lineHeight:1.5}}>
        {anyQ.displayLatex
          ? <MathRenderer latex={anyQ.displayLatex} />
          : anyQ.display}
      </div>
    );
  }
  // worded / asFrac — multi-line
  return (
    <div className="flex flex-col gap-2 text-center">
      {(q as any).lines.map((line: string, i: number) => (
        <div key={i} className={`${cls} font-semibold`} style={{color:"#000",lineHeight:2.2}}>
          <InlineMath text={line} />
        </div>
      ))}
    </div>
  );
};

// Renders a string that may contain $...$ inline LaTeX.
// Only genuine mathematical content (fractions, expressions, equations) should
// be inside $...$. Words, labels, ratios, and plain numbers stay as plain text.
const InlineMath = ({ text }: { text: string }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span style={{display:"inline"}}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1);
          return <MathRenderer key={i} latex={latex} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const AnswerDisplay = ({ q, answerFormat: _answerFormat }: { q: AnyQuestion; answerFormat: string }) => {
  const anyQ = q as any;
  if (anyQ.answerLatex) return <><MathRenderer latex={`= ${anyQ.answerLatex}`} />{anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}</>;
  return <span>= {anyQ.answer ?? ""}</span>;
};

// ── DifficultyToggle ──────────────────────────────────────────────────────────

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([ ["level1","Level 1","bg-green-600"], ["level2","Level 2","bg-yellow-500"], ["level3","Level 3","bg-red-600"] ] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

// ── Shared popover sub-components ─────────────────────────────────────────────
// (TogglePill, SegButtons, usePopover, PopoverButton defined before tool section)

// DropdownSection — renders a segmented button selector inside a QO popover
const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] };
  value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => dropdown.useTwoLineButtons ? (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-center flex flex-col items-center justify-center transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          <span className="text-base font-bold leading-tight">{opt.label}</span>
          {opt.sub && <span className={`text-xs mt-0.5 leading-tight ${value === opt.value ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>}
        </button>
      ) : (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// VariablesSection — renders toggle switches inside a QO popover
const VariablesSection = ({ variables, values, onChange }: {
  variables: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

// StandardQOPopover — shown in whiteboard/worked example and non-differentiated worksheet
const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }: {
  variables: { key: string; label: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const hasContent = variables.length > 0 || dropdown !== null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No additional options for this tool.</p>}
        </div>
      )}
    </div>
  );
};

// DiffQOPopover — shown in differentiated worksheet mode; shows per-level options
const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: {
  toolSettings: typeof TOOL_CONFIG.tools[string];
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1","level2","level3"] as DifficultyLevel[];
  const getDDForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  const anyContent = levels.some(lv => getDDForLevel(lv) !== null || (getVarsForLevel(lv)?.length ?? 0) > 0);
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {!anyContent
            ? <p className="text-sm text-gray-400">No additional options for this tool.</p>
            : levels.map(lv => {
                const dd = getDDForLevel(lv);
                const vars = getVarsForLevel(lv) ?? [];
                return (
                  <div key={lv} className="flex flex-col gap-2">
                    <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                    <div className="flex flex-col gap-3 pl-1">
                      {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                      {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k,v) => onLevelVariableChange(lv, k, v)} />}
                      {!dd && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
};

// ── InfoModal ─────────────────────────────────────────────────────────────────

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{height:"80vh"}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20}/></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s=>(
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item=>(
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">Close</button>
      </div>
    </div>
  </div>
);

// ── MenuDropdown ──────────────────────────────────────────────────────────────

const MenuDropdown = ({colorScheme,setColorScheme,onClose,onOpenInfo}:{colorScheme:string;setColorScheme:(s:string)=>void;onClose:()=>void;onOpenInfo:()=>void}) => {
  const [colorOpen,setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{minWidth:"200px"}}>
      <div className="py-1">
        <button onClick={()=>setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen&&(
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s=>(
              <button key={s} onClick={()=>{setColorScheme(s);onClose();}}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}
                {colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={()=>{onOpenInfo();onClose();}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF
// ═══════════════════════════════════════════════════════════════════════════════

const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
  instruction: string,
) => {
  const FONT_PX   = 14;
  const PAD_MM    = 3;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ  = questions.length;

  const renderLine = (line: string): string =>
    line.split(/(\$[^$]+\$)/g).map(part => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1,-1);
        const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
        return `<span class="katex-render"${frac} data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;
      }
      return `<span>${part}</span>`;
    }).join("");

  const katexSpan = (latex: string, extraClass = "") => {
    const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
    const cls = ["katex-render", extraClass].filter(Boolean).join(" ");
    return `<span class="${cls}"${frac} data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;
  };

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const anyQ = q as any;
    let ansHtml = "";
    if (showAnswer) {
      const al = anyQ.answerLatex ? anyQ.answerLatex : `\\text{${anyQ.answer ?? ""}}`;
      const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
      ansHtml = `<div class="q-answer">${katexSpan(`= ${al}`)}${suffix}</div>`;
    }
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const instrHtml = instruction ? `<div class="q-instruction">${instruction}</div>` : "";
    let body = "";
    if (anyQ.kind === "frac") {
      body = `${instrHtml}<div style="text-align:center">${katexSpan(`\\text{Find } ${anyQ.latex}`, "q-math")}</div>${ansHtml}`;
    } else if (q.kind === "simple") {
      const mathHtml = anyQ.displayLatex
        ? katexSpan(anyQ.displayLatex, "q-math")
        : `<span class="q-math">${anyQ.display ?? ""}</span>`;
      body = `${instrHtml}<div style="text-align:center">${mathHtml}</div>${ansHtml}`;
    } else {
      // worded / asFrac
      body = `${instrHtml}<div style="text-align:center"><span class="q-math">${renderLine(anyQ.lines[0])}</span></div>`
           + `<div class="q-lines">${anyQ.lines.slice(1).map((l: string) => `<div class="q-line">${renderLine(l)}</div>`).join("")}</div>`
           + ansHtml;
    }
    return `${banner}<div class="qbody">${body}</div>`;
  };

  // Build probe HTML — all questions with answers, at correct cell width
  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`
  ).join("");

  // Pre-build question/answer HTML strings for JS to use
  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: questionToHtml(q, i, true),
    difficulty: q.difficulty,
  }));

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm;
  }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }

  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell {
    border: 0.3mm solid #d1d5db; border-radius: 3mm;
    overflow: hidden; display: flex; flex-direction: column;
    align-items: stretch; justify-content: flex-start;
  }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header {
    height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center;
    font-size: 3mm; font-weight: 700; border-radius: 1mm;
  }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  .diff-cell {
    border: 0.3mm solid #d1d5db; border-radius: 3mm;
    overflow: hidden; display: flex; flex-direction: column;
    align-items: stretch; justify-content: flex-start;
  }

  /* Probe: off-screen, correct CONTENT width, fixed font for measurement */
  #probe {
    position: fixed; left: -9999px; top: 0; visibility: hidden;
    font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4;
    width: ${cellW_MM}mm;
  }

  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .q-banner { width: 100%; text-align: center; font-size: ${Math.round(FONT_PX * 0.65)}px; font-weight: 700; color: #000; padding: 1mm 0; border-bottom: 0.3mm solid #000; }
  .qbody    { padding: ${PAD_MM * 0.4}mm ${PAD_MM}mm ${PAD_MM}mm; text-align: center; flex: 1; }
  .q-instruction { font-size: ${Math.round(FONT_PX * 0.8)}px; color: #000; text-align: center; margin-bottom: 1mm; font-weight: 600; }
  .q-math   { font-size: ${FONT_PX}px; display: inline; }
  .q-lines  { font-size: ${FONT_PX}px; line-height: 1.4; text-align: center; }
  .q-line   { display: block; text-align: center; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 1mm; text-align: center; }
  .katex-render { display: inline-block; vertical-align: baseline; }
  .katex-render .katex { font-size: ${FONT_PX}px; }
  .katex-render.frac .katex { font-size: ${FONT_PX}px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";

  // Pre-determined row heights for 1–10 rows
  var rowHeights = [];
  for (var r = 1; r <= 10; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  // Question data pre-built in TS
  var qData = ${JSON.stringify(qHtmlData)};

  // Step 1: render KaTeX in probe
  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  // Step 2: measure tallest question+answer content
  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6; // +6mm buffer for line-wrap variation and KaTeX height

  // For differentiated: calculate how many rows fit per page
  var diffPerCol   = Math.floor(totalQ / 3); // questions per level
  var diffUsableH  = usableH - diffHdrMM - GAP_MM; // usable after header
  // Find max rows where cellH >= needed_mm (same logic as standard mode)
  var diffRowsPerPage = 1;
  var diffCellH_mm = diffUsableH; // fallback: 1 row
  for (var rd = 0; rd < diffPerCol; rd++) {
    var h = (diffUsableH - GAP_MM * rd) / (rd + 1);
    if (h >= needed_mm) {
      diffRowsPerPage = rd + 1;
      diffCellH_mm = h;
    }
  }

  // Step 3: find the optimal row count for STANDARD layout
  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;

  // First try: find smallest rows where capacity >= totalQ AND content fits
  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r];
      rowsPerPage = r + 1;
      found = true;
      break;
    }
  }

  // Fallback: can't fit all on one page — use most rows where content fits
  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) {
        chosenH_mm = rowHeights[r2];
        rowsPerPage = r2 + 1;
      }
    }
  }

  // Step 4: split into pages
  var pageCapacity = isDiff ? diffRowsPerPage : rowsPerPage * cols;
  // For diff, pages is indexed by page number; each page shows diffRowsPerPage per level
  var pages = [];
  if (isDiff) {
    var numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);
    for (var p = 0; p < numDiffPages; p++) {
      pages.push(p); // store page index, not slice of flat array
    }
  } else {
    for (var s = 0; s < qData.length; s += pageCapacity) {
      pages.push(qData.slice(s, s + pageCapacity));
    }
  }
  var totalPages = pages.length;

  function makeCellW(c) {
    return (PAGE_W_MM - GAP_MM * (c - 1)) / c;
  }

  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;">'
         + '<div class="q-inner">' + inner + '</div></div>';
  }

  function buildGrid(pageData, showAnswer, cH) {
    if (isDiff) {
      var pgIdx = pageData; // for diff, pageData is the page index
      var start = pgIdx * diffRowsPerPage;
      var end   = start + diffRowsPerPage;
      var cW = makeCellW(3);
      var lvls = ['level1','level2','level3'];
      var lbls = ['Level 1','Level 2','Level 3'];
      var cols3 = lvls.map(function(lv, li) {
        var lqs = qData.filter(function(q) { return q.difficulty === lv; }).slice(start, end);
        var cells = lqs.map(function(q) {
          return buildCell(showAnswer ? q.a : q.q, cW, cH, true);
        }).join('');
        return '<div class="diff-col"><div class="diff-header ' + lv + '">' + lbls[li] + '</div>' + cells + '</div>';
      }).join('');
      return '<div class="diff-grid" style="grid-template-columns:repeat(3,' + cW + 'mm);">' + cols3 + '</div>';
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) {
      return buildCell(showAnswer ? item.a : item.q, cW, cH, false);
    }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  function buildPage(pageData, showAnswer, pgIdx) {
    var cH  = isDiff ? diffCellH_mm : chosenH_mm;
    var lbl = totalPages > 1
      ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
      : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
    var title = toolName + (showAnswer ? ' — Answers' : '');
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1>'
      + '<div class="meta">' + diffLabel + ' &nbsp;&middot;&nbsp; ' + dateStr + ' &nbsp;&middot;&nbsp; ' + lbl + '</div></div>'
      + buildGrid(pageData, showAnswer, cH)
      + '</div>';
  }

  // Render all question pages then all answer pages
  var html = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('')
           + pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');

  document.getElementById('pages').innerHTML = html;

  // Step 5: render KaTeX in actual pages
  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  // Remove probe
  probe.remove();

  // Auto-open print dialog after a short delay for KaTeX layout to settle
  setTimeout(function() { window.print(); }, 300);
});
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];
  // NOTE: In production add your routing hook here

  const [currentTool, setCurrentTool] = useState<ToolType>("tool1");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── CONFIG-DRIVEN QO STATE (do not remove) ────────────────────────────────
  // Variables stored per-tool. Dropdowns stored per tool__level key so that
  // each tool/level combination remembers its own selection independently.
  const [toolVariables, setToolVariables] = useState<Record<string,Record<string,boolean>>>(() => {
    const init: Record<string,Record<string,boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      init[k] = {};
      TOOL_CONFIG.tools[k].variables.forEach(v => { init[k][v.key] = v.defaultValue; });
    });
    return init;
  });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const t = TOOL_CONFIG.tools[k];
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string,Record<string,boolean>>>({level1:{},level2:{},level3:{}});
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    const firstTool = Object.keys(TOOL_CONFIG.tools)[0];
    const t = TOOL_CONFIG.tools[firstTool];
    (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
      if (dd) init[lv] = dd.defaultValue;
    });
    return init;
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ── SHARED STATE (do not remove) ─────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("tool1", "level1", {}, "")
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(15);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);  // whiteboard + worked example
  const [worksheetFontSize, setWorksheetFontSize] = useState(2); // worksheet only
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string|null>(null);
  const [camError, setCamError] = useState<string|null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress = useRef(false);

  // Load KaTeX on mount
  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current) videoRef.current.srcObject=null;
  },[]);

  const startCam = useCallback(async (deviceId?:string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId=deviceId;
      if(!targetDeviceId){
        const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        tmp.getTracks().forEach(t=>t.stop());
        const all=await navigator.mediaDevices.enumerateDevices();
        const builtInPattern=/facetime|built.?in|integrated|internal|front|rear/i;
        const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!builtInPattern.test(d.label));
        if(ext) targetDeviceId=ext.deviceId;
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:targetDeviceId?{deviceId:{exact:targetDeviceId}}:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current) videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    } catch(e:unknown){ setCamError((e instanceof Error?e.message:null)??"Camera unavailable"); }
  },[stopStream]);

  useEffect(()=>{ if(presenterMode) startCam(); else stopStream(); },[presenterMode]);
  useEffect(()=>{ if(presenterMode&&streamRef.current&&videoRef.current) videoRef.current.srcObject=streamRef.current; },[wbFullscreen]);
  useEffect(()=>{
    if(!camDropdownOpen) return;
    const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[camDropdownOpen]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme==="default";
  const fsToolbarBg = isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg = isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg  = isDefaultScheme?"#f5f3f0":qBg;

  // ── CONFIG-DRIVEN HELPERS ─────────────────────────────────────────────────
  const getToolSettings = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({...p, [`${currentTool}__${difficulty}`]: v}));
  const setVariableValue = (k: string, v: boolean) => setToolVariables(p => ({...p, [currentTool]: {...p[currentTool], [k]: v}}));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({...p, [lv]: {...p[lv], [k]: v}}));
  const handleLevelDDChange = (lv: string, v: string) => setLevelDropdowns(p => ({...p, [lv]: v}));
  const getInstruction = (tool = currentTool) => TOOL_CONFIG.tools[tool]?.instruction ?? "";
  // ─────────────────────────────────────────────────────────────────────────

  // ── WIRING ────────────────────────────────────────────────────────────────
  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue());

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = levelVariables[lv] ?? {};
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQ(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // QO popover — automatically driven by TOOL_CONFIG, no manual component needed
  const stdQOProps = {
    variables: getVariablesConfig() ?? [],
    variableValues: toolVariables[currentTool] || {},
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig() ?? null,
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
  };
  const diffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
  };
  const qoEl = (isDiff = false) => isDiff
    ? <DiffQOPopover {...diffQOProps} />
    : <StandardQOPopover {...stdQOProps} />;
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);

  // Whiteboard / worked example — larger sizes for single question display
  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  // Worksheet — smaller sizes for grid of questions
  const fontSizes = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length-1;
  const canDecrease = worksheetFontSize > 0;

  // ── Worksheet cell ────────────────────────────────────────────────────────
  // Update this to render your question kinds correctly.
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const useCards = TOOL_CONFIG.tools[currentTool]?.useSubstantialBoxes ?? false;
    const cellStyle = {backgroundColor:bg, height:"100%", boxSizing:"border-box" as const, position:"relative" as const};
    const numEl = <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>;
    const wrapperClass = useCards ? "rounded-lg p-4 shadow" : "p-3";

    if (q.kind === "simple") {
      const anyQ = q as any;
      const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
      return (
        <div className={wrapperClass} style={cellStyle}>
          {numEl}
          {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{color:"#000",paddingTop:"0.15em"}}>{getInstruction()}</div>}
          <div className={`${fsz} font-semibold text-center w-full`} style={{color:"#000"}}>
            {anyQ.displayLatex ? <MathRenderer latex={anyQ.displayLatex}/> : anyQ.display}
          </div>
          {showWorksheetAnswers && <div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            {anyQ.answerLatex ? <MathRenderer latex={`= ${anyQ.answerLatex}`}/> : <span>= {anyQ.answer}</span>}
          </div>}
        </div>
      );
    }
    // "worded" / "asFrac" — multi-line
    if ("lines" in q) {
      const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
      return (
        <div className={wrapperClass} style={cellStyle}>
          {numEl}
          {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{color:"#000"}}>{getInstruction()}</div>}
          <div className={`${fsz} font-semibold w-full text-center`} style={{color:"#000",lineHeight:1.6}}>
            {(q as any).lines.map((line: string, i: number) => <div key={i}><InlineMath text={line}/></div>)}
          </div>
          {showWorksheetAnswers && <div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            {(q as any).answerLatex ? <MathRenderer latex={`= ${(q as any).answerLatex}`}/> : <span>= {(q as any).answer}</span>}
          </div>}
        </div>
      );
    }
    // "frac" kind
    const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
    return (
      <div className={wrapperClass} style={cellStyle}>
        {numEl}
        {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{color:"#000"}}>{getInstruction()}</div>}
        <div className={`${fsz} font-semibold text-center w-full`} style={{color:"#000"}}>
          <span>Find </span><MathRenderer latex={(q as any).latex?.replace(/\\text\{ of \}.*/, '') ?? ''} /><span> of {(q as any).latex?.replace(/.*\\text\{ of \}/, '').trim()}</span>
        </div>
        {showWorksheetAnswers && <div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
          <MathRenderer latex={`= ${(q as any).answerLatex}`}/>
        </div>}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if(mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Row 1: Level selector + Differentiated */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
              <button key={val} onClick={()=>{setDifficulty(val as DifficultyLevel);setIsDifferentiated(false);}}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={()=>setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        {/* Row 2: Questions + Columns + Question Options */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||15)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
              onChange={e=>{ if(!isDifferentiated) setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||3))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        {/* Row 3: Actions */}
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18}/> Generate
          </button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}
            </button>
            <button onClick={()=>handlePrint(worksheet,TOOL_CONFIG.tools[currentTool].name,difficulty,isDifferentiated,numColumns,getInstruction())}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
              <Printer size={18}/> Print / PDF
            </button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{backgroundColor:qBg}}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18}/> New Question
            </button>
            <button onClick={()=>mode==="whiteboard"?setShowWhiteboardAnswer(!showWhiteboardAnswer):setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {(mode==="whiteboard"?showWhiteboardAnswer:showAnswer)?"Hide Answer":"Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ────────────────────────────────────────────────────────────
  const renderWhiteboard = () => {

    const fsToolbar = (
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        {qoEl()}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    // Font size buttons — sit in top-right of question box
    const fontBtnStyle = (enabled: boolean) => ({
      background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
      cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: enabled ? 1 : 0.35,
    });

    const questionBox = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div className="rounded-xl flex items-center justify-center flex-shrink-0 p-8" style={{position:"relative",width:"500px",height:"100%",backgroundColor:stepBg}}>
          {fontControls}
          <div className="w-full text-center flex flex-col gap-4 items-center">
            {getInstruction() && <div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][displayFontSize]} font-semibold`} style={{color:"#000"}}>{getInstruction()}</div>}
            <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
            {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}
          </div>
        </div>
      );
    };

    const questionBoxFS = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div style={{position:"relative",width:"40%",height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:16}}>
          {fontControls}
          <>
            {getInstruction() && <div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][displayFontSize]} font-semibold`} style={{color:"#000"}}>{getInstruction()}</div>}
            <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
            {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}
          </>
        </div>
      );
    };

    const makeRightPanel = (isFS: boolean) => (
      <div style={{flex:isFS?"none":1,width:isFS?"60%":undefined,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&(
          <><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          {camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>
        )}
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          {presenterMode?(
            <div style={{position:"relative"}} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
                onMouseDown={()=>{didLongPress.current=false;longPressTimer.current=setTimeout(()=>{didLongPress.current=true;setCamDropdownOpen(o=>!o);},500);}}
                onMouseUp={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);if(!didLongPress.current)setPresenterMode(false);}}
                onMouseLeave={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);}}
                style={{background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.75)")}
              ><Video size={16} color="rgba(255,255,255,0.85)"/></button>
              {camDropdownOpen&&(
                <div style={{position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30}}>
                  <div style={{padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Camera</div>
                  {camDevices.map((d,i)=>(
                    <div key={d.deviceId} onClick={()=>{setCamDropdownOpen(false);if(d.deviceId!==currentCamId)startCam(d.deviceId);}}
                      style={{padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    ><div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>{d.label||`Camera ${i+1}`}</div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setPresenterMode(true)} title="Visualiser mode"
              style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.15)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(0,0,0,0.08)")}
            ><Video size={16} color="#6b7280"/></button>
          )}
          <button onClick={()=>setWbFullscreen(f=>!f)} title={wbFullscreen?"Exit Fullscreen":"Fullscreen"}
            style={{background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:presenterMode?"1px solid rgba(255,255,255,0.15)":"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:presenterMode?"blur(6px)":"none"}}
            onMouseEnter={e=>(e.currentTarget.style.background=wbFullscreen?"#1f2937":(presenterMode?"rgba(0,0,0,0.75)":"rgba(0,0,0,0.15)"))}
            onMouseLeave={e=>(e.currentTarget.style.background=wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"))}
          >{wbFullscreen?<Minimize2 size={16} color="#ffffff"/>:<Maximize2 size={16} color={presenterMode?"rgba(255,255,255,0.85)":"#6b7280"}/>}</button>
        </div>
      </div>
    );

    if(wbFullscreen) return (
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div style={{flex:1,display:"flex",minHeight:0}}>
          {questionBoxFS()}
          <div style={{width:2,backgroundColor:"#000",flexShrink:0}}/>
          {makeRightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"600px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>
          {questionBox()}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8 w-full" style={{backgroundColor:qBg}}>
          <div className="text-center py-4 relative">
            <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
              <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayDecrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayDecrease?1:0.35}} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
              <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayIncrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayIncrease?1:0.35}} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
            </div>
            {getInstruction() && <div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][displayFontSize]} font-semibold mb-2`} style={{color:"#000"}}>{getInstruction()}</div>}
            <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          </div>
          {showAnswer&&(
            <>
              <div className="space-y-4 mt-8">
                {currentQuestion.working.map((s,i)=>(
                  <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                    <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>Step {i+1}</h4>
                    <div className="text-2xl" style={{color:"#000"}}>
                      {s.type === "tStep"
                        ? <span>{s.plain}</span>
                        : s.type === "mStep"
                          ? <><span>{s.label} </span><MathRenderer latex={s.latex}/>{s.unit && <span> {s.unit}</span>}</>
                          : <MathRenderer latex={s.latex}/>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
                <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                  <AnswerDisplay q={currentQuestion} answerFormat=""/>
                </span>
              </div>
            </>
          )}
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if(worksheet.length===0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={()=>canDecrease&&setWorksheetFontSize(f=>f-1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canIncrease} onClick={()=>canIncrease&&setWorksheetFontSize(f=>f+1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if(isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li)=>{
            const lqs=worksheet.filter(q=>q.difficulty===lv);
            const c=LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                {/* Each column is its own grid — grid-auto-rows:1fr equalises cells within the column */}
                <div style={{display:"grid",gridTemplateColumns:"1fr",gridAutoRows:"1fr",gap:"0.75rem"}}>
                  {lqs.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx,c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        {/* grid-auto-rows:1fr makes all rows equal height — tallest cell in each row sets the row height */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem"}}>
          {worksheet.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          {/* NOTE: In production replace onClick with your routing navigate call */}
          <button onClick={()=>{ window.location.href="/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24}/><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={()=>setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen?<X size={28}/>:<Menu size={28}/>}
            </button>
            {isMenuOpen&&<MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={()=>setIsMenuOpen(false)} onOpenInfo={()=>setIsInfoOpen(true)}/>}
          </div>
        </div>
      </div>
      {isInfoOpen&&<InfoModal onClose={()=>setIsInfoOpen(false)}/>}
      <div className="min-h-screen p-8" style={{backgroundColor:"#f5f3f0"}}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{color:"#000"}}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k=>(
              <button key={k} onClick={()=>setCurrentTool(k)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool===k?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setPresenterMode(false);setWbFullscreen(false);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode==="worksheet"&&<>{renderControlBar()}{renderWorksheet()}</>}
          {mode!=="worksheet"&&(
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">
                {renderControlBar()}
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode==="whiteboard"&&renderWhiteboard()}
                {mode==="single"&&renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
