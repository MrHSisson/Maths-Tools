import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── KaTeX loader ──────────────────────────────────────────────────────────────
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

interface MathProps { latex: string; style?: CSSProperties; className?: string; }
const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  const safeLatex = latex ?? "";
  useEffect(() => {
    if (!ready || !ref.current) return;
    try { w().katex.render(safeLatex, ref.current, { displayMode: false, throwOnError: false, output: "html" }); }
    catch { if (ref.current) ref.current.textContent = safeLatex; }
  }, [safeLatex, ready]);
  const hasFrac = safeLatex.includes("\\frac");
  return <span ref={ref} className={className} style={{ display: "inline", verticalAlign: "baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style }} />;
};

// ── Popover hook ──────────────────────────────────────────────────────────────
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

// ── Shared UI components ──────────────────────────────────────────────────────
const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

const MultiSegButtons = ({ values, onChange, opts }: {
  values: string[]; onChange: (v: string[]) => void; opts: { value: string; label: string }[];
}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt => {
      const active = values.includes(opt.value);
      return (
        <button key={opt.value} onClick={() => {
          if (active && values.length === 1) return;
          onChange(active ? values.filter(v => v !== opt.value) : [...values, opt.value]);
        }} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${active ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      );
    })}
  </div>
);

const TogglePill = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? "bg-blue-900" : "bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

// ── Rational arithmetic ───────────────────────────────────────────────────────
type Rat = { n: number; d: number };
const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
const rat = (n: number, d = 1): Rat => {
  if (d === 0) throw new Error("zero denominator");
  const sign = d < 0 ? -1 : 1;
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: sign * n / g, d: Math.abs(d) / g };
};
const ratAdd = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const ratSub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const ratMul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
const ratDiv = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n);
const isInt = (r: Rat) => r.d === 1;
const ratEq = (a: Rat, b: Rat) => a.n === b.n && a.d === b.d;
const ratLatex = (r: Rat): string => {
  if (isInt(r)) return `${r.n}`;
  const neg = r.n < 0;
  return neg ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`;
};
const fracLatex = (n: number, d: number): string => {
  const g = gcd(Math.abs(n), Math.abs(d));
  const rn = n / g, rd = Math.abs(d / g);
  if (rd === 1) return `${rn}`;
  return rn < 0 ? `-\\frac{${-rn}}{${rd}}` : `\\frac{${rn}}{${rd}}`;
};

// ── Config ────────────────────────────────────────────────────────────────────
type ToolType = "gradient" | "equation" | "missing";
type DifficultyLevel = "level1" | "level2" | "level3";
type MissingVar = "x" | "y" | "m" | "c";

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};

const SHARED_VARIABLES = [
  { key: "randomOrder", label: "Random coordinate order", defaultValue: false },
  { key: "negativeCoords", label: "Include negative coordinates", defaultValue: false },
];

const MISSING_VAR_OPTIONS: { value: MissingVar; label: string }[] = [
  { value: "x", label: "x" }, { value: "y", label: "y" },
  { value: "m", label: "m" }, { value: "c", label: "c" },
];

interface ToolDef {
  name: string;
  instruction?: string;
  useSubstantialBoxes: boolean;
  variables: { key: string; label: string; defaultValue: boolean }[];
  dropdown: null | { key: string; label: string; options: { value: string; label: string }[]; defaultValue: string };
  difficultySettings: Record<string, {
    dropdown?: null | { key: string; label: string; options: { value: string; label: string }[]; defaultValue: string };
    variables?: { key: string; label: string; defaultValue: boolean }[];
  }> | null;
}

const LEVEL3_DD = {
  key: "fracSign", label: "Gradient Sign",
  options: [{ value: "positive", label: "Positive" }, { value: "negative", label: "Negative" }, { value: "mixed", label: "Mixed" }],
  defaultValue: "positive",
};

const SHARED_DIFF_SETTINGS = {
  level1: { dropdown: null, variables: SHARED_VARIABLES },
  level2: { dropdown: null, variables: SHARED_VARIABLES },
  level3: { dropdown: LEVEL3_DD, variables: SHARED_VARIABLES },
};

const TOOL_CONFIG = {
  pageTitle: "Properties of Line Equations",
  tools: {
    gradient: { name: "Gradients", instruction: "Find the gradient of the line connecting:", useSubstantialBoxes: true, variables: SHARED_VARIABLES, dropdown: null, difficultySettings: SHARED_DIFF_SETTINGS },
    equation: { name: "Line Equations", instruction: "Find the equation of the line connecting:", useSubstantialBoxes: true, variables: SHARED_VARIABLES, dropdown: null, difficultySettings: SHARED_DIFF_SETTINGS },
    missing: { name: "Missing Values", instruction: "", useSubstantialBoxes: true, variables: [], dropdown: null, difficultySettings: { level1: { dropdown: null, variables: [] }, level2: { dropdown: null, variables: [] }, level3: { dropdown: null, variables: [] } } },
  } as Record<string, ToolDef>,
};

const INFO_SECTIONS = [
  { title: "Gradients", icon: "📈", content: [
    { label: "Overview", detail: "Given two coordinate pairs, calculate the gradient using m = (y₂ − y₁) ÷ (x₂ − x₁)." },
    { label: "Level 1 — Green", detail: "Positive integer gradients." },
    { label: "Level 2 — Yellow", detail: "Negative integer gradients." },
    { label: "Level 3 — Red", detail: "Fractional gradients (denominators 2–10). Set to positive, negative, or mixed." },
  ]},
  { title: "Line Equations", icon: "📝", content: [
    { label: "Overview", detail: "Find the gradient first, then substitute a coordinate into y = mx + c to solve for c." },
    { label: "Level 1 — Green", detail: "Positive integer gradients, whole-number c." },
    { label: "Level 2 — Yellow", detail: "Negative integer gradients, whole-number c." },
    { label: "Level 3 — Red", detail: "Fractional gradients. c will always be a whole number or zero." },
  ]},
  { title: "Missing Values", icon: "🔍", content: [
    { label: "Overview", detail: "Given y = mx + c and a coordinate, three of four values are shown. Find the missing one." },
    { label: "Level 1 — Green", detail: "All values are positive integers." },
    { label: "Level 2 — Yellow", detail: "Values may be negative integers." },
    { label: "Level 3 — Red", detail: "Exactly one given value is a fraction; the missing value may also be a fraction." },
  ]},
];

// ── Generation helpers ────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const coordLatex = (x: number, y: number) => `(${x},\\,${y})`;
const DENOMS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const equationLatex = (gradN: number, gradD: number, c: number): string => {
  const absN = Math.abs(gradN);
  const isOne = absN === gradD;
  const negGrad = gradN < 0;
  const mxStr = isOne ? (negGrad ? "-x" : "x") : `${fracLatex(gradN, gradD)}x`;
  if (c === 0) return `y = ${mxStr}`;
  const cAbs = Math.abs(c);
  const sign = c > 0 ? "+" : "-";
  return `y = ${mxStr} ${sign} ${cAbs}`;
};

const fullEqLatex = (m: Rat | "?", c: Rat | "?"): string => {
  let mx: string;
  if (m === "?") { mx = "{?}x"; }
  else {
    const mr = m as Rat;
    mx = isInt(mr) ? (mr.n === 1 ? "x" : mr.n === -1 ? "-x" : `${mr.n}x`) : `${ratLatex(mr)}x`;
  }
  if (c === "?") return `y = ${mx} + {?}`;
  const cr = c as Rat;
  if (cr.n === 0) return `y = ${mx}`;
  const cIsNeg = cr.n < 0;
  const cSign = cIsNeg ? "-" : "+";
  const cAbs = cIsNeg ? ratLatex(rat(-cr.n, cr.d)) : ratLatex(cr);
  return `y = ${mx} ${cSign} ${cAbs}`;
};

// ── Missing question ──────────────────────────────────────────────────────────
interface MissingQuestion {
  kind: "missing"; missingVar: MissingVar;
  m: Rat; c: Rat; x: Rat; y: Rat;
  eqLatex: string; coordLatex: string;
  answerLatex: string; instruction: string;
  working: { label: string; lines: string[] }[];
  key: string; difficulty: string;
}

const buildMissingWorking = (mv: MissingVar, m: Rat, c: Rat, x: Rat, y: Rat): { label: string; lines: string[] }[] => {
  const mL = ratLatex(m), cL = ratLatex(c), xL = ratLatex(x), yL = ratLatex(y);
  const mx = ratMul(m, x); const mxL = ratLatex(mx);
  switch (mv) {
    case "y": return [
      { label: "Step 1 — Substitute into y = mx + c", lines: [`y = ${mL} \\times ${xL} + ${cL}`] },
      { label: "Step 2 — Simplify", lines: [`y = ${mxL} + ${cL} = ${yL}`] },
    ];
    case "x": {
      const ymc = ratSub(y, c);
      return [
        { label: "Step 1 — Substitute known values", lines: [`${yL} = ${mL} \\times x + ${cL}`] },
        { label: "Step 2 — Rearrange to isolate x", lines: [`${ratLatex(ymc)} = ${mL} \\times x`, `x = \\dfrac{${ratLatex(ymc)}}{${mL}} = ${xL}`] },
      ];
    }
    case "m": {
      const ymc = ratSub(y, c);
      return [
        { label: "Step 1 — Substitute known values", lines: [`${yL} = m \\times ${xL} + ${cL}`] },
        { label: "Step 2 — Rearrange to isolate m", lines: [`${ratLatex(ymc)} = m \\times ${xL}`, `m = \\dfrac{${ratLatex(ymc)}}{${xL}} = ${mL}`] },
      ];
    }
    case "c": return [
      { label: "Step 1 — Substitute known values", lines: [`${yL} = ${mL} \\times ${xL} + c`] },
      { label: "Step 2 — Rearrange to find c", lines: [`c = ${yL} - ${mxL} = ${cL}`] },
    ];
  }
};

const generateMissingQuestion = (level: DifficultyLevel, allowedVars: MissingVar[]): MissingQuestion | null => {
  const mv = pick(allowedVars.length > 0 ? allowedVars : ["x","y","m","c"] as MissingVar[]);
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      let m: Rat, c: Rat, x: Rat, y: Rat;
      if (level === "level1") {
        m = rat(randInt(1, 8)); c = rat(randInt(0, 10)); x = rat(randInt(1, 10));
        y = ratAdd(ratMul(m, x), c);
        if (!isInt(y) || y.n <= 0 || y.n > 30) continue;
      } else if (level === "level2") {
        m = rat(randInt(-8, 8)); if (m.n === 0) continue;
        c = rat(randInt(-10, 10)); x = rat(randInt(-10, 10));
        y = ratAdd(ratMul(m, x), c);
        if (!isInt(y) || Math.abs(y.n) > 30) continue;
      } else {
        const givens = (["x","y","m","c"] as MissingVar[]).filter(v => v !== mv);
        const fracGiven = pick(givens);
        const d = pick(DENOMS);
        const nAbs = randInt(1, d * 3);
        const gg = gcd(nAbs, d); const rn = nAbs / gg, rd = d / gg;
        if (rd === 1) continue;
        const fracVal = rat(pick([1,-1]) * rn, rd);
        const intGivens = givens.filter(v => v !== fracGiven);
        const vals: Record<MissingVar, Rat | null> = { x: null, y: null, m: null, c: null };
        vals[fracGiven] = fracVal;
        for (const iv of intGivens) {
          if (iv === "m") vals.m = rat(randInt(-8, 8));
          else if (iv === "c") vals.c = rat(randInt(-10, 10));
          else if (iv === "x") vals.x = rat(randInt(-10, 10));
          else vals.y = rat(randInt(-10, 10));
        }
        if (vals.m && vals.m.n === 0) continue;
        if (mv === "y") { if (!vals.m||!vals.x||!vals.c) continue; vals.y = ratAdd(ratMul(vals.m,vals.x),vals.c); }
        else if (mv === "x") { if (!vals.m||!vals.y||!vals.c||vals.m.n===0) continue; vals.x = ratDiv(ratSub(vals.y,vals.c),vals.m); }
        else if (mv === "m") { if (!vals.y||!vals.x||!vals.c||vals.x.n===0) continue; vals.m = ratDiv(ratSub(vals.y,vals.c),vals.x); }
        else { if (!vals.m||!vals.x||!vals.y) continue; vals.c = ratSub(vals.y,ratMul(vals.m,vals.x)); }
        if (!vals.m||!vals.c||!vals.x||!vals.y) continue;
        m = vals.m; c = vals.c; x = vals.x; y = vals.y;
        if ([m,c,x,y].some(r => Math.abs(r.n) > 60 || r.d > 20)) continue;
      }
      const check = ratAdd(ratMul(m!, x!), c!);
      if (!ratEq(check, y!)) continue;
      const mq: Rat = m!; const cq: Rat = c!; const xq: Rat = x!; const yq: Rat = y!;
      const eqL = mv === "m" ? fullEqLatex("?", cq).replace("{?}", "m") : mv === "c" ? fullEqLatex(mq, "?").replace("{?}", "c") : fullEqLatex(mq, cq);
      const xStr = mv === "x" ? "x" : ratLatex(xq);
      const yStr = mv === "y" ? "y" : ratLatex(yq);
      const crdL = `\\left(${xStr},\\,${yStr}\\right)`;
      const answerVal = mv === "x" ? xq : mv === "y" ? yq : mv === "m" ? mq : cq;
      return {
        kind: "missing", missingVar: mv,
        m: mq, c: cq, x: xq, y: yq,
        eqLatex: eqL, coordLatex: crdL,
        answerLatex: `${mv} = ${ratLatex(answerVal)}`,
        instruction: `Find ${mv}`,
        working: buildMissingWorking(mv, mq, cq, xq, yq),
        key: `missing-${level}-${mv}-${Math.random()}`, difficulty: level,
      };
    } catch { continue; }
  }
  return null;
};

// ── Gradient/Equation question ────────────────────────────────────────────────
interface GradQuestion {
  kind: "gradient" | "equation";
  x1: number; y1: number; x2: number; y2: number;
  dA: [number,number]; dB: [number,number];
  gradN: number; gradD: number; c?: number;
  key: string; difficulty: string;
  working: { label?: string; lines?: string[]; latex?: string }[];
}

type AnyQuestion = GradQuestion | MissingQuestion;

const generateCoords = (level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string) => {
  const negCoords = variables["negativeCoords"] ?? false;
  for (let attempt = 0; attempt < 200; attempt++) {
    let gradN: number, gradD: number, c: number;
    if (level !== "level3") {
      const mAbs = randInt(2, 8);
      const mSign = level === "level1" ? 1 : -1;
      const finalM = Math.random() < 0.15 ? mSign : mAbs * mSign;
      c = randInt(-30, 30); gradN = finalM; gradD = 1;
      const xRange = negCoords ? [-6,6] : [0,8];
      const xa = randInt(xRange[0], xRange[1] - 2);
      const xb = xa + randInt(2, 4);
      const ya = finalM * xa + c, yb = finalM * xb + c;
      if (!Number.isInteger(ya)||!Number.isInteger(yb)) continue;
      if (Math.abs(ya)>20||Math.abs(yb)>20) continue;
      if (!negCoords && (ya<0||yb<0||xa<0||xb<0)) continue;
      return { x1: xa, y1: ya, x2: xb, y2: yb, gradN, gradD };
    } else {
      const sign = dropdownValue === "positive" ? 1 : dropdownValue === "negative" ? -1 : pick([1,-1]);
      const d = pick(DENOMS); const n = randInt(1, d*4);
      const gg = gcd(n, d); const rn = n/gg, rd = d/gg;
      if (rd === 1) continue;
      gradN = sign*rn; gradD = rd; c = randInt(-30, 30);
      const xm = randInt(negCoords ? -3 : 0, 4);
      const xa = xm * rd, xb = xa + rd * randInt(2,4);
      const ya = (gradN*xa)/gradD + c, yb = (gradN*xb)/gradD + c;
      if (!Number.isInteger(ya)||!Number.isInteger(yb)) continue;
      if (Math.abs(xa)>12||Math.abs(xb)>12||Math.abs(ya)>20||Math.abs(yb)>20) continue;
      if (!negCoords && (ya<0||yb<0||xa<0||xb<0)) continue;
      return { x1: xa, y1: ya, x2: xb, y2: yb, gradN, gradD };
    }
  }
  return null;
};

const generateQuestion = (
  tool: ToolType, level: DifficultyLevel,
  variables: Record<string,boolean>, dropdownValue: string,
  allowedMissingVars: MissingVar[] = ["x","y","m","c"],
): AnyQuestion => {
  if (tool === "missing") {
    for (let t = 0; t < 10; t++) {
      const q = generateMissingQuestion(level, allowedMissingVars);
      if (q) return q;
    }
    return generateMissingQuestion("level1", ["x","y","m","c"])!;
  }
  const id = Math.floor(Math.random() * 1_000_000);
  const randomOrder = variables["randomOrder"] ?? false;
  let coords = generateCoords(level, variables, dropdownValue);
  while (!coords) coords = generateCoords(level, variables, dropdownValue);
  const { x1, y1, x2, y2, gradN, gradD } = coords;
  let dA: [number,number] = [x1,y1], dB: [number,number] = [x2,y2];
  if (randomOrder && Math.random() < 0.5) [dA, dB] = [dB, dA];
  const [wx1,wy1] = dA, [wx2,wy2] = dB;
  const diffY = wy2-wy1, diffX = wx2-wx1;
  const fmt = (n: number) => n >= 0 ? `${n}` : `(${n})`;
  const gradAnswerLatex = fracLatex(gradN, gradD);

  if (tool === "gradient") {
    return {
      kind: "gradient", x1,y1,x2,y2, dA,dB, gradN,gradD,
      key: `grad-${level}-${id}`, difficulty: level,
      working: [{ label: "Step 1 — Substitute into the gradient formula", lines: [`m = \\dfrac{y_2 - y_1}{x_2 - x_1} = \\dfrac{${fmt(wy2)} - ${fmt(wy1)}}{${fmt(wx2)} - ${fmt(wx1)}} = \\dfrac{${diffY}}{${diffX}} = ${gradAnswerLatex}`] }],
    };
  }

  let c = (gradD * wy1 - gradN * wx1) / gradD;
  let sdA = dA, sdB = dB, swx1 = wx1, swy1 = wy1, swx2 = wx2, swy2 = wy2;
  let sdiffY = diffY, sdiffX = diffX, sgN = gradN, sgD = gradD;
  for (let retry = 0; retry < 100 && !Number.isInteger(c); retry++) {
    const nc = generateCoords(level, variables, dropdownValue);
    if (!nc) continue;
    let ndA: [number,number] = [nc.x1,nc.y1], ndB: [number,number] = [nc.x2,nc.y2];
    if (randomOrder && Math.random() < 0.5) [ndA, ndB] = [ndB, ndA];
    const nc2 = (nc.gradD * ndA[1] - nc.gradN * ndA[0]) / nc.gradD;
    if (Number.isInteger(nc2)) {
      sdA = ndA; sdB = ndB; swx1 = ndA[0]; swy1 = ndA[1]; swx2 = ndB[0]; swy2 = ndB[1];
      sdiffY = swy2-swy1; sdiffX = swx2-swx1; sgN = nc.gradN; sgD = nc.gradD; c = nc2;
    }
  }
  const sgLatex = fracLatex(sgN, sgD);
  const mxStr = sgD === 1 ? `${sgN} \\times ${fmt(swx1)}` : `\\dfrac{${sgN}}{${sgD}} \\times ${fmt(swx1)}`;
  const mxVal = (sgN * swx1) / sgD;
  return {
    kind: "equation", x1,y1,x2,y2, dA: sdA, dB: sdB, gradN: sgN, gradD: sgD, c,
    key: `eq-${level}-${id}`, difficulty: level,
    working: [
      { label: "Step 1 — Substitute into the gradient formula", lines: [`m = \\dfrac{${fmt(swy2)} - ${fmt(swy1)}}{${fmt(swx2)} - ${fmt(swx1)}} = \\dfrac{${sdiffY}}{${sdiffX}} = ${sgLatex}`] },
      { label: "Step 2 — Substitute into y = mx + c", lines: [`${fmt(swy1)} = ${mxStr} + c \\implies ${fmt(swy1)} = ${mxVal} + c`] },
      { label: "Step 3 — Solve for c", lines: [`c = ${fmt(swy1)} - ${mxVal} = ${c}`] },
    ],
  };
};

const generateUniqueQ = (
  tool: ToolType, level: DifficultyLevel,
  variables: Record<string,boolean>, dropdownValue: string,
  usedKeys: Set<string>, gradientCounts: Record<string,number>,
): AnyQuestion => {
  let q: AnyQuestion; let attempts = 0;
  do {
    q = generateQuestion(tool, level, variables, dropdownValue);
    attempts++;
    if (tool === "missing") break;
    const gKey = `${(q as GradQuestion).gradN}/${(q as GradQuestion).gradD}`;
    if (!usedKeys.has(q.key) && (gradientCounts[gKey] ?? 0) < 4) break;
  } while (attempts < 150);
  usedKeys.add(q.key);
  if (tool !== "missing") {
    const gKey = `${(q as GradQuestion).gradN}/${(q as GradQuestion).gradD}`;
    gradientCounts[gKey] = (gradientCounts[gKey] ?? 0) + 1;
  }
  return q;
};

// ── Display components ────────────────────────────────────────────────────────
const getQuestionBg = (cs: string) => ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg = (cs: string) => ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

const MissingQuestionDisplay = ({ q, fsClass, showAnswer }: { q: MissingQuestion; fsClass: string; showAnswer: boolean }) => (
  <div className={`${fsClass} font-semibold text-center flex flex-col gap-3 items-center`}>
    <div style={{ color: "#000", lineHeight: 1.8 }}>
      The line <span className="font-bold"><MathRenderer latex={q.eqLatex} /></span>{" "}
      passes through <span className="font-bold"><MathRenderer latex={q.coordLatex} /></span>. Find <MathRenderer latex={q.missingVar} />
    </div>
    {showAnswer && <div className="font-bold" style={{ color: "#166534" }}><MathRenderer latex={q.answerLatex} /></div>}
  </div>
);

const CoordDisplay = ({ q, cls }: { q: GradQuestion; cls: string }) => {
  const ax = q.dA?.[0] ?? q.x1, ay = q.dA?.[1] ?? q.y1;
  const bx = q.dB?.[0] ?? q.x2, by = q.dB?.[1] ?? q.y2;
  return (
    <div className={`${cls} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.8 }}>
      <MathRenderer latex={coordLatex(ax, ay)} />
      <span style={{ fontSize: "0.9em", fontWeight: 600, color: "#555" }}>{" and "}</span>
      <MathRenderer latex={coordLatex(bx, by)} />
    </div>
  );
};

const WorksheetCell = ({ q, idx, bgOverride, fontSizeClass, showAnswers, instruction, tool }: {
  q: AnyQuestion; idx: number; bgOverride?: string; fontSizeClass: string;
  showAnswers: boolean; instruction: string; tool: ToolType;
}) => {
  const bg = bgOverride ?? "#f3f4f6";
  const bannerStyle: CSSProperties = { position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000" };
  const wrapStyle: CSSProperties = { backgroundColor: bg, height: "100%", boxSizing: "border-box", position: "relative", padding: "2rem 1rem 1rem 1rem" };

  if (tool === "missing") {
    const mq = q as MissingQuestion;
    return (
      <div style={wrapStyle} className="rounded-lg shadow flex flex-col items-center justify-center gap-2">
        <span style={bannerStyle}>{idx+1})</span>
        <div className={`${fontSizeClass} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.8 }}>
          The line <MathRenderer latex={mq.eqLatex} /> passes through <MathRenderer latex={mq.coordLatex} />. Find <MathRenderer latex={mq.missingVar} />
        </div>
        {showAnswers && <div className={`${fontSizeClass} font-bold text-center`} style={{ color: "#059669" }}><MathRenderer latex={mq.answerLatex} /></div>}
      </div>
    );
  }
  const gq = q as GradQuestion;
  const answerLatex = tool === "equation" ? equationLatex(gq.gradN, gq.gradD, gq.c ?? 0) : `m = ${fracLatex(gq.gradN, gq.gradD)}`;
  return (
    <div style={wrapStyle} className="rounded-lg shadow flex flex-col items-center justify-center gap-2">
      <span style={bannerStyle}>{idx+1})</span>
      {instruction && <div className="text-sm font-semibold text-center w-full" style={{ color: "#000" }}>{instruction}</div>}
      <div className={`${fontSizeClass} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.8 }}>
        <MathRenderer latex={coordLatex(gq.dA[0], gq.dA[1])} />
        <span style={{ fontSize: "0.9em", fontWeight: 600, color: "#555" }}>{" and "}</span>
        <MathRenderer latex={coordLatex(gq.dB[0], gq.dB[1])} />
      </div>
      {showAnswers && <div className={`${fontSizeClass} font-bold text-center`} style={{ color: "#059669" }}><MathRenderer latex={answerLatex} /></div>}
    </div>
  );
};

// ── Popovers ──────────────────────────────────────────────────────────────────
const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: { key: string; label: string; options: { value: string; label: string }[] };
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
  variables: { key: string; label: string }[]; values: Record<string,boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => <TogglePill key={v.key} checked={values[v.key] ?? false} onChange={val => onChange(v.key, val)} label={v.label} />)}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }: {
  variables: { key: string; label: string }[]; variableValues: Record<string,boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; options: { value: string; label: string }[]; defaultValue: string } | null;
  dropdownValue: string; onDropdownChange: (v: string) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  if (variables.length === 0 && !dropdown) return null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: {
  toolSettings: ToolDef; levelVariables: Record<string,Record<string,boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string,string>; onLevelDropdownChange: (lv: string, v: string) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1","level2","level3"] as DifficultyLevel[];
  const hasAnyOptions = levels.some(lv => {
    const dd = toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
    const vars = toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
    return dd || (vars && vars.length > 0);
  });
  if (!hasAnyOptions) return null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {levels.map(lv => {
            const dd = toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
            const vars = toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables ?? [];
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k,v) => onLevelVariableChange(lv,k,v)} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MissingQOPopover = ({ activeMissingVars, setActiveMissingVars }: {
  activeMissingVars: MissingVar[]; setActiveMissingVars: (v: MissingVar[]) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-64 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Missing Variable</span>
            <MultiSegButtons values={activeMissingVars} onChange={v => setActiveMissingVars(v as MissingVar[])} opts={MISSING_VAR_OPTIONS} />
            <p className="text-xs text-gray-400 mt-1">Select which variables can be missing. At least one must be active.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Info modal ────────────────────────────────────────────────────────────────
const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2></div>
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

// ── Menu dropdown ─────────────────────────────────────────────────────────────
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
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <span>Colour Scheme</span>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ── Print ─────────────────────────────────────────────────────────────────────
const handlePrint = (
  questions: AnyQuestion[], toolName: string, difficulty: string,
  isDifferentiated: boolean, numColumns: number, instruction: string, tool: ToolType,
) => {
  const pxPerMm = 3.7795, GAP_MM = 2, MARGIN_MM = 12, HEADER_MM = 14;
  const PAGE_H_MM = 297 - MARGIN_MM * 2, PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM, diffHdrMM = 7;
  const cols = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated ? (PAGE_W_MM - GAP_MM * 2) / 3 : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;
  const difficultyLabel = isDifferentiated ? "Differentiated" : difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalQ = questions.length;
  const katexSpan = (latex: string) => `<span class="katex-render" data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;

  const qHtmlData = questions.map((q, i) => {
    let body: string, ansBody: string;
    if (tool === "missing") {
      const mq = q as MissingQuestion;
      const qBody = `<div class="q-instruction">The line ${katexSpan(mq.eqLatex)} passes through ${katexSpan(mq.coordLatex)}</div><div class="q-sub">Find ${mq.missingVar}</div>`;
      body = qBody; ansBody = `${qBody}<div class="q-answer">${katexSpan(mq.answerLatex)}</div>`;
    } else {
      const gq = q as GradQuestion;
      const aL = coordLatex(gq.dA?.[0] ?? gq.x1, gq.dA?.[1] ?? gq.y1);
      const bL = coordLatex(gq.dB?.[0] ?? gq.x2, gq.dB?.[1] ?? gq.y2);
      const ansLatex = tool === "equation" ? equationLatex(gq.gradN, gq.gradD, gq.c ?? 0) : `m = ${fracLatex(gq.gradN, gq.gradD)}`;
      const instrHtml = instruction ? `<div class="q-instruction">${instruction}</div>` : "";
      body = `${instrHtml}<div class="q-coords">${katexSpan(aL)} <span class="q-and">and</span> ${katexSpan(bL)}</div>`;
      ansBody = `${instrHtml}<div class="q-coords">${katexSpan(aL)} <span class="q-and">and</span> ${katexSpan(bL)}</div><div class="q-answer">${katexSpan(ansLatex)}</div>`;
    }
    return { q: `<div class="q-banner">Q${i+1}</div><div class="qbody">${body}</div>`, a: `<div class="q-banner">Q${i+1}</div><div class="qbody">${ansBody}</div>`, difficulty: q.difficulty };
  });

  const probeHtml = qHtmlData.map((d,i) => `<div class="q-inner" id="probe-${i}">${d.a}</div>`).join("");
  const FONT_PX = 14, PAD_MM = 3;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4;margin:${MARGIN_MM}mm}body{font-family:"Segoe UI",Arial,sans-serif;background:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always}.page:last-child{page-break-after:auto}.page-header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:0.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm}.page-header h1{font-size:5mm;font-weight:700;color:#1e3a8a}.page-header .meta{font-size:3mm;color:#6b7280}.grid{display:grid;gap:${GAP_MM}mm}.cell,.diff-cell{border:0.3mm solid #d1d5db;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column}.diff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm}.diff-col{display:flex;flex-direction:column;gap:${GAP_MM}mm}.diff-header{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm}.diff-header.level1{background:#dcfce7;color:#166534}.diff-header.level2{background:#fef9c3;color:#854d0e}.diff-header.level3{background:#fee2e2;color:#991b1b}#probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-family:"Segoe UI",Arial,sans-serif;font-size:${FONT_PX}px;line-height:1.4;width:${cellW_MM}mm}.q-inner{width:100%;display:flex;flex-direction:column;flex:1}.q-banner{width:100%;text-align:center;font-size:${Math.round(FONT_PX*0.65)}px;font-weight:700;color:#000;padding:1mm 0;border-bottom:0.3mm solid #000}.qbody{padding:${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm;text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm}.q-instruction{font-size:${Math.round(FONT_PX*0.8)}px;color:#000;font-weight:600}.q-sub{font-size:${Math.round(FONT_PX*0.75)}px;color:#374151;font-style:italic}.q-coords{font-size:${FONT_PX}px;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap}.q-and{font-size:${FONT_PX}px;color:#555}.q-answer{font-size:${FONT_PX}px;color:#059669}.katex-render{display:inline-block;vertical-align:baseline}</style></head><body>
<div id="probe">${probeHtml}</div><div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxPerMm=${pxPerMm},GAP_MM=${GAP_MM},usableH=${usableH_MM},diffHdrMM=${diffHdrMM};
  var PAGE_W_MM=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var PAD_MM=${PAD_MM};
  var rowHeights=[];for(var r=1;r<=10;r++)rowHeights.push((usableH-GAP_MM*(r-1))/r);
  var qData=${JSON.stringify(qHtmlData)};
  var probe=document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el){try{katex.render(el.getAttribute('data-latex'),el,{throwOnError:false,output:'html'});}catch(e){el.textContent=el.getAttribute('data-latex');}});
  var maxH_px=0;probe.querySelectorAll('.q-inner').forEach(function(el){if(el.scrollHeight>maxH_px)maxH_px=el.scrollHeight;});
  var needed_mm=maxH_px/pxPerMm+PAD_MM*2+6;
  var diffPerCol=Math.floor(totalQ/3),diffUsableH=usableH-diffHdrMM-GAP_MM;
  var diffRowsPerPage=1,diffCellH_mm=diffUsableH;
  for(var rd=0;rd<diffPerCol;rd++){var h=(diffUsableH-GAP_MM*rd)/(rd+1);if(h>=needed_mm){diffRowsPerPage=rd+1;diffCellH_mm=h;}}
  var chosenH_mm=rowHeights[0],rowsPerPage=1;
  for(var r2=0;r2<rowHeights.length;r2++){if(rowHeights[r2]>=needed_mm){chosenH_mm=rowHeights[r2];rowsPerPage=r2+1;}}
  var pages=[];
  if(isDiff){var np=Math.ceil(diffPerCol/diffRowsPerPage);for(var p=0;p<np;p++)pages.push(p);}
  else{for(var s=0;s<qData.length;s+=rowsPerPage*cols)pages.push(qData.slice(s,s+rowsPerPage*cols));}
  var totalPages=pages.length;
  function makeCellW(c){return(PAGE_W_MM-GAP_MM*(c-1))/c;}
  function buildCell(inner,cW,cH,isDiffCell){return'<div class="'+(isDiffCell?'diff-cell':'cell')+'" style="width:'+cW+'mm;height:'+cH+'mm;"><div class="q-inner">'+inner+'</div></div>';}
  function buildGrid(pg,showAns,cH){
    if(isDiff){var start=pg*diffRowsPerPage,end=start+diffRowsPerPage,cW=makeCellW(3);
      var lvls=['level1','level2','level3'],lbls=['Level 1','Level 2','Level 3'];
      var c3=lvls.map(function(lv,li){var lqs=qData.filter(function(q){return q.difficulty===lv;}).slice(start,end);
        return'<div class="diff-col"><div class="diff-header '+lv+'">'+lbls[li]+'</div>'+lqs.map(function(q){return buildCell(showAns?q.a:q.q,cW,cH,true);}).join('')+'</div>';}).join('');
      return'<div class="diff-grid" style="grid-template-columns:repeat(3,'+cW+'mm);">'+c3+'</div>';}
    var cW=makeCellW(cols),gr=Math.ceil(pg.length/cols);
    return'<div class="grid" style="grid-template-columns:repeat('+cols+','+cW+'mm);grid-template-rows:repeat('+gr+','+cH+'mm);">'+pg.map(function(item){return buildCell(showAns?item.a:item.q,cW,cH,false);}).join('')+'</div>';}
  function buildPage(pg,showAns,pgIdx){var cH=isDiff?diffCellH_mm:chosenH_mm;
    var lbl=totalPages>1?(pgIdx+1)+'/'+totalPages:'';
    return'<div class="page"><div class="page-header"><h1>'+toolName+(showAns?' — Answers':'')+'</h1><div class="meta">'+diffLabel+(lbl?' &middot; '+lbl:'')+' &middot; '+dateStr+'</div></div>'+buildGrid(pg,showAns,cH)+'</div>';}
  var html=pages.map(function(pg,i){return buildPage(pg,false,i);}).join('')+pages.map(function(pg,i){return buildPage(pg,true,i);}).join('');
  document.getElementById('pages').innerHTML=html;
  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el){try{katex.render(el.getAttribute('data-latex'),el,{throwOnError:false,output:'html'});}catch(e){el.textContent=el.getAttribute('data-latex');}});
  probe.remove();setTimeout(function(){window.print();},300);
});
<\/script></body></html>`;

  const win = window.open("","_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html); win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];

  const [currentTool, setCurrentTool] = useState<ToolType>("gradient");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

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

  const [levelVariables, setLevelVariables] = useState<Record<string,Record<string,boolean>>>({ level1:{}, level2:{}, level3:{} });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>({ level3: "positive" });
  const [activeMissingVars, setActiveMissingVars] = useState<MissingVar[]>(["x","y","m","c"]);

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("gradient","level1",{},"")
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(15);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(2);
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
      let targetId = deviceId;
      if (!targetId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const builtIn = /facetime|built.?in|integrated|internal|front|rear/i;
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !builtIn.test(d.label));
        if (ext) targetId = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetId ? { deviceId: { exact: targetId } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);

  const getToolSettings = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({ ...p, [`${currentTool}__${difficulty}`]: v }));
  const setVariableValue = (k: string, v: boolean) => setToolVariables(p => ({ ...p, [currentTool]: { ...p[currentTool], [k]: v } }));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const handleLevelDDChange = (lv: string, v: string) => setLevelDropdowns(p => ({ ...p, [lv]: v }));
  const getInstruction = () => TOOL_CONFIG.tools[currentTool]?.instruction ?? "";

  const makeQuestion = () => generateQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), activeMissingVars);
  const handleNewQuestion = () => { setCurrentQuestion(makeQuestion()); setShowWhiteboardAnswer(false); setShowAnswer(false); };

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, currentTool]);

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>(); const gradientCounts: Record<string,number> = {};
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = currentTool === "missing" ? {} : (levelVariables[lv] ?? {});
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys, gradientCounts));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQ(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), usedKeys, gradientCounts));
    }
    setWorksheet(questions); setShowWorksheetAnswers(false);
  };

  const renderQOPopover = (isDiff = false) => {
    if (currentTool === "missing") return <MissingQOPopover activeMissingVars={activeMissingVars} setActiveMissingVars={setActiveMissingVars} />;
    if (isDiff) return <DiffQOPopover toolSettings={getToolSettings()} levelVariables={levelVariables} onLevelVariableChange={handleLevelVarChange} levelDropdowns={levelDropdowns} onLevelDropdownChange={handleLevelDDChange} />;
    return <StandardQOPopover variables={getVariablesConfig() ?? []} variableValues={toolVariables[currentTool] || {}} onVariableChange={setVariableValue} dropdown={getDropdownConfig() ?? null} dropdownValue={getDropdownValue()} onDropdownChange={setDropdownValue} />;
  };

  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const fontSizes = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;
  const isMissing = currentTool === "missing";
  const mq = isMissing ? currentQuestion as MissingQuestion : null;
  const gq = !isMissing ? currentQuestion as GradQuestion : null;

  const fontBtnStyle = (enabled: boolean): CSSProperties => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.35,
  });

  const questionContent = (
    <>
      {isMissing && mq
        ? <MissingQuestionDisplay q={mq} fsClass={displayFontSizes[displayFontSize]} showAnswer={showWhiteboardAnswer} />
        : gq ? (
          <>
            <div className={`${displayFontSizes[displayFontSize]} font-semibold text-center`} style={{ color: "#000" }}>{getInstruction()}</div>
            <CoordDisplay q={gq} cls={displayFontSizes[displayFontSize]} />
            {showWhiteboardAnswer && (
              <div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{ color: "#166534" }}>
                <MathRenderer latex={currentTool === "equation" ? equationLatex(gq.gradN, gq.gradD, gq.c ?? 0) : `m = ${fracLatex(gq.gradN, gq.gradD)}`} />
              </div>
            )}
          </>
        ) : null}
    </>
  );

  // ── Whiteboard ─────────────────────────────────────────────────────────────
  const renderWhiteboard = () => {
    const fsToolbarBg = colorScheme === "default" ? "#ffffff" : stepBg;
    const fsQuestionBg = colorScheme === "default" ? "#ffffff" : qBg;
    const fsWorkingBg = colorScheme === "default" ? "#f5f3f0" : qBg;

    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
        {renderQOPopover()}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );

    const questionBox = (isFS: boolean) => (
      <div style={{ position: "relative", width: isFS ? "40%" : "500px", height: "100%", backgroundColor: isFS ? fsQuestionBg : stepBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isFS ? 48 : 32, boxSizing: "border-box", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f-1)}><ChevronDown size={16} color="#6b7280" /></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f+1)}><ChevronUp size={16} color="#6b7280" /></button>
        </div>
        <div className="w-full text-center flex flex-col gap-2 items-center">{questionContent}</div>
      </div>
    );

    const rightPanel = (isFS: boolean) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg) }}>
        {presenterMode && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", zIndex: 1 }}>{camError}</div>}
          </>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
                onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }}
                onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }}
                onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Video size={16} color="rgba(255,255,255,0.85)" />
              </button>
              {camDropdownOpen && (
                <div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                  {camDevices.map((d,i) => (
                    <div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }}
                      style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer" }}>
                      {d.label || `Camera ${i+1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setPresenterMode(true)} title="Visualiser mode"
              style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Video size={16} color="#6b7280" />
            </button>
          )}
          <button onClick={() => setWbFullscreen(f => !f)} title={wbFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            style={{ background: wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"), border: presenterMode ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} />}
          </button>
        </div>
      </div>
    );

    if (wbFullscreen) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>
        {fsToolbar}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {questionBox(true)}
          <div style={{ width: 2, backgroundColor: "#000", flexShrink: 0 }} />
          {rightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{ backgroundColor: qBg, height: "600px", boxSizing: "border-box" }}>
        <div className="flex gap-6" style={{ height: "100%" }}>
          {questionBox(false)}
          {rightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked Example ─────────────────────────────────────────────────────────
  const renderWorkedExample = () => {
    const steps = currentQuestion.working as { label?: string; lines?: string[] }[];
    return (
      <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
        <div className="p-8 w-full" style={{ backgroundColor: qBg }}>
          <div className="text-center py-4 relative">
            <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
              <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f-1)}><ChevronDown size={16} color="#6b7280" /></button>
              <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f+1)}><ChevronUp size={16} color="#6b7280" /></button>
            </div>
            {isMissing && mq
              ? <MissingQuestionDisplay q={mq} fsClass={displayFontSizes[displayFontSize]} showAnswer={false} />
              : gq ? (
                <>
                  <div className={`${displayFontSizes[displayFontSize]} font-semibold`} style={{ color: "#000" }}>{getInstruction()}</div>
                  <CoordDisplay q={gq} cls={displayFontSizes[displayFontSize]} />
                </>
              ) : null}
          </div>
          {showAnswer && (
            <div className="flex flex-col gap-4 mt-8">
              {steps.map((s, i) => (
                <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}>
                  <div className="text-base font-bold mb-3" style={{ color: "#374151" }}>{s.label ?? `Step ${i+1}`}</div>
                  <div className="flex flex-col items-center gap-2">
                    {(s.lines ?? []).map((line, li) => (
                      <div key={li} className="text-2xl text-center" style={{ color: "#000" }}><MathRenderer latex={line} /></div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: stepBg }}>
                <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                  {isMissing && mq
                    ? <MathRenderer latex={mq.answerLatex} />
                    : gq
                      ? <MathRenderer latex={currentTool === "equation" ? equationLatex(gq.gradN, gq.gradD, gq.c ?? 0) : `m = ${fracLatex(gq.gradN, gq.gradD)}`} />
                      : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Worksheet ──────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    const fsz = fontSizes[worksheetFontSize];
    const instr = getInstruction();
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWorksheetFontSize(f => f-1)} className={`w-8 h-8 rounded flex items-center justify-center ${canDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWorksheetFontSize(f => f+1)} className={`w-8 h-8 rounded flex items-center justify-center ${canIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
      </div>
    );
    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>
                  {lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}><WorksheetCell q={q} idx={idx} bgOverride={c.fill} fontSizeClass={fsz} showAnswers={showWorksheetAnswers} instruction={instr} tool={currentTool} /></div>)}
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
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle} — Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns},1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}><WorksheetCell q={q} idx={idx} bgOverride={stepBg} fontSizeClass={fsz} showAnswers={showWorksheetAnswers} instruction={instr} tool={currentTool} /></div>)}
        </div>
      </div>
    );
  };

  // ── Control bar ────────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col]) => (
              <button key={val} onClick={() => { setDifficulty(val as DifficultyLevel); setIsDifferentiated(false); }}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {renderQOPopover(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value)||15)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
              onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value)||3))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} />
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
          {worksheet.length > 0 && <>
            <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button>
            <button onClick={() => handlePrint(worksheet, TOOL_CONFIG.tools[currentTool].name, difficulty, isDifferentiated, numColumns, getInstruction(), currentTool)}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          {renderQOPopover()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(a => !a) : setShowAnswer(a => !a)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Root ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { (window as any).location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k => (
              <button key={k} onClick={() => setCurrentTool(k)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>
          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">{renderControlBar()}</div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode === "whiteboard" && renderWhiteboard()}
                {mode === "single" && renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
