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

// Level 3 dresses the points as real places and mixes the wording.
const PLACES = ["Shop", "Park", "School", "Church", "Port", "Farm", "Tower", "Bank", "Camp", "Pier", "Mill", "Dock", "Beach", "Hotel", "Cave"];

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
      { label: "'A from B'", detail: "The instruction tells you where to stand and where to look. 'The bearing of A from B' means: stand at B, face North, and turn clockwise until you point at A — that turn is the bearing. So the point after 'from' is where you measure FROM." },
      { label: "Identifying the bearing", detail: "This tool is about identifying and drawing the correct angle for a given instruction. Find the point you measure from, start at its North line, and mark the clockwise turn to the other point. Reveal the answer to see the angle drawn on." },
    ],
  },
  {
    title: "Levels", icon: "📈",
    content: [
      { label: "Level 1", detail: "Two points. Decode an instruction like 'A from B' (or 'B from A'), then identify and draw on the correct bearing. Bearings are to the nearest 5°." },
      { label: "Level 2", detail: "Three connected points (a route). Identify a bearing along either leg — forwards or as a back bearing along the path." },
      { label: "Level 3", detail: "Real-place contexts with mixed wording, e.g. 'the bearing of the Shop from the Park' and 'the bearing from the Park to the Shop'. Read carefully to spot which place you measure from." },
      { label: "Bearing Size", detail: "Use the Question Options to focus on bearings less than 180° (less than half a turn) or more than 180° (the long way round, past South), or mix both." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "A single large diagram with space to work. Reveal the answer to draw the bearing on." },
      { label: "Worked Example", detail: "Talks through identifying and drawing the bearing step by step." },
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
  // Level 1: two points (letters). Level 2: three points (letters, a route).
  // Level 3: three points dressed as places, with mixed "from / to" wording.
  const threePoint = level !== "level1";
  const usePlaces = level === "level3";
  const step = 5;   // bearings to the nearest 5° at every level (for measuring later)
  // which bearing sizes are allowed
  let ranges: QOVars = { under180: !!vars.under180, over180: !!vars.over180 };
  if (!ranges.under180 && !ranges.over180) ranges = { under180: true, over180: true };

  const labels = usePlaces
    ? [...PLACES].sort(() => Math.random() - 0.5).slice(0, 3)
    : threePoint ? ["A", "B", "C"] : ["A", "B"];

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

  // Name used in the sentence: places get a "the" article; letters stay bare.
  const nm = (lbl: string) => usePlaces ? `the ${lbl}` : lbl;
  const fromN = nm(fromLabel), toN = nm(toLabel);
  // Level 3 mixes two equivalent phrasings; both mean "stand at fromN, look to toN".
  let prompt: string;
  if (usePlaces) {
    prompt = rnd(0, 1) === 0
      ? `What is the bearing of ${toN} from ${fromN}?`
      : `What is the bearing from ${fromN} to ${toN}?`;
  } else {
    prompt = `Find the bearing of ${toN} from ${fromN}`;
  }

  const working: { text: string }[] = [
    { text: `'Bearing of ${toN} from ${fromN}' means: stand at ${fromN} and look towards ${toN}.` },
    { text: `Start at the North line at ${fromN} and turn clockwise until you reach ${toN}.` },
    { text: "Bearings are written with three figures, e.g. 045°." },
  ];
  if (value > 180) working.push({ text: "This bearing is more than 180°, so it turns more than halfway round (past South)." });
  working.push({ text: `Bearing of ${toN} from ${fromN} = ${pad3(value)}°.` });

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

  // approximate label box half-extents in world units (place names are wider)
  const labHalfW = (i: number) => Math.max(15, q.points[i].label.length * 8.5);
  const labHalfH = 14;
  // push a label further from its point when the word is wide, so it clears cleanly
  const labDist = (i: number) => LABEL_DIST + Math.max(0, labHalfW(i) - 15) * 0.75;

  // Place each point's label at the candidate direction (tried all round the
  // point) that sits furthest from every line, other point and already-placed
  // label — with a gentle downward bias so labels favour sitting below the point,
  // as in a textbook. This clears the North lines and connecting edges cleanly.
  const obstacles: [Pt, Pt][] = [];
  q.edges.forEach(([a, b]) => obstacles.push([pts[a], pts[b]]));
  pts.forEach(p => obstacles.push([p, { x: p.x, y: p.y - NORTH_LEN }]));   // North lines
  const placed: { c: Pt; hw: number }[] = [];
  const labelPositions = pts.map((p, i) => {
    const dist = labDist(i), hw = labHalfW(i);
    let best: Pt = { x: p.x, y: p.y + dist }, bestScore = -Infinity;
    for (let deg = 0; deg < 360; deg += 10) {
      const cand = polar(p.x, p.y, dist, deg);
      let score = Infinity;
      // clearance from lines, measured to the near edge of the label box
      obstacles.forEach(([a, b]) => { score = Math.min(score, pointSegDist(cand, a, b) - hw * 0.5); });
      pts.forEach((o, j) => { if (j !== i) score = Math.min(score, Math.hypot(cand.x - o.x, cand.y - o.y) - hw * 0.5); });
      placed.forEach(pl => { score = Math.min(score, Math.hypot(cand.x - pl.c.x, cand.y - pl.c.y) - (hw + pl.hw) * 0.5); });
      score += Math.sin(toRad(deg)) * 4;   // small preference for below the point
      if (score > bestScore) { bestScore = score; best = cand; }
    }
    placed.push({ c: best, hw });
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
  labelPositions.forEach((l, i) => { ext.push([l.x - labHalfW(i), l.y - labHalfH], [l.x + labHalfW(i), l.y + labHalfH]); });

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
