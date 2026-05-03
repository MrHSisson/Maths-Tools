import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG = {
  pageTitle: "Perimeter",
  tools: {
    polygons: {
      name: "Polygons",
      difficultySettings: {
        level1: {
          dropdown: null,
          variables: [],
        },
        level2: {
          dropdown: null,
          variables: [],
        },
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
      difficultySettings: {
        level1: {
          dropdown: null,
          variables: [],
        },
        level2: {
          dropdown: null,
          variables: [
            { key: "missing1", label: "1 side missing", defaultValue: false },
            { key: "missing2", label: "2 sides missing", defaultValue: false },
          ],
        },
        level3: {
          dropdown: null,
          variables: [],
        },
      },
    },
  },
} as const;

type ToolKey = keyof typeof TOOL_CONFIG.tools;

// ─── INFO SECTIONS ────────────────────────────────────────────────────────────
const INFO_SECTIONS = [
  {
    title: "Polygons — Level 1", icon: "⬡",
    content: [
      { label: "Overview",        detail: "Regular polygons where all sides are equal. Find the perimeter by multiplying the side length by the number of sides." },
      { label: "Shapes",          detail: "Equilateral triangle, square, regular pentagon, hexagon, and octagon." },
    ],
  },
  {
    title: "Polygons — Level 2", icon: "△",
    content: [
      { label: "Overview",        detail: "Irregular polygons with two groups of equal sides. Use tick marks to identify equal sides." },
      { label: "Shapes",          detail: "Rectangle, isosceles triangle, parallelogram, and rhombus." },
    ],
  },
  {
    title: "Polygons — Level 3", icon: "🔀",
    content: [
      { label: "Overview",        detail: "Same shapes as Level 2 but with mixed units (cm, mm, and m). Convert all measurements to cm first, then find the perimeter." },
    ],
  },
  {
    title: "Rectilinear Shapes — Level 1", icon: "⬜",
    content: [
      { label: "Overview",        detail: "All side lengths are given. Add them all together to find the perimeter." },
    ],
  },
  {
    title: "Rectilinear Shapes — Level 2", icon: "🔲",
    content: [
      { label: "Overview",        detail: "One or two side lengths are missing. Use opposite sides of a rectilinear shape to derive the missing lengths before finding the perimeter." },
      { label: "Options",         detail: "Toggle '1 side missing' or '2 sides missing' in Question Options to control how many sides are hidden." },
    ],
  },
  {
    title: "Rectilinear Shapes — Level 3", icon: "📐",
    content: [
      { label: "Overview",        detail: "All sides shown but measurements use mixed units (cm, mm, m). Convert everything to cm before summing." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard",      detail: "Single large question on the left with blank working space on the right. Visualiser and fullscreen available." },
      { label: "Worked Example",  detail: "Full step-by-step solution revealed on demand." },
      { label: "Worksheet",       detail: "Grid of questions with differentiated 3-column layout and PDF export." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Differentiated",  detail: "Shows all three levels side-by-side in the worksheet, each column independently configurable." },
      { label: "Rectilinear L2",  detail: "Toggle whether 1 or 2 sides are hidden in Level 2 rectilinear questions." },
    ],
  },
];

// ─── COLOUR SCHEMES ───────────────────────────────────────────────────────────
const LV_LABELS:        Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    fill: "#fee2e2" },
};

function getQuestionBg(cs: string) { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff"); }
function getStepBg(cs: string)     { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6"); }

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

type AnyQuestion = PolyQuestion | RectQuestion;

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

function buildPolyQ(level: string, shapeKey: ShapeKey | null = null): PolyQuestion {
  const mixUnits = level === "level3";
  const pool = mixUnits ? [...L1_SHAPES, ...L2_SHAPES] : level === "level1" ? L1_SHAPES : L2_SHAPES;
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

function pickHidden(pts: Pt[], _edges: number[], count: number): number[] {
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

function buildRectQ(level: string, templateIdx: number | null = null, vars: Record<string, unknown> = {}): RectQuestion {
  const idx = templateIdx ?? Math.floor(Math.random() * RECT_TEMPLATES.length);
  const pts = RECT_TEMPLATES[idx]();
  const edges = pts.map((p, i) => { const nb = pts[(i + 1) % pts.length]; return Math.abs(nb[0] - p[0]) + Math.abs(nb[1] - p[1]); });
  const perimeter = edges.reduce((s, e) => s + e, 0);

  if (level === "level1") {
    return { kind: "rect", pts, edges, hiddenIdx: [], perimeter, answer: `${perimeter} cm`, working: [{ text: "Add all edge lengths:" }, { text: `Perimeter = ${edges.join(" + ")}` }, { text: `Perimeter = ${perimeter} cm` }], mixedEdges: null, level, templateIdx: idx, id: Math.floor(Math.random() * 1_000_000) };
  }
  if (level === "level2") {
    const hc = vars.missing2 ? 2 : vars.missing1 ? 1 : (Math.random() < 0.5 ? 1 : 2);
    const hidden = pickHidden(pts, edges, hc);
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

// ─── Question generators ──────────────────────────────────────────────────────
function generateQuestion(tool: ToolKey, level: string, vars: Record<string, unknown>): AnyQuestion {
  if (tool === "polygons") return buildPolyQ(level);
  return buildRectQ(level, null, vars);
}

function getUniqueQuestion(tool: ToolKey, level: string, vars: Record<string, unknown>, used: Set<string>): AnyQuestion {
  let q: AnyQuestion, key: string, attempts = 0;
  do { q = generateQuestion(tool, level, vars); key = `${q.id}`; } while (used.has(key) && ++attempts < 100);
  used.add(key);
  return q;
}

// ══════════════════════════════════════════════════════════════════════════════
// POLYGON DIAGRAM
// ══════════════════════════════════════════════════════════════════════════════
interface PolyDiagramProps { q: PolyQuestion; showAnswer: boolean; small?: boolean; labelBg?: string; dataIndex?: number; }

function PolyDiagram({ q, showAnswer, small = false, labelBg: _labelBg = "#ffffff", dataIndex }: PolyDiagramProps) {
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

  // Tick marks
  const renderTicks = () => q.def.groups.map((grp, gi) => grp.map(ei => {
    const [ax, ay] = pts[ei], [bx, by] = pts[(ei + 1) % pts.length];
    const mx2 = (ax + bx) / 2, my2 = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len;
    const tl = small ? 8 : 8, ts = small ? 5 : 5, count = gi + 1;
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
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "100%" }} {...extraProps}>
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

interface RectDiagramProps { q: RectQuestion; showAnswer: boolean; small?: boolean; labelBg?: string; dataIndex?: number; }

function RectDiagram({ q, showAnswer, small = false, labelBg: _labelBg = "#ffffff", dataIndex }: RectDiagramProps) {
  const maxX = Math.max(...q.pts.map(p => p[0])), maxY = Math.max(...q.pts.map(p => p[1]));
  const fs       = small ? Math.max(9, 11) : 18;
  const standoff = small ? 18 : 40;
  const pad      = small ? Math.max(52, standoff + 14) : Math.max(90, standoff + 50);
  const maxDrawW = small ? 220 : 560;
  const maxDrawH = small ? 220 : 480;
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
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "100%" }} {...extraProps}>
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
interface DiagramProps { q: AnyQuestion; showAnswer: boolean; small?: boolean; labelBg?: string; dataIndex?: number; }
function ShapeDiagram({ q, showAnswer, small, labelBg, dataIndex }: DiagramProps) {
  if (q.kind === "poly") return <PolyDiagram q={q} showAnswer={showAnswer} small={small} labelBg={labelBg} dataIndex={dataIndex} />;
  return <RectDiagram q={q} showAnswer={showAnswer} small={small} labelBg={labelBg} dataIndex={dataIndex} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF  (SVG-capture approach, matching AnglesInTrianglesv2)
// ══════════════════════════════════════════════════════════════════════════════
const PRINT_COLS     = 3;
const PRINT_ROWS     = 3;
const PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function handlePrint(
  worksheet: AnyQuestion[],
  isDiff: boolean,
  _showAnswers: boolean,
  toolName: string,
  worksheetContainerRef: React.RefObject<HTMLDivElement>,
) {
  const container = worksheetContainerRef.current;
  if (!container) return;

  // Capture rendered SVGs by data-q-index
  const svgEls = container.querySelectorAll<SVGSVGElement>("svg[data-q-index]");
  const svgStrings: string[] = [];
  svgEls.forEach(el => {
    const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10);
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "100%");
    clone.setAttribute("height", "100%");
    svgStrings[idx] = clone.outerHTML;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const buildStandardPages = (withAnswers: boolean): string => {
    const pages: string[] = [];
    for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) {
      const slice = worksheet.slice(p, p + PRINT_PER_PAGE);
      const pageNum = Math.floor(p / PRINT_PER_PAGE) + 1;
      const totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, localIdx) => {
        const gi = p + localIdx;
        const subtitle = q.kind === "poly" && (q as PolyQuestion).mixUnits ? "<div class=\"cell-sub\">Give your answer in cm</div>" : "";
        return `<div class="cell">
          <div class="cell-num">${gi + 1}</div>
          <div class="cell-prompt">Find the perimeter${q.kind === "poly" ? ` of the ${(q as PolyQuestion).def.name.toLowerCase()}` : ""}</div>
          ${subtitle}
          <div class="cell-diagram">${svgStrings[gi] ?? ""}</div>
          ${withAnswers ? `<div class="answer">${q.answer}</div>` : ""}
        </div>`;
      }).join("");
      pages.push(`<div class="page">
        <div class="page-header">
          <span class="page-title">${toolName}${withAnswers ? " — Answers" : ""}</span>
          <span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${pageNum} of ${totalPages}` : ""}</span>
        </div>
        <div class="standard-grid">${cells}</div>
      </div>`);
    }
    return pages.join("");
  };

  const buildDiffPages = (withAnswers: boolean): string => {
    const byLevel: Record<string, AnyQuestion[]> = {
      level1: worksheet.filter(q => q.level === "level1"),
      level2: worksheet.filter(q => q.level === "level2"),
      level3: worksheet.filter(q => q.level === "level3"),
    };
    const offsetByLevel: Record<string, number> = {
      level1: 0,
      level2: byLevel.level1.length,
      level3: byLevel.level1.length + byLevel.level2.length,
    };
    const lvNames:  Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
    const lvColors: Record<string, string> = { level1: "#166534", level2: "#854d0e", level3: "#991b1b" };
    const lvBg:     Record<string, string> = { level1: "#dcfce7", level2: "#fef9c3", level3: "#fee2e2" };
    const totalPages = Math.ceil(Math.max(...Object.values(byLevel).map(a => a.length)) / PRINT_ROWS);
    return Array.from({ length: totalPages }, (_, p) => {
      const cols = ["level1", "level2", "level3"].map(lv => {
        const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const offset = offsetByLevel[lv];
        const cells = qs.map((q, li) => {
          const gi = offset + p * PRINT_ROWS + li;
          const subtitle = q.kind === "poly" && (q as PolyQuestion).mixUnits ? "<div class=\"cell-sub\">Give your answer in cm</div>" : "";
          return `<div class="cell">
            <div class="cell-num">${p * PRINT_ROWS + li + 1}</div>
            <div class="cell-prompt">Find the perimeter</div>
            ${subtitle}
            <div class="cell-diagram">${svgStrings[gi] ?? ""}</div>
            ${withAnswers ? `<div class="answer">${q.answer}</div>` : ""}
          </div>`;
        }).join("");
        return `<div class="diff-col">
          <div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div>
          <div class="diff-cells">${cells}</div>
        </div>`;
      }).join("");
      return `<div class="page">
        <div class="page-header">
          <span class="page-title">${toolName}${withAnswers ? " — Answers" : ""}</span>
          <span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : ""}</span>
        </div>
        <div class="diff-grid">${cols}</div>
      </div>`;
    }).join("");
  };

  const questionsHtml = isDiff ? buildDiffPages(false) : buildStandardPages(false);
  const answersHtml   = isDiff ? buildDiffPages(true)  : buildStandardPages(true);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4 portrait; margin:12mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  .page { width:186mm; height:273mm; display:flex; flex-direction:column; page-break-after:always; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  .page-header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:0.5mm solid #1e3a8a; padding-bottom:2mm; margin-bottom:3mm; flex-shrink:0; }
  .page-title  { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-meta   { font-size:3mm; color:#6b7280; }
  .standard-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); gap:2mm; flex:1; min-height:0; }
  .diff-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; flex:1; min-height:0; }
  .diff-col    { display:flex; flex-direction:column; gap:2mm; min-height:0; }
  .diff-col-header { text-align:center; font-size:3.5mm; font-weight:700; padding:1.5mm 0; border-radius:1.5mm; flex-shrink:0; }
  .diff-cells  { display:flex; flex-direction:column; gap:2mm; flex:1; min-height:0; }
  .cell { border:0.3mm solid #d1d5db; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:2mm; overflow:hidden; flex:1; min-height:0; position:relative; }
  .cell-num    { position:absolute; top:1.5mm; left:2mm; font-size:2.8mm; font-weight:700; color:#374151; }
  .cell-prompt { font-size:3.2mm; font-weight:700; color:#1e3a8a; margin-bottom:1mm; margin-top:1mm; text-align:center; }
  .cell-sub    { font-size:2.6mm; color:#7c3aed; font-weight:600; text-align:center; margin-bottom:1mm; }
  .cell-diagram { width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .cell-diagram svg { width:100%; height:100%; overflow:visible; }
  .answer      { font-size:3mm; font-weight:700; color:#059669; text-align:center; flex-shrink:0; margin-top:1mm; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
${questionsHtml}${answersHtml}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the print/PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {(["level1", "level2", "level3"] as const).map((val, i) => {
      const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
      return <button key={val} onClick={() => onChange(val)} className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>Level {i + 1}</button>;
    })}
  </div>
);

const VariablesSection = ({ variables, values, onChange }: { variables: any[]; values: Record<string, unknown>; onChange: (k: string, v: boolean) => void }) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const hasContent = (variables?.length ?? 0) > 0 || dropdown !== null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
        Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {variables?.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No options at this level.</p>}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
        Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {["level1", "level2", "level3"].map(lv => {
            const vars = toolSettings.difficultySettings?.[lv]?.variables ?? [];
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k: string, v: boolean) => onLevelVariableChange(lv, k, v)} />}
                  {vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3"><span className="font-bold text-gray-800 text-sm">{item.label}</span><p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p></div>)}
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

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: any) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform ${colorOpen ? "rotate-90" : ""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default", "blue", "pink", "yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }} className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {s}{colorScheme === s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function PerimeterTool() {
  const navigate = useNavigate();
  const worksheetContainerRef = useRef<HTMLDivElement>(null);

  const [currentTool, setCurrentTool] = useState<ToolKey>("polygons");
  const [mode,        setMode]        = useState("whiteboard");
  const [difficulty,  setDifficulty]  = useState("level1");

  // ── Per-level QO state ────────────────────────────────────────────────────
  const makeDefaultLevelVars = (tool: ToolKey) => {
    const ds = (TOOL_CONFIG.tools[tool] as any).difficultySettings;
    const out: Record<string, Record<string, unknown>> = {};
    ["level1", "level2", "level3"].forEach(lv => {
      out[lv] = {};
      (ds[lv]?.variables ?? []).forEach((v: any) => { out[lv][v.key] = v.defaultValue; });
    });
    return out;
  };

  const [levelVars, setLevelVars] = useState<Record<string, Record<string, unknown>>>(() => makeDefaultLevelVars("polygons"));

  const setLevelVar = (lv: string, k: string, v: unknown) =>
    setLevelVars(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));

  const getVarsConfig = () => (TOOL_CONFIG.tools[currentTool] as any).difficultySettings?.[difficulty]?.variables ?? [];

  const buildVars = (lv: string): Record<string, unknown> => levelVars[lv] ?? {};

  // When switching tools, reset level vars to defaults for new tool
  const handleToolChange = (tool: ToolKey) => {
    setCurrentTool(tool);
    setLevelVars(makeDefaultLevelVars(tool));
  };

  // ── Display / worksheet state ─────────────────────────────────────────────
  const [question,      setQuestion]      = useState<AnyQuestion | null>(null);
  const [showWBAnswer,  setShowWBAnswer]  = useState(false);
  const [showAnswer,    setShowAnswer]    = useState(false);
  const [numQuestions,  setNumQuestions]  = useState(9);
  const [worksheet,     setWorksheet]     = useState<AnyQuestion[]>([]);
  const [showWSAnswers, setShowWSAnswers] = useState(false);
  const [isDiff,        setIsDiff]        = useState(false);
  const [colorScheme,   setColorScheme]   = useState("default");
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [infoOpen,      setInfoOpen]      = useState(false);

  // Font sizes
  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  // ── Visualiser / whiteboard state ─────────────────────────────────────────
  const [wbFullscreen,    setWbFullscreen]    = useState(false);
  const [presenterMode,   setPresenterMode]   = useState(false);
  const [camDevices,      setCamDevices]      = useState<MediaDeviceInfo[]>([]);
  const [currentCamId,    setCurrentCamId]    = useState<string | null>(null);
  const [camError,        setCamError]        = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress    = useRef(false);
  const camDropdownRef  = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let targetId = deviceId;
      if (!targetId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const builtIn = /facetime|built.?in|integrated|internal|front|rear/i;
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !builtIn.test(d.label));
        if (ext) targetId = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetId ? { deviceId: { exact: targetId } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: any) { setCamError(e.message ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  const qBg    = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg  = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefaultScheme ? "#f5f3f0" : qBg;

  const stdQOProps = {
    variables: getVarsConfig(),
    variableValues: levelVars[difficulty] ?? {},
    onVariableChange: (k: string, v: unknown) => setLevelVar(difficulty, k, v),
    dropdown: null,
  };
  const diffQOProps = {
    toolSettings: TOOL_CONFIG.tools[currentTool],
    levelVariables: levelVars,
    onLevelVariableChange: setLevelVar,
  };

  const newQuestion = () => {
    setQuestion(generateQuestion(currentTool, difficulty, buildVars(difficulty)));
    setShowWBAnswer(false); setShowAnswer(false);
  };

  const generateWorksheet = () => {
    const used = new Set<string>();
    const qs: AnyQuestion[] = [];
    if (isDiff) {
      ["level1", "level2", "level3"].forEach(lv => {
        for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, lv, buildVars(lv), used));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, difficulty, buildVars(difficulty), used));
    }
    setWorksheet(qs); setShowWSAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") newQuestion(); }, [difficulty, currentTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // Font size button style
  const fontBtn = (enabled: boolean) => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.35,
  });

  // ── Question title helper ─────────────────────────────────────────────────
  const questionTitle = (q: AnyQuestion | null): string => {
    if (!q) return "Find the perimeter";
    if (q.kind === "poly") return `Find the perimeter of the ${(q as PolyQuestion).def.name.toLowerCase()}`;
    return "Find the perimeter";
  };

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, globalIdx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg;
    const mixUnits = q.kind === "poly" && (q as PolyQuestion).mixUnits;
    return (
      <div key={globalIdx} className="rounded-lg shadow flex flex-col items-center gap-1 p-3" style={{ backgroundColor: bg, minHeight: 220 }}>
        <span className="text-sm font-bold text-gray-700 self-start">{globalIdx + 1}.</span>
        <p className="text-xs font-bold text-blue-900 text-center">{questionTitle(q)}</p>
        {mixUnits && <p className="text-xs font-semibold text-purple-700 text-center">Give your answer in cm</p>}
        <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShapeDiagram q={q} showAnswer={showWSAnswers} small labelBg={bg} dataIndex={globalIdx} />
        </div>
        {showWSAnswers && <span className="text-sm font-bold text-center" style={{ color: "#059669" }}>{q.answer}</span>}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Row 1: Level + Differentiated */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {(["level1", "level2", "level3"] as const).map((val, i) => {
              const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
              return <button key={val} onClick={() => { setDifficulty(val); setIsDiff(false); }} className={`px-5 py-2 font-bold text-base transition-colors ${!isDiff && difficulty === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>Level {i + 1}</button>;
            })}
          </div>
          <button onClick={() => setIsDiff(!isDiff)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDiff ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
        </div>
        {/* Row 2: QO + Questions */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {isDiff ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions{isDiff ? " per level" : ""}:</label>
            <input type="number" min="1" max="18" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(18, parseInt(e.target.value) || 9)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base text-center" />
          </div>
        </div>
        {/* Row 3: Actions */}
        <div className="flex justify-center items-center gap-4">
          <button onClick={generateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate Worksheet
          </button>
          {worksheet.length > 0 && <>
            <button onClick={() => setShowWSAnswers(!showWSAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {showWSAnswers ? "Hide Answers" : "Show Answers"}
            </button>
            <button onClick={() => handlePrint(worksheet, isDiff, showWSAnswers, TOOL_CONFIG.pageTitle, worksheetContainerRef)}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
              <Printer size={18} /> Print / PDF
            </button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3">
            <button onClick={newQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWBAnswer(!showWBAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWBAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ────────────────────────────────────────────────────────────
  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
        <StandardQOPopover {...stdQOProps} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={newQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWBAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWBAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );

    const fontControls = (
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
        <button style={fontBtn(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280" /></button>
        <button style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)} title="Increase font size"><ChevronUp   size={16} color="#6b7280" /></button>
      </div>
    );

    const questionBox = (isFS: boolean) => (
      <div style={{
        position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        ...(isFS
          ? { width: "40%", height: "100%", backgroundColor: fsQuestionBg, padding: 32, boxSizing: "border-box" as const, flexShrink: 0, overflowY: "auto" as const }
          : { width: "500px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 })
      }}>
        {fontControls}
        <div style={{ width: "100%", textAlign: "center", paddingLeft: 44, paddingRight: 44 }}>
          <span className={`${displayFontSizes[displayFontSize]} font-bold text-black`}>{questionTitle(question)}</span>
        </div>
        {question?.kind === "poly" && (question as PolyQuestion).mixUnits && (
          <p className="text-xl font-semibold text-purple-700">Give your answer in cm</p>
        )}
        {showWBAnswer && question && (
          <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{question.answer}</span>
        )}
        <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {question
            ? <ShapeDiagram q={question} showAnswer={showWBAnswer} labelBg={isFS ? fsQuestionBg : stepBg} />
            : <span className="text-gray-400 text-xl">Generate a question</span>}
        </div>
      </div>
    );

    const makeRightPanel = (isFS: boolean) => (
      <div style={{ flex: isFS ? "none" : 1, width: isFS ? "60%" : undefined, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg), borderRadius: isFS ? 0 : undefined }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}
          </>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button
                onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }}
                onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }}
                onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}
              ><Video size={16} color="rgba(255,255,255,0.85)" /></button>
              {camDropdownOpen && (
                <div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                  <div style={{ padding: "6px 14px", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Camera</div>
                  {camDevices.map((d, i) => (
                    <div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }}
                      style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === currentCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />
                      {d.label || `Camera ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setPresenterMode(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
            ><Video size={16} color="#6b7280" /></button>
          )}
          <button onClick={() => setWbFullscreen(f => !f)}
            style={{ background: wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"), border: presenterMode ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: presenterMode ? "blur(6px)" : "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = wbFullscreen ? "#1f2937" : (presenterMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.15)"))}
            onMouseLeave={e => (e.currentTarget.style.background = wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"))}
          >{wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} />}</button>
        </div>
      </div>
    );

    if (wbFullscreen) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>
        {fsToolbar}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {questionBox(true)}
          <div style={{ width: 2, backgroundColor: "#000", flexShrink: 0 }} />
          {makeRightPanel(true)}
        </div>
      </div>
    );
    return (
      <div className="p-8" style={{ backgroundColor: qBg, height: "600px", boxSizing: "border-box" }}>
        <div className="flex gap-6" style={{ height: "100%" }}>
          {questionBox(false)}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
      <div className="p-8" style={{ backgroundColor: qBg }}>
        <div className="text-center mb-6 relative">
          <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
            <button style={fontBtn(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
            <button style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp   size={16} color="#6b7280" /></button>
          </div>
          <span className={`${displayFontSizes[displayFontSize]} font-bold text-black`}>{questionTitle(question)}</span>
          {question?.kind === "poly" && (question as PolyQuestion).mixUnits && (
            <p className="mt-2 text-xl font-semibold text-purple-700">Give your answer in centimetres (cm)</p>
          )}
        </div>
        {question ? (
          <>
            <div className="flex justify-center mb-6" style={{ maxWidth: 500, margin: "0 auto 1.5rem" }}>
              <ShapeDiagram q={question} showAnswer={showAnswer} labelBg={stepBg} />
            </div>
            {showAnswer && (
              <>
                <div className="space-y-4 mt-4">
                  {question.working.slice(0, -1).map((step, i) => (
                    <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}>
                      <h4 className="text-base font-bold mb-1 text-gray-500 uppercase tracking-wide">Step {i + 1}</h4>
                      <p className="text-2xl font-semibold text-black">{step.text}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}>
                  <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{question.answer}</span>
                </div>
              </>
            )}
          </>
        ) : <div className="text-center text-gray-400 text-4xl py-16">Generate a question</div>}
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    if (isDiff) return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8 text-black">Perimeter — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {["level1", "level2", "level3"].map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv);
            const offset = li * numQuestions;
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div className="space-y-3">{lqs.map((q, idx) => renderQCell(q, offset + idx, c.fill))}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8 text-black">Perimeter — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {worksheet.map((q, idx) => renderQCell(q, idx))}
        </div>
      </div>
    );
  };

  // ── Root ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {menuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setMenuOpen(false)} onOpenInfo={() => setInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8 text-black">{TOOL_CONFIG.pageTitle}</h1>

          {/* Sub-tool tabs: Polygons / Rectilinear Shapes */}
          <div className="flex justify-center gap-4 mb-6">
            {(Object.keys(TOOL_CONFIG.tools) as ToolKey[]).map(k => (
              <button key={k} onClick={() => { handleToolChange(k); setMode("whiteboard"); setPresenterMode(false); setWbFullscreen(false); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>

          {/* Mode tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === "worksheet" ? (
            <>{renderControlBar()}{renderWorksheet()}</>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">{renderControlBar()}</div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode === "whiteboard" && renderWhiteboard()}
                {mode === "single"     && renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
