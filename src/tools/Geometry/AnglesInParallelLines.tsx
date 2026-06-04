import { useState, useCallback, useEffect, useRef } from "react";
import { Home, Menu, X, RefreshCw, Eye, EyeOff, ChevronDown } from "lucide-react";

const DEG = Math.PI / 180;
const norm = (a: number): number => { let r = a % (2 * Math.PI); return r < 0 ? r + 2 * Math.PI : r; };

// ── Geometry ──────────────────────────────────────────────────────────────────
const L1Y = 160, L2Y = 340, MID_Y = (L1Y + L2Y) / 2;
const CX = 250;
const ARC_R = 50;

type Point = { x: number; y: number };
type SectorData = { s: number; e: number; mid: number };
type SectorMap = Record<string, SectorData>;
type AngleMap = { tl: number; tr: number; bl: number; br: number };

const getIntersections = (tvAngle: number) => {
  const sinA = Math.sin(tvAngle), cosA = Math.cos(tvAngle);
  return {
    p1: { x: CX + cosA * (L1Y - MID_Y) / sinA, y: L1Y },
    p2: { x: CX + cosA * (L2Y - MID_Y) / sinA, y: L2Y },
  };
};

const getTransversalEndpoints = (tvAngle: number, p1: Point, p2: Point) => {
  const cosA = Math.cos(tvAngle), sinA = Math.sin(tvAngle);
  const ext = 75 / Math.abs(sinA);
  return {
    start: { x: p1.x - cosA * ext, y: p1.y - Math.abs(sinA) * ext },
    end:   { x: p2.x + cosA * ext, y: p2.y + Math.abs(sinA) * ext },
  };
};

const getSectors = (tvAngle: number): SectorMap => {
  const dirs = [norm(0), norm(tvAngle), norm(Math.PI), norm(tvAngle + Math.PI)].sort((a, b) => a - b);
  const secs: SectorData[] = [];
  for (let i = 0; i < 4; i++) {
    const s = dirs[i], eR = dirs[(i + 1) % 4];
    const e = eR <= s ? eR + 2 * Math.PI : eR;
    secs.push({ s, e, mid: norm((s + e) / 2) });
  }
  const cls = (mid: number): string => {
    const m = norm(mid), top = m > Math.PI, right = m < Math.PI / 2 || m > 3 * Math.PI / 2;
    if (top && right) return "tr"; if (top && !right) return "tl";
    if (!top && right) return "br"; return "bl";
  };
  const sMap: SectorMap = {};
  secs.forEach(s => { sMap[cls(s.mid)] = s; });
  return sMap;
};

const getAngles = (tvAngle: number): AngleMap => {
  let deg = Math.abs(tvAngle * 180 / Math.PI);
  if (deg > 90) deg = 180 - deg;
  const theta = Math.round(Math.max(1, Math.min(89, deg)));
  const leansRight = Math.cos(tvAngle) >= 0;
  return leansRight
    ? { tl: theta, tr: 180 - theta, bl: 180 - theta, br: theta }
    : { tl: 180 - theta, tr: theta, bl: theta, br: 180 - theta };
};

// Filled pie-slice path
const sectorPath = (cx: number, cy: number, r: number, s: number, e: number): string => {
  let eA = e; if (eA <= s) eA += 2 * Math.PI;
  const sweep = eA - s;
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(eA), y2 = cy + r * Math.sin(eA);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
};

// Arc-only path (no radii)
const arcOnlyPath = (cx: number, cy: number, r: number, s: number, e: number): string => {
  let eA = e; if (eA <= s) eA += 2 * Math.PI;
  const sweep = eA - s;
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(eA), y2 = cy + r * Math.sin(eA);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

// ── Rules ─────────────────────────────────────────────────────────────────────
const RULES = [
  {
    key: "corresponding", label: "Corresponding Angles", statement: "Corresponding angles are equal",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"br" },
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"bl" },
      { inter1:"p1", quad1:"tr", inter2:"p2", quad2:"tr" },
      { inter1:"p1", quad1:"tl", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "alternate", label: "Alternate Angles", statement: "Alternate angles are equal",
    variants: [
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"tr" },
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "coInterior", label: "Co-interior Angles", statement: "Co-interior angles add up to 180°",
    variants: [
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"tl" },
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"tr" },
    ],
  },
  {
    key: "straightLine", label: "Angles on a Straight Line", statement: "Angles on a straight line add up to 180°",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p1", quad2:"bl" },
      { inter1:"p1", quad1:"tr", inter2:"p1", quad2:"tl" },
      { inter1:"p2", quad1:"br", inter2:"p2", quad2:"bl" },
      { inter1:"p2", quad1:"tr", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "verticallyOpposite", label: "Vertically Opposite Angles", statement: "Vertically opposite angles are equal",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p1", quad2:"tl" },
      { inter1:"p1", quad1:"bl", inter2:"p1", quad2:"tr" },
      { inter1:"p2", quad1:"br", inter2:"p2", quad2:"tl" },
      { inter1:"p2", quad1:"bl", inter2:"p2", quad2:"tr" },
    ],
  },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Shell-pattern popover ─────────────────────────────────────────────────────

const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", borderRadius: 12, border: "2px solid",
      borderColor: open ? "#1e3a8a" : "#d1d5db",
      background: open ? "#1e3a8a" : "white",
      color: open ? "white" : "#4b5563",
      fontWeight: 700, fontSize: 15, cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }}>
    Question Options
    <ChevronDown size={17} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}/>
  </button>
);

type DropdownOption = { value: string; label: string };

const DropdownSection = ({ label, options, value, onChange }: {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.09em" }}>
      {label}
    </span>
    <div style={{ display: "flex", borderRadius: 8, border: "2px solid #e5e7eb", overflow: "hidden" }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: "8px 6px",
            fontSize: 13, fontWeight: 700,
            background: value === opt.value ? "#1e3a8a" : "white",
            color: value === opt.value ? "white" : "#4b5563",
            border: "none", cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

type MultiSelectOption = { value: string; label: string };

const MultiSelectSection = ({ options, values, onChange }: {
  options: MultiSelectOption[];
  values: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}) => {
  const activeCount = options.filter(o => values[o.value]).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.09em" }}>
        Angle Types
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = isActive && activeCount === 1;
          return (
            <button key={opt.value}
              onClick={() => { if (!isLast) onChange(opt.value, !isActive); }}
              style={{
                padding: "9px 12px",
                fontSize: 13, fontWeight: 700,
                borderRadius: 10,
                border: `2px solid ${isActive ? "#1e3a8a" : "#e5e7eb"}`,
                background: isActive ? "#1e3a8a" : "white",
                color: isActive ? "white" : "#6b7280",
                cursor: isLast ? "default" : "pointer",
                transition: "all 0.15s",
                textAlign: "center",
              }}
              onMouseEnter={e => { if (!isActive && !isLast) e.currentTarget.style.borderColor = "#1e3a8a"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const generateQuestion = (activeRules: Record<string, boolean>, fixedRotation: number | null = null) => {
  const acuteDeg = randInt(50, 70);
  const leanRight = Math.random() < 0.5;
  const tvAngle = (leanRight ? acuteDeg : 180 - acuteDeg) * DEG;
  const pool = RULES.filter(r => activeRules[r.key] !== false);
  const rule = pick(pool.length > 0 ? pool : RULES);
  const variant = pick(rule.variants);
  const angles = getAngles(tvAngle);
  const sectors = getSectors(tvAngle);
  const pts = getIntersections(tvAngle);
  const val1 = angles[variant.quad1 as keyof AngleMap], val2 = angles[variant.quad2 as keyof AngleMap];
  const swapped = Math.random() < 0.5;
  const ROTATIONS = [0, 45, 90, 135];
  const canvasRotation = fixedRotation !== null ? fixedRotation : ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];

  return {
    tvAngle, rule, angles, sectors, pts, canvasRotation,
    knownVal:   swapped ? val2 : val1,
    xVal:       swapped ? val1 : val2,
    knownQuad:  swapped ? variant.quad2 : variant.quad1,
    knownInter: swapped ? variant.inter2 : variant.inter1,
    xQuad:      swapped ? variant.quad1 : variant.quad2,
    xInter:     swapped ? variant.inter1 : variant.inter2,
  };
};

type Question = ReturnType<typeof generateQuestion>;

// ── Colours ───────────────────────────────────────────────────────────────────
const KNOWN_FILL = "rgba(29,78,216,0.15)";
const KNOWN_STROKE = "#1d4ed8";
const X_FILL = "rgba(220,38,38,0.15)";
const X_STROKE = "#dc2626";
const LINE_COLOR = "#111827";

// ── Diagram ───────────────────────────────────────────────────────────────────
const Diagram = ({ q, showAnswer }: { q: Question; showAnswer: boolean }) => {
  const { tvAngle, sectors, knownVal, xVal, knownQuad, knownInter, xQuad, xInter, pts, canvasRotation } = q;
  const { p1, p2 } = pts;
  const tv = getTransversalEndpoints(tvAngle, p1, p2);

  const lineHalf = (ix: number) => {
    const maxLeft = Math.min(220, ix - 10);
    const maxRight = Math.min(220, 490 - ix);
    return { left: maxLeft, right: maxRight };
  };
  const lh1 = lineHalf(p1.x), lh2 = lineHalf(p2.x);

  const MidArrow = ({ ix, iy, armRight }: { ix: number; iy: number; armRight: number }) => {
    const ax = ix + armRight * 0.55;
    const ay = iy;
    const size = 10;
    return (
      <polyline
        points={`${ax - size},${ay - size * 0.65} ${ax},${ay} ${ax - size},${ay + size * 0.65}`}
        fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
      />
    );
  };

  const Sector = ({ interKey, quadKey, fill, stroke, labelText }: {
    interKey: string; quadKey: string; fill: string; stroke: string; labelText: string;
  }) => {
    const sec = sectors[quadKey];
    if (!sec) return null;
    const pt = pts[interKey as keyof typeof pts];
    const lx = pt.x + (ARC_R + 26) * Math.cos(sec.mid);
    const ly = pt.y + (ARC_R + 26) * Math.sin(sec.mid);
    const isX = !showAnswer && labelText === "x";
    return (
      <>
        <path d={sectorPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill={fill} stroke="none"/>
        <path d={arcOnlyPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
        <g transform={`translate(${lx},${ly}) rotate(${-canvasRotation})`}>
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
            fill={stroke} fontSize="18" fontWeight="800"
            fontStyle={isX ? "italic" : "normal"}
            fontFamily="'Segoe UI', Arial, sans-serif">
            {labelText}
          </text>
        </g>
      </>
    );
  };

  const VB = 500, VC = 250;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      style={{ display: "block", width: "100%", height: "440px" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform={`rotate(${canvasRotation}, ${VC}, ${VC})`}>
        {/* Parallel lines */}
        <line x1={p1.x - lh1.left} y1={L1Y} x2={p1.x + lh1.right} y2={L1Y} stroke={LINE_COLOR} strokeWidth="3.5"/>
        <line x1={p2.x - lh2.left} y1={L2Y} x2={p2.x + lh2.right} y2={L2Y} stroke={LINE_COLOR} strokeWidth="3.5"/>

        {/* Mid-line direction arrows */}
        <MidArrow ix={p1.x} iy={L1Y} armRight={lh1.right}/>
        <MidArrow ix={p2.x} iy={L2Y} armRight={lh2.right}/>

        {/* Transversal */}
        <line x1={tv.start.x} y1={tv.start.y} x2={tv.end.x} y2={tv.end.y} stroke={LINE_COLOR} strokeWidth="3.5"/>

        {/* Intersection dots */}
        <circle cx={p1.x} cy={p1.y} r="5.5" fill={LINE_COLOR}/>
        <circle cx={p2.x} cy={p2.y} r="5.5" fill={LINE_COLOR}/>

        {/* Angle sectors */}
        <Sector interKey={knownInter} quadKey={knownQuad} fill={KNOWN_FILL} stroke={KNOWN_STROKE} labelText={`${knownVal}°`}/>
        <Sector interKey={xInter}     quadKey={xQuad}     fill={X_FILL}     stroke={X_STROKE}     labelText={showAnswer ? `${xVal}°` : "x"}/>
      </g>
    </svg>
  );
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
const getQBg    = (cs: string): string => ({ blue:"#D1E7F8", pink:"#F8D1E7", yellow:"#F8F4D1" } as Record<string,string>)[cs] ?? "#ffffff";
const getStepBg = (cs: string): string => ({ blue:"#B3D9F2", pink:"#F2B3D9", yellow:"#F2EBB3" } as Record<string,string>)[cs] ?? "#f3f4f6";

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [question, setQuestion]       = useState<Question>(() => generateQuestion({}));
  const [showAnswer, setShowAnswer]   = useState(false);
  const [colorScheme, setColorScheme] = useState("default");
  const [menuOpen, setMenuOpen]       = useState(false);
  const [colorOpen, setColorOpen]     = useState(false);
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(RULES.map(r => [r.key, true]))
  );
  const [fixedRotation, setFixedRotation] = useState<number | null>(null);
  const { open: qoOpen, setOpen: setQoOpen, ref: qoRef } = usePopover();

  const qBg    = getQBg(colorScheme);
  const stepBg = getStepBg(colorScheme);

  const handleNew = useCallback(() => {
    setQuestion(generateQuestion(activeRules, fixedRotation));
    setShowAnswer(false);
  }, [activeRules, fixedRotation]);

  const handleRuleToggle = useCallback((key: string, val: boolean) => {
    setActiveRules(prev => ({ ...prev, [key]: val }));
  }, []);

  const { rule, xVal } = question;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f3f0" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1e3a8a", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { window.location.href = "/"; }}
            style={{ display: "flex", alignItems: "center", gap: 8, color: "white", background: "none", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 17 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <Home size={22}/> Home
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setMenuOpen(o => !o); setColorOpen(false); }}
              style={{ color: "white", background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {menuOpen ? <X size={28}/> : <Menu size={28}/>}
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "white", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb", minWidth: 200, zIndex: 50 }}>
                <button onClick={() => setColorOpen(o => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <span>Colour Scheme</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", textTransform: "capitalize" }}>{colorScheme}</span>
                </button>
                {colorOpen && (
                  <div style={{ borderTop: "1px solid #f3f4f6" }}>
                    {["default","blue","pink","yellow"].map(s => (
                      <button key={s} onClick={() => { setColorScheme(s); setMenuOpen(false); setColorOpen(false); }}
                        style={{ width: "100%", padding: "9px 16px 9px 40px", background: colorScheme===s ? "#1e3a8a" : "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colorScheme===s ? "white" : "#4b5563", textAlign: "left", textTransform: "capitalize", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        onMouseEnter={e => { if (colorScheme!==s) e.currentTarget.style.background="#f9fafb"; }}
                        onMouseLeave={e => { if (colorScheme!==s) e.currentTarget.style.background="none"; }}>
                        {s}
                        {colorScheme===s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: "0 auto", padding: 32 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, textAlign: "center", color: "#000", marginBottom: 28 }}>
          Angles in Parallel Lines
        </h1>
        <div style={{ width: "90%", height: 2, background: "#d1d5db", margin: "0 auto 32px" }}/>

        <div style={{ background: qBg, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "28px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

          {/* ── Controls at top ── */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={handleNew}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 26px", background: "#1e3a8a", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
              onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>
              <RefreshCw size={18}/> New Question
            </button>
            <button onClick={() => setShowAnswer(a => !a)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 26px", background: "#1e3a8a", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
              onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>
              {showAnswer ? <><EyeOff size={18}/> Hide Answer</> : <><Eye size={18}/> Show Answer</>}
            </button>
            {/* QO Popover */}
            <div style={{ position: "relative" }} ref={qoRef}>
              <PopoverButton open={qoOpen} onClick={() => setQoOpen(o => !o)}/>
              {qoOpen && (
                <div style={{
                  position: "absolute", left: 0, top: "calc(100% + 8px)",
                  background: "white", borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  border: "1px solid #e5e7eb",
                  zIndex: 50, padding: 20, minWidth: 320,
                  display: "flex", flexDirection: "column", gap: 20,
                }}>
                  <DropdownSection
                    label="Orientation"
                    value={fixedRotation === null ? "random" : String(fixedRotation)}
                    onChange={v => setFixedRotation(v === "random" ? null : Number(v))}
                    options={[
                      { value: "random",  label: "Random" },
                      { value: "0",       label: "—" },
                      { value: "45",      label: "╲" },
                      { value: "90",      label: "│" },
                      { value: "135",     label: "╱" },
                    ]}
                  />
                  <div style={{ height: 1, background: "#f3f4f6" }}/>
                  <MultiSelectSection
                    options={RULES.map(r => ({ value: r.key, label: r.label }))}
                    values={activeRules}
                    onChange={handleRuleToggle}
                  />
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: 18, fontWeight: 600, color: "#374151", margin: 0 }}>
            Name the rule and find <em style={{ color: "#dc2626" }}>x</em>.
          </p>

          {/* Diagram */}
          <div style={{ background: "white", borderRadius: 14, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "100%" }}>
            <Diagram q={question} showAnswer={showAnswer}/>
          </div>

          {/* Answer */}
          {showAnswer && (
            <div style={{ background: stepBg, borderRadius: 12, padding: "20px 36px", textAlign: "center", width: "100%", maxWidth: 560 }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#166534" }}>x = {xVal}°</p>
              <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 600, color: "#374151" }}>
                {rule.label} — {rule.statement}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
