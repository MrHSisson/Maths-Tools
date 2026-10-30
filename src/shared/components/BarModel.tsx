import type { CSSProperties } from "react";
import { InlineMath } from "./MathRenderer";
import { BAR_TONES, barUnits, braceRows, type BarFill, type BarModelData } from "../barModel";

// The bar model (docs/reference/pictures.md): a row of equal boxes coloured by part, with braces above and below.
// Drawn at a given pixel size so a slide (canvas units) and a tool page can both use it; `size` is the text size
// the braces and box labels are set in. Overlapping braces on one side stack outwards from the bar.

const TICK = 0.3;   // bracket end ticks, as a fraction of `size`

/** `data` is what is drawn; `layout` (the whole bar, when `data` is a stage of it) fixes where everything sits, so nothing moves as parts and braces arrive. */
export function BarModel({ data, layout, width, height, size = 40, fill = "filled" }: { data: BarModelData; layout?: BarModelData; width: number; height: number; size?: number; fill?: BarFill }) {
  const whole = layout ?? data;
  const N = barUnits(whole), n = barUnits(data);
  if (n < 1 || N < 1) return null;
  const braces = fill === "filled" ? data.braces ?? [] : [];
  const allBraces = fill === "filled" ? whole.braces ?? [] : [];
  const rows = braceRows(allBraces);
  const GAP = size * 0.12;
  const rowH = size * 1.55 + size * TICK + GAP;
  const above = Math.max(0, ...allBraces.map((b, i) => (b.below ? 0 : rows[i] + 1)));
  const below = Math.max(0, ...allBraces.map((b, i) => (b.below ? rows[i] + 1 : 0)));
  const room = height - (above + below) * rowH;
  const unitW = Math.min(width / N, Math.max(size, room) * 1.25);
  const boxH = Math.max(size, Math.min(unitW * 0.95, size * 2.6, room));
  const barW = unitW * N, left = (width - barW) / 2;
  const top = (height - ((above + below) * rowH + boxH)) / 2 + above * rowH;
  // each box's tone, from its part
  const tones: number[] = whole.parts.flatMap((p, pi) => Array(Math.max(0, Math.floor(p.units))).fill(p.tone ?? pi));
  const label = fill === "filled" ? data.unitLabel : undefined;
  const box = (i: number): CSSProperties => {
    const t = BAR_TONES[(tones[i] ?? 0) % BAR_TONES.length];
    const blank = fill === "blank";
    return { position: "absolute", left: left + i * unitW, top, width: unitW, height: boxH, boxSizing: "border-box", border: `${Math.max(2, size * 0.07)}px solid ${blank ? "#475569" : t.stroke}`,
      background: blank ? "#ffffff" : t.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 600, color: t.stroke, whiteSpace: "nowrap" };
  };
  return (
    <div style={{ position: "relative", width, height }}>
      {Array.from({ length: n }, (_, i) => <div key={i} style={box(i)}>{label ? <InlineMath text={label} /> : null}</div>)}
      {braces.map((b, k) => {
        const x1 = left + b.from * unitW, x2 = left + b.to * unitW, w = x2 - x1;
        const y = b.below ? top + boxH + rows[k] * rowH : top - (rows[k] + 1) * rowH;
        const tick = size * TICK, line = Math.max(2, size * 0.06);
        const path = b.below ? `M 1 ${GAP} L 1 ${GAP + tick} L ${w - 1} ${GAP + tick} L ${w - 1} ${GAP}` : `M 1 ${rowH - GAP} L 1 ${rowH - GAP - tick} L ${w - 1} ${rowH - GAP - tick} L ${w - 1} ${rowH - GAP}`;
        return (
          <div key={k} style={{ position: "absolute", left: x1, top: y, width: w, height: rowH }}>
            <svg width={w} height={rowH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><path d={path} fill="none" stroke="#475569" strokeWidth={line} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ position: "absolute", left: -w * 0.25, width: w * 1.5, top: b.below ? GAP + tick + size * 0.1 : 0, height: rowH - GAP - tick - size * 0.1, display: "flex", alignItems: b.below ? "flex-start" : "flex-end", justifyContent: "center", fontSize: size, lineHeight: 1.2, color: "#0f172a", whiteSpace: "nowrap" }}>
              <InlineMath text={b.label} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
