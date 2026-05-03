import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── NAVIGATION ───────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button.
// No React Router / useNavigate — the parent app handles routing.
// Individual tool components never wrap themselves in a router.
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
const TogglePill = ({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={()=>onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked?"bg-blue-900":"bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?"translate-x-7":"translate-x-1"}`}/>
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

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

type ToolType = "equations";
type DifficultyLevel = "level1" | "level2" | "level3";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────
// Shell QO machinery (dropdown/variables) is bypassed for this tool.
// Custom QOOptions state is used instead — see QOOptions type below.

const TOOL_CONFIG = {
  pageTitle: "Solving Linear Equations",

  tools: {
    equations: {
      name: "Unknowns on Both Sides",
      instruction: "Solve:",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: null,
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

// ── Custom QO Options type ────────────────────────────────────────────────────
// Per-level multi-select options. Each array must have at least one entry active.

interface LevelQO {
  // Level 1
  constants: { bothPos: boolean; oneNeg: boolean; bothNeg: boolean };
  // Level 2
  bracketSide: { left: boolean; right: boolean; both: boolean };
  // Level 3
  negCount: { one: boolean; both: boolean };
  // Shared
  solutionType: { integer: boolean; decimal: boolean };
  solutionSign: { positive: boolean; negative: boolean };
}

const defaultLevelQO = (): LevelQO => ({
  constants:    { bothPos: true,  oneNeg: false, bothNeg: false },
  bracketSide:  { left: false, right: false, both: true  },
  negCount:     { one: true,  both: false },
  solutionType: { integer: true,  decimal: false },
  solutionSign: { positive: true, negative: false },
});

// ── Custom QO Popover ─────────────────────────────────────────────────────────

const MultiSelectGroup = ({ label, options, values, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}) => {
  const activeCount = options.filter(o => values[o.key]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {options.map(opt => {
          const active = values[opt.key] ?? false;
          const isLast = activeCount === 1 && active; // can't deselect last
          return (
            <button key={opt.key}
              onClick={() => { if (!isLast) onChange(opt.key, !active); }}
              className={`flex-1 px-3 py-2 text-sm font-bold transition-colors border-r border-gray-200 last:border-r-0
                ${active ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}
                ${isLast ? "cursor-not-allowed" : "cursor-pointer"}`}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EquationsQOPopover = ({ level, qo, onChange }: {
  level: DifficultyLevel;
  qo: LevelQO;
  onChange: (updated: LevelQO) => void;
}) => {
  const { open, setOpen, ref } = usePopover();

  const update = <K extends keyof LevelQO>(group: K, key: string, val: boolean) => {
    onChange({ ...qo, [group]: { ...(qo[group] as Record<string,boolean>), [key]: val } });
  };

  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {level === "level1" && (
            <MultiSelectGroup label="Constants" options={[
              { key: "bothPos", label: "Both +" },
              { key: "oneNeg",  label: "One −"  },
              { key: "bothNeg", label: "Both −" },
            ]} values={qo.constants} onChange={(k,v) => update("constants", k, v)} />
          )}
          {level === "level2" && (
            <MultiSelectGroup label="Bracket side" options={[
              { key: "left",  label: "Left"  },
              { key: "right", label: "Right" },
              { key: "both",  label: "Both"  },
            ]} values={qo.bracketSide} onChange={(k,v) => update("bracketSide", k, v)} />
          )}
          {level === "level3" && (
            <MultiSelectGroup label="Negative x terms" options={[
              { key: "one",  label: "One −x"  },
              { key: "both", label: "Both −x" },
            ]} values={qo.negCount} onChange={(k,v) => update("negCount", k, v)} />
          )}
          <MultiSelectGroup label="Solution type" options={[
            { key: "integer", label: "Integer" },
            { key: "decimal", label: "Decimal" },
          ]} values={qo.solutionType} onChange={(k,v) => update("solutionType", k, v)} />
          <MultiSelectGroup label="Solution sign" options={[
            { key: "positive", label: "Positive" },
            { key: "negative", label: "Negative" },
          ]} values={qo.solutionSign} onChange={(k,v) => update("solutionSign", k, v)} />
        </div>
      )}
    </div>
  );
};

// Differentiated variant — shows all three levels' options in one popover
const EquationsDiffQOPopover = ({ qoByLevel, onChange }: {
  qoByLevel: Record<DifficultyLevel, LevelQO>;
  onChange: (lv: DifficultyLevel, updated: LevelQO) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels: DifficultyLevel[] = ["level1", "level2", "level3"];

  const update = (lv: DifficultyLevel, group: keyof LevelQO, key: string, val: boolean) => {
    const qo = qoByLevel[lv];
    onChange(lv, { ...qo, [group]: { ...(qo[group] as Record<string,boolean>), [key]: val } });
  };

  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-6">
          {levels.map(lv => {
            const qo = qoByLevel[lv];
            const lvLabel = lv === "level1" ? "Level 1" : lv === "level2" ? "Level 2" : "Level 3";
            const lvColor = lv === "level1" ? "text-green-600" : lv === "level2" ? "text-yellow-500" : "text-red-600";
            return (
              <div key={lv} className="flex flex-col gap-3">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${lvColor}`}>{lvLabel}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {lv === "level1" && <MultiSelectGroup label="Constants" options={[
                    { key: "bothPos", label: "Both +" },
                    { key: "oneNeg",  label: "One −"  },
                    { key: "bothNeg", label: "Both −" },
                  ]} values={qo.constants} onChange={(k,v) => update(lv, "constants", k, v)} />}
                  {lv === "level2" && <MultiSelectGroup label="Bracket side" options={[
                    { key: "left",  label: "Left"  },
                    { key: "right", label: "Right" },
                    { key: "both",  label: "Both"  },
                  ]} values={qo.bracketSide} onChange={(k,v) => update(lv, "bracketSide", k, v)} />}
                  {lv === "level3" && <MultiSelectGroup label="Negative x terms" options={[
                    { key: "one",  label: "One −x"  },
                    { key: "both", label: "Both −x" },
                  ]} values={qo.negCount} onChange={(k,v) => update(lv, "negCount", k, v)} />}
                  <MultiSelectGroup label="Solution type" options={[
                    { key: "integer", label: "Integer" },
                    { key: "decimal", label: "Decimal" },
                  ]} values={qo.solutionType} onChange={(k,v) => update(lv, "solutionType", k, v)} />
                  <MultiSelectGroup label="Solution sign" options={[
                    { key: "positive", label: "Positive" },
                    { key: "negative", label: "Negative" },
                  ]} values={qo.solutionSign} onChange={(k,v) => update(lv, "solutionSign", k, v)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS = [
  { title: "Standard (Level 1)", icon: "⚖️", content: [
    { label: "Overview",         detail: "Equations of the form ax + b = cx + d. Collect x terms then constants." },
    { label: "Constants",        detail: "Choose whether b and d are both positive, one negative, or both negative." },
    { label: "Integer only",     detail: "When on, only equations with integer solutions are generated." },
    { label: "Positive only",    detail: "When on, only equations with positive solutions are generated." },
  ]},
  { title: "With Brackets (Level 2)", icon: "🔢", content: [
    { label: "Overview",         detail: "One or both sides contain an expanded bracket, e.g. 2(x + 3) = 3x + 1." },
    { label: "Bracket side",     detail: "Control whether the bracket appears on the left, right, or both sides." },
    { label: "Steps",            detail: "Step 1: Expand brackets. Step 2: Reduce x's. Step 3: Isolate constants. Step 4: Divide." },
  ]},
  { title: "Negative x (Level 3)", icon: "➖", content: [
    { label: "Overview",         detail: "Equations where x terms appear with negative coefficients, e.g. 3 − x = 1 + x or 5 − 3x = 2 − x." },
    { label: "One negative x",   detail: "One side has a negative x term, e.g. 10 − 2x = 8 − x." },
    { label: "Both negative x",  detail: "Both sides have negative x terms, e.g. 5 − 3x = 2 − x." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
];

// ── 4. Question interface ─────────────────────────────────────────────────────

interface SimpleQuestion {
  kind: "simple";
  display: string;
  displayLatex?: string;
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: { type: string; latex: string; plain: string; label?: string; unit?: string }[];
  key: string;
  difficulty: string;
}

type AnyQuestion = SimpleQuestion;

// ── 5. Helpers ────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
void pick; // suppress unused warning

// Decimals are only allowed if the value is a tenth, quarter, or third (to 6dp precision).
const isAllowedDecimal = (val: number): boolean => {
  if (Number.isInteger(val)) return true;
  const v = Math.abs(val);
  const tenths  = Math.round(v * 10)  / 10;
  const quarters = Math.round(v * 4)  / 4;
  const thirds   = Math.round(v * 3)  / 3;
  return (
    Math.abs(v - tenths)   < 0.000001 ||
    Math.abs(v - quarters) < 0.000001 ||
    Math.abs(v - thirds)   < 0.000001
  );
};

const fracStr = (_n: number | string, _d: number | string) => "";
void fracStr;
const mStr = (_x: number | string) => "";
void mStr;

const step  = (latex: string, plain?: string) =>
  ({ type: "step",  latex, plain: plain ?? latex });
const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${text}}`, plain: text });
const mStep = (label: string, latex: string, unit?: string) =>
  ({ type: "mStep", latex, plain: `${label} ${latex}${unit ? " " + unit : ""}`, label, unit });

const fmt = (n: number, dp = 2): string => n.toFixed(dp).replace(/\.?0+$/, "");

// Render a coefficient: returns "" for 1, "-" for -1, else the number string
const coefStr = (n: number): string => n === 1 ? "" : n === -1 ? "-" : `${n}`;

// Build a side of an equation as LaTeX: coef*x + const
// e.g. sideLatex(3, 4)  → "3x + 4"
//      sideLatex(1, -2) → "x - 2"
//      sideLatex(-1, 5) → "-x + 5"
//      sideLatex(2, 0)  → "2x"
const sideLatex = (xCoef: number, constant: number): string => {
  const xPart = `${coefStr(xCoef)}x`;
  if (constant === 0) return xPart;
  if (constant > 0) return `${xPart} + ${constant}`;
  return `${xPart} - ${Math.abs(constant)}`;
};

// ── 6. Question generators ────────────────────────────────────────────────────

// Attempt to generate a Level 1 question satisfying constraints.
// Returns null if constraints can't be met after attempts.
const tryLevel1 = (
  constants: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
): AnyQuestion | null => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const a = randInt(2, 8);
    const c = randInt(1, a - 1);

    let b: number, d: number;
    if (constants === "bothPos") {
      b = randInt(1, 15); d = randInt(1, 15);
    } else if (constants === "oneNeg") {
      if (Math.random() < 0.5) { b = randInt(1, 15); d = -randInt(1, 15); }
      else { b = -randInt(1, 15); d = randInt(1, 15); }
    } else {
      b = -randInt(1, 15); d = -randInt(1, 15);
    }

    const xCoef = a - c;
    const rhs = d - b;
    if (xCoef === 0) continue;

    const xVal = rhs / xCoef;
    const isInteger = Number.isInteger(xVal);
    if (!allowInteger && isInteger) continue;
    if (!allowDecimal && !isInteger) continue;
    if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
    if (!allowPositive && xVal > 0) continue;
    if (!allowNegative && xVal < 0) continue;
    if (xVal === 0) continue;

    const xStr = fmt(xVal);
    const id = Math.floor(Math.random() * 1_000_000);

    const working = [
      mStep("Reduce x's:", `${sideLatex(a, b)} = ${sideLatex(c, d)} \\rightarrow ${coefStr(xCoef)}x = ${rhs}`),
      mStep("Isolate constant:", `${coefStr(xCoef)}x = ${rhs}`),
      mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
    ];

    return {
      kind: "simple",
      display: `${sideLatex(a, b)} = ${sideLatex(c, d)}`,
      displayLatex: `${sideLatex(a, b)} = ${sideLatex(c, d)}`,
      answer: `x = ${xStr}`,
      answerLatex: `x = ${xStr}`,
      working,
      key: `l1-${a}-${b}-${c}-${d}-${id}`,
      difficulty: "level1",
    };
  }
  return null;
};

const tryLevel2 = (
  bracketSide: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
): AnyQuestion | null => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const m = randInt(2, 6);
    const p = randInt(-8, 8);
    if (p === 0) continue;

    let c: number, d: number;
    let rightBracketM = 0, rightBracketP = 0;

    if (bracketSide === "both") {
      rightBracketM = randInt(2, 6);
      rightBracketP = randInt(-8, 8);
      if (rightBracketP === 0) continue;
      c = rightBracketM;
      d = rightBracketM * rightBracketP;
    } else if (bracketSide === "right") {
      // right side has bracket: cx + d = n(x + q)
      // swap: generate bracket on right, plain on left
      rightBracketM = randInt(2, 6);
      rightBracketP = randInt(-8, 8);
      if (rightBracketP === 0) continue;
      c = rightBracketM;
      d = rightBracketM * rightBracketP;
      // left side is plain: a different coefficient
      const leftC = randInt(1, 9);
      const leftD = randInt(-10, 10);
      if (leftD === 0) continue;
      // equation: leftC*x + leftD = rightBracketM*(x + rightBracketP)
      // after expand: leftC*x + leftD = c*x + d
      // xCoef = leftC - c, rhs = d - leftD
      const xCoef2 = leftC - c;
      if (xCoef2 === 0) continue;
      const rhs2 = d - leftD;
      const xVal2 = rhs2 / xCoef2;
      const isInt2 = Number.isInteger(xVal2);
      if (!allowInteger && isInt2) continue;
      if (!allowDecimal && !isInt2) continue;
      if (allowDecimal && !isInt2 && !isAllowedDecimal(xVal2)) continue;
      if (!allowPositive && xVal2 > 0) continue;
      if (!allowNegative && xVal2 < 0) continue;
      if (xVal2 === 0) continue;
      const xStr2 = fmt(xVal2);
      const id2 = Math.floor(Math.random() * 1_000_000);
      const rpSign = rightBracketP >= 0 ? `+ ${rightBracketP}` : `- ${Math.abs(rightBracketP)}`;
      const rightLatex2 = `${rightBracketM}(x ${rpSign})`;
      const leftLatex2 = sideLatex(leftC, leftD);
      const expandedRight2 = sideLatex(c, d);
      return {
        kind: "simple",
        display: `${leftLatex2} = ${rightLatex2}`,
        displayLatex: `${leftLatex2} = ${rightLatex2}`,
        answer: `x = ${xStr2}`, answerLatex: `x = ${xStr2}`,
        working: [
          mStep("Expand brackets:", `${leftLatex2} = ${rightLatex2} \\rightarrow ${leftLatex2} = ${expandedRight2}`),
          mStep("Reduce x's:", `${leftLatex2} = ${expandedRight2} \\rightarrow ${coefStr(xCoef2)}x = ${rhs2}`),
          mStep("Isolate constant:", `${coefStr(xCoef2)}x = ${rhs2}`),
          mStep("Divide:", `x = \\frac{${rhs2}}{${xCoef2}} = ${xStr2}`),
        ],
        key: `l2r-${leftC}-${leftD}-${rightBracketM}-${rightBracketP}-${id2}`, difficulty: "level2",
      };
    } else {
      c = randInt(1, m + 3);
      if (c === m) continue;
      d = randInt(-10, 10);
      if (d === 0) d = randInt(1, 10);
    }

    const expandedB = m * p;
    const xCoef = m - c;
    if (xCoef === 0) continue;
    const rhs = d - expandedB;

    const xVal = rhs / xCoef;
    const isInteger = Number.isInteger(xVal);
    if (!allowInteger && isInteger) continue;
    if (!allowDecimal && !isInteger) continue;
    if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
    if (!allowPositive && xVal > 0) continue;
    if (!allowNegative && xVal < 0) continue;
    if (xVal === 0) continue;

    const xStr = fmt(xVal);
    const id = Math.floor(Math.random() * 1_000_000);

    const pSign = p >= 0 ? `+ ${p}` : `- ${Math.abs(p)}`;
    const leftLatex = `${m}(x ${pSign})`;

    let rightLatex: string;
    if (bracketSide === "both") {
      const rpSign = rightBracketP >= 0 ? `+ ${rightBracketP}` : `- ${Math.abs(rightBracketP)}`;
      rightLatex = `${rightBracketM}(x ${rpSign})`;
    } else {
      rightLatex = sideLatex(c, d);
    }

    const expandedLeft = sideLatex(m, expandedB);
    const expandedRight = bracketSide === "both" ? sideLatex(rightBracketM, d) : sideLatex(c, d);

    const working = [
      mStep("Expand brackets:", `${leftLatex} = ${rightLatex} \\rightarrow ${expandedLeft} = ${expandedRight}`),
      mStep("Reduce x's:", `${expandedLeft} = ${expandedRight} \\rightarrow ${coefStr(xCoef)}x = ${rhs}`),
      mStep("Isolate constant:", `${coefStr(xCoef)}x = ${rhs}`),
      mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
    ];

    return {
      kind: "simple",
      display: `${leftLatex} = ${rightLatex}`,
      displayLatex: `${leftLatex} = ${rightLatex}`,
      answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
      working,
      key: `l2-${m}-${p}-${c}-${d}-${id}`,
      difficulty: "level2",
    };
  }
  return null;
};

const tryLevel3 = (
  negCount: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
): AnyQuestion | null => {
  for (let attempt = 0; attempt < 200; attempt++) {
    let a: number, b: number, c: number, d: number;

    if (negCount === "one") {
      a = randInt(1, 5);
      c = randInt(1, 5);
      b = randInt(2, 15);
      d = randInt(-8, 8);
      if (d === b) continue;

      const xCoef = a + c;
      const rhs = b - d;
      const xVal = rhs / xCoef;
      const isInteger = Number.isInteger(xVal);
      if (!allowInteger && isInteger) continue;
      if (!allowDecimal && !isInteger) continue;
      if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
      if (!allowPositive && xVal > 0) continue;
      if (!allowNegative && xVal < 0) continue;
      if (xVal === 0) continue;

      const xStr = fmt(xVal);
      const id = Math.floor(Math.random() * 1_000_000);
      const leftDisplay = `${b} - ${a === 1 ? "" : a}x`;
      const rightDisplay = sideLatex(c, d);
      const working = [
        mStep("Reduce x's:", `${leftDisplay} = ${rightDisplay} \\rightarrow ${b} ${d >= 0 ? `- ${d}` : `+ ${Math.abs(d)}`} = ${c === 1 ? "" : c}x + ${a === 1 ? "" : a}x`),
        mStep("Isolate constant:", `${rhs} = ${xCoef === 1 ? "" : xCoef}x`),
        mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
      ];
      return {
        kind: "simple", display: `${leftDisplay} = ${rightDisplay}`, displayLatex: `${leftDisplay} = ${rightDisplay}`,
        answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
        working, key: `l3-one-${a}-${b}-${c}-${d}-${id}`, difficulty: "level3",
      };

    } else {
      a = randInt(1, 5);
      c = randInt(1, 5);
      if (a === c) continue;
      b = randInt(2, 15);
      d = randInt(2, 15);
      if (b === d) continue;

      const xCoef = c - a;
      const rhs = d - b;
      if (xCoef === 0) continue;
      const xVal = rhs / xCoef;
      const isInteger = Number.isInteger(xVal);
      if (!allowInteger && isInteger) continue;
      if (!allowDecimal && !isInteger) continue;
      if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
      if (!allowPositive && xVal > 0) continue;
      if (!allowNegative && xVal < 0) continue;
      if (xVal === 0) continue;

      const xStr = fmt(xVal);
      const id = Math.floor(Math.random() * 1_000_000);
      const leftDisplay = `${b} - ${a === 1 ? "" : a}x`;
      const rightDisplay = `${d} - ${c === 1 ? "" : c}x`;
      const working = [
        mStep("Reduce x's:", `${leftDisplay} = ${rightDisplay} \\rightarrow ${b - d} = ${a === 1 ? "" : a}x - ${c === 1 ? "" : c}x`),
        mStep("Isolate constant:", `${b - d} = ${xCoef === 1 ? "" : xCoef === -1 ? "-" : xCoef}x`),
        mStep("Divide:", `x = \\frac{${b - d}}{${xCoef}} = ${xStr}`),
      ];
      return {
        kind: "simple", display: `${leftDisplay} = ${rightDisplay}`, displayLatex: `${leftDisplay} = ${rightDisplay}`,
        answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
        working, key: `l3-both-${a}-${b}-${c}-${d}-${id}`, difficulty: "level3",
      };
    }
  }
  return null;
};

// pick one active key at random from a multi-select group
const pickActive = (values: Record<string, boolean>): string => {
  const active = Object.entries(values).filter(([,v]) => v).map(([k]) => k);
  return active[Math.floor(Math.random() * active.length)];
};

const generateQuestion = (
  _tool: ToolType,
  level: DifficultyLevel,
  qo: LevelQO,
): AnyQuestion => {
  const integerOnly  = !qo.solutionType.decimal;   // integer only if decimal not active
  const decimalOnly  = !qo.solutionType.integer;
  const positiveOnly = !qo.solutionSign.negative;
  const negativeOnly = !qo.solutionSign.positive;
  // Resolve to concrete booleans for generator: allow integer/decimal, positive/negative
  const allowInteger  = qo.solutionType.integer;
  const allowDecimal  = qo.solutionType.decimal;
  const allowPositive = qo.solutionSign.positive;
  const allowNegative = qo.solutionSign.negative;
  void integerOnly; void decimalOnly; void positiveOnly; void negativeOnly;

  const id = Math.floor(Math.random() * 1_000_000);

  if (level === "level1") {
    const constants = pickActive(qo.constants);
    return tryLevel1(constants, allowInteger, allowDecimal, allowPositive, allowNegative) ?? {
      kind: "simple", display: "3x + 4 = x + 10", displayLatex: "3x + 4 = x + 10",
      answer: "x = 3", answerLatex: "x = 3",
      working: [mStep("Reduce x's:", "3x + 4 = x + 10 \\rightarrow 2x + 4 = 10"), mStep("Isolate constant:", "2x = 6"), mStep("Divide:", "x = 3")],
      key: `l1-fallback-${id}`, difficulty: "level1",
    };
  }

  if (level === "level2") {
    const bracketSide = pickActive(qo.bracketSide);
    return tryLevel2(bracketSide, allowInteger, allowDecimal, allowPositive, allowNegative) ?? {
      kind: "simple", display: "2(x + 3) = 3x + 1", displayLatex: "2(x + 3) = 3x + 1",
      answer: "x = 5", answerLatex: "x = 5",
      working: [mStep("Expand brackets:", "2(x + 3) = 3x + 1 \\rightarrow 2x + 6 = 3x + 1"), mStep("Reduce x's:", "2x + 6 = 3x + 1 \\rightarrow 6 - 1 = 3x - 2x"), mStep("Isolate constant:", "5 = x"), mStep("Divide:", "x = 5")],
      key: `l2-fallback-${id}`, difficulty: "level2",
    };
  }

  // level3
  const negCount = pickActive(qo.negCount);
  return tryLevel3(negCount, allowInteger, allowDecimal, allowPositive, allowNegative) ?? {
    kind: "simple", display: "10 - 2x = 8 - x", displayLatex: "10 - 2x = 8 - x",
    answer: "x = 2", answerLatex: "x = 2",
    working: [mStep("Reduce x's:", "10 - 2x = 8 - x \\rightarrow 10 - 8 = 2x - x"), mStep("Isolate constant:", "2 = x"), mStep("Divide:", "x = 2")],
    key: `l3-fallback-${id}`, difficulty: "level3",
  };
};

// ── 7. generateUniqueQ ────────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: ToolType,
  level: DifficultyLevel,
  qo: LevelQO,
  usedKeys: Set<string>,
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, qo); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// END OF TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

// These helpers are documented for tool authors but not used in the stub generator.
// The void references below satisfy the TypeScript compiler without affecting runtime.
void (TogglePill as unknown);
void (SegButtons as unknown);
void (tStep as unknown);
void (step as unknown);
void (fmt as unknown);

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
void (StandardQOPopover as unknown);
void (DiffQOPopover as unknown);

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
  const PAD_MM    = 2;
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
  .q-line   { display: block; text-align: center; margin-bottom: 0.2mm; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 0.8mm; text-align: center; }
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
  var diffUsableH  = usableH - diffHdrMM - GAP_MM; // usable height after level header
  // For each row count tested, amortise the header cost across the rows so cells
  // get credit for their share of that fixed overhead (dNeeded = needed - dHdr/rows).
  var diffRowsPerPage = 1;
  var diffCellH_mm = diffUsableH; // fallback: 1 row
  for (var rd = 0; rd < diffPerCol; rd++) {
    var rows2 = rd + 1;
    var h = (diffUsableH - GAP_MM * rd) / rows2;
    var dNeeded = needed_mm - diffHdrMM / rows2;
    if (h >= dNeeded) {
      diffRowsPerPage = rows2;
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

  const [currentTool, setCurrentTool] = useState<ToolType>("equations");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── Custom multi-select QO state ──────────────────────────────────────────
  const [qoOptions, setQoOptions] = useState<Record<DifficultyLevel, LevelQO>>({
    level1: defaultLevelQO(),
    level2: defaultLevelQO(),
    level3: defaultLevelQO(),
  });
  const getQO = () => qoOptions[difficulty];
  const setQO = (lv: DifficultyLevel, updated: LevelQO) =>
    setQoOptions(p => ({ ...p, [lv]: updated }));
  // ─────────────────────────────────────────────────────────────────────────

  // ── CONFIG-DRIVEN QO STATE — unused for this tool, suppressed ────────────
  const [toolVariables] = useState<Record<string,Record<string,boolean>>>({});
  const [toolDropdowns] = useState<Record<string,string>>({});
  const [levelVariables] = useState<Record<string,Record<string,boolean>>>({});
  const [levelDropdowns] = useState<Record<string,string>>({});
  void toolVariables; void toolDropdowns; void levelVariables; void levelDropdowns;
  // ─────────────────────────────────────────────────────────────────────────

  // ── SHARED STATE (do not remove) ─────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("equations", "level1", defaultLevelQO())
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(15);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);  // whiteboard + worked example
  const [worksheetFontSize, setWorksheetFontSize] = useState(1); // worksheet only
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40); // question panel % width in fullscreen
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string|null>(null);
  const [camError, setCamError] = useState<string|null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

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
  const getInstruction = (tool = currentTool) => TOOL_CONFIG.tools[tool]?.instruction ?? "";
  // ─────────────────────────────────────────────────────────────────────────

  // ── WIRING ────────────────────────────────────────────────────────────────
  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, getQO());

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
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQ(currentTool, lv, qoOptions[lv], usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQ(currentTool, difficulty, getQO(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // Custom QO popover — bypasses shell StandardQOPopover/DiffQOPopover
  const qoEl = (isDiff = false) => isDiff
    ? <EquationsDiffQOPopover qoByLevel={qoOptions} onChange={setQO} />
    : <EquationsQOPopover level={difficulty} qo={getQO()} onChange={u => setQO(difficulty, u)} />;
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
        <div className="rounded-xl flex items-center justify-center flex-shrink-0 p-8" style={{position:"relative",width:"480px",height:"100%",backgroundColor:stepBg}}>
          {fontControls}
          <div className="w-full text-center flex flex-col gap-4 items-center">
            {getInstruction() && <div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][Math.max(0, displayFontSize - 1)]} font-semibold`} style={{color:"#000"}}>{getInstruction()}</div>}
            <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
            {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}
          </div>
        </div>
      );
    };

    const makeRightPanel = (isFS: boolean) => (
      <div style={{flex:1,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
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

    if(wbFullscreen) {
      const onDividerMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const onMove = (ev: MouseEvent) => {
          if (!isDraggingRef.current || !splitContainerRef.current) return;
          const rect = splitContainerRef.current.getBoundingClientRect();
          const pct = ((ev.clientX - rect.left) / rect.width) * 100;
          const snapped = pct >= 38 && pct <= 42 ? 40 : pct;
          setSplitPct(Math.min(75, Math.max(25, snapped)));
        };
        const onUp = () => {
          isDraggingRef.current = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      };

      return (
        <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
          {fsToolbar}
          <div ref={splitContainerRef} style={{flex:1,display:"flex",minHeight:0}}>
            {/* Question panel — width driven by splitPct */}
            <div style={{position:"relative",width:`${splitPct}%`,height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:16}}>
              {(()=>{const fontControls=(<div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}><button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button><button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button></div>);return(<>{fontControls}{getInstruction()&&<div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][Math.max(0, displayFontSize - 1)]} font-semibold`} style={{color:"#000"}}>{getInstruction()}</div>}<QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>{showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}</>);})()}
            </div>
            {/* Draggable divider — 2px line with wider invisible overlay for grabbing */}
            <div
              style={{width:2,flexShrink:0,backgroundColor:"#000",position:"relative"}}
            >
              <div
                onMouseDown={onDividerMouseDown}
                style={{position:"absolute",top:0,bottom:0,left:-5,width:12,cursor:"col-resize",zIndex:10}}
              />
            </div>
            {/* Right panel */}
            {makeRightPanel(true)}
          </div>
        </div>
      );
    }

    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"480px",boxSizing:"border-box"}}>
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
            {getInstruction() && <div className={`${["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"][Math.max(0, displayFontSize - 1)]} font-semibold mb-2`} style={{color:"#000"}}>{getInstruction()}</div>}
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
