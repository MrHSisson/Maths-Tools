import { mStep, mStr, type WorkingStep, type WordedQuestion, type DifficultyLevel } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// Ratio Sharing — the pure question builders. The tool's generators choose the numbers and call these; the deck builders
// (`Q.share`, `Q.known`, `Q.diff` in src/decks/builder.ts) call them with fixed numbers, so an authored question carries
// exactly the tool's own wording and working. No randomness here, no React.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Contexts: what is being shared ────────────────────────────────────────────

export type ContextId = "money" | "sweets" | "stickers" | "marbles" | "paint" | "flour";

const fmtAmt = (n: number): string => (n % 1 === 0 ? String(n) : n.toFixed(2));

interface Ctx {
  /** "£60", "60 sweets", "60 litres of paint": the amount being shared, as a sentence says it */
  total: (n: number) => string;
  /** "£24", "24 sweets", "24 litres": a share, in an answer or a caption */
  short: (n: number) => string;
  /** the amount inside KaTeX (no units in KaTeX: rule R4) */
  latex: (n: number) => string;
  /** "£12 more", "12 more sweets", "12 litres more" */
  more: (n: number) => string;
  less: (n: number) => string;
  /** what the people share, for a line that gives no total: "money", "sweets" */
  stuff: string;
}

const count = (noun: string): Ctx => ({
  total: (n) => `${n} ${noun}`, short: (n) => `${n} ${noun}`, latex: (n) => String(n),
  more: (n) => `${n} more ${noun}`, less: (n) => `${n} fewer ${noun}`, stuff: noun,
});
const measure = (unit: string, of: string): Ctx => ({
  total: (n) => `${n} ${unit} of ${of}`, short: (n) => `${n} ${unit}`, latex: (n) => String(n),
  more: (n) => `${n} ${unit} more`, less: (n) => `${n} ${unit} less`, stuff: of,
});

export const CONTEXTS: Record<ContextId, Ctx> = {
  money: {
    total: (n) => `£${fmtAmt(n)}`, short: (n) => `£${fmtAmt(n)}`, latex: (n) => `\\pounds ${fmtAmt(n)}`,
    more: (n) => `£${fmtAmt(n)} more`, less: (n) => `£${fmtAmt(n)} less`, stuff: "money",
  },
  sweets: count("sweets"),
  stickers: count("stickers"),
  marbles: count("marbles"),
  paint: measure("litres", "paint"),
  flour: measure("kg", "flour"),
};
/** The contexts a "Quantities" question draws from (whole numbers only). */
export const QUANTITY_CONTEXTS: ContextId[] = ["sweets", "stickers", "marbles", "paint", "flour"];

/** An amount as a caption or answer says it; `ctx` defaults to money (the tool's first and only context until 2026-11). */
export const fa = (ctx: string | undefined, n: number): string => (CONTEXTS[(ctx as ContextId) ?? "money"] ?? CONTEXTS.money).short(n);

const joinNames = (names: string[]): string =>
  names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const parts_ = (n: number) => `${n} part${n !== 1 ? "s" : ""}`;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const ratioText = (p: number[]) => p.join(" : ");

// ── Bar steps: the caption of each step (the bar itself is drawn by the tool) ─

const stepCaption = (t: string, d: Record<string, unknown>): string => {
  const c = d.ctx as string | undefined;
  switch (t) {
    case "simplify": return `Simplify the ratio first: ${ratioText(d.display as number[])} = ${ratioText(d.parts as number[])}.`;
    case "bar_empty": return "Bar model: draw a box for each part of the ratio.";
    case "bar_total": return `Add the parts to find the total: ${d.sum as number} parts.`;
    case "bar_part": return `Value of 1 part: ${fa(c, d.total as number)} ÷ ${d.sum as number} = ${fa(c, d.value as number)}.`;
    case "bar_filled": return "Calculate each share: the value of 1 part × the number of parts.";
    case "ka_bar_known": return "Given information: mark the known share on the bar model.";
    case "ka_identify": return `Identify the ratio part: ${d.knownPerson as string} has ${parts_(d.ratioPart as number)}.`;
    case "ka_part_val": return `Value of 1 part: ${fa(c, d.knownAmount as number)} ÷ ${d.ratioPart as number} = ${fa(c, d.partValue as number)}.`;
    case "ka_total_bar": return `Add all the shares to find the total: ${(d.shares as number[]).map((s) => fa(c, s)).join(" + ")} = ${fa(c, d.total as number)}.`;
    case "ka_other_bar": return `Read ${d.otherPerson as string}'s share from the bar: ${fa(c, d.share as number)}.`;
    case "diff_bar": return "Bar model: the extra boxes show the difference.";
    case "diff_identify": return `The difference represents ${parts_(d.partDiff as number)} = ${fa(c, d.difference as number)}.`;
    case "diff_part_val": return `Value of 1 part: ${fa(c, d.difference as number)} ÷ ${d.partDiff as number} = ${fa(c, d.partValue as number)}.`;
    case "diff_read": return `Read ${d.person as string}'s share from the bar: ${fa(c, d.share as number)}.`;
    case "check_sum": return `Check: ${(d.shares as number[]).map((s) => fa(c, s)).join(" + ")} = ${fa(c, d.total as number)}, the total shared.`;
    case "check_ratio": return `Check: ${(d.shares as number[]).map((s) => fa(c, s)).join(" : ")} ÷ ${fa(c, d.partValue as number)} = ${ratioText(d.parts as number[])}, the ratio given.`;
    case "check_diff": return `Check: ${fa(c, d.larger as number)} − ${fa(c, d.smaller as number)} = ${fa(c, d.difference as number)}, the difference given.`;
    default: return "";
  }
};

const bStep = (t: string, data: Record<string, unknown>): WorkingStep => ({ type: t, latex: "", plain: stepCaption(t, data), extra: data });

// ── Specs ─────────────────────────────────────────────────────────────────────

interface Base {
  names: string[];
  /** the ratio in its simplest form: one entry per person */
  parts: number[];
  /** the value of one part (of the simplest form) */
  partValue: number;
  ctx?: ContextId;
  /** the ratio as the question shows it when it is not in simplest form (a multiple of `parts`) */
  display?: number[];
  /** draw the bar model in the working (Levels 1 and 2, unless the numerical method is chosen) */
  bar?: boolean;
  /** add a last "Check" step */
  check?: boolean;
  level?: DifficultyLevel;
}

export interface SharingSpec extends Base {
  /** a person's index (0 to 2), or "both" for every share */
  ask: number | "both";
}
export interface KnownSpec extends Base {
  /** the person whose share is given */
  known: number;
  /** "total", or the index of the person whose share is asked */
  ask: "total" | number;
}
export interface DiffSpec extends Base {
  /** the two people compared, by index; their parts must differ */
  a: number; b: number;
  /** "total", or the index of the person whose share is asked */
  ask: "total" | number;
  /** 1 "X receives … more than Y", 2 "Y receives … less than X", 3 "the difference … is" */
  style: 1 | 2 | 3;
}

const shared = (s: Base) => {
  const ctx = s.ctx ?? "money";
  const C = CONTEXTS[ctx];
  const total = sum(s.parts) * s.partValue;
  const shares = s.parts.map((p) => p * s.partValue);
  const display = s.display && s.display.join() !== s.parts.join() ? s.display : null;
  const ratio = mStr((display ?? s.parts).join(":"));
  const bars = (extra: (i: number) => object = () => ({})) => s.parts.map((p, i) => ({ person: s.names[i], boxes: p, ...extra(i) }));
  const filled = () => bStep("bar_filled", { ctx, bars: s.parts.map((p, i) => ({ person: s.names[i], boxes: p, value: s.partValue, total: shares[i] })) });
  const simplifyBar = display ? [bStep("simplify", { ctx, display, parts: s.parts })] : [];
  const simplifyNum = display ? [mStep("Simplify the ratio:", `${display.join(" : ")} = ${s.parts.join(" : ")}`)] : [];
  return { ctx, C, total, shares, ratio, bars, filled, simplifyBar, simplifyNum };
};

const name = (s: Base, i: number) => s.names[i];
const possessive = (n: string) => `${n}'s`;

// ── Sharing a total ───────────────────────────────────────────────────────────

export const buildSharing = (s: SharingSpec): WordedQuestion => {
  const k = shared(s);
  const { C, ctx, total, shares } = k;
  const n = s.parts.length;
  const qLine = s.ask === "both" ? (n === 2 ? "Find both shares." : "Find all three shares.") : `How much does ${name(s, s.ask)} receive?`;
  const answer = s.ask === "both"
    ? s.names.map((nm, i) => `${nm}: ${C.short(shares[i])}`).join(", ")
    : `${name(s, s.ask)}: ${C.short(shares[s.ask])}`;
  const asked = s.ask === "both" ? s.parts.map((_, i) => i) : [s.ask];
  const working: WorkingStep[] = s.bar
    ? [
        ...k.simplifyBar,
        bStep("bar_empty", { ctx, bars: k.bars() }),
        bStep("bar_total", { ctx, sum: sum(s.parts) }),
        bStep("bar_part", { ctx, total, sum: sum(s.parts), value: s.partValue }),
        k.filled(),
        ...(s.check ? [bStep("check_sum", { ctx, shares, total })] : []),
      ]
    : [
        ...k.simplifyNum,
        mStep("Total parts:", `${s.parts.join(" + ")} = ${sum(s.parts)}`),
        mStep("1 part =", `${C.latex(total)} \\div ${sum(s.parts)} = ${C.latex(s.partValue)}`),
        ...asked.map((i) => mStep(s.ask === "both" ? `${name(s, i)}:` : `${possessive(name(s, i))} share:`, `${s.parts[i]} \\times ${C.latex(s.partValue)} = ${C.latex(shares[i])}`)),
        ...(s.check
          ? [s.ask === "both"
              ? mStep("Check:", `${shares.map((x) => C.latex(x)).join(" + ")} = ${C.latex(total)}`)
              : mStep("Check:", `${C.latex(shares[s.ask])} \\div ${C.latex(s.partValue)} = ${s.parts[s.ask]}`)]
          : []),
      ];
  return {
    kind: "worded",
    lines: [`${joinNames(s.names)} share ${C.total(total)} in the ratio ${k.ratio}`, qLine],
    answer, working,
    key: `ratio-sharing-${s.level ?? "fixed"}-${ctx}-${(s.display ?? s.parts).join("_")}-${total}-${s.ask}-${s.names.join("")}`,
    difficulty: s.level ?? "level1",
  };
};

// ── A known share ─────────────────────────────────────────────────────────────

export const buildKnown = (s: KnownSpec): WordedQuestion => {
  const k = shared(s);
  const { C, ctx, shares, total } = k;
  const kp = s.known;
  const knownAmount = shares[kp];
  const qLine = s.ask === "total" ? "What is the total amount shared?" : `How much does ${name(s, s.ask)} receive?`;
  const answer = s.ask === "total" ? `Total: ${C.short(total)}` : `${name(s, s.ask)}: ${C.short(shares[s.ask])}`;
  const working: WorkingStep[] = s.bar
    ? [
        ...k.simplifyBar,
        bStep("ka_bar_known", { ctx, bars: k.bars((i) => ({ isKnown: i === kp, knownAmount: i === kp ? knownAmount : null })) }),
        bStep("ka_identify", { ctx, knownPerson: name(s, kp), ratioPart: s.parts[kp] }),
        bStep("ka_part_val", { ctx, knownAmount, ratioPart: s.parts[kp], partValue: s.partValue }),
        k.filled(),
        ...(s.ask === "total"
          ? [bStep("ka_total_bar", { ctx, shares, total })]
          : [bStep("ka_other_bar", { ctx, otherPerson: name(s, s.ask), share: shares[s.ask] })]),
        ...(s.check ? [bStep("check_ratio", { ctx, shares, partValue: s.partValue, parts: s.parts })] : []),
      ]
    : [
        ...k.simplifyNum,
        mStep(`${name(s, kp)} has ${s.parts[kp]} part${s.parts[kp] !== 1 ? "s" : ""}:`, C.latex(knownAmount)),
        mStep("1 part =", `${C.latex(knownAmount)} \\div ${s.parts[kp]} = ${C.latex(s.partValue)}`),
        ...(s.ask === "total"
          ? [
              mStep("Total parts:", `${s.parts.join(" + ")} = ${sum(s.parts)}`),
              mStep("Total =", `${sum(s.parts)} \\times ${C.latex(s.partValue)} = ${C.latex(total)}`),
            ]
          : [mStep(`${possessive(name(s, s.ask))} share:`, `${s.parts[s.ask]} \\times ${C.latex(s.partValue)} = ${C.latex(shares[s.ask])}`)]),
        ...(s.check ? [mStep("Check:", `${shares.map((x) => C.latex(x)).join(" : ")} \\div ${C.latex(s.partValue)} = ${s.parts.join(" : ")}`)] : []),
      ];
  return {
    kind: "worded",
    lines: [`${joinNames(s.names)} share ${C.stuff} in the ratio ${k.ratio}`, `${name(s, kp)} receives ${C.short(knownAmount)}`, qLine],
    answer, working,
    key: `ratio-known-${s.level ?? "fixed"}-${ctx}-${(s.display ?? s.parts).join("_")}-${knownAmount}-${kp}-${s.ask}-${s.names.join("")}`,
    difficulty: s.level ?? "level1",
  };
};

// ── A given difference ────────────────────────────────────────────────────────

export const buildDifference = (s: DiffSpec): WordedQuestion => {
  const k = shared(s);
  const { C, ctx, shares, total } = k;
  const hi = s.parts[s.a] > s.parts[s.b] ? s.a : s.b;
  const lo = hi === s.a ? s.b : s.a;
  const difference = shares[hi] - shares[lo];
  const partDiff = s.parts[hi] - s.parts[lo];
  const two = s.parts.length === 2;
  const compLine =
    s.style === 1 ? `${name(s, hi)} receives ${C.more(difference)} than ${name(s, lo)}` :
    s.style === 2 ? `${name(s, lo)} receives ${C.less(difference)} than ${name(s, hi)}` :
    two ? `The difference in their amounts is ${C.short(difference)}`
        : `The difference between ${possessive(name(s, s.a))} and ${possessive(name(s, s.b))} shares is ${C.short(difference)}`;
  const qLine = s.ask === "total" ? "What is the total amount shared?" : `How much does ${name(s, s.ask)} receive?`;
  const answer = s.ask === "total" ? `Total: ${C.short(total)}` : `${name(s, s.ask)}: ${C.short(shares[s.ask])}`;
  const working: WorkingStep[] = s.bar
    ? [
        ...k.simplifyBar,
        bStep("diff_bar", { ctx, bars: k.bars(), difference, largerPerson: hi, smallerPerson: lo }),
        bStep("diff_identify", { ctx, difference, partDiff }),
        bStep("diff_part_val", { ctx, difference, partDiff, partValue: s.partValue }),
        k.filled(),
        ...(s.ask === "total"
          ? [bStep("ka_total_bar", { ctx, shares, total })]
          : [bStep("diff_read", { ctx, person: name(s, s.ask), share: shares[s.ask] })]),
        ...(s.check ? [bStep("check_diff", { ctx, larger: shares[hi], smaller: shares[lo], difference })] : []),
      ]
    : [
        ...k.simplifyNum,
        mStep(`Difference = ${partDiff} part${partDiff !== 1 ? "s" : ""}:`, C.latex(difference)),
        mStep("1 part =", `${C.latex(difference)} \\div ${partDiff} = ${C.latex(s.partValue)}`),
        ...(s.ask === "total"
          ? [
              mStep("Total parts:", `${s.parts.join(" + ")} = ${sum(s.parts)}`),
              mStep("Total =", `${sum(s.parts)} \\times ${C.latex(s.partValue)} = ${C.latex(total)}`),
            ]
          : [mStep(`${possessive(name(s, s.ask))} share:`, `${s.parts[s.ask]} \\times ${C.latex(s.partValue)} = ${C.latex(shares[s.ask])}`)]),
        ...(s.check ? [mStep("Check:", `${C.latex(shares[hi])} - ${C.latex(shares[lo])} = ${C.latex(difference)}`)] : []),
      ];
  return {
    kind: "worded",
    lines: [`${joinNames(s.names)} share ${C.stuff} in the ratio ${k.ratio}`, compLine, qLine],
    answer, working,
    key: `ratio-diff-${s.level ?? "fixed"}-${ctx}-${(s.display ?? s.parts).join("_")}-${difference}-${s.a}${s.b}-${s.style}-${s.ask}-${s.names.join("")}`,
    difficulty: s.level ?? "level1",
  };
};
