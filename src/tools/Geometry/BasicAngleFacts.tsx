import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Eye, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type DifficultyLevel = "level1" | "level2" | "level3";
type ToolKey = "rightAngle" | "straightLine" | "aroundPoint" | "mixed";

interface SegmentDef { angleDeg: number; }
interface AngleDef {
  label: string; isUnknown: boolean; value: number;
  arcFromDeg: number; arcToDeg: number; bisectorDeg: number;
}
interface AngleQuestion {
  tool: string; level: string; difficulty?: string; key?: string;
  rotationDeg: number; segments: SegmentDef[]; angles: AngleDef[];
  answer: string; working: { text: string }[]; id: number;
  showSquare?: boolean; _qo?: Record<string, unknown>; _tool?: string;
}
interface QOVars { [key: string]: unknown; }

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

interface MSOption { value: string; label: string; defaultActive: boolean; }
interface DDOption { value: string; label: string; }
interface MultiSelectCfg { key: string; label: string; options: MSOption[]; }
interface DropdownCfg { key: string; label: string; options: DDOption[]; defaultValue: string; }
interface VarCfg { key: string; label: string; defaultValue: boolean; }
interface LevelSettings {
  dropdown: DropdownCfg | null;
  variables: VarCfg[];
  multiSelect?: MultiSelectCfg;
  multiSelect2?: MultiSelectCfg;
}
interface ToolCfg { name: string; difficultySettings: Record<DifficultyLevel, LevelSettings>; }

const TOOL_CONFIG: { pageTitle: string; tools: Record<ToolKey, ToolCfg> } = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle",
      difficultySettings: {
        level1: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level2: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level3: { dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" }, variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
      },
    },
    straightLine: {
      name: "Straight Line",
      difficultySettings: {
        level1: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level2: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level3: { dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" }, variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
      },
    },
    aroundPoint: {
      name: "Around a Point",
      difficultySettings: {
        level1: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level2: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
        level3: { dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" }, variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] } },
      },
    },
    mixed: {
      name: "Mixed Practice",
      difficultySettings: {
        level1: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] }, multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] } },
        level2: { dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" }, variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] }, multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] } },
        level3: { dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" }, variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "showSquare", label: "Show right angle square symbol", defaultValue: true }], multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] }, multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] } },
      },
    },
  },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
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
  { title: "Mixed", icon: "🔀", content: [{ label: "Overview", detail: "Combines 90°, 180° and 360° questions." }] },
  { title: "Modes", icon: "🖥️", content: [{ label: "Whiteboard", detail: "Single question with working space." }, { label: "Worked Example", detail: "Step-by-step solution." }, { label: "Worksheet", detail: "Grid with PDF export." }] },
];

// ─── UTILITY ──────────────────────────────────────────────────────────────────
function rnd(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a: number, b: number): number { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }
function exprLabel(c: number, k: number): string {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  return k > 0 ? `${base} + ${Math.abs(k)}` : `${base} \u2212 ${Math.abs(k)}`;
}
function r1dpStr(n: number): string { return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10); }
function niceXVal(minVal: number, maxVal: number, useDecimal: boolean): number {
  if (!useDecimal) return rnd(Math.ceil(minVal), Math.floor(maxVal));
  const pool: number[] = [];
  for (let n = Math.ceil(minVal * 10); n <= Math.floor(maxVal * 10); n++) pool.push(Math.round(n) / 10);
  for (let n = Math.ceil(minVal * 4); n <= Math.floor(maxVal * 4); n++) { const v = Math.round(n * 25) / 100; if (!pool.includes(v)) pool.push(v); }
  if (pool.length === 0) return rnd(Math.ceil(minVal), Math.floor(maxVal));
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickExprType(vars: QOVars): string | null {
  const active: string[] = [];
  if (vars.coefficient) active.push("coefficient");
  if (vars.constant) active.push("constant");
  if (vars.both) active.push("both");
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}
function getQuestionBg(cs: string): string { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" } as Record<string,string>)[cs] ?? "#ffffff"; }
function getStepBg(cs: string): string { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" } as Record<string,string>)[cs] ?? "#f3f4f6"; }

// ─── STRAIGHT LINE ────────────────────────────────────────────────────────────
function buildStraightLevel1(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lineLeftDeg = rotationDeg + 180;
  if (exprType !== null) {
    let known = 0, k = 0, c = 1, xVal = 0, attempts = 0;
    do {
      known = rnd(20, 140); const remainder = 180 - known;
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      if (exprType === "coefficient") { k = 0; const xMax = (remainder - 1) / c; if (xMax < 5 / c) { attempts++; continue; } xVal = niceXVal(5 / c, xMax, useDecimal); }
      else { const kMax = Math.floor(remainder * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (remainder - k) / c; if (xMax < 5 / c) { attempts++; continue; } xVal = niceXVal(5 / c, xMax, useDecimal); }
      if (xVal <= 0 || c * xVal + k < 5) { attempts++; continue; }
      known = Math.round((180 - (c * xVal + k)) * 10) / 10;
      if (known < 5 || known > 170) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { known = 90; k = 0; c = 1; xVal = 90; }
    const knownFirst = rnd(0, 1) === 0;
    const firstSpan = knownFirst ? known : c * xVal + k;
    const secondSpan = knownFirst ? c * xVal + k : known;
    const rayDeg = lineLeftDeg + firstSpan;
    const xLabel = exprLabel(c, k);
    return { tool: "straightLine", level: "level1", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }], angles: [{ label: knownFirst ? `${known}°` : xLabel, isUnknown: !knownFirst, value: firstSpan, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + firstSpan / 2 }, { label: knownFirst ? xLabel : `${known}°`, isUnknown: knownFirst, value: secondSpan, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + firstSpan + secondSpan / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${known}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${r1dpStr(180 - known)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xVal)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xVal)} ÷ ${c}` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const xRaw = useDecimal ? niceXVal(15, 165, true) : rnd(15, 165);
  let known = useDecimal ? Math.round((180 - xRaw) * 10) / 10 : 180 - xRaw;
  let missing = xRaw;
  if (missing < 10 || missing > 170 || known < 10) { known = 90; missing = 90; }
  const knownFirst = rnd(0, 1) === 0;
  const firstSpan = knownFirst ? known : missing;
  const secondSpan = knownFirst ? missing : known;
  const rayDeg = lineLeftDeg + firstSpan;
  return { tool: "straightLine", level: "level1", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }], angles: [{ label: knownFirst ? `${known}°` : "x", isUnknown: !knownFirst, value: firstSpan, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + firstSpan / 2 }, { label: knownFirst ? "x" : `${known}°`, isUnknown: knownFirst, value: secondSpan, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + firstSpan + secondSpan / 2 }], answer: `x = ${missing}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `x = 180° − ${known}°` }, { text: `x = ${missing}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightLevel2(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, 3)];
  const lineLeftDeg = rotationDeg + 180;
  let a1 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80);
  let a2 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80);
  while (a1 + a2 >= 155 || a1 + a2 <= 30) { a1 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80); a2 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80); }
  const a3 = useDecimal ? Math.round((180 - a1 - a2) * 10) / 10 : 180 - a1 - a2;
  if (a3 < 10) return buildStraightLevel2(vars);
  const vals = [a1, a2, a3];
  const ray1Deg = lineLeftDeg + a1, ray2Deg = lineLeftDeg + a1 + a2;
  const arcPairs: [number, number][] = [[lineLeftDeg, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, rotationDeg + 360]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];
  if (exprType !== null) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMax = (90 - a1 - a2 - 1) / c; if (xMax < 5 / c) { attempts++; continue; } xSolve = niceXVal(5 / c, xMax, useDecimal); }
      else { const kMax = Math.floor((90 - a1 - a2) * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (90 - a1 - a2 - k) / c; if (xMax < 5 / c) { attempts++; continue; } xSolve = niceXVal(5 / c, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10; if (xAngle < 3) { attempts++; continue; } break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const knownSum = Math.round((180 - xAngle) * 10) / 10;
    const a1r = Math.round(knownSum / 2), a2r = knownSum - a1r;
    const ray1r = lineLeftDeg + a1r, ray2r = lineLeftDeg + a1r + a2r;
    const xLabel = exprLabel(c, k);
    return { tool: "straightLine", level: "level2", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1r }, { angleDeg: ray2r }, { angleDeg: rotationDeg }], angles: [{ label: `${a1r}°`, isUnknown: false, value: a1r, arcFromDeg: lineLeftDeg, arcToDeg: ray1r, bisectorDeg: lineLeftDeg + a1r / 2 }, { label: `${a2r}°`, isUnknown: false, value: a2r, arcFromDeg: ray1r, arcToDeg: ray2r, bisectorDeg: lineLeftDeg + a1r + a2r / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: ray2r, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + a1r + a2r + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${a1r}° + ${a2r}° + ${xLabel} = 180°` }, { text: `${knownSum}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  return { tool: "straightLine", level: "level2", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: rotationDeg }], angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: lineLeftDeg + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 180°` }, { text: `${180 - xVal}° + x = 180°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightLevel3(vars: QOVars): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = (vars.fixedRotation ? 0 : rotations[rnd(0, 3)]) as number;
  const lineLeftDeg = rotationDeg + 180;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoLines = partsVar === "3" ? true : partsVar === "2" ? false : rnd(0, 1) === 1;
  if (!twoLines) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do { c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1; xVal = rnd(10, Math.floor(175 / (c1 + c2 + 1))); k2 = 180 - (c1 + c2) * xVal; if (Math.abs(k2) > 80 || c2 * xVal + k2 < 5 || c1 * xVal < 5) xVal = 0; attempts++; } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 20; xVal = 80; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "straightLine", level: "level3", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: lineLeftDeg + ang1Val }, { angleDeg: rotationDeg }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: lineLeftDeg, arcToDeg: lineLeftDeg + ang1Val, bisectorDeg: lineLeftDeg + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: lineLeftDeg + ang1Val, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 180°` }, { text: `${c1 + c2}x ${k2Str} = 180°` }, { text: `${c1 + c2}x = ${180 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const c1 = useCoefficients ? rnd(1, 5) : 1, c2 = useCoefficients ? rnd(1, 5) : 1;
  const fixedAngle = rnd(20, 70);
  const xVal = rnd(5, Math.max(5, Math.floor((180 - fixedAngle - 10) / (c1 + c2))));
  const k = 180 - fixedAngle - (c1 + c2) * xVal;
  const ang2Val = c1 * xVal, ang3Val = c2 * xVal + k;
  if (ang2Val < 5 || ang3Val < 5) {
    const xV = rnd(20, 70), kV = 180 - fixedAngle - 2 * xV;
    const kStr = kV >= 0 ? `+ ${kV}` : `\u2212 ${Math.abs(kV)}`;
    const r1 = lineLeftDeg + fixedAngle, r2 = lineLeftDeg + fixedAngle + xV;
    return { tool: "straightLine", level: "level3", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg }], angles: [{ label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: lineLeftDeg, arcToDeg: r1, bisectorDeg: lineLeftDeg + fixedAngle / 2 }, { label: "x", isUnknown: true, value: xV, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lineLeftDeg + fixedAngle + xV / 2 }, { label: `x ${kStr}`, isUnknown: true, value: xV + kV, arcFromDeg: r2, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + fixedAngle + xV + (xV + kV) / 2 }], answer: `x = ${xV}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${fixedAngle}° + x + x ${kStr} = 180°` }, { text: `2x ${kStr} = ${180 - fixedAngle}°` }, { text: `2x = ${180 - fixedAngle - kV}°` }, { text: `x = ${xV}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = lineLeftDeg + fixedAngle, r2 = lineLeftDeg + fixedAngle + ang2Val;
  return { tool: "straightLine", level: "level3", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg }], angles: [{ label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: lineLeftDeg, arcToDeg: r1, bisectorDeg: lineLeftDeg + fixedAngle / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lineLeftDeg + fixedAngle + ang2Val / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + fixedAngle + ang2Val + ang3Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${fixedAngle}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 180°` }, { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 180°` }, { text: `${c1 + c2}x = ${180 - fixedAngle - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── RIGHT ANGLE ──────────────────────────────────────────────────────────────
function rightSector(rot: number): { sectorStart: number; sectorEnd: number } {
  const sectorStart = ((3 - rot) * 90 + 360) % 360;
  return { sectorStart, sectorEnd: sectorStart + 90 };
}

function buildRightLevel1(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  if (exprType !== null) {
    let known = 0, k = 0, c = 1, xVal = 0, attempts = 0;
    do {
      known = rnd(5, 70); const remainder = 90 - known;
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      if (exprType === "coefficient") { k = 0; const xMax = (remainder - 1) / c; if (xMax < 5 / c) { attempts++; continue; } xVal = niceXVal(5 / c, xMax, useDecimal); }
      else { const kMax = Math.floor(remainder * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (remainder - k) / c; if (xMax < 5 / c) { attempts++; continue; } xVal = niceXVal(5 / c, xMax, useDecimal); }
      if (xVal <= 0 || c * xVal + k < 3) { attempts++; continue; }
      known = 90 - (c * xVal + k);
      if (known < 3 || known > 87) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { known = 50; k = 0; c = 1; xVal = 40; }
    const knownSpan = known, unknownSpan = c * xVal + k;
    const knownFirst = rnd(0, 1) === 0;
    const firstSpan = knownFirst ? knownSpan : unknownSpan;
    const secondSpan = knownFirst ? unknownSpan : knownSpan;
    const rayDeg = sectorStart + firstSpan;
    const xLabel = exprLabel(c, k);
    return { tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }], angles: [{ label: knownFirst ? `${known}°` : xLabel, isUnknown: !knownFirst, value: firstSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + firstSpan / 2 }, { label: knownFirst ? xLabel : `${known}°`, isUnknown: knownFirst, value: secondSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + firstSpan + secondSpan / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${known}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${r1dpStr(90 - known)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xVal)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xVal)} ÷ ${c}` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const xRaw = useDecimal ? niceXVal(5, 80, true) : rnd(5, 80);
  const knownV = useDecimal ? Math.round((90 - xRaw) * 10) / 10 : 90 - xRaw;
  let xVal = xRaw;
  if (xVal < 3 || xVal > 87 || knownV < 3) xVal = 45;
  const knownVal = useDecimal ? Math.round((90 - xVal) * 10) / 10 : 90 - xVal;
  const knownFirst = rnd(0, 1) === 0;
  const firstSpan = knownFirst ? knownVal : xVal;
  const secondSpan = knownFirst ? xVal : knownVal;
  const rayDeg = sectorStart + firstSpan;
  return { tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }], angles: [{ label: knownFirst ? `${knownVal}°` : "x", isUnknown: !knownFirst, value: firstSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + firstSpan / 2 }, { label: knownFirst ? "x" : `${knownVal}°`, isUnknown: knownFirst, value: secondSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + firstSpan + secondSpan / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `x = 90° − ${knownVal}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildRightLevel2(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  let a1 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40);
  let a2 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40);
  while (a1 + a2 >= 75 || a1 + a2 <= 20) { a1 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40); a2 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40); }
  const a3 = useDecimal ? Math.round((90 - a1 - a2) * 10) / 10 : 90 - a1 - a2;
  if (a3 < 5) return buildRightLevel2(vars);
  const vals = [a1, a2, a3];
  const ray1Deg = sectorStart + a1, ray2Deg = sectorStart + a1 + a2;
  const arcPairs: [number, number][] = [[sectorStart, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, sectorEnd]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];
  if (exprType !== null) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    const knownSumBase = Math.round(a1 + a2);
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMax = (90 - knownSumBase - 1) / c; if (xMax < 5 / c) { attempts++; continue; } xSolve = niceXVal(5 / c, xMax, useDecimal); }
      else { const kMax = Math.floor((90 - knownSumBase) * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (90 - knownSumBase - k) / c; if (xMax < 5 / c) { attempts++; continue; } xSolve = niceXVal(5 / c, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10; if (xAngle < 3) { attempts++; continue; } break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const knownSum = Math.round((90 - xAngle) * 10) / 10;
    const a1r = Math.round(knownSum / 2), a2r = knownSum - a1r;
    const ray1r = sectorStart + a1r, ray2r = sectorStart + a1r + a2r;
    const xLabel = exprLabel(c, k);
    return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: ray1r }, { angleDeg: ray2r }, { angleDeg: sectorEnd }], angles: [{ label: `${a1r}°`, isUnknown: false, value: a1r, arcFromDeg: sectorStart, arcToDeg: ray1r, bisectorDeg: sectorStart + a1r / 2 }, { label: `${a2r}°`, isUnknown: false, value: a2r, arcFromDeg: ray1r, arcToDeg: ray2r, bisectorDeg: sectorStart + a1r + a2r / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: ray2r, arcToDeg: sectorEnd, bisectorDeg: sectorStart + a1r + a2r + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${a1r}° + ${a2r}° + ${xLabel} = 90°` }, { text: `${knownSum}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: sectorEnd }], angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: sectorStart + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 90°` }, { text: `${90 - xVal}° + x = 90°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildRightLevel3(vars: QOVars): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do { c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1; xVal = rnd(5, Math.floor(85 / (c1 + c2 + 1))); k2 = 90 - (c1 + c2) * xVal; if (Math.abs(k2) > 50 || c2 * xVal + k2 < 3 || c1 * xVal < 3) xVal = 0; attempts++; } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 10; xVal = 40; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: sectorStart + ang1Val }, { angleDeg: sectorEnd }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: sectorStart, arcToDeg: sectorStart + ang1Val, bisectorDeg: sectorStart + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: sectorStart + ang1Val, arcToDeg: sectorEnd, bisectorDeg: sectorStart + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 90°` }, { text: `${c1 + c2}x ${k2Str} = 90°` }, { text: `${c1 + c2}x = ${90 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const c1 = useCoefficients ? rnd(1, 5) : 1, c2 = useCoefficients ? rnd(1, 5) : 1;
  const fixedAngle = rnd(5, 40);
  const xVal = rnd(3, Math.max(3, Math.floor((90 - fixedAngle - 6) / (c1 + c2))));
  const k = 90 - fixedAngle - (c1 + c2) * xVal;
  const ang2Val = c1 * xVal, ang3Val = c2 * xVal + k;
  if (ang2Val < 3 || ang3Val < 3) {
    const xV = rnd(10, 30), kV = 90 - fixedAngle - 2 * xV;
    const kStr = kV >= 0 ? `+ ${kV}` : `\u2212 ${Math.abs(kV)}`;
    const r1 = sectorStart + fixedAngle, r2 = sectorStart + fixedAngle + xV;
    return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }], angles: [{ label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixedAngle / 2 }, { label: "x", isUnknown: true, value: xV, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixedAngle + xV / 2 }, { label: `x ${kStr}`, isUnknown: true, value: xV + kV, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixedAngle + xV + (xV + kV) / 2 }], answer: `x = ${xV}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${fixedAngle}° + x + x ${kStr} = 90°` }, { text: `2x ${kStr} = ${90 - fixedAngle}°` }, { text: `2x = ${90 - fixedAngle - kV}°` }, { text: `x = ${xV}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = sectorStart + fixedAngle, r2 = sectorStart + fixedAngle + ang2Val;
  return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }], angles: [{ label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixedAngle / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixedAngle + ang2Val / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixedAngle + ang2Val + ang3Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${fixedAngle}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 90°` }, { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 90°` }, { text: `${c1 + c2}x = ${90 - fixedAngle - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── AROUND A POINT ───────────────────────────────────────────────────────────
function buildAroundLevel1(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const xRaw = useDecimal ? niceXVal(20, 280, true) : rnd(40, 280);
  const remaining = useDecimal ? Math.round((360 - xRaw) * 10) / 10 : 360 - xRaw;
  let a1: number, a2: number;
  if (useDecimal) { const half = Math.round(remaining / 2 * 10) / 10; const spread = niceXVal(10, Math.min(half - 10, 100), true); a1 = Math.round((half - spread) * 10) / 10; a2 = Math.round((half + spread) * 10) / 10; }
  else { a1 = rnd(40, 150); a2 = rnd(40, 150); while (a1 + a2 >= 340 || a1 + a2 <= 60) { a1 = rnd(40, 150); a2 = rnd(40, 150); } }
  const a3 = useDecimal ? Math.round((360 - a1 - a2) * 10) / 10 : 360 - a1 - a2;
  const startDeg = 270;
  const ray0 = startDeg, ray1 = startDeg + a1, ray2 = startDeg + a1 + a2;
  const arcPairs: [number, number][] = [[ray0, ray1], [ray1, ray2], [ray2, ray0 + 360]];
  const cumulative = [0, a1, a1 + a2];
  if (exprType !== null) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    const knownSumBase = Math.round(a1 + a2);
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMax = (360 - knownSumBase - 1) / c; if (xMax < 20 / c) { attempts++; continue; } xSolve = niceXVal(20 / c, xMax, useDecimal); }
      else { const kMax = Math.floor((360 - knownSumBase) * 0.4); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (360 - knownSumBase - k) / c; if (xMax < 20 / c) { attempts++; continue; } xSolve = niceXVal(20 / c, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10; if (xAngle < 20) { attempts++; continue; } break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const xLabel = exprLabel(c, k);
    return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }], angles: [{ label: `${Math.round(a1)}°`, isUnknown: false, value: a1, arcFromDeg: arcPairs[0][0], arcToDeg: arcPairs[0][1], bisectorDeg: startDeg + a1 / 2 }, { label: `${Math.round(a2)}°`, isUnknown: false, value: a2, arcFromDeg: arcPairs[1][0], arcToDeg: arcPairs[1][1], bisectorDeg: startDeg + a1 + a2 / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: arcPairs[2][0], arcToDeg: arcPairs[2][1], bisectorDeg: startDeg + a1 + a2 + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${Math.round(a1)}° + ${Math.round(a2)}° + ${xLabel} = 360°` }, { text: `${knownSumBase}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const vals = [a1, a2, a3];
  const knownSum = useDecimal ? Math.round((a1 + a2) * 10) / 10 : a1 + a2;
  return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }], angles: vals.map((v, i) => ({ label: i === 2 ? "x" : `${v}°`, isUnknown: i === 2, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })), answer: `x = ${a3}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${a1}° + ${a2}° + x = 360°` }, { text: `${knownSum}° + x = 360°` }, { text: `x = 360° − ${knownSum}°` }, { text: `x = ${a3}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundLevel2(vars: QOVars): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  let a1 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100);
  let a2 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100);
  let a3 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100);
  while (a1 + a2 + a3 >= 320 || a1 + a2 + a3 <= 60) { a1 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100); a2 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100); a3 = useDecimal ? rndDecimal(30, 100) : rnd(30, 100); }
  const a4 = useDecimal ? Math.round((360 - a1 - a2 - a3) * 10) / 10 : 360 - a1 - a2 - a3;
  const vals = [a1, a2, a3, a4];
  const unknownIdx = rnd(0, 3);
  const xVal = vals[unknownIdx];
  const startDeg = 270;
  let cumDeg = 0;
  const rayDegs = vals.map(v => { const d = startDeg + cumDeg; cumDeg += v; return d; });
  const arcPairs: [number, number][] = vals.map((_, i) => [rayDegs[i], i < vals.length - 1 ? rayDegs[i + 1] : startDeg + 360]);
  const cumulative = [0, a1, a1 + a2, a1 + a2 + a3];
  if (exprType !== null) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSumBase = knownNums.reduce((s, v) => s + Math.round(v), 0);
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMax = (360 - knownSumBase - 1) / c; if (xMax < 20 / c) { attempts++; continue; } xSolve = niceXVal(20 / c, xMax, useDecimal); }
      else { const kMax = Math.floor((360 - knownSumBase) * 0.4); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMax = (360 - knownSumBase - k) / c; if (xMax < 20 / c) { attempts++; continue; } xSolve = niceXVal(20 / c, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10; if (xAngle < 20) { attempts++; continue; } break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = xVal; xAngle = xVal; }
    const xLabel = exprLabel(c, k);
    const knownAngles = knownNums.map(v => Math.round(v));
    let cd2 = 0; const rd2 = [startDeg, ...knownAngles.map(v => { cd2 += v; return startDeg + cd2; })];
    return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: [...rd2.map(d => ({ angleDeg: d }))], angles: [...knownAngles.map((v, i) => ({ label: `${v}°`, isUnknown: false, value: v, arcFromDeg: rd2[i], arcToDeg: rd2[i + 1], bisectorDeg: rd2[i] + v / 2 })), { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: startDeg + knownSumBase, arcToDeg: startDeg + 360, bisectorDeg: startDeg + knownSumBase + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${knownAngles.join("° + ")}° + ${xLabel} = 360°` }, { text: `${knownSumBase}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: rayDegs.map(d => ({ angleDeg: d })), angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 360°` }, { text: `${360 - xVal}° + x = 360°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundLevel3(vars: QOVars): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const startDeg = 270;
  if (twoRegions) {
    let c1 = 1, c2 = 1, k2 = 0, xVal = 0; let found = false;
    for (let attempt = 0; attempt < 200 && !found; attempt++) {
      c1 = useCoefficients ? rnd(1, 4) : 1; c2 = useCoefficients ? rnd(1, 4) : 1;
      const totalC = c1 + c2;
      xVal = rnd(Math.ceil((360 - 120) / totalC), Math.floor((360 + 120) / totalC));
      k2 = 360 - totalC * xVal;
      if (k2 === 0 || c2 * xVal + k2 < 20 || c1 * xVal < 20) continue;
      found = true;
    }
    if (!found) { c1 = 1; c2 = 1; xVal = 175; k2 = 10; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "aroundPoint", level: "level3", rotationDeg: 0, segments: [{ angleDeg: startDeg }, { angleDeg: startDeg + ang1Val }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: startDeg, arcToDeg: startDeg + ang1Val, bisectorDeg: startDeg + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: startDeg + ang1Val, arcToDeg: startDeg + 360, bisectorDeg: startDeg + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 360°` }, { text: `${c1 + c2}x ${k2Str} = 360°` }, { text: `${c1 + c2}x = ${360 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let c1 = 1, c2 = 1, fixedAngle = 60, xVal = 40, k = 0, ang2Val = 0, ang3Val = 0; let found = false;
  for (let attempt = 0; attempt < 300 && !found; attempt++) {
    c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1;
    fixedAngle = rnd(30, 120); const remaining = 360 - fixedAngle; const totalC = c1 + c2;
    xVal = rnd(Math.ceil((remaining - 120) / totalC), Math.floor((remaining + 120) / totalC));
    k = remaining - totalC * xVal;
    if (k === 0) continue;
    ang2Val = c1 * xVal; ang3Val = c2 * xVal + k;
    if (ang2Val < 15 || ang3Val < 15) continue;
    found = true;
  }
  if (!found) { c1 = 1; c2 = 1; fixedAngle = 60; xVal = 145; k = 10; ang2Val = 145; ang3Val = 155; }
  const kStr = k >= 0 ? `+ ${k}` : `\u2212 ${Math.abs(k)}`;
  const r1 = startDeg + fixedAngle, r2 = startDeg + fixedAngle + ang2Val;
  return { tool: "aroundPoint", level: "level3", rotationDeg: 0, segments: [{ angleDeg: startDeg }, { angleDeg: r1 }, { angleDeg: r2 }], angles: [{ label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: startDeg, arcToDeg: r1, bisectorDeg: startDeg + fixedAngle / 2 }, { label: exprLabel(c1, 0), isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: startDeg + fixedAngle + ang2Val / 2 }, { label: exprLabel(c2, k), isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: startDeg + 360, bisectorDeg: startDeg + fixedAngle + ang2Val + ang3Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${fixedAngle}° + ${exprLabel(c1, 0)} + ${exprLabel(c2, k)} = 360°` }, { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 360°` }, { text: `${c1 + c2}x = ${360 - fixedAngle - k}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

// ─── QUESTION GENERATION ──────────────────────────────────────────────────────
function generateQuestion(tool: string, level: string, vars: QOVars): AngleQuestion {
  let q: AngleQuestion;
  if (tool === "mixed") {
    const active: string[] = [];
    if (vars.rightAngle !== false) active.push("rightAngle");
    if (vars.straightLine !== false) active.push("straightLine");
    if (vars.aroundPoint !== false) active.push("aroundPoint");
    const pool = active.length > 0 ? active : ["rightAngle", "straightLine", "aroundPoint"];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    q = generateQuestion(picked, level, vars);
    q.difficulty = level; q.key = `mixed-${level}-${q.id}`; return q;
  }
  if (tool === "straightLine") { if (level === "level1") q = buildStraightLevel1(vars); else if (level === "level2") q = buildStraightLevel2(vars); else q = buildStraightLevel3(vars); }
  else if (tool === "rightAngle") { if (level === "level1") q = buildRightLevel1(vars); else if (level === "level2") q = buildRightLevel2(vars); else q = buildRightLevel3(vars); }
  else { if (level === "level1") q = buildAroundLevel1(vars); else if (level === "level2") q = buildAroundLevel2(vars); else q = buildAroundLevel3(vars); }
  q.difficulty = level; q.key = `${tool}-${level}-${q.id}`; return q;
}

function buildVarsFromUI(tool: string, level: string, toolDropdowns: Record<string, string>, toolVariables: Record<string, Record<string, Record<string, boolean>>>, toolMultiSelect: Record<string, Record<string, boolean>>): QOVars {
  const t = TOOL_CONFIG.tools[tool as ToolKey];
  const ds = t.difficultySettings[level as DifficultyLevel];
  const ddCfg = ds.dropdown;
  const vars: QOVars = { ...(toolVariables[tool]?.[level] ?? {}) };
  if (ds.multiSelect) ds.multiSelect.options.forEach(o => { vars[o.value] = toolMultiSelect[tool]?.[`${level}__${o.value}`] ?? o.defaultActive; });
  if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { vars[o.value] = toolMultiSelect[tool]?.[`${level}__ms2__${o.value}`] ?? o.defaultActive; });
  if (ddCfg) vars[ddCfg.key] = toolDropdowns[`${tool}__${level}`] ?? ddCfg.defaultValue;
  return vars;
}

function getUniqueQuestion(tool: string, level: string, vars: QOVars, used: Set<string>): AngleQuestion {
  let q: AngleQuestion, attempts = 0;
  do { q = generateQuestion(tool, level, vars); } while (used.has(q.key ?? "") && ++attempts < 100);
  used.add(q.key ?? "");
  q._qo = JSON.parse(JSON.stringify(vars));
  q._tool = tool;
  return q;
}

// ─── SVG HELPERS ──────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
function toRad(d: number): number { return d * DEG; }
function pt(cx: number, cy: number, r: number, deg: number): [number, number] { return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))]; }
function sectorPath(cx: number, cy: number, r: number, f: number, t: number): string {
  let sweep = t - f; while (sweep < 0) sweep += 360; while (sweep > 360) sweep -= 360;
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sweep);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2},${y2} Z`;
}
function arcPath(cx: number, cy: number, r: number, f: number, t: number): string {
  let sweep = t - f; while (sweep < 0) sweep += 360; while (sweep > 360) sweep -= 360;
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, f + sweep);
  return `M${x1},${y1} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2},${y2}`;
}
function estTW(label: string, fs: number): number { return label.length * fs * 0.68 + fs * 0.6; }

function outwardBisectorDir(fromDeg: number, toDeg: number): [number, number] {
  let sweep = toDeg - fromDeg; while (sweep < 0) sweep += 360; while (sweep > 360) sweep -= 360;
  const midDeg = fromDeg + sweep / 2;
  return [Math.cos(toRad(midDeg)), Math.sin(toRad(midDeg))];
}
function leaderLayout(vx: number, vy: number, arcR: number, leaderLen: number, fromDeg: number, toDeg: number) {
  const [bx, by] = outwardBisectorDir(fromDeg, toDeg);
  return { tipX: vx + bx * arcR, tipY: vy + by * arcR, labelX: vx + bx * (arcR + leaderLen), labelY: vy + by * (arcR + leaderLen) };
}

interface LeaderLabelProps { tipX: number; tipY: number; labelX: number; labelY: number; label: string; fontSize: number; isUnknown: boolean; showAnswer: boolean; value: number; small: boolean; }
function LeaderLabel({ tipX, tipY, labelX, labelY, label, fontSize, isUnknown, showAnswer, value, small }: LeaderLabelProps) {
  const displayLabel = isUnknown && !showAnswer ? label : isUnknown ? `${value}°` : label;
  const tw = estTW(displayLabel, fontSize), th = fontSize * 1.4;
  const colour = isUnknown ? "#2563eb" : "#6b7280";
  const dx = tipX - labelX, dy = tipY - labelY, dlen = Math.sqrt(dx * dx + dy * dy);
  const ux = dlen > 0.001 ? dx / dlen : 0, uy = dlen > 0.001 ? dy / dlen : 0;
  const tEdge = dlen > 0.001 ? Math.min(Math.abs((tw / 2 + 4) / (ux || 0.0001)), Math.abs((th / 2 + 2) / (uy || 0.0001))) : 0;
  const lsx = labelX + ux * (tEdge + 2), lsy = labelY + uy * (tEdge + 2);
  const arrSz = small ? 4 : 6, px = -uy, py = ux;
  const arrBaseX = tipX - ux * arrSz, arrBaseY = tipY - uy * arrSz;
  return (
    <g>
      <line x1={lsx} y1={lsy} x2={arrBaseX} y2={arrBaseY} stroke={colour} strokeWidth={small ? 0.8 : 1.2} strokeDasharray={small ? "3 2" : "4 3"} strokeLinecap="round" />
      <polygon points={`${tipX},${tipY} ${arrBaseX + px * arrSz * 0.4},${arrBaseY + py * arrSz * 0.4} ${arrBaseX - px * arrSz * 0.4},${arrBaseY - py * arrSz * 0.4}`} fill={colour} />
      <rect x={labelX - tw / 2 - 4} y={labelY - th / 2 - 2} width={tw + 8} height={th + 4} rx={3} fill="white" fillOpacity="0.97" stroke={isUnknown ? "#93c5fd" : "#d1d5db"} strokeWidth={0.6} />
      <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontStyle={isUnknown && !showAnswer ? "italic" : "normal"} fontWeight={isUnknown ? "bold" : "600"} fill={isUnknown ? "#1d4ed8" : "#111827"}>{displayLabel}</text>
    </g>
  );
}

// ─── SVG DIAGRAM ──────────────────────────────────────────────────────────────
interface DiagramProps { q: AngleQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number; }
function AngleDiagram({ q, showAnswer, small = false, dataIndex }: DiagramProps) {
  const size = small ? 300 : 340;
  const targetFontPx = small ? 17 : 28;
  const ARC_SM = size * (small ? 0.20 : 0.22);
  const ARC_MD = size * (small ? 0.225 : 0.245);
  const ARC_LG = size * (small ? 0.25 : 0.27);
  const arcRFor = (deg: number) => deg <= 30 ? ARC_SM : deg <= 60 ? ARC_MD : ARC_LG;
  const LEADER_LEN = small ? 42 : 64;
  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};

  if (q.tool === "rightAngle") {
    const inset = small ? 22 : 48, armLen = size - inset - (small ? 8 : 16);
    const rot = q.rotationDeg;
    const corners: [number, number][] = [[inset, size - inset], [size - inset, size - inset], [size - inset, inset], [inset, inset]];
    const [vx, vy] = corners[rot];
    const sectorStart = q.segments[0].angleDeg, sectorEnd = q.segments[q.segments.length - 1].angleDeg;
    const [b1x, b1y] = pt(vx, vy, armLen, sectorStart), [b2x, b2y] = pt(vx, vy, armLen, sectorEnd);
    const interiorSegs = q.segments.slice(1, -1);
    const sqSz = size * 0.085;
    const s1rad = toRad(sectorStart), s2rad = toRad(sectorEnd);
    const sqP1 = [vx + Math.cos(s1rad) * sqSz, vy + Math.sin(s1rad) * sqSz];
    const sqP2 = [vx + Math.cos(s1rad) * sqSz + Math.cos(s2rad) * sqSz, vy + Math.sin(s1rad) * sqSz + Math.sin(s2rad) * sqSz];
    const sqP3 = [vx + Math.cos(s2rad) * sqSz, vy + Math.sin(s2rad) * sqSz];
    const geomPts: number[][] = [[vx, vy], [b1x, b1y], [b2x, b2y]];
    interiorSegs.forEach(seg => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); geomPts.push([px2, py2]); });
    q.angles.forEach(ang => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); geomPts.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
    const pad = small ? 14 : 22;
    const bMinX = Math.min(...geomPts.map(p => p[0])) - pad, bMinY = Math.min(...geomPts.map(p => p[1])) - pad;
    const bMaxX = Math.max(...geomPts.map(p => p[0])) + pad, bMaxY = Math.max(...geomPts.map(p => p[1])) + pad;
    const bDim = Math.max(bMaxX - bMinX, bMaxY - bMinY);
    const bCx = (bMinX + bMaxX) / 2, bCy = (bMinY + bMaxY) / 2;
    const fontSize = targetFontPx * bDim / (small ? 266 : 460);
    return (
      <svg width="100%" height="100%" viewBox={`${bCx - bDim / 2} ${bCy - bDim / 2} ${bDim} ${bDim}`} style={{ overflow: "visible" }} {...extraProps}>
        {q.angles.map((ang, i) => ang.isUnknown ? <path key={`sh${i}`} d={sectorPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" /> : null)}
        <line x1={vx} y1={vy} x2={b1x} y2={b1y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={b2x} y2={b2y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />
        {interiorSegs.map((seg, i) => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); return <line key={`ray${i}`} x1={vx} y1={vy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}
        {q.showSquare !== false && <polyline points={`${sqP1[0]},${sqP1[1]} ${sqP2[0]},${sqP2[1]} ${sqP3[0]},${sqP3[1]}`} fill="none" stroke="#1e293b" strokeWidth={small ? 1.5 : 2.5} strokeLinejoin="miter" />}
        {q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(vx, vy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}
        {q.angles.map((ang, i) => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fontSize} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}
        <circle cx={vx} cy={vy} r={small ? 3 : 4} fill="#1e293b" />
      </svg>
    );
  }

  const margin = small ? 18 : 60, vbSize = size + margin * 2;
  const cx = vbSize / 2, cy = vbSize / 2, lineLen = size * 0.62;
  const ctrPts: number[][] = [[cx, cy]];
  q.segments.forEach(seg => { const [px2, py2] = pt(cx, cy, lineLen, seg.angleDeg); ctrPts.push([px2, py2]); });
  q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); ctrPts.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
  const cPad = small ? 10 : 18;
  const cMinX = Math.min(...ctrPts.map(p => p[0])) - cPad, cMinY = Math.min(...ctrPts.map(p => p[1])) - cPad;
  const cMaxX = Math.max(...ctrPts.map(p => p[0])) + cPad, cMaxY = Math.max(...ctrPts.map(p => p[1])) + cPad;
  const cDim = Math.max(cMaxX - cMinX, cMaxY - cMinY);
  const cCx = (cMinX + cMaxX) / 2, cCy = (cMinY + cMaxY) / 2;
  const fontSize = targetFontPx * cDim / (small ? 266 : 460);
  return (
    <svg width="100%" height="100%" viewBox={`${cCx - cDim / 2} ${cCy - cDim / 2} ${cDim} ${cDim}`} style={{ overflow: "visible" }} {...extraProps}>
      {q.tool === "aroundPoint" && <circle cx={cx} cy={cy} r={lineLen} fill="none" stroke="#e5e7eb" strokeWidth={small ? 1 : 1.5} strokeDasharray="4 4" />}
      {q.angles.map((ang, i) => !ang.isUnknown ? null : <path key={`sh${i}`} d={sectorPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.6" stroke="none" />)}
      {q.segments.map((seg, i) => { const [px2, py2] = pt(cx, cy, lineLen, seg.angleDeg); return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />; })}
      {q.angles.map((ang, i) => <path key={`arc${i}`} d={arcPath(cx, cy, arcRFor(ang.value), ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />)}
      {q.angles.map((ang, i) => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); return <LeaderLabel key={`lbl${i}`} {...ll} label={ang.label} fontSize={fontSize} isUnknown={ang.isUnknown} showAnswer={showAnswer} value={ang.value} small={small} />; })}
      <circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" />
    </svg>
  );
}

// ─── PRINT ────────────────────────────────────────────────────────────────────
const PRINT_COLS = 3, PRINT_ROWS = 5, PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;
function handlePrint(worksheet: AngleQuestion[], isDiff: boolean, toolName: string, worksheetContainerRef: React.RefObject<HTMLDivElement>) {
  const container = worksheetContainerRef.current; if (!container) return;
  const svgEls = container.querySelectorAll<SVGSVGElement>("svg[data-q-index]");
  const svgStrings: string[] = [];
  svgEls.forEach(el => { const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10); const clone = el.cloneNode(true) as SVGSVGElement; clone.setAttribute("width", "100%"); clone.setAttribute("height", "100%"); svgStrings[idx] = clone.outerHTML; });
  const now = new Date(), dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const buildStandardPages = (showAnswers: boolean) => {
    const pages: string[] = [];
    for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) {
      const slice = worksheet.slice(p, p + PRINT_PER_PAGE);
      const pageNum = Math.floor(p / PRINT_PER_PAGE) + 1, totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, li) => { const gi = p + li; return `<div class="cell"><div class="cell-num">${gi + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`; }).join("");
      pages.push(`<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">Worksheet &nbsp;·&nbsp; ${dateStr} &nbsp;·&nbsp; ${worksheet.length} questions${totalPages > 1 ? ` · Page ${pageNum} of ${totalPages}` : ""}</div></div><div class="standard-grid">${cells}</div></div>`);
    }
    return pages.join("");
  };
  const buildDiffPages = (showAnswers: boolean) => {
    const byLevel: Record<string, AngleQuestion[]> = { level1: worksheet.filter(q => q.level === "level1"), level2: worksheet.filter(q => q.level === "level2"), level3: worksheet.filter(q => q.level === "level3") };
    const offsetByLevel: Record<string, number> = { level1: 0, level2: byLevel.level1.length, level3: byLevel.level1.length + byLevel.level2.length };
    const lvNames: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
    const lvColors: Record<string, string> = { level1: "#166534", level2: "#854d0e", level3: "#991b1b" };
    const lvBg: Record<string, string> = { level1: "#dcfce7", level2: "#fef9c3", level3: "#fee2e2" };
    const totalPages = Math.ceil(Math.max(...Object.values(byLevel).map(a => a.length)) / PRINT_ROWS);
    return Array.from({ length: totalPages }, (_, p) => {
      const cols = ["level1", "level2", "level3"].map(lv => {
        const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const cells = qs.map((q, li) => { const gi = offsetByLevel[lv] + p * PRINT_ROWS + li; return `<div class="cell"><div class="cell-num">${p * PRINT_ROWS + li + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`; }).join("");
        return `<div class="diff-col"><div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div><div class="diff-cells">${cells}</div></div>`;
      }).join("");
      return `<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">Differentiated &nbsp;·&nbsp; ${dateStr}${totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : ""}</div></div><div class="diff-grid">${cols}</div></div>`;
    }).join("");
  };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName}</title>
<style>* { margin:0; padding:0; box-sizing:border-box; } @page { size:A4 portrait; margin:12mm; } body { font-family:"Segoe UI",Arial,sans-serif; } @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } } .page { width:186mm; height:273mm; display:flex; flex-direction:column; page-break-after:always; overflow:hidden; } .page:last-child { page-break-after:auto; } .page-header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2mm; flex-shrink:0; } .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; } .page-header .meta { font-size:3mm; color:#6b7280; } .standard-grid { display:grid; grid-template-columns:repeat(${PRINT_COLS},1fr); grid-template-rows:repeat(${PRINT_ROWS},1fr); gap:2mm; flex:1; min-height:0; } .diff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; flex:1; min-height:0; } .diff-col { display:flex; flex-direction:column; gap:2mm; min-height:0; } .diff-col-header { text-align:center; font-size:3.5mm; font-weight:700; padding:1.5mm 0; border-radius:1.5mm; flex-shrink:0; } .diff-cells { display:flex; flex-direction:column; gap:2mm; flex:1; min-height:0; } .cell { border:0.3mm solid #d1d5db; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; overflow:hidden; flex:1; min-height:0; position:relative; } .cell-num { position:absolute; top:1.5mm; left:2mm; font-size:2.8mm; font-weight:700; color:#374151; } .cell-diagram { width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:hidden; } .cell-diagram svg { width:100%; height:100%; overflow:visible; } .answer { font-size:3mm; font-weight:700; color:#059669; text-align:center; flex-shrink:0; margin-top:1mm; }</style></head><body>
${isDiff ? buildDiffPages(false) + buildDiffPages(true) : buildStandardPages(false) + buildStandardPages(true)}
</body></html>`;
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

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <span style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)", display: "inline-block" }}>▾</span>
  </button>
);

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {[["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]].map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)} className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
    ))}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: { dropdown: DropdownCfg; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{opt.label}</button>)}
    </div>
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
  const activeCount = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = !allowAllOff && isActive && activeCount === 1;
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

interface QOPopoverProps { tool: ToolKey; level: DifficultyLevel; toolDropdowns: Record<string, string>; setToolDropdown: (t: string, l: string, v: string) => void; toolVariables: Record<string, Record<string, Record<string, boolean>>>; setToolVariable: (t: string, l: string, k: string, v: boolean) => void; toolMultiSelect: Record<string, Record<string, boolean>>; setToolMultiSelect: (t: string, l: string, k: string, v: boolean) => void; }

const StandardQOPopover = ({ tool, level, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }: QOPopoverProps) => {
  const { open, setOpen, ref } = usePopover();
  const t = TOOL_CONFIG.tools[tool], ds = t.difficultySettings[level];
  const dd = ds.dropdown, vars = ds.variables, ms = ds.multiSelect, ms2 = ds.multiSelect2;
  const ddVal = dd ? (toolDropdowns[`${tool}__${level}`] ?? dd.defaultValue) : "";
  const varVals = toolVariables[tool]?.[level] ?? {};
  const msVals: Record<string, boolean> = {}; if (ms) ms.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${level}__${o.value}`] ?? o.defaultActive; });
  const ms2Vals: Record<string, boolean> = {}; if (ms2) ms2.options.forEach(o => { ms2Vals[o.value] = toolMultiSelect[tool]?.[`${level}__ms2__${o.value}`] ?? o.defaultActive; });
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-5">
          {ms2 && <MultiSelectSection multiSelect={ms2} values={ms2Vals} onChange={(k, v) => setToolMultiSelect(tool, level, `ms2__${k}`, v)} />}
          {dd && <DropdownSection dropdown={dd} value={ddVal} onChange={v => setToolDropdown(tool, level, v)} />}
          {ms && <MultiSelectSection multiSelect={ms} values={msVals} onChange={(k, v) => setToolMultiSelect(tool, level, k, v)} allowAllOff={ms.key === "exprType"} />}
          {vars.length > 0 && <VariablesSection variables={vars} values={varVals} onChange={(k, v) => setToolVariable(tool, level, k, v)} />}
        </div>
      )}
    </div>
  );
};

interface DiffQOPopoverProps { tool: ToolKey; toolDropdowns: Record<string, string>; setToolDropdown: (t: string, l: string, v: string) => void; toolVariables: Record<string, Record<string, Record<string, boolean>>>; setToolVariable: (t: string, l: string, k: string, v: boolean) => void; toolMultiSelect: Record<string, Record<string, boolean>>; setToolMultiSelect: (t: string, l: string, k: string, v: boolean) => void; }

const DiffQOPopover = ({ tool, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }: DiffQOPopoverProps) => {
  const { open, setOpen, ref } = usePopover();
  const t = TOOL_CONFIG.tools[tool];
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-5">
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map(lv => {
            const ds = t.difficultySettings[lv], dd = ds.dropdown, vars = ds.variables, ms = ds.multiSelect, ms2 = ds.multiSelect2;
            const ddVal = dd ? (toolDropdowns[`${tool}__${lv}`] ?? dd.defaultValue) : "";
            const varVals = toolVariables[tool]?.[lv] ?? {};
            const msVals: Record<string, boolean> = {}; if (ms) ms.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${lv}__${o.value}`] ?? o.defaultActive; });
            const ms2Vals: Record<string, boolean> = {}; if (ms2) ms2.options.forEach(o => { ms2Vals[o.value] = toolMultiSelect[tool]?.[`${lv}__ms2__${o.value}`] ?? o.defaultActive; });
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {ms2 && <MultiSelectSection multiSelect={ms2} values={ms2Vals} onChange={(k, v) => setToolMultiSelect(tool, lv, `ms2__${k}`, v)} />}
                  {dd && <DropdownSection dropdown={dd} value={ddVal} onChange={v => setToolDropdown(tool, lv, v)} />}
                  {ms && <MultiSelectSection multiSelect={ms} values={msVals} onChange={(k, v) => setToolMultiSelect(tool, lv, k, v)} allowAllOff={ms.key === "exprType"} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={varVals} onChange={(k, v) => setToolVariable(tool, lv, k, v)} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InlineQOPanel = ({ tool, level, variables, onVariableChange, dropdownValue, onDropdownChange, multiSelectValues, onMultiSelectChange, multiSelectValues2, onMultiSelectChange2 }: { tool: ToolKey; level: DifficultyLevel; variables: Record<string, boolean>; onVariableChange: (k: string, v: boolean) => void; dropdownValue: string; onDropdownChange: (v: string) => void; multiSelectValues: Record<string, boolean>; onMultiSelectChange: (k: string, v: boolean) => void; multiSelectValues2?: Record<string, boolean>; onMultiSelectChange2?: (k: string, v: boolean) => void; }) => {
  const ds = TOOL_CONFIG.tools[tool].difficultySettings[level];
  return (
    <div className="flex flex-col gap-4">
      {ds.multiSelect2 && <MultiSelectSection multiSelect={ds.multiSelect2} values={multiSelectValues2 ?? {}} onChange={onMultiSelectChange2 ?? (() => undefined)} />}
      {ds.dropdown && <DropdownSection dropdown={ds.dropdown} value={dropdownValue} onChange={onDropdownChange} />}
      {ds.multiSelect && <MultiSelectSection multiSelect={ds.multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} allowAllOff={ds.multiSelect.key === "exprType"} />}
      {ds.variables.length > 0 && <VariablesSection variables={ds.variables} values={variables} onChange={onVariableChange} />}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">{s.content.map(item => <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3"><span className="font-bold text-gray-800 text-sm">{item.label}</span><p className="text-sm text-gray-500 mt-0.5">{item.detail}</p></div>)}</div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0"><button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm">Close</button></div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: { colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <div className="flex items-center gap-2"><span>Colour Scheme</span></div>
          <span className="text-xs text-gray-400 capitalize">{colorScheme}</span>
        </button>
        {colorOpen && <div className="border-t border-gray-100">{["default", "blue", "pink", "yellow"].map(s => (<button key={s} onClick={() => { setColorScheme(s); onClose(); }} className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{s}</button>))}</div>}
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
  const worksheetContainerRef = useRef<HTMLDivElement>(null);
  const [currentTool, setCurrentTool] = useState<ToolKey>("rightAngle");
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  const initDropdowns = (): Record<string, string> => {
    const init: Record<string, string> = {};
    toolKeys.forEach(k => { (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { const dd = TOOL_CONFIG.tools[k].difficultySettings[lv].dropdown; if (dd) init[`${k}__${lv}`] = dd.defaultValue; }); });
    return init;
  };
  const initVariables = (): Record<string, Record<string, Record<string, boolean>>> => {
    const init: Record<string, Record<string, Record<string, boolean>>> = {};
    toolKeys.forEach(k => { init[k] = {}; (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { init[k][lv] = {}; TOOL_CONFIG.tools[k].difficultySettings[lv].variables.forEach(v => { init[k][lv][v.key] = v.defaultValue; }); }); });
    return init;
  };
  const initMultiSelect = (): Record<string, Record<string, boolean>> => {
    const init: Record<string, Record<string, boolean>> = {};
    toolKeys.forEach(k => { init[k] = {}; (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { const ms = TOOL_CONFIG.tools[k].difficultySettings[lv].multiSelect; if (ms) ms.options.forEach(o => { init[k][`${lv}__${o.value}`] = o.defaultActive; }); const ms2 = TOOL_CONFIG.tools[k].difficultySettings[lv].multiSelect2; if (ms2) ms2.options.forEach(o => { init[k][`${lv}__ms2__${o.value}`] = o.defaultActive; }); }); });
    return init;
  };

  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(initDropdowns);
  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, Record<string, boolean>>>>(initVariables);
  const [toolMultiSelect, setToolMultiSelect] = useState<Record<string, Record<string, boolean>>>(initMultiSelect);

  const setToolDropdown = (tool: string, level: string, val: string) => setToolDropdowns(p => ({ ...p, [`${tool}__${level}`]: val }));
  const setToolVariable = (tool: string, level: string, key: string, val: boolean) => setToolVariables(p => ({ ...p, [tool]: { ...p[tool], [level]: { ...(p[tool]?.[level] ?? {}), [key]: val } } }));
  const setToolMultiSelectVal = (tool: string, level: string, key: string, val: boolean) => setToolMultiSelect(p => ({ ...p, [tool]: { ...(p[tool] ?? {}), [`${level}__${key}`]: val } }));
  const buildVars = (tool: string, level: string): QOVars => buildVarsFromUI(tool, level, toolDropdowns, toolVariables, toolMultiSelect);

  const [currentQuestion, setCurrentQuestion] = useState<AngleQuestion>(() => generateQuestion("rightAngle", "level1", buildVarsFromUI("rightAngle", "level1", initDropdowns(), initVariables(), initMultiSelect())));
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(9);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AngleQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [worksheetMode, setWorksheetMode] = useState<"standard" | "advanced">("standard");
  const [displayFontSize] = useState(2);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];

  interface AdvGroup { id: number; level: DifficultyLevel; count: number; variables: Record<string, boolean>; dropdownValue: string; multiSelectValues: Record<string, boolean>; multiSelectValues2: Record<string, boolean>; }
  const makeDefaultAdvGroup = (id: number, lv: DifficultyLevel = "level1", tool: ToolKey | null = null): AdvGroup => {
    const t = tool ?? currentTool;
    const ds = TOOL_CONFIG.tools[t].difficultySettings[lv];
    const variables: Record<string, boolean> = {}; ds.variables.forEach(v => { variables[v.key] = v.defaultValue; });
    const multiSelectValues: Record<string, boolean> = {}; if (ds.multiSelect) ds.multiSelect.options.forEach(o => { multiSelectValues[o.value] = o.defaultActive; });
    const multiSelectValues2: Record<string, boolean> = {}; if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { multiSelectValues2[o.value] = o.defaultActive; });
    return { id, level: lv, count: 5, variables, dropdownValue: ds.dropdown?.defaultValue ?? "", multiSelectValues, multiSelectValues2 };
  };
  const [advGroups, setAdvGroups] = useState<AdvGroup[]>(() => [makeDefaultAdvGroup(1)]);
  const [advSelectedId, setAdvSelectedId] = useState(1);
  const advNextId = useRef(2);
  const [advShuffle, setAdvShuffle] = useState(false);
  const totalAdvQuestions = advGroups.reduce((s, g) => s + g.count, 0);

  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [presenterMode, setPresenterMode] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let targetId = deviceId;
      if (!targetId) { const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); tmp.getTracks().forEach(t => t.stop()); const all = await navigator.mediaDevices.enumerateDevices(); const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !/facetime|built.?in|integrated|internal|front|rear/i.test(d.label)); if (ext) targetId = ext.deviceId; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetId ? { deviceId: { exact: targetId } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e) { setCamError(e instanceof Error ? e.message : "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => { if (!camDropdownOpen) return; const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [camDropdownOpen]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);

  const qBg = getQuestionBg(colorScheme), stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg = isDefaultScheme ? "#ffffff" : stepBg, fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg, fsWorkingBg = isDefaultScheme ? "#f5f3f0" : qBg;

  const handleNewQuestion = () => { setCurrentQuestion(generateQuestion(currentTool, difficulty, buildVars(currentTool, difficulty))); setShowWhiteboardAnswer(false); setShowAnswer(false); };

  const handleGenerateWorksheet = () => {
    const used = new Set<string>(); const qs: AngleQuestion[] = [];
    if (isDifferentiated) { (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { const vars = buildVars(currentTool, lv); for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, lv, vars, used)); }); }
    else { const vars = buildVars(currentTool, difficulty); for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, difficulty, vars, used)); }
    setWorksheet(qs); setShowWorksheetAnswers(false);
  };

  const regenQuestion = (idx: number) => {
    const q = worksheet[idx]; if (!q._qo) return;
    const tool = (q._tool ?? currentTool) as ToolKey;
    const level = (q.difficulty ?? q.level) as DifficultyLevel;
    const vars = q._qo as QOVars;
    const existing = new Set(worksheet.map(w => w.key ?? ""));
    existing.delete(q.key ?? "");
    let replacement: AngleQuestion | null = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = generateQuestion(tool, level, vars);
      if (!existing.has(candidate.key ?? "")) { candidate._qo = JSON.parse(JSON.stringify(vars)); candidate._tool = tool; replacement = candidate; break; }
    }
    if (replacement) setWorksheet(prev => prev.map((w, i) => i === idx ? replacement! : w));
  };

  const handleGenerateAdvanced = () => {
    const used = new Set<string>(); const qs: AngleQuestion[] = [];
    advGroups.forEach(g => {
      const ds = TOOL_CONFIG.tools[currentTool].difficultySettings[g.level];
      const vars: QOVars = { ...g.variables, ...g.multiSelectValues, ...g.multiSelectValues2 };
      if (ds.dropdown) vars[ds.dropdown.key] = g.dropdownValue;
      for (let i = 0; i < g.count; i++) qs.push(getUniqueQuestion(currentTool, g.level, vars, used));
    });
    if (advShuffle) { for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; } }
    setWorksheet(qs); setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, currentTool]);
  useEffect(() => {
    if (mode !== "worksheet" || worksheetMode !== "advanced") return;
    const handler = (e: KeyboardEvent) => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; const idx = advGroups.findIndex(g => g.id === advSelectedId); if (idx === -1) return; const next = e.key === "ArrowLeft" ? idx - 1 : idx + 1; if (next >= 0 && next < advGroups.length) { setAdvSelectedId(advGroups[next].id); e.preventDefault(); } };
    document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler);
  }, [mode, worksheetMode, advGroups, advSelectedId]);

  const CELL_H = 280;
  const stdQOProps: QOPopoverProps = { tool: currentTool, level: difficulty, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect: setToolMultiSelectVal };
  const diffQOProps: DiffQOPopoverProps = { tool: currentTool, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect: setToolMultiSelectVal };

  const renderQCell = (q: AngleQuestion, idx: number, bgOverride?: string) => {
    const hintH = 28, diagramH = q.tool === "rightAngle" ? CELL_H - hintH : CELL_H;
    return (
      <div className="rounded-xl group" style={{ backgroundColor: bgOverride ?? stepBg, border: "1px solid #e5e7eb", overflow: "hidden", position: "relative" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000", zIndex: 5 }}>{idx + 1})</span>
        {q._qo && <button onClick={() => regenQuestion(idx)} title="Regenerate" className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100" style={{ zIndex: 10 }}><RefreshCw size={12} /></button>}
        <div style={{ height: diagramH, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
          <div style={{ width: "95%", height: "95%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AngleDiagram q={q} showAnswer={showWorksheetAnswers} small dataIndex={idx} />
          </div>
        </div>
        {showWorksheetAnswers && <div className="text-base font-bold text-center pb-2" style={{ color: "#059669" }}>{q.answer}</div>}
        {q.tool === "rightAngle" && <div className="text-xs text-center pb-2 text-gray-500 italic">The diagram depicts a right angle</div>}
      </div>
    );
  };

  const renderAdvancedWorksheet = () => {
    const lvColor = (lv: DifficultyLevel) => lv === "level1" ? "bg-green-600" : lv === "level2" ? "bg-yellow-500" : "bg-red-600";
    const lvBorder = (lv: DifficultyLevel) => lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";
    const updateGroup = (id: number, patch: Partial<AdvGroup>) => setAdvGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
    const selectedGroup = advGroups.find(g => g.id === advSelectedId) ?? advGroups[0];
    return (
      <div className="flex gap-3" style={{ minHeight: 300 }}>
        <div className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden" style={{ width: "50%", flexShrink: 0, backgroundColor: "#fff" }}>
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {advGroups.map((g, idx) => {
              const isSel = g.id === advSelectedId;
              return (
                <div key={g.id} onClick={() => setAdvSelectedId(g.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" style={{ borderLeft: `3px solid ${isSel ? lvBorder(g.level) : "transparent"}`, backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{idx + 1}</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => <button key={lv} onClick={() => { updateGroup(g.id, { ...makeDefaultAdvGroup(g.id, lv), id: g.id }); setAdvSelectedId(g.id); }} className={`px-2.5 py-1 font-bold text-xs ${g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>L{li + 1}</button>)}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => updateGroup(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 font-bold text-base leading-none">−</button>
                    <span className="w-6 text-center text-xs font-bold text-gray-800">{g.count}</span>
                    <button onClick={() => updateGroup(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 font-bold text-base leading-none">+</button>
                  </div>
                  {advGroups.length > 1 && <button onClick={e => { e.stopPropagation(); const rem = advGroups.filter((_, i) => i !== idx); setAdvGroups(rem); if (g.id === advSelectedId) setAdvSelectedId(rem[Math.max(0, idx - 1)].id); }} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 flex-shrink-0"><X size={12} /></button>}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-200">
            {advGroups.length < 10 ? <button onClick={() => { const id = advNextId.current++; setAdvGroups(g => [...g, makeDefaultAdvGroup(id)]); setAdvSelectedId(id); }} className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600">+ Add group</button> : <p className="text-center text-xs text-gray-400 py-1">Maximum 10 groups</p>}
          </div>
        </div>
        <div className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto" style={{ backgroundColor: "#fff" }}>
          {selectedGroup && (<><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Group {advGroups.indexOf(selectedGroup) + 1} · {LV_LABELS[selectedGroup.level]} · Options</p>
            <InlineQOPanel tool={currentTool} level={selectedGroup.level} variables={selectedGroup.variables} onVariableChange={(k, v) => updateGroup(selectedGroup.id, { variables: { ...selectedGroup.variables, [k]: v } })} dropdownValue={selectedGroup.dropdownValue} onDropdownChange={v => updateGroup(selectedGroup.id, { dropdownValue: v })} multiSelectValues={selectedGroup.multiSelectValues} onMultiSelectChange={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues: { ...selectedGroup.multiSelectValues, [k]: v } })} multiSelectValues2={selectedGroup.multiSelectValues2} onMultiSelectChange2={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues2: { ...selectedGroup.multiSelectValues2, [k]: v } })} /></>)}
        </div>
      </div>
    );
  };

  const renderControlBar = () => {
    if (mode === "worksheet") {
      const isAdv = worksheetMode === "advanced";
      return (
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-3 px-6 pt-4 pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setWorksheetMode(isAdv ? "standard" : "advanced")} className={`w-11 h-6 rounded-full transition-colors relative ${isAdv ? "bg-blue-900" : "bg-gray-300"}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAdv ? "translate-x-6" : "translate-x-1"}`} /></div>
              <span className="text-sm font-bold text-gray-500">Advanced</span>
            </label>
            {isAdv && <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><div onClick={() => setAdvShuffle(s => !s)} className={`w-9 h-5 rounded-full relative ${advShuffle ? "bg-blue-900" : "bg-gray-300"}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${advShuffle ? "translate-x-4" : "translate-x-0.5"}`} /></div><span className="text-sm font-semibold text-gray-500">Shuffle</span></label>
              <span className="text-sm font-bold text-gray-600">{totalAdvQuestions} questions total</span>
            </div>}
          </div>
          {!isAdv ? (
            <div className="p-6">
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">{[["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]].map(([val, label, col]) => <button key={val} onClick={() => { setDifficulty(val as DifficultyLevel); setIsDifferentiated(false); }} className={`px-5 py-2 font-bold text-base ${!isDifferentiated && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>)}</div>
                <button onClick={() => setIsDifferentiated(!isDifferentiated)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 ${isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
              </div>
              <div className="flex justify-center items-center gap-6 mb-4">
                {isDifferentiated ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Questions:</label><input type="number" min="1" max="24" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || 9)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns} onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3))); }} disabled={isDifferentiated} className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} /></div>
              </div>
              <div className="flex justify-center items-center gap-4">
                <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <><button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button><button onClick={() => handlePrint(worksheet, isDifferentiated, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button></>}
              </div>
            </div>
          ) : (
            <div className="p-6 pt-4">
              {renderAdvancedWorksheet()}
              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-2"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={numColumns} onChange={e => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <button onClick={handleGenerateAdvanced} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <><button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button><button onClick={() => handlePrint(worksheet, false, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button></>}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
        <StandardQOPopover {...stdQOProps} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );
    const questionPanel = (isFS: boolean) => (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, ...(isFS ? { width: `${splitPct}%`, height: "100%", backgroundColor: fsQuestionBg, padding: 32, boxSizing: "border-box", flexShrink: 0, overflowY: "auto" } : { width: "480px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 }) }}>
        {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</div>}
        <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AngleDiagram q={currentQuestion} showAnswer={showWhiteboardAnswer} />
        </div>
        {currentQuestion.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center pb-1">The diagram depicts a right angle</div>}
      </div>
    );
    const makeRightPanel = (isFS: boolean) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg) }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (<><video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />{camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}</>)}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }} onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }} onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="rgba(255,255,255,0.85)" /></button>
              {camDropdownOpen && (<div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                <div style={{ padding: "6px 14px", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Camera</div>
                {camDevices.map((d, i) => (<div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }} style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === currentCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />{d.label || `Camera ${i + 1}`}</div>))}
              </div>)}
            </div>
          ) : (<button onClick={() => setPresenterMode(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="#6b7280" /></button>)}
          <button onClick={() => setWbFullscreen(f => !f)} style={{ background: wbFullscreen ? "#374151" : "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color="#6b7280" />}</button>
        </div>
      </div>
    );
    if (wbFullscreen) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>
        {fsToolbar}
        <div ref={splitContainerRef} style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {questionPanel(true)}
          <div style={{ position: "relative", width: 2, backgroundColor: "#000", flexShrink: 0, cursor: "col-resize" }} onMouseDown={e => { e.preventDefault(); isDraggingRef.current = true; const onMove = (ev: MouseEvent) => { if (!isDraggingRef.current || !splitContainerRef.current) return; const rect = splitContainerRef.current.getBoundingClientRect(); let pct = ((ev.clientX - rect.left) / rect.width) * 100; setSplitPct(Math.min(75, Math.max(25, pct >= 38 && pct <= 42 ? 40 : pct))); }; const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }; document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp); }}><div style={{ position: "absolute", top: 0, bottom: 0, left: -5, width: 12, cursor: "col-resize" }} /></div>
          {makeRightPanel(true)}
        </div>
      </div>
    );
    return (<div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}><div className="flex gap-6" style={{ height: "100%" }}>{questionPanel(false)}{makeRightPanel(false)}</div></div>);
  };

  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
      <div className="p-8" style={{ backgroundColor: qBg }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4" style={{ width: 340, height: 340, margin: "0 auto" }}><AngleDiagram q={currentQuestion} showAnswer={showAnswer} /></div>
          {currentQuestion.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center mb-4">The diagram depicts a right angle</div>}
          {showAnswer && (<>
            <div className="space-y-4 mt-4">{currentQuestion.working.slice(0, -1).map((step, i) => (<div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}><h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4><p className={`${displayFontSizes[displayFontSize]} font-semibold`} style={{ color: "#000" }}>{step.text}</p></div>))}</div>
            <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}><span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</span></div>
          </>)}
        </div>
      </div>
    </div>
  );

  const renderWorksheet = () => {
    if (worksheet.length === 0) return <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}><span className="text-2xl text-gray-400">Generate worksheet</span></div>;
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if (isDifferentiated) return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv), c = LV_COLORS[lv];
            return (<div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}><h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3><div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>{lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, c.fill)}</div>)}</div></div>);
          })}
        </div>
      </div>
    );
    return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns}, 1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx)}</div>)}
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg">{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k => <button key={k} onClick={() => { setCurrentTool(k); setWorksheet([]); advNextId.current = 2; setAdvGroups([makeDefaultAdvGroup(1, "level1", k)]); setAdvSelectedId(1); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{TOOL_CONFIG.tools[k].name}</button>)}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]] as const).map(([m, label]) => <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{label}</button>)}
          </div>
          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (<div className="flex flex-col gap-6"><div className="rounded-xl shadow-lg">{renderControlBar()}</div><div className="rounded-xl shadow-lg overflow-hidden">{mode === "whiteboard" && renderWhiteboard()}{mode === "single" && renderWorkedExample()}</div></div>)}
        </div>
      </div>
    </>
  );
}
