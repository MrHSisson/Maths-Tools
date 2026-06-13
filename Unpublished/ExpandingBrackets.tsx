import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── KATEX ─────────────────────────────────────────────────────────────────────
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

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "expand" | "simplify" | "double";
type DifficultyLevel = "level1" | "level2" | "level3";
type MultiplierType = "numerical" | "algebraic" | "mixed";

const TOOL_CONFIG = {
  pageTitle: "Expanding Brackets",
  tools: {
    expand: {
      name: "Expand Single",
      instruction: "Expand:",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: {
        key: "method",
        label: "Method",
        useTwoLineButtons: false,
        options: [
          { value: "foil",      label: "FOIL"      },
          { value: "grid",      label: "Grid"      },
          { value: "both",      label: "Both"      },
          { value: "numerical", label: "Numerical" },
          { value: "algebraic", label: "Algebraic" },
          { value: "mixed",     label: "Mixed"     },
        ],
        defaultValue: "foil",
      },
      multiSelect: null,
      difficultySettings: null,
    },
    simplify: {
      name: "Expand & Simplify",
      instruction: "Expand and simplify:",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: {
        key: "method",
        label: "Method",
        useTwoLineButtons: false,
        options: [
          { value: "foil",      label: "FOIL"      },
          { value: "grid",      label: "Grid"      },
          { value: "both",      label: "Both"      },
          { value: "numerical", label: "Numerical" },
          { value: "algebraic", label: "Algebraic" },
          { value: "mixed",     label: "Mixed"     },
        ],
        defaultValue: "foil",
      },
      multiSelect: null,
      difficultySettings: null,
    },
    double: {
      name: "Expand Double",
      instruction: "Expand:",
      useSubstantialBoxes: false,
      variables: [],
      dropdown: {
        key: "method",
        label: "Method",
        useTwoLineButtons: false,
        options: [
          { value: "foil", label: "FOIL" },
          { value: "grid", label: "Grid" },
          { value: "both", label: "Both" },
        ],
        defaultValue: "foil",
      },
      multiSelect: null,
      difficultySettings: null,
    },
  } as Record<string, {
    name: string;
    instruction?: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
    multiSelect: null;
    difficultySettings: null;
  }>,
};

const INFO_SECTIONS = [
  { title: "Expand Single", icon: "📐", content: [
    { label: "Overview",         detail: "Expand a single bracket by multiplying the outside term by each term inside." },
    { label: "Level 1 — Green",  detail: "Positive multiplier, one variable term and one positive constant." },
    { label: "Level 2 — Yellow", detail: "Includes negative constants or reversed bracket order." },
    { label: "Level 3 — Red",    detail: "Negative multipliers and a mix of positive/negative terms." },
    { label: "Method",           detail: "FOIL shows curved arrows. Grid shows a 1×2 multiplication table. Both shows both diagrams." },
    { label: "Multiplier",       detail: "Numerical (number outside), Algebraic (variable outside), or Mixed." },
  ]},
  { title: "Expand & Simplify", icon: "➕", content: [
    { label: "Overview",         detail: "Expand two single brackets then collect like terms." },
    { label: "Level 1 — Green",  detail: "Two positive brackets added together." },
    { label: "Level 2 — Yellow", detail: "Includes subtraction between the two expanded expressions." },
    { label: "Level 3 — Red",    detail: "Negative multipliers and mixed subtraction." },
    { label: "Method",           detail: "Each bracket gets its own FOIL or Grid diagram." },
  ]},
  { title: "Expand Double", icon: "🔢", content: [
    { label: "Overview",         detail: "Expand two linear brackets using FOIL or the Grid method." },
    { label: "Level 1 — Green",  detail: "Leading coefficient 1, positive constants." },
    { label: "Level 2 — Yellow", detail: "Leading coefficient 1, positive and negative constants." },
    { label: "Level 3 — Red",    detail: "Non-unit leading coefficients and mixed signs." },
    { label: "Method",           detail: "FOIL shows four coloured arcs. Grid shows a 2×2 multiplication table." },
  ]},
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FoilData {
  a: number; b: number; c: number;
  isReversed: boolean; withVariable: boolean; outsidePower: number;
  varName: string; xCoeff: number; x2Coeff: number; x3Coeff: number; constant: number;
}

interface SingleQuestion {
  kind: "single";
  display: string; answer: string;
  working: { type: string; content: string; foilData?: FoilData }[];
  key: string; difficulty: string;
  a: number; b: number; c: number; isReversed: boolean; withVariable: boolean;
  outsidePower: number; varName: string; xCoeff: number; x2Coeff: number;
  x3Coeff: number; constant: number;
  _qo?: unknown;
}

interface SimplifyQuestion {
  kind: "simplify";
  display: string; answer: string;
  working: { type: string; content: string; foilData?: FoilData }[];
  key: string; difficulty: string;
  q1: SingleQuestion; q2: SingleQuestion; operator: string; varName: string;
  _qo?: unknown;
}

interface DoubleQuestion {
  kind: "double";
  display: string; answer: string;
  working: { type: string; content: string }[];
  key: string; difficulty: string;
  values: { a: number; b: number; c: number; d: number };
  _qo?: unknown;
}

type AnyQuestion = SingleQuestion | SimplifyQuestion | DoubleQuestion;

// ── LaTeX helpers ─────────────────────────────────────────────────────────────

// Convert a coefficient+variable into a LaTeX string (no leading sign)
const termLatex = (coeff: number, variable = ""): string => {
  const abs = Math.abs(coeff);
  if (!variable) return String(abs);
  if (abs === 1) return variable;
  return `${abs}${variable}`;
};

// Full signed term for use mid-expression: e.g. " + 3x" or " - 2"
const signedLatex = (coeff: number, variable = "", isFirst = false): string => {
  if (coeff === 0) return "";
  const sign = coeff < 0 ? (isFirst ? "-" : "-") : (isFirst ? "" : "+");
  return `${sign}${termLatex(coeff, variable)}`;
};

// Build a LaTeX string for one bracket term as it appears in the display: e.g. ax, +b
const bracketFirstTermLatex = (n: number, varPow: string): string => {
  if (n === 1)  return varPow;
  if (n === -1) return `-${varPow}`;
  return `${n < 0 ? "-" : ""}${Math.abs(n)}${varPow}`;
};
const bracketSecondTermLatex = (n: number): string =>
  n >= 0 ? `+${n}` : `-${Math.abs(n)}`;

// Full question display as LaTeX
const singleDisplayLatex = (q: SingleQuestion): string => {
  const v = q.varName;
  if (q.withVariable) {
    const pow = q.outsidePower === 2 ? `${v}^2` : v;
    const aTerm = bracketFirstTermLatex(q.a, pow);
    const bTerm = bracketFirstTermLatex(q.b, v);
    const cTerm = bracketSecondTermLatex(q.c);
    return `${aTerm}(${bTerm}${cTerm})`;
  }
  if (q.isReversed) {
    const bTerm = q.b === 1 ? v : `${q.b}${v}`;
    return `${bracketFirstTermLatex(q.a, "")}(${q.c}-${bTerm})`;
  }
  const bTerm = bracketFirstTermLatex(q.b, v);
  const cTerm = bracketSecondTermLatex(q.c);
  return `${bracketFirstTermLatex(q.a, "")}(${bTerm}${cTerm})`;
};

const doubleDisplayLatex = (q: DoubleQuestion): string => {
  const { a, b, c, d } = q.values;
  const t1 = bracketFirstTermLatex(a, "x");
  const t2 = bracketSecondTermLatex(b);
  const t3 = bracketFirstTermLatex(c, "x");
  const t4 = bracketSecondTermLatex(d);
  return `(${t1}${t2})(${t3}${t4})`;
};

// Answer as LaTeX
const singleAnswerLatex = (q: SingleQuestion): string => {
  const v = q.varName;
  if (q.withVariable) {
    if (q.outsidePower === 2) {
      return signedLatex(q.x3Coeff, `${v}^3`, true) + signedLatex(q.x2Coeff, `${v}^2`);
    }
    return signedLatex(q.x2Coeff, `${v}^2`, true) + signedLatex(q.xCoeff, v);
  }
  return signedLatex(q.xCoeff, v, true) + signedLatex(q.constant);
};

const doubleAnswerLatex = (q: DoubleQuestion): string => {
  const { a, b, c, d } = q.values;
  const x2C = a * c, xC = a * d + b * c, con = b * d;
  return signedLatex(x2C, "x^2", true) + signedLatex(xC, "x") + signedLatex(con);
};

// ── Question generators ───────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandVar = () => ["x","y","a","b","p","q","r","s","t","n","m"][Math.floor(Math.random()*11)];

const formatSingleAnswer = (xCoeff: number, constant: number, varName: string): string => {
  let ans = "";
  if (xCoeff > 0 && constant < 0) ans = (xCoeff===1?varName:xCoeff+varName)+" − "+Math.abs(constant);
  else if (xCoeff < 0 && constant > 0) ans = constant+(xCoeff===-1?" − "+varName:" − "+Math.abs(xCoeff)+varName);
  else {
    if (xCoeff===1) ans=varName; else if (xCoeff===-1) ans="−"+varName; else if (xCoeff!==0) ans=xCoeff+varName;
    if (constant!==0) { if (ans) ans+=constant>0?" + "+constant:" − "+Math.abs(constant); else ans=String(constant); }
  }
  return ans||"0";
};

// Extract multiplier from combined dropdown value
const getMultiplier = (dropdownValue: string): MultiplierType => {
  if (dropdownValue === "numerical" || dropdownValue === "algebraic" || dropdownValue === "mixed") return dropdownValue;
  return "numerical";
};

const getMethod = (dropdownValue: string): string => {
  if (dropdownValue === "grid" || dropdownValue === "both") return dropdownValue;
  return "foil";
};

const genExpandQuestion = (level: DifficultyLevel, multiplier: MultiplierType, forcedVar: string|null=null): SingleQuestion => {
  let a=0,b=0,c=0,isReversed=false;
  const varName = forcedVar||getRandVar();
  const useVar = multiplier==="algebraic"?true:multiplier==="mixed"?Math.random()>0.5:false;
  const outsidePower = useVar?(Math.random()>0.5?1:2):0;
  if (level==="level1") { a=randInt(2,10); b=randInt(1,5); c=randInt(0,9); }
  else if (level==="level2") {
    a=randInt(2,10);
    if (Math.random()>0.5) { b=randInt(1,9); c=randInt(1,9); isReversed=true; }
    else { b=randInt(1,9); c=randInt(-9,-1); }
  } else {
    a=randInt(-10,10); if(a===0)a=-1;
    b=randInt(-5,5); if(b===0)b=1;
    c=randInt(-9,9);
  }
  let xCoeff=0,x2Coeff=0,x3Coeff=0,constant=0;
  if (useVar) { if(outsidePower===1){x2Coeff=a*b;xCoeff=a*c;}else{x3Coeff=a*b;x2Coeff=a*c;} }
  else { xCoeff=isReversed?a*(-b):a*b; constant=a*c; }
  const v=varName;
  let display="";
  if (useVar) {
    const aTerm=a===1?v+(outsidePower===2?"²":""):a===-1?"−"+v+(outsidePower===2?"²":""):a+v+(outsidePower===2?"²":"");
    const bTerm=b===1?v:b===-1?"−"+v:b+v;
    const cTerm=c===0?"":(c>0?" + "+c:" − "+Math.abs(c));
    display=aTerm+"("+bTerm+cTerm+")";
  } else {
    if(isReversed){display=(a===1?"":a===-1?"−":a)+"("+c+" − "+(b===1?v:b+v)+")";}
    else{const bTerm=b===1?v:b===-1?"−"+v:b+v;const cTerm=c===0?"":(c>0?" + "+c:" − "+Math.abs(c));display=(a===1?"":a===-1?"−":a)+"("+bTerm+cTerm+")";}
  }
  let answer="";
  if (useVar) {
    if(outsidePower===2){
      answer=x3Coeff===1?v+"³":x3Coeff===-1?"−"+v+"³":x3Coeff+v+"³";
      if(x2Coeff!==0){if(x2Coeff>0)answer+=" + "+(x2Coeff===1?v+"²":x2Coeff+v+"²");else answer+=" − "+(Math.abs(x2Coeff)===1?v+"²":Math.abs(x2Coeff)+v+"²");}
    } else {
      answer=x2Coeff===1?v+"²":x2Coeff===-1?"−"+v+"²":x2Coeff+v+"²";
      if(xCoeff!==0){if(xCoeff>0)answer+=" + "+(xCoeff===1?v:xCoeff+v);else answer+=" − "+(Math.abs(xCoeff)===1?v:Math.abs(xCoeff)+v);}
    }
  } else { answer=formatSingleAnswer(xCoeff,constant,varName); }
  const foilData:FoilData={a,b,c,isReversed,withVariable:useVar,outsidePower,varName,xCoeff,x2Coeff,x3Coeff,constant};
  return { kind:"single", display, answer,
    working:[{type:"foil",content:"Multiply the outside term by each term in the bracket",foilData}],
    key:`expand-${level}-${a}-${b}-${c}-${varName}-${useVar}-${Math.random()}`,
    difficulty:level, a,b,c,isReversed,withVariable:useVar,outsidePower,varName,xCoeff,x2Coeff,x3Coeff,constant };
};

const combineTerms = (q1: SingleQuestion, q2: SingleQuestion, operator: string, varName: string): string => {
  let x3_1=0,x2_1=0,x_1=0,c_1=0,x3_2=0,x2_2=0,x_2=0,c_2=0;
  if(q1.withVariable){x3_1=q1.x3Coeff||0;x2_1=q1.x2Coeff||0;x_1=q1.xCoeff||0;c_1=q1.constant||0;}
  else{x_1=q1.a*q1.b*(q1.isReversed?-1:1);c_1=q1.a*q1.c;}
  if(q2.withVariable){x3_2=q2.x3Coeff||0;x2_2=q2.x2Coeff||0;x_2=q2.xCoeff||0;c_2=q2.constant||0;}
  else{x_2=q2.a*q2.b*(q2.isReversed?-1:1);c_2=q2.a*q2.c;}
  const m=operator==="+"?1:-1;
  const fX3=x3_1+m*x3_2,fX2=x2_1+m*x2_2,fX=x_1+m*x_2,fC=c_1+m*c_2;
  let result="";
  if(fX3!==0)result=fX3===1?varName+"³":fX3===-1?"−"+varName+"³":fX3+varName+"³";
  if(fX2!==0){if(result)result+=fX2>0?" + ":" − ";result+=Math.abs(fX2)===1?varName+"²":Math.abs(fX2)+varName+"²";}
  if(fX!==0){if(result)result+=fX>0?" + ":" − ";result+=Math.abs(fX)===1?varName:Math.abs(fX)+varName;}
  if(fC!==0){if(result)result+=fC>0?" + "+fC:" − "+Math.abs(fC);else result=String(fC);}
  return result||"0";
};

const genSimplifyQuestion = (level: DifficultyLevel, multiplier: MultiplierType): SimplifyQuestion => {
  const varName=getRandVar();
  const q1=genExpandQuestion(level==="level1"?"level1":level==="level2"?"level1":"level3",multiplier,varName);
  const q2=genExpandQuestion(level==="level1"?"level1":level==="level2"?(Math.random()>0.5?"level1":"level2"):(Math.random()>0.5?"level1":"level2"),multiplier,varName);
  const operator=level==="level1"?"+":(Math.random()>0.5?"+":"−");
  const working=[
    {type:"foil",content:"Expand first bracket: "+q1.display,foilData:{...q1}},
    {type:"foil",content:"Expand second bracket: "+q2.display,foilData:{...q2}},
    {type:"step",content:"Combine like terms: ("+q1.answer+") "+operator+" ("+q2.answer+")"},
  ];
  return { kind:"simplify", display:q1.display+" "+operator+" "+q2.display,
    answer:combineTerms(q1,q2,operator,varName), working, q1, q2, operator, varName,
    key:`simplify-${level}-${Math.random()}`, difficulty:level };
};

const genDoubleQuestion = (level: DifficultyLevel): DoubleQuestion => {
  let a=0,b=0,c=0,d=0;
  if(level==="level1"){a=1;b=randInt(1,9);c=1;d=randInt(1,9);}
  else if(level==="level2"){
    a=1;b=randInt(-9,9);c=1;d=randInt(-9,9);
    if(b===0)b=1;if(d===0)d=1;
    if(b>0&&d>0){if(Math.random()<0.5)b=-b;else d=-d;}
  } else {
    a=randInt(1,5);b=randInt(-7,7);if(b===0)b=1;
    c=randInt(1,5);d=randInt(-7,7);if(d===0)d=1;
    if(Math.random()<0.3){if(Math.random()<0.5)a=-a;else c=-c;}
  }
  const x2C=a*c,xC=a*d+c*b,con=b*d;
  const fSign=(val:number,isF=false)=>isF?(val<0?"−":""):(val<0?" − ":" + ");
  const fTerm=(n:number,va="")=>{const abs=Math.abs(n);if(va)return abs===1?va:abs+va;return abs.toString();};
  let display="(";
  if(a===1)display+="x";else if(a===-1)display+="−x";else display+=(a<0?"−":"")+Math.abs(a)+"x";
  display+=b>=0?" + "+b:" − "+Math.abs(b);display+=")(";
  if(c===1)display+="x";else if(c===-1)display+="−x";else display+=(c<0?"−":"")+Math.abs(c)+"x";
  display+=d>=0?" + "+d:" − "+Math.abs(d);display+=")";
  let answer="",isF=true;
  if(x2C!==0){answer+=fSign(x2C,true)+fTerm(x2C,"x²");isF=false;}
  if(xC!==0){answer+=fSign(xC,isF)+fTerm(xC,"x");isF=false;}
  if(con!==0||isF)answer+=fSign(con,isF)+Math.abs(con);
  return { kind:"double", display, answer,
    working:[{type:"foil",content:"Use FOIL/Grid method to expand the brackets"}],
    values:{a,b,c,d}, key:`double-${level}-${a}-${b}-${c}-${d}-${Math.random()}`, difficulty:level };
};

const generateQuestion = (tool: ToolType, level: DifficultyLevel, _variables: Record<string,boolean>, dropdownValue: string): AnyQuestion => {
  if (tool==="expand")   return genExpandQuestion(level, getMultiplier(dropdownValue));
  if (tool==="simplify") return genSimplifyQuestion(level, getMultiplier(dropdownValue));
  return genDoubleQuestion(level);
};

const generateUniqueQ = (tool: ToolType, level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion; let attempts=0;
  do { q=generateQuestion(tool,level,variables,dropdownValue); attempts++; }
  while (usedKeys.has(q.key)&&attempts<100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FOIL + GRID DIAGRAM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── useMeasuredWidths: renders terms invisibly, returns their pixel widths ────
const useMeasuredWidths = (latexTerms: string[], fontSize: number): number[] => {
  const [widths, setWidths] = useState<number[]>([]);
  const refs = useRef<(HTMLSpanElement|null)[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready) return;
    refs.current = refs.current.slice(0, latexTerms.length);
    // Allow one frame for KaTeX to render
    requestAnimationFrame(() => {
      const w = refs.current.map(r => r ? r.getBoundingClientRect().width : 60);
      setWidths(w);
    });
  }, [latexTerms.join("|"), ready, fontSize]);

  const probeEl = (
    <div style={{ position:"fixed", left:-9999, top:0, visibility:"hidden", fontSize, lineHeight:1 }}>
      {latexTerms.map((lt, i) => (
        <span key={i} ref={el => { refs.current[i]=el; }} style={{ display:"inline-block" }}>
          <MathRenderer latex={lt} style={{ fontSize: "1em" }} />
        </span>
      ))}
    </div>
  );
  return [widths, probeEl] as any;
};

// ── Single bracket FOIL diagram ───────────────────────────────────────────────
const SFoilDisplay = ({ q }: { q: SingleQuestion | FoilData }) => {
  const fd = q as any;
  const v = fd.varName||"x";

  // Build LaTeX for each visible slot: [outside, term1, term2, result1, result2]
  const outsideLx = fd.withVariable
    ? bracketFirstTermLatex(fd.a, fd.outsidePower===2?`${v}^2`:v)
    : String(fd.a);
  const term1Lx = fd.isReversed ? String(fd.c) : bracketFirstTermLatex(fd.b, v);
  const term2Lx = fd.isReversed
    ? `-${fd.b===1?v:`${fd.b}${v}`}`
    : bracketSecondTermLatex(fd.c);

  let res1Lx="", res2Lx="";
      if (fd.withVariable) {
    if (fd.outsidePower===2) {
      res1Lx=signedLatex(fd.x3Coeff,`${v}^3`,true);
      res2Lx=signedLatex(fd.x2Coeff,`${v}^2`,false);
    } else {
      res1Lx=signedLatex(fd.x2Coeff,`${v}^2`,true);
      res2Lx=signedLatex(fd.xCoeff,v,false);
    }
  } else {
    res1Lx=signedLatex(fd.xCoeff,v,true);
    res2Lx=signedLatex(fd.constant,"",false);
  }

  const allTerms = [outsideLx, term1Lx, term2Lx, res1Lx, res2Lx];
  const [rawWidths, probeEl] = useMeasuredWidths(allTerms, 28) as [number[], React.ReactNode];
  const widths = rawWidths.length===5 ? rawWidths : [60,60,60,60,60];

  const PAD=24, BRACE=18, GAP=8;
  const slotW = (i:number) => (widths[i]||60)+PAD*2;
  const outsideW=slotW(0), t1W=slotW(1), t2W=slotW(2);

  // x-centres
  const cx0 = outsideW/2;
  const openBrace1 = outsideW;
  const cx1 = openBrace1+BRACE+t1W/2;
  const cx2 = cx1+t1W/2+GAP+t2W/2;
  const closeBrace1 = cx2+t2W/2;
  const totalW = closeBrace1+BRACE+20;
  const CURVE=52;
  const BRACKET_Y=CURVE+24; // y of bracket row centre — arrows originate here
  const SVG_H=BRACKET_Y+20;

  const CHAR_HALF=14, OFFSET=3;
  const CurvedArrow = ({x1,x2,color}:{x1:number;x2:number;color:string}) => {
    const yBase=BRACKET_Y;
    const yAttach=yBase-CHAR_HALF-OFFSET-5;
    const cy=yBase-CURVE;
    const mx=(x1+x2)/2;
    const path=`M ${x1} ${yAttach} Q ${mx} ${cy} ${x2} ${yAttach}`;
    return <g><path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/></g>;
  };

  // Result row widths
  const res1W=slotW(3), res2W=slotW(4);
  const resGap=16;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,userSelect:"none"}}>
      {probeEl}
      <div style={{position:"relative",width:totalW,height:SVG_H+52}}>
        <svg style={{position:"absolute",top:0,left:0,width:totalW,height:SVG_H,overflow:"visible",zIndex:10,pointerEvents:"none"}}>
          <CurvedArrow x1={cx0} x2={cx1} color="#22c55e"/>
          <CurvedArrow x1={cx0} x2={cx2} color="#ef4444"/>
        </svg>
        {/* Bracket row */}
        <div style={{position:"absolute",top:BRACKET_Y-20,left:0,display:"flex",alignItems:"center"}}>
          <span style={{width:outsideW,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={outsideLx} style={{fontSize:"1em"}}/></span>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>(</span>
          <span style={{width:t1W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={term1Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:GAP}}/>
          <span style={{width:t2W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={term2Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>)</span>
        </div>
      </div>
      {/* Result row */}
      <div style={{display:"flex",gap:resGap,alignItems:"center"}}>
        <span style={{width:res1W,textAlign:"center",fontSize:28,fontWeight:700,color:"#000"}}><MathRenderer latex={res1Lx} style={{fontSize:"1em"}}/></span>
        <span style={{width:res2W,textAlign:"center",fontSize:28,fontWeight:700,color:"#000"}}><MathRenderer latex={res2Lx} style={{fontSize:"1em"}}/></span>
      </div>
    </div>
  );
};
void (SFoilDisplay as unknown);

// ── Single bracket Grid diagram ───────────────────────────────────────────────
const SGridDisplay = ({ q }: { q: SingleQuestion | FoilData }) => {
  const fd = q as any;
  const v = fd.varName||"x";

  const outsideLx = fd.withVariable
    ? bracketFirstTermLatex(fd.a, fd.outsidePower===2?`${v}^2`:v)
    : String(fd.a);
  const term1Lx = fd.isReversed ? String(fd.c) : bracketFirstTermLatex(fd.b, v);
  const term2Lx = fd.isReversed ? `-${fd.b===1?v:`${fd.b}${v}`}` : bracketSecondTermLatex(fd.c);

  let prod1Lx="", prod2Lx="";
  if (fd.withVariable) {
    if (fd.outsidePower===2) {
      prod1Lx=signedLatex(fd.x3Coeff,`${v}^3`,true);
      prod2Lx=signedLatex(fd.x2Coeff,`${v}^2`,true);
    } else {
      prod1Lx=signedLatex(fd.x2Coeff,`${v}^2`,true);
      prod2Lx=signedLatex(fd.xCoeff,v,true);
    }
  } else {
    prod1Lx=signedLatex(fd.xCoeff,v,true);
    prod2Lx=signedLatex(fd.constant,"",true);
  }

  // Answer
  let ansLx="";
  if (fd.withVariable) {
    if (fd.outsidePower===2) {
      ansLx=signedLatex(fd.x3Coeff,`${v}^3`,true)+signedLatex(fd.x2Coeff,`${v}^2`);
    } else {
      ansLx=signedLatex(fd.x2Coeff,`${v}^2`,true)+signedLatex(fd.xCoeff,v);
    }
  } else {
    ansLx=signedLatex(fd.xCoeff,v,true)+signedLatex(fd.constant);
  }

  const CELL = "border-2 border-gray-700 flex items-center justify-center font-bold";
  const SZ   = "w-28 h-14";
  const HDR  = "bg-gray-300 text-gray-900";

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",width:"fit-content"}}>
        <div className={`${CELL} ${SZ} ${HDR}`} style={{fontSize:20}}>×</div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={term1Lx} style={{fontSize:20}}/></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={term2Lx} style={{fontSize:20}}/></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={outsideLx} style={{fontSize:20}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod1Lx} style={{fontSize:20}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod2Lx} style={{fontSize:20}}/></div>
      </div>
      <div className="text-xl font-bold" style={{color:"#166534"}}>
        <MathRenderer latex={`= ${ansLx}`} style={{fontSize:20}}/>
      </div>
    </div>
  );
};

// ── Double bracket FOIL diagram ───────────────────────────────────────────────
const DFoilDisplay = ({ q }: { q: DoubleQuestion }) => {
  const {a,b,c,d} = q.values;

  const t1Lx = bracketFirstTermLatex(a,"x");
  const t2Lx = bracketSecondTermLatex(b);
  const t3Lx = bracketFirstTermLatex(c,"x");
  const t4Lx = bracketSecondTermLatex(d);

  const first=a*c, outer=a*d, inner=b*c, last=b*d;
  const r1Lx=signedLatex(first,"x^2",true);
  const r2Lx=signedLatex(outer,"x",false);
  const r3Lx=signedLatex(inner,"x",false);
  const r4Lx=signedLatex(last,"",false);

  const allTerms=[t1Lx,t2Lx,t3Lx,t4Lx,r1Lx,r2Lx,r3Lx,r4Lx];
  const [rawWidths, probeEl] = useMeasuredWidths(allTerms,28) as [number[],React.ReactNode];
  const widths = rawWidths.length===8 ? rawWidths : Array(8).fill(60);

  const PAD=20, BRACE=18, GAP=8;
  const slotW=(i:number)=>(widths[i]||60)+PAD*2;
  const t1W=slotW(0),t2W=slotW(1),t3W=slotW(2),t4W=slotW(3);

  const openB1=0;
  const cx1=openB1+BRACE+t1W/2;
  const cx2=cx1+t1W/2+GAP+t2W/2;
  const closeB1=cx2+t2W/2;
  const openB2=closeB1+BRACE;
  const cx3=openB2+BRACE+t3W/2;
  const cx4=cx3+t3W/2+GAP+t4W/2;
  const closeB2=cx4+t4W/2;
  const totalW=closeB2+BRACE+20;

  const TOP_CURVE=60, BOT_CURVE=60;
  const BRACKET_TOP = TOP_CURVE + 24;
  const D_SVG_H = BRACKET_TOP + BOT_CURVE + 24;

  const CurvedArrow=({x1,x2,up,color}:{x1:number;x2:number;up:boolean;color:string})=>{
    const CHAR_HALF=14; // half character height
    const OFFSET=3;    // px clearance beyond the character edge
    const yBase=BRACKET_TOP;
    const yAttach=up?yBase-CHAR_HALF-OFFSET-5:yBase+CHAR_HALF+OFFSET+10;
    const cy=up?yBase-TOP_CURVE:yBase+BOT_CURVE;
    const mx=(x1+x2)/2;
    // tangent angle at the endpoint of the quadratic: derivative at t=1 is 2*(x2-mx), 2*(yAttach-cy)
    const angle=Math.atan2(yAttach-cy, x2-mx)*180/Math.PI;
    const path=`M ${x1} ${yAttach} Q ${mx} ${cy} ${x2} ${yAttach}`;
    return <g>
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>

    </g>;
  };

  const resTerms=[r1Lx,r2Lx,r3Lx,r4Lx];
  const resGap=12;
  const resWidths=widths.slice(4).map((_,i)=>slotW(4+i));
  const resTotalW=resWidths.reduce((s,w)=>s+w,0)+resGap*(resWidths.length-1);
  const resStart=(totalW-resTotalW)/2;

  const SVG_H=BRACKET_TOP+TOP_CURVE+16;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,userSelect:"none"}}>
      {probeEl}
      <div style={{position:"relative",width:totalW,height:D_SVG_H+52}}>
        <svg style={{position:"absolute",top:0,left:0,width:totalW,height:D_SVG_H+BOT_CURVE+16,overflow:"visible",zIndex:10,pointerEvents:"none"}}>
          <CurvedArrow x1={cx1} x2={cx3} up={true}  color="#ef4444"  charMidY={BRACKET_TOP}/>
          <CurvedArrow x1={cx1} x2={cx4} up={true}  color="#3b82f6"  charMidY={BRACKET_TOP}/>
          <CurvedArrow x1={cx2} x2={cx3} up={false} color="#92400e"  charMidY={BRACKET_TOP}/>
          <CurvedArrow x1={cx2} x2={cx4} up={false} color="#22c55e"  charMidY={BRACKET_TOP}/>
        </svg>
        <div style={{position:"absolute",top:BRACKET_TOP-20,left:0,display:"flex",alignItems:"center"}}>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>(</span>
          <span style={{width:t1W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={t1Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:GAP}}/>
          <span style={{width:t2W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={t2Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>)</span>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>(</span>
          <span style={{width:t3W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={t3Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:GAP}}/>
          <span style={{width:t4W,textAlign:"center",fontSize:28,fontWeight:700}}><MathRenderer latex={t4Lx} style={{fontSize:"1em"}}/></span>
          <span style={{width:BRACE,textAlign:"center",fontSize:32,fontWeight:700}}>)</span>
        </div>
      </div>
      <div style={{display:"flex",gap:resGap,alignItems:"center"}}>
        {resTerms.map((lt,i)=>(
          <span key={i} style={{width:resWidths[i],textAlign:"center",fontSize:28,fontWeight:700,color:"#000"}}>
            <MathRenderer latex={lt} style={{fontSize:"1em"}}/>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Double bracket Grid diagram ───────────────────────────────────────────────
const DGridDisplay = ({ q }: { q: DoubleQuestion }) => {
  const {a,b,c,d} = q.values;

  const t1Lx = bracketFirstTermLatex(a,"x");
  const t2Lx = bracketSecondTermLatex(b);
  const t3Lx = bracketFirstTermLatex(c,"x");
  const t4Lx = bracketSecondTermLatex(d);

  const first=a*c, outer=a*d, inner=b*c, last=b*d;
  const xCoeff=outer+inner;

  const prod=(val:number,va:string)=>signedLatex(val,va,false);

  const collectLx =
    signedLatex(first,"x^2",true)+
    signedLatex(outer,"x")+
    signedLatex(inner,"x")+
    signedLatex(last);

  const ansLx =
    signedLatex(first,"x^2",true)+
    signedLatex(xCoeff,"x")+
    signedLatex(last);

  const CELL="border-2 border-gray-700 flex items-center justify-center font-bold";
  const SZ="w-28 h-14";
  const HDR="bg-gray-300 text-gray-900";
  const FS=20;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",width:"fit-content"}}>
        <div className={`${CELL} ${SZ} ${HDR}`} style={{fontSize:FS}}>×</div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t3Lx} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t4Lx} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t1Lx} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(first,"x^2")} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(outer,"x")} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t2Lx} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(inner,"x")} style={{fontSize:FS}}/></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(last,"")} style={{fontSize:FS}}/></div>
      </div>
      <div style={{fontSize:FS, fontWeight:700, color:"#000"}}>
        <MathRenderer latex={`= ${collectLx}`} style={{fontSize:"1em"}}/>
      </div>
    </div>
  );
};

// ── WorkedSteps ───────────────────────────────────────────────────────────────

const WorkedSteps = ({ q, stepBg, dropdownValue }: { q: AnyQuestion; stepBg: string; dropdownValue?: string }) => {
  const method = getMethod(dropdownValue ?? "foil");
  const showFoil = method==="foil"||method==="both";
  const showGrid = method==="grid"||method==="both";

  const SingleDiagrams = ({ fd, label }: { fd: SingleQuestion|FoilData; label?: string }) => (
    <div className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
      {label && <h4 className="text-xl font-bold mb-1" style={{color:"#000"}}>{label}</h4>}
      {showFoil && <>
        <h4 className="text-xl font-bold mb-1" style={{color:"#000"}}>FOIL</h4>
        <SFoilDisplay q={fd as SingleQuestion}/>
      </>}
      {showGrid && <>
        <h4 className="text-xl font-bold mb-1 mt-4" style={{color:"#000"}}>Grid</h4>
        <SGridDisplay q={fd as SingleQuestion}/>
      </>}
    </div>
  );

  if (q.kind==="double") {
    return (
      <div className="space-y-4 mt-8">
        {showFoil && (
          <div className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
            <h4 className="text-xl font-bold mb-1" style={{color:"#000"}}>FOIL Method</h4>
            <p className="text-base text-gray-500 mb-4">First · Outer · Inner · Last</p>
            <DFoilDisplay q={q as DoubleQuestion}/>
          </div>
        )}
        {showGrid && (
          <div className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
            <h4 className="text-xl font-bold mb-1" style={{color:"#000"}}>Grid Method</h4>
            <p className="text-base text-gray-500 mb-4">Multiply each pair of terms</p>
            <DGridDisplay q={q as DoubleQuestion}/>
          </div>
        )}
      </div>
    );
  }

  if (q.kind==="simplify") {
    const sq = q as SimplifyQuestion;
    return (
      <div className="space-y-4 mt-8">
        <SingleDiagrams fd={sq.q1 as unknown as SingleQuestion} label={`Expand: ${sq.q1.display}`}/>
        <SingleDiagrams fd={sq.q2 as unknown as SingleQuestion} label={`Expand: ${sq.q2.display}`}/>
        <div className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
          <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>Collect like terms</h4>
          <p className="text-xl" style={{color:"#000"}}>
            ({sq.q1.answer}) {sq.operator} ({sq.q2.answer})
          </p>
        </div>
      </div>
    );
  }

  // single
  return (
    <div className="space-y-4 mt-8">
      <SingleDiagrams fd={q as SingleQuestion}/>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const LV_COLORS: Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};
const getQuestionBg=(cs:string)=>({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg=(cs:string)=>({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

// ── QuestionDisplay ───────────────────────────────────────────────────────────
const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => {
  let latex = "";
  if (q.kind==="single")   latex=singleDisplayLatex(q as SingleQuestion);
  else if (q.kind==="simplify") {
    const sq=q as SimplifyQuestion;
    latex=singleDisplayLatex(sq.q1)+" "+sq.operator+" "+singleDisplayLatex(sq.q2);
  }
  else latex=doubleDisplayLatex(q as DoubleQuestion);
  return <div className={`${cls} font-bold text-center`} style={{color:"#000"}}><MathRenderer latex={latex} style={{fontSize:"1em"}}/></div>;
};

const AnswerDisplay = ({ q }: { q: AnyQuestion }) => {
  let latex = "";
  if (q.kind==="single")   latex=singleAnswerLatex(q as SingleQuestion);
  else if (q.kind==="simplify") {
    const sq=q as SimplifyQuestion;
    const v=sq.varName;
    // recompute combined answer as latex
    const q1=sq.q1,q2=sq.q2;
    let x3_1=0,x2_1=0,x_1=0,c_1=0,x3_2=0,x2_2=0,x_2=0,c_2=0;
    if(q1.withVariable){x3_1=q1.x3Coeff;x2_1=q1.x2Coeff;x_1=q1.xCoeff;c_1=q1.constant;}
    else{x_1=q1.a*q1.b*(q1.isReversed?-1:1);c_1=q1.a*q1.c;}
    if(q2.withVariable){x3_2=q2.x3Coeff;x2_2=q2.x2Coeff;x_2=q2.xCoeff;c_2=q2.constant;}
    else{x_2=q2.a*q2.b*(q2.isReversed?-1:1);c_2=q2.a*q2.c;}
    const m=sq.operator==="+"?1:-1;
    const fX3=x3_1+m*x3_2,fX2=x2_1+m*x2_2,fX=x_1+m*x_2,fC=c_1+m*c_2;
    latex=signedLatex(fX3,`${v}^3`,true)+signedLatex(fX2,`${v}^2`)+signedLatex(fX,v)+signedLatex(fC);
    if(!latex)latex="0";
  }
  else latex=doubleAnswerLatex(q as DoubleQuestion);
  return <span>=<MathRenderer latex={latex} style={{fontSize:"1em"}}/></span>;
};

// ── DifficultyToggle ──────────────────────────────────────────────────────────
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

// ── QO Popover ────────────────────────────────────────────────────────────────
const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: {key:string;label:string;options:{value:string;label:string}[]};
  value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-wrap">
      {dropdown.options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const StandardQOPopover = ({ dropdown, dropdownValue, onDropdownChange }: {
  dropdown: {key:string;label:string;options:{value:string;label:string}[]}|null;
  dropdownValue: string; onDropdownChange: (v:string)=>void;
}) => {
  const {open,setOpen,ref} = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown
            ? <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange}/>
            : <p className="text-sm text-gray-400">No additional options for this tool.</p>}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolKey, levelDropdowns, onLevelDropdownChange }: {
  toolKey: string; levelDropdowns: Record<string,string>; onLevelDropdownChange: (lv:string,v:string)=>void;
}) => {
  const {open,setOpen,ref} = usePopover();
  const dd = TOOL_CONFIG.tools[toolKey]?.dropdown;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {!dd ? <p className="text-sm text-gray-400">No additional options.</p>
            : (["level1","level2","level3"] as DifficultyLevel[]).map(lv => (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <DropdownSection dropdown={dd} value={levelDropdowns[lv]??dd.defaultValue} onChange={v=>onLevelDropdownChange(lv,v)}/>
              </div>
            ))
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
  const [colorOpen,setColorOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
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
                {s}{colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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

// ── Print ─────────────────────────────────────────────────────────────────────
const handlePrint = (questions: AnyQuestion[], toolName: string, difficulty: string, isDifferentiated: boolean, numColumns: number) => {
  const FONT_PX=14,PAD_MM=2,MARGIN_MM=12,HEADER_MM=14,GAP_MM=2;
  const PAGE_H_MM=297-MARGIN_MM*2,PAGE_W_MM=210-MARGIN_MM*2;
  const usableH_MM=PAGE_H_MM-HEADER_MM;
  const cols=isDifferentiated?3:numColumns;
  const difficultyLabel=isDifferentiated?"Differentiated":difficulty==="level1"?"Level 1":difficulty==="level2"?"Level 2":"Level 3";
  const dateStr=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const totalQ=questions.length;
  const diffHdrMM=7;
  const qHtmlData=questions.map((q,i)=>({
    q:`<div class="q-banner">Question ${i+1}</div><div class="qbody"><div class="q-math">${q.display}</div></div>`,
    a:`<div class="q-banner">Question ${i+1}</div><div class="qbody"><div class="q-math">${q.display}</div><div class="q-answer">= ${q.answer}</div></div>`,
    difficulty:q.difficulty,
  }));
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4;margin:${MARGIN_MM}mm;}
body{font-family:"Segoe UI",Arial,sans-serif;background:#fff;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.page-header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:0.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.page-header h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.page-header .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}.cell,.diff-cell{border:0.3mm solid #d1d5db;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column;}
.diff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}.diff-col{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.diff-header{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.diff-header.level1{background:#dcfce7;color:#166534;}.diff-header.level2{background:#fef9c3;color:#854d0e;}.diff-header.level3{background:#fee2e2;color:#991b1b;}
.q-inner{width:100%;display:flex;flex-direction:column;flex:1;}.q-banner{width:100%;text-align:center;font-size:${Math.round(FONT_PX*0.65)}px;font-weight:700;color:#000;padding:1mm 0;border-bottom:0.3mm solid #000;}
.qbody{padding:${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm;text-align:center;flex:1;}.q-math{font-size:${FONT_PX}px;font-weight:700;display:inline;}
.q-answer{font-size:${FONT_PX}px;color:#059669;display:block;margin-top:0.8mm;text-align:center;}
</style></head><body><div id="pages"></div>
<script>
var pxPerMm=3.7795,PAD_MM=${PAD_MM},GAP_MM=${GAP_MM},usableH=${usableH_MM},diffHdrMM=${diffHdrMM};
var PAGE_W_MM=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"},totalQ=${totalQ};
var diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
var qData=${JSON.stringify(qHtmlData)};
var rowHeights=[];for(var r=1;r<=10;r++)rowHeights.push((usableH-GAP_MM*(r-1))/r);
var needed_mm=${FONT_PX/3.7795*2+PAD_MM*2+6};
var diffPerCol=Math.floor(totalQ/3);var diffUsableH=usableH-diffHdrMM-GAP_MM;
var diffRowsPerPage=1,diffCellH_mm=diffUsableH;
for(var rd=0;rd<diffPerCol;rd++){var rows2=rd+1;var h=(diffUsableH-GAP_MM*rd)/rows2;if(h>=needed_mm){diffRowsPerPage=rows2;diffCellH_mm=h;}}
var chosenH_mm=rowHeights[0],rowsPerPage=1;
for(var r=0;r<rowHeights.length;r++){var cap=(r+1)*cols;if(cap>=totalQ&&rowHeights[r]>=needed_mm){chosenH_mm=rowHeights[r];rowsPerPage=r+1;break;}}
var pageCapacity=isDiff?diffRowsPerPage:rowsPerPage*cols;
var pages=[];
if(isDiff){var n=Math.ceil(diffPerCol/diffRowsPerPage);for(var p=0;p<n;p++)pages.push(p);}
else{for(var s=0;s<qData.length;s+=pageCapacity)pages.push(qData.slice(s,s+pageCapacity));}
var totalPages=pages.length;
function makeCellW(c){return(PAGE_W_MM-GAP_MM*(c-1))/c;}
function buildCell(inner,cW,cH,isDiffCell){var cls=isDiffCell?"diff-cell":"cell";return'<div class="'+cls+'" style="width:'+cW+'mm;height:'+cH+'mm;"><div class="q-inner">'+inner+'</div></div>';}
function buildGrid(pd,showA,cH){
  if(isDiff){var pgIdx=pd;var start=pgIdx*diffRowsPerPage;var end=start+diffRowsPerPage;var cW=makeCellW(3);
    var lvls=["level1","level2","level3"],lbls=["Level 1","Level 2","Level 3"];
    var cols3=lvls.map(function(lv,li){var lqs=qData.filter(function(q){return q.difficulty===lv;}).slice(start,end);
      var cells=lqs.map(function(q){return buildCell(showA?q.a:q.q,cW,cH,true);}).join("");
      return'<div class="diff-col"><div class="diff-header '+lv+'">'+lbls[li]+"</div>"+cells+"</div>";}).join("");
    return'<div class="diff-grid" style="grid-template-columns:repeat(3,'+cW+'mm);">'+cols3+"</div>";}
  var cW=makeCellW(cols);var gridRows=Math.ceil(pd.length/cols);
  var cells=pd.map(function(item){return buildCell(showA?item.a:item.q,cW,cH,false);}).join("");
  return'<div class="grid" style="grid-template-columns:repeat('+cols+','+cW+'mm);grid-template-rows:repeat('+gridRows+','+cH+'mm);">'+cells+"</div>";}
function buildPage(pd,showA,pgIdx){var cH=isDiff?diffCellH_mm:chosenH_mm;
  var lbl=totalPages>1?(isDiff?diffPerCol+" per level":totalQ+" questions")+" ("+(pgIdx+1)+"/"+totalPages+")":isDiff?diffPerCol+" per level":totalQ+" questions";
  var title=toolName+(showA?" — Answers":"");
  return'<div class="page"><div class="page-header"><h1>'+title+"</h1><div class=\"meta\">"+diffLabel+" &nbsp;&middot;&nbsp; "+dateStr+" &nbsp;&middot;&nbsp; "+lbl+"</div></div>"+buildGrid(pd,showA,cH)+"</div>";}
var html=pages.map(function(pg,i){return buildPage(pg,false,i);}).join("")+pages.map(function(pg,i){return buildPage(pg,true,i);}).join("");
document.getElementById("pages").innerHTML=html;
setTimeout(function(){window.print();},300);
<\/script></body></html>`;
  const win=window.open("","_blank");
  if(!win){alert("Please allow popups to use the PDF export.");return;}
  win.document.write(html);win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];

  const [currentTool, setCurrentTool] = useState<ToolType>("expand");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // Each tool gets its own independent dropdown value
  const [toolDropdowns, setToolDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const dd = TOOL_CONFIG.tools[k].dropdown;
      if (dd) {
        (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => { init[`${k}__${lv}`] = dd.defaultValue; });
        init[k] = dd.defaultValue;
      }
    });
    return init;
  });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>({level1:"foil",level2:"foil",level3:"foil"});

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion|null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(1);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
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

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    if (videoRef.current) videoRef.current.srcObject=null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId=deviceId;
      if (!targetDeviceId) {
        const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        tmp.getTracks().forEach(t=>t.stop());
        const all=await navigator.mediaDevices.enumerateDevices();
        const builtInPattern=/facetime|built.?in|integrated|internal|front|rear/i;
        const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!builtInPattern.test(d.label));
        if(ext)targetDeviceId=ext.deviceId;
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:targetDeviceId?{deviceId:{exact:targetDeviceId}}:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current)videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    } catch(e:unknown){setCamError((e instanceof Error?e.message:null)??"Camera unavailable");}
  },[stopStream]);

  useEffect(()=>{if(presenterMode)startCam();else stopStream();},[presenterMode]);
  useEffect(()=>{if(presenterMode&&streamRef.current&&videoRef.current)videoRef.current.srcObject=streamRef.current;},[wbFullscreen]);
  useEffect(()=>{
    if(!camDropdownOpen)return;
    const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[camDropdownOpen]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};
    document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);
  },[]);

  const qBg=getQuestionBg(colorScheme);
  const stepBg=getStepBg(colorScheme);
  const isDefaultScheme=colorScheme==="default";
  const fsToolbarBg=isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg=isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg=isDefaultScheme?"#f5f3f0":qBg;

  // ── QO helpers ────────────────────────────────────────────────────────────
  const getDropdownConfig = () => TOOL_CONFIG.tools[currentTool]?.dropdown ?? null;
  // Per-tool global dropdown (not per-level) for whiteboard/worked example
  const getDropdownValue = () => toolDropdowns[currentTool] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({...p, [currentTool]: v}));
  const handleLevelDDChange = (lv: string, v: string) => setLevelDropdowns(p => ({...p, [lv]: v}));

  const getInstruction = (tool = currentTool) => TOOL_CONFIG.tools[tool]?.instruction ?? "";

  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, {}, getDropdownValue());

  const handleNewQuestion = () => { setCurrentQuestion(makeQuestion()); setShowWhiteboardAnswer(false); setShowAnswer(false); };

  interface QOSnapshot { level: DifficultyLevel; dropdownValue: string; }
  const stampQO = (q: AnyQuestion, snap: QOSnapshot): AnyQuestion => ({...q, _qo: snap} as AnyQuestion);

  const handleGenerateWorksheet = () => {
    const usedKeys=new Set<string>();
    const questions: AnyQuestion[]=[];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const ddVal=levelDropdowns[lv]??getDropdownConfig()?.defaultValue??"foil";
        const snap: QOSnapshot={level:lv,dropdownValue:ddVal};
        for(let i=0;i<numQuestions;i++) questions.push(stampQO(generateUniqueQ(currentTool,lv,{},ddVal,usedKeys),snap));
      });
    } else {
      const snap: QOSnapshot={level:difficulty,dropdownValue:getDropdownValue()};
      for(let i=0;i<numQuestions;i++) questions.push(stampQO(generateUniqueQ(currentTool,difficulty,{},getDropdownValue(),usedKeys),snap));
    }
    setWorksheet(questions); setShowWorksheetAnswers(false);
  };

  const qoEl=(isDiff=false)=>isDiff
    ?<DiffQOPopover toolKey={currentTool} levelDropdowns={levelDropdowns} onLevelDropdownChange={handleLevelDDChange}/>
    :<StandardQOPopover dropdown={getDropdownConfig()} dropdownValue={getDropdownValue()} onDropdownChange={setDropdownValue}/>;

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);

  const displayFontSizes=["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease=displayFontSize<displayFontSizes.length-1;
  const canDisplayDecrease=displayFontSize>0;
  const fontSizes=["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease=worksheetFontSize<fontSizes.length-1;
  const canDecrease=worksheetFontSize>0;

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg=bgOverride??stepBg;
    const fsz=fontSizes[worksheetFontSize];
    let latex="";
    if(q.kind==="single")   latex=singleDisplayLatex(q as SingleQuestion);
    else if(q.kind==="simplify"){ const sq=q as SimplifyQuestion; latex=singleDisplayLatex(sq.q1)+" "+sq.operator+" "+singleDisplayLatex(sq.q2); }
    else latex=doubleDisplayLatex(q as DoubleQuestion);
    return (
      <div className="rounded-xl p-3" style={{backgroundColor:bg,height:"100%",boxSizing:"border-box",position:"relative",borderRadius:"12px",border:"1px solid #e5e7eb"}}>
        <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>
        {getInstruction() && <div className={`${fontSizes[Math.max(0, worksheetFontSize - 1)]} font-semibold text-center w-full mb-1`} style={{color:"#000"}}>{getInstruction()}</div>}
        <div className={`${fsz} font-bold text-center w-full`} style={{color:"#000"}}>
          <MathRenderer latex={latex} style={{fontSize:"1em"}}/>
        </div>
        {showWorksheetAnswers && (() => {
          let aLx="";
          if(q.kind==="single") aLx=singleAnswerLatex(q as SingleQuestion);
          else if(q.kind==="double") aLx=doubleAnswerLatex(q as DoubleQuestion);
          else aLx=(q as SimplifyQuestion).answer;
          return <div className={`${fsz} font-semibold mt-1 text-center`} style={{color:"#059669"}}>
            = <MathRenderer latex={aLx} style={{fontSize:"1em"}}/>
          </div>;
        })()}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="p-6">
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
              <input type="number" min="1" max="24" value={numQuestions} onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||5)))}
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
    if (!currentQuestion) return null;
    const fontBtnStyle=(enabled:boolean)=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:enabled?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:enabled?1:0.35});
    const fsToolbar=(
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        {qoEl()}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );
    const questionBox=(fs:boolean)=>(
      <div className={fs?"":"rounded-xl flex-shrink-0 p-8"} style={{position:"relative",width:fs?`${splitPct}%`:"480px",height:"100%",backgroundColor:fs?fsQuestionBg:stepBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:fs?48:undefined,boxSizing:"border-box",flexShrink:fs?0:undefined,overflowY:fs?"auto":undefined,gap:16}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        {getInstruction() && <div className={`${displayFontSizes[Math.max(0, displayFontSize - 1)]} font-semibold`} style={{color:"#000"}}>{getInstruction()}</div>}
        <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
        {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion}/></div>}
      </div>
    );
    const makeRightPanel=(isFS:boolean)=>(
      <div style={{flex:1,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&(<><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        {camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>)}
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
    if (wbFullscreen) return (
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div ref={splitContainerRef} style={{flex:1,display:"flex",minHeight:0}}>
          {questionBox(true)}
          <div style={{position:"relative",width:2,backgroundColor:"#000",flexShrink:0,cursor:"col-resize"}}
            onMouseDown={e=>{
              isDraggingRef.current=true;
              const onMove=(ev:MouseEvent)=>{if(!isDraggingRef.current||!splitContainerRef.current)return;const rect=splitContainerRef.current.getBoundingClientRect();let pct=((ev.clientX-rect.left)/rect.width)*100;pct=Math.min(75,Math.max(25,pct));if(pct>=38&&pct<=42)pct=40;setSplitPct(pct);};
              const onUp=()=>{isDraggingRef.current=false;document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
              document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);e.preventDefault();
            }}>
            <div style={{position:"absolute",top:0,bottom:0,left:-5,width:12,cursor:"col-resize"}}/>
          </div>
          {makeRightPanel(true)}
        </div>
      </div>
    );
    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"480px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>
          {questionBox(false)}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => {
    if (!currentQuestion) return null;
    const fontBtnStyle=(enabled:boolean)=>({background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:enabled?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:enabled?1:0.35});
    return (
      <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
        <div className="p-8 w-full" style={{backgroundColor:qBg}}>
          <div className="text-center py-4 relative">
            <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
              <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
              <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
            </div>
            {getInstruction() && <div className={`${displayFontSizes[Math.max(0, displayFontSize - 1)]} font-semibold mb-2`} style={{color:"#000"}}>{getInstruction()}</div>}
            <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          </div>
          {showAnswer&&(
            <>
              <WorkedSteps q={currentQuestion} stepBg={stepBg} dropdownValue={getDropdownValue()}/>
              <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
                <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                  = <MathRenderer latex={currentQuestion.kind==="single"?singleAnswerLatex(currentQuestion as SingleQuestion):currentQuestion.kind==="double"?doubleAnswerLatex(currentQuestion as DoubleQuestion):(()=>{const sq=currentQuestion as SimplifyQuestion;const v=sq.varName;const q1=sq.q1,q2=sq.q2;let x3_1=0,x2_1=0,x_1=0,c_1=0,x3_2=0,x2_2=0,x_2=0,c_2=0;if(q1.withVariable){x3_1=q1.x3Coeff;x2_1=q1.x2Coeff;x_1=q1.xCoeff;c_1=q1.constant;}else{x_1=q1.a*q1.b*(q1.isReversed?-1:1);c_1=q1.a*q1.c;}if(q2.withVariable){x3_2=q2.x3Coeff;x2_2=q2.x2Coeff;x_2=q2.xCoeff;c_2=q2.constant;}else{x_2=q2.a*q2.b*(q2.isReversed?-1:1);c_2=q2.a*q2.c;}const m=sq.operator==="+"?1:-1;const fX3=x3_1+m*x3_2,fX2=x2_1+m*x2_2,fX=x_1+m*x_2,fC=c_1+m*c_2;return(signedLatex(fX3,`${v}^3`,true)+signedLatex(fX2,`${v}^2`)+signedLatex(fX,v)+signedLatex(fC))||"0";})()}
                    style={{fontSize:"1em"}}/>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if (worksheet.length===0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    const fontSizeControls=(
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={()=>canDecrease&&setWorksheetFontSize(f=>f-1)} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canIncrease} onClick={()=>canIncrease&&setWorksheetFontSize(f=>f+1)} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle=TOOL_CONFIG.tools[currentTool].name;
    if (isDifferentiated) return (
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
