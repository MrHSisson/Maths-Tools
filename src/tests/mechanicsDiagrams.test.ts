// Mechanics diagrams (docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §7): every template builds a sound scene for many random parameter sets, both ways round,
// at every size, with every label placed (none dropped, none overlapping another label or running off the picture), and the scene model's own rules hold
// (mirroring is exact, hidden labels show their placeholder until the answer is revealed, a worked example reveals elements by step).
// Set MECH_PREVIEW_DIR to a folder to also write an SVG of each sample there (for a look; the test does not need it).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LABEL_SIZE, MechDiagram, MechPicture, buildElasticHorizontal, buildElasticVertical, buildHorizontal, buildEnergyBars, buildForceDiagram, buildForceDisplacement, buildHole, buildIncline, buildInclineString, buildInOrder, buildProfile, buildPulley, buildSpeedTime, buildTwoStrings, buildVertical, displayStep, layoutScene, lblText, mirrorScene, partsAt, stageParts, stepCount, validateScene,
  type DiagramDisplay, type DiagramSize, type ElasticHorizontalParams, type ElasticVerticalParams, type HorizontalParams, type InclineParams, type Scene, type VerticalParams,
} from "../shared/mechanics";
import { seededRandom } from "./seededRandom";

type Display = DiagramDisplay;
const SIZES = Object.keys(LABEL_SIZE) as DiagramSize[];
const pickFrom = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const chance = (r: () => number, p: number) => r() < p;

function horizontalParams(r: () => number): HorizontalParams {
  const forces: HorizontalParams["forces"] = [];
  const angledAt = chance(r, 0.35);
  if (!angledAt && chance(r, 0.8)) forces.push({ kind: pickFrom(r, ["driving", "applied"] as const), label: { text: `${Math.round(20 + r() * 480)} N`, ask: chance(r, 0.2) ? "F" : undefined } });
  if (chance(r, 0.7)) forces.push({ kind: pickFrom(r, ["resistance", "friction"] as const), label: { text: `${Math.round(5 + r() * 90)} N` } });
  if (!angledAt && chance(r, 0.25)) forces.push({ kind: "resistance", label: { text: "R₂" } });
  return {
    body: pickFrom(r, ["block", "particle"] as const),
    forces,
    weightAndNormal: chance(r, 0.7) ? { weight: chance(r, 0.5) ? { text: `${Math.round(10 + r() * 90)}g N` } : undefined } : false,
    distance: chance(r, 0.7) ? { label: { text: `${Math.round(5 + r() * 900) / 10} m`, ask: chance(r, 0.25) ? "d" : undefined }, from: chance(r, 0.5) ? "A" : undefined, to: chance(r, 0.5) ? "B" : undefined } : undefined,
    velocity: !angledAt && chance(r, 0.4) ? { text: `${Math.round(1 + r() * 25)} m s⁻¹` } : undefined,
    bodyLabel: chance(r, 0.5) ? { text: `${Math.round(5 + r() * 200)} kg` } : undefined,
    rough: chance(r, 0.5),
    angled: angledAt ? {
      label: { text: pickFrom(r, ["F", "25 N", "T"] as const) },
      angle: 10 + r() * 60,
      angleLabel: { text: pickFrom(r, ["θ", "20°", "35°"] as const), ask: chance(r, 0.2) ? "?" : undefined },
      push: chance(r, 0.4),
      components: chance(r, 0.6) ? { along: { text: "F cos θ" }, across: { text: "F sin θ" } } : undefined,
    } : undefined,
    mirror: chance(r, 0.5),
  };
}

function inclineParams(r: () => number): InclineParams {
  // The two pictures a slope question uses are drawn separately, as in the textbooks: a work picture (the distance moved, the height, the length, the speed)
  // and a force picture (weight, normal reaction, the weight's components, an angled force). At most one force up the slope and one down it.
  const forcePicture = chance(r, 0.5);
  const forces: InclineParams["forces"] = [];
  const angledAt = forcePicture && chance(r, 0.3);
  if (!angledAt && chance(r, 0.6)) forces.push({ kind: pickFrom(r, ["driving", "applied", "tension"] as const), label: { text: `${Math.round(20 + r() * 300)} N` } });
  if (chance(r, 0.6)) forces.push({ kind: pickFrom(r, ["resistance", "friction"] as const), label: { text: `${Math.round(5 + r() * 90)} N`, ask: chance(r, 0.15) ? "R" : undefined } });
  return {
    angle: 8 + r() * 58,
    angleLabel: chance(r, 0.8) ? { text: pickFrom(r, ["α", "15°", "30°"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    body: pickFrom(r, ["block", "particle"] as const),
    bodyLabel: chance(r, 0.5) ? { text: pickFrom(r, ["m", "3.0 kg", "2.1 kg"] as const) } : undefined,
    forces,
    angled: angledAt ? { label: { text: "30 N" }, angleFromSlope: 15 + r() * 40, angleLabel: { text: "θ" } } : undefined,
    weight: forcePicture ? (chance(r, 0.5) ? true : { text: "20g N" }) : undefined,
    normal: forcePicture ? true : undefined,
    components: forcePicture && chance(r, 0.6) ? { along: { text: "mg sin α" }, across: { text: "mg cos α" } } : undefined,
    velocity: !forcePicture && chance(r, 0.4) ? { text: "v" } : undefined,
    distance: !forcePicture && chance(r, 0.7) ? { label: { text: pickFrom(r, ["50 m", "d", "3.5 m"] as const), ask: chance(r, 0.2) ? "?" : undefined }, from: chance(r, 0.5) ? "A" : undefined, to: chance(r, 0.5) ? "B" : undefined } : undefined,
    height: !forcePicture && chance(r, 0.7) ? { text: pickFrom(r, ["h", "2.2 m", "25 m"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    length: !forcePicture && chance(r, 0.3) ? { text: pickFrom(r, ["x", "3.5 m"] as const) } : undefined,
    mirror: chance(r, 0.5),
  };
}

function verticalParams(r: () => number): VerticalParams {
  const startRel = 0.55 + r() * 0.45;
  const endRel = r() * 0.4;
  return {
    body: pickFrom(r, ["block", "particle"] as const),
    start: { rel: startRel, height: { text: chance(r, 0.5) ? "h₁" : `${Math.round(5 + r() * 60)} m`, ask: chance(r, 0.2) ? "?" : undefined }, speed: chance(r, 0.7) ? { text: `${Math.round(1 + r() * 25)} m s⁻¹` } : undefined, moving: pickFrom(r, ["up", "down"] as const), name: chance(r, 0.4) ? "A" : undefined },
    end: chance(r, 0.85) ? { rel: endRel, height: chance(r, 0.7) ? { text: chance(r, 0.5) ? "h₂" : `${Math.round(r() * 20)} m` } : undefined, speed: chance(r, 0.6) ? { text: "v" } : undefined, moving: "down", name: chance(r, 0.4) ? "B" : undefined } : undefined,
    drop: chance(r, 0.6) ? { text: chance(r, 0.5) ? "h₁ − h₂" : `${Math.round(5 + r() * 40)} m`, ask: chance(r, 0.3) ? "?" : undefined } : undefined,
    weight: chance(r, 0.5) ? { text: "mg" } : undefined,
    bodyLabel: chance(r, 0.3) ? { text: "m" } : undefined,
    mirror: chance(r, 0.5),
  };
}

function elasticHorizontalParams(r: () => number): ElasticHorizontalParams {
  const kind = pickFrom(r, ["spring", "elastic"] as const);
  return {
    kind,
    state: pickFrom(r, ["natural", "extended", "extended", "compressed"] as const),
    stretch: 0.2 + r() * 0.4,
    body: pickFrom(r, ["block", "particle"] as const),
    mass: chance(r, 0.6) ? { text: pickFrom(r, ["m", "0.25 kg", "1.5 kg", "250 g"] as const) } : undefined,
    natural: chance(r, 0.8) ? { text: pickFrom(r, ["l", "1.8 m", "0.75 m"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    extension: chance(r, 0.7) ? { text: pickFrom(r, ["x", "0.35 m", "e"] as const), ask: chance(r, 0.3) ? "?" : undefined } : undefined,
    length: chance(r, 0.4) ? { text: pickFrom(r, ["l + x", "2.15 m"] as const) } : undefined,
    modulus: chance(r, 0.5) ? { text: pickFrom(r, ["λ = 85 N", "k", "λ"] as const) } : undefined,
    force: chance(r, 0.5) ? { text: pickFrom(r, ["40 N", "F"] as const) } : undefined,
    names: { fixed: chance(r, 0.4) ? "A" : undefined, free: chance(r, 0.4) ? "B" : undefined, natural: chance(r, 0.3) ? "C" : undefined },
    mirror: chance(r, 0.5),
  };
}

function elasticVerticalParams(r: () => number): ElasticVerticalParams {
  const n = 1 + Math.floor(r() * 3);
  const body = pickFrom(r, ["block", "particle"] as const);
  const states = Array.from({ length: body === "block" ? Math.min(n, 2) : n }, (_, i) => ({
    ext: i === 0 ? r() * 0.3 : 0.3 + r() * 0.6,
    name: chance(r, 0.5) ? "ABC"[i] : undefined,
    ghost: i === 0 && chance(r, 0.4),
    weight: chance(r, 0.5) ? { text: pickFrom(r, ["mg", "14.7 N"] as const) } : undefined,
    tension: chance(r, 0.4) ? { text: pickFrom(r, ["T", "λx/l"] as const) } : undefined,
    speed: chance(r, 0.3) ? { text: "v" } : undefined,
  }));
  return {
    kind: pickFrom(r, ["spring", "elastic"] as const),
    states, body,
    mass: chance(r, 0.5) ? { text: pickFrom(r, ["m", "1.5 kg"] as const) } : undefined,
    natural: chance(r, 0.8) ? { text: pickFrom(r, ["l", "0.8 m"] as const) } : undefined,
    extension: chance(r, 0.8) ? { text: pickFrom(r, ["x", "0.44 m"] as const), ask: chance(r, 0.3) ? "?" : undefined } : undefined,
    dimState: Math.floor(r() * states.length),
    modulus: chance(r, 0.3) ? { text: "λ" } : undefined,
    fixed: chance(r, 0.5) ? "O" : undefined,
    mirror: chance(r, 0.5),
  };
}

function inclineStringParams(r: () => number) {
  return {
    kind: pickFrom(r, ["spring", "elastic"] as const),
    angle: 12 + r() * 44,
    angleLabel: chance(r, 0.7) ? { text: pickFrom(r, ["30°", "α"] as const) } : undefined,
    state: pickFrom(r, ["natural", "extended", "extended"] as const),
    stretch: 0.3 + r() * 0.4,
    body: pickFrom(r, ["block", "particle"] as const),
    bodyLabel: chance(r, 0.5) ? { text: pickFrom(r, ["m", "6 kg", "0.5 kg"] as const) } : undefined,
    natural: chance(r, 0.8) ? { text: pickFrom(r, ["l", "0.8 m", "4 m"] as const) } : undefined,
    extension: chance(r, 0.7) ? { text: pickFrom(r, ["x", "e"] as const), ask: chance(r, 0.3) ? "?" : undefined } : undefined,
    length: chance(r, 0.3) ? { text: pickFrom(r, ["l + x", "5.5 m"] as const) } : undefined,
    names: { fixed: chance(r, 0.5) ? "A" : undefined, natural: chance(r, 0.4) ? "B" : undefined, free: chance(r, 0.4) ? "C" : undefined },
    mirror: chance(r, 0.5),
  };
}

function twoStringsParams(r: () => number) {
  return {
    kind: pickFrom(r, ["elastic", "string"] as const),
    position: 0.3 + r() * 0.4,
    mass: chance(r, 0.5) ? { text: pickFrom(r, ["2 kg", "m"] as const) } : undefined,
    ab: chance(r, 0.7) ? { text: pickFrom(r, ["2.0 m", "d"] as const) } : undefined,
    lengthA: chance(r, 0.6) ? { text: pickFrom(r, ["1.5 m", "l₁"] as const) } : undefined,
    lengthB: chance(r, 0.6) ? { text: pickFrom(r, ["0.90 m", "l₂"] as const) } : undefined,
    angleA: chance(r, 0.6) ? { text: pickFrom(r, ["α", "25°"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    angleB: chance(r, 0.6) ? { text: pickFrom(r, ["β", "45°"] as const) } : undefined,
    tensionA: chance(r, 0.4) ? { text: "T_A" } : undefined,
    tensionB: chance(r, 0.4) ? { text: "T_B" } : undefined,
    weight: chance(r, 0.5) ? { text: "2g N" } : undefined,
    names: { a: chance(r, 0.6) ? "A" : undefined, b: chance(r, 0.6) ? "B" : undefined, p: chance(r, 0.5) ? "P" : undefined },
    mirror: chance(r, 0.5),
  };
}

function profileParams(r: () => number) {
  return {
    startRel: 0.6 + r() * 0.4,
    endRel: 0.25 + r() * 0.4,
    startHeight: chance(r, 0.8) ? { text: pickFrom(r, ["35 m", "h₁"] as const) } : undefined,
    endHeight: chance(r, 0.8) ? { text: pickFrom(r, ["10 m", "h₂"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    distance: chance(r, 0.7) ? { text: pickFrom(r, ["500 m", "d"] as const) } : undefined,
    body: chance(r, 0.6),
    bodyLabel: chance(r, 0.4) ? { text: "62 kg" } : undefined,
    names: { start: chance(r, 0.5) ? "A" : undefined, end: chance(r, 0.5) ? "B" : undefined },
    mirror: chance(r, 0.5),
  };
}

function pulleyParams(r: () => number) {
  return {
    load: chance(r, 0.8) ? { text: pickFrom(r, ["1.5 kg", "m"] as const) } : undefined,
    tension: chance(r, 0.7) ? { text: pickFrom(r, ["18 N", "T"] as const) } : undefined,
    weight: chance(r, 0.5) ? { text: "mg" } : undefined,
    height: chance(r, 0.7) ? { text: pickFrom(r, ["h", "2.0 m"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    speed: chance(r, 0.4) ? { text: "v" } : undefined,
    mirror: chance(r, 0.5),
  };
}

function forceDisplacementParams(r: () => number) {
  return {
    shape: pickFrom(r, ["constant", "linear", "decreasing", "quadratic", "sqrt", "sine", "reciprocal"] as const),
    from: 0.05 + r() * 0.3, to: 0.5 + r() * 0.4,
    xTitle: chance(r, 0.8) ? { text: pickFrom(r, ["x (m)", "x"] as const) } : undefined,
    yTitle: chance(r, 0.8) ? { text: pickFrom(r, ["F (N)", "F"] as const) } : undefined,
    curveLabel: chance(r, 0.6) ? { text: pickFrom(r, ["8x + 15", "kx²", "2√x"] as const) } : undefined,
    x1: chance(r, 0.8) ? { text: pickFrom(r, ["x₁", "2.0", "1.0"] as const) } : undefined,
    x2: chance(r, 0.8) ? { text: pickFrom(r, ["x₂", "5.0", "2.0"] as const), ask: chance(r, 0.2) ? "a" : undefined } : undefined,
    f1: chance(r, 0.3) ? { text: "31" } : undefined, f2: chance(r, 0.3) ? { text: "55" } : undefined,
    areaLabel: chance(r, 0.6) ? { text: pickFrom(r, ["work done", "W"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    shade: chance(r, 0.85),
  };
}

function speedTimeParams(r: () => number) {
  const shape = pickFrom(r, ["trapezium", "triangle", "accelerating", "steps"] as const);
  const n = shape === "trapezium" ? 3 : shape === "triangle" ? 2 : shape === "steps" ? 5 : 1;
  return {
    shape,
    times: Array.from({ length: n }, (_, i) => ({ text: pickFrom(r, [`t${"₁₂₃₄₅"[i]}`, `${30 + 40 * i} s`] as const) })).filter(() => chance(r, 0.85)),
    speed: chance(r, 0.7) ? { text: pickFrom(r, ["15", "v"] as const) } : undefined,
    curveLabel: chance(r, 0.3) ? { text: "v" } : undefined,
  };
}

function energyBarsParams(r: () => number) {
  const n = 2 + Math.floor(r() * 3);
  const total = 0.7 + r() * 0.3;
  const conserved = chance(r, 0.6);
  return {
    conserved,
    legend: chance(r, 0.8),
    columns: Array.from({ length: n }, (_, i) => {
      const frac = n === 1 ? 0 : i / (n - 1);
      const gpe = total * (1 - frac) * (chance(r, 0.9) ? 1 : 0.5);
      const ke = conserved ? total - gpe : total * frac * 0.9;
      return { name: { text: pickFrom(r, [`${"ABCD"[i]}`, ["start", "middle", "end", "top"][i]] as const) }, gpe: gpe > 0.02 ? gpe : undefined, ke: ke > 0.02 ? ke : undefined, epe: chance(r, 0.2) ? 0.1 + r() * 0.2 : undefined, work: !conserved && chance(r, 0.4) ? 0.1 + r() * 0.15 : undefined };
    }),
  };
}

function forceDiagramParams(r: () => number) {
  const kinds = ["weight", "normal", "driving", "resistance", "tension", "applied", "friction"] as const;
  const n = 2 + Math.floor(r() * 3);
  const start = r() * 360;
  const chosen = new Set<(typeof kinds)[number]>();
  while (chosen.size < n) chosen.add(pickFrom(r, kinds));
  const list = [...chosen];
  const forces = list.map((kind, i) => ({ kind, angle: kind === "weight" ? 270 : (start + (360 / n) * i + (r() - 0.5) * 16) % 360, label: chance(r, 0.9) ? { text: pickFrom(r, ["T", "20 N", "mg", "R"] as const) } : undefined }));
  // keep any two arrows at least 40 degrees apart (a weight at 270 included)
  const sep = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  const ok = forces.every((f, i) => forces.every((g, j) => i === j || sep(f.angle, g.angle) >= 40));
  const use = ok ? forces : [{ kind: "weight" as const, angle: 270, label: { text: "mg" } }, { kind: "normal" as const, angle: 90, label: { text: "R" } }];
  const resolveIdx = use.findIndex((f) => f.kind !== "weight" && f.kind !== "normal");
  const axis = pickFrom(r, [0, 20, 30] as const);
  return {
    forces: use,
    axisAngle: resolveIdx >= 0 && chance(r, 0.7) ? axis : undefined,
    resolve: resolveIdx >= 0 && chance(r, 0.5) ? { force: resolveIdx, along: { text: "F cos θ" }, across: { text: "F sin θ" } } : undefined,
    body: chance(r, 0.4) ? { text: "m" } : undefined,
  };
}

function holeParams(r: () => number) {
  return {
    kind: pickFrom(r, ["elastic", "string"] as const),
    massA: chance(r, 0.8) ? { text: pickFrom(r, ["8 kg", "A", "m"] as const) } : undefined,
    massB: chance(r, 0.8) ? { text: pickFrom(r, ["3 kg", "B"] as const) } : undefined,
    distanceA: chance(r, 0.8) ? { text: pickFrom(r, ["3.5 m", "d"] as const) } : undefined,
    depthB: chance(r, 0.8) ? { text: pickFrom(r, ["2 m", "h"] as const), ask: chance(r, 0.2) ? "?" : undefined } : undefined,
    friction: chance(r, 0.6) ? { text: pickFrom(r, ["μR", "31.4 N"] as const) } : undefined,
    weightB: chance(r, 0.6) ? { text: "3g N" } : undefined,
    tension: chance(r, 0.4) ? { text: "T" } : undefined,
    names: { a: chance(r, 0.5) ? "A" : undefined, b: chance(r, 0.5) ? "B" : undefined, hole: chance(r, 0.4) ? "O" : undefined },
    mirror: chance(r, 0.5),
  };
}

/** How many labels an element should have placed: its own label, a marker's name, a graph's titles, marks, curve and area labels, a bar chart's column names and legend. */
function wantedLabels(e: Scene["elements"][number], showAnswer: boolean): number {
  const has = (l?: { text: string; ask?: string }) => (l && lblText(l, showAnswer) ? 1 : 0);
  if (e.type === "marker") return 1;
  if (e.type === "graph") return has(e.xTitle) + has(e.yTitle) + has(e.curveLabel) + has(e.area?.label) + (e.marks ?? []).reduce((n, m) => n + has(m.label), 0);
  if (e.type === "bars") return e.columns.reduce((n, c) => n + has(c.name), 0) + (e.legend ? 4 : 0);
  return "label" in e ? has(e.label) : 0;
}

const TEMPLATES: { name: string; build: (r: () => number) => Scene }[] = [
  { name: "horizontal", build: (r) => buildHorizontal(horizontalParams(r)) },
  { name: "vertical", build: (r) => buildVertical(verticalParams(r)) },
  { name: "incline", build: (r) => buildIncline(inclineParams(r)) },
  { name: "incline-string", build: (r) => buildInclineString(inclineStringParams(r)) },
  { name: "two-strings", build: (r) => buildTwoStrings(twoStringsParams(r)) },
  { name: "profile", build: (r) => buildProfile(profileParams(r)) },
  { name: "pulley", build: (r) => buildPulley(pulleyParams(r)) },
  { name: "force-displacement", build: (r) => buildForceDisplacement(forceDisplacementParams(r)) },
  { name: "speed-time", build: (r) => buildSpeedTime(speedTimeParams(r)) },
  { name: "energy-bars", build: (r) => buildEnergyBars(energyBarsParams(r)) },
  { name: "force-diagram", build: (r) => buildForceDiagram(forceDiagramParams(r)) },
  { name: "hole", build: (r) => buildHole(holeParams(r)) },
  { name: "elastic-horizontal", build: (r) => buildElasticHorizontal(elasticHorizontalParams(r)) },
  { name: "elastic-vertical", build: (r) => buildElasticVertical(elasticVerticalParams(r)) },
];

const dir = process.env.MECH_PREVIEW_DIR;

describe("mechanics diagrams: every template", () => {
  for (const t of TEMPLATES) {
    it(`${t.name}: 200 random scenes are sound, fully labelled and clear at every size`, () => {
      const r = seededRandom(20261120);
      const problems: string[] = [];
      for (let i = 0; i < 200; i++) {
        const scene = t.build(r);
        const bad = validateScene(scene);
        if (bad.length) problems.push(`#${i} scene: ${bad.join("; ")}`);
        for (const size of SIZES) for (const showAnswer of [false, true]) {
          const lay = layoutScene(scene, { showAnswer, fontSize: LABEL_SIZE[size] });
          const wanted = lay.visible.reduce((n, e) => n + wantedLabels(e, showAnswer), 0);
          if (lay.labels.length !== wanted) problems.push(`#${i} ${size}: ${lay.labels.length} labels placed, ${wanted} wanted`);
          if (lay.unplaced.length) problems.push(`#${i} ${size} answer=${showAnswer}: unplaced ${lay.unplaced.join(",")} ${JSON.stringify(lay.labels.filter((l) => lay.unplaced.some((u) => u.startsWith(l.id))).map((l) => l.rect))} ${JSON.stringify(scene.elements.filter((e) => e.type === "body"))}`);
          if (lay.clashes.length) problems.push(`#${i} ${size}: labels on a line: ${lay.clashes.join(",")} ${lay.clashes.map((id) => { const lb = lay.labels.find((x) => x.id === id); return lb ? JSON.stringify(lb.rect) + JSON.stringify(lay.obstacles.filter((o) => Math.abs(o.x1 - lb.rect.x) < 200 && Math.abs(o.y1 - lb.rect.y) < 200).map((o) => [Math.round(o.x1), Math.round(o.y1), Math.round(o.x2), Math.round(o.y2)])) : ""; }).join(" ")}`);
        }
        const html = renderToStaticMarkup(createElement(MechDiagram, { scene, qIndex: 3, size: "board" }));
        if (/NaN|undefined|Infinity/.test(html)) problems.push(`#${i} html has a bad number`);
        if (!html.includes('data-q-index="3"')) problems.push(`#${i} no data-q-index`);
        if (dir && i < 12) {
          mkdirSync(dir, { recursive: true });
          writeFileSync(`${dir}/${t.name}-${String(i).padStart(2, "0")}.svg`, renderToStaticMarkup(createElement(MechDiagram, { scene, size: "board" })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
        }
      }
      expect(problems.slice(0, 25), `${problems.length} problems`).toEqual([]);
    });
  }

  it("mirroring twice gives the scene back, and no mirrored scene leaves the picture", () => {
    const r = seededRandom(7);
    for (const t of TEMPLATES) for (let i = 0; i < 50; i++) {
      const s = t.build(r);
      const twice = mirrorScene(mirrorScene(s));
      // flipping twice may move a coordinate by the last digit of a float, so compare to six decimal places
      const round = (_k: string, v: unknown) => (typeof v === "number" ? Math.round(v * 1e6) / 1e6 : v);
      expect(JSON.stringify(twice, round)).toEqual(JSON.stringify(s, round));
      expect(validateScene(mirrorScene(s))).toEqual([]);
    }
  });

  it("a hidden label shows its placeholder until the answer is shown", () => {
    const s = buildHorizontal({ forces: [{ kind: "driving", label: { text: "340 N", ask: "F" } }], distance: { label: { text: "12 m", ask: "?" } } });
    const hidden = layoutScene(s, { showAnswer: false, fontSize: 20 }).labels.map((l) => l.text);
    const shown = layoutScene(s, { showAnswer: true, fontSize: 20 }).labels.map((l) => l.text);
    expect(hidden).toContain("F"); expect(hidden).toContain("?"); expect(hidden).not.toContain("340 N");
    expect(shown).toContain("340 N"); expect(shown).toContain("12 m");
  });

  it("a worked example reveals elements by step", () => {
    const s = buildHorizontal({ forces: [{ kind: "driving", label: { text: "F" } }] });
    s.elements = s.elements.map((e) => (e.id === "f-driving-0" ? { ...e, reveal: 2 } : e));
    const at1 = layoutScene(s, { step: 1, fontSize: 20 });
    const at2 = layoutScene(s, { step: 2, fontSize: 20 });
    expect(at1.visible.some((e) => e.id === "f-driving-0")).toBe(false);
    expect(at2.visible.some((e) => e.id === "f-driving-0")).toBe(true);
    expect(at1.labels.some((l) => l.id === "f-driving-0")).toBe(false);
  });

  it("every element belongs to a named part, and a picture can be built up part by part", () => {
    const r = seededRandom(11);
    for (const t of TEMPLATES) for (let i = 0; i < 30; i++) {
      const s = t.build(r);
      const ids = new Set((s.parts ?? []).map((p) => p.id));
      expect(ids.size, `${t.name} has parts`).toBeGreaterThan(0);
      for (const e of s.elements) expect(ids.has(e.part ?? ""), `${t.name}: ${e.id} is in a named part`).toBe(true);
      const present = [...ids].filter((id) => s.elements.some((e) => e.part === id));
      const built = buildInOrder(s, present);
      expect(stepCount(built)).toBe(present.length);
      // at each step only the parts so far are on show, and each step adds exactly one more
      present.forEach((id, k) => {
        const shown = partsAt(built, k + 1);
        expect([...shown].sort()).toEqual(present.slice(0, k + 1).sort());
        expect(shown).toContain(id);
      });
      expect(partsAt(built, 0)).toEqual([]);
    }
  });

  it("labels do not move as parts are added (they are placed once for the whole picture)", () => {
    const r = seededRandom(5);
    for (const t of TEMPLATES) for (let i = 0; i < 30; i++) {
      const s = buildInOrder(t.build(r), (t.build(r).parts ?? []).map((p) => p.id));
      const full = layoutScene(s, { fontSize: 20 });
      for (let step = 1; step <= stepCount(s); step++) {
        for (const l of layoutScene(s, { step, fontSize: 20 }).labels) {
          const f = full.labels.find((x) => x.id === l.id);
          expect(f && [f.x, f.y]).toEqual([l.x, l.y]);
        }
      }
    }
  });

  it("a diagram is shown straight away, built up, or not at all, by one rule", () => {
    const given: Display = "given", build: Display = "build", hidden: Display = "hidden";
    expect(displayStep(given, { stage: "question" })).toBe(0);
    expect(displayStep(given, { stage: "working", shown: 3 })).toBe(3);
    expect(displayStep(given, { stage: "answer" })).toBeUndefined();
    expect(displayStep(build, { stage: "question" })).toBeNull();
    expect(displayStep(build, { stage: "working", shown: 0 })).toBeNull();
    expect(displayStep(build, { stage: "working", shown: 2 })).toBe(2);
    expect(displayStep(build, { stage: "answer" })).toBeUndefined();
    expect(displayStep(hidden, { stage: "question" })).toBeNull();
    expect(displayStep(hidden, { stage: "working", shown: 4 })).toBeNull();
    expect(displayStep(hidden, { stage: "answer" })).toBeNull();
    expect(displayStep("blurred", { stage: "question" })).toBe(0);
    expect(displayStep("blurred", { stage: "working", shown: 2 })).toBe(2);
    expect(displayStep("blurred", { stage: "answer" })).toBeUndefined();
    expect(displayStep("full", { stage: "question" })).toBeUndefined();
    expect(displayStep("full", { stage: "working", shown: 1 })).toBeUndefined();
    const scene = buildHorizontal({ forces: [{ kind: "driving", label: { text: "F" } }] });
    const html = (display: Display, view: Parameters<typeof displayStep>[1]) => renderToStaticMarkup(createElement(MechPicture, { scene, display, view }));
    expect(html("hidden", { stage: "answer" })).toBe("");
    expect(html("build", { stage: "question" })).toBe("");
    expect(html("given", { stage: "question" })).toContain("<svg");
  });

  it("a part added by the working is not in the question's picture but is in the answer's", () => {
    const base = buildHorizontal({ forces: [{ kind: "driving", label: { text: "F" } }] });
    const s = stageParts(base, { forces: 2 });
    expect(layoutScene(s, { step: 0, fontSize: 20 }).visible.some((e) => e.part === "forces")).toBe(false);
    expect(layoutScene(s, { step: 2, fontSize: 20 }).visible.some((e) => e.part === "forces")).toBe(true);
    expect(layoutScene(s, { fontSize: 20 }).visible.some((e) => e.part === "forces")).toBe(true);
  });

  // A handful of realistic scenes for a person to look at (only when MECH_PREVIEW_DIR is set): each at the three sizes a diagram shows at.
  it.skipIf(!dir)("writes the review scenes", () => {
    const review: Record<string, Scene> = {
      "lorry-braking": buildHorizontal({ body: "block", forces: [{ kind: "resistance", label: { text: "75 kN" } }], weightAndNormal: false, distance: { label: { text: "25 m" }, from: "A", to: "B" }, velocity: { text: "v" }, bodyLabel: { text: "m" } }),
      "tow-rope": buildHorizontal({ body: "block", forces: [{ kind: "driving", label: { text: "900 N" } }, { kind: "resistance", label: { text: "350 N" } }], weightAndNormal: { weight: { text: "1400g N" } }, distance: { label: { text: "2.4 km" } }, bodyLabel: { text: "1400 kg" } }),
      "cyclist-unknown": buildHorizontal({ body: "particle", mirror: true, forces: [{ kind: "driving", label: { text: "25 N" } }, { kind: "resistance", label: { text: "10 N" } }, { kind: "friction", label: { text: "5.0 N" } }], weightAndNormal: false, distance: { label: { text: "1.2 km", ask: "d" } } }),
      "falling-ball": buildVertical({ body: "particle", start: { rel: 0.9, height: { text: "h₁" }, speed: { text: "u" }, moving: "down", name: "A" }, end: { rel: 0.25, height: { text: "h₂" }, speed: { text: "v" }, moving: "down", name: "B" }, drop: { text: "h₁ − h₂" }, weight: { text: "mg" } }),
      "spring-compressed": buildElasticHorizontal({ kind: "spring", state: "compressed", stretch: 0.45, body: "block", mass: { text: "250 g" }, natural: { text: "15 cm" }, extension: { text: "5 cm" }, modulus: { text: "λ = 600 N" }, names: { fixed: "A", free: "B" } }),
      "elastic-table": buildElasticHorizontal({ kind: "elastic", state: "extended", stretch: 0.4, body: "particle", natural: { text: "l" }, extension: { text: "x", ask: "?" }, length: { text: "l + x" }, force: { text: "F" }, names: { fixed: "O", free: "P" } }),
      "string-hanging": buildElasticVertical({ kind: "elastic", states: [{ ext: 0, ghost: true, name: "A" }, { ext: 0.4, name: "B", weight: { text: "mg" }, tension: { text: "T" } }], mass: { text: "m" }, body: "particle", natural: { text: "l" }, extension: { text: "x", ask: "?" }, fixed: "O" }),
      "string-drop": buildElasticVertical({ kind: "elastic", states: [{ ext: 0, ghost: true, name: "A", speed: { text: "u" } }, { ext: 0.35, name: "B", speed: { text: "v" } }, { ext: 0.8, name: "C" }], body: "particle", natural: { text: "0.8 m" }, extension: { text: "x" }, dimState: 2, modulus: { text: "λ" }, fixed: "O" }),
      "rope-pull": buildHorizontal({ body: "block", weightAndNormal: false, bodyLabel: { text: "m" }, distance: { label: { text: "85 m" } }, angled: { label: { text: "50 N" }, angle: 30, angleLabel: { text: "30°" }, components: { along: { text: "50 cos 30°" }, across: { text: "50 sin 30°" } } } }),
      "push-angle": buildHorizontal({ body: "block", weightAndNormal: { weight: { text: "mg" } }, bodyLabel: { text: "m" }, angled: { label: { text: "F" }, angle: 35, angleLabel: { text: "θ" }, push: true, components: { along: { text: "F cos θ" }, across: { text: "F sin θ" } } } }),
      "slope-forces": buildIncline({ angle: 25, angleLabel: { text: "25°" }, body: "block", bodyLabel: { text: "3.0 kg" }, forces: [{ kind: "driving", label: { text: "30 N" } }, { kind: "friction", label: { text: "8 N" } }], weight: true, normal: true, velocity: { text: "v" } }),
      "slope-height": buildIncline({ angle: 18, angleLabel: { text: "α" }, body: "particle", distance: { label: { text: "50 m" }, from: "A", to: "B" }, height: { text: "h", ask: "?" }, bodyLabel: { text: "28 kg" } }),
      "slope-resolve": buildIncline({ angle: 30, angleLabel: { text: "30°" }, body: "block", bodyLabel: { text: "m" }, weight: true, normal: true, components: { along: { text: "mg sin 30°" }, across: { text: "mg cos 30°" } }, mirror: true }),
      "slope-strap": buildIncline({ angle: 10, angleLabel: { text: "10°" }, body: "block", bodyLabel: { text: "2.5 kg" }, angled: { label: { text: "7.5 N" }, angleFromSlope: 20, angleLabel: { text: "20°" } }, forces: [{ kind: "resistance", label: { text: "2.5 N" } }], distance: { label: { text: "10 m" } } }),
      "slope-string": buildInclineString({ kind: "elastic", angle: 30, angleLabel: { text: "30°" }, state: "extended", stretch: 0.5, body: "particle", natural: { text: "0.8 m" }, extension: { text: "x" }, names: { fixed: "A", natural: "B", free: "C" } }),
      "two-strings": buildTwoStrings({ kind: "elastic", position: 0.42, mass: { text: "2.0 kg" }, ab: { text: "2.0 m" }, lengthA: { text: "1.5 m" }, lengthB: { text: "0.90 m" }, angleA: { text: "α" }, angleB: { text: "β" }, tensionA: { text: "T_A" }, tensionB: { text: "T_B" }, weight: { text: "2g N" }, names: { a: "A", b: "B", p: "P" } }),
      "cyclist-profile": buildProfile({ startRel: 1, endRel: 0.35, startHeight: { text: "35 m" }, endHeight: { text: "10 m" }, distance: { text: "500 m" }, body: true, bodyLabel: { text: "62 kg" }, names: { start: "A", end: "B" } }),
      "pulley-lift": buildPulley({ load: { text: "1.5 kg" }, tension: { text: "18 N" }, weight: { text: "1.5g N" }, height: { text: "h", ask: "?" }, speed: { text: "v" } }),
      "force-graph": buildForceDisplacement({ shape: "linear", from: 0.2, to: 0.75, xTitle: { text: "x (m)" }, yTitle: { text: "F (N)" }, curveLabel: { text: "8x + 15" }, x1: { text: "2" }, x2: { text: "5" }, areaLabel: { text: "work done", ask: "W = ?" } }),
      "speed-graph": buildSpeedTime({ shape: "trapezium", times: [{ text: "30" }, { text: "150" }, { text: "175" }], speed: { text: "15" } }),
      "bars-conserved": buildEnergyBars({ conserved: true, columns: [{ name: { text: "start" }, gpe: 0.8, ke: 0.2 }, { name: { text: "middle" }, gpe: 0.4, ke: 0.6 }, { name: { text: "end" }, ke: 1 }] }),
      "bars-work": buildEnergyBars({ columns: [{ name: { text: "A" }, ke: 0.3 }, { name: { text: "B" }, gpe: 0.5, ke: 0.15, work: 0.2 }] }),
      "force-diagram": buildForceDiagram({ forces: [{ kind: "weight", angle: 270, label: { text: "mg" } }, { kind: "normal", angle: 120, label: { text: "R" } }, { kind: "driving", angle: 30, label: { text: "T" } }, { kind: "resistance", angle: 210, label: { text: "R" } }], axisAngle: 30, resolve: { force: 0, along: { text: "mg sin 30°" }, across: { text: "mg cos 30°" } }, angleMark: { from: 0, to: 30, label: { text: "30°" } }, body: { text: "m" } }),
      "hole-table": buildHole({ massA: { text: "8 kg" }, massB: { text: "3 kg" }, distanceA: { text: "3.5 m" }, depthB: { text: "2 m" }, friction: { text: "μR" }, weightB: { text: "3g N" }, names: { a: "A", b: "B", hole: "O" } }),
      "dropped-crate": buildVertical({ body: "block", start: { rel: 1, height: { text: "12 m" }, moving: "down", name: "A" }, end: { rel: 0, speed: { text: "v", ask: "?" }, moving: "down", name: "B" }, drop: { text: "12 m" }, bodyLabel: { text: "50 kg" } }),
    };
    mkdirSync(dir!, { recursive: true });
    // a picture built up part by part: the steps of a worked example, each at the board size
    const strips: Record<string, Scene> = {
      "tow-rope": buildInOrder(review["tow-rope"], ["setting", "measure", "forces"]),
      "string-hanging": buildInOrder(review["string-hanging"], ["setting", "mass", "lengths", "forces"]),
    };
    for (const [name, scene] of Object.entries(strips)) for (let k = 1; k <= stepCount(scene); k++)
      writeFileSync(`${dir}/strip-${name}-${k}.svg`, renderToStaticMarkup(createElement(MechDiagram, { scene, step: k, size: "example", showAnswer: false })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
    for (const [name, scene] of Object.entries(review)) for (const size of SIZES)
      writeFileSync(`${dir}/review-${name}-${size}.svg`, renderToStaticMarkup(createElement(MechDiagram, { scene, size, showAnswer: false })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
  });
});
