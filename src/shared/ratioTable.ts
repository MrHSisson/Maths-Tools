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

/** "Divide both by 2" / "Multiply both by 3" from a whole-number operation like `\\div 2`. */
const opCaption = (op: string): string => {
  const m = op.match(/\\(times|div)\s*(\d+(?:\.\d+)?)/);
  return m ? `${m[1] === "div" ? "Divide" : "Multiply"} both by ${m[2]}` : "Scale both quantities";
};

/**
 * The developing version of `rStep`: ONE table that grows a row per step, instead of a full table per
 * step. Returns `rows.length` steps — the first shows only the known row (captioned with `label`), each
 * later step adds the next row and its ×/÷ arrow (captioned "Divide both by 2"…). Pass
 * `ratioTableStepVisual` as ToolShell's `stepVisualRenderer`: the table then updates in place beside a
 * caption timeline, like the place value table. Each snapshot is a prefix of the same table, so the
 * final one equals what `rStep` would have drawn.
 */
export const rStepBuild = (
  label: string,
  headers: string[],
  rows: (string | number)[][],
  operations: string[],
): WorkingStep[] => {
  const strRows = rows.map((r) => r.map(String));
  return strRows.map((_, k) => {
    const caption = k === 0 ? stripSkillMarkers(label).replace(/:\s*$/, "") : opCaption(operations[k - 1] ?? "");
    const data: RatioTableData = { headers, rows: strRows.slice(0, k + 1), operations: operations.slice(0, k), grow: true };
    return { type: "ratioTable", latex: "", plain: caption, label: caption, extra: data };
  });
};
