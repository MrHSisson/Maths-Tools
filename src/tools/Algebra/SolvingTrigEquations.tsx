import {
  ToolShell,
  type ToolConfig, type ToolMultiSelect, type ToolVariable, type DifficultyLevel, type AnyQuestion,
  pickActive, randInt, pick, applyAbout, graphStepVisual,
} from "../../shared";
import { ABOUT } from "./SolvingTrigEquations.about";
import { buildTrigQuestion, exactValues, decimalValues, type Fn, type Unit, type FormKind, type TrigSpec } from "./trigEquations";

// ── 1. Option pools ──────────────────────────────────────────────────────────────────────────────────────────────────────
// Option ids are unique across the pools of a level: the generator reads one flat set of ticks.
const opt = (value: string, label: string, defaultActive = true, sub?: string) => ({ value, label, defaultActive, ...(sub ? { sub } : {}) });
const pool = (key: string, label: string, tab: "questions" | "numbers", options: ReturnType<typeof opt>[], exclusive = false): ToolMultiSelect =>
  ({ key, label, tab, options, ...(exclusive ? { exclusive: true } : {}) });

const FUNCTION_OPTS = [opt("sin", "sin"), opt("cos", "cos"), opt("tan", "tan")];
const FUNCTIONS_MS = pool("functions", "Functions", "questions", FUNCTION_OPTS);

// The range is one draggable bar: 11 dots, −4π to 6π, the ticked dots are an unbroken run and its two ends are the range (degrees = 180 × n).
// Option ids are "p-4" … "p6" (n multiples of π); Levels 1–3 share them, so the ticks carry over between levels.
const STOPS = Array.from({ length: 11 }, (_, i) => i - 4);
const stopLabel = (n: number) => (n === 0 ? "0" : n === 1 ? "π" : n === -1 ? "−π" : `${n < 0 ? "−" : ""}${Math.abs(n)}π`);
const RANGE_OPTS = STOPS.map((n) => opt(`p${n}`, stopLabel(n), n >= 0 && n <= 2));
const RANGE_PRESETS = [[0, 2], [0, 4], [-1, 1], [-2, 2]].map(([a, b]) => ({ label: `${stopLabel(a)} to ${stopLabel(b)}`, from: `p${a}`, to: `p${b}` }));
const rangesMs = (): ToolMultiSelect => ({ ...pool("ranges", "Range", "questions", RANGE_OPTS), allowEmpty: true, rangeBar: { presets: RANGE_PRESETS } });

/** The [low, high] in degrees from the ticked dots (first and last ticked); a stale or empty tick set falls back to 0 – 2π. */
const rangeFrom = (msv: Record<string, boolean>): [number, number] => {
  const on = STOPS.filter((n) => msv[`p${n}`]);
  return on.length >= 2 ? [on[0] * 180, on[on.length - 1] * 180] : [0, 360];
};

const ANGLE_L2 = pool("angleForms", "Angle Forms", "questions", [opt("multiple", "kθ", true, "k = 2 or 3"), opt("half", "θ/2", false), opt("shift", "θ ± c", false, "shift only")]);
const ANGLE_L3 = pool("angleForms", "Angle Forms", "questions", [opt("both", "kθ ± c", true, "k = 2 or 3"), opt("half", "θ/2 ± c", false)]);

const FORM_OPTS = [
  opt("direct", "sin θ = ½", true),
  opt("scaled", "2 sin θ = 1", false),
  opt("shifted", "2 sin θ + 2 = 1", false),
  opt("negative", "1 − 2 sin θ = 2", false),
];
const FORMS_MS = pool("equationForms", "Equation Forms", "questions", FORM_OPTS);
// With one range per sheet, Level 1's plain "sin θ = k" has only 18 different questions, fewer than a worksheet: it also opens on "2 sin θ = 1".
const FORMS_L1 = pool("equationForms", "Equation Forms", "questions", FORM_OPTS.map((o) => (o.value === "scaled" ? { ...o, defaultActive: true } : o)));

const UNIT_MS = pool("angleUnit", "Angle Unit", "numbers", [opt("deg", "Degrees", true), opt("rad", "Radians", false)], true);
const VALUES_MS = pool("values", "Values", "numbers", [opt("exact", "Exact", true, "½, √3/2…"), opt("decimal", "Decimal", false, "0.3, −0.72")]);
const EXTREMES_VAR: ToolVariable = { key: "extremes", label: "Include 0 and ±1", tab: "numbers", defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Solving Trig Equations",
  tools: {
    solve: {
      name: "Solve",
      instruction: "Solve, for the given range:",
      variables: [EXTREMES_VAR],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [EXTREMES_VAR], dropdown: null, multiSelect: [FUNCTIONS_MS, rangesMs(), FORMS_L1, UNIT_MS, VALUES_MS] },
        level2: { variables: [EXTREMES_VAR], dropdown: null, multiSelect: [FUNCTIONS_MS, rangesMs(), ANGLE_L2, FORMS_MS, UNIT_MS, VALUES_MS] },
        level3: { variables: [EXTREMES_VAR], dropdown: null, multiSelect: [FUNCTIONS_MS, rangesMs(), ANGLE_L3, FORMS_MS, UNIT_MS, VALUES_MS] },
      },
    },
  },
};

// ── 2. Generator ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Choose the function, the value k, the angle form and the range, then let buildTrigQuestion keep only questions that satisfy every
// constraint in the spec (solutions in range, whole-degree answers at Level 3, no solution on an end of the range, decimals that
// round the same from the working as from the exact value…).
const SHIFT_DEG = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60];
const SHIFT_RAD = [15, 30, 45, 60];      // π/12, π/6, π/4, π/3

const generateQuestion = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, msv: Record<string, boolean> = {}): AnyQuestion => {
  void tool; void dropdownValue;   // one sub-tool and no dropdown, so neither changes the question
  const extremes = variables.extremes === true;
  const opts = (xs: { value: string }[]) => xs;
  for (let attempt = 0; attempt < 400; attempt++) {
    const fn = pickActive(msv, opts(FUNCTION_OPTS)) as Fn;
    const unit = pickActive(msv, [{ value: "deg" }, { value: "rad" }]) as Unit;
    const range = rangeFrom(msv);
    const form = pickActive(msv, opts(FORM_OPTS)) as FormKind;
    const decimal = pickActive(msv, [{ value: "exact" }, { value: "decimal" }]) === "decimal";

    let kArg = 1, cDeg = 0;
    if (level !== "level1") {
      const form2 = pickActive(msv, level === "level2" ? [{ value: "multiple" }, { value: "half" }, { value: "shift" }] : [{ value: "both" }, { value: "half" }]);
      const sign = Math.random() < 0.5 ? -1 : 1;
      const shift = sign * pick(unit === "deg" ? SHIFT_DEG : SHIFT_RAD);
      if (form2 === "multiple" || form2 === "both") kArg = pick([2, 3]);
      else if (form2 === "half") kArg = 0.5;
      if (form2 === "shift" || form2 === "both" || (form2 === "half" && level === "level3")) cDeg = shift;
    }

    const spec: TrigSpec = { fn, unit, form, a: 1, b: 0, kArg, cDeg, range, allowEdge: extremes };
    if (decimal) spec.kDec = pick(decimalValues(fn));
    else spec.kEx = pick(exactValues(fn, extremes));

    if (form !== "direct") {
      const q = spec.kEx?.q ?? 1;
      const multiples = [2, 3, 4, 5, 6].filter((a) => a % q === 0 && (q > 1 || a <= 4));
      spec.a = decimal ? randInt(2, 4) : pick(multiples);
      spec.b = form === "shifted" ? pick([-3, -2, -1, 1, 2, 3]) : form === "negative" ? randInt(1, 5) : 0;
    }

    const built = buildTrigQuestion(spec);
    if (!built) continue;
    return {
      kind: "simple",
      display: built.display,
      displayLatex: built.displayLatex,
      answer: built.answer,
      answerLatex: built.answerLatex,
      working: built.working,
      key: built.key,
      difficulty: level,
    } as unknown as AnyQuestion;
  }
  throw new Error("Solving Trig Equations: no valid question found for these options");
};

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      stepVisualRenderer={graphStepVisual}
      stepVisualKeepsWorking
      defaults={{ numQuestions: 10, numColumns: 2, hideAnswerStep: true }}
    />
  );
}
