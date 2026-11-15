import {
  ToolShell,
  type ToolConfig, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, shuffle, pickActive, mStep, extras,
  PV_WORD_HEADERS_VAR, PV_WORD_HEADERS_KEY, type QOSnapshot,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./StandardForm.about";
import { CONV_ASK_MS, CONV_DIGITS_MS, CONV_ZEROS_MS, CONV_COEF_MS, CONV_START_MS, genConvert } from "./StandardFormConvert";
import { gridBlank, gridFinal, type GridSpec } from "./StandardFormGrid";
import { ShiftGrid, shiftStepRenderer, shiftStepVisual } from "./StandardFormShift";
import { MD_OPS_MS, MD_COEF_MS, genMulDiv } from "./StandardFormMulDiv";
import { AS_OPS_MS, AS_RESULT_MS, AS_POWERS_MS, AS_MATCH_MS, genAddSub } from "./StandardFormAddSub";

// ════════════════════════════════════════════════════════════════════════
// Standard Form: converting, multiplying and dividing, adding and subtracting,
// and comparing and ordering. Each sub-tool's generator is in its own file
// (StandardFormConvert / MulDiv / AddSub); this file holds the comparing and
// ordering generator and wires them together.
//
// Every number is c × 10ⁿ with c in [1, 10) to one decimal place, held as
// the integer pair (tenths of c, n), so comparing is exact: the power
// decides first, then the coefficient.
// ════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────

type ToolType = "converting" | "multiplyDivide" | "addSubtract" | "comparing";

/** A number in standard form: coefficient in tenths (10 … 99) and the power of 10. */
interface SF { t: number; n: number; }

// ── 2. Number helpers ─────────────────────────────────────────────────────

/** 1 dp coefficient with a trailing .0 dropped: 45 → "4.5", 50 → "5". */
const coef = (t: number): string => (t % 10 === 0 ? String(t / 10) : (t / 10).toFixed(1));
const texSF = (x: SF): string => `${coef(x.t)} \\times 10^{${x.n}}`;
/** Order of two numbers: the power first, then the coefficient. */
const cmp = (a: SF, b: SF): number => (a.n !== b.n ? a.n - b.n : a.t - b.t);
const same = (a: SF, b: SF): boolean => a.n === b.n && a.t === b.t;
const randT = (lo = 10, hi = 99): number => randInt(lo, hi);

// ── 3. Question Options ───────────────────────────────────────────────────

// Level 1 (compare two numbers)
const POWERS_MS: ToolMultiSelect = {
  key: "powers", label: "Powers", tab: "numbers",
  options: [
    { value: "equal", label: "Same", defaultActive: true },
    { value: "positive", label: "Positive", defaultActive: true },
    { value: "negative", label: "Negative", defaultActive: true },
    { value: "mixed", label: "Mixed Signs", defaultActive: false },
  ],
};
const COEFFICIENTS_MS: ToolMultiSelect = {
  key: "coefficients", label: "Coefficients", tab: "numbers",
  options: [
    { value: "agreeing", label: "Agreeing", defaultActive: true },
    // two numbers with the same power have no power to mislead: the option needs a pair whose powers differ
    { value: "misleading", label: "Misleading", defaultActive: true, requires: [["positive", "negative", "mixed"]] },
  ],
};

// Level 2 (put four numbers in order)
const ASK_FOR_MS: ToolMultiSelect = {
  key: "askFor", label: "Ask for", tab: "questions",
  options: [
    { value: "smallest", label: "Smallest First", defaultActive: true },
    { value: "largest", label: "Largest First", defaultActive: false },
  ],
};
const ORDER_POWERS_MS: ToolMultiSelect = {
  key: "orderPowers", label: "Powers", tab: "numbers",
  options: [
    { value: "positive", label: "Positive", defaultActive: true },
    { value: "negative", label: "Negative", defaultActive: true },
    { value: "mixed", label: "Mixed Signs", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Standard Form",
  tools: {
    converting: {
      name: "Converting",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [PV_WORD_HEADERS_VAR], dropdown: null, multiSelect: [CONV_ASK_MS, CONV_DIGITS_MS, CONV_ZEROS_MS] },
        level2: { variables: [PV_WORD_HEADERS_VAR], dropdown: null, multiSelect: [CONV_ASK_MS, CONV_DIGITS_MS, CONV_ZEROS_MS] },
        level3: { variables: [PV_WORD_HEADERS_VAR], dropdown: null, multiSelect: [CONV_COEF_MS, CONV_START_MS] },
      },
    },
    multiplyDivide: {
      name: "Multiplying & Dividing",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [MD_OPS_MS, MD_COEF_MS] },
        level2: { variables: [], dropdown: null, multiSelect: [MD_OPS_MS, MD_COEF_MS] },
        level3: { variables: [], dropdown: null, multiSelect: [MD_OPS_MS, MD_COEF_MS] },
      },
    },
    addSubtract: {
      name: "Adding & Subtracting",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [AS_OPS_MS, AS_RESULT_MS, AS_POWERS_MS] },
        level2: { variables: [], dropdown: null, multiSelect: [AS_OPS_MS, AS_RESULT_MS, AS_POWERS_MS, AS_MATCH_MS] },
        level3: { variables: [], dropdown: null, multiSelect: [AS_OPS_MS, AS_POWERS_MS, AS_MATCH_MS] },
      },
    },
    comparing: {
      name: "Comparing & Ordering",
      variables: [],
      dropdown: null,
      levels: ["level1", "level2"],
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [POWERS_MS, COEFFICIENTS_MS] },
        level2: { variables: [], dropdown: null, multiSelect: [ASK_FOR_MS, ORDER_POWERS_MS] },
      },
    },
  },
};

// ── 4. Drawing the numbers ────────────────────────────────────────────────

/** A power in the given sign family (never 0, 1 or −1, so neither number is plain-looking). */
const drawPower = (kind: "positive" | "negative"): number => (kind === "positive" ? randInt(2, 9) : -randInt(2, 9));

// ── 5. Level 1: compare two numbers ───────────────────────────────────────

interface CompareRaw { left: SF; right: SF; }

/** Two numbers with the stated power relationship. `misleading` puts the bigger coefficient on the smaller number. */
const drawPair = (powers: string, misleading: boolean): [SF, SF] => {
  if (powers === "equal") {
    const n = randInt(-8, 8) || 5;
    let a = randT(), b = randT();
    while (b === a) b = randT();
    return [{ t: a, n }, { t: b, n }];
  }
  let nHigh: number, nLow: number;
  if (powers === "mixed") { nHigh = randInt(2, 8); nLow = -randInt(2, 8); }
  else {
    const kind = powers === "negative" ? "negative" : "positive";
    nHigh = drawPower(kind); nLow = drawPower(kind);
    while (nHigh === nLow) nLow = drawPower(kind);
    if (nHigh < nLow) [nHigh, nLow] = [nLow, nHigh];
  }
  // the number with the higher power is bigger; misleading puts the larger coefficient on the smaller number
  let tHigh: number, tLow: number;
  if (misleading) { tHigh = randT(10, 50); tLow = randT(tHigh + 10, 99); }
  else { tLow = randT(); tHigh = randT(); }
  return [{ t: tHigh, n: nHigh }, { t: tLow, n: nLow }];
};

const compareWorking = (left: SF, right: SF): WorkingStep[] => {
  const sign = cmp(left, right) > 0 ? "\\gt" : "\\lt";
  const answer = `${texSF(left)} ${sign} ${texSF(right)}`;
  if (left.n === right.n) {
    const s2 = left.t > right.t ? "\\gt" : "\\lt";
    return [
      mStep("The powers of 10 are the same, so compare the coefficients:", `${coef(left.t)} ${s2} ${coef(right.t)}`),
      mStep("Answer:", answer),
    ];
  }
  const s1 = left.n > right.n ? "\\gt" : "\\lt";
  const negative = left.n < 0 && right.n < 0;
  const steps = [mStep(negative ? "Compare the powers of 10 first (the one closer to zero is bigger):" : "Compare the powers of 10 first:", `${left.n} ${s1} ${right.n}`)];
  // when the bigger coefficient is on the smaller number, say so: this is the slip the question is built to catch
  if (left.t !== right.t && (left.t > right.t) !== (left.n > right.n)) {
    steps.push(mStep("The coefficients do not decide it when the powers differ:", `${coef(left.t)} ${left.t > right.t ? "\\gt" : "\\lt"} ${coef(right.t)}`));
  }
  steps.push(mStep("The bigger power is the bigger number:", answer));
  return steps;
};

const genCompare = (msv: Record<string, boolean>): AnyQuestion => {
  const powers = pickActive(msv, POWERS_MS.options);
  const wantMisleading = powers !== "equal" && pickActive(msv, COEFFICIENTS_MS.options) === "misleading";
  const [high, low] = drawPair(powers, wantMisleading);
  const flip = Math.random() < 0.5;
  const left = flip ? low : high, right = flip ? high : low;
  const bigger = cmp(left, right) > 0;
  const rv: CompareRaw = { left, right };
  return {
    kind: "worded",
    lines: ["Insert $\\lt$ or $\\gt$:", `$${texSF(left)}$ $\\, \\square \\,$ $${texSF(right)}$`],
    answer: `${coef(left.t)} × 10^${left.n} ${bigger ? ">" : "<"} ${coef(right.t)} × 10^${right.n}`,
    answerLatex: `${texSF(left)} ${bigger ? "\\gt" : "\\lt"} ${texSF(right)}`,
    working: compareWorking(left, right),
    _rawValues: rv,
    key: `sf-compare-${powers}${wantMisleading ? "-mis" : ""}-${coef(left.t)}e${left.n}-${coef(right.t)}e${right.n}`,
    difficulty: "level1",
  } as unknown as AnyQuestion;
};

// ── 6. Level 2: put four numbers in order ─────────────────────────────────

const ORDER_COUNT = 4;

const drawPowerSet = (kind: string): number[] => {
  const one = (): number => {
    const k = kind === "mixed" ? (Math.random() < 0.5 ? "positive" : "negative") : (kind as "positive" | "negative");
    return drawPower(k);
  };
  const powers: number[] = [];
  while (powers.length < ORDER_COUNT) {
    // about half the lists share a power between two numbers, so the coefficients have to decide as well
    if (powers.length === 1 && Math.random() < 0.5) { powers.push(powers[0]); continue; }
    const n = one();
    if (!powers.includes(n)) powers.push(n);
  }
  // a "mixed" list must really contain both signs
  if (kind === "mixed" && (powers.every((n) => n > 0) || powers.every((n) => n < 0))) {
    powers[powers.length - 1] = powers[0] > 0 ? -randInt(2, 9) : randInt(2, 9);
  }
  return powers;
};

const drawList = (kind: string): SF[] => {
  for (;;) {
    const list = drawPowerSet(kind).map((n) => ({ t: randT(), n }));
    const distinct = list.every((x, i) => list.findIndex((y) => same(x, y)) === i);
    // a shared power must be told apart by its coefficients, so they need a clear gap
    const clearGap = list.every((x, i) => list.every((y, j) => i === j || x.n !== y.n || Math.abs(x.t - y.t) >= 5));
    if (distinct && clearGap) return list;
  }
};

const orderWorking = (ascending: SF[], smallestFirst: boolean): WorkingStep[] => {
  const powers = [...new Set(ascending.map((x) => x.n))];
  const steps: WorkingStep[] = [
    mStep(
      "Put the powers of 10 in order, smallest first:",
      [`${powers[0]}`, ...powers.slice(1).map((n) => `\\lt ${n}`)],
    ),
  ];
  for (const n of powers) {
    const group = ascending.filter((x) => x.n === n);
    if (group.length > 1) {
      steps.push(mStep(
        `Two numbers share the power ${n}, so compare their coefficients:`,
        group.map((x) => coef(x.t)).reduce<string[]>((acc, c, i) => (i === 0 ? [c] : [...acc, `\\lt ${c}`]), []),
      ));
    }
  }
  steps.push(mStep("Smallest first:", ascending.map(texSF).join(",\\ ")));
  if (!smallestFirst) steps.push(mStep("The question asks for largest first, so reverse the list:", [...ascending].reverse().map(texSF).join(",\\ ")));
  return steps;
};

const genOrder = (msv: Record<string, boolean>): AnyQuestion => {
  const kind = pickActive(msv, ORDER_POWERS_MS.options);
  const smallestFirst = pickActive(msv, ASK_FOR_MS.options) !== "largest";
  const list = drawList(kind);
  const ascending = [...list].sort(cmp);
  const shown = shuffle(list);
  // never show the list already in the answer order
  const asked = smallestFirst ? ascending : [...ascending].reverse();
  const display = shown.every((x, i) => same(x, asked[i])) ? [...shown].reverse() : shown;
  return {
    kind: "worded",
    lines: [
      smallestFirst ? "Write these in order, smallest first:" : "Write these in order, largest first:",
      `$${display.map(texSF).join(",\\ ")}$`,
    ],
    answer: asked.map((x) => `${coef(x.t)} × 10^${x.n}`).join(", "),
    answerLatex: asked.map(texSF).join(",\\ "),
    working: orderWorking(ascending, smallestFirst),
    _rawValues: { list },
    key: `sf-order-${smallestFirst ? "up" : "down"}-${[...display].map((x) => `${coef(x.t)}e${x.n}`).join("_")}`,
    difficulty: "level2",
  } as unknown as AnyQuestion;
};

// ── 7. generateQuestion ───────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "converting") return genConvert(level, multiSelectValues);
  if (t === "multiplyDivide") return genMulDiv(level, multiSelectValues);
  if (t === "addSubtract") return genAddSub(level, multiSelectValues);
  return level === "level1" ? genCompare(multiSelectValues) : genOrder(multiSelectValues);
};

// ────────────────────────────────────────────────────────────────────────

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion };

// The Converting tab's developing picture: the place value grid with one row of digits that slides, and a Power cell that rolls. On the whiteboard it starts empty in the
// working box and fills when the answer is shown; in the worked example each step is a snapshot of it (`pvStep`). Questions from the
// other tabs carry no `_grid`, so the scaffold and the step renderers leave them alone.
const workingScaffold = {
  label: "place value grid",
  render: (q: AnyQuestion, showAnswer: boolean, qo?: QOSnapshot): JSX.Element | null => {
    const spec = extras(q)._grid as GridSpec | undefined;
    if (!spec) return null;
    return <ShiftGrid frame={showAnswer ? gridFinal(spec) : gridBlank(spec)} words={!!qo?.variables?.[PV_WORD_HEADERS_KEY]} />;
  },
};

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      stepRenderer={shiftStepRenderer}
      stepVisualRenderer={shiftStepVisual}
      workingScaffold={workingScaffold}
      defaults={{ numQuestions: 6, numColumns: 2 }}
    />
  );
}
