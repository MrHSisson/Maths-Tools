// Formulating Linear Programmes, "Formulate a problem": the whole model, with no React. See specs/linear-programming-formulate.md section 5.
// The question does NOT name the variables: the student assigns them. Nothing here is new maths, only assembly: the constraints are the "Write a constraint" rules
// (lpGen.ts) on one set of variables, with an objective from a profit (or a cost) per item. Each model is checked with lp.ts: the region is not empty and the
// objective has a single optimal corner point, so the model can be reused by the graphical tool later. Level 1 so far.
import { fr, type Fr } from "./dim";
import { type Op, bestVertices, vertices } from "./lp";
import { type Constraint } from "./lp";
import { type LpProblemData, type LpQuestion, type Fix, CONTEXTS, constraintOf, constraintText, genBound, genDifference, genMultiple, genResource, genTotal, cap, list, pick, pickVars, ri, shuffled, weighted } from "./lpGen";

interface LpProblemOptions {
  /** the numbers of variables that may be used (2 to 4); a question draws one of them */
  vars: number[];
  /** "max" (maximise a profit) or "min" (minimise a cost) */
  objective: string[];
}

/** "5x + 8y" for the answer line */
const objText = (obj: readonly number[], syms: readonly string[]): string => obj.map((k, i) => `${k === 1 ? "" : k}${syms[i]}`).join(" + ");

type Part = { sentence: string; data: Omit<LpProblemData, "level" | "point"> };

/** One attempt at a Level 1 model; null if it is not a good problem (empty region, several best corners, the best corner the origin). */
function attempt(n: number, sense: "max" | "min"): LpQuestion | null {
  const ctx = sense === "max" ? pick(CONTEXTS.filter((c) => c.id !== "diet")) : CONTEXTS.find((c) => c.id === "diet")!;
  const { vars, sing } = pickVars(ctx, n);
  const resources = ctx.resources.filter((r) => !r.decOnly && r.mode === (sense === "max" ? "use" : "supply"));
  const nRes = resources.length >= 2 ? pick([1, 2]) : 1;
  const base = { ctx, vars, sing };
  const parts: Part[] = shuffled(resources).slice(0, nRes).map((res) => genResource(n, { ...base, res, ops: [sense === "max" ? "≤" : "≥"] }));
  // a direct comparison (always when there is one resource, so there are at least two constraints)
  if (nRes === 1 || Math.random() < 0.5) {
    const fx: Fix = { ...base, ops: ["≤", "≥"] as Op[] };
    const kind = weighted<"multiple" | "difference" | "bound" | "total">([["multiple", 6], ["difference", 2], ["bound", 1.5], ["total", 1.5]]);
    parts.push(kind === "multiple" ? genMultiple(n, fx) : kind === "difference" ? genDifference(n, fx) : kind === "bound" ? genBound(n, fx) : genTotal(n, fx));
  }
  const cons: Constraint[] = parts.map((q) => constraintOf(q.data.spec));
  const obj = Array.from({ length: n }, () => (sense === "max" ? ri(2, 20) : ri(1, 9)));
  if (new Set(obj).size < 2) return null;
  const vs = vertices(cons, n);
  const best = bestVertices(vs, obj.map((k) => fr(k)), sense);
  if (!best || best.at.length !== 1) return null; // empty region, or no single best corner
  if (best.at[0].every((f: Fr) => f[0] === 0)) return null; // the best plan is to do nothing
  const word = sense === "max" ? "makes a profit of" : "costs";
  const each = sing.map((s, i) => `each ${s} ${i === 0 ? `${word} £${obj[i]}` : `£${obj[i]}`}`);
  const prompt = `${ctx.intro(vars.map((v) => v.noun))} ${cap(list(each))}. ${parts.map((q) => q.sentence).join(" ")} Formulate this as a linear programming problem, to ${sense === "max" ? "maximise the profit" : "minimise the cost"}.`;
  const name = sense === "max" ? "P" : "C";
  const syms = vars.map((v) => v.sym);
  const partData: LpProblemData[] = parts.map((q) => ({ ...q.data, level: 1 }));
  const answerText = `${sense === "max" ? "Maximise" : "Minimise"} ${name} = ${objText(obj, syms)} subject to ${cons.map((c) => constraintText(c, vars)).join(", ")}, ${syms.join(", ")} ≥ 0`;
  const first = parts[0].data;
  return { prompt, answerText, data: { kind: "problem", level: 1, vars, op: first.op, spec: first.spec, info: { kind: "problem", sense, name, obj, parts: partData, sing } } };
}

/** The "Formulate a problem" question at Level 1 (the other levels are later chunks). */
export function generateProblem(level: number, o: LpProblemOptions): LpQuestion {
  const counts = o.vars.length ? o.vars : [2];
  const senses = o.objective.length ? o.objective : ["max"];
  for (let tries = 0; tries < 200; tries++) {
    const q = attempt(pick(counts), pick(senses) as "max" | "min");
    if (q) return { ...q, data: { ...q.data, level } };
  }
  throw new Error("lpProblem: no good model was found in 200 tries");
}
