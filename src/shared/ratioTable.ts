// Ratio table — a core representation (alongside the bar model, number line,
// area model, algebra tiles, negative counters, and prime factor tiles — see
// CLAUDE.md's "Core representations" table). Carries proportional scaling:
// speed/distance/time, currency conversion, recipe scaling — any working step
// that scales two or more linked quantities together via the same factor.
//
//   rStep("Scale to 1 hour:", ["Miles", "Hours"], [[30, 2], [15, 1]], ["\\div 2"])
//
// Renders via the shared `RatioTable` component (src/shared/components/RatioTable.tsx)
// through `ratioTableStepRenderer`, which a tool passes as its `stepRenderer` —
// every other step type falls through to ToolShell's normal step/mStep/tStep
// rendering, exactly like a diagram tool's questionRenderer returning null.

import type { RatioTableData, WorkingStep } from "./types";
import { stripSkillMarkers } from "./helpers";

export const rStep = (
  label: string,
  headers: string[],
  rows: (string | number)[][],
  operations: string[],
): WorkingStep => {
  const strRows = rows.map((r) => r.map(String));
  const data: RatioTableData = { headers, rows: strRows, operations };

  const parts = [strRows[0].join(" : ")];
  for (let i = 1; i < strRows.length; i++) parts.push(operations[i - 1] ?? "", strRows[i].join(" : "));

  return {
    type: "ratioTable",
    latex: "",
    plain: `${stripSkillMarkers(label)} ${parts.join(" ")}`,
    label,
    extra: data,
  };
};
