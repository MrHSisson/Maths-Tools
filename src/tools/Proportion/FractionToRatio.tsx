import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type WorkingStep,
  step, mStep, tStep, fracStr, mStr, randInt, pick,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "formingRatios" | "fractionToRatio" | "ratioToFraction";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Fractions & Ratios",
  tools: {
    formingRatios: {
      name: "Forming Ratios",
      variables: [
        { key: "threeWay", label: "3-Way Ratio", defaultValue: false },
        { key: "simplestForm", label: "Simplest Form", defaultValue: false },
      ],
      dropdown: null, difficultySettings: null,
    },
    fractionToRatio: {
      name: "Fraction to Ratio",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [{ key: "findCommonDenominators", label: "Different Denominators", defaultValue: false }], dropdown: null },
        level3: {
          variables: [],
          dropdown: { key: "given", label: "Given", useTwoLineButtons: false, options: [{ value: "partA", label: "Part A" }, { value: "partB", label: "Part B" }, { value: "total", label: "Total" }, { value: "mixed", label: "Mixed" }], defaultValue: "mixed" },
        },
      },
    },
    ratioToFraction: {
      name: "Ratio to Fraction",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: {
          variables: [{ key: "simplestForm", label: "Simplest Form", defaultValue: true }],
          dropdown: { key: "target", label: "Target", useTwoLineButtons: false, options: [{ value: "singlePart", label: "Single" }, { value: "composite", label: "Composite" }, { value: "mixed", label: "Mixed" }], defaultValue: "mixed" },
        },
        level3: { variables: [], dropdown: null },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Forming Ratios", icon: "🔢", content: [
    { label: "Overview", detail: "Form ratios from counts, totals with remainders, or constraint-based descriptions." },
    { label: "Level 1 — Green", detail: "Direct count: given the number of each item, write the ratio in the requested order." },
    { label: "Level 2 — Yellow", detail: "Total with remainder: given the total and some counts, find the rest then form the ratio." },
    { label: "Level 3 — Red", detail: "Constraint-based: a percentage or fraction of the total is given for one part; calculate all parts then form the ratio." },
    { label: "Options", detail: "3-Way Ratio: introduces a third part. Simplest Form: requires cancelling common factors in the answer." },
  ]},
  { title: "Fraction to Ratio", icon: "➗", content: [
    { label: "Overview", detail: "Convert a fraction (part-of-whole) into a part:part or multi-part ratio." },
    { label: "Level 1 — Green", detail: "One fraction given; find the complementary part and write the two-part ratio." },
    { label: "Level 2 — Yellow", detail: "Two fractions given; find the third part (the remainder) and write the three-part ratio in any order." },
    { label: "Level 3 — Red", detail: "An actual quantity is also given (total, Part A, or Part B). Work out all quantities then write the ratio as actual amounts." },
  ]},
  { title: "Ratio to Fraction", icon: "½", content: [
    { label: "Overview", detail: "Convert a ratio into a fraction of the total or a fraction of one part relative to another." },
    { label: "Level 1 — Green", detail: "Two-part ratio; write one part as a fraction of the total (part-to-whole)." },
    { label: "Level 2 — Yellow", detail: "Three-part ratio; write one part (or a composite of two parts) as a fraction of the total." },
    { label: "Level 3 — Red", detail: "Part-to-part comparison: write one quantity as a fraction of the other (not of the total)." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
];

// ── 4. Maths helpers ──────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
const gcdThree = (a: number, b: number, c: number) => gcd(gcd(a, b), c);
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
const simplifyRatioParts = (parts: number[]): number[] => {
  const d = parts.length === 3 ? gcdThree(parts[0], parts[1], parts[2]) : gcd(parts[0], parts[1]);
  return parts.map(p => p / d);
};

// frac(n,d) → LaTeX string for use directly in step()/mStep()
const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;
// rLatex → ratio as a KaTeX string e.g. "3 : 4" for use in step()/mStep()/answerLatex
const rLatex = (...parts: number[]) => parts.join(" : ");
// rStr → InlineMath-ready ratio: "$3 : 4$"
const rStr = (...parts: number[]) => `$${rLatex(...parts)}$`;

const getSimplificationSteps = (parts: number[]): WorkingStep[] => {
  const steps: WorkingStep[] = []; let cur = [...parts];
  const primes = [2, 3, 5, 7, 11, 13];
  while (true) {
    let found = false;
    for (const p of primes) {
      if (cur.every(n => n % p === 0)) {
        const next = cur.map(n => n / p);
        steps.push(step(`${rLatex(...cur)} \\div ${p} = ${rLatex(...next)}`));
        cur = next; found = true; break;
      }
    }
    if (!found) break;
  }
  return steps;
};

const generateSimplestFraction = (): { num: number; den: number } => {
  while (true) {
    const den = Math.floor(Math.random() * 10) + 3;
    const num = Math.floor(Math.random() * (den - 1)) + 1;
    const g = gcd(num, den); const sn = num / g, sd = den / g;
    if (sn === 1 && sd === 2) continue;
    return { num: sn, den: sd };
  }
};

const convertToCommonDenominator = (f1: { num: number; den: number }, f2: { num: number; den: number }) => {
  const lcd = lcm(f1.den, f2.den); const m1 = lcd / f1.den, m2 = lcd / f2.den;
  return {
    newNum1: f1.num * m1, newNum2: f2.num * m2, lcd,
    steps: [
      mStep("LCD:", `${f1.den} \\text{ and } ${f2.den} \\Rightarrow ${lcd}`),
      step(`${frac(f1.num, f1.den)} = ${frac(f1.num * m1, lcd)}`),
      step(`${frac(f2.num, f2.den)} = ${frac(f2.num * m2, lcd)}`),
    ],
  };
};

// ── 5. ratioToFraction generator ──────────────────────────────────────────────

const genRatioToFraction = (level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string): WordedQuestion => {
  const id = randInt(0, 999999);

  if (level === "level1") {
    const ctx = pick([
      { scenario: "beads", parts: ["red", "blue"] },
      { scenario: "students", parts: ["boys", "girls"] },
      { scenario: "games", parts: ["wins", "losses"] },
      { scenario: "marbles", parts: ["red", "blue"] },
      { scenario: "counters", parts: ["green", "yellow"] },
    ]);
    const a = randInt(2, 12), b = randInt(2, 12), total = a + b;
    const whichPart = Math.random() < 0.5 ? 0 : 1;
    const numerator = whichPart === 0 ? a : b;
    const partName = ctx.parts[whichPart];
    const g = gcd(numerator, total); const sn = numerator / g, sd = total / g;
    const af = frac(sn, sd);

    // ratio stays as plain prose label since parts are word-based (red:blue etc.)
    // but the numeric ratio values go in KaTeX via rStr
    const style = randInt(0, 2);
    const line = style === 0
      ? `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. What fraction of the ${ctx.scenario} are ${partName}?`
      : style === 1
        ? `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. Find the fraction of ${ctx.scenario} that are ${partName}.`
        : `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. Write ${partName} as a fraction of the total.`;

    return {
      kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af,
      working: [
        step(`${a} + ${b} = ${total}`, `Total parts = ${total}`),
        mStep(partName.charAt(0).toUpperCase() + partName.slice(1) + " =", frac(numerator, total)),
        sn === numerator ? tStep("Already in simplest form") : step(`${frac(numerator, total)} = ${frac(sn, sd)}`),
      ],
      key: `rtf-l1-${a}-${b}-${whichPart}-${id}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const ctx = pick([
      { scenario: "people playing sports", parts: ["Football", "Squash", "Tennis"], compositeLabel: "racket sports", compositeIndices: [1, 2] },
      { scenario: "people playing sports", parts: ["Football", "Rugby", "Tennis"], compositeLabel: "team sports", compositeIndices: [0, 1] },
      { scenario: "ingredients", parts: ["Flour", "Milk", "Eggs"], compositeLabel: "wet ingredients", compositeIndices: [1, 2] },
      { scenario: "transport methods", parts: ["Car", "Bus", "Bicycle"], compositeLabel: "public transport or cycling", compositeIndices: [1, 2] },
      { scenario: "people playing sports", parts: ["Swimming", "Football", "Tennis"], compositeLabel: "ball sports", compositeIndices: [1, 2] },
    ]);
    const a = randInt(1, 10), b = randInt(1, 10), c = randInt(1, 10), total = a + b + c;
    const simplestFormEnabled = variables.simplestForm !== false;
    const actualTarget = dropdownValue === "mixed" ? (Math.random() < 0.5 ? "singlePart" : "composite") : dropdownValue;
    const isComposite = actualTarget === "composite";
    let numerator = 0, targetDescription = "", line = "";

    if (!isComposite) {
      const wp = randInt(0, 2); numerator = [a, b, c][wp]; const pn = ctx.parts[wp];
      const style = randInt(0, 2);
      line = style === 0
        ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction of ${ctx.scenario} are ${pn}?`
        : style === 1
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${pn}.`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Write ${pn} as a fraction of the total.`;
      targetDescription = pn;
    } else {
      const idx = ctx.compositeIndices;
      const v1 = [a, b, c][idx[0]], v2 = [a, b, c][idx[1]]; numerator = v1 + v2;
      const useNatural = Math.random() < 0.5;
      if (useNatural) {
        line = randInt(0, 1) === 0
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction of ${ctx.scenario} are ${ctx.compositeLabel}?`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${ctx.compositeLabel}.`;
        targetDescription = ctx.compositeLabel;
      } else {
        line = randInt(0, 1) === 0
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction are ${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}?`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}.`;
        targetDescription = `${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}`;
      }
    }

    let sn = numerator, sd = total;
    if (simplestFormEnabled) { const g = gcd(numerator, total); sn = numerator / g; sd = total / g; }
    const af = frac(sn, sd);
    const tdCap = targetDescription.charAt(0).toUpperCase() + targetDescription.slice(1);

    let workingSteps: WorkingStep[];
    if (isComposite) {
      const idx = ctx.compositeIndices; const v1 = [a, b, c][idx[0]], v2 = [a, b, c][idx[1]];
      workingSteps = [
        step(`${a} + ${b} + ${c} = ${total}`, `Total parts = ${total}`),
        step(`${v1} + ${v2} = ${numerator}`, `${tdCap} = ${numerator}`),
        mStep("Fraction =", frac(numerator, total)),
        simplestFormEnabled && sn !== numerator ? step(`${frac(numerator, total)} = ${frac(sn, sd)}`) : tStep("Already in simplest form"),
      ];
    } else {
      workingSteps = [
        step(`${a} + ${b} + ${c} = ${total}`, `Total parts = ${total}`),
        mStep(tdCap + " =", frac(numerator, total)),
        simplestFormEnabled && sn !== numerator ? step(`${frac(numerator, total)} = ${frac(sn, sd)}`) : tStep("Already in simplest form"),
      ];
    }
    return { kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af, working: workingSteps, key: `rtf-l2-${a}-${b}-${c}-${actualTarget}-${isComposite}-${id}`, difficulty: level };
  }

  // Level 3: part-to-part
  const ctx = pick([
    { item1: "apples", item2: "oranges" }, { item1: "bananas", item2: "grapes" },
    { item1: "pound coins", item2: "fifty pence coins" }, { item1: "ten pound notes", item2: "five pound notes" },
    { item1: "Year 7s", item2: "Year 8s" }, { item1: "adults", item2: "children" },
  ]);
  const a = randInt(2, 12), b = randInt(2, 12);
  if (a === b) return genRatioToFraction(level, variables, dropdownValue);
  const orderReversed = Math.random() < 0.5;
  const numerator = orderReversed ? b : a, denominator = orderReversed ? a : b;
  const numeratorName = orderReversed ? ctx.item2 : ctx.item1;
  const denominatorName = orderReversed ? ctx.item1 : ctx.item2;
  const g = gcd(numerator, denominator); const sn = numerator / g, sd = denominator / g;
  const af = frac(sn, sd);
  const line = Math.random() < 0.5
    ? `The ratio of ${ctx.item1} to ${ctx.item2} is ${rStr(a, b)}. Write the amount of ${numeratorName} as a fraction of the amount of ${denominatorName}.`
    : `The ratio of ${ctx.item1} to ${ctx.item2} is ${rStr(a, b)}. Find ${numeratorName} as a fraction of ${denominatorName}.`;
  return {
    kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af,
    working: [
      mStep(`${ctx.item1.charAt(0).toUpperCase() + ctx.item1.slice(1)} =`, `${a},\\quad ${ctx.item2.charAt(0).toUpperCase() + ctx.item2.slice(1)} = ${b}`),
      tStep(`${denominatorName.charAt(0).toUpperCase() + denominatorName.slice(1)} is the denominator — part : part, not part : whole`),
      step(frac(numerator, denominator)),
      tStep(`Do not add the parts — we are not finding a fraction of the total`),
      ...(sn !== numerator ? [step(`${frac(numerator, denominator)} = ${frac(sn, sd)}`)] : [tStep("Already in simplest form")]),
      tStep(`Answer: ${numeratorName} is ${sn}/${sd} of ${denominatorName}`),
    ],
    key: `rtf-l3-${a}-${b}-${orderReversed}-${id}`, difficulty: level,
  };
};

// ── 6. fractionToRatio generator ──────────────────────────────────────────────

const genFractionToRatio = (level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string): WordedQuestion => {
  const id = randInt(0, 999999);

  if (level === "level1") {
    const ctx = pick([
      { item: "beads", colors: ["Red", "Blue"] }, { item: "sweets", colors: ["Purple", "Orange"] },
      { item: "marbles", colors: ["Pink", "White"] }, { item: "counters", colors: ["Black", "Silver"] },
      { item: "balls", colors: ["Red", "Blue"] },
    ]);
    const { num, den } = generateSimplestFraction();
    const pA = num, pB = den - num;
    if (pA === pB) return genFractionToRatio(level, variables, dropdownValue);
    const rev = Math.random() < 0.5; const [cA, cB] = ctx.colors;
    const prose = Math.random() < 0.5;
    // word labels (Red, Blue) stay as prose; numeric ratio → rStr
    const line = rev
      ? prose
        ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Write the ratio of ${cB} to ${cA}.`
        : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Find ${cB} : ${cA}.`
      : prose
        ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Write the ratio of ${cA} to ${cB}.`
        : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Find ${cA} : ${cB}.`;
    const ansLatex = rev ? rLatex(pB, pA) : rLatex(pA, pB);
    return {
      kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
      working: [
        mStep(cA + " =", frac(num, den)),
        step(`${den} - ${num} = ${pB}`, `${cB} = ${pB} (${den} parts total)`),
        mStep(cB + " =", frac(pB, den)),
        mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
      ],
      key: `ftr-l1-${num}-${den}-${rev}-${id}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const ctx = pick([
      { item: "beads", parts: ["Red", "Blue", "Green"] }, { item: "sweets", parts: ["Strawberry", "Lemon", "Orange"] },
      { item: "marbles", parts: ["Clear", "Spotted", "Striped"] }, { item: "flowers", parts: ["Roses", "Tulips", "Daisies"] },
    ]);
    const findCD = variables.findCommonDenominators || false;
    let f1 = 0, f2 = 0, den = 0, f3 = 0;
    let oF1: { num: number; den: number } | null = null, oF2: { num: number; den: number } | null = null;
    let cdSteps: WorkingStep[] = [];
    let tries = 0;
    while (tries++ < 200) {
      if (findCD) {
        const fa = generateSimplestFraction(), fb = generateSimplestFraction();
        if (fa.den === fb.den) continue;
        const r = convertToCommonDenominator(fa, fb);
        if (r.newNum1 + r.newNum2 >= r.lcd) continue;
        f1 = r.newNum1; f2 = r.newNum2; den = r.lcd; f3 = den - f1 - f2;
        oF1 = fa; oF2 = fb; cdSteps = r.steps; break;
      } else {
        den = randInt(5, 12); f1 = randInt(1, den - 2); f2 = randInt(1, den - f1 - 1);
        if (f1 + f2 >= den) continue; f3 = den - f1 - f2; break;
      }
    }
    const oc = randInt(0, 5); const P = ctx.parts;
    const ords = [
      { parts: [f1, f2, f3] }, { parts: [f1, f3, f2] },
      { parts: [f2, f1, f3] }, { parts: [f2, f3, f1] },
      { parts: [f3, f1, f2] }, { parts: [f3, f2, f1] },
    ];
    const ordLabels = [
      `${P[0]}:${P[1]}:${P[2]}`, `${P[0]}:${P[2]}:${P[1]}`,
      `${P[1]}:${P[0]}:${P[2]}`, `${P[1]}:${P[2]}:${P[0]}`,
      `${P[2]}:${P[0]}:${P[1]}`, `${P[2]}:${P[1]}:${P[0]}`,
    ];
    const { parts: ansParts } = ords[oc];
    const reqOrder = ordLabels[oc];
    const prose = Math.random() < 0.5;
    const ansLatex = rLatex(...ansParts);
    // word labels stay as prose; ratio order label stays as prose; numeric ratio → rStr in working
    const line = findCD && oF1 && oF2
      ? prose
        ? `In a bag of ${ctx.item}, ${fracStr(oF1.num, oF1.den)} are ${P[0]} and ${fracStr(oF2.num, oF2.den)} are ${P[1]}. The rest are ${P[2]}. Write the ratio ${reqOrder}.`
        : `In a bag of ${ctx.item}, ${fracStr(oF1.num, oF1.den)} are ${P[0]} and ${fracStr(oF2.num, oF2.den)} are ${P[1]}. The rest are ${P[2]}. Find ${reqOrder}.`
      : prose
        ? `In a bag of ${ctx.item}, ${fracStr(f1, den)} are ${P[0]} and ${fracStr(f2, den)} are ${P[1]}. The rest are ${P[2]}. Write the ratio ${reqOrder}.`
        : `In a bag of ${ctx.item}, ${fracStr(f1, den)} are ${P[0]} and ${fracStr(f2, den)} are ${P[1]}. The rest are ${P[2]}. Find ${reqOrder}.`;
    const baseSteps: WorkingStep[] = findCD ? cdSteps : [mStep(P[0] + " =", frac(f1, den)), mStep(P[1] + " =", frac(f2, den))];
    return {
      kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
      working: [
        ...baseSteps,
        step(`${den} - ${f1} - ${f2} = ${f3}`, `${P[2]} = ${f3} parts`),
        mStep(P[2] + " =", frac(f3, den)),
        mStep("Ratio =", rLatex(f1, f2, f3)),
      ],
      key: `ftr-l2-${f1}-${f2}-${den}-${oc}-${id}`, difficulty: level,
    };
  }

  // Level 3: quantity-based
  const ctx = pick([
    { item: "beads", colors: ["Red", "Blue"] }, { item: "sweets", colors: ["Strawberry", "Lemon"] },
    { item: "marbles", colors: ["Glass", "Plastic"] }, { item: "counters", colors: ["Yellow", "Green"] },
  ]);
  const { num, den } = generateSimplestFraction();
  const actualGiven = dropdownValue === "mixed" ? pick(["partA", "partB", "total"]) : dropdownValue;
  const mult = randInt(2, 6), total = den * mult, pA = num * mult, pB = total - pA;
  const rev = Math.random() < 0.5; const [cA, cB] = ctx.colors;
  const ansLatex = rev ? rLatex(pB, pA) : rLatex(pA, pB);
  let line: string; let wSteps: WorkingStep[];

  if (actualGiven === "total") {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(total)} ${ctx.item} in total. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(total)} ${ctx.item} in total. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      step(`${total} \\div ${den} = ${mult}`, `Total = ${total}, so 1 part = ${mult}`),
      step(`${num} \\times ${mult} = ${pA}`, `${cA} = ${pA}`),
      step(`${den - num} \\times ${mult} = ${pB}`, `${cB} = ${pB}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  } else if (actualGiven === "partB") {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pB)} ${cB} ${ctx.item}. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pB)} ${cB} ${ctx.item}. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      mStep(cA + " =", frac(num, den)),
      mStep(`so ${cB} =`, frac(den - num, den)),
      step(`${pB} \\div ${den - num} = ${mult}`, `${den - num} parts = ${pB}, so 1 part = ${mult}`),
      step(`${num} \\times ${mult} = ${pA}`, `${cA} = ${pA}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  } else {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pA)} ${cA} ${ctx.item}. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pA)} ${cA} ${ctx.item}. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      mStep(cA + " =", frac(num, den)),
      step(`${pA} \\div ${num} = ${mult}`, `${num} parts = ${pA}, so 1 part = ${mult}`),
      step(`${den} \\times ${mult} = ${total}`, `Total = ${total}`),
      step(`${total} - ${pA} = ${pB}`, `${cB} = ${pB}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  }
  return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: wSteps, key: `ftr-l3-${num}-${den}-${total}-${actualGiven}-${rev}-${id}`, difficulty: level };
};

// ── 7. formingRatios generator ────────────────────────────────────────────────

const genFormingRatios = (level: DifficultyLevel, variables: Record<string, boolean>): WordedQuestion => {
  const id = randInt(0, 999999);
  const threeWay = variables.threeWay || false;
  const simplestForm = variables.simplestForm || false;
  const sfText = simplestForm ? " in its simplest form" : "";

  const buildAnswerLatex = (parts: number[]) =>
    simplestForm ? rLatex(...simplifyRatioParts(parts)) : rLatex(...parts);

  const buildSimplificationWorking = (parts: number[]): WorkingStep[] =>
    simplestForm ? [mStep("Original:", rLatex(...parts)), ...getSimplificationSteps(parts)] : [];

  if (level === "level1") {
    const ctxs2 = [
      { items: ["apples", "oranges"], container: "basket" }, { items: ["cats", "dogs"], container: "pet shelter" },
      { items: ["red cars", "blue cars"], container: "car park" }, { items: ["boys", "girls"], container: "classroom" },
      { items: ["pencils", "pens"], container: "pencil case" },
    ];
    const ctxs3 = [
      { items: ["cows", "sheep", "pigs"], container: "farm" }, { items: ["red sweets", "blue sweets", "green sweets"], container: "jar" },
      { items: ["footballs", "basketballs", "tennis balls"], container: "sports hall" },
      { items: ["roses", "tulips", "daisies"], container: "garden" }, { items: ["Y7s", "Y8s", "Y9s"], container: "school trip" },
    ];
    const gcds = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6];
    if (threeWay) {
      const ctx = pick(ctxs3); const g = pick(gcds);
      const a = randInt(2, 15) * g, b = randInt(2, 15) * g, c = randInt(2, 15) * g;
      const order = randInt(0, 5);
      const ords = [
        { label: `${ctx.items[0]}:${ctx.items[1]}:${ctx.items[2]}`, parts: [a, b, c] },
        { label: `${ctx.items[0]}:${ctx.items[2]}:${ctx.items[1]}`, parts: [a, c, b] },
        { label: `${ctx.items[1]}:${ctx.items[0]}:${ctx.items[2]}`, parts: [b, a, c] },
        { label: `${ctx.items[1]}:${ctx.items[2]}:${ctx.items[0]}`, parts: [b, c, a] },
        { label: `${ctx.items[2]}:${ctx.items[0]}:${ctx.items[1]}`, parts: [c, a, b] },
        { label: `${ctx.items[2]}:${ctx.items[1]}:${ctx.items[0]}`, parts: [c, b, a] },
      ];
      const { label, parts } = ords[order];
      const ansLatex = buildAnswerLatex(parts);
      const line = Math.random() < 0.5
        ? `A ${ctx.container} has ${mStr(a)} ${ctx.items[0]}, ${mStr(b)} ${ctx.items[1]}, and ${mStr(c)} ${ctx.items[2]}. Write the ratio ${label}${sfText}.`
        : `There are ${mStr(a)} ${ctx.items[0]}, ${mStr(b)} ${ctx.items[1]}, and ${mStr(c)} ${ctx.items[2]} in a ${ctx.container}. Find ${label}${sfText}.`;
      return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: [mStep("Ratio =", rLatex(a, b, c)), ...buildSimplificationWorking(parts)], key: `fr-l1-3w-${a}-${b}-${c}-${order}-${id}`, difficulty: level };
    } else {
      const ctx = pick(ctxs2); const g = pick(gcds);
      const a = randInt(2, 20) * g, b = randInt(2, 20) * g;
      if (a === b) return genFormingRatios(level, variables);
      const rev = Math.random() < 0.5;
      const parts = rev ? [b, a] : [a, b];
      const label = rev ? `${ctx.items[1]}:${ctx.items[0]}` : `${ctx.items[0]}:${ctx.items[1]}`;
      const ansLatex = buildAnswerLatex(parts);
      const line = Math.random() < 0.5
        ? `A ${ctx.container} has ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]}. Write the ratio ${label}${sfText}.`
        : `There are ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]} in a ${ctx.container}. Find ${label}${sfText}.`;
      return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: [mStep("Ratio =", rLatex(a, b)), ...buildSimplificationWorking(parts)], key: `fr-l1-2w-${a}-${b}-${rev}-${id}`, difficulty: level };
    }
  }

  if (level === "level2") {
    const ctxs2 = [
      { item: "sweets", container: "bag", parts: ["red", "blue"] }, { item: "students", container: "class", parts: ["boys", "girls"] },
      { item: "cars", container: "car park", parts: ["red", "blue"] }, { item: "books", container: "library", parts: ["fiction", "non-fiction"] },
    ];
    const ctxs3 = [
      { item: "sweets", container: "bag", parts: ["red", "blue", "green"] }, { item: "marbles", container: "jar", parts: ["red", "yellow", "blue"] },
      { item: "counters", container: "box", parts: ["red", "blue", "green"] }, { item: "flowers", container: "vase", parts: ["roses", "tulips", "daisies"] },
    ];
    const gcds2 = [2, 2, 2, 3, 3, 4, 5, 6];
    if (threeWay) {
      const ctx = pick(ctxs3); const total = randInt(10, 80);
      let first = 0, second = 0, third = 0;
      if (Math.random() < 0.6) {
        const cf = pick(gcds2); const mx = Math.floor(total / (3 * cf));
        if (mx >= 2) { const bf = randInt(1, mx - 1), bs = randInt(1, mx - 1), bt = Math.floor(total / cf) - bf - bs; if (bt > 0 && (bf + bs + bt) * cf === total) { first = bf * cf; second = bs * cf; third = bt * cf; } }
      }
      if (!first || !second || !third || first + second + third !== total) {
        const mn = Math.max(1, Math.floor(total * 0.1)), mx = Math.floor(total * 0.7);
        first = randInt(mn, mx); const rem = total - first;
        second = randInt(Math.max(1, Math.floor(rem * 0.2)), Math.floor(rem * 0.8)); third = total - first - second;
      }
      const ansLatex = buildAnswerLatex([first, second, third]);
      const op = randInt(0, 2);
      const dp = op === 0 ? `${mStr(first)} are ${ctx.parts[0]}, ${mStr(second)} are ${ctx.parts[1]}, and the rest are ${ctx.parts[2]}`
        : op === 1 ? `${mStr(first)} are ${ctx.parts[0]}, ${mStr(third)} are ${ctx.parts[2]}, and the rest are ${ctx.parts[1]}`
          : `${mStr(second)} are ${ctx.parts[1]}, ${mStr(third)} are ${ctx.parts[2]}, and the rest are ${ctx.parts[0]}`;
      const line = `A ${ctx.container} contains ${mStr(total)} ${ctx.item}. ${dp}. Write the ratio ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]}${sfText}.`;
      return {
        kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
        working: [
          step(`${total} - ${first} - ${second} = ${third}`, `Remainder = ${third}`),
          mStep("Ratio =", rLatex(first, second, third)),
          ...buildSimplificationWorking([first, second, third]),
        ],
        key: `fr-l2-3w-${total}-${first}-${second}-${third}-${id}`, difficulty: level,
      };
    } else {
      const ctx = pick(ctxs2); const total = randInt(10, 80);
      let first = 0, second = 0;
      if (Math.random() < 0.6) {
        const cf = pick(gcds2); const mx = Math.floor(total / (2 * cf));
        if (mx >= 2) { const bf = randInt(1, mx - 1), bs = Math.floor(total / cf) - bf; if (bs > 0 && (bf + bs) * cf === total) { first = bf * cf; second = bs * cf; } }
      }
      if (!first || !second || first + second !== total) { first = randInt(Math.max(1, Math.floor(total * 0.15)), Math.floor(total * 0.85)); second = total - first; }
      const ansLatex = buildAnswerLatex([first, second]);
      const line = `A ${ctx.container} contains ${mStr(total)} ${ctx.item}. ${mStr(first)} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}. Write the ratio ${ctx.parts[0]}:${ctx.parts[1]}${sfText}.`;
      return {
        kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
        working: [
          step(`${total} - ${first} = ${second}`, `Remainder = ${second}`),
          mStep("Ratio =", rLatex(first, second)),
          ...buildSimplificationWorking([first, second]),
        ],
        key: `fr-l2-2w-${total}-${first}-${second}-${id}`, difficulty: level,
      };
    }
  }

  // Level 3: constraint-based
  const ctxs2L3 = [
    { item: "people", parts: ["adults", "children"], container: "room" }, { item: "animals", parts: ["dogs", "cats"], container: "shelter" },
    { item: "students", parts: ["boys", "girls"], container: "school" }, { item: "cars", parts: ["electric", "petrol"], container: "car park" },
  ];
  const ctxs3L3 = [
    { item: "people", parts: ["men", "women", "children"], container: "room" }, { item: "students", parts: ["Y7", "Y8", "Y9"], container: "trip" },
    { item: "sweets", parts: ["red", "blue", "green"], container: "bag" }, { item: "books", parts: ["fiction", "non-fiction", "reference"], container: "library" },
  ];
  const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75];
  const fracs2 = [
    { num: 1, den: 2 }, { num: 1, den: 3 }, { num: 2, den: 3 }, { num: 1, den: 4 }, { num: 3, den: 4 },
    { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
  ];

  let valid = false, tries2 = 0;
  let total2 = 0, p1 = 0, p2 = 0, p3 = 0;
  let constraintLine = "", calcSteps: WorkingStep[] = [], ansLatex2 = "", finalLine = "";
  const ctx2 = pick(ctxs2L3); const ctx3 = pick(ctxs3L3);

  while (!valid && tries2++ < 300) {
    total2 = randInt(40, 100); const usePct = Math.random() < 0.5;
    if (threeWay) {
      const ctx = ctx3; const pattern = randInt(0, 1);
      if (pattern === 0) {
        if (usePct) {
          const pct = pick(percentages); p1 = Math.round(total2 * pct / 100);
          if (p1 !== total2 * pct / 100) continue;
          p2 = randInt(1, total2 - p1 - 1); p3 = total2 - p1 - p2;
          constraintLine = `${mStr(pct + "\\%")} are ${ctx.parts[0]}. ${mStr(p2)} are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${pct}\\% \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${pct}% of ${total2} = ${p1}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        } else {
          const fr = pick(fracs2); p1 = Math.round(total2 * fr.num / fr.den);
          if (p1 !== total2 * fr.num / fr.den) continue;
          p2 = randInt(1, total2 - p1 - 1); p3 = total2 - p1 - p2;
          constraintLine = `${fracStr(fr.num, fr.den)} are ${ctx.parts[0]}. ${mStr(p2)} are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${frac(fr.num, fr.den)} \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        }
      } else {
        p1 = randInt(1, Math.floor(total2 / 3)); const rem = total2 - p1;
        if (usePct) {
          const pct = pick(percentages); p2 = Math.round(rem * pct / 100);
          if (p2 !== rem * pct / 100) continue; p3 = total2 - p1 - p2;
          constraintLine = `${mStr(p1)} are ${ctx.parts[0]}. ${mStr(pct + "\\%")} of the remainder are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${total2} - ${p1} = ${rem}`, `Remainder = ${rem}`),
            step(`${pct}\\% \\times ${rem} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        } else {
          const fr = pick(fracs2); p2 = Math.round(rem * fr.num / fr.den);
          if (p2 !== rem * fr.num / fr.den) continue; p3 = total2 - p1 - p2;
          constraintLine = `${mStr(p1)} are ${ctx.parts[0]}. ${fracStr(fr.num, fr.den)} of the remainder are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${total2} - ${p1} = ${rem}`, `Remainder = ${rem}`),
            step(`${frac(fr.num, fr.den)} \\times ${rem} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        }
      }
      if (p1 > 0 && p2 > 0 && p3 > 0) {
        valid = true; ansLatex2 = buildAnswerLatex([p1, p2, p3]);
        finalLine = `There are ${mStr(total2)} ${ctx.item} in a ${ctx.container}. ${constraintLine} Find the ratio ${ctx.parts[0]} : ${ctx.parts[1]} : ${ctx.parts[2]}${sfText}.`;
      }
    } else {
      const ctx = ctx2;
      if (usePct) {
        const pct = pick(percentages); p1 = Math.round(total2 * pct / 100);
        if (p1 !== total2 * pct / 100) continue; p2 = total2 - p1;
        constraintLine = `${mStr(pct + "\\%")} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}.`;
        calcSteps = [
          step(`${pct}\\% \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
          step(`${total2} - ${p1} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
        ];
      } else {
        const fr = pick(fracs2); p1 = Math.round(total2 * fr.num / fr.den);
        if (p1 !== total2 * fr.num / fr.den) continue; p2 = total2 - p1;
        constraintLine = `${fracStr(fr.num, fr.den)} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}.`;
        calcSteps = [
          step(`${frac(fr.num, fr.den)} \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
          step(`${total2} - ${p1} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
        ];
      }
      if (p1 > 0 && p2 > 0 && p1 !== p2) {
        valid = true; ansLatex2 = buildAnswerLatex([p1, p2]);
        finalLine = `There are ${mStr(total2)} ${ctx.item} in a ${ctx.container}. ${constraintLine} Write this as a ratio${sfText}.`;
      }
    }
  }

  const rawParts = threeWay ? [p1, p2, p3] : [p1, p2];
  return {
    kind: "worded", lines: [finalLine], answer: ansLatex2, answerLatex: ansLatex2,
    working: [...calcSteps, mStep("Ratio =", rLatex(...rawParts)), ...buildSimplificationWorking(rawParts)],
    key: `fr-l3-${total2}-${p1}-${p2}-${p3}-${id}`, difficulty: level,
  };
};

// ── 8. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "ratioToFraction") return genRatioToFraction(level, variables, dropdownValue);
  if (t === "fractionToRatio") return genFractionToRatio(level, variables, dropdownValue);
  return genFormingRatios(level, variables);
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ displayFontSize: 2, worksheetFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 4 }}
    />
  );
}
