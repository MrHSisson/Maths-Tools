// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — the maths, the layout and the generator. Activity ON NODE (no dummy activities): each activity is a box
// holding  earliest start | duration | latest finish,  arrows run from an activity to each activity that directly follows it, and a Start
// and an End box close the network. Total float only. Spec: specs/critical-path.md.
//
//   cpaTimes       — the forward and backward pass (the algorithm the working follows)
//   referenceCpa   — an INDEPENDENT answer by listing every path Start → End (the CI check; shares no code with cpaTimes)
//   layoutCpa      — boxes in columns by longest chain, rows ordered to cut crossings, arrows that skip a column routed round the boxes
//   generateCpa    — a precedence table that always gives a clean, unambiguous network
// ═══════════════════════════════════════════════════════════════════════════

import { randInt } from "../helpers";
import { shuffle } from "../math";

export const START = "Start";
export const END = "End";

export interface CpaActivity {
  id: string;
  duration: number;
  /** the activities that must be finished immediately before this one (immediate predecessors only, never a redundant one) */
  preds: string[];
  /** reserved for the resource histogram (later); unused for now */
  workers?: number;
}

export interface CpaTimes {
  es: Record<string, number>; // earliest start
  ef: Record<string, number>; // earliest finish
  ls: Record<string, number>; // latest start
  lf: Record<string, number>; // latest finish
  float: Record<string, number>; // total float = lf − es − duration
  projectTime: number;
}

// ── The graph with Start and End added ───────────────────────────────────────

/** Every activity plus Start (before the ones with nothing before them) and End (after the ones nothing follows), in an order where
 *  each activity comes after all its predecessors (by depth, then letter). */
export function fullGraph(acts: CpaActivity[]): CpaActivity[] {
  const hasSucc = new Set(acts.flatMap((a) => a.preds));
  const withStart = acts.map((a) => (a.preds.length === 0 ? { ...a, preds: [START] } : a));
  const sinks = acts.filter((a) => !hasSucc.has(a.id)).map((a) => a.id);
  const all = [{ id: START, duration: 0, preds: [] as string[] }, ...withStart, { id: END, duration: 0, preds: sinks }];
  const depth = depthOf(all);
  return [...all].sort((a, b) => depth[a.id] - depth[b.id] || (a.id === END ? 1 : b.id === END ? -1 : 0) || a.id.localeCompare(b.id));
}

/** Longest chain (in activities) from Start to each activity: Start 0, the first activities 1, … */
export function depthOf(all: CpaActivity[]): Record<string, number> {
  const byId = new Map(all.map((a) => [a.id, a]));
  const memo: Record<string, number> = {};
  const go = (id: string): number => {
    if (memo[id] !== undefined) return memo[id];
    const a = byId.get(id)!;
    return (memo[id] = a.preds.length === 0 ? 0 : 1 + Math.max(...a.preds.map(go)));
  };
  all.forEach((a) => go(a.id));
  return memo;
}

export const successorsOf = (all: CpaActivity[]): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  all.forEach((a) => (out[a.id] = []));
  all.forEach((a) => a.preds.forEach((p) => out[p].push(a.id)));
  return out;
};

/** The arrows of the full network, "P→Q", in a stable order. */
export const cpaEdges = (all: CpaActivity[]): { id: string; from: string; to: string }[] =>
  all.flatMap((a) => a.preds.map((p) => ({ id: `${p}→${a.id}`, from: p, to: a.id })));

// ── The forward and backward pass ────────────────────────────────────────────

export function cpaTimes(acts: CpaActivity[]): CpaTimes {
  const all = fullGraph(acts);
  const succ = successorsOf(all);
  const dur = Object.fromEntries(all.map((a) => [a.id, a.duration]));
  const es: Record<string, number> = {}, ef: Record<string, number> = {}, ls: Record<string, number> = {}, lf: Record<string, number> = {}, float: Record<string, number> = {};
  for (const a of all) {
    es[a.id] = a.preds.length ? Math.max(...a.preds.map((p) => ef[p])) : 0;
    ef[a.id] = es[a.id] + dur[a.id];
  }
  const projectTime = ef[END];
  for (const a of [...all].reverse()) {
    lf[a.id] = succ[a.id].length ? Math.min(...succ[a.id].map((s) => ls[s])) : projectTime;
    ls[a.id] = lf[a.id] - dur[a.id];
    float[a.id] = lf[a.id] - es[a.id] - dur[a.id];
  }
  return { es, ef, ls, lf, float, projectTime };
}

/** The activities with no float, in order (Start and End excluded). */
export const criticalActivities = (acts: CpaActivity[]): string[] => {
  const t = cpaTimes(acts);
  return fullGraph(acts).map((a) => a.id).filter((id) => id !== START && id !== END && t.float[id] === 0);
};

/** Every path Start → End as a list of ids (Start and End included). */
export function allPaths(acts: CpaActivity[]): string[][] {
  const all = fullGraph(acts);
  const succ = successorsOf(all);
  const out: string[][] = [];
  const go = (id: string, trail: string[]) => {
    const t = [...trail, id];
    if (id === END) { out.push(t); return; }
    succ[id].forEach((s) => go(s, t));
  };
  go(START, []);
  return out;
}

/** INDEPENDENT reference: every path from Start to End, its length, and what that says about each activity. Shares no code with cpaTimes. */
export function referenceCpa(acts: CpaActivity[]) {
  const dur: Record<string, number> = { [START]: 0, [END]: 0 };
  acts.forEach((a) => (dur[a.id] = a.duration));
  const paths = allPaths(acts);
  const len = (p: string[]) => p.reduce((s, id) => s + dur[id], 0);
  const projectTime = Math.max(...paths.map(len));
  const es: Record<string, number> = {}, lf: Record<string, number> = {};
  const onCritical = new Set<string>();
  for (const p of paths) {
    const critical = len(p) === projectTime;
    let before = 0;
    p.forEach((id, i) => {
      const after = p.slice(i + 1).reduce((s, x) => s + dur[x], 0);
      es[id] = Math.max(es[id] ?? 0, before);
      lf[id] = Math.min(lf[id] ?? Infinity, projectTime - after);
      if (critical) onCritical.add(id);
      before += dur[id];
    });
  }
  const criticalPaths = paths.filter((p) => len(p) === projectTime);
  return { projectTime, es, lf, criticalSet: onCritical, criticalPaths };
}

// ── Layout ───────────────────────────────────────────────────────────────────

export const BOX_W = 104;
export const BOX_H = 62;
const GAP_X = 60;
const GAP_Y = 44;
const PAD = 26;

export interface CpaBox { id: string; x: number; y: number; w: number; h: number; col: number }
export interface CpaEdgeGeo { id: string; from: string; to: string; pts: [number, number][]; routed: boolean }
export interface CpaLayout { boxes: Record<string, CpaBox>; edges: CpaEdgeGeo[]; width: number; height: number; crossings: number; columns: string[][] }

type Pt = [number, number];

// does the segment a→b cross the rectangle (grown by `m`)?
function segHitsRect(a: Pt, b: Pt, r: { x: number; y: number; w: number; h: number }, m = 4): boolean {
  const x0 = r.x - m, y0 = r.y - m, x1 = r.x + r.w + m, y1 = r.y + r.h + m;
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]] as [number, number][]) {
    if (p === 0) { if (q < 0) return false; } else {
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

// do two segments cross properly (not just touch at an end)?
function segsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 * o2 < -1e-9 && o3 * o4 < -1e-9;
}

function geometry(all: CpaActivity[], cols: string[][]): CpaLayout {
  const colOf: Record<string, number> = {};
  cols.forEach((c, i) => c.forEach((id) => (colOf[id] = i)));
  const boxes: Record<string, CpaBox> = {};
  cols.forEach((c, ci) => {
    c.forEach((id, r) => {
      boxes[id] = { id, x: PAD + ci * (BOX_W + GAP_X), y: (r - (c.length - 1) / 2) * (BOX_H + GAP_Y), w: BOX_W, h: BOX_H, col: ci };
    });
  });
  const minY = Math.min(...Object.values(boxes).map((b) => b.y));
  const maxY = Math.max(...Object.values(boxes).map((b) => b.y + b.h));
  Object.values(boxes).forEach((b) => (b.y -= minY));
  const bodyTop = 0, bodyBottom = maxY - minY;
  const lane = { above: 0, below: 0 };
  const edges: CpaEdgeGeo[] = [];
  for (const e of cpaEdges(all)) {
    const u = boxes[e.from], v = boxes[e.to];
    const a: Pt = [u.x + u.w, u.y + u.h / 2], b: Pt = [v.x, v.y + v.h / 2];
    const between = Object.values(boxes).filter((x) => x.col > u.col && x.col < v.col);
    if (!between.some((x) => segHitsRect(a, b, x))) { edges.push({ ...e, pts: [a, b], routed: false }); continue; }
    // goes round: out of the box, along a channel above or below every box, then in
    const above = (a[1] + b[1]) / 2 < (bodyTop + bodyBottom) / 2;
    const k = above ? lane.above++ : lane.below++;
    const chY = above ? bodyTop - 14 - k * 9 : bodyBottom + 36 + k * 9;
    edges.push({ ...e, pts: [a, [a[0] + GAP_X * 0.42, chY], [b[0] - GAP_X * 0.42, chY], b], routed: true });
  }
  let crossings = 0;
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const p = edges[i], q = edges[j];
    if (p.from === q.from || p.to === q.to || p.from === q.to || p.to === q.from) continue;
    let hit = false;
    for (let s = 0; s + 1 < p.pts.length && !hit; s++) for (let t = 0; t + 1 < q.pts.length && !hit; t++) if (segsCross(p.pts[s], p.pts[s + 1], q.pts[t], q.pts[t + 1])) hit = true;
    if (hit) crossings++;
  }
  // frame everything actually drawn (boxes and the channels the routed arrows run along), with a margin
  const ys = [...Object.values(boxes).flatMap((b) => [b.y, b.y + b.h]), ...edges.flatMap((e) => e.pts.map((p) => p[1]))];
  const shift = PAD - Math.min(...ys);
  Object.values(boxes).forEach((b) => (b.y += shift));
  edges.forEach((e) => e.pts.forEach((p) => (p[1] += shift)));
  const lastCol = cols.length - 1;
  const width = PAD * 2 + lastCol * (BOX_W + GAP_X) + BOX_W;
  const height = Math.max(...ys) - Math.min(...ys) + PAD * 2 + 22; // + room for a float badge under the bottom row
  return { boxes, edges, width, height, crossings, columns: cols };
}

const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));

/** Boxes in columns by longest chain (Start first, End last); rows within a column ordered to cut the arrow crossings. */
export function layoutCpa(acts: CpaActivity[]): CpaLayout {
  const all = fullGraph(acts);
  const depth = depthOf(all);
  const last = Math.max(...Object.values(depth));
  const cols: string[][] = Array.from({ length: last + 1 }, () => []);
  all.forEach((a) => cols[depth[a.id]].push(a.id));
  // start from a barycentre order, then try every order of each column in turn
  const rowOf: Record<string, number> = {};
  cols.forEach((c) => c.forEach((id, r) => (rowOf[id] = r)));
  const byId = new Map(all.map((a) => [a.id, a]));
  for (let ci = 1; ci < cols.length; ci++) {
    cols[ci].sort((x, y) => {
      const bx = byId.get(x)!.preds.reduce((s, p) => s + rowOf[p], 0) / byId.get(x)!.preds.length;
      const by = byId.get(y)!.preds.reduce((s, p) => s + rowOf[p], 0) / byId.get(y)!.preds.length;
      return bx - by || x.localeCompare(y);
    });
    cols[ci].forEach((id, r) => (rowOf[id] = r));
  }
  let best = geometry(all, cols);
  for (let sweep = 0; sweep < 2 && best.crossings > 0; sweep++) {
    for (let ci = 1; ci < cols.length - 1; ci++) {
      if (cols[ci].length < 2) continue;
      for (const order of perms(cols[ci])) {
        const trial = cols.map((c, i) => (i === ci ? order : c));
        const g = geometry(all, trial);
        if (g.crossings < best.crossings) { best = g; cols[ci] = order; }
      }
    }
  }
  return best;
}

/** Layout problems a CI check can assert are zero: boxes overlapping, or an arrow passing through a box that is not one of its ends. */
export function layoutIssues(l: CpaLayout): string[] {
  const out: string[] = [];
  const bs = Object.values(l.boxes);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i], b = bs[j];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.id} and ${b.id} overlap`);
  }
  for (const e of l.edges) for (const b of bs) {
    if (b.id === e.from || b.id === e.to) continue;
    for (let s = 0; s + 1 < e.pts.length; s++) if (segHitsRect(e.pts[s], e.pts[s + 1], b, 0)) { out.push(`arrow ${e.id} passes through ${b.id}`); break; }
  }
  return out;
}

// ── The generated problem ────────────────────────────────────────────────────

export type CpaKind = "cpaNetwork" | "cpaTable" | "cpaForward" | "cpaFull" | "cpaFloat" | "cpaPaths" | "cpaUnknown" | "cpaChange" | "cpaContext" | "cpaCascade" | "cpaHistogram" | "cpaLevel" | "cpaAlloc" | "cpaShorten" | "cpaReason" | "cpaExam";

// ── The cascade (Gantt) chart ────────────────────────────────────────────────
export type CascadeStart = "early" | "late";
/** "sequence": the critical activities end to end on ONE row, the rest one row each; "rows": every activity on its own row */
export type CascadeLayout = "sequence" | "rows";
/** "blocks": full-height blocks, the float a dashed block beside it; "bars": thin bars, the float a dashed line */
export type CascadeStyle = "blocks" | "bars";
export interface CascadeBar { id: string; start: number; end: number; float: number; critical: boolean; row: number }
export interface CascadeData {
  start: CascadeStart; layout: CascadeLayout; style: CascadeStyle;
  /** the chart is given partly drawn (the question asks to complete it): the activities already on it, floats and all */
  given?: string[];
  /** the network is given WITHOUT its times: the forward and backward passes come first, then the chart */
  passes?: boolean;
  bars: CascadeBar[];
  rowLabels: string[]; // the label at the left of each row ("Critical" for the shared critical row)
  T: number;
}
/** What is drawn on one beat of the cascade chart (anything not listed is not yet drawn). */
export interface GanttViewState { bars: string[]; floats: string[]; current?: string }

/** The cascade chart for a network: where every activity sits, from the same times the passes found. */
export function cascadeData(acts: CpaActivity[], t: CpaTimes, start: CascadeStart, layout: CascadeLayout, style: CascadeStyle, firstPath: string[] = [], partial = false): CascadeData {
  const crit = (id: string) => t.float[id] === 0;
  const startOf = (a: CpaActivity) => (start === "early" ? t.es[a.id] : t.lf[a.id] - a.duration);
  // with more than one critical path only the first fits end to end on the shared row; the other critical activities get their own rows
  const onFirst = (id: string) => firstPath.length === 0 || firstPath.includes(id);
  const sharedRow = acts.filter((a) => crit(a.id) && onFirst(a.id));
  const otherCrit = acts.filter((a) => crit(a.id) && !onFirst(a.id));
  const others = acts.filter((a) => !crit(a.id));
  const rowOf: Record<string, number> = {};
  let rowLabels: string[];
  if (layout === "sequence") {
    sharedRow.forEach((a) => (rowOf[a.id] = 0));
    [...otherCrit, ...others].forEach((a, i) => (rowOf[a.id] = i + 1));
    rowLabels = ["Critical", ...[...otherCrit, ...others].map((a) => a.id)];
  } else {
    acts.forEach((a, i) => (rowOf[a.id] = i));
    rowLabels = acts.map((a) => a.id);
  }
  const bars = acts.map((a) => ({ id: a.id, start: startOf(a), end: startOf(a) + a.duration, float: t.float[a.id], critical: crit(a.id), row: rowOf[a.id] }));
  // a partly drawn chart: the critical activities and the first half (by letter) of the others are already on it
  const nonCrit = bars.filter((b) => !b.critical).map((b) => b.id);
  const given = partial ? [...bars.filter((b) => b.critical).map((b) => b.id), ...nonCrit.slice(0, Math.floor(nonCrit.length / 2))] : undefined;
  return { start, layout, style, bars, rowLabels, T: t.projectTime, given };
}

// ── The resource histogram ───────────────────────────────────────────────────
/** One activity as a block: as wide as its duration, as high as the workers it needs, sitting on `y` (0 = the bottom). */
export interface HistBlock { id: string; start: number; end: number; workers: number; y: number; critical: boolean; /** levelling: held up for workers */ moved?: boolean;
  /** a STEPPED block: its bottom edge follows the top of the blocks under it, one value per time unit (start … end − 1); it is `workers` high everywhere. Absent for a plain rectangle sitting on `y`. */
  base?: number[] }
export interface HistogramData {
  /** every activity as early (default) or as late as possible */
  start?: "early" | "late";
  blocks: HistBlock[];
  T: number;
  peak: number; // the most workers needed at once
  /** workers needed in each time unit [t, t + 1), t = 0 … T − 1 — the profile the blocks stack to */
  profile: number[];
}
/** What is drawn on one beat of the histogram. */
export interface HistViewState {
  blocks: string[]; current?: string;
  /** levelling, multiple choice: the option being checked (0, 1, 2) */
  option?: number;
  /** resource levelling: which histogram is on the picture (the one with no limit, or the levelled one), the limit line, and the times that need more workers than the limit */
  which?: "before" | "after"; showLimit?: boolean; showOver?: boolean;
}

/** Workers needed in each time unit, from the blocks (every block counts in every unit it covers). */
export const histProfile = (blocks: { start: number; end: number; workers: number }[], T: number): number[] =>
  Array.from({ length: T }, (_, t) => blocks.reduce((sum, b) => sum + (b.start <= t && t < b.end ? b.workers : 0), 0));

/** where block b sits (its bottom edge) in time unit t */
export const histBaseAt = (b: HistBlock, t: number): number => (b.base ? b.base[t - b.start] : b.y);

/** true when no block floats over empty space: in every time unit the blocks covering it form one stack from the bottom. */
export function histHasNoHoles(blocks: HistBlock[], T: number): boolean {
  for (let t = 0; t < T; t++) {
    const here = blocks.filter((b) => b.start <= t && t < b.end).sort((a, b) => histBaseAt(a, t) - histBaseAt(b, t));
    let top = 0;
    for (const b of here) { if (histBaseAt(b, t) !== top) return false; top = histBaseAt(b, t) + b.workers; }
  }
  return true;
}

/** a stepped block: its bottom edge is not level */
export const isStepped = (b: HistBlock): boolean => !!b.base && b.base.some((v) => v !== b.base![0]);

/**
 * (`byTime`: no activity is kept along the bottom for being critical — a levelled histogram is simply built in order of start time, each block dropping onto
 * whatever is below it and splitting where that changes height, which is the order the levelling working draws them in.)
 * Stack blocks the way a histogram is drawn on paper: the `fixed` ones along the bottom, then every other block on top of whatever is
 * already under it, so a block that spans a place where the stack below changes height has a STEPPED bottom edge (it "jumps up" or down).
 * It is hole-free by construction. Several orders are tried (by start, by finish, longest first) and the one with the fewest steps is kept.
 */
export function stepStack(blocks: HistBlock[], T: number, fixed: HistBlock[], byTime = false): void {
  // the order a person draws it in: critical path 1 along the bottom (`fixed`), then the other critical activities, then everything else
  // by earliest start; each block drops onto whatever is already under it, so there is never a gap
  const rest = blocks.filter((b) => !fixed.includes(b))
    .sort((a, b) => (byTime ? 0 : Number(b.critical) - Number(a.critical)) || a.start - b.start || a.id.localeCompare(b.id));
  const height = new Array<number>(T).fill(0);
  const put = (b: HistBlock) => {
    const base: number[] = [];
    for (let t = b.start; t < b.end; t++) { base.push(height[t]); height[t] += b.workers; }
    b.y = base[0];
    b.base = base.some((v) => v !== base[0]) ? base : undefined;
  };
  [...fixed].sort((a, b) => a.start - b.start).forEach(put);
  rest.forEach(put);
}

/**
 * Stack blocks (rectangles at fixed times) with no holes: the `fixed` ones sit on the bottom, the rest go above, found by a small
 * depth-first search over each block's height (its y can only be 0 or the top of another block). Sets `y`; false when no hole-free stack exists.
 */
export function stackBlocks(blocks: HistBlock[], T: number, fixed: HistBlock[]): boolean {
  fixed.forEach((b) => (b.y = 0));
  const rest = blocks.filter((b) => !fixed.includes(b)).sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const overlapsTime = (a: HistBlock, b: HistBlock) => a.start < b.end && b.start < a.end;
  const clash = (a: HistBlock, b: HistBlock) => overlapsTime(a, b) && a.y < b.y + b.workers && b.y < a.y + a.workers;
  for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) if (overlapsTime(fixed[i], fixed[j])) return false;
  let nodes = 0;
  const placed: HistBlock[] = [...fixed];
  const go = (i: number): boolean => {
    if (++nodes > 20000) return false;
    if (i === rest.length) return histHasNoHoles(placed, T);
    const b = rest[i];
    const ys = [...new Set([0, ...placed.map((p) => p.y + p.workers)])].sort((x, y) => x - y);
    for (const y of ys) {
      b.y = y;
      if (placed.some((p) => clash(b, p))) continue;
      placed.push(b);
      if (go(i + 1)) return true;
      placed.pop();
    }
    return false;
  };
  return go(0);
}

/**
 * The histogram of a network, every activity as early as possible: the critical activities along the bottom, the rest stacked above
 * with no holes. Blocks are rectangles, so a hole-free stack does not always exist: returns null when it does not (the generator then
 * tries another network).
 */
export type HistShape = "whole" | "step" | "jump";
export function histogramData(acts: CpaActivity[], t: CpaTimes, start: "early" | "late" = "early", shape: HistShape = "whole"): HistogramData | null {
  const T = t.projectTime;
  const at = (a: CpaActivity) => (start === "early" ? t.es[a.id] : t.lf[a.id] - a.duration);
  const blocks: HistBlock[] = acts.map((a) => ({ id: a.id, start: at(a), end: at(a) + a.duration, workers: a.workers ?? 1, y: 0, critical: t.float[a.id] === 0 }));
  // with more than one critical path only the first goes along the bottom; the other critical activities are stacked like the rest
  const firstPath = new Set(referenceCpa(acts).criticalPaths[0]);
  const fixed = blocks.filter((b) => b.critical && firstPath.has(b.id));
  if (shape === "whole") {
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) if (fixed[i].start < fixed[j].end && fixed[j].start < fixed[i].end) return null;
    stepStack(blocks, T, fixed);
    if (blocks.some(isStepped)) return null; // the question asked for plain rectangles only
  } else {
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) if (fixed[i].start < fixed[j].end && fixed[j].start < fixed[i].end) return null;
    stepStack(blocks, T, fixed);
    if (shape === "jump" && !blocks.some(isStepped)) return null; // the question asked for a block that has to step
  }
  const profile = histProfile(blocks, T);
  return { start, blocks, T, peak: Math.max(...profile), profile };
}

// ── Resource levelling ───────────────────────────────────────────────────────
/** The times where the histogram needs more workers than the limit, as ranges with the workers needed. */
export function overLimit(profile: number[], limit: number): { from: number; to: number; need: number }[] {
  const out: { from: number; to: number; need: number }[] = [];
  for (let t = 0; t < profile.length; t++) {
    if (profile[t] <= limit) continue;
    const last = out[out.length - 1];
    if (last && last.to === t && last.need === profile[t]) last.to = t + 1;
    else out.push({ from: t, to: t + 1, need: profile[t] });
  }
  return out;
}

/**
 * The shortest schedule that never uses more than `limit` workers at once and keeps every precedence: every activity starts as soon as its
 * predecessors are done and enough workers are free (an exhaustive depth-first search over the order activities are placed, cut off by the
 * critical-path bound, so the finish time is the true minimum). Returns null if an activity needs more than the limit or the search is too big.
 */
export function levelSchedule(acts: CpaActivity[], t: CpaTimes, limit: number): { starts: Record<string, number>; makespan: number } | null {
  if (acts.some((a) => (a.workers ?? 1) > limit)) return null;
  const topo = fullGraph(acts).filter((a) => a.id !== START && a.id !== END);
  const ids = topo.map((a) => a.id);
  const dur: Record<string, number> = {}, w: Record<string, number> = {}, preds: Record<string, string[]> = {};
  topo.forEach((a) => { dur[a.id] = a.duration; w[a.id] = a.workers ?? 1; preds[a.id] = a.preds.filter((q) => q !== START); });
  const tail = (id: string) => t.projectTime - t.lf[id]; // the longest chain still to do after id
  const horizon = acts.reduce((s, a) => s + a.duration, 0) + 2;
  const usage = new Array<number>(horizon).fill(0);
  const start: Record<string, number> = {}, end: Record<string, number> = {};
  let count = 0, best = Infinity, bestStarts: Record<string, number> | null = null, nodes = 0, aborted = false;
  const fitFrom = (id: string): number => {
    let s = preds[id].reduce((m, q) => Math.max(m, end[q]), 0);
    for (;;) {
      let ok = true;
      for (let u = s; u < s + dur[id]; u++) if (usage[u] + w[id] > limit) { s = u + 1; ok = false; break; }
      if (ok) return s;
    }
  };
  const bound = (): number => {
    const est: Record<string, number> = {};
    let m = 0;
    for (const id of ids) {
      if (start[id] !== undefined) { est[id] = end[id]; m = Math.max(m, end[id]); continue; }
      est[id] = preds[id].reduce((x, q) => Math.max(x, est[q]), 0) + dur[id];
      m = Math.max(m, est[id] + tail(id));
    }
    return m;
  };
  const go = (): void => {
    if (aborted) return;
    if (++nodes > 300000) { aborted = true; return; }
    if (count === ids.length) {
      const mk = Math.max(...ids.map((id) => end[id]));
      if (mk < best) { best = mk; bestStarts = { ...start }; }
      return;
    }
    if (bound() >= best) return;
    const cands = ids.filter((id) => start[id] === undefined && preds[id].every((q) => start[q] !== undefined)).map((id) => ({ id, s: fitFrom(id) })).sort((a, b) => a.s - b.s || a.id.localeCompare(b.id));
    for (const c of cands) {
      start[c.id] = c.s; end[c.id] = c.s + dur[c.id]; count++;
      for (let u = c.s; u < end[c.id]; u++) usage[u] += w[c.id];
      go();
      for (let u = c.s; u < end[c.id]; u++) usage[u] -= w[c.id];
      count--; delete start[c.id]; delete end[c.id];
    }
  };
  go();
  return aborted || !bestStarts ? null : { starts: bestStarts, makespan: best };
}

export interface LevelData {
  limit: number;
  before: HistogramData; // every activity as early as possible (the histogram the question gives)
  after: HistogramData; // the levelled histogram (the answer)
  starts: Record<string, number>;
  /** held up for workers: starts later than the moment everything before it is finished (from = that moment, to = when it starts) */
  delayed: { id: string; from: number; to: number }[];
  over: { from: number; to: number; need: number }[];
  newTime: number;
  /** what the histogram is read against: the cascade chart (floats dashed), a table of floats, or the network */
  ref?: "cascade" | "floats" | "network";
  /** "Which could be a correctly levelled histogram?": three options, one valid and two that break a rule (the limit, or an activity starting before the ones it follows are done) */
  choices?: LevelChoice[];
}
export interface LevelChoice {
  label: "A" | "B" | "C";
  data: HistogramData;
  fault: "none" | "limit" | "precedence";
  /** what is wrong with it (the first place), or "" for the right one */
  note: string;
}

// ── Explain and justify (written reasoning, marked against mark points) ─────
export interface ReasonMark { code: "M1" | "B1" | "E1" | "R1"; text: string }
export interface ReasonData {
  /** range / remove: explain the effect of a change (the change is in `extra.change`); claim: comment on a stated finish time; glyn: "adding the critical durations gives the minimum time"; limit: a limitation of the model */
  type: "range" | "remove" | "claim" | "glyn" | "limit";
  marks: ReasonMark[];
  /** the model answer, a sentence or two per line */
  model: string[];
  /** claim: the time claimed and who claims it; glyn: the sum of the critical durations */
  claim?: { who: string; time: number };
  sumCritical?: number;
  /** limit: which limitation family this scenario draws on, and every answer that earns the marks */
  limits?: { name: string; limitation: string; effect: string }[];
}

// ── Which activity to shorten ────────────────────────────────────────────────
export interface ShortenResult { id: string; critical: boolean; newTime: number; saving: number; /** the other paths that become critical and stop the saving growing (when the saving is less than the full reduction) */ limitedBy: string[][] }
export interface ShortenData {
  /** the shortened activity takes this long (the question: "can be reduced to 1 hour") */
  to: number;
  /** every activity longer than `to`, in letter order */
  results: ShortenResult[];
  best: string;
  bestTime: number;
  /** the least minimum time any other choice gives */
  nextBest: number;
}

// ── Worker allocation ────────────────────────────────────────────────────────
/**
 * Hand each activity (one worker each) to a worker so that nobody does two things at once: in start order, to the lowest-numbered worker who is
 * free. `pin` activities (the first critical path, when the project is to finish in the minimum time) all go to worker 0. Returns worker
 * indexes (0 = Worker 1), or null if more than `k` workers would be needed.
 */
export function allocateWorkers(acts: CpaActivity[], starts: Record<string, number>, k: number, pin: Set<string> = new Set()): Record<string, number> | null {
  const order = [...acts].sort((a, b) => starts[a.id] - starts[b.id] || a.id.localeCompare(b.id));
  const freeAt = new Array<number>(k).fill(0);
  const out: Record<string, number> = {};
  for (const a of order) {
    const s = starts[a.id];
    const w = pin.has(a.id) ? 0 : freeAt.findIndex((end, i) => end <= s && !(pin.size > 0 && i === 0));
    if (w < 0 || freeAt[w] > s) return null;
    out[a.id] = w;
    freeAt[w] = s + a.duration;
  }
  return out;
}

export interface AllocData {
  /** "min": the project must finish in the minimum time — how few workers? "fixed": only this many workers — how long, and who does what? */
  kind: "min" | "fixed";
  workers: number; // the team (the smallest team for "min")
  alloc: Record<string, number>; // activity → worker index (0 = Worker 1)
  starts: Record<string, number>;
  newTime: number;
  /** "min" only: the best finish time with one worker fewer (longer than the minimum time, which is why the team cannot be smaller) */
  withFewer?: number;
  /** the finished chart: a row per worker, each activity a bar on its worker's row */
  chart: CascadeData;
}

/** Question-specific data for the tabs that go beyond the plain passes. */
export interface CpaExtra {
  /** an exam chain: how the pinned picture looks at the question (before any answer is shown) */
  examQ?: { view: CpaViewState; table?: "full" | "across"; chart?: "cascade" | "alloc" | "histogram" | "level" | "choose"; workers?: boolean };
  /** Explain and justify: what is asked and how it is marked */
  reason?: ReasonData;
  /** Critical paths, "which starts first": the activities that can start at once, their floats, and the one that must start first */
  first?: { sources: string[]; floats: Record<string, number>; answer: string };
  /** Which activity to shorten: the effect of reducing each one */
  shorten?: ShortenData;
  /** Worker allocation: the team, who does what, and the finished chart */
  alloc?: AllocData;
  /** Resource histogram: the finished histogram (the answer) */
  histogram?: HistogramData;
  /** Resource levelling: the limit, the histogram before and after, and what was delayed */
  level?: LevelData;
  /** Cascade chart: the finished chart (the answer) */
  cascade?: CascadeData;
  /** Missing times: the activity whose duration is x, the critical path through it and the other durations on that path added up */
  unknown?: {
    /** Level 2: one value in a box of the filled-in network is missing (x): the activity, which cell, and the value it must have */
    box?: { id: string; cell: "es" | "lf"; wrong: string[] };
    /** multiple choice: the options (the right one included) */
    choices?: number[];
    id: string; x: number; path: string[]; sumOthers: number; where: "on" | "off"; /** off the critical path: the greatest x that leaves the minimum completion time unchanged (= latest finish − earliest start of the activity) */ bound?: number };
  /** Delays and changes: the activity, what happens to it and the network after the change. "less" / "equal" / "more" = a delay compared with the float; "shorten" = a critical activity made quicker. */
  change?: { id: string; mode: "less" | "equal" | "more" | "shorten" | "range" | "remove"; amount: number; float: number; newActs: CpaActivity[]; newTimes: CpaTimes; newCriticalPaths: string[][]; /** the question asks about the earliest start and latest finish of these activities rather than the project time */ named?: string[] };
  /** Context and units: the clock time the project starts (minutes after midnight) and the activity whose latest start is asked for */
  clock?: {
    startMins: number; latestId: string;
    /** a second small project (jobs one after another, some timed in seconds) that must finish with the main one */
    second?: { parts: { label: string; text: string; secs: number; mins: number }[]; total: number };
  };
}

/** minutes after midnight as 24-hour clock time, "09:05" */
/** "1 minute", "5 minutes" */
export const withUnit = (n: number, unit: string): string => `${n} ${n === 1 ? unit.replace(/s$/, "") : unit}`;

export const clockTime = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export interface CpaProblemData {
  kind: CpaKind;
  acts: CpaActivity[];
  times: CpaTimes;
  layout: CpaLayout;
  criticalPaths: string[][]; // every critical path, Start … End (one, or several when the question allows it)
  unit: string; // "minutes", "days"…
  extra?: CpaExtra;
}

/** How the picture is drawn on one beat. Anything not listed is drawn as the question gave it. */
export interface CpaViewState {
  /** boxes drawn so far (default: all) — the network being built from the table */
  shown?: string[];
  /** arrows drawn so far (default: every arrow between shown boxes) */
  arrows?: string[];
  /** earliest starts filled in so far (the first cell of a box) */
  es?: Record<string, number>;
  /** latest finishes filled in so far (the last cell of a box) */
  lf?: Record<string, number>;
  /** the box being worked on */
  current?: string;
  /** the boxes whose times are being compared */
  compare?: string[];
  /** the arrows just drawn / being read */
  focusArrows?: string[];
  /** critical boxes (green) and the critical arrows between them */
  critical?: string[];
  criticalArrows?: string[];
  /** float shown under a box */
  float?: Record<string, number>;
  /** a value shown as something else in a box ("x" for a missing earliest start or latest finish) */
  esLabels?: Record<string, string>;
  lfLabels?: Record<string, string>;
  /** Which to shorten: the activities whose "reduce to 1" result is on the table so far */
  shortenDone?: string[];
  /** a duration shown as something other than its number ("x" for a missing time, the new value after a change) */
  durLabels?: Record<string, string>;
  /** Table from a network: the activities whose row of the precedence table has been filled in */
  tableDone?: string[];
}

// ── Generation ───────────────────────────────────────────────────────────────

export type CpaLevel = 1 | 2 | 3;
export type CpaPathsChoice = "one" | "more" | "either";
export interface CpaGenOptions { /** an exam chain: use this network for every part (the parts differ only in what they ask) */ fixed?: { acts: CpaActivity[]; layout: CpaLayout }; size?: "small" | "medium"; setting?: "plain" | "context"; paths?: CpaPathsChoice; /** require an arrow that skips a column */ skip?: boolean; /** Missing time: x on the critical path, off it (find what x must be at most), or either */ unknownWhere?: "on" | "off" | "either"; /** Missing time, Level 2: a missing earliest start or latest finish in a box of the filled-in network */ unknownBox?: boolean; /** Missing time: give the answer as one of four values */ unknownChoice?: boolean; /** Resource histogram / levelling: one worker each, or several */ workers?: "one" | "several"; /** Worker allocation: smallest team for the minimum time, or a fixed (smaller) team */ allocKind?: "min" | "fixed"; /** Worker allocation, fixed team: exactly this many workers (an exam chain that has just levelled to this limit) */ allocWorkers?: number; /** Explain and justify: which kind of question */ reasonCase?: "range" | "remove" | "claim" | "glyn" | "limit"; /** Critical paths: ask for every critical path, or which of several activities that can start at once must start first (and why) */ pathsAsk?: "paths" | "first"; /** Clock times: add a second small project (timed partly in seconds) that must finish with the main one */ clockSecond?: boolean; /** Delays and changes: a set delay against the float, a critical activity made quicker, a delay of "up to d", or an activity removed */ changeCase?: "delay" | "shorten" | "range" | "remove"; /** Delays and changes: ask for the project time, or the earliest start and latest finish of named later activities */ changeAsk?: "time" | "boxes"; /** Resource levelling: find the minimum time, or choose the correctly levelled histogram from three */ levelAsk?: "time" | "choose"; /** Cascade chart: the times are not given, so the passes come first */ cascadePasses?: boolean; /** Resource levelling: what the histogram is shown with */ levelRef?: "cascade" | "floats" | "network"; /** Which to shorten: the longest critical activity is best (simple), only an activity on every critical path helps (two), or a near-critical path makes a shorter critical activity better (trap) */ shortenCase?: "simple" | "two" | "trap"; /** Resource histogram: every activity as early or as late as possible */ histStart?: "early" | "late"; /** Resource histogram / levelling blocks: whole rectangles only, stepped blocks allowed, or at least one stepped block */ histShape?: HistShape; /** Cascade chart: given partly drawn, to complete */ partial?: boolean; /** Resource levelling: fits inside the float, needs extra time, or needs two or more delays including a critical activity held up */ levelType?: "within" | "extra" | "chain"; /** Cascade chart: as early or as late as possible, how the critical activities are laid out, and bars or blocks */ cascade?: { start: CascadeStart; layout: CascadeLayout; style: CascadeStyle } }

const SHAPES: Record<CpaLevel, number[][]> = {
  1: [[2, 2, 2, 1], [2, 2, 1, 1], [2, 1, 2, 1], [1, 2, 2, 1], [2, 2, 2]],
  2: [[2, 3, 2, 1], [2, 2, 3, 1], [3, 2, 2, 1], [2, 3, 3, 1], [2, 2, 3, 2]],
  3: [[2, 3, 3, 2], [3, 3, 3, 2], [2, 3, 3, 3], [2, 2, 3, 3, 1], [2, 2, 3, 2, 2], [3, 3, 3, 3]],
};
const COUNT_RANGE: Record<CpaLevel, [number, number]> = { 1: [6, 7], 2: [8, 9], 3: [10, 12] };
// the tidiest networks only: few crossings, at most one arrow round the boxes (a late attempt relaxes both by `slack`, so an option mix can never fail)
const CROSS_CAP: Record<CpaLevel, number> = { 1: 0, 2: 1, 3: 2 };
const ROUTED_CAP: Record<CpaLevel, number> = { 1: 0, 2: 1, 3: 1 };
const LETTERS = "ABCDEFGHIJKLMNOP";

/** Drop every predecessor that is already implied through another predecessor (an immediate-predecessor table never lists one). */
function reduce(acts: CpaActivity[]): CpaActivity[] {
  const preds = new Map(acts.map((a) => [a.id, a.preds]));
  const reach = (from: string, target: string, seen = new Set<string>()): boolean => {
    if (seen.has(from)) return false;
    seen.add(from);
    return (preds.get(from) ?? []).some((p) => p === target || reach(p, target, seen));
  };
  return acts.map((a) => ({ ...a, preds: a.preds.filter((p) => !a.preds.some((q) => q !== p && reach(q, p))) }));
}

function candidate(level: CpaLevel, range: [number, number]): CpaActivity[] {
  const shape = SHAPES[level][randInt(0, SHAPES[level].length - 1)];
  const colOf: number[] = [];
  shape.forEach((n, c) => { for (let i = 0; i < n; i++) colOf.push(c); });
  const ids = colOf.map((_, i) => LETTERS[i]);
  const acts: CpaActivity[] = ids.map((id, i) => {
    const c = colOf[i];
    const preds: string[] = [];
    if (c > 0) {
      const prev = ids.filter((_, j) => colOf[j] === c - 1);
      preds.push(prev[randInt(0, prev.length - 1)]);
      const extra = level === 1 ? 0.3 : 0.5;
      if (Math.random() < extra) {
        // mostly from the column just before (short, tidy arrows); only now and then from further back
        const near = Math.random() < 0.8;
        const pool = ids.filter((_, j) => (near ? colOf[j] === c - 1 : colOf[j] < c) && !preds.includes(ids[j]));
        if (pool.length) preds.push(pool[randInt(0, pool.length - 1)]);
      }
      preds.sort();
    }
    return { id, duration: randInt(range[0], range[1]), preds };
  });
  return reduce(acts);
}

function acceptable(acts: CpaActivity[], level: CpaLevel, paths: CpaPathsChoice, slack = 0, skip = false): CpaLayout | null {
  const [lo, hi] = COUNT_RANGE[level];
  if (acts.length < lo || acts.length > hi) return null;
  const hasSucc = new Set(acts.flatMap((a) => a.preds));
  if (acts.filter((a) => !hasSucc.has(a.id)).length > 3) return null; // at most three arrows into End
  if (acts.filter((a) => a.preds.length === 0).length > (level === 1 ? 2 : 3)) return null;
  if (acts.some((a) => a.preds.length === 0 && !hasSucc.has(a.id))) return null; // an activity that is both first and last would stand alone
  const ref = referenceCpa(acts);
  const n = ref.criticalPaths.length;
  if (paths === "one" ? n !== 1 : paths === "more" ? n < 2 || n > 3 : n > 3) return null; // the number of critical paths the question asks for (never a sprawl of them)
  const times = cpaTimes(acts);
  const floats = acts.map((a) => times.float[a.id]);
  if (!floats.some((f) => f > 0)) return null;
  if (level >= 2 && !acts.some((a) => a.preds.length >= 2)) return null;
  if (level === 3 || skip) {
    const depth = depthOf(fullGraph(acts));
    if (!acts.some((a) => a.preds.some((p) => depth[a.id] - depth[p] >= 2))) return null; // an arrow that skips a column
  }
  if (level === 3 && !floats.some((f) => f > 0 && f <= 2)) return null; // a near-critical activity
  if (new Set(acts.map((a) => a.duration)).size < Math.min(4, acts.length)) return null;
  const layout = layoutCpa(acts);
  if (layout.crossings > CROSS_CAP[level] + slack || layoutIssues(layout).length) return null;
  if (layout.edges.filter((e) => e.routed).length > ROUTED_CAP[level] + slack) return null; // an arrow that has to go round the boxes: none at Level 1
  return layout;
}

/** Make a non-critical activity critical by adding its float to its duration: the project time is unchanged and there is now another critical path. */
function addCriticalPath(acts: CpaActivity[], max: number): CpaActivity[] | null {
  const t = cpaTimes(acts);
  const options = acts.filter((a) => t.float[a.id] > 0 && a.duration + t.float[a.id] <= max);
  if (!options.length) return null;
  const x = options[randInt(0, options.length - 1)];
  return acts.map((a) => (a.id === x.id ? { ...a, duration: a.duration + t.float[x.id] } : a));
}

/** How untidy a layout is: crossings and arrows round the boxes count most, then long steep diagonals. Lower is tidier. */
export function layoutCost(l: CpaLayout): number {
  const rowH = BOX_H + GAP_Y;
  const steep = l.edges.reduce((sum, e) => sum + (e.routed ? 0 : Math.abs(e.pts[0][1] - e.pts[1][1]) / rowH), 0);
  return l.crossings * 10 + l.edges.filter((e) => e.routed).length * 8 + steep;
}

export const CPA_CONTEXTS = [
  { what: "building a garden shed", unit: "days" },
  { what: "preparing a school play", unit: "days" },
  { what: "launching a website", unit: "days" },
  { what: "refitting a kitchen", unit: "hours" },
];
// worded projects whose durations are in minutes, for the clock-time questions
const CLOCK_CONTEXTS = [
  "setting up the school hall for an exam",
  "preparing a buffet for a party",
  "setting up a stall at a market",
  "getting a theatre ready for a performance",
];

const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const list = (ids: string[]) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}` : ids[0] ?? "");

/**
 * Three levelled histograms for "which could be correct?": the true one, one that goes above the worker limit (an activity not held back),
 * and one that is shorter only because an activity starts before the ones it follows are done. Returns null if the second fault cannot be built.
 */
function levelOptions(acts: CpaActivity[], limit: number, starts: Record<string, number>): { label: "A" | "B" | "C"; starts: Record<string, number>; fault: "none" | "limit" | "precedence"; note: string }[] | null {
  const dur = Object.fromEntries(acts.map((a) => [a.id, a.duration]));
  const w = Object.fromEntries(acts.map((a) => [a.id, a.workers ?? 1]));
  const endOf = (st: Record<string, number>) => Math.max(...acts.map((a) => st[a.id] + dur[a.id]));
  const usage = (st: Record<string, number>, skip?: string) => {
    const u: number[] = new Array(endOf(st) + 1).fill(0);
    for (const a of acts) if (a.id !== skip) for (let t = st[a.id]; t < st[a.id] + dur[a.id]; t++) u[t] += w[a.id];
    return u;
  };
  const ready = (st: Record<string, number>, a: CpaActivity) => Math.max(0, ...a.preds.map((q) => st[q] + dur[q]));
  const correctEnd = endOf(starts);
  // fault 1: a held-back activity starts as soon as its predecessors are done, so the limit is broken
  let limitOpt: Record<string, number> | null = null, limitNote = "";
  for (const a of acts.filter((x) => starts[x.id] > ready(starts, x))) {
    const st = { ...starts, [a.id]: ready(starts, a) };
    const u = usage(st);
    const over = u.findIndex((v) => v > limit);
    if (over >= 0) { limitOpt = st; limitNote = `at time ${over} it needs ${u[over]} workers, more than the ${limit} available`; break; }
  }
  // fault 2: an activity starts before something it follows has finished, which fits under the limit and finishes sooner
  let precOpt: Record<string, number> | null = null, precNote = "";
  for (const a of acts.filter((x) => x.preds.length > 0)) {
    const r = ready(starts, a);
    for (let t = r - 1; t >= 0 && !precOpt; t--) {
      const st = { ...starts, [a.id]: t };
      if (usage(st).some((v) => v > limit) || endOf(st) >= correctEnd) continue;
      const broke = a.preds.find((q) => st[a.id] < starts[q] + dur[q])!;
      precOpt = st; precNote = `${a.id} starts at ${t}, before ${broke} has finished (${starts[broke] + dur[broke]})`;
    }
    if (precOpt) break;
  }
  if (!limitOpt || !precOpt) return null;
  const order: { starts: Record<string, number>; fault: "none" | "limit" | "precedence"; note: string }[] = [
    { starts, fault: "none", note: "" },
    { starts: limitOpt, fault: "limit", note: limitNote },
    { starts: precOpt, fault: "precedence", note: precNote },
  ];
  const shuffled = shuffle(order);
  return shuffled.map((o, i) => ({ label: (["A", "B", "C"] as const)[i], ...o }));
}

/** Some questions need a network with a particular property (a histogram that stacks, a unique best activity…): try again until one has it. */
export function generateCpa(level: CpaLevel, kind: CpaKind, opts: CpaGenOptions = {}): { data: CpaProblemData; prompt: string; answerText: string } {
  for (let i = 0; i < 400; i++) {
    try { return generateCpaOnce(level, kind, opts); } catch (e) { if ((kind !== "cpaHistogram" && kind !== "cpaLevel" && kind !== "cpaAlloc" && kind !== "cpaShorten" && kind !== "cpaChange" && kind !== "cpaContext" && kind !== "cpaPaths" && kind !== "cpaUnknown" && kind !== "cpaReason") || !(e instanceof Error) || e.message !== "histogram: no hole-free stack") throw e; }
  }
  throw new Error("critical path: no suitable histogram found");
}

function generateCpaOnce(level: CpaLevel, kind: CpaKind, opts: CpaGenOptions = {}): { data: CpaProblemData; prompt: string; answerText: string } {
  const range: [number, number] = (opts.size ?? (level === 1 ? "small" : "medium")) === "small" ? [1, 9] : [5, 25];
  const paths = opts.paths ?? "one";
  let acts: CpaActivity[] | null = null, layout: CpaLayout | null = null, bestCost = Infinity, found = 0;
  if (opts.fixed) { acts = opts.fixed.acts; layout = opts.fixed.layout; found = 99; }
  // keep the tidiest of several acceptable networks, rather than the first
  for (let attempt = 0; attempt < 4000 && found < 8; attempt++) {
    let c: CpaActivity[] | null = candidate(level, range);
    // "more than one critical path": start from a network with a single one and add another (the float of a non-critical activity, absorbed)
    if (paths !== "one" && (paths === "more" || Math.random() < 0.5)) c = addCriticalPath(c, range[1] * 2);
    if (!c) continue;
    const l = acceptable(c, level, paths, attempt < 1500 ? 0 : attempt < 3000 ? 1 : 2, !!opts.skip);
    if (!l) continue;
    found++;
    const cost = layoutCost(l);
    if (cost < bestCost) { bestCost = cost; acts = c; layout = l; }
  }
  if (!acts || !layout) throw new Error("critical path: no suitable network found");
  const times = cpaTimes(acts);
  const ref = referenceCpa(acts);
  const criticalPaths = ref.criticalPaths;
  const several = criticalPaths.length > 1;
  const ctx = opts.setting === "context" ? pickOne(CPA_CONTEXTS) : null;
  const unit = ctx ? ctx.unit : "minutes";
  const data: CpaProblemData = { kind, acts, times, layout, criticalPaths, unit };
  const critical = criticalActivities(acts);
  const T = times.projectTime;
  const subject = ctx ? `the project of ${ctx.what}` : "a project";
  const pathsText = criticalPaths.map((c) => c.join(" – ")).join(" and ");
  let prompt: string, answerText: string;
  if (kind === "cpaNetwork") {
    prompt = `The table shows the activities needed for ${subject}, how long each takes (in ${unit}) and the activities that must be finished immediately before it. Draw the activity network, including Start and End.`;
    answerText = ""; // the finished network is the answer: no separate line (a list of arrows only repeats the picture)
  } else if (kind === "cpaTable") {
    prompt = `The activity network represents ${subject}. The times are in ${unit}. Write down the precedence table: for each activity, the activities that must be finished immediately before it.`;
    answerText = acts.map((a) => `${a.id}: ${a.preds.length ? a.preds.join(", ") : "none"}`).join("; ") + ".";
  } else if (kind === "cpaForward") {
    prompt = `The activity network represents ${subject}. The times are in ${unit}. Find the earliest start time of every activity and the minimum completion time of the project.`;
    answerText = `Earliest starts: ${acts.map((a) => `${a.id} ${times.es[a.id]}`).join(", ")}. Minimum completion time ${T} ${unit}.`;
  } else if (kind === "cpaFull") {
    prompt = `The activity network represents ${subject}. The times are in ${unit}. Work out the earliest start time and latest finish time of every activity. State the critical activities, ${paths === "one" ? "the critical path" : "every critical path"} and the minimum completion time.`;
    answerText = `Critical activities ${list(critical)}; ${several ? "critical paths" : "critical path"} ${pathsText}; minimum completion time ${T} ${unit}.`;
  } else if (kind === "cpaPaths" && opts.pathsAsk === "first") {
    const sources = acts.filter((a) => a.preds.length === 0).map((a) => a.id);
    const critSources = sources.filter((id) => times.float[id] === 0);
    if (sources.length < 2 || critSources.length !== 1) throw new Error("histogram: no hole-free stack");
    const floats = Object.fromEntries(sources.map((id) => [id, times.float[id]]));
    const others = sources.filter((id) => id !== critSources[0]);
    data.extra = { first: { sources, floats, answer: critSources[0] } };
    prompt = `The activity network shows the earliest start time and latest finish time of every activity of ${subject}. The times are in ${unit}. Activities ${list(sources)} can all be started straight away. State which one must be started first so that the project can be finished in the minimum time, and give a reason.`;
    answerText = `${critSources[0]}: it is on the critical path (float 0), so it cannot be delayed. ${others.map((id) => `${id} has float ${floats[id]}`).join(", ")}.`;
  } else if (kind === "cpaPaths") {
    prompt = `The activity network shows the earliest start time and latest finish time of every activity of ${subject}. The times are in ${unit}. State the critical activities, ${paths === "one" ? "the critical path" : "every critical path"} and the minimum completion time.`;
    answerText = `Critical activities ${list(critical)}; ${several ? "critical paths" : "critical path"} ${pathsText}; minimum completion time ${T} ${unit}.`;
  } else if (kind === "cpaCascade") {
    const cs = opts.cascade ?? { start: "early", layout: "sequence", style: "blocks" };
    data.extra = { cascade: { ...cascadeData(acts, times, cs.start, cs.layout, cs.style, criticalPaths[0].filter((id) => id !== START && id !== END), !!opts.partial), passes: !!opts.cascadePasses } };
    const hasFloat = acts.filter((a) => times.float[a.id] > 0);
    prompt = opts.cascadePasses
      ? `The activity network represents ${subject}. The times are in ${unit}. Find the earliest start time and latest finish time of every activity (the forward and backward passes). Then draw a cascade (Gantt) chart for the project, with every activity starting as ${cs.start === "early" ? "early" : "late"} as possible. Show the float of each activity that has some.`
      : opts.partial
      ? `The activity network represents ${subject}. The times are in ${unit}. Part of the cascade (Gantt) chart is already drawn, with every activity starting as ${cs.start === "early" ? "early" : "late"} as possible. Complete the chart, and show the float of each activity that has some.`
      : `The activity network represents ${subject}. The times are in ${unit}. Draw a cascade (Gantt) chart for the project, with every activity starting as ${cs.start === "early" ? "early" : "late"} as possible. Show the float of each activity that has some.`;
    answerText = `${opts.cascadePasses ? `Minimum time ${T} ${unit}. ` : ""}Critical ${several ? "activities (more than one critical path)" : "activities"} ${list(critical)}${several ? "" : `, end to end from 0 to ${T}`}. Floats: ${hasFloat.map((a) => `${a.id} ${times.float[a.id]}`).join(", ")}.`;
  } else if (kind === "cpaHistogram") {
    const several = opts.workers === "several";
    if (!opts.fixed) acts.forEach((a) => { a.workers = several ? randInt(1, 3) : 1; });
    const hStart = opts.histStart === "late" ? "late" : "early";
    const h = histogramData(acts, times, hStart, opts.histShape ?? "whole");
    if (!h || h.peak < 3 || h.peak > 10) throw new Error("histogram: no hole-free stack");
    data.extra = { histogram: h };
    // the profile as ranges: "0–5: 3 workers, 5–8: 2 workers …"
    const runs: string[] = [];
    for (let t = 0, from = 0; t <= h.T; t++) if (t === h.T || h.profile[t] !== h.profile[from]) { runs.push(`${from}–${t}: ${h.profile[from]}`); from = t; }
    prompt = `The activity network represents ${subject}. The times are in ${unit}. ${several ? "The number of workers each activity needs is shown in the table." : "Each activity needs one worker."} Draw a resource histogram for the project, with every activity starting as ${hStart} as possible. Label every block.`;
    answerText = `Critical activities ${list(critical)} along the bottom. Workers needed (time: workers): ${runs.join(", ")}. The most needed at once is ${h.peak}.`;
  } else if (kind === "cpaShorten") {
    const to = 1;
    const results: ShortenResult[] = acts.filter((a) => a.duration > to).map((a) => {
      const changed = acts.map((x) => (x.id === a.id ? { ...x, duration: to } : x));
      const nT = cpaTimes(changed).projectTime;
      const saving = times.projectTime - nT;
      const full = a.duration - to;
      return { id: a.id, critical: times.float[a.id] === 0, newTime: nT, saving, limitedBy: saving < full && saving >= 0 && times.float[a.id] === 0 ? referenceCpa(changed).criticalPaths : [] };
    });
    const crit = results.filter((r) => r.critical);
    if (crit.length < 2) throw new Error("histogram: no hole-free stack");
    const bestTime = Math.min(...crit.map((r) => r.newTime));
    const bests = crit.filter((r) => r.newTime === bestTime);
    if (bests.length !== 1 || bestTime >= times.projectTime) throw new Error("histogram: no hole-free stack");
    const best = bests[0];
    const longest = [...crit].sort((a, b) => acts.find((x) => x.id === b.id)!.duration - acts.find((x) => x.id === a.id)!.duration);
    const shape = opts.shortenCase ?? "simple";
    const dur = (id: string) => acts.find((x) => x.id === id)!.duration;
    if (shape === "simple" && !(dur(longest[0].id) > dur(longest[1].id) && best.id === longest[0].id && best.saving === dur(best.id) - to)) throw new Error("histogram: no hole-free stack");
    if (shape === "two" && !(criticalPaths.length >= 2 && crit.some((r) => r.saving === 0))) throw new Error("histogram: no hole-free stack");
    if (shape === "trap" && !(criticalPaths.length === 1 && best.id !== longest[0].id && dur(longest[0].id) > dur(best.id))) throw new Error("histogram: no hole-free stack");
    const nextBest = Math.min(...results.filter((r) => r.id !== best.id).map((r) => r.newTime), times.projectTime);
    data.extra = { shorten: { to, results, best: best.id, bestTime, nextBest } };
    const u1 = unit.replace(/s$/, "");
    prompt = `The activity network represents ${subject}. The times are in ${unit}. One activity can be reduced so that it takes only ${to} ${u1}. State, with a reason, which activity should be reduced to make the minimum completion time as small as possible, and find the new minimum completion time.`;
    answerText = `Reduce ${best.id}: the minimum completion time becomes ${bestTime} ${unit}, a saving of ${best.saving}. Reducing any other activity gives ${nextBest} ${unit} or more.`;
  } else if (kind === "cpaAlloc") {
    if (!opts.fixed) acts.forEach((a) => { a.workers = 1; });
    const T0 = times.projectTime;
    let kmin = 0;
    let schMin: { starts: Record<string, number>; makespan: number } | null = null;
    for (let k = 1; k <= acts.length; k++) {
      const r = levelSchedule(acts, times, k);
      if (!r) throw new Error("histogram: no hole-free stack");
      if (r.makespan === T0) { kmin = k; schMin = r; break; }
    }
    const wantFixed = opts.allocKind === "fixed";
    if (!schMin || kmin < (wantFixed ? 3 : 2)) throw new Error("histogram: no hole-free stack");
    const k = wantFixed ? (opts.allocWorkers ?? randInt(2, kmin - 1)) : kmin;
    if (wantFixed && (k < 2 || k >= kmin)) throw new Error("histogram: no hole-free stack");
    const sch = wantFixed ? levelSchedule(acts, times, k) : schMin;
    if (!sch) throw new Error("histogram: no hole-free stack");
    const first = new Set(criticalPaths[0].filter((id) => id !== START && id !== END));
    const pinned = !wantFixed && criticalActivities(acts).every((id) => sch.starts[id] === times.es[id]) ? first : new Set<string>();
    const alloc = allocateWorkers(acts, sch.starts, k, pinned);
    if (!alloc) throw new Error("histogram: no hole-free stack");
    const withFewer = wantFixed ? undefined : levelSchedule(acts, times, k - 1)?.makespan;
    if (!wantFixed && !(withFewer && withFewer > T0)) throw new Error("histogram: no hole-free stack");
    const bars: CascadeBar[] = acts.map((a) => ({ id: a.id, start: sch.starts[a.id], end: sch.starts[a.id] + a.duration, float: 0, critical: times.float[a.id] === 0, row: alloc[a.id] }));
    const chart: CascadeData = { start: "early", layout: "rows", style: "blocks", bars, rowLabels: Array.from({ length: k }, (_, i) => `Worker ${i + 1}`), T: sch.makespan };
    data.extra = { alloc: { kind: wantFixed ? "fixed" : "min", workers: k, alloc, starts: sch.starts, newTime: sch.makespan, withFewer, chart } };
    const team = Array.from({ length: k }, (_, w) => `Worker ${w + 1}: ${acts.filter((a) => alloc[a.id] === w).sort((a, b) => sch.starts[a.id] - sch.starts[b.id]).map((a) => a.id).join(" ")}`).join("; ");
    if (wantFixed) {
      prompt = `The activity network represents ${subject}. The times are in ${unit}. Each activity needs one worker, and a worker can only do one activity at a time. Only ${k} workers are available. Find the minimum completion time, and allocate the activities to the workers so that it can be achieved.`;
      answerText = `Minimum completion time ${sch.makespan} ${unit} (${sch.makespan - T0} more than with as many workers as needed). ${team}.`;
    } else {
      prompt = `The activity network represents ${subject}. The times are in ${unit}. Each activity needs one worker, and a worker can only do one activity at a time. The project is to be finished in the minimum time of ${T0} ${unit}. Find the smallest number of workers needed, and allocate the activities to the workers so that it can be done.`;
      answerText = `${k} workers. ${team}.`;
    }
  } else if (kind === "cpaLevel") {
    const several = opts.workers === "several";
    if (!opts.fixed) acts.forEach((a) => { a.workers = several ? randInt(1, 3) : 1; });
    const before = histogramData(acts, times, "early", opts.histShape ?? "step");
    if (!before || before.peak < 3 || before.peak > 10) throw new Error("histogram: no hole-free stack");
    const maxW = Math.max(...acts.map((a) => a.workers ?? 1));
    const lo = Math.max(2, maxW), hi = before.peak - 1;
    if (hi < lo) throw new Error("histogram: no hole-free stack");
    // try the limits in a random order (just under the peak first, more often) until one gives the kind of question asked for
    const limits = Array.from({ length: hi - lo + 1 }, (_, k) => hi - k);
    if (Math.random() < 0.4) limits.sort(() => Math.random() - 0.5);
    const type = opts.levelType ?? "extra";
    let found: { limit: number; sch: { starts: Record<string, number>; makespan: number }; delayed: { id: string; from: number; to: number }[]; after: HistogramData } | null = null;
    for (const limit of limits) {
      const sch = levelSchedule(acts, times, limit);
      if (!sch) continue;
      // an activity is DELAYED when it has to wait for workers: it starts later than the moment everything before it is finished. (Ones that merely follow a delayed activity start later too, but were not held up for workers.)
      const readyAt = (a: CpaActivity) => Math.max(0, ...a.preds.map((q) => sch.starts[q] + acts.find((x) => x.id === q)!.duration));
      const delayed = acts.filter((a) => sch.starts[a.id] > readyAt(a)).map((a) => ({ id: a.id, from: readyAt(a), to: sch.starts[a.id] }));
      const T2 = sch.makespan;
      if (type === "within" ? !(T2 === T && delayed.length >= 1) : type === "extra" ? !(T2 > T && delayed.length >= 1) : !(T2 > T && delayed.length >= 2 && delayed.some((d) => times.float[d.id] === 0))) continue;
      const afterBlocks: HistBlock[] = acts.map((a) => ({ id: a.id, start: sch.starts[a.id], end: sch.starts[a.id] + a.duration, workers: a.workers ?? 1, y: 0, critical: times.float[a.id] === 0, moved: sch.starts[a.id] > readyAt(a) }));
      stepStack(afterBlocks, T2, [], true); // the levelled histogram may need a block to drop; "whole blocks" only constrains the histogram the question gives
      const afterProfile = histProfile(afterBlocks, T2);
      found = { limit, sch, delayed, after: { blocks: afterBlocks, T: T2, peak: Math.max(...afterProfile), profile: afterProfile } };
      break;
    }
    if (!found) throw new Error("histogram: no hole-free stack");
    const { limit, sch, delayed, after } = found;
    const T2 = sch.makespan;
    const over = overLimit(before.profile, limit);
    data.extra = { histogram: before, level: { limit, before, after, starts: sch.starts, delayed, over, newTime: T2, ref: opts.levelRef ?? "cascade" } };
    if ((opts.levelRef ?? "cascade") === "cascade") data.extra.cascade = cascadeData(acts, times, "early", "rows", "blocks");
    if (opts.levelAsk === "choose") {
      const opt = levelOptions(acts, limit, sch.starts);
      if (!opt) throw new Error("histogram: no hole-free stack");
      const choices: LevelChoice[] = opt.map((o) => {
        const blocks: HistBlock[] = acts.map((a) => ({ id: a.id, start: o.starts[a.id], end: o.starts[a.id] + a.duration, workers: a.workers ?? 1, y: 0, critical: times.float[a.id] === 0 }));
        const end = Math.max(...blocks.map((b) => b.end));
        stepStack(blocks, end, [], true);
        const profile = histProfile(blocks, end);
        return { label: o.label, data: { blocks, T: end, peak: Math.max(...profile), profile }, fault: o.fault, note: o.note };
      });
      data.extra.level!.choices = choices;
      const right = choices.find((c) => c.fault === "none")!;
      prompt = `The activity network represents ${subject}. The times are in ${unit}. ${several ? "The number of workers each activity needs is shown in the table." : "Each activity needs one worker."} Only ${limit} workers are available, and each activity begins as early as it can. Which of the three histograms A, B and C could be a correctly levelled histogram? Tick one box.`;
      answerText = `Option ${right.label}. ${choices.filter((c) => c.fault !== "none").map((c) => `${c.label} is wrong: ${c.note}.`).join(" ")}`;
    } else {
      prompt = `The activity network represents ${subject}. The times are in ${unit}. ${several ? "The number of workers each activity needs is shown in the table." : "Each activity needs one worker."} The resource histogram for the project, with every activity as early as possible, is shown. Only ${limit} workers are available. Use resource levelling to find the minimum completion time, and say which activities have to be delayed.`;
      answerText = T2 === T
      ? `Minimum completion time still ${T} ${unit}. Delay ${delayed.map((d) => `${d.id} to ${d.to}`).join(", ")} (within the float).`
      : `Minimum completion time ${T2} ${unit}, ${T2 - T} more than without the limit. Delay ${delayed.map((d) => `${d.id} to ${d.to}`).join(", ")}; the activities after them start later as a result.`;
    }
  } else if (kind === "cpaUnknown" && opts.unknownBox) {
    // one value in a box of the filled-in network is missing: a latest finish needs the SMALLEST of the later activities' latest starts, an earliest start the LARGEST of the earlier finishes
    const full = fullGraph(acts);
    const succs = successorsOf(full);
    const dur = (id: string) => (id === START || id === END ? 0 : acts.find((a) => a.id === id)!.duration);
    const useEs = Math.random() < 0.5;
    const pool = acts.filter((a) => (useEs ? a.preds.length >= 2 && times.es[a.id] > 0 : succs[a.id].filter((q) => q !== END).length >= 2 && times.lf[a.id] < T));
    if (!pool.length) throw new Error("histogram: no hole-free stack");
    const a = pool[randInt(0, pool.length - 1)];
    const preds = full.find((x) => x.id === a.id)!.preds;
    const succ = succs[a.id];
    const cands = useEs ? preds.map((q) => times.ef[q]) : succ.map((q) => times.ls[q]);
    const x = useEs ? times.es[a.id] : times.lf[a.id];
    // the usual wrong answers: the other end of the comparison, one of the values rather than the extreme, and adding the activity's own duration
    const wrongSet = [...new Set([useEs ? Math.min(...cands) : Math.max(...cands), useEs ? cands.reduce((p2, c2) => p2 + c2, 0) : cands.reduce((p2, c2) => p2 + c2, 0), x + dur(a.id), Math.max(0, x - dur(a.id)), x + 1, Math.max(0, x - 1)])].filter((v) => v !== x && v >= 0);
    if (wrongSet.length < 3) throw new Error("histogram: no hole-free stack");
    const wrong = wrongSet.slice(0, 3);
    const choices = opts.unknownChoice ? [...wrong, x].sort((p2, q2) => p2 - q2) : undefined;
    data.extra = { unknown: { id: a.id, x, path: criticalPaths[0], sumOthers: 0, where: "on", box: { id: a.id, cell: useEs ? "es" : "lf", wrong: wrong.map(String) }, choices } };
    prompt = `The activity network represents ${subject}. The times are in ${unit}. The earliest start time and latest finish time of every activity are shown, except one: the ${useEs ? "earliest start time" : "latest finish time"} of activity ${a.id} is x. Find the value of x.${choices ? ` Circle your answer: ${choices.join("   ")}` : ""}`;
    answerText = `x = ${x}`;
  } else if (kind === "cpaUnknown") {
    const path = criticalPaths[0];
    const off = opts.unknownWhere === "off" || (opts.unknownWhere === "either" && Math.random() < 0.5);
    if (off) {
      const floaty = acts.filter((a) => times.float[a.id] > 0);
      const k = floaty[randInt(0, floaty.length - 1)].id;
      const a = acts.find((x) => x.id === k)!;
      const bound = times.lf[k] - times.es[k];
      data.extra = { unknown: { id: k, x: a.duration, path, sumOthers: 0, where: "off", bound } };
      prompt = `The activity network represents ${subject}. The times are in ${unit}. Activity ${k} takes x ${unit}. The critical path is ${path.join(" – ")} and the minimum completion time is ${T} ${unit}. Activity ${k} is not on the critical path. Find the largest value of x for which the minimum completion time is still ${T} ${unit}.`;
      answerText = `x ≤ ${bound}`;
    } else {
      const onPath = path.slice(1, -1);
      const k = onPath[randInt(0, onPath.length - 1)];
      const x = acts.find((a) => a.id === k)!.duration;
      let choices: number[] | undefined;
      if (opts.unknownChoice) {
        const w = [...new Set([x + randInt(1, 3), Math.max(1, x - randInt(1, 3)), x + randInt(4, 7), T - x])].filter((v) => v !== x && v > 0);
        if (w.length < 3) throw new Error("histogram: no hole-free stack");
        choices = [...w.slice(0, 3), x].sort((p2, q2) => p2 - q2);
      }
      data.extra = { unknown: { id: k, x, path, sumOthers: T - x, where: "on", choices } };
      prompt = `The activity network represents ${subject}. The times are in ${unit}. Activity ${k} takes x ${unit}. The critical path is ${path.join(" – ")} and the minimum completion time is ${T} ${unit}. Find the value of x.${choices ? ` Circle your answer: ${choices.join("   ")}` : ""}`;
      answerText = `x = ${x}`;
    }
  } else if (kind === "cpaReason") {
    const rc = opts.reasonCase ?? "range";
    const who = pickOne(["Robert", "Priya", "Amara", "the site manager"]);
    if (rc === "range" || rc === "remove") {
      // the network and the change come from the delays-and-changes generator; here it is asked as an explanation and marked against mark points
      const g = generateCpaOnce(level, "cpaChange", { ...opts, changeCase: rc, changeAsk: "time" });
      g.data.kind = "cpaReason";
      const c = g.data.extra!.change!;
      const T0 = g.data.times.projectTime, nT = c.newTimes.projectTime;
      const u = g.data.unit;
      const baseCrit = new Set(criticalActivities(g.data.acts));
      const newly = criticalActivities(c.newActs).filter((id) => !baseCrit.has(id));
      const crit0 = c.id;
      let marks: ReasonMark[], model: string[], ask: string;
      if (rc === "range") {
        ask = `Explain whether the minimum completion time of the project increases${""}, and by how much at most.`;
        marks = [
          { code: "M1", text: `States the float of activity ${c.id} is ${c.float} (or refers to "${c.float + 1} or more", or to "${c.float} or fewer")` },
          { code: "R1", text: `Infers that if the increase is more than ${c.float} the minimum completion time increases (by the excess), and if it is ${c.float} or less it does not` },
        ];
        model = [`The float of ${c.id} is ${c.float} ${u}.`, `An increase of ${c.float} or less is absorbed by the float, so the minimum completion time stays ${T0} ${u}.`, `An increase of more than ${c.float} delays the project by the excess: at worst ${c.amount} − ${c.float} = ${c.amount - c.float}, so up to ${nT} ${u}.`];
        const base = `The activity network shows the earliest start time, latest finish time and float of every activity of ${g.data.unit === "minutes" ? "a project" : "a project"}. The times are in ${u}.`;
        void base;
        g.prompt = `The activity network shows the earliest start time, latest finish time and float of every activity. The times are in ${u}. The duration of activity ${c.id} may increase by up to ${withUnit(c.amount, u)}. ${ask}`;
      } else {
        ask = "Explain the effect of removing it on the minimum completion time.";
        marks = [
          { code: "B1", text: newly.length ? `Explains that ${list(newly)} now ${newly.length > 1 ? "become" : "becomes"} critical (or that the earliest starts of the later activities decrease)` : `Explains that the earliest starts of the later activities decrease` },
          { code: "B1", text: `Deduces that the minimum completion time reduces by ${T0 - nT} ${u}, to ${nT} ${u}` },
        ];
        model = [
          `${crit0} is on the critical path, so removing it (the same as it taking 0 ${u}) shortens that path by ${c.amount}.`,
          T0 - nT === c.amount ? `No other path is as long, so the whole ${c.amount} is saved.` : `${newly.length ? `${cpaList2(newly)} ${newly.length > 1 ? "become" : "becomes"} critical` : "Another path becomes critical"}, so the time cannot fall by the full ${c.amount}.`,
          `The minimum completion time reduces by ${T0 - nT} ${u}, to ${nT} ${u}.`,
        ];
        g.prompt = `The activity network shows the earliest start time, latest finish time and float of every activity. The times are in ${u}. Activity ${c.id} is found to be unnecessary and is removed from the project. ${ask}`;
      }
      g.data.extra!.reason = { type: rc, marks, model };
      return { data: g.data, prompt: g.prompt, answerText: model.join(" ") };
    }
    if (rc === "claim") {
      const cl = Math.random() < 0.5 ? T : Math.max(1, T - randInt(1, Math.min(6, T - 1)));
      const u = unit;
      let marks: ReasonMark[], model: string[];
      if (cl === T) {
        marks = [
          { code: "E1", text: `Finds the minimum completion time (${T} ${u}) and compares it with the ${cl} ${u} claimed, to comment` },
          { code: "E1", text: "Gives a reason it might not be valid, or a condition that must hold: enough workers to do activities at the same time, or no delay to a critical activity" },
        ];
        model = [`The minimum completion time is ${T} ${u}, so ${who}'s claim of ${cl} ${u} appears to be valid.`, "However, it may take longer if there are not enough workers to carry out activities at the same time, or if any critical activity is delayed."];
      } else {
        marks = [
          { code: "E1", text: `Finds the minimum completion time (${T} ${u}) and compares it with the ${cl} ${u} claimed` },
          { code: "E1", text: `Concludes that the claim cannot be valid: even with every activity started as early as possible the project needs ${T} ${u}` },
        ];
        model = [`The minimum completion time is ${T} ${u}, which is more than the ${cl} ${u} ${who} claims.`, `So the claim is not valid: the critical path alone takes ${T} ${u}, and that cannot be shortened by starting earlier.`];
      }
      data.extra = { reason: { type: "claim", marks, model, claim: { who, time: cl } } };
      prompt = `The activity network represents ${subject}. The times are in ${unit}. ${who} claims that the project can be completed in ${cl} ${unit}. Comment on the validity of the claim.`;
      answerText = model.join(" ");
    } else if (rc === "glyn") {
      const critIds = criticalActivities(acts);
      const sum = critIds.reduce((x, id) => x + acts.find((a) => a.id === id)!.duration, 0);
      if (criticalPaths.length < 2 || sum === T) throw new Error("histogram: no hole-free stack");
      const marks: ReasonMark[] = [
        { code: "E1", text: `(i) Finds the sum of the critical durations (${critIds.map((id) => acts.find((a) => a.id === id)!.duration).join(" + ")} = ${sum}) and compares it with the minimum completion time ${T}` },
        { code: "E1", text: "(ii) Explains that the claim is true for a network with all the critical activities on a single critical path" },
      ];
      const model = [`(i) The critical activities are ${list(critIds)}. Their durations add up to ${sum}, but the minimum completion time is ${T}. ${sum} ≠ ${T}, so the claim is false.`, "(ii) It is true when all the critical activities are on a single critical path (there is only one critical path), because then the activities on it follow one another end to end."];
      data.extra = { reason: { type: "glyn", marks, model, sumCritical: sum } };
      prompt = `The activity network represents ${subject}. The times are in ${unit}. Glyn claims that the minimum completion time of a project can be found by adding together the durations of all the critical activities. (i) Show that Glyn's claim is false for this network. (ii) Describe a situation in which Glyn's claim would be true.`;
      answerText = model.join(" ");
    } else {
      const limits = [
        { name: "travel time", limitation: "The model does not allow for the time workers need to move from one activity to the next (for example to a different site).", effect: "That travelling time delays the later activities, so the project takes longer than the minimum completion time, and may cost more." },
        { name: "fixed durations", limitation: "Every duration is taken as exact, but in practice an activity can take longer (bad weather, illness, late materials).", effect: "A delay to a critical activity delays the whole project, and a delay to an activity with float may use it up, so the real completion time can be longer." },
        { name: "unlimited workers", limitation: "The model assumes there are enough workers to carry out every activity that can run at the same time.", effect: "With fewer workers some activities must wait, so the project takes longer than the minimum completion time." },
        { name: "cost ignored", limitation: "The model only looks at time and ignores cost (more workers, faster methods and overtime all cost money).", effect: "A plan that gives the shortest time may cost far more than a slightly longer one." },
      ];
      const pickL = pickOne(limits);
      const marks: ReasonMark[] = [
        { code: "B1", text: "Correctly identifies a limitation of the model in the context of the project" },
        { code: "E1", text: "Explains how that limitation affects the project, in time or money terms" },
      ];
      const model = [`${pickL.limitation}`, `${pickL.effect}`];
      data.extra = { reason: { type: "limit", marks, model, limits } };
      prompt = `The activity network represents ${subject}. The times are in ${unit}. State one limitation of using this activity network to plan the project. Explain how this limitation affects the project.`;
      answerText = model.join(" ");
    }
  } else if (kind === "cpaChange") {
    const floaty = acts.filter((a) => times.float[a.id] > 0);
    const critAll = acts.filter((a) => times.float[a.id] === 0);
    const shortenable = critAll.filter((a) => a.duration >= 2);
    const want = opts.changeCase ?? (level >= 2 && shortenable.length > 0 ? "shorten" : "delay");
    let id: string, mode: "less" | "equal" | "more" | "shorten" | "range" | "remove", amount: number, fl: number;
    if (want === "remove") {
      const a = critAll[randInt(0, critAll.length - 1)];
      id = a.id; mode = "remove"; fl = 0; amount = a.duration;
    } else if (want === "shorten" && shortenable.length > 0) {
      const a = shortenable[randInt(0, shortenable.length - 1)];
      id = a.id; mode = "shorten"; fl = 0; amount = randInt(1, Math.min(a.duration - 1, Math.max(1, Math.round(a.duration * 0.6))));
    } else if (want === "range") {
      const a = floaty[randInt(0, floaty.length - 1)];
      id = a.id; mode = "range"; fl = times.float[a.id]; amount = fl + randInt(1, Math.max(1, Math.min(4, range[1])));
    } else {
      const a = floaty[randInt(0, floaty.length - 1)];
      fl = times.float[a.id]; id = a.id;
      const modes: ("less" | "equal" | "more")[] = fl >= 2 ? ["less", "equal", "more"] : ["equal", "more"];
      mode = modes[randInt(0, modes.length - 1)];
      amount = mode === "less" ? randInt(1, fl - 1) : mode === "equal" ? fl : fl + randInt(1, Math.max(1, Math.min(4, range[1])));
    }
    const newActs = acts.map((a) => (a.id === id ? { ...a, duration: a.duration + (mode === "shorten" || mode === "remove" ? -amount : amount) } : a));
    const newTimes = cpaTimes(newActs);
    // the activities after the changed one, for a question about their times (some move, one at most stays put, as in the exam)
    let named: string[] | undefined;
    if (opts.changeAsk === "boxes" && mode !== "range") {
      const succs = successorsOf(fullGraph(acts));
      const after: string[] = [];
      const walk = (x: string) => succs[x].forEach((q) => { if (q !== END && !after.includes(q)) { after.push(q); walk(q); } });
      walk(id);
      const moved = after.filter((q) => newTimes.es[q] !== times.es[q] || newTimes.lf[q] !== times.lf[q]);
      const still = after.filter((q) => !moved.includes(q));
      const pickN = [...moved.slice(0, still.length ? 2 : 3), ...still.slice(0, 1)];
      if (pickN.length >= 2) named = pickN.sort();
      else throw new Error("histogram: no hole-free stack");
    }
    data.extra = { change: { id, mode, amount, float: fl, newActs, newTimes, newCriticalPaths: referenceCpa(newActs).criticalPaths, named } };
    const nT = newTimes.projectTime;
    const base = `The activity network shows the earliest start time, latest finish time and float of every activity of ${subject}. The times are in ${unit}.`;
    const namedAsk = named ? ` Deduce the effect, if any, on the earliest start time and latest finish time of activities ${list(named)}.` : "";
    const namedAns = named ? ` ${named.map((q) => `${q}: earliest start ${newTimes.es[q] === times.es[q] ? `unchanged (${times.es[q]})` : `${times.es[q]} → ${newTimes.es[q]}`}, latest finish ${newTimes.lf[q] === times.lf[q] ? `unchanged (${times.lf[q]})` : `${times.lf[q]} → ${newTimes.lf[q]}`}`).join("; ")}.` : "";
    if (mode === "remove") {
      prompt = `${base} Activity ${id} is not needed, so it is removed from the project.${named ? namedAsk : " Explain the effect of removing it on the minimum completion time."}`;
      answerText = `${id} is critical, so removing it (the same as taking 0 ${unit}) ${T - nT === amount ? `saves all ${amount}` : `saves ${T - nT}, not ${amount}, because another path becomes critical`}: the minimum completion time becomes ${nT} ${unit}.${namedAns}`;
    } else if (mode === "shorten") {
      prompt = `${base} Activity ${id} is made quicker and takes ${withUnit(amount, unit)} less.${named ? namedAsk : " Find the new minimum completion time and say how much time is saved."}`;
      answerText = `New minimum completion time ${nT} ${unit}; ${withUnit(T - nT, unit)} saved${T - nT < amount ? ` (not all ${amount}, because another path becomes critical)` : ""}.${namedAns}`;
    } else if (mode === "range") {
      prompt = `${base} Activity ${id} may take longer than planned: its duration could increase by up to ${withUnit(amount, unit)}. Explain whether the minimum completion time of the project increases, and by how much at most.`;
      answerText = `The float of ${id} is ${fl}. An increase of ${fl} or less does not change the minimum time (${T} ${unit}); an increase of more than ${fl} does, by the excess over ${fl}. At most ${amount} − ${fl} = ${amount - fl}, so the time becomes ${nT} ${unit} at worst.`;
    } else {
      prompt = `${base} Activity ${id} is delayed and takes ${withUnit(amount, unit)} longer than planned.${named ? namedAsk : " State the effect on the minimum completion time."}`;
      answerText = (mode === "more" ? `It increases by ${withUnit(amount - fl, unit)}, to ${nT} ${unit}.` : mode === "equal" ? `No effect: the delay equals the float, so the time stays ${T} ${unit}, but ${id} is now critical.` : `No effect: the delay is less than the float, so the time stays ${T} ${unit}.`) + namedAns;
    }
  } else if (kind === "cpaContext") {
    const what = pickOne(CLOCK_CONTEXTS);
    const startMins = 7 * 60 + 15 * randInt(0, 12);
    const floaty = acts.filter((a) => times.float[a.id] > 0);
    const target = floaty[randInt(0, floaty.length - 1)];
    data.unit = "minutes";
    if (opts.clockSecond) {
      // a second project: three jobs one after another, each partly in seconds, that must finish at the same moment as the main project
      const trio = pickOne([[15, 15, 30], [15, 30, 15], [30, 15, 15], [45, 45, 30], [45, 30, 45], [30, 45, 45]]);
      const m1 = randInt(3, 12), m2 = randInt(3, 12);
      const parts = [
        { label: "Switch on and heat the oven", text: `${trio[0]} seconds to switch on, then ${m1} minutes to heat up`, secs: trio[0], mins: m1 + trio[0] / 60 },
        { label: "Put the pies in and cook them", text: `${trio[1]} seconds to put them in, then ${m2} minutes to cook`, secs: trio[1], mins: m2 + trio[1] / 60 },
        { label: "Transfer to a serving dish", text: `${trio[2]} seconds`, secs: trio[2], mins: trio[2] / 60 },
      ];
      const total = parts.reduce((sum, x) => sum + x.mins, 0);
      if (total >= T - 1) throw new Error("histogram: no hole-free stack");
      data.extra = { clock: { startMins, latestId: target.id, second: { parts, total } } };
      const lateStart = startMins + T - total;
      prompt = `The activity network represents the project of ${what}. The times are in minutes and work starts at ${clockTime(startMins)}. Work out the earliest time the project can be finished. A second small project of three jobs, one after another, must finish at that same time: (1) ${parts[0].label.toLowerCase()}: ${parts[0].text}; (2) ${parts[1].label.toLowerCase()}: ${parts[1].text}; (3) ${parts[2].label.toLowerCase()}: ${parts[2].text}. Give each job's duration in minutes, and find the latest time the first job can be started.`;
      answerText = `Finish at ${clockTime(startMins + T)}. Durations ${parts.map((x) => x.mins).join(", ")} minutes (${total} in all). Latest start ${clockTime(lateStart)}.`;
    } else {
      data.extra = { clock: { startMins, latestId: target.id } };
      prompt = `The activity network represents the project of ${what}. The times are in minutes and work starts at ${clockTime(startMins)}. Work out the earliest time the project can be finished. Find the latest time activity ${target.id} can start without delaying that finish.`;
      answerText = `Finish at ${clockTime(startMins + T)}. Activity ${target.id} can start as late as ${clockTime(startMins + times.lf[target.id] - target.duration)}.`;
    }
  } else {
    prompt = `The activity network shows the earliest start time and latest finish time of every activity of ${subject}. The times are in ${unit}. Find the float of every activity and state the critical activities.`;
    answerText = `Floats: ${acts.map((a) => `${a.id} ${times.float[a.id]}`).join(", ")}. Critical activities ${list(critical)}.`;
  }
  return { data, prompt, answerText };
}

const cpaList2 = list;
export { list as cpaList };
