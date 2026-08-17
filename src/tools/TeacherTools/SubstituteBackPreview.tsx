import { TechniquePreviewPage, substituteBackSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// SUBSTITUTING BACK — TECHNIQUE PREVIEW
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Substituting Back",
      signature: 'substituteBackSteps("m", [...], { value, into })',
      desc: "Substitute a found value back to get the other unknown; the title names the value and the equation.",
      render: () => substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }),
    }} />
  );
}
