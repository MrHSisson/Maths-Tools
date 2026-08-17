import { ToolShell, makeTechniquePreviewConfig, quadraticFormulaSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// QUADRATIC FORMULA — TECHNIQUE PREVIEW
//
// A real ToolShell tool, not a mockup: the "question" is a fixed example
// (2x² + 4x − 8 = 0) instead of randomised numbers, so this page looks and
// behaves exactly like a live tool whose worked example uses this technique
// would. Detail level (Brief/Standard/Full) is a normal dropdown QO control —
// try Worked Example mode and switch it to see how quadraticFormulaSteps
// renders at each grain. Registered enabled:false — dev-only, first of the
// technique-preview pages (see src/shared/techniquePreview.tsx).
// ─────────────────────────────────────────────────────────────────────────────

const { TOOL_CONFIG, INFO_SECTIONS, generateQuestion } = makeTechniquePreviewConfig({
  id: "quadraticFormula",
  title: "Quadratic Formula",
  questionLatex: "2x^2 + 4x - 8 = 0",
  desc: "Solving a quadratic with the formula. Brief assumes the substitution; full is the skill-level teaching (discriminant, ± split, decimals).",
  grains: true,
  render: (grain) => quadraticFormulaSteps(2, 4, -8, "x", grain),
});

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ fixedQuestions: true, fixedColumns: true }}
    />
  );
}
