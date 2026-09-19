import { TechniquePreviewPage, simplifySurdSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLIFY A SURD — TECHNIQUE PREVIEW
//
// A lean, purpose-built page around the real WorkedExampleSteps viewer — not
// the full ToolShell. Promoted from the Surds tool (src/tools/Number/Surds.tsx),
// which now pulls this same technique back through "../../shared".
// Registered enabled:false — dev-only, matching every other technique preview
// (see src/shared/components/TechniquePreviewPage.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Simplify a Surd",
      signature: "simplifySurdSteps(200, 3)",
      desc: "Find the largest square factor, split the root, evaluate it. Full separates the coefficient multiply into its own taught move.",
      grains: true,
      render: (grain) => simplifySurdSteps(200, 3, grain),
    }} />
  );
}
