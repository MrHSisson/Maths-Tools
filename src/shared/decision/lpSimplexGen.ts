// The Simplex Algorithm: the question generators, with no React. See specs/linear-programming-simplex.md section 2.
// The numbers are DESIGNED, not drawn: pick the optimal point (whole numbers), which constraints bind there and a whole dual, then build the right-hand sides and the
// objective from them, so the optimum is whole; then run the real algorithm and KEEP the problem only if every tableau on the way meets the level's niceness
// budget (the denominators the textbooks use, few non-whole entries, a small number of iterations, no ties). Rejection is cheap: each run is microseconds.
import { type Fr, fr, fsub, fmul, fdiv } from "./dim";
import { type SxCon, type SxSpec, type Run, pathStats, readTab, runSpec, unitColumns } from "./lpSimplex";
import { CONTEXTS, ri, pick, shuffled, unitOf, weighted, list } from "./lpGen";
import { wholeAnalysis, wholeNice } from "./lpSimplexWhole";
import { gcdInt } from "./lp";

export type SxKind = "setup" | "reverse" | "pivot" | "solve" | "interpret" | "practical";
type StartForm = "standard" | "min" | "ge" | "lower" | "eq";
interface SxStory {
  intro: string;
  items: Array<{ plural: string; singular: string }>;
  /** one per constraint: the resource, and the factor the data is multiplied by (1, 2, 5, 10, or 1/10 for a decimal per unit) */
  res: Array<{ topic: string; unit: string; of: string; verb: string; label: string; scale: [number, number]; /** Level 3 wording: the limit is given as percentages of the whole (a limit of 100%), or as the most of each kind that all of it could make ("20 chairs or 30 tables"); `cap` is the right-hand side of the tidy constraint */ form?: "percent" | "either"; cap?: number; /** the extra constraint of a Non-standard problem: a minimum ("at least 40 hours must be used") or an exact amount */ op?: "≥" | "=" }>;
  /** the profit per item is c times this */
  profitScale: number;
}
export interface SxData {
  kind: SxKind;
  level: number;
  /** display only: the Cambridge layout (A) or the Oxford layout (B, with a Basic variable column and a Row column) */
  layout: "A" | "B";
  spec: SxSpec;
  startForm: StartForm;
  story?: SxStory;
  /** the tableau the question gives, as an index into the run's tableaux (pivot, reverse and interpret) */
  at: number;
  /** One pivot: the question names the pivot, and the student carries out the iteration */
  pivotGiven?: boolean;
  /** a situation whose data is shown as a table (limits, use per item, profit per item) rather than in sentences */
  table?: boolean;
  /** only whole numbers make sense: the optimum has a fraction in it, and the best practical plan is asked for; `given` says the question hands over the optimum */
  whole?: { given: boolean };
}
interface SxQuestion { prompt: string; answerText: string; data: SxData }

export const varNames = (n: number): string[] => (n === 4 ? ["w", "x", "y", "z"] : ["x", "y", "z"].slice(0, n));

// ── The niceness budget by level (the denominators the textbooks use) ────────
interface Budget { dens: number[]; iters: [number, number]; entry: number; nonWhole: number }
export const BUDGET: Record<number, Budget> = {
  1: { dens: [1, 2, 3, 4], iters: [2, 2], entry: 30, nonWhole: 8 },
  2: { dens: [1, 2, 3, 4, 5, 6, 8, 10], iters: [2, 3], entry: 60, nonWhole: 14 },
  3: { dens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], iters: [2, 4], entry: 120, nonWhole: 24 },
};
const POOLS: Record<number, number[]> = { 1: [0, 1, 1, 2, 2, 3], 2: [0, 1, 1, 2, 2, 3, 4, 5], 3: [0, 1, 1, 2, 2, 3, 4, 5] };
export function nice(run: Run, level: number): boolean {
  const b = BUDGET[level];
  const s = pathStats(run);
  return (level >= 2 || !run.tie) && s.dens.every((d) => b.dens.includes(d)) && s.iterations >= b.iters[0] && s.iterations <= b.iters[1] && s.maxEntry <= b.entry && s.nonWhole <= b.nonWhole;
}

// ── Designing a problem from its optimum ─────────────────────────────────────
interface Base { A: number[][]; b: number[]; c: number[]; xs: number[] }
/** a constraint whose limit is smaller than one of its own coefficients (10x + 50y ≤ 40: not even one y fits) reads as a mistake, so the design never has one */
function limitBelowCoefficient(A: number[][], b: number[]): boolean {
  return A.some((r, i) => r.some((v) => v > b[i]));
}
function designBase(n: number, m: number, pool: number[], mixed = false): Base | null {
  const A = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(pool)));
  if (A.some((r) => r.every((v) => v === 0)) || Array.from({ length: n }, (_, j) => A.every((r) => r[j] === 0)).some(Boolean)) return null;
  if (new Set(A.map((r) => r.join())).size < m) return null;
  // the optimum uses at least two of the variables most of the time: a plan with only one kind (x, 0, 0) is the occasional question, not the usual one
  // (a minimise problem with a mixed-sign cost leaves at least one variable out of the best plan, so it never uses them all)
  const kx = mixed ? ri(Math.min(2, n - 1), Math.min(n - 1, m)) : Math.min(n, m) >= 2 && Math.random() >= 0.12 ? ri(2, Math.min(n, m)) : 1;
  const basicX = shuffled(Array.from({ length: n }, (_, j) => j)).slice(0, kx);
  const xs = Array.from({ length: n }, (_, j) => (basicX.includes(j) ? ri(1, 9) : 0));
  const binding = shuffled(Array.from({ length: m }, (_, i) => i)).slice(0, kx);
  const b = A.map((r, i) => r.reduce((t, v, j) => t + v * xs[j], 0) + (binding.includes(i) ? 0 : ri(1, 9)));
  const y = A.map((_, i) => (binding.includes(i) ? ri(1, 4) : 0));
  const c = Array.from({ length: n }, (_, j) => {
    const s = A.reduce((t, r, i) => t + y[i] * r[j], 0);
    return basicX.includes(j) ? s : s - ri(1, 3);
  });
  // a minimise problem with a mixed-sign cost: the variables left out of the best plan cost something (a positive C coefficient), the ones used earn (a negative one)
  if (mixed) {
    if (basicX.length === n) return null;
    for (let j = 0; j < n; j++) if (!basicX.includes(j)) c[j] = -ri(1, 6);
  }
  if (c.some((v, j) => (mixed && !basicX.includes(j) ? false : v < 1)) || b.some((v) => v <= 0)) return null;
  if (limitBelowCoefficient(A, b)) return null;
  return { A, b, c, xs };
}

/** solve n equations in n unknowns exactly (the last column is the right-hand side); null when there is no single solution */
function solveFr(M0: Fr[][]): Fr[] | null {
  const n = M0.length;
  const M = M0.map((r) => [...r]);
  for (let c = 0; c < n; c++) {
    let r = c;
    while (r < n && M[r][c][0] === 0) r++;
    if (r === n) return null;
    [M[c], M[r]] = [M[r], M[c]];
    M[c] = M[c].map((v) => fdiv(v, M[c][c]));
    for (let i = 0; i < n; i++) if (i !== c && M[i][c][0] !== 0) { const f = M[i][c]; M[i] = M[i].map((v, k) => fsub(v, fmul(f, M[c][k]))); }
  }
  return M.map((row) => row[n]);
}
/** a problem whose optimum is NOT whole: n of the constraints bind at a point with fractions in it (whole right-hand sides), and the objective is any whole-number
 *  objective that makes that point the best (its dual is positive), so the optimal value is usually a fraction too */
function designWhole(n: number, m: number, pool: number[]): Base | null {
  if (m < n) return null;
  const A = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(pool)));
  if (A.some((r) => r.filter((v) => v !== 0).length < 2)) return null; // every limit involves at least two of the variables
  if (A.some((r) => r.every((v) => v === 0)) || Array.from({ length: n }, (_, j) => A.every((r) => r[j] === 0)).some(Boolean)) return null;
  if (new Set(A.map((r) => r.join())).size < m) return null;
  const binding = shuffled(Array.from({ length: m }, (_, i) => i)).slice(0, n);
  const bB = binding.map(() => ri(4, 40));
  const x = solveFr(binding.map((i, r) => [...A[i].map((v) => fr(v)), fr(bB[r])]));
  if (!x || x.some((v) => v[0] <= 0) || x.every((v) => v[1] === 1)) return null;
  const c = Array.from({ length: n }, () => ri(1, 12));
  // the dual: A_B^T y = c, and every y must be positive for the point to be the unique best
  const y = solveFr(Array.from({ length: n }, (_, j) => [...binding.map((i) => fr(A[i][j])), fr(c[j])]));
  if (!y || y.some((v) => v[0] <= 0)) return null;
  const b = A.map((r, i) => {
    if (binding.includes(i)) return bB[binding.indexOf(i)];
    const at = r.reduce((t, v, j) => t + (v * x[j][0]) / x[j][1], 0);
    return Math.floor(at + 1e-9) + ri(1, 4);
  });
  if (b.some((v) => v <= 0)) return null;
  if (limitBelowCoefficient(A, b)) return null;
  return { A, b, c, xs: x.map((v) => Math.floor(v[0] / v[1])) };
}

function spec(form: StartForm, base: Base, n: number, m: number): SxSpec | null {
  const cons: SxCon[] = base.A.map((a, i) => ({ a: [...a], op: "≤", b: base.b[i] }));
  if (form === "standard") return { sense: "max", c: base.c, cons };
  if (form === "min") return { sense: "min", c: base.c.map((v) => -v), cons };
  if (form === "lower") {
    // x ≥ l for some variables: the design is in X = x − l
    const lower: number[] = Array.from({ length: n }, () => (Math.random() < 0.5 ? ri(1, 4) : 0));
    if (lower.reduce((s, v) => s + v, 0) === 0) lower[ri(0, n - 1)] = ri(1, 4);
    return { sense: "max", c: base.c, cons: cons.map((k) => ({ ...k, b: k.b + k.a.reduce((t, v, j) => t + v * lower[j], 0) })), lower };
  }
  // a new constraint through (or below) the optimum that the origin does not satisfy
  const a = Array.from({ length: n }, () => ri(0, 3));
  if (a.filter((v) => v !== 0).length < 2) return null; // an equality involves at least two of the variables
  const at = a.reduce((t, v, j) => t + v * base.xs[j], 0);
  if (at < 1) return null;
  // (a limit smaller than one of its own coefficients reads as a mistake, here as everywhere)
  if (a.some((v) => v > at)) return null;
  if (form === "eq") return { sense: "max", c: base.c, cons: [...cons, { a, op: "=", b: at }] };
  const g = Math.max(1, at - ri(0, Math.min(3, at - 1)));
  void m;
  if (a.some((v) => v > g)) return null;
  return { sense: "max", c: base.c, cons: [...cons, { a, op: "≥", b: g }] };
}

// ── The story: the same numbers, dressed ─────────────────────────────────────
function dress(spec: SxSpec, n: number, m: number, hard: string[] = []): SxStory | null {
  // the limits are all ≤, except that the last may be a minimum (≥) or an exact amount (=): that is a Non-standard problem
  const last = spec.cons.length - 1;
  if (spec.cons.some((k, i) => (k.op !== "≤" && i !== last) || k.a.some((v) => v < 0))) return null;
  if (spec.lower?.some((v) => v > 0) && spec.cons.some((k) => k.op !== "≤")) return null;
  m = spec.cons.length;
  // each constraint must already be in lowest terms, so the student's simplification gives back the designed numbers
  if (spec.cons.some((k) => [...k.a, k.b].reduce((h, v) => gcdInt(h, v), 0) !== 1)) return null;
  const ctxs = CONTEXTS.filter((c) => c.id !== "diet" && c.resources.length >= m);
  if (!ctxs.length) return null;
  const ctx = pick(ctxs);
  const items = shuffled(ctx.items).slice(0, n);
  const res: SxStory["res"] = shuffled(ctx.resources).slice(0, m).map((r, i) => {
    if (spec.cons[i].op !== "≤") return { topic: r.topic, unit: r.unit, of: r.of, verb: r.verb, label: r.label, scale: [1, 1] as [number, number], op: spec.cons[i].op as "≥" | "=" };
    const scale: [number, number] = r.decOnly ? pick<[number, number]>([[1, 10], [1, 5], [1, 2]]) : weighted<[number, number]>([[[1, 1], 2], [[2, 1], 1], [[5, 1], 1], [[10, 1], 2]]);
    return { topic: r.topic, unit: r.unit, of: r.of, verb: r.verb, label: r.label, scale };
  });
  if (hard.length) {
    // Level 3: some limits are a percentage of the whole, or the most that all of it could make of each kind; at least one is
    res.forEach((r, i) => {
      const k = spec.cons[i];
      const nz = k.a.filter((v) => v !== 0);
      const options: Array<"percent" | "either"> = [];
      if (hard.includes("percent") && 100 % k.b === 0) options.push("percent");
      if (hard.includes("either") && nz.length >= 2 && nz.every((v) => k.b % v === 0)) options.push("either");
      if (!options.length || Math.random() < 0.3) return;
      const f = pick(options);
      r.form = f;
      if (f === "percent") { r.scale = [100 / k.b, 1]; r.unit = "%"; } else r.cap = k.b;
    });
    if (!res.some((r) => r.form)) return null;
  }
  return { intro: ctx.intro(items.map((i) => i.plural)), items, res, profitScale: 1 };
}

const num = (f: Fr): string => (f[1] === 1 ? String(f[0]) : String(Math.round((f[0] / f[1]) * 10000) / 10000));
/** the story's data as sentences: each resource's use per item, the amount available, and the profits */
function storyText(story: SxStory, spec: SxSpec): string {
  const m = story.res.length;
  const parts: string[] = [];
  for (let i = 0; i < m; i++) {
    const r = story.res[i];
    if (r.form === "percent") {
      const use = story.items.map((it, j) => ({ it, p: spec.cons[i].a[j] * r.scale[0] })).filter((x) => x.p !== 0);
      const each = use.map((x, k) => `each ${x.it.singular} ${k === 0 ? `${r.verb} ${x.p}% of the available ${r.of}` : `${x.p}%`}`);
      const list = each.length <= 1 ? each.join("") : `${each.slice(0, -1).join(", ")} and ${each[each.length - 1]}`;
      parts.push(`${list.charAt(0).toUpperCase()}${list.slice(1)}. No more than 100% of the ${r.of} can be used.`);
      continue;
    }
    if (r.form === "either") {
      const most = story.items.map((it, j) => ({ it, c: spec.cons[i].a[j] === 0 ? 0 : r.cap! / spec.cons[i].a[j] })).filter((x) => x.c !== 0).map((x) => `${x.c} ${x.it.plural}`);
      parts.push(`All the ${r.of} available is enough for ${most.slice(0, -1).join(", ")} or ${most[most.length - 1]}, but not for more than one of these.`);
      continue;
    }
    if (r.op) {
      const used = story.items.map((it, j) => ({ it, a: spec.cons[i].a[j] })).filter((x) => x.a !== 0);
      const each = used.map((x, k) => `each ${x.it.singular} ${k === 0 ? `${r.verb} ${x.a} ${unitOf(x.a, r.unit)}${r.of ? ` of ${r.of}` : ""}` : `${x.a} ${unitOf(x.a, r.unit)}`}`);
      const list = each.length <= 1 ? each.join("") : `${each.slice(0, -1).join(", ")} and ${each[each.length - 1]}`;
      const b = spec.cons[i].b;
      parts.push(`${list.charAt(0).toUpperCase()}${list.slice(1)}. ${r.op === "≥" ? "At least" : "Exactly"} ${b} ${unitOf(b, r.unit)}${r.of ? ` of ${r.of}` : ""} must be used.`);
      continue;
    }
    const per = story.items.map((it, j) => ({ it, a: fr(spec.cons[i].a[j] * r.scale[0], r.scale[1]) })).filter((x) => x.a[0] !== 0);
    const each = per.map((x, k) => `each ${x.it.singular} ${k === 0 ? `${r.verb} ${num(x.a)} ${unitOf(x.a[1] === 1 ? x.a[0] : 2, r.unit)}${r.of ? ` of ${r.of}` : ""}` : `${num(x.a)} ${unitOf(x.a[1] === 1 ? x.a[0] : 2, r.unit)}`}`);
    const list = each.length <= 1 ? each.join("") : `${each.slice(0, -1).join(", ")} and ${each[each.length - 1]}`;
    const tot = fr(spec.cons[i].b * r.scale[0], r.scale[1]);
    parts.push(`${list.charAt(0).toUpperCase()}${list.slice(1)}. There ${tot[1] === 1 && tot[0] === 1 ? "is" : "are"} ${num(tot)} ${unitOf(tot[1] === 1 ? tot[0] : 2, r.unit)}${r.of ? ` of ${r.of}` : ""} available.`);
  }
  const profit = story.items.map((it, j) => `each ${it.singular} ${j === 0 ? "makes a profit of " : ""}£${spec.c[j] * story.profitScale}`);
  const plist = profit.length <= 1 ? profit.join("") : `${profit.slice(0, -1).join(", ")} and ${profit[profit.length - 1]}`;
  const lows = (spec.lower ?? []).map((v, j) => (v > 0 ? `at least ${v} ${story.items[j].plural}` : "")).filter(Boolean);
  const lowText = lows.length ? ` The firm must make ${list(lows)}.` : "";
  return `${story.intro} ${parts.join(" ")}${lowText} ${plist.charAt(0).toUpperCase()}${plist.slice(1)}.`;
}

// ── Writing the problem as text ──────────────────────────────────────────────
export const termsTex = (c: readonly number[], vars: readonly string[]): string => {
  let s = "";
  c.forEach((k, j) => {
    if (k === 0) return;
    const body = `${Math.abs(k) === 1 ? "" : Math.abs(k)}${vars[j]}`;
    s += s === "" ? (k < 0 ? "-" : "") + body : ` ${k < 0 ? "-" : "+"} ${body}`;
  });
  return s || "0";
};
const OPTEX = { "≤": "\\le", "≥": "\\ge", "=": "=" } as const;
function problemTex(spec: SxSpec): string {
  const vars = varNames(spec.c.length);
  const lines = spec.cons.map((k) => `$${termsTex(k.a, vars)} ${OPTEX[k.op]} ${k.b}$`);
  const lower = spec.lower?.some((v) => v > 0);
  const nonneg = lower ? vars.map((v, j) => `$${v} \\ge ${spec.lower![j]}$`).join(", ") : `$${vars.join(", ")} \\ge 0$`;
  return `${spec.sense === "max" ? "Maximise" : "Minimise"} $${spec.sense === "max" ? "P" : "C"} = ${termsTex(spec.c, vars)}$ subject to ${lines.join(", ")}, ${nonneg}.`;
}

const PROMPT: Record<SxKind, string> = {
  setup: "Write the problem as equations using slack variables, and write the initial simplex tableau.",
  reverse: "",
  pivot: "",
  solve: "Use the simplex algorithm to solve the problem. State the value of every variable and of the objective.",
  interpret: "",
  practical: "",
};

// ── The generator ────────────────────────────────────────────────────────────
export interface SxOptions {
  kind: SxKind;
  /** numbers of variables and of constraints that may be used (each question draws one) */
  vars: number[];
  cons: number[];
  /** or, instead of vars and cons, the sizes that may be used, as [variables, constraints] pairs (each question draws one) */
  sizes?: Array<[number, number]>;
  /** the starting forms that may be used ("standard", "min", "ge", "lower", "eq"); only drawn when `nonStandard` is set */
  forms: string[];
  /** Level 3 wording of a situation: the kinds of limit that may be drawn besides plain use ("percent" and "either"); at least one limit in the problem is one of them */
  hard?: string[];
  /** Read a tableau: which tableau of the run is given. Without this the level decides. */
  tableau?: "optimal" | "part" | "either";
  /** any number of variables up to four, whatever the level (Read a tableau draws its own size and judges it by that size) */
  anySize?: boolean;
  /** One iteration: the tableau the question gives is the initial one (the default), or one part-way through the run */
  startAt?: "initial" | "later";
  /** a change of form is always needed first (Non-standard problems, at any level; One pivot at Level 3). Set up and Solve never change form. */
  nonStandard?: boolean;
  /** "bare" or "story" (Levels 2 and 3, standard form only) */
  context: string[];
  /** whole numbers: the optimum has a fraction in it and the best practical plan is asked for (the `practical` kind always; Solve and Read a tableau when ticked) */
  whole: boolean;
  /** `practical` only: the question hands over the optimum rather than asking for it */
  given: boolean;
  /** One pivot: the pivot is given, not chosen */
  pivotGiven: boolean;
  /** Level 3: a lower bound and an equality are handled by substitution and as two inequalities ("substitute"), or as rows ("rows") */
  method?: "substitute" | "rows";
  layout: "A" | "B";
}
function attempt(level: number, o: SxOptions, askFraction: boolean): SxQuestion | null {
  const kind = o.kind;
  const whole = kind === "practical" || (o.whole && kind === "solve" && level < 3);
  // the Is it practical? sub-tool always has a fraction in the optimum; Solve and Read a tableau ask the whole-number question of any optimum, whole or not
  const fractional = whole && (kind === "practical" || askFraction);
  const caps = { n: level === 1 ? 2 : level === 2 ? 3 : 4, m: level === 1 ? 3 : level === 2 ? 3 : 4 };
  // each level has its own number of variables: two at Level 1, three at Level 2, three or four at Level 3
  const ownN = level === 1 ? [2] : level === 2 ? [3] : [3, 4];
  const okN = (v: number): boolean => (o.anySize ? v >= 2 && v <= 4 : v >= 2 && v <= caps.n && ownN.includes(v));
  const fitting = (o.sizes ?? []).filter(([sn, sm]) => okN(sn) && sm >= 2 && sm <= (o.anySize ? 4 : caps.m));
  const fallback: [number, number] = level === 1 ? [2, 2] : [3, 3];
  const nChoices = o.vars.filter(okN);
  const [n, m] = o.sizes ? (fitting.length ? pick(fitting) : fallback) : [nChoices.length ? pick(nChoices) : fallback[0], pick(o.cons.filter((v) => v >= 2 && v <= caps.m).length ? o.cons.filter((v) => v >= 2 && v <= caps.m) : [fallback[1]])];
  // reverse and the story stay with the standard form; starting forms are the Oxford range, Level 3 only
  let form: StartForm = "standard";
  if (o.nonStandard && kind !== "reverse" && kind !== "interpret" && !whole) {
    // a change of form is always needed here: a standard-form start is never drawn, whatever is asked
    const changes = (o.forms as string[]).filter((f) => f !== "standard") as StartForm[];
    // a tableau is all that One pivot shows, so only a ≥ constraint or an equality (a start that is not at the origin) makes it a Level 3 question
    const usable = changes;
    const allowed = usable.length ? usable : kind === "pivot" ? (["ge", "eq"] as StartForm[]) : (["min", "ge", "lower", "eq"] as StartForm[]);
    form = pick(allowed);
  }
  const base = fractional ? designWhole(n, m, POOLS[level]) : designBase(n, m, POOLS[level], form === "min");
  if (!base) return null;
  const sp = spec(form, base, n, m);
  if (!sp) return null;
  if (o.method === "rows") { if (form === "lower") sp.lowerAsRow = true; if (form === "eq") sp.eqAsRow = true; }
  let story: SxStory | undefined;
  let table = false;
  // Level 2 is always a situation in words or a table, never the bare inequalities
  const ctxList = o.context.length ? o.context : ["bare"];
  const wordsOnly = level === 2 && !o.nonStandard && (kind === "setup" || kind === "solve");
  const chosen = pick(wordsOnly ? (ctxList.filter((x) => x !== "bare").length ? ctxList.filter((x) => x !== "bare") : ["story", "table"]) : ctxList);
  // a minimise has a mixed-sign cost, which has no situation: it is only ever drawn as inequalities
  const storyForm = form === "standard" || form === "lower" || form === "ge" || form === "eq";
  if ((level >= 2 || o.nonStandard) && storyForm && (chosen === "story" || chosen === "table") && sp.cons.length <= 3) {
    table = chosen === "table" && form === "standard";
    story = dress(sp, n, m, level === 3 && form === "standard" ? o.hard : undefined) ?? undefined;
    if (!story) return null; // a situation was asked for: keep looking for numbers that read as one
  }
  let run: Run;
  try { run = runSpec(sp); } catch { return null; }
  const w = whole ? wholeAnalysis(sp, run) : undefined;
  // when the optimum is handed over the tableaux are never shown, so only the optimum itself has to read well; otherwise every tableau on the way must
  if (kind === "practical" && o.given && w) { if ((level < 2 && run.tie) || ![...w.x, w.p].every((v) => BUDGET[level].dens.includes(v[1]))) return null; } else if (!nice(run, w && fractional ? Math.min(3, level + 1) : level)) return null; // a fractional optimum puts fractions all through the tableaux: its path is judged by the next level up
  if (w && (fractional ? !wholeNice(w, level) : w.frac.length > 0)) return null;
  // a tableau that is given to be read must show its basic variables: exactly one unit column for each constraint
  if ((kind === "interpret" || kind === "reverse") && run.tabs.some((t) => unitColumns(t) !== t.m)) return null;
  // the tableau the question gives
  let at = 0;
  // each level has its own tableau: Level 1 the first pivot and the optimal tableau; Level 2 a pivot part-way through and a tableau that is not yet optimal
  // One iteration starts from the initial tableau, or (a standard-form problem only) from one part-way through the run
  if (kind === "pivot") at = form !== "standard" || o.startAt !== "later" ? 0 : ri(1, Math.max(1, run.steps.length - 1));
  else if (kind === "interpret" && o.tableau) {
    // the tableau asked for: the optimal one, one before it (so it is not yet optimal), or either
    const last = run.tabs.length - 1;
    const early = last >= 2;
    if (o.tableau === "part" && !early) return null;
    at = o.tableau === "optimal" || (o.tableau === "either" && (!early || Math.random() < 0.5)) ? last : ri(1, last - 1);
  } else if (kind === "interpret") at = level === 1 ? run.tabs.length - 1 : pick([run.tabs.length - 1, Math.max(1, run.tabs.length - 2)]);
  const data: SxData = { kind, level, layout: o.layout, spec: sp, startForm: form, story, at, ...(whole ? { whole: { given: kind === "practical" && o.given } } : {}), ...(table ? { table: true } : {}), ...(kind === "pivot" && o.pivotGiven && run.iters[at] ? { pivotGiven: true } : {}) };
  const vars = varNames(n);
  const problem = story ? (table ? `${story.intro} The table shows what one of each item needs, how much of each resource is available, and the profit per item.` : storyText(story, sp)) : problemTex(sp);
  let prompt: string;
  if (kind === "setup" && story && form !== "standard") prompt = `${problem} Formulate this as a linear programming problem, write it in standard form for the simplex algorithm (maximising, every constraint a ≤ with a slack variable), and write the initial simplex tableau.`;
  else if (kind === "setup") prompt = story ? `${problem} Formulate this as a linear programming problem, simplify the constraints, write them as equations using slack variables, and write the initial simplex tableau.` : `${problem} ${form === "standard" ? PROMPT.setup : "Write the problem in standard form for the simplex algorithm (maximising, every constraint a ≤ with a slack variable), and write the initial simplex tableau."}`;
  else if (kind === "reverse") prompt = "The initial simplex tableau for a maximising problem is shown. Write down the linear programming problem it represents, with the constraints as inequalities, and say what each slack variable means.";
  else if (kind === "pivot") prompt = at === 0 && run.iters[0]?.start ? "The tableau shows the problem in standard form, but a right-hand side is negative, so the origin is not feasible. Choose a pivot to reach a feasible start, and carry out the iteration." : `A simplex tableau for a maximising problem is shown. Choose the pivot, showing the θ-values, and carry out one iteration of the simplex algorithm.`;
  else if (kind === "interpret") prompt = `${story ? `${problem} ` : ""}A simplex tableau for a maximising problem is shown${story ? " for this problem" : ""}. Is the solution optimal? Explain how you know. State the value of every variable and of the objective at this stage, which constraints are at their limit, and what each slack variable means.`;
  else if (kind === "practical") {
    const asks = "Explain why this is not a practical solution, then find the best practical plan and state its value.";
    const ask = story ? asks.replace("value", "profit") : asks;
    const need = story ? `Only whole numbers of ${list(story.items.slice(0, n).map((it) => it.plural))} can be made.` : `${vars.map((v) => `$${v}$`).join(", ").replace(/, ([^,]*)$/, " and $1")} must be integers.`;
    prompt = o.given
      ? `${problem} ${need} ${story ? `Let ${list(vars.map((v, j) => `$${v}$ be the number of ${story.items[j].plural}`))}. ` : ""}The simplex algorithm gives ${solutionText(w!, vars)}. ${ask}`
      : `${problem} ${need} Use the simplex algorithm to solve the problem without the whole-number condition. ${ask}`;
  } else prompt = `${problem} ${PROMPT.solve}`;
  if (data.pivotGiven) {
    const it = run.iters[at];
    const names = [...vars, ...Array.from({ length: run.final.ns }, (_, i) => `s_${i + 1}`)];
    const where = o.layout === "B" ? `in the $${names[it.col - 1]}$ column, in the row of the basic variable $${names[run.tabs[at].basis[it.row - 1] - 1]}$` : `in the $${names[it.col - 1]}$ column of row R${it.row + 1} (R1 is the objective row)`;
    prompt = `${it.start ? "The tableau shows the problem in standard form, but a right-hand side is negative, so the origin is not feasible. " : "A simplex tableau for a maximising problem is shown. "}The pivot is the $${fmtFr(it.pivot)}$ ${where}. Carry out one iteration of the simplex algorithm, showing the row operations.`;
  }
  if (whole && kind === "solve") prompt += ` Only whole numbers ${story ? `of ${list(story.items.slice(0, n).map((it) => it.plural))} can be made` : "make sense"}. Is the solution practical? If not, find the best practical plan and state its ${story ? "profit" : "value"}.`;
  void vars;
  return { prompt, answerText: w && (kind === "practical" || kind === "solve" || kind === "interpret") ? (w.frac.length ? `${answerPlain(sp, run, kind, at)}; best practical plan ${varNames(n).map((v, j) => `${v} = ${w.best.pt[j]}`).join(", ")}, P = ${w.best.p}` : `${answerPlain(sp, run, kind, at)}; the solution is practical`) : answerPlain(sp, run, kind, at), data };
}

const fmtFr = (v: Fr): string => (v[1] === 1 ? String(v[0]) : `${v[0]}/${v[1]}`);
/** the optimum of the linear programme in a sentence ("x = 11/3, y = 5 and P = 62 2/3") */
function solutionText(w: { x: Fr[]; p: Fr }, vars: string[]): string {
  return `${vars.map((v, j) => `$${v} = ${fmtFr(w.x[j])}$`).join(", ")} and $P = ${fmtFr(w.p)}$`;
}

/** the answer as plain text (for the printed answers): the values of every variable and slack, and P, from the tableau the question is about */
function answerPlain(sp: SxSpec, run: Run, kind: SxKind, at: number): string {
  const n = sp.c.length;
  const names = [...varNames(n), ...Array.from({ length: run.final.ns }, (_, i) => `s${i + 1}`)];
  const fmt = (v: Fr): string => (v[1] === 1 ? String(v[0]) : `${v[0]}/${v[1]}`);
  const tab = kind === "interpret" ? run.tabs[Math.min(at, run.tabs.length - 1)] : run.final;
  if (kind === "setup" || kind === "reverse") return kind === "setup" ? `initial tableau with ${n} variables and ${run.final.m} slack variables` : "the problem the tableau represents";
  if (kind === "pivot") {
    const it = run.iters.find((i) => i.from === run.tabs[Math.min(at, run.tabs.length - 1)]);
    return it ? `pivot: row ${it.row + 1}, column ${names[it.col - 1] ?? ""}` : "optimal: no pivot";
  }
  const r = readTab(tab);
  return `${r.values.map((v, j) => `${names[j]} = ${fmt(v)}`).join(", ")}, P = ${fmt(r.p)}`;
}

/** The question for a sub-tool at a level. A fixed problem is never used: the rejection loop is bounded, and a failure to find one is an error to fix, not to hide. */
export function generateSimplex(level: number, o: SxOptions): SxQuestion {
  // whether a Solve or Read a tableau question with Whole Numbers on has a fraction in its optimum is chosen once, so the rarer kind is not starved by the retries
  const askFraction = Math.random() < 0.5;
  for (let tries = 0; tries < 400000; tries++) {
    const q = attempt(level, o, askFraction);
    if (q) return q;
  }
  throw new Error(`lpSimplexGen: no problem found for level ${level}, ${o.kind}`);
}
