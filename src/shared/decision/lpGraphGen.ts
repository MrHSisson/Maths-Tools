// Graphical linear programming (DD2), the generator of the Draw-the-region sub-tool. See specs/linear-programming-graphical.md (sections 1 to 3 and 6).
// The region is DESIGNED, not solved afterwards: sloped lines are built from whole-number axis crossings (so each can be plotted from two whole points), bounds and
// relation lines are added by the level, and a draw is kept only if every line is active (it makes an edge), every corner is a small rational point, the
// region is large enough to draw, and it has the feature of its level and none of a higher one. Every draw is made through Math.random and nothing is remembered between
// calls (R45); the shading is drawn last, so switching it replays the very same question.
import { type GLine, type Objective, type Pt, countsOk, hasInterior, isEnclosed, ptKey, regionVertices, toNum } from "./lpGraph";
import { type GWin, graphWindow } from "./lpGraphView";
import { CONTEXTS, type Context, letDef, pick, ri, shuffled, unitOf } from "./lpGen";
import type { Var } from "./lp";
import type { Fr } from "./dim";

export type GxStart = "situation" | "inequalities" | "diagram";
/** what kind of line each constraint is, for the working */
type GxStyle = "slope" | "supply" | "vbound" | "hbound" | "relation";
export interface GxData {
  kind: "region" | "solve" | "integer";
  level: number;
  lines: GLine[];
  styles: GxStyle[];
  start: GxStart;
  shading: "out" | "in";
  /** the situation (A Situation): the two kinds of item, and one sentence per line in the same order as `lines` */
  nouns?: [{ plural: string; singular: string }, { plural: string; singular: string }];
  sentences?: string[];
  /** the corner points, in order round the region (exact) */
  vertices: Pt[];
  enclosed: boolean;
  win: GWin;
  /** Solve: the objective, the sentence that gives it in a situation, the best corner and its value, the two objective lines drawn first, and which methods are shown */
  obj?: Objective;
  objSentence?: string;
  best?: Pt;
  value?: Fr;
  ks?: [Fr, Fr];
  methods?: Array<"line" | "table">;
  /** Integer solutions: the best whole-number point and its value, whether the nearest whole point to the optimum is NOT the best (the trap), and which methods are shown */
  integer?: { best: Pt; value: Fr; trap: boolean };
  imethods?: Array<"grid" | "table">;
  /** Working Shown: every step, the corners and the answer, or the answer only (display only: the question is the same) */
  show?: "full" | "vertices" | "answer";
}
export interface GxQuestion { prompt: string; answerText: string; data: GxData }

// ── the pieces ───────────────────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** px + qy ≤ c from whole axis crossings ix and iy: both crossings are whole and the coefficients are small */
function sloped(op: "≤" | "≥", lo: number, hi: number): GLine {
  const ix = ri(lo, hi), iy = ri(lo, hi);
  const g = gcd(ix, iy);
  return { a: iy / g, b: ix / g, op, c: (ix * iy) / g };
}
/** a bound that cuts the region the lines so far make (a bound that touches nothing is rejected anyway, so this keeps draws useful): a lower bound near the axis, an upper bound partway across */
const bound = (axis: "x" | "y", op: "≤" | "≥", so: readonly GLine[] = []): GLine => {
  const vs = so.length ? regionVertices(so) : [];
  const reach = vs.length >= 3 ? Math.max(...vs.map((v) => toNum(v[axis === "x" ? 0 : 1]))) : 10;
  const v = op === "≥" ? ri(1, Math.max(1, Math.min(3, Math.floor(reach / 3)))) : ri(Math.max(2, Math.ceil(reach / 2)), Math.max(2, Math.ceil(reach) - 1));
  return axis === "x" ? { a: 1, b: 0, op, c: v } : { a: 0, b: 1, op, c: v };
};
/** a line through the origin: x ≥ m·y, x ≤ m·y, y ≥ m·x or y ≤ m·x */
function relation(): GLine {
  const m = pick([2, 3]);
  const op = pick<"≤" | "≥">(["≤", "≥"]);
  return pick([true, false]) ? { a: 1, b: -m, op, c: 0 } : { a: -m, b: 1, op, c: 0 };
}
export const styleOf = (l: GLine): GxStyle => (l.c === 0 && l.a !== 0 && l.b !== 0 ? "relation" : l.b === 0 ? "vbound" : l.a === 0 ? "hbound" : l.op === "≥" || l.op === ">" ? "supply" : "slope");

const keySet = (ls: readonly GLine[]): string => regionVertices(ls).map(ptKey).sort().join("|");
const area = (vs: readonly Pt[]): number => Math.abs(vs.reduce((s, v, i) => { const w = vs[(i + 1) % vs.length]; return s + toNum(v[0]) * toNum(w[1]) - toNum(w[0]) * toNum(v[1]); }, 0)) / 2;

/** is the draw usable for this level? (the same rules the tests check from outside) */
export function usable(ls: readonly GLine[], level: number): boolean {
  if (!countsOk(ls) || !hasInterior(ls)) return false;
  const vs = regionVertices(ls);
  if (vs.some((v) => v[0][1] > 6 || v[1][1] > 6 || toNum(v[0]) > 16 || toNum(v[1]) > 16)) return false;
  const full = keySet(ls);
  if (ls.some((_, i) => keySet(ls.filter((__, j) => j !== i)) === full)) return false; // every line is active
  const enclosed = isEnclosed(ls);
  if (enclosed && (vs.length < 4 || area(vs) < 8)) return false;
  if (!enclosed && vs.length < 3) return false;
  const st = ls.map(styleOf);
  const hasBound = st.includes("vbound") || st.includes("hbound");
  const hard = st.includes("supply") || st.includes("relation");
  if (level === 1) return !hasBound && !hard && ls.every((l) => l.op === "≤");
  if (level === 2) return hasBound && !hard;
  return hard;
}

export function draw(level: number): GLine[] {
  const nSlope = ri(2, 3);
  const ls: GLine[] = [];
  if (level === 3) {
    const style = pick(["supply", "supply", "relation", "open", "closed", "closed"] as const);
    if (style === "open") { ls.push(sloped("≥", 2, 6), sloped("≥", 2, 6)); if (Math.random() < 0.5) ls.push(bound(pick(["x", "y"]), "≥", ls)); } else if (style === "closed") {
      // two lower limits that meet at a fraction, and an upper limit that closes the region (so there is a finite list of whole points, and a cost to minimise at a fractional corner)
      ls.push(sloped("≥", 2, 6), sloped("≥", 2, 6), sloped("≤", 8, 14));
    } else {
      ls.push(style === "supply" ? sloped("≥", 2, 6) : relation());
      for (let i = 0; i < nSlope - 1; i++) ls.push(sloped("≤", 4, 12));
      if (Math.random() < 0.4) ls.push(bound(pick(["x", "y"]), pick(["≥", "≤"]), ls));
    }
  } else {
    for (let i = 0; i < nSlope; i++) ls.push(sloped("≤", 4, 12));
    if (level === 2) {
      const axes = shuffled(["x", "y"] as const);
      const nb = ri(1, Math.min(2, 5 - nSlope));
      for (let i = 0; i < nb; i++) ls.push(bound(axes[i], pick(["≥", "≤"]), ls));
      // one bound may be strict (a sloped line stays as it is, so every sentence says what its line says)
      const bounds = ls.map((l, i) => (l.a === 0 || l.b === 0 ? i : -1)).filter((i) => i >= 0);
      if (Math.random() < 0.3) { const i = pick(bounds); ls[i] = { ...ls[i], op: ls[i].op === "≤" ? "<" : ">" }; }
    }
  }
  return ls;
}

/** fixed regions, used only if 400 draws all fail (they should not) */
export const FALLBACK: Record<number, GLine[]> = {
  1: [{ a: 2, b: 3, op: "≤", c: 24 }, { a: 4, b: 3, op: "≤", c: 36 }],
  2: [{ a: 2, b: 3, op: "≤", c: 24 }, { a: 1, b: 0, op: "≥", c: 1 }, { a: 0, b: 1, op: "≤", c: 6 }],
  3: [{ a: 1, b: 1, op: "≥", c: 4 }, { a: 2, b: 3, op: "≤", c: 24 }, { a: 3, b: 2, op: "≤", c: 24 }],
};

// ── the situation ────────────────────────────────────────────────────────────
const TIMES = (m: number): string => (m === 2 ? "twice" : `${m} times`);
export function words(ls: readonly GLine[], ctx: Context, n: [{ plural: string; singular: string }, { plural: string; singular: string }]): string[] {
  // the everyday resources first; one that is usually measured in decimals (ink, wax, paint) only when a third line needs it
  const res = [...shuffled(ctx.resources.filter((r) => r.mode === "use" && !r.decOnly)), ...shuffled(ctx.resources.filter((r) => r.mode === "use" && r.decOnly))];
  let k = 0;
  const did = ctx.did;
  return ls.map((l) => {
    const st = styleOf(l);
    if (st === "slope" || st === "supply") {
      const r = res[k++];
      const need = `Each ${n[0].singular} ${r.verb} ${l.a} ${unitOf(l.a, r.unit)} of ${r.of} and each ${n[1].singular} ${r.verb} ${l.b} ${unitOf(l.b, r.unit)}.`;
      return st === "slope" ? `${need} There ${l.c === 1 ? "is" : "are"} ${l.c} ${unitOf(l.c, r.unit)} of ${r.of} available.` : `${need} At least ${l.c} ${unitOf(l.c, r.unit)} of ${r.of} must be used.`;
    }
    if (st === "vbound" || st === "hbound") {
      const it = st === "vbound" ? n[0] : n[1];
      return l.op === "≤" ? `At most ${l.c} ${it.plural} can be ${did}.` : l.op === ">" ? `More than ${l.c} ${it.plural} must be ${did}.` : l.op === "<" ? `Fewer than ${l.c} ${it.plural} can be ${did}.` : `At least ${l.c} ${it.plural} must be ${did}.`;
    }
    // a relation: a·x + b·y (op) 0 with one of a, b equal to 1 and the other −m
    const m = Math.abs(l.a === 1 || l.a === -1 ? l.b : l.a);
    const first = l.a === 1 ? 0 : 1; // the variable with coefficient 1 is the one that is compared with m times the other
    const [big, small] = first === 0 ? [n[0], n[1]] : [n[1], n[0]];
    return `${l.op === "≥" ? "At least" : "At most"} ${TIMES(m)} as many ${big.plural} as ${small.plural} must be ${did}.`;
  });
}
export const usesResources = (ctx: Context, nSlope: number): boolean => ctx.resources.filter((r) => r.mode === "use").length >= nSlope;

// ── text ─────────────────────────────────────────────────────────────────────
export const term = (k: number, v: string, first: boolean): string => {
  if (k === 0) return "";
  const abs = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  return `${k < 0 ? "-" : first ? "" : "+"}${abs}${v}`;
};
const TEXOP: Record<string, string> = { "≤": "\\le", "≥": "\\ge", "<": "<", ">": ">", "=": "=" };
/** a constraint as TeX: 5x+6y \le 50 */
export const texLine = (l: GLine): string => `${term(l.a, "x", true)}${term(l.b, "y", l.a === 0)}${TEXOP[l.op]}${l.c}`;
/** the line itself as TeX: 5x+6y=50 */
export const texEq = (l: GLine): string => `${term(l.a, "x", true)}${term(l.b, "y", l.a === 0)}=${l.c}`;
export const plainPt = (v: Pt): string => `(${v[0][1] === 1 ? v[0][0] : +(v[0][0] / v[0][1]).toFixed(4)}, ${v[1][1] === 1 ? v[1][0] : +(v[1][0] / v[1][1]).toFixed(4)})`;

// ── the question ─────────────────────────────────────────────────────────────
export interface GxOptions { start: string[]; shading: string[]; show?: string }
export const showOf = (v: string | undefined): "full" | "vertices" | "answer" => (v === "vertices" || v === "answer" ? v : "full");
export function generateRegion(level: number, o: GxOptions): GxQuestion {
  let lines = FALLBACK[level] ?? FALLBACK[1];
  const wantSituation = o.start.includes("story") && (!o.start.includes("bare") || Math.random() < 0.5);
  let ctx: Context | undefined;
  for (let t = 0; t < 400; t++) {
    const ls = draw(level);
    if (!usable(ls, level)) continue;
    const c = pick(CONTEXTS);
    if (wantSituation && !usesResources(c, ls.filter((l) => styleOf(l) === "slope" || styleOf(l) === "supply").length)) continue;
    lines = ls; ctx = c;
    break;
  }
  if (wantSituation && !ctx) ctx = CONTEXTS.find((c) => usesResources(c, 3)) ?? CONTEXTS[0];
  const vertices = regionVertices(lines);
  const enclosed = isEnclosed(lines);
  const situation = wantSituation && ctx;
  const items = ctx ? shuffled(ctx.items).slice(0, 2) : [];
  const nouns = situation ? ([items[0], items[1]] as GxData["nouns"]) : undefined;
  const sentences = situation && nouns && ctx ? words(lines, ctx, nouns) : undefined;
  const ending = enclosed ? "Draw the feasible region and label it $R$." : "Draw the feasible region.";
  let prompt: string;
  if (situation && ctx && nouns && sentences) {
    const vars: Var[] = [{ sym: "x", noun: nouns[0].plural, integer: true }, { sym: "y", noun: nouns[1].plural, integer: true }];
    prompt = `${ctx.intro([nouns[0].plural, nouns[1].plural])} ${letDef(vars, ctx.did)} ${sentences.join(" ")} Write down the constraints. ${ending}`;
  } else {
    const all = [...lines.map((l) => `$${texLine(l)}$`), "$x \\ge 0$", "$y \\ge 0$"];
    prompt = `Draw the feasible region for ${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}.${enclosed ? " Label the region $R$." : ""}`;
  }
  // drawn last, so a display-only change of Shading replays the same question
  const shading = pick(o.shading.length ? o.shading : ["out"]) === "in" ? "in" : "out";
  const data: GxData = {
    kind: "region", level, lines, styles: lines.map(styleOf), start: situation ? "situation" : "inequalities", shading, nouns, sentences,
    vertices, enclosed, win: graphWindow(lines, vertices), show: showOf(o.show),
  };
  return { prompt, answerText: `${enclosed ? "Region R" : "An open region"} with vertices ${vertices.map(plainPt).join(", ")}`, data };
}
