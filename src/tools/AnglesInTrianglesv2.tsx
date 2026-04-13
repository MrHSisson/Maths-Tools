import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG = {
  pageTitle: "Angles in a Triangle",
  tools: {
    anglesInTriangle: {
      name: "Angles in a Triangle",
      difficultySettings: {
        level1: {
          dropdown: {
            key: "rightAngle", label: "Right Angle",
            options: [
              { value: "none",       label: "No 90°",     },
              { value: "chance",     label: "1 in 6",     },
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
} as const;

type ToolKey = keyof typeof TOOL_CONFIG.tools;

const INFO_SECTIONS = [
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
const LV_LABELS:  Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS:  Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    fill: "#fee2e2" },
};

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
  const vals = [a0, a1, a2], verts = [v0, v1, v2], unknownIdx = rnd(0, 2);
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

function generateQuestion(_tool: string, level: string, vars: Record<string, unknown>): TriQuestion {
  if (level === "level1") return buildLevel1(vars);
  if (level === "level2") return buildLevel2(vars);
  return buildLevel3(vars);
}

function getUniqueQuestion(tool: string, level: string, vars: Record<string, unknown>, used: Set<string>): TriQuestion {
  let q: TriQuestion, key: string, attempts = 0;
  do { q = generateQuestion(tool, level, vars); key = `${q.id}`; } while (used.has(key) && ++attempts < 100);
  used.add(key); return q;
}

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────
interface DiagramProps { q: TriQuestion; showAnswer: boolean; small?: boolean; labelBg?: string; dataIndex?: number; }

function TriangleDiagram({ q, showAnswer, small = false, labelBg = "#ffffff", dataIndex }: DiagramProps) {
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

  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible", width: "100%", height: "100%" }} {...extraProps}>
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
    </svg>
  );
}

// ─── PRINT ────────────────────────────────────────────────────────────────────
const PRINT_COLS = 3;
const PRINT_ROWS = 5;
const PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function handlePrint(
  worksheet: TriQuestion[],
  isDiff: boolean,
  showAnswers: boolean,
  toolName: string,
  worksheetContainerRef: React.RefObject<HTMLDivElement>,
) {
  const container = worksheetContainerRef.current;
  if (!container) return;
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

  const buildStandardPages = (): string => {
    const pages: string[] = [];
    for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) {
      const slice = worksheet.slice(p, p + PRINT_PER_PAGE);
      const pageNum = Math.floor(p / PRINT_PER_PAGE) + 1;
      const totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, localIdx) => {
        const globalIdx = p + localIdx;
        return `<div class="cell"><div class="cell-num">${globalIdx + 1}</div><div class="cell-diagram">${svgStrings[globalIdx] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`;
      }).join("");
      pages.push(`<div class="page"><div class="page-header"><span class="page-title">${toolName}${showAnswers ? " — Answers" : ""}</span><span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${pageNum} of ${totalPages}` : ""}</span></div><div class="standard-grid">${cells}</div></div>`);
    }
    return pages.join("");
  };

  const buildDiffPages = (): string => {
    const byLevel: Record<string, TriQuestion[]> = {
      level1: worksheet.filter(q => q.level === "level1"),
      level2: worksheet.filter(q => q.level === "level2"),
      level3: worksheet.filter(q => q.level === "level3"),
    };
    const offsetByLevel: Record<string, number> = {
      level1: 0,
      level2: byLevel.level1.length,
      level3: byLevel.level1.length + byLevel.level2.length,
    };
    const lvNames: Record<string, string>  = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
    const lvColors: Record<string, string> = { level1: "#166534", level2: "#854d0e", level3: "#991b1b" };
    const lvBg: Record<string, string>     = { level1: "#dcfce7", level2: "#fef9c3", level3: "#fee2e2" };
    const totalPages = Math.ceil(Math.max(...Object.values(byLevel).map(a => a.length)) / PRINT_ROWS);
    const pages: string[] = [];
    for (let p = 0; p < totalPages; p++) {
      const cols = ["level1", "level2", "level3"].map(lv => {
        const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const offset = offsetByLevel[lv];
        const cells = qs.map((q, localIdx) => {
          const globalIdx = offset + p * PRINT_ROWS + localIdx;
          return `<div class="cell"><div class="cell-num">${p * PRINT_ROWS + localIdx + 1}</div><div class="cell-diagram">${svgStrings[globalIdx] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`;
        }).join("");
        return `<div class="diff-col"><div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div><div class="diff-cells">${cells}</div></div>`;
      }).join("");
      pages.push(`<div class="page"><div class="page-header"><span class="page-title">${toolName}${showAnswers ? " — Answers" : ""}</span><span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : ""}</span></div><div class="diff-grid">${cols}</div></div>`);
    }
    return pages.join("");
  };

  const questionsHtml  = isDiff ? buildDiffPages() : buildStandardPages();
  // Build answer pages by flipping showAnswers
  const answersHtml = (() => {
    if (isDiff) {
      const byLevel: Record<string, TriQuestion[]> = {
        level1: worksheet.filter(q => q.level === "level1"),
        level2: worksheet.filter(q => q.level === "level2"),
        level3: worksheet.filter(q => q.level === "level3"),
      };
      const offsetByLevel: Record<string, number> = { level1: 0, level2: byLevel.level1.length, level3: byLevel.level1.length + byLevel.level2.length };
      const lvNames: Record<string, string>  = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
      const lvColors: Record<string, string> = { level1: "#166534", level2: "#854d0e", level3: "#991b1b" };
      const lvBg: Record<string, string>     = { level1: "#dcfce7", level2: "#fef9c3", level3: "#fee2e2" };
      const totalPages = Math.ceil(Math.max(...Object.values(byLevel).map(a => a.length)) / PRINT_ROWS);
      return Array.from({ length: totalPages }, (_, p) => {
        const cols = ["level1", "level2", "level3"].map(lv => {
          const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
          const offset = offsetByLevel[lv];
          const cells = qs.map((q, li) => {
            const gi = offset + p * PRINT_ROWS + li;
            return `<div class="cell"><div class="cell-num">${p * PRINT_ROWS + li + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div><div class="answer">${q.answer}</div></div>`;
          }).join("");
          return `<div class="diff-col"><div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div><div class="diff-cells">${cells}</div></div>`;
        }).join("");
        return `<div class="page"><div class="page-header"><span class="page-title">${toolName} — Answers</span><span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : ""}</span></div><div class="diff-grid">${cols}</div></div>`;
      }).join("");
    }
    return Array.from({ length: Math.ceil(worksheet.length / PRINT_PER_PAGE) }, (_, p) => {
      const slice = worksheet.slice(p * PRINT_PER_PAGE, (p + 1) * PRINT_PER_PAGE);
      const totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, li) => {
        const gi = p * PRINT_PER_PAGE + li;
        return `<div class="cell"><div class="cell-num">${gi + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div><div class="answer">${q.answer}</div></div>`;
      }).join("");
      return `<div class="page"><div class="page-header"><span class="page-title">${toolName} — Answers</span><span class="page-meta">${dateStr}${totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : ""}</span></div><div class="standard-grid">${cells}</div></div>`;
    }).join("");
  })();

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4 portrait; margin:12mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  .page { width:186mm; height:273mm; display:flex; flex-direction:column; page-break-after:always; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  .page-header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:0.5mm solid #1e3a8a; padding-bottom:2mm; margin-bottom:3mm; flex-shrink:0; }
  .page-title { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-meta  { font-size:3mm; color:#6b7280; }
  .standard-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(5,1fr); gap:2mm; flex:1; min-height:0; }
  .diff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; flex:1; min-height:0; }
  .diff-col  { display:flex; flex-direction:column; gap:2mm; min-height:0; }
  .diff-col-header { text-align:center; font-size:3.5mm; font-weight:700; padding:1.5mm 0; border-radius:1.5mm; flex-shrink:0; }
  .diff-cells { display:flex; flex-direction:column; gap:2mm; flex:1; min-height:0; }
  .cell { border:0.3mm solid #d1d5db; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; overflow:hidden; flex:1; min-height:0; position:relative; }
  .cell-num { position:absolute; top:1.5mm; left:2mm; font-size:2.8mm; font-weight:700; color:#374151; }
  .cell-diagram { width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .cell-diagram svg { width:100%; height:100%; overflow:visible; }
  .answer { font-size:3mm; font-weight:700; color:#059669; text-align:center; flex-shrink:0; margin-top:1mm; }
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

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function getQuestionBg(cs: string) { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff"); }
function getStepBg(cs: string)     { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6"); }

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {(["level1", "level2", "level3"] as const).map((val, i) => {
      const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
      return <button key={val} onClick={() => onChange(val)} className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>Level {i + 1}</button>;
    })}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: { dropdown: any; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map((opt: any) => <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{opt.label}</button>)}
    </div>
  </div>
);

const VariablesSection = ({ variables, values, onChange }: { variables: any[]; values: Record<string, unknown>; onChange: (k: string, v: boolean) => void }) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !(values[v.key]))} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }: any) => {
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
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables?.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!dropdown && !variables?.length && <p className="text-sm text-gray-400">No options at this level.</p>}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: any) => {
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
            const dd = toolSettings.difficultySettings?.[lv]?.dropdown;
            const vars = toolSettings.difficultySettings?.[lv]?.variables ?? [];
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={(v: string) => onLevelDropdownChange(lv, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k: string, v: boolean) => onLevelVariableChange(lv, k, v)} />}
                  {!dd && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AnglesInTriangleTool() {
  const navigate = useNavigate();
  const currentTool: ToolKey = "anglesInTriangle";
  const worksheetContainerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState("whiteboard");
  const [difficulty, setDifficulty] = useState("level1");

  // ── Per-level QO state ────────────────────────────────────────────────────
  const makeDefaultLevelVars = () => {
    const ds = TOOL_CONFIG.tools[currentTool].difficultySettings as any;
    const out: Record<string, Record<string, unknown>> = {};
    ["level1", "level2", "level3"].forEach(lv => {
      out[lv] = {};
      (ds[lv]?.variables ?? []).forEach((v: any) => { out[lv][v.key] = v.defaultValue; });
    });
    return out;
  };
  const makeDefaultLevelDDs = () => {
    const ds = TOOL_CONFIG.tools[currentTool].difficultySettings as any;
    return { level1: ds.level1?.dropdown?.defaultValue ?? "", level2: ds.level2?.dropdown?.defaultValue ?? "", level3: ds.level3?.dropdown?.defaultValue ?? "" };
  };

  const [levelVars, setLevelVars] = useState<Record<string, Record<string, unknown>>>(makeDefaultLevelVars);
  const [levelDDs,  setLevelDDs]  = useState<Record<string, string>>(makeDefaultLevelDDs);

  const setLevelVar = (lv: string, k: string, v: unknown) =>
    setLevelVars(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const setLevelDD  = (lv: string, v: string) =>
    setLevelDDs(p => ({ ...p, [lv]: v }));

  const getToolDS    = () => TOOL_CONFIG.tools[currentTool].difficultySettings as any;
  const getDDConfig  = () => getToolDS()[difficulty]?.dropdown ?? null;
  const getVarsConfig = () => getToolDS()[difficulty]?.variables ?? [];

  const buildVars = (lv: string): Record<string, unknown> => {
    const ddCfg = getToolDS()[lv]?.dropdown;
    return { ...(levelVars[lv] ?? {}), ...(ddCfg ? { [ddCfg.key]: levelDDs[lv] ?? ddCfg.defaultValue } : {}) };
  };

  // ── Display / worksheet state ─────────────────────────────────────────────
  const [question, setQuestion] = useState<TriQuestion | null>(null);
  const [showWBAnswer,   setShowWBAnswer]   = useState(false);
  const [showAnswer,     setShowAnswer]     = useState(false);
  const [numQuestions,   setNumQuestions]   = useState(5);
  const [worksheet,      setWorksheet]      = useState<TriQuestion[]>([]);
  const [showWSAnswers,  setShowWSAnswers]  = useState(false);
  const [isDiff,         setIsDiff]         = useState(false);
  const [colorScheme,    setColorScheme]    = useState("default");
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [infoOpen,       setInfoOpen]       = useState(false);

  // Font sizes
  const displayFontSizes  = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  // ── Whiteboard / visualiser state ─────────────────────────────────────────
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

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefaultScheme ? "#f5f3f0" : qBg;

  const stdQOProps = {
    variables: getVarsConfig(), variableValues: levelVars[difficulty] ?? {},
    onVariableChange: (k: string, v: unknown) => setLevelVar(difficulty, k, v),
    dropdown: getDDConfig(), dropdownValue: levelDDs[difficulty] ?? getDDConfig()?.defaultValue ?? "",
    onDropdownChange: (v: string) => setLevelDD(difficulty, v),
  };
  const diffQOProps = {
    toolSettings: TOOL_CONFIG.tools[currentTool], levelVariables: levelVars,
    onLevelVariableChange: setLevelVar, levelDropdowns: levelDDs, onLevelDropdownChange: setLevelDD,
  };

  const newQuestion = () => {
    setQuestion(generateQuestion(currentTool, difficulty, buildVars(difficulty)));
    setShowWBAnswer(false); setShowAnswer(false);
  };
  const generateWorksheet = () => {
    const used = new Set<string>();
    const qs: TriQuestion[] = [];
    if (isDiff) {
      ["level1", "level2", "level3"].forEach(lv => {
        for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, lv, buildVars(lv), used));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, difficulty, buildVars(difficulty), used));
    }
    setWorksheet(qs); setShowWSAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") newQuestion(); }, [difficulty]);

  // ── Font size button style ────────────────────────────────────────────────
  const fontBtn = (enabled: boolean) => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.35,
  });

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: TriQuestion, globalIdx: number, bgOverride?: string) => (
    <div key={globalIdx} className="rounded-lg shadow flex flex-col items-center gap-1 p-3" style={{ backgroundColor: bgOverride ?? stepBg, minHeight: 220 }}>
      <span className="text-sm font-bold text-gray-700 self-start">{globalIdx + 1}.</span>
      <div style={{ width: 220, height: 200, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <TriangleDiagram q={q} showAnswer={showWSAnswers} small labelBg={bgOverride ?? stepBg} dataIndex={globalIdx} />
      </div>
      {showWSAnswers && <span className="text-sm font-bold text-center" style={{ color: "#059669" }}>{q.answer}</span>}
    </div>
  );

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Row 1 */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {(["level1", "level2", "level3"] as const).map((val, i) => {
              const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
              return <button key={val} onClick={() => { setDifficulty(val); setIsDiff(false); }} className={`px-5 py-2 font-bold text-base transition-colors ${!isDiff && difficulty === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>Level {i + 1}</button>;
            })}
          </div>
          <button onClick={() => setIsDiff(!isDiff)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDiff ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
        </div>
        {/* Row 2 */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {isDiff ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions{isDiff ? " per level" : ""}:</label>
            <input type="number" min="1" max="15" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(15, parseInt(e.target.value) || 5)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base text-center" />
          </div>
        </div>
        {/* Row 3 */}
        <div className="flex justify-center items-center gap-4">
          <button onClick={generateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate Worksheet
          </button>
          {worksheet.length > 0 && <>
            <button onClick={() => setShowWSAnswers(!showWSAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {showWSAnswers ? "Hide Answers" : "Show Answers"}
            </button>
            <button onClick={() => handlePrint(worksheet, isDiff, showWSAnswers, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)}
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
        <button style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)} title="Increase font size"><ChevronUp  size={16} color="#6b7280" /></button>
      </div>
    );

    const questionBox = (isFS: boolean) => (
      <div style={{
        position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        ...(isFS
          ? { width: "40%", height: "100%", backgroundColor: fsQuestionBg, padding: 32, boxSizing: "border-box", flexShrink: 0 }
          : { width: "500px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 })
      }}>
        {fontControls}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 44, paddingRight: 44 }}>
          <span className={`${displayFontSizes[displayFontSize]} font-bold text-black text-center`}>Find the missing angle</span>
        </div>
        {showWBAnswer && question && <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{question.answer}</span>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", flex: 1, minHeight: 0 }}>
          {question
            ? <TriangleDiagram q={question} showAnswer={showWBAnswer} labelBg={isFS ? fsQuestionBg : stepBg} />
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
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
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
            <button style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp  size={16} color="#6b7280" /></button>
          </div>
          <span className={`${displayFontSizes[displayFontSize]} font-bold text-black`}>Find the missing angle</span>
        </div>
        {question ? (
          <>
            <div className="flex justify-center mb-6" style={{ maxWidth: 500, margin: "0 auto 1.5rem" }}>
              <TriangleDiagram q={question} showAnswer={showAnswer} labelBg={stepBg} />
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
        <h2 className="text-3xl font-bold text-center mb-8 text-black">Angles in a Triangle — Worksheet</h2>
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
        <h2 className="text-3xl font-bold text-center mb-8 text-black">Angles in a Triangle — Worksheet</h2>
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
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          {/* No sub-tool buttons — single tool */}
          <div className="flex justify-center gap-4 mb-8">
            {[["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]].map(([m, label]) => (
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
