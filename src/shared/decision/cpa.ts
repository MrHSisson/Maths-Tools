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

export type CpaKind = "cpaNetwork" | "cpaTable" | "cpaForward" | "cpaFull" | "cpaFloat" | "cpaPaths" | "cpaUnknown" | "cpaChange" | "cpaContext" | "cpaCascade";

// ── The cascade (Gantt) chart ────────────────────────────────────────────────
export type CascadeStart = "early" | "late";
/** "sequence": the critical activities end to end on ONE row, the rest one row each; "rows": every activity on its own row */
export type CascadeLayout = "sequence" | "rows";
/** "blocks": full-height blocks, the float a dashed block beside it; "bars": thin bars, the float a dashed line */
export type CascadeStyle = "blocks" | "bars";
export interface CascadeBar { id: string; start: number; end: number; float: number; critical: boolean; row: number }
export interface CascadeData {
  start: CascadeStart; layout: CascadeLayout; style: CascadeStyle;
  bars: CascadeBar[];
  rowLabels: string[]; // the label at the left of each row ("Critical" for the shared critical row)
  T: number;
}
/** What is drawn on one beat of the cascade chart (anything not listed is not yet drawn). */
export interface GanttViewState { bars: string[]; floats: string[]; current?: string }

/** The cascade chart for a network: where every activity sits, from the same times the passes found. */
export function cascadeData(acts: CpaActivity[], t: CpaTimes, start: CascadeStart, layout: CascadeLayout, style: CascadeStyle): CascadeData {
  const crit = (id: string) => t.float[id] === 0;
  const startOf = (a: CpaActivity) => (start === "early" ? t.es[a.id] : t.lf[a.id] - a.duration);
  const others = acts.filter((a) => !crit(a.id));
  const rowOf: Record<string, number> = {};
  let rowLabels: string[];
  if (layout === "sequence") {
    acts.filter((a) => crit(a.id)).forEach((a) => (rowOf[a.id] = 0));
    others.forEach((a, i) => (rowOf[a.id] = i + 1));
    rowLabels = ["Critical", ...others.map((a) => a.id)];
  } else {
    acts.forEach((a, i) => (rowOf[a.id] = i));
    rowLabels = acts.map((a) => a.id);
  }
  const bars = acts.map((a) => ({ id: a.id, start: startOf(a), end: startOf(a) + a.duration, float: t.float[a.id], critical: crit(a.id), row: rowOf[a.id] }));
  return { start, layout, style, bars, rowLabels, T: t.projectTime };
}

/** Question-specific data for the tabs that go beyond the plain passes. */
export interface CpaExtra {
  /** Cascade chart: the finished chart (the answer) */
  cascade?: CascadeData;
  /** Missing times: the activity whose duration is x, the critical path through it and the other durations on that path added up */
  unknown?: { id: string; x: number; path: string[]; sumOthers: number };
  /** Delays and changes: the activity, what happens to it and the network after the change. "less" / "equal" / "more" = a delay compared with the float; "shorten" = a critical activity made quicker. */
  change?: { id: string; mode: "less" | "equal" | "more" | "shorten"; amount: number; float: number; newActs: CpaActivity[]; newTimes: CpaTimes; newCriticalPaths: string[][] };
  /** Context and units: the clock time the project starts (minutes after midnight) and the activity whose latest start is asked for */
  clock?: { startMins: number; latestId: string };
}

/** minutes after midnight as 24-hour clock time, "09:05" */
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
  /** a duration shown as something other than its number ("x" for a missing time, the new value after a change) */
  durLabels?: Record<string, string>;
  /** Table from a network: the activities whose row of the precedence table has been filled in */
  tableDone?: string[];
}

// ── Generation ───────────────────────────────────────────────────────────────

export type CpaLevel = 1 | 2 | 3;
export type CpaPathsChoice = "one" | "more" | "either";
export interface CpaGenOptions { size?: "small" | "medium"; setting?: "plain" | "context"; paths?: CpaPathsChoice; /** require an arrow that skips a column */ skip?: boolean; /** Cascade chart: as early or as late as possible, how the critical activities are laid out, and bars or blocks */ cascade?: { start: CascadeStart; layout: CascadeLayout; style: CascadeStyle } }

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

const CONTEXTS = [
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

export function generateCpa(level: CpaLevel, kind: CpaKind, opts: CpaGenOptions = {}): { data: CpaProblemData; prompt: string; answerText: string } {
  const range: [number, number] = (opts.size ?? (level === 1 ? "small" : "medium")) === "small" ? [1, 9] : [5, 25];
  const paths = opts.paths ?? "one";
  let acts: CpaActivity[] | null = null, layout: CpaLayout | null = null, bestCost = Infinity, found = 0;
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
  const ctx = opts.setting === "context" ? pickOne(CONTEXTS) : null;
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
  } else if (kind === "cpaPaths") {
    prompt = `The activity network shows the earliest start time and latest finish time of every activity of ${subject}. The times are in ${unit}. State the critical activities, ${paths === "one" ? "the critical path" : "every critical path"} and the minimum completion time.`;
    answerText = `Critical activities ${list(critical)}; ${several ? "critical paths" : "critical path"} ${pathsText}; minimum completion time ${T} ${unit}.`;
  } else if (kind === "cpaCascade") {
    const cs = opts.cascade ?? { start: "early", layout: "sequence", style: "blocks" };
    data.extra = { cascade: cascadeData(acts, times, cs.start, cs.layout, cs.style) };
    const hasFloat = acts.filter((a) => times.float[a.id] > 0);
    prompt = `The activity network represents ${subject}. The times are in ${unit}. Draw a cascade (Gantt) chart for the project, with every activity starting as ${cs.start === "early" ? "early" : "late"} as possible. Show the float of each activity that has some.`;
    answerText = `Critical activities ${list(critical)}, end to end from 0 to ${T}. Floats: ${hasFloat.map((a) => `${a.id} ${times.float[a.id]}`).join(", ")}.`;
  } else if (kind === "cpaUnknown") {
    const path = criticalPaths[0];
    const onPath = path.slice(1, -1);
    const k = onPath[randInt(0, onPath.length - 1)];
    const x = acts.find((a) => a.id === k)!.duration;
    data.extra = { unknown: { id: k, x, path, sumOthers: T - x } };
    prompt = `The activity network represents ${subject}. The times are in ${unit}. Activity ${k} takes x ${unit}. The critical path is ${path.join(" – ")} and the minimum completion time is ${T} ${unit}. Find the value of x.`;
    answerText = `x = ${x}`;
  } else if (kind === "cpaChange") {
    const floaty = acts.filter((a) => times.float[a.id] > 0);
    const shortenable = acts.filter((a) => times.float[a.id] === 0 && a.duration >= 2);
    const wantShorten = level >= 2 && shortenable.length > 0;
    let id: string, mode: "less" | "equal" | "more" | "shorten", amount: number, fl: number;
    if (wantShorten) {
      const a = shortenable[randInt(0, shortenable.length - 1)];
      id = a.id; mode = "shorten"; fl = 0; amount = randInt(1, Math.min(a.duration - 1, Math.max(1, Math.round(a.duration * 0.6))));
    } else {
      const a = floaty[randInt(0, floaty.length - 1)];
      fl = times.float[a.id]; id = a.id;
      const modes: ("less" | "equal" | "more")[] = fl >= 2 ? ["less", "equal", "more"] : ["equal", "more"];
      mode = modes[randInt(0, modes.length - 1)];
      amount = mode === "less" ? randInt(1, fl - 1) : mode === "equal" ? fl : fl + randInt(1, Math.max(1, Math.min(4, range[1])));
    }
    const newActs = acts.map((a) => (a.id === id ? { ...a, duration: a.duration + (mode === "shorten" ? -amount : amount) } : a));
    const newTimes = cpaTimes(newActs);
    data.extra = { change: { id, mode, amount, float: fl, newActs, newTimes, newCriticalPaths: referenceCpa(newActs).criticalPaths } };
    const nT = newTimes.projectTime;
    if (mode === "shorten") {
      prompt = `The activity network shows the earliest start time, latest finish time and float of every activity of ${subject}. The times are in ${unit}. Activity ${id} is made quicker and takes ${amount} ${unit} less. Find the new minimum completion time and say how much time is saved.`;
      answerText = `New minimum completion time ${nT} ${unit}; ${T - nT} ${unit} saved${T - nT < amount ? ` (not all ${amount}, because another path becomes critical)` : ""}.`;
    } else {
      prompt = `The activity network shows the earliest start time, latest finish time and float of every activity of ${subject}. The times are in ${unit}. Activity ${id} is delayed and takes ${amount} ${unit} longer than planned. State the effect on the minimum completion time.`;
      answerText = mode === "more" ? `It increases by ${amount - fl} ${unit}, to ${nT} ${unit}.` : mode === "equal" ? `No effect: the delay equals the float, so the time stays ${T} ${unit}, but ${id} is now critical.` : `No effect: the delay is less than the float, so the time stays ${T} ${unit}.`;
    }
  } else if (kind === "cpaContext") {
    const what = pickOne(CLOCK_CONTEXTS);
    const startMins = 7 * 60 + 15 * randInt(0, 12);
    const floaty = acts.filter((a) => times.float[a.id] > 0);
    const target = floaty[randInt(0, floaty.length - 1)];
    data.unit = "minutes";
    data.extra = { clock: { startMins, latestId: target.id } };
    prompt = `The activity network represents the project of ${what}. The times are in minutes and work starts at ${clockTime(startMins)}. Work out the earliest time the project can be finished. Find the latest time activity ${target.id} can start without delaying that finish.`;
    answerText = `Finish at ${clockTime(startMins + T)}. Activity ${target.id} can start as late as ${clockTime(startMins + times.lf[target.id] - target.duration)}.`;
  } else {
    prompt = `The activity network shows the earliest start time and latest finish time of every activity of ${subject}. The times are in ${unit}. Find the float of every activity and state the critical activities.`;
    answerText = `Floats: ${acts.map((a) => `${a.id} ${times.float[a.id]}`).join(", ")}. Critical activities ${list(critical)}.`;
  }
  return { data, prompt, answerText };
}

export { list as cpaList };
