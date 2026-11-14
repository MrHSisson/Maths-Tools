// Dimensional Analysis: the stepped working for every kind of question (the (?) in the exam view and the Solution of a skill question).
// Two halves, side by side: the picture is the page a student would WRITE, building up a line at a time (DimViewState.lines, cumulative), and the
// caption beside it (prose, maths between $…$) says WHY each line is there. The written working is formal, as an examiner expects: square brackets for
// "the dimensions of", a chain of equals, the dimensions of each factor substituted: [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻².
import type { DecisionProblem, SolveStep, DimViewState } from "./types";
import { type Fr, type Dim3, BASE, fmul, fadd, fsub, fdiv, fzero, feq, fr, ZERO, ONE, solveLinear } from "./dim";
import { symTex, frTex, supTex, dimTex, dimPowTex, productTex, eqLhsTex, M } from "./dimTex";
import type { DimProblemData, DimRow } from "./dimGen";

// ── rows of the written page ────────────────────────────────────────────────────────────────
/** "[F] &= [ma]": the left part, then the aligned equals */
const al = (l: string, r: string): string => `${l} &= ${r}`;
/** "&= [m][a]": a continuation, aligned under the first equals */
const ct = (r: string): string => `&= ${r}`;
/** "M: & α + γ = 0": a labelled equation of powers (the label is right-aligned, the equation starts where the equals of a chain would) */
const lab = (label: string, tex: string): string => `\\text{${label}:} & \\ ${tex}`;
const GAP = "";
/** a boxed final answer on its own row */
const boxed = (tex: string): string => `\\boxed{${tex}}`;
/** rows for pieces [from, to) of a chain "a = b = c = d": the first pair is "a &= b", then one continuation each */
const chainRows = (pieces: string[], from: number, to: number): string[] => {
  const out: string[] = [];
  for (let i = Math.max(1, from); i < to && i < pieces.length; i++) out.push(i === 1 ? al(pieces[0], pieces[1]) : ct(pieces[i]));
  return out;
};

const par = (s: string): string => (s.startsWith("-") ? `(${s})` : s);
/** a row's label in square brackets: a result row already is "[…]" */
const rowBr = (r: DimRow): string => (r.sym.startsWith("[") ? r.sym : `[${r.sym}]`);
/** "$[l] = L$, $[t] = T$" */
const bracketList = (rows: DimRow[]): string => rows.map((r) => M(`${rowBr(r)} = ${dimTex(r.dim)}`)).join(", ");
const answerTex = (dim: Dim3): string => (dim.every(fzero) ? "1" : dimTex(dim));
/** a factor as brackets with its power: "[t]^{2}" */
const brPow = (r: DimRow): string => `${rowBr(r)}${supTex(r.exp ?? ONE)}`;
/** the factor's dimensions with its power: "(LT^{-2})^{2}" */
const dimPow = (r: DimRow): string => dimPowTex(r.dim, r.exp ?? ONE);
/** "M: 1 + (-1) = 0" for the caption: what each factor contributes to the power of one base dimension */
const sumTex = (c: 0 | 1 | 2, rows: DimRow[], total: Fr): string => `${BASE[c]}: ${rows.map((r) => par(frTex(fmul(r.dim[c], r.exp ?? ONE)))).join(" + ")} = ${frTex(total)}`;

/** the formal chain for a "find the dimensions" question, as TeX lines: [F] = [ma] = [m][a] = M \times LT^{-2} = MLT^{-2} */
export function formalLines(d: DimProblemData): string[] {
  const rows = d.rows;
  if (d.kind === "dimsName" || d.kind === "dimsUnits" || d.kind === "dimsExpr") {
    const result = rows[0];
    const factors = rows.slice(1);
    const ans = dimTex(d.answerDim!);
    const root = d.defText === "root";
    const brs = factors.map(brPow).join("");
    const dims = factors.map(dimPow).join(" \\times ");
    if (root) {
      const inner = dimTex(d.answerDim!.map((e) => fmul(e, fr(2))) as unknown as Dim3);
      return [`${result.sym} = \\left(${brs}\\right)^{\\frac{1}{2}} = \\left(${dims}\\right)^{\\frac{1}{2}} = \\left(${inner}\\right)^{\\frac{1}{2}} = ${ans}`];
    }
    if (d.kind === "dimsName") {
      const expr = productTex(factors.map((r) => ({ sym: r.sym, p: r.exp ?? ONE })));
      return [`${result.sym} = [${expr}] = ${brs} = ${dims} = ${ans}`];
    }
    if (d.kind === "dimsUnits") {
      const units = factors.map((r) => `${r.sym}${supTex(r.exp ?? ONE)}`).join("\\,");
      return [`${result.sym} = \\left[${units}\\right] = ${dims} = ${ans}`];
    }
    return [`${result.sym} = ${brs} = ${dims} = ${ans}`];
  }
  if (d.kind === "dimsConst") {
    const k = rows[0], target = rows[1], others = rows.slice(2);
    const denominator = d.defText === "denominator";
    const kr = rowBr(k);
    const brsOthers = others.map(brPow).join("");
    const dimsOthers = others.map(dimPow).join(" \\times ");
    const tdim = dimTex(target.dim);
    const flipped = others.map((r): DimRow => ({ ...r, exp: fmul(r.exp ?? ONE, fr(-1)) }));
    const lines = [`${rowBr(target)} = ${denominator ? `${brsOthers}${kr}^{-1}` : `${kr}${brsOthers}`}`];
    const rhsBr = denominator ? `${brsOthers}${rowBr(target)}^{-1}` : `${rowBr(target)}${flipped.map(brPow).join("")}`;
    const rhsDims = denominator ? `${dimsOthers} \\times (${tdim})^{-1}` : `${tdim} \\times ${flipped.map(dimPow).join(" \\times ")}`;
    lines.push(`${kr} = ${rhsBr} = ${rhsDims} = ${answerTex(d.answerDim!)}`);
    return lines;
  }
  return [];
}

/** what the page shows before any working: the model or formula, and any dimensions the question gives */
export function givenLines(d: DimProblemData): string[] {
  if (d.kind === "powers") {
    const out = [`\\text{Model: } ${d.formula}`];
    if (d.rows[0].given) { out.push(GAP); d.rows.forEach((r) => out.push(al(rowBr(r), dimTex(r.dim)))); }
    return out;
  }
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing") return [`\\text{Formula: } ${d.formula}`];
  return [];
}

export function solveDim(p: DecisionProblem): SolveStep[] {
  const d = p.dim;
  if (!d) throw new Error("no dimension data");
  const rows = d.rows;
  // the page so far: each step adds rows, and its view is a copy of the page with the number of new rows
  const W: string[] = [];
  const S = (caption: string, phase: string, ...add: string[]): SolveStep => {
    W.push(...add);
    const v: DimViewState = { lines: [...W], fresh: add.length };
    return { caption, phase, edgeStates: {}, dimView: v };
  };
  const wrongNote = (): SolveStep[] => {
    const wrong = (d.options ?? []).filter((o) => !o.correct);
    return wrong.length ? [S(`The other options are slips: ${wrong.map((o) => `${M(o.text)} (${o.why})`).join("; ")}.`, "The other options")] : [];
  };

  // ── Find the dimensions ──
  if (d.kind === "dimsName" || d.kind === "dimsUnits" || d.kind === "dimsExpr") {
    const result = rows[0];
    const factors = rows.slice(1);
    const root = d.defText === "root";
    const pieces = formalLines(d)[0].split(" = ");
    const steps: SolveStep[] = [];
    const sums = ([0, 1, 2] as const).map((c) => sumTex(c, factors, root ? fmul(result.dim[c], fr(2)) : result.dim[c]));
    // how many pieces of the chain each step writes
    let shown = 1;
    const write = (to: number): string[] => { const r = chainRows(pieces, shown, to); shown = to; return r; };
    if (d.kind === "dimsName") steps.push(S(`${d.defText}, so ${M(pieces.slice(0, 3).join(" = "))}.`, "Definition", ...write(3)));
    const intro = d.kind === "dimsUnits"
      ? `Replace each unit by the dimension it stands for: ${factors.map((r) => M(`${r.sym} \\to ${dimTex(r.dim)}`)).join(", ")}.`
      : `Write down the dimensions of each quantity: ${bracketList(factors)}.`;
    steps.push(S(intro, "Dimensions of each part", ...write(d.kind === "dimsName" ? 4 : 3)));
    steps.push(S(`${root ? "Find the dimensions of what is under the root: m" : "M"}ultiply the dimensions of the parts, adding the powers of each base dimension (taking them away for a quotient): ${sums.map(M).join(", ")}.`, "Combine", ...write(pieces.length - (root ? 1 : 0))));
    if (root) steps.push(S("The square root halves every power.", "Combine", ...write(pieces.length)));
    steps.push(S(M(`${result.sym} = ${answerTex(d.answerDim!)}`), "Answer", GAP, boxed(`${result.sym} = ${answerTex(d.answerDim!)}`)));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Find the dimensions of a constant ──
  if (d.kind === "dimsConst") {
    const k = rows[0], target = rows[1], others = rows.slice(2);
    const denominator = d.defText === "denominator";
    const lines = formalLines(d);
    const l0 = lines[0].split(" = ");
    const l1 = lines[1].split(" = ");
    const steps: SolveStep[] = [];
    steps.push(S(`Write the formula with brackets for the dimensions: ${M(lines[0])}. The dimensions of what is known: ${bracketList([target, ...others])}.`, "Dimensions of each part", al(l0[0], l0[1])));
    const subject = lines[1].split(" = ").slice(0, 2).join(" = ");
    steps.push(S(denominator
      ? `${M(rowBr(k))} divides the other factors in the formula, so make it the subject: ${M(subject)}. Take the powers of ${M(rowBr(target))} away from those of the other factors.`
      : `Make ${M(rowBr(k))} the subject: ${M(subject)}. Take the powers of the other factors away from those of ${M(rowBr(target))}.`, "Rearrange for the constant", GAP, al(l1[0], l1[1]), ct(l1[2])));
    steps.push(S(M(`${k.sym} = ${answerTex(d.answerDim!)}`), "Answer", ct(l1[3]), GAP, boxed(`${k.sym} = ${answerTex(d.answerDim!)}`)));
    if (d.represents) steps.push(S(`These are the dimensions of ${d.represents}.`, "What it is", `\\text{These are the dimensions of ${d.represents}}`));
    else if (d.answerDim!.every(fzero)) steps.push(S("The constant has no dimensions: it is dimensionless.", "What it is", "\\text{The constant is dimensionless}"));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Consistency ──
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const calcs = d.calcs ?? [];
    const steps: SolveStep[] = [];
    if (d.kind === "consPick") {
      (d.options ?? []).forEach((o, i) => steps.push(S(`${"ABCD"[i]}: ${M(o.text)}. ${d.notes![i][0].toUpperCase()}${d.notes![i].slice(1)}.`, "Check each formula", d.checks![i])));
      steps.push(S(`Only ${"ABCD"[(d.options ?? []).findIndex((o) => o.correct)]} has the same dimensions in every term: ${M(d.formula!)}.`, "Answer", GAP, boxed(d.formula!)));
      return steps;
    }
    rows.forEach((_, i) => {
      const pc = calcs[i].split(" = ");
      steps.push(S(`${M(calcs[i])}.`, "Dimensions of each term", ...(i > 0 ? [GAP] : []), al(pc[0], pc[1]), ...pc.slice(2).map(ct)));
    });
    const chain = rows.map((r) => `[${r.sym}]`).join(" = ");
    if (d.kind === "consShow") {
      const dim = dimTex(d.answerDim!);
      steps.push(S(`Every term has dimensions ${M(dim)}: ${M(`${chain} = ${dim}`)}, so the formula is dimensionally consistent.`, "Conclusion", GAP, `\\therefore\\ ${chain} = ${dim}`, boxed("\\text{the formula is dimensionally consistent}")));
    } else if (d.kind === "consOdd") {
      const odd = d.oddIdx!;
      const other = rows.find((_, i) => i !== odd)!;
      steps.push(S(`${M(`[${rows[odd].sym}] = ${dimTex(rows[odd].dim)}`)} but the others have dimensions ${M(dimTex(other.dim))}: ${M(rows[odd].sym)} is the odd one out.`, "Conclusion", GAP, boxed(`\\text{odd one out: } ${rows[odd].sym}`)));
    } else {
      const m = d.missing!;
      const eqRows = ([0, 1, 2] as const).map((c) => {
        if (fzero(m.coef[c])) return null;
        const rest = m.rest[c];
        const tail = fzero(rest) ? "" : ` ${rest[0] < 0 ? "-" : "+"} ${frTex(fr(Math.abs(rest[0]), rest[1]))}`;
        return lab(BASE[c], `${eqLhsTex([m.coef[c]], ["n"])}${tail} = ${frTex(m.target[c])}`);
      }).filter((x): x is string => !!x);
      steps.push(S(`The other terms have dimensions ${M(dimTex(m.target))}, so the term with ${M("n")} must too. Write its dimensions with ${M("n")} as the power of ${M(symTex(m.sym))}.`, "Equate the dimensions", GAP, ...eqRows));
      steps.push(S(M(`n = ${frTex(m.value)}`), "Answer", GAP, boxed(`n = ${frTex(m.value)}`)));
    }
    return steps;
  }

  // ── Find the powers ──
  const target = rows[0];
  const facs = rows.slice(1);
  const syms = d.unknowns;
  const n = syms.length;
  const steps: SolveStep[] = [];
  const modelDims = `[${target.sym}] = ${facs.map((r, i) => `[${r.sym}]^{${symTex(syms[i])}}`).join("")}`;
  steps.push(S(`Write down the dimensions: ${bracketList([target, ...facs])}.`, "Dimensions of each quantity", ...rows.map((r) => al(rowBr(r), dimTex(r.dim)))));
  steps.push(S(`${M("k")} has no dimensions, so ${M(modelDims)}.`, "Equate the powers", GAP, modelDims));
  // the dimensions substituted, with the powers of each base dimension collected
  const withPower = (r: DimRow, i: number) => {
    const t = dimTex(r.dim);
    const letters = r.dim.filter((e) => !fzero(e)).length;
    const bare = letters === 1 && feq(r.dim.find((e) => !fzero(e))!, ONE);
    return `${bare ? t : `(${t})`}^{${symTex(syms[i])}}`;
  };
  const sub = facs.map(withPower).join("");
  const collected = ([0, 1, 2] as const).map((c) => `${BASE[c]}^{${eqLhsTex(d.eqs[c].coef, syms)}}`).join("");
  steps.push(S(`Substitute the dimensions: ${M(`${dimTex(target.dim)} = ${sub}`)}. Collect the powers of each base dimension: ${M(`= ${collected}`)}.`, "Equate the powers", GAP, al(dimTex(target.dim), sub), ct(collected)));
  d.eqs.forEach((e, c) => steps.push(S(`Powers of ${BASE[c]}: ${M(`${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)}.`, "Equate the powers", ...(c === 0 ? [GAP] : []), lab(BASE[c], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`))));

  if (d.ask === "cannot") {
    // two independent equations fix both powers; the third then disagrees
    for (let r1 = 0; r1 < 3; r1++) for (let r2 = r1 + 1; r2 < 3; r2++) {
      const A = [d.eqs[r1].coef, d.eqs[r2].coef];
      const res = solveLinear(A, [d.eqs[r1].rhs, d.eqs[r2].rhs]);
      if (res.status !== "unique") continue;
      const r3 = 3 - r1 - r2;
      const [a, b] = res.x;
      const lhs = fadd(fmul(d.eqs[r3].coef[0], a), fmul(d.eqs[r3].coef[1], b));
      steps.push(S(`The ${BASE[r1]} and ${BASE[r2]} equations give ${M(`${symTex(syms[0])} = ${frTex(a)}`)} and ${M(`${symTex(syms[1])} = ${frTex(b)}`)}.`, "Solve", GAP, al(symTex(syms[0]), frTex(a)), al(symTex(syms[1]), frTex(b))));
      steps.push(S(`Put these into the ${BASE[r3]} equation: ${M(eqLhsTex(d.eqs[r3].coef, syms))} becomes ${M(frTex(lhs))}, but it should equal ${M(frTex(d.eqs[r3].rhs))}. The equations contradict each other.`, "Contradiction", GAP, lab(BASE[r3], `${frTex(lhs)} \\neq ${frTex(d.eqs[r3].rhs)}`)));
      steps.push(S(`No values of ${M(symTex(syms[0]))} and ${M(symTex(syms[1]))} make the model dimensionally consistent, so the model cannot be right.`, "Answer", GAP, boxed("\\text{no values work: the model cannot be right}")));
      return steps;
    }
    return steps;
  }

  // solve by substitution: an equation with one power left gives it, the next uses it
  const known: Array<Fr | null> = Array(n).fill(null);
  let guard = 0;
  let firstSolve = true;
  while (known.some((v) => v === null) && guard++ < 6) {
    let did = false;
    for (const e of d.eqs) {
      const left = e.coef.map((c, i) => (known[i] === null && !fzero(c) ? i : -1)).filter((i) => i >= 0);
      if (left.length !== 1) continue;
      const i = left[0];
      const used = e.coef.reduce<Fr>((acc, c, k) => (known[k] ? fadd(acc, fmul(c, known[k]!)) : acc), ZERO);
      const remaining = fsub(e.rhs, used);
      const val = fdiv(remaining, e.coef[i]);
      known[i] = val;
      const coefStr = feq(e.coef[i], ONE) ? "" : frTex(e.coef[i]);
      const have = known.map((v, k) => (v && k !== i && !fzero(e.coef[k]) ? `${symTex(syms[k])} = ${frTex(v)}` : null)).filter(Boolean).join(",\\ ");
      steps.push(S(`${have ? `With ${M(have)}, the` : "The"} ${BASE[e.col]} equation leaves only ${M(symTex(syms[i]))}: ${M(`${coefStr}${symTex(syms[i])} = ${frTex(remaining)}`)}, so ${M(`${symTex(syms[i])} = ${frTex(val)}`)}${fzero(val) ? " (this power is zero: that quantity does not appear)" : ""}.`, "Solve", ...(firstSolve ? [GAP] : []), al(symTex(syms[i]), frTex(val))));
      firstSolve = false;
      did = true;
      break;
    }
    if (!did) break;
  }
  if (known.some((v) => v === null)) {
    const res = solveLinear(d.eqs.map((e) => e.coef), d.eqs.map((e) => e.rhs));
    const pending = known.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    if (res.status === "unique") res.x.forEach((v, i) => { if (known[i] === null) known[i] = v; });
    steps.push(S(`Solve the equations together (eliminate one power from a pair of equations, then another): ${M(pending.map((i) => `${symTex(syms[i])} = ${frTex(known[i]!)}`).join(",\\ "))}.`, "Solve", ...(firstSolve ? [GAP] : []), ...pending.map((i) => al(symTex(syms[i]), frTex(known[i]!)))));
  }
  steps.push(S(`Check by putting the powers back: every column adds up to the dimensions of ${M(target.sym)}.`, "Check", GAP, "\\text{check: every column adds up to the dimensions of } " + target.sym + "\\ \\checkmark"));
  const answer = syms.map((s, i) => `${symTex(s)} = ${frTex(known[i]!)}`).join(",\\ ");
  steps.push(S(d.ask === "zero" ? `${M(`${symTex(syms[d.zeroIdx!])} = 0`)}, and ${M(answer)}.` : `${M(answer)}.`, "Answer", GAP, boxed(answer)));
  return steps;
}
