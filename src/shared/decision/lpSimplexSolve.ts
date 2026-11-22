// The Simplex Algorithm: the stepped working of a question (the Solution), with no React. See lpSimplexGen.ts for the data and lpSimplex.ts for the engine.
// Each step carries the blocks the picture shows at that step (types.ts, SxViewState): rows of words and lines, and tableaux. The last `fresh` blocks are the new
// ones (blue). Every number is an exact fraction. Layout A (Cambridge) writes "NPR = R3 ÷ 2" beside the new tableau; layout B (Oxford) adds a Basic variable
// column and numbers every row it writes (R5 = R1 + 8 × R6).
import type { DecisionProblem, LpRow, SolveStep, SxBlock, SxTabView } from "./types";
import { type Fr, fr, fadd, fneg } from "./dim";
import { type Run, type Tab, type Iter, basicRowOf, pivotColumn, readTab, runSpec, valueCol } from "./lpSimplex";
import { type SxData, termsTex, varNames } from "./lpSimplexGen";

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

/** the names of the columns: the variables (capitals once a lower bound has been taken out), then the slacks */
function nameLists(d: SxData, m: number): { vars: string[]; cols: string[] } {
  const shifted = !!d.spec.lower?.some((v) => v > 0);
  const vars = varNames(d.spec.c.length).map((v) => (shifted ? v.toUpperCase() : v));
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
  const { cols } = nameLists(d, t.m);
  const B = d.layout === "B";
  const view: SxTabView = { k: "tab", head: ["P", ...cols, B ? "\\text{Value}" : ""], rows: t.rows.map((r) => r.map(frTex)), ...o };
  if (B) {
    view.labelHead = "Basic variable";
    view.label = t.rows.map((_, i) => {
      if (i === 0) return "P";
      const j = cols.findIndex((_n, c) => basicRowOf(t, c + 1) === i);
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
const stdLines = (run: Run, vars: readonly string[]): string[] => run.st.A.map((a, i) => `${termsTex(a.map((v) => v[0]), vars)} \\le ${run.st.b[i][0]}`);
const eqLines = (run: Run, vars: readonly string[]): string[] => run.st.A.map((a, i) => `${termsTex(a.map((v) => v[0]), vars)} + ${sub(i)} = ${run.st.b[i][0]}`);

interface Part { caption: string; rows: LpRow[] }
/** the steps that turn the question's wording or its form into the standard problem: maximise, every constraint a ≤ with a non-negative variable */
function formulate(d: SxData, run: Run): Part[] {
  const sp = d.spec, n = sp.c.length;
  const orig = varNames(n);
  const parts: Part[] = [];
  const m = run.final.m;
  const { vars } = nameLists(d, m);
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
  if (sp.cons.some((k) => k.op === "=")) {
    parts.push({ caption: "An equality is both a ≤ and a ≥ constraint, so write it as two inequalities.", rows: sp.cons.filter((k) => k.op === "=").flatMap((k) => [T(`${termsTex(k.a, orig)} \\le ${k.b}`), T(`${termsTex(k.a, orig)} \\ge ${k.b}`)]) });
  }
  if (sp.lower?.some((v) => v > 0)) {
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
  if (sp.cons.some((k) => k.op !== "≤")) {
    const ge = run.st.rows.map((r, i) => ({ r, i })).filter((x) => x.r.flip);
    parts.push({ caption: "Multiply each ≥ constraint by −1 to make it ≤. A right-hand side can now be negative.", rows: ge.map((x) => T(`${termsTex(run.st.A[x.i].map((v) => v[0]), vars)} \\le ${run.st.b[x.i][0]}`)) });
  }
  return parts;
}

/** the steps up to and including the initial tableau */
function setupSteps(d: SxData, run: Run, ids: number[][], push: (caption: string, show: SxBlock[], fresh: number) => void): void {
  const { vars } = nameLists(d, run.final.m);
  const m = run.final.m;
  const parts = formulate(d, run);
  const std = stdLines(run, vars);
  parts.forEach((p) => push(p.caption, [rowsOf(...p.rows)], 1));
  const nonStd = d.startForm !== "standard";
  const slacks = Array.from({ length: m }, (_, i) => sub(i)).join(", ");
  const eqRows: LpRow[] = [H("Constraints as equations"), ...eqLines(run, vars).map((l) => T(l)), N(`${slacks} ≥ 0`)];
  if (d.story) eqRows.push(...d.story.res.slice(0, m).map((r, i) => N(`${`$${sub(i)}$`} is the unused ${r.of} (${r.unit})`)));
  push(`Write each ≤ constraint as an equation by adding a slack variable: ${slacks} take up whatever is left over.${nonStd && std.length ? "" : ""}`, [rowsOf(...eqRows)], 1);
  push("Write the objective with every variable on the left and 0 on the right.", [rowsOf(H("Objective"), T(objRow(run.st.c, vars)))], 1);
  push("Write the equations as a tableau: the objective row first, then a row for each constraint.", [tabBlock(run, 0, d, ids)], 1);
}

// ── One iteration ────────────────────────────────────────────────────────────
function iterationSteps(d: SxData, run: Run, k: number, ids: number[][], push: (caption: string, show: SxBlock[], fresh: number) => void, last: boolean): void {
  const it: Iter = run.iters[k];
  const t = run.tabs[k];
  const { cols } = nameLists(d, t.m);
  const vc = valueCol(t);
  if (it.start) {
    const neg = t.rows.slice(1).findIndex((r) => r[vc][0] < 0) + 1;
    push(`A right-hand side is negative (${mt(t.rows[neg][vc])}), so the origin is not a feasible start. In that row choose a negative entry that makes every right-hand side positive.`, [tabBlock(run, k, d, ids, { pivot: [it.row, it.col] })], 1);
  } else {
    const col = it.col;
    push(`The most negative entry in the objective row is ${mt(t.rows[0][col])}, in the ${cols[col - 1]} column. That is the pivot column.`, [tabBlock(run, k, d, ids, { hi: col })], 1);
    const th = it.thetas.map((x) => x.row);
    const ops = t.rows.map((_, i) => { const x = it.thetas.find((y) => y.row === i); return x ? `${frTex(t.rows[i][vc])} \\div ${frTex(t.rows[i][col])} = ${frTex(x.value)}` : ""; });
    void th;
    push(`Divide each right-hand side by the positive entry in the pivot column. The smallest θ is ${mt(it.thetas.find((x) => x.row === it.row)!.value)}, so row ${it.row + 1} is the pivot row and ${mt(it.pivot)} is the pivot.`, [tabBlock(run, k, d, ids, { hi: col, pivot: [it.row, col], ops, opsHead: "\\theta" })], 1);
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
  const { cols } = nameLists(d, t.m);
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

// ── The steps of each kind ───────────────────────────────────────────────────
export function solveSimplex(p: DecisionProblem): SolveStep[] {
  const d = p.sx!;
  const run = runSpec(d.spec);
  const ids = rowIds(run);
  const out: SolveStep[] = [];
  const push = (caption: string, show: SxBlock[], fresh: number): void => { out.push({ caption, edgeStates: {}, sxView: { blocks: show, fresh } }); };
  const m = run.final.m;
  const { cols, vars } = nameLists(d, m);

  if (d.kind === "setup") {
    setupSteps(d, run, ids, push);
  } else if (d.kind === "reverse") {
    const t = run.tabs[0];
    push(`Read the columns: P, ${cols.slice(0, d.spec.c.length).join(", ")} are the variables, ${cols.slice(d.spec.c.length).join(", ")} are slack variables, and the last column is the right-hand side. So there are ${d.spec.c.length} variables and ${m} constraints.`, [tabBlock(run, 0, d, ids)], 1);
    const rows: LpRow[] = [H("Each row is an equation"), ...t.rows.slice(1).map((r, i) => T(`${termsTex(r.slice(1, 1 + d.spec.c.length).map((v) => v[0]), vars)} + ${sub(i)} = ${frTex(r[vc(t)])}`))];
    push("Each constraint row is an equation with a slack variable in it.", [rowsOf(...rows)], 1);
    push("The slack variables are at least 0, so each equation is an inequality: leave the slack out and replace = with ≤.", [rowsOf(H("Constraints"), ...t.rows.slice(1).map((r) => T(`${termsTex(r.slice(1, 1 + d.spec.c.length).map((v) => v[0]), vars)} \\le ${frTex(r[vc(t)])}`)))], 1);
    push("The objective row says P minus the terms is 0, so P equals the terms with their signs changed.", [rowsOf(H("Objective"), R(`\\text{Maximise } P = ${termsTex(d.spec.c, vars)}`), ...d.spec.cons.map((_, i) => N(`$${sub(i)}$ is the amount of constraint ${i + 1} not used.`)))], 1);
  } else if (d.kind === "pivot") {
    const k = d.at;
    if (run.iters[k]) iterationSteps(d, run, k, ids, push, true);
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
    if (pc) push(`To continue, the next pivot column is the ${cols[pc.col - 1]} column.`, [rowsOf(N(`The most negative entry is ${mt(t.rows[0][pc.col])}.`))], 1);
    else push("State the answer.", [rowsOf(R(`P = ${frTex(rd.tab.p)}`))], 1);
  }
  return out;
}
const vc = (t: Tab): number => valueCol(t);

/** the picture of the question before any working: the tableau the question gives (pivot, reverse and interpret) */
export function questionBlocks(p: DecisionProblem): SxBlock[] {
  const d = p.sx;
  if (!d) return [];
  if (d.kind === "setup" || d.kind === "solve") return [];
  const run = runSpec(d.spec);
  return [tabBlock(run, d.kind === "reverse" ? 0 : Math.min(d.at, run.tabs.length - 1), d, rowIds(run))];
}
