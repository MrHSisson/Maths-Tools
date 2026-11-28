// Graphical LP (DD2), the generator of the Solve sub-tool: optimise a two-variable objective over a designed region. See specs/linear-programming-graphical.md (sections 3 and 6).
// The region comes from lpGraphGen.ts; the objective is chosen to fit it: whole coefficients, a single best corner (never a tie along an edge), no best corner on a strict
// line, not the origin, and two whole-number objective lines that cut the region for the sliding-line working. Level 1 maximises with positive coefficients, Level 2 maximises
// with one negative coefficient (the best corner is not top right), Level 3 minimises a cost. Every draw goes through Math.random; the shading is drawn last (R45).
import { fr, type Fr } from "./dim";
import { type Objective, type Pt, bestCorners, isEnclosed, notParallelToAnEdge, objValue, regionVertices, toNum } from "./lpGraph";
import { graphWindow } from "./lpGraphView";
import { CONTEXTS, type Context, letDef, pick, ri, shuffled } from "./lpGen";
import type { Var } from "./lp";
import { FALLBACK, type GxData, type GxOptions, type GxQuestion, type GxStart, draw, plainPt, styleOf, term, texLine, usable, usesResources, words } from "./lpGraphGen";
import type { GLine } from "./lpGraph";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
/** the objective as TeX: P=3x+5y, or C=… when it is a cost to minimise */
/** the left side of the objective: 3x+5y */
export const objLhs = (o: Objective): string => `${term(o.p, "x", true)}${term(o.q, "y", o.p === 0)}`;
export const objTex = (o: Objective): string => `${o.sense === "max" ? "P" : "C"}=${objLhs(o)}`;
const plainFr = (f: Fr): string => (f[1] === 1 ? String(f[0]) : String(+(f[0] / f[1]).toFixed(4)));

interface Chosen { o: Objective; best: Pt; value: Fr; ks: [Fr, Fr] }
function pickObjective(level: number, lines: readonly GLine[], vs: readonly Pt[], allowAxis: boolean): Chosen | null {
  for (let t = 0; t < 40; t++) {
    const p = ri(1, 8), q = ri(1, 8);
    // Level 2: the negative coefficient goes on a variable that has a lower bound (x ≥ 2, say), so the best corner sits on that bound and not, as a rule, on an axis
    const lowX = lines.some((l) => l.b === 0 && l.op === "≥"), lowY = lines.some((l) => l.a === 0 && l.op === "≥");
    const negs: Objective[] = [...(lowX || allowAxis ? [{ p: -p, q, sense: "max" } as Objective] : []), ...(lowY || allowAxis ? [{ p, q: -q, sense: "max" } as Objective] : [])];
    if (level === 2 && !negs.length) return null;
    const o: Objective = level === 1 ? { p, q, sense: "max" } : level === 2 ? pick(negs) : { p, q, sense: "min" };
    const b = bestCorners(vs, o);
    if (!b || b.at.length !== 1 || !notParallelToAnEdge(lines, o)) continue;
    const best = b.at[0];
    if (b.value[0] === 0) continue; // the origin, or a value of 0
    if (lines.some((l) => (l.op === "<" || l.op === ">") && l.a * toNum(best[0]) + l.b * toNum(best[1]) === l.c)) continue; // a strict boundary is never reached
    // a single-variable optimum (a corner on an axis) is the occasional question, not the usual one
    const onAxis = best[0][0] === 0 || best[1][0] === 0;
    if (onAxis && !allowAxis) continue;
    const vals = vs.map((v) => toNum(objValue(o, v)));
    const lo = Math.min(...vals), hi = Math.max(...vals), L = lcm(Math.abs(o.p), Math.abs(o.q)), mid = (lo + hi) / 2;
    const cands: number[] = [];
    for (let m = Math.ceil(lo / L); m * L <= hi; m++) if (m * L > lo && m * L < hi) cands.push(m * L);
    if (!cands.length) continue;
    const k1 = cands.reduce((a, c) => (Math.abs(c - mid) < Math.abs(a - mid) ? c : a));
    return { o, best, value: b.value, ks: [fr(k1), fr(k1 + L)] };
  }
  return null;
}

interface GxSolveOptions extends GxOptions { methods: string[] }
export function generateSolve(level: number, o: GxSolveOptions): GxQuestion {
  const startPick = pick(o.start.length ? o.start : ["bare"]);
  // a negative coefficient has no profit or cost wording, so Level 2 is never a situation
  const wantSituation = startPick === "story" && level !== 2;
  let lines = FALLBACK[level] ?? FALLBACK[1];
  let ctx: Context | undefined;
  let chosen: Chosen | null = null;
  // decided once for the question, so a region whose best corner is usually on an axis does not make axis optima the usual draw
  const allowAxis = Math.random() < 0.125;
  for (let t = 0; t < 400 && !chosen; t++) {
    const ls = draw(level);
    if (!usable(ls, level)) continue;
    const found = pickObjective(level, ls, regionVertices(ls), allowAxis);
    if (!found) continue;
    const c = pick(CONTEXTS);
    if (wantSituation && !usesResources(c, ls.filter((l) => styleOf(l) === "slope" || styleOf(l) === "supply").length)) continue;
    lines = ls; ctx = c; chosen = found;
  }
  if (!chosen) {
    const vsF = regionVertices(lines);
    const of: Objective = level === 3 ? { p: 3, q: 2, sense: "min" } : level === 2 ? { p: 3, q: -1, sense: "max" } : { p: 3, q: 5, sense: "max" };
    const b = bestCorners(vsF, of)!;
    chosen = { o: of, best: b.at[0], value: b.value, ks: [fr(15), fr(30)] };
  }
  if (wantSituation && !ctx) ctx = CONTEXTS.find((c) => usesResources(c, 3)) ?? CONTEXTS[0];
  const vertices = regionVertices(lines);
  const enclosed = isEnclosed(lines);
  const obj = chosen.o;
  const situation = wantSituation && ctx;
  const items = ctx ? shuffled(ctx.items).slice(0, 2) : [];
  const nouns = situation ? ([items[0], items[1]] as GxData["nouns"]) : undefined;
  const sentences = situation && nouns && ctx ? words(lines, ctx, nouns) : undefined;
  const maxim = obj.sense === "max";
  const quantity = maxim ? "maximum" : "minimum";
  const letter = maxim ? "P" : "C";
  const objSentence = situation && nouns
    ? maxim
      ? `Each ${nouns[0].singular} makes a profit of £${obj.p} and each ${nouns[1].singular} a profit of £${obj.q}. The aim is to maximise the profit, $P$.`
      : `Each ${nouns[0].singular} costs £${obj.p} and each ${nouns[1].singular} costs £${obj.q}. The aim is to minimise the total cost, $C$.`
    : undefined;
  const subject = [...lines.map((l) => `$${texLine(l)}$`), "$x \\ge 0$", "$y \\ge 0$"];
  const start: GxStart = startPick === "diagram" ? "diagram" : situation ? "situation" : "inequalities";
  let prompt: string;
  if (start === "situation" && ctx && nouns && sentences) {
    const vars: Var[] = [{ sym: "x", noun: nouns[0].plural, integer: true }, { sym: "y", noun: nouns[1].plural, integer: true }];
    prompt = `${ctx.intro([nouns[0].plural, nouns[1].plural])} ${letDef(vars, ctx.did)} ${sentences.join(" ")} ${objSentence} Write down the objective and the constraints, draw the feasible region and find the ${quantity} value of $${letter}$ and where it occurs.`;
  } else if (start === "diagram") {
    prompt = `${maxim ? "Maximise" : "Minimise"} $${objTex(obj)}$ over the feasible region ${enclosed ? "$R$ " : ""}shown. Find the coordinates of the optimal point and the ${quantity} value of $${letter}$.`;
  } else {
    prompt = `${maxim ? "Maximise" : "Minimise"} $${objTex(obj)}$ subject to ${subject.slice(0, -1).join(", ")} and ${subject[subject.length - 1]}. Draw the feasible region and find the ${quantity} value of $${letter}$ and the point where it occurs.`;
  }
  // drawn last, so a display-only change of Shading replays the same question
  const shading = pick(o.shading.length ? o.shading : ["out"]) === "in" ? "in" : "out";
  const methods = (o.methods.length ? o.methods : ["line"]).filter((m): m is "line" | "table" => m === "line" || m === "table");
  const data: GxData = {
    kind: "solve", level, lines, styles: lines.map(styleOf), start, shading, nouns, sentences, vertices, enclosed, win: graphWindow(lines, vertices),
    obj, objSentence, best: chosen.best, value: chosen.value, ks: chosen.ks, methods,
  };
  return { prompt, answerText: `${quantity.charAt(0).toUpperCase()}${quantity.slice(1)} ${letter} = ${plainFr(chosen.value)} at ${plainPt(chosen.best)}`, data };
}
