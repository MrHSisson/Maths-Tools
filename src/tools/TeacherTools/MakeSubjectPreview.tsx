import { TechniquePreviewPage, makeSubjectSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// MAKING THE SUBJECT — TECHNIQUE PREVIEW
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Making the Subject",
      signature: 'makeSubjectSteps("m", "m = 5n + 2")',
      desc: "Rearrange an equation to make a variable the subject.",
      render: () => makeSubjectSteps("m", "m = 5n + 2"),
    }} />
  );
}
