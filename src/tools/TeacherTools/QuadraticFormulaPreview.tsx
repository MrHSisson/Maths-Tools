import { TechniquePreviewPage, quadraticFormulaSteps } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// QUADRATIC FORMULA — TECHNIQUE PREVIEW
//
// A lean, purpose-built page around the real WorkedExampleSteps viewer — not
// the full ToolShell (no Whiteboard/Worksheet, no hero title, no Level 1/2/3
// bar). Detail level (Brief/Standard/Full) and layout (Single card/Stacked)
// are compact pill selectors, same style as the Technique Library's popup.
// Registered enabled:false — dev-only, first of the technique-preview pages
// (see src/shared/components/TechniquePreviewPage.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TechniquePreviewPage def={{
      title: "Quadratic Formula",
      signature: "quadraticFormulaSteps(2, 4, -8)",
      desc: "Solving a quadratic with the formula. Brief assumes the substitution; full is the skill-level teaching (discriminant, ± split, decimals).",
      grains: true,
      render: (grain) => quadraticFormulaSteps(2, 4, -8, "x", grain),
    }} />
  );
}
