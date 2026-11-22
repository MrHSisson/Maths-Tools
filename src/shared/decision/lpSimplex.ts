// The Simplex Algorithm (Decision Maths DD3, DD4; A-level): the exact engine, with no React. See specs/linear-programming-simplex.md.
// Everything is exact fractions. A tableau has the objective row first and the columns P, the variables, the slack variables, the value (the textbooks' layout);
// the rules are the textbooks': the most negative objective-row entry (the earliest on a tie) is the pivot column, the smallest θ over the positive entries is
// the pivot row (the earliest on a tie), the pivot row is divided by the pivot, then every other row has a multiple of it taken off, until the objective row has no
// negative entry. Minimising is by maximising Q = −C; a ≥ constraint is multiplied by −1 and, when its right-hand side is then negative, the first pivot is a
// negative entry of that row (the second textbook's route to a feasible start); a lower bound is substituted out (X = x − a); an equality is a pair of inequalities.
import { type Fr, fr, fsub, fmul, fdiv, ZERO, ONE } from "./dim";

const cmpFr = (a: Fr, b: Fr): number => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0 ? -1 : d > 0 ? 1 : 0; };

// ── The problem as the question states it ────────────────────────────────────
export interface SxCon { a: number[]; op: "≤" | "≥" | "="; b: number }
export interface SxSpec {
  sense: "max" | "min";
  /** the objective coefficients (of C when minimising) */
  c: number[];
  cons: SxCon[];
  /** lower bounds on the variables (0 where there is none) */
  lower?: number[];
}
/** the problem in the form the simplex needs: maximise Σ c'X subject to A X ≤ b with b ≥ 0 when it can be, X ≥ 0 */
export interface Standard {
  c: Fr[];
  A: Fr[][];
  b: Fr[];
  /** the constant that the shift and the sign add to the objective: P = Σ c'X + konst (max form) */
  konst: number;
  /** each row of A: which constraint of the question it is, and whether it was multiplied by −1 (a ≥ constraint) */
  rows: Array<{ con: number; flip: boolean }>;
  /** the rhs of each question constraint after the shift X = x − lower */
  shifted: number[];
}
export function standardise(s: SxSpec): Standard {
  const n = s.c.length;
  const lower = s.lower ?? Array.from({ length: n }, () => 0);
  const shifted = s.cons.map((k) => k.b - k.a.reduce((t, v, j) => t + v * lower[j], 0));
  const rows: Standard["rows"] = [];
  const A: Fr[][] = [];
  const b: Fr[] = [];
  s.cons.forEach((k, i) => {
    const row = k.a.map((v) => fr(v));
    if (k.op === "≤" || k.op === "=") { A.push(row); b.push(fr(shifted[i])); rows.push({ con: i, flip: false }); }
    if (k.op === "≥" || k.op === "=") { A.push(row.map((v) => fr(-v[0], v[1]))); b.push(fr(-shifted[i])); rows.push({ con: i, flip: true }); }
  });
  const k0 = s.c.reduce((t, v, j) => t + v * lower[j], 0);
  const c = s.sense === "max" ? s.c.map((v) => fr(v)) : s.c.map((v) => fr(-v));
  return { c, A, b, konst: s.sense === "max" ? k0 : -k0, rows, shifted };
}

// ── The tableau ──────────────────────────────────────────────────────────────
export interface Tab {
  n: number;
  m: number;
  rows: Fr[][];
  /** the basic variable of each constraint row (column numbers, 1-based): the slacks to begin with, then the entering column of each pivot */
  basis: number[];
}
/** the number of columns: P, n variables, m slacks, the value */
export const width = (t: Tab): number => t.n + t.m + 2;
export const valueCol = (t: Tab): number => t.n + t.m + 1;
function initialTab(c: readonly Fr[], A: readonly (readonly Fr[])[], b: readonly Fr[]): Tab {
  const n = c.length, m = A.length;
  const row0: Fr[] = [ONE, ...c.map((v) => fr(-v[0], v[1])), ...Array.from({ length: m }, () => ZERO), ZERO];
  const rows = [row0, ...A.map((a, i): Fr[] => [ZERO, ...a, ...Array.from({ length: m }, (_, j) => (i === j ? ONE : ZERO)), b[i]])];
  return { n, m, rows, basis: Array.from({ length: m }, (_, i) => n + i + 1) };
}
export const tabOf = (st: Standard): Tab => initialTab(st.c, st.A, st.b);

/** the pivot column: the most negative entry of the objective row (the earliest on a tie); `tie` says whether another column shares it */
export function pivotColumn(t: Tab): { col: number; tie: boolean } | null {
  let best = -1, tie = false;
  for (let j = 1; j <= t.n + t.m; j++) {
    if (t.rows[0][j][0] >= 0) continue;
    if (best < 0) best = j;
    else { const k = cmpFr(t.rows[0][j], t.rows[0][best]); if (k < 0) { best = j; tie = false; } else if (k === 0) tie = true; }
  }
  return best < 0 ? null : { col: best, tie };
}
export interface Theta { row: number; value: Fr }
/** θ for every row whose entry in the pivot column is positive */
export function thetas(t: Tab, col: number): Theta[] {
  const out: Theta[] = [];
  for (let i = 1; i <= t.m; i++) if (t.rows[i][col][0] > 0) out.push({ row: i, value: fdiv(t.rows[i][valueCol(t)], t.rows[i][col]) });
  return out;
}
/** the pivot row: the smallest θ (the earliest on a tie) */
function pivotRow(t: Tab, col: number): { row: number; tie: boolean } | null {
  const th = thetas(t, col);
  if (!th.length) return null;
  let best = th[0], tie = false;
  for (const x of th.slice(1)) { const k = cmpFr(x.value, best.value); if (k < 0) { best = x; tie = false; } else if (k === 0) tie = true; }
  return { row: best.row, tie };
}

interface RowOp { row: number; /** the row after = row − factor × (the new pivot row) */ factor: Fr }
export interface Iter {
  from: Tab;
  col: number;
  row: number;
  pivot: Fr;
  thetas: Theta[];
  to: Tab;
  ops: RowOp[];
  tie: boolean;
  /** the first pivot of a non-standard start (a negative entry in a row with a negative value), not an iteration of the algorithm proper */
  start?: boolean;
}
export function iterate(t: Tab, row: number, col: number, extra: Partial<Iter> = {}): Iter {
  const p = t.rows[row][col];
  const npr = t.rows[row].map((v) => fdiv(v, p));
  const ops: RowOp[] = [];
  const rows = t.rows.map((r, i) => {
    if (i === row) return npr;
    const f = r[col];
    if (f[0] === 0) return r;
    ops.push({ row: i, factor: f });
    return r.map((v, k) => fsub(v, fmul(f, npr[k])));
  });
  return { from: t, col, row, pivot: p, thetas: thetas(t, col), to: { n: t.n, m: t.m, rows, basis: t.basis.map((b, i) => (i === row - 1 ? col : b)) }, ops, tie: false, ...extra };
}

/** the first pivot when a right-hand side is negative: in the row with the most negative value, a negative entry whose pivot leaves every value non-negative (the first such column) */
function startPivot(t: Tab): { row: number; col: number } | null {
  let r = -1;
  for (let i = 1; i <= t.m; i++) if (t.rows[i][valueCol(t)][0] < 0 && (r < 0 || cmpFr(t.rows[i][valueCol(t)], t.rows[r][valueCol(t)]) < 0)) r = i;
  if (r < 0) return null;
  for (let j = 1; j <= t.n + t.m; j++) {
    if (t.rows[r][j][0] >= 0) continue;
    const it = iterate(t, r, j);
    if (it.to.rows.slice(1).every((row) => row[valueCol(t)][0] >= 0)) return { row: r, col: j };
  }
  return null;
}

export interface Run {
  st: Standard;
  /** every tableau: the initial one, then one after each pivot (a start pivot first, when there is one) */
  tabs: Tab[];
  /** the pivots, in order */
  iters: Iter[];
  /** the pivots of the algorithm proper (without a start pivot) */
  steps: Iter[];
  final: Tab;
  /** any tie in a pivot column or pivot row, anywhere */
  tie: boolean;
}
/** run the algorithm from the problem as stated, in exact fractions; throws if the problem is unbounded, has no feasible start, or does not finish */
export function runSpec(spec: SxSpec): Run {
  const st = standardise(spec);
  let t = tabOf(st);
  const tabs = [t];
  const iters: Iter[] = [];
  let tie = false;
  const sp = startPivot(t);
  if (t.rows.slice(1).some((r) => r[valueCol(t)][0] < 0)) {
    if (!sp) throw new Error("lpSimplex: no feasible first pivot");
    const it = iterate(t, sp.row, sp.col, { start: true });
    iters.push(it); tabs.push(it.to); t = it.to;
  }
  for (let k = 0; k < 40; k++) {
    const pc = pivotColumn(t);
    if (!pc) break;
    const pr = pivotRow(t, pc.col);
    if (!pr) throw new Error("lpSimplex: unbounded");
    if (pc.tie || pr.tie) tie = true;
    const it = iterate(t, pr.row, pc.col, { tie: pc.tie || pr.tie });
    iters.push(it); tabs.push(it.to); t = it.to;
    if (k === 39) throw new Error("lpSimplex: did not finish");
  }
  return { st, tabs, iters, steps: iters.filter((i) => !i.start), final: t, tie };
}

// ── Reading a tableau ────────────────────────────────────────────────────────
/** the number of unit columns (a single 1 in a constraint row, 0 everywhere else, the objective row included): a student reads the basic variables from them, so
 *  a tableau that is shown to be read has exactly m of them */
export function unitColumns(t: Tab): number {
  let k = 0;
  for (let j = 1; j <= t.n + t.m; j++) {
    const ones = t.rows.filter((r, i) => i > 0 && r[j][0] === 1 && r[j][1] === 1).length;
    if (ones === 1 && t.rows.filter((r) => r[j][0] !== 0).length === 1) k++;
  }
  return k;
}
export interface Reading {
  /** the value of each variable then each slack (n + m entries) */
  values: Fr[];
  /** the basic variables (column numbers, 1-based over variables and slacks) */
  basic: number[];
  /** the value of the objective in the tableau (before any constant) */
  p: Fr;
}
export function readTab(t: Tab): Reading {
  const values: Fr[] = [];
  const basic: number[] = [];
  for (let j = 1; j <= t.n + t.m; j++) {
    const r = t.basis.indexOf(j) + 1;
    if (r === 0) values.push(ZERO); else { values.push(t.rows[r][valueCol(t)]); basic.push(j); }
  }
  return { values, basic, p: t.rows[0][valueCol(t)] };
}

// ── What a run looks like to a student (the niceness measures) ───────────────
interface PathStats { maxDen: number; dens: number[]; maxEntry: number; nonWhole: number; iterations: number }
export function pathStats(run: Run): PathStats {
  const dens = new Set<number>();
  let maxEntry = 0, nonWhole = 0;
  for (const t of run.tabs) {
    for (const r of t.rows) r.forEach((v, j) => {
      dens.add(v[1]);
      if (v[1] !== 1) nonWhole++;
      if (j !== valueCol(t)) maxEntry = Math.max(maxEntry, Math.abs(v[0]) / v[1]);
    });
  }
  return { maxDen: Math.max(...dens), dens: [...dens].sort((a, b) => a - b), maxEntry, nonWhole, iterations: run.steps.length };
}
/** the value of the objective for the question: the max-form value plus the constant, negated when minimising */
export function objectiveOf(run: Run, spec: SxSpec): Fr {
  const total = [run.final.rows[0][valueCol(run.final)][0] + run.st.konst * run.final.rows[0][valueCol(run.final)][1], run.final.rows[0][valueCol(run.final)][1]] as Fr;
  return spec.sense === "max" ? fr(total[0], total[1]) : fr(-total[0], total[1]);
}
export { ZERO, ONE };
