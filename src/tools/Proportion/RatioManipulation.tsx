import {
  ToolShell,
  type ToolConfig, type ToolMultiSelect, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type WorkingStep,
  step, mStep, fracStr, mStr, randInt, pick, resolveMultiSelectValues, ratioTableStepRenderer, ratioTableStepVisual, ratioTableSheet, BarModel, FitWidth, rowsBarNatural, type BarModelData,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./RatioManipulation.about";
import { DEPTH_ITEMS } from "./RatioManipulationDepth";
import { SIMPLIFY_TYPES, SIMPLIFY_ASK, SIMPLIFY_METHOD, genSimplifying, type SimplifyMethod } from "./ratioSimplifying";
import { EQ_ASKED, EQ_DIRECTION, genEquivalent } from "./ratioEquivalent";
import { fractionOfSettings, genRatioToFraction } from "./ratioFractionOf";
import { rLatex, simplifyRatioParts, getSimplificationSteps, fractionOfTotalToRatio, fractionOfPartToRatio, formTwoPartRatio } from "./ratioFromFraction";
import { getDevMode } from "../../devMode";
import { gcd, lcm } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "formingRatios" | "simplifying" | "equivalentRatios" | "fractionToRatio" | "ratioToFraction";

// Fraction to Ratio, Level 1: is the fraction of the total ("2/5 are red, the rest blue") or of the other part ("red is 2/3 of blue")?
const FRACTION_GIVEN: ToolMultiSelect = {
  key: "fractionGiven", tab: "questions" as const, label: "Fraction Given As",
  options: [{ value: "givenOfTotal", label: "The Total", defaultActive: true }, { value: "givenOfPart", label: "The Other Part", defaultActive: false }],
};
/** True when this question should give the fraction of the other part (one kind per question; The Total when nothing else is on). */
const genGivenOfPart = (msv: Record<string, boolean>): boolean => {
  const values = resolveMultiSelectValues([FRACTION_GIVEN], msv);
  const kinds = FRACTION_GIVEN.options.map((o) => o.value).filter((v) => values[v]);
  return (kinds.length ? pick(kinds) : "givenOfTotal") === "givenOfPart";
};

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Ratio Manipulation",
  tools: {
    formingRatios: {
      name: "Forming Ratios",
      variables: [
        { key: "threeWay", tab: "questions" as const, label: "3-Way Ratio", defaultValue: false },
        { key: "simplestForm", tab: "display" as const, label: "Simplest Form", defaultValue: false },
      ],
      dropdown: null, difficultySettings: null,
    },
    simplifying: {
      name: "Simplifying",
      variables: [], dropdown: SIMPLIFY_METHOD, difficultySettings: null,
      multiSelect: [SIMPLIFY_TYPES, SIMPLIFY_ASK],
    },
    equivalentRatios: {
      name: "Equivalent Ratios",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: {},
        level2: { multiSelect: [EQ_ASKED, EQ_DIRECTION] },
        level3: { multiSelect: EQ_ASKED },
      },
    },
    fractionToRatio: {
      name: "Fraction to Ratio",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: FRACTION_GIVEN },
        level2: { variables: [{ key: "findCommonDenominators", tab: "numbers" as const, label: "Different Denominators", defaultValue: false }], dropdown: null },
        level3: {
          variables: [],
          dropdown: { key: "given", tab: "questions" as const, label: "Given", useTwoLineButtons: false, options: [{ value: "partA", label: "Part A" }, { value: "partB", label: "Part B" }, { value: "total", label: "Total" }, { value: "mixed", label: "Mixed" }], defaultValue: "mixed" },
        },
      },
    },
    ratioToFraction: {
      name: "Ratio to Fraction",
      variables: [], dropdown: null,
      difficultySettings: { level1: fractionOfSettings("level1"), level2: fractionOfSettings("level2"), level3: fractionOfSettings("level3") },
    },
  },
};


// ── 4. Maths helpers ──────────────────────────────────────────────────────────

// frac(n,d) → LaTeX string for use directly in step()/mStep()
const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;

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
      mStep(
        getDevMode() ? `Find the [[lcm|LCM]] of ${f1.den} and ${f2.den}:` : "LCD:",
        `${f1.den} \\text{ and } ${f2.den} \\Rightarrow ${lcd}`,
      ),
      step(`${frac(f1.num, f1.den)} = ${frac(f1.num * m1, lcd)}`),
      step(`${frac(f2.num, f2.den)} = ${frac(f2.num * m2, lcd)}`),
    ],
  };
};

// ── 6. fractionToRatio generator ──────────────────────────────────────────────

const genFractionToRatio = (level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, msv: Record<string, boolean> = {}): WordedQuestion => {
  const id = randInt(0, 999999);

  if (level === "level1" && genGivenOfPart(msv)) {
    // "Red is 2/3 of blue": the fraction is of the other part, so the ratio is numerator : denominator
    const ctx = pick([
      { item: "beads", colors: ["red", "blue"] }, { item: "sweets", colors: ["purple", "orange"] }, { item: "marbles", colors: ["pink", "white"] },
      { item: "counters", colors: ["black", "silver"] }, { item: "balls", colors: ["red", "blue"] },
    ]);
    let num = 1, den = 2;
    for (let t = 0; t < 100; t++) { den = randInt(2, 10); num = randInt(1, den - 1); if (gcd(num, den) === 1) break; }
    const rev = Math.random() < 0.5;
    return fractionOfPartToRatio({ item: ctx.item, colors: ctx.colors as [string, string] }, num, den, { rev });
  }

  if (level === "level1") {
    const ctx = pick([
      { item: "beads", colors: ["Red", "Blue"] }, { item: "sweets", colors: ["Purple", "Orange"] },
      { item: "marbles", colors: ["Pink", "White"] }, { item: "counters", colors: ["Black", "Silver"] },
      { item: "balls", colors: ["Red", "Blue"] },
    ]);
    const { num, den } = generateSimplestFraction();
    const pA = num, pB = den - num;
    if (pA === pB) return genFractionToRatio(level, variables, dropdownValue);
    const rev = Math.random() < 0.5, prose = Math.random() < 0.5;
    return { ...fractionOfTotalToRatio({ item: ctx.item, colors: ctx.colors as [string, string] }, num, den, { rev, prose }), key: `ftr-l1-${num}-${den}-${rev}-${id}` };
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
      const rev = Math.random() < 0.5, wording = Math.random() < 0.5 ? "write" : "find";
      return { ...formTwoPartRatio({ items: ctx.items as [string, string], container: ctx.container }, a, b, { rev, simplest: simplestForm, wording }), key: `fr-l1-2w-${a}-${b}-${rev}-${id}` };
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
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "simplifying") return genSimplifying(level, multiSelectValues, dropdownValue as SimplifyMethod);
  if (t === "equivalentRatios") return genEquivalent(level, multiSelectValues);
  if (t === "ratioToFraction") return genRatioToFraction(level, variables, multiSelectValues);
  if (t === "fractionToRatio") return genFractionToRatio(level, variables, dropdownValue, multiSelectValues);
  return genFormingRatios(level, variables);
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion, depthItems: DEPTH_ITEMS };

const PRINTABLES = [ratioTableSheet()];

/** The fraction working's bar model (the ratio look, as in Ratio Sharing), drawn at its natural size. */
const FractionBar = ({ data }: { data: BarModelData }) => {
  const size = 28, { w, h } = rowsBarNatural(data, size);
  // FitWidth scales a long bar down to its panel (a phone, a narrow column) instead of clipping it
  return <FitWidth><BarModel data={data} width={Math.ceil(w) + 8} height={Math.ceil(h) + 8} size={size} /></FitWidth>;
};
const stepVisual = (s: WorkingStep): JSX.Element | null | false => (s.type === "fracBar" ? <FractionBar data={s.extra as BarModelData} /> : ratioTableStepVisual(s));
const stepRender = (s: WorkingStep): JSX.Element | null =>
  s.type === "fracBar" ? <div className="flex flex-col items-center gap-3"><p className="text-xl">{s.plain}</p><FractionBar data={s.extra as BarModelData} /></div> : ratioTableStepRenderer(s);

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      stepRenderer={stepRender}
      stepVisualRenderer={stepVisual}
      printables={PRINTABLES}
      depthItems={DEPTH_ITEMS}
      defaults={{ displayFontSize: 2, worksheetFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 4, toolTabRows: [3, 2] }}
    />
  );
}
