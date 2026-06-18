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
  QuestionDisplay,
  randInt, pick, mStep, tStep, pickActive, ansEq,
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

// Randomly riffles the terms for display while PRESERVING each group's internal
// order. Because "crossing zero" is a per-group running-total property, the
// relative order of same-group terms must survive into the display (and the
// worked example), even though different variable groups are interleaved.
const interleaveGroups = (terms: Term[]): Term[] => {
  const queues = new Map<string, Term[]>();
  for (const t of terms) {
    const k = varsKey(t.vars);
    if (!queues.has(k)) queues.set(k, []);
    queues.get(k)!.push(t);
  }
  const lists = [...queues.values()];
  const out: Term[] = [];
  let remaining = terms.length;
  while (remaining > 0) {
    // Pick the next term by position across all remaining terms, so each group's
    // chance is proportional to how many terms it still has (a fair riffle).
    let r = Math.floor(Math.random() * remaining);
    for (const list of lists) {
      if (r < list.length) { out.push(list.shift()!); remaining--; break; }
      r -= list.length;
    }
  }
  return out;
};

// ── Coefficient generators ──────────────────────────────────────────────────
//
// "Crossing zero" is a property of the RUNNING TOTAL as a group is read left to
// right, not of the final answer. For a group's ordered coefficients the partial
// sums P_k = c_1 + … + c_k decide the case:
//   • positiveOnly         — every c_i > 0 (pure addition)
//   • subtractionPositive  — ≥1 subtraction, every P_k > 0 (never dips to/through
//                            zero), positive result — e.g. 8x − 3x, 9x − 2x − 1x
//   • crossingZero         — the partial sums genuinely cross zero (some P_k > 0
//                            AND some P_k < 0). Both directions are produced:
//                            down-cross 3x − 8x = −5x and up-cross −3x + 8x = +5x,
//                            so results land both negative and positive.
// Coefficients are returned IN DISPLAY ORDER; buildCollectQuestion preserves each
// group's internal order so the reading experience matches the intended case.

const partialsOf = (cs: number[]): number[] => {
  const ps: number[] = [];
  let s = 0;
  for (const c of cs) { s += c; ps.push(s); }
  return ps;
};

const genMainCoeffs = (count: number, caseType: string, minMag: number, maxMag: number): number[] => {
  // For crossing zero, fix the target result sign up front so both up-crosses
  // (positive result) and down-crosses (negative result) occur over many calls.
  const wantPositiveResult = Math.random() < 0.5;

  for (let attempt = 0; attempt < 200; attempt++) {
    const coeffs = Array.from({ length: count }, () => {
      const mag = randInt(minMag, maxMag);
      return caseType === "positiveOnly" ? mag : mag * (Math.random() < 0.5 ? 1 : -1);
    });
    const ps = partialsOf(coeffs);
    const sum = ps[ps.length - 1];
    if (sum === 0) continue;
    // Reject all-identical coefficients (e.g. 3x + 3x + 3x) — but only when
    // variety is possible. In "no coefficients" mode (minMag === maxMag === 1)
    // every term is ±1, so all-1s (x + x + x) is the intended output.
    if (count > 1 && minMag !== maxMag && new Set(coeffs).size === 1) continue;

    if (caseType === "positiveOnly") return coeffs;

    const minP = Math.min(...ps), maxP = Math.max(...ps);
    if (caseType === "crossingZero") {
      if (!(minP < 0 && maxP > 0)) continue;            // must genuinely cross
      if (wantPositiveResult ? sum < 0 : sum > 0) continue;
      return coeffs;
    }
    // subtractionPositive — stays strictly positive throughout, with a subtraction
    if (minP > 0 && coeffs.some(c => c < 0)) return coeffs;
  }

  // Fallback: construct a guaranteed non-zero ordered sequence matching the case
  // when the magnitudes allow it, otherwise the closest valid (all-positive) shape.
  const lo = minMag, hi = maxMag;
  const pad = (head: number[]) => [...head, ...Array(Math.max(0, count - head.length)).fill(lo)].slice(0, count);
  if (caseType === "crossingZero" && hi > lo) return pad([-lo, hi]);          // up-cross
  if (caseType === "subtractionPositive" && hi > lo) return pad([hi, -lo]);   // stays positive
  return Array.from({ length: count }, (_, i) => (i === 0 && hi > lo ? hi : lo));
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

const QUESTION_POOL_L3: ToolMultiSelect = {
  key: "questionPool",
  label: "Question Types",
  allowEmpty: true,
  options: [
    { value: "twoVariableTargets", label: "Two-variable target terms", defaultActive: false },
  ],
};

const SUBTRACTION_GROUP: ToolMultiSelect = {
  key: "subtractionCases",
  label: "Question Types",
  options: [
    { value: "positiveOnly", label: "Positive terms only", defaultActive: true },
    { value: "subtractionPositive", label: "Subtraction (stays positive)", defaultActive: false },
    { value: "crossingZero", label: "Crossing zero", defaultActive: false },
  ],
};

const SUBTRACTION_GROUP_L3: ToolMultiSelect = {
  key: "subtractionCases",
  label: "Question Types",
  options: [
    { value: "positiveOnly", label: "Positive terms only", defaultActive: false },
    { value: "subtractionPositive", label: "Subtraction (stays positive)", defaultActive: true },
    { value: "crossingZero", label: "Crossing zero", defaultActive: true },
  ],
};

const TERM_OPTIONS2_L1: ToolMultiSelect = {
  key: "termOptions",
  label: "Term Options",
  allowEmpty: true,
  options: [
    { value: "noCoefficients", label: "No coefficients (x + x + x...)", defaultActive: false },
  ],
};

const TERM_OPTIONS2_L2: ToolMultiSelect = {
  key: "termOptions",
  label: "Second Term Type",
  allowEmpty: false,
  options: [
    { value: "includeConstant", label: "Constants", defaultActive: true },
    { value: "includeSquare", label: "Square terms", defaultActive: true },
  ],
};

const TERM_OPTIONS2_L3: ToolMultiSelect = {
  key: "termOptions",
  label: "Higher Powers",
  allowEmpty: true,
  options: [
    { value: "includeCubicQuartic", label: "Cubics & quartics (x³, x⁴)", defaultActive: true },
  ],
};

// Sub-tool 3 Level 1 — mirrors Single Variable L2 (4 terms, one secondary type),
// but the secondary type is the OTHER variable. The split selector chooses how the
// 4 terms divide between the two variables: 2-2 (both collectable) or 3-1 (one
// collectable pair plus a singleton). Both on by default → a mix across a worksheet.
const SPLIT_GROUP_L1: ToolMultiSelect = {
  key: "splitCases",
  label: "Term Split",
  allowEmpty: false,
  options: [
    { value: "split22", label: "2 and 2", defaultActive: true },
    { value: "split31", label: "3 and 1", defaultActive: true },
  ],
};

// Sub-tool 3 Level 2 — each question is the two-variable base plus exactly ONE
// enrichment drawn from the active pool (one complication per question):
//   • Constants       — a number term (one, or a collectable pair) beside two vars
//   • Squared terms   — one variable squared (capped to a single variable), giving
//                       an x / x² split next to a linear anchor variable
//   • Three variables — a third linear variable group to sort and collect
// allowEmpty:false so L2 always steps up from the plain two-variable L1.
const ENRICH_L2: ToolMultiSelect = {
  key: "termOptions",
  label: "Term Types",
  allowEmpty: false,
  options: [
    { value: "includeConstant", label: "Constants", defaultActive: true },
    { value: "includeSquare", label: "Squared terms", defaultActive: true },
    { value: "threeVariables", label: "Three variables", defaultActive: true },
  ],
};

const TERM_OPTIONS3_L3: ToolMultiSelect = {
  key: "termOptions",
  label: "Extra Term Types",
  allowEmpty: true,
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
      multiSelect: [SUBTRACTION_GROUP, ENRICH_L2],
      difficultySettings: {
        level1: { multiSelect: [SUBTRACTION_GROUP, SPLIT_GROUP_L1] },
        level2: { multiSelect: [SUBTRACTION_GROUP, ENRICH_L2] },
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
    { label: "Level 1 — Green", detail: "Exactly two variables, powers of 1, four terms, coefficients 2–9. The Term Split option chooses a 2 + 2 split (both variables collectable) or a 3 + 1 split (one collectable pair plus a single uncollectable term). Subtraction and crossing zero available." },
    { label: "Level 2 — Yellow", detail: "Each question adds one complication to the two-variable base — a constant (or a collectable pair of constants), one squared variable (capped to a single variable, giving an x / x² split beside a linear anchor), or a third variable to collect. Five or six terms with at least one collectable group guaranteed. Subtraction and crossing zero available." },
    { label: "Level 3 — Red", detail: "Both variables always have a collectable pair — students collect two groups simultaneously. Squared terms for both variables optional. Subtraction and crossing zero defaultActive." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand, including colour-coded underlines for Sub-tools 2 and 3." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Question Types", detail: "Toggle which kinds of target terms, powers and distractors appear (Spot the Like Term), or which subtraction cases and extra term types appear (Single/Multiple Variables)." },
    { label: "Subtraction cases", detail: "Positive only — pure addition. Subtraction (stays positive) — a subtraction where the running total never drops to or below zero, e.g. 8x − 3x. Crossing zero — the running total genuinely passes through zero as you collect, in both directions, so results land both positive (−3x + 8x = 5x) and negative (3x − 8x = −5x)." },
    { label: "Differentiated", detail: "QO popover shows all three levels so each column can be customised independently." },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 1 — Spot the Like Term (worded MCQ)
// ═══════════════════════════════════════════════════════════════════════════════

const LETTERS = ["A", "B", "C", "D", "E", "F"];

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

  const promptText = level === "level3"
    ? "Circle any like terms — there may be zero. Target:"
    : "Circle the like term:";

  return {
    kind: "worded",
    lines: [introLine, ...optionLines],
    answer,
    working,
    key,
    difficulty: level,
    _mcq: {
      promptText,
      targetLatex,
      options: shuffled.map((o, i) => ({ letter: LETTERS[i], latex: termSigned(o.term), correct: o.correct })),
    },
  } as unknown as WordedQuestion;
};

const buildL1 = (maxPower: number, withConstants: boolean, id: number): WordedQuestion => {
  const v = pick(VAR_POOL);
  const n = randInt(1, maxPower);
  const a = randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v, n }] };

  let trueCoef = randInt(2, 9);
  while (trueCoef === a) trueCoef = randInt(2, 9);
  const trueLike: Term = { coef: trueCoef, vars: [{ v, n }] };

  // Level 1 caps powers at 3 (cube). pickPower returns a power different from the
  // target's, within the cube cap — repeats across distractors are fine because
  // each distractor uses a distinct variable letter.
  const usedVars = new Set([v]);
  const pickVar = () => { const c = pick(VAR_POOL.filter(x => !usedVars.has(x))); usedVars.add(c); return c; };
  const pickPower = () => pick([1, 2, 3].filter(p => p !== n));
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

  const sc = () => (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);

  // True like term — same variable and power, coefficient ≠ the target's own
  // (otherwise it would be identical to the target). May be negative.
  let trueCoef = sc();
  while (trueCoef === a) trueCoef = sc();
  const trueLike: Term = { coef: trueCoef, vars: [{ v, n }] };
  const trueExplain = trueCoef < 0
    ? `Same variable ${v}, same power ${n}. The negative sign does not change the term type — this IS a like term ✓`
    : `Same variable ${v}, same power ${n} — this IS a like term ✓`;

  // Distractor shapes (each wrong on variable or power). Coefficients are filled
  // in afterwards so we can deliberately plant the "same coefficient" trap.
  const candA = [n - 1, n + 1].filter(p => p >= 1 && p <= 5);
  const nmaPower = pick(candA.length ? candA : [1, 2, 3, 4, 5].filter(p => p !== n));
  const nmbVar = pick(VAR_POOL.filter(x => x !== v));
  const wildPowers = (maxPower > 1 ? [1, 2, 3, 4, 5] : [1]).filter(p => p !== n);
  const useConstWild = (withConstants && Math.random() < 0.25) || wildPowers.length === 0;
  const wv = pick(VAR_POOL.filter(x => x !== v && x !== nmbVar));
  const wp = pick(wildPowers.length ? wildPowers : [n]);

  type Dist = { vars: VarPower[]; explain: (echo: boolean) => string };
  const dists: Dist[] = [
    { vars: [{ v, n: nmaPower }], explain: e =>
      `${e ? "Same coefficient and same variable" : `Same variable ${v}`}, but the power is ${nmaPower} not ${n} — not a like term ✗` },
    { vars: [{ v: nmbVar, n }], explain: e =>
      `${e ? "Same coefficient and same power" : `Same power ${n}`}, but a different variable — not a like term ✗` },
    useConstWild
      ? { vars: [], explain: e =>
          `${e ? "The same number as the coefficient, but it" : "It"} has no variable — a constant, not a like term ✗` }
      : { vars: [{ v: wv, n: wp }], explain: e =>
          `${e ? "Same coefficient, but a" : "A"} different variable and different power — not a like term ✗` },
  ];

  // Plant the "same coefficient" trap: 1-2 distractors carry the target's exact
  // coefficient, the rest are randomised — so a matching number is not a reliable
  // signal, but the trap still catches students who assume same number = like term.
  const echoSet = new Set(shuffle([0, 1, 2]).slice(0, pick([1, 1, 2])));
  const opts: MCQOption[] = [{ term: trueLike, correct: true, explain: trueExplain }];
  dists.forEach((d, i) => {
    const echo = echoSet.has(i);
    opts.push({ term: { coef: echo ? a : sc(), vars: d.vars }, correct: false, explain: d.explain(echo) });
  });

  return finishMCQ("level2", target, opts,
    "Check each option — a like term needs the same variable AND power. The coefficient does not decide the term type.",
    `t1-L2-${v}${n}-${a}-${id}`);
};

const buildL3SingleVar = (maxPower: number, id: number): WordedQuestion => {
  const v = pick(VAR_POOL);
  const n = randInt(1, maxPower);
  const a = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v, n }] };

  const sc = () => randInt(2, 9) * (Math.random() < 0.5 ? 1 : -1);
  const usedCoefs = new Set<number>([a]);
  const freshCoef = () => { let c = sc(); while (usedCoefs.has(c)) c = sc(); usedCoefs.add(c); return c; };

  const correctExplain = (coef: number) => coef < 0
    ? `Same variable ${v}, same power ${n}. Negative sign does not change the term type — this IS a like term ✓`
    : `Same variable ${v}, same power ${n} — this IS a like term ✓`;

  // 0-3 correct options — same variable and power as the target, each with
  // a different coefficient (sign and size do not affect whether it's a like term).
  const numCorrect = pick([0, 1, 1, 2, 2, 3]);
  const correctOpts: MCQOption[] = [];
  for (let c = 0; c < numCorrect; c++) {
    const coef = freshCoef();
    correctOpts.push({ term: { coef, vars: [{ v, n }] }, correct: true, explain: correctExplain(coef) });
  }

  // Distractor shapes — wrong on variable, power, or both. Coefficients are
  // filled in afterwards so 1-2 can echo the target's exact coefficient (the
  // "same coefficient = like term" trap from level 2).
  const [dn1, dn2, dn3] = shuffle([1, 2, 3, 4, 5].filter(p => p !== n));
  const [dv1, dv2, dv3] = shuffle(VAR_POOL.filter(x => x !== v));

  type Dist = { vars: VarPower[]; explain: (echo: boolean) => string };
  const shapes: Dist[] = [
    { vars: [{ v, n: dn1 }], explain: e =>
      `${e ? "Same coefficient and same variable" : `Same variable ${v}`}, but the power is ${dn1} not ${n} — not a like term ✗` },
    { vars: [{ v: dv1, n }], explain: e =>
      `${e ? "Same coefficient and same power" : `Same power ${n}`}, but a different variable — not a like term ✗` },
    { vars: [], explain: e =>
      `${e ? "The same number as the coefficient, but it" : "It"} has no variable — a constant, not a like term ✗` },
    { vars: [{ v: dv3, n: dn3 }], explain: e => e
      ? "Same coefficient as the target, but a different variable and different power — not a like term ✗"
      : "Different variable and different power — not a like term ✗" },
    { vars: [{ v, n: dn2 }], explain: e =>
      `${e ? "Same coefficient and same variable" : `Same variable ${v}`}, but the power is ${dn2} not ${n} — not a like term ✗` },
    { vars: [{ v: dv2, n }], explain: e =>
      `${e ? "Same coefficient and same power" : `Same power ${n}`}, but a different variable — not a like term ✗` },
  ];

  const need = 6 - numCorrect;
  const chosenShapes = shuffle(shapes).slice(0, need);
  const echoSet = new Set(shuffle(chosenShapes.map((_, i) => i)).slice(0, pick([1, 1, 2])));

  const opts: MCQOption[] = [...correctOpts];
  chosenShapes.forEach((d, i) => {
    const echo = echoSet.has(i);
    const coef = echo ? a : freshCoef();
    opts.push({ term: { coef, vars: d.vars }, correct: false, explain: d.explain(echo) });
  });

  return finishMCQ("level3", target, opts,
    "Check each option — there may be zero like terms or more than one. Sign does not affect term type, and a matching coefficient does not make two terms alike.",
    `t1-L3sv-${v}${n}-${a}-${numCorrect}-${id}`);
};

const buildL3TwoVar = (id: number): WordedQuestion => {
  const [varA, varB] = shuffle(VAR_POOL).slice(0, 2);
  const powA = randInt(1, 3);
  const powB = randInt(1, 5 - powA);
  const a = (Math.random() < 0.5 ? 1 : -1) * randInt(2, 9);
  const target: Term = { coef: a, vars: [{ v: varA, n: powA }, { v: varB, n: powB }] };

  const randCoef = () => randInt(2, 9) * (Math.random() < 0.5 ? 1 : -1);
  const usedCoefs = new Set<number>([a]);
  const freshCoef = () => { let c = randCoef(); while (usedCoefs.has(c)) c = randCoef(); usedCoefs.add(c); return c; };

  // 0-3 correct options — same variables and same powers as the target, in
  // either order (variable order does not matter), each with a different coefficient.
  const trueExplain = "Same variables and same powers — this IS a like term ✓";
  const commExplain = `Variables are ${varB} and ${varA} in a different order — variable order does not matter. Same powers — this IS a like term ✓`;
  const numCorrect = pick([0, 1, 1, 2, 2, 3]);
  const correctOpts: MCQOption[] = [];
  for (let i = 0; i < numCorrect; i++) {
    const coef = freshCoef();
    const orderA = Math.random() < 0.5;
    const term: Term = orderA
      ? { coef, vars: [{ v: varA, n: powA }, { v: varB, n: powB }] }
      : { coef, vars: [{ v: varB, n: powB }, { v: varA, n: powA }] };
    correctOpts.push({ term, correct: true, explain: orderA ? trueExplain : commExplain });
  }

  // Distractor shapes — wrong on variable, power, or both. Coefficients are
  // filled in afterwards so 1-2 can echo the target's exact coefficient (the
  // "same coefficient = like term" trap from level 2).
  const nudges: [number, number][] = [];
  if (powA + 1 + powB <= 5) nudges.push([powA + 1, powB]);
  if (powA - 1 >= 1) nudges.push([powA - 1, powB]);
  if (powA + powB + 1 <= 5) nudges.push([powA, powB + 1]);
  if (powB - 1 >= 1) nudges.push([powA, powB - 1]);
  const [naA, naB] = pick(nudges);

  const [z, z2, z3] = shuffle(VAR_POOL.filter(x => x !== varA && x !== varB));
  const replaceA = Math.random() < 0.5;
  const wcVar = Math.random() < 0.5 ? varA : varB;
  const wcPow = wcVar === varA ? powA : powB;

  type Dist = { vars: VarPower[]; explain: (echo: boolean) => string };
  const shapes: Dist[] = [
    { // power of one variable off by one
      vars: [{ v: varA, n: naA }, { v: varB, n: naB }],
      explain: e => {
        const which = naA !== powA ? varA : varB;
        const got = naA !== powA ? naA : naB;
        const want = naA !== powA ? powA : powB;
        return e
          ? `Same coefficient as the target, but the power of ${which} is ${got} not ${want} — not a like term ✗`
          : `Same variables, but the power of ${which} is ${got} not ${want} — different power, not a like term ✗`;
      },
    },
    { // one variable swapped for z, powers unchanged
      vars: replaceA ? [{ v: z, n: powA }, { v: varB, n: powB }] : [{ v: varA, n: powA }, { v: z, n: powB }],
      explain: e => {
        const matchVar = replaceA ? varB : varA, wrongVar = replaceA ? varA : varB;
        return e
          ? `Same coefficient as the target, and the power of ${matchVar} matches, but ${z} is not the same as ${wrongVar} — not a like term ✗`
          : `Power of ${matchVar} matches, but ${z} is not the same as ${wrongVar} — different variable, not a like term ✗`;
      },
    },
    { // only one variable present
      vars: [{ v: wcVar, n: wcPow }],
      explain: e => e
        ? "Same coefficient as the target, but only one variable is present — not a like term ✗"
        : `Only one variable — missing ${wcVar === varA ? varB : varA} entirely, not a like term ✗`,
    },
    { // the other variable swapped for z2, powers unchanged
      vars: replaceA ? [{ v: z2, n: powA }, { v: varB, n: powB }] : [{ v: varA, n: powA }, { v: z2, n: powB }],
      explain: e => {
        const matchVar = replaceA ? varB : varA, wrongVar = replaceA ? varA : varB;
        return e
          ? `Same coefficient as the target, and the power of ${matchVar} matches, but ${z2} is not the same as ${wrongVar} — not a like term ✗`
          : `Power of ${matchVar} matches, but ${z2} is not the same as ${wrongVar} — different variable, not a like term ✗`;
      },
    },
    { // both variables different, powers unchanged
      vars: [{ v: z, n: powA }, { v: z3, n: powB }],
      explain: e => `Both variables differ from the target — ${z} and ${z3} instead of ${varA} and ${varB}${e ? " (the coefficient matches the target's)" : ""} — not a like term ✗`,
    },
    { // constant
      vars: [],
      explain: e => e
        ? "The same number as the coefficient, but it has no variables — a constant, not a like term ✗"
        : "It has no variables — a constant, not a like term ✗",
    },
  ];

  const need = 6 - numCorrect;
  const chosenShapes = shuffle(shapes).slice(0, need);
  const echoSet = new Set(shuffle(chosenShapes.map((_, i) => i)).slice(0, pick([1, 1, 2])));

  const opts: MCQOption[] = [...correctOpts];
  chosenShapes.forEach((d, i) => {
    const echo = echoSet.has(i);
    const coef = echo ? a : freshCoef();
    opts.push({ term: { coef, vars: d.vars }, correct: false, explain: d.explain(echo) });
  });

  const intro = "Check each option — every variable and every power must match. Variable order does not matter, and a matching coefficient does not make two terms alike. There may be zero like terms.";
  return finishMCQ("level3", target, opts, intro, `t1-L3tv-${varA}${powA}${varB}${powB}-${a}-${numCorrect}-${id}`);
};

const genSubtool1 = (level: DifficultyLevel, msv: Record<string, boolean>): WordedQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);

  // L1 caps powers at cube; L2/L3 go up to 5. Constants always appear as
  // distractors. L3 may use two-variable targets when that toggle is active.
  if (level === "level1") return buildL1(3, true, id);
  if (level === "level2") return buildL2(5, true, id);
  const twoVar = isOn(msv, "twoVariableTargets") && Math.random() < 0.5;
  return twoVar ? buildL3TwoVar(id) : buildL3SingleVar(5, id);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 2 — Single Variable
// ═══════════════════════════════════════════════════════════════════════════════

// Assembles a SimpleQuestion from a raw term list. Interleaves the groups for
// display (preserving each group's internal order so the running-total / crossing
// pattern survives), then builds display / answer / working via the shared helpers.
const buildCollectQuestion = (
  level: DifficultyLevel,
  rawTerms: Term[],
  varOrder: string[],
  variableWords: boolean,
  keyPrefix: string,
): SimpleQuestion => {
  const terms = interleaveGroups(rawTerms);
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
      const count = randInt(3, 6);
      const coeffs = genMainCoeffs(count, caseType, 1, 1);
      const terms = coeffs.map(c => ({ coef: c, vars: [{ v, n: 1 }] }));
      return buildCollectQuestion(level, terms, [v], false, `t2-L1nc-${v}`);
    }
    const count = randInt(3, 4);
    const coeffs = genMainCoeffs(count, caseType, 1, 9);
    const terms = coeffs.map(c => ({ coef: c, vars: [{ v, n: 1 }] }));
    return buildCollectQuestion(level, terms, [v], false, `t2-L1-${v}`);
  }

  if (level === "level2") {
    // Exactly 4 terms: linear x terms plus ONE secondary type (constants or x²),
    // split 2-2, 3-1 or 1-3. The secondary type is drawn from the active options.
    // Any group of 2+ collects (following the subtraction case); a lone term is
    // left uncollected.
    const secondType = pickActive(msv, TERM_OPTIONS2_L2.options);
    const secondVars: VarPower[] = secondType === "includeSquare" ? [{ v, n: 2 }] : [];
    const splits: [number, number][] = [[2, 2], [3, 1], [1, 3]];
    const [linCount, secCount] = pick(splits);
    const coeffsFor = (cnt: number): number[] =>
      cnt >= 2 ? genMainCoeffs(cnt, caseType, 2, 9) : [genSingleCoeff(caseType, 2, 9)];
    const terms: Term[] = [
      ...coeffsFor(linCount).map(c => ({ coef: c, vars: [{ v, n: 1 }] })),
      ...coeffsFor(secCount).map(c => ({ coef: c, vars: secondVars })),
    ];
    return buildCollectQuestion(level, terms, [v], false, `t2-L2-${v}`);
  }

  // level3 — 4-6 terms drawn from a pool of constant / x / x² (plus x³ / x⁴ when
  // the higher-powers toggle is active). At least one collectable set is always
  // present, usually two. Coefficients follow the subtraction case.
  const higher = isOn(msv, "includeCubicQuartic");
  const powerPool = higher ? [0, 1, 2, 3, 4] : [0, 1, 2]; // 0 = constant
  const makeTerm = (p: number, c: number): Term => ({ coef: c, vars: p === 0 ? [] : [{ v, n: p }] });

  const buildTerms = (): Term[] => {
    const total = randInt(4, 6);
    // Collectable sets — usually 2, sometimes 1 or 3 — capped by pool size and
    // how many terms there is room for (each set needs 2 terms).
    let numSets = pick([1, 2, 2, 2, 3]);
    numSets = Math.max(1, Math.min(numSets, powerPool.length, Math.floor(total / 2)));
    const setPowers = shuffle(powerPool).slice(0, numSets);
    const out: Term[] = [];
    for (const p of setPowers) for (const c of genMainCoeffs(2, caseType, 2, 9)) out.push(makeTerm(p, c));
    // Fill remaining slots with singletons from unused powers; if those run out,
    // fall back to any power (which may grow a set into a triple).
    const otherPowers = shuffle(powerPool.filter(p => !setPowers.includes(p)));
    for (let i = out.length, j = 0; i < total; i++, j++) {
      out.push(makeTerm(otherPowers[j] ?? pick(powerPool), genSingleCoeff(caseType, 2, 9)));
    }
    return out;
  };

  // A valid question keeps at least one collectable set and never lets a whole
  // power collect to zero (which would silently drop a group from the answer).
  const valid = (ts: Term[]): boolean => {
    const counts = new Map<string, number>();
    for (const t of ts) counts.set(varsKey(t.vars), (counts.get(varsKey(t.vars)) ?? 0) + 1);
    return [...counts.values()].some(c => c >= 2) && groupTerms(ts).every(g => g.coef !== 0);
  };

  let terms = buildTerms();
  for (let tries = 0; tries < 40 && !valid(terms); tries++) terms = buildTerms();
  return buildCollectQuestion(level, terms, [v], false, `t2-L3-${v}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TOOL 3 — Multiple Variables (two distinct variables, univariate terms)
// ═══════════════════════════════════════════════════════════════════════════════

const genSubtool3 = (level: DifficultyLevel, msv: Record<string, boolean>): SimpleQuestion => {
  const [varA, varB, varC] = shuffle(VAR_POOL).slice(0, 3);
  const varOrder = [varA, varB];
  const caseType = pickActive(msv, SUBTRACTION_GROUP.options);
  const noCoef = isOn(msv, "noCoefficients");

  if (level === "level1") {
    // Mirrors Single Variable L2: exactly 4 power-1 terms across two variables.
    // Split selector decides the division — 3-1 (one collectable pair + a
    // singleton) or 2-2 (both variables collectable). Coefficients 2-9, signs
    // following the subtraction case, exactly as in Single Variable L2.
    const split = pickActive(msv, SPLIT_GROUP_L1.options);
    if (split === "split31") {
      const threeIsA = Math.random() < 0.5;
      const threeVar = threeIsA ? varA : varB;
      const oneVar = threeIsA ? varB : varA;
      const terms: Term[] = [
        ...genMainCoeffs(3, caseType, 2, 9).map(c => ({ coef: c, vars: [{ v: threeVar, n: 1 }] })),
        { coef: genSingleCoeff(caseType, 2, 9), vars: [{ v: oneVar, n: 1 }] },
      ];
      return buildCollectQuestion(level, terms, varOrder, true, `t3-L1-${varA}${varB}`);
    }
    const terms: Term[] = [
      ...genMainCoeffs(2, caseType, 2, 9).map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] })),
      ...genMainCoeffs(2, caseType, 2, 9).map(c => ({ coef: c, vars: [{ v: varB, n: 1 }] })),
    ];
    return buildCollectQuestion(level, terms, varOrder, true, `t3-L1-${varA}${varB}`);
  }

  if (level === "level2") {
    // One enrichment per question, drawn from the active pool (ENRICH_L2). Every
    // question is 5-6 terms with at least one guaranteed collectable group. A
    // group of 2+ terms is generated with genMainCoeffs (non-zero, non-uniform
    // sum, following the subtraction case); a lone term uses genSingleCoeff.
    const enrich = pickActive(msv, ENRICH_L2.options);
    const grp = (cnt: number): number[] =>
      cnt >= 2 ? genMainCoeffs(cnt, caseType, 2, 9) : [genSingleCoeff(caseType, 2, 9)];

    if (enrich === "threeVariables") {
      // Three linear variables, 5-6 terms. Each variable is present; the extra
      // terms beyond one-each always grow at least one group into a pair.
      const order = [varA, varB, varC];
      const counts = [1, 1, 1];
      for (let extra = randInt(5, 6) - 3; extra > 0; extra--) counts[randInt(0, 2)]++;
      const terms: Term[] = [];
      order.forEach((vv, i) => grp(counts[i]).forEach(c => terms.push({ coef: c, vars: [{ v: vv, n: 1 }] })));
      return buildCollectQuestion(level, terms, order, true, `t3-L2-3v-${varA}${varB}${varC}`);
    }

    if (enrich === "includeConstant") {
      // Two linear variables (varA a guaranteed pair) plus either a lone constant
      // or a collectable pair of constants. 5-6 terms.
      const numConst = pick([1, 2]);
      const varTotal = randInt(5, 6) - numConst;               // 3-5
      const countA = Math.min(pick([2, 3]), varTotal - 1);     // pair, leaving >=1 for varB
      const terms: Term[] = [
        ...grp(countA).map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] })),
        ...grp(varTotal - countA).map(c => ({ coef: c, vars: [{ v: varB, n: 1 }] })),
        ...grp(numConst).map(c => ({ coef: c, vars: [] as VarPower[] })),
      ];
      return buildCollectQuestion(level, terms, varOrder, true, `t3-L2-c-${varA}${varB}`);
    }

    // includeSquare — exactly one variable squared (varA, capped); varB is the
    // linear anchor. The square pair always collects, and varA also appears
    // linear so the student must keep varA² and varA apart (the x / x² trap).
    const sqLin = pick([1, 2]);
    const lin = sqLin === 1 ? 2 : pick([1, 2]);                // keep 2 + sqLin + lin >= 5
    const terms: Term[] = [
      ...grp(2).map(c => ({ coef: c, vars: [{ v: varA, n: 2 }] })),
      ...grp(sqLin).map(c => ({ coef: c, vars: [{ v: varA, n: 1 }] })),
      ...grp(lin).map(c => ({ coef: c, vars: [{ v: varB, n: 1 }] })),
    ];
    return buildCollectQuestion(level, terms, varOrder, true, `t3-L2-sq-${varA}${varB}`);
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
  const bCoeffs = genMainCoeffs(2, caseType, minMag, maxMag);
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
// Question renderer — MCQ grid (Sub-tool 1) + expression display (Sub-tools 2 & 3)
// ═══════════════════════════════════════════════════════════════════════════════

interface MCQData {
  promptText: string;
  targetLatex: string;
  options: { letter: string; latex: string; correct: boolean }[];
}

// compact: true = worksheet cell · false = worked example / fullscreen · undefined = whiteboard
// Tailwind text-size ladder, used to step a font-size class up or down.
const TEXT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
const stepSize = (cls: string, by: number): string => {
  const i = TEXT_SIZES.indexOf(cls);
  return i < 0 ? cls : TEXT_SIZES[Math.max(0, Math.min(TEXT_SIZES.length - 1, i + by))];
};

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  compact?: boolean,
  _idx?: number,
  _qo?: unknown,
  fontClass?: string,
): JSX.Element | null => {
  const mcq = (q as unknown as { _mcq?: MCQData })._mcq;

  // ── Sub-tool 1 — multiple choice in a 2-column grid ──
  if (q.kind === "worded" && mcq) {
    const small = compact === true;
    const big = compact === false;
    // The MCQ grid carries a prompt + several options, so it reads a couple of
    // steps smaller than the plain-expression display. Driven by the font-size
    // chevrons (fontClass) so it scales; falls back to fixed sizes if absent.
    const sizeCls = fontClass
      ? stepSize(fontClass, big ? -1 : -2)
      : small ? "text-base" : big ? "text-3xl" : "text-2xl";
    const maxW = small ? 340 : big ? 640 : 520;
    const gap = small ? 6 : 12;
    return (
      <div className={sizeCls} style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
        <div style={{ fontWeight: 600, textAlign: "center", color: "#000", marginBottom: small ? 8 : 16 }}>
          <span>{mcq.promptText} </span>
          <MathRenderer latex={mcq.targetLatex} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>
          {mcq.options.map((o, i) => {
            const reveal = showAnswer && o.correct;
            // Odd option count (5 at L3): centre the final option across both
            // columns so the layout reads 2, 2, then 1 centred.
            const lastOdd = mcq.options.length % 2 === 1 && i === mcq.options.length - 1;
            return (
              <div key={o.letter} style={{
                display: "flex", alignItems: "center", gap: 10,
                border: `2px solid ${reveal ? "#16a34a" : "#cbd5e1"}`,
                background: reveal ? "#dcfce7" : "transparent",
                borderRadius: 10, padding: small ? "6px 10px" : "10px 16px",
                color: "#000",
                ...(lastOdd ? { gridColumn: "1 / -1", justifySelf: "center", width: `calc(50% - ${gap / 2}px)` } : {}),
              }}>
                <span style={{ fontWeight: 700, color: reveal ? "#16a34a" : "#64748b" }}>{o.letter})</span>
                <MathRenderer latex={o.latex} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Sub-tools 2 & 3 — simple expression (instruction + display + answer) ──
  const cls = fontClass ?? (compact === true ? "text-xl" : compact === false ? "text-4xl" : "text-3xl");
  const ansLatex = (q as unknown as { answerLatex?: string }).answerLatex;
  return (
    <div className="w-full flex flex-col gap-3 items-center text-center">
      {compact !== true && <div className={`${cls} font-semibold`} style={{ color: "#000" }}>Simplify:</div>}
      <QuestionDisplay q={q} cls={cls} />
      {showAnswer && ansLatex && (
        <div className={`${cls} font-bold`} style={{ color: "#166534" }}>
          <MathRenderer latex={ansEq(ansLatex)} />
        </div>
      )}
    </div>
  );
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
      questionRenderer={questionRenderer}
      stepRenderer={stepRenderer}
    />
  );
}
