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

const MathRenderer = ({ latex, style, className }: { latex: string; style?: CSSProperties; className?: string }) => {
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
// TYPES & COLOURS
// ═══════════════════════════════════════════════════════════════════════════════
type SubTool = "linear" | "factorising" | "formula";
type DifficultyLevel = "level1" | "level2" | "level3";
// negMode derived from two-button multi-select: allowPos + allowNeg
type NegMode = "pos-only" | "neg-only" | "both";
type SurdDisplay = "surd" | "decimal" | "both";

const getQuestionBg = (cs: string) => ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg    = (cs: string) => ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    fill: "#fee2e2" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════
interface LinearQuestion {
  kind: "linear";
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

type SolnPair = { x: number; y: number };

interface NonLinearQuestion {
  kind: "nonlinear";
  subTool: "factorising" | "formula";
  eq1Display: string; eq2Display: string;
  isolateVar: "x" | "y";
  isolatedExpr: string;
  linM: number; linD: number;
  needsRearrange: boolean; rearrangedLatex: string;
  quadLatex: string; expandedLatex: string;
  factorisedLatex?: string;
  surdLatex?: string;
  surdX1?: string; surdX2?: string;
  surdY1?: string; surdY2?: string;
  surdYCombined?: string;
  decimalLatex?: string;
  solutions: SolnPair[];
  isDoubleRoot: boolean;
  A: number; B: number; C: number;
  isCircle: boolean; r2?: number;
  level: DifficultyLevel;
  key: string; difficulty: string;
  working: { type: string; latex: string; plain: string }[];
}

type AnyQuestion = LinearQuestion | NonLinearQuestion;

// ═══════════════════════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const gcd2 = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd2(b, a % b);
const fmt2 = (n: number): string => n.toFixed(2).replace(/\.?0+$/, "");
const fmtSoln = (n: number): string => {
  for (let d = 1; d <= 5; d++) {
    const num = Math.round(n * d);
    if (Math.abs(num / d - n) < 0.0001) {
      if (d === 1) return `${num}`;
      const g = gcd2(Math.abs(num), d);
      return `\\frac{${num / g}}{${d / g}}`;
    }
  }
  return fmt2(n);
};

// Same-line check: are two equations a1*v1+b1*v2=c1 and a2*v1+b2*v2=c2 the same line?
const sameLine = (a1: number, b1: number, _c1: number, a2: number, b2: number, c2: number) =>
  a1 * b2 === b1 * a2 && a1 * c2 === b1 * c2;

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
const VAR_PAIRS: [string, string][] = [["x","y"],["s","t"],["n","m"],["a","b"]];

const lead  = (c: number, v: string) => c===1?v:c===-1?`-${v}`:`${c}${v}`;
const nextT = (c: number, v: string) => c===0?"":c===1?`+ ${v}`:c===-1?`- ${v}`:c>0?`+ ${c}${v}`:`- ${Math.abs(c)}${v}`;
const buildEqLin = (a: number, b: number, c: number, v1: string, v2: string) =>
  a<0&&b>0 ? `${lead(b,v2)} ${nextT(a,v1)} = ${c}` : `${lead(a,v1)} ${nextT(b,v2)} = ${c}`;

const aSubPos = (iC: number, oC: number, k: number, d: number, ov: string, c: number) => {
  const inner = d===0?(k===1?ov:`${k}${ov}`):d>0?(k===1?`${ov}+${d}`:`${k}${ov}+${d}`):(k===1?`${ov}-${Math.abs(d)}`:`${k}${ov}-${Math.abs(d)}`);
  return `${iC}(${inner}) ${nextT(oC,ov)} = ${c}`;
};
const aSubNeg = (iC: number, oC: number, k: number, d: number, ov: string, c: number) =>
  `${iC}(${k===1?`${d}-${ov}`:`${d}-${k}${ov}`}) ${nextT(oC,ov)} = ${c}`;

const solvePos = (iC: number, oC: number, k: number, d: number, ov: string, oVal: number, c: number): string[] => {
  const eI=iC*k, eC=iC*d, nC=eI+oC, nR=c-eC;
  const cP=eC===0?"":(eC>0?`+ ${eC}`:`- ${Math.abs(eC)}`);
  const steps=[`${eI}${ov} ${cP} ${nextT(oC,ov)} = ${c}`.trim()];
  if (eC!==0) steps.push(`${nC}${ov} = ${nR}`);
  if (Math.abs(nC)!==1) steps.push(`${ov} = ${nR} \\div ${nC}`);
  steps.push(`${ov} = ${oVal}`);
  return steps;
};
const solveNeg = (iC: number, oC: number, k: number, d: number, ov: string, oVal: number, c: number): string[] => {
  const eC=iC*d, eI=-(iC*k), nC=eI+oC, nR=c-eC;
  const cS=eC>0?`+ ${eC}`:`- ${Math.abs(eC)}`;
  const iS=eI>=0?`+ ${eI}${ov}`:`- ${Math.abs(eI)}${ov}`;
  return [`${eC} ${iS} ${nextT(oC,ov)} = ${c}`,`${nC}${ov} ${cS} = ${c}`,`${nC}${ov} = ${nR}`,...(Math.abs(nC)!==1?[`${ov} = ${nR} \\div ${nC}`]:[]),`${ov} = ${oVal}`];
};
const sbPos = (iV: string, ov: string, k: number, d: number, oVal: number, iVal: number): string[] => {
  const kP=k===1?ov:`${k}${ov}`;
  const inner=d===0?kP:d>0?`${kP} + ${d}`:`${kP} - ${Math.abs(d)}`;
  const computed=k*oVal;
  return [`${iV} = ${inner}`,`${iV} = ${computed}${d!==0?(d>0?` + ${d}`:` - ${Math.abs(d)}`):""}`, ...(computed+d!==iVal||d!==0?[`${iV} = ${iVal}`]:[])];
};
const sbNeg = (iV: string, ov: string, k: number, d: number, oVal: number, iVal: number): string[] => [
  `${iV} = ${k===1?`${d} - ${ov}`:`${d} - ${k}${ov}`}`,
  `${iV} = ${d} - ${k*oVal}`,
  `${iV} = ${iVal}`,
];

const buildEq1Coeffs = (iso: "v1"|"v2", rhsC: number, aNeg: boolean): { a: number; b: number } | null => {
  for (let i=0; i<50; i++) {
    const aM=randInt(2,6), bM=randInt(2,6);
    if (aM===bM) continue;
    const a=(aNeg&&Math.random()<0.35)?-aM:aM;
    const b=(aNeg&&Math.random()<0.35)?-bM:bM;
    if (Math.abs(iso==="v1"?b:a)===rhsC) continue;
    return { a, b };
  }
  return null;
};

const resolveNeg = (mode: NegMode) => ({
  allowNeg:  mode==="neg-only"||mode==="both",
  requireNeg: mode==="neg-only",
});

const genLinL1 = (aN: boolean, rN: boolean, aNE: boolean): LinearQuestion => {
  const id=randInt(0,1e6), vp=pick(VAR_PAIRS), [v1,v2]=vp;
  const iso: "v1"|"v2"=Math.random()<0.5?"v1":"v2";
  const iV=iso==="v1"?v1:v2, oV=iso==="v1"?v2:v1;
  const r=aN?[-10,10]:[1,10];
  const v1V=randInt(r[0],r[1]), v2V=randInt(r[0],r[1]);
  if (!v1V||!v2V) return genLinL1(aN,rN,aNE);
  if (rN&&v1V>0&&v2V>0) return genLinL1(aN,rN,aNE);
  if (!rN&&(v1V<0||v2V<0)) return genLinL1(aN,rN,aNE);
  const iVal=iso==="v1"?v1V:v2V, oVal=iso==="v1"?v2V:v1V;
  const k=pick([2,2,3,3,3,4,5]), d=iVal-k*oVal;
  const coeffs=buildEq1Coeffs(iso,k,aNE);
  if (!coeffs) return genLinL1(aN,rN,aNE);
  const a=coeffs.a, b=coeffs.b, c=a*v1V+b*v2V;
  const iC=iso==="v1"?a:b, oC=iso==="v1"?b:a;
  // Guard: same line
  const eq2a=iso==="v1"?1:-k, eq2b=iso==="v1"?-k:1;
  if (sameLine(a,b,c,eq2a,eq2b,d)) return genLinL1(aN,rN,aNE);
  const dS=d===0?"":(d>0?` + ${d}`:` - ${Math.abs(d)}`);
  const eq2=`${iV} = ${k}${oV}${dS}`;
  return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:eq2,isolatedVar:iso,isolatedExpr:`${k}${oV}${dS}`,rearrangedLatex:eq2,needsRearrange:false,afterSubLatex:aSubPos(iC,oC,k,d,oV,c),solveSteps:solvePos(iC,oC,k,d,oV,oVal,c),subBackSteps:sbPos(iV,oV,k,d,oVal,iVal),v1Val:v1V,v2Val:v2V,key:`L1-${v1}${v2}-${a}-${b}-${k}-${d}-${v1V}-${v2V}-${id}`,difficulty:"level1",working:[] };
};

const genLinL2 = (aN: boolean, rN: boolean, aZ: boolean, aNE: boolean): LinearQuestion => {
  const id=randInt(0,1e6), vp=pick(VAR_PAIRS), [v1,v2]=vp;
  const iso: "v1"|"v2"=Math.random()<0.5?"v1":"v2";
  const iV=iso==="v1"?v1:v2, oV=iso==="v1"?v2:v1;
  const forms=["lhs","rhs",...(aZ?["zero"]:[])];
  const form=pick(forms);
  const k=randInt(2,5), d=randInt(-8,8), oVal=randInt(1,8), iVal=k*oVal+d;
  const v1V=iso==="v1"?iVal:oVal, v2V=iso==="v1"?oVal:iVal;
  if (!v1V||!v2V) return genLinL2(aN,rN,aZ,aNE);
  if (rN&&v1V>0&&v2V>0) return genLinL2(aN,rN,aZ,aNE);
  if (!rN&&(v1V<0||v2V<0)) return genLinL2(aN,rN,aZ,aNE);
  if (Math.abs(v1V)>25||Math.abs(v2V)>25) return genLinL2(aN,rN,aZ,aNE);

  if (form==="lhs") {
    const n=randInt(2,5), m2=n*oVal+iVal;
    const coeffs=buildEq1Coeffs(iso,n,aNE);
    if (!coeffs) return genLinL2(aN,rN,aZ,aNE);
    const a=coeffs.a, b=coeffs.b, c=a*v1V+b*v2V;
    const iC=iso==="v1"?a:b, oC=iso==="v1"?b:a;
    // eq2 standard form: n*oV + iV = m2  →  iso=v1: n*v2+v1=m2 i.e. (1,n,m2); iso=v2: (n,1,m2)
    const eq2a=iso==="v1"?1:n, eq2b=iso==="v1"?n:1;
    if (sameLine(a,b,c,eq2a,eq2b,m2)) return genLinL2(aN,rN,aZ,aNE);
    const isoE=`${m2} - ${n}${oV}`;
    return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:`${n}${oV} + ${iV} = ${m2}`,isolatedVar:iso,isolatedExpr:isoE,rearrangedLatex:`${iV} = ${isoE}`,needsRearrange:true,afterSubLatex:aSubNeg(iC,oC,n,m2,oV,c),solveSteps:solveNeg(iC,oC,n,m2,oV,oVal,c),subBackSteps:sbNeg(iV,oV,n,m2,oVal,iVal),v1Val:v1V,v2Val:v2V,key:`L2lhs-${v1}${v2}-${n}-${m2}-${v1V}-${v2V}-${id}`,difficulty:"level2",working:[] };
  }

  if (form==="rhs") {
    const n=k, p=-d;
    const coeffs=buildEq1Coeffs(iso,n,aNE);
    if (!coeffs) return genLinL2(aN,rN,aZ,aNE);
    const a=coeffs.a, b=coeffs.b, c=a*v1V+b*v2V;
    const iC=iso==="v1"?a:b, oC=iso==="v1"?b:a;
    // eq2: iV = k*oV + d  →  iV - k*oV = d
    const eq2a=iso==="v1"?1:-k, eq2b=iso==="v1"?-k:1;
    if (sameLine(a,b,c,eq2a,eq2b,d)) return genLinL2(aN,rN,aZ,aNE);
    const pS=p===0?iV:p>0?`${iV} + ${p}`:`${iV} - ${Math.abs(p)}`;
    const dS=d===0?"":(d>0?` + ${d}`:` - ${Math.abs(d)}`);
    const isoE=`${k}${oV}${dS}`;
    return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:`${n}${oV} = ${pS}`,isolatedVar:iso,isolatedExpr:isoE,rearrangedLatex:`${iV} = ${isoE}`,needsRearrange:true,afterSubLatex:aSubPos(iC,oC,k,d,oV,c),solveSteps:solvePos(iC,oC,k,d,oV,oVal,c),subBackSteps:sbPos(iV,oV,k,d,oVal,iVal),v1Val:v1V,v2Val:v2V,key:`L2rhs-${v1}${v2}-${k}-${d}-${v1V}-${v2V}-${id}`,difficulty:"level2",working:[] };
  }

  // zero form
  const n=randInt(2,5), p=-(n*oVal+iVal);
  const coeffs=buildEq1Coeffs(iso,n,aNE);
  if (!coeffs) return genLinL2(aN,rN,aZ,aNE);
  const a=coeffs.a, b=coeffs.b, c=a*v1V+b*v2V;
  const iC=iso==="v1"?a:b, oC=iso==="v1"?b:a;
  const eq2a=iso==="v1"?1:n, eq2b=iso==="v1"?n:1;
  if (sameLine(a,b,c,eq2a,eq2b,0)) return genLinL2(aN,rN,aZ,aNE);
  const pS=p===0?"":(p>0?` + ${p}`:` - ${Math.abs(p)}`);
  const rpS=p===0?"":(p>0?` - ${p}`:` + ${Math.abs(p)}`);
  const isoE=`-${n}${oV}${rpS}`, kk=-n, dd=-p;
  return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:`${n}${oV} + ${iV}${pS} = 0`,isolatedVar:iso,isolatedExpr:isoE,rearrangedLatex:`${iV} = ${isoE}`,needsRearrange:true,afterSubLatex:aSubPos(iC,oC,kk,dd,oV,c),solveSteps:solvePos(iC,oC,kk,dd,oV,oVal,c),subBackSteps:sbPos(iV,oV,kk,dd,oVal,iVal),v1Val:v1V,v2Val:v2V,key:`L2zero-${v1}${v2}-${n}-${p}-${v1V}-${v2V}-${id}`,difficulty:"level2",working:[] };
};

const genLinL3 = (aN: boolean, rN: boolean, aNE: boolean): LinearQuestion => {
  const id=randInt(0,1e6), vp=pick(VAR_PAIRS), [v1,v2]=vp;
  const iso: "v1"|"v2"=Math.random()<0.5?"v1":"v2";
  const iV=iso==="v1"?v1:v2, oV=iso==="v1"?v2:v1;
  const r=aN?[-10,10]:[1,10];
  const v1V=randInt(r[0],r[1]), v2V=randInt(r[0],r[1]);
  if (!v1V||!v2V) return genLinL3(aN,rN,aNE);
  if (rN&&v1V>0&&v2V>0) return genLinL3(aN,rN,aNE);
  if (!rN&&(v1V<0||v2V<0)) return genLinL3(aN,rN,aNE);
  const iVal=iso==="v1"?v1V:v2V, oVal=iso==="v1"?v2V:v1V;
  const n=randInt(2,4);
  const form: "lhsNeg"|"negIso"=Math.random()<0.5?"lhsNeg":"negIso";
  const mVal=form==="lhsNeg"?n*oVal-iVal:iVal+n*oVal;
  if (mVal<=0||mVal>50) return genLinL3(aN,rN,aNE);
  const coeffs=buildEq1Coeffs(iso,n,aNE);
  if (!coeffs) return genLinL3(aN,rN,aNE);
  const a=coeffs.a, b=coeffs.b, c=a*v1V+b*v2V;
  const iC=iso==="v1"?a:b, oC=iso==="v1"?b:a;
  const eq2a=iso==="v1"?-1:n, eq2b=iso==="v1"?n:-1;
  if (sameLine(a,b,c,eq2a,eq2b,mVal)) return genLinL3(aN,rN,aNE);
  const nS=`${n}${oV}`;
  let eq2="", isoE="", rear="", aSub="", sS: string[]=[], sB: string[]=[];
  if (form==="lhsNeg") {
    eq2=Math.random()<0.5?`${nS} - ${iV} = ${mVal}`:`-${iV} + ${nS} = ${mVal}`;
    isoE=`${nS} - ${mVal}`; rear=`${iV} = ${isoE}`;
    aSub=aSubPos(iC,oC,n,-mVal,oV,c); sS=solvePos(iC,oC,n,-mVal,oV,oVal,c); sB=sbPos(iV,oV,n,-mVal,oVal,iVal);
  } else {
    eq2=Math.random()<0.5?`${mVal} - ${iV} = ${nS}`:`${nS} = ${mVal} - ${iV}`;
    isoE=`${mVal} - ${nS}`; rear=`${iV} = ${isoE}`;
    aSub=aSubNeg(iC,oC,n,mVal,oV,c); sS=solveNeg(iC,oC,n,mVal,oV,oVal,c); sB=sbNeg(iV,oV,n,mVal,oVal,iVal);
  }
  return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:eq2,isolatedVar:iso,isolatedExpr:isoE,rearrangedLatex:rear,needsRearrange:true,afterSubLatex:aSub,solveSteps:sS,subBackSteps:sB,v1Val:v1V,v2Val:v2V,key:`L3-${form}-${v1}${v2}-${n}-${mVal}-${v1V}-${v2V}-${id}`,difficulty:"level3",working:[] };
};

const generateLinear = (level: DifficultyLevel, negMode: NegMode, allowZero: boolean, allowNegEq1: boolean): LinearQuestion => {
  const { allowNeg, requireNeg } = resolveNeg(negMode);
  if (level==="level1") return genLinL1(allowNeg,requireNeg,allowNegEq1);
  if (level==="level2") return genLinL2(allowNeg,requireNeg,allowZero,allowNegEq1);
  return genLinL3(allowNeg,requireNeg,allowNegEq1);
};

// ═══════════════════════════════════════════════════════════════════════════════
// NON-LINEAR STRING BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════
const buildParabolaRhs = (A: number, B: number, C: number): string => {
  const xSq=A===1?"x^2":`${A}x^2`;
  const bP=B===0?"":(B===1?" + x":B===-1?" - x":B>0?` + ${B}x`:` - ${Math.abs(B)}x`);
  const cP=C===0?"":(C>0?` + ${C}`:` - ${Math.abs(C)}`);
  return `${xSq}${bP}${cP}`;
};
const buildParabolaDisplay = (A: number, B: number, C: number) => `y = ${buildParabolaRhs(A,B,C)}`;
const buildLinExpr = (m: number, v: string, d: number): string => {
  if (m===0) return `${d}`;
  const mP=m===1?v:m===-1?`-${v}`:`${m}${v}`;
  const dP=d===0?"":(d>0?` + ${d}`:` - ${Math.abs(d)}`);
  return `${mP}${dP}`;
};
const buildLinIsolated = (isolateVar: "x"|"y", m: number, d: number): string => {
  if (m===0) return `${isolateVar} = ${d}`;
  return `${isolateVar} = ${buildLinExpr(m, isolateVar==="y"?"x":"y", d)}`;
};
const buildExpandedEq = (A: number, B: number, C: number, v="x"): string => {
  const vSq=A===1?`${v}^2`:`${A}${v}^2`;
  const bP=B===0?"":(B>0?` + ${B}${v}`:` - ${Math.abs(B)}${v}`);
  const cP=C===0?"":(C>0?` + ${C}`:` - ${Math.abs(C)}`);
  return `${vSq}${bP}${cP} = 0`;
};
const buildFactorisedDisplay = (p: number, q: number, r: number, s: number, isDouble: boolean, v="x"): string => {
  const f=(pv: number,qv: number)=>pv===1?(qv<0?`(${v}+${-qv})`:qv===0?v:`(${v}-${qv})`):(qv<0?`(${pv}${v}+${-qv})`:`(${pv}${v}-${qv})`);
  if (isDouble) return `${f(p,q)}^2 = 0`;
  return `${f(p,q)}${f(r,s)} = 0`;
};
const buildSurdDisplay = (A: number, B: number, disc: number): string =>
  `x = \\frac{${-B} \\pm \\sqrt{${disc}}}{${2*A}}`;
const buildSurdPairs = (A: number, B: number, disc: number, m: number, d: number, isolateVar: "x"|"y") => {
  const denom=2*A, negB=-B;
  const otherVar=isolateVar==="y"?"y":"x";
  const sx1=`\\frac{${negB}+\\sqrt{${disc}}}{${denom}}`;
  const sx2=`\\frac{${negB}-\\sqrt{${disc}}}{${denom}}`;
  const numConst=m*negB+d*denom;
  const mAbs=Math.abs(m);
  const sc=mAbs===1?"":String(mAbs);
  const pmSym=m>=0?"\\pm":"\\mp";
  const pm1=m>=0?"+":"-";
  const pm2=m>=0?"-":"+";
  const frac=(n: string)=>`\\frac{${n}}{${denom}}`;
  const syCombined=numConst===0?`${otherVar} = ${frac(`${pmSym}${sc}\\sqrt{${disc}}`)}` :`${otherVar} = ${frac(`${numConst} ${pmSym} ${sc}\\sqrt{${disc}}`)}`;
  const sy1=`${otherVar} = ${frac(`${numConst}${pm1}${sc}\\sqrt{${disc}}`)}`;
  const sy2=`${otherVar} = ${frac(`${numConst}${pm2}${sc}\\sqrt{${disc}}`)}`;
  return { sx1, sx2, sy1, sy2, syCombined };
};
const buildRearrangedL2 = (isolateVar: "x"|"y", m: number, d: number): { display: string; rearranged: string } => {
  const ov=isolateVar==="y"?"x":"y";
  const rearranged=`${isolateVar} = ${buildLinExpr(m,ov,d)}`;
  const mAbs=Math.abs(m), mP=mAbs===1?ov:`${mAbs}${ov}`;
  const opts: string[]=[];
  if (m>0) {
    opts.push(`${mP} - ${isolateVar} = ${-d}`);
    opts.push(`${isolateVar} - ${mP} = ${d}`);
    if (d!==0) opts.push(`${mP} = ${isolateVar} ${d>0?`- ${d}`:`+ ${-d}`}`);
  } else {
    opts.push(`${isolateVar} + ${mP} = ${d}`);
    opts.push(`${mP} + ${isolateVar} = ${d}`);
    if (d!==0) opts.push(`${d} - ${isolateVar} = ${mP}`);
  }
  const clean=opts.filter(s=>!s.includes("+ 0")&&!s.includes("- 0")&&s!==`${mP} = ${isolateVar}`);
  return { display: pick(clean.length>0?clean:opts), rearranged };
};
const buildCircleLinear = (isolateVar: "x"|"y", m: number, d: number, allowRearrange: boolean): { display: string; needsRearrange: boolean; rearranged: string } => {
  const ov=isolateVar==="y"?"x":"y";
  const rearranged=`${isolateVar} = ${buildLinExpr(m,ov,d)}`;
  if (!allowRearrange||Math.random()<0.5) return { display:rearranged, needsRearrange:false, rearranged };
  const mAbs=Math.abs(m), isoStr=mAbs===1?isolateVar:`${mAbs}${isolateVar}`;
  const opts=[`${ov} + ${isoStr} = ${d}`,`${isoStr} = ${d} - ${ov}`,`${d} = ${ov} + ${isoStr}`,...(d!==0?[`${d} - ${ov} = ${isoStr}`]:[])];
  return { display: pick(opts), needsRearrange: true, rearranged };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCLE POINT TABLE
// ═══════════════════════════════════════════════════════════════════════════════
const CIRCLE_POINTS: Record<number,[number,number][]> = {
  5:  [[ 1, 2],[ 2, 1],[ 1,-2],[ 2,-1],[-1, 2],[-2, 1],[-1,-2],[-2,-1]],
  10: [[ 1, 3],[ 3, 1],[ 1,-3],[ 3,-1],[-1, 3],[-3, 1],[-1,-3],[-3,-1]],
  13: [[ 2, 3],[ 3, 2],[ 2,-3],[ 3,-2],[-2, 3],[-3, 2],[-2,-3],[-3,-2]],
  17: [[ 1, 4],[ 4, 1],[ 1,-4],[ 4,-1],[-1, 4],[-4, 1],[-1,-4],[-4,-1]],
  25: [[ 3, 4],[ 4, 3],[ 3,-4],[ 4,-3],[-3, 4],[-4, 3],[-3,-4],[-4,-3],[0,5],[5,0],[0,-5],[-5,0]],
  29: [[ 2, 5],[ 5, 2],[ 2,-5],[ 5,-2],[-2, 5],[-5, 2],[-2,-5],[-5,-2]],
  34: [[ 3, 5],[ 5, 3],[ 3,-5],[ 5,-3],[-3, 5],[-5, 3],[-3,-5],[-5,-3]],
  41: [[ 4, 5],[ 5, 4],[ 4,-5],[ 5,-4],[-4, 5],[-5, 4],[-4,-5],[-5,-4]],
  50: [[ 1, 7],[ 7, 1],[ 1,-7],[ 7,-1],[-1, 7],[-7, 1],[-1,-7],[-7,-1],[ 5, 5],[ 5,-5],[-5, 5],[-5,-5]],
  53: [[ 2, 7],[ 7, 2],[ 2,-7],[ 7,-2],[-2, 7],[-7, 2],[-2,-7],[-7,-2]],
  58: [[ 3, 7],[ 7, 3],[ 3,-7],[ 7,-3],[-3, 7],[-7, 3],[-3,-7],[-7,-3]],
  65: [[ 1, 8],[ 8, 1],[ 1,-8],[ 8,-1],[-1, 8],[-8, 1],[-1,-8],[-8,-1],[ 4, 7],[ 7, 4],[ 4,-7],[ 7,-4],[-4, 7],[-7, 4],[-4,-7],[-7,-4]],
};
const CIRCLE_R2_FAC_KEYS=Object.keys(CIRCLE_POINTS).map(Number);
const CIRCLE_R2_FORM=[5,10,13,17,25,26,29,34,37,41,45,50,53,58,65];

// ═══════════════════════════════════════════════════════════════════════════════
// NON-LINEAR GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════
const generateParabola = (subTool: "factorising"|"formula", level: DifficultyLevel, allowA: boolean, surdDisplay: SurdDisplay, allowRearrange: boolean): NonLinearQuestion => {
  const id=randInt(0,1e6);
  void surdDisplay; void allowRearrange;

  if (subTool==="factorising") {
    const bothTwo=allowA&&Math.random()<0.15;
    let p: number, r: number;
    if (bothTwo) { p=2; r=2; }
    else if (!allowA) { p=1; r=1; }
    else { const fF=Math.random()<0.5; p=fF?pick([2,3,4,5]):1; r=fF?1:pick([2,3,4,5]); }
    const q=randInt(-6,6), s=randInt(-6,6);
    if (!q||!s) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    if (Math.abs(q*r-s*p)<0.001) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    const Ar=p*r, Br=-(p*s+q*r), Cr=q*s;
    if (!allowA&&Ar>1) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    const Bq=randInt(-5,5), Cq=randInt(-8,8);
    const m=Bq-Br, d=Cq-Cr;
    if (Math.abs(m)>10||Math.abs(d)>30||m===0) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    const x1=q/p, x2=s/r;
    const isDoubleRoot=Math.abs(x1-x2)<0.0001;
    if (isDoubleRoot&&Math.random()<0.85) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    const y1=m*x1+d, y2=m*x2+d;
    const solutions: SolnPair[]=isDoubleRoot?[{x:x1,y:y1}]:[{x:x1,y:y1},{x:x2,y:y2}];
    const quadDisplay=buildParabolaDisplay(Ar,Bq,Cq);
    const linIso=buildLinIsolated("y",m,d);
    let eq2Display=linIso, needsRearrange=false, rearrangedLatex=linIso;
    if (level==="level2") { const f=buildRearrangedL2("y",m,d); eq2Display=f.display; needsRearrange=true; rearrangedLatex=f.rearranged; }
    return { kind:"nonlinear",subTool,eq1Display:quadDisplay,eq2Display,isolateVar:"y",isolatedExpr:buildLinExpr(m,"x",d),linM:m,linD:d,needsRearrange,rearrangedLatex,quadLatex:`${buildParabolaRhs(Ar,Bq,Cq)} = ${buildLinExpr(m,"x",d)}`,expandedLatex:buildExpandedEq(Ar,Br,Cr),factorisedLatex:buildFactorisedDisplay(p,q,r,s,isDoubleRoot),solutions,isDoubleRoot,A:Ar,B:Br,C:Cr,isCircle:false,level,key:`NL-fac-${level}-${Ar}-${Bq}-${Cq}-${p}-${q}-${r}-${s}-${id}`,difficulty:level,working:[] };
  }

  // formula
  for (let attempt=0; attempt<200; attempt++) {
    const A=allowA?randInt(1,5):1;
    const Bq=randInt(-6,6), Cq=randInt(-12,12);
    const m=randInt(-5,5), d=randInt(-10,10);
    if (m===0) continue;
    const Ar=A, Br=Bq-m, Cr=Cq-d;
    if (Ar===0) continue;
    const disc=Br*Br-4*Ar*Cr;
    if (disc<=0) continue;
    if (Number.isInteger(Math.sqrt(disc))) continue;
    if (Math.abs(Br)>20||Math.abs(Cr)>40) continue;
    const x1=(-Br+Math.sqrt(disc))/(2*Ar), x2=(-Br-Math.sqrt(disc))/(2*Ar);
    const y1=m*x1+d, y2=m*x2+d;
    const quadDisplay=buildParabolaDisplay(A,Bq,Cq);
    const linIso=buildLinIsolated("y",m,d);
    let eq2Display=linIso, needsRearrange=false, rearrangedLatex=linIso;
    if (level==="level2") { const f=buildRearrangedL2("y",m,d); eq2Display=f.display; needsRearrange=true; rearrangedLatex=f.rearranged; }
    const sp=buildSurdPairs(Ar,Br,disc,m,d,"y");
    return { kind:"nonlinear",subTool,eq1Display:quadDisplay,eq2Display,isolateVar:"y",isolatedExpr:buildLinExpr(m,"x",d),linM:m,linD:d,needsRearrange,rearrangedLatex,quadLatex:`${buildParabolaRhs(A,Bq,Cq)} = ${buildLinExpr(m,"x",d)}`,expandedLatex:buildExpandedEq(Ar,Br,Cr),surdLatex:buildSurdDisplay(Ar,Br,disc),surdX1:sp.sx1,surdX2:sp.sx2,surdY1:sp.sy1,surdY2:sp.sy2,surdYCombined:sp.syCombined,decimalLatex:`x=${fmt2(x1)} \\text{ or } x=${fmt2(x2)}`,solutions:[{x:x1,y:y1},{x:x2,y:y2}],isDoubleRoot:false,A:Ar,B:Br,C:Cr,isCircle:false,level,key:`NL-form-${level}-${A}-${Bq}-${Cq}-${m}-${d}-${id}`,difficulty:level,working:[] };
  }
  return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
};

const generateCircle = (subTool: "factorising"|"formula", allowRearrange: boolean): NonLinearQuestion => {
  const id=randInt(0,1e6);

  if (subTool==="factorising") {
    for (let attempt=0; attempt<300; attempt++) {
      const r2=pick(CIRCLE_R2_FAC_KEYS);
      const pts=CIRCLE_POINTS[r2];
      if (!pts||pts.length<2) continue;
      const i1=randInt(0,pts.length-1);
      let i2=randInt(0,pts.length-1);
      if (i2===i1) i2=(i1+1)%pts.length;
      const x1=pts[i1][0], y1=pts[i1][1], x2=pts[i2][0], y2=pts[i2][1];
      const dy=y2-y1, dx=x2-x1;
      if (dx===0||dy===0) continue;
      let isolateVar: "x"|"y", m: number, d: number;
      if (dy%dx===0) { isolateVar="y"; m=dy/dx; d=y1-m*x1; }
      else if (dx%dy===0) { isolateVar="x"; m=dx/dy; d=x1-m*y1; }
      else continue;
      if (m===0) continue;
      if (Math.abs(m)>6||Math.abs(d)>15) continue;
      const ov=isolateVar==="y"?"x":"y";
      const Ar=1+m*m, Br=2*m*d, Cr=d*d-r2;
      const disc=Br*Br-4*Ar*Cr;
      if (disc<0) continue;
      const sqrtD=Math.sqrt(disc);
      if (Math.abs(sqrtD-Math.round(sqrtD))>0.001) continue;
      const t1=Math.round((-Br+sqrtD)/(2*Ar)), t2=Math.round((-Br-sqrtD)/(2*Ar));
      const isDoubleRoot=t1===t2;
      if (isDoubleRoot&&Math.random()<0.9) continue;
      const s1=m*t1+d, s2=m*t2+d;
      const solutions: SolnPair[]=isDoubleRoot?[isolateVar==="y"?{x:t1,y:s1}:{x:s1,y:t1}]:[isolateVar==="y"?{x:t1,y:s1}:{x:s1,y:t1},isolateVar==="y"?{x:t2,y:s2}:{x:s2,y:t2}];
      const cl=buildCircleLinear(isolateVar,m,d,allowRearrange);
      const quadLatex=`${ov}^2+(${buildLinExpr(m,ov,d)})^2=${r2}`;
      const factorisedLatex=Ar===1?buildFactorisedDisplay(1,t1,1,t2,isDoubleRoot,ov):buildFactorisedDisplay(Ar,Ar*t1,1,t2,isDoubleRoot,ov);
      return { kind:"nonlinear",subTool,eq1Display:`x^2+y^2=${r2}`,eq2Display:cl.display,isolateVar,isolatedExpr:buildLinExpr(m,ov,d),linM:m,linD:d,needsRearrange:cl.needsRearrange,rearrangedLatex:cl.rearranged,quadLatex,expandedLatex:buildExpandedEq(Ar,Br,Cr,ov),factorisedLatex,solutions,isDoubleRoot,A:Ar,B:Br,C:Cr,isCircle:true,r2,level:"level3",key:`NL-circ-fac-${r2}-${m}-${d}-${t1}-${t2}-${id}`,difficulty:"level3",working:[] };
    }
    return generateCircle(subTool,allowRearrange);
  }

  for (let attempt=0; attempt<300; attempt++) {
    const r2=pick(CIRCLE_R2_FORM);
    const isolateVar: "x"|"y"=Math.random()<0.5?"x":"y";
    const ov=isolateVar==="y"?"x":"y";
    const m=randInt(-4,4), d=randInt(-8,8);
    if (m===0) continue;
    const Ar=1+m*m, Br=2*m*d, Cr=d*d-r2;
    const disc=Br*Br-4*Ar*Cr;
    if (disc<=0) continue;
    if (Number.isInteger(Math.sqrt(disc))) continue;
    const t1=(-Br+Math.sqrt(disc))/(2*Ar), t2=(-Br-Math.sqrt(disc))/(2*Ar);
    const s1=m*t1+d, s2=m*t2+d;
    const solutions: SolnPair[]=[isolateVar==="y"?{x:t1,y:s1}:{x:s1,y:t1},isolateVar==="y"?{x:t2,y:s2}:{x:s2,y:t2}];
    const cl=buildCircleLinear(isolateVar,m,d,allowRearrange);
    const quadLatex=`${ov}^2+(${buildLinExpr(m,ov,d)})^2=${r2}`;
    const sp=buildSurdPairs(Ar,Br,disc,m,d,isolateVar);
    return { kind:"nonlinear",subTool,eq1Display:`x^2+y^2=${r2}`,eq2Display:cl.display,isolateVar,isolatedExpr:buildLinExpr(m,ov,d),linM:m,linD:d,needsRearrange:cl.needsRearrange,rearrangedLatex:cl.rearranged,quadLatex,expandedLatex:buildExpandedEq(Ar,Br,Cr,ov),surdLatex:buildSurdDisplay(Ar,Br,disc),surdX1:sp.sx1,surdX2:sp.sx2,surdY1:sp.sy1,surdY2:sp.sy2,surdYCombined:sp.syCombined,decimalLatex:`${ov}=${fmt2(t1)} \\text{ or } ${ov}=${fmt2(t2)}`,solutions,isDoubleRoot:false,A:Ar,B:Br,C:Cr,isCircle:true,r2,level:"level3",key:`NL-circ-form-${r2}-${m}-${d}-${id}`,difficulty:"level3",working:[] };
  }
  return generateCircle(subTool,allowRearrange);
};

const generateNonLinear=(subTool: "factorising"|"formula",level: DifficultyLevel,allowA: boolean,sD: SurdDisplay,aR: boolean): NonLinearQuestion=>
  level==="level3"?generateCircle(subTool,aR):generateParabola(subTool,level,allowA,sD,aR);

const genUniqueLinear=(level: DifficultyLevel,negMode: NegMode,aZ: boolean,aNE: boolean,used: Set<string>): LinearQuestion=>{
  let q: LinearQuestion, a=0; do{q=generateLinear(level,negMode,aZ,aNE);a++;}while(used.has(q.key)&&a<100);
  used.add(q.key); return q;
};
const genUniqueNL=(subTool: "factorising"|"formula",level: DifficultyLevel,allowA: boolean,sD: SurdDisplay,aR: boolean,used: Set<string>): NonLinearQuestion=>{
  let q: NonLinearQuestion, a=0; do{q=generateNonLinear(subTool,level,allowA,sD,aR);a++;}while(used.has(q.key)&&a<100);
  used.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const DifficultyToggle=({value,onChange}:{value:string;onChange:(v:string)=>void})=>(
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]]as const).map(([val,label,col])=>(
      <button key={val} onClick={()=>onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
    ))}
  </div>
);

const EqPairDisplay=({eqs,cls}:{eqs:[string,string];cls:string})=>(
  <div className="flex flex-col items-center gap-2 w-full">
    {eqs.map((eq,i)=>(
      <div key={i} className="flex items-baseline gap-3 justify-center">
        <span className="text-sm font-bold text-gray-400 w-8 text-right flex-shrink-0">({i+1})</span>
        <span className={`${cls} font-semibold`} style={{color:"#000"}}><MathRenderer latex={eq}/></span>
      </div>
    ))}
  </div>
);

const SolutionDisplay=({q,surdDisplay}:{q:NonLinearQuestion;surdDisplay:SurdDisplay})=>{
  const sf=(n: number)=>q.subTool==="factorising"?fmtSoln(n):fmt2(n);
  if (q.isDoubleRoot) {
    const s=q.solutions[0];
    return <div className="text-center"><MathRenderer latex={`x=${sf(s.x)},\\quad y=${sf(s.y)} \\;\\text{(repeated root)}`}/></div>;
  }
  if (q.subTool==="formula") return (
    <div className="flex flex-col gap-1 items-center">
      {(surdDisplay==="surd"||surdDisplay==="both")&&q.surdLatex&&<div><MathRenderer latex={q.surdLatex}/></div>}
      {(surdDisplay==="surd"||surdDisplay==="both")&&q.surdYCombined&&<div><MathRenderer latex={q.surdYCombined}/></div>}
      {(surdDisplay==="decimal"||surdDisplay==="both")&&q.solutions.map((s,i)=>{
        const xV=q.isolateVar==="y"?s.x:s.y, yV=q.isolateVar==="y"?s.y:s.x;
        return <div key={i}><MathRenderer latex={`x=${fmt2(xV)},\\quad y=${fmt2(yV)}`}/></div>;
      })}
    </div>
  );
  return (
    <div className="flex flex-col gap-1 items-center">
      {q.solutions.map((s,i)=><div key={i}><MathRenderer latex={`x=${sf(s.x)},\\quad y=${sf(s.y)}`}/></div>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKED STEPS
// ═══════════════════════════════════════════════════════════════════════════════
const Card=({title,children,stepBg,fsz}:{title:string;children:React.ReactNode;stepBg:string;fsz:string})=>(
  <div className="rounded-xl p-5" style={{backgroundColor:stepBg}}>
    <h4 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wide">{title}</h4>
    <div className={`${fsz} font-semibold flex flex-col gap-2 items-center`} style={{color:"#000"}}>{children}</div>
  </div>
);
const ML=({latex,label}:{latex:string;label?:string})=>(
  <div className="flex items-baseline gap-3 justify-center">
    {label&&<span className="text-xs font-bold text-gray-400 w-16 text-right flex-shrink-0">{label}</span>}
    <MathRenderer latex={latex}/>
  </div>
);

const LinearWorkedSteps=({q,stepBg,fsz}:{q:LinearQuestion;stepBg:string;fsz:string})=>{
  const [v1,v2]=q.varPair;
  const iV=q.isolatedVar==="v1"?v1:v2;
  let n=1;
  return (
    <div className="space-y-4 mt-6">
      <Card title={`Step ${n++} — Label the equations`} stepBg={stepBg} fsz={fsz}><EqPairDisplay eqs={[q.eq1Display,q.eq2Display]} cls={fsz}/></Card>
      {q.needsRearrange&&<Card title={`Step ${n++} — Rearrange equation (2) to make ${iV} the subject`} stepBg={stepBg} fsz={fsz}><ML latex={q.eq2Display} label="(2)"/><ML latex={q.rearrangedLatex} label="⟹"/></Card>}
      <Card title={`Step ${n++} — Substitute into equation (1)`} stepBg={stepBg} fsz={fsz}><ML latex={q.afterSubLatex}/></Card>
      <Card title={`Step ${n++} — Expand and solve`} stepBg={stepBg} fsz={fsz}>{q.solveSteps.map((s,i)=><ML key={i} latex={s}/>)}</Card>
      <Card title={`Step ${n++} — Substitute back`} stepBg={stepBg} fsz={fsz}>{q.subBackSteps.map((s,i)=><ML key={i} latex={s}/>)}</Card>
      <Card title="Solution" stepBg={stepBg} fsz={fsz}><ML latex={`${v1}=${q.v1Val},\\quad ${v2}=${q.v2Val}`}/></Card>
    </div>
  );
};

const NonLinearWorkedSteps=({q,stepBg,fsz,surdDisplay}:{q:NonLinearQuestion;stepBg:string;fsz:string;surdDisplay:SurdDisplay})=>{
  const subVar=q.isolateVar==="y"?"x":"y";
  const otherVar=q.isolateVar;
  const sf=(n: number)=>q.subTool==="factorising"?fmtSoln(n):fmt2(n);
  let n=1;
  return (
    <div className="space-y-4 mt-6">
      <Card title={`Step ${n++} — Label the equations`} stepBg={stepBg} fsz={fsz}><EqPairDisplay eqs={[q.eq1Display,q.eq2Display]} cls={fsz}/></Card>
      {q.needsRearrange&&<Card title={`Step ${n++} — Rearrange equation (2)`} stepBg={stepBg} fsz={fsz}><ML latex={q.eq2Display} label="(2)"/><ML latex={q.rearrangedLatex} label="⟹"/></Card>}
      <Card title={`Step ${n++} — Substitute ${otherVar} = ${q.isolatedExpr} into equation (1)`} stepBg={stepBg} fsz={fsz}><ML latex={q.quadLatex}/></Card>
      <Card title={`Step ${n++} — Expand and rearrange to = 0`} stepBg={stepBg} fsz={fsz}><ML latex={q.expandedLatex}/></Card>
      {q.subTool==="factorising"
        ?<>
          <Card title={`Step ${n++} — Factorise`} stepBg={stepBg} fsz={fsz}><ML latex={q.factorisedLatex??""}/></Card>
          <Card title={`Step ${n++} — Solve for ${subVar}`} stepBg={stepBg} fsz={fsz}>
            {q.solutions.map((s,i)=>{const v=q.isolateVar==="y"?s.x:s.y;return <ML key={i} latex={`${subVar}=${sf(v)}`}/>;})}
          </Card>
        </>
        :<Card title={`Step ${n++} — Apply the quadratic formula`} stepBg={stepBg} fsz={fsz}>
          <ML latex={`${subVar}=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}`}/>
          <ML latex={`a=${q.A},\\;b=${q.B},\\;c=${q.C}`}/>
          {q.surdLatex&&<ML latex={q.surdLatex}/>}
        </Card>
      }
      <Card title={`Step ${n++} — Substitute back to find ${otherVar}`} stepBg={stepBg} fsz={fsz}>
        {q.solutions.map((s,i)=>{
          const subVal=q.isolateVar==="y"?s.x:s.y;
          const otherVal=q.isolateVar==="y"?s.y:s.x;
          if (q.subTool==="formula"&&q.surdX1&&q.surdY1&&q.surdX2&&q.surdY2) {
            return <ML key={i} latex={`${subVar}=${i===0?q.surdX1:q.surdX2}\\Rightarrow ${i===0?q.surdY1:q.surdY2}`}/>;
          }
          const subValStr=sf(subVal), otherValStr=sf(otherVal);
          const intermediate=q.linM*subVal+q.linD;
          const interStr=sf(intermediate);
          const showMid=q.linD!==0||Math.abs(q.linM)!==1;
          const showFinal=Math.round(intermediate*1000)!==Math.round(otherVal*1000);
          const mxPart=q.linM===1?subValStr:q.linM===-1?(subVal<0?`-(${Math.abs(subVal)})`:`-${subValStr}`):`${q.linM}(${subValStr})`;
          const dPart=q.linD===0?"":(q.linD>0?` + ${q.linD}`:` - ${Math.abs(q.linD)}`);
          return <ML key={i} latex={showMid?`${subVar}=${subValStr}\\Rightarrow ${otherVar}=${mxPart}${dPart}=${showFinal?`${interStr}=${otherValStr}`:interStr}`:`${subVar}=${subValStr}\\Rightarrow ${otherVar}=${mxPart}=${otherValStr}`}/>;
        })}
      </Card>
      <Card title="Solution" stepBg={stepBg} fsz={fsz}><SolutionDisplay q={q} surdDisplay={surdDisplay}/></Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QO POPOVERS
// ═══════════════════════════════════════════════════════════════════════════════
const LinearQOPopover=({level,negMode,setNegMode,allowZero,setAllowZero,allowNegEq1,setAllowNegEq1}:{level:DifficultyLevel;negMode:NegMode;setNegMode:(v:NegMode)=>void;allowZero:boolean;setAllowZero:(v:boolean)=>void;allowNegEq1:boolean;setAllowNegEq1:(v:boolean)=>void})=>{
  const {open,setOpen,ref}=usePopover();
  const allowPos = negMode==="pos-only"||negMode==="both";
  const allowNeg = negMode==="neg-only"||negMode==="both";
  const togglePos = () => {
    if (allowPos && !allowNeg) return; // last active
    setNegMode(allowPos ? "neg-only" : "both");
  };
  const toggleNeg = () => {
    if (allowNeg && !allowPos) return; // last active
    setNegMode(allowNeg ? "pos-only" : "both");
  };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Solution Types</span>
            <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
              <button onClick={togglePos}
                className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${allowPos?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                Positive Solutions
              </button>
              <button onClick={toggleNeg}
                className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${allowNeg?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                Negative Solutions
              </button>
            </div>
          </div>
          <TogglePill checked={allowNegEq1} onChange={setAllowNegEq1} label="Allow negative coefficients in Equation 1"/>
          {level==="level2"&&<TogglePill checked={allowZero} onChange={setAllowZero} label='Include "= 0" form'/>}
        </div>
      )}
    </div>
  );
};

const NonLinearQOPopover=({subTool,level,allowA,setAllowA,surdDisplay,setSurdDisplay,allowRearrange,setAllowRearrange}:{subTool:"factorising"|"formula";level:DifficultyLevel;allowA:boolean;setAllowA:(v:boolean)=>void;surdDisplay:SurdDisplay;setSurdDisplay:(v:SurdDisplay)=>void;allowRearrange:boolean;setAllowRearrange:(v:boolean)=>void})=>{
  const {open,setOpen,ref}=usePopover();
  const showSurd = surdDisplay==="surd"||surdDisplay==="both";
  const showDec  = surdDisplay==="decimal"||surdDisplay==="both";
  const toggleSurd = () => {
    if (showSurd && !showDec) return;
    setSurdDisplay(showSurd ? "decimal" : "both");
  };
  const toggleDec = () => {
    if (showDec && !showSurd) return;
    setSurdDisplay(showDec ? "surd" : "both");
  };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          {subTool==="formula"&&(
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Display</span>
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                <button onClick={toggleSurd}
                  className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${showSurd?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Surd
                </button>
                <button onClick={toggleDec}
                  className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${showDec?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Decimal
                </button>
              </div>
            </div>
          )}
          <TogglePill checked={allowA} onChange={setAllowA} label="Allow coefficient on x² (up to 5)"/>
          {level==="level3"&&<TogglePill checked={allowRearrange} onChange={setAllowRearrange} label="Allow rearranging of linear equation"/>}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFO & MENU
// ═══════════════════════════════════════════════════════════════════════════════
const INFO_SECTIONS=[
  {title:"Linear Substitution",icon:"📐",content:[
    {label:"Overview",detail:"One variable is isolated (or can be isolated) in one equation. Substitute into the other to solve."},
    {label:"Level 1 — Green",detail:"Variable fully isolated. Direct substitution."},
    {label:"Level 2 — Yellow",detail:"Variable has coefficient +1 but not isolated. One rearrangement needed."},
    {label:"Level 3 — Red",detail:"Variable has coefficient −1. Students must manage the sign change."},
  ]},
  {title:"Non-Linear: Factorising",icon:"🟦",content:[
    {label:"Overview",detail:"One equation is quadratic (or circle at Level 3), the other linear. Solved by factorising."},
    {label:"Level 1 — Green",detail:"Linear equation already isolated. Direct substitution."},
    {label:"Level 2 — Yellow",detail:"Linear equation needs rearranging first."},
    {label:"Level 3 — Red",detail:"Circle x² + y² = r². Linear may be in rearranged form."},
  ]},
  {title:"Non-Linear: Formula",icon:"🔢",content:[
    {label:"Overview",detail:"Same structure as Factorising but the quadratic never factorises — formula required."},
    {label:"Answer display",detail:"Choose surd (exact), decimal (2dp), or both."},
  ]},
  {title:"Modes",icon:"🖥️",content:[
    {label:"Whiteboard",detail:"Single question with working space. Visualiser available."},
    {label:"Worked Example",detail:"Full step-by-step solution."},
    {label:"Worksheet",detail:"Printable grid with PDF export."},
  ]},
];

const InfoModal=({onClose}:{onClose:()=>void})=>(
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

const MenuDropdown=({colorScheme,setColorScheme,onClose,onOpenInfo}:{colorScheme:string;setColorScheme:(s:string)=>void;onClose:()=>void;onOpenInfo:()=>void})=>{
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

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT
// ═══════════════════════════════════════════════════════════════════════════════
const handlePrint=(questions:AnyQuestion[],subTool:SubTool,difficulty:string,isDifferentiated:boolean,numColumns:number,surdDisplay:SurdDisplay)=>{
  const FONT_PX=14,PAD_MM=2,MARGIN_MM=12,HEADER_MM=14,GAP_MM=2;
  const PAGE_H_MM=297-MARGIN_MM*2,PAGE_W_MM=210-MARGIN_MM*2;
  const usableH_MM=PAGE_H_MM-HEADER_MM,diffHdrMM=7;
  const cols=isDifferentiated?3:numColumns;
  const cellW_MM=isDifferentiated?(PAGE_W_MM-GAP_MM*2)/3:(PAGE_W_MM-GAP_MM*(numColumns-1))/numColumns;
  const difficultyLabel=isDifferentiated?"Differentiated":difficulty==="level1"?"Level 1":difficulty==="level2"?"Level 2":"Level 3";
  const dateStr=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const totalQ=questions.length;
  const toolName=subTool==="linear"?"Linear Substitution":subTool==="factorising"?"Non-Linear (Factorising)":"Non-Linear (Formula)";
  const qData=questions.map((q,i)=>({
    eq1:q.eq1Display,eq2:q.eq2Display,
    answerLatex:q.kind==="linear"
      ?`${q.varPair[0]}=${q.v1Val},\\quad ${q.varPair[1]}=${q.v2Val}`
      :(() => {
        const nlq = q as NonLinearQuestion;
        if (nlq.subTool==="formula") {
          if (surdDisplay==="surd"||surdDisplay==="both") {
            const parts: string[] = [];
            if (nlq.surdLatex) parts.push(nlq.surdLatex);
            if (nlq.surdYCombined) parts.push(nlq.surdYCombined);
            if (surdDisplay==="both") nlq.solutions.forEach(s=>{ const xV=nlq.isolateVar==="y"?s.x:s.y, yV=nlq.isolateVar==="y"?s.y:s.x; parts.push(`x=${fmt2(xV)},\\quad y=${fmt2(yV)}`); });
            return parts.join("|SPLIT|");
          }
        }
        return nlq.solutions.map(s=>`x=${fmtSoln(s.x)},\\quad y=${fmtSoln(s.y)}`).join("|SPLIT|");
      })(),
    difficulty:q.difficulty,idx:i,
  }));
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Substitution — ${toolName}</title>
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
.qbanner{width:100%;padding:1mm 2mm;font-size:${Math.round(FONT_PX*0.72)}px;font-weight:700;color:#000;border-bottom:.3mm solid #000;text-align:center;flex-shrink:0;}
.qbody{width:100%;display:flex;flex-direction:column;align-items:center;padding:${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm;}
.instr{font-size:${Math.round(FONT_PX*0.8)}px;font-weight:600;color:#000;text-align:center;margin-bottom:0.8mm;}
.eqrow{display:flex;align-items:baseline;justify-content:center;gap:3px;margin:0.2mm 0;}
.eqlbl{font-size:${Math.round(FONT_PX*0.7)}px;font-weight:700;color:#9ca3af;width:7mm;text-align:right;flex-shrink:0;}
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
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var qData=${JSON.stringify(qData)};
  function kr(el,latex){try{katex.render(latex,el,{throwOnError:false,output:"html"});}catch(e){el.textContent=latex;}}
  function kEl(latex){var s=document.createElement("span");s.className="em";kr(s,latex);return s;}
  function cellInner(item,showAns){
    var body=document.createElement("div");body.className="qbody";
    var instr=document.createElement("div");instr.className="instr";instr.textContent="Solve simultaneously:";body.appendChild(instr);
    [["(1)",item.eq1],["(2)",item.eq2]].forEach(function(pair){
      var row=document.createElement("div");row.className="eqrow";
      var lbl=document.createElement("span");lbl.className="eqlbl";lbl.textContent=pair[0];
      var m=document.createElement("span");m.className="em";kr(m,pair[1]);
      row.appendChild(lbl);row.appendChild(m);body.appendChild(row);
    });
    if(showAns){
      var pairs=item.answerLatex.split("|SPLIT|");
      pairs.forEach(function(pair){
        var a=document.createElement("div");a.className="qa";kr(a,pair);body.appendChild(a);
      });
    }
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
    var h1=document.createElement("h1");h1.textContent="Substitution — "+toolName+(showAns?" — Answers":"");
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
  if(!win){alert("Please allow popups.");return;}
  win.document.write(html);win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [subTool,setSubTool]=useState<SubTool>("linear");
  const [mode,setMode]=useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty,setDifficulty]=useState<DifficultyLevel>("level1");
  const [negMode,setNegMode]=useState<NegMode>("pos-only");
  const [allowZero,setAllowZero]=useState(false);
  const [allowNegEq1,setAllowNegEq1]=useState(false);
  const [allowA,setAllowA]=useState(false);
  const [surdDisplay,setSurdDisplay]=useState<SurdDisplay>("surd");
  const [allowRearrange,setAllowRearrange]=useState(false);
  const [isDifferentiated,setIsDifferentiated]=useState(false);
  const [currentQuestion,setCurrentQuestion]=useState<AnyQuestion>(()=>generateLinear("level1","never",false,false));
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
  const [splitPct,setSplitPct]=useState(40);
  const isDraggingRef=useRef(false);
  const splitContainerRef=useRef<HTMLDivElement>(null);

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
  const fsToolbarBg=isDefault?"#ffffff":stepBg,fsQuestionBg=isDefault?"#ffffff":qBg,fsWorkingBg=isDefault?"#f5f3f0":qBg;

  const makeQ=useCallback(():AnyQuestion=>{
    if(subTool==="linear")return generateLinear(difficulty,negMode,allowZero,allowNegEq1);
    return generateNonLinear(subTool,difficulty,allowA,surdDisplay,allowRearrange);
  },[subTool,difficulty,negMode,allowZero,allowNegEq1,allowA,surdDisplay,allowRearrange]);

  const handleNewQuestion=useCallback(()=>{
    setCurrentQuestion(makeQ());setShowWhiteboardAnswer(false);setShowAnswer(false);
  },[makeQ]);

  const handleGenerateWorksheet=()=>{
    const used=new Set<string>(),qs:AnyQuestion[]=[];
    if(isDifferentiated){
      (["level1","level2","level3"]as DifficultyLevel[]).forEach(lv=>{
        for(let i=0;i<numQuestions;i++)
          qs.push(subTool==="linear"?genUniqueLinear(lv,negMode,allowZero,allowNegEq1,used):genUniqueNL(subTool,lv,allowA,surdDisplay,allowRearrange,used));
      });
    }else{
      for(let i=0;i<numQuestions;i++)
        qs.push(subTool==="linear"?genUniqueLinear(difficulty,negMode,allowZero,allowNegEq1,used):genUniqueNL(subTool,difficulty,allowA,surdDisplay,allowRearrange,used));
    }
    setWorksheet(qs);setShowWorksheetAnswers(false);
  };

  useEffect(()=>{if(mode!=="worksheet")handleNewQuestion();},[difficulty,subTool]);

  const displayFontSizes=["text-xl","text-2xl","text-3xl","text-4xl","text-5xl","text-6xl"];
  const fontSizes=["text-base","text-lg","text-xl","text-2xl","text-3xl"];
  const canDI=displayFontSize<displayFontSizes.length-1,canDD=displayFontSize>0;
  const canInc=worksheetFontSize<fontSizes.length-1,canDec=worksheetFontSize>0;
  const fbStyle=(en:boolean):CSSProperties=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:en?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:en?1:0.35});

  const renderQOPopover=()=>subTool==="linear"
    ?<LinearQOPopover level={difficulty} negMode={negMode} setNegMode={setNegMode} allowZero={allowZero} setAllowZero={setAllowZero} allowNegEq1={allowNegEq1} setAllowNegEq1={setAllowNegEq1}/>
    :<NonLinearQOPopover subTool={subTool} level={difficulty} allowA={allowA} setAllowA={setAllowA} surdDisplay={surdDisplay} setSurdDisplay={setSurdDisplay} allowRearrange={allowRearrange} setAllowRearrange={setAllowRearrange}/>;

  const renderQuestionContent=(showAns:boolean)=>{
    if(currentQuestion.kind==="linear"){
      const lq=currentQuestion as LinearQuestion;
      return <>
        <div className={`${displayFontSizes[Math.max(0,displayFontSize-1)]} font-semibold`} style={{color:"#000"}}>Solve simultaneously:</div>
        <EqPairDisplay eqs={[lq.eq1Display,lq.eq2Display]} cls={displayFontSizes[displayFontSize]}/>
        {showAns&&<div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}>
          <MathRenderer latex={`${lq.varPair[0]}=${lq.v1Val},\\quad ${lq.varPair[1]}=${lq.v2Val}`}/>
        </div>}
      </>;
    }
    const nlq=currentQuestion as NonLinearQuestion;
    return <>
      <div className={`${displayFontSizes[Math.max(0,displayFontSize-1)]} font-semibold`} style={{color:"#000"}}>Solve simultaneously:</div>
      <EqPairDisplay eqs={[nlq.eq1Display,nlq.eq2Display]} cls={displayFontSizes[displayFontSize]}/>
      {showAns&&<div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}><SolutionDisplay q={nlq} surdDisplay={surdDisplay}/></div>}
    </>;
  };

  const renderQCell=(q:AnyQuestion,idx:number,bgOverride?:string)=>{
    const bg=bgOverride??stepBg,fsz=fontSizes[worksheetFontSize],instrFsz=fontSizes[Math.max(0,worksheetFontSize-1)];
    return(
      <div style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative",padding:"8px 8px 8px 22px",borderRadius:"12px"}}>
        <span style={{position:"absolute",top:0,left:0,fontSize:"0.62em",fontWeight:700,color:"#000",padding:"2px 3px 4px 3px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
        <div className="flex flex-col items-center gap-1 w-full">
          <span className={`${instrFsz} font-semibold`} style={{color:"#000"}}>Solve:</span>
          {[q.eq1Display,q.eq2Display].map((eq,i)=>(
            <div key={i} className="flex items-baseline gap-2 justify-center">
              <span className="text-xs font-bold text-gray-400 flex-shrink-0">({i+1})</span>
              <span className={`${fsz} font-semibold`} style={{color:"#000"}}><MathRenderer latex={eq}/></span>
            </div>
          ))}
          {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            {q.kind==="linear"
              ?<MathRenderer latex={`${q.varPair[0]}=${q.v1Val},\\quad ${q.varPair[1]}=${q.v2Val}`}/>
              :(q as NonLinearQuestion).solutions.map((s,i)=><div key={i}><MathRenderer latex={`x=${fmtSoln(s.x)},\\;y=${fmtSoln(s.y)}`}/></div>)
            }
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
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]]as const).map(([val,label,col])=>(
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
          {renderQOPopover()}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions} onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||12)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated?3:numColumns} onChange={e=>{if(!isDifferentiated)setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||2)));}} disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> Generate</button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}</button>
            <button onClick={()=>handlePrint(worksheet,subTool,difficulty,isDifferentiated,numColumns,surdDisplay)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18}/> Print / PDF</button>
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
    const questionBox=(isFS:boolean)=>(
      <div style={{position:"relative",width:isFS?`${splitPct}%`:"500px",height:"100%",backgroundColor:isFS?fsQuestionBg:stepBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isFS?48:32,boxSizing:"border-box",flexShrink:0,gap:16,borderRadius:isFS?0:"12px"}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fbStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fbStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {renderQuestionContent(showWhiteboardAnswer)}
      </div>
    );
    const rightPanel=(isFS:boolean)=>(
      <div style={{flex:1,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:"12px"}} className={isFS?"":"flex-1"}>
        {presenterMode&&<><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>{camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center"}}>{camError}</div>}</>}
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
        <div ref={splitContainerRef} style={{flex:1,display:"flex",minHeight:0}}>
          {questionBox(true)}
          <div
            style={{position:"relative",width:2,backgroundColor:"#000",flexShrink:0,cursor:"col-resize"}}
            onMouseDown={e=>{
              isDraggingRef.current=true;
              const onMove=(ev: MouseEvent)=>{
                if(!isDraggingRef.current||!splitContainerRef.current)return;
                const rect=splitContainerRef.current.getBoundingClientRect();
                let pct=((ev.clientX-rect.left)/rect.width)*100;
                pct=Math.min(75,Math.max(25,pct));
                if(pct>=38&&pct<=42)pct=40;
                setSplitPct(pct);
              };
              const onUp=()=>{isDraggingRef.current=false;document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
              document.addEventListener("mousemove",onMove);
              document.addEventListener("mouseup",onUp);
              e.preventDefault();
            }}
          >
            <div style={{position:"absolute",top:0,bottom:0,left:-5,width:12,cursor:"col-resize"}}/>
          </div>
          {rightPanel(true)}
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
            <button style={fbStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
            <button style={fbStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
          </div>
          <div className="py-2 flex flex-col items-center gap-3">{renderQuestionContent(false)}</div>
        </div>
        {showAnswer&&(currentQuestion.kind==="linear"
          ?<LinearWorkedSteps q={currentQuestion as LinearQuestion} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]}/>
          :<NonLinearWorkedSteps q={currentQuestion as NonLinearQuestion} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]} surdDisplay={surdDisplay}/>
        )}
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
    const lbl=subTool==="linear"?"Linear Substitution":subTool==="factorising"?"Non-Linear (Factorising)":"Non-Linear (Formula)";
    if(isDifferentiated)return(
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{lbl} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"]as DifficultyLevel[]).map((lv,li)=>{
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
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{lbl} — Worksheet</h2>
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
          <div className="flex justify-center mb-6"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {([["linear","Linear"],["factorising","Non-Linear (Factorising)"],["formula","Non-Linear (Formula)"]]as const).map(([st,label])=>(
              <button key={st} onClick={()=>{setSubTool(st);setWorksheet([]);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${subTool===st?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{label}</button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]]as const).map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setPresenterMode(false);setWbFullscreen(false);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{label}</button>
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
