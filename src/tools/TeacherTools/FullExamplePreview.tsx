import { TechniquePreviewPage, workings, makeSubjectSteps, solveLinearlySteps, substituteBackSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// FULL WORKED EXAMPLE — TECHNIQUE PREVIEW
// Composes several technique blocks + a bespoke step into one full solution —
// shows how a real tool assembles them, not a single technique in isolation.
// See src/tools/TeacherTools/QuadraticFormulaPreview.tsx for the pattern this
// follows. Registered enabled:false, hidden:true — reached from the
// Technique Library, never listed on the landing page itself.
// ─────────────────────────────────────────────────────────────────────────────

const FULL_EXAMPLE = workings()
  .use(makeSubjectSteps("m", "m = 5n + 2"))
  .step("Substitute equation (2) into equation (1)", ["6(5n+2) + 4n = 148"])
  .use(solveLinearlySteps("n", ["30n + 12 + 4n = 148", "34n = 136", "n = 4"]))
  .use(substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }))
  .build();

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Full Worked Example",
      signature: "workings() — full method",
      desc: "A complete linear-substitution solution assembled from technique blocks + bespoke steps — shows how a real tool composes them.",
      render: () => FULL_EXAMPLE,
    }} />
  );
}
