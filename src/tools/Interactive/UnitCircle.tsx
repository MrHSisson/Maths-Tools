import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode, type CSSProperties } from "react";
import { Home, Menu, X, Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronDown, Eye, EyeOff } from "lucide-react";
import { InfoModal, type InfoSection } from "../../shared";
import { shouldAutoOpenAbout, markAboutSeen } from "../../shared/about";
import { useLayoutMode } from "../../shared/layoutMode";
import { PAGE_BG } from "../../shared/colors";
import { printPrintable, trigGraphSheet } from "../../shared/printables";
import {
  SPECIALS, specialsFor, inFamily, exactValues, decimalValues, radText, degToRadWorking, radToDegWorking,
  type Family,
} from "./unitCircleMath";

const INFO_SECTIONS: InfoSection[] = [
  { title: "Unit Circle", icon: "⭕", content: [
    { label: "Overview", detail: "A unit circle (radius 1) joined to the graphs of sin, cos and tan. Move the angle round the circle and watch each graph being drawn, in degrees, radians or both." },
    { label: "Moving the angle", detail: "Drag the point on the circle, drag along the graph, use the slider, or step between the marked angles with the arrow buttons. Play sweeps the angle round the circle." },
    { label: "Radians", detail: "Every marked angle shows its radian form as a fraction of π, with the working for degrees × π/180 and radians × 180/π underneath." },
    { label: "Exact values", detail: "A popup over the point gives its exact coordinates (cos θ, sin θ): the x-coordinate is cos θ and the y-coordinate is sin θ. Hover over any marked point to preview its coordinates." },
    { label: "Tan", detail: "On the circle, tan θ is the length cut off on the tangent line at (1, 0). It grows without limit as the angle reaches 90° and 270°, which is why the graph has asymptotes there." },
  ]},
  { title: "Controls", icon: "🛠️", content: [
    { label: "Angles", detail: "Show angles in degrees, radians or both together." },
    { label: "Graphs", detail: "Switch sin, cos and tan on or off. Any combination can be shown at once." },
    { label: "Working", detail: "Shows or hides the conversion working and the values under the graph. Hidden, the graph fills the right-hand side." },
    { label: "Printables", detail: "The menu has a blank sheet of sin, cos and tan graphs (−π to 3π across, −2 to 2 up) to draw on once the class has built the shapes." },
    { label: "Display", detail: "Choose which angles are marked (multiples of 30°, of 45°, or both), whether radians are shown as multiples of π or as decimals, and how fast Play runs." },
    { label: "Hide answers", detail: "Hides the radian labels, coordinates and values until you tap a point to reveal it. Good for asking the class first." },
    { label: "Build graph", detail: "Draws each graph only as far as the current angle, so it grows as the angle moves." },
    { label: "Label graph points", detail: "Writes the exact value beside each marked point on the graphs." },
  ]},
];

type Fn = "sin" | "cos" | "tan";
type Units = "deg" | "rad" | "both";
type RadStyle = "pi" | "dec";

// ── One palette, one type scale, one set of line weights ───────────────────────────────────────────────────────────────────
const COL: Record<Fn, string> = { sin: "#2563eb", cos: "#059669", tan: "#d97706" };
const INK = "#0f172a", MUTE = "#64748b", FAINT = "#94a3b8", RULE = "#cbd5e1", HAIR = "#e2e8f0", ACCENT = "#4f46e5";
const FS = 15;                   // graph axis labels
const FS_MAIN = 18, FS_SUB = 13; // circle labels: the main unit large, the other small
const LINE = 5;                  // the coloured helper lines on the circle
const CURVE = 3.5;                 // the graph curves

// ── Drawing text with stacked fractions ("−√3/2" → minus, √3 over 2) ───────────────────────────────────────────────────────
const parseExact = (t: string) => {
  const neg = t.startsWith("−");
  const body = neg ? t.slice(1) : t;
  const parts = body.split("/");
  return { neg, body, frac: parts.length === 2 ? ([parts[0], parts[1]] as [string, string]) : null };
};
const qWidth = (t: string, size: number): number => {
  if (t === "(" || t === "," || t === ")") return size * 0.42;
  const { neg, body, frac } = parseExact(t);
  const w = frac ? Math.max(frac[0].length, frac[1].length) * size * 0.6 + 3 : body.length * size * 0.6;
  return w + (neg ? size * 0.7 : 0);
};

function Q({ x, y, t, size = FS, fill = INK, weight = 600 }: { x: number; y: number; t: string; size?: number; fill?: string; weight?: number }) {
  const { neg, body, frac } = parseExact(t);
  const total = qWidth(t, size);
  const mw = neg ? size * 0.7 : 0;
  const w = total - mw;
  const x0 = x - total / 2;
  return (
    <g fill={fill} fontSize={size} fontWeight={weight} textAnchor="middle" stroke="#fff" strokeWidth={2.6} paintOrder="stroke" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
      {neg && <text x={x0 + size * 0.3} y={y + size * 0.32}>−</text>}
      {frac ? (
        <>
          <text x={x0 + mw + w / 2} y={y - size * 0.22}>{frac[0]}</text>
          <line x1={x0 + mw} x2={x0 + mw + w} y1={y} y2={y} stroke={fill} strokeWidth={1} paintOrder="normal" />
          <text x={x0 + mw + w / 2} y={y + size * 0.86}>{frac[1]}</text>
        </>
      ) : (
        <text x={x0 + mw + w / 2} y={y + size * 0.34}>{body}</text>
      )}
    </g>
  );
}

function Row({ x, y, items, size, fills }: { x: number; y: number; items: string[]; size: number; fills?: string[] }) {
  const gap = size * 0.2;
  const widths = items.map((t) => qWidth(t, size));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let cx = x - total / 2;
  return (
    <g>
      {items.map((t, i) => {
        const centre = cx + widths[i] / 2;
        cx += widths[i] + gap;
        return <Q key={i} x={centre} y={y} t={t} size={size} fill={fills?.[i] ?? INK} />;
      })}
    </g>
  );
}

// ── The same idea in HTML, for the badge and readout ───────────────────────────────────────────────────────────────────────
function H({ t }: { t: string }) {
  const { neg, frac } = parseExact(t);
  if (!frac) return <span>{t}</span>;
  return (
    <span className="inline-flex items-center align-middle">
      {neg && <span>−</span>}
      <span className="inline-flex flex-col items-center text-[0.88em] leading-[1.12] mx-0.5">
        <span className="border-b border-current px-0.5">{frac[0]}</span>
        <span className="px-0.5">{frac[1]}</span>
      </span>
    </span>
  );
}
function Rich({ s }: { s: string }) {
  return <>{s.split(" ").map((tok, i) => <span key={i}>{i > 0 ? " " : ""}{tok.includes("/") ? <H t={tok} /> : tok}</span>)}</>;
}

// ── Controls ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
function Seg<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      {label && <span className="text-xs font-semibold text-slate-500">{label}</span>}
      <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-0.5">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id}
            className={`min-h-[36px] px-3.5 rounded-lg text-sm font-semibold transition-all ${value === o.id ? "bg-white text-slate-900 shadow-card" : "text-slate-500 hover:text-slate-800"}`}>{o.text}</button>
        ))}
      </div>
    </div>
  );
}
function FnChip({ on, colour, onClick, children }: { on: boolean; colour: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className="min-h-[40px] pl-3 pr-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors"
      style={on ? { borderColor: colour, background: colour + "14", color: colour } : { borderColor: RULE, background: "#fff", color: MUTE }}>
      <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: on ? colour : FAINT, background: on ? colour : "transparent" }} />
      {children}
    </button>
  );
}
function Switch({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} className="w-full flex items-center justify-between gap-4 min-h-[44px] text-left">
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <span className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${on ? "bg-indigo-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
function IconBtn({ onClick, title, children, primary }: { onClick: () => void; title: string; children: ReactNode; primary?: boolean }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${primary ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-card" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{children}</button>
  );
}

// ── Geometry ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const R = 124;                  // circle radius in SVG units
const VB = 188;                 // circle viewBox half-size
const cp = (deg: number, r = R): [number, number] => [r * Math.cos((deg * Math.PI) / 180), -r * Math.sin((deg * Math.PI) / 180)];
const rad = (deg: number) => (deg * Math.PI) / 180;

const GW = 600, GH = 400, PX0 = 52, PX1 = 586, PY0 = 14, PY1 = 292;
const PW = PX1 - PX0, PH = PY1 - PY0;
const xOf = (deg: number) => PX0 + (deg / 360) * PW;
const YMAX = 2;
const yOf = (v: number) => PY0 + PH * (1 - (v + YMAX) / (2 * YMAX));
const Y_TICKS = [-2, -1, 0, 1, 2];

const toSvg = (svg: SVGSVGElement, e: { clientX: number; clientY: number }) => {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
};

const FN: Record<Fn, (r: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
const FNS: Fn[] = ["sin", "cos", "tan"];
const SPEEDS = { slow: 18, normal: 36, fast: 72 } as const;

const TRIG_SHEET = trigGraphSheet();

const RANGE_CSS = `
.uc-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;outline:none;cursor:pointer;background:linear-gradient(to right,${ACCENT} var(--p),${HAIR} var(--p))}
.uc-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid ${ACCENT};box-shadow:0 1px 4px rgba(15,23,42,.3)}
.uc-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid ${ACCENT};box-shadow:0 1px 4px rgba(15,23,42,.3)}
.uc-range:focus-visible{box-shadow:0 0 0 3px rgba(79,70,229,.3)}
`;

export default function UnitCircle() {
  const { phone, portrait } = useLayoutMode();
  const stacked = phone || portrait;

  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const arrivalSearch = useRef(typeof window === "undefined" ? "" : window.location.search);
  useEffect(() => {   // "About this tool" opens once per device, the first time, from a plain address only
    const path = window.location.pathname;
    if (shouldAutoOpenAbout(path, arrivalSearch.current)) { markAboutSeen(path); setInfoOpen(true); }
  }, []);

  const [angle, setAngle] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>("normal");
  const [units, setUnits] = useState<Units>("both");
  const [radStyle, setRadStyle] = useState<RadStyle>("pi");
  const [family, setFamily] = useState<Family>("30");
  const [fns, setFns] = useState<Record<Fn, boolean>>({ sin: true, cos: false, tan: false });
  const [showExact, setShowExact] = useState(true);
  const [graphLabels, setGraphLabels] = useState(false);
  const [trace, setTrace] = useState(false);
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [hoverDeg, setHoverDeg] = useState<number | null>(null);
  const [showWorking, setShowWorking] = useState(true);
  const [optsOpen, setOptsOpen] = useState(false);
  const optsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!optsOpen) return;
    const h = (e: MouseEvent) => { if (optsRef.current && !optsRef.current.contains(e.target as Node)) setOptsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [optsOpen]);

  const shown = Math.round(angle);
  const exact = exactValues(shown);
  const dec = decimalValues(shown);
  const fam = useMemo(() => specialsFor(family), [family]);
  const anyFn = fns.sin || fns.cos || fns.tan;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setAngle((a) => { const n = a + dt * SPEEDS[speed]; return n >= 360 ? n - 360 : n; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const reveal = useCallback((d: number) => { const k = d % 360; setRevealed((r) => (r.includes(k) ? r : [...r, k])); }, []);
  const snap = useCallback((d: number, tol: number) => {
    for (const s of [...fam, 360]) if (Math.min(Math.abs(d - s), 360 - Math.abs(d - s)) <= tol) return s === 360 && d < 180 ? 0 : s;
    return d;
  }, [fam]);
  const setTo = useCallback((d: number, tol = 2.5) => {
    const v = snap(Math.round(d), tol);
    setAngle(v);
    if (exactValues(v)) reveal(v);
  }, [snap, reveal]);

  const circleRef = useRef<SVGSVGElement>(null);
  const graphRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"circle" | "graph" | null>(null);

  const moveFromCircle = (e: React.PointerEvent) => {
    const p = circleRef.current && toSvg(circleRef.current, e);
    if (!p) return;
    let d = (Math.atan2(-p.y, p.x) * 180) / Math.PI;
    if (d < 0) d += 360;
    setTo(Math.round(d) % 360);
  };
  const moveFromGraph = (e: React.PointerEvent) => {
    const p = graphRef.current && toSvg(graphRef.current, e);
    if (!p) return;
    setTo(Math.max(0, Math.min(360, ((p.x - PX0) / PW) * 360)), 4);
  };
  const down = (which: "circle" | "graph") => (e: React.PointerEvent<SVGSVGElement>) => {
    setPlaying(false);
    dragging.current = which;
    e.currentTarget.setPointerCapture(e.pointerId);
    (which === "circle" ? moveFromCircle : moveFromGraph)(e);
  };
  const move = (which: "circle" | "graph") => (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current === which) (which === "circle" ? moveFromCircle : moveFromGraph)(e);
  };
  const up = () => { dragging.current = null; };

  const stepSpecial = (dir: 1 | -1) => {
    setPlaying(false);
    const list = [...fam, 360];
    const next = dir === 1 ? list.find((s) => s > shown) ?? list[0] : [...list].reverse().find((s) => s < shown) ?? list[list.length - 1];
    setAngle(next);
    reveal(next);
  };
  const reset = () => { setPlaying(false); setAngle(30); setRevealed([]); };

  const visibleAnswer = (deg: number) => !hide || revealed.includes(deg % 360) || shown % 360 === deg % 360;
  const radOn = (deg: number) => units !== "deg" && visibleAnswer(deg);
  const radLabel = (deg: number) => (radStyle === "pi" ? radText(deg) : deg === 0 ? "0" : rad(deg).toFixed(2));

  // ── Circle ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  const [px, py] = cp(angle);
  const cosA = Math.cos(rad(angle)), sinA = Math.sin(rad(angle));
  const tanA = Math.abs(cosA) < 1e-9 ? null : sinA / cosA;
  const arcR = 34;
  const [ax, ay] = cp(angle, arcR);
  const marked = SPECIALS.filter((s) => inFamily(s, family));

  // One main label per point, large: radians outside (degrees outside when degrees only). With both, the degrees are small and just inside the rim.
  const ringLabels = marked.map((s) => {
    const rShow = radOn(s.deg);
    const [ox, oy] = cp(s.deg, R + (units === "deg" ? 30 : 36));
    const [ix, iy0] = cp(s.deg, R - 31);
    const iy = s.deg === 0 ? iy0 + 19 : iy0;       // the fixed arm runs along 0°, so its label sits just below it
    // an inner degree label steps aside when the point or a helper line runs through it
    const nearPoint = Math.hypot(ix - px, iy - py) < 44;
    const onSin = fns.sin && Math.abs(ix - px) < 26 && iy > Math.min(0, py) - 12 && iy < Math.max(0, py) + 12;
    const onCos = fns.cos && Math.abs(iy) < 20 && ix > Math.min(0, px) - 12 && ix < Math.max(0, px) + 12;
    const onTan = fns.tan && tanA !== null && Math.abs(ix - R) < 26;
    const innerOk = !(nearPoint || onSin || onCos || onTan);
    return (
      <g key={"r" + s.deg}>
        {units === "deg" && <text x={ox} y={oy + 6} textAnchor="middle" fontSize={FS_MAIN} fontWeight={700} fill="#475569">{s.deg}°</text>}
        {units !== "deg" && rShow && <Q x={ox} y={oy} t={radLabel(s.deg)} size={FS_MAIN} fill={ACCENT} weight={700} />}
        {units === "both" && innerOk && <text x={ix} y={iy + 4.5} textAnchor="middle" fontSize={FS_SUB} fontWeight={600} fill={MUTE} stroke="#f8fafc" strokeWidth={3} paintOrder="stroke">{s.deg}°</text>}
      </g>
    );
  });

  const tanEnd = (() => {
    if (tanA === null) return null;
    const k = Math.min(1, (VB - 4) / (R * Math.abs(tanA)));
    return { rayX: R * k, rayY: -R * tanA * k, segY: Math.max(-(VB - 4), Math.min(VB - 4, -R * tanA)) };
  })();

  const popup = (() => {
    const a = hoverDeg ?? angle;
    const [qx, qy] = cp(a);
    const ex = exactValues(Math.round(a));
    const hiddenPop = hide && !visibleAnswer(hoverDeg ?? shown);
    const f2 = (v: number) => (Math.abs(v) < 0.0005 ? "0" : v.toFixed(2)).replace("-", "−");
    const cs = hiddenPop ? "?" : ex ? ex.cos : f2(Math.cos(rad(a)));
    const sn = hiddenPop ? "?" : ex ? ex.sin : f2(Math.sin(rad(a)));
    const items = ["(", cs, ",", sn, ")"];
    const fills = [MUTE, COL.cos, MUTE, COL.sin, MUTE];
    const size = 21;
    const w = items.reduce((t, it) => t + qWidth(it, size), 0) + size * 0.2 * 4 + 34;
    const h = 66;
    const below = qy < -R * 0.5;
    const cx = Math.max(-VB + w / 2 + 2, Math.min(VB - w / 2 - 2, qx));
    const cy = below ? qy + 24 + h / 2 + 8 : qy - 24 - h / 2 - 8;
    const edge = below ? cy - h / 2 : cy + h / 2;
    const tx = Math.max(cx - w / 2 + 16, Math.min(cx + w / 2 - 16, qx));
    return (
      <g style={{ pointerEvents: "none", filter: "drop-shadow(0 4px 10px rgba(15,23,42,0.18))" }}>
        <polygon points={`${tx - 7},${edge} ${tx + 7},${edge} ${tx},${edge + (below ? -9 : 9)}`} fill="#fff" />
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={12} fill="#fff" />
        <Row x={cx} y={cy - 2} items={items} size={size} fills={fills} />
      </g>
    );
  })();

  const circleSvg = (
    <svg ref={circleRef} viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`} className="w-full h-full select-none" style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={down("circle")} onPointerMove={move("circle")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Unit circle">
      {/* axes and circle */}
      <line x1={-R - 14} x2={R + 14} y1={0} y2={0} stroke={RULE} strokeWidth={1.25} />
      <line y1={-R - 14} y2={R + 14} x1={0} x2={0} stroke={RULE} strokeWidth={1.25} />
      {fns.tan && <line x1={R} x2={R} y1={-VB} y2={VB} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="4 4" opacity={0.5} />}
      <circle cx={0} cy={0} r={R} fill="#f8fafc" stroke="#334155" strokeWidth={2} />

      {/* angle: soft sector with a clean arc */}
      {angle >= 359.5
        ? <circle cx={0} cy={0} r={arcR} fill={ACCENT} fillOpacity={0.1} stroke={ACCENT} strokeWidth={2.5} />
        : angle > 0.5 && (
          <>
            <path d={`M0,0 L${arcR},0 A${arcR},${arcR} 0 ${angle > 180 ? 1 : 0} 0 ${ax},${ay} Z`} fill={ACCENT} fillOpacity={0.1} />
            <path d={`M${arcR},0 A${arcR},${arcR} 0 ${angle > 180 ? 1 : 0} 0 ${ax},${ay}`} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}

      {/* the fixed arm of the angle: the dark line from the centre to 0° */}
      <line x1={0} y1={0} x2={R} y2={0} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />

      {/* radius, then the coloured helper lines */}
      <line x1={0} y1={0} x2={px} y2={py} stroke={ACCENT} strokeWidth={3.2} strokeLinecap="round" />
      {fns.cos && <line x1={0} y1={0} x2={px} y2={0} stroke={COL.cos} strokeWidth={LINE} strokeLinecap="round" />}
      {fns.sin && <line x1={px} y1={0} x2={px} y2={py} stroke={COL.sin} strokeWidth={LINE} strokeLinecap="round" />}
      {fns.tan && tanEnd && (
        <>
          <line x1={0} y1={0} x2={tanEnd.rayX} y2={tanEnd.rayY} stroke={COL.tan} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
          <line x1={R} y1={0} x2={R} y2={tanEnd.segY} stroke={COL.tan} strokeWidth={LINE} strokeLinecap="round" />
        </>
      )}

      {/* marked points and their labels */}
      {marked.map((s) => {
        const [sx, sy] = cp(s.deg);
        const on = shown % 360 === s.deg;
        return (
          <g key={"d" + s.deg}>
            <circle cx={sx} cy={sy} r={on ? 6 : 4.4} fill={on ? ACCENT : "#fff"} stroke={on ? ACCENT : "#475569"} strokeWidth={2} />
            {showExact && <circle cx={sx} cy={sy} r={12} fill="transparent" onPointerEnter={(e) => { if (e.pointerType === "mouse") setHoverDeg(s.deg); }} onPointerLeave={() => setHoverDeg(null)} />}
          </g>
        );
      })}
      {ringLabels}

      {/* the moving point */}
      <circle cx={px} cy={py} r={18} fill={ACCENT} opacity={0.14} style={{ pointerEvents: "none" }} />
      <circle cx={px} cy={py} r={10.5} fill={ACCENT} stroke="#fff" strokeWidth={3} />
      {showExact && popup}
    </svg>
  );

  // ── Graph ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  const radTag = (d: number): string => (radStyle === "pi" ? radText(d) : rad(d).toFixed(2));
  const curve = (f: Fn): string => {
    const upto = trace ? Math.min(360, angle) : 360;
    const segs: [number, number][] = f === "tan" ? [[0, 89.5], [90.5, 269.5], [270.5, 360]] : [[0, 360]];
    const step = f === "tan" ? 1 : 2;
    let d = "";
    for (const [a, b] of segs) {
      if (a > upto) break;
      const end = Math.min(b, upto);
      let first = true;
      const add = (x: number) => {
        const y = yOf(Math.max(-YMAX * 4, Math.min(YMAX * 4, FN[f](rad(x)))));
        d += `${first ? "M" : "L"}${xOf(x).toFixed(1)},${y.toFixed(1)}`;
        first = false;
      };
      for (let x = a; x < end; x += step) add(x);
      add(end);
    }
    return d;
  };

  const xMarks = [...marked, { deg: 360, family: "both" as const }];
  const curX = xOf(Math.min(360, angle));
  const valueAt = (f: Fn): number | null => (f === "sin" ? sinA : f === "cos" ? cosA : tanA);

  const graphLabelPoints: ReactNode[] = [];
  if (graphLabels) {
    FNS.forEach((f) => {
      if (!fns[f]) return;
      marked.forEach((s) => {
        const txt = exactValues(s.deg)![f];
        if (txt === "undefined" || !visibleAnswer(s.deg)) return;
        const v = FN[f](rad(s.deg));
        if (Math.abs(v) > YMAX || (trace && s.deg > angle)) return;
        const x = xOf(s.deg), y = yOf(v);
        graphLabelPoints.push(
          <g key={f + s.deg}>
            <circle cx={x} cy={y} r={3.4} fill="#fff" stroke={COL[f]} strokeWidth={1.8} />
            <Q x={x} y={y + (v >= 0 ? -15 : 14)} t={txt} size={10} fill={COL[f]} />
          </g>,
        );
      });
    });
  }

  const graphSvg = (
    <svg ref={graphRef} viewBox={`0 0 ${GW} ${GH}`} className="w-full h-full select-none" style={{ touchAction: "pan-y", cursor: "ew-resize" }}
      onPointerDown={down("graph")} onPointerMove={move("graph")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Graphs of sine, cosine and tangent">
      <defs><clipPath id="uc-plot"><rect x={PX0} y={PY0} width={PW} height={PH} /></clipPath></defs>

      {/* grid */}
      {xMarks.map((m) => <line key={"g" + m.deg} x1={xOf(m.deg)} x2={xOf(m.deg)} y1={PY0} y2={PY1} stroke={m.deg % 90 === 0 ? HAIR : "#f1f5f9"} strokeWidth={1} />)}
      {Y_TICKS.map((v) => <line key={"h" + v} x1={PX0} x2={PX1} y1={yOf(v)} y2={yOf(v)} stroke={v === 0 ? FAINT : HAIR} strokeWidth={v === 0 ? 1.5 : 1} />)}
      <line x1={PX0} x2={PX0} y1={PY0} y2={PY1} stroke={RULE} strokeWidth={1} />
      {Y_TICKS.map((v) => <text key={"yl" + v} x={PX0 - 9} y={yOf(v) + 4} textAnchor="end" fontSize={FS} fill={MUTE}>{v < 0 ? `−${-v}` : v}</text>)}
      {fns.tan && [90, 270].map((a) => <line key={"as" + a} x1={xOf(a)} x2={xOf(a)} y1={PY0} y2={PY1} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="5 4" opacity={0.55} />)}

      {/* ticks at every marked point, labels at the quarter turns only, and a tag showing the current angle */}
      {xMarks.map((m) => <line key={"tk" + m.deg} x1={xOf(m.deg)} x2={xOf(m.deg)} y1={PY1} y2={PY1 + (m.deg % 90 === 0 ? 7 : 4)} stroke={FAINT} strokeWidth={1.5} />)}
      {xMarks.filter((m) => m.deg % 90 === 0 && Math.abs(m.deg - Math.min(360, angle)) > 32).map((m) => {
        const x = xOf(m.deg), rShow = radOn(m.deg);
        return (
          <g key={"xl" + m.deg}>
            {units === "deg" && <text x={x} y={PY1 + 29} textAnchor="middle" fontSize={FS + 1} fontWeight={700} fill="#475569">{m.deg}°</text>}
            {units !== "deg" && rShow && <Q x={x} y={PY1 + 26} t={radLabel(m.deg)} size={FS + 1} fill={ACCENT} weight={700} />}
            {units === "both" && <text x={x} y={PY1 + 62} textAnchor="middle" fontSize={FS - 2} fontWeight={600} fill={MUTE}>{m.deg}°</text>}
          </g>
        );
      })}
      {anyFn && (() => {
        const cx = Math.max(PX0 + 52, Math.min(PX1 - 52, curX));
        const hid = hide && !visibleAnswer(shown);
        const txt = units === "deg" ? `${shown}°` : units === "rad" ? (hid ? "?" : radTag(shown)) : `${shown}° · ${hid ? "?" : radTag(shown)}`;
        const w = txt.length * 9.2 + 22;
        return (
          <g style={{ pointerEvents: "none" }}>
            <rect x={cx - w / 2} y={PY1 + 12} width={w} height={32} rx={16} fill={ACCENT} />
            <text x={cx} y={PY1 + 33} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">{txt}</text>
          </g>
        );
      })()}

      {/* curves */}
      <g clipPath="url(#uc-plot)">
        {FNS.map((f) => fns[f] && <path key={f} d={curve(f)} fill="none" stroke={COL[f]} strokeWidth={CURVE} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
      {graphLabelPoints}

      {/* the current angle, with a guide across to the axis for each curve */}
      {anyFn && <line x1={curX} x2={curX} y1={PY0} y2={PY1} stroke={ACCENT} strokeWidth={1.25} strokeDasharray="4 4" opacity={0.7} />}
      {FNS.map((f) => {
        const v = valueAt(f);
        if (!fns[f] || v === null || Math.abs(v) > YMAX) return null;
        return <line key={"gd" + f} x1={PX0} x2={curX} y1={yOf(v)} y2={yOf(v)} stroke={COL[f]} strokeWidth={1.25} strokeDasharray="2 4" opacity={0.7} />;
      })}
      {FNS.map((f) => {
        const v = valueAt(f);
        if (!fns[f] || v === null || Math.abs(v) > YMAX) return null;
        return <circle key={"m" + f} cx={curX} cy={yOf(v)} r={8.5} fill={COL[f]} stroke="#fff" strokeWidth={3} />;
      })}
      {!anyFn && <text x={PX0 + PW / 2} y={PY0 + PH / 2} textAnchor="middle" fontSize={14} fill={FAINT}>Switch on sin, cos or tan to draw a graph</text>}
    </svg>
  );

  // ── Angle badge and readout ─────────────────────────────────────────────────────────────────────────────────────────
  const radDecimal = rad(shown);
  const hiddenNow = hide && !visibleAnswer(shown);
  const radNow = hiddenNow ? "?" : radLabel(shown);
  const badgeEl = (cls: string) => (
    <div className={cls}>
      <div className="text-[40px] leading-none font-semibold text-slate-800 flex items-center gap-3 h-[48px] whitespace-nowrap">
        {units === "deg" && <span>{shown}°</span>}
        {units === "both" && <><span>{shown}°</span><span className="text-slate-300">=</span><span style={{ color: ACCENT }}><H t={radNow} /></span></>}
        {units === "rad" && <span className="inline-flex items-center" style={{ color: ACCENT }}><H t={radNow} /><span className="ml-2 text-[26px]">rad</span></span>}
      </div>
      <div className="text-sm text-slate-500 h-6 mt-1 whitespace-nowrap">
        {units === "rad" && <>= {shown}°{!hiddenNow && radStyle === "pi" && shown !== 0 ? <> ≈ {radDecimal.toFixed(3)} rad</> : null}</>}
        {units === "both" && !hiddenNow && radStyle === "pi" && shown !== 0 ? <>≈ {radDecimal.toFixed(3)} rad</> : null}
      </div>
    </div>
  );

  const hideWorking = hide && !visibleAnswer(shown);
  const valueChip = (f: Fn) => {
    const e = exact ? exact[f] : null;
    const d = f === "tan" ? dec.tan : dec[f];
    return (
      <div key={f} className="rounded-xl bg-white h-[76px] flex-1 min-w-0 flex flex-col justify-center pl-4 pr-2 border border-slate-200" style={{ borderLeft: `5px solid ${COL[f]}` }}>
        <div className="text-[13px] font-semibold" style={{ color: COL[f] }}>{f} θ</div>
        <div className="text-[26px] font-semibold text-slate-900 h-12 flex items-center gap-2 whitespace-nowrap">
          {hideWorking ? "?" : e ? <>= <H t={e} /></> : <>= {d === null ? "undefined" : d.toFixed(3)}</>}
          {!hideWorking && e && e !== "undefined" && d !== null && <span className="text-sm font-normal text-slate-400 ml-1">≈ {d.toFixed(2)}</span>}
        </div>
      </div>
    );
  };
  const line = (label: string, body: ReactNode, big = true) => (
    <div className="min-w-0">
      <div className="text-[13px] font-semibold text-slate-500">{label}</div>
      <div className={`${big ? "text-[24px] h-14" : "text-[18px] h-10"} text-slate-800 flex items-center whitespace-nowrap overflow-hidden`}><span>{body}</span></div>
    </div>
  );
  const toRad = line("Degrees → radians", hideWorking ? <span className="text-slate-400">{shown}° × π/180 = ?</span> : <Rich s={degToRadWorking(shown).join(" = ")} />);
  const toDeg = line("Radians → degrees", hideWorking ? <span className="text-slate-400">? × 180/π = {shown}°</span> : <Rich s={radToDegWorking(shown).join(" = ")} />);
  const readout = (
    <div className="p-3.5 grid gap-2" style={{ gridTemplateRows: "74px 76px" }}>
      {units === "rad" ? toDeg : toRad}
      <div className="flex gap-2.5">
        {FNS.filter((f) => fns[f]).map(valueChip)}
        {!anyFn && <div className="text-sm text-slate-400 self-center">Switch on sin, cos or tan to see its value.</div>}
      </div>
    </div>
  );

  // ── Page ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const card = "bg-white rounded-2xl border border-slate-300 shadow-card";
  const pct = (Math.min(360, shown) / 360) * 100;

  const playbar = (
    <div className="flex items-center gap-2.5 px-4 py-2.5 border-t border-slate-200">
      <IconBtn onClick={() => stepSpecial(-1)} title="Previous marked angle"><SkipBack size={18} /></IconBtn>
      <IconBtn onClick={() => setPlaying((p) => !p)} title={playing ? "Pause" : "Play"} primary>{playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}</IconBtn>
      <IconBtn onClick={() => stepSpecial(1)} title="Next marked angle"><SkipForward size={18} /></IconBtn>
      <div className="flex-1 min-w-0 h-10 flex items-center px-1.5">
        <input type="range" className="uc-range" min={0} max={360} step={1} value={shown} aria-label="Angle in degrees" style={{ "--p": `${pct}%` } as CSSProperties}
          onChange={(e) => { setPlaying(false); setTo(Number(e.target.value), 3); }} />
      </div>
      <IconBtn onClick={reset} title="Reset"><RotateCcw size={17} /></IconBtn>
    </div>
  );

  const displayPanel = (
    <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-lift border border-slate-200 z-40 p-4 space-y-4">
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Marked angles (multiples of)</div>
        <Seg value={family} onChange={setFamily} options={[{ id: "30", text: "30°s" }, { id: "45", text: "45°s" }, { id: "all", text: "Both" }]} />
        {units !== "deg" && <Seg label="Radians as" value={radStyle} onChange={setRadStyle} options={[{ id: "pi", text: "π" }, { id: "dec", text: "Decimals" }]} />}
        <Seg label="Play speed" value={speed} onChange={setSpeed} options={[{ id: "slow", text: "Slow" }, { id: "normal", text: "Normal" }, { id: "fast", text: "Fast" }]} />
      </div>
      <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
        <Switch on={showExact} onClick={() => setShowExact((v) => !v)} label="Coordinate popup" hint="Exact (cos θ, sin θ) over the point" />
        <Switch on={graphLabels} onClick={() => setGraphLabels((v) => !v)} label="Label graph points" hint="Exact values on the marked points" />
        <Switch on={trace} onClick={() => setTrace((v) => !v)} label="Build graph" hint="Draw the curves as the angle moves" />
        <Switch on={hide} onClick={() => { setHide((v) => !v); setRevealed([]); }} label="Hide answers" hint="Tap a point to reveal it" />
      </div>
    </div>
  );

  const anglesSeg = <Seg value={units} onChange={setUnits} options={[{ id: "deg", text: "Degrees" }, { id: "rad", text: "Radians" }, { id: "both", text: "Both" }]} />;
  const displayBtn = (
    <div className="relative" ref={optsRef}>
      <button onClick={() => setOptsOpen((o) => !o)} aria-expanded={optsOpen}
        className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${optsOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
        Display <ChevronDown size={16} className={`transition-transform ${optsOpen ? "rotate-180" : ""}`} />
      </button>
      {optsOpen && displayPanel}
    </div>
  );
  const fnChips = <div className="flex items-center gap-2">{FNS.map((f) => <FnChip key={f} on={fns[f]} colour={COL[f]} onClick={() => setFns((st) => ({ ...st, [f]: !st[f] }))}>{f}</FnChip>)}</div>;
  const circleHead = <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3">{badgeEl("min-w-0")}<div className="flex items-center gap-2 flex-wrap">{anglesSeg}{displayBtn}</div></div>;
  const workingBtn = (
    <button onClick={() => setShowWorking((v) => !v)} aria-pressed={showWorking} title={showWorking ? "Hide the working and values" : "Show the working and values"}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${showWorking ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
      {showWorking ? <EyeOff size={17} /> : <Eye size={17} />}{showWorking ? "Hide working" : "Show working"}
    </button>
  );
  const graphHead = <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 pt-3">{fnChips}{workingBtn}</div>;

  return (
    <div className="flex flex-col" style={{ background: PAGE_BG, minHeight: "100vh", height: stacked ? undefined : "100vh", overflow: stacked ? undefined : "hidden" }}>
      <style>{RANGE_CSS}</style>
      <div className="bg-blue-900 shadow-card flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-2 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-3 py-2 rounded-lg transition-colors"><Home size={22} /><span className="font-semibold text-lg">Home</span></button>
          <span className="text-white font-semibold hidden sm:block">Unit Circle</span>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">{menuOpen ? <X size={26} /> : <Menu size={26} />}</button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lift border border-slate-200 z-50 overflow-hidden" style={{ minWidth: 260 }}>
                <button onClick={() => { setInfoOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">About this tool</button>
                <div className="border-t border-slate-100 my-1" />
                <div className="px-4 pt-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Printables</div>
                <button data-trusted-click onClick={() => { printPrintable(TRIG_SHEET); setMenuOpen(false); }} title={TRIG_SHEET.hint}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  {TRIG_SHEET.label}
                  <span className="block text-xs font-normal text-slate-400">{TRIG_SHEET.hint}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {infoOpen && <InfoModal title="Unit Circle" infoSections={INFO_SECTIONS} onClose={() => setInfoOpen(false)} />}

      {stacked ? (
        <div className="flex flex-col gap-3 p-3">
          <div className={card}>
            {circleHead}
            <div className="w-full max-w-[560px] mx-auto aspect-square">{circleSvg}</div>
            {playbar}
          </div>
          <div className={`${card} pb-2`}>{graphHead}<div className="w-full px-2 pt-1" style={{ aspectRatio: `${GW} / ${GH}` }}>{graphSvg}</div></div>
          {showWorking && <div className={card}>{readout}</div>}
          {portrait && !phone && <p className="text-center text-xs text-slate-500 pb-2">Works best in landscape.</p>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-3">
          <div className={`${card} flex flex-col min-h-0`}>
            {circleHead}
            <div className="flex-1 min-h-0 p-1">{circleSvg}</div>
            {playbar}
          </div>
          <div className="flex flex-col gap-3 min-h-0">
            <div className={`${card} flex-1 min-h-0 flex flex-col pb-2`}>{graphHead}<div className="flex-1 min-h-0 px-2 pt-1">{graphSvg}</div></div>
            {showWorking && <div className={`${card} flex-shrink-0`}>{readout}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
