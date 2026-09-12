import type { RatioTableData, WorkingStep } from "../types";
import { MathRenderer } from "./MathRenderer";

const BORDER = "2px solid #1e3a8a";

// Ratio table — see src/shared/ratioTable.ts for the authoring helper (rStep)
// and CLAUDE.md's "Core representations" table for where this sits alongside
// the bar model, number line, etc. Renders as ONE continuous bordered
// <table> — quantities as COLUMNS (the header row), each scale-step as a
// ROW going down — matching how a ratio table is conventionally drawn on
// paper. The scale factor between two adjacent value-rows sits OUTSIDE the
// table, in a narrow gutter column to the left and right (mirrored, same
// label both sides), at a thin "divider" row between them — never inside the
// table's own bordered cells.
export const RatioTable = ({ data, label }: { data: RatioTableData; label?: string }) => {
  const { headers, rows, operations } = data;

  const headerRow = (
    <tr key="header">
      <td style={{ border: "none" }} />
      {headers.map((h, i) => (
        <th key={i} style={{ border: BORDER, background: "#eff6ff", color: "#1e3a8a", fontWeight: 700, padding: "0.45rem 1.25rem", textAlign: "center" }}>
          {h}
        </th>
      ))}
      <td style={{ border: "none" }} />
    </tr>
  );

  const bodyRows = rows.flatMap((row, ri) => {
    const valueRow = (
      <tr key={`v-${ri}`}>
        <td style={{ border: "none" }} />
        {row.map((c, ci) => (
          <td key={ci} style={{ border: BORDER, padding: "0.45rem 1.25rem", textAlign: "center", fontSize: "1.1rem" }}>
            <MathRenderer latex={c} />
          </td>
        ))}
        <td style={{ border: "none" }} />
      </tr>
    );
    if (ri >= rows.length - 1) return [valueRow];

    const opLabel = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
        <MathRenderer latex={operations[ri]} />
      </div>
    );
    const dividerRow = (
      <tr key={`op-${ri}`}>
        <td style={{ border: "none", padding: "0 0.6rem" }}>{opLabel}</td>
        {row.map((_, ci) => (
          <td key={ci} style={{ borderLeft: BORDER, borderRight: BORDER, borderTop: "none", borderBottom: "none", padding: "0.05rem" }} />
        ))}
        <td style={{ border: "none", padding: "0 0.6rem" }}>{opLabel}</td>
      </tr>
    );
    return [valueRow, dividerRow];
  });

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-left w-full font-bold" style={{ color: "#000" }}>{label}</span>}
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {headerRow}
          {bodyRows}
        </tbody>
      </table>
    </div>
  );
};

// Ready-made stepRenderer: pass straight to ToolShell's `stepRenderer` prop.
// Returns null for every non-ratio-table step so mStep/tStep/step still
// render through ToolShell's normal path — the same fallback pattern a
// diagram tool's questionRenderer uses.
export const ratioTableStepRenderer = (s: WorkingStep): JSX.Element | null =>
  s.type === "ratioTable" ? <RatioTable data={s.extra as RatioTableData} label={s.label} /> : null;
