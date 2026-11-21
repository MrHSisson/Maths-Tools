// Formulating Linear Programmes: the stepped working of a "Write a constraint" question (the Solution of a skill question). See lpGen.ts for the data.
// Each step adds rows to the page a student would write (types.ts, LpViewState): the variables, the translation of the words, the tidying one line at a time,
// the check (try a number), and last the constraint with the common slip. The slip is shown with the answer, never before.
import type { LpRow, SolveStep, DecisionProblem } from "./types";
import { type Fr, fr, fmul, fsub, fdiv } from "./dim";
import { type Constraint, type Op, gcdInt, lcmInt, intercept } from "./lp";
import { type LpProblemData, constraintOf, texN } from "./lpGen";
import { decStr, isFinite10 } from "./lpGenL23";

const OPTEX: Record<Op, string> = { "≤": "\\le", "≥": "\\ge", "=": "=", "<": "<", ">": ">" };
const opTex = (op: Op): string => OPTEX[op];
/** an exact value for TeX: 3, -3, \frac{3}{2} */
const frTex = (f: Fr): string => (f[1] === 1 ? texN(f[0]) : `${f[0] < 0 ? "-" : ""}\\frac{${Math.abs(f[0])}}{${f[1]}}`);

/** "3x + 4y - 2z" from whole-number coefficients in the order of the variables */
function exprTex(coeffs: readonly number[], syms: readonly string[]): string {
  let s = "";
  coeffs.forEach((k, i) => {
    if (k === 0) return;
    const body = `${Math.abs(k) === 1 ? "" : texN(Math.abs(k))}${syms[i]}`;
    s += s === "" ? (k < 0 ? "-" : "") + body : ` ${k < 0 ? "-" : "+"} ${body}`;
  });
  return s || "0";
}
/** a constraint as a line of TeX: "3x + 4y \le 180" */
export const constraintTex = (c: Pick<Constraint, "coeffs" | "op" | "rhs">, syms: readonly string[]): string => `${exprTex(c.coeffs.map((f) => f[0]), syms)} ${opTex(c.op)} ${frTex(c.rhs)}`;
/** the left side with the numbers put in: "3(4) + 4(6) = 36" */
function substTex(coeffs: readonly number[], p: readonly number[]): { text: string; value: number } {
  let text = "";
  let value = 0;
  coeffs.forEach((k, i) => {
    if (k === 0) return;
    value += k * p[i];
    const body = Math.abs(k) === 1 ? `${p[i]}` : `${texN(Math.abs(k))}(${p[i]})`;
    text += text === "" ? (k < 0 ? "-" : "") + body : ` ${k < 0 ? "-" : "+"} ${body}`;
  });
  return { text: text || "0", value };
}
const holdsInt = (l: number, op: Op, r: number): boolean => (op === "≤" ? l <= r : op === "≥" ? l >= r : op === "=" ? l === r : op === "<" ? l < r : l > r);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const PLURAL: Record<string, string> = { uses: "use", needs: "need", takes: "take", supplies: "supply" };
const assign = (syms: readonly string[], p: readonly number[]): string => syms.map((s, i) => `${s} = ${p[i]}`).join(",\\ ");
/** "3 + 4 + 5" */
const sumOf = (xs: readonly number[]): string => xs.join(" + ");

/** the steps of a question, each carrying the whole page so far (the rows the step adds are the last `fresh`) */
export function solveLp(p: DecisionProblem): SolveStep[] {
  const d = p.lp!;
  if (d.info.kind === "problem") return solveProblem(d);
  const syms = d.vars.map((v) => v.sym);
  const c = constraintOf(d.spec);
  const out: SolveStep[] = [];
  let rows: LpRow[] = [];
  const step = (caption: string, add: LpRow[], phase?: string): void => {
    rows = [...rows, ...add];
    out.push({ caption, phase, edgeStates: {}, lpView: { rows, fresh: add.length } });
  };
  const ints = c.coeffs.map((f) => f[0]);

  step("Say what each letter stands for, so the constraint can be written in them.", [
    { k: "head", t: "Variables" },
    ...d.vars.map((v): LpRow => ({ k: "words", t: `$${v.sym}$ is the number of ${v.noun}` })),
  ], "Variables");

  if (d.info.kind === "resource") resourceSteps(d, c, syms, step);
  else if (d.info.kind === "multiple") multipleSteps(d, c, syms, step);
  else if (d.info.kind === "difference") differenceSteps(d, c, syms, step);
  else if (d.info.kind === "bound") boundSteps(d, c, syms, step);
  else if (d.info.kind === "total") totalSteps(c, syms, step);
  else if (d.info.kind === "percent") percentSteps(d, c, syms, step);
  else if (d.info.kind === "ratio") ratioSteps(d, c, syms, step);
  else if (d.info.kind === "decimal") decimalSteps(d, c, syms, step);
  else if (d.info.kind === "blend") blendSteps(d, c, syms, step);
  else eitherSteps(d, c, syms, step);

  if (d.info.kind !== "resource" && d.info.kind !== "decimal" && d.info.kind !== "eitherOr") checkStep(d, c, syms, ints, step);
  finalStep(d, c, syms, step);
  return out;
}

type Add = (caption: string, add: LpRow[], phase?: string) => void;

// ── resource use ─────────────────────────────────────────────────────────────
function resourceSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "resource" }>;
  const { per, amount, unit, label, sing, verb } = info;
  const pl = PLURAL[verb] ?? verb;
  step(`Work out the ${info.topic} each kind of item ${verb === "supplies" ? "supplies" : "needs"}: the amount for one item, times the number of items.`, [
    { k: "head", t: `${cap(info.topic)}, one kind at a time` },
    ...d.vars.map((v, i): LpRow => ({ k: "words", t: `Each ${sing[i]} ${verb} ${per[i]} ${unit}, so $${v.sym}$ ${v.noun} ${pl} $${exprTex([per[i]], [v.sym])}$ ${unit}.` })),
  ], "One kind at a time");
  const sum = exprTex(per, syms);
  step(`Add them up: the total ${label} is the sum, and the question says how it is limited.`, [
    { k: "words", t: `Together the ${label} is $${sum}$ ${unit}, and it must be ${opWordTex(d.op)} ${texN(amount)} ${unit}.` },
    { k: "tex", t: `${sum} ${opTex(d.op)} ${texN(amount)}` },
  ], "Add them up");
  const g = [...per, amount].reduce((h, v) => gcdInt(h, v), 0);
  if (g > 1) {
    step(`Every number is divisible by ${g}, so divide the whole line by ${g}: the lowest terms.`, [
      { k: "words", t: `Divide every term by ${g}:` },
      { k: "tex", t: constraintTex(c, syms) },
    ], "Lowest terms");
  }
  const i = per.findIndex((a) => amount % a === 0);
  const only = d.vars[i].sym;
  const others = syms.filter((_, j) => j !== i).map((s) => `${s} = 0`).join(",\\ ");
  const lim = amount / per[i];
  step("Check the constraint with a simple case: make only one kind of item.", [
    { k: "words", t: `If only ${d.vars[i].noun} are made ($${others}$), then $${per[i]}${only} ${opTex(d.op)} ${texN(amount)}$, so $${only} ${opTex(d.op)} ${lim}$.` },
    { k: "note", t: `${lim} ${d.vars[i].noun} ${verb === "supplies" ? "supply" : "use"} ${lim} × ${per[i]} = ${texN(amount)} ${unit}: that is the limit in the question ✓` },
  ], "Check");
}
const opWordTex = (op: Op): string => ({ "≤": "at most", "≥": "at least", "=": "exactly", "<": "less than", ">": "more than" }[op]);

// ── multiples: "x is at least twice y and z combined" ────────────────────────
function multipleSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "multiple" }>;
  const { a, b, m } = info;
  const [pp, qq] = m; // m = pp/qq in lowest terms
  const A = syms[a];
  const Bsum = b.map((i) => syms[i]).join(" + ");
  const many = b.length > 1;
  const op = opTex(d.op);
  const brk = (k: number): string => (many ? (k === 1 ? `(${Bsum})` : `${k}(${Bsum})`) : k === 1 ? Bsum : `${k}${Bsum}`);
  step(`Write the sentence as an inequality: ${A} on one side, ${frTex(m)} times ${many ? "the others together" : syms[b[0]]} on the other.`, [
    { k: "head", t: "Write it as an inequality" },
    { k: "words", t: `$${A}$ is ${opWordTex(d.op)} ${frTex(m) === "1" ? "" : `$${frTex(m)}$ times `}${many ? "all of " : ""}$${Bsum}$.` },
    { k: "tex", t: `${A} ${op} ${qq === 1 ? (pp === 1 ? `${many ? `(${Bsum})` : Bsum}` : `${pp}${many ? `(${Bsum})` : Bsum}`) : `\\frac{${pp}}{${qq}}${many ? `(${Bsum})` : Bsum}`}` },
  ], "Translate");
  if (qq > 1) {
    step(`Multiply both sides by ${qq} to clear the fraction.`, [
      { k: "words", t: `Multiply both sides by ${qq}:` },
      { k: "tex", t: `${qq}${A} ${op} ${brk(pp)}` },
    ], "Clear the fraction");
  }
  const lhsA = qq === 1 ? A : `${qq}${A}`;
  if (many && pp > 1) {
    step("Multiply out the brackets.", [
      { k: "tex", t: `${lhsA} ${op} ${b.map((i) => `${pp}${syms[i]}`).join(" + ")}` },
    ], "Expand");
  }
  const right = b.map((i) => `${pp === 1 ? "" : pp}${syms[i]}`);
  const moved = `${lhsA} - ${right.join(" - ")} ${op} 0`;
  step("Take everything to the left, so that the right-hand side is 0.", [
    { k: "tex", t: moved },
  ], "Move to the left");
  const first = Math.min(a, ...b);
  if (first !== a) {
    const flip = d.op === "=" ? "" : " This reverses the inequality sign.";
    step(`Write the letters in order, with the first coefficient positive: multiply by −1.${flip}`, [
      { k: "tex", t: constraintTex(c, syms) },
    ], "Tidy");
  }
}

// ── a difference: "x exceeds y by at least 5" ────────────────────────────────
function differenceSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "difference" }>;
  const { a, b, k } = info;
  step(`"Exceeds by" means the difference is ${opWordTex(d.op)} ${k}: ${syms[a]} minus ${syms[b]}.`, [
    { k: "head", t: "Write it as an inequality" },
    { k: "tex", t: `${syms[a]} - ${syms[b]} ${opTex(d.op)} ${k}` },
  ], "Translate");
  if (a > b) {
    step(`Write the letters in order, with the first coefficient positive: multiply by −1.${d.op === "=" ? "" : " This reverses the inequality sign."}`, [
      { k: "tex", t: constraintTex(c, syms) },
    ], "Tidy");
  }
}
// ── a bound ──────────────────────────────────────────────────────────────────
function boundSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "bound" }>;
  step(info.each ? `The limit is for each type, so for ${d.vars[info.i].noun} it is a limit on ${syms[info.i]} alone.` : `The number of ${d.vars[info.i].noun} is ${syms[info.i]}, so the limit is on ${syms[info.i]} alone.`, [
    { k: "head", t: "Write it as an inequality" },
    { k: "tex", t: constraintTex(c, syms) },
  ], "Translate");
}
// ── a total ──────────────────────────────────────────────────────────────────
function totalSteps(c: Constraint, syms: string[], step: Add): void {
  step("The total is the sum of all the numbers, one letter for each.", [
    { k: "head", t: "Write it as an inequality" },
    { k: "tex", t: constraintTex(c, syms) },
  ], "Translate");
}

// ── the check: a point that fits the words ───────────────────────────────────
function checkStep(d: LpProblemData, c: Constraint, syms: string[], ints: number[], step: Add): void {
  const pt = d.point;
  if (!pt) return;
  // the point either fits the words (and the slip refuses it) or does not (and the slip would allow it)
  const fits = d.pointFits !== false;
  const tf = fits ? "true" : "false";
  const op = opTex(d.op);
  const info = d.info;
  let meaning = "";
  if (info.kind === "multiple") {
    const av = pt[info.a], bs = info.b.map((i) => pt[i]);
    const bv = bs.reduce((s, v) => s + v, 0);
    const rhs = fmul(info.m, fr(bv));
    meaning = `${d.vars[info.a].noun} $= ${av}$ and ${info.b.length > 1 ? `${info.b.map((i) => d.vars[i].noun).join(" and ")} combined $= ${sumOf(bs)} = ${bv}$` : `${d.vars[info.b[0]].noun} $= ${bv}$`}. Is $${av} ${op} ${frTex(info.m)} \\times ${bv}$? Yes, since $${frTex(info.m)} \\times ${bv} = ${frTex(rhs)}$.`;
  } else if (info.kind === "difference") {
    meaning = `${d.vars[info.a].noun} $= ${pt[info.a]}$ and ${d.vars[info.b].noun} $= ${pt[info.b]}$, so the difference is $${pt[info.a]} - ${pt[info.b]} = ${pt[info.a] - pt[info.b]}$, and $${pt[info.a] - pt[info.b]} ${op} ${info.k}$ is ${tf}.`;
  } else if (info.kind === "bound") {
    meaning = `$${syms[info.i]} = ${pt[info.i]}$, and $${pt[info.i]} ${op} ${info.N}$ is ${tf}.`;
  } else if (info.kind === "total") {
    const t = pt.reduce((s, v) => s + v, 0);
    meaning = `the total is $${sumOf(pt)} = ${t}$, and $${t} ${op} ${info.N}$ is ${tf}.`;
  } else if (info.kind === "percent" || info.kind === "ratio") {
    const name = (idx: number[]): string => (idx.length === syms.length ? "the total" : idx.length === 1 ? d.vars[idx[0]].noun : `${idx.map((i) => d.vars[i].noun).join(" and ")} combined`);
    const sum = (idx: number[]): { text: string; v: number } => ({ text: idx.length > 1 ? `${sumOf(idx.map((i) => pt[i]))} = ${idx.reduce((s, i) => s + pt[i], 0)}` : `${pt[idx[0]]}`, v: idx.reduce((s, i) => s + pt[i], 0) });
    const A = sum(info.a), B = sum(info.b);
    const mode: Mode = info.kind === "percent" ? "dec" : "frac";
    const mt = coefTex(info.m, mode);
    const val = fmul(info.m, fr(B.v));
    meaning = `${name(info.a)} $= ${A.text}$ and ${name(info.b)} $= ${B.text}$. Is $${A.v} ${op} ${mt} \\times ${B.v}$? ${fits ? "Yes" : "No"}, since $${mt} \\times ${B.v} = ${coefTex(val, mode)}$.`;
  } else if (info.kind === "blend") {
    const amount = info.contents.reduce((s, f, i) => s + (f[0] / f[1]) * pt[i], 0);
    const total = pt.reduce((s, v) => s + v, 0);
    const share = (info.share[0] / info.share[1]) * total;
    const r = (x: number): string => String(Math.round(x * 10000) / 10000);
    meaning = `the ${info.comp} is $${info.contents.map((f, i) => `${decStr(f)}(${pt[i]})`).join(" + ")} = ${r(amount)}$ out of a total of $${sumOf(pt)} = ${total}$. The required share of the total is $${decStr(info.share)} \\times ${total} = ${r(share)}$, and $${r(amount)} ${op} ${r(share)}$ is ${tf}.`;
  }
  const { text, value } = substTex(ints, pt);
  const rhs = c.rhs[0] / c.rhs[1];
  step("Check the constraint with a number: choose values that fit the words, and see that the constraint agrees.", [
    { k: "head", t: "Check with a number" },
    { k: "words", t: `Try $${assign(syms, pt)}$: ${meaning}` },
    { k: "words", t: `In the constraint: $${text} = ${value}$, and $${value} ${opTex(c.op)} ${texN(rhs)}$ is ${holdsInt(value, c.op, rhs) ? "true" : "false"}${holdsInt(value, c.op, rhs) === fits ? ", so the constraint agrees with the words ✓" : " ✗"}.` },
  ], "Check");
}

// ── the constraint, and the common slip ──────────────────────────────────────
function finalStep(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const rows: LpRow[] = [{ k: "result", t: constraintTex(c, syms) }];
  if (d.op === "<" || d.op === ">") {
    rows.push({ k: "note", t: `The sign stays strict: points on the boundary are not allowed.${c.coeffs.filter((f) => f[0] !== 0).length === 1 ? ` For whole numbers, $${syms[c.coeffs.findIndex((f) => f[0] !== 0)]} ${opTex(c.op)} ${texN(c.rhs[0])}$ also means $${syms[c.coeffs.findIndex((f) => f[0] !== 0)]} ${c.op === ">" ? "\\ge" : "\\le"} ${texN(c.rhs[0] + (c.op === ">" ? 1 : -1))}$.` : ""}` });
  }
  if (d.slip) {
    const s = constraintOf(d.slip.spec);
    let why = "";
    if (d.info.kind === "resource" || d.info.kind === "decimal" || d.info.kind === "eitherOr") {
      // the "if only one kind is made" check: the limit on one letter, correct and slipped
      const differs = (j: number): boolean => { const r = intercept(s, j), q = intercept(c, j); return !!r && !!q && r[0] * q[1] !== q[0] * r[1]; };
      const i = c.coeffs.findIndex((f, j) => f[0] !== 0 && c.rhs[0] % f[0] === 0 && differs(j));
      if (i >= 0) why = ` Check it: with only ${d.vars[i].noun} it gives $${syms[i]} ${opTex(s.op)} ${frTex(intercept(s, i)!)}$, not $${frTex(intercept(c, i)!)}$.`;
    } else if (d.point) {
      const sp = substTex(s.coeffs.map((f) => f[0]), d.point);
      why = ` At the check point it gives $${sp.text} = ${sp.value}$, and $${sp.value} ${opTex(s.op)} ${texN(s.rhs[0] / s.rhs[1])}$ is ${d.pointFits === false ? "true, so it would wrongly allow a point that the words rule out" : "false, so it does not fit the words"}.`;
    }
    // a slip is shown as a student would write it: a linear one with its own numbers (15x + 10y ≤ 300), not tidied
    const sp = d.slip.spec;
    const shown = sp.t === "linear" ? `${exprFr(sp.coeffs, syms, "dec")} ${opTex(sp.op)} ${coefTex(sp.rhs, "dec")}` : constraintTex(s, syms);
    rows.push({ k: "slip", t: `Common slip: ${d.slip.what}, $${shown}$.${why}` });
  }
  step("That is the constraint: whole-number coefficients in lowest terms, the first coefficient positive.", rows, "The constraint");
}

// ── fractions and decimals in the working ────────────────────────────────────
type Mode = "dec" | "frac";
/** the size of a coefficient: 3, 0.4, \frac{2}{3} (decimals only when the fraction is a finite decimal and the mode says decimals) */
function coefTex(f: Fr, mode: Mode): string {
  const a: Fr = [Math.abs(f[0]), f[1]];
  if (a[1] === 1) return texN(a[0]);
  if (mode === "dec" && isFinite10(a)) return decStr(a);
  return `\\frac{${a[0]}}{${a[1]}}`;
}
/** "0.6x - 0.4y - 0.4z" from exact coefficients in the order of the variables */
function exprFr(coeffs: readonly Fr[], syms: readonly string[], mode: Mode): string {
  let s = "";
  coeffs.forEach((f, i) => {
    if (f[0] === 0) return;
    const one = Math.abs(f[0]) === 1 && f[1] === 1;
    const body = `${one ? "" : coefTex(f, mode)}${syms[i]}`;
    s += s === "" ? (f[0] < 0 ? "-" : "") + body : ` ${f[0] < 0 ? "-" : "+"} ${body}`;
  });
  return s || "0";
}
const bracketed = (idx: readonly number[], syms: readonly string[]): string => idx.map((i) => syms[i]).join(" + ");

interface Pipe { left: Fr[]; right: Fr[]; op: Op; mode: Mode; expand: boolean; c: Constraint; syms: string[] }
/** from "A ⟨op⟩ m(B)" to the tidy form: multiply out the bracket, take everything to the left and collect, clear the decimals or fractions, divide by a common factor, put the first coefficient positive */
function pipeline(step: Add, P: Pipe): void {
  const { left, right, op, mode, syms, c } = P;
  const o = opTex(op);
  if (P.expand) step("Multiply out the bracket.", [{ k: "tex", t: `${exprFr(left, syms, mode)} ${o} ${exprFr(right, syms, mode)}` }], "Expand");
  const moved = left.map((f, i) => fsub(f, right[i]));
  step("Take everything to the left and collect the like terms, so that the right-hand side is 0.", [{ k: "tex", t: `${exprFr(moved, syms, mode)} ${o} 0` }], "Move to the left");
  const k = moved.reduce((l, f) => lcmInt(l, f[1]), 1);
  let cur = moved.map((f) => fmul(f, fr(k)));
  if (k > 1) step(`Multiply every term by ${k} to remove the ${mode === "dec" ? "decimals" : "fractions"}.`, [{ k: "tex", t: `${exprFr(cur, syms, mode)} ${o} 0` }], "Whole numbers");
  const g = cur.reduce((h, f) => gcdInt(h, f[0]), 0);
  if (g > 1) {
    cur = cur.map((f) => fdiv(f, fr(g)));
    step(`Every coefficient is divisible by ${g}: divide through, to get lowest terms.`, [{ k: "tex", t: `${exprFr(cur, syms, mode)} ${o} 0` }], "Lowest terms");
  }
  const lead = cur.find((f) => f[0] !== 0);
  if (lead && lead[0] < 0) step(`Write the letters in order, with the first coefficient positive: multiply by −1.${op === "=" ? "" : " This reverses the inequality sign."}`, [{ k: "tex", t: constraintTex(c, syms) }], "Tidy");
}
const zeros = (n: number): Fr[] => Array.from({ length: n }, () => fr(0));
const unit = (n: number, idx: readonly number[], v: Fr): Fr[] => zeros(n).map((z, i) => (idx.includes(i) ? v : z));

// ── Level 2: percentages ─────────────────────────────────────────────────────
function percentSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "percent" }>;
  const { form, a, b, m, p } = info;
  const n = syms.length;
  const many = b.length > 1;
  const note = form === "more" || form === "less"
    ? `${p}% ${form} than ${d.vars[b[0]].noun} is ${100 + (form === "more" ? p : -p)}% of them: $${100 + (form === "more" ? p : -p)}\\% = ${decStr(m)}$.`
    : `Write ${p}% as a decimal: $${p}\\% = ${decStr(m)}$.`;
  const factor = decStr(m);
  const right = `${factor}${many ? `(${bracketed(b, syms)})` : bracketed(b, syms)}`;
  step(`Write the sentence as an inequality: ${syms[a[0]]} on one side, ${form === "total" ? "the percentage of the total" : "the percentage"} on the other.`, [
    { k: "head", t: "Write it as an inequality" },
    { k: "words", t: note },
    { k: "tex", t: `${syms[a[0]]} ${opTex(d.op)} ${right}` },
  ], "Translate");
  pipeline(step, { left: unit(n, a, fr(1)), right: unit(n, b, m), op: d.op, mode: "dec", expand: many, c, syms });
}

// ── Level 2: ratios, "one for every", and shares of the total ────────────────
function ratioSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "ratio" }>;
  const { form, a, b, m } = info;
  const n = syms.length;
  const o = opTex(d.op);
  if (form === "ratio") {
    const [num, den] = m;
    step(`A ratio compares the two numbers by division: ${syms[a[0]]} : ${syms[b[0]]} is ${syms[a[0]]} divided by ${syms[b[0]]}.`, [
      { k: "head", t: "Write it as an inequality" },
      { k: "tex", t: `\\frac{${syms[a[0]]}}{${syms[b[0]]}} ${o} \\frac{${num}}{${den}}` },
    ], "Translate");
    step(`Multiply both sides by ${den}${syms[b[0]]} (both positive, so the inequality sign stays the same).`, [
      { k: "tex", t: `${den === 1 ? "" : den}${syms[a[0]]} ${o} ${num === 1 ? "" : num}${syms[b[0]]}` },
    ], "Cross-multiply");
    pipeline(step, { left: unit(n, a, fr(den)), right: unit(n, b, fr(num)), op: d.op, mode: "frac", expand: false, c, syms });
    return;
  }
  const many = b.length > 1;
  step(form === "every" ? "\"One for every k\" means one k-th: write the amount compared with the others as a fraction of them." : "A share of the total is a fraction of all of them added together, including this one.", [
    { k: "head", t: "Write it as an inequality" },
    { k: "tex", t: `${bracketed(a, syms)} ${o} ${coefTex(m, "frac")}${many ? `(${bracketed(b, syms)})` : bracketed(b, syms)}` },
  ], "Translate");
  pipeline(step, { left: unit(n, a, fr(1)), right: unit(n, b, m), op: d.op, mode: "frac", expand: many, c, syms });
}

// ── Level 2: decimal amounts per item ────────────────────────────────────────
function decimalSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "decimal" }>;
  const { a, den, amount, unit: u, sing, verb, label, topic } = info;
  const per = a.map((v) => fr(v, den));
  const pl = PLURAL[verb] ?? verb;
  step(`Work out the ${topic} each kind of item uses: the amount for one item, times the number of items.`, [
    { k: "head", t: `${cap(topic)}, one kind at a time` },
    ...d.vars.map((v, i): LpRow => ({ k: "words", t: `Each ${sing[i]} ${verb} ${decStr(per[i])} ${u}, so $${v.sym}$ ${v.noun} ${pl} $${decStr(per[i])}${v.sym}$ ${u}.` })),
  ], "One kind at a time");
  const sum = exprFr(per, syms, "dec");
  step(`Add them up: the total ${label} is the sum, and the question says how it is limited.`, [
    { k: "words", t: `Together the ${label} is $${sum}$ ${u}, and it must be ${opWordTex(d.op)} ${texN(amount)} ${u}.` },
    { k: "tex", t: `${sum} ${opTex(d.op)} ${texN(amount)}` },
  ], "Add them up");
  const k = per.reduce((l, f) => lcmInt(l, f[1]), 1);
  let ints = per.map((f) => fmul(f, fr(k)));
  let rhs = amount * k;
  step(`Multiply every term by ${k} to remove the decimals. The right-hand side must be multiplied too.`, [
    { k: "words", t: `Multiply both sides by ${k}:` },
    { k: "tex", t: `${exprFr(ints, syms, "dec")} ${opTex(d.op)} ${texN(rhs)}` },
  ], "Whole numbers");
  const g = [...ints.map((f) => f[0]), rhs].reduce((h, v) => gcdInt(h, v), 0);
  if (g > 1) {
    ints = ints.map((f) => fdiv(f, fr(g)));
    rhs /= g;
    step(`Every number is divisible by ${g}, so divide the whole line by ${g}: the lowest terms.`, [{ k: "tex", t: `${exprFr(ints, syms, "dec")} ${opTex(d.op)} ${texN(rhs)}` }], "Lowest terms");
  }
  const i = a.findIndex((v) => (amount * den) % v === 0);
  const lim = (amount * den) / a[i];
  const others = syms.filter((_, j) => j !== i).map((s) => `${s} = 0`).join(",\\ ");
  step("Check the constraint with a simple case: make only one kind of item.", [
    { k: "words", t: `If only ${d.vars[i].noun} are made ($${others}$), then $${decStr(per[i])}${syms[i]} ${opTex(d.op)} ${texN(amount)}$, so $${syms[i]} ${opTex(d.op)} ${texN(lim)}$.` },
    { k: "note", t: `${texN(lim)} ${d.vars[i].noun} use ${texN(lim)} × ${decStr(per[i])} = ${texN(amount)} ${u}: that is the limit in the question ✓` },
  ], "Check");
  void c;
}

// ── Level 3: blends and averages ─────────────────────────────────────────────
function blendSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "blend" }>;
  const n = syms.length;
  const all = syms.map((_, i) => i);
  const share = info.share;
  const pc = (f: Fr): string => `${decStr(fmul(f, fr(100)))}\\%`;
  step(info.invest ? "Add up the interest earned, and the total money invested." : `Add up the ${info.comp} in the mix, and the total amount of the mix.`, [
    { k: "head", t: info.invest ? "Interest and total" : `The ${info.comp} and the whole mix` },
    { k: "words", t: `${cap(info.comp)} ${info.invest ? "earned" : "in the mix"}: $${exprFr(info.contents, syms, "dec")}$. Total ${info.invest ? "invested" : "amount of mix"}: $${bracketed(all, syms)}$.` },
    { k: "words", t: `As decimals: ${info.contents.map((f, i) => `$${pc(f)} = ${decStr(f)}$ for $${syms[i]}$`).join(", ")}; the share required, $${pc(share)} = ${decStr(share)}$.` },
  ], "Amounts");
  step(`The share is of the WHOLE mix, so the ${info.comp} ${info.invest ? "earned" : "in the mix"} is compared with ${decStr(share)} times the total (the bracket is the total).`, [
    { k: "tex", t: `${exprFr(info.contents, syms, "dec")} ${opTex(d.op)} ${decStr(share)}(${bracketed(all, syms)})` },
  ], "Translate");
  pipeline(step, { left: info.contents, right: unit(n, all, share), op: d.op, mode: "dec", expand: true, c, syms });
}

// ── Level 3: either-or limits ────────────────────────────────────────────────
function eitherSteps(d: LpProblemData, c: Constraint, syms: string[], step: Add): void {
  const info = d.info as Extract<LpProblemData["info"], { kind: "eitherOr" }>;
  const { caps, given, T, method } = info;
  const o = opTex(d.op);
  const L = caps.reduce((l, a) => lcmInt(l, a), 1);
  const requirement = given === "requirement";
  const whole = requirement ? "the whole daily requirement" : given === "rate" || given === "perItem" ? `the ${T} hours available` : "the whole capacity";
  const sing = (i: number): string => info.sing?.[i] ?? d.vars[i].noun.replace(/s$/, "");
  const lcmWords = caps.join(" and ");
  const showFractions = method !== "units";
  if (showFractions) {
    if (given === "perItem") {
      const mins = caps.map((a) => fr(60, a));
      step("Each item takes a number of minutes: x items take that many minutes times x. The time available is in hours, so change it to minutes.", [
        { k: "head", t: "Minutes used" },
        ...d.vars.map((v, i): LpRow => ({ k: "words", t: `Each ${sing(i)} takes $${coefTex(mins[i], "frac")}$ minutes, so $${v.sym}$ of them take $${exprFr([mins[i]], [v.sym], "frac")}$ minutes.` })),
        { k: "words", t: `$${T}$ hours $= ${T} \\times 60 = ${60 * T}$ minutes.` },
      ], "Minutes");
      step(`Together they must take ${o === "\\le" ? "at most" : "less than"} the ${60 * T} minutes available.`, [
        { k: "tex", t: `${exprFr(mins, syms, "frac")} ${o} ${60 * T}` },
      ], "Add them up");
      const k = mins.reduce((l, f) => lcmInt(l, f[1]), 1);
      step(`Multiply every term by ${k}, the lowest common multiple of the denominators, to clear the fractions.`, [{ k: "tex", t: `${exprFr(mins.map((f) => fmul(f, fr(k))), syms, "frac")} ${o} ${texN(60 * T * k)}` }], "Whole numbers");
      const ints = mins.map((f) => fmul(f, fr(k)));
      const g = [...ints.map((f) => f[0]), 60 * T * k].reduce((h, v) => gcdInt(h, v), 0);
      if (g > 1) step(`Every number is divisible by ${g}: divide through, to get lowest terms.`, [{ k: "tex", t: constraintTex(c, syms) }], "Lowest terms");
    } else {
      step(`${requirement ? "Each item supplies a fraction of the daily requirement" : given === "rate" ? "One item takes a fraction of an hour: 1 over the number that can be done in an hour" : "One item uses a fraction of the whole capacity: 1 over the most that could be made"}; x items use x times that fraction.`, [
        { k: "head", t: "Fractions of the capacity" },
        ...d.vars.map((v, i): LpRow => ({ k: "words", t: `${requirement ? `One ${sing(i)} supplies` : `One ${sing(i)} uses`} $\\frac{1}{${caps[i]}}$ ${requirement ? "of the requirement" : given === "rate" ? "of an hour" : "of the capacity"}, so $${v.sym}$ of them ${requirement ? "supply" : "use"} $\\frac{${v.sym}}{${caps[i]}}$.` })),
      ], "Fractions of the capacity");
      step(`Together they must ${requirement ? (o === "\\ge" ? "supply at least" : "supply more than") : o === "\\le" ? "use at most" : "use less than"} ${whole}.`, [
        { k: "tex", t: `${caps.map((a, i) => `\\frac{${syms[i]}}{${a}}`).join(" + ")} ${o} ${T}` },
      ], "Add them up");
      step(`Multiply every term by ${L}, the lowest common multiple of ${lcmWords}, to clear the fractions. The right-hand side is multiplied too.`, [
        { k: "tex", t: constraintTex(c, syms) },
      ], "Whole numbers");
    }
  }
  if (method === "units" || method === "both") {
    const units = caps.map((a) => L / a);
    step(method === "both" ? `The same result by the other method: suppose the ${requirement ? "requirement" : given === "rate" || given === "perItem" ? "capacity for one hour" : "capacity"} is ${L} units (a number ${lcmWords} all divide into).` : `Suppose the ${requirement ? "requirement" : given === "rate" || given === "perItem" ? "capacity for one hour" : "capacity"} is ${L} units: a number that ${lcmWords} all divide into.`, [
      { k: "head", t: method === "both" ? "The same, in common units" : "Common units" },
      ...d.vars.map((v, i): LpRow => ({ k: "words", t: `Each ${sing(i)} ${requirement ? "supplies" : "uses"} $${L} \\div ${caps[i]} = ${units[i]}$ unit${units[i] === 1 ? "" : "s"}, so $${v.sym}$ of them ${requirement ? "supply" : "use"} $${units[i] === 1 ? "" : units[i]}${v.sym}$.` })),
      ...(T > 1 ? [{ k: "words", t: `For ${T} hours the capacity is $${T} \\times ${L} = ${T * L}$ units.` } as LpRow] : []),
      { k: "tex", t: constraintTex(c, syms) },
    ], "Common units");
  }
  // the check of brief 4.4: with only one kind, the limit is the most of it that could be made
  const rows: LpRow[] = [{ k: "head", t: "Check the ends of the line" }];
  d.vars.forEach((v, i) => {
    const others = syms.filter((_, j) => j !== i).map((s) => `${s} = 0`).join(",\\ ");
    const lim = c.rhs[0] / c.coeffs[i][0];
    rows.push({ k: "words", t: `If only ${v.noun} are made ($${others}$), then ${c.coeffs[i][0] === 1 ? "" : `$${c.coeffs[i][0]}${v.sym} ${opTex(c.op)} ${texN(c.rhs[0])}$, so `}$${v.sym} ${opTex(c.op)} ${texN(lim)}$${given === "rate" ? `: ${caps[i]} an hour for ${T} hours` : given === "perItem" ? `: ${caps[i]} an hour for ${T} hours` : ""}, ${requirement ? "all that is needed" : "the most that could be made"} ✓` });
  });
  step("Check the constraint at the ends of its line: each kind on its own should give the number in the question.", rows, "Check");
}

// ── "Formulate a problem": the whole model ───────────────────────────────────
/** the steps of a problem: the variables, the objective, each constraint worked as in "Write a constraint" (its working shown while it is written, then kept as one line), non-negativity, and the model in the book's layout */
function solveProblem(d: LpProblemData): SolveStep[] {
  const info = d.info as Extract<LpProblemData["info"], { kind: "problem" }>;
  const syms = d.vars.map((v) => v.sym);
  const out: SolveStep[] = [];
  let base: LpRow[] = [];
  const push = (caption: string, rows: LpRow[], fresh: number, phase?: string): void => { out.push({ caption, phase, edgeStates: {}, lpView: { rows, fresh } }); };
  const max = info.sense === "max";
  const sum = exprFr(info.obj.map((k) => fr(k)), syms, "dec");

  const vars: LpRow[] = [{ k: "head", t: "Variables" }, ...d.vars.map((v): LpRow => ({ k: "words", t: `Let $${v.sym}$ be the number of ${v.noun}.` }))];
  base = vars;
  push("Nothing is named for you: choose a letter for each quantity you can decide, and say what it stands for.", base, vars.length, "Variables");

  const objRows: LpRow[] = [
    { k: "head", t: "Objective" },
    ...d.vars.map((v, i): LpRow => ({ k: "words", t: `Each ${info.sing[i]} ${max ? "makes a profit of" : "costs"} £${info.obj[i]}, so $${v.sym}$ ${v.noun} ${max ? "make" : "cost"} $${info.obj[i] === 1 ? "" : info.obj[i]}${v.sym}$ pounds.` })),
    { k: "tex", t: `${info.name} = ${sum}` },
    { k: "words", t: `We want to ${max ? "maximise" : "minimise"} $${info.name}$.` },
  ];
  base = [...base, ...objRows];
  push(`The objective is the ${max ? "profit" : "cost"}: add up what each kind of item ${max ? "makes" : "costs"}. It is the thing to ${max ? "maximise" : "minimise"}.`, base, objRows.length, "Objective");

  const lines: string[] = [];
  const slips: LpRow[] = [];
  info.parts.forEach((part, j) => {
    const steps = solveLp({ kind: part.kind, level: part.level, lp: part, prompt: "", answer: { text: "" }, matrixMode: "off" });
    const skip = steps[0].lpView!.rows.length; // the part's own "variables" rows are already on the page
    const head: LpRow = { k: "head", t: `Constraint ${j + 1}` };
    steps.slice(1).forEach((st, k) => {
      const v = st.lpView!;
      const isLast = k === steps.length - 2;
      const all = v.rows.slice(skip);
      const rows = all.filter((r) => r.k !== "slip");
      push(`Constraint ${j + 1}. ${st.caption}`, [...base, head, ...rows], Math.min(rows.length, v.fresh! - (all.length - rows.length)) + (k === 0 ? 1 : 0), st.phase);
      if (isLast) all.filter((r) => r.k === "slip").forEach((r) => slips.push({ k: "slip", t: `Constraint ${j + 1}. ${r.t}` }));
    });
    const line = constraintTex(constraintOf(part.spec), syms);
    lines.push(line);
    base = [...base, ...(j === 0 ? [{ k: "head", t: "Constraints" } as LpRow] : []), { k: "tex", t: line }];
  });

  const nonneg = `${syms.map((s) => `${s} \\ge 0`).join(",\\ ")}`;
  base = [...base, { k: "words", t: "Numbers of items cannot be negative:" }, { k: "tex", t: nonneg }];
  push("Finally, the numbers of items cannot be negative: each variable is at least 0.", base, 2, "Non-negativity");

  const model: LpRow[] = [
    { k: "head", t: "The linear programme" },
    { k: "words", t: `${max ? "Maximise" : "Minimise"} $${info.name} = ${sum}$` },
    { k: "words", t: "subject to:" },
    ...lines.map((t): LpRow => ({ k: "tex", t })),
    { k: "result", t: nonneg },
    ...slips,
  ];
  push("That is the model, in the usual layout: the objective, then the constraints, then non-negativity. Any consistent choice of letters is correct.", [...vars, ...model], model.length, "The model");
  return out;
}
