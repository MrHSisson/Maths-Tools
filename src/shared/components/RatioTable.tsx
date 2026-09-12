import { useEffect, useRef, useState } from "react";
import type { RatioTableData, WorkingStep } from "../types";
import { MathRenderer } from "./MathRenderer";

const BORDER = "2px solid #1e3a8a";

// A straight downward arrow (line + head), stretched via preserveAspectRatio
// to whatever pixel height its segment measures.
const ArrowGlyph = ({ height }: { height: number }) => (
  <svg width="12" height={Math.max(height, 1)} viewBox="0 0 12 40" preserveAspectRatio="none" style={{ display: "block", flexShrink: 0 }}>
    <line x1="6" y1="2" x2="6" y2="32" stroke="#6b7280" strokeWidth="2" />
    <polygon points="6,40 1,30 11,30" fill="#6b7280" />
  </svg>
);

interface Segment { top: number; height: number }

// Ratio table — see src/shared/ratioTable.ts for the authoring helper (rStep)
// and CLAUDE.md's "Core representations" table for where this sits alongside
// the bar model, number line, etc. One continuous bordered <table> — quantities
// as columns (the header row), each scale-step a value row going straight down
// with no gap row between them. The scale factor sits OUTSIDE the table (a
// gutter to the left and right) as an arrow running from the vertical CENTRE
// of one value row to the centre of the next, label beside it.
//
// The centre-to-centre positions are measured in real pixels (refs +
// getBoundingClientRect), not CSS percentages: a percentage height on a plain
// div inside a <td> does not reliably resolve against the cell's rowSpan-
// derived height in this rendering engine (it was found to collapse to 0,
// stacking every arrow at the same spot) — the same measurement approach
// WorkedExampleSteps.tsx's FitWidth already uses elsewhere in this codebase.
// A plain (not layout) effect is deliberate: MathRenderer paints its KaTeX
// into each cell from its own effect, and child effects run before the
// parent's in the same commit, so by the time this measures, the cells have
// already reached their final rendered size.
export const RatioTable = ({ data, label }: { data: RatioTableData; label?: string }) => {
  const { headers, rows, operations } = data;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const measure = () => {
      const wrapperTop = wrapper.getBoundingClientRect().top;
      const centreOf = (tr: HTMLTableRowElement | null) => {
        if (!tr) return 0;
        const r = tr.getBoundingClientRect();
        return r.top + r.height / 2 - wrapperTop;
      };
      setSegments(
        operations.map((_, i) => {
          const top = centreOf(rowRefs.current[i]);
          const bottom = centreOf(rowRefs.current[i + 1]);
          return { top, height: Math.max(bottom - top, 0) };
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [rows, operations]);

  const opLabel = (side: "left" | "right", seg: Segment, op: string, i: number) => {
    const arrow = <ArrowGlyph key="arrow" height={seg.height} />;
    const text = (
      <span key="text" style={{ color: "#6b7280", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
        <MathRenderer latex={op} />
      </span>
    );
    // Reading outward from the table: arrow (nearest), then the operation
    // label (outermost) — on both sides, so the whole row reads
    // "operation ← arrow ← ROW → arrow → operation".
    return (
      <div
        key={`${side}-${i}`}
        style={{
          position: "absolute", top: seg.top, height: seg.height,
          ...(side === "left" ? { right: "100%", marginRight: "0.4rem" } : { left: "100%", marginLeft: "0.4rem" }),
          display: "flex", alignItems: "center", gap: "0.35rem",
        }}
      >
        {side === "left" ? [text, arrow] : [arrow, text]}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-left w-full font-bold" style={{ color: "#000" }}>{label}</span>}
      <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ border: BORDER, background: "#eff6ff", color: "#1e3a8a", fontWeight: 700, padding: "0.45rem 1.25rem", textAlign: "center" }}>
                  {h}
                </th>
              ))}
            </tr>
            {rows.map((row, ri) => (
              <tr key={ri} ref={(el) => { rowRefs.current[ri] = el; }}>
                {row.map((c, ci) => (
                  <td key={ci} style={{ border: BORDER, padding: "0.45rem 1.25rem", textAlign: "center", fontSize: "1.1rem" }}>
                    <MathRenderer latex={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {segments.map((seg, i) => [opLabel("left", seg, operations[i], i), opLabel("right", seg, operations[i], i)])}
      </div>
    </div>
  );
};

// Ready-made stepRenderer: pass straight to ToolShell's `stepRenderer` prop.
// Returns null for every non-ratio-table step so mStep/tStep/step still
// render through ToolShell's normal path — the same fallback pattern a
// diagram tool's questionRenderer uses.
export const ratioTableStepRenderer = (s: WorkingStep): JSX.Element | null =>
  s.type === "ratioTable" ? <RatioTable data={s.extra as RatioTableData} label={s.label} /> : null;
