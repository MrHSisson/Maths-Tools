import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || w().katex) { resolve(); return; }
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

const KaTeX = ({ latex, style }: { latex: string; style?: CSSProperties }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !ref.current) return;
    try { w().katex.render(latex, ref.current, { displayMode: false, throwOnError: false, output: "html" }); }
    catch { if (ref.current) ref.current.textContent = latex; }
  }, [latex, ready]);
  return <span ref={ref} style={{ display: "inline", verticalAlign: "baseline", ...style }} />;
};

type Seg = { k: "t"; s: string } | { k: "m"; s: string };
const tx = (s: string): Seg => ({ k: "t", s });
const mx = (s: string): Seg => ({ k: "m", s });

const SegLine = ({ segs, cls, style }: { segs: Seg[]; cls?: string; style?: CSSProperties }) => (
  <span className={cls} style={{ lineHeight: 1.7, ...style }}>
    {segs.map((seg, i) =>
      seg.k === "t" ? <span key={i}>{seg.s}</span> : <KaTeX key={i} latex={seg.s} />
    )}
  </span>
);

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
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "numerical" | "rearranging" | "verification";
type DifficultyLevel = "level1" | "level2" | "level3";
type FormulaType = "quadratic" | "cubic" | "fractional" | "mixed";
type AnswerType = "first3" | "root";

const TOOL_CONFIG = {
  pageTitle: "Iteration",
  tools: {
    numerical: {
      name: "Numerical Processing",
      useSubstantialBoxes: true,
      variables: [{ key: "calcSteps", label: "Calculator Steps", defaultValue: false }],
      dropdown: {
        key: "formulaType", label: "Formula Type", useTwoLineButtons: false,
        options: [
          { value: "mixed",      label: "Mixed"       },
          { value: "quadratic",  label: "√ Quadratic" },
          { value: "cubic",      label: "∛ Cubic"     },
          { value: "fractional", label: "Fractional"  },
        ],
        defaultValue: "mixed",
      },
      difficultySettings: null,
    },
    rearranging: {
      name: "Rearranging & Solving",
      useSubstantialBoxes: true,
      variables: [{ key: "targetFormula", label: "Show Target Formula", defaultValue: true }],
      dropdown: {
        key: "answerType", label: "Answer Type", useTwoLineButtons: true,
        options: [
          { value: "first3", label: "First 3",   sub: "x₁, x₂, x₃" },
          { value: "root",   label: "Find Root",  sub: "to 2 d.p."   },
        ],
        defaultValue: "root",
      },
      difficultySettings: null,
    },
    verification: {
      name: "Root Verification",
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },
  } as Record<string, {
    name: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
    difficultySettings: null;
  }>,
};

const INFO_SECTIONS = [
  { title: "Numerical Processing", icon: "🔢", content: [
    { label: "Overview",          detail: "Apply an iterative formula xₙ₊₁ = f(xₙ) repeatedly from a given starting value." },
    { label: "Level 1 — Green",   detail: "Integer x₀, produce x₁, x₂, x₃. Covers √, ∛, and fractional forms." },
    { label: "Level 2 — Yellow",  detail: "Decimal x₀, produce x₁ through x₅." },
    { label: "Level 3 — Red",     detail: "Iterate to convergence and state the root to 2 decimal places." },
    { label: "Calculator Steps",  detail: "Toggle on to show a tip for using ANS on a calculator (Worked Example only)." },
  ]},
  { title: "Rearranging & Solving", icon: "✏️", content: [
    { label: "Overview",          detail: "Rearrange an equation algebraically to produce an iterative formula, then apply it." },
    { label: "Level 1 — Green",   detail: "Quadratic: x² − ax − b = 0 → x = √(ax + b)" },
    { label: "Level 2 — Yellow",  detail: "Cubic: x³ − ax − b = 0 → x = ∛(ax + b)" },
    { label: "Level 3 — Red",     detail: "Fractional: x² − bx − a = 0 → x = a/x + b" },
    { label: "Show Target Formula", detail: "'Show that…' style when on; open rearrangement when off." },
    { label: "Answer Type",       detail: "First 3: find x₁, x₂, x₃. Find Root: iterate to convergence at 2 d.p." },
  ]},
  { title: "Root Verification", icon: "✅", content: [
    { label: "Overview",          detail: "Use the change of sign method to verify that a root lies in a given interval." },
    { label: "Level 1 — Green",   detail: "Verify a root between two consecutive integers." },
    { label: "Level 2 — Yellow",  detail: "Verify a root correct to 1 decimal place (bounds to 2 d.p.)." },
    { label: "Level 3 — Red",     detail: "Verify a root correct to 2 decimal places (bounds to 3 d.p.)." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",        detail: "Single question with working space. Visualiser available for document cameras." },
    { label: "Worked Example",    detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",         detail: "Grid of questions. Supports differentiated layout and PDF export." },
  ]},
];

// ── Maths helpers ─────────────────────────────────────────────────────────────

const fmtD = (v: number, dp: number) => v.toFixed(dp);
const roundTo = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp;
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const xSub  = (n: number) => `x_{${n}}`;
const xNext = "x_{n+1}";
const xn    = "x_n";

const sqrtFormula  = (a: number, b: number) => `\\sqrt{${a}${xn} + ${b}}`;
const cbrtFormula  = (a: number, b: number) => `\\sqrt[3]{${a}${xn} + ${b}}`;
const fracFormula  = (a: number, b: number) => `\\dfrac{${a}}{${xn}} + ${b}`;

const sqrtStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\sqrt{${a} \\times ${fmtD(prev,4)} + ${b}} = \\sqrt{${fmtD(a*prev+b,4)}} = ${fmtD(result,4)}`;

const cbrtStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\sqrt[3]{${a} \\times ${fmtD(prev,4)} + ${b}} = \\sqrt[3]{${fmtD(a*prev+b,4)}} = ${fmtD(result,4)}`;

const fracStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\dfrac{${a}}{${fmtD(prev,4)}} + ${b} = ${fmtD(result,4)}`;

// ── Question interface ────────────────────────────────────────────────────────

interface WorkingStep {
  latex: string;
  plain: string;
  isTip?: boolean;
}

interface IterQuestion {
  kind: "iter";
  display: Seg[];
  answerSegs: Seg[];
  displayPlain: string;
  answerPlain: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
}

type AnyQuestion = IterQuestion;

// ── NUMERICAL ─────────────────────────────────────────────────────────────────

const genNumerical = (level: DifficultyLevel, calcSteps: boolean, formulaType: FormulaType): IterQuestion => {
  const selected = formulaType === "mixed"
    ? (["quadratic","cubic","fractional"] as const)[randInt(0,2)]
    : formulaType;

  let a: number, b: number, x0: number;
  let fDisplay: string, fPlain: string;
  let iterations: number[];
  let convergedValue: number | undefined;
  const targetDP = 2;

  const iter = (start: number, fn: (x: number) => number, n: number) => {
    const r: number[] = []; let c = start;
    for (let i = 0; i < n; i++) { c = fn(c); r.push(c); }
    return r;
  };
  const iterConverge = (start: number, fn: (x: number) => number, dp: number) => {
    const r: number[] = []; let c = start, prev = start;
    for (let i = 0; i < 30; i++) {
      c = fn(c); r.push(c);
      if (i > 0 && roundTo(c,dp) === roundTo(prev,dp)) break;
      prev = c;
    }
    return { iters: r, converged: roundTo(r[r.length-1],dp) };
  };

  if (level === "level1") {
    x0 = randInt(1,5);
    if (selected === "quadratic") {
      a = randInt(2,6); b = randInt(1,5);
      fDisplay = sqrtFormula(a,b); fPlain = `sqrt(${a}x+${b})`;
      iterations = iter(x0, x => Math.sqrt(a*x+b), 3);
    } else if (selected === "cubic") {
      a = randInt(5,12); b = randInt(1,10);
      fDisplay = cbrtFormula(a,b); fPlain = `cbrt(${a}x+${b})`;
      iterations = iter(x0, x => Math.cbrt(a*x+b), 3);
    } else {
      a = randInt(2,7); b = randInt(1,4); x0 = randInt(2,4);
      fDisplay = fracFormula(a,b); fPlain = `${a}/x+${b}`;
      iterations = iter(x0, x => a/x+b, 3);
    }
  } else if (level === "level2") {
    x0 = randInt(10,39)/10;
    if (selected === "quadratic") {
      a = randInt(2,5); b = randInt(1,6);
      fDisplay = sqrtFormula(a,b); fPlain = `sqrt(${a}x+${b})`;
      iterations = iter(x0, x => Math.sqrt(a*x+b), 5);
    } else if (selected === "cubic") {
      a = randInt(5,12); b = randInt(1,10);
      fDisplay = cbrtFormula(a,b); fPlain = `cbrt(${a}x+${b})`;
      iterations = iter(x0, x => Math.cbrt(a*x+b), 5);
    } else {
      a = randInt(3,10); b = randInt(1,5); x0 = randInt(15,34)/10;
      fDisplay = fracFormula(a,b); fPlain = `${a}/x+${b}`;
      iterations = iter(x0, x => a/x+b, 5);
    }
  } else {
    x0 = randInt(10,39)/10;
    if (selected === "quadratic") {
      a = randInt(2,5); b = randInt(1,6);
      fDisplay = sqrtFormula(a,b); fPlain = `sqrt(${a}x+${b})`;
      const r = iterConverge(x0, x => Math.sqrt(a*x+b), targetDP);
      iterations = r.iters; convergedValue = r.converged;
    } else if (selected === "cubic") {
      a = randInt(5,12); b = randInt(1,10);
      fDisplay = cbrtFormula(a,b); fPlain = `cbrt(${a}x+${b})`;
      const r = iterConverge(x0, x => Math.cbrt(a*x+b), targetDP);
      iterations = r.iters; convergedValue = r.converged;
    } else {
      a = randInt(2,11); b = randInt(1,6); x0 = randInt(15,34)/10;
      fDisplay = fracFormula(a,b); fPlain = `${a}/x+${b}`;
      const r = iterConverge(x0, x => a/x+b, targetDP);
      iterations = r.iters; convergedValue = r.converged;
    }
  }

  const numShow = level === "level1" ? 3 : level === "level2" ? 5 : iterations!.length;

  const findSegs: Seg[] = level === "level1"
    ? [tx(", find "), mx(`${xSub(1)}, ${xSub(2)}, ${xSub(3)}`)]
    : level === "level2"
    ? [tx(", find "), mx(`${xSub(1)}`), tx(" to "), mx(`${xSub(5)}`)]
    : [tx(", find the root to "), tx(`${targetDP} d.p.`)];

  const display: Seg[] = [
    tx("Using "), mx(`${xSub(0)} = ${x0}`), tx(" and "), mx(`${xNext} = ${fDisplay!}`),
    ...findSegs,
  ];
  const displayPlain = `Using x0=${x0} and x(n+1)=${fPlain!}`;

  const answerSegs: Seg[] = level === "level1"
    ? [mx(`${xSub(1)}=${fmtD(iterations![0],3)},\\;${xSub(2)}=${fmtD(iterations![1],3)},\\;${xSub(3)}=${fmtD(iterations![2],3)}`)]
    : level === "level2"
    ? [mx(`${xSub(5)} = ${fmtD(iterations![4],4)}`)]
    : [mx(`x = ${fmtD(convergedValue!,targetDP)}`)];
  const answerPlain = level === "level1"
    ? `x1=${fmtD(iterations![0],3)}, x2=${fmtD(iterations![1],3)}, x3=${fmtD(iterations![2],3)}`
    : level === "level2" ? `x5=${fmtD(iterations![4],4)}` : `x=${fmtD(convergedValue!,targetDP)}`;

  const working: WorkingStep[] = [];
  working.push({ latex: `${xSub(0)} = ${x0}`, plain: `x0=${x0}` });

  for (let i = 0; i < numShow!; i++) {
    const prev = i === 0 ? x0! : iterations![i-1];
    let latex: string;
    if (selected === "quadratic") latex = sqrtStep(i+1,prev,a!,b!,iterations![i]);
    else if (selected === "cubic") latex = cbrtStep(i+1,prev,a!,b!,iterations![i]);
    else latex = fracStep(i+1,prev,a!,b!,iterations![i]);
    working.push({ latex, plain: latex });
  }

  if (level === "level3" && convergedValue !== undefined) {
    const last = iterations!.slice(-2);
    const n = iterations!.length;
    working.push({ latex: `${xSub(n-1)} = ${fmtD(last[0],4)} \\rightarrow ${fmtD(roundTo(last[0],targetDP),targetDP)}`, plain: `x${n-1}=${fmtD(last[0],4)}` });
    working.push({ latex: `${xSub(n)} = ${fmtD(last[1],4)} \\rightarrow ${fmtD(roundTo(last[1],targetDP),targetDP)}`, plain: `x${n}=${fmtD(last[1],4)}` });
    working.push({ latex: `\\text{Both round to } ${fmtD(convergedValue,targetDP)} \\Rightarrow x = ${fmtD(convergedValue,targetDP)}`, plain: `Root=${fmtD(convergedValue,targetDP)}` });
  }

  if (calcSteps) {
    let tip: string;
    if (selected === "quadratic") tip = `\\text{Calculator: } ${x0} \\text{, press =. Then } \\sqrt{${a!} \\times \\text{ANS} + ${b!}}\\text{, press = repeatedly.}`;
    else if (selected === "cubic") tip = `\\text{Calculator: } ${x0} \\text{, press =. Then } \\sqrt[3]{${a!} \\times \\text{ANS} + ${b!}}\\text{, press = repeatedly.}`;
    else tip = `\\text{Calculator: } ${x0} \\text{, press =. Then } \\dfrac{${a!}}{\\text{ANS}} + ${b!}\\text{, press = repeatedly.}`;
    working.push({ latex: tip, plain: `Calculator tip for ${fPlain!}`, isTip: true });
  }

  return {
    kind: "iter", display, displayPlain, answerSegs, answerPlain, working,
    key: `num-${selected}-${a!}-${b!}-${x0}-${Math.random()}`,
    difficulty: level,
  };
};

// ── REARRANGING ───────────────────────────────────────────────────────────────

const genRearranging = (level: DifficultyLevel, showTarget: boolean, answerType: AnswerType): IterQuestion => {
  let a: number, b: number, x0: number;
  let eqLatex: string, targetLatex: string, eqPlain: string;
  let iterFn: (x: number) => number;
  const working: WorkingStep[] = [];

  if (level === "level1") {
    a = randInt(2,5); b = randInt(1,5); x0 = randInt(1,3);
    eqLatex = `x^2 - ${a}x - ${b} = 0`; eqPlain = `x²−${a}x−${b}=0`;
    targetLatex = sqrtFormula(a,b);
    iterFn = x => Math.sqrt(a*x+b);
    working.push({ latex: `\\text{Start: } ${eqLatex}`, plain: `Start: ${eqPlain}` });
    working.push({ latex: `x^2 = ${a}x + ${b}`, plain: `x²=${a}x+${b}` });
    working.push({ latex: `${xNext} = \\sqrt{${a}x + ${b}} \\checkmark`, plain: `x(n+1)=sqrt(${a}x+${b})` });
  } else if (level === "level2") {
    a = randInt(2,5); b = randInt(1,6); x0 = randInt(1,2);
    eqLatex = `x^3 - ${a}x - ${b} = 0`; eqPlain = `x³−${a}x−${b}=0`;
    targetLatex = cbrtFormula(a,b);
    iterFn = x => Math.cbrt(a*x+b);
    working.push({ latex: `\\text{Start: } ${eqLatex}`, plain: `Start: ${eqPlain}` });
    working.push({ latex: `x^3 = ${a}x + ${b}`, plain: `x³=${a}x+${b}` });
    working.push({ latex: `${xNext} = \\sqrt[3]{${a}x + ${b}} \\checkmark`, plain: `x(n+1)=cbrt(${a}x+${b})` });
  } else {
    a = randInt(2,7); b = randInt(1,3); x0 = randInt(2,3);
    eqLatex = `x^2 - ${b}x - ${a} = 0`; eqPlain = `x²−${b}x−${a}=0`;
    targetLatex = fracFormula(a,b);
    iterFn = x => a/x+b;
    working.push({ latex: `\\text{Start: } ${eqLatex}`, plain: `Start: ${eqPlain}` });
    working.push({ latex: `x^2 = ${b}x + ${a}`, plain: `x²=${b}x+${a}` });
    working.push({ latex: `x = ${b} + \\dfrac{${a}}{x}`, plain: `x=${b}+${a}/x` });
    working.push({ latex: `${xNext} = \\dfrac{${a}}{${xn}} + ${b} \\checkmark`, plain: `x(n+1)=${a}/x+${b}` });
  }

  let iterations: number[] = [];
  if (answerType === "first3") {
    let c = x0;
    for (let i = 0; i < 3; i++) { c = iterFn(c); iterations.push(c); }
  } else {
    let c = x0, prev = x0;
    for (let i = 0; i < 30; i++) {
      c = iterFn(c); iterations.push(c);
      if (i > 0 && roundTo(c,2) === roundTo(prev,2)) break;
      prev = c;
    }
  }
  const root = roundTo(iterations[iterations.length-1],2);
  const numShow = answerType === "first3" ? 3 : iterations.length;

  working.push({ latex: `${xSub(0)} = ${x0}`, plain: `x0=${x0}` });
  for (let i = 0; i < numShow; i++) {
    const prev = i === 0 ? x0 : iterations[i-1];
    let latex: string;
    if (level === "level1") latex = sqrtStep(i+1,prev,a!,b!,iterations[i]);
    else if (level === "level2") latex = cbrtStep(i+1,prev,a!,b!,iterations[i]);
    else latex = fracStep(i+1,prev,a!,b!,iterations[i]);
    working.push({ latex, plain: latex });
  }

  if (answerType === "root" && iterations.length >= 2) {
    const last = iterations.slice(-2);
    const n = iterations.length;
    working.push({ latex: `${xSub(n-1)} = ${fmtD(last[0],4)} \\rightarrow ${fmtD(roundTo(last[0],2),2)}`, plain: `x${n-1}=${fmtD(last[0],4)}` });
    working.push({ latex: `${xSub(n)} = ${fmtD(last[1],4)} \\rightarrow ${fmtD(roundTo(last[1],2),2)}`, plain: `x${n}=${fmtD(last[1],4)}` });
    working.push({ latex: `\\text{Both round to } ${fmtD(root,2)} \\Rightarrow x = ${fmtD(root,2)}`, plain: `Root=${fmtD(root,2)}` });
  }

  const taskSegs: Seg[] = answerType === "first3"
    ? [tx(". Using "), mx(`${xSub(0)} = ${x0}`), tx(", find "), mx(`${xSub(1)}, ${xSub(2)}, ${xSub(3)}.`)]
    : [tx(". Using "), mx(`${xSub(0)} = ${x0}`), tx(", find the root to 2 d.p.")];

  const display: Seg[] = showTarget
    ? [tx("Show that "), mx(eqLatex), tx(" can be written as "), mx(`${xNext} = ${targetLatex}`), ...taskSegs]
    : [tx("Rearrange "), mx(eqLatex), tx(" into an iterative formula"), ...taskSegs];

  const displayPlain = (showTarget ? `Show that ${eqPlain}` : `Rearrange ${eqPlain}`) + ` Using x0=${x0}`;

  const answerSegs: Seg[] = answerType === "first3"
    ? [mx(`${xSub(1)}=${fmtD(iterations[0],4)},\\;${xSub(2)}=${fmtD(iterations[1],4)},\\;${xSub(3)}=${fmtD(iterations[2],4)}`)]
    : [mx(`x = ${fmtD(root,2)}`)];
  const answerPlain = answerType === "first3"
    ? `x1=${fmtD(iterations[0],4)}, x2=${fmtD(iterations[1],4)}, x3=${fmtD(iterations[2],4)}`
    : `x=${fmtD(root,2)}`;

  return {
    kind: "iter", display, displayPlain, answerSegs, answerPlain, working,
    key: `rear-${a!}-${b!}-${x0}-${Math.random()}`,
    difficulty: level,
  };
};

// ── VERIFICATION ──────────────────────────────────────────────────────────────

const genVerification = (level: DifficultyLevel): IterQuestion => {
  const useCubic = Math.random() < 0.5;
  const a = randInt(2,5), b = randInt(2,9);
  const working: WorkingStep[] = [];

  let root: number, lBound: number, uBound: number;
  let eqLatex: string, fxLatex: string, eqPlain: string;
  let fL: number, fU: number;

  if (useCubic) {
    let x = 2;
    for (let i = 0; i < 20; i++) { const fx=x**3-a*x-b, fpx=3*x**2-a; if(Math.abs(fpx)>1e-9) x-=fx/fpx; }
    if (level==="level1") { lBound=Math.floor(x); uBound=Math.ceil(x); if(lBound===uBound) uBound++; root=x; }
    else if (level==="level2") { root=roundTo(x,1); lBound=roundTo(root-0.05,2); uBound=roundTo(root+0.05,2); }
    else { root=roundTo(x,2); lBound=roundTo(root-0.005,3); uBound=roundTo(root+0.005,3); }
    eqLatex=`x^3 - ${a}x - ${b}`; fxLatex=`x^3 - ${a}x - ${b}`; eqPlain=`x³−${a}x−${b}=0`;
    fL=lBound**3-a*lBound-b; fU=uBound**3-a*uBound-b;
  } else {
    const disc=a*a+4*b, x=(a+Math.sqrt(disc))/2;
    if (level==="level1") { lBound=Math.floor(x); uBound=Math.ceil(x); if(lBound===uBound) uBound++; root=x; }
    else if (level==="level2") { root=roundTo(x,1); lBound=roundTo(root-0.05,2); uBound=roundTo(root+0.05,2); }
    else { root=roundTo(x,2); lBound=roundTo(root-0.005,3); uBound=roundTo(root+0.005,3); }
    eqLatex=`x^2 - ${a}x - ${b}`; fxLatex=`x^2 - ${a}x - ${b}`; eqPlain=`x²−${a}x−${b}=0`;
    fL=lBound**2-a*lBound-b; fU=uBound**2-a*uBound-b;
  }

  const bDP = level==="level3"?3:level==="level2"?2:0;
  const lS=fmtD(lBound,bDP), uS=fmtD(uBound,bDP);
  const lSign=fL<0?"negative":"positive", uSign=fU<0?"negative":"positive";
  const fCalc = (xStr: string) => useCubic ? `${xStr}^3 - ${a}(${xStr}) - ${b}` : `${xStr}^2 - ${a}(${xStr}) - ${b}`;

  working.push({ latex: `f(x) = ${fxLatex}`, plain: `f(x)=${eqPlain}` });
  working.push({ latex: `\\text{Test bounds: } x = ${lS} \\text{ and } x = ${uS}`, plain: `Test x=${lS} and x=${uS}` });
  working.push({ latex: `f(${lS}) = ${fCalc(lS)} = ${fmtD(fL,4)}`, plain: `f(${lS})=${fmtD(fL,4)}` });
  working.push({ latex: `f(${uS}) = ${fCalc(uS)} = ${fmtD(fU,4)}`, plain: `f(${uS})=${fmtD(fU,4)}` });
  working.push({ latex: `f(${lS}) \\text{ is ${lSign}},\\quad f(${uS}) \\text{ is ${uSign}}`, plain: `Signs: ${lSign}, ${uSign}` });
  working.push({ latex: `\\text{Change of sign} \\Rightarrow \\text{root} \\in [${lS},\\,${uS}]`, plain: `Root in [${lS},${uS}]` });
  if (level !== "level1") {
    working.push({ latex: `\\therefore\\, x = ${level==="level2"?fmtD(root,1):fmtD(root,2)} \\text{ to ${level==="level2"?"1":"2"} d.p.} \\checkmark`, plain: `Root=${level==="level2"?fmtD(root,1):fmtD(root,2)}` });
  }

  let display: Seg[];
  if (level==="level1") {
    display = [tx("The equation "), mx(eqLatex), tx(" = 0 has a root between "), tx(`${lBound}`), tx(" and "), tx(`${uBound}`), tx(". Use the change of sign method to verify this.")];
  } else if (level==="level2") {
    display = [tx("Show that "), mx(eqLatex), tx(" = 0 has a root equal to "), mx(fmtD(root,1)), tx(" correct to 1 decimal place.")];
  } else {
    display = [tx("Show that "), mx(eqLatex), tx(" = 0 has a root equal to "), mx(fmtD(root,2)), tx(" correct to 2 decimal places.")];
  }
  const displayPlain = level==="level1" ? `${eqPlain} root between ${lBound} and ${uBound}` : `Show ${eqPlain} root=${level==="level2"?fmtD(root,1):fmtD(root,2)}`;

  const answerSegs: Seg[] = level==="level1"
    ? [tx(`f(${lBound})=${fmtD(fL,2)} (${lSign}), f(${uBound})=${fmtD(fU,2)} (${uSign}). Change of sign ✓`)]
    : [mx(`\\text{Change of sign on } [${lS},\\,${uS}] \\Rightarrow x = ${level==="level2"?fmtD(root,1):fmtD(root,2)}`)];
  const answerPlain = level==="level1"
    ? `f(${lBound})=${fmtD(fL,2)}, f(${uBound})=${fmtD(fU,2)}, change of sign`
    : `Root=${level==="level2"?fmtD(root,1):fmtD(root,2)}`;

  return {
    kind: "iter", display, displayPlain, answerSegs, answerPlain, working,
    key: `ver-${useCubic?"c":"q"}-${a}-${b}-${Math.random()}`,
    difficulty: level,
  };
};

// ── generateQuestion / generateUniqueQ ───────────────────────────────────────

const generateQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string): AnyQuestion => {
  if (tool==="numerical") return genNumerical(level, variables["calcSteps"]??false, (dropdownValue||"mixed") as FormulaType);
  if (tool==="rearranging") return genRearranging(level, variables["targetFormula"]??true, (dropdownValue||"root") as AnswerType);
  return genVerification(level);
};

const generateUniqueQ = (tool: ToolType, level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion, attempts=0;
  do { q=generateQuestion(tool,level,variables,dropdownValue); attempts++; }
  while (usedKeys.has(q.key) && attempts<100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHELL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LV_COLORS: Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};
const getQuestionBg = (cs:string) => ({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg    = (cs:string) => ({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

const InfoModal = ({onClose}:{onClose:()=>void}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{height:"80vh"}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features</p></div>
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

const MenuDropdown = ({colorScheme,setColorScheme,onClose,onOpenInfo}:{colorScheme:string;setColorScheme:(s:string)=>void;onClose:()=>void;onOpenInfo:()=>void}) => {
  const [colorOpen,setColorOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{minWidth:"200px"}}>
      <div className="py-1">
        <button onClick={()=>setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 capitalize">{colorScheme}</span>
        </button>
        {colorOpen&&(
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s=>(
              <button key={s} onClick={()=>{setColorScheme(s);onClose();}}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}{colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={()=>{onOpenInfo();onClose();}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

const DifficultyToggle = ({value,onChange}:{value:string;onChange:(v:string)=>void}) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
      <button key={val} onClick={()=>onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

const DropdownSection = ({dropdown,value,onChange}:{dropdown:{key:string;label:string;useTwoLineButtons?:boolean;options:{value:string;label:string;sub?:string}[]};value:string;onChange:(v:string)=>void}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt=>dropdown.useTwoLineButtons?(
        <button key={opt.value} onClick={()=>onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 flex flex-col items-center transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
          <span className="text-base font-bold leading-tight">{opt.label}</span>
          {opt.sub&&<span className={`text-xs mt-0.5 ${value===opt.value?"text-blue-200":"text-gray-400"}`}>{opt.sub}</span>}
        </button>
      ):(
        <button key={opt.value} onClick={()=>onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const VariablesSection = ({variables,values,onChange}:{variables:{key:string;label:string}[];values:Record<string,boolean>;onChange:(k:string,v:boolean)=>void}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v=>(
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={()=>onChange(v.key,!values[v.key])} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key]?"bg-blue-900":"bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key]?"translate-x-7":"translate-x-1"}`}/>
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const QOPopover = ({variables,variableValues,onVariableChange,dropdown,dropdownValue,onDropdownChange}:{variables:{key:string;label:string}[];variableValues:Record<string,boolean>;onVariableChange:(k:string,v:boolean)=>void;dropdown:{key:string;label:string;useTwoLineButtons?:boolean;options:{value:string;label:string;sub?:string}[]}|null;dropdownValue:string;onDropdownChange:(v:string)=>void}) => {
  const {open,setOpen,ref}=usePopover();
  if(!dropdown && variables.length===0) return null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown&&<DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange}/>}
          {variables.length>0&&<VariablesSection variables={variables} values={variableValues} onChange={onVariableChange}/>}
        </div>
      )}
    </div>
  );
};

// ── Print ─────────────────────────────────────────────────────────────────────

const handlePrint = (questions: AnyQuestion[], toolName: string, difficulty: string, isDifferentiated: boolean, numColumns: number) => {
  const FONT_PX=14, PAD_MM=3, MARGIN_MM=12, HEADER_MM=14, GAP_MM=2;
  const PAGE_H_MM=297-MARGIN_MM*2, PAGE_W_MM=210-MARGIN_MM*2;
  const usableH_MM=PAGE_H_MM-HEADER_MM, diffHdrMM=7;
  const diffLabel=isDifferentiated?"Differentiated":difficulty==="level1"?"Level 1":difficulty==="level2"?"Level 2":"Level 3";
  const dateStr=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const totalQ=questions.length;
  const cols=isDifferentiated?3:numColumns;
  const cellW_MM=isDifferentiated?(PAGE_W_MM-GAP_MM*2)/3:(PAGE_W_MM-GAP_MM*(numColumns-1))/numColumns;

  // Render Seg[] as HTML — prose as plain spans, maths as katex-render spans
  const segsToHtml = (segs: Seg[]): string =>
    segs.map(seg =>
      seg.k === "t"
        ? `<span>${seg.s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>`
        : `<span class="kr" data-latex="${seg.s.replace(/"/g,"&quot;")}"></span>`
    ).join("");

  // Build question HTML: number badge + display segs + optional answer segs
  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const num = `<div class="q-num">${idx+1})</div>`;
    const body = `<div class="q-body">${segsToHtml(q.display)}</div>`;
    const ans  = showAnswer ? `<div class="q-answer">${segsToHtml(q.answerSegs)}</div>` : "";
    return `${num}${body}${ans}`;
  };

  const probeHtml = questions.map((q,i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q,i,true)}</div>`
  ).join("");

  const qHtmlData = questions.map((q,i) => ({
    q: questionToHtml(q,i,false),
    a: questionToHtml(q,i,true),
    difficulty: q.difficulty,
  }));

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4;margin:${MARGIN_MM}mm;}
body{font-family:"Segoe UI",Arial,sans-serif;background:#fff;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.ph .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}
.cell,.dc{border:.3mm solid #d1d5db;border-radius:1mm;padding:${PAD_MM}mm;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;}
.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}
.dcol{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.dh{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.dh.level1{background:#dcfce7;color:#166534;}.dh.level2{background:#fef9c3;color:#854d0e;}.dh.level3{background:#fee2e2;color:#991b1b;}
#probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-family:"Segoe UI",Arial,sans-serif;font-size:${FONT_PX}px;line-height:1.5;width:${cellW_MM-PAD_MM*2}mm;}
.q-inner{width:100%;text-align:center;}
.q-num{position:absolute;top:0;left:0;font-size:${Math.round(FONT_PX*.6)}px;font-weight:700;color:#000;line-height:1;padding:1.2mm 1.2mm 1.8mm 1.2mm;border-right:.3mm solid #000;border-bottom:.3mm solid #000;}
.q-body{font-size:${FONT_PX}px;line-height:1.5;text-align:center;word-break:break-word;white-space:normal;}
.q-answer{font-size:${FONT_PX}px;color:#059669;margin-top:1mm;text-align:center;}
.kr{display:inline;vertical-align:baseline;}
</style>
</head><body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxPerMm=3.7795;
  var PAD_MM=${PAD_MM},GAP_MM=${GAP_MM},usableH=${usableH_MM},diffHdrMM=${diffHdrMM};
  var PAGE_W_MM=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${diffLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var qData=${JSON.stringify(qHtmlData)};

  // Step 1: render KaTeX in probe
  var probe=document.getElementById('probe');
  probe.querySelectorAll('.kr').forEach(function(el){
    try{katex.render(el.getAttribute('data-latex'),el,{throwOnError:false,output:'html'});}
    catch(e){el.textContent=el.getAttribute('data-latex');}
  });

  // Step 2: measure tallest question+answer content
  var maxH_px=0;
  probe.querySelectorAll('.q-inner').forEach(function(el){
    if(el.scrollHeight>maxH_px)maxH_px=el.scrollHeight;
  });
  var needed_mm=maxH_px/pxPerMm+PAD_MM*2+6;

  // Step 3: pre-compute row heights for 1–10 rows
  var rowHeights=[];
  for(var r=1;r<=10;r++) rowHeights.push((usableH-GAP_MM*(r-1))/r);

  // Step 4: find optimal row count — smallest rows where all fit AND content fits
  var chosenH_mm=rowHeights[0],rowsPerPage=1,found=false;
  for(var r=0;r<rowHeights.length;r++){
    var cap=(r+1)*cols;
    if(cap>=totalQ&&rowHeights[r]>=needed_mm){chosenH_mm=rowHeights[r];rowsPerPage=r+1;found=true;break;}
  }
  if(!found){
    for(var r2=0;r2<rowHeights.length;r2++){
      if(rowHeights[r2]>=needed_mm){chosenH_mm=rowHeights[r2];rowsPerPage=r2+1;}
    }
  }

  // Differentiated sizing
  var diffPerCol=Math.floor(totalQ/3),diffUsableH=usableH-diffHdrMM-GAP_MM;
  var diffRowsPerPage=1,diffCellH_mm=diffUsableH;
  for(var rd=0;rd<10;rd++){
    var hd=(diffUsableH-GAP_MM*rd)/(rd+1);
    if(hd>=needed_mm){diffRowsPerPage=rd+1;diffCellH_mm=hd;}else break;
  }

  // Step 5: split into pages
  var pages=[];
  if(isDiff){
    var numDiffPages=Math.ceil(diffPerCol/diffRowsPerPage);
    for(var p=0;p<numDiffPages;p++) pages.push(p);
  } else {
    var cap2=rowsPerPage*cols;
    for(var s=0;s<qData.length;s+=cap2) pages.push(qData.slice(s,s+cap2));
  }
  var totalPages=pages.length;

  function makeCellW(c){return(PAGE_W_MM-GAP_MM*(c-1))/c;}

  function buildCell(inner,cW,cH,isDiffCell){
    var cls=isDiffCell?'dc':'cell';
    return'<div class="'+cls+'" style="width:'+cW+'mm;height:'+cH+'mm;"><div class="q-inner">'+inner+'</div></div>';
  }

  function renderKatex(container){
    container.querySelectorAll('.kr').forEach(function(el){
      try{katex.render(el.getAttribute('data-latex'),el,{throwOnError:false,output:'html'});}
      catch(e){el.textContent=el.getAttribute('data-latex');}
    });
  }

  function buildGrid(pageData,showAnswer,cH){
    if(isDiff){
      var pgIdx=pageData,start=pgIdx*diffRowsPerPage,end=start+diffRowsPerPage;
      var cW=makeCellW(3);
      var lvls=['level1','level2','level3'],lbls=['Level 1','Level 2','Level 3'];
      var cols3=lvls.map(function(lv,li){
        var lqs=qData.filter(function(q){return q.difficulty===lv;}).slice(start,end);
        var cells=lqs.map(function(q){return buildCell(showAnswer?q.a:q.q,cW,cH,true);}).join('');
        return'<div class="dcol"><div class="dh '+lv+'">'+lbls[li]+'</div>'+cells+'</div>';
      }).join('');
      return'<div class="dg" style="grid-template-columns:repeat(3,'+cW+'mm);">'+cols3+'</div>';
    }
    var cW=makeCellW(cols);
    var gridRows=Math.ceil(pageData.length/cols);
    var cells=pageData.map(function(item){return buildCell(showAnswer?item.a:item.q,cW,cH,false);}).join('');
    return'<div class="grid" style="grid-template-columns:repeat('+cols+','+cW+'mm);grid-template-rows:repeat('+gridRows+','+cH+'mm);">'+cells+'</div>';
  }

  function buildPage(pageData,showAnswer,pgIdx){
    var cH=isDiff?diffCellH_mm:chosenH_mm;
    var lbl=totalPages>1
      ?(isDiff?diffPerCol+' per level':totalQ+' questions')+' ('+(pgIdx+1)+'/'+totalPages+')'
      :(isDiff?diffPerCol+' per level':totalQ+' questions');
    var title=toolName+(showAnswer?' — Answers':'');
    return'<div class="page"><div class="ph"><h1>'+title+'</h1><div class="meta">'+diffLabel+' &middot; '+dateStr+' &middot; '+lbl+'</div></div>'+buildGrid(pageData,showAnswer,cH)+'</div>';
  }

  var html=pages.map(function(pg,i){return buildPage(pg,false,i);}).join('')
           +pages.map(function(pg,i){return buildPage(pg,true,i);}).join('');
  document.getElementById('pages').innerHTML=html;

  // Step 6: render KaTeX in actual pages then remove probe
  renderKatex(document.getElementById('pages'));
  probe.remove();
  setTimeout(function(){window.print();},300);
});
<\/script></body></html>`;

  const win=window.open("","_blank");
  if(!win){alert("Please allow popups to use PDF export.");return;}
  win.document.write(html);win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const navigate = useNavigate();
  const toolKeys=Object.keys(TOOL_CONFIG.tools) as ToolType[];
  const [currentTool,setCurrentTool]=useState<ToolType>("numerical");
  const [mode,setMode]=useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty,setDifficulty]=useState<DifficultyLevel>("level1");

  const [toolVariables,setToolVariables]=useState<Record<string,Record<string,boolean>>>(()=>{
    const init:Record<string,Record<string,boolean>>={};
    Object.keys(TOOL_CONFIG.tools).forEach(k=>{init[k]={};TOOL_CONFIG.tools[k].variables.forEach(v=>{init[k][v.key]=v.defaultValue;});});
    return init;
  });
  const [toolDropdowns,setToolDropdowns]=useState<Record<string,string>>(()=>{
    const init:Record<string,string>={};
    Object.keys(TOOL_CONFIG.tools).forEach(k=>{const t=TOOL_CONFIG.tools[k];(["level1","level2","level3"] as DifficultyLevel[]).forEach(lv=>{if(t.dropdown)init[`${k}__${lv}`]=t.dropdown.defaultValue;});});
    return init;
  });

  const [currentQuestion,setCurrentQuestion]=useState<AnyQuestion|null>(null);
  const [showWhiteboardAnswer,setShowWhiteboardAnswer]=useState(false);
  const [showAnswer,setShowAnswer]=useState(false);
  const [numQuestions,setNumQuestions]=useState(5);
  const [numColumns,setNumColumns]=useState(2);
  const [worksheet,setWorksheet]=useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers,setShowWorksheetAnswers]=useState(false);
  const [isDifferentiated,setIsDifferentiated]=useState(false);
  const [displayFontSize,setDisplayFontSize]=useState(2);
  const [worksheetFontSize,setWorksheetFontSize]=useState(1);
  const [colorScheme,setColorScheme]=useState("default");
  const [isMenuOpen,setIsMenuOpen]=useState(false);
  const [isInfoOpen,setIsInfoOpen]=useState(false);

  const [presenterMode,setPresenterMode]=useState(false);
  const [wbFullscreen,setWbFullscreen]=useState(false);
  const [camDevices,setCamDevices]=useState<MediaDeviceInfo[]>([]);
  const [currentCamId,setCurrentCamId]=useState<string|null>(null);
  const [camError,setCamError]=useState<string|null>(null);
  const [camDropdownOpen,setCamDropdownOpen]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const camDropdownRef=useRef<HTMLDivElement>(null);
  const longPressTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress=useRef(false);

  useEffect(()=>{loadKaTeX();},[]);

  const stopStream=useCallback(()=>{
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current)videoRef.current.srcObject=null;
  },[]);

  const startCam=useCallback(async(deviceId?:string)=>{
    stopStream();setCamError(null);
    try{
      let tid=deviceId;
      if(!tid){const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});tmp.getTracks().forEach(t=>t.stop());const all=await navigator.mediaDevices.enumerateDevices();const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!/facetime|built.?in|integrated|internal|front|rear/i.test(d.label));if(ext)tid=ext.deviceId;}
      const stream=await navigator.mediaDevices.getUserMedia({video:tid?{deviceId:{exact:tid}}:true,audio:false});
      streamRef.current=stream;if(videoRef.current)videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    }catch(e:unknown){setCamError((e instanceof Error?e.message:null)??"Camera unavailable");}
  },[stopStream]);

  useEffect(()=>{if(presenterMode)startCam();else stopStream();},[presenterMode]);
  useEffect(()=>{if(presenterMode&&streamRef.current&&videoRef.current)videoRef.current.srcObject=streamRef.current;},[wbFullscreen]);
  useEffect(()=>{if(!camDropdownOpen)return;const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[camDropdownOpen]);
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[]);

  const qBg=getQuestionBg(colorScheme),stepBg=getStepBg(colorScheme);
  const isDefault=colorScheme==="default";
  const fsToolbarBg=isDefault?"#ffffff":stepBg;
  const fsWorkingBg=isDefault?"#f5f3f0":qBg;

  const getTS=()=>TOOL_CONFIG.tools[currentTool];
  const getDDCfg=()=>getTS().dropdown;
  const getVarsCfg=()=>getTS().variables;
  const getDDValue=()=>toolDropdowns[`${currentTool}__${difficulty}`]??getDDCfg()?.defaultValue??"";
  const setDDValue=(v:string)=>setToolDropdowns(p=>({...p,[`${currentTool}__${difficulty}`]:v}));
  const setVarValue=(k:string,v:boolean)=>setToolVariables(p=>({...p,[currentTool]:{...p[currentTool],[k]:v}}));

  const qoProps={variables:getVarsCfg()??[],variableValues:toolVariables[currentTool]||{},onVariableChange:setVarValue,dropdown:getDDCfg()??null,dropdownValue:getDDValue(),onDropdownChange:setDDValue};

  const makeQuestion=():AnyQuestion=>generateQuestion(currentTool,difficulty,toolVariables[currentTool]||{},getDDValue());
  const handleNewQuestion=()=>{setCurrentQuestion(makeQuestion());setShowWhiteboardAnswer(false);setShowAnswer(false);};
  const handleGenerateWorksheet=()=>{
    const usedKeys=new Set<string>(),questions:AnyQuestion[]=[];
    if(isDifferentiated){(["level1","level2","level3"] as DifficultyLevel[]).forEach(lv=>{for(let i=0;i<numQuestions;i++)questions.push(generateUniqueQ(currentTool,lv,toolVariables[currentTool]||{},getDDValue(),usedKeys));});}
    else{for(let i=0;i<numQuestions;i++)questions.push(generateUniqueQ(currentTool,difficulty,toolVariables[currentTool]||{},getDDValue(),usedKeys));}
    setWorksheet(questions);setShowWorksheetAnswers(false);
  };

  useEffect(()=>{if(mode!=="worksheet")handleNewQuestion();},[difficulty,currentTool]);

  const displayFontSizes=["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const fontSizes=["text-lg","text-xl","text-2xl","text-3xl","text-4xl"];
  const canDI=displayFontSize<displayFontSizes.length-1,canDD=displayFontSize>0;
  const canWI=worksheetFontSize<fontSizes.length-1,canWD=worksheetFontSize>0;

  const fontBtnStyle=(en:boolean):CSSProperties=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:en?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:en?1:0.35});

  const renderQCell=(q:AnyQuestion,idx:number,bgOverride?:string)=>{
    const bg=bgOverride??stepBg,fsz=fontSizes[worksheetFontSize];
    return(
      <div className="rounded-lg p-4 shadow" style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative"}}>
        <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
        <div className={`${fsz} font-semibold`} style={{color:"#000",paddingTop:"0.5em",lineHeight:1.8}}>
          <SegLine segs={q.display}/>
        </div>
        {showWorksheetAnswers&&<div className={`${fsz} mt-1`} style={{color:"#059669"}}><SegLine segs={q.answerSegs}/></div>}
      </div>
    );
  };

  const renderControlBar=()=>{
    if(mode==="worksheet") return(
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {(["level1","level2","level3"] as const).map((val,i)=>{const c=["bg-green-600","bg-yellow-500","bg-red-600"][i];return(
              <button key={val} onClick={()=>{setDifficulty(val);setIsDifferentiated(false);}}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${c} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>Level {i+1}</button>
            );})}
          </div>
          <button onClick={()=>setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          <QOPopover {...qoProps}/>
          <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Questions:</label><input type="number" min="1" max="20" value={numQuestions} onChange={e=>setNumQuestions(Math.max(1,Math.min(20,parseInt(e.target.value)||5)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/></div>
          <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={isDifferentiated?3:numColumns} onChange={e=>{if(!isDifferentiated)setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||2)));}} disabled={isDifferentiated} className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/></div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> Generate</button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}</button>
            <button onClick={()=>handlePrint(worksheet,TOOL_CONFIG.tools[currentTool].name,difficulty,isDifferentiated,numColumns)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18}/> Print / PDF</button>
          </>}
        </div>
      </div>
    );
    return(
      <div className="px-5 py-4 rounded-xl" style={{backgroundColor:qBg}}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
          <QOPopover {...qoProps}/>
          <div className="flex gap-3">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
            <button onClick={()=>mode==="whiteboard"?setShowWhiteboardAnswer(!showWhiteboardAnswer):setShowAnswer(!showAnswer)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {(mode==="whiteboard"?showWhiteboardAnswer:showAnswer)?"Hide Answer":"Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard=()=>{
    const fsToolbar=(
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        <QOPopover {...qoProps}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    const questionBox=(fs=false)=>(
      <div style={{position:"relative",width:fs?"45%":"500px",height:"100%",backgroundColor:stepBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:fs?48:32,boxSizing:"border-box",flexShrink:0,gap:16,...(fs?{}:{borderRadius:"12px"})}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
          <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {currentQuestion&&<>
          <SegLine segs={currentQuestion.display} cls={`${displayFontSizes[displayFontSize]} font-semibold text-center`} style={{color:"#000"}}/>
          {showWhiteboardAnswer&&<SegLine segs={currentQuestion.answerSegs} cls={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}/>}
        </>}
      </div>
    );

    const rightPanel=(isFS:boolean)=>(
      <div style={{flex:isFS?"none":1,width:isFS?"55%":undefined,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&<><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>{camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>}
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          {presenterMode?(
            <div style={{position:"relative"}} ref={camDropdownRef}>
              <button onMouseDown={()=>{didLongPress.current=false;longPressTimer.current=setTimeout(()=>{didLongPress.current=true;setCamDropdownOpen(o=>!o);},500);}} onMouseUp={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);if(!didLongPress.current)setPresenterMode(false);}} onMouseLeave={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);}}
                style={{background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Video size={16} color="rgba(255,255,255,0.85)"/>
              </button>
              {camDropdownOpen&&(
                <div style={{position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30}}>
                  <div style={{padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Camera</div>
                  {camDevices.map((d,i)=>(
                    <div key={d.deviceId} onClick={()=>{setCamDropdownOpen(false);if(d.deviceId!==currentCamId)startCam(d.deviceId);}} style={{padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>
                      {d.label||`Camera ${i+1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setPresenterMode(true)} style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}><Video size={16} color="#6b7280"/></button>
          )}
          <button onClick={()=>setWbFullscreen(f=>!f)} style={{background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {wbFullscreen?<Minimize2 size={16} color="#fff"/>:<Maximize2 size={16} color={presenterMode?"rgba(255,255,255,0.85)":"#6b7280"}/>}
          </button>
        </div>
      </div>
    );

    if(wbFullscreen) return(
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div style={{flex:1,display:"flex",minHeight:0}}>
          {questionBox(true)}<div style={{width:2,backgroundColor:"#000",flexShrink:0}}/>{rightPanel(true)}
        </div>
      </div>
    );
    return(
      <div className="p-8" style={{backgroundColor:qBg,height:"600px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>{questionBox(false)}{rightPanel(false)}</div>
      </div>
    );
  };

  const renderWorkedExample=()=>{
    if(!currentQuestion) return null;
    return(
      <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
        <div className="p-8 w-full" style={{backgroundColor:qBg}}>
          <div className="text-center py-4 relative">
            <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
              <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
              <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
            </div>
            <SegLine segs={currentQuestion.display} cls={`${displayFontSizes[displayFontSize]} font-semibold`} style={{color:"#000"}}/>
          </div>
          {showAnswer&&<>
            <div className="space-y-4 mt-8">
              {currentQuestion.working.map((s,i)=>(
                <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                  <h4 className="text-xl font-bold mb-3" style={{color:s.isTip?"#1d4ed8":"#000"}}>
                    {s.isTip?"💡 Calculator Tip":`Step ${i+1}`}
                  </h4>
                  <div className="text-2xl" style={{color:"#000"}}><KaTeX latex={s.latex}/></div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
              <SegLine segs={currentQuestion.answerSegs} cls={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}/>
            </div>
          </>}
        </div>
      </div>
    );
  };

  const renderWorksheet=()=>{
    if(worksheet.length===0) return(
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate a worksheet to get started</span>
      </div>
    );
    const fsCtrls=(
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canWD} onClick={()=>canWD&&setWorksheetFontSize(f=>f-1)} className={`w-8 h-8 rounded flex items-center justify-center ${canWD?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canWI} onClick={()=>canWI&&setWorksheetFontSize(f=>f+1)} className={`w-8 h-8 rounded flex items-center justify-center ${canWI?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle=TOOL_CONFIG.tools[currentTool].name;
    if(isDifferentiated) return(
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li)=>{
            const lqs=worksheet.filter(q=>q.difficulty===lv),c=LV_COLORS[lv];
            return(
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
    return(
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem"}}>
          {worksheet.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  return(
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
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
            {(["whiteboard","single","worksheet"] as const).map(m=>(
              <button key={m} onClick={()=>{setMode(m);setPresenterMode(false);setWbFullscreen(false);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {m==="whiteboard"?"Whiteboard":m==="single"?"Worked Example":"Worksheet"}
              </button>
            ))}
          </div>
          {mode==="worksheet"&&<>{renderControlBar()}{renderWorksheet()}</>}
          {mode!=="worksheet"&&(
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">{renderControlBar()}</div>
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
