// ═══════════════════════════════════════════════════════════════════════════════
// TECHNIQUES — reusable, pedagogically-titled working-step sequences, each
// renderable at a GRAIN.
//
// A technique encodes the pedagogy of one recurring maths move — its step titles
// and its live-model fragments — ONCE. The same move renders at three grains:
//
//   • "full"     — every micro-step ("Subtract 3 from both sides", "Divide by 2").
//                  The fundamental teaching pattern; this grain IS the (text spine
//                  of the) matching skill.
//   • "standard" — the default worked-example grain: each conceptual move a step,
//                  arithmetic folded into the result.
//   • "brief"    — assumes the student can already do this move; one line, keep going.
//                  What a higher-order tool wants for a prerequisite it doesn't teach.
//
// The TOOL chooses the grain per call (a prerequisite move → brief; the move being
// taught → full). A runtime "detailed working" toggle can drive it later.
//
// Sibling of the slide-based skill library (src/shared/skills): skills teach a
// prerequisite in slides; techniques narrate a move in working steps.
// ═══════════════════════════════════════════════════════════════════════════════

import { step, mStep, tStep } from "../helpers";
import type { WorkingStep } from "../types";

export type Grain = "brief" | "standard" | "full";

// ── The authoring builder ────────────────────────────────────────────────────
export interface Workings {
  step(title: string, latex: string | string[]): Workings;
  raw(latex: string | string[]): Workings;
  note(text: string): Workings;
  use(steps: WorkingStep[]): Workings;
  visual(caption: string, payload: unknown): Workings;
  build(): WorkingStep[];
}

export const workings = (): Workings => {
  const out: WorkingStep[] = [];
  const push = (s: WorkingStep) => {
    const prev = out[out.length - 1];
    if (prev && s.latex && prev.latex === s.latex) return; // no restate-the-answer duplication
    out.push(s);
  };
  const api: Workings = {
    step(title, latex) { push(mStep(title, latex)); return api; },
    raw(latex) { push(step(latex)); return api; },
    note(text) { push(tStep(text)); return api; },
    use(steps) { steps.forEach(push); return api; },
    visual(caption, payload) { const g: WorkingStep = tStep(caption); g.extra = payload; out.push(g); return api; },
    build() { return out; },
  };
  return api;
};

// ── Small LaTeX helpers ──────────────────────────────────────────────────────
// A titled first row + one untitled row per subsequent SEPARATE line.
const titledLines = (title: string, lines: string[]): WorkingStep[] =>
  lines.length ? [mStep(title, lines[0]), ...lines.slice(1).map((l) => step(l))] : [];

// " + 3" / " - 3" — a signed term to append.
const signed = (n: number): string => (n < 0 ? `- ${-n}` : `+ ${n}`);
// A coefficient prefix: 1 → "", -1 → "-", else the number.
const coef = (n: number): string => (n === 1 ? "" : n === -1 ? "-" : `${n}`);
// n/d as an integer or a reduced-sign fraction.
const frac = (num: number, den: number): string => {
  if (den === 0) return `${num}`;
  if (num % den === 0) return `${num / den}`;
  const s = (num < 0) !== (den < 0) ? "-" : "";
  return `${s}\\dfrac{${Math.abs(num)}}{${Math.abs(den)}}`;
};

// ── Techniques ────────────────────────────────────────────────────────────────

// Solve a quadratic with the formula.
//   brief    — formula → simplified surd (assumes the substitution).
//   standard — formula → substituted → simplified.
//   full     — + the discriminant arithmetic, the ± split, and the decimals
//              (the skill-level teaching of the formula itself).
export const quadraticFormulaSteps = (a: number, b: number, c: number, v = "x", grain: Grain = "standard"): WorkingStep[] => {
  const disc = b * b - 4 * a * c, twoA = 2 * a;
  const formula = `${v} = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`;
  const subbed = `= \\dfrac{-(${b}) \\pm \\sqrt{(${b})^2 - 4(${a})(${c})}}{2(${a})}`;
  const simplified = `${v} = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${twoA}}`;

  if (grain === "brief") {
    return [mStep("Use the quadratic formula", [formula, `= \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${twoA}}`])];
  }
  if (grain === "full") {
    const r1 = (-b + Math.sqrt(disc)) / twoA, r2 = (-b - Math.sqrt(disc)) / twoA;
    return [
      mStep("Substitute into the quadratic formula", [formula, subbed]),
      mStep("Work out the discriminant", [
        `b^2 - 4ac = (${b})^2 - 4(${a})(${c})`,
        `= ${b * b} - (${4 * a * c})`,
        `= ${disc}`,
      ]),
      mStep("Simplify", [simplified]),
      mStep("Take the + and − in turn", [
        `${v} = \\dfrac{${-b} + \\sqrt{${disc}}}{${twoA}} \\quad \\text{or} \\quad ${v} = \\dfrac{${-b} - \\sqrt{${disc}}}{${twoA}}`,
      ]),
      mStep("As decimals (2 d.p.)", [`${v} \\approx ${r1.toFixed(2)} \\quad \\text{or} \\quad ${v} \\approx ${r2.toFixed(2)}`]),
    ];
  }
  return [
    mStep("Substitute into the quadratic formula", [formula, subbed]),
    mStep("Simplify under the root", [simplified]),
  ];
};

// Solve a linear equation a·v + b = c — the "do the same to both sides" teaching.
//   full     — name each both-sides operation ("Subtract 3 from both sides", …).
//   standard — collect, then divide (two rows).
//   brief    — one line.
export const solveLinearEquationSteps = (a: number, b: number, c: number, v = "x", grain: Grain = "standard"): WorkingStep[] => {
  const rhs = c - b, result = frac(rhs, a);
  if (grain === "brief") return [mStep(`Solve for ${v}`, [`${v} = ${result}`])];
  if (grain === "full") {
    const op = b < 0 ? `Add ${-b} to both sides` : `Subtract ${b} from both sides`;
    const steps: WorkingStep[] = [
      mStep(op, [`${coef(a)}${v} = ${c} ${signed(-b)}`, `${coef(a)}${v} = ${rhs}`]),
    ];
    if (a !== 1) steps.push(mStep(`Divide both sides by ${a}`, [`${v} = \\dfrac{${rhs}}{${a}}`, `${v} = ${result}`]));
    return steps;
  }
  return titledLines(`Solve for ${v}`, a !== 1 ? [`${coef(a)}${v} = ${rhs}`, `${v} = ${result}`] : [`${v} = ${result}`]);
};

// Read the roots off a factorised expression. `roots` are ready LaTeX strings.
export const solveFactorsSteps = (roots: string[], v = "x"): WorkingStep[] => {
  const uniq = roots.filter((r, i) => roots.indexOf(r) === i);
  const line = uniq.map((r) => `${v} = ${r}`).join(" \\quad \\text{or} \\quad ");
  return [mStep("Set each factor equal to zero and solve", [line])];
};

// Substitute a found value (or values) back to get the other unknown. Each line in
// `body` is a SEPARATE row; the title names the value + equation when given.
export const substituteBackSteps = (
  varName: string,
  body: string | string[],
  ctx?: { value?: string; into?: string },
): WorkingStep[] => {
  const title = ctx?.value && ctx?.into
    ? `Substitute ${ctx.value} into ${ctx.into} to find ${varName}`
    : `Substitute back to find ${varName}`;
  return titledLines(title, Array.isArray(body) ? body : [body]);
};

// Rearrange an equation to make a variable the subject.
export const makeSubjectSteps = (
  varName: string, resultLatex: string | string[], eqLabel = "(2)",
): WorkingStep[] => [mStep(`Rearrange equation ${eqLabel} to make ${varName} the subject`, resultLatex)];

// Solve a linear equation from a pre-built chain of lines (one row per move).
export const solveLinearlySteps = (v: string, chain: string[]): WorkingStep[] =>
  titledLines(`Expand and solve for ${v}`, chain);
