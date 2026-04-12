import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
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

const SegButtons = ({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[] }) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    fill: "#fee2e2" },
};

const getQuestionBg = (cs: string) => ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg    = (cs: string) => ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type DifficultyLevel = "level1" | "level2" | "level3";
type CaseType = "pos-pos" | "pos-neg" | "neg-neg";
type OpMode = "add" | "subtract" | "mixed";
type SurfaceForm = "std" | "swap" | "rhs-v2" | "rhs-v1";
type SubTool = "elimination" | "scaling" | "lcm";

const VAR_PAIRS: [string, string][] = [
  ["x", "y"], ["s", "t"], ["n", "m"], ["a", "b"], ["u", "v"],
];

interface SimEqQuestion {
  kind: "simeq";
  varPair: [string, string];
  a1: number; b1: number; c1: number;
  a2: number; b2: number; c2: number;
  eq1Display: string;
  eq2Display: string;
  eq1Canonical: string;
  eq2Canonical: string;
  eq1NeedsRearrange: boolean;
  eq2NeedsRearrange: boolean;
  caseType: CaseType;
  operation: "add" | "subtract";
  operationDesc: string;
  afterElimLatex: string;
  solveVarSteps: string[];
  subBackSteps: string[];
  v1Val: number;
  v2Val: number;
  key: string;
  difficulty: string;
  working: { type: string; latex: string; plain: string; label?: string }[];
  // factor scaling
  scaleFactor?: number;
  scaleEq?: 1 | 2;
  scaledEqLatex?: string;
  // lcm scaling
  scaleFactor1?: number;
  scaleFactor2?: number;
  scaledEq3Latex?: string;
  scaledEq4Latex?: string;
}

type AnyQuestion = SimEqQuestion;

// ═══════════════════════════════════════════════════════════════════════════════
// LATEX HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const term = (coeff: number, v: string): string => {
  if (coeff === 1) return v;
  if (coeff === -1) return `-${v}`;
  return `${coeff}${v}`;
};

const secondTerm = (coeff: number, v: string): string =>
  coeff >= 0 ? `+ ${term(coeff, v)}` : `- ${term(-coeff, v)}`;

const addConst = (c: number): string => c >= 0 ? `+ ${c}` : `- ${-c}`;

// Natural ordering: positive term leads; if one negative one positive, positive leads; both same sign → random
const buildNaturalLatex = (a: number, b: number, c: number, v1: string, v2: string): string => {
  let v1First: boolean;
  if (a >= 0 && b < 0)      v1First = true;
  else if (a < 0 && b >= 0) v1First = false;
  else                       v1First = Math.random() < 0.5;
  return v1First
    ? `${term(a, v1)} ${secondTerm(b, v2)} = ${c}`
    : `${term(b, v2)} ${secondTerm(a, v1)} = ${c}`;
};

const canonicalLatex = (a: number, b: number, c: number, v1: string, v2: string): string =>
  `${term(a, v1)} ${secondTerm(b, v2)} = ${c}`;

// Scaled equation: preserves variable order of source display equation.
// Checks if v2 leads by looking for v2 anywhere before v1 in the string.
const buildScaledLatex = (a: number, b: number, c: number, srcDisplay: string, v1: string, v2: string): string => {
  const idx1 = srcDisplay.indexOf(v1);
  const idx2 = srcDisplay.indexOf(v2);
  const v2Leads = idx2 !== -1 && (idx1 === -1 || idx2 < idx1);
  return v2Leads
    ? `${term(b, v2)} ${secondTerm(a, v1)} = ${c}`
    : `${term(a, v1)} ${secondTerm(b, v2)} = ${c}`;
};

const surfaceRhsV2 = (a: number, b: number, c: number, v1: string, v2: string): string => {
  const lhs = term(a, v1);
  return Math.random() < 0.5
    ? `${lhs} = ${b >= 0 ? `${c} - ${term(b, v2)}` : `${c} + ${term(-b, v2)}`}`
    : `${lhs} = ${term(b, v2)} ${addConst(c)}`;
};

const surfaceRhsV1 = (a: number, b: number, c: number, v1: string, v2: string): string => {
  const lhs = term(b, v2);
  return Math.random() < 0.5
    ? `${lhs} = ${a >= 0 ? `${c} - ${term(a, v1)}` : `${c} + ${term(-a, v1)}`}`
    : `${lhs} = ${term(a, v1)} ${addConst(c)}`;
};

const applyForm = (form: SurfaceForm, a: number, b: number, c: number, v1: string, v2: string): string => {
  switch (form) {
    case "std":    return buildNaturalLatex(a, b, c, v1, v2);
    case "swap":   return buildNaturalLatex(a, b, c, v1, v2);
    case "rhs-v2": return surfaceRhsV2(a, b, c, v1, v2);
    case "rhs-v1": return surfaceRhsV1(a, b, c, v1, v2);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED GENERATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const lcmOf = (a: number, b: number): number => (a * b) / gcd(a, b);

const pickCaseType = (level: DifficultyLevel, opMode: OpMode): CaseType => {
  if (level === "level1") return opMode === "add" ? "pos-neg" : opMode === "subtract" ? "pos-pos" : (Math.random() < 0.5 ? "pos-pos" : "pos-neg");
  if (level === "level2") return "neg-neg";
  return (["pos-pos","pos-neg","neg-neg"] as CaseType[])[Math.floor(Math.random() * 3)];
};

const pickForms = (allowRearrange: boolean): [SurfaceForm, SurfaceForm] => {
  const nat: SurfaceForm[] = ["std", "swap"];
  const rhs: SurfaceForm[] = ["rhs-v2", "rhs-v1"];
  if (!allowRearrange) return [nat[Math.floor(Math.random()*2)], nat[Math.floor(Math.random()*2)]];
  const r = Math.random();
  if (r < 0.33) return [rhs[Math.floor(Math.random()*2)], rhs[Math.floor(Math.random()*2)]];
  if (r < 0.66) return [rhs[Math.floor(Math.random()*2)], nat[Math.floor(Math.random()*2)]];
  return [nat[Math.floor(Math.random()*2)], rhs[Math.floor(Math.random()*2)]];
};

const caseTypeSigns = (ct: CaseType): [number, number] => {
  if (ct === "pos-pos") return [ 1,  1];
  if (ct === "pos-neg") return [ 1, -1];
  return [-1, -1];
};

const makeVal = (allowNeg: boolean) =>
  allowNeg && Math.random() < 0.35 ? -(Math.floor(Math.random() * 9) + 1) : Math.floor(Math.random() * 9) + 1;

// Determine operation direction for subtraction to give positive remaining coeff
const elimDirection = (bTop: number, bBot: number, cTop: number, cBot: number, topLbl: string, botLbl: string) => {
  if (bTop >= bBot) return { remainCoeff: bTop - bBot, remainRHS: cTop - cBot, operationDesc: `${topLbl} \u2212 ${botLbl}` };
  return { remainCoeff: bBot - bTop, remainRHS: cBot - cTop, operationDesc: `${botLbl} \u2212 ${topLbl}` };
};

// Build substitution-back steps matching display form of eq1
const buildSubBackSteps = (form1: SurfaceForm, a1: number, b1c: number, c1: number, v1: string, _v2: string, v2Val: number): string[] => {
  const subTermVal = b1c * v2Val;
  const remaining  = c1 - subTermVal;
  const steps: string[] = [];
  if (form1 === "std") {
    steps.push(`${term(a1, v1)} ${b1c >= 0 ? "+" : "-"} ${Math.abs(b1c)}(${v2Val}) = ${c1}`);
    steps.push(`${term(a1, v1)} ${subTermVal >= 0 ? "+" : "-"} ${Math.abs(subTermVal)} = ${c1}`);
    if (Math.abs(a1) !== 1) { steps.push(`${term(a1, v1)} = ${remaining}`); steps.push(`${v1} = ${remaining} \\div ${a1}`); }
    else steps.push(`${term(a1, v1)} = ${remaining}`);
  } else if (form1 === "swap") {
    steps.push(`${b1c >= 0 ? "" : "-"}${Math.abs(b1c)}(${v2Val}) ${a1 >= 0 ? "+" : "-"} ${Math.abs(a1) === 1 ? "" : Math.abs(a1)}${v1} = ${c1}`);
    steps.push(`${subTermVal} ${a1 >= 0 ? "+" : "-"} ${term(Math.abs(a1), v1)} = ${c1}`);
    if (Math.abs(a1) !== 1) { steps.push(`${term(a1, v1)} = ${remaining}`); steps.push(`${v1} = ${remaining} \\div ${a1}`); }
    else steps.push(`${term(a1, v1)} = ${remaining}`);
  } else if (form1 === "rhs-v2") {
    steps.push(`${term(a1, v1)} = ${c1} - ${b1c >= 0 ? "" : "-"}${Math.abs(b1c)}(${v2Val})`);
    steps.push(`${term(a1, v1)} = ${c1} - ${subTermVal}`);
    steps.push(`${term(a1, v1)} = ${remaining}`);
    if (Math.abs(a1) !== 1) steps.push(`${v1} = ${remaining} \\div ${a1}`);
  } else {
    steps.push(`${b1c >= 0 ? "" : "-"}${Math.abs(b1c)}(${v2Val}) = ${c1} - ${term(a1, v1)}`);
    steps.push(`${subTermVal} = ${c1} - ${term(a1, v1)}`);
    steps.push(`${term(a1, v1)} = ${c1} - ${subTermVal}`);
    steps.push(`${term(a1, v1)} = ${remaining}`);
    if (Math.abs(a1) !== 1) steps.push(`${v1} = ${remaining} \\div ${a1}`);
  }
  steps.push(`${v1} = ${Math.round(remaining / a1)}`);
  return steps;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ELIMINATION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuestion = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode): AnyQuestion => {
  const allowNeg       = variables["allowNegSolutions"] ?? false;
  const allowRearrange = variables["allowRearrange"]    ?? false;
  const id = Math.floor(Math.random() * 1_000_000);
  const varPair = VAR_PAIRS[Math.floor(Math.random() * VAR_PAIRS.length)];
  const [v1, v2] = varPair;

  const caseType = pickCaseType(level, opMode);
  const [sign1, sign2] = caseTypeSigns(caseType);
  const matchMag = Math.floor(Math.random() * 8) + 2;

  let b1 = Math.floor(Math.random() * 8) + 1;
  let b2 = Math.floor(Math.random() * 8) + 1;
  while (b2 === b1) b2 = Math.floor(Math.random() * 8) + 1;

  const v2Val = makeVal(allowNeg);
  const v1Val = makeVal(allowNeg);

  const a1 = sign1 * matchMag, a2 = sign2 * matchMag;
  const b1c = b1, b2c = b2;
  const c1 = a1 * v1Val + b1c * v2Val;
  const c2 = a2 * v1Val + b2c * v2Val;

  const operation: "add" | "subtract" = caseType === "pos-neg" ? "add" : "subtract";
  let operationDesc: string, remainCoeff: number, remainRHS: number;
  if (operation === "add") {
    remainCoeff = b1c + b2c; remainRHS = c1 + c2; operationDesc = "(1) + (2)";
  } else {
    ({ remainCoeff, remainRHS, operationDesc } = elimDirection(b1c, b2c, c1, c2, "(1)", "(2)"));
  }

  const afterElimLatex = remainCoeff === 1 ? `${v2} = ${remainRHS}` : remainCoeff === -1 ? `-${v2} = ${remainRHS}` : `${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps: string[] = [];
  if (Math.abs(remainCoeff) !== 1) solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if (remainCoeff === -1) solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);

  const [form1, form2] = pickForms(allowRearrange);
  const eq1Display = applyForm(form1, a1, b1c, c1, v1, v2);
  const eq2Display = applyForm(form2, a2, b2c, c2, v1, v2);
  const eq1Canonical = canonicalLatex(a1, b1c, c1, v1, v2);
  const eq2Canonical = canonicalLatex(a2, b2c, c2, v1, v2);
  const eq1NeedsRearrange = form1 === "rhs-v2" || form1 === "rhs-v1";
  const eq2NeedsRearrange = form2 === "rhs-v2" || form2 === "rhs-v1";
  const subBackSteps = buildSubBackSteps(form1, a1, b1c, c1, v1, v2, v2Val);

  return {
    kind: "simeq", varPair, a1, b1: b1c, c1, a2, b2: b2c, c2,
    eq1Display, eq2Display, eq1Canonical, eq2Canonical,
    eq1NeedsRearrange, eq2NeedsRearrange,
    caseType, operation, operationDesc, afterElimLatex,
    solveVarSteps, subBackSteps, v1Val, v2Val,
    key: `elim-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${id}`,
    difficulty: level, working: [],
  };
};

const generateUniqueQ = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion; let attempts = 0;
  do { q = generateQuestion(level, variables, opMode); attempts++; } while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACTOR SCALING GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const generateScalingQuestion = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode): AnyQuestion => {
  const allowNeg       = variables["allowNegSolutions"] ?? false;
  const allowRearrange = variables["allowRearrange"]    ?? false;
  const id = Math.floor(Math.random() * 1_000_000);
  const varPair = VAR_PAIRS[Math.floor(Math.random() * VAR_PAIRS.length)];
  const [v1, v2] = varPair;

  const caseType = pickCaseType(level, opMode);
  const [sign1, sign2] = caseTypeSigns(caseType);

  // Pick scale factor k and base magnitude, capped so k*base ≤ 15
  let k = 0, baseMag = 0, attempts = 0;
  do { k = Math.floor(Math.random() * 6) + 2; baseMag = Math.floor(Math.random() * 6) + 2; attempts++; }
  while (k * baseMag > 15 && attempts < 200);
  if (k * baseMag > 15) { k = 2; baseMag = 2; }
  const scaledMag = k * baseMag;

  const scaleEq: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
  const a1 = scaleEq === 1 ? sign1 * baseMag  : sign1 * scaledMag;
  const a2 = scaleEq === 1 ? sign2 * scaledMag : sign2 * baseMag;

  let b1 = Math.floor(Math.random() * 8) + 1;
  let b2 = Math.floor(Math.random() * 8) + 1;
  while (b2 === b1) b2 = Math.floor(Math.random() * 8) + 1;
  const b1c = b1, b2c = b2;

  const v2Val = makeVal(allowNeg);
  const v1Val = makeVal(allowNeg);
  const c1 = a1 * v1Val + b1c * v2Val;
  const c2 = a2 * v1Val + b2c * v2Val;

  // Scaled quantities
  const scaledA = scaleEq === 1 ? a1 * k : a2 * k;
  const scaledB = scaleEq === 1 ? b1c * k : b2c * k;
  const scaledC = scaleEq === 1 ? c1 * k  : c2 * k;

  const operation: "add" | "subtract" = caseType === "pos-neg" ? "add" : "subtract";

  // After scaling, the two equations used for elimination are:
  // scaleEq=1: (3) [scaled eq1] and (2)
  // scaleEq=2: (1) and (3) [scaled eq2]
  const eB_top = scaleEq === 1 ? scaledB : b1c;
  const eC_top = scaleEq === 1 ? scaledC : c1;
  const eB_bot = scaleEq === 1 ? b2c     : scaledB;
  const eC_bot = scaleEq === 1 ? c2      : scaledC;
  const topLbl = scaleEq === 1 ? "(3)" : "(1)";
  const botLbl = scaleEq === 1 ? "(2)" : "(3)";

  let operationDesc: string, remainCoeff: number, remainRHS: number;
  if (operation === "add") {
    remainCoeff = eB_top + eB_bot; remainRHS = eC_top + eC_bot;
    operationDesc = `${topLbl} + ${botLbl}`;
  } else {
    ({ remainCoeff, remainRHS, operationDesc } = elimDirection(eB_top, eB_bot, eC_top, eC_bot, topLbl, botLbl));
  }

  const afterElimLatex = remainCoeff === 1 ? `${v2} = ${remainRHS}` : remainCoeff === -1 ? `-${v2} = ${remainRHS}` : `${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps: string[] = [];
  if (Math.abs(remainCoeff) !== 1) solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if (remainCoeff === -1) solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);

  const [form1, form2] = pickForms(allowRearrange);
  const eq1Display = applyForm(form1, a1, b1c, c1, v1, v2);
  const eq2Display = applyForm(form2, a2, b2c, c2, v1, v2);
  const eq1Canonical = canonicalLatex(a1, b1c, c1, v1, v2);
  const eq2Canonical = canonicalLatex(a2, b2c, c2, v1, v2);
  const eq1NeedsRearrange = form1 === "rhs-v2" || form1 === "rhs-v1";
  const eq2NeedsRearrange = form2 === "rhs-v2" || form2 === "rhs-v1";

  // Scaled equation preserves variable order of source equation
  const srcDisplay = scaleEq === 1 ? eq1Display : eq2Display;
  const scaledEqLatex = buildScaledLatex(scaledA, scaledB, scaledC, srcDisplay, v1, v2);

  const subBackSteps = buildSubBackSteps(form1, a1, b1c, c1, v1, v2, v2Val);

  return {
    kind: "simeq", varPair, a1, b1: b1c, c1, a2, b2: b2c, c2,
    eq1Display, eq2Display, eq1Canonical, eq2Canonical,
    eq1NeedsRearrange, eq2NeedsRearrange,
    caseType, operation, operationDesc, afterElimLatex,
    solveVarSteps, subBackSteps, v1Val, v2Val,
    scaleFactor: k, scaleEq, scaledEqLatex,
    key: `scale-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${k}-${id}`,
    difficulty: level, working: [],
  };
};

const generateUniqueScalingQ = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion; let attempts = 0;
  do { q = generateScalingQuestion(level, variables, opMode); attempts++; } while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LCM SCALING GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const generateLCMQuestion = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode): AnyQuestion => {
  const allowNeg       = variables["allowNegSolutions"] ?? false;
  const allowRearrange = variables["allowRearrange"]    ?? false;
  const id = Math.floor(Math.random() * 1_000_000);
  const varPair = VAR_PAIRS[Math.floor(Math.random() * VAR_PAIRS.length)];
  const [v1, v2] = varPair;

  const caseType = pickCaseType(level, opMode);
  const [sign1, sign2] = caseTypeSigns(caseType);

  // Pool of coprime pairs (p,q) with 2≤p<q≤9, gcd=1, lcm≤30
  const coprimePairs: [number, number][] = [];
  for (let p = 2; p <= 9; p++)
    for (let q = p + 1; q <= 9; q++)
      if (gcd(p, q) === 1 && lcmOf(p, q) <= 30) coprimePairs.push([p, q]);

  const [mag1, mag2] = coprimePairs[Math.floor(Math.random() * coprimePairs.length)];
  const elimLCM = lcmOf(mag1, mag2);
  const kFor1 = elimLCM / mag1;
  const kFor2 = elimLCM / mag2;

  const a1 = sign1 * mag1;
  const a2 = sign2 * mag2;

  let b1 = Math.floor(Math.random() * 8) + 1;
  let b2 = Math.floor(Math.random() * 8) + 1;
  while (b2 === b1) b2 = Math.floor(Math.random() * 8) + 1;
  const b1c = b1, b2c = b2;

  const v2Val = makeVal(allowNeg);
  const v1Val = makeVal(allowNeg);
  const c1 = a1 * v1Val + b1c * v2Val;
  const c2 = a2 * v1Val + b2c * v2Val;

  const scaledA1 = a1 * kFor1, scaledB1 = b1c * kFor1, scaledC1 = c1 * kFor1;
  const scaledA2 = a2 * kFor2, scaledB2 = b2c * kFor2, scaledC2 = c2 * kFor2;

  const operation: "add" | "subtract" = caseType === "pos-neg" ? "add" : "subtract";
  let operationDesc: string, remainCoeff: number, remainRHS: number;
  if (operation === "add") {
    remainCoeff = scaledB1 + scaledB2; remainRHS = scaledC1 + scaledC2; operationDesc = "(3) + (4)";
  } else {
    ({ remainCoeff, remainRHS, operationDesc } = elimDirection(scaledB1, scaledB2, scaledC1, scaledC2, "(3)", "(4)"));
  }

  const afterElimLatex = remainCoeff === 1 ? `${v2} = ${remainRHS}` : remainCoeff === -1 ? `-${v2} = ${remainRHS}` : `${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps: string[] = [];
  if (Math.abs(remainCoeff) !== 1) solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if (remainCoeff === -1) solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);

  const [form1, form2] = pickForms(allowRearrange);
  const eq1Display = applyForm(form1, a1, b1c, c1, v1, v2);
  const eq2Display = applyForm(form2, a2, b2c, c2, v1, v2);
  const eq1Canonical = canonicalLatex(a1, b1c, c1, v1, v2);
  const eq2Canonical = canonicalLatex(a2, b2c, c2, v1, v2);
  const eq1NeedsRearrange = form1 === "rhs-v2" || form1 === "rhs-v1";
  const eq2NeedsRearrange = form2 === "rhs-v2" || form2 === "rhs-v1";

  // Scaled equations preserve variable order of their source displays
  const scaledEq3Latex = buildScaledLatex(scaledA1, scaledB1, scaledC1, eq1Display, v1, v2);
  const scaledEq4Latex = buildScaledLatex(scaledA2, scaledB2, scaledC2, eq2Display, v1, v2);

  const subBackSteps = buildSubBackSteps(form1, a1, b1c, c1, v1, v2, v2Val);

  return {
    kind: "simeq", varPair, a1, b1: b1c, c1, a2, b2: b2c, c2,
    eq1Display, eq2Display, eq1Canonical, eq2Canonical,
    eq1NeedsRearrange, eq2NeedsRearrange,
    caseType, operation, operationDesc, afterElimLatex,
    solveVarSteps, subBackSteps, v1Val, v2Val,
    scaleFactor1: kFor1, scaleFactor2: kFor2,
    scaledEq3Latex, scaledEq4Latex,
    key: `lcm-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${mag1}-${mag2}-${b1}-${b2}-${id}`,
    difficulty: level, working: [],
  };
};

const generateUniqueLCMQ = (level: DifficultyLevel, variables: Record<string, boolean>, opMode: OpMode, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion; let attempts = 0;
  do { q = generateLCMQuestion(level, variables, opMode); attempts++; } while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const Instruction = ({ cls }: { cls: string }) => (
  <div className={`${cls} font-semibold text-center w-full`} style={{ color: "#000" }}>Solve:</div>
);

const EqPair = ({ q, cls }: { q: SimEqQuestion; cls: string }) => (
  <div className="flex flex-col items-center gap-2 w-full">
    {[q.eq1Display, q.eq2Display].map((eq, i) => (
      <div key={i} className="flex items-baseline justify-center">
        <span className={`${cls} font-semibold`} style={{ color: "#000" }}><MathRenderer latex={eq} /></span>
      </div>
    ))}
  </div>
);

const EqPairLabelled = ({ q, cls }: { q: SimEqQuestion; cls: string }) => (
  <div className="flex flex-col items-center gap-2 w-full">
    {[q.eq1Display, q.eq2Display].map((eq, i) => (
      <div key={i} className="flex items-baseline gap-3 justify-center">
        <span className="text-sm font-bold text-gray-400 w-8 text-right flex-shrink-0">({i + 1})</span>
        <span className={`${cls} font-semibold`} style={{ color: "#000" }}><MathRenderer latex={eq} /></span>
      </div>
    ))}
  </div>
);

const SingleEqCanonical = ({ latex, label, cls }: { latex: string; label: string; cls: string }) => (
  <div className="flex items-baseline gap-3 justify-center">
    <span className="text-sm font-bold text-gray-400 w-8 text-right flex-shrink-0">{label}</span>
    <span className={`${cls} font-semibold`} style={{ color: "#000", minWidth: "10ch" }}><MathRenderer latex={latex} /></span>
  </div>
);

const WorkedSteps = ({ q, stepBg, fsz }: { q: SimEqQuestion; stepBg: string; fsz: string }) => {
  const [v1, v2] = q.varPair;
  const isFactorScaling = !!q.scaleFactor;
  const isLCM = !!q.scaleFactor1;

  const card = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl p-5" style={{ backgroundColor: stepBg }}>
      <h4 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wide">{title}</h4>
      <div className={`${fsz} font-semibold flex flex-col gap-2 items-center`} style={{ color: "#000" }}>{children}</div>
    </div>
  );
  const mathLine = (latex: string, label?: string) => (
    <div className="flex items-baseline gap-3 justify-center">
      {label && <span className="text-xs font-bold text-gray-400 w-16 text-right flex-shrink-0">{label}</span>}
      <MathRenderer latex={latex} />
    </div>
  );

  const opExplain = q.caseType === "pos-neg"
    ? `The ${v1}-coefficients are equal and opposite — add ${q.operationDesc} to eliminate ${v1}.`
    : q.caseType === "pos-pos"
      ? `The ${v1}-coefficients are equal — subtract ${q.operationDesc} to eliminate ${v1}.`
      : `The ${v1}-coefficients are both negative — subtract ${q.operationDesc} to eliminate ${v1}.`;

  let stepNum = 1;
  const steps: React.ReactNode[] = [];

  steps.push(card(`Step ${stepNum++} — Label the equations`, <EqPairLabelled q={q} cls={fsz} />));

  if (q.eq1NeedsRearrange && q.eq2NeedsRearrange) {
    steps.push(card(`Step ${stepNum++} — Rearrange equation (1)`, <SingleEqCanonical latex={q.eq1Canonical} label="(1)" cls={fsz} />));
    steps.push(card(`Step ${stepNum++} — Rearrange equation (2)`, <SingleEqCanonical latex={q.eq2Canonical} label="(2)" cls={fsz} />));
  } else if (q.eq1NeedsRearrange) {
    steps.push(card(`Step ${stepNum++} — Rearrange equation (1)`, <SingleEqCanonical latex={q.eq1Canonical} label="(1)" cls={fsz} />));
  } else if (q.eq2NeedsRearrange) {
    steps.push(card(`Step ${stepNum++} — Rearrange equation (2)`, <SingleEqCanonical latex={q.eq2Canonical} label="(2)" cls={fsz} />));
  }

  if (isLCM && q.scaledEq3Latex && q.scaledEq4Latex) {
    steps.push(card(`Step ${stepNum++} — Multiply equation (1) by ${q.scaleFactor1}`, mathLine(q.scaledEq3Latex, "(3)")));
    steps.push(card(`Step ${stepNum++} — Multiply equation (2) by ${q.scaleFactor2}`, mathLine(q.scaledEq4Latex, "(4)")));
  } else if (isFactorScaling && q.scaledEqLatex) {
    steps.push(card(`Step ${stepNum++} — Multiply equation (${q.scaleEq}) by ${q.scaleFactor}`, mathLine(q.scaledEqLatex, "(3)")));
  }

  steps.push(card(`Step ${stepNum++} — Eliminate ${v1}`, (
    <><p className="text-sm font-normal text-gray-500 mb-1 text-center">{opExplain}</p>{mathLine(q.afterElimLatex, q.operationDesc)}</>
  )));
  steps.push(card(`Step ${stepNum++} — Solve for ${v2}`,
    <>{q.solveVarSteps.map((s, i) => <div key={i}>{mathLine(s)}</div>)}</>
  ));
  steps.push(card(`Step ${stepNum++} — Substitute ${v2} = ${q.v2Val} into equation (1)`,
    <>{q.subBackSteps.map((s, i) => <div key={i}>{mathLine(s)}</div>)}</>
  ));
  steps.push(card("Solution", <div className="text-center"><MathRenderer latex={`${v1} = ${q.v1Val}, \\quad ${v2} = ${q.v2Val}`} /></div>));
  return <div className="space-y-4 mt-6">{steps}</div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QO POPOVERS
// ═══════════════════════════════════════════════════════════════════════════════

const QOPopover = ({ level, opMode, setOpMode, allowNeg, setAllowNeg, allowRearrange, setAllowRearrange }: {
  level: DifficultyLevel; opMode: OpMode; setOpMode: (v: OpMode) => void;
  allowNeg: boolean; setAllowNeg: (v: boolean) => void;
  allowRearrange: boolean; setAllowRearrange: (v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          {level === "level1" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Operation</span>
              <SegButtons value={opMode} onChange={v => setOpMode(v as OpMode)}
                opts={[{ value: "add", label: "Addition" }, { value: "subtract", label: "Subtraction" }, { value: "mixed", label: "Mixed" }]} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
            <TogglePill checked={allowNeg} onChange={setAllowNeg} label="Allow negative solutions" />
            <TogglePill checked={allowRearrange} onChange={setAllowRearrange} label="Require rearranging" />
          </div>
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({
  levelOps, setLevelOps, levelNeg, setLevelNeg, levelRearrange, setLevelRearrange,
}: {
  levelOps: Record<string, OpMode>; setLevelOps: (v: Record<string, OpMode>) => void;
  levelNeg: Record<string, boolean>; setLevelNeg: (v: Record<string, boolean>) => void;
  levelRearrange: Record<string, boolean>; setLevelRearrange: (v: Record<string, boolean>) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1", "level2", "level3"] as DifficultyLevel[];
  const lvLabels: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
  const lvColors: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {levels.map(lv => (
            <div key={lv} className="flex flex-col gap-2">
              <span className={`text-sm font-extrabold uppercase tracking-wider ${lvColors[lv]}`}>{lvLabels[lv]}</span>
              <div className="flex flex-col gap-2 pl-1">
                {lv === "level1" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Operation</span>
                    <SegButtons value={levelOps[lv] ?? "mixed"} onChange={v => setLevelOps({ ...levelOps, [lv]: v as OpMode })}
                      opts={[{ value: "add", label: "Add" }, { value: "subtract", label: "Sub" }, { value: "mixed", label: "Mix" }]} />
                  </div>
                )}
                <TogglePill checked={levelNeg[lv] ?? false} onChange={v => setLevelNeg({ ...levelNeg, [lv]: v })} label="Negative solutions" />
                <TogglePill checked={levelRearrange[lv] ?? false} onChange={v => setLevelRearrange({ ...levelRearrange, [lv]: v })} label="Rearranging" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// INFO & MENU
// ═══════════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS = [
  { title: "Elimination", icon: "➕", content: [
    { label: "Overview", detail: "One variable already has matching coefficient magnitudes. Add or subtract to eliminate it directly." },
    { label: "Level 1 — Green", detail: "At least one matching coefficient is positive. Use the QO selector to force addition, subtraction, or allow both." },
    { label: "Level 2 — Yellow", detail: "Both matching coefficients are negative." },
    { label: "Level 3 — Red", detail: "Full mixture of all three cases." },
  ]},
  { title: "Factor Scaling", icon: "✖️", content: [
    { label: "Overview", detail: "One coefficient is a direct multiple of the other. Scale one equation to match, then eliminate." },
    { label: "Level 1 — Green", detail: "At least one matching coefficient is positive." },
    { label: "Level 2 — Yellow", detail: "Both matching coefficients are negative." },
    { label: "Level 3 — Red", detail: "Full mixture of all three cases." },
  ]},
  { title: "LCM Scaling", icon: "🔢", content: [
    { label: "Overview", detail: "Neither coefficient divides the other (coprime pair). Scale both equations to their LCM, then eliminate." },
    { label: "Level 1 — Green", detail: "At least one matching coefficient is positive." },
    { label: "Level 2 — Yellow", detail: "Both matching coefficients are negative." },
    { label: "Level 3 — Red", detail: "Full mixture of all three cases." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Operation (Level 1)", detail: "Force addition, subtraction, or allow either (Mixed)." },
    { label: "Allow negative solutions", detail: "When on, the variable values may be negative." },
    { label: "Require rearranging", detail: "When on, one or both equations may be given in rearranged form." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right." },
    { label: "Worked Example", detail: "Step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => (
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
  colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}{colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
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

const handlePrint = (questions: AnyQuestion[], difficulty: string, isDifferentiated: boolean, numColumns: number, subTool: SubTool) => {
  const FONT_PX = 13, PAD_MM = 3.5, MARGIN_MM = 12, HEADER_MM = 14, GAP_MM = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2, PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const cols = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated ? (PAGE_W_MM - GAP_MM * 2) / 3 : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;
  const diffHdrMM = 7;
  const difficultyLabel = isDifferentiated ? "Differentiated" : difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalQ = questions.length;
  const toolName = subTool === "scaling" ? "Factor Scaling" : subTool === "lcm" ? "LCM Scaling" : "Elimination";
  const qData = questions.map((q: any, i: number) => ({
    eq1: q.eq1Display, eq2: q.eq2Display,
    v1: q.varPair[0], v2: q.varPair[1],
    v1Val: q.v1Val, v2Val: q.v2Val,
    difficulty: q.difficulty, idx: i,
  }));

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Simultaneous Equations — ${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4;margin:${MARGIN_MM}mm;}
body{font-family:"Segoe UI",Arial,sans-serif;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:0.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.ph .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}
.cell,.dc{border:0.3mm solid #d1d5db;border-radius:1mm;padding:${PAD_MM}mm;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;}
.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}
.dcol{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.dh{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.dh.level1{background:#dcfce7;color:#166534;}.dh.level2{background:#fef9c3;color:#854d0e;}.dh.level3{background:#fee2e2;color:#991b1b;}
.qn{position:absolute;top:0;left:0;font-size:${Math.round(FONT_PX*0.6)}px;font-weight:700;color:#000;padding:1.2mm;border-right:0.3mm solid #000;border-bottom:0.3mm solid #000;}
.instr{font-size:${Math.round(FONT_PX*0.8)}px;font-weight:600;color:#000;text-align:center;}
.er{display:flex;align-items:baseline;gap:3px;justify-content:center;}
.em .katex{font-size:${FONT_PX}px;}
.qa{font-size:${FONT_PX}px;color:#059669;text-align:center;margin-top:1mm;}
.qa .katex{font-size:${FONT_PX}px;}
.kr{display:inline-block;vertical-align:baseline;}
#probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-size:${FONT_PX}px;width:${cellW_MM-PAD_MM*2}mm;}
</style></head><body>
<div id="probe"></div><div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxMm=${96/25.4},PAD=${PAD_MM},GAP=${GAP_MM},usableH=${usableH_MM},dHdr=${diffHdrMM};
  var PWmm=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var qData=${JSON.stringify(qData)};
  function kr(el,latex){try{katex.render(latex,el,{throwOnError:false,output:"html"});}catch(e){el.textContent=latex;}}
  function kEl(latex){var s=document.createElement("span");s.className="kr";kr(s,latex);return s;}
  function cellInner(item,showAns){
    var div=document.createElement("div");div.style.width="100%";div.style.textAlign="center";
    var instr=document.createElement("div");instr.className="instr";instr.textContent="Solve:";div.appendChild(instr);
    [item.eq1,item.eq2].forEach(function(eq){
      var row=document.createElement("div");row.className="er";
      var math=document.createElement("span");math.className="em";math.appendChild(kEl(eq));
      row.appendChild(math);div.appendChild(row);
    });
    if(showAns){var a=document.createElement("div");a.className="qa";a.appendChild(kEl(item.v1+"="+item.v1Val+",\\\\quad "+item.v2+"="+item.v2Val));div.appendChild(a);}
    return div;
  }
  function makeCell(item,showAns,cW,cH,diff){
    var cell=document.createElement("div");cell.className=diff?"dc":"cell";
    cell.style.width=cW+"mm";cell.style.height=cH+"mm";
    var num=document.createElement("div");num.className="qn";num.textContent=(item.idx+1)+")";
    cell.appendChild(num);cell.appendChild(cellInner(item,showAns));return cell;
  }
  var probe=document.getElementById("probe"),maxH=0;
  qData.forEach(function(item){var el=cellInner(item,true);probe.appendChild(el);if(el.scrollHeight>maxH)maxH=el.scrollHeight;probe.removeChild(el);});
  var needed=maxH/pxMm+PAD*2+5;
  var rowH=[];for(var r=0;r<10;r++)rowH.push((usableH-GAP*r)/(r+1));
  var chosenH=rowH[0],rpp=1;
  for(var r=0;r<rowH.length;r++){if((r+1)*cols>=totalQ&&rowH[r]>=needed){chosenH=rowH[r];rpp=r+1;break;}}
  if(chosenH<needed)for(var r=0;r<rowH.length;r++){if(rowH[r]>=needed){chosenH=rowH[r];rpp=r+1;}}
  var dpc=Math.floor(totalQ/3),dUsable=usableH-dHdr-GAP,dRows=1,dCellH=dUsable;
  for(var rd=0;rd<10;rd++){var h=(dUsable-GAP*rd)/(rd+1);if(h>=needed){dRows=rd+1;dCellH=h;}else break;}
  var cW=isDiff?(PWmm-GAP*2)/3:(PWmm-GAP*(cols-1))/cols;
  var lvls=["level1","level2","level3"],lbls=["Level 1","Level 2","Level 3"];
  function makePage(pageData,showAns,pgIdx,totalPages){
    var page=document.createElement("div");page.className="page";
    var hdr=document.createElement("div");hdr.className="ph";
    var h1=document.createElement("h1");h1.textContent="Simultaneous Equations — "+toolName+(showAns?" — Answers":"");
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
      var grid=document.createElement("div");grid.className="grid";
      grid.style.gridTemplateColumns="repeat("+cols+","+cW+"mm)";
      grid.style.gridTemplateRows="repeat("+Math.ceil(pageData.length/cols)+","+cH+"mm)";
      pageData.forEach(function(item){grid.appendChild(makeCell(item,showAns,cW,cH,false));});
      page.appendChild(grid);
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

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use PDF export."); return; }
  win.document.write(html); win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [subTool, setSubTool] = useState<SubTool>("elimination");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");
  const [opMode, setOpMode] = useState<OpMode>("mixed");
  const [allowNeg, setAllowNeg] = useState(false);
  const [allowRearrange, setAllowRearrange] = useState(false);
  const [levelOps, setLevelOps] = useState<Record<string,OpMode>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelNeg, setLevelNeg] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [levelRearrange, setLevelRearrange] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [isDifferentiated, setIsDifferentiated] = useState(false);

  const makeVars = (neg: boolean, rear: boolean) => ({ allowNegSolutions: neg, allowRearrange: rear });

  const genQ = (st: SubTool, lv: DifficultyLevel, vars: Record<string,boolean>, om: OpMode) =>
    st === "scaling" ? generateScalingQuestion(lv, vars, om)
    : st === "lcm"   ? generateLCMQuestion(lv, vars, om)
    : generateQuestion(lv, vars, om);

  const genUniqueQ = (st: SubTool, lv: DifficultyLevel, vars: Record<string,boolean>, om: OpMode, used: Set<string>) =>
    st === "scaling" ? generateUniqueScalingQ(lv, vars, om, used)
    : st === "lcm"   ? generateUniqueLCMQ(lv, vars, om, used)
    : generateUniqueQ(lv, vars, om, used);

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("level1", makeVars(false, false), "mixed")
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(12);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let tid = deviceId;
      if (!tid) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !/facetime|built.?in|integrated|internal|front|rear/i.test(d.label));
        if (ext) tid = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: tid ? { deviceId: { exact: tid } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  const qBg    = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefault = colorScheme === "default";
  const fsToolbarBg  = isDefault ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefault ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefault ? "#f5f3f0" : qBg;

  const handleNewQuestion = () => {
    setCurrentQuestion(genQ(subTool, difficulty, makeVars(allowNeg, allowRearrange), opMode));
    setShowWhiteboardAnswer(false); setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        for (let i = 0; i < numQuestions; i++)
          questions.push(genUniqueQ(subTool, lv, makeVars(levelNeg[lv]??false, levelRearrange[lv]??false), levelOps[lv]??"mixed", usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(genUniqueQ(subTool, difficulty, makeVars(allowNeg, allowRearrange), opMode, usedKeys));
    }
    setWorksheet(questions); setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, subTool]);

  const displayFontSizes = ["text-xl","text-2xl","text-3xl","text-4xl","text-5xl","text-6xl"];
  const instrFontSizes   = ["text-base","text-lg","text-xl","text-2xl","text-3xl","text-4xl"];
  const canDInc = displayFontSize < displayFontSizes.length - 1;
  const canDDec = displayFontSize > 0;
  const fontSizes = ["text-base","text-lg","text-xl","text-2xl","text-3xl"];
  const canInc = worksheetFontSize < fontSizes.length - 1;
  const canDec = worksheetFontSize > 0;

  const fontBtnStyle = (enabled: boolean): React.CSSProperties => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.35,
  });

  const qoProps = { level: difficulty, opMode, setOpMode, allowNeg, setAllowNeg, allowRearrange, setAllowRearrange };
  const diffQOProps = { levelOps, setLevelOps, levelNeg, setLevelNeg, levelRearrange, setLevelRearrange };

  const subToolLabel = subTool === "scaling" ? "Factor Scaling" : subTool === "lcm" ? "LCM Scaling" : "Elimination";

  // ── Worksheet cell ────────────────────────────────────────────────────────

  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const simQ = q as SimEqQuestion;
    const [v1, v2] = simQ.varPair;
    const bg = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
    return (
      <div style={{ backgroundColor: bg, height: "100%", boxSizing: "border-box", position: "relative", padding: "8px 8px 8px 22px" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.62em", fontWeight: 700, color: "#000", padding: "2px 3px 4px 3px", borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>{idx + 1})</span>
        <div className="flex flex-col items-center gap-1 w-full">
          <span className={`${instrFsz} font-semibold`} style={{ color: "#000" }}>Solve:</span>
          {[simQ.eq1Display, simQ.eq2Display].map((eq, i) => (
            <div key={i} className="flex items-baseline justify-center">
              <span className={`${fsz} font-semibold`} style={{ color: "#000" }}><MathRenderer latex={eq} /></span>
            </div>
          ))}
          {showWorksheetAnswers && (
            <div className={`${fsz} font-semibold mt-1 text-center`} style={{ color: "#059669" }}>
              <MathRenderer latex={`${v1} = ${simQ.v1Val}, \\quad ${v2} = ${simQ.v2Val}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────

  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col]) => (
              <button key={val} onClick={() => { setDifficulty(val as DifficultyLevel); setIsDifferentiated(false); }}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {isDifferentiated ? <DiffQOPopover {...diffQOProps} /> : <QOPopover {...qoProps} />}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||12)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated?3:numColumns}
              onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||2))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`} />
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18}/> Generate
          </button>
          {worksheet.length > 0 && <>
            <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}
            </button>
            <button onClick={() => handlePrint(worksheet, difficulty, isDifferentiated, numColumns, subTool)}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
              <Printer size={18}/> Print / PDF
            </button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          <QOPopover {...qoProps} />
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18}/> New Question
            </button>
            <button onClick={() => mode==="whiteboard" ? setShowWhiteboardAnswer(a=>!a) : setShowAnswer(a=>!a)}
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
    const simQ = currentQuestion as SimEqQuestion;
    const [v1, v2] = simQ.varPair;

    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
        <QOPopover {...qoProps} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    const questionContent = (
      <div className="w-full flex flex-col gap-3 items-center">
        <Instruction cls={instrFontSizes[displayFontSize]} />
        <EqPair q={simQ} cls={displayFontSizes[displayFontSize]} />
        {showWhiteboardAnswer && (
          <div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{ color: "#166534" }}>
            <MathRenderer latex={`${v1} = ${simQ.v1Val}, \\quad ${v2} = ${simQ.v2Val}`} />
          </div>
        )}
      </div>
    );

    const questionBox = (isFS: boolean) => (
      <div style={{ position: "relative", width: isFS?"40%":"480px", height: "100%", backgroundColor: isFS?fsQuestionBg:stepBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isFS?48:32, boxSizing: "border-box", flexShrink: 0, borderRadius: isFS?0:undefined }}>
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          <button style={fontBtnStyle(canDDec)} onClick={() => canDDec && setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDInc)} onClick={() => canDInc && setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {questionContent}
      </div>
    );

    const rightPanel = (isFS: boolean) => (
      <div style={{ flex: isFS?"none":1, width: isFS?"60%":undefined, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode?"#000":(isFS?fsWorkingBg:stepBg), borderRadius: isFS?0:undefined }} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode && (
          <><video ref={videoRef} autoPlay playsInline muted style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
            {camError && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1 }}>{camError}</div>}</>
        )}
        <div style={{ position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20 }}>
          {presenterMode ? (
            <div style={{ position:"relative" }} ref={camDropdownRef}>
              <button
                onMouseDown={() => { didLongPress.current=false; longPressTimer.current=setTimeout(()=>{ didLongPress.current=true; setCamDropdownOpen(o=>!o); },500); }}
                onMouseUp={() => { if(longPressTimer.current) clearTimeout(longPressTimer.current); if(!didLongPress.current) setPresenterMode(false); }}
                onMouseLeave={() => { if(longPressTimer.current) clearTimeout(longPressTimer.current); }}
                style={{ background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Video size={16} color="rgba(255,255,255,0.85)"/>
              </button>
              {camDropdownOpen && (
                <div style={{ position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30 }}>
                  <div style={{ padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)" }}>Camera</div>
                  {camDevices.map((d,i) => (
                    <div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if(d.deviceId!==currentCamId) startCam(d.deviceId); }}
                      style={{ padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0 }}/>
                      {d.label||`Camera ${i+1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setPresenterMode(true)} style={{ background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Video size={16} color="#6b7280"/>
            </button>
          )}
          <button onClick={() => setWbFullscreen(f=>!f)}
            style={{ background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:presenterMode?"1px solid rgba(255,255,255,0.15)":"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>
            {wbFullscreen?<Minimize2 size={16} color="#ffffff"/>:<Maximize2 size={16} color={presenterMode?"rgba(255,255,255,0.85)":"#6b7280"}/>}
          </button>
        </div>
      </div>
    );

    if (wbFullscreen) return (
      <div style={{ position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column" }}>
        {fsToolbar}
        <div style={{ flex:1,display:"flex",minHeight:0 }}>
          {questionBox(true)}
          <div style={{ width:2,backgroundColor:"#000",flexShrink:0 }}/>
          {rightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}>
        <div className="flex gap-6" style={{ height: "100%" }}>
          {questionBox(false)}
          {rightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked Example ────────────────────────────────────────────────────────

  const renderWorkedExample = () => {
    const simQ = currentQuestion as SimEqQuestion;
    return (
      <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
        <div className="p-8" style={{ backgroundColor: qBg }}>
          <div className="relative">
            <div style={{ position:"absolute",top:0,right:0,display:"flex",gap:6 }}>
              <button style={fontBtnStyle(canDDec)} onClick={() => canDDec && setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
              <button style={fontBtnStyle(canDInc)} onClick={() => canDInc && setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
            </div>
            <div className="py-2 flex flex-col items-center gap-3">
              <Instruction cls={instrFontSizes[displayFontSize]} />
              <EqPair q={simQ} cls={displayFontSizes[displayFontSize]} />
            </div>
          </div>
          {showAnswer && <WorkedSteps q={simQ} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]} />}
        </div>
      </div>
    );
  };

  // ── Worksheet ─────────────────────────────────────────────────────────────

  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex gap-1">
        <button disabled={!canDec} onClick={() => canDec && setWorksheetFontSize(f=>f-1)} className={`w-8 h-8 rounded flex items-center justify-center ${canDec?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canInc} onClick={() => canInc && setWorksheetFontSize(f=>f+1)} className={`w-8 h-8 rounded flex items-center justify-center ${canInc?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{subToolLabel} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                <div style={{ display:"grid",gridTemplateColumns:"1fr",gridAutoRows:"1fr",gap:"0.75rem" }}>
                  {lqs.map((q,idx) => <div key={idx} style={{ minHeight:0 }}>{renderQCell(q,idx,c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{subToolLabel} — Worksheet</h2>
        <div style={{ display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem" }}>
          {worksheet.map((q,idx) => <div key={idx} style={{ minHeight:0 }}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Root ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href="/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24}/><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen?<X size={28}/>:<Menu size={28}/>}
            </button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)}/>}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)}/>}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>Simultaneous Equations</h1>
          <div className="flex justify-center mb-6"><div style={{ width:"90%",height:"2px",backgroundColor:"#d1d5db" }}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {([["elimination","Elimination"],["scaling","Factor Scaling"],["lcm","LCM Scaling"]] as const).map(([st,label]) => (
              <button key={st} onClick={() => { setSubTool(st); setWorksheet([]); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${subTool===st?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width:"90%",height:"2px",backgroundColor:"#d1d5db" }}/></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>
          {mode==="worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode!=="worksheet" && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">{renderControlBar()}</div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode==="whiteboard" && renderWhiteboard()}
                {mode==="single" && renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
