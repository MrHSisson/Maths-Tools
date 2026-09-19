import { TechniquePreviewPage, expandSurdBracketsSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// EXPAND SURD BRACKETS — TECHNIQUE PREVIEW
//
// A lean, purpose-built page around the real WorkedExampleSteps viewer — not
// the full ToolShell. Promoted from the Surds tool (src/tools/Number/Surds.tsx),
// which now pulls this same technique back through "../../shared". Named
// "surd brackets" (not the generic "expandBrackets" from the techniques audit
// backlog) since it operates on SurdTerm, not general algebraic terms — see
// this technique's own header comment in src/shared/techniques/index.ts.
// Registered enabled:false — dev-only, matching every other technique preview
// (see src/shared/components/TechniquePreviewPage.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Expand Surd Brackets",
      signature: "expandSurdBracketsSteps((√3+2), (√3+5))",
      desc: "FOIL two brackets, then simplify any surds produced and collect like terms — only showing the sub-steps a given pair of brackets actually needs.",
      grains: true,
      render: (grain) => expandSurdBracketsSteps(
        [{ coeff: 1, radicand: 3 }, { coeff: 2, radicand: 1 }],
        [{ coeff: 1, radicand: 3 }, { coeff: 5, radicand: 1 }],
        grain,
      ),
    }} />
  );
}
