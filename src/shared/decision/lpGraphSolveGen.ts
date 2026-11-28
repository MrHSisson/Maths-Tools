// Graphical LP (DD2), the generator of the Solve sub-tool: optimise a two-variable objective over a designed region. See specs/linear-programming-graphical.md (sections 3 and 6).
// The region comes from lpGraphGen.ts; the objective is chosen to fit it: whole coefficients, a single best corner (never a tie along an edge), no best corner on a strict
// line, not the origin, and two whole-number objective lines that cut the region for the sliding-line working. Level 1 maximises with positive coefficients, Level 2 maximises
// with one negative coefficient (the best corner is not top right), Level 3 minimises a cost. Every draw goes through Math.random; the shading is drawn last (R45).
import { fr, type Fr } from "./dim";
import { type Objective, type Pt, bestAmongSurrounding, bestCorners, bestWhole, isEnclosed, latticePoints, nearestWhole, notParallelToAnEdge, objValue, ptEq, regionVertices, toNum } from "./lpGraph";
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
function pickObjective(level: number, lines: readonly GLine[], vs: readonly Pt[], allowAxis: boolean, extra?: (o: Objective, best: Pt) => boolean): Chosen | null {
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
    if (extra && !extra(o, best)) continue;
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
/** Integer solutions: is this optimum one whose best whole point is a single one among the four around it, and is the nearest whole point the best (Level 1) or not (the trap, Level 2)? */
function intOk(ls: readonly GLine[], pts: readonly Pt[], o: Objective, best: Pt, trap: boolean): boolean {
  if (best[0][1] === 1 || best[1][1] === 1) return false; // both coordinates are fractions, so there are four whole points around it
  // the best whole point by a plain pass over the region's whole points (found once for the region), and it must be single
  let top = -Infinity, at: Pt | undefined, ties = 0;
  for (const p of pts) {
    const v = o.p * p[0][0] + o.q * p[1][0];
    if (v > top) { top = v; at = p; ties = 1; } else if (v === top) ties++;
  }
  if (!at || ties !== 1) return false;
  const around = bestAmongSurrounding(ls, best, o);
  if (!around || around.at.length !== 1 || !ptEq(around.at[0], at)) return false;
  const near = nearestWhole(ls, best);
  const nearIsBest = near.feasible && ptEq(near.at, at);
  return trap ? !nearIsBest : nearIsBest;
}
const FERRY: GLine[] = [{ a: 5, b: 6, op: "≤", c: 50 }, { a: 2, b: 4, op: "≤", c: 25 }];

/** `integer`: the Integer solutions sub-tool (the items are whole), with the methods it shows */
export function generateSolve(level: number, o: GxSolveOptions, integer?: { imethods: string[] }): GxQuestion {
  const whole = !!integer;
  // Integer solutions: Level 1 is a maximise whose nearest whole point is the best; Level 2 is the trap, on a region that may have bounds
  const regionLevel = whole ? (level === 2 ? pick([1, 2]) : 1) : level;
  const objLevel = whole ? 1 : level;
  const startPick = pick(o.start.length ? o.start : ["bare"]);
  // a negative coefficient has no profit or cost wording, so Level 2 is never a situation
  const wantSituation = startPick === "story" && (whole || level !== 2);
  let lines = FALLBACK[level] ?? FALLBACK[1];
  let ctx: Context | undefined;
  let chosen: Chosen | null = null;
  // decided once for the question, so a region whose best corner is usually on an axis does not make axis optima the usual draw
  const allowAxis = !whole && Math.random() < 0.125;
  // Integer solutions asks for more at once (fractional corner, a single best whole point, the trap or not), so it is given more draws
  for (let t = 0; t < (whole ? 2500 : 400) && !chosen; t++) {
    const ls = draw(regionLevel);
    if (!usable(ls, regionLevel)) continue;
    // Integer solutions: the region's whole points are found once, and a region with too many (or too few) to show is passed over
    const pts = whole ? latticePoints(ls) : [];
    if (whole && (pts.length > 150 || pts.length < 6)) continue;
    const found = pickObjective(objLevel, ls, regionVertices(ls), allowAxis, whole ? (ob, best) => intOk(ls, pts, ob, best, level === 2) : undefined);
    if (!found) continue;
    // a situation needs a context with a resource for every sloped line: choose from those, so a good region is never thrown away for its context
    const nSloped = ls.filter((l) => styleOf(l) === "slope" || styleOf(l) === "supply").length;
    const pool = wantSituation ? CONTEXTS.filter((cx) => usesResources(cx, nSloped)) : CONTEXTS;
    if (!pool.length) continue;
    const c = pick(pool);
    lines = ls; ctx = c; chosen = found;
  }
  if (!chosen && whole) {
    lines = FERRY;
    const of: Objective = { p: 3, q: 5, sense: "max" };
    const b = bestCorners(regionVertices(lines), of)!;
    chosen = { o: of, best: b.at[0], value: b.value, ks: [fr(15), fr(30)] };
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
  const wholeBest = whole ? bestWhole(lines, obj)! : undefined;
  const wholeNear = whole ? nearestWhole(lines, chosen.best) : undefined;
  const subject = [...lines.map((l) => `$${texLine(l)}$`), "$x \\ge 0$", "$y \\ge 0$"];
  const start: GxStart = startPick === "diagram" ? "diagram" : situation ? "situation" : "inequalities";
  let prompt: string;
  if (start === "situation" && ctx && nouns && sentences) {
    const vars: Var[] = [{ sym: "x", noun: nouns[0].plural, integer: true }, { sym: "y", noun: nouns[1].plural, integer: true }];
    prompt = `${ctx.intro([nouns[0].plural, nouns[1].plural])} ${letDef(vars, ctx.did)} ${sentences.join(" ")} ${objSentence}${whole ? ` Only whole numbers of ${nouns[0].plural} and ${nouns[1].plural} can be ${ctx.did}.` : ""} Write down the objective and the constraints, draw the feasible region and find the ${whole ? "greatest" : quantity} value of $${letter}$ and where it occurs.`;
  } else if (start === "diagram") {
    prompt = `${maxim ? "Maximise" : "Minimise"} $${objTex(obj)}$ over the feasible region ${enclosed ? "$R$ " : ""}shown${whole ? ", where $x$ and $y$ are integers" : ""}. Find the coordinates of the optimal point and the ${whole ? "greatest" : quantity} value of $${letter}$.`;
  } else {
    prompt = `${maxim ? "Maximise" : "Minimise"} $${objTex(obj)}$ subject to ${subject.slice(0, -1).join(", ")} and ${subject[subject.length - 1]}.${whole ? " $x$ and $y$ are integers." : ""} Draw the feasible region and find the ${whole ? "greatest" : quantity} value of $${letter}$ and the point where it occurs.`;
  }
  // drawn last, so a display-only change of Shading replays the same question
  const shading = pick(o.shading.length ? o.shading : ["out"]) === "in" ? "in" : "out";
  const methods = (o.methods.length ? o.methods : ["line"]).filter((m): m is "line" | "table" => m === "line" || m === "table");
  const data: GxData = {
    kind: whole ? "integer" : "solve", level, lines, styles: lines.map(styleOf), start, shading, nouns, sentences, vertices, enclosed, win: graphWindow(lines, vertices),
    obj, objSentence, best: chosen.best, value: chosen.value, ks: chosen.ks, methods,
    ...(wholeBest && wholeNear && integer ? {
      integer: { best: wholeBest.at[0], value: wholeBest.value, trap: !(wholeNear.feasible && ptEq(wholeNear.at, wholeBest.at[0])) },
      imethods: (integer.imethods.length ? integer.imethods : ["grid"]).filter((m): m is "grid" | "table" => m === "grid" || m === "table"),
    } : {}),
  };
  if (wholeBest) return { prompt, answerText: `Greatest ${letter} = ${plainFr(wholeBest.value)} at ${plainPt(wholeBest.at[0])} (the optimum ${plainFr(chosen.value)} at ${plainPt(chosen.best)} is not whole)`, data };
  return { prompt, answerText: `${quantity.charAt(0).toUpperCase()}${quantity.slice(1)} ${letter} = ${plainFr(chosen.value)} at ${plainPt(chosen.best)}`, data };
}
