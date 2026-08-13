import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type SimpleQuestion, type WorkingStep,
  step, mStep, randInt, pick,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "numeric" | "algebraic";

type AlgebraicTerm = { coeff: number; vars: Record<string, number> };

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Simplifying Ratios",
  tools: {
    numeric: {
      name: "Numeric Ratios",
      variables: [], dropdown: null, difficultySettings: null,
    },
    algebraic: {
      name: "Algebraic Ratios",
      variables: [], dropdown: null, difficultySettings: null,
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Numeric Ratios", icon: "🔢",
    content: [
      { label: "Overview", detail: "Simplify a two- or three-part ratio to its lowest terms by dividing every part by their common factors." },
      { label: "Level 1 — Green", detail: "Two-part ratios with a common factor of 2–5; both parts stay under 20." },
      { label: "Level 2 — Yellow", detail: "Two-part ratios with a common factor of 6–18; parts up to 60." },
      { label: "Level 3 — Red", detail: "Three-part ratios with a common factor of 6–18; parts up to 60." },
    ],
  },
  {
    title: "Algebraic Ratios", icon: "🔤",
    content: [
      { label: "Overview", detail: "Simplify a ratio of two algebraic terms by cancelling common numeric and variable factors." },
      { label: "Level 1 — Green", detail: "A single shared factor — either a numeric common factor, a shared variable, or a shared variable raised to a power." },
      { label: "Level 2 — Yellow", detail: "A numeric common factor combined with a shared variable (or one term's variable squared)." },
      { label: "Level 3 — Red", detail: "Two variables each appearing in both terms at different powers, plus a numeric common factor." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question for whole-class discussion." },
      { label: "Worked Example", detail: "Step-by-step division shown below the question." },
      { label: "Worksheet", detail: "Grid of questions with PDF export." },
    ],
  },
];

// ── 4. Shared helpers ─────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const gcdAll = (nums: number[]): number => nums.reduce((acc, n) => gcd(acc, n));

// rLatex → ratio as a KaTeX string, e.g. "6 : 9"
const rLatex = (...parts: (number | string)[]) => parts.join(" : ");

// ── 5. Numeric generator ──────────────────────────────────────────────────────

const NUMERIC_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

const numericSimplificationSteps = (parts: number[]): WorkingStep[] => {
  const steps: WorkingStep[] = [];
  let cur = [...parts];
  while (true) {
    let found = false;
    for (const p of NUMERIC_PRIMES) {
      if (cur.every((n) => n % p === 0)) {
        const next = cur.map((n) => n / p);
        steps.push(step(`${rLatex(...cur)} \\div ${p} = ${rLatex(...next)}`));
        cur = next;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return steps;
};

const genNumericQuestion = (level: DifficultyLevel): SimpleQuestion => {
  const isThreePart = level === "level3";
  const numParts = isThreePart ? 3 : 2;
  const [simpleMin, simpleMax, hcfChoices, minPart, maxPart] =
    level === "level1"
      ? [1, 5, [2, 3, 4, 5], 4, 20]
      : [1, 8, [6, 8, 9, 10, 12, 15, 18], 12, 60];

  for (let attempt = 0; attempt < 100; attempt++) {
    const simplified = Array.from({ length: numParts }, () => randInt(simpleMin, simpleMax));
    if (gcdAll(simplified) !== 1) continue;

    const hcf = pick(hcfChoices);
    const original = simplified.map((x) => x * hcf);
    if (original.some((x) => x < minPart || x > maxPart)) continue;

    const id = randInt(0, 999999);
    return {
      kind: "simple",
      display: original.join(":"),
      displayLatex: rLatex(...original),
      answer: simplified.join(":"),
      answerLatex: rLatex(...simplified),
      working: numericSimplificationSteps(original),
      key: `simplifying-ratios-numeric-${level}-${original.join("_")}-${id}`,
      difficulty: level,
    };
  }

  const id = randInt(0, 999999);
  const fallback = isThreePart ? [12, 18, 24] : [6, 9];
  const fallbackSimplified = isThreePart ? [2, 3, 4] : [2, 3];
  return {
    kind: "simple",
    display: fallback.join(":"),
    displayLatex: rLatex(...fallback),
    answer: fallbackSimplified.join(":"),
    answerLatex: rLatex(...fallbackSimplified),
    working: numericSimplificationSteps(fallback),
    key: `simplifying-ratios-numeric-fallback-${level}-${id}`,
    difficulty: level,
  };
};

// ── 6. Algebraic generator ────────────────────────────────────────────────────

const VARS = ["x", "y", "z"];
const otherVar = (exclude: string[]) => pick(VARS.filter((v) => !exclude.includes(v)));

// formatTerm → LaTeX string for a term, e.g. formatTerm(6, {x:1}) = "6x", formatTerm(2, {x:2}) = "2x^{2}"
const formatTerm = (coeff: number, vars: Record<string, number>): string => {
  const varKeys = Object.keys(vars).sort();
  let result = coeff === 1 && varKeys.length > 0 ? "" : String(coeff);
  for (const v of varKeys) {
    const power = vars[v];
    if (power > 0) result += power === 1 ? v : `${v}^{${power}}`;
  }
  return result || String(coeff);
};

const buildTermPair = (level: DifficultyLevel): { term1: AlgebraicTerm; term2: AlgebraicTerm } => {
  const term1: AlgebraicTerm = { coeff: 1, vars: {} };
  const term2: AlgebraicTerm = { coeff: 1, vars: {} };
  const coprimePair = (lo: number, hi: number): [number, number] => {
    const a = randInt(lo, hi);
    let b = randInt(lo, hi);
    while (gcd(a, b) !== 1 || a === b) b = randInt(lo, hi);
    return [a, b];
  };

  if (level === "level1") {
    const factorType = pick(["numeric", "algebraic", "power"]);
    if (factorType === "numeric") {
      const commonFactor = pick([2, 3, 4, 5, 6, 8, 10]);
      const [c1, c2] = coprimePair(1, 5);
      term1.coeff = commonFactor * c1;
      term2.coeff = commonFactor * c2;
      const var1 = pick(VARS);
      const var2 = otherVar([var1]);
      term1.vars[var1] = 1;
      term2.vars[var2] = 1;
    } else if (factorType === "algebraic") {
      const [c1, c2] = coprimePair(2, 5);
      term1.coeff = c1;
      term2.coeff = c2;
      const commonVar = pick(VARS);
      const var1 = otherVar([commonVar]);
      const var2 = otherVar([commonVar, var1]);
      term1.vars[commonVar] = 1;
      term1.vars[var1] = 1;
      term2.vars[commonVar] = 1;
      term2.vars[var2] = 1;
    } else {
      const [c1, c2] = coprimePair(2, 5);
      term1.coeff = c1;
      term2.coeff = c2;
      const var1 = pick(VARS);
      term1.vars[var1] = 2;
      term2.vars[var1] = 1;
    }
  } else if (level === "level2") {
    const commonNumFactor = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const m1 = randInt(1, 4);
    let m2 = randInt(1, 4);
    while (m1 === m2) m2 = randInt(1, 4);
    term1.coeff = commonNumFactor * m1;
    term2.coeff = commonNumFactor * m2;

    if (pick(["power", "twoVars"]) === "power") {
      const var1 = pick(VARS);
      term1.vars[var1] = 1;
      term2.vars[var1] = 2;
    } else {
      const commonVar = pick(VARS);
      const var1 = otherVar([commonVar]);
      const var2 = otherVar([commonVar, var1]);
      term1.vars[commonVar] = 1;
      term1.vars[var1] = 1;
      term2.vars[commonVar] = 1;
      term2.vars[var2] = 1;
    }
  } else {
    const commonNumFactor = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const m1 = randInt(1, 3);
    let m2 = randInt(2, 4);
    while (m1 === m2) m2 = randInt(2, 4);
    term1.coeff = commonNumFactor * m1;
    term2.coeff = commonNumFactor * m2;

    const var1 = pick(VARS);
    const var2 = otherVar([var1]);
    term1.vars[var1] = 2;
    term1.vars[var2] = 3;
    term2.vars[var1] = 3;
    term2.vars[var2] = 1;
  }

  return { term1, term2 };
};

const buildAlgebraicWorking = (
  term1: AlgebraicTerm, term2: AlgebraicTerm, simp1: AlgebraicTerm, simp2: AlgebraicTerm, coeffGcd: number,
): WorkingStep[] => {
  const steps: WorkingStep[] = [];
  const cur1: AlgebraicTerm = { coeff: term1.coeff, vars: { ...term1.vars } };
  const cur2: AlgebraicTerm = { coeff: term2.coeff, vars: { ...term2.vars } };

  if (coeffGcd > 1) {
    const before = `${formatTerm(cur1.coeff, cur1.vars)} : ${formatTerm(cur2.coeff, cur2.vars)}`;
    cur1.coeff /= coeffGcd;
    cur2.coeff /= coeffGcd;
    steps.push(mStep(`Divide both parts by ${coeffGcd}:`, `${before} = ${formatTerm(cur1.coeff, cur1.vars)} : ${formatTerm(cur2.coeff, cur2.vars)}`));
  }

  const allVars = Array.from(new Set([...Object.keys(term1.vars), ...Object.keys(term2.vars)])).sort();
  for (const v of allVars) {
    const p1 = cur1.vars[v] || 0;
    const p2 = cur2.vars[v] || 0;
    const minPower = Math.min(p1, p2);
    if (minPower <= 0) continue;

    const factorLatex = minPower === 1 ? v : `${v}^{${minPower}}`;
    const before = `${formatTerm(cur1.coeff, cur1.vars)} : ${formatTerm(cur2.coeff, cur2.vars)}`;
    cur1.vars[v] -= minPower;
    cur2.vars[v] -= minPower;
    if (cur1.vars[v] === 0) delete cur1.vars[v];
    if (cur2.vars[v] === 0) delete cur2.vars[v];
    steps.push(mStep(`Divide both parts by ${factorLatex}:`, `${before} = ${formatTerm(cur1.coeff, cur1.vars)} : ${formatTerm(cur2.coeff, cur2.vars)}`));
  }

  steps.push(mStep("Simplified ratio:", `${formatTerm(simp1.coeff, simp1.vars)} : ${formatTerm(simp2.coeff, simp2.vars)}`));
  return steps;
};

const genAlgebraicQuestion = (level: DifficultyLevel): SimpleQuestion => {
  const { term1, term2 } = buildTermPair(level);

  const coeffGcd = gcd(term1.coeff, term2.coeff);
  const simplified1: AlgebraicTerm = { coeff: term1.coeff / coeffGcd, vars: {} };
  const simplified2: AlgebraicTerm = { coeff: term2.coeff / coeffGcd, vars: {} };

  const allVars = new Set([...Object.keys(term1.vars), ...Object.keys(term2.vars)]);
  allVars.forEach((v) => {
    const power1 = term1.vars[v] || 0;
    const power2 = term2.vars[v] || 0;
    const minPower = Math.min(power1, power2);
    if (power1 > minPower) simplified1.vars[v] = power1 - minPower;
    if (power2 > minPower) simplified2.vars[v] = power2 - minPower;
  });

  const id = randInt(0, 999999);
  return {
    kind: "simple",
    display: `${formatTerm(term1.coeff, term1.vars)}:${formatTerm(term2.coeff, term2.vars)}`,
    displayLatex: `${formatTerm(term1.coeff, term1.vars)} : ${formatTerm(term2.coeff, term2.vars)}`,
    answer: `${formatTerm(simplified1.coeff, simplified1.vars)}:${formatTerm(simplified2.coeff, simplified2.vars)}`,
    answerLatex: `${formatTerm(simplified1.coeff, simplified1.vars)} : ${formatTerm(simplified2.coeff, simplified2.vars)}`,
    working: buildAlgebraicWorking(term1, term2, simplified1, simplified2, coeffGcd),
    key: `simplifying-ratios-algebraic-${level}-${formatTerm(term1.coeff, term1.vars)}-${formatTerm(term2.coeff, term2.vars)}-${id}`,
    difficulty: level,
  };
};

// ── 7. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "algebraic") return genAlgebraicQuestion(level);
  return genNumericQuestion(level);
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
