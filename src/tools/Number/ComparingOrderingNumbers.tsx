import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  type ToolMultiSelect, type ToolDropdown,
  randInt, pick, tStep, pickActive,
  InlineMath, AnswerDisplay, PlaceValueTable, pvColumnSet, PV_WORD_HEADERS_VAR, PV_WORD_HEADERS_KEY, type PlaceValueTableData, type PVCell,
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

const DIRECTION_INFO: Record<string, { sort: "ascending" | "descending"; sentence: string }> = {
  ascending: { sort: "ascending", sentence: "Write in ascending order:" },
  descending: { sort: "descending", sentence: "Write in descending order:" },
  smallestToLargest: { sort: "ascending", sentence: "Order from smallest to largest:" },
  largestToSmallest: { sort: "descending", sentence: "Order from largest to smallest:" },
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
        level1: { dropdown: null, variables: [PV_WORD_HEADERS_VAR], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, NOTATION_MS, ASK_MS] },
        level2: { dropdown: null, variables: [PV_WORD_HEADERS_VAR], multiSelect: [SIGN_MS, NOTATION_MS, ASK_MS] },
        level3: { dropdown: null, variables: [PV_WORD_HEADERS_VAR], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, SIGN_MS, NOTATION_MS, ASK_MS] },
      },
    },

    order: {
      name: "Order",
      dropdown: countDD("3"),
      variables: [],
      difficultySettings: {
        level1: { dropdown: countDD("3"), variables: [PV_WORD_HEADERS_VAR], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, DIRECTION_MS] },
        level2: { dropdown: countDD("4"), variables: [PV_WORD_HEADERS_VAR], multiSelect: [SIGN_MS, DIRECTION_MS] },
        level3: { dropdown: countDD("5"), variables: [PV_WORD_HEADERS_VAR], multiSelect: [WHOLE_PART_MS, TRAP_TYPE_MS, SIGN_MS, DIRECTION_MS] },
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
    { label: "Overview", detail: "Order 3–6 numbers, smallest to largest or largest to smallest. Choose how many numbers and which traps are active at every level." },
    { label: "Level 1 / 2 / 3", detail: "Same trap families as Compare, sustained across a list — several different traps can appear in the same list." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, a place value table with the numbers written in on the right — Show Answer fills the Order column (the circling of deciding digits is in the Worked Example). Hide it with the table button." },
    { label: "Worked Example", detail: "A place-value table, revealed one row at a time — each press circles the decisive digit for the next number and gives it its rank." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Words in column headings", detail: "Switch the table headings between letters (O, t, h) and words (Ones, Tenths, Hundredths). Display only — the question does not change." },
    { label: "Notation (Compare)", detail: "Tick Words and/or Symbols — both active mixes them into one worksheet. Changing it reformats the current question instantly — no regeneration." },
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

// ── 8. Place-value table (the Worked Example working steps + whiteboard scaffold) ──
// Drawn with the shared PlaceValueTable: [Sign] · whole places · decimal places · Order.
// Each press of the Worked Example circles the decisive digit for the next number.

/** Column layout for a set of numbers. A table column index runs sign (if any), whole places, decimal places, Order. */
interface PVLayout { hasSign: boolean; off: number; set: ReturnType<typeof pvColumnSet>; }
const pvLayout = (items: SignedDec[], hasSign: boolean): PVLayout => {
  const wholeDigits = Math.max(1, ...items.map((i) => String(i.mag.whole).length));
  const maxDp = Math.max(0, ...items.map((i) => i.mag.d.length));
  return { hasSign, off: hasSign ? 1 : 0, set: pvColumnSet(wholeDigits, maxDp) };
};

/** Digit of `item` in table column `i` (0 where it has none), and whether it is actually written. */
const digitAt = (item: SignedDec, i: number, L: PVLayout): { digit: number; written: boolean } => {
  const p = i - L.off;
  const ones = L.set.onesIndex;
  if (p <= ones) {
    const w = String(item.mag.whole);
    const fromRight = ones - p;
    return fromRight < w.length ? { digit: Number(w[w.length - 1 - fromRight]), written: true } : { digit: 0, written: false };
  }
  const q = p - ones - 1;
  return q < item.mag.d.length ? { digit: item.mag.d[q], written: true } : { digit: 0, written: false };
};

interface CmpRow { item: SignedDec; circleCol: number; rank: number; }

const colValue = (item: SignedDec, i: number, L: PVLayout): number => (L.hasSign && i === 0 ? item.sign : digitAt(item, i, L).digit);

/** Table columns that take part in the comparison, left to right (sign, then every place). */
const scanCols = (L: PVLayout): number[] => Array.from({ length: L.off + L.set.columns.length }, (_, i) => i);

// Radix-sort-style column scan: at each column (sign, then places left to right), split every
// still-tied group of rows by their digit there; any row left alone in its group is settled AT
// THAT COLUMN — this is its circled digit. Distinct values guarantee every row eventually settles.
const columnScan = (items: SignedDec[], L: PVLayout): number[] => {
  const settledAt: number[] = new Array(items.length);
  let groups: number[][] = [items.map((_, i) => i)];
  for (const col of scanCols(L)) {
    const nextGroups: number[][] = [];
    for (const group of groups) {
      const byValue = new Map<number, number[]>();
      for (const idx of group) {
        const v = colValue(items[idx], col, L);
        const bucket = byValue.get(v);
        if (bucket) bucket.push(idx); else byValue.set(v, [idx]);
      }
      for (const sub of byValue.values()) {
        if (sub.length === 1) settledAt[sub[0]] = col;
        else nextGroups.push(sub);
      }
    }
    groups = nextGroups;
    if (groups.length === 0) break;
  }
  return settledAt;
};

// `items` are in DISPLAY order (as shown in the question). `smallestFirst` controls what the
// Order column's numbering means: 1 = smallest when true (ascending asked), 1 = largest when
// false (descending asked) — so the table's own numbering always matches what the question seeks.
const buildRows = (items: SignedDec[], L: PVLayout, smallestFirst: boolean): CmpRow[] => {
  const n = items.length;
  const ascRankOf = new Map<SignedDec, number>();
  [...items].sort((a, b) => signedValue(a) - signedValue(b)).forEach((v, i) => ascRankOf.set(v, i + 1));
  const circleCols = columnScan(items, L);
  return items.map((item, i) => {
    const ascRank = ascRankOf.get(item)!;
    return { item, circleCol: circleCols[i], rank: smallestFirst ? ascRank : n - ascRank + 1 };
  });
};

const colName = (L: PVLayout, i: number): string => (L.hasSign && i === 0 ? "the sign" : `the ${L.set.columnNames[i - L.off].toLowerCase()} digit`);

const ordinalSuffix = (n: number): string => {
  const s = n % 10, t = n % 100;
  if (s === 1 && t !== 11) return "st";
  if (s === 2 && t !== 12) return "nd";
  if (s === 3 && t !== 13) return "rd";
  return "th";
};

// `rank` already encodes the asked direction (1 = smallest when smallestFirst, else 1 = largest).
const rankPhrase = (rank: number, total: number, smallestFirst: boolean): string => {
  if (rank === 1) return `the ${smallestFirst ? "smallest" : "largest"}`;
  if (rank === total) return `the ${smallestFirst ? "largest" : "smallest"}`;
  return `the ${rank}${ordinalSuffix(rank)} ${smallestFirst ? "smallest" : "largest"}`;
};

const rowStr = (row: CmpRow): string => signedStr(row.item);

// The number as far as column `col` — e.g. −0.69 read to the tenths column is −0.6 — so a column's
// comparison can be stated as a real comparison of two numbers.
const prefixItem = (item: SignedDec, col: number, L: PVLayout): SignedDec => {
  const ones = L.set.onesIndex;
  let whole = "", dec: number[] = [];
  for (let i = L.off; i <= col; i++) {
    const p = i - L.off;
    const { digit } = digitAt(item, i, L);
    if (p <= ones) whole += String(digit); else dec.push(digit);
  }
  while (dec.length > 0 && dec[dec.length - 1] === 0) dec = dec.slice(0, -1);
  return { sign: item.sign, mag: { whole: Number(whole || "0"), d: dec } as Dec };
};

// What actually happened at this column, in words — either nothing (every number still matches
// here) or the comparison that placed a number ("-0.6 is greater than -0.7, so …"), so the reveal
// reads as a worked argument rather than a bare result.
const settledDescription = (row: CmpRow | null, rows: CmpRow[], col: number, L: PVLayout, total: number, smallestFirst: boolean): string => {
  if (!row) return "Every number still matches here — move to the next column.";
  const tail = `so ${rowStr(row)} is ${rankPhrase(row.rank, total, smallestFirst)}.`;
  if (L.hasSign && col === 0) return `A positive number is always greater than a negative one, ${tail}`;
  // the numbers still tied going into this column
  const key = (r: CmpRow) => signedStr(prefixItem(r.item, col - 1, L));
  const group = rows.filter((r) => r.circleCol >= col && (col - 1 < L.off ? r.item.sign === row.item.sign : key(r) === key(row)));
  const pre = group.map((r) => prefixItem(r.item, col, L)).sort((a, b) => signedValue(b) - signedValue(a));
  const strs = pre.map(signedStr);
  const cmp = strs.length === 2 ? `${strs[0]} is greater than ${strs[1]}` : strs.join(" > ");
  const neg = row.item.sign < 0 ? "These are negative, so the smaller digit makes the greater number: " : "";
  return `${neg}${cmp}, ${tail}`;
};

/** The shared-table snapshot: rows in `revealed` show their circle + rank; `currentCol` tints a whole column. */
const cmpTable = (rows: CmpRow[], L: PVLayout, revealed: CmpRow[], currentCol?: number, circles = true): PlaceValueTableData => {
  const nPlaces = L.set.columns.length;
  return {
    columns: [...(L.hasSign ? ["±"] : []), ...L.set.columns, "Order"],
    columnNames: [...(L.hasSign ? ["Sign"] : []), ...L.set.columnNames, "Order"],
    onesIndex: L.set.onesIndex + L.off,
    showPoint: L.set.columns.length > L.set.onesIndex + 1,
    colWidth: 120,
    detachLast: true,   // Order is a rank, not a place — keep it visibly apart from the place value columns
    cellHeight: rows.length > 4 ? 48 : 60,
    highlightCol: currentCol,
    rows: rows.map((row): { kind: "cells"; cells: PVCell[] } => {
      const done = revealed.includes(row);
      const cells: PVCell[] = [];
      for (let i = 0; i < L.off + nPlaces; i++) {
        const circled = circles && done && row.circleCol === i;
        if (L.hasSign && i === 0) { cells.push({ v: row.item.sign < 0 ? "−" : "+", circle: circled ? "on" : undefined }); continue; }
        const { digit, written } = digitAt(row.item, i, L);
        // An unwritten zero stays blank — unless it is the deciding digit, when it appears (dimmed) so the circle has something to land on.
        if (written) cells.push({ v: String(digit), circle: circled ? "on" : undefined });
        else cells.push(circled ? { v: "0", tone: "zero", circle: "dim" } : { v: "" });
      }
      cells.push({ v: done ? String(row.rank) : "", badge: true });
      return { kind: "cells", cells };
    }),
  };
};

const withHeaders = (t: PlaceValueTableData, qo?: QOSnapshot): PlaceValueTableData =>
  ({ ...t, headerStyle: qo?.variables?.[PV_WORD_HEADERS_KEY] ? "words" : "letters" });

/** What the table needs from a question: the numbers as displayed, whether they carry a sign, and what Order = 1 means. */
interface PVInfo { items: SignedDec[]; hasSign: boolean; smallestFirst: boolean; }

// One WorkingStep per place-value column actually needed (sign if relevant, then each place up to
// whichever one settles the last row) — PLUS, when a single column settles more than one row at
// once, one step per row within that column (ordered by rank, most extreme first) rather than
// circling and numbering them all in the same press. A column that settles nothing still gets
// its own "nothing here" step.
const placeValueSteps = ({ items, hasSign, smallestFirst }: PVInfo): WorkingStep[] => {
  const L = pvLayout(items, hasSign);
  const rows = buildRows(items, L, smallestFirst);
  const full = scanCols(L);
  let lastIdx = 0;
  const used = new Set(rows.map((r) => r.circleCol));
  full.forEach((c, i) => { if (used.has(c)) lastIdx = i; });
  const targetWord = smallestFirst ? "smallest" : "largest";

  const events: { col: number; row: CmpRow | null }[] = [];
  for (const col of full.slice(0, lastIdx + 1)) {
    const settled = rows.filter((r) => r.circleCol === col).sort((a, b) => a.rank - b.rank);
    if (settled.length === 0) events.push({ col, row: null });
    else for (const row of settled) events.push({ col, row });
  }

  const revealedSoFar: CmpRow[] = [];
  return events.map(({ col, row }) => {
    if (row) revealedSoFar.push(row);
    const colLabel = colName(L, col);
    const settledText = settledDescription(row, rows, col, L, rows.length, smallestFirst);
    return {
      ...tStep(`Compare ${colLabel} — ${settledText}`),
      extra: { kind: "placeValueTable", table: cmpTable(rows, L, [...revealedSoFar], col), targetWord, colLabel, settledText, hasSettled: !!row },
    } as WorkingStep;
  });
};

const stepRenderer = (step: WorkingStep, _colorScheme?: string, qo?: QOSnapshot): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extra = (step as any).extra;
  if (extra?.kind !== "placeValueTable") return null;
  return (
    <div className="mx-auto">
      <p className="mb-1 text-center text-base font-semibold text-slate-800">Compare {extra.colLabel} — 1 = {extra.targetWord}.</p>
      <p className={`mb-3 text-center text-sm ${extra.hasSettled ? "font-medium text-emerald-700" : "text-slate-500"}`}>{extra.settledText}</p>
      <PlaceValueTable data={withHeaders(extra.table, qo)} />
    </div>
  );
};

// The evolving picture for the cascade: caption lines stay in the step list; this one table updates in place.
const stepVisual = (step: WorkingStep, _colorScheme?: string, qo?: QOSnapshot): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extra = (step as any).extra;
  if (extra?.kind !== "placeValueTable") return null;
  return (
    <div className="w-full min-w-0">
      <p className="mb-2 text-center text-base font-semibold text-slate-800">Order: 1 = {extra.targetWord}</p>
      <PlaceValueTable data={withHeaders(extra.table, qo)} />
    </div>
  );
};

// Whiteboard scaffold (full width): the numbers already written in the table, ready to compare; Show Answer
// simply fills the Order column — the circling of deciding digits is the Worked Example's job.
// Placed in the question box under the question, with the working panel collapsed, so the table
// runs full width (a half-width box squeezes up to six rows and eight columns).
const workingScaffold = {
  label: "place value table",
  placement: "question" as const,
  render: (q: AnyQuestion, showAnswer: boolean, _cs: string, qo?: QOSnapshot): JSX.Element | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = (q as any)._pv as PVInfo | undefined;
    if (!info) return null;
    const L = pvLayout(info.items, info.hasSign);
    const rows = buildRows(info.items, L, info.smallestFirst);
    return (
      <div className="w-full">
        <p className="mb-2 text-center text-base font-semibold text-slate-800">Order: 1 = {info.smallestFirst ? "smallest" : "largest"}</p>
        <PlaceValueTable data={withHeaders(cmpTable(rows, L, showAnswer ? rows : [], undefined, false), qo)} />
      </div>
    );
  },
};

// The question text, drawn like the shell's default — a custom renderer is needed so the table can
// sit in the question box. On the whiteboard it also writes the answer beneath (the shell does that
// itself only for the default renderer); worksheets and the worked example add theirs separately.
const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  compact?: boolean,
  _idx?: number,
  qo?: QOSnapshot,
  fontClass?: string,
): JSX.Element | null => {
  const cls = fontClass ?? "text-3xl";
  const isWhiteboard = compact === undefined || qo?.fullscreen === true;
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Tighter line spacing than the shell default, to leave the table as much of the box as possible. */}
      <div className="flex flex-col gap-1 text-center">
        {((q as any).lines as string[]).map((line, i) => (
          // min(1em, 5vw): the chosen size on a normal screen, shrinking on a phone so a list of numbers stays on screen.
          <div key={i} className={`${cls} font-semibold max-w-full`} style={{ color: "#000", lineHeight: 1.35 }}><div style={{ fontSize: "min(1em, 5.5vw)" }}><InlineMath text={line} /></div></div>
        ))}
      </div>
      {/* Always laid out (hidden until revealed) so Show Answer never resizes or rescales the box. */}
      {isWhiteboard && (
        <div className={`${cls} font-bold`} style={{ color: "#166534", visibility: showAnswer ? "visible" : "hidden" }}><AnswerDisplay q={q} /></div>
      )}
    </div>
  );
};

// ── 9. Compare generator ──────────────────────────────────────────────────────

interface CompareRaw { a: SignedDec; b: SignedDec; swapped: boolean; notation: string; ask: "bigger" | "smaller"; hasSign: boolean; }

const buildCompareDisplay = (rv: CompareRaw, notation: string, ask: "bigger" | "smaller") => {
  const { a, b, swapped, hasSign } = rv;
  const left = swapped ? b : a;
  const right = swapped ? a : b;
  const leftBigger = signedValue(left) > signedValue(right);
  const pv: PVInfo = { items: [left, right], hasSign, smallestFirst: ask === "smaller" };
  const working = placeValueSteps(pv);

  if (notation === "symbols") {
    return {
      lines: [
        "Insert $<$ or $>$:",
        `$${signedStr(left)}$ $\\, \\square \\,$ $${signedStr(right)}$`,
      ],
      answer: `${signedStr(left)} ${leftBigger ? ">" : "<"} ${signedStr(right)}`,
      answerLatex: `${signedStr(left)} ${leftBigger ? "\\gt" : "\\lt"} ${signedStr(right)}`,
      working, pv,
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
    working, pv,
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
    _pv: built.pv,
    key: `compare-${level}-${signedStr(a)}-${signedStr(b)}-${notation}-${ask}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 10. Order generator ───────────────────────────────────────────────────────

// `directionOpt` stores which of the 4 DIRECTION_MS wording options was
// drawn; `values` is always the canonical ascending-by-true-value list.
// Order is words-only — no inequality-chain (Symbols) notation.
interface OrderRaw { values: SignedDec[]; directionOpt: string; hasSign: boolean; /** display order, fixed once drawn so a display-only change never reshuffles the question */ shuffled?: SignedDec[]; }

const buildOrderDisplay = (rv: OrderRaw) => {
  const { values, directionOpt, hasSign } = rv;
  const { sort, sentence } = DIRECTION_INFO[directionOpt];
  const ordered = sort === "ascending" ? values : [...values].reverse();
  const shuffled = rv.shuffled ?? [...values].sort(() => Math.random() - 0.5);
  const pv: PVInfo = { items: shuffled, hasSign, smallestFirst: sort === "ascending" };
  const working = placeValueSteps(pv);

  return {
    lines: [
      sentence,
      `$${shuffled.map(signedStr).join(", ")}$`,
    ],
    answer: ordered.map(signedStr).join(", "),
    answerLatex: ordered.map(signedStr).join(",\\ "),
    working, pv, shuffled,
  };
};

const genOrderQuestion = (level: DifficultyLevel, msv: Record<string, boolean>, dropdownValue: string): AnyQuestion => {
  const id = randInt(0, 999999);
  const count = parseInt(dropdownValue, 10) || 3;
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
  const built = buildOrderDisplay({ values, directionOpt, hasSign });

  return {
    kind: "worded",
    lines: built.lines,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: { values, directionOpt, hasSign, shuffled: built.shuffled } as OrderRaw,
    _pv: built.pv,
    key: `order-${level}-${values.map(signedStr).join("_")}-${directionOpt}-${id}`,
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
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _pv: built.pv, _rawValues: { ...compareRv, notation, ask } } as unknown as AnyQuestion;
  }
  const orderRv = (q as any)._rawValues as OrderRaw | undefined;
  if (orderRv && "values" in orderRv) {
    // A count change is a structural change (a different number of values) —
    // let ToolShell regenerate rather than trying to reformat in place.
    if (parseInt(qo.dropdownValue, 10) !== orderRv.values.length) return null;
    const directionOpt = resolveDirection(qo.multiSelectValues, orderRv.directionOpt);
    const built = buildOrderDisplay({ values: orderRv.values, directionOpt, hasSign: orderRv.hasSign, shuffled: orderRv.shuffled });
    return { ...q, lines: built.lines, answer: built.answer, answerLatex: built.answerLatex, working: built.working, _pv: built.pv, _rawValues: { ...orderRv, directionOpt } } as unknown as AnyQuestion;
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
      stepVisualRenderer={stepVisual}
      questionRenderer={questionRenderer}
      workingScaffold={workingScaffold}
      defaults={{ collapseWorkingByDefault: true, displayFontSize: 1 /* text-xl — leaves the full-width table room */ }}
    />
  );
}
