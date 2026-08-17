import { TechniquePreviewPage, solveLinearEquationSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// SOLVING A LINEAR EQUATION — TECHNIQUE PREVIEW
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Solving a Linear Equation",
      signature: "solveLinearEquationSteps(2, 3, 11)",
      desc: "Solving 2x + 3 = 11. Full names each both-sides move — the fundamental teaching pattern; brief just states the answer.",
      grains: true,
      render: (grain) => solveLinearEquationSteps(2, 3, 11, "x", grain),
    }} />
  );
}
