import {
  ToolShell, MathRenderer, loadKaTeX, getStepBg,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type WorkingStep, type QOSnapshot,
  randInt, pick, mStep, pickActive,
} from "../../shared";
import { useState, useEffect, useRef, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ToolType = "expand" | "simplify" | "double";

interface FoilData {
  a: number; b: number; c: number;
  isReversed: boolean; withVariable: boolean; outsidePower: number;
  varName: string; xCoeff: number; x2Coeff: number; x3Coeff: number; constant: number;
}

type ExpandRaw = { tool: "expand"; fd: FoilData };
type SimplifyRaw = { tool: "simplify"; fd1: FoilData; fd2: FoilData; operator: string; varName: string };
type DoubleRaw = { tool: "double"; a: number; b: number; c: number; d: number };
type RawValues = ExpandRaw | SimplifyRaw | DoubleRaw;

const VARS = ["x", "y", "a", "b", "p", "q", "r", "s", "t", "n", "m"];

// ── LaTeX helpers ────────────────────────────────────────────────────────────

const termLatex = (coeff: number, variable = ""): string => {
  const abs = Math.abs(coeff);
  if (!variable) return String(abs);
  if (abs === 1) return variable;
  return `${abs}${variable}`;
};

const signedLatex = (coeff: number, variable = "", isFirst = false): string => {
  if (coeff === 0) return "";
  const sign = coeff < 0 ? "-" : isFirst ? "" : "+";
  return `${sign}${termLatex(coeff, variable)}`;
};

const bracketFirst = (n: number, varPow: string): string => {
  if (n === 1) return varPow;
  if (n === -1) return `-${varPow}`;
  return `${n < 0 ? "-" : ""}${Math.abs(n)}${varPow}`;
};

const bracketSecond = (n: number): string =>
  n >= 0 ? `+${n}` : `-${Math.abs(n)}`;

const foilDisplayLatex = (fd: FoilData): string => {
  const v = fd.varName;
  if (fd.withVariable) {
    const pow = fd.outsidePower === 2 ? `${v}^2` : v;
    return `${bracketFirst(fd.a, pow)}(${bracketFirst(fd.b, v)}${bracketSecond(fd.c)})`;
  }
  if (fd.isReversed) {
    const bT = fd.b === 1 ? v : `${fd.b}${v}`;
    return `${bracketFirst(fd.a, "")}(${fd.c}-${bT})`;
  }
  return `${bracketFirst(fd.a, "")}(${bracketFirst(fd.b, v)}${bracketSecond(fd.c)})`;
};

const foilAnswerLatex = (fd: FoilData): string => {
  const v = fd.varName;
  if (fd.withVariable) {
    if (fd.outsidePower === 2)
      return signedLatex(fd.x3Coeff, `${v}^3`, true) + signedLatex(fd.x2Coeff, `${v}^2`);
    return signedLatex(fd.x2Coeff, `${v}^2`, true) + signedLatex(fd.xCoeff, v);
  }
  return signedLatex(fd.xCoeff, v, true) + signedLatex(fd.constant);
};

const doubleDisplayLatex = (a: number, b: number, c: number, d: number): string =>
  `(${bracketFirst(a, "x")}${bracketSecond(b)})(${bracketFirst(c, "x")}${bracketSecond(d)})`;

const doubleAnswerLatex = (a: number, b: number, c: number, d: number): string => {
  const x2 = a * c, x1 = a * d + b * c, x0 = b * d;
  return signedLatex(x2, "x^2", true) + signedLatex(x1, "x") + signedLatex(x0);
};

// ── useMeasuredWidths ────────────────────────────────────────────────────────

const useMeasuredWidths = (latexTerms: string[], fontSize: number): [number[], ReactNode] => {
  const [widths, setWidths] = useState<number[]>([]);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready) return;
    refs.current = refs.current.slice(0, latexTerms.length);
    requestAnimationFrame(() => {
      setWidths(refs.current.map(r => r ? r.getBoundingClientRect().width : 60));
    });
  }, [latexTerms.join("|"), ready, fontSize]);

  const probeEl = (
    <div style={{ position: "fixed", left: -9999, top: 0, visibility: "hidden", fontSize, lineHeight: 1 }}>
      {latexTerms.map((lt, i) => (
        <span key={i} ref={el => { refs.current[i] = el; }} style={{ display: "inline-block" }}>
          <MathRenderer latex={lt} style={{ fontSize: "1em" }} />
        </span>
      ))}
    </div>
  );
  return [widths, probeEl];
};

// ── Single bracket FOIL diagram ──────────────────────────────────────────────

const SFoilDisplay = ({ fd }: { fd: FoilData }) => {
  const v = fd.varName;
  const outsideLx = fd.withVariable
    ? bracketFirst(fd.a, fd.outsidePower === 2 ? `${v}^2` : v)
    : String(fd.a);
  const term1Lx = fd.isReversed ? String(fd.c) : bracketFirst(fd.b, v);
  const term2Lx = fd.isReversed ? `-${fd.b === 1 ? v : `${fd.b}${v}`}` : bracketSecond(fd.c);

  let res1Lx: string, res2Lx: string;
  if (fd.withVariable) {
    if (fd.outsidePower === 2) {
      res1Lx = signedLatex(fd.x3Coeff, `${v}^3`, true);
      res2Lx = signedLatex(fd.x2Coeff, `${v}^2`, false);
    } else {
      res1Lx = signedLatex(fd.x2Coeff, `${v}^2`, true);
      res2Lx = signedLatex(fd.xCoeff, v, false);
    }
  } else {
    res1Lx = signedLatex(fd.xCoeff, v, true);
    res2Lx = signedLatex(fd.constant, "", false);
  }

  const allTerms = [outsideLx, term1Lx, term2Lx, res1Lx, res2Lx];
  const [rawW, probeEl] = useMeasuredWidths(allTerms, 28);
  const w = rawW.length === 5 ? rawW : [60, 60, 60, 60, 60];

  const PAD = 24, BRACE = 18, GAP = 8;
  const slotW = (i: number) => (w[i] || 60) + PAD * 2;
  const outsideW = slotW(0), t1W = slotW(1), t2W = slotW(2);
  const cx0 = outsideW / 2;
  const cx1 = outsideW + BRACE + t1W / 2;
  const cx2 = cx1 + t1W / 2 + GAP + t2W / 2;
  const totalW = cx2 + t2W / 2 + BRACE + 20;
  const CURVE = 52, BRACKET_Y = CURVE + 24, SVG_H = BRACKET_Y + 20;
  const CHAR_HALF = 14, OFFSET = 3;

  const Arrow = ({ x1, x2, color }: { x1: number; x2: number; color: string }) => {
    const yA = BRACKET_Y - CHAR_HALF - OFFSET - 5;
    const path = `M ${x1} ${yA} Q ${(x1 + x2) / 2} ${BRACKET_Y - CURVE} ${x2} ${yA}`;
    return <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, userSelect: "none" }}>
      {probeEl}
      <div style={{ position: "relative", width: totalW, height: SVG_H + 52 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: SVG_H, overflow: "visible", zIndex: 10, pointerEvents: "none" }}>
          <Arrow x1={cx0} x2={cx1} color="#22c55e" />
          <Arrow x1={cx0} x2={cx2} color="#ef4444" />
        </svg>
        <div style={{ position: "absolute", top: BRACKET_Y - 20, left: 0, display: "flex", alignItems: "center" }}>
          <span style={{ width: outsideW, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={outsideLx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>(</span>
          <span style={{ width: t1W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={term1Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: GAP }} />
          <span style={{ width: t2W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={term2Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>)</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ width: slotW(3), textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={res1Lx} style={{ fontSize: "1em" }} /></span>
        <span style={{ width: slotW(4), textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={res2Lx} style={{ fontSize: "1em" }} /></span>
      </div>
    </div>
  );
};

// ── Single bracket Grid diagram ──────────────────────────────────────────────

const SGridDisplay = ({ fd }: { fd: FoilData }) => {
  const v = fd.varName;
  const outsideLx = fd.withVariable ? bracketFirst(fd.a, fd.outsidePower === 2 ? `${v}^2` : v) : String(fd.a);
  const term1Lx = fd.isReversed ? String(fd.c) : bracketFirst(fd.b, v);
  const term2Lx = fd.isReversed ? `-${fd.b === 1 ? v : `${fd.b}${v}`}` : bracketSecond(fd.c);

  let prod1Lx: string, prod2Lx: string;
  if (fd.withVariable) {
    if (fd.outsidePower === 2) { prod1Lx = signedLatex(fd.x3Coeff, `${v}^3`, true); prod2Lx = signedLatex(fd.x2Coeff, `${v}^2`, true); }
    else { prod1Lx = signedLatex(fd.x2Coeff, `${v}^2`, true); prod2Lx = signedLatex(fd.xCoeff, v, true); }
  } else {
    prod1Lx = signedLatex(fd.xCoeff, v, true);
    prod2Lx = signedLatex(fd.constant, "", true);
  }

  const ansLx = foilAnswerLatex(fd);
  const CELL = "border-2 border-gray-700 flex items-center justify-center font-bold";
  const SZ = "w-28 h-14";
  const HDR = "bg-gray-300 text-gray-900";
  const FS = 20;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", width: "fit-content" }}>
        <div className={`${CELL} ${SZ} ${HDR}`} style={{ fontSize: FS }}>×</div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={term1Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={term2Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={outsideLx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod1Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod2Lx} style={{ fontSize: FS }} /></div>
      </div>
      <div className="text-xl font-bold" style={{ color: "#166534" }}>
        <MathRenderer latex={`= ${ansLx}`} style={{ fontSize: 20 }} />
      </div>
    </div>
  );
};

// ── Double bracket FOIL diagram ──────────────────────────────────────────────

const DFoilDisplay = ({ a, b, c, d }: { a: number; b: number; c: number; d: number }) => {
  const t1Lx = bracketFirst(a, "x"), t2Lx = bracketSecond(b);
  const t3Lx = bracketFirst(c, "x"), t4Lx = bracketSecond(d);
  const first = a * c, outer = a * d, inner = b * c, last = b * d;
  const r1Lx = signedLatex(first, "x^2", true);
  const r2Lx = signedLatex(outer, "x", false);
  const r3Lx = signedLatex(inner, "x", false);
  const r4Lx = signedLatex(last, "", false);

  const allTerms = [t1Lx, t2Lx, t3Lx, t4Lx, r1Lx, r2Lx, r3Lx, r4Lx];
  const [rawW, probeEl] = useMeasuredWidths(allTerms, 28);
  const w = rawW.length === 8 ? rawW : Array(8).fill(60);

  const PAD = 20, BRACE = 18, GAP = 8;
  const slotW = (i: number) => (w[i] || 60) + PAD * 2;
  const t1W = slotW(0), t2W = slotW(1), t3W = slotW(2), t4W = slotW(3);
  const cx1 = BRACE + t1W / 2;
  const cx2 = cx1 + t1W / 2 + GAP + t2W / 2;
  const openB2 = cx2 + t2W / 2 + BRACE;
  const cx3 = openB2 + BRACE + t3W / 2;
  const cx4 = cx3 + t3W / 2 + GAP + t4W / 2;
  const totalW = cx4 + t4W / 2 + BRACE + 20;

  const TOP_CURVE = 60, BOT_CURVE = 60;
  const BRACKET_TOP = TOP_CURVE + 24;
  const D_SVG_H = BRACKET_TOP + BOT_CURVE + 24;
  const CHAR_HALF = 14, OFFSET = 3;

  const CurvedArrow = ({ x1, x2, up, color }: { x1: number; x2: number; up: boolean; color: string }) => {
    const yA = up ? BRACKET_TOP - CHAR_HALF - OFFSET - 5 : BRACKET_TOP + CHAR_HALF + OFFSET + 10;
    const cy = up ? BRACKET_TOP - TOP_CURVE : BRACKET_TOP + BOT_CURVE;
    const path = `M ${x1} ${yA} Q ${(x1 + x2) / 2} ${cy} ${x2} ${yA}`;
    return <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  };

  const resWidths = [4, 5, 6, 7].map(i => slotW(i));
  const resGap = 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, userSelect: "none" }}>
      {probeEl}
      <div style={{ position: "relative", width: totalW, height: D_SVG_H + 52 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: D_SVG_H + BOT_CURVE + 16, overflow: "visible", zIndex: 10, pointerEvents: "none" }}>
          <CurvedArrow x1={cx1} x2={cx3} up={true} color="#ef4444" />
          <CurvedArrow x1={cx1} x2={cx4} up={true} color="#3b82f6" />
          <CurvedArrow x1={cx2} x2={cx3} up={false} color="#92400e" />
          <CurvedArrow x1={cx2} x2={cx4} up={false} color="#22c55e" />
        </svg>
        <div style={{ position: "absolute", top: BRACKET_TOP - 20, left: 0, display: "flex", alignItems: "center" }}>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>(</span>
          <span style={{ width: t1W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={t1Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: GAP }} />
          <span style={{ width: t2W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={t2Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>)</span>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>(</span>
          <span style={{ width: t3W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={t3Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: GAP }} />
          <span style={{ width: t4W, textAlign: "center", fontSize: 28, fontWeight: 700 }}><MathRenderer latex={t4Lx} style={{ fontSize: "1em" }} /></span>
          <span style={{ width: BRACE, textAlign: "center", fontSize: 32, fontWeight: 700 }}>)</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: resGap, alignItems: "center" }}>
        {[r1Lx, r2Lx, r3Lx, r4Lx].map((lt, i) => (
          <span key={i} style={{ width: resWidths[i], textAlign: "center", fontSize: 28, fontWeight: 700 }}>
            <MathRenderer latex={lt} style={{ fontSize: "1em" }} />
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Double bracket Grid diagram ──────────────────────────────────────────────

const DGridDisplay = ({ a, b, c, d }: { a: number; b: number; c: number; d: number }) => {
  const t1Lx = bracketFirst(a, "x"), t2Lx = bracketSecond(b);
  const t3Lx = bracketFirst(c, "x"), t4Lx = bracketSecond(d);
  const first = a * c, outer = a * d, inner = b * c, last = b * d;
  const xCoeff = outer + inner;

  const collectLx = signedLatex(first, "x^2", true) + signedLatex(outer, "x") + signedLatex(inner, "x") + signedLatex(last);
  const ansLx = signedLatex(first, "x^2", true) + signedLatex(xCoeff, "x") + signedLatex(last);

  const CELL = "border-2 border-gray-700 flex items-center justify-center font-bold";
  const SZ = "w-28 h-14";
  const HDR = "bg-gray-300 text-gray-900";
  const FS = 20;
  const prod = (val: number, va: string) => signedLatex(val, va, false);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", width: "fit-content" }}>
        <div className={`${CELL} ${SZ} ${HDR}`} style={{ fontSize: FS }}>×</div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t3Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t4Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t1Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(first, "x^2")} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(outer, "x")} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ} ${HDR}`}><MathRenderer latex={t2Lx} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(inner, "x")} style={{ fontSize: FS }} /></div>
        <div className={`${CELL} ${SZ}`}><MathRenderer latex={prod(last, "")} style={{ fontSize: FS }} /></div>
      </div>
      <div style={{ fontSize: FS, fontWeight: 700, color: "#000" }}>
        <MathRenderer latex={`= ${collectLx}`} style={{ fontSize: "1em" }} />
      </div>
      <div style={{ fontSize: FS, fontWeight: 700, color: "#166534" }}>
        <MathRenderer latex={`= ${ansLx}`} style={{ fontSize: "1em" }} />
      </div>
    </div>
  );
};

// ── TOOL_CONFIG ──────────────────────────────────────────────────────────────

const METHOD_DD = {
  key: "method",
  label: "Method",
  options: [
    { value: "foil", label: "FOIL" },
    { value: "grid", label: "Grid" },
    { value: "both", label: "Both" },
  ],
  defaultValue: "foil",
};

const MULTIPLIER_MS = {
  key: "multiplier",
  label: "Multiplier Type",
  options: [
    { value: "numerical", label: "Numerical", defaultActive: true },
    { value: "algebraic", label: "Algebraic", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Expanding Brackets",
  tools: {
    expand: {
      name: "Expand Single",
      instruction: "Expand:",
      variables: [],
      dropdown: METHOD_DD,
      multiSelect: MULTIPLIER_MS,
      difficultySettings: null,
    },
    simplify: {
      name: "Expand & Simplify",
      instruction: "Expand and simplify:",
      variables: [],
      dropdown: METHOD_DD,
      multiSelect: MULTIPLIER_MS,
      difficultySettings: null,
    },
    double: {
      name: "Expand Double",
      instruction: "Expand:",
      variables: [],
      dropdown: METHOD_DD,
      difficultySettings: null,
    },
  },
};

// ── INFO_SECTIONS ────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Expand Single", icon: "📐", content: [
    { label: "Overview", detail: "Expand a single bracket by multiplying the outside term by each term inside." },
    { label: "Level 1 — Green", detail: "Positive multiplier with positive terms inside the bracket." },
    { label: "Level 2 — Yellow", detail: "Includes negative constants or reversed bracket order." },
    { label: "Level 3 — Red", detail: "Negative multipliers and mixed positive/negative terms." },
  ] },
  { title: "Expand & Simplify", icon: "➕", content: [
    { label: "Overview", detail: "Expand two single brackets then collect like terms." },
    { label: "Level 1 — Green", detail: "Two positive brackets added together." },
    { label: "Level 2 — Yellow", detail: "Includes subtraction between the two expanded expressions." },
    { label: "Level 3 — Red", detail: "Negative multipliers and mixed subtraction." },
  ] },
  { title: "Expand Double", icon: "✖️", content: [
    { label: "Overview", detail: "Expand two linear brackets using FOIL or the Grid method." },
    { label: "Level 1 — Green", detail: "Leading coefficient 1, positive constants: (x+a)(x+b)." },
    { label: "Level 2 — Yellow", detail: "Leading coefficient 1, positive and negative constants." },
    { label: "Level 3 — Red", detail: "Non-unit leading coefficients and mixed signs." },
  ] },
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Method", detail: "FOIL shows curved arrows connecting multiplied terms. Grid shows a multiplication table. Both shows both diagrams side by side." },
    { label: "Multiplier Type", detail: "Numerical: number outside the bracket. Algebraic: variable term outside. Both active: randomly either." },
    { label: "Differentiated", detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ] },
];

// ── Question generators ──────────────────────────────────────────────────────

const genExpand = (level: DifficultyLevel, multiplierType: string, forcedVar?: string): FoilData => {
  const varName = forcedVar || pick(VARS);
  const useVar = multiplierType === "algebraic" ? true : multiplierType === "mixed" ? Math.random() > 0.5 : false;
  const outsidePower = useVar ? (Math.random() > 0.5 ? 1 : 2) : 0;

  let a: number, b: number, c: number, isReversed = false;
  if (level === "level1") {
    a = randInt(2, 10); b = randInt(1, 5); c = randInt(0, 9);
  } else if (level === "level2") {
    a = randInt(2, 10);
    if (Math.random() > 0.5) { b = randInt(1, 9); c = randInt(1, 9); isReversed = true; }
    else { b = randInt(1, 9); c = randInt(-9, -1); }
  } else {
    a = randInt(-10, 10); if (a === 0) a = -1;
    b = randInt(-5, 5); if (b === 0) b = 1;
    c = randInt(-9, 9);
  }

  let xCoeff = 0, x2Coeff = 0, x3Coeff = 0, constant = 0;
  if (useVar) {
    if (outsidePower === 1) { x2Coeff = a * b; xCoeff = a * c; }
    else { x3Coeff = a * b; x2Coeff = a * c; }
  } else {
    xCoeff = isReversed ? a * (-b) : a * b;
    constant = a * c;
  }

  return { a, b, c, isReversed, withVariable: useVar, outsidePower, varName, xCoeff, x2Coeff, x3Coeff, constant };
};

const genDoubleData = (level: DifficultyLevel): DoubleRaw => {
  let a: number, b: number, c: number, d: number;
  if (level === "level1") {
    a = 1; b = randInt(1, 9); c = 1; d = randInt(1, 9);
  } else if (level === "level2") {
    a = 1; b = randInt(-9, 9); c = 1; d = randInt(-9, 9);
    if (b === 0) b = 1; if (d === 0) d = 1;
    if (b > 0 && d > 0) { if (Math.random() < 0.5) b = -b; else d = -d; }
  } else {
    a = randInt(1, 5); b = randInt(-7, 7); if (b === 0) b = 1;
    c = randInt(1, 5); d = randInt(-7, 7); if (d === 0) d = 1;
    if (Math.random() < 0.3) { if (Math.random() < 0.5) a = -a; else c = -c; }
  }
  return { tool: "double", a, b, c, d };
};

// ── Build working steps ──────────────────────────────────────────────────────

interface DiagramExtra { diagramType: string; foilData?: FoilData; doubleData?: DoubleRaw; label?: string }

const diagramStep = (label: string, latex: string, extra: DiagramExtra): WorkingStep =>
  ({ ...mStep(label, latex), extra });

const buildExpandWorking = (fd: FoilData, method: string): WorkingStep[] => {
  const steps: WorkingStep[] = [];
  const dispLx = foilDisplayLatex(fd);
  if (method === "foil" || method === "both")
    steps.push(diagramStep("FOIL", dispLx, { diagramType: "singleFoil", foilData: fd }));
  if (method === "grid" || method === "both")
    steps.push(diagramStep("Grid", dispLx, { diagramType: "singleGrid", foilData: fd }));
  steps.push(mStep("Answer:", foilAnswerLatex(fd)));
  return steps;
};

const buildSimplifyWorking = (fd1: FoilData, fd2: FoilData, op: string, method: string): WorkingStep[] => {
  const steps: WorkingStep[] = [];
  const d1 = foilDisplayLatex(fd1), d2 = foilDisplayLatex(fd2);
  if (method === "foil" || method === "both") {
    steps.push(diagramStep(`Expand: ${d1}`, d1, { diagramType: "singleFoil", foilData: fd1, label: `Expand: ${d1}` }));
    steps.push(diagramStep(`Expand: ${d2}`, d2, { diagramType: "singleFoil", foilData: fd2, label: `Expand: ${d2}` }));
  }
  if (method === "grid" || method === "both") {
    steps.push(diagramStep(`Expand: ${d1}`, d1, { diagramType: "singleGrid", foilData: fd1, label: `Expand: ${d1}` }));
    steps.push(diagramStep(`Expand: ${d2}`, d2, { diagramType: "singleGrid", foilData: fd2, label: `Expand: ${d2}` }));
  }
  const a1 = foilAnswerLatex(fd1), a2 = foilAnswerLatex(fd2);
  steps.push(mStep("Combine:", `(${a1}) ${op} (${a2})`));

  const v = fd1.varName;
  const m = op === "+" ? 1 : -1;
  const x3 = fd1.x3Coeff + m * fd2.x3Coeff;
  const x2 = fd1.x2Coeff + m * fd2.x2Coeff;
  const x1 = fd1.xCoeff + m * fd2.xCoeff;
  const x0 = fd1.constant + m * fd2.constant;
  let ans = "";
  if (x3 !== 0) ans += signedLatex(x3, `${v}^3`, ans === "");
  if (x2 !== 0) ans += signedLatex(x2, `${v}^2`, ans === "");
  if (x1 !== 0) ans += signedLatex(x1, v, ans === "");
  if (x0 !== 0) ans += signedLatex(x0, "", ans === "");
  steps.push(mStep("Answer:", ans || "0"));
  return steps;
};

const buildDoubleWorking = (raw: DoubleRaw, method: string): WorkingStep[] => {
  const { a, b, c, d } = raw;
  const steps: WorkingStep[] = [];
  const dispLx = doubleDisplayLatex(a, b, c, d);
  if (method === "foil" || method === "both")
    steps.push(diagramStep("FOIL Method", dispLx, { diagramType: "doubleFoil", doubleData: raw }));
  if (method === "grid" || method === "both")
    steps.push(diagramStep("Grid Method", dispLx, { diagramType: "doubleGrid", doubleData: raw }));

  const outer = a * d, inner = b * c, xCoeff = outer + inner;
  if (outer !== 0 && inner !== 0 && xCoeff !== outer && xCoeff !== inner) {
    const collectLx = `${signedLatex(outer, "x", true)} ${inner >= 0 ? "+" : "-"} ${termLatex(Math.abs(inner), "x")} = ${signedLatex(xCoeff, "x", true)}`;
    steps.push(mStep("Collect like terms:", collectLx));
  }
  steps.push(mStep("Answer:", doubleAnswerLatex(a, b, c, d)));
  return steps;
};

// ── generateQuestion ─────────────────────────────────────────────────────────

const simplifyAnswerLatex = (fd1: FoilData, fd2: FoilData, op: string): string => {
  const v = fd1.varName;
  const m = op === "+" ? 1 : -1;
  const x3 = fd1.x3Coeff + m * fd2.x3Coeff;
  const x2 = fd1.x2Coeff + m * fd2.x2Coeff;
  const x1 = fd1.xCoeff + m * fd2.xCoeff;
  const x0 = fd1.constant + m * fd2.constant;
  let ans = "";
  if (x3 !== 0) ans += signedLatex(x3, `${v}^3`, ans === "");
  if (x2 !== 0) ans += signedLatex(x2, `${v}^2`, ans === "");
  if (x1 !== 0) ans += signedLatex(x1, v, ans === "");
  if (x0 !== 0) ans += signedLatex(x0, "", ans === "");
  return ans || "0";
};

const getMultiplier = (msv: Record<string, boolean>): string => {
  const numOn = msv["numerical"] !== false;
  const algOn = msv["algebraic"] === true;
  if (numOn && algOn) return "mixed";
  if (algOn) return "algebraic";
  return "numerical";
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const t = tool as ToolType;
  const method = dropdownValue || "foil";
  const id = Math.floor(Math.random() * 1_000_000);

  if (t === "double") {
    const raw = genDoubleData(level);
    const { a, b, c, d } = raw;
    return {
      kind: "simple",
      display: "",
      displayLatex: doubleDisplayLatex(a, b, c, d),
      answer: "",
      answerLatex: doubleAnswerLatex(a, b, c, d),
      working: buildDoubleWorking(raw, method),
      key: `double-${level}-${a}-${b}-${c}-${d}-${id}`,
      difficulty: level,
      _rawValues: raw,
    } as unknown as AnyQuestion;
  }

  const msv = multiSelectValues ?? {};
  const multiplier = getMultiplier(msv);

  if (t === "simplify") {
    const varName = pick(VARS);
    const lvl1: DifficultyLevel = level === "level1" ? "level1" : level === "level2" ? "level1" : "level3";
    const lvl2: DifficultyLevel = level === "level1" ? "level1" : level === "level2" ? (Math.random() > 0.5 ? "level1" : "level2") : (Math.random() > 0.5 ? "level1" : "level2");
    const fd1 = genExpand(lvl1, multiplier, varName);
    const fd2 = genExpand(lvl2, multiplier, varName);
    const op = level === "level1" ? "+" : (Math.random() > 0.5 ? "+" : "-");
    const d1 = foilDisplayLatex(fd1), d2 = foilDisplayLatex(fd2);
    const raw: SimplifyRaw = { tool: "simplify", fd1, fd2, operator: op, varName };

    return {
      kind: "simple",
      display: "",
      displayLatex: `${d1} ${op} ${d2}`,
      answer: "",
      answerLatex: simplifyAnswerLatex(fd1, fd2, op),
      working: buildSimplifyWorking(fd1, fd2, op, method),
      key: `simplify-${level}-${fd1.a}-${fd1.b}-${fd1.c}-${op}-${fd2.a}-${fd2.b}-${fd2.c}-${varName}-${id}`,
      difficulty: level,
      _rawValues: raw,
    } as unknown as AnyQuestion;
  }

  // expand
  const fd = genExpand(level, multiplier);
  const raw: ExpandRaw = { tool: "expand", fd };

  return {
    kind: "simple",
    display: "",
    displayLatex: foilDisplayLatex(fd),
    answer: "",
    answerLatex: foilAnswerLatex(fd),
    working: buildExpandWorking(fd, method),
    key: `expand-${level}-${fd.a}-${fd.b}-${fd.c}-${fd.varName}-${fd.withVariable ? 1 : 0}-${fd.outsidePower}-${id}`,
    difficulty: level,
    _rawValues: raw,
  } as unknown as AnyQuestion;
};

// ── reformatQuestion ─────────────────────────────────────────────────────────

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const raw = (q as any)._rawValues as RawValues | undefined;
  if (!raw) return null;
  const method = qo.dropdownValue || "foil";

  if (raw.tool === "expand") {
    return { ...q, working: buildExpandWorking(raw.fd, method) } as unknown as AnyQuestion;
  }
  if (raw.tool === "simplify") {
    return { ...q, working: buildSimplifyWorking(raw.fd1, raw.fd2, raw.operator, method) } as unknown as AnyQuestion;
  }
  if (raw.tool === "double") {
    return { ...q, working: buildDoubleWorking(raw, method) } as unknown as AnyQuestion;
  }
  return null;
};

// ── stepRenderer ─────────────────────────────────────────────────────────────

const stepRenderer = (ws: WorkingStep, colorScheme: string): JSX.Element | null => {
  const bg = getStepBg(colorScheme);
  const extra = ws.extra as DiagramExtra | undefined;

  if (extra?.diagramType) {
    const { diagramType, foilData, doubleData, label } = extra;

    if (diagramType === "singleFoil" && foilData)
      return (
        <div className="rounded-xl p-6" style={{ backgroundColor: bg }}>
          {label ? <h4 className="text-lg font-bold mb-2" style={{ color: "#000" }}>{label}</h4>
            : <h4 className="text-lg font-bold mb-1" style={{ color: "#000" }}>FOIL</h4>}
          <SFoilDisplay fd={foilData} />
        </div>
      );

    if (diagramType === "singleGrid" && foilData)
      return (
        <div className="rounded-xl p-6" style={{ backgroundColor: bg }}>
          {label ? <h4 className="text-lg font-bold mb-2" style={{ color: "#000" }}>{label}</h4>
            : <h4 className="text-lg font-bold mb-1" style={{ color: "#000" }}>Grid</h4>}
          <SGridDisplay fd={foilData} />
        </div>
      );

    if (diagramType === "doubleFoil" && doubleData)
      return (
        <div className="rounded-xl p-6" style={{ backgroundColor: bg }}>
          <h4 className="text-lg font-bold mb-1" style={{ color: "#000" }}>FOIL Method</h4>
          <p className="text-base text-gray-500 mb-4">First · Outer · Inner · Last</p>
          <DFoilDisplay a={doubleData.a} b={doubleData.b} c={doubleData.c} d={doubleData.d} />
        </div>
      );

    if (diagramType === "doubleGrid" && doubleData)
      return (
        <div className="rounded-xl p-6" style={{ backgroundColor: bg }}>
          <h4 className="text-lg font-bold mb-1" style={{ color: "#000" }}>Grid Method</h4>
          <p className="text-base text-gray-500 mb-4">Multiply each pair of terms</p>
          <DGridDisplay a={doubleData.a} b={doubleData.b} c={doubleData.c} d={doubleData.d} />
        </div>
      );
  }

  // Regular step rendering
  if (ws.type === "mStep" || ws.label) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: bg }}>
        {ws.label && <div className="text-base font-bold mb-1" style={{ color: "#000" }}>{ws.label}</div>}
        <div className="text-center">
          <MathRenderer latex={ws.latex} style={{ fontSize: "1.25em" }} />
          {ws.unit && <span className="ml-1 text-base">{ws.unit}</span>}
        </div>
      </div>
    );
  }

  if (ws.type === "tStep") {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: bg }}>
        <span className="text-base" style={{ color: "#000" }}>{ws.plain}</span>
      </div>
    );
  }

  // step (pure KaTeX)
  return (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: bg }}>
      <MathRenderer latex={ws.latex} style={{ fontSize: "1.25em" }} />
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────

void (pickActive as unknown);

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
      stepRenderer={stepRenderer}
      defaults={{ numQuestions: 15, numColumns: 3 }}
    />
  );
}
