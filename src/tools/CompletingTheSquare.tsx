import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
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

declare global {
  interface Window { katex: any; }
}

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (window.katex) { resolve(); return; }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
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

interface MathProps {
  latex: string;
  display?: boolean;
  style?: CSSProperties;
  className?: string;
}

const MathRenderer = ({ latex, display = false, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(!!window.katex);

  useEffect(() => {
    loadKaTeX().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      window.katex.render(latex, ref.current, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, display, ready]);

  return <span ref={ref} className={className} style={{fontSize:"1.25em", ...style}} />;
};

// ── Popover hook & button ─────────────────────────────────────────────────────

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

const LV_LABELS:Record<string,string> = {level1:"Level 1",level2:"Level 2",level3:"Level 3"};
const LV_HEADER_COLORS:Record<string,string> = {level1:"text-green-600",level2:"text-yellow-500",level3:"text-red-600"};


// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "completing" | "roots" | "turning";
type DifficultyLevel = "level1" | "level2" | "level3";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG = {
  pageTitle: "Completing the Square",

  tools: {

    completing: {
      name: "Completing the Square",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: {
          variables: [],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
        level3: {
          variables: [
            { key: "negativeCoefficients", label: "Negative Coefficients", defaultValue: false },
          ],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
      },
    },

    roots: {
      name: "Finding Roots",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: {
          variables: [],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
        level3: {
          variables: [
            { key: "negativeCoefficients", label: "Negative Coefficients", defaultValue: false },
          ],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
      },
    },

    turning: {
      name: "Turning Points",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: {
          variables: [],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
        level3: {
          variables: [
            { key: "negativeCoefficients", label: "Negative Coefficients", defaultValue: false },
          ],
          dropdown: { key: "display", label: "Display", options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }], defaultValue: "decimal" },
        },
      },
    },

  } as Record<string, {
    name: string;
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
  { title: "Completing the Square", icon: "📐", content: [
    { label: "Overview",         detail: "Rewrite a quadratic in the form a(x + p)² + q." },
    { label: "Level 1 — Green",  detail: "Monic quadratics (a = 1) with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics (a = 1) with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics (a ≥ 2). Optional negative leading coefficient." },
  ]},
  { title: "Finding Roots", icon: "✂️", content: [
    { label: "Overview",         detail: "Use the completed square form to solve for x, or identify when there are no real roots." },
    { label: "Level 1 — Green",  detail: "Monic quadratics with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics. Optional negative leading coefficient." },
  ]},
  { title: "Turning Points", icon: "📍", content: [
    { label: "Overview",         detail: "Identify the turning point (vertex) of a quadratic from its completed square form." },
    { label: "Level 1 — Green",  detail: "Monic quadratics with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics. Optional negative leading coefficient." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Negative Coefficients", detail: "Level 3 only. When enabled, the leading coefficient may be negative." },
    { label: "Display: Decimal / Fraction", detail: "Levels 2 & 3 only. Controls whether half-integer values are shown as decimals (e.g. 2.5) or fractions (e.g. 5/2)." },
    { label: "Differentiated",        detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
];

// ── 4. Question interface ─────────────────────────────────────────────────────

interface CTSQuestion {
  kind: "simple";
  display: string;
  displayLatex: string;
  answer: string;
  answerLatex: string;
  working: { type: string; latex: string; plain: string; title?: string }[];
  rawValues: RawValues;
  key: string;
  difficulty: string;
}

type AnyQuestion = CTSQuestion;

// ── 5. Helpers ────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Format a number: integers shown whole, decimals to 2dp
const fmt = (n: number) => n % 1 === 0 ? String(n) : parseFloat(n.toFixed(2)).toString();

// Format as fraction for half- or quarter-integers, otherwise fmt
const fmtF = (n: number): string => {
  if (n % 1 === 0) return String(n);
  if ((n * 2) % 1 === 0) { const num = Math.round(n * 2); return num < 0 ? `-${Math.abs(num)}/2` : `${num}/2`; }
  if ((n * 4) % 1 === 0) { const num = Math.round(n * 4); return num < 0 ? `-${Math.abs(num)}/4` : `${num}/4`; }
  return fmt(n);
};

// Convert "n/d" string to \frac{n}{d}, pass through otherwise
const toLatex = (s: string): string => {
  const m = s.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return `${m[1]}\\frac{${m[2]}}{${m[3]}}`;
  return s;
};

// ── buildDisplay — pure function, called at render time with current display mode ─

interface RawValues { tool: ToolType; a: number; b: number; c: number; p: number; q: number; }

const buildDisplay = (rv: RawValues, useFractions: boolean) => {
  const { tool, a, b, c, p, q } = rv;
  const fmtP = (n: number) => useFractions ? fmtF(n) : fmt(n);
  const L = toLatex;

  // display latex
  const aStr   = a === 1 ? "" : a === -1 ? "-" : a > 0 ? String(a) : `-${Math.abs(a)}`;
  const bAbs   = Math.abs(b);
  const bLatex = b === 0 ? "" : bAbs === 1 ? (b > 0 ? " + x" : " - x") : b > 0 ? ` + ${L(fmtP(b))}x` : ` - ${L(fmtP(bAbs))}x`;
  const cLatex = c === 0 ? "" : c > 0 ? ` + ${L(fmtP(c))}` : ` - ${L(fmtP(Math.abs(c)))}`;
  const displayLatex = `y = ${aStr}x^2${bLatex}${cLatex}`;

  // working steps
  const working: { type: string; latex: string; plain: string; title?: string }[] = [];
  const mkStep = (plain: string, latex: string, title: string) => ({ type: "step", plain, latex, title });

  const pL    = p > 0 ? `+ ${L(fmtP(p))}` : p < 0 ? `- ${L(fmtP(Math.abs(p)))}` : "";
  const pSq   = p * p;
  const pSqL  = L(fmtP(pSq));
  const aPSqL = L(fmtP(a * pSq));
  const cPart = c > 0 ? `+ ${L(fmtP(c))}` : c < 0 ? `- ${L(fmtP(Math.abs(c)))}` : "";

  if (a !== 1) {
    const bOverA = b / a;
    const bOAL   = bOverA > 0 ? `+ ${L(fmtP(bOverA))}x` : bOverA < 0 ? `- ${L(fmtP(Math.abs(bOverA)))}x` : "";
    const cPartF = c > 0 ? ` + ${L(fmtP(c))}` : c < 0 ? ` - ${L(fmtP(Math.abs(c)))}` : "";
    working.push(mkStep(`y = ${a}(x² ...)${cPartF}`, `y = ${a}(x^2 ${bOAL})${cPartF}`, `Factor out ${a}`));
  }

  working.push(mkStep(
    `${a !== 1 ? fmtP(b/a) : b} ÷ 2 = ${fmtP(b/(2*a))}`,
    `${a !== 1 ? L(fmtP(b/a)) : b} \\div 2 = ${L(fmtP(b/(2*a)))}`,
    "Half the coefficient of x",
  ));

  if (a !== 1) {
    working.push(mkStep(`y = ${a}[(x ...)² - ...] ${cPart}`, `y = ${a}\\left[(x ${pL})^2 - ${pSqL}\\right] ${cPart}`, "Complete the square"));
    working.push(mkStep(`y = ${a}(x ...)² - ... ${cPart}`, `y = ${a}(x ${pL})^2 - ${aPSqL} ${cPart}`, "Expand the square brackets"));
  } else {
    working.push(mkStep(`y = [(x ...)² - ...] ${cPart}`, `y = \\left[(x ${pL})^2 - ${pSqL}\\right] ${cPart}`, "Complete the square"));
    working.push(mkStep(`y = (x ...)² - ... ${cPart}`, `y = (x ${pL})^2 - ${pSqL} ${cPart}`, "Expand the square brackets"));
  }

  const aFinal = a === 1 ? "" : a === -1 ? "-" : String(a);
  const qFinalL = q > 0 ? `+ ${L(fmtP(q))}` : q < 0 ? `- ${L(fmtP(Math.abs(q)))}` : "";
  const negP   = -p;
  const negPL  = negP > 0 ? L(fmtP(negP)) : negP < 0 ? `-${L(fmtP(Math.abs(negP)))}` : "0";
  const negPPlain = negP > 0 ? fmtP(negP) : negP < 0 ? `-${fmtP(Math.abs(negP))}` : "0";

  let answer = "";
  let answerLatex = "";

  if (tool === "roots") {
    working.push(mkStep(`0 = ${aFinal}(x ...)² ...`, `0 = ${aFinal}(x ${pL})^2 ${qFinalL}`, "Set equal to zero"));
    working.push(mkStep(`${aFinal}(x ...)² = ${fmtP(-q)}`, `${aFinal}(x ${pL})^2 = ${L(fmtP(-q))}`, "Rearrange"));
    if (q > 0) {
      answer = "No real roots";
      answerLatex = "\\text{No real roots}";
    } else {
      if (a !== 1) working.push(mkStep(`(x ...)² = ${fmtP(-q/a)}`, `(x ${pL})^2 = ${L(fmtP(-q/a))}`, `Divide by ${a}`));
      const sqrtVal = a !== 1 ? -q / a : -q;
      const sqrtL   = sqrtVal % 1 === 0 && Math.sqrt(sqrtVal) % 1 === 0 ? String(Math.sqrt(sqrtVal)) : `\\sqrt{${L(fmtP(sqrtVal))}}`;
      const sqrtPl  = sqrtVal % 1 === 0 && Math.sqrt(sqrtVal) % 1 === 0 ? String(Math.sqrt(sqrtVal)) : `√${fmtP(sqrtVal)}`;
      working.push(mkStep(`x ... = ±${sqrtPl}`, `x ${pL} = \\pm ${sqrtL}`, "Square root both sides"));
      answer      = `x = ${negPPlain} ± ${sqrtPl}`;
      answerLatex = `x = ${negPL} \\pm ${sqrtL}`;
    }
  } else if (tool === "turning") {
    working.push(mkStep(`(x ...)² ≥ 0 for all x`, `(x ${pL})^2 \\geq 0 \\text{ for all } x`, "Minimum value of squared term"));
    working.push(mkStep(`(x ...)² = 0 when x = ${negPPlain}`, `(x ${pL})^2 = 0 \\text{ when } x = ${negPL}`, "Find when the bracket equals zero"));
    working.push(mkStep(`When x = ${negPPlain}, y = ${fmtP(q)}`, `\\text{When } x = ${negPL},\\quad y = ${L(fmtP(q))}`, "Find the y-coordinate"));
    answer      = `(${negPPlain}, ${fmtP(q)})`;
    answerLatex = `\\left(${negPL},\\ ${L(fmtP(q))}\\right)`;
  } else {
    answer      = `y = ${aFinal}(x ...)² ...`;
    answerLatex = `y = ${aFinal}(x ${pL})^2 ${qFinalL}`;
  }

  return { displayLatex, working, answer, answerLatex };
};

// ── 6. Question generator ─────────────────────────────────────────────────────
const generateQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const useNegative  = variables["negativeCoefficients"] ?? false;
  const useFractions = dropdownValue === "fraction";

  let a = 0, b = 0, c = 0, p = 0, q = 0;

  if (level === "level1") {
    a = 1; p = randInt(-9, 9); if (p === 0) p = 1;
  } else if (level === "level2") {
    a = 1; p = randInt(-9, 9) + 0.5;
  } else {
    a = randInt(2, 5);
    if (useNegative && Math.random() > 0.5) a = -a;
    p = Math.random() > 0.5 ? (() => { let v = randInt(-9,9); if (v===0) v=1; return v; })() : randInt(-9,9) + 0.5;
  }

  if (tool === "roots") {
    q = Math.random() < 0.1 ? randInt(1, 15) : -(randInt(1, 15));
  } else {
    if (p % 1 !== 0) {
      if (Math.random() > 0.5) { c = randInt(-8, 8); q = c - a * p * p; }
      else                      { q = randInt(-8, 8); c = a * p * p + q; }
    } else {
      q = randInt(-8, 8);
    }
  }

  b = 2 * a * p;
  c = a * p * p + q;

  const rv: RawValues = { tool, a, b, c, p, q };
  const { displayLatex, working, answer, answerLatex } = buildDisplay(rv, useFractions);
  const key = `${tool}-${level}-${a}-${b}-${c}`;

  return { kind: "simple", display: "", displayLatex, answer, answerLatex, working, rawValues: rv, key, difficulty: level };
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

// ── QuestionDisplay ───────────────────────────────────────────────────────────

const QuestionDisplay = ({ q, cls, useFractions }: { q: AnyQuestion; cls: string; useFractions: boolean }) => {
  const { displayLatex } = buildDisplay((q as any).rawValues, useFractions);
  return (
    <div className={`${cls} font-semibold text-center`} style={{color:"#000",lineHeight:1.5}}>
      <MathRenderer latex={displayLatex} />
    </div>
  );
};


const AnswerDisplay = ({ q, useFractions }: { q: AnyQuestion; useFractions: boolean }) => {
  const { answerLatex } = buildDisplay((q as any).rawValues, useFractions);
  return <MathRenderer latex={answerLatex} />;
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

// ── Popover sub-components ────────────────────────────────────────────────────

const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] };
  value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

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

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: {
  toolSettings: typeof TOOL_CONFIG.tools[string];
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1","level2","level3"] as DifficultyLevel[];
  const getDDForLevel   = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
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
                const dd   = getDDForLevel(lv);
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

  const cols     = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const dateStr = new Date().toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ  = questions.length;

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const anyQ = q as any;
    const ansHtml = showAnswer ? `<div class="q-answer">= ${anyQ.answer ?? ""}</div>` : "";
    return `<div class="q-num">${idx + 1})</div><div style="text-align:center"><span class="q-math">${anyQ.display ?? ""}</span></div>${ansHtml}`;
  };

  const probeHtml  = questions.map((q, i) => `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`).join("");
  const qHtmlData  = questions.map((q, i) => ({ q: questionToHtml(q, i, false), a: questionToHtml(q, i, true), difficulty: q.difficulty }));

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4;margin:${MARGIN_MM}mm}
  body{font-family:"Segoe UI",Arial,sans-serif;background:#fff}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .page-header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:0.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm}
  .page-header h1{font-size:5mm;font-weight:700;color:#1e3a8a}
  .page-header .meta{font-size:3mm;color:#6b7280}
  .grid{display:grid;gap:${GAP_MM}mm}
  .cell,.diff-cell{border:0.3mm solid #d1d5db;border-radius:1mm;padding:${PAD_MM}mm;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative}
  .diff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm}
  .diff-col{display:flex;flex-direction:column;gap:${GAP_MM}mm}
  .diff-header{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm}
  .diff-header.level1{background:#dcfce7;color:#166534}
  .diff-header.level2{background:#fef9c3;color:#854d0e}
  .diff-header.level3{background:#fee2e2;color:#991b1b}
  #probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-family:"Segoe UI",Arial,sans-serif;font-size:${FONT_PX}px;line-height:1.4;width:${cellW_MM - PAD_MM * 2}mm}
  .q-inner{width:100%;text-align:center}
  .q-num{position:absolute;top:0;left:0;font-size:${Math.round(FONT_PX*0.6)}px;font-weight:700;color:#000;line-height:1;padding:1.2mm 1.2mm 1.8mm 1.2mm;border-right:0.3mm solid #000;border-bottom:0.3mm solid #000}
  .q-math{font-size:${FONT_PX}px;display:inline}
  .q-answer{font-size:${FONT_PX}px;color:#059669;display:block;margin-top:1mm;text-align:center}
</style></head><body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxPerMm=3.7795,PAD_MM=${PAD_MM},GAP_MM=${GAP_MM},usableH=${usableH_MM},diffHdrMM=${diffHdrMM};
  var PAGE_W_MM=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var rowHeights=[];for(var r=1;r<=10;r++)rowHeights.push((usableH-GAP_MM*(r-1))/r);
  var qData=${JSON.stringify(qHtmlData)};
  var probe=document.getElementById('probe');
  var maxH_px=0;
  probe.querySelectorAll('.q-inner').forEach(function(el){if(el.scrollHeight>maxH_px)maxH_px=el.scrollHeight;});
  var needed_mm=maxH_px/pxPerMm+PAD_MM*2+6;
  var diffPerCol=Math.floor(totalQ/3),diffUsableH=usableH-diffHdrMM-GAP_MM;
  var diffRowsPerPage=1,diffCellH_mm=diffUsableH;
  for(var rd=0;rd<10;rd++){var h=(diffUsableH-GAP_MM*rd)/(rd+1);if(h>=needed_mm){diffRowsPerPage=rd+1;diffCellH_mm=h;}else break;}
  var chosenH_mm=rowHeights[0],rowsPerPage=1,found=false;
  for(var r=0;r<rowHeights.length;r++){if((r+1)*cols>=totalQ&&rowHeights[r]>=needed_mm){chosenH_mm=rowHeights[r];rowsPerPage=r+1;found=true;break;}}
  if(!found)for(var r2=0;r2<rowHeights.length;r2++){if(rowHeights[r2]>=needed_mm){chosenH_mm=rowHeights[r2];rowsPerPage=r2+1;}}
  var pages=[];
  if(isDiff){var np=Math.ceil(diffPerCol/diffRowsPerPage);for(var p=0;p<np;p++)pages.push(p);}
  else{var cap=rowsPerPage*cols;for(var s=0;s<qData.length;s+=cap)pages.push(qData.slice(s,s+cap));}
  var totalPages=pages.length;
  function makeCellW(c){return(PAGE_W_MM-GAP_MM*(c-1))/c;}
  function buildCell(inner,cW,cH,isDiffCell){return'<div class="'+(isDiffCell?'diff-cell':'cell')+'" style="width:'+cW+'mm;height:'+cH+'mm;"><div class="q-inner">'+inner+'</div></div>';}
  function buildGrid(pageData,showAnswer,cH){
    if(isDiff){
      var pgIdx=pageData,start=pgIdx*diffRowsPerPage,end=start+diffRowsPerPage,cW=makeCellW(3);
      var lvls=['level1','level2','level3'],lbls=['Level 1','Level 2','Level 3'];
      var cols3=lvls.map(function(lv,li){var lqs=qData.filter(function(q){return q.difficulty===lv;}).slice(start,end);return'<div class="diff-col"><div class="diff-header '+lv+'">'+lbls[li]+'</div>'+lqs.map(function(q){return buildCell(showAnswer?q.a:q.q,cW,cH,true);}).join('')+'</div>';}).join('');
      return'<div class="diff-grid" style="grid-template-columns:repeat(3,'+cW+'mm);">'+cols3+'</div>';
    }
    var cW=makeCellW(cols);
    return'<div class="grid" style="grid-template-columns:repeat('+cols+','+cW+'mm);grid-template-rows:repeat('+Math.ceil(pageData.length/cols)+','+cH+'mm);">'+pageData.map(function(item){return buildCell(showAnswer?item.a:item.q,cW,cH,false);}).join('')+'</div>';
  }
  function buildPage(pageData,showAnswer,pgIdx){
    var cH=isDiff?diffCellH_mm:chosenH_mm;
    var lbl=totalPages>1?(isDiff?diffPerCol+' per level':totalQ+' questions')+' ('+(pgIdx+1)+'/'+totalPages+')':(isDiff?diffPerCol+' per level':totalQ+' questions');
    return'<div class="page"><div class="page-header"><h1>'+toolName+(showAnswer?' — Answers':'')+'</h1><div class="meta">'+diffLabel+' &middot; '+dateStr+' &middot; '+lbl+'</div></div>'+buildGrid(pageData,showAnswer,cH)+'</div>';
  }
  document.getElementById('pages').innerHTML=pages.map(function(pg,i){return buildPage(pg,false,i);}).join('')+pages.map(function(pg,i){return buildPage(pg,true,i);}).join('');
  probe.remove();
  setTimeout(function(){window.print();},300);
});
<\/script></body></html>`;

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
  const navigate = useNavigate();

  const [currentTool, setCurrentTool] = useState<ToolType>("completing");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── CONFIG-DRIVEN QO STATE ────────────────────────────────────────────────
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
      // Top-level dropdown
      if (t.dropdown) init[k] = t.dropdown.defaultValue;
      // Per-level dropdowns from difficultySettings
      if (t.difficultySettings) {
        Object.keys(t.difficultySettings).forEach(lv => {
          const dd = t.difficultySettings![lv]?.dropdown;
          if (dd) init[`${k}__${lv}`] = dd.defaultValue;
        });
      }
    });
    return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string,Record<string,boolean>>>({level1:{},level2:{},level3:{}});
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>({level1:"",level2:"",level3:""});

  useEffect(() => {
    const t = TOOL_CONFIG.tools[currentTool];
    setLevelDropdowns(p => {
      const n = {...p};
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        if (dd && !n[lv]) n[lv] = dd.defaultValue;
      });
      return n;
    });
  }, [currentTool]);

  // ── SHARED STATE ──────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion|null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(6);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(2);
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

  const videoRef       = useRef<HTMLVideoElement>(null);
  const streamRef      = useRef<MediaStream|null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress   = useRef(false);

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

  const qBg            = getQuestionBg(colorScheme);
  const stepBg         = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme==="default";
  const fsToolbarBg    = isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg   = isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg    = isDefaultScheme?"#f5f3f0":qBg;

  // ── CONFIG-DRIVEN HELPERS ─────────────────────────────────────────────────
  const getToolSettings    = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig  = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getDropdownValue   = () => {
    const t = TOOL_CONFIG.tools[currentTool];
    const hasLevelDD = t.difficultySettings?.[difficulty]?.dropdown;
    return toolDropdowns[hasLevelDD ? `${currentTool}__${difficulty}` : currentTool] ?? "";
  };
  const setDropdownValue   = (v: string) => {
    const t = TOOL_CONFIG.tools[currentTool];
    const hasLevelDD = t.difficultySettings?.[difficulty]?.dropdown;
    const key = hasLevelDD ? `${currentTool}__${difficulty}` : currentTool;
    setToolDropdowns(p => ({...p, [key]: v}));
  };
  const setVariableValue   = (k: string, v: boolean) => setToolVariables(p => ({...p, [currentTool]: {...p[currentTool], [k]: v}}));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({...p, [lv]: {...p[lv], [k]: v}}));
  const handleLevelDDChange  = (lv: string, v: string) => setLevelDropdowns(p => ({...p, [lv]: v}));

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

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);
  useEffect(()=>{ handleNewQuestion(); },[]);

  const displayFontSizes   = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  const fontSizes   = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length-1;
  const canDecrease = worksheetFontSize > 0;

  const useFractions = getDropdownValue() === "fraction";

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg  = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const cellStyle = {backgroundColor:bg, height:"100%", boxSizing:"border-box" as const, position:"relative" as const};
    const numEl = <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>;
    const built = buildDisplay((q as any).rawValues, useFractions);
    return (
      <div className="p-3" style={cellStyle}>
        {numEl}
        <div className={`${fsz} font-semibold text-center w-full`} style={{color:"#000"}}><MathRenderer latex={built.displayLatex}/></div>
        {showWorksheetAnswers && <div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}><MathRenderer latex={`= ${built.answerLatex}`}/></div>}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if(mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
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
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||6)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
              onChange={e=>{ if(!isDifferentiated) setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||2))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18}/> Generate
          </button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}
            </button>
            <button onClick={()=>handlePrint(worksheet,TOOL_CONFIG.tools[currentTool].name,difficulty,isDifferentiated,numColumns)}
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

    const fontBtnStyle = (enabled: boolean) => ({
      background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,
      cursor:enabled?"pointer":"not-allowed",width:32,height:32,
      display:"flex",alignItems:"center",justifyContent:"center",opacity:enabled?1:0.35,
    });

    const questionBox = () => (
      <div className="rounded-xl flex items-center justify-center flex-shrink-0 p-8" style={{position:"relative",width:"500px",height:"100%",backgroundColor:stepBg}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {currentQuestion
          ? <div className="w-full text-center flex flex-col gap-4 items-center">
              <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} useFractions={useFractions}/>
              {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} useFractions={useFractions}/></div>}
            </div>
          : <span className="text-4xl text-gray-400">Generate question</span>}
      </div>
    );

    const questionBoxFS = () => (
      <div style={{position:"relative",width:"40%",height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:16}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {currentQuestion
          ? <>
              <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} useFractions={useFractions}/>
              {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} useFractions={useFractions}/></div>}
            </>
          : <span className="text-4xl text-gray-400">Generate question</span>}
      </div>
    );

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
              ><Video size={16} color="rgba(255,255,255,0.85)"/></button>
              {camDropdownOpen&&(
                <div style={{position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30}}>
                  <div style={{padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Camera</div>
                  {camDevices.map((d,i)=>(
                    <div key={d.deviceId} onClick={()=>{setCamDropdownOpen(false);if(d.deviceId!==currentCamId)startCam(d.deviceId);}}
                      style={{padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                    ><div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>{d.label||`Camera ${i+1}`}</div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setPresenterMode(true)} title="Visualiser mode"
              style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}
            ><Video size={16} color="#6b7280"/></button>
          )}
          <button onClick={()=>setWbFullscreen(f=>!f)} title={wbFullscreen?"Exit Fullscreen":"Fullscreen"}
            style={{background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:presenterMode?"1px solid rgba(255,255,255,0.15)":"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:presenterMode?"blur(6px)":"none"}}
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

  const renderWorkedExample = () => {
    const builtWorked = currentQuestion ? buildDisplay((currentQuestion as any).rawValues, useFractions) : null;
    return (
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8 w-full" style={{backgroundColor:qBg}}>
        {currentQuestion&&builtWorked?(
          <>
            <div className="text-center py-4 relative">
              <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
                <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayDecrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayDecrease?1:0.35}} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
                <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayIncrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayIncrease?1:0.35}} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
              </div>
              <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} useFractions={useFractions}/>
            </div>
            {showAnswer&&(
              <>
                <div className="space-y-4 mt-8">
                  {builtWorked.working.map((s,i)=>(
                    <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                      <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>
                        Step {i+1}{(s as any).title ? `: ${(s as any).title}` : ""}
                      </h4>
                      <div className="text-2xl" style={{color:"#000"}}><MathRenderer latex={s.latex}/></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
                  <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                    <AnswerDisplay q={currentQuestion} useFractions={useFractions}/>
                  </span>
                </div>
              </>
            )}
          </>
        ):<div className="text-center text-gray-400 text-4xl py-16">Generate question</div>}
      </div>
    </div>
    );
  };

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
          <button onClick={()=>navigate("/")} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
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
              <button key={k} onClick={()=>setCurrentTool(k as ToolType)}
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
