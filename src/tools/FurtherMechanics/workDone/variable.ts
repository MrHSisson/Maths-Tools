// Variable Force (variable): work = ∫ f(x) dx. A polynomial or kx^n, a square root, a trigonometric force or a reciprocal, between limits, finding the work, a constant k or a
// limit; and (Level 3) a constant driving force against a resistance that varies with distance, then the speed by the work-energy principle. Equations first (R5): the force and
// limits are picked so the antiderivative has whole coefficients, then the integral is evaluated exactly; the validators re-do it numerically. Brief: §5.5.
import {
  antiderivative, buildForceDisplacement, buildHorizontal, forceAt, integrate, numTex, sfTex, sig, speedFromKE,
  type ForceShape, type ForceTerm, type MechProblemData,
} from "../../../shared/mechanics";
import { inRange } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "./common";

export type Form = "poly" | "power" | "sqrt" | "trig" | "recip" | "vehicle";
interface VariableInput extends Common {
  form: Form;
  ask: "work" | "k" | "limit" | "speed";
  /** the force as terms (all forms but the vehicle); the limits a, b; for a trig force, ma and mb count quarter turns (x = m·π/(2k)) */
  terms: ForceTerm[];
  a: number;
  b: number;
  /** an exact answer with ln (reciprocal only) instead of a decimal */
  exact: boolean;
  /** the vehicle: mass (kg), constant driving force (N), resistance r·x^n (N), distance (m) */
  m: number;
  D: number;
  r: number;
  n: number;
  X: number;
}

const SUP: Record<number, string> = { 1: "", 2: "²", 3: "³" };
const coefTex = (c: number): string => (c === 1 ? "" : c === -1 ? "-" : numTex(c));
const coefPlain = (c: number): string => (c === 1 ? "" : c === -1 ? "-" : String(c));
const expTex = (e: number): string => (e === 1 ? "" : e === 1.5 ? "^{\\frac{3}{2}}" : `^{${e}}`);
const kArg = (k: number, tex: boolean): string => (k === 1 ? "x" : tex ? `${k}x` : `${k}x`);

/** A force as TeX ("3x^{2} + 2") and as plain text ("3x² + 2"). */
function forceTex(terms: ForceTerm[]): string {
  return terms.map((t, i) => {
    let body: string;
    if (t.kind === "pow") body = t.p === 0 ? numTex(Math.abs(t.c)) : t.p === 0.5 ? `${coefTex(Math.abs(t.c))}\\sqrt{x}` : t.p === -1 ? `\\dfrac{${numTex(Math.abs(t.c))}}{x}` : `${coefTex(Math.abs(t.c))}x${expTex(t.p)}`;
    else body = `${coefTex(Math.abs(t.c))}\\${t.kind}${t.k === 1 ? " x" : `(${kArg(t.k, true)})`}`;
    return i === 0 ? `${t.c < 0 ? "-" : ""}${body}` : `${t.c < 0 ? "-" : "+"} ${body}`;
  }).join(" ");
}
function forcePlain(terms: ForceTerm[]): string {
  return terms.map((t, i) => {
    let body: string;
    if (t.kind === "pow") body = t.p === 0 ? String(Math.abs(t.c)) : t.p === 0.5 ? `${coefPlain(Math.abs(t.c))}√x` : t.p === -1 ? `${Math.abs(t.c)}/x` : `${coefPlain(Math.abs(t.c))}x${SUP[t.p] ?? `^${t.p}`}`;
    else body = `${coefPlain(Math.abs(t.c))}${t.kind} ${kArg(t.k, false)}`;
    return i === 0 ? `${t.c < 0 ? "-" : ""}${body}` : `${t.c < 0 ? "-" : "+"} ${body}`;
  }).join(" ");
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** x = m·π/(2k) as TeX */
function trigX(m: number, k: number): string {
  if (m === 0) return "0";
  const g = gcd(m, 2 * k), n = m / g, den = (2 * k) / g;
  const num = n === 1 ? "\\pi" : `${n}\\pi`;
  return den === 1 ? num : `\\dfrac{${num}}{${den}}`;
}
const QUARTER = (kind: "sin" | "cos", m: number): number => (kind === "sin" ? [0, 1, 0, -1][m % 4] : [1, 0, -1, 0][m % 4]);

const SHAPE: Record<string, ForceShape> = { poly: "linear", power: "quadratic", sqrt: "sqrt", trig: "sine", recip: "reciprocal" };

/** the exact value of the work for a force made of the given terms; trig limits are quarter turns, so a and b are in units of π/(2k) there */
function limitsToX(terms: ForceTerm[], v: number): number {
  const t = terms[0];
  return t.kind === "pow" ? v : (v * Math.PI) / (2 * t.k);
}

export function buildVariable(i: VariableInput): MechProblemData {
  if (i.form === "vehicle") return buildVehicle(i);
  const terms = i.terms;
  const trig = terms[0].kind !== "pow";
  const xa = limitsToX(terms, i.a), xb = limitsToX(terms, i.b);
  const W = integrate(terms, xa, xb);
  const fT = forceTex(terms), fP = forcePlain(terms);
  const aTex = trig ? trigX(i.a, (terms[0] as { k: number }).k) : numTex(i.a);
  const bTex = trig ? trigX(i.b, (terms[0] as { k: number }).k) : numTex(i.b);
  const aText = trig ? `${aTex}`.replace(/\\dfrac\{(.*)\}\{(\d+)\}/, "$1/$2").replace(/\\pi/g, "π") : String(i.a);
  const bText = trig ? `${bTex}`.replace(/\\dfrac\{(.*)\}\{(\d+)\}/, "$1/$2").replace(/\\pi/g, "π") : String(i.b);
  const recip = terms[0].kind === "pow" && terms[0].p === -1;

  const steps: MechProblemData["steps"] = [];
  let prompt: string, known: string[], answer: MechProblemData["answer"];
  const atLimits = `from $x = ${aText}$ to $x = ${bText}$`;
  const fTextForce = i.ask === "k" ? `$F = kx^{${(terms[0] as { p: number }).p}}$ N` : `$F = ${fT}$ N`;
  const power = terms[0].kind === "pow" ? terms[0].p : 1;

  // antiderivative pieces for the working
  const pieces = terms.map((t) => {
    if (t.kind === "pow" && t.p !== -1) return { t, c: t.c / (t.p + 1), e: t.p + 1 };
    return { t, c: t.c, e: 0 };
  });
  const antiTex = (): string => pieces.map((p, idx) => {
    const t = p.t;
    let body: string;
    if (t.kind === "pow") body = t.p === -1 ? `${coefTex(Math.abs(t.c))}\\ln x` : `${coefTex(Math.abs(p.c))}x${expTex(p.e)}`;
    else if (t.kind === "sin") { body = `${coefTex(Math.abs(t.c / t.k))}\\cos${t.k === 1 ? " x" : `(${t.k}x)`}`; }
    else body = `${coefTex(Math.abs(t.c / t.k))}\\sin${t.k === 1 ? " x" : `(${t.k}x)`}`;
    const neg = t.kind === "pow" ? p.c < 0 : t.kind === "sin" ? t.c / t.k > 0 : t.c / t.k < 0;
    return idx === 0 ? `${neg ? "-" : ""}${body}` : `${neg ? "-" : "+"} ${body}`;
  }).join(" ");
  const subTex = (x: number, xTexStr: string, m: number): string => pieces.map((p, idx) => {
    const t = p.t;
    let val: string;
    if (t.kind === "pow") {
      if (t.p === -1) val = `${numTex(Math.abs(t.c))}\\ln ${xTexStr}`;
      else val = `${Math.abs(p.c) === 1 ? "" : `${numTex(Math.abs(p.c))}\\times `}${xTexStr}${p.e === 1 ? "" : `^{${p.e === 1.5 ? "\\frac{3}{2}" : p.e}}`}`;
      void x;
    } else {
      const q = QUARTER(t.kind === "sin" ? "cos" : "sin", m);
      const coef = Math.abs(t.c / t.k);
      val = `${coef === 1 ? "" : `${numTex(coef)}\\times `}${q}`;
    }
    const neg = t.kind === "pow" ? p.c < 0 : t.kind === "sin" ? t.c / t.k > 0 : t.c / t.k < 0;
    return idx === 0 ? `${neg ? "-" : ""}${val}` : `${neg ? "-" : "+"} ${val}`;
  }).join(" ");
  void subTex;
  const valuesLine = (x: number): string => pieces.map((p, idx) => {
    const t = p.t;
    const v = antiderivative([t], x);
    const s = t.kind === "pow" && t.p === -1 ? `${numTex(Math.abs(t.c))}\\ln ${numTex(x)}` : numTex(Math.abs(Number(v.toPrecision(12))));
    return idx === 0 ? `${v < 0 ? "-" : ""}${s}` : `${v < 0 ? "-" : "+"} ${s}`;
  }).join(" ");

  if (i.ask === "work") {
    prompt = `A particle moves in a straight line under a force ${fTextForce}, where $x$ metres is its displacement from a fixed point O. Find the work done by the force ${atLimits}.${recip && i.exact ? " Give your answer in exact form." : " Give your answer to 3 significant figures."}`;
    known = [`F = ${fT}\\ \\text{N}`, `x\\ \\text{from}\\ ${aTex}\\ \\text{to}\\ ${bTex}`];
    steps.push({ caption: "Work done by a variable force is the integral of the force", lines: [`W = \\displaystyle\\int_{${aTex}}^{${bTex}} \\left(${fT}\\right)\\,\\mathrm{d}x`] });
    steps.push({ caption: "Integrate each term", lines: [`= \\left[\\,${antiTex()}\\,\\right]_{${aTex}}^{${bTex}}`] });
    if (recip) {
      const c = terms[0].c;
      steps.push({ caption: "Substitute the limits", lines: [`= ${numTex(c)}\\ln ${numTex(i.b)} - ${numTex(c)}\\ln ${numTex(i.a)}`, `= ${numTex(c)}\\ln\\dfrac{${numTex(i.b)}}{${numTex(i.a)}}`] });
      steps.push({ caption: i.exact ? "Simplify" : "Evaluate", lines: i.exact ? [`W = ${numTex(c)}\\ln ${numTex(i.b / i.a)}\\ \\text{J}`] : [`W = ${u(sig(W, 3), "J")}\\ (3\\text{ s.f.})`] });
      answer = i.exact ? { value: W, unit: "J", tex: `${numTex(c)}\\ln ${numTex(i.b / i.a)}\\ \\text{J}`, text: `${c} ln ${i.b / i.a} J` } : { value: sig(W, 3), unit: "J", tex: u(sig(W, 3), "J"), text: ut(sig(W, 3), "J") };
    } else {
      steps.push({ caption: "Substitute the upper limit, then the lower limit", lines: [`= \\left(${trig ? subTex(xb, bTex, i.b) : valuesLine(xb)}\\right) - \\left(${trig ? subTex(xa, aTex, i.a) : valuesLine(xa)}\\right)`] });
      steps.push({ caption: "Evaluate", lines: [`W = ${numTex(Number(W.toPrecision(12)))}\\ \\text{J}`] });
      const v = Number.isInteger(Number(W.toPrecision(12))) ? Number(W.toPrecision(12)) : sig(W, 3);
      answer = { value: v, unit: "J", tex: u(v, "J"), text: ut(v, "J") };
    }
  } else if (i.ask === "k") {
    const p = power;
    prompt = `A particle moves in a straight line under a force $F = kx^{${p}}$ N, where $k$ is a constant and $x$ metres is its displacement from a fixed point O. The work done by the force ${atLimits} is ${ut(W, "J")}. Find the value of $k$.`;
    known = [`F = kx^{${p}}\\ \\text{N}`, `W = ${u(W, "J")}`, `x\\ \\text{from}\\ ${aTex}\\ \\text{to}\\ ${bTex}`];
    const k = terms[0].c, A = (i.b ** (p + 1) - i.a ** (p + 1)) / (p + 1);
    steps.push({ caption: "Write the work done as an integral and integrate", lines: [`W = \\displaystyle\\int_{${aTex}}^{${bTex}} kx^{${p}}\\,\\mathrm{d}x`, `= \\left[\\dfrac{kx^{${p + 1}}}{${p + 1}}\\right]_{${aTex}}^{${bTex}}`] });
    steps.push({ caption: "Substitute the limits", lines: [`= \\dfrac{k}{${p + 1}}\\left(${numTex(i.b)}^{${p + 1}} - ${numTex(i.a)}^{${p + 1}}\\right)`, `= ${numTex(A)}k`] });
    steps.push({ caption: "Equate to the work done and solve for k", lines: [`${numTex(A)}k = ${numTex(W)}`, `k = ${numTex(k)}`] });
    answer = { value: k, unit: `N m⁻${SUP[p] || ""}`.replace("⁻¹", "⁻¹"), tex: `${numTex(k)}`, text: String(k) };
  } else {
    const p = power, k = terms[0].c, a = i.a, b = i.b;
    const coef = k / (p + 1);
    prompt = `A particle moves in a straight line under a force $F = ${k === 1 ? "" : k}x${SUP[p]}$ N, where $x$ metres is its displacement from a fixed point O. The work done by the force as the particle moves from $x = ${a}$ to $x = X$ is ${ut(W, "J")}, where $X > ${a}$. Find the value of $X$.`;
    known = [`F = ${coefTex(k)}x${expTex(p)}\\ \\text{N}`, `W = ${u(W, "J")}`, `x\\ \\text{from}\\ ${numTex(a)}\\ \\text{to}\\ X`];
    steps.push({ caption: "Write the work done as an integral and integrate", lines: [`W = \\displaystyle\\int_{${numTex(a)}}^{X} ${coefTex(k)}x${expTex(p)}\\,\\mathrm{d}x`, `= \\left[${coefTex(coef)}x${expTex(p + 1)}\\right]_{${numTex(a)}}^{X}`] });
    steps.push({ caption: "Substitute the limits and set equal to the work done", lines: [`${coefTex(coef)}X${expTex(p + 1)} - ${numTex(coef * a ** (p + 1))} = ${numTex(W)}`, `${coefTex(coef)}X${expTex(p + 1)} = ${numTex(W + coef * a ** (p + 1))}`, `X${expTex(p + 1)} = ${numTex(b ** (p + 1))}`] });
    steps.push({ caption: "Solve for X (X is positive)", lines: [`X = ${numTex(b)}`] });
    answer = { value: b, unit: "m", tex: u(b, "m"), text: ut(b, "m") };
  }

  const fx = (x: number) => forceAt(terms, x);
  void fx;
  const raw = buildForceDisplacement({
    shape: SHAPE[i.form], curveLabel: L(`F = ${fP}`),
    x1: L(aText), x2: i.ask === "limit" ? L(bText, "X") : L(bText), areaLabel: i.ask === "k" ? L(`W = ${sfTex(W)} J`) : L("W", "W"),
  });
  return { sub: "variable", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["graph"]), display: i.display, known, steps, answer, inputs: { ...i, terms: JSON.stringify(terms) } };
}

function buildVehicle(i: VariableInput): MechProblemData {
  const WD = i.D * i.X;
  const WR = (i.r * i.X ** (i.n + 1)) / (i.n + 1);
  const net = WD - WR;
  const v = sig(speedFromKE(i.m, net), 3);
  const res = `${i.r === 1 ? "" : i.r}x${i.n === 1 ? "" : `^{${i.n}}`}`;
  const prompt = `A vehicle of mass ${ut(i.m, "kg")} starts from rest and moves in a straight line along a horizontal road. The driving force is a constant ${ut(i.D, "N")}. When the vehicle has moved a distance of $x$ metres from its starting point, the resistance to motion is $${res}$ N. Find the speed of the vehicle when $x = ${i.X}$. Give your answer to 3 significant figures.`;
  const known = [`m = ${u(i.m, "kg")}`, `D = ${u(i.D, "N")}`, `R = ${res}\\ \\text{N}`, `x = ${u(i.X, "m")}`];
  const steps: MechProblemData["steps"] = [
    { caption: "The driving force is constant: work = force × distance", lines: [`W_D = ${numTex(i.D)} \\times ${numTex(i.X)}`, `= ${u(WD, "J")}`] },
    { caption: "The resistance varies with x, so integrate it", lines: [`W_R = \\displaystyle\\int_{0}^{${numTex(i.X)}} ${res}\\,\\mathrm{d}x`, `= \\left[\\dfrac{${i.r === 1 ? "" : `${i.r}`}x^{${i.n + 1}}}{${i.n + 1}}\\right]_{0}^{${numTex(i.X)}}`, `= \\dfrac{${numTex(i.r)} \\times ${numTex(i.X)}^{${i.n + 1}}}{${i.n + 1}}`, `= ${u(Number(WR.toPrecision(12)), "J")}`] },
    { caption: "Work-energy principle: work done by driving force − work done against resistance = change in kinetic energy", lines: [`W_D - W_R = \\tfrac{1}{2}mv^{2} - 0`, `\\tfrac{1}{2} \\times ${numTex(i.m)}\\times v^{2} = ${numTex(WD)} - ${numTex(Number(WR.toPrecision(12)))}`, `${numTex(i.m / 2)}v^{2} = ${numTex(Number(net.toPrecision(12)))}`] },
    { caption: "Solve for v", lines: [`v^{2} = ${sfTex(net / (i.m / 2), 6)}`, `v = ${u(v, "m s⁻¹")}\\ (3\\text{ s.f.})`] },
  ];
  const raw = buildHorizontal({ body: "block", forces: [{ kind: "driving", label: L(ut(i.D, "N")) }, { kind: "resistance", label: L(`${i.r === 1 ? "" : i.r}x${i.n === 1 ? "" : SUP[i.n]} N`) }], weightAndNormal: false, distance: { label: L(ut(i.X, "m")), from: "A", to: "B" } });
  return { sub: "variable", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "forces", "measure"]), display: i.display, known, steps, answer: { value: v, unit: "m s⁻¹", tex: u(v, "m s⁻¹"), text: ut(v, "m s⁻¹") }, inputs: { ...i, terms: "[]" } };
}

const pickOf = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function generateVariable(level: number, o: { forms: string; ask: string; format: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const forms = o.forms.split(",").filter(Boolean) as Form[];
  const form: Form = level === 3 ? "vehicle" : pickOf<Form>(forms.length ? forms : ["poly"]);
  const asks = o.ask.split(",").filter(Boolean);
  let ask = pickOf(asks.length ? asks : ["work"]) as VariableInput["ask"];
  const base = { level, course: o.course, display: o.display, exact: o.format === "exact", m: 0, D: 0, r: 0, n: 0, X: 0 };
  if (form === "vehicle") {
    for (let tries = 0; tries < 200; tries++) {
      const n = pickOf([1, 2]);
      const m = inRange([400, 1500, 50]), D = inRange([300, 900, 50]), X = inRange([30, 120, 10]);
      const r = n === 2 ? inRange([1, 5, 1]) / 100 : inRange([5, 25, 5]) / 10;
      const WR = (r * X ** (n + 1)) / (n + 1), net = D * X - WR;
      if (net <= 0.3 * D * X) continue;
      const vv = Math.sqrt((2 * net) / m);
      if (vv < 4 || vv > 30) continue;
      return buildVariable({ ...base, form: "vehicle", ask: "speed", terms: [], a: 0, b: X, m, D, r, n, X });
    }
  }
  if (form === "vehicle") return buildVariable({ ...base, form: "vehicle", ask: "speed", terms: [], a: 0, b: 90, m: 800, D: 600, r: 0.02, n: 2, X: 90 });
  let terms: ForceTerm[], a: number, b: number;
  const trigMode = form === "trig";
  if (form === "poly") {
    const n = pickOf([1, 2, 3]);
    terms = [{ kind: "pow", c: (n + 1) * inRange([1, 4, 1]), p: n }];
    if (ask === "work" && Math.random() < 0.6) terms.push({ kind: "pow", c: inRange([1, 9, 1]), p: 0 });
    a = inRange([0, 2, 1]); b = a + inRange([1, 3, 1]);
  } else if (form === "power") {
    const n = pickOf([1, 2, 3]);
    terms = [{ kind: "pow", c: (n + 1) * inRange([1, 5, 1]), p: n }];
    a = inRange([0, 2, 1]); b = a + inRange([1, 3, 1]);
  } else if (form === "sqrt") {
    ask = "work";
    terms = [{ kind: "pow", c: 3 * inRange([1, 6, 1]), p: 0.5 }];
    const sq = [1, 4, 9, 16, 25];
    const ia = inRange([0, 2, 1]);
    a = sq[ia]; b = sq[ia + inRange([1, 2, 1])];
  } else if (form === "recip") {
    ask = "work";
    terms = [{ kind: "pow", c: inRange([2, 12, 1]), p: -1 }];
    a = inRange([1, 3, 1]); b = a * inRange([2, 4, 1]);
  } else {
    ask = "work";
    const kind = pickOf(["sin", "cos"] as const), k = pickOf([1, 2]);
    terms = [{ kind, c: k * inRange([2, 8, 1]), k }];
    const ma = inRange([0, 2, 1]), mb = ma + inRange([1, 3, 1]);
    a = ma; b = mb;
    if (integrate(terms, (a * Math.PI) / (2 * k), (b * Math.PI) / (2 * k)) <= 1e-9) return generateVariable(level, o);
  }
  if (!trigMode && (form === "sqrt" || form === "recip") && ask !== "work") ask = "work";
  if (ask === "k" || ask === "limit") {
    const p = (terms[0] as { p: number }).p;
    if (form !== "power" && form !== "poly") ask = "work";
    else {
      const c = (p + 1) * inRange([1, 5, 1]);
      terms = [{ kind: "pow", c: ask === "limit" ? c : c, p }];
      if (ask === "limit") { a = inRange([0, 2, 1]); b = a + inRange([1, 3, 1]); }
    }
  }
  return buildVariable({ ...base, form, ask, terms, a, b });
}
