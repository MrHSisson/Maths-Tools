import {
  DecisionShell,
  type DecisionProblem,
  type GenerateContext,
  type SolveStep,
} from "../../shared/decision";
import DimCanvas from "../../shared/decision/DimWorking";
import { solveDim } from "../../shared/decision/dimSolve";
import { generateDimExam, type DimChain } from "../../shared/decision/dimExam";
import { genDimsName, genDimsExpr, genDimsConst, genConsistent, genPowers, type DimQuestion } from "../../shared/decision/dimGen";

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Dimensional Analysis — Further Mechanics MA (AQA 7367 and AS 7366), built on DecisionShell with the written working (the page a student would write, building a line at a time) as its picture
// (specs/dimensional-analysis.md). Three skill tools, each drilled on its own, and exam-style chains that put them back together:
//   Find the dimensions — a quantity (from its name or its units), an expression, or a constant in a formula;
//   Check consistency   — show a formula is consistent, find the odd term out, find a missing power, or pick the consistent formula;
//   Find the powers     — equate the powers of M, L and T and solve: in letters (no context), with named quantities, or in a worded situation.
// Exam style: a short chain of lettered parts with marks and a mark scheme, from the same generators (src/shared/decision/dimExam.ts).
// The maths is in shared/decision/dim.ts, the generators in dimGen.ts, the working in dimSolve.ts and the picture in DimWorking.tsx.
// ═════════════════════════════════════════════════════════════════════════════════════════════

const SKILLS = { key: "practice", values: ["skills"] };
const EXAM = { key: "practice", values: ["exam"] };

const SUB_TOOLS = [
  { key: "dims", label: "Find the dimensions", levels: 2, blurb: "A quantity, an expression or a constant", when: [SKILLS] },
  { key: "consistent", label: "Check consistency", levels: 2, blurb: "Is the formula dimensionally consistent?", when: [SKILLS] },
  { key: "powers", label: "Find the powers", levels: 3, blurb: "Equate the powers of M, L and T and solve", when: [SKILLS] },
  { key: "exAny", label: "Any exam question", levels: 1, blurb: "A mixed multi-part question", when: [EXAM] },
  { key: "exCircle", label: "Circle your answer", levels: 1, blurb: "Dimensions of a quantity, or the consistent formula", when: [EXAM] },
  { key: "exFind", label: "State the dimensions, then find the powers", levels: 1, blurb: "Dimensions of a quantity, then a model", when: [EXAM] },
  { key: "exConstant", label: "Dimensions of a constant, then predict", levels: 1, blurb: "Show a constant's dimensions, then use them", when: [EXAM] },
  { key: "exConsistent", label: "Show it is consistent", levels: 1, blurb: "A consistent formula, then a constant", when: [EXAM] },
  { key: "exModels", label: "Two models, reject one", levels: 1, blurb: "Which model cannot work, then the powers", when: [EXAM] },
  { key: "exZero", label: "Show a quantity does not matter", levels: 1, blurb: "Show a power is zero, then the others", when: [EXAM] },
];
const EXAM_CHAIN: Record<string, DimChain | "any"> = {
  exAny: "any", exCircle: "circle", exFind: "find", exConstant: "constant", exConsistent: "consistent", exModels: "models", exZero: "zero",
};

/** one of the ticked choices of a multi option, at random */
const pickOf = (v: string | undefined, fallback: string): string => { const xs = (v || fallback).split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? fallback; };

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "dims";
  const o = ctx?.options ?? {};
  if (EXAM_CHAIN[sub]) return generateDimExam(level, EXAM_CHAIN[sub]);
  let q: DimQuestion;
  if (sub === "consistent") {
    q = genConsistent(Math.min(2, Math.max(1, level)), pickOf(o.consAsk, level === 1 ? "show,pick" : "show,odd,missing,pick") as "show" | "odd" | "missing" | "pick", (o.consNumbers ?? (level === 1 ? "no" : "yes")) === "yes");
  } else if (sub === "powers") {
    q = genPowers(Math.min(3, Math.max(1, level)), {
      context: pickOf(o.powCtx, level === 1 ? "none" : level === 2 ? "none,named" : "named,worded") as "none" | "named" | "worded",
      ask: pickOf(o.powAsk, "find") as "find" | "zero" | "cannot",
      given: o.powGiven === "units" ? "units" : "dims",
    });
  } else {
    const lv = Math.min(2, Math.max(1, level));
    const circle = o.dimsForm === "circle";
    // a constant needs a formula to rearrange: Level 1 asks for quantities and expressions unless a teacher ticks it
    const ask = pickOf(o.dimsAsk, lv === 1 ? "quantity,expression" : "quantity,expression,constant");
    q = ask === "constant" ? genDimsConst(circle) : ask === "expression" ? genDimsExpr(lv, circle) : genDimsName(lv, pickOf(o.dimsGiven, "name") === "units", circle);
  }
  q.data.expandBuilds = o.dimsBuilds === "every";
  return { kind: q.data.kind, level, dim: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" } as unknown as DecisionProblem;
}

const solve = (p: DecisionProblem): SolveStep[] => (p.exam ? [] : solveDim(p));
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <DimCanvas p={p} step={step} />;

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      renderCanvas={renderCanvas}
      config={{
        pageTitle: "Dimensional Analysis",
        purpose: "Find the dimensions of quantities and constants, check that a formula is dimensionally consistent, and predict a formula by equating the powers of mass, length and time.",
        instruction: "Question",
        levels: 3, // the most any skill tool has; each tool sets its own `levels` in SUB_TOOLS
        levelInfo: true,
        hideMatrix: true,
        noSandbox: true,
        levelLabels: {
          dims: ["One step: a single quantity, or a product or quotient of two", "A constant from a formula, three factors, roots, and units"],
          consistent: ["Short formulas, with no numbers in them", "Longer formulas, with numbers and roots"],
          powers: ["Two powers to find", "Three powers, whole numbers or halves", "Three powers, with fractions"],
          default: ["One exam-style question"],
        },
        subTools: SUB_TOOLS,
        chooser: {
          filters: ["practice"],
          groups: [
            { title: "Skills", keys: ["dims", "consistent", "powers"] },
            { title: "Exam style questions", keys: ["exAny", "exCircle", "exFind", "exConstant", "exConsistent", "exModels", "exZero"] },
          ],
        },
        options: [
          {
            key: "practice",
            label: "Practice",
            info: "Skills gives one skill at a time. Exam style gives multi-part questions in the style of the exam paper.",
            top: true,
            choices: [
              { value: "skills", label: "Skills" },
              { value: "exam", label: "Exam style" },
            ],
          },
          {
            key: "dimsBuilds",
            label: "Builds",
            info: "A quantity that is not given (force, energy, viscosity…) is built before it is used. One step each keeps the working short, and a student can open any build to see its parts; Every step shows all of them.",
            forSubTools: ["dims", "consistent", "powers"],
            displayOnly: true,
            defaultFor: () => "one",
            choices: [
              { value: "one", label: "One step each", sub: "Open for the parts" },
              { value: "every", label: "Every step" },
            ],
          },
          {
            key: "dimsAsk",
            label: "Ask for",
            info: "What to find the dimensions of. A constant in a formula is ticked at Level 2 by default.",
            forSubTools: ["dims"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "quantity,expression" : "quantity,expression,constant"),
            choices: [
              { value: "quantity", label: "A quantity", sub: "Force, density…" },
              { value: "expression", label: "An expression", sub: "ρv²r" },
              { value: "constant", label: "A constant", sub: "In a formula" },
            ],
          },
          {
            key: "dimsGiven",
            label: "Quantity Given As",
            info: "Whether a named quantity is given by its name or by the units it is measured in.",
            forSubTools: ["dims"],
            multi: true,
            defaultFor: () => "name",
            choices: [
              { value: "name", label: "Its name" },
              { value: "units", label: "Its units", sub: "kg m⁻³" },
            ],
          },
          {
            key: "dimsForm",
            label: "Answer Format",
            info: "Whether the student writes the dimensions or circles one of four options.",
            forSubTools: ["dims"],
            defaultFor: () => "write",
            choices: [
              { value: "write", label: "Write it" },
              { value: "circle", label: "Circle one of four" },
            ],
          },
          {
            key: "consAsk",
            label: "Ask for",
            info: "What to do with the formula: show it is consistent, find the term with different dimensions, find a missing power, or circle the one consistent formula of four.",
            forSubTools: ["consistent"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "show,pick" : "show,odd,missing,pick"),
            choices: [
              { value: "show", label: "Show it is consistent" },
              { value: "odd", label: "Odd term out" },
              { value: "missing", label: "Missing power", sub: "Find n" },
              { value: "pick", label: "Circle the consistent one" },
            ],
          },
          {
            key: "consNumbers",
            label: "Numbers in Formulas",
            info: "Whether formulas can contain numbers such as ½, 2 and 2π, which have no dimensions, and roots.",
            forSubTools: ["consistent"],
            defaultFor: (lv: number) => (lv === 1 ? "no" : "yes"),
            choices: [
              { value: "no", label: "Left out" },
              { value: "yes", label: "Included" },
            ],
          },
          {
            key: "powCtx",
            label: "Context",
            info: "How the quantities are given: letters with their dimensions stated (no context), named quantities whose dimensions the student recalls, or a worded situation.",
            forSubTools: ["powers"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "none" : lv === 2 ? "none,named" : "named,worded"),
            choices: [
              { value: "none", label: "None", sub: "Letters and dimensions" },
              { value: "named", label: "Named quantities" },
              { value: "worded", label: "A situation", sub: "Pendulum, orbit…" },
            ],
          },
          {
            key: "powAsk",
            label: "Ask for",
            info: "Find all the powers; show that one of them is zero (so a quantity does not appear) and find the others; or show that no powers can make the model work.",
            forSubTools: ["powers"],
            multi: true,
            defaultFor: () => "find",
            choices: [
              { value: "find", label: "Find the powers" },
              { value: "zero", label: "Show one is zero", sub: "Level 2 and up" },
              { value: "cannot", label: "Show it cannot work" },
            ],
          },
          {
            key: "powGiven",
            label: "Dimensions Given As",
            info: "Whether the question states the dimensions of the quantities, or only the units they are measured in (so the student first finds the dimensions).",
            forSubTools: ["powers"],
            defaultFor: () => "dims",
            choices: [
              { value: "dims", label: "Dimensions" },
              { value: "units", label: "Units" },
            ],
          },
        ],
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
