import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  mStep,
} from "../../shared";

// ── Rational arithmetic ───────────────────────────────────────────────────────
type Rat = { n: number; d: number };
const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
const rat = (n: number, d = 1): Rat => {
  if (d === 0) throw new Error("zero denominator");
  const sign = d < 0 ? -1 : 1;
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: sign * n / g, d: Math.abs(d) / g };
};
const ratAdd = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const ratSub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const ratMul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
const ratDiv = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n);
const isInt = (r: Rat) => r.d === 1;
const ratEq = (a: Rat, b: Rat) => a.n === b.n && a.d === b.d;
const ratLatex = (r: Rat): string => {
  if (isInt(r)) return `${r.n}`;
  const neg = r.n < 0;
  return neg ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`;
};
const fracLatex = (n: number, d: number): string => {
  const g = gcd(Math.abs(n), Math.abs(d));
  const rn = n / g, rd = Math.abs(d / g);
  if (rd === 1) return `${rn}`;
  return rn < 0 ? `-\\frac{${-rn}}{${rd}}` : `\\frac{${rn}}{${rd}}`;
};

// ── Local helpers ─────────────────────────────────────────────────────────────
type ToolType = "gradient" | "equation" | "missing";
type MissingVar = "x" | "y" | "m" | "c";

const coordLatex = (x: number, y: number) => `(${x},\\,${y})`;
const DENOMS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const fmtN = (n: number) => n >= 0 ? `${n}` : `(${n})`;

const equationLatex = (gradN: number, gradD: number, c: number): string => {
  const absN = Math.abs(gradN), isOne = absN === gradD, negGrad = gradN < 0;
  const mxStr = isOne ? (negGrad ? "-x" : "x") : `${fracLatex(gradN, gradD)}x`;
  if (c === 0) return `y = ${mxStr}`;
  return `y = ${mxStr} ${c > 0 ? "+" : "-"} ${Math.abs(c)}`;
};

const fullEqLatex = (m: Rat | "?", c: Rat | "?"): string => {
  let mx: string;
  if (m === "?") { mx = "{?}x"; }
  else {
    const mr = m as Rat;
    mx = isInt(mr) ? (mr.n === 1 ? "x" : mr.n === -1 ? "-x" : `${mr.n}x`) : `${ratLatex(mr)}x`;
  }
  if (c === "?") return `y = ${mx} + {?}`;
  const cr = c as Rat;
  if (cr.n === 0) return `y = ${mx}`;
  const cIsNeg = cr.n < 0;
  const cAbs = cIsNeg ? ratLatex(rat(-cr.n, cr.d)) : ratLatex(cr);
  return `y = ${mx} ${cIsNeg ? "-" : "+"} ${cAbs}`;
};

// ── Config ────────────────────────────────────────────────────────────────────
const SHARED_VARIABLES = [
  { key: "randomOrder", label: "Random coordinate order", defaultValue: false },
  { key: "negativeCoords", label: "Include negative coordinates", defaultValue: false },
];

const LEVEL3_DD = {
  key: "fracSign", label: "Gradient Sign",
  options: [
    { value: "positive", label: "Positive" },
    { value: "negative", label: "Negative" },
    { value: "mixed", label: "Mixed" },
  ],
  defaultValue: "positive",
};

const SHARED_DIFF_SETTINGS = {
  level1: { dropdown: null, variables: SHARED_VARIABLES },
  level2: { dropdown: null, variables: SHARED_VARIABLES },
  level3: { dropdown: LEVEL3_DD, variables: SHARED_VARIABLES },
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Properties of Line Equations",
  tools: {
    gradient: {
      name: "Gradients",
      instruction: "Find the gradient of the line connecting:",
      useSubstantialBoxes: true,
      variables: SHARED_VARIABLES,
      dropdown: null,
      difficultySettings: SHARED_DIFF_SETTINGS,
    },
    equation: {
      name: "Line Equations",
      instruction: "Find the equation of the line connecting:",
      useSubstantialBoxes: true,
      variables: SHARED_VARIABLES,
      dropdown: null,
      difficultySettings: SHARED_DIFF_SETTINGS,
    },
    missing: {
      name: "Missing Values",
      instruction: "",
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      multiSelect: {
        key: "missingVars",
        label: "Missing Variable",
        options: [
          { value: "x", label: "x", defaultActive: true },
          { value: "y", label: "y", defaultActive: true },
          { value: "m", label: "m", defaultActive: true },
          { value: "c", label: "c", defaultActive: true },
        ],
      },
      difficultySettings: null,
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "Gradients", icon: "📈", content: [
    { label: "Overview", detail: "Given two coordinate pairs, calculate the gradient using m = (y₂ − y₁) ÷ (x₂ − x₁)." },
    { label: "Level 1 — Green", detail: "Positive integer gradients." },
    { label: "Level 2 — Yellow", detail: "Negative integer gradients." },
    { label: "Level 3 — Red", detail: "Fractional gradients (denominators 2–10). Set to positive, negative, or mixed." },
  ]},
  { title: "Line Equations", icon: "📝", content: [
    { label: "Overview", detail: "Find the gradient first, then substitute a coordinate into y = mx + c to solve for c." },
    { label: "Level 1 — Green", detail: "Positive integer gradients, whole-number c." },
    { label: "Level 2 — Yellow", detail: "Negative integer gradients, whole-number c." },
    { label: "Level 3 — Red", detail: "Fractional gradients. c will always be a whole number or zero." },
  ]},
  { title: "Missing Values", icon: "🔍", content: [
    { label: "Overview", detail: "Given y = mx + c and a coordinate, three of four values are shown. Find the missing one." },
    { label: "Level 1 — Green", detail: "All values are positive integers." },
    { label: "Level 2 — Yellow", detail: "Values may be negative integers." },
    { label: "Level 3 — Red", detail: "Exactly one given value is a fraction; the missing value may also be a fraction." },
  ]},
];

// ── Missing question generator ────────────────────────────────────────────────
const buildMissingWorking = (mv: MissingVar, m: Rat, c: Rat, x: Rat, y: Rat): WorkingStep[] => {
  const mL = ratLatex(m), cL = ratLatex(c), xL = ratLatex(x), yL = ratLatex(y);
  const mx = ratMul(m, x); const mxL = ratLatex(mx);
  switch (mv) {
    case "y": return [
      mStep("Substitute into y = mx + c", `y = ${mL} \\times ${xL} + ${cL}`),
      mStep("Simplify", `y = ${mxL} + ${cL} = ${yL}`),
    ];
    case "x": {
      const ymc = ratSub(y, c);
      return [
        mStep("Substitute known values", `${yL} = ${mL} \\times x + ${cL}`),
        mStep("Rearrange", `${ratLatex(ymc)} = ${mL} \\times x`),
        mStep("Solve for x", `x = \\dfrac{${ratLatex(ymc)}}{${mL}} = ${xL}`),
      ];
    }
    case "m": {
      const ymc = ratSub(y, c);
      return [
        mStep("Substitute known values", `${yL} = m \\times ${xL} + ${cL}`),
        mStep("Rearrange", `${ratLatex(ymc)} = m \\times ${xL}`),
        mStep("Solve for m", `m = \\dfrac{${ratLatex(ymc)}}{${xL}} = ${mL}`),
      ];
    }
    case "c": return [
      mStep("Substitute known values", `${yL} = ${mL} \\times ${xL} + c`),
      mStep("Solve for c", `c = ${yL} - ${mxL} = ${cL}`),
    ];
  }
};

const generateMissingQuestion = (level: DifficultyLevel, allowedVars: MissingVar[]): AnyQuestion | null => {
  const mv = allowedVars[Math.floor(Math.random() * allowedVars.length)];
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      let m: Rat, c: Rat, x: Rat, y: Rat;
      if (level === "level1") {
        m = rat(Math.floor(Math.random() * 8) + 1);
        c = rat(Math.floor(Math.random() * 11));
        x = rat(Math.floor(Math.random() * 10) + 1);
        y = ratAdd(ratMul(m, x), c);
        if (!isInt(y) || y.n <= 0 || y.n > 30) continue;
      } else if (level === "level2") {
        const mVal = Math.floor(Math.random() * 17) - 8;
        if (mVal === 0) continue;
        m = rat(mVal);
        c = rat(Math.floor(Math.random() * 21) - 10);
        x = rat(Math.floor(Math.random() * 21) - 10);
        y = ratAdd(ratMul(m, x), c);
        if (!isInt(y) || Math.abs(y.n) > 30) continue;
      } else {
        const givens = (["x","y","m","c"] as MissingVar[]).filter(v => v !== mv);
        const fracGiven = givens[Math.floor(Math.random() * givens.length)];
        const d = DENOMS[Math.floor(Math.random() * DENOMS.length)];
        const nAbs = Math.floor(Math.random() * (d * 3)) + 1;
        const gg = gcd(nAbs, d); const rn = nAbs / gg, rd = d / gg;
        if (rd === 1) continue;
        const fracVal = rat((Math.random() < 0.5 ? 1 : -1) * rn, rd);
        const intGivens = givens.filter(v => v !== fracGiven);
        const vals: Record<MissingVar, Rat | null> = { x: null, y: null, m: null, c: null };
        vals[fracGiven] = fracVal;
        for (const iv of intGivens) {
          if (iv === "m") vals.m = rat(Math.floor(Math.random() * 17) - 8);
          else if (iv === "c") vals.c = rat(Math.floor(Math.random() * 21) - 10);
          else if (iv === "x") vals.x = rat(Math.floor(Math.random() * 21) - 10);
          else vals.y = rat(Math.floor(Math.random() * 21) - 10);
        }
        if (vals.m && vals.m.n === 0) continue;
        if (mv === "y") { if (!vals.m||!vals.x||!vals.c) continue; vals.y = ratAdd(ratMul(vals.m,vals.x),vals.c); }
        else if (mv === "x") { if (!vals.m||!vals.y||!vals.c||vals.m.n===0) continue; vals.x = ratDiv(ratSub(vals.y,vals.c),vals.m); }
        else if (mv === "m") { if (!vals.y||!vals.x||!vals.c||vals.x.n===0) continue; vals.m = ratDiv(ratSub(vals.y,vals.c),vals.x); }
        else { if (!vals.m||!vals.x||!vals.y) continue; vals.c = ratSub(vals.y,ratMul(vals.m,vals.x)); }
        if (!vals.m||!vals.c||!vals.x||!vals.y) continue;
        m = vals.m; c = vals.c; x = vals.x; y = vals.y;
        if ([m,c,x,y].some(r => Math.abs(r.n) > 60 || r.d > 20)) continue;
      }
      const check = ratAdd(ratMul(m!, x!), c!);
      if (!ratEq(check, y!)) continue;
      const mq = m!, cq = c!, xq = x!, yq = y!;
      const eqL = mv === "m" ? fullEqLatex("?", cq) : mv === "c" ? fullEqLatex(mq, "?") : fullEqLatex(mq, cq);
      const xStr = mv === "x" ? "x" : ratLatex(xq);
      const yStr = mv === "y" ? "y" : ratLatex(yq);
      const crdL = `\\left(${xStr},\\,${yStr}\\right)`;
      const answerVal = mv === "x" ? xq : mv === "y" ? yq : mv === "m" ? mq : cq;
      const ansLtx = `${mv} = ${ratLatex(answerVal)}`;
      return {
        kind: "simple",
        display: "",
        displayLatex: `\\text{The line } ${eqL} \\text{ passes through } ${crdL}\\text{. Find } ${mv}`,
        answer: ansLtx,
        answerLatex: ansLtx,
        working: buildMissingWorking(mv, mq, cq, xq, yq),
        key: `missing-${level}-${mv}-${Math.floor(Math.random() * 1_000_000)}`,
        difficulty: level,
      };
    } catch { continue; }
  }
  return null;
};

// ── Gradient / equation generator ────────────────────────────────────────────
const generateCoords = (level: DifficultyLevel, variables: Record<string,boolean>, dropdownValue: string) => {
  const negCoords = variables["negativeCoords"] ?? false;
  for (let attempt = 0; attempt < 200; attempt++) {
    let gradN: number, gradD: number, c: number;
    if (level !== "level3") {
      const mAbs = Math.floor(Math.random() * 7) + 2;
      const mSign = level === "level1" ? 1 : -1;
      const finalM = Math.random() < 0.15 ? mSign : mAbs * mSign;
      c = Math.floor(Math.random() * 61) - 30; gradN = finalM; gradD = 1;
      const xMin = negCoords ? -6 : 0, xMax = negCoords ? 4 : 6;
      const xa = Math.floor(Math.random() * (xMax - xMin - 1)) + xMin;
      const xb = xa + Math.floor(Math.random() * 3) + 2;
      const ya = finalM * xa + c, yb = finalM * xb + c;
      if (!Number.isInteger(ya)||!Number.isInteger(yb)) continue;
      if (Math.abs(ya)>20||Math.abs(yb)>20) continue;
      if (!negCoords && (ya<0||yb<0||xa<0||xb<0)) continue;
      return { x1: xa, y1: ya, x2: xb, y2: yb, gradN, gradD };
    } else {
      const sign = dropdownValue === "positive" ? 1 : dropdownValue === "negative" ? -1 : (Math.random()<0.5?1:-1);
      const d = DENOMS[Math.floor(Math.random() * DENOMS.length)];
      const n = Math.floor(Math.random() * (d * 4)) + 1;
      const gg = gcd(n, d); const rn = n/gg, rd = d/gg;
      if (rd === 1) continue;
      gradN = sign*rn; gradD = rd; c = Math.floor(Math.random() * 61) - 30;
      const xm = Math.floor(Math.random() * (negCoords ? 7 : 5)) + (negCoords ? -3 : 0);
      const xa = xm * rd, xb = xa + rd * (Math.floor(Math.random() * 3) + 2);
      const ya = (gradN*xa)/gradD + c, yb = (gradN*xb)/gradD + c;
      if (!Number.isInteger(ya)||!Number.isInteger(yb)) continue;
      if (Math.abs(xa)>12||Math.abs(xb)>12||Math.abs(ya)>20||Math.abs(yb)>20) continue;
      if (!negCoords && (ya<0||yb<0||xa<0||xb<0)) continue;
      return { x1: xa, y1: ya, x2: xb, y2: yb, gradN, gradD };
    }
  }
  return null;
};

// ── generateQuestion ──────────────────────────────────────────────────────────
const generateQuestion = (
  tool: string, level: DifficultyLevel,
  variables: Record<string,boolean>, dropdownValue: string,
  multiSelectValues: Record<string,boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;

  if (t === "missing") {
    const allowedVars = (["x","y","m","c"] as MissingVar[]).filter(v => multiSelectValues[v] !== false);
    const active = allowedVars.length > 0 ? allowedVars : (["x","y","m","c"] as MissingVar[]);
    for (let attempt = 0; attempt < 10; attempt++) {
      const q = generateMissingQuestion(level, active);
      if (q) return q;
    }
    return generateMissingQuestion("level1", ["x","y","m","c"])!;
  }

  const id = Math.floor(Math.random() * 1_000_000);
  const randomOrder = variables["randomOrder"] ?? false;
  let coords = generateCoords(level, variables, dropdownValue);
  while (!coords) coords = generateCoords(level, variables, dropdownValue);
  const { x1, y1, x2, y2, gradN, gradD } = coords;
  let dA: [number,number] = [x1,y1], dB: [number,number] = [x2,y2];
  if (randomOrder && Math.random() < 0.5) [dA, dB] = [dB, dA];
  const [wx1,wy1] = dA, [wx2,wy2] = dB;
  const diffY = wy2-wy1, diffX = wx2-wx1;
  const gradAnswerLatex = fracLatex(gradN, gradD);
  const displayLatex = `${coordLatex(dA[0],dA[1])} \\text{ and } ${coordLatex(dB[0],dB[1])}`;

  if (t === "gradient") {
    return {
      kind: "simple", display: "", displayLatex,
      answer: gradAnswerLatex, answerLatex: gradAnswerLatex,
      working: [mStep("Substitute into the gradient formula",
        `m = \\dfrac{${fmtN(wy2)} - ${fmtN(wy1)}}{${fmtN(wx2)} - ${fmtN(wx1)}} = \\dfrac{${diffY}}{${diffX}} = ${gradAnswerLatex}`)],
      key: `grad-${level}-${id}`, difficulty: level,
      _gN: gradN, _gD: gradD,
    } as AnyQuestion;
  }

  // equation — retry until c is integer
  let c = (gradD * wy1 - gradN * wx1) / gradD;
  let sdA = dA, sdB = dB, sgN = gradN, sgD = gradD;
  for (let retry = 0; retry < 100 && !Number.isInteger(c); retry++) {
    const nc = generateCoords(level, variables, dropdownValue);
    if (!nc) continue;
    let ndA: [number,number] = [nc.x1,nc.y1], ndB: [number,number] = [nc.x2,nc.y2];
    if (randomOrder && Math.random() < 0.5) [ndA, ndB] = [ndB, ndA];
    const nc2 = (nc.gradD * ndA[1] - nc.gradN * ndA[0]) / nc.gradD;
    if (Number.isInteger(nc2)) { sdA = ndA; sdB = ndB; sgN = nc.gradN; sgD = nc.gradD; c = nc2; }
  }
  const [swx1,swy1] = sdA, [swx2,swy2] = sdB;
  const sdiffY = swy2-swy1, sdiffX = swx2-swx1;
  const sgLatex = fracLatex(sgN, sgD);
  const mxStr = sgD === 1 ? `${sgN} \\times ${fmtN(swx1)}` : `\\dfrac{${sgN}}{${sgD}} \\times ${fmtN(swx1)}`;
  const mxVal = (sgN * swx1) / sgD;
  const eqAns = equationLatex(sgN, sgD, c);
  return {
    kind: "simple", display: "",
    displayLatex: `${coordLatex(sdA[0],sdA[1])} \\text{ and } ${coordLatex(sdB[0],sdB[1])}`,
    answer: eqAns, answerLatex: eqAns,
    working: [
      mStep("Substitute into the gradient formula",
        `m = \\dfrac{${fmtN(swy2)} - ${fmtN(swy1)}}{${fmtN(swx2)} - ${fmtN(swx1)}} = \\dfrac{${sdiffY}}{${sdiffX}} = ${sgLatex}`),
      mStep("Substitute into y = mx + c",
        `${fmtN(swy1)} = ${mxStr} + c \\implies ${fmtN(swy1)} = ${mxVal} + c`),
      mStep("Solve for c", `c = ${fmtN(swy1)} - ${mxVal} = ${c}`),
    ],
    key: `eq-${level}-${id}`, difficulty: level,
    _gN: sgN, _gD: sgD,
  } as AnyQuestion;
};

// ── generateUniqueQ with gradient-count deduplication ────────────────────────
let _gradientCounts: Record<string,number> = {};

const generateUniqueQ = (
  tool: string, level: DifficultyLevel,
  variables: Record<string,boolean>, dropdownValue: string,
  usedKeys: Set<string>, multiSelectValues: Record<string,boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (usedKeys.size === 0) _gradientCounts = {};

  let q: AnyQuestion; let attempts = 0;
  do {
    q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
    attempts++;
    if (t === "missing") break;
    const gKey = `${(q as any)._gN}/${(q as any)._gD}`;
    if (!usedKeys.has(q.key) && (_gradientCounts[gKey] ?? 0) < 4) break;
  } while (attempts < 150);

  usedKeys.add(q.key);
  if (t !== "missing") {
    const gKey = `${(q as any)._gN}/${(q as any)._gD}`;
    _gradientCounts[gKey] = (_gradientCounts[gKey] ?? 0) + 1;
  }
  return q;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      defaults={{ worksheetFontSize: 2 }}
    />
  );
}
