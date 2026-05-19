import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_CONFIG = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle",
      difficultySettings: {
        level1: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level2: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level3: {
          dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" },
          variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
      },
    },
    straightLine: {
      name: "Straight Line",
      difficultySettings: {
        level1: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level2: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level3: {
          dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" },
          variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
      },
    },
    aroundPoint: {
      name: "Around a Point",
      difficultySettings: {
        level1: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level2: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
        level3: {
          dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" },
          variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
        },
      },
    },
    mixed: {
      name: "Mixed Practice",
      difficultySettings: {
        level1: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
          multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] },
        },
        level2: {
          dropdown: { key: "numberType", label: "Number Type", options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }], defaultValue: "integer" },
          variables: [{ key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
          multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] },
        },
        level3: {
          dropdown: { key: "parts", label: "Parts", options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }], defaultValue: "mixed" },
          variables: [{ key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false }, { key: "showSquare", label: "Show right angle square symbol", defaultValue: true }],
          multiSelect: { key: "exprType", label: "Unknown as expression", options: [{ value: "coefficient", label: "Coefficient|(e.g. 2x)", defaultActive: false }, { value: "constant", label: "Constant|(e.g. x+14)", defaultActive: false }, { value: "both", label: "Both|(e.g. 2x+30)", defaultActive: false }] },
          multiSelect2: { key: "angleType", label: "Angle Types", options: [{ value: "rightAngle", label: "90°", defaultActive: true }, { value: "straightLine", label: "180°", defaultActive: true }, { value: "aroundPoint", label: "360°", defaultActive: true }] },
        },
      },
    },
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
// QOSnapshot: exact vars used to generate a question — stored on every question
// so regen can reproduce like-for-like with different numbers.
// It stores the FULL resolved vars object (post-merge of dropdown + variables +
// multiSelect), not the raw UI state. That way regen never reads live state.
const LV_LABELS = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};
const INFO_SECTIONS = [
  { title: "Right Angle", icon: "⊾", content: [{ label: "Overview", detail: "Angles inside a right angle always sum to 90°." }, { label: "Level 1 — Green", detail: "One interior ray splitting the right angle. One given angle, find x." }, { label: "Level 2 — Yellow", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3 — Red", detail: "Algebraic angles summing to 90°." }] },
  { title: "Straight Line", icon: "📐", content: [{ label: "Overview", detail: "Angles on a straight line always sum to 180°." }, { label: "Level 1", detail: "One interior ray. One given angle, find x." }, { label: "Level 2", detail: "Two interior rays. Two given angles, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 180°." }] },
  { title: "Around a Point", icon: "🔵", content: [{ label: "Overview", detail: "Angles around a point always sum to 360°." }, { label: "Level 1", detail: "3 sectors. Two given, find x." }, { label: "Level 2", detail: "4 sectors. Three given, find x." }, { label: "Level 3", detail: "Algebraic angles summing to 360°." }] },
  { title: "Mixed", icon: "🔀", content: [{ label: "Overview", detail: "Combines 90°, 180° and 360° questions." }, { label: "Angle Types selector", detail: "Toggle which types are included." }] },
  { title: "Modes", icon: "🖥️", content: [{ label: "Whiteboard", detail: "Single question with working space." }, { label: "Worked Example", detail: "Step-by-step solution." }, { label: "Worksheet", detail: "Grid with PDF export." }] },
];

// ─── UTILITY ──────────────────────────────────────────────────────────────────
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a, b) { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }
function exprLabel(c, k) {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  const kAbs = Math.abs(k);
  return k > 0 ? `${base} + ${kAbs}` : `${base} \u2212 ${kAbs}`;
}
function r1dp(n) { return Math.round(n * 10) / 10; }
function r1dpStr(n) { return Number.isInteger(n) ? String(n) : String(r1dp(n)); }
function niceXVal(minVal, maxVal, useDecimal) {
  if (!useDecimal) return rnd(Math.ceil(minVal), Math.floor(maxVal));
  const pool = [];
  for (let n = Math.ceil(minVal * 10); n <= Math.floor(maxVal * 10); n++) pool.push(Math.round(n) / 10);
  for (let n = Math.ceil(minVal * 4); n <= Math.floor(maxVal * 4); n++) { const v = Math.round(n * 25) / 100; if (!pool.includes(v)) pool.push(v); }
  if (pool.length === 0) return rnd(Math.ceil(minVal), Math.floor(maxVal));
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickExprType(vars) {
  const active = [];
  if (vars.coefficient) active.push("coefficient");
  if (vars.constant) active.push("constant");
  if (vars.both) active.push("both");
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}
function getQuestionBg(cs) { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff"); }
function getStepBg(cs) { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6"); }

// ─── STRAIGHT LINE ────────────────────────────────────────────────────────────
function buildStraightLevel1(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;
  if (useXExpr) {
    let known = 0, k = 0, c = 1, xVal = 0, attempts = 0;
    do {
      known = rnd(20, 140);
      const remainder = 180 - known;
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      if (exprType === "coefficient") { k = 0; const xMin = 5 / c, xMax = (remainder - 1) / c; if (xMax < xMin) { attempts++; continue; } xVal = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor(remainder * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 5 / c, xMax = (remainder - k) / c; if (xMax < xMin) { attempts++; continue; } xVal = niceXVal(xMin, xMax, useDecimal); }
      if (xVal <= 0 || c * xVal + k < 5) { attempts++; continue; }
      const actualAngleExpr = Math.round((c * xVal + k) * 10) / 10;
      known = Math.round((180 - actualAngleExpr) * 10) / 10;
      if (known < 5 || known > 170) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { known = 90; k = 0; c = 1; xVal = 90; }
    const leftIsKnown = rnd(0, 1) === 0;
    const leftAngle = leftIsKnown ? known : c * xVal + k;
    const rayDeg = lineLeftDeg + leftAngle;
    const xLabel = exprLabel(c, k);
    return { tool: "straightLine", level: "level1", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }], angles: [{ label: leftIsKnown ? `${known}°` : xLabel, isUnknown: !leftIsKnown, value: leftAngle, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + leftAngle / 2 }, { label: leftIsKnown ? xLabel : `${known}°`, isUnknown: leftIsKnown, value: 180 - leftAngle, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + leftAngle + (180 - leftAngle) / 2 }], answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${known}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${r1dpStr(180 - known)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xVal)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xVal)} ÷ ${c}` }] : []), { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const xVal_raw = useDecimal ? niceXVal(15, 165, true) : rnd(15, 165);
  let known = useDecimal ? Math.round((180 - xVal_raw) * 10) / 10 : 180 - xVal_raw;
  let missing = xVal_raw;
  if (missing < 10 || missing > 170 || known < 10 || known > 170) { known = 90; missing = 90; }
  const leftIsKnown = rnd(0, 1) === 0;
  const leftAngle = leftIsKnown ? known : missing;
  const rayDeg = lineLeftDeg + leftAngle;
  return { tool: "straightLine", level: "level1", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }], angles: [{ label: leftIsKnown ? `${leftAngle}°` : "x", isUnknown: !leftIsKnown, value: leftAngle, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + leftAngle / 2 }, { label: leftIsKnown ? "x" : `${180 - leftAngle}°`, isUnknown: leftIsKnown, value: 180 - leftAngle, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + leftAngle + (180 - leftAngle) / 2 }], answer: `x = ${missing}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `x = 180° − ${known}°` }, { text: `x = ${missing}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightLevel2(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;
  let a1 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80);
  let a2 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80);
  while (a1 + a2 >= 155 || a1 + a2 <= 30) { a1 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80); a2 = useDecimal ? rndDecimal(20, 80) : rnd(20, 80); }
  const a3 = useDecimal ? Math.round((180 - a1 - a2) * 10) / 10 : 180 - a1 - a2;
  if (a3 < 10) return buildStraightLevel2(vars);
  const vals = [a1, a2, a3];
  const ray1Deg = lineLeftDeg + a1, ray2Deg = lineLeftDeg + a1 + a2;
  const arcPairs = [[lineLeftDeg, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, rotationDeg + 360]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];
  if (useXExpr) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMin = 5 / c, xMax = (90 - a1 - a2 - 1) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor((90 - a1 - a2) * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 5 / c, xMax = (90 - a1 - a2 - k) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10;
      if (xAngle < 3) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const knownSum = Math.round((180 - xAngle) * 10) / 10;
    const a1r = Math.round(knownSum / 2), a2r = knownSum - a1r;
    const ray1r = lineLeftDeg + a1r, ray2r = lineLeftDeg + a1r + a2r;
    const xLabel = exprLabel(c, k);
    return { tool: "straightLine", level: "level2", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1r }, { angleDeg: ray2r }, { angleDeg: rotationDeg }], angles: [{ label: `${a1r}°`, isUnknown: false, value: a1r, arcFromDeg: lineLeftDeg, arcToDeg: ray1r, bisectorDeg: lineLeftDeg + a1r / 2 }, { label: `${a2r}°`, isUnknown: false, value: a2r, arcFromDeg: ray1r, arcToDeg: ray2r, bisectorDeg: lineLeftDeg + a1r + a2r / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: ray2r, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + a1r + a2r + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${a1r}° + ${a2r}° + ${xLabel} = 180°` }, { text: `${knownSum}° + ${xLabel} = 180°` }, { text: `${xLabel} = ${r1dpStr(c * xSolve + k)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const knownSum = 180 - xVal;
  return { tool: "straightLine", level: "level2", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: rotationDeg }], angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: lineLeftDeg + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 180°` }, { text: `${knownSum}° + x = 180°` }, { text: `x = 180° − ${knownSum}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildStraightLevel3(vars) {
  const useCoefficients = vars.useCoefficients === true;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;
  const partsVar = vars.parts ?? "mixed";
  const twoLines = partsVar === "3" ? true : partsVar === "2" ? false : rnd(0, 1) === 1;
  if (!twoLines) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do { c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1; xVal = rnd(10, Math.floor(175 / (c1 + c2 + 1))); k2 = 180 - (c1 + c2) * xVal; if (Math.abs(k2) > 80 || c2 * xVal + k2 < 5 || c1 * xVal < 5) xVal = 0; attempts++; } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 20; xVal = 80; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const rayDeg = lineLeftDeg + ang1Val;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "straightLine", level: "level3", rotationDeg, segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles on a straight line sum to 180°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 180°` }, { text: `${c1 + c2}x ${k2Str} = 180°` }, { text: `${c1 + c2}x = ${180 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const c1 = useCoefficients ? rnd(1, 5) : 1, c2 = useCoefficients ? rnd(1, 5) : 1;
  const fixedAngle = rnd(20, 70);
  const remaining = 180 - fixedAngle;
  const maxX = Math.floor((remaining - 10) / (c1 + c2));
  const xVal = rnd(5, Math.max(5, maxX));
  const k = remaining - (c1 + c2) * xVal;
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
function rightSector(rot) {
  const sectorStart = ((3 - rot) * 90 + 360) % 360;
  return { sectorStart, sectorEnd: sectorStart + 90 };
}

function buildRightLevel1(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);

  if (useXExpr) {
    let known = 0, k = 0, c = 1, xVal = 0, attempts = 0;
    do {
      known = rnd(5, 70); const remainder = 90 - known;
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
      if (exprType === "coefficient") { k = 0; const xMin = 5 / c, xMax = (remainder - 1) / c; if (xMax < xMin) { attempts++; continue; } xVal = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor(remainder * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 5 / c, xMax = (remainder - k) / c; if (xMax < xMin) { attempts++; continue; } xVal = niceXVal(xMin, xMax, useDecimal); }
      if (xVal <= 0 || c * xVal + k < 3) { attempts++; continue; }
      const actualAngleExpr = Math.round((c * xVal + k) * 10) / 10;
      known = 90 - actualAngleExpr;
      if (known < 3 || known > 87) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { known = 50; k = 0; c = 1; xVal = 40; }
    // knownSpan = the angle labelled with the known value
    // unknownSpan = the angle labelled x (= c*xVal + k)
    const knownSpan = known;
    const unknownSpan = c * xVal + k;
    // Randomly place known angle first (from sectorStart) or second
    const knownFirst = rnd(0, 1) === 0;
    const firstSpan  = knownFirst ? knownSpan  : unknownSpan;
    const secondSpan = knownFirst ? unknownSpan : knownSpan;
    const rayDeg = sectorStart + firstSpan;
    const xLabel = exprLabel(c, k);
    return {
      tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
      angles: [
        { label: knownFirst ? `${known}°` : xLabel, isUnknown: !knownFirst, value: firstSpan,  arcFromDeg: sectorStart, arcToDeg: rayDeg,    bisectorDeg: sectorStart + firstSpan / 2 },
        { label: knownFirst ? xLabel : `${known}°`, isUnknown: knownFirst,  value: secondSpan, arcFromDeg: rayDeg,      arcToDeg: sectorEnd,  bisectorDeg: sectorStart + firstSpan + secondSpan / 2 },
      ],
      answer: `x = ${xVal}°`,
      working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${known}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${r1dpStr(90 - known)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xVal)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xVal)} ÷ ${c}` }] : []), { text: `x = ${xVal}°` }],
      id: Math.floor(Math.random() * 1e6)
    };
  }

  // Plain numeric version: pick two angles that sum to 90
  const xVal_raw = useDecimal ? niceXVal(5, 80, true) : rnd(5, 80);
  const knownVal = useDecimal ? Math.round((90 - xVal_raw) * 10) / 10 : 90 - xVal_raw;
  let xVal = xVal_raw;
  if (xVal < 3 || xVal > 87 || knownVal < 3) xVal = 45;
  const knownV = useDecimal ? Math.round((90 - xVal) * 10) / 10 : 90 - xVal;
  // Randomly place the known angle first or second
  const knownFirst = rnd(0, 1) === 0;
  const firstSpan  = knownFirst ? knownV : xVal;
  const secondSpan = knownFirst ? xVal   : knownV;
  const rayDeg = sectorStart + firstSpan;
  return {
    tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
    segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
    angles: [
      { label: knownFirst ? `${knownV}°` : "x", isUnknown: !knownFirst, value: firstSpan,  arcFromDeg: sectorStart, arcToDeg: rayDeg,   bisectorDeg: sectorStart + firstSpan / 2 },
      { label: knownFirst ? "x" : `${knownV}°`, isUnknown: knownFirst,  value: secondSpan, arcFromDeg: rayDeg,      arcToDeg: sectorEnd, bisectorDeg: sectorStart + firstSpan + secondSpan / 2 },
    ],
    answer: `x = ${xVal}°`,
    working: [{ text: "Angles in a right angle sum to 90°" }, { text: `x = 90° − ${knownV}°` }, { text: `x = ${xVal}°` }],
    id: Math.floor(Math.random() * 1e6)
  };
}

function buildRightLevel2(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  let a1 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40);
  let a2 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40);
  while (a1 + a2 >= 75 || a1 + a2 <= 20) { a1 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40); a2 = useDecimal ? rndDecimal(10, 40) : rnd(10, 40); }
  const a3 = useDecimal ? Math.round((90 - a1 - a2) * 10) / 10 : 90 - a1 - a2;
  if (a3 < 5) return buildRightLevel2(vars);
  const vals = [a1, a2, a3];
  const ray1Deg = sectorStart + a1, ray2Deg = sectorStart + a1 + a2;
  const arcPairs = [[sectorStart, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, sectorEnd]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];
  if (useXExpr) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    const knownSumBase = Math.round(a1 + a2);
    do {
      if (exprType === "coefficient") { k = 0; const xMin = 5 / c, xMax = (90 - knownSumBase - 1) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor((90 - knownSumBase) * 0.6); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 5 / c, xMax = (90 - knownSumBase - k) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10;
      if (xAngle < 3) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const knownSum = Math.round((90 - xAngle) * 10) / 10;
    const a1r = Math.round(knownSum / 2), a2r = knownSum - a1r;
    const ray1r = sectorStart + a1r, ray2r = sectorStart + a1r + a2r;
    const xLabel = exprLabel(c, k);
    return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: ray1r }, { angleDeg: ray2r }, { angleDeg: sectorEnd }], angles: [{ label: `${a1r}°`, isUnknown: false, value: a1r, arcFromDeg: sectorStart, arcToDeg: ray1r, bisectorDeg: sectorStart + a1r / 2 }, { label: `${a2r}°`, isUnknown: false, value: a2r, arcFromDeg: ray1r, arcToDeg: ray2r, bisectorDeg: sectorStart + a1r + a2r / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: ray2r, arcToDeg: sectorEnd, bisectorDeg: sectorStart + a1r + a2r + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${a1r}° + ${a2r}° + ${xLabel} = 90°` }, { text: `${knownSum}° + ${xLabel} = 90°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const knownSum = 90 - xVal;
  return { tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: sectorEnd }], angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: sectorStart + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 90°` }, { text: `${knownSum}° + x = 90°` }, { text: `x = 90° − ${knownSum}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildRightLevel3(vars) {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = vars.parts ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do { c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1; xVal = rnd(5, Math.floor(85 / (c1 + c2 + 1))); k2 = 90 - (c1 + c2) * xVal; if (Math.abs(k2) > 50 || c2 * xVal + k2 < 3 || c1 * xVal < 3) xVal = 0; attempts++; } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 10; xVal = 40; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const rayDeg = sectorStart + ang1Val;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false, segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles in a right angle sum to 90°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 90°` }, { text: `${c1 + c2}x ${k2Str} = 90°` }, { text: `${c1 + c2}x = ${90 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const c1 = useCoefficients ? rnd(1, 5) : 1, c2 = useCoefficients ? rnd(1, 5) : 1;
  const fixedAngle = rnd(5, 40);
  const remaining = 90 - fixedAngle;
  const maxX = Math.floor((remaining - 6) / (c1 + c2));
  const xVal = rnd(3, Math.max(3, maxX));
  const k = remaining - (c1 + c2) * xVal;
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
function buildAroundLevel1(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const xVal_raw = useDecimal ? niceXVal(20, 280, true) : rnd(40, 280);
  const remaining = useDecimal ? Math.round((360 - xVal_raw) * 10) / 10 : 360 - xVal_raw;
  let a1, a2;
  if (useDecimal) { const half = Math.round(remaining / 2 * 10) / 10; const spread = niceXVal(10, Math.min(half - 10, 100), true); a1 = Math.round((half - spread) * 10) / 10; a2 = Math.round((half + spread) * 10) / 10; }
  else { do { a1 = rnd(40, 150); a2 = rnd(40, 150); } while (a1 + a2 >= 340 || a1 + a2 <= 60); }
  const a3 = useDecimal ? Math.round((360 - a1 - a2) * 10) / 10 : 360 - a1 - a2;
  const vals = [a1, a2, a3];
  const startDeg = 270;
  const ray0 = startDeg, ray1 = startDeg + a1, ray2 = startDeg + a1 + a2;
  const arcPairs = [[ray0, ray1], [ray1, ray2], [ray2, ray0 + 360]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = 2;
  const xVal = a3;
  if (useXExpr) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    const knownSumBase = Math.round(a1 + a2);
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMin = 20 / c, xMax = (360 - knownSumBase - 1) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor((360 - knownSumBase) * 0.4); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 20 / c, xMax = (360 - knownSumBase - k) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10;
      if (xAngle < 20) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = a3; xAngle = a3; }
    const xLabel = exprLabel(c, k);
    return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }], angles: [{ label: `${Math.round(a1)}°`, isUnknown: false, value: a1, arcFromDeg: arcPairs[0][0], arcToDeg: arcPairs[0][1], bisectorDeg: startDeg + a1 / 2 }, { label: `${Math.round(a2)}°`, isUnknown: false, value: a2, arcFromDeg: arcPairs[1][0], arcToDeg: arcPairs[1][1], bisectorDeg: startDeg + a1 + a2 / 2 }, { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: arcPairs[2][0], arcToDeg: arcPairs[2][1], bisectorDeg: startDeg + a1 + a2 + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${Math.round(a1)}° + ${Math.round(a2)}° + ${xLabel} = 360°` }, { text: `${knownSumBase}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const knownSum = useDecimal ? Math.round((a1 + a2) * 10) / 10 : a1 + a2;
  return { tool: "aroundPoint", level: "level1", rotationDeg: 0, segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }], angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${a1}° + ${a2}° + x = 360°` }, { text: `${knownSum}° + x = 360°` }, { text: `x = 360° − ${knownSum}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundLevel2(vars) {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
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
  const arcPairs = vals.map((_, i) => [rayDegs[i], i < vals.length - 1 ? rayDegs[i + 1] : startDeg + 360]);
  const cumulative = [0, a1, a1 + a2, a1 + a2 + a3];
  if (useXExpr) {
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 4) : 1;
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSumBase = knownNums.reduce((s, v) => s + Math.round(v), 0);
    let xSolve = 0, k = 0, xAngle = 0, attempts = 0;
    do {
      if (exprType === "coefficient") { k = 0; const xMin = 20 / c, xMax = (360 - knownSumBase - 1) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      else { const kMax = Math.floor((360 - knownSumBase) * 0.4); if (kMax < 1) { attempts++; continue; } k = rnd(1, kMax); const xMin = 20 / c, xMax = (360 - knownSumBase - k) / c; if (xMax < xMin) { attempts++; continue; } xSolve = niceXVal(xMin, xMax, useDecimal); }
      xAngle = Math.round((c * xSolve + k) * 10) / 10;
      if (xAngle < 20) { attempts++; continue; }
      break;
    } while (++attempts < 80);
    if (attempts >= 80) { k = 0; xSolve = xVal; xAngle = xVal; }
    const xLabel = exprLabel(c, k);
    const knownAngles = knownNums.map(v => Math.round(v));
    let cumDeg2 = 0;
    const rayDegs2 = [startDeg, ...knownAngles.map(v => { cumDeg2 += v; return startDeg + cumDeg2; })];
    const ray_x_start = startDeg + knownSumBase;
    return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: [...rayDegs2.map(d => ({ angleDeg: d }))], angles: [...knownAngles.map((v, i) => ({ label: `${v}°`, isUnknown: false, value: v, arcFromDeg: rayDegs2[i], arcToDeg: rayDegs2[i + 1], bisectorDeg: rayDegs2[i] + v / 2 })), { label: xLabel, isUnknown: true, value: xAngle, arcFromDeg: ray_x_start, arcToDeg: startDeg + 360, bisectorDeg: ray_x_start + xAngle / 2 }], answer: `x = ${xSolve}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${knownAngles.join("° + ")}° + ${xLabel} = 360°` }, { text: `${knownSumBase}° + ${xLabel} = 360°` }, { text: `${xLabel} = ${r1dpStr(xAngle)}°` }, ...(k !== 0 ? [{ text: `${c === 1 ? "" : c}x = ${r1dpStr(c * xSolve)}°` }] : []), ...(c !== 1 ? [{ text: `x = ${r1dpStr(c * xSolve)} ÷ ${c}` }] : []), { text: `x = ${xSolve}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  const knownSum = 360 - xVal;
  return { tool: "aroundPoint", level: "level2", rotationDeg: 0, segments: rayDegs.map(d => ({ angleDeg: d })), angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })), answer: `x = ${xVal}°`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 360°` }, { text: `${knownSum}° + x = 360°` }, { text: `x = 360° − ${knownSum}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
}

function buildAroundLevel3(vars) {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = vars.parts ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const startDeg = 270;
  if (twoRegions) {
    let c1 = 1, c2 = 1, k2 = 0, xVal = 0, found = false;
    for (let attempt = 0; attempt < 200 && !found; attempt++) {
      c1 = useCoefficients ? rnd(1, 4) : 1; c2 = useCoefficients ? rnd(1, 4) : 1;
      const totalC = c1 + c2;
      const minXfromK = Math.ceil((360 - 120) / totalC), maxXfromK = Math.floor((360 + 120) / totalC);
      const minXfromAng = Math.ceil(20 / Math.min(c1, c2));
      const minX = Math.max(minXfromK, minXfromAng);
      if (maxXfromK < minX) continue;
      xVal = rnd(minX, maxXfromK); k2 = 360 - totalC * xVal;
      if (k2 === 0) continue;
      if (c2 * xVal + k2 < 20) continue;
      found = true;
    }
    if (!found) { c1 = 1; c2 = 1; xVal = 175; k2 = 10; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `\u2212 ${Math.abs(k2)}`;
    return { tool: "aroundPoint", level: "level3", rotationDeg: 0, segments: [{ angleDeg: startDeg }, { angleDeg: startDeg + ang1Val }], angles: [{ label: exprLabel(c1, 0), isUnknown: true, value: ang1Val, arcFromDeg: startDeg, arcToDeg: startDeg + ang1Val, bisectorDeg: startDeg + ang1Val / 2 }, { label: exprLabel(c2, k2), isUnknown: true, value: ang2Val, arcFromDeg: startDeg + ang1Val, arcToDeg: startDeg + 360, bisectorDeg: startDeg + ang1Val + ang2Val / 2 }], answer: `x = ${xVal}`, working: [{ text: "Angles around a point sum to 360°" }, { text: `${exprLabel(c1, 0)} + ${exprLabel(c2, k2)} = 360°` }, { text: `${c1 + c2}x ${k2Str} = 360°` }, { text: `${c1 + c2}x = ${360 - k2}°` }, { text: `x = ${xVal}°` }], id: Math.floor(Math.random() * 1e6) };
  }
  let c1 = 1, c2 = 1, fixedAngle = 60, xVal = 40, k = 0, ang2Val = 0, ang3Val = 0, found = false;
  for (let attempt = 0; attempt < 300 && !found; attempt++) {
    c1 = useCoefficients ? rnd(1, 5) : 1; c2 = useCoefficients ? rnd(1, 5) : 1;
    fixedAngle = rnd(30, 120); const remaining = 360 - fixedAngle; const totalC = c1 + c2;
    const minXfromK = Math.ceil((remaining - 120) / totalC), maxXfromK = Math.floor((remaining + 120) / totalC);
    const minXfromAng = Math.ceil(15 / Math.min(c1, c2)); const minX = Math.max(minXfromK, minXfromAng);
    if (maxXfromK < minX) continue;
    xVal = rnd(minX, maxXfromK); k = remaining - totalC * xVal;
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
function generateQuestion(tool, level, vars) {
  let q;
  if (tool === "mixed") {
    const active = [];
    if (vars.rightAngle !== false) active.push("rightAngle");
    if (vars.straightLine !== false) active.push("straightLine");
    if (vars.aroundPoint !== false) active.push("aroundPoint");
    const pool = active.length > 0 ? active : ["rightAngle", "straightLine", "aroundPoint"];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    q = generateQuestion(picked, level, vars);
    q.key = `mixed-${level}-${q.id}`;
    q.difficulty = level;
    return q;
  }
  if (tool === "straightLine") { if (level === "level1") q = buildStraightLevel1(vars); else if (level === "level2") q = buildStraightLevel2(vars); else q = buildStraightLevel3(vars); }
  else if (tool === "rightAngle") { if (level === "level1") q = buildRightLevel1(vars); else if (level === "level2") q = buildRightLevel2(vars); else q = buildRightLevel3(vars); }
  else { if (level === "level1") q = buildAroundLevel1(vars); else if (level === "level2") q = buildAroundLevel2(vars); else q = buildAroundLevel3(vars); }
  q.difficulty = level;
  q.key = `${tool}-${level}-${q.id}`;
  return q;
}

// ── buildVarsFromSnapshot ─────────────────────────────────────────────────────
// Reconstructs the full `vars` object from a stored QO snapshot.
// The snapshot IS the resolved vars — we stored the merged object, not raw UI
// state — so this is just a pass-through. It exists so the call-site is explicit.
function buildVarsFromSnapshot(snapshot) {
  return snapshot;
}

// ── buildVarsFromUIState ──────────────────────────────────────────────────────
// Builds the vars object from live UI state (dropdowns, variables, multiSelects).
// Used only when generating NEW questions — never for regen.
function buildVarsFromUI(tool, level, toolDropdowns, toolVariables, toolMultiSelect) {
  const t = TOOL_CONFIG.tools[tool];
  const ddCfg = t.difficultySettings[level].dropdown;
  const ddKey = ddCfg ? ddCfg.key : null;
  const ddVal = ddKey ? (toolDropdowns[`${tool}__${level}`] ?? ddCfg.defaultValue) : null;
  const vars = { ...(toolVariables[tool]?.[level] ?? {}) };
  const ms = t.difficultySettings[level].multiSelect;
  if (ms) ms.options.forEach(o => { vars[o.value] = toolMultiSelect[tool]?.[`${level}__${o.value}`] ?? o.defaultActive; });
  const ms2 = t.difficultySettings[level].multiSelect2;
  if (ms2) ms2.options.forEach(o => { vars[o.value] = toolMultiSelect[tool]?.[`${level}__ms2__${o.value}`] ?? o.defaultActive; });
  if (ddKey && ddVal !== null) vars[ddKey] = ddVal;
  return vars;
}

function getUniqueQuestion(tool, level, vars, used) {
  let q, attempts = 0;
  do { q = generateQuestion(tool, level, vars); } while (used.has(q.key) && ++attempts < 100);
  used.add(q.key);
  // Stamp a deep copy of vars as _qo so regen can reproduce exactly
  q._qo = JSON.parse(JSON.stringify(vars));
  q._tool = tool;
  return q;
}

// ─── SVG HELPERS ──────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
function toRad(d) { return d * DEG; }
function pt(cx, cy, r, deg) { return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))]; }
function sectorPath(cx, cy, r, f, t) {
  // Normalise so we always sweep the SHORT way (the actual angle region, never > 180 for angle facts)
  let sweep = t - f;
  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;
  const [x1, y1] = pt(cx, cy, r, f);
  const [x2, y2] = pt(cx, cy, r, f + sweep);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2},${y2} Z`;
}
function arcPath(cx, cy, r, f, t) {
  let sweep = t - f;
  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;
  const [x1, y1] = pt(cx, cy, r, f);
  const [x2, y2] = pt(cx, cy, r, f + sweep);
  return `M${x1},${y1} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2},${y2}`;
}
function estTW(label, fs) { return label.length * fs * 0.68 + fs * 0.6; }

// ─── LEADER LINE HELPERS ──────────────────────────────────────────────────────
function outwardBisectorDir(fromDeg, toDeg) {
  // Find the midpoint of the swept arc (always the short/interior arc)
  let sweep = toDeg - fromDeg;
  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;
  const midDeg = fromDeg + sweep / 2;
  return [Math.cos(toRad(midDeg)), Math.sin(toRad(midDeg))];
}

function leaderLayout(vx, vy, arcR, leaderLen, fromDeg, toDeg) {
  const [bx, by] = outwardBisectorDir(fromDeg, toDeg);
  return { tipX: vx + bx * arcR, tipY: vy + by * arcR, labelX: vx + bx * (arcR + leaderLen), labelY: vy + by * (arcR + leaderLen) };
}

function LeaderLabel({ tipX, tipY, labelX, labelY, label, fontSize, isUnknown, showAnswer, value, small }) {
  const displayLabel = isUnknown && !showAnswer ? label : isUnknown ? `${value}°` : label;
  const tw = estTW(displayLabel, fontSize);
  const th = fontSize * 1.4;
  const colour = isUnknown ? "#2563eb" : "#6b7280";
  const dx = tipX - labelX, dy = tipY - labelY;
  const dlen = Math.sqrt(dx * dx + dy * dy);
  const ux = dlen > 0.001 ? dx / dlen : 0, uy = dlen > 0.001 ? dy / dlen : 0;
  const boxHalfW = tw / 2 + 4, boxHalfH = th / 2 + 2;
  const tEdge = dlen > 0.001 ? Math.min(Math.abs(boxHalfW / (ux || 0.0001)), Math.abs(boxHalfH / (uy || 0.0001))) : 0;
  const lsx = labelX + ux * (tEdge + 2), lsy = labelY + uy * (tEdge + 2);
  const arrSz = small ? 4 : 6;
  const px = -uy, py = ux;
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
function AngleDiagram({ q, showAnswer, small = false, dataIndex }) {
  const size = small ? 300 : 340;
  const targetFontPx = small ? 17 : 28;
  // Three fixed arc radii — small/medium/large bucket by angle size.
  // Steps are close together so diagrams stay balanced.
  const ARC_SM = size * (small ? 0.20 : 0.22);
  const ARC_MD = size * (small ? 0.225 : 0.245);
  const ARC_LG = size * (small ? 0.25 : 0.27);
  const arcRFor = (deg) => deg <= 30 ? ARC_SM : deg <= 60 ? ARC_MD : ARC_LG;
  const LEADER_LEN = small ? 42 : 64;

  if (q.tool === "rightAngle") {
    const inset = small ? 22 : 48;
    const armLen = size - inset - (small ? 8 : 16);
    const rot = q.rotationDeg;
    const corners = [[inset, size - inset], [size - inset, size - inset], [size - inset, inset], [inset, inset]];
    const [vx, vy] = corners[rot];
    const sectorStart = q.segments[0].angleDeg;
    const sectorEnd = q.segments[q.segments.length - 1].angleDeg;
    const [b1x, b1y] = pt(vx, vy, armLen, sectorStart);
    const [b2x, b2y] = pt(vx, vy, armLen, sectorEnd);
    const interiorSegs = q.segments.slice(1, -1);
    const sqSz = size * 0.085;
    const s1rad = toRad(sectorStart), s2rad = toRad(sectorEnd);
    const sqP1 = [vx + Math.cos(s1rad) * sqSz, vy + Math.sin(s1rad) * sqSz];
    const sqP2 = [vx + Math.cos(s1rad) * sqSz + Math.cos(s2rad) * sqSz, vy + Math.sin(s1rad) * sqSz + Math.sin(s2rad) * sqSz];
    const sqP3 = [vx + Math.cos(s2rad) * sqSz, vy + Math.sin(s2rad) * sqSz];
    const geomPts = [[vx, vy], [b1x, b1y], [b2x, b2y]];
    interiorSegs.forEach(seg => { const [px2, py2] = pt(vx, vy, armLen, seg.angleDeg); geomPts.push([px2, py2]); });
    q.angles.forEach(ang => { const ll = leaderLayout(vx, vy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); geomPts.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
    const pad = small ? 14 : 22;
    const bMinX = Math.min(...geomPts.map(p => p[0])) - pad, bMinY = Math.min(...geomPts.map(p => p[1])) - pad;
    const bMaxX = Math.max(...geomPts.map(p => p[0])) + pad, bMaxY = Math.max(...geomPts.map(p => p[1])) + pad;
    const bDim = Math.max(bMaxX - bMinX, bMaxY - bMinY);
    const bCx = (bMinX + bMaxX) / 2, bCy = (bMinY + bMaxY) / 2;
    const fontSize = targetFontPx * bDim / (small ? 266 : 460);
    const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
    return (
      <svg width="100%" height="100%" viewBox={`${bCx - bDim/2} ${bCy - bDim/2} ${bDim} ${bDim}`} style={{ overflow: "visible" }} {...extraProps}>
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

  const margin = small ? 18 : 60;
  const vbSize = size + margin * 2;
  const cx = vbSize / 2, cy = vbSize / 2;
  const lineLen = size * 0.62;
  const ctrPts = [[cx, cy]];
  q.segments.forEach(seg => { const [px2, py2] = pt(cx, cy, lineLen, seg.angleDeg); ctrPts.push([px2, py2]); });
  q.angles.forEach(ang => { const ll = leaderLayout(cx, cy, arcRFor(ang.value), LEADER_LEN, ang.arcFromDeg, ang.arcToDeg); ctrPts.push([ll.labelX - 30, ll.labelY - 12], [ll.labelX + 30, ll.labelY + 12]); });
  const cPad = small ? 10 : 18;
  const cMinX = Math.min(...ctrPts.map(p => p[0])) - cPad, cMinY = Math.min(...ctrPts.map(p => p[1])) - cPad;
  const cMaxX = Math.max(...ctrPts.map(p => p[0])) + cPad, cMaxY = Math.max(...ctrPts.map(p => p[1])) + cPad;
  const cDim = Math.max(cMaxX - cMinX, cMaxY - cMinY);
  const cCx = (cMinX + cMaxX) / 2, cCy = (cMinY + cMaxY) / 2;
  const fontSize = targetFontPx * cDim / (small ? 266 : 460);
  const extraProps = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  return (
    <svg width="100%" height="100%" viewBox={`${cCx - cDim/2} ${cCy - cDim/2} ${cDim} ${cDim}`} style={{ overflow: "visible" }} {...extraProps}>
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

function handlePrint(worksheet, isDiff, toolName, worksheetContainerRef) {
  const container = worksheetContainerRef.current;
  if (!container) return;
  const svgEls = container.querySelectorAll("svg[data-q-index]");
  const svgStrings = [];
  svgEls.forEach(el => { const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10); const clone = el.cloneNode(true); clone.setAttribute("width", "100%"); clone.setAttribute("height", "100%"); svgStrings[idx] = clone.outerHTML; });
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const buildStandardPages = (showAnswers) => {
    const pages = [];
    for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) {
      const slice = worksheet.slice(p, p + PRINT_PER_PAGE);
      const pageNum = Math.floor(p / PRINT_PER_PAGE) + 1;
      const totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, li) => { const gi = p + li; return `<div class="cell"><div class="cell-num">${gi + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`; }).join("");
      const label = totalPages > 1 ? `${worksheet.length} questions · Page ${pageNum} of ${totalPages}` : `${worksheet.length} questions`;
      pages.push(`<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">Worksheet &nbsp;·&nbsp; ${dateStr} &nbsp;·&nbsp; ${label}</div></div><div class="standard-grid">${cells}</div></div>`);
    }
    return pages.join("");
  };
  const buildDiffPages = (showAnswers) => {
    const byLevel = { level1: worksheet.filter(q => q.level === "level1"), level2: worksheet.filter(q => q.level === "level2"), level3: worksheet.filter(q => q.level === "level3") };
    const offsetByLevel = { level1: 0, level2: byLevel.level1.length, level3: byLevel.level1.length + byLevel.level2.length };
    const lvNames = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
    const lvColors = { level1: "#166534", level2: "#854d0e", level3: "#991b1b" };
    const lvBg = { level1: "#dcfce7", level2: "#fef9c3", level3: "#fee2e2" };
    const totalPages = Math.ceil(Math.max(...Object.values(byLevel).map(a => a.length)) / PRINT_ROWS);
    return Array.from({ length: totalPages }, (_, p) => {
      const cols = ["level1", "level2", "level3"].map(lv => {
        const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const offset = offsetByLevel[lv];
        const cells = qs.map((q, li) => { const gi = offset + p * PRINT_ROWS + li; return `<div class="cell"><div class="cell-num">${p * PRINT_ROWS + li + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`; }).join("");
        return `<div class="diff-col"><div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div><div class="diff-cells">${cells}</div></div>`;
      }).join("");
      const lbl = totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : "";
      return `<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">Differentiated &nbsp;·&nbsp; ${dateStr}${lbl}</div></div><div class="diff-grid">${cols}</div></div>`;
    }).join("");
  };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>* { margin:0; padding:0; box-sizing:border-box; } @page { size:A4 portrait; margin:12mm; } body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; } @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } } .page { width:186mm; height:273mm; display:flex; flex-direction:column; page-break-after:always; overflow:hidden; } .page:last-child { page-break-after:auto; } .page-header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2mm; flex-shrink:0; } .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; } .page-header .meta { font-size:3mm; color:#6b7280; } .standard-grid { display:grid; grid-template-columns:repeat(${PRINT_COLS},1fr); grid-template-rows:repeat(${PRINT_ROWS},1fr); gap:2mm; flex:1; min-height:0; } .diff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; flex:1; min-height:0; } .diff-col { display:flex; flex-direction:column; gap:2mm; min-height:0; } .diff-col-header { text-align:center; font-size:3.5mm; font-weight:700; padding:1.5mm 0; border-radius:1.5mm; flex-shrink:0; } .diff-cells { display:flex; flex-direction:column; gap:2mm; flex:1; min-height:0; } .cell { border:0.3mm solid #d1d5db; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; overflow:hidden; flex:1; min-height:0; position:relative; } .cell-num { position:absolute; top:1.5mm; left:2mm; font-size:2.8mm; font-weight:700; color:#374151; } .cell-diagram { width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:hidden; } .cell-diagram svg { width:100%; height:100%; overflow:visible; } .answer { font-size:3mm; font-weight:700; color:#059669; text-align:center; flex-shrink:0; margin-top:1mm; }</style></head><body>
${buildStandardPages(false)}${buildStandardPages(true)}
</body></html>`;
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the print/PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

const DifficultyToggle = ({ value, onChange }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {[["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]].map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)} className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
    ))}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{opt.label}</button>)}
    </div>
  </div>
);

const VariablesSection = ({ variables, values, onChange }) => (
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

const MultiSelectSection = ({ multiSelect, values, onChange, allowAllOff = false }) => {
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

const StandardQOPopover = ({ tool, level, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }) => {
  const { open, setOpen, ref } = usePopover();
  const t = TOOL_CONFIG.tools[tool];
  const ds = t.difficultySettings[level];
  const dd = ds.dropdown;
  const vars = ds.variables;
  const ms = ds.multiSelect;
  const ms2 = ds.multiSelect2;
  const ddVal = dd ? (toolDropdowns[`${tool}__${level}`] ?? dd.defaultValue) : "";
  const varVals = toolVariables[tool]?.[level] ?? {};
  const msVals = {};
  if (ms) ms.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${level}__${o.value}`] ?? o.defaultActive; });
  const ms2Vals = {};
  if (ms2) ms2.options.forEach(o => { ms2Vals[o.value] = toolMultiSelect[tool]?.[`${level}__ms2__${o.value}`] ?? o.defaultActive; });
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-5">
          {ms2 && <MultiSelectSection multiSelect={ms2} values={ms2Vals} onChange={(k, v) => setToolMultiSelect(tool, level, `ms2__${k}`, v)} />}
          {dd && <DropdownSection dropdown={dd} value={ddVal} onChange={v => setToolDropdown(tool, level, v)} />}
          {ms && <MultiSelectSection multiSelect={ms} values={msVals} onChange={(k, v) => setToolMultiSelect(tool, level, k, v)} />}
          {vars.length > 0 && <VariablesSection variables={vars} values={varVals} onChange={(k, v) => setToolVariable(tool, level, k, v)} />}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ tool, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect }) => {
  const { open, setOpen, ref } = usePopover();
  const t = TOOL_CONFIG.tools[tool];
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96 p-5 flex flex-col gap-5">
          {["level1", "level2", "level3"].map(lv => {
            const ds = t.difficultySettings[lv];
            const dd = ds.dropdown, vars = ds.variables, ms = ds.multiSelect, ms2 = ds.multiSelect2;
            const ddVal = dd ? (toolDropdowns[`${tool}__${lv}`] ?? dd.defaultValue) : "";
            const varVals = toolVariables[tool]?.[lv] ?? {};
            const msVals = {};
            if (ms) ms.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${lv}__${o.value}`] ?? o.defaultActive; });
            const ms2Vals = {};
            if (ms2) ms2.options.forEach(o => { ms2Vals[o.value] = toolMultiSelect[tool]?.[`${lv}__ms2__${o.value}`] ?? o.defaultActive; });
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

const InlineQOPanel = ({ tool, level, variables, onVariableChange, dropdownValue, onDropdownChange, multiSelectValues, onMultiSelectChange, multiSelectValues2, onMultiSelectChange2 }) => {
  const t = TOOL_CONFIG.tools[tool];
  const ds = t.difficultySettings[level];
  return (
    <div className="flex flex-col gap-4">
      {ds.multiSelect2 && <MultiSelectSection multiSelect={ds.multiSelect2} values={multiSelectValues2 ?? {}} onChange={onMultiSelectChange2 ?? (() => {})} />}
      {ds.dropdown && <DropdownSection dropdown={ds.dropdown} value={dropdownValue} onChange={onDropdownChange} />}
      {ds.multiSelect && <MultiSelectSection multiSelect={ds.multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} allowAllOff={ds.multiSelect.key === "exprType"} />}
      {ds.variables.length > 0 && <VariablesSection variables={ds.variables} values={variables} onChange={onVariableChange} />}
    </div>
  );
};

const InfoModal = ({ onClose }) => (
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
            <div className="flex flex-col gap-2">{s.content.map(item => <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3"><span className="font-bold text-gray-800 text-sm">{item.label}</span><p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p></div>)}</div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? "rotate-90" : ""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Colour Scheme</span></div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default", "blue", "pink", "yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }} className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {s}{colorScheme === s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function BasicAngleFacts() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools);
  const worksheetContainerRef = useRef(null);

  const [currentTool, setCurrentTool] = useState("rightAngle");
  const [mode, setMode] = useState("whiteboard");
  const [difficulty, setDifficulty] = useState("level1");

  // ── QO UI state (dropdowns, variables, multiSelects) ──────────────────────
  const initToolDropdowns = () => {
    const init = {};
    toolKeys.forEach(k => {
      ["level1", "level2", "level3"].forEach(lv => {
        const dd = TOOL_CONFIG.tools[k].difficultySettings[lv].dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    return init;
  };
  const initToolVariables = () => {
    const init = {};
    toolKeys.forEach(k => {
      init[k] = {};
      ["level1", "level2", "level3"].forEach(lv => {
        init[k][lv] = {};
        TOOL_CONFIG.tools[k].difficultySettings[lv].variables.forEach(v => { init[k][lv][v.key] = v.defaultValue; });
      });
    });
    return init;
  };
  const initToolMultiSelect = () => {
    const init = {};
    toolKeys.forEach(k => {
      init[k] = {};
      ["level1", "level2", "level3"].forEach(lv => {
        const ms = TOOL_CONFIG.tools[k].difficultySettings[lv].multiSelect;
        if (ms) ms.options.forEach(o => { init[k][`${lv}__${o.value}`] = o.defaultActive; });
        const ms2 = TOOL_CONFIG.tools[k].difficultySettings[lv].multiSelect2;
        if (ms2) ms2.options.forEach(o => { init[k][`${lv}__ms2__${o.value}`] = o.defaultActive; });
      });
    });
    return init;
  };

  const [toolDropdowns, setToolDropdowns] = useState(initToolDropdowns);
  const [toolVariables, setToolVariables] = useState(initToolVariables);
  const [toolMultiSelect, setToolMultiSelect] = useState(initToolMultiSelect);

  const setToolDropdown = (tool, level, val) => setToolDropdowns(p => ({ ...p, [`${tool}__${level}`]: val }));
  const setToolVariable = (tool, level, key, val) => setToolVariables(p => ({ ...p, [tool]: { ...p[tool], [level]: { ...(p[tool]?.[level] ?? {}), [key]: val } } }));
  const setToolMultiSelectVal = (tool, level, key, val) => setToolMultiSelect(p => ({ ...p, [tool]: { ...(p[tool] ?? {}), [`${level}__${key}`]: val } }));

  // Build vars from current UI state — used only for generating NEW questions
  const buildVars = (tool, level) => buildVarsFromUI(tool, level, toolDropdowns, toolVariables, toolMultiSelect);

  // ── Shared state ──────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const vars = buildVarsFromUI("rightAngle", "level1", initToolDropdowns(), initToolVariables(), initToolMultiSelect());
    return generateQuestion("rightAngle", "level1", vars);
  });
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(9);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [worksheetMode, setWorksheetMode] = useState("standard");
  const displayFontSize = 2;
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // ── Advanced worksheet state ──────────────────────────────────────────────
  const makeDefaultAdvGroup = (id, lv = "level1", tool = null) => {
    const t = tool ?? currentTool;
    const ds = TOOL_CONFIG.tools[t].difficultySettings[lv];
    const variables = {};
    ds.variables.forEach(v => { variables[v.key] = v.defaultValue; });
    const multiSelectValues = {};
    if (ds.multiSelect) ds.multiSelect.options.forEach(o => { multiSelectValues[o.value] = o.defaultActive; });
    const multiSelectValues2 = {};
    if (ds.multiSelect2) ds.multiSelect2.options.forEach(o => { multiSelectValues2[o.value] = o.defaultActive; });
    return { id, level: lv, count: 5, variables, dropdownValue: ds.dropdown?.defaultValue ?? "", multiSelectValues, multiSelectValues2 };
  };
  const [advGroups, setAdvGroups] = useState(() => [makeDefaultAdvGroup(1)]);
  const [advSelectedId, setAdvSelectedId] = useState(1);
  const advNextId = useRef(2);
  const [advShuffle, setAdvShuffle] = useState(false);
  const totalAdvQuestions = advGroups.reduce((s, g) => s + g.count, 0);

  // ── Visualiser state ──────────────────────────────────────────────────────
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [presenterMode, setPresenterMode] = useState(false);
  const [camDevices, setCamDevices] = useState([]);
  const [currentCamId, setCurrentCamId] = useState(null);
  const [camError, setCamError] = useState(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const camDropdownRef = useRef(null);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const startCam = useCallback(async (deviceId) => {
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
    } catch (e) { setCamError(e.message ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg = isDefaultScheme ? "#f5f3f0" : qBg;

  // ── Wiring ────────────────────────────────────────────────────────────────
  const handleNewQuestion = () => {
    setCurrentQuestion(generateQuestion(currentTool, difficulty, buildVars(currentTool, difficulty)));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set();
    const questions = [];
    if (isDifferentiated) {
      ["level1", "level2", "level3"].forEach(lv => {
        const vars = buildVars(currentTool, lv);
        for (let i = 0; i < numQuestions; i++) questions.push(getUniqueQuestion(currentTool, lv, vars, usedKeys));
      });
    } else {
      const vars = buildVars(currentTool, difficulty);
      for (let i = 0; i < numQuestions; i++) questions.push(getUniqueQuestion(currentTool, difficulty, vars, usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // ── regenQuestion: uses _qo snapshot — NEVER reads live UI state ──────────
  const regenQuestion = (idx) => {
    const q = worksheet[idx];
    if (!q._qo) return; // no snapshot → can't regen faithfully
    const tool = q._tool ?? currentTool;
    const level = q.difficulty ?? q.level;
    const vars = buildVarsFromSnapshot(q._qo); // exact same options as original
    const existing = new Set(worksheet.map(w => w.key));
    existing.delete(q.key);
    let replacement = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = generateQuestion(tool, level, vars);
      if (!existing.has(candidate.key)) {
        candidate._qo = JSON.parse(JSON.stringify(vars)); // stamp snapshot on replacement too
        candidate._tool = tool;
        replacement = candidate;
        break;
      }
    }
    if (!replacement) return;
    setWorksheet(prev => prev.map((w, i) => i === idx ? replacement : w));
  };

  const handleGenerateAdvanced = () => {
    const usedKeys = new Set();
    const questions = [];
    advGroups.forEach(g => {
      const ds = TOOL_CONFIG.tools[currentTool].difficultySettings[g.level];
      const ddCfg = ds.dropdown;
      const ddKey = ddCfg ? ddCfg.key : null;
      const vars = { ...g.variables, ...g.multiSelectValues, ...g.multiSelectValues2 };
      if (ddKey) vars[ddKey] = g.dropdownValue;
      for (let i = 0; i < g.count; i++) questions.push(getUniqueQuestion(currentTool, g.level, vars, usedKeys));
    });
    if (advShuffle) { for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; } }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, currentTool]);

  useEffect(() => {
    if (mode !== "worksheet" || worksheetMode !== "advanced") return;
    const handler = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const idx = advGroups.findIndex(g => g.id === advSelectedId);
      if (idx === -1) return;
      const next = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
      if (next >= 0 && next < advGroups.length) { setAdvSelectedId(advGroups[next].id); e.preventDefault(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, worksheetMode, advGroups, advSelectedId]);

  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];

  const CELL_H = 280;



  const stdQOProps = { tool: currentTool, level: difficulty, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect: setToolMultiSelectVal };
  const diffQOProps = { tool: currentTool, toolDropdowns, setToolDropdown, toolVariables, setToolVariable, toolMultiSelect, setToolMultiSelect: setToolMultiSelectVal };

  // ── Worksheet cell ─────────────────────────────────────────────────────────
  const renderQCell = (q, idx, bgOverride) => {
    const hintH = 28;
    const diagramH = q.tool === "rightAngle" ? CELL_H - hintH : CELL_H;
    return (
      <div className="rounded-xl group" style={{ backgroundColor: bgOverride ?? stepBg, border: "1px solid #e5e7eb", overflow: "hidden", position: "relative" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000", zIndex: 5 }}>{idx + 1})</span>
        {q._qo && (
          <button onClick={() => regenQuestion(idx)} title="Regenerate this question" className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100" style={{ zIndex: 10 }}>
            <RefreshCw size={12} />
          </button>
        )}
        <div style={{ height: diagramH, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", overflow: "hidden" }}>
          <div style={{ width: "95%", height: "95%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AngleDiagram q={q} showAnswer={showWorksheetAnswers} small dataIndex={idx} />
          </div>
        </div>
        {showWorksheetAnswers && <div className="text-base font-bold text-center pb-2" style={{ color: "#059669" }}>{q.answer}</div>}
        {q.tool === "rightAngle" && <div className="text-xs text-center pb-2 text-gray-500 italic">The diagram depicts a right angle</div>}
      </div>
    );
  };

  // ── Advanced Worksheet Builder ────────────────────────────────────────────
  const renderAdvancedWorksheet = () => {
    const lvColor = (lv) => lv === "level1" ? "bg-green-600" : lv === "level2" ? "bg-yellow-500" : "bg-red-600";
    const lvBorder = (lv) => lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";
    const canAdd = advGroups.length < 10;
    const updateGroup = (id, patch) => setAdvGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
    const selectedGroup = advGroups.find(g => g.id === advSelectedId) ?? advGroups[0];
    return (
      <div className="flex gap-3" style={{ minHeight: 300 }}>
        <div className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden" style={{ width: "50%", flexShrink: 0, backgroundColor: "#fff" }}>
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {advGroups.map((g, idx) => {
              const isSel = g.id === advSelectedId;
              return (
                <div key={g.id} onClick={() => setAdvSelectedId(g.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50" style={{ borderLeft: `3px solid ${isSel ? lvBorder(g.level) : "transparent"}`, backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 tabular-nums">{idx + 1}</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {["level1", "level2", "level3"].map((lv, li) => (
                      <button key={lv} onClick={() => { updateGroup(g.id, { ...makeDefaultAdvGroup(g.id, lv), id: g.id }); setAdvSelectedId(g.id); }} className={`px-2.5 py-1 font-bold text-xs transition-colors ${g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>L{li + 1}</button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => updateGroup(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">−</button>
                    <span className="w-6 text-center text-xs font-bold text-gray-800 tabular-nums">{g.count}</span>
                    <button onClick={() => updateGroup(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">+</button>
                  </div>
                  {advGroups.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); const rem = advGroups.filter((_, i) => i !== idx); setAdvGroups(rem); if (g.id === advSelectedId) setAdvSelectedId(rem[Math.max(0, idx - 1)].id); }} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"><X size={12} /></button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
            {canAdd ? (
              <button onClick={() => { const newId = advNextId.current++; setAdvGroups(g => [...g, makeDefaultAdvGroup(newId)]); setAdvSelectedId(newId); }} className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors">+ Add group</button>
            ) : <p className="text-center text-xs text-gray-400 font-semibold py-1">Maximum 10 groups reached</p>}
          </div>
        </div>
        <div className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto" style={{ backgroundColor: "#fff" }}>
          {selectedGroup && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Group {advGroups.indexOf(selectedGroup) + 1} · {selectedGroup.level === "level1" ? "Level 1" : selectedGroup.level === "level2" ? "Level 2" : "Level 3"} · Options</p>
              <InlineQOPanel
                tool={currentTool}
                level={selectedGroup.level}
                variables={selectedGroup.variables}
                onVariableChange={(k, v) => updateGroup(selectedGroup.id, { variables: { ...selectedGroup.variables, [k]: v } })}
                dropdownValue={selectedGroup.dropdownValue}
                onDropdownChange={v => updateGroup(selectedGroup.id, { dropdownValue: v })}
                multiSelectValues={selectedGroup.multiSelectValues}
                onMultiSelectChange={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues: { ...selectedGroup.multiSelectValues, [k]: v } })}
                multiSelectValues2={selectedGroup.multiSelectValues2}
                onMultiSelectChange2={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues2: { ...selectedGroup.multiSelectValues2, [k]: v } })}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode === "worksheet") {
      const isAdv = worksheetMode === "advanced";
      return (
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-3 px-6 pt-4 pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setWorksheetMode(isAdv ? "standard" : "advanced")} className={`w-11 h-6 rounded-full transition-colors relative ${isAdv ? "bg-blue-900" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAdv ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-bold text-gray-500">Advanced</span>
            </label>
            {isAdv && <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setAdvShuffle(s => !s)} className={`w-9 h-5 rounded-full transition-colors relative ${advShuffle ? "bg-blue-900" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${advShuffle ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-semibold text-gray-500">Shuffle</span>
              </label>
              <span className="text-sm font-bold text-gray-600">{totalAdvQuestions} questions total</span>
            </div>}
          </div>
          {!isAdv ? (
            <div className="p-6">
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
                  {[["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]].map(([val, label, col]) => (
                    <button key={val} onClick={() => { setDifficulty(val); setIsDifferentiated(false); }} className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
                  ))}
                </div>
                <button onClick={() => setIsDifferentiated(!isDifferentiated)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
              </div>
              <div className="flex justify-center items-center gap-6 mb-4">
                {isDifferentiated ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Questions:</label><input type="number" min="1" max="24" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || 9)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns} onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3))); }} disabled={isDifferentiated} className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} /></div>
              </div>
              <div className="flex justify-center items-center gap-4">
                <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <>
                  <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button>
                  <button onClick={() => handlePrint(worksheet, isDifferentiated, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button>
                </>}
              </div>
            </div>
          ) : (
            <div className="p-6 pt-4">
              {renderAdvancedWorksheet()}
              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-2"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={numColumns} onChange={e => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
                <button onClick={handleGenerateAdvanced} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <>
                  <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button>
                  <button onClick={() => handlePrint(worksheet, false, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button>
                </>}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}</button>
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
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );
    const bgForPanel = (isFS) => isFS ? fsQuestionBg : stepBg;
    const questionPanel = (isFS) => {
      return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, ...(isFS ? { width: `${splitPct}%`, height: "100%", backgroundColor: bgForPanel(true), padding: 32, boxSizing: "border-box", flexShrink: 0, overflowY: "auto" } : { width: "480px", height: "100%", backgroundColor: bgForPanel(false), borderRadius: 12, padding: 24, flexShrink: 0 }) }}>
          {showWhiteboardAnswer && currentQuestion && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</div>}
          <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AngleDiagram q={currentQuestion} showAnswer={showWhiteboardAnswer} />
          </div>
          {currentQuestion.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center pb-1">The diagram depicts a right angle</div>}
        </div>
      );
    };
    const questionBox = (isFS) => (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, ...(isFS ? { width: `${splitPct}%`, height: "100%", backgroundColor: fsQuestionBg, padding: 32, boxSizing: "border-box", flexShrink: 0, overflowY: "auto" } : { width: "480px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 }) }}>
        {fontControls}
        {showWhiteboardAnswer && currentQuestion && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</div>}
        <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AngleDiagram q={currentQuestion} showAnswer={showWhiteboardAnswer} />
        </div>
        {currentQuestion.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center pb-1">The diagram depicts a right angle</div>}
      </div>
    );
    const makeRightPanel = (isFS) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg) }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (<><video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />{camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}</>)}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }} onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }} onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}><Video size={16} color="rgba(255,255,255,0.85)" /></button>
              {camDropdownOpen && (<div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}><div style={{ padding: "6px 14px", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Camera</div>{camDevices.map((d, i) => (<div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }} style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === currentCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />{d.label || `Camera ${i + 1}`}</div>))}</div>)}
            </div>
          ) : (<button onClick={() => setPresenterMode(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}><Video size={16} color="#6b7280" /></button>)}
          <button onClick={() => setWbFullscreen(f => !f)} style={{ background: wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"), border: presenterMode ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => (e.currentTarget.style.background = wbFullscreen ? "#1f2937" : (presenterMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.15)"))} onMouseLeave={e => (e.currentTarget.style.background = wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"))}>{wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} />}</button>
        </div>
      </div>
    );
    if (wbFullscreen) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>
        {fsToolbar}
        <div ref={splitContainerRef} style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {questionPanel(true)}

          <div style={{ position: "relative", width: 2, backgroundColor: "#000", flexShrink: 0, cursor: "col-resize" }} onMouseDown={e => { e.preventDefault(); isDraggingRef.current = true; const onMove = (ev) => { if (!isDraggingRef.current || !splitContainerRef.current) return; const rect = splitContainerRef.current.getBoundingClientRect(); let pct = ((ev.clientX - rect.left) / rect.width) * 100; pct = Math.min(75, Math.max(25, pct >= 38 && pct <= 42 ? 40 : pct)); setSplitPct(pct); }; const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }; document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp); }}><div style={{ position: "absolute", top: 0, bottom: 0, left: -5, width: 12, cursor: "col-resize" }} /></div>
          {makeRightPanel(true)}
        </div>
      </div>
    );
    return (<div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}><div className="flex gap-6" style={{ height: "100%" }}>{questionPanel(false)}{makeRightPanel(false)}</div></div>);
  };

  // ── Worked example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
      <div className="p-8" style={{ backgroundColor: qBg }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4" style={{ width: 340, height: 340, margin: "0 auto" }}><AngleDiagram q={currentQuestion} showAnswer={showAnswer} /></div>
          {currentQuestion.tool === "rightAngle" && <div className="text-base italic text-gray-500 text-center mb-4">The diagram depicts a right angle</div>}
          {showAnswer && (<>
            <div className="space-y-4 mt-4">
              {currentQuestion.working.slice(0, -1).map((step, i) => (<div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}><h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4><p className={`${displayFontSizes[displayFontSize]} font-semibold`} style={{ color: "#000" }}>{step.text}</p></div>))}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}><span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</span></div>
          </>)}
        </div>
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if (worksheet.length === 0) return (<div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}><span className="text-2xl text-gray-400">Generate worksheet</span></div>);
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if (isDifferentiated) return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {["level1", "level2", "level3"].map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv);
            const c = LV_COLORS[lv];
            return (<div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}><h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3><div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>{lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, c.fill)}</div>)}</div></div>);
          })}
        </div>
      </div>
    );
    return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns}, 1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"><Home size={24} /><span className="font-semibold text-lg">Home</span></button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
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
            {toolKeys.map(k => (<button key={k} onClick={() => { setCurrentTool(k); setWorksheet([]); advNextId.current = 2; setAdvGroups([makeDefaultAdvGroup(1, "level1", k)]); setAdvSelectedId(1); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{TOOL_CONFIG.tools[k].name}</button>))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {[["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]].map(([m, label]) => (<button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{label}</button>))}
          </div>
          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (<div className="flex flex-col gap-6"><div className="rounded-xl shadow-lg">{renderControlBar()}</div><div className="rounded-xl shadow-lg overflow-hidden">{mode === "whiteboard" && renderWhiteboard()}{mode === "single" && renderWorkedExample()}</div></div>)}
        </div>
      </div>
    </>
  );
}
