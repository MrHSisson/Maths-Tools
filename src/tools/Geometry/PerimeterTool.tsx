import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  tStep,
} from "../../shared";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Perimeter",
  tools: {
    polygons: {
      name: "Polygons",
      instruction: "Find the perimeter:",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { dropdown: null, variables: [] },
        level2: { dropdown: null, variables: [] },
        level3: {
          dropdown: null,
          variables: [
            { key: "mixUnits", label: "Mixed units (cm, mm, m)", defaultValue: true },
          ],
        },
      },
    },
    rectilinear: {
      name: "Rectilinear Shapes",
      instruction: "Find the perimeter:",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { dropdown: null, variables: [] },
        level2: {
          dropdown: null,
          variables: [
            { key: "missing1", label: "1 side missing", defaultValue: false },
            { key: "missing2", label: "2 sides missing", defaultValue: false },
          ],
        },
        level3: { dropdown: null, variables: [] },
      },
    },
  },
};

type ToolKey = "polygons" | "rectilinear";

// ─── INFO SECTIONS ────────────────────────────────────────────────────────────
const INFO_SECTIONS: InfoSection[] = [
  { title: "Polygons — Level 1", icon: "⬡", content: [
    { label: "Overview", detail: "Regular polygons where all sides are equal. Find the perimeter by multiplying the side length by the number of sides." },
    { label: "Shapes",   detail: "Equilateral triangle, square, regular pentagon, hexagon, and octagon." },
  ]},
  { title: "Polygons — Level 2", icon: "△", content: [
    { label: "Overview", detail: "Irregular polygons with two groups of equal sides. Use tick marks to identify equal sides." },
    { label: "Shapes",   detail: "Rectangle, isosceles triangle, parallelogram, and rhombus." },
  ]},
  { title: "Polygons — Level 3", icon: "🔀", content: [
    { label: "Overview", detail: "Same shapes as Level 2 by default, with mixed units (cm, mm, and m) — convert all measurements to cm first, then find the perimeter." },
    { label: "Mixed units toggle", detail: "Turn off 'Mixed units' to get Level 3's wider shape pool with clean, cm-only measurements instead." },
  ]},
  { title: "Rectilinear Shapes — Level 1", icon: "⬜", content: [
    { label: "Overview", detail: "All side lengths are given. Add them all together to find the perimeter." },
  ]},
  { title: "Rectilinear Shapes — Level 2", icon: "🔲", content: [
    { label: "Overview", detail: "One or two side lengths are missing. Use opposite sides of a rectilinear shape to derive the missing lengths before finding the perimeter." },
    { label: "Options",  detail: "Toggle '1 side missing' or '2 sides missing' in Question Options to control how many sides are hidden." },
  ]},
  { title: "Rectilinear Shapes — Level 3", icon: "📐", content: [
    { label: "Overview", detail: "All sides shown but measurements use mixed units (cm, mm, m). Convert everything to cm before summing." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Single large question with a full-width diagram to model on." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "Grid of questions with differentiated 3-column layout and PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Differentiated", detail: "Shows all three levels side-by-side in the worksheet, each column independently configurable." },
    { label: "Rectilinear L2", detail: "Toggle whether 1 or 2 sides are hidden in Level 2 rectilinear questions." },
  ]},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function rnd(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
type Pt = [number, number];

function pointInPoly(px: number, py: number, pts: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}

function centroid(pts: Pt[]): Pt {
  let cx = 0, cy = 0;
  pts.forEach(p => { cx += p[0]; cy += p[1]; });
  return [cx / pts.length, cy / pts.length];
}

// ─── PILL PLACEMENT ───────────────────────────────────────────────────────────
interface PillMeta {
  mx: number; my: number;
  isH: boolean; outDir: number; standoff: number;
  pw: number; ph: number;
  txt: string; color: string;
}

function pillCandidates(mx: number, my: number, isH: boolean, outDir: number, standoff: number): Pt[] {
  const D = standoff, D45 = D / Math.sqrt(2);
  if (isH) return [[mx, my + outDir * D], [mx + D45, my + outDir * D45], [mx - D45, my + outDir * D45]];
  else      return [[mx + outDir * D, my], [mx + outDir * D45, my + D45], [mx + outDir * D45, my - D45]];
}

function choosePillPositions(labels: PillMeta[]): Pt[] {
  const n = labels.length; if (!n) return [];
  const candidates = labels.map(l => pillCandidates(l.mx, l.my, l.isH, l.outDir, l.standoff));

  function pillMinDist(ax: number, ay: number, pwa: number, pha: number,
                       bx: number, by: number, pwb: number, phb: number): number {
    const dx = Math.abs(ax - bx) - (pwa + pwb) / 2;
    const dy = Math.abs(ay - by) - (pha + phb) / 2;
    return Math.max(0, Math.min(dx < 0 ? dy : (dy < 0 ? dx : Math.sqrt(dx * dx + dy * dy)), 9999));
  }

  function score(assign: number[]): number {
    let minD = Infinity;
    for (let a = 0; a < n; a++) {
      const [ax, ay] = candidates[a][assign[a]];
      for (let b = a + 1; b < n; b++) {
        const [bx, by] = candidates[b][assign[b]];
        const d = pillMinDist(ax, ay, labels[a].pw, labels[a].ph, bx, by, labels[b].pw, labels[b].ph);
        if (d < minD) minD = d;
      }
    }
    return minD;
  }

  let best = new Array<number>(n).fill(0), bs = -Infinity;
  const assign = new Array<number>(n).fill(0);
  for (let t = 0; t < Math.pow(3, n); t++) {
    let tmp = t;
    for (let i = 0; i < n; i++) { assign[i] = tmp % 3; tmp = Math.floor(tmp / 3); }
    const s = score(assign); if (s > bs) { bs = s; best = [...assign]; }
  }
  return best.map((ci, i) => candidates[i][ci] as Pt);
}

// ─── LABEL PILL SVG ───────────────────────────────────────────────────────────
interface LabelPillProps { x: number; y: number; text: string; fontSize: number; color: string; pw: number; ph: number; }
function LabelPill({ x, y, text, fontSize, color, pw, ph }: LabelPillProps) {
  return (
    <g>
      <rect x={x - pw / 2} y={y - ph / 2} width={pw} height={ph} rx={ph / 2}
        fill="white" stroke="#6b7280" strokeWidth="1.5" opacity="0.95" />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fontWeight="bold" fill={color}>{text}</text>
    </g>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// POLYGON DATA & QUESTION GENERATION
// ══════════════════════════════════════════════════════════════════════════════
type ShapeKey =
  | "equilateral_triangle" | "square" | "regular_pentagon"
  | "regular_hexagon" | "regular_octagon" | "rectangle"
  | "isosceles_triangle" | "parallelogram" | "rhombus";

interface ShapeDef { name: string; sides: number; groups: number[][]; }

const POLY_SHAPES: Record<ShapeKey, ShapeDef> = {
  equilateral_triangle: { name: "Equilateral Triangle", sides: 3, groups: [[0, 1, 2]] },
  square:               { name: "Square",               sides: 4, groups: [[0, 1, 2, 3]] },
  regular_pentagon:     { name: "Regular Pentagon",     sides: 5, groups: [[0, 1, 2, 3, 4]] },
  regular_hexagon:      { name: "Regular Hexagon",      sides: 6, groups: [[0, 1, 2, 3, 4, 5]] },
  regular_octagon:      { name: "Regular Octagon",      sides: 8, groups: [[0, 1, 2, 3, 4, 5, 6, 7]] },
  rectangle:            { name: "Rectangle",            sides: 4, groups: [[0, 2], [1, 3]] },
  isosceles_triangle:   { name: "Isosceles Triangle",   sides: 3, groups: [[0, 2], [1]] },
  parallelogram:        { name: "Parallelogram",        sides: 4, groups: [[0, 2], [1, 3]] },
  rhombus:              { name: "Rhombus",              sides: 4, groups: [[0, 1, 2, 3]] },
};

const L1_SHAPES: ShapeKey[] = ["equilateral_triangle", "square", "regular_pentagon", "regular_hexagon", "regular_octagon"];
const L2_SHAPES: ShapeKey[] = ["rectangle", "isosceles_triangle", "parallelogram", "rhombus"];

interface DisplayEdge { display: string; baseCm: number; unit: "cm" | "mm" | "m"; }
interface WorkStep { text: string; }

interface PolyQuestion {
  kind: "poly";
  shapeKey: ShapeKey;
  def: ShapeDef;
  rawPts: Pt[];
  edges: number[];
  groupVals: number[];
  perimeter: number;
  answer: string;
  working: WorkStep[];
  labelledIdx: number[];
  displayEdges: (DisplayEdge | null)[] | null;
  level: string;
  mixUnits: boolean;
  id: number;
}

interface RectQuestion {
  kind: "rect";
  pts: Pt[];
  edges: number[];
  hiddenIdx: number[];
  perimeter: number;
  answer: string;
  working: WorkStep[];
  mixedEdges: DisplayEdge[] | null;
  level: string;
  derivs?: { hi: number; val: number; dir: string }[];
  templateIdx: number;
  id: number;
}

type PerimeterQuestion = PolyQuestion | RectQuestion;

// ─── Polygon raw points ───────────────────────────────────────────────────────
function polyRawPts(key: ShapeKey, n: number, groupVals: number[]): Pt[] {
  if (key === "rectangle") {
    const w = groupVals[0], h = groupVals[1];
    return [[0, 0], [w, 0], [w, h], [0, h]];
  }
  if (key === "parallelogram") {
    const w = groupVals[0], h = groupVals[1], sh = h * 0.4;
    return [[sh, 0], [sh + w, 0], [w, h], [0, h]];
  }
  if (key === "isosceles_triangle") {
    const leg = groupVals[0], base = groupVals[1];
    const h = Math.sqrt(Math.max(1, leg * leg - (base / 2) * (base / 2)));
    return [[base / 2, 0], [base, h], [0, h]];
  }
  if (key === "rhombus") {
    const s = groupVals[0];
    return [[s * 0.5, 0], [s, s * 0.6], [s * 0.5, s * 1.2], [0, s * 0.6]];
  }
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  return pts;
}

// mixUnits: driven by the Level 3 "Mixed units" toggle (default on) rather than
// hardcoded to the level, so switching it off gives Level 3's wider shape pool
// with clean cm-only measurements instead.
function buildPolyQ(level: DifficultyLevel, vars: Record<string, boolean>, shapeKey: ShapeKey | null = null): PolyQuestion {
  const mixUnits = level === "level3" && (vars.mixUnits ?? true);
  const pool = level === "level3" ? [...L1_SHAPES, ...L2_SHAPES] : level === "level1" ? L1_SHAPES : L2_SHAPES;
  const key: ShapeKey = shapeKey ?? pool[Math.floor(Math.random() * pool.length)];
  const def = POLY_SHAPES[key];
  const n = def.sides;
  let groupVals = def.groups.map(() => rnd(3, 20));
  if (["rectangle", "parallelogram"].includes(key)) {
    let att = 0;
    while (Math.abs(groupVals[0] - groupVals[1]) < 3 && att++ < 20)
      groupVals = def.groups.map(() => rnd(3, 20));
    if (Math.abs(groupVals[0] - groupVals[1]) < 3)
      groupVals[1] = groupVals[0] >= 18 ? groupVals[0] - 5 : groupVals[0] + 5;
  }
  if (key === "isosceles_triangle") {
    const isValid = (leg: number, base: number) => {
      if (base >= 2 * leg) return false;
      const h = Math.sqrt(leg * leg - (base / 2) * (base / 2));
      return (h / base) >= 0.4;
    };
    let att = 0;
    while (!isValid(groupVals[0], groupVals[1]) && att++ < 50)
      groupVals = def.groups.map(() => rnd(4, 16));
    if (!isValid(groupVals[0], groupVals[1])) {
      const leg = rnd(8, 14);
      const maxBase = Math.floor(Math.min(leg * 1.2, 2 * leg - 1));
      groupVals = [leg, rnd(Math.max(4, Math.ceil(leg * 0.5)), maxBase)];
    }
  }
  const edges: number[] = Array(n);
  def.groups.forEach((grp, gi) => grp.forEach(i => { edges[i] = groupVals[gi]; }));
  const perimeter = edges.reduce((s, e) => s + e, 0);
  const rawPts = polyRawPts(key, n, groupVals);
  const labelledIdx = def.groups.map(g => g[0]);
  let displayEdges: (DisplayEdge | null)[] | null = null;
  const work: WorkStep[] = [];

  if (mixUnits) {
    const useM = Math.random() < 0.4;
    displayEdges = edges.map((e, i) => {
      if (!labelledIdx.includes(i)) return null;
      if (Math.random() < 0.45) {
        if (useM) { const m = e / 100; return { display: `${Number.isInteger(m) ? m : m.toFixed(2)} m`, baseCm: e, unit: "m" as const }; }
        return { display: `${e * 10} mm`, baseCm: e, unit: "mm" as const };
      }
      return { display: `${e} cm`, baseCm: e, unit: "cm" as const };
    });
    const hasConv = displayEdges.some(d => d && d.unit !== "cm");
    if (hasConv) {
      work.push({ text: "Convert all measurements to centimetres:" });
      displayEdges.forEach(d => {
        if (!d) return;
        if (d.unit === "mm") work.push({ text: `${d.display} = ${d.baseCm} cm  (÷ 10)` });
        else if (d.unit === "m") work.push({ text: `${d.display} = ${d.baseCm} cm  (× 100)` });
      });
    }
    def.groups.forEach((grp, gi) => { work.push({ text: `${def.name} has ${grp.length} side${grp.length > 1 ? "s" : ""} of ${groupVals[gi]} cm` }); });
    work.push({ text: `Perimeter = ${def.groups.map((g, gi) => `${g.length} × ${groupVals[gi]}`).join(" + ")}` });
    work.push({ text: `Perimeter = ${def.groups.map((g, gi) => g.length * groupVals[gi]).join(" + ")}` });
    work.push({ text: `Perimeter = ${perimeter} cm` });
  } else if (level === "level1") {
    work.push({ text: `${def.name}: all ${n} sides are equal` });
    work.push({ text: `Each side = ${groupVals[0]} cm` });
    work.push({ text: `Perimeter = ${n} × ${groupVals[0]}` });
    work.push({ text: `Perimeter = ${perimeter} cm` });
  } else {
    def.groups.forEach((grp, gi) => { work.push({ text: `${def.name} has ${grp.length} side${grp.length > 1 ? "s" : ""} of ${groupVals[gi]} cm` }); });
    work.push({ text: `Perimeter = ${def.groups.map((g, gi) => `${g.length} × ${groupVals[gi]}`).join(" + ")}` });
    work.push({ text: `Perimeter = ${def.groups.map((g, gi) => g.length * groupVals[gi]).join(" + ")}` });
    work.push({ text: `Perimeter = ${perimeter} cm` });
  }
  return { kind: "poly", shapeKey: key, def, rawPts, edges, groupVals, perimeter, answer: `${perimeter} cm`, working: work, labelledIdx, displayEdges, level, mixUnits, id: Math.floor(Math.random() * 1_000_000) };
}

// ─── Rectilinear templates ────────────────────────────────────────────────────
const RECT_TEMPLATES: Array<() => Pt[]> = [
  () => { const w = rnd(10, 17), h = rnd(12, 19), cw = rnd(4, 7), ch = rnd(5, 8); return [[0, 0], [w, 0], [w, ch], [cw, ch], [cw, h], [0, h]]; },
  () => { const tw = rnd(16, 22), th = rnd(4, 7), sw = rnd(5, 8), sh = rnd(7, 12), lm = Math.floor((tw - sw) / 2); return [[0, 0], [tw, 0], [tw, th], [lm + sw, th], [lm + sw, th + sh], [lm, th + sh], [lm, th], [0, th]]; },
  () => { const s1 = rnd(5, 8), s2 = rnd(5, 8), s3 = rnd(5, 8), h1 = rnd(3, 5), h2 = rnd(3, 5), h3 = rnd(3, 5); return [[0, 0], [s1, 0], [s1, h1], [s1 + s2, h1], [s1 + s2, h1 + h2], [s1 + s2 + s3, h1 + h2], [s1 + s2 + s3, h1 + h2 + h3], [0, h1 + h2 + h3]]; },
  () => { const ow = rnd(14, 19), oh = rnd(11, 16), wt = rnd(3, 5), ih = rnd(5, 8); return [[0, 0], [ow, 0], [ow, oh], [ow - wt, oh], [ow - wt, ih], [wt, ih], [wt, oh], [0, oh]]; },
  () => { const lw = rnd(3, 5), rw = rnd(3, 5), gap = rnd(5, 9), lh = rnd(12, 18), rh = rnd(5, Math.max(6, lh - 5)), totalW = lw + gap + rw, stepH = lh - rh; return [[0, 0], [totalW, 0], [totalW, rh], [totalW - rw, rh], [totalW - rw, stepH], [lw, stepH], [lw, lh], [0, lh]]; },
  () => { const spW = rnd(3, 5), spH = rnd(14, 20), a1W = rnd(6, 10), a1H = rnd(3, 4), a2W = rnd(5, 9), a2H = rnd(3, 4), a1Y = rnd(1, 3), a2Y = a1Y + a1H + rnd(3, 5); if (a2Y + a2H >= spH - 1) return [[0, 0], [spW + a1W, 0], [spW + a1W, a1H], [spW, a1H], [spW, spH], [0, spH]]; return [[0, 0], [spW + a1W, 0], [spW + a1W, a1H], [spW, a1H], [spW, a2Y], [spW + a2W, a2Y], [spW + a2W, a2Y + a2H], [spW, a2Y + a2H], [spW, spH], [0, spH]]; },
  () => { const ow = rnd(14, 20), oh = rnd(13, 19), lwt = rnd(3, 5), rwt = rnd(3, 5), lih = rnd(5, oh - 5), rih = rnd(5, oh - 5), innerFloor = Math.min(lih, rih); return [[0, 0], [ow, 0], [ow, oh], [ow - rwt, oh], [ow - rwt, innerFloor], [lwt, innerFloor], [lwt, oh], [0, oh]]; },
  () => { const cw = rnd(4, 6), ch = rnd(4, 6), aT = rnd(3, 5), aB = rnd(3, 5), aL = rnd(4, 7), aR = rnd(4, 7); return [[aL, 0], [aL + cw, 0], [aL + cw, aT], [aL + cw + aR, aT], [aL + cw + aR, aT + ch], [aL + cw, aT + ch], [aL + cw, aT + ch + aB], [aL, aT + ch + aB], [aL, aT + ch], [0, aT + ch], [0, aT], [aL, aT]]; },
];

function pickHidden(pts: Pt[], count: number): number[] {
  const h: number[] = [], v: number[] = [];
  pts.forEach((p, i) => { const nb = pts[(i + 1) % pts.length]; (p[1] === nb[1] ? h : v).push(i); });
  if (count === 1) { const pool = [...h, ...v]; return [pool[Math.floor(Math.random() * pool.length)]]; }
  return [h[Math.floor(Math.random() * h.length)], v[Math.floor(Math.random() * v.length)]];
}

function deriveHidden(pts: Pt[], edges: number[], hi: number): number {
  const p1 = pts[hi], p2 = pts[(hi + 1) % pts.length], isH = p1[1] === p2[1];
  let total = 0, known = 0;
  pts.forEach((p, i) => {
    const nb = pts[(i + 1) % pts.length], h = p[1] === nb[1];
    if (h === isH) { total += edges[i]; if (i !== hi) known += edges[i]; }
  });
  return total - known;
}

function makeMixed(edges: number[]): DisplayEdge[] {
  const useM = Math.random() < 0.4;
  return edges.map(e => {
    if (Math.random() < 0.4) {
      if (useM) { const m = e / 100; return { display: `${Number.isInteger(m) ? m : m.toFixed(2)} m`, baseCm: e, unit: "m" as const }; }
      return { display: `${e * 10} mm`, baseCm: e, unit: "mm" as const };
    }
    return { display: `${e} cm`, baseCm: e, unit: "cm" as const };
  });
}

// The same box the worksheet-cell (small) RectDiagram sizes into — extracted so
// _aspect (used by handleDiagramPrint) can never drift from the actual rendering.
const RECT_SMALL_PAD = 52, RECT_SMALL_DRAW = 220;
function rectSmallWH(pts: Pt[]): { W: number; H: number } {
  const maxX = Math.max(...pts.map(p => p[0])), maxY = Math.max(...pts.map(p => p[1]));
  const sc = Math.min(RECT_SMALL_DRAW / maxX, RECT_SMALL_DRAW / maxY);
  return { W: maxX * sc + RECT_SMALL_PAD * 2, H: maxY * sc + RECT_SMALL_PAD * 2 };
}

function buildRectQ(level: DifficultyLevel, vars: Record<string, boolean>, templateIdx: number | null = null): RectQuestion {
  const idx = templateIdx ?? Math.floor(Math.random() * RECT_TEMPLATES.length);
  const pts = RECT_TEMPLATES[idx]();
  const edges = pts.map((p, i) => { const nb = pts[(i + 1) % pts.length]; return Math.abs(nb[0] - p[0]) + Math.abs(nb[1] - p[1]); });
  const perimeter = edges.reduce((s, e) => s + e, 0);

  if (level === "level1") {
    return { kind: "rect", pts, edges, hiddenIdx: [], perimeter, answer: `${perimeter} cm`, working: [{ text: "Add all edge lengths:" }, { text: `Perimeter = ${edges.join(" + ")}` }, { text: `Perimeter = ${perimeter} cm` }], mixedEdges: null, level, templateIdx: idx, id: Math.floor(Math.random() * 1_000_000) };
  }
  if (level === "level2") {
    const hc = vars.missing2 ? 2 : vars.missing1 ? 1 : (Math.random() < 0.5 ? 1 : 2);
    const hidden = pickHidden(pts, hc);
    const derivs = hidden.map(hi => {
      const val = deriveHidden(pts, edges, hi);
      const p1 = pts[hi], p2 = pts[(hi + 1) % pts.length];
      const dir = p1[1] === p2[1] ? "horizontal" : "vertical";
      return { hi, val, dir };
    });
    const work: WorkStep[] = [];
    derivs.forEach(({ hi, val, dir }) => {
      const known = edges.filter((_, i) => {
        const p = pts[i], nb = pts[(i + 1) % pts.length];
        return (p[1] === nb[1]) === (pts[hi][1] === pts[(hi + 1) % pts.length][1]) && i !== hi;
      });
      work.push({ text: `Find the missing ${dir} edge:` });
      work.push({ text: `Known ${dir} edges: ${known.join(" + ")} = ${known.reduce((s, v) => s + v, 0)} cm` });
      work.push({ text: `Missing edge = ${val} cm` });
    });
    const full = edges.map((e, i) => { const d = derivs.find(d => d.hi === i); return d ? d.val : e; });
    work.push({ text: `Perimeter = ${full.join(" + ")}` });
    work.push({ text: `Perimeter = ${perimeter} cm` });
    return { kind: "rect", pts, edges, hiddenIdx: hidden, perimeter, answer: `${perimeter} cm`, working: work, mixedEdges: null, level, derivs, templateIdx: idx, id: Math.floor(Math.random() * 1_000_000) };
  }
  // level3 — mixed units
  const mixed = makeMixed(edges);
  const work: WorkStep[] = [{ text: "Convert all measurements to centimetres:" }];
  mixed.forEach((m, i) => {
    if (m.unit === "mm") work.push({ text: `Edge ${i + 1}: ${m.display} = ${m.baseCm} cm  (÷ 10)` });
    else if (m.unit === "m") work.push({ text: `Edge ${i + 1}: ${m.display} = ${m.baseCm} cm  (× 100)` });
  });
  work.push({ text: `Perimeter = ${edges.join(" + ")}` });
  work.push({ text: `Perimeter = ${perimeter} cm` });
  return { kind: "rect", pts, edges, hiddenIdx: [], perimeter, answer: `${perimeter} cm`, working: work, mixedEdges: mixed, level, templateIdx: idx, id: Math.floor(Math.random() * 1_000_000) };
}

// ─── Question title (shown nowhere by the shell itself — kept for parity with
// the tool's own diagrams, which is where per-shape context now lives) ────────
function questionTitle(q: PerimeterQuestion): string {
  if (q.kind === "poly") return `Find the perimeter of the ${q.def.name.toLowerCase()}`;
  return "Find the perimeter";
}

// ─── generateQuestion ─────────────────────────────────────────────────────────
function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
): AnyQuestion {
  const t = tool as ToolKey;
  const d: PerimeterQuestion = t === "polygons" ? buildPolyQ(level, variables) : buildRectQ(level, variables);
  let aspect: number | undefined;
  if (d.kind === "rect") { const { W, H } = rectSmallWH(d.pts); aspect = W / H; }

  return {
    kind: "simple",
    display: questionTitle(d),
    answer: d.answer,
    working: d.working.map(w => tStep(w.text)),
    key: `${t}-${level}-${d.id}`,
    difficulty: level,
    _diagram: d,
    ...(aspect !== undefined ? { _aspect: aspect } : {}),
  } as unknown as AnyQuestion;
}

// ══════════════════════════════════════════════════════════════════════════════
// POLYGON DIAGRAM
// ══════════════════════════════════════════════════════════════════════════════
interface PolyDiagramProps { q: PolyQuestion; showAnswer: boolean; small?: boolean; fillBox?: boolean; dataIndex?: number; }

function PolyDiagram({ q, showAnswer, small = false, fillBox = false, dataIndex }: PolyDiagramProps) {
  const diag = small ? 150 : 360;
  const pad  = small ? 48  : 78;
  const fs   = small ? Math.max(9, 10) : 19;
  const standoff = small ? 20 : 44;

  const raw = q.rawPts;
  const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const spanX = Math.max(...xs) - x0 || 1, spanY = Math.max(...ys) - y0 || 1;
  const sc = diag / Math.max(spanX, spanY);
  const offX = (diag - spanX * sc) / 2, offY = (diag - spanY * sc) / 2;
  const pts: Pt[] = raw.map(([x, y]) => [(x - x0) * sc + pad + offX, (y - y0) * sc + pad + offY]);
  const W = diag + pad * 2, H = diag + pad * 2;
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";
  const [cx, cy] = centroid(pts);
  const charW = fs * 0.62, pillPad = fs * 0.8;

  const labelledMeta: PillMeta[] = q.labelledIdx.map(i => {
    const p = pts[i], nb = pts[(i + 1) % pts.length];
    const mx = (p[0] + nb[0]) / 2, my = (p[1] + nb[1]) / 2;
    const dx = mx - cx, dy = my - cy;
    const isH = Math.abs(p[1] - nb[1]) < 5;
    const outDir = isH ? Math.sign(dy) || 1 : Math.sign(dx) || 1;
    const adaptive = standoff + Math.max(0, (diag * 0.22 - Math.sqrt(dx * dx + dy * dy)) * 0.45);
    const txt = (q.mixUnits && q.displayEdges?.[i] && !showAnswer) ? q.displayEdges[i]!.display : `${q.edges[i]} cm`;
    const pw = txt.length * charW + pillPad * 2, ph = fs * 1.5;
    return { mx, my, isH, outDir, standoff: adaptive, pw, ph, txt, color: "#065f46" };
  });
  const positions = choosePillPositions(labelledMeta);

  const renderTicks = () => q.def.groups.map((grp, gi) => grp.map(ei => {
    const [ax, ay] = pts[ei], [bx, by] = pts[(ei + 1) % pts.length];
    const mx2 = (ax + bx) / 2, my2 = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len;
    const tl = 8, ts = 5, count = gi + 1;
    return Array.from({ length: count }, (_, ti) => {
      const o = (ti - (count - 1) / 2) * ts;
      return <line key={`${gi}-${ei}-${ti}`}
        x1={mx2 + px * (-tl / 2) + py * o} y1={my2 + py * (-tl / 2) - px * o}
        x2={mx2 + px * (tl / 2) + py * o}  y2={my2 + py * (tl / 2) - px * o}
        stroke="#065f46" strokeWidth={1.5} />;
    });
  }));

  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible", width: "100%", height: fillBox ? "100%" : "auto" }} {...extraProps}>
      <path d={pathD} fill="#d1fae5" stroke="#065f46" strokeWidth={small ? 2 : 3} />
      {renderTicks()}
      {q.labelledIdx.map(i => {
        const p = pts[i], nb = pts[(i + 1) % pts.length];
        return <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={nb[0]} y2={nb[1]} stroke="#10b981" strokeWidth={small ? 3 : 4} opacity={0.4} />;
      })}
      {positions.map((pos, ri) => {
        const l = labelledMeta[ri];
        return (
          <g key={`l${ri}`}>
            <line x1={l.mx} y1={l.my} x2={pos[0]} y2={pos[1]} stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4,3" />
            <LabelPill x={pos[0]} y={pos[1]} text={l.txt} fontSize={fs} color={l.color} pw={l.pw} ph={l.ph} />
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECTILINEAR DIAGRAM
// ══════════════════════════════════════════════════════════════════════════════
function edgeOutDir(sPts: Pt[], i: number): number {
  const p1 = sPts[i], p2 = sPts[(i + 1) % sPts.length];
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const isH = Math.abs(p1[1] - p2[1]) < 0.01;
  if (isH) return pointInPoly(mx, my + 4, sPts) ? -1 : 1;
  else     return pointInPoly(mx + 4, my, sPts) ? -1 : 1;
}

interface RectDiagramProps { q: RectQuestion; showAnswer: boolean; small?: boolean; fillBox?: boolean; dataIndex?: number; }

function RectDiagram({ q, showAnswer, small = false, fillBox = false, dataIndex }: RectDiagramProps) {
  const maxX = Math.max(...q.pts.map(p => p[0])), maxY = Math.max(...q.pts.map(p => p[1]));
  const fs       = small ? Math.max(9, 11) : 18;
  const standoff = small ? 18 : 40;
  const pad      = small ? RECT_SMALL_PAD : Math.max(90, standoff + 50);
  const maxDrawW = small ? RECT_SMALL_DRAW : 560;
  const maxDrawH = small ? RECT_SMALL_DRAW : 480;
  const sc = Math.min(maxDrawW / maxX, maxDrawH / maxY);
  const W = maxX * sc + pad * 2, H = maxY * sc + pad * 2;
  const sPts: Pt[] = q.pts.map(p => [p[0] * sc + pad, p[1] * sc + pad]);
  const pathD = sPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";
  const charW = fs * 0.60, pillPad = fs * 0.85;

  const labelMeta: (PillMeta & { hilit: string })[] = sPts.map((p, i) => {
    const nb = sPts[(i + 1) % sPts.length];
    const mx2 = (p[0] + nb[0]) / 2, my2 = (p[1] + nb[1]) / 2;
    const isH = Math.abs(p[1] - nb[1]) < 0.01;
    const outDir = edgeOutDir(sPts, i);
    const hidden = q.hiddenIdx.includes(i) && !showAnswer;
    const txt = hidden ? "?" : (q.mixedEdges && !showAnswer ? q.mixedEdges[i].display : `${q.edges[i]} cm`);
    const color = hidden ? "#d97706" : "#1e40af";
    const hilit = hidden ? "#fbbf24" : "#6366f1";
    const pw = txt.length * charW + pillPad * 2, ph = fs * 1.6;
    return { mx: mx2, my: my2, isH, outDir, standoff, pw, ph, txt, color, hilit };
  });
  const positions = choosePillPositions(labelMeta);

  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible", width: "100%", height: fillBox ? "100%" : "auto" }} {...extraProps}>
      <path d={pathD} fill="#e0e7ff" stroke="#4f46e5" strokeWidth={small ? 2 : 3} />
      {sPts.map((p, i) => { const nb = sPts[(i + 1) % sPts.length]; return <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={nb[0]} y2={nb[1]} stroke={labelMeta[i].hilit} strokeWidth={small ? 3 : 4} opacity={0.35} />; })}
      {positions.map((pos, i) => {
        const l = labelMeta[i];
        return (
          <g key={`l${i}`}>
            <line x1={l.mx} y1={l.my} x2={pos[0]} y2={pos[1]} stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4,3" />
            <LabelPill x={pos[0]} y={pos[1]} text={l.txt} fontSize={fs} color={l.color} pw={l.pw} ph={l.ph} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Unified diagram renderer ─────────────────────────────────────────────────
interface DiagramProps { q: PerimeterQuestion; showAnswer: boolean; small?: boolean; fillBox?: boolean; dataIndex?: number; }
function ShapeDiagram({ q, showAnswer, small, fillBox, dataIndex }: DiagramProps) {
  if (q.kind === "poly") return <PolyDiagram q={q} showAnswer={showAnswer} small={small} fillBox={fillBox} dataIndex={dataIndex} />;
  return <RectDiagram q={q} showAnswer={showAnswer} small={small} fillBox={fillBox} dataIndex={dataIndex} />;
}

// ─── questionRenderer ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number, qo?: any): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (q as any)._diagram as PerimeterQuestion | undefined;
  if (!d) return null;

  // Worksheet cell — diagram only; the shell appends "= answer" below on reveal.
  if (compact === true) {
    return (
      <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <ShapeDiagram q={d} showAnswer={showAnswer} small dataIndex={idx} fillBox />
      </div>
    );
  }

  // Whiteboard (embedded or fullscreen) shows the title and, on reveal, the
  // answer beside it — worked example gets its own answer card from the shell,
  // so the inline one is suppressed there to avoid showing the answer twice.
  const isWhiteboard = compact === undefined || qo?.fullscreen === true;
  const maxW = compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      {isWhiteboard && (
        <div className="text-center mb-4">
          <span className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>{questionTitle(d)}</span>
          {showAnswer && (
            <span className="text-2xl font-bold ml-3" style={{ color: "#166534" }}>= {d.answer}</span>
          )}
        </div>
      )}
      <ShapeDiagram q={d} showAnswer={showAnswer} small={false} dataIndex={idx} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      customPrintHandler={handleDiagramPrint}
      defaults={{ numQuestions: 9, numColumns: 3, maxColumns: 4, hideFontControls: true }}
    />
  );
}
