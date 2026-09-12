import type { RatioTableData, WorkingStep } from "../types";
import { MathRenderer } from "./MathRenderer";

// Ratio table — see src/shared/ratioTable.ts for the authoring helper (rStep)
// and CLAUDE.md's "Core representations" table for where this sits alongside
// the bar model, number line, etc. Renders as a CSS grid rather than a plain
// <table> so each column's scale-arrow sits directly under that column,
// mirroring the hand-drawn form (values, then "↓ ÷2" under every column, then
// the scaled values) and chains cleanly for a multi-step scale.
export const RatioTable = ({ data, label }: { data: RatioTableData; label?: string }) => {
  const { headers, rows, operations } = data;
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-left w-full font-bold" style={{ color: "#000" }}>{label}</span>}
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${headers.length}, minmax(4.5rem, auto))`,
          columnGap: "1.75rem",
          rowGap: "0.35rem",
          justifyItems: "center",
        }}
      >
        {headers.map((h, i) => (
          <div
            key={`h-${i}`}
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: 700,
              color: "#1e3a8a",
              paddingBottom: "0.35rem",
              borderBottom: "2px solid #1e3a8a",
            }}
          >
            {h}
          </div>
        ))}
        {rows[0].map((c, i) => (
          <div key={`r0-${i}`} style={{ fontSize: "1.15rem" }}>
            <MathRenderer latex={c} />
          </div>
        ))}
        {rows.slice(1).map((row, ri) => (
          <RowGroup key={ri} row={row} op={operations[ri]} rowIndex={ri} />
        ))}
      </div>
    </div>
  );
};

const RowGroup = ({ row, op, rowIndex }: { row: string[]; op: string; rowIndex: number }) => (
  <>
    {row.map((_, i) => (
      <div
        key={`op-${rowIndex}-${i}`}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}
      >
        <span>↓</span>
        <MathRenderer latex={op} />
      </div>
    ))}
    {row.map((c, i) => (
      <div key={`r-${rowIndex}-${i}`} style={{ fontSize: "1.15rem" }}>
        <MathRenderer latex={c} />
      </div>
    ))}
  </>
);

// Ready-made stepRenderer: pass straight to ToolShell's `stepRenderer` prop.
// Returns null for every non-ratio-table step so mStep/tStep/step still
// render through ToolShell's normal path — the same fallback pattern a
// diagram tool's questionRenderer uses.
export const ratioTableStepRenderer = (s: WorkingStep): JSX.Element | null =>
  s.type === "ratioTable" ? <RatioTable data={s.extra as RatioTableData} label={s.label} /> : null;
