import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type PrintMode,
  tStep,
} from "../../shared";

void (tStep as unknown);

const DEG = Math.PI / 180;
const norm = (a: number): number => { let r = a % (2 * Math.PI); return r < 0 ? r + 2 * Math.PI : r; };

// ── Geometry ──────────────────────────────────────────────────────────────────
const L1Y = 160, L2Y = 340, MID_Y = (L1Y + L2Y) / 2;
const CX = 250;
const ARC_R = 50;

type Point = { x: number; y: number };
type SectorData = { s: number; e: number; mid: number };
type SectorMap = Record<string, SectorData>;
type AngleMap = { tl: number; tr: number; bl: number; br: number };

const getIntersections = (tvAngle: number) => {
  const sinA = Math.sin(tvAngle), cosA = Math.cos(tvAngle);
  return {
    p1: { x: CX + cosA * (L1Y - MID_Y) / sinA, y: L1Y },
    p2: { x: CX + cosA * (L2Y - MID_Y) / sinA, y: L2Y },
  };
};

const getTransversalEndpoints = (tvAngle: number, p1: Point, p2: Point) => {
  const cosA = Math.cos(tvAngle), sinA = Math.sin(tvAngle);
  const ext = 75 / Math.abs(sinA);
  return {
    start: { x: p1.x - cosA * ext, y: p1.y - Math.abs(sinA) * ext },
    end:   { x: p2.x + cosA * ext, y: p2.y + Math.abs(sinA) * ext },
  };
};

const getSectors = (tvAngle: number): SectorMap => {
  const dirs = [norm(0), norm(tvAngle), norm(Math.PI), norm(tvAngle + Math.PI)].sort((a, b) => a - b);
  const secs: SectorData[] = [];
  for (let i = 0; i < 4; i++) {
    const s = dirs[i], eR = dirs[(i + 1) % 4];
    const e = eR <= s ? eR + 2 * Math.PI : eR;
    secs.push({ s, e, mid: norm((s + e) / 2) });
  }
  const cls = (mid: number): string => {
    const m = norm(mid), top = m > Math.PI, right = m < Math.PI / 2 || m > 3 * Math.PI / 2;
    if (top && right) return "tr"; if (top && !right) return "tl";
    if (!top && right) return "br"; return "bl";
  };
  const sMap: SectorMap = {};
  secs.forEach(s => { sMap[cls(s.mid)] = s; });
  return sMap;
};

const getAngles = (tvAngle: number): AngleMap => {
  let deg = Math.abs(tvAngle * 180 / Math.PI);
  if (deg > 90) deg = 180 - deg;
  const theta = Math.round(Math.max(1, Math.min(89, deg)));
  const leansRight = Math.cos(tvAngle) >= 0;
  return leansRight
    ? { tl: theta, tr: 180 - theta, bl: 180 - theta, br: theta }
    : { tl: 180 - theta, tr: theta, bl: theta, br: 180 - theta };
};

const sectorPath = (cx: number, cy: number, r: number, s: number, e: number): string => {
  let eA = e; if (eA <= s) eA += 2 * Math.PI;
  const sweep = eA - s;
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(eA), y2 = cy + r * Math.sin(eA);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
};

const arcOnlyPath = (cx: number, cy: number, r: number, s: number, e: number): string => {
  let eA = e; if (eA <= s) eA += 2 * Math.PI;
  const sweep = eA - s;
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(eA), y2 = cy + r * Math.sin(eA);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

// ── Rules ─────────────────────────────────────────────────────────────────────
const RULES = [
  {
    key: "corresponding", label: "Corresponding Angles", statement: "Corresponding angles are equal",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"br" },
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"bl" },
      { inter1:"p1", quad1:"tr", inter2:"p2", quad2:"tr" },
      { inter1:"p1", quad1:"tl", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "alternate", label: "Alternate Angles", statement: "Alternate angles are equal",
    variants: [
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"tr" },
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "coInterior", label: "Co-interior Angles", statement: "Co-interior angles add up to 180°",
    variants: [
      { inter1:"p1", quad1:"bl", inter2:"p2", quad2:"tl" },
      { inter1:"p1", quad1:"br", inter2:"p2", quad2:"tr" },
    ],
  },
  {
    key: "straightLine", label: "Angles on a Straight Line", statement: "Angles on a straight line add up to 180°",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p1", quad2:"bl" },
      { inter1:"p1", quad1:"tr", inter2:"p1", quad2:"tl" },
      { inter1:"p2", quad1:"br", inter2:"p2", quad2:"bl" },
      { inter1:"p2", quad1:"tr", inter2:"p2", quad2:"tl" },
    ],
  },
  {
    key: "verticallyOpposite", label: "Vertically Opposite Angles", statement: "Vertically opposite angles are equal",
    variants: [
      { inter1:"p1", quad1:"br", inter2:"p1", quad2:"tl" },
      { inter1:"p1", quad1:"bl", inter2:"p1", quad2:"tr" },
      { inter1:"p2", quad1:"br", inter2:"p2", quad2:"tl" },
      { inter1:"p2", quad1:"bl", inter2:"p2", quad2:"tr" },
    ],
  },
];

type RuleDef = typeof RULES[0];

const pickArr = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffled = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ── Diagram data type (stored in q._diagram) ──────────────────────────────────
type DiagramData = {
  tvAngle: number;
  angles: AngleMap;
  sectors: SectorMap;
  pts: { p1: Point; p2: Point };
  canvasRotation: number;
  knownVal: number;
  xVal: number;
  knownQuad: string;
  knownInter: string;
  xQuad: string;
  xInter: string;
  rule: RuleDef;
  isChain: boolean;
  rule2?: RuleDef;
  midInter?: string;
  midQuad?: string;
  midVal?: number;
};

// ── Colours ───────────────────────────────────────────────────────────────────
const KNOWN_FILL   = "rgba(29,78,216,0.15)";
const KNOWN_STROKE = "#1d4ed8";
const MID_FILL     = "rgba(220,38,38,0.15)";
const MID_STROKE   = "#dc2626";
const X_FILL       = "rgba(22,163,74,0.15)";
const X_STROKE     = "#16a34a";
const LINE_COLOR   = "#111827";

// ── Diagram component ─────────────────────────────────────────────────────────
const Diagram = ({ d, showAnswer, qIndex }: { d: DiagramData; showAnswer: boolean; qIndex?: number }) => {
  const { tvAngle, sectors, knownVal, xVal, knownQuad, knownInter, xQuad, xInter, pts, canvasRotation, isChain, midQuad, midInter, midVal } = d;
  const { p1, p2 } = pts;
  const tv = getTransversalEndpoints(tvAngle, p1, p2);

  const lineHalf = (ix: number) => ({
    left:  Math.min(220, ix - 10),
    right: Math.min(220, 490 - ix),
  });
  const lh1 = lineHalf(p1.x), lh2 = lineHalf(p2.x);

  const MidArrow = ({ ix, iy, armRight }: { ix: number; iy: number; armRight: number }) => {
    const ax = ix + armRight * 0.55, ay = iy, size = 10;
    return (
      <polyline
        points={`${ax - size},${ay - size * 0.65} ${ax},${ay} ${ax - size},${ay + size * 0.65}`}
        fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
      />
    );
  };

  const Sector = ({ interKey, quadKey, fill, stroke, labelText, italic }: {
    interKey: string; quadKey: string; fill: string; stroke: string; labelText: string; italic?: boolean;
  }) => {
    const sec = sectors[quadKey];
    if (!sec) return null;
    const pt = pts[interKey as keyof typeof pts];
    const lx = pt.x + (ARC_R + 26) * Math.cos(sec.mid);
    const ly = pt.y + (ARC_R + 26) * Math.sin(sec.mid);
    return (
      <>
        <path d={sectorPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill={fill} stroke="none"/>
        <path d={arcOnlyPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
        <g transform={`translate(${lx},${ly}) rotate(${-canvasRotation})`}>
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
            fill={stroke} fontSize="18" fontWeight="800"
            fontStyle={italic ? "italic" : "normal"}
            fontFamily="'Segoe UI', Arial, sans-serif">
            {labelText}
          </text>
        </g>
      </>
    );
  };

  const VB = 500, VC = 250;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      style={{ display: "block", width: "100%", height: "auto" }}
      preserveAspectRatio="xMidYMid meet"
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      <g transform={`rotate(${canvasRotation}, ${VC}, ${VC})`}>
        <line x1={p1.x - lh1.left} y1={L1Y} x2={p1.x + lh1.right} y2={L1Y} stroke={LINE_COLOR} strokeWidth="3.5"/>
        <line x1={p2.x - lh2.left} y1={L2Y} x2={p2.x + lh2.right} y2={L2Y} stroke={LINE_COLOR} strokeWidth="3.5"/>
        <MidArrow ix={p1.x} iy={L1Y} armRight={lh1.right}/>
        <MidArrow ix={p2.x} iy={L2Y} armRight={lh2.right}/>
        <line x1={tv.start.x} y1={tv.start.y} x2={tv.end.x} y2={tv.end.y} stroke={LINE_COLOR} strokeWidth="3.5"/>
        <circle cx={p1.x} cy={p1.y} r="5.5" fill={LINE_COLOR}/>
        <circle cx={p2.x} cy={p2.y} r="5.5" fill={LINE_COLOR}/>

        {/* Given angle — always blue */}
        <Sector interKey={knownInter} quadKey={knownQuad} fill={KNOWN_FILL} stroke={KNOWN_STROKE} labelText={`${knownVal}°`}/>

        {/* Chain: x = intermediate (red), y = final (green) */}
        {isChain && midInter && midQuad && (
          <Sector
            interKey={midInter} quadKey={midQuad}
            fill={MID_FILL} stroke={MID_STROKE}
            labelText={showAnswer ? `${midVal}°` : "x"}
            italic={!showAnswer}
          />
        )}
        <Sector
          interKey={xInter} quadKey={xQuad}
          fill={isChain ? X_FILL : MID_FILL}
          stroke={isChain ? X_STROKE : MID_STROKE}
          labelText={showAnswer ? `${xVal}°` : (isChain ? "y" : "x")}
          italic={!showAnswer}
        />
      </g>
    </svg>
  );
};

// ── Generators ────────────────────────────────────────────────────────────────
function buildStandardData(activeRules: Record<string, boolean>, fixedRotation: number | null): DiagramData {
  const acuteDeg = randInt(50, 70);
  const leanRight = Math.random() < 0.5;
  const tvAngle = (leanRight ? acuteDeg : 180 - acuteDeg) * DEG;
  const pool = RULES.filter(r => activeRules[r.key] !== false);
  const rule = pickArr(pool.length > 0 ? pool : RULES);
  const variant = pickArr(rule.variants);
  const angles = getAngles(tvAngle);
  const sectors = getSectors(tvAngle);
  const pts = getIntersections(tvAngle);
  const val1 = angles[variant.quad1 as keyof AngleMap], val2 = angles[variant.quad2 as keyof AngleMap];
  const swapped = Math.random() < 0.5;
  const ROTATIONS = [0, 45, 90, 135];
  const canvasRotation = fixedRotation !== null ? fixedRotation : ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];

  return {
    tvAngle, rule, angles: angles as AngleMap, sectors, pts, canvasRotation,
    knownVal:   swapped ? val2 : val1,
    xVal:       swapped ? val1 : val2,
    knownQuad:  swapped ? variant.quad2 : variant.quad1,
    knownInter: swapped ? variant.inter2 : variant.inter1,
    xQuad:      swapped ? variant.quad1 : variant.quad2,
    xInter:     swapped ? variant.inter1 : variant.inter2,
    isChain: false,
  };
}

function buildChainData(activeRules: Record<string, boolean>, fixedRotation: number | null): DiagramData {
  const isVOSL = (a: string, b: string) =>
    (a === "verticallyOpposite" && b === "straightLine") ||
    (a === "straightLine" && b === "verticallyOpposite");

  for (let attempt = 0; attempt < 30; attempt++) {
    const base = buildStandardData(activeRules, fixedRotation);
    const { xInter, xQuad, knownInter, knownQuad, angles } = base;

    type Candidate = { rule2: RuleDef; finalInter: string; finalQuad: string };
    const candidates: Candidate[] = [];

    for (const rule2 of shuffled(RULES)) {
      if (rule2.key === base.rule.key) continue;
      if (isVOSL(base.rule.key, rule2.key)) continue;
      for (const v of rule2.variants) {
        const matches: Array<{ finalInter: string; finalQuad: string }> = [];
        if (v.inter1 === xInter && v.quad1 === xQuad) matches.push({ finalInter: v.inter2, finalQuad: v.quad2 });
        if (v.inter2 === xInter && v.quad2 === xQuad) matches.push({ finalInter: v.inter1, finalQuad: v.quad1 });
        for (const m of matches) {
          if (m.finalInter === knownInter && m.finalQuad === knownQuad) continue;
          if (m.finalInter === xInter && m.finalQuad === xQuad) continue;
          const shortcutExists = RULES.some(r => r.variants.some(v2 =>
            (v2.inter1 === knownInter && v2.quad1 === knownQuad && v2.inter2 === m.finalInter && v2.quad2 === m.finalQuad) ||
            (v2.inter2 === knownInter && v2.quad2 === knownQuad && v2.inter1 === m.finalInter && v2.quad1 === m.finalQuad)
          ));
          if (shortcutExists) continue;
          candidates.push({ rule2, ...m });
        }
      }
    }

    if (candidates.length === 0) continue;

    const { rule2, finalInter, finalQuad } = pickArr(candidates);
    return {
      ...base,
      isChain: true,
      rule2,
      midInter: xInter,
      midQuad: xQuad,
      midVal: base.xVal,
      xInter: finalInter,
      xQuad: finalQuad,
      xVal: (angles as AngleMap)[finalQuad as keyof AngleMap],
    };
  }

  return buildStandardData(activeRules, fixedRotation);
}

function dataToQuestion(d: DiagramData, level: DifficultyLevel): AnyQuestion {
  const isChain = d.isChain && !!d.rule2;
  const answer = isChain ? `x = ${d.midVal}°, y = ${d.xVal}°` : `x = ${d.xVal}°`;
  const working = isChain
    ? [
        { type: "tStep", latex: "", plain: `${d.rule.statement}, x = ${d.midVal}°`, label: "" },
        { type: "tStep", latex: "", plain: `${d.rule2!.statement}, y = ${d.xVal}°`, label: "" },
      ]
    : [
        { type: "tStep", latex: "", plain: `${d.rule.statement}, x = ${d.xVal}°`, label: "" },
      ];

  const id = Math.floor(Math.random() * 1_000_000);
  const key = `parallel-${level}-${d.rule.key}-${d.knownVal}-${d.xVal}-${id}`;

  return {
    kind: "simple",
    display: isChain ? `${d.knownVal}° — find x then y` : `${d.knownVal}° — find x`,
    answer,
    working,
    key,
    difficulty: level,
    _diagram: d,
  } as unknown as AnyQuestion;
}

// ── TOOL_CONFIG ───────────────────────────────────────────────────────────────
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Angles in Parallel Lines",
  tools: {
    parallelLines: {
      name: "Angles in Parallel Lines",
      variables: [],
      dropdown: {
        key: "orientation",
        label: "Orientation",
        options: [
          { value: "random", label: "Random" },
          { value: "0",      label: "—"      },
          { value: "45",     label: "╲"      },
          { value: "90",     label: "│"      },
          { value: "135",    label: "╱"      },
        ],
        defaultValue: "random",
      },
      multiSelect: undefined as never,
      difficultySettings: {
        level1: {
          multiSelect: {
            key: "angleTypes",
            label: "Angle Types",
            options: [
              { value: "corresponding",     label: "Corresponding",    defaultActive: true },
              { value: "alternate",         label: "Alternate",        defaultActive: true },
              { value: "coInterior",        label: "Co-interior",      defaultActive: true },
              { value: "straightLine",      label: "Straight Line",    defaultActive: true },
              { value: "verticallyOpposite",label: "Vert. Opp.",       defaultActive: true },
            ],
          },
        },
        level2: {},
        level3: {},
      },
    },
  },
};

// ── INFO_SECTIONS ─────────────────────────────────────────────────────────────
const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Angles in Parallel Lines",
    icon: "∥",
    content: [
      { label: "Overview", detail: "A transversal crossing two parallel lines creates pairs of angles linked by rules." },
      { label: "Level 1 — Standard", detail: "One given angle. Name the rule and find x. Choose which rules to practise using the Question Options." },
      { label: "Level 2 — Multi-step", detail: "One given angle. Find x using rule 1, then use x to find y using a different rule. Genuinely chains two rules — no shortcut between the given angle and y." },
      { label: "Level 3", detail: "Coming soon." },
    ],
  },
  {
    title: "The Rules",
    icon: "📐",
    content: [
      { label: "Corresponding", detail: "In matching positions at each intersection. Equal." },
      { label: "Alternate", detail: "On opposite sides of the transversal, between the parallel lines. Equal." },
      { label: "Co-interior", detail: "On the same side of the transversal, between the parallel lines. Sum to 180°." },
      { label: "Straight Line", detail: "Adjacent angles at the same intersection along a straight line. Sum to 180°." },
      { label: "Vertically Opposite", detail: "Opposite angles at the same intersection. Equal." },
    ],
  },
  {
    title: "Modes",
    icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single question with writing space." },
      { label: "Worked Example", detail: "Step-by-step rule explanation." },
      { label: "Worksheet", detail: "Grid of questions with PDF export." },
    ],
  },
];

// ── Question generation ───────────────────────────────────────────────────────
function generateQuestion(
  _tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const rot = dropdownValue === "random" || !dropdownValue ? null : Number(dropdownValue);
  const activeRules = multiSelectValues ?? {};
  const data = level === "level2"
    ? buildChainData(activeRules, rot)
    : buildStandardData(activeRules, rot);
  return dataToQuestion(data, level);
}

function generateUniqueQ(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  for (let i = 0; i < 50; i++) {
    const q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
    if (!usedKeys.has(q.key)) { usedKeys.add(q.key); return q; }
  }
  return generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
}

// ── Custom renderers ──────────────────────────────────────────────────────────
function questionRenderer(q: AnyQuestion, showAnswer: boolean, _colorScheme: string, compact?: boolean, idx?: number): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (q as any)._diagram as DiagramData | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <Diagram d={d} showAnswer={showAnswer} qIndex={idx} />
    </div>
  );
}

function answerRenderer(q: AnyQuestion, _colorScheme: string): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (q as any)._diagram as DiagramData | undefined;
  if (!d) return null;
  const isChain = d.isChain && !!d.rule2;
  return (
    <div style={{ textAlign: "center" }}>
      {isChain ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {d.rule.statement}, <span style={{ fontWeight: 800, color: "#b91c1c" }}>x = {d.midVal}°</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>
            {d.rule2!.statement}, <span style={{ fontWeight: 800, color: "#15803d" }}>y = {d.xVal}°</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>
          {d.rule.statement}, <span style={{ fontWeight: 800, color: "#166534" }}>x = {d.xVal}°</span>
        </div>
      )}
    </div>
  );
}

// ── Custom print handler ──────────────────────────────────────────────────────
const PRINT_COLS = 3, PRINT_ROWS = 5, PRINT_PER_PAGE = PRINT_COLS * PRINT_ROWS;

function customPrintHandler(questions: AnyQuestion[], printMode: PrintMode, container: HTMLElement | null): void {
  const svgStrings: Record<number, string> = {};
  if (container) {
    container.querySelectorAll<SVGSVGElement>("svg[data-q-index]").forEach(el => {
      const idx = parseInt(el.getAttribute("data-q-index") ?? "0", 10);
      const clone = el.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", "100%");
      clone.setAttribute("height", "100%");
      svgStrings[idx] = clone.outerHTML;
    });
  }

  const toolName = "Angles in Parallel Lines";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const cell = (q: AnyQuestion, gi: number, li: number, showAns: boolean): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (q as any)._diagram as DiagramData | undefined;
    const isChain = d?.isChain && !!d?.rule2;

    if (showAns && d) {
      const statementsHtml = isChain
        ? `<div>${d.rule.statement}, <span class="ans-x">x = ${d.midVal}°</span></div><div>${d.rule2!.statement}, <span class="ans-y">y = ${d.xVal}°</span></div>`
        : `<div>${d.rule.statement}, <span class="ans-x">x = ${d.xVal}°</span></div>`;
      return `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-ans">${statementsHtml}</div></div>`;
    }

    return `<div class="cell"><div class="cell-num">${li + 1}</div><div class="cell-diag">${svgStrings[gi] ?? ""}</div></div>`;
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
  .cell-diag{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .cell-diag svg{width:100%;height:100%;overflow:visible}
  .cell-ans{width:100%;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;font-size:3.4mm;font-weight:600;color:#374151;text-align:center;padding:0 2mm}
  .ans-x{color:#dc2626;font-weight:800}
  .ans-y{color:#16a34a;font-weight:800}
</style>
</head><body>${body}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      questionRenderer={questionRenderer}
      answerRenderer={answerRenderer}
      customPrintHandler={customPrintHandler}
      defaults={{
        comingSoonLevels: ["level3"],
        fixedColumns: true,
        numColumns: 3,
        numQuestions: 9,
      }}
    />
  );
}
