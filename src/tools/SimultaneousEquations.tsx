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
  return <span ref={ref} className={className} style={{ display: "inline", verticalAlign: "baseline", fontSize: "0.826em", ...style }} />;
};

// Parse "Some text $latex$ more text $latex2$." into alternating plain/math spans.
// Uses character-by-character scanning so multiple $...$ blocks on one line never bleed into each other.
const InlineMath = ({ text }: { text: string }) => {
  const parts: { math: boolean; content: string }[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "$") {
      const close = text.indexOf("$", i + 1);
      if (close !== -1) {
        parts.push({ math: true, content: text.slice(i + 1, close) });
        i = close + 1;
      } else {
        parts.push({ math: false, content: text[i] });
        i++;
      }
    } else {
      const next = text.indexOf("$", i);
      const end = next === -1 ? text.length : next;
      parts.push({ math: false, content: text.slice(i, end) });
      i = end;
    }
  }
  return (
    <span style={{ display: "inline" }}>
      {parts.map((p, idx) =>
        p.math
          ? <MathRenderer key={idx} latex={p.content} />
          : <span key={idx}>{p.content}</span>
      )}
    </span>
  );
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
        }}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${active ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      );
    })}
  </div>
);

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
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
type CaseType    = "pos-pos" | "pos-neg" | "neg-neg";
type OpMode      = "add" | "subtract" | "mixed";
type SurfaceForm = "std" | "swap" | "rhs-v2" | "rhs-v1";
type SubTool     = "elimination" | "scaling" | "lcm" | "worded";
type L2Type      = "sumDiff" | "moreThan" | "ratio";
type L3Type      = "purchase" | "equilateral" | "isosceles" | "scalene";
type WordedMethod = "direct" | "scaling" | "lcm";
type RearrangeMode = "none" | "one" | "both";

const VAR_PAIRS: [string, string][] = [["x","y"],["s","t"],["n","m"],["a","b"],["u","v"]];

interface SimEqQuestion {
  kind: "simeq";
  varPair: [string,string];
  a1: number; b1: number; c1: number;
  a2: number; b2: number; c2: number;
  eq1Display: string; eq2Display: string;
  eq1Canonical: string; eq2Canonical: string;
  eq1NeedsRearrange: boolean; eq2NeedsRearrange: boolean;
  caseType: CaseType; operation: "add"|"subtract"; operationDesc: string;
  afterElimLatex: string; solveVarSteps: string[]; subBackSteps: string[];
  v1Val: number; v2Val: number;
  scaleFactor?: number; scaleEq?: 1|2; scaledEqLatex?: string;
  scaleFactor1?: number; scaleFactor2?: number;
  scaledEq3Latex?: string; scaledEq4Latex?: string;
  key: string; difficulty: string;
  working: { type: string; latex: string; plain: string; label?: string }[];
}

interface WordedQuestion {
  kind: "worded-simeq";
  lines: string[];
  equation1: string; equation2: string;
  v1: string; v2: string; v1Val: number; v2Val: number;
  answerLines: string[];
  working: { type: string; latex: string; plain: string; label?: string }[];
  key: string; difficulty: string;
  subType: L2Type | L3Type | "level1";
}

type AnyQuestion = SimEqQuestion | WordedQuestion;

// ═══════════════════════════════════════════════════════════════════════════════
// SIMEQ LATEX HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const term = (coeff: number, v: string) =>
  coeff === 1 ? v : coeff === -1 ? `-${v}` : `${coeff}${v}`;
const secondTerm = (coeff: number, v: string) =>
  coeff === 0 ? "" : coeff > 0 ? `+ ${term(coeff,v)}` : `- ${term(-coeff,v)}`;
const buildNaturalLatex = (a: number, b: number, c: number, v1: string, v2: string) => {
  const v1First = a >= 0 && b < 0 ? true : a < 0 && b >= 0 ? false : Math.random() < 0.5;
  return v1First ? `${term(a,v1)} ${secondTerm(b,v2)} = ${c}` : `${term(b,v2)} ${secondTerm(a,v1)} = ${c}`;
};
const canonicalLatex = (a: number, b: number, c: number, v1: string, v2: string) =>
  `${term(a,v1)} ${secondTerm(b,v2)} = ${c}`;
const buildScaledLatex = (a: number, b: number, c: number, src: string, v1: string, v2: string) => {
  const i1 = src.indexOf(v1), i2 = src.indexOf(v2);
  const v2Leads = i2 !== -1 && (i1 === -1 || i2 < i1);
  return v2Leads ? `${term(b,v2)} ${secondTerm(a,v1)} = ${c}` : `${term(a,v1)} ${secondTerm(b,v2)} = ${c}`;
};
// RHS surface forms: move terms to produce a rearranged display.
// The canonical form is always computed from the same a,b,c values,
// so these only affect display — they must be algebraically equivalent.
const surfaceRhsV2 = (a: number, b: number, c: number, v1: string, v2: string) => {
  // Display: a*v1 = c - b*v2  (move b*v2 to RHS)
  // Equivalent to canonical: a*v1 + b*v2 = c
  const rhs = b >= 0
    ? `${c} - ${term(b,v2)}`      // e.g. 5u = 12 - 3v
    : `${c} + ${term(-b,v2)}`;    // e.g. 5u = 12 + 3v  (b was negative)
  return `${term(a,v1)} = ${rhs}`;
};
const surfaceRhsV1 = (a: number, b: number, c: number, v1: string, v2: string) => {
  // Display: b*v2 = c - a*v1  (move a*v1 to RHS)
  // Equivalent to canonical: a*v1 + b*v2 = c
  const rhs = a >= 0
    ? `${c} - ${term(a,v1)}`      // e.g. 3v = 12 - 5u
    : `${c} + ${term(-a,v1)}`;    // e.g. 3v = 12 + 5u  (a was negative)
  return `${term(b,v2)} = ${rhs}`;
};
const applyForm = (form: SurfaceForm, a: number, b: number, c: number, v1: string, v2: string) => {
  switch (form) {
    case "std": case "swap": return buildNaturalLatex(a,b,c,v1,v2);
    case "rhs-v2": return surfaceRhsV2(a,b,c,v1,v2);
    case "rhs-v1": return surfaceRhsV1(a,b,c,v1,v2);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMEQ GENERATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const gcd  = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const lcmOf = (a: number, b: number) => (a*b)/gcd(a,b);
const randInt = (min: number, max: number) => Math.floor(Math.random()*(max-min+1))+min;
const pick = <T,>(arr: T[]): T => arr[randInt(0,arr.length-1)];

const pickCaseType = (level: DifficultyLevel, opMode: OpMode): CaseType => {
  if (level==="level1") return opMode==="add"?"pos-neg":opMode==="subtract"?"pos-pos":(Math.random()<0.5?"pos-pos":"pos-neg");
  if (level==="level2") return "neg-neg";
  return (["pos-pos","pos-neg","neg-neg"] as CaseType[])[Math.floor(Math.random()*3)];
};
const pickForms = (rearrangeMode: RearrangeMode): [SurfaceForm, SurfaceForm] => {
  const nat: SurfaceForm[] = ["std", "swap"];
  const rhs: SurfaceForm[] = ["rhs-v2", "rhs-v1"];
  if (rearrangeMode === "none") return [nat[Math.floor(Math.random()*2)], nat[Math.floor(Math.random()*2)]];
  if (rearrangeMode === "both") return [rhs[Math.floor(Math.random()*2)], rhs[Math.floor(Math.random()*2)]];
  // "one" — exactly one equation is rearranged
  return Math.random() < 0.5
    ? [rhs[Math.floor(Math.random()*2)], nat[Math.floor(Math.random()*2)]]
    : [nat[Math.floor(Math.random()*2)], rhs[Math.floor(Math.random()*2)]];
};
const caseTypeSigns = (ct: CaseType): [number,number] =>
  ct==="pos-pos"?[1,1]:ct==="pos-neg"?[1,-1]:[-1,-1];
const makeVal = (allowNeg: boolean) =>
  allowNeg && Math.random()<0.35 ? -(Math.floor(Math.random()*9)+1) : Math.floor(Math.random()*9)+1;
const elimDirection = (bTop: number, bBot: number, cTop: number, cBot: number, topLbl: string, botLbl: string) =>
  bTop >= bBot
    ? { remainCoeff: bTop-bBot, remainRHS: cTop-cBot, operationDesc: `${topLbl} \u2212 ${botLbl}` }
    : { remainCoeff: bBot-bTop, remainRHS: cBot-cTop, operationDesc: `${botLbl} \u2212 ${topLbl}` };

const buildSubBackSteps = (form1: SurfaceForm, a1: number, b1c: number, c1: number, v1: string, _v2: string, v2Val: number): string[] => {
  const subTermVal = b1c*v2Val, remaining = c1-subTermVal;
  const steps: string[] = [];
  if (form1==="std"||form1==="swap") {
    steps.push(`${term(a1,v1)} ${b1c>=0?"+":"-"} ${Math.abs(b1c)}(${v2Val}) = ${c1}`);
    steps.push(`${term(a1,v1)} ${subTermVal>=0?"+":"-"} ${Math.abs(subTermVal)} = ${c1}`);
    if (Math.abs(a1)!==1) { steps.push(`${term(a1,v1)} = ${remaining}`); steps.push(`${v1} = ${remaining} \\div ${a1}`); }
    else steps.push(`${term(a1,v1)} = ${remaining}`);
  } else if (form1==="rhs-v2") {
    steps.push(`${term(a1,v1)} = ${c1} - ${b1c>=0?"":"-"}${Math.abs(b1c)}(${v2Val})`);
    steps.push(`${term(a1,v1)} = ${c1} - ${subTermVal}`);
    steps.push(`${term(a1,v1)} = ${remaining}`);
    if (Math.abs(a1)!==1) steps.push(`${v1} = ${remaining} \\div ${a1}`);
  } else {
    steps.push(`${b1c>=0?"":"-"}${Math.abs(b1c)}(${v2Val}) = ${c1} - ${term(a1,v1)}`);
    steps.push(`${subTermVal} = ${c1} - ${term(a1,v1)}`);
    steps.push(`${term(a1,v1)} = ${c1} - ${subTermVal}`);
    steps.push(`${term(a1,v1)} = ${remaining}`);
    if (Math.abs(a1)!==1) steps.push(`${v1} = ${remaining} \\div ${a1}`);
  }
  steps.push(`${v1} = ${Math.round(remaining/a1)}`);
  return steps;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMEQ GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════
const generateElimination = (level: DifficultyLevel, variables: Record<string,boolean>, opMode: OpMode): SimEqQuestion => {
  const allowNeg=variables["allowNegSolutions"]??false;
  const rearrangeMode=(variables["rearrangeMode"] as unknown as RearrangeMode) ?? "none";
  const id=Math.floor(Math.random()*1_000_000);
  const varPair=pick(VAR_PAIRS); const [v1,v2]=varPair;
  const caseType=pickCaseType(level,opMode); const [sign1,sign2]=caseTypeSigns(caseType);
  const matchMag=randInt(2,9);
  let b1=randInt(2,8),b2=randInt(2,8); while(b2===b1) b2=randInt(2,8);
  const v2Val=makeVal(allowNeg),v1Val=makeVal(allowNeg);
  const a1=sign1*matchMag,a2=sign2*matchMag,b1c=b1,b2c=b2;
  const c1=a1*v1Val+b1c*v2Val,c2=a2*v1Val+b2c*v2Val;
  const operation:"add"|"subtract"=caseType==="pos-neg"?"add":"subtract";
  let operationDesc:string,remainCoeff:number,remainRHS:number;
  if(operation==="add"){remainCoeff=b1c+b2c;remainRHS=c1+c2;operationDesc="(1) + (2)";}
  else({remainCoeff,remainRHS,operationDesc}=elimDirection(b1c,b2c,c1,c2,"(1)","(2)"));
  const afterElimLatex=remainCoeff===1?`${v2} = ${remainRHS}`:remainCoeff===-1?`-${v2} = ${remainRHS}`:`${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps:string[]=[];
  if(Math.abs(remainCoeff)!==1)solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if(remainCoeff===-1)solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);
  const [form1,form2]=pickForms(rearrangeMode);
  const eq1Display=applyForm(form1,a1,b1c,c1,v1,v2),eq2Display=applyForm(form2,a2,b2c,c2,v1,v2);
  const eq1Canonical=canonicalLatex(a1,b1c,c1,v1,v2),eq2Canonical=canonicalLatex(a2,b2c,c2,v1,v2);
  const subBackSteps=buildSubBackSteps(form1,a1,b1c,c1,v1,v2,v2Val);
  return { kind:"simeq",varPair,a1,b1:b1c,c1,a2,b2:b2c,c2,eq1Display,eq2Display,eq1Canonical,eq2Canonical,
    eq1NeedsRearrange:form1==="rhs-v2"||form1==="rhs-v1",eq2NeedsRearrange:form2==="rhs-v2"||form2==="rhs-v1",
    caseType,operation,operationDesc,afterElimLatex,solveVarSteps,subBackSteps,v1Val,v2Val,
    key:`elim-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${id}`,difficulty:level,working:[] };
};

const generateScaling = (level: DifficultyLevel, variables: Record<string,boolean>, opMode: OpMode): SimEqQuestion => {
  const allowNeg=variables["allowNegSolutions"]??false;
  const rearrangeMode=(variables["rearrangeMode"] as unknown as RearrangeMode) ?? "none";
  const id=Math.floor(Math.random()*1_000_000);
  const varPair=pick(VAR_PAIRS); const [v1,v2]=varPair;
  const caseType=pickCaseType(level,opMode); const [sign1,sign2]=caseTypeSigns(caseType);
  let k=0,baseMag=0,attempts=0;
  do{k=randInt(2,6);baseMag=randInt(2,6);attempts++;}while(k*baseMag>15&&attempts<200);
  if(k*baseMag>15){k=2;baseMag=2;}
  const scaledMag=k*baseMag, scaleEq:(1|2)=Math.random()<0.5?1:2;
  const a1=scaleEq===1?sign1*baseMag:sign1*scaledMag, a2=scaleEq===1?sign2*scaledMag:sign2*baseMag;
  let b1=randInt(2,8),b2=randInt(2,8);
  while(b2===b1 || a1*b2===a2*b1) b2=randInt(2,8);
  const b1c=b1,b2c=b2,v2Val=makeVal(allowNeg),v1Val=makeVal(allowNeg);
  const c1=a1*v1Val+b1c*v2Val,c2=a2*v1Val+b2c*v2Val;
  const scaledA=scaleEq===1?a1*k:a2*k,scaledB=scaleEq===1?b1c*k:b2c*k,scaledC=scaleEq===1?c1*k:c2*k;
  const eB_top=scaleEq===1?scaledB:b1c,eC_top=scaleEq===1?scaledC:c1;
  const eB_bot=scaleEq===1?b2c:scaledB,eC_bot=scaleEq===1?c2:scaledC;
  const topLbl=scaleEq===1?"(3)":"(1)",botLbl=scaleEq===1?"(2)":"(3)";
  const operation:"add"|"subtract"=caseType==="pos-neg"?"add":"subtract";
  let operationDesc:string,remainCoeff:number,remainRHS:number;
  if(operation==="add"){remainCoeff=eB_top+eB_bot;remainRHS=eC_top+eC_bot;operationDesc=`${topLbl} + ${botLbl}`;}
  else({remainCoeff,remainRHS,operationDesc}=elimDirection(eB_top,eB_bot,eC_top,eC_bot,topLbl,botLbl));
  const afterElimLatex=remainCoeff===1?`${v2} = ${remainRHS}`:remainCoeff===-1?`-${v2} = ${remainRHS}`:`${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps:string[]=[];
  if(Math.abs(remainCoeff)!==1)solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if(remainCoeff===-1)solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);
  const [form1,form2]=pickForms(rearrangeMode);
  const eq1Display=applyForm(form1,a1,b1c,c1,v1,v2),eq2Display=applyForm(form2,a2,b2c,c2,v1,v2);
  const eq1Canonical=canonicalLatex(a1,b1c,c1,v1,v2),eq2Canonical=canonicalLatex(a2,b2c,c2,v1,v2);
  const scaledEqLatex=buildScaledLatex(scaledA,scaledB,scaledC,scaleEq===1?eq1Display:eq2Display,v1,v2);
  const subBackSteps=buildSubBackSteps(form1,a1,b1c,c1,v1,v2,v2Val);
  return { kind:"simeq",varPair,a1,b1:b1c,c1,a2,b2:b2c,c2,eq1Display,eq2Display,eq1Canonical,eq2Canonical,
    eq1NeedsRearrange:form1==="rhs-v2"||form1==="rhs-v1",eq2NeedsRearrange:form2==="rhs-v2"||form2==="rhs-v1",
    caseType,operation,operationDesc,afterElimLatex,solveVarSteps,subBackSteps,v1Val,v2Val,
    scaleFactor:k,scaleEq,scaledEqLatex,
    key:`scale-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${k}-${id}`,difficulty:level,working:[] };
};

const generateLCM = (level: DifficultyLevel, variables: Record<string,boolean>, opMode: OpMode): SimEqQuestion => {
  const allowNeg=variables["allowNegSolutions"]??false;
  const rearrangeMode=(variables["rearrangeMode"] as unknown as RearrangeMode) ?? "none";
  const id=Math.floor(Math.random()*1_000_000);
  const varPair=pick(VAR_PAIRS); const [v1,v2]=varPair;
  const caseType=pickCaseType(level,opMode); const [sign1,sign2]=caseTypeSigns(caseType);
  const coprimePairs:[number,number][]=[];
  for(let p=2;p<=9;p++)for(let q=p+1;q<=9;q++)if(gcd(p,q)===1&&lcmOf(p,q)<=30)coprimePairs.push([p,q]);
  const [mag1,mag2]=pick(coprimePairs);
  const elimLCM=lcmOf(mag1,mag2),kFor1=elimLCM/mag1,kFor2=elimLCM/mag2;
  const a1=sign1*mag1,a2=sign2*mag2;
  let b1=randInt(2,8),b2=randInt(2,8);
  while(b2===b1 || a1*b2===a2*b1) b2=randInt(2,8);
  const b1c=b1,b2c=b2,v2Val=makeVal(allowNeg),v1Val=makeVal(allowNeg);
  const c1=a1*v1Val+b1c*v2Val,c2=a2*v1Val+b2c*v2Val;
  const sA1=a1*kFor1,sB1=b1c*kFor1,sC1=c1*kFor1,sA2=a2*kFor2,sB2=b2c*kFor2,sC2=c2*kFor2;
  const operation:"add"|"subtract"=caseType==="pos-neg"?"add":"subtract";
  let operationDesc:string,remainCoeff:number,remainRHS:number;
  if(operation==="add"){remainCoeff=sB1+sB2;remainRHS=sC1+sC2;operationDesc="(3) + (4)";}
  else({remainCoeff,remainRHS,operationDesc}=elimDirection(sB1,sB2,sC1,sC2,"(3)","(4)"));
  const afterElimLatex=remainCoeff===1?`${v2} = ${remainRHS}`:remainCoeff===-1?`-${v2} = ${remainRHS}`:`${remainCoeff}${v2} = ${remainRHS}`;
  const solveVarSteps:string[]=[];
  if(Math.abs(remainCoeff)!==1)solveVarSteps.push(`${v2} = ${remainRHS} \\div ${remainCoeff}`);
  else if(remainCoeff===-1)solveVarSteps.push(`${v2} = ${remainRHS} \\div -1`);
  solveVarSteps.push(`${v2} = ${v2Val}`);
  const [form1,form2]=pickForms(rearrangeMode);
  const eq1Display=applyForm(form1,a1,b1c,c1,v1,v2),eq2Display=applyForm(form2,a2,b2c,c2,v1,v2);
  const eq1Canonical=canonicalLatex(a1,b1c,c1,v1,v2),eq2Canonical=canonicalLatex(a2,b2c,c2,v1,v2);
  const scaledEq3Latex=buildScaledLatex(sA1,sB1,sC1,eq1Display,v1,v2);
  const scaledEq4Latex=buildScaledLatex(sA2,sB2,sC2,eq2Display,v1,v2);
  const subBackSteps=buildSubBackSteps(form1,a1,b1c,c1,v1,v2,v2Val);
  return { kind:"simeq",varPair,a1,b1:b1c,c1,a2,b2:b2c,c2,eq1Display,eq2Display,eq1Canonical,eq2Canonical,
    eq1NeedsRearrange:form1==="rhs-v2"||form1==="rhs-v1",eq2NeedsRearrange:form2==="rhs-v2"||form2==="rhs-v1",
    caseType,operation,operationDesc,afterElimLatex,solveVarSteps,subBackSteps,v1Val,v2Val,
    scaleFactor1:kFor1,scaleFactor2:kFor2,scaledEq3Latex,scaledEq4Latex,
    key:`lcm-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${mag1}-${mag2}-${b1}-${b2}-${id}`,difficulty:level,working:[] };
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORDED GENERATORS
// All `lines` entries: numbers/currency in $...$, prose words plain.
// ═══════════════════════════════════════════════════════════════════════════════
const cStr  = (coeff: number, v: string) => coeff===1?v:coeff===-1?`-${v}`:`${coeff}${v}`;
const wri   = (min: number, max: number) => Math.floor(Math.random()*(max-min+1))+min;
const wpick = <T,>(arr: T[]): T => arr[wri(0,arr.length-1)];
const wCStr = (coeff: number, v: string) => coeff===1?v:coeff===-1?`-${v}`:`${coeff}${v}`;
const nv = (n: number) => `$${n}$`;
const cv = (n: number) => `$\\pounds ${n}$`;

const ITEM_CONTEXTS = [
  { singular:["hat","coat"],    plural:["hats","coats"],       vars:["h","c"], priceRange:[3,12] },
  { singular:["pen","ruler"],   plural:["pens","rulers"],      vars:["p","r"], priceRange:[1,5]  },
  { singular:["mug","plate"],   plural:["mugs","plates"],      vars:["m","p"], priceRange:[4,15] },
  { singular:["ticket","program"],plural:["tickets","programs"],vars:["t","g"],priceRange:[5,20] },
  { singular:["apple","orange"],plural:["apples","oranges"],   vars:["a","n"], priceRange:[1,3]  },
];
const PURCHASE_CONTEXTS = [
  { item:"box",   items:"boxes",   typeA:"luxury",    typeB:"standard",priceA:5,priceB:3 },
  { item:"ticket",items:"tickets", typeA:"adult",     typeB:"child",   priceA:8,priceB:4 },
  { item:"coffee",items:"coffees", typeA:"large",     typeB:"small",   priceA:4,priceB:2 },
  { item:"cake",  items:"cakes",   typeA:"decorated", typeB:"plain",   priceA:6,priceB:3 },
  { item:"plant", items:"plants",  typeA:"tropical",  typeB:"cactus",  priceA:7,priceB:3 },
];
const NAME_PAIRS = [["Sam","Alex"],["Jamie","Morgan"],["Priya","Leon"],["Chloe","Dan"],["Mia","Jake"],["Rafi","Seren"]];
const NUMBER_INTROS = ["Two numbers","Two integers","Two whole numbers"];

const genLevel1Worded = (method: WordedMethod): WordedQuestion => {
  const ctx=wpick(ITEM_CONTEXTS);
  const [v1,v2]=ctx.vars,[sing1,sing2]=ctx.singular,[pl1,pl2]=ctx.plural;
  const names=wpick(NAME_PAIRS);
  const [pMin,pMax]=ctx.priceRange as [number,number];
  const v1Val=wri(pMin,pMax),v2Val=wri(pMin,pMax);
  let a1:number,a2:number;
  if(method==="direct"){const mag=wri(2,8);a1=mag;a2=mag;}
  else if(method==="scaling"){const base=wri(2,5),k=wri(2,4);a1=base;a2=base*k;}
  else{const pairs:[number,number][]=[[2,3],[2,5],[3,4],[3,5],[4,5],[2,7],[3,7]];[a1,a2]=wpick(pairs);}
  let b1=wri(2,8),b2=wri(2,8);
  while(b2===b1 || a1*b2===a2*b1) b2=wri(2,8);
  const c1=a1*v1Val+b1*v2Val,c2=a2*v1Val+b2*v2Val;
  const eq1=`${cStr(a1,v1)} + ${cStr(b1,v2)} = ${c1}`;
  const eq2=`${cStr(a2,v1)} + ${cStr(b2,v2)} = ${c2}`;
  const flip1=Math.random()<0.5, flip2=Math.random()<0.5;
  const line1=flip1
    ? `${names[0]} buys ${nv(b1)} ${pl2} and ${nv(a1)} ${pl1} and spends ${cv(c1)}.`
    : `${names[0]} buys ${nv(a1)} ${pl1} and ${nv(b1)} ${pl2} and spends ${cv(c1)}.`;
  const line2=flip2
    ? `${names[1]} buys ${nv(b2)} ${pl2} and ${nv(a2)} ${pl1} and spends ${cv(c2)}.`
    : `${names[1]} buys ${nv(a2)} ${pl1} and ${nv(b2)} ${pl2} and spends ${cv(c2)}.`;
  return {
    kind:"worded-simeq",
    lines:[line1, line2, `Find the cost of one ${sing1} and one ${sing2}.`],
    equation1:eq1, equation2:eq2, v1, v2, v1Val, v2Val,
    answerLines:[`One ${sing1} costs ${cv(v1Val)} and one ${sing2} costs ${cv(v2Val)}.`],
    working:[
      {type:"tStep",latex:`\\text{Let } ${v1} = \\text{cost of one ${sing1}},\\ ${v2} = \\text{cost of one ${sing2}}`,plain:""},
      {type:"step",latex:eq1,plain:eq1},{type:"step",latex:eq2,plain:eq2},
    ],
    key:`w1-${method}-${v1}${v2}-${a1}-${b1}-${a2}-${b2}-${v1Val}-${v2Val}`,
    difficulty:"level1", subType:"level1",
  };
};

const genSumDiff = (): WordedQuestion => {
  const v1Val=wri(5,50),v2Val=wri(1,v1Val-1);
  const sum=v1Val+v2Val,diff=v1Val-v2Val,intro=wpick(NUMBER_INTROS);
  const eq1=`x + y = ${sum}`,eq2=`x - y = ${diff}`;
  return {
    kind:"worded-simeq",
    lines:[
      `${intro} have a sum of ${nv(sum)} and a difference of ${nv(diff)}.`,
      `Find the two numbers.`,
    ],
    equation1:eq1, equation2:eq2, v1:"x", v2:"y", v1Val, v2Val,
    answerLines:[`The two numbers are ${nv(v1Val)} and ${nv(v2Val)}.`],
    working:[
      {type:"tStep",latex:"\\text{Let } x = \\text{larger number}, \\quad y = \\text{smaller number}",plain:""},
      {type:"step",latex:eq1,plain:eq1},{type:"step",latex:eq2,plain:eq2},
    ],
    key:`w2-sumDiff-${sum}-${diff}`, difficulty:"level2", subType:"sumDiff",
  };
};

const genMoreThan = (): WordedQuestion => {
  const ctx=wpick(ITEM_CONTEXTS);
  const [v1,v2]=ctx.vars,[sing1,sing2]=ctx.singular,[pl1,pl2]=ctx.plural;
  const [pMin,pMax]=ctx.priceRange as [number,number];
  for(let attempt=0;attempt<200;attempt++){
    const ka=wri(2,8),kb=wri(2,8),v1Val=wri(pMin,pMax*3),v2Val=wri(pMin,pMax*3);
    const d=ka*v1Val-kb*v2Val; if(d<=0) continue;
    const b1=wri(2,6),b2=wri(2,6),c2=b1*v1Val+b2*v2Val;
    if(ka*b2 === -kb*b1) continue;
    const eq1=`${wCStr(ka,v1)} - ${wCStr(kb,v2)} = ${d}`;
    const eq2=`${wCStr(b1,v1)} + ${wCStr(b2,v2)} = ${c2}`;
    return {
      kind:"worded-simeq",
      lines:[
        `${nv(ka)} ${pl1} cost ${cv(d)} more than ${nv(kb)} ${pl2}.`,
        `${nv(b1)} ${pl1} and ${nv(b2)} ${pl2} cost ${cv(c2)} in total.`,
        `Find the cost of one ${sing1} and one ${sing2}.`,
      ],
      equation1:eq1, equation2:eq2, v1, v2, v1Val, v2Val,
      answerLines:[`One ${sing1} costs ${cv(v1Val)} and one ${sing2} costs ${cv(v2Val)}.`],
      working:[
        {type:"tStep",latex:`\\text{Let } ${v1} = \\text{cost of one ${sing1}}, \\quad ${v2} = \\text{cost of one ${sing2}}`,plain:""},
        {type:"tStep",latex:`\\text{"${ka} ${pl1} cost £${d} more than ${kb} ${pl2}"} \\Rightarrow ${wCStr(ka,v1)} = ${wCStr(kb,v2)} + ${d}`,plain:""},
        {type:"step",latex:eq1,plain:eq1},{type:"step",latex:eq2,plain:eq2},
      ],
      key:`w2-moreThan-${v1}${v2}-${ka}-${kb}-${d}-${b1}-${b2}`, difficulty:"level2", subType:"moreThan",
    };
  }
  return genMoreThan();
};

const genRatio = (): WordedQuestion => {
  const ctx=wpick(ITEM_CONTEXTS);
  const [v1,v2]=ctx.vars,[sing1,sing2]=ctx.singular,[pl1,pl2]=ctx.plural;
  const pairs:[number,number][]=[[2,3],[3,4],[3,5],[2,5],[4,5],[3,7],[4,7],[5,6],[5,7],[5,8],[6,7],[7,8]];
  const [ka,kb]=wpick(pairs),s=wri(1,4);
  const v1Val=kb*s,v2Val=ka*s,b1=wri(2,5),b2=wri(2,5),c2=b1*v1Val+b2*v2Val;
  const eq1=`${wCStr(ka,v1)} - ${wCStr(kb,v2)} = 0`,eq2=`${wCStr(b1,v1)} + ${wCStr(b2,v2)} = ${c2}`;
  return {
    kind:"worded-simeq",
    lines:[
      `${nv(ka)} ${pl1} cost the same as ${nv(kb)} ${pl2}.`,
      `${nv(b1)} ${pl1} and ${nv(b2)} ${pl2} cost ${cv(c2)} altogether.`,
      `Find the cost of one ${sing1} and one ${sing2}.`,
    ],
    equation1:eq1, equation2:eq2, v1, v2, v1Val, v2Val,
    answerLines:[`One ${sing1} costs ${cv(v1Val)} and one ${sing2} costs ${cv(v2Val)}.`],
    working:[
      {type:"tStep",latex:`\\text{Let } ${v1} = \\text{cost of one ${sing1}}, \\quad ${v2} = \\text{cost of one ${sing2}}`,plain:""},
      {type:"tStep",latex:`\\text{"${ka} ${pl1} = ${kb} ${pl2}"} \\Rightarrow ${wCStr(ka,v1)} = ${wCStr(kb,v2)}`,plain:""},
      {type:"step",latex:eq1,plain:eq1},{type:"step",latex:eq2,plain:eq2},
    ],
    key:`w2-ratio-${v1}${v2}-${ka}-${kb}-${b1}-${b2}-${s}`, difficulty:"level2", subType:"ratio",
  };
};

const genPurchase = (): WordedQuestion => {
  const ctx=wpick(PURCHASE_CONTEXTS);
  const total=wri(15,80);
  const aCount=wri(3,total-3),bCount=total-aCount;
  const revenue=ctx.priceA*aCount+ctx.priceB*bCount;
  const eq1=`a + b = ${total}`,eq2=`${ctx.priceA}a + ${ctx.priceB}b = ${revenue}`;
  return {
    kind:"worded-simeq",
    lines:[
      `A stall sells ${nv(total)} ${ctx.items} in a day.`,
      `${ctx.typeA[0].toUpperCase()+ctx.typeA.slice(1)} ${ctx.items} cost ${cv(ctx.priceA)} each and ${ctx.typeB} ${ctx.items} cost ${cv(ctx.priceB)} each.`,
      `The stall makes ${cv(revenue)} in total.`,
      `Find how many of each type of ${ctx.item} were sold.`,
    ],
    equation1:eq1, equation2:eq2, v1:"a", v2:"b", v1Val:aCount, v2Val:bCount,
    answerLines:[`${nv(aCount)} ${ctx.typeA} ${ctx.items} and ${nv(bCount)} ${ctx.typeB} ${ctx.items} were sold.`],
    working:[
      {type:"tStep",latex:`\\text{Let } a = \\text{number of ${ctx.typeA} ${ctx.items}}`,plain:""},
      {type:"tStep",latex:`b = \\text{number of ${ctx.typeB} ${ctx.items}}`,plain:""},
      {type:"tStep",latex:`\\text{Total: } a + b = ${total}`,plain:""},
      {type:"tStep",latex:`\\text{Revenue: } ${ctx.priceA}a + ${ctx.priceB}b = ${revenue}`,plain:""},
    ],
    key:`w3-purchase-${ctx.item}-${total}-${aCount}-${revenue}`, difficulty:"level3", subType:"purchase",
  };
};

const genEquilateral = (): WordedQuestion => {
  for(let attempt=0;attempt<200;attempt++){
    const xVal=wri(3,30),yVal=wri(3,30);
    const c=wri(1,3),rem=60-c*xVal;
    if(rem<=0||rem%yVal!==0) continue;
    const d=rem/yVal; if(d<=0||d>4) continue;
    const a=wri(1,3),b=wri(1,3),sideLen=a*xVal+b*yVal;
    if(sideLen<=0) continue;
    const perim=3*sideLen,A=3*a,B=3*b;
    const eq1=`${wCStr(A,"x")} + ${wCStr(B,"y")} = ${perim}`;
    const eq2=`${wCStr(c,"x")} + ${wCStr(d,"y")} = 60`;
    if(A*d===B*c) continue;
    const sideStr=`${a===1?"":a}x + ${b}y`,angleStr=`${c===1?"":c}x + ${d}y`;
    return {
      kind:"worded-simeq",
      lines:[
        `An equilateral triangle has a side length of $(${sideStr})$ cm.`,
        `The perimeter of the triangle is ${nv(perim)} cm.`,
        `One of its angles is $(${angleStr})°$.`,
        `Find the values of $x$ and $y$.`,
      ],
      equation1:eq1, equation2:eq2, v1:"x", v2:"y", v1Val:xVal, v2Val:yVal,
      answerLines:[`$x = ${xVal}$ and $y = ${yVal}$`],
      working:[
        {type:"tStep",latex:`\\text{Equilateral: all sides equal} \\Rightarrow \\text{perimeter} = 3(${sideStr})`,plain:""},
        {type:"step",latex:eq1,plain:eq1},
        {type:"tStep",latex:"\\text{All angles in an equilateral triangle} = 60°",plain:""},
        {type:"step",latex:eq2,plain:eq2},
      ],
      key:`w3-equil-${a}-${b}-${c}-${d}-${xVal}-${yVal}`, difficulty:"level3", subType:"equilateral",
    };
  }
  return genEquilateral();
};

const genIsosceles = (): WordedQuestion => {
  for(let attempt=0;attempt<300;attempt++){
    const p=wri(2,4),q=wri(1,3),r=wri(1,p-1),s=wri(2,10),t=wri(1,3);
    const A1=p-r,B1=q,C1=s;
    let xVal=-1,yVal=-1;
    for(let yv=1;yv<=12;yv++){const num=C1-B1*yv;if(num>0&&num%A1===0){xVal=num/A1;yVal=yv;break;}}
    if(xVal<=0||yVal<=0) continue;
    const side1=p*xVal+q*yVal,side2=r*xVal+s,side3=t*yVal;
    if(Math.abs(side1-side2)>0.001||side3<=0) continue;
    const perim=side1+side2+side3;
    const A2=p+r,B2=q+t,C2=perim-s;
    if(A1*B2===B1*A2) continue;
    const eq1=`${wCStr(A1,"x")} + ${wCStr(B1,"y")} = ${C1}`;
    const eq2=`${wCStr(A2,"x")} + ${wCStr(B2,"y")} = ${C2}`;
    const s1=`${p}x + ${q}y`,s2=`${r===1?"":r}x + ${s}`,s3=`${t===1?"":t}y`;
    return {
      kind:"worded-simeq",
      lines:[
        `An isosceles triangle has sides of length $(${s1})$ cm, $(${s2})$ cm and $(${s3})$ cm.`,
        `The sides $(${s1})$ and $(${s2})$ are equal to each other.`,
        `The perimeter of the triangle is ${nv(perim)} cm.`,
        `Find the values of $x$ and $y$.`,
      ],
      equation1:eq1, equation2:eq2, v1:"x", v2:"y", v1Val:xVal, v2Val:yVal,
      answerLines:[`$x = ${xVal}$ and $y = ${yVal}$`],
      working:[
        {type:"tStep",latex:"\\text{Isosceles: the two stated sides are equal}",plain:""},
        {type:"step",latex:`${s1} = ${s2}`,plain:""},
        {type:"step",latex:eq1,plain:eq1},
        {type:"tStep",latex:"\\text{Perimeter = sum of all three sides}",plain:""},
        {type:"step",latex:`(${s1}) + (${s2}) + (${s3}) = ${perim}`,plain:""},
        {type:"step",latex:eq2,plain:eq2},
      ],
      key:`w3-isos-${p}-${q}-${r}-${s}-${t}-${xVal}-${yVal}`, difficulty:"level3", subType:"isosceles",
    };
  }
  return genIsosceles();
};

const genScalene = (): WordedQuestion => {
  for(let attempt=0;attempt<200;attempt++){
    const a=wri(1,4),b=wri(1,4),c=wri(1,3),d=wri(1,3);
    const xVal=wri(3,15),yVal=wri(3,15);
    const side1=a*xVal,side2=b*yVal,side3=c*xVal+d*yVal;
    if(side1<=0||side2<=0||side3<=0) continue;
    if(side1===side2||side1===side3||side2===side3) continue;
    const perim=side1+side2+side3;
    const e=wri(1,5),f=wri(1,5),anglesXY=e*xVal+f*yVal;
    const numerical=180-anglesXY;
    if(numerical<15||numerical>150||anglesXY>=180) continue;
    const A1=a+c,B1=b+d;
    const eq1=`${wCStr(A1,"x")} + ${wCStr(B1,"y")} = ${perim}`;
    const A2=e,B2=f,C2=180-numerical;
    const eq2=`${wCStr(A2,"x")} + ${wCStr(B2,"y")} = ${C2}`;
    if(A1*B2===B1*A2) continue;
    if(A1*xVal+B1*yVal!==perim||A2*xVal+B2*yVal!==C2) continue;
    const st1=`${a===1?"":a}x`,st2=`${b===1?"":b}y`,st3=`${c===1?"":c}x + ${d===1?"":d}y`;
    const ang1=`${e===1?"":e}x`,ang2=`${f===1?"":f}y`;
    return {
      kind:"worded-simeq",
      lines:[
        `A scalene triangle has sides of length $${st1}$ cm, $${st2}$ cm and $(${st3})$ cm.`,
        `The perimeter of the triangle is ${nv(perim)} cm.`,
        `Two of the angles are $${ang1}°$ and $${ang2}°$.`,
        `The third angle is ${nv(numerical)}°.`,
        `Find the values of $x$ and $y$.`,
      ],
      equation1:eq1, equation2:eq2, v1:"x", v2:"y", v1Val:xVal, v2Val:yVal,
      answerLines:[`$x = ${xVal}$ and $y = ${yVal}$`],
      working:[
        {type:"tStep",latex:"\\text{Perimeter = sum of all three sides}",plain:""},
        {type:"step",latex:`${st1} + ${st2} + (${st3}) = ${perim}`,plain:""},
        {type:"step",latex:eq1,plain:eq1},
        {type:"tStep",latex:"\\text{Angles in a triangle sum to } 180°",plain:""},
        {type:"step",latex:`${ang1} + ${ang2} + ${numerical} = 180`,plain:""},
        {type:"step",latex:eq2,plain:eq2},
      ],
      key:`w3-scal-${a}-${b}-${c}-${d}-${e}-${f}-${xVal}-${yVal}`, difficulty:"level3", subType:"scalene",
    };
  }
  return genScalene();
};

const generateWordedQuestion = (level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string): WordedQuestion => {
  if(level==="level1") return genLevel1Worded((dropdownValue as WordedMethod)||"direct");
  if(level==="level2"){
    const all: L2Type[] = ["sumDiff","moreThan","ratio"];
    const active = all.filter(t => variables[t] === true);
    const type = wpick(active.length > 0 ? active : all);
    if(type==="sumDiff") return genSumDiff();
    if(type==="moreThan") return genMoreThan();
    return genRatio();
  }
  const all: L3Type[] = ["purchase","equilateral","isosceles","scalene"];
  const active = all.filter(t => variables[t] === true);
  const type = wpick(active.length > 0 ? active : all);
  if(type==="purchase") return genPurchase();
  if(type==="equilateral") return genEquilateral();
  if(type==="isosceles") return genIsosceles();
  return genScalene();
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
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
        <span className="text-sm font-bold text-gray-400 w-8 text-right flex-shrink-0">({i+1})</span>
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

const WordedDisplay = ({ q, cls }: { q: WordedQuestion; cls: string }) => (
  <div className="flex flex-col items-center gap-1 w-full text-center">
    {q.lines.map((line, i) => (
      <div key={i} className={`${cls} font-semibold`} style={{ color: "#000", lineHeight: 1.6 }}>
        <InlineMath text={line} />
      </div>
    ))}
  </div>
);

const SimEqWorkedSteps = ({ q, stepBg, fsz }: { q: SimEqQuestion; stepBg: string; fsz: string }) => {
  const [v1, v2] = q.varPair;
  const isFactorScaling = !!q.scaleFactor, isLCM = !!q.scaleFactor1;
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
  const opExplain = q.caseType==="pos-neg"
    ? `The ${v1}-coefficients are equal and opposite — add ${q.operationDesc} to eliminate ${v1}.`
    : q.caseType==="pos-pos"
    ? `The ${v1}-coefficients are equal — subtract ${q.operationDesc} to eliminate ${v1}.`
    : `The ${v1}-coefficients are both negative — subtract ${q.operationDesc} to eliminate ${v1}.`;
  let stepNum=1; const steps:React.ReactNode[]=[];
  steps.push(card(`Step ${stepNum++} — Label the equations`,<EqPairLabelled q={q} cls={fsz}/>));
  if(q.eq1NeedsRearrange&&q.eq2NeedsRearrange){
    steps.push(card(`Step ${stepNum++} — Rearrange equation (1)`,<SingleEqCanonical latex={q.eq1Canonical} label="(1)" cls={fsz}/>));
    steps.push(card(`Step ${stepNum++} — Rearrange equation (2)`,<SingleEqCanonical latex={q.eq2Canonical} label="(2)" cls={fsz}/>));
  } else if(q.eq1NeedsRearrange){
    steps.push(card(`Step ${stepNum++} — Rearrange equation (1)`,<SingleEqCanonical latex={q.eq1Canonical} label="(1)" cls={fsz}/>));
  } else if(q.eq2NeedsRearrange){
    steps.push(card(`Step ${stepNum++} — Rearrange equation (2)`,<SingleEqCanonical latex={q.eq2Canonical} label="(2)" cls={fsz}/>));
  }
  if(isLCM&&q.scaledEq3Latex&&q.scaledEq4Latex){
    steps.push(card(`Step ${stepNum++} — Multiply equation (1) by ${q.scaleFactor1}`,mathLine(q.scaledEq3Latex,"(3)")));
    steps.push(card(`Step ${stepNum++} — Multiply equation (2) by ${q.scaleFactor2}`,mathLine(q.scaledEq4Latex,"(4)")));
  } else if(isFactorScaling&&q.scaledEqLatex){
    steps.push(card(`Step ${stepNum++} — Multiply equation (${q.scaleEq}) by ${q.scaleFactor}`,mathLine(q.scaledEqLatex,"(3)")));
  }
  steps.push(card(`Step ${stepNum++} — Eliminate ${v1}`,(
    <><p className="text-sm font-normal text-gray-500 mb-1 text-center">{opExplain}</p>{mathLine(q.afterElimLatex,q.operationDesc)}</>
  )));
  steps.push(card(`Step ${stepNum++} — Solve for ${v2}`,<>{q.solveVarSteps.map((s,i)=><div key={i}>{mathLine(s)}</div>)}</>));
  steps.push(card(`Step ${stepNum++} — Substitute ${v2} = ${q.v2Val} into equation (1)`,<>{q.subBackSteps.map((s,i)=><div key={i}>{mathLine(s)}</div>)}</>));
  steps.push(card("Solution",<div className="text-center"><MathRenderer latex={`${v1} = ${q.v1Val}, \\quad ${v2} = ${q.v2Val}`}/></div>));
  return <div className="space-y-4 mt-6">{steps}</div>;
};

const WordedWorkedSteps = ({ q, stepBg, fsz }: { q: WordedQuestion; stepBg: string; fsz: string }) => {
  const card = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl p-5" style={{ backgroundColor: stepBg }}>
      <h4 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wide">{title}</h4>
      <div className={`${fsz} font-semibold flex flex-col gap-2 items-center`} style={{ color: "#000" }}>{children}</div>
    </div>
  );
  const ml = (latex: string, label?: string) => (
    <div className="flex items-baseline gap-3 justify-center">
      {label && <span className="text-xs font-bold text-gray-400 w-16 text-right flex-shrink-0">{label}</span>}
      <MathRenderer latex={latex} />
    </div>
  );
  const { v1, v2, v1Val, v2Val, equation1, equation2, working } = q;
  const parseEq = (eq: string): { a: number; b: number; c: number } | null => {
    const re = /^(-?\d*)([a-z])\s*([+-])\s*(\d*)([a-z])\s*=\s*(-?\d+)$/;
    const m = eq.replace(/\s+/g,"").match(re);
    if (!m) return null;
    const a = m[1]===""||m[1]==="-"?parseInt(m[1]+"1"):parseInt(m[1]);
    const b = m[3]==="-"?-(m[4]===""?1:parseInt(m[4])):(m[4]===""?1:parseInt(m[4]));
    const c = parseInt(m[6]);
    return { a, b, c };
  };
  const buildElimSteps = (): React.ReactNode[] => {
    const p1 = parseEq(equation1), p2 = parseEq(equation2);
    if (!p1 || !p2) return [ml(`${v1} = ${v1Val},\\quad ${v2} = ${v2Val}`)];
    const { a: a1, b: b1, c: c1 } = p1;
    const { a: a2, b: b2, c: c2 } = p2;
    const steps: React.ReactNode[] = [];
    const g = gcd(Math.abs(a1), Math.abs(a2));
    const m1 = Math.abs(a2) / g, m2 = Math.abs(a1) / g;
    const sa1=a1*m1, sb1=b1*m1, sc1=c1*m1;
    const sa2=a2*m2, sb2=b2*m2, sc2=c2*m2;
    if (m1 === 1 && m2 === 1) {
      // no scaling needed
    } else if (m1 > 1 && m2 > 1) {
      steps.push(ml(`(1) \\times ${m1}: \\quad ${cStr(sa1,v1)} ${sa1>=0&&sb1>=0?"+":""} ${cStr(sb1,v2)} = ${sc1}`,"(3)"));
      steps.push(ml(`(2) \\times ${m2}: \\quad ${cStr(sa2,v1)} ${sa2>=0&&sb2>=0?"+":""} ${cStr(sb2,v2)} = ${sc2}`,"(4)"));
    } else if (m1 > 1) {
      steps.push(ml(`(1) \\times ${m1}: \\quad ${cStr(sa1,v1)} ${sa1>=0&&sb1>=0?"+":""} ${cStr(sb1,v2)} = ${sc1}`,"(3)"));
    } else {
      steps.push(ml(`(2) \\times ${m2}: \\quad ${cStr(sa2,v1)} ${sa2>=0&&sb2>=0?"+":""} ${cStr(sb2,v2)} = ${sc2}`,"(3)"));
    }
    const sameSign = (sa1 > 0 && sa2 > 0) || (sa1 < 0 && sa2 < 0);
    const remB = sameSign ? sb1 - sb2 : sb1 + sb2;
    const remC = sameSign ? sc1 - sc2 : sc1 + sc2;
    const op = sameSign ? "-" : "+";
    let lhsLabel: string, rhsLabel: string;
    if (m1 === 1 && m2 === 1) { lhsLabel = "(1)"; rhsLabel = "(2)"; }
    else if (m1 > 1 && m2 > 1) { lhsLabel = "(3)"; rhsLabel = "(4)"; }
    else if (m1 > 1) { lhsLabel = "(3)"; rhsLabel = "(2)"; }
    else { lhsLabel = "(1)"; rhsLabel = "(3)"; }
    const opSimple = `${lhsLabel} ${op} ${rhsLabel}`;
    steps.push(ml(`${opSimple}: \\quad ${cStr(remB,v2)} = ${remC}`));
    if (Math.abs(remB) !== 1) steps.push(ml(`${v2} = ${remC} \\div ${remB}`));
    steps.push(ml(`${v2} = ${v2Val}`));
    steps.push(ml(`\\text{Substitute } ${v2} = ${v2Val} \\text{ into (1):}`));
    const sub = b1 * v2Val;
    steps.push(ml(`${cStr(a1,v1)} ${b1>=0?"+":"-"} ${Math.abs(b1)}(${v2Val}) = ${c1}`));
    const rem1 = c1 - sub;
    if (Math.abs(a1) === 1) {
      steps.push(ml(`${v1} = ${rem1}`));
    } else {
      steps.push(ml(`${cStr(a1,v1)} = ${rem1}`));
      steps.push(ml(`${v1} = ${Math.round(rem1/a1)}`));
    }
    return steps;
  };
  const noteSteps = working.slice(1).filter(s => s.type === "tStep").slice(q.subType === "purchase" ? 1 : 0);
  let stepNum = 1;
  return (
    <div className="space-y-4 mt-6">
      {card(`Step ${stepNum++} — Define variables`, <>
        {working.filter(s => s.type === "tStep").slice(0, q.subType === "purchase" ? 2 : 1).map((s,i) => <div key={i}>{ml(s.latex)}</div>)}
      </>)}
      {noteSteps.length > 0 && card(`Step ${stepNum++} — Interpret the information`,
        <>{noteSteps.map((s,i) => <div key={i}><MathRenderer latex={s.latex}/></div>)}</>
      )}
      {card(`Step ${stepNum++} — Form the equations`, <>
        {ml(`(1) \\quad ${equation1}`)}
        {ml(`(2) \\quad ${equation2}`)}
      </>)}
      {card(`Step ${stepNum++} — Solve by elimination`, <>{buildElimSteps()}</>)}
      {card("Answer", <>
        {q.answerLines.map((line,i) => <div key={i} className="text-center"><InlineMath text={line}/></div>)}
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QO POPOVERS
// ═══════════════════════════════════════════════════════════════════════════════
const SimEqQOPopover = ({ level, opMode, setOpMode, allowNeg, setAllowNeg, rearrangeMode, setRearrangeMode }: {
  level: DifficultyLevel; opMode: OpMode; setOpMode: (v: OpMode) => void;
  allowNeg: boolean; setAllowNeg: (v: boolean) => void;
  rearrangeMode: RearrangeMode; setRearrangeMode: (v: RearrangeMode) => void;
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
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                {([["add","Addition"],["subtract","Subtraction"],["mixed","Mixed"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setOpMode(v)}
                    className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${opMode===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Rearranging</span>
            <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
              {([["none","None"],["one","One"],["both","Both"]] as const).map(([v,l]) => (
                <button key={v} onClick={() => setRearrangeMode(v)}
                  className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${rearrangeMode===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
            <TogglePill checked={allowNeg} onChange={setAllowNeg} label="Allow negative solutions" />
          </div>
        </div>
      )}
    </div>
  );
};

const WordedQOPopover = ({ level, wordedMethod, setWordedMethod, l2Types, setL2Types, l3Types, setL3Types }: {
  level: DifficultyLevel;
  wordedMethod: WordedMethod; setWordedMethod: (v: WordedMethod) => void;
  l2Types: L2Type[]; setL2Types: (v: L2Type[]) => void;
  l3Types: L3Type[]; setL3Types: (v: L3Type[]) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-4">
          {level === "level1" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Method</span>
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                {([["direct","Direct"],["scaling","Scaling"],["lcm","LCM"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setWordedMethod(v)}
                    className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${wordedMethod===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                ))}
              </div>
            </div>
          )}
          {level === "level2" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Types</span>
              <MultiSegButtons values={l2Types} onChange={v => setL2Types(v as L2Type[])}
                opts={[{value:"sumDiff",label:"Sum & Diff"},{value:"moreThan",label:"More Than"},{value:"ratio",label:"Ratio"}]} />
            </div>
          )}
          {level === "level3" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Types</span>
              <MultiSegButtons values={l3Types} onChange={v => setL3Types(v as L3Type[])}
                opts={[{value:"purchase",label:"Purchase"},{value:"equilateral",label:"Equilateral"},{value:"isosceles",label:"Isosceles"},{value:"scalene",label:"Scalene"}]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SimEqDiffQOPopover = ({ levelOps, setLevelOps, levelNeg, setLevelNeg, levelRearrange, setLevelRearrange }: {
  levelOps: Record<string,OpMode>; setLevelOps: (v: Record<string,OpMode>) => void;
  levelNeg: Record<string,boolean>; setLevelNeg: (v: Record<string,boolean>) => void;
  levelRearrange: Record<string,RearrangeMode>; setLevelRearrange: (v: Record<string,RearrangeMode>) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {(["level1","level2","level3"] as DifficultyLevel[]).map(lv => (
            <div key={lv} className="flex flex-col gap-2">
              <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
              <div className="flex flex-col gap-2 pl-1">
                {lv==="level1" && (
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                    {([["add","Add"],["subtract","Sub"],["mixed","Mix"]] as const).map(([v,l]) => (
                      <button key={v} onClick={() => setLevelOps({...levelOps,[lv]:v})}
                        className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${(levelOps[lv]??'mixed')===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                    ))}
                  </div>
                )}
                <TogglePill checked={levelNeg[lv]??false} onChange={v=>setLevelNeg({...levelNeg,[lv]:v})} label="Negative solutions" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rearranging</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                    {([["none","None"],["one","One"],["both","Both"]] as const).map(([v,l]) => (
                      <button key={v} onClick={() => setLevelRearrange({...levelRearrange,[lv]:v})}
                        className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${(levelRearrange[lv]??"none")===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WordedDiffQOPopover = ({ levelMethods, setLevelMethods, levelL2Types, setLevelL2Types, levelL3Types, setLevelL3Types }: {
  levelMethods: Record<string,WordedMethod>; setLevelMethods: (v: Record<string,WordedMethod>) => void;
  levelL2Types: Record<string,L2Type[]>; setLevelL2Types: (v: Record<string,L2Type[]>) => void;
  levelL3Types: Record<string,L3Type[]>; setLevelL3Types: (v: Record<string,L3Type[]>) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS["level1"]}`}>{LV_LABELS["level1"]}</span>
            <div className="pl-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Method</span>
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                {([["direct","Direct"],["scaling","Scaling"],["lcm","LCM"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setLevelMethods({...levelMethods,level1:v})}
                    className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${(levelMethods["level1"]??'direct')===v?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS["level2"]}`}>{LV_LABELS["level2"]}</span>
            <div className="pl-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question Types</span>
              <MultiSegButtons values={levelL2Types["level2"]??["sumDiff","moreThan","ratio"]} onChange={v=>setLevelL2Types({...levelL2Types,level2:v as L2Type[]})}
                opts={[{value:"sumDiff",label:"Sum & Diff"},{value:"moreThan",label:"More Than"},{value:"ratio",label:"Ratio"}]} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS["level3"]}`}>{LV_LABELS["level3"]}</span>
            <div className="pl-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question Types</span>
              <MultiSegButtons values={levelL3Types["level3"]??["purchase","equilateral","isosceles","scalene"]} onChange={v=>setLevelL3Types({...levelL3Types,level3:v as L3Type[]})}
                opts={[{value:"purchase",label:"Purchase"},{value:"equilateral",label:"Equilateral"},{value:"isosceles",label:"Isosceles"},{value:"scalene",label:"Scalene"}]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFO & MENU
// ═══════════════════════════════════════════════════════════════════════════════
const INFO_SECTIONS = [
  { title:"Elimination",icon:"➕",content:[
    {label:"Overview",detail:"One variable already has matching coefficient magnitudes. Add or subtract to eliminate it directly."},
    {label:"Level 1 — Green",detail:"At least one matching coefficient is positive. Use the QO selector to force addition, subtraction, or allow both."},
    {label:"Level 2 — Yellow",detail:"Both matching coefficients are negative."},
    {label:"Level 3 — Red",detail:"Full mixture of all three cases."},
  ]},
  { title:"Factor Scaling",icon:"✖️",content:[
    {label:"Overview",detail:"One coefficient is a direct multiple of the other. Scale one equation to match, then eliminate."},
    {label:"Level 1 — Green",detail:"At least one matching coefficient is positive."},
    {label:"Level 2 — Yellow",detail:"Both matching coefficients are negative."},
    {label:"Level 3 — Red",detail:"Full mixture of all three cases."},
  ]},
  { title:"LCM Scaling",icon:"🔢",content:[
    {label:"Overview",detail:"Neither coefficient divides the other. Scale both equations to their LCM, then eliminate."},
    {label:"Level 1 — Green",detail:"At least one matching coefficient is positive."},
    {label:"Level 2 — Yellow",detail:"Both matching coefficients are negative."},
    {label:"Level 3 — Red",detail:"Full mixture of all three cases."},
  ]},
  { title:"Forming & Solving",icon:"📝",content:[
    {label:"Overview",detail:"Worded problems where equations must be formed from context before solving."},
    {label:"Level 1 — Green",detail:"Both equations read directly from the prose. QO controls the elimination method used."},
    {label:"Level 2 — Yellow",detail:"Mix of sum/difference, 'more than', and ratio problems. At least one rearrangement required."},
    {label:"Level 3 — Red",detail:"Purchase contexts and triangle geometry (equilateral, isosceles, scalene). Students must identify and form both equations."},
  ]},
  { title:"Question Options",icon:"⚙️",content:[
    {label:"Operation (Elim Level 1)",detail:"Force addition, subtraction, or allow either."},
    {label:"Negative solutions",detail:"When on, variable values may be negative."},
    {label:"Rearranging",detail:"When on, one or both equations may be given in a rearranged form."},
    {label:"Method (Worded Level 1)",detail:"Controls the coefficient structure: Direct, Factor Scaling, or LCM."},
    {label:"Question Types (Worded L2/L3)",detail:"Toggle individual question types on/off. At least one must always be active."},
  ]},
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20}/></button>
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
  const FONT_PX=14,PAD_MM=3.5,MARGIN_MM=12,HEADER_MM=14,GAP_MM=2;
  const PAGE_H_MM=297-MARGIN_MM*2,PAGE_W_MM=210-MARGIN_MM*2;
  const usableH_MM=PAGE_H_MM-HEADER_MM,diffHdrMM=7;
  const cols=isDifferentiated?3:numColumns;
  const cellW_MM=isDifferentiated?(PAGE_W_MM-GAP_MM*2)/3:(PAGE_W_MM-GAP_MM*(numColumns-1))/numColumns;
  const difficultyLabel=isDifferentiated?"Differentiated":difficulty==="level1"?"Level 1":difficulty==="level2"?"Level 2":"Level 3";
  const dateStr=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const totalQ=questions.length;
  const toolName=subTool==="scaling"?"Factor Scaling":subTool==="lcm"?"LCM Scaling":subTool==="worded"?"Forming & Solving":"Elimination";

  const qData = questions.map((q: any, i: number) => {
    if (q.kind === "worded-simeq") {
      return { type:"worded", lines:q.lines as string[], answerLines:q.answerLines as string[], difficulty:q.difficulty, idx:i };
    }
    return { type:"simeq", eq1:q.eq1Display as string, eq2:q.eq2Display as string,
      v1:q.varPair[0] as string, v2:q.varPair[1] as string,
      v1Val:q.v1Val as number, v2Val:q.v2Val as number, difficulty:q.difficulty, idx:i };
  });

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
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.ph .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}
.cell,.dc{border:.3mm solid #d1d5db;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;}
.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}
.dcol{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.dh{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.dh.level1{background:#dcfce7;color:#166534;}.dh.level2{background:#fef9c3;color:#854d0e;}.dh.level3{background:#fee2e2;color:#991b1b;}
.qbanner{width:100%;padding:1.2mm 3mm;font-size:${Math.round(FONT_PX*0.72)}px;font-weight:700;color:#000;border-bottom:.3mm solid #000;text-align:center;flex-shrink:0;box-sizing:border-box;}
.qbody{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm;box-sizing:border-box;}
.instr{font-size:${Math.round(FONT_PX*0.8)}px;font-weight:600;color:#000;text-align:center;margin-bottom:1mm;}
.eq{display:flex;align-items:baseline;justify-content:center;margin:0.5mm 0;}
.em .katex{font-size:${FONT_PX}px;}
.wline{font-size:${FONT_PX}px;line-height:1.5;text-align:center;margin:0.5mm 0;}
.qa{font-size:${FONT_PX}px;color:#059669;text-align:center;margin-top:1.5mm;}
.qa .katex{font-size:${FONT_PX}px;}
.kr{display:inline;vertical-align:baseline;font-size:0.826em;}.kr .katex{font-size:1.21em;}
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
  function kEl(latex){var s=document.createElement("span");s.className="kr";kr(s,latex);return s;}

  function inlineEl(text){
    var span=document.createElement("span");
    var i=0;
    while(i<text.length){
      if(text[i]==="$"){
        var close=text.indexOf("$",i+1);
        if(close!==-1){span.appendChild(kEl(text.slice(i+1,close)));i=close+1;}
        else{span.appendChild(document.createTextNode(text[i]));i++;}
      } else {
        var next=text.indexOf("$",i);
        var end=next===-1?text.length:next;
        span.appendChild(document.createTextNode(text.slice(i,end)));
        i=end;
      }
    }
    return span;
  }

  function cellInner(item,showAns){
    var body=document.createElement("div");body.className="qbody";
    if(item.type==="simeq"){
      var instr=document.createElement("div");instr.className="instr";instr.textContent="Solve:";body.appendChild(instr);
      [item.eq1,item.eq2].forEach(function(eq){
        var row=document.createElement("div");row.className="eq";
        var m=document.createElement("span");m.className="em";m.appendChild(kEl(eq));row.appendChild(m);body.appendChild(row);
      });
      if(showAns){var a=document.createElement("div");a.className="qa";a.appendChild(kEl(item.v1+"="+item.v1Val+",\\\\quad "+item.v2+"="+item.v2Val));body.appendChild(a);}
    } else {
      item.lines.forEach(function(line){
        var d=document.createElement("div");d.className="wline";d.appendChild(inlineEl(line));body.appendChild(d);
      });
      if(showAns){item.answerLines.forEach(function(line){var d=document.createElement("div");d.className="qa";d.appendChild(inlineEl(line));body.appendChild(d);});}
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
  for(var rd2=1;rd2<=dpc;rd2++){var hd=(dUsable-GAP*(rd2-1))/rd2;if(hd>=needed){dRows=rd2;dCellH=hd;}}

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
  const [subTool, setSubTool] = useState<SubTool>("elimination");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  const [opMode, setOpMode] = useState<OpMode>("mixed");
  const [allowNeg, setAllowNeg] = useState(false);
  const [rearrangeMode, setRearrangeMode] = useState<RearrangeMode>("none");
  const [levelOps, setLevelOps] = useState<Record<string,OpMode>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelNeg, setLevelNeg] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [levelRearrange, setLevelRearrange] = useState<Record<string,RearrangeMode>>({level1:"none",level2:"none",level3:"none"});

  const [wordedMethod, setWordedMethod] = useState<WordedMethod>("direct");
  const [l2Types, setL2Types] = useState<L2Type[]>(["sumDiff","moreThan","ratio"]);
  const [l3Types, setL3Types] = useState<L3Type[]>(["purchase","equilateral","isosceles","scalene"]);
  const [levelMethods, setLevelMethods] = useState<Record<string,WordedMethod>>({level1:"direct",level2:"direct",level3:"direct"});
  const [levelL2Types, setLevelL2Types] = useState<Record<string,L2Type[]>>({level2:["sumDiff","moreThan","ratio"]});
  const [levelL3Types, setLevelL3Types] = useState<Record<string,L3Type[]>>({level3:["purchase","equilateral","isosceles","scalene"]});

  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
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
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current) videoRef.current.srcObject=null;
  },[]);

  const startCam = useCallback(async(deviceId?:string) => {
    stopStream(); setCamError(null);
    try {
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
  const fsQuestionBg=isDefault?"#ffffff":qBg;
  const fsWorkingBg=isDefault?"#f5f3f0":qBg;

  const makeVars = (neg: boolean, rm: RearrangeMode) => ({ allowNegSolutions: neg, rearrangeMode: rm as unknown as boolean });
  const makeWordedVars = useCallback((lv?: DifficultyLevel) => {
    if (!lv) {
      if (difficulty==="level2") return Object.fromEntries(l2Types.map(t=>[t,true]));
      if (difficulty==="level3") return Object.fromEntries(l3Types.map(t=>[t,true]));
      return {};
    }
    if (lv==="level2") return Object.fromEntries((levelL2Types[lv]??["sumDiff","moreThan","ratio"]).map(t=>[t,true]));
    if (lv==="level3") return Object.fromEntries((levelL3Types[lv]??["purchase","equilateral","isosceles","scalene"]).map(t=>[t,true]));
    return {};
  }, [difficulty, l2Types, l3Types, levelL2Types, levelL3Types]);

  const getCurrentVars = useCallback(() =>
    subTool === "worded" ? makeWordedVars() : makeVars(allowNeg, rearrangeMode)
  , [subTool, makeWordedVars, allowNeg, rearrangeMode]);

  const genQ = (st:SubTool,lv:DifficultyLevel,vars:Record<string,boolean>,om:OpMode,wm:WordedMethod):AnyQuestion =>
    st==="scaling" ? generateScaling(lv,vars,om)
    : st==="lcm"   ? generateLCM(lv,vars,om)
    : st==="worded"? generateWordedQuestion(lv,vars,wm)
    : generateElimination(lv,vars,om);

  const genUniqueQ = (st:SubTool,lv:DifficultyLevel,vars:Record<string,boolean>,om:OpMode,wm:WordedMethod,used:Set<string>):AnyQuestion => {
    if(st==="worded"){let q:AnyQuestion,a=0;do{q=generateWordedQuestion(lv,vars,wm);a++;}while(used.has(q.key)&&a<100);used.add(q.key);return q;}
    let q:AnyQuestion,a=0;
    const gen=()=>st==="scaling"?generateScaling(lv,vars,om):st==="lcm"?generateLCM(lv,vars,om):generateElimination(lv,vars,om);
    do{q=gen();a++;}while(used.has(q.key)&&a<100);used.add(q.key);return q;
  };

  const handleNewQuestion = useCallback(() => {
    const q = genQ(subTool, difficulty, getCurrentVars(), opMode, wordedMethod);
    setCurrentQuestion(q); setShowWhiteboardAnswer(false); setShowAnswer(false);
  }, [subTool, difficulty, getCurrentVars, opMode, wordedMethod]);

  const handleGenerateWorksheet = () => {
    const usedKeys=new Set<string>(),questions:AnyQuestion[]=[];
    if(isDifferentiated){
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv=>{
        const vars=subTool==="worded"?makeWordedVars(lv):makeVars(levelNeg[lv]??false,(levelRearrange[lv]??"none") as RearrangeMode);
        const om=levelOps[lv]??"mixed" as OpMode;
        const wm=(levelMethods[lv]??"direct") as WordedMethod;
        for(let i=0;i<numQuestions;i++) questions.push(genUniqueQ(subTool,lv,vars,om,wm,usedKeys));
      });
    } else {
      const vars=subTool==="worded"?makeWordedVars():makeVars(allowNeg,rearrangeMode);
      for(let i=0;i<numQuestions;i++) questions.push(genUniqueQ(subTool,difficulty,vars,opMode,wordedMethod,usedKeys));
    }
    setWorksheet(questions); setShowWorksheetAnswers(false);
  };

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); setDisplayFontSize(subTool==="worded"?1:2); },[difficulty,subTool]);

  const displayFontSizes=["text-xl","text-2xl","text-3xl","text-4xl","text-5xl","text-6xl"];
  const instrFontSizes  =["text-base","text-lg","text-xl","text-2xl","text-3xl","text-4xl"];
  const fontSizes=["text-base","text-lg","text-xl","text-2xl","text-3xl"];
  const canDI=displayFontSize<displayFontSizes.length-1,canDD=displayFontSize>0;
  const canInc=worksheetFontSize<fontSizes.length-1,canDec=worksheetFontSize>0;
  const fontBtnStyle=(en:boolean):CSSProperties=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:en?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:en?1:0.35});

  const isWorded = subTool === "worded";

  const renderQOPopover = (diff=false) => {
    if(isWorded) {
      if(diff) return <WordedDiffQOPopover levelMethods={levelMethods} setLevelMethods={setLevelMethods} levelL2Types={levelL2Types} setLevelL2Types={setLevelL2Types} levelL3Types={levelL3Types} setLevelL3Types={setLevelL3Types}/>;
      return <WordedQOPopover level={difficulty} wordedMethod={wordedMethod} setWordedMethod={setWordedMethod} l2Types={l2Types} setL2Types={setL2Types} l3Types={l3Types} setL3Types={setL3Types}/>;
    }
    if(diff) return <SimEqDiffQOPopover levelOps={levelOps} setLevelOps={setLevelOps} levelNeg={levelNeg} setLevelNeg={setLevelNeg} levelRearrange={levelRearrange} setLevelRearrange={setLevelRearrange}/>;
    return <SimEqQOPopover level={difficulty} opMode={opMode} setOpMode={setOpMode} allowNeg={allowNeg} setAllowNeg={setAllowNeg} rearrangeMode={rearrangeMode} setRearrangeMode={setRearrangeMode}/>;
  };

  const renderQCell = (q:AnyQuestion,idx:number,bgOverride?:string) => {
    const bg=bgOverride??stepBg,fsz=fontSizes[worksheetFontSize];
    const instrFsz=fontSizes[Math.max(0,worksheetFontSize-1)];
    if(q.kind==="worded-simeq") {
      const wq=q as WordedQuestion;
      return (
        <div style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative",padding:"24px 10px 8px",borderRadius:"12px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
          <span style={{position:"absolute",top:0,left:0,fontSize:"0.62em",fontWeight:700,color:"#000",padding:"2px 3px 4px 3px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
          <div className={`${fsz} font-semibold text-center`} style={{color:"#000",lineHeight:1.6}}>
            {wq.lines.map((line,i)=><div key={i}><InlineMath text={line}/></div>)}
          </div>
          {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            {wq.answerLines.map((line,i)=><div key={i}><InlineMath text={line}/></div>)}
          </div>}
        </div>
      );
    }
    const simQ=q as SimEqQuestion,[v1,v2]=simQ.varPair;
    return (
      <div style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative",padding:"8px 8px 8px 22px",borderRadius:"12px"}}>
        <span style={{position:"absolute",top:0,left:0,fontSize:"0.62em",fontWeight:700,color:"#000",padding:"2px 3px 4px 3px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
        <div className="flex flex-col items-center gap-1 w-full">
          <span className={`${instrFsz} font-semibold`} style={{color:"#000"}}>Solve:</span>
          {[simQ.eq1Display,simQ.eq2Display].map((eq,i)=>(
            <div key={i} className="flex items-baseline justify-center">
              <span className={`${fsz} font-semibold`} style={{color:"#000"}}><MathRenderer latex={eq}/></span>
            </div>
          ))}
          {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            <MathRenderer latex={`${v1} = ${simQ.v1Val}, \\quad ${v2} = ${simQ.v2Val}`}/>
          </div>}
        </div>
      </div>
    );
  };

  const renderControlBar = () => {
    if(mode==="worksheet") return (
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
            <button onClick={()=>handlePrint(worksheet,difficulty,isDifferentiated,numColumns,subTool)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18}/> Print / PDF</button>
          </>}
        </div>
      </div>
    );
    return (
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

  const renderQuestionContent = (showAns: boolean) => {
    if(!currentQuestion) return null;
    if(currentQuestion.kind==="worded-simeq") {
      const wq=currentQuestion as WordedQuestion;
      return (
        <>
          <WordedDisplay q={wq} cls={displayFontSizes[displayFontSize]}/>
          {showAns && wq.answerLines.map((line,i)=>(
            <div key={i} className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}>
              <InlineMath text={line}/>
            </div>
          ))}
        </>
      );
    }
    const simQ=currentQuestion as SimEqQuestion,[v1,v2]=simQ.varPair;
    return (
      <>
        <div className={`${instrFontSizes[displayFontSize]} font-semibold text-center w-full`} style={{color:"#000"}}>Solve:</div>
        <EqPair q={simQ} cls={displayFontSizes[displayFontSize]}/>
        {showAns&&<div className={`${displayFontSizes[displayFontSize]} font-bold text-center`} style={{color:"#166534"}}>
          <MathRenderer latex={`${v1} = ${simQ.v1Val}, \\quad ${v2} = ${simQ.v2Val}`}/>
        </div>}
      </>
    );
  };

  const renderWhiteboard = () => {
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
      <div style={{position:"relative",width:isFS?"40%":"480px",height:"100%",backgroundColor:isFS?fsQuestionBg:stepBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isFS?48:32,boxSizing:"border-box",flexShrink:0,gap:12,borderRadius:isFS?0:"12px"}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {renderQuestionContent(showWhiteboardAnswer)}
      </div>
    );
    const rightPanel=(isFS:boolean)=>(
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
    if(wbFullscreen) return(
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

  const renderWorkedExample = () => {
    if(!currentQuestion) return null;
    return(
      <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
        <div className="p-8" style={{backgroundColor:qBg}}>
          <div className="relative">
            <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
              <button style={fontBtnStyle(canDD)} onClick={()=>canDD&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
              <button style={fontBtnStyle(canDI)} onClick={()=>canDI&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
            </div>
            <div className="py-2 flex flex-col items-center gap-3">
              {renderQuestionContent(false)}
            </div>
          </div>
          {showAnswer && (
            currentQuestion.kind==="worded-simeq"
              ? <WordedWorkedSteps q={currentQuestion as WordedQuestion} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]}/>
              : <SimEqWorkedSteps q={currentQuestion as SimEqQuestion} stepBg={stepBg} fsz={displayFontSizes[displayFontSize]}/>
          )}
        </div>
      </div>
    );
  };

  const renderWorksheet = () => {
    if(worksheet.length===0) return(
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
    const subToolLabel=subTool==="scaling"?"Factor Scaling":subTool==="lcm"?"LCM Scaling":subTool==="worded"?"Forming & Solving":"Elimination";
    if(isDifferentiated) return(
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{subToolLabel} — Worksheet</h2>
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
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{subToolLabel} — Worksheet</h2>
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
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
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
          <h1 className="text-5xl font-bold text-center mb-8" style={{color:"#000"}}>Simultaneous Equations</h1>
          <div className="flex justify-center mb-6"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {([["elimination","Elimination"],["scaling","Factor Scaling"],["lcm","LCM Scaling"],["worded","Forming & Solving"]] as const).map(([st,label])=>(
              <button key={st} onClick={()=>{setSubTool(st);setWorksheet([]);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${subTool===st?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
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
