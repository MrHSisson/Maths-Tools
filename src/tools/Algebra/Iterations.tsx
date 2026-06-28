import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  randInt, step, mStep, tStep,
} from "../../shared";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolType = "numerical" | "rearranging" | "verification";
type FormulaType = "quadratic" | "cubic" | "fractional" | "mixed";
type AnswerType = "first3" | "root";

// ── TOOL_CONFIG ────────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Iteration",
  tools: {
    numerical: {
      name: "Numerical Processing",
      variables: [{ key: "calcSteps", label: "Calculator Steps", defaultValue: false }],
      dropdown: {
        key: "formulaType", label: "Formula Type",
        options: [
          { value: "mixed", label: "Mixed" },
          { value: "quadratic", label: "√ Quadratic" },
          { value: "cubic", label: "∛ Cubic" },
          { value: "fractional", label: "Fractional" },
        ],
        defaultValue: "mixed",
      },
      difficultySettings: null,
    },
    rearranging: {
      name: "Rearranging & Solving",
      variables: [{ key: "targetFormula", label: "Show Target Formula", defaultValue: true }],
      dropdown: {
        key: "answerType", label: "Answer Type",
        options: [
          { value: "first3", label: "First 3" },
          { value: "root", label: "Find Root" },
        ],
        defaultValue: "root",
      },
      difficultySettings: null,
    },
    verification: {
      name: "Root Verification",
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },
  },
};

// ── INFO_SECTIONS ──────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Numerical Processing", icon: "🔢", content: [
    { label: "Overview", detail: "Apply an iterative formula xₙ₊₁ = f(xₙ) repeatedly from a given starting value." },
    { label: "Level 1 — Green", detail: "Integer x₀, produce x₁, x₂, x₃. Covers √, ∛, and fractional forms." },
    { label: "Level 2 — Yellow", detail: "Decimal x₀, produce x₁ through x₅." },
    { label: "Level 3 — Red", detail: "Iterate to convergence and state the root to 2 decimal places." },
    { label: "Calculator Steps", detail: "Toggle on to add a tip for using ANS on a calculator." },
  ]},
  { title: "Rearranging & Solving", icon: "✏️", content: [
    { label: "Overview", detail: "Rearrange an equation algebraically to produce an iterative formula, then apply it." },
    { label: "Level 1 — Green", detail: "Quadratic: x² − ax − b = 0 → x = √(ax + b)" },
    { label: "Level 2 — Yellow", detail: "Cubic: x³ − ax − b = 0 → x = ∛(ax + b)" },
    { label: "Level 3 — Red", detail: "Fractional: x² − bx − a = 0 → x = a/x + b" },
    { label: "Show Target Formula", detail: "'Show that…' style when on; open rearrangement when off." },
    { label: "Answer Type", detail: "First 3: find x₁, x₂, x₃. Find Root: iterate to convergence at 2 d.p." },
  ]},
  { title: "Root Verification", icon: "✅", content: [
    { label: "Overview", detail: "Use the change of sign method to verify that a root lies in a given interval." },
    { label: "Level 1 — Green", detail: "Verify a root between two consecutive integers." },
    { label: "Level 2 — Yellow", detail: "Verify a root correct to 1 decimal place (bounds to 2 d.p.)." },
    { label: "Level 3 — Red", detail: "Verify a root correct to 2 decimal places (bounds to 3 d.p.)." },
  ]},
];

// ── Maths helpers ──────────────────────────────────────────────────────────────

const fmtD = (v: number, dp: number) => v.toFixed(dp);
const roundTo = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp;

const xSub = (n: number) => `x_{${n}}`;
const xNext = "x_{n+1}";
const xn = "x_n";

const sqrtFormula = (a: number, b: number) => `\\sqrt{${a}${xn} + ${b}}`;
const cbrtFormula = (a: number, b: number) => `\\sqrt[3]{${a}${xn} + ${b}}`;
const fracFormula = (a: number, b: number) => `\\dfrac{${a}}{${xn}} + ${b}`;

const sqrtStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\sqrt{${a} \\times ${fmtD(prev, 4)} + ${b}} = \\sqrt{${fmtD(a * prev + b, 4)}} = ${fmtD(result, 4)}`;
const cbrtStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\sqrt[3]{${a} \\times ${fmtD(prev, 4)} + ${b}} = \\sqrt[3]{${fmtD(a * prev + b, 4)}} = ${fmtD(result, 4)}`;
const fracStep = (i: number, prev: number, a: number, b: number, result: number) =>
  `${xSub(i)} = \\dfrac{${a}}{${fmtD(prev, 4)}} + ${b} = ${fmtD(result, 4)}`;

// Display lines are prose with inline $...$ maths.
type Seg = { k: "t"; s: string } | { k: "m"; s: string };
const tx = (s: string): Seg => ({ k: "t", s });
const mx = (s: string): Seg => ({ k: "m", s });
const segsLine = (segs: Seg[]): string => segs.map(s => (s.k === "t" ? s.s : `$${s.s}$`)).join("");

const id = () => Math.floor(Math.random() * 1_000_000);

// ── NUMERICAL ──────────────────────────────────────────────────────────────────

const genNumerical = (level: DifficultyLevel, calcSteps: boolean, formulaType: FormulaType): AnyQuestion => {
  const selected = formulaType === "mixed"
    ? (["quadratic", "cubic", "fractional"] as const)[randInt(0, 2)]
    : formulaType;

  let a: number, b: number, x0: number;
  let fDisplay: string;
  let iterations: number[];
  let convergedValue: number | undefined;
  const targetDP = 2;

  const iter = (start: number, fn: (x: number) => number, n: number) => {
    const r: number[] = []; let c = start;
    for (let i = 0; i < n; i++) { c = fn(c); r.push(c); }
    return r;
  };
  const iterConverge = (start: number, fn: (x: number) => number, dp: number) => {
    const r: number[] = []; let c = start, prev = start;
    for (let i = 0; i < 30; i++) {
      c = fn(c); r.push(c);
      if (i > 0 && roundTo(c, dp) === roundTo(prev, dp)) break;
      prev = c;
    }
    return { iters: r, converged: roundTo(r[r.length - 1], dp) };
  };

  if (level === "level1") {
    x0 = randInt(1, 5);
    if (selected === "quadratic") { a = randInt(2, 6); b = randInt(1, 5); fDisplay = sqrtFormula(a, b); iterations = iter(x0, x => Math.sqrt(a * x + b), 3); }
    else if (selected === "cubic") { a = randInt(5, 12); b = randInt(1, 10); fDisplay = cbrtFormula(a, b); iterations = iter(x0, x => Math.cbrt(a * x + b), 3); }
    else { a = randInt(2, 7); b = randInt(1, 4); x0 = randInt(2, 4); fDisplay = fracFormula(a, b); iterations = iter(x0, x => a / x + b, 3); }
  } else if (level === "level2") {
    x0 = randInt(10, 39) / 10;
    if (selected === "quadratic") { a = randInt(2, 5); b = randInt(1, 6); fDisplay = sqrtFormula(a, b); iterations = iter(x0, x => Math.sqrt(a * x + b), 5); }
    else if (selected === "cubic") { a = randInt(5, 12); b = randInt(1, 10); fDisplay = cbrtFormula(a, b); iterations = iter(x0, x => Math.cbrt(a * x + b), 5); }
    else { a = randInt(3, 10); b = randInt(1, 5); x0 = randInt(15, 34) / 10; fDisplay = fracFormula(a, b); iterations = iter(x0, x => a / x + b, 5); }
  } else {
    x0 = randInt(10, 39) / 10;
    if (selected === "quadratic") { a = randInt(2, 5); b = randInt(1, 6); fDisplay = sqrtFormula(a, b); const r = iterConverge(x0, x => Math.sqrt(a * x + b), targetDP); iterations = r.iters; convergedValue = r.converged; }
    else if (selected === "cubic") { a = randInt(5, 12); b = randInt(1, 10); fDisplay = cbrtFormula(a, b); const r = iterConverge(x0, x => Math.cbrt(a * x + b), targetDP); iterations = r.iters; convergedValue = r.converged; }
    else { a = randInt(2, 11); b = randInt(1, 6); x0 = randInt(15, 34) / 10; fDisplay = fracFormula(a, b); const r = iterConverge(x0, x => a / x + b, targetDP); iterations = r.iters; convergedValue = r.converged; }
  }

  const numShow = level === "level1" ? 3 : level === "level2" ? 5 : iterations.length;

  const findSegs: Seg[] = level === "level1"
    ? [tx(", find "), mx(`${xSub(1)}, ${xSub(2)}, ${xSub(3)}`)]
    : level === "level2"
      ? [tx(", find "), mx(`${xSub(1)}`), tx(" to "), mx(`${xSub(5)}`)]
      : [tx(", find the root to "), tx(`${targetDP} d.p.`)];

  const display: Seg[] = [
    tx("Using "), mx(`${xSub(0)} = ${x0}`), tx(" and "), mx(`${xNext} = ${fDisplay}`),
    ...findSegs,
  ];

  const answerLatex = level === "level1"
    ? `${xSub(1)}=${fmtD(iterations[0], 3)},\\;${xSub(2)}=${fmtD(iterations[1], 3)},\\;${xSub(3)}=${fmtD(iterations[2], 3)}`
    : level === "level2"
      ? `${xSub(5)} = ${fmtD(iterations[4], 4)}`
      : `x = ${fmtD(convergedValue!, targetDP)}`;
  const answerPlain = level === "level1"
    ? `x1=${fmtD(iterations[0], 3)}, x2=${fmtD(iterations[1], 3)}, x3=${fmtD(iterations[2], 3)}`
    : level === "level2" ? `x5=${fmtD(iterations[4], 4)}` : `x=${fmtD(convergedValue!, targetDP)}`;

  const working: WorkingStep[] = [step(`${xSub(0)} = ${x0}`)];
  for (let i = 0; i < numShow; i++) {
    const prev = i === 0 ? x0 : iterations[i - 1];
    const latex = selected === "quadratic" ? sqrtStep(i + 1, prev, a, b, iterations[i])
      : selected === "cubic" ? cbrtStep(i + 1, prev, a, b, iterations[i])
        : fracStep(i + 1, prev, a, b, iterations[i]);
    working.push(step(latex));
  }
  if (level === "level3" && convergedValue !== undefined) {
    const last = iterations.slice(-2);
    const n = iterations.length;
    working.push(step(`${xSub(n - 1)} = ${fmtD(last[0], 4)} \\rightarrow ${fmtD(roundTo(last[0], targetDP), targetDP)}`));
    working.push(step(`${xSub(n)} = ${fmtD(last[1], 4)} \\rightarrow ${fmtD(roundTo(last[1], targetDP), targetDP)}`));
    working.push(mStep("Both values round the same — the root is:", `x = ${fmtD(convergedValue, targetDP)}`));
  }
  if (calcSteps) {
    const tip = selected === "quadratic" ? `💡 Calculator: type ${x0}, press =. Then √(${a} × ANS + ${b}) and press = repeatedly.`
      : selected === "cubic" ? `💡 Calculator: type ${x0}, press =. Then ∛(${a} × ANS + ${b}) and press = repeatedly.`
        : `💡 Calculator: type ${x0}, press =. Then ${a} ÷ ANS + ${b} and press = repeatedly.`;
    working.push(tStep(tip));
  }

  return {
    kind: "worded",
    lines: [segsLine(display)],
    answer: answerPlain,
    answerLatex,
    working,
    key: `num-${selected}-${a}-${b}-${x0}-${id()}`,
    difficulty: level,
  };
};

// ── REARRANGING ────────────────────────────────────────────────────────────────

const genRearranging = (level: DifficultyLevel, showTarget: boolean, answerType: AnswerType): AnyQuestion => {
  let a: number, b: number, x0: number;
  let eqLatex: string, targetLatex: string;
  let iterFn: (x: number) => number;
  const working: WorkingStep[] = [];

  if (level === "level1") {
    a = randInt(2, 5); b = randInt(1, 5); x0 = randInt(1, 3);
    eqLatex = `x^2 - ${a}x - ${b} = 0`;
    targetLatex = sqrtFormula(a, b);
    iterFn = x => Math.sqrt(a * x + b);
    working.push(mStep("Start with:", eqLatex));
    working.push(step(`x^2 = ${a}x + ${b}`));
    working.push(step(`${xNext} = \\sqrt{${a}x + ${b}}`));
  } else if (level === "level2") {
    a = randInt(2, 5); b = randInt(1, 6); x0 = randInt(1, 2);
    eqLatex = `x^3 - ${a}x - ${b} = 0`;
    targetLatex = cbrtFormula(a, b);
    iterFn = x => Math.cbrt(a * x + b);
    working.push(mStep("Start with:", eqLatex));
    working.push(step(`x^3 = ${a}x + ${b}`));
    working.push(step(`${xNext} = \\sqrt[3]{${a}x + ${b}}`));
  } else {
    a = randInt(2, 7); b = randInt(1, 3); x0 = randInt(2, 3);
    eqLatex = `x^2 - ${b}x - ${a} = 0`;
    targetLatex = fracFormula(a, b);
    iterFn = x => a / x + b;
    working.push(mStep("Start with:", eqLatex));
    working.push(step(`x^2 = ${b}x + ${a}`));
    working.push(step(`x = ${b} + \\dfrac{${a}}{x}`));
    working.push(step(`${xNext} = \\dfrac{${a}}{${xn}} + ${b}`));
  }

  const iterations: number[] = [];
  if (answerType === "first3") {
    let c = x0;
    for (let i = 0; i < 3; i++) { c = iterFn(c); iterations.push(c); }
  } else {
    let c = x0, prev = x0;
    for (let i = 0; i < 30; i++) {
      c = iterFn(c); iterations.push(c);
      if (i > 0 && roundTo(c, 2) === roundTo(prev, 2)) break;
      prev = c;
    }
  }
  const root = roundTo(iterations[iterations.length - 1], 2);
  const numShow = answerType === "first3" ? 3 : iterations.length;

  working.push(step(`${xSub(0)} = ${x0}`));
  for (let i = 0; i < numShow; i++) {
    const prev = i === 0 ? x0 : iterations[i - 1];
    const latex = level === "level1" ? sqrtStep(i + 1, prev, a, b, iterations[i])
      : level === "level2" ? cbrtStep(i + 1, prev, a, b, iterations[i])
        : fracStep(i + 1, prev, a, b, iterations[i]);
    working.push(step(latex));
  }
  if (answerType === "root" && iterations.length >= 2) {
    const last = iterations.slice(-2);
    const n = iterations.length;
    working.push(step(`${xSub(n - 1)} = ${fmtD(last[0], 4)} \\rightarrow ${fmtD(roundTo(last[0], 2), 2)}`));
    working.push(step(`${xSub(n)} = ${fmtD(last[1], 4)} \\rightarrow ${fmtD(roundTo(last[1], 2), 2)}`));
    working.push(mStep("Both values round the same — the root is:", `x = ${fmtD(root, 2)}`));
  }

  const taskSegs: Seg[] = answerType === "first3"
    ? [tx(". Using "), mx(`${xSub(0)} = ${x0}`), tx(", find "), mx(`${xSub(1)}, ${xSub(2)}, ${xSub(3)}`), tx(".")]
    : [tx(". Using "), mx(`${xSub(0)} = ${x0}`), tx(", find the root to 2 d.p.")];

  const display: Seg[] = showTarget
    ? [tx("Show that "), mx(eqLatex), tx(" can be written as "), mx(`${xNext} = ${targetLatex}`), ...taskSegs]
    : [tx("Rearrange "), mx(eqLatex), tx(" into an iterative formula"), ...taskSegs];

  const answerLatex = answerType === "first3"
    ? `${xSub(1)}=${fmtD(iterations[0], 4)},\\;${xSub(2)}=${fmtD(iterations[1], 4)},\\;${xSub(3)}=${fmtD(iterations[2], 4)}`
    : `x = ${fmtD(root, 2)}`;
  const answerPlain = answerType === "first3"
    ? `x1=${fmtD(iterations[0], 4)}, x2=${fmtD(iterations[1], 4)}, x3=${fmtD(iterations[2], 4)}`
    : `x=${fmtD(root, 2)}`;

  return {
    kind: "worded",
    lines: [segsLine(display)],
    answer: answerPlain,
    answerLatex,
    working,
    key: `rear-${level}-${a}-${b}-${x0}-${id()}`,
    difficulty: level,
  };
};

// ── VERIFICATION ───────────────────────────────────────────────────────────────

const genVerification = (level: DifficultyLevel): AnyQuestion => {
  const useCubic = Math.random() < 0.5;
  const a = randInt(2, 5), b = randInt(2, 9);
  const working: WorkingStep[] = [];

  let root: number, lBound: number, uBound: number;
  let eqLatex: string, fxLatex: string, eqPlain: string;
  let fL: number, fU: number;

  if (useCubic) {
    let x = 2;
    for (let i = 0; i < 20; i++) { const fx = x ** 3 - a * x - b, fpx = 3 * x ** 2 - a; if (Math.abs(fpx) > 1e-9) x -= fx / fpx; }
    if (level === "level1") { lBound = Math.floor(x); uBound = Math.ceil(x); if (lBound === uBound) uBound++; root = x; }
    else if (level === "level2") { root = roundTo(x, 1); lBound = roundTo(root - 0.05, 2); uBound = roundTo(root + 0.05, 2); }
    else { root = roundTo(x, 2); lBound = roundTo(root - 0.005, 3); uBound = roundTo(root + 0.005, 3); }
    eqLatex = `x^3 - ${a}x - ${b}`; fxLatex = `x^3 - ${a}x - ${b}`; eqPlain = `x3-${a}x-${b}`;
    fL = lBound ** 3 - a * lBound - b; fU = uBound ** 3 - a * uBound - b;
  } else {
    const disc = a * a + 4 * b, x = (a + Math.sqrt(disc)) / 2;
    if (level === "level1") { lBound = Math.floor(x); uBound = Math.ceil(x); if (lBound === uBound) uBound++; root = x; }
    else if (level === "level2") { root = roundTo(x, 1); lBound = roundTo(root - 0.05, 2); uBound = roundTo(root + 0.05, 2); }
    else { root = roundTo(x, 2); lBound = roundTo(root - 0.005, 3); uBound = roundTo(root + 0.005, 3); }
    eqLatex = `x^2 - ${a}x - ${b}`; fxLatex = `x^2 - ${a}x - ${b}`; eqPlain = `x2-${a}x-${b}`;
    fL = lBound ** 2 - a * lBound - b; fU = uBound ** 2 - a * uBound - b;
  }

  const bDP = level === "level3" ? 3 : level === "level2" ? 2 : 0;
  const lS = fmtD(lBound, bDP), uS = fmtD(uBound, bDP);
  const lSign = fL < 0 ? "negative" : "positive", uSign = fU < 0 ? "negative" : "positive";
  const fCalc = (xStr: string) => useCubic ? `${xStr}^3 - ${a}(${xStr}) - ${b}` : `${xStr}^2 - ${a}(${xStr}) - ${b}`;

  working.push(step(`f(x) = ${fxLatex}`));
  working.push(mStep("Test the bounds:", `x = ${lS},\\quad x = ${uS}`));
  working.push(step(`f(${lS}) = ${fCalc(lS)} = ${fmtD(fL, 4)}`));
  working.push(step(`f(${uS}) = ${fCalc(uS)} = ${fmtD(fU, 4)}`));
  working.push(tStep(`f(${lS}) is ${lSign}, f(${uS}) is ${uSign}.`));
  working.push(mStep("Change of sign ⇒ the root lies in the interval:", `[${lS},\\,${uS}]`));
  if (level !== "level1") {
    working.push(mStep(`Root correct to ${level === "level2" ? "1" : "2"} d.p.:`, `x = ${level === "level2" ? fmtD(root, 1) : fmtD(root, 2)}`));
  }

  let display: Seg[];
  if (level === "level1") {
    display = [tx("The equation "), mx(eqLatex), tx(" = 0 has a root between "), tx(`${lBound}`), tx(" and "), tx(`${uBound}`), tx(". Use the change of sign method to verify this.")];
  } else if (level === "level2") {
    display = [tx("Show that "), mx(eqLatex), tx(" = 0 has a root equal to "), mx(fmtD(root, 1)), tx(" correct to 1 decimal place.")];
  } else {
    display = [tx("Show that "), mx(eqLatex), tx(" = 0 has a root equal to "), mx(fmtD(root, 2)), tx(" correct to 2 decimal places.")];
  }

  const isL1 = level === "level1";
  const answerLatex = isL1 ? undefined : `x = ${level === "level2" ? fmtD(root, 1) : fmtD(root, 2)}`;
  const answerPlain = isL1
    ? `f(${lBound})=${fmtD(fL, 2)} (${lSign}), f(${uBound})=${fmtD(fU, 2)} (${uSign}). Change of sign.`
    : `x=${level === "level2" ? fmtD(root, 1) : fmtD(root, 2)}`;

  return {
    kind: "worded",
    lines: [segsLine(display)],
    answer: answerPlain,
    ...(answerLatex ? { answerLatex } : {}),
    working,
    key: `ver-${useCubic ? "c" : "q"}-${a}-${b}-${eqPlain}-${id()}`,
    difficulty: level,
  };
};

// ── generateQuestion ───────────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "numerical") return genNumerical(level, variables["calcSteps"] ?? false, (dropdownValue || "mixed") as FormulaType);
  if (t === "rearranging") return genRearranging(level, variables["targetFormula"] ?? true, (dropdownValue || "root") as AnswerType);
  return genVerification(level);
};

// ── Export ─────────────────────────────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numColumns: 2 }}
    />
  );
}
