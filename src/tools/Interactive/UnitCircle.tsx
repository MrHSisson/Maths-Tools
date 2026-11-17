import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { Home, Menu, X, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { InfoModal, type InfoSection } from "../../shared";
import { shouldAutoOpenAbout, markAboutSeen } from "../../shared/about";
import { useLayoutMode } from "../../shared/layoutMode";
import { PAGE_BG } from "../../shared/colors";
import {
  SPECIALS, specialsFor, inFamily, exactValues, decimalValues, radText, degToRadWorking, radToDegWorking,
  type Family,
} from "./unitCircleMath";

const INFO_SECTIONS: InfoSection[] = [
  { title: "Unit Circle", icon: "⭕", content: [
    { label: "Overview", detail: "A unit circle (radius 1) joined to the graphs of sin, cos and tan. Move the angle round the circle and watch each graph being drawn, in degrees, radians or both." },
    { label: "Moving the angle", detail: "Drag the point on the circle, drag along the graph, use the slider, or step between the special angles with the arrow buttons. Play sweeps the angle round once every ten seconds." },
    { label: "Radians", detail: "Every labelled angle shows its radian form as a fraction of π, with the working for degrees × π/180 and radians × 180/π underneath." },
    { label: "Exact values", detail: "Each marked point on the circle is labelled with its exact coordinates (cos θ, sin θ). The x-coordinate is cos θ and the y-coordinate is sin θ." },
    { label: "Tan", detail: "On the circle, tan θ is the length cut off on the tangent line at (1, 0). It grows without limit as the angle reaches 90° and 270°, which is why the graph has asymptotes there." },
  ]},
  { title: "Controls", icon: "🛠️", content: [
    { label: "Units", detail: "Show angles in degrees, radians or both together." },
    { label: "Graphs", detail: "Switch sin, cos and tan on or off. Any combination can be shown at once." },
    { label: "Points", detail: "Choose the multiples of 30°, the multiples of 45°, or all of them." },
    { label: "Hide answers", detail: "Hides the radian labels and exact coordinates. Tap a point to reveal it — good for asking the class first." },
    { label: "Build graph", detail: "Draws each graph only as far as the current angle, so it grows as the angle moves." },
    { label: "Label graph points", detail: "Writes the exact value beside each marked point on the graphs." },
  ]},
];

type Fn = "sin" | "cos" | "tan";
type Units = "deg" | "rad" | "both";

const COL: Record<Fn, string> = { sin: "#2563eb", cos: "#16a34a", tan: "#d97706" };
const FAM_COL = { "30": "#4f46e5", "45": "#0d9488", both: "#4f46e5" } as const;
const INK = "#334155";

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
  const w = frac ? Math.max(frac[0].length, frac[1].length) * size * 0.6 + 2 : body.length * size * 0.6;
  return w + (neg ? size * 0.7 : 0);
};

function Q({ x, y, t, size = 12, fill = INK, weight = 600 }: { x: number; y: number; t: string; size?: number; fill?: string; weight?: number }) {
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
          <line x1={x0 + mw} x2={x0 + mw + w} y1={y} y2={y} stroke={fill} strokeWidth={0.9} paintOrder="normal" />
          <text x={x0 + mw + w / 2} y={y + size * 0.85}>{frac[1]}</text>
        </>
      ) : (
        <text x={x0 + mw + w / 2} y={y + size * 0.34}>{body}</text>
      )}
    </g>
  );
}

function Row({ x, y, items, size, fill }: { x: number; y: number; items: string[]; size: number; fill?: string }) {
  const gap = size * 0.2;
  const widths = items.map((t) => qWidth(t, size));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let cx = x - total / 2;
  return (
    <g>
      {items.map((t, i) => {
        const centre = cx + widths[i] / 2;
        cx += widths[i] + gap;
        return <Q key={i} x={centre} y={y} t={t} size={size} fill={fill} />;
      })}
    </g>
  );
}

// ── The same idea in HTML, for the readout panel ─────────────────────────────────────────────────────────────────────────
function H({ t }: { t: string }) {
  const { neg, frac } = parseExact(t);
  if (!frac) return <span>{t}</span>;
  return (
    <span className="inline-flex items-center align-middle">
      {neg && <span>−</span>}
      <span className="inline-flex flex-col items-center text-[0.8em] leading-[1.15] mx-0.5">
        <span className="border-b border-current px-0.5">{frac[0]}</span>
        <span className="px-0.5">{frac[1]}</span>
      </span>
    </span>
  );
}
function Rich({ s }: { s: string }) {
  const tokens = s.split(" ");
  return <>{tokens.map((tok, i) => <span key={i}>{i > 0 ? " " : ""}{tok.includes("/") ? <H t={tok} /> : tok}</span>)}</>;
}

// ── Small controls ────────────────────────────────────────────────────────────────────────────────────────────────────────
function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white overflow-hidden">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id}
            className={`min-h-[40px] px-3 text-sm font-semibold transition-colors ${value === o.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{o.text}</button>
        ))}
      </div>
    </div>
  );
}
function Toggle({ on, onClick, children, colour }: { on: boolean; onClick: () => void; children: ReactNode; colour?: string }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`min-h-[40px] px-3 rounded-full border text-sm font-semibold transition-colors ${on ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
      style={on ? { background: colour ?? "#4f46e5" } : undefined}>{children}</button>
  );
}
function IconBtn({ onClick, title, children, active }: { onClick: () => void; title: string; children: ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${active ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{children}</button>
  );
}

// ── Geometry ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const R = 105;                  // circle radius in SVG units
const VB = 175;                 // circle viewBox half-size
const cp = (deg: number, r = R): [number, number] => [r * Math.cos((deg * Math.PI) / 180), -r * Math.sin((deg * Math.PI) / 180)];

const GW = 600, GH = 410, PX0 = 58, PX1 = 586, PY0 = 16, PY1 = 290;
const PW = PX1 - PX0, PH = PY1 - PY0;
const xOf = (deg: number) => PX0 + (deg / 360) * PW;

const toSvg = (svg: SVGSVGElement, e: { clientX: number; clientY: number }) => {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
};

const FN: Record<Fn, (r: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan };

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
  const [units, setUnits] = useState<Units>("both");
  const [family, setFamily] = useState<Family>("30");
  const [fns, setFns] = useState<Record<Fn, boolean>>({ sin: true, cos: false, tan: false });
  const [showExact, setShowExact] = useState(true);
  const [graphLabels, setGraphLabels] = useState(false);
  const [trace, setTrace] = useState(false);
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

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
      setAngle((a) => { const n = a + dt * 36; return n >= 360 ? n - 360 : n; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const reveal = useCallback((d: number) => { const k = d % 360; setRevealed((r) => (r.includes(k) ? r : [...r, k])); }, []);
  const snap = useCallback((d: number, tol: number) => {
    for (const s of [...fam, 360]) if (Math.min(Math.abs(d - s), 360 - Math.abs(d - s)) <= tol) return s === 360 && d < 180 ? 0 : s;
    return d;
  }, [fam]);
  const setTo = useCallback((d: number, tol = 3.5) => {
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
  const showRadLabel = (deg: number) => (units !== "deg") && visibleAnswer(deg);
  const showDegLabel = units !== "rad";

  // ── Circle ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  const [px, py] = cp(angle);
  const cosA = Math.cos((angle * Math.PI) / 180), sinA = Math.sin((angle * Math.PI) / 180);
  const tanA = Math.abs(cosA) < 1e-9 ? null : sinA / cosA;
  const arcR = 26;
  const [ax, ay] = cp(angle, arcR);
  const labelSize = family === "all" ? 8.6 : 10.5;

  const ringLabels = SPECIALS.filter((s) => inFamily(s, family)).map((s) => {
    const col = FAM_COL[s.family];
    const [lx, ly] = cp(s.deg, R + (units === "both" ? 31 : 22));
    const dShow = showDegLabel, rShow = showRadLabel(s.deg);
    const rad = radText(s.deg);
    const dy = dShow && rShow ? -9 : 0;
    return (
      <g key={"r" + s.deg}>
        {dShow && <text x={lx} y={ly + dy + 4} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={col}>{s.deg}°</text>}
        {rShow && <Q x={lx} y={dShow ? ly + 11 : ly} t={rad} size={units === "rad" ? 12 : 10.5} fill={col} />}
      </g>
    );
  });

  const coordLabels = showExact ? SPECIALS.filter((s) => inFamily(s, family)).map((s) => {
    if (!visibleAnswer(s.deg)) return null;
    const ev = exactValues(s.deg)!;
    const axis = s.deg % 90 === 0;
    const only45 = family === "all" && s.family === "45";
    const r = axis ? R * 0.7 : only45 ? R * 0.33 : family === "all" ? R * 0.74 : R * 0.64;
    const [lx, ly0] = cp(s.deg, r);
    const ly = s.deg === 0 || s.deg === 180 ? ly0 - 12 : ly0;
    return <Row key={"c" + s.deg} x={lx} y={ly} items={["(", ev.cos, ",", ev.sin, ")"]} size={only45 ? 7.6 : labelSize} fill={FAM_COL[s.family]} />;
  }) : null;

  const tanEnd = (() => {
    if (tanA === null) return null;
    const k = Math.min(1, (VB - 4) / (R * Math.abs(tanA)));
    return { rayX: R * k, rayY: -R * tanA * k, segY: Math.max(-(VB - 4), Math.min(VB - 4, -R * tanA)) };
  })();

  const circleSvg = (
    <svg ref={circleRef} viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`} className="w-full h-full select-none" style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={down("circle")} onPointerMove={move("circle")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Unit circle">
      {/* axes */}
      <line x1={-R - 14} x2={R + 14} y1={0} y2={0} stroke="#94a3b8" strokeWidth={1} />
      <line y1={-R - 14} y2={R + 14} x1={0} x2={0} stroke="#94a3b8" strokeWidth={1} />
      {fns.tan && <line x1={R} x2={R} y1={-VB} y2={VB} stroke={COL.tan} strokeWidth={1} strokeDasharray="4 4" opacity={0.55} />}
      <circle cx={0} cy={0} r={R} fill="#fff" fillOpacity={0.6} stroke="#475569" strokeWidth={1.8} />

      {/* angle sector */}
      {angle >= 359.5
        ? <circle cx={0} cy={0} r={arcR} fill="#6366f1" fillOpacity={0.14} stroke="#6366f1" strokeWidth={1.4} />
        : angle > 0.5 && <path d={`M0,0 L${arcR},0 A${arcR},${arcR} 0 ${angle > 180 ? 1 : 0} 0 ${ax},${ay} Z`} fill="#6366f1" fillOpacity={0.14} stroke="#6366f1" strokeWidth={1.4} />}

      {/* function lines */}
      {fns.cos && <line x1={0} y1={0} x2={px} y2={0} stroke={COL.cos} strokeWidth={4.5} strokeLinecap="round" />}
      {fns.sin && <line x1={px} y1={0} x2={px} y2={py} stroke={COL.sin} strokeWidth={4.5} strokeLinecap="round" />}
      {fns.tan && tanEnd && (
        <>
          <line x1={0} y1={0} x2={tanEnd.rayX} y2={tanEnd.rayY} stroke={COL.tan} strokeWidth={1.3} strokeDasharray="5 4" opacity={0.8} />
          <line x1={R} y1={0} x2={R} y2={tanEnd.segY} stroke={COL.tan} strokeWidth={4.5} strokeLinecap="round" />
        </>
      )}
      <line x1={0} y1={0} x2={px} y2={py} stroke="#4f46e5" strokeWidth={2.2} />

      {/* marked points */}
      {SPECIALS.filter((s) => inFamily(s, family)).map((s) => {
        const [sx, sy] = cp(s.deg);
        const on = shown % 360 === s.deg;
        return <circle key={"d" + s.deg} cx={sx} cy={sy} r={on ? 5.5 : 3.6} fill={on ? FAM_COL[s.family] : "#fff"} stroke={FAM_COL[s.family]} strokeWidth={1.8} />;
      })}
      {coordLabels}
      {ringLabels}

      {/* handle */}
      <circle cx={px} cy={py} r={8} fill="#4f46e5" stroke="#fff" strokeWidth={2.5} />
      <text x={Math.cos((angle / 2 * Math.PI) / 180) * 40} y={-Math.sin((angle / 2 * Math.PI) / 180) * 40 + 4} textAnchor="middle" fontSize={13} fontStyle="italic" fill="#4f46e5" style={{ pointerEvents: "none" }}>{angle > 20 && family !== "all" ? "θ" : ""}</text>
    </svg>
  );

  // ── Graph ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  const ymax = fns.tan ? 3.2 : 1.25;
  const yOf = (v: number) => PY0 + PH * (1 - (v + ymax) / (2 * ymax));
  const yTicks = fns.tan ? [-3, -2, -1, 0, 1, 2, 3] : [-1, -0.5, 0, 0.5, 1];

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
        const y = yOf(Math.max(-ymax * 4, Math.min(ymax * 4, FN[f]((x * Math.PI) / 180))));
        d += `${first ? "M" : "L"}${xOf(x).toFixed(1)},${y.toFixed(1)}`;
        first = false;
      };
      for (let x = a; x < end; x += step) add(x);
      add(end);
    }
    return d;
  };

  const xMarks = [...SPECIALS.filter((s) => inFamily(s, family)), { deg: 360, family: "both" as const }];
  const axisLine = (deg: number) => deg % 90 === 0;

  const graphLabelPoints: ReactNode[] = [];
  if (graphLabels) {
    (["sin", "cos", "tan"] as Fn[]).forEach((f) => {
      if (!fns[f]) return;
      SPECIALS.filter((s) => inFamily(s, family)).forEach((s) => {
        const ev = exactValues(s.deg)!;
        const txt = ev[f];
        if (txt === "undefined" || !visibleAnswer(s.deg)) return;
        const v = f === "sin" ? Math.sin((s.deg * Math.PI) / 180) : f === "cos" ? Math.cos((s.deg * Math.PI) / 180) : Math.tan((s.deg * Math.PI) / 180);
        if (Math.abs(v) > ymax) return;
        if (trace && s.deg > angle) return;
        const x = xOf(s.deg), y = yOf(v);
        const above = v >= 0 && !(f === "cos" && s.deg === 0);
        graphLabelPoints.push(
          <g key={f + s.deg}>
            <circle cx={x} cy={y} r={3.2} fill="#fff" stroke={COL[f]} strokeWidth={1.6} />
            <Q x={x + (txt === "0" ? 0 : 1)} y={y + (above ? -16 : 15)} t={txt} size={9} fill={COL[f]} />
          </g>,
        );
      });
    });
  }

  const graphSvg = (
    <svg ref={graphRef} viewBox={`0 0 ${GW} ${GH}`} className="w-full h-full select-none" style={{ touchAction: "pan-y", cursor: "ew-resize" }}
      onPointerDown={down("graph")} onPointerMove={move("graph")} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Graphs of sine, cosine and tangent">
      <defs><clipPath id="uc-plot"><rect x={PX0} y={PY0} width={PW} height={PH} /></clipPath></defs>
      <rect x={PX0} y={PY0} width={PW} height={PH} fill="#fff" stroke="#cbd5e1" />
      {/* grid */}
      {xMarks.map((m) => <line key={"g" + m.deg} x1={xOf(m.deg)} x2={xOf(m.deg)} y1={PY0} y2={PY1} stroke={axisLine(m.deg) ? "#cbd5e1" : "#eef2f7"} strokeWidth={1} />)}
      {yTicks.map((v) => <line key={"h" + v} x1={PX0} x2={PX1} y1={yOf(v)} y2={yOf(v)} stroke={v === 0 ? "#64748b" : "#eef2f7"} strokeWidth={v === 0 ? 1.3 : 1} />)}
      {yTicks.map((v) => <text key={"yl" + v} x={PX0 - 7} y={yOf(v) + 4} textAnchor="end" fontSize={11} fill="#64748b">{v}</text>)}
      {fns.tan && [90, 270].map((a) => <line key={"as" + a} x1={xOf(a)} x2={xOf(a)} y1={PY0} y2={PY1} stroke={COL.tan} strokeDasharray="5 4" opacity={0.6} />)}

      {/* x labels */}
      {xMarks.map((m) => {
        const stagger = family === "all" && m.family === "45" ? 30 : 0;
        const dShow = showDegLabel, rShow = showRadLabel(m.deg);
        const x = xOf(m.deg);
        return (
          <g key={"xl" + m.deg}>
            <line x1={x} x2={x} y1={PY1} y2={PY1 + 4} stroke="#94a3b8" />
            {dShow && <text x={x} y={PY1 + 17 + stagger} textAnchor="middle" fontSize={11} fontWeight={600} fill={m.family === "45" ? FAM_COL["45"] : "#475569"}>{m.deg}°</text>}
            {rShow && <Q x={x} y={PY1 + (dShow ? 34 : 22) + stagger} t={radText(m.deg)} size={10.5} fill={m.family === "45" ? FAM_COL["45"] : "#475569"} />}
          </g>
        );
      })}
      <text x={PX1} y={GH - 6} textAnchor="end" fontSize={11} fontStyle="italic" fill="#64748b">angle θ{units === "deg" ? " (degrees)" : units === "rad" ? " (radians)" : ""}</text>

      <g clipPath="url(#uc-plot)">
        {(["sin", "cos", "tan"] as Fn[]).map((f) => fns[f] && <path key={f} d={curve(f)} fill="none" stroke={COL[f]} strokeWidth={2.6} strokeLinejoin="round" />)}
      </g>
      {graphLabelPoints}

      {/* current angle */}
      {anyFn && <line x1={xOf(Math.min(360, angle))} x2={xOf(Math.min(360, angle))} y1={PY0} y2={PY1} stroke="#4f46e5" strokeWidth={1.4} strokeDasharray="4 3" />}
      {(["sin", "cos", "tan"] as Fn[]).map((f) => {
        if (!fns[f]) return null;
        const v = f === "sin" ? sinA : f === "cos" ? cosA : tanA;
        if (v === null || Math.abs(v) > ymax) return null;
        return <circle key={"m" + f} cx={xOf(Math.min(360, angle))} cy={yOf(v)} r={6} fill={COL[f]} stroke="#fff" strokeWidth={2} />;
      })}
      {!anyFn && <text x={PX0 + PW / 2} y={PY0 + PH / 2} textAnchor="middle" fontSize={14} fill="#94a3b8">Switch on sin, cos or tan to draw a graph</text>}
      {/* legend */}
      {(["sin", "cos", "tan"] as Fn[]).filter((f) => fns[f]).map((f, i) => (
        <g key={"lg" + f} transform={`translate(${PX0 + 10 + i * 64},${PY0 + 14})`}>
          <rect x={-4} y={-11} width={58} height={20} rx={10} fill="#fff" fillOpacity={0.9} stroke={COL[f]} />
          <line x1={2} x2={16} y1={-1} y2={-1} stroke={COL[f]} strokeWidth={3} />
          <text x={22} y={3} fontSize={12} fontWeight={600} fill={COL[f]}>{f === "sin" ? "sin θ" : f === "cos" ? "cos θ" : "tan θ"}</text>
        </g>
      ))}
    </svg>
  );

  // ── Readout ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const radDecimal = (shown * Math.PI) / 180;
  const valueChip = (f: Fn) => {
    const e = exact ? exact[f] : null;
    const d = f === "tan" ? dec.tan : dec[f];
    const hiddenNow = hide && !visibleAnswer(shown);
    return (
      <div key={f} className="rounded-xl border px-3 py-2 min-w-[7.5rem]" style={{ borderColor: COL[f], background: fns[f] ? COL[f] + "14" : "#fff", opacity: fns[f] ? 1 : 0.6 }}>
        <div className="text-xs font-semibold" style={{ color: COL[f] }}>{f} {shown}°</div>
        <div className="text-base font-semibold text-slate-800">
          {hiddenNow ? "?" : e ? <>= <H t={e} /></> : <>= {d === null ? "undefined" : d.toFixed(3)}</>}
          {!hiddenNow && e && e !== "undefined" && d !== null && <span className="text-xs font-normal text-slate-500"> ≈ {d.toFixed(3)}</span>}
        </div>
      </div>
    );
  };
  const hideWorking = hide && !visibleAnswer(shown);

  const working = (
    <div className="grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
      <div>
        <div className="text-xs font-semibold text-slate-500">Degrees → radians</div>
        <div className="text-base">{hideWorking ? <span className="text-slate-400">{shown}° × π/180 = ?</span> : <Rich s={degToRadWorking(shown).join(" = ")} />}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500">Radians → degrees</div>
        <div className="text-base">{hideWorking ? <span className="text-slate-400">? × 180/π = {shown}°</span> : <Rich s={radToDegWorking(shown).join(" = ")} />}</div>
      </div>
    </div>
  );

  const readout = (
    <div className="p-3 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div className="text-xl font-semibold text-slate-800">
          θ = {shown}°{hideWorking ? <span className="text-slate-400"> = ? rad</span> : <> = <span className="text-indigo-700"><H t={radText(shown)} /></span> rad</>}
        </div>
        {!hideWorking && shown !== 0 && <div className="text-sm text-slate-500">≈ {radDecimal.toFixed(3)} rad</div>}
      </div>
      {working}
      <div className="flex flex-wrap gap-2 pt-1">{(["sin", "cos", "tan"] as Fn[]).map(valueChip)}</div>
    </div>
  );

  // ── Page ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const card = "bg-white rounded-2xl border border-slate-300 shadow-card";

  const playbar = (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200">
      <IconBtn onClick={() => stepSpecial(-1)} title="Previous marked angle"><SkipBack size={18} /></IconBtn>
      <IconBtn onClick={() => setPlaying((p) => !p)} title={playing ? "Pause" : "Play"} active={playing}>{playing ? <Pause size={18} /> : <Play size={18} />}</IconBtn>
      <IconBtn onClick={() => stepSpecial(1)} title="Next marked angle"><SkipForward size={18} /></IconBtn>
      <input type="range" min={0} max={360} step={1} value={shown} aria-label="Angle in degrees"
        onChange={(e) => { setPlaying(false); setTo(Number(e.target.value), 3); }} className="flex-1 min-w-0 accent-indigo-600 h-10" />
      <IconBtn onClick={reset} title="Reset"><RotateCcw size={17} /></IconBtn>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ background: PAGE_BG, minHeight: "100vh", height: stacked ? undefined : "100vh", overflow: stacked ? undefined : "hidden" }}>
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
        <div className={`${card} px-3 py-2 flex flex-wrap items-center gap-x-5 gap-y-2`}>
          <Seg label="Angles" value={units} onChange={setUnits} options={[{ id: "deg", text: "Degrees" }, { id: "rad", text: "Radians" }, { id: "both", text: "Both" }]} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Graphs</span>
            {(["sin", "cos", "tan"] as Fn[]).map((f) => <Toggle key={f} on={fns[f]} colour={COL[f]} onClick={() => setFns((s) => ({ ...s, [f]: !s[f] }))}>{f}</Toggle>)}
          </div>
          <Seg label="Points" value={family} onChange={setFamily} options={[{ id: "30", text: "30°s" }, { id: "45", text: "45°s" }, { id: "all", text: "All" }]} />
          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={showExact} onClick={() => setShowExact((v) => !v)}>Exact values</Toggle>
            <Toggle on={graphLabels} onClick={() => setGraphLabels((v) => !v)}>Label graph points</Toggle>
            <Toggle on={trace} onClick={() => setTrace((v) => !v)}>Build graph</Toggle>
            <Toggle on={hide} onClick={() => { setHide((v) => !v); setRevealed([]); }}>Hide answers</Toggle>
          </div>
        </div>
      </div>

      {stacked ? (
        <div className="flex flex-col gap-3 p-3">
          <div className={card}>
            <div className="w-full max-w-[560px] mx-auto aspect-square">{circleSvg}</div>
            {playbar}
          </div>
          <div className={`${card} p-2`}><div className="w-full" style={{ aspectRatio: `${GW} / ${GH}` }}>{graphSvg}</div></div>
          <div className={card}>{readout}</div>
          {portrait && !phone && <p className="text-center text-xs text-slate-500 pb-2">Works best in landscape.</p>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-3">
          <div className={`${card} flex flex-col min-h-0`}>
            <div className="flex-1 min-h-0 p-2">{circleSvg}</div>
            {playbar}
          </div>
          <div className="flex flex-col gap-3 min-h-0">
            <div className={`${card} flex-1 min-h-0 p-2`}>{graphSvg}</div>
            <div className={`${card} flex-shrink-0`}>{readout}</div>
          </div>
        </div>
      )}
    </div>
  );
}
