import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  randInt, pick, mStep, tStep, fracStr,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "findFraction" | "worded" | "asFraction";

// ── 2. Maths helpers ──────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const toRational = (n: number, d: number) => { const g = gcd(Math.abs(n), Math.abs(d)); return { n: n / g, d: d / g }; };
const f = (n: number | string, d: number | string) => `\\dfrac{${n}}{${d}}`;
const formatPartLatex = (n: number, d: number): string => { const r = toRational(n, d); return r.d === 1 ? `${r.n}` : f(r.n, r.d); };
const partPlain = (n: number, d: number): string => { const r = toRational(n, d); return r.d === 1 ? `${r.n}` : `${r.n}/${r.d}`; };

// Money-aware amount: KaTeX-safe latex (\pounds) and plain text (£).
const aL = (n: number, money: boolean) => (money ? `\\pounds ${n}` : `${n}`);
const aP = (n: number, money: boolean) => (money ? `£${n}` : `${n}`);

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const DENOM_DD = {
  key: "denomRange", label: "Denominator Range",
  options: [{ value: "standard", label: "Standard (2–10)" }, { value: "extended", label: "Extended (2–20)" }],
  defaultValue: "standard",
};

const QTYPE_DD = {
  key: "questionType", label: "Question Type",
  options: [{ value: "direct", label: "Direct" }, { value: "indirect", label: "Indirect" }, { value: "mixed", label: "Mixed" }],
  defaultValue: "mixed",
};
const SHOW_HINT_VAR = { key: "showHint", label: "Show conversion hint", defaultValue: false };
const L3MODE_DD = {
  key: "l3Mode", label: "Question Type",
  options: [{ value: "fracFrac", label: "Frac / Frac" }, { value: "amountFrac", label: "Amount / Frac" }, { value: "mixed", label: "Mixed" }],
  defaultValue: "mixed",
};
const AS_FRAC_VAR = { key: "asFracOfOriginal", label: "Answer as fraction of original", defaultValue: false };

const AF_POOL_DD = {
  key: "afPool", label: "Number Range",
  options: [{ value: "standard", label: "Standard (×12)" }, { value: "extended", label: "Extended (×19)" }],
  defaultValue: "standard",
};
const AF_UNSIMP_VAR = { key: "allowUnsimplified", label: "Include already simplified", defaultValue: false };
const AF_QTYPE_DD = {
  key: "afQuestionType", label: "Question Type",
  options: [{ value: "direct", label: "Direct" }, { value: "indirect", label: "Indirect" }, { value: "mixed", label: "Mixed" }],
  defaultValue: "mixed",
};
const AF_STEPS_DD = {
  key: "afSteps", label: "Steps",
  options: [{ value: "1step", label: "1 Step" }, { value: "2step", label: "2 Steps" }, { value: "mixed", label: "Mixed" }],
  defaultValue: "mixed",
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Fractions of Amounts",
  tools: {

    findFraction: {
      name: "Finding Amounts",
      instruction: "Work out:",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: DENOM_DD },
        level2: { variables: [], dropdown: DENOM_DD },
        level3: { variables: [], dropdown: DENOM_DD },
      },
    },

    worded: {
      name: "Finding Amounts (Worded)",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: QTYPE_DD },
        level2: { variables: [SHOW_HINT_VAR], dropdown: null },
        level3: { variables: [AS_FRAC_VAR], dropdown: L3MODE_DD },
      },
    },

    asFraction: {
      name: "Expressing as a Fraction",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [AF_UNSIMP_VAR], dropdown: AF_POOL_DD },
        level2: { variables: [], dropdown: AF_QTYPE_DD },
        level3: { variables: [], dropdown: AF_STEPS_DD },
      },
    },

  },
};

// ── 4. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Finding Amounts", icon: "½", content: [
    { label: "Overview",         detail: "Find a fraction of an amount using the divide-then-multiply method." },
    { label: "Level 1 — Green",  detail: "Unit fractions only (e.g. ¼ of 20). Whole-number answers." },
    { label: "Level 2 — Yellow", detail: "Non-unit fractions (e.g. ³⁄₅ of 40). Whole-number answers." },
    { label: "Level 3 — Red",    detail: "Non-unit fractions of non-multiple amounts, giving fractional answers." },
    { label: "Denominator Range", detail: "Standard uses denominators 2–10; Extended goes up to 20." },
  ]},
  { title: "Finding Amounts (Worded)", icon: "📝", content: [
    { label: "Overview",         detail: "Apply fractions of amounts to real-world contexts." },
    { label: "Level 1 — Green",  detail: "One-step problems. Direct or indirect (find the rest) variants." },
    { label: "Level 2 — Yellow", detail: "Unit conversion required first. Conversion hint can be toggled." },
    { label: "Level 3 — Red",    detail: "Two-step problems. Toggle 'Answer as fraction of original' for extra challenge." },
  ]},
  { title: "Expressing as a Fraction", icon: "🔢", content: [
    { label: "Overview",         detail: "Write one amount as a fraction of another and simplify." },
    { label: "Level 1 — Green",  detail: "Simplify a fraction using the HCF. Optionally include already-simplified answers." },
    { label: "Level 2 — Yellow", detail: "Worded contexts with direct or indirect information." },
    { label: "Level 3 — Red",    detail: "One- or two-step problems — spend/give away, then express the remainder as a fraction." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Question on the left, working space on the right." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "Grid of questions with adjustable count and PDF export." },
  ]},
];

// ── 5. Worded data ────────────────────────────────────────────────────────────

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
  { item: "sweets",   verb1: "eat",   verb2: "give away" },
  { item: "stickers", verb1: "use",   verb2: "give away" },
  { item: "marbles",  verb1: "lose",  verb2: "give away" },
  { item: "cards",    verb1: "use",   verb2: "give away" },
  { item: "coins",    verb1: "spend", verb2: "give away" },
  { item: "beads",    verb1: "use",   verb2: "give away" },
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

// ── 6. Finding Amounts (findFraction) ─────────────────────────────────────────

const genFrac = (level: DifficultyLevel, denomRange: string): AnyQuestion => {
  const maxDenom = denomRange === "extended" ? 20 : 10;

  if (level === "level1") {
    const d = randInt(2, maxDenom);
    const k = randInt(1, maxDenom);
    const amount = d * k;
    return {
      kind: "worded",
      lines: [`Find ${fracStr(1, d)} of ${amount}`],
      answer: `${k}`, answerLatex: `${k}`,
      working: [mStep("Divide by the denominator:", [`${amount} \\div ${d}`, `= ${k}`])],
      key: `findFraction-level1-${d}-${amount}`, difficulty: level,
    } as AnyQuestion;
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
      kind: "worded",
      lines: [`Find ${fracStr(rn, rd)} of ${amount}`],
      answer: `${answerN}`, answerLatex: `${answerN}`,
      working: [
        mStep("Find the value of one part:", [`${amount} \\div ${rd}`, `= ${k}`]),
        mStep("Multiply by the numerator:", [`${k} \\times ${rn}`, `= ${answerN}`]),
      ],
      key: `findFraction-level2-${rn}-${rd}-${amount}`, difficulty: level,
    } as AnyQuestion;
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
    const ansLatex  = formatPartLatex(ansRN, ansRD);
    return {
      kind: "worded",
      lines: [`Find ${fracStr(rn, rd)} of ${amount}`],
      answer: partPlain(ansRN, ansRD), answerLatex: ansLatex,
      working: [
        mStep("Find the value of one part:", [`${amount} \\div ${rd}`, `= ${partLatex}`]),
        mStep("Multiply by the numerator:", [`${partLatex} \\times ${rn}`, `= ${ansLatex}`]),
      ],
      key: `findFraction-level3-${rn}-${rd}-${amount}`, difficulty: level,
    } as AnyQuestion;
  }
  // Safe fallback — guaranteed valid level-2-style question
  const k = 4, rn = 3, rd = 5, amount = rd * k, answerN = rn * k;
  return {
    kind: "worded",
    lines: [`Find ${fracStr(rn, rd)} of ${amount}`],
    answer: `${answerN}`, answerLatex: `${answerN}`,
    working: [
      mStep("Find the value of one part:", [`${amount} \\div ${rd}`, `= ${k}`]),
      mStep("Multiply by the numerator:", [`${k} \\times ${rn}`, `= ${answerN}`]),
    ],
    key: `findFraction-level3-fallback-${amount}`, difficulty: level,
  } as AnyQuestion;
};

// ── 7. Worded ─────────────────────────────────────────────────────────────────

const genWordedL1 = (questionType: string): AnyQuestion => {
  const ctx = pick(L1_CONTEXTS);
  const name = pick(NAMES);
  const { rn, rd } = pick(NONUNIT_FRAC_POOL);
  const k = randInt(2, 8);
  const total = rd * k;
  const fracAmount = rn * k;
  const remainder = total - fracAmount;
  const isDirect = questionType === "direct" ? true : questionType === "indirect" ? false : Math.random() < 0.5;
  const lines = isDirect
    ? [`${name} has ${total} ${ctx.item}.`, `${fracStr(rn, rd)} of the ${ctx.item} are ${ctx.colour1}.`, `How many ${ctx.item} are ${ctx.colour1}?`]
    : [`${name} has ${total} ${ctx.item}.`, `${fracStr(rn, rd)} of the ${ctx.item} are ${ctx.colour1}.`, `The rest are ${ctx.colour2}.`, `How many ${ctx.item} are ${ctx.colour2}?`];
  const working = isDirect
    ? [
        mStep("Find the value of one part:", [`${total} \\div ${rd}`, `= ${k}`]),
        mStep("Multiply by the numerator:", [`${k} \\times ${rn}`, `= ${fracAmount}`]),
      ]
    : [
        mStep("Find the value of one part:", [`${total} \\div ${rd}`, `= ${k}`]),
        mStep(`${ctx.colour1}:`, [`${k} \\times ${rn}`, `= ${fracAmount}`]),
        mStep(`${ctx.colour2}:`, [`${total} - ${fracAmount}`, `= ${remainder}`]),
      ];
  const ans = isDirect ? fracAmount : remainder;
  return {
    kind: "worded", lines,
    answer: `${ans} ${ctx.item}`, answerLatex: `${ans}`, answerSuffix: ctx.item,
    working, key: `worded-level1-${name}-${total}-${rn}-${rd}-${isDirect}`, difficulty: "level1",
  } as AnyQuestion;
};

const genWordedL2 = (showHint: boolean): AnyQuestion => {
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
  const qtyWord = qty === 1 ? (conv.unit === "hour" ? "an hour" : `a ${conv.unit}`) : `${qty} ${conv.unit}s`;
  const hintStr = showHint ? ` (${conv.hint})` : "";
  const ctxGroup = L2_CONTEXT_TEMPLATES[conv.unit] ?? L2_CONTEXT_TEMPLATES["day"];
  const template = pick(ctxGroup.templates);
  const questionText = template
    .replace(/of (?:a |an |the )?\w+(\{hint\})/g, `of ${qtyWord}$1`)
    .replace(/{name}/g, name)
    .replace(/{frac}/g, fracStr(rn, rd))
    .replace(/{hint}/g, hintStr);
  const working = [];
  if (qty > 1) working.push(mStep("Work out the total:", [`${qty} \\times ${conv.factor}`, `= ${total}`], conv.convertedUnit));
  else working.push(tStep(`1 ${conv.unit} = ${conv.factor} ${conv.convertedUnit}`));
  working.push(
    mStep("Find the value of one part:", [`${total} \\div ${rd}`, `= ${part}`]),
    mStep("Multiply by the numerator:", [`${part} \\times ${rn}`, `= ${answer}`]),
  );
  return {
    kind: "worded", lines: [questionText],
    answer: `${answer} ${conv.convertedUnit}`, answerLatex: `${answer}`, answerSuffix: conv.convertedUnit,
    working, key: `worded-level2-${name}-${conv.unit}-${qty}-${rn}-${rd}`, difficulty: "level2",
  } as AnyQuestion;
};

const genWordedL3 = (asFracOfOriginal: boolean, l3Mode: string): AnyQuestion => {
  const allInt = (...vals: number[]) => vals.every(v => Number.isInteger(v));
  const subtype: "fracFrac" | "amountFrac" =
    l3Mode === "fracFrac" ? "fracFrac" : l3Mode === "amountFrac" ? "amountFrac" : (Math.random() < 0.5 ? "fracFrac" : "amountFrac");
  const useMoney = Math.random() < 0.5;
  const ctx = useMoney ? null : pick(L3_CONTEXTS_ITEMS);
  const name = pick(NAMES);
  const pron = useMoney ? "it" : "them"; // money is a mass noun ("of it"); items are countable ("of them")
  const finalQ = asFracOfOriginal
    ? "What fraction of the original amount do they have left?"
    : (useMoney ? "How much do they have left?" : "How many do they have left?");

  const asFracAnswer = (finalLeft: number, total: number, working: WorkingStep[]) => {
    const { n: fn, d: fd } = toRational(finalLeft, total);
    working.push(mStep("As a fraction of the original:", [`${f(finalLeft, total)}`, `= ${f(fn, fd)}`]));
    return { answer: `${fn}/${fd}`, answerLatex: f(fn, fd), answerSuffix: undefined as string | undefined };
  };
  const plainAnswer = (finalLeft: number) =>
    useMoney
      ? { answer: `£${finalLeft}`, answerLatex: aL(finalLeft, true), answerSuffix: undefined as string | undefined }
      : { answer: `${finalLeft} ${ctx!.item}`, answerLatex: `${finalLeft}`, answerSuffix: ctx!.item };

  if (subtype === "fracFrac") {
    const FRIENDLY_TOTALS = [60,80,90,100,120,150,160,180,200,240];
    const SIMPLE_FRACS = [{rn:3,rd:4},{rn:2,rd:3},{rn:3,rd:5},{rn:4,rd:5},{rn:2,rd:5},{rn:3,rd:10},{rn:7,rd:10},{rn:1,rd:2},{rn:1,rd:4},{rn:1,rd:5},{rn:1,rd:3}];
    let attempts = 0;
    while (attempts++ < 500) {
      const total = pick(FRIENDLY_TOTALS);
      const { rn: rn1, rd: rd1 } = pick(SIMPLE_FRACS);
      const { rn: rn2, rd: rd2 } = pick(SIMPLE_FRACS);
      const keep1 = Math.random() < 0.5, keep2 = Math.random() < 0.5;
      const part1 = total / rd1, fracPart1 = rn1 * part1, remaining1 = keep1 ? fracPart1 : total - fracPart1;
      const part2 = remaining1 / rd2, fracPart2 = rn2 * part2, finalLeft = keep2 ? fracPart2 : remaining1 - fracPart2;
      if (!allInt(part1, fracPart1, remaining1, part2, fracPart2, finalLeft) || finalLeft <= 0 || remaining1 <= 0) continue;
      const s1 = keep1 ? `They keep ${fracStr(rn1, rd1)} of ${pron}.` : `They give ${fracStr(rn1, rd1)} of ${pron} away.`;
      const s2 = keep2 ? `They keep ${fracStr(rn2, rd2)} of what remains.` : `They give ${fracStr(rn2, rd2)} of what remains away.`;
      const lines = useMoney
        ? [`${name} has £${total}.`, s1, s2, finalQ]
        : [`${name} has ${total} ${ctx!.item}.`, s1, s2, finalQ];
      const working = [
        mStep("Find one part:", [`${aL(total, useMoney)} \\div ${rd1}`, `= ${aL(part1, useMoney)}`]),
        mStep(keep1 ? "Amount kept:" : "Amount given away:", [`${aL(part1, useMoney)} \\times ${rn1}`, `= ${aL(fracPart1, useMoney)}`]),
        keep1
          ? tStep(`They now have ${aP(fracPart1, useMoney)}.`)
          : mStep("They now have:", [`${aL(total, useMoney)} - ${aL(fracPart1, useMoney)}`, `= ${aL(remaining1, useMoney)}`]),
        mStep("Find one part of the remainder:", [`${aL(remaining1, useMoney)} \\div ${rd2}`, `= ${aL(part2, useMoney)}`]),
        ...(keep2
          ? [mStep("Final amount:", [`${aL(part2, useMoney)} \\times ${rn2}`, `= ${aL(fracPart2, useMoney)}`])]
          : [
              mStep("Amount given away:", [`${aL(part2, useMoney)} \\times ${rn2}`, `= ${aL(fracPart2, useMoney)}`]),
              mStep("Final amount:", [`${aL(remaining1, useMoney)} - ${aL(fracPart2, useMoney)}`, `= ${aL(finalLeft, useMoney)}`]),
            ]),
      ];
      const res = asFracOfOriginal ? asFracAnswer(finalLeft, total, working) : plainAnswer(finalLeft);
      return {
        kind: "worded", lines, ...res, working,
        key: `worded-level3-ff-${total}-${rn1}-${rd1}-${keep1}-${rn2}-${rd2}-${keep2}-${useMoney}`, difficulty: "level3",
      } as AnyQuestion;
    }
  }

  // Amount / Frac
  const amountFirst = Math.random() < 0.5;
  let att = 0;
  while (att++ < 500) {
    const { rn: rn1, rd: rd1 } = pick(NONUNIT_FRAC_POOL);
    const multiplier = randInt(3, 9), total = rd1 * multiplier, keepFrac = Math.random() < 0.5;
    const f1 = fracStr(rn1, rd1);
    if (amountFirst) {
      const fixedSpend = rd1 * randInt(1, multiplier - 1), remaining1 = total - fixedSpend;
      const part1 = remaining1 / rd1, fracPart = rn1 * part1, finalLeft = keepFrac ? fracPart : remaining1 - fracPart;
      if (!allInt(remaining1, part1, fracPart, finalLeft) || finalLeft <= 0) continue;
      const fs = keepFrac ? `They keep ${f1} of what remains.` : `They give ${f1} of what remains away.`;
      const lines = useMoney
        ? [`${name} has £${total}.`, `They spend £${fixedSpend}.`, fs, finalQ]
        : [`${name} has ${total} ${ctx!.item}.`, `They ${ctx!.verb1} ${fixedSpend}.`, fs, finalQ];
      const working = [
        mStep("After spending:", [`${aL(total, useMoney)} - ${aL(fixedSpend, useMoney)}`, `= ${aL(remaining1, useMoney)}`]),
        mStep("Find one part:", [`${aL(remaining1, useMoney)} \\div ${rd1}`, `= ${aL(part1, useMoney)}`]),
        mStep(keepFrac ? "Amount kept:" : "Amount given away:", [`${aL(part1, useMoney)} \\times ${rn1}`, `= ${aL(fracPart, useMoney)}`]),
        keepFrac
          ? tStep(`They have ${aP(fracPart, useMoney)} left.`)
          : mStep("Amount left:", [`${aL(remaining1, useMoney)} - ${aL(fracPart, useMoney)}`, `= ${aL(finalLeft, useMoney)}`]),
      ];
      const res = asFracOfOriginal ? asFracAnswer(finalLeft, total, working) : plainAnswer(finalLeft);
      return {
        kind: "worded", lines, ...res, working,
        key: `worded-level3-af-a-${total}-${rn1}-${rd1}-${keepFrac}-${fixedSpend}-${useMoney}`, difficulty: "level3",
      } as AnyQuestion;
    } else {
      const part1 = total / rd1, fracPart = rn1 * part1, remaining1 = keepFrac ? fracPart : total - fracPart;
      const divisors = [2,3,4,5].filter(d => Number.isInteger(remaining1 / d) && remaining1 / d < remaining1);
      if (divisors.length === 0) continue;
      const fixedSpend = remaining1 / pick(divisors), finalLeft = remaining1 - fixedSpend;
      if (!allInt(part1, fracPart, remaining1, fixedSpend, finalLeft) || finalLeft <= 0) continue;
      const fs = keepFrac ? `They keep ${f1} of ${pron}.` : `They give ${f1} of ${pron} away.`;
      const lines = useMoney
        ? [`${name} has £${total}.`, fs, `They then spend £${fixedSpend}.`, finalQ]
        : [`${name} has ${total} ${ctx!.item}.`, fs, `They then ${ctx!.verb1} ${fixedSpend}.`, finalQ];
      const working = [
        mStep("Find one part:", [`${aL(total, useMoney)} \\div ${rd1}`, `= ${aL(part1, useMoney)}`]),
        mStep(keepFrac ? "Amount kept:" : "Amount given away:", [`${aL(part1, useMoney)} \\times ${rn1}`, `= ${aL(fracPart, useMoney)}`]),
        keepFrac
          ? tStep(`They now have ${aP(fracPart, useMoney)}.`)
          : mStep("They now have:", [`${aL(total, useMoney)} - ${aL(fracPart, useMoney)}`, `= ${aL(remaining1, useMoney)}`]),
        mStep("After spending:", [`${aL(remaining1, useMoney)} - ${aL(fixedSpend, useMoney)}`, `= ${aL(finalLeft, useMoney)}`]),
      ];
      const res = asFracOfOriginal ? asFracAnswer(finalLeft, total, working) : plainAnswer(finalLeft);
      return {
        kind: "worded", lines, ...res, working,
        key: `worded-level3-af-b-${total}-${rn1}-${rd1}-${keepFrac}-${fixedSpend}-${useMoney}`, difficulty: "level3",
      } as AnyQuestion;
    }
  }
  // Safe fallback
  return {
    kind: "worded",
    lines: ["James has 40 sweets.", `${fracStr(3, 4)} of the sweets are red.`, "How many sweets are red?"],
    answer: "30 sweets", answerLatex: "30", answerSuffix: "sweets",
    working: [
      mStep("Find the value of one part:", [`40 \\div 4`, `= 10`]),
      mStep("Multiply by the numerator:", [`10 \\times 3`, `= 30`]),
    ],
    key: `worded-level3-fallback-${randInt(0, 1_000_000)}`, difficulty: "level3",
  } as AnyQuestion;
};

// ── 8. Expressing as a Fraction (asFraction) ──────────────────────────────────

const buildPrimeProducts = (maxPrime: number, maxVal: number): number[] => {
  const primes = [2,3,5,7,11,13,17,19].filter(p => p <= maxPrime);
  const products = new Set<number>([1]);
  for (const p of primes) {
    const toAdd: number[] = [];
    products.forEach(x => { let v = x; while (v * p <= maxVal) { v *= p; toAdd.push(v); } });
    toAdd.forEach(v => products.add(v));
  }
  products.delete(1);
  return [...products].sort((a, b) => a - b);
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
  {item:"sweets",verb1:"eat",verb2:"give away"},{item:"stickers",verb1:"use",verb2:"give away"},
  {item:"marbles",verb1:"lose",verb2:"give away"},{item:"cards",verb1:"use",verb2:"give away"},
  {item:"coins",verb1:"spend",verb2:"give away"},
];

const genAsFracL1 = (pool: string, allowUnsimplified: boolean): AnyQuestion => {
  const P = pool === "extended" ? AF_EXT_POOL : AF_STD_POOL;
  let attempts = 0;
  while (attempts++ < 500) {
    const whole = pick(P.filter(x => x >= 4));
    const part  = pick(P.filter(x => x < whole && x >= 2));
    const g = gcd(part, whole);
    const sn = part / g, sd = whole / g;
    if (sn === sd) continue;
    if (!allowUnsimplified && g === 1) continue;
    const alreadySimplest = g === 1;
    const lines = [`Write ${part} as a fraction of ${whole}.`, `Give your answer in its simplest form.`];
    const ansLatex = f(sn, sd);
    const working = alreadySimplest
      ? [
          mStep("Write as a fraction:", f(part, whole)),
          tStep(`HCF of ${part} and ${whole} = 1`),
          tStep("Already in its simplest form."),
        ]
      : [
          mStep("Write as a fraction:", f(part, whole)),
          tStep(`HCF of ${part} and ${whole} = ${g}`),
          mStep(`Divide both by ${g}:`, [`${f(part, whole)}`, `= ${f(`${part}\\div${g}`, `${whole}\\div${g}`)}`, `= ${ansLatex}`]),
        ];
    return { kind: "worded", lines, answer: `${sn}/${sd}`, answerLatex: ansLatex, working, key: `asFraction-level1-${part}-${whole}`, difficulty: "level1" } as AnyQuestion;
  }
  return {
    kind: "worded", lines: ["Write 6 as a fraction of 8.", "Give your answer in its simplest form."],
    answer: "3/4", answerLatex: f(3, 4),
    working: [mStep("Write as a fraction:", f(6, 8)), tStep("HCF of 6 and 8 = 2"), mStep("Divide both by 2:", [`${f(6, 8)}`, `= ${f(3, 4)}`])],
    key: `asFraction-level1-fallback-${randInt(0, 1_000_000)}`, difficulty: "level1",
  } as AnyQuestion;
};

const genAsFracL2 = (questionType: string): AnyQuestion => {
  const ctx = pick(AF_L2_CONTEXTS);
  let attempts = 0;
  while (attempts++ < 500) {
    const wholeOpts = [12,14,15,16,18,20,21,24,25,27,28,30,32,35,36,40,42,45,48,50,54,56,60,63,64,70,72,75,80,84,90,96,100];
    const whole = pick(wholeOpts);
    const parts: number[] = [];
    for (let p = 1; p < whole; p++) { if (gcd(p, whole) > 1) parts.push(p); }
    if (parts.length === 0) continue;
    const cands = parts.filter(p => p >= 2 && p <= whole - 2);
    if (cands.length === 0) continue;
    const part1 = pick(cands);
    const part2 = whole - part1;
    const g1 = gcd(part1, whole), sn1 = part1 / g1, sd1 = whole / g1;
    const g2 = gcd(part2, whole), sn2 = part2 / g2, sd2 = whole / g2;
    if (sn1 === sd1 || sn2 === sd2) continue;
    const isDirect = questionType === "direct" || (questionType === "mixed" && Math.random() < 0.5);
    const ansLatex = f(sn1, sd1);
    let lines: string[], working: WorkingStep[];
    if (isDirect) {
      lines = [`There are ${whole} ${ctx.total} in total.`, `${part1} of them are ${ctx.part1}.`, `Write the number of ${ctx.part1} as a fraction of the total.`, `Give your answer in its simplest form.`];
      working = [
        mStep("Write as a fraction:", f(part1, whole)),
        tStep(`HCF of ${part1} and ${whole} = ${g1}`),
        mStep("Simplify:", [`${f(part1, whole)}`, `= ${ansLatex}`]),
      ];
    } else {
      lines = [`There are ${whole} ${ctx.total} in total.`, `${part2} of them are ${ctx.part2}.`, `The rest are ${ctx.part1}.`, `Write the number of ${ctx.part1} as a fraction of the total.`, `Give your answer in its simplest form.`];
      working = [
        mStep(`Find the number of ${ctx.part1}:`, [`${whole} - ${part2}`, `= ${part1}`]),
        mStep("Write as a fraction:", f(part1, whole)),
        mStep(`Simplify (HCF = ${g1}):`, [`${f(part1, whole)}`, `= ${ansLatex}`]),
      ];
    }
    return { kind: "worded", lines, answer: `${sn1}/${sd1}`, answerLatex: ansLatex, working, key: `asFraction-level2-${ctx.total}-${part1}-${whole}-${isDirect}`, difficulty: "level2" } as AnyQuestion;
  }
  return {
    kind: "worded", lines: ["There are 20 books in total.", "12 of them are fiction.", "Write the number of fiction books as a fraction of the total.", "Give your answer in its simplest form."],
    answer: "3/5", answerLatex: f(3, 5),
    working: [mStep("Write as a fraction:", f(12, 20)), tStep("HCF of 12 and 20 = 4"), mStep("Simplify:", [`${f(12, 20)}`, `= ${f(3, 5)}`])],
    key: `asFraction-level2-fallback-${randInt(0, 1_000_000)}`, difficulty: "level2",
  } as AnyQuestion;
};

const genAsFracL3 = (steps: string): AnyQuestion => {
  const useMoney = Math.random() < 0.5;
  const name = pick(NAMES);
  const chooseOneStep = steps === "1step" ? true : steps === "2step" ? false : Math.random() < 0.5;

  if (chooseOneStep) {
    let att = 0;
    while (att++ < 500) {
      const wholes = [20,24,30,36,40,45,48,50,60,72,80,90,100,120];
      const total = pick(wholes);
      const spendCands = [...Array(total - 2)].map((_, i) => i + 1).filter(x => gcd(total - x, total) > 1 && x < total && total - x > 0);
      if (spendCands.length === 0) continue;
      const spend = pick(spendCands);
      const remaining = total - spend, g = gcd(remaining, total), sn = remaining / g, sd = total / g;
      if (sn === sd) continue;
      const ansLatex = f(sn, sd);
      let lines: string[], working: WorkingStep[];
      if (useMoney) {
        lines = [`${name} has £${total}.`, `They spend £${spend}.`, `Write the amount they have left as a fraction of the original.`, `Give your answer in its simplest form.`];
        working = [
          mStep("Amount left:", [`${aL(total, true)} - ${aL(spend, true)}`, `= ${aL(remaining, true)}`]),
          tStep(`HCF of ${remaining} and ${total} = ${g}`),
          mStep("As a fraction of the original:", [`${f(remaining, total)}`, `= ${ansLatex}`]),
        ];
      } else {
        const c = pick(AF_L3_ITEMS);
        lines = [`${name} has ${total} ${c.item}.`, `They ${c.verb1} ${spend}.`, `Write the number left as a fraction of the original.`, `Give your answer in its simplest form.`];
        working = [
          mStep("Number left:", [`${total} - ${spend}`, `= ${remaining}`]),
          tStep(`HCF of ${remaining} and ${total} = ${g}`),
          mStep("As a fraction of the original:", [`${f(remaining, total)}`, `= ${ansLatex}`]),
        ];
      }
      return { kind: "worded", lines, answer: `${sn}/${sd}`, answerLatex: ansLatex, working, key: `asFraction-level3-1s-${total}-${spend}-${useMoney}`, difficulty: "level3" } as AnyQuestion;
    }
  }

  let att2 = 0;
  while (att2++ < 500) {
    const keepFrac = Math.random() < 0.5;
    const { rn, rd } = pick(NONUNIT_FRAC_POOL);
    const multiplier = randInt(4, 10), total = rd * multiplier;
    const part1val = total / rd, fracPart = rn * part1val, after1 = keepFrac ? fracPart : total - fracPart;
    const divisors = [2,3,4,5].filter(d => Number.isInteger(after1 / d) && after1 / d < after1 && after1 / d > 0);
    if (divisors.length === 0) continue;
    const fixedSpend = after1 / pick(divisors), finalLeft = after1 - fixedSpend;
    if (!Number.isInteger(finalLeft) || finalLeft <= 0 || finalLeft === total) continue;
    const g = gcd(finalLeft, total), sn = finalLeft / g, sd = total / g;
    if (sn === sd) continue;
    const f1 = fracStr(rn, rd), ansLatex = f(sn, sd);
    let lines: string[];
    if (useMoney) {
      const fs = keepFrac ? `They keep ${f1} of it.` : `They give ${f1} of it away.`;
      lines = [`${name} has £${total}.`, fs, `They then spend £${fixedSpend}.`, `Write the amount left as a fraction of the original.`, `Give your answer in its simplest form.`];
    } else {
      const c = pick(AF_L3_ITEMS);
      const fs = keepFrac ? `They keep ${f1} of them.` : `They ${c.verb2} ${f1} of them.`;
      lines = [`${name} has ${total} ${c.item}.`, fs, `They then ${c.verb1} ${fixedSpend} more.`, `Write the number left as a fraction of the original.`, `Give your answer in its simplest form.`];
    }
    const working = [
      mStep("Find one part:", [`${aL(total, useMoney)} \\div ${rd}`, `= ${aL(part1val, useMoney)}`]),
      mStep(keepFrac ? "Amount kept:" : "Amount given away:", [`${aL(part1val, useMoney)} \\times ${rn}`, `= ${aL(fracPart, useMoney)}`]),
      keepFrac
        ? tStep(`After keeping: ${aP(fracPart, useMoney)}.`)
        : mStep("After giving away:", [`${aL(total, useMoney)} - ${aL(fracPart, useMoney)}`, `= ${aL(after1, useMoney)}`]),
      mStep("After spending:", [`${aL(after1, useMoney)} - ${aL(fixedSpend, useMoney)}`, `= ${aL(finalLeft, useMoney)}`]),
      tStep(`HCF of ${finalLeft} and ${total} = ${g}`),
      mStep("As a fraction of the original:", [`${f(finalLeft, total)}`, `= ${ansLatex}`]),
    ];
    return { kind: "worded", lines, answer: `${sn}/${sd}`, answerLatex: ansLatex, working, key: `asFraction-level3-2s-${total}-${rn}-${rd}-${keepFrac}-${fixedSpend}-${useMoney}`, difficulty: "level3" } as AnyQuestion;
  }
  return {
    kind: "worded", lines: ["Emma has £60.", `She gives away ${fracStr(1, 3)} of it.`, "She then spends £10.", "Write the amount left as a fraction of the original.", "Give your answer in its simplest form."],
    answer: "1/2", answerLatex: f(1, 2),
    working: [
      mStep("Given away:", [`60 \\div 3`, `= 20`]),
      mStep("Remaining:", [`60 - 20`, `= 40`]),
      mStep("After spending:", [`40 - 10`, `= 30`]),
      tStep("HCF of 30 and 60 = 30"),
      mStep("As a fraction of the original:", [`${f(30, 60)}`, `= ${f(1, 2)}`]),
    ],
    key: `asFraction-level3-fallback-${randInt(0, 1_000_000)}`, difficulty: "level3",
  } as AnyQuestion;
};

// ── 9. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const t = tool as ToolType;

  if (t === "findFraction") return genFrac(level, dropdownValue || "standard");

  if (t === "asFraction") {
    if (level === "level1") return genAsFracL1(dropdownValue || "standard", variables["allowUnsimplified"] ?? false);
    if (level === "level2") return genAsFracL2(dropdownValue || "mixed");
    return genAsFracL3(dropdownValue || "mixed");
  }

  // worded
  if (level === "level1") return genWordedL1(dropdownValue || "mixed");
  if (level === "level2") return genWordedL2(variables["showHint"] ?? false);
  return genWordedL3(variables["asFracOfOriginal"] ?? false, dropdownValue || "mixed");
};

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
    />
  );
}
