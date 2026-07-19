// ─────────────────────────────────────────────────────────────────────────────
// drawGraph.ts — the imperative canvas painter.
//
// One pure-ish draw pass: given a 2D context, the CSS size, the current viewport
// and the curve + FOIs, it clears and repaints axes, gridlines, the curve and
// feature dots. No React, no state — it is called from an rAF loop and from the
// initial paint, so both the inline thumbnail and the interactive overlay render
// through exactly the same code and look identical.
//
// The context is assumed pre-scaled to devicePixelRatio (ctx.setTransform(dpr…)),
// so everything here is authored in CSS pixels.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type CurveSpec, type FOI, type Viewport,
  mathToScreenX, mathToScreenY, screenToMathX, niceStep,
} from "./mathEngine";

export interface DrawStyle {
  background: string;
  gridMinor: string;
  gridMajor: string;
  axis: string;
  axisText: string;
  curve: string;
  foi: string;
  foiText: string;
}

/** Clean, print-friendly default palette (light). */
export const DEFAULT_STYLE: DrawStyle = {
  background: "#ffffff",
  gridMinor: "#eef2f7",
  gridMajor: "#dbe3ec",
  axis: "#334155",
  axisText: "#64748b",
  curve: "#2563eb",
  foi: "#db2777",
  foiText: "#9d174d",
};

/** One drawable curve with its colour. */
export interface CurveDraw {
  spec: CurveSpec;
  color?: string;
  /** Draw the curve dashed (e.g. a strict-inequality boundary). */
  dashed?: boolean;
}

/** Default series palette (cycled when a curve gives no colour). */
export const SERIES_COLORS = ["#2563eb", "#db2777", "#059669", "#d97706", "#7c3aed"];

/**
 * A shaded region — the "regions" layer that powers inequalities and bounded
 * areas. `curve` / `a` / `b` index into the `curves` array. Use ±Infinity for
 * an open-ended xBand.
 */
export type ShadeRegion =
  | { kind: "xBand"; from: number; to: number; color?: string; opacity?: number }
  | { kind: "halfPlane"; curve: number; side: "above" | "below"; from?: number; to?: number; color?: string; opacity?: number }
  | { kind: "between"; a: number; b: number; from?: number; to?: number; color?: string; opacity?: number }
  | { kind: "polygon"; points: Array<{ x: number; y: number }>; color?: string; opacity?: number };

/** A guide line — dashed root markers, asymptotes, reference lines. */
export interface Guide {
  kind: "vLine" | "hLine";
  at: number;
  dashed?: boolean;
  color?: string;
}

export interface DrawOptions {
  style?: Partial<DrawStyle>;
  axisLabels?: { x?: string; y?: string };
  showFois?: boolean;
  showTickLabels?: boolean;
  /** Line width for the plotted curve, in CSS px. Default 2.5. */
  curveWidth?: number;
  /** Clamp plotting to this x-domain (e.g. probability 0–1). */
  domain?: { xMin?: number; xMax?: number };
  /** Shaded regions drawn under the curves (inequalities, bounded areas). */
  regions?: ShadeRegion[];
  /** Guide lines drawn over the curves (dashed root markers, etc.). */
  guides?: Guide[];
}

/** Format a tick value without floating-point noise. */
function fmtTick(v: number, step: number): string {
  if (Math.abs(v) < step / 1e6) return "0";
  const dp = Math.max(0, -Math.floor(Math.log10(step)));
  const s = v.toFixed(Math.min(6, dp));
  // Strip trailing zeros ONLY in the fractional part — never an integer's units
  // digit (so 30 stays "30", not "3"); drop a bare trailing dot if left behind.
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  vp: Viewport,
  curves: CurveDraw[],
  fois: FOI[],
  opts: DrawOptions = {},
): void {
  const st = { ...DEFAULT_STYLE, ...(opts.style ?? {}) };
  const showFois = opts.showFois ?? true;
  const showTicks = opts.showTickLabels ?? true;
  const sx = (x: number) => mathToScreenX(x, vp, cssW);
  const sy = (y: number) => mathToScreenY(y, vp, cssH);

  // ── Background ──
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = st.background;
  ctx.fillRect(0, 0, cssW, cssH);

  // ── Gridline step: aim for ~70px spacing, snapped to a nice 1/2/5 value.
  //    Each axis gets its own step (they may have very different scales). ──
  const targetPx = 70;
  const stepX = niceStep(vp.unitsPerPixelX * targetPx);
  const stepY = niceStep(vp.unitsPerPixelY * targetPx);

  const xMinMath = screenToMathX(0, vp, cssW);
  const xMaxMath = screenToMathX(cssW, vp, cssW);
  const yTopMath = vp.centreY + (cssH / 2) * vp.unitsPerPixelY;
  const yBotMath = vp.centreY - (cssH / 2) * vp.unitsPerPixelY;

  const firstX = Math.ceil(xMinMath / stepX) * stepX;
  const firstY = Math.ceil(yBotMath / stepY) * stepY;

  // ── Minor + major gridlines ──
  ctx.lineWidth = 1;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "top";

  for (let x = firstX; x <= xMaxMath + stepX / 2; x += stepX) {
    const px = sx(x);
    ctx.strokeStyle = Math.abs(x) < stepX / 1e6 ? st.gridMajor : st.gridMinor;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, cssH);
    ctx.stroke();
  }
  for (let y = firstY; y <= yTopMath + stepY / 2; y += stepY) {
    const py = sy(y);
    ctx.strokeStyle = Math.abs(y) < stepY / 1e6 ? st.gridMajor : st.gridMinor;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(cssW, py);
    ctx.stroke();
  }

  // ── Shaded regions (under the axes & curves) ──
  if (opts.regions?.length) {
    for (const r of opts.regions) {
      ctx.save();
      ctx.globalAlpha = r.opacity ?? 0.16;
      ctx.fillStyle = r.color ?? st.curve;
      if (r.kind === "xBand") {
        const x0 = Number.isFinite(r.from) ? sx(r.from) : 0;
        const x1 = Number.isFinite(r.to) ? sx(r.to) : cssW;
        const lo = Math.max(0, Math.min(x0, x1));
        const hi = Math.min(cssW, Math.max(x0, x1));
        if (hi > lo) ctx.fillRect(lo, 0, hi - lo, cssH);
      } else if (r.kind === "polygon") {
        if (r.points.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(sx(r.points[0].x), sy(r.points[0].y));
          for (let p = 1; p < r.points.length; p++) ctx.lineTo(sx(r.points[p].x), sy(r.points[p].y));
          ctx.closePath();
          ctx.fill();
        }
      } else {
        const idxA = r.kind === "halfPlane" ? r.curve : r.a;
        const specA = curves[idxA]?.spec;
        if (specA?.kind === "function") {
          const fromX = r.from ?? screenToMathX(0, vp, cssW);
          const toX = r.to ?? screenToMathX(cssW, vp, cssW);
          const pxFrom = Math.max(0, sx(fromX));
          const pxTo = Math.min(cssW, sx(toX));
          if (pxTo > pxFrom) {
            ctx.beginPath();
            let started = false;
            for (let px = pxFrom; px <= pxTo; px++) {
              const y = specA.f(screenToMathX(px, vp, cssW));
              const py = Number.isFinite(y) ? sy(y) : (r.kind === "halfPlane" && r.side === "above" ? -cssH : cssH * 2);
              if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
            }
            if (r.kind === "halfPlane") {
              const edgeY = r.side === "above" ? 0 : cssH;
              ctx.lineTo(pxTo, edgeY);
              ctx.lineTo(pxFrom, edgeY);
            } else {
              const specB = curves[r.b]?.spec;
              if (specB?.kind === "function") {
                for (let px = pxTo; px >= pxFrom; px--) {
                  const y = specB.f(screenToMathX(px, vp, cssW));
                  ctx.lineTo(px, Number.isFinite(y) ? sy(y) : cssH * 2);
                }
              }
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  }

  // ── Axes (x = 0 and y = 0), clamped to the visible edge ──
  const axisX = Math.min(cssW, Math.max(0, sx(0)));
  const axisY = Math.min(cssH, Math.max(0, sy(0)));
  ctx.strokeStyle = st.axis;
  ctx.lineWidth = 1.5;
  // y-axis
  ctx.beginPath(); ctx.moveTo(axisX, 0); ctx.lineTo(axisX, cssH); ctx.stroke();
  // x-axis
  ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(cssW, axisY); ctx.stroke();

  // ── Tick labels along the axes ──
  if (showTicks) {
    // Each label gets a faint background pill so it never collides with the
    // axis line, gridlines or a curve passing behind it.
    const label = (text: string, cx: number, cy: number, align: "left" | "right" | "center", baseline: "top" | "middle") => {
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      const w = ctx.measureText(text).width;
      const bx = align === "right" ? cx - w : align === "center" ? cx - w / 2 : cx;
      const by = baseline === "middle" ? cy - 7 : cy - 1;
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = st.background;
      ctx.fillRect(bx - 2, by, w + 4, 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = st.axisText;
      ctx.fillText(text, cx, cy);
    };

    const xTickY = Math.min(cssH - 14, Math.max(2, axisY + 4));
    for (let x = firstX; x <= xMaxMath + stepX / 2; x += stepX) {
      if (Math.abs(x) < stepX / 1e6) continue;
      label(fmtTick(x, stepX), sx(x), xTickY, "center", "top");
    }
    // When the y-axis sits at the left edge, put its labels just to the RIGHT of
    // the axis (inside the plot) instead of clipping them off the left.
    const yLabelsRight = axisX < cssW * 0.16;
    for (let y = firstY; y <= yTopMath + stepY / 2; y += stepY) {
      if (Math.abs(y) < stepY / 1e6) continue;
      const py = sy(y);
      if (yLabelsRight) label(fmtTick(y, stepY), Math.max(2, axisX) + 6, py, "left", "middle");
      else label(fmtTick(y, stepY), Math.min(cssW - 4, axisX - 6), py, "right", "middle");
    }
  }

  // ── Axis name labels (custom, e.g. p / E(payoff)) ──
  const xLabel = opts.axisLabels?.x;
  const yLabel = opts.axisLabels?.y;
  ctx.fillStyle = st.axisText;
  ctx.font = "italic 13px ui-sans-serif, system-ui, sans-serif";
  if (xLabel) {
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(xLabel, cssW - 6, Math.min(cssH - 4, axisY - 6) + 0);
  }
  if (yLabel) {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(yLabel, Math.min(cssW - 40, axisX + 6), 6);
  }

  // ── The curves (each in its own colour) ──
  ctx.lineWidth = opts.curveWidth ?? 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const dLo = opts.domain?.xMin ?? -Infinity;
  const dHi = opts.domain?.xMax ?? Infinity;
  const yGuard = cssH * 4; // don't draw wildly off-screen segments

  curves.forEach((c, i) => {
    const spec = c.spec;
    ctx.strokeStyle = c.color ?? SERIES_COLORS[i % SERIES_COLORS.length] ?? st.curve;
    ctx.setLineDash(c.dashed ? [7, 5] : []);
    if (spec.kind === "circle") {
      // Ellipse so it stays correct under independent axis scales; with a locked
      // aspect (uppX === uppY) it renders as a true circle.
      ctx.beginPath();
      ctx.ellipse(sx(spec.cx), sy(spec.cy), spec.r / vp.unitsPerPixelX, spec.r / vp.unitsPerPixelY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.beginPath();
      let penDown = false;
      let prevPy = 0;
      for (let px = 0; px <= cssW; px += 1) {
        const x = screenToMathX(px, vp, cssW);
        if (x < dLo || x > dHi) { penDown = false; continue; }
        const y = spec.f(x);
        if (!Number.isFinite(y)) { penDown = false; continue; }
        const py = sy(y);
        if (py < -yGuard || py > cssH + yGuard) { penDown = false; continue; }
        // A huge vertical jump between adjacent pixels is an asymptote crossing,
        // not a real segment — lift the pen so no line spans the discontinuity.
        if (penDown && Math.abs(py - prevPy) > cssH * 2) ctx.moveTo(px, py);
        else if (penDown) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
        penDown = true;
        prevPy = py;
      }
      ctx.stroke();
    }
  });
  ctx.setLineDash([]);

  // ── Guide lines (over the curves) ──
  if (opts.guides?.length) {
    for (const g of opts.guides) {
      ctx.save();
      ctx.strokeStyle = g.color ?? st.axisText;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(g.dashed ? [5, 4] : []);
      ctx.beginPath();
      if (g.kind === "vLine") { const px = sx(g.at); ctx.moveTo(px, 0); ctx.lineTo(px, cssH); }
      else { const py = sy(g.at); ctx.moveTo(0, py); ctx.lineTo(cssW, py); }
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Feature-of-interest dots + labels ──
  if (showFois) {
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    for (const f of fois) {
      const px = sx(f.x);
      const py = sy(f.y);
      if (px < -20 || px > cssW + 20 || py < -20 || py > cssH + 20) continue;
      if (f.highlight) {
        // Emphasised marker: a filled dot inside a contrasting ring.
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, 2 * Math.PI);
        ctx.fillStyle = st.background;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = st.foi;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fillStyle = st.foi;
        ctx.fill();
      } else if (f.open) {
        // Hollow dot — strict-inequality endpoint (x not included).
        ctx.fillStyle = st.background;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = st.foi;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = st.foi;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = st.background;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}
