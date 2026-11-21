// Formulating Linear Programmes, "Formulate a problem": the whole model, with no React. See specs/linear-programming-formulate.md section 5.
// The question does NOT name the variables: the student assigns them. Nothing here is new maths, only assembly: the constraints are the "Write a constraint" rules
// (lpGen.ts, lpGenL23.ts) on one set of variables, with an objective from a profit (or a cost) per item. Each model is checked with lp.ts: the region is not empty and the
// objective has a single optimal corner point, so the model can be reused by the graphical tool later. Levels 1 and 2 so far.
import { fr, type Fr } from "./dim";
import { type Op, bestVertices, vertices } from "./lp";
import { type Constraint } from "./lp";
import { type Fix, type LpProblemData, type LpQuestion, CONTEXTS, constraintOf, constraintText, genBound, genDifference, genMultiple, genResource, genTotal, cap, letDef, list, pick, pickVars, ri, shuffled, weighted } from "./lpGen";
import { genDecimal, genPercent, genRatio } from "./lpGenL23";

interface LpProblemOptions {
  /** the numbers of variables that may be used (2 to 4); a question draws one of them */
  vars: number[];
  /** "max" (maximise a profit) or "min" (minimise a cost) */
  objective: string[];
  /** Level 2: the question says the items are whole numbers, and the model says "integers" */
  integers?: boolean;
}

/** "5x + 8y" for the answer line */
const objText = (obj: readonly number[], syms: readonly string[]): string => obj.map((k, i) => `${k === 1 ? "" : k}${syms[i]}`).join(" + ");

type Part = { sentence?: string; prompt: string; data: Omit<LpProblemData, "level" | "point"> };

/** One attempt at a model; null if it is not a good problem (empty region, several best corners, the best corner the origin). */
function attempt(n: number, sense: "max" | "min", level: number, integers: boolean): LpQuestion | null {
  const ctx = sense === "max" ? pick(CONTEXTS.filter((c) => c.id !== "diet")) : CONTEXTS.find((c) => c.id === "diet")!;
  const { vars, sing } = pickVars(ctx, n);
  const mode = sense === "max" ? "use" : "supply";
  const resources = ctx.resources.filter((r) => !r.decOnly && r.mode === mode);
  const nRes = resources.length >= 2 ? pick([1, 2]) : 1;
  const base = { ctx, vars, sing };
  const limit: Op = sense === "max" ? "≤" : "≥";
  const parts: Part[] = shuffled(resources).slice(0, nRes).map((res) => genResource(n, { ...base, res, ops: [limit] }));
  // Level 2: sometimes one of the limits is given as decimal amounts per item
  const decRes = ctx.resources.filter((r) => r.decOnly);
  if (level >= 2 && sense === "max" && decRes.length && Math.random() < 0.4) parts[parts.length - 1] = genDecimal(n, { ...base, res: pick(decRes), ops: ["≤"] });
  // a comparison (always when there is one resource, so there are at least two constraints)
  if (nRes === 1 || Math.random() < (level >= 2 ? 0.7 : 0.5)) {
    const fx: Fix = { ...base, ops: ["≤", "≥"] as Op[] };
    if (level >= 2) {
      const kind = weighted<"percent" | "ratio" | "total" | "multiple">([["percent", 4], ["ratio", 4], ["total", 1], ["multiple", 1]]);
      if (kind === "percent") parts.push(genPercent(n, ["one", "combined", "total", "morless"], fx));
      else if (kind === "ratio") parts.push(genRatio(n, fx));
      else if (kind === "total") parts.push(genTotal(n, { ...base, ops: ["="] as Op[] }));
      else parts.push(genMultiple(n, fx));
    } else {
      const kind = weighted<"multiple" | "difference" | "bound" | "total">([["multiple", 6], ["difference", 2], ["bound", 1.5], ["total", 1.5]]);
      parts.push(kind === "multiple" ? genMultiple(n, fx) : kind === "difference" ? genDifference(n, fx) : kind === "bound" ? genBound(n, fx) : genTotal(n, fx));
    }
  }
  const cons: Constraint[] = parts.map((q) => constraintOf(q.data.spec));

  // the objective: a profit (or cost) per item, or at Level 2 a profit that is price minus cost
  let obj: number[], price: number[] | undefined, cost: number[] | undefined;
  if (sense === "max" && level >= 2 && Math.random() < 0.6) {
    cost = Array.from({ length: n }, () => ri(1, 12));
    price = cost.map((c) => c + ri(1, 12));
    obj = price.map((p, i) => p - cost![i]);
  } else obj = Array.from({ length: n }, () => (sense === "max" ? ri(2, 20) : ri(1, 9)));
  if (new Set(obj).size < 2) return null;
  const vs = vertices(cons, n);
  const best = bestVertices(vs, obj.map((k) => fr(k)), sense);
  if (!best || best.at.length !== 1) return null; // empty region, or no single best corner
  if (best.at[0].every((f: Fr) => f[0] === 0)) return null; // the best plan is to do nothing

  const each = sing.map((s, i) => (price && cost
    ? (i === 0 ? `each ${s} sells for £${price[i]} and costs £${cost[i]} to make` : `each ${s} sells for £${price[i]} and costs £${cost[i]}`)
    : `each ${s} ${i === 0 ? `${sense === "max" ? "makes a profit of" : "costs"} £${obj[i]}` : `£${obj[i]}`}`));
  // a part's sentence: what it says after the introduction and the variables (which a problem does not name)
  const prefix = `${ctx.intro(vars.map((v) => v.noun))} ${letDef(vars, ctx.did)} `;
  const sentences = parts.map((q) => q.sentence ?? q.prompt.slice(prefix.length).replace(/\s*Write down (a|the) constraint[^.]*\.$/, ""));
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${cap(list(each))}. ${sentences.join(" ")}${integers ? " Only whole numbers of items can be made." : ""} Formulate this as a linear programming problem, to ${sense === "max" ? "maximise the profit" : "minimise the cost"}.`;
  const name = sense === "max" ? "P" : "C";
  const syms = vars.map((v) => v.sym);
  const partData: LpProblemData[] = parts.map((q) => ({ ...q.data, level }));
  const answerText = `${sense === "max" ? "Maximise" : "Minimise"} ${name} = ${objText(obj, syms)} subject to ${cons.map((c) => constraintText(c, vars)).join(", ")}, ${syms.join(", ")} ≥ 0${integers ? ", all integers" : ""}`;
  const first = parts[0].data;
  return { prompt, answerText, data: { kind: "problem", level, vars, op: first.op, spec: first.spec, info: { kind: "problem", sense, name, obj, parts: partData, sing, integers, price, cost } } };
}

/** The "Formulate a problem" question at Levels 1 and 2 (Level 3 is a later chunk). */
export function generateProblem(level: number, o: LpProblemOptions): LpQuestion {
  const counts = o.vars.length ? o.vars : [2];
  const senses = o.objective.length ? o.objective : ["max"];
  const integers = level >= 2 && o.integers !== false;
  for (let tries = 0; tries < 300; tries++) {
    const q = attempt(pick(counts), pick(senses) as "max" | "min", level, integers);
    if (q) return q;
  }
  throw new Error("lpProblem: no good model was found in 300 tries");
}
