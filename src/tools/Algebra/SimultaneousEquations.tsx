import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  step, mStep, tStep,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
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
const surfaceRhsV2 = (a: number, b: number, c: number, v1: string, v2: string) => {
  const rhs = b >= 0 ? `${c} - ${term(b,v2)}` : `${c} + ${term(-b,v2)}`;
  return `${term(a,v1)} = ${rhs}`;
};
const surfaceRhsV1 = (a: number, b: number, c: number, v1: string, v2: string) => {
  const rhs = a >= 0 ? `${c} - ${term(a,v1)}` : `${c} + ${term(-a,v1)}`;
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
    ? { remainCoeff: bTop-bBot, remainRHS: cTop-cBot, operationDesc: `${topLbl} − ${botLbl}` }
    : { remainCoeff: bBot-bTop, remainRHS: cBot-cTop, operationDesc: `${botLbl} − ${topLbl}` };

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
const generateElimination = (level: DifficultyLevel, allowNeg: boolean, rearrangeMode: RearrangeMode, opMode: OpMode): SimEqQuestion => {
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
    key:`elim-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${id}`,difficulty:level };
};

const generateScaling = (level: DifficultyLevel, allowNeg: boolean, rearrangeMode: RearrangeMode, opMode: OpMode): SimEqQuestion => {
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
    key:`scale-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${b1}-${b2}-${k}-${id}`,difficulty:level };
};

const generateLCM = (level: DifficultyLevel, allowNeg: boolean, rearrangeMode: RearrangeMode, opMode: OpMode): SimEqQuestion => {
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
    key:`lcm-${level}-${caseType}-${v1}${v2}-${v1Val}-${v2Val}-${mag1}-${mag2}-${b1}-${b2}-${id}`,difficulty:level };
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORDED GENERATORS — `lines` entries: numbers/currency in $...$, prose plain.
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

const generateWordedQuestion = (level: DifficultyLevel, types: Record<string,boolean>, method: string): WordedQuestion => {
  if(level==="level1") return genLevel1Worded((method as WordedMethod)||"direct");
  if(level==="level2"){
    const all: L2Type[] = ["sumDiff","moreThan","ratio"];
    const active = all.filter(t => types[t] === true);
    const type = wpick(active.length > 0 ? active : all);
    if(type==="sumDiff") return genSumDiff();
    if(type==="moreThan") return genMoreThan();
    return genRatio();
  }
  const all: L3Type[] = ["purchase","equilateral","isosceles","scalene"];
  const active = all.filter(t => types[t] === true);
  const type = wpick(active.length > 0 ? active : all);
  if(type==="purchase") return genPurchase();
  if(type==="equilateral") return genEquilateral();
  if(type==="isosceles") return genIsosceles();
  return genScalene();
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKING-STEP BUILDERS — flatten the structured solutions into shared steps.
// ═══════════════════════════════════════════════════════════════════════════════
// Convert a definition/interpretation latex (which mixes \text{} prose and a
// literal £) into plain text — KaTeX with a literal £ throws, and these read
// fine as prose anyway.
const texToPlain = (latex: string): string =>
  latex
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\quad/g, "  ")
    .replace(/\\;/g, " ")
    .replace(/\\ /g, " ")
    .replace(/\\pounds\s*/g, "£")
    .replace(/\$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildSimeqWorking = (q: SimEqQuestion): WorkingStep[] => {
  const [v1, v2] = q.varPair;
  const isFactorScaling = !!q.scaleFactor, isLCM = !!q.scaleFactor1;
  const out: WorkingStep[] = [];
  out.push(mStep("Label the equations:", `(1)\\;\\; ${q.eq1Display}`));
  out.push(step(`(2)\\;\\; ${q.eq2Display}`));
  if (q.eq1NeedsRearrange) out.push(mStep("Rearrange equation (1):", `(1)\\;\\; ${q.eq1Canonical}`));
  if (q.eq2NeedsRearrange) out.push(mStep("Rearrange equation (2):", `(2)\\;\\; ${q.eq2Canonical}`));
  if (isLCM && q.scaledEq3Latex && q.scaledEq4Latex) {
    out.push(mStep(`Multiply equation (1) by ${q.scaleFactor1}:`, `(3)\\;\\; ${q.scaledEq3Latex}`));
    out.push(mStep(`Multiply equation (2) by ${q.scaleFactor2}:`, `(4)\\;\\; ${q.scaledEq4Latex}`));
  } else if (isFactorScaling && q.scaledEqLatex) {
    out.push(mStep(`Multiply equation (${q.scaleEq}) by ${q.scaleFactor}:`, `(3)\\;\\; ${q.scaledEqLatex}`));
  }
  const opExplain = q.caseType === "pos-neg"
    ? `The ${v1}-coefficients are equal and opposite — add ${q.operationDesc} to eliminate ${v1}.`
    : q.caseType === "pos-pos"
      ? `The ${v1}-coefficients are equal — subtract ${q.operationDesc} to eliminate ${v1}.`
      : `The ${v1}-coefficients are both negative — subtract ${q.operationDesc} to eliminate ${v1}.`;
  out.push(tStep(opExplain));
  out.push(mStep(`Eliminate ${v1} using ${q.operationDesc}:`, q.afterElimLatex));
  q.solveVarSteps.forEach((s, i) => out.push(i === 0 ? mStep(`Solve for ${v2}:`, s) : step(s)));
  out.push(mStep(`Substitute ${v2} = ${q.v2Val} into equation (1):`, q.subBackSteps[0]));
  q.subBackSteps.slice(1).forEach(s => out.push(step(s)));
  return out;
};

const parseEq = (eq: string): { a: number; b: number; c: number } | null => {
  const re = /^(-?\d*)([a-z])\s*([+-])\s*(\d*)([a-z])\s*=\s*(-?\d+)$/;
  const m = eq.replace(/\s+/g, "").match(re);
  if (!m) return null;
  const a = m[1] === "" || m[1] === "-" ? parseInt(m[1] + "1") : parseInt(m[1]);
  const b = m[3] === "-" ? -(m[4] === "" ? 1 : parseInt(m[4])) : (m[4] === "" ? 1 : parseInt(m[4]));
  const c = parseInt(m[6]);
  return { a, b, c };
};

const buildWordedWorking = (q: WordedQuestion): WorkingStep[] => {
  const { v1, v2, v1Val, v2Val, equation1, equation2 } = q;
  const out: WorkingStep[] = [];
  const tSteps = q.working.filter(s => s.type === "tStep");
  const defineCount = q.subType === "purchase" ? 2 : 1;
  tSteps.slice(0, defineCount).forEach((s, i) => {
    if (i === 0) out.push(tStep("Define the variables: " + texToPlain(s.latex)));
    else out.push(tStep(texToPlain(s.latex)));
  });
  tSteps.slice(defineCount).forEach((s, i) => {
    if (i === 0) out.push(tStep("Interpret the information: " + texToPlain(s.latex)));
    else out.push(tStep(texToPlain(s.latex)));
  });
  out.push(mStep("Form the equations:", `(1)\\;\\; ${equation1}`));
  out.push(step(`(2)\\;\\; ${equation2}`));

  // Solve by elimination (re-derived from the canonical equations).
  const p1 = parseEq(equation1), p2 = parseEq(equation2);
  if (!p1 || !p2) {
    out.push(mStep("Solve:", `${v1} = ${v1Val},\\quad ${v2} = ${v2Val}`));
    return out;
  }
  const { a: a1, b: b1, c: c1 } = p1, { a: a2, b: b2, c: c2 } = p2;
  const g = gcd(Math.abs(a1), Math.abs(a2));
  const m1 = Math.abs(a2) / g, m2 = Math.abs(a1) / g;
  const sa1 = a1 * m1, sb1 = b1 * m1, sc1 = c1 * m1;
  const sa2 = a2 * m2, sb2 = b2 * m2, sc2 = c2 * m2;
  const elim: { latex: string; label?: string }[] = [];
  if (m1 === 1 && m2 === 1) { /* already matched */ }
  else if (m1 > 1 && m2 > 1) {
    elim.push({ label: "(3)", latex: `(1) \\times ${m1}: \\quad ${cStr(sa1,v1)} ${sa1>=0&&sb1>=0?"+":""} ${cStr(sb1,v2)} = ${sc1}` });
    elim.push({ label: "(4)", latex: `(2) \\times ${m2}: \\quad ${cStr(sa2,v1)} ${sa2>=0&&sb2>=0?"+":""} ${cStr(sb2,v2)} = ${sc2}` });
  } else if (m1 > 1) {
    elim.push({ label: "(3)", latex: `(1) \\times ${m1}: \\quad ${cStr(sa1,v1)} ${sa1>=0&&sb1>=0?"+":""} ${cStr(sb1,v2)} = ${sc1}` });
  } else {
    elim.push({ label: "(3)", latex: `(2) \\times ${m2}: \\quad ${cStr(sa2,v1)} ${sa2>=0&&sb2>=0?"+":""} ${cStr(sb2,v2)} = ${sc2}` });
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
  elim.push({ latex: `${lhsLabel} ${op} ${rhsLabel}: \\quad ${cStr(remB,v2)} = ${remC}` });
  if (Math.abs(remB) !== 1) elim.push({ latex: `${v2} = ${remC} \\div ${remB}` });
  elim.push({ latex: `${v2} = ${v2Val}` });
  elim.forEach((l, i) => {
    const ltx = l.label ? `${l.label}\\;\\; ${l.latex}` : l.latex;
    out.push(i === 0 ? mStep("Solve by elimination:", ltx) : step(ltx));
  });
  out.push(tStep(`Substitute ${v2} = ${v2Val} into (1):`));
  out.push(step(`${cStr(a1,v1)} ${b1>=0?"+":"-"} ${Math.abs(b1)}(${v2Val}) = ${c1}`));
  const rem1 = c1 - b1 * v2Val;
  if (Math.abs(a1) === 1) out.push(step(`${v1} = ${rem1}`));
  else { out.push(step(`${cStr(a1,v1)} = ${rem1}`)); out.push(step(`${v1} = ${Math.round(rem1/a1)}`)); }
  return out;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHELL ADAPTER — wrap structured questions as shared AnyQuestion.
// ═══════════════════════════════════════════════════════════════════════════════
const rid = () => Math.floor(Math.random() * 1_000_000);

const toShell = (q: SimEqQuestion | WordedQuestion): AnyQuestion => {
  if (q.kind === "simeq") {
    const [v1, v2] = q.varPair;
    return {
      kind: "simple",
      display: `${q.eq1Display};  ${q.eq2Display}`,
      displayLatex: `\\begin{gathered}${q.eq1Display}\\\\[2pt]${q.eq2Display}\\end{gathered}`,
      answer: `${v1} = ${q.v1Val}, ${v2} = ${q.v2Val}`,
      answerLatex: `${v1} = ${q.v1Val}, \\quad ${v2} = ${q.v2Val}`,
      working: buildSimeqWorking(q),
      key: `${q.key}-${rid()}`,
      difficulty: q.difficulty,
    } as unknown as AnyQuestion;
  }
  const answerPlain = q.answerLines.join("  ").replace(/\\pounds\s*/g, "£").replace(/\$/g, "");
  return {
    kind: "worded",
    lines: q.lines,
    answer: answerPlain,
    working: buildWordedWorking(q),
    key: `${q.key}-${rid()}`,
    difficulty: q.difficulty,
  } as unknown as AnyQuestion;
};

const deriveOpMode = (ms: Record<string, boolean>): OpMode => {
  const add = ms["add"] !== false, sub = ms["subtract"] !== false;
  if (add && sub) return "mixed";
  if (add) return "add";
  if (sub) return "subtract";
  return "mixed";
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL_CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const NEG_VAR = { key: "allowNegSolutions", label: "Negative solutions", defaultValue: false };
const REARRANGE_DD = {
  key: "rearrangeMode", label: "Rearranging",
  options: [{ value: "none", label: "None" }, { value: "one", label: "One" }, { value: "both", label: "Both" }],
  defaultValue: "none",
};
const OP_MS = {
  key: "operation", label: "Operation",
  options: [
    { value: "add", label: "Add", defaultActive: true },
    { value: "subtract", label: "Subtract", defaultActive: true },
  ],
};
const METHOD_DD = {
  key: "method", label: "Method",
  options: [
    { value: "direct", label: "Direct" },
    { value: "scaling", label: "Factor Scaling" },
    { value: "lcm", label: "LCM" },
  ],
  defaultValue: "direct",
};
const L2_MS = {
  key: "l2types", label: "Question Types",
  options: [
    { value: "sumDiff", label: "Sum & Difference", defaultActive: true },
    { value: "moreThan", label: "More Than", defaultActive: true },
    { value: "ratio", label: "Ratio", defaultActive: true },
  ],
};
const L3_MS = {
  key: "l3types", label: "Question Types",
  options: [
    { value: "purchase", label: "Purchase", defaultActive: true },
    { value: "equilateral", label: "Equilateral", defaultActive: true },
    { value: "isosceles", label: "Isosceles", defaultActive: true },
    { value: "scalene", label: "Scalene", defaultActive: true },
  ],
};

const elimLike = (name: string) => ({
  name,
  instruction: "Solve the simultaneous equations:",
  variables: [NEG_VAR],
  dropdown: REARRANGE_DD,
  difficultySettings: {
    level1: { variables: [NEG_VAR], dropdown: REARRANGE_DD, multiSelect: OP_MS },
    level2: { variables: [NEG_VAR], dropdown: REARRANGE_DD },
    level3: { variables: [NEG_VAR], dropdown: REARRANGE_DD },
  },
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Simultaneous Equations",
  tools: {
    elimination: elimLike("Elimination"),
    scaling: elimLike("Factor Scaling"),
    lcm: elimLike("LCM Scaling"),
    worded: {
      name: "Forming & Solving",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: METHOD_DD },
        level2: { variables: [], dropdown: null, multiSelect: L2_MS },
        level3: { variables: [], dropdown: null, multiSelect: L3_MS },
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFO_SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const INFO_SECTIONS: InfoSection[] = [
  { title:"Elimination",icon:"➕",content:[
    {label:"Overview",detail:"One variable already has matching coefficient magnitudes. Add or subtract to eliminate it directly."},
    {label:"Level 1 — Green",detail:"At least one matching coefficient is positive. Use the Operation option to force addition, subtraction, or allow both."},
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
    {label:"Level 1 — Green",detail:"Both equations read directly from the prose. The Method option controls the elimination method used."},
    {label:"Level 2 — Yellow",detail:"Mix of sum/difference, 'more than', and ratio problems."},
    {label:"Level 3 — Red",detail:"Purchase contexts and triangle geometry (equilateral, isosceles, scalene)."},
  ]},
  { title:"Question Options",icon:"⚙️",content:[
    {label:"Operation (Elim Level 1)",detail:"Force addition, subtraction, or allow either (both active)."},
    {label:"Negative solutions",detail:"When on, variable values may be negative."},
    {label:"Rearranging",detail:"When set to One or Both, equations may be given in a rearranged form."},
    {label:"Method (Worded Level 1)",detail:"Controls the coefficient structure: Direct, Factor Scaling, or LCM."},
    {label:"Question Types (Worded L2/L3)",detail:"Toggle individual question types on or off. At least one must stay active."},
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// generateQuestion
// ═══════════════════════════════════════════════════════════════════════════════
const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  if (t === "worded") {
    return toShell(generateWordedQuestion(level, multiSelectValues, dropdownValue || "direct"));
  }
  const allowNeg = variables["allowNegSolutions"] ?? false;
  const rearrange = (dropdownValue || "none") as RearrangeMode;
  const opMode = deriveOpMode(multiSelectValues);
  const q = t === "scaling" ? generateScaling(level, allowNeg, rearrange, opMode)
    : t === "lcm" ? generateLCM(level, allowNeg, rearrange, opMode)
      : generateElimination(level, allowNeg, rearrange, opMode);
  return toShell(q);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════════
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numQuestions: 12, numColumns: 2 }}
    />
  );
}
