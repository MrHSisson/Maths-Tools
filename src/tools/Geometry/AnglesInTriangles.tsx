import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  tStep,
} from "../../shared";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Angles in a Triangle",
  tools: {
    anglesInTriangle: {
      name: "Angles in a Triangle",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "rightAngle", label: "Right Angle",
            options: [
              { value: "none",       label: "No 90°",     },
              { value: "chance",     label: "Sometimes 90°", },
              { value: "guaranteed", label: "Always 90°", },
            ],
            defaultValue: "chance",
          },
          variables: [
            { key: "noMinAngle", label: "Allow angles below 20° ⚠ may reduce visibility", defaultValue: false },
          ],
        },
        level2: {
          dropdown: {
            key: "isoGiven", label: "Given",
            options: [
              { value: "mixed", label: "Mixed" },
              { value: "apex",  label: "Give Apex" },
              { value: "base",  label: "Give Base" },
            ],
            defaultValue: "mixed",
          },
          variables: [
            { key: "noMinAngle", label: "Allow angles below 20° ⚠ may reduce visibility", defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "type", label: "Question Type",
            options: [
              { value: "mixed",         label: "Mixed" },
              { value: "splitTriangle", label: "Split Triangle" },
              { value: "exteriorAngle", label: "Exterior Angle" },
            ],
            defaultValue: "mixed",
          },
          variables: [
            { key: "noMinAngle", label: "Allow angles below 20° ⚠ may reduce visibility", defaultValue: false },
          ],
        },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Level 1 — Basic Triangle", icon: "△",
    content: [
      { label: "Overview",        detail: "Two angles are given inside the triangle. Find the missing angle using the fact that angles in a triangle sum to 180°." },
      { label: "Questions",       detail: "Scalene triangles in varied orientations. Toggle to include right-angled triangles." },
    ],
  },
  {
    title: "Level 2 — Isosceles Triangle", icon: "⊿",
    content: [
      { label: "Overview",        detail: "Isosceles triangles have two equal sides (shown by tick marks) and two equal base angles." },
      { label: "Questions",       detail: "Either the apex or one base angle is given. Use the equal-angles property and 180° rule to find x." },
    ],
  },
  {
    title: "Level 3 — Extended Angles", icon: "∠",
    content: [
      { label: "Overview",        detail: "Requires a preliminary step before applying the triangle angle sum." },
      { label: "Split Triangle",  detail: "A larger triangle is divided into two by an internal line from a vertex to the opposite edge." },
      { label: "Exterior Angle",  detail: "One side of the triangle is extended past a vertex. Use angles on a straight line (180°) first, then apply the triangle rule." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard",      detail: "Single large question with blank working space. Visualiser and fullscreen available." },
      { label: "Worked Example",  detail: "Step-by-step solution revealed on demand." },
      { label: "Worksheet",       detail: "Grid of questions. Supports differentiated 3-column layout with PDF export." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Dropdowns",       detail: "Select the question style or method for the active level." },
      { label: "Toggles",         detail: "Level-specific options such as including right-angles or allowing small angles." },
      { label: "Differentiated",  detail: "Shows all three levels side-by-side, each column independently configurable." },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }

// ─── INTERFACES ───────────────────────────────────────────────────────────────
interface Pt { x: number; y: number; }

interface AngleLabel {
  label: string;
  isUnknown: boolean;
  hideLabel?: boolean;
  value: number;
  pos: Pt;
  arcVertex: Pt;
  arcFrom: Pt;
  arcTo: Pt;
  showRightAngleSquare?: boolean;
}

interface TriQuestion {
  level: string;
  edges: [Pt, Pt][];
  isoTickEdges?: [Pt, Pt][];
  straightLineExt?: { from: Pt; to: Pt };
  angles: AngleLabel[];
  answer: string;
  working: { text: string }[];
  id: number;
  questionType?: "splitTriangle" | "exteriorAngle";
}

// ─── GEOMETRY HELPERS ─────────────────────────────────────────────────────────
function placeTriangle(a0: number, a1: number, a2: number, cx: number, cy: number, scale: number, rotDeg: number): Pt[] {
  const sinA0 = Math.sin(toRad(a0)), sinA1 = Math.sin(toRad(a1)), sinA2 = Math.sin(toRad(a2));
  const maxSin = Math.max(sinA0, sinA1, sinA2);
  const sideC = sinA2 / maxSin, sideB = sinA1 / maxSin;
  const v0: Pt = { x: 0, y: 0 };
  const v1: Pt = { x: sideC, y: 0 };
  const v2: Pt = { x: sideB * Math.cos(toRad(a0)), y: -sideB * Math.sin(toRad(a0)) };
  const allX = [v0.x, v1.x, v2.x], allY = [v0.y, v1.y, v2.y];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const w = maxX - minX, h = maxY - minY;
  const factor = scale / Math.max(w, h, 0.001);
  const centred = [v0, v1, v2].map(v => ({ x: (v.x - minX - w / 2) * factor, y: (v.y - minY - h / 2) * factor }));
  const cos = Math.cos(toRad(rotDeg)), sin = Math.sin(toRad(rotDeg));
  return centred.map(v => ({ x: cx + v.x * cos - v.y * sin, y: cy + v.x * sin + v.y * cos }));
}

function interiorAngleDeg(va: Pt, vb: Pt, vc: Pt): number {
  const ax = va.x - vb.x, ay = va.y - vb.y;
  const cx = vc.x - vb.x, cy = vc.y - vb.y;
  const dot = ax * cx + ay * cy;
  const len = Math.sqrt((ax * ax + ay * ay) * (cx * cx + cy * cy));
  return toDeg(Math.acos(Math.max(-1, Math.min(1, dot / Math.max(len, 0.0001)))));
}

function labelPos(va: Pt, vb: Pt, vc: Pt, offset: number): Pt {
  const ax = va.x - vb.x, ay = va.y - vb.y;
  const cx = vc.x - vb.x, cy = vc.y - vb.y;
  const lenA = Math.sqrt(ax * ax + ay * ay), lenC = Math.sqrt(cx * cx + cy * cy);
  if (lenA < 0.001 || lenC < 0.001) return vb;
  const nx = ax / lenA + cx / lenC, ny = ay / lenA + cy / lenC;
  const len = Math.sqrt(nx * nx + ny * ny);
  if (len < 0.001) return vb;
  return { x: vb.x + (nx / len) * offset, y: vb.y + (ny / len) * offset };
}

function estTW(s: string, fs: number) { return s.length * fs * 0.6; }

function tickMark(v1: Pt, v2: Pt): { x1: number; y1: number; x2: number; y2: number }[] {
  const mx = (v1.x + v2.x) / 2, my = (v1.y + v2.y) / 2;
  const dx = v2.x - v1.x, dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return [];
  const nx = -dy / len, ny = dx / len;
  const tickLen = 10;
  return [{ x1: mx - nx * tickLen / 2, y1: my - ny * tickLen / 2, x2: mx + nx * tickLen / 2, y2: my + ny * tickLen / 2 }];
}

// ─── QUESTION GENERATION ──────────────────────────────────────────────────────
const CX = 200, CY = 195, SCALE = 230;

function buildLevel1(vars: Record<string, unknown>): TriQuestion {
  const rightAngle = (vars.rightAngle as string) ?? "chance";
  const minAngle = vars.noMinAngle === true ? 5 : 20;
  let a0: number, a1: number, a2: number;
  do {
    if (rightAngle === "guaranteed") {
      // One angle is always 90 — pick which vertex randomly
      const idx = rnd(0, 2);
      const others = [rnd(minAngle, 89 - minAngle), 0];
      others[1] = 90 - others[0];
      if (others[1] < minAngle) { a0 = 0; a1 = 0; a2 = 0; continue; }
      const trio = [90, others[0], others[1]];
      a0 = trio[idx % 3]; a1 = trio[(idx + 1) % 3]; a2 = trio[(idx + 2) % 3];
    } else {
      const includeRight = rightAngle === "chance" && rnd(0, 5) === 0;
      a0 = includeRight ? 90 : rnd(minAngle, 110);
      a1 = rnd(minAngle, 170 - a0 - minAngle);
      a2 = 180 - a0 - a1;
    }
  } while (a2 < minAngle || a2 > 140);
  const rot = rnd(0, 359);
  const [v0, v1, v2] = placeTriangle(a0, a1, a2, CX, CY, SCALE, rot);
  const vals = [a0, a1, a2], verts = [v0, v1, v2];
  // Never ask for the right angle — pick unknown from non-90 angles only
  const eligible = [0, 1, 2].filter(i => vals[i] !== 90);
  const unknownIdx = eligible[rnd(0, eligible.length - 1)];
  const angles: AngleLabel[] = [0, 1, 2].map(i => {
    const va = verts[(i + 2) % 3], vb = verts[i], vc = verts[(i + 1) % 3];
    return { label: i === unknownIdx ? "x" : `${vals[i]}°`, isUnknown: i === unknownIdx, value: vals[i], pos: labelPos(va, vb, vc, 40), arcVertex: vb, arcFrom: va, arcTo: vc, showRightAngleSquare: vals[i] === 90 };
  });
  const given = vals.filter((_, i) => i !== unknownIdx);
  const knownSum = given.reduce((s, v) => s + v, 0);
  return {
    level: "level1", edges: [[v0, v1], [v1, v2], [v2, v0]], angles,
    answer: `x = ${vals[unknownIdx]}°`,
    working: [
      { text: "Angles in a triangle sum to 180°" },
      { text: `${given.join("° + ")}° + x = 180°` },
      { text: `${knownSum}° + x = 180°` },
      { text: `x = 180° − ${knownSum}°` },
      { text: `x = ${vals[unknownIdx]}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildLevel2(vars: Record<string, unknown>): TriQuestion {
  const isoGiven = (vars.isoGiven as string) ?? "mixed";
  const minAngle = vars.noMinAngle === true ? 5 : 20;
  let apex: number, base: number;
  do { apex = rnd(minAngle, 180 - minAngle * 2); base = (180 - apex) / 2; } while (!Number.isInteger(base) || base < minAngle);
  const rot = rnd(0, 359);
  const [v0, v1, v2] = placeTriangle(base, base, apex, CX, CY, SCALE, rot);
  let giveApex: boolean;
  if (isoGiven === "apex") giveApex = true;
  else if (isoGiven === "base") giveApex = false;
  else giveApex = rnd(0, 1) === 0;
  const angles: AngleLabel[] = [
    { label: giveApex ? "x" : `${base}°`, isUnknown: giveApex,  hideLabel: !giveApex, value: base, pos: labelPos(v2, v0, v1, 40), arcVertex: v0, arcFrom: v2, arcTo: v1 },
    { label: giveApex ? "x" : `${base}°`, isUnknown: giveApex,  hideLabel: giveApex,  value: base, pos: labelPos(v2, v1, v0, 40), arcVertex: v1, arcFrom: v0, arcTo: v2 },
    { label: giveApex ? `${apex}°` : "x", isUnknown: !giveApex, value: apex, pos: labelPos(v0, v2, v1, 40), arcVertex: v2, arcFrom: v0, arcTo: v1 },
  ];
  const working = giveApex ? [
    { text: "Isosceles triangle — two base angles are equal" },
    { text: `x + x + ${apex}° = 180°` },
    { text: `2x = 180° − ${apex}°` },
    { text: `2x = ${180 - apex}°` },
    { text: `x = ${base}°` },
  ] : [
    { text: "Isosceles triangle — base angles are equal" },
    { text: `The other base angle is also ${base}°` },
    { text: `Apex angle x = 180° − ${base}° − ${base}°` },
    { text: `x = ${apex}°` },
  ];
  return { level: "level2", edges: [[v0, v1], [v1, v2], [v2, v0]], isoTickEdges: [[v0, v2], [v1, v2]], angles, answer: giveApex ? `x = ${base}°` : `x = ${apex}°`, working, id: Math.floor(Math.random() * 1_000_000) };
}

function buildSplitTriangle(vars: Record<string, unknown>): TriQuestion {
  const minAngle = vars.noMinAngle === true ? 5 : 20;
  let angB: number, angC: number, angA: number;
  do { angB = rnd(minAngle, 85); angC = rnd(minAngle, 85); angA = 180 - angB - angC; } while (angA < minAngle || angA > 110);
  const rot = rnd(-15, 15);
  const [B, C, A] = placeTriangle(angB, angC, angA, CX, CY, SCALE * 0.88, rot);
  const t = 0.3 + Math.random() * 0.4;
  const D: Pt = { x: B.x + t * (C.x - B.x), y: B.y + t * (C.y - B.y) };
  const angABD = Math.round(interiorAngleDeg(A, B, D));
  const angBDA = Math.round(interiorAngleDeg(B, D, A));
  const angDAB = 180 - angABD - angBDA;
  const angACD = Math.round(interiorAngleDeg(A, C, D));
  const angCDA = 180 - angBDA;
  const angDAC = 180 - angACD - angCDA;
  const bx = C.x - B.x, by = C.y - B.y;
  const blen = Math.sqrt(bx * bx + by * by);
  const extB: Pt = { x: B.x - (bx / blen) * 40, y: B.y - (by / blen) * 40 };
  const extC: Pt = { x: C.x + (bx / blen) * 40, y: C.y + (by / blen) * 40 };
  const variant = rnd(0, 1);
  if (variant === 0) {
    const xInLeft = rnd(0, 1) === 0;
    const leftCandidates = [0, 2, 4], rightCandidates = [1, 3, 5];
    type SA = { val: number; vertex: Pt; from: Pt; to: Pt };
    const subAngles: SA[] = [
      { val: angABD, vertex: B, from: A, to: D }, { val: angACD, vertex: C, from: D, to: A },
      { val: angDAB, vertex: A, from: B, to: D }, { val: angDAC, vertex: A, from: D, to: C },
      { val: angBDA, vertex: D, from: A, to: B }, { val: angCDA, vertex: D, from: C, to: A },
    ];
    const xTri = xInLeft ? leftCandidates : rightCandidates;
    const helperTri = xInLeft ? rightCandidates : leftCandidates;
    const dInXTri = xInLeft ? 4 : 5;
    const helperNonD = helperTri.filter(i => i !== (xInLeft ? 5 : 4));
    const hK1Idx = helperNonD[0], hK2Idx = helperNonD[1];
    const hK1 = subAngles[hK1Idx].val, hK2 = subAngles[hK2Idx].val;
    const xTriNonD = xTri.filter(i => i !== dInXTri);
    const xIdx = xTriNonD[rnd(0, 1)];
    const thirdXTriIdx = xTriNonD.find(i => i !== xIdx)!;
    const thirdXTriVal = subAngles[thirdXTriIdx].val;
    const xVal = subAngles[xIdx].val;
    const shownIndices = new Set([hK1Idx, hK2Idx, thirdXTriIdx]);
    const angles: AngleLabel[] = subAngles.map((sa, i) => {
      const isX = i === xIdx, isShown = shownIndices.has(i) || isX;
      if (!isShown) return null as any;
      return { label: isX ? "x" : `${sa.val}°`, isUnknown: isX, value: sa.val, pos: labelPos(sa.from, sa.vertex, sa.to, 40), arcVertex: sa.vertex, arcFrom: sa.from, arcTo: sa.to };
    }).filter(Boolean);
    const dFoundVal = 180 - hK1 - hK2, dBridgeVal = 180 - dFoundVal;
    return {
      level: "level3", questionType: "splitTriangle", edges: [[B, A], [A, C], [B, D], [D, C], [A, D]], angles, answer: `x = ${xVal}°`,
      working: [
        { text: "Angles in a triangle sum to 180°" }, { text: `${hK1}° + ${hK2}° + ∠D = 180°` },
        { text: `∠D = 180° − ${hK1 + hK2}° = ${dFoundVal}°` }, { text: `Angles on a straight line: other ∠D = 180° − ${dFoundVal}° = ${dBridgeVal}°` },
        { text: `${thirdXTriVal}° + ${dBridgeVal}° + x = 180°` }, { text: `x = 180° − ${thirdXTriVal + dBridgeVal}°` }, { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }
  const useLeft = rnd(0, 1) === 0;
  const k1 = useLeft ? angABD : angACD, k2 = useLeft ? angDAB : angDAC;
  const dInterior = useLeft ? angBDA : angCDA, xVal = 180 - dInterior;
  const xArcFrom = useLeft ? A : extB, xArcTo = useLeft ? extC : A;
  const k1Vertex = useLeft ? B : C, k1From = useLeft ? A : D, k1To = useLeft ? D : A;
  const k2From = useLeft ? B : D, k2To = useLeft ? D : C;
  const angles: AngleLabel[] = [
    { label: `${k1}°`, isUnknown: false, value: k1, pos: labelPos(k1From, k1Vertex, k1To, 40), arcVertex: k1Vertex, arcFrom: k1From, arcTo: k1To },
    { label: `${k2}°`, isUnknown: false, value: k2, pos: labelPos(k2From, A, k2To, 40), arcVertex: A, arcFrom: k2From, arcTo: k2To },
    { label: "x", isUnknown: true, value: xVal, pos: labelPos(xArcFrom, D, xArcTo, 40), arcVertex: D, arcFrom: xArcFrom, arcTo: xArcTo },
  ];
  return {
    level: "level3", questionType: "splitTriangle", edges: [[B, A], [A, C], [B, D], [D, C], [A, D]], straightLineExt: { from: extB, to: extC }, angles, answer: `x = ${xVal}°`,
    working: [
      { text: "Angles in a triangle sum to 180°" }, { text: `${k1}° + ${k2}° + ∠D = 180°` },
      { text: `∠D (interior) = 180° − ${k1 + k2}° = ${dInterior}°` }, { text: "Angles on a straight line sum to 180°" },
      { text: `x = 180° − ${dInterior}°` }, { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildExteriorAngle(vars: Record<string, unknown>): TriQuestion {
  const minAngle = vars.noMinAngle === true ? 5 : 20;
  let a0: number, a1: number, a2: number;
  do { a0 = rnd(minAngle, 95); a1 = rnd(minAngle, 95); a2 = 180 - a0 - a1; } while (a2 < minAngle || a2 > 115);
  const rot = rnd(-10, 10);
  const [v0, v1, v2] = placeTriangle(a0, a1, a2, CX, CY, SCALE * 0.82, rot);
  const extendRight = rnd(0, 1) === 0;
  const dx = v1.x - v0.x, dy = v1.y - v0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len, perpY = dx / len;
  const askExterior = rnd(0, 1) === 0;
  if (extendRight) {
    const extPt: Pt  = { x: v1.x + (dx / len) * 80, y: v1.y + (dy / len) * 80 };
    const leftPt: Pt = { x: v0.x - (dx / len) * 25, y: v0.y - (dy / len) * 25 };
    const extAngle = 180 - a1;
    if (askExterior) {
      return {
        level: "level3", questionType: "exteriorAngle", edges: [[v0, v1], [v1, v2], [v2, v0]], straightLineExt: { from: leftPt, to: extPt },
        angles: [
          { label: `${a0}°`, isUnknown: false, value: a0, pos: labelPos(v2, v0, v1, 40), arcVertex: v0, arcFrom: v2, arcTo: v1 },
          { label: `${a2}°`, isUnknown: false, value: a2, pos: labelPos(v0, v2, v1, 40), arcVertex: v2, arcFrom: v0, arcTo: v1 },
          { label: "x", isUnknown: true, value: extAngle, pos: labelPos(v2, v1, extPt, 40), arcVertex: v1, arcFrom: v2, arcTo: extPt },
        ],
        answer: `x = ${extAngle}°`,
        working: [{ text: "Exterior angle = sum of the two non-adjacent interior angles" }, { text: `x = ${a0}° + ${a2}°` }, { text: `x = ${extAngle}°` }],
        id: Math.floor(Math.random() * 1_000_000),
      };
    }
    const extLabelPos: Pt = { x: v1.x + (dx / len) * 42 + perpX * 22, y: v1.y + (dy / len) * 42 + perpY * 22 };
    const intB = 180 - extAngle;
    return {
      level: "level3", questionType: "exteriorAngle", edges: [[v0, v1], [v1, v2], [v2, v0]], straightLineExt: { from: leftPt, to: extPt },
      angles: [
        { label: `${a0}°`, isUnknown: false, value: a0, pos: labelPos(v2, v0, v1, 40), arcVertex: v0, arcFrom: v2, arcTo: v1 },
        { label: `${extAngle}°`, isUnknown: false, value: extAngle, pos: extLabelPos, arcVertex: v1, arcFrom: extPt, arcTo: v2 },
        { label: "x", isUnknown: true, value: a2, pos: labelPos(v0, v2, v1, 40), arcVertex: v2, arcFrom: v0, arcTo: v1 },
      ],
      answer: `x = ${a2}°`,
      working: [
        { text: "Angles on a straight line sum to 180°" }, { text: `Interior angle = 180° − ${extAngle}° = ${intB}°` },
        { text: "Angles in a triangle sum to 180°" }, { text: `${a0}° + ${intB}° + x = 180°` }, { text: `${a0 + intB}° + x = 180°` }, { text: `x = ${a2}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }
  const extPt: Pt  = { x: v0.x - (dx / len) * 80, y: v0.y - (dy / len) * 80 };
  const leftPt: Pt = { x: v1.x + (dx / len) * 25, y: v1.y + (dy / len) * 25 };
  const extAngle = 180 - a0;
  if (askExterior) {
    return {
      level: "level3", questionType: "exteriorAngle", edges: [[v0, v1], [v1, v2], [v2, v0]], straightLineExt: { from: extPt, to: leftPt },
      angles: [
        { label: `${a1}°`, isUnknown: false, value: a1, pos: labelPos(v2, v1, v0, 40), arcVertex: v1, arcFrom: v2, arcTo: v0 },
        { label: `${a2}°`, isUnknown: false, value: a2, pos: labelPos(v0, v2, v1, 40), arcVertex: v2, arcFrom: v0, arcTo: v1 },
        { label: "x", isUnknown: true, value: extAngle, pos: labelPos(extPt, v0, v2, 40), arcVertex: v0, arcFrom: extPt, arcTo: v2 },
      ],
      answer: `x = ${extAngle}°`,
      working: [{ text: "Exterior angle = sum of the two non-adjacent interior angles" }, { text: `x = ${a1}° + ${a2}°` }, { text: `x = ${extAngle}°` }],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }
  const extLabelPos: Pt = { x: v0.x - (dx / len) * 42 + perpX * 22, y: v0.y - (dy / len) * 42 + perpY * 22 };
  const intA = 180 - extAngle;
  return {
    level: "level3", questionType: "exteriorAngle", edges: [[v0, v1], [v1, v2], [v2, v0]], straightLineExt: { from: extPt, to: leftPt },
    angles: [
      { label: `${a1}°`, isUnknown: false, value: a1, pos: labelPos(v2, v1, v0, 40), arcVertex: v1, arcFrom: v2, arcTo: v0 },
      { label: `${extAngle}°`, isUnknown: false, value: extAngle, pos: extLabelPos, arcVertex: v0, arcFrom: extPt, arcTo: v2 },
      { label: "x", isUnknown: true, value: a2, pos: labelPos(v0, v2, v1, 40), arcVertex: v2, arcFrom: v0, arcTo: v1 },
    ],
    answer: `x = ${a2}°`,
    working: [
      { text: "Angles on a straight line sum to 180°" }, { text: `Interior angle = 180° − ${extAngle}° = ${intA}°` },
      { text: "Angles in a triangle sum to 180°" }, { text: `${a1}° + ${intA}° + x = 180°` }, { text: `${a1 + intA}° + x = 180°` }, { text: `x = ${a2}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildLevel3(vars: Record<string, unknown>): TriQuestion {
  const t = (vars.type as string) ?? "mixed";
  if (t === "splitTriangle") return buildSplitTriangle(vars);
  if (t === "exteriorAngle") return buildExteriorAngle(vars);
  return rnd(0, 1) === 0 ? buildSplitTriangle(vars) : buildExteriorAngle(vars);
}

function generateQuestion(
  _tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  _multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const dd = dropdownValue || undefined;
  let q: TriQuestion;
  if (level === "level1") q = buildLevel1({ ...variables, rightAngle: dd ?? "chance" });
  else if (level === "level2") q = buildLevel2({ ...variables, isoGiven: dd ?? "mixed" });
  else q = buildLevel3({ ...variables, type: dd ?? "mixed" });
  return {
    kind: "simple",
    display: "Find x",
    answer: q.answer,
    working: q.working.map(w => tStep(w.text)),
    key: `anglesInTriangle-${level}-${q.id}`,
    difficulty: level,
    _diagram: q,
  } as unknown as AnyQuestion;
}

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────
interface DiagramProps { q: TriQuestion; showAnswer: boolean; small?: boolean; labelBg?: string; dataIndex?: number; fillBox?: boolean; }

function TriangleDiagram({ q, showAnswer, small = false, labelBg = "#ffffff", dataIndex, fillBox = false }: DiagramProps) {
  const BASE_SIZE = small ? 220 : 380;
  const fontSize = small ? 13 : 22;
  const strokeW = small ? 2 : 2.5;
  const arcR = small ? 14 : 22;
  const unknownArcR = small ? 18 : 28;
  const leaderLen = small ? 28 : 48;

  const geomPts: Pt[] = q.edges.flatMap(([a, b]) => [a, b]);
  if (q.straightLineExt) { geomPts.push(q.straightLineExt.from, q.straightLineExt.to); }
  const geomPad = small ? 20 : 40;
  const gMinX = Math.min(...geomPts.map(p => p.x)) - geomPad, gMaxX = Math.max(...geomPts.map(p => p.x)) + geomPad;
  const gMinY = Math.min(...geomPts.map(p => p.y)) - geomPad, gMaxY = Math.max(...geomPts.map(p => p.y)) + geomPad;
  const gbw = gMaxX - gMinX, gbh = gMaxY - gMinY;
  const scl = BASE_SIZE / Math.max(gbw, gbh, 1);
  const tx0 = (x: number) => (x - gMinX) * scl;
  const ty0 = (y: number) => (y - gMinY) * scl;
  const tp0 = (p: Pt): Pt => ({ x: tx0(p.x), y: ty0(p.y) });
  const geomVerts = q.edges.flatMap(([a, b]) => [a, b]);
  const centroid: Pt = {
    x: tx0(geomVerts.reduce((s, p) => s + p.x, 0) / geomVerts.length),
    y: ty0(geomVerts.reduce((s, p) => s + p.y, 0) / geomVerts.length),
  };

  function outwardBisector(arcVertex: Pt, arcFrom: Pt, arcTo: Pt): Pt {
    const v = tp0(arcVertex), f = tp0(arcFrom), t2 = tp0(arcTo);
    const ax = f.x - v.x, ay = f.y - v.y, cx = t2.x - v.x, cy = t2.y - v.y;
    const lenA = Math.hypot(ax, ay), lenC = Math.hypot(cx, cy);
    if (lenA < 0.001 || lenC < 0.001) return { x: 0, y: -1 };
    const bx = ax / lenA + cx / lenC, by = ay / lenA + cy / lenC;
    const blen = Math.hypot(bx, by);
    if (blen < 0.001) return { x: -ay / lenA, y: ax / lenA };
    return { x: -(bx / blen), y: -(by / blen) };
  }

  function labelLayout(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number): { tip: Pt; labelPt: Pt } {
    const v = tp0(arcVertex), ob = outwardBisector(arcVertex, arcFrom, arcTo);
    const tip: Pt = { x: v.x - ob.x * (r / 2), y: v.y - ob.y * (r / 2) };
    const cos45 = Math.SQRT2 / 2;
    const dirCW:  Pt = { x: ob.x * cos45 + ob.y * cos45, y: -ob.x * cos45 + ob.y * cos45 };
    const dirCCW: Pt = { x: ob.x * cos45 - ob.y * cos45, y:  ob.x * cos45 + ob.y * cos45 };
    const labelCW:  Pt = { x: tip.x + dirCW.x  * leaderLen, y: tip.y + dirCW.y  * leaderLen };
    const labelCCW: Pt = { x: tip.x + dirCCW.x * leaderLen, y: tip.y + dirCCW.y * leaderLen };
    const distCW  = Math.hypot(labelCW.x  - centroid.x, labelCW.y  - centroid.y);
    const distCCW = Math.hypot(labelCCW.x - centroid.x, labelCCW.y - centroid.y);
    return { tip, labelPt: distCW >= distCCW ? labelCW : labelCCW };
  }

  const labelLayouts = q.angles.map(ang => {
    if (ang.hideLabel || (ang.showRightAngleSquare && !ang.isUnknown)) return null;
    return labelLayout(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR);
  });

  const allSvgPts: Pt[] = geomPts.map(p => tp0(p));
  labelLayouts.forEach(d => { if (d) allSvgPts.push(d.labelPt); });
  const labelPad = small ? 28 : 40;
  const svgMinX = Math.min(...allSvgPts.map(p => p.x)) - labelPad, svgMaxX = Math.max(...allSvgPts.map(p => p.x)) + labelPad;
  const svgMinY = Math.min(...allSvgPts.map(p => p.y)) - labelPad, svgMaxY = Math.max(...allSvgPts.map(p => p.y)) + labelPad;
  const svgW = svgMaxX - svgMinX, svgH = svgMaxY - svgMinY;

  const tx = (x: number) => tx0(x) - svgMinX;
  const ty = (y: number) => ty0(y) - svgMinY;
  const tp = (p: Pt): Pt => ({ x: tx(p.x), y: ty(p.y) });
  const tps = (p: Pt): Pt => ({ x: p.x - svgMinX, y: p.y - svgMinY });

  function arcPath(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number): string {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const a1 = Math.atan2(f.y - v.y, f.x - v.x), a2 = Math.atan2(t2.y - v.y, t2.x - v.x);
    const sx = v.x + r * Math.cos(a1), sy = v.y + r * Math.sin(a1);
    const ex = v.x + r * Math.cos(a2), ey = v.y + r * Math.sin(a2);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return `M ${sx} ${sy} A ${r} ${r} 0 0 ${diff > 0 ? 1 : 0} ${ex} ${ey}`;
  }

  function sectorFill(arcVertex: Pt, arcFrom: Pt, arcTo: Pt, r: number): string {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const a1 = Math.atan2(f.y - v.y, f.x - v.x), a2 = Math.atan2(t2.y - v.y, t2.x - v.x);
    const sx = v.x + r * Math.cos(a1), sy = v.y + r * Math.sin(a1);
    const ex = v.x + r * Math.cos(a2), ey = v.y + r * Math.sin(a2);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return `M ${v.x} ${v.y} L ${sx} ${sy} A ${r} ${r} 0 0 ${diff > 0 ? 1 : 0} ${ex} ${ey} Z`;
  }

  function rightAngleSq(arcVertex: Pt, arcFrom: Pt, arcTo: Pt): JSX.Element {
    const v = tp(arcVertex), f = tp(arcFrom), t2 = tp(arcTo);
    const sz = small ? 9 : 14;
    const lenA = Math.hypot(f.x - v.x, f.y - v.y), lenC = Math.hypot(t2.x - v.x, t2.y - v.y);
    const uA = { x: (f.x - v.x) / lenA * sz, y: (f.y - v.y) / lenA * sz };
    const uC = { x: (t2.x - v.x) / lenC * sz, y: (t2.y - v.y) / lenC * sz };
    const p1 = { x: v.x + uA.x, y: v.y + uA.y };
    const p2 = { x: v.x + uA.x + uC.x, y: v.y + uA.y + uC.y };
    const p3 = { x: v.x + uC.x, y: v.y + uC.y };
    return <polyline points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="none" stroke="#1e293b" strokeWidth={strokeW * 0.8} />;
  }

  // Square off the viewBox around the fitted content so a tall/wide triangle never
  // overflows its panel and the diagram aspect is always 1 (handleDiagramPrint then
  // needs no per-question _aspect). On reveal, reserve a band at the bottom for the
  // "x = …" answer and shrink the diagram into the space above — the viewBox stays
  // square so the SVG never grows past its box (ScaleToFit only scales up).
  const side = Math.max(svgW, svgH);
  const vbX = (svgW - side) / 2, vbY = (svgH - side) / 2;
  const bcx = svgW / 2;
  const ansFs = fontSize * 1.35;
  const bandH = showAnswer ? ansFs * 1.9 : 0;
  const shapeF = showAnswer ? (side - bandH) / side : 1;
  const shapeTransform = `translate(${bcx} ${vbY}) scale(${shapeF}) translate(${-bcx} ${-vbY})`;
  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg viewBox={`${vbX} ${vbY} ${side} ${side}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", width: "100%", height: fillBox ? "100%" : "auto" }} {...extraProps}>
      <g transform={shapeTransform}>
      {q.straightLineExt && <line x1={tx(q.straightLineExt.from.x)} y1={ty(q.straightLineExt.from.y)} x2={tx(q.straightLineExt.to.x)} y2={ty(q.straightLineExt.to.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />}
      {q.edges.map(([a, b], i) => <line key={i} x1={tx(a.x)} y1={ty(a.y)} x2={tx(b.x)} y2={ty(b.y)} stroke="#1e293b" strokeWidth={strokeW} strokeLinecap="round" />)}
      {q.isoTickEdges?.flatMap(([a, b], i) => tickMark(a, b).map((t, ti) => <line key={`tick-${i}-${ti}`} x1={tx(t.x1)} y1={ty(t.y1)} x2={tx(t.x2)} y2={ty(t.y2)} stroke="#1e293b" strokeWidth={strokeW + 0.5} strokeLinecap="round" />))}
      {q.angles.map((ang, i) => !ang.isUnknown ? null : <path key={`sh-${i}`} d={sectorFill(ang.arcVertex, ang.arcFrom, ang.arcTo, unknownArcR)} fill="#bfdbfe" fillOpacity="0.45" stroke="none" />)}
      {q.angles.map((ang, i) => {
        if (ang.showRightAngleSquare) return <g key={`arc-${i}`}>{rightAngleSq(ang.arcVertex, ang.arcFrom, ang.arcTo)}</g>;
        return <path key={`arc-${i}`} d={arcPath(ang.arcVertex, ang.arcFrom, ang.arcTo, ang.isUnknown ? unknownArcR : arcR)} fill="none" stroke={ang.isUnknown ? "#2563eb" : "#475569"} strokeWidth={ang.isUnknown ? (small ? 2 : 2.5) : (small ? 1.5 : 2)} />;
      })}
      {q.angles.map((ang, i) => {
        if (ang.showRightAngleSquare && !ang.isUnknown) return null;
        if (ang.hideLabel) return null;
        const layout = labelLayouts[i]; if (!layout) return null;
        const tip = tps(layout.tip), lp = tps(layout.labelPt);
        const label = ang.isUnknown && !showAnswer ? ang.label : ang.isUnknown ? `${ang.value}°` : ang.label;
        const tw = estTW(label, fontSize), th = fontSize * 1.4;
        const colour = ang.isUnknown ? "#2563eb" : "#6b7280";
        const dx = tip.x - lp.x, dy = tip.y - lp.y, dlen = Math.hypot(dx, dy);
        const ux = dlen > 0.001 ? dx / dlen : 0, uy = dlen > 0.001 ? dy / dlen : 0;
        const boxHalfW = tw / 2 + 4, boxHalfH = th / 2 + 2;
        const tEdge = dlen > 0.001 ? Math.min(Math.abs(boxHalfW / (ux || 0.0001)), Math.abs(boxHalfH / (uy || 0.0001))) : 0;
        const lineStart: Pt = { x: lp.x + ux * (tEdge + 2), y: lp.y + uy * (tEdge + 2) };
        const arrowSize = small ? 5 : 7, px = -uy, py = ux;
        const arrowBase: Pt = { x: tip.x - ux * arrowSize, y: tip.y - uy * arrowSize };
        const arrowPt1: Pt  = { x: arrowBase.x + px * arrowSize * 0.45, y: arrowBase.y + py * arrowSize * 0.45 };
        const arrowPt2: Pt  = { x: arrowBase.x - px * arrowSize * 0.45, y: arrowBase.y - py * arrowSize * 0.45 };
        return (
          <g key={`lbl-${i}`}>
            <line x1={lineStart.x} y1={lineStart.y} x2={arrowBase.x} y2={arrowBase.y} stroke={colour} strokeWidth={small ? 1 : 1.5} strokeDasharray={small ? "3 2" : "5 3"} strokeLinecap="round" />
            <polygon points={`${tip.x},${tip.y} ${arrowPt1.x},${arrowPt1.y} ${arrowPt2.x},${arrowPt2.y}`} fill={colour} />
            <rect x={lp.x - tw / 2 - 4} y={lp.y - th / 2 - 2} width={tw + 8} height={th + 4} rx={4} fill={labelBg} fillOpacity="0.97" stroke="#000000" strokeWidth={0.5} />
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
  const d = (q as any)._diagram as TriQuestion | undefined;
  if (!d) return null;
  if (compact === true) {
    // Worksheet cell: a slightly landscape box keeps rows short so more fit on a
    // page; the square SVG letterboxes by height within it.
    return (
      <div style={{ width: "100%", aspectRatio: "1.4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <TriangleDiagram q={d} showAnswer={showAnswer} small dataIndex={idx} fillBox />
      </div>
    );
  }
  const maxW = compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <TriangleDiagram q={d} showAnswer={showAnswer} small={false} dataIndex={idx} />
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
      defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2", "level3"] };
