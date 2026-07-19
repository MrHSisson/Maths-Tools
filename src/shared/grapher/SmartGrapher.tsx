// ─────────────────────────────────────────────────────────────────────────────
// SmartGrapher.tsx — the embeddable graphing component.
//
// The one thing tools call upon to drop an accurate, clean, auto-framed graph
// into a worked example, answer panel or question. Two tiers, one component:
//
//   • Inline (default)  → a static, feature-framed thumbnail with an Expand
//                         button. No pan/zoom, cheap, legible at small size.
//   • Pop-out (expand)  → the same graph in a near-fullscreen overlay, now fully
//                         interactive (pan / pinch / wheel-zoom) with a floating
//                         toolbar (Auto-Center · Fullscreen · Export PNG).
//
// Presets (linear / quadratic / cubic / circle) need only `equationType` +
// `params`. Custom curves pass `fn` + a `config` (domain lock, axis labels,
// explicit FOIs) — this is how e.g. a probability graph locked to p ∈ [0,1]
// is built.
//
// Performance contract: pan/zoom never touch React state. The viewport lives in
// a ref; drawing is an imperative rAF loop (see usePanZoom + drawGraph).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Maximize2, Minimize2, Crosshair, Download, X } from "lucide-react";
import {
  type EquationType, type FOI, type Viewport, type CurveSpec,
  buildCurveSpec, computeFOIs, computeFrame, findFunctionIntersections,
} from "./mathEngine";
import { drawGraph, type DrawStyle, type CurveDraw, type ShadeRegion, type Guide, SERIES_COLORS } from "./drawGraph";
import { usePanZoom } from "./usePanZoom";

// ── Public API ───────────────────────────────────────────────────────────────

export interface GrapherConfig {
  /** Clamp the plotted / framed range. `lockDomain` frames x exactly to it. */
  domain?: { xMin?: number; xMax?: number; yMin?: number; yMax?: number };
  lockDomain?: boolean;
  /** Rename the axes, e.g. { x: "p", y: "E(payoff)" }. */
  axisLabels?: { x?: string; y?: string };
  /** Extra / override features to frame and mark (required for custom curves). */
  fois?: FOI[];
  /** Auto-derive FOIs (roots/vertex…) from preset curves. Default true.
   *  Recipes that supply their own points (e.g. open/closed roots) set false. */
  autoFois?: boolean;
  /** Auto-detect and dot intersections between function curves. Default true.
   *  Set false when only a specific crossing should be marked (supply it via fois). */
  autoIntersections?: boolean;
  /** Show the FOI dots. Default true. */
  showFois?: boolean;
  /** Fractional framing padding. Default 0.15. */
  padding?: number;
  /** Draw-style overrides (colours). */
  style?: Partial<DrawStyle>;
}

/** One plotted curve in a multi-line graph (simultaneous equations, mixed strategies…). */
export interface GraphSeries {
  equationType: EquationType;
  /** Coefficients for presets: linear [m,c] · quadratic [a,b,c] · cubic [a,b,c,d] · circle [cx,cy,r]. */
  params?: number[];
  /** Custom curve y = fn(x) — used when equationType === "custom". */
  fn?: (x: number) => number;
  /** Curve colour. Defaults to the series palette by position. */
  color?: string;
  /** Legend label, e.g. "y = 2x + 1". */
  label?: string;
  /** Draw dashed (a strict-inequality boundary). */
  dashed?: boolean;
}

export interface SmartGrapherProps {
  // ── Single-curve API (backward compatible) ──
  equationType?: EquationType;
  /** Coefficients for presets: linear [m,c] · quadratic [a,b,c] · cubic [a,b,c,d] · circle [cx,cy,r]. */
  params?: number[];
  /** Custom curve y = fn(x) — used when equationType === "custom". */
  fn?: (x: number) => number;

  // ── Multi-curve API ──
  /** Multiple curves on one graph. When given, overrides equationType/params/fn.
   *  Intersections between function curves are found and framed automatically. */
  series?: GraphSeries[];
  /** Show a legend for the series' labels. Default true when any series has a label. */
  showLegend?: boolean;

  /** Shaded regions (inequalities, bounded areas). Indices refer to series order. */
  regions?: ShadeRegion[];
  /** Guide lines (dashed root markers, reference lines). */
  guides?: Guide[];

  config?: GrapherConfig;
  /** Force full interactivity inline (default false → static thumbnail). */
  interactive?: boolean;
  /** Show the Expand button on the inline thumbnail. Default true. */
  allowExpand?: boolean;
  /** Inline height (CSS). Default 260. Width always fills the container. */
  height?: number | string;
  /** Optional caption shown above the graph. */
  title?: string;
  className?: string;
}

// ── Inner canvas — owns the buffer, the draw loop and (optionally) pan/zoom ──

interface GraphCanvasProps {
  curves: CurveDraw[];
  fois: FOI[];
  regions?: ShadeRegion[];
  guides?: Guide[];
  config: GrapherConfig;
  interactive: boolean;
  /** Changing this string re-frames the view (new question / new params). */
  frameKey: string;
  /** Registers an auto-center callback with the parent (for the toolbar). */
  registerAutoCenter?: (fn: () => void) => void;
  registerExport?: (fn: () => void) => void;
}

function GraphCanvas({
  curves, fois, regions, guides, config, interactive, frameKey, registerAutoCenter, registerExport,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport>({ centreX: 0, centreY: 0, unitsPerPixel: 0.05 });
  const framedKeyRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);

  const cssSize = () => {
    const el = wrapRef.current;
    return { w: el?.clientWidth ?? 0, h: el?.clientHeight ?? 0 };
  };

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = cssSize();
    drawGraph(ctx, w, h, viewportRef.current, curves, fois, {
      axisLabels: config.axisLabels,
      showFois: config.showFois ?? true,
      style: config.style,
      domain: config.domain,
      regions,
      guides,
    });
  }, [curves, fois, regions, guides, config]);

  const requestDraw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paint();
    });
  }, [paint]);

  const reframe = useCallback(() => {
    const { w, h } = cssSize();
    if (w <= 0 || h <= 0) return;
    viewportRef.current = computeFrame(fois, curves.map((c) => c.spec), w, h, {
      domain: config.domain,
      lockDomain: config.lockDomain,
      padding: config.padding,
    });
    framedKeyRef.current = frameKey;
    requestDraw();
  }, [fois, curves, config, frameKey, requestDraw]);

  // Keep the pixel buffer mapped 1:1 to the CSS box, and (re)frame when needed.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const sync = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (framedKeyRef.current !== frameKey) reframe();
      else requestDraw();
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [frameKey, reframe, requestDraw]);

  // Re-frame when the maths changes (new props) — inline graphs track their tool.
  useEffect(() => {
    if (framedKeyRef.current !== frameKey) reframe();
  }, [frameKey, reframe]);

  // Expose auto-center / export to the toolbar.
  useEffect(() => {
    registerAutoCenter?.(reframe);
    registerExport?.(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "graph.png";
      a.click();
    });
  }, [registerAutoCenter, registerExport, reframe]);

  usePanZoom(canvasRef, viewportRef, requestDraw, {
    enabled: interactive,
    clamp: config.lockDomain ? config.domain : undefined,
  });

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

// ── Toolbar (interactive mode only) ──────────────────────────────────────────

function ToolbarButton({ onClick, title, children }: {
  onClick: () => void; title: string; children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow border border-slate-200 transition-colors"
    >
      {children}
    </button>
  );
}

// ── Exported component ───────────────────────────────────────────────────────

export function SmartGrapher({
  equationType, params, fn, series, showLegend, regions, guides, config = {},
  interactive = false, allowExpand = true, height = 260, title, className,
}: SmartGrapherProps) {
  const [expanded, setExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const autoCenterRef = useRef<(() => void) | null>(null);
  const exportRef = useRef<(() => void) | null>(null);

  // Normalise single-curve props into the series list (one source of truth).
  const seriesList: GraphSeries[] = useMemo(
    () => series ?? [{ equationType: equationType ?? "linear", params, fn }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(series?.map((s) => [s.equationType, s.params, s.color, s.label])),
      equationType, JSON.stringify(params)],
  );

  // Build the drawable curves (with colours) and all FOIs — per-series features,
  // any supplied in config, plus automatically-detected intersections.
  const { curves, fois } = useMemo(() => {
    const built: CurveDraw[] = seriesList.map((s, i) => ({
      spec: buildCurveSpec(s.equationType, s.params ?? [], s.fn),
      color: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length],
      dashed: s.dashed,
    }));

    const allFois: FOI[] = [];
    if (config.autoFois !== false) {
      for (const s of seriesList) allFois.push(...computeFOIs(s.equationType, s.params ?? []));
    }
    if (config.fois) allFois.push(...config.fois);

    // Intersections between every pair of function curves, over a provisional
    // x-range taken from the features so far (or the locked/domain range).
    const xs = allFois.map((f) => f.x).filter(Number.isFinite);
    if (config.domain?.xMin !== undefined) xs.push(config.domain.xMin);
    if (config.domain?.xMax !== undefined) xs.push(config.domain.xMax);
    let xMin = xs.length ? Math.min(...xs) : -10;
    let xMax = xs.length ? Math.max(...xs) : 10;
    if (xMax - xMin < 1e-6) { xMin -= 5; xMax += 5; }
    const span = xMax - xMin;
    const scanLo = config.domain?.xMin ?? xMin - span;
    const scanHi = config.domain?.xMax ?? xMax + span;

    if (config.autoIntersections !== false) {
      const fns = built.filter((c) => c.spec.kind === "function").map((c) => c.spec) as Extract<CurveSpec, { kind: "function" }>[];
      for (let i = 0; i < fns.length; i++) {
        for (let j = i + 1; j < fns.length; j++) {
          for (const pt of findFunctionIntersections(fns[i].f, fns[j].f, scanLo, scanHi)) {
            allFois.push({ x: pt.x, y: pt.y, kind: "point", label: "intersection" });
          }
        }
      }
    }
    return { curves: built, fois: allFois };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(seriesList.map((s) => [s.equationType, s.params])), JSON.stringify(config.fois),
      JSON.stringify(config.domain), config.autoFois, config.autoIntersections]);

  // A stable-ish key so the inner canvas re-frames when the maths changes.
  const frameKey = useMemo(
    () => JSON.stringify([seriesList.map((s) => [s.equationType, s.params]), config.domain, config.lockDomain, config.fois]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(seriesList.map((s) => [s.equationType, s.params])), JSON.stringify(config.domain), config.lockDomain, JSON.stringify(config.fois)],
  );

  // Legend: shown when any series carries a label (or explicitly enabled).
  const legendItems = seriesList
    .map((s, i) => ({ label: s.label, color: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }))
    .filter((l) => !!l.label);
  const wantLegend = showLegend ?? legendItems.length > 0;

  // Track native fullscreen state for the icon toggle.
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Close overlay on Escape (only when not in native fullscreen).
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const toggleFullscreen = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }, []);

  const toolbar = (
    <div className="absolute top-3 right-3 z-10 flex gap-2">
      <ToolbarButton title="Auto-center" onClick={() => autoCenterRef.current?.()}>
        <Crosshair size={18} />
      </ToolbarButton>
      <ToolbarButton title="Export PNG" onClick={() => exportRef.current?.()}>
        <Download size={18} />
      </ToolbarButton>
      <ToolbarButton title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </ToolbarButton>
      <ToolbarButton title="Close" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); setExpanded(false); }}>
        <X size={18} />
      </ToolbarButton>
    </div>
  );

  const heightCss = typeof height === "number" ? `${height}px` : height;

  const legend = wantLegend && legendItems.length > 0 && (
    <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 bg-white/85 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
      {legendItems.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: l.color }} />
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={className}>
      {title && (
        <div className="text-sm font-semibold text-slate-600 mb-1 text-center">{title}</div>
      )}

      {/* Inline thumbnail */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-200 bg-white"
        style={{ width: "100%", height: heightCss }}
      >
        <GraphCanvas
          curves={curves}
          fois={fois}
          regions={regions}
          guides={guides}
          config={config}
          interactive={interactive}
          frameKey={frameKey}
          registerAutoCenter={interactive ? (f) => { autoCenterRef.current = f; } : undefined}
          registerExport={interactive ? (f) => { exportRef.current = f; } : undefined}
        />
        {legend}
        {interactive && toolbar}
        {!interactive && allowExpand && (
          <button
            onClick={() => setExpanded(true)}
            title="Expand"
            className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-white/85 hover:bg-white text-slate-600 shadow-sm border border-slate-200 transition-colors"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      {/* Pop-out overlay — the full interactive experience */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          style={{ background: "rgba(15, 23, 42, 0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div
            ref={overlayRef}
            className="relative w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {title && (
              <div className="absolute top-3 left-4 z-10 text-base font-semibold text-slate-700">
                {title}
              </div>
            )}
            <GraphCanvas
              curves={curves}
              fois={fois}
              regions={regions}
              guides={guides}
              config={config}
              interactive
              frameKey={frameKey}
              registerAutoCenter={(f) => { autoCenterRef.current = f; }}
              registerExport={(f) => { exportRef.current = f; }}
            />
            {legend}
            {toolbar}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartGrapher;
