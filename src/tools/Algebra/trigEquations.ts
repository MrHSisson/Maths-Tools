// Solving Trig Equations — the maths, the working and the developing picture (spec: specs/solving-trig-equations.md).
// Everything is built BACKWARDS from a chosen exact (or 2-decimal) value k, so every question has solutions in its range and the
// working, the answer and the picture all come from one list of solutions (R5).
//
// Angles are held in their NATIVE unit throughout: degrees as plain numbers, radians as floats (multiples of π/72 when exact).
import { mStep, graphStep, fmt, type WorkingStep, type GraphBuildSpec } from "../../shared";
import type { FOI } from "../../shared";

export type Fn = "sin" | "cos" | "tan";
export type Unit = "deg" | "rad";
export type FormKind = "direct" | "scaled" | "shifted" | "negative";
type RangeId = "r360" | "r720" | "rSym180" | "rSym360" | "r180";

/** Range of θ in degrees (shown as multiples of π in radians). */
export const RANGES: Record<RangeId, [number, number]> = {
  r360: [0, 360], r720: [0, 720], rSym180: [-180, 180], rSym360: [-360, 360], r180: [0, 180],
};

const D2R = Math.PI / 180;
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

// ── Exact values: (p/q)·√r ───────────────────────────────────────────────────────────────────────────────────────────────
export interface Ex { p: number; q: number; r: 1 | 2 | 3 }
export const ex = (p: number, q: number, r: 1 | 2 | 3 = 1): Ex => { const g = gcd(p, q) || 1; return { p: p / g, q: q / g, r }; };
const exNum = (e: Ex): number => (e.p / e.q) * Math.sqrt(e.r);
const exNeg = (e: Ex): Ex => ({ ...e, p: -e.p });
const exMul = (e: Ex, a: number): Ex => ex(e.p * a, e.q, e.r);

function exTex(e: Ex): string {
  if (e.p === 0) return "0";
  const neg = e.p < 0;
  const p = Math.abs(e.p);
  const coef = p === 1 && e.r !== 1 ? "" : String(p);
  const root = e.r === 1 ? "" : `\\sqrt{${e.r}}`;
  const body = e.q === 1 ? `${coef}${root}` : `\\dfrac{${coef}${root}}{${e.q}}`;
  return (neg ? "-" : "") + body;
}
const texSum = (parts: Ex[]): string => {
  const nz = parts.filter((e) => e.p !== 0);
  if (nz.length === 0) return "0";
  return nz.map((e, i) => (i === 0 ? exTex(e) : e.p < 0 ? ` - ${exTex(exNeg(e))}` : ` + ${exTex(e)}`)).join("");
};

/** Exact values offered for sin / cos (±½, ±√2/2, ±√3/2) and tan (±√3/3, ±1, ±√3), plus the single-solution cases. */
export function exactValues(fn: Fn, extremes: boolean): Ex[] {
  const mags = fn === "tan" ? [ex(1, 3, 3), ex(1, 1), ex(1, 1, 3)] : [ex(1, 2), ex(1, 2, 2), ex(1, 2, 3)];
  const out = mags.flatMap((m) => [m, exNeg(m)]);
  if (extremes) out.push(ex(0, 1), ...(fn === "tan" ? [] : [ex(1, 1), ex(-1, 1)]));
  return out;
}

/** Decimal values (hundredths): 0.10–0.95 for sin and cos, 0.2–5 for tan, never the exact ones (0.5, 1). */
export function decimalValues(fn: Fn): number[] {
  const out: number[] = [];
  const hi = fn === "tan" ? 500 : 95, lo = fn === "tan" ? 20 : 10;
  for (let v = lo; v <= hi; v += 5) if (v !== 50 && v !== 100) out.push(v, -v);
  return out;
}

// ── Angles in their native unit ──────────────────────────────────────────────────────────────────────────────────────────
const natOf = (unit: Unit, deg: number): number => (unit === "deg" ? deg : deg * D2R);

/** Radians as a multiple of π (x must be a multiple of π/72): `\dfrac{5\pi}{12}`, `\pi`, `0`. */
function radTex(x: number): string {
  const m = Math.round(x / (Math.PI / 72));
  if (m === 0) return "0";
  const g = gcd(m, 72), n = Math.abs(m) / g, d = 72 / g;
  const top = n === 1 ? "\\pi" : `${n}\\pi`;
  return `${m < 0 ? "-" : ""}${d === 1 ? top : `\\dfrac{${top}}{${d}}`}`;
}
const radPlain = (x: number): string => {
  const m = Math.round(x / (Math.PI / 72));
  if (m === 0) return "0";
  const g = gcd(m, 72), n = Math.abs(m) / g, d = 72 / g;
  const top = n === 1 ? "π" : `${n}π`;
  return `${m < 0 ? "−" : ""}${d === 1 ? top : `${top}/${d}`}`;
};
const radReducedDen = (x: number): number => { const m = Math.round(x / (Math.PI / 72)); return 72 / (gcd(m, 72) || 1); };
const isMultipleOfPi72 = (x: number): boolean => Math.abs(x / (Math.PI / 72) - Math.round(x / (Math.PI / 72))) < 1e-6;

// ── The spec of one question ─────────────────────────────────────────────────────────────────────────────────────────────
export interface TrigSpec {
  fn: Fn;
  unit: Unit;
  /** k as an exact value, or as hundredths (decimal mode). */
  kEx?: Ex;
  kDec?: number;
  form: FormKind;
  a: number;        // multiplier on the trig term (rearranged forms)
  b: number;        // constant on the left (rearranged forms)
  kArg: number;     // coefficient of θ inside: 1, 2, 3 or 0.5
  cDeg: number;     // shift inside, in degrees (π/12 multiples when in radians)
  /** A named range, or any [low, high] in degrees (the range bar gives multiples of 180). */
  range: RangeId | [number, number];
  /** Allow a solution exactly on an end of the range (only with "Include 0 and ±1"); otherwise such questions are rejected. */
  allowEdge?: boolean;
}

interface TrigBuilt {
  key: string;
  display: string;
  displayLatex: string;
  answer: string;
  answerLatex: string;
  working: WorkingStep[];
  solutions: number[];      // θ in native units, ascending (exact, unrounded)
}

interface Solution { u: number; base: number; n: number; theta: number }

export const kNumber = (s: TrigSpec): number => (s.kEx ? exNum(s.kEx) : (s.kDec ?? 0) / 100);

// ── Text helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const fnTex = (fn: Fn) => `\\${fn}`;

function argTex(kArg: number, cNat: number, unit: Unit): string {
  const kPart = kArg === 1 ? "\\theta" : kArg === 0.5 ? "\\dfrac{\\theta}{2}" : `${kArg}\\theta`;
  if (Math.abs(cNat) < 1e-9) return kPart;
  const mag = unit === "deg" ? `${fmt(Math.abs(cNat), 2)}^\\circ` : radTex(Math.abs(cNat));
  return `${kPart} ${cNat < 0 ? "-" : "+"} ${mag}`;
}
const applyFn = (fn: Fn, arg: string, plain: boolean): string => (plain ? `${fnTex(fn)}\\theta` : `${fnTex(fn)}\\left(${arg}\\right)`);

function angTex(x: number, unit: Unit): string {
  return unit === "deg" ? `${fmt(x, 2)}^\\circ` : radTex(x);
}
/** An angle in a working chain: plain number in degrees (no unit sign), π form in radians. */
function chainNum(x: number, unit: Unit, mode: "exact" | "decimal"): string {
  if (mode === "exact") return unit === "deg" ? fmt(x, 2) : radTex(x);
  return unit === "deg" ? x.toFixed(2) : x.toFixed(4);
}
function finalNum(x: number, unit: Unit, mode: "exact" | "decimal"): string {
  if (mode === "exact") return unit === "deg" ? fmt(x, 2) : radTex(x);
  return unit === "deg" ? x.toFixed(1) : Number(x.toPrecision(3)).toString();
}
const finalWithUnit = (x: number, unit: Unit, mode: "exact" | "decimal"): string => (unit === "deg" ? `${finalNum(x, unit, mode)}^\\circ` : finalNum(x, unit, mode));
const finalPlain = (x: number, unit: Unit, mode: "exact" | "decimal"): string => {
  if (mode === "exact") return unit === "deg" ? `${fmt(x, 2)}°` : radPlain(x);
  return unit === "deg" ? `${x.toFixed(1)}°` : Number(x.toPrecision(3)).toString();
};
const toPlain = (t: string): string => t
  .replace(/\\sqrt\{(\d)\}/g, "√$1").replace(/\\pi/g, "π")
  .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2").replace(/\\left|\\right/g, "")
  .replace(/\^\\circ/g, "°").replace(/\\theta/g, "θ")
  .replace(/\\le/g, "≤").replace(/\\quad|\\ /g, " ").replace(/\\(sin|cos|tan)/g, "$1").replace(/\s+/g, " ").replace(/(\d)-/g, "$1 −").replace(/-(\d)/g, "−$1").trim();

// ── Solving ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Base { val: number; second: boolean }

function principal(fn: Fn, k: number, exact: boolean, unit: Unit): number {
  let a = fn === "sin" ? Math.asin(k) : fn === "cos" ? Math.acos(k) : Math.atan(k);   // radians
  if (exact) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);                     // exact values sit on multiples of 15°
  return unit === "deg" ? a / D2R : a;
}

/** The unique first-cycle solutions: principal value, and (sin, cos) the symmetric one. */
function bases(fn: Fn, alpha: number, half: number, full: number, eps: number): Base[] {
  const out: Base[] = [{ val: alpha, second: false }];
  if (fn === "tan") return out;
  const beta = fn === "sin" ? half - alpha : full - alpha;
  const period = full;
  const same = Math.abs(((beta - alpha) % period + period) % period) < eps || Math.abs(((beta - alpha) % period + period) % period - period) < eps;
  if (!same) out.push({ val: beta, second: true });
  return out;
}

// ── Build ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Builds a question from its spec, or null if it breaks a constraint (the generator then tries another spec). */
export function buildTrigQuestion(s: TrigSpec): TrigBuilt | null {
  const { fn, unit } = s;
  const mode: "exact" | "decimal" = s.kEx ? "exact" : "decimal";
  const k = kNumber(s);
  const eps = unit === "deg" ? 1e-7 : 1e-9;
  const FULL = natOf(unit, 360), HALF = natOf(unit, 180);
  const P = fn === "tan" ? HALF : FULL;
  const c = natOf(unit, s.cDeg);
  const kArg = s.kArg;
  const [loDeg, hiDeg] = Array.isArray(s.range) ? s.range : RANGES[s.range];
  const lo = natOf(unit, loDeg), hi = natOf(unit, hiDeg);
  const uLo = kArg * lo + c, uHi = kArg * hi + c;
  const hasArg = kArg !== 1 || Math.abs(c) > 1e-9;
  const U = hasArg ? "u" : "\\theta";

  // exact solution set
  const alpha = principal(fn, k, mode === "exact", unit);
  const bs = bases(fn, alpha, HALF, FULL, eps);
  const sols: Solution[] = [];
  for (const b of bs) for (let n = -40; n <= 40; n++) {
    const u = b.val + n * P;
    if (u >= uLo - eps && u <= uHi + eps) sols.push({ u, base: b.val, n, theta: (u - c) / kArg });
  }
  sols.sort((x, y) => x.u - y.u);
  for (let i = sols.length - 1; i > 0; i--) if (Math.abs(sols[i].u - sols[i - 1].u) < eps * 10) sols.splice(i, 1);
  // up to 6 solutions, or as many as a wide range naturally gives (about two per turn of the function)
  const maxSols = Math.max(6, Math.ceil((uHi - uLo) / P) * 2);
  if (sols.length < 1 || sols.length > maxSols) return null;
  if (!s.allowEdge && sols.some((x) => Math.abs(x.theta - lo) < eps * 10 || Math.abs(x.theta - hi) < eps * 10)) return null;
  // decimal answers must not sit on a range boundary
  if (mode === "decimal" && sols.some((x) => Math.abs(x.theta - lo) < 1e-3 || Math.abs(x.theta - hi) < 1e-3)) return null;
  // exact answers must be whole degrees at Levels 2–3 (L3: always whole; L2 may be a half), and tidy π-fractions in radians
  if (mode === "exact") {
    for (const x of sols) {
      if (unit === "deg") {
        if (Math.abs(x.theta * 2 - Math.round(x.theta * 2)) > 1e-6) return null;                 // at most a half degree
        if (hasArg && Math.abs(c) > 1e-9 && Math.abs(x.theta - Math.round(x.theta)) > 1e-6) return null; // shifted: whole degrees
      } else if (!isMultipleOfPi72(x.theta) || radReducedDen(x.theta) > 36) return null;
    }
  }

  // decimal mode: the working shows 2 d.p. (degrees) / 4 d.p. (radians); the answer is rounded from the unrounded value
  const dp = unit === "deg" ? 2 : 4;
  const rnd = (x: number) => Number(x.toFixed(dp));
  let display = sols.map((x) => ({ ...x, ud: x.u }));
  let alphaD = alpha;
  if (mode === "decimal") {
    const halfD = rnd(HALF), fullD = rnd(FULL);
    alphaD = rnd(alpha);
    const baseD = new Map<number, number>();
    for (const b of bs) baseD.set(b.val, b.second ? (fn === "sin" ? rnd(halfD - alphaD) : rnd(fullD - alphaD)) : alphaD);
    const PD = fn === "tan" ? halfD : fullD;
    display = sols.map((x) => ({ ...x, ud: rnd((baseD.get(x.base) ?? x.base) + x.n * PD) }));
    for (const x of display) {
      const thetaD = (x.ud - c) / kArg;
      if (finalNum(thetaD, unit, mode) !== finalNum(x.theta, unit, mode)) return null;   // working must lead to the printed answer
    }
  }

  // ── The question ──
  const arg = argTex(kArg, c, unit);
  const f = applyFn(fn, arg, !hasArg);
  const kTex = s.kEx ? exTex(s.kEx) : fmt((s.kDec ?? 0) / 100, 2);
  const rangeTex = unit === "deg"
    ? `${loDeg}^\\circ \\le \\theta \\le ${hiDeg}^\\circ`
    : `${radTex(lo)} \\le \\theta \\le ${radTex(hi)}`;

  let lhs = f, rhs = kTex;
  let aK: Ex | undefined;
  const pre: WorkingStep[] = [];
  const A = s.a, B = s.b;
  if (s.form !== "direct") {
    if (s.kEx) {
      aK = exMul(s.kEx, A);
      const rational = aK.r === 1;
      if (s.form === "scaled") { lhs = `${A}${f}`; rhs = exTex(aK); }
      else if (s.form === "shifted") {
        lhs = `${A}${f} ${B < 0 ? "-" : "+"} ${Math.abs(B)}`;
        rhs = rational ? exTex(ex(aK.p + B * aK.q, aK.q)) : texSum([aK, ex(B, 1)]);
      } else {
        lhs = `${B} - ${A}${f}`;
        rhs = rational ? exTex(ex(B * aK.q - aK.p, aK.q)) : texSum([ex(B, 1), exNeg(aK)]);
      }
      const kLine = [`${f} = \\dfrac{${exTex(aK)}}{${A}}`, `= ${kTex}`];
      if (s.form === "scaled") pre.push(mStep(`Divide both sides by ${A}:`, kLine));
      else if (s.form === "shifted") {
        pre.push(mStep(`${B < 0 ? "Add" : "Subtract"} ${Math.abs(B)} ${B < 0 ? "to" : "from"} both sides:`, `${A}${f} = ${exTex(aK)}`));
        pre.push(mStep(`Divide both sides by ${A}:`, kLine));
      } else {
        pre.push(mStep(`Subtract ${B} from both sides:`, `-${A}${f} = ${exTex(exNeg(aK))}`));
        pre.push(mStep(`Divide both sides by -${A}:`, [`${f} = \\dfrac{${exTex(exNeg(aK))}}{-${A}}`, `= ${kTex}`]));
      }
    } else {
      const k100 = s.kDec ?? 0;
      const aK100 = A * k100;
      const d = (h: number) => fmt(h / 100, 2);
      if (s.form === "scaled") { lhs = `${A}${f}`; rhs = d(aK100); }
      else if (s.form === "shifted") { lhs = `${A}${f} ${B < 0 ? "-" : "+"} ${Math.abs(B)}`; rhs = d(aK100 + 100 * B); }
      else { lhs = `${B} - ${A}${f}`; rhs = d(100 * B - aK100); }
      const kLine = [`${f} = \\dfrac{${d(aK100)}}{${A}}`, `= ${kTex}`];
      if (s.form === "scaled") pre.push(mStep(`Divide both sides by ${A}:`, kLine));
      else if (s.form === "shifted") {
        pre.push(mStep(`${B < 0 ? "Add" : "Subtract"} ${Math.abs(B)} ${B < 0 ? "to" : "from"} both sides:`, `${A}${f} = ${d(aK100)}`));
        pre.push(mStep(`Divide both sides by ${A}:`, kLine));
      } else {
        pre.push(mStep(`Subtract ${B} from both sides:`, `-${A}${f} = ${d(-aK100)}`));
        pre.push(mStep(`Divide both sides by -${A}:`, [`${f} = \\dfrac{${d(-aK100)}}{-${A}}`, `= ${kTex}`]));
      }
    }
  }
  const displayLatex = `\\begin{array}{c} ${lhs} = ${rhs}, \\\\[0.7em] ${rangeTex} \\end{array}`;

  // ── The working ──
  type Tag = "pre" | "range" | "principal" | "second" | "period" | "reverse" | "answer";
  const steps: { s: WorkingStep; tag: Tag }[] = pre.map((p) => ({ s: p, tag: "pre" as Tag }));
  const add = (st: WorkingStep, tag: Tag) => steps.push({ s: st, tag });

  if (hasArg) {
    const frags: string[] = [`${rangeTex}`];
    const kRange = (kArg === 1) ? null : kArg === 0.5
      ? `${angTex(kArg * lo, unit)} \\le \\dfrac{\\theta}{2} \\le ${angTex(kArg * hi, unit)}`
      : `${angTex(kArg * lo, unit)} \\le ${kArg}\\theta \\le ${angTex(kArg * hi, unit)}`;
    if (kRange) frags.push(`\\Rightarrow\\ ${kRange}`);
    if (Math.abs(c) > 1e-9) frags.push(`\\Rightarrow\\ ${angTex(uLo, unit)} \\le ${arg} \\le ${angTex(uHi, unit)}`);
    add(mStep(`Let u = the angle inside the ${fn} function, and find its range:`, frags), "range");
    add(mStep("Rewrite the equation in terms of u:", `${fnTex(fn)}\\,u = ${kTex}`), "range");
  }

  const nm = (x: number) => chainNum(x, unit, mode);
  const inv = `${fnTex(fn)}^{-1}\\left(${kTex}\\right)`;
  const alphaTxt = mode === "decimal" ? nm(alphaD) : nm(alpha);
  add(mStep(`Principal value, using inverse ${fn}:`, `${U} = ${inv} = ${alphaTxt}`), "principal");

  const secondBase = bs.find((b) => b.second);
  const halfTxt = nm(mode === "decimal" ? rnd(HALF) : HALF), fullTxt = nm(mode === "decimal" ? rnd(FULL) : FULL);
  if (secondBase) {
    const bTxt = mode === "decimal"
      ? nm(fn === "sin" ? rnd(rnd(HALF) - alphaD) : rnd(rnd(FULL) - alphaD))
      : nm(secondBase.val);
    const refl = fn === "sin" ? halfTxt : fullTxt;
    const aT = alphaTxt.startsWith("-") ? `(${alphaTxt})` : alphaTxt;
    add(mStep(`${fn === "sin" ? "The sine" : "The cosine"} graph is symmetrical, so a second solution is:`, [`${U} = ${refl} - ${aT}`, `= ${bTxt}`]), "second");
  }

  const baseDisp = (val: number): number => (mode === "decimal"
    ? (Math.abs(val - alpha) < 1e-9 ? alphaD : (fn === "sin" ? rnd(rnd(HALF) - alphaD) : rnd(rnd(FULL) - alphaD))) : val);
  const PD = mode === "decimal" ? rnd(P) : P;
  const needPeriod = display.some((x) => x.n !== 0) || bs.some((b) => !display.some((x) => x.n === 0 && Math.abs(x.base - b.val) < 1e-9));
  if (needPeriod) {
    const items = display.map((x, i) => {
      if (x.n === 0) return `${i === 0 ? `${U} = ` : ",\\ "}${nm(x.ud)}`;
      const baseTxt = nm(baseDisp(x.base));
      const shift = nm(Math.abs(x.n) * PD);
      return `${i === 0 ? `${U} = ` : ",\\ "}${baseTxt.startsWith("-") ? `(${baseTxt})` : baseTxt} ${x.n > 0 ? "+" : "-"} ${shift} = ${nm(x.ud)}`;
    });
    const pText = unit === "deg" ? `${fmt(P, 2)}°` : radPlain(P);
    add(mStep(`Add or subtract multiples of ${pText} to find every solution in the range:`, items), "period");
  }

  const finals = display.map((x) => (x.ud - c) / kArg);
  const reverseNeeded = hasArg;
  if (reverseNeeded) {
    const cTxt = unit === "deg" ? fmt(Math.abs(c), 2) : radTex(Math.abs(c));     // in the maths
    const cWord = unit === "deg" ? fmt(Math.abs(c), 2) : radPlain(Math.abs(c));  // in the prose label
    const sub = c > 0 ? `u - ${cTxt}` : `u + ${cTxt}`;
    const noC = Math.abs(c) < 1e-9;
    let formula: string, words: string;
    if (kArg === 1) { formula = sub; words = c > 0 ? `Subtract ${cWord} from each solution:` : `Add ${cWord} to each solution:`; }
    else if (kArg === 0.5) { formula = noC ? "2u" : `2\\left(${sub}\\right)`; words = noC ? "Multiply each solution by 2:" : `${c > 0 ? `Subtract ${cWord} from` : `Add ${cWord} to`} each solution, then multiply by 2:`; }
    else { formula = noC ? `\\dfrac{u}{${kArg}}` : `\\dfrac{${sub}}{${kArg}}`; words = noC ? `Divide each solution by ${kArg}:` : `${c > 0 ? `Subtract ${cWord} from` : `Add ${cWord} to`} each solution, then divide by ${kArg}:`; }
    add(mStep(words, [`\\theta = ${formula}`, `= ${finals.map((x) => finalNum(x, unit, mode)).join(",\\ ")}`]), "reverse");
  }

  const answerLatex = `\\theta = ${finals.map((x) => finalWithUnit(x, unit, mode)).join(",\\ ")}`;
  add(mStep("Answer:", answerLatex), "answer");

  // ── The developing picture: y = f(argument) against θ, the line y = k, and the solutions as they are found ──
  const thetaOf = (u: number) => (u - c) / kArg;
  const stamp: Partial<Record<Tag, number>> = {};
  let nStamp = 0;
  const firstStamped = steps.findIndex((x) => x.tag !== "pre");
  steps.forEach((x, i) => { if (i >= firstStamped) stamp[x.tag] = stamp[x.tag] ?? ++nStamp; });
  const stepOf = (x: Solution): number => {
    if (x.n === 0 && Math.abs(x.base - alpha) < 1e-9) return stamp.principal ?? 1;
    if (x.n === 0 && secondBase && Math.abs(x.base - secondBase.val) < 1e-9) return stamp.second ?? stamp.period ?? 1;
    return stamp.period ?? stamp.principal ?? 1;
  };
  const fois: FOI[] = [];
  const labelOf = (theta: number) => finalPlain(theta, unit, mode);
  display.forEach((x, i) => {
    const th = sols[i].theta;
    const base: FOI = { x: th, y: k, kind: "point", step: stepOf(sols[i]) };
    if (!hasArg) fois.push({ ...base, label: labelOf(th), showLabel: true });
    else {
      fois.push(base);
      fois.push({ x: th, y: k, kind: "point", step: stamp.reverse ?? stamp.answer ?? 1, label: labelOf(th), showLabel: true });
    }
    void x;
  });
  const fnJs = Math[fn];   // the curve is plotted against θ in its native unit; the trig function wants radians
  const guides: NonNullable<GraphBuildSpec["guides"]> = [{ kind: "hLine", at: k, dashed: true, color: "#64748b" }];
  if (fn === "tan") {
    for (let n = -20; n <= 20; n++) {
      const u = natOf(unit, 90 + 180 * n);
      const th = thetaOf(u);
      if (th > lo + 1e-9 && th < hi - 1e-9) guides.push({ kind: "vLine", at: th, dashed: true, color: "#d97706" });
    }
  }
  const yRange = fn === "tan" ? 4 : 1.2;
  const spec: GraphBuildSpec = {
    series: [{ equationType: "custom", fn: (x: number) => fnJs((kArg * x + c) * (unit === "deg" ? D2R : 1)), color: "#2563eb" }],
    fois,
    guides,
    config: {
      domain: { xMin: lo, xMax: hi, yMin: -yRange, yMax: yRange },
      lockDomain: true,
      lockDomainY: true,
      xAxis: { unit },
      axisLabels: { x: unit === "deg" ? "θ (degrees)" : "θ (radians)", y: "y" },
      style: { foi: "#16a34a" },
    },
    height: 340,
  };
  const working = steps.map((x, i) => (i >= firstStamped ? graphStep(x.s, spec, stamp[x.tag] ?? 1) : x.s));

  const key = `${fn}-${s.form}-${s.kEx ? `${s.kEx.p}/${s.kEx.q}r${s.kEx.r}` : `d${s.kDec}`}-a${A}b${B}-k${kArg}c${s.cDeg}-${Array.isArray(s.range) ? s.range.join("to") : s.range}-${unit}`;
  const display0 = toPlain(`${lhs} = ${rhs},\\quad ${rangeTex}`);
  return { key, display: display0, displayLatex, answer: toPlain(answerLatex), answerLatex, working, solutions: sols.map((x) => x.theta) };
}
