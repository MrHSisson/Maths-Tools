import { useState, useEffect } from "react";
import {
  ToolShell,
  type ToolConfig, type DifficultyLevel, type AnyQuestion,
  tStep,
  withDiagramSteps, diagramStepVisual, diagramSplitQuestion,
  extras,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./AnglesInParallelLines.about";
import { shuffle, randInt, handleDiagramPrint } from "../../shared";

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
      { inter1:"p1", quad1:"tl", inter2:"p1", quad2:"bl" },
      { inter1:"p1", quad1:"tr", inter2:"p1", quad2:"br" },
      { inter1:"p2", quad1:"br", inter2:"p2", quad2:"bl" },
      { inter1:"p2", quad1:"tr", inter2:"p2", quad2:"tl" },
      { inter1:"p2", quad1:"tl", inter2:"p2", quad2:"bl" },
      { inter1:"p2", quad1:"tr", inter2:"p2", quad2:"br" },
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

// Two consecutive rules that are functionally equivalent (a vertically-opposite step can
// always be replaced by a straight-line step to the same angle, and vice versa) — never chain them.
const isVOSL = (a: string, b: string): boolean =>
  (a === "verticallyOpposite" && b === "straightLine") ||
  (a === "straightLine" && b === "verticallyOpposite");

const ALL_POSITIONS: Array<{ inter: string; quad: string }> =
  ["p1", "p2"].flatMap(inter => ["tl", "tr", "bl", "br"].map(quad => ({ inter, quad })));

// The single rule directly connecting two angle positions, or null if they have no direct relationship
const ruleForPair = (a: { inter: string; quad: string }, b: { inter: string; quad: string }): RuleDef | null => {
  for (const r of RULES) {
    for (const v of r.variants) {
      if ((v.inter1 === a.inter && v.quad1 === a.quad && v.inter2 === b.inter && v.quad2 === b.quad) ||
          (v.inter2 === a.inter && v.quad2 === a.quad && v.inter1 === b.inter && v.quad1 === b.quad)) return r;
    }
  }
  return null;
};

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
  level?: DifficultyLevel;
  /** Level 3 only — every valid two-rule route from the given angle to x (when more than one exists) */
  chains?: ChainOption[];
};

type ChainOption = { rule: RuleDef; rule2: RuleDef; midInter: string; midQuad: string; midVal: number };

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
  const isL3 = d.level === "level3";
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
    const lx = pt.x + (ARC_R + 30) * Math.cos(sec.mid);
    const ly = pt.y + (ARC_R + 30) * Math.sin(sec.mid);
    return (
      <>
        <path d={sectorPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill={fill} stroke="none"/>
        <path d={arcOnlyPath(pt.x, pt.y, ARC_R, sec.s, sec.e)} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
        <g transform={`translate(${lx},${ly}) rotate(${-canvasRotation})`}>
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
            fill={stroke} fontSize="24" fontWeight="800"
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

        {/* Chain: level 2 shows intermediate as "x" (red) then final as "y" (green).
            Level 3 hides the intermediate entirely until the answer is revealed. */}
        {isChain && midInter && midQuad && (!isL3 || showAnswer) && (
          <Sector
            interKey={midInter} quadKey={midQuad}
            fill={MID_FILL} stroke={MID_STROKE}
            labelText={showAnswer ? `${midVal}°` : "x"}
            italic={!isL3 && !showAnswer}
          />
        )}
        <Sector
          interKey={xInter} quadKey={xQuad}
          fill={isChain && !isL3 ? X_FILL : MID_FILL}
          stroke={isChain && !isL3 ? X_STROKE : MID_STROKE}
          labelText={showAnswer ? `${xVal}°` : (isChain && !isL3 ? "y" : "x")}
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
  for (let attempt = 0; attempt < 30; attempt++) {
    const base = buildStandardData(activeRules, fixedRotation);
    const { xInter, xQuad, knownInter, knownQuad, angles } = base;

    type Candidate = { rule2: RuleDef; finalInter: string; finalQuad: string };
    const candidates: Candidate[] = [];

    for (const rule2 of shuffle(RULES)) {
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

// Level 3: pick a given-angle / x pair with NO direct relationship, then find every
// valid two-rule route that links them via a hidden, unlabelled angle.
function findChainsBetween(known: { inter: string; quad: string }, final: { inter: string; quad: string }, angles: AngleMap): ChainOption[] {
  const chains: ChainOption[] = [];
  for (const mid of ALL_POSITIONS) {
    if ((mid.inter === known.inter && mid.quad === known.quad) || (mid.inter === final.inter && mid.quad === final.quad)) continue;
    const rule = ruleForPair(known, mid);
    const rule2 = ruleForPair(mid, final);
    if (!rule || !rule2) continue;
    if (rule.key === rule2.key) continue;
    if (isVOSL(rule.key, rule2.key)) continue;
    chains.push({ rule, rule2, midInter: mid.inter, midQuad: mid.quad, midVal: angles[mid.quad as keyof AngleMap] });
  }
  return chains;
}

function buildHiddenLinkData(fixedRotation: number | null): DiagramData {
  const acuteDeg = randInt(50, 70);
  const leanRight = Math.random() < 0.5;
  const tvAngle = (leanRight ? acuteDeg : 180 - acuteDeg) * DEG;
  const angles = getAngles(tvAngle);
  const sectors = getSectors(tvAngle);
  const pts = getIntersections(tvAngle);
  const ROTATIONS = [0, 45, 90, 135];
  const canvasRotation = fixedRotation !== null ? fixedRotation : ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];

  for (let attempt = 0; attempt < 60; attempt++) {
    const known = pickArr(ALL_POSITIONS);
    const final = pickArr(ALL_POSITIONS);
    if (final.inter === known.inter && final.quad === known.quad) continue;
    if (ruleForPair(known, final)) continue; // direct relationship — not a hidden-link pair
    const chains = shuffle(findChainsBetween(known, final, angles));
    if (chains.length === 0) continue;
    const first = chains[0];
    return {
      tvAngle, angles, sectors, pts, canvasRotation,
      knownVal: angles[known.quad as keyof AngleMap],
      xVal: angles[final.quad as keyof AngleMap],
      knownQuad: known.quad, knownInter: known.inter,
      xQuad: final.quad, xInter: final.inter,
      rule: first.rule, rule2: first.rule2,
      midInter: first.midInter, midQuad: first.midQuad, midVal: first.midVal,
      isChain: true,
      chains,
    };
  }

  return buildChainData({}, fixedRotation);
}

function dataToQuestion(d: DiagramData, level: DifficultyLevel): AnyQuestion {
  const isChain = d.isChain && !!d.rule2;
  const isL3 = level === "level3";
  const answer = isChain && !isL3 ? `x = ${d.midVal}°, y = ${d.xVal}°` : `x = ${d.xVal}°`;
  const working = isChain
    ? (isL3
        ? [
            { type: "tStep", latex: "", plain: `First find the missing angle: ${d.rule.statement}, missing angle = ${d.midVal}°`, label: "" },
            { type: "tStep", latex: "", plain: `Then use it to find x: ${d.rule2!.statement}, x = ${d.xVal}°`, label: "" },
          ]
        : [
            { type: "tStep", latex: "", plain: `${d.rule.statement}, x = ${d.midVal}°`, label: "" },
            { type: "tStep", latex: "", plain: `${d.rule2!.statement}, y = ${d.xVal}°`, label: "" },
          ])
    : [
        { type: "tStep", latex: "", plain: `${d.rule.statement}, x = ${d.xVal}°`, label: "" },
      ];

  const id = Math.floor(Math.random() * 1_000_000);
  const key = `parallel-${level}-${d.rule.key}-${d.knownVal}-${d.xVal}-${id}`;

  return {
    kind: "simple",
    display: isChain && !isL3 ? `${d.knownVal}° — find x then y` : `${d.knownVal}° — find x`,
    answer,
    working,
    key,
    difficulty: level,
    _diagram: d,
    _printAnswer: printAnswerOf(d),
  } as unknown as AnyQuestion;
}

/** The answer as the printed answer sheet shows it: the rule behind each angle, then the angle. */
function printAnswerOf(d: DiagramData): string {
  if (d.isChain && d.rule2) {
    return d.level === "level3"
      ? `Missing angle — ${d.rule.statement}, ${d.midVal}°\n${d.rule2.statement}, x = ${d.xVal}°`
      : `${d.rule.statement}, x = ${d.midVal}°\n${d.rule2.statement}, y = ${d.xVal}°`;
  }
  return `${d.rule.statement}, x = ${d.xVal}°`;
}

// ── TOOL_CONFIG ───────────────────────────────────────────────────────────────
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Angles in Parallel Lines",
  tools: {
    parallelLines: {
      name: "Angles in Parallel Lines",
      variables: [],
      dropdown: {
        key: "orientation", tab: "display",
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
            key: "angleTypes", tab: "questions",
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
  const baseData = level === "level2"
    ? buildChainData(activeRules, rot)
    : level === "level3"
      ? buildHiddenLinkData(rot)
      : buildStandardData(activeRules, rot);
  const data: DiagramData = { ...baseData, level };
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
function ParallelLinesQuestion({ d, qKey, showAnswer, compact, idx }: {
  d: DiagramData; qKey: string; showAnswer: boolean; compact?: boolean; idx?: number;
}): JSX.Element {
  const [chainIdx, setChainIdx] = useState(0);
  useEffect(() => { setChainIdx(0); }, [qKey]);

  const chains = d.chains;
  const hasAlternatives = !!chains && chains.length > 1;
  const active = chains ? chains[chainIdx % chains.length] : null;
  const dView: DiagramData = active
    ? { ...d, rule: active.rule, rule2: active.rule2, midInter: active.midInter, midQuad: active.midQuad, midVal: active.midVal }
    : d;

  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  const isChain = dView.isChain && !!dView.rule2;
  // Shrink the diagram when the answer (and its explanatory text) is shown so the
  // combined content stays inside the fixed-height question box instead of overflowing it.
  const diagramW = showAnswer ? Math.round(maxW * (isChain ? 0.7 : 0.8)) : maxW;

  const arrowBtnStyle = {
    width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
    background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 800, color: "#374151",
  };

  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: diagramW }}>
        <Diagram d={dView} showAnswer={showAnswer} qIndex={idx} />
      </div>
      {showAnswer && <AnswerStatements d={dView} />}
      {showAnswer && compact !== true && hasAlternatives && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <button aria-label="Previous method" style={arrowBtnStyle}
            onClick={() => setChainIdx(i => (i - 1 + chains!.length) % chains!.length)}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
            Method {chainIdx + 1} of {chains!.length}
          </span>
          <button aria-label="Next method" style={arrowBtnStyle}
            onClick={() => setChainIdx(i => (i + 1) % chains!.length)}>›</button>
        </div>
      )}
    </div>
  );
}

function questionRenderer(q: AnyQuestion, showAnswer: boolean, compact?: boolean, idx?: number): JSX.Element | null {
  const d = extras(q)._diagram as DiagramData | undefined;
  if (!d) return null;
  return <ParallelLinesQuestion d={d} qKey={q.key} showAnswer={showAnswer} compact={compact} idx={idx} />;
}

function AnswerStatements({ d }: { d: DiagramData }): JSX.Element {
  const isChain = d.isChain && !!d.rule2;
  const isL3 = d.level === "level3";
  return (
    <div style={{ textAlign: "center", marginTop: 6, lineHeight: 1.3 }}>
      {isChain && !isL3 ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
            {d.rule.statement}, <span style={{ fontWeight: 800, color: "#b91c1c" }}>x = {d.midVal}°</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            {d.rule2!.statement}, <span style={{ fontWeight: 800, color: "#15803d" }}>y = {d.xVal}°</span>
          </div>
        </>
      ) : isChain && isL3 ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
            Missing angle — {d.rule.statement}, <span style={{ fontWeight: 800, color: "#dc2626" }}>{d.midVal}°</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            {d.rule2!.statement}, <span style={{ fontWeight: 800, color: "#166534" }}>x = {d.xVal}°</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
          {d.rule.statement}, <span style={{ fontWeight: 800, color: "#166534" }}>x = {d.xVal}°</span>
        </div>
      )}
    </div>
  );
}

function answerRenderer(q: AnyQuestion): JSX.Element | null {
  const d = extras(q)._diagram as DiagramData | undefined;
  if (!d) return null;
  return <AnswerStatements d={d} />;
}

// ── App ───────────────────────────────────────────────────────────────────────
// Two-view Worked Example: the diagram moves into the picture slot beside the steps (see src/shared/diagramSplit.tsx).
const splitGenerate = withDiagramSteps(generateQuestion);
const splitGenerateUnique = withDiagramSteps(generateUniqueQ);
const splitQuestion = diagramSplitQuestion(questionRenderer);
const splitVisual = diagramStepVisual(questionRenderer);

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={splitGenerate}
      generateUniqueQ={splitGenerateUnique}
      questionRenderer={splitQuestion}
      stepVisualRenderer={splitVisual}
      stepVisualKeepsWorking
      answerRenderer={answerRenderer}
      customPrintHandler={handleDiagramPrint}
      defaults={{
        numColumns: 3,
        maxColumns: 4,
        numQuestions: 9,
        hideFontControls: true,
      }}
    />
  );
}

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion };
