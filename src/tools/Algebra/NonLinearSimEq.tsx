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
type NegMode = "pos-only" | "neg-only" | "both";
type SurdDisplay = "surd" | "decimal" | "both";
type AllowAMode = number;

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
  for (let d = 1; d <= 10; d++) {
    const num = Math.round(n * d);
    if (Math.abs(num / d - n) < 0.0001) {
      if (d === 1) return `${num}`;
      const g = gcd2(Math.abs(num), d);
      return `\\frac{${num / g}}{${d / g}}`;
    }
  }
  return fmt2(n);
};

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
    const eq2a=iso==="v1"?1:-k, eq2b=iso==="v1"?-k:1;
    if (sameLine(a,b,c,eq2a,eq2b,d)) return genLinL2(aN,rN,aZ,aNE);
    const pS=p===0?iV:p>0?`${iV} + ${p}`:`${iV} - ${Math.abs(p)}`;
    const dS=d===0?"":(d>0?` + ${d}`:` - ${Math.abs(d)}`);
    const isoE=`${k}${oV}${dS}`;
    return { kind:"linear",varPair:vp,a1:a,b1:b,c1:c,eq1Display:buildEqLin(a,b,c,v1,v2),eq2Display:`${n}${oV} = ${pS}`,isolatedVar:iso,isolatedExpr:isoE,rearrangedLatex:`${iV} = ${isoE}`,needsRearrange:true,afterSubLatex:aSubPos(iC,oC,k,d,oV,c),solveSteps:solvePos(iC,oC,k,d,oV,oVal,c),subBackSteps:sbPos(iV,oV,k,d,oVal,iVal),v1Val:v1V,v2Val:v2V,key:`L2rhs-${v1}${v2}-${k}-${d}-${v1V}-${v2V}-${id}`,difficulty:"level2",working:[] };
  }

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

// ═══════════════════════════════════════════════════════════════════════════════
// PARABOLA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════
const generateParabola = (subTool: "factorising"|"formula", level: DifficultyLevel, allowA: AllowAMode, surdDisplay: SurdDisplay, allowRearrange: boolean): NonLinearQuestion => {
  const id=randInt(0,1e6);
  const useCoef = !!(allowA & 6);
  void surdDisplay; void allowRearrange;

  if (subTool==="factorising") {
    const bothTwo=useCoef&&Math.random()<0.15;
    let p: number, r: number;
    if (bothTwo) { p=2; r=2; }
    else if (!useCoef) { p=1; r=1; }
    else { const fF=Math.random()<0.5; p=fF?pick([2,3,4,5]):1; r=fF?1:pick([2,3,4,5]); }
    const q=randInt(-6,6), s=randInt(-6,6);
    if (!q||!s) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    if (Math.abs(q*r-s*p)<0.001) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
    const Ar=p*r, Br=-(p*s+q*r), Cr=q*s;
    if (!useCoef&&Ar>1) return generateParabola(subTool,level,allowA,surdDisplay,allowRearrange);
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

  for (let attempt=0; attempt<200; attempt++) {
    const A=useCoef?randInt(1,5):1;
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

// ═══════════════════════════════════════════════════════════════════════════════
// BANK TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface BankEntry {
  eq1: string; eq2: string;
  expanded: string; factorised: string;
  soln1: string; soln2: string;
  A: number; B: number; C: number; r2: number;
  isolateVar: "x"|"y"; linM: number; linD: number;
  quadSub: string;
  x1: number; y1: number; x2: number; y2: number;
  coefType: "none"|"one"|"both";
}

interface FormBankEntry {
  eq1: string; eq2: string;
  expanded: string;
  surdX: string;
  surdYcombined: string;
  soln1dec: string; soln2dec: string;
  A: number; B: number; C: number; r2: number;
  isolateVar: "x"|"y"; linM: number; linD: number;
  quadSub: string;
  x1: number; y1: number; x2: number; y2: number;
  disc: number;
  coefType: "none"|"one"|"both";
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAC BANK — 20 none, 20 one, 20 both
// ═══════════════════════════════════════════════════════════════════════════════
const FAC_BANK: BankEntry[] = [
  // ── none (circle x²+y²=r²) ─────────────────────────────────────────
  { eq1:"x^2+y^2=25",  eq2:"y=2x-5",   expanded:"5x^2-20x=0",       factorised:"5x(x-4)=0",         soln1:"x=0,\\;y=-5",                          soln2:"x=4,\\;y=3",                          A:5,  B:-20,C:0,   r2:25,  isolateVar:"y",linM:2,  linD:-5, quadSub:"x^2+(2x-5)^2=25",           x1:0,    y1:-5,   x2:4,    y2:3,    coefType:"none" },
  { eq1:"x^2+y^2=25",  eq2:"y=x+1",    expanded:"2x^2+2x-24=0",     factorised:"2(x+4)(x-3)=0",     soln1:"x=-4,\\;y=-3",                         soln2:"x=3,\\;y=4",                          A:2,  B:2,   C:-24,  r2:25,  isolateVar:"y",linM:1,  linD:1,  quadSub:"x^2+(x+1)^2=25",            x1:-4,   y1:-3,   x2:3,    y2:4,    coefType:"none" },
  { eq1:"x^2+y^2=10",  eq2:"y=x+2",    expanded:"2x^2+4x-6=0",      factorised:"2(x+3)(x-1)=0",     soln1:"x=-3,\\;y=-1",                         soln2:"x=1,\\;y=3",                          A:2,  B:4,   C:-6,   r2:10,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=10",            x1:-3,   y1:-1,   x2:1,    y2:3,    coefType:"none" },
  { eq1:"x^2+y^2=13",  eq2:"y=x-1",    expanded:"2x^2-2x-12=0",     factorised:"2(x-3)(x+2)=0",     soln1:"x=-2,\\;y=-3",                         soln2:"x=3,\\;y=2",                          A:2,  B:-2,  C:-12,  r2:13,  isolateVar:"y",linM:1,  linD:-1, quadSub:"x^2+(x-1)^2=13",            x1:-2,   y1:-3,   x2:3,    y2:2,    coefType:"none" },
  { eq1:"x^2+y^2=20",  eq2:"y=2x",     expanded:"5x^2-20=0",        factorised:"5(x-2)(x+2)=0",     soln1:"x=-2,\\;y=-4",                         soln2:"x=2,\\;y=4",                          A:5,  B:0,   C:-20,  r2:20,  isolateVar:"y",linM:2,  linD:0,  quadSub:"x^2+(2x)^2=20",             x1:-2,   y1:-4,   x2:2,    y2:4,    coefType:"none" },
  { eq1:"x^2+y^2=50",  eq2:"y=x",      expanded:"2x^2-50=0",        factorised:"2(x-5)(x+5)=0",     soln1:"x=-5,\\;y=-5",                         soln2:"x=5,\\;y=5",                          A:2,  B:0,   C:-50,  r2:50,  isolateVar:"y",linM:1,  linD:0,  quadSub:"x^2+x^2=50",                x1:-5,   y1:-5,   x2:5,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=25",  eq2:"y=3x+5",   expanded:"10x^2+30x=0",      factorised:"10x(x+3)=0",        soln1:"x=-3,\\;y=-4",                         soln2:"x=0,\\;y=5",                          A:10, B:30,  C:0,    r2:25,  isolateVar:"y",linM:3,  linD:5,  quadSub:"x^2+(3x+5)^2=25",           x1:-3,   y1:-4,   x2:0,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=34",  eq2:"y=x+2",    expanded:"2x^2+4x-30=0",     factorised:"2(x+5)(x-3)=0",     soln1:"x=-5,\\;y=-3",                         soln2:"x=3,\\;y=5",                          A:2,  B:4,   C:-30,  r2:34,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=34",            x1:-5,   y1:-3,   x2:3,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=45",  eq2:"y=2x",     expanded:"5x^2-45=0",        factorised:"5(x-3)(x+3)=0",     soln1:"x=-3,\\;y=-6",                         soln2:"x=3,\\;y=6",                          A:5,  B:0,   C:-45,  r2:45,  isolateVar:"y",linM:2,  linD:0,  quadSub:"x^2+(2x)^2=45",             x1:-3,   y1:-6,   x2:3,    y2:6,    coefType:"none" },
  { eq1:"x^2+y^2=5",   eq2:"y=x+3",    expanded:"2x^2+6x+4=0",      factorised:"2(x+1)(x+2)=0",     soln1:"x=-2,\\;y=1",                          soln2:"x=-1,\\;y=2",                         A:2,  B:6,   C:4,    r2:5,   isolateVar:"y",linM:1,  linD:3,  quadSub:"x^2+(x+3)^2=5",             x1:-2,   y1:1,    x2:-1,   y2:2,    coefType:"none" },
  { eq1:"x^2+y^2=13",  eq2:"y=2x+1",   expanded:"5x^2+4x-12=0",     factorised:"(5x-6)(x+2)=0",     soln1:"x=-2,\\;y=-3",                         soln2:"x=\\frac{6}{5},\\;y=\\frac{17}{5}",  A:5,  B:4,   C:-12,  r2:13,  isolateVar:"y",linM:2,  linD:1,  quadSub:"x^2+(2x+1)^2=13",           x1:-2,   y1:-3,   x2:1.2,  y2:3.4,  coefType:"none" },
  { eq1:"x^2+y^2=17",  eq2:"y=x+3",    expanded:"2x^2+6x-8=0",      factorised:"2(x+4)(x-1)=0",     soln1:"x=-4,\\;y=-1",                         soln2:"x=1,\\;y=4",                          A:2,  B:6,   C:-8,   r2:17,  isolateVar:"y",linM:1,  linD:3,  quadSub:"x^2+(x+3)^2=17",            x1:-4,   y1:-1,   x2:1,    y2:4,    coefType:"none" },
  { eq1:"x^2+y^2=29",  eq2:"y=x+3",    expanded:"2x^2+6x-20=0",     factorised:"2(x+5)(x-2)=0",     soln1:"x=-5,\\;y=-2",                         soln2:"x=2,\\;y=5",                          A:2,  B:6,   C:-20,  r2:29,  isolateVar:"y",linM:1,  linD:3,  quadSub:"x^2+(x+3)^2=29",            x1:-5,   y1:-2,   x2:2,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=26",  eq2:"y=x+2",    expanded:"2x^2+4x-22=0",     factorised:"2(x+5)(x-3)=0",     soln1:"x=-5,\\;y=-3",                         soln2:"x=3,\\;y=5",                          A:2,  B:4,   C:-22,  r2:26,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=26",            x1:-5,   y1:-3,   x2:3,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=41",  eq2:"y=x+1",    expanded:"2x^2+2x-40=0",     factorised:"2(x+5)(x-4)=0",     soln1:"x=-5,\\;y=-4",                         soln2:"x=4,\\;y=5",                          A:2,  B:2,   C:-40,  r2:41,  isolateVar:"y",linM:1,  linD:1,  quadSub:"x^2+(x+1)^2=41",            x1:-5,   y1:-4,   x2:4,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=52",  eq2:"y=x+2",    expanded:"2x^2+4x-48=0",     factorised:"2(x+6)(x-4)=0",     soln1:"x=-6,\\;y=-4",                         soln2:"x=4,\\;y=6",                          A:2,  B:4,   C:-48,  r2:52,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=52",            x1:-6,   y1:-4,   x2:4,    y2:6,    coefType:"none" },
  { eq1:"x^2+y^2=65",  eq2:"y=x+1",    expanded:"2x^2+2x-64=0",     factorised:"2(x+6)(x-5)=0",     soln1:"x=-6,\\;y=-5",                         soln2:"x=5,\\;y=6",                          A:2,  B:2,   C:-64,  r2:65,  isolateVar:"y",linM:1,  linD:1,  quadSub:"x^2+(x+1)^2=65",            x1:-6,   y1:-5,   x2:5,    y2:6,    coefType:"none" },
  { eq1:"x^2+y^2=5",   eq2:"y=2x-5",   expanded:"5x^2-20x+20=0",    factorised:"5(x-2)^2=0",        soln1:"x=2,\\;y=-1",                          soln2:"x=2,\\;y=-1",                         A:5,  B:-20, C:20,   r2:5,   isolateVar:"y",linM:2,  linD:-5, quadSub:"x^2+(2x-5)^2=5",            x1:2,    y1:-1,   x2:2,    y2:-1,   coefType:"none" },
  { eq1:"x^2+y^2=10",  eq2:"y=3x-10",  expanded:"10x^2-60x+90=0",   factorised:"10(x-3)^2=0",       soln1:"x=3,\\;y=-1",                          soln2:"x=3,\\;y=-1",                         A:10, B:-60, C:90,   r2:10,  isolateVar:"y",linM:3,  linD:-10,quadSub:"x^2+(3x-10)^2=10",          x1:3,    y1:-1,   x2:3,    y2:-1,   coefType:"none" },
  { eq1:"x^2+y^2=5",   eq2:"y=2x+3",   expanded:"5x^2+12x+4=0",     factorised:"(5x+2)(x+2)=0",     soln1:"x=-2,\\;y=-1",                         soln2:"x=-\\frac{2}{5},\\;y=\\frac{11}{5}", A:5,  B:12,  C:4,    r2:5,   isolateVar:"y",linM:2,  linD:3,  quadSub:"x^2+(2x+3)^2=5",            x1:-2,   y1:-1,   x2:-0.4, y2:2.2,  coefType:"none" },
  // ── one (ellipse, one coef > 1) ────────────────────────────────────
  { eq1:"4x^2+y^2=4",  eq2:"y=2x+2",   expanded:"8x^2+8x=0",        factorised:"8x(x+1)=0",         soln1:"x=-1,\\;y=0",                          soln2:"x=0,\\;y=2",                          A:8,  B:8,   C:0,    r2:4,   isolateVar:"y",linM:2,  linD:2,  quadSub:"4x^2+(2x+2)^2=4",           x1:-1,   y1:0,    x2:0,    y2:2,    coefType:"one" },
  { eq1:"4x^2+y^2=8",  eq2:"y=2x+2",   expanded:"8x^2+8x-4=0",      factorised:"4(2x+1)(x-1)=0",    soln1:"x=-2,\\;y=-2",                         soln2:"x=\\frac{1}{4},\\;y=\\frac{5}{2}",   A:8,  B:8,   C:-4,   r2:8,   isolateVar:"y",linM:2,  linD:2,  quadSub:"4x^2+(2x+2)^2=8",           x1:-2,   y1:-2,   x2:0.25, y2:2.5,  coefType:"one" },
  { eq1:"x^2+4y^2=4",  eq2:"x=2y+2",   expanded:"8y^2+8y=0",        factorised:"8y(y+1)=0",         soln1:"x=0,\\;y=-1",                          soln2:"x=2,\\;y=0",                          A:8,  B:8,   C:0,    r2:4,   isolateVar:"x",linM:2,  linD:2,  quadSub:"(2y+2)^2+4y^2=4",           x1:0,    y1:-1,   x2:2,    y2:0,    coefType:"one" },
  { eq1:"x^2+2y^2=9",  eq2:"y=x-3",    expanded:"3x^2-12x+9=0",     factorised:"3(x-1)(x-3)=0",     soln1:"x=1,\\;y=-2",                          soln2:"x=3,\\;y=0",                          A:3,  B:-12, C:9,    r2:9,   isolateVar:"y",linM:1,  linD:-3, quadSub:"x^2+2(x-3)^2=9",            x1:1,    y1:-2,   x2:3,    y2:0,    coefType:"one" },
  { eq1:"2x^2+y^2=18", eq2:"y=x+3",    expanded:"3x^2+6x-9=0",      factorised:"3(x+3)(x-1)=0",     soln1:"x=-3,\\;y=0",                          soln2:"x=1,\\;y=4",                          A:3,  B:6,   C:-9,   r2:18,  isolateVar:"y",linM:1,  linD:3,  quadSub:"2x^2+(x+3)^2=18",           x1:-3,   y1:0,    x2:1,    y2:4,    coefType:"one" },
  { eq1:"x^2+3y^2=12", eq2:"x=3y",     expanded:"12y^2-12=0",       factorised:"12(y-1)(y+1)=0",    soln1:"x=-3,\\;y=-1",                         soln2:"x=3,\\;y=1",                          A:12, B:0,   C:-12,  r2:12,  isolateVar:"x",linM:3,  linD:0,  quadSub:"(3y)^2+3y^2=12",            x1:-3,   y1:-1,   x2:3,    y2:1,    coefType:"one" },
  { eq1:"2x^2+y^2=9",  eq2:"y=2x-3",   expanded:"6x^2-12x=0",       factorised:"6x(x-2)=0",         soln1:"x=0,\\;y=-3",                          soln2:"x=2,\\;y=1",                          A:6,  B:-12, C:0,    r2:9,   isolateVar:"y",linM:2,  linD:-3, quadSub:"2x^2+(2x-3)^2=9",           x1:0,    y1:-3,   x2:2,    y2:1,    coefType:"one" },
  { eq1:"x^2+2y^2=11", eq2:"y=x-2",    expanded:"3x^2-8x-3=0",      factorised:"(3x+1)(x-3)=0",     soln1:"x=-\\frac{1}{3},\\;y=-\\frac{7}{3}",   soln2:"x=3,\\;y=1",                          A:3,  B:-8,  C:-3,   r2:11,  isolateVar:"y",linM:1,  linD:-2, quadSub:"x^2+2(x-2)^2=11",           x1:-1/3, y1:-7/3, x2:3,    y2:1,    coefType:"one" },
  { eq1:"3x^2+y^2=12", eq2:"y=x+2",    expanded:"4x^2+4x-8=0",      factorised:"4(x+2)(x-1)=0",     soln1:"x=-2,\\;y=0",                          soln2:"x=1,\\;y=3",                          A:4,  B:4,   C:-8,   r2:12,  isolateVar:"y",linM:1,  linD:2,  quadSub:"3x^2+(x+2)^2=12",           x1:-2,   y1:0,    x2:1,    y2:3,    coefType:"one" },
  { eq1:"x^2+3y^2=7",  eq2:"x=y+2",    expanded:"4y^2+4y-3=0",      factorised:"(2y+3)(2y-1)=0",    soln1:"x=\\frac{1}{2},\\;y=-\\frac{3}{2}",    soln2:"x=\\frac{5}{2},\\;y=\\frac{1}{2}",   A:4,  B:4,   C:-3,   r2:7,   isolateVar:"x",linM:1,  linD:2,  quadSub:"(y+2)^2+3y^2=7",            x1:0.5,  y1:-1.5, x2:2.5,  y2:0.5,  coefType:"one" },
  { eq1:"4x^2+y^2=25", eq2:"y=2x+1",   expanded:"8x^2+4x-24=0",     factorised:"4(2x+3)(x-2)=0",    soln1:"x=-\\frac{3}{2},\\;y=-2",              soln2:"x=2,\\;y=5",                          A:8,  B:4,   C:-24,  r2:25,  isolateVar:"y",linM:2,  linD:1,  quadSub:"4x^2+(2x+1)^2=25",          x1:-1.5, y1:-2,   x2:2,    y2:5,    coefType:"one" },
  { eq1:"x^2+4y^2=25", eq2:"x=2y+1",   expanded:"8y^2+4y-24=0",     factorised:"4(2y+3)(y-2)=0",    soln1:"x=-2,\\;y=-\\frac{3}{2}",              soln2:"x=5,\\;y=2",                          A:8,  B:4,   C:-24,  r2:25,  isolateVar:"x",linM:2,  linD:1,  quadSub:"(2y+1)^2+4y^2=25",          x1:-2,   y1:-1.5, x2:5,    y2:2,    coefType:"one" },
  { eq1:"9x^2+y^2=9",  eq2:"y=3x+3",   expanded:"18x^2+18x=0",      factorised:"18x(x+1)=0",        soln1:"x=-1,\\;y=0",                          soln2:"x=0,\\;y=3",                          A:18, B:18,  C:0,    r2:9,   isolateVar:"y",linM:3,  linD:3,  quadSub:"9x^2+(3x+3)^2=9",           x1:-1,   y1:0,    x2:0,    y2:3,    coefType:"one" },
  { eq1:"x^2+9y^2=9",  eq2:"x=3y+3",   expanded:"18y^2+18y=0",      factorised:"18y(y+1)=0",        soln1:"x=0,\\;y=-1",                          soln2:"x=3,\\;y=0",                          A:18, B:18,  C:0,    r2:9,   isolateVar:"x",linM:3,  linD:3,  quadSub:"(3y+3)^2+9y^2=9",           x1:0,    y1:-1,   x2:3,    y2:0,    coefType:"one" },
  { eq1:"2x^2+y^2=6",  eq2:"y=x+1",    expanded:"3x^2+2x-5=0",      factorised:"(3x+5)(x-1)=0",     soln1:"x=-\\frac{5}{3},\\;y=-\\frac{2}{3}",   soln2:"x=1,\\;y=2",                          A:3,  B:2,   C:-5,   r2:6,   isolateVar:"y",linM:1,  linD:1,  quadSub:"2x^2+(x+1)^2=6",            x1:-5/3, y1:-2/3, x2:1,    y2:2,    coefType:"one" },
  { eq1:"x^2+2y^2=6",  eq2:"x=y+1",    expanded:"3y^2+2y-5=0",      factorised:"(3y+5)(y-1)=0",     soln1:"x=-\\frac{2}{3},\\;y=-\\frac{5}{3}",   soln2:"x=2,\\;y=1",                          A:3,  B:2,   C:-5,   r2:6,   isolateVar:"x",linM:1,  linD:1,  quadSub:"(y+1)^2+2y^2=6",            x1:-2/3, y1:-5/3, x2:2,    y2:1,    coefType:"one" },
  { eq1:"3x^2+y^2=7",  eq2:"y=x+1",    expanded:"4x^2+2x-6=0",      factorised:"2(2x+3)(x-1)=0",    soln1:"x=-\\frac{3}{2},\\;y=-\\frac{1}{2}",   soln2:"x=1,\\;y=2",                          A:4,  B:2,   C:-6,   r2:7,   isolateVar:"y",linM:1,  linD:1,  quadSub:"3x^2+(x+1)^2=7",            x1:-1.5, y1:-0.5, x2:1,    y2:2,    coefType:"one" },
  { eq1:"x^2+3y^2=4",  eq2:"x=y+2",    expanded:"4y^2+4y=0",        factorised:"4y(y+1)=0",         soln1:"x=1,\\;y=-1",                          soln2:"x=2,\\;y=0",                          A:4,  B:4,   C:0,    r2:4,   isolateVar:"x",linM:1,  linD:2,  quadSub:"(y+2)^2+3y^2=4",            x1:1,    y1:-1,   x2:2,    y2:0,    coefType:"one" },
  { eq1:"5x^2+y^2=5",  eq2:"y=2x+1",   expanded:"9x^2+4x-4=0",      factorised:"(9x-4)(x+1)=0",     soln1:"x=-1,\\;y=-1",                         soln2:"x=\\frac{4}{9},\\;y=\\frac{17}{9}",  A:9,  B:4,   C:-4,   r2:5,   isolateVar:"y",linM:2,  linD:1,  quadSub:"5x^2+(2x+1)^2=5",           x1:-1,   y1:-1,   x2:4/9,  y2:17/9, coefType:"one" },
  { eq1:"x^2+5y^2=5",  eq2:"x=2y+1",   expanded:"9y^2+4y-4=0",      factorised:"(9y-4)(y+1)=0",     soln1:"x=-1,\\;y=-1",                         soln2:"x=\\frac{17}{9},\\;y=\\frac{4}{9}",  A:9,  B:4,   C:-4,   r2:5,   isolateVar:"x",linM:2,  linD:1,  quadSub:"(2y+1)^2+5y^2=5",           x1:-1,   y1:-1,   x2:17/9, y2:4/9,  coefType:"one" },
  { eq1:"4x^2+y^2=16", eq2:"y=x+2",    expanded:"5x^2+4x-12=0",     factorised:"(5x-6)(x+2)=0",     soln1:"x=-2,\\;y=0",                          soln2:"x=\\frac{6}{5},\\;y=\\frac{16}{5}",  A:5,  B:4,   C:-12,  r2:16,  isolateVar:"y",linM:1,  linD:2,  quadSub:"4x^2+(x+2)^2=16",           x1:-2,   y1:0,    x2:1.2,  y2:3.2,  coefType:"one" },
  // ── both (ellipse, both coefs > 1) ─────────────────────────────────
  { eq1:"4x^2+9y^2=36",  eq2:"y=x+3",   expanded:"13x^2+24x=0",      factorised:"x(13x+24)=0",       soln1:"x=-\\frac{24}{13},\\;y=\\frac{15}{13}",soln2:"x=0,\\;y=3",                          A:13, B:24,  C:0,    r2:36,  isolateVar:"y",linM:1,  linD:3,  quadSub:"4x^2+9(x+3)^2=36",          x1:-24/13,y1:15/13,x2:0,   y2:3,    coefType:"both" },
  { eq1:"4x^2+9y^2=25",  eq2:"y=x-1",   expanded:"13x^2-18x-8=0",    factorised:"(13x+4)(x-2)=0",    soln1:"x=-\\frac{4}{13},\\;y=-\\frac{17}{13}",soln2:"x=2,\\;y=1",                          A:13, B:-18, C:-8,   r2:25,  isolateVar:"y",linM:1,  linD:-1, quadSub:"4x^2+9(x-1)^2=25",          x1:-4/13,y1:-17/13,x2:2,  y2:1,    coefType:"both" },
  { eq1:"2x^2+3y^2=5",   eq2:"y=x-1",   expanded:"5x^2-6x-2=0",      factorised:"(5x+2)(x-\\frac{2}{5})=0", soln1:"x=-\\frac{2}{5},\\;y=-\\frac{7}{5}", soln2:"x=\\frac{8}{5},\\;y=\\frac{3}{5}", A:5,B:-6,C:-2,r2:5,isolateVar:"y",linM:1,linD:-1,quadSub:"2x^2+3(x-1)^2=5",x1:-2/5,y1:-7/5,x2:8/5,y2:3/5,coefType:"both" },
  { eq1:"3x^2+2y^2=5",   eq2:"y=x+1",   expanded:"5x^2+4x-2=0",      factorised:"(5x-2)(x+1)=0",     soln1:"x=-1,\\;y=0",                          soln2:"x=\\frac{2}{5},\\;y=\\frac{7}{5}",   A:5,  B:4,   C:-2,   r2:5,   isolateVar:"y",linM:1,  linD:1,  quadSub:"3x^2+2(x+1)^2=5",           x1:-1,   y1:0,    x2:2/5,  y2:7/5,  coefType:"both" },
  { eq1:"4x^2+9y^2=36",  eq2:"y=x-2",   expanded:"13x^2-36x=0",      factorised:"x(13x-36)=0",       soln1:"x=0,\\;y=-2",                          soln2:"x=\\frac{36}{13},\\;y=\\frac{10}{13}",A:13,B:-36,C:0,r2:36,isolateVar:"y",linM:1,linD:-2,quadSub:"4x^2+9(x-2)^2=36",x1:0,y1:-2,x2:36/13,y2:10/13,coefType:"both" },
  { eq1:"9x^2+4y^2=36",  eq2:"y=x+3",   expanded:"13x^2+24x=0",      factorised:"x(13x+24)=0",       soln1:"x=-\\frac{24}{13},\\;y=\\frac{15}{13}",soln2:"x=0,\\;y=3",                          A:13, B:24,  C:0,    r2:36,  isolateVar:"y",linM:1,  linD:3,  quadSub:"9x^2+4(x+3)^2=36",          x1:-24/13,y1:15/13,x2:0,  y2:3,    coefType:"both" },
  { eq1:"9x^2+4y^2=36",  eq2:"y=x-3",   expanded:"13x^2-24x=0",      factorised:"x(13x-24)=0",       soln1:"x=0,\\;y=-3",                          soln2:"x=\\frac{24}{13},\\;y=\\frac{-15}{13}",A:13,B:-24,C:0,r2:36,isolateVar:"y",linM:1,linD:-3,quadSub:"9x^2+4(x-3)^2=36",x1:0,y1:-3,x2:24/13,y2:-15/13,coefType:"both" },
  { eq1:"4x^2+9y^2=13",  eq2:"y=x-1",   expanded:"13x^2-18x-4=0",    factorised:"(13x+2)(x-2)=0",    soln1:"x=-\\frac{2}{13},\\;y=-\\frac{15}{13}",soln2:"x=2,\\;y=1",                          A:13, B:-18, C:-4,   r2:13,  isolateVar:"y",linM:1,  linD:-1, quadSub:"4x^2+9(x-1)^2=13",          x1:-2/13,y1:-15/13,x2:2,  y2:1,    coefType:"both" },
  { eq1:"4x^2+9y^2=13",  eq2:"y=x+1",   expanded:"13x^2+18x-4=0",    factorised:"(13x-2)(x+2)=0",    soln1:"x=-2,\\;y=-1",                         soln2:"x=\\frac{2}{13},\\;y=\\frac{15}{13}", A:13, B:18,  C:-4,   r2:13,  isolateVar:"y",linM:1,  linD:1,  quadSub:"4x^2+9(x+1)^2=13",          x1:-2,   y1:-1,   x2:2/13, y2:15/13,coefType:"both" },
  { eq1:"9x^2+16y^2=25", eq2:"y=x-1",   expanded:"25x^2-32x-9=0",    factorised:"(25x+5)(x-\\frac{9}{5})=0",soln1:"x=-\\frac{1}{5},\\;y=-\\frac{6}{5}",soln2:"x=\\frac{9}{5},\\;y=\\frac{4}{5}",A:25,B:-32,C:-9,r2:25,isolateVar:"y",linM:1,linD:-1,quadSub:"9x^2+16(x-1)^2=25",x1:-1/5,y1:-6/5,x2:9/5,y2:4/5,coefType:"both" },
  { eq1:"4x^2+y^2=4",    eq2:"x=y+1",   expanded:"5y^2+8y=0",        factorised:"y(5y+8)=0",         soln1:"x=1,\\;y=0",                           soln2:"x=-\\frac{3}{5},\\;y=-\\frac{8}{5}", A:5,  B:8,   C:0,    r2:4,   isolateVar:"x",linM:1,  linD:1,  quadSub:"4(y+1)^2+y^2=4",            x1:1,    y1:0,    x2:-3/5, y2:-8/5, coefType:"both" },
  { eq1:"9x^2+4y^2=13",  eq2:"y=x+1",   expanded:"13x^2+8x-4=0",     factorised:"(13x-4)(x+1)=0",    soln1:"x=-1,\\;y=0",                          soln2:"x=\\frac{4}{13},\\;y=\\frac{17}{13}", A:13, B:8,   C:-4,   r2:13,  isolateVar:"y",linM:1,  linD:1,  quadSub:"9x^2+4(x+1)^2=13",          x1:-1,   y1:0,    x2:4/13, y2:17/13,coefType:"both" },
  { eq1:"9x^2+4y^2=13",  eq2:"y=x-1",   expanded:"13x^2-8x-4=0",     factorised:"(13x+4)(x-1)=0",    soln1:"x=-\\frac{4}{13},\\;y=-\\frac{17}{13}",soln2:"x=1,\\;y=0",                          A:13, B:-8,  C:-4,   r2:13,  isolateVar:"y",linM:1,  linD:-1, quadSub:"9x^2+4(x-1)^2=13",          x1:-4/13,y1:-17/13,x2:1,  y2:0,    coefType:"both" },
  { eq1:"4x^2+25y^2=29", eq2:"y=x-1",   expanded:"29x^2-50x-4=0",    factorised:"(29x+2)(x-2)=0",    soln1:"x=-\\frac{2}{29},\\;y=-\\frac{31}{29}",soln2:"x=2,\\;y=1",                          A:29, B:-50, C:-4,   r2:29,  isolateVar:"y",linM:1,  linD:-1, quadSub:"4x^2+25(x-1)^2=29",         x1:-2/29,y1:-31/29,x2:2,  y2:1,    coefType:"both" },
  { eq1:"25x^2+4y^2=29", eq2:"y=x-1",   expanded:"29x^2-8x-4=0",     factorised:"(29x+4)(x-1)=0",    soln1:"x=-\\frac{4}{29},\\;y=-\\frac{33}{29}",soln2:"x=1,\\;y=0",                          A:29, B:-8,  C:-4,   r2:29,  isolateVar:"y",linM:1,  linD:-1, quadSub:"25x^2+4(x-1)^2=29",         x1:-4/29,y1:-33/29,x2:1,  y2:0,    coefType:"both" },
  { eq1:"4x^2+9y^2=45",  eq2:"y=x",     expanded:"13x^2-45=0",        factorised:"(\\sqrt{13}x-\\sqrt{45})(\\sqrt{13}x+\\sqrt{45})=0",soln1:"x=-\\frac{3\\sqrt{5}}{\\sqrt{13}},\\;y=-\\frac{3\\sqrt{5}}{\\sqrt{13}}",soln2:"x=\\frac{3\\sqrt{5}}{\\sqrt{13}},\\;y=\\frac{3\\sqrt{5}}{\\sqrt{13}}",A:13,B:0,C:-45,r2:45,isolateVar:"y",linM:1,linD:0,quadSub:"4x^2+9x^2=45",x1:-Math.sqrt(45/13),y1:-Math.sqrt(45/13),x2:Math.sqrt(45/13),y2:Math.sqrt(45/13),coefType:"both" },
  { eq1:"16x^2+9y^2=25", eq2:"y=x+1",   expanded:"25x^2+18x-16=0",   factorised:"(25x-10)(x+\\frac{8}{5})=0",soln1:"x=-\\frac{8}{5},\\;y=-\\frac{3}{5}",soln2:"x=\\frac{2}{5},\\;y=\\frac{7}{5}",A:25,B:18,C:-16,r2:25,isolateVar:"y",linM:1,linD:1,quadSub:"16x^2+9(x+1)^2=25",x1:-8/5,y1:-3/5,x2:2/5,y2:7/5,coefType:"both" },
  { eq1:"16x^2+9y^2=25", eq2:"y=x-1",   expanded:"25x^2-18x-16=0",   factorised:"(25x+10)(x-\\frac{8}{5})=0",soln1:"x=-\\frac{2}{5},\\;y=-\\frac{7}{5}",soln2:"x=\\frac{8}{5},\\;y=\\frac{3}{5}",A:25,B:-18,C:-16,r2:25,isolateVar:"y",linM:1,linD:-1,quadSub:"16x^2+9(x-1)^2=25",x1:-2/5,y1:-7/5,x2:8/5,y2:3/5,coefType:"both" },
  { eq1:"4x^2+9y^2=72",  eq2:"y=x+2",   expanded:"13x^2+36x-36=0",   factorised:"(13x-6)(x+6)=0",    soln1:"x=-6,\\;y=-4",                         soln2:"x=\\frac{6}{13},\\;y=\\frac{32}{13}", A:13, B:36,  C:-36,  r2:72,  isolateVar:"y",linM:1,  linD:2,  quadSub:"4x^2+9(x+2)^2=72",          x1:-6,   y1:-4,   x2:6/13, y2:32/13,coefType:"both" },
  { eq1:"9x^2+4y^2=72",  eq2:"y=x+2",   expanded:"13x^2+16x-36=0",   factorised:"(13x-6)(x+\\frac{6}{1})=0",soln1:"x=-6,\\;y=-4",soln2:"x=\\frac{6}{13},\\;y=\\frac{32}{13}",A:13,B:16,C:-36,r2:72,isolateVar:"y",linM:1,linD:2,quadSub:"9x^2+4(x+2)^2=72",x1:-6,y1:-4,x2:6/13,y2:32/13,coefType:"both" },
  { eq1:"4x^2+9y^2=52",  eq2:"y=x+2",   expanded:"13x^2+36x-16=0",   factorised:"(13x-4)(x+4)=0",    soln1:"x=-4,\\;y=-2",                         soln2:"x=\\frac{4}{13},\\;y=\\frac{30}{13}", A:13, B:36,  C:-16,  r2:52,  isolateVar:"y",linM:1,  linD:2,  quadSub:"4x^2+9(x+2)^2=52",          x1:-4,   y1:-2,   x2:4/13, y2:30/13,coefType:"both" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FORM BANK — 20 none, 20 one, 20 both
// ═══════════════════════════════════════════════════════════════════════════════
const FORM_BANK: FormBankEntry[] = [
  // ── none (circle) ──────────────────────────────────────────────────
  { eq1:"x^2+y^2=5",  eq2:"y=x+2",  expanded:"2x^2+4x-1=0",   surdX:"x=\\frac{-4\\pm\\sqrt{24}}{4}",    surdYcombined:"y=\\frac{-2\\pm\\sqrt{24}}{4}",   soln1dec:"x\\approx-2.22,\\;y\\approx-0.22",soln2dec:"x\\approx0.22,\\;y\\approx2.22",  A:2,  B:4,   C:-1,  r2:5,  isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=5",   x1:(-4-Math.sqrt(24))/4,  y1:(-2-Math.sqrt(24))/4,   x2:(-4+Math.sqrt(24))/4,  y2:(-2+Math.sqrt(24))/4,   disc:24,  coefType:"none" },
  { eq1:"x^2+y^2=7",  eq2:"y=x+1",  expanded:"2x^2+2x-6=0",   surdX:"x=\\frac{-2\\pm\\sqrt{52}}{4}",    surdYcombined:"y=\\frac{0\\pm\\sqrt{52}}{4}",    soln1dec:"x\\approx-2.30,\\;y\\approx-1.30",soln2dec:"x\\approx1.80,\\;y\\approx2.80",  A:2,  B:2,   C:-6,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=7",   x1:(-2-Math.sqrt(52))/4,  y1:(0-Math.sqrt(52))/4,    x2:(-2+Math.sqrt(52))/4,  y2:(0+Math.sqrt(52))/4,    disc:52,  coefType:"none" },
  { eq1:"x^2+y^2=6",  eq2:"y=2x+1", expanded:"5x^2+4x-5=0",   surdX:"x=\\frac{-4\\pm\\sqrt{116}}{10}",  surdYcombined:"y=\\frac{-6\\pm 2\\sqrt{116}}{10}",soln1dec:"x\\approx-1.48,\\;y\\approx-1.95",soln2dec:"x\\approx0.68,\\;y\\approx2.35",  A:5,  B:4,   C:-5,  r2:6,  isolateVar:"y",linM:2, linD:1,  quadSub:"x^2+(2x+1)^2=6",  x1:(-4-Math.sqrt(116))/10,y1:(-6-2*Math.sqrt(116))/10,x2:(-4+Math.sqrt(116))/10,y2:(-6+2*Math.sqrt(116))/10,disc:116, coefType:"none" },
  { eq1:"x^2+y^2=11", eq2:"y=x+2",  expanded:"2x^2+4x-7=0",   surdX:"x=\\frac{-4\\pm\\sqrt{72}}{4}",    surdYcombined:"y=\\frac{-2\\pm\\sqrt{72}}{4}",   soln1dec:"x\\approx-3.12,\\;y\\approx-1.12",soln2dec:"x\\approx1.12,\\;y\\approx3.12",  A:2,  B:4,   C:-7,  r2:11, isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=11",  x1:(-4-Math.sqrt(72))/4,  y1:(-2-Math.sqrt(72))/4,   x2:(-4+Math.sqrt(72))/4,  y2:(-2+Math.sqrt(72))/4,   disc:72,  coefType:"none" },
  { eq1:"x^2+y^2=14", eq2:"y=x+1",  expanded:"2x^2+2x-13=0",  surdX:"x=\\frac{-2\\pm\\sqrt{108}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{108}}{4}",   soln1dec:"x\\approx-3.10,\\;y\\approx-2.10",soln2dec:"x\\approx2.60,\\;y\\approx3.60",  A:2,  B:2,   C:-13, r2:14, isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=14",  x1:(-2-Math.sqrt(108))/4, y1:(0-Math.sqrt(108))/4,   x2:(-2+Math.sqrt(108))/4, y2:(0+Math.sqrt(108))/4,   disc:108, coefType:"none" },
  { eq1:"x^2+y^2=3",  eq2:"y=x+1",  expanded:"2x^2+2x-2=0",   surdX:"x=\\frac{-2\\pm\\sqrt{20}}{4}",    surdYcombined:"y=\\frac{0\\pm\\sqrt{20}}{4}",    soln1dec:"x\\approx-1.62,\\;y\\approx-0.62",soln2dec:"x\\approx0.62,\\;y\\approx1.62",  A:2,  B:2,   C:-2,  r2:3,  isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=3",   x1:(-2-Math.sqrt(20))/4,  y1:(0-Math.sqrt(20))/4,    x2:(-2+Math.sqrt(20))/4,  y2:(0+Math.sqrt(20))/4,    disc:20,  coefType:"none" },
  { eq1:"x^2+y^2=15", eq2:"y=2x+3", expanded:"5x^2+12x-6=0",  surdX:"x=\\frac{-12\\pm\\sqrt{264}}{10}", surdYcombined:"y=\\frac{-6\\pm 2\\sqrt{264}}{10}",soln1dec:"x\\approx-3.23,\\;y\\approx-3.47",soln2dec:"x\\approx0.37,\\;y\\approx3.74",  A:5,  B:12,  C:-6,  r2:15, isolateVar:"y",linM:2, linD:3,  quadSub:"x^2+(2x+3)^2=15", x1:(-12-Math.sqrt(264))/10,y1:(-6-2*Math.sqrt(264))/10,x2:(-12+Math.sqrt(264))/10,y2:(-6+2*Math.sqrt(264))/10,disc:264, coefType:"none" },
  { eq1:"x^2+y^2=20", eq2:"y=x+3",  expanded:"2x^2+6x-11=0",  surdX:"x=\\frac{-6\\pm\\sqrt{124}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{124}}{4}",   soln1dec:"x\\approx-4.28,\\;y\\approx-1.28",soln2dec:"x\\approx1.28,\\;y\\approx4.28",  A:2,  B:6,   C:-11, r2:20, isolateVar:"y",linM:1, linD:3,  quadSub:"x^2+(x+3)^2=20",  x1:(-6-Math.sqrt(124))/4, y1:(0-Math.sqrt(124))/4,   x2:(-6+Math.sqrt(124))/4, y2:(0+Math.sqrt(124))/4,   disc:124, coefType:"none" },
  { eq1:"x^2+y^2=8",  eq2:"y=x+1",  expanded:"2x^2+2x-7=0",   surdX:"x=\\frac{-2\\pm\\sqrt{60}}{4}",    surdYcombined:"y=\\frac{0\\pm\\sqrt{60}}{4}",    soln1dec:"x\\approx-2.44,\\;y\\approx-1.44",soln2dec:"x\\approx1.44,\\;y\\approx2.44",  A:2,  B:2,   C:-7,  r2:8,  isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=8",   x1:(-2-Math.sqrt(60))/4,  y1:(0-Math.sqrt(60))/4,    x2:(-2+Math.sqrt(60))/4,  y2:(0+Math.sqrt(60))/4,    disc:60,  coefType:"none" },
  { eq1:"x^2+y^2=12", eq2:"y=x+2",  expanded:"2x^2+4x-8=0",   surdX:"x=\\frac{-4\\pm\\sqrt{80}}{4}",    surdYcombined:"y=\\frac{-2\\pm\\sqrt{80}}{4}",   soln1dec:"x\\approx-3.24,\\;y\\approx-1.24",soln2dec:"x\\approx1.24,\\;y\\approx3.24",  A:2,  B:4,   C:-8,  r2:12, isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=12",  x1:(-4-Math.sqrt(80))/4,  y1:(-2-Math.sqrt(80))/4,   x2:(-4+Math.sqrt(80))/4,  y2:(-2+Math.sqrt(80))/4,   disc:80,  coefType:"none" },
  { eq1:"x^2+y^2=9",  eq2:"y=2x+1", expanded:"5x^2+4x-8=0",   surdX:"x=\\frac{-4\\pm\\sqrt{176}}{10}",  surdYcombined:"y=\\frac{-6\\pm 2\\sqrt{176}}{10}",soln1dec:"x\\approx-1.73,\\;y\\approx-2.45",soln2dec:"x\\approx0.93,\\;y\\approx2.85",  A:5,  B:4,   C:-8,  r2:9,  isolateVar:"y",linM:2, linD:1,  quadSub:"x^2+(2x+1)^2=9",  x1:(-4-Math.sqrt(176))/10,y1:(-6-2*Math.sqrt(176))/10,x2:(-4+Math.sqrt(176))/10,y2:(-6+2*Math.sqrt(176))/10,disc:176, coefType:"none" },
  { eq1:"x^2+y^2=21", eq2:"y=x+1",  expanded:"2x^2+2x-20=0",  surdX:"x=\\frac{-2\\pm\\sqrt{164}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{164}}{4}",   soln1dec:"x\\approx-3.70,\\;y\\approx-2.70",soln2dec:"x\\approx2.70,\\;y\\approx3.70",  A:2,  B:2,   C:-20, r2:21, isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=21",  x1:(-2-Math.sqrt(164))/4, y1:(0-Math.sqrt(164))/4,   x2:(-2+Math.sqrt(164))/4, y2:(0+Math.sqrt(164))/4,   disc:164, coefType:"none" },
  { eq1:"x^2+y^2=19", eq2:"y=2x-1", expanded:"5x^2-4x-18=0",  surdX:"x=\\frac{4\\pm\\sqrt{376}}{10}",   surdYcombined:"y=\\frac{-6\\pm 2\\sqrt{376}}{10}",soln1dec:"x\\approx-1.74,\\;y\\approx-4.49",soln2dec:"x\\approx2.14,\\;y\\approx3.29",  A:5,  B:-4,  C:-18, r2:19, isolateVar:"y",linM:2, linD:-1, quadSub:"x^2+(2x-1)^2=19", x1:(4-Math.sqrt(376))/10, y1:(-6-2*Math.sqrt(376))/10,x2:(4+Math.sqrt(376))/10, y2:(-6+2*Math.sqrt(376))/10,disc:376, coefType:"none" },
  { eq1:"x^2+y^2=23", eq2:"y=x+3",  expanded:"2x^2+6x-14=0",  surdX:"x=\\frac{-6\\pm\\sqrt{148}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{148}}{4}",   soln1dec:"x\\approx-4.54,\\;y\\approx-1.54",soln2dec:"x\\approx1.54,\\;y\\approx4.54",  A:2,  B:6,   C:-14, r2:23, isolateVar:"y",linM:1, linD:3,  quadSub:"x^2+(x+3)^2=23",  x1:(-6-Math.sqrt(148))/4, y1:(0-Math.sqrt(148))/4,   x2:(-6+Math.sqrt(148))/4, y2:(0+Math.sqrt(148))/4,   disc:148, coefType:"none" },
  { eq1:"x^2+y^2=16", eq2:"y=x+1",  expanded:"2x^2+2x-15=0",  surdX:"x=\\frac{-2\\pm\\sqrt{124}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{124}}{4}",   soln1dec:"x\\approx-3.27,\\;y\\approx-2.27",soln2dec:"x\\approx2.27,\\;y\\approx3.27",  A:2,  B:2,   C:-15, r2:16, isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=16",  x1:(-2-Math.sqrt(124))/4, y1:(0-Math.sqrt(124))/4,   x2:(-2+Math.sqrt(124))/4, y2:(0+Math.sqrt(124))/4,   disc:124, coefType:"none" },
  { eq1:"x^2+y^2=18", eq2:"y=x+2",  expanded:"2x^2+4x-14=0",  surdX:"x=\\frac{-4\\pm\\sqrt{128}}{4}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{128}}{4}",  soln1dec:"x\\approx-3.83,\\;y\\approx-1.83",soln2dec:"x\\approx1.83,\\;y\\approx3.83",  A:2,  B:4,   C:-14, r2:18, isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=18",  x1:(-4-Math.sqrt(128))/4, y1:(-2-Math.sqrt(128))/4,  x2:(-4+Math.sqrt(128))/4, y2:(-2+Math.sqrt(128))/4,  disc:128, coefType:"none" },
  { eq1:"x^2+y^2=22", eq2:"y=x+2",  expanded:"2x^2+4x-18=0",  surdX:"x=\\frac{-4\\pm\\sqrt{160}}{4}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{160}}{4}",  soln1dec:"x\\approx-4.16,\\;y\\approx-2.16",soln2dec:"x\\approx2.16,\\;y\\approx4.16",  A:2,  B:4,   C:-18, r2:22, isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=22",  x1:(-4-Math.sqrt(160))/4, y1:(-2-Math.sqrt(160))/4,  x2:(-4+Math.sqrt(160))/4, y2:(-2+Math.sqrt(160))/4,  disc:160, coefType:"none" },
  { eq1:"x^2+y^2=24", eq2:"y=x+1",  expanded:"2x^2+2x-23=0",  surdX:"x=\\frac{-2\\pm\\sqrt{188}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{188}}{4}",   soln1dec:"x\\approx-3.92,\\;y\\approx-2.92",soln2dec:"x\\approx2.92,\\;y\\approx3.92",  A:2,  B:2,   C:-23, r2:24, isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=24",  x1:(-2-Math.sqrt(188))/4, y1:(0-Math.sqrt(188))/4,   x2:(-2+Math.sqrt(188))/4, y2:(0+Math.sqrt(188))/4,   disc:188, coefType:"none" },
  { eq1:"x^2+y^2=27", eq2:"y=x+1",  expanded:"2x^2+2x-26=0",  surdX:"x=\\frac{-2\\pm\\sqrt{212}}{4}",   surdYcombined:"y=\\frac{0\\pm\\sqrt{212}}{4}",   soln1dec:"x\\approx-4.14,\\;y\\approx-3.14",soln2dec:"x\\approx3.14,\\;y\\approx4.14",  A:2,  B:2,   C:-26, r2:27, isolateVar:"y",linM:1, linD:1,  quadSub:"x^2+(x+1)^2=27",  x1:(-2-Math.sqrt(212))/4, y1:(0-Math.sqrt(212))/4,   x2:(-2+Math.sqrt(212))/4, y2:(0+Math.sqrt(212))/4,   disc:212, coefType:"none" },
  { eq1:"x^2+y^2=31", eq2:"y=x+2",  expanded:"2x^2+4x-27=0",  surdX:"x=\\frac{-4\\pm\\sqrt{232}}{4}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{232}}{4}",  soln1dec:"x\\approx-4.81,\\;y\\approx-2.81",soln2dec:"x\\approx2.81,\\;y\\approx4.81",  A:2,  B:4,   C:-27, r2:31, isolateVar:"y",linM:1, linD:2,  quadSub:"x^2+(x+2)^2=31",  x1:(-4-Math.sqrt(232))/4, y1:(-2-Math.sqrt(232))/4,  x2:(-4+Math.sqrt(232))/4, y2:(-2+Math.sqrt(232))/4,  disc:232, coefType:"none" },
  // ── one (ellipse, one coef) ─────────────────────────────────────────
  { eq1:"2x^2+y^2=10", eq2:"y=x+1",  expanded:"3x^2+2x-9=0",  surdX:"x=\\frac{-2\\pm\\sqrt{112}}{6}",   surdYcombined:"y=\\frac{-1\\pm\\sqrt{112}}{6}",  soln1dec:"x\\approx-2.10,\\;y\\approx-1.10",soln2dec:"x\\approx1.43,\\;y\\approx2.43",  A:3,  B:2,   C:-9,  r2:10, isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+(x+1)^2=10", x1:(-2-Math.sqrt(112))/6, y1:(-1-Math.sqrt(112))/6,  x2:(-2+Math.sqrt(112))/6, y2:(-1+Math.sqrt(112))/6,  disc:112, coefType:"one" },
  { eq1:"x^2+2y^2=10", eq2:"x=y+1",  expanded:"3y^2+2y-9=0",  surdX:"y=\\frac{-2\\pm\\sqrt{112}}{6}",   surdYcombined:"x=\\frac{-1\\pm\\sqrt{112}}{6}",  soln1dec:"x\\approx-1.10,\\;y\\approx-2.10",soln2dec:"x\\approx2.43,\\;y\\approx1.43",  A:3,  B:2,   C:-9,  r2:10, isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+2y^2=10", x1:(-1-Math.sqrt(112))/6, y1:(-2-Math.sqrt(112))/6,  x2:(-1+Math.sqrt(112))/6, y2:(-2+Math.sqrt(112))/6,  disc:112, coefType:"one" },
  { eq1:"3x^2+y^2=11", eq2:"y=x+2",  expanded:"4x^2+4x-7=0",  surdX:"x=\\frac{-4\\pm\\sqrt{128}}{8}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{128}}{8}",  soln1dec:"x\\approx-2.41,\\;y\\approx-0.41",soln2dec:"x\\approx0.91,\\;y\\approx2.91",  A:4,  B:4,   C:-7,  r2:11, isolateVar:"y",linM:1, linD:2,  quadSub:"3x^2+(x+2)^2=11", x1:(-4-Math.sqrt(128))/8, y1:(-2-Math.sqrt(128))/8,  x2:(-4+Math.sqrt(128))/8, y2:(-2+Math.sqrt(128))/8,  disc:128, coefType:"one" },
  { eq1:"x^2+3y^2=11", eq2:"x=y+2",  expanded:"4y^2+4y-7=0",  surdX:"y=\\frac{-4\\pm\\sqrt{128}}{8}",   surdYcombined:"x=\\frac{-2\\pm\\sqrt{128}}{8}",  soln1dec:"x\\approx-0.41,\\;y\\approx-2.41",soln2dec:"x\\approx2.91,\\;y\\approx0.91",  A:4,  B:4,   C:-7,  r2:11, isolateVar:"x",linM:1, linD:2,  quadSub:"(y+2)^2+3y^2=11", x1:(-2-Math.sqrt(128))/8, y1:(-4-Math.sqrt(128))/8,  x2:(-2+Math.sqrt(128))/8, y2:(-4+Math.sqrt(128))/8,  disc:128, coefType:"one" },
  { eq1:"2x^2+y^2=14", eq2:"y=x+2",  expanded:"3x^2+4x-10=0", surdX:"x=\\frac{-4\\pm\\sqrt{136}}{6}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{136}}{6}",  soln1dec:"x\\approx-2.62,\\;y\\approx-0.62",soln2dec:"x\\approx1.28,\\;y\\approx3.28",  A:3,  B:4,   C:-10, r2:14, isolateVar:"y",linM:1, linD:2,  quadSub:"2x^2+(x+2)^2=14", x1:(-4-Math.sqrt(136))/6, y1:(-2-Math.sqrt(136))/6,  x2:(-4+Math.sqrt(136))/6, y2:(-2+Math.sqrt(136))/6,  disc:136, coefType:"one" },
  { eq1:"x^2+2y^2=14", eq2:"x=y+2",  expanded:"3y^2+4y-10=0", surdX:"y=\\frac{-4\\pm\\sqrt{136}}{6}",   surdYcombined:"x=\\frac{-2\\pm\\sqrt{136}}{6}",  soln1dec:"x\\approx-0.62,\\;y\\approx-2.62",soln2dec:"x\\approx3.28,\\;y\\approx1.28",  A:3,  B:4,   C:-10, r2:14, isolateVar:"x",linM:1, linD:2,  quadSub:"(y+2)^2+2y^2=14", x1:(-2-Math.sqrt(136))/6, y1:(-4-Math.sqrt(136))/6,  x2:(-2+Math.sqrt(136))/6, y2:(-4+Math.sqrt(136))/6,  disc:136, coefType:"one" },
  { eq1:"4x^2+y^2=20", eq2:"y=x+1",  expanded:"5x^2+2x-19=0", surdX:"x=\\frac{-2\\pm\\sqrt{384}}{10}",  surdYcombined:"y=\\frac{-1\\pm\\sqrt{384}}{10}",  soln1dec:"x\\approx-2.16,\\;y\\approx-1.16",soln2dec:"x\\approx1.76,\\;y\\approx2.76",  A:5,  B:2,   C:-19, r2:20, isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+(x+1)^2=20", x1:(-2-Math.sqrt(384))/10,y1:(-1-Math.sqrt(384))/10,  x2:(-2+Math.sqrt(384))/10,y2:(-1+Math.sqrt(384))/10,  disc:384, coefType:"one" },
  { eq1:"x^2+4y^2=20", eq2:"x=y+1",  expanded:"5y^2+2y-19=0", surdX:"y=\\frac{-2\\pm\\sqrt{384}}{10}",  surdYcombined:"x=\\frac{-1\\pm\\sqrt{384}}{10}",  soln1dec:"x\\approx-1.16,\\;y\\approx-2.16",soln2dec:"x\\approx2.76,\\;y\\approx1.76",  A:5,  B:2,   C:-19, r2:20, isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+4y^2=20", x1:(-1-Math.sqrt(384))/10,y1:(-2-Math.sqrt(384))/10,  x2:(-1+Math.sqrt(384))/10,y2:(-2+Math.sqrt(384))/10,  disc:384, coefType:"one" },
  { eq1:"2x^2+y^2=7",  eq2:"y=x+1",  expanded:"3x^2+2x-6=0",  surdX:"x=\\frac{-2\\pm\\sqrt{76}}{6}",    surdYcombined:"y=\\frac{-1\\pm\\sqrt{76}}{6}",   soln1dec:"x\\approx-1.79,\\;y\\approx-0.79",soln2dec:"x\\approx1.12,\\;y\\approx2.12",  A:3,  B:2,   C:-6,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+(x+1)^2=7",  x1:(-2-Math.sqrt(76))/6,  y1:(-1-Math.sqrt(76))/6,   x2:(-2+Math.sqrt(76))/6,  y2:(-1+Math.sqrt(76))/6,   disc:76,  coefType:"one" },
  { eq1:"x^2+2y^2=7",  eq2:"x=y+1",  expanded:"3y^2+2y-6=0",  surdX:"y=\\frac{-2\\pm\\sqrt{76}}{6}",    surdYcombined:"x=\\frac{-1\\pm\\sqrt{76}}{6}",   soln1dec:"x\\approx-0.79,\\;y\\approx-1.79",soln2dec:"x\\approx2.12,\\;y\\approx1.12",  A:3,  B:2,   C:-6,  r2:7,  isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+2y^2=7",  x1:(-1-Math.sqrt(76))/6,  y1:(-2-Math.sqrt(76))/6,   x2:(-1+Math.sqrt(76))/6,  y2:(-2+Math.sqrt(76))/6,   disc:76,  coefType:"one" },
  { eq1:"3x^2+y^2=13", eq2:"y=x+1",  expanded:"4x^2+2x-12=0", surdX:"x=\\frac{-2\\pm\\sqrt{196}}{8}",   surdYcombined:"y=\\frac{-1\\pm\\sqrt{196}}{8}",  soln1dec:"x\\approx-1.88,\\;y\\approx-0.88",soln2dec:"x\\approx1.63,\\;y\\approx2.63",  A:4,  B:2,   C:-12, r2:13, isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+(x+1)^2=13", x1:(-2-Math.sqrt(196))/8, y1:(-1-Math.sqrt(196))/8,  x2:(-2+Math.sqrt(196))/8, y2:(-1+Math.sqrt(196))/8,  disc:196, coefType:"one" },
  { eq1:"x^2+3y^2=13", eq2:"x=y+1",  expanded:"4y^2+2y-12=0", surdX:"y=\\frac{-2\\pm\\sqrt{196}}{8}",   surdYcombined:"x=\\frac{-1\\pm\\sqrt{196}}{8}",  soln1dec:"x\\approx-0.88,\\;y\\approx-1.88",soln2dec:"x\\approx2.63,\\;y\\approx1.63",  A:4,  B:2,   C:-12, r2:13, isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+3y^2=13", x1:(-1-Math.sqrt(196))/8, y1:(-2-Math.sqrt(196))/8,  x2:(-1+Math.sqrt(196))/8, y2:(-2+Math.sqrt(196))/8,  disc:196, coefType:"one" },
  { eq1:"5x^2+y^2=11", eq2:"y=x+1",  expanded:"6x^2+2x-10=0", surdX:"x=\\frac{-2\\pm\\sqrt{244}}{12}",  surdYcombined:"y=\\frac{-1\\pm\\sqrt{244}}{12}",  soln1dec:"x\\approx-1.47,\\;y\\approx-0.47",soln2dec:"x\\approx1.13,\\;y\\approx2.13",  A:6,  B:2,   C:-10, r2:11, isolateVar:"y",linM:1, linD:1,  quadSub:"5x^2+(x+1)^2=11", x1:(-2-Math.sqrt(244))/12,y1:(-1-Math.sqrt(244))/12,  x2:(-2+Math.sqrt(244))/12,y2:(-1+Math.sqrt(244))/12,  disc:244, coefType:"one" },
  { eq1:"x^2+5y^2=11", eq2:"x=y+1",  expanded:"6y^2+2y-10=0", surdX:"y=\\frac{-2\\pm\\sqrt{244}}{12}",  surdYcombined:"x=\\frac{-1\\pm\\sqrt{244}}{12}",  soln1dec:"x\\approx-0.47,\\;y\\approx-1.47",soln2dec:"x\\approx2.13,\\;y\\approx1.13",  A:6,  B:2,   C:-10, r2:11, isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+5y^2=11", x1:(-1-Math.sqrt(244))/12,y1:(-2-Math.sqrt(244))/12,  x2:(-1+Math.sqrt(244))/12,y2:(-2+Math.sqrt(244))/12,  disc:244, coefType:"one" },
  { eq1:"2x^2+y^2=17", eq2:"y=x+2",  expanded:"3x^2+4x-13=0", surdX:"x=\\frac{-4\\pm\\sqrt{172}}{6}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{172}}{6}",  soln1dec:"x\\approx-2.86,\\;y\\approx-0.86",soln2dec:"x\\approx1.52,\\;y\\approx3.52",  A:3,  B:4,   C:-13, r2:17, isolateVar:"y",linM:1, linD:2,  quadSub:"2x^2+(x+2)^2=17", x1:(-4-Math.sqrt(172))/6, y1:(-2-Math.sqrt(172))/6,  x2:(-4+Math.sqrt(172))/6, y2:(-2+Math.sqrt(172))/6,  disc:172, coefType:"one" },
  { eq1:"x^2+2y^2=17", eq2:"x=y+2",  expanded:"3y^2+4y-13=0", surdX:"y=\\frac{-4\\pm\\sqrt{172}}{6}",   surdYcombined:"x=\\frac{-2\\pm\\sqrt{172}}{6}",  soln1dec:"x\\approx-0.86,\\;y\\approx-2.86",soln2dec:"x\\approx3.52,\\;y\\approx1.52",  A:3,  B:4,   C:-13, r2:17, isolateVar:"x",linM:1, linD:2,  quadSub:"(y+2)^2+2y^2=17", x1:(-2-Math.sqrt(172))/6, y1:(-4-Math.sqrt(172))/6,  x2:(-2+Math.sqrt(172))/6, y2:(-4+Math.sqrt(172))/6,  disc:172, coefType:"one" },
  { eq1:"4x^2+y^2=9",  eq2:"y=x+1",  expanded:"5x^2+2x-8=0",  surdX:"x=\\frac{-2\\pm\\sqrt{164}}{10}",  surdYcombined:"y=\\frac{-1\\pm\\sqrt{164}}{10}",  soln1dec:"x\\approx-1.48,\\;y\\approx-0.48",soln2dec:"x\\approx1.08,\\;y\\approx2.08",  A:5,  B:2,   C:-8,  r2:9,  isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+(x+1)^2=9",  x1:(-2-Math.sqrt(164))/10,y1:(-1-Math.sqrt(164))/10,  x2:(-2+Math.sqrt(164))/10,y2:(-1+Math.sqrt(164))/10,  disc:164, coefType:"one" },
  { eq1:"x^2+4y^2=9",  eq2:"x=y+1",  expanded:"5y^2+2y-8=0",  surdX:"y=\\frac{-2\\pm\\sqrt{164}}{10}",  surdYcombined:"x=\\frac{-1\\pm\\sqrt{164}}{10}",  soln1dec:"x\\approx-0.48,\\;y\\approx-1.48",soln2dec:"x\\approx2.08,\\;y\\approx1.08",  A:5,  B:2,   C:-8,  r2:9,  isolateVar:"x",linM:1, linD:1,  quadSub:"(y+1)^2+4y^2=9",  x1:(-1-Math.sqrt(164))/10,y1:(-2-Math.sqrt(164))/10,  x2:(-1+Math.sqrt(164))/10,y2:(-2+Math.sqrt(164))/10,  disc:164, coefType:"one" },
  { eq1:"3x^2+y^2=16", eq2:"y=x+2",  expanded:"4x^2+4x-12=0", surdX:"x=\\frac{-4\\pm\\sqrt{208}}{8}",   surdYcombined:"y=\\frac{-2\\pm\\sqrt{208}}{8}",  soln1dec:"x\\approx-2.30,\\;y\\approx-0.30",soln2dec:"x\\approx1.30,\\;y\\approx3.30",  A:4,  B:4,   C:-12, r2:16, isolateVar:"y",linM:1, linD:2,  quadSub:"3x^2+(x+2)^2=16", x1:(-4-Math.sqrt(208))/8, y1:(-2-Math.sqrt(208))/8,  x2:(-4+Math.sqrt(208))/8, y2:(-2+Math.sqrt(208))/8,  disc:208, coefType:"one" },
  // ── both (ellipse, both coefs > 1) ─────────────────────────────────
  { eq1:"2x^2+3y^2=13", eq2:"y=x+1",  expanded:"5x^2+6x-10=0", surdX:"x=\\frac{-6\\pm\\sqrt{236}}{10}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{236}}{10}", soln1dec:"x\\approx-2.14,\\;y\\approx-1.14",soln2dec:"x\\approx0.94,\\;y\\approx1.94",  A:5,  B:6,   C:-10, r2:13, isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+3(x+1)^2=13", x1:(-6-Math.sqrt(236))/10,y1:(-4-Math.sqrt(236))/10,  x2:(-6+Math.sqrt(236))/10,y2:(-4+Math.sqrt(236))/10,  disc:236, coefType:"both" },
  { eq1:"3x^2+2y^2=13", eq2:"y=x+1",  expanded:"5x^2+4x-11=0", surdX:"x=\\frac{-4\\pm\\sqrt{236}}{10}",  surdYcombined:"y=\\frac{-3\\pm\\sqrt{236}}{10}", soln1dec:"x\\approx-1.94,\\;y\\approx-0.94",soln2dec:"x\\approx1.14,\\;y\\approx2.14",  A:5,  B:4,   C:-11, r2:13, isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+2(x+1)^2=13", x1:(-4-Math.sqrt(236))/10,y1:(-3-Math.sqrt(236))/10,  x2:(-4+Math.sqrt(236))/10,y2:(-3+Math.sqrt(236))/10,  disc:236, coefType:"both" },
  { eq1:"4x^2+3y^2=7",  eq2:"y=x+1",  expanded:"7x^2+6x-4=0",  surdX:"x=\\frac{-6\\pm\\sqrt{148}}{14}",  surdYcombined:"y=\\frac{-2\\pm\\sqrt{148}}{14}", soln1dec:"x\\approx-1.29,\\;y\\approx-0.29",soln2dec:"x\\approx0.44,\\;y\\approx1.44",  A:7,  B:6,   C:-4,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+3(x+1)^2=7",  x1:(-6-Math.sqrt(148))/14,y1:(-2-Math.sqrt(148))/14,  x2:(-6+Math.sqrt(148))/14,y2:(-2+Math.sqrt(148))/14,  disc:148, coefType:"both" },
  { eq1:"3x^2+4y^2=7",  eq2:"y=x+1",  expanded:"7x^2+8x-3=0",  surdX:"x=\\frac{-8\\pm\\sqrt{148}}{14}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{148}}{14}", soln1dec:"x\\approx-1.44,\\;y\\approx-0.44",soln2dec:"x\\approx0.29,\\;y\\approx1.29",  A:7,  B:8,   C:-3,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+4(x+1)^2=7",  x1:(-8-Math.sqrt(148))/14,y1:(-4-Math.sqrt(148))/14,  x2:(-8+Math.sqrt(148))/14,y2:(-4+Math.sqrt(148))/14,  disc:148, coefType:"both" },
  { eq1:"2x^2+3y^2=5",  eq2:"y=x+1",  expanded:"5x^2+6x-2=0",  surdX:"x=\\frac{-6\\pm\\sqrt{76}}{10}",   surdYcombined:"y=\\frac{-4\\pm\\sqrt{76}}{10}",  soln1dec:"x\\approx-1.47,\\;y\\approx-0.47",soln2dec:"x\\approx0.27,\\;y\\approx1.27",  A:5,  B:6,   C:-2,  r2:5,  isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+3(x+1)^2=5",  x1:(-6-Math.sqrt(76))/10, y1:(-4-Math.sqrt(76))/10,  x2:(-6+Math.sqrt(76))/10, y2:(-4+Math.sqrt(76))/10,  disc:76,  coefType:"both" },
  { eq1:"3x^2+2y^2=5",  eq2:"y=x+1",  expanded:"5x^2+4x-3=0",  surdX:"x=\\frac{-4\\pm\\sqrt{76}}{10}",   surdYcombined:"y=\\frac{-3\\pm\\sqrt{76}}{10}",  soln1dec:"x\\approx-1.27,\\;y\\approx-0.27",soln2dec:"x\\approx0.47,\\;y\\approx1.47",  A:5,  B:4,   C:-3,  r2:5,  isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+2(x+1)^2=5",  x1:(-4-Math.sqrt(76))/10, y1:(-3-Math.sqrt(76))/10,  x2:(-4+Math.sqrt(76))/10, y2:(-3+Math.sqrt(76))/10,  disc:76,  coefType:"both" },
  { eq1:"4x^2+9y^2=13", eq2:"y=x+1",  expanded:"13x^2+18x-4=0",surdX:"x=\\frac{-18\\pm\\sqrt{532}}{26}", surdYcombined:"y=\\frac{-4\\pm\\sqrt{532}}{26}",  soln1dec:"x\\approx-1.53,\\;y\\approx-0.53",soln2dec:"x\\approx0.15,\\;y\\approx1.15",  A:13, B:18,  C:-4,  r2:13, isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+9(x+1)^2=13", x1:(-18-Math.sqrt(532))/26,y1:(-4-Math.sqrt(532))/26, x2:(-18+Math.sqrt(532))/26,y2:(-4+Math.sqrt(532))/26, disc:532, coefType:"both" },
  { eq1:"9x^2+4y^2=13", eq2:"y=x+1",  expanded:"13x^2+8x-9=0", surdX:"x=\\frac{-8\\pm\\sqrt{532}}{26}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{532}}{26}",  soln1dec:"x\\approx-1.15,\\;y\\approx-0.15",soln2dec:"x\\approx0.53,\\;y\\approx1.53",  A:13, B:8,   C:-9,  r2:13, isolateVar:"y",linM:1, linD:1,  quadSub:"9x^2+4(x+1)^2=13", x1:(-8-Math.sqrt(532))/26, y1:(-4-Math.sqrt(532))/26, x2:(-8+Math.sqrt(532))/26, y2:(-4+Math.sqrt(532))/26, disc:532, coefType:"both" },
  { eq1:"4x^2+9y^2=25", eq2:"y=x+1",  expanded:"13x^2+18x-16=0",surdX:"x=\\frac{-18\\pm\\sqrt{1156}}{26}",surdYcombined:"y=\\frac{-4\\pm\\sqrt{1156}}{26}",soln1dec:"x\\approx-2.00,\\;y\\approx-1.00",soln2dec:"x\\approx0.62,\\;y\\approx1.62",  A:13, B:18,  C:-16, r2:25, isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+9(x+1)^2=25", x1:(-18-Math.sqrt(1156))/26,y1:(-4-Math.sqrt(1156))/26,x2:(-18+Math.sqrt(1156))/26,y2:(-4+Math.sqrt(1156))/26,disc:1156,coefType:"both" },
  { eq1:"9x^2+4y^2=25", eq2:"y=x+1",  expanded:"13x^2+8x-21=0",surdX:"x=\\frac{-8\\pm\\sqrt{1156}}{26}", surdYcombined:"y=\\frac{-4\\pm\\sqrt{1156}}{26}", soln1dec:"x\\approx-1.62,\\;y\\approx-0.62",soln2dec:"x\\approx1.00,\\;y\\approx2.00",  A:13, B:8,   C:-21, r2:25, isolateVar:"y",linM:1, linD:1,  quadSub:"9x^2+4(x+1)^2=25", x1:(-8-Math.sqrt(1156))/26, y1:(-4-Math.sqrt(1156))/26,x2:(-8+Math.sqrt(1156))/26, y2:(-4+Math.sqrt(1156))/26,disc:1156,coefType:"both" },
  { eq1:"2x^2+5y^2=7",  eq2:"y=x+1",  expanded:"7x^2+10x-2=0", surdX:"x=\\frac{-10\\pm\\sqrt{156}}{14}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{156}}{14}", soln1dec:"x\\approx-1.57,\\;y\\approx-0.57",soln2dec:"x\\approx0.14,\\;y\\approx1.14",  A:7,  B:10,  C:-2,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+5(x+1)^2=7",  x1:(-10-Math.sqrt(156))/14,y1:(-4-Math.sqrt(156))/14,  x2:(-10+Math.sqrt(156))/14,y2:(-4+Math.sqrt(156))/14,  disc:156, coefType:"both" },
  { eq1:"5x^2+2y^2=7",  eq2:"y=x+1",  expanded:"7x^2+4x-5=0",  surdX:"x=\\frac{-4\\pm\\sqrt{156}}{14}",  surdYcombined:"y=\\frac{-3\\pm\\sqrt{156}}{14}", soln1dec:"x\\approx-1.14,\\;y\\approx-0.14",soln2dec:"x\\approx0.57,\\;y\\approx1.57",  A:7,  B:4,   C:-5,  r2:7,  isolateVar:"y",linM:1, linD:1,  quadSub:"5x^2+2(x+1)^2=7",  x1:(-4-Math.sqrt(156))/14, y1:(-3-Math.sqrt(156))/14,  x2:(-4+Math.sqrt(156))/14, y2:(-3+Math.sqrt(156))/14,  disc:156, coefType:"both" },
  { eq1:"2x^2+3y^2=11", eq2:"y=x+1",  expanded:"5x^2+6x-8=0",  surdX:"x=\\frac{-6\\pm\\sqrt{196}}{10}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{196}}{10}", soln1dec:"x\\approx-2.00,\\;y\\approx-1.00",soln2dec:"x\\approx0.80,\\;y\\approx1.80",  A:5,  B:6,   C:-8,  r2:11, isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+3(x+1)^2=11", x1:(-6-Math.sqrt(196))/10,y1:(-4-Math.sqrt(196))/10,  x2:(-6+Math.sqrt(196))/10,y2:(-4+Math.sqrt(196))/10,  disc:196, coefType:"both" },
  { eq1:"3x^2+2y^2=11", eq2:"y=x+1",  expanded:"5x^2+4x-9=0",  surdX:"x=\\frac{-4\\pm\\sqrt{196}}{10}",  surdYcombined:"y=\\frac{-3\\pm\\sqrt{196}}{10}", soln1dec:"x\\approx-1.80,\\;y\\approx-0.80",soln2dec:"x\\approx1.00,\\;y\\approx2.00",  A:5,  B:4,   C:-9,  r2:11, isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+2(x+1)^2=11", x1:(-4-Math.sqrt(196))/10,y1:(-3-Math.sqrt(196))/10,  x2:(-4+Math.sqrt(196))/10,y2:(-3+Math.sqrt(196))/10,  disc:196, coefType:"both" },
  { eq1:"4x^2+3y^2=19", eq2:"y=x+1",  expanded:"7x^2+6x-16=0", surdX:"x=\\frac{-6\\pm\\sqrt{484}}{14}",  surdYcombined:"y=\\frac{-2\\pm\\sqrt{484}}{14}", soln1dec:"x\\approx-2.14,\\;y\\approx-1.14",soln2dec:"x\\approx1.00,\\;y\\approx2.00",  A:7,  B:6,   C:-16, r2:19, isolateVar:"y",linM:1, linD:1,  quadSub:"4x^2+3(x+1)^2=19", x1:(-6-Math.sqrt(484))/14,y1:(-2-Math.sqrt(484))/14,  x2:(-6+Math.sqrt(484))/14,y2:(-2+Math.sqrt(484))/14,  disc:484, coefType:"both" },
  { eq1:"3x^2+4y^2=19", eq2:"y=x+1",  expanded:"7x^2+8x-15=0", surdX:"x=\\frac{-8\\pm\\sqrt{484}}{14}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{484}}{14}", soln1dec:"x\\approx-2.14,\\;y\\approx-1.14",soln2dec:"x\\approx1.00,\\;y\\approx2.00",  A:7,  B:8,   C:-15, r2:19, isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+4(x+1)^2=19", x1:(-8-Math.sqrt(484))/14,y1:(-4-Math.sqrt(484))/14,  x2:(-8+Math.sqrt(484))/14,y2:(-4+Math.sqrt(484))/14,  disc:484, coefType:"both" },
  { eq1:"2x^2+5y^2=14", eq2:"y=x+1",  expanded:"7x^2+10x-9=0", surdX:"x=\\frac{-10\\pm\\sqrt{352}}{14}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{352}}{14}", soln1dec:"x\\approx-2.13,\\;y\\approx-1.13",soln2dec:"x\\approx0.71,\\;y\\approx1.71",  A:7,  B:10,  C:-9,  r2:14, isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+5(x+1)^2=14", x1:(-10-Math.sqrt(352))/14,y1:(-4-Math.sqrt(352))/14,  x2:(-10+Math.sqrt(352))/14,y2:(-4+Math.sqrt(352))/14,  disc:352, coefType:"both" },
  { eq1:"5x^2+2y^2=14", eq2:"y=x+1",  expanded:"7x^2+4x-12=0", surdX:"x=\\frac{-4\\pm\\sqrt{352}}{14}",  surdYcombined:"y=\\frac{-3\\pm\\sqrt{352}}{14}", soln1dec:"x\\approx-1.56,\\;y\\approx-0.56",soln2dec:"x\\approx1.13,\\;y\\approx2.13",  A:7,  B:4,   C:-12, r2:14, isolateVar:"y",linM:1, linD:1,  quadSub:"5x^2+2(x+1)^2=14", x1:(-4-Math.sqrt(352))/14, y1:(-3-Math.sqrt(352))/14,  x2:(-4+Math.sqrt(352))/14, y2:(-3+Math.sqrt(352))/14,  disc:352, coefType:"both" },
  { eq1:"2x^2+3y^2=19", eq2:"y=x+1",  expanded:"5x^2+6x-16=0", surdX:"x=\\frac{-6\\pm\\sqrt{356}}{10}",  surdYcombined:"y=\\frac{-4\\pm\\sqrt{356}}{10}", soln1dec:"x\\approx-2.49,\\;y\\approx-1.49",soln2dec:"x\\approx1.29,\\;y\\approx2.29",  A:5,  B:6,   C:-16, r2:19, isolateVar:"y",linM:1, linD:1,  quadSub:"2x^2+3(x+1)^2=19", x1:(-6-Math.sqrt(356))/10,y1:(-4-Math.sqrt(356))/10,  x2:(-6+Math.sqrt(356))/10,y2:(-4+Math.sqrt(356))/10,  disc:356, coefType:"both" },
  { eq1:"3x^2+2y^2=19", eq2:"y=x+1",  expanded:"5x^2+4x-17=0", surdX:"x=\\frac{-4\\pm\\sqrt{356}}{10}",  surdYcombined:"y=\\frac{-3\\pm\\sqrt{356}}{10}", soln1dec:"x\\approx-2.29,\\;y\\approx-1.29",soln2dec:"x\\approx1.49,\\;y\\approx2.49",  A:5,  B:4,   C:-17, r2:19, isolateVar:"y",linM:1, linD:1,  quadSub:"3x^2+2(x+1)^2=19", x1:(-4-Math.sqrt(356))/10,y1:(-3-Math.sqrt(356))/10,  x2:(-4+Math.sqrt(356))/10,y2:(-3+Math.sqrt(356))/10,  disc:356, coefType:"both" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// BANK FILTER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const coefTypesFromAllowA = (allowA: number): ("none"|"one"|"both")[] => {
  const types: ("none"|"one"|"both")[] = [];
  if (allowA & 1) types.push("none");
  if (allowA & 2) types.push("one");
  if (allowA & 4) types.push("both");
  return types.length > 0 ? types : ["none"];
};

const filteredFacPool = (allowA: number) => {
  const allowed = coefTypesFromAllowA(allowA);
  const pool = FAC_BANK.map((entry, idx) => ({ entry, idx })).filter(({ entry }) => allowed.includes(entry.coefType));
  return pool.length > 0 ? pool : FAC_BANK.map((entry, idx) => ({ entry, idx }));
};

const filteredFormPool = (allowA: number) => {
  const allowed = coefTypesFromAllowA(allowA);
  const pool = FORM_BANK.map((entry, idx) => ({ entry, idx })).filter(({ entry }) => allowed.includes(entry.coefType));
  return pool.length > 0 ? pool : FORM_BANK.map((entry, idx) => ({ entry, idx }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// BANK → QUESTION CONVERTERS
// ═══════════════════════════════════════════════════════════════════════════════
const bankToFacQuestion = (e: BankEntry, idx: number): NonLinearQuestion => ({
  kind:"nonlinear", subTool:"factorising",
  eq1Display:e.eq1, eq2Display:e.eq2,
  isolateVar:e.isolateVar, isolatedExpr:"",
  linM:e.linM, linD:e.linD,
  needsRearrange:false, rearrangedLatex:e.eq2,
  quadLatex:e.quadSub, expandedLatex:e.expanded,
  factorisedLatex:e.factorised,
  surdX1:e.soln1, surdX2:e.soln2,
  solutions:[{x:e.x1,y:e.y1},{x:e.x2,y:e.y2}],
  isDoubleRoot:Math.abs(e.x1-e.x2)<0.001&&Math.abs(e.y1-e.y2)<0.001,
  A:e.A, B:e.B, C:e.C, isCircle:true, r2:e.r2,
  level:"level3", key:`bank-fac-${idx}`, difficulty:"level3", working:[]
});

const bankToFormQuestion = (e: FormBankEntry, idx: number): NonLinearQuestion => ({
  kind:"nonlinear", subTool:"formula",
  eq1Display:e.eq1, eq2Display:e.eq2,
  isolateVar:e.isolateVar, isolatedExpr:"",
  linM:e.linM, linD:e.linD,
  needsRearrange:false, rearrangedLatex:e.eq2,
  quadLatex:e.quadSub, expandedLatex:e.expanded,
  surdLatex:e.surdX,
  surdX1:e.surdX, surdX2:e.surdX,
  surdYCombined:e.surdYcombined,
  decimalLatex:`${e.soln1dec}\\text{ or }${e.soln2dec}`,
  solutions:[{x:e.x1,y:e.y1},{x:e.x2,y:e.y2}],
  isDoubleRoot:false,
  A:e.A, B:e.B, C:e.C, isCircle:true, r2:e.r2,
  level:"level3", key:`bank-form-${idx}`, difficulty:"level3", working:[]
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE GENERATORS — share a used set, draw from filtered bank
// ═══════════════════════════════════════════════════════════════════════════════
const pickUniqueBankFac = (allowA: number, used: Set<string>): NonLinearQuestion => {
  const pool = filteredFacPool(allowA);
  let avail = pool.filter(({idx}) => !used.has(`bank-fac-${idx}`));
  if (avail.length === 0) {
    pool.forEach(({idx}) => used.delete(`bank-fac-${idx}`));
    avail = pool;
  }
  const {entry, idx} = pick(avail);
  used.add(`bank-fac-${idx}`);
  return bankToFacQuestion(entry, idx);
};

const pickUniqueBankForm = (allowA: number, used: Set<string>): NonLinearQuestion => {
  const pool = filteredFormPool(allowA);
  let avail = pool.filter(({idx}) => !used.has(`bank-form-${idx}`));
  if (avail.length === 0) {
    pool.forEach(({idx}) => used.delete(`bank-form-${idx}`));
    avail = pool;
  }
  const {entry, idx} = pick(avail);
  used.add(`bank-form-${idx}`);
  return bankToFormQuestion(entry, idx);
};

const generateParabolaUnique = (subTool: "factorising"|"formula", level: DifficultyLevel, allowA: AllowAMode, sD: SurdDisplay, used: Set<string>): NonLinearQuestion => {
  let q: NonLinearQuestion, a=0;
  do { q=generateParabola(subTool,level,allowA,sD,false); a++; } while(used.has(q.key) && a<100);
  used.add(q.key); return q;
};

const genUniqueLinear = (level: DifficultyLevel, negMode: NegMode, aZ: boolean, aNE: boolean, used: Set<string>): LinearQuestion => {
  let q: LinearQuestion, a=0;
  do { q=generateLinear(level,negMode,aZ,aNE); a++; } while(used.has(q.key) && a<100);
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
  if (q.isCircle && q.surdX1 && q.surdX2) {
    if (q.subTool==="factorising") return (
      <div className="flex flex-col gap-1 items-center">
        <div><MathRenderer latex={q.surdX1}/></div>
        {q.surdX1!==q.surdX2&&<div><MathRenderer latex={q.surdX2}/></div>}
      </div>
    );
    // formula: surdX1 holds the x surd, surdYCombined holds the y surd
    return (
      <div className="flex flex-col gap-1 items-center">
        {(surdDisplay==="surd"||surdDisplay==="both")&&(
          <><div><MathRenderer latex={q.surdX1}/></div>
          {q.surdYCombined&&<div><MathRenderer latex={q.surdYCombined}/></div>}</>
        )}
        {(surdDisplay==="decimal"||surdDisplay==="both")&&q.decimalLatex&&(
          <div><MathRenderer latex={q.decimalLatex}/></div>
        )}
      </div>
    );
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
  let n=1;
  return (
    <div className="space-y-4 mt-6">
      <Card title={`Step ${n++} — Label the equations`} stepBg={stepBg} fsz={fsz}><EqPairDisplay eqs={[q.eq1Display,q.eq2Display]} cls={fsz}/></Card>
      {q.needsRearrange&&<Card title={`Step ${n++} — Rearrange equation (2)`} stepBg={stepBg} fsz={fsz}><ML latex={q.eq2Display} label="(2)"/><ML latex={q.rearrangedLatex} label="⟹"/></Card>}
      <Card title={`Step ${n++} — Substitute into equation (1)`} stepBg={stepBg} fsz={fsz}><ML latex={q.quadLatex}/></Card>
      <Card title={`Step ${n++} — Expand and rearrange to = 0`} stepBg={stepBg} fsz={fsz}><ML latex={q.expandedLatex}/></Card>
      {q.subTool==="factorising"
        ?<>
          <Card title={`Step ${n++} — Factorise`} stepBg={stepBg} fsz={fsz}><ML latex={q.factorisedLatex??""}/></Card>
          <Card title={`Step ${n++} — Solve for ${subVar} and substitute back`} stepBg={stepBg} fsz={fsz}>
            {q.surdX1&&<ML latex={q.surdX1}/>}
            {q.surdX2&&q.surdX2!==q.surdX1&&<ML latex={q.surdX2}/>}
          </Card>
        </>
        :<Card title={`Step ${n++} — Apply the quadratic formula`} stepBg={stepBg} fsz={fsz}>
          <ML latex={`${subVar}=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}`}/>
          <ML latex={`a=${q.A},\\;b=${q.B},\\;c=${q.C}`}/>
          {q.surdLatex&&<ML latex={q.surdLatex}/>}
          {q.surdYCombined&&<ML latex={q.surdYCombined}/>}
        </Card>
      }
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
  const togglePos = () => { if (allowPos && !allowNeg) return; setNegMode(allowPos ? "neg-only" : "both"); };
  const toggleNeg = () => { if (allowNeg && !allowPos) return; setNegMode(allowNeg ? "pos-only" : "both"); };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Solution Types</span>
            <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
              <button onClick={togglePos} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${allowPos?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>Positive Solutions</button>
              <button onClick={toggleNeg} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${allowNeg?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>Negative Solutions</button>
            </div>
          </div>
          <TogglePill checked={allowNegEq1} onChange={setAllowNegEq1} label="Allow negative coefficients in Equation 1"/>
          {level==="level2"&&<TogglePill checked={allowZero} onChange={setAllowZero} label='Include "= 0" form'/>}
        </div>
      )}
    </div>
  );
};

const NonLinearQOPopover=({subTool,level,allowA,setAllowA,surdDisplay,setSurdDisplay}:{subTool:"factorising"|"formula";level:DifficultyLevel;allowA:AllowAMode;setAllowA:(v:AllowAMode)=>void;surdDisplay:SurdDisplay;setSurdDisplay:(v:SurdDisplay)=>void})=>{
  const {open,setOpen,ref}=usePopover();
  const showSurd = surdDisplay==="surd"||surdDisplay==="both";
  const showDec  = surdDisplay==="decimal"||surdDisplay==="both";
  const toggleSurd = () => { if (showSurd&&!showDec) return; setSurdDisplay(showSurd?"decimal":"both"); };
  const toggleDec  = () => { if (showDec&&!showSurd) return; setSurdDisplay(showDec?"surd":"both"); };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-4">
          {subTool==="formula"&&(
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Display</span>
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                <button onClick={toggleSurd} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${showSurd?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>Surd</button>
                <button onClick={toggleDec}  className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${showDec?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>Decimal</button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {level==="level3" ? "Circle / Ellipse Type" : "Equation 1 Coefficients"}
            </span>
            <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
              {([{bit:1,label:"None"},{bit:2,label:"One"},{bit:4,label:"Both"}]).map(({bit,label})=>{
                const active=!!(allowA & bit);
                const isLast=active && (allowA & ~bit)===0;
                return (
                  <button key={bit} onClick={()=>{ if(!isLast) setAllowA(((Number(allowA)^bit)||1) as AllowAMode); }}
                    className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${active?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
            {level==="level3"&&<p className="text-xs text-gray-400 italic">None = circle (x²+y²=r²). One/Both = ellipse.</p>}
          </div>
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
    {label:"Overview",detail:"One equation is quadratic (or circle/ellipse at Level 3), the other linear. Solved by factorising."},
    {label:"Level 1 — Green",detail:"Linear equation already isolated. Direct substitution."},
    {label:"Level 2 — Yellow",detail:"Linear equation needs rearranging first."},
    {label:"Level 3 — Red",detail:"Circle or ellipse equation. Roots are rational, sometimes fractional."},
  ]},
  {title:"Non-Linear: Formula",icon:"🔢",content:[
    {label:"Overview",detail:"Same structure as Factorising but the quadratic never factorises — formula required."},
    {label:"Level 3",detail:"Circle or ellipse with irrational roots. Answers given as surds and/or decimals."},
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
        if (nlq.isCircle && nlq.surdX1 && nlq.surdX2) {
          return nlq.subTool==="factorising"
            ? `${nlq.surdX1}|SPLIT|${nlq.surdX2}`
            : (surdDisplay==="decimal"&&nlq.decimalLatex ? nlq.decimalLatex : `${nlq.surdX1}|SPLIT|${nlq.surdYCombined??""}`);
        }
        if (nlq.subTool==="formula") {
          const parts: string[] = [];
          if (surdDisplay==="surd"||surdDisplay==="both") { if (nlq.surdLatex) parts.push(nlq.surdLatex); if (nlq.surdYCombined) parts.push(nlq.surdYCombined); }
          if (surdDisplay==="decimal"||surdDisplay==="both") nlq.solutions.forEach(s=>{ const xV=nlq.isolateVar==="y"?s.x:s.y, yV=nlq.isolateVar==="y"?s.y:s.x; parts.push(`x=${fmt2(xV)},\\quad y=${fmt2(yV)}`); });
          return parts.join("|SPLIT|");
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
      pairs.forEach(function(pair){if(pair){var a=document.createElement("div");a.className="qa";kr(a,pair);body.appendChild(a);}});
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
  const [negModeMap,setNegModeMap]=useState<Record<string,NegMode>>({});
  const [allowZeroMap,setAllowZeroMap]=useState<Record<string,boolean>>({});
  const [allowNegEq1Map,setAllowNegEq1Map]=useState<Record<string,boolean>>({});
  const [allowAMap,setAllowAMap]=useState<Record<string,AllowAMode>>({});
  const [surdDisplayMap,setSurdDisplayMap]=useState<Record<string,SurdDisplay>>({});
  const [allowRearrangeMap,setAllowRearrangeMap]=useState<Record<string,boolean>>({});

  const qoKey = `${subTool}__${difficulty}`;
  const negMode       = negModeMap[qoKey]        ?? "pos-only";
  const allowZero     = allowZeroMap[qoKey]       ?? false;
  const allowNegEq1   = allowNegEq1Map[qoKey]     ?? false;
  const allowA        = (allowAMap[qoKey] ?? 1) as AllowAMode;
  const surdDisplay   = surdDisplayMap[qoKey]      ?? "surd" as SurdDisplay;
  const allowRearrange= allowRearrangeMap[qoKey]   ?? false;

  const setNegMode       = (v: NegMode)     => setNegModeMap(p=>({...p,[qoKey]:v}));
  const setAllowZero     = (v: boolean)     => setAllowZeroMap(p=>({...p,[qoKey]:v}));
  const setAllowNegEq1   = (v: boolean)     => setAllowNegEq1Map(p=>({...p,[qoKey]:v}));
  const setSurdDisplay   = (v: SurdDisplay) => setSurdDisplayMap(p=>({...p,[qoKey]:v}));
  const setAllowRearrange= (v: boolean)     => setAllowRearrangeMap(p=>({...p,[qoKey]:v}));

  // Persistent used-key sets — one per subTool, reset when allowA changes
  const usedKeysRef = useRef<Record<string, Set<string>>>({
    factorising: new Set(), formula: new Set(), linear: new Set()
  });

  const setAllowA = (v: AllowAMode) => {
    const n = (Number(v) || 1) as AllowAMode;
    setAllowAMap(p=>({...p,[qoKey]: n}));
    // Reset the used set for this subTool so new questions respect the new filter
    if (subTool !== "linear") {
      usedKeysRef.current[subTool] = new Set();
      // Immediately pick a new question with the new allowA
      if (mode !== "worksheet") {
        const q = subTool==="factorising"
          ? pickUniqueBankFac(n, usedKeysRef.current.factorising)
          : pickUniqueBankForm(n, usedKeysRef.current.formula);
        setCurrentQuestion(q); setShowWhiteboardAnswer(false); setShowAnswer(false);
      }
    }
  };

  const [isDifferentiated,setIsDifferentiated]=useState(false);
  const [currentQuestion,setCurrentQuestion]=useState<AnyQuestion>(()=>generateLinear("level1","pos-only",false,false));
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

  const makeNewQuestion = useCallback((overrideAllowA?: AllowAMode): AnyQuestion => {
    const effAllowA = overrideAllowA ?? allowA;
    if (subTool==="linear") {
      return genUniqueLinear(difficulty, negMode, allowZero, allowNegEq1, usedKeysRef.current.linear);
    }
    if (difficulty==="level3") {
      return subTool==="factorising"
        ? pickUniqueBankFac(effAllowA, usedKeysRef.current.factorising)
        : pickUniqueBankForm(effAllowA, usedKeysRef.current.formula);
    }
    return generateParabolaUnique(subTool, difficulty, effAllowA, surdDisplay, usedKeysRef.current[subTool]);
  }, [subTool, difficulty, negMode, allowZero, allowNegEq1, allowA, surdDisplay, allowRearrange]);

  const handleNewQuestion = useCallback((overrideAllowA?: AllowAMode) => {
    setCurrentQuestion(makeNewQuestion(overrideAllowA));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  }, [makeNewQuestion]);

  const handleGenerateWorksheet = () => {
    const used = new Set<string>();
    const qs: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        for (let i=0; i<numQuestions; i++) {
          if (subTool==="linear") {
            qs.push(genUniqueLinear(lv, negMode, allowZero, allowNegEq1, used));
          } else if (lv==="level3") {
            qs.push(subTool==="factorising"
              ? pickUniqueBankFac(allowA, used)
              : pickUniqueBankForm(allowA, used));
          } else {
            qs.push(generateParabolaUnique(subTool, lv, allowA, surdDisplay, used));
          }
        }
      });
    } else {
      for (let i=0; i<numQuestions; i++) {
        if (subTool==="linear") {
          qs.push(genUniqueLinear(difficulty, negMode, allowZero, allowNegEq1, used));
        } else if (difficulty==="level3") {
          qs.push(subTool==="factorising"
            ? pickUniqueBankFac(allowA, used)
            : pickUniqueBankForm(allowA, used));
        } else {
          qs.push(generateParabolaUnique(subTool, difficulty, allowA, surdDisplay, used));
        }
      }
    }
    setWorksheet(qs);
    setShowWorksheetAnswers(false);
  };

  useEffect(()=>{
    if(mode!=="worksheet"){
      usedKeysRef.current = { factorising: new Set(), formula: new Set(), linear: new Set() };
      handleNewQuestion();
    }
  },[difficulty,subTool]);

  const displayFontSizes=["text-xl","text-2xl","text-3xl","text-4xl","text-5xl","text-6xl"];
  const fontSizes=["text-base","text-lg","text-xl","text-2xl","text-3xl"];
  const canDI=displayFontSize<displayFontSizes.length-1,canDD=displayFontSize>0;
  const canInc=worksheetFontSize<fontSizes.length-1,canDec=worksheetFontSize>0;
  const fbStyle=(en:boolean):CSSProperties=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:en?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:en?1:0.35});

  const renderQOPopover=()=>subTool==="linear"
    ?<LinearQOPopover level={difficulty} negMode={negMode} setNegMode={setNegMode} allowZero={allowZero} setAllowZero={setAllowZero} allowNegEq1={allowNegEq1} setAllowNegEq1={setAllowNegEq1}/>
    :<NonLinearQOPopover subTool={subTool} level={difficulty} allowA={allowA} setAllowA={setAllowA} surdDisplay={surdDisplay} setSurdDisplay={setSurdDisplay}/>;

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
              :(()=>{
                const nlq=q as NonLinearQuestion;
                if(nlq.isCircle&&nlq.subTool==="formula"&&nlq.surdX1) return (
                  <><MathRenderer latex={nlq.surdX1}/>{nlq.surdYCombined&&<><br/><MathRenderer latex={nlq.surdYCombined}/></>}</>
                );
                if(nlq.isCircle&&nlq.surdX1) return (
                  <><MathRenderer latex={nlq.surdX1}/>{nlq.surdX2&&nlq.surdX2!==nlq.surdX1&&<><br/><MathRenderer latex={nlq.surdX2}/></>}</>
                );
                if(nlq.subTool==="formula") return (
                  <>{nlq.surdLatex&&<div><MathRenderer latex={nlq.surdLatex}/></div>}{nlq.surdYCombined&&<div><MathRenderer latex={nlq.surdYCombined}/></div>}</>
                );
                return <>{nlq.solutions.map((s,i)=><div key={i}><MathRenderer latex={`x=${fmtSoln(s.x)},\\;y=${fmtSoln(s.y)}`}/></div>)}</>;
              })()
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
            <input type="number" min="1" max="20" value={numQuestions} onChange={e=>setNumQuestions(Math.max(1,Math.min(20,parseInt(e.target.value)||12)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
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
            <button onClick={()=>handleNewQuestion()} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
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
          <button onClick={()=>handleNewQuestion()} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
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
          <div style={{position:"relative",width:2,backgroundColor:"#000",flexShrink:0,cursor:"col-resize"}}
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
            }}>
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
