import { TechniquePreviewPage, rationaliseDenominatorSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// RATIONALISE THE DENOMINATOR — TECHNIQUE PREVIEW
//
// A lean, purpose-built page around the real WorkedExampleSteps viewer — not
// the full ToolShell. Promoted from the Surds tool (src/tools/Number/Surds.tsx),
// which now pulls this same technique back through "../../shared". Composes
// simplifySurdSteps and expandSurdBracketsSteps rather than re-deriving them —
// this example takes the binomial-denominator path, which always hits
// expandSurdBracketsSteps' difference-of-two-squares branch.
// Registered enabled:false — dev-only, matching every other technique preview
// (see src/shared/components/TechniquePreviewPage.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Rationalise the Denominator",
      signature: "rationaliseDenominatorSteps(1, (2+√3))",
      desc: "Multiply top and bottom by the conjugate, then simplify — composes the simplify-a-surd and expand-surd-brackets techniques rather than re-deriving them.",
      grains: true,
      render: (grain) => rationaliseDenominatorSteps(
        [{ coeff: 1, radicand: 1 }],
        [{ coeff: 2, radicand: 1 }, { coeff: 1, radicand: 3 }],
        grain,
      ),
    }} />
  );
}
