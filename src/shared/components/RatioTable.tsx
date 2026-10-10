import { useEffect, useRef, useState } from "react";
import type { RatioTableData, WorkingStep } from "../types";
import { MathRenderer } from "./MathRenderer";

const BORDER = "2px solid #1e3a8a";

// A downward arrow that bulges outward (away from the table) in a curve
// before returning to meet the arrowhead, stretched via preserveAspectRatio
// to whatever pixel height its segment measures. Authored bulging left (as
// if the table sits to its right); the "right" gutter mirrors the same path
// with CSS so it bulges the other way instead of needing a second path.
//
// The path M 14 2 Q 2 20 14 32 is a quadratic bezier whose tangent at the
// end (t=1) is 2·(end − control) = 2·((14,32) − (2,20)) = (24,24) — a clean
// 45° line. The arrowhead is authored pointing straight down in its own
// local coordinates, then translated to that endpoint and rotated to match
// (rotate(-45) points it down-and-right, matching that tangent) — otherwise
// it stays fixed pointing straight down while the curve visibly bends away
// from it, looking disconnected from the line it's supposed to cap.
const ArrowGlyph = ({ height, side, w = 26 }: { height: number; side: "left" | "right"; w?: number }) => (
  <svg
    width={w} height={Math.max(height, 1)} viewBox="0 0 20 40" preserveAspectRatio="none"
    style={{ display: "block", flexShrink: 0, transform: side === "right" ? "scaleX(-1)" : undefined }}
  >
    <path d="M 14 2 Q 2 20 14 32" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="0,8 -5,-2 5,-2" fill="#6b7280" transform="translate(14, 32) rotate(-45)" />
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
//
// Sized to be read from the back of a room: `scale` multiplies the whole table (text, padding, arrows); 1 is the
// default step size, the fullscreen worked example passes more.
export const RatioTable = ({ data, label, scale = 1 }: { data: RatioTableData; label?: string; scale?: number }) => {
  const { headers, rows, operations, opSides, fresh } = data;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const measure = () => {
      const wrapperBox = wrapper.getBoundingClientRect();
      // getBoundingClientRect is in SCREEN pixels; the arrows are positioned in the table's own pixels, so undo any scale
      // an ancestor applies (the fullscreen worked example scales the picture up to fill its panel)
      const scale = wrapper.offsetHeight ? wrapperBox.height / wrapper.offsetHeight : 1;
      const centreOf = (tr: HTMLTableRowElement | null) => {
        if (!tr) return 0;
        const r = tr.getBoundingClientRect();
        return (r.top + r.height / 2 - wrapperBox.top) / scale;
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

  // rStepSolve hides an arrow's sides until their step; ordinary tables show both.
  const sideShown = (side: "left" | "right", i: number) => {
    const s = opSides?.[i] ?? "both";
    return s === "both" || s === side;
  };

  const opLabel = (side: "left" | "right", seg: Segment, op: string, i: number) => {
    const arrow = <ArrowGlyph key="arrow" height={seg.height} side={side} w={Math.round(26 * scale)} />;
    const text = (
      <span key="text" style={{ color: "#6b7280", fontWeight: 600, fontSize: `${1.25 * scale}rem`, whiteSpace: "nowrap" }}>
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
          ...(side === "left" ? { right: "100%", marginRight: "0.5rem" } : { left: "100%", marginLeft: "0.5rem" }),
          display: "flex", alignItems: "center", gap: "0.35rem",
        }}
      >
        {side === "left" ? [text, arrow] : [arrow, text]}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2" style={{ fontSize: `${scale}rem` }}>
      {label && <span className="text-left w-full font-bold" style={{ color: "#000" }}>{label}</span>}
      <div style={{ display: "inline-block", padding: operations.length ? "0 5.6em" : 0 }}>{/* room for the arrows + factors, so anything measuring or fitting the table counts them */}
      <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ border: BORDER, background: "#eff6ff", color: "#1e3a8a", fontWeight: 700, fontSize: "1.2em", padding: "0.55em 1.2em", textAlign: "center" }}>
                  {h}
                </th>
              ))}
            </tr>
            {rows.map((row, ri) => (
              <tr key={ri} ref={(el) => { rowRefs.current[ri] = el; }}>
                {row.map((c, ci) => {
                  const isFresh = fresh?.[0] === ri && fresh?.[1] === ci;
                  return (
                    <td key={ci} style={{ border: BORDER, padding: "0.45em 1.2em", textAlign: "center", fontSize: "1.6em", ...(isFresh ? { background: "#dcfce7", color: "#166534", fontWeight: 700 } : {}) }}>
                      {c === "" ? <span style={{ color: "#9ca3af", fontWeight: 700 }}>?</span> : <MathRenderer latex={c} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {segments.map((seg, i) => [sideShown("left", i) && opLabel("left", seg, operations[i], i), sideShown("right", i) && opLabel("right", seg, operations[i], i)])}
      </div>
      </div>
    </div>
  );
};

// Ready-made stepRenderer: pass straight to ToolShell's `stepRenderer` prop.
// Returns null for every non-ratio-table step so mStep/tStep/step still
// render through ToolShell's normal path — the same fallback pattern a
// diagram tool's questionRenderer uses.
export const ratioTableStepRenderer = (s: WorkingStep): JSX.Element | null =>
  s.type === "ratioTable" ? <RatioTable data={s.extra as RatioTableData} label={s.label} scale={1.1} /> : null;

/** `stepVisualRenderer` for `rStepBuild` tools: just the table as it stands at that step (null for any other step). */
export const ratioTableStepVisual = (s: WorkingStep): JSX.Element | null =>
  s.type === "ratioTable" && (s.extra as RatioTableData | undefined)?.grow ? <RatioTable data={s.extra as RatioTableData} scale={1.1} /> : null;
