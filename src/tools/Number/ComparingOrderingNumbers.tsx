import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  type ToolMultiSelect, type ToolDropdown,
  randInt, pick, tStep, pickActive,
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

// Plain 2-cell multiSelect pill row (no `weight`, so it does NOT trigger the
// compact None/Mixed/Exclusive cycle button) — each option toggles
// independently, e.g. tick both Words and Symbols to mix them into one
// worksheet, exactly like any other question-type pool on the site.
const NOTATION_MS: ToolMultiSelect = {
  key: "notation", label: "Notation",
  options: [
    { value: "words", label: "Words", defaultActive: true },
    { value: "symbols", label: "Symbols", defaultActive: false },
  ],
};

const WHOLE_PART_MS: ToolMultiSelect = {
  key: "wholeNumberPart", label: "Whole-number part",
  options: [
    { value: "zeroOnly", label: "0.__ only", defaultActive: true },
    { value: "nonzero", label: "Allow whole numbers", defaultActive: false },
  ],
};

// Short labels so all five buttons fit one row without heavy wrapping.
const TRAP_TYPE_MS: ToolMultiSelect = {
  key: "trapType", label: "Trap type",
  options: [
    { value: "clean", label: "No trap", defaultActive: true },
    { value: "longerIsSmaller", label: "Longer trap", defaultActive: true },
    { value: "shorterIsSmaller", label: "Shorter trap", defaultActive: true },
    { value: "wrongPriority", label: "Priority trap", defaultActive: true },
    { value: "ignoreWholePart", label: "Whole-part trap", defaultActive: true },
  ],
};

// No "positive only" state — the lesson this tool serves is specifically
// about negatives, so the pool is just Negative (focused drill) vs Mixed
// (harder: positive and negative together, testing sign-dominance too).
// pickActive draws one MODE per question from whichever are active.
const SIGN_MS: ToolMultiSelect = {
  key: "sign", label: "Sign",
  options: [
    { value: "negative", label: "Negative", defaultActive: true },
    { value: "mixed", label: "Mixed", defaultActive: false },
  ],
};

// Four wording variants, two of which share each actual sort direction —
// "ascending"/"smallest to largest" both sort ascending but phrase the
// question differently, and likewise for descending/"largest to smallest".
const DIRECTION_MS: ToolMultiSelect = {
  key: "direction", label: "Direction",
  options: [
    { value: "ascending", label: "Ascending", defaultActive: true },
    { value: "descending", label: "Descending", defaultActive: true },
    { value: "smallestToLargest", label: "Smallest to largest", defaultActive: true },
    { value: "largestToSmallest", label: "Largest to smallest", defaultActive: true },
  ],
};

const DIRECTION_INFO: Record<string, { sort: "ascending" | "descending"; phrase: string }> = {
  ascending: { sort: "ascending", phrase: "ascending" },
  descending: { sort: "descending", phrase: "descending" },
  smallestToLargest: { sort: "ascending", phrase: "smallest to largest" },
  largestToSmallest: { sort: "descending", phrase: "largest to smallest" },
};

// Compare's Words-mode phrasing ("Which is bigger?" / "Which is smaller?").
// Order doesn't need this — Direction already covers the equivalent idea for a list.
const ASK_MS: ToolMultiSelect = {
  key: "ask", label: "Ask",
  options: [
    { value: "bigger", label: "Bigger", defaultActive: true },
    { value: "smaller", label: "Smaller", defaultActive: true },
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
        level1: { dropdown: null, variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, NOTATION_MS, ASK_MS] },
        level2: { dropdown: null, variables: [], multiSelect: [SIGN_MS, NOTATION_MS, ASK_MS] },
        level3: { dropdown: null, variables: [], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, SIGN_MS, NOTATION_MS, ASK_MS] },
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
    { label: "Level 1 — Decimals", detail: "Pure 0.___ comparison up to thousandths, built from named misconception traps: a longer decimal that's actually smaller, a shorter one that's actually smaller, a decoy in the later digits, or an unequal whole-number part with a decoy tenths digit. 'Allow whole numbers' turns the whole-number-part trap on." },
    { label: "Level 2 — Integers", detail: "Sign: Negative (focused drill) or Mixed (harder — positive and negative together) target 'the bigger positive number is the bigger negative number'." },
    { label: "Level 3 — Decimals + sign", detail: "Both trap families together." },
  ]},
  { title: "Order", icon: "🔢", content: [
    { label: "Overview", detail: "Order 3–6 numbers, smallest to largest or largest to smallest — in words, then as an inequality chain. Choose how many numbers and which traps are active at every level." },
    { label: "Level 1 / 2 / 3", detail: "Same trap families as Compare, sustained across a list — several different traps can appear in the same list." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right." },
    { label: "Worked Example", detail: "Step-by-step solution shown as a place-value table — the decisive digit for each number is circled, and rows are numbered in order." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Notation", detail: "Tick Words and/or Symbols — both active mixes them into one worksheet. Changing it reformats the current question instantly — no regeneration." },
    { label: "Whole-number part", detail: "Tick '0.__ only' and/or 'Allow whole numbers' — both active mixes pure decimals with whole-number-part decimals in one worksheet." },
    { label: "Trap type", detail: "Tick which named misconceptions can appear. Untick 'No trap' to force a trap every question." },
    { label: "Sign", detail: "Negative (focused drill) and/or Mixed (harder — includes positive numbers)." },
    { label: "Ask (Compare)", detail: "Tick 'Bigger' and/or 'Smaller' to control the Words-mode phrasing." },
    { label: "Direction (Order)", detail: "Ascending / Descending / Smallest to largest / Largest to smallest — the first two are mathematical terms, the last two everyday phrasing for the same two directions." },
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
// and falling back to `clean` whenever the anchor's fixed shape can't
// support it. Returns null only in the astronomically rare case where
// `mode` is zeroOnly and `anchor` is already the maximum representable
// zeroOnly value (…999 at 3dp) — the caller (buildDecChain) restarts.
const buildNextDec = (anchor: Dec, trap: TrapType, mode: WholeMode): Dec | null => {
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

  // NEVER bumps the whole part when `mode === "zeroOnly"` — that would
  // silently defeat the "0.___ only" setting (the bug behind numbers like
  // -2.644 showing up despite Whole-number part being pinned to zeroOnly).
  const clean = (): Dec | null => {
    const differWhole = mode !== "zeroOnly" && Math.random() < 0.5;
    if (differWhole) {
      const whole = anchor.whole + randInt(1, 9);
      const dp = randInt(1, 3);
      return { whole, d: randDigits(dp) };
    }
    if (anchor.d[0] === undefined || anchor.d[0] < 9) {
      const dp = randInt(1, 3);
      const tenths = randInt((anchor.d[0] ?? -1) + 1, 9);
      return { whole: anchor.whole, d: [tenths, ...randDigits(dp - 1)] };
    }
    // Tenths digit already 9 — extend with another decimal place instead of
    // touching the whole part.
    if (anchor.d.length < 3) {
      return { whole: anchor.whole, d: [...anchor.d, randInt(1, 9)] };
    }
    // Full 3dp and tenths already 9 — only now may the whole part grow, and
    // only when the mode actually allows a non-zero one.
    if (mode !== "zeroOnly") {
      const dp = randInt(1, 3);
      return { whole: anchor.whole + randInt(1, 9), d: randDigits(dp) };
    }
    // zeroOnly with anchor already at the max representable value (…999) —
    // no larger zeroOnly value exists at ≤3dp.
    return null;
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
// independently drawing a trap type from the active pool (§3.2 of the
// spec). Retries the whole chain in the vanishingly rare case buildNextDec
// hits a genuine dead end (see its docstring).
const buildDecChain = (count: number, mode: WholeMode, msv: Record<string, boolean>): Dec[] => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const chain: Dec[] = [buildFirstDec(mode)];
    let stuck = false;
    for (let i = 1; i < count; i++) {
      const trap = pickActive(msv, TRAP_TYPE_MS.options) as TrapType;
      const next = buildNextDec(chain[i - 1], trap, mode);
      if (next === null) { stuck = true; break; }
      chain.push(next);
    }
    if (!stuck) return chain;
  }
  // Never actually reached in practice — safe distinct fallback.
  return Array.from({ length: count }, (_, i) => ({ whole: 0, d: [0, 0, i + 1] }));
};

// ── 7. Sign application ───────────────────────────────────────────────────────

// Applies the `sign` QO to an ascending magnitude chain, returning a final
// list sorted by true signed value. One MODE is drawn per question from
// whichever of Negative/Mixed are active: "negative" keeps the trap chain's
// relative shape intact (just uniformly negated); "mixed" assigns each
// magnitude an independent sign and resorts.
const applySign = (mags: Dec[], msv: Record<string, boolean>, signPoolActive: boolean): SignedDec[] => {
  if (!signPoolActive) return mags.map((mag) => ({ mag, sign: 1 as const }));
  const mode = pickActive(msv, SIGN_MS.options);
  if (mode === "negative") return [...mags].reverse().map((mag) => ({ mag, sign: -1 as const }));
  const signed = mags.map((mag) => ({ mag, sign: (Math.random() < 0.5 ? -1 : 1) as 1 | -1 }));
  return signed.sort((a, b) => signedValue(a) - signedValue(b));
};

// ── 8. Place-value table (the Worked Example working step) ───────────────────

type PVCol = "sign" | "whole" | 0 | 1 | 2;

interface PVRow { sign: 1 | -1; whole: number; d: number[]; circleCol: PVCol; rank: number; }

// The place-value column where two numbers first differ, reading left to
// right (sign, then whole part, then tenths/hundredths/thousandths) — the
// same left-to-right priority the working steps always taught.
const decisiveColumn = (x: SignedDec, y: SignedDec, hasSign: boolean): PVCol => {
  if (hasSign && x.sign !== y.sign) return "sign";
  if (x.mag.whole !== y.mag.whole) return "whole";
  const maxDp = Math.max(x.mag.d.length, y.mag.d.length);
  for (let i = 0; i < maxDp; i++) {
    if ((x.mag.d[i] ?? 0) !== (y.mag.d[i] ?? 0)) return i as 0 | 1 | 2;
  }
  return "whole";
};

// `items` are in DISPLAY order (as shown in the question). Each row's
// circled column is found by comparing it against its closest neighbour in
// true value (the number directly below it in rank, or above if it's the
// smallest) — the digit that settles its place among near-rivals.
const buildPlaceValueTable = (items: SignedDec[], hasSign: boolean): PVRow[] => {
  const sorted = [...items].sort((a, b) => signedValue(a) - signedValue(b));
  const rankOf = new Map<SignedDec, number>();
  sorted.forEach((v, i) => rankOf.set(v, i + 1));
  return items.map((item) => {
    const rank = rankOf.get(item)!;
    const neighbour = rank > 1 ? sorted[rank - 2] : sorted[rank];
    const circleCol = decisiveColumn(item, neighbour, hasSign);
    return { sign: item.sign, whole: item.mag.whole, d: item.mag.d, circleCol, rank };
  });
};

const PV_COL_LABELS = ["Tenths", "Hundredths", "Thousandths"];

const PlaceValueTable = ({ rows, hasSign }: { rows: PVRow[]; hasSign: boolean }) => {
  const maxDp = Math.max(0, ...rows.map((r) => r.d.length));
  const thCls = "border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500";
  const tdCls = "border border-slate-300 px-3 py-2 text-center";
  const circleCls = "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-500 font-semibold text-indigo-700";
  return (
    <div className="mx-auto">
      <p className="mb-2 text-center text-sm text-slate-500">Compare leading digits, then circle and number in order.</p>
      <table className="mx-auto border-collapse text-base">
        <thead>
          <tr>
            {hasSign && <th className={thCls}>Sign</th>}
            <th className={thCls}>Whole</th>
            {maxDp > 0 && <th className={thCls}>.</th>}
            {Array.from({ length: maxDp }, (_, i) => <th key={i} className={thCls}>{PV_COL_LABELS[i]}</th>)}
            <th className={thCls}>Order</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {hasSign && <td className={tdCls}>{row.sign < 0 ? "−" : "+"}</td>}
              <td className={tdCls}>{row.circleCol === "whole" ? <span className={circleCls}>{row.whole}</span> : row.whole}</td>
              {maxDp > 0 && <td className={tdCls}>.</td>}
              {Array.from({ length: maxDp }, (_, i) => {
                const digit = row.d[i];
                const isCircled = row.circleCol === i;
                if (digit === undefined) {
                  // No explicit digit here — if this implicit zero is the
                  // decisive one, show it (dimmed) so the circle has
                  // something to land on; otherwise leave the cell blank.
                  return <td key={i} className={tdCls}>{isCircled ? <span className={`${circleCls} text-slate-400`}>0</span> : ""}</td>;
                }
                return <td key={i} className={tdCls}>{isCircled ? <span className={circleCls}>{digit}</span> : digit}</td>;
              })}
              <td className={`${tdCls} font-semibold`}>{row.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const placeValueStep = (items: SignedDec[], hasSign: boolean): WorkingStep =>
  ({ ...tStep("Compare using a place value table:"), extra: { kind: "placeValueTable", rows: buildPlaceValueTable(items, hasSign), hasSign } }) as WorkingStep;

const stepRenderer = (step: WorkingStep): JSX.Element | null => {
  const extra = (step as any).extra;
  if (extra?.kind !== "placeValueTable") return null;
  return <PlaceValueTable rows={extra.rows} hasSign={extra.hasSign} />;
};

// ── 9. Compare generator ──────────────────────────────────────────────────────

interface CompareRaw { a: SignedDec; b: SignedDec; swapped: boolean; notation: string; ask: "bigger" | "smaller"; hasSign: boolean; }

const buildCompareDisplay = (rv: CompareRaw, notation: string, ask: "bigger" | "smaller") => {
  const { a, b, swapped, hasSign } = rv;
  const left = swapped ? b : a;
  const right = swapped ? a : b;
  const leftBigger = signedValue(left) > signedValue(right);
  const working = [placeValueStep([left, right], hasSign)];

  if (notation === "symbols") {
    return {
      lines: [
        "Insert $<$ or $>$:",
        `$${signedStr(left)}$ $\\, \\square \\,$ $${signedStr(right)}$`,
      ],
      answer: `${signedStr(left)} ${leftBigger ? ">" : "<"} ${signedStr(right)}`,
      answerLatex: `${signedStr(left)} ${leftBigger ? "\\gt" : "\\lt"} ${signedStr(right)}`,
      working,
    };
  }
  const askBigger = ask === "bigger";
  const answerVal = askBigger === leftBigger ? left : right;
  return {
    lines: [
      `Which is ${ask}?`,
      `$${signedStr(left)}$ or $${signedStr(right)}$`,
    ],
    answer: signedStr(answerVal),
    answerLatex: signedStr(answerVal),
    working,
  };
};

const genCompareQuestion = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
  const id = randInt(0, 999999);
  const notation = pickActive(msv, NOTATION_MS.options);
  const ask = pickActive(msv, ASK_MS.options) as "bigger" | "smaller";
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
  const hasSign = level !== "level1";
  const built = buildCompareDisplay({ a, b, swapped, notation, ask, hasSign }, notation, ask);

  return {
    kind: "worded",
    lines: built.lines,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: { a, b, swapped, notation, ask, hasSign } as CompareRaw,
    key: `compare-${level}-${signedStr(a)}-${signedStr(b)}-${notation}-${ask}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 10. Order generator ───────────────────────────────────────────────────────

// `directionOpt` stores which of the 4 DIRECTION_MS wording options was
// drawn; `values` is always the canonical ascending-by-true-value list.
interface OrderRaw { values: SignedDec[]; directionOpt: string; notation: string; hasSign: boolean; }

const buildOrderDisplay = (rv: OrderRaw, notation: string) => {
  const { values, directionOpt, hasSign } = rv;
  const { sort, phrase } = DIRECTION_INFO[directionOpt];
  const ordered = sort === "ascending" ? values : [...values].reverse();
  const shuffled = [...values].sort(() => Math.random() - 0.5);
  const working = [placeValueStep(shuffled, hasSign)];

  if (notation === "symbols") {
    const op = sort === "ascending" ? "<" : ">";
    return {
      lines: [
        `Write as a chain, ${phrase}:`,
        `$${shuffled.map(signedStr).join(", ")}$`,
      ],
      answer: ordered.map(signedStr).join(` ${op} `),
      answerLatex: ordered.map(signedStr).join(sort === "ascending" ? " \\lt " : " \\gt "),
      working,
    };
  }
  return {
    lines: [
      `Order ${phrase}:`,
      `$${shuffled.map(signedStr).join(", ")}$`,
    ],
    answer: ordered.map(signedStr).join(", "),
    answerLatex: ordered.map(signedStr).join(",\\ "),
    working,
  };
};

const genOrderQuestion = (level: DifficultyLevel, msv: Record<string, boolean>, dropdownValue: string): AnyQuestion => {
  const id = randInt(0, 999999);
  const count = parseInt(dropdownValue, 10) || 3;
  const notation = pickActive(msv, NOTATION_MS.options);
  const directionOpt = pickActive(msv, DIRECTION_MS.options);

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

  const hasSign = level !== "level1";
  const built = buildOrderDisplay({ values, directionOpt, notation, hasSign }, notation);

  return {
    kind: "worded",
    lines: built.lines,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: { values, directionOpt, notation, hasSign } as OrderRaw,
    key: `order-${level}-${values.map(signedStr).join("_")}-${notation}-${directionOpt}-${id}`,
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

const resolveAsk = (msv: Record<string, boolean>, previous: "bigger" | "smaller"): "bigger" | "smaller" => {
  const biggerActive = isActive(msv, "bigger");
  const smallerActive = isActive(msv, "smaller");
  if (biggerActive && !smallerActive) return "bigger";
  if (smallerActive && !biggerActive) return "smaller";
  return previous;
};

// Generalises to however many DIRECTION_MS options are active — keeps the
// previous wording choice unless exactly one option is now active.
const resolveDirection = (msv: Record<string, boolean>, previous: string): string => {
  const activeOpts = DIRECTION_MS.options.filter((o) => isActive(msv, o.value)).map((o) => o.value);
  return activeOpts.length === 1 ? activeOpts[0] : previous;
};

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const compareRv = (q as any)._rawValues as CompareRaw | undefined;
  if (compareRv && "a" in compareRv) {
    const notation = resolveNotation(qo.multiSelectValues, compareRv.notation);
    const ask = resolveAsk(qo.multiSelectValues, compareRv.ask);
    const built = buildCompareDisplay(compareRv, notation, ask);
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _rawValues: { ...compareRv, notation, ask } } as unknown as AnyQuestion;
  }
  const orderRv = (q as any)._rawValues as OrderRaw | undefined;
  if (orderRv && "values" in orderRv) {
    // A count change is a structural change (a different number of values) —
    // let ToolShell regenerate rather than trying to reformat in place.
    if (parseInt(qo.dropdownValue, 10) !== orderRv.values.length) return null;
    const directionOpt = resolveDirection(qo.multiSelectValues, orderRv.directionOpt);
    const notation = resolveNotation(qo.multiSelectValues, orderRv.notation);
    const built = buildOrderDisplay({ values: orderRv.values, directionOpt, notation, hasSign: orderRv.hasSign }, notation);
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _rawValues: { ...orderRv, directionOpt, notation } } as unknown as AnyQuestion;
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
      stepRenderer={stepRenderer}
    />
  );
}
