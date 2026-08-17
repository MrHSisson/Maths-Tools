import type { ToolConfig, InfoSection, DifficultyLevel, AnyQuestion, WorkingStep } from "./types";
import type { Grain } from "./techniques";

// ═══════════════════════════════════════════════════════════════════════════════
// makeTechniquePreviewConfig — builds the TOOL_CONFIG/INFO_SECTIONS/
// generateQuestion for a real ToolShell tool around a single technique's
// example output, so "preview this technique" IS an actual tool page, not an
// approximation of one. No bespoke chrome, no custom sizing, no scroll/nav
// logic to keep in sync with reality — it just IS reality, with a fixed
// example instead of randomised numbers.
//
// This returns DATA only, deliberately — each tool file still renders
// `<ToolShell/>` itself in its own App(), same as every other tool (see
// CLAUDE.md's "How to create a new tool"). That keeps every technique preview
// a real, individually-inspectable tool file, and keeps organisation.test.ts's
// <ToolShell/> detection (a text scan of each tool file) meaningful — hiding
// the render call inside this helper would make every preview invisible to it.
//
// Each technique preview is a thin tool file:
//
//   const { TOOL_CONFIG, INFO_SECTIONS, generateQuestion } = makeTechniquePreviewConfig({
//     id: "quadraticFormula",
//     title: "Quadratic Formula",
//     questionLatex: "2x^2 + 4x - 8 = 0",
//     desc: "...",
//     grains: true,
//     render: (grain) => quadraticFormulaSteps(2, 4, -8, "x", grain),
//   });
//   export const __test = { TOOL_CONFIG, generateQuestion };
//   export default function App() {
//     return <ToolShell config={TOOL_CONFIG} infoSections={INFO_SECTIONS}
//       generateQuestion={generateQuestion} defaults={{ fixedQuestions: true, fixedColumns: true }} />;
//   }
//
// `grains: true` gets a real dropdown QO control (Brief/Standard/Full) — the
// same mechanism any tool uses for a display-mode choice, deliberately NOT the
// Level 1/2/3 selector, which stays present but inert (every level behaves the
// same): reusing it for grain would contradict the "grain is never mistaken
// for difficulty" rule the rest of the app follows (see CLAUDE.md).
// ═══════════════════════════════════════════════════════════════════════════════

export interface TechniquePreviewDef {
  id: string;
  title: string;
  /** KaTeX for the "question" this worked example solves — rendered exactly
   *  like a real question's displayLatex, above the working. */
  questionLatex: string;
  desc: string;
  /** Present when `render` takes a meaningful grain — adds the Brief/Standard/Full picker. */
  grains?: true;
  render: (grain: Grain) => WorkingStep[];
}

export function makeTechniquePreviewConfig(def: TechniquePreviewDef) {
  const TOOL_CONFIG: ToolConfig = {
    pageTitle: def.title,
    tools: {
      preview: {
        name: def.title,
        instruction: "Solve:",
        variables: [],
        dropdown: def.grains ? {
          key: "grain",
          label: "Detail",
          defaultValue: "standard",
          options: [
            { value: "brief", label: "Brief" },
            { value: "standard", label: "Standard" },
            { value: "full", label: "Full" },
          ],
        } : null,
        difficultySettings: null,
      },
    },
  };

  const INFO_SECTIONS: InfoSection[] = [
    { title: def.title, icon: "🧮", content: [{ label: "About this technique", detail: def.desc }] },
  ];

  const generateQuestion = (
    _tool: string,
    _level: DifficultyLevel,
    _variables: Record<string, boolean>,
    dropdownValue: string,
  ): AnyQuestion => {
    const grain = (def.grains && dropdownValue ? dropdownValue : "standard") as Grain;
    const working = def.render(grain);
    const last = working.length ? working[working.length - 1].latex : "";
    return {
      kind: "simple",
      display: def.questionLatex,
      displayLatex: def.questionLatex,
      answer: last,
      answerLatex: last,
      working,
      // Same steps every call (a fixed example, not a randomised one) — still
      // append a random id, per the standard key rule, so the generator smoke
      // test's "N unique keys per batch" check has something to be unique on.
      key: `${def.id}-${grain}-${Math.floor(Math.random() * 1_000_000)}`,
      difficulty: "level1",
    } as unknown as AnyQuestion;
  };

  return { TOOL_CONFIG, INFO_SECTIONS, generateQuestion };
}
