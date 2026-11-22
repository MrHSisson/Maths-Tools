// Formulating Linear Programmes, "Formulate a problem": the whole model, with no React. See specs/linear-programming-formulate.md section 5.
// The question does NOT name the variables: the student assigns them. Nothing here is new maths, only assembly: the constraints are the "Write a constraint" rules
// (lpGen.ts, lpGenL23.ts) on one set of variables, with an objective from a profit (or a cost) per item. Each model is checked with lp.ts: the region is not empty and the
// objective has a single optimal corner point, so the model can be reused by the graphical tool later.
//   Level 1  resource limits and direct comparisons; a profit (or a cost) per item.
//   Level 2  adds percentages, ratios, decimal amounts, fixed totals; profit as price minus cost; a single-variable objective; a pack variable ("trays of six");
//            unit conversions (hours to minutes, kg to grams); "integers"; the data as a table.
//   Level 3  adds either-or limits, blends (minimise the cost of a mix), "exactly half", a remainder (the rest of a total, substituted out) and a kind that is exactly
//            a multiple of the others (twice the power smoothies, or the total of power and energy), which is substituted out too.
// Strict inequalities appear wherever the items are whole numbers (a strict edge has no best point on the real numbers): the question then says so.
import { fr, fadd, fdiv, ZERO, type Fr } from "./dim";
import { type Constraint, type Op, type Var, bestVertices, gcdInt, isStrict, vertices } from "./lp";
import {
  type Context, type Fix, type LpProblemData, type LpQuestion, type Resource, CONTEXTS, constraintOf, constraintText, genBound, genDifference, genMultiple, genResource, genTotal,
  cap, letDef, list, opWord, pick, unitOf, pickVars, resourceNumbers, ri, shuffled, weighted,
} from "./lpGen";
import { BLENDS, genBlend, genDecimal, genEitherOr, genPercent, genRatio } from "./lpGenL23";

interface LpProblemOptions {
  /** the numbers of variables that may be used (2 to 4); a question draws one of them */
  vars: number[];
  /** "max" (maximise a profit) or "min" (minimise a cost) */
  objective: string[];
  /** Level 2 and 3: the question says the items are whole numbers, and the model says "integers" */
  integers?: boolean;
  /** the data of resource limits as a table (display only) */
  table?: boolean;
}

type Part = { sentence?: string; prompt: string; data: Omit<LpProblemData, "level" | "point"> };
type Info = Extract<LpProblemData["info"], { kind: "problem" }>;

// ── Operators: strict ones are allowed when the items are whole numbers ──────
const limitOps = (sense: "max" | "min", strict: boolean): Op[] => (sense === "max" ? (strict ? ["≤", "≤", "≤", "<"] : ["≤"]) : (strict ? ["≥", "≥", "≥", ">"] : ["≥"]));
const cmpOps = (strict: boolean): Op[] => (strict ? ["≤", "≤", "≥", "≥", "≤", "≥", "<", ">"] : ["≤", "≥"]);
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** "5x + 8y" for the answer line */
const objText = (obj: readonly number[], syms: readonly string[], konst = 0): string => {
  const body = obj.map((k, i) => (k === 0 ? "" : `${k < 0 ? "−" : ""}${Math.abs(k) === 1 ? "" : Math.abs(k)}${syms[i]}`)).filter(Boolean).reduce((s, t, i) => (i === 0 ? t : t.startsWith("−") ? `${s} − ${t.slice(1)}` : `${s} + ${t}`), "");
  return konst ? `${konst} ${body.startsWith("−") ? `− ${body.slice(1)}` : `+ ${body}`}` : body;
};

// ── Everything a model is assembled from ─────────────────────────────────────
interface Draft {
  intro: string;
  /** what makes the objective: "Each loaf makes a profit of £5, ..." (left out when the data is a table) */
  objSentence: string;
  parts: Part[];
  /** what the introduction and the variable definitions of a part's own prompt are (stripped to leave its sentence) */
  prefix: string;
  vars: Var[];
  sing: string[];
  obj: number[];
  konst?: number;
  sense: "max" | "min";
  name: string;
  /** sentences after the parts */
  extra?: string[];
  /** can the items be whole numbers (so strict inequalities and "integers" make sense)? */
  canInteger: boolean;
  integerSentence?: string;
  closing: string;
  info: Partial<Info>;
  /** a table of the data: which parts it replaces, and what it says */
  table?: { head: string[]; rows: string[][]; replaces: number[]; sentence: string };
}

function finalise(d: Draft, level: number, integersWanted: boolean, showTable: boolean): LpQuestion | null {
  const cons: Constraint[] = d.parts.map((q) => constraintOf(q.data.spec));
  const strict = cons.some((c) => isStrict(c.op));
  if (strict && !d.canInteger) return null;
  if (strict && level >= 2 && !integersWanted) return null;
  const integers = d.canInteger && (integersWanted || strict);
  const n = d.vars.length;
  const vs = vertices(cons, n);
  const best = bestVertices(vs, d.obj.map((k) => fr(k)), d.sense);
  if (!best || best.at.length !== 1) return null; // empty region, or no single best corner
  if (best.at[0].every((f: Fr) => f[0] === 0)) return null; // the best plan is to do nothing
  // a strict edge needs room: the middle of the region must satisfy every sentence as it is worded
  const centre: Fr[] = Array.from({ length: n }, (_, i) => fdiv(vs.reduce((s, v) => fadd(s, v[i]), ZERO), fr(vs.length)));
  if (strict && !d.parts.every((q) => constraintOf(q.data.spec).holds(centre))) return null;

  const table = showTable && d.table ? d.table : undefined;
  const partSentences = d.parts.map((q, i) => (table?.replaces.includes(i) ? "" : q.sentence ?? q.prompt.slice(d.prefix.length).replace(/\s*Write down (a|the) constraint[^.]*\.$/, "")));
  const prompt = [d.intro, table ? table.sentence : d.objSentence, ...partSentences, ...(d.extra ?? []), integers ? (d.integerSentence ?? "Only whole numbers of items can be made.") : "", d.closing].filter(Boolean).join(" ");
  const syms = d.vars.map((v) => v.sym);
  const answerText = `${d.sense === "max" ? "Maximise" : "Minimise"} ${d.name} = ${objText(d.obj, syms, d.konst)} subject to ${cons.map((c) => constraintText(c, d.vars)).join(", ")}, ${syms.join(", ")} ≥ 0${integers ? ", all integers" : ""}`;
  const first = d.parts[0].data;
  const info: Info = { kind: "problem", sense: d.sense, name: d.name, obj: d.obj, parts: d.parts.map((q) => ({ ...q.data, level })), sing: d.sing, integers, ...(d.table ? { table: { head: d.table.head, rows: d.table.rows }, showTable } : {}), ...d.info };
  if (d.konst) info.konst = d.konst;
  return { prompt, answerText, data: { kind: "problem", level, vars: d.vars, op: first.op, spec: first.spec, info } };
}

// ── The standard problem: resource limits (or amounts to supply) and comparisons ─
/** a resource limit with the amount in a larger unit: 5 hours against minutes per item, or 12 kg against grams per item */
function genConv(n: number, fx: Fix & { res: Resource }): Part | null {
  const { vars, sing, res } = fx;
  const op: Op = pick(fx.ops ?? (["≤"] as Op[]));
  let per: number[], conv: { n: number; unit: string; factor: number }, unit: string, short: string;
  if (res.unit === "minutes") {
    per = resourceNumbers(n).per;
    const g = per.reduce((h, v) => gcdInt(h, v), 0);
    const hs = [2, 3, 4, 5, 6, 8, 10, 12].filter((h) => (60 * h) % g === 0 && per.some((a) => (60 * h) % a === 0) && 60 * h >= Math.max(...per) * 3);
    if (!hs.length) return null;
    conv = { n: pick(hs), unit: "hours", factor: 60 }; unit = "minutes"; short = "minutes";
  } else {
    per = Array.from({ length: n }, () => 50 * ri(2, 16));
    if (new Set(per).size < 2) return null;
    const g = per.reduce((h, v) => gcdInt(h, v), 0);
    const ks = Array.from({ length: 29 }, (_, i) => i + 2).filter((k) => (1000 * k) % g === 0 && per.some((a) => (1000 * k) % a === 0) && 1000 * k >= Math.max(...per) * 3);
    if (!ks.length) return null;
    conv = { n: pick(ks), unit: "kg", factor: 1000 }; unit = "grams"; short = "g";
  }
  const amount = conv.n * conv.factor;
  const tail = (a: number, first: boolean): string => `${a} ${unitOf(a, short)}${first ? ` of ${res.of}` : ""}`;
  const each = sing.map((s, i) => `each ${s} ${res.verb} ${tail(per[i], i === 0)}`);
  const sentence = `${cap(list(each))}. The total ${res.label} must be ${opWord(op, false)} ${conv.n} ${conv.unit}.`;
  const spec = { t: "linear" as const, coeffs: per.map((a) => fr(a)), op, rhs: fr(amount), kind: "resource" as const };
  const slip = { spec: { ...spec, rhs: fr(conv.n) }, what: `writing the limit as ${conv.n}, without changing ${conv.unit} to ${unit}` };
  return { sentence, prompt: sentence, data: { kind: "resource", vars, op, spec, slip, info: { kind: "resource", per, amount, unit, of: res.of, verb: res.verb, label: res.label, topic: res.topic, sing, conv } } };
}

function standard(n: number, sense: "max" | "min", level: number, strict: boolean, canPack: boolean): Draft | null {
  const ctx = sense === "max" ? pick(CONTEXTS.filter((c) => c.id !== "diet")) : CONTEXTS.find((c) => c.id === "diet")!;
  const picked = pickVars(ctx, n);
  const mode = sense === "max" ? "use" : "supply";
  const resources = ctx.resources.filter((r) => !r.decOnly && r.mode === mode);
  const pack = canPack && sense === "max" && resources.length >= 2;
  const nRes = pack ? 2 : resources.length >= 2 ? pick([1, 2]) : 1;
  // a pack variable: one kind is counted in trays of k, so its coefficients and its profit are k times an item's
  let vars = picked.vars, sing = picked.sing;
  let packs: number[] | undefined, packText: string[] | undefined, packInfo: Info["pack"];
  if (pack) {
    const i = ri(0, n - 1), k = pick([4, 6, 12]), name = pick(["tray", "box", "pack"]);
    packs = range(n).map((j) => (j === i ? k : 1));
    packText = range(n).map((j) => (j === i ? `${name} of ${k}` : ""));
    packInfo = { i, k, name, text: `${name} of ${k}`, item: sing[i] };
    vars = vars.map((v, j) => (j === i ? { ...v, noun: `${name}s of ${v.noun}` } : v));
  }
  const base: Fix = { ctx, vars, sing, packs, packText };
  const limit = limitOps(sense, strict);
  const parts: Part[] = shuffled(resources).slice(0, nRes).map((res) => genResource(n, { ...base, res, ops: limit }));
  // Level 2: sometimes a limit is in decimal amounts per item, or its amount is in another unit
  const decRes = ctx.resources.filter((r) => r.decOnly);
  if (level >= 2 && sense === "max" && !pack) {
    const r = Math.random();
    if (r < 0.25 && decRes.length) parts[parts.length - 1] = genDecimal(n, { ...base, res: pick(decRes), ops: limit });
    else if (r < 0.5) {
      const conv = Math.random() < 0.5 && decRes.length ? genConv(n, { ...base, res: pick(decRes), ops: limit }) : genConv(n, { ...base, res: pick(resources), ops: limit });
      if (conv) parts[parts.length - 1] = conv;
    }
  }
  // a comparison (always when there is one resource, so there are at least two constraints; never with a pack: its variable is not an item count)
  if (!pack && (nRes === 1 || Math.random() < (level >= 2 ? 0.7 : 0.5))) {
    const fx: Fix = { ...base, ops: cmpOps(strict) };
    if (level >= 3 && Math.random() < 0.6) {
      if (n >= 2 && Math.random() < 0.5) parts.push(halfPart(n, base));
      else parts.push(genEitherOr(n, pick(["most", "rate", "perItem"]), "fractions", { ...base, ops: sense === "max" ? (strict ? ["≤", "≤", "<"] : ["≤"]) : ["≥"] }));
    } else if (level >= 2) {
      const kind = weighted<"percent" | "ratio" | "total" | "multiple">([["percent", 4], ["ratio", 4], ["total", 1], ["multiple", 1]]);
      if (kind === "percent") parts.push(genPercent(n, ["one", "combined", "total", "morless"], fx));
      else if (kind === "ratio") parts.push(genRatio(n, fx));
      else if (kind === "total") parts.push(genTotal(n, { ...base, ops: ["="] as Op[] }));
      else parts.push(genMultiple(n, fx));
    } else {
      const kind = weighted<"multiple" | "difference" | "bound" | "total">([["multiple", 6], ["difference", 2], ["bound", 1.5], ["total", 1.5]]);
      parts.push(kind === "multiple" ? genMultiple(n, fx) : kind === "difference" ? genDifference(n, fx) : kind === "bound" ? genBound(n, fx) : genTotal(n, fx));
    }
  } else if (pack && Math.random() < 0.3) {
    // a limit on the number of trays (or items) of one kind
    parts.push(genBound(n, { ...base, ops: ["≤"] as Op[] }));
  }
  if (parts.length < 2) return null;

  // the objective: a profit (or cost) per item; at Level 2 a profit that is price minus cost, or a single variable to make as many as possible
  const single = level >= 2 && sense === "max" && !pack && Math.random() < 0.15 ? ri(0, n - 1) : undefined;
  let obj: number[], price: number[] | undefined, cost: number[] | undefined;
  const perItem = (): number[] => Array.from({ length: n }, () => (sense === "max" ? ri(2, 20) : ri(1, 9)));
  if (single !== undefined) obj = range(n).map((i) => (i === single ? 1 : 0));
  else if (sense === "max" && level >= 2 && Math.random() < 0.6) {
    cost = Array.from({ length: n }, () => ri(1, 12));
    price = cost.map((c) => c + ri(1, 12));
    obj = price.map((p, i) => p - cost![i]);
  } else obj = perItem();
  // a pack's profit is k times an item's
  const itemObj = [...obj];
  if (packInfo) obj[packInfo.i] = itemObj[packInfo.i] * packInfo.k;
  if (single === undefined && new Set(obj).size < 2) return null;

  const word = sense === "max" ? "makes a profit of" : "costs";
  const each = sing.map((s, i) => (price && cost
    ? (i === 0 ? `each ${s} sells for £${price[i]} and costs £${cost[i]} to make` : `each ${s} sells for £${price[i]} and costs £${cost[i]}`)
    : `each ${s} ${i === 0 ? `${word} £${itemObj[i]}` : `£${itemObj[i]}`}`));
  const items = picked.vars.map((v) => v.noun);
  const objSentence = single !== undefined ? "" : `${cap(list(each))}.`;
  const extra = packInfo ? [`The ${picked.vars[packInfo.i].noun} are sold in ${packInfo.name === "box" ? "boxes" : `${packInfo.name}s`} of ${packInfo.k}.`] : [];
  const closing = single !== undefined
    ? `Formulate this as a linear programming problem, to make as many ${picked.vars[single].noun} as possible.`
    : `Formulate this as a linear programming problem, to ${sense === "max" ? "maximise the profit" : "minimise the cost"}.`;

  // the data as a table: a column for the profit (or the price and cost) and for each limit that is amounts per item
  const tabled = parts.map((q, i) => ({ q, i })).filter(({ q }) => (q.data.info.kind === "resource" || q.data.info.kind === "decimal") && !(q.data.info as { packs?: unknown }).packs);
  let table: Draft["table"];
  if (!pack && single === undefined && tabled.length >= 1) {
    const cols = tabled.map(({ q }) => q.data.info as Extract<LpProblemData["info"], { kind: "resource" | "decimal" }>);
    const perOf = (info: (typeof cols)[number], i: number): string => (info.kind === "decimal" ? String(Math.round((info.a[i] / info.den) * 10000) / 10000) : String(info.per[i]));
    const head = ["", ...(price && cost ? ["Sells for (£)", "Costs (£)"] : [sense === "max" ? "Profit (£)" : "Cost (£)"]), ...cols.map((c) => `${cap(c.topic)} (${c.kind === "resource" && c.conv ? (c.conv.unit === "kg" ? "g" : c.unit) : c.unit})`)];
    const rows = picked.vars.map((v, i) => [cap(v.noun), ...(price && cost ? [String(price[i]), String(cost[i])] : [String(itemObj[i])]), ...cols.map((c) => perOf(c, i))]);
    const avail = ["Available", ...(price && cost ? ["", ""] : [""]), ...tabled.map(({ q }) => {
      const info = q.data.info as { conv?: { n: number; unit: string }; amount: number; unit: string };
      return `${opWord(q.data.op, false)} ${info.conv ? `${info.conv.n} ${info.conv.unit}` : `${info.amount}`}`;
    })];
    table = {
      head, rows: [...rows, avail], replaces: tabled.map(({ i }) => i),
      sentence: `The table shows ${price && cost ? "what each item sells for and costs to make" : sense === "max" ? "the profit from each item" : "the cost of each item"}, and the ${cols.map((c) => c.topic).join(" and ")} that each item ${sense === "max" ? "uses" : "supplies"}, with the amount available.`,
    };
  }
  return {
    intro: ctx.intro(items), objSentence, parts, prefix: `${ctx.intro(picked.vars.map((v) => v.noun))} ${letDef(picked.vars, ctx.did)} `,
    vars, sing, obj, sense, name: single !== undefined ? "N" : sense === "max" ? "P" : "C", extra, canInteger: true, closing,
    info: { price, cost, ...(single !== undefined ? { single } : {}), ...(packInfo ? { pack: packInfo, itemObj } : {}) } as Partial<Info>,
    table,
  };
}

/** "the number of X must be exactly half of the total number of ..." (Level 3) */
function halfPart(n: number, fx: Fix): Part {
  const a = ri(0, n - 1);
  const spec = { t: "rel" as const, n, a: [a], b: range(n), m: fr(1, 2), op: "=" as Op, kind: "ratio" as const };
  const sentence = `The number of ${fx.vars[a].noun} must be exactly half of the total number of ${list(fx.vars.map((v) => v.noun))}.`;
  return { sentence, prompt: sentence, data: { kind: "ratio", vars: fx.vars, op: "=", spec, slip: { spec: { ...spec, b: range(n).filter((i) => i !== a) }, what: "taking the half of the other variables only, not of the total" }, info: { kind: "ratio", form: "share", a: [a], b: range(n), m: fr(1, 2) } } };
}

// ── Level 3: a blend to make at least cost ───────────────────────────────────
function blendMix(n: number, level: number): Draft | null {
  const bc = pick(BLENDS.filter((b) => !b.invest));
  const names = shuffled(bc.names).slice(0, n);
  const syms = n === 4 ? ["w", "x", "y", "z"] : ["x", "y", "z"].slice(0, n);
  const vars: Var[] = names.map((s, i) => ({ sym: syms[i], noun: bc.noun(s), integer: false }));
  const sing = names.map((s) => `${bc.unit} of ${s}`);
  const blend = genBlend(n, { bc, names, ops: ["≥", "≤"] });
  const total = pick([40, 50, 60, 80, 100, 120, 200]);
  const tOp: Op = pick(["≥", "≥", "="]);
  const tSentence = `The mix must be ${tOp === "=" ? "exactly" : "at least"} ${total} ${bc.unit}s in total.`;
  const tPart: Part = {
    sentence: tSentence, prompt: tSentence,
    data: { kind: "total", vars, op: tOp, spec: { t: "linear", coeffs: vars.map(() => fr(1)), op: tOp, rhs: fr(total), kind: "bound" }, slip: { spec: { t: "linear", coeffs: vars.map(() => fr(1)), op: tOp === "=" ? "≤" : "≤", rhs: fr(total), kind: "bound" }, what: "the inequality sign the wrong way round" }, info: { kind: "total", N: total } },
  };
  void level;
  const obj = Array.from({ length: n }, () => ri(1, 9));
  if (new Set(obj).size < 2) return null;
  const costSentence = `${cap(list(sing.map((s, i) => (i === 0 ? `each ${s} costs £${obj[i]}` : `each ${s} £${obj[i]}`))))}.`;
  const blendSentence = blend.prompt.slice(`${bc.intro} ${letDef(vars, bc.did)} `.length).replace(/\s*Write down a constraint\.$/, "");
  return {
    intro: bc.intro, objSentence: costSentence, parts: [{ ...blend, sentence: blendSentence }, tPart], prefix: "", vars, sing, obj, sense: "min", name: "C", canInteger: false,
    closing: "Formulate this as a linear programming problem, to minimise the cost of the mix.", info: {},
  };
}

// ── Level 3: a total split over uses, the last use being "the rest" ──────────
const REM: Array<Context & { total: string; unit: string; rest: string; resource: Resource; lead: (T: number, uses: string[]) => string }> = [
  { id: "farm", lead: (T, u) => `A farmer has ${T} hectares of land to use for ${list(u)}.`, intro: () => "", did: "", items: [{ plural: "hectares of wheat", singular: "hectare of wheat" }, { plural: "hectares of barley", singular: "hectare of barley" }, { plural: "hectares of maize", singular: "hectare of maize" }], resources: [], total: "land", unit: "hectares", rest: "turf", resource: { topic: "labour", unit: "hours", of: "labour", verb: "needs", label: "labour needed", mode: "use" } },
  { id: "warehouse", lead: (T, u) => `A warehouse has ${T} square metres of floor space to use for ${list(u)}.`, intro: () => "", did: "", items: [{ plural: "square metres of toys", singular: "square metre of toys" }, { plural: "square metres of books", singular: "square metre of books" }, { plural: "square metres of games", singular: "square metre of games" }], resources: [], total: "floor space", unit: "square metres", rest: "stationery", resource: { topic: "staff time", unit: "hours", of: "staff time", verb: "needs", label: "staff time needed", mode: "use" } },
];
function remainder(n: number, strict: boolean): Draft | null {
  const rc = pick(REM);
  const m = Math.min(n, 3);
  const T = pick([40, 50, 60, 80, 100]);
  const items = shuffled(rc.items).slice(0, m);
  const syms = ["x", "y", "z"].slice(0, m);
  const vars: Var[] = items.map((it, i) => ({ sym: syms[i], noun: it.plural, integer: true }));
  const sing = items.map((it) => it.singular);
  const restNoun = `${rc.unit} of ${rc.rest}`, restSing = `${rc.unit.replace(/s$/, "")} of ${rc.rest}`;
  const pr = ri(1, 5);
  const profits = [...Array.from({ length: m }, () => ri(2, 9)), pr];
  const obj = profits.slice(0, m).map((p) => p - pr);
  if (obj.some((k) => k === 0) || new Set(obj).size < 2) return null;
  const rr = ri(1, 4);
  const per = [...Array.from({ length: m }, () => ri(rr + 1, 9)), rr];
  const L = rr * T + 10 * ri(4, 14);
  const parts: Part[] = [];
  // the rest cannot be negative: x + y ≤ T
  const sOp: Op = "≤";
  parts.push({ prompt: "", sentence: "", data: { kind: "total", vars, op: sOp, spec: { t: "linear", coeffs: vars.map(() => fr(1)), op: sOp, rhs: fr(T), kind: "bound" }, info: { kind: "total", N: T } } });
  // the resource, with the rest substituted out
  const diff = per.slice(0, m).map((a) => a - rr);
  const rOp: Op = "≤";
  parts.push({ prompt: "", sentence: "", data: { kind: "resource", vars, op: rOp, spec: { t: "linear", coeffs: diff.map((a) => fr(a)), op: rOp, rhs: fr(L - rr * T), kind: "resource" }, info: { kind: "resource", per: diff, amount: L - rr * T, unit: rc.resource.unit, of: rc.resource.of, verb: rc.resource.verb, label: rc.resource.label, topic: rc.resource.topic, sing } } });
  // sometimes a comparison between the named uses
  if (Math.random() < 0.5) {
    const fx: Fix = { ctx: rc, vars, sing, ops: cmpOps(strict) };
    parts.push(Math.random() < 0.6 ? genMultiple(m, fx) : genBound(m, fx));
  }
  const unitFor = (i: number): string => `each ${i < m ? sing[i] : restSing}`;
  const profitS = `${cap(list([...range(m), m].map((i, k) => (k === 0 ? `${unitFor(i)} makes a profit of £${profits[i]}` : `${unitFor(i)} £${profits[i]}`))))}.`;
  const resS = `${cap(list([...range(m), m].map((i, k) => (k === 0 ? `${unitFor(i)} ${rc.resource.verb} ${per[i]} ${unitOf(per[i], rc.resource.unit)} of ${rc.resource.of}` : `${unitFor(i)} ${per[i]} ${unitOf(per[i], rc.resource.unit)}`))))}. There are ${L} ${rc.resource.unit} of ${rc.resource.of} available.`;
  const rem = { T, unit: rc.unit, restNoun, restSing, profits, per, amount: L, resource: { topic: rc.resource.topic, unit: rc.resource.unit, verb: rc.resource.verb, label: rc.resource.label, of: rc.resource.of }, rest: rc.rest };
  return {
    intro: rc.lead(T, [...sing.map((s) => s.split(" of ")[1]), rc.rest]),
    objSentence: `${profitS} The rest of the ${rc.total} is used for ${rc.rest}.`, parts, prefix: "", vars, sing, obj, konst: pr * T, sense: "max", name: "P", canInteger: true,
    integerSentence: `Only whole numbers of ${rc.unit} can be used.`, extra: [resS], closing: "Formulate this as a linear programming problem, to maximise the profit.", info: { rem } as unknown as Partial<Info>,
  };
}

// ── Level 3: one kind is exactly a multiple of the others, so it is substituted out ──
const SMOOTHIES: Context = {
  id: "smoothie", intro: (i) => `A juice bar makes ${list(i)}.`, did: "made",
  items: [{ plural: "power smoothies", singular: "power smoothie" }, { plural: "energy smoothies", singular: "energy smoothie" }, { plural: "boost smoothies", singular: "boost smoothie" }, { plural: "green smoothies", singular: "green smoothie" }],
  resources: [{ topic: "preparation time", unit: "minutes", of: "preparation time", verb: "takes", label: "preparation time needed", mode: "use" }, { topic: "blending time", unit: "minutes", of: "blending time", verb: "needs", label: "blending time needed", mode: "use" }],
};
/** "the boost smoothies must be exactly twice the number of power smoothies (or of power and energy smoothies together, or the total of them)": the last kind is not a letter of its
 *  own; the model is written in the others only, and the relation is substituted into the objective and every limit */
function linked(n: number, strict: boolean): Draft | null {
  if (n > 3) return null;
  const ctx = pick([SMOOTHIES, SMOOTHIES, ...CONTEXTS.filter((c) => ["bakery", "print", "workshop"].includes(c.id))]);
  const picked = shuffled(ctx.items).slice(0, n + 1);
  const syms = ["x", "y", "z"].slice(0, n);
  const vars: Var[] = picked.slice(0, n).map((it, i) => ({ sym: syms[i], noun: it.plural, integer: true }));
  const sing = picked.slice(0, n).map((it) => it.singular);
  const dep = picked[n];
  const form = pick(["single", "combined", "combined", "sum"] as const);
  const S = form === "single" ? [ri(0, n - 1)] : range(n);
  const a = form === "sum" ? 1 : pick([2, 2, 3]);
  const profits = picked.map(() => ri(2, 9));
  const obj = range(n).map((j) => profits[j] + (S.includes(j) ? a * profits[n] : 0));
  const res = shuffled(ctx.resources.filter((r) => !r.decOnly && r.mode === "use")).slice(0, 2);
  if (res.length < 2) return null;
  const parts: Part[] = [];
  const resS: string[] = [];
  const rs: Array<{ topic: string; unit: string; verb: string; label: string; of: string; per: number[]; amount: number }> = [];
  for (const r of res) {
    const per = picked.map(() => ri(1, 9));
    const coeffs = range(n).map((j) => per[j] + (S.includes(j) ? a * per[n] : 0));
    const L = Math.max(...coeffs) * ri(6, 14) + ri(0, 9);
    if ([...coeffs, L].reduce((h, v) => gcdInt(h, v), 0) !== 1) return null;
    const spec = { t: "linear" as const, coeffs: coeffs.map((c) => fr(c)), op: "≤" as Op, rhs: fr(L), kind: "resource" as const };
    parts.push({ prompt: "", sentence: "", data: { kind: "resource", vars, op: "≤", spec, info: { kind: "resource", per: coeffs, amount: L, unit: r.unit, of: r.of, verb: r.verb, label: r.label, topic: r.topic, sing } } });
    resS.push(`${cap(list(picked.map((it, i) => (i === 0 ? `each ${it.singular} ${r.verb} ${per[i]} ${unitOf(per[i], r.unit)} of ${r.of}` : `each ${it.singular} ${per[i]} ${unitOf(per[i], r.unit)}`))))}. There are ${L} ${r.unit} of ${r.of} available.`);
    rs.push({ topic: r.topic, unit: r.unit, verb: r.verb, label: r.label, of: r.of, per, amount: L });
  }
  if (Math.random() < 0.5) {
    const fx: Fix = { ctx, vars, sing, ops: cmpOps(strict) };
    parts.push(Math.random() < 0.6 ? genMultiple(n, fx) : genBound(n, fx));
  }
  const times = a === 1 ? "equal to " : a === 2 ? "twice " : `${a} times `;
  const of = form === "single" ? `the number of ${picked[S[0]].plural}` : `the total number of ${list(S.map((j) => picked[j].plural))}`;
  const relation = `The number of ${dep.plural} ${ctx.did} must be exactly ${times}${of}.`;
  const objSentence = `${cap(list(picked.map((it, i) => (i === 0 ? `each ${it.singular} makes a profit of £${profits[i]}` : `each ${it.singular} £${profits[i]}`))))}.`;
  return {
    intro: ctx.intro(picked.map((it) => it.plural)), objSentence, parts, prefix: "", vars, sing, obj, sense: "max", name: "P", canInteger: true,
    extra: [relation, ...resS], closing: "Formulate this as a linear programming problem, to maximise the profit.",
    info: { link: { dep: { plural: dep.plural, singular: dep.singular }, items: picked.map((it) => ({ plural: it.plural, singular: it.singular })), form, S, a, profits, resources: rs } },
  };
}

// ── The generator ────────────────────────────────────────────────────────────
function attempt(n: number, sense: "max" | "min", level: number, integersWanted: boolean, showTable: boolean): LpQuestion | null {
  const strict = level === 1 || integersWanted;
  let d: Draft | null;
  if (level >= 3 && sense === "min") d = blendMix(n, level);
  else if (level >= 3) {
    const r = Math.random();
    d = r < 0.2 ? remainder(n, strict) : r < 0.45 ? linked(n, strict) : standard(n, sense, level, strict, false);
  }
  else d = standard(n, sense, level, strict, level === 2 && Math.random() < 0.2);
  return d ? finalise(d, level, integersWanted, showTable) : null;
}

/** The "Formulate a problem" question at Levels 1 to 3. */
export function generateProblem(level: number, o: LpProblemOptions): LpQuestion {
  const counts = o.vars.length ? o.vars : [2];
  const senses = o.objective.length ? o.objective : ["max"];
  const integers = level >= 2 && o.integers !== false;
  for (let tries = 0; tries < 400; tries++) {
    const q = attempt(pick(counts), pick(senses) as "max" | "min", level, integers, !!o.table);
    if (q) return q;
  }
  throw new Error("lpProblem: no good model was found in 400 tries");
}
