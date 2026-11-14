// Dimensional Analysis: the stepped working for every kind of question (the (?) in the exam view and the Solution of a skill question).
// Each step is a caption (prose, maths between $…$) plus how the exponent grid looks that beat (DimViewState: which rows' dimensions are shown, the
// equations written so far as TeX lines, and the powers found). The working is written formally, as an examiner expects it: square brackets for "the
// dimensions of", a chain of equals, and the dimensions of each factor substituted: [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻².
import type { DecisionProblem, SolveStep, DimViewState } from "./types";
import { type Fr, type Dim3, BASE, fmul, fadd, fsub, fdiv, fzero, feq, fr, ZERO, ONE, solveLinear } from "./dim";
import { symTex, frTex, supTex, dimTex, dimPowTex, productTex, eqLhsTex, eqTexLine, M } from "./dimTex";
import type { DimProblemData, DimRow } from "./dimGen";

const S = (caption: string, phase: string, v: DimViewState = {}): SolveStep => ({ caption, phase, edgeStates: {}, dimView: v });
const idx = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
const par = (s: string): string => (s.startsWith("-") ? `(${s})` : s);
/** a row's label in square brackets: a result row already is "[…]" */
const rowBr = (r: DimRow): string => (r.sym.startsWith("[") ? r.sym : `[${r.sym}]`);
/** "$[l] = L$, $[t] = T$" */
const bracketList = (rows: DimRow[]): string => rows.map((r) => M(`${rowBr(r)} = ${dimTex(r.dim)}`)).join(", ");
const answerTex = (dim: Dim3): string => (dim.every(fzero) ? "1" : dimTex(dim));

/** "M: 1 + (-1) = 0": what each factor contributes to the power of one base dimension, and the total (the column label is plain text) */
function contribLine(col: 0 | 1 | 2, rows: DimRow[], total: Fr): string {
  const parts = rows.map((r) => par(frTex(fmul(r.dim[col], r.exp ?? ONE))));
  return `${BASE[col]}: ${parts.join(" + ")} = ${frTex(total)}`;
}

/** a factor as brackets with its power: "[t]^{2}" */
const brPow = (r: DimRow): string => `${rowBr(r)}${supTex(r.exp ?? ONE)}`;
/** the factor's dimensions with its power: "(LT^{-2})^{2}" */
const dimPow = (r: DimRow): string => dimPowTex(r.dim, r.exp ?? ONE);

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

/** the combine steps shared by the "find the dimensions" kinds: a product of factors, then (for a root) halve */
function combineSteps(d: DimProblemData, factors: DimRow[], result: DimRow, reveal: number[], intro: string): SolveStep[] {
  const root = d.defText === "root";
  const out: SolveStep[] = [];
  const product = (c: 0 | 1 | 2): Fr => (root ? fmul(result.dim[c], fr(2)) : result.dim[c]);
  out.push(S(intro, "Dimensions of each part", { reveal }));
  out.push(S(root
    ? "Find the dimensions of what is under the root: multiply the dimensions of the parts (adding the powers of each base dimension, and taking them away for a quotient)."
    : "Multiply the dimensions of the parts: add the powers of each base dimension, and take them away for a quotient.", "Combine",
  { reveal, cols: [0, 1, 2], eqs: [...formalLines(d), ...([0, 1, 2] as const).map((c) => contribLine(c, factors, product(c)))] }));
  if (root) {
    out.push(S("The square root halves every power.", "Combine", { reveal, cols: [0, 1, 2], eqs: ([0, 1, 2] as const).map((c) => `${BASE[c]}: \\frac{1}{2} \\times ${frTex(product(c))} = ${frTex(result.dim[c])}`) }));
  }
  return out;
}

export function solveDim(p: DecisionProblem): SolveStep[] {
  const d = p.dim;
  if (!d) throw new Error("no dimension data");
  const rows = d.rows;
  const wrongNote = (): SolveStep[] => {
    const wrong = (d.options ?? []).filter((o) => !o.correct);
    return wrong.length ? [S(`The other options are slips: ${wrong.map((o) => `${M(o.text)} (${o.why})`).join("; ")}.`, "The other options", { reveal: [0], cols: [], note: dimTex(d.answerDim!) })] : [];
  };

  // ── Find the dimensions ──
  if (d.kind === "dimsName" || d.kind === "dimsUnits" || d.kind === "dimsExpr") {
    const result = rows[0];
    const factors = rows.slice(1);
    const steps: SolveStep[] = [];
    const chain = formalLines(d)[0];
    if (d.kind === "dimsName") {
      const head = chain.split(" = ").slice(0, 3).join(" = ");
      steps.push(S(`${d.defText}, so ${M(head)}.`, "Definition"));
    }
    const intro = d.kind === "dimsUnits"
      ? `Replace each unit by the dimension it stands for: ${factors.map((r) => M(`${r.sym} \\to ${dimTex(r.dim)}`)).join(", ")}.`
      : `Write down the dimensions of each quantity: ${bracketList(factors)}.`;
    steps.push(...combineSteps(d, factors, result, idx(1, factors.length + 1), intro));
    const final = `${result.sym} = ${answerTex(d.answerDim!)}`;
    steps.push(S(M(final), "Answer", { reveal: idx(0, factors.length + 1), eqs: [chain], note: final }));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Find the dimensions of a constant ──
  if (d.kind === "dimsConst") {
    const k = rows[0], target = rows[1], others = rows.slice(2);
    const denominator = d.defText === "denominator";
    const lines = formalLines(d);
    const steps: SolveStep[] = [];
    steps.push(S(`Write the formula with brackets for the dimensions: ${M(lines[0])}. The dimensions of what is known: ${bracketList([target, ...others])}.`, "Dimensions of each part", { reveal: idx(1, rows.length), eqs: [lines[0]] }));
    const line = (c: 0 | 1 | 2): string => {
      const parts = others.map((r) => par(frTex(fmul(r.dim[c], r.exp ?? ONE))));
      const t = frTex(target.dim[c]);
      const sum = parts.join(" + ") || "0";
      return denominator ? `${BASE[c]}: ${sum} - ${par(t)} = ${frTex(k.dim[c])}` : `${BASE[c]}: ${par(t)} - (${sum}) = ${frTex(k.dim[c])}`;
    };
    const subject = lines[1].split(" = ").slice(0, 2).join(" = ");
    steps.push(S(denominator
      ? `${M(rowBr(k))} divides the other factors in the formula, so make it the subject: ${M(subject)}. Take the powers of ${M(rowBr(target))} away from those of the other factors.`
      : `Make ${M(rowBr(k))} the subject: ${M(subject)}. Take the powers of the other factors away from those of ${M(rowBr(target))}.`, "Rearrange for the constant",
    { reveal: idx(1, rows.length), cols: [0, 1, 2], eqs: [...lines, ...([0, 1, 2] as const).map(line)] }));
    const final = `${k.sym} = ${answerTex(d.answerDim!)}`;
    steps.push(S(M(final), "Answer", { reveal: idx(0, rows.length), eqs: [lines[1]], note: final }));
    if (d.represents) steps.push(S(`These are the dimensions of ${d.represents}.`, "What it is", { reveal: idx(0, rows.length), note: final }));
    else if (d.answerDim!.every(fzero)) steps.push(S("The constant has no dimensions: it is dimensionless.", "What it is", { reveal: idx(0, rows.length) }));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Consistency ──
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const calcs = d.calcs ?? [];
    const steps: SolveStep[] = [];
    if (d.kind === "consPick") {
      (d.options ?? []).forEach((o, i) => steps.push(S(`${"ABCD"[i]}: ${M(o.text)}. ${d.notes![i][0].toUpperCase()}${d.notes![i].slice(1)}.`, "Check each formula", { reveal: [], note: `\\text{${"ABCD"[i]}: ${o.correct ? "consistent" : "not consistent"}}` })));
      steps.push(S(`Only ${"ABCD"[(d.options ?? []).findIndex((o) => o.correct)]} has the same dimensions in every term: ${M(d.formula!)}.`, "Answer", { reveal: idx(0, rows.length), eqs: calcs }));
      return steps;
    }
    rows.forEach((_, i) => steps.push(S(`${M(calcs[i])}.`, "Dimensions of each term", { reveal: idx(0, i + 1), mark: [i], eqs: calcs.slice(0, i + 1) })));
    const chain = rows.map((r) => `[${r.sym}]`).join(" = ");
    if (d.kind === "consShow") {
      const dim = dimTex(d.answerDim!);
      steps.push(S(`Every term has dimensions ${M(dim)}: ${M(`${chain} = ${dim}`)}, so the formula is dimensionally consistent.`, "Conclusion", { reveal: idx(0, rows.length), eqs: [`${chain} = ${dim}`], note: `${chain} = ${dim}` }));
    } else if (d.kind === "consOdd") {
      const odd = d.oddIdx!;
      const other = rows.find((_, i) => i !== odd)!;
      steps.push(S(`${M(`[${rows[odd].sym}] = ${dimTex(rows[odd].dim)}`)} but the others have dimensions ${M(dimTex(other.dim))}: ${M(rows[odd].sym)} is the odd one out.`, "Conclusion", { reveal: idx(0, rows.length), mark: [odd], eqs: calcs, note: `\\text{odd one out: }${rows[odd].sym}` }));
    } else {
      const m = d.missing!;
      const line = (c: 0 | 1 | 2): string | null => {
        if (fzero(m.coef[c])) return null;
        const rest = m.rest[c];
        const tail = fzero(rest) ? "" : ` ${rest[0] < 0 ? "-" : "+"} ${frTex(fr(Math.abs(rest[0]), rest[1]))}`;
        return `${BASE[c]}: ${eqLhsTex([m.coef[c]], ["n"])}${tail} = ${frTex(m.target[c])}`;
      };
      steps.push(S(`The other terms have dimensions ${M(dimTex(m.target))}, so the term with ${M("n")} must too. Write its dimensions with ${M("n")} as the power of ${M(symTex(m.sym))}.`, "Equate the dimensions", { reveal: idx(0, rows.length), cols: [0, 1, 2], eqs: ([0, 1, 2] as const).map(line).filter((x): x is string => !!x) }));
      steps.push(S(M(`n = ${frTex(m.value)}`), "Answer", { reveal: idx(0, rows.length), note: `n = ${frTex(m.value)}` }));
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
  steps.push(S(`Write down the dimensions: ${bracketList([target, ...facs])}.`, "Dimensions of each quantity", { reveal: idx(0, rows.length) }));
  steps.push(S(`${M("k")} has no dimensions, so ${M(modelDims)}.`, "Equate the powers", { reveal: idx(0, rows.length), eqs: [modelDims] }));
  // the dimensions substituted, with the powers of each base dimension collected
  const withPower = (r: DimRow, i: number) => {
    const t = dimTex(r.dim);
    const letters = r.dim.filter((e) => !fzero(e)).length;
    const bare = letters === 1 && feq(r.dim.find((e) => !fzero(e))!, ONE);
    return `${bare ? t : `(${t})`}^{${symTex(syms[i])}}`;
  };
  const sub = `${dimTex(target.dim)} = ${facs.map(withPower).join("")}`;
  const collected = ([0, 1, 2] as const).map((c) => `${BASE[c]}^{${eqLhsTex(d.eqs[c].coef, syms)}}`).join("");
  steps.push(S(`Substitute the dimensions: ${M(sub)}. Collect the powers of each base dimension: ${M(`= ${collected}`)}.`, "Equate the powers", { reveal: idx(0, rows.length), eqs: [modelDims, `${sub} = ${collected}`] }));
  const eqLines = d.eqs.map((e) => eqTexLine(e, syms));
  d.eqs.forEach((e, c) => steps.push(S(`Powers of ${BASE[c]}: ${M(`${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)}.`, "Equate the powers", { reveal: idx(0, rows.length), cols: [c], eqs: eqLines.slice(0, c + 1) })));

  if (d.ask === "cannot") {
    // two independent equations fix both powers; the third then disagrees
    for (let r1 = 0; r1 < 3; r1++) for (let r2 = r1 + 1; r2 < 3; r2++) {
      const A = [d.eqs[r1].coef, d.eqs[r2].coef];
      const res = solveLinear(A, [d.eqs[r1].rhs, d.eqs[r2].rhs]);
      if (res.status !== "unique") continue;
      const r3 = 3 - r1 - r2;
      const [a, b] = res.x;
      const lhs = fadd(fmul(d.eqs[r3].coef[0], a), fmul(d.eqs[r3].coef[1], b));
      const found = { [syms[0]]: frTex(a), [syms[1]]: frTex(b) };
      steps.push(S(`The ${BASE[r1]} and ${BASE[r2]} equations give ${M(`${symTex(syms[0])} = ${frTex(a)}`)} and ${M(`${symTex(syms[1])} = ${frTex(b)}`)}.`, "Solve", { reveal: idx(0, rows.length), cols: [r1, r2], eqs: eqLines, powers: found }));
      steps.push(S(`Put these into the ${BASE[r3]} equation: ${M(eqLhsTex(d.eqs[r3].coef, syms))} becomes ${M(frTex(lhs))}, but it should equal ${M(frTex(d.eqs[r3].rhs))}. The equations contradict each other.`, "Contradiction", { reveal: idx(0, rows.length), cols: [r3], eqs: eqLines, powers: found }));
      steps.push(S(`No values of ${M(symTex(syms[0]))} and ${M(symTex(syms[1]))} make the model dimensionally consistent, so the model cannot be right.`, "Answer", { reveal: idx(0, rows.length), eqs: eqLines, note: "\\text{no values work}" }));
      return steps;
    }
    return steps;
  }

  // solve by substitution: an equation with one power left gives it, the next uses it
  const known: Array<Fr | null> = Array(n).fill(null);
  const shownPowers = (): Record<string, string> => Object.fromEntries(known.map((v, i) => [syms[i], v ? frTex(v) : ""]).filter(([, v]) => v !== ""));
  const powersSoFar = (): string => known.map((v, i) => (v ? `${symTex(syms[i])} = ${frTex(v)}` : null)).filter(Boolean).join(",\\ ");
  let guard = 0;
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
      steps.push(S(`${have ? `With ${M(have)}, the` : "The"} ${BASE[e.col]} equation leaves only ${M(symTex(syms[i]))}: ${M(`${coefStr}${symTex(syms[i])} = ${frTex(remaining)}`)}, so ${M(`${symTex(syms[i])} = ${frTex(val)}`)}${fzero(val) ? " (this power is zero: that quantity does not appear)" : ""}.`, "Solve", { reveal: idx(0, rows.length), cols: [e.col], eqs: eqLines, powers: shownPowers() }));
      did = true;
      break;
    }
    if (!did) break;
  }
  if (known.some((v) => v === null)) {
    const res = solveLinear(d.eqs.map((e) => e.coef), d.eqs.map((e) => e.rhs));
    if (res.status === "unique") res.x.forEach((v, i) => { if (known[i] === null) known[i] = v; });
    steps.push(S(`Solve the equations together (eliminate one power from a pair of equations, then another): ${M(powersSoFar())}.`, "Solve", { reveal: idx(0, rows.length), cols: [0, 1, 2], eqs: eqLines, powers: shownPowers() }));
  }
  const checkLines = d.eqs.map((e) => {
    const parts = e.coef.map((c, i) => (fzero(c) ? null : par(frTex(fmul(c, known[i]!)))));
    const sum = parts.filter(Boolean).join(" + ") || "0";
    return `${BASE[e.col]}: ${sum} = ${frTex(e.rhs)} \\checkmark`;
  });
  steps.push(S(`Check by putting the powers back: every column adds up to the dimensions of ${M(target.sym)}.`, "Check", { reveal: idx(0, rows.length), cols: [0, 1, 2], eqs: checkLines, powers: shownPowers() }));
  const answer = syms.map((s, i) => `${symTex(s)} = ${frTex(known[i]!)}`).join(",\\ ");
  steps.push(S(d.ask === "zero" ? `${M(`${symTex(syms[d.zeroIdx!])} = 0`)}, and ${M(answer)}.` : `${M(answer)}.`, "Answer", { reveal: idx(0, rows.length), eqs: eqLines, powers: shownPowers(), note: answer }));
  return steps;
}
