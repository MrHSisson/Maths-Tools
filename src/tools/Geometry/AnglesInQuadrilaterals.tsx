import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type PrintMode,
  type ToolMultiSelect,
  tStep,
} from "../../shared";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Pt { x: number; y: number; }

interface AngleLabel {
  label: string;
  isUnknown: boolean;
  value: number;
  reflex?: boolean;
  equalMark?: boolean;        // small tick on the arc to show equal angles
  arcVertex: Pt;
  arcFrom: Pt;
  arcTo: Pt;
}

interface TickEdge { a: Pt; b: Pt; count: number; }

interface QuadQuestion {
  tool: string;
  level: string;
  difficulty?: string;
  key?: string;
  edges: [Pt, Pt][];
  tickEdges?: TickEdge[];
  extensions?: { from: Pt; to: Pt }[];
  angles: AngleLabel[];
  answer: string;
  working: { text: string }[];
  id: number;
}
type QOVars = Record<string, unknown>;

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const SHAPE_MS: ToolMultiSelect = {
  key: "shape", label: "Shape",
  options: [
    { value: "kite", label: "Kite", defaultActive: true },
    { value: "arrowhead", label: "Arrowhead", defaultActive: true },
  ],
};
const FIND_MS: ToolMultiSelect = {
  key: "findType", label: "Find",
  options: [
    { value: "findEqual", label: "Find the equal angles", defaultActive: true },
    { value: "findVertex", label: "Find a vertex angle", defaultActive: true },
  ],
};
const EXTERIOR_MS: ToolMultiSelect = {
  key: "exterior", label: "Exterior Angles",
  options: [
    { value: "none", label: "None", defaultActive: true },
    { value: "one", label: "One", defaultActive: false },
    { value: "two", label: "Two", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Angles in a Quadrilateral",
  tools: {
    anglesInQuad: {
      name: "Angles in a Quadrilateral",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [EXTERIOR_MS] },
        level2: { variables: [], multiSelect: [SHAPE_MS, FIND_MS] },
        level3: { variables: [], dropdown: null },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Level 1 — Basic Quadrilateral", icon: "▱",
    content: [
      { label: "Overview", detail: "Three angles are given inside an irregular quadrilateral. Find the missing angle using the fact that angles in a quadrilateral sum to 360°." },
      { label: "Questions", detail: "Irregular (scalene) quadrilaterals shown in varied orientations." },
      { label: "Exterior angles", detail: "Choose None, One or Two extended sides. Where a side is extended, the exterior angle is given — use angles on a straight line (180°) to find the interior angle first, then apply the 360° rule." },
    ],
  },
  {
    title: "Level 2 — Kite & Arrowhead", icon: "◆",
    content: [
      { label: "Overview", detail: "A kite (and its concave cousin, the arrowhead/dart) has one pair of equal angles, shown by matching side ticks." },
      { label: "Find the equal angles", detail: "The two unequal (apex) angles are given. Use the 360° rule and the equal pair to find x." },
      { label: "Find a vertex angle", detail: "The equal pair and one apex are given — find the remaining apex (or the reflex angle of an arrowhead)." },
      { label: "Arrowhead", detail: "A concave kite. The angle at the notch is reflex (more than 180°)." },
    ],
  },
  {
    title: "Level 3 — Parallel Line Quadrilaterals", icon: "▰",
    content: [
      { label: "Coming soon", detail: "Parallelograms, rhombuses and trapeziums using angles in parallel lines rules." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question with blank working space." },
      { label: "Worked Example", detail: "Step-by-step solution revealed on demand." },
      { label: "Worksheet", detail: "Grid of questions with differentiated layout and PDF export." },
    ],
  },
];

// ─── GEOMETRY HELPERS ─────────────────────────────────────────────────────────
function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function toRad(d: number) { return d * Math.PI / 180; }

function rotatePts(pts: Pt[], rotDeg: number): Pt[] {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const c = Math.cos(toRad(rotDeg)), s = Math.sin(toRad(rotDeg));
  return pts.map(p => {
    const dx = p.x - cx, dy = p.y - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  });
}

function tickMarks(v1: Pt, v2: Pt, count: number, tickLen: number, spacing: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const mx = (v1.x + v2.x) / 2, my = (v1.y + v2.y) / 2;
  const dx = v2.x - v1.x, dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return [];
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const res: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spacing;
    const cx = mx + ux * off, cy = my + uy * off;
    res.push({ x1: cx - nx * tickLen / 2, y1: cy - ny * tickLen / 2, x2: cx + nx * tickLen / 2, y2: cy + ny * tickLen / 2 });
  }
  return res;
}

// ─── PLACEMENT ──────────────────────────────────────────────────────────────
// Level 1: general convex quad ABCD built from two triangles glued on diagonal AC.
// A (left) and C (right) lie on a horizontal diagonal; B is above, D below.
function placeQuad(A: number, B: number, C: number, pA: number): Pt[] {
  const pC = 180 - B - pA;          // split of C into triangle ABC
  const qA = A - pA, qC = C - pC;    // splits into triangle ACD
  const L = 200;
  const vA: Pt = { x: 0, y: 0 };
  const vC: Pt = { x: L, y: 0 };
  const tUp = L * Math.sin(toRad(pC)) / Math.sin(toRad(pA + pC));
  const vB: Pt = { x: tUp * Math.cos(toRad(pA)), y: -tUp * Math.sin(toRad(pA)) };
  const uDn = L * Math.sin(toRad(qC)) / Math.sin(toRad(qA + qC));
  const vD: Pt = { x: uDn * Math.cos(toRad(qA)), y: uDn * Math.sin(toRad(qA)) };
  return [vA, vB, vC, vD];
}

// Level 2: kite / arrowhead, symmetric about a vertical axis.
//   A = nose/top apex (angle alpha), B = right & D = left (equal angle beta),
//   C = bottom apex (kite, angle gamma) OR notch (arrowhead, reflex angle).
function placeKite(alpha: number, beta: number, isDart: boolean): Pt[] {
  const W = 100;
  const hb = W / Math.tan(toRad(alpha / 2));           // depth of A above the B/D line
  const vA: Pt = { x: 0, y: 0 };
  const vB: Pt = { x: W, y: hb };
  const vD: Pt = { x: -W, y: hb };
  let vC: Pt;
  if (isDart) {
    const nonReflex = alpha + 2 * beta;                // small angle of the notch
    const hc = hb - W / Math.tan(toRad(nonReflex / 2));
    vC = { x: 0, y: hc };
  } else {
    const gamma = 360 - alpha - 2 * beta;
    const lc = W / Math.tan(toRad(gamma / 2));
    vC = { x: 0, y: hb + lc };
  }
  return [vA, vB, vC, vD];
}

// ─── QUESTION GENERATION ──────────────────────────────────────────────────────
function resolveNumExt(vars: QOVars): number {
  const map: Record<string, number> = { none: 0, one: 1, two: 2 };
  const active = ["none", "one", "two"].filter(v => vars[v]);
  const pick = active.length ? active[rnd(0, active.length - 1)] : "none";
  return map[pick];
}

function buildLevel1(vars: QOVars): QuadQuestion {
  // Pick 4 widely-spread angles summing to 360, then find an assignment to the
  // diagonal-split construction that keeps every sub-angle >= MIN_SUB (which is
  // exactly what guarantees a convex, non-self-crossing quad). Trying all four
  // cyclic rotations lets us use whichever diagonal is feasible, so the angles
  // are free to roam a wide range without forcing them toward 90°.
  const MIN_ANG = 35, MAX_ANG = 150, MIN_SUB = 10;
  let A = 0, B = 0, C = 0, D = 0, pA = 0, found = false;
  for (let att = 0; att < 600 && !found; att++) {
    const a = rnd(MIN_ANG, MAX_ANG), b = rnd(MIN_ANG, MAX_ANG), c = rnd(MIN_ANG, MAX_ANG), d = 360 - a - b - c;
    if (d < MIN_ANG || d > MAX_ANG) continue;
    if (Math.max(a, b, c, d) - Math.min(a, b, c, d) < 45) continue;   // clearly irregular
    const base = [a, b, c, d];
    const shifts = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    for (const sh of shifts) {
      const A2 = base[sh], B2 = base[(sh + 1) % 4], C2 = base[(sh + 2) % 4], D2 = base[(sh + 3) % 4];
      const lo = Math.max(MIN_SUB, 180 - B2 - C2 + MIN_SUB);
      const hi = Math.min(A2 - MIN_SUB, 180 - B2 - MIN_SUB);
      if (lo > hi) continue;
      A = A2; B = B2; C = C2; D = D2; pA = rnd(lo, hi); found = true; break;
    }
  }
  if (!found) { A = 70; B = 110; C = 80; D = 100; pA = 35; }   // safe fallback

  const rot = rnd(0, 359);
  const [vA, vB, vC, vD] = rotatePts(placeQuad(A, B, C, pA), rot);
  const verts = [vA, vB, vC, vD];
  const vals = [A, B, C, D];
  const unknownIdx = rnd(0, 3);

  // Choose which of the three given vertices are shown as exterior angles.
  const numExt = Math.min(resolveNumExt(vars), 2);
  const givenIdx = [0, 1, 2, 3].filter(i => i !== unknownIdx).sort(() => Math.random() - 0.5);
  const extIdx = new Set(givenIdx.slice(0, numExt));

  const extensions: { from: Pt; to: Pt }[] = [];
  const angles: AngleLabel[] = verts.map((v, i) => {
    const prev = verts[(i + 3) % 4], next = verts[(i + 1) % 4];
    if (i !== unknownIdx && extIdx.has(i)) {
      // extend one side past the vertex; the exterior angle = 180 − interior
      const extendPrev = rnd(0, 1) === 0;
      const base = extendPrev ? prev : next;     // side base→v is extended beyond v
      const other = extendPrev ? next : prev;    // exterior measured to this side
      const dx = v.x - base.x, dy = v.y - base.y, len = Math.hypot(dx, dy) || 1;
      const extLen = Math.min(140, Math.max(70, len * 0.5));
      const E: Pt = { x: v.x + dx / len * extLen, y: v.y + dy / len * extLen };
      extensions.push({ from: v, to: E });
      return { label: `${180 - vals[i]}°`, isUnknown: false, value: 180 - vals[i], arcVertex: v, arcFrom: E, arcTo: other };
    }
    return {
      label: i === unknownIdx ? "x" : `${vals[i]}°`,
      isUnknown: i === unknownIdx,
      value: vals[i],
      arcVertex: v, arcFrom: prev, arcTo: next,
    };
  });

  const givenInterior = givenIdx.slice().sort((a, b) => a - b).map(i => vals[i]);
  const knownSum = givenInterior.reduce((s, v) => s + v, 0);
  const working: { text: string }[] = [{ text: "Angles in a quadrilateral sum to 360°" }];
  if (extIdx.size > 0) {
    working.push({ text: "Angles on a straight line sum to 180°" });
    [...extIdx].sort((a, b) => a - b).forEach(i => {
      working.push({ text: `Interior angle = 180° − ${180 - vals[i]}° = ${vals[i]}°` });
    });
  }
  working.push(
    { text: `${givenInterior.join("° + ")}° + x = 360°` },
    { text: `${knownSum}° + x = 360°` },
    { text: `x = 360° − ${knownSum}°` },
    { text: `x = ${vals[unknownIdx]}°` },
  );

  return {
    tool: "anglesInQuad", level: "level1",
    edges: [[vA, vB], [vB, vC], [vC, vD], [vD, vA]],
    extensions: extensions.length ? extensions : undefined,
    angles,
    answer: `x = ${vals[unknownIdx]}°`,
    working,
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function pickKiteAngles(isDart: boolean): { alpha: number; beta: number; cAngle: number } {
  // alpha = top apex, beta = equal pair, cAngle = bottom apex (or reflex for dart)
  for (let att = 0; att < 600; att++) {
    if (isDart) {
      const alpha = rnd(24, 120);
      const beta = rnd(22, 88);
      const reflex = 360 - alpha - 2 * beta;
      if (reflex < 186 || reflex > 312) continue;
      if (Math.abs(alpha - beta) < 6) continue;
      return { alpha, beta, cAngle: reflex };
    }
    const alpha = rnd(30, 158);
    const beta = rnd(35, 150);
    const gamma = 360 - alpha - 2 * beta;
    if (gamma < 30 || gamma > 162) continue;
    if (Math.abs(alpha - gamma) < 10) continue;          // keep it clearly a kite
    if (Math.abs(alpha - beta) < 6 || Math.abs(gamma - beta) < 6) continue;
    return { alpha, beta, cAngle: gamma };
  }
  return isDart ? { alpha: 50, beta: 40, cAngle: 230 } : { alpha: 70, beta: 110, cAngle: 70 };
}

function buildLevel2(vars: QOVars): QuadQuestion {
  const shapes: string[] = [];
  if (vars.kite !== false) shapes.push("kite");
  if (vars.arrowhead) shapes.push("arrowhead");
  const shapePool = shapes.length ? shapes : ["kite"];
  const isDart = shapePool[rnd(0, shapePool.length - 1)] === "arrowhead";

  const finds: string[] = [];
  if (vars.findEqual !== false) finds.push("findEqual");
  if (vars.findVertex) finds.push("findVertex");
  const findPool = finds.length ? finds : ["findEqual"];
  const findType = findPool[rnd(0, findPool.length - 1)];

  const { alpha, beta, cAngle } = pickKiteAngles(isDart);
  const rot = rnd(-22, 22);
  const [vA, vB, vC, vD] = rotatePts(placeKite(alpha, beta, isDart), rot);
  const verts = [vA, vB, vC, vD];
  const vals = [alpha, beta, cAngle, beta];   // A, B, C, D
  const shapeWord = isDart ? "arrowhead" : "kite";

  // index 1 (B) and 3 (D) are the equal pair; 0 (A) and 2 (C) are apexes.
  const mk = (i: number, unknown: boolean, equalMark: boolean): AngleLabel => ({
    label: unknown ? "x" : `${vals[i]}°`,
    isUnknown: unknown,
    value: vals[i],
    reflex: i === 2 && isDart,
    equalMark,
    arcVertex: verts[i],
    arcFrom: verts[(i + 3) % 4],
    arcTo: verts[(i + 1) % 4],
  });

  let angles: AngleLabel[];
  let answer: string;
  let working: { text: string }[];
  const cWord = isDart ? "reflex angle" : `${cAngle}°`;

  if (findType === "findEqual") {
    // apexes given, find the equal pair x = beta
    angles = [mk(0, false, false), mk(1, true, true), mk(2, false, false), mk(3, true, true)];
    answer = `x = ${beta}°`;
    working = [
      { text: "Angles in a quadrilateral sum to 360°" },
      { text: `A ${shapeWord} has one pair of equal angles` },
      { text: `x + x + ${alpha}° + ${cAngle}° = 360°` },
      { text: `2x = 360° − ${alpha}° − ${cAngle}°` },
      { text: `2x = ${360 - alpha - cAngle}°` },
      { text: `x = ${beta}°` },
    ];
  } else {
    // equal pair given, find one apex (A or, for darts, the reflex C)
    const unknownApex = isDart ? (rnd(0, 1) === 0 ? 0 : 2) : (rnd(0, 1) === 0 ? 0 : 2);
    angles = [mk(0, unknownApex === 0, false), mk(1, false, true), mk(2, unknownApex === 2, false), mk(3, false, true)];
    if (unknownApex === 0) {
      answer = `x = ${alpha}°`;
      working = [
        { text: "Angles in a quadrilateral sum to 360°" },
        { text: `The two marked angles are equal (${beta}°)` },
        { text: `x + ${beta}° + ${cAngle}° + ${beta}° = 360°` },
        { text: `x = 360° − ${cAngle}° − 2 × ${beta}°` },
        { text: `x = ${alpha}°` },
      ];
    } else {
      answer = `x = ${cAngle}°`;
      working = [
        { text: "Angles in a quadrilateral sum to 360°" },
        { text: `The two marked angles are equal (${beta}°)` },
        { text: `x + ${alpha}° + ${beta}° + ${beta}° = 360°` },
        { text: `x = 360° − ${alpha}° − 2 × ${beta}°` },
        ...(isDart ? [{ text: "The angle at the notch is reflex (more than 180°)" }] : []),
        { text: `x = ${cAngle}°` },
      ];
    }
    void cWord;
  }

  // equal-side tick marks: A's sides single, C's sides double
  const tickEdges: TickEdge[] = [
    { a: vA, b: vB, count: 1 }, { a: vA, b: vD, count: 1 },
    { a: vC, b: vB, count: 2 }, { a: vC, b: vD, count: 2 },
  ];

  return {
    tool: "anglesInQuad", level: "level2",
    edges: [[vA, vB], [vB, vC], [vC, vD], [vD, vA]],
    tickEdges, angles, answer, working,
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildQuadQuestion(tool: string, level: string, vars: QOVars): QuadQuestion {
  let q: QuadQuestion;
  if (level === "level2") q = buildLevel2(vars);
  else q = buildLevel1(vars);
  q.difficulty = level;
  q.key = `${tool}-${level}-${q.id}`;
  return q;
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const vars: QOVars = { ...variables, ...(multiSelectValues ?? {}) };
  const q = buildQuadQuestion(tool, level, vars);
  return {
    kind: "simple",
    display: "Find x",
    answer: q.answer,
    working: q.working.map(w => tStep(w.text)),
    key: q.key ?? `${q.tool}-${level}-${q.id}`,
    difficulty: level,
    _diagram: q,
  } as unknown as AnyQuestion;
}

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────
function estTW(s: string, fs: number) { return s.length * fs * 0.6; }

interface DiagramProps { q: QuadQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number; }

function QuadDiagram({ q, showAnswer, small = false, dataIndex }: DiagramProps) {
  // Geometry is fitted into a fixed `size` box, then the final viewBox is made
  // SQUARE (so tall kites/arrowheads never overflow their panel) and the font /
  // stroke widths are scaled to the viewBox so they read consistently on screen.
  const size = small ? 230 : 380;
  const tfp = small ? 16 : 26;          // base font in size-space
  const arcR = small ? 16 : 24;
  const unknownArcR = small ? 20 : 30;
  const leaderLen = small ? 32 : 52;
  const refSide = small ? 300 : 470;    // typical square side → keeps fs ~ tfp

  const geomPts: Pt[] = q.edges.flatMap(([a, b]) => [a, b]);
  q.extensions?.forEach(e => geomPts.push(e.to));
  const gMinX = Math.min(...geomPts.map(p => p.x)), gMaxX = Math.max(...geomPts.map(p => p.x));
  const gMinY = Math.min(...geomPts.map(p => p.y)), gMaxY = Math.max(...geomPts.map(p => p.y));
  const scl = size / Math.max(gMaxX - gMinX, gMaxY - gMinY, 1);
  const cxG = (gMinX + gMaxX) / 2, cyG = (gMinY + gMaxY) / 2;
  const tx = (x: number) => (x - cxG) * scl + size / 2;
  const ty = (y: number) => (y - cyG) * scl + size / 2;
  const tp = (p: Pt): Pt => ({ x: tx(p.x), y: ty(p.y) });
  const centroid: Pt = {
    x: tx(geomPts.reduce((s, p) => s + p.x, 0) / geomPts.length),
    y: ty(geomPts.reduce((s, p) => s + p.y, 0) / geomPts.length),
  };

  function outwardBisector(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, reflex: boolean): Pt {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const ax = f.x - v.x, ay = f.y - v.y, cx = t2.x - v.x, cy = t2.y - v.y;
    const lenA = Math.hypot(ax, ay), lenC = Math.hypot(cx, cy);
    if (lenA < 0.001 || lenC < 0.001) return { x: 0, y: -1 };
    const bx = ax / lenA + cx / lenC, by = ay / lenA + cy / lenC;
    const blen = Math.hypot(bx, by);
    if (blen < 0.001) return { x: -ay / lenA, y: ax / lenA };
    // points outward (away from neighbours); for reflex the label sits on the
    // opposite side, so flip it.
    const sign = reflex ? 1 : -1;
    return { x: sign * (bx / blen), y: sign * (by / blen) };
  }

  function labelLayout(ang: AngleLabel, r: number): { tip: Pt; labelPt: Pt } {
    const v = tp(ang.arcVertex), ob = outwardBisector(ang.arcVertex, ang.arcFrom, ang.arcTo, !!ang.reflex);
    const tip: Pt = { x: v.x - ob.x * (r / 2), y: v.y - ob.y * (r / 2) };
    const cos45 = Math.SQRT2 / 2;
    const dirCW: Pt = { x: ob.x * cos45 + ob.y * cos45, y: -ob.x * cos45 + ob.y * cos45 };
    const dirCCW: Pt = { x: ob.x * cos45 - ob.y * cos45, y: ob.x * cos45 + ob.y * cos45 };
    const labelCW: Pt = { x: tip.x + dirCW.x * leaderLen, y: tip.y + dirCW.y * leaderLen };
    const labelCCW: Pt = { x: tip.x + dirCCW.x * leaderLen, y: tip.y + dirCCW.y * leaderLen };
    const distCW = Math.hypot(labelCW.x - centroid.x, labelCW.y - centroid.y);
    const distCCW = Math.hypot(labelCCW.x - centroid.x, labelCCW.y - centroid.y);
    return { tip, labelPt: distCW >= distCCW ? labelCW : labelCCW };
  }

  const labelLayouts = q.angles.map(ang => labelLayout(ang, ang.isUnknown ? unknownArcR : arcR));

  // Square viewBox covering the shape + (roughly-sized) label boxes.
  const roughHX = small ? 26 : 42, roughHY = small ? 13 : 20;
  const bpts: number[][] = geomPts.map(p => { const t = tp(p); return [t.x, t.y]; });
  labelLayouts.forEach(l => { bpts.push([l.labelPt.x - roughHX, l.labelPt.y - roughHY], [l.labelPt.x + roughHX, l.labelPt.y + roughHY]); });
  const pad = small ? 8 : 14;
  const bx0 = Math.min(...bpts.map(p => p[0])) - pad, by0 = Math.min(...bpts.map(p => p[1])) - pad;
  const bx1 = Math.max(...bpts.map(p => p[0])) + pad, by1 = Math.max(...bpts.map(p => p[1])) + pad;
  const side = Math.max(bx1 - bx0, by1 - by0);
  const bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;

  const k = side / refSide;                 // scale visual sizes to the viewBox
  const fontSize = tfp * k;
  const strokeW = (small ? 2 : 2.5) * k;
  const arcStrokeU = (small ? 2 : 2.5) * k, arcStrokeK = (small ? 1.5 : 2) * k;
  const arrowSize = (small ? 5 : 7) * k;
  const tickLen = (small ? 9 : 13) * k, tickSpace = (small ? 5 : 7) * k;
  const tps = (p: Pt): Pt => p;

  function sweep(v: Pt, f: Pt, t2: Pt, reflex: boolean) {
    const a1 = Math.atan2(f.y - v.y, f.x - v.x), a2 = Math.atan2(t2.y - v.y, t2.x - v.x);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (reflex) diff = diff > 0 ? diff - 2 * Math.PI : diff + 2 * Math.PI;
    return { a1, a2, diff };
  }

  function arcPath(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number, reflex: boolean): string {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const { a1, diff } = sweep(v, f, t2, reflex);
    const sx = v.x + r * Math.cos(a1), sy = v.y + r * Math.sin(a1);
    const ex = v.x + r * Math.cos(a1 + diff), ey = v.y + r * Math.sin(a1 + diff);
    const large = Math.abs(diff) > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${diff > 0 ? 1 : 0} ${ex} ${ey}`;
  }

  function sectorFill(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number, reflex: boolean): string {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const { a1, diff } = sweep(v, f, t2, reflex);
    const sx = v.x + r * Math.cos(a1), sy = v.y + r * Math.sin(a1);
    const ex = v.x + r * Math.cos(a1 + diff), ey = v.y + r * Math.sin(a1 + diff);
    const large = Math.abs(diff) > Math.PI ? 1 : 0;
    return `M ${v.x} ${v.y} L ${sx} ${sy} A ${r} ${r} 0 ${large} ${diff > 0 ? 1 : 0} ${ex} ${ey} Z`;
  }

  function equalTick(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number, reflex: boolean): JSX.Element {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const { a1, diff } = sweep(v, f, t2, reflex);
    const mid = a1 + diff / 2;
    const inner = r - (small ? 3 : 5), outer = r + (small ? 3 : 5);
    return <line x1={v.x + inner * Math.cos(mid)} y1={v.y + inner * Math.sin(mid)} x2={v.x + outer * Math.cos(mid)} y2={v.y + outer * Math.sin(mid)} stroke="#475569" strokeWidth={arcStrokeK} />;
  }

  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg viewBox={`${bcx - side / 2} ${bcy - side / 2} ${side} ${side}`} style={{ display: "block", overflow: "visible", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet" {...extraProps}>
      {q.extensions?.map((e, i) => <line key={`x${i}`} x1={tx(e.from.x)} y1={ty(e.from.y)} x2={tx(e.to.x)} y2={ty(e.to.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />)}
      {q.edges.map(([a, b], i) => <line key={`e${i}`} x1={tx(a.x)} y1={ty(a.y)} x2={tx(b.x)} y2={ty(b.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />)}
      {q.tickEdges?.flatMap((te, i) => tickMarks(tp(te.a), tp(te.b), te.count, tickLen, tickSpace).map((t, ti) => <line key={`tk-${i}-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />))}
      {q.angles.map((ang, i) => !ang.isUnknown ? null : <path key={`sh-${i}`} d={sectorFill(ang.arcVertex, ang.arcFrom, ang.arcTo, unknownArcR, !!ang.reflex)} fill="#bfdbfe" fillOpacity="0.45" stroke="none" />)}
      {q.angles.map((ang, i) => <path key={`arc-${i}`} d={arcPath(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR, !!ang.reflex)} fill="none" stroke={ang.isUnknown ? "#2563eb" : "#475569"} strokeWidth={ang.isUnknown ? arcStrokeU : arcStrokeK} />)}
      {q.angles.map((ang, i) => ang.equalMark ? <g key={`eq-${i}`}>{equalTick(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR, !!ang.reflex)}</g> : null)}
      {q.angles.map((ang, i) => {
        const layout = labelLayouts[i];
        const tip = tps(layout.tip), lp = tps(layout.labelPt);
        const label = ang.isUnknown && !showAnswer ? ang.label : ang.isUnknown ? `${ang.value}°` : ang.label;
        const tw = estTW(label, fontSize), th = fontSize * 1.4;
        const colour = ang.isUnknown ? "#2563eb" : "#6b7280";
        const dx = tip.x - lp.x, dy = tip.y - lp.y, dlen = Math.hypot(dx, dy);
        const ux = dlen > 0.001 ? dx / dlen : 0, uy = dlen > 0.001 ? dy / dlen : 0;
        const boxPadX = 4 * k, boxPadY = 2 * k;
        const boxHalfW = tw / 2 + boxPadX, boxHalfH = th / 2 + boxPadY;
        const tEdge = dlen > 0.001 ? Math.min(Math.abs(boxHalfW / (ux || 0.0001)), Math.abs(boxHalfH / (uy || 0.0001))) : 0;
        const lineStart: Pt = { x: lp.x + ux * (tEdge + 2 * k), y: lp.y + uy * (tEdge + 2 * k) };
        const px = -uy, py = ux;
        const arrowBase: Pt = { x: tip.x - ux * arrowSize, y: tip.y - uy * arrowSize };
        const arrowPt1: Pt = { x: arrowBase.x + px * arrowSize * 0.45, y: arrowBase.y + py * arrowSize * 0.45 };
        const arrowPt2: Pt = { x: arrowBase.x - px * arrowSize * 0.45, y: arrowBase.y - py * arrowSize * 0.45 };
        return (
          <g key={`lbl-${i}`}>
            <line x1={lineStart.x} y1={lineStart.y} x2={arrowBase.x} y2={arrowBase.y} stroke={colour} strokeWidth={(small ? 1 : 1.5) * k} strokeDasharray={small ? "3 2" : "5 3"} strokeLinecap="round" />
            <polygon points={`${tip.x},${tip.y} ${arrowPt1.x},${arrowPt1.y} ${arrowPt2.x},${arrowPt2.y}`} fill={colour} />
            <rect x={lp.x - tw / 2 - boxPadX} y={lp.y - th / 2 - boxPadY} width={tw + 2 * boxPadX} height={th + 2 * boxPadY} rx={4 * k} fill="#ffffff" fillOpacity="0.97" stroke="#000000" strokeWidth={0.6 * k} />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontWeight={ang.isUnknown ? "bold" : "600"} fontStyle={ang.isUnknown && !showAnswer ? "italic" : "normal"} fill={ang.isUnknown ? "#1d4ed8" : "#111827"}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── RENDERER ─────────────────────────────────────────────────────────────────
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number): JSX.Element | null => {
  const d = (q as any)._diagram as QuadQuestion | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <QuadDiagram q={d} showAnswer={showAnswer} small={compact === true} dataIndex={idx} />
    </div>
  );
};

// ─── PRINT ──────────────────────────────────────────────────────────────────
const PRINT_COLS = 3, PRINT_ROWS = 5, PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function customPrintHandler(questions: AnyQuestion[], printMode: PrintMode, container: HTMLElement | null): void {
  const svgList: string[] = [];
  if (container) {
    container.querySelectorAll<SVGSVGElement>("svg[data-q-index]").forEach(el => {
      const clone = el.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", "100%");
      clone.setAttribute("height", "100%");
      svgList.push(clone.outerHTML);
    });
  }

  const isDiff = new Set(questions.map(q => q.difficulty)).size > 1;
  const toolName = TOOL_CONFIG.pageTitle;
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const cell = (q: AnyQuestion, gi: number, li: number, showAns: boolean): string =>
    `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-diag">${svgList[gi] ?? ""}</div>${showAns ? `<div class="answer">${q.answer}</div>` : ""}</div>`;

  const stdPage = (qs: AnyQuestion[], start: number, pn: number, tp: number, ans: boolean): string => {
    const cells = qs.map((q, i) => cell(q, start + i, start + i, ans)).join("");
    const title = toolName + (ans ? " — Answers" : "");
    const pageLabel = tp > 1 ? ` &middot; Page ${pn} of ${tp}` : "";
    return `<div class="page"><div class="ph"><h1>${title}</h1><div class="meta">Worksheet &middot; ${dateStr}${pageLabel}</div></div><div class="sg">${cells}</div></div>`;
  };

  const buildStd = (ans: boolean): string => {
    const tp = Math.ceil(questions.length / PRINT_PER_PAGE);
    const pages: string[] = [];
    for (let p = 0; p < questions.length; p += PRINT_PER_PAGE) {
      pages.push(stdPage(questions.slice(p, p + PRINT_PER_PAGE), p, Math.floor(p / PRINT_PER_PAGE) + 1, tp, ans));
    }
    return pages.join("");
  };

  const buildDiff = (ans: boolean): string => {
    const byLv: Record<DifficultyLevel, AnyQuestion[]> = {
      level1: questions.filter(q => q.difficulty === "level1"),
      level2: questions.filter(q => q.difficulty === "level2"),
      level3: questions.filter(q => q.difficulty === "level3"),
    };
    const offsets: Record<DifficultyLevel, number> = { level1: 0, level2: byLv.level1.length, level3: byLv.level1.length + byLv.level2.length };
    const tp = Math.max(1, Math.ceil(Math.max(...(["level1", "level2", "level3"] as DifficultyLevel[]).map(lv => byLv[lv].length)) / PRINT_ROWS));
    const title = toolName + (ans ? " — Answers" : "");
    return Array.from({ length: tp }, (_, p) => {
      const cols = (["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
        const textCol = ["#166534", "#854d0e", "#991b1b"][li];
        const bgCol = ["#dcfce7", "#fef9c3", "#fee2e2"][li];
        const label = ["Level 1", "Level 2", "Level 3"][li];
        const qs = byLv[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const cells = qs.map((q, i) => cell(q, offsets[lv] + p * PRINT_ROWS + i, p * PRINT_ROWS + i, ans)).join("");
        return `<div class="dc"><div class="dh" style="color:${textCol};background:${bgCol}">${label}</div><div class="dcs">${cells}</div></div>`;
      }).join("");
      const pageLabel = tp > 1 ? ` &middot; Page ${p + 1} of ${tp}` : "";
      return `<div class="page"><div class="ph"><h1>${title}</h1><div class="meta">Differentiated &middot; ${dateStr}${pageLabel}</div></div><div class="dg">${cols}</div></div>`;
    }).join("");
  };

  const build = (ans: boolean): string => (isDiff ? buildDiff(ans) : buildStd(ans));
  const body = printMode === "questions" ? build(false) : printMode === "answers" ? build(true) : build(false) + build(true);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 portrait;margin:12mm}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:186mm;height:273mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}
  .page:last-child{page-break-after:auto}
  .ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;flex-shrink:0}
  .ph h1{font-size:5mm;font-weight:700;color:#1e3a8a}
  .meta{font-size:3mm;color:#6b7280}
  .sg{display:grid;grid-template-columns:repeat(${PRINT_COLS},1fr);grid-template-rows:repeat(${PRINT_ROWS},1fr);gap:2mm;flex:1;min-height:0}
  .dg{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm;flex:1;min-height:0}
  .dc{display:flex;flex-direction:column;gap:2mm;min-height:0}
  .dh{text-align:center;font-size:3.5mm;font-weight:700;padding:1.5mm 0;border-radius:1.5mm;flex-shrink:0}
  .dcs{display:flex;flex-direction:column;gap:2mm;flex:1;min-height:0}
  .cell{border:.3mm solid #d1d5db;border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2mm;overflow:hidden;flex:1;min-height:0;position:relative}
  .cell-num{position:absolute;top:1.5mm;left:2mm;font-size:2.8mm;font-weight:700;color:#374151}
  .cell-diag{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .cell-diag svg{width:100%;height:100%;overflow:visible}
  .answer{font-size:3mm;font-weight:700;color:#059669;text-align:center;flex-shrink:0;margin-top:1mm}
</style>
</head><body>${body}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      customPrintHandler={customPrintHandler}
      defaults={{ fixedColumns: true, numColumns: 3, comingSoonLevels: ["level3"] }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2"] };
