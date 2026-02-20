import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, Home, Menu, X, Download } from "lucide-react";

// ─── jsPDF loader ─────────────────────────────────────────────────────────────
declare global {
  interface Window {
    jspdf?: { jsPDF: new (opts: Record<string, unknown>) => JsPDFInstance };
  }
}

interface JsPDFInstance {
  addPage(): void;
  save(filename: string): void;
  setDrawColor(r: number, g: number, b: number): void;
  setDrawColor(hex: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setTextColor(rgb: number[]): void;
  setLineWidth(w: number): void;
  setLineDashPattern(pattern: number[], phase: number): void;
  setFontSize(size: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  lines(lines: number[][], x: number, y: number, scale: number[], style: string, closed: boolean): void;
  text(text: string, x: number, y: number, opts?: Record<string, unknown>): void;
  output(type: "bloburl"): unknown;
}

function loadJsPDF(): Promise<new (opts: Record<string, unknown>) => JsPDFInstance> {
  return new Promise((res, rej) => {
    if (window.jspdf) return res(window.jspdf.jsPDF);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      if (window.jspdf) res(window.jspdf.jsPDF);
      else rej(new Error("jsPDF failed to load"));
    };
    s.onerror = () => rej(new Error("jsPDF script error"));
    document.head.appendChild(s);
  });
}

// ─── COLOUR SCHEMES ───────────────────────────────────────────────────────────
type SchemeKey = "default" | "blue" | "pink" | "yellow";
interface ColourScheme { qBg: string; stepBg: string; finalBg: string; }

const SCHEMES: Record<SchemeKey, ColourScheme> = {
  default: { qBg: "#ffffff", stepBg: "#f3f4f6", finalBg: "#f3f4f6" },
  blue:    { qBg: "#D1E7F8", stepBg: "#B3D9F2", finalBg: "#B3D9F2" },
  pink:    { qBg: "#F8D1E7", stepBg: "#F2B3D9", finalBg: "#F2B3D9" },
  yellow:  { qBg: "#F8F4D1", stepBg: "#F2EBB3", finalBg: "#F2EBB3" },
};

function diffBtnClass(idx: number, active: boolean): string {
  if (active)
    return idx === 0 ? "bg-green-600 text-white"
         : idx === 1 ? "bg-yellow-600 text-white"
                     : "bg-red-600 text-white";
  return idx === 0 ? "bg-white text-green-600 border-2 border-green-600"
       : idx === 1 ? "bg-white text-yellow-600 border-2 border-yellow-600"
                   : "bg-white text-red-600 border-2 border-red-600";
}

function rnd(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// ─── GEOMETRY HELPERS ─────────────────────────────────────────────────────────
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

// ─── LabelPill ───────────────────────────────────────────────────────────────
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
// POLYGON DATA
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

type FamilyKey = "triangle" | "regular" | "irregular";
const SHAPE_FAMILIES: Record<ShapeKey, FamilyKey> = {
  equilateral_triangle: "triangle", isosceles_triangle: "triangle",
  square: "regular", regular_pentagon: "regular", regular_hexagon: "regular", regular_octagon: "regular",
  rectangle: "irregular", parallelogram: "irregular", rhombus: "irregular",
};

function pickShapeKeys(levelOrLevels: string | string[], count = 9, maxPerFamily = 2): ShapeKey[] {
  const getLevelPool = (lvl: string): ShapeKey[] =>
    lvl === "level1" ? L1_SHAPES : lvl === "level2" ? L2_SHAPES : [...L1_SHAPES, ...L2_SHAPES];
  const result: ShapeKey[] = [], used = new Set<ShapeKey>();
  const familyCount: Partial<Record<FamilyKey, number>> = {};
  for (let i = 0; i < count; i++) {
    const level = Array.isArray(levelOrLevels) ? levelOrLevels[i] : levelOrLevels;
    const pool = getLevelPool(level);
    let cands = pool.filter(k => !used.has(k) && (familyCount[SHAPE_FAMILIES[k]] ?? 0) < maxPerFamily);
    if (!cands.length) cands = pool.filter(k => (familyCount[SHAPE_FAMILIES[k]] ?? 0) < maxPerFamily);
    if (!cands.length) cands = pool;
    const key = cands[Math.floor(Math.random() * cands.length)];
    result.push(key); used.add(key);
    familyCount[SHAPE_FAMILIES[key]] = (familyCount[SHAPE_FAMILIES[key]] ?? 0) + 1;
  }
  return result;
}

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

// ── PolyQuestion ──────────────────────────────────────────────────────────────
interface DisplayEdge { display: string; baseCm: number; unit: "cm" | "mm" | "m"; }
interface WorkStep { text: string; }

interface PolyQuestion {
  shapeKey: ShapeKey;
  def: ShapeDef;
  rawPts: Pt[];
  edges: number[];
  groupVals: number[];
  perimeter: number;
  displayAnswer: string;
  working: WorkStep[];
  labelledIdx: number[];
  displayEdges: (DisplayEdge | null)[] | null;
  level: number;
  mixUnits: boolean;
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
    const isValid = (leg: number, base: number): boolean => {
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
  return { shapeKey: key, def, rawPts, edges, groupVals, perimeter, displayAnswer: `${perimeter} cm`, working: work, labelledIdx, displayEdges, level: level === "level1" ? 1 : level === "level2" ? 2 : 3, mixUnits };
}

// ── TickMarks ─────────────────────────────────────────────────────────────────
interface TickMarksProps { pts: Pt[]; groups: number[][]; scale?: number; }
function TickMarks({ pts, groups, scale = 1 }: TickMarksProps) {
  return groups.map((grp, gi) => grp.map(ei => {
    const [ax, ay] = pts[ei], [bx, by] = pts[(ei + 1) % pts.length];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len, tl = 8 * scale, ts = 5 * scale, count = gi + 1;
    return Array.from({ length: count }, (_, ti) => {
      const o = (ti - (count - 1) / 2) * ts;
      return (
        <line key={`${gi}-${ei}-${ti}`}
          x1={mx + px * (-tl / 2) + py * o} y1={my + py * (-tl / 2) - px * o}
          x2={mx + px * (tl / 2) + py * o}  y2={my + py * (tl / 2) - px * o}
          stroke="#065f46" strokeWidth={1.5 * scale} />
      );
    });
  }));
}

// ── PolyDiagram ───────────────────────────────────────────────────────────────
interface PolyDiagramProps { q: PolyQuestion; showAnswer: boolean; isWs?: boolean; wsScale?: number; }
function PolyDiagram({ q, showAnswer, isWs = false, wsScale = 1 }: PolyDiagramProps) {
  const diag = isWs ? 150 * wsScale : 360, pad = isWs ? 48 * wsScale : 78;
  const fs = isWs ? Math.max(9, 10 * wsScale) : 19, standoff = isWs ? 20 * wsScale : 44;
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
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={pathD} fill="#d1fae5" stroke="#065f46" strokeWidth={isWs ? 2 : 3} />
      <TickMarks pts={pts} groups={q.def.groups} scale={isWs ? wsScale : 1} />
      {q.labelledIdx.map(i => {
        const p = pts[i], nb = pts[(i + 1) % pts.length];
        return <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={nb[0]} y2={nb[1]} stroke="#10b981" strokeWidth={isWs ? 3 : 4} opacity={0.4} />;
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
// RECTILINEAR DATA
// ══════════════════════════════════════════════════════════════════════════════
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

function pickTemplateIndices(count = 9): number[] {
  const total = RECT_TEMPLATES.length, result: number[] = [], used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let available = [...Array(total).keys()].filter(k => !used.has(k));
    if (!available.length) { used.clear(); available = [...Array(total).keys()]; }
    const idx = available[Math.floor(Math.random() * available.length)];
    result.push(idx); used.add(idx);
  }
  return result;
}

function genRect(templateIdx: number | null = null): { pts: Pt[]; edges: number[]; templateIdx: number } {
  const idx = templateIdx ?? Math.floor(Math.random() * RECT_TEMPLATES.length);
  const pts = RECT_TEMPLATES[idx]();
  const edges = pts.map((p, i) => { const nb = pts[(i + 1) % pts.length]; return Math.abs(nb[0] - p[0]) + Math.abs(nb[1] - p[1]); });
  return { pts, edges, templateIdx: idx };
}

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

interface Deriv { hi: number; val: number; dir: string; }
interface RectQuestion {
  pts: Pt[];
  edges: number[];
  hiddenIdx: number[];
  perimeter: number;
  displayAnswer: string;
  working: WorkStep[];
  mixedEdges: DisplayEdge[] | null;
  level: number;
  derivs?: Deriv[];
  templateIdx: number;
}

function buildRectQ(level: string, templateIdx: number | null = null): RectQuestion {
  const { pts, edges, templateIdx: usedIdx } = genRect(templateIdx);
  const perimeter = edges.reduce((s, e) => s + e, 0);
  if (level === "level1") {
    return { pts, edges, hiddenIdx: [], perimeter, displayAnswer: `${perimeter} cm`, working: [{ text: "Add all edge lengths:" }, { text: `Perimeter = ${edges.join(" + ")}` }, { text: `Perimeter = ${perimeter} cm` }], mixedEdges: null, level: 1, templateIdx: usedIdx };
  }
  if (level === "level2") {
    const hc = Math.random() < 0.5 ? 1 : 2, hidden = pickHidden(pts, edges, hc);
    const derivs: Deriv[] = hidden.map(hi => {
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
    return { pts, edges, hiddenIdx: hidden, perimeter, displayAnswer: `${perimeter} cm`, working: work, mixedEdges: null, level: 2, derivs, templateIdx: usedIdx };
  }
  const mixed = makeMixed(edges);
  const work: WorkStep[] = [{ text: "Convert all measurements to centimetres:" }];
  mixed.forEach((m, i) => {
    if (m.unit === "mm") work.push({ text: `Edge ${i + 1}: ${m.display} = ${m.baseCm} cm  (÷ 10)` });
    else if (m.unit === "m") work.push({ text: `Edge ${i + 1}: ${m.display} = ${m.baseCm} cm  (× 100)` });
  });
  work.push({ text: `Perimeter = ${edges.join(" + ")}` });
  work.push({ text: `Perimeter = ${perimeter} cm` });
  return { pts, edges, hiddenIdx: [], perimeter, displayAnswer: `${perimeter} cm`, working: work, mixedEdges: mixed, level: 3, templateIdx: usedIdx };
}

function edgeOutDir(sPts: Pt[], i: number): number {
  const p1 = sPts[i], p2 = sPts[(i + 1) % sPts.length];
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const isH = Math.abs(p1[1] - p2[1]) < 0.01;
  if (isH) return pointInPoly(mx, my + 4, sPts) ? -1 : 1;
  else     return pointInPoly(mx + 4, my, sPts) ? -1 : 1;
}

// ── RectDiagram ───────────────────────────────────────────────────────────────
interface RectDiagramProps { q: RectQuestion; showAnswer: boolean; isWs?: boolean; wsScale?: number; }
function RectDiagram({ q, showAnswer, isWs = false, wsScale = 1 }: RectDiagramProps) {
  const maxX = Math.max(...q.pts.map(p => p[0])), maxY = Math.max(...q.pts.map(p => p[1]));
  // pill standoff and font size — calculated first so padding accounts for pill space
  const fs = isWs ? Math.max(9, 11 * wsScale) : 18;
  const standoff = isWs ? 18 * wsScale : 40;
  // pad must be large enough to contain pills on every side
  const pad = isWs ? Math.max(52 * wsScale, standoff + 14 * wsScale) : Math.max(90, standoff + 50);
  // max drawable area for the shape itself (inside padding)
  const maxDrawW = isWs ? 220 * wsScale : 560;
  const maxDrawH = isWs ? 220 * wsScale : 480;
  const sc = Math.min(maxDrawW / maxX, maxDrawH / maxY);
  const W = maxX * sc + pad * 2, H = maxY * sc + pad * 2;
  const sPts: Pt[] = q.pts.map(p => [p[0] * sc + pad, p[1] * sc + pad]);
  const pathD = sPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";
  const charW = fs * 0.60, pillPad = fs * 0.85;
  const labelMeta: (PillMeta & { hilit: string })[] = sPts.map((p, i) => {
    const nb = sPts[(i + 1) % sPts.length];
    const mx = (p[0] + nb[0]) / 2, my = (p[1] + nb[1]) / 2;
    const isH = Math.abs(p[1] - nb[1]) < 0.01;
    const outDir = edgeOutDir(sPts, i);
    const hidden = q.hiddenIdx.includes(i) && !showAnswer;
    const txt = hidden ? "?" : (q.mixedEdges && !showAnswer ? q.mixedEdges[i].display : `${q.edges[i]} cm`);
    const color = hidden ? "#d97706" : "#1e40af";
    const hilit = hidden ? "#fbbf24" : "#6366f1";
    const pw = txt.length * charW + pillPad * 2, ph = fs * 1.6;
    return { mx, my, isH, outDir, standoff, pw, ph, txt, color, hilit };
  });
  const positions = choosePillPositions(labelMeta);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={pathD} fill="#e0e7ff" stroke="#4f46e5" strokeWidth={isWs ? 2 : 3} />
      {sPts.map((p, i) => { const nb = sPts[(i + 1) % sPts.length]; return <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={nb[0]} y2={nb[1]} stroke={labelMeta[i].hilit} strokeWidth={isWs ? 3 : 4} opacity={0.35} />; })}
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

// ══════════════════════════════════════════════════════════════════════════════
// PDF — SHARED CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const PDF_W = 210, PDF_H = 297, PDF_M = 8, PDF_COLS = 3, PDF_ROWS = 3;
const CELL_W = (PDF_W - PDF_M * 2) / PDF_COLS;
const CELL_H = (PDF_H - PDF_M * 2) / PDF_ROWS;
const CPAD = 4;
const PILL_H_MM = 3.8, PILL_PAD_MM = 1.4, FONT_PT = 6.5;
const LABEL_H_MM = 7;
const ANSWER_H_MM = 7;

function pillWidthMM(text: string): number { return text.length * 1.45 + PILL_PAD_MM * 2; }

function scaledPts(rawPts: Pt[], cx: number, cy: number, availW: number, availH: number, frac = 0.82): Pt[] {
  const xs = rawPts.map(p => p[0]), ys = rawPts.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const spanX = Math.max(...xs) - x0 || 1, spanY = Math.max(...ys) - y0 || 1;
  const sc = Math.min(availW / spanX, availH / spanY) * frac;
  const offX = (availW - spanX * sc) / 2, offY = (availH - spanY * sc) / 2;
  return rawPts.map(([x, y]) => [cx - availW / 2 + (x - x0) * sc + offX, cy - availH / 2 + (y - y0) * sc + offY]);
}

function buildPillMetaMM(groupVals: number[], def: ShapeDef, pts: Pt[], cx: number, cy: number, standoff: number): PillMeta[] {
  return def.groups.map((grp, gi) => {
    const ei = grp[0], a = pts[ei], b = pts[(ei + 1) % pts.length];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = mx - cx, dy = my - cy;
    const isH = Math.abs(pts[ei][1] - pts[(ei + 1) % pts.length][1]) < standoff * 0.3;
    const outDir = isH ? Math.sign(dy) || 1 : Math.sign(dx) || 1;
    const txt = `${groupVals[gi]} cm`;
    const pw = pillWidthMM(txt), ph = PILL_H_MM;
    return { mx, my, isH, outDir, standoff, pw, ph, txt, color: "#065f46" };
  });
}

function drawTicksPDF(doc: JsPDFInstance, pts: Pt[], groups: number[][]): void {
  const TL = 1.4, TS = 0.85;
  doc.setDrawColor(6, 95, 70); doc.setLineWidth(0.28); doc.setLineDashPattern([], 0);
  groups.forEach((grp, gi) => grp.forEach(ei => {
    const a = pts[ei], b = pts[(ei + 1) % pts.length];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len, count = gi + 1;
    for (let ti = 0; ti < count; ti++) {
      const o = (ti - (count - 1) / 2) * TS;
      doc.line(mx + px * (-TL / 2) + py * o, my + py * (-TL / 2) - px * o, mx + px * (TL / 2) + py * o, my + py * (TL / 2) - px * o);
    }
  }));
}

function drawPillsPDF(doc: JsPDFInstance, meta: PillMeta[], pos: Pt[]): void {
  pos.forEach((p, i) => {
    const l = meta[i];
    doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.18); doc.setLineDashPattern([0.7, 0.5], 0);
    doc.line(l.mx, l.my, p[0], p[1]);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.25);
    doc.roundedRect(p[0] - l.pw / 2, p[1] - l.ph / 2, l.pw, l.ph, l.ph / 2, l.ph / 2, "FD");
    doc.setFontSize(FONT_PT); doc.setTextColor(6, 95, 70);
    doc.text(l.txt, p[0], p[1] + 0.15, { align: "center", baseline: "middle" });
  });
}

function drawGridPDF(doc: JsPDFInstance, cols: number, rows: number, cW: number, cH: number): void {
  doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.25); doc.setLineDashPattern([], 0);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      doc.rect(PDF_M + c * cW, PDF_M + r * cH, cW, cH, "S");
}

function drawPolyCellPDF(doc: JsPDFInstance, q: PolyQuestion, cellX: number, cellY: number, showAnswer: boolean, cellW: number, cellH: number): void {
  const availW = cellW - CPAD * 2, availH = cellH - CPAD * 2 - LABEL_H_MM - (showAnswer ? ANSWER_H_MM : 0);
  const cx = cellX + CPAD + availW / 2, cy = cellY + CPAD + LABEL_H_MM + availH / 2;
  const pts = scaledPts(q.rawPts, cx, cy, availW, availH);
  doc.setFontSize(5.5); doc.setTextColor(30, 58, 138); doc.setLineDashPattern([], 0);
  doc.text("Find the perimeter in cm", cellX + cellW / 2, cellY + CPAD + LABEL_H_MM * 0.6, { align: "center" });
  doc.setFillColor(209, 250, 229); doc.setDrawColor(6, 95, 70); doc.setLineWidth(0.5); doc.setLineDashPattern([], 0);
  const lines: number[][] = [];
  for (let i = 1; i < pts.length; i++) lines.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  lines.push([pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]]);
  doc.lines(lines, pts[0][0], pts[0][1], [1, 1], "FD", false);
  drawTicksPDF(doc, pts, q.def.groups);
  const meta = buildPillMetaMM(q.groupVals, q.def, pts, cx, cy, 8.5);
  drawPillsPDF(doc, meta, choosePillPositions(meta));
  if (showAnswer) { doc.setFontSize(8); doc.setTextColor(185, 28, 28); doc.setLineDashPattern([], 0); doc.text(`= ${q.perimeter} cm`, cellX + cellW / 2, cellY + cellH - CPAD, { align: "center" }); }
}

function drawRectCellPDF(doc: JsPDFInstance, q: RectQuestion, cellX: number, cellY: number, showAnswer: boolean, cellW: number, cellH: number): void {
  const maxX = Math.max(...q.pts.map(p => p[0])), maxY = Math.max(...q.pts.map(p => p[1]));
  const answerReserve = showAnswer ? ANSWER_H_MM : 0;
  const pillClear = 7;
  const availW = cellW - CPAD * 2 - pillClear * 2;
  const availH = cellH - CPAD * 2 - LABEL_H_MM - answerReserve - pillClear * 2;
  const sc = Math.min(availW / maxX, availH / maxY) * 0.80;
  // Centre the scaled shape in the available area
  const shapeW = maxX * sc, shapeH = maxY * sc;
  const offX = cellX + CPAD + pillClear + (availW - shapeW) / 2;
  const offY = cellY + CPAD + LABEL_H_MM + pillClear + (availH - shapeH) / 2;
  const sPts: Pt[] = q.pts.map(p => [offX + p[0] * sc, offY + p[1] * sc]);
  doc.setFontSize(5.5); doc.setTextColor(30, 58, 138); doc.setLineDashPattern([], 0);
  doc.text("Find the perimeter in cm", cellX + CELL_W / 2, cellY + CPAD + LABEL_H_MM * 0.6, { align: "center" });
  doc.setFillColor(224, 231, 255); doc.setDrawColor(79, 70, 229); doc.setLineWidth(0.5); doc.setLineDashPattern([], 0);
  const lines: number[][] = [];
  for (let i = 1; i < sPts.length; i++) lines.push([sPts[i][0] - sPts[i - 1][0], sPts[i][1] - sPts[i - 1][1]]);
  lines.push([sPts[0][0] - sPts[sPts.length - 1][0], sPts[0][1] - sPts[sPts.length - 1][1]]);
  doc.lines(lines, sPts[0][0], sPts[0][1], [1, 1], "FD", false);
  const meta: PillMeta[] = sPts.map((p, i) => {
    const nb = sPts[(i + 1) % sPts.length];
    const mx = (p[0] + nb[0]) / 2, my = (p[1] + nb[1]) / 2;
    const isH = Math.abs(p[1] - nb[1]) < 0.01;
    const outDir = edgeOutDir(sPts, i);
    const hidden = q.hiddenIdx.includes(i);
    const txt = hidden ? "?" : (q.mixedEdges ? q.mixedEdges[i].display : `${q.edges[i]} cm`);
    return { mx, my, isH, outDir, standoff: 8.5, pw: pillWidthMM(txt), ph: PILL_H_MM, txt, color: hidden ? "#d97706" : "#1e40af" };
  });
  const pos = choosePillPositions(meta);
  pos.forEach((p, i) => {
    const l = meta[i];
    doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.18); doc.setLineDashPattern([0.7, 0.5], 0);
    doc.line(l.mx, l.my, p[0], p[1]);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.25);
    doc.roundedRect(p[0] - l.pw / 2, p[1] - l.ph / 2, l.pw, l.ph, l.ph / 2, l.ph / 2, "FD");
    doc.setFontSize(FONT_PT);
    doc.setTextColor(l.color === "#d97706" ? 217 : 30, l.color === "#d97706" ? 119 : 64, l.color === "#d97706" ? 6 : 175);
    doc.text(l.txt, p[0], p[1] + 0.15, { align: "center", baseline: "middle" });
  });
  if (showAnswer) { doc.setFontSize(8); doc.setTextColor(185, 28, 28); doc.setLineDashPattern([], 0); doc.text(`= ${q.perimeter} cm`, cellX + CELL_W / 2, cellY + CELL_H - CPAD, { align: "center" }); }
}

function renderPagePDF(doc: JsPDFInstance, questions: (PolyQuestion | RectQuestion)[], showAnswer: boolean, diffMode: boolean, type: string, cols: number, rows: number, cW: number, cH: number, pageIndex: number, perPage: number, totalQ: number): void {
  const levelColours: [number, number, number][] = [[22, 163, 74], [202, 138, 4], [220, 38, 38]];
  const levelLabels = ["Level 1", "Level 2", "Level 3"];
  const stripH = 5;

  questions.forEach((q, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const cellX = PDF_M + col * cW, cellY = PDF_M + row * cH;
    if (type === "polygon") drawPolyCellPDF(doc, q as PolyQuestion, cellX, cellY, showAnswer, cW, cH);
    else                    drawRectCellPDF(doc, q as RectQuestion, cellX, cellY, showAnswer, cW, cH);
  });

  // Draw level header strips in diff mode — only at the top of a level group
  if (diffMode) {
    const perLevel = Math.round(totalQ / 3);
    const globalStart = pageIndex * perPage;
    [0, 1, 2].forEach(lvl => {
      const lvlStart = lvl * perLevel;    // global index where this level starts
      const localIdx = lvlStart - globalStart; // position on this page
      if (localIdx >= 0 && localIdx < perPage) {
        // This level starts on this page — draw strip at that row
        const row = Math.floor(localIdx / cols);
        const y = PDF_M + row * cH;
        const [sr, sg, sb] = levelColours[lvl];
        doc.setFillColor(sr, sg, sb);
        doc.rect(PDF_M, y, cols * cW, stripH, "F");
        doc.setFontSize(7); doc.setTextColor(255, 255, 255);
        doc.text(levelLabels[lvl], PDF_M + (cols * cW) / 2, y + stripH * 0.75, { align: "center" });
      }
    });
  }

  drawGridPDF(doc, cols, rows, cW, cH);
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED WORKSHEET PREVIEW
// ══════════════════════════════════════════════════════════════════════════════
interface DiagramProps { q: PolyQuestion | RectQuestion; showAnswer: boolean; isWs?: boolean; wsScale?: number; }

interface WorksheetPreviewProps {
  questions: (PolyQuestion | RectQuestion)[];
  diffMode: boolean;
  pageIndex: number;
  DiagramComponent: React.ComponentType<DiagramProps>;
  isRect?: boolean;
}

function WorksheetPreview({ questions, diffMode, pageIndex, DiagramComponent, isRect }: WorksheetPreviewProps) {
  const cols = isRect ? 2 : 3;
  const perPage = isRect ? 6 : 9;
  const pageQs = questions.slice(pageIndex * perPage, (pageIndex + 1) * perPage);
  const globalStart = pageIndex * perPage;
  const perLevel = diffMode ? Math.round(questions.length / 3) : 0;
  const cellClass = "border-r border-b border-gray-200 last:border-r-0 p-2 flex flex-col items-center bg-white";
  const gridClass = `grid grid-cols-${cols} border border-gray-300 rounded-lg overflow-hidden`;
  const levelColours = ["bg-green-500", "bg-yellow-500", "bg-red-500"];
  const levelLabels = ["Level 1", "Level 2", "Level 3"];

  // Build rows with optional level header injected
  const rowElements: React.ReactNode[] = [];
  for (let i = 0; i < pageQs.length; i += cols) {
    const rowQs = pageQs.slice(i, i + cols);
    const globalIdx = globalStart + i;
    if (diffMode) {
      // Check if a level boundary starts at this row
      [0, 1, 2].forEach(lvl => {
        if (globalIdx === lvl * perLevel) {
          rowElements.push(
            <div key={`hdr-${lvl}`} className={`col-span-${cols} ${levelColours[lvl]} text-white text-xs font-bold uppercase tracking-wide px-3 py-1`}>
              {levelLabels[lvl]}
            </div>
          );
        }
      });
    }
    rowQs.forEach((q, j) => {
      rowElements.push(
        <div key={`q-${i}-${j}`} className={cellClass}>
          <p className="text-xs font-bold text-blue-900 mb-1 text-center">Find the perimeter in cm</p>
          <DiagramComponent q={q} showAnswer={false} isWs wsScale={isRect ? 1.0 : 0.75} />
        </div>
      );
    });
  }

  return (
    <div className="w-full">
      <div className={gridClass}>
        {rowElements}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED WORKSHEET CONTROLS + PDF LOGIC
// ══════════════════════════════════════════════════════════════════════════════
interface WorksheetPanelProps {
  col: ColourScheme;
  buildQuestions: (diff: string, diff2: boolean, pages: number) => (PolyQuestion | RectQuestion)[];
  DiagramComponent: React.ComponentType<DiagramProps>;
  pdfType: string;
  filename: string;
  isRect?: boolean;
}

function WorksheetPanel({ col, buildQuestions, DiagramComponent, pdfType, isRect }: WorksheetPanelProps) {
  const perPage = isRect ? 6 : 9;
  const pdfCols = isRect ? 2 : 3;
  const pdfRows = 3;
  const [diff, setDiff] = useState("level1");
  const [pages, setPages] = useState(1);
  const [diff2, setDiff2] = useState(false);
  const [questions, setQuestions] = useState<(PolyQuestion | RectQuestion)[]>([]);
  const [previewPage, setPreviewPage] = useState(0);

  function generate() {
    setQuestions(buildQuestions(diff, diff2, pages)); setPreviewPage(0);
  }

  const totalPages = questions.length > 0 ? Math.ceil(questions.length / perPage) : 0;

  async function downloadPDF() {
    try {
      const JsPDF = await loadJsPDF();
      const cellW = (PDF_W - PDF_M * 2) / pdfCols;
      const cellH = (PDF_H - PDF_M * 2) / pdfRows;
      const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage();
        renderPagePDF(doc, questions.slice(p * perPage, (p + 1) * perPage), false, diff2, pdfType, pdfCols, pdfRows, cellW, cellH, p, perPage, questions.length);
      }
      for (let p = 0; p < totalPages; p++) {
        doc.addPage();
        renderPagePDF(doc, questions.slice(p * perPage, (p + 1) * perPage), true, diff2, pdfType, pdfCols, pdfRows, cellW, cellH, p, perPage, questions.length);
      }
      const url = doc.output("bloburl") as string;
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
    }
  }

  return (<>
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex justify-center items-center gap-6 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-black">Questions:</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(p => (
              <button key={p} onClick={() => setPages(p)}
                className={"px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all " +
                  (pages === p ? "bg-blue-900 text-white border-blue-900" : "bg-white text-blue-900 border-blue-900 hover:bg-blue-50")}>
                {p * perPage}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={diff2} onChange={e => setDiff2(e.target.checked)} className="w-4 h-4" />
          <span className="text-base font-semibold text-black">Differentiated</span>
        </label>
        {!diff2 && (
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-black">Difficulty:</span>
            <div className="flex gap-2">
              {["level1", "level2", "level3"].map((l, i) => (
                <button key={l} onClick={() => setDiff(l)} className={"px-4 py-2 rounded-lg font-bold text-sm " + diffBtnClass(i, diff === l)}>Level {i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={generate} className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"><RefreshCw size={20} />Generate</button>
        {questions.length > 0 && <button onClick={downloadPDF} className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"><Download size={20} />Generate PDF</button>}
      </div>
    </div>
    {questions.length > 0 && (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: col.qBg }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Preview</h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0}
                className={"px-3 py-1 rounded-lg font-bold text-sm border-2 " + (previewPage === 0 ? "border-gray-300 text-gray-300 cursor-not-allowed" : "border-blue-900 text-blue-900 hover:bg-blue-50")}>‹ Prev</button>
              <span className="text-sm font-semibold text-gray-600">Page {previewPage + 1} of {totalPages}</span>
              <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage === totalPages - 1}
                className={"px-3 py-1 rounded-lg font-bold text-sm border-2 " + (previewPage === totalPages - 1 ? "border-gray-300 text-gray-300 cursor-not-allowed" : "border-blue-900 text-blue-900 hover:bg-blue-50")}>Next ›</button>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <WorksheetPreview questions={questions} diffMode={diff2} pageIndex={previewPage} DiagramComponent={DiagramComponent} isRect={isRect} />
        </div>
      </div>
    )}
  </>);
}

// ── Question builders ─────────────────────────────────────────────────────────
function buildPolyQuestions(diff: string, diff2: boolean, pages: number): PolyQuestion[] {
  const total = pages * 9;
  if (diff2) {
    const perLevel = pages * 3;
    const l1keys = pickShapeKeys("level1", perLevel, 2);
    const l2keys = pickShapeKeys("level2", perLevel, 2);
    const l3keys2 = pickShapeKeys("level3", perLevel, 2);
    const l1 = l1keys.map(k => buildPolyQ("level1", k));
    const l2 = l2keys.map(k => buildPolyQ("level2", k));
    const l3 = l3keys2.map(k => buildPolyQ("level3", k));
    return [...l1, ...l2, ...l3];
  }
  const keys = pickShapeKeys(diff, total, 2);
  return keys.map(k => buildPolyQ(diff, k));
}

function buildRectQuestions(diff: string, diff2: boolean, pages: number): RectQuestion[] {
  if (diff2) {
    // Generate 2*pages of each level, grouped: all L1 then L2 then L3
    const perLevel = pages * 2;
    const l1 = pickTemplateIndices(perLevel).map(idx => buildRectQ("level1", idx));
    const l2 = pickTemplateIndices(perLevel).map(idx => buildRectQ("level2", idx));
    const l3 = pickTemplateIndices(perLevel).map(idx => buildRectQ("level3", idx));
    return [...l1, ...l2, ...l3];
  }
  const indices = pickTemplateIndices(pages * 6);
  return indices.map(idx => buildRectQ(diff, idx));
}

// ── ControlsBar ───────────────────────────────────────────────────────────────
interface ControlsBarProps {
  difficulty: string;
  setDifficulty: (l: string) => void;
  onNew: () => void;
  onToggleAnswer: () => void;
  showAnswer: boolean;
}
function ControlsBar({ difficulty, setDifficulty, onNew, onToggleAnswer, showAnswer }: ControlsBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-black">Difficulty:</span>
          <div className="flex gap-2">
            {["level1", "level2", "level3"].map((lvl, idx) => (
              <button key={lvl} onClick={() => setDifficulty(lvl)} className={"px-4 py-2 rounded-lg font-bold text-sm w-24 " + diffBtnClass(idx, difficulty === lvl)}>Level {idx + 1}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onNew} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 flex items-center gap-2 w-52"><RefreshCw size={18} />New Question</button>
          <button onClick={onToggleAnswer} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 flex items-center gap-2 w-52"><Eye size={18} />{showAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECTILINEAR PANELS
// ══════════════════════════════════════════════════════════════════════════════
function RectWhiteboard({ col }: { col: ColourScheme }) {
  const [diff, setDiff] = useState("level1");
  const [missing1, setMissing1] = useState(false);
  const [missing2, setMissing2] = useState(false);
  const [q, setQ] = useState<RectQuestion>(() => buildRectQ("level1"));
  const [show, setShow] = useState(false);
  function newQ() {
    const base = buildRectQ(diff);
    const mc = missing2 ? 2 : missing1 ? 1 : 0;
    setQ(mc > 0 ? { ...base, hiddenIdx: pickHidden(base.pts, base.edges, mc) } : { ...base, hiddenIdx: [] });
    setShow(false);
  }
  useEffect(() => { newQ(); }, [diff, missing1, missing2]); // eslint-disable-line react-hooks/exhaustive-deps
  return (<>
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-black">Difficulty:</span>
          <div className="flex gap-2">
            {["level1", "level2", "level3"].map((lvl, idx) => (
              <button key={lvl} onClick={() => setDiff(lvl)} className={"px-4 py-2 rounded-lg font-bold text-sm w-24 " + diffBtnClass(idx, diff === lvl)}>Level {idx + 1}</button>
            ))}
          </div>
          {(diff === "level2" || diff === "level3") && (
            <div className="flex flex-col gap-1 ml-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={missing1} onChange={e => { setMissing1(e.target.checked); if (e.target.checked) setMissing2(false); }} className="w-4 h-4" /><span className="text-sm font-semibold text-black">1 side missing</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={missing2} onChange={e => { setMissing2(e.target.checked); if (e.target.checked) setMissing1(false); }} className="w-4 h-4" /><span className="text-sm font-semibold text-black">2 sides missing</span></label>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={newQ} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 flex items-center gap-2 w-52"><RefreshCw size={18} />New Question</button>
          <button onClick={() => setShow(!show)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 flex items-center gap-2 w-52"><Eye size={18} />{show ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    </div>
    <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: col.qBg }}>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-black">Find the perimeter</span>
        {show && <span className="text-5xl font-bold ml-4" style={{ color: "#166534" }}>= {q.displayAnswer}</span>}
        {q.level === 3 && <p className="mt-2 text-xl font-semibold text-purple-700">Give your answer in centimetres (cm)</p>}
      </div>
      <div className="rounded-xl flex items-center justify-center p-6" style={{ width: "100%", minHeight: 480, backgroundColor: col.stepBg }}>
        <RectDiagram q={q} showAnswer={show} />
      </div>
    </div>
  </>);
}

function RectWorked({ col }: { col: ColourScheme }) {
  const [diff, setDiff] = useState("level1");
  const [q, setQ] = useState<RectQuestion>(() => buildRectQ("level1"));
  const [show, setShow] = useState(false);
  useEffect(() => { setQ(buildRectQ(diff)); setShow(false); }, [diff]);
  return (<>
    <ControlsBar difficulty={diff} setDifficulty={setDiff} onNew={() => { setQ(buildRectQ(diff)); setShow(false); }} onToggleAnswer={() => setShow(!show)} showAnswer={show} />
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: col.qBg }}>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-black">Find the perimeter</span>
        {q.level === 3 && <p className="mt-2 text-xl font-semibold text-purple-700">Give your answer in centimetres (cm)</p>}
      </div>
      <div className="flex justify-center mb-8"><RectDiagram q={q} showAnswer={show} /></div>
      {show && (<>
        <div className="space-y-4 mt-4">
          {q.working.slice(0, -1).map((s, i) => (
            <div key={i} className="rounded-xl p-5" style={{ backgroundColor: col.stepBg }}>
              <span className="text-sm font-bold uppercase tracking-wide text-gray-500 mr-3">Step {i + 1}</span>
              <span className="text-2xl font-semibold text-black">{s.text}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: col.finalBg }}>
          <span className="text-4xl font-bold" style={{ color: "#166534" }}>= {q.working[q.working.length - 1].text.replace("Perimeter = ", "")}</span>
        </div>
      </>)}
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════════════════════
// POLYGON PANELS
// ══════════════════════════════════════════════════════════════════════════════
function PolyWhiteboard({ col }: { col: ColourScheme }) {
  const [diff, setDiff] = useState("level1");
  const [q, setQ] = useState<PolyQuestion>(() => buildPolyQ("level1"));
  const [show, setShow] = useState(false);
  useEffect(() => { setQ(buildPolyQ(diff)); setShow(false); }, [diff]);
  return (<>
    <ControlsBar difficulty={diff} setDifficulty={setDiff} onNew={() => { setQ(buildPolyQ(diff)); setShow(false); }} onToggleAnswer={() => setShow(!show)} showAnswer={show} />
    <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: col.qBg }}>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-black">Find the perimeter of the {q.def.name.toLowerCase()}</span>
        {show && <span className="text-5xl font-bold ml-4" style={{ color: "#166534" }}>= {q.displayAnswer}</span>}
        {q.mixUnits && <p className="mt-2 text-xl font-semibold text-purple-700">Give your answer in centimetres (cm)</p>}
      </div>
      <div className="rounded-xl flex items-center justify-center p-6" style={{ width: "100%", minHeight: 480, backgroundColor: col.stepBg }}>
        <PolyDiagram q={q} showAnswer={show} />
      </div>
    </div>
  </>);
}

function PolyWorked({ col }: { col: ColourScheme }) {
  const [diff, setDiff] = useState("level1");
  const [q, setQ] = useState<PolyQuestion>(() => buildPolyQ("level1"));
  const [show, setShow] = useState(false);
  useEffect(() => { setQ(buildPolyQ(diff)); setShow(false); }, [diff]);
  return (<>
    <ControlsBar difficulty={diff} setDifficulty={setDiff} onNew={() => { setQ(buildPolyQ(diff)); setShow(false); }} onToggleAnswer={() => setShow(!show)} showAnswer={show} />
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: col.qBg }}>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-black">Find the perimeter of the {q.def.name.toLowerCase()}</span>
        {q.mixUnits && <p className="mt-2 text-xl font-semibold text-purple-700">Give your answer in centimetres (cm)</p>}
      </div>
      <div className="flex justify-center mb-8"><PolyDiagram q={q} showAnswer={show} /></div>
      {show && (<>
        <div className="space-y-4 mt-4">
          {q.working.slice(0, -1).map((s, i) => (
            <div key={i} className="rounded-xl p-5" style={{ backgroundColor: col.stepBg }}>
              <span className="text-sm font-bold uppercase tracking-wide text-gray-500 mr-3">Step {i + 1}</span>
              <span className="text-2xl font-semibold text-black">{s.text}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: col.finalBg }}>
          <span className="text-4xl font-bold" style={{ color: "#166534" }}>= {q.working[q.working.length - 1].text.replace("Perimeter = ", "")}</span>
        </div>
      </>)}
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function PerimeterTool() {
  const navigate = useNavigate();
  const [subtool, setSubtool] = useState("polygons");
  const [mode, setMode] = useState("whiteboard");
  const [scheme, setScheme] = useState<SchemeKey>("default");
  const [menuOpen, setMenuOpen] = useState(false);
  const col = SCHEMES[scheme];
  return (<>
          <div className="bg-blue-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg"><Home size={24} /><span className="font-semibold text-lg">Home</span></button>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg">{menuOpen ? <X size={28} /> : <Menu size={28} />}</button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50">
              <div className="py-2">
                <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Colour Scheme</div>
                {(["default", "blue", "pink", "yellow"] as SchemeKey[]).map(s => (
                  <button key={s} onClick={() => { setScheme(s); setMenuOpen(false); }} className={"w-full text-left px-6 py-3 font-semibold " + (scheme === s ? "bg-blue-100 text-blue-900" : "text-gray-800 hover:bg-gray-100")}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8 text-black">Perimeter</h1>
        <div className="flex justify-center gap-4 mb-6">
          {[["polygons", "Polygons"], ["rectilinear", "Rectilinear Shapes"]].map(([k, label]) => (
            <button key={k} onClick={() => setSubtool(k)}
              className={"px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl " + (subtool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900")}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
        <div className="flex justify-center gap-4 mb-8">
          {[["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)}
              className={"px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl " + (mode === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900")}>
              {label}
            </button>
          ))}
        </div>
        {subtool === "rectilinear" && mode === "whiteboard" && <RectWhiteboard col={col} />}
        {subtool === "rectilinear" && mode === "single"     && <RectWorked col={col} />}
        {subtool === "rectilinear" && mode === "worksheet"  && <WorksheetPanel col={col} buildQuestions={buildRectQuestions} DiagramComponent={RectDiagram as React.ComponentType<DiagramProps>} pdfType="rect" filename="perimeter-rectilinear.pdf" isRect />}
        {subtool === "polygons"    && mode === "whiteboard" && <PolyWhiteboard col={col} />}
        {subtool === "polygons"    && mode === "single"     && <PolyWorked col={col} />}
        {subtool === "polygons"    && mode === "worksheet"  && <WorksheetPanel col={col} buildQuestions={buildPolyQuestions} DiagramComponent={PolyDiagram as React.ComponentType<DiagramProps>} pdfType="polygon" filename="perimeter-polygons.pdf" />}
      </div>
    </div>
  </>);
}
