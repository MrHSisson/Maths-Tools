import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Eye, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type DifficultyLevel = "level1" | "level2" | "level3";
type ToolKey = "rightAngle" | "straightLine" | "aroundPoint" | "verticallyOpposite" | "mixed";

interface SegmentDef { angleDeg: number; }
interface AngleDef {
  label: string; isUnknown: boolean; value: number;
  arcFromDeg: number; arcToDeg: number; bisectorDeg: number;
  blank?: boolean; // if true: draw no arc and no leader label
}
interface AngleQuestion {
  tool: string; level: string; difficulty?: string; key?: string;
  rotationDeg: number; segments: SegmentDef[]; angles: AngleDef[];
  answer: string; working: { text: string }[]; id: number;
  showSquare?: boolean; _qo?: Record<string, unknown>; _tool?: string;
  // VO-specific: second answer for L1 matching
  answer2?: string;
}
type QOVars = Record<string, unknown>;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

interface MSOption { value: string; label: string; defaultActive: boolean; }
interface MultiSelectCfg { key: string; label: string; options: MSOption[]; }
interface VarCfg { key: string; label: string; defaultValue: boolean; }
interface LevelSettings {
  variables: VarCfg[];
  multiSelect?: MultiSelectCfg;
  multiSelect2?: MultiSelectCfg;
  multiSelect3?: MultiSelectCfg;
}
interface ToolCfg { name: string; difficultySettings: Record<DifficultyLevel, LevelSettings>; }

const mkNumType = (): MultiSelectCfg => ({
  key: "numberType", label: "Number Type",
  options: [
    { value: "integer", label: "Integers", defaultActive: true },
    { value: "decimal", label: "Decimals", defaultActive: false },
  ],
});
const mkParts = (): MultiSelectCfg => ({
  key: "parts", label: "Parts",
  options: [
    { value: "two", label: "2 parts", defaultActive: true },
    { value: "three", label: "3 parts", defaultActive: true },
  ],
});
const mkAlgL12 = (): MultiSelectCfg => ({
  key: "algOptions", label: "Algebraic Options",
  options: [
    { value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false },
    { value: "constant",    label: "Constant|(e.g. x+14)", defaultActive: false },
    { value: "both",        label: "Both|(e.g. 2x+30)",   defaultActive: false },
  ],
});
const mkAlgL3 = (): MultiSelectCfg => ({
  key: "algOptions", label: "Algebraic Options",
  options: [
    { value: "useCoefficients", label: "Coefficients|(e.g. 2x)", defaultActive: false },
  ],
});

// VO-specific multiselects
const mkVOL1Variants = (): MultiSelectCfg => ({
  key: "voL1Variants", label: "Question Type",
  options: [
    { value: "matching",     label: "Matching|(identify x & y)", defaultActive: true },
    { value: "calculation",  label: "Calculation|(find x & y)",  defaultActive: true },
  ],
});
const mkVOL2Variants = (): MultiSelectCfg => ({
  key: "voL2Variants", label: "Question Type",
  options: [
    { value: "findX",   label: "Find x|(both subs given)",          defaultActive: true },
    { value: "findSub", label: "Find sub|(x + sub = VO)",           defaultActive: true },
  ],
});
const mkVOL2Alg = (): MultiSelectCfg => ({
  key: "algOptions", label: "Algebraic Options",
  options: [
    { value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false },
    { value: "constant",    label: "Constant|(e.g. x+14)", defaultActive: false },
    { value: "both",        label: "Both|(e.g. 2x+30)",   defaultActive: false },
  ],
});
const mkVOL3Variants = (): MultiSelectCfg => ({
  key: "voL3Variants", label: "Question Type",
  options: [
    { value: "pureVO",       label: "Pure VO|(two expressions)",     defaultActive: true },
    { value: "subdivided",   label: "Subdivided|(sum = expression)", defaultActive: false },
  ],
});

const TOOL_CONFIG: { pageTitle: string; tools: Record<ToolKey, ToolCfg> } = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle",
      difficultySettings: {
        level1: { variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level2: { variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level3: { variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: mkAlgL3(), multiSelect3: mkParts() },
      },
    },
    straightLine: {
      name: "Straight Line",
      difficultySettings: {
        level1: { variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level2: { variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level3: { variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: mkAlgL3(), multiSelect3: mkParts() },
      },
    },
    aroundPoint: {
      name: "Around a Point",
      difficultySettings: {
        level1: { variables: [], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level2: { variables: [], multiSelect: mkAlgL12(), multiSelect2: mkNumType() },
        level3: { variables: [], multiSelect: mkAlgL3(), multiSelect3: mkParts() },
      },
    },
    verticallyOpposite: {
      name: "Vertically Opposite",
      difficultySettings: {
        level1: { variables: [], multiSelect: mkVOL1Variants() },
        level2: { variables: [], multiSelect: mkVOL2Variants(), multiSelect2: mkVOL2Alg() },
        level3: { variables: [], multiSelect: mkVOL3Variants(), multiSelect2: mkAlgL3() },
      },
    },
    mixed: {
      name: "Mixed Practice",
      difficultySettings: {
        level1: { variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: mkAlgL12(), multiSelect2: mkNumType(), multiSelect3: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }, { value: "verticallyOpposite", label: "Vert. Opp.", defaultActive: true }] } },
        level2: { variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: mkAlgL12(), multiSelect2: mkNumType(), multiSelect3: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }, { value: "verticallyOpposite", label: "Vert. Opp.", defaultActive: true }] } },
        level3: { variables: [], multiSelect: mkAlgL3(), multiSelect3: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }, { value: "verticallyOpposite", label: "Vert. Opp.", defaultActive: true }] } },
      },
    },
  },
};

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};
const INFO_SECTIONS = [
  { title: "Right Angle", icon: "⊾", content: [{ label: "Overview", detail: "Angles inside a right angle always sum to 90°." }, { label: "Level 1", detail: "One interior ray. One given angle, find x." }, { label: "Level 2", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 90°." }] },
  { title: "Straight Line", icon: "📐", content: [{ label: "Overview", detail: "Angles on a straight line always sum to 180°." }, { label: "Level 1", detail: "One interior ray. One given angle, find x." }, { label: "Level 2", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 180°." }] },
  { title: "Around a Point", icon: "🔵", content: [{ label: "Overview", detail: "Angles around a point always sum to 360°." }, { label: "Level 1", detail: "3 sectors. Two given, find x." }, { label: "Level 2", detail: "4 sectors. Three given, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 360°." }] },
  { title: "Vertically Opposite", icon: "✕", content: [{ label: "Overview", detail: "Two straight lines intersecting. Vertically opposite angles are equal." }, { label: "Level 1", detail: "Matching: identify x and y from two given adjacent angles. Calculation: one angle given, find x and y." }, { label: "Level 2", detail: "One sector subdivided. Find x from sub-angles, or find a missing sub-angle." }, { label: "Level 3", detail: "Algebraic VO pairs — set equal and solve." }] },
  { title: "Mixed", icon: "🔀", content: [{ label: "Overview", detail: "Combines 90°, 180° and 360° questions." }] },
  { title: "Modes", icon: "🖥️", content: [{ label: "Whiteboard", detail: "Single question with working space." }, { label: "Worked Example", detail: "Step-by-step solution." }, { label: "Worksheet", detail: "Grid with PDF export." }] },
];

// ─── UTILITY ──────────────────────────────────────────────────────────────────
function rnd(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a: number, b: number): number { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }

function exprLabel(c: number, k: number): string {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  if (k > 0) return `${base} + ${k}`;
  return `${base} \u2212 ${Math.abs(k)}`;
}

function getQuestionBg(cs: string): string {
  const m: Record<string, string> = { blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" };
  return m[cs] ?? "#ffffff";
}
function getStepBg(cs: string): string {
  const m: Record<string, string> = { blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" };
  return m[cs] ?? "#f3f4f6";
}

function pickX(minVal: number, maxVal: number, useDecimal: boolean): number | null {
  if (minVal > maxVal) return null;
  if (!useDecimal) {
    const lo = Math.ceil(minVal), hi = Math.floor(maxVal);
    if (lo > hi) return null;
    return rnd(lo, hi);
  }
  const lo = Math.ceil(minVal * 10), hi = Math.floor(maxVal * 10);
  if (lo > hi) return null;
  return Math.round(rnd(lo, hi)) / 10;
}

function pickExprType(vars: QOVars): string | null {
  const active: string[] = [];
  if (vars.coefficient) active.push("coefficient");
  if (vars.constant) active.push("constant");
  if (vars.both) active.push("both");
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}

function splitIntoN(total: number, n: number, minPart: number, useDecimal: boolean): number[] | null {
  if (total < n * minPart) return null;
  const parts: number[] = [];
  let remaining = total;
  for (let i = 0; i < n - 1; i++) {
    const lo = minPart, hi = remaining - (n - 1 - i) * minPart;
    if (lo > hi) return null;
    let part: number;
    if (useDecimal) part = Math.round(rndDecimal(lo, hi) * 10) / 10;
    else part = rnd(Math.ceil(lo), Math.floor(hi));
    parts.push(part);
    remaining = Math.round((remaining - part) * 10) / 10;
  }
  const last = Math.round(remaining * 10) / 10;
  if (last < minPart) return null;
  parts.push(last);
  return parts;
}

function resolveUseDecimal(vars: QOVars): boolean {
  const intOn = vars.integer !== undefined ? !!vars.integer : true;
  const decOn = !!vars.decimal;
  if (intOn && decOn) return Math.random() < 0.5;
  if (decOn) return true;
  return false;
}

function resolveParts(vars: QOVars): "two" | "three" {
  const twoOn = vars.two !== false && (vars.two !== undefined ? !!vars.two : true);
  const threeOn = vars.three !== false && (vars.three !== undefined ? !!vars.three : true);
  if (twoOn && threeOn) return Math.random() < 0.5 ? "two" : "three";
  if (threeOn) return "three";
  return "two";
}

// Pick a random active option from a list of booleans keyed by name
function pickActiveVariant(vars: QOVars, keys: string[]): string {
  const active = keys.filter(k => vars[k]);
  if (active.length === 0) return keys[0];
  return active[Math.floor(Math.random() * active.length)];
}

// ─── RIGHT ANGLE ─────────────────────────────────────────────────────────────
function rightSector(rot: number): { sectorStart: number; sectorEnd: number } {
  const sectorStart = ((3 - rot) * 90 + 360) % 360;
  return { sectorStart, sectorEnd: sectorStart + 90 };
}

function buildRightL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars);
  const exprType = pickExprType(vars);
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  const TOTAL = 90, MIN_A = 8, MIN_E = 10, MAX_E = 80;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, knownVal = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 3) / c);
      const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(15, TOTAL - cx - MIN_A)) : 0;
      if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; knownVal = Math.round((TOTAL - exprVal) * 10) / 10;
      if (knownVal < MIN_A || exprVal < MIN_E || exprVal > MAX_E) continue;
      xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 20; k = 0; exprVal = 40; knownVal = 50; }
    const xLabel = exprLabel(c, k); const knownFirst = rnd(0, 1) === 0;
    const fs = knownFirst ? knownVal : exprVal, ss = knownFirst ? exprVal : knownVal;
    const rayDeg = sectorStart + fs; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
      angles: [
        { label: knownFirst ? `${knownVal}\u00b0` : xLabel, isUnknown: !knownFirst, value: fs, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + fs / 2 },
        { label: knownFirst ? xLabel : `${knownVal}\u00b0`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fs + ss / 2 },
      ],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `${knownVal}\u00b0 + ${xLabel} = 90\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  const x = pickX(MIN_A, TOTAL - MIN_A, useDecimal) ?? 45;
  const known = Math.round((TOTAL - x) * 10) / 10; const knownFirst = rnd(0, 1) === 0;
  const fs = knownFirst ? known : x, ss = knownFirst ? x : known; const rayDeg = sectorStart + fs;
  return {
    tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
    segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
    angles: [
      { label: knownFirst ? `${known}\u00b0` : "x", isUnknown: !knownFirst, value: fs, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + fs / 2 },
      { label: knownFirst ? "x" : `${known}\u00b0`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fs + ss / 2 },
    ],
    answer: `x = ${x}\u00b0`,
    working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `x = 90\u00b0 \u2212 ${known}\u00b0` }, { text: `x = ${x}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildRightL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars);
  const exprType = pickExprType(vars);
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  const TOTAL = 90, MIN_P = 8, MIN_E = 10, MAX_E = 70;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 3) / c);
      const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(12, TOTAL - cx - MIN_P * 2)) : 0;
      if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10;
      if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue;
      p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 15; k = 0; exprVal = 30; p1 = 30; p2 = 30; }
    const xLabel = exprLabel(c, k); const r1 = sectorStart + p1, r2 = sectorStart + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }],
      angles: [
        { label: `${p1}\u00b0`, isUnknown: false, value: p1, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + p1 / 2 },
        { label: `${p2}\u00b0`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + p1 + p2 / 2 },
        { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + p1 + p2 + exprVal / 2 },
      ],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `${p1}\u00b0 + ${p2}\u00b0 + ${xLabel} = 90\u00b0` }, { text: `${p1 + p2}\u00b0 + ${xLabel} = 90\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) {
    const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue;
    const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue;
    xVal = x; p1 = parts[0]; p2 = parts[1]; found = true;
  }
  if (!found) { xVal = 30; p1 = 30; p2 = 30; }
  const ui = rnd(0, 2); const all = ui === 0 ? [xVal, p1, p2] : ui === 1 ? [p1, xVal, p2] : [p1, p2, xVal];
  const r1 = sectorStart + all[0], r2 = sectorStart + all[0] + all[1]; const ap: [number, number][] = [[sectorStart, r1], [r1, r2], [r2, sectorEnd]];
  return {
    tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false,
    segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }],
    angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}\u00b0`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })),
    answer: `x = ${xVal}\u00b0`,
    working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `${all.filter((_, i) => i !== ui).join("\u00b0 + ")}\u00b0 + x = 90\u00b0` }, { text: `${TOTAL - xVal}\u00b0 + x = 90\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildRightL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const partsChoice = resolveParts(vars); const twoRegions = partsChoice === "two";
  const rot = rnd(0, 3); const { sectorStart, sectorEnd } = rightSector(rot); const TOTAL = 90;
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c1 = useCoef ? rnd(1, 3) : 1; c2 = useCoef ? rnd(1, 3) : 1; const tc = c1 + c2;
      const xMin = Math.ceil(10 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 10) / tc); if (xMax < xMin) continue;
      const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 40) continue;
      if (c1 * x < 10 || c2 * x + kv < 10) continue; xVal = x; k = kv; found = true;
    }
    if (!found) { c1 = 1; c2 = 1; xVal = 30; k = 30; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
    return {
      tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: sectorStart + a1 }, { angleDeg: sectorEnd }],
      angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: sectorStart, arcToDeg: sectorStart + a1, bisectorDeg: sectorStart + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: sectorStart + a1, arcToDeg: sectorEnd, bisectorDeg: sectorStart + a1 + a2 / 2 }],
      answer: `x = ${xVal}`,
      working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 90\u00b0` }, { text: `${tc}x ${kStr} = 90\u00b0` }, { text: `${tc}x = ${TOTAL - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) {
    c1 = useCoef ? rnd(1, 3) : 1; c2 = useCoef ? rnd(1, 3) : 1; fixed = rnd(10, 30); const rem = TOTAL - fixed; const tc = c1 + c2;
    const xMin = Math.ceil(10 / Math.min(c1, c2)), xMax = Math.floor((rem - 10) / tc); if (xMax < xMin) continue;
    const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 30) continue;
    if (c1 * x < 10 || c2 * x + kv < 10) continue; xVal = x; k = kv; found = true;
  }
  if (!found) { c1 = 1; c2 = 1; fixed = 20; xVal = 25; k = 20; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = sectorStart + fixed, r2 = sectorStart + fixed + a2;
  return {
    tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false,
    segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }],
    angles: [{ label: `${fixed}\u00b0`, isUnknown: false, value: fixed, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixed + a2 + a3 / 2 }],
    answer: `x = ${xVal}`,
    working: [{ text: "Angles in a right angle sum to 90\u00b0" }, { text: `${fixed}\u00b0 + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 90\u00b0` }, { text: `${tc}x ${kStr} + ${fixed}\u00b0 = 90\u00b0` }, { text: `${tc}x = ${TOTAL - fixed - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

// ─── STRAIGHT LINE ────────────────────────────────────────────────────────────
function buildStraightL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135]; const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lld = rotationDeg + 180; const TOTAL = 180, MIN_A = 15, MIN_E = 20, MAX_E = 160;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, knownVal = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(25, TOTAL - cx - MIN_A)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; knownVal = Math.round((TOTAL - exprVal) * 10) / 10;
      if (knownVal < MIN_A || exprVal < MIN_E || exprVal > MAX_E) continue; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 40; k = 0; exprVal = 80; knownVal = 100; }
    const xLabel = exprLabel(c, k); const knownFirst = rnd(0, 1) === 0;
    const fs = knownFirst ? knownVal : exprVal, ss = knownFirst ? exprVal : knownVal; const rayDeg = lld + fs; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "straightLine", level: "level1", rotationDeg: rotationDeg as number,
      segments: [{ angleDeg: lld }, { angleDeg: rayDeg }, { angleDeg: rotationDeg as number }],
      angles: [{ label: knownFirst ? `${knownVal}\u00b0` : xLabel, isUnknown: !knownFirst, value: fs, arcFromDeg: lld, arcToDeg: rayDeg, bisectorDeg: lld + fs / 2 }, { label: knownFirst ? xLabel : `${knownVal}\u00b0`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + fs + ss / 2 }],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `${knownVal}\u00b0 + ${xLabel} = 180\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  const x = pickX(MIN_A, TOTAL - MIN_A, useDecimal) ?? 90; const known = Math.round((TOTAL - x) * 10) / 10; const knownFirst = rnd(0, 1) === 0;
  const fs = knownFirst ? known : x, ss = knownFirst ? x : known; const rayDeg = lld + fs;
  return {
    tool: "straightLine", level: "level1", rotationDeg: rotationDeg as number,
    segments: [{ angleDeg: lld }, { angleDeg: rayDeg }, { angleDeg: rotationDeg as number }],
    angles: [{ label: knownFirst ? `${known}\u00b0` : "x", isUnknown: !knownFirst, value: fs, arcFromDeg: lld, arcToDeg: rayDeg, bisectorDeg: lld + fs / 2 }, { label: knownFirst ? "x" : `${known}\u00b0`, isUnknown: knownFirst, value: ss, arcFromDeg: rayDeg, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + fs + ss / 2 }],
    answer: `x = ${x}\u00b0`,
    working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `x = 180\u00b0 \u2212 ${known}\u00b0` }, { text: `x = ${x}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildStraightL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135]; const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lld = rotationDeg + 180; const TOTAL = 180, MIN_P = 15, MIN_E = 20, MAX_E = 140;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(25, TOTAL - cx - MIN_P * 2)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue;
      p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 30; k = 0; exprVal = 60; p1 = 60; p2 = 60; }
    const xLabel = exprLabel(c, k); const r1 = lld + p1, r2 = lld + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "straightLine", level: "level2", rotationDeg: rotationDeg as number,
      segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg as number }],
      angles: [{ label: `${p1}\u00b0`, isUnknown: false, value: p1, arcFromDeg: lld, arcToDeg: r1, bisectorDeg: lld + p1 / 2 }, { label: `${p2}\u00b0`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lld + p1 + p2 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: (rotationDeg as number) + 360, bisectorDeg: lld + p1 + p2 + exprVal / 2 }],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `${p1}\u00b0 + ${p2}\u00b0 + ${xLabel} = 180\u00b0` }, { text: `${p1 + p2}\u00b0 + ${xLabel} = 180\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) {
    const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue;
    const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue;
    xVal = x; p1 = parts[0]; p2 = parts[1]; found = true;
  }
  if (!found) { xVal = 60; p1 = 60; p2 = 60; }
  const ui = rnd(0, 2); const all = ui === 0 ? [xVal, p1, p2] : ui === 1 ? [p1, xVal, p2] : [p1, p2, xVal];
  const r1 = lld + all[0], r2 = lld + all[0] + all[1]; const rd = rotationDeg as number; const ap: [number, number][] = [[lld, r1], [r1, r2], [r2, rd + 360]];
  return {
    tool: "straightLine", level: "level2", rotationDeg: rd,
    segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rd }],
    angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}\u00b0`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })),
    answer: `x = ${xVal}\u00b0`,
    working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `${all.filter((_, i) => i !== ui).join("\u00b0 + ")}\u00b0 + x = 180\u00b0` }, { text: `${TOTAL - xVal}\u00b0 + x = 180\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildStraightL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const rotations = [0, 45, 90, 135];
  const rd = (vars.fixedRotation ? 0 : rotations[rnd(0, 3)]) as number; const lld = rd + 180; const partsChoice = resolveParts(vars); const twoLines = partsChoice === "two"; const TOTAL = 180;
  if (twoLines) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; const tc = c1 + c2;
      const xMin = Math.ceil(20 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 20) / tc); if (xMax < xMin) continue;
      const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 60) continue;
      if (c1 * x < 20 || c2 * x + kv < 20) continue; xVal = x; k = kv; found = true;
    }
    if (!found) { c1 = 1; c2 = 2; xVal = 40; k = TOTAL - 3 * 40; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
    return {
      tool: "straightLine", level: "level3", rotationDeg: rd,
      segments: [{ angleDeg: lld }, { angleDeg: lld + a1 }, { angleDeg: rd }],
      angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: lld, arcToDeg: lld + a1, bisectorDeg: lld + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: lld + a1, arcToDeg: rd + 360, bisectorDeg: lld + a1 + a2 / 2 }],
      answer: `x = ${xVal}`,
      working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 180\u00b0` }, { text: `${tc}x ${kStr} = 180\u00b0` }, { text: `${tc}x = ${TOTAL - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) {
    c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; fixed = rnd(20, 60); const rem = TOTAL - fixed; const tc = c1 + c2;
    const xMin = Math.ceil(20 / Math.min(c1, c2)), xMax = Math.floor((rem - 20) / tc); if (xMax < xMin) continue;
    const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 50) continue;
    if (c1 * x < 20 || c2 * x + kv < 20) continue; xVal = x; k = kv; found = true;
  }
  if (!found) { c1 = 1; c2 = 1; fixed = 40; xVal = 50; k = TOTAL - 40 - 2 * 50; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = lld + fixed, r2 = lld + fixed + a2;
  return {
    tool: "straightLine", level: "level3", rotationDeg: rd,
    segments: [{ angleDeg: lld }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rd }],
    angles: [{ label: `${fixed}\u00b0`, isUnknown: false, value: fixed, arcFromDeg: lld, arcToDeg: r1, bisectorDeg: lld + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lld + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: rd + 360, bisectorDeg: lld + fixed + a2 + a3 / 2 }],
    answer: `x = ${xVal}`,
    working: [{ text: "Angles on a straight line sum to 180\u00b0" }, { text: `${fixed}\u00b0 + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 180\u00b0` }, { text: `${tc}x ${kStr} + ${fixed}\u00b0 = 180\u00b0` }, { text: `${tc}x = ${TOTAL - fixed - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

// ─── AROUND A POINT ───────────────────────────────────────────────────────────
function buildAroundL1(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const sd = 270; const TOTAL = 360, MIN_P = 25, MIN_E = 30, MAX_E = 280;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(30, TOTAL - cx - MIN_P * 2)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 2) continue;
      const parts = splitIntoN(kt, 2, MIN_P, useDecimal); if (!parts) continue;
      p1 = parts[0]; p2 = parts[1]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 60; k = 0; exprVal = 120; p1 = 120; p2 = 120; }
    const xLabel = exprLabel(c, k); const r1 = sd + p1, r2 = sd + p1 + p2; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "aroundPoint", level: "level1", rotationDeg: 0,
      segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }],
      angles: [{ label: `${p1}\u00b0`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}\u00b0`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + exprVal / 2 }],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${p1}\u00b0 + ${p2}\u00b0 + ${xLabel} = 360\u00b0` }, { text: `${p1 + p2}\u00b0 + ${xLabel} = 360\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, p1 = 0, p2 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) {
    const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue;
    const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 2, MIN_P, useDecimal); if (!parts) continue;
    xVal = x; p1 = parts[0]; p2 = parts[1]; found = true;
  }
  if (!found) { xVal = 120; p1 = 120; p2 = 120; }
  const r1 = sd + p1, r2 = sd + p1 + p2;
  return {
    tool: "aroundPoint", level: "level1", rotationDeg: 0,
    segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }],
    angles: [{ label: `${p1}\u00b0`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}\u00b0`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: "x", isUnknown: true, value: xVal, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + xVal / 2 }],
    answer: `x = ${xVal}\u00b0`,
    working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${p1}\u00b0 + ${p2}\u00b0 + x = 360\u00b0` }, { text: `${p1 + p2}\u00b0 + x = 360\u00b0` }, { text: `x = 360\u00b0 \u2212 ${p1 + p2}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildAroundL2(vars: QOVars): AngleQuestion {
  const useDecimal = resolveUseDecimal(vars); const exprType = pickExprType(vars);
  const sd = 270; const TOTAL = 360, MIN_P = 25, MIN_E = 30, MAX_E = 240;
  if (exprType !== null) {
    let xVal = 0, c = 1, k = 0, exprVal = 0, p1 = 0, p2 = 0, p3 = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      const xMax = exprType === "coefficient" ? Math.floor(MAX_E / c) : Math.floor((MAX_E - 5) / c); const xMin = Math.ceil(MIN_E / c);
      const x = pickX(xMin, xMax, useDecimal); if (x === null) continue;
      const cx = Math.round(c * x * 10) / 10;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(30, TOTAL - cx - MIN_P * 3)) : 0; if (k < 0) continue;
      exprVal = Math.round((cx + k) * 10) / 10; const kt = Math.round((TOTAL - exprVal) * 10) / 10; if (kt < MIN_P * 3) continue;
      const parts = splitIntoN(kt, 3, MIN_P, useDecimal); if (!parts) continue;
      p1 = parts[0]; p2 = parts[1]; p3 = parts[2]; xVal = x; found = true;
    }
    if (!found) { c = 2; xVal = 40; k = 0; exprVal = 80; p1 = 90; p2 = 100; p3 = 90; }
    const xLabel = exprLabel(c, k); const r1 = sd + p1, r2 = sd + p1 + p2, r3 = sd + p1 + p2 + p3; const cxStr = `${Math.round(c * xVal * 10) / 10}`;
    return {
      tool: "aroundPoint", level: "level2", rotationDeg: 0,
      segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: r3 }],
      angles: [{ label: `${p1}\u00b0`, isUnknown: false, value: p1, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + p1 / 2 }, { label: `${p2}\u00b0`, isUnknown: false, value: p2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + p1 + p2 / 2 }, { label: `${p3}\u00b0`, isUnknown: false, value: p3, arcFromDeg: r2, arcToDeg: r3, bisectorDeg: sd + p1 + p2 + p3 / 2 }, { label: xLabel, isUnknown: true, value: exprVal, arcFromDeg: r3, arcToDeg: sd + 360, bisectorDeg: sd + p1 + p2 + p3 + exprVal / 2 }],
      answer: `x = ${xVal}\u00b0`,
      working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${p1}\u00b0 + ${p2}\u00b0 + ${p3}\u00b0 + ${xLabel} = 360\u00b0` }, { text: `${p1 + p2 + p3}\u00b0 + ${xLabel} = 360\u00b0` }, { text: `${xLabel} = ${exprVal}\u00b0` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${cxStr}\u00b0` }] : []), { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, p1 = 0, p2 = 0, p3 = 0, found = false;
  for (let att = 0; att < 100 && !found; att++) {
    const x = pickX(MIN_E, MAX_E, useDecimal); if (x === null) continue;
    const parts = splitIntoN(Math.round((TOTAL - x) * 10) / 10, 3, MIN_P, useDecimal); if (!parts) continue;
    xVal = x; p1 = parts[0]; p2 = parts[1]; p3 = parts[2]; found = true;
  }
  if (!found) { xVal = 90; p1 = 90; p2 = 90; p3 = 90; }
  const ui = rnd(0, 3); const all = ui === 0 ? [xVal, p1, p2, p3] : ui === 1 ? [p1, xVal, p2, p3] : ui === 2 ? [p1, p2, xVal, p3] : [p1, p2, p3, xVal];
  let cum = 0; const rays = all.map(v => { const d = sd + cum; cum += v; return d; }); const ap: [number, number][] = all.map((_, i) => [rays[i], i < all.length - 1 ? rays[i + 1] : sd + 360]);
  return {
    tool: "aroundPoint", level: "level2", rotationDeg: 0,
    segments: rays.map(d => ({ angleDeg: d })),
    angles: all.map((v, i) => ({ label: i === ui ? "x" : `${v}\u00b0`, isUnknown: i === ui, value: v, arcFromDeg: ap[i][0], arcToDeg: ap[i][1], bisectorDeg: ap[i][0] + v / 2 })),
    answer: `x = ${xVal}\u00b0`,
    working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${all.filter((_, i) => i !== ui).join("\u00b0 + ")}\u00b0 + x = 360\u00b0` }, { text: `${TOTAL - xVal}\u00b0 + x = 360\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

function buildAroundL3(vars: QOVars): AngleQuestion {
  const useCoef = !!vars.useCoefficients; const partsChoice = resolveParts(vars); const twoRegions = partsChoice === "two";
  const sd = 270; const TOTAL = 360;
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; const tc = c1 + c2;
      const xMin = Math.ceil(30 / Math.min(c1, c2)), xMax = Math.floor((TOTAL - 30) / tc); if (xMax < xMin) continue;
      const x = rnd(xMin, xMax); const kv = TOTAL - tc * x; if (Math.abs(kv) > 80) continue;
      if (c1 * x < 30 || c2 * x + kv < 30) continue; xVal = x; k = kv; found = true;
    }
    if (!found) { c1 = 1; c2 = 2; xVal = 80; k = TOTAL - 3 * 80; }
    const a1 = c1 * xVal, a2 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
    return {
      tool: "aroundPoint", level: "level3", rotationDeg: 0,
      segments: [{ angleDeg: sd }, { angleDeg: sd + a1 }],
      angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: a1, arcFromDeg: sd, arcToDeg: sd + a1, bisectorDeg: sd + a1 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a2, arcFromDeg: sd + a1, arcToDeg: sd + 360, bisectorDeg: sd + a1 + a2 / 2 }],
      answer: `x = ${xVal}`,
      working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 360\u00b0` }, { text: `${tc}x ${kStr} = 360\u00b0` }, { text: `${tc}x = ${TOTAL - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  let xVal = 0, c1 = 1, c2 = 1, fixed = 0, k = 0, found = false;
  for (let att = 0; att < 300 && !found; att++) {
    c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(1, 4) : 1; fixed = rnd(30, 100); const rem = TOTAL - fixed; const tc = c1 + c2;
    const xMin = Math.ceil(30 / Math.min(c1, c2)), xMax = Math.floor((rem - 30) / tc); if (xMax < xMin) continue;
    const x = rnd(xMin, xMax); const kv = rem - tc * x; if (Math.abs(kv) > 60) continue;
    if (c1 * x < 30 || c2 * x + kv < 30) continue; xVal = x; k = kv; found = true;
  }
  if (!found) { c1 = 1; c2 = 1; fixed = 60; xVal = 100; k = TOTAL - 60 - 2 * 100; }
  const a2 = c1 * xVal, a3 = c2 * xVal + k; const tc = c1 + c2; const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = sd + fixed, r2 = sd + fixed + a2;
  return {
    tool: "aroundPoint", level: "level3", rotationDeg: 0,
    segments: [{ angleDeg: sd }, { angleDeg: r1 }, { angleDeg: r2 }],
    angles: [{ label: `${fixed}\u00b0`, isUnknown: false, value: fixed, arcFromDeg: sd, arcToDeg: r1, bisectorDeg: sd + fixed / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: a2, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sd + fixed + a2 / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: a3, arcFromDeg: r2, arcToDeg: sd + 360, bisectorDeg: sd + fixed + a2 + a3 / 2 }],
    answer: `x = ${xVal}`,
    working: [{ text: "Angles around a point sum to 360\u00b0" }, { text: `${fixed}\u00b0 + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 360\u00b0` }, { text: `${tc}x ${kStr} + ${fixed}\u00b0 = 360\u00b0` }, { text: `${tc}x = ${TOTAL - fixed - k}\u00b0` }, { text: `x = ${xVal}\u00b0` }],
    id: Math.floor(Math.random() * 1e6),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERTICALLY OPPOSITE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════
// Diagram model: two full lines cross at centre.
// The crossing angle α is in [20, 160]. The four sectors are α, 180−α, α, 180−α.
// rotationDeg offsets the whole diagram.
// segments: [rot, rot+α, rot+180, rot+180+α] — four rays
// angles: four sectors going clockwise from rot

function pickVOAngle(): number { return rnd(20, 160); }
function voRot(vars: QOVars): number {
  if (vars.fixedRotation) return 0;
  return rnd(0, 179);
}

// Build the four angles for a VO diagram, labelling as specified.
// labels: array of 4 strings (or null = use numeric value°).
// unknowns: set of indices that are "unknown" (shown in blue, answer driven)
function makeVOQuestion(
  tool: string, level: string,
  rot: number, alpha: number,
  labels: (string | null)[], unknowns: number[],
  answer: string, answer2: string | undefined,
  working: { text: string }[],
  extraSegments?: number[], // extra ray angles within sector 0 (for L2 subdivide)
): AngleQuestion {
  const beta = 180 - alpha;
  // Four sector values going round: α, β, α, β
  const vals = [alpha, beta, alpha, beta];
  // Four boundary rays
  const r0 = rot, r1 = rot + alpha, r2 = rot + 180, r3 = rot + 180 + alpha;
  const bounds = [r0, r1, r2, r3];
  const segs: SegmentDef[] = bounds.map(a => ({ angleDeg: a }));
  if (extraSegments) extraSegments.forEach(a => segs.push({ angleDeg: a }));

  const angles: AngleDef[] = vals.map((v, i) => {
    const from = bounds[i], to = bounds[(i + 1) % 4] + (i === 3 ? 360 : 0);
    return {
      label: labels[i] === null ? "" : (labels[i] ?? `${v}\u00b0`),
      isUnknown: unknowns.includes(i),
      value: v,
      arcFromDeg: from,
      arcToDeg: to,
      bisectorDeg: from + v / 2,
      // blank sentinel: no arc, no leader drawn
      blank: labels[i] === null,
    };
  });

  return {
    tool, level, rotationDeg: rot,
    segments: segs, angles,
    answer, answer2,
    working,
    id: Math.floor(Math.random() * 1e6),
  };
}

// ─── VO Level 1 ───────────────────────────────────────────────────────────────
function buildVOL1(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["matching", "calculation"]);
  const rot = voRot(vars);
  const alpha = pickVOAngle();
  const beta = 180 - alpha;

  if (variant === "matching") {
    // Two adjacent angles (sectors 0 and 1) are given numerically.
    // Their VO partners (sectors 2 and 3) are labelled x and y.
    // Randomise which VO label (x or y) falls on which sector.
    const xyFlip = rnd(0, 1) === 0;
    const labels: (string | null)[] = [
      `${alpha}\u00b0`,   // sector 0: given
      `${beta}\u00b0`,    // sector 1: given (adjacent)
      xyFlip ? "x" : "y", // sector 2: VO of 0
      xyFlip ? "y" : "x", // sector 3: VO of 1
    ];
    const xVal = xyFlip ? alpha : beta;
    const yVal = xyFlip ? beta : alpha;
    return makeVOQuestion(
      "verticallyOpposite", "level1", rot, alpha, labels, [2, 3],
      `x = ${xVal}\u00b0`, `y = ${yVal}\u00b0`,
      [
        { text: "Vertically opposite angles are equal" },
        { text: `x = ${xVal}\u00b0 (vertically opposite ${xVal}\u00b0)` },
        { text: `y = ${yVal}\u00b0 (vertically opposite ${yVal}\u00b0)` },
      ],
    );
  }

  // Calculation variant:
  // Sector 0: given (α). One of {sector 1, sector 2, sector 3} is the VO of 0 (sector 2 = α),
  // one adjacent (sector 1 or 3) gets the other letter. Fourth sector is blank.
  // Randomly assign which label (x or y) falls on the VO vs the adjacent.
  // Randomly pick which adjacent (sector 1 or sector 3) is labelled.
  // One numeric angle (sector 0 = α). Its VO (sector 2) gets one letter.
  // One adjacent (sector 1 or 3, chosen randomly) gets the other letter.
  // The remaining sector is completely blank.
  const voIsX = rnd(0, 1) === 0;           // true → VO=x, adjacent=y
  const labelledAdj = rnd(0, 1) === 0 ? 1 : 3;
  const voLabel  = voIsX ? "x" : "y";
  const adjLabel = voIsX ? "y" : "x";
  const labels: (string | null)[] = [
    `${alpha}\u00b0`,                                    // sector 0: only given value
    labelledAdj === 1 ? adjLabel : null,                 // sector 1: labelled adj or blank
    voLabel,                                             // sector 2: VO unknown
    labelledAdj === 3 ? adjLabel : null,                 // sector 3: labelled adj or blank
  ];
  return makeVOQuestion(
    "verticallyOpposite", "level1", rot, alpha, labels, [2, labelledAdj],
    `${voLabel} = ${alpha}\u00b0`, `${adjLabel} = ${beta}\u00b0`,
    [
      { text: "Vertically opposite angles are equal" },
      { text: `${voLabel} = ${alpha}\u00b0` },
      { text: "Angles on a straight line sum to 180\u00b0" },
      { text: `${adjLabel} = 180\u00b0 \u2212 ${alpha}\u00b0 = ${beta}\u00b0` },
    ],
  );
}

// ─── VO Level 2 ───────────────────────────────────────────────────────────────
// One of the four sectors (sector 0, value α) is subdivided by an extra ray.
// The VO sector (sector 2) equals α. x is always a positive integer.
function buildVOL2(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["findX", "findSub"]);
  const exprType = pickExprType(vars); // null = numeric only
  const rot = voRot(vars);
  // Ensure α is large enough to split (min sub = 15, so α ≥ 30)
  let alpha = pickVOAngle();
  while (alpha < 30) alpha = pickVOAngle();
  const beta = 180 - alpha;
  const minSub = 15;

  if (variant === "findX") {
    if (exprType !== null) {
      // One sub is algebraic (cx+k), the other is numeric. x = VO sector.
      // Constraint: exprVal + numericSub = α, and x = α (the VO answer).
      // We need cx+k = exprVal where exprVal ∈ [minSub, alpha-minSub] and x is a positive integer.
      const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      let xVal = 0, k = 0, exprVal = 0, numericSub = 0, found = false;
      for (let att = 0; att < 300 && !found; att++) {
        const xMin = Math.max(1, Math.ceil(minSub / c));
        const xMax = Math.floor((alpha - minSub) / c);
        if (xMax < xMin) continue;
        const x = rnd(xMin, xMax); // positive integer
        const cx = c * x;
        k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(20, alpha - minSub - cx)) : 0;
        if (k < 0) continue;
        const ev = cx + k;
        if (ev < minSub || ev > alpha - minSub) continue;
        const ns = alpha - ev;
        if (ns < minSub) continue;
        xVal = x; exprVal = ev; numericSub = ns; found = true;
      }
      if (!found) { xVal = 10; k = 0; exprVal = Math.floor(alpha / 2); numericSub = alpha - exprVal; }
      const xLabel = exprLabel(c, k);
      const exprIsSub1 = rnd(0, 1) === 0;
      const sub1 = exprIsSub1 ? exprVal : numericSub, sub2 = exprIsSub1 ? numericSub : exprVal;
      const subRay = rot + sub1;
      const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
      const cxStr = `${c * xVal}`;
      const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
      const angles: AngleDef[] = [
        { label: exprIsSub1 ? xLabel : `${numericSub}\u00b0`, isUnknown: exprIsSub1, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
        { label: exprIsSub1 ? `${numericSub}\u00b0` : xLabel, isUnknown: !exprIsSub1, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
        { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + beta / 2 },
        { label: `${alpha}\u00b0`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
        { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + beta / 2 },
      ];
      return {
        tool: "verticallyOpposite", level: "level2", rotationDeg: rot,
        segments: segs, angles,
        answer: `x = ${xVal}\u00b0`,
        working: [
          { text: "Vertically opposite angles are equal" },
          { text: `${exprLabel(c, k)} + ${numericSub}\u00b0 = ${alpha}\u00b0` },
          { text: `${exprLabel(c, k)} = ${exprVal}\u00b0` },
          ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x ${kStr} = ${exprVal}\u00b0` }, { text: `${c === 1 ? "" : c}x = ${cxStr}` }] : []),
          { text: `x = ${xVal}\u00b0` },
        ],
        id: Math.floor(Math.random() * 1e6),
      };
    }
    // Numeric: both subs given, x = α (VO)
    const parts = splitIntoN(alpha, 2, minSub, false) ?? [Math.floor(alpha / 2), alpha - Math.floor(alpha / 2)];
    const [sub1, sub2] = parts;
    const subRay = rot + sub1;
    const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
    const angles: AngleDef[] = [
      { label: `${sub1}\u00b0`, isUnknown: false, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
      { label: `${sub2}\u00b0`, isUnknown: false, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
      { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + beta / 2 },
      { label: "x", isUnknown: true, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + beta / 2 },
    ];
    return {
      tool: "verticallyOpposite", level: "level2", rotationDeg: rot,
      segments: segs, angles,
      answer: `x = ${alpha}\u00b0`,
      working: [
        { text: "Vertically opposite angles are equal" },
        { text: `x = ${sub1}\u00b0 + ${sub2}\u00b0` },
        { text: `x = ${alpha}\u00b0` },
      ],
      id: Math.floor(Math.random() * 1e6),
    };
  }

  // findSub: x is one of the sub-angles; the VO (= α) is given.
  if (exprType !== null) {
    // x is an algebraic expression; knownSub is numeric; VO = α is shown.
    // cx + k + knownSub = α  →  solve for x (positive integer)
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    let xVal = 0, k = 0, exprVal = 0, knownSub = 0, found = false;
    for (let att = 0; att < 300 && !found; att++) {
      const xMin = Math.max(1, Math.ceil(minSub / c));
      const xMax = Math.floor((alpha - minSub) / c);
      if (xMax < xMin) continue;
      const x = rnd(xMin, xMax); // positive integer
      const cx = c * x;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(20, alpha - minSub - cx)) : 0;
      if (k < 0) continue;
      const ev = cx + k;
      if (ev < minSub || ev > alpha - minSub) continue;
      const ks = alpha - ev;
      if (ks < minSub) continue;
      xVal = x; exprVal = ev; knownSub = ks; found = true;
    }
    if (!found) { xVal = 10; k = 0; exprVal = Math.floor(alpha / 2); knownSub = alpha - exprVal; }
    const xLabel = exprLabel(c, k);
    const exprIsSub1 = rnd(0, 1) === 0;
    const sub1 = exprIsSub1 ? exprVal : knownSub, sub2 = exprIsSub1 ? knownSub : exprVal;
    const subRay = rot + sub1;
    const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
    const cxStr = `${c * xVal}`;
    const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
    const angles: AngleDef[] = [
      { label: exprIsSub1 ? xLabel : `${knownSub}\u00b0`, isUnknown: exprIsSub1, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
      { label: exprIsSub1 ? `${knownSub}\u00b0` : xLabel, isUnknown: !exprIsSub1, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
      { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + beta / 2 },
      { label: `${alpha}\u00b0`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
      { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + beta / 2 },
    ];
    return {
      tool: "verticallyOpposite", level: "level2", rotationDeg: rot,
      segments: segs, angles,
      answer: `x = ${xVal}\u00b0`,
      working: [
        { text: "Vertically opposite angles are equal" },
        { text: `${xLabel} + ${knownSub}\u00b0 = ${alpha}\u00b0` },
        { text: `${xLabel} = ${exprVal}\u00b0` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x ${kStr} = ${exprVal}\u00b0` }, { text: `${c === 1 ? "" : c}x = ${cxStr}` }] : []),
        { text: `x = ${xVal}\u00b0` },
      ],
      id: Math.floor(Math.random() * 1e6),
    };
  }
  // Numeric findSub: x is one sub, other sub + VO shown
  const parts = splitIntoN(alpha, 2, minSub, false) ?? [Math.floor(alpha / 2), alpha - Math.floor(alpha / 2)];
  const [sub1, sub2] = parts;
  const xIsSub1 = rnd(0, 1) === 0;
  const xVal = xIsSub1 ? sub1 : sub2;
  const knownSub = xIsSub1 ? sub2 : sub1;
  const subRay = rot + sub1;
  const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
  const angles: AngleDef[] = [
    { label: xIsSub1 ? "x" : `${sub1}\u00b0`, isUnknown: xIsSub1, value: sub1, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1 / 2 },
    { label: xIsSub1 ? `${sub2}\u00b0` : "x", isUnknown: !xIsSub1, value: sub2, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + sub2 / 2 },
    { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + beta / 2 },
    { label: `${alpha}\u00b0`, isUnknown: false, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
    { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + beta / 2 },
  ];
  return {
    tool: "verticallyOpposite", level: "level2", rotationDeg: rot,
    segments: segs, angles,
    answer: `x = ${xVal}\u00b0`,
    working: [
      { text: "Vertically opposite angles are equal" },
      { text: `x + ${knownSub}\u00b0 = ${alpha}\u00b0` },
      { text: `x = ${alpha}\u00b0 \u2212 ${knownSub}\u00b0` },
      { text: `x = ${xVal}\u00b0` },
    ],
    id: Math.floor(Math.random() * 1e6),
  };
}

// ─── VO Level 3 ───────────────────────────────────────────────────────────────
function buildVOL3(vars: QOVars): AngleQuestion {
  const variant = pickActiveVariant(vars, ["pureVO", "subdivided"]);
  const useCoef = !!vars.useCoefficients;
  const rot = voRot(vars);

  if (variant === "pureVO") {
    // Two VO sectors both algebraic: c1*x + k1 = c2*x + k2 → solve
    // We pick x, then set expr1 = α, expr2 = α (they must be equal, that's the point)
    // So: c1*x + k1 = c2*x + k2, pick x and both expressions to equal the same α
    let xVal = 0, c1 = 1, c2 = 1, k1 = 0, k2 = 0, alpha = 0, found = false;
    for (let att = 0; att < 500 && !found; att++) {
      c1 = useCoef ? rnd(1, 5) : 1; c2 = useCoef ? rnd(1, 5) : 1;
      if (!useCoef && c1 === c2) continue; // needs different coefficients to be solvable without coef option
      xVal = rnd(5, 40);
      k1 = rnd(-20, 40); k2 = rnd(-20, 40);
      alpha = c1 * xVal + k1;
      if (alpha < 20 || alpha > 160) continue;
      if (c2 * xVal + k2 !== alpha) {
        // Force k2 so that c2*x + k2 = alpha
        k2 = alpha - c2 * xVal;
        if (Math.abs(k2) > 50) continue;
      }
      // Ensure expressions are visually distinct (not identical)
      if (c1 === c2 && k1 === k2) continue;
      found = true;
    }
    if (!found) { c1 = 3; c2 = 1; xVal = 15; k1 = 5; alpha = 3 * 15 + 5; k2 = alpha - 15; }
    const beta = 180 - alpha;
    const labels: (string | null)[] = [
      exprLabel(c1, k1), // sector 0
      null,              // sector 1 (adjacent, blank)
      exprLabel(c2, k2), // sector 2 (VO of 0, also algebraic)
      null,              // sector 3 (blank)
    ];
    const dc = c1 - c2, dk = k2 - k1; // c1x + k1 = c2x + k2 → (c1-c2)x = k2 - k1
    const kStr = dk >= 0 ? `+ ${dk}` : `\u2212 ${Math.abs(dk)}`;
    return makeVOQuestion(
      "verticallyOpposite", "level3", rot, alpha, labels, [0, 2],
      `x = ${xVal}`, undefined,
      [
        { text: "Vertically opposite angles are equal" },
        { text: `${exprLabel(c1, k1)} = ${exprLabel(c2, k2)}` },
        { text: `${dc}x ${kStr} = 0` },
        ...(dk !== 0 ? [{ text: `${dc}x = ${-dk}` }] : []),
        { text: `x = ${xVal}` },
      ],
    );
  }

  // Subdivided: sector 0 split into (c1*x + k1) and fixed°, VO sector 2 = (c2*x + k2)
  // Constraint: (c1*x + k1) + fixed = c2*x + k2 → solve
  let xVal = 0, c1 = 1, c2 = useCoef ? rnd(2, 5) : 2, k1 = 0, k2 = 0, fixed = 0, alpha = 0, found = false;
  for (let att = 0; att < 500 && !found; att++) {
    c1 = useCoef ? rnd(1, 4) : 1; c2 = useCoef ? rnd(c1 + 1, c1 + 4) : c1 + rnd(1, 3);
    xVal = rnd(5, 35);
    k1 = rnd(0, 20); fixed = rnd(10, 40); k2 = rnd(0, 30);
    alpha = c2 * xVal + k2;
    if (alpha < 30 || alpha > 160) continue;
    const sub1 = c1 * xVal + k1;
    if (sub1 < 10 || fixed < 10 || sub1 + fixed !== alpha) {
      // force k2: alpha = (c1*x+k1) + fixed
      const forcedAlpha = c1 * xVal + k1 + fixed;
      if (forcedAlpha < 30 || forcedAlpha > 160) continue;
      k2 = forcedAlpha - c2 * xVal;
      if (k2 < -20 || k2 > 50) continue;
      alpha = forcedAlpha;
    }
    const sub1Check = c1 * xVal + k1;
    if (sub1Check < 10 || fixed < 10 || sub1Check + fixed !== alpha) continue;
    found = true;
  }
  if (!found) { c1 = 1; c2 = 2; xVal = 20; k1 = 5; fixed = 15; alpha = 60; k2 = alpha - c2 * xVal; }
  const beta = 180 - alpha;
  const sub1Val = c1 * xVal + k1;
  const subRay = rot + sub1Val;
  // Build dc from: c1*x + k1 + fixed = c2*x + k2
  // → (c2-c1)x = k1 + fixed - k2
  const dc = c2 - c1; const dk = k1 + fixed - k2;
  const kStr2 = dk >= 0 ? `+ ${dk}` : `\u2212 ${Math.abs(dk)}`;
  const segs: SegmentDef[] = [{ angleDeg: rot }, { angleDeg: subRay }, { angleDeg: rot + alpha }, { angleDeg: rot + 180 }, { angleDeg: rot + 180 + alpha }];
  const angles: AngleDef[] = [
    { label: exprLabel(c1, k1), isUnknown: true, value: sub1Val, arcFromDeg: rot, arcToDeg: subRay, bisectorDeg: rot + sub1Val / 2 },
    { label: `${fixed}\u00b0`, isUnknown: false, value: fixed, arcFromDeg: subRay, arcToDeg: rot + alpha, bisectorDeg: subRay + fixed / 2 },
    { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + alpha, arcToDeg: rot + 180, bisectorDeg: rot + alpha + beta / 2 },
    { label: exprLabel(c2, k2), isUnknown: true, value: alpha, arcFromDeg: rot + 180, arcToDeg: rot + 180 + alpha, bisectorDeg: rot + 180 + alpha / 2 },
    { label: "", isUnknown: false, blank: true, value: beta, arcFromDeg: rot + 180 + alpha, arcToDeg: rot + 360, bisectorDeg: rot + 180 + alpha + beta / 2 },
  ];
  return {
    tool: "verticallyOpposite", level: "level3", rotationDeg: rot,
    segments: segs, angles,
    answer: `x = ${xVal}`,
    working: [
      { text: "Vertically opposite angles are equal" },
      { text: `${exprLabel(c1, k1)} + ${fixed}\u00b0 = ${exprLabel(c2, k2)}` },
      { text: `${dc}x ${kStr2} = 0` },
      ...(dk !== 0 ? [{ text: `${dc}x = ${-dk}` }] : []),
      { text: `x = ${xVal}` },
    ],
    id: Math.floor(Math.random() * 1e6),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════
function generateQuestion(tool: string, level: string, vars: QOVars): AngleQuestion {
  let q: AngleQuestion;
  if (tool === "mixed") {
    const active: string[] = [];
    if (vars.rightAngle !== false) active.push("rightAngle");
    if (vars.straightLine !== false) active.push("straightLine");
    if (vars.aroundPoint !== false) active.push("aroundPoint");
    if (vars.verticallyOpposite !== false) active.push("verticallyOpposite");
    const pool = active.length > 0 ? active : ["rightAngle", "straightLine", "aroundPoint", "verticallyOpposite"];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    q = generateQuestion(picked, level, vars); q.difficulty = level; q.key = `mixed-${level}-${q.id}`; return q;
  }
  if (tool === "verticallyOpposite") {
    if (level === "level1") q = buildVOL1(vars);
    else if (level === "level2") q = buildVOL2(vars);
    else q = buildVOL3(vars);
  } else if (tool === "rightAngle") {
    if (level === "level1") q = buildRightL1(vars);
    else if (level === "level2") q = buildRightL2(vars);
    else q = buildRightL3(vars);
  } else if (tool === "straightLine") {
    if (level === "level1") q = buildStraightL1(vars);
    else if (level === "level2") q = buildStraightL2(vars);
    else q = buildStraightL3(vars);
  } else {
    if (level === "level1") q = buildAroundL1(vars);
    else if (level === "level2") q = buildAroundL2(vars);
    else q = buildAroundL3(vars);
  }
  q.difficulty = level; q.key = `${tool}-${level}-${q.id}`; return q;
}

// ─── VARS BUILDER ─────────────────────────────────────────────────────────────
function buildVarsFromUI(
  tool: string, level: string,
  toolVariables: Record<string, Record<string, Record<string, boolean>>>,
  toolMultiSelect: Record<string, Record<string, boolean>>,
): QOVars {
  const t = TOOL_CONFIG.tools[tool as ToolKey];
  const ds = t.difficultySettings[level as DifficultyLevel];
  const vars: QOVars = { ...(toolVariables[tool]?.[level] ?? {}) };
  const applyMS = (ms: MultiSelectCfg | undefined, prefix = "") => {
    if (!ms) return;
    ms.options.forEach(o => {
      const stateKey = prefix ? `${level}__${prefix}__${o.value}` : `${level}__${o.value}`;
      // Always write to the option's own key so pickExprType / pickActiveVariant can read it
      vars[o.value] = toolMultiSelect[tool]?.[stateKey] ?? o.defaultActive;
    });
  };
  applyMS(ds.multiSelect); applyMS(ds.multiSelect2, "ms2"); applyMS(ds.multiSelect3, "ms3");
  // For VO L2: the algOptions live in ms2 but pickExprType reads coefficient/constant/both directly.
  // The applyMS call above already writes them without prefix, so no extra work needed here.
  return vars;
}

function getUniqueQuestion(tool: string, level: string, vars: QOVars, used: Set<string>): AngleQuestion {
  let q: AngleQuestion, attempts = 0;
  do { q = generateQuestion(tool, level, vars); } while (used.has(q.key ?? "") && ++attempts < 100);
  used.add(q.key ?? ""); q._qo = JSON.parse(JSON.stringify(vars)); q._tool = tool;
  return q;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG / DIAGRAM
// ═══════════════════════════════════════════════════════════════════════════════
const DEG = Math.PI / 180;
function toRad(d: number): number { return d * DEG; }
function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))];
}
function sectorPath(cx: number, cy: number, r: number, f: number, t: number): string {
  let sw = t - f; while (sw < 0) sw += 360; while (sw > 360) sw -= 360;
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sw);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2} Z`;
}
function arcPath(cx: number, cy: number, r: number, f: number, t: number): string {
  let sw = t - f; while (sw < 0) sw += 360; while (sw > 360) sw -= 360;
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sw);
  return `M${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2}`;
}
function estTW(label: string, fs: number): number { return label.length * fs * 0.68 + fs * 0.6; }
function outwardBisectorDir(fromDeg: number, toDeg: number): [number, number] {
  let sw = toDeg - fromDeg; while (sw < 0) sw += 360; while (sw > 360) sw -= 360;
  const mid = fromDeg + sw / 2; return [Math.cos(toRad(mid)), Math.sin(toRad(mid))];
}
function leaderLayout(vx: number, vy: number, arcR: number, leaderLen: number, fromDeg: number, toDeg: number) {
  const [bx, by] = outwardBisectorDir(fromDeg, toDeg);
  return { tipX: vx + bx * arcR, tipY: vy + by * arcR, labelX: vx + bx * (arcR + leaderLen), labelY: vy + by * (arcR + leaderLen) };
}

interface LLProps { tipX: number; tipY: number; labelX: number; labelY: number; label: string; fontSize: number; isUnknown: boolean; showAnswer: boolean; value: number; small: boolean; }
function LeaderLabel({ tipX, tipY, labelX, labelY, label, fontSize, isUnknown, showAnswer, value, small }: LLProps) {
  const disp = isUnknown && !showAnswer ? label : isUnknown ? `${value}\u00b0` : label;
  const tw = estTW(disp, fontSize), th = fontSize * 1.4;
  const col = isUnknown ? "#2563eb" : "#6b7280";
  const dx = tipX - labelX, dy = tipY - labelY, dl = Math.sqrt(dx * dx + dy * dy);
  const ux = dl > 0.001 ? dx / dl : 0, uy = dl > 0.001 ? dy / dl : 0;
  const tEdge = dl > 0.001 ? Math.min(Math.abs((tw / 2 + 4) / (ux || 0.0001)), Math.abs((th / 2 + 2) / (uy || 0.0001))) : 0;
  const lsx = labelX + ux * (tEdge + 2), lsy = labelY + uy * (tEdge + 2);
  const as = small ? 4 : 6, px = -uy, py = ux;
  const abx = tipX - ux * as, aby = tipY - uy * as;
  return (
    <g>
      <line x1={lsx} y1={lsy} x2={abx} y2={aby} stroke={col} strokeWidth={small ? 0.8 : 1.2} strokeDasharray={small ? "3 2" : "4 3"} strokeLinecap="round" />
      <polygon points={`${tipX},${tipY} ${abx + px * as * 0.4},${aby + py * as * 0.4} ${abx - px * as * 0.4},${aby - py * as * 0.4}`} fill={col} />
      <rect x={labelX - tw / 2 - 4} y={labelY - th / 2 - 2} width={tw + 8} height={th + 4} rx={3} fill="white" fillOpacity="0.97" stroke={isUnknown ? "#93c5fd" : "#d1d5db"} strokeWidth={0.6} />
      <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontStyle={isUnknown && !showAnswer ? "italic" : "normal"} fontWeight={isUnknown ? "bold" : "600"} fill={isUnknown ? "#1d4ed8" : "#111827"}>{disp}</text>
    </g>
  );
}

interface DiagramProps { q: AngleQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number; }
function AngleDiagram({ q, showAnswer, small = false, dataIndex }: DiagramProps) {
  const size = small ? 300 : 340;
  const tfp = small ? 17 : 28;
  const ARC_SM = size * (small ? 0.20 : 0.22);
  const ARC_MD = size * (small ? 0.225 : 0.245);
  const ARC_LG = size * (small ? 0.25 : 0.27);
  const arcRFor = (deg: number) => deg <= 30 ? ARC_SM : deg <= 60 ? ARC_MD : ARC_LG;
  const LL = small ? 42 : 64;
  const ep = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};

  // ─── Vertically Opposite diagram ─────────────────────────────────────────
  if (q.tool === "verticallyOpposite") {
    const margin = small ? 18 : 60, vbs = size + margin * 2;
    const cx = vbs / 2, cy = vbs / 2, ll2 = size * 0.55;
    // Collect all rays from segments
    const allRays = q.segments.map(s => s.angleDeg);
    // Build label positions
    const cp: number[][] = [[cx, cy]];
    allRays.forEach(a => { const [px2, py2] = pt(cx, cy, ll2, a); cp.push([px2, py2]); });
    q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); cp.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
    const cPad = small ? 10 : 18;
    const cx0 = Math.min(...cp.map(p => p[0])) - cPad, cy0 = Math.min(...cp.map(p => p[1])) - cPad;
    const cx1 = Math.max(...cp.map(p => p[0])) + cPad, cy1 = Math.max(...cp.map(p => p[1])) + cPad;
    const cd = Math.max(cx1 - cx0, cy1 - cy0);
    const ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
    const fs = tfp * cd / (small ? 266 : 460);
    return (
      <svg width="100%" height="100%" viewBox={`${ccx - cd / 2} ${ccy - cd / 2} ${cd} ${cd}`} style={{ overflow: "visible" }} {...ep}>
        {q.angles.map((ang, i) => (!ang.isUnknown || ang.blank) ? null : <path key={`sh${i}`} d={sectorPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.5" stroke="none" />)}
        {/* Draw full crossing lines through centre */}
        {allRays.map((a, i) => { const [px2, py2] = pt(cx, cy, ll2, a); return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}
        {q.angles.map((ang, i) => ang.blank ? null : <path key={`arc${i}`} d={arcPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}
        {q.angles.map((ang, i) => { if (ang.blank) return null; const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}
        <circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" />
      </svg>
    );
  }

  // ─── Right Angle diagram ──────────────────────────────────────────────────
  if (q.tool === "rightAngle") {
    const inset = small ? 22 : 48, armLen = size - inset - (small ? 8 : 16);
    const rot = q.rotationDeg;
    const corners: [number, number][] = [[inset, size - inset], [size - inset, size - inset], [size - inset, inset], [inset, inset]];
    const [vx, vy] = corners[rot];
    const ss = q.segments[0].angleDeg, se = q.segments[q.segments.length - 1].angleDeg;
    const [b1x, b1y] = pt(vx, vy, armLen, ss), [b2x, b2y] = pt(vx, vy, armLen, se);
    const iSegs = q.segments.slice(1, -1);
    const sqSz = size * 0.085;
    const s1r = toRad(ss), s2r = toRad(se);
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
    return (
      <svg width="100%" height="100%" viewBox={`${bcx - bd / 2} ${bcy - bd / 2} ${bd} ${bd}`} style={{ overflow: "visible" }} {...ep}>
        {q.angles.map((ang, i) => ang.isUnknown ? <path key={`sh${i}`} d={sectorPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" /> : null)}
        <line x1={vx} y1={vy} x2={b1x} y2={b1y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={b2x} y2={b2y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />
        {iSegs.map((seg, i) => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); return <line key={`ray${i}`} x1={vx} y1={vy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}
        {q.showSquare !== false && <polyline points={`${sq1[0]},${sq1[1]} ${sq2[0]},${sq2[1]} ${sq3[0]},${sq3[1]}`} fill="none" stroke="#1e293b" strokeWidth={small ? 1.5 : 2.5} strokeLinejoin="miter" />}
        {q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}
        {q.angles.map((ang, i) => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}
        <circle cx={vx} cy={vy} r={small ? 3 : 4} fill="#1e293b" />
      </svg>
    );
  }

  // ─── Straight Line / Around a Point ──────────────────────────────────────
  const margin = small ? 18 : 60, vbs = size + margin * 2;
  const cx = vbs / 2, cy = vbs / 2, ll2 = size * 0.62;
  const cp: number[][] = [[cx, cy]];
  q.segments.forEach(seg => { const [px2, py2] = pt(cx, cy, ll2, seg.angleDeg); cp.push([px2, py2]); });
  q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); cp.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
  const cPad = small ? 10 : 18;
  const cx0 = Math.min(...cp.map(p => p[0])) - cPad, cy0 = Math.min(...cp.map(p => p[1])) - cPad;
  const cx1 = Math.max(...cp.map(p => p[0])) + cPad, cy1 = Math.max(...cp.map(p => p[1])) + cPad;
  const cd = Math.max(cx1 - cx0, cy1 - cy0); const ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
  const fs = tfp * cd / (small ? 266 : 460);
  return (
    <svg width="100%" height="100%" viewBox={`${ccx - cd / 2} ${ccy - cd / 2} ${cd} ${cd}`} style={{ overflow: "visible" }} {...ep}>
      {q.tool === "aroundPoint" && <circle cx={cx} cy={cy} r={ll2} fill="none" stroke="#e5e7eb" strokeWidth={small ? 1 : 1.5} strokeDasharray="4 4" />}
      {q.angles.map((ang, i) => !ang.isUnknown ? null : <path key={`sh${i}`} d={sectorPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" />)}
      {q.segments.map((seg, i) => { const [px2, py2] = pt(cx, cy, ll2, seg.angleDeg); return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}
      {q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}
      {q.angles.map((ang, i) => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LL, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fs} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}
      <circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" />
    </svg>
  );
}

// ─── PRINT ────────────────────────────────────────────────────────────────────
const PRINT_COLS = 3, PRINT_ROWS = 5, PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;
function handlePrint(worksheet: AngleQuestion[], isDiff: boolean, toolName: string, ref: React.RefObject<HTMLDivElement>) {
  const container = ref.current; if (!container) return;
  const svgEls = container.querySelectorAll<SVGSVGElement>("svg[data-q-index]");
  const svgStrings: string[] = [];
  svgEls.forEach(el => { const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10); const clone = el.cloneNode(true) as SVGSVGElement; clone.setAttribute("width", "100%"); clone.setAttribute("height", "100%"); svgStrings[idx] = clone.outerHTML; });
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const cell = (q: AngleQuestion, gi: number, li: number, showAns: boolean) => {
    const ansText = showAns ? (q.answer2 ? `${q.answer}, ${q.answer2}` : q.answer) : "";
    return `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAns ? `<div class="answer">${ansText}</div>` : ""}</div>`;
  };
  const stdPage = (qs: AngleQuestion[], start: number, pn: number, tp: number, ans: boolean) => {
    const cells = qs.map((q, i) => cell(q, start + i, start + i, ans)).join("");
    return `<div class="page"><div class="ph"><h1>${toolName}${ans ? " \u2014 Answers" : ""}</h1><div class="meta">Worksheet &middot; ${dateStr}${tp > 1 ? ` &middot; Page ${pn} of ${tp}` : ""}</div></div><div class="sg">${cells}</div></div>`;
  };
  const buildStd = (ans: boolean) => { const pages: string[] = []; for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) { const sl = worksheet.slice(p, p + PRINT_PER_PAGE); const tp = Math.ceil(worksheet.length / PRINT_PER_PAGE); pages.push(stdPage(sl, p, Math.floor(p / PRINT_PER_PAGE) + 1, tp, ans)); } return pages.join(""); };
  const buildDiff = (ans: boolean) => {
    const byLv: Record<string, AngleQuestion[]> = { level1: worksheet.filter(q => q.level === "level1"), level2: worksheet.filter(q => q.level === "level2"), level3: worksheet.filter(q => q.level === "level3") };
    const off: Record<string, number> = { level1: 0, level2: byLv.level1.length, level3: byLv.level1.length + byLv.level2.length };
    const tp = Math.ceil(Math.max(...Object.values(byLv).map(a => a.length)) / PRINT_ROWS);
    return Array.from({ length: tp }, (_, p) => {
      const cols = ["level1", "level2", "level3"].map((lv, li) => { const nc = ["#166534", "#854d0e", "#991b1b"][li], bg = ["#dcfce7", "#fef9c3", "#fee2e2"][li], lb = ["Level 1", "Level 2", "Level 3"][li]; const qs = byLv[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS); const cells = qs.map((q, i) => cell(q, off[lv] + p * PRINT_ROWS + i, p * PRINT_ROWS + i, ans)).join(""); return `<div class="dc"><div class="dh" style="color:${nc};background:${bg}">${lb}</div><div class="dcs">${cells}</div></div>`; }).join("");
      return `<div class="page"><div class="ph"><h1>${toolName}${ans ? " \u2014 Answers" : ""}</h1><div class="meta">Differentiated &middot; ${dateStr}${tp > 1 ? ` &middot; Page ${p + 1} of ${tp}` : ""}</div></div><div class="dg">${cols}</div></div>`;
    }).join("");
  };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName}</title><style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:12mm}body{font-family:"Segoe UI",Arial,sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}.page{width:186mm;height:273mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}.page:last-child{page-break-after:auto}.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;flex-shrink:0}.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a}.meta{font-size:3mm;color:#6b7280}.sg{display:grid;grid-template-columns:repeat(${PRINT_COLS},1fr);grid-template-rows:repeat(${PRINT_ROWS},1fr);gap:2mm;flex:1;min-height:0}.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm;flex:1;min-height:0}.dc{display:flex;flex-direction:column;gap:2mm;min-height:0}.dh{text-align:center;font-size:3.5mm;font-weight:700;padding:1.5mm 0;border-radius:1.5mm;flex-shrink:0}.dcs{display:flex;flex-direction:column;gap:2mm;flex:1;min-height:0}.cell{border:.3mm solid #d1d5db;border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2mm;overflow:hidden;flex:1;min-height:0;position:relative}.cell-num{position:absolute;top:1.5mm;left:2mm;font-size:2.8mm;font-weight:700;color:#374151}.cell-diagram{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}.cell-diagram svg{width:100%;height:100%;overflow:visible}.answer{font-size:3mm;font-weight:700;color:#059669;text-align:center;flex-shrink:0;margin-top:1mm}</style></head><body>${isDiff ? buildDiff(false) + buildDiff(true) : buildStd(false) + buildStd(true)}</body></html>`;
  const win = window.open("", "_blank"); if (!win) { alert("Please allow popups."); return; }
  win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400);
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <Chevron open={open} />
  </button>
);
const DiffToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {[["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]].map(([val, lbl, col]) => (
      <button key={val} onClick={() => onChange(val)} className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{lbl}</button>
    ))}
  </div>
);
const VariablesSection = ({ variables, values, onChange }: { variables: VarCfg[]; values: Record<string, boolean>; onChange: (k: string, v: boolean) => void }) => (
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
const MultiSelectSection = ({ multiSelect, values, onChange, allowAllOff = false }: { multiSelect: MultiSelectCfg; values: Record<string, boolean>; onChange: (k: string, v: boolean) => void; allowAllOff?: boolean }) => {
  const ac = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = !allowAllOff && isActive && ac === 1;
          return (
            <button key={opt.value} onClick={() => { if (!isLast) onChange(opt.value, !isActive); }} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors text-center ${isActive ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {opt.label.split("|").map((line, i) => <span key={i} style={{ display: "block" }}>{line}</span>)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function renderLevelPanelContent(
  tool: ToolKey, lv: DifficultyLevel,
  toolVariables: Record<string, Record<string, Record<string, boolean>>>,
  toolMultiSelect: Record<string, Record<string, boolean>>,
  setTV: (t: string, l: string, k: string, v: boolean) => void,
  setTMS: (t: string, l: string, k: string, v: boolean) => void,
) {
  const ds = TOOL_CONFIG.tools[tool].difficultySettings[lv];
  const varVals = toolVariables[tool]?.[lv] ?? {};
  const msVals: Record<string, boolean> = {};
  if (ds.multiSelect) ds.multiSelect.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${lv}__${o.value}`] ?? o.defaultActive; });
  const ms2Vals: Record<string, boolean> = {};
  if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { ms2Vals[o.value] = toolMultiSelect[tool]?.[`${lv}__ms2__${o.value}`] ?? o.defaultActive; });
  const ms3Vals: Record<string, boolean> = {};
  if (ds.multiSelect3) ds.multiSelect3.options.forEach(o => { ms3Vals[o.value] = toolMultiSelect[tool]?.[`${lv}__ms3__${o.value}`] ?? o.defaultActive; });
  return (
    <div className="flex flex-col gap-4">
      {ds.multiSelect && <MultiSelectSection multiSelect={ds.multiSelect} values={msVals} onChange={(k, v) => setTMS(tool, lv, k, v)} allowAllOff={ds.multiSelect.key === "algOptions"} />}
      {ds.multiSelect2 && <MultiSelectSection multiSelect={ds.multiSelect2} values={ms2Vals} onChange={(k, v) => setTMS(tool, lv, `ms2__${k}`, v)} allowAllOff={ds.multiSelect2.key === "algOptions"} />}
      {ds.multiSelect3 && <MultiSelectSection multiSelect={ds.multiSelect3} values={ms3Vals} onChange={(k, v) => setTMS(tool, lv, `ms3__${k}`, v)} />}
      {ds.variables.length > 0 && <VariablesSection variables={ds.variables} values={varVals} onChange={(k, v) => setTV(tool, lv, k, v)} />}
    </div>
  );
}

interface QOProps { tool: ToolKey; level: DifficultyLevel; toolVariables: Record<string, Record<string, Record<string, boolean>>>; setToolVariable: (t: string, l: string, k: string, v: boolean) => void; toolMultiSelect: Record<string, Record<string, boolean>>; setToolMultiSelect: (t: string, l: string, k: string, v: boolean) => void; }
const StandardQOPopover = ({ tool, level, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }: QOProps) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5">{renderLevelPanelContent(tool, level, toolVariables, toolMultiSelect, setToolVariable, setToolMultiSelect)}</div>}
    </div>
  );
};

interface DiffQOProps { tool: ToolKey; toolVariables: Record<string, Record<string, Record<string, boolean>>>; setToolVariable: (t: string, l: string, k: string, v: boolean) => void; toolMultiSelect: Record<string, Record<string, boolean>>; setToolMultiSelect: (t: string, l: string, k: string, v: boolean) => void; }
const DiffQOPopover = ({ tool, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }: DiffQOProps) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-6">
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map(lv => (
            <div key={lv}><span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span><div className="mt-3 pl-1">{renderLevelPanelContent(tool, lv, toolVariables, toolMultiSelect, setToolVariable, setToolMultiSelect)}</div></div>
          ))}
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0"><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20} /></button></div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">{INFO_SECTIONS.map(s => (<div key={s.title}><div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div><div className="flex flex-col gap-2">{s.content.map(item => <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3"><span className="font-bold text-gray-800 text-sm">{item.label}</span><p className="text-sm text-gray-500 mt-0.5">{item.detail}</p></div>)}</div></div>))}</div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0"><button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm">Close</button></div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: { colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: 200 }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"><span>Colour Scheme</span><span className="text-xs text-gray-400 capitalize">{colorScheme}</span></button>
        {colorOpen && <div className="border-t border-gray-100">{["default", "blue", "pink", "yellow"].map(s => (<button key={s} onClick={() => { setColorScheme(s); onClose(); }} className={`w-full flex items-center pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{s}</button>))}</div>}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Tool Information</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function BasicAngleFacts() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolKey[];
  const wsRef = useRef<HTMLDivElement>(null);
  const [currentTool, setCurrentTool] = useState<ToolKey>("rightAngle");
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  const initVars = (): Record<string, Record<string, Record<string, boolean>>> => {
    const r: Record<string, Record<string, Record<string, boolean>>> = {};
    toolKeys.forEach(k => { r[k] = {}; (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => { r[k][lv] = {}; TOOL_CONFIG.tools[k].difficultySettings[lv].variables.forEach(v => { r[k][lv][v.key] = v.defaultValue; }); }); });
    return r;
  };
  const initMS = (): Record<string, Record<string, boolean>> => {
    const r: Record<string, Record<string, boolean>> = {};
    toolKeys.forEach(k => { r[k] = {}; (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => { const ds = TOOL_CONFIG.tools[k].difficultySettings[lv]; if (ds.multiSelect) ds.multiSelect.options.forEach(o => { r[k][`${lv}__${o.value}`] = o.defaultActive; }); if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { r[k][`${lv}__ms2__${o.value}`] = o.defaultActive; }); if (ds.multiSelect3) ds.multiSelect3.options.forEach(o => { r[k][`${lv}__ms3__${o.value}`] = o.defaultActive; }); }); });
    return r;
  };

  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, Record<string, boolean>>>>(initVars);
  const [toolMultiSelect, setToolMultiSelect] = useState<Record<string, Record<string, boolean>>>(initMS);
  const setTV = (t: string, l: string, k: string, v: boolean) => setToolVariables(p => ({ ...p, [t]: { ...p[t], [l]: { ...(p[t]?.[l] ?? {}), [k]: v } } }));
  const setTMS = (t: string, l: string, k: string, v: boolean) => setToolMultiSelect(p => ({ ...p, [t]: { ...(p[t] ?? {}), [`${l}__${k}`]: v } }));
  const bvars = useCallback((t: string, l: string) => buildVarsFromUI(t, l, toolVariables, toolMultiSelect), [toolVariables, toolMultiSelect]);

  const [curQ, setCurQ] = useState<AngleQuestion>(() => generateQuestion("rightAngle", "level1", buildVarsFromUI("rightAngle", "level1", initVars(), initMS())));
  const [showWBA, setShowWBA] = useState(false);
  const [showAns, setShowAns] = useState(false);
  const [numQ, setNumQ] = useState(9);
  const [numCols, setNumCols] = useState(3);
  const [worksheet, setWorksheet] = useState<AngleQuestion[]>([]);
  const [showWSAns, setShowWSAns] = useState(false);
  const [isDiff, setIsDiff] = useState(false);
  const [wsMode, setWsMode] = useState<"standard" | "advanced">("standard");
  const [displayFontSize] = useState(2);
  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const [cs, setCs] = useState("default");
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  interface AdvGroup { id: number; level: DifficultyLevel; count: number; variables: Record<string, boolean>; multiSelectValues: Record<string, boolean>; multiSelectValues2: Record<string, boolean>; multiSelectValues3: Record<string, boolean>; }
  const mkAdvGroup = (id: number, lv: DifficultyLevel = "level1", tk: ToolKey | null = null): AdvGroup => {
    const t = tk ?? currentTool; const ds = TOOL_CONFIG.tools[t].difficultySettings[lv];
    const vars: Record<string, boolean> = {}; ds.variables.forEach(v => { vars[v.key] = v.defaultValue; });
    const ms: Record<string, boolean> = {}; if (ds.multiSelect) ds.multiSelect.options.forEach(o => { ms[o.value] = o.defaultActive; });
    const ms2: Record<string, boolean> = {}; if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { ms2[o.value] = o.defaultActive; });
    const ms3: Record<string, boolean> = {}; if (ds.multiSelect3) ds.multiSelect3.options.forEach(o => { ms3[o.value] = o.defaultActive; });
    return { id, level: lv, count: 5, variables: vars, multiSelectValues: ms, multiSelectValues2: ms2, multiSelectValues3: ms3 };
  };
  const [advGroups, setAdvGroups] = useState<AdvGroup[]>(() => [mkAdvGroup(1)]);
  const [advSelId, setAdvSelId] = useState(1);
  const advNextId = useRef(2);
  const [advShuffle, setAdvShuffle] = useState(false);
  const totalAdv = advGroups.reduce((s, g) => s + g.count, 0);

  const [wbFS, setWbFS] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [presenter, setPresenter] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [curCamId, setCurCamId] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camDDOpen, setCamDDOpen] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camDDRef = useRef<HTMLDivElement>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLP = useRef(false);
  const isDragging = useRef(false);
  const splitCRef = useRef<HTMLDivElement>(null);

  const stopStream = useCallback(() => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } if (vidRef.current) vidRef.current.srcObject = null; }, []);
  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamErr(null);
    try {
      let tid = deviceId;
      if (!tid) { const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); tmp.getTracks().forEach(t => t.stop()); const all = await navigator.mediaDevices.enumerateDevices(); const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !/facetime|built.?in|integrated|internal|front|rear/i.test(d.label)); if (ext) tid = ext.deviceId; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: tid ? { deviceId: { exact: tid } } : true, audio: false });
      streamRef.current = stream; if (vidRef.current) vidRef.current.srcObject = stream;
      setCurCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e) { setCamErr(e instanceof Error ? e.message : "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenter) startCam(); else stopStream(); }, [presenter]);
  useEffect(() => { if (presenter && streamRef.current && vidRef.current) vidRef.current.srcObject = streamRef.current; }, [wbFS]);
  useEffect(() => { if (!camDDOpen) return; const h = (e: MouseEvent) => { if (camDDRef.current && !camDDRef.current.contains(e.target as Node)) setCamDDOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [camDDOpen]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenter(false); setWbFS(false); } }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);

  const qBg = getQuestionBg(cs), stepBg = getStepBg(cs);
  const isDef = cs === "default"; const fsTBg = isDef ? "#ffffff" : stepBg, fsQBg = isDef ? "#ffffff" : qBg, fsWBg = isDef ? "#f5f3f0" : qBg;

  const newQ = useCallback(() => {
    const v = buildVarsFromUI(currentTool, difficulty, toolVariables, toolMultiSelect);
    setCurQ(generateQuestion(currentTool, difficulty, v));
    setShowWBA(false); setShowAns(false);
  }, [currentTool, difficulty, toolVariables, toolMultiSelect]);

  const genWorksheet = () => {
    const used = new Set<string>(); const qs: AngleQuestion[] = [];
    if (isDiff) { (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => { const vars = bvars(currentTool, lv); for (let i = 0; i < numQ; i++) qs.push(getUniqueQuestion(currentTool, lv, vars, used)); }); }
    else { const vars = bvars(currentTool, difficulty); for (let i = 0; i < numQ; i++) qs.push(getUniqueQuestion(currentTool, difficulty, vars, used)); }
    setWorksheet(qs); setShowWSAns(false);
  };

  const regenQ = (idx: number) => {
    const q = worksheet[idx]; if (!q._qo) return;
    const tool = (q._tool ?? currentTool) as ToolKey; const level = (q.difficulty ?? q.level) as DifficultyLevel; const vars = q._qo as QOVars;
    const existing = new Set(worksheet.map(w => w.key ?? "")); existing.delete(q.key ?? "");
    let rep: AngleQuestion | null = null;
    for (let att = 0; att < 100; att++) { const c = generateQuestion(tool, level, vars); if (!existing.has(c.key ?? "")) { c._qo = JSON.parse(JSON.stringify(vars)); c._tool = tool; rep = c; break; } }
    if (rep) setWorksheet(prev => prev.map((w, i) => i === idx ? rep! : w));
  };

  const genAdvanced = () => {
    const used = new Set<string>(); const qs: AngleQuestion[] = [];
    advGroups.forEach(g => {
      const ds = TOOL_CONFIG.tools[currentTool].difficultySettings[g.level];
      const vars: QOVars = { ...g.variables, ...g.multiSelectValues, ...g.multiSelectValues2, ...g.multiSelectValues3 };
      if (ds.multiSelect2) { vars.integer = g.multiSelectValues2.integer ?? true; vars.decimal = g.multiSelectValues2.decimal ?? false; }
      for (let i = 0; i < g.count; i++) qs.push(getUniqueQuestion(currentTool, g.level, vars, used));
    });
    if (advShuffle) { for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; } }
    setWorksheet(qs); setShowWSAns(false);
  };

  useEffect(() => { if (mode !== "worksheet") newQ(); }, [difficulty, currentTool]);
  useEffect(() => {
    if (mode !== "worksheet" || wsMode !== "advanced") return;
    const h = (e: KeyboardEvent) => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; const idx = advGroups.findIndex(g => g.id === advSelId); if (idx < 0) return; const ni = e.key === "ArrowLeft" ? idx - 1 : idx + 1; if (ni >= 0 && ni < advGroups.length) { setAdvSelId(advGroups[ni].id); e.preventDefault(); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, [mode, wsMode, advGroups, advSelId]);

  const CELL_H = 280;
  const stdQO: QOProps = { tool: currentTool, level: difficulty, toolVariables, setToolVariable: setTV, toolMultiSelect, setToolMultiSelect: setTMS };
  const diffQO: DiffQOProps = { tool: currentTool, toolVariables, setToolVariable: setTV, toolMultiSelect, setToolMultiSelect: setTMS };

  const renderAdvInlineQO = (g: AdvGroup) => {
    const ds = TOOL_CONFIG.tools[currentTool].difficultySettings[g.level];
    const upd = (id: number, patch: Partial<AdvGroup>) => setAdvGroups(gs => gs.map(ag => ag.id === id ? { ...ag, ...patch } : ag));
    const msVals = g.multiSelectValues; const ms2Vals = g.multiSelectValues2; const ms3Vals = g.multiSelectValues3;
    return (
      <div className="flex flex-col gap-4">
        {ds.multiSelect && <MultiSelectSection multiSelect={ds.multiSelect} values={msVals} onChange={(k, v) => upd(g.id, { multiSelectValues: { ...msVals, [k]: v } })} allowAllOff={ds.multiSelect.key === "algOptions"} />}
        {ds.multiSelect2 && <MultiSelectSection multiSelect={ds.multiSelect2} values={ms2Vals} onChange={(k, v) => upd(g.id, { multiSelectValues2: { ...ms2Vals, [k]: v } })} allowAllOff={ds.multiSelect2.key === "algOptions"} />}
        {ds.multiSelect3 && <MultiSelectSection multiSelect={ds.multiSelect3} values={ms3Vals} onChange={(k, v) => upd(g.id, { multiSelectValues3: { ...ms3Vals, [k]: v } })} />}
        {ds.variables.length > 0 && <VariablesSection variables={ds.variables} values={g.variables} onChange={(k, v) => upd(g.id, { variables: { ...g.variables, [k]: v } })} />}
      </div>
    );
  };

  const renderQCell = (q: AngleQuestion, globalIdx: number, localIdx: number, bgOvr?: string) => {
    const hh = 28, dh = q.tool === "rightAngle" ? CELL_H - hh : CELL_H;
    const ansText = q.answer2 ? `${q.answer}, ${q.answer2}` : q.answer;
    return (
      <div className="rounded-xl group" style={{ backgroundColor: bgOvr ?? stepBg, border: "1px solid #e5e7eb", overflow: "hidden", position: "relative" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000", zIndex: 5 }}>{localIdx + 1})</span>
        {q._qo && <button onClick={() => regenQ(globalIdx)} title="Regenerate" className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100" style={{ zIndex: 10 }}><RefreshCw size={12} /></button>}
        <div style={{ height: dh, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
          <div style={{ width: "95%", height: "95%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AngleDiagram q={q} showAnswer={showWSAns} small dataIndex={globalIdx} />
          </div>
        </div>
        {showWSAns && <div className="text-base font-bold text-center pb-2" style={{ color: "#059669" }}>{ansText}</div>}
        {q.tool === "rightAngle" && <div className="text-xs text-center pb-2 text-gray-500 italic">The diagram depicts a right angle</div>}
      </div>
    );
  };

  const renderAdvWS = () => {
    const lvCol = (lv: DifficultyLevel) => lv === "level1" ? "bg-green-600" : lv === "level2" ? "bg-yellow-500" : "bg-red-600";
    const lvBrd = (lv: DifficultyLevel) => lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";
    const upd = (id: number, patch: Partial<AdvGroup>) => setAdvGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
    const sel = advGroups.find(g => g.id === advSelId) ?? advGroups[0];
    return (
      <div className="flex gap-3" style={{ minHeight: 300 }}>
        <div className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden" style={{ width: "50%", flexShrink: 0, backgroundColor: "#fff" }}>
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {advGroups.map((g, idx) => {
              const isSel = g.id === advSelId;
              return (
                <div key={g.id} onClick={() => setAdvSelId(g.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" style={{ borderLeft: `3px solid ${isSel ? lvBrd(g.level) : "transparent"}`, backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{idx + 1}</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(["level1","level2","level3"] as DifficultyLevel[]).map((lv, li) => <button key={lv} onClick={() => { upd(g.id, { ...mkAdvGroup(g.id, lv), id: g.id }); setAdvSelId(g.id); }} className={`px-2.5 py-1 font-bold text-xs ${g.level === lv ? `${lvCol(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>L{li + 1}</button>)}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => upd(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 font-bold leading-none">&#8722;</button>
                    <span className="w-6 text-center text-xs font-bold text-gray-800">{g.count}</span>
                    <button onClick={() => upd(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 font-bold leading-none">&#43;</button>
                  </div>
                  {advGroups.length > 1 && <button onClick={e => { e.stopPropagation(); const rem = advGroups.filter((_, i) => i !== idx); setAdvGroups(rem); if (g.id === advSelId) setAdvSelId(rem[Math.max(0, idx - 1)].id); }} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 flex-shrink-0"><X size={12} /></button>}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-200">
            {advGroups.length < 10 ? <button onClick={() => { const id = advNextId.current++; setAdvGroups(g => [...g, mkAdvGroup(id)]); setAdvSelId(id); }} className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600">+ Add group</button> : <p className="text-center text-xs text-gray-400 py-1">Max 10 groups</p>}
          </div>
        </div>
        <div className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto" style={{ backgroundColor: "#fff" }}>
          {sel && (<><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Group {advGroups.indexOf(sel) + 1} &middot; {LV_LABELS[sel.level]} &middot; Options</p>{renderAdvInlineQO(sel)}</>)}
        </div>
      </div>
    );
  };

  const renderControlBar = () => {
    if (mode === "worksheet") {
      const isAdv = wsMode === "advanced";
      return (
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-3 px-6 pt-4 pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setWsMode(isAdv ? "standard" : "advanced")} className={`w-11 h-6 rounded-full transition-colors relative ${isAdv ? "bg-blue-900" : "bg-gray-300"}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAdv ? "translate-x-6" : "translate-x-1"}`} /></div>
              <span className="text-sm font-bold text-gray-500">Advanced</span>
            </label>
            {isAdv && <div className="ml-auto flex items-center gap-4"><label className="flex items-center gap-2 cursor-pointer"><div onClick={() => setAdvShuffle(s => !s)} className={`w-9 h-5 rounded-full relative ${advShuffle ? "bg-blue-900" : "bg-gray-300"}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${advShuffle ? "translate-x-4" : "translate-x-0.5"}`} /></div><span className="text-sm font-semibold text-gray-500">Shuffle</span></label><span className="text-sm font-bold text-gray-600">{totalAdv} questions total</span></div>}
          </div>
          {!isAdv ? (
            <div className="p-6">
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">{[["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]].map(([val,lbl,col]) => <button key={val} onClick={() => { setDifficulty(val as DifficultyLevel); setIsDiff(false); }} className={`px-5 py-2 font-bold text-base ${!isDiff && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{lbl}</button>)}</div>
                <button onClick={() => setIsDiff(!isDiff)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 ${isDiff ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
              </div>
              <div className="flex justify-center items-center gap-6 mb-4">
                {isDiff ? <DiffQOPopover {...diffQO} /> : <StandardQOPopover {...stdQO} />}
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Questions:</label><input type="number" min="1" max="24" value={numQ} onChange={e => setNumQ(Math.max(1, Math.min(24, parseInt(e.target.value) || 9)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={isDiff ? 3 : numCols} onChange={e => { if (!isDiff) setNumCols(Math.max(1, Math.min(4, parseInt(e.target.value) || 3))); }} disabled={isDiff} className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDiff ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} /></div>
              </div>
              <div className="flex justify-center items-center gap-4">
                <button onClick={genWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <><button onClick={() => setShowWSAns(!showWSAns)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWSAns ? "Hide Answers" : "Show Answers"}</button><button onClick={() => handlePrint(worksheet, isDiff, TOOL_CONFIG.tools[currentTool].name, wsRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button></>}
              </div>
            </div>
          ) : (
            <div className="p-6 pt-4">
              {renderAdvWS()}
              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-2"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={numCols} onChange={e => setNumCols(Math.max(1, Math.min(4, parseInt(e.target.value) || 3)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <button onClick={genAdvanced} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <><button onClick={() => setShowWSAns(!showWSAns)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWSAns ? "Hide Answers" : "Show Answers"}</button><button onClick={() => handlePrint(worksheet, false, TOOL_CONFIG.tools[currentTool].name, wsRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button></>}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DiffToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          <StandardQOPopover {...stdQO} />
          <div className="flex gap-3 items-center">
            <button onClick={newQ} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWBA(!showWBA) : setShowAns(!showAns)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {(mode === "whiteboard" ? showWBA : showAns) ? "Hide Answer" : "Show Answer"}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard = () => {
    const fsTB = (
      <div style={{ background: fsTBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DiffToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
        <StandardQOPopover {...stdQO} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={newQ} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWBA(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWBA ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );
    const ansText = curQ.answer2 ? `${curQ.answer}, ${curQ.answer2}` : curQ.answer;
    const qPanel = (isFS: boolean) => (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, ...(isFS ? { width: `${splitPct}%`, height: "100%", backgroundColor: fsQBg, padding: 32, boxSizing: "border-box", flexShrink: 0, overflowY: "auto" } : { width: "480px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 }) }}>
        {showWBA && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{ansText}</div>}
        <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AngleDiagram q={curQ} showAnswer={showWBA} />
        </div>
        {curQ.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center pb-1">The diagram depicts a right angle</div>}
      </div>
    );
    const rPanel = (isFS: boolean) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenter ? "#000" : (isFS ? fsWBg : stepBg) }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenter && (<><video ref={vidRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />{camErr && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camErr}</div>}</>)}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenter ? (
            <div style={{ position: "relative" }} ref={camDDRef}>
              <button onMouseDown={() => { didLP.current = false; lpTimer.current = setTimeout(() => { didLP.current = true; setCamDDOpen(o => !o); }, 500); }} onMouseUp={() => { if (lpTimer.current) clearTimeout(lpTimer.current); if (!didLP.current) setPresenter(false); }} onMouseLeave={() => { if (lpTimer.current) clearTimeout(lpTimer.current); }} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="rgba(255,255,255,0.85)" /></button>
              {camDDOpen && (<div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                <div style={{ padding: "6px 14px", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Camera</div>
                {camDevices.map((d, i) => (<div key={d.deviceId} onClick={() => { setCamDDOpen(false); if (d.deviceId !== curCamId) startCam(d.deviceId); }} style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === curCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === curCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />{d.label || `Camera ${i + 1}`}</div>))}
              </div>)}
            </div>
          ) : (<button onClick={() => setPresenter(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="#6b7280" /></button>)}
          <button onClick={() => setWbFS(f => !f)} style={{ background: wbFS ? "#374151" : "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{wbFS ? <Minimize2 size={16} color="#fff" /> : <Maximize2 size={16} color="#6b7280" />}</button>
        </div>
      </div>
    );
    if (wbFS) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsTBg, display: "flex", flexDirection: "column" }}>
        {fsTB}
        <div ref={splitCRef} style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {qPanel(true)}
          <div style={{ position: "relative", width: 2, backgroundColor: "#000", flexShrink: 0, cursor: "col-resize" }} onMouseDown={e => { e.preventDefault(); isDragging.current = true; const onM = (ev: MouseEvent) => { if (!isDragging.current || !splitCRef.current) return; const r = splitCRef.current.getBoundingClientRect(); const p = ((ev.clientX - r.left) / r.width) * 100; setSplitPct(Math.min(75, Math.max(25, p >= 38 && p <= 42 ? 40 : p))); }; const onU = () => { isDragging.current = false; document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU); }; document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU); }}><div style={{ position: "absolute", top: 0, bottom: 0, left: -5, width: 12, cursor: "col-resize" }} /></div>
          {rPanel(true)}
        </div>
      </div>
    );
    return (<div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}><div className="flex gap-6" style={{ height: "100%" }}>{qPanel(false)}{rPanel(false)}</div></div>);
  };

  const renderWorkedExample = () => {
    const ansText = curQ.answer2 ? `${curQ.answer}, ${curQ.answer2}` : curQ.answer;
    return (
      <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
        <div className="p-8" style={{ backgroundColor: qBg }}>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4" style={{ width: 340, height: 340, margin: "0 auto" }}><AngleDiagram q={curQ} showAnswer={showAns} /></div>
            {curQ.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center mb-4">The diagram depicts a right angle</div>}
            {showAns && (<>
              <div className="space-y-4 mt-4">{curQ.working.slice(0, -1).map((step, i) => (<div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}><h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4><p className={`${displayFontSizes[displayFontSize]} font-semibold`} style={{ color: "#000" }}>{step.text}</p></div>))}</div>
              <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}><span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{ansText}</span></div>
            </>)}
          </div>
        </div>
      </div>
    );
  };

  const renderWorksheet = () => {
    if (worksheet.length === 0) return <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}><span className="text-2xl text-gray-400">Generate worksheet</span></div>;
    const title = TOOL_CONFIG.tools[currentTool].name;
    if (isDiff) return (
      <div ref={wsRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{title} &#8212; Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv), c = LV_COLORS[lv];
            const offset = ["level1","level2","level3"].slice(0, li).reduce((s, l) => s + worksheet.filter(q => q.level === l).length, 0);
            return (<div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}><h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3><div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>{lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, offset + idx, idx, c.fill)}</div>)}</div></div>);
          })}
        </div>
      </div>
    );
    return (
      <div ref={wsRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{title} &#8212; Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numCols}, 1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, idx)}</div>)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg"><Home size={24} /><span className="font-semibold text-lg">Home</span></button>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg">{menuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            {menuOpen && <MenuDropdown colorScheme={cs} setColorScheme={setCs} onClose={() => setMenuOpen(false)} onOpenInfo={() => setInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {toolKeys.map(k => <button key={k} onClick={() => { setCurrentTool(k); setWorksheet([]); advNextId.current = 2; setAdvGroups([mkAdvGroup(1, "level1", k)]); setAdvSelId(1); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{TOOL_CONFIG.tools[k].name}</button>)}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m, lbl]) => <button key={m} onClick={() => { setMode(m); setPresenter(false); setWbFS(false); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{lbl}</button>)}
          </div>
          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (<div className="flex flex-col gap-6"><div className="rounded-xl shadow-lg">{renderControlBar()}</div><div className="rounded-xl shadow-lg overflow-hidden">{mode === "whiteboard" && renderWhiteboard()}{mode === "single" && renderWorkedExample()}</div></div>)}
        </div>
      </div>
    </>
  );
}
