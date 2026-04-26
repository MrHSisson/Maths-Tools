import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX
// ═══════════════════════════════════════════════════════════════════════════════
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
      script.onload = () => resolve(); script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

interface MathProps { latex: string; style?: CSSProperties; className?: string; }
const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !ref.current) return;
    try { w().katex.render(latex, ref.current, { displayMode: false, throwOnError: false, output: "html" }); }
    catch { if (ref.current) ref.current.textContent = latex; }
  }, [latex, ready]);
  const hasFrac = latex.includes("\\frac");
  return <span ref={ref} className={className} style={{ display: "inline", verticalAlign: "baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style }} />;
};

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

const TogglePill = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? "bg-blue-900" : "bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
type DifficultyLevel = "level1" | "level2" | "level3";
type NegMode = "never" | "sometimes" | "always";
type L2Form = "lhs" | "rhs" | "zero";
type L3Form = "lhsNeg" | "negIsolated";

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};

const getQuestionBg = (cs: string) => ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg    = (cs: string) => ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

interface SubQuestion {
  kind: "sub";
  varPair: [string, string];
  a1: number; b1: number; c1: number;
  eq1Display: string; eq2Display: string;
  isolatedVar: "v1" | "v2";
  rearrangedLatex: string; isolatedExpr: string;
  needsRearrange: boolean;
  afterSubLatex: string; solveSteps: string[]; subBackSteps: string[];
  v1Val: number; v2Val: number;
  key: string; difficulty: string;
  working: { type: string; latex: string; plain: string }[];
}
type AnyQuestion = SubQuestion;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const VAR_PAIRS: [string, string][] = [["x","y"],["s","t"],["n","m"],["a","b"],["u","v"]];
const randInt = (min: number, max: number) => Math.floor(Math.random()*(max-min+1))+min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length-1)];

const lead = (c: number, v: string) => c===1?v:c===-1?`-${v}`:`${c}${v}`;
const next = (c: number, v: string) => {
  if (c===0) return "";
  if (c===1) return `+ ${v}`;
  if (c===-1) return `- ${v}`;
  return c>0 ? `+ ${c}${v}` : `- ${Math.abs(c)}${v}`;
};
const buildEq = (a: number, b: number, c: number, v1: string, v2: string) => {
  // If the leading coefficient is negative, swap term order so it reads naturally
  // e.g. -4x + 3y = c  →  3y - 4x = c
  if (a < 0 && b > 0) return `${lead(b,v2)} ${next(a,v1)} = ${c}`;
  return `${lead(a,v1)} ${next(b,v2)} = ${c}`;
};

const resolveNeg = (mode: NegMode): { allowNeg: boolean; requireNeg: boolean } => {
  if (mode==="never")  return { allowNeg: false, requireNeg: false };
  if (mode==="always") return { allowNeg: true,  requireNeg: true  };
  return { allowNeg: true, requireNeg: Math.random() < 0.4 };
};

// ─── working step builders ────────────────────────────────────────────────────
const afterSubPos = (isoC: number, otherC: number, k: number, d: number, ov: string, c: number) => {
  const inner = d===0 ? (k===1?ov:`${k}${ov}`)
    : d>0 ? (k===1?`${ov} + ${d}`:`${k}${ov} + ${d}`)
    : (k===1?`${ov} - ${Math.abs(d)}`:`${k}${ov} - ${Math.abs(d)}`);
  return `${isoC}(${inner}) ${next(otherC,ov)} = ${c}`;
};
const afterSubNeg = (isoC: number, otherC: number, k: number, d: number, ov: string, c: number) => {
  const inner = k===1 ? `${d} - ${ov}` : `${d} - ${k}${ov}`;
  return `${isoC}(${inner}) ${next(otherC,ov)} = ${c}`;
};
const solveStepsPos = (isoC: number, otherC: number, k: number, d: number, ov: string, otherVal: number, c: number): string[] => {
  const steps: string[] = [];
  const expandIso=isoC*k, expandConst=isoC*d, netC=expandIso+otherC, netRHS=c-expandConst;
  const constPart = expandConst===0 ? "" : expandConst>0 ? `+ ${expandConst}` : `- ${Math.abs(expandConst)}`;
  steps.push(`${expandIso}${ov} ${constPart} ${next(otherC,ov)} = ${c}`.trim());
  if (expandConst!==0) steps.push(`${netC}${ov} = ${netRHS}`);
  if (Math.abs(netC)!==1) steps.push(`${ov} = ${netRHS} \\div ${netC}`);
  steps.push(`${ov} = ${otherVal}`);
  return steps;
};
const solveStepsNeg = (isoC: number, otherC: number, k: number, d: number, ov: string, otherVal: number, c: number): string[] => {
  const steps: string[] = [];
  const expandConst=isoC*d, expandIso=-(isoC*k), netC=expandIso+otherC, netRHS=c-expandConst;
  const constStr = expandConst>0 ? `+ ${expandConst}` : `- ${Math.abs(expandConst)}`;
  const isoStr   = expandIso>=0  ? `+ ${expandIso}${ov}` : `- ${Math.abs(expandIso)}${ov}`;
  steps.push(`${expandConst} ${isoStr} ${next(otherC,ov)} = ${c}`);
  steps.push(`${netC}${ov} ${constStr} = ${c}`);
  steps.push(`${netC}${ov} = ${netRHS}`);
  if (Math.abs(netC)!==1) steps.push(`${ov} = ${netRHS} \\div ${netC}`);
  steps.push(`${ov} = ${otherVal}`);
  return steps;
};
const subBackPos = (isoV: string, ov: string, k: number, d: number, otherVal: number, isoVal: number): string[] => {
  const kPart = k===1 ? ov : `${k}${ov}`;
  const inner  = d===0 ? kPart : d>0 ? `${kPart} + ${d}` : `${kPart} - ${Math.abs(d)}`;
  const steps  = [`${isoV} = ${inner}`];
  const computed = k*otherVal;
  if (d!==0) steps.push(`${isoV} = ${computed} ${d>0?`+ ${d}`:`- ${Math.abs(d)}`}`);
  else       steps.push(`${isoV} = ${computed}`);
  if (computed+d !== isoVal || d!==0) steps.push(`${isoV} = ${isoVal}`);
  return steps;
};
const subBackNeg = (isoV: string, ov: string, k: number, d: number, otherVal: number, isoVal: number): string[] => [
  `${isoV} = ${k===1?`${d} - ${ov}`:`${d} - ${k}${ov}`}`,
  `${isoV} = ${d} - ${k*otherVal}`,
  `${isoV} = ${isoVal}`,
];

// ─── eq1 coefficient helpers ──────────────────────────────────────────────────
// Build two distinct coefficients for eq1, both with magnitude ≥ 2.
// Signs are random — eq1 can be ax + by = c or ax - by = c.
// The non-isolated variable's coefficient magnitude must not equal rhsCoeff
// (to prevent students substituting the whole term rather than isolating first).
const buildEq1Coeffs = (isolatedVar: "v1"|"v2", rhsCoeff: number, allowNegEq1: boolean): { a: number; b: number } | null => {
  for (let attempt=0; attempt<50; attempt++) {
    const aMag = randInt(2,6), bMag = randInt(2,6);
    if (aMag===bMag) continue;
    const a = (allowNegEq1 && Math.random()<0.35) ? -aMag : aMag;
    const b = (allowNegEq1 && Math.random()<0.35) ? -bMag : bMag;
    const otherC = isolatedVar==="v1" ? b : a;
    if (Math.abs(otherC)===rhsCoeff) continue;
    return { a, b };
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── LEVEL 1 ──────────────────────────────────────────────────────────────────
// eq2: isoV = k*otherV + d   (k ≥ 2 always)
const generateLevel1 = (allowNeg: boolean, requireNeg: boolean, allowNegEq1: boolean): SubQuestion => {
  const id = Math.floor(Math.random()*1_000_000);
  const varPair = pick(VAR_PAIRS); const [v1,v2] = varPair;
  const isolatedVar: "v1"|"v2" = Math.random()<0.5 ? "v1" : "v2";
  const [isoV, otherV] = isolatedVar==="v1" ? [v1,v2] : [v2,v1];

  // Pick solution values first
  const range = allowNeg ? [-10,10] : [1,10];
  const v1Val = randInt(range[0], range[1]);
  const v2Val = randInt(range[0], range[1]);

  if (v1Val===0 || v2Val===0)                          return generateLevel1(allowNeg,requireNeg,allowNegEq1);
  if (requireNeg  && v1Val>0  && v2Val>0)              return generateLevel1(allowNeg,requireNeg,allowNegEq1);
  if (!requireNeg && (v1Val<0 || v2Val<0))             return generateLevel1(allowNeg,requireNeg,allowNegEq1);

  const isoVal   = isolatedVar==="v1" ? v1Val : v2Val;
  const otherVal = isolatedVar==="v1" ? v2Val : v1Val;

  // Pick k (RHS coefficient) then derive d so eq2 is exact
  const k = pick([2,2,3,3,3,4,5]);
  const d = isoVal - k*otherVal;

  const coeffs = buildEq1Coeffs(isolatedVar, k, allowNegEq1);
  if (!coeffs) return generateLevel1(allowNeg,requireNeg,allowNegEq1);
  const { a, b } = coeffs;
  const c = a*v1Val + b*v2Val;
  const [isoC, otherC] = isolatedVar==="v1" ? [a,b] : [b,a];

  const kPart = `${k}${otherV}`;
  const dStr  = d===0 ? "" : d>0 ? ` + ${d}` : ` - ${Math.abs(d)}`;
  const eq2Display   = `${isoV} = ${kPart}${dStr}`;
  const isolatedExpr = `${kPart}${dStr}`;

  return {
    kind:"sub", varPair, a1:a, b1:b, c1:c,
    eq1Display: buildEq(a,b,c,v1,v2), eq2Display,
    isolatedVar, isolatedExpr, rearrangedLatex: eq2Display, needsRearrange: false,
    afterSubLatex:  afterSubPos(isoC,otherC,k,d,otherV,c),
    solveSteps:     solveStepsPos(isoC,otherC,k,d,otherV,otherVal,c),
    subBackSteps:   subBackPos(isoV,otherV,k,d,otherVal,isoVal),
    v1Val, v2Val,
    key: `L1-${v1}${v2}-${a}-${b}-${k}-${d}-${v1Val}-${v2Val}-${id}`,
    difficulty:"level1", working:[],
  };
};

// ── LEVEL 2 ──────────────────────────────────────────────────────────────────
// Three surface forms for eq2 — variable has coeff +1 but is not isolated.
//   lhs : n*otherV + isoV = m       → isoV = m - n*otherV
//   rhs : n*otherV = isoV ± p       → isoV = n*otherV ∓ p
//   zero: n*otherV + isoV ± p = 0   → isoV = -n*otherV ∓ p
// n ≥ 2 always; n ≠ otherC (coefficient of otherV in eq1).
const generateLevel2 = (allowNeg: boolean, requireNeg: boolean, allowZero: boolean, allowNegEq1: boolean): SubQuestion => {
  const id = Math.floor(Math.random()*1_000_000);
  const varPair = pick(VAR_PAIRS); const [v1,v2] = varPair;
  const isolatedVar: "v1"|"v2" = Math.random()<0.5 ? "v1" : "v2";
  const [isoV, otherV] = isolatedVar==="v1" ? [v1,v2] : [v2,v1];

  const activeForms: L2Form[] = ["lhs","rhs"];
  if (allowZero) activeForms.push("zero");
  const form = pick(activeForms);

  // Rearranged substitution: isoV = k*otherV + d  (used by rhs/zero)
  const k = randInt(2,5);
  const d = randInt(-8,8);
  const otherVal = randInt(1,8);
  const isoVal   = k*otherVal+d;
  const v1Val = isolatedVar==="v1" ? isoVal : otherVal;
  const v2Val = isolatedVar==="v1" ? otherVal : isoVal;

  if (v1Val===0 || v2Val===0)                          return generateLevel2(allowNeg,requireNeg,allowZero);
  if (requireNeg  && v1Val>0  && v2Val>0)              return generateLevel2(allowNeg,requireNeg,allowZero);
  if (!requireNeg && (v1Val<0 || v2Val<0))             return generateLevel2(allowNeg,requireNeg,allowZero);
  if (Math.abs(v1Val)>25 || Math.abs(v2Val)>25)        return generateLevel2(allowNeg,requireNeg,allowZero);

  if (form==="lhs") {
    // n is the coefficient of otherV on the LHS of eq2
    const n = randInt(2,5);
    const m = n*otherVal + isoVal;  // so n*otherV + isoV = m is consistent
    const coeffs = buildEq1Coeffs(isolatedVar, n);
    if (!coeffs) return generateLevel2(allowNeg,requireNeg,allowZero);
    const { a, b } = coeffs;
    const c = a*v1Val + b*v2Val;
    const [isoC, otherC] = isolatedVar==="v1" ? [a,b] : [b,a];
    void otherC; // checked inside buildEq1Coeffs

    const nStr = `${n}${otherV}`;
    const eq2Display      = `${nStr} + ${isoV} = ${m}`;
    const isolatedExpr    = `${m} - ${nStr}`;
    const rearrangedLatex = `${isoV} = ${isolatedExpr}`;
    return {
      kind:"sub", varPair, a1:a, b1:b, c1:c,
      eq1Display: buildEq(a,b,c,v1,v2), eq2Display,
      isolatedVar, isolatedExpr, rearrangedLatex, needsRearrange: true,
      afterSubLatex:  afterSubNeg(isoC,otherC,n,m,otherV,c),
      solveSteps:     solveStepsNeg(isoC,otherC,n,m,otherV,otherVal,c),
      subBackSteps:   subBackNeg(isoV,otherV,n,m,otherVal,isoVal),
      v1Val, v2Val,
      key: `L2lhs-${v1}${v2}-${n}-${m}-${v1Val}-${v2Val}-${id}`,
      difficulty:"level2", working:[],
    };
  }

  if (form==="rhs") {
    // n*otherV = isoV ± p  →  isoV = n*otherV + d  (n=k, p=-d)
    const n = k;  // k ≥ 2
    const p = -d;
    const coeffs = buildEq1Coeffs(isolatedVar, n);
    if (!coeffs) return generateLevel2(allowNeg,requireNeg,allowZero);
    const { a, b } = coeffs;
    const c = a*v1Val + b*v2Val;
    const [isoC, otherC] = isolatedVar==="v1" ? [a,b] : [b,a];

    const nStr  = `${n}${otherV}`;
    const pStr  = p===0 ? isoV : p>0 ? `${isoV} + ${p}` : `${isoV} - ${Math.abs(p)}`;
    const eq2Display   = `${nStr} = ${pStr}`;
    const kPart        = `${k}${otherV}`;
    const dStr         = d===0 ? "" : d>0 ? ` + ${d}` : ` - ${Math.abs(d)}`;
    const isolatedExpr = `${kPart}${dStr}`;
    const rearrangedLatex = `${isoV} = ${isolatedExpr}`;
    return {
      kind:"sub", varPair, a1:a, b1:b, c1:c,
      eq1Display: buildEq(a,b,c,v1,v2), eq2Display,
      isolatedVar, isolatedExpr, rearrangedLatex, needsRearrange: true,
      afterSubLatex:  afterSubPos(isoC,otherC,k,d,otherV,c),
      solveSteps:     solveStepsPos(isoC,otherC,k,d,otherV,otherVal,c),
      subBackSteps:   subBackPos(isoV,otherV,k,d,otherVal,isoVal),
      v1Val, v2Val,
      key: `L2rhs-${v1}${v2}-${k}-${d}-${v1Val}-${v2Val}-${id}`,
      difficulty:"level2", working:[],
    };
  }

  // zero: n*otherV + isoV ± p = 0  →  isoV = -n*otherV ∓ p
  {
    const n = randInt(2,5);
    const p = -(n*otherVal + isoVal);
    const coeffs = buildEq1Coeffs(isolatedVar, n, allowNegEq1);
    if (!coeffs) return generateLevel2(allowNeg,requireNeg,allowZero,allowNegEq1);
    const { a, b } = coeffs;
    const c = a*v1Val + b*v2Val;
    const [isoC, otherC] = isolatedVar==="v1" ? [a,b] : [b,a];

    const nStr  = `${n}${otherV}`;
    const pStr  = p===0 ? "" : p>0 ? ` + ${p}` : ` - ${Math.abs(p)}`;
    const eq2Display   = `${nStr} + ${isoV}${pStr} = 0`;
    const rnStr        = `${n}${otherV}`;
    const rpStr        = p===0 ? "" : p>0 ? ` - ${p}` : ` + ${Math.abs(p)}`;
    const isolatedExpr = `-${rnStr}${rpStr}`;
    const rearrangedLatex = `${isoV} = ${isolatedExpr}`;
    const kk = -n, dd = -p;
    return {
      kind:"sub", varPair, a1:a, b1:b, c1:c,
      eq1Display: buildEq(a,b,c,v1,v2), eq2Display,
      isolatedVar, isolatedExpr, rearrangedLatex, needsRearrange: true,
      afterSubLatex:  afterSubPos(isoC,otherC,kk,dd,otherV,c),
      solveSteps:     solveStepsPos(isoC,otherC,kk,dd,otherV,otherVal,c),
      subBackSteps:   subBackPos(isoV,otherV,kk,dd,otherVal,isoVal),
      v1Val, v2Val,
      key: `L2zero-${v1}${v2}-${n}-${p}-${v1Val}-${v2Val}-${id}`,
      difficulty:"level2", working:[],
    };
  }
};

// ── LEVEL 3 ──────────────────────────────────────────────────────────────────
// Variable has coefficient -1. Two surface forms:
//   lhsNeg     : n*otherV - isoV = m  →  isoV = n*otherV - m
//   negIsolated: m - isoV = n*otherV  →  isoV = m - n*otherV
// n ≥ 2 always; n ≠ otherC (coefficient of otherV in eq1).
const generateLevel3 = (allowNeg: boolean, requireNeg: boolean, allowNegEq1: boolean): SubQuestion => {
  const id = Math.floor(Math.random()*1_000_000);
  const varPair = pick(VAR_PAIRS); const [v1,v2] = varPair;
  const isolatedVar: "v1"|"v2" = Math.random()<0.5 ? "v1" : "v2";
  const [isoV, otherV] = isolatedVar==="v1" ? [v1,v2] : [v2,v1];

  const form: L3Form = Math.random()<0.5 ? "lhsNeg" : "negIsolated";

  // Pick solution values first
  const range = allowNeg ? [-10,10] : [1,10];
  const v1Val = randInt(range[0], range[1]);
  const v2Val = randInt(range[0], range[1]);

  if (v1Val===0 || v2Val===0)                          return generateLevel3(allowNeg,requireNeg,allowNegEq1);
  if (requireNeg  && v1Val>0  && v2Val>0)              return generateLevel3(allowNeg,requireNeg,allowNegEq1);
  if (!requireNeg && (v1Val<0 || v2Val<0))             return generateLevel3(allowNeg,requireNeg,allowNegEq1);

  const isoVal   = isolatedVar==="v1" ? v1Val : v2Val;
  const otherVal = isolatedVar==="v1" ? v2Val : v1Val;

  // Pick n then derive m so eq2 is consistent with the chosen solution
  const n = randInt(2,4);
  // lhsNeg:      n*otherV - isoV = m  →  m = n*otherVal - isoVal
  // negIsolated: m - isoV = n*otherV  →  m = isoVal + n*otherVal
  const m = form==="lhsNeg" ? n*otherVal - isoVal : isoVal + n*otherVal;

  // m must be positive and sensible for display
  if (m<=0 || m>50) return generateLevel3(allowNeg,requireNeg,allowNegEq1);

  const coeffs = buildEq1Coeffs(isolatedVar, n, allowNegEq1);
  if (!coeffs) return generateLevel3(allowNeg,requireNeg,allowNegEq1);
  const { a, b } = coeffs;
  const c = a*v1Val + b*v2Val;
  const [isoC, otherC] = isolatedVar==="v1" ? [a,b] : [b,a];

  const nStr = `${n}${otherV}`;
  let eq2Display="", rearrangedLatex="", isolatedExpr="";
  let afterSub="", solve: string[]=[], sback: string[]=[];

  if (form==="lhsNeg") {
    eq2Display = Math.random()<0.5 ? `${nStr} - ${isoV} = ${m}` : `-${isoV} + ${nStr} = ${m}`;
    isolatedExpr    = `${nStr} - ${m}`;
    rearrangedLatex = `${isoV} = ${isolatedExpr}`;
    afterSub = afterSubPos(isoC,otherC,n,-m,otherV,c);
    solve    = solveStepsPos(isoC,otherC,n,-m,otherV,otherVal,c);
    sback    = subBackPos(isoV,otherV,n,-m,otherVal,isoVal);
  } else {
    const lhs=`${m} - ${isoV}`;
    eq2Display = Math.random()<0.5 ? `${lhs} = ${nStr}` : `${nStr} = ${lhs}`;
    isolatedExpr    = `${m} - ${nStr}`;
    rearrangedLatex = `${isoV} = ${isolatedExpr}`;
    afterSub = afterSubNeg(isoC,otherC,n,m,otherV,c);
    solve    = solveStepsNeg(isoC,otherC,n,m,otherV,otherVal,c);
    sback    = subBackNeg(isoV,otherV,n,m,otherVal,isoVal);
  }

  return {
    kind:"sub", varPair, a1:a, b1:b, c1:c,
    eq1Display: buildEq(a,b,c,v1,v2), eq2Display,
    isolatedVar, isolatedExpr, rearrangedLatex, needsRearrange: true,
    afterSubLatex: afterSub, solveSteps: solve, subBackSteps: sback,
    v1Val, v2Val,
    key: `L3-${form}-${v1}${v2}-${n}-${m}-${v1Val}-${v2Val}-${id}`,
    difficulty:"level3", working:[],
  };
};

const generateQuestion = (level: DifficultyLevel, negMode: NegMode, allowZero: boolean, allowNegEq1: boolean): AnyQuestion => {
  const { allowNeg, requireNeg } = resolveNeg(negMode);
  if (level==="level1") return generateLevel1(allowNeg,requireNeg,allowNegEq1);
  if (level==="level2") return generateLevel2(allowNeg,requireNeg,allowZero,allowNegEq1);
  return generateLevel3(allowNeg,requireNeg,allowNegEq1);
};

const generateUniqueQ = (level: DifficultyLevel, negMode: NegMode, allowZero: boolean, allowNegEq1: boolean, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion; let attempts=0;
  do { q=generateQuestion(level,negMode,allowZero,allowNegEq1); attempts++; }
  while (usedKeys.has(q.key) && attempts<100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const NegSelector = ({ value, onChange, label }: { value: NegMode; onChange: (v: NegMode) => void; label: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {(["never","sometimes","always"] as NegMode[]).map(opt=>(
        <button key={opt} onClick={()=>onChange(opt)}
          className={`flex-1 px-3 py-1.5 text-sm font-bold transition-colors ${value===opt?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.charAt(0).toUpperCase()+opt.slice(1)}
        </button>
      ))}
    </div>
  </div>
);

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
      <button key={val} onClick={()=>onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

const QuestionDisplay = ({ q, cls }: { q: SubQuestion; cls: string }) => (
  <div className="flex flex-col items-center gap-2 w-full">
    {[q.eq1Display,q.eq2Display].map((eq,i)=>(
      <div key={i} className="flex items-baseline gap-3 justify-center">
        <span className="text-sm font-bold text-gray-400 w-8 text-right flex-shrink-0">({i+1})</span>
        <span className={`${cls} font-semibold`} style={{color:"#000"}}><MathRenderer latex={eq}/></span>
      </div>
    ))}
  </div>
);

const WorkedSteps = ({ q, stepBg, fsz }: { q: SubQuestion; stepBg: string; fsz: string }) => {
  const [v1,v2]=q.varPair;
  const card=(title: string,children: React.ReactNode)=>(
    <div className="rounded-xl p-5" style={{backgroundColor:stepBg}}>
      <h4 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wide">{title}</h4>
      <div className={`${fsz} font-semibold flex flex-col gap-2 items-center`} style={{color:"#000"}}>{children}</div>
    </div>
  );
  const ml=(latex: string,label?: string)=>(
    <div className="flex items-baseline gap-3 justify-center">
      {label!==undefined&&<span className="text-xs font-bold text-gray-400 w-16 text-right flex-shrink-0">{label}</span>}
      <MathRenderer latex={latex}/>
    </div>
  );
  const [isoV]=q.isolatedVar==="v1"?[v1,v2]:[v2,v1];
  let stepNum=1;
  const steps: React.ReactNode[]=[];
  steps.push(card(`Step ${stepNum++} — Label the equations`,<QuestionDisplay q={q} cls={fsz}/>));
  if (q.needsRearrange) steps.push(card(`Step ${stepNum++} — Rearrange equation (2) to make ${isoV} the subject`,
    <>{ml(q.eq2Display,"(2)")}{ml(q.rearrangedLatex,"⟹")}</>));
  steps.push(card(`Step ${stepNum++} — Substitute ${isoV} = ${q.isolatedExpr} into equation (1)`,ml(q.afterSubLatex)));
  steps.push(card(`Step ${stepNum++} — Expand and solve`,<>{q.solveSteps.map((s,i)=><div key={i}>{ml(s)}</div>)}</>));
  steps.push(card(`Step ${stepNum++} — Substitute back to find ${isoV}`,<>{q.subBackSteps.map((s,i)=><div key={i}>{ml(s)}</div>)}</>));
  steps.push(card("Solution",<div className="text-center"><MathRenderer latex={`${v1} = ${q.v1Val}, \\quad ${v2} = ${q.v2Val}`}/></div>));
  return <div className="space-y-4 mt-6">{steps}</div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QO POPOVERS
// ═══════════════════════════════════════════════════════════════════════════════
const SubQOPopover = ({ level, negMode, setNegMode, allowZero, setAllowZero, allowNegEq1, setAllowNegEq1 }: {
  level: DifficultyLevel; negMode: NegMode; setNegMode: (v: NegMode)=>void;
  allowZero: boolean; setAllowZero: (v: boolean)=>void;
  allowNegEq1: boolean; setAllowNegEq1: (v: boolean)=>void;
}) => {
  const {open,setOpen,ref}=usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          <NegSelector value={negMode} onChange={setNegMode} label="Negative solutions"/>
          <TogglePill checked={allowNegEq1} onChange={setAllowNegEq1} label="Allow negative coefficient in equation 1"/>
          {level==="level2"&&<TogglePill checked={allowZero} onChange={setAllowZero} label='Include "= 0" form'/>}
        </div>
      )}
    </div>
  );
};

const DiffSubQOPopover = ({ levelNeg, setLevelNeg, levelZero, setLevelZero, levelNegEq1, setLevelNegEq1 }: {
  levelNeg: Record<string,NegMode>; setLevelNeg: (v: Record<string,NegMode>)=>void;
  levelZero: Record<string,boolean>; setLevelZero: (v: Record<string,boolean>)=>void;
  levelNegEq1: Record<string,boolean>; setLevelNegEq1: (v: Record<string,boolean>)=>void;
}) => {
  const {open,setOpen,ref}=usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {(["level1","level2","level3"] as DifficultyLevel[]).map(lv=>(
            <div key={lv} className="flex flex-col gap-2">
              <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
              <div className="flex flex-col gap-2 pl-1">
                <NegSelector value={levelNeg[lv]??"never"} onChange={v=>setLevelNeg({...levelNeg,[lv]:v})} label="Negative solutions"/>
                <TogglePill checked={levelNegEq1[lv]??false} onChange={v=>setLevelNegEq1({...levelNegEq1,[lv]:v})} label="Negative coefficient in eq 1"/>
                {lv==="level2"&&<TogglePill checked={levelZero[lv]??false} onChange={v=>setLevelZero({...levelZero,[lv]:v})} label='Include "= 0" form'/>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFO & MENU
// ═══════════════════════════════════════════════════════════════════════════════
const INFO_SECTIONS = [
  { title:"Level 1 — Direct Drop-In", icon:"🟢", content:[
    {label:"Overview",detail:"One variable is already fully isolated (coefficient of 1). No rearranging needed before substituting."},
    {label:"Form",detail:"Equation 2 is always: y = kx ± d where k ≥ 2. Students substitute directly into equation 1."},
    {label:"Negative solutions",detail:"Never / Sometimes (≈40% of questions) / Always (at least one negative value every time)."},
  ]},
  { title:"Level 2 — Minor Rearranging", icon:"🟡", content:[
    {label:"Overview",detail:"The isolated variable has coefficient +1 but is not on its own. One rearrangement step needed."},
    {label:"Form A (always on)",detail:"nx + y = m  →  y = m − nx"},
    {label:"Form B (always on)",detail:"nx = y ± m  →  y = nx ∓ m"},
    {label:'Form C (optional "= 0")',detail:"nx + y ± m = 0  →  y = −nx ∓ m"},
  ]},
  { title:"Level 3 — Managing the Negative", icon:"🔴", content:[
    {label:"Overview",detail:"The isolated variable has coefficient −1. Moving it across the equals sign is the key challenge."},
    {label:"Form A",detail:"nx − y = m  or  −y + nx = m  →  y = nx − m"},
    {label:"Form B",detail:"m − y = nx  or  nx = m − y  →  y = m − nx"},
  ]},
  { title:"Modes", icon:"🖥️", content:[
    {label:"Whiteboard",detail:"Single question displayed with working space. Visualiser available."},
    {label:"Worked Example",detail:"Full step-by-step solution revealed on demand."},
    {label:"Worksheet",detail:"Printable grid of questions with PDF export."},
  ]},
];

const InfoModal = ({ onClose }: { onClose: ()=>void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{height:"80vh"}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
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

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: {
  colorScheme: string; setColorScheme: (s: string)=>void; onClose: ()=>void; onOpenInfo: ()=>void;
}) => {
  const [colorOpen,setColorOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e: MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
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

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT
// ═══════════════════════════════════════════════════════════════════════════════
const handlePrint = (questions: AnyQuestion[], difficulty: string, isDifferentiated: boolean, numColumns: number) => {
  const FONT_PX=14,PAD_MM=2,MARGIN_MM=12,HEADER_MM=14,GAP_MM=2;
  const PAGE_H_MM=297-MARGIN_MM*2,PAGE_W_MM=210-MARGIN_MM*2;
  const usableH_MM=PAGE_H_MM-HEADER_MM,diffHdrMM=7;
  const cols=isDifferentiated?3:numColumns;
  const cellW_MM=isDifferentiated?(PAGE_W_MM-GAP_MM*2)/3:(PAGE_W_MM-GAP_MM*(numColumns-1))/numColumns;
  const difficultyLabel=isDifferentiated?"Differentiated":difficulty==="level1"?"Level 1":difficulty==="level2"?"Level 2":"Level 3";
  const dateStr=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const totalQ=questions.length;
  const qData=questions.map((q: any,i: number)=>({
    eq1:q.eq1Display as string,eq2:q.eq2Display as string,
    v1:q.varPair[0] as string,v2:q.varPair[1] as string,
    v1Val:q.v1Val as number,v2Val:q.v2Val as number,
    difficulty:q.difficulty,idx:i,
  }));
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Substitution — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4;margin:${MARGIN_MM}mm;}
body{font-family:"Segoe UI",Arial,sans-serif;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.ph .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}
.cell,.dc{border:.3mm solid #d1d5db;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column;}
.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}
.dcol{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.dh{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.dh.level1{background:#dcfce7;color:#166534;}.dh.level2{background:#fef9c3;color:#854d0e;}.dh.level3{background:#fee2e2;color:#991b1b;}
.qbanner{width:100%;padding:1.2mm 3mm;font-size:${Math.round(FONT_PX*0.72)}px;font-weight:700;color:#000;border-bottom:.3mm solid #000;text-align:center;flex-shrink:0;}
.qbody{width:100%;display:flex;flex-direction:column;align-items:center;padding:${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm;}
.instr{font-size:${Math.round(FONT_PX*0.8)}px;font-weight:600;color:#000;text-align:center;margin-bottom:1mm;}
.eqrow{display:flex;align-items:baseline;justify-content:center;gap:4px;margin:0.3mm 0;}
.eqlbl{font-size:${Math.round(FONT_PX*0.7)}px;font-weight:700;color:#9ca3af;width:8mm;text-align:right;flex-shrink:0;}
.em .katex{font-size:${FONT_PX}px;}
.qa{font-size:${FONT_PX}px;color:#059669;text-align:center;margin-top:0.8mm;}
.qa .katex{font-size:${FONT_PX}px;}
#probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-size:${FONT_PX}px;width:${cellW_MM-PAD_MM*2}mm;}
</style></head><body>
<div id="probe"></div><div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxMm=3.7795,PAD=${PAD_MM},GAP=${GAP_MM},usableH=${usableH_MM},dHdr=${diffHdrMM};
  var PWmm=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}";
  var qData=${JSON.stringify(qData)};
  function kr(el,latex){try{katex.render(latex,el,{throwOnError:false,output:"html"});}catch(e){el.textContent=latex;}}
  function kEl(latex){var s=document.createElement("span");s.className="em";kr(s,latex);return s;}
  function cellInner(item,showAns){
    var body=document.createElement("div");body.className="qbody";
    var instr=document.createElement("div");instr.className="instr";instr.textContent="Solve:";body.appendChild(instr);
    [["(1)",item.eq1],["(2)",item.eq2]].forEach(function(pair){
      var row=document.createElement("div");row.className="eqrow";
      var lbl=document.createElement("span");lbl.className="eqlbl";lbl.textContent=pair[0];
      var m=document.createElement("span");m.className="em";m.appendChild(kEl(pair[1]));
      row.appendChild(lbl);row.appendChild(m);body.appendChild(row);
    });
    if(showAns){var a=document.createElement("div");a.className="qa";a.appendChild(kEl(item.v1+"="+item.v1Val+",\\\\quad "+item.v2+"="+item.v2Val));body.appendChild(a);}
    return body;
  }
  function makeCell(item,showAns,cW,cH,diff){
    var cell=document.createElement("div");cell.className=diff?"dc":"cell";
    cell.style.width=cW+"mm";cell.style.height=cH+"mm";
    var banner=document.createElement("div");banner.className="qbanner";banner.textContent="Question "+(item.idx+1);
    cell.appendChild(banner);cell.appendChild(cellInner(item,showAns));return cell;
  }
  var probe=document.getElementById("probe"),maxH=0;
  qData.forEach(function(item){var el=cellInner(item,true);probe.appendChild(el);if(el.scrollHeight>maxH)maxH=el.scrollHeight;probe.removeChild(el);});
  var needed=maxH/pxMm+PAD*2+5;
  var rowH=[];for(var r=0;r<10;r++)rowH.push((usableH-GAP*r)/(r+1));
  var chosenH=rowH[0],rpp=1,found=false;
  for(var r=0;r<rowH.length;r++){if((r+1)*cols>=totalQ&&rowH[r]>=needed){chosenH=rowH[r];rpp=r+1;found=true;break;}}
  if(!found)for(var r2=0;r2<rowH.length;r2++){if(rowH[r2]>=needed){chosenH=rowH[r2];rpp=r2+1;}}
  var dpc=Math.floor(totalQ/3),dUsable=usableH-dHdr-GAP,dRows=1,dCellH=dUsable;
  for(var rd=1;rd<=dpc;rd++){var dNeeded=needed-dHdr/rd;var hd=(dUsable-GAP*(rd-1))/rd;if(hd>=dNeeded){dRows=rd;dCellH=hd;}}
  var cW=isDiff?(PWmm-GAP*2)/3:(PWmm-GAP*(cols-1))/cols;
  var lvls=["level1","level2","level3"],lbls=["Level 1","Level 2","Level 3"];
  function makePage(pageData,showAns,pgIdx,totalPages){
    var page=document.createElement("div");page.className="page";
    var hdr=document.createElement("div");hdr.className="ph";
    var h1=document.createElement("h1");h1.textContent="Simultaneous Equations — Substitution"+(showAns?" — Answers":"");
    var meta=document.createElement("div");meta.className="meta";
    var lbl=totalPages>1?(isDiff?dpc+" per level":totalQ+" questions")+" ("+(pgIdx+1)+"/"+totalPages+")":(isDiff?dpc+" per level":totalQ+" questions");
    meta.textContent=diffLabel+"  ·  "+dateStr+"  ·  "+lbl;
    hdr.appendChild(h1);hdr.appendChild(meta);page.appendChild(hdr);
    var cH=isDiff?dCellH:chosenH;
    if(isDiff){
      var grid=document.createElement("div");grid.className="dg";grid.style.gridTemplateColumns="repeat(3,"+cW+"mm)";
      lvls.forEach(function(lv,li){
        var col=document.createElement("div");col.className="dcol";
        var dh=document.createElement("div");dh.className="dh "+lv;dh.textContent=lbls[li];col.appendChild(dh);
        var start=pageData*dRows;
        qData.filter(function(q){return q.difficulty===lv;}).slice(start,start+dRows).forEach(function(item){col.appendChild(makeCell(item,showAns,cW,cH,true));});
        grid.appendChild(col);
      });
      page.appendChild(grid);
    }else{
      var grid2=document.createElement("div");grid2.className="grid";
      grid2.style.gridTemplateColumns="repeat("+cols+","+cW+"mm)";
      grid2.style.gridTemplateRows="repeat("+Math.ceil(pageData.length/cols)+","+chosenH+"mm)";
      pageData.forEach(function(item){grid2.appendChild(makeCell(item,showAns,cW,cH,false));});
      page.appendChild(grid2);
    }
    return page;
  }
  var pageCapacity=isDiff?dRows:rpp*cols,pages=[];
  if(isDiff){var np=Math.ceil(dpc/dRows);for(var p=0;p<np;p++)pages.push(p);}
  else{for(var s=0;s<qData.length;s+=pageCapacity)pages.push(qData.slice(s,s+pageCapacity));}
  var container=document.getElementById("pages"),tp=pages.length;
  pages.forEach(function(pg,i){container.appendChild(makePage(pg,false,i,tp));});
  pages.forEach(function(pg,i){container.appendChild(makePage(pg,true,i,tp));});
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
  const [mode,setMode]=useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty,setDifficulty]=useState<DifficultyLevel>("level1");
  const [negMode,setNegMode]=useState<NegMode>("never");
  const [allowZero,setAllowZero]=useState(false);
  const [allowNegEq1,setAllowNegEq1]=useState(false);
  const [levelNeg,setLevelNeg]=useState<Record<string,NegMode>>({level1:"never",level2:"never",level3:"never"});
  const [levelZero,setLevelZero]=useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [levelNegEq1,setLevelNegEq1]=useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [isDifferentiated,setIsDifferentiated]=useState(false);
  const [currentQuestion,setCurrentQuestion]=useState<AnyQuestion>(()=>generateQuestion("level1","never",false,false));
  const [showWhiteboardAnswer,setShowWhiteboardAnswer]=useState(false);
  const [showAnswer,setShowAnswer]=useState(false);
  const [numQuestions,setNumQuestions]=useState(12);
  const [numColumns,setNumColumns]=useState(2);
  const [worksheet,setWorksheet]=useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers,setShowWorksheetAnswers]=useState(false);
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
  const startCam=useCallback(async(deviceId?: string)=>{
    stopStream();setCamError(null);
    try{
      let tid=deviceId;
      if(!tid){const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});tmp.getTracks().forEach(t=>t.stop());const all=await navigator.mediaDevices.enumerateDevices();const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!/facetime|built.?in|integrated|internal|front|rear/i.test(d.label));if(ext)tid=ext.deviceId;}
      const stream=await navigator.mediaDevices.getUserMedia({video:tid?{deviceId:{exact:tid}}:true,audio:false});
      streamRef.current=stream;if(videoRef.current)videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    }catch(e: unknown){setCamError((e instanceof Error?e.message:null)??"Camera unavailable");}
  },[stopStream]);
  useEffect(()=>{if(presenterMode)startCam();else stopStream();},[presenterMode]);
  useEffect(()=>{if(presenterMode&&streamRef.current&&videoRef.current)videoRef.current.srcObject=streamRef.current;},[wbFullscreen]);
  useEffect(()=>{if(!camDropdownOpen)return;const h=(e: MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[camDropdownOpen]);
  useEffect(()=>{const h=(e: KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[]);

  const qBg=getQuestionBg(colorScheme),stepBg=getStepBg(colorScheme);
  const isDefault=colorScheme==="default";
  const fsToolbarBg=isDefault?"#ffffff":stepBg;
  const fsQuestionBg=isDefault?"#ffffff":qBg;
  const fsWorkingBg=isDefault?"#f5f3f0":qBg;

  const handleNewQuestion=useCallback(()=>{
    setCurrentQuestion(generateQuestion(difficulty,negMode,allowZero,allowNegEq1));
    setShowWhiteboardAnswer(false);setShowAnswer(false);
  },[difficulty,negMode,allowZero,allowNegEq1]);

  const handleGenerateWorksheet=()=>{
    const usedKeys=new Set<string>(),questions: AnyQuestion[]=[];
    if(isDifferentiated){
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv=>{
        for(let i=0;i<numQuestions;i++)
          questions.push(generateUniqueQ(lv,levelNeg[lv]??"never",levelZero[lv]??false,levelNegEq1[lv]??false,usedKeys));
      });
    }else{
      for(let i=0;i<numQuestions;i++)
        questions.push(generateUniqueQ(difficulty,negMode,allowZero,allowNegEq1,usedKeys));
    }
    setWorksheet(questions);setShowWorksheetAnswers(false);
  };

  useEffect(()=>{if(mode!=="worksheet")handleNewQuestion();},[difficulty]);

  const displayFontSizes=["text-xl","text-2xl","text-3xl","text-4xl","text-5xl","text-6xl"];
  const fontSizes=["text-base","text-lg","text-xl","text-2xl","text-3xl"];
  const canDI=displayFontSize<displayFontSizes.length-1,canDD=displayFontSize>0;
  const canInc=worksheetFontSize<fontSizes.length-1,canDec=worksheetFontSize>0;
  const fontBtnStyle=(en: boolean): CSSProperties=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:en?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:en?1:0.35});

  const renderQOPopover=(diff=false)=>diff
    ?<DiffSubQOPopover levelNeg={levelNeg} setLevelNeg={setLevelNeg} levelZero={levelZero} setLevelZero={setLevelZero} levelNegEq1={levelNegEq1} setLevelNegEq1={setLevelNegEq1}/>
    :<SubQOPopover level={difficulty} negMode={negMode} setNegMode={setNegMode} allowZero={allowZero} setAllowZero={setAllowZero} allowNegEq1={allowNegEq1} setAllowNegEq1={setAllowNegEq1}/>;

  const renderQCell=(q: AnyQuestion,idx: number,bgOverride?: string)=>{
    const bg=bgOverride??stepBg,fsz=fontSizes[worksheetFontSize],instrFsz=fontSizes[Math.max(0,worksheetFontSize-1)];
    const sq=q as SubQuestion;const [v1,v2]=sq.varPair;
    return(
      <div style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative",padding:"8px 8px 8px 22px",borderRadius:"12px"}}>
        <span style={{position:"absolute",top:0,left:0,fontSize:"0.62em",fontWeight:700,color:"#000",padding:"2px 3px 4px 3px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
        <div className="flex flex-col items-center gap-1 w-full">
          <span className={`${instrFsz} font-semibold`} style={{color:"#000"}}>Solve:</span>
          {[sq.eq1Display,sq.eq2Display].map((eq,i)=>(
            <div key={i} className="flex items-baseline gap-2 justify-center">
              <span className="text-xs font-bold text-gray-400 flex-shrink-0">({i+1})</span>
              <span className={`${fsz} font-semibold`} style={{color:"#000"}}><MathRenderer latex={eq}/></span>
            </div>
          ))}
          {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            <MathRenderer latex={`${v1} = ${sq.v1Val}, \\quad ${v2} = ${sq.v2Val}`}/>
          </div>}
        </div>
      </div>
    );
  };

  const renderControlBar=()=>{
    if(mode==="worksheet")return(
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
              <button key={val} onClick={()=>{setDifficulty(val as DifficultyLevel);setIsDifferentiated(false);}}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
            ))}
          </div>
          <button onClick={()=>setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {renderQOPopover(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||12)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated?3:numColumns}
              onChange={e=>{if(!isDifferentiated)setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||2)));}}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> Generate</button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}</button>
            <button onClick={()=>handlePrint(worksheet,difficulty,isDifferentiated,numColumns)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18}/> Print / PDF</button>
          </>}
        </div>
      </div>
    );
    return(
      <div className="px-5 py-4 rounded-xl" style={{backgroundColor:qBg}}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
          {renderQOPopover()}
          <div className="flex gap-3">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
            <button onClick={()=>mode==="whiteboard"?setShowWhiteboardAnswer(a=>!a):setShowAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
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
        {renderQOPopover()}
        <div style={{display:"flex",gap:12}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );
    const questionBox=(isFS: boolean)=>(
      <div style={{position:"relative",width:isFS?"40%":"480px",height:"100%",backgroundColor:isFS?fsQuestionBg:stepBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isFS?48:32,boxSizing:"border-box",flexShrink:0,gap:16,borderRadius:isFS?0:"12px"}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        <div className={`${displayFontSizes[Math.max(0,displayFontSize-1)]} font-semibold`} style={{color:"#000"}}>Solve:</div>
        <QuestionDisplay q={currentQuestion as SubQuestion} cls={displayFontSizes[displayFontSize]}/>
        {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}>
          <MathRenderer latex={`${currentQuestion.varPair[0]} = ${currentQuestion.v1Val}, \\quad ${currentQuestion.varPair[1]} = ${currentQuestion.v2Val}`}/>
        </div>}
      </div>
    );
    const rightPanel=(isFS: boolean)=>(
      <div style={{flex:isFS?"none":1,width:isFS?"60%":undefined,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:"12px"}} className={isFS?"":"flex-1"}>
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
                      <div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>{d.label||`Camera ${i+1}`}
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
    if(wbFullscreen)return(
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div style={{flex:1,display:"flex",minHeight:0}}>
          {questionBox(true)}<div style={{width:2,backgroundColor:"#000",flexShrink:0}}/>{rightPanel(true)}
        </div>
      </div>
    );
    return(
      <div className="p-8" style={{backgroundColor:qBg,height:"480px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>{questionBox(false)}{rightPanel(false)}</div>
      </div>
    );
  };

  const renderWorkedExample=()=>(
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8" style={{backgroundColor:qBg}}>
        <div className="relative">
          <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
            <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
            <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
          </div>
          <div className="py-2 flex flex-col items-center gap-3">
            <div className={`${displayFontSizes[Math.max(0,displayFontSize-1)]} font-semibold`} style={{color:"#000"}}>Solve:</div>
            <QuestionDisplay q={currentQuestion as SubQuestion} cls={displayFontSizes[displayFontSize]}/>
          </div>
        </div>
        {showAnswer&&<WorkedSteps q={currentQuestion as SubQuestion} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]}/>}
      </div>
    </div>
  );

  const renderWorksheet=()=>{
    if(worksheet.length===0)return(
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    const fsCtrls=(
      <div className="absolute top-4 right-4 flex gap-1">
        <button disabled={!canDec} onClick={()=>canDec&&setWorksheetFontSize(f=>f-1)} className={`w-8 h-8 rounded flex items-center justify-center ${canDec?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canInc} onClick={()=>canInc&&setWorksheetFontSize(f=>f+1)} className={`w-8 h-8 rounded flex items-center justify-center ${canInc?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    if(isDifferentiated)return(
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>Substitution — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li)=>{
            const lqs=worksheet.filter(q=>q.difficulty===lv),c=LV_COLORS[lv];
            return(
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr",gridAutoRows:"1fr",gap:"0.75rem"}}>
                  {lqs.map((q,idx)=><div key={idx} style={{minHeight:0,borderRadius:"12px",overflow:"hidden"}}>{renderQCell(q,idx,c.fill)}</div>)}
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
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>Substitution — Worksheet</h2>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem"}}>
          {worksheet.map((q,idx)=><div key={idx} style={{minHeight:0,borderRadius:"12px",overflow:"hidden"}}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  return(
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={()=>{window.location.href="/";}} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
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
          <h1 className="text-5xl font-bold text-center mb-8" style={{color:"#000"}}>Simultaneous Equations by Substitution</h1>
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
