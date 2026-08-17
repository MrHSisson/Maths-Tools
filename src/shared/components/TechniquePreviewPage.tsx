import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import { WorkedExampleSteps } from "./WorkedExampleSteps";
import { MathRenderer } from "./MathRenderer";
import { getQuestionBg } from "../colors";
import { loadKaTeX } from "../katex";
import type { WorkingStep } from "../types";
import type { Grain } from "../techniques";

// ═══════════════════════════════════════════════════════════════════════════════
// TechniquePreviewPage — a lean, purpose-built page for previewing one
// technique's example output. Deliberately NOT the full ToolShell (no
// Whiteboard/Worksheet tabs, no big hero title, no Level 1/2/3 bar — none of
// that applies to a fixed worked example) — just the real WorkedExampleSteps
// viewer (the same component every tool's Worked Example renders through)
// with Brief/Standard/Full and Single card/Stacked controls styled like the
// Technique Library's own compact pill selectors.
//
// Each technique preview is a thin tool file:
//
//   export default function App() {
//     return <TechniquePreviewPage def={{
//       title: "Quadratic Formula",
//       desc: "...",
//       grains: true,
//       render: (grain) => quadraticFormulaSteps(2, 4, -8, "x", grain),
//     }} />;
//   }
//
// Registered enabled:false, standalone (never renders <ToolShell/>, so it's
// listed in organisation.test.ts's STANDALONE_BY_DESIGN, not __test-covered).
// ═══════════════════════════════════════════════════════════════════════════════

const GRAIN_META: Record<Grain, string> = { brief: "Brief", standard: "Standard", full: "Full" };
const LAYOUT_META = { single: "Single card", stacked: "Stacked" } as const;

export interface TechniquePreviewPageDef {
  title: string;
  /** Shown small under the title — the underlying function call, dev-facing detail. */
  signature?: string;
  desc: string;
  /** Present when `render` takes a meaningful grain — adds the Brief/Standard/Full picker. */
  grains?: true;
  render: (grain: Grain) => WorkingStep[];
}

const pillGroup = <T extends string>(value: T, options: readonly T[], labels: Record<T, string>, onChange: (v: T) => void) => (
  <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: "#d1d5db" }}>
    {options.map((o) => (
      <button key={o} onClick={() => onChange(o)}
        className="px-3 py-1.5 text-sm font-bold transition-colors"
        style={{ background: value === o ? "#1e3a8a" : "#fff", color: value === o ? "#fff" : "#6b7280" }}>
        {labels[o]}
      </button>
    ))}
  </div>
);

export function TechniquePreviewPage({ def }: { def: TechniquePreviewPageDef }) {
  useEffect(() => { loadKaTeX(); }, []);
  const [grain, setGrain] = useState<Grain>("standard");
  const [layout, setLayout] = useState<"single" | "stacked">("stacked");
  const steps = def.render(def.grains ? grain : "standard");
  const lastLatex = steps.length ? steps[steps.length - 1].latex : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/techniques"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Technique Library</span>
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "#f5f3f0", minHeight: 0 }}>
        <div className="max-w-4xl mx-auto w-full px-8 pt-8 flex-shrink-0">
          <h1 className="text-2xl font-bold" style={{ color: "#000" }}>{def.title}</h1>
          {def.signature && <code className="text-xs text-gray-400 font-mono">{def.signature}</code>}
          <p className="text-gray-500 mt-2 mb-4">{def.desc}</p>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {def.grains && pillGroup(grain, ["brief", "standard", "full"] as const, GRAIN_META, setGrain)}
            {pillGroup(layout, ["single", "stacked"] as const, LAYOUT_META, setLayout)}
          </div>
        </div>
        <div className="max-w-4xl mx-auto w-full px-8 pb-8 flex-1" style={{ minHeight: 0 }}>
          <div className="rounded-xl shadow-lg p-6 h-full flex flex-col" style={{ backgroundColor: getQuestionBg("default"), minHeight: 0 }}>
            <WorkedExampleSteps
              working={steps}
              renderAnswer={() => <MathRenderer latex={lastLatex} />}
              colorScheme="default"
              answerFontClass="text-3xl"
              stepThroughEnabled
              resetKey={`${def.title}-${grain}`}
              layout={layout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
