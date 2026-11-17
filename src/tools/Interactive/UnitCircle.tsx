import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode, type CSSProperties } from "react";
import { Home, Menu, X, Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronDown } from "lucide-react";
import { InfoModal, type InfoSection } from "../../shared";
import { shouldAutoOpenAbout, markAboutSeen } from "../../shared/about";
import { useLayoutMode } from "../../shared/layoutMode";
import { PAGE_BG } from "../../shared/colors";
import {
  SPECIALS, specialsFor, inFamily, exactValues, decimalValues, radText, degToRadWorking, radToDegWorking, principalDeg, BRANCH,
  type Family,
} from "./unitCircleMath";

const INFO_SECTIONS: InfoSection[] = [
  { title: "Unit Circle", icon: "⭕", content: [
    { label: "Overview", detail: "A unit circle (radius 1) joined to the graphs of sin, cos and tan. Move the angle round the circle and watch each graph being drawn, in degrees, radians or both." },
    { label: "Moving the angle", detail: "Drag the point on the circle, drag along the graph, use the slider, or step between the marked angles with the arrow buttons. Play sweeps the angle round the circle." },
    { label: "Radians", detail: "Every marked angle shows its radian form as a fraction of π, with the working for degrees × π/180 and radians × 180/π underneath." },
    { label: "Exact values", detail: "A popup over the point gives its exact coordinates (cos θ, sin θ): the x-coordinate is cos θ and the y-coordinate is sin θ. Hover over any marked point to preview its coordinates." },
    { label: "Tan", detail: "On the circle, tan θ is the length cut off on the tangent line at (1, 0). It grows without limit as the angle reaches 90° and 270°, which is why the graph has asymptotes there." },
    { label: "Inverse functions", detail: "Switch View to Inverses to see sin⁻¹, cos⁻¹ and tan⁻¹ with their domains and ranges. The coloured band on the circle is the half of the circle each inverse can return; when θ is outside it, the ring shows the principal value and θ is the other solution." },
    { label: "Reflection", detail: "View Reflection draws a function, restricted so it passes the horizontal line test, with its inverse and the line y = x, on the same scale (radians). A point and its mirror image swap their coordinates." },
  ]},
  { title: "Controls", icon: "🛠️", content: [
    { label: "Angles", detail: "Show angles in degrees, radians or both together." },
    { label: "Graphs", detail: "Switch sin, cos and tan on or off. Any combination can be shown at once." },
    { label: "View", detail: "Functions shows sin, cos and tan against the angle. Inverses shows sin⁻¹, cos⁻¹ and tan⁻¹ against their input. Reflection shows each function, its inverse and the line y = x together." },
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
const FS = 11.5;                 // every axis and ring label (degrees and radians) is this size
const LINE = 4;                  // the coloured helper lines on the circle
const CURVE = 3;                 // the graph curves

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
const R = 118;                  // circle radius in SVG units
const VB = 172;                 // circle viewBox half-size
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

// Inverse view: value x along the bottom (−3 to 3), the angle up the side (−110° to 200°) with a wider left margin for two label columns.
const IV_X = 3;
const IPX0 = 92;
const IPW = PX1 - IPX0;
const A_MIN = -110, A_MAX = 200;
const xv = (v: number) => IPX0 + ((v + IV_X) / (2 * IV_X)) * IPW;
const ya = (a: number) => PY0 + PH * (1 - (a - A_MIN) / (A_MAX - A_MIN));
const A_TICKS = [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
// Reflection view: the same scale on both axes (radians), so reflecting in y = x really is a reflection.
const RF_X0 = -4.9, RF_X1 = 6.4, RF_Y0 = -2.3;
const RF_S = PW / (RF_X1 - RF_X0);
const RF_Y1 = RF_Y0 + PH / RF_S;
const rx = (x: number) => PX0 + (x - RF_X0) * RF_S;
const ry = (y: number) => PY1 - (y - RF_Y0) * RF_S;
const COL_DARK: Record<Fn, string> = { sin: "#1e3a8a", cos: "#065f46", tan: "#92400e" };
const INV_RAD: Record<Fn, (v: number) => number> = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
type GraphView = "trig" | "inverse" | "reflect";
const poly = (pts: Array<[number, number] | null>): string => {
  let d = "";
  let pen = false;
  for (const p of pts) { if (!p) { pen = false; continue; } d += `${pen ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; }
  return d;
};

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
  const [view, setView] = useState<GraphView>("trig");
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
    if (view === "trig") { setTo(Math.max(0, Math.min(360, ((p.x - PX0) / PW) * 360)), 4); return; }
    // Inverse views: the pointer picks the input (inverse view) or the principal angle (reflection), and the point lands on that branch.
    const f = FNS.find((g) => fns[g]) ?? "sin";
    let deg: number;
    if (view === "inverse") {
      const v0 = ((p.x - IPX0) / IPW) * 2 * IV_X - IV_X;
      const v = f === "tan" ? v0 : Math.max(-1, Math.min(1, v0));
      deg = (INV_RAD[f](v) * 180) / Math.PI;
    } else {
      const [lo, hi] = BRANCH[f];
      deg = Math.max(lo, Math.min(hi, (((RF_X0 + (p.x - PX0) / RF_S) * 180) / Math.PI)));
      if (f === "tan") deg = Math.max(-89, Math.min(89, deg));
    }
    setTo(Math.round(((deg % 360) + 360) % 360), 2.5);
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
  const degOn = units !== "rad";
  const radOn = (deg: number) => units !== "deg" && visibleAnswer(deg);
  const radLabel = (deg: number) => (radStyle === "pi" ? radText(deg) : deg === 0 ? "0" : rad(deg).toFixed(2));

  // ── Circle ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  const [px, py] = cp(angle);
  const cosA = Math.cos(rad(angle)), sinA = Math.sin(rad(angle));
  const tanA = Math.abs(cosA) < 1e-9 ? null : sinA / cosA;
  const arcR = 30;
  const [ax, ay] = cp(angle, arcR);
  const marked = SPECIALS.filter((s) => inFamily(s, family));

  const ringLabels = marked.map((s) => {
    const [lx, ly] = cp(s.deg, R + (units === "both" ? 27 : 20));
    const rShow = radOn(s.deg);
    return (
      <g key={"r" + s.deg}>
        {degOn && <text x={lx} y={ly + (rShow ? -6 : 4)} textAnchor="middle" fontSize={FS} fontWeight={600} fill={MUTE}>{s.deg}°</text>}
        {rShow && <Q x={lx} y={degOn ? ly + 10 : ly} t={radLabel(s.deg)} size={FS} fill={ACCENT} />}
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
    const size = 14;
    const w = Math.max(118, items.reduce((t, it) => t + qWidth(it, size), 0) + size * 0.2 * 4 + 30);
    const h = 58;
    const below = qy < -R * 0.5;
    const cx = Math.max(-VB + w / 2 + 2, Math.min(VB - w / 2 - 2, qx));
    const cy = below ? qy + 22 + h / 2 + 8 : qy - 22 - h / 2 - 8;
    const edge = below ? cy - h / 2 : cy + h / 2;
    const tx = Math.max(cx - w / 2 + 16, Math.min(cx + w / 2 - 16, qx));
    return (
      <g style={{ pointerEvents: "none", filter: "drop-shadow(0 4px 10px rgba(15,23,42,0.18))" }}>
        <polygon points={`${tx - 7},${edge} ${tx + 7},${edge} ${tx},${edge + (below ? -9 : 9)}`} fill="#fff" />
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={12} fill="#fff" />
        <text x={cx} y={cy - h / 2 + 16} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={MUTE}>
          <tspan>(</tspan><tspan fill={COL.cos}>cos θ</tspan><tspan>, </tspan><tspan fill={COL.sin}>sin θ</tspan><tspan>)</tspan>
        </text>
        <Row x={cx} y={cy + 7} items={items} size={size} fills={fills} />
      </g>
    );
  })();

  const inv = view !== "trig";
  const onFns = FNS.filter((f) => fns[f]);
  const BRANCH_R: Record<Fn, number> = { sin: R - 10, cos: R - 17, tan: R - 24 };
  // The half of the circle each inverse can return (sin⁻¹ and tan⁻¹ the right half, cos⁻¹ the top half) as a coloured band.
  const branchArcs = inv ? onFns.map((f) => {
    const [a1, a2] = BRANCH[f], r = BRANCH_R[f];
    const [x1, y1] = cp(a1, r), [xm, ym] = cp((a1 + a2) / 2, r), [x2, y2] = cp(a2, r);
    return <path key={"ba" + f} d={`M${x1},${y1} A${r},${r} 0 0 0 ${xm},${ym} A${r},${r} 0 0 0 ${x2},${y2}`} fill="none" stroke={COL[f]} strokeWidth={5} opacity={0.42} style={{ pointerEvents: "none" }} />;
  }) : null;
  // Where the inverse sends the point: a ring at the principal value, joined to the point by the chord that keeps the same value.
  const principalMarks = inv ? onFns.map((f) => {
    const a = principalDeg(f, angle);
    if (a === null) return null;
    const diff = (((a - angle) % 360) + 360) % 360;
    if (diff < 0.5 || diff > 359.5) return null;
    const [qx, qy] = cp(a);
    const [tx, ty] = cp(a, R - 40);
    return (
      <g key={"pm" + f} style={{ pointerEvents: "none" }}>
        <line x1={px} y1={py} x2={qx} y2={qy} stroke={COL[f]} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.85} />
        <circle cx={qx} cy={qy} r={7.5} fill="#fff" stroke={COL[f]} strokeWidth={3} />
        <Q x={tx} y={ty} t={`${f}⁻¹`} size={11} fill={COL[f]} />
      </g>
    );
  }) : null;

  const circleSvg = (
    <svg ref={circleRef} viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`} className="w-full h-full select-none" style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={down("circle")} onPointerMove={move("circle")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Unit circle">
      {/* axes and circle */}
      <line x1={-R - 14} x2={R + 14} y1={0} y2={0} stroke={RULE} strokeWidth={1.25} />
      <line y1={-R - 14} y2={R + 14} x1={0} x2={0} stroke={RULE} strokeWidth={1.25} />
      {fns.tan && <line x1={R} x2={R} y1={-VB} y2={VB} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="4 4" opacity={0.5} />}
      <circle cx={0} cy={0} r={R} fill="#f8fafc" stroke="#334155" strokeWidth={2} />
      {branchArcs}

      {/* angle: soft sector with a clean arc */}
      {angle >= 359.5
        ? <circle cx={0} cy={0} r={arcR} fill={ACCENT} fillOpacity={0.1} stroke={ACCENT} strokeWidth={2.5} />
        : angle > 0.5 && (
          <>
            <path d={`M0,0 L${arcR},0 A${arcR},${arcR} 0 ${angle > 180 ? 1 : 0} 0 ${ax},${ay} Z`} fill={ACCENT} fillOpacity={0.1} />
            <path d={`M${arcR},0 A${arcR},${arcR} 0 ${angle > 180 ? 1 : 0} 0 ${ax},${ay}`} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}

      {/* radius, then the coloured helper lines */}
      <line x1={0} y1={0} x2={px} y2={py} stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
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
            <circle cx={sx} cy={sy} r={on ? 5 : 3.6} fill={on ? ACCENT : "#fff"} stroke={on ? ACCENT : "#475569"} strokeWidth={1.8} />
            {showExact && <circle cx={sx} cy={sy} r={12} fill="transparent" onPointerEnter={(e) => { if (e.pointerType === "mouse") setHoverDeg(s.deg); }} onPointerLeave={() => setHoverDeg(null)} />}
          </g>
        );
      })}
      {ringLabels}
      {principalMarks}

      {/* the moving point */}
      <circle cx={px} cy={py} r={15} fill={ACCENT} opacity={0.14} style={{ pointerEvents: "none" }} />
      <circle cx={px} cy={py} r={8.5} fill={ACCENT} stroke="#fff" strokeWidth={3} />
      {showExact && popup}
    </svg>
  );

  // ── Graph ───────────────────────────────────────────────────────────────────────────────────────────────────────────
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

  const graphTrigSvg = (
    <svg ref={graphRef} viewBox={`0 0 ${GW} ${GH}`} className="w-full h-full select-none" style={{ touchAction: "pan-y", cursor: "ew-resize" }}
      onPointerDown={down("graph")} onPointerMove={move("graph")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Graphs of sine, cosine and tangent">
      <defs><clipPath id="uc-plot"><rect x={PX0} y={PY0} width={PW} height={PH} /></clipPath></defs>

      {/* grid */}
      {xMarks.map((m) => <line key={"g" + m.deg} x1={xOf(m.deg)} x2={xOf(m.deg)} y1={PY0} y2={PY1} stroke={m.deg % 90 === 0 ? HAIR : "#f1f5f9"} strokeWidth={1} />)}
      {Y_TICKS.map((v) => <line key={"h" + v} x1={PX0} x2={PX1} y1={yOf(v)} y2={yOf(v)} stroke={v === 0 ? FAINT : HAIR} strokeWidth={v === 0 ? 1.5 : 1} />)}
      <line x1={PX0} x2={PX0} y1={PY0} y2={PY1} stroke={RULE} strokeWidth={1} />
      {Y_TICKS.map((v) => <text key={"yl" + v} x={PX0 - 9} y={yOf(v) + 4} textAnchor="end" fontSize={FS} fill={MUTE}>{v < 0 ? `−${-v}` : v}</text>)}
      {fns.tan && [90, 270].map((a) => <line key={"as" + a} x1={xOf(a)} x2={xOf(a)} y1={PY0} y2={PY1} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="5 4" opacity={0.55} />)}

      {/* x labels: degrees grey, radians indigo, the same sizes as the circle */}
      {xMarks.map((m) => {
        const stagger = family === "all" && m.family === "45" ? 30 : 0;
        const rShow = radOn(m.deg);
        const x = xOf(m.deg);
        return (
          <g key={"xl" + m.deg}>
            <line x1={x} x2={x} y1={PY1} y2={PY1 + 5} stroke={FAINT} />
            {degOn && <text x={x} y={PY1 + 19 + stagger} textAnchor="middle" fontSize={FS} fontWeight={600} fill={MUTE}>{m.deg}°</text>}
            {rShow && <Q x={x} y={PY1 + (degOn ? 36 : 22) + stagger} t={radLabel(m.deg)} size={FS} fill={ACCENT} />}
          </g>
        );
      })}

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
        return <circle key={"m" + f} cx={curX} cy={yOf(v)} r={6.5} fill={COL[f]} stroke="#fff" strokeWidth={2.5} />;
      })}
      {!anyFn && <text x={PX0 + PW / 2} y={PY0 + PH / 2} textAnchor="middle" fontSize={14} fill={FAINT}>Switch on sin, cos or tan to draw a graph</text>}
      <text x={PX1} y={GH - 6} textAnchor="end" fontSize={11} fontStyle="italic" fill={MUTE}>angle θ{units === "deg" ? " (degrees)" : units === "rad" ? " (radians)" : ""}</text>
    </svg>
  );

  // ── Inverse graphs: sin⁻¹ x, cos⁻¹ x, tan⁻¹ x against the input ──
  const invPath = (f: Fn): string => {
    const [lo, hi] = f === "tan" ? [-IV_X, IV_X] : [-1, 1];
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 240; i++) { const v = lo + ((hi - lo) * i) / 240; pts.push([xv(v), ya((INV_RAD[f](v) * 180) / Math.PI)]); }
    return poly(pts);
  };
  const graphInvSvg = (
    <svg ref={graphRef} viewBox={`0 0 ${GW} ${GH}`} className="w-full h-full select-none" style={{ touchAction: "pan-y", cursor: "ew-resize" }}
      onPointerDown={down("graph")} onPointerMove={move("graph")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Graphs of the inverse functions">
      <defs><clipPath id="uc-plot-i"><rect x={IPX0} y={PY0} width={IPW} height={PH} /></clipPath></defs>
      {/* the domain of sin⁻¹ and cos⁻¹ */}
      {(fns.sin || fns.cos) && <rect x={xv(-1)} y={PY0} width={xv(1) - xv(-1)} height={PH} fill="#eef2ff" opacity={0.9} />}
      {[-3, -2, -1, 0, 1, 2, 3].map((v) => <line key={"gv" + v} x1={xv(v)} x2={xv(v)} y1={PY0} y2={PY1} stroke={v === 0 ? FAINT : HAIR} strokeWidth={v === 0 ? 1.5 : 1} />)}
      {A_TICKS.map((a) => <line key={"ga" + a} x1={IPX0} x2={PX1} y1={ya(a)} y2={ya(a)} stroke={a === 0 ? FAINT : HAIR} strokeWidth={a === 0 ? 1.5 : 1} />)}
      <line x1={IPX0} x2={IPX0} y1={PY0} y2={PY1} stroke={RULE} strokeWidth={1} />
      {fns.tan && [-90, 90].map((a) => <line key={"ta" + a} x1={IPX0} x2={PX1} y1={ya(a)} y2={ya(a)} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="5 4" opacity={0.6} />)}
      {(fns.sin || fns.cos) && <text x={xv(0)} y={PY0 + 14} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={ACCENT}>domain of sin⁻¹ and cos⁻¹</text>}

      {/* axis labels: the angle up the side (degrees grey, radians indigo), the input along the bottom */}
      {A_TICKS.map((a) => (
        <g key={"al" + a}>
          {degOn && <text x={units === "both" ? IPX0 - 50 : IPX0 - 9} y={ya(a) + 4} textAnchor="end" fontSize={FS} fontWeight={600} fill={MUTE}>{a < 0 ? `−${-a}` : a}°</text>}
          {radOn(((a % 360) + 360) % 360) && <Q x={IPX0 - 26} y={ya(a)} t={radLabel(a)} size={FS} fill={ACCENT} />}
        </g>
      ))}
      {[-3, -2, -1, 0, 1, 2, 3].map((v) => <text key={"vl" + v} x={xv(v)} y={PY1 + 18} textAnchor="middle" fontSize={FS} fontWeight={600} fill={MUTE}>{v < 0 ? `−${-v}` : v}</text>)}
      <text x={PX1} y={GH - 8} textAnchor="end" fontSize={11} fontStyle="italic" fill={MUTE}>input x</text>
      <text x={IPX0 + 6} y={GH - 8} textAnchor="start" fontSize={11} fontStyle="italic" fill={MUTE}>output: the angle{units === "deg" ? " (degrees)" : units === "rad" ? " (radians)" : ""}</text>

      <g clipPath="url(#uc-plot-i)">
        {onFns.map((f) => <path key={f} d={invPath(f)} fill="none" stroke={COL[f]} strokeWidth={CURVE} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
      {onFns.length === 0 && <text x={IPX0 + IPW / 2} y={PY0 + PH / 2} textAnchor="middle" fontSize={14} fill={FAINT}>Switch on sin, cos or tan to draw its inverse</text>}

      {/* the current point: the input is the function's value, the output is the principal angle (which is θ only inside the range) */}
      {onFns.map((f) => {
        const v = valueAt(f), a = principalDeg(f, angle);
        if (v === null || a === null || Math.abs(v) > IV_X) return null;
        const X = xv(v), Y = ya(a);
        const showTheta = angle <= A_MAX && Math.abs(angle - a) > 0.5;
        return (
          <g key={"iv" + f}>
            <line x1={IPX0} x2={X} y1={Y} y2={Y} stroke={COL[f]} strokeWidth={1.25} strokeDasharray="2 4" opacity={0.8} />
            <line x1={X} x2={X} y1={Y} y2={PY1} stroke={COL[f]} strokeWidth={1.25} strokeDasharray="2 4" opacity={0.8} />
            {showTheta && <line x1={X} x2={X} y1={Y} y2={ya(angle)} stroke={COL[f]} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />}
            {showTheta && <circle cx={X} cy={ya(angle)} r={6} fill="#fff" stroke={COL[f]} strokeWidth={2.5} />}
            {showTheta && <text x={X + 11} y={ya(angle) + 4} fontSize={11} fontWeight={700} fill={COL[f]} stroke="#fff" strokeWidth={2.6} paintOrder="stroke">θ</text>}
            <circle cx={X} cy={Y} r={6.5} fill={COL[f]} stroke="#fff" strokeWidth={2.5} />
          </g>
        );
      })}
    </svg>
  );

  // ── Reflection: a restricted function, its inverse and y = x on one scale ──
  const rfPoint = (x: number, y: number): [number, number] | null => (!Number.isFinite(y) || y < RF_Y0 - 0.4 || y > RF_Y1 + 0.4 ? null : [rx(x), ry(y)]);
  const rfFull = (f: Fn): string => { const pts: Array<[number, number] | null> = []; for (let x = RF_X0; x <= RF_X1; x += 0.04) pts.push(rfPoint(x, FN[f](x))); return poly(pts); };
  const rfRestricted = (f: Fn): string => {
    const [a, b] = BRANCH[f];
    const eps = f === "tan" ? 0.012 : 0;
    const lo = rad(a) + eps, hi = rad(b) - eps;
    const pts: Array<[number, number] | null> = [];
    for (let x = lo; x < hi; x += 0.02) pts.push(rfPoint(x, FN[f](x)));
    pts.push(rfPoint(hi, FN[f](hi)));
    return poly(pts);
  };
  const rfInverse = (f: Fn): string => {
    const [lo, hi] = f === "tan" ? [RF_X0, RF_X1] : [-1, 1];
    const pts: Array<[number, number] | null> = [];
    for (let i = 0; i <= 300; i++) { const v = lo + ((hi - lo) * i) / 300; pts.push(rfPoint(v, INV_RAD[f](v))); }
    return poly(pts);
  };
  const RF_XT = [-3, -2, -1, 0, 1, 2, 3, 4];
  const RF_YT = [-1, 0, 1, 2];
  const graphRefSvg = (
    <svg ref={graphRef} viewBox={`0 0 ${GW} ${GH}`} className="w-full h-full select-none" style={{ touchAction: "pan-y", cursor: "ew-resize" }}
      onPointerDown={down("graph")} onPointerMove={move("graph")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="A function, its inverse and the line y equals x">
      <defs><clipPath id="uc-plot-r"><rect x={PX0} y={PY0} width={PW} height={PH} /></clipPath></defs>
      {RF_XT.map((k) => <line key={"rgx" + k} x1={rx((k * Math.PI) / 2)} x2={rx((k * Math.PI) / 2)} y1={PY0} y2={PY1} stroke={HAIR} strokeWidth={1} />)}
      {RF_YT.map((k) => <line key={"rgy" + k} x1={PX0} x2={PX1} y1={ry((k * Math.PI) / 2)} y2={ry((k * Math.PI) / 2)} stroke={HAIR} strokeWidth={1} />)}
      <line x1={PX0} x2={PX1} y1={ry(0)} y2={ry(0)} stroke={FAINT} strokeWidth={1.5} />
      <line x1={rx(0)} x2={rx(0)} y1={PY0} y2={PY1} stroke={FAINT} strokeWidth={1.5} />
      <line x1={PX0} x2={PX0} y1={PY0} y2={PY1} stroke={RULE} strokeWidth={1} />

      <g clipPath="url(#uc-plot-r)">
        {/* the mirror line y = x */}
        <line x1={rx(RF_X0)} y1={ry(RF_X0)} x2={rx(RF_X1)} y2={ry(RF_X1)} stroke={MUTE} strokeWidth={1.5} strokeDasharray="6 5" />
        {fns.tan && [-1, 1].map((k) => <line key={"rv" + k} x1={rx((k * Math.PI) / 2)} x2={rx((k * Math.PI) / 2)} y1={PY0} y2={PY1} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="5 4" opacity={0.55} />)}
        {fns.tan && [-1, 1].map((k) => <line key={"rh" + k} x1={PX0} x2={PX1} y1={ry((k * Math.PI) / 2)} y2={ry((k * Math.PI) / 2)} stroke={COL.tan} strokeWidth={1.25} strokeDasharray="5 4" opacity={0.55} />)}
        {/* the whole function, faint, so you can see what the restriction keeps */}
        {onFns.map((f) => <path key={"ff" + f} d={rfFull(f)} fill="none" stroke={COL[f]} strokeWidth={2} opacity={0.22} />)}
        {onFns.map((f) => <path key={"fr" + f} d={rfRestricted(f)} fill="none" stroke={COL[f]} strokeWidth={CURVE} strokeLinecap="round" />)}
        {onFns.map((f) => <path key={"fi" + f} d={rfInverse(f)} fill="none" stroke={COL_DARK[f]} strokeWidth={CURVE} strokeLinecap="round" strokeLinejoin="round" />)}
        {onFns.filter((f) => f !== "tan").map((f) => BRANCH[f].map((b, i) => {
          const y = FN[f](rad(b)), q = rfPoint(rad(b), y), q2 = rfPoint(y, rad(b));
          return <g key={`ep${f}${i}`}>{q && <circle cx={q[0]} cy={q[1]} r={4} fill="#fff" stroke={COL[f]} strokeWidth={2} />}{q2 && <circle cx={q2[0]} cy={q2[1]} r={4} fill="#fff" stroke={COL_DARK[f]} strokeWidth={2} />}</g>;
        }))}
      </g>

      {/* the point and its mirror image: coordinates swap */}
      {onFns.map((f) => {
        const v = valueAt(f), a = principalDeg(f, angle);
        if (v === null || a === null) return null;
        const A = rfPoint(rad(a), v), B = rfPoint(v, rad(a));
        if (!A || !B) return null;
        return (
          <g key={"mp" + f}>
            <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={COL[f]} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.85} />
            <circle cx={A[0]} cy={A[1]} r={6.5} fill={COL[f]} stroke="#fff" strokeWidth={2.5} />
            <circle cx={B[0]} cy={B[1]} r={6.5} fill={COL_DARK[f]} stroke="#fff" strokeWidth={2.5} />
          </g>
        );
      })}

      {/* labels: radians on both axes (the same scale), the value 1 marked on each */}
      {RF_XT.map((k) => {
        const x = rx((k * Math.PI) / 2), d = k * 90;
        return (
          <g key={"rlx" + k}>
            <line x1={x} x2={x} y1={PY1} y2={PY1 + 5} stroke={FAINT} />
            {degOn && <text x={x} y={PY1 + 19} textAnchor="middle" fontSize={FS} fontWeight={600} fill={MUTE}>{d < 0 ? `−${-d}` : d}°</text>}
            {units !== "deg" && <Q x={x} y={PY1 + (degOn ? 36 : 22)} t={radLabel(d)} size={FS} fill={ACCENT} />}
          </g>
        );
      })}
      {RF_YT.map((k) => (k === 0 ? null : <Q key={"rly" + k} x={PX0 - 24} y={ry((k * Math.PI) / 2)} t={radText(k * 90)} size={FS} fill={ACCENT} />))}
      {[-1, 1].map((v) => <text key={"one" + v} x={rx(v)} y={ry(0) + 14} textAnchor="middle" fontSize={10} fill={MUTE}>{v < 0 ? "−1" : "1"}</text>)}
      {[-1, 1].map((v) => <text key={"onev" + v} x={rx(0) - 7} y={ry(v) + 4} textAnchor="end" fontSize={10} fill={MUTE}>{v < 0 ? "−1" : "1"}</text>)}
      <text x={PX1} y={GH - 6} textAnchor="end" fontSize={11} fontStyle="italic" fill={MUTE}>same scale on both axes (radians)</text>

      {/* key */}
      {onFns.map((f, i) => (
        <g key={"lg" + f} transform={`translate(${PX0 + 10},${PY0 + 12 + i * 34})`}>
          <line x1={0} x2={16} y1={0} y2={0} stroke={COL[f]} strokeWidth={3} /><text x={22} y={4} fontSize={11} fontWeight={600} fill={COL[f]}>{f} x, restricted</text>
          <line x1={0} x2={16} y1={16} y2={16} stroke={COL_DARK[f]} strokeWidth={3} /><text x={22} y={20} fontSize={11} fontWeight={600} fill={COL_DARK[f]}>{f}⁻¹ x</text>
        </g>
      ))}
      {onFns.length === 0 && <text x={PX0 + PW / 2} y={PY0 + PH / 2} textAnchor="middle" fontSize={14} fill={FAINT}>Switch on sin, cos or tan to see its inverse</text>}
    </svg>
  );

  const graphSvg = view === "trig" ? graphTrigSvg : view === "inverse" ? graphInvSvg : graphRefSvg;

  // ── Angle badge and readout ─────────────────────────────────────────────────────────────────────────────────────────
  const radDecimal = rad(shown);
  const hiddenNow = hide && !visibleAnswer(shown);
  const radNow = hiddenNow ? "?" : radLabel(shown);
  const badgeEl = (cls: string) => (
    <div className={cls}>
      <div className="text-2xl font-semibold text-slate-800 flex items-center gap-2 h-9 whitespace-nowrap">
        {units === "deg" && <span>{shown}°</span>}
        {units === "both" && <><span>{shown}°</span><span className="text-slate-300">=</span><span style={{ color: ACCENT }}><H t={radNow} /></span></>}
        {units === "rad" && <span className="inline-flex items-center" style={{ color: ACCENT }}><H t={radNow} /><span className="ml-1.5 text-lg">rad</span></span>}
      </div>
      <div className="text-xs text-slate-500 h-5 whitespace-nowrap">
        {units === "rad" && <>= {shown}°{!hiddenNow && radStyle === "pi" && shown !== 0 ? <> ≈ {radDecimal.toFixed(3)} rad</> : null}</>}
        {units === "both" && !hiddenNow && radStyle === "pi" && shown !== 0 ? <>≈ {radDecimal.toFixed(3)} rad</> : null}
      </div>
    </div>
  );
  const badge = badgeEl("absolute top-3 left-4 pointer-events-none h-[58px]");

  const hideWorking = hide && !visibleAnswer(shown);
  const valueChip = (f: Fn) => {
    const e = exact ? exact[f] : null;
    const d = f === "tan" ? dec.tan : dec[f];
    return (
      <div key={f} className="rounded-xl bg-white h-[58px] flex-1 min-w-0 flex flex-col justify-center pl-3.5 pr-2 border border-slate-200" style={{ borderLeft: `4px solid ${COL[f]}` }}>
        <div className="text-xs font-semibold" style={{ color: COL[f] }}>{f} θ</div>
        <div className="text-[17px] font-semibold text-slate-900 h-7 flex items-center gap-1.5 whitespace-nowrap">
          {hideWorking ? "?" : e ? <>= <H t={e} /></> : <>= {d === null ? "undefined" : d.toFixed(3)}</>}
          {!hideWorking && e && e !== "undefined" && d !== null && <span className="text-xs font-normal text-slate-400 ml-2">≈ {d.toFixed(2)}</span>}
        </div>
      </div>
    );
  };
  const line = (label: string, body: ReactNode) => (
    <div className="min-w-0">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="text-[15px] text-slate-800 h-8 flex items-center whitespace-nowrap overflow-hidden"><span>{body}</span></div>
    </div>
  );
  const toRad = line("Degrees → radians", hideWorking ? <span className="text-slate-400">{shown}° × π/180 = ?</span> : <Rich s={degToRadWorking(shown).join(" = ")} />);
  const toDeg = line("Radians → degrees", hideWorking ? <span className="text-slate-400">? × 180/π = {shown}°</span> : <Rich s={radToDegWorking(shown).join(" = ")} />);
  const readout = (
    <div className="p-3 grid gap-2.5" style={{ gridTemplateRows: "52px 58px" }}>
      <div className="grid grid-cols-2 gap-x-5">{units === "rad" ? <>{toDeg}{toRad}</> : <>{toRad}{toDeg}</>}</div>
      <div className="flex gap-2.5">
        {FNS.filter((f) => fns[f]).map(valueChip)}
        {!anyFn && <div className="text-sm text-slate-400 self-center">Switch on sin, cos or tan to see its value.</div>}
      </div>
    </div>
  );

  const f1: Fn | undefined = onFns[0];
  const a1 = f1 ? principalDeg(f1, angle) : null;
  const angleTxt = (a: number): string => {
    const isInt = Math.abs(a - Math.round(a)) < 1e-6;
    const degS = `${isInt ? Math.round(a) : a.toFixed(1)}°`.replace("-", "−");
    const radS = isInt ? (radStyle === "pi" ? radText(Math.round(a)) : rad(Math.round(a)).toFixed(2)) : rad(a).toFixed(3);
    return units === "deg" ? degS : units === "rad" ? radS : `${degS} = ${radS}`;
  };
  const rangeTxt = (f: Fn): string => {
    const [a, b] = BRANCH[f];
    const d = `${a}° to ${b}°`.replace("-", "−"), r = `${radText(a)} to ${radText(b)}`;
    return units === "deg" ? d : units === "rad" ? r : `${d} = ${r}`;
  };
  const invChip = (f: Fn) => {
    const a = principalDeg(f, angle), v = valueAt(f);
    const e = exact ? exact[f] : null;
    const xTxt = e && e !== "undefined" ? e : v === null ? "undefined" : v.toFixed(2);
    return (
      <div key={f} className="rounded-xl bg-white h-[58px] flex-1 min-w-0 flex flex-col justify-center pl-3.5 pr-2 border border-slate-200" style={{ borderLeft: `4px solid ${COL[f]}` }}>
        <div className="text-xs font-semibold" style={{ color: COL[f] }}>{f}⁻¹ x</div>
        <div className="text-[17px] font-semibold text-slate-900 h-7 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
          {hideWorking ? "?" : a === null ? "undefined" : <><span>x =</span><H t={xTxt} /><span className="mx-1 text-slate-300">→</span><span><Rich s={angleTxt(a)} /></span></>}
        </div>
      </div>
    );
  };
  const inside = a1 !== null && Math.abs(a1 - angle) < 0.5;
  const invReadout = (
    <div className="p-3 grid gap-2.5" style={{ gridTemplateRows: phone ? "auto 58px" : "52px 58px" }}>
      <div className={`grid ${phone ? "grid-cols-1 gap-y-1" : "grid-cols-2 gap-x-5"}`}>
        {f1 ? line(`Range of ${f1}⁻¹ (${f1 === "tan" ? "any x" : "−1 ≤ x ≤ 1"})`, <Rich s={rangeTxt(f1)} />) : line("Range", <span className="text-slate-400">—</span>)}
        {f1 ? line(`${f1}⁻¹(${f1} ${shown}°)${inside || a1 === null || hideWorking ? "" : ` · ${shown}° is outside the range`}`, hideWorking ? <span className="text-slate-400">?</span> : a1 === null ? <span>undefined</span>
          : <span><Rich s={angleTxt(a1)} /> <span className="text-slate-500">{inside ? "— the same angle" : `— not ${shown}°`}</span></span>) : line("Principal value", <span className="text-slate-400">—</span>)}
      </div>
      <div className="flex gap-2.5">
        {onFns.map(invChip)}
        {!anyFn && <div className="text-sm text-slate-400 self-center">Switch on sin, cos or tan to see its inverse.</div>}
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
    <div className="absolute left-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-lift border border-slate-200 z-40 p-4 space-y-4">
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Marked angles (multiples of)</div>
        <Seg value={family} onChange={setFamily} options={[{ id: "30", text: "30°s" }, { id: "45", text: "45°s" }, { id: "all", text: "Both" }]} />
        {units !== "deg" && <Seg label="Radians as" value={radStyle} onChange={setRadStyle} options={[{ id: "pi", text: "π" }, { id: "dec", text: "Decimals" }]} />}
        <Seg label="Play speed" value={speed} onChange={setSpeed} options={[{ id: "slow", text: "Slow" }, { id: "normal", text: "Normal" }, { id: "fast", text: "Fast" }]} />
      </div>
      <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
        <Switch on={showExact} onClick={() => setShowExact((v) => !v)} label="Coordinate popup" hint="Exact (cos θ, sin θ) over the point" />
        <Switch on={graphLabels} onClick={() => setGraphLabels((v) => !v)} label="Label graph points" hint="Exact values on the marked points (Functions view)" />
        <Switch on={trace} onClick={() => setTrace((v) => !v)} label="Build graph" hint="Draw the curves as the angle moves (Functions view)" />
        <Switch on={hide} onClick={() => { setHide((v) => !v); setRevealed([]); }} label="Hide answers" hint="Tap a point to reveal it" />
      </div>
    </div>
  );

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
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lift border border-slate-200 z-50 overflow-hidden" style={{ minWidth: 200 }}>
                <button onClick={() => { setInfoOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">About this tool</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {infoOpen && <InfoModal title="Unit Circle" infoSections={INFO_SECTIONS} onClose={() => setInfoOpen(false)} />}

      <div className="flex-shrink-0 px-3 pt-3">
        <div className={`${card} px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2`}>
          <Seg label="Angles" value={units} onChange={setUnits} options={[{ id: "deg", text: "Degrees" }, { id: "rad", text: "Radians" }, { id: "both", text: "Both" }]} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-0.5">Graphs</span>
            {FNS.map((f) => <FnChip key={f} on={fns[f]} colour={COL[f]} onClick={() => setFns((s) => ({ ...s, [f]: !s[f] }))}>{f}</FnChip>)}
          </div>
          <Seg label="View" value={view} onChange={setView} options={[{ id: "trig", text: "Functions" }, { id: "inverse", text: "Inverses" }, { id: "reflect", text: "Reflection" }]} />
          <div className="relative" ref={optsRef}>
            <button onClick={() => setOptsOpen((o) => !o)} aria-expanded={optsOpen}
              className={`min-h-[40px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${optsOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              Display <ChevronDown size={16} className={`transition-transform ${optsOpen ? "rotate-180" : ""}`} />
            </button>
            {optsOpen && displayPanel}
          </div>
        </div>
      </div>

      {stacked ? (
        <div className="flex flex-col gap-3 p-3">
          <div className={card}>
            {badgeEl("px-4 pt-3 h-[70px]")}
            <div className="w-full max-w-[560px] mx-auto aspect-square">{circleSvg}</div>
            {playbar}
          </div>
          <div className={`${card} p-2`}><div className="w-full" style={{ aspectRatio: `${GW} / ${GH}` }}>{graphSvg}</div></div>
          <div className={card}>{view === "trig" ? readout : invReadout}</div>
          {portrait && !phone && <p className="text-center text-xs text-slate-500 pb-2">Works best in landscape.</p>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-3">
          <div className={`${card} flex flex-col min-h-0`}>
            <div className="relative flex-1 min-h-0 p-2">{circleSvg}{badge}</div>
            {playbar}
          </div>
          <div className="flex flex-col gap-3 min-h-0">
            <div className={`${card} flex-1 min-h-0 p-2`}>{graphSvg}</div>
            <div className={`${card} flex-shrink-0`}>{view === "trig" ? readout : invReadout}</div>
          </div>
        </div>
      )}
    </div>
  );
}
