// The Simplex Algorithm: the stepped working of a question (the Solution), with no React. See lpSimplexGen.ts for the data and lpSimplex.ts for the engine.
// Each step carries the blocks the picture shows at that step (types.ts, SxViewState): rows of words and lines, and tableaux. The last `fresh` blocks are the new
// ones (blue). Every number is an exact fraction. Layout A (Cambridge) writes "NPR = R3 ÷ 2" beside the new tableau; layout B (Oxford) adds a Basic variable
// column and numbers every row it writes (R5 = R1 + 8 × R6).
import type { DecisionProblem, LpRow, SolveStep, SxBlock, SxTabView } from "./types";
import { type Fr, fr, fadd, fneg } from "./dim";
import { type Run, type Tab, type Iter, pivotColumn, readTab, runSpec, valueCol } from "./lpSimplex";
import { type SxData, termsTex, varNames } from "./lpSimplexGen";
import { wholeAnalysis } from "./lpSimplexWhole";
import { list, cap } from "./lpGen";

const frTex = (f: Fr): string => (f[1] === 1 ? String(f[0]) : `${f[0] < 0 ? "-" : ""}\\frac{${Math.abs(f[0])}}{${f[1]}}`);
const mt = (f: Fr): string => `$${frTex(f)}$`;
const absTex = (f: Fr): string => frTex(fr(Math.abs(f[0]), f[1]));
const decTex = (f: Fr): string => (f[1] === 1 ? String(f[0]) : String(Math.round((f[0] / f[1]) * 10000) / 10000));
const sub = (i: number): string => `s_${i + 1}`;
const OPTEX = { "≤": "\\le", "≥": "\\ge", "=": "=" } as const;

const W = (t: string): LpRow => ({ k: "words", t });
const T = (t: string): LpRow => ({ k: "tex", t });
const N = (t: string): LpRow => ({ k: "note", t });
const H = (t: string): LpRow => ({ k: "head", t });
const R = (t: string): LpRow => ({ k: "result", t });
const rowsOf = (...r: LpRow[]): SxBlock => ({ k: "rows", rows: r });

/** the names of the columns: the variables (a variable that had a lower bound taken out becomes a capital; the others keep their names), then the slacks */
function nameLists(d: SxData, m: number): { vars: string[]; cols: string[] } {
  const vars = varNames(d.spec.c.length).map((v, j) => ((d.spec.lower?.[j] ?? 0) > 0 ? v.toUpperCase() : v));
  return { vars, cols: [...vars, ...Array.from({ length: m }, (_, i) => sub(i))] };
}
/** the row numbers of every tableau (layout B): the first tableau is R1 (the objective row) to R(m+1); each pivot writes new rows, numbered on from there */
function rowIds(run: Run): number[][] {
  const m = run.final.m;
  let next = m + 2;
  const ids = [Array.from({ length: m + 1 }, (_, i) => i + 1)];
  for (const it of run.iters) {
    const nw = [...ids[ids.length - 1]];
    nw[it.row] = next++;
    for (const op of it.ops) nw[op.row] = next++;
    ids.push(nw);
  }
  return ids;
}
const Rn = (n: number): string => `\\mathrm{R}${n}`;
/** the row operations that turn tableau k into tableau k + 1, one per row of the new tableau ("" for a row that does not change) */
function opsOf(run: Run, k: number, layout: "A" | "B", ids: number[][]): string[] {
  const it = run.iters[k];
  const out = Array.from({ length: it.to.rows.length }, () => "");
  const pn = layout === "A" ? "\\mathrm{NPR}" : Rn(ids[k + 1][it.row]);
  const nm = (i: number, which: "old" | "new"): string => (layout === "A" ? Rn(i + 1) : Rn(ids[which === "old" ? k : k + 1][i]));
  out[it.row] = `${layout === "A" ? "\\mathrm{NPR}" : nm(it.row, "new")} = ${nm(it.row, "old")}${it.pivot[0] === 1 && it.pivot[1] === 1 ? "" : ` \\div ${frTex(it.pivot)}`}`;
  for (const op of it.ops) {
    const f = op.factor;
    const mult = f[0] === 1 && f[1] === 1 || f[0] === -1 && f[1] === 1 ? "" : `${absTex(f)} \\times `;
    out[op.row] = `${layout === "A" ? "" : `${nm(op.row, "new")} = `}${nm(op.row, "old")} ${f[0] > 0 ? "-" : "+"} ${mult}${pn}`;
  }
  return out;
}

interface TabOpts { ops?: string[]; opsHead?: string; pivot?: [number, number]; hi?: number }
/** a tableau as a block */
function tabBlock(run: Run, k: number, d: SxData, ids: number[][], o: TabOpts = {}): SxTabView {
  const t = run.tabs[k];
  const { cols } = nameLists(d, t.ns);
  const B = d.layout === "B";
  const view: SxTabView = { k: "tab", head: ["P", ...cols, B ? "\\text{Value}" : ""], rows: t.rows.map((r) => r.map(frTex)), ...o };
  if (B) {
    view.labelHead = "Basic variable";
    view.label = t.rows.map((_, i) => {
      if (i === 0) return "P";
      const j = t.basis[i - 1] - 1;
      return j < 0 ? "" : cols[j];
    });
    if (!view.ops) { view.ops = ids[k].map((n) => Rn(n)); view.opsHead = "Row"; }
  }
  return view;
}

// ── The shared first part: from the problem to the initial tableau ───────────
const objRow = (c: readonly Fr[], vars: readonly string[]): string => {
  let s = "P";
  c.forEach((v, j) => { if (v[0] !== 0) s += ` ${v[0] > 0 ? "-" : "+"} ${Math.abs(v[0]) === 1 ? "" : Math.abs(v[0])}${vars[j]}`; });
  return `${s} = 0`;
};
const stdLines = (run: Run, vars: readonly string[]): string[] => run.st.A.map((a, i) => `${termsTex(a.map((v) => v[0]), vars)} ${run.st.rows[i].eq ? "=" : "\\le"} ${run.st.b[i][0]}`);
/** each constraint as an equation: a slack variable in every row that is not an equation (numbered in the order of those rows) */
const eqLines = (run: Run, vars: readonly string[]): string[] => {
  let k = 0;
  return run.st.A.map((a, i) => (run.st.rows[i].eq ? `${termsTex(a.map((v) => v[0]), vars)} = ${run.st.b[i][0]}` : `${termsTex(a.map((v) => v[0]), vars)} + ${sub(k++)} = ${run.st.b[i][0]}`));
};

interface Part { caption: string; rows: LpRow[] }
/** the steps that turn the question's wording or its form into the standard problem: maximise, every constraint a ≤ with a non-negative variable */
function formulate(d: SxData, run: Run): Part[] {
  const sp = d.spec, n = sp.c.length;
  const orig = varNames(n);
  const parts: Part[] = [];
  const { vars } = nameLists(d, run.final.ns);
  if (d.story) {
    const s = d.story;
    parts.push({
      caption: "Say what each letter stands for, then write the objective and each limit in them.",
      rows: [H("Variables"), ...s.items.slice(0, n).map((it, j) => W(`$${orig[j]}$ is the number of ${it.plural}`)),
        T(`\\text{Maximise } P = ${termsTex(sp.c, orig)}`),
        ...sp.cons.flatMap((k, i): LpRow[] => {
          const r = s.res[i];
          const a = k.a.map((v) => fr(v * r.scale[0], r.scale[1]));
          const line = a.map((v, j) => (v[0] === 0 ? "" : `${j && a.slice(0, j).some((w) => w[0] !== 0) ? "+ " : ""}${v[0] === 1 && v[1] === 1 ? "" : decTex(v)}${orig[j]}`)).filter(Boolean).join(" ");
          return [N(`${r.label}`), T(`${line} \\le ${decTex(fr(k.b * r.scale[0], r.scale[1]))}`)];
        })],
    });
    if (s.res.some((r) => r.scale[0] !== 1 || r.scale[1] !== 1)) {
      parts.push({ caption: "Simplify each constraint, by multiplying or dividing so the coefficients are whole numbers in lowest terms.", rows: [H("Simplified"), ...sp.cons.map((k) => T(`${termsTex(k.a, orig)} \\le ${k.b}`))] });
    }
    return parts;
  }
  if (sp.sense === "min") parts.push({ caption: "The simplex algorithm maximises. Minimising $C$ is the same as maximising $P = -C$.", rows: [T(`P = -C = ${termsTex(sp.c.map((v) => -v), orig)}`)] });
  if (sp.eqAsRow && sp.cons.some((k) => k.op === "=")) {
    parts.push({ caption: "An equation does not need a slack variable: it goes into the tableau as a row of its own, as it is.", rows: sp.cons.filter((k) => k.op === "=").map((k) => T(`${termsTex(k.a, orig)} = ${k.b}`)) });
  } else if (sp.cons.some((k) => k.op === "=")) {
    parts.push({ caption: "An equality is both a ≤ and a ≥ constraint, so write it as two inequalities.", rows: sp.cons.filter((k) => k.op === "=").flatMap((k) => [T(`${termsTex(k.a, orig)} \\le ${k.b}`), T(`${termsTex(k.a, orig)} \\ge ${k.b}`)]) });
  }
  if (sp.lowerAsRow && sp.lower?.some((v) => v > 0)) {
    const lo = sp.lower;
    parts.push({
      caption: "A variable that must be at least a number is one more constraint. Write it with everything on one side, so that it is a ≤ constraint with a negative right-hand side.",
      rows: orig.flatMap((v, j) => (lo[j] > 0 ? [T(`${v} \\ge ${lo[j]}`), T(`${lo[j]} - ${v} \\le 0`), T(`-${v} \\le -${lo[j]}`)] : [])),
    });
  } else if (sp.lower?.some((v) => v > 0)) {
    const lo = sp.lower!;
    parts.push({
      caption: "A variable that must be at least a number: take that number away, so the new variable is at least 0.",
      rows: [
        ...orig.flatMap((v, j) => (lo[j] > 0 ? [W(`Let $${vars[j]} = ${v} - ${lo[j]}$, so $${v} = ${vars[j]} + ${lo[j]}$ and $${vars[j]} \\ge 0$`)] : [])),
        ...sp.cons.map((k, i) => T(`${termsTex(k.a, vars)} ${OPTEX[k.op]} ${run.st.shifted[i]}`)),
        ...(run.st.konst !== 0 ? [N(`The objective becomes ${sp.sense === "max" ? "" : "−"}(${termsTex(sp.sense === "max" ? sp.c : sp.c, vars)}) with a constant of ${Math.abs(run.st.konst)}, which is added back at the end.`)] : []),
      ],
    });
  }
  if (sp.cons.some((k) => k.op === "≥" || (k.op === "=" && !sp.eqAsRow))) {
    const ge = run.st.rows.map((r, i) => ({ r, i })).filter((x) => x.r.flip && x.r.con < sp.cons.length);
    parts.push({ caption: "Multiply each ≥ constraint by −1 to make it ≤. A right-hand side can now be negative.", rows: ge.map((x) => T(`${termsTex(run.st.A[x.i].map((v) => v[0]), vars)} \\le ${run.st.b[x.i][0]}`)) });
  }
  return parts;
}

/** the steps up to and including the initial tableau */
function setupSteps(d: SxData, run: Run, ids: number[][], push: (caption: string, show: SxBlock[], fresh: number) => void): void {
  const { vars } = nameLists(d, run.final.ns);
  const m = run.final.ns;
  const parts = formulate(d, run);
  const std = stdLines(run, vars);
  parts.forEach((p) => push(p.caption, [rowsOf(...p.rows)], 1));
  const nonStd = d.startForm !== "standard";
  const slacks = Array.from({ length: m }, (_, i) => sub(i)).join(", ");
  const eqRows: LpRow[] = [H("Constraints as equations"), ...eqLines(run, vars).map((l) => T(l)), N(`$${slacks} \\ge 0$`)];
  if (d.story) eqRows.push(...d.story.res.slice(0, m).map((r, i) => N(`${`$${sub(i)}$`} is the unused ${r.of} (${r.unit})`)));
  push(`Write each ≤ constraint as an equation by adding a slack variable: $${slacks}$ take up whatever is left over.${run.st.rows.some((r) => r.eq) ? " The equation has no slack variable: it stays as it is." : ""}${nonStd && std.length ? "" : ""}`, [rowsOf(...eqRows)], 1);
  push("Write the objective with every variable on the left and 0 on the right.", [rowsOf(H("Objective"), T(objRow(run.st.c, vars)))], 1);
  push("Write the equations as a tableau: the objective row first, then a row for each constraint.", [tabBlock(run, 0, d, ids)], 1);
}

// ── One iteration ────────────────────────────────────────────────────────────
function iterationSteps(d: SxData, run: Run, k: number, ids: number[][], push: (caption: string, show: SxBlock[], fresh: number) => void, last: boolean, given = false): void {
  const it: Iter = run.iters[k];
  const t = run.tabs[k];
  const { cols } = nameLists(d, t.ns);
  const vc = valueCol(t);
  if (it.eqStart && !given) {
    const ops = t.rows.map((_, i) => { const x = it.thetas.find((y) => y.row === i); return x ? `${frTex(t.rows[i][vc])} \\div ${frTex(t.rows[i][it.col])} = ${frTex(x.value)}` : ""; });
    push(`Row ${it.row + 1} is an equation, so it has no slack variable and no variable is basic in it yet. Choose a pivot in that row, in a column where that row has the smallest θ, so that every right-hand side stays positive.`, [tabBlock(run, k, d, ids, { hi: it.col, pivot: [it.row, it.col], ops, opsHead: "\\theta" })], 1);
  } else if (given) {
    push(`The pivot is given: ${mt(it.pivot)}, in the $${cols[it.col - 1]}$ column and row ${it.row + 1}. Divide the pivot row by the pivot first.`, [tabBlock(run, k, d, ids, { pivot: [it.row, it.col] })], 1);
  } else if (it.start) {
    const neg = t.rows.slice(1).findIndex((r) => r[vc][0] < 0) + 1;
    push(`A right-hand side is negative (${mt(t.rows[neg][vc])}), so the origin is not a feasible start. In that row choose a negative entry that makes every right-hand side positive.`, [tabBlock(run, k, d, ids, { pivot: [it.row, it.col] })], 1);
  } else {
    const col = it.col;
    const tiedCols = cols.filter((_, c) => c + 1 !== col && t.rows[0][c + 1][0] * t.rows[0][col][1] === t.rows[0][col][0] * t.rows[0][c + 1][1]);
    push(`The most negative entry in the objective row is ${mt(t.rows[0][col])}, in the $${cols[col - 1]}$ column. That is the pivot column.${tiedCols.length ? ` The ${list(tiedCols.map((c) => `$${c}$`))} column${tiedCols.length > 1 ? "s have" : " has"} the same entry: either choice leads to the same optimum. We take the first.` : ""}`, [tabBlock(run, k, d, ids, { hi: col })], 1);
    const th = it.thetas.map((x) => x.row);
    const ops = t.rows.map((_, i) => { const x = it.thetas.find((y) => y.row === i); return x ? `${frTex(t.rows[i][vc])} \\div ${frTex(t.rows[i][col])} = ${frTex(x.value)}` : ""; });
    void th;
    const best = it.thetas.find((x) => x.row === it.row)!.value;
    const tiedRows = it.thetas.filter((x) => x.row !== it.row && x.value[0] * best[1] === best[0] * x.value[1]).map((x) => x.row + 1);
    const tieNote = `${tiedRows.length ? ` Row${tiedRows.length > 1 ? "s" : ""} ${list(tiedRows.map(String))} give${tiedRows.length > 1 ? "" : "s"} the same θ: the tie means a basic variable will be 0 next, and either row can be chosen. We take the first.` : ""}${best[0] === 0 ? " θ = 0 is allowed: the pivot row has a right-hand side of 0, so P does not increase on this iteration." : ""}`;
    push(`Divide each right-hand side by the positive entry in the pivot column. The smallest θ is ${mt(best)}, so row ${it.row + 1} is the pivot row and ${mt(it.pivot)} is the pivot.${tieNote}`, [tabBlock(run, k, d, ids, { hi: col, pivot: [it.row, col], ops, opsHead: "\\theta" })], 1);
  }
  const ops = opsOf(run, k, d.layout, ids);
  const nm = d.layout === "A" ? "NPR (the new pivot row)" : `R${ids[k + 1][it.row]}`;
  push(`Divide the pivot row by the pivot to get ${nm}, then take a multiple of it off every other row so the pivot column is 0 apart from a 1 in the pivot row.`, [tabBlock(run, k + 1, d, ids, { ops, opsHead: d.layout === "A" ? "Row operations" : "Working" })], 1);
  const to = run.tabs[k + 1];
  const pc = pivotColumn(to);
  if (last || it.start) {
    push(it.start || pc ? (it.start ? "Every right-hand side is now positive, so this is a feasible start." : "There is still a negative entry in the objective row, so the solution is not optimal: pivot again.") : "There is no negative entry in the objective row, so this solution is optimal.", [tabBlock(run, k + 1, d, ids)], 0);
  }
}

// ── Reading a tableau ────────────────────────────────────────────────────────
function readRows(d: SxData, run: Run, t: Tab): { values: LpRow[]; tab: Reading } {
  const r = readTab(t);
  const { cols } = nameLists(d, t.ns);
  const basic = r.basic.map((j) => cols[j - 1]);
  const non = cols.filter((_, i) => !r.basic.includes(i + 1));
  const rows: LpRow[] = [
    W(`Basic variables (unit columns): $${basic.join(", ")}$, read from the value column.`),
    W(`Non-basic variables: $${non.join(", ")}$, each $= 0$.`),
    ...cols.map((c, i) => T(`${c} = ${frTex(r.values[i])}`)),
    T(`P = ${frTex(r.p)}`),
  ];
  void run;
  return { values: rows, tab: r };
}
type Reading = ReturnType<typeof readTab>;

/** the true objective value from the tableau's P: the constant is added back, and C = −P when minimising */
function trueObjective(d: SxData, run: Run, p: Fr): Fr {
  const v = fadd(p, fr(run.st.konst));
  return d.spec.sense === "max" ? v : fneg(v);
}
/** the answer to the question, from the optimal tableau: in the question's own letters and, for a story, its own words */
function conclusion(d: SxData, run: Run): LpRow[] {
  const r = readTab(run.final);
  const sp = d.spec;
  const orig = varNames(sp.c.length);
  const lo = sp.lower ?? orig.map(() => 0);
  const out: LpRow[] = [];
  const x = orig.map((_, j) => fadd(r.values[j], fr(lo[j])));
  const obj = trueObjective(d, run, r.p);
  if (sp.lower?.some((v) => v > 0)) out.push(W(`Back to the original variables: ${orig.map((v, j) => (lo[j] > 0 ? `$${v} = ${v.toUpperCase()} + ${lo[j]} = ${frTex(x[j])}$` : `$${v} = ${frTex(x[j])}$`)).join(", ")}.`));
  if (sp.sense === "min") out.push(W(`$C = -P$${run.st.konst !== 0 ? " with the constant added back" : ""}: $C = ${frTex(obj)}$.`));
  else if (run.st.konst !== 0) out.push(W(`Add back the constant: $P = ${frTex(r.p)} + ${run.st.konst} = ${frTex(obj)}$.`));
  if (d.story) {
    const s = d.story;
    out.push(R(`${orig.map((_, j) => `${frTex(x[j])}\\text{ ${s.items[j].plural}}`).join(",\\ ")};\\ P = £${frTex(obj)}`));
    out.push(W(`So make ${orig.map((_, j) => `${frTex(x[j]).replace(/\\frac\{(\d+)\}\{(\d+)\}/, "$1/$2")} ${s.items[j].plural}`).join(" and ")}, for a maximum profit of £${decTex(obj)}.`));
    r.values.slice(sp.c.length).forEach((v, i) => out.push(N(v[0] === 0 ? `$${sub(i)} = 0$: all the ${s.res[i].of} is used.` : `$${sub(i)} = ${frTex(v)}$: ${decTex(v)} ${s.res[i].unit} of ${s.res[i].of} is left over.`)));
  } else {
    out.push(R(`${orig.map((v, j) => `${v} = ${frTex(x[j])}`).join(",\\ ")},\\ ${sp.sense === "max" ? "P" : "C"} = ${frTex(obj)}`));
    r.values.slice(sp.c.length).forEach((v, i) => out.push(N(v[0] === 0 ? `$${sub(i)} = 0$: that constraint is at its limit.` : `$${sub(i)} = ${frTex(v)}$: that constraint has ${frTex(v)} to spare.`)));
  }
  return out;
}

// ── Is it practical? ─────────────────────────────────────────────────────────
/** the steps after the optimum is known: why it is not practical, the bound, the whole-number points around it, and the best of them */
function wholeSteps(d: SxData, run: Run, push: (caption: string, show: SxBlock[], fresh: number) => void): void {
  const w = wholeAnalysis(d.spec, run);
  const sp = d.spec, n = sp.c.length;
  const orig = varNames(n);
  const s = d.story;
  const what = s ? `Only whole numbers of ${list(s.items.slice(0, n).map((it) => it.plural))} can be made` : `${list(orig.map((v) => `$${v}$`))} must be whole numbers`;
  if (!w.frac.length) {
    push(`${what}. Every variable in the optimal solution is a whole number, so the solution is practical.`, [rowsOf(H("Is it practical?"), ...orig.map((v, j) => T(`${v} = ${frTex(w.x[j])}`)), R("\\text{Practical}"))], 1);
    return;
  }
  const bad = w.frac.map((j) => `$${orig[j]} = ${frTex(w.x[j])}$`);
  push(`${what}, but the optimum has ${bad.length > 1 ? "fractions" : "a fraction"} in it (${list(bad)}). So it is not a practical solution.`, [rowsOf(H("Is it practical?"), ...w.frac.map((j) => T(`${orig[j]} = ${frTex(w.x[j])}`)), W("Not a whole number: not practical."))], 1);
  push("A practical plan is also a plan for the linear programme, so its value cannot be more than the optimum. With whole-number coefficients the value of a practical plan is a whole number, so it is at most the whole number just below the optimum.", [rowsOf(H("An upper bound"), T(`P \\le ${frTex(w.p)}`), T(`P \\le ${w.bound}`))], 1);
  const notes: LpRow[] = [];
  if (!w.nearest.ok) notes.push(N(`Rounding to the nearest whole number gives (${w.nearest.pt.join(", ")}), which breaks a constraint, so rounding to the nearest is not safe: every candidate must be tested.`));
  const b = w.best;
  let text: string;
  if (w.frac.length >= 3) {
    // three or more fractional variables: not every combination, but the room left once everything is rounded down, and which sets of additions reach the bound
    const dn = w.down;
    const room = sp.cons.map((k, i) => k.b - dn.lhs[i]);
    const roomTab: SxBlock = { k: "tab", head: ["\\text{Uses}", "\\text{Limit}", "\\text{Room left}"], label: sp.cons.map((k) => termsTex(k.a, orig)), labelHead: "", rows: sp.cons.map((k, i) => [String(dn.lhs[i]), String(k.b), String(room[i])]) };
    push(`Round every variable down to (${dn.pt.join(", ")}). This is always practical, because it uses less than the optimum did. Work out how much room is left in each constraint.`, [roomTab, rowsOf(W(`Rounding down gives $P = ${dn.p}$.`), ...notes)], 2);
    const need = w.bound - dn.p;
    const idx = w.frac;
    const sets: number[][] = [];
    for (let mask = 1; mask < 1 << idx.length; mask++) {
      const set = idx.filter((_, t) => mask & (1 << t));
      if (set.reduce((t, j) => t + sp.c[j], 0) === need) sets.push(set);
    }
    sets.sort((a, c) => a.length - c.length);
    const rows = sets.slice(0, 10).map((set) => [set.map((j) => orig[j]).join(",\\ "), String(need), ...sp.cons.map((k, i) => { const sum = set.reduce((t, j) => t + k.a[j], 0); return `${sum} \\le ${room[i]}\\ ${sum <= room[i] ? "\\checkmark" : "\\times"}`; })]);
    push(`Adding 1 to a variable raises P by its objective coefficient. To reach the upper bound of ${w.bound}, P must rise by ${need}. Look for sets of variables, adding 1 to each, that raise P by exactly ${need}, and check that each set fits in the room left. A set that raises P by more would beat the bound, so it cannot fit.`, [{ k: "tab", head: ["\\text{Add 1 to}", "\\text{P rises by}", ...room.map((r) => `\\text{room } ${r}`)], rows }], 1);
    const up = idx.filter((j) => b.pt[j] > dn.pt[j]);
    text = `Adding 1 to ${list(up.map((j) => `$${orig[j]}$`))} fits in the room left, giving (${b.pt.join(", ")}) with $P = ${b.p}$. That reaches the upper bound of ${w.bound}, so no practical plan can do better.`;
  } else {
    const heads = sp.cons.map((k) => `${termsTex(k.a, orig)} \\le ${k.b}`);
    const table: SxBlock = { k: "tab", head: [...orig, ...heads, "P"], rows: w.cands.map((c) => [...c.pt.map(String), ...c.lhs.map((l, i) => `${l}\\ ${l <= sp.cons[i].b ? "\\checkmark" : "\\times"}`), String(c.p)]) };
    push("Test the whole-number points either side of the optimum: round each fractional variable down and up. A point is practical only if it satisfies every constraint.", [table, ...(notes.length ? [rowsOf(...notes)] : [])], notes.length ? 2 : 1);
    const feas = w.cands.filter((c) => c.ok).length;
    text = `${feas === 1 ? "Only one of these points is practical" : `${feas} of these points are practical`}, and ${feas === 1 ? "it is" : "the best is"} (${b.pt.join(", ")}) with $P = ${b.p}$. That reaches the upper bound of ${w.bound}, so no practical plan can do better.`;
  }
  const out: LpRow[] = [R(`${orig.map((v, j) => `${v} = ${b.pt[j]}`).join(",\\ ")},\\ P = ${b.p}`)];
  if (s) out.push(W(`So make ${list(orig.map((_, j) => `${b.pt[j]} ${s.items[j].plural}`))}, for a profit of £${b.p}.`));
  if (b.pt.join() !== w.down.pt.join()) out.push(N(`Rounding every value down is practical (P = ${w.down.p}) but it is not the best plan.`));
  push(text, [rowsOf(...out)], 1);
}

// ── The steps of each kind ───────────────────────────────────────────────────
export function solveSimplex(p: DecisionProblem): SolveStep[] {
  const d = p.sx!;
  const run = runSpec(d.spec);
  const ids = rowIds(run);
  const out: SolveStep[] = [];
  const push = (caption: string, show: SxBlock[], fresh: number): void => { out.push({ caption, edgeStates: {}, sxView: { blocks: show, fresh } }); };
  const m = run.final.m;
  const { cols, vars } = nameLists(d, run.final.ns);

  if (d.kind === "setup") {
    setupSteps(d, run, ids, push);
  } else if (d.kind === "reverse") {
    const t = run.tabs[0];
    push(`Read the columns: $P$, $${cols.slice(0, d.spec.c.length).join(", ")}$ are the variables, $${cols.slice(d.spec.c.length).join(", ")}$ are slack variables, and the last column is the right-hand side. So there are ${d.spec.c.length} variables and ${m} constraints.`, [tabBlock(run, 0, d, ids)], 1);
    const rows: LpRow[] = [H("Each row is an equation"), ...t.rows.slice(1).map((r, i) => T(`${termsTex(r.slice(1, 1 + d.spec.c.length).map((v) => v[0]), vars)} + ${sub(i)} = ${frTex(r[vc(t)])}`))];
    push("Each constraint row is an equation with a slack variable in it.", [rowsOf(...rows)], 1);
    push("The slack variables are at least 0, so each equation is an inequality: leave the slack out and replace = with ≤.", [rowsOf(H("Constraints"), ...t.rows.slice(1).map((r) => T(`${termsTex(r.slice(1, 1 + d.spec.c.length).map((v) => v[0]), vars)} \\le ${frTex(r[vc(t)])}`)))], 1);
    push("The objective row says P minus the terms is 0, so P equals the terms with their signs changed.", [rowsOf(H("Objective"), R(`\\text{Maximise } P = ${termsTex(d.spec.c, vars)}`), ...d.spec.cons.map((_, i) => N(`$${sub(i)}$ is the amount of constraint ${i + 1} not used.`)))], 1);
  } else if (d.kind === "practical") {
    if (!d.whole?.given) {
      setupSteps(d, run, ids, push);
      run.iters.forEach((_, k) => iterationSteps(d, run, k, ids, push, k === run.iters.length - 1));
      push("Read the value of every variable from the value column: a variable in a unit column takes the value in its row, every other variable is 0.", [rowsOf(...readRows(d, run, run.final).values)], 1);
    }
    wholeSteps(d, run, push);
  } else if (d.kind === "pivot") {
    const k = d.at;
    if (run.iters[k]) iterationSteps(d, run, k, ids, push, true, !!d.pivotGiven);
  } else if (d.kind === "solve") {
    setupSteps(d, run, ids, push);
    run.iters.forEach((_, k) => iterationSteps(d, run, k, ids, push, k === run.iters.length - 1));
    push("Read the value of every variable from the value column: a variable in a unit column takes the value in its row, every other variable is 0.", [rowsOf(...readRows(d, run, run.final).values)], 1);
    push("Now answer the question in its own terms.", [rowsOf(...conclusion(d, run))], 1);
  } else {
    const k = Math.min(d.at, run.tabs.length - 1);
    const t = run.tabs[k];
    const pc = pivotColumn(t);
    push(pc ? `There is a negative entry in the objective row (${mt(t.rows[0][pc.col])}), so the solution is not optimal: P can still be increased.` : "There is no negative entry in the objective row, so the solution is optimal: P cannot be increased.", [tabBlock(run, k, d, ids, pc ? { hi: pc.col } : {})], 1);
    const rd = readRows(d, run, t);
    push("Read the value of every variable: a variable in a unit column takes the value in its row, every other variable is 0.", [rowsOf(...rd.values)], 1);
    const orig = varNames(d.spec.c.length);
    const meaning: LpRow[] = [];
    rd.tab.values.slice(orig.length).forEach((v, i) => {
      const k2 = d.spec.cons[i];
      meaning.push(T(`${sub(i)} = ${frTex(v)}`));
      if (d.story) meaning.push(N(v[0] === 0 ? `All the ${d.story.res[i].of} is used: the constraint is binding.` : `${decTex(v)} ${d.story.res[i].unit} of ${d.story.res[i].of} is not used.`));
      else meaning.push(N(v[0] === 0 ? `Constraint ${i + 1} ($${termsTex(k2.a, orig)} \\le ${k2.b}$) is at its limit: it is binding.` : `Constraint ${i + 1} has ${frTex(v)} to spare: it is not binding.`));
    });
    push("A slack variable is 0 when its constraint is at its limit (binding), and positive when there is some left over.", [rowsOf(H("What the slack variables say"), ...meaning)], 1);
    if (pc) push(`To continue, the next pivot column is the $${cols[pc.col - 1]}$ column.`, [rowsOf(N(`The most negative entry is ${mt(t.rows[0][pc.col])}.`))], 1);
    else push("State the answer.", [rowsOf(R(`P = ${frTex(rd.tab.p)}`))], 1);
  }
  if (d.whole && (d.kind === "solve" || d.kind === "interpret")) wholeSteps(d, run, push);
  return out;
}
const vc = (t: Tab): number => valueCol(t);

/** a situation's data as a table: what one of each item uses, what is available, and the profit per item */
function storyTable(d: SxData): SxTabView {
  const s = d.story!, sp = d.spec, n = sp.c.length;
  const dec = (v: number, scale: [number, number]): string => String(Math.round(((v * scale[0]) / scale[1]) * 10000) / 10000);
  return {
    k: "tab",
    head: [...s.items.slice(0, n).map((it) => `\\text{${it.plural}}`), "\\text{Available}"],
    labelHead: "",
    label: [...sp.cons.map((_, i) => `\\text{${cap(s.res[i].of)} (${s.res[i].unit})}`), "\\text{Profit per item (£)}"],
    rows: [...sp.cons.map((k, i) => [...k.a.map((v) => dec(v, s.res[i].scale)), dec(k.b, s.res[i].scale)]), [...sp.c.map((v) => String(v * s.profitScale)), ""]],
  };
}

/** the picture of the question before any working: the tableau the question gives (pivot, reverse and interpret) */
export function questionBlocks(p: DecisionProblem): SxBlock[] {
  const d = p.sx;
  if (!d) return [];
  if (d.kind === "setup" || d.kind === "solve" || d.kind === "practical") return d.table && d.story ? [storyTable(d)] : [];
  const run = runSpec(d.spec);
  return [tabBlock(run, d.kind === "reverse" ? 0 : Math.min(d.at, run.tabs.length - 1), d, rowIds(run))];
}
