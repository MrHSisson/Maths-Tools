import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── NAVIGATION ───────────────────────────────────────────────────────────────
// Home button uses window.location.href = "/" — the parent app handles routing.
// No React Router / useNavigate — tools never wrap themselves in a router.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_CONFIG = {
  pageTitle: "Basic Angle Facts",
  tools: {
    rightAngle: {
      name: "Right Angle",
      useSubstantialBoxes: true,
      variables: [] as { key: string; label: string; defaultValue: boolean }[],
      dropdown: null as null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
        },
        level2: {
          dropdown: null as null,
          variables: [
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
        },
        level3: {
          dropdown: {
            key: "parts", label: "Parts",
            options: [{ value: "mixed", label: "Mixed" }, { value: "2", label: "2 parts" }, { value: "3", label: "3 parts" }],
            defaultValue: "mixed",
          },
          variables: [
            { key: "useCoefficients", label: "Include coefficients (e.g. 2x)", defaultValue: false },
            { key: "showSquare", label: "Show right angle square symbol", defaultValue: true },
          ],
        },
      },
    },
    straightLine: {
      name: "Straight Line",
      useSubstantialBoxes: true,
      variables: [] as { key: string; label: string; defaultValue: boolean }[],
      dropdown: null as null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
            { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false },
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
        },
        level2: {
          dropdown: null as null,
          variables: [
            { key: "fixedRotation", label: "Always horizontal (no rotation)", defaultValue: false },
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
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
      useSubstantialBoxes: true,
      variables: [] as { key: string; label: string; defaultValue: boolean }[],
      dropdown: null as null,
      difficultySettings: {
        level1: {
          dropdown: {
            key: "numberType", label: "Number Type",
            options: [{ value: "integer", label: "Integers" }, { value: "decimal", label: "Decimals" }],
            defaultValue: "integer",
          },
          variables: [
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
        },
        level2: {
          dropdown: null as null,
          variables: [
          ],
          multiSelect: {
              key: "exprType",
              label: "Unknown as expression",
              options: [
                { value: "coefficient", label: "Coefficient (e.g. 2x)",   defaultActive: false },
                { value: "constant",    label: "Constant (e.g. x + 14)",  defaultActive: false },
                { value: "both",        label: "Both (e.g. 2x + 30)",     defaultActive: false },
              ],
            },
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
  } as Record<string, {
    name: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: null;
    difficultySettings: Record<string, {
      dropdown: { key: string; label: string; options: { value: string; label: string }[]; defaultValue: string } | null;
      variables: { key: string; label: string; defaultValue: boolean }[];
      multiSelect?: { key: string; label: string; options: { value: string; label: string; defaultActive: boolean }[] };
    }>;
  }>,
};

type ToolKey = keyof typeof TOOL_CONFIG.tools;
type DifficultyLevel = "level1" | "level2" | "level3";

// ─── INFO SECTIONS ────────────────────────────────────────────────────────────
const INFO_SECTIONS = [
  {
    title: "Right Angle", icon: "⊾",
    content: [
      { label: "Overview", detail: "Angles inside a right angle always sum to 90°. The right angle square symbol can be toggled off to reduce clutter — a text note replaces it." },
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
      { label: "Expression Types (L1 & L2)", detail: "Toggle independently: Coefficient (e.g. 2x), Constant (e.g. x + 14), Both (e.g. 2x + 30). Any combination can be active — the question picks randomly from active types." },
      { label: "Parts (L3)", detail: "Control whether the question uses 2 or 3 angle regions, or mixed." },
      { label: "Coefficients (L3)", detail: "Algebraic terms may include coefficients such as 2x or 3x." },
      { label: "Fixed Rotation (Straight Line)", detail: "When on, the straight line is always horizontal." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question with blank working space. Visualiser and fullscreen available." },
      { label: "Worked Example", detail: "Step-by-step solution revealed on demand." },
      { label: "Worksheet", detail: "Grid of questions. Supports differentiated 3-column layout with PDF export." },
    ],
  },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };
const LV_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};

// ─── UTILITY ──────────────────────────────────────────────────────────────────
function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndDecimal(a: number, b: number) { return Math.round((Math.random() * (b - a) + a) * 10) / 10; }
function exprLabel(c: number, k: number) {
  const base = c === 1 ? "x" : `${c}x`;
  if (k === 0) return base;
  return k > 0 ? `${base} + ${k}` : `${base} − ${Math.abs(k)}`;
}

// Pick which expression type to use based on active toggles.
type ExprType = "coefficient" | "constant" | "both" | null;
function pickExprType(vars: Record<string, unknown>): ExprType {
  const active: ExprType[] = [];
  if (vars.coefficient) active.push("coefficient");
  if (vars.constant)    active.push("constant");
  if (vars.both)        active.push("both");
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}
function getQuestionBg(cs: string) { return ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff"); }
function getStepBg(cs: string)     { return ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6"); }

// ─── QUESTION INTERFACE ───────────────────────────────────────────────────────
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
  difficulty?: string;      // mirrors level — stamped by generateQuestion
  key?: string;             // unique key — stamped by generateQuestion
  rotationDeg: number;
  segments: SegmentDef[];
  angles: AngleDef[];
  answer: string;
  working: { text: string }[];
  id: number;
  _qo?: unknown;            // QOSnapshot stamped by shell — do not set manually
  showSquare?: boolean;     // right angle only — whether to draw the square symbol
}

// ─── QO SNAPSHOT (for per-cell regen) ────────────────────────────────────────
interface QOSnapshot {
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  dropdownValue: string;
}

// ─── STRAIGHT LINE GENERATION ─────────────────────────────────────────────────
function buildStraightLevel1(vars: Record<string, unknown>): AngleQuestion {
  const useDecimal = vars.numberType === "decimal";
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rotations = [0, 45, 90, 135];
  const rotationDeg = vars.fixedRotation ? 0 : rotations[rnd(0, rotations.length - 1)];
  const lineLeftDeg = rotationDeg + 180;

  if (useXExpr) {
    let known: number, k: number, c: number, xVal: number, attempts = 0;
    do {
      known = useDecimal ? rndDecimal(20, 140) : rnd(20, 140);
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
      k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.max(5, Math.min(Math.floor(180 - known - 10 * c), 60))) : 0;
      xVal = Math.round((180 - Math.round(known) - k) / c);
      attempts++;
    } while ((xVal <= 0 || c * xVal + k < 5) && attempts < 50);
    if (xVal <= 0) { known = 90; k = 0; c = 1; xVal = 90; }
    k = Math.round(k); xVal = Math.round(xVal);
    const leftIsKnown = rnd(0, 1) === 0;
    const leftAngle = leftIsKnown ? Math.round(known) : c * xVal + k;
    const rayDeg = lineLeftDeg + leftAngle;
    const xLabel = exprLabel(c, k);
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
        { text: `${xLabel} = ${180 - Math.round(known)}°` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xVal}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xVal} ÷ ${c}` }] : []),
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
  const xVal = missing;
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
      { text: `x = 180° − ${known}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildStraightLevel2(vars: Record<string, unknown>): AngleQuestion {
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
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
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
    const k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(Math.max(5, xVal - 10 * c), 50)) : 0;
    const xSolve = Math.round((xVal - k) / c);
    const xLabel = exprLabel(c, k);
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
        { text: `${xLabel} = ${c * xSolve + k}°` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xSolve}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xSolve} ÷ ${c}` }] : []),
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
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
  const rot = rnd(0, 3);
  const { sectorStart, sectorEnd } = rightSector(rot);

  if (useXExpr) {
    let known: number, k: number, c: number, xVal: number, attempts = 0;
    do {
      known = useDecimal ? rndDecimal(5, 80) : rnd(5, 80);
      c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
      k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.max(3, Math.min(Math.floor(90 - Math.round(known) - 5 * c), 40))) : 0;
      xVal = Math.round((90 - Math.round(known) - k) / c);
      attempts++;
    } while (xVal <= 0 && attempts < 50);
    if (xVal <= 0) { known = 50; k = 0; c = 1; xVal = 40; }
    k = Math.round(k); xVal = Math.round(xVal);
    const knownRnd = Math.round(known);
    const leftIsKnown = rnd(0, 1) === 0;
    const leftSpan = leftIsKnown ? knownRnd : c * xVal + k;
    const rayDeg = sectorStart + leftSpan;
    const xLabel = exprLabel(c, k);
    return {
      tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
      angles: [
        { label: leftIsKnown ? `${knownRnd}°` : xLabel, isUnknown: !leftIsKnown, value: leftSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + leftSpan / 2 },
        { label: leftIsKnown ? xLabel : `${knownRnd}°`, isUnknown: leftIsKnown, value: 90 - leftSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + leftSpan + (90 - leftSpan) / 2 },
      ],
      answer: `x = ${xVal}°`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${knownRnd}° + ${xLabel} = 90°` },
        { text: `${xLabel} = ${90 - knownRnd}°` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xVal}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xVal} ÷ ${c}` }] : []),
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
  const xVal = missing;
  return {
    tool: "rightAngle", level: "level1", rotationDeg: rot, showSquare: vars.showSquare !== false,
    segments: [{ angleDeg: sectorStart }, { angleDeg: rayDeg }, { angleDeg: sectorEnd }],
    angles: [
      { label: leftIsKnown ? `${knownRnd}°` : "x", isUnknown: !leftIsKnown, value: leftSpan, arcFromDeg: sectorStart, arcToDeg: rayDeg, bisectorDeg: sectorStart + leftSpan / 2 },
      { label: leftIsKnown ? "x" : `${missing}°`, isUnknown: leftIsKnown, value: 90 - leftSpan, arcFromDeg: rayDeg, arcToDeg: sectorEnd, bisectorDeg: sectorStart + leftSpan + (90 - leftSpan) / 2 },
    ],
    answer: `x = ${xVal}°`,
    working: [
      { text: "Angles in a right angle sum to 90°" },
      { text: `x = 90° − ${knownRnd}°` },
      { text: `x = ${xVal}°` },
    ],
    id: Math.floor(Math.random() * 1_000_000),
  };
}

function buildRightLevel2(vars: Record<string, unknown>): AngleQuestion {
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
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
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
    const k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(Math.max(3, xVal - 5 * c), 30)) : 0;
    const xSolve = Math.round((xVal - k) / c);
    const xLabel = exprLabel(c, k);
    const knownNums = vals.filter((_, i) => i !== unknownIdx);
    const knownSum = knownNums.reduce((s, v) => s + v, 0);
    return {
      tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false,
      segments: [{ angleDeg: sectorStart }, { angleDeg: ray1Deg }, { angleDeg: ray2Deg }, { angleDeg: sectorEnd }],
      angles: vals.map((v, i) => ({ label: i === unknownIdx ? xLabel : `${v}°`, isUnknown: i === unknownIdx, value: v, arcFromDeg: arcPairs[i][0], arcToDeg: arcPairs[i][1], bisectorDeg: sectorStart + cumulative[i] + v / 2 })),
      answer: `x = ${xSolve}°`,
      working: [
        { text: "Angles in a right angle sum to 90°" },
        { text: `${knownNums.join("° + ")}° + ${xLabel} = 90°` },
        { text: `${knownSum}° + ${xLabel} = 90°` },
        { text: `${xLabel} = ${c * xSolve + k}°` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xSolve}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xSolve} ÷ ${c}` }] : []),
        { text: `x = ${xSolve}°` },
      ],
      id: Math.floor(Math.random() * 1_000_000),
    };
  }

  const knownSum = 90 - xVal;
  return {
    tool: "rightAngle", level: "level2", rotationDeg: rot, showSquare: vars.showSquare !== false,
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
      tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false,
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
      tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false,
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
    tool: "rightAngle", level: "level3", rotationDeg: rot, showSquare: vars.showSquare !== false,
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
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
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
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
    const k = (exprType === "constant" || exprType === "both") ? rnd(5, Math.min(maxK, 60)) : 0;
    const xSolve = Math.round((Math.round(xVal) - k) / c);
    const xLabel = exprLabel(c, k);
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
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xSolve}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xSolve} ÷ ${c}` }] : []),
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
  const exprType = pickExprType(vars);
  const useXExpr = exprType !== null;
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
    const c = (exprType === "coefficient" || exprType === "both") ? rnd(2, 3) : 1;
    const k = (exprType === "constant" || exprType === "both") ? rnd(3, Math.min(Math.max(3, xVal - 5 * c), 40)) : 0;
    const xSolve = Math.round((xVal - k) / c);
    const xLabel = exprLabel(c, k);
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
        { text: `${xLabel} = ${c * xSolve + k}°` },
        ...(k !== 0 ? [{ text: `${c === 1 ? "" : `${c}`}x = ${c * xSolve}°` }] : []),
        ...(c !== 1 ? [{ text: `x = ${c * xSolve} ÷ ${c}` }] : []),
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
  let q: AngleQuestion;
  if (tool === "straightLine") {
    if (level === "level1") q = buildStraightLevel1(vars);
    else if (level === "level2") q = buildStraightLevel2(vars);
    else q = buildStraightLevel3(vars);
  } else if (tool === "rightAngle") {
    if (level === "level1") q = buildRightLevel1(vars);
    else if (level === "level2") q = buildRightLevel2(vars);
    else q = buildRightLevel3(vars);
  } else {
    if (level === "level1") q = buildAroundLevel1(vars);
    else if (level === "level2") q = buildAroundLevel2(vars);
    else q = buildAroundLevel3(vars);
  }
  // Stamp difficulty and key for shell regen machinery
  q.difficulty = level;
  q.key = `${tool}-${level}-${q.id}`;
  return q;
}

function getUniqueQuestion(tool: string, level: string, vars: Record<string, unknown>, used: Set<string>): AngleQuestion {
  let q: AngleQuestion, attempts = 0;
  do { q = generateQuestion(tool, level, vars); } while (used.has(q.key ?? `${q.id}`) && ++attempts < 100);
  used.add(q.key ?? `${q.id}`);
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
function AngleDiagram({ q, showAnswer, small = false, dataIndex }: { q: AngleQuestion; showAnswer: boolean; small?: boolean; dataIndex?: number }) {
  const size = small ? 300 : 340;
  const targetFontPx = small ? 20 : 30; // desired on-screen font size in px

  // ── Right angle: vertex sits at a corner, arms span the full canvas ──────────
  if (q.tool === "rightAngle") {
    // The SVG canvas is (size × size). We place the vertex at a corner with a small
    // inset so the square symbol isn't clipped. Arms extend to the far edges.
    const inset = small ? 22 : 48;   // vertex offset from corner
    const margin = small ? 24 : 50;  // extra canvas space for labels
    const armLen = size - inset - margin * 0.3; // arms don't reach the full edge

    // rot 0: vertex bottom-left  → corner = (inset, size-inset)  base=right(0°), top=up(270°)
    // rot 1: vertex bottom-right → corner = (size-inset, size-inset) base=up(270°), top=left(180°)
    // rot 2: vertex top-right    → corner = (size-inset, inset)  base=left(180°), top=down(90°)
    // rot 3: vertex top-left     → corner = (inset, inset)       base=down(90°), top=right(0°)
    const rot = q.rotationDeg; // 0–3
    const corners = [
      [inset, size - inset],        // rot 0: bottom-left
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

    // Compute tight bounding box from all geometry points + label positions
    const geomPts: number[][] = [[vx, vy], [b1x, b1y], [b2x, b2y]];
    interiorSegs.forEach(seg => { const [px, py] = pt(vx, vy, armLen, seg.angleDeg); geomPts.push([px, py]); });
    q.angles.forEach(ang => {
      const r = ang.isUnknown ? arcRUnknown : arcRKnown;
      const off = ang.isUnknown ? labelOffU : labelOffK;
      const lr = r + off + (small ? 20 : 30);
      const [lx, ly] = pt(vx, vy, lr, ang.bisectorDeg);
      geomPts.push([lx - 30, ly - 15], [lx + 30, ly + 15]);
    });
    const pad = small ? 12 : 20;
    const bMinX = Math.min(...geomPts.map(p => p[0])) - pad;
    const bMinY = Math.min(...geomPts.map(p => p[1])) - pad;
    const bMaxX = Math.max(...geomPts.map(p => p[0])) + pad;
    const bMaxY = Math.max(...geomPts.map(p => p[1])) + pad;
    const bRawW = bMaxX - bMinX, bRawH = bMaxY - bMinY;
    const bDim = Math.max(bRawW, bRawH);
    const bCx = (bMinX + bMaxX) / 2, bCy = (bMinY + bMaxY) / 2;
    const bW = bDim, bH = bDim;
    // Font size in SVG coords so labels appear at targetFontPx on screen
    const containerPx = small ? 266 : 460;
    const fontSize = targetFontPx * bDim / containerPx;

    return (
      <svg width="100%" height="100%" viewBox={`${bCx - bW/2} ${bCy - bH/2} ${bW} ${bH}`} style={{ overflow: "visible" }} {...(dataIndex !== undefined ? { "data-q-index": dataIndex } : {})}>
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

        {/* Right angle square symbol — only when showSquare is true */}
        {q.showSquare !== false && (
          <polyline
            points={`${sqP1[0]},${sqP1[1]} ${sqP2[0]},${sqP2[1]} ${sqP3[0]},${sqP3[1]}`}
            fill="none" stroke="#1e293b" strokeWidth={small ? 1.5 : 2.5} strokeLinejoin="miter"
          />
        )}

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
              <rect x={lx - tw / 2 - 2} y={ly - th / 2 - 1} width={tw + 4} height={th + 2} rx={3} fill="white" fillOpacity="0.9" stroke="#9ca3af" strokeWidth={0.5} />
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
  const margin = small ? 18 : 60;
  const vbSize = size + margin * 2;
  const cx = vbSize / 2, cy = vbSize / 2;
  const lineLen = size * 0.62;
  const arcRKnown = size * 0.22, arcRUnknown = size * 0.28;
  const labelOffK = size * 0.11, labelOffU = size * 0.12;

  // Compute tight bounding box from arm endpoints and label positions
  const ctrPts: number[][] = [[cx, cy]];
  q.segments.forEach(seg => {
    const [px, py] = pt(cx, cy, lineLen, seg.angleDeg);
    ctrPts.push([px, py]);
  });
  q.angles.forEach(ang => {
    const r = ang.isUnknown ? arcRUnknown : arcRKnown;
    const off = ang.isUnknown ? labelOffU : labelOffK;
    const lr = r + off + (small ? 28 : 40);
    const [lx, ly] = pt(cx, cy, lr, ang.bisectorDeg);
    ctrPts.push([lx - 36, ly - 16], [lx + 36, ly + 16]);
  });
  const cPad = small ? 10 : 18;
  const cMinX = Math.min(...ctrPts.map(p => p[0])) - cPad;
  const cMinY = Math.min(...ctrPts.map(p => p[1])) - cPad;
  const cMaxX = Math.max(...ctrPts.map(p => p[0])) + cPad;
  const cMaxY = Math.max(...ctrPts.map(p => p[1])) + cPad;
  const cRawW = cMaxX - cMinX, cRawH = cMaxY - cMinY;
  const cDim = Math.max(cRawW, cRawH);
  const cCx = (cMinX + cMaxX) / 2, cCy = (cMinY + cMaxY) / 2;
  const cW = cDim, cH = cDim;
  // Font size in SVG coords so labels appear at targetFontPx on screen
  const containerPxC = small ? 266 : 460;
  const fontSize = targetFontPx * cDim / containerPxC;

  return (
    <svg width="100%" height="100%" viewBox={`${cCx - cW/2} ${cCy - cH/2} ${cW} ${cH}`} style={{ overflow: "visible" }} {...(dataIndex !== undefined ? { "data-q-index": dataIndex } : {})}>
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
            <rect x={lx - tw / 2 - 2} y={ly - th / 2 - 1} width={tw + 4} height={th + 2} rx={3} fill="white" fillOpacity="0.85" stroke="#9ca3af" strokeWidth={0.5} />
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
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

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

interface DropdownSectionProps {
  dropdown: { key: string; label: string; options: { value: string; label: string }[] };
  value: string;
  onChange: (v: string) => void;
}
const DropdownSection = ({ dropdown, value, onChange }: DropdownSectionProps) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

interface VariablesSectionProps {
  variables: { key: string; label: string }[];
  values: Record<string, unknown>;
  onChange: (k: string, v: boolean) => void;
}
interface MultiSelectSectionProps {
  multiSelect: { key: string; label: string; options: { value: string; label: string }[] };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}
const MultiSelectSection = ({ multiSelect, values, onChange }: MultiSelectSectionProps) => {
  const activeCount = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = isActive && activeCount === 1;
          return (
            <button key={opt.value}
              onClick={() => { if (!isLast) onChange(opt.value, !isActive); }}
              className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${isActive ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const VariablesSection = ({ variables, values, onChange }: VariablesSectionProps) => (
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

interface StdQOProps {
  variables: { key: string; label: string }[];
  variableValues: Record<string, unknown>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; options: { value: string; label: string }[] } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; options: { value: string; label: string }[] } | null;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}
const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange, multiSelect, multiSelectValues, onMultiSelectChange }: StdQOProps) => {
  const { open, setOpen, ref } = usePopover();
  const hasContent = variables.length > 0 || dropdown !== null || multiSelect !== null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {multiSelect && <MultiSelectSection multiSelect={multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No options at this level.</p>}
        </div>
      )}
    </div>
  );
};

interface DiffQOProps {
  toolSettings: typeof TOOL_CONFIG.tools[string];
  levelVariables: Record<string, Record<string, unknown>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
  levelMultiSelect: Record<string, Record<string, boolean>>;
  onLevelMultiSelectChange: (lv: string, k: string, v: boolean) => void;
}
const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange, levelMultiSelect, onLevelMultiSelectChange }: DiffQOProps) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map(lv => {
            const dd = toolSettings.difficultySettings?.[lv]?.dropdown;
            const vars = toolSettings.difficultySettings?.[lv]?.variables ?? [];
            const ms = toolSettings.difficultySettings?.[lv]?.multiSelect ?? null;
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={(v: string) => onLevelDropdownChange(lv, v)} />}
                  {ms && <MultiSelectSection multiSelect={ms} values={levelMultiSelect[lv] ?? {}} onChange={(k: string, v: boolean) => onLevelMultiSelectChange(lv, k, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k: string, v: boolean) => onLevelVariableChange(lv, k, v)} />}
                  {!dd && !ms && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// InlineQOPanel — flat QO controls for advanced worksheet right panel (no popover trigger).
const InlineQOPanel = ({ toolKey, level, variables, onVariableChange, dropdownValue, onDropdownChange, multiSelectValues, onMultiSelectChange }: {
  toolKey: string;
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}) => {
  const t = TOOL_CONFIG.tools[toolKey];
  const dd = t.difficultySettings?.[level]?.dropdown ?? t.dropdown;
  const vars = t.difficultySettings?.[level]?.variables ?? t.variables;
  const ms = t.difficultySettings?.[level]?.multiSelect ?? null;
  const hasContent = dd !== null || (vars?.length ?? 0) > 0 || ms !== null;
  if (!hasContent) return <p className="text-sm text-gray-400">No options for this level.</p>;
  return (
    <div className="flex flex-col gap-4">
      {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
      {ms && <MultiSelectSection multiSelect={ms} values={multiSelectValues} onChange={onMultiSelectChange} />}
      {(vars?.length ?? 0) > 0 && <VariablesSection variables={vars} values={variables} onChange={onVariableChange} />}
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
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: {
  colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? "rotate-90" : ""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF  — SVG DOM serialisation (diagrams captured from the live DOM)
// ═══════════════════════════════════════════════════════════════════════════════

const PRINT_COLS = 3;
const PRINT_ROWS = 5;
const PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function handlePrint(
  worksheet: AngleQuestion[],
  isDiff: boolean,
  toolName: string,
  worksheetContainerRef: React.RefObject<HTMLDivElement>,
) {
  const container = worksheetContainerRef.current;
  if (!container) return;

  // Collect SVGs tagged with data-q-index from the live DOM
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
  const difficultyLabel = isDiff ? "Differentiated" : "Worksheet";

  // Build question pages
  const buildStandardPages = (showAnswers: boolean): string => {
    const pages: string[] = [];
    for (let p = 0; p < worksheet.length; p += PRINT_PER_PAGE) {
      const slice = worksheet.slice(p, p + PRINT_PER_PAGE);
      const pageNum = Math.floor(p / PRINT_PER_PAGE) + 1;
      const totalPages = Math.ceil(worksheet.length / PRINT_PER_PAGE);
      const cells = slice.map((q, li) => {
        const gi = p + li;
        return `<div class="cell"><div class="cell-num">${gi + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`;
      }).join("");
      const label = totalPages > 1 ? `${worksheet.length} questions · Page ${pageNum} of ${totalPages}` : `${worksheet.length} questions`;
      pages.push(`<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">${difficultyLabel} &nbsp;·&nbsp; ${dateStr} &nbsp;·&nbsp; ${label}</div></div><div class="standard-grid">${cells}</div></div>`);
    }
    return pages.join("");
  };

  const buildDiffPages = (showAnswers: boolean): string => {
    const byLevel: Record<string, AngleQuestion[]> = {
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
    const perCol = Math.max(...Object.values(byLevel).map(a => a.length));
    const totalPages = Math.ceil(perCol / PRINT_ROWS);
    return Array.from({ length: totalPages }, (_, p) => {
      const cols = ["level1", "level2", "level3"].map(lv => {
        const qs = byLevel[lv].slice(p * PRINT_ROWS, (p + 1) * PRINT_ROWS);
        const offset = offsetByLevel[lv];
        const cells = qs.map((q, li) => {
          const gi = offset + p * PRINT_ROWS + li;
          return `<div class="cell"><div class="cell-num">${p * PRINT_ROWS + li + 1}</div><div class="cell-diagram">${svgStrings[gi] ?? ""}</div>${showAnswers ? `<div class="answer">${q.answer}</div>` : ""}</div>`;
        }).join("");
        return `<div class="diff-col"><div class="diff-col-header" style="color:${lvColors[lv]};background:${lvBg[lv]}">${lvNames[lv]}</div><div class="diff-cells">${cells}</div></div>`;
      }).join("");
      const lbl = totalPages > 1 ? ` · Page ${p + 1} of ${totalPages}` : "";
      return `<div class="page"><div class="page-header"><h1>${toolName}${showAnswers ? " — Answers" : ""}</h1><div class="meta">Differentiated &nbsp;·&nbsp; ${dateStr}${lbl}</div></div><div class="diff-grid">${cols}</div></div>`;
    }).join("");
  };

  const qPages = isDiff ? buildDiffPages(false) : buildStandardPages(false);
  const aPages = isDiff ? buildDiffPages(true)  : buildStandardPages(true);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName} — Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4 portrait; margin:12mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:186mm; height:273mm; display:flex; flex-direction:column; page-break-after:always; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  .page-header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2mm; flex-shrink:0; }
  .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-header .meta { font-size:3mm; color:#6b7280; }
  .standard-grid { display:grid; grid-template-columns:repeat(${PRINT_COLS},1fr); grid-template-rows:repeat(${PRINT_ROWS},1fr); gap:2mm; flex:1; min-height:0; }
  .diff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; flex:1; min-height:0; }
  .diff-col { display:flex; flex-direction:column; gap:2mm; min-height:0; }
  .diff-col-header { text-align:center; font-size:3.5mm; font-weight:700; padding:1.5mm 0; border-radius:1.5mm; flex-shrink:0; }
  .diff-cells { display:flex; flex-direction:column; gap:2mm; flex:1; min-height:0; }
  .cell { border:0.3mm solid #d1d5db; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; overflow:hidden; flex:1; min-height:0; position:relative; }
  .cell-num { position:absolute; top:1.5mm; left:2mm; font-size:2.8mm; font-weight:700; color:#374151; }
  .cell-diagram { width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .cell-diagram svg { width:100%; height:100%; overflow:visible; }
  .answer { font-size:3mm; font-weight:700; color:#059669; text-align:center; flex-shrink:0; margin-top:1mm; }
</style></head><body>
${qPages}${aPages}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the print/PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function BasicAngleFacts() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolKey[];
  const worksheetContainerRef = useRef<HTMLDivElement>(null);

  const [currentTool, setCurrentTool] = useState<ToolKey>("rightAngle");
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── Config-driven QO state ────────────────────────────────────────────────
  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const init: Record<string, Record<string, Record<string, boolean>>> = {};
    toolKeys.forEach(k => {
      init[k] = {};
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        init[k][lv] = {};
        const vars = TOOL_CONFIG.tools[k].difficultySettings?.[lv]?.variables ?? [];
        vars.forEach(v => { init[k][lv][v.key] = v.defaultValue; });
      });
    });
    return init;
  });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    toolKeys.forEach(k => {
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = TOOL_CONFIG.tools[k].difficultySettings?.[lv]?.dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string, Record<string, boolean>>>({ level1: {}, level2: {}, level3: {} });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = TOOL_CONFIG.tools["rightAngle"].difficultySettings?.[lv]?.dropdown;
      if (dd) init[lv] = dd.defaultValue;
    });
    return init;
  });
  const [toolMultiSelect, setToolMultiSelect] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      init[k] = {};
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const ms = TOOL_CONFIG.tools[k].difficultySettings?.[lv]?.multiSelect;
        ms?.options.forEach(o => { init[k][`${lv}__${o.value}`] = o.defaultActive; });
      });
    });
    return init;
  });
  const [levelMultiSelect, setLevelMultiSelect] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = { level1: {}, level2: {}, level3: {} };
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      const ms = TOOL_CONFIG.tools["rightAngle"].difficultySettings?.[lv]?.multiSelect;
      ms?.options.forEach(o => { init[lv][o.value] = o.defaultActive; });
    });
    return init;
  });

  // ── Shared state ──────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AngleQuestion>(() =>
    generateQuestion("rightAngle", "level1", { numberType: "integer" })
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(9);
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AngleQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [worksheetMode, setWorksheetMode] = useState<"standard" | "advanced">("standard");
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // ── Advanced worksheet state ───────────────────────────────────────────────
  interface AdvGroup {
    id: number;
    level: DifficultyLevel;
    count: number;
    variables: Record<string, boolean>;
    dropdownValue: string;
    multiSelectValues: Record<string, boolean>;
  }
  const makeDefaultAdvGroup = (id: number, lv: DifficultyLevel = "level1"): AdvGroup => {
    const t = TOOL_CONFIG.tools[currentTool];
    const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
    const vars = t.difficultySettings?.[lv]?.variables ?? t.variables;
    const ms = t.difficultySettings?.[lv]?.multiSelect;
    const variables: Record<string, boolean> = {};
    vars.forEach(v => { variables[v.key] = v.defaultValue; });
    const multiSelectValues: Record<string, boolean> = {};
    ms?.options.forEach(o => { multiSelectValues[o.value] = o.defaultActive; });
    return { id, level: lv, count: 5, variables, dropdownValue: dd?.defaultValue ?? "", multiSelectValues };
  };
  const [advGroups, setAdvGroups] = useState<AdvGroup[]>(() => [makeDefaultAdvGroup(1)]);
  const [advSelectedId, setAdvSelectedId] = useState<number>(1);
  const advNextId = useRef(2);
  const [advShuffle, setAdvShuffle] = useState(false);
  const totalAdvQuestions = advGroups.reduce((s, g) => s + g.count, 0);
  const _advDragNodeIdx = useRef<number | null>(null);
  const _advListRef = useRef<HTMLDivElement>(null);
  void _advDragNodeIdx; void _advListRef;

  // ── Fullscreen + visualiser state ─────────────────────────────────────────
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [presenterMode, setPresenterMode] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const camDropdownRef  = useRef<HTMLDivElement>(null);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress    = useRef(false);
  const isDraggingRef   = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

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
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
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
  const fsToolbarBg  = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefaultScheme ? "#f5f3f0" : qBg;

  // ── Config-driven helpers ─────────────────────────────────────────────────
  const getToolSettings   = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? null;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? [];
  const getDropdownValue  = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue  = (v: string) => setToolDropdowns(p => ({ ...p, [`${currentTool}__${difficulty}`]: v }));
  const getVariableValues = () => toolVariables[currentTool]?.[difficulty] ?? {};
  const setVariableValue  = (k: string, v: boolean) => setToolVariables(p => ({
    ...p, [currentTool]: { ...(p[currentTool] ?? {}), [difficulty]: { ...(p[currentTool]?.[difficulty] ?? {}), [k]: v } }
  }));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const handleLevelDDChange  = (lv: string, v: string) => setLevelDropdowns(p => ({ ...p, [lv]: v }));
  const handleLevelMSChange  = (lv: string, k: string, v: boolean) => setLevelMultiSelect(p => ({ ...p, [lv]: { ...(p[lv] ?? {}), [k]: v } }));

  // Helpers to get current multiSelect values for standard mode (per tool/level)
  const getMultiSelectValues = () => {
    const ms = TOOL_CONFIG.tools[currentTool].difficultySettings?.[difficulty]?.multiSelect;
    if (!ms) return {};
    const vals: Record<string, boolean> = {};
    ms.options.forEach(o => { vals[o.value] = toolMultiSelect[currentTool]?.[`${difficulty}__${o.value}`] ?? o.defaultActive; });
    return vals;
  };
  const setMultiSelectValue = (k: string, v: boolean) => setToolMultiSelect(p => ({
    ...p, [currentTool]: { ...(p[currentTool] ?? {}), [`${difficulty}__${k}`]: v }
  }));
  const getMultiSelectConfig = () => TOOL_CONFIG.tools[currentTool].difficultySettings?.[difficulty]?.multiSelect ?? null;

  // Build the vars object the generator expects (variables + dropdown + multiSelect merged)
  const buildVars = (tool: string, lv: string): Record<string, unknown> => {
    const t = TOOL_CONFIG.tools[tool];
    const ddCfg = t.difficultySettings?.[lv]?.dropdown;
    const ddKey = ddCfg?.key ?? "";
    const ddVal = toolDropdowns[`${tool}__${lv}`] ?? ddCfg?.defaultValue ?? "";
    const vars = toolVariables[tool]?.[lv] ?? {};
    const ms = t.difficultySettings?.[lv]?.multiSelect;
    const msVals: Record<string, boolean> = {};
    ms?.options.forEach(o => { msVals[o.value] = toolMultiSelect[tool]?.[`${lv}__${o.value}`] ?? o.defaultActive; });
    return ddKey ? { ...vars, ...msVals, [ddKey]: ddVal } : { ...vars, ...msVals };
  };
  const buildDiffVars = (lv: string): Record<string, unknown> => {
    const t = TOOL_CONFIG.tools[currentTool];
    const ddCfg = t.difficultySettings?.[lv]?.dropdown;
    const ddKey = ddCfg?.key ?? "";
    const ddVal = levelDropdowns[lv] ?? ddCfg?.defaultValue ?? "";
    const ms = t.difficultySettings?.[lv]?.multiSelect;
    const msVals: Record<string, boolean> = {};
    ms?.options.forEach(o => { msVals[o.value] = levelMultiSelect[lv]?.[o.value] ?? o.defaultActive; });
    return ddKey ? { ...levelVariables[lv], ...msVals, [ddKey]: ddVal } : { ...levelVariables[lv], ...msVals };
  };

  // ── Wiring ────────────────────────────────────────────────────────────────
  const stampQO = (q: AngleQuestion, snap: QOSnapshot): AngleQuestion => ({ ...q, _qo: snap });

  const handleNewQuestion = () => {
    setCurrentQuestion(generateQuestion(currentTool, difficulty, buildVars(currentTool, difficulty)));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AngleQuestion[] = [];
    if (isDifferentiated) {
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const snap: QOSnapshot = { level: lv, variables: levelVariables[lv] ?? {}, dropdownValue: levelDropdowns[lv] ?? "" };
        for (let i = 0; i < numQuestions; i++)
          questions.push(stampQO(getUniqueQuestion(currentTool, lv, buildDiffVars(lv), usedKeys), snap));
      });
    } else {
      const snap: QOSnapshot = { level: difficulty, variables: getVariableValues(), dropdownValue: getDropdownValue() };
      for (let i = 0; i < numQuestions; i++)
        questions.push(stampQO(getUniqueQuestion(currentTool, difficulty, buildVars(currentTool, difficulty), usedKeys), snap));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  const regenQuestion = (idx: number) => {
    const q = worksheet[idx];
    const snap = (q as AngleQuestion & { _qo?: QOSnapshot })._qo;
    if (!snap) return;
    const existing = new Set(worksheet.map(w => w.key ?? `${w.id}`));
    existing.delete(q.key ?? `${q.id}`);
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = generateQuestion(currentTool, snap.level, buildVars(currentTool, snap.level));
      if (!existing.has(candidate.key ?? `${candidate.id}`)) {
        setWorksheet(prev => prev.map((w, i) => i === idx ? stampQO(candidate, snap) : w));
        return;
      }
    }
  };

  const handleGenerateAdvanced = () => {
    const usedKeys = new Set<string>();
    const questions: AngleQuestion[] = [];
    advGroups.forEach(g => {
      const t = TOOL_CONFIG.tools[currentTool];
      const ddCfg = t.difficultySettings?.[g.level]?.dropdown ?? t.dropdown;
      const ddKey = ddCfg?.key ?? "";
      const vars: Record<string, unknown> = ddKey
        ? { ...g.variables, ...g.multiSelectValues, [ddKey]: g.dropdownValue }
        : { ...g.variables, ...g.multiSelectValues };
      const snap: QOSnapshot = { level: g.level, variables: g.variables, dropdownValue: g.dropdownValue };
      for (let i = 0; i < g.count; i++)
        questions.push(stampQO(getUniqueQuestion(currentTool, g.level, vars, usedKeys), snap));
    });
    if (advShuffle) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // Arrow key navigation between groups in advanced mode
  useEffect(() => {
    if (mode !== "worksheet" || worksheetMode !== "advanced") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const idx = advGroups.findIndex(g => g.id === advSelectedId);
      if (idx === -1) return;
      const next = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
      if (next >= 0 && next < advGroups.length) { setAdvSelectedId(advGroups[next].id); e.preventDefault(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, worksheetMode, advGroups, advSelectedId]);

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, currentTool]);

  // ── QO popovers ───────────────────────────────────────────────────────────
  const stdQOProps: StdQOProps = {
    variables: getVariablesConfig(),
    variableValues: getVariableValues(),
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig(),
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
    multiSelect: getMultiSelectConfig(),
    multiSelectValues: getMultiSelectValues(),
    onMultiSelectChange: setMultiSelectValue,
  };
  const diffQOProps: DiffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
    levelMultiSelect,
    onLevelMultiSelectChange: handleLevelMSChange,
  };
  const qoEl = (isDiff = false) => isDiff ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />;

  // ── Font size ──────────────────────────────────────────────────────────────
  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;
  // Worksheet cell diagram heights: maps to px height of the cell container
  const CELL_H = 280; // fixed diagram cell height

  const fontBtnStyle = (enabled: boolean) => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: enabled ? 1 : 0.35,
  });

  // ── Worksheet cell ─────────────────────────────────────────────────────────
  const renderQCell = (q: AngleQuestion, idx: number, bgOverride?: string) => {
    const hintH = 28; // reserved for right-angle hint row — always subtracted for right-angle questions
    const diagramH = q.tool === "rightAngle" ? CELL_H - hintH : CELL_H;
    const hasQo = !!(q as AngleQuestion & { _qo?: QOSnapshot })._qo;
    return (
      <div className="rounded-xl group" style={{ backgroundColor: bgOverride ?? stepBg, borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", position: "relative" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000", zIndex: 5 }}>{idx + 1})</span>
        {hasQo && (
          <button onClick={() => regenQuestion(idx)} title="Regenerate this question"
            className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
            style={{ zIndex: 10 }}>
            <RefreshCw size={12} />
          </button>
        )}
        <div style={{ height: diagramH, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", overflow: "hidden" }}>
          <div style={{ width: "95%", height: "95%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AngleDiagram q={q} showAnswer={showWorksheetAnswers} small dataIndex={idx} />
          </div>
        </div>
        {showWorksheetAnswers && (
          <div className="text-base font-bold text-center pb-2" style={{ color: "#059669" }}>{q.answer}</div>
        )}
        {q.tool === "rightAngle" && (
          <div className="text-xs text-center pb-2 text-gray-500 italic">The angle shown is a right angle</div>
        )}
      </div>
    );
  };

  // ── Advanced Worksheet Builder ────────────────────────────────────────────
  const renderAdvancedWorksheet = () => {
    const lvColor  = (lv: DifficultyLevel) => lv === "level1" ? "bg-green-600" : lv === "level2" ? "bg-yellow-500" : "bg-red-600";
    const lvBorder = (lv: DifficultyLevel) => lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";
    const canAdd = advGroups.length < 10;
    const updateGroup = (id: number, patch: Partial<AdvGroup>) =>
      setAdvGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
    const selectedGroup = advGroups.find(g => g.id === advSelectedId) ?? advGroups[0];

    return (
      <div className="flex gap-3" style={{ minHeight: 300 }}>
        {/* Left panel: group list */}
        <div className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden" style={{ width: "50%", flexShrink: 0, backgroundColor: "#fff" }}>
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {advGroups.map((g, idx) => {
              const isSel = g.id === advSelectedId;
              return (
                <div key={g.id} onClick={() => setAdvSelectedId(g.id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ borderLeft: `3px solid ${isSel ? lvBorder(g.level) : "transparent"}`, backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 tabular-nums">{idx + 1}</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => (
                      <button key={lv} onClick={() => { updateGroup(g.id, { ...makeDefaultAdvGroup(g.id, lv), id: g.id }); setAdvSelectedId(g.id); }}
                        className={`px-2.5 py-1 font-bold text-xs transition-colors ${g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                        L{li + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => updateGroup(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">−</button>
                    <span className="w-6 text-center text-xs font-bold text-gray-800 tabular-nums">{g.count}</span>
                    <button onClick={() => updateGroup(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">+</button>
                  </div>
                  {advGroups.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); const rem = advGroups.filter((_, i) => i !== idx); setAdvGroups(rem); if (g.id === advSelectedId) setAdvSelectedId(rem[Math.max(0, idx - 1)].id); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
            {canAdd ? (
              <button onClick={() => { const newId = advNextId.current++; setAdvGroups(g => [...g, makeDefaultAdvGroup(newId)]); setAdvSelectedId(newId); }}
                className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors">
                + Add group
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400 font-semibold py-1">Maximum 10 groups reached</p>
            )}
          </div>
        </div>

        {/* Right panel: inline QO for selected group */}
        <div className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto" style={{ backgroundColor: "#fff" }}>
          {selectedGroup && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Group {advGroups.indexOf(selectedGroup) + 1} · {selectedGroup.level === "level1" ? "Level 1" : selectedGroup.level === "level2" ? "Level 2" : "Level 3"} · Options
              </p>
              <InlineQOPanel
                toolKey={currentTool}
                level={selectedGroup.level}
                variables={selectedGroup.variables}
                onVariableChange={(k, v) => updateGroup(selectedGroup.id, { variables: { ...selectedGroup.variables, [k]: v } })}
                dropdownValue={selectedGroup.dropdownValue}
                onDropdownChange={v => updateGroup(selectedGroup.id, { dropdownValue: v })}
                multiSelectValues={selectedGroup.multiSelectValues}
                onMultiSelectChange={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues: { ...selectedGroup.multiSelectValues, [k]: v } })}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Control bar ────────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if (mode === "worksheet") {
      const isAdv = worksheetMode === "advanced";
      return (
        <div className="bg-white rounded-xl shadow-lg mb-8">
          {/* Advanced toggle row */}
          <div className="flex items-center gap-3 px-6 pt-4 pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setWorksheetMode(isAdv ? "standard" : "advanced")}
                className={`w-11 h-6 rounded-full transition-colors relative ${isAdv ? "bg-blue-900" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAdv ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-bold text-gray-500">Advanced</span>
            </label>
            {isAdv && (
              <div className="ml-auto flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setAdvShuffle(s => !s)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${advShuffle ? "bg-blue-900" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${advShuffle ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-500">Shuffle</span>
                </label>
                <span className="text-sm font-bold text-gray-600">{totalAdvQuestions} questions total</span>
              </div>
            )}
          </div>
          {!isAdv ? (
            <div className="p-6">
              {/* Row 1: Level selector + Differentiated */}
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
                  {(["level1", "level2", "level3"] as const).map((val, i) => {
                    const cols = ["bg-green-600", "bg-yellow-500", "bg-red-600"];
                    return (
                      <button key={val} onClick={() => { setDifficulty(val); setIsDifferentiated(false); }}
                        className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated && difficulty === val ? `${cols[i]} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                        Level {i + 1}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setIsDifferentiated(!isDifferentiated)}
                  className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
                  Differentiated
                </button>
              </div>
              {/* Row 2: QO + Questions + Columns */}
              <div className="flex justify-center items-center gap-6 mb-4">
                {qoEl(isDifferentiated)}
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Questions:</label>
                  <input type="number" min="1" max="24" value={numQuestions}
                    onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || 9)))}
                    className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Columns:</label>
                  <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
                    onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3))); }}
                    disabled={isDifferentiated}
                    className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} />
                </div>
              </div>
              {/* Row 3: Actions */}
              <div className="flex justify-center items-center gap-4">
                <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                  <RefreshCw size={18} /> Generate
                </button>
                {worksheet.length > 0 && <>
                  <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                    <Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}
                  </button>
                  <button onClick={() => handlePrint(worksheet, isDifferentiated, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)}
                    className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
                    <Printer size={18} /> Print / PDF
                  </button>
                </>}
              </div>
            </div>
          ) : (
            <div className="p-6 pt-4">
              {renderAdvancedWorksheet()}
              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-2">
                  <label className="text-base font-semibold text-gray-700">Columns:</label>
                  <input type="number" min="1" max="4" value={numColumns}
                    onChange={e => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 3)))}
                    className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
                </div>
                <button onClick={handleGenerateAdvanced} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                  <RefreshCw size={18} /> Generate
                </button>
                {worksheet.length > 0 && <>
                  <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                    <Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}
                  </button>
                  <button onClick={() => handlePrint(worksheet, false, TOOL_CONFIG.tools[currentTool].name, worksheetContainerRef)}
                    className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
                    <Printer size={18} /> Print / PDF
                  </button>
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
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ──────────────────────────────────────────────────────────────
  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
        {qoEl()}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );

    const fontControls = (
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
        <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)} title="Decrease font size"><ChevronDown size={16} color="#6b7280" /></button>
        <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)} title="Increase font size"><ChevronUp size={16} color="#6b7280" /></button>
      </div>
    );

    const questionBox = (isFS: boolean) => (
      <div style={{
        position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
        ...(isFS
          ? { width: `${splitPct}%`, height: "100%", backgroundColor: fsQuestionBg, padding: 32, boxSizing: "border-box" as const, flexShrink: 0, overflowY: "auto" as const }
          : { width: "480px", height: "100%", backgroundColor: stepBg, borderRadius: 12, padding: 24, flexShrink: 0 })
      }}>
        {fontControls}
        {showWhiteboardAnswer && currentQuestion && (
          <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</div>
        )}
        <div style={{ width: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AngleDiagram q={currentQuestion} showAnswer={showWhiteboardAnswer} />
        </div>
        {currentQuestion.tool === "rightAngle" && (
          <div className="text-base italic text-gray-500 text-center pb-1">The angle shown is a right angle</div>
        )}
      </div>
    );

    const makeRightPanel = (isFS: boolean) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg), borderRadius: isFS ? 0 : undefined }}
        className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}
          </>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
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
            <button onClick={() => setPresenterMode(true)} title="Visualiser mode"
              style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
            ><Video size={16} color="#6b7280" /></button>
          )}
          <button onClick={() => setWbFullscreen(f => !f)} title={wbFullscreen ? "Exit Fullscreen" : "Fullscreen"}
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
        <div ref={splitContainerRef} style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {questionBox(true)}
          {/* Draggable divider */}
          <div
            style={{ position: "relative", width: 2, backgroundColor: "#000", flexShrink: 0, cursor: "col-resize" }}
            onMouseDown={e => {
              isDraggingRef.current = true;
              const onMove = (ev: MouseEvent) => {
                if (!isDraggingRef.current || !splitContainerRef.current) return;
                const rect = splitContainerRef.current.getBoundingClientRect();
                let pct = ((ev.clientX - rect.left) / rect.width) * 100;
                pct = Math.min(75, Math.max(25, pct));
                if (pct >= 38 && pct <= 42) pct = 40;
                setSplitPct(pct);
              };
              const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
              e.preventDefault();
            }}
          >
            <div style={{ position: "absolute", top: 0, bottom: 0, left: -5, width: 12, cursor: "col-resize" }} />
          </div>
          {makeRightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}>
        <div className="flex gap-6" style={{ height: "100%" }}>
          {questionBox(false)}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked example ──────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
      <div className="p-8" style={{ backgroundColor: qBg }}>
        <div className="text-center mb-6 relative">
          <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
            <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
            <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
          </div>
          <div className="flex justify-center mb-4" style={{ width: 340, height: 340, margin: "0 auto" }}>
            <AngleDiagram q={currentQuestion} showAnswer={showAnswer} />
          </div>
          {currentQuestion.tool === "rightAngle" && (
            <div className="text-base italic text-gray-500 text-center mb-4">The angle shown is a right angle</div>
          )}
          {showAnswer && (
            <>
              <div className="space-y-4 mt-4">
                {currentQuestion.working.slice(0, -1).map((step, i) => (
                  <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}>
                    <h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4>
                    <p className={`${displayFontSizes[displayFontSize]} font-semibold`} style={{ color: "#000" }}>{step.text}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}>
                <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>{currentQuestion.answer}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── Worksheet ───────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if (isDifferentiated) return (
      <div ref={worksheetContainerRef} className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.level === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>
                  {lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, c.fill)}</div>)}
                </div>
              </div>
            );
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

  // ── Root render ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>

          {/* Sub-tool tabs */}
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k => (
              <button key={k} onClick={() => { setCurrentTool(k); setWorksheet([]); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>

          {/* Mode tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (
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
