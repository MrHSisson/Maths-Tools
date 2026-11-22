// Formulating Linear Programmes, "Write a constraint": the question generators, with no React. See specs/linear-programming-formulate.md.
// Equations first: each generator picks the numbers of the sentence, builds the constraint from them with lp.ts (the tidy rule), and writes the words
// from the same numbers, so the wording and the model cannot disagree. Everything a question needs later (the working, the check, the tests) is
// plain data in `LpProblemData`: no functions, so a seed rebuilds the same question. Level 1 only so far (resource use and direct comparisons).
import { type Fr, fr, ZERO } from "./dim";
import { type Constraint, type ConstraintKind, type Op, type Var, blend, eitherOr, flipOp, gcdInt, linear, relationship } from "./lp";

// ── The question's data ──────────────────────────────────────────────────────
export type LpKind = "resource" | "multiple" | "difference" | "bound" | "total" | "percent" | "ratio" | "decimal" | "blend" | "eitherOr" | "problem";
/** the rule behind a constraint, from the sentence's own numbers (rebuilt with `constraintOf`) */
export type LpSpec =
  | { t: "linear"; coeffs: Fr[]; op: Op; rhs: Fr; kind: ConstraintKind }
  | { t: "rel"; n: number; a: number[]; b: number[]; m: Fr; op: Op; kind: ConstraintKind }
  | { t: "blend"; contents: Fr[]; share: Fr; op: Op }
  | { t: "either"; caps: Fr[]; amount: Fr; op: Op };
export const constraintOf = (s: LpSpec, source = ""): Constraint =>
  s.t === "linear" ? linear(s.coeffs, s.op, s.rhs, s.kind, source)
    : s.t === "rel" ? relationship({ n: s.n, a: s.a, b: s.b, m: s.m, op: s.op, kind: s.kind, source })
      : s.t === "blend" ? blend({ contents: s.contents, share: s.share, op: s.op, source })
        : eitherOr({ caps: s.caps, amount: s.amount, op: s.op, source });

/** what the working needs to say about each kind */
type LpInfo =
  | { kind: "resource"; per: number[]; packs?: number[]; packText?: string[]; conv?: { n: number; unit: string; factor: number }; amount: number; unit: string; of: string; verb: string; label: string; topic: string; sing: string[] }
  | { kind: "multiple"; a: number; b: number[]; m: Fr }
  | { kind: "difference"; a: number; b: number; k: number }
  | { kind: "bound"; i: number; N: number; each: boolean }
  | { kind: "total"; N: number }
  | { kind: "percent"; form: "one" | "combined" | "total" | "more" | "less"; a: number[]; b: number[]; m: Fr; p: number }
  | { kind: "ratio"; form: "ratio" | "every" | "share"; a: number[]; b: number[]; m: Fr }
  | { kind: "decimal"; a: number[]; den: number; amount: number; unit: string; of: string; verb: string; label: string; topic: string; sing: string[] }
  | { kind: "blend"; contents: Fr[]; share: Fr; comp: string; invest: boolean }
  | { kind: "problem"; sense: "max" | "min"; name: string; obj: number[]; parts: LpProblemData[]; sing: string[]; integers?: boolean; price?: number[]; cost?: number[]; konst?: number; single?: number;
      table?: { head: string[]; rows: string[][] }; showTable?: boolean;
      pack?: { i: number; k: number; name: string; text: string; item: string }; itemObj?: number[];
      rem?: { T: number; unit: string; restNoun: string; restSing: string; rest: string; profits: number[]; per: number[]; amount: number; resource: { topic: string; unit: string; verb: string; label: string; of: string } };
      /** one kind is exactly a multiple of the others (or of one of them), so it is substituted out: `items` are all the kinds, the last being the one that is fixed; `S` the letters it depends on, `a` the multiple (1 for a plain total) */
      link?: { dep: { plural: string; singular: string }; items: Array<{ plural: string; singular: string }>; form: "single" | "combined" | "sum"; S: number[]; a: number; /** a constant: the fixed kind is a·(the others) + c ("10 more than", "10 fewer than") */ c?: number; /** worded the other way round: the letters' kinds are "half" (or a third) of the fixed kind */ reverse?: boolean; profits: number[];
        resources: Array<{ topic: string; unit: string; verb: string; label: string; of: string; per: number[]; amount: number }> } }
  | { kind: "eitherOr"; caps: number[]; given: "most" | "rate" | "perItem" | "requirement"; T: number; method: "fractions" | "units" | "both"; sing?: string[] };

export interface LpProblemData {
  kind: LpKind;
  level: number;
  vars: Var[];
  /** as the sentence says it */
  op: Op;
  spec: LpSpec;
  /** the common slip, shown with the answer: a constraint that reads the sentence the wrong way */
  slip?: { spec: LpSpec; what: string };
  info: LpInfo;
  /** a point that fits the words, which the slip does not allow (the "try a number" check) */
  point?: number[];
  /** false when the check point does NOT fit the words but the slip would allow it (default true: it fits, and the slip refuses it) */
  pointFits?: boolean;
}
export interface LpQuestion { prompt: string; answerText: string; data: LpProblemData }

// ── Small helpers (all randomness is Math.random: a seed rebuilds the question) ─
export const ri = (lo: number, hi: number): number => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = <T,>(xs: readonly T[]): T => xs[ri(0, xs.length - 1)];
export function weighted<T>(xs: ReadonlyArray<readonly [T, number]>): T {
  let r = Math.random() * xs.reduce((s, [, w]) => s + w, 0);
  for (const [x, w] of xs) { r -= w; if (r < 0) return x; }
  return xs[xs.length - 1][0];
}
export function shuffled<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const lpSyms = (n: number): string[] => (n === 4 ? ["w", "x", "y", "z"] : n === 3 ? ["x", "y", "z"] : ["x", "y"]);
/** "a, b and c" */
export const list = (xs: string[]): string => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
/** an integer for the page: 1 440 as 1{,}440 for KaTeX */
export const texN = (n: number): string => (Math.abs(n) >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "{,}") : String(n));

/** the operators and what each is called in a sentence: "at most", "fewer than" (a count) or "less than" (an amount) */
export function opWord(op: Op, count = true): string {
  return { "≤": "at most", "≥": "at least", "=": "exactly", "<": count ? "fewer than" : "less than", ">": "more than" }[op];
}
/** three constraints in four are non-strict, strict ones are common enough to be learnt (brief section 2) */
export const pickOp = (): Op => weighted<Op>([["≤", 3], ["≥", 3], ["=", 0.5], ["<", 0.75], [">", 0.75]]);

// ── Contexts: a setting, items with plural nouns, and the resources they use or supply ─
export interface Resource { topic: string; unit: string; of: string; verb: string; label: string; mode: "use" | "supply"; decOnly?: boolean }
export interface Context { id: string; intro: (items: string[]) => string; did: string; items: Array<{ plural: string; singular: string }>; resources: Resource[]; device?: { noun: string; verb: string } }
export const CONTEXTS: Context[] = [
  { id: "bakery", device: { noun: "oven", verb: "bake" }, intro: (i) => `A bakery makes ${list(i)}.`, did: "made", items: [{ plural: "loaves", singular: "loaf" }, { plural: "cakes", singular: "cake" }, { plural: "pies", singular: "pie" }, { plural: "buns", singular: "bun" }],
    resources: [{ topic: "oven time", unit: "minutes", of: "oven time", verb: "uses", label: "oven time used", mode: "use" }, { topic: "preparation time", unit: "minutes", of: "preparation time", verb: "needs", label: "preparation time needed", mode: "use" }, { topic: "flour", unit: "kg", of: "flour", verb: "uses", label: "flour used", mode: "use", decOnly: true }] },
  { id: "print", device: { noun: "press", verb: "print" }, intro: (i) => `A print shop produces ${list(i)}.`, did: "printed", items: [{ plural: "posters", singular: "poster" }, { plural: "leaflets", singular: "leaflet" }, { plural: "flyers", singular: "flyer" }, { plural: "cards", singular: "card" }],
    resources: [{ topic: "printing time", unit: "minutes", of: "printing time", verb: "needs", label: "printing time needed", mode: "use" }, { topic: "paper", unit: "sheets", of: "paper", verb: "uses", label: "paper used", mode: "use" }, { topic: "ink", unit: "litres", of: "ink", verb: "uses", label: "ink used", mode: "use", decOnly: true }] },
  { id: "workshop", device: { noun: "machine", verb: "make" }, intro: (i) => `A workshop makes ${list(i)}.`, did: "made", items: [{ plural: "chairs", singular: "chair" }, { plural: "tables", singular: "table" }, { plural: "stools", singular: "stool" }, { plural: "shelves", singular: "shelf" }],
    resources: [{ topic: "timber", unit: "metres", of: "timber", verb: "uses", label: "timber used", mode: "use" }, { topic: "labour", unit: "hours", of: "labour", verb: "needs", label: "labour needed", mode: "use" }, { topic: "paint", unit: "litres", of: "paint", verb: "uses", label: "paint used", mode: "use", decOnly: true }] },
  { id: "cafe", device: { noun: "kitchen", verb: "prepare" }, intro: (i) => `A café prepares ${list(i)} for its lunch deals.`, did: "prepared", items: [{ plural: "sandwiches", singular: "sandwich" }, { plural: "wraps", singular: "wrap" }, { plural: "salads", singular: "salad" }, { plural: "soups", singular: "soup" }],
    resources: [{ topic: "preparation time", unit: "minutes", of: "preparation time", verb: "takes", label: "preparation time needed", mode: "use" }, { topic: "cheese", unit: "kg", of: "cheese", verb: "uses", label: "cheese used", mode: "use", decOnly: true }] },
  { id: "stall", device: { noun: "workshop", verb: "make" }, intro: (i) => `A craft stall sells ${list(i)}.`, did: "made", items: [{ plural: "candles", singular: "candle" }, { plural: "soaps", singular: "soap" }, { plural: "mugs", singular: "mug" }, { plural: "bags", singular: "bag" }],
    resources: [{ topic: "making time", unit: "minutes", of: "making time", verb: "needs", label: "making time needed", mode: "use" }, { topic: "packaging", unit: "boxes", of: "packaging", verb: "uses", label: "packaging used", mode: "use" }, { topic: "wax", unit: "kg", of: "wax", verb: "uses", label: "wax used", mode: "use", decOnly: true }] },
  { id: "diet", intro: (i) => `A dietician plans a meal from ${list(i)}.`, did: "served", items: [{ plural: "bowls of rice", singular: "bowl of rice" }, { plural: "bowls of lentils", singular: "bowl of lentils" }, { plural: "bowls of soup", singular: "bowl of soup" }, { plural: "bowls of pasta", singular: "bowl of pasta" }],
    resources: [{ topic: "protein", unit: "grams", of: "protein", verb: "supplies", label: "protein supplied", mode: "supply" }, { topic: "iron", unit: "milligrams", of: "iron", verb: "supplies", label: "iron supplied", mode: "supply" }] },
];

/** the variables for a question: n items of one context, in a random order, lettered x, y (z, w) */
export function pickVars(ctx: Context, n: number): { vars: Var[]; sing: string[] } {
  const chosen = shuffled(ctx.items).slice(0, n);
  const syms = lpSyms(n);
  return { vars: chosen.map((it, i) => ({ sym: syms[i], noun: it.plural, integer: true })), sing: chosen.map((it) => it.singular) };
}
export const letDef = (vars: Var[], did: string): string => {
  const parts = vars.map((v, i) => (i === 0 ? `$${v.sym}$ be the number of ${v.noun}` : `$${v.sym}$ the number of ${v.noun}`));
  return `Let ${list(parts)}${did ? ` ${did}` : ""}.`;
};

// ── Writing a constraint: "3x + 4y ≤ 180" ────────────────────────────────────
const SIGN = (f: number): string => (f < 0 ? "−" : "+");
/** plain text, for the answer line and the printed answers */
export function constraintText(c: Pick<Constraint, "coeffs" | "op" | "rhs">, vars: Var[]): string {
  let s = "";
  c.coeffs.forEach((f, i) => {
    const k = f[0];
    if (k === 0) return;
    const body = `${Math.abs(k) === 1 ? "" : Math.abs(k)}${vars[i].sym}`;
    s += s === "" ? (k < 0 ? "−" : "") + body : ` ${SIGN(k)} ${body}`;
  });
  const r = c.rhs[0] / c.rhs[1];
  return `${s} ${c.op} ${r < 0 ? "−" + Math.abs(r) : r}`;
}

/** a context, variables and (for a resource) the resource and operators already chosen: a `problem` question builds several constraints on one set of variables */
export interface Fix { ctx: Context; vars: Var[]; sing: string[]; res?: Resource; ops?: Op[]; /** items per pack for each variable (1: not a pack), and its words ("tray of 6") */ packs?: number[]; packText?: string[] }
/** "1 minute", "2 minutes": the unit in the singular for a single one */
export const unitOf = (n: number, unit: string): string => (n === 1 ? (unit === "boxes" ? "box" : unit.endsWith("s") ? unit.slice(0, -1) : unit) : unit);
export const opFrom = (fx: Fix | undefined, otherwise: () => Op): Op => (fx?.ops ? pick(fx.ops) : otherwise());

// ── Level 1: resource use ────────────────────────────────────────────────────
/** a round amount, at least one of the coefficients dividing it (so "if only this item is made" is a whole number of items) */
export const AMOUNTS = [30, 40, 48, 50, 60, 72, 80, 90, 100, 120, 144, 150, 160, 180, 200, 240, 250, 300, 360, 400, 480, 500, 600, 720, 800, 900, 1000, 1200, 1440, 1500];
/** the amount of the resource each item uses, and a round amount available; `mult` is how many items one unit of each variable stands for (a pack), so the coefficients are per × mult */
export function resourceNumbers(n: number, mult?: number[]): { per: number[]; amount: number } {
  for (let tries = 0; tries < 80; tries++) {
    const per = Array.from({ length: n }, (_, i) => ri(n === 2 && !mult ? 2 : 1, Math.max(1, Math.floor((n === 2 ? 20 : 12) / (mult?.[i] ?? 1)))));
    const coef = per.map((a, i) => a * (mult?.[i] ?? 1));
    if (new Set(coef).size < 2) continue; // at least two different, so the order of the coefficients matters
    const g = coef.reduce((h, v) => gcdInt(h, v), 0);
    const hi = n === 2 ? 600 : 1500;
    const ok = AMOUNTS.filter((N) => N <= hi && N >= Math.max(...coef) * 3 && N % g === 0 && coef.some((a) => N % a === 0));
    if (ok.length) return { per, amount: pick(ok) };
  }
  return { per: n === 2 ? [10, 15] : n === 3 ? [2, 3, 5] : [2, 3, 4, 6], amount: n === 2 ? 300 : 120 };
}
export function genResource(n: number, fx?: Fix): { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> } {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const res = fx?.res ?? pick(ctx.resources.filter((r) => !r.decOnly));
  const { vars, sing } = fx ?? pickVars(ctx, n);
  const { per, amount } = resourceNumbers(n, fx?.packs);
  const coef = per.map((a, i) => a * (fx?.packs?.[i] ?? 1));
  const op = opFrom(fx, () => (res.mode === "use" ? weighted<Op>([["≤", 6], ["<", 1.5], ["=", 1]]) : weighted<Op>([["≥", 6], [">", 1.5], ["=", 1]])));
  const tail = (a: number): string => `${a} ${unitOf(a, res.unit)}${res.of ? ` of ${res.of}` : ""}`;
  const each = sing.map((s, i) => `each ${s} ${res.verb} ${i === 0 ? tail(per[i]) : `${per[i]} ${unitOf(per[i], res.unit)}`}`);
  const sentence = `${cap(list(each))}. The total ${res.label} must be ${opWord(op, false)} ${amount} ${res.unit}.`;
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${sentence} Write down a constraint for the ${res.topic}.`;
  const spec: LpSpec = { t: "linear", coeffs: coef.map((a) => fr(a)), op, rhs: fr(amount), kind: "resource" };
  // the slip: the coefficients the wrong way round (reversed; if that is the same line, the first two swapped)
  let wrong = [...coef].reverse();
  if (wrong.every((v, i) => v === coef[i])) wrong = [coef[1], coef[0], ...coef.slice(2)];
  const slip: LpSpec = { t: "linear", coeffs: wrong.map((a) => fr(a)), op, rhs: fr(amount), kind: "resource" };
  return { prompt, sentence, data: { kind: "resource", vars, op, spec, slip: { spec: slip, what: "the coefficients the wrong way round" }, info: { kind: "resource", per, packs: fx?.packs, packText: fx?.packText, amount, unit: res.unit, of: res.of, verb: res.verb, label: res.label, topic: res.topic, sing } } };
}

// ── Level 1: direct comparisons ──────────────────────────────────────────────
const MULTIPLES: Array<readonly [Fr, number]> = [[fr(2), 4], [fr(3), 3], [fr(4), 1], [fr(1, 2), 2], [fr(1, 3), 1.5], [fr(3, 2), 1.5], [fr(5, 2), 1]];
const MWORD: Record<string, string> = { "2/1": "twice", "3/1": "three times", "4/1": "four times", "1/2": "half", "1/3": "one third of", "3/2": "one and a half times", "5/2": "two and a half times" };
const mWord = (m: Fr): string => MWORD[`${m[0]}/${m[1]}`];

export function genMultiple(n: number, fx?: Fix): { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> } {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const { vars } = fx ?? pickVars(ctx, n);
  const a = ri(0, n - 1);
  const others = shuffled(Array.from({ length: n }, (_, i) => i).filter((i) => i !== a));
  // "combined" needs a third variable: with two variables B is the one other
  const size = n >= 3 && Math.random() < 0.55 ? ri(2, Math.min(3, n - 1)) : 1;
  const b = others.slice(0, size).sort((p, q) => p - q);
  const m = weighted(MULTIPLES);
  const op = opFrom(fx, pickOp);
  const bNoun = size === 1 ? vars[b[0]].noun : `${list(b.map((i) => vars[i].noun))} combined`;
  const sentence = `The number of ${vars[a].noun} must be ${opWord(op)} ${mWord(m)} the number of ${bNoun}.`;
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${sentence} Write down a constraint.`;
  const mk = (aa: number[], bb: number[]): LpSpec => ({ t: "rel", n, a: aa, b: bb, m, op, kind: "multiple" });
  return { prompt, sentence, data: { kind: "multiple", vars, op, spec: mk([a], b), slip: { spec: mk(b, [a]), what: "the comparison the wrong way round" }, info: { kind: "multiple", a, b, m } } };
}
export function genDifference(n: number, fx?: Fix): { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> } {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const { vars } = fx ?? pickVars(ctx, n);
  const [a, b] = shuffled(Array.from({ length: n }, (_, i) => i)).slice(0, 2);
  const k = ri(2, 15);
  const op = opFrom(fx, pickOp);
  const sentence = `The number of ${vars[a].noun} must exceed the number of ${vars[b].noun} by ${opWord(op)} ${k}.`;
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${sentence} Write down a constraint.`;
  const coeffs = (p: number, q: number): Fr[] => Array.from({ length: n }, (_, i) => (i === p ? fr(1) : i === q ? fr(-1) : ZERO));
  return { prompt, sentence, data: { kind: "difference", vars, op, spec: { t: "linear", coeffs: coeffs(a, b), op, rhs: fr(k), kind: "bound" }, slip: { spec: { t: "linear", coeffs: coeffs(b, a), op, rhs: fr(k), kind: "bound" }, what: "the two variables the wrong way round" }, info: { kind: "difference", a, b, k } } };
}
export function genBound(n: number, fx?: Fix): { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> } {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const { vars } = fx ?? pickVars(ctx, n);
  const i = ri(0, n - 1);
  const N = pick([10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 75, 80]);
  const op = opFrom(fx, pickOp);
  const each = !fx && Math.random() < 0.4 && op !== "=";
  const sentence = each
    ? `There must be ${opWord(op)} ${N} of each type. Write down the constraint for the number of ${vars[i].noun}.`
    : `The number of ${vars[i].noun} must be ${opWord(op)} ${N}.${fx ? "" : " Write down a constraint."}`;
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${sentence}`;
  const coeffs = Array.from({ length: n }, (_, j) => (j === i ? fr(1) : ZERO));
  const spec: LpSpec = { t: "linear", coeffs, op, rhs: fr(N), kind: "bound" };
  const slip: LpSpec | undefined = op === "=" ? undefined : { t: "linear", coeffs, op: flipOp(op), rhs: fr(N), kind: "bound" };
  return { prompt, sentence, data: { kind: "bound", vars, op, spec, slip: slip && { spec: slip, what: "the inequality sign the wrong way round" }, info: { kind: "bound", i, N, each } } };
}
export function genTotal(n: number, fx?: Fix): { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> } {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const { vars } = fx ?? pickVars(ctx, n);
  const N = pick([20, 24, 30, 36, 40, 48, 50, 60, 72, 80, 90, 100, 120, 150, 200]);
  const op = opFrom(fx, pickOp);
  const sentence = `The total number of ${list(vars.map((v) => v.noun))} ${ctx.did} must be ${opWord(op)} ${N}.`;
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${sentence} Write down a constraint.`;
  const coeffs = vars.map(() => fr(1));
  const spec: LpSpec = { t: "linear", coeffs, op, rhs: fr(N), kind: "bound" };
  const slip: LpSpec | undefined = op === "=" ? undefined : { t: "linear", coeffs, op: flipOp(op), rhs: fr(N), kind: "bound" };
  return { prompt, sentence, data: { kind: "total", vars, op, spec, slip: slip && { spec: slip, what: "the inequality sign the wrong way round" }, info: { kind: "total", N } } };
}

// ── The "try a number" check: a point that fits the words and that the slip does not allow ─
function checkPoint(c: Constraint, slip: Constraint, n: number, scale: number): number[] | undefined {
  const R = Math.max(10, Math.min(120, Math.round(scale)));
  let best: number[] | undefined;
  for (let t = 0; t < 500; t++) {
    const p = Array.from({ length: n }, () => ri(0, R));
    if (p.every((v) => v === 0)) continue;
    const f = p.map((v) => fr(v));
    if (!c.holds(f) || slip.holds(f)) continue;
    // the most telling point: closest to the boundary of the constraint, then the smallest numbers
    const score = (q: number[]): number => Math.abs(q.reduce((s, v, i) => s + v * (c.coeffs[i][0] / c.coeffs[i][1]), 0) - c.rhs[0] / c.rhs[1]) * 1000 + q.reduce((s, v) => s + v, 0);
    if (!best || score(p) < score(best)) best = p;
  }
  return best;
}

// ── The generator ────────────────────────────────────────────────────────────
export interface LpGenOptions {
  /** the numbers of variables that may be used (2 to 4); a question draws one of them */
  vars: number[];
  /** "resource" and "compare" at Level 1; a question draws one of them */
  styles: string[];
}
/** The "Write a constraint" question at Level 1 (the other levels are later chunks). */
export function generateLevel1(level: number, o: LpGenOptions): LpQuestion {
  const n = pick(o.vars.length ? o.vars : [2]);
  const style = pick(o.styles.length ? o.styles : ["resource", "compare"]);
  let g: { prompt: string; sentence: string; data: Omit<LpProblemData, "level" | "point"> };
  if (style === "resource") g = genResource(n);
  else {
    const kind = weighted<LpKind>([["multiple", 6], ["difference", 2], ["bound", 1.5], ["total", 1.5]]);
    g = kind === "multiple" ? genMultiple(n) : kind === "difference" ? genDifference(n) : kind === "bound" ? genBound(n) : genTotal(n);
  }
  const c = constraintOf(g.data.spec);
  const slip = g.data.slip ? constraintOf(g.data.slip.spec) : undefined;
  const scale = g.data.info.kind === "bound" || g.data.info.kind === "total" ? 2 * (g.data.info.N) : g.data.info.kind === "difference" ? 2 * g.data.info.k + 4 : 10;
  const point = g.data.info.kind !== "resource" && slip ? checkPoint(c, slip, n, scale) : undefined;
  return { prompt: g.prompt, answerText: constraintText(c, g.data.vars), data: { ...g.data, level, point } };
}
