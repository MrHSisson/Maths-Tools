import { TechniquePreviewPage, collectLikeSurdsSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// COLLECT LIKE SURDS — TECHNIQUE PREVIEW
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
      title: "Collect Like Surds",
      signature: 'collectLikeSurdsSteps([{coeff:1,radicand:8},{coeff:3,radicand:2}])',
      desc: "Simplify every term first, then group and sum matching radicands — √8 + 3√2 only reads as \"like surds\" once √8 has been rewritten as 2√2.",
      grains: true,
      render: (grain) => collectLikeSurdsSteps(
        [{ coeff: 1, radicand: 8 }, { coeff: 3, radicand: 2 }],
        grain,
      ),
    }} />
  );
}
