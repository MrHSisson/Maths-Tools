import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type SimpleQuestion,
  type WordedQuestion,
  type WorkingStep,
  type ToolMultiSelect,
  MathRenderer,
  randInt, pick, mStep, tStep, pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TERM ENGINE — shared representation for algebraic terms across all 3 sub-tools
// ═══════════════════════════════════════════════════════════════════════════════

const VAR_POOL = ["x", "y", "c", "a", "w", "v", "m", "n", "s", "t", "k"];

interface VarPower { v: string; n: number; }
interface Term { coef: number; vars: VarPower[]; } // vars = [] → constant

const SUP: Record<number, string> = { 1: "", 2: "²", 3: "³", 4: "⁴", 5: "⁵" };

const varsKey = (vars: VarPower[]): string =>
  vars.length === 0 ? "const" : vars.map(vp => `${vp.v}^${vp.n}`).sort().join(",");

const totalPower = (vars: VarPower[]): number => vars.reduce((s, vp) => s + vp.n, 0);

// Absolute-value LaTeX body of a term, e.g. "5x^{2}", "x", "3x^{2}y", "7"
const termBody = (t: Term): string => {
  const abs = Math.abs(t.coef);
  if (t.vars.length === 0) return `${abs}`;
  const coefStr = abs === 1 ? "" : `${abs}`;
  const varsStr = t.vars.map(vp => (vp.n === 1 ? vp.v : `${vp.v}^{${vp.n}}`)).join("");
  return coefStr + varsStr;
};

// Standalone signed LaTeX, e.g. "-5x^{2}" or "3x" — for MCQ options/answers
const termSigned = (t: Term): string => (t.coef < 0 ? `-${termBody(t)}` : termBody(t));

// Plain-text signed representation using unicode superscripts, e.g. "-5x²"
const termPlain = (t: Term): string => {
  if (t.vars.length === 0) return `${t.coef}`;
  const abs = Math.abs(t.coef);
  const sign = t.coef < 0 ? "-" : "";
  const coefStr = abs === 1 ? "" : `${abs}`;
  const varsStr = t.vars.map(vp => vp.v + SUP[vp.n]).join("");
  return sign + coefStr + varsStr;
};

// Builds a full expression from an ordered list of terms, e.g. "4x^{2} + 3x - x^{2}"
const exprLatex = (terms: Term[]): string =>
  terms.map((t, i) => {
    const body = termBody(t);
    if (i === 0) return t.coef < 0 ? `-${body}` : body;
    return t.coef < 0 ? `- ${body}` : `+ ${body}`;
  }).join(" ");

const groupTerms = (terms: Term[]): Term[] => {
  const map = new Map<string, Term>();
  const order: string[] = [];
  for (const t of terms) {
    const k = varsKey(t.vars);
    if (!map.has(k)) { map.set(k, { coef: 0, vars: t.vars }); order.push(k); }
    map.get(k)!.coef += t.coef;
  }
  return order.map(k => map.get(k)!);
};

// Groups terms by variable (varOrder[0] first, then varOrder[1], constants last),
// and within each variable by descending power. Drops zero-coefficient groups.
const sortedGroups = (terms: Term[], varOrder: string[]): Term[] => {
  const groups = groupTerms(terms).filter(t => t.coef !== 0);
  return groups.sort((a, b) => {
    const ia = a.vars.length ? varOrder.indexOf(a.vars[0].v) : varOrder.length;
    const ib = b.vars.length ? varOrder.indexOf(b.vars[0].v) : varOrder.length;
    if (ia !== ib) return ia - ib;
    return totalPower(b.vars) - totalPower(a.vars);
  });
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Reads a multiSelect "pool" entry as an independent on/off flag (undefined → on)
const isOn = (vals: Record<string, boolean>, key: string): boolean => vals[key] !== false;

// ── Coefficient generators ──────────────────────────────────────────────────

// Seeded "headline" group — sign pattern driven by the subtractionCases choice.
const genMainCoeffs = (count: number, caseType: string, minMag: number, maxMag: number): number[] => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const coeffs: number[] = [];
    for (let i = 0; i < count; i++) {
      const mag = randInt(minMag, maxMag);
      const sign = (caseType === "positiveOnly" || i === 0) ? 1 : (Math.random() < 0.5 ? 1 : -1);
      coeffs.push(sign * mag);
    }
    if (caseType !== "positiveOnly" && !coeffs.some(c => c < 0)) continue;
    const sum = coeffs.reduce((s, c) => s + c, 0);
    if (sum === 0) continue;
    if (caseType === "crossingZero" ? sum >= 0 : sum <= 0) continue;
    if (count > 1 && new Set(coeffs).size === 1) continue;
    return coeffs;
  }
  return caseType === "crossingZero"
    ? Array.from({ length: count }, (_, i) => (i === 0 ? 3 : -5))
    : Array.from({ length: count }, (_, i) => (i === 0 ? 3 : 2));
};

// Free-running secondary group — only needs a non-zero, non-uniform sum.
const genFreeCoeffs = (count: number, minMag: number, maxMag: number, allowNegative: boolean): number[] => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const coeffs = Array.from({ length: count }, () => {
      const mag = randInt(minMag, maxMag);
      return allowNegative && Math.random() < 0.5 ? -mag : mag;
    });
    const sum = coeffs.reduce((s, c) => s + c, 0);
    if (sum === 0) continue;
    if (count > 1 && new Set(coeffs).size === 1) continue;
    return coeffs;
  }
  return Array.from({ length: count }, () => randInt(minMag, maxMag));
};

const genSingleCoeff = (caseType: string, minMag: number, maxMag: number): number => {
  const mag = randInt(minMag, maxMag);
  return caseType === "positiveOnly" ? mag : (Math.random() < 0.5 ? 1 : -1) * mag;
};

// ── Colour-underline working step (Sub-tools 2 & 3) ──────────────────────────

interface UnderlineSegment { latex: string; color: number; }

const UNDERLINE_COLORS = ["#2563eb", "#16a34a", "#dc2626"]; // blue, green, red

const buildUnderlineSegments = (terms: Term[], colorMap: Map<string, number>): UnderlineSegment[] =>
  terms.map((t, i) => {
    const body = termBody(t);
    const latex = i === 0 ? (t.coef < 0 ? `-${body}` : body) : (t.coef < 0 ? `- ${body}` : `+ ${body}`);
    return { latex, color: colorMap.get(varsKey(t.vars)) ?? 0 };
  });

const underlineStep = (segments: UnderlineSegment[], text: string): WorkingStep => ({
  type: "underline",
  latex: segments.map(s => s.latex).join(" "),
  plain: text,
  extra: { segments, text },
});

const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  const extra = s.extra as { segments?: UnderlineSegment[]; text?: string } | undefined;
  if (!extra?.segments) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "0.6em" }}>{extra.text}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.4em", flexWrap: "wrap" }}>
        {extra.segments.map((seg, i) => (
          <span key={i} style={{ borderBottom: `3px solid ${UNDERLINE_COLORS[seg.color % UNDERLINE_COLORS.length]}`, paddingBottom: "2px" }}>
            <MathRenderer latex={seg.latex} />
          </span>
        ))}
      </div>
    </div>
  );
};

// Plain-text label for prose (mStep label / tStep) — uses unicode superscripts,
// no caret, so it is safe inside the plain-text/tStep path. e.g. "x", "x²".
const groupLabelPlain = (vars: VarPower[]): string => {
  if (vars.length === 0) return "constant";
  const vp = vars[0];
  return vp.v + SUP[vp.n];
};

const underlineIntro = (groupCount: number, variableWords: boolean): string => {
  if (groupCount <= 1) return "Underline the like terms — they all share the same variable and power.";
  if (groupCount === 2) {
    return variableWords
      ? "Underline the like terms — use a different colour for each variable."
      : "Underline the like terms — use one colour for each term type.";
  }
  return "Underline the like terms — a different colour for each term type.";
};

// Shared worked-example builder for Sub-tools 2 & 3: underline step, then a
// "Collect the ... terms" mStep for every group with ≥2 original terms, a
// "cannot be collected" tStep for singletons, then the final Answer step.
const buildCollectWorkingSteps = (allTerms: Term[], varOrder: string[], variableWords: boolean): WorkingStep[] => {
  const groups = sortedGroups(allTerms, varOrder);
  const colorMap = new Map<string, number>();
  groups.forEach((g, i) => colorMap.set(varsKey(g.vars), i));

  const segments = buildUnderlineSegments(allTerms, colorMap);
  const steps: WorkingStep[] = [underlineStep(segments, underlineIntro(groups.length, variableWords))];

  for (const g of groups) {
    const originals = allTerms.filter(t => varsKey(t.vars) === varsKey(g.vars));
    const labelPlain = groupLabelPlain(g.vars);
    if (originals.length >= 2) {
      steps.push(mStep(`Collect the ${labelPlain} terms:`, `${exprLatex(originals)} = ${termSigned(g)}`));
    } else if (g.vars.length === 0) {
      steps.push(tStep(`The constant ${termPlain(originals[0])} cannot be collected — it has no variable.`));
    } else {
      steps.push(tStep(`The ${labelPlain} term cannot be collected — there is only one.`));
    }
  }

  steps.push(mStep("Answer:", exprLatex(groups)));
  return steps;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL_CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "subtool1" | "subtool2" | "subtool3";

const QUESTION_POOL: ToolMultiSelect = {
  key: "questionPool",
  label: "Question Types",
  options: [
    { value: "singleVar", label: "Single variable terms", defaultActive: true },
    { value: "withPowers", label: "Include squared and higher powers", defaultActive: true },
    { value: "withConstants", label: "Include constants as distractors", defaultActive: true },
  ],
};

const QUESTION_POOL_L3: ToolMultiSelect = {
  key: "questionPool",
  label: "Question Types",
  options: [
    ...QUESTION_POOL.options,
    { value: "twoVariableTargets", label: "Two-variable target terms", defaultActive: false },
  ],
};

const SUBTRACTION_GROUP: ToolMultiSelect = {
  key: "subtractionCases",
  label: "Question Types",
  options: [
    { value: "positiveOnly", label: "Positive terms only", defaultActive: true },
    { value: "subtractionPositive", label: "Subtraction (positive result)", defaultActive: false },
    { value: "crossingZero", label: "Crossing zero (negative result)", defaultActive: false },
  ],
};

const SUBTRACTION_GROUP_L3: ToolMultiSelect = {
  key: "subtractionCases",
  label: "Question Types",
  options: [
    { value: "positiveOnly", label: "Positive terms only", defaultActive: false },
    { value: "subtractionPositive", label: "Subtraction (positive result)", defaultActive: true },
    { value: "crossingZero", label: "Crossing zero (negative result)", defaultActive: true },
  ],
};

const TERM_OPTIONS2_L1: ToolMultiSelect = {
  key: "termOptions",
  label: "Term Options",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + x + x...)", defaultActive: false },
  ],
};

const TERM_OPTIONS2_L2: ToolMultiSelect = {
  key: "termOptions",
  label: "Term Options",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + x + x...)", defaultActive: false },
    { value: "includeConstant", label: "Include a constant term", defaultActive: false },
    { value: "includeSquare", label: "Include an x² term", defaultActive: false },
  ],
};

const TERM_OPTIONS2_L3: ToolMultiSelect = {
  key: "termOptions",
  label: "Term Options",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + x + x...)", defaultActive: false },
    { value: "includeConstant", label: "Include a constant term", defaultActive: true },
    { value: "includeSquare", label: "Include an x² term", defaultActive: true },
  ],
};

const TERM_OPTIONS3_L1: ToolMultiSelect = {
  key: "termOptions",
  label: "Extra Term Types",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + y + x...)", defaultActive: false },
  ],
};

const TERM_OPTIONS3_L2: ToolMultiSelect = {
  key: "termOptions",
  label: "Extra Term Types",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + y + x...)", defaultActive: false },
    { value: "includeConstant", label: "Include a constant term", defaultActive: false },
    { value: "includeSquare", label: "Include squared terms", defaultActive: false },
  ],
};

const TERM_OPTIONS3_L3: ToolMultiSelect = {
  key: "termOptions",
  label: "Extra Term Types",
  options: [
    { value: "noCoefficients", label: "No coefficients (x + y + x...)", defaultActive: false },
    { value: "includeConstant", label: "Include a constant term", defaultActive: true },
    { value: "includeSquare", label: "Include squared terms", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Collecting Like Terms",

  tools: {
    subtool1: {
      name: "Spot the Like Term",
      variables: [],
      dropdown: null,
      multiSelect: QUESTION_POOL,
      difficultySettings: {
        level3: { multiSelect: QUESTION_POOL_L3 },
      },
    },

    subtool2: {
      name: "Single Variable",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS2_L2],
      difficultySettings: {
        level1: { multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS2_L1] },
        level2: { multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS2_L2] },
        level3: { multiSelect: [SUBTRACTION_GROUP_L3, TERM_OPTIONS2_L3] },
      },
    },

    subtool3: {
      name: "Multiple Variables",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS3_L2],
      difficultySettings: {
        level1: { multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS3_L1] },
        level2: { multiSelect: [SUBTRACTION_GROUP, TERM_OPTIONS3_L2] },
        level3: { multiSelect: [SUBTRACTION_GROUP_L3, TERM_OPTIONS3_L3] },
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFO_SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  { title: "Spot the Like Term", icon: "🔍", content: [
    { label: "Overview", detail: "Students are shown a target term and must identify which option(s) are like terms. Like terms must share both the same variable and the same power — the coefficient is irrelevant to term type." },
    { label: "Level 1 — Green", detail: "Single-variable target terms with powers 1–5. Exactly one correct answer. Each distractor is wrong on a single criterion (variable or power), with a wild card wrong on both." },
    { label: "Level 2 — Yellow", detail: "Negative coefficients introduced. Near misses echo the target's coefficient magnitude (with varying sign) to maximise the trap for students who fixate on the number. Exactly one correct answer." },
    { label: "Level 3 — Red", detail: "Five options with zero, one, or two correct answers — always flagged in the instruction line. Optional two-variable target terms. Includes commutativity traps (e.g. yx² as a like term of x²y)." },
  ]},
  { title: "Single Variable", icon: "🔤", content: [
    { label: "Overview", detail: "Students simplify expressions by collecting all like terms. Worked examples show colour-coded underlines grouping each term type before collecting." },
    { label: "Level 1 — Green", detail: "Single variable, powers of 1 only, 2–4 terms. No coefficients mode available for pure x + x + x style practice up to 8 terms. Subtraction and crossing zero are QO options." },
    { label: "Level 2 — Yellow", detail: "Introduces constants and x² terms as optional QO toggles, each acting as uncollectable terms students must leave in the answer. Subtraction and crossing zero available." },
    { label: "Level 3 — Red", detail: "Expressions with x, x², x³ and constants mixed together. At least one collectable pair always guaranteed. Students must sort, collect each group, and order the answer by descending power." },
  ]},
  { title: "Multiple Variables", icon: "🔡", content: [
    { label: "Overview", detail: "Students simplify expressions containing two distinct variables. Both variables are always present in every question — students must identify and collect each variable group independently." },
    { label: "Level 1 — Green", detail: "Exactly two variables, powers of 1, positive coefficients (unless subtraction options active). At least one collectable pair guaranteed. No coefficients mode available." },
    { label: "Level 2 — Yellow", detail: "Adds optional constants and squared terms as extra uncollectable or separately-collectable types. Subtraction and crossing zero available as QO options." },
    { label: "Level 3 — Red", detail: "Both variables always have a collectable pair — students collect two groups simultaneously. Squared terms for both variables optional. Subtraction and crossing zero defaultActive." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand, including colour-coded underlines for Sub-tools 2 and 3." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Question Types", detail: "Toggle which kinds of target terms, powers and distractors appear (Spot the Like Term), or which subtraction cases and extra term types appear (Single/Multiple Variables)." },
    { label: "Differentiated", detail: "QO popover shows all three levels so each column can be customised independently." },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 1 — Spot the Like Term (worded MCQ)
// ═══════════════════════════════════════════════════════════════════════════════

const LETTERS = ["A", "B", "C", "D", "E"];

interface MCQOption { term: Term; correct: boolean; explain: string; }

const finishMCQ = (level: DifficultyLevel, target: Term, opts: MCQOption[], introText: string, key: string): WordedQuestion => {
  const shuffled = shuffle(opts);
  const targetLatex = termSigned(target);
  const introLine = level === "level3"
    ? `Circle any like terms — there may be zero. Target: $${targetLatex}$`
    : `Circle the like term: $${targetLatex}$`;
  const optionLines = shuffled.map((o, i) => `${LETTERS[i]}) $${termSigned(o.term)}$`);

  const working: WorkingStep[] = [tStep(introText)];
  shuffled.forEach(o => {
    working.push(mStep("Check:", termSigned(o.term)));
    working.push(tStep(o.explain));
  });

  const correctOnes = shuffled.filter(o => o.correct);
  if (correctOnes.length === 0) {
    working.push(mStep("Answer:", "\\text{None of these}"));
  } else if (correctOnes.length === 1) {
    working.push(mStep("Answer:", termSigned(correctOnes[0].term)));
  } else {
    working.push(mStep("Answer:", correctOnes.map(o => termSigned(o.term)).join(" \\text{ and } ")));
  }

  const answer = correctOnes.length === 0
    ? "None of these"
    : correctOnes.map(o => `${LETTERS[shuffled.indexOf(o)]} (${termPlain(o.term)})`).join(" and ");

  return {
    kind: "worded",
    lines: [introLine, ...optionLines],
    answer,
    working,
    key,
    difficulty: level,
  };
};

const buildL1 = (maxPower: number, withConstants: boolean, id: number): WordedQuestion => {
  const v = pick(VAR_POOL);
  const n = randInt(1, maxPower);
  const a = randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v, n }] };

  let trueCoef = randInt(2, 9);
  while (trueCoef === a) trueCoef = randInt(2, 9);
  const trueLike: Term = { coef: trueCoef, vars: [{ v, n }] };

  const usedVars = new Set([v]);
  const usedPowers = new Set([n]);
  const pickVar = () => { const c = pick(VAR_POOL.filter(x => !usedVars.has(x))); usedVars.add(c); return c; };
  const pickPower = () => { const c = pick([1, 2, 3, 4, 5].filter(p => !usedPowers.has(p))); usedPowers.add(c); return c; };
  const offCoef = () => { let c = randInt(2, 9); while (c === a) c = randInt(2, 9); return c; };

  const types = shuffle(["A", "B", "C"] as const).slice(0, 2);
  const opts: MCQOption[] = [
    { term: trueLike, correct: true, explain: `Same variable ${v}, same power ${n} — this IS a like term ✓` },
  ];

  for (const ty of types) {
    if (ty === "A") {
      const dv = pickVar(), dn = pickPower();
      opts.push({ term: { coef: a, vars: [{ v: dv, n: dn }] }, correct: false,
        explain: `Same coefficient ${a}, but different variable and power — not a like term ✗` });
    } else if (ty === "B") {
      const dn = pickPower();
      opts.push({ term: { coef: offCoef(), vars: [{ v, n: dn }] }, correct: false,
        explain: `Same variable ${v}, but power is ${dn} not ${n} — different power, not a like term ✗` });
    } else {
      if (withConstants && n === 1 && Math.random() < 0.4) {
        opts.push({ term: { coef: offCoef(), vars: [] }, correct: false,
          explain: "No variable — a constant, not a like term ✗" });
      } else {
        const dv = pickVar();
        opts.push({ term: { coef: offCoef(), vars: [{ v: dv, n }] }, correct: false,
          explain: `Same power ${n}, but different variable — not a like term ✗` });
      }
    }
  }

  if (withConstants && Math.random() < 0.3) {
    opts.push({ term: { coef: offCoef(), vars: [] }, correct: false,
      explain: "No variable — a constant, not a like term ✗" });
  } else {
    const dv = pickVar(), dn = pickPower();
    opts.push({ term: { coef: offCoef(), vars: [{ v: dv, n: dn }] }, correct: false,
      explain: "Different variable and different power — not a like term ✗" });
  }

  return finishMCQ("level1", target, opts,
    "Check each option — a like term must share the same variable AND the same power.",
    `t1-L1-${v}${n}-${a}-${id}`);
};

const buildL2 = (maxPower: number, withConstants: boolean, id: number): WordedQuestion => {
  const v = pick(VAR_POOL);
  const n = randInt(1, maxPower);
  const a = randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v, n }] };

  let trueCoef = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  while (trueCoef === a) trueCoef = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  const trueLike: Term = { coef: trueCoef, vars: [{ v, n }] };
  const trueExplain = trueCoef < 0
    ? `Same variable ${v}, same power ${n}. The negative sign does not change the term type — this IS a like term ✓`
    : `Same variable ${v}, same power ${n} — this IS a like term ✓`;

  const candA = [n - 1, n + 1].filter(p => p >= 1 && p <= 5);
  const nmaPower = pick(candA.length ? candA : [1, 2, 3, 4, 5].filter(p => p !== n));
  const nearMissA: Term = { coef: (Math.random() < 0.5 ? 1 : -1) * a, vars: [{ v, n: nmaPower }] };

  const nmbVar = pick(VAR_POOL.filter(x => x !== v));
  const nearMissB: Term = { coef: (Math.random() < 0.5 ? 1 : -1) * a, vars: [{ v: nmbVar, n }] };

  let wild: Term;
  let wildExplain: string;
  if (withConstants && Math.random() < 0.5) {
    wild = { coef: (Math.random() < 0.5 ? 1 : -1) * a, vars: [] };
    wildExplain = "No variable — a constant, not a like term ✗";
  } else {
    const wv = pick(VAR_POOL.filter(x => x !== v && x !== nmbVar));
    wild = { coef: (Math.random() < 0.5 ? 1 : -1) * a, vars: [{ v, n: 1 }, { v: wv, n: 1 }] };
    wildExplain = "Two variables present — not a like term ✗";
  }

  const opts: MCQOption[] = [
    { term: trueLike, correct: true, explain: trueExplain },
    { term: nearMissA, correct: false,
      explain: `Same variable ${v}, same coefficient magnitude, but power is ${nmaPower} not ${n} — different power, not a like term ✗` },
    { term: nearMissB, correct: false,
      explain: `Same power ${n}, same coefficient magnitude, but different variable — not a like term ✗` },
    { term: wild, correct: false, explain: wildExplain },
  ];

  return finishMCQ("level2", target, opts,
    "Check each option — same variable AND same power required. Sign does not affect term type.",
    `t1-L2-${v}${n}-${a}-${id}`);
};

const singleVarDistractor = (target: Term, idx: number): MCQOption => {
  const v = target.vars[0].v, n = target.vars[0].n, a = target.coef;
  const type = idx % 4;
  if (type === 0) {
    let dn = randInt(1, 5); while (dn === n) dn = randInt(1, 5);
    const coef = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
    return { term: { coef, vars: [{ v, n: dn }] }, correct: false,
      explain: `Same variable ${v}, but power is ${dn} not ${n} — different power, not a like term ✗` };
  }
  if (type === 1) {
    const dv = pick(VAR_POOL.filter(x => x !== v));
    const coef = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
    return { term: { coef, vars: [{ v: dv, n }] }, correct: false,
      explain: `Same power ${n}, but different variable — not a like term ✗` };
  }
  if (type === 2) {
    const coef = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
    return { term: { coef, vars: [] }, correct: false, explain: "No variable — a constant, not a like term ✗" };
  }
  const dv = pick(VAR_POOL.filter(x => x !== v));
  let dn = randInt(1, 5); while (dn === n) dn = randInt(1, 5);
  const sign = Math.random() < 0.5 ? 1 : -1;
  return { term: { coef: sign * Math.abs(a), vars: [{ v: dv, n: dn }] }, correct: false,
    explain: "Same coefficient size as the target, but different variable and power — not a like term ✗" };
};

const buildL3SingleVar = (maxPower: number, id: number): WordedQuestion => {
  const v = pick(VAR_POOL);
  const n = randInt(1, maxPower);
  const a = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v, n }] };

  const numCorrect = pick([0, 1, 1, 2]);
  const opts: MCQOption[] = [];
  const termSig = (t: Term) => `${t.coef}|${varsKey(t.vars)}`;
  const seen = new Set<string>([termSig(target)]);

  const correctExplain = (coef: number) => coef < 0
    ? `Same variable ${v}, same power ${n}. Negative sign does not change the term type — this IS a like term ✓`
    : `Same variable ${v}, same power ${n} — this IS a like term ✓`;

  for (let c = 0; c < numCorrect; c++) {
    let coef = randInt(2, 9) * (Math.random() < 0.5 ? 1 : -1);
    let guard = 0;
    while (seen.has(termSig({ coef, vars: [{ v, n }] })) && guard < 30) { coef = randInt(2, 9) * (Math.random() < 0.5 ? 1 : -1); guard++; }
    const term: Term = { coef, vars: [{ v, n }] };
    seen.add(termSig(term));
    opts.push({ term, correct: true, explain: correctExplain(coef) });
  }

  let guard = 0;
  while (opts.length < 5 && guard < 200) {
    guard++;
    const d = singleVarDistractor(target, opts.length);
    const sig = termSig(d.term);
    if (seen.has(sig)) continue;
    seen.add(sig);
    opts.push(d);
  }

  return finishMCQ("level3", target, opts,
    "Check each option — there may be zero like terms or more than one. Sign does not affect term type.",
    `t1-L3sv-${v}${n}-${a}-${numCorrect}-${id}`);
};

const buildL3TwoVar = (id: number): WordedQuestion => {
  const [varA, varB] = shuffle(VAR_POOL).slice(0, 2);
  const powA = randInt(1, 3);
  const powB = randInt(1, 5 - powA);
  const a = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v: varA, n: powA }, { v: varB, n: powB }] };

  const randCoef = () => randInt(2, 9) * (Math.random() < 0.5 ? 1 : -1);

  let trueCoef = randCoef();
  while (trueCoef === a) trueCoef = randCoef();
  const trueLike: Term = { coef: trueCoef, vars: [{ v: varA, n: powA }, { v: varB, n: powB }] };
  const commTrap: Term = { coef: randCoef(), vars: [{ v: varB, n: powB }, { v: varA, n: powA }] };

  const nudges: [number, number][] = [];
  if (powA + 1 + powB <= 5) nudges.push([powA + 1, powB]);
  if (powA - 1 >= 1) nudges.push([powA - 1, powB]);
  if (powA + powB + 1 <= 5) nudges.push([powA, powB + 1]);
  if (powB - 1 >= 1) nudges.push([powA, powB - 1]);
  const [naA, naB] = pick(nudges);
  const nearMissA: Term = { coef: randCoef(), vars: [{ v: varA, n: naA }, { v: varB, n: naB }] };

  const z = pick(VAR_POOL.filter(x => x !== varA && x !== varB));
  const replaceA = Math.random() < 0.5;
  const nearMissB: Term = replaceA
    ? { coef: randCoef(), vars: [{ v: z, n: powA }, { v: varB, n: powB }] }
    : { coef: randCoef(), vars: [{ v: varA, n: powA }, { v: z, n: powB }] };

  const wcVar = Math.random() < 0.5 ? varA : varB;
  const wcPow = wcVar === varA ? powA : powB;
  const wildcard: Term = { coef: randCoef(), vars: [{ v: wcVar, n: wcPow }] };

  const trueExplain = "Same variables and same powers — this IS a like term ✓";
  const commExplain = `Variables are ${varB} and ${varA} in a different order — variable order does not matter. Same powers — this IS a like term ✓`;
  const naExplain = naA !== powA
    ? `Same variables, but the power of ${varA} is ${naA} not ${powA} — different power, not a like term ✗`
    : `Same variables, but the power of ${varB} is ${naB} not ${powB} — different power, not a like term ✗`;
  const nbExplain = replaceA
    ? `Power of ${varB} matches, but ${z} is not the same as ${varA} — different variable, not a like term ✗`
    : `Power of ${varA} matches, but ${z} is not the same as ${varB} — different variable, not a like term ✗`;
  const wcExplain = `Only one variable — missing ${wcVar === varA ? varB : varA} entirely, not a like term ✗`;

  const numCorrect = pick([0, 1, 1, 2]);
  const opts: MCQOption[] = [];
  const z2 = pick(VAR_POOL.filter(x => x !== varA && x !== varB && x !== z));
  const extraDistractor: MCQOption = {
    term: { coef: randCoef(), vars: [{ v: z2, n: powA }, { v: varB, n: powB }] }, correct: false,
    explain: "Different variable from the target — not a like term ✗",
  };

  if (numCorrect === 2) {
    opts.push({ term: trueLike, correct: true, explain: trueExplain });
    opts.push({ term: commTrap, correct: true, explain: commExplain });
    opts.push({ term: nearMissA, correct: false, explain: naExplain });
    opts.push({ term: nearMissB, correct: false, explain: nbExplain });
    opts.push({ term: wildcard, correct: false, explain: wcExplain });
  } else if (numCorrect === 1) {
    if (Math.random() < 0.5) opts.push({ term: trueLike, correct: true, explain: trueExplain });
    else opts.push({ term: commTrap, correct: true, explain: commExplain });
    opts.push({ term: nearMissA, correct: false, explain: naExplain });
    opts.push({ term: nearMissB, correct: false, explain: nbExplain });
    opts.push({ term: wildcard, correct: false, explain: wcExplain });
    opts.push(extraDistractor);
  } else {
    opts.push({ term: nearMissA, correct: false, explain: naExplain });
    opts.push({ term: nearMissB, correct: false, explain: nbExplain });
    opts.push({ term: wildcard, correct: false, explain: wcExplain });
    opts.push(extraDistractor);
    opts.push({ term: { coef: randCoef(), vars: [] }, correct: false, explain: "No variable — a constant, not a like term ✗" });
  }

  const intro = "Check each option — every variable and every power must match. Variable order does not matter. There may be zero like terms.";
  return finishMCQ("level3", target, opts, intro, `t1-L3tv-${varA}${powA}${varB}${powB}-${a}-${numCorrect}-${id}`);
};

const genSubtool1 = (level: DifficultyLevel, msv: Record<string, boolean>): WordedQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);
  const withPowers = isOn(msv, "withPowers");
  const withConstants = isOn(msv, "withConstants");
  const maxPower = withPowers ? 5 : 1;

  if (level === "level1") return buildL1(maxPower, withConstants, id);
  if (level === "level2") return buildL2(maxPower, withConstants, id);
  const twoVar = isOn(msv, "twoVariableTargets") && Math.random() < 0.5;
  return twoVar ? buildL3TwoVar(id) : buildL3SingleVar(maxPower, id);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 2 — Single Variable
// ═══════════════════════════════════════════════════════════════════════════════

// Assembles a SimpleQuestion from a raw (unsorted) term list. Shuffles display
// order, then builds display / answer / working via the shared helpers.
const buildCollectQuestion = (
  level: DifficultyLevel,
  rawTerms: Term[],
  varOrder: string[],
  variableWords: boolean,
  keyPrefix: string,
): SimpleQuestion => {
  const terms = shuffle(rawTerms);
  const groups = sortedGroups(terms, varOrder);
  const id = Math.floor(Math.random() * 1_000_000);
  const termSig = terms.map(t => `${t.coef}:${varsKey(t.vars)}`).join("|");
  return {
    kind: "simple",
    display: exprLatex(terms),
    displayLatex: exprLatex(terms),
    answer: groups.map(termPlain).join(" "),
    answerLatex: exprLatex(groups),
    working: buildCollectWorkingSteps(terms, varOrder, variableWords),
    key: `${keyPrefix}-${termSig}-${id}`,
    difficulty: level,
  };
};

const genSubtool2 = (level: DifficultyLevel, msv: Record<string, boolean>): SimpleQuestion => {
  const v = pick(VAR_POOL);
  const caseType = pickActive(msv, SUBTRACTION_GROUP.options);
  const noCoef = isOn(msv, "noCoefficients");

  if (level === "level1") {
    // One group: all power-1 terms in v.
    if (noCoef) {
      const count = randInt(2, 8);
      const coeffs = genMainCoeffs(count, caseType, 1, 1);
      const terms = coeffs.map(c => ({ coef: c, vars: [{ v, n: 1 }] }));
      return buildCollectQuestion(level, terms, [v], false, `t2-L1nc-${v}`);
    }
    const count = randInt(2, 4);
    const coeffs = genMainCoeffs(count, caseType, 1, 9);
    const terms = coeffs.map(c => ({ coef: c, vars: [{ v, n: 1 }] }));
    return buildCollectQuestion(level, terms, [v], false, `t2-L1-${v}`);
  }

  if (level === "level2") {
    // Main collectable x group (power 1) + optional singleton constant / x^2.
    const minMag = noCoef ? 1 : 2;
    const maxMag = noCoef ? 1 : 9;
    const count = randInt(2, 4);
    const coeffs = genMainCoeffs(count, caseType, minMag, maxMag);
    const terms: Term[] = coeffs.map(c => ({ coef: c, vars: [{ v, n: 1 }] }));
    if (isOn(msv, "includeConstant")) {
      terms.push({ coef: genSingleCoeff(caseType, 2, 9), vars: [] });
    }
    if (isOn(msv, "includeSquare")) {
      terms.push({ coef: genSingleCoeff(caseType, 2, 9), vars: [{ v, n: 2 }] });
    }
    return buildCollectQuestion(level, terms, [v], false, `t2-L2-${v}`);
  }

  // level3 — seed a guaranteed collectable pair, add unlike singletons.
  const minMag = noCoef ? 1 : 2;
  const maxMag = noCoef ? 1 : 9;
  const includeConstant = isOn(msv, "includeConstant");
  const includeSquare = isOn(msv, "includeSquare");

  // Pick the power for the seeded collectable pair, and the pool of "extra" types.
  const powerPool = includeSquare ? [1, 2, 3] : [1, 3];
  const seedPower = pick(powerPool);
  const seedCoeffs = genMainCoeffs(2, caseType, minMag, maxMag);
  const terms: Term[] = seedCoeffs.map(c => ({ coef: c, vars: [{ v, n: seedPower }] }));

  // Candidate extra term types (distinct from the seeded power), each a singleton.
  const extraTypes: VarPower[][] = [];
  for (const p of powerPool) if (p !== seedPower) extraTypes.push([{ v, n: p }]);
  if (includeConstant) extraTypes.push([]);
  const shuffledExtras = shuffle(extraTypes);

  const numExtra = randInt(1, Math.min(3, shuffledExtras.length || 1));
  for (let i = 0; i < numExtra && i < shuffledExtras.length; i++) {
    terms.push({ coef: genSingleCoeff(caseType, minMag, maxMag), vars: shuffledExtras[i] });
  }
  // Guarantee at least 3 terms total and at least 2 distinct term types.
  if (terms.length < 3) {
    terms.push({ coef: genSingleCoeff(caseType, minMag, maxMag), vars: [{ v, n: seedPower === 1 ? 2 : 1 }] });
  }
  return buildCollectQuestion(level, terms, [v], false, `t2-L3-${v}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 3 — Multiple Variables (two distinct variables, univariate terms)
// ═══════════════════════════════════════════════════════════════════════════════

const genSubtool3 = (level: DifficultyLevel, msv: Record<string, boolean>): SimpleQuestion => {
  const [varA, varB] = shuffle(VAR_POOL).slice(0, 2);
  const varOrder = [varA, varB];
  const caseType = pickActive(msv, SUBTRACTION_GROUP.options);
  const noCoef = isOn(msv, "noCoefficients");

  if (level === "level1") {
    // Power-1 both vars; varA has a collectable pair, varB present (>=1).
    if (noCoef) {
      const total = randInt(4, 8);
      const countA = randInt(2, total - 1);
      const countB = total - countA;
      const aCoeffs = genMainCoeffs(countA, caseType, 1, 1);
      const bCoeffs = genFreeCoeffs(countB, 1, 1, caseType !== "positiveOnly");
      const terms: Term[] = [
        ...aCoeffs.map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] })),
        ...bCoeffs.map(c => ({ coef: c, vars: [{ v: varB, n: 1 }] })),
      ];
      return buildCollectQuestion(level, terms, varOrder, true, `t3-L1nc-${varA}${varB}`);
    }
    const total = randInt(3, 4);
    const countA = randInt(2, total - 1);
    const countB = total - countA;
    const aCoeffs = genMainCoeffs(countA, caseType, 2, 9);
    const bCoeffs = countB === 1
      ? [genSingleCoeff(caseType, 2, 9)]
      : genFreeCoeffs(countB, 2, 9, caseType !== "positiveOnly");
    const terms: Term[] = [
      ...aCoeffs.map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] })),
      ...bCoeffs.map(c => ({ coef: c, vars: [{ v: varB, n: 1 }] })),
    ];
    return buildCollectQuestion(level, terms, varOrder, true, `t3-L1-${varA}${varB}`);
  }

  if (level === "level2") {
    // Collectable pair in varA, varB present (>=1), optional constant / squared.
    const minMag = noCoef ? 1 : 2;
    const maxMag = noCoef ? 1 : 9;
    const countA = randInt(2, 3);
    const aCoeffs = genMainCoeffs(countA, caseType, minMag, maxMag);
    const terms: Term[] = aCoeffs.map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] }));
    terms.push({ coef: genSingleCoeff(caseType, minMag, maxMag), vars: [{ v: varB, n: 1 }] });
    if (isOn(msv, "includeConstant")) {
      terms.push({ coef: genSingleCoeff(caseType, 2, 9), vars: [] });
    }
    if (isOn(msv, "includeSquare")) {
      const sqVar = Math.random() < 0.5 ? varA : varB;
      terms.push({ coef: genSingleCoeff(caseType, 2, 9), vars: [{ v: sqVar, n: 2 }] });
    }
    return buildCollectQuestion(level, terms, varOrder, true, `t3-L2-${varA}${varB}`);
  }

  // level3 — BOTH vars have a collectable pair. Powers 1–2 (univariate terms).
  const minMag = noCoef ? 1 : 2;
  const maxMag = noCoef ? 1 : 9;
  const includeSquare = isOn(msv, "includeSquare");
  const includeConstant = isOn(msv, "includeConstant");

  // Choose a power for each variable's seeded pair (1 or 2 if squares allowed).
  const powA = includeSquare && Math.random() < 0.5 ? 2 : 1;
  const powB = includeSquare && Math.random() < 0.5 ? 2 : 1;
  const aCoeffs = genMainCoeffs(2, caseType, minMag, maxMag);
  const bCoeffs = genFreeCoeffs(2, minMag, maxMag, caseType !== "positiveOnly");
  const terms: Term[] = [
    ...aCoeffs.map(c => ({ coef: c, vars: [{ v: varA, n: powA }] })),
    ...bCoeffs.map(c => ({ coef: c, vars: [{ v: varB, n: powB }] })),
  ];

  // Optional extras (singletons) up to a total of 6 terms.
  const extras: VarPower[][] = [];
  if (includeConstant) extras.push([]);
  if (includeSquare) {
    if (powA !== 2) extras.push([{ v: varA, n: 2 }]);
    if (powB !== 2) extras.push([{ v: varB, n: 2 }]);
  }
  const shuffledExtras = shuffle(extras);
  const room = 6 - terms.length;
  const numExtra = Math.min(room, randInt(0, shuffledExtras.length));
  for (let i = 0; i < numExtra; i++) {
    terms.push({ coef: genSingleCoeff(caseType, minMag, maxMag), vars: shuffledExtras[i] });
  }
  return buildCollectQuestion(level, terms, varOrder, true, `t3-L3-${varA}${varB}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "subtool1") return genSubtool1(level, multiSelectValues);
  if (t === "subtool2") return genSubtool2(level, multiSelectValues);
  return genSubtool3(level, multiSelectValues);
};

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      stepRenderer={stepRenderer}
    />
  );
}
