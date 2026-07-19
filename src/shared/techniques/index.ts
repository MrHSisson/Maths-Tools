// ═══════════════════════════════════════════════════════════════════════════════
// TECHNIQUES — reusable, pedagogically-titled working-step sequences.
//
// When tools moved onto the shared ToolShell, each tool's hand-authored working
// steps were lost and replaced by thin wrappers that jumped straight to answers.
// A "technique" fixes that at the source: it encodes the pedagogy of ONE recurring
// mathematical move — its step titles and its live-model fragments — ONCE, so every
// tool that performs that move gets the same complete, natural working for free and
// can never silently degrade to "formula → answer" again.
//
// This is the working-step sibling of the slide-based skill library (src/shared/
// skills): skills teach a prerequisite in slides; techniques narrate a move in
// working steps. Both can carry [[skill-id|term]] links.
//
// Grain: MEDIUM. Each conceptual move is its own titled step; substitution INTO a
// formula and expansions are shown; pure arithmetic (4×3=12) is folded into the
// result — the way a teacher models at the board, not every keystroke.
// ═══════════════════════════════════════════════════════════════════════════════

import { step, mStep, tStep } from "../helpers";
import type { WorkingStep } from "../types";

// ── The authoring builder ────────────────────────────────────────────────────
// Tools assemble their working through workings() rather than pushing onto a raw
// array. Titles are mandatory (`.step`), technique blocks splice in via `.use`,
// and consecutive-identical maths lines are dropped — structurally banning the
// "restate the answer as a final step" duplication that plagued the old wrappers.
export interface Workings {
  /** A bespoke titled step. `latex` as string[] = live-model fragments. */
  step(title: string, latex: string | string[]): Workings;
  /** An untitled continuation line (rare — prefer a titled step). */
  raw(latex: string | string[]): Workings;
  /** A plain-text note (no maths). */
  note(text: string): Workings;
  /** Splice in a technique block. */
  use(steps: WorkingStep[]): Workings;
  /** A diagram/graph step: plain caption + arbitrary payload for a stepRenderer. */
  visual(caption: string, payload: unknown): Workings;
  build(): WorkingStep[];
}

export const workings = (): Workings => {
  const out: WorkingStep[] = [];
  const push = (s: WorkingStep) => {
    const prev = out[out.length - 1];
    // Skip a step whose rendered maths repeats the line immediately before it.
    if (prev && s.latex && prev.latex === s.latex) return;
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

// ── Techniques ────────────────────────────────────────────────────────────────

// A titled first row followed by one untitled row per subsequent line. Use for a
// derivation that spans SEPARATE lines (a solve chain, several substitutions) —
// each is its own step, so it reads correctly in show-all mode and reveals one
// per press in stepped mode. (Contrast `fragments`, which build a SINGLE line.)
const titledLines = (title: string, lines: string[]): WorkingStep[] =>
  lines.length ? [mStep(title, lines[0]), ...lines.slice(1).map((l) => step(l))] : [];

// Solve a quadratic with the formula: state it, substitute a/b/c IN (the step
// students most often skip), then simplify the discriminant. Ends at the ± surd —
// splitting the ± into two decimals is the caller's job (or the answer box's).
// The formula and its substituted form are ONE line (an equals-chain), so the
// second fragment is a `=` continuation, not a restated `x =`.
export const quadraticFormulaSteps = (a: number, b: number, c: number, v = "x"): WorkingStep[] => {
  const disc = b * b - 4 * a * c;
  return [
    mStep("Substitute into the quadratic formula", [
      `${v} = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
      `= \\dfrac{-(${b}) \\pm \\sqrt{(${b})^2 - 4(${a})(${c})}}{2(${a})}`,
    ]),
    mStep("Simplify under the root", [`${v} = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${2 * a}}`]),
  ];
};

// Read the roots off a factorised expression. `roots` are ready LaTeX strings.
export const solveFactorsSteps = (roots: string[], v = "x"): WorkingStep[] => {
  const uniq = roots.filter((r, i) => roots.indexOf(r) === i);
  const line = uniq.map((r) => `${v} = ${r}`).join(" \\quad \\text{or} \\quad ");
  return [mStep("Set each factor equal to zero and solve", [line])];
};

// Substitute a found value (or values) back to get the other unknown. Each line in
// `body` is a SEPARATE row. When a value and the equation are supplied, the title
// names them ("Substitute x = 3 into y = 2x − 5 to find y").
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

// Solve a linear equation: each move in the chain is its own row (they are
// separate equations, not one built-up line).
export const solveLinearlySteps = (v: string, chain: string[]): WorkingStep[] =>
  titledLines(`Expand and solve for ${v}`, chain);
