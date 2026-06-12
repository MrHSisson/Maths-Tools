import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type WorkingStep, type QOSnapshot, type PrintMode,
  randInt, pick, step, mStep, fmt, pickActive,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "circumference" | "area" | "sectors";
type SectorStyle = "area" | "arcLength" | "perimeter";
type CircleProp = "radius" | "diameter" | "circumference" | "area";

// Raw parameters stored on each question (_rawValues) so reformatQuestion can
// rebuild the display instantly when "Answers in π" is toggled.
interface RawValues {
  tool: ToolType;
  level: DifficultyLevel;
  decimals: boolean;
  answerPi: boolean;
  r: number;
  d: number;
  angle?: number;               // rotation of the radius/diameter line (circle)
  find?: "radius" | "diameter"; // circle level 3
  style?: SectorStyle;          // sectors
  theta?: number;               // sectors
}

// Diagram parameters stored on each question (_diagram) — rendered by CircleSVG.
interface DiagramData {
  shape: "circle" | "sector";
  prompt: string;
  r: number;
  d: number;
  // circle
  given?: CircleProp;
  find?: CircleProp;
  angle?: number;
  givenLabel?: string;          // bottom pill, e.g. "C = 12π cm"
  // sector
  lvl?: 1 | 2 | 3;
  theta?: number;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const CIRCLE_VARS = [
  { key: "decimals", label: "Allow decimal lengths", defaultValue: false },
  { key: "answerPi", label: "Answers in terms of π", defaultValue: false },
];

const SECTOR_STYLE_OPTIONS = [
  { value: "area",      label: "Area",       defaultActive: true },
  { value: "arcLength", label: "Arc Length", defaultActive: true },
  { value: "perimeter", label: "Perimeter",  defaultActive: true },
];

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Properties of Circles",
  tools: {
    circumference: {
      name: "Circumference",
      variables: CIRCLE_VARS,
      dropdown: null,
      difficultySettings: null,
    },
    area: {
      name: "Area",
      variables: CIRCLE_VARS,
      dropdown: null,
      difficultySettings: null,
    },
    sectors: {
      name: "Sectors",
      variables: CIRCLE_VARS,
      dropdown: null,
      multiSelect: {
        key: "questionPool",
        label: "Question Types",
        options: SECTOR_STYLE_OPTIONS,
      },
      difficultySettings: null,
    },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Circumference", icon: "⭕", content: [
    { label: "Overview",         detail: "Find the circumference from a given diameter or radius, or work backwards from a given circumference." },
    { label: "Level 1 — Green",  detail: "Given the diameter, find the circumference using C = πd." },
    { label: "Level 2 — Yellow", detail: "Given the radius, find the circumference using C = 2πr." },
    { label: "Level 3 — Red",    detail: "Given the circumference, find the missing radius or diameter by rearranging." },
  ]},
  { title: "Area", icon: "🔵", content: [
    { label: "Overview",         detail: "Find the area from a given radius or diameter, or work backwards from a given area." },
    { label: "Level 1 — Green",  detail: "Given the radius, find the area using A = πr²." },
    { label: "Level 2 — Yellow", detail: "Given the diameter, find the area — halve to get r first, then A = πr²." },
    { label: "Level 3 — Red",    detail: "Given the area, find the missing radius or diameter by rearranging and square-rooting." },
  ]},
  { title: "Sectors", icon: "🥧", content: [
    { label: "Overview",         detail: "Find the area, arc length or perimeter of a sector. Use Question Types to choose which are asked." },
    { label: "Level 1 — Green",  detail: "Semicircles (θ = 180°) with the diameter given." },
    { label: "Level 2 — Yellow", detail: "Quarter circles (θ = 90°) with the radius given." },
    { label: "Level 3 — Red",    detail: "Any sector angle θ with the radius given." },
  ]},
  { title: "Options", icon: "⚙️", content: [
    { label: "Allow decimal lengths", detail: "When on, the given dimensions may be decimal values such as 4.5 cm." },
    { label: "Answers in terms of π", detail: "When on, answers are exact multiples of π (e.g. 12π) instead of rounded decimals. Toggling reformats the current question instantly." },
    { label: "Question Types",        detail: "For Sectors: choose any mix of Area, Arc Length and Perimeter questions." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Single question with the diagram on screen and space to work." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "3 × 5 grid of diagram questions with PDF export (questions and answers)." },
  ]},
];

// ── 4. Helpers ────────────────────────────────────────────────────────────────

// Nice value pools — avoid awkward squares and large primes so r² stays manageable.
const NICE_INTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 28, 30];
const NICE_DECS = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 20.5];

const pickDim = (decimals: boolean, max = 30): number =>
  pick((decimals ? NICE_DECS : NICE_INTS).filter(n => n <= max));

// θ pool for level-3 sectors — multiples of 5 that aren't the L1/L2 special cases.
const THETAS = Array.from({ length: 61 }, (_, i) => 30 + i * 5).filter(t => ![90, 180, 270].includes(t));

const piLatex = (c: number): string => (c === 1 ? "\\pi" : `${fmt(c)}\\pi`);
const piText  = (c: number): string => (c === 1 ? "π" : `${fmt(c)}π`);

const newId = () => Math.floor(Math.random() * 1_000_000);

// ── 5. Question builders (from raw values) ────────────────────────────────────

const buildCircumference = (rv: RawValues): AnyQuestion => {
  const { level, r, d, answerPi } = rv;
  const C = Math.PI * d;

  if (level === "level1" || level === "level2") {
    const givenIsD = level === "level1";
    const ansLatex = answerPi ? piLatex(d) : fmt(C);
    const ansText  = answerPi ? piText(d)  : fmt(C);
    const working: WorkingStep[] = givenIsD
      ? [
          mStep("Given:", `d = ${fmt(d)}`, "cm"),
          step("C = \\pi d"),
          step(`C = \\pi \\times ${fmt(d)}`),
          mStep("Answer:", `C = ${ansLatex}`, "cm"),
        ]
      : [
          mStep("Given:", `r = ${fmt(r)}`, "cm"),
          step("C = 2\\pi r"),
          step(`C = 2 \\times \\pi \\times ${fmt(r)}`),
          mStep("Answer:", `C = ${ansLatex}`, "cm"),
        ];
    const prompt = "Find the circumference";
    return {
      kind: "simple",
      display: prompt,
      answer: `${ansText} cm`,
      answerLatex: ansLatex,
      answerSuffix: "cm",
      working,
      key: `circ-${level}-${givenIsD ? "d" : "r"}${givenIsD ? d : r}-${newId()}`,
      difficulty: level,
      _diagram: {
        shape: "circle", prompt, r, d, angle: rv.angle,
        given: givenIsD ? "diameter" : "radius", find: "circumference",
      } satisfies DiagramData,
      _rawValues: rv,
    } as unknown as AnyQuestion;
  }

  // level 3 — given C, find radius or diameter
  const find = rv.find ?? "radius";
  const CLabelText  = answerPi ? piText(d)  : fmt(C);
  const CLabelLatex = answerPi ? piLatex(d) : fmt(C);
  const eq = answerPi ? "=" : "\\approx";
  const ans = find === "radius" ? r : d;
  const working: WorkingStep[] = find === "radius"
    ? [
        mStep("Given:", `C = ${CLabelLatex}`, "cm"),
        step("C = 2\\pi r \\;\\Rightarrow\\; r = \\dfrac{C}{2\\pi}"),
        step(`r = \\dfrac{${CLabelLatex}}{2\\pi} ${eq} ${fmt(r)}`),
        mStep("Answer:", `r = ${fmt(r)}`, "cm"),
      ]
    : [
        mStep("Given:", `C = ${CLabelLatex}`, "cm"),
        step("C = \\pi d \\;\\Rightarrow\\; d = \\dfrac{C}{\\pi}"),
        step(`d = \\dfrac{${CLabelLatex}}{\\pi} ${eq} ${fmt(d)}`),
        mStep("Answer:", `d = ${fmt(d)}`, "cm"),
      ];
  const prompt = `Find the ${find}`;
  return {
    kind: "simple",
    display: prompt,
    answer: `${fmt(ans)} cm`,
    answerLatex: fmt(ans),
    answerSuffix: "cm",
    working,
    key: `circ-level3-C${d}-${find}-${newId()}`,
    difficulty: level,
    _diagram: {
      shape: "circle", prompt, r, d, angle: rv.angle,
      given: "circumference", find, givenLabel: `C = ${CLabelText} cm`,
    } satisfies DiagramData,
    _rawValues: rv,
  } as unknown as AnyQuestion;
};

const buildArea = (rv: RawValues): AnyQuestion => {
  const { level, r, d, answerPi } = rv;
  const r2 = Math.round(r * r * 100) / 100;
  const A = Math.PI * r * r;

  if (level === "level1" || level === "level2") {
    const givenIsR = level === "level1";
    const ansLatex = answerPi ? piLatex(r2) : fmt(A);
    const ansText  = answerPi ? piText(r2)  : fmt(A);
    const working: WorkingStep[] = [
      mStep("Given:", givenIsR ? `r = ${fmt(r)}` : `d = ${fmt(d)}`, "cm"),
      ...(givenIsR ? [] : [step(`r = d \\div 2 = ${fmt(d)} \\div 2 = ${fmt(r)}`)]),
      step("A = \\pi r^2"),
      step(`A = \\pi \\times ${fmt(r)}^2 = \\pi \\times ${fmt(r2)}`),
      mStep("Answer:", `A = ${ansLatex}`, "cm²"),
    ];
    const prompt = "Find the area";
    return {
      kind: "simple",
      display: prompt,
      answer: `${ansText} cm²`,
      answerLatex: ansLatex,
      answerSuffix: "cm²",
      working,
      key: `area-${level}-${givenIsR ? "r" : "d"}${givenIsR ? r : d}-${newId()}`,
      difficulty: level,
      _diagram: {
        shape: "circle", prompt, r, d, angle: rv.angle,
        given: givenIsR ? "radius" : "diameter", find: "area",
      } satisfies DiagramData,
      _rawValues: rv,
    } as unknown as AnyQuestion;
  }

  // level 3 — given A, find radius or diameter
  const find = rv.find ?? "radius";
  const ALabelText  = answerPi ? piText(r2)  : fmt(A);
  const ALabelLatex = answerPi ? piLatex(r2) : fmt(A);
  const eq = answerPi ? "=" : "\\approx";
  const ans = find === "radius" ? r : d;
  const working: WorkingStep[] = [
    mStep("Given:", `A = ${ALabelLatex}`, "cm²"),
    step("A = \\pi r^2 \\;\\Rightarrow\\; r^2 = \\dfrac{A}{\\pi}"),
    step(`r^2 = \\dfrac{${ALabelLatex}}{\\pi} ${eq} ${fmt(r2)}`),
    step(`r = \\sqrt{${fmt(r2)}} = ${fmt(r)}`),
    ...(find === "diameter" ? [step(`d = 2r = 2 \\times ${fmt(r)} = ${fmt(d)}`)] : []),
    mStep("Answer:", `${find === "radius" ? "r" : "d"} = ${fmt(ans)}`, "cm"),
  ];
  const prompt = `Find the ${find}`;
  return {
    kind: "simple",
    display: prompt,
    answer: `${fmt(ans)} cm`,
    answerLatex: fmt(ans),
    answerSuffix: "cm",
    working,
    key: `area-level3-A${r2}-${find}-${newId()}`,
    difficulty: level,
    _diagram: {
      shape: "circle", prompt, r, d, angle: rv.angle,
      given: "area", find, givenLabel: `A = ${ALabelText} cm²`,
    } satisfies DiagramData,
    _rawValues: rv,
  } as unknown as AnyQuestion;
};

const buildSector = (rv: RawValues): AnyQuestion => {
  const { level, r, d, answerPi } = rv;
  const style = rv.style ?? "area";
  const theta = rv.theta ?? 180;
  const lvl = level === "level1" ? 1 : level === "level2" ? 2 : 3;

  const frac = theta / 360;
  const arc = frac * 2 * Math.PI * r;
  const area = frac * Math.PI * r * r;
  const perim = arc + 2 * r;
  const arcCoef = Math.round(frac * 2 * r * 100) / 100;
  const areaCoef = Math.round(frac * r * r * 100) / 100;

  const shapeName = lvl === 1 ? "semicircle" : lvl === 2 ? "quarter circle" : "sector";
  const thetaFrac = lvl === 1 ? "\\dfrac{1}{2}" : lvl === 2 ? "\\dfrac{1}{4}" : `\\dfrac{${theta}}{360}`;
  const givenSteps: WorkingStep[] = [
    mStep("Given:", lvl === 1 ? `d = ${fmt(d)}` : `r = ${fmt(r)}`, "cm"),
    ...(lvl === 3 ? [mStep("Sector angle:", `\\theta = ${theta}^\\circ`)] : []),
    ...(lvl === 1 ? [step(`r = d \\div 2 = ${fmt(d)} \\div 2 = ${fmt(r)}`)] : []),
  ];

  let prompt: string, ansLatex: string, ansText: string, suffix: string, working: WorkingStep[];

  if (style === "area") {
    prompt = `Find the area of the ${shapeName}`;
    ansLatex = answerPi ? piLatex(areaCoef) : fmt(area);
    ansText  = answerPi ? piText(areaCoef)  : fmt(area);
    suffix = "cm²";
    working = [
      ...givenSteps,
      step("A = \\dfrac{\\theta}{360} \\times \\pi r^2"),
      step(`A = ${thetaFrac} \\times \\pi \\times ${fmt(r)}^2`),
      mStep("Answer:", `A = ${ansLatex}`, "cm²"),
    ];
  } else if (style === "arcLength") {
    prompt = `Find the arc length of the ${shapeName}`;
    ansLatex = answerPi ? piLatex(arcCoef) : fmt(arc);
    ansText  = answerPi ? piText(arcCoef)  : fmt(arc);
    suffix = "cm";
    working = [
      ...givenSteps,
      step("l = \\dfrac{\\theta}{360} \\times 2\\pi r"),
      step(`l = ${thetaFrac} \\times 2 \\times \\pi \\times ${fmt(r)}`),
      mStep("Answer:", `l = ${ansLatex}`, "cm"),
    ];
  } else {
    prompt = `Find the perimeter of the ${shapeName}`;
    ansLatex = answerPi ? `${piLatex(arcCoef)} + ${fmt(2 * r)}` : fmt(perim);
    ansText  = answerPi ? `${piText(arcCoef)} + ${fmt(2 * r)}`  : fmt(perim);
    suffix = "cm";
    const arcVal = answerPi ? piLatex(arcCoef) : fmt(arc);
    working = [
      ...givenSteps,
      step(`l = \\dfrac{\\theta}{360} \\times 2\\pi r = ${thetaFrac} \\times 2\\pi \\times ${fmt(r)} = ${arcVal}`),
      step(`P = l + 2r = ${arcVal} + ${fmt(2 * r)}`),
      mStep("Answer:", `P = ${ansLatex}`, "cm"),
    ];
  }

  return {
    kind: "simple",
    display: prompt,
    answer: `${ansText} ${suffix}`,
    answerLatex: ansLatex,
    answerSuffix: suffix,
    working,
    key: `sector-${level}-${style}-r${r}-t${theta}-${newId()}`,
    difficulty: level,
    _diagram: { shape: "sector", prompt, r, d, lvl, theta } satisfies DiagramData,
    _rawValues: rv,
  } as unknown as AnyQuestion;
};

const buildQuestion = (rv: RawValues): AnyQuestion => {
  if (rv.tool === "circumference") return buildCircumference(rv);
  if (rv.tool === "area") return buildArea(rv);
  return buildSector(rv);
};

// ── 6. generateQuestion / generateUniqueQ / reformatQuestion ─────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const t = tool as ToolType;
  const decimals = variables["decimals"] ?? false;
  const answerPi = variables["answerPi"] ?? false;
  const angle = randInt(0, 11) * 15;

  if (t === "circumference" || t === "area") {
    // Circumference: L1 given d, L2 given r. Area: L1 given r, L2 given d.
    // Level 3 works backwards from C or A, so pick a clean radius.
    const dimIsD = t === "circumference" ? level === "level1" : level === "level2";
    const dim = pickDim(decimals);
    const r = level === "level3" ? dim : dimIsD ? dim / 2 : dim;
    const d = r * 2;
    const find = level === "level3" ? ((Math.random() < 0.5 ? "radius" : "diameter") as "radius" | "diameter") : undefined;
    return buildQuestion({ tool: t, level, decimals, answerPi, r, d, angle, find });
  }

  // sectors
  const style = pickActive(multiSelectValues ?? {}, SECTOR_STYLE_OPTIONS) as SectorStyle;
  const theta = level === "level1" ? 180 : level === "level2" ? 90 : pick(THETAS);
  const dim = pickDim(decimals, 24);
  const r = level === "level1" ? dim / 2 : dim;
  const d = r * 2;
  return buildQuestion({ tool: t, level, decimals, answerPi, r, d, style, theta });
};

// Worksheet dedup ignores the random id suffix so the same dimensions can't
// appear twice — keys themselves stay globally unique via the id.
const baseOf = (key: string) => key.replace(/-\d+$/, "");

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  let q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
  for (let i = 0; i < 80 && usedKeys.has(baseOf(q.key)); i++) {
    q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
  }
  usedKeys.add(baseOf(q.key));
  usedKeys.add(q.key);
  return q;
};

// Instant π ↔ decimal switch — same maths, reformatted display and working.
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rv = (q as any)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const decimals = qo.variables["decimals"] ?? false;
  const answerPi = qo.variables["answerPi"] ?? false;
  if (decimals !== rv.decimals) return null;                            // value pool changed
  if (rv.style && qo.multiSelectValues[rv.style] === false) return null; // style deselected
  if (answerPi === rv.answerPi) return q;
  return buildQuestion({ ...rv, answerPi });
};

// ── 7. SVG diagram ────────────────────────────────────────────────────────────

const LINE = "#111827";
const ACCENT = "#1d4ed8";
const ACCENT_LIGHT = "#93c5fd";
const CIRCLE_FILL = "rgba(29,78,216,0.06)";
const SECTOR_FILL = "rgba(29,78,216,0.15)";
const UNKNOWN = "#16a34a";

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] =>
  [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];

const sectorPath = (cx: number, cy: number, r: number, startDeg: number, sweep: number): string => {
  const [x1, y1] = polar(cx, cy, r, startDeg);
  const [x2, y2] = polar(cx, cy, r, startDeg + sweep);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
};

// Dimension line with outward-pointing arrowheads at both ends. `k` scales the
// stroke and arrow sizes to the diagram's view scale (see VIEW_REF below).
const DimLine = ({ x1, y1, x2, y2, k = 1 }: { x1: number; y1: number; x2: number; y2: number; k?: number }) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const A = 14 * k, W = 6 * k;
  const head = (ex: number, ey: number, dirX: number, dirY: number) =>
    `${ex - dirX * A + px * W},${ey - dirY * A + py * W} ${ex},${ey} ${ex - dirX * A - px * W},${ey - dirY * A - py * W}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth={3.5 * k} />
      <polyline points={head(x1, y1, -ux, -uy)} fill="none" stroke={LINE} strokeWidth={3 * k} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={head(x2, y2, ux, uy)} fill="none" stroke={LINE} strokeWidth={3 * k} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

const pillW = (text: string): number => text.length * 28 * 0.56 + 28 * 0.9;
const PILL_H = 42;

const Pill = ({ x, y, text, color = ACCENT, italic = false, boxed = false, k = 1 }: {
  x: number; y: number; text: string; color?: string; italic?: boolean; boxed?: boolean; k?: number;
}) => {
  const w = pillW(text) * k;
  const h = PILL_H * k;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={9 * k}
        fill="#ffffff" opacity={0.96}
        stroke={boxed ? ACCENT_LIGHT : "#d1d5db"} strokeWidth={1.8 * k} />
      <text x={x} y={y + k} textAnchor="middle" dominantBaseline="central"
        fontSize={28 * k} fontWeight={700} fill={color}
        fontStyle={italic ? "italic" : "normal"}
        fontFamily="'Segoe UI', Arial, sans-serif">
        {text}
      </text>
    </g>
  );
};

// Every diagram is normalised so its longest viewBox side represents the same
// on-screen size. Labels and strokes are drawn at (size × view/VIEW_REF), so
// when the cell scales the viewBox down, they come out identical in every cell.
const VIEW_REF = 500;

const CircleSVG = ({ d, showAnswer, qIndex }: { d: DiagramData; showAnswer: boolean; qIndex?: number }) => {
  const ep = qIndex !== undefined ? { "data-q-index": qIndex } : {};

  if (d.shape === "sector") {
    const lvl = d.lvl ?? 1;
    const theta = d.theta ?? 180;
    const R = 200;
    // Semicircles open upwards from a horizontal diameter; other sectors sweep
    // clockwise from the upward radius. Drawn around (0,0) — the viewBox is
    // computed from the content's bounding box so the diagram is always tight
    // and centred, whatever the angle.
    const startDeg = lvl === 1 ? 180 : -90;

    const [sx, sy] = polar(0, 0, R, startDeg);
    const [ex, ey] = polar(0, 0, R, startDeg + theta);

    // Bounding box: vertex, both edge endpoints, plus every cardinal direction
    // the arc sweeps through.
    const xs = [0, sx, ex], ys = [0, sy, ey];
    for (let a = Math.ceil(startDeg / 90) * 90; a <= startDeg + theta; a += 90) {
      const [px, py] = polar(0, 0, R, a);
      xs.push(px); ys.push(py);
    }

    // Dimension: L1 labels the diameter (the flat edge); L2/L3 label the starting radius.
    const dimEnd: [number, number] = lvl === 1 ? [ex, ey] : [0, 0];
    const dimLabel = lvl === 1 ? `d = ${fmt(d.d)} cm` : `r = ${fmt(d.r)} cm`;
    const midX = (sx + dimEnd[0]) / 2, midY = (sy + dimEnd[1]) / 2;
    const thetaLabel = `θ = ${theta}°`;

    // Labels and strokes are drawn pre-scaled by k = view/VIEW_REF so the cell's
    // own scaling undoes it and they render the same size in every diagram. The
    // label sizes feed back into the bounding box, so iterate to the fixed point.
    let k = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / VIEW_REF;
    let minX = 0, maxX = 0, minY = 0, maxY = 0, thetaPillX = 0, thetaPillY = 0;
    for (let i = 0; i < 4; i++) {
      const bx = [...xs], by = [...ys];
      bx.push(midX - pillW(dimLabel) * k / 2, midX + pillW(dimLabel) * k / 2);
      by.push(midY - PILL_H * k / 2, midY + PILL_H * k / 2);
      if (lvl === 3) {
        // θ pill sits directly under the shape, centred on it.
        thetaPillX = (Math.min(...bx) + Math.max(...bx)) / 2;
        thetaPillY = Math.max(...by) + 48 * k;
        bx.push(thetaPillX - pillW(thetaLabel) * k / 2, thetaPillX + pillW(thetaLabel) * k / 2);
        by.push(thetaPillY + PILL_H * k / 2);
      }
      const PAD = 16 * k;
      minX = Math.min(...bx) - PAD; maxX = Math.max(...bx) + PAD;
      minY = Math.min(...by) - PAD; maxY = Math.max(...by) + PAD;
      k = Math.max(maxX - minX, maxY - minY) / VIEW_REF;
    }

    // Pad the bounding box out to a square. Every diagram then has the same
    // viewBox aspect ratio, so any container — width-bound on screen or
    // meet-fitted in print — scales them all identically and the k-scaled
    // labels render at exactly the same size in every cell.
    {
      const w = maxX - minX, h = maxY - minY;
      if (w > h) { const g = (w - h) / 2; minY -= g; maxY += g; }
      else if (h > w) { const g = (h - w) / 2; minX -= g; maxX += g; }
    }

    // Right-angle marker for quarter circles; θ arc for arbitrary sectors.
    const sq = 32;
    const [q1x, q1y] = polar(0, 0, sq, startDeg);
    const [q3x, q3y] = polar(0, 0, sq, startDeg + theta);
    const arcR = 48;

    return (
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        style={{ display: "block", width: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet" {...ep}>
        <path d={sectorPath(0, 0, R, startDeg, theta)} fill={SECTOR_FILL} stroke={ACCENT} strokeWidth={4 * k} strokeLinejoin="round" />
        {lvl !== 1 && <circle cx={0} cy={0} r={6 * k} fill={ACCENT} />}
        {lvl === 2 && (
          <polyline points={`${q1x},${q1y} ${q1x + q3x},${q1y + q3y} ${q3x},${q3y}`}
            fill="none" stroke={ACCENT} strokeWidth={2.5 * k} />
        )}
        {lvl === 3 && (
          <path d={`M ${polar(0, 0, arcR, startDeg).join(" ")} A ${arcR} ${arcR} 0 ${theta > 180 ? 1 : 0} 1 ${polar(0, 0, arcR, startDeg + theta).join(" ")}`}
            fill="none" stroke={ACCENT} strokeWidth={2.5 * k} />
        )}
        <DimLine x1={sx} y1={sy} x2={dimEnd[0]} y2={dimEnd[1]} k={k} />
        <Pill x={midX} y={midY} text={dimLabel} color={LINE} k={k} />
        {lvl === 3 && <Pill x={thetaPillX} y={thetaPillY} text={thetaLabel} boxed k={k} />}
      </svg>
    );
  }

  // ── Full circle ──────────────────────────────────────────────────────────
  // Always a 500 × 500 square (matching the sectors' square viewBox) so labels
  // render at the same size in every cell. With a given-value pill the circle
  // shrinks to make room for it inside the square.
  const hasPill = !!d.givenLabel;
  const cx = 250, cy = hasPill ? 207 : 250, r = hasPill ? 165 : 185;
  const a = d.angle ?? 30;
  const [ex, ey] = polar(cx, cy, r, a);
  const [sx, sy] = polar(cx, cy, r, a + 180);

  // The labelled line is whichever of given/find is the radius or diameter.
  const lineProp: "radius" | "diameter" | null =
    d.given === "radius" || d.find === "radius" ? "radius"
    : d.given === "diameter" || d.find === "diameter" ? "diameter"
    : null;
  const isUnknown = d.find === "radius" || d.find === "diameter";
  const val = lineProp === "radius" ? d.r : d.d;
  const sym = lineProp === "radius" ? "r" : "d";
  const lineLabel = isUnknown && !showAnswer ? `${sym} = ?` : `${sym} = ${fmt(val)} cm`;
  const labelColor = isUnknown ? UNKNOWN : LINE;

  // Radius labels sit beside the line (perpendicular offset); diameter labels sit on it.
  const [lx, ly] = lineProp === "radius"
    ? (() => {
        const [mx, my] = polar(cx, cy, r * 0.5, a);
        const rad = a * Math.PI / 180;
        return [mx - Math.sin(rad) * 44, my + Math.cos(rad) * 44];
      })()
    : polar(cx, cy, r * 0.42, a);

  return (
    <svg viewBox="0 0 500 500" style={{ display: "block", width: "100%", height: "auto" }}
      preserveAspectRatio="xMidYMid meet" {...ep}>
      <circle cx={cx} cy={cy} r={r} fill={CIRCLE_FILL} stroke={ACCENT} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={6} fill={ACCENT} />
      {lineProp === "diameter" && <DimLine x1={sx} y1={sy} x2={ex} y2={ey} />}
      {lineProp === "radius" && <DimLine x1={cx} y1={cy} x2={ex} y2={ey} />}
      {lineProp && <Pill x={lx} y={ly} text={lineLabel} color={labelColor} italic={isUnknown && !showAnswer} />}
      {hasPill && <Pill x={250} y={435} text={d.givenLabel!} boxed />}
    </svg>
  );
};

// ── 8. Custom renderers ───────────────────────────────────────────────────────

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  compact?: boolean,
  idx?: number,
): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (q as any)._diagram as DiagramData | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 330 : 460;
  const promptSize = compact === true ? 13 : compact === undefined ? 19 : 26;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: compact === true ? 2 : 8 }}>
      <div style={{ fontWeight: 700, textAlign: "center", color: "#111827", fontSize: promptSize, lineHeight: 1.25 }}>
        {d.prompt}
      </div>
      <CircleSVG d={d} showAnswer={showAnswer} qIndex={idx} />
    </div>
  );
};

// ── 9. Custom print handler ───────────────────────────────────────────────────

const PRINT_COLS = 3, PRINT_ROWS = 5, PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function customPrintHandler(questions: AnyQuestion[], printMode: PrintMode, container: HTMLElement | null): void {
  const svgStrings: Record<number, string> = {};
  if (container) {
    container.querySelectorAll<SVGSVGElement>("svg[data-q-index]").forEach(el => {
      const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10);
      const clone = el.cloneNode(true) as SVGSVGElement;
      // React's inline style (height:auto) would override the print CSS and
      // clip the bottom of the diagram — strip it so the cell CSS controls size.
      clone.removeAttribute("style");
      clone.setAttribute("width", "100%");
      clone.setAttribute("height", "100%");
      svgStrings[idx] = clone.outerHTML;
    });
  }

  const toolName = "Properties of Circles";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const cell = (q: AnyQuestion, gi: number, li: number, showAns: boolean): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (q as any)._diagram as DiagramData | undefined;
    const prompt = d?.prompt ?? "";
    if (showAns) {
      return `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-ans"><div class="ans-prompt">${prompt}</div><div class="ans-val">${q.answer}</div></div></div>`;
    }
    return `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-prompt">${prompt}</div><div class="cell-diag">${svgStrings[gi] ?? ""}</div></div>`;
  };

  const page = (qs: AnyQuestion[], start: number, pn: number, tp: number, ans: boolean): string => {
    const cells = qs.map((q, i) => cell(q, start + i, start + i, ans)).join("");
    const pageLabel = tp > 1 ? ` &middot; Page ${pn} of ${tp}` : "";
    const title = toolName + (ans ? " — Answers" : "");
    return `<div class="page"><div class="ph"><h1>${title}</h1><div class="meta">Worksheet &middot; ${dateStr}${pageLabel}</div></div><div class="sg">${cells}</div></div>`;
  };

  const build = (ans: boolean): string => {
    const out: string[] = [];
    const tp = Math.ceil(questions.length / PRINT_PER_PAGE);
    for (let p = 0; p < questions.length; p += PRINT_PER_PAGE) {
      out.push(page(questions.slice(p, p + PRINT_PER_PAGE), p, Math.floor(p / PRINT_PER_PAGE) + 1, tp, ans));
    }
    return out.join("");
  };

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
  .cell{border:.3mm solid #d1d5db;border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2mm;overflow:hidden;flex:1;min-height:0;position:relative}
  .cell-num{position:absolute;top:1.5mm;left:2mm;font-size:2.8mm;font-weight:700;color:#374151}
  .cell-prompt{font-size:2.9mm;font-weight:700;color:#111827;text-align:center;flex-shrink:0;margin-top:2.5mm;line-height:1.2}
  .cell-diag{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .cell-diag svg{width:100%;height:100%;overflow:visible}
  .cell-ans{width:100%;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5mm;text-align:center;padding:0 2mm;overflow:hidden}
  .ans-prompt{font-size:2.9mm;font-weight:600;color:#6b7280;line-height:1.2}
  .ans-val{font-size:4mm;font-weight:800;color:#15803d}
</style>
</head><body>${body}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ── 10. App ───────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      reformatQuestion={reformatQuestion}
      questionRenderer={questionRenderer}
      customPrintHandler={customPrintHandler}
      defaults={{
        fixedColumns: true,
        numColumns: 3,
        numQuestions: 15,
      }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion };
