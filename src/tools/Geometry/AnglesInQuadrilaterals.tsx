import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type PrintMode,
  type ToolMultiSelect, type ToolVariable,
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
  hidden?: boolean;           // vertex left completely unmarked (identify it yourself)
  arcVertex: Pt;
  arcFrom: Pt;
  arcTo: Pt;
}

interface TickEdge { a: Pt; b: Pt; count: number; }
interface ParallelEdge { a: Pt; b: Pt; count: number; }

interface QuadQuestion {
  tool: string;
  level: string;
  difficulty?: string;
  key?: string;
  edges: [Pt, Pt][];
  tickEdges?: TickEdge[];
  parallelEdges?: ParallelEdge[];
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
    { value: "findApex", label: "Find an apex angle", defaultActive: true },
    { value: "findBase", label: "Find a base angle", sub: "(from its pair)", defaultActive: false },
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
const MARK_EQUAL_VAR: ToolVariable = { key: "markEqual", label: "Mark the equal angles", defaultValue: false };
const ALG_MS: ToolMultiSelect = {
  key: "algebra", label: "Question Type",
  options: [
    { value: "justX", label: "x", defaultActive: true },
    { value: "constant", label: "x + a", sub: "(constant)", defaultActive: false },
    { value: "coefficient", label: "ax", sub: "(coefficient)", defaultActive: false },
    { value: "both", label: "ax + b", sub: "(both)", defaultActive: false },
  ],
};

// ── Level 3: parallel-line quadrilaterals ──
const SHAPE3_MS: ToolMultiSelect = {
  key: "shape3", label: "Shape",
  options: [
    { value: "parallelogram", label: "Parallelogram", defaultActive: true },
    { value: "rhombus", label: "Rhombus", defaultActive: true },
    { value: "trapezium", label: "Trapezium", defaultActive: true },
  ],
};
const FIND3_MS: ToolMultiSelect = {
  key: "find3", label: "Find",
  options: [
    { value: "coInterior", label: "Co-interior angle", sub: "(sum to 180°)", defaultActive: true },
    { value: "opposite", label: "Opposite angle", sub: "(equal — not trapezium)", defaultActive: true },
    { value: "findAll", label: "Find all remaining angles", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Angles in a Quadrilateral",
  tools: {
    anglesInQuad: {
      name: "Angles in a Quadrilateral",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [ALG_MS, EXTERIOR_MS] },
        level2: { variables: [MARK_EQUAL_VAR], multiSelect: [SHAPE_MS, FIND_MS, ALG_MS] },
        level3: { variables: [], multiSelect: [SHAPE3_MS, FIND3_MS, ALG_MS] },
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
      { label: "Algebraic angles", detail: "The unknown angle can be an expression: x, x + a (constant), ax (coefficient) or ax + b. Form an equation with the 360° sum and solve for x." },
    ],
  },
  {
    title: "Level 2 — Kite & Arrowhead", icon: "◆",
    content: [
      { label: "Overview", detail: "A kite (and its concave cousin, the arrowhead/dart) has one pair of equal angles, shown by matching side ticks. The apex angles sit on the line of symmetry; the equal pair (base angles) sit either side of it." },
      { label: "Find the equal angles", detail: "The two apex angles are given. Use the 360° rule with the equal pair (2x) to find x." },
      { label: "Find an apex angle", detail: "The equal pair and the other apex are given — find the remaining apex using the 360° rule. On an arrowhead the unknown apex may be the reflex angle at the notch (more than 180°)." },
      { label: "Find a base angle", detail: "One of the equal pair is given — the other is equal to it, so no 360° calculation is needed. Isolates the 'a kite has one pair of equal angles' fact." },
      { label: "Algebraic angles", detail: "Apex and base questions can show the unknown as an expression: x, x + a (constant), ax (coefficient) or ax + b. Form an equation and solve for x." },
      { label: "Arrowhead", detail: "A concave kite. The angle at the notch is reflex (more than 180°)." },
      { label: "Mark the equal angles", detail: "Off by default — students identify the equal angles from the side ticks themselves (and one of the pair may be left unmarked). Turn it on to mark the equal pair with matching arc ticks." },
    ],
  },
  {
    title: "Level 3 — Parallel Line Quadrilaterals", icon: "▰",
    content: [
      { label: "Overview", detail: "Parallelograms, rhombuses and trapeziums, with their parallel sides marked by matching arrows. One (or two) angles are given; find the rest using the angles-in-parallel-lines rules." },
      { label: "Co-interior angle", detail: "Two angles between the same pair of parallel sides (on one side of a connecting side) add up to 180°. Works for all three shapes. The unknown is the angle at the other end of a side." },
      { label: "Opposite angle", detail: "In a parallelogram (and a rhombus) opposite angles are equal — no calculation needed. Not available for a trapezium, whose opposite angles are generally unequal." },
      { label: "Find all remaining angles", detail: "Parallelogram/rhombus: one angle is given — find the other three (one equal opposite angle, two co-interior). Trapezium: the two angles on one parallel side are given — find the two co-interior angles facing them. Unknowns are labelled a, b, c." },
      { label: "Rhombus", detail: "A parallelogram with four equal sides (shown by side ticks). The angle rules are identical to a parallelogram." },
      { label: "Algebraic angles", detail: "Co-interior and opposite questions can show the unknown as x, x + a, ax or ax + b. Form an equation from the rule and solve for x. (Find-all questions stay numeric.)" },
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

// Parallel-side arrow marks (chevrons pointing along the edge). `count` chevrons
// distinguish one parallel pair from another (single vs double).
function parallelMarks(v1: Pt, v2: Pt, count: number, size: number, spacing: number): { tip: Pt; w1: Pt; w2: Pt }[] {
  const mx = (v1.x + v2.x) / 2, my = (v1.y + v2.y) / 2;
  const dx = v2.x - v1.x, dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return [];
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const res: { tip: Pt; w1: Pt; w2: Pt }[] = [];
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spacing;
    const cx = mx + ux * off, cy = my + uy * off;
    res.push({
      tip: { x: cx + ux * size, y: cy + uy * size },
      w1: { x: cx - ux * size + nx * size, y: cy - uy * size + ny * size },
      w2: { x: cx - ux * size - nx * size, y: cy - uy * size - ny * size },
    });
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

// Level 3: parallelogram / rhombus. A (bottom-left), B (bottom-right),
//   C (top-right), D (top-left). Interior angle at A is `theta`; `lean` (±1)
//   tips the shape left or right. Sides AB & DC are parallel, AD & BC are parallel.
function placeParallelogram(theta: number, base: number, side: number, lean: number): Pt[] {
  const dx = lean * side * Math.cos(toRad(theta));
  const dy = -side * Math.sin(toRad(theta));   // up the screen
  const vA: Pt = { x: 0, y: 0 };
  const vB: Pt = { x: base, y: 0 };
  const vD: Pt = { x: dx, y: dy };
  const vC: Pt = { x: base + dx, y: dy };
  return [vA, vB, vC, vD];
}

// Level 3: trapezium with the horizontal pair AB (bottom) ∥ DC (top) parallel.
//   Base angles thetaL (at A) and thetaR (at B); top angles are 180−thetaL and
//   180−thetaR. `height` is the gap between the parallel sides.
function placeTrapezium(thetaL: number, thetaR: number, base: number, height: number): Pt[] {
  const vA: Pt = { x: 0, y: 0 };
  const vB: Pt = { x: base, y: 0 };
  const vD: Pt = { x: height / Math.tan(toRad(thetaL)), y: -height };
  const vC: Pt = { x: base - height / Math.tan(toRad(thetaR)), y: -height };
  return [vA, vB, vC, vD];
}

// ─── QUESTION GENERATION ──────────────────────────────────────────────────────
function resolveNumExt(vars: QOVars): number {
  const map: Record<string, number> = { none: 0, one: 1, two: 2 };
  const active = ["none", "one", "two"].filter(v => vars[v]);
  const pick = active.length ? active[rnd(0, active.length - 1)] : "none";
  return map[pick];
}

function exprLabel(c: number, k: number): string {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  return k > 0 ? `${base} + ${k}` : `${base} − ${Math.abs(k)}`;
}

// Resolve the algebra type and produce the unknown's coefficient/constant/x.
// Returns null for the plain numeric case (interior value comes from the quad).
function resolveAlgebra(vars: QOVars): { c: number; k: number; x: number; interior: number } | null {
  const active = ["justX", "constant", "coefficient", "both"].filter(v => vars[v]);
  const type = active.length ? active[rnd(0, active.length - 1)] : "justX";
  if (type === "justX") return null;
  const LO = 40, HI = 150;
  for (let att = 0; att < 200; att++) {
    if (type === "coefficient") {
      const c = rnd(2, 4), x = rnd(Math.ceil(LO / c), Math.floor(HI / c)), interior = c * x;
      if (interior >= LO && interior <= HI) return { c, k: 0, x, interior };
    } else if (type === "constant") {
      const k = rnd(10, 40), x = rnd(Math.max(8, LO - k), HI - k), interior = x + k;
      if (interior >= LO && interior <= HI) return { c: 1, k, x, interior };
    } else {                                   // both
      const c = rnd(2, 4), k = rnd(8, 30);
      const x = rnd(Math.max(5, Math.ceil((LO - k) / c)), Math.floor((HI - k) / c)), interior = c * x + k;
      if (interior >= LO && interior <= HI) return { c, k, x, interior };
    }
  }
  return { c: 1, k: 0, x: 90, interior: 90 };
}

function buildLevel1(vars: QOVars): QuadQuestion {
  // Pick 4 widely-spread angles summing to 360, then find an assignment to the
  // diagonal-split construction that keeps every sub-angle >= MIN_SUB (which is
  // exactly what guarantees a convex, non-self-crossing quad). Trying all four
  // cyclic rotations lets us use whichever diagonal is feasible, so the angles
  // are free to roam a wide range without forcing them toward 90°.
  const MIN_ANG = 35, MAX_ANG = 150, MIN_SUB = 10;
  const alg = resolveAlgebra(vars);
  // When algebraic, the unknown interior is pinned by the expression; otherwise
  // it emerges from the four randomly-chosen angles.
  const pinned = alg ? alg.interior : null;

  let A = 0, B = 0, C = 0, D = 0, pA = 0, unknownIdx = 0, found = false;
  for (let att = 0; att < 800 && !found; att++) {
    let four: number[];
    if (pinned !== null) {
      const rest = 360 - pinned;
      const o1 = rnd(MIN_ANG, MAX_ANG), o2 = rnd(MIN_ANG, MAX_ANG), o3 = rest - o1 - o2;
      if (o3 < MIN_ANG || o3 > MAX_ANG) continue;
      four = [pinned, o1, o2, o3];
    } else {
      const a = rnd(MIN_ANG, MAX_ANG), b = rnd(MIN_ANG, MAX_ANG), c = rnd(MIN_ANG, MAX_ANG), d = 360 - a - b - c;
      if (d < MIN_ANG || d > MAX_ANG) continue;
      four = [a, b, c, d];
    }
    const spread = Math.max(...four) - Math.min(...four);
    if (spread < (pinned !== null ? 25 : 45)) continue;   // clearly irregular
    // tag the unknown item so we can track it through the shuffle
    const unkItem = pinned !== null ? 0 : rnd(0, 3);
    const items = four.map((v, i) => ({ v, unk: i === unkItem }));
    items.sort(() => Math.random() - 0.5);
    const shifts = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    for (const sh of shifts) {
      const A2 = items[sh].v, B2 = items[(sh + 1) % 4].v, C2 = items[(sh + 2) % 4].v, D2 = items[(sh + 3) % 4].v;
      const lo = Math.max(MIN_SUB, 180 - B2 - C2 + MIN_SUB);
      const hi = Math.min(A2 - MIN_SUB, 180 - B2 - MIN_SUB);
      if (lo > hi) continue;
      A = A2; B = B2; C = C2; D = D2; pA = rnd(lo, hi);
      unknownIdx = [0, 1, 2, 3].find(p => items[(sh + p) % 4].unk)!;
      found = true; break;
    }
  }
  if (!found) { A = 70; B = 110; C = 80; D = 100; pA = 35; unknownIdx = 0; }   // safe fallback

  const rot = rnd(0, 359);
  const [vA, vB, vC, vD] = rotatePts(placeQuad(A, B, C, pA), rot);
  const verts = [vA, vB, vC, vD];
  const vals = [A, B, C, D];
  const xLabel = alg ? exprLabel(alg.c, alg.k) : "x";
  const xVal = alg ? alg.x : vals[unknownIdx];

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
    if (i === unknownIdx) {
      return { label: xLabel, isUnknown: true, value: vals[i], arcVertex: v, arcFrom: prev, arcTo: next };
    }
    return { label: `${vals[i]}°`, isUnknown: false, value: vals[i], arcVertex: v, arcFrom: prev, arcTo: next };
  });

  const givenInterior = givenIdx.slice().sort((a, b) => a - b).map(i => vals[i]);
  const knownSum = givenInterior.reduce((s, v) => s + v, 0);
  const exprVal = 360 - knownSum;       // = the unknown interior = alg.c*x + alg.k
  const working: { text: string }[] = [{ text: "Angles in a quadrilateral sum to 360°" }];
  if (extIdx.size > 0) {
    working.push({ text: "Angles on a straight line sum to 180°" });
    [...extIdx].sort((a, b) => a - b).forEach(i => {
      working.push({ text: `Interior angle = 180° − ${180 - vals[i]}° = ${vals[i]}°` });
    });
  }
  working.push(
    { text: `${givenInterior.join("° + ")}° + ${xLabel} = 360°` },
    { text: `${knownSum}° + ${xLabel} = 360°` },
    { text: `${xLabel} = 360° − ${knownSum}°` },
  );
  if (alg) {
    working.push({ text: `${xLabel} = ${exprVal}°` });
    if (alg.k !== 0 && alg.c !== 1) working.push({ text: `${alg.c}x = ${exprVal - alg.k}°` });
    working.push({ text: `x = ${xVal}°` });
  } else {
    working.push({ text: `x = ${exprVal}°` });
  }

  return {
    tool: "anglesInQuad", level: "level1",
    edges: [[vA, vB], [vB, vC], [vC, vD], [vD, vA]],
    extensions: extensions.length ? extensions : undefined,
    angles,
    answer: `x = ${xVal}°`,
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

// Pick an algebra type from the ALG_MS multiSelect (justX / constant / coefficient / both).
function pickAlgType(vars: QOVars): string {
  const active = ["justX", "constant", "coefficient", "both"].filter(v => vars[v]);
  return active.length ? active[rnd(0, active.length - 1)] : "justX";
}

// Express a known interior angle value V as an algebraic expression of the
// requested type, returning the coefficient/constant/x. Returns null when no
// clean integer solution exists so the caller can fall back to plain x.
function exprForValue(V: number, type: string): { c: number; k: number; x: number } | null {
  if (type === "justX") return { c: 1, k: 0, x: V };
  if (type === "coefficient") {
    const divs = [2, 3, 4].filter(c => V % c === 0 && V / c >= 2);
    if (!divs.length) return null;
    const c = divs[rnd(0, divs.length - 1)];
    return { c, k: 0, x: V / c };
  }
  if (type === "constant") {
    const hiK = Math.min(40, V - 5);
    if (hiK < 10) return null;
    const k = rnd(10, hiK);
    return { c: 1, k, x: V - k };
  }
  // both: c·x + k = V
  for (let att = 0; att < 60; att++) {
    const c = rnd(2, 4);
    const hiK = Math.min(30, V - c * 2);
    if (hiK < 8) continue;
    const k = rnd(8, hiK);
    if ((V - k) % c === 0 && (V - k) / c >= 2) return { c, k, x: (V - k) / c };
  }
  return null;
}

// Resolve the unknown of value V into a labelled expression, falling back to
// plain x when the chosen type has no clean form for V.
function exprForUnknown(V: number, type: string): { c: number; k: number; x: number; label: string } {
  const e = exprForValue(V, type) ?? { c: 1, k: 0, x: V };
  return { ...e, label: exprLabel(e.c, e.k) };
}

// Working lines that rearrange "label = V°" down to "x = …°". Empty for plain x.
function algSolveSteps(c: number, k: number, V: number, x: number): { text: string }[] {
  const out: { text: string }[] = [];
  if (k !== 0) out.push({ text: `${c === 1 ? "x" : `${c}x`} = ${V - k}°` });
  if (c !== 1) out.push({ text: `x = ${x}°` });
  return out;
}

function buildLevel2(vars: QOVars): QuadQuestion {
  // ── shape pool ──
  const shapePool: ("kite" | "arrowhead")[] = [];
  if (vars.kite) shapePool.push("kite");
  if (vars.arrowhead) shapePool.push("arrowhead");
  if (!shapePool.length) shapePool.push("kite");

  // ── find-type pool ── (every type works for both shapes)
  const findActive = ["findEqual", "findApex", "findBase"].filter(v => vars[v]);
  const finds = findActive.length ? findActive : ["findEqual"];
  const findType = finds[rnd(0, finds.length - 1)];

  const isDart = shapePool[rnd(0, shapePool.length - 1)] === "arrowhead";

  const { alpha, beta, cAngle } = pickKiteAngles(isDart);
  const rot = rnd(-22, 22);
  const [vA, vB, vC, vD] = rotatePts(placeKite(alpha, beta, isDart), rot);
  const verts = [vA, vB, vC, vD];
  const vals = [alpha, beta, cAngle, beta];   // A, B, C, D
  const shapeArt = isDart ? "An arrowhead" : "A kite";
  const markEqual = !!vars.markEqual;

  // Algebra applies only where the unknown appears once (apex / base questions).
  const algType = pickAlgType(vars);
  const algEligible = findType === "findApex" || findType === "findBase";

  // index 1 (B) and 3 (D) are the equal pair; 0 (A) and 2 (C) are apexes.
  // The unknown reveals its actual angle value in place; the "x = …" form is
  // shown in the green answer box under the diagram.
  const mk = (i: number, unknown: boolean, equalMark: boolean, label?: string): AngleLabel => ({
    label: unknown ? (label ?? "x") : `${vals[i]}°`,
    isUnknown: unknown,
    value: vals[i],
    reflex: i === 2 && isDart,
    equalMark,
    arcVertex: verts[i],
    arcFrom: verts[(i + 3) % 4],
    arcTo: verts[(i + 1) % 4],
  });

  const equalLine = markEqual
    ? `The two marked angles are equal (${beta}°)`
    : `${shapeArt} has one pair of equal angles (${beta}°)`;

  let angles: AngleLabel[];
  let answer: string;
  let working: { text: string }[];

  if (findType === "findEqual") {
    // both apexes given, find the equal pair x = beta
    angles = [mk(0, false, false), mk(1, true, true), mk(2, false, false), mk(3, true, true)];
    answer = `x = ${beta}°`;
    working = [
      { text: "Angles in a quadrilateral sum to 360°" },
      { text: `${shapeArt} has one pair of equal angles` },
      { text: `x + x + ${alpha}° + ${cAngle}° = 360°` },
      { text: `2x = 360° − ${alpha}° − ${cAngle}°` },
      { text: `2x = ${360 - alpha - cAngle}°` },
      { text: `x = ${beta}°` },
    ];
  } else if (findType === "findBase") {
    // one of the equal pair given, find the other — no 360° rule needed
    const unkBase = rnd(0, 1) === 0 ? 1 : 3;
    const single = algEligible ? exprForUnknown(beta, algType) : { c: 1, k: 0, x: beta, label: "x" };
    angles = [
      mk(0, false, false),
      mk(1, unkBase === 1, true, unkBase === 1 ? single.label : undefined),
      mk(2, false, false),
      mk(3, unkBase === 3, true, unkBase === 3 ? single.label : undefined),
    ];
    // apex angles are irrelevant here — leave them unmarked
    angles[0] = { ...angles[0], hidden: true };
    angles[2] = { ...angles[2], hidden: true };
    answer = `x = ${single.x}°`;
    working = [
      { text: `${shapeArt} has one pair of equal angles` },
      { text: `${single.label} = ${beta}°` },
      ...algSolveSteps(single.c, single.k, beta, single.x),
    ];
  } else {
    // findApex: equal pair + the other apex given, find an apex. Either apex on
    // a kite; on an arrowhead the top apex (A) or the reflex notch (C).
    const unknownIdx = rnd(0, 1) === 0 ? 0 : 2;
    const apexVal = vals[unknownIdx];               // alpha (A) or gamma/reflex (C)
    const otherApex = unknownIdx === 0 ? cAngle : alpha;
    const isReflex = isDart && unknownIdx === 2;
    // algebra only for ordinary apex angles, never the large reflex notch
    const single = (algEligible && !isReflex) ? exprForUnknown(apexVal, algType) : { c: 1, k: 0, x: apexVal, label: "x" };
    angles = [
      mk(0, unknownIdx === 0, false, unknownIdx === 0 ? single.label : undefined),
      mk(1, false, true),
      mk(2, unknownIdx === 2, false, unknownIdx === 2 ? single.label : undefined),
      mk(3, false, true),
    ];
    answer = `x = ${single.x}°`;
    working = [
      { text: "Angles in a quadrilateral sum to 360°" },
      { text: equalLine },
      { text: `${single.label} + ${beta}° + ${otherApex}° + ${beta}° = 360°` },
      { text: `${single.label} = 360° − ${otherApex}° − 2 × ${beta}°` },
      ...(isReflex ? [{ text: "The angle at the notch is reflex (more than 180°)" }] : []),
      { text: `${single.label} = ${apexVal}°` },
      ...algSolveSteps(single.c, single.k, apexVal, single.x),
    ];
  }

  // Equal-angle marking. When off, drop the arc ticks; for apex/equal
  // questions also leave one of the equal pair unmarked so students must spot
  // the equal angles from the side ticks themselves. (Not for findBase, where
  // the equal pair *is* the question.)
  if (findType === "findBase") {
    if (!markEqual) {
      angles[1] = { ...angles[1], equalMark: false };
      angles[3] = { ...angles[3], equalMark: false };
    }
  } else if (!markEqual) {
    angles[1] = { ...angles[1], equalMark: false };
    angles[3] = { ...angles[3], equalMark: false };
    const hideIdx = rnd(0, 1) === 0 ? 1 : 3;
    angles[hideIdx] = { ...angles[hideIdx], hidden: true };
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

function buildLevel3(vars: QOVars): QuadQuestion {
  // ── shape pool ──
  const shapePool: ("parallelogram" | "rhombus" | "trapezium")[] = [];
  if (vars.parallelogram) shapePool.push("parallelogram");
  if (vars.rhombus) shapePool.push("rhombus");
  if (vars.trapezium) shapePool.push("trapezium");
  if (!shapePool.length) shapePool.push("parallelogram");
  const shape = shapePool[rnd(0, shapePool.length - 1)];
  const isTrap = shape === "trapezium";
  const shapeName = shape;                       // "parallelogram" | "rhombus" | "trapezium"

  // ── find-type pool (opposite angle is meaningless on a general trapezium) ──
  let findActive = ["coInterior", "opposite", "findAll"].filter(v => vars[v]);
  if (isTrap) findActive = findActive.filter(v => v !== "opposite");
  if (!findActive.length) findActive = ["coInterior"];
  const findType = findActive[rnd(0, findActive.length - 1)];

  const algType = pickAlgType(vars);
  const algEligible = findType === "coInterior" || findType === "opposite";

  // ── geometry + interior angle values [A, B, C, D] ──
  let verts: Pt[];
  let vals: number[];
  let parallelEdges: ParallelEdge[];
  let tickEdges: TickEdge[] | undefined;

  if (isTrap) {
    let thetaL = rnd(52, 78), thetaR = rnd(52, 78);
    if (Math.abs(thetaL - thetaR) < 8) thetaR = Math.min(78, thetaL + 9);
    const height = 150;
    const base = Math.round(height * (1 / Math.tan(toRad(thetaL)) + 1 / Math.tan(toRad(thetaR)))) + rnd(90, 170);
    const rot = rnd(-10, 10);
    const [vA, vB, vC, vD] = rotatePts(placeTrapezium(thetaL, thetaR, base, height), rot);
    verts = [vA, vB, vC, vD];
    vals = [thetaL, thetaR, 180 - thetaR, 180 - thetaL];   // A, B, C, D
    // only the AB ∥ DC pair is parallel
    parallelEdges = [{ a: vA, b: vB, count: 1 }, { a: vD, b: vC, count: 1 }];
  } else {
    const theta = rnd(38, 78);
    const lean = rnd(0, 1) === 0 ? 1 : -1;
    const side = shape === "rhombus" ? 200 : 175;
    const base = shape === "rhombus" ? 200 : rnd(240, 280);
    const rot = rnd(-14, 14);
    const [vA, vB, vC, vD] = rotatePts(placeParallelogram(theta, base, side, lean), rot);
    verts = [vA, vB, vC, vD];
    // leaning left swaps which vertices hold the acute angle
    const aAng = lean === 1 ? theta : 180 - theta;
    vals = [aAng, 180 - aAng, aAng, 180 - aAng];           // A, B, C, D
    parallelEdges = [
      { a: vA, b: vB, count: 1 }, { a: vD, b: vC, count: 1 },   // bottom ∥ top
      { a: vA, b: vD, count: 2 }, { a: vB, b: vC, count: 2 },   // left ∥ right
    ];
    if (shape === "rhombus") {
      tickEdges = [
        { a: vA, b: vB, count: 1 }, { a: vB, b: vC, count: 1 },
        { a: vC, b: vD, count: 1 }, { a: vD, b: vA, count: 1 },
      ];
    }
  }

  // every vertex starts hidden; given/unknown vertices are revealed below
  const angles: AngleLabel[] = [0, 1, 2, 3].map(i => ({
    label: `${vals[i]}°`, isUnknown: false, value: vals[i], hidden: true,
    arcVertex: verts[i], arcFrom: verts[(i + 3) % 4], arcTo: verts[(i + 1) % 4],
  }));
  const reveal = (i: number) => { angles[i] = { ...angles[i], hidden: false }; };
  const setUnknown = (i: number, label: string, value: number) => {
    angles[i] = { ...angles[i], hidden: false, isUnknown: true, label, value };
  };

  let answer: string;
  let working: { text: string }[];

  if (findType === "findAll") {
    const letters = ["a", "b", "c"];
    if (isTrap) {
      // give the two bottom angles (A, B); find the co-interior top pair (D, C)
      reveal(0); reveal(1);
      const unkA = 180 - vals[1];   // C (vertex 2) co-interior with B
      const unkB = 180 - vals[0];   // D (vertex 3) co-interior with A
      setUnknown(2, "a", unkA);
      setUnknown(3, "b", unkB);
      answer = `a = ${unkA}°, b = ${unkB}°`;
      working = [
        { text: "Co-interior angles add up to 180°" },
        { text: `a = 180° − ${vals[1]}° = ${unkA}°` },
        { text: `b = 180° − ${vals[0]}° = ${unkB}°` },
      ];
    } else {
      // one given angle; the other three are one opposite (equal) + two co-interior
      const g = rnd(0, 3);
      reveal(g);
      const others = [0, 1, 2, 3].filter(i => i !== g);   // ascending vertex order
      const parts: string[] = [];
      others.forEach((i, n) => {
        const opposite = i === (g + 2) % 4;
        const val = opposite ? vals[g] : 180 - vals[g];
        setUnknown(i, letters[n], val);
        parts.push(`${letters[n]} = ${val}°`);
      });
      answer = parts.join(", ");
      working = [
        { text: `Opposite angles in a ${shapeName} are equal` },
        { text: "Co-interior angles add up to 180°" },
      ];
      others.forEach((i, n) => {
        const opposite = i === (g + 2) % 4;
        const val = opposite ? vals[g] : 180 - vals[g];
        working.push({ text: opposite ? `${letters[n]} = ${vals[g]}°` : `${letters[n]} = 180° − ${vals[g]}° = ${val}°` });
      });
    }
  } else if (findType === "opposite") {
    // parallelogram / rhombus only: given + its opposite (equal)
    const g = rnd(0, 3);
    const u = (g + 2) % 4;
    reveal(g);
    const single = algEligible ? exprForUnknown(vals[u], algType) : { c: 1, k: 0, x: vals[u], label: "x" };
    setUnknown(u, single.label, vals[u]);
    answer = `x = ${single.x}°`;
    working = [
      { text: `Opposite angles in a ${shapeName} are equal` },
      { text: `${single.label} = ${vals[g]}°` },
      ...algSolveSteps(single.c, single.k, vals[u], single.x),
    ];
  } else {
    // coInterior: given + an adjacent vertex (sum to 180°)
    let g: number, u: number;
    if (isTrap) {
      // pick a leg: left = {A:0, D:3}, right = {B:1, C:2}
      const leg = rnd(0, 1) === 0 ? [0, 3] : [1, 2];
      if (rnd(0, 1) === 0) { g = leg[0]; u = leg[1]; } else { g = leg[1]; u = leg[0]; }
    } else {
      g = rnd(0, 3);
      u = rnd(0, 1) === 0 ? (g + 1) % 4 : (g + 3) % 4;
    }
    reveal(g);
    const uVal = 180 - vals[g];
    const single = algEligible ? exprForUnknown(uVal, algType) : { c: 1, k: 0, x: uVal, label: "x" };
    setUnknown(u, single.label, uVal);
    answer = `x = ${single.x}°`;
    working = [
      { text: "Co-interior angles add up to 180°" },
      { text: `${single.label} + ${vals[g]}° = 180°` },
      { text: `${single.label} = 180° − ${vals[g]}°` },
      { text: `${single.label} = ${uVal}°` },
      ...algSolveSteps(single.c, single.k, uVal, single.x),
    ];
  }

  const [vA, vB, vC, vD] = verts;
  return {
    tool: "anglesInQuad", level: "level3",
    edges: [[vA, vB], [vB, vC], [vC, vD], [vD, vA]],
    parallelEdges, tickEdges, angles, answer, working,
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildQuadQuestion(tool: string, level: string, vars: QOVars): QuadQuestion {
  let q: QuadQuestion;
  if (level === "level3") q = buildLevel3(vars);
  else if (level === "level2") q = buildLevel2(vars);
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

interface DiagramProps { q: QuadQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number; fillBox?: boolean; }

function QuadDiagram({ q, showAnswer, small = false, dataIndex, fillBox = false }: DiagramProps) {
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

  // Square viewBox that exactly contains the shape, extensions, arcs and label
  // boxes. The font scales with the viewBox, so box sizes depend on the side and
  // the side depends on box sizes — a few fixed-point iterations converge fast.
  const dispOf = (ang: AngleLabel) => ang.isUnknown && !showAnswer ? ang.label : ang.isUnknown ? `${ang.value}°` : ang.label;
  const fixedPts: number[][] = geomPts.map(p => { const t = tp(p); return [t.x, t.y]; });
  q.angles.forEach(a => { if (a.hidden) return; const v = tp(a.arcVertex); const r = a.isUnknown ? unknownArcR : arcR; fixedPts.push([v.x - r, v.y - r], [v.x + r, v.y + r]); });
  const minHW = small ? 9 : 14, minHH = small ? 7 : 11, boxPad = small ? 3 : 5, edgePad = small ? 7 : 12;
  const halfW = (i: number, fs: number) => Math.max(minHW, estTW(dispOf(q.angles[i]), fs) / 2 + boxPad);
  const halfH = (fs: number) => Math.max(minHH, fs * 0.7 + boxPad);

  // Fit a square viewBox around the shape, arcs and label boxes. Box size scales
  // with the font, which scales with the side, so iterate a few times.
  const fitSquare = (): { side: number; bcx: number; bcy: number; fs: number } => {
    let side = 0, bcx = 0, bcy = 0;
    for (let iter = 0; iter < 4; iter++) {
      const fs = side === 0 ? tfp : tfp * side / refSide;
      const pts = fixedPts.slice();
      labelLayouts.forEach((l, i) => {
        if (q.angles[i].hidden) return;
        pts.push([l.labelPt.x - halfW(i, fs), l.labelPt.y - halfH(fs)], [l.labelPt.x + halfW(i, fs), l.labelPt.y + halfH(fs)]);
      });
      const x0 = Math.min(...pts.map(p => p[0])) - edgePad, y0 = Math.min(...pts.map(p => p[1])) - edgePad;
      const x1 = Math.max(...pts.map(p => p[0])) + edgePad, y1 = Math.max(...pts.map(p => p[1])) + edgePad;
      side = Math.max(x1 - x0, y1 - y0);
      bcx = (x0 + x1) / 2; bcy = (y0 + y1) / 2;
    }
    return { side, bcx, bcy, fs: tfp * side / refSide };
  };

  // Push overlapping label boxes apart (e.g. two labels either side of a short
  // side). Resolve at the rendered font size, then refit the viewBox.
  const separate = (fs: number) => {
    const idx = labelLayouts.map((_, i) => i).filter(i => !q.angles[i].hidden);
    const gap = small ? 3 : 5, hh = halfH(fs) + gap;
    for (let iter = 0; iter < 16; iter++) {
      let moved = false;
      for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) {
        const i = idx[a], j = idx[b], A = labelLayouts[i].labelPt, B = labelLayouts[j].labelPt;
        const ox = halfW(i, fs) + halfW(j, fs) + gap - Math.abs(B.x - A.x);
        const oy = hh + halfH(fs) - Math.abs(B.y - A.y);
        if (ox <= 0 || oy <= 0) continue;          // not overlapping
        moved = true;
        if (ox < oy) {
          const dir = (B.x - A.x) || 1, p = (ox / 2) * Math.sign(dir);
          A.x -= p; B.x += p;
        } else {
          const dir = (B.y - A.y) || 1, p = (oy / 2) * Math.sign(dir);
          A.y -= p; B.y += p;
        }
      }
      if (!moved) break;
    }
  };

  const { fs: fsEst } = fitSquare();
  separate(fsEst);
  let { side, bcx, bcy } = fitSquare();   // eslint-disable-line prefer-const
  // Extra breathing room in worksheet cells (small) so label boxes never reach
  // the cell's clipped edge; whiteboard/example just need a hairline margin.
  side *= small ? 1.14 : 1.04;

  const k = side / refSide;                 // scale visual sizes to the viewBox
  const fontSize = tfp * k;
  const strokeW = (small ? 2 : 2.5) * k;
  const arcStrokeU = (small ? 2 : 2.5) * k, arcStrokeK = (small ? 1.5 : 2) * k;
  const arrowSize = (small ? 5 : 7) * k;
  const tickLen = (small ? 9 : 13) * k, tickSpace = (small ? 5 : 7) * k;
  const parSize = (small ? 4 : 6) * k, parSpace = (small ? 5 : 7) * k;
  const tps = (p: Pt): Pt => p;

  // On reveal, show the "x = …" answer in the green answer font as a band below
  // the diagram. Keep the viewBox SQUARE (same outer size as before) so the SVG
  // never grows taller than its box — ScaleToFit only scales up, never down, so
  // any extra height would clip in collapsed/full mode. Instead, shrink the
  // diagram into the top portion and reserve the bottom band for the answer.
  const ansFs = fontSize * 1.35;
  const bandH = showAnswer ? ansFs * 1.9 : 0;
  const vbX = bcx - side / 2, vbY = bcy - side / 2;
  const shapeF = showAnswer ? (side - bandH) / side : 1;
  const shapeTransform = `translate(${bcx} ${vbY}) scale(${shapeF}) translate(${-bcx} ${-vbY})`;

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
    <svg viewBox={`${vbX} ${vbY} ${side} ${side}`} style={{ display: "block", overflow: "visible", width: "100%", height: fillBox ? "100%" : "auto" }} preserveAspectRatio="xMidYMid meet" {...extraProps}>
      <g transform={shapeTransform}>
      {q.extensions?.map((e, i) => <line key={`x${i}`} x1={tx(e.from.x)} y1={ty(e.from.y)} x2={tx(e.to.x)} y2={ty(e.to.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />)}
      {q.edges.map(([a, b], i) => <line key={`e${i}`} x1={tx(a.x)} y1={ty(a.y)} x2={tx(b.x)} y2={ty(b.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />)}
      {q.tickEdges?.flatMap((te, i) => tickMarks(tp(te.a), tp(te.b), te.count, tickLen, tickSpace).map((t, ti) => <line key={`tk-${i}-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />))}
      {q.parallelEdges?.flatMap((pe, i) => parallelMarks(tp(pe.a), tp(pe.b), pe.count, parSize, parSpace).map((m, mi) => <polyline key={`pl-${i}-${mi}`} points={`${m.w1.x},${m.w1.y} ${m.tip.x},${m.tip.y} ${m.w2.x},${m.w2.y}`} fill="none" stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />))}
      {q.angles.map((ang, i) => (!ang.isUnknown || ang.hidden) ? null : <path key={`sh-${i}`} d={sectorFill(ang.arcVertex, ang.arcFrom, ang.arcTo, unknownArcR, !!ang.reflex)} fill="#bfdbfe" fillOpacity="0.45" stroke="none" />)}
      {q.angles.map((ang, i) => ang.hidden ? null : <path key={`arc-${i}`} d={arcPath(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR, !!ang.reflex)} fill="none" stroke={ang.isUnknown ? "#2563eb" : "#475569"} strokeWidth={ang.isUnknown ? arcStrokeU : arcStrokeK} />)}
      {q.angles.map((ang, i) => ang.equalMark && !ang.hidden ? <g key={`eq-${i}`}>{equalTick(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR, !!ang.reflex)}</g> : null)}
      {q.angles.map((ang, i) => {
        if (ang.hidden) return null;
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
      </g>
      {showAnswer && (
        <text x={bcx} y={vbY + side - bandH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={ansFs} fontWeight="bold" fill="#166534">{q.answer}</text>
      )}
    </svg>
  );
}

// ─── RENDERER ─────────────────────────────────────────────────────────────────
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number): JSX.Element | null => {
  const d = (q as any)._diagram as QuadQuestion | undefined;
  if (!d) return null;
  if (compact === true) {
    // Worksheet cell: a landscape (wider-than-tall) box keeps cells short so
    // more rows fit on screen; the square SVG letterboxes by height within it.
    return (
      <div style={{ width: "100%", aspectRatio: "1.4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <QuadDiagram q={d} showAnswer={showAnswer} small dataIndex={idx} fillBox />
      </div>
    );
  }
  const maxW = compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <QuadDiagram q={d} showAnswer={showAnswer} small={false} dataIndex={idx} />
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
      defaults={{ fixedColumns: true, numColumns: 3, hideFontControls: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2", "level3"] };
