import type { RatioTableData, WorkingStep } from "../types";
import { MathRenderer } from "./MathRenderer";

const BORDER = "2px solid #1e3a8a";

// Ratio table — see src/shared/ratioTable.ts for the authoring helper (rStep)
// and CLAUDE.md's "Core representations" table for where this sits alongside
// the bar model, number line, etc. Renders as a genuine bordered <table> —
// one ROW per quantity (the row label in the left-hand cell), one COLUMN per
// scale-step — matching how a ratio table is conventionally drawn on paper.
// The scale-factor between two adjacent columns is a single cell spanning
// every quantity row (rowSpan), sitting visually between them.
export const RatioTable = ({ data, label }: { data: RatioTableData; label?: string }) => {
  const { headers, rows, operations } = data;
  const nSteps = rows.length;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-left w-full font-bold" style={{ color: "#000" }}>{label}</span>}
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {headers.map((h, qi) => (
            <tr key={qi}>
              <th
                style={{
                  textAlign: "left", padding: "0.45rem 1rem", fontWeight: 700, color: "#1e3a8a",
                  border: BORDER, background: "#eff6ff", whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
              {Array.from({ length: nSteps }, (_, si) => si).flatMap((si) => {
                const cells = [
                  <td key={`v-${qi}-${si}`} style={{ border: BORDER, padding: "0.45rem 1.25rem", textAlign: "center", fontSize: "1.1rem" }}>
                    <MathRenderer latex={rows[si][qi]} />
                  </td>,
                ];
                if (si < nSteps - 1 && qi === 0) {
                  cells.push(
                    <td key={`op-${si}`} rowSpan={headers.length} style={{ border: "none", padding: "0 0.6rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                        <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>→</span>
                        <MathRenderer latex={operations[si]} />
                      </div>
                    </td>,
                  );
                }
                return cells;
              })}
            </tr>
          ))}
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
