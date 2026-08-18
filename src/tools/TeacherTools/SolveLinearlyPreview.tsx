import { TechniquePreviewPage, solveLinearlySteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// SOLVING A LINEAR CHAIN — TECHNIQUE PREVIEW
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Solving a Linear Chain",
      signature: 'solveLinearlySteps("n", [...])',
      desc: "Solve a linear equation from a pre-built chain — one row per move.",
      render: () => solveLinearlySteps("n", ["34n = 136", "n = 4"]),
    }} />
  );
}
