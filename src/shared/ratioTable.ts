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

/** Parse a whole-number `\\times n` / `\\div n` operation. */
const parseOp = (op: string): { mul: boolean; n: string } | null => {
  const m = op.match(/\\(times|div)\s*(\d+(?:\.\d+)?)/);
  return m ? { mul: m[1] === "times", n: m[2] } : null;
};

/**
 * The "known first, then work it out" ratio table: ONE table whose unknown cells start blank ("?"). The
 * known values go in first, then for each scale step the class (1) sees how to get from the known value in
 * the `drive` column to the next ("1 to 6: multiply by 6"), (2) does the same to the other column, and
 * (3) fills the blank ("5 × 6 = 30"). Nothing appears all at once.
 *
 * `pairs` is the full chain of rows (the last one holds the answer); `operations` the whole-number step
 * between each consecutive pair (as `buildScaleSteps` gives). `drive` is the column whose value in the FINAL
 * row is already known from the question (the given time, or for a find-the-time question the distance); in an
 * intermediate "unit" row the driving cell appears with its arrow. Pair with `ratioTableStepVisual`.
 */
export const rStepSolve = (
  label: string,
  headers: string[],
  pairs: (string | number)[][],
  operations: string[],
  drive: 0 | 1,
): WorkingStep[] => {
  const rows = pairs.map((r) => r.map(String));
  const last = rows.length - 1;
  const other = (1 - drive) as 0 | 1;
  const shown = rows.map((_, r) => rows[0].map((_, c) => r === 0 || (r === last && c === drive)));
  const sides: ("none" | "left" | "right" | "both")[] = operations.map(() => "none");
  // The left gutter belongs to column 0, the right to column 1.
  const sideOf = (c: number): "left" | "right" => (c === 0 ? "left" : "right");
  const out: WorkingStep[] = [];
  const push = (caption: string, fresh?: [number, number]) => {
    const data: RatioTableData = {
      headers,
      rows: rows.map((row, r) => row.map((v, c) => (shown[r][c] ? v : ""))),
      operations: [...operations],
      opSides: [...sides],
      fresh,
      grow: true,
    };
    out.push({ type: "ratioTable", latex: "", plain: caption, label: caption, extra: data });
  };

  push(stripSkillMarkers(label).replace(/:\s*$/, "") + ": write what we know");
  // A ÷ then × chain goes through a middle ("unit") row. Say WHY that row exists: the start and end values are not
  // a whole-number step apart, but a common factor of both is — so the table is not just imagined into three parts.
  const [first, second] = [parseOp(operations[0] ?? ""), parseOp(operations[1] ?? "")];
  const [a, m, c] = [rows[0]?.[drive], rows[1]?.[drive], rows[2]?.[drive]];
  const whole = [a, m, c].every((v) => Number.isInteger(Number(v)));
  if (operations.length === 2 && first && second && !first.mul && second.mul && !(whole && Number(c) % Number(a) === 0)) {
    push(whole
      ? `${a} doesn't scale to ${c} by a whole number. ${m} is a common factor of ${a} and ${c} (${a} ÷ ${first.n} = ${m}, ${m} × ${second.n} = ${c}), so use ${m} as a stepping stone`
      : `${a} doesn't scale to ${c} by a whole number, so go via ${m}: ÷ ${first.n}, then × ${second.n}`);
  }
  for (let k = 0; k < operations.length; k++) {
    const p = parseOp(operations[k]);
    const verb = p ? (p.mul ? "multiply" : "divide") : "scale";
    const by = p ? ` by ${p.n}` : "";
    const sym = p ? (p.mul ? "×" : "÷") : "→";
    const name = headers[other].toLowerCase();
    shown[k + 1][drive] = true;
    sides[k] = sideOf(drive);
    push(`How do we get from ${rows[k][drive]} to ${rows[k + 1][drive]}? ${verb[0].toUpperCase()}${verb.slice(1)}${by}`);
    sides[k] = "both";
    push(`Do the same to the ${name}: ${verb}${by}`);
    shown[k + 1][other] = true;
    push(p ? `${rows[k][other]} ${sym} ${p.n} = ${rows[k + 1][other]}` : `${rows[k][other]} → ${rows[k + 1][other]}`, [k + 1, other]);
  }
  return out;
};
