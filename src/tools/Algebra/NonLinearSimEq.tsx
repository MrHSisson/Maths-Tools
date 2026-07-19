import {
  ToolShell, MathRenderer, InlineMath, SmartGrapher,
  workings, quadraticFormulaSteps, solveFactorsSteps, substituteBackSteps,
  makeSubjectSteps, solveLinearlySteps,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type WorkingStep, type QOSnapshot, type GraphSeries, type FOI,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// Simultaneous Equations by Substitution — v2.3 (ToolShell + SmartGrapher)
//
// Linear substitution and non-linear (quadratic / circle / ellipse) substitution.
// The pure question generators, string builders and question banks below are the
// original, correct maths engine — kept intact. A thin v2.3 layer wraps them:
// each internal question is converted to a worded ToolShell question, and the two
// curves it describes are drawn on the shared SmartGrapher (the intersection
// points ARE the solutions), shown on the whiteboard answer and in a worked step.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Tool-local types (kept from the original generator) ──
type SubTool = "linear" | "factorising" | "formula";
type NegMode = "pos-only" | "neg-only" | "both";
type SurdDisplay = "surd" | "decimal" | "both";
type AllowAMode = number;

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

type InternalQ = LinearQuestion | NonLinearQuestion;

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
  { eq1:"x^2+y^2=34",  eq2:"y=x+2",    expanded:"2x^2+4x-30=0",     factorised:"2(x+5)(x-3)=0",     soln1:"x=-5,\\;y=-3",                         soln2:"x=3,\\;y=5",                          A:2,  B:4,   C:-30,  r2:34,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=34",            x1:-5,   y1:-3,   x2:3,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=41",  eq2:"y=x+1",    expanded:"2x^2+2x-40=0",     factorised:"2(x+5)(x-4)=0",     soln1:"x=-5,\\;y=-4",                         soln2:"x=4,\\;y=5",                          A:2,  B:2,   C:-40,  r2:41,  isolateVar:"y",linM:1,  linD:1,  quadSub:"x^2+(x+1)^2=41",            x1:-5,   y1:-4,   x2:4,    y2:5,    coefType:"none" },
  { eq1:"x^2+y^2=52",  eq2:"y=x+2",    expanded:"2x^2+4x-48=0",     factorised:"2(x+6)(x-4)=0",     soln1:"x=-6,\\;y=-4",                         soln2:"x=4,\\;y=6",                          A:2,  B:4,   C:-48,  r2:52,  isolateVar:"y",linM:1,  linD:2,  quadSub:"x^2+(x+2)^2=52",            x1:-6,   y1:-4,   x2:4,    y2:6,    coefType:"none" },
  { eq1:"x^2+y^2=61",  eq2:"y=x+1",    expanded:"2x^2+2x-60=0",     factorised:"2(x+6)(x-5)=0",     soln1:"x=-6,\\;y=-5",                         soln2:"x=5,\\;y=6",                          A:2,  B:2,   C:-60,  r2:61,  isolateVar:"y",linM:1,  linD:1,  quadSub:"x^2+(x+1)^2=61",            x1:-6,   y1:-5,   x2:5,    y2:6,    coefType:"none" },
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

// The formula bank's stored surd-y answers and numeric y-values were incorrect
// (they disagreed with the entry's own — correct — decimal answers). Rather than
// trust those fields, derive everything from the quadratic (A, B, disc) and the
// line, using the same buildSurdDisplay / buildSurdPairs helpers that generate the
// live (correct) formula questions. The substituted-away variable is the one the
// quadratic is in ("primary"); the isolated variable is derived from the line.
const bankToFormQuestion = (e: FormBankEntry, idx: number): NonLinearQuestion => {
  const denom = 2 * e.A, negB = -e.B;
  const primaryVar = e.isolateVar === "y" ? "x" : "y";      // quadratic is in this variable
  const primarySurd = `${primaryVar} = \\frac{${negB} \\pm \\sqrt{${e.disc}}}{${denom}}`;
  const otherSurd = buildSurdPairs(e.A, e.B, e.disc, e.linM, e.linD, e.isolateVar).syCombined;
  const p1 = (negB - Math.sqrt(e.disc)) / denom, p2 = (negB + Math.sqrt(e.disc)) / denom;
  const other = (p: number) => e.linM * p + e.linD;         // isolated var = m·primary + d
  const solutions = e.isolateVar === "y"
    ? [{ x: p1, y: other(p1) }, { x: p2, y: other(p2) }]     // primary is x
    : [{ x: other(p1), y: p1 }, { x: other(p2), y: p2 }];    // primary is y
  // Decimal answers are derived from the recomputed solutions too — the stored
  // soln*dec strings were also wrong for some entries.
  const dec = (s: { x: number; y: number }) => `x\\approx${s.x.toFixed(2)},\\;y\\approx${s.y.toFixed(2)}`;
  return {
    kind:"nonlinear", subTool:"formula",
    eq1Display:e.eq1, eq2Display:e.eq2,
    isolateVar:e.isolateVar, isolatedExpr:"",
    linM:e.linM, linD:e.linD,
    needsRearrange:false, rearrangedLatex:e.eq2,
    quadLatex:e.quadSub, expandedLatex:e.expanded,
    surdLatex:primarySurd,
    surdX1:primarySurd, surdX2:primarySurd,
    surdYCombined:otherSurd,
    decimalLatex:`${dec(solutions[0])}\\text{ or }${dec(solutions[1])}`,
    solutions,
    isDoubleRoot:false,
    A:e.A, B:e.B, C:e.C, isCircle:true, r2:e.r2,
    level:"level3", key:`bank-form-${idx}`, difficulty:"level3", working:[]
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPH — derive the two curves + intersection points for the SmartGrapher
// ═══════════════════════════════════════════════════════════════════════════════
interface GraphInfo {
  series: GraphSeries[];
  points: { x: number; y: number }[];
  axisLabels?: { x?: string; y?: string };
  lockAspect?: boolean;
}

const CURVE_COLOR = "#2563eb";   // parabola / circle / equation (1)
const LINE_COLOR  = "#059669";   // straight line / equation (2)

// Parse a linear expression in variable `v` (e.g. "3t + 2", "7 - 3t", "-2y") into m·v + c.
const parseLinExpr = (expr: string, v: string): { m: number; c: number } => {
  const s = expr.replace(/\s+/g, "");
  const re = new RegExp(`([+-]?\\d*)${v}`);
  const mMatch = s.match(re);
  let m = 0;
  if (mMatch) {
    const t = mMatch[1];
    m = t === "" || t === "+" ? 1 : t === "-" ? -1 : parseInt(t, 10);
  }
  const cMatch = s.replace(re, "").match(/([+-]?\d+)/);
  const c = cMatch ? parseInt(cMatch[1], 10) : 0;
  return { m, c };
};

// A point lies on a series curve (within tolerance). Guards the graph against
// any question whose stored solutions don't actually satisfy the drawn curves —
// so a data inconsistency omits the graph rather than drawing a wrong picture.
const onCurve = (s: GraphSeries, x: number, y: number): boolean => {
  const p = s.params ?? [];
  if (s.equationType === "linear")    return Math.abs(y - (p[0] * x + p[1])) < 1e-6;
  if (s.equationType === "quadratic") return Math.abs(y - (p[0] * x * x + p[1] * x + p[2])) < 1e-6;
  if (s.equationType === "circle")    return Math.abs((x - p[0]) ** 2 + (y - p[1]) ** 2 - p[2] ** 2) < 1e-4;
  return true;
};
const consistent = (series: GraphSeries[], points: { x: number; y: number }[]): boolean =>
  points.every((pt) => series.every((s) => onCurve(s, pt.x, pt.y)));

// The straight line of a non-linear question as y = m·x + c.
const nlLine = (q: NonLinearQuestion): [number, number] | null => {
  if (q.isolateVar === "y") return [q.linM, q.linD];
  if (q.linM === 0) return null;              // x = c — vertical, not a function of x
  return [1 / q.linM, -q.linD / q.linM];      // x = linM·y + linD  →  y = (x − linD)/linM
};

const buildGraph = (q: InternalQ): GraphInfo | null => {
  if (q.kind === "linear") {
    if (q.b1 === 0) return null;
    const [v1, v2] = q.varPair;
    const m1 = -q.a1 / q.b1, c1 = q.c1 / q.b1;              // a1·v1 + b1·v2 = c1
    const otherVar = q.isolatedVar === "v1" ? v2 : v1;
    const { m: me, c: ce } = parseLinExpr(q.isolatedExpr, otherVar);
    let m2: number, c2: number;
    if (q.isolatedVar === "v2") { m2 = me; c2 = ce; }        // v2 = me·v1 + ce
    else { if (me === 0) return null; m2 = 1 / me; c2 = -ce / me; }  // v1 = me·v2 + ce
    const series: GraphSeries[] = [
      { equationType: "linear", params: [m1, c1], label: q.eq1Display, color: CURVE_COLOR },
      { equationType: "linear", params: [m2, c2], label: q.eq2Display, color: LINE_COLOR },
    ];
    const points = [{ x: q.v1Val, y: q.v2Val }];
    if (!consistent(series, points)) return null;
    return { series, points, axisLabels: { x: v1, y: v2 } };
  }
  const line = nlLine(q);
  if (!line) return null;
  if (!q.isCircle) {
    // Parabola display coefficients recovered from the "= 0" form: y = A x² + (B+m) x + (C+d).
    const pa = q.A, pb = q.B + q.linM, pc = q.C + q.linD;
    const series: GraphSeries[] = [
      { equationType: "quadratic", params: [pa, pb, pc], label: q.eq1Display, color: CURVE_COLOR },
      { equationType: "linear", params: line, label: q.eq2Display, color: LINE_COLOR },
    ];
    if (!consistent(series, q.solutions)) return null;
    return { series, points: q.solutions };
  }
  // A true circle x² + y² = r² is drawable; ellipses (leading coefficients) are not
  // a preset curve, so those questions simply carry no graph.
  const mm = q.eq1Display.match(/^x\^2\+y\^2=(\d+)$/);
  if (!mm) return null;
  const r = Math.sqrt(Number(mm[1]));
  const series: GraphSeries[] = [
    { equationType: "circle", params: [0, 0, r], label: q.eq1Display, color: CURVE_COLOR },
    { equationType: "linear", params: line, label: q.eq2Display, color: LINE_COLOR },
  ];
  if (!consistent(series, q.solutions)) return null;
  return { series, points: q.solutions, lockAspect: true };
};

const GraphView = ({ g, height }: { g: GraphInfo; height?: number }): JSX.Element => {
  const fois: FOI[] = g.points.map((p) => ({ x: p.x, y: p.y, kind: "point", highlight: true }));
  return (
    <SmartGrapher
      series={g.series}
      height={height ?? 280}
      config={{
        autoIntersections: false,
        autoFois: false,
        fois,
        showFois: true,
        axisLabels: g.axisLabels,
        lockAspect: g.lockAspect,
        style: { foi: "#dc2626" },
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOLUTION LINES + WORKING STEPS
// ═══════════════════════════════════════════════════════════════════════════════
const solutionLines = (q: InternalQ, surdDisplay: SurdDisplay): string[] => {
  if (q.kind === "linear") {
    const [v1, v2] = q.varPair;
    return [`${v1}=${q.v1Val},\\; ${v2}=${q.v2Val}`];
  }
  const sf = q.subTool === "factorising" ? fmtSoln : fmt2;
  if (q.isDoubleRoot) {
    const s = q.solutions[0];
    return [`x=${sf(s.x)},\\; y=${sf(s.y)}`];
  }
  if (q.isCircle && q.surdX1 && q.surdX2) {
    if (q.subTool === "factorising") return q.surdX1 === q.surdX2 ? [q.surdX1] : [q.surdX1, q.surdX2];
    const out: string[] = [];
    if (surdDisplay === "surd" || surdDisplay === "both") { out.push(q.surdX1); if (q.surdYCombined) out.push(q.surdYCombined); }
    if ((surdDisplay === "decimal" || surdDisplay === "both") && q.decimalLatex) out.push(q.decimalLatex);
    return out.length ? out : [q.surdX1];
  }
  if (q.subTool === "formula") {
    const out: string[] = [];
    if (surdDisplay === "surd" || surdDisplay === "both") { if (q.surdLatex) out.push(q.surdLatex); if (q.surdYCombined) out.push(q.surdYCombined); }
    if (surdDisplay === "decimal" || surdDisplay === "both") q.solutions.forEach((s) => {
      const xV = q.isolateVar === "y" ? s.x : s.y, yV = q.isolateVar === "y" ? s.y : s.x;
      out.push(`x=${fmt2(xV)},\\; y=${fmt2(yV)}`);
    });
    return out.length ? out : (q.surdLatex ? [q.surdLatex] : []);
  }
  return q.solutions.map((s) => `x=${sf(s.x)},\\; y=${sf(s.y)}`);
};

// Strip LaTeX commands so a simple equation reads cleanly inside a prose step title.
const titleEq = (latex: string): string => latex.replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

// The working is now assembled through the shared `workings()` builder and the
// technique library, so each move gets a proper, specific title and live-model
// fragments — and the answer is shown once (by the answer renderer), never
// restated as a final "Solution" step.
const buildWorking = (q: InternalQ, graph: GraphInfo | null): WorkingStep[] => {
  const w = workings();
  if (q.kind === "linear") {
    const [v1, v2] = q.varPair;
    const iV = q.isolatedVar === "v1" ? v1 : v2;      // isolated in (2), found by substituting back
    const oV = q.isolatedVar === "v1" ? v2 : v1;      // solved first from the substituted equation
    const oVal = q.isolatedVar === "v1" ? q.v2Val : q.v1Val;
    const line = q.needsRearrange ? q.rearrangedLatex : q.eq2Display;
    if (q.needsRearrange) w.use(makeSubjectSteps(iV, q.rearrangedLatex));
    w.step("Substitute equation (2) into equation (1)", [q.afterSubLatex]);
    w.use(solveLinearlySteps(oV, q.solveSteps));
    w.use(substituteBackSteps(iV, q.subBackSteps, { value: `${oV} = ${oVal}`, into: titleEq(line) }));
  } else {
    const primary = q.isolateVar === "y" ? "x" : "y";  // variable the quadratic is in
    const backVar = q.isolateVar;                      // isolated var, found by substituting back
    const pv = (s: { x: number; y: number }) => (primary === "x" ? s.x : s.y);
    const bv = (s: { x: number; y: number }) => (primary === "x" ? s.y : s.x);
    if (q.needsRearrange) w.use(makeSubjectSteps(q.isolateVar, q.rearrangedLatex));
    w.step("Substitute equation (2) into equation (1)", [q.quadLatex]);
    w.step("Expand and rearrange to equal zero", [q.expandedLatex]);
    if (q.subTool === "factorising") {
      if (q.factorisedLatex) w.step("Factorise", [q.factorisedLatex]);
      const roots = q.solutions.map((s) => fmtSoln(pv(s)));
      w.use(solveFactorsSteps(roots, primary));
      // Substitute each root back into the line to get the other coordinate.
      const seen = new Set<string>();
      const mappings = q.solutions
        .filter((s) => { const k = fmtSoln(pv(s)); if (seen.has(k)) return false; seen.add(k); return true; })
        .map((s) => `${primary} = ${fmtSoln(pv(s))} \\Rightarrow ${backVar} = ${fmtSoln(bv(s))}`);
      w.use(substituteBackSteps(backVar, mappings, { into: titleEq(q.eq2Display) }));
    } else {
      w.use(quadraticFormulaSteps(q.A, q.B, q.C, primary));
      if (q.surdYCombined) w.use(substituteBackSteps(backVar, [q.surdYCombined], { into: titleEq(q.eq2Display) }));
    }
    if (q.isDoubleRoot) w.note("The line is a tangent to the curve, so there is one repeated solution.");
  }
  if (graph) w.visual("Plot both graphs — the solutions are where the curves meet:", { graph });
  return w.build();
};

// Convert an internal question into a worded ToolShell question. The two equations
// print/display as worded lines; the derived graph + solution lines ride along in
// underscore fields for the renderers.
const toQuestion = (q: InternalQ, surdDisplay: SurdDisplay): AnyQuestion => {
  const graph = buildGraph(q);
  const lines = solutionLines(q, surdDisplay);
  return {
    kind: "worded",
    lines: [`$${q.eq1Display}$`, `$${q.eq2Display}$`],
    answer: lines.join("  or  ").replace(/\\[a-zA-Z]+|[{}]/g, "").replace(/\s+/g, " ").trim() || "see working",
    answerLatex: lines[0] ?? "",
    working: buildWorking(q, graph),
    key: q.key,
    difficulty: q.difficulty,
    _graph: graph,
    _solLines: lines,
  } as unknown as AnyQuestion;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE — QO → the original generators
// ═══════════════════════════════════════════════════════════════════════════════
// Level-3 banks hold a finite set of questions; a module-level rotating "used"
// set walks the pool without repeats (resetting when exhausted), while a random
// key suffix keeps every draw's key distinct so ToolShell's uniqueness loop never
// has to discard one.
const bankUsed = { fac: new Set<number>(), form: new Set<number>() };

const pickBankFac = (allowA: number): NonLinearQuestion => {
  const pool = filteredFacPool(allowA);
  let avail = pool.filter(({ idx }) => !bankUsed.fac.has(idx));
  if (!avail.length) { pool.forEach(({ idx }) => bankUsed.fac.delete(idx)); avail = pool; }
  const { entry, idx } = pick(avail);
  bankUsed.fac.add(idx);
  const q = bankToFacQuestion(entry, idx);
  q.key = `${q.key}-${randInt(0, 1_000_000)}`;
  return q;
};

const pickBankForm = (allowA: number): NonLinearQuestion => {
  const pool = filteredFormPool(allowA);
  let avail = pool.filter(({ idx }) => !bankUsed.form.has(idx));
  if (!avail.length) { pool.forEach(({ idx }) => bankUsed.form.delete(idx)); avail = pool; }
  const { entry, idx } = pick(avail);
  bankUsed.form.add(idx);
  const q = bankToFormQuestion(entry, idx);
  q.key = `${q.key}-${randInt(0, 1_000_000)}`;
  return q;
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  if (t === "linear") {
    const posOn = multiSelectValues.posSol !== false;
    const negOn = multiSelectValues.negSol === true;
    const negMode: NegMode = negOn && posOn ? "both" : negOn ? "neg-only" : "pos-only";
    const negEq1 = variables.negEq1 === true;
    const zeroForm = variables.zeroForm === true;
    return toQuestion(generateLinear(level, negMode, zeroForm, negEq1), "surd");
  }
  const allowA =
    ((multiSelectValues.coefNone !== false ? 1 : 0) |
     (multiSelectValues.coefOne ? 2 : 0) |
     (multiSelectValues.coefBoth ? 4 : 0)) || 1;
  const surdDisplay: SurdDisplay =
    dropdownValue === "decimal" ? "decimal" : dropdownValue === "both" ? "both" : "surd";
  const sub = t as "factorising" | "formula";
  if (level === "level3") {
    return toQuestion(sub === "factorising" ? pickBankFac(allowA) : pickBankForm(allowA), surdDisplay);
  }
  return toQuestion(generateParabola(sub, level, allowA, surdDisplay, false), surdDisplay);
};

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════
// On-screen display: the two equations, plus the graph on the whiteboard once the
// answer is revealed. Print falls back to the worded lines (both equations); the
// worked-example graph lives in its own step; the worksheet cells stay text-only.
const questionRenderer = (
  q: AnyQuestion, showAnswer: boolean, _cs: string,
  compact?: boolean, _idx?: number, _qo?: QOSnapshot, fontClass?: string,
): JSX.Element | null => {
  const lines = (q as { lines?: string[] }).lines;
  if (!lines) return null;
  const graph = (q as { _graph?: GraphInfo | null })._graph ?? null;
  const eqFont = fontClass ?? (compact === true ? "text-lg" : "text-3xl");
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div className={`${eqFont} font-semibold`} style={{ color: "#000", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: "0.6em", fontWeight: 700, color: "#9ca3af" }}>({i + 1})</span>
            <InlineMath text={ln} />
          </div>
        ))}
      </div>
      {compact === undefined && showAnswer && graph && (
        <div style={{ width: "100%", maxWidth: 460 }}><GraphView g={graph} height={300} /></div>
      )}
    </div>
  );
};

const answerRenderer = (q: AnyQuestion): JSX.Element | null => {
  const lines = (q as { _solLines?: string[] })._solLines;
  if (!lines || !lines.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", color: "#166534", fontWeight: 700 }}>
      {lines.map((l, i) => <MathRenderer key={i} latex={l} />)}
    </div>
  );
};

const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  const graph = (s.extra as { graph?: GraphInfo } | undefined)?.graph;
  if (!graph) return null;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontWeight: 600, color: "#374151", textAlign: "center" }}>{s.plain}</div>
      <div style={{ width: "100%", maxWidth: 460 }}><GraphView g={graph} height={300} /></div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG + INFO
// ═══════════════════════════════════════════════════════════════════════════════
const NEG_EQ1_VAR   = { key: "negEq1",   label: "Negative coefficients in equation (1)", defaultValue: false };
const ZERO_FORM_VAR = { key: "zeroForm", label: 'Include "= 0" form',                    defaultValue: false };

const SIGNS_MS = {
  key: "signs", label: "Solution Types",
  options: [
    { value: "posSol", label: "Positive solutions", defaultActive: true },
    { value: "negSol", label: "Negative solutions", defaultActive: false },
  ],
};

const COEF_MS = {
  key: "coeffs", label: "Curve Type",
  info: "None = circle / simple parabola. One or Both = harder leading coefficients (ellipses at Level 3).",
  options: [
    { value: "coefNone", label: "None", defaultActive: true },
    { value: "coefOne",  label: "One",  defaultActive: false },
    { value: "coefBoth", label: "Both", defaultActive: false },
  ],
};

const DISPLAY_DD = {
  key: "display", label: "Answer Display",
  options: [
    { value: "surd",    label: "Surd" },
    { value: "decimal", label: "Decimal" },
    { value: "both",    label: "Both" },
  ],
  defaultValue: "surd",
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Simultaneous Equations by Substitution",
  tools: {
    linear: {
      name: "Linear",
      instruction: "Solve simultaneously:",
      variables: [NEG_EQ1_VAR],
      dropdown: null,
      multiSelect: SIGNS_MS,
      difficultySettings: {
        level2: { variables: [NEG_EQ1_VAR, ZERO_FORM_VAR] },
      },
    },
    factorising: {
      name: "Non-Linear (Factorising)",
      instruction: "Solve simultaneously:",
      variables: [],
      dropdown: null,
      multiSelect: COEF_MS,
      difficultySettings: null,
    },
    formula: {
      name: "Non-Linear (Formula)",
      instruction: "Solve simultaneously:",
      variables: [],
      dropdown: DISPLAY_DD,
      multiSelect: COEF_MS,
      difficultySettings: null,
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "Linear Substitution", icon: "📐", content: [
    { label: "Overview", detail: "One variable is isolated (or can be isolated) in one equation. Substitute into the other to solve." },
    { label: "Level 1 — Green", detail: "Variable fully isolated. Direct substitution." },
    { label: "Level 2 — Yellow", detail: "Variable has coefficient +1 but not isolated. One rearrangement needed." },
    { label: "Level 3 — Red", detail: "Variable has coefficient −1. Students must manage the sign change." },
  ] },
  { title: "Non-Linear: Factorising", icon: "🟦", content: [
    { label: "Overview", detail: "One equation is quadratic (or a circle / ellipse at Level 3), the other linear. Solved by factorising." },
    { label: "Level 1 — Green", detail: "Linear equation already isolated. Direct substitution." },
    { label: "Level 2 — Yellow", detail: "Linear equation needs rearranging first." },
    { label: "Level 3 — Red", detail: "Circle or ellipse equation. Roots are rational, sometimes fractional." },
  ] },
  { title: "Non-Linear: Formula", icon: "🔢", content: [
    { label: "Overview", detail: "Same structure as Factorising but the quadratic never factorises — the formula is required." },
    { label: "Level 3", detail: "Circle or ellipse with irrational roots. Answers given as surds and/or decimals." },
    { label: "Answer display", detail: "Choose surd (exact), decimal (2dp), or both from the Answer Display option." },
  ] },
  { title: "The Graph", icon: "📈", content: [
    { label: "Intersections", detail: "The solutions are exactly where the two graphs cross — shown on the whiteboard answer and as a worked-example step." },
    { label: "Ellipses", detail: "Circle and line questions are drawn in full; ellipse questions are solved algebraically without a graph." },
  ] },
];

// ═══════════════════════════════════════════════════════════════════════════════
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      answerRenderer={answerRenderer}
      stepRenderer={stepRenderer}
      defaults={{ numQuestions: 12, numColumns: 2, maxColumns: 3 }}
    />
  );
}
