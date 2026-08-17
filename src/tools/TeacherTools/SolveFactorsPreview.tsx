import { TechniquePreviewPage, solveFactorsSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// READING ROOTS FROM FACTORS — TECHNIQUE PREVIEW
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Reading Roots from Factors",
      signature: 'solveFactorsSteps(["1", "6"], "x")',
      desc: "Set each factor of a factorised expression to zero and read off the roots.",
      render: () => solveFactorsSteps(["1", "6"], "x"),
    }} />
  );
}
