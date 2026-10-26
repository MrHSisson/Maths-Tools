// Perimeter & Area — Standard Shapes. Rectangles, squares, regular polygons, triangles, parallelograms and trapezia, drawn in
// proportion: the sloping sides and heights come from Pythagorean triples, so a label, a drawn height and a right-angle mark
// always agree. The picture shows the measurement the OTHER question would need (a height beside a perimeter question, a
// sloping side beside an area question): choosing the right length is the thing being tested.
import { mStep, randInt as ri, pickActive, resolveMultiSelectValues, maskUnmetOptions, type DifficultyLevel } from "../../../shared";
import type { Pt } from "../../../shared/shapes/model";
import { mirrorDrawing, type DEdge, type DHelper, type Drawing } from "../../../shared/shapes/drawing";
import { addFrags, chance, CM, CM2, pickOne, showLength, type Beat, type Built } from "./build";
import { ASK, GIVEN, SHAPES_1, SHAPES_2, SHAPES_3, SIDES_SHAPES, UNITS } from "./pools";
import type { Focus } from "../../../shared/shapes/drawing";

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [15, 20, 25], [7, 24, 25]];
/** (p, h, s): a right triangle with legs p and h and hypotenuse s, either way round. */
const triple = (): [number, number, number] => { const [a, b, c] = pickOne(TRIPLES); return chance(0.5) ? [a, b, c] : [b, a, c]; };

type Fmt = (cm: number) => string;
/** Labels that need a unit conversion in the working, kept with their length so the one the student must find can be dropped. */
interface Conv { cm: number; text: string }
const makeFmt = (mixed: boolean) => {
  const convs: Conv[] = [];
  const fmt: Fmt = (cm) => { const s = showLength(cm, mixed); if (s.conv) convs.push({ cm, text: s.conv }); return s.text; };
  const forget = (cm: number) => { const i = convs.map((c) => c.cm).lastIndexOf(cm); if (i >= 0) convs.splice(i, 1); };
  return { convs, fmt, forget };
};
interface Shape {
  name: string;
  caption?: string;
  polys: Pt[][];
  edges: DEdge[];
  helpers: DHelper[];
  corners: [Pt, Pt, Pt][];
  dims: string;
  P: number;
  A?: number;
  perimeter: Beat[];
  area?: Beat[];
  symmetric: boolean;
}
const edge = (a: Pt, b: Pt, label = "", ticks = 0): DEdge => ({ a, b, label, kind: "plain", ...(ticks ? { ticks } : {}) });
const allEdges = (n: number): Focus => ({ edges: Array.from({ length: n }, (_, i) => i) });

const rectangle = (w: number, h: number, fmt: Fmt): Shape => {
  const polys: Pt[][] = [[[0, 0], [w, 0], [w, h], [0, h]]], P = 2 * (w + h), A = w * h;
  return {
    name: "rectangle", polys, dims: `${w}x${h}`, P, A, symmetric: true,
    edges: [edge([0, 0], [w, 0], fmt(w)), edge([w, 0], [w, h], fmt(h)), edge([w, h], [0, h]), edge([0, h], [0, 0])],
    helpers: [], corners: [[[w, 0], [0, 0], [0, h]], [[0, 0], [w, 0], [w, h]], [[w, 0], [w, h], [0, h]], [[w, h], [0, h], [0, 0]]],
    perimeter: [{ step: mStep("Two lengths and two widths:", [`2 \\times ${w} + 2 \\times ${h}`, `= ${2 * w} + ${2 * h}`, `= ${P}`], CM), focus: allEdges(4) }],
    area: [{ step: mStep("Area = length × width:", [`${w} \\times ${h}`, `= ${A}`], CM2), focus: { edges: [0, 1] } }],
  };
};

const square = (s: number, fmt: Fmt): Shape => {
  const polys: Pt[][] = [[[0, 0], [s, 0], [s, s], [0, s]]], P = 4 * s, A = s * s;
  return {
    name: "square", polys, dims: `${s}`, P, A, symmetric: true,
    edges: [edge([0, 0], [s, 0], fmt(s), 1), edge([s, 0], [s, s], "", 1), edge([s, s], [0, s], "", 1), edge([0, s], [0, 0], "", 1)],
    helpers: [], corners: [[[s, 0], [0, 0], [0, s]], [[0, 0], [s, 0], [s, s]], [[s, 0], [s, s], [0, s]], [[s, s], [0, s], [0, 0]]],
    perimeter: [{ step: mStep("Four equal sides:", [`4 \\times ${s}`, `= ${P}`], CM), focus: allEdges(4) }],
    area: [{ step: mStep("Area = side × side:", [`${s} \\times ${s}`, `= ${A}`], CM2), focus: { edges: [0, 1] } }],
  };
};

const NAMES: Record<number, string> = { 5: "pentagon", 6: "hexagon", 8: "octagon" };
const regularPolygon = (n: number, s: number, fmt: Fmt): Shape => {
  const R = s / (2 * Math.sin(Math.PI / n));
  const pts: Pt[] = Array.from({ length: n }, (_, i) => { const t = -Math.PI / 2 - Math.PI / n + (2 * Math.PI * i) / n; return [R * Math.cos(t), R * Math.sin(t)] as Pt; });
  const P = n * s;
  return {
    name: NAMES[n], caption: `Regular ${NAMES[n]}.`, polys: [pts], dims: `${n}x${s}`, P, symmetric: true,
    edges: pts.map((p, i) => edge(p, pts[(i + 1) % n], i === 0 ? fmt(s) : "", 1)), helpers: [], corners: [],
    perimeter: [{ step: mStep(`${n} equal sides:`, [`${n} \\times ${s}`, `= ${P}`], CM), focus: allEdges(n) }],
  };
};

const rightTriangle = (a: number, b: number, c: number, fmt: Fmt): Shape => {
  const polys: Pt[][] = [[[0, 0], [b, 0], [0, a]]], P = a + b + c, A = (a * b) / 2;
  return {
    name: "right-angled triangle", polys, dims: `${a}-${b}-${c}`, P, A, symmetric: false,
    edges: [edge([0, 0], [b, 0], fmt(b)), edge([b, 0], [0, a], fmt(c)), edge([0, a], [0, 0], fmt(a))],
    helpers: [], corners: [[[b, 0], [0, 0], [0, a]]],
    perimeter: [{ step: mStep("Add the three sides:", addFrags([b, c, a], P), CM), focus: allEdges(3) }],
    area: [{ step: mStep("The base and the height meet at the right angle:", [`\\tfrac{1}{2} \\times ${b} \\times ${a}`, `= ${A}`], CM2), focus: { edges: [0, 2] } }],
  };
};

const isosceles = (p: number, h: number, s: number, fmt: Fmt): Shape => {
  const polys: Pt[][] = [[[0, 0], [2 * p, 0], [p, h]]], P = 2 * p + 2 * s, A = p * h;
  return {
    name: "isosceles triangle", polys, dims: `${p}-${h}-${s}`, P, A, symmetric: true,
    edges: [edge([0, 0], [2 * p, 0], fmt(2 * p)), edge([2 * p, 0], [p, h], fmt(s), 1), edge([p, h], [0, 0], "", 1)],
    helpers: [{ id: "h", a: [p, 0], b: [p, h], label: fmt(h), kind: "height" }], corners: [[[2 * p, 0], [p, 0], [p, h]]],
    perimeter: [{ step: mStep("Add all three sides (the sloping sides are equal):", addFrags([2 * p, s, s], P), CM), focus: allEdges(3) }],
    area: [{ step: mStep("The height is the dashed line, not a sloping side:", [`\\tfrac{1}{2} \\times ${2 * p} \\times ${h}`, `= ${A}`], CM2), focus: { edges: [0], helpers: ["h"] } }],
  };
};

const parallelogram = (b: number, p: number, h: number, s: number, fmt: Fmt): Shape => {
  const polys: Pt[][] = [[[p, 0], [p + b, 0], [b, h], [0, h]]], P = 2 * (b + s), A = b * h;
  return {
    name: "parallelogram", polys, dims: `${b}-${p}-${h}-${s}`, P, A, symmetric: false,
    edges: [edge([p, 0], [p + b, 0], fmt(b), 1), edge([p + b, 0], [b, h], fmt(s), 2), edge([b, h], [0, h], "", 1), edge([0, h], [p, 0], "", 2)],
    helpers: [{ id: "h", a: [0, h], b: [0, 0], label: fmt(h), kind: "height" }, { id: "x", a: [0, 0], b: [p, 0], kind: "extend" }],
    corners: [[[0, h], [0, 0], [p, 0]]],
    perimeter: [{ step: mStep("Opposite sides are equal:", [`2 \\times ${b} + 2 \\times ${s}`, `= ${2 * b} + ${2 * s}`, `= ${P}`], CM), focus: allEdges(4) }],
    area: [{ step: mStep("Use the perpendicular height, not the sloping side:", [`${b} \\times ${h}`, `= ${A}`], CM2), focus: { edges: [0], helpers: ["h"] } }],
  };
};

const trapezium = (b: number, p: number, h: number, s: number, fmt: Fmt): Shape => {
  const a = b + 2 * p, polys: Pt[][] = [[[0, 0], [a, 0], [a - p, h], [p, h]]], P = a + b + 2 * s, A = ((a + b) * h) / 2;
  return {
    name: "trapezium", polys, dims: `${a}-${b}-${h}-${s}`, P, A, symmetric: true,
    edges: [edge([0, 0], [a, 0], fmt(a)), edge([a, 0], [a - p, h], fmt(s), 1), edge([a - p, h], [p, h], fmt(b)), edge([p, h], [0, 0], "", 1)],
    helpers: [{ id: "h", a: [p, h], b: [p, 0], label: fmt(h), kind: "height" }], corners: [[[p, h], [p, 0], [a, 0]]],
    perimeter: [{ step: mStep("Add all four sides (the sloping sides are equal):", addFrags([a, s, b, s], P), CM), focus: allEdges(4) }],
    area: [{ step: mStep("Half the sum of the parallel sides, times the height:", [`\\tfrac{1}{2} \\times (${a} + ${b}) \\times ${h}`, `= \\tfrac{1}{2} \\times ${a + b} \\times ${h}`, `= ${A}`], CM2), focus: { edges: [0, 2], helpers: ["h"] } }],
  };
};

const conversionBeat = (convs: Conv[]): Beat[] => {
  const seen = [...new Set(convs.map((c) => c.text))];
  return seen.length ? [{ step: mStep("Write every length in cm:", seen.map((t, i) => (i ? `,\\ ${t}` : t))) }] : [];
};

/** Label every side. A side the same length as one already labelled says the same thing; the equal-side ticks are not needed then. */
const labelEverySide = (shape: Shape, fmt: Fmt): void => {
  const lenOf = (e: DEdge) => Math.round(Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]));
  const said = new Map<number, string>();
  shape.edges.forEach((e) => { if (e.label) said.set(lenOf(e), e.label); });
  shape.edges = shape.edges.map((e) => {
    const { ticks: _t, ...rest } = e;
    void _t;
    if (rest.label) return rest;
    const l = lenOf(e);
    if (!said.has(l)) said.set(l, fmt(l));
    return { ...rest, label: said.get(l)! };
  });
};

const finish = (level: DifficultyLevel, shape: Shape, drawing: Pick<Drawing, "caption" | "answerLine">, answer: number, unit: string, beats: Beat[], key: string): Built => {
  const full: Drawing = { ...drawing, polys: shape.polys, edges: shape.edges, helpers: shape.helpers, corners: shape.corners, regions: [] };
  return { tool: "shapes", level, key, drawing: shape.symmetric || chance(0.5) ? full : mirrorDrawing(full), answer: String(answer), suffix: unit, beats };
};

// ── Levels 1 and 2: find the perimeter or the area ──────────────────────────────────────────────────────────────────────────────
function findPerimeterOrArea(level: DifficultyLevel, shapeKey: string, ask: "perimeter" | "area", mixed: boolean, everySide: boolean): Built {
  const { convs, fmt } = makeFmt(mixed);
  let shape: Shape;
  switch (shapeKey) {
    case "square": shape = square(ri(3, 20), fmt); break;
    case "regularPolygon": shape = regularPolygon(pickOne([5, 6, 8]), ri(3, 15), fmt); break;
    case "rightTriangle": { const [x, y, z] = pickOne(TRIPLES); shape = chance(0.5) ? rightTriangle(x, y, z, fmt) : rightTriangle(y, x, z, fmt); break; }
    case "isoscelesTriangle": { const [p, h, s] = triple(); shape = isosceles(p, h, s, fmt); break; }
    case "parallelogram": { const [p, h, s] = triple(); shape = parallelogram(ri(Math.max(5, Math.ceil(p / 1.5)), 20), p, h, s, fmt); break; }
    case "trapezium": { const [p, h, s] = triple(); shape = trapezium(ri(3, 14), p, h, s, fmt); break; }
    default: { const w = ri(3, 20); let h = ri(3, 20); while (Math.abs(w - h) < 3) h = ri(3, 20); shape = rectangle(w, h, fmt); }
  }
  if (everySide) labelEverySide(shape, fmt);
  const beats = [...conversionBeat(convs), ...(ask === "perimeter" ? shape.perimeter : shape.area!)];
  const value = ask === "perimeter" ? shape.P : shape.A!;
  const unit = ask === "perimeter" ? CM : CM2;
  const caption = [...(shape.caption ? [shape.caption] : []), ...(mixed ? ["Give your answer in cm."] : []), `Find the ${ask}.`];
  return finish(level, shape, { caption, answerLine: `${ask === "perimeter" ? "Perimeter" : "Area"} = ${value} ${unit}` }, value, unit, beats, `shapes-${level}-${shapeKey}-${shape.dims}-${ask}-${mixed ? "m" : "s"}${everySide ? "-all" : ""}`);
}

// ── Level 3: find a missing length from the perimeter or the area ────────────────────────────────────────────────────────────────
function findMissing(level: DifficultyLevel, shapeKey: string, given: "perimeter" | "area", mixed: boolean): Built {
  const { convs, fmt, forget } = makeFmt(mixed);
  const unit2 = (v: number) => `${v} cm²`;
  let shape: Shape, find: number, V: number, beats: Beat[];
  const tail = [...(mixed ? ["Give your answer in cm."] : [])];
  let caption: string[];
  const markFind = (i: number, value: number) => { forget(value); shape.edges[i] = { ...shape.edges[i], label: "", kind: "find", value: `${value} cm` }; };

  if (shapeKey === "rectangle" && given === "perimeter") {
    const g = ri(3, 20); let o = ri(3, 20); while (o === g) o = ri(3, 20);
    shape = rectangle(g, o, fmt); markFind(1, o); find = o; V = 2 * (g + o);
    caption = [`The perimeter is ${V} cm.`, ...tail, "Find the length marked ?."];
    beats = [
      { step: mStep("Two sides add to half the perimeter:", [`${V} \\div 2`, `= ${V / 2}`]), focus: allEdges(4) },
      { step: mStep("Take away the side you know:", [`${V / 2} - ${g}`, `= ${o}`], CM), focus: { edges: [0, 1], reveal: [1] } },
    ];
  } else if (shapeKey === "rectangle") {
    const g = ri(3, 16); let o = ri(3, 16); while (o === g) o = ri(3, 16);
    shape = rectangle(g, o, fmt); markFind(1, o); find = o; V = g * o;
    caption = [`The area is ${unit2(V)}.`, ...tail, "Find the length marked ?."];
    beats = [{ step: mStep("Area = length × width, so divide the area by the side you know:", [`${V} \\div ${g}`, `= ${o}`], CM), focus: { edges: [0, 1], reveal: [1] } }];
  } else if (shapeKey === "triangle") {
    const [x, y, z] = pickOne(TRIPLES), [a, b] = chance(0.5) ? [x, y] : [y, x];   // legs: height a, base b
    shape = rightTriangle(a, b, z, fmt); markFind(2, a); find = a; V = (a * b) / 2;
    caption = [`The area is ${unit2(V)}.`, ...tail, "Find the height marked ?."];
    beats = [{ step: mStep("Area = ½ × base × height, so height = 2 × area ÷ base:", [`2 \\times ${V} \\div ${b}`, `= ${a}`], CM), focus: { edges: [0, 2], reveal: [2] } }];
  } else if (shapeKey === "parallelogram") {
    const [p, h, s] = triple(), b = ri(Math.max(5, Math.ceil(p / 1.5)), 20);
    shape = parallelogram(b, p, h, s, fmt); forget(h); shape.helpers = shape.helpers.map((x) => (x.id === "h" ? { ...x, label: undefined, find: true, value: `${h} cm` } : x));
    find = h; V = b * h;
    caption = [`The area is ${unit2(V)}.`, ...tail, "Find the height marked ?."];
    beats = [{ step: mStep("Area = base × height, so height = area ÷ base:", [`${V} \\div ${b}`, `= ${h}`], CM), focus: { edges: [0], helpers: ["h"], revealHelpers: ["h"] } }];
  } else {
    const [p, h, s] = triple(), b = ri(3, 12), a = b + 2 * p;
    shape = trapezium(b, p, h, s, fmt); markFind(2, b); find = b; V = ((a + b) * h) / 2;
    caption = [`The area is ${unit2(V)}.`, ...tail, "Find the length marked ?."];
    beats = [
      { step: mStep("Area = ½ × (a + b) × height, so a + b = 2 × area ÷ height:", [`2 \\times ${V} \\div ${h}`, `= ${a + b}`]), focus: { edges: [0, 2], helpers: ["h"] } },
      { step: mStep("Take away the parallel side you know:", [`${a + b} - ${a}`, `= ${b}`], CM), focus: { edges: [0, 2], reveal: [2] } },
    ];
  }
  return finish(level, shape, { caption, answerLine: `Missing length = ${find} cm` }, find, CM, [...conversionBeat(convs), ...beats], `shapes-${level}-${shapeKey}-${shape.dims}-${given}-${V}-${mixed ? "m" : "s"}`);
}

export function genShapes(level: DifficultyLevel, msv: Record<string, boolean>): Built {
  const shapes = level === "level1" ? SHAPES_1 : level === "level2" ? SHAPES_2 : SHAPES_3;
  const pools = [level === "level3" ? GIVEN : ASK, shapes, ...(level === "level1" ? [SIDES_SHAPES] : level === "level2" ? [UNITS, SIDES_SHAPES] : [UNITS])];
  const v = maskUnmetOptions(pools, resolveMultiSelectValues(pools, msv));
  let shape = pickActive(v, shapes.options);
  const ask = pickActive(v, (level === "level3" ? GIVEN : ASK).options) as "perimeter" | "area";
  const mixed = level !== "level1" && !!v.mixed;
  if (level === "level3") return findMissing(level, shape, ask, mixed);
  if (shape === "regularPolygon" && ask === "area") shape = "rectangle";   // a regular polygon is a perimeter question
  return findPerimeterOrArea(level, shape, ask, mixed, !!v.all);
}
