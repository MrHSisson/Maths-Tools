import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX — loaded once from CDN, injected into page head
// ═══════════════════════════════════════════════════════════════════════════════

declare global {
  interface Window { katex: any; }
}

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (window.katex) { resolve(); return; }
      // CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
      // JS
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

// ── Math render component ─────────────────────────────────────────────────────

interface MathProps {
  latex: string;
  display?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const MathRenderer = ({ latex, display = false, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(!!window.katex);

  useEffect(() => {
    loadKaTeX().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      window.katex.render(latex, ref.current, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, display, ready]);

  return <span ref={ref} className={className} style={{fontSize:"1.25em", ...style}} />;
};

// ── LaTeX helpers (replace all unicode helpers) ───────────────────────────────

const tex = {
  frac: (n: number | string, d: number | string) => `\\frac{${n}}{${d}}`,
  sqrt: (x: number | string) => `\\sqrt{${x}}`,
  div:  () => `\\div`,
  times: () => `\\times`,
  text: (s: string) => `\\text{${s}}`,
  num:  (n: number | string) => `${n}`,
};

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const toRational = (n: number, d: number) => {
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
};

const formatPartLatex = (n: number, d: number): string => {
  const r = toRational(n, d);
  return r.d === 1 ? `${r.n}` : tex.frac(r.n, r.d);
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION LOGIC — FractionsOfAmounts (fully LaTeX)
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "findFraction" | "worded" | "asFraction";
type DifficultyLevel = "level1" | "level2" | "level3";

interface FracQuestion {
  kind: "frac";
  latex: string;           // LaTeX for the question expression
  display: string;         // plain text fallback / label
  answerLatex: string;     // LaTeX for the answer
  working: { type: string; latex: string; plain: string }[];
  key: string;
  difficulty: string;
}

interface WordedQuestion {
  kind: "worded";
  lines: string[];         // plain text lines (mixed with LaTeX inline)
  answer: string;          // plain text answer
  answerLatex?: string;
  working: { type: string; latex: string; plain: string }[];
  key: string;
  difficulty: string;
}

interface AsFracQuestion {
  kind: "asFrac";
  lines: string[];
  answer: string;
  answerLatex: string;
  working: { type: string; latex: string; plain: string }[];
  key: string;
  difficulty: string;
}

type AnyQuestion = FracQuestion | WordedQuestion | AsFracQuestion;

// ── Helpers ───────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

// Step builder — keeps both a LaTeX version and a plain text version
const step = (plain: string, latex?: string) => ({
  type: "step", plain, latex: latex ?? `\\text{${plain}}`,
});

// ── Find the Fraction — generation ───────────────────────────────────────────

const generateFracQuestion = (level: string, denomRange: string, _answerFormat: string): FracQuestion => {
  const maxDenom = denomRange === "extended" ? 20 : 10;

  if (level === "level1") {
    const d = randInt(2, maxDenom);
    const k = randInt(1, maxDenom);
    const amount = d * k;
    return {
      kind: "frac",
      latex: `${tex.frac(1, d)} \\text{ of } ${amount}`,
      display: `1/${d} of ${amount}`,
      answerLatex: `${k}`,
      working: [
        step(`Divide by the denominator: ${amount} ÷ ${d} = ${k}`,
          `${amount} ${tex.div()} ${d} = ${k}`),
        step(`1/${d} of ${amount} = ${k}`,
          `${tex.frac(1, d)} \\text{ of } ${amount} = ${k}`),
      ],
      key: `f1-${d}-${amount}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const pool: { rn: number; rd: number }[] = [];
    for (let d = 3; d <= maxDenom; d++) {
      for (let n = 2; n < d; n++) {
        const g = gcd(n, d); const rn = n / g, rd = d / g;
        if (rn === 1 || rn === rd || rd > maxDenom) continue;
        if (!pool.some(p => p.rn === rn && p.rd === rd)) pool.push({ rn, rd });
      }
    }
    const { rn, rd } = pick(pool);
    const k = randInt(1, maxDenom);
    const amount = rd * k;
    const answerN = rn * k;
    return {
      kind: "frac",
      latex: `${tex.frac(rn, rd)} \\text{ of } ${amount}`,
      display: `${rn}/${rd} of ${amount}`,
      answerLatex: `${answerN}`,
      working: [
        step(`Find 1 part: ${amount} ÷ ${rd} = ${k}`,
          `${amount} ${tex.div()} ${rd} = ${k}`),
        step(`Multiply by numerator: ${k} × ${rn} = ${answerN}`,
          `${k} ${tex.times()} ${rn} = ${answerN}`),
        step(`${rn}/${rd} of ${amount} = ${answerN}`,
          `${tex.frac(rn, rd)} \\text{ of } ${amount} = ${answerN}`),
      ],
      key: `f2-${rn}-${rd}-${amount}`, difficulty: level,
    };
  }

  // Level 3 — fractional amounts
  type Offset = { num: number; den: number };
  const allOffsets: Offset[] = [
    { num: 1, den: 2 }, { num: 1, den: 4 }, { num: 3, den: 4 },
    { num: 1, den: 3 }, { num: 2, den: 3 },
    { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
    { num: 1, den: 10 }, { num: 3, den: 10 }, { num: 7, den: 10 }, { num: 9, den: 10 },
  ];
  const pool3: { rn: number; rd: number; offsets: Offset[] }[] = [];
  for (let d = 3; d <= maxDenom; d++) {
    for (let n = 2; n < d; n++) {
      const g = gcd(n, d); const rn = n / g, rd = d / g;
      if (rn === 1 || rd < 2 || rn === rd) continue;
      if (pool3.some(p => p.rn === rn && p.rd === rd)) continue;
      const validOffsets = allOffsets.filter(o => (rd * o.num) % o.den === 0);
      if (validOffsets.length === 0) continue;
      pool3.push({ rn, rd, offsets: validOffsets });
    }
  }
  if (pool3.length > 0) {
    const { rn, rd, offsets } = pick(pool3);
    const k = randInt(1, maxDenom - 1);
    const off = pick(offsets);
    const partN = k * off.den + off.num, partD = off.den;
    const amount = (rd * partN) / partD;
    const ansN = rn * partN, ansD = partD;
    const { n: ansRN, d: ansRD } = toRational(ansN, ansD);
    const partLatex = formatPartLatex(partN, partD);
    const ansLatex = formatPartLatex(ansRN, ansRD);
    return {
      kind: "frac",
      latex: `${tex.frac(rn, rd)} \\text{ of } ${amount}`,
      display: `${rn}/${rd} of ${amount}`,
      answerLatex: ansLatex,
      working: [
        step(`Find 1 part: ${amount} ÷ ${rd}`,
          `${amount} ${tex.div()} ${rd} = ${partLatex}`),
        step(`Multiply by numerator`,
          `${partLatex} ${tex.times()} ${rn} = ${ansLatex}`),
        step(`Answer`,
          `${tex.frac(rn, rd)} \\text{ of } ${amount} = ${ansLatex}`),
      ],
      key: `f3-${rn}-${rd}-${amount}`, difficulty: level,
    };
  }
  // Safe fallback — guaranteed valid level2 question
  const k = 4, rn = 3, rd = 5, amount = rd * k, answerN = rn * k;
  return {
    kind: "frac", latex: `${tex.frac(rn,rd)} \\text{ of } ${amount}`,
    display: `${rn}/${rd} of ${amount}`, answerLatex: `${answerN}`,
    working: [step(`Find 1 part: ${amount} ÷ ${rd} = ${k}`, `${amount} ${tex.div()} ${rd} = ${k}`), step(`Multiply: ${k} × ${rn} = ${answerN}`, `${k} ${tex.times()} ${rn} = ${answerN}`)],
    key: `f-fallback-${Math.random()}`, difficulty: level,
  };
};

// ── Worded Questions — data ───────────────────────────────────────────────────

const L1_CONTEXTS = [
  { item: "sweets",   colour1: "red",     colour2: "green"       },
  { item: "marbles",  colour1: "blue",    colour2: "yellow"      },
  { item: "stickers", colour1: "gold",    colour2: "silver"      },
  { item: "counters", colour1: "red",     colour2: "blue"        },
  { item: "apples",   colour1: "red",     colour2: "green"       },
  { item: "books",    colour1: "fiction", colour2: "non-fiction" },
  { item: "coins",    colour1: "gold",    colour2: "silver"      },
  { item: "cards",    colour1: "red",     colour2: "black"       },
];

const L2_CONVERSIONS = [
  { unit: "day",   convertedUnit: "hours",   factor: 24,   hint: "1 day = 24 hours"    },
  { unit: "hour",  convertedUnit: "minutes", factor: 60,   hint: "1 hour = 60 minutes" },
  { unit: "week",  convertedUnit: "days",    factor: 7,    hint: "1 week = 7 days"     },
  { unit: "year",  convertedUnit: "months",  factor: 12,   hint: "1 year = 12 months"  },
  { unit: "metre", convertedUnit: "cm",      factor: 100,  hint: "1 metre = 100 cm"    },
  { unit: "kg",    convertedUnit: "grams",   factor: 1000, hint: "1 kg = 1000 g"       },
  { unit: "pound", convertedUnit: "pence",   factor: 100,  hint: "£1 = 100p"           },
];

const L3_CONTEXTS_ITEMS = [
  { item: "sweets",   verb1: "eats",   verb2: "gives away" },
  { item: "stickers", verb1: "uses",   verb2: "gives away" },
  { item: "marbles",  verb1: "loses",  verb2: "gives away" },
  { item: "cards",    verb1: "uses",   verb2: "gives away" },
  { item: "coins",    verb1: "spends", verb2: "gives away" },
  { item: "beads",    verb1: "uses",   verb2: "gives away" },
];

const NAMES = ["James","Emma","Liam","Olivia","Noah","Ava","Jack","Sophia",
               "Harry","Grace","Sarah","Tom","Amy","Ben","Chloe","Daniel",
               "Ella","Finn","Georgia","Henry","Katie","Declan","Mia","Ryan"];

const buildFracPool = (nonUnitOnly = false) => {
  const pool: { rn: number; rd: number }[] = [];
  for (let d = 2; d <= 10; d++) {
    for (let n = 1; n < d; n++) {
      const g = gcd(n, d); const rn = n / g, rd = d / g;
      if (rd > 10) continue;
      if (nonUnitOnly && rn === 1) continue;
      if (!pool.some(p => p.rn === rn && p.rd === rd)) pool.push({ rn, rd });
    }
  }
  return pool;
};

const ALL_FRAC_POOL  = buildFracPool(false);
const NONUNIT_FRAC_POOL = buildFracPool(true);

const L2_CONTEXT_TEMPLATES: Record<string, { templates: string[] }> = {
  day:   { templates: ["{name} sleeps for {frac} of a day{hint}. How many hours does {name} sleep?","{name} spends {frac} of a day{hint} at school. How many hours is that?","{name} travels for {frac} of a day{hint}. How many hours does {name} travel?"] },
  hour:  { templates: ["{name} practises piano for {frac} of an hour{hint}. How many minutes does {name} practise?","{name} reads for {frac} of an hour{hint}. How many minutes does {name} read?","{name} walks for {frac} of an hour{hint}. How many minutes does {name} walk?"] },
  week:  { templates: ["{name} goes to school for {frac} of a week{hint}. How many days is that?","{name} is on a camping trip for {frac} of a week{hint}. How many days does {name} camp?"] },
  year:  { templates: ["{name} spends {frac} of the year{hint} in the UK. How many months does {name} spend in the UK?","A plant flowers for {frac} of the year{hint}. How many months does it flower?"] },
  metre: { templates: ["{name} cuts {frac} of a metre{hint} of ribbon. How many cm of ribbon does {name} cut?","A shelf is {frac} of a metre{hint} wide. How many cm wide is the shelf?"] },
  kg:    { templates: ["A recipe uses {frac} of a kg{hint} of flour. How many grams of flour is that?","{name} eats {frac} of a kg{hint} of fruit in a week. How many grams is that?"] },
  pound: { templates: ["{name} spends {frac} of a pound{hint} on a sticker. How many pence does {name} spend?","A pencil costs {frac} of a pound{hint}. How many pence does it cost?"] },
};

const generateWordedL1 = (questionType: string): WordedQuestion => {
  const ctx = pick(L1_CONTEXTS);
  const name = pick(NAMES);
  const { rn, rd } = pick(NONUNIT_FRAC_POOL);
  const k = randInt(2, 8);
  const total = rd * k;
  const fracAmount = rn * k;
  const remainder = total - fracAmount;
  const fracLatex = tex.frac(rn, rd);
  const isDirect = questionType === "direct" ? true : questionType === "indirect" ? false : Math.random() < 0.5;
  const lines = isDirect
    ? [`${name} has ${total} ${ctx.item}.`, `$${fracLatex}$ of the ${ctx.item} are ${ctx.colour1}.`, `How many ${ctx.item} are ${ctx.colour1}?`]
    : [`${name} has ${total} ${ctx.item}.`, `$${fracLatex}$ of the ${ctx.item} are ${ctx.colour1}.`, `The rest are ${ctx.colour2}.`, `How many ${ctx.item} are ${ctx.colour2}?`];
  const working = isDirect
    ? [
        step(`Find 1 part: ${total} ÷ ${rd} = ${k}`, `${total} ${tex.div()} ${rd} = ${k}`),
        step(`Multiply: ${k} × ${rn} = ${fracAmount}`, `${k} ${tex.times()} ${rn} = ${fracAmount}`),
        step(`Answer: ${fracAmount} ${ctx.item}`, `${fracLatex} \\text{ of } ${total} = ${fracAmount} \\text{ ${ctx.item}}`),
      ]
    : [
        step(`Find 1 part: ${total} ÷ ${rd} = ${k}`, `${total} ${tex.div()} ${rd} = ${k}`),
        step(`${ctx.colour1}: ${k} × ${rn} = ${fracAmount}`, `${k} ${tex.times()} ${rn} = ${fracAmount}`),
        step(`${ctx.colour2}: ${total} − ${fracAmount} = ${remainder}`, `${total} - ${fracAmount} = ${remainder}`),
      ];
  return {
    kind: "worded", lines,
    answer: `${isDirect ? fracAmount : remainder} ${ctx.item}`,
    working, key: `w1-${name}-${total}-${rn}-${rd}-${isDirect}`, difficulty: "level1",
  };
};

const generateWordedL2 = (showHint: boolean): WordedQuestion => {
  const conv = pick(L2_CONVERSIONS);
  const name = pick(NAMES);
  const validCombos: { qty: number; rn: number; rd: number }[] = [];
  for (let qty = 1; qty <= 5; qty++) {
    const total = conv.factor * qty;
    ALL_FRAC_POOL.forEach(p => { if (total % p.rd === 0) validCombos.push({ qty, rn: p.rn, rd: p.rd }); });
  }
  const { qty, rn, rd } = pick(validCombos);
  const total = conv.factor * qty;
  const part = total / rd;
  const answer = rn * part;
  const fracLatex = tex.frac(rn, rd);
  const qtyWord = qty === 1 ? (conv.unit === "hour" ? "an hour" : `a ${conv.unit}`) : `${qty} ${conv.unit}s`;
  const hintStr = showHint ? ` (${conv.hint})` : "";
  const ctxGroup = L2_CONTEXT_TEMPLATES[conv.unit] ?? L2_CONTEXT_TEMPLATES["day"];
  const template = pick(ctxGroup.templates);
  const questionText = template
    .replace(/of (?:a |an |the )?\w+(\{hint\})/g, `of ${qtyWord}$1`)
    .replace(/{name}/g, name)
    .replace(/{frac}/g, `$${fracLatex}$`)
    .replace(/{hint}/g, hintStr);
  const lines = [questionText];
  const working: { type: string; latex: string; plain: string }[] = [];
  if (qty > 1) working.push(step(`Total: ${qty} × ${conv.factor} = ${total} ${conv.convertedUnit}`, `${qty} ${tex.times()} ${conv.factor} = ${total} \\text{ ${conv.convertedUnit}}`));
  else working.push(step(`Convert: 1 ${conv.unit} = ${conv.factor} ${conv.convertedUnit}`));
  working.push(
    step(`Find 1 part: ${total} ÷ ${rd} = ${part}`, `${total} ${tex.div()} ${rd} = ${part}`),
    step(`Multiply: ${part} × ${rn} = ${answer}`, `${part} ${tex.times()} ${rn} = ${answer}`),
    step(`Answer: ${answer} ${conv.convertedUnit}`, `${fracLatex} \\text{ of } ${qtyWord} = ${answer} \\text{ ${conv.convertedUnit}}`),
  );
  return { kind: "worded", lines, answer: `${answer} ${conv.convertedUnit}`, working, key: `w2-${name}-${conv.unit}-${qty}-${rn}-${rd}`, difficulty: "level2" };
};

const generateWordedL3 = (asFracOfOriginal: boolean, l3Mode: string): WordedQuestion => {
  const fmtMoney = (n: number) => Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
  const allInt = (...vals: number[]) => vals.every(v => Number.isInteger(v));
  const subtype: "fracFrac"|"amountFrac" = l3Mode === "fracFrac" ? "fracFrac" : l3Mode === "amountFrac" ? "amountFrac" : (Math.random() < 0.5 ? "fracFrac" : "amountFrac");
  const useMoney = Math.random() < 0.5;
  const ctx = useMoney ? null : pick(L3_CONTEXTS_ITEMS);
  const name = pick(NAMES);

  if (subtype === "fracFrac") {
    const FRIENDLY_TOTALS = [60,80,90,100,120,150,160,180,200,240];
    const SIMPLE_FRACS = [{rn:3,rd:4},{rn:2,rd:3},{rn:3,rd:5},{rn:4,rd:5},{rn:2,rd:5},{rn:3,rd:10},{rn:7,rd:10},{rn:1,rd:2},{rn:1,rd:4},{rn:1,rd:5},{rn:1,rd:3}];
    let attempts = 0;
    while (attempts < 500) {
      attempts++;
      const total = pick(FRIENDLY_TOTALS);
      const {rn:rn1,rd:rd1} = pick(SIMPLE_FRACS);
      const {rn:rn2,rd:rd2} = pick(SIMPLE_FRACS);
      const keep1 = Math.random()<0.5, keep2 = Math.random()<0.5;
      const part1=total/rd1,fracPart1=rn1*part1,remaining1=keep1?fracPart1:total-fracPart1;
      const part2=remaining1/rd2,fracPart2=rn2*part2,finalLeft=keep2?fracPart2:remaining1-fracPart2;
      if(!allInt(part1,fracPart1,remaining1,part2,fracPart2,finalLeft)||finalLeft<=0||remaining1<=0) continue;
      const finalQ = asFracOfOriginal?"What fraction of the original amount do they have left?":(useMoney?"How much do they have left?":"How many do they have left?");
      const f1=tex.frac(rn1,rd1),f2=tex.frac(rn2,rd2);
      const fmt = useMoney?fmtMoney:(n:number)=>`${n}`;
      const s1=keep1?`They keep $${f1}$ of it.`:`They give $${f1}$ of it away.`;
      const s2=keep2?`They keep $${f2}$ of what remains.`:`They give $${f2}$ of what remains away.`;
      const lines = useMoney
        ?[`${name} has ${fmtMoney(total)}.`,s1,s2,finalQ]
        :[`${name} has ${total} ${ctx!.item}.`,s1,s2,finalQ];
      const working=[
        step(`Find 1 part: ${total} ÷ ${rd1} = ${part1}`,`${total}${tex.div()}${rd1}=${part1}`),
        keep1?step(`${fmt(fracPart1)} kept`,`${f1}\\text{ kept: }${part1}${tex.times()}${rn1}=${fmt(fracPart1)}`):step(`${fmt(fracPart1)} removed`,`${f1}\\text{ away: }${part1}${tex.times()}${rn1}=${fmt(fracPart1)}`),
        keep1?step(`Now has: ${fmt(fracPart1)}`):step(`Now has: ${fmt(remaining1)}`,`${fmt(total)}-${fmt(fracPart1)}=${fmt(remaining1)}`),
        step(`Find 1 part of remainder: ${remaining1}÷${rd2}=${part2}`,`${remaining1}${tex.div()}${rd2}=${part2}`),
        keep2?step(`Final: ${fmt(fracPart2)}`):step(`Final: ${fmt(finalLeft)}`,`${fmt(remaining1)}-${fmt(fracPart2)}=${fmt(finalLeft)}`),
      ];
      let answer=useMoney?fmtMoney(finalLeft):`${finalLeft} ${ctx!.item}`;
      let answerLatex:string|undefined;
      if(asFracOfOriginal){const{n:fn,d:fd}=toRational(finalLeft,total);answer=tex.frac(fn,fd);answerLatex=tex.frac(fn,fd);working.push(step(`As fraction: ${finalLeft}/${total}`,`${tex.frac(finalLeft,total)}=${tex.frac(fn,fd)}`));}
      return{kind:"worded",lines,answer,answerLatex,working,key:`w3ff-${total}-${rn1}-${rd1}-${keep1}-${rn2}-${rd2}-${keep2}`,difficulty:"level3"};
    }
  }

  // Amount-Frac
  const amountFirst=Math.random()<0.5;
  let att=0;
  while(att<500){
    att++;
    const{rn:rn1,rd:rd1}=pick(NONUNIT_FRAC_POOL);
    const multiplier=randInt(3,9),total=rd1*multiplier,keepFrac=Math.random()<0.5;
    const finalQ=asFracOfOriginal?"What fraction of the original amount do they have left?":(useMoney?"How much do they have left?":"How many do they have left?");
    const working:{type:string;latex:string;plain:string}[]=[];
    let lines:string[],answer:string,answerLatex:string|undefined;
    const fmt=useMoney?fmtMoney:(n:number)=>`${n}`;
    const f1=tex.frac(rn1,rd1);
    if(amountFirst){
      const fixedSpend=rd1*randInt(1,multiplier-1),remaining1=total-fixedSpend,part1=remaining1/rd1,fracPart=rn1*part1,finalLeft=keepFrac?fracPart:remaining1-fracPart;
      if(!allInt(remaining1,part1,fracPart,finalLeft)||finalLeft<=0) continue;
      const fs=keepFrac?`They keep $${f1}$ of what remains.`:`They give $${f1}$ of what remains away.`;
      lines=useMoney?[`${name} has ${fmt(total)}.`,`They spend ${fmt(fixedSpend)}.`,fs,finalQ]:[`${name} has ${total} ${ctx!.item}.`,`They ${ctx!.verb1} ${fixedSpend}.`,fs,finalQ];
      working.push(
        step(`After spending: ${fmt(remaining1)}`,`${fmt(total)}-${fmt(fixedSpend)}=${fmt(remaining1)}`),
        step(`1 part: ${remaining1}÷${rd1}=${part1}`,`${remaining1}${tex.div()}${rd1}=${part1}`),
        keepFrac?step(`Kept: ${fmt(fracPart)}`,`${f1}\\text{ kept: }${part1}${tex.times()}${rn1}=${fmt(fracPart)}`):step(`Given: ${fmt(fracPart)}`,`${f1}\\text{ away: }${part1}${tex.times()}${rn1}=${fmt(fracPart)}`),
        keepFrac?step(`Left: ${fmt(fracPart)}`):step(`Left: ${fmt(finalLeft)}`,`${fmt(remaining1)}-${fmt(fracPart)}=${fmt(finalLeft)}`),
      );
      answer=useMoney?fmt(finalLeft):`${finalLeft} ${ctx!.item}`;
      if(asFracOfOriginal){const{n:fn,d:fd}=toRational(finalLeft,total);answer=tex.frac(fn,fd);answerLatex=tex.frac(fn,fd);}
    } else {
      const part1=total/rd1,fracPart=rn1*part1,remaining1=keepFrac?fracPart:total-fracPart;
      const divisors=[2,3,4,5].filter(d=>Number.isInteger(remaining1/d)&&remaining1/d<remaining1);
      if(divisors.length===0) continue;
      const fixedSpend=remaining1/pick(divisors),finalLeft=remaining1-fixedSpend;
      if(!allInt(part1,fracPart,remaining1,fixedSpend,finalLeft)||finalLeft<=0) continue;
      const fs=keepFrac?`They keep $${f1}$ of it.`:`They give $${f1}$ of it away.`;
      lines=useMoney?[`${name} has ${fmt(total)}.`,fs,`They then spend ${fmt(fixedSpend)}.`,finalQ]:[`${name} has ${total} ${ctx!.item}.`,fs,`They then ${ctx!.verb1} ${fixedSpend}.`,finalQ];
      working.push(
        step(`1 part: ${total}÷${rd1}=${part1}`,`${total}${tex.div()}${rd1}=${part1}`),
        keepFrac?step(`Kept: ${fmt(fracPart)}`):step(`Given: ${fmt(fracPart)}`,`${f1}\\text{ away: }${part1}${tex.times()}${rn1}=${fmt(fracPart)}`),
        keepFrac?step(`Now: ${fmt(fracPart)}`):step(`Now: ${fmt(remaining1)}`,`${fmt(total)}-${fmt(fracPart)}=${fmt(remaining1)}`),
        step(`After spending: ${fmt(finalLeft)}`,`${fmt(remaining1)}-${fmt(fixedSpend)}=${fmt(finalLeft)}`),
      );
      answer=useMoney?fmt(finalLeft):`${finalLeft} ${ctx!.item}`;
      if(asFracOfOriginal){const{n:fn,d:fd}=toRational(finalLeft,total);answer=tex.frac(fn,fd);answerLatex=tex.frac(fn,fd);}
    }
    return{kind:"worded",lines,answer,answerLatex,working,key:`w3af-${total}-${rn1}-${rd1}-${amountFirst}-${keepFrac}`,difficulty:"level3"};
  }
  // Safe fallback
  return{kind:"worded",lines:["James has 40 sweets.",`$${tex.frac(3,4)}$ of the sweets are red.`,"How many sweets are red?"],answer:"30 sweets",working:[step("Find 1 part: 40 ÷ 4 = 10",`40 ${tex.div()} 4 = 10`),step("Multiply: 10 × 3 = 30",`10 ${tex.times()} 3 = 30`)],key:`w3-fallback-${Math.random()}`,difficulty:"level3"};
};

const generateWordedQuestion = (level:string,questionType:string,showHint:boolean,asFracOfOriginal:boolean,l3Mode:string):WordedQuestion=>{
  if(level==="level1") return generateWordedL1(questionType);
  if(level==="level2") return generateWordedL2(showHint);
  return generateWordedL3(asFracOfOriginal,l3Mode);
};

// ── As a Fraction ─────────────────────────────────────────────────────────────

const buildPrimeProducts = (maxPrime: number, maxVal: number): number[] => {
  const primes = [2,3,5,7,11,13,17,19].filter(p => p <= maxPrime);
  let products = new Set<number>([1]);
  for (const p of primes) {
    const toAdd: number[] = [];
    products.forEach(x => { let v = x; while (v*p <= maxVal) { v*=p; toAdd.push(v); }});
    toAdd.forEach(v => products.add(v));
  }
  products.delete(1);
  return [...products].sort((a,b)=>a-b);
};

const AF_STD_POOL = buildPrimeProducts(7, 100);
const AF_EXT_POOL = buildPrimeProducts(19, 361);

const AF_L2_CONTEXTS = [
  {total:"books",part1:"fiction",part2:"non-fiction"},{total:"students",part1:"girls",part2:"boys"},
  {total:"sweets",part1:"red",part2:"blue"},{total:"cars",part1:"red",part2:"silver"},
  {total:"shapes",part1:"circles",part2:"triangles"},{total:"days",part1:"sunny",part2:"cloudy"},
  {total:"animals",part1:"cats",part2:"dogs"},{total:"counters",part1:"green",part2:"yellow"},
  {total:"marbles",part1:"striped",part2:"plain"},{total:"biscuits",part1:"chocolate",part2:"plain"},
];

const AF_L3_ITEMS = [
  {item:"sweets",verb1:"eats",verb2:"gives away"},{item:"stickers",verb1:"uses",verb2:"gives away"},
  {item:"marbles",verb1:"loses",verb2:"gives away"},{item:"cards",verb1:"uses",verb2:"gives away"},
  {item:"coins",verb1:"spends",verb2:"gives away"},
];

const generateAsFracL1 = (pool: string, allowUnsimplified: boolean): AsFracQuestion => {
  const P = pool === "extended" ? AF_EXT_POOL : AF_STD_POOL;
  let attempts = 0;
  while (attempts++ < 500) {
    const whole = pick(P.filter(x => x >= 4));
    const part  = pick(P.filter(x => x < whole && x >= 2));
    const g = gcd(part, whole);
    const sn = part/g, sd = whole/g;
    if (sn === sd) continue;
    if (!allowUnsimplified && g === 1) continue;
    const alreadySimplest = g === 1;
    const lines = [`Write ${part} as a fraction of ${whole}.`, `Give your answer in its simplest form.`];
    const ansLatex = tex.frac(sn, sd);
    const working = alreadySimplest
      ? [
          step(`Write as a fraction: ${part}/${whole}`, tex.frac(part, whole)),
          step(`HCF of ${part} and ${whole} = 1`),
          step(`Already in simplest form`, ansLatex),
        ]
      : [
          step(`Write as a fraction: ${part}/${whole}`, tex.frac(part, whole)),
          step(`HCF of ${part} and ${whole} = ${g}`),
          step(`Divide both by ${g}`, `${tex.frac(part, whole)} = ${tex.frac(`${part}\\div${g}`,`${whole}\\div${g}`)} = ${ansLatex}`),
          step(`Answer: ${sn}/${sd}`, ansLatex),
        ];
    return { kind:"asFrac", lines, answer:`${sn}/${sd}`, answerLatex: ansLatex, working, key:`af1-${part}-${whole}`, difficulty:"level1" };
  }
  // Safe fallback
  return { kind:"asFrac", lines:["Write 6 as a fraction of 8.","Give your answer in its simplest form."], answer:"3/4", answerLatex:tex.frac(3,4), working:[step("Write as fraction: 6/8",tex.frac(6,8)),step("HCF of 6 and 8 = 2"),step("Simplify",`${tex.frac(6,8)} = ${tex.frac(3,4)}`)], key:`af1-fallback-${Math.random()}`, difficulty:"level1" };
};

const generateAsFracL2 = (questionType: string): AsFracQuestion => {
  const ctx = pick(AF_L2_CONTEXTS);
  let attempts = 0;
  while (attempts++ < 500) {
    const wholeOpts = [12,14,15,16,18,20,21,24,25,27,28,30,32,35,36,40,42,45,48,50,54,56,60,63,64,70,72,75,80,84,90,96,100];
    const whole = pick(wholeOpts);
    const parts: number[] = [];
    for (let p = 1; p < whole; p++) { if (gcd(p,whole)>1) parts.push(p); }
    if (parts.length===0) continue;
    const part1 = pick(parts.filter(p=>p>=2&&p<=whole-2));
    if (!part1) continue;
    const part2 = whole-part1;
    const g1=gcd(part1,whole),sn1=part1/g1,sd1=whole/g1;
    const g2=gcd(part2,whole),sn2=part2/g2,sd2=whole/g2;
    if(sn1===sd1||sn2===sd2) continue;
    const isDirect = questionType==="direct"||(questionType==="mixed"&&Math.random()<0.5);
    const ansLatex = tex.frac(sn1,sd1);
    let lines: string[], working: {type:string;latex:string;plain:string}[];
    if (isDirect) {
      lines=[`There are ${whole} ${ctx.total} in total.`,`${part1} of them are ${ctx.part1}.`,`Write the number of ${ctx.part1} as a fraction of the total.`,`Give your answer in its simplest form.`];
      working=[
        step(`Write as fraction: ${part1}/${whole}`, tex.frac(part1,whole)),
        step(`HCF of ${part1} and ${whole} = ${g1}`),
        step(`Simplify: ${sn1}/${sd1}`, `${tex.frac(part1,whole)}=${ansLatex}`),
      ];
    } else {
      lines=[`There are ${whole} ${ctx.total} in total.`,`${part2} of them are ${ctx.part2}.`,`The rest are ${ctx.part1}.`,`Write the number of ${ctx.part1} as a fraction of the total.`,`Give your answer in its simplest form.`];
      working=[
        step(`Find ${ctx.part1}: ${whole}−${part2}=${part1}`,`${whole}-${part2}=${part1}`),
        step(`Write as fraction: ${part1}/${whole}`, tex.frac(part1,whole)),
        step(`HCF = ${g1}, simplify`, `${tex.frac(part1,whole)}=${ansLatex}`),
      ];
    }
    return { kind:"asFrac", lines, answer:`${tex.frac(sn1,sd1)}`, answerLatex: ansLatex, working, key:`af2-${ctx.total}-${part1}-${whole}-${isDirect}`, difficulty:"level2" };
  }
  // Safe fallback
  return { kind:"asFrac", lines:["There are 20 books in total.","12 of them are fiction.","Write the number of fiction books as a fraction of the total.","Give your answer in its simplest form."], answer:tex.frac(3,5), answerLatex:tex.frac(3,5), working:[step("Write as fraction: 12/20",tex.frac(12,20)),step("HCF of 12 and 20 = 4"),step("Simplify",`${tex.frac(12,20)} = ${tex.frac(3,5)}`)], key:`af2-fallback-${Math.random()}`, difficulty:"level2" };
};

const generateAsFracL3 = (steps: string): AsFracQuestion => {
  const fmtMoney = (n:number) => Number.isInteger(n)?`£${n}`:`£${n.toFixed(2)}`;
  const useMoney = Math.random()<0.5;
  const name = pick(NAMES);

  if (steps==="1step") {
    let att=0;
    while(att++<500){
      const wholes=[20,24,30,36,40,45,48,50,60,72,80,90,100,120];
      const total=pick(wholes);
      const spend=pick([...Array(total-2)].map((_,i)=>i+1).filter(x=>gcd(total-x,total)>1&&x<total&&total-x>0));
      if(!spend) continue;
      const remaining=total-spend,g=gcd(remaining,total),sn=remaining/g,sd=total/g;
      if(sn===sd) continue;
      const ansLatex=tex.frac(sn,sd);
      let lines:string[],working:{type:string;latex:string;plain:string}[];
      if(useMoney){
        lines=[`${name} has ${fmtMoney(total)}.`,`They spend ${fmtMoney(spend)}.`,`Write the amount they have left as a fraction of the original.`,`Give your answer in its simplest form.`];
        working=[step(`Left: ${fmtMoney(remaining)}`,`${fmtMoney(total)}-${fmtMoney(spend)}=${fmtMoney(remaining)}`),step(`HCF of ${remaining} and ${total} = ${g}`),step(`Answer`,ansLatex)];
      } else {
        const c=pick(AF_L3_ITEMS);
        lines=[`${name} has ${total} ${c.item}.`,`They ${c.verb1} ${spend}.`,`Write the number left as a fraction of the original.`,`Give your answer in its simplest form.`];
        working=[step(`Left: ${total}−${spend}=${remaining}`,`${total}-${spend}=${remaining}`),step(`HCF of ${remaining} and ${total} = ${g}`),step(`Answer`,ansLatex)];
      }
      return{kind:"asFrac",lines,answer:tex.frac(sn,sd),answerLatex:ansLatex,working,key:`af3-1s-${total}-${spend}`,difficulty:"level3"};
    }
  }

  let att2=0;
  while(att2++<500){
    const keepFrac=Math.random()<0.5;
    const{rn,rd}=pick(NONUNIT_FRAC_POOL);
    const multiplier=randInt(4,10),total=rd*multiplier;
    const part1val=total/rd,fracPart=rn*part1val,after1=keepFrac?fracPart:total-fracPart;
    const divisors=[2,3,4,5].filter(d=>Number.isInteger(after1/d)&&after1/d<after1&&after1/d>0);
    if(divisors.length===0) continue;
    const fixedSpend=after1/pick(divisors),finalLeft=after1-fixedSpend;
    if(!Number.isInteger(finalLeft)||finalLeft<=0||finalLeft===total) continue;
    const g=gcd(finalLeft,total),sn=finalLeft/g,sd=total/g;
    if(sn===sd) continue;
    const f=tex.frac(rn,rd),ansLatex=tex.frac(sn,sd);
    let lines:string[],working:{type:string;latex:string;plain:string}[];
    const fmtM=useMoney?fmtMoney:(n:number)=>`${n}`;
    if(useMoney){
      const fs=keepFrac?`They keep $${f}$ of it.`:`They give $${f}$ of it away.`;
      lines=[`${name} has ${fmtMoney(total)}.`,fs,`They then spend ${fmtMoney(fixedSpend)}.`,`Write the amount left as a fraction of the original.`,`Give your answer in its simplest form.`];
    } else {
      const c=pick(AF_L3_ITEMS);
      const fs=keepFrac?`They keep $${f}$ of them.`:`They ${c.verb2} $${f}$ of them.`;
      lines=[`${name} has ${total} ${c.item}.`,fs,`They then ${c.verb1} ${fixedSpend} more.`,`Write the number left as a fraction of the original.`,`Give your answer in its simplest form.`];
    }
    working=[
      step(`1 part: ${total}÷${rd}=${part1val}`,`${total}${tex.div()}${rd}=${part1val}`),
      keepFrac?step(`Kept: ${fmtM(fracPart)}`):step(`Given: ${fmtM(fracPart)}`,`${f}\\text{ away: }${part1val}${tex.times()}${rn}=${fmtM(fracPart)}`),
      keepFrac?step(`After keeping: ${fmtM(fracPart)}`):step(`After: ${fmtM(after1)}`,`${fmtM(total)}-${fmtM(fracPart)}=${fmtM(after1)}`),
      step(`After spending: ${fmtM(finalLeft)}`,`${fmtM(after1)}-${fmtM(fixedSpend)}=${fmtM(finalLeft)}`),
      step(`HCF of ${finalLeft} and ${total} = ${g}`),
      step(`Answer`,ansLatex),
    ];
    return{kind:"asFrac",lines,answer:tex.frac(sn,sd),answerLatex:ansLatex,working,key:`af3-2s-${total}-${rn}-${rd}-${keepFrac}-${fixedSpend}`,difficulty:"level3"};
  }
  // Safe fallback
  return{kind:"asFrac",lines:["Emma has £60.","She gives away $"+tex.frac(1,3)+"$ of it.","She then spends £10.","Write the amount left as a fraction of the original.","Give your answer in its simplest form."],answer:tex.frac(1,2),answerLatex:tex.frac(1,2),working:[step("Given away: 60÷3×1 = 20",`60${tex.div()}3=20`),step("Remaining: 60−20 = 40",`60-20=40`),step("After spending: 40−10 = 30",`40-10=30`),step("As fraction: 30/60",tex.frac(30,60)),step("Simplify: HCF=30",tex.frac(1,2))],key:`af3-fallback-${Math.random()}`,difficulty:"level3"};
};

const generateAsFracQuestion=(level:string,pool:string,questionType:string,afSteps:string,allowUnsimplified:boolean):AsFracQuestion=>{
  if(level==="level1") return generateAsFracL1(pool,allowUnsimplified);
  if(level==="level2") return generateAsFracL2(questionType);
  return generateAsFracL3(afSteps);
};

// ── Unique question factory ───────────────────────────────────────────────────

const generateUniqueQ=(tool:ToolType,level:string,denomRange:string,answerFormat:string,questionType:string,showHint:boolean,asFracOfOriginal:boolean,l3Mode:string,afPool:string,afQuestionType:string,afSteps:string,allowUnsimplified:boolean,usedKeys:Set<string>):AnyQuestion=>{
  let q:AnyQuestion,attempts=0;
  do {
    if(tool==="findFraction") q=generateFracQuestion(level,denomRange,answerFormat);
    else if(tool==="asFraction") q=generateAsFracQuestion(level,afPool,afQuestionType,afSteps,allowUnsimplified);
    else q=generateWordedQuestion(level,questionType,showHint,asFracOfOriginal,l3Mode);
    if(++attempts>200) break;
  } while(usedKeys.has(q!.key));
  usedKeys.add(q!.key);
  return q!;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SHELL v1.7
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_CONFIG = {
  pageTitle: "Fractions of Amounts",
  tools: {
    findFraction: { name: "Finding Amounts" },
    worded:       { name: "Finding Amounts (Worded)" },
    asFraction:   { name: "Expressing as a Fraction" },
  } as Record<string, { name: string }>,
};

const INFO_SECTIONS = [
  { title:"Finding Amounts", icon:"½", content:[
    {label:"Overview",detail:"Practice finding fractions of amounts using the divide-then-multiply method."},
    {label:"Level 1 — Green",detail:"Unit fractions only (e.g. ¼ of 20). Always whole-number answers."},
    {label:"Level 2 — Yellow",detail:"Non-unit fractions (e.g. ³⁄₅ of 40). Whole-number answers."},
    {label:"Level 3 — Red",detail:"Non-unit fractions with decimal or fractional answers."},
    {label:"Answer Format (Level 3)",detail:"Choose between Decimal, Fraction, or Mixed Number."},
  ]},
  { title:"Finding Amounts (Worded)", icon:"📝", content:[
    {label:"Overview",detail:"Apply fractions of amounts to real-world contexts."},
    {label:"Level 1 — Green",detail:"One-step questions. Direct or Indirect variants."},
    {label:"Level 2 — Yellow",detail:"Unit conversion required. Hint can be toggled."},
    {label:"Level 3 — Red",detail:"Two-step questions. Toggle 'Answer as fraction of original' for extra challenge."},
  ]},
  { title:"Expressing as a Fraction", icon:"🔢", content:[
    {label:"Overview",detail:"Write one amount as a fraction of another and simplify."},
    {label:"Level 1 — Green",detail:"Simplify a fraction using the HCF."},
    {label:"Level 2 — Yellow",detail:"Worded contexts with direct or indirect information."},
    {label:"Level 3 — Red",detail:"Two-step problems — spend/give-away then express remainder as fraction."},
  ]},
  { title:"Modes", icon:"🖥️", content:[
    {label:"Whiteboard",detail:"Question on the left, blank working space on the right. Visualiser available."},
    {label:"Worked Example",detail:"Full step-by-step solution revealed on demand."},
    {label:"Worksheet",detail:"Grid of questions. Adjustable count. Print to PDF."},
  ]},
  { title:"PDF / Print", icon:"🖨️", content:[
    {label:"How it works",detail:"Click Print in the worksheet view. A print-optimised A4 page opens. Use your browser's Print dialog and choose 'Save as PDF'."},
    {label:"Scaling",detail:"Font size adapts automatically so all questions fit on one page regardless of count."},
  ]},
];

const LV_LABELS:Record<DifficultyLevel,string> = {level1:"Level 1",level2:"Level 2",level3:"Level 3"};
const LV_HEADER_COLORS:Record<DifficultyLevel,string> = {level1:"text-green-600",level2:"text-yellow-500",level3:"text-red-600"};
const LV_COLORS:Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};

const getQuestionBg = (cs:string) => ({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg    = (cs:string) => ({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

// ── QuestionDisplay — renders any question's main display ─────────────────────

const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => {
  if (q.kind === "frac") {
    // q.latex is e.g. "\frac{1}{3} \text{ of } 27"
    // Split at \text{ of } so only the fraction goes through KaTeX
    const parts = q.latex.split(/\\text\{ of \}/);
    const fracLatex = parts[0].trim();
    const number = parts[1]?.trim() ?? "";
    return (
      <div className={`${cls} font-semibold text-center`} style={{color:"#000",lineHeight:1.5}}>
        <span>Find </span><MathRenderer latex={fracLatex} /><span> of {number}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 text-center">
      {q.lines.map((line, i) => (
        <div key={i} className={`${cls} font-semibold`} style={{color:"#000",lineHeight:1.5}}>
          <InlineMath text={line} />
        </div>
      ))}
    </div>
  );
};

// Renders a string that may contain $...$ inline LaTeX
const InlineMath = ({ text }: { text: string }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1);
          return <MathRenderer key={i} latex={latex} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const AnswerDisplay = ({ q, answerFormat: _answerFormat }: { q: AnyQuestion; answerFormat: string }) => {
  let latex = "";
  if (q.kind === "frac") latex = q.answerLatex;
  else if (q.kind === "asFrac") latex = q.answerLatex;
  else latex = q.answerLatex ?? `\\text{${q.answer}}`;
  return <MathRenderer latex={`= ${latex}`} />;
};

// ── DifficultyToggle ──────────────────────────────────────────────────────────

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([ ["level1","Level 1","bg-green-600"], ["level2","Level 2","bg-yellow-500"], ["level3","Level 3","bg-red-600"] ] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

// ── Shared popover sub-components ─────────────────────────────────────────────

const TogglePill = ({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={()=>onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked?"bg-blue-900":"bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?"translate-x-7":"translate-x-1"}`}/>
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

const SegButtons = ({value,onChange,opts}:{value:string;onChange:(v:string)=>void;opts:{value:string;label:string}[]}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt=>(
      <button key={opt.value} onClick={()=>onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

// ── QO Popovers ───────────────────────────────────────────────────────────────

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
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open?"bg-blue-900 border-blue-900 text-white":"bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
  </button>
);

interface FracQOProps {
  difficulty:string; denomRange:string; onDenomRangeChange:(v:string)=>void;
  denomRangeByLevel:Record<string,string>; onDenomRangeByLevelChange:(lv:string,v:string)=>void;
  answerFormat:string; onAnswerFormatChange:(v:string)=>void; isDifferentiated:boolean;
}
const FracQOPopover = ({difficulty,denomRange,onDenomRangeChange,denomRangeByLevel,onDenomRangeByLevelChange,answerFormat,onAnswerFormatChange,isDifferentiated}:FracQOProps) => {
  const {open,setOpen,ref} = usePopover();
  const RangeButtons = ({value,onChange}:{value:string;onChange:(v:string)=>void}) => (
    <SegButtons value={value} onChange={onChange} opts={[{value:"standard",label:"Standard (2–10)"},{value:"extended",label:"Extended (2–20)"}]}/>
  );
  const AnsFormat = () => (
    <SegButtons value={answerFormat} onChange={onAnswerFormatChange} opts={[{value:"decimal",label:"Decimal"},{value:"fraction",label:"Fraction"},{value:"mixed",label:"Mixed"}]}/>
  );
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {isDifferentiated?(["level1","level2","level3"]as DifficultyLevel[]).map(lv=>(
            <div key={lv} className="flex flex-col gap-2">
              <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
              <div className="flex flex-col gap-2 pl-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Denominator Range</span>
                <RangeButtons value={denomRangeByLevel[lv]??"standard"} onChange={v=>onDenomRangeByLevelChange(lv,v)}/>
                {lv==="level3"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Answer Format</span><AnsFormat/></>}
              </div>
            </div>
          )):(
            <>
              <div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Denominator Range</span><RangeButtons value={denomRange} onChange={onDenomRangeChange}/></div>
              {difficulty==="level3"&&<div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Format</span><AnsFormat/></div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface WordedQOProps {
  difficulty:string; questionType:string; onQuestionTypeChange:(v:string)=>void;
  showHint:boolean; onShowHintChange:(v:boolean)=>void;
  asFracOfOriginal:boolean; onAsFracOfOriginalChange:(v:boolean)=>void;
  l3Mode:string; onL3ModeChange:(v:string)=>void; isDifferentiated:boolean;
  levelQuestionTypes:Record<string,string>; onLevelQuestionTypeChange:(lv:string,v:string)=>void;
  levelShowHints:Record<string,boolean>; onLevelShowHintChange:(lv:string,v:boolean)=>void;
  levelAsFrac:Record<string,boolean>; onLevelAsFracChange:(lv:string,v:boolean)=>void;
  levelL3Mode:Record<string,string>; onLevelL3ModeChange:(lv:string,v:string)=>void;
}
const WordedQOPopover = ({difficulty,questionType,onQuestionTypeChange,showHint,onShowHintChange,asFracOfOriginal,onAsFracOfOriginalChange,l3Mode,onL3ModeChange,isDifferentiated,levelQuestionTypes,onLevelQuestionTypeChange,levelShowHints,onLevelShowHintChange,levelAsFrac,onLevelAsFracChange,levelL3Mode,onLevelL3ModeChange}:WordedQOProps) => {
  const {open,setOpen,ref} = usePopover();
  const renderLevelOpts = (lv:string) => (
    <div className="flex flex-col gap-2 pl-1">
      {lv==="level1"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={levelQuestionTypes[lv]??"mixed"} onChange={v=>onLevelQuestionTypeChange(lv,v)} opts={[{value:"direct",label:"Direct"},{value:"indirect",label:"Indirect"},{value:"mixed",label:"Mixed"}]}/></>}
      {lv==="level2"&&<TogglePill checked={levelShowHints[lv]??false} onChange={v=>onLevelShowHintChange(lv,v)} label="Show conversion hint"/>}
      {lv==="level3"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={levelL3Mode[lv]??"mixed"} onChange={v=>onLevelL3ModeChange(lv,v)} opts={[{value:"fracFrac",label:"Frac/Frac"},{value:"amountFrac",label:"Amount/Frac"},{value:"mixed",label:"Mixed"}]}/><TogglePill checked={levelAsFrac[lv]??false} onChange={v=>onLevelAsFracChange(lv,v)} label="Answer as fraction of original"/></>}
    </div>
  );
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {isDifferentiated?(["level1","level2","level3"]as DifficultyLevel[]).map(lv=>(
            <div key={lv} className="flex flex-col gap-2"><span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>{renderLevelOpts(lv)}</div>
          )):(
            <>
              {difficulty==="level1"&&<div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={questionType} onChange={onQuestionTypeChange} opts={[{value:"direct",label:"Direct"},{value:"indirect",label:"Indirect"},{value:"mixed",label:"Mixed"}]}/></div>}
              {difficulty==="level2"&&<div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span><TogglePill checked={showHint} onChange={onShowHintChange} label="Show conversion hint"/></div>}
              {difficulty==="level3"&&<div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={l3Mode} onChange={onL3ModeChange} opts={[{value:"fracFrac",label:"Frac/Frac"},{value:"amountFrac",label:"Amount/Frac"},{value:"mixed",label:"Mixed"}]}/><span className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">Options</span><TogglePill checked={asFracOfOriginal} onChange={onAsFracOfOriginalChange} label="Answer as fraction of original"/></div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface AsFracQOProps {
  difficulty:string; afPool:string; onAfPoolChange:(v:string)=>void;
  afQuestionType:string; onAfQuestionTypeChange:(v:string)=>void;
  afSteps:string; onAfStepsChange:(v:string)=>void; isDifferentiated:boolean;
  levelAfPool:Record<string,string>; onLevelAfPoolChange:(lv:string,v:string)=>void;
  levelAfQuestionType:Record<string,string>; onLevelAfQuestionTypeChange:(lv:string,v:string)=>void;
  levelAfSteps:Record<string,string>; onLevelAfStepsChange:(lv:string,v:string)=>void;
  afAllowUnsimplified:boolean; onAfAllowUnsimplifiedChange:(v:boolean)=>void;
  levelAfAllowUnsimplified:Record<string,boolean>; onLevelAfAllowUnsimplifiedChange:(lv:string,v:boolean)=>void;
}
const AsFracQOPopover = ({difficulty,afPool,onAfPoolChange,afQuestionType,onAfQuestionTypeChange,afSteps,onAfStepsChange,isDifferentiated,levelAfPool,onLevelAfPoolChange,levelAfQuestionType,onLevelAfQuestionTypeChange,levelAfSteps,onLevelAfStepsChange,afAllowUnsimplified,onAfAllowUnsimplifiedChange,levelAfAllowUnsimplified,onLevelAfAllowUnsimplifiedChange}:AsFracQOProps) => {
  const {open,setOpen,ref} = usePopover();
  const renderLevelOpts = (lv:string) => (
    <div className="flex flex-col gap-3 pl-1">
      {lv==="level1"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Number Range</span><SegButtons value={levelAfPool[lv]??"standard"} onChange={v=>onLevelAfPoolChange(lv,v)} opts={[{value:"standard",label:"Standard (×12)"},{value:"extended",label:"Extended (×19)"}]}/><TogglePill checked={levelAfAllowUnsimplified[lv]??false} onChange={v=>onLevelAfAllowUnsimplifiedChange(lv,v)} label="Include already simplified"/></>}
      {lv==="level2"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={levelAfQuestionType[lv]??"mixed"} onChange={v=>onLevelAfQuestionTypeChange(lv,v)} opts={[{value:"direct",label:"Direct"},{value:"indirect",label:"Indirect"},{value:"mixed",label:"Mixed"}]}/></>}
      {lv==="level3"&&<><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Steps</span><SegButtons value={levelAfSteps[lv]??"mixed"} onChange={v=>onLevelAfStepsChange(lv,v)} opts={[{value:"1step",label:"1 Step"},{value:"2step",label:"2 Steps"},{value:"mixed",label:"Mixed"}]}/></>}
    </div>
  );
  const renderSingleOpts = () => {
    if(difficulty==="level1") return <div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Number Range</span><SegButtons value={afPool} onChange={onAfPoolChange} opts={[{value:"standard",label:"Standard (×12)"},{value:"extended",label:"Extended (×19)"}]}/><TogglePill checked={afAllowUnsimplified} onChange={onAfAllowUnsimplifiedChange} label="Include already simplified"/></div>;
    if(difficulty==="level2") return <div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span><SegButtons value={afQuestionType} onChange={onAfQuestionTypeChange} opts={[{value:"direct",label:"Direct"},{value:"indirect",label:"Indirect"},{value:"mixed",label:"Mixed"}]}/></div>;
    return <div className="flex flex-col gap-2"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Steps</span><SegButtons value={afSteps} onChange={onAfStepsChange} opts={[{value:"1step",label:"1 Step"},{value:"2step",label:"2 Steps"},{value:"mixed",label:"Mixed"}]}/></div>;
  };
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={()=>setOpen(!open)}/>
      {open&&(
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {isDifferentiated?(["level1","level2","level3"]as DifficultyLevel[]).map(lv=>(
            <div key={lv} className="flex flex-col gap-2"><span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>{renderLevelOpts(lv)}</div>
          )):renderSingleOpts()}
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
  const [colorOpen,setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
                {s}
                {colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF
// ═══════════════════════════════════════════════════════════════════════════════

const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
) => {
  const FONT_PX   = 14;
  const PAD_MM    = 3;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ  = questions.length;

  const renderLine = (line: string): string =>
    line.split(/(\$[^$]+\$)/g).map(part => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return `<span class="katex-render" data-latex="${part.slice(1,-1).replace(/"/g,"&quot;")}"></span>`;
      }
      return `<span>${part}</span>`;
    }).join("");

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    let ansHtml = "";
    if (showAnswer) {
      const al = q.kind === "frac" ? q.answerLatex : q.kind === "asFrac" ? q.answerLatex : (q.answerLatex ?? `\\text{${q.answer}}`);
      ansHtml = `<div class="q-answer katex-render" data-latex="= ${al.replace(/"/g,"&quot;")}"></div>`;
    }
    const num = `<span class="q-num">${idx + 1})</span> `;
    if (q.kind === "frac") {
      return `<div style="text-align:center">${num}<span class="q-math katex-render" data-latex="\\text{Find } ${q.latex.replace(/"/g,"&quot;")}"></span></div>${ansHtml}`;
    }
    return `<div style="text-align:center">${num}<span class="q-math">${renderLine(q.lines[0])}</span></div>`
         + `<div class="q-lines">${q.lines.slice(1).map(l => `<div class="q-line">${renderLine(l)}</div>`).join("")}</div>`
         + ansHtml;
  };

  // Build probe HTML — all questions with answers, at correct cell width
  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`
  ).join("");

  // Pre-build question/answer HTML strings for JS to use
  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: questionToHtml(q, i, true),
    difficulty: q.difficulty,
  }));

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm;
  }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }

  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell {
    border: 0.3mm solid #d1d5db; border-radius: 1mm;
    padding: ${PAD_MM}mm;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
  }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header {
    height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center;
    font-size: 3mm; font-weight: 700; border-radius: 1mm;
  }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  .diff-cell {
    border: 0.3mm solid #d1d5db; border-radius: 1mm;
    padding: ${PAD_MM}mm;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
  }

  /* Probe: off-screen, correct CONTENT width (cell minus padding), fixed font for measurement */
  #probe {
    position: fixed; left: -9999px; top: 0; visibility: hidden;
    font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4;
    width: ${cellW_MM - PAD_MM * 2}mm;
  }

  .q-inner  { width: 100%; text-align: center; }
  .q-num    { font-size: ${Math.round(FONT_PX * 0.6)}px; font-weight: 700; color: #1e3a8a; display: inline; margin-right: 1mm; }
  .q-math   { font-size: ${FONT_PX}px; display: inline; }
  .q-lines  { font-size: ${FONT_PX}px; line-height: 1.4; text-align: center; }
  .q-line   { display: block; text-align: center; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 1mm; text-align: center; }
  .katex-render { font-size: 1.25em; display: inline-block; vertical-align: middle; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";

  // Pre-determined row heights for 1–10 rows
  var rowHeights = [];
  for (var r = 1; r <= 10; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  // Question data pre-built in TS
  var qData = ${JSON.stringify(qHtmlData)};

  // Step 1: render KaTeX in probe
  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  // Step 2: measure tallest question+answer content
  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6; // +6mm buffer for line-wrap variation and KaTeX height

  // For differentiated: calculate how many rows fit per page
  var diffPerCol   = Math.floor(totalQ / 3); // questions per level
  var diffUsableH  = usableH - diffHdrMM - GAP_MM; // usable after header
  // Find max rows where cellH >= needed_mm
  var diffRowsPerPage = 1;
  var diffCellH_mm = diffUsableH; // fallback: 1 row
  for (var rd = 0; rd < 10; rd++) {
    var h = (diffUsableH - GAP_MM * rd) / (rd + 1);
    if (h >= needed_mm) {
      diffRowsPerPage = rd + 1;
      diffCellH_mm = h;
    } else {
      break;
    }
  }

  // Step 3: find the optimal row count for STANDARD layout
  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;

  // First try: find smallest rows where capacity >= totalQ AND content fits
  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r];
      rowsPerPage = r + 1;
      found = true;
      break;
    }
  }

  // Fallback: can't fit all on one page — use most rows where content fits
  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) {
        chosenH_mm = rowHeights[r2];
        rowsPerPage = r2 + 1;
      }
    }
  }

  // Step 4: split into pages
  var pageCapacity = isDiff ? diffRowsPerPage : rowsPerPage * cols;
  // For diff, pages is indexed by page number; each page shows diffRowsPerPage per level
  var pages = [];
  if (isDiff) {
    var numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);
    for (var p = 0; p < numDiffPages; p++) {
      pages.push(p); // store page index, not slice of flat array
    }
  } else {
    for (var s = 0; s < qData.length; s += pageCapacity) {
      pages.push(qData.slice(s, s + pageCapacity));
    }
  }
  var totalPages = pages.length;

  function makeCellW(c) {
    return (PAGE_W_MM - GAP_MM * (c - 1)) / c;
  }

  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;">'
         + '<div class="q-inner">' + inner + '</div></div>';
  }

  function buildGrid(pageData, showAnswer, cH) {
    if (isDiff) {
      var pgIdx = pageData; // for diff, pageData is the page index
      var start = pgIdx * diffRowsPerPage;
      var end   = start + diffRowsPerPage;
      var cW = makeCellW(3);
      var lvls = ['level1','level2','level3'];
      var lbls = ['Level 1','Level 2','Level 3'];
      var cols3 = lvls.map(function(lv, li) {
        var lqs = qData.filter(function(q) { return q.difficulty === lv; }).slice(start, end);
        var cells = lqs.map(function(q) {
          return buildCell(showAnswer ? q.a : q.q, cW, cH, true);
        }).join('');
        return '<div class="diff-col"><div class="diff-header ' + lv + '">' + lbls[li] + '</div>' + cells + '</div>';
      }).join('');
      return '<div class="diff-grid" style="grid-template-columns:repeat(3,' + cW + 'mm);">' + cols3 + '</div>';
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) {
      return buildCell(showAnswer ? item.a : item.q, cW, cH, false);
    }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  function buildPage(pageData, showAnswer, pgIdx) {
    var cH  = isDiff ? diffCellH_mm : chosenH_mm;
    var lbl = totalPages > 1
      ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
      : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
    var title = toolName + (showAnswer ? ' — Answers' : '');
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1>'
      + '<div class="meta">' + diffLabel + ' &nbsp;&middot;&nbsp; ' + dateStr + ' &nbsp;&middot;&nbsp; ' + lbl + '</div></div>'
      + buildGrid(pageData, showAnswer, cH)
      + '</div>';
  }

  // Render all question pages then all answer pages
  var html = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('')
           + pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');

  document.getElementById('pages').innerHTML = html;

  // Step 5: render KaTeX in actual pages
  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  // Remove probe
  probe.remove();

  // Auto-open print dialog after a short delay for KaTeX layout to settle
  setTimeout(function() { window.print(); }, 300);
});
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];

  const [currentTool, setCurrentTool] = useState<ToolType>("findFraction");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // Finding Amounts options
  const [denomRange, setDenomRange] = useState("standard");
  const [denomRangeByLevel, setDenomRangeByLevel] = useState<Record<string,string>>({level1:"standard",level2:"standard",level3:"standard"});
  const [answerFormat, setAnswerFormat] = useState("decimal");

  // Expressing as a Fraction options
  const [afPool, setAfPool] = useState("standard");
  const [afQuestionType, setAfQuestionType] = useState("mixed");
  const [afSteps, setAfSteps] = useState("mixed");
  const [afAllowUnsimplified, setAfAllowUnsimplified] = useState(false);
  const [levelAfPool, setLevelAfPool] = useState<Record<string,string>>({level1:"standard",level2:"standard",level3:"standard"});
  const [levelAfQuestionType, setLevelAfQuestionType] = useState<Record<string,string>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelAfSteps, setLevelAfSteps] = useState<Record<string,string>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelAfAllowUnsimplified, setLevelAfAllowUnsimplified] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});

  // Worded options
  const [questionType, setQuestionType] = useState("mixed");
  const [showHint, setShowHint] = useState(false);
  const [asFracOfOriginal, setAsFracOfOriginal] = useState(false);
  const [l3Mode, setL3Mode] = useState("mixed");
  const [levelL3Mode, setLevelL3Mode] = useState<Record<string,string>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelQuestionTypes, setLevelQuestionTypes] = useState<Record<string,string>>({level1:"mixed",level2:"mixed",level3:"mixed"});
  const [levelShowHints, setLevelShowHints] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});
  const [levelAsFrac, setLevelAsFrac] = useState<Record<string,boolean>>({level1:false,level2:false,level3:false});

  // Shared state
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion|null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(15);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);  // whiteboard + worked example
  const [worksheetFontSize, setWorksheetFontSize] = useState(2); // worksheet only
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
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

  // Load KaTeX on mount
  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current) videoRef.current.srcObject=null;
  },[]);

  const startCam = useCallback(async (deviceId?:string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId=deviceId;
      if(!targetDeviceId){
        const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        tmp.getTracks().forEach(t=>t.stop());
        const all=await navigator.mediaDevices.enumerateDevices();
        const builtInPattern=/facetime|built.?in|integrated|internal|front|rear/i;
        const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!builtInPattern.test(d.label));
        if(ext) targetDeviceId=ext.deviceId;
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:targetDeviceId?{deviceId:{exact:targetDeviceId}}:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current) videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    } catch(e:unknown){ setCamError((e instanceof Error?e.message:null)??"Camera unavailable"); }
  },[stopStream]);

  useEffect(()=>{ if(presenterMode) startCam(); else stopStream(); },[presenterMode]);
  useEffect(()=>{ if(presenterMode&&streamRef.current&&videoRef.current) videoRef.current.srcObject=streamRef.current; },[wbFullscreen]);
  useEffect(()=>{
    if(!camDropdownOpen) return;
    const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[camDropdownOpen]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme==="default";
  const fsToolbarBg = isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg = isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg  = isDefaultScheme?"#f5f3f0":qBg;

  const makeQuestion = (): AnyQuestion => {
    if(currentTool==="findFraction") return generateFracQuestion(difficulty,denomRange,answerFormat);
    if(currentTool==="asFraction") return generateAsFracQuestion(difficulty,afPool,afQuestionType,afSteps,afAllowUnsimplified);
    return generateWordedQuestion(difficulty,questionType,showHint,asFracOfOriginal,l3Mode);
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if(isDifferentiated){
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv=>{
        for(let i=0;i<numQuestions;i++){
          questions.push(generateUniqueQ(currentTool,lv,denomRangeByLevel[lv]??"standard",answerFormat,levelQuestionTypes[lv]??"mixed",levelShowHints[lv]??false,levelAsFrac[lv]??false,levelL3Mode[lv]??"mixed",levelAfPool[lv]??"standard",levelAfQuestionType[lv]??"mixed",levelAfSteps[lv]??"mixed",levelAfAllowUnsimplified[lv]??false,usedKeys));
        }
      });
    } else {
      for(let i=0;i<numQuestions;i++){
        questions.push(generateUniqueQ(currentTool,difficulty,denomRange,answerFormat,questionType,showHint,asFracOfOriginal,l3Mode,afPool,afQuestionType,afSteps,afAllowUnsimplified,usedKeys));
      }
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);
  useEffect(()=>{ handleNewQuestion(); },[]);

  // Whiteboard / worked example — larger sizes for single question display
  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  // Worksheet — smaller sizes for grid of questions
  const fontSizes = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length-1;
  const canDecrease = worksheetFontSize > 0;

  // ── QO element selector ──────────────────────────────────────────────────
  const qoEl = (diff=false) => {
    if(currentTool==="findFraction") return <FracQOPopover difficulty={difficulty} denomRange={denomRange} onDenomRangeChange={setDenomRange} denomRangeByLevel={denomRangeByLevel} onDenomRangeByLevelChange={(lv,v)=>setDenomRangeByLevel(p=>({...p,[lv]:v}))} answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat} isDifferentiated={diff}/>;
    if(currentTool==="asFraction") return <AsFracQOPopover difficulty={difficulty} afPool={afPool} onAfPoolChange={setAfPool} afQuestionType={afQuestionType} onAfQuestionTypeChange={setAfQuestionType} afSteps={afSteps} onAfStepsChange={setAfSteps} isDifferentiated={diff} levelAfPool={levelAfPool} onLevelAfPoolChange={(lv,v)=>setLevelAfPool(p=>({...p,[lv]:v}))} levelAfQuestionType={levelAfQuestionType} onLevelAfQuestionTypeChange={(lv,v)=>setLevelAfQuestionType(p=>({...p,[lv]:v}))} levelAfSteps={levelAfSteps} onLevelAfStepsChange={(lv,v)=>setLevelAfSteps(p=>({...p,[lv]:v}))} afAllowUnsimplified={afAllowUnsimplified} onAfAllowUnsimplifiedChange={setAfAllowUnsimplified} levelAfAllowUnsimplified={levelAfAllowUnsimplified} onLevelAfAllowUnsimplifiedChange={(lv,v)=>setLevelAfAllowUnsimplified(p=>({...p,[lv]:v}))}/>;
    return <WordedQOPopover difficulty={difficulty} questionType={questionType} onQuestionTypeChange={setQuestionType} showHint={showHint} onShowHintChange={setShowHint} asFracOfOriginal={asFracOfOriginal} onAsFracOfOriginalChange={setAsFracOfOriginal} l3Mode={l3Mode} onL3ModeChange={setL3Mode} isDifferentiated={diff} levelQuestionTypes={levelQuestionTypes} onLevelQuestionTypeChange={(lv,v)=>setLevelQuestionTypes(p=>({...p,[lv]:v}))} levelShowHints={levelShowHints} onLevelShowHintChange={(lv,v)=>setLevelShowHints(p=>({...p,[lv]:v}))} levelAsFrac={levelAsFrac} onLevelAsFracChange={(lv,v)=>setLevelAsFrac(p=>({...p,[lv]:v}))} levelL3Mode={levelL3Mode} onLevelL3ModeChange={(lv,v)=>setLevelL3Mode(p=>({...p,[lv]:v}))}/>;
  };

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const cellStyle = {backgroundColor:bg, height:"100%", boxSizing:"border-box" as const};
    if(q.kind==="frac"){
      return (
        <div className="rounded-lg p-4 shadow" style={cellStyle}>
          <span className={`${fsz} font-semibold`} style={{color:"#000"}}>
            {idx+1}.&nbsp;<MathRenderer latex={`\\text{Find } ${q.latex}`}/>
          </span>
          {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1`} style={{color:"#059669"}}>
            <MathRenderer latex={`= ${q.answerLatex}`}/>
          </div>}
        </div>
      );
    }
    return (
      <div className="rounded-lg p-4 shadow" style={cellStyle}>
        <div className={`${fsz} font-semibold`} style={{color:"#000",lineHeight:1.6}}>
          <span className="font-bold">{idx+1}.&nbsp;</span>
          {q.lines.map((line,i)=><div key={i}><InlineMath text={line}/></div>)}
        </div>
        {showWorksheetAnswers&&<div className={`${fsz} font-semibold mt-1`} style={{color:"#059669"}}>
          {q.kind==="asFrac"?<MathRenderer latex={`= ${q.answerLatex}`}/>:<span>= {q.answer}</span>}
        </div>}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if(mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Row 1: Level selector + Differentiated */}
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
        {/* Row 2: Questions + Columns + Question Options */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||15)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
              onChange={e=>{ if(!isDifferentiated) setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||3))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        {/* Row 3: Actions */}
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

    const fsToolbar = (
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        {qoEl()}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    // Font size buttons — sit in top-right of question box
    const fontBtnStyle = (enabled: boolean) => ({
      background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
      cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: enabled ? 1 : 0.35,
    });

    const questionBox = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div className="rounded-xl flex items-center justify-center flex-shrink-0 p-8" style={{position:"relative",width:"500px",height:"100%",backgroundColor:stepBg}}>
          {fontControls}
          {currentQuestion
            ? <div className="w-full text-center flex flex-col gap-4 items-center">
                <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
                {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat={answerFormat}/></div>}
              </div>
            : <span className="text-4xl text-gray-400">Generate question</span>}
        </div>
      );
    };

    const questionBoxFS = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div style={{position:"relative",width:"40%",height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:16}}>
          {fontControls}
          {currentQuestion
            ? <>
                <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
                {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat={answerFormat}/></div>}
              </>
            : <span className="text-4xl text-gray-400">Generate question</span>}
        </div>
      );
    };

    const makeRightPanel = (isFS: boolean) => (
      <div style={{flex:isFS?"none":1,width:isFS?"60%":undefined,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&(
          <><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          {camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>
        )}
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          {presenterMode?(
            <div style={{position:"relative"}} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
                onMouseDown={()=>{didLongPress.current=false;longPressTimer.current=setTimeout(()=>{didLongPress.current=true;setCamDropdownOpen(o=>!o);},500);}}
                onMouseUp={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);if(!didLongPress.current)setPresenterMode(false);}}
                onMouseLeave={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);}}
                style={{background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.75)")}
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

    if(wbFullscreen) return (
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div style={{flex:1,display:"flex",minHeight:0}}>
          {questionBoxFS()}
          <div style={{width:2,backgroundColor:"#000",flexShrink:0}}/>
          {makeRightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"600px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>
          {questionBox()}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8 w-full" style={{backgroundColor:qBg}}>
        {currentQuestion?(
          <>
            <div className="text-center py-4 relative">
              <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
                <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayDecrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayDecrease?1:0.35}} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
                <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayIncrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayIncrease?1:0.35}} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
              </div>
              <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
            </div>
            {showAnswer&&(
              <>
                <div className="space-y-4 mt-8">
                  {currentQuestion.working.map((s,i)=>(
                    <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                      <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>Step {i+1}</h4>
                      <div className="text-2xl" style={{color:"#000"}}><MathRenderer latex={s.latex}/></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
                  <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                    <AnswerDisplay q={currentQuestion} answerFormat={answerFormat}/>
                  </span>
                </div>
              </>
            )}
          </>
        ):<div className="text-center text-gray-400 text-4xl py-16">Generate question</div>}
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if(worksheet.length===0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={()=>canDecrease&&setWorksheetFontSize(f=>f-1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canIncrease} onClick={()=>canIncrease&&setWorksheetFontSize(f=>f+1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if(isDifferentiated) return (
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
                {/* Each column is its own grid — grid-auto-rows:1fr equalises cells within the column */}
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
        {/* grid-auto-rows:1fr makes all rows equal height — tallest cell in each row sets the row height */}
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
          <button className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
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
              <div className="rounded-xl shadow-lg overflow-hidden">
                {renderControlBar()}
              </div>
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
