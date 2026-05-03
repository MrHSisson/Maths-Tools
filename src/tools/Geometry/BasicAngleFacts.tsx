import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from "lucide-react";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle",
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 20)", defaultValue: false },
          ],
        },
        level2: {
          dropdown: null,
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 20)", defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "parts", label: "Parts",
            options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }],
            defaultValue: "mixed",
          },
          variables: [
            { key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false },
          ],
        },
      },
    },
    straightLine: {
      name: "Straight Line",
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 40)", defaultValue: false },
            { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false },
          ],
        },
        level2: {
          dropdown: null,
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 40)", defaultValue: false },
            { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "parts", label: "Parts",
            options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }],
            defaultValue: "mixed",
          },
          variables: [
            { key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false },
            { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false },
          ],
        },
      },
    },
    aroundPoint: {
      name: "Around a Point",
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 40)", defaultValue: false },
          ],
        },
        level2: {
          dropdown: null,
          variables: [
            { key: "useXExpression", label: "Unknown as expression (e.g. x + 40)", defaultValue: false },
          ],
        },
        level3: {
          dropdown: {
            key: "parts", label: "Parts",
            options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }],
            defaultValue: "mixed",
          },
          variables: [
            { key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false },
          ],
        },
      },
    },
  },
} as const;

type ToolKey = keyof typeof TOOL_CONFIG.tools;

const INFO_SECTIONS = [
  {
    title: "Right Angle", icon: "⊾",
    content: [
      { label: "Overview", detail: "Angles inside a right angle always sum to 90°. The right angle is marked with a square." },
      { label: "Level 1 — Green", detail: "One interior ray splitting the right angle. One given angle, find x." },
      { label: "Level 2 — Yellow", detail: "Two interior rays. Two given angles, find x." },
      { label: "Level 3 — Red", detail: "Algebraic angles summing to 90°. Form and solve an equation." },
    ],
  },
  {
    title: "Straight Line", icon: "📐",
    content: [
      { label: "Overview", detail: "Angles on a straight line always sum to 180°." },
      { label: "Level 1 — Green", detail: "One interior ray. One given angle (integer or decimal), find x." },
      { label: "Level 2 — Yellow", detail: "Two interior rays. Two given angles, find x." },
      { label: "Level 3 — Red", detail: "Algebraic angles summing to 180°. Form and solve an equation." },
    ],
  },
  {
    title: "Around a Point", icon: "🔵",
    content: [
      { label: "Overview", detail: "Angles around a point always sum to 360°." },
      { label: "Level 1 — Green", detail: "3 sectors from a centre point. Two given, find x." },
      { label: "Level 2 — Yellow", detail: "4 sectors. Three given, find x." },
      { label: "Level 3 — Red", detail: "Algebraic angles summing to 360°. Form and solve an equation." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Number Type (L1)", detail: "Toggle between integer and decimal (1 d.p.) angles." },
      { label: "Expression (L1 & L2)", detail: "Unknown shown as x + k instead of plain x. x is always positive." },
      { label: "Parts (L3)", detail: "Control whether the question uses 2 or 3 angle regions, or mixed." },
      { label: "Coefficients (L3)", detail: "Algebraic terms may include coefficients such as 2x or 3x." },
      { label: "Fixed Rotation (Straight Line)", detail: "When on, the straight line is always horizontal." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question with blank working space." },
      { label: "Worked Example", detail: "Step-by-step solution revealed on demand." },
      { label: "Worksheet", detail: "Grid of questions. Supports differentiated 3-column layout." },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};

function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a: number, b: number) { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }
function exprLabel(c: number, k: number) {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  return k > 0 ? `${base} + ${k}` : `${base} − ${Math.abs(k)}`;
}

// ─── SHARED INTERFACES ────────────────────────────────────────────────────────
interface SegmentDef { angleDeg: number; }
interface AngleDef {
  label: string;
  isUnknown: boolean;
  value: number;
  arcFromDeg: number;
  arcToDeg: number;
  bisectorDeg: number;
}
interface AngleQuestion {
  tool: string;
  level: string;
  rotationDeg: number;
  segments: SegmentDef[];
  angles: AngleDef[];
  answer: string;
  working: { text: string }[];
  id: number;
}

// ─── STRAIGHT LINE GENERATION ─────────────────────────────────────────────────
function buildStraightLevel1(vars: Record<string, unknown>): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const useXExpr = vars.useXExpression === true;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;

  if (useXExpr) {
    let known: number, k: number, xVal: number, attempts = 0;
    do {
      known = useDecimal ? rndDecimal(20, 140) : rnd(20, 140);
      const maxK = Math.floor(180 - known - 10);
      k = rnd(5, Math.max(5, Math.min(maxK, 60)));
      xVal = 180 - Math.round(known) - k;
      attempts++;
    } while (xVal <= 0 && attempts < 50);
    if (xVal <= 0) { known = 90; k = 20; xVal = 70; }
    k = Math.round(k); xVal = Math.round(xVal);
    const leftIsKnown = rnd(0, 1) === 0;
    const leftAngle = leftIsKnown ? Math.round(known) : xVal + k;
    const rayDeg = lineLeftDeg + leftAngle;
    const xLabel = `x + ${k}`;
    const givenStr = `${Math.round(known)}°`;
    return {
      tool: "straightLine", level: "level1", rotationDeg,
      segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }],
      angles: [
        { label: leftIsKnown ? `${Math.round(known)}°` : xLabel, isUnknown: !leftIsKnown, value: leftAngle, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + leftAngle / 2 },
        { label: leftIsKnown ? xLabel : `${Math.round(known)}°`, isUnknown: leftIsKnown, value: 180 - leftAngle, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + leftAngle + (180 - leftAngle) / 2 },
      ],
      answer: `x = ${xVal}°`,
      working: [
        { text: "Angles on a straight line sum to 180°" },
        { text: `${givenStr} + ${xLabel} = 180°` },
        { text: `${xLabel} = 180° − ${givenStr}` },
        { text: `${xLabel} = ${xVal + k}°` },
        { text: `x = ${xVal + k} − ${k}` },
        { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownAngle = useDecimal ? rndDecimal(15, 165) : rnd(15, 165);
  let known = useDecimal ? Math.round(knownAngle * 10) / 10 : Math.round(knownAngle);
  let missing = useDecimal ? Math.round((180 - known) * 10) / 10 : 180 - known;
  if (missing < 10 || missing > 170) { known = 90; missing = 90; }
  const leftIsKnown = rnd(0, 1) === 0;
  const leftAngle = leftIsKnown ? known : missing;
  const rayDeg = lineLeftDeg + leftAngle;
  const xVal = leftIsKnown ? missing : known;
  return {
    tool: "straightLine", level: "level1", rotationDeg,
    segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }],
    angles: [
      { label: leftIsKnown ? `${leftAngle}°` : "x", isUnknown: !leftIsKnown, value: leftAngle, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + leftAngle / 2 },
      { label: leftIsKnown ? "x" : `${180 - leftAngle}°`, isUnknown: leftIsKnown, value: 180 - leftAngle, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + leftAngle + (180 - leftAngle) / 2 },
    ],
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles on a straight line sum to 180°" },
      { text: `x = 180° − ${leftIsKnown ? leftAngle : 180 - leftAngle}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildStraightLevel2(vars: Record<string, unknown>): AngleQuestion {
  const useXExpr = vars.useXExpression === true;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;
  let a1 = rnd(20, 100), a2 = rnd(20, 100);
  while (a1 + a2 >= 170 || a1 + a2 <= 30) { a1 = rnd(20, 100); a2 = rnd(20, 100); }
  const a3 = 180 - a1 - a2;
  const vals = [a1, a2, a3];
  const ray1Deg = lineLeftDeg + a1;
  const ray2Deg = lineLeftDeg + a1 + a2;
  const arcPairs: [number, number][] = [[lineLeftDeg, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, rotationDeg + 360]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];

  if (useXExpr) {
    const k = rnd(5, Math.min(Math.max(5, xVal - 10), 50));
    const xSolve = xVal - k;
    const xLabel = `x + ${k}`;
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSum = knownNums.reduce((s, v) => s + v, 0);
    return {
      tool: "straightLine", level: "level2", rotationDeg,
      segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: rotationDeg }],
      angles: vals.map((v, i) => ({ label: i === unknownIdx ? xLabel : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: lineLeftDeg + cumulative[i] + v / 2 })),
      answer: `x = ${xSolve}°`,
      working: [
        { text: "Angles on a straight line sum to 180°" },
        { text: `${knownNums.join("° + ")}° + ${xLabel} = 180°` },
        { text: `${knownSum}° + ${xLabel} = 180°` },
        { text: `${xLabel} = ${xVal}°` },
        { text: `x = ${xVal} − ${k}` },
        { text: `x = ${xSolve}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownSum = 180 - xVal;
  return {
    tool: "straightLine", level: "level2", rotationDeg,
    segments: [{ angleDeg: lineLeftDeg }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: rotationDeg }],
    angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: lineLeftDeg + cumulative[i] + v / 2 })),
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles on a straight line sum to 180°" },
      { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 180°` },
      { text: `${knownSum}° + x = 180°` },
      { text: `x = 180° − ${knownSum}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildStraightLevel3(vars: Record<string, unknown>): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoLines = partsVar === "3" ? true : partsVar === "2" ? false : rnd(0, 1) === 1;

  if (!twoLines) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do {
      c1 = useCoefficients ? rnd(1, 3) : 1; c2 = useCoefficients ? rnd(1, 3) : 1;
      xVal = rnd(10, Math.floor(175 / (c1 + c2 + 1)));
      k2 = 180 - (c1 + c2) * xVal;
      if (Math.abs(k2) > 80 || c2 * xVal + k2 < 5 || c1 * xVal < 5) { xVal = 0; }
      attempts++;
    } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 20; xVal = 80; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k2);
    const rayDeg = lineLeftDeg + ang1Val;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `− ${Math.abs(k2)}`;
    return {
      tool: "straightLine", level: "level3", rotationDeg,
      segments: [{ angleDeg: lineLeftDeg }, { angleDeg: rayDeg }, { angleDeg: rotationDeg }],
      angles: [
        { label: ang1Label, isUnknown: true, value: ang1Val, arcFromDeg: lineLeftDeg, arcToDeg: rayDeg, bisectorDeg: lineLeftDeg + ang1Val / 2 },
        { label: ang2Label, isUnknown: true, value: ang2Val, arcFromDeg: rayDeg, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + ang1Val + ang2Val / 2 },
      ],
      answer: `x = ${xVal}`,
      working: [
        { text: "Angles on a straight line sum to 180°" },
        { text: `${ang1Label} + ${ang2Label} = 180°` },
        { text: `${c1 + c2}x ${k2Str} = 180°` },
        { text: `${c1 + c2}x = ${180 - k2}°` },
        { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const c1 = useCoefficients ? rnd(1, 2) : 1, c2 = useCoefficients ? rnd(1, 2) : 1;
  const fixedAngle = rnd(20, 70);
  const remaining = 180 - fixedAngle;
  const maxX = Math.floor((remaining - 10) / (c1 + c2));
  const xVal = rnd(5, Math.max(5, maxX));
  const k = remaining - (c1 + c2) * xVal;
  const ang2Val = c1 * xVal, ang3Val = c2 * xVal + k;
  if (ang2Val < 5 || ang3Val < 5) {
    const xV = rnd(20, 70), kV = 180 - fixedAngle - 2 * xV;
    const kStr = kV >= 0 ? `+ ${kV}` : `− ${Math.abs(kV)}`;
    const r1 = lineLeftDeg + fixedAngle, r2 = lineLeftDeg + fixedAngle + xV;
    return {
      tool: "straightLine", level: "level3", rotationDeg,
      segments: [{ angleDeg: lineLeftDeg }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg }],
      angles: [
        { label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: lineLeftDeg, arcToDeg: r1, bisectorDeg: lineLeftDeg + fixedAngle / 2 },
        { label: "x", isUnknown: true, value: xV, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lineLeftDeg + fixedAngle + xV / 2 },
        { label: `x ${kStr}`, isUnknown: true, value: xV + kV, arcFromDeg: r2, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + fixedAngle + xV + (xV + kV) / 2 },
      ],
      answer: `x = ${xV}`,
      working: [
        { text: "Angles on a straight line sum to 180°" },
        { text: `${fixedAngle}° + x + x ${kStr} = 180°` },
        { text: `2x ${kStr} = ${180 - fixedAngle}°` },
        { text: `2x = ${180 - fixedAngle - kV}°` },
        { text: `x = ${xV}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }
  const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k);
  const r1 = lineLeftDeg + fixedAngle, r2 = lineLeftDeg + fixedAngle + ang2Val;
  const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
  return {
    tool: "straightLine", level: "level3", rotationDeg,
    segments: [{ angleDeg: lineLeftDeg }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: rotationDeg }],
    angles: [
      { label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: lineLeftDeg, arcToDeg: r1, bisectorDeg: lineLeftDeg + fixedAngle / 2 },
      { label: ang1Label, isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: lineLeftDeg + fixedAngle + ang2Val / 2 },
      { label: ang2Label, isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: rotationDeg + 360, bisectorDeg: lineLeftDeg + fixedAngle + ang2Val + ang3Val / 2 },
    ],
    answer: `x = ${xVal}`,
    working: [
      { text: "Angles on a straight line sum to 180°" },
      { text: `${fixedAngle}° + ${ang1Label} + ${ang2Label} = 180°` },
      { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 180°` },
      { text: `${c1 + c2}x = ${180 - fixedAngle - k}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

// ─── RIGHT ANGLE GENERATION ───────────────────────────────────────────────────
// rot → vertex position → interior quadrant → arm directions → CW sector sweep
//   rot 0: vertex bottom-left  → interior top-right    → arms: right(0°)  & up(270°)   → sweep 270→360
//   rot 1: vertex bottom-right → interior top-left     → arms: left(180°) & up(270°)   → sweep 180→270
//   rot 2: vertex top-right    → interior bottom-left  → arms: left(180°) & down(90°)  → sweep  90→180
//   rot 3: vertex top-left     → interior bottom-right → arms: right(0°)  & down(90°)  → sweep   0→90
//
// In all cases: sectorStart = rot*90 (mod 360 if needed), sectorEnd = sectorStart + 90.
// The SVG renderer places the vertex at corners[rot] and draws arms along sectorStart & sectorEnd.
function rightSector(rot: number): { sectorStart: number; sectorEnd: number } {
  // rot 0 → sweep 270→360, rot 1 → 180→270, rot 2 → 90→180, rot 3 → 0→90
  const sectorStart = ((3 - rot) * 90 + 360) % 360;  // 0→270, 1→180, 2→90, 3→0
  return { sectorStart, sectorEnd: sectorStart + 90 };
}

function buildRightLevel1(vars: Record<string, unknown>): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const useXExpr = vars.useXExpression === true;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);

  if (useXExpr) {
    let known: number, k: number, xVal: number, attempts = 0;
    do {
      known = useDecimal ? rndDecimal(5, 80) : rnd(5, 80);
      const maxK = Math.floor(90 - Math.round(known) - 5);
      k = rnd(3, Math.max(3, Math.min(maxK, 40)));
      xVal = 90 - Math.round(known) - k;
      attempts++;
    } while (xVal <= 0 && attempts < 50);
    if (xVal <= 0) { known = 50; k = 10; xVal = 30; }
    k = Math.round(k); xVal = Math.round(xVal);
    const knownRnd = Math.round(known);
    const leftIsKnown = rnd(0, 1) === 0;
    const leftSpan = leftIsKnown ? knownRnd : xVal + k;
    const rayDeg = sectorStart + leftSpan;
    const xLabel = `x + ${k}`;
    return {
      tool: "rightAngle", level: "level1", rotationDeg: rot,
      segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
      angles: [
        { label: leftIsKnown ? `${knownRnd}°` : xLabel, isUnknown: !leftIsKnown, value: leftSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + leftSpan / 2 },
        { label: leftIsKnown ? xLabel : `${knownRnd}°`, isUnknown: leftIsKnown, value: 90 - leftSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + leftSpan + (90 - leftSpan) / 2 },
      ],
      answer: `x = ${xVal}°`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${knownRnd}° + ${xLabel} = 90°` },
        { text: `${xLabel} = 90° − ${knownRnd}°` },
        { text: `${xLabel} = ${xVal + k}°` },
        { text: `x = ${xVal + k} − ${k}` },
        { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const known = useDecimal ? rndDecimal(5, 80) : rnd(5, 80);
  const knownRnd = useDecimal ? Math.round(known * 10) / 10 : Math.round(known);
  let missing = useDecimal ? Math.round((90 - knownRnd) * 10) / 10 : 90 - knownRnd;
  if (missing < 3 || missing > 87) { missing = 45; }
  const leftIsKnown = rnd(0, 1) === 0;
  const leftSpan = leftIsKnown ? knownRnd : missing;
  const rayDeg = sectorStart + leftSpan;
  const xVal = leftIsKnown ? missing : knownRnd;
  return {
    tool: "rightAngle", level: "level1", rotationDeg: rot,
    segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
    angles: [
      { label: leftIsKnown ? `${knownRnd}°` : "x", isUnknown: !leftIsKnown, value: leftSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + leftSpan / 2 },
      { label: leftIsKnown ? "x" : `${missing}°`, isUnknown: leftIsKnown, value: 90 - leftSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + leftSpan + (90 - leftSpan) / 2 },
    ],
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles in a right angle sum to 90°" },
      { text: `x = 90° − ${leftIsKnown ? knownRnd : missing}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildRightLevel2(vars: Record<string, unknown>): AngleQuestion {
  const useXExpr = vars.useXExpression === true;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);
  let a1 = rnd(10, 50), a2 = rnd(10, 50);
  while (a1 + a2 >= 85 || a1 + a2 <= 15) { a1 = rnd(10, 50); a2 = rnd(10, 50); }
  const a3 = 90 - a1 - a2;
  const vals = [a1, a2, a3];
  const ray1Deg = sectorStart + a1, ray2Deg = sectorStart + a1 + a2;
  const arcPairs: [number, number][] = [[sectorStart, ray1Deg], [ray1Deg, ray2Deg], [ray2Deg, sectorEnd]];
  const cumulative = [0, a1, a1 + a2];
  const unknownIdx = rnd(0, 2);
  const xVal = vals[unknownIdx];

  if (useXExpr) {
    const k = rnd(3, Math.min(Math.max(3, xVal - 5), 30));
    const xSolve = xVal - k;
    const xLabel = `x + ${k}`;
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSum = knownNums.reduce((s, v) => s + v, 0);
    return {
      tool: "rightAngle", level: "level2", rotationDeg: rot,
      segments: [{ angleDeg: sectorStart }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: sectorEnd }],
      angles: vals.map((v, i) => ({ label: i === unknownIdx ? xLabel : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: sectorStart + cumulative[i] + v / 2 })),
      answer: `x = ${xSolve}°`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${knownNums.join("° + ")}° + ${xLabel} = 90°` },
        { text: `${knownSum}° + ${xLabel} = 90°` },
        { text: `${xLabel} = ${xVal}°` },
        { text: `x = ${xVal} − ${k}` },
        { text: `x = ${xSolve}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownSum = 90 - xVal;
  return {
    tool: "rightAngle", level: "level2", rotationDeg: rot,
    segments: [{ angleDeg: sectorStart }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: sectorEnd }],
    angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: sectorStart + cumulative[i] + v / 2 })),
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles in a right angle sum to 90°" },
      { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 90°` },
      { text: `${knownSum}° + x = 90°` },
      { text: `x = 90° − ${knownSum}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildRightLevel3(vars: Record<string, unknown>): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);

  if (twoRegions) {
    let xVal = 0, c1 = 1, c2 = 1, k2 = 0, attempts = 0;
    do {
      c1 = useCoefficients ? rnd(1, 3) : 1; c2 = useCoefficients ? rnd(1, 3) : 1;
      xVal = rnd(5, Math.floor(85 / (c1 + c2 + 1)));
      k2 = 90 - (c1 + c2) * xVal;
      if (Math.abs(k2) > 50 || c2 * xVal + k2 < 3 || c1 * xVal < 3) xVal = 0;
      attempts++;
    } while (xVal <= 0 && attempts < 60);
    if (xVal <= 0) { c1 = 1; c2 = 1; k2 = 10; xVal = 40; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k2);
    const rayDeg = sectorStart + ang1Val;
    const k2Str = k2 >= 0 ? `+ ${k2}` : `− ${Math.abs(k2)}`;
    return {
      tool: "rightAngle", level: "level3", rotationDeg: rot,
      segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
      angles: [
        { label: ang1Label, isUnknown: true, value: ang1Val, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + ang1Val / 2 },
        { label: ang2Label, isUnknown: true, value: ang2Val, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + ang1Val + ang2Val / 2 },
      ],
      answer: `x = ${xVal}`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${ang1Label} + ${ang2Label} = 90°` },
        { text: `${c1 + c2}x ${k2Str} = 90°` },
        { text: `${c1 + c2}x = ${90 - k2}°` },
        { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const c1 = useCoefficients ? rnd(1, 2) : 1, c2 = useCoefficients ? rnd(1, 2) : 1;
  const fixedAngle = rnd(5, 40);
  const remaining = 90 - fixedAngle;
  const maxX = Math.floor((remaining - 6) / (c1 + c2));
  const xVal = rnd(3, Math.max(3, maxX));
  const k = remaining - (c1 + c2) * xVal;
  const ang2Val = c1 * xVal, ang3Val = c2 * xVal + k;
  if (ang2Val < 3 || ang3Val < 3) {
    const xV = rnd(10, 30), kV = 90 - fixedAngle - 2 * xV;
    const kStr = kV >= 0 ? `+ ${kV}` : `− ${Math.abs(kV)}`;
    const r1 = sectorStart + fixedAngle, r2 = sectorStart + fixedAngle + xV;
    return {
      tool: "rightAngle", level: "level3", rotationDeg: rot,
      segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }],
      angles: [
        { label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixedAngle / 2 },
        { label: "x", isUnknown: true, value: xV, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixedAngle + xV / 2 },
        { label: `x ${kStr}`, isUnknown: true, value: xV + kV, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixedAngle + xV + (xV + kV) / 2 },
      ],
      answer: `x = ${xV}`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${fixedAngle}° + x + x ${kStr} = 90°` },
        { text: `2x ${kStr} = ${90 - fixedAngle}°` },
        { text: `2x = ${90 - fixedAngle - kV}°` },
        { text: `x = ${xV}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }
  const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k);
  const r1 = sectorStart + fixedAngle, r2 = sectorStart + fixedAngle + ang2Val;
  const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
  return {
    tool: "rightAngle", level: "level3", rotationDeg: rot,
    segments: [{ angleDeg: sectorStart }, { angleDeg: r1 }, { angleDeg: r2 }, { angleDeg: sectorEnd }],
    angles: [
      { label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: sectorStart, arcToDeg: r1, bisectorDeg: sectorStart + fixedAngle / 2 },
      { label: ang1Label, isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: sectorStart + fixedAngle + ang2Val / 2 },
      { label: ang2Label, isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: sectorEnd, bisectorDeg: sectorStart + fixedAngle + ang2Val + ang3Val / 2 },
    ],
    answer: `x = ${xVal}`,
    working: [
      { text: "Angles in a right angle sum to 90°" },
      { text: `${fixedAngle}° + ${ang1Label} + ${ang2Label} = 90°` },
      { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 90°` },
      { text: `${c1 + c2}x = ${90 - fixedAngle - k}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

// ─── AROUND A POINT GENERATION ────────────────────────────────────────────────
function buildAroundLevel1(vars: Record<string, unknown>): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const useXExpr = vars.useXExpression === true;
  let a1: number, a2: number;
  if (useDecimal) {
    do { a1 = rndDecimal(40, 150); a2 = rndDecimal(40, 150); } while (a1 + a2 >= 340 || a1 + a2 <= 60);
  } else {
    do { a1 = rnd(40, 150); a2 = rnd(40, 150); } while (a1 + a2 >= 340 || a1 + a2 <= 60);
  }
  const a3 = useDecimal ? Math.round((360 - a1 - a2) * 10) / 10 : 360 - a1 - a2;
  const vals = [a1, a2, a3];
  const unknownIdx = 2;
  const xVal = a3;
  const startDeg = 270;
  const ray0 = startDeg, ray1 = startDeg + a1, ray2 = startDeg + a1 + a2;
  const arcPairs: [number, number][] = [[ray0, ray1], [ray1, ray2], [ray2, ray0 + 360]];
  const cumulative = [0, a1, a1 + a2];

  if (useXExpr) {
    const maxK = Math.max(5, Math.floor(xVal) - 10);
    const k = rnd(5, Math.min(maxK, 60));
    const xSolve = Math.round(xVal) - k;
    const xLabel = `x + ${k}`;
    const knownSum = Math.round((a1 + a2) * 10) / 10;
    return {
      tool: "aroundPoint", level: "level1", rotationDeg: 0,
      segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }],
      angles: vals.map((v, i) => ({ label: i === unknownIdx ? xLabel : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })),
      answer: `x = ${xSolve}°`,
      working: [
        { text: "Angles around a point sum to 360°" },
        { text: `${a1}° + ${a2}° + ${xLabel} = 360°` },
        { text: `${knownSum}° + ${xLabel} = 360°` },
        { text: `${xLabel} = ${Math.round(xVal)}°` },
        { text: `x = ${Math.round(xVal)} − ${k}` },
        { text: `x = ${xSolve}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownSum = useDecimal ? Math.round((a1 + a2) * 10) / 10 : a1 + a2;
  return {
    tool: "aroundPoint", level: "level1", rotationDeg: 0,
    segments: [{ angleDeg: ray0 }, { angleDeg: ray1 }, { angleDeg: ray2 }],
    angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })),
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles around a point sum to 360°" },
      { text: `${a1}° + ${a2}° + x = 360°` },
      { text: `${knownSum}° + x = 360°` },
      { text: `x = 360° − ${knownSum}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildAroundLevel2(vars: Record<string, unknown>): AngleQuestion {
  const useXExpr = vars.useXExpression === true;
  let a1 = rnd(30, 120), a2 = rnd(30, 120), a3 = rnd(30, 120);
  while (a1 + a2 + a3 >= 340 || a1 + a2 + a3 <= 60) { a1 = rnd(30, 120); a2 = rnd(30, 120); a3 = rnd(30, 120); }
  const a4 = 360 - a1 - a2 - a3;
  const vals = [a1, a2, a3, a4];
  const unknownIdx = rnd(0, 3);
  const xVal = vals[unknownIdx];
  const startDeg = 270;
  let cumDeg = 0;
  const rayDegs = vals.map(v => { const d = startDeg + cumDeg; cumDeg += v; return d; });
  const arcPairs: [number, number][] = vals.map((_, i) => [rayDegs[i], i < vals.length - 1 ? rayDegs[i + 1] : startDeg + 360]);
  const cumulative = [0, a1, a1 + a2, a1 + a2 + a3];

  if (useXExpr) {
    const k = rnd(3, Math.min(Math.max(3, xVal - 5), 40));
    const xSolve = xVal - k;
    const xLabel = `x + ${k}`;
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSum = knownNums.reduce((s, v) => s + v, 0);
    return {
      tool: "aroundPoint", level: "level2", rotationDeg: 0,
      segments: rayDegs.map(d => ({ angleDeg: d })),
      angles: vals.map((v, i) => ({ label: i === unknownIdx ? xLabel : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })),
      answer: `x = ${xSolve}°`,
      working: [
        { text: "Angles around a point sum to 360°" },
        { text: `${knownNums.join("° + ")}° + ${xLabel} = 360°` },
        { text: `${knownSum}° + ${xLabel} = 360°` },
        { text: `${xLabel} = ${xVal}°` },
        { text: `x = ${xVal} − ${k}` },
        { text: `x = ${xSolve}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownSum = 360 - xVal;
  return {
    tool: "aroundPoint", level: "level2", rotationDeg: 0,
    segments: rayDegs.map(d => ({ angleDeg: d })),
    angles: vals.map((v, i) => ({ label: i === unknownIdx ? "x" : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: startDeg + cumulative[i] + v / 2 })),
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles around a point sum to 360°" },
      { text: `${vals.filter((_, i) => i !== unknownIdx).join("° + ")}° + x = 360°` },
      { text: `${knownSum}° + x = 360°` },
      { text: `x = 360° − ${knownSum}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildAroundLevel3(vars: Record<string, unknown>): AngleQuestion {
  const useCoefficients = vars.useCoefficients === true;
  const partsVar = (vars.parts as string) ?? "mixed";
  const twoRegions = partsVar === "3" ? false : partsVar === "2" ? true : rnd(0, 1) === 0;
  const startDeg = 270;

  if (twoRegions) {
    let c1 = 1, c2 = 1, k2 = 0, xVal = 0;
    let found = false;
    for (let attempt = 0; attempt < 200 && !found; attempt++) {
      c1 = useCoefficients ? rnd(1, 4) : 1;
      c2 = useCoefficients ? rnd(1, 4) : 1;
      const totalC = c1 + c2;
      // xVal range derived so k2 = 360 - totalC*xVal stays in [-120, 120] and both angles >= 20
      const minXfromK = Math.ceil((360 - 120) / totalC);  // k2 <= 120  → xVal >= (360-120)/totalC
      const maxXfromK = Math.floor((360 + 120) / totalC); // k2 >= -120 → xVal <= (360+120)/totalC
      const minXfromAng = Math.ceil(20 / Math.min(c1, c2));
      const minX = Math.max(minXfromK, minXfromAng);
      if (maxXfromK < minX) continue;
      xVal = rnd(minX, maxXfromK);
      k2 = 360 - totalC * xVal;
      if (k2 === 0) continue; // expressions must have a constant term
      if (c2 * xVal + k2 < 20) continue;
      found = true;
    }
    if (!found) { c1 = 1; c2 = 1; xVal = 175; k2 = 10; }
    const ang1Val = c1 * xVal, ang2Val = c2 * xVal + k2;
    const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k2);
    const k2Str = k2 >= 0 ? `+ ${k2}` : `− ${Math.abs(k2)}`;
    return {
      tool: "aroundPoint", level: "level3", rotationDeg: 0,
      segments: [{ angleDeg: startDeg }, { angleDeg: startDeg + ang1Val }],
      angles: [
        { label: ang1Label, isUnknown: true, value: ang1Val, arcFromDeg: startDeg, arcToDeg: startDeg + ang1Val, bisectorDeg: startDeg + ang1Val / 2 },
        { label: ang2Label, isUnknown: true, value: ang2Val, arcFromDeg: startDeg + ang1Val, arcToDeg: startDeg + 360, bisectorDeg: startDeg + ang1Val + ang2Val / 2 },
      ],
      answer: `x = ${xVal}`,
      working: [
        { text: "Angles around a point sum to 360°" },
        { text: `${ang1Label} + ${ang2Label} = 360°` },
        { text: `${c1 + c2}x ${k2Str} = 360°` },
        { text: `${c1 + c2}x = ${360 - k2}°` },
        { text: `x = ${xVal}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  // 3-region branch: fixed° + c1·x + (c2·x + k) = 360
  let c1 = 1, c2 = 1, fixedAngle = 60, xVal = 40, k = 0;
  let ang2Val = 0, ang3Val = 0;
  let found = false;
  for (let attempt = 0; attempt < 300 && !found; attempt++) {
    c1 = useCoefficients ? rnd(1, 3) : 1;
    c2 = useCoefficients ? rnd(1, 3) : 1;
    fixedAngle = rnd(30, 120);
    const remaining = 360 - fixedAngle;
    const totalC = c1 + c2;
    // xVal range so k = remaining - totalC*xVal stays in [-120, 120] and both alg. angles >= 15
    const minXfromK = Math.ceil((remaining - 120) / totalC);
    const maxXfromK = Math.floor((remaining + 120) / totalC);
    const minXfromAng = Math.ceil(15 / Math.min(c1, c2));
    const minX = Math.max(minXfromK, minXfromAng);
    if (maxXfromK < minX) continue;
    xVal = rnd(minX, maxXfromK);
    k = remaining - totalC * xVal;
    if (k === 0) continue;
    ang2Val = c1 * xVal;
    ang3Val = c2 * xVal + k;
    if (ang2Val < 15 || ang3Val < 15) continue;
    found = true;
  }
  if (!found) { c1 = 1; c2 = 1; fixedAngle = 60; xVal = 145; k = 10; ang2Val = 145; ang3Val = 155; }
  const ang1Label = exprLabel(c1, 0), ang2Label = exprLabel(c2, k);
  const r1 = startDeg + fixedAngle, r2 = startDeg + fixedAngle + ang2Val;
  const kStr = k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`;
  return {
    tool: "aroundPoint", level: "level3", rotationDeg: 0,
    segments: [{ angleDeg: startDeg }, { angleDeg: r1 }, { angleDeg: r2 }],
    angles: [
      { label: `${fixedAngle}°`, isUnknown: false, value: fixedAngle, arcFromDeg: startDeg, arcToDeg: r1, bisectorDeg: startDeg + fixedAngle / 2 },
      { label: ang1Label, isUnknown: true, value: ang2Val, arcFromDeg: r1, arcToDeg: r2, bisectorDeg: startDeg + fixedAngle + ang2Val / 2 },
      { label: ang2Label, isUnknown: true, value: ang3Val, arcFromDeg: r2, arcToDeg: startDeg + 360, bisectorDeg: startDeg + fixedAngle + ang2Val + ang3Val / 2 },
    ],
    answer: `x = ${xVal}`,
    working: [
      { text: "Angles around a point sum to 360°" },
      { text: `${fixedAngle}° + ${ang1Label} + ${ang2Label} = 360°` },
      { text: `${c1 + c2}x ${kStr} + ${fixedAngle}° = 360°` },
      { text: `${c1 + c2}x = ${360 - fixedAngle - k}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function generateQuestion(tool: string, level: string, vars: Record<string, unknown>): AngleQuestion {
  if (tool === "straightLine") {
    if (level === "level1") return buildStraightLevel1(vars);
    if (level === "level2") return buildStraightLevel2(vars);
    return buildStraightLevel3(vars);
  }
  if (tool === "rightAngle") {
    if (level === "level1") return buildRightLevel1(vars);
    if (level === "level2") return buildRightLevel2(vars);
    return buildRightLevel3(vars);
  }
  if (level === "level1") return buildAroundLevel1(vars);
  if (level === "level2") return buildAroundLevel2(vars);
  return buildAroundLevel3(vars);
}

function getUniqueQuestion(tool: string, level: string, vars: Record<string, unknown>, used: Set<string>): AngleQuestion {
  let q: AngleQuestion, attempts = 0;
  do { q = generateQuestion(tool, level, vars); } while (used.has(`${q.id}`) && ++attempts < 100);
  used.add(`${q.id}`);
  return q;
}

// ─── SVG HELPERS ──────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
function toRad(d: number) { return d * DEG; }
function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))];
}
function sectorPath(cx: number, cy: number, r: number, f: number, t: number) {
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, t);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${t - f > 180 ? 1 : 0} 1 ${x2},${y2} Z`;
}
function arcPath(cx: number, cy: number, r: number, f: number, t: number) {
  const [x1, y1] = pt(cx, cy, r, f), [x2, y2] = pt(cx, cy, r, t);
  return `M${x1},${y1} A${r},${r} 0 ${t - f > 180 ? 1 : 0} 1 ${x2},${y2}`;
}
function estTW(label: string, fs: number) { return label.length * fs * 0.58 + fs * 0.5; }

// ─── SVG DIAGRAM ──────────────────────────────────────────────────────────────
function AngleDiagram({ q, showAnswer, small = false }: { q: AngleQuestion; showAnswer: boolean; small?: boolean }) {
  const size = small ? 240 : 340;
  const fontSize = small ? 15 : 19;

  // ── Right angle: vertex sits at a corner, arms span the full canvas ──────────
  if (q.tool === "rightAngle") {
    // The SVG canvas is (size × size). We place the vertex at a corner with a small
    // inset so the square symbol isn't clipped. Arms extend to the far edges.
    const inset = small ? 28 : 48;   // vertex offset from corner
    const armLen = size - inset;      // how far the arms reach

    // rot 0: vertex bottom-left  → corner = (inset, size-inset)  base=right(0°), top=up(270°)
    // rot 1: vertex bottom-right → corner = (size-inset, size-inset) base=up(270°), top=left(180°)
    // rot 2: vertex top-right    → corner = (size-inset, inset)  base=left(180°), top=down(90°)
    // rot 3: vertex top-left     → corner = (inset, inset)       base=down(90°), top=right(0°)
    const rot = q.rotationDeg; // 0–3
    const corners = [
      [inset, size - inset],       // rot 0: bottom-left
      [size - inset, size - inset], // rot 1: bottom-right
      [size - inset, inset],        // rot 2: top-right
      [inset, inset],               // rot 3: top-left
    ];
    const [vx, vy] = corners[rot];

    // The two outer arm directions (sectorStart and sectorEnd from generation)
    const sectorStart = q.segments[0].angleDeg;
    const sectorEnd = q.segments[q.segments.length - 1].angleDeg;

    // Draw arm endpoints
    const [b1x, b1y] = pt(vx, vy, armLen, sectorStart);
    const [b2x, b2y] = pt(vx, vy, armLen, sectorEnd);

    // Arc + label radii proportional to size
    const arcRKnown = size * 0.18;
    const arcRUnknown = size * 0.23;
    const labelOffK = size * 0.09;
    const labelOffU = size * 0.10;

    // Square symbol size
    const sqSz = size * 0.085;
    const s1rad = toRad(sectorStart), s2rad = toRad(sectorEnd);
    const sqP1 = [vx + Math.cos(s1rad) * sqSz, vy + Math.sin(s1rad) * sqSz];
    const sqP2 = [vx + Math.cos(s1rad) * sqSz + Math.cos(s2rad) * sqSz, vy + Math.sin(s1rad) * sqSz + Math.sin(s2rad) * sqSz];
    const sqP3 = [vx + Math.cos(s2rad) * sqSz, vy + Math.sin(s2rad) * sqSz];

    // Interior rays
    const interiorSegs = q.segments.slice(1, -1);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Shaded unknown sectors */}
        {q.angles.map((ang, i) => ang.isUnknown ? (
          <path key={`sh${i}`} d={sectorPath(vx, vy, arcRUnknown, ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.7" stroke="none" />
        ) : null)}

        {/* Outer arms */}
        <line x1={vx} y1={vy} x2={b1x} y2={b1y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={b2x} y2={b2y} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />

        {/* Interior rays */}
        {interiorSegs.map((seg, i) => {
          const [px, py] = pt(vx, vy, armLen, seg.angleDeg);
          return <line key={`ray${i}`} x1={vx} y1={vy} x2={px} y2={py} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />;
        })}

        {/* Right angle square symbol */}
        <polyline
          points={`${sqP1[0]},${sqP1[1]} ${sqP2[0]},${sqP2[1]} ${sqP3[0]},${sqP3[1]}`}
          fill="none" stroke="#1e293b" strokeWidth={small ? 1.5 : 2.5} strokeLinejoin="miter"
        />

        {/* Arc strokes */}
        {q.angles.map((ang, i) => {
          const r = ang.isUnknown ? arcRUnknown : arcRKnown;
          return <path key={`arc${i}`} d={arcPath(vx, vy, r, ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />;
        })}

        {/* Labels */}
        {q.angles.map((ang, i) => {
          const r = ang.isUnknown ? arcRUnknown : arcRKnown;
          const off = ang.isUnknown ? labelOffU : labelOffK;
          const lr = r + off + (small ? 6 : 10);
          const [lx, ly] = pt(vx, vy, lr, ang.bisectorDeg);
          const label = ang.isUnknown && !showAnswer ? ang.label : ang.isUnknown ? `${ang.value}°` : ang.label;
          const tw = estTW(label, fontSize), th = fontSize * 1.3;
          return (
            <g key={`lbl${i}`}>
              <rect x={lx - tw / 2 - 2} y={ly - th / 2 - 1} width={tw + 4} height={th + 2} rx={3} fill="white" fillOpacity="0.9" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize}
                fontStyle={ang.isUnknown && !showAnswer ? "italic" : "normal"}
                fontWeight={ang.isUnknown ? "bold" : "600"}
                fill={ang.isUnknown ? "#1d4ed8" : "#111827"}>{label}</text>
            </g>
          );
        })}

        {/* Vertex dot */}
        <circle cx={vx} cy={vy} r={small ? 3 : 4} fill="#1e293b" />
      </svg>
    );
  }

  // ── Straight line & Around a point: centred diagram ──────────────────────────
  const margin = small ? 22 : 60;
  const vbSize = size + margin * 2;
  const cx = vbSize / 2, cy = vbSize / 2;
  const lineLen = size * 0.46;
  const arcRKnown = size * 0.17, arcRUnknown = size * 0.21;
  const labelOffK = size * 0.085, labelOffU = size * 0.095;

  return (
    <svg width={vbSize} height={vbSize} viewBox={`0 0 ${vbSize} ${vbSize}`} style={{ overflow: "visible" }}>
      {/* Around-a-point: dashed circle guide */}
      {q.tool === "aroundPoint" && (
        <circle cx={cx} cy={cy} r={lineLen} fill="none" stroke="#e5e7eb" strokeWidth={small ? 1 : 1.5} strokeDasharray="4 4" />
      )}

      {/* Shaded sectors */}
      {q.angles.map((ang, i) => !ang.isUnknown ? null : (
        <path key={`sh${i}`} d={sectorPath(cx, cy, arcRUnknown, ang.arcFromDeg, ang.arcToDeg)} fill="#bfdbfe" fillOpacity="0.7" stroke="none" />
      ))}

      {/* Rays */}
      {q.segments.map((seg, i) => {
        const [px, py] = pt(cx, cy, lineLen, seg.angleDeg);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="#1e293b" strokeWidth={small ? 2 : 3} strokeLinecap="round" />;
      })}

      {/* Arc strokes */}
      {q.angles.map((ang, i) => {
        const r = ang.isUnknown ? arcRUnknown : arcRKnown;
        return <path key={`arc${i}`} d={arcPath(cx, cy, r, ang.arcFromDeg, ang.arcToDeg)} fill="none" stroke={ang.isUnknown ? "#3b82f6" : "#374151"} strokeWidth={small ? 1.5 : 2.5} />;
      })}

      {/* Labels */}
      {q.angles.map((ang, i) => {
        const r = ang.isUnknown ? arcRUnknown : arcRKnown;
        const off = ang.isUnknown ? labelOffU : labelOffK;
        const lr = r + off + (small ? 8 : 12);
        const [lx, ly] = pt(cx, cy, lr, ang.bisectorDeg);
        const label = ang.isUnknown && !showAnswer ? ang.label : ang.isUnknown ? `${ang.value}°` : ang.label;
        const tw = estTW(label, fontSize), th = fontSize * 1.3;
        return (
          <g key={`lbl${i}`}>
            <rect x={lx - tw / 2 - 2} y={ly - th / 2 - 1} width={tw + 4} height={th + 2} rx={3} fill="white" fillOpacity="0.85" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize}
              fontStyle={ang.isUnknown && !showAnswer ? "italic" : "normal"}
              fontWeight={ang.isUnknown ? "bold" : "600"}
              fill={ang.isUnknown ? "#1d4ed8" : "#111827"}>{label}</text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={small ? 3 : 4} fill="#1e293b" />
    </svg>
  );
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {(["level1", "level2", "level3"] as const).map((val, i) => {
      const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
      return (
        <button key={val} onClick={() => onChange(val)}
          className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
          Level {i + 1}
        </button>
      );
    })}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: { dropdown: any; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map((opt: any) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const VariablesSection = ({ variables, values, onChange }: { variables: any[]; values: Record<string, unknown>; onChange: (k: string, v: boolean) => void }) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !(values[v.key]))}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
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
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
        Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!dropdown && variables.length === 0 && <p className="text-sm text-gray-400">No options at this level.</p>}
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
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: any) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform ${colorOpen ? "rotate-90" : ""}`}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default", "blue", "pink", "yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {s}
                {colorScheme === s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

function getQuestionBg(cs: string) { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff"); }
function getStepBg(cs: string) { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6"); }

const TOOL_TITLES: Record<string, string> = {
  straightLine: "Straight Line",
  rightAngle: "Right Angle",
  aroundPoint: "Around a Point",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BasicAngleFacts() {
  const navigate = useNavigate();
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolKey[];
  const [currentTool, setCurrentTool] = useState<ToolKey>("rightAngle");
  const [mode, setMode] = useState("whiteboard");
  const [difficulty, setDifficulty] = useState("level1");

  // Per-tool, per-level state
  const makeDefaultLevelVars = (tool: ToolKey) => {
    const ds = TOOL_CONFIG.tools[tool].difficultySettings as any;
    const out: Record<string, Record<string, unknown>> = {};
    ["level1", "level2", "level3"].forEach(lv => {
      out[lv] = {};
      (ds[lv]?.variables ?? []).forEach((v: any) => { out[lv][v.key] = v.defaultValue; });
    });
    return out;
  };
  const makeDefaultLevelDDs = (tool: ToolKey) => {
    const ds = TOOL_CONFIG.tools[tool].difficultySettings as any;
    return {
      level1: ds.level1?.dropdown?.defaultValue ?? "",
      level2: ds.level2?.dropdown?.defaultValue ?? "",
      level3: ds.level3?.dropdown?.defaultValue ?? "",
    };
  };

  const [levelVarsByTool, setLevelVarsByTool] = useState<Record<ToolKey, Record<string, Record<string, unknown>>>>(() =>
    Object.fromEntries(toolKeys.map(k => [k, makeDefaultLevelVars(k)])) as any
  );
  const [levelDDsByTool, setLevelDDsByTool] = useState<Record<ToolKey, Record<string, string>>>(() =>
    Object.fromEntries(toolKeys.map(k => [k, makeDefaultLevelDDs(k)])) as any
  );

  const levelVars = levelVarsByTool[currentTool];
  const levelDDs = levelDDsByTool[currentTool];

  const setLevelVar = (lv: string, k: string, v: unknown) =>
    setLevelVarsByTool(p => ({ ...p, [currentTool]: { ...p[currentTool], [lv]: { ...p[currentTool][lv], [k]: v } } }));
  const setLevelDD = (lv: string, v: string) =>
    setLevelDDsByTool(p => ({ ...p, [currentTool]: { ...p[currentTool], [lv]: v } }));

  const getToolDS = () => (TOOL_CONFIG.tools[currentTool].difficultySettings as any);
  const getDDConfig = () => getToolDS()[difficulty]?.dropdown ?? null;
  const getVarsConfig = () => getToolDS()[difficulty]?.variables ?? [];

  const buildVars = (lv: string): Record<string, unknown> => {
    const ddCfg = getToolDS()[lv]?.dropdown;
    const ddKey = ddCfg?.key ?? "numberType";
    const ddVal = levelDDs[lv] ?? ddCfg?.defaultValue ?? "";
    return { ...(levelVars[lv] ?? {}), [ddKey]: ddVal };
  };

  const [question, setQuestion] = useState<AngleQuestion | null>(null);
  const [showWBAnswer, setShowWBAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [worksheet, setWorksheet] = useState<AngleQuestion[]>([]);
  const [showWSAnswers, setShowWSAnswers] = useState(false);
  const [isDiff, setIsDiff] = useState(false);
  const [numCols, setNumCols] = useState(2);
  const [wsFontSize, setWsFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const newQuestion = () => {
    setQuestion(generateQuestion(currentTool, difficulty, buildVars(difficulty)));
    setShowWBAnswer(false);
    setShowAnswer(false);
  };

  const generateWorksheet = () => {
    const used = new Set<string>();
    const qs: AngleQuestion[] = [];
    if (isDiff) {
      ["level1", "level2", "level3"].forEach(lv => {
        for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, lv, buildVars(lv), used));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) qs.push(getUniqueQuestion(currentTool, difficulty, buildVars(difficulty), used));
    }
    setWorksheet(qs);
    setShowWSAnswers(false);
  };

  useEffect(() => { if (mode !== "worksheet") newQuestion(); }, [difficulty, currentTool]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const canIncrease = wsFontSize < 3, canDecrease = wsFontSize > 0;

  const stdQOProps = {
    variables: getVarsConfig(),
    variableValues: levelVars[difficulty] ?? {},
    onVariableChange: (k: string, v: unknown) => setLevelVar(difficulty, k, v),
    dropdown: getDDConfig(),
    dropdownValue: levelDDs[difficulty] ?? getDDConfig()?.defaultValue ?? "",
    onDropdownChange: (v: string) => setLevelDD(difficulty, v),
  };

  const diffQOProps = {
    toolSettings: TOOL_CONFIG.tools[currentTool],
    levelVariables: levelVars,
    onLevelVariableChange: setLevelVar,
    levelDropdowns: levelDDs,
    onLevelDropdownChange: setLevelDD,
  };

  const renderQCell = (q: AngleQuestion, idx: number, bgOverride?: string) => (
    <div className="rounded-lg p-3 shadow flex flex-col items-center gap-2" style={{ backgroundColor: bgOverride ?? stepBg }}>
      <span className="text-base font-bold text-gray-700 self-start">{idx + 1}.</span>
      <AngleDiagram q={q} showAnswer={showWSAnswers} small />
      {showWSAnswers && <span className="text-base font-bold" style={{ color: "#059669" }}>{q.answer}</span>}
    </div>
  );

  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="20" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
          </div>
          {isDiff ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
          <button onClick={() => setIsDiff(!isDiff)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDiff ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        {!isDiff && (
          <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
            <DifficultyToggle value={difficulty} onChange={setDifficulty} />
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Columns:</label>
              <input type="number" min="1" max="4" value={numCols}
                onChange={e => setNumCols(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-4">
          <button onClick={generateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate Worksheet
          </button>
          {worksheet.length > 0 && (
            <button onClick={() => setShowWSAnswers(!showWSAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {showWSAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          )}
        </div>
      </div>
    );
    return (
      <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3">
            <button onClick={newQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === "whiteboard" ? setShowWBAnswer(!showWBAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWBAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const toolTitle = TOOL_TITLES[currentTool];

  const renderWhiteboard = () => (
    <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: qBg }}>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-black">{toolTitle}</span>
        {showWBAnswer && question && (
          <span className="text-5xl font-bold ml-4" style={{ color: "#166534" }}>{question.answer}</span>
        )}
      </div>
      <div className="flex gap-6">
        <div className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ width: "420px", height: "420px", backgroundColor: stepBg }}>
          {question
            ? <AngleDiagram q={question} showAnswer={showWBAnswer} />
            : <span className="text-gray-400 text-xl">Generate a question</span>}
        </div>
        <div className="flex-1 rounded-xl" style={{ minHeight: "420px", backgroundColor: stepBg }} />
      </div>
    </div>
  );

  const renderWorkedExample = () => (
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: qBg }}>
      {question ? (
        <>
          <div className="text-center mb-6">
            <span className="text-5xl font-bold text-black">{toolTitle}</span>
          </div>
          <div className="flex justify-center mb-6">
            <AngleDiagram q={question} showAnswer={showAnswer} />
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
                <span className="text-4xl font-bold" style={{ color: "#166534" }}>{question.answer}</span>
              </div>
            </>
          )}
        </>
      ) : <div className="text-center text-gray-400 text-4xl py-16">Generate a question</div>}
    </div>
  );

  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet above</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWsFontSize(f => f - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          <ChevronDown size={20} />
        </button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWsFontSize(f => f + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          <ChevronUp size={20} />
        </button>
      </div>
    );
    if (isDiff) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8 text-black">{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {["level1", "level2", "level3"].map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div className="space-y-3">{lqs.map((q, idx) => <div key={idx}>{renderQCell(q, idx, c.fill)}</div>)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8 text-black">{toolTitle} — Worksheet</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}>
          {worksheet.map((q, idx) => <div key={idx}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

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

          {/* Sub-tool tabs */}
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k => (
              <button key={k} onClick={() => { setCurrentTool(k); setWorksheet([]); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8">
            <div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} />
          </div>

          {/* Mode tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {[["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {renderControlBar()}
          {mode === "whiteboard" && renderWhiteboard()}
          {mode === "single" && renderWorkedExample()}
          {mode === "worksheet" && renderWorksheet()}
        </div>
      </div>
    </>
  );
}
