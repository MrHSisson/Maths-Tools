// Formulating Linear Programmes, "Write a constraint", Levels 2 and 3 (the Level 1 generators are in lpGen.ts), with no React. See specs/linear-programming-formulate.md.
// Level 2: percentages (of one variable, of several combined, of the total, p% more or less than), ratios (always written x : y) and shares ("a third of the total"),
// and decimal amounts per item. Level 3: blends and averages, and either-or limits (x/60 + y/45 ≤ 1). Equations first, as at Level 1: the numbers are picked, the
// constraint is built from them by lp.ts, and the words are written from the same numbers.
import { type Fr, fr, ZERO } from "./dim";
import { type Constraint, type Op, type Var, gcdInt, lcmInt } from "./lp";
import {
  type Fix, type LpGenOptions, type LpKind, type LpProblemData, type LpQuestion, type LpSpec, CONTEXTS, AMOUNTS, opFrom, ri, pick, weighted, shuffled, cap, list, pickOp, pickVars, letDef,
  opWord, constraintOf, constraintText, generateLevel1,
} from "./lpGen";

type Gen = { prompt: string; data: Omit<LpProblemData, "level" | "point"> };
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const maxCoeff = (c: Constraint): number => Math.max(...c.coeffs.map((f) => Math.abs(f[0])));
/** a decimal for a sentence: 0.4, 1.25 (the fraction must be a terminating decimal) */
export function decStr(f: Fr): string {
  const v = f[0] / f[1];
  return String(Math.round(v * 10000) / 10000);
}
/** can this fraction be written as a finite decimal? */
export const isFinite10 = (f: Fr): boolean => { let d = f[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };

export interface LpGenOptionsFull extends LpGenOptions {
  /** Level 2 percentages: "one", "combined", "total", "morless" */
  pctOf: string[];
  /** Level 3 either-or: "most", "rate" (and, for the Level 2 fractional-amounts style, "perItem", "requirement") */
  capGiven: string;
  /** Level 2 ratios and shares: which of "ratio" and "share" may be used (both when empty) */
  ratioForms?: string[];
}

// ── Level 2: percentages ─────────────────────────────────────────────────────
const P_OF = [10, 20, 25, 30, 40, 50, 60, 75, 80];
export function genPercent(n: number, forms: string[], fx?: Fix): Gen {
  for (let tries = 0; tries < 60; tries++) {
    const ctx = fx?.ctx ?? pick(CONTEXTS);
    const { vars } = fx ?? pickVars(ctx, n);
    const allowed = forms.filter((f) => (f === "combined" ? n >= 3 : true));
    const f = pick(allowed.length ? allowed : ["one"]);
    const form = f === "morless" ? pick(["more", "less"] as const) : (f as "one" | "combined" | "total");
    const a = ri(0, n - 1);
    const others = shuffled(range(n).filter((i) => i !== a));
    const op = opFrom(fx, pickOp);
    let b: number[], p: number, m: Fr;
    if (form === "combined") { b = others.slice(0, ri(2, Math.min(3, n - 1))).sort((x, y) => x - y); p = pick(P_OF); m = fr(p, 100); }
    else if (form === "total") { b = range(n); p = pick(P_OF); m = fr(p, 100); }
    else if (form === "more" || form === "less") { b = [others[0]]; p = pick(form === "more" ? [20, 25, 50] : [20, 25]); m = fr(form === "more" ? 100 + p : 100 - p, 100); }
    else { b = [others[0]]; p = pick(P_OF); m = fr(p, 100); }
    const spec: LpSpec = { t: "rel", n, a: [a], b, m, op, kind: "percent" };
    const c = constraintOf(spec);
    if (maxCoeff(c) > 20) continue;
    const A = vars[a].noun;
    const names = (xs: number[]): string => list(xs.map((i) => vars[i].noun));
    const phrase = form === "one" ? `${p}% of the number of ${vars[b[0]].noun}`
      : form === "combined" ? `${p}% of the number of ${names(b)} combined`
        : form === "total" ? `${p}% of the total number of ${names(b)}`
          : `${p}% ${form} than the number of ${vars[b[0]].noun}`;
    const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} The number of ${A} must be ${opWord(op)} ${phrase}. Write down a constraint.`;
    let slip: { spec: LpSpec; what: string };
    if (form === "total") slip = { spec: { ...spec, b: others }, what: `taking the percentage of the other variables only, not of the total` };
    else if (form === "more" || form === "less") slip = { spec: { ...spec, m: fr(p, 100) }, what: `taking ${p}% of ${vars[b[0]].noun}, not ${p}% ${form} than them` };
    else slip = { spec: { ...spec, a: b, b: [a] }, what: "the percentage taken of the wrong quantity" };
    return { prompt, data: { kind: "percent", vars, op, spec, slip, info: { kind: "percent", form, a: [a], b, m, p } } };
  }
  return genPercent(2, ["one"], fx);
}

// ── Level 2: ratios (x : y) and shares of the total ────────────────
const RATIOS: Array<[number, number]> = [[1, 2], [2, 3], [3, 4], [1, 3], [3, 2], [2, 5], [5, 2], [3, 5], [4, 3], [5, 3], [1, 4]];
const SHARES: Array<[Fr, string]> = [[fr(1, 2), "half"], [fr(1, 3), "one third"], [fr(1, 4), "one quarter"], [fr(2, 3), "two thirds"], [fr(3, 4), "three quarters"], [fr(1, 5), "one fifth"], [fr(2, 5), "two fifths"], [fr(3, 5), "three fifths"]];
export function genRatio(n: number, fx?: Fix, only?: "ratio" | "share"): Gen {
  const ctx = fx?.ctx ?? pick(CONTEXTS);
  const { vars } = fx ?? pickVars(ctx, n);
  const op = opFrom(fx, pickOp);
  const form = only ?? weighted<"ratio" | "share">([["ratio", 7], ["share", 3]]);
  const all = vars.map((v) => v.noun);
  const names = (xs: number[]): string => list(xs.map((i) => vars[i].noun));
  const head = `${ctx.intro(all)} ${letDef(vars, ctx.did)}`;
  if (form === "ratio") {
    // "the ratio of A to B is at least 2 : 3", with A one kind or two kinds combined: always written as a ratio, never as "one for every"
    const aSize = n >= 3 && Math.random() < 0.4 ? 2 : 1;
    const order = shuffled(range(n));
    const a = order.slice(0, aSize).sort((x, y) => x - y);
    const b = order[aSize];
    const [num, den] = pick(RATIOS);
    const spec: LpSpec = { t: "rel", n, a, b: [b], m: fr(num, den), op, kind: "ratio" };
    return { prompt: `${head} The ratio of the number of ${names(a)}${aSize > 1 ? " combined" : ""} to the number of ${vars[b].noun} must be ${opWord(op)} ${num} : ${den}. Write down a constraint.`, data: { kind: "ratio", vars, op, spec, slip: { spec: { ...spec, m: fr(den, num) }, what: "the ratio the wrong way round" }, info: { kind: "ratio", form, a, b: [b], m: fr(num, den) } } };
  }
  const a = ri(0, n - 1);
  const [m, word] = pick(SHARES);
  const spec: LpSpec = { t: "rel", n, a: [a], b: range(n), m, op, kind: "ratio" };
  return { prompt: `${head} The number of ${vars[a].noun} must be ${opWord(op)} ${word} of the total number of ${list(all)}. Write down a constraint.`, data: { kind: "ratio", vars, op, spec, slip: { spec: { ...spec, b: range(n).filter((i) => i !== a) }, what: "taking the share of the other variables only, not of the total" }, info: { kind: "ratio", form, a: [a], b: range(n), m } } };
}

// ── Level 2: decimal amounts per item ────────────────────────────────────────
export function genDecimal(n: number, fx?: Fix): Gen {
  const ctxs = CONTEXTS.filter((c) => c.resources.some((r) => r.decOnly));
  for (let tries = 0; tries < 80; tries++) {
    const ctx = fx?.ctx ?? pick(ctxs);
    const res = fx?.res ?? pick(ctx.resources.filter((r) => r.decOnly));
    const { vars, sing } = fx ?? pickVars(ctx, n);
    const den = pick([2, 4, 5, 10]);
    const a = Array.from({ length: n }, () => ri(1, Math.min(20, 3 * den)));
    if (new Set(a).size < 2 || a.every((v) => v % den === 0)) continue;
    const g = a.reduce((h, v) => gcdInt(h, v), 0);
    const ok = AMOUNTS.filter((N) => N >= 40 && (N * den) % g === 0 && a.some((v) => (N * den) % v === 0) && N * den <= 30000);
    if (!ok.length) continue;
    const amount = pick(ok);
    const op = opFrom(fx, () => weighted<Op>([["≤", 6], ["<", 1.5], ["=", 1]]));
    const per = a.map((v) => fr(v, den));
    const tail = (f: Fr, first: boolean): string => `${decStr(f)} ${res.unit}${first ? ` of ${res.of}` : ""}`;
    const each = sing.map((s, i) => `each ${s} ${res.verb} ${tail(per[i], i === 0)}`);
    const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} ${cap(list(each))}. The total ${res.label} must be ${opWord(op, false)} ${amount} ${res.unit}. Write down a constraint for the ${res.topic}.`;
    const spec: LpSpec = { t: "linear", coeffs: per, op, rhs: fr(amount), kind: "resource" };
    // the slip: the coefficients scaled to whole numbers but the right-hand side left as it was
    const slip: LpSpec = { t: "linear", coeffs: a.map((v) => fr(v)), op, rhs: fr(amount), kind: "resource" };
    return { prompt, data: { kind: "decimal", vars, op, spec, slip: { spec: slip, what: "multiplying the coefficients to clear the decimals but not the right-hand side" }, info: { kind: "decimal", a, den, amount, unit: res.unit, of: res.of, verb: res.verb, label: res.label, topic: res.topic, sing } } };
  }
  return genDecimal(2, fx);
}

// ── Level 3: blends and averages ─────────────────────────────────────────────
interface BlendCtx { id: string; unit: string; intro: string; names: string[]; noun: (name: string) => string; did: string; comp: string; step: number; lo: number; hi: number; invest: boolean; describe: (names: string[], pcts: number[]) => string; require: (op: Op, p: number) => string }
export const BLENDS: BlendCtx[] = [
  { id: "oil", unit: "litre", intro: "A shop blends oils to make a salad dressing.", names: ["oil A", "oil B", "oil C", "oil D"], noun: (s) => `litres of ${s}`, did: "in the mix", comp: "olive oil", step: 10, lo: 10, hi: 90, invest: false,
    describe: (nm, p) => `${cap(list(nm.map((s, i) => `${s} is ${p[i]}% olive oil`)))}.`, require: (op, p) => `The mix must be ${opWord(op, false)} ${p}% olive oil.` },
  { id: "feed", unit: "kilogram", intro: "A farmer mixes feeds for her animals.", names: ["feed A", "feed B", "feed C", "feed D"], noun: (s) => `kilograms of ${s}`, did: "in the mix", comp: "protein", step: 10, lo: 10, hi: 90, invest: false,
    describe: (nm, p) => `${cap(list(nm.map((s, i) => `${s} is ${p[i]}% protein`)))}.`, require: (op, p) => `The mix must be ${opWord(op, false)} ${p}% protein.` },
  { id: "drink", unit: "litre", intro: "A bar mixes drinks to make a cocktail.", names: ["drink A", "drink B", "drink C", "drink D"], noun: (s) => `litres of ${s}`, did: "in the mix", comp: "alcohol", step: 10, lo: 10, hi: 90, invest: false,
    describe: (nm, p) => `${cap(list(nm.map((s, i) => `${s} is ${p[i]}% alcohol`)))}.`, require: (op, p) => `The mix must be ${opWord(op, false)} ${p}% alcohol.` },
  { id: "invest", unit: "pound", intro: "An investor splits her money between funds.", names: ["bonds", "shares", "a property fund", "a savings account"], noun: (s) => `pounds invested in ${s}`, did: "", comp: "interest", step: 1, lo: 2, hi: 12, invest: true,
    describe: (nm, p) => `${cap(list(nm.map((s, i) => `${s} pay${/^(bonds|shares)$/.test(s) ? "" : "s"} ${p[i]}% interest`)))}.`, require: (op, p) => `The overall return must be ${opWord(op, false)} ${p}%.` },
];
export function genBlend(n: number, fxb?: { bc: BlendCtx; names: string[]; ops?: Op[] }): Gen {
  for (let tries = 0; tries < 80; tries++) {
    const bc = fxb?.bc ?? pick(BLENDS);
    const names = fxb?.names ?? shuffled(bc.names).slice(0, n);
    const pcts = Array.from({ length: n }, () => bc.lo + bc.step * ri(0, Math.round((bc.hi - bc.lo) / bc.step)));
    const lo = Math.min(...pcts), hi = Math.max(...pcts);
    if (hi - lo < 2 * bc.step) continue;
    const share = bc.invest ? ri(lo + 1, hi - 1) : 5 * ri(Math.floor(lo / 5) + 1, Math.ceil(hi / 5) - 1);
    if (share <= lo || share >= hi) continue;
    const op = fxb?.ops ? pick(fxb.ops) : pickOp();
    const contents = pcts.map((p) => fr(p, 100));
    const spec: LpSpec = { t: "blend", contents, share: fr(share, 100), op };
    const c = constraintOf(spec);
    if (maxCoeff(c) > 20) continue;
    // lettered x, y, z (four variables are w, x, y, z)
    const syms = n === 4 ? ["w", "x", "y", "z"] : ["x", "y", "z"].slice(0, n);
    const vars: Var[] = names.map((s, i) => ({ sym: syms[i], noun: bc.noun(s), integer: false }));
    const prompt = `${bc.intro} ${letDef(vars, bc.did)} ${bc.describe(names, pcts)} ${bc.require(op, share)} Write down a constraint.`;
    // slips: only one item's content used; or the total forgotten (the share compared with the amount, not the share of the mix)
    const slip = Math.random() < 0.5
      ? { spec: { ...spec, contents: contents.map((f, i) => (i === 0 ? f : ZERO)) } as LpSpec, what: `using the content of ${names[0]} only, as if the mix were all ${names[0]}` }
      : { spec: { t: "linear", coeffs: contents, op, rhs: fr(share, 100), kind: "percent" } as LpSpec, what: "forgetting the total: the amount of the component is compared with the share, not with the share of the mix" };
    return { prompt, data: { kind: "blend", vars, op, spec, slip, info: { kind: "blend", contents, share: fr(share, 100), comp: bc.comp, invest: bc.invest } } };
  }
  return genBlend(2, fxb && { ...fxb, names: fxb.names.slice(0, 2) });
}

// ── Level 3: either-or limits ────────────────────────────────────────────────
const CAPS = [12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120, 150];
const CAPS_PER_ITEM = [12, 15, 20, 24, 30, 40, 45, 60]; // 60 / a is a nice number of minutes: 5, 4, 3, 5/2, 2, 3/2, 4/3, 1
const HOURS = [2, 3, 4, 5, 6, 8, 10];
const minTex = (a: number): string => { const f = fr(60, a); return f[1] === 1 ? String(f[0]) : `$\\frac{${f[0]}}{${f[1]}}$`; };
export function genEitherOr(n: number, given: string, fx?: Fix): Gen {
  for (let tries = 0; tries < 200; tries++) {
    const requirement = given === "requirement";
    const ctx = fx?.ctx ?? (requirement ? CONTEXTS.find((c) => c.id === "diet")! : pick(CONTEXTS.filter((c) => c.device)));
    const { vars, sing } = fx ?? pickVars(ctx, n);
    const pool = given === "perItem" ? CAPS_PER_ITEM : CAPS;
    const caps = shuffled(pool).slice(0, n);
    const T = given === "rate" || given === "perItem" ? pick(HOURS) : 1;
    const op: Op = fx?.ops ? pick(fx.ops) : requirement ? weighted<Op>([["≥", 6], [">", 1.5]]) : weighted<Op>([["≤", 6], ["<", 1.5]]);
    const spec: LpSpec = { t: "either", caps: caps.map((a) => fr(a)), amount: fr(T), op };
    const c = constraintOf(spec);
    if (maxCoeff(c) > (n === 4 ? 12 : 9) || Math.abs(c.rhs[0]) > 1500 || c.rhs[1] !== 1) continue;
    const L = caps.reduce((l, a) => lcmInt(l, a), 1);
    const ints = caps.map((a) => L / a);
    const nouns = vars.map((v) => v.noun);
    const dev = ctx.device;
    let sentence: string;
    if (given === "most") sentence = `The ${dev!.noun} can ${dev!.verb} ${caps.map((a, i) => `at most ${a} ${nouns[i]}`).reduce((s, t, i, all) => (i === 0 ? t : i === all.length - 1 ? `${s}, or ${t}` : `${s}, ${t}`), "")} in a day, or a mixture of them.${op === "<" ? ` It cannot be used for the whole day.` : ""}`;
    else if (given === "rate") sentence = `The ${dev!.noun} can ${dev!.verb} ${caps.map((a, i) => `${a} ${nouns[i]} an hour`).reduce((s, t, i, all) => (i === 0 ? t : i === all.length - 1 ? `${s}, or ${t}` : `${s}, ${t}`), "")}, or a mixture of them, and it is used for ${T} hours.${op === "<" ? ` It cannot be used for the whole time.` : ""}`;
    else if (given === "perItem") sentence = `On the ${dev!.noun}, ${caps.map((a, i) => `each ${sing[i]} takes ${minTex(a)} minutes`).reduce((s, t, i, all) => (i === 0 ? t : i === all.length - 1 ? `${s} and ${t}` : `${s}, ${t}`), "")}. The ${dev!.noun} is used for ${T} hours.${op === "<" ? ` It cannot be used for the whole time.` : ""}`;
    else {
      const topic = pick(["protein", "iron"]);
      sentence = `${cap(caps.map((a, i) => `each ${sing[i]} supplies $\\frac{1}{${a}}$ of the daily requirement of ${topic}`).reduce((s, t, i, all) => (i === 0 ? t : i === all.length - 1 ? `${s} and ${t}` : `${s}, ${t}`), ""))}. The meal must supply ${op === ">" ? "more than" : "at least"} the whole daily requirement.`;
    }
    const prompt = `${ctx.intro(nouns)} ${letDef(vars, ctx.did)} ${sentence} Write down a constraint.`;
    // the slips of brief 4.5: each is a different constraint, and the intercepts check catches it
    const rhsT = L * T;
    const lin = (coeffs: number[], rhs: number, label: string): { spec: LpSpec; what: string } => ({ spec: { t: "linear", coeffs: coeffs.map((v) => fr(v)), op, rhs: fr(rhs), kind: "capacity" }, what: label });
    const options: Array<{ spec: LpSpec; what: string }> = [];
    if (ints[0] !== ints[1]) options.push(lin([ints[1], ints[0], ...ints.slice(2)], rhsT, "swapping the coefficients when clearing the fractions"));
    if (given === "most" || requirement) {
      options.push(lin(range(n).map(() => 1), caps.reduce((s, a) => s + a, 0), "adding the capacities"));
      options.push(lin(caps, 1, "multiplying by each capacity instead of dividing"));
    } else options.push(lin(ints, L, "leaving out the time"));
    const slip = pick(options);
    return { prompt, data: { kind: "eitherOr", vars, op, spec, slip, info: { kind: "eitherOr", caps, given: given as "most" | "rate" | "perItem" | "requirement", T, sing } } };
  }
  return genEitherOr(2, "most", fx);
}

// ── The "try a number" check, by looking at every small point: fits the words, the slip does not allow it ─
/** the most telling such point: closest to the boundary of the constraint, then the smallest numbers (an exhaustive search of the small lattice, so equalities are found too) */
function searchPoint(c: Constraint, slip: Constraint, n: number): { p: number[]; fits: boolean } | undefined {
  const R = n === 2 ? 60 : n === 3 ? 25 : 12;
  const score = (q: number[]): number => Math.abs(q.reduce((s, v, i) => s + v * (c.coeffs[i][0] / c.coeffs[i][1]), 0) - c.rhs[0] / c.rhs[1]) * 1000 + q.reduce((s, v) => s + v, 0);
  // a point the words allow and the slip refuses is best; if the slip is the weaker one, a point the words rule out and the slip allows
  let yes: number[] | undefined, no: number[] | undefined;
  const p = new Array<number>(n).fill(0);
  const walk = (i: number): void => {
    if (i === n) {
      if (p.every((v) => v === 0)) return;
      const f = p.map((v) => fr(v));
      const h = c.holds(f), sh = slip.holds(f);
      if (h && !sh) { if (!yes || score(p) < score(yes)) yes = [...p]; }
      else if (!h && sh) { if (!no || score(p) < score(no)) no = [...p]; }
      return;
    }
    for (let v = 0; v <= R; v++) { p[i] = v; walk(i + 1); }
  };
  walk(0);
  return yes ? { p: yes, fits: true } : no ? { p: no, fits: false } : undefined;
}

// ── The generator for every level ────────────────────────────────────────────
export function generateConstraint(level: number, o: LpGenOptionsFull): LpQuestion {
  if (level <= 1) return generateLevel1(level, o);
  const n = pick(o.vars.length ? o.vars : [2]);
  const style = pick(o.styles.length ? o.styles : level === 2 ? ["percent", "ratio", "decimal"] : ["blend", "eitherOr"]);
  let g: Gen = genPercent(2, ["one"]);
  for (let tries = 0; tries < 25; tries++) {
    g = makeOne(level, n, style, o);
    const sl = g.data.slip ? constraintOf(g.data.slip.spec) : undefined;
    const cc = constraintOf(g.data.spec);
    if (!sl || sl.op !== cc.op || sl.rhs[0] * cc.rhs[1] !== cc.rhs[0] * sl.rhs[1] || sl.coeffs.some((f, i) => f[0] * cc.coeffs[i][1] !== cc.coeffs[i][0] * f[1])) break;
  }
  return finish(level, n, g);
}
function makeOne(level: number, n: number, style: string, o: LpGenOptionsFull): Gen {
  let g: Gen;
  if (style === "percent") g = genPercent(n, o.pctOf.length ? o.pctOf : ["one", "combined", "total", "morless"]);
  else if (style === "ratio") g = genRatio(n, undefined, o.ratioForms?.length === 1 ? (o.ratioForms[0] as "ratio" | "share") : undefined);
  else if (style === "fractional") g = genEitherOr(n, pick(["perItem", "requirement"]));
  else if (style === "decimal") g = genDecimal(n);
  else if (style === "blend") g = genBlend(n);
  else g = genEitherOr(n, o.capGiven || "most");
  void level;
  return g;
}
function finish(level: number, n: number, g: Gen): LpQuestion {
  const c = constraintOf(g.data.spec);
  const slip = g.data.slip ? constraintOf(g.data.slip.spec) : undefined;
  const k: LpKind = g.data.kind;
  // the "try a number" check: a point that fits the words and that the slip does not allow; the resource-like kinds use their intercepts instead
  const found = k === "percent" || k === "ratio" || k === "blend" ? (slip ? searchPoint(c, slip, n) : undefined) : undefined;
  return { prompt: g.prompt, answerText: constraintText(c, g.data.vars), data: { ...g.data, level, point: found?.p, ...(found && !found.fits ? { pointFits: false } : {}) } };
}
