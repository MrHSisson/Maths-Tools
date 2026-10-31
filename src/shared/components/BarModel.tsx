import type { CSSProperties } from "react";
import { InlineMath } from "./MathRenderer";
import { BAR_TONES, barUnits, braceRows, type BarFill, type BarModelData } from "../barModel";

// The stacked look Ratio Sharing uses: one row per quantity, aligned from the left, white boxes with a navy border,
// a value in each box, "= total" at the end of the row, the extra boxes of a difference in purple.
const ROW_BORDER = "#1e3a8a", ROW_KNOWN = "#93c5fd", EXTRA_BORDER = "#a855f7", EXTRA_FILL = "#e9d5ff";

// The bar model (docs/reference/pictures.md): a row of equal boxes coloured by part, with braces above and below.
// Drawn at a given pixel size so a slide (canvas units) and a tool page can both use it; `size` is the text size
// the braces and box labels are set in. Overlapping braces on one side stack outwards from the bar.

const TICK = 0.3;   // bracket end ticks, as a fraction of `size`

/** `data` is what is drawn; `layout` (the whole bar, when `data` is a stage of it) fixes where everything sits, so nothing moves as parts and braces arrive. */
function RowsBar({ data, layout, width, height, size, fill }: { data: BarModelData; layout?: BarModelData; width: number; height: number; size: number; fill: BarFill }) {
  const whole = layout ?? data, all = whole.rows ?? [], rows = data.rows ?? [];
  const maxU = barUnits(whole), filled = fill === "filled";
  const nameChars = fill === "blank" ? 0 : Math.max(0, ...all.map((r) => (r.name ?? "").length));
  const nameW = nameChars ? nameChars * size * 0.56 + size * 0.6 : 0;
  const boxH = size * 1.5, boxW = size * 1.6, gap = size * 0.08, rowGap = size * 0.45;
  const totalW = filled ? Math.max(0, ...all.map((r) => (r.total ? r.total.replace(/[\\${}]/g, "").length + 2 : 0))) * size * 0.55 + (all.some((r) => r.total) ? size * 0.6 : 0) : 0;
  const braceW = filled && whole.sideBrace ? size * 0.9 + whole.sideBrace.label.replace(/[\\${}]/g, "").length * size * 0.5 : 0;
  const natW = nameW + maxU * (boxW + gap) + totalW + braceW, natH = all.length * boxH + (all.length - 1) * rowGap;
  const k = Math.min(1, width / natW, height / natH), z = size * k;       // everything is sized from the whole picture, so nothing moves or rescales as rows arrive
  const left = (width - natW * k) / 2, top = (height - natH * k) / 2;
  const bw = boxW * k, bh = boxH * k, g = gap * k, rg = rowGap * k, nw = nameW * k, tw = totalW * k;
  const bracketX = left + nw + maxU * (bw + g) + tw + z * 0.2;
  return (
    <div style={{ position: "relative", width, height }}>
      {rows.map((r, ri) => {
        const y = top + ri * (bh + rg);
        return (
          <div key={ri}>
            {nw > 0 && <div style={{ position: "absolute", left, top: y, width: nw - z * 0.35, height: bh, display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: z * 0.9, fontWeight: 700, color: "#000", whiteSpace: "nowrap" }}>{fill !== "blank" && r.name ? <InlineMath text={r.name} /> : null}</div>}
            {Array.from({ length: Math.max(0, Math.floor(r.units)) }, (_, bi) => {
              const extra = filled && r.extraFrom !== undefined && bi >= r.extraFrom;
              return (
                <div key={bi} style={{ position: "absolute", left: left + nw + bi * (bw + g), top: y, width: bw, height: bh, boxSizing: "border-box", borderRadius: z * 0.2, border: `${Math.max(2, z * 0.075)}px solid ${extra ? EXTRA_BORDER : ROW_BORDER}`,
                  background: extra ? EXTRA_FILL : filled && r.known ? ROW_KNOWN : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: z * 0.7, fontWeight: 700, color: "#000", whiteSpace: "nowrap" }}>
                  {filled && r.unitLabel ? <InlineMath text={r.unitLabel} /> : null}
                </div>
              );
            })}
            {filled && r.total && <div style={{ position: "absolute", left: left + nw + maxU * (bw + g) + z * 0.25, top: y, height: bh, display: "flex", alignItems: "center", fontSize: z * 0.9, fontWeight: 700, color: "#000", whiteSpace: "nowrap" }}><InlineMath text={`= ${r.total}`} /></div>}
          </div>
        );
      })}
      {filled && data.sideBrace && (
        <>
          <svg width={z * 0.5} height={natH * k} style={{ position: "absolute", left: bracketX, top, overflow: "visible" }}>
            <path d={`M 0 1 L ${z * 0.3} 1 L ${z * 0.3} ${natH * k - 1} L 0 ${natH * k - 1}`} fill="none" stroke="#475569" strokeWidth={Math.max(2, z * 0.06)} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", left: bracketX + z * 0.5, top, height: natH * k, display: "flex", alignItems: "center", fontSize: z * 0.9, color: "#0f172a", whiteSpace: "nowrap" }}><InlineMath text={data.sideBrace.label} /></div>
        </>
      )}
    </div>
  );
}

export function BarModel({ data, layout, width, height, size = 40, fill = "filled" }: { data: BarModelData; layout?: BarModelData; width: number; height: number; size?: number; fill?: BarFill }) {
  const whole = layout ?? data;
  const N = barUnits(whole), n = barUnits(data);
  if (n < 1 || N < 1) return null;
  if (whole.rows) return <RowsBar data={data} layout={layout} width={width} height={height} size={size} fill={fill} />;
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
