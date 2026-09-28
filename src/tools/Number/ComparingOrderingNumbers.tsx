import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  type ToolMultiSelect, type ToolDropdown,
  randInt, pick, mStep, tStep, pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// Comparing & Ordering Numbers — specs/comparing-ordering-numbers.md
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "compare" | "order";
type TrapType = "clean" | "longerIsSmaller" | "shorterIsSmaller" | "wrongPriority" | "ignoreWholePart";
type WholeMode = "zeroOnly" | "nonzero" | "mixed";

// Unsigned decimal: whole part + up to 3 decimal digits (tenths, hundredths, thousandths).
interface Dec { whole: number; d: number[]; }
// A number with a sign attached.
interface SignedDec { mag: Dec; sign: 1 | -1; }

// ── 2. QO definitions ────────────────────────────────────────────────────────

// Words-before-symbols is a genuine easy→hard progression, so this is a
// weighted 2-option pool (renders as the compact cycle button, same as
// wholeNumberPart/sign) rather than a plain dropdown — a teacher can mix
// both notations into one worksheet, not just pick one for the whole sheet.
const NOTATION_MS: ToolMultiSelect = {
  key: "notation", label: "Notation",
  options: [
    { value: "words", label: "Words", defaultActive: true, weight: 1 },
    { value: "symbols", label: "Symbols", defaultActive: false, weight: 2 },
  ],
};

const WHOLE_PART_MS: ToolMultiSelect = {
  key: "wholeNumberPart", label: "Whole-number part",
  options: [
    { value: "zeroOnly", label: "0.__ only", defaultActive: true, weight: 1 },
    { value: "nonzero", label: "Allow whole numbers", defaultActive: false, weight: 2 },
  ],
};

const TRAP_TYPE_MS: ToolMultiSelect = {
  key: "trapType", label: "Trap type",
  options: [
    { value: "clean", label: "No trap", defaultActive: true },
    { value: "longerIsSmaller", label: "Longer looks smaller", defaultActive: true },
    { value: "shorterIsSmaller", label: "Shorter looks smaller", defaultActive: true },
    { value: "wrongPriority", label: "Wrong-priority digit", defaultActive: true },
    { value: "ignoreWholePart", label: "Ignore the whole number", defaultActive: true },
  ],
};

const SIGN_MS: ToolMultiSelect = {
  key: "sign", label: "Sign",
  options: [
    { value: "positive", label: "Positive", defaultActive: false, weight: 1 },
    { value: "negative", label: "Negative", defaultActive: true, weight: 2 },
  ],
};

const DIRECTION_MS: ToolMultiSelect = {
  key: "direction", label: "Direction",
  options: [
    { value: "ascending", label: "Ascending", defaultActive: true },
    { value: "descending", label: "Descending", defaultActive: true },
  ],
};

// `count` is Order's dropdown slot (Notation moved to multiSelect above,
// freeing it up) — every level still offers the full 3–6 range, only the
// pre-selected default differs per level.
const countDD = (defaultVal: "3" | "4" | "5" | "6"): ToolDropdown => ({
  key: "count", label: "How many numbers",
  options: (["3", "4", "5", "6"] as const).map((v) => ({ value: v, label: v })),
  defaultValue: defaultVal,
});

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Comparing & Ordering Numbers",
  tools: {

    compare: {
      name: "Compare",
      dropdown: null,
      variables: [],
      difficultySettings: {
        level1: { dropdown: null, variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, NOTATION_MS] },
        level2: { dropdown: null, variables: [], multiSelect: [SIGN_MS, NOTATION_MS] },
        level3: { dropdown: null, variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, SIGN_MS, NOTATION_MS] },
      },
    },

    order: {
      name: "Order",
      dropdown: countDD("3"),
      variables: [],
      difficultySettings: {
        level1: { dropdown: countDD("3"), variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, DIRECTION_MS, NOTATION_MS] },
        level2: { dropdown: countDD("4"), variables: [], multiSelect: [SIGN_MS, DIRECTION_MS, NOTATION_MS] },
        level3: { dropdown: countDD("5"), variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, SIGN_MS, DIRECTION_MS, NOTATION_MS] },
      },
    },

  },
};

// ── 4. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Compare", icon: "⚖️", content: [
    { label: "Overview", detail: "Compare two numbers and say which is bigger — first in plain words, then with < and >. Choose exactly which decimal misconception(s) to drill with the Trap type control, or leave all active for natural variety." },
    { label: "Level 1 — Decimals", detail: "Pure 0.___ comparison up to thousandths. Trap type lets you isolate 'longer looks smaller', 'shorter looks smaller', 'wrong-priority digit' or 'ignore the whole number' — or mix them. 'Allow whole numbers' turns on the whole-number-part trap." },
    { label: "Level 2 — Integers", detail: "Sign dial (Positive-only → Mixed → Negative-only) targets 'the bigger positive number is the bigger negative number'." },
    { label: "Level 3 — Decimals + sign", detail: "Both trap families together." },
  ]},
  { title: "Order", icon: "🔢", content: [
    { label: "Overview", detail: "Order 3–6 numbers, smallest to largest or largest to smallest — in words, then as an inequality chain. Choose how many numbers and which traps are active at every level." },
    { label: "Level 1 / 2 / 3", detail: "Same trap families as Compare, sustained across a list — several different traps can appear in the same list." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Notation", detail: "Words-only → Mixed → Symbols-only cycle. Changing it reformats the current question instantly — no regeneration." },
    { label: "Whole-number part", detail: "None → Mixed → Exclusive cycle: every number 0.___, a blend, or every number with a whole-number part." },
    { label: "Trap type", detail: "Tick which named misconceptions can appear. Untick 'No trap' to force a trap every question." },
    { label: "Sign", detail: "Positive-only → Mixed → Negative-only cycle." },
    { label: "Direction (Order)", detail: "Ascending, descending, or a mix." },
    { label: "How many numbers (Order)", detail: "3–6, available at every level." },
  ]},
];

// ── 5. Decimal value / formatting helpers ────────────────────────────────────

const decValue = (n: Dec): number => n.whole + n.d.reduce((acc, dig, i) => acc + dig / Math.pow(10, i + 1), 0);
const decStr = (n: Dec): string => (n.d.length ? `${n.whole}.${n.d.join("")}` : `${n.whole}`);
const signedValue = (n: SignedDec): number => n.sign * decValue(n.mag);
const signedStr = (n: SignedDec): string => (n.sign < 0 ? `-${decStr(n.mag)}` : decStr(n.mag));

const isActive = (msv: Record<string, boolean>, value: string) => msv[value] !== false;

const wholePartMode = (msv: Record<string, boolean>): WholeMode => {
  const zero = isActive(msv, "zeroOnly");
  const nonzero = isActive(msv, "nonzero");
  if (zero && nonzero) return "mixed";
  if (nonzero) return "nonzero";
  return "zeroOnly";
};

const drawWhole = (mode: WholeMode): number => {
  if (mode === "zeroOnly") return 0;
  if (mode === "nonzero") return randInt(1, 9);
  return Math.random() < 0.5 ? 0 : randInt(1, 9);
};

const randDigits = (dp: number): number[] => Array.from({ length: dp }, () => randInt(0, 9));

// ── 6. Decimal magnitude chain construction (the four decimal trap archetypes) ─

const buildFirstDec = (mode: WholeMode): Dec => {
  const whole = drawWhole(mode);
  // Biased toward dp >= 2 so the next gap's trap construction (most of which
  // need an anchor with room to work with — see buildNextDec) is feasible
  // more often, rather than silently falling back to `clean`.
  const dp = pick([1, 2, 2, 3, 3]);
  const d: number[] = randDigits(dp);
  const allZero = d.reduce((acc, x) => acc && x === 0, true);
  if (whole === 0 && allZero) d[0] = randInt(1, 9);
  return { whole, d };
};

// Builds a Dec strictly greater than `anchor`, attempting the requested trap
// and falling back to `clean` whenever the anchor's fixed shape can't support it.
const buildNextDec = (anchor: Dec, trap: TrapType, mode: WholeMode): Dec => {
  const tryLongerIsSmaller = (): Dec | null => {
    if (anchor.d.length < 2 || anchor.d[0] >= 9) return null;
    const dp = randInt(1, anchor.d.length - 1);
    const tenths = randInt(anchor.d[0] + 1, 9);
    return { whole: anchor.whole, d: [tenths, ...randDigits(dp - 1)] };
  };

  const tryShorterIsSmaller = (): Dec | null => {
    if (anchor.d.length >= 3) return null;
    return { whole: anchor.whole, d: [...anchor.d, randInt(1, 9)] };
  };

  const tryWrongPriority = (): Dec | null => {
    // anchor plays the loser: its own hundredths digit must already be
    // nonzero, or there is no decoy for the winner's later digits to lose to.
    if (anchor.d.length < 2 || anchor.d[0] >= 9 || anchor.d[1] === 0) return null;
    return { whole: anchor.whole, d: [randInt(anchor.d[0] + 1, 9)] };
  };

  const tryIgnoreWholePart = (): Dec | null => {
    if (mode === "zeroOnly" || anchor.d[0] === undefined || anchor.d[0] === 0) return null;
    const whole = anchor.whole + randInt(1, 9);
    const dp = randInt(1, 3);
    return { whole, d: [randInt(0, anchor.d[0] - 1), ...randDigits(dp - 1)] };
  };

  const clean = (): Dec => {
    const differWhole = mode !== "zeroOnly" && Math.random() < 0.5;
    if (differWhole) {
      const whole = anchor.whole + randInt(1, 9);
      const dp = randInt(1, 3);
      return { whole, d: randDigits(dp) };
    }
    const dp = randInt(1, 3);
    if (anchor.d[0] === undefined || anchor.d[0] < 9) {
      const tenths = randInt((anchor.d[0] ?? -1) + 1, 9);
      return { whole: anchor.whole, d: [tenths, ...randDigits(dp - 1)] };
    }
    // anchor's tenths digit is already 9 — fall back to a bigger whole part.
    return { whole: anchor.whole + randInt(1, 9), d: randDigits(dp) };
  };

  const attempt =
    trap === "longerIsSmaller" ? tryLongerIsSmaller() :
    trap === "shorterIsSmaller" ? tryShorterIsSmaller() :
    trap === "wrongPriority" ? tryWrongPriority() :
    trap === "ignoreWholePart" ? tryIgnoreWholePart() :
    null;

  return attempt ?? clean();
};

// Builds `count` distinct decimals in ascending order, each adjacent gap
// independently drawing a trap type from the active pool (§3.2 of the spec).
const buildDecChain = (count: number, mode: WholeMode, msv: Record<string, boolean>): Dec[] => {
  const chain: Dec[] = [buildFirstDec(mode)];
  for (let i = 1; i < count; i++) {
    const trap = pickActive(msv, TRAP_TYPE_MS.options) as TrapType;
    chain.push(buildNextDec(chain[i - 1], trap, mode));
  }
  return chain;
};

// ── 7. Sign application ───────────────────────────────────────────────────────

// Applies the `sign` QO to an ascending magnitude chain, returning a final
// list sorted by true signed value. Exclusive states keep the trap chain's
// relative shape intact (just uniformly negated); Mixed assigns each
// magnitude an independent sign and resorts.
const applySign = (mags: Dec[], msv: Record<string, boolean>, signPoolActive: boolean): SignedDec[] => {
  if (!signPoolActive) return mags.map((mag) => ({ mag, sign: 1 as const }));
  const posActive = isActive(msv, "positive");
  const negActive = isActive(msv, "negative");
  if (negActive && !posActive) return [...mags].reverse().map((mag) => ({ mag, sign: -1 as const }));
  if (posActive && !negActive) return mags.map((mag) => ({ mag, sign: 1 as const }));
  const signed = mags.map((mag) => ({ mag, sign: (pickActive(msv, SIGN_MS.options) === "negative" ? -1 : 1) as 1 | -1 }));
  return signed.sort((a, b) => signedValue(a) - signedValue(b));
};

// ── 8. Working-step generation (general place-value column walk) ─────────────

const place = (i: number) => (i === 0 ? "tenths" : i === 1 ? "hundredths" : "thousandths");

// Explains which of two positive magnitudes is bigger, column by column.
const magnitudeSteps = (a: Dec, b: Dec): { steps: WorkingStep[]; aBigger: boolean } => {
  if (a.whole !== b.whole) {
    return {
      steps: [mStep("Compare the whole number parts:", `${a.whole} ${a.whole > b.whole ? ">" : "<"} ${b.whole}`)],
      aBigger: a.whole > b.whole,
    };
  }
  const steps: WorkingStep[] = a.whole > 0 || b.whole > 0 ? [tStep("The whole number parts match, so compare the decimal digits.")] : [];
  const maxDp = Math.max(a.d.length, b.d.length);
  for (let i = 0; i < maxDp; i++) {
    const da = a.d[i] ?? 0, db = b.d[i] ?? 0;
    if (da !== db) {
      steps.push(mStep(`Compare the ${place(i)} digit:`, `${da} ${da > db ? ">" : "<"} ${db}`));
      return { steps, aBigger: da > db };
    }
  }
  return { steps, aBigger: true };
};

// Explains which of two signed numbers is bigger.
const signedSteps = (a: SignedDec, b: SignedDec): { steps: WorkingStep[]; aBigger: boolean } => {
  if (a.sign !== b.sign) {
    const aPos = a.sign > 0;
    return {
      steps: [mStep("A negative number is always less than a positive number:", `${signedStr(a)} ${aPos ? ">" : "<"} ${signedStr(b)}`)],
      aBigger: aPos,
    };
  }
  if (a.sign > 0) return magnitudeSteps(a.mag, b.mag);
  const { steps: magSteps, aBigger: aMagBigger } = magnitudeSteps(a.mag, b.mag);
  const steps: WorkingStep[] = [
    mStep("Compare the sizes, ignoring the negative signs:", `${decStr(a.mag)} ${aMagBigger ? ">" : "<"} ${decStr(b.mag)}`),
    ...magSteps.slice(1),
    mStep("Negative numbers reverse the order:", `${signedStr(a)} ${!aMagBigger ? ">" : "<"} ${signedStr(b)}`),
  ];
  return { steps, aBigger: !aMagBigger };
};

// ── 9. Compare generator ──────────────────────────────────────────────────────

interface CompareRaw { a: SignedDec; b: SignedDec; swapped: boolean; notation: string; }

const buildCompareDisplay = (rv: CompareRaw, notation: string) => {
  const { a, b, swapped } = rv;
  const left = swapped ? b : a;
  const right = swapped ? a : b;
  const leftBigger = signedValue(left) > signedValue(right);
  const { steps } = signedSteps(a, b);

  if (notation === "symbols") {
    return {
      lines: [`Insert $<$ or $>$: $${signedStr(left)}$ $\\, \\square \\,$ $${signedStr(right)}$`],
      answer: `${signedStr(left)} ${leftBigger ? ">" : "<"} ${signedStr(right)}`,
      answerLatex: `${signedStr(left)} ${leftBigger ? "\\gt" : "\\lt"} ${signedStr(right)}`,
      working: steps,
    };
  }
  const biggerVal = leftBigger ? left : right;
  return {
    lines: [`Which is bigger: $${signedStr(left)}$ or $${signedStr(right)}$?`],
    answer: signedStr(biggerVal),
    answerLatex: signedStr(biggerVal),
    working: steps,
  };
};

const genCompareQuestion = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
  const id = randInt(0, 999999);
  const notation = pickActive(msv, NOTATION_MS.options);
  let a: SignedDec, b: SignedDec;

  if (level === "level2") {
    let magA = randInt(1, 20), magB = randInt(1, 20);
    while (magA === magB) magB = randInt(1, 20);
    const [lo, hi] = magA < magB ? [magA, magB] : [magB, magA];
    const mags = [{ whole: lo, d: [] }, { whole: hi, d: [] }];
    [a, b] = applySign(mags, msv, true);
  } else {
    const mode = wholePartMode(msv);
    const mags = buildDecChain(2, mode, msv);
    [a, b] = applySign(mags, msv, level === "level3");
  }

  const swapped = Math.random() < 0.5;
  const built = buildCompareDisplay({ a, b, swapped, notation }, notation);

  return {
    kind: "worded",
    lines: built.lines,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: { a, b, swapped, notation } as CompareRaw,
    key: `compare-${level}-${signedStr(a)}-${signedStr(b)}-${notation}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 10. Order generator ───────────────────────────────────────────────────────

interface OrderRaw { values: SignedDec[]; direction: "ascending" | "descending"; notation: string; }

const buildOrderDisplay = (rv: OrderRaw, notation: string) => {
  const { values, direction } = rv;
  const ordered = direction === "ascending" ? values : [...values].reverse();
  const shuffled = [...values].sort(() => Math.random() - 0.5);
  const firstWord = direction === "ascending" ? "smallest" : "largest";

  const working: WorkingStep[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const { steps } = signedSteps(values[i], values[i + 1]);
    working.push(...steps);
  }

  if (notation === "symbols") {
    const op = direction === "ascending" ? "<" : ">";
    return {
      lines: [`Write as a chain, ${firstWord} first: $${shuffled.map(signedStr).join(", ")}$`],
      answer: ordered.map(signedStr).join(` ${op} `),
      answerLatex: ordered.map(signedStr).join(direction === "ascending" ? " \\lt " : " \\gt "),
      working,
    };
  }
  return {
    lines: [`Order ${firstWord} first: $${shuffled.map(signedStr).join(", ")}$`],
    answer: ordered.map(signedStr).join(", "),
    answerLatex: ordered.map(signedStr).join(",\\ "),
    working,
  };
};

const genOrderQuestion = (level: DifficultyLevel, msv: Record<string, boolean>, dropdownValue: string): AnyQuestion => {
  const id = randInt(0, 999999);
  const count = parseInt(dropdownValue, 10) || 3;
  const notation = pickActive(msv, NOTATION_MS.options);
  const direction = pickActive(msv, DIRECTION_MS.options) as "ascending" | "descending";

  let values: SignedDec[];
  if (level === "level2") {
    const mags = new Set<number>();
    while (mags.size < count) mags.add(randInt(1, 20));
    const sorted = [...mags].sort((x, y) => x - y).map((whole) => ({ whole, d: [] as number[] }));
    values = applySign(sorted, msv, true);
  } else {
    const mode = wholePartMode(msv);
    const mags = buildDecChain(count, mode, msv);
    values = applySign(mags, msv, level === "level3");
  }

  const built = buildOrderDisplay({ values, direction, notation }, notation);

  return {
    kind: "worded",
    lines: built.lines,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: { values, direction, notation } as OrderRaw,
    key: `order-${level}-${values.map(signedStr).join("_")}-${notation}-${direction}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 11. generateQuestion / reformatQuestion ───────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  return t === "order"
    ? genOrderQuestion(level, multiSelectValues, dropdownValue)
    : genCompareQuestion(level, multiSelectValues);
};

// Resolves Notation from the live QO state, keeping the previous choice when
// both Words and Symbols are still active (avoids the display flickering
// between them on every unrelated QO change, since pickActive is random).
const resolveNotation = (msv: Record<string, boolean>, previous: string): string => {
  const wordsActive = isActive(msv, "words");
  const symbolsActive = isActive(msv, "symbols");
  if (wordsActive && !symbolsActive) return "words";
  if (symbolsActive && !wordsActive) return "symbols";
  return previous;
};

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const compareRv = (q as any)._rawValues as CompareRaw | undefined;
  if (compareRv && "a" in compareRv) {
    const notation = resolveNotation(qo.multiSelectValues, compareRv.notation);
    const built = buildCompareDisplay(compareRv, notation);
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _rawValues: { ...compareRv, notation } } as unknown as AnyQuestion;
  }
  const orderRv = (q as any)._rawValues as OrderRaw | undefined;
  if (orderRv && "values" in orderRv) {
    // A count change is a structural change (a different number of values) —
    // let ToolShell regenerate rather than trying to reformat in place.
    if (parseInt(qo.dropdownValue, 10) !== orderRv.values.length) return null;
    const ascActive = isActive(qo.multiSelectValues, "ascending");
    const descActive = isActive(qo.multiSelectValues, "descending");
    const direction: OrderRaw["direction"] =
      ascActive && !descActive ? "ascending" :
      descActive && !ascActive ? "descending" :
      orderRv.direction;
    const notation = resolveNotation(qo.multiSelectValues, orderRv.notation);
    const built = buildOrderDisplay({ values: orderRv.values, direction, notation }, notation);
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _rawValues: { ...orderRv, direction, notation } } as unknown as AnyQuestion;
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
    />
  );
}
