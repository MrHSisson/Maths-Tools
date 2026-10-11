import type { WorkingStep } from "../types";
import type { LongDivisionData } from "../longDivision";
import { MathRenderer } from "./MathRenderer";

const RULE = "2px solid #1e3a8a";

/** Polynomial long division laid out as on paper — see src/shared/longDivision.ts. */
export const LongDivision = ({ data, label, scale = 1 }: { data: LongDivisionData; label?: string; scale?: number }) => {
  const { divisor, cols, quotient, dividend, steps } = data;
  const cell = (s: string, key: string, extra: React.CSSProperties = {}) => (
    <div key={key} style={{ minWidth: `${3.1 * scale}rem`, padding: "2px 6px", textAlign: "right", whiteSpace: "nowrap", ...extra }}>
      {s ? <MathRenderer latex={s} /> : <span>&nbsp;</span>}
    </div>
  );
  const rows: { cells: string[]; under?: boolean; bar?: boolean; head?: string }[] = [
    { cells: ["", ...quotient.slice(1)] },
    { cells: dividend, bar: true, head: divisor },
    ...steps.flatMap(s => [{ cells: s.product, under: true }, { cells: s.remainder }]),
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", fontSize: `${scale}em` }}>
      <div>
        {label && <div style={{ marginBottom: 6, color: "#475569" }}>{label}</div>}
        <div style={{ display: "grid", gridTemplateColumns: `auto repeat(${cols}, auto)`, alignItems: "center", width: "fit-content", margin: "0 auto" }}>
          {rows.map((r, ri) => [
            <div key={`h${ri}`} style={{ padding: "2px 8px 2px 0", textAlign: "right", whiteSpace: "nowrap", borderRight: r.bar ? RULE : undefined, borderTop: undefined }}>
              {r.head ? <MathRenderer latex={r.head} /> : <span>&nbsp;</span>}
            </div>,
            ...r.cells.map((s, ci) => cell(s, `${ri}-${ci}`, {
              borderTop: r.bar ? RULE : undefined,
              borderBottom: r.under && s ? "1.5px solid #64748b" : undefined,
            })),
          ])}
        </div>
      </div>
    </div>
  );
};

/** `stepRenderer` for tools using `ldStep`: null for every other step. */
export const longDivisionStepRenderer = (s: WorkingStep): JSX.Element | null =>
  s.type === "longDivision" ? <LongDivision data={s.extra as LongDivisionData} label={s.label} scale={1.1} /> : null;
