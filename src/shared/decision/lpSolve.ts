// Formulating Linear Programmes: the stepped working of a "Write a constraint" question (the Solution of a skill question). See lpGen.ts for the data.
// Each step adds rows to the page a student would write (types.ts, LpViewState): the variables, the translation of the words, the tidying one line at a time,
// the check (try a number), and last the constraint with the common slip. The slip is shown with the answer, never before.
import type { LpRow, SolveStep, DecisionProblem } from "./types";
import { type Fr, fr, fmul } from "./dim";
import { type Constraint, type Op, gcdInt } from "./lp";
import { type LpProblemData, constraintOf, texN } from "./lpGen";

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
  else totalSteps(c, syms, step);

  if (d.info.kind !== "resource") checkStep(d, c, syms, ints, step);
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
    { k: "words", t: `$${A}$ is ${opWordTex(d.op)} ${frTex(m) === "1" ? "" : `$${frTex(m)}$ times `}${many ? "all of" : ""} $${Bsum}$.` },
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
  const op = opTex(d.op);
  const info = d.info;
  let meaning = "";
  if (info.kind === "multiple") {
    const av = pt[info.a], bs = info.b.map((i) => pt[i]);
    const bv = bs.reduce((s, v) => s + v, 0);
    const rhs = fmul(info.m, fr(bv));
    meaning = `${d.vars[info.a].noun} $= ${av}$ and ${info.b.length > 1 ? `${info.b.map((i) => d.vars[i].noun).join(" and ")} combined $= ${sumOf(bs)} = ${bv}$` : `${d.vars[info.b[0]].noun} $= ${bv}$`}. Is $${av} ${op} ${frTex(info.m)} \\times ${bv}$? Yes, since $${frTex(info.m)} \\times ${bv} = ${frTex(rhs)}$.`;
  } else if (info.kind === "difference") {
    meaning = `${d.vars[info.a].noun} $= ${pt[info.a]}$ and ${d.vars[info.b].noun} $= ${pt[info.b]}$, so the difference is $${pt[info.a]} - ${pt[info.b]} = ${pt[info.a] - pt[info.b]}$, and $${pt[info.a] - pt[info.b]} ${op} ${info.k}$ is true.`;
  } else if (info.kind === "bound") {
    meaning = `$${syms[info.i]} = ${pt[info.i]}$, and $${pt[info.i]} ${op} ${info.N}$ is true.`;
  } else if (info.kind === "total") {
    const t = pt.reduce((s, v) => s + v, 0);
    meaning = `the total is $${sumOf(pt)} = ${t}$, and $${t} ${op} ${info.N}$ is true.`;
  }
  const { text, value } = substTex(ints, pt);
  const rhs = c.rhs[0] / c.rhs[1];
  step("Check the constraint with a number: choose values that fit the words, and see that the constraint agrees.", [
    { k: "head", t: "Check with a number" },
    { k: "words", t: `Try $${assign(syms, pt)}$: ${meaning}` },
    { k: "words", t: `In the constraint: $${text} = ${value}$, and $${value} ${opTex(c.op)} ${texN(rhs)}$ is ${holdsInt(value, c.op, rhs) ? "true ✓" : "false ✗"}.` },
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
    if (d.info.kind === "resource") {
      const i = d.info.per.findIndex((a) => d.info.kind === "resource" && d.info.amount % a === 0);
      const sl = d.slip.spec.t === "linear" ? d.slip.spec.coeffs[i][0] : 1;
      const lim = fr(d.info.amount, sl);
      why = ` Check it: with only ${d.vars[i].noun} it gives $${syms[i]} ${opTex(d.op)} ${frTex(lim)}$, not $${d.info.amount / d.info.per[i]}$.`;
    } else if (d.point) {
      const sp = substTex(s.coeffs.map((f) => f[0]), d.point);
      why = ` At the check point it gives $${sp.text} = ${sp.value}$, and $${sp.value} ${opTex(s.op)} ${texN(s.rhs[0] / s.rhs[1])}$ is false, so it does not fit the words.`;
    }
    // a slip is shown as a student would write it: a linear one with its own numbers (15x + 10y ≤ 300), not tidied
    const sp = d.slip.spec;
    const shown = sp.t === "linear" ? `${exprTex(sp.coeffs.map((f) => f[0]), syms)} ${opTex(sp.op)} ${frTex(sp.rhs)}` : constraintTex(s, syms);
    rows.push({ k: "slip", t: `Common slip: ${d.slip.what}, $${shown}$.${why}` });
  }
  step("That is the constraint: whole-number coefficients in lowest terms, the first coefficient positive.", rows, "The constraint");
}
