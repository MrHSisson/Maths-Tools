import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type WordedQuestion, type WorkingStep,
  randInt, pick, mStep, fracStr, mStr,
} from "../../shared";

// ── NAVIGATION ────────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button — no React Router.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "findFraction" | "worded" | "asFraction";

// "Find x of y" questions render via the shared "frac" kind (Find <fraction> of <number>) —
// typed locally and cast through `unknown`, mirroring the `_diagram` pattern for SVG tools.
interface FracQuestion {
  kind: "frac";
  latex: string;
  display: string;
  answerLatex: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
}

// ── 2. Helpers ────────────────────────────────────────────────────────────────

const tex = {
  frac: (n: number | string, d: number | string) => `\\frac{${n}}{${d}}`,
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const toRational = (n: number, d: number) => {
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
};

const formatPartLatex = (n: number, d: number): string => {
  const r = toRational(n, d);
  return r.d === 1 ? `${r.n}` : tex.frac(r.n, r.d);
};

// Money — plain "£x" for prose lines, "\pounds x" for KaTeX working steps
const fmtMoney = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`);
const fmtMoneyTex = (n: number) => (Number.isInteger(n) ? `\\pounds ${n}` : `\\pounds ${n.toFixed(2)}`);

const newId = () => Math.floor(Math.random() * 1_000_000);

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Fractions of Amounts",
  tools: {
    findFraction: {
      name: "Finding Amounts",
      variables: [],
      dropdown: {
        key: "denomRange",
        label: "Denominator Range",
        options: [
          { value: "standard", label: "Standard (2–10)" },
          { value: "extended", label: "Extended (2–20)" },
        ],
        defaultValue: "standard",
      },
      difficultySettings: null,
    },
    worded: {
      name: "Finding Amounts (Worded)",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "questionType", label: "Question Type",
            options: [
              { value: "direct", label: "Direct" },
              { value: "indirect", label: "Indirect" },
              { value: "mixed", label: "Mixed" },
            ],
            defaultValue: "mixed",
          },
          variables: [],
        },
        level2: {
          dropdown: null,
          variables: [{ key: "showHint", label: "Show conversion hint", defaultValue: false }],
        },
        level3: {
          dropdown: {
            key: "l3Mode", label: "Question Type",
            options: [
              { value: "fracFrac", label: "Frac/Frac" },
              { value: "amountFrac", label: "Amount/Frac" },
              { value: "mixed", label: "Mixed" },
            ],
            defaultValue: "mixed",
          },
          variables: [{ key: "asFracOfOriginal", label: "Answer as fraction of original", defaultValue: false }],
        },
      },
    },
    asFraction: {
      name: "Expressing as a Fraction",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "pool", label: "Number Range",
            options: [
              { value: "standard", label: "Standard (×12)" },
              { value: "extended", label: "Extended (×19)" },
            ],
            defaultValue: "standard",
          },
          variables: [{ key: "allowUnsimplified", label: "Include already simplified", defaultValue: false }],
        },
        level2: {
          dropdown: {
            key: "questionType", label: "Question Type",
            options: [
              { value: "direct", label: "Direct" },
              { value: "indirect", label: "Indirect" },
              { value: "mixed", label: "Mixed" },
            ],
            defaultValue: "mixed",
          },
          variables: [],
        },
        level3: {
          dropdown: {
            key: "steps", label: "Steps",
            options: [
              { value: "1step", label: "1 Step" },
              { value: "2step", label: "2 Steps" },
              { value: "mixed", label: "Mixed" },
            ],
            defaultValue: "mixed",
          },
          variables: [],
        },
      },
    },
  },
};

// ── 4. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Finding Amounts", icon: "½", content: [
    { label: "Overview", detail: "Practice finding fractions of amounts using the divide-then-multiply method." },
    { label: "Level 1 — Green", detail: "Unit fractions only (e.g. ¼ of 20). Always whole-number answers." },
    { label: "Level 2 — Yellow", detail: "Non-unit fractions (e.g. ³⁄₅ of 40). Whole-number answers." },
    { label: "Level 3 — Red", detail: "Non-unit fractions with decimal or fractional answers." },
    { label: "Denominator Range", detail: "Standard uses denominators 2–10; Extended uses 2–20." },
  ]},
  { title: "Finding Amounts (Worded)", icon: "📝", content: [
    { label: "Overview", detail: "Apply fractions of amounts to real-world contexts." },
    { label: "Level 1 — Green", detail: "One-step questions. Direct or Indirect variants." },
    { label: "Level 2 — Yellow", detail: "Unit conversion required. Hint can be toggled." },
    { label: "Level 3 — Red", detail: "Two-step questions. Toggle 'Answer as fraction of original' for extra challenge." },
  ]},
  { title: "Expressing as a Fraction", icon: "🔢", content: [
    { label: "Overview", detail: "Write one amount as a fraction of another and simplify." },
    { label: "Level 1 — Green", detail: "Simplify a fraction using the HCF." },
    { label: "Level 2 — Yellow", detail: "Worded contexts with direct or indirect information." },
    { label: "Level 3 — Red", detail: "Two-step problems — spend/give-away then express remainder as fraction." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Question on the left, blank working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions. Adjustable count. Print to PDF." },
  ]},
  { title: "PDF / Print", icon: "🖨️", content: [
    { label: "How it works", detail: "Click Print in the worksheet view. A print-optimised A4 page opens. Use your browser's Print dialog and choose 'Save as PDF'." },
    { label: "Scaling", detail: "Font size adapts automatically so all questions fit on one page regardless of count." },
  ]},
];

// ── 5. Finding Amounts — generation ───────────────────────────────────────────

const generateFracQuestion = (level: string, denomRange: string): FracQuestion => {
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
        mStep("Divide by the denominator:", `${amount} \\div ${d} = ${k}`),
        mStep("Answer:", `${k}`),
      ],
      key: `f1-${d}-${amount}-${newId()}`, difficulty: level,
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
        mStep("Find 1 part:", `${amount} \\div ${rd} = ${k}`),
        mStep("Multiply by the numerator:", `${k} \\times ${rn} = ${answerN}`),
        mStep("Answer:", `${answerN}`),
      ],
      key: `f2-${rn}-${rd}-${amount}-${newId()}`, difficulty: level,
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
        mStep("Find 1 part:", `${amount} \\div ${rd} = ${partLatex}`),
        mStep("Multiply by the numerator:", `${partLatex} \\times ${rn} = ${ansLatex}`),
        mStep("Answer:", ansLatex),
      ],
      key: `f3-${rn}-${rd}-${amount}-${newId()}`, difficulty: level,
    };
  }
  // Safe fallback — guaranteed valid level2-style question
  const k = 4, rn = 3, rd = 5, amount = rd * k, answerN = rn * k;
  return {
    kind: "frac",
    latex: `${tex.frac(rn, rd)} \\text{ of } ${amount}`,
    display: `${rn}/${rd} of ${amount}`,
    answerLatex: `${answerN}`,
    working: [
      mStep("Find 1 part:", `${amount} \\div ${rd} = ${k}`),
      mStep("Multiply by the numerator:", `${k} \\times ${rn} = ${answerN}`),
      mStep("Answer:", `${answerN}`),
    ],
    key: `f-fallback-${newId()}`, difficulty: level,
  };
};

// ── 6. Worded Questions — data ────────────────────────────────────────────────

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

const ALL_FRAC_POOL     = buildFracPool(false);
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
  const isDirect = questionType === "direct" ? true : questionType === "indirect" ? false : Math.random() < 0.5;
  const lines = isDirect
    ? [`${name} has ${mStr(total)} ${ctx.item}.`, `${fracStr(rn, rd)} of the ${ctx.item} are ${ctx.colour1}.`, `How many ${ctx.item} are ${ctx.colour1}?`]
    : [`${name} has ${mStr(total)} ${ctx.item}.`, `${fracStr(rn, rd)} of the ${ctx.item} are ${ctx.colour1}.`, `The rest are ${ctx.colour2}.`, `How many ${ctx.item} are ${ctx.colour2}?`];
  const working = isDirect
    ? [
        mStep("Find 1 part:", `${total} \\div ${rd} = ${k}`),
        mStep("Multiply by the numerator:", `${k} \\times ${rn} = ${fracAmount}`),
        mStep("Answer:", `${fracAmount}`, ctx.item),
      ]
    : [
        mStep("Find 1 part:", `${total} \\div ${rd} = ${k}`),
        mStep(`${ctx.colour1}:`, `${k} \\times ${rn} = ${fracAmount}`),
        mStep(`${ctx.colour2}:`, `${total} - ${fracAmount} = ${remainder}`),
      ];
  return {
    kind: "worded", lines,
    answer: `${isDirect ? fracAmount : remainder} ${ctx.item}`,
    working, key: `w1-${name}-${total}-${rn}-${rd}-${isDirect}-${newId()}`, difficulty: "level1",
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
  const qtyWord = qty === 1 ? (conv.unit === "hour" ? "an hour" : `a ${conv.unit}`) : `${mStr(qty)} ${conv.unit}s`;
  const hintStr = showHint ? ` (${conv.hint})` : "";
  const ctxGroup = L2_CONTEXT_TEMPLATES[conv.unit] ?? L2_CONTEXT_TEMPLATES["day"];
  const template = pick(ctxGroup.templates);
  const questionText = template
    .replace(/of (?:a |an |the )?\w+(\{hint\})/g, `of ${qtyWord}$1`)
    .replace(/{name}/g, name)
    .replace(/{frac}/g, fracStr(rn, rd))
    .replace(/{hint}/g, hintStr);
  const lines = [questionText];
  const working: WorkingStep[] = [];
  if (qty > 1) working.push(mStep("Total:", `${qty} \\times ${conv.factor} = ${total}`, conv.convertedUnit));
  else working.push(mStep(`1 ${conv.unit} =`, `${conv.factor}`, conv.convertedUnit));
  working.push(
    mStep("Find 1 part:", `${total} \\div ${rd} = ${part}`),
    mStep("Multiply by the numerator:", `${part} \\times ${rn} = ${answer}`),
    mStep("Answer:", `${answer}`, conv.convertedUnit),
  );
  return { kind: "worded", lines, answer: `${answer} ${conv.convertedUnit}`, working, key: `w2-${name}-${conv.unit}-${qty}-${rn}-${rd}-${newId()}`, difficulty: "level2" };
};

const generateWordedL3 = (asFracOfOriginal: boolean, l3Mode: string): WordedQuestion => {
  const allInt = (...vals: number[]) => vals.every(v => Number.isInteger(v));
  const subtype: "fracFrac"|"amountFrac" = l3Mode === "fracFrac" ? "fracFrac" : l3Mode === "amountFrac" ? "amountFrac" : (Math.random() < 0.5 ? "fracFrac" : "amountFrac");
  const useMoney = Math.random() < 0.5;
  const ctx = useMoney ? null : pick(L3_CONTEXTS_ITEMS);
  const name = pick(NAMES);
  const fTex = useMoney ? fmtMoneyTex : (n: number) => `${n}`;

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
      const s1 = keep1 ? `They keep ${fracStr(rn1,rd1)} of it.` : `They give ${fracStr(rn1,rd1)} of it away.`;
      const s2 = keep2 ? `They keep ${fracStr(rn2,rd2)} of what remains.` : `They give ${fracStr(rn2,rd2)} of what remains away.`;
      const lines = useMoney
        ? [`${name} has ${fmtMoney(total)}.`, s1, s2, finalQ]
        : [`${name} has ${mStr(total)} ${ctx!.item}.`, s1, s2, finalQ];
      const working: WorkingStep[] = [
        mStep("Find 1 part:", `${total} \\div ${rd1} = ${fTex(part1)}`),
        mStep(keep1 ? "Amount kept:" : "Amount given away:", `${fTex(part1)} \\times ${rn1} = ${fTex(fracPart1)}`),
        keep1
          ? mStep("They now have:", fTex(fracPart1))
          : mStep("They now have:", `${fTex(total)} - ${fTex(fracPart1)} = ${fTex(remaining1)}`),
        mStep("Find 1 part of the remainder:", `${remaining1} \\div ${rd2} = ${fTex(part2)}`),
        keep2
          ? mStep("Final amount:", fTex(fracPart2))
          : mStep("Final amount:", `${remaining1} - ${fTex(fracPart2)} = ${fTex(finalLeft)}`),
      ];
      let answer = useMoney ? fmtMoney(finalLeft) : `${finalLeft} ${ctx!.item}`;
      let answerLatex: string | undefined;
      if (asFracOfOriginal) {
        const { n: fn, d: fd } = toRational(finalLeft, total);
        answer = tex.frac(fn, fd);
        answerLatex = tex.frac(fn, fd);
        working.push(mStep("As a fraction of the original:", `${tex.frac(finalLeft, total)} = ${tex.frac(fn, fd)}`));
      }
      return { kind:"worded", lines, answer, answerLatex, working, key:`w3ff-${total}-${rn1}-${rd1}-${keep1}-${rn2}-${rd2}-${keep2}-${newId()}`, difficulty:"level3" };
    }
  }

  // Amount-Frac
  const amountFirst = Math.random()<0.5;
  let att=0;
  while(att<500){
    att++;
    const{rn:rn1,rd:rd1}=pick(NONUNIT_FRAC_POOL);
    const multiplier=randInt(3,9),total=rd1*multiplier,keepFrac=Math.random()<0.5;
    const finalQ=asFracOfOriginal?"What fraction of the original amount do they have left?":(useMoney?"How much do they have left?":"How many do they have left?");
    let lines:string[],answer:string,answerLatex:string|undefined;
    let working: WorkingStep[];
    if(amountFirst){
      const fixedSpend=rd1*randInt(1,multiplier-1),remaining1=total-fixedSpend,part1=remaining1/rd1,fracPart=rn1*part1,finalLeft=keepFrac?fracPart:remaining1-fracPart;
      if(!allInt(remaining1,part1,fracPart,finalLeft)||finalLeft<=0) continue;
      const fs = keepFrac ? `They keep ${fracStr(rn1,rd1)} of what remains.` : `They give ${fracStr(rn1,rd1)} of what remains away.`;
      lines = useMoney
        ? [`${name} has ${fmtMoney(total)}.`,`They spend ${fmtMoney(fixedSpend)}.`,fs,finalQ]
        : [`${name} has ${mStr(total)} ${ctx!.item}.`,`They ${ctx!.verb1} ${mStr(fixedSpend)}.`,fs,finalQ];
      working = [
        mStep(useMoney ? "After spending:" : `After ${ctx!.verb1}:`, `${fTex(total)} - ${fTex(fixedSpend)} = ${fTex(remaining1)}`),
        mStep("Find 1 part:", `${remaining1} \\div ${rd1} = ${fTex(part1)}`),
        mStep(keepFrac ? "Amount kept:" : "Amount given away:", `${fTex(part1)} \\times ${rn1} = ${fTex(fracPart)}`),
        keepFrac
          ? mStep("Final amount:", fTex(fracPart))
          : mStep("Final amount:", `${fTex(remaining1)} - ${fTex(fracPart)} = ${fTex(finalLeft)}`),
      ];
      answer = useMoney ? fmtMoney(finalLeft) : `${finalLeft} ${ctx!.item}`;
      if(asFracOfOriginal){const{n:fn,d:fd}=toRational(finalLeft,total);answer=tex.frac(fn,fd);answerLatex=tex.frac(fn,fd);}
    } else {
      const part1=total/rd1,fracPart=rn1*part1,remaining1=keepFrac?fracPart:total-fracPart;
      const divisors=[2,3,4,5].filter(d=>Number.isInteger(remaining1/d)&&remaining1/d<remaining1);
      if(divisors.length===0) continue;
      const fixedSpend=remaining1/pick(divisors),finalLeft=remaining1-fixedSpend;
      if(!allInt(part1,fracPart,remaining1,fixedSpend,finalLeft)||finalLeft<=0) continue;
      const fs = keepFrac ? `They keep ${fracStr(rn1,rd1)} of it.` : `They give ${fracStr(rn1,rd1)} of it away.`;
      lines = useMoney
        ? [`${name} has ${fmtMoney(total)}.`,fs,`They then spend ${fmtMoney(fixedSpend)}.`,finalQ]
        : [`${name} has ${mStr(total)} ${ctx!.item}.`,fs,`They then ${ctx!.verb1} ${mStr(fixedSpend)}.`,finalQ];
      working = [
        mStep("Find 1 part:", `${total} \\div ${rd1} = ${fTex(part1)}`),
        mStep(keepFrac ? "Amount kept:" : "Amount given away:", `${fTex(part1)} \\times ${rn1} = ${fTex(fracPart)}`),
        keepFrac
          ? mStep("They now have:", fTex(fracPart))
          : mStep("They now have:", `${fTex(total)} - ${fTex(fracPart)} = ${fTex(remaining1)}`),
        mStep(useMoney ? "After spending:" : `After ${ctx!.verb1}:`, `${fTex(remaining1)} - ${fTex(fixedSpend)} = ${fTex(finalLeft)}`),
      ];
      answer = useMoney ? fmtMoney(finalLeft) : `${finalLeft} ${ctx!.item}`;
      if(asFracOfOriginal){const{n:fn,d:fd}=toRational(finalLeft,total);answer=tex.frac(fn,fd);answerLatex=tex.frac(fn,fd);}
    }
    return { kind:"worded", lines, answer, answerLatex, working, key:`w3af-${total}-${rn1}-${rd1}-${amountFirst}-${keepFrac}-${newId()}`, difficulty:"level3" };
  }
  // Safe fallback
  return {
    kind: "worded",
    lines: [`James has ${mStr(40)} sweets.`, `${fracStr(3,4)} of the sweets are red.`, `How many sweets are red?`],
    answer: "30 sweets",
    working: [
      mStep("Find 1 part:", "40 \\div 4 = 10"),
      mStep("Multiply by the numerator:", "10 \\times 3 = 30"),
      mStep("Answer:", "30", "sweets"),
    ],
    key: `w3-fallback-${newId()}`, difficulty: "level3",
  };
};

// ── 7. Expressing as a Fraction — data + generation ──────────────────────────

const buildPrimeProducts = (maxPrime: number, maxVal: number): number[] => {
  const primes = [2,3,5,7,11,13,17,19].filter(p => p <= maxPrime);
  const products = new Set<number>([1]);
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

const generateAsFracL1 = (pool: string, allowUnsimplified: boolean): WordedQuestion => {
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
    const lines = [`Write ${mStr(part)} as a fraction of ${mStr(whole)}.`, `Give your answer in its simplest form.`];
    const ansLatex = tex.frac(sn, sd);
    const working: WorkingStep[] = alreadySimplest
      ? [
          mStep("Write as a fraction:", tex.frac(part, whole)),
          mStep("HCF of the numerator and denominator:", "1"),
          mStep("Already in simplest form:", ansLatex),
        ]
      : [
          mStep("Write as a fraction:", tex.frac(part, whole)),
          mStep("HCF of the numerator and denominator:", `${g}`),
          mStep("Divide both by the HCF:", `${tex.frac(part, whole)} = ${tex.frac(`${part} \\div ${g}`, `${whole} \\div ${g}`)} = ${ansLatex}`),
          mStep("Answer:", ansLatex),
        ];
    return { kind:"worded", lines, answer:`${sn}/${sd}`, answerLatex: ansLatex, working, key:`af1-${part}-${whole}-${newId()}`, difficulty:"level1" };
  }
  // Safe fallback
  return {
    kind: "worded",
    lines: [`Write ${mStr(6)} as a fraction of ${mStr(8)}.`, "Give your answer in its simplest form."],
    answer: "3/4", answerLatex: tex.frac(3,4),
    working: [
      mStep("Write as a fraction:", tex.frac(6,8)),
      mStep("HCF of the numerator and denominator:", "2"),
      mStep("Simplify:", `${tex.frac(6,8)} = ${tex.frac(3,4)}`),
    ],
    key: `af1-fallback-${newId()}`, difficulty: "level1",
  };
};

const generateAsFracL2 = (questionType: string): WordedQuestion => {
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
    let lines: string[], working: WorkingStep[];
    if (isDirect) {
      lines=[`There are ${mStr(whole)} ${ctx.total} in total.`,`${mStr(part1)} of them are ${ctx.part1}.`,`Write the number of ${ctx.part1} as a fraction of the total.`,`Give your answer in its simplest form.`];
      working=[
        mStep("Write as a fraction:", tex.frac(part1,whole)),
        mStep("HCF of the numerator and denominator:", `${g1}`),
        mStep("Simplify:", `${tex.frac(part1,whole)} = ${ansLatex}`),
      ];
    } else {
      lines=[`There are ${mStr(whole)} ${ctx.total} in total.`,`${mStr(part2)} of them are ${ctx.part2}.`,`The rest are ${ctx.part1}.`,`Write the number of ${ctx.part1} as a fraction of the total.`,`Give your answer in its simplest form.`];
      working=[
        mStep(`Find the number of ${ctx.part1}:`, `${whole} - ${part2} = ${part1}`),
        mStep("Write as a fraction:", tex.frac(part1,whole)),
        mStep("Simplify:", `${tex.frac(part1,whole)} = ${ansLatex}`),
      ];
    }
    return { kind:"worded", lines, answer:`${sn1}/${sd1}`, answerLatex: ansLatex, working, key:`af2-${ctx.total}-${part1}-${whole}-${isDirect}-${newId()}`, difficulty:"level2" };
  }
  // Safe fallback
  return {
    kind: "worded",
    lines: [`There are ${mStr(20)} books in total.`, `${mStr(12)} of them are fiction.`, `Write the number of fiction books as a fraction of the total.`, `Give your answer in its simplest form.`],
    answer: "3/5", answerLatex: tex.frac(3,5),
    working: [
      mStep("Write as a fraction:", tex.frac(12,20)),
      mStep("HCF of the numerator and denominator:", "4"),
      mStep("Simplify:", `${tex.frac(12,20)} = ${tex.frac(3,5)}`),
    ],
    key: `af2-fallback-${newId()}`, difficulty: "level2",
  };
};

const generateAsFracL3 = (steps: string): WordedQuestion => {
  const useMoney = Math.random()<0.5;
  const name = pick(NAMES);
  const fTex = useMoney ? fmtMoneyTex : (n: number) => `${n}`;

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
      let lines:string[];
      if(useMoney){
        lines=[`${name} has ${fmtMoney(total)}.`,`They spend ${fmtMoney(spend)}.`,`Write the amount they have left as a fraction of the original.`,`Give your answer in its simplest form.`];
      } else {
        const c=pick(AF_L3_ITEMS);
        lines=[`${name} has ${mStr(total)} ${c.item}.`,`They ${c.verb1} ${mStr(spend)}.`,`Write the number left as a fraction of the original.`,`Give your answer in its simplest form.`];
      }
      const working: WorkingStep[] = [
        mStep("Amount left:", `${fTex(total)} - ${fTex(spend)} = ${fTex(remaining)}`),
        mStep("HCF of the amount left and the original:", `${g}`),
        mStep("Answer:", ansLatex),
      ];
      return { kind:"worded", lines, answer:`${sn}/${sd}`, answerLatex:ansLatex, working, key:`af3-1s-${total}-${spend}-${newId()}`, difficulty:"level3" };
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
    const ansLatex=tex.frac(sn,sd);
    let lines:string[];
    if(useMoney){
      const fs = keepFrac ? `They keep ${fracStr(rn,rd)} of it.` : `They give ${fracStr(rn,rd)} of it away.`;
      lines=[`${name} has ${fmtMoney(total)}.`,fs,`They then spend ${fmtMoney(fixedSpend)}.`,`Write the amount left as a fraction of the original.`,`Give your answer in its simplest form.`];
    } else {
      const c=pick(AF_L3_ITEMS);
      const fs = keepFrac ? `They keep ${fracStr(rn,rd)} of them.` : `They ${c.verb2} ${fracStr(rn,rd)} of them.`;
      lines=[`${name} has ${mStr(total)} ${c.item}.`,fs,`They then ${c.verb1} ${mStr(fixedSpend)} more.`,`Write the number left as a fraction of the original.`,`Give your answer in its simplest form.`];
    }
    const working: WorkingStep[] = [
      mStep("Find 1 part:", `${total} \\div ${rd} = ${fTex(part1val)}`),
      mStep(keepFrac ? "Amount kept:" : "Amount given away:", `${fTex(part1val)} \\times ${rn} = ${fTex(fracPart)}`),
      keepFrac
        ? mStep("They now have:", fTex(fracPart))
        : mStep("They now have:", `${fTex(total)} - ${fTex(fracPart)} = ${fTex(after1)}`),
      mStep("Amount remaining:", `${fTex(after1)} - ${fTex(fixedSpend)} = ${fTex(finalLeft)}`),
      mStep("HCF of the amount left and the original:", `${g}`),
      mStep("Answer:", ansLatex),
    ];
    return { kind:"worded", lines, answer:`${sn}/${sd}`, answerLatex:ansLatex, working, key:`af3-2s-${total}-${rn}-${rd}-${keepFrac}-${fixedSpend}-${newId()}`, difficulty:"level3" };
  }
  // Safe fallback
  return {
    kind: "worded",
    lines: ["Emma has £60.", `She gives away ${fracStr(1,3)} of it.`, "She then spends £10.", "Write the amount left as a fraction of the original.", "Give your answer in its simplest form."],
    answer: "1/2", answerLatex: tex.frac(1,2),
    working: [
      mStep("Amount given away:", "60 \\div 3 \\times 1 = 20"),
      mStep("Amount remaining:", "60 - 20 = 40"),
      mStep("After spending:", "40 - 10 = 30"),
      mStep("Write as a fraction:", tex.frac(30,60)),
      mStep("Simplify:", `${tex.frac(30,60)} = ${tex.frac(1,2)}`),
    ],
    key: `af3-fallback-${newId()}`, difficulty: "level3",
  };
};

// ── 8. generateQuestion / generateUniqueQ ────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  _multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;

  if (t === "findFraction") {
    return generateFracQuestion(level, dropdownValue || "standard") as unknown as AnyQuestion;
  }

  if (t === "worded") {
    if (level === "level1") return generateWordedL1(dropdownValue || "mixed");
    if (level === "level2") return generateWordedL2(variables.showHint ?? false);
    return generateWordedL3(variables.asFracOfOriginal ?? false, dropdownValue || "mixed");
  }

  // asFraction
  if (level === "level1") return generateAsFracL1(dropdownValue || "standard", variables.allowUnsimplified ?? false);
  if (level === "level2") return generateAsFracL2(dropdownValue || "mixed");
  return generateAsFracL3(dropdownValue || "mixed");
};

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      defaults={{ worksheetFontSize: 2 }}
    />
  );
}
