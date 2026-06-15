import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type PrintMode,
  type ToolMultiSelect, type ToolVariable,
  tStep,
} from "../../shared";

type ToolKey = "rightAngle" | "straightLine" | "aroundPoint" | "verticallyOpposite" | "mixed";

interface SegmentDef { angleDeg: number; }
interface AngleDef {
  label: string; isUnknown: boolean; value: number;
  arcFromDeg: number; arcToDeg: number; bisectorDeg: number;
  blank?: boolean;
}
interface AngleQuestion {
  tool: string; level: string; difficulty?: string; key?: string;
  rotationDeg: number; segments: SegmentDef[]; angles: AngleDef[];
  answer: string; working: { text: string }[]; id: number;
  showSquare?: boolean; answer2?: string;
}
type QOVars = Record<string, unknown>;

const NUM_TYPE: ToolMultiSelect = {
  key: "numberType", label: "Number Type",
  options: [
    { value: "integer", label: "Integers", defaultActive: true },
    { value: "decimal", label: "Decimals", defaultActive: false },
  ],
};
const PARTS: ToolMultiSelect = {
  key: "parts", label: "Parts",
  options: [
    { value: "two", label: "2 parts", defaultActive: true },
    { value: "three", label: "3 parts", defaultActive: true },
  ],
};
const ALG_L12: ToolMultiSelect = {
  key: "algOptions", label: "Algebraic Options", allowEmpty: true,
  options: [
    { value: "coefficient", label: "Coefficient", sub: "(e.g. 2x)", defaultActive: false },
    { value: "constant", label: "Constant", sub: "(e.g. x + 14)", defaultActive: false },
    { value: "both", label: "Both", sub: "(e.g. 2x + 30)", defaultActive: false },
  ],
};
const ALG_L3: ToolMultiSelect = {
  key: "algOptions", label: "Algebraic Options", allowEmpty: true,
  options: [
    { value: "useCoefficients", label: "Coefficients", sub: "(e.g. 2x)", defaultActive: false },
  ],
};
const VO_L1_VARIANTS: ToolMultiSelect = {
  key: "voL1Variants", label: "Question Type",
  options: [
    { value: "matching", label: "Matching (identify x & y)", defaultActive: true },
    { value: "calculation", label: "Calculation (find x & y)", defaultActive: true },
  ],
};
const VO_L2_VARIANTS: ToolMultiSelect = {
  key: "voL2Variants", label: "Question Type",
  options: [
    { value: "findX", label: "Find x (both subs given)", defaultActive: true },
    { value: "findSub", label: "Find sub (x + sub = VO)", defaultActive: true },
  ],
};
const VO_L3_VARIANTS: ToolMultiSelect = {
  key: "voL3Variants", label: "Question Type",
  options: [
    { value: "pureVO", label: "Pure VO (two expressions)", defaultActive: true },
    { value: "subdivided", label: "Subdivided (sum = expression)", defaultActive: false },
  ],
};
const ANGLE_TYPE: ToolMultiSelect = {
  key: "angleType", label: "Angle Types",
  options: [
    { value: "rightAngle", label: "90°", defaultActive: true },
    { value: "straightLine", label: "180°", defaultActive: true },
    { value: "aroundPoint", label: "360°", defaultActive: true },
    { value: "verticallyOpposite", label: "Vert. Opp.", defaultActive: true },
  ],
};
const SHOW_SQUARE: ToolVariable = { key: "showSquare", label: "Show right angle square symbol", defaultValue: true };
const FIXED_ROTATION: ToolVariable = { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle", variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [SHOW_SQUARE], multiSelect: [ALG_L12, NUM_TYPE] },
        level2: { variables: [SHOW_SQUARE], multiSelect: [ALG_L12, NUM_TYPE] },
        level3: { variables: [SHOW_SQUARE], multiSelect: [ALG_L3, PARTS] },
      },
    },
    straightLine: {
      name: "Straight Line", variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [FIXED_ROTATION], multiSelect: [ALG_L12, NUM_TYPE] },
        level2: { variables: [FIXED_ROTATION], multiSelect: [ALG_L12, NUM_TYPE] },
        level3: { variables: [FIXED_ROTATION], multiSelect: [ALG_L3, PARTS] },
      },
    },
    aroundPoint: {
      name: "Around a Point", variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [ALG_L12, NUM_TYPE] },
        level2: { variables: [], multiSelect: [ALG_L12, NUM_TYPE] },
        level3: { variables: [], multiSelect: [ALG_L3, PARTS] },
      },
    },
    verticallyOpposite: {
      name: "Vertically Opposite", variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [VO_L1_VARIANTS] },
        level2: { variables: [], multiSelect: [VO_L2_VARIANTS, ALG_L12] },
        level3: { variables: [], multiSelect: [VO_L3_VARIANTS, ALG_L3] },
      },
    },
    mixed: {
      name: "Mixed Practice", variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], multiSelect: [ALG_L12, NUM_TYPE, ANGLE_TYPE] },
        level2: { variables: [], multiSelect: [ALG_L12, NUM_TYPE, ANGLE_TYPE] },
        level3: { variables: [], multiSelect: [ALG_L3, ANGLE_TYPE] },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "Right Angle", icon: "⊾", content: [{ label: "Overview", detail: "Angles inside a right angle always sum to 90°." }, { label: "Level 1", detail: "One interior ray. One given angle, find x." }, { label: "Level 2", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 90°." }] },
  { title: "Straight Line", icon: "📐", content: [{ label: "Overview", detail: "Angles on a straight line always sum to 180°." }, { label: "Level 1", detail: "One interior ray. One given angle, find x." }, { label: "Level 2", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 180°." }] },
  { title: "Around a Point", icon: "🔵", content: [{ label: "Overview", detail: "Angles around a point always sum to 360°." }, { label: "Level 1", detail: "3 sectors. Two given, find x." }, { label: "Level 2", detail: "4 sectors. Three given, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 360°." }] },
  { title: "Vertically Opposite", icon: "✕", content: [{ label: "Overview", detail: "Two straight lines intersecting. Vertically opposite angles are equal." }, { label: "Level 1", detail: "Matching: identify x and y from two given adjacent angles. Calculation: one angle given, find x and y." }, { label: "Level 2", detail: "One sector subdivided. Find x from sub-angles, or find a missing sub-angle." }, { label: "Level 3", detail: "Algebraic VO pairs — set equal and solve." }] },
  { title: "Mixed", icon: "🔀", content: [{ label: "Overview", detail: "Combines 90°, 180° and 360° questions." }] },
  { title: "Modes", icon: "🖥️", content: [{ label: "Whiteboard", detail: "Single question with working space." }, { label: "Worked Example", detail: "Step-by-step solution." }, { label: "Worksheet", detail: "Grid with PDF export." }] },
];

function rnd(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a: number, b: number): number { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }
function exprLabel(c: number, k: number): string { const base = c === 1 ? "x" : `${c}x`; if (k === 0) return base; if (k > 0) return `${base} + ${k}`; return `${base} − ${Math.abs(k)}`; }
function coefXLabel(c: number): string { if (c === 1) return "x"; if (c === -1) return "−x"; return c > 0 ? `${c}x` : `−${Math.abs(c)}x`; }
function numLabel(n: number): string { return n >= 0 ? `${n}` : `−${Math.abs(n)}`; }
function pickX(minVal: number, maxVal: number, useDecimal: boolean): number | null { if (minVal > maxVal) return null; if (!useDecimal) { const lo = Math.ceil(minVal), hi = Math.floor(maxVal); if (lo > hi) return null; return rnd(lo, hi); } const lo = Math.ceil(minVal * 10), hi = Math.floor(maxVal * 10); if (lo > hi) return null; return Math.round(rnd(lo, hi)) / 10; }
function pickExprType(vars: QOVars): string | null { const active: string[] = []; if (vars.coefficient) active.push("coefficient"); if (vars.constant) active.push("constant"); if (vars.both) active.push("both"); if (active.length === 0) return null; return active[Math.floor(Math.random() * active.length)]; }
function splitIntoN(total: number, n: number, minPart: number, useDecimal: boolean): number[] | null { if (total < n * minPart) return null; const parts: number[] = []; let remaining = total; for (let i = 0; i < n - 1; i++) { const lo = minPart, hi = remaining - (n - 1 - i) * minPart; if (lo > hi) return null; let part: number; if (useDecimal) part = Math.round(rndDecimal(lo, hi) * 10) / 10; else part = rnd(Math.ceil(lo), Math.floor(hi)); parts.push(part); remaining = Math.round((remaining - part) * 10) / 10; } const last = Math.round(remaining * 10) / 10; if (last < minPart) return null; parts.push(last); return parts; }
function resolveUseDecimal(vars: QOVars): boolean { const intOn = vars.integer !== undefined ? !!vars.integer : true; const decOn = !!vars.decimal; if (intOn && decOn) return Math.random() < 0.5; if (decOn) return true; return false; }
function resolveParts(vars: QOVars): "two" | "three" { const twoOn = vars.two !== false && (vars.two !== undefined ? !!vars.two : true); const threeOn = vars.three !== false && (vars.three !== undefined ? !!vars.three : true); if (twoOn && threeOn) return Math.random() < 0.5 ? "two" : "three"; if (threeOn) return "three"; return "two"; }
function pickActiveVariant(vars: QOVars, keys: string[]): string { const active = keys.filter(k => vars[k]); if (active.length === 0) return keys[0]; return active[Math.floor(Math.random() * active.length)]; }

// ─── RIGHT ANGLE ─────────────────────────────────────────────────────────────
function rightSector(rot: number): { sectorStart: number; sectorEnd: number } { const sectorStart = ((3 - rot) * 90 + 360) % 360; return { sectorStart, sectorEnd: sectorStart + 90 }; }

function buildRightL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rot = rnd(0, 3); const { sectorStart, sectorEnd } = rightSector(rot);
  const TOTAL = 90, MIN_A = 8, MIN_E = 10, MAX_E = 80;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, knownVal = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 3) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(15, TOTAL - cx - MIN_A)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; knownVal = Math.round((TOTAL - exprVal) * 10) / 10;
      if (knownVal < MIN_A || exprVal < MIN_E || exprVal > MAX_E) continue; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 20; k = 0; exprVal = 40; knownVal = 50; }
    const xLabel = exprLabel(c, k); const knownFirst = rnd(0, 1) === 0;
    const fs = knownFirst ? knownVal : exprVal, ss = knownFirst ? exprVal : knownVal; const rayDeg = sectorStart + fs; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }], angles: [{ label: knownFirst ? `${knownVal}°` : xLabel, isUnknown: !knownFirst, value: fs, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + fs / 2 }, { label: knownFirst ? xLabel : `${knownVal}°`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fs + ss / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${knownVal}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const x = pickX(MIN_A, TOTAL - MIN_A, useDecimal) ?? 45; const known = Math.round((TOTAL - x) * 10) / 10; const knownFirst = rnd(0, 1) === 0;
  const fs = knownFirst ? known : x, ss = knownFirst ? x : known; const rayDeg = sectorStart + fs;
  return { tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }], angles: [{ label: knownFirst ? `${known}°` : "x", isUnknown: !knownFirst, value: fs, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + fs / 2 }, { label: knownFirst ? "x" : `${known}°`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fs + ss / 2 }], answer: `x = ${x}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `x = 90° − ${known}°` }, { text: `x = ${x}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildRightL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rot = rnd(0, 3); const { sectorStart, sectorEnd } = rightSector(rot);
  const TOTAL = 90, MIN_P = 8, MIN_E = 10, MAX_E = 70;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 3) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue; const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(12, TOTAL - cx - MIN_P * 2)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue; p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 15; k = 0; exprVal = 30; p1 = 30; p2 = 30; }
    const xLabel = exprLabel(c, k); const r1 = sectorStart + p1, r2 = sectorStart + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }], angles: [{ label: `${p1}°`, isUnknown: false, value: p1, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + p1 / 2 }, { label: `${p2}°`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + p1 + p2 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + p1 + p2 + exprVal / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${p1}° + ${p2}° + ${xLabel} = 90°` }, { text: `${p1 + p2}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) { const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue; const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue; xVal = x; p1 = parts[0]; p2 = parts[1]; found = true; }
  if (!found) { xVal = 30; p1 = 30; p2 = 30; }
  const ui = rnd(0, 2); const all = ui === 0 ? [xVal, p1, p2] : ui === 1 ? [p1, xVal, p2] : [p1, p2, xVal];
  const r1 = sectorStart + all[0], r2 = sectorStart + all[0] + all[1]; const ap: [number, number][] = [[sectorStart, r1], [r1, r2], [r2, sectorEnd]];
  return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }], angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}°`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${all.filter((_, i) => i !== ui).join("° + ")}° + x = 90°` }, { text: `${TOTAL - xVal}° + x = 90°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildRightL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const partsChoice = resolveParts(vars); const twoRegions = partsChoice === "two";
  const rot = rnd(0, 3); const { sectorStart, sectorEnd } = rightSector(rot); const TOTAL = 90;
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 3) : 1; c2 = useCoef ? rnd(1, 3) : 1; const tc = c1 + c2; const xMin = Math.ceil(10 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 10) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 40) continue; if (c1 * x < 10 || c2 * x + kv < 10) continue; xVal = x; k = kv; found = true; }
    if (!found) { c1 = 1; c2 = 1; xVal = 30; k = 30; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
    return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: sectorStart + a1 }, { angleDeg: sectorEnd }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: sectorStart, arcToDeg: sectorStart + a1, bisectorDeg: sectorStart + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: sectorStart + a1, arcToDeg: sectorEnd, bisectorDeg: sectorStart + a1 + a2 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 90°` }, { text: `${tc}x ${kStr} = 90°` }, { text: `${tc}x = ${TOTAL - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 3) : 1; c2 = useCoef ? rnd(1, 3) : 1; fixed = rnd(10, 30); const rem = TOTAL - fixed; const tc = c1 + c2; const xMin = Math.ceil(10 / Math.min(c1, c2)), xMax = Math.floor((rem - 10) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 30) continue; if (c1 * x < 10 || c2 * x + kv < 10) continue; xVal = x; k = kv; found = true; }
  if (!found) { c1 = 1; c2 = 1; fixed = 20; xVal = 25; k = 20; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`; const r1 = sectorStart + fixed, r2 = sectorStart + fixed + a2;
  return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }], angles: [{ label: `${fixed}°`, isUnknown: false, value: fixed, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixed + a2 + a3 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${fixed}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 90°` }, { text: `${tc}x ${kStr} + ${fixed}° = 90°` }, { text: `${tc}x = ${TOTAL - fixed - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── STRAIGHT LINE ────────────────────────────────────────────────────────────
function buildStraightL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135]; const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lld = rotationDeg + 180; const TOTAL = 180, MIN_A = 15, MIN_E = 20, MAX_E = 160;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, knownVal = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1; const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue; const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(25, TOTAL - cx - MIN_A)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; knownVal = Math.round((TOTAL - exprVal) * 10) / 10;
      if (knownVal < MIN_A || exprVal < MIN_E || exprVal > MAX_E) continue; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 40; k = 0; exprVal = 80; knownVal = 100; }
    const xLabel = exprLabel(c, k); const knownFirst = rnd(0, 1) === 0; const fs = knownFirst ? knownVal : exprVal, ss = knownFirst ? exprVal : knownVal; const rayDeg = lld + fs; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "straightLine", level: "level1", rotationDeg: rotationDeg as number, segments: [{ angleDeg: lld }, { angleDeg: rayDeg }, { angleDeg: rotationDeg as number }], angles: [{ label: knownFirst ? `${knownVal}°` : xLabel, isUnknown: !knownFirst, value: fs, arcFromDeg: lld, arcToDeg: rayDeg, bisectorDeg: lld + fs / 2 }, { label: knownFirst ? xLabel : `${knownVal}°`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + fs + ss / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${knownVal}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const x = pickX(MIN_A, TOTAL - MIN_A, useDecimal) ?? 90; const known = Math.round((TOTAL - x) * 10) / 10; const knownFirst = rnd(0, 1) === 0;
  const fs = knownFirst ? known : x, ss = knownFirst ? x : known; const rayDeg = lld + fs;
  return { tool: "straightLine", level: "level1", rotationDeg: rotationDeg as number, segments: [{ angleDeg: lld }, { angleDeg: rayDeg }, { angleDeg: rotationDeg as number }], angles: [{ label: knownFirst ? `${known}°` : "x", isUnknown: !knownFirst, value: fs, arcFromDeg: lld, arcToDeg: rayDeg, bisectorDeg: lld + fs / 2 }, { label: knownFirst ? "x" : `${known}°`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + fs + ss / 2 }], answer: `x = ${x}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `x = 180° − ${known}°` }, { text: `x = ${x}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135]; const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lld = rotationDeg + 180; const TOTAL = 180, MIN_P = 15, MIN_E = 20, MAX_E = 140;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1; const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue; const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(25, TOTAL - cx - MIN_P * 2)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue; p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 30; k = 0; exprVal = 60; p1 = 60; p2 = 60; }
    const xLabel = exprLabel(c, k); const r1 = lld + p1, r2 = lld + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "straightLine", level: "level2", rotationDeg: rotationDeg as number, segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg as number }], angles: [{ label: `${p1}°`, isUnknown: false, value: p1, arcFromDeg: lld, arcToDeg: r1, bisectorDeg: lld + p1 / 2 }, { label: `${p2}°`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lld + p1 + p2 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + p1 + p2 + exprVal / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${p1}° + ${p2}° + ${xLabel} = 180°` }, { text: `${p1 + p2}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) { const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue; const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue; xVal = x; p1 = parts[0]; p2 = parts[1]; found = true; }
  if (!found) { xVal = 60; p1 = 60; p2 = 60; }
  const ui = rnd(0, 2); const all = ui === 0 ? [xVal, p1, p2] : ui === 1 ? [p1, xVal, p2] : [p1, p2, xVal];
  const r1 = lld + all[0], r2 = lld + all[0] + all[1]; const rd = rotationDeg as number; const ap: [number, number][] = [[lld, r1], [r1, r2], [r2, rd + 360]];
  return { tool: "straightLine", level: "level2", rotationDeg: rd, segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rd }], angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}°`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${all.filter((_, i) => i !== ui).join("° + ")}° + x = 180°` }, { text: `${TOTAL - xVal}° + x = 180°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const rotations = [0, 45, 90, 135];
  const rd = (vars.fixedRotation ? 0 : rotations[rnd(0, 3)]) as number; const lld = rd + 180; const partsChoice = resolveParts(vars); const twoLines = partsChoice === "two"; const TOTAL = 180;
  if (twoLines) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; const tc = c1 + c2; const xMin = Math.ceil(20 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 20) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 60) continue; if (c1 * x < 20 || c2 * x + kv < 20) continue; xVal = x; k = kv; found = true; }
    if (!found) { c1 = 1; c2 = 2; xVal = 40; k = TOTAL - 3 * 40; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
    return { tool: "straightLine", level: "level3", rotationDeg: rd, segments: [{ angleDeg: lld }, { angleDeg: lld + a1 }, { angleDeg: rd }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: lld, arcToDeg: lld + a1, bisectorDeg: lld + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: lld + a1, arcToDeg: rd + 360, bisectorDeg: lld + a1 + a2 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 180°` }, { text: `${tc}x ${kStr} = 180°` }, { text: `${tc}x = ${TOTAL - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; fixed = rnd(20, 60); const rem = TOTAL - fixed; const tc = c1 + c2; const xMin = Math.ceil(20 / Math.min(c1, c2)), xMax = Math.floor((rem - 20) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 50) continue; if (c1 * x < 20 || c2 * x + kv < 20) continue; xVal = x; k = kv; found = true; }
  if (!found) { c1 = 1; c2 = 1; fixed = 40; xVal = 50; k = TOTAL - 40 - 2 * 50; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`; const r1 = lld + fixed, r2 = lld + fixed + a2;
  return { tool: "straightLine", level: "level3", rotationDeg: rd, segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rd }], angles: [{ label: `${fixed}°`, isUnknown: false, value: fixed, arcFromDeg: lld, arcToDeg: r1, bisectorDeg: lld + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lld + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: rd + 360, bisectorDeg: lld + fixed + a2 + a3 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${fixed}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 180°` }, { text: `${tc}x ${kStr} + ${fixed}° = 180°` }, { text: `${tc}x = ${TOTAL - fixed - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── AROUND A POINT ───────────────────────────────────────────────────────────
function buildAroundL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const sd = 270; const TOTAL = 360, MIN_P = 25, MIN_E = 30, MAX_E = 280;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1; const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue; const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(30, TOTAL - cx - MIN_P * 2)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue; p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 60; k = 0; exprVal = 120; p1 = 120; p2 = 120; }
    const xLabel = exprLabel(c, k); const r1 = sd + p1, r2 = sd + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }], angles: [{ label: `${p1}°`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}°`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + exprVal / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${p1}° + ${p2}° + ${xLabel} = 360°` }, { text: `${p1 + p2}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) { const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue; const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue; xVal = x; p1 = parts[0]; p2 = parts[1]; found = true; }
  if (!found) { xVal = 120; p1 = 120; p2 = 120; }
  const r1 = sd + p1, r2 = sd + p1 + p2;
  return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }], angles: [{ label: `${p1}°`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}°`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: "x", isUnknown: true, value: xVal, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + xVal / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${p1}° + ${p2}° + x = 360°` }, { text: `${p1 + p2}° + x = 360°` }, { text: `x = 360° − ${p1 + p2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const sd = 270; const TOTAL = 360, MIN_P = 25, MIN_E = 30, MAX_E = 240;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, p3 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1; const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue; const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(30, TOTAL - cx - MIN_P * 3)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 3) continue;
      const parts = splitIntoN(kt, 3, MIN_P, useDecimal); if (!parts) continue; p1 = parts[0]; p2 = parts[1]; p3 = parts[2]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 40; k = 0; exprVal = 80; p1 = 90; p2 = 100; p3 = 90; }
    const xLabel = exprLabel(c, k); const r1 = sd + p1, r2 = sd + p1 + p2, r3 = sd + p1 + p2 + p3; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: r3 }], angles: [{ label: `${p1}°`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}°`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: `${p3}°`, isUnknown: false, value: p3, arcFromDeg: r2, arcToDeg: r3, bisectorDeg: sd + p1 + p2 + p3 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r3, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + p3 + exprVal / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${p1}° + ${p2}° + ${p3}° + ${xLabel} = 360°` }, { text: `${p1 + p2 + p3}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}°` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, p1 = 0, p2 = 0, p3 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) { const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue; const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 3, MIN_P, useDecimal); if (!parts) continue; xVal = x; p1 = parts[0]; p2 = parts[1]; p3 = parts[2]; found = true; }
  if (!found) { xVal = 90; p1 = 90; p2 = 90; p3 = 90; }
  const ui = rnd(0, 3); const all = ui === 0 ? [xVal, p1, p2, p3] : ui === 1 ? [p1, xVal, p2, p3] : ui === 2 ? [p1, p2, xVal, p3] : [p1, p2, p3, xVal];
  let cum = 0; const rays = all.map(v => { const d = sd + cum; cum += v; return d; }); const ap: [number, number][] = all.map((_, i) => [rays[i], i < all.length - 1 ? rays[i + 1] : sd + 360]);
  return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: rays.map(d => ({ angleDeg: d })), angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}°`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${all.filter((_, i) => i !== ui).join("° + ")}° + x = 360°` }, { text: `${TOTAL - xVal}° + x = 360°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const partsChoice = resolveParts(vars); const twoRegions = partsChoice === "two";
  const sd = 270; const TOTAL = 360;
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; const tc = c1 + c2; const xMin = Math.ceil(30 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 30) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 80) continue; if (c1 * x < 30 || c2 * x + kv < 30) continue; xVal = x; k = kv; found = true; }
    if (!found) { c1 = 1; c2 = 2; xVal = 80; k = TOTAL - 3 * 80; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
    return { tool: "aroundPoint", level: "level3", rotationDeg: 0, segments: [{ angleDeg: sd }, { angleDeg: sd + a1 }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: sd, arcToDeg: sd + a1, bisectorDeg: sd + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: sd + a1, arcToDeg: sd + 360, bisectorDeg: sd + a1 + a2 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 360°` }, { text: `${tc}x ${kStr} = 360°` }, { text: `${tc}x = ${TOTAL - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) { c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; fixed = rnd(30, 100); const rem = TOTAL - fixed; const tc = c1 + c2; const xMin = Math.ceil(30 / Math.min(c1, c2)), xMax = Math.floor((rem - 30) / tc); if (xMax < xMin) continue; const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 60) continue; if (c1 * x < 30 || c2 * x + kv < 30) continue; xVal = x; k = kv; found = true; }
  if (!found) { c1 = 1; c2 = 1; fixed = 60; xVal = 100; k = TOTAL - 60 - 2 * 100; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`; const r1 = sd + fixed, r2 = sd + fixed + a2;
  return { tool: "aroundPoint", level: "level3", rotationDeg: 0, segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }], angles: [{ label: `${fixed}°`, isUnknown: false, value: fixed, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + fixed + a2 + a3 / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${fixed}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 360°` }, { text: `${tc}x ${kStr} + ${fixed}° = 360°` }, { text: `${tc}x = ${TOTAL - fixed - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── VERTICALLY OPPOSITE ──────────────────────────────────────────────────────
function pickVOAngle(): number { return rnd(20, 160); }
function voRot(vars: QOVars): number { if (vars.fixedRotation) return 0; return rnd(0, 179); }

function makeVOQuestion(
  tool: string, level: string, rot: number, alpha: number,
  labels: (string | null)[], unknowns: number[],
  answer: string, answer2: string | undefined,
  working: { text: string }[],
): AngleQuestion {
  const betaVO = 180 - alpha;
  const vals = [alpha, betaVO, alpha, betaVO];
  const r0 = rot, r1 = rot + alpha, r2 = rot + 180, r3 = rot + 180 + alpha;
  const bounds = [r0, r1, r2, r3];
  const segs: SegmentDef[] = bounds.map(a => ({ angleDeg: a }));
  const angles: AngleDef[] = vals.map((v, i) => {
    const from = bounds[i], to = bounds[(i + 1) % 4] + (i === 3 ? 360 : 0);
    return { label: labels[i] === null ? "" : (labels[i] ?? `${v}°`), isUnknown: unknowns.includes(i), value: v, arcFromDeg: from, arcToDeg: to, bisectorDeg: from + v / 2, blank: labels[i] === null };
  });
  return { tool, level, rotationDeg: rot, segments: segs, angles, answer, answer2, working, id: Math.floor(Math.random() * 1e6) };
}

function buildVOL1(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["matching", "calculation"]);
  const rot = voRot(vars); const alpha = pickVOAngle(); const betaL1 = 180 - alpha;
  if (variant === "matching") {
    const xyFlip = rnd(0, 1) === 0;
    const labels: (string | null)[] = [`${alpha}°`, `${betaL1}°`, xyFlip ? "x" : "y", xyFlip ? "y" : "x"];
    const xVal = xyFlip ? alpha : betaL1; const yVal = xyFlip ? betaL1 : alpha;
    return makeVOQuestion("verticallyOpposite", "level1", rot, alpha, labels, [2, 3], `x = ${xVal}°`, `y = ${yVal}°`, [{ text: "Vertically opposite angles are equal" }, { text: `x = ${xVal}° (vertically opposite ${xVal}°)` }, { text: `y = ${yVal}° (vertically opposite ${yVal}°)` }]);
  }
  const voIsX = rnd(0, 1) === 0; const labelledAdj = rnd(0, 1) === 0 ? 1 : 3;
  const voLabel = voIsX ? "x" : "y"; const adjLabel = voIsX ? "y" : "x";
  const labels: (string | null)[] = [`${alpha}°`, labelledAdj === 1 ? adjLabel : null, voLabel, labelledAdj === 3 ? adjLabel : null];
  return makeVOQuestion("verticallyOpposite", "level1", rot, alpha, labels, [2, labelledAdj], `${voLabel} = ${alpha}°`, `${adjLabel} = ${betaL1}°`, [{ text: "Vertically opposite angles are equal" }, { text: `${voLabel} = ${alpha}°` }, { text: "Angles on a straight line sum to 180°" }, { text: `${adjLabel} = 180° − ${alpha}° = ${betaL1}°` }]);
}

function buildVOL2(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["findX", "findSub"]);
  const exprType = pickExprType(vars);
  const rot = voRot(vars);
  let alpha = pickVOAngle();
  while (alpha < 30) alpha = pickVOAngle();
  const minSub = 15;
  const betaL2 = 180 - alpha;

  if (variant === "findX") {
    if (exprType !== null) {
      const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      let xVal = 0, k = 0, exprVal = 0, numericSub = 0, found = false;
      for (let att = 0; att < 300 && !found; att++) {
        const xMin = Math.max(1, Math.ceil(minSub / c)); const xMax = Math.floor((alpha - minSub) / c); if (xMax < xMin) continue;
        const x = rnd(xMin, xMax); const cx = c * x;
        k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(20, alpha - minSub - cx)) : 0; if (k < 0) continue;
        const ev = cx + k; if (ev < minSub || ev > alpha - minSub) continue;
        const ns = alpha - ev; if (ns < minSub) continue;
        xVal = x; exprVal = ev; numericSub = ns; found = true;
      }
      if (!found) { xVal = 10; k = 0; exprVal = Math.floor(alpha / 2); numericSub = alpha - exprVal; }
      const xLabel = exprLabel(c, k); const exprIsSub1 = rnd(0, 1) === 0;
      const sub1 = exprIsSub1 ? exprVal : numericSub, sub2 = exprIsSub1 ? numericSub : exprVal; const subRay = rot + sub1;
      const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`; const cxStr = `${c * xVal}`;
      const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
      const angles: AngleDef[] = [
        { label: exprIsSub1 ? xLabel : `${numericSub}°`, isUnknown: exprIsSub1, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
        { label: exprIsSub1 ? `${numericSub}°` : xLabel, isUnknown: !exprIsSub1, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
        { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL2 / 2 },
        { label: `${alpha}°`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
        { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL2 / 2 },
      ];
      return { tool: "verticallyOpposite", level: "level2", rotationDeg: rot, segments: segs, angles, answer: `x = ${xVal}°`, working: [{ text: "Vertically opposite angles are equal" }, { text: `${exprLabel(c, k)} + ${numericSub}° = ${alpha}°` }, { text: `${exprLabel(c, k)} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x ${kStr} = ${exprVal}°` }, { text: `${c === 1 ? "" : c}x = ${cxStr}` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
    }
    // Numeric findX: both subs given, x = α (VO)
    const parts = splitIntoN(alpha, 2, minSub, false) ?? [Math.floor(alpha / 2), alpha - Math.floor(alpha / 2)];
    const [sub1, sub2] = parts; const subRay = rot + sub1;
    const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
    const angles: AngleDef[] = [
      { label: `${sub1}°`, isUnknown: false, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
      { label: `${sub2}°`, isUnknown: false, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL2 / 2 },
      { label: "x", isUnknown: true, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL2 / 2 },
    ];
    return { tool: "verticallyOpposite", level: "level2", rotationDeg: rot, segments: segs, angles, answer: `x = ${alpha}°`, working: [{ text: "Vertically opposite angles are equal" }, { text: `x = ${sub1}° + ${sub2}°` }, { text: `x = ${alpha}°` }], id: Math.floor(Math.random() * 1e6) };
  }

  // findSub
  if (exprType !== null) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    let xVal = 0, k = 0, exprVal = 0, knownSub = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      const xMin = Math.max(1, Math.ceil(minSub / c)); const xMax = Math.floor((alpha - minSub) / c); if (xMax < xMin) continue;
      const x = rnd(xMin, xMax); const cx = c * x;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(20, alpha - minSub - cx)) : 0; if (k < 0) continue;
      const ev = cx + k; if (ev < minSub || ev > alpha - minSub) continue;
      const ks = alpha - ev; if (ks < minSub) continue;
      xVal = x; exprVal = ev; knownSub = ks; found = true;
    }
    if (!found) { xVal = 10; k = 0; exprVal = Math.floor(alpha / 2); knownSub = alpha - exprVal; }
    const xLabel = exprLabel(c, k); const exprIsSub1 = rnd(0, 1) === 0;
    const sub1 = exprIsSub1 ? exprVal : knownSub, sub2 = exprIsSub1 ? knownSub : exprVal; const subRay = rot + sub1;
    const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`; const cxStr = `${c * xVal}`;
    const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
    const angles: AngleDef[] = [
      { label: exprIsSub1 ? xLabel : `${knownSub}°`, isUnknown: exprIsSub1, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
      { label: exprIsSub1 ? `${knownSub}°` : xLabel, isUnknown: !exprIsSub1, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL2 / 2 },
      { label: `${alpha}°`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL2 / 2 },
    ];
    return { tool: "verticallyOpposite", level: "level2", rotationDeg: rot, segments: segs, angles, answer: `x = ${xVal}°`, working: [{ text: "Vertically opposite angles are equal" }, { text: `${xLabel} + ${knownSub}° = ${alpha}°` }, { text: `${xLabel} = ${exprVal}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x ${kStr} = ${exprVal}°` }, { text: `${c === 1 ? "" : c}x = ${cxStr}` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  // Numeric findSub
  const parts = splitIntoN(alpha, 2, minSub, false) ?? [Math.floor(alpha / 2), alpha - Math.floor(alpha / 2)];
  const [sub1Fs, sub2Fs] = parts; const xIsSub1 = rnd(0, 1) === 0;
  const xVal = xIsSub1 ? sub1Fs : sub2Fs; const knownSub = xIsSub1 ? sub2Fs : sub1Fs; const subRay = rot + sub1Fs;
  const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
  const angles: AngleDef[] = [
    { label: xIsSub1 ? "x" : `${sub1Fs}°`, isUnknown: xIsSub1, value: sub1Fs, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1Fs / 2 },
    { label: xIsSub1 ? `${sub2Fs}°` : "x", isUnknown: !xIsSub1, value: sub2Fs, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2Fs / 2 },
    { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL2 / 2 },
    { label: `${alpha}°`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
    { label: "", isUnknown: false, blank: true, value: betaL2, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL2 / 2 },
  ];
  return { tool: "verticallyOpposite", level: "level2", rotationDeg: rot, segments: segs, angles, answer: `x = ${xVal}°`, working: [{ text: "Vertically opposite angles are equal" }, { text: `x + ${knownSub}° = ${alpha}°` }, { text: `x = ${alpha}° − ${knownSub}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildVOL3(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["pureVO", "subdivided"]);
  const useCoef = !!vars.useCoefficients; const rot = voRot(vars);
  if (variant === "pureVO") {
    let xVal = 0, c1 = 1, c2 = 1, k1 = 0, k2 = 0, alpha = 0, found = false;
    for (let att = 0; att < 500 && !found; att++) {
      c1 = useCoef ? rnd(1, 5) : 1; c2 = useCoef ? rnd(1, 5) : 1 + rnd(1, 3);
      if (c1 === c2) continue;
      xVal = rnd(5, 40); k1 = rnd(-20, 40); k2 = rnd(-20, 40); alpha = c1 * xVal + k1;
      if (alpha < 20 || alpha > 160) continue;
      if (c2 * xVal + k2 !== alpha) { k2 = alpha - c2 * xVal; if (Math.abs(k2) > 50) continue; }
      if (c1 === c2 && k1 === k2) continue; found = true;
    }
    if (!found) { c1 = 3; c2 = 1; xVal = 15; k1 = 5; alpha = 3 * 15 + 5; k2 = alpha - 15; }
    const betaL3pv = 180 - alpha;
    const labels: (string | null)[] = [exprLabel(c1, k1), null, exprLabel(c2, k2), null];
    const dc = c1 - c2, dk = k2 - k1;
    const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
    const angles: AngleDef[] = [
      { label: exprLabel(c1, k1), isUnknown: true, value: alpha, arcFromDeg: rot, arcToDeg: rot + alpha, bisectorDeg: rot + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL3pv, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL3pv / 2 },
      { label: exprLabel(c2, k2), isUnknown: true, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: betaL3pv, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL3pv / 2 },
    ];
    void labels;
    return { tool: "verticallyOpposite", level: "level3", rotationDeg: rot, segments: segs, angles, answer: `x = ${xVal}`, working: [{ text: "Vertically opposite angles are equal" }, { text: `${exprLabel(c1, k1)} = ${exprLabel(c2, k2)}` }, ...(dc !== 1 ? [{ text: `${coefXLabel(dc)} = ${numLabel(dk)}` }] : []), { text: `x = ${xVal}` }], id: Math.floor(Math.random() * 1e6) };
  }
  // subdivided
  let xVal = 0, c1 = 1, c2 = 2, k1 = 0, k2 = 0, fixed = 0, alpha = 0, found = false;
  for (let att = 0; att < 500 && !found; att++) {
    c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(c1 + 1, c1 + 4) : c1 + rnd(1, 3);
    xVal = rnd(5, 35); k1 = rnd(0, 20); fixed = rnd(10, 40); k2 = rnd(0, 30);
    const forcedAlpha = c1 * xVal + k1 + fixed;
    if (forcedAlpha < 30 || forcedAlpha > 160) continue;
    k2 = forcedAlpha - c2 * xVal; if (k2 < -20 || k2 > 50) continue;
    alpha = forcedAlpha;
    const sub1Check = c1 * xVal + k1; if (sub1Check < 10 || fixed < 10 || sub1Check + fixed !== alpha) continue;
    found = true;
  }
  if (!found) { c1 = 1; c2 = 2; xVal = 20; k1 = 5; fixed = 15; alpha = 60; k2 = alpha - c2 * xVal; }
  const betaL3sd = 180 - alpha; const sub1Val = c1 * xVal + k1; const subRay = rot + sub1Val;
  const dc = c2 - c1; const dk = k1 + fixed - k2;
  const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
  const angles: AngleDef[] = [
    { label: exprLabel(c1, k1), isUnknown: true, value: sub1Val, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1Val / 2 },
    { label: `${fixed}°`, isUnknown: false, value: fixed, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + fixed / 2 },
    { label: "", isUnknown: false, blank: true, value: betaL3sd, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + betaL3sd / 2 },
    { label: exprLabel(c2, k2), isUnknown: true, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
    { label: "", isUnknown: false, blank: true, value: betaL3sd, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + betaL3sd / 2 },
  ];
  return { tool: "verticallyOpposite", level: "level3", rotationDeg: rot, segments: segs, angles, answer: `x = ${xVal}`, working: [{ text: "Vertically opposite angles are equal" }, { text: `${exprLabel(c1, k1)} + ${fixed}° = ${exprLabel(c2, k2)}` }, ...(dc !== 1 ? [{ text: `${coefXLabel(dc)} = ${numLabel(dk)}` }] : []), { text: `x = ${xVal}` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
function buildAngleQuestion(tool: string, level: string, vars: QOVars): AngleQuestion {
  let q: AngleQuestion;
  if (tool === "mixed") {
    const active: string[] = [];
    if (vars.rightAngle !== false) active.push("rightAngle");
    if (vars.straightLine !== false) active.push("straightLine");
    if (vars.aroundPoint !== false) active.push("aroundPoint");
    if (vars.verticallyOpposite !== false) active.push("verticallyOpposite");
    const pool = active.length > 0 ? active : ["rightAngle", "straightLine", "aroundPoint", "verticallyOpposite"];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    q = buildAngleQuestion(picked, level, vars); q.difficulty = level; q.key = `mixed-${level}-${q.id}`; return q;
  }
  if (tool === "verticallyOpposite") {
    if (level === "level1") q = buildVOL1(vars); else if (level === "level2") q = buildVOL2(vars); else q = buildVOL3(vars);
  } else if (tool === "rightAngle") {
    if (level === "level1") q = buildRightL1(vars); else if (level === "level2") q = buildRightL2(vars); else q = buildRightL3(vars);
  } else if (tool === "straightLine") {
    if (level === "level1") q = buildStraightL1(vars); else if (level === "level2") q = buildStraightL2(vars); else q = buildStraightL3(vars);
  } else {
    if (level === "level1") q = buildAroundL1(vars); else if (level === "level2") q = buildAroundL2(vars); else q = buildAroundL3(vars);
  }
  q.difficulty = level; q.key = `${tool}-${level}-${q.id}`; return q;
}

// ─── SVG / DIAGRAM ────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
function toRad(d: number): number { return d * DEG; }
function pt(cx: number, cy: number, r: number, deg: number): [number, number] { return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))]; }
function sectorPath(cx: number, cy: number, r: number, f: number, t: number): string { let sw = t - f; while (sw < 0) sw += 360; while (sw > 360) sw -= 360; const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sw); return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2} Z`; }
function arcPath(cx: number, cy: number, r: number, f: number, t: number): string { let sw = t - f; while (sw < 0) sw += 360; while (sw > 360) sw -= 360; const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sw); return `M${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2}`; }
function estTW(label: string, fs: number): number { return label.length * fs * 0.68 + fs * 0.6; }
function outwardBisectorDir(fromDeg: number, toDeg: number): [number, number] { let sw = toDeg - fromDeg; while (sw < 0) sw += 360; while (sw > 360) sw -= 360; const mid = fromDeg + sw / 2; return [Math.cos(toRad(mid)), Math.sin(toRad(mid))]; }
function leaderLayout(vx: number, vy: number, arcR: number, leaderLen: number, fromDeg: number, toDeg: number) { const [bx, by] = outwardBisectorDir(fromDeg, toDeg); return { tipX: vx + bx * arcR, tipY: vy + by * arcR, labelX: vx + bx * (arcR + leaderLen), labelY: vy + by * (arcR + leaderLen) }; }

interface LLProps { tipX: number; tipY: number; labelX: number; labelY: number; label: string; fontSize: number; isUnknown: boolean; showAnswer: boolean; value: number; small: boolean; }
function LeaderLabel({ tipX, tipY, labelX, labelY, label, fontSize, isUnknown, showAnswer, value, small }: LLProps) {
  const disp = isUnknown && !showAnswer ? label : isUnknown ? `${value}°` : label;
  const tw = estTW(disp, fontSize), th = fontSize * 1.4; const col = isUnknown ? "#2563eb" : "#6b7280";
  const dx = tipX - labelX, dy = tipY - labelY, dl = Math.sqrt(dx * dx + dy * dy);
  const ux = dl > 0.001 ? dx / dl : 0, uy = dl > 0.001 ? dy / dl : 0;
  const tEdge = dl > 0.001 ? Math.min(Math.abs((tw / 2 + 4) / (ux || 0.0001)), Math.abs((th / 2 + 2) / (uy || 0.0001))) : 0;
  const lsx = labelX + ux * (tEdge + 2), lsy = labelY + uy * (tEdge + 2);
  const as = small ? 4 : 6, px = -uy, py = ux; const abx = tipX - ux * as, aby = tipY - uy * as;
  return (<g><line x1={lsx} y1={lsy} x2={abx} y2={aby} stroke={col} strokeWidth={small ? 0.8 : 1.2} strokeDasharray={small ? "3 2" : "4 3"} strokeLinecap="round" /><polygon points={`${tipX},${tipY} ${abx + px * as * 0.4},${aby + py * as * 0.4} ${abx - px * as * 0.4},${aby - py * as * 0.4}`} fill={col} /><rect x={labelX - tw / 2 - 4} y={labelY - th / 2 - 2} width={tw + 8} height={th + 4} rx={3} fill="white" fillOpacity="0.97" stroke={isUnknown ? "#93c5fd" : "#d1d5db"} strokeWidth={0.6} /><text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontStyle={isUnknown && !showAnswer ? "italic" : "normal"} fontWeight={isUnknown ? "bold" : "600"} fill={isUnknown ? "#1d4ed8" : "#111827"}>{disp}</text></g>);
}

interface DiagramProps { q: AngleQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number; fillBox?: boolean; }
function AngleDiagram({ q, showAnswer, small = false, dataIndex, fillBox = false }: DiagramProps) {
  const svgStyle = { display: "block", width: "100%", height: fillBox ? "100%" : "auto", overflow: "visible" } as const;
  const size = small ? 300 : 340; const tfp = small ? 17 : 28;
  const ARC_SM = size * (small ? 0.20 : 0.22); const ARC_MD = size * (small ? 0.225 : 0.245); const ARC_LG = size * (small ? 0.25 : 0.27);
  const arcRFor = (deg: number) => deg <= 30 ? ARC_SM : deg <= 60 ? ARC_MD : ARC_LG;
  const LL = small ? 42 : 64;
  const ep = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};

  if (q.tool === "verticallyOpposite") {
    const margin = small ? 18 : 60, vbs = size + margin * 2; const cx = vbs / 2, cy = vbs / 2, ll2 = size * 0.55;
    const allRays = q.segments.map(s => s.angleDeg);
    const cp: number[][] = [[cx, cy]];
    allRays.forEach(a => { const [px2, py2] = pt(cx, cy, ll2, a); cp.push([px2, py2]); });
    q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); cp.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
    const cPad = small ? 10 : 18;
    const cx0 = Math.min(...cp.map(p => p[0])) - cPad, cy0 = Math.min(...cp.map(p => p[1])) - cPad;
    const cx1 = Math.max(...cp.map(p => p[0])) + cPad, cy1 = Math.max(...cp.map(p => p[1])) + cPad;
    const cd = Math.max(cx1 - cx0, cy1 - cy0); const ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
    const fs = tfp * cd / (small ? 266 : 460);
    return (<svg viewBox={`${ccx - cd / 2} ${ccy - cd / 2} ${cd} ${cd}`} style={svgStyle} preserveAspectRatio="xMidYMid meet" {...ep}>{q.angles.map((ang, i) => (!ang.isUnknown || ang.blank) ? null : <path key={`sh${i}`} d={sectorPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.5" stroke="none" />)}{allRays.map((a, i) => { const [px2, py2] = pt(cx, cy, ll2, a); return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}{q.angles.map((ang, i) => ang.blank ? null : <path key={`arc${i}`} d={arcPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}{q.angles.map((ang, i) => { if (ang.blank) return null; const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}<circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" /></svg>);
  }

  if (q.tool === "rightAngle") {
    const inset = small ? 22 : 48, armLen = size - inset - (small ? 8 : 16);
    const rot = q.rotationDeg; const corners: [number, number][] = [[inset, size - inset], [size - inset, size - inset], [size - inset, inset], [inset, inset]];
    const [vx, vy] = corners[rot]; const ss2 = q.segments[0].angleDeg, se = q.segments[q.segments.length - 1].angleDeg;
    const [b1x, b1y] = pt(vx, vy, armLen, ss2), [b2x, b2y] = pt(vx, vy, armLen, se);
    const iSegs = q.segments.slice(1, -1); const sqSz = size * 0.085;
    const s1r = toRad(ss2), s2r = toRad(se);
    const sq1 = [vx + Math.cos(s1r) * sqSz, vy + Math.sin(s1r) * sqSz];
    const sq2 = [vx + Math.cos(s1r) * sqSz + Math.cos(s2r) * sqSz, vy + Math.sin(s1r) * sqSz + Math.sin(s2r) * sqSz];
    const sq3 = [vx + Math.cos(s2r) * sqSz, vy + Math.sin(s2r) * sqSz];
    const gp: number[][] = [[vx, vy], [b1x, b1y], [b2x, b2y]];
    iSegs.forEach(seg => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); gp.push([px2, py2]); });
    q.angles.forEach(ang => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); gp.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
    const pad = small ? 14 : 22;
    const bx0 = Math.min(...gp.map(p => p[0])) - pad, by0 = Math.min(...gp.map(p => p[1])) - pad;
    const bx1 = Math.max(...gp.map(p => p[0])) + pad, by1 = Math.max(...gp.map(p => p[1])) + pad;
    const bd = Math.max(bx1 - bx0, by1 - by0); const bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;
    const fs = tfp * bd / (small ? 266 : 460);
    return (<svg viewBox={`${bcx - bd / 2} ${bcy - bd / 2} ${bd} ${bd}`} style={svgStyle} preserveAspectRatio="xMidYMid meet" {...ep}>{q.angles.map((ang, i) => ang.isUnknown ? <path key={`sh${i}`} d={sectorPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" /> : null)}<line x1={vx} y1={vy} x2={b1x} y2={b1y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" /><line x1={vx} y1={vy} x2={b2x} y2={b2y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />{iSegs.map((seg, i) => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); return <line key={`ray${i}`} x1={vx} y1={vy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}{q.showSquare !== false && <polyline points={`${sq1[0]},${sq1[1]} ${sq2[0]},${sq2[1]} ${sq3[0]},${sq3[1]}`} fill="none" stroke="#1e293b" strokeWidth={small ? 1.5 : 2.5} strokeLinejoin="miter" />}{q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}{q.angles.map((ang, i) => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}<circle cx={vx} cy={vy} r={small ? 3 : 4} fill="#1e293b" /></svg>);
  }

  const margin = small ? 18 : 60, vbs = size + margin * 2; const cx = vbs / 2, cy = vbs / 2, ll2 = size * 0.62;
  const cp: number[][] = [[cx, cy]];
  q.segments.forEach(seg => { const [px2, py2] = pt(cx, cy, ll2, seg.angleDeg); cp.push([px2, py2]); });
  q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); cp.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
  const cPad = small ? 10 : 18;
  const cx0 = Math.min(...cp.map(p => p[0])) - cPad, cy0 = Math.min(...cp.map(p => p[1])) - cPad;
  const cx1 = Math.max(...cp.map(p => p[0])) + cPad, cy1 = Math.max(...cp.map(p => p[1])) + cPad;
  const cd = Math.max(cx1 - cx0, cy1 - cy0); const ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
  const fs = tfp * cd / (small ? 266 : 460);
  return (<svg viewBox={`${ccx - cd / 2} ${ccy - cd / 2} ${cd} ${cd}`} style={svgStyle} preserveAspectRatio="xMidYMid meet" {...ep}>{q.tool === "aroundPoint" && <circle cx={cx} cy={cy} r={ll2} fill="none" stroke="#e5e7eb" strokeWidth={small ? 1 : 1.5} strokeDasharray="4 4" />}{q.angles.map((ang, i) => !ang.isUnknown ? null : <path key={`sh${i}`} d={sectorPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" />)}{q.segments.map((seg, i) => { const [px2, py2] = pt(cx, cy, ll2, seg.angleDeg); return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}{q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}{q.angles.map((ang, i) => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}<circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" /></svg>);
}

// ─── QUESTION CONVERSION & RENDERING ───────────────────────────────────────────
function angleQToSimple(q: AngleQuestion, level: DifficultyLevel): AnyQuestion {
  return {
    kind: "simple",
    display: q.answer2 ? "Find x and y" : "Find x",
    answer: q.answer2 ? `${q.answer}, ${q.answer2}` : q.answer,
    working: q.working.map(w => tStep(w.text)),
    key: q.key ?? `${q.tool}-${level}-${q.id}`,
    difficulty: level,
    _diagram: q,
  } as unknown as AnyQuestion;
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const vars: QOVars = { ...variables, ...(multiSelectValues ?? {}) };
  const q = buildAngleQuestion(tool, level, vars);
  return angleQToSimple(q, level);
}

const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _colorScheme: string, compact?: boolean, idx?: number): JSX.Element | null => {
  const d = (q as any)._diagram as AngleQuestion | undefined;
  if (!d) return null;
  const note = d.tool === "rightAngle";
  if (compact === true) {
    // Worksheet cell: fill the cell and letterbox the square SVG by height so it
    // never spills out of the box, whatever the cell's aspect ratio.
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AngleDiagram q={d} showAnswer={showAnswer} small dataIndex={idx} fillBox />
        </div>
        {note && (
          <div className="text-center text-gray-500 italic" style={{ fontSize: "0.6em", lineHeight: 1.1, flexShrink: 0, marginTop: 2 }}>
            The diagram depicts a right angle
          </div>
        )}
      </div>
    );
  }
  const maxW = compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <AngleDiagram q={d} showAnswer={showAnswer} small={false} dataIndex={idx} />
      {note && (
        <div className="text-xs text-center text-gray-500 italic" style={{ marginTop: 4 }}>
          The diagram depicts a right angle
        </div>
      )}
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
  const toolKey = (questions[0]?.key.split("-")[0] ?? "rightAngle") as ToolKey;
  const toolName = TOOL_CONFIG.tools[toolKey].name;
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
      defaults={{ fixedColumns: true, numColumns: 3 }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion };
