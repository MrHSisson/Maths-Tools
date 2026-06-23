import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  randInt, pick, mStep,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "single" | "double";

const VARIABLES = ['x', 'y', 'a', 'b', 'p', 'q', 'r', 's', 't', 'n', 'm'];

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const MULTIPLIER_DD = {
  key: "multiplier", label: "Multiplier",
  options: [
    { value: "numerical", label: "Numerical" },
    { value: "algebraic", label: "Algebraic" },
    { value: "mixed", label: "Mixed" },
  ],
  defaultValue: "numerical",
};

const QUESTION_TYPE_MS = {
  key: "questionType",
  label: "Question Type",
  options: [
    { value: "expand", label: "Expand", defaultActive: true },
    { value: "expandSimplify", label: "Expand & Simplify", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Expanding Brackets",
  tools: {

    single: {
      name: "Single Brackets",
      instruction: "Expand:",
      variables: [],
      dropdown: MULTIPLIER_DD,
      multiSelect: QUESTION_TYPE_MS,
      difficultySettings: null,
    },

    double: {
      name: "Double Brackets",
      instruction: "Expand:",
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Single Brackets", icon: "🔢", content: [
    { label: "Overview",         detail: "Expand expressions like a(bx + c) by multiplying the term outside the bracket by each term inside." },
    { label: "Level 1 — Green",  detail: "Positive integer multiplier and positive terms inside the bracket. e.g. 3(2x + 5)." },
    { label: "Level 2 — Yellow", detail: "Introduces negative terms, reversed forms like a(c − bx), and larger coefficients." },
    { label: "Level 3 — Red",    detail: "Negative multipliers and mixed positive/negative terms throughout." },
  ]},
  { title: "Double Brackets", icon: "✖️", content: [
    { label: "Overview",         detail: "Expand products of two binomials like (x + a)(x + b) by multiplying each term in the first bracket by each term in the second." },
    { label: "Level 1 — Green",  detail: "Monic brackets with positive constants: (x + a)(x + b) where a, b > 0." },
    { label: "Level 2 — Yellow", detail: "Monic brackets with at least one negative constant." },
    { label: "Level 3 — Red",    detail: "Non-monic brackets (ax + b)(cx + d) with possible negative coefficients." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Multiplier (Single)",      detail: "Numerical: number outside the bracket. Algebraic: variable term outside. Mixed: randomly either." },
    { label: "Expand & Simplify",        detail: "Generates two bracketed expressions to expand and combine like terms." },
    { label: "Differentiated",           detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question with working space." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
];

// ── 4. KaTeX formatting helpers ──────────────────────────────────────────────

const coeffLatex = (c: number, v: string, power: number, isFirst: boolean): string => {
  const varPart = power === 0 ? "" : power === 1 ? v : `${v}^{${power}}`;
  const abs = Math.abs(c);

  if (power === 0) {
    if (isFirst) return c < 0 ? `-${abs}` : `${abs}`;
    return c < 0 ? `- ${abs}` : `+ ${abs}`;
  }

  const coStr = abs === 1 ? "" : `${abs}`;
  if (isFirst) return c < 0 ? `-${coStr}${varPart}` : `${coStr}${varPart}`;
  return c < 0 ? `- ${coStr}${varPart}` : `+ ${coStr}${varPart}`;
};

const polyLatex = (terms: { coeff: number; v: string; power: number }[]): string => {
  const nonZero = terms.filter(t => t.coeff !== 0);
  if (nonZero.length === 0) return "0";
  return nonZero.map((t, i) => coeffLatex(t.coeff, t.v, t.power, i === 0)).join(" ");
};

// ── 5. Single bracket generation ─────────────────────────────────────────────

const genSingleExpand = (
  level: DifficultyLevel,
  multiplierType: string,
  forcedVar: string | null = null,
): { displayLatex: string; answerLatex: string; working: AnyQuestion["working"]; key: string; v: string; xCoeff: number; constant: number; x2Coeff: number; x3Coeff: number } => {
  const v = forcedVar || pick(VARIABLES);
  const useVar = multiplierType === "algebraic" ? true : multiplierType === "mixed" ? Math.random() > 0.5 : false;
  const outsidePower = useVar ? (Math.random() > 0.5 ? 1 : 2) : 0;

  let a: number, b: number, c: number;
  let isReversed = false;

  if (level === "level1") {
    a = randInt(2, 10);
    b = randInt(1, 5);
    c = randInt(0, 9);
  } else if (level === "level2") {
    a = randInt(2, 10);
    if (Math.random() > 0.5) {
      b = randInt(1, 9);
      c = randInt(1, 9);
      isReversed = true;
    } else {
      b = randInt(1, 9);
      c = randInt(-9, -1);
    }
  } else {
    a = randInt(-10, -1);
    b = randInt(-5, 5); if (b === 0) b = 1;
    c = randInt(-9, 9);
  }

  let xCoeff = 0, x2Coeff = 0, x3Coeff = 0, constant = 0;

  if (useVar) {
    if (outsidePower === 1) {
      x2Coeff = a * b;
      xCoeff = a * c;
    } else {
      x3Coeff = a * b;
      x2Coeff = a * c;
    }
  } else {
    xCoeff = isReversed ? a * (-b) : a * b;
    constant = a * c;
  }

  // Build display LaTeX
  let outsideTerm: string;
  if (useVar) {
    outsideTerm = coeffLatex(a, v, outsidePower, true);
  } else {
    outsideTerm = `${a}`;
  }

  let bracketInner: string;
  if (useVar) {
    const bTerm = coeffLatex(b, v, 1, true);
    const cTerm = c === 0 ? "" : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
    bracketInner = bTerm + cTerm;
  } else if (isReversed) {
    bracketInner = `${c} - ${coeffLatex(b, v, 1, true)}`;
  } else {
    const bTerm = coeffLatex(b, v, 1, true);
    const cTerm = c === 0 ? "" : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
    bracketInner = bTerm + cTerm;
  }

  const displayLatex = `${outsideTerm}(${bracketInner})`;

  // Build answer LaTeX
  let answerTerms: { coeff: number; v: string; power: number }[];
  if (useVar) {
    if (outsidePower === 2) {
      answerTerms = [{ coeff: x3Coeff, v, power: 3 }, { coeff: x2Coeff, v, power: 2 }];
    } else {
      answerTerms = [{ coeff: x2Coeff, v, power: 2 }, { coeff: xCoeff, v, power: 1 }];
    }
  } else {
    answerTerms = [{ coeff: xCoeff, v, power: 1 }, { coeff: constant, v, power: 0 }];
  }
  const answerLatex = polyLatex(answerTerms);

  // Build working steps
  const working: AnyQuestion["working"] = [];

  if (useVar) {
    const outsideL = coeffLatex(a, v, outsidePower, true);
    const firstInner = coeffLatex(b, v, 1, true);
    const firstResult = outsidePower === 2
      ? coeffLatex(x3Coeff, v, 3, true)
      : coeffLatex(x2Coeff, v, 2, true);
    working.push(mStep("Multiply outside by first term:", `${outsideL} \\times ${firstInner} = ${firstResult}`));

    if (c !== 0) {
      const secondResult = outsidePower === 2
        ? coeffLatex(x2Coeff, v, 2, true)
        : coeffLatex(xCoeff, v, 1, true);
      working.push(mStep("Multiply outside by second term:", `${outsideL} \\times ${c > 0 ? c : `(${c})`} = ${secondResult}`));
    }
  } else {
    const firstInner = isReversed
      ? `${c}`
      : coeffLatex(b, v, 1, true);
    const firstResult = isReversed
      ? `${constant}`
      : coeffLatex(xCoeff, v, 1, true);
    working.push(mStep("Multiply outside by first term:", `${a} \\times ${firstInner} = ${firstResult}`));

    if (isReversed) {
      const secondInner = `-${coeffLatex(b, v, 1, true)}`;
      working.push(mStep("Multiply outside by second term:", `${a} \\times (${secondInner}) = ${coeffLatex(xCoeff, v, 1, true)}`));
    } else if (c !== 0) {
      working.push(mStep("Multiply outside by second term:", `${a} \\times ${c > 0 ? c : `(${c})`} = ${constant}`));
    }
  }

  working.push(mStep("Answer:", answerLatex));

  const id = Math.floor(Math.random() * 1_000_000);
  const key = `single-${level}-${a}-${b}-${c}-${useVar ? 1 : 0}-${outsidePower}-${v}-${id}`;

  return { displayLatex, answerLatex, working, key, v, xCoeff, constant, x2Coeff, x3Coeff };
};

// ── 6. Single bracket "expand and simplify" ──────────────────────────────────

const combinePoly = (
  c1: { x3: number; x2: number; x: number; c: number },
  c2: { x3: number; x2: number; x: number; c: number },
  op: "+" | "-",
): { x3: number; x2: number; x: number; c: number } => {
  const m = op === "+" ? 1 : -1;
  return {
    x3: c1.x3 + m * c2.x3,
    x2: c1.x2 + m * c2.x2,
    x: c1.x + m * c2.x,
    c: c1.c + m * c2.c,
  };
};

const genSingleExpandSimplify = (
  level: DifficultyLevel,
  multiplierType: string,
): { displayLatex: string; answerLatex: string; working: AnyQuestion["working"]; key: string; v: string } => {
  const v = pick(VARIABLES);
  const lvl1: DifficultyLevel = level === "level1" ? "level1" : level === "level2" ? "level1" : "level3";
  const lvl2: DifficultyLevel = level === "level1" ? "level1" : level === "level2" ? (Math.random() > 0.5 ? "level1" : "level2") : (Math.random() > 0.5 ? "level1" : "level2");

  const q1 = genSingleExpand(lvl1, multiplierType, v);
  const q2 = genSingleExpand(lvl2, multiplierType, v);

  const op: "+" | "-" = level === "level1" ? "+" : (Math.random() > 0.5 ? "+" : "-");
  const opLatex = op === "+" ? "+" : "-";

  const displayLatex = `${q1.displayLatex} ${opLatex} ${q2.displayLatex}`;

  const c1 = { x3: q1.x3Coeff, x2: q1.x2Coeff, x: q1.xCoeff, c: q1.constant };
  const c2 = { x3: q2.x3Coeff, x2: q2.x2Coeff, x: q2.xCoeff, c: q2.constant };
  const final = combinePoly(c1, c2, op);

  const answerTerms = [
    { coeff: final.x3, v, power: 3 },
    { coeff: final.x2, v, power: 2 },
    { coeff: final.x, v, power: 1 },
    { coeff: final.c, v, power: 0 },
  ];
  const answerLatex = polyLatex(answerTerms);

  const working: AnyQuestion["working"] = [];
  working.push(mStep("Expand first bracket:", `${q1.displayLatex} = ${q1.answerLatex}`));
  working.push(mStep("Expand second bracket:", `${q2.displayLatex} = ${q2.answerLatex}`));
  working.push(mStep("Combine:", `${q1.answerLatex} ${opLatex} (${q2.answerLatex})`));
  working.push(mStep("Simplify:", answerLatex));

  const id = Math.floor(Math.random() * 1_000_000);
  const key = `single-simplify-${level}-${q1.key}-${op}-${q2.key}-${id}`;

  return { displayLatex, answerLatex, working, key, v };
};

// ── 7. Double bracket generation ─────────────────────────────────────────────

const genDouble = (level: DifficultyLevel): { displayLatex: string; answerLatex: string; working: AnyQuestion["working"]; key: string } => {
  let a: number, b: number, c: number, d: number;

  if (level === "level1") {
    a = 1;
    b = randInt(1, 9);
    c = 1;
    d = randInt(1, 9);
  } else if (level === "level2") {
    a = 1;
    b = randInt(-9, 9); if (b === 0) b = 1;
    c = 1;
    d = randInt(-9, 9); if (d === 0) d = 1;
    if (b > 0 && d > 0) {
      if (Math.random() < 0.5) b = -b; else d = -d;
    }
  } else {
    a = randInt(1, 5);
    b = randInt(-7, 7); if (b === 0) b = 1;
    c = randInt(1, 5);
    d = randInt(-7, 7); if (d === 0) d = 1;
    if (Math.random() < 0.3) {
      if (Math.random() < 0.5) a = -a; else c = -c;
    }
  }

  const x2 = a * c;
  const x1 = a * d + b * c;
  const x0 = b * d;

  // First bracket
  const b1t1 = coeffLatex(a, "x", 1, true);
  const b1t2 = b > 0 ? `+ ${Math.abs(b)}` : `- ${Math.abs(b)}`;
  // Second bracket
  const b2t1 = coeffLatex(c, "x", 1, true);
  const b2t2 = d > 0 ? `+ ${Math.abs(d)}` : `- ${Math.abs(d)}`;

  const displayLatex = `(${b1t1} ${b1t2})(${b2t1} ${b2t2})`;

  const answerLatex = polyLatex([
    { coeff: x2, v: "x", power: 2 },
    { coeff: x1, v: "x", power: 1 },
    { coeff: x0, v: "x", power: 0 },
  ]);

  // Working: F O I L
  const first = a * c;
  const outer = a * d;
  const inner = b * c;
  const last = b * d;

  const working: AnyQuestion["working"] = [];
  working.push(mStep("First:", `${coeffLatex(a, "x", 1, true)} \\times ${coeffLatex(c, "x", 1, true)} = ${coeffLatex(first, "x", 2, true)}`));
  working.push(mStep("Outer:", `${coeffLatex(a, "x", 1, true)} \\times ${d > 0 ? d : `(${d})`} = ${coeffLatex(outer, "x", 1, true)}`));
  working.push(mStep("Inner:", `${b > 0 ? b : `(${b})`} \\times ${coeffLatex(c, "x", 1, true)} = ${coeffLatex(inner, "x", 1, true)}`));
  working.push(mStep("Last:", `${b > 0 ? b : `(${b})`} \\times ${d > 0 ? d : `(${d})`} = ${last}`));

  if (outer + inner !== outer || outer + inner !== inner) {
    working.push(mStep("Collect like terms:", `${coeffLatex(outer, "x", 1, true)} ${inner >= 0 ? "+" : "-"} ${Math.abs(inner)}x = ${coeffLatex(x1, "x", 1, true)}`));
  }

  working.push(mStep("Answer:", answerLatex));

  const id = Math.floor(Math.random() * 1_000_000);
  const key = `double-${level}-${a}-${b}-${c}-${d}-${id}`;

  return { displayLatex, answerLatex, working, key };
};

// ── 8. generateQuestion ──────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const t = tool as ToolType;

  if (t === "double") {
    const result = genDouble(level);
    return {
      kind: "simple",
      display: "",
      displayLatex: result.displayLatex,
      answer: "",
      answerLatex: result.answerLatex,
      working: result.working,
      key: result.key,
      difficulty: level,
    } as unknown as AnyQuestion;
  }

  // Single brackets
  const msv = multiSelectValues ?? {};
  const expandActive = msv["expand"] !== false;
  const simplifyActive = msv["expandSimplify"] === true;

  let doSimplify = false;
  if (expandActive && simplifyActive) {
    doSimplify = Math.random() > 0.5;
  } else if (simplifyActive) {
    doSimplify = true;
  }

  if (doSimplify) {
    const result = genSingleExpandSimplify(level, dropdownValue);
    return {
      kind: "simple",
      display: "",
      displayLatex: result.displayLatex,
      answer: "",
      answerLatex: result.answerLatex,
      working: result.working,
      key: result.key,
      difficulty: level,
    } as unknown as AnyQuestion;
  }

  const result = genSingleExpand(level, dropdownValue);
  return {
    kind: "simple",
    display: "",
    displayLatex: result.displayLatex,
    answer: "",
    answerLatex: result.answerLatex,
    working: result.working,
    key: result.key,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 9. Export ─────────────────────────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numQuestions: 15, numColumns: 3 }}
    />
  );
}
