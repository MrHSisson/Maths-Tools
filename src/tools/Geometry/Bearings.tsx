import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type ToolMultiSelect,
  tStep,
} from "../../shared";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Pt { x: number; y: number; }

interface BearingQuestion {
  tool: string;
  level: string;
  difficulty?: string;
  key?: string;
  points: { p: Pt; label: string }[];
  edges: [number, number][];   // indices into points — the drawn lines
  fromIdx: number;             // vertex the bearing is measured from
  toIdx: number;               // point the bearing is measured to
  value: number;               // the bearing (0–359), measured clockwise from North
  prompt: string;              // "Find the bearing of B from A"
  answer: string;
  working: { text: string }[];
  id: number;
}
type QOVars = Record<string, boolean>;

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const RANGE_MS: ToolMultiSelect = {
  key: "range", label: "Bearing Size",
  options: [
    { value: "under180", label: "Less than 180°", defaultActive: true },
    { value: "over180", label: "More than 180°", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Bearings",
  tools: {
    identify: {
      name: "Identify a Bearing",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [RANGE_MS] },
        level2: { variables: [], multiSelect: [RANGE_MS] },
        level3: { variables: [], multiSelect: [RANGE_MS] },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Bearings", icon: "🧭",
    content: [
      { label: "What is a bearing?", detail: "A bearing describes a direction. It is the angle, measured clockwise, from the North line at one point round to another point." },
      { label: "Three figures", detail: "Bearings are always written with three figures, so 45° is written 045° and 5° is written 005°. This keeps them unambiguous on a map or compass." },
      { label: "How to read one", detail: "Put your protractor on the point you are measuring FROM, with 0° on its North line. Turn clockwise until you reach the line to the other point and read off the angle." },
    ],
  },
  {
    title: "Levels", icon: "📈",
    content: [
      { label: "Level 1", detail: "Two points, bearings to the nearest 10°. Read the bearing of one point from the other straight off the diagram." },
      { label: "Level 2", detail: "Two points, bearings to the nearest 5° across the full range, including bearings greater than 180°." },
      { label: "Level 3", detail: "Three connected points (a route). Identify the bearing along one of the legs — either forwards or backwards along the path." },
      { label: "Bearing Size", detail: "Use the Question Options to focus on bearings less than 180° (less than half a turn) or more than 180° (more than half a turn), or mix both." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "A single large diagram with space to work. Reveal the answer to show the measured bearing." },
      { label: "Worked Example", detail: "Talks through measuring the bearing step by step." },
      { label: "Worksheet", detail: "A grid of diagrams with differentiated layout and PDF export." },
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function toRad(d: number) { return d * Math.PI / 180; }
const norm360 = (a: number) => ((a % 360) + 360) % 360;
// three-figure bearing, e.g. 45 → "045", 5 → "005", 120 → "120"
const pad3 = (n: number) => String(norm360(n)).padStart(3, "0");
// unit direction of a bearing in screen coords (North = up = −y)
function bearingDir(b: number): Pt { return { x: Math.sin(toRad(b)), y: -Math.cos(toRad(b)) }; }

// A bearing is valid to use as a leg if it is not straight up/down (0/180/360),
// which would make the North line and the path overlap.
function niceLeg(step: number): number {
  for (let i = 0; i < 200; i++) {
    const b = rnd(1, Math.floor(359 / step)) * step;
    if (b % 180 !== 0) return b;
  }
  return 70;
}

function inRange(value: number, ranges: QOVars): boolean {
  const under = value > 0 && value < 180;
  if (under) return !!ranges.under180;
  return !!ranges.over180;
}

// ─── LAYOUT CONSTANTS (world units) ───────────────────────────────────────────
const NORTH_LEN = 88;         // length of each North line (shortened for cleaner diagrams)
const ARC_R = 42;
const ARC_LABEL_OFF = 26;
const LABEL_DIST = 30;
const N_LABEL_GAP = 16;
const PAD = 30;
const PROMPT_BAND = 78;
const REF = 520;

// shortest distance from point p to the segment a→b
function pointSegDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// A layout is "clean" when no North line passes too close to another point, no
// two points sit on top of each other, and no drawn edge grazes a non-endpoint
// point — the collisions that make bearing diagrams look messy.
function layoutIsClean(points: { p: Pt }[], edges: [number, number][]): boolean {
  const pts = points.map(pp => pp.p);
  // extend the tested North line past its tip to cover the "N" label sitting above it
  const northTip = (p: Pt): Pt => ({ x: p.x, y: p.y - NORTH_LEN - N_LABEL_GAP - 8 });
  for (let i = 0; i < pts.length; i++) {
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < 96) return false;
      // point j (and its letter label) must clear point i's North line + "N" label
      if (pointSegDist(pts[j], pts[i], northTip(pts[i])) < 40) return false;
    }
  }
  for (const [a, b] of edges) {
    for (let k = 0; k < pts.length; k++) {
      if (k === a || k === b) continue;
      if (pointSegDist(pts[k], pts[a], pts[b]) < 34) return false;
    }
    // An edge that leaves a vertex within ~20° of due North runs alongside that
    // vertex's North line — the cramped look. Reject it (checking both ends).
    const bAB = norm360(Math.atan2(pts[b].x - pts[a].x, pts[a].y - pts[b].y) * 180 / Math.PI);
    const bBA = norm360(bAB + 180);
    const nearNorth = (x: number) => x < 20 || x > 340;
    if (nearNorth(bAB) || nearNorth(bBA)) return false;
  }
  return true;
}

// ─── QUESTION GENERATION ────────────────────────────────────────────────────
function buildQuestion(tool: string, level: string, vars: QOVars): BearingQuestion {
  const threePoint = level === "level3";
  const step = level === "level1" ? 10 : 5;
  // which bearing sizes are allowed
  let ranges: QOVars = { under180: !!vars.under180, over180: !!vars.over180 };
  if (!ranges.under180 && !ranges.over180) ranges = { under180: true, over180: true };

  const labels = threePoint ? ["A", "B", "C"] : ["P", "Q"];

  // Build the geometry (a traverse) and enumerate the directed bearings we could
  // ask about — one per direction along each drawn leg. Keep trying until at
  // least one candidate falls inside an allowed size band.
  let points: { p: Pt; label: string }[] = [];
  let edges: [number, number][] = [];
  let candidates: { fromIdx: number; toIdx: number; value: number }[] = [];

  for (let att = 0; att < 400; att++) {
    const b1 = niceLeg(step);
    const len0 = rnd(150, 230);
    const p0: Pt = { x: 0, y: 0 };
    const p1: Pt = { x: p0.x + len0 * bearingDir(b1).x, y: p0.y + len0 * bearingDir(b1).y };

    if (threePoint) {
      // second leg bends clearly away from the first so the route is not a straight line
      const turnMag = rnd(40, 150);
      const b2 = norm360(b1 + (rnd(0, 1) === 0 ? turnMag : -turnMag));
      if (b2 % 180 === 0) continue;
      const len1 = rnd(150, 230);
      const p2: Pt = { x: p1.x + len1 * bearingDir(b2).x, y: p1.y + len1 * bearingDir(b2).y };
      points = [{ p: p0, label: labels[0] }, { p: p1, label: labels[1] }, { p: p2, label: labels[2] }];
      edges = [[0, 1], [1, 2]];
      candidates = [
        { fromIdx: 0, toIdx: 1, value: b1 },
        { fromIdx: 1, toIdx: 0, value: norm360(b1 + 180) },
        { fromIdx: 1, toIdx: 2, value: b2 },
        { fromIdx: 2, toIdx: 1, value: norm360(b2 + 180) },
      ];
    } else {
      points = [{ p: p0, label: labels[0] }, { p: p1, label: labels[1] }];
      edges = [[0, 1]];
      candidates = [
        { fromIdx: 0, toIdx: 1, value: b1 },
        { fromIdx: 1, toIdx: 0, value: norm360(b1 + 180) },
      ];
    }

    const allowed = candidates.filter(c => inRange(c.value, ranges));
    if (allowed.length && layoutIsClean(points, edges)) { candidates = allowed; break; }
    candidates = [];
  }
  if (!candidates.length) {
    // safe fallback — a simple two-point diagram
    const p0: Pt = { x: 0, y: 0 }, p1: Pt = { x: 130, y: -60 };
    points = [{ p: p0, label: labels[0] }, { p: p1, label: labels[1] }];
    edges = [[0, 1]];
    candidates = [{ fromIdx: 0, toIdx: 1, value: 65 }];
  }

  const chosen = candidates[rnd(0, candidates.length - 1)];
  const fromLabel = points[chosen.fromIdx].label;
  const toLabel = points[chosen.toIdx].label;
  const value = chosen.value;

  const prompt = `Find the bearing of ${toLabel} from ${fromLabel}`;
  const working: { text: string }[] = [
    { text: "A bearing is measured clockwise from the North line." },
    { text: "Bearings are always written with three figures, e.g. 045°." },
    { text: `Measure the angle at ${fromLabel}, clockwise from North round to ${toLabel}.` },
  ];
  if (value > 180) working.push({ text: "This bearing is more than 180°, so it turns more than halfway round." });
  working.push({ text: `Bearing of ${toLabel} from ${fromLabel} = ${pad3(value)}°.` });

  return {
    tool, level,
    points, edges,
    fromIdx: chosen.fromIdx, toIdx: chosen.toIdx, value,
    prompt,
    answer: `${pad3(value)}°`,
    working,
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const vars: QOVars = { ...variables, ...(multiSelectValues ?? {}) };
  const q = buildQuestion(tool, level, vars);
  q.difficulty = level;
  q.key = `${q.tool}-${level}-${q.fromIdx}-${q.toIdx}-${q.value}-${q.id}`;
  return {
    kind: "simple",
    display: q.prompt,
    answer: q.answer,
    working: q.working.map(w => tStep(w.text)),
    key: q.key,
    difficulty: level,
    _diagram: q,
  } as unknown as AnyQuestion;
}

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number): Pt {
  return { x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) };
}

// Sector (filled wedge) and arc-only path for a bearing measured clockwise from
// North. In screen coords (y down) a positive sweep is clockwise; North is −90°.
function sectorPath(cx: number, cy: number, r: number, sweepDeg: number): string {
  const s = polar(cx, cy, r, -90);
  const e = polar(cx, cy, r, -90 + sweepDeg);
  const large = Math.abs(sweepDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}
function arcOnlyPath(cx: number, cy: number, r: number, sweepDeg: number): string {
  const s = polar(cx, cy, r, -90);
  const e = polar(cx, cy, r, -90 + sweepDeg);
  const large = Math.abs(sweepDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface DiagramProps { q: BearingQuestion; showAnswer: boolean; dataIndex?: number; }

function BearingDiagram({ q, showAnswer, dataIndex }: DiagramProps) {
  const pts = q.points.map(pp => pp.p);
  const from = pts[q.fromIdx];

  // Place each point's letter label at the candidate direction (tried all round
  // the point) that sits furthest from every line, other point and already-placed
  // label — with a gentle downward bias so labels favour sitting below the point,
  // as in a textbook. This clears the North lines and connecting edges cleanly.
  const obstacles: [Pt, Pt][] = [];
  q.edges.forEach(([a, b]) => obstacles.push([pts[a], pts[b]]));
  pts.forEach(p => obstacles.push([p, { x: p.x, y: p.y - NORTH_LEN }]));   // North lines
  const placed: Pt[] = [];
  const labelPositions = pts.map((p, i) => {
    let best: Pt = { x: p.x, y: p.y + LABEL_DIST }, bestScore = -Infinity;
    for (let deg = 0; deg < 360; deg += 15) {
      const cand = polar(p.x, p.y, LABEL_DIST, deg);
      let score = Infinity;
      obstacles.forEach(([a, b]) => { score = Math.min(score, pointSegDist(cand, a, b)); });
      pts.forEach((o, j) => { if (j !== i) score = Math.min(score, Math.hypot(cand.x - o.x, cand.y - o.y)); });
      placed.forEach(pl => { score = Math.min(score, Math.hypot(cand.x - pl.x, cand.y - pl.y)); });
      score += Math.sin(toRad(deg)) * 7;   // small preference for below the point
      if (score > bestScore) { bestScore = score; best = cand; }
    }
    placed.push(best);
    return best;
  });

  // bearing value label sits on the bisector of the swept sector, just outside it
  const midDeg = -90 + q.value / 2;
  const valLabelPos = polar(from.x, from.y, ARC_R + ARC_LABEL_OFF, midDeg);

  // ── bounding box over everything that gets drawn ──
  const ext: number[][] = [];
  pts.forEach(p => {
    ext.push([p.x, p.y]);
    ext.push([p.x, p.y - NORTH_LEN - N_LABEL_GAP]);   // North tip + N label
  });
  ext.push([from.x - ARC_R - ARC_LABEL_OFF, from.y - ARC_R - ARC_LABEL_OFF]);
  ext.push([from.x + ARC_R + ARC_LABEL_OFF, from.y + ARC_R + ARC_LABEL_OFF]);
  ext.push([valLabelPos.x - 22, valLabelPos.y - 16], [valLabelPos.x + 22, valLabelPos.y + 16]);
  labelPositions.forEach(l => { ext.push([l.x - 16, l.y - 14], [l.x + 16, l.y + 14]); });

  const minX = Math.min(...ext.map(e => e[0])) - PAD;
  const maxX = Math.max(...ext.map(e => e[0])) + PAD;
  const minY = Math.min(...ext.map(e => e[1])) - PAD - PROMPT_BAND;   // reserve top space for the prompt
  const maxY = Math.max(...ext.map(e => e[1])) + PAD;

  const w = maxX - minX, h = maxY - minY;
  const side = Math.max(w, h);
  const cx = (minX + maxX) / 2, cyBox = (minY + maxY) / 2;
  const vbX = cx - side / 2, vbY = cyBox - side / 2;

  const k = side / REF;
  const edgeStroke = 3 * k;
  const northStroke = 2.6 * k;
  const arcStroke = 3.6 * k;
  const dotR = 4.2 * k;
  const arrow = 11 * k;
  const fontLabel = 27 * k;
  const fontN = 22 * k;
  const fontVal = 27 * k;

  // prompt font scaled to fit the width
  let fontPrompt = 25 * k;
  const promptW = q.prompt.length * fontPrompt * 0.52;
  if (promptW > side * 0.92) fontPrompt *= (side * 0.92) / promptW;

  const NORTH_COL = "#dc2626";
  const LINE_COL = "#1e293b";
  const ARC_COL = "#059669";
  const LABEL_COL = "#111827";

  const NorthArrow = ({ p }: { p: Pt }) => {
    const tipY = p.y - NORTH_LEN;
    return (
      <g>
        <line x1={p.x} y1={p.y} x2={p.x} y2={tipY} stroke={NORTH_COL} strokeWidth={northStroke} strokeLinecap="round" />
        <polygon
          points={`${p.x},${tipY - arrow} ${p.x - arrow * 0.55},${tipY + arrow * 0.4} ${p.x + arrow * 0.55},${tipY + arrow * 0.4}`}
          fill={NORTH_COL}
        />
        <text x={p.x} y={tipY - arrow - fontN * 0.55} textAnchor="middle" dominantBaseline="middle"
          fontSize={fontN} fontWeight="700" fill={NORTH_COL}>N</text>
      </g>
    );
  };

  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg
      viewBox={`${vbX} ${vbY} ${side} ${side}`}
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
      preserveAspectRatio="xMidYMid meet"
      {...extraProps}
    >
      {/* prompt */}
      <text x={cx} y={vbY + Math.max(fontPrompt * 1.1, side * 0.055)} textAnchor="middle" dominantBaseline="middle"
        fontSize={fontPrompt} fontWeight="700" fill={LABEL_COL}>{q.prompt}</text>

      {/* connecting lines */}
      {q.edges.map(([a, b], i) => (
        <line key={`e${i}`} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          stroke={LINE_COL} strokeWidth={edgeStroke} strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* bearing arc — revealed with the answer */}
      {showAnswer && (
        <g>
          <path d={sectorPath(from.x, from.y, ARC_R, q.value)} fill={ARC_COL} fillOpacity="0.16" stroke="none" />
          <path d={arcOnlyPath(from.x, from.y, ARC_R, q.value)} fill="none" stroke={ARC_COL} strokeWidth={arcStroke} strokeLinecap="round" />
          <text x={valLabelPos.x} y={valLabelPos.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={fontVal} fontWeight="800" fill={ARC_COL}>{pad3(q.value)}°</text>
        </g>
      )}

      {/* North arrows */}
      {pts.map((p, i) => <NorthArrow key={`n${i}`} p={p} />)}

      {/* point dots + letter labels */}
      {pts.map((p, i) => <circle key={`d${i}`} cx={p.x} cy={p.y} r={dotR} fill={LABEL_COL} />)}
      {q.points.map((pp, i) => (
        <text key={`l${i}`} x={labelPositions[i].x} y={labelPositions[i].y} textAnchor="middle" dominantBaseline="middle"
          fontSize={fontLabel} fontWeight="700" fill={LABEL_COL}>{pp.label}</text>
      ))}
    </svg>
  );
}

// ─── RENDERER ─────────────────────────────────────────────────────────────────
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number): JSX.Element | null => {
  const d = (q as any)._diagram as BearingQuestion | undefined;
  if (!d) return null;
  if (compact === true) {
    return (
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <BearingDiagram q={d} showAnswer={showAnswer} dataIndex={idx} />
      </div>
    );
  }
  const maxW = compact === undefined ? 360 : 520;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <BearingDiagram q={d} showAnswer={showAnswer} dataIndex={idx} />
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      customPrintHandler={handleDiagramPrint}
      defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true, collapseWorkingByDefault: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2", "level3"] };
