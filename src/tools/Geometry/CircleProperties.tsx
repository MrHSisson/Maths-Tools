import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── NAVIGATION ───────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button.
// No React Router / useNavigate — the parent app handles routing.
// Individual tool components never wrap themselves in a router.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX — loaded once from CDN, injected into page head
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || w().katex) { resolve(); return; }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

interface MathProps {
  latex: string;
  style?: CSSProperties;
  className?: string;
}

const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      w().katex.render(latex, ref.current, { displayMode: false, throwOnError: false, output: "html" });
    } catch { if (ref.current) ref.current.textContent = latex; }
  }, [latex, ready]);
  const hasFrac = latex.includes("\\frac");
  return <span ref={ref} className={className} style={{display:"inline",verticalAlign:"baseline",fontSize:hasFrac?"1em":"0.826em",...style}} />;
};

const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open?"bg-blue-900 border-blue-900 text-white":"bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
  </button>
);

const LV_LABELS: Record<string,string> = {level1:"Level 1",level2:"Level 2",level3:"Level 3"};
const LV_HEADER_COLORS: Record<string,string> = {level1:"text-green-600",level2:"text-yellow-500",level3:"text-red-600"};

const TogglePill = ({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={()=>onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked?"bg-blue-900":"bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?"translate-x-7":"translate-x-1"}`}/>
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

const SegButtons = ({value,onChange,opts}:{value:string;onChange:(v:string)=>void;opts:{value:string;label:string}[]}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt=>(
      <button key={opt.value} onClick={()=>onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "circumference" | "area" | "sectors";
type DifficultyLevel = "level1" | "level2" | "level3";

// Diagram params stored on each question — rendering is done by CircleDiagram component
interface DiagramProps {
  type: "circle" | "sector";
  // circle fields
  given?: "radius" | "diameter" | "circumference" | "area";
  find?: "radius" | "diameter" | "circumference" | "area";
  radius?: number;
  diameter?: number;
  circumferenceLabel?: string;  // formatted string e.g. "6π" or "18.9"
  areaLabel?: string;
  angle?: number;               // rotation of the diameter/radius line
  // sector fields
  theta?: number;
  level?: number;
  // shared
  colorSchemeRef?: string;      // passed at render time — not stored on question
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG = {
  pageTitle: "Circle Properties",

  tools: {
    circumference: {
      name: "Circumference",
      useSubstantialBoxes: true,
      variables: [
        { key: "decimals",  label: "Allow decimals",    defaultValue: false },
        { key: "answerPi",  label: "Answers in π",      defaultValue: false },
      ],
      dropdown: null,
      difficultySettings: null,
    },

    area: {
      name: "Area",
      useSubstantialBoxes: true,
      variables: [
        { key: "decimals",  label: "Allow decimals",    defaultValue: false },
        { key: "answerPi",  label: "Answers in π",      defaultValue: false },
      ],
      dropdown: null,
      difficultySettings: null,
    },

    sectors: {
      name: "Sectors",
      useSubstantialBoxes: true,
      variables: [
        { key: "decimals",  label: "Allow decimals",    defaultValue: false },
        { key: "answerPi",  label: "Answers in π",      defaultValue: false },
      ],
      dropdown: {
        key: "style",
        label: "Question Style",
        useTwoLineButtons: true,
        options: [
          { value: "mixed",     label: "Mixed",      sub: "Area / arc / perim" },
          { value: "area",      label: "Area",       sub: "Sector area"        },
          { value: "arcLength", label: "Arc Length", sub: "Arc only"           },
          { value: "perimeter", label: "Perimeter",  sub: "Arc + straight"     },
        ],
        defaultValue: "mixed",
      },
      difficultySettings: {
        level1: {
          dropdown: {
            key: "style", label: "Question Style", useTwoLineButtons: true,
            options: [
              { value: "mixed",     label: "Mixed",      sub: "Area / arc / perim" },
              { value: "area",      label: "Area",       sub: "Semi-circle area"   },
              { value: "arcLength", label: "Arc Length", sub: "Arc only"           },
              { value: "perimeter", label: "Perimeter",  sub: "Arc + diameter"     },
            ],
            defaultValue: "mixed",
          },
          variables: [
            { key: "decimals", label: "Allow decimals", defaultValue: false },
            { key: "answerPi", label: "Answers in π",   defaultValue: false },
          ],
        },
        level2: {
          dropdown: {
            key: "style", label: "Question Style", useTwoLineButtons: true,
            options: [
              { value: "mixed",     label: "Mixed",      sub: "Area / arc / perim"   },
              { value: "area",      label: "Area",       sub: "Quarter-circle area"  },
              { value: "arcLength", label: "Arc Length", sub: "Arc only"             },
              { value: "perimeter", label: "Perimeter",  sub: "Arc + 2 radii"        },
            ],
            defaultValue: "mixed",
          },
          variables: [
            { key: "decimals", label: "Allow decimals", defaultValue: false },
            { key: "answerPi", label: "Answers in π",   defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "style", label: "Question Style", useTwoLineButtons: true,
            options: [
              { value: "mixed",     label: "Mixed",      sub: "Area / arc / perim" },
              { value: "area",      label: "Area",       sub: "Any sector"         },
              { value: "arcLength", label: "Arc Length", sub: "Arc only"           },
              { value: "perimeter", label: "Perimeter",  sub: "Arc + 2 radii"      },
            ],
            defaultValue: "mixed",
          },
          variables: [
            { key: "decimals", label: "Allow decimals", defaultValue: false },
            { key: "answerPi", label: "Answers in π",   defaultValue: false },
          ],
        },
      },
    },
  } as Record<string, {
    name: string;
    instruction?: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: {
      key: string; label: string; useTwoLineButtons?: boolean;
      options: { value: string; label: string; sub?: string }[];
      defaultValue: string;
    } | null;
    multiSelect?: {
      key: string; label: string;
      options: { value: string; label: string; defaultActive: boolean }[];
    };
    difficultySettings: Record<string, {
      dropdown?: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
      variables?: { key: string; label: string; defaultValue: boolean }[];
      multiSelect?: { key: string; label: string; options: { value: string; label: string; defaultActive: boolean }[] };
    }> | null;
  }>,
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS = [
  { title: "Circumference", icon: "⭕", content: [
    { label: "Overview",         detail: "Find the circumference from a given diameter or radius, or find the radius/diameter from a given circumference." },
    { label: "Level 1 — Green",  detail: "Given the diameter, find the circumference using C = πd." },
    { label: "Level 2 — Yellow", detail: "Given the radius, find the circumference using C = 2πr." },
    { label: "Level 3 — Red",    detail: "Given the circumference, find the missing radius or diameter by rearranging." },
  ]},
  { title: "Area", icon: "🔵", content: [
    { label: "Overview",         detail: "Find the area from a given radius or diameter, or find the radius/diameter from a given area." },
    { label: "Level 1 — Green",  detail: "Given the radius, find the area using A = πr²." },
    { label: "Level 2 — Yellow", detail: "Given the diameter, find the area (find r first, then A = πr²)." },
    { label: "Level 3 — Red",    detail: "Given the area, find the missing radius or diameter by rearranging." },
  ]},
  { title: "Sectors", icon: "🥧", content: [
    { label: "Overview",         detail: "Find the arc length, area, or perimeter of a sector." },
    { label: "Level 1 — Green",  detail: "Semi-circles (θ = 180°). Diameter given. Find arc length, area, or perimeter." },
    { label: "Level 2 — Yellow", detail: "Quarter-circles (θ = 90°). Diameter given. Find arc length, area, or perimeter." },
    { label: "Level 3 — Red",    detail: "Any angle θ. Diameter given. Find arc length, area, or perimeter." },
  ]},
  { title: "Options", icon: "⚙️", content: [
    { label: "Allow decimals",   detail: "When on, dimensions may be non-integer values." },
    { label: "Answers in π",     detail: "When on, answers are expressed as exact multiples of π rather than decimals." },
    { label: "Question Style",   detail: "For Sectors: choose Mixed, Area, Arc Length, or Perimeter — available per level in Differentiated mode." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question with diagram on the left; working space on the right." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
];

// ── 4. Question interface ─────────────────────────────────────────────────────

interface CircleQuestion {
  kind: "simple";
  display: string;
  displayLatex?: string;
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: { type: string; latex: string; plain: string; label?: string; unit?: string }[];
  key: string;
  difficulty: string;
  // diagram params — rendered by CircleDiagram component
  diagramProps: DiagramProps;
}

type AnyQuestion = CircleQuestion;

// ── 5. Helpers ────────────────────────────────────────────────────────────────

const PI = 3.14159265358979;

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Nice integer pool for circle radii/diameters — avoids awkward squares and
// keeps r² manageable for area questions. Excludes large primes like 13, 17, 19, 23.
const NICE_INTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 28, 30];
// Nice decimal pool — clean 1dp values spread across the range
const NICE_DECS = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 20.5];

const pickDim = (allowDecimals: boolean, _min = 1, max = 30): number => {
  if (allowDecimals) {
    const pool = NICE_DECS.filter(n => n <= max);
    return pool[randInt(0, pool.length - 1)];
  }
  const pool = NICE_INTS.filter(n => n <= max);
  return pool[randInt(0, pool.length - 1)];
};

const fmt = (n: number, dp = 2): string => n.toFixed(dp).replace(/\.?0+$/, "");

const fmtN = (n: number): string => Number.isInteger(n) ? n.toString() : n.toFixed(1);

const step  = (latex: string, plain?: string) => ({ type: "step",  latex, plain: plain ?? latex });
const mStep = (label: string, latex: string, unit?: string) =>
  ({ type: "mStep", latex, plain: `${label} ${latex}${unit ? " " + unit : ""}`, label, unit });
const tStep = (text: string) => ({ type: "tStep", latex: `\\text{${text}}`, plain: text });

// ── 6. SVG Diagram rendering ─────────────────────────────────────────────────
//
// CircleDiagram renders as an SVG inline.  It is used:
//   - In whiteboard/worked example: inside the question box, below the question text
//   - In renderQCell: within each worksheet cell
//
// colorSchemeLabelBg is passed at render time based on the active colour scheme
// and level (for differentiated worksheets).

interface CircleDiagramProps {
  dp: DiagramProps;
  size?: number;
  labelBg?: string;    // background for inline diagram labels (whiteboard/WE)
  isWorksheet?: boolean;
  levelFill?: string;  // differentiated cell background e.g. "#dcfce7"
}

const CircleDiagram = ({ dp, size = 320, labelBg = "#ffffff", isWorksheet = false, levelFill }: CircleDiagramProps) => {
  if (dp.type === "sector") return <SectorDiagram dp={dp} size={size} labelBg={labelBg} isWorksheet={isWorksheet} levelFill={levelFill}/>;

  // ── Full circle diagram ───────────────────────────────────────────────────
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.35;
  const angleRad = ((dp.angle ?? 30) * Math.PI) / 180;

  // Points for diameter/radius line
  const dEndX = cx + Math.cos(angleRad) * r;
  const dEndY = cy + Math.sin(angleRad) * r;
  const dStartX = cx - Math.cos(angleRad) * r;
  const dStartY = cy - Math.sin(angleRad) * r;
  // Midpoint of diameter (label sits on line, centred)
  const dMidX = cx + Math.cos(angleRad) * r * 0.35;
  const dMidY = cy + Math.sin(angleRad) * r * 0.35;
  // Radius label: midpoint of radius line, offset perpendicularly so it
  // sits beside the line rather than on top of it. The perpendicular
  // direction is (-sin θ, cos θ); we offset by ~18px toward whichever
  // side keeps the label inside the circle bounds.
  const rLineX = cx + Math.cos(angleRad) * r * 0.5;
  const rLineY = cy + Math.sin(angleRad) * r * 0.5;
  const perpX  = -Math.sin(angleRad);
  const perpY  =  Math.cos(angleRad);
  const labelOffset = size * 0.072; // scale offset with diagram size
  const rMidX = rLineX + perpX * labelOffset;
  const rMidY = rLineY + perpY * labelOffset;

  const showDiam  = dp.given === "diameter" || dp.find === "diameter";
  const showRad   = dp.given === "radius"   || dp.find === "radius";
  const showCirc  = dp.given === "circumference";
  const showArea  = dp.given === "area";

  // Label text for inline (whiteboard) vs worksheet info box
  const wbDiamLabel = dp.given === "diameter" ? `d = ${fmtN(dp.diameter!)} cm` : "d = ?";
  const wbRadLabel  = dp.given === "radius"   ? `r = ${fmtN(dp.radius!)} cm`   : "r = ?";

  // Worksheet: info boxes below circle
  const infoLines: string[] = [];
  if (showDiam) infoLines.push(wbDiamLabel);
  if (showRad)  infoLines.push(wbRadLabel);
  if (showCirc) infoLines.push(`C = ${dp.circumferenceLabel} cm`);
  if (showArea) infoLines.push(`A = ${dp.areaLabel} cm²`);

  const boxFontPx  = isWorksheet ? 16 : 22;
  const boxH       = boxFontPx * 2.2;
  const boxPad     = boxFontPx * 0.9;
  const boxGap     = boxH * 0.18;
  const firstBoxY  = cy + r + size * 0.08;
  const svgH       = isWorksheet ? firstBoxY + infoLines.length * (boxH + boxGap) + boxGap : size;

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#000" strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3" fill="#000"/>

      {/* Diameter line */}
      {showDiam && <line x1={dStartX} y1={dStartY} x2={dEndX} y2={dEndY} stroke="#000" strokeWidth="2" strokeDasharray="5,4"/>}
      {/* Radius line */}
      {showRad  && <line x1={cx} y1={cy} x2={dEndX} y2={dEndY} stroke="#000" strokeWidth="2" strokeDasharray="5,4"/>}

      {/* Inline labels (whiteboard / worked example only) */}
      {!isWorksheet && showDiam && (
        <g>
          <rect x={dMidX-42} y={dMidY-14} width={84} height={28} fill={labelBg} opacity="0.92" rx="3"/>
          <text x={dMidX} y={dMidY} fontSize={20} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">{wbDiamLabel}</text>
        </g>
      )}
      {!isWorksheet && showRad && (
        <g>
          <rect x={rMidX-46} y={rMidY-14} width={92} height={28} fill={labelBg} opacity="0.92" rx="3"/>
          <text x={rMidX} y={rMidY} fontSize={20} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">{wbRadLabel}</text>
        </g>
      )}
      {!isWorksheet && showCirc && (
        <text x={cx} y={cy + r + 36} fontSize={22} fontWeight="bold" textAnchor="middle" fill="#000">C = {dp.circumferenceLabel} cm</text>
      )}
      {!isWorksheet && showArea && (
        <text x={cx} y={cy + r + 36} fontSize={22} fontWeight="bold" textAnchor="middle" fill="#000">A = {dp.areaLabel} cm²</text>
      )}

      {/* Worksheet info boxes */}
      {isWorksheet && infoLines.map((txt, i) => {
        const bY = firstBoxY + i * (boxH + boxGap);
        const bW = txt.length * boxFontPx * 0.62 + boxPad * 2;
        const bX = (size - bW) / 2;
        return (
          <g key={i}>
            <rect x={bX} y={bY} width={bW} height={boxH} fill={levelFill ?? "#f3f4f6"} stroke="#d1d5db" strokeWidth="1.5" rx="4"/>
            <text x={size/2} y={bY + boxH/2} fontSize={boxFontPx} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">{txt}</text>
          </g>
        );
      })}
    </svg>
  );
};

const SectorDiagram = ({ dp, size = 320, labelBg = "#ffffff", isWorksheet = false, levelFill }: CircleDiagramProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.35;
  const theta = dp.theta ?? 90;

  // Place the flat edge(s) nicely depending on theta
  let startAngle: number, endAngle: number;
  if (theta === 180) {
    startAngle = 180; endAngle = 0;          // flat edge at bottom → half moon opening up
  } else if (theta === 90) {
    startAngle = -90; endAngle = 0;          // top-right quadrant
  } else {
    startAngle = -90; endAngle = -90 + theta; // starts at top, sweeps clockwise
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sR = toRad(startAngle), eR = toRad(endAngle);

  const sX = cx + Math.cos(sR) * r;
  const sY = cy + Math.sin(sR) * r;
  const eX = cx + Math.cos(eR) * r;
  const eY = cy + Math.sin(eR) * r;

  const largeArc = theta > 180 ? 1 : 0;
  const path = `M ${cx} ${cy} L ${sX} ${sY} A ${r} ${r} 0 ${largeArc} 1 ${eX} ${eY} Z`;

  // Level 1: dimension line is the diameter chord (flat edge of semicircle)
  // Level 2+: dimension line is one radius
  const level = dp.level ?? 1;
  const isL1  = level === 1;

  const dimX1 = isL1 ? sX : cx;
  const dimY1 = isL1 ? sY : cy;
  const dimX2 = isL1 ? eX : sX;
  const dimY2 = isL1 ? eY : sY;
  const midX  = (dimX1 + dimX2) / 2;
  const midY  = (dimY1 + dimY2) / 2;

  const labelTxt = isL1 ? `d = ${fmtN(dp.diameter!)} cm` : `r = ${fmtN(dp.radius!)} cm`;

  // Arrowheads along dimension line
  const dx = dimX2 - dimX1, dy = dimY2 - dimY1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const ux = dx/len, uy = dy/len;
  const px = -uy, py = ux;  // perpendicular
  const aLen = 10, aW = 4;

  const arrow1x = dimX1 + ux*aLen, arrow1y = dimY1 + uy*aLen;
  const arrow2x = dimX2 - ux*aLen, arrow2y = dimY2 - uy*aLen;

  // Theta angle arc (level 3 only)
  const showThetaArc = level === 3;
  const midAngleRad = (sR + eR) / 2;
  const thetaArcR = 28;
  const thetaArcSX = cx + Math.cos(sR) * thetaArcR;
  const thetaArcSY = cy + Math.sin(sR) * thetaArcR;
  const thetaArcEX = cx + Math.cos(eR) * thetaArcR;
  const thetaArcEY = cy + Math.sin(eR) * thetaArcR;
  const thetaLabelX = cx + Math.cos(midAngleRad) * 44;
  const thetaLabelY = cy + Math.sin(midAngleRad) * 44;

  // Worksheet info boxes
  const infoLines: string[] = [labelTxt];
  const showThetaBox = level !== 1 && ![90, 180, 270].includes(theta);
  if (showThetaBox) infoLines.push(`θ = ${theta}°`);

  const boxFontPx  = isWorksheet ? 16 : 22;
  const boxH       = boxFontPx * 2.2;
  const boxPad     = boxFontPx * 0.9;
  const boxGap     = boxH * 0.18;
  const firstBoxY  = cy + r + size * 0.08;
  const svgH       = isWorksheet ? firstBoxY + infoLines.length * (boxH + boxGap) + boxGap : size;

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
      {/* Sector fill */}
      <path d={path} fill="#C8E6C9" stroke="#2E7D32" strokeWidth="2.5"/>
      {level > 1 && <circle cx={cx} cy={cy} r="3" fill="#2E7D32"/>}

      {/* Dimension line */}
      <line x1={dimX1} y1={dimY1} x2={dimX2} y2={dimY2} stroke="#000" strokeWidth="2"/>
      {/* Arrowheads */}
      <line x1={dimX1} y1={dimY1} x2={arrow1x+px*aW} y2={arrow1y+py*aW} stroke="#000" strokeWidth="2"/>
      <line x1={dimX1} y1={dimY1} x2={arrow1x-px*aW} y2={arrow1y-py*aW} stroke="#000" strokeWidth="2"/>
      <line x1={dimX2} y1={dimY2} x2={arrow2x+px*aW} y2={arrow2y+py*aW} stroke="#000" strokeWidth="2"/>
      <line x1={dimX2} y1={dimY2} x2={arrow2x-px*aW} y2={arrow2y-py*aW} stroke="#000" strokeWidth="2"/>

      {/* Theta arc (level 3) */}
      {showThetaArc && (
        <>
          <path d={`M ${thetaArcSX} ${thetaArcSY} A ${thetaArcR} ${thetaArcR} 0 ${theta>180?1:0} 1 ${thetaArcEX} ${thetaArcEY}`}
            fill="none" stroke="#000" strokeWidth="2"/>
          <text x={thetaLabelX} y={thetaLabelY} fontSize={20} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">θ</text>
        </>
      )}

      {/* Inline label (whiteboard / WE) */}
      {!isWorksheet && (
        <g>
          <rect x={midX-52} y={midY-15} width={104} height={30} fill={labelBg} opacity="0.94" rx="3"/>
          <text x={midX} y={midY} fontSize={20} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">{labelTxt}</text>
        </g>
      )}
      {!isWorksheet && showThetaBox && (
        <text x={cx} y={cy + r + 38} fontSize={22} fontWeight="bold" textAnchor="middle" fill="#000">θ = {theta}°</text>
      )}

      {/* Worksheet info boxes */}
      {isWorksheet && infoLines.map((txt, i) => {
        const bY = firstBoxY + i * (boxH + boxGap);
        const bW = txt.length * boxFontPx * 0.62 + boxPad * 2;
        const bX = (size - bW) / 2;
        return (
          <g key={i}>
            <rect x={bX} y={bY} width={bW} height={boxH} fill={levelFill ?? "#f3f4f6"} stroke="#d1d5db" strokeWidth="1.5" rx="4"/>
            <text x={size/2} y={bY + boxH/2} fontSize={boxFontPx} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000">{txt}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── 7. Question generators ────────────────────────────────────────────────────

const generateCircumference = (
  level: DifficultyLevel,
  allowDecimals: boolean,
  answerPi: boolean,
): CircleQuestion => {
  const angle = randInt(0, 11) * 15;

  if (level === "level1") {
    const d = pickDim(allowDecimals);
    const r = d / 2;
    const C  = d * PI;
    const Cf = answerPi ? `${fmtN(d)}\\pi` : fmt(C, 2);
    const Cdisp = answerPi ? `${fmtN(d)}π` : fmt(C, 2);
    return {
      kind: "simple", display: "Find the circumference", displayLatex: "\\text{Find the circumference}",
      answer: `${Cdisp} cm`, answerLatex: Cf, answerSuffix: "cm",
      diagramProps: { type:"circle", given:"diameter", find:"circumference", diameter:d, radius:r, angle },
      working: [
        mStep("Given:", `d = ${fmtN(d)}`),
        step("C = \\pi d"),
        step(`C = \\pi \\times ${fmtN(d)}`),
        answerPi ? step(`C = ${fmtN(d)}\\pi \\text{ cm}`) : step(`C = ${fmt(d * PI, 2)} \\text{ cm}`),
      ],
      key: `circ-L1-d${d}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const r = pickDim(allowDecimals);
    const d = r * 2;
    const C  = 2 * PI * r;
    const Cf = answerPi ? `${fmtN(2*r)}\\pi` : fmt(C, 2);
    const Cdisp = answerPi ? `${fmtN(2*r)}π` : fmt(C, 2);
    return {
      kind: "simple", display: "Find the circumference", displayLatex: "\\text{Find the circumference}",
      answer: `${Cdisp} cm`, answerLatex: Cf, answerSuffix: "cm",
      diagramProps: { type:"circle", given:"radius", find:"circumference", diameter:d, radius:r, angle },
      working: [
        mStep("Given:", `r = ${fmtN(r)}`),
        step("C = 2\\pi r"),
        step(`C = 2 \\times \\pi \\times ${fmtN(r)}`),
        answerPi ? step(`C = ${fmtN(2*r)}\\pi \\text{ cm}`) : step(`C = ${fmt(2 * PI * r, 2)} \\text{ cm}`),
      ],
      key: `circ-L2-r${r}`, difficulty: level,
    };
  }

  // level3 — find radius or diameter given circumference
  const findWhat: "radius" | "diameter" = Math.random() > 0.5 ? "radius" : "diameter";
  const r  = pickDim(allowDecimals);
  const d  = r * 2;
  const C  = 2 * PI * r;
  const Cf = fmt(C, 2);
  const CLabelPi = `${fmtN(2*r)}\\pi`;
  const CLabel   = answerPi ? `${fmtN(2*r)}π` : Cf;
  const ans = findWhat === "radius" ? fmtN(r) : fmtN(d);

  const working = findWhat === "radius" ? [
    mStep("Given:", `C = ${CLabel} \\text{ cm}`),
    step("C = 2\\pi r \\Rightarrow r = \\dfrac{C}{2\\pi}"),
    answerPi
      ? step(`r = \\dfrac{${CLabelPi}}{2\\pi} = ${fmtN(r)} \\text{ cm}`)
      : step(`r = \\dfrac{${Cf}}{2\\pi} = ${fmtN(r)} \\text{ cm}`),
  ] : [
    mStep("Given:", `C = ${CLabel} \\text{ cm}`),
    step("C = \\pi d \\Rightarrow d = \\dfrac{C}{\\pi}"),
    answerPi
      ? step(`d = \\dfrac{${fmtN(d)}\\pi}{\\pi} = ${fmtN(d)} \\text{ cm}`)
      : step(`d = \\dfrac{${Cf}}{\\pi} = ${fmtN(d)} \\text{ cm}`),
  ];

  return {
    kind: "simple",
    display: `Find the ${findWhat}`,
    displayLatex: `\\text{Find the ${findWhat}}`,
    answer: `${ans} cm`, answerLatex: ans, answerSuffix: "cm",
    diagramProps: { type:"circle", given:"circumference", find:findWhat, diameter:d, radius:r, angle, circumferenceLabel: CLabel },
    working,
    key: `circ-L3-C${Cf}-find${findWhat}`, difficulty: level,
  };
};

const generateArea = (
  level: DifficultyLevel,
  allowDecimals: boolean,
  answerPi: boolean,
): CircleQuestion => {
  const angle = randInt(0, 11) * 15;

  if (level === "level1") {
    const r = pickDim(allowDecimals);
    const d = r * 2;
    const A  = PI * r * r;
    const Af = answerPi ? `${fmtN(r*r)}\\pi` : fmt(A, 2);
    const Adisp = answerPi ? `${fmtN(r*r)}π` : fmt(A, 2);
    return {
      kind: "simple", display: "Find the area", displayLatex: "\\text{Find the area}",
      answer: `${Adisp} cm²`, answerLatex: Af, answerSuffix: "cm²",
      diagramProps: { type:"circle", given:"radius", find:"area", diameter:d, radius:r, angle },
      working: [
        mStep("Given:", `r = ${fmtN(r)}`),
        step("A = \\pi r^2"),
        step(`A = \\pi \\times ${fmtN(r)}^2`),
        step(`A = \\pi \\times ${fmtN(r*r)}`),
        answerPi ? step(`A = ${fmtN(r*r)}\\pi \\text{ cm}^2`) : step(`A = ${fmt(A, 2)} \\text{ cm}^2`),
      ],
      key: `area-L1-r${r}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const d = pickDim(allowDecimals);
    const r = d / 2;
    const A  = PI * r * r;
    const Af = answerPi ? `${fmtN(r*r)}\\pi` : fmt(A, 2);
    const Adisp = answerPi ? `${fmtN(r*r)}π` : fmt(A, 2);
    return {
      kind: "simple", display: "Find the area", displayLatex: "\\text{Find the area}",
      answer: `${Adisp} cm²`, answerLatex: Af, answerSuffix: "cm²",
      diagramProps: { type:"circle", given:"diameter", find:"area", diameter:d, radius:r, angle },
      working: [
        mStep("Given:", `d = ${fmtN(d)}`),
        step(`r = d \\div 2 = ${fmtN(d)} \\div 2 = ${fmtN(r)}`),
        step("A = \\pi r^2"),
        step(`A = \\pi \\times ${fmtN(r)}^2 = \\pi \\times ${fmtN(r*r)}`),
        answerPi ? step(`A = ${fmtN(r*r)}\\pi \\text{ cm}^2`) : step(`A = ${fmt(A, 2)} \\text{ cm}^2`),
      ],
      key: `area-L2-d${d}`, difficulty: level,
    };
  }

  // level3 — find radius or diameter given area
  const findWhat: "radius" | "diameter" = Math.random() > 0.5 ? "radius" : "diameter";
  const r  = pickDim(allowDecimals);
  const d  = r * 2;
  const A  = PI * r * r;
  const Af = fmt(A, 2);
  const ALabelPi = `${fmtN(r*r)}\\pi`;
  const ALabel   = answerPi ? `${fmtN(r*r)}π` : Af;
  const ans = findWhat === "radius" ? fmtN(r) : fmtN(d);

  const working = findWhat === "radius" ? [
    mStep("Given:", `A = ${ALabel} \\text{ cm}^2`),
    step("A = \\pi r^2 \\Rightarrow r^2 = \\dfrac{A}{\\pi}"),
    answerPi
      ? step(`r^2 = \\dfrac{${ALabelPi}}{\\pi} = ${fmtN(r*r)}`)
      : step(`r^2 = \\dfrac{${Af}}{\\pi} = ${fmtN(r*r)}`),
    step(`r = \\sqrt{${fmtN(r*r)}} = ${fmtN(r)} \\text{ cm}`),
  ] : [
    mStep("Given:", `A = ${ALabel} \\text{ cm}^2`),
    step("A = \\pi r^2 \\Rightarrow r^2 = \\dfrac{A}{\\pi}"),
    answerPi
      ? step(`r^2 = \\dfrac{${ALabelPi}}{\\pi} = ${fmtN(r*r)}`)
      : step(`r^2 = \\dfrac{${Af}}{\\pi} = ${fmtN(r*r)}`),
    step(`r = \\sqrt{${fmtN(r*r)}} = ${fmtN(r)}`),
    step(`d = 2r = 2 \\times ${fmtN(r)} = ${fmtN(d)} \\text{ cm}`),
  ];

  return {
    kind: "simple",
    display: `Find the ${findWhat}`,
    displayLatex: `\\text{Find the ${findWhat}}`,
    answer: `${ans} cm`, answerLatex: ans, answerSuffix: "cm",
    diagramProps: { type:"circle", given:"area", find:findWhat, diameter:d, radius:r, angle, areaLabel: ALabel },
    working,
    key: `area-L3-A${Af}-find${findWhat}`, difficulty: level,
  };
};

const generateSector = (
  level: DifficultyLevel,
  style: string,        // "mixed" | "area" | "arcLength" | "perimeter"
  allowDecimals: boolean,
  answerPi: boolean,
): CircleQuestion => {
  // Resolve style if mixed
  const resolved: "area" | "arcLength" | "perimeter" = style === "mixed"
    ? (["area", "arcLength", "perimeter"] as const)[randInt(0, 2)]
    : (style as "area" | "arcLength" | "perimeter");

  // Theta per level
  const theta = level === "level1" ? 180 : level === "level2" ? 90 : randInt(1, 359);
  const d = pickDim(allowDecimals, 2, 24);
  const r = d / 2;
  const lvlNum = level === "level1" ? 1 : level === "level2" ? 2 : 3;

  // Compute values
  const frac   = theta / 360;
  const arc    = frac * 2 * PI * r;
  const area   = frac * PI * r * r;
  const perim  = arc + 2 * r;

  // Pi-form numerics
  const arcPiCoeff  = frac * 2 * r;
  const areaPiCoeff = frac * r * r;

  const fmtPi = (c: number) => {
    const rounded = Math.round(c * 1000) / 1000;
    return Number.isInteger(rounded) ? `${rounded}\\pi` : `${fmt(rounded, 2)}\\pi`;
  };
  const fmtPiDisp = (c: number) => {
    const rounded = Math.round(c * 1000) / 1000;
    return Number.isInteger(rounded) ? `${rounded}π` : `${fmt(rounded, 2)}π`;
  };

  const arcAns   = answerPi ? fmtPi(arcPiCoeff)  : fmt(arc, 2);
  const areaAns  = answerPi ? fmtPi(areaPiCoeff) : fmt(area, 2);
  const perimAns = answerPi ? `${fmtPi(arcPiCoeff)} + ${fmtN(2*r)}` : fmt(perim, 2);

  const arcDisp   = answerPi ? fmtPiDisp(arcPiCoeff)  : fmt(arc, 2);
  const areaDisp  = answerPi ? fmtPiDisp(areaPiCoeff) : fmt(area, 2);
  const perimDisp = answerPi ? `${fmtPiDisp(arcPiCoeff)} + ${fmtN(2*r)}` : fmt(perim, 2);

  const thetaFracStr = level === "level1" ? "\\frac{1}{2}" : level === "level2" ? "\\frac{1}{4}" : `\\frac{${theta}}{360}`;

  let displayLatex: string;
  let answerLatex: string;
  let answerSuffix: string;
  let answerDisp: string;
  let working: ReturnType<typeof step>[];

  if (resolved === "area") {
    const label = level === "level1" ? "the semi-circle" : level === "level2" ? "the quarter-circle" : "the sector";
    displayLatex = `\\text{Find the area of ${label}}`;
    answerLatex = areaAns;
    answerSuffix = "cm²";
    answerDisp = areaDisp;
    working = [
      mStep("Given:", `${lvlNum === 1 ? `d = ${fmtN(d)}` : `r = ${fmtN(r)}`}${lvlNum >= 2 && theta !== 90 && theta !== 180 ? `, \\; \\theta = ${theta}°` : ""}`),
      ...(lvlNum === 1 ? [step(`r = d \\div 2 = ${fmtN(d)} \\div 2 = ${fmtN(r)}`)] : []),
      step("A = \\dfrac{\\theta}{360} \\times \\pi r^2"),
      step(`A = ${thetaFracStr} \\times \\pi \\times ${fmtN(r)}^2`),
      answerPi ? step(`A = ${fmtPi(areaPiCoeff)} \\text{ cm}^2`) : step(`A = ${fmt(area, 2)} \\text{ cm}^2`),
    ];
  } else if (resolved === "arcLength") {
    const label = level === "level1" ? "the semi-circle" : level === "level2" ? "the quarter-circle" : "the sector";
    displayLatex = `\\text{Find the arc length of ${label}}`;
    answerLatex = arcAns;
    answerSuffix = "cm";
    answerDisp = arcDisp;
    working = [
      mStep("Given:", `${lvlNum === 1 ? `d = ${fmtN(d)}` : `r = ${fmtN(r)}`}${lvlNum >= 2 && theta !== 90 && theta !== 180 ? `, \\; \\theta = ${theta}°` : ""}`),
      ...(lvlNum === 1 ? [step(`r = d \\div 2 = ${fmtN(d)} \\div 2 = ${fmtN(r)}`)] : []),
      step("\\text{Arc} = \\dfrac{\\theta}{360} \\times 2\\pi r"),
      step(`\\text{Arc} = ${thetaFracStr} \\times 2 \\times \\pi \\times ${fmtN(r)}`),
      answerPi ? step(`\\text{Arc} = ${fmtPi(arcPiCoeff)} \\text{ cm}`) : step(`\\text{Arc} = ${fmt(arc, 2)} \\text{ cm}`),
    ];
  } else {
    const label = level === "level1" ? "the semi-circle" : level === "level2" ? "the quarter-circle" : "the sector";
    displayLatex = `\\text{Find the perimeter of ${label}}`;
    answerLatex = perimAns;
    answerSuffix = "cm";
    answerDisp = perimDisp;
    const straightEdges = lvlNum === 1 ? `d = ${fmtN(d)}` : `2r = ${fmtN(2*r)}`;
    working = [
      mStep("Given:", `${lvlNum === 1 ? `d = ${fmtN(d)}` : `r = ${fmtN(r)}`}${lvlNum >= 2 && theta !== 90 && theta !== 180 ? `, \\; \\theta = ${theta}°` : ""}`),
      ...(lvlNum === 1 ? [step(`r = d \\div 2 = ${fmtN(d)} \\div 2 = ${fmtN(r)}`)] : []),
      step(`\\text{Perimeter} = \\text{arc} + ${lvlNum === 1 ? "d" : "2r"}`),
      step(`\\text{arc} = ${thetaFracStr} \\times 2\\pi r = ${answerPi ? fmtPi(arcPiCoeff) : fmt(arc, 2)}`),
      step(`\\text{Perimeter} = ${answerPi ? fmtPi(arcPiCoeff) : fmt(arc, 2)} + ${straightEdges}`),
      answerPi
        ? step(`\\text{Perimeter} = ${fmtPi(arcPiCoeff)} + ${fmtN(2*r)} \\text{ cm}`)
        : step(`\\text{Perimeter} = ${fmt(perim, 2)} \\text{ cm}`),
    ];
  }

  return {
    kind: "simple",
    display: displayLatex.replace(/\\text\{([^}]*)\}/g, "$1"),
    displayLatex,
    answer: `${answerDisp} cm${resolved === "area" ? "²" : ""}`,
    answerLatex,
    answerSuffix,
    diagramProps: { type: "sector", theta, radius: r, diameter: d, level: lvlNum },
    working,
    key: `sector-${level}-${resolved}-d${d}-θ${theta}`,
    difficulty: level,
  };
};

// ── 8. generateQuestion / generateUniqueQ ─────────────────────────────────────

const generateQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const allowDecimals = variables["decimals"] ?? false;
  const answerPi      = variables["answerPi"] ?? false;

  if (tool === "circumference") return generateCircumference(level, allowDecimals, answerPi);
  if (tool === "area")          return generateArea(level, allowDecimals, answerPi);
  // sectors
  return generateSector(level, dropdownValue || "mixed", allowDecimals, answerPi);
};

const generateUniqueQ = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// END OF TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

void (TogglePill as unknown);
void (SegButtons as unknown);
void (tStep as unknown);

const LV_COLORS: Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};

const getQuestionBg = (cs:string) => ({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg    = (cs:string) => ({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

// ── QuestionDisplay — renders the question title as plain browser text ────────
// Circle titles ("Find the circumference", "Find the area" etc.) are always
// plain prose, never mathematical. Rendering via KaTeX would apply Computer
// Modern font instead of the page font, so we bypass MathRenderer entirely —
// matching the treatment in AnglesInTriangles and other diagram tools.
const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => (
  <div className={`${cls} font-bold text-center`} style={{color:"#000",lineHeight:1.4}}>
    {(q as any).display}
  </div>
);

const InlineMath = ({ text }: { text: string }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span style={{display:"inline"}}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1);
          return <MathRenderer key={i} latex={latex}/>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

void (InlineMath as unknown);

const AnswerDisplay = ({ q, answerFormat: _answerFormat }: { q: AnyQuestion; answerFormat: string }) => {
  const anyQ = q as any;
  if (anyQ.answerLatex) return <><MathRenderer latex={`= ${anyQ.answerLatex}`}/>{anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}</>;
  return <span>= {anyQ.answer ?? ""}</span>;
};

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([ ["level1","Level 1","bg-green-600"], ["level2","Level 2","bg-yellow-500"], ["level3","Level 3","bg-red-600"] ] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] };
  value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => dropdown.useTwoLineButtons ? (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-center flex flex-col items-center justify-center transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          <span className="text-base font-bold leading-tight">{opt.label}</span>
          {opt.sub && <span className={`text-xs mt-0.5 leading-tight ${value === opt.value ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>}
        </button>
      ) : (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const VariablesSection = ({ variables, values, onChange }: {
  variables: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`}/>
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }: {
  variables: { key: string; label: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: null;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const hasContent = variables.length > 0 || dropdown !== null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)}/>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange}/>}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange}/>}
          {!hasContent && <p className="text-sm text-gray-400">No additional options for this tool.</p>}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: {
  toolSettings: typeof TOOL_CONFIG.tools[string];
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
  levelMultiSelect: Record<string, Record<string, boolean>>;
  onLevelMultiSelectChange: (lv: string, k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1","level2","level3"] as DifficultyLevel[];
  const getDDForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  const anyContent = levels.some(lv => getDDForLevel(lv) !== null || (getVarsForLevel(lv)?.length ?? 0) > 0);
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)}/>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {!anyContent
            ? <p className="text-sm text-gray-400">No additional options for this tool.</p>
            : levels.map(lv => {
                const dd = getDDForLevel(lv);
                const vars = getVarsForLevel(lv) ?? [];
                return (
                  <div key={lv} className="flex flex-col gap-2">
                    <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                    <div className="flex flex-col gap-3 pl-1">
                      {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)}/>}
                      {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k,v) => onLevelVariableChange(lv, k, v)}/>}
                      {!dd && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{height:"80vh"}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20}/></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s=>(
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item=>(
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({colorScheme,setColorScheme,onClose,onOpenInfo}:{colorScheme:string;setColorScheme:(s:string)=>void;onClose:()=>void;onOpenInfo:()=>void}) => {
  const [colorOpen,setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{minWidth:"200px"}}>
      <div className="py-1">
        <button onClick={()=>setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen&&(
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s=>(
              <button key={s} onClick={()=>{setColorScheme(s);onClose();}}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}
                {colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={()=>{onOpenInfo();onClose();}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF
// ═══════════════════════════════════════════════════════════════════════════════

const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
  _instruction: string,
) => {
  const FONT_PX   = 14;
  const PAD_MM    = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ  = questions.length;

  // Build SVG string for a question's diagram
  const buildDiagramSvg = (q: AnyQuestion, cellWpx: number): string => {
    const dp = (q as CircleQuestion).diagramProps;
    if (!dp) return "";

    const size  = Math.min(cellWpx * 0.55, 120); // scale diagram to cell
    const r     = size * 0.35;
    const cx    = size / 2;
    const cy    = size / 2;

    if (dp.type === "circle") {
      const aRad  = ((dp.angle ?? 30) * Math.PI) / 180;
      const dEndX = cx + Math.cos(aRad) * r;
      const dEndY = cy + Math.sin(aRad) * r;
      const dStaX = cx - Math.cos(aRad) * r;
      const dStaY = cy - Math.sin(aRad) * r;

      const showDiam = dp.given === "diameter" || dp.find === "diameter";
      const showRad  = dp.given === "radius"   || dp.find === "radius";
      const showCirc = dp.given === "circumference";
      const showArea = dp.given === "area";

      const infoLines: string[] = [];
      if (showDiam) infoLines.push(dp.given === "diameter" ? `d = ${fmtN(dp.diameter!)} cm` : "d = ?");
      if (showRad)  infoLines.push(dp.given === "radius"   ? `r = ${fmtN(dp.radius!)} cm`   : "r = ?");
      if (showCirc) infoLines.push(`C = ${dp.circumferenceLabel} cm`);
      if (showArea) infoLines.push(`A = ${dp.areaLabel} cm\u00b2`);

      const bFontPx = Math.max(10, size * 0.12);
      const bH = bFontPx * 2.0;
      const bGap = bH * 0.18;
      const firstBY = cy + r + size * 0.1;
      const svgH = firstBY + infoLines.length * (bH + bGap) + bGap;

      let lines = "";
      if (showDiam) lines += `<line x1="${dStaX}" y1="${dStaY}" x2="${dEndX}" y2="${dEndY}" stroke="#000" stroke-width="1.5" stroke-dasharray="4,3"/>`;
      if (showRad)  lines += `<line x1="${cx}" y1="${cy}" x2="${dEndX}" y2="${dEndY}" stroke="#000" stroke-width="1.5" stroke-dasharray="4,3"/>`;

      const boxes = infoLines.map((txt, i) => {
        const bY = firstBY + i * (bH + bGap);
        const bW = txt.length * bFontPx * 0.62 + bFontPx * 1.8;
        const bX = (size - bW) / 2;
        return `<rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1" rx="3"/>
<text x="${size/2}" y="${bY + bH/2}" font-size="${bFontPx}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#000">${txt}</text>`;
      }).join("\n");

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${svgH}" viewBox="0 0 ${size} ${svgH}">
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="2" fill="#000"/>
${lines}
${boxes}
</svg>`;
    }

    // sector
    const theta = dp.theta ?? 90;
    let startAngle: number, endAngle: number;
    if (theta === 180) { startAngle = 180; endAngle = 0; }
    else if (theta === 90) { startAngle = -90; endAngle = 0; }
    else { startAngle = -90; endAngle = -90 + theta; }

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sR = toRad(startAngle), eR = toRad(endAngle);
    const sX = cx + Math.cos(sR) * r, sY = cy + Math.sin(sR) * r;
    const eX = cx + Math.cos(eR) * r, eY = cy + Math.sin(eR) * r;
    const largeArc = theta > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${sX} ${sY} A ${r} ${r} 0 ${largeArc} 1 ${eX} ${eY} Z`;

    const lvl   = dp.level ?? 1;
    const isL1  = lvl === 1;
    const dX1   = isL1 ? sX : cx, dY1 = isL1 ? sY : cy;
    const dX2   = isL1 ? eX : sX, dY2 = isL1 ? eY : sY;
    const midX  = (dX1+dX2)/2, midY = (dY1+dY2)/2;
    const ddx   = dX2-dX1, ddy = dY2-dY1;
    const dlen  = Math.sqrt(ddx*ddx+ddy*ddy);
    const ux=ddx/dlen, uy=ddy/dlen, px=-uy, py=ux;
    const aL=8, aW=3;
    const a1x=dX1+ux*aL, a1y=dY1+uy*aL, a2x=dX2-ux*aL, a2y=dY2-uy*aL;

    const labelTxt = isL1 ? `d = ${fmtN(dp.diameter!)} cm` : `r = ${fmtN(dp.radius!)} cm`;
    const infoLines = [labelTxt];
    if (lvl !== 1 && ![90,180,270].includes(theta)) infoLines.push(`θ = ${theta}°`);

    const bFontPx = Math.max(10, size * 0.12);
    const bH = bFontPx * 2.0;
    const bGap = bH * 0.18;
    const firstBY = cy + r + size * 0.1;
    const svgH = firstBY + infoLines.length * (bH + bGap) + bGap;

    const boxes = infoLines.map((txt, i) => {
      const bY = firstBY + i * (bH + bGap);
      const bW = txt.length * bFontPx * 0.62 + bFontPx * 1.8;
      const bX = (size - bW) / 2;
      return `<rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1" rx="3"/>
<text x="${size/2}" y="${bY + bH/2}" font-size="${bFontPx}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#000">${txt}</text>`;
    }).join("\n");

    const centerDot = lvl > 1 ? `<circle cx="${cx}" cy="${cy}" r="2" fill="#2E7D32"/>` : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${svgH}" viewBox="0 0 ${size} ${svgH}">
<path d="${path}" fill="#C8E6C9" stroke="#2E7D32" stroke-width="2"/>
${centerDot}
<line x1="${dX1}" y1="${dY1}" x2="${dX2}" y2="${dY2}" stroke="#000" stroke-width="1.5"/>
<line x1="${dX1}" y1="${dY1}" x2="${a1x+px*aW}" y2="${a1y+py*aW}" stroke="#000" stroke-width="1.5"/>
<line x1="${dX1}" y1="${dY1}" x2="${a1x-px*aW}" y2="${a1y-py*aW}" stroke="#000" stroke-width="1.5"/>
<line x1="${dX2}" y1="${dY2}" x2="${a2x+px*aW}" y2="${a2y+py*aW}" stroke="#000" stroke-width="1.5"/>
<line x1="${dX2}" y1="${dY2}" x2="${a2x-px*aW}" y2="${a2y-py*aW}" stroke="#000" stroke-width="1.5"/>
<text x="${midX}" y="${midY - 10}" font-size="${bFontPx}" font-weight="bold" text-anchor="middle" fill="#000">${labelTxt}</text>
${boxes}
</svg>`;
  };

  const katexSpan = (latex: string) => {
    const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
    return `<span class="katex-render"${frac} data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;
  };

  const pxPerMm = 3.7795;
  const cellW_px = Math.round(cellW_MM * pxPerMm);

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const anyQ = q as any;
    const svgHtml = buildDiagramSvg(q, cellW_px);
    // Title is always plain prose — render as native text, not KaTeX
    const mathHtml = `<div style="text-align:center" class="q-title">${anyQ.display}</div>`;
    const diagramHtml = svgHtml ? `<div style="display:flex;justify-content:center;margin:1mm 0">${svgHtml}</div>` : "";
    let ansHtml = "";
    if (showAnswer) {
      const al = anyQ.answerLatex ? anyQ.answerLatex : `\\text{${anyQ.answer ?? ""}}`;
      const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
      ansHtml = `<div class="q-answer">${katexSpan(`= ${al}`)}${suffix}</div>`;
    }
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    return `${banner}<div class="qbody">${mathHtml}${diagramHtml}${ansHtml}</div>`;
  };

  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: questionToHtml(q, i, true),
    difficulty: q.difficulty,
  }));

  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`
  ).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm; }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }
  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell, .diff-cell { border: 0.3mm solid #d1d5db; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header { height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center; font-size: 3mm; font-weight: 700; border-radius: 1mm; }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  #probe { position: fixed; left: -9999px; top: 0; visibility: hidden; font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4; width: ${cellW_MM}mm; }
  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .q-banner { width: 100%; text-align: center; font-size: ${Math.round(FONT_PX*0.65)}px; font-weight: 700; color: #000; padding: 1mm 0; border-bottom: 0.3mm solid #000; }
  .qbody    { padding: ${PAD_MM*0.4}mm ${PAD_MM}mm ${PAD_MM}mm; text-align: center; flex: 1; }
  .q-title  { font-size: ${FONT_PX}px; font-weight: 700; font-family: "Segoe UI", Arial, sans-serif; display: block; }
  .q-math   { font-size: ${FONT_PX}px; display: inline; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 0.8mm; text-align: center; }
  .katex-render { display: inline-block; vertical-align: baseline; }
  .katex-render .katex { font-size: ${FONT_PX}px; }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";

  var rowHeights = [];
  for (var r = 1; r <= 10; r++) rowHeights.push((usableH - GAP_MM * (r-1)) / r);

  var qData = ${JSON.stringify(qHtmlData)};

  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) { if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight; });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  var diffPerCol = Math.floor(totalQ / 3);
  var diffUsableH = usableH - diffHdrMM - GAP_MM;
  var diffRowsPerPage = 1, diffCellH_mm = diffUsableH;
  for (var rd = 0; rd < diffPerCol; rd++) {
    var rows2 = rd + 1;
    var h = (diffUsableH - GAP_MM * rd) / rows2;
    if (h >= needed_mm - diffHdrMM / rows2) { diffRowsPerPage = rows2; diffCellH_mm = h; }
  }

  var chosenH_mm = rowHeights[0], rowsPerPage = 1, found = false;
  for (var r2 = 0; r2 < rowHeights.length; r2++) {
    var cap = (r2+1) * cols;
    if (cap >= totalQ && rowHeights[r2] >= needed_mm) { chosenH_mm = rowHeights[r2]; rowsPerPage = r2+1; found = true; break; }
  }
  if (!found) for (var r3 = 0; r3 < rowHeights.length; r3++) { if (rowHeights[r3] >= needed_mm) { chosenH_mm = rowHeights[r3]; rowsPerPage = r3+1; } }

  var pages = [];
  if (isDiff) {
    var numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);
    for (var p = 0; p < numDiffPages; p++) pages.push(p);
  } else {
    for (var s = 0; s < qData.length; s += rowsPerPage * cols) pages.push(qData.slice(s, s + rowsPerPage * cols));
  }
  var totalPages = pages.length;

  function makeCellW(c) { return (PAGE_W_MM - GAP_MM * (c-1)) / c; }
  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;"><div class="q-inner">' + inner + '</div></div>';
  }
  function buildGrid(pageData, showAnswer, cH) {
    if (isDiff) {
      var pgIdx = pageData, start = pgIdx * diffRowsPerPage, end = start + diffRowsPerPage;
      var cW = makeCellW(3);
      var lvls = ['level1','level2','level3'], lbls = ['Level 1','Level 2','Level 3'];
      var cols3 = lvls.map(function(lv, li) {
        var lqs = qData.filter(function(q) { return q.difficulty === lv; }).slice(start, end);
        var cells = lqs.map(function(q) { return buildCell(showAnswer ? q.a : q.q, cW, cH, true); }).join('');
        return '<div class="diff-col"><div class="diff-header ' + lv + '">' + lbls[li] + '</div>' + cells + '</div>';
      }).join('');
      return '<div class="diff-grid" style="grid-template-columns:repeat(3,' + cW + 'mm);">' + cols3 + '</div>';
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) { return buildCell(showAnswer ? item.a : item.q, cW, cH, false); }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }
  function buildPage(pageData, showAnswer, pgIdx) {
    var cH  = isDiff ? diffCellH_mm : chosenH_mm;
    var lbl = totalPages > 1
      ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
      : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
    var title = toolName + (showAnswer ? ' — Answers' : '');
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1>'
      + '<div class="meta">' + diffLabel + ' &nbsp;&middot;&nbsp; ' + dateStr + ' &nbsp;&middot;&nbsp; ' + lbl + '</div></div>'
      + buildGrid(pageData, showAnswer, cH) + '</div>';
  }
  var html = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('')
           + pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');
  document.getElementById('pages').innerHTML = html;

  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  probe.remove();
  setTimeout(function() { window.print(); }, 300);
});
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];

  const [currentTool, setCurrentTool] = useState<ToolType>("circumference");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── CONFIG-DRIVEN QO STATE ────────────────────────────────────────────────
  const [toolVariables, setToolVariables] = useState<Record<string,Record<string,boolean>>>(() => {
    const init: Record<string,Record<string,boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      init[k] = {};
      TOOL_CONFIG.tools[k].variables.forEach(v => { init[k][v.key] = v.defaultValue; });
    });
    return init;
  });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const t = TOOL_CONFIG.tools[k];
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string,Record<string,boolean>>>({level1:{},level2:{},level3:{}});
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    const firstTool = "sectors";
    const t = TOOL_CONFIG.tools[firstTool];
    (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
      if (dd) init[lv] = dd.defaultValue;
    });
    return init;
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ── SHARED STATE ─────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("circumference", "level1", {}, "")
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(6);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(50); // wider for diagram tool
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string|null>(null);
  const [camError, setCamError] = useState<string|null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current) videoRef.current.srcObject=null;
  },[]);

  const startCam = useCallback(async (deviceId?:string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId=deviceId;
      if(!targetDeviceId){
        const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        tmp.getTracks().forEach(t=>t.stop());
        const all=await navigator.mediaDevices.enumerateDevices();
        const builtInPattern=/facetime|built.?in|integrated|internal|front|rear/i;
        const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!builtInPattern.test(d.label));
        if(ext) targetDeviceId=ext.deviceId;
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:targetDeviceId?{deviceId:{exact:targetDeviceId}}:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current) videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    } catch(e:unknown){ setCamError((e instanceof Error?e.message:null)??"Camera unavailable"); }
  },[stopStream]);

  useEffect(()=>{ if(presenterMode) startCam(); else stopStream(); },[presenterMode]);
  useEffect(()=>{ if(presenterMode&&streamRef.current&&videoRef.current) videoRef.current.srcObject=streamRef.current; },[wbFullscreen]);
  useEffect(()=>{
    if(!camDropdownOpen) return;
    const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[camDropdownOpen]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme==="default";
  const fsToolbarBg = isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg = isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg  = isDefaultScheme?"#f5f3f0":qBg;

  // Diagram label background — lighter shade matching colour scheme
  const diagramLabelBg = isDefaultScheme ? "#ffffff" : qBg;

  // ── CONFIG-DRIVEN HELPERS ─────────────────────────────────────────────────
  const getToolSettings   = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getDropdownValue  = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue  = (v: string) => setToolDropdowns(p => ({...p, [`${currentTool}__${difficulty}`]: v}));
  const setVariableValue  = (k: string, v: boolean) => setToolVariables(p => ({...p, [currentTool]: {...p[currentTool], [k]: v}}));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({...p, [lv]: {...p[lv], [k]: v}}));
  const handleLevelDDChange  = (lv: string, v: string) => setLevelDropdowns(p => ({...p, [lv]: v}));
  const getInstruction = (_tool = currentTool) => "";  // no instruction text for circle tool
  // ─────────────────────────────────────────────────────────────────────────

  // ── WIRING ────────────────────────────────────────────────────────────────
  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue());

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = {
          ...(toolVariables[currentTool] || {}),
          ...(levelVariables[lv] ?? {}),
        };
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQ(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  const stdQOProps = {
    variables: getVariablesConfig() ?? [],
    variableValues: toolVariables[currentTool] || {},
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig() ?? null,
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
    multiSelect: null as null,
    multiSelectValues: {} as Record<string, boolean>,
    onMultiSelectChange: (_k: string, _v: boolean) => {},
  };
  const diffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
    levelMultiSelect: {} as Record<string, Record<string, boolean>>,
    onLevelMultiSelectChange: (_lv: string, _k: string, _v: boolean) => {},
  };
  const qoEl = (isDiff = false) => isDiff
    ? <DiffQOPopover {...diffQOProps}/>
    : <StandardQOPopover {...stdQOProps}/>;
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);

  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  const fontSizes = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length-1;
  const canDecrease = worksheetFontSize > 0;

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string, levelFill?: string) => {
    const bg  = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const cellStyle = {backgroundColor:bg, height:"100%", boxSizing:"border-box" as const, position:"relative" as const};
    const numEl = <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>;

    const anyQ = q as any;
    const diagSize = 180 + worksheetFontSize * 20;

    return (
      <div className="rounded-lg p-3" style={cellStyle}>
        {numEl}
        <div className="pt-5 flex flex-col items-center gap-1 w-full">
          {/* Question title — plain text, not KaTeX */}
          <div className={`${fsz} font-bold text-center w-full`} style={{color:"#000"}}>
            {anyQ.display}
          </div>
          {/* Diagram */}
          <CircleDiagram dp={(q as CircleQuestion).diagramProps} size={diagSize} isWorksheet={true} levelFill={levelFill ?? bg}/>
          {/* Answer */}
          {showWorksheetAnswers && (
            <div className={`${fsz} font-semibold text-center`} style={{color:"#059669"}}>
              {anyQ.answerLatex
                ? <><MathRenderer latex={`= ${anyQ.answerLatex}`}/>{anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}</>
                : <span>= {anyQ.answer}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if(mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
              <button key={val} onClick={()=>{setDifficulty(val as DifficultyLevel);setIsDifferentiated(false);}}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={()=>setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="12" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(12,parseInt(e.target.value)||6)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="3" value={isDifferentiated ? 3 : numColumns}
              onChange={e=>{ if(!isDifferentiated) setNumColumns(Math.max(1,Math.min(3,parseInt(e.target.value)||2))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18}/> Generate
          </button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}
            </button>
            <button onClick={()=>handlePrint(worksheet,TOOL_CONFIG.tools[currentTool].name,difficulty,isDifferentiated,numColumns,getInstruction())}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
              <Printer size={18}/> Print / PDF
            </button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{backgroundColor:qBg}}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18}/> New Question
            </button>
            <button onClick={()=>mode==="whiteboard"?setShowWhiteboardAnswer(!showWhiteboardAnswer):setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {(mode==="whiteboard"?showWhiteboardAnswer:showAnswer)?"Hide Answer":"Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ────────────────────────────────────────────────────────────
  // For this diagram tool the question box is wider (480px) and contains both
  // the question text and the circle/sector diagram.  The right panel is the
  // camera/working space as usual.
  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        {qoEl()}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    const fontBtnStyle = (enabled: boolean) => ({
      background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
      cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: enabled ? 1 : 0.35,
    });

    // Diagram size for whiteboard based on current display font size
    const wbDiagramSize = 240 + displayFontSize * 20;

    const questionBox = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div className="rounded-xl flex flex-col items-center justify-center flex-shrink-0 p-6 gap-4" style={{position:"relative",width:"520px",height:"100%",backgroundColor:stepBg,overflowY:"auto"}}>
          {fontControls}
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          <CircleDiagram dp={(currentQuestion as CircleQuestion).diagramProps} size={wbDiagramSize} labelBg={diagramLabelBg} isWorksheet={false}/>
          {showWhiteboardAnswer && (
            <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
              <AnswerDisplay q={currentQuestion} answerFormat=""/>
            </div>
          )}
        </div>
      );
    };

    const questionBoxFS = () => {
      const fontControls = (
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)} title="Increase font size"><ChevronUp size={16} color="#6b7280"/></button>
        </div>
      );
      return (
        <div style={{position:"relative",width:`${splitPct}%`,height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:24}}>
          {fontControls}
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          <CircleDiagram dp={(currentQuestion as CircleQuestion).diagramProps} size={wbDiagramSize} labelBg={isDefaultScheme?"#ffffff":qBg} isWorksheet={false}/>
          {showWhiteboardAnswer && (
            <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
              <AnswerDisplay q={currentQuestion} answerFormat=""/>
            </div>
          )}
        </div>
      );
    };

    const makeRightPanel = (isFS: boolean) => (
      <div style={{flex:1,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&(
          <><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          {camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>
        )}
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          {presenterMode?(
            <div style={{position:"relative"}} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
                onMouseDown={()=>{didLongPress.current=false;longPressTimer.current=setTimeout(()=>{didLongPress.current=true;setCamDropdownOpen(o=>!o);},500);}}
                onMouseUp={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);if(!didLongPress.current)setPresenterMode(false);}}
                onMouseLeave={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);}}
                style={{background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.75)")}
              ><Video size={16} color="rgba(255,255,255,0.85)"/></button>
              {camDropdownOpen&&(
                <div style={{position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30}}>
                  <div style={{padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Camera</div>
                  {camDevices.map((d,i)=>(
                    <div key={d.deviceId} onClick={()=>{setCamDropdownOpen(false);if(d.deviceId!==currentCamId)startCam(d.deviceId);}}
                      style={{padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    ><div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>{d.label||`Camera ${i+1}`}</div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setPresenterMode(true)} title="Visualiser mode"
              style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.15)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(0,0,0,0.08)")}
            ><Video size={16} color="#6b7280"/></button>
          )}
          <button onClick={()=>setWbFullscreen(f=>!f)} title={wbFullscreen?"Exit Fullscreen":"Fullscreen"}
            style={{background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:presenterMode?"1px solid rgba(255,255,255,0.15)":"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:presenterMode?"blur(6px)":"none"}}
            onMouseEnter={e=>(e.currentTarget.style.background=wbFullscreen?"#1f2937":(presenterMode?"rgba(0,0,0,0.75)":"rgba(0,0,0,0.15)"))}
            onMouseLeave={e=>(e.currentTarget.style.background=wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"))}
          >{wbFullscreen?<Minimize2 size={16} color="#ffffff"/>:<Maximize2 size={16} color={presenterMode?"rgba(255,255,255,0.85)":"#6b7280"}/>}</button>
        </div>
      </div>
    );

    if(wbFullscreen) return (
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div ref={splitContainerRef} style={{flex:1,display:"flex",minHeight:0}}>
          {questionBoxFS()}
          <div
            style={{position:"relative",width:2,backgroundColor:"#000",flexShrink:0,cursor:"col-resize"}}
            onMouseDown={e => {
              isDraggingRef.current = true;
              const onMove = (ev: MouseEvent) => {
                if (!isDraggingRef.current || !splitContainerRef.current) return;
                const rect = splitContainerRef.current.getBoundingClientRect();
                let pct = ((ev.clientX - rect.left) / rect.width) * 100;
                pct = Math.min(75, Math.max(25, pct));
                if (pct >= 48 && pct <= 52) pct = 50;
                setSplitPct(pct);
              };
              const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
              e.preventDefault();
            }}
          >
            <div style={{position:"absolute",top:0,bottom:0,left:-5,width:12,cursor:"col-resize"}}/>
          </div>
          {makeRightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"480px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>
          {questionBox()}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8 w-full" style={{backgroundColor:qBg}}>
        <div className="text-center py-4 relative">
          <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
            <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayDecrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayDecrease?1:0.35}} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
            <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayIncrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayIncrease?1:0.35}} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
          </div>
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          <div className="flex justify-center mt-6">
            <CircleDiagram dp={(currentQuestion as CircleQuestion).diagramProps} size={280 + displayFontSize*20} labelBg={diagramLabelBg} isWorksheet={false}/>
          </div>
        </div>
        {showAnswer&&(
          <>
            <div className="space-y-4 mt-8">
              {currentQuestion.working.map((s,i)=>(
                <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                  <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>Step {i+1}</h4>
                  <div className="text-2xl" style={{color:"#000"}}>
                    {s.type === "tStep"
                      ? <span>{s.plain}</span>
                      : s.type === "mStep"
                        ? <><span>{s.label} </span><MathRenderer latex={s.latex}/>{s.unit && <span> {s.unit}</span>}</>
                        : <MathRenderer latex={s.latex}/>
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
              <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                <AnswerDisplay q={currentQuestion} answerFormat=""/>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if(worksheet.length===0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={()=>canDecrease&&setWorksheetFontSize(f=>f-1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canIncrease} onClick={()=>canIncrease&&setWorksheetFontSize(f=>f+1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if(isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li)=>{
            const lqs=worksheet.filter(q=>q.difficulty===lv);
            const c=LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr",gridAutoRows:"1fr",gap:"0.75rem"}}>
                  {lqs.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx,c.fill,c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem"}}>
          {worksheet.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={()=>{ window.location.href="/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24}/><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={()=>setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen?<X size={28}/>:<Menu size={28}/>}
            </button>
            {isMenuOpen&&<MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={()=>setIsMenuOpen(false)} onOpenInfo={()=>setIsInfoOpen(true)}/>}
          </div>
        </div>
      </div>
      {isInfoOpen&&<InfoModal onClose={()=>setIsInfoOpen(false)}/>}
      <div className="min-h-screen p-8" style={{backgroundColor:"#f5f3f0"}}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{color:"#000"}}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-6"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k=>(
              <button key={k} onClick={()=>setCurrentTool(k)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool===k?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setPresenterMode(false);setWbFullscreen(false);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode==="worksheet"&&<>{renderControlBar()}{renderWorksheet()}</>}
          {mode!=="worksheet"&&(
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">
                {renderControlBar()}
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode==="whiteboard"&&renderWhiteboard()}
                {mode==="single"&&renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
