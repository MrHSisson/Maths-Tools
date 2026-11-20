// Mechanics diagrams (docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §7): every template builds a sound scene for many random parameter sets, both ways round,
// at every size, with every label placed (none dropped, none overlapping another label or running off the picture), and the scene model's own rules hold
// (mirroring is exact, hidden labels show their placeholder until the answer is revealed, a worked example reveals elements by step).
// Set MECH_PREVIEW_DIR to a folder to also write an SVG of each sample there (for a look; the test does not need it).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LABEL_SIZE, MechDiagram, MechPicture, buildElasticHorizontal, buildElasticVertical, buildHorizontal, buildInOrder, buildVertical, displayStep, layoutScene, lblText, mirrorScene, partsAt, stageParts, stepCount, validateScene,
  type DiagramDisplay, type DiagramSize, type ElasticHorizontalParams, type ElasticVerticalParams, type HorizontalParams, type Scene, type VerticalParams,
} from "../shared/mechanics";
import { seededRandom } from "./seededRandom";
import { segHitsRect } from "../shared/shapes/labels";

type Display = DiagramDisplay;
const SIZES = Object.keys(LABEL_SIZE) as DiagramSize[];
const pickFrom = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const chance = (r: () => number, p: number) => r() < p;

function horizontalParams(r: () => number): HorizontalParams {
  const forces: HorizontalParams["forces"] = [];
  if (chance(r, 0.8)) forces.push({ kind: pickFrom(r, ["driving", "applied"] as const), label: { text: `${Math.round(20 + r() * 480)} N`, ask: chance(r, 0.2) ? "F" : undefined } });
  if (chance(r, 0.7)) forces.push({ kind: pickFrom(r, ["resistance", "friction"] as const), label: { text: `${Math.round(5 + r() * 90)} N` } });
  if (chance(r, 0.25)) forces.push({ kind: "resistance", label: { text: "R₂" } });
  return {
    body: pickFrom(r, ["block", "particle"] as const),
    forces,
    weightAndNormal: chance(r, 0.7) ? { weight: chance(r, 0.5) ? { text: `${Math.round(10 + r() * 90)}g N` } : undefined } : false,
    distance: chance(r, 0.7) ? { label: { text: `${Math.round(5 + r() * 900) / 10} m`, ask: chance(r, 0.25) ? "d" : undefined }, from: chance(r, 0.5) ? "A" : undefined, to: chance(r, 0.5) ? "B" : undefined } : undefined,
    velocity: chance(r, 0.4) ? { text: `${Math.round(1 + r() * 25)} m s⁻¹` } : undefined,
    bodyLabel: chance(r, 0.5) ? { text: `${Math.round(5 + r() * 200)} kg` } : undefined,
    rough: chance(r, 0.5),
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

const TEMPLATES: { name: string; build: (r: () => number) => Scene }[] = [
  { name: "horizontal", build: (r) => buildHorizontal(horizontalParams(r)) },
  { name: "vertical", build: (r) => buildVertical(verticalParams(r)) },
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
          const wanted = lay.visible.filter((e) => ("label" in e && lblText(e.label, showAnswer)) || e.type === "marker").length;
          if (lay.labels.length !== wanted) problems.push(`#${i} ${size}: ${lay.labels.length} labels placed, ${wanted} wanted`);
          if (lay.unplaced.length) problems.push(`#${i} ${size} answer=${showAnswer}: unplaced ${lay.unplaced.join(",")} ${JSON.stringify(lay.labels.filter((l) => lay.unplaced.some((u) => u.startsWith(l.id))).map((l) => l.rect))} ${JSON.stringify(scene.elements.filter((e) => e.type === "body"))}`);
          // a force label must not sit on any line (a dimension's own label is meant to break its line; a marker name sits clear by construction)
          for (const l of lay.labels) {
            const owner = lay.visible.find((e) => e.id === l.id);
            if (!owner || owner.type === "dim") continue;
            const hit = lay.obstacles.find((s) => segHitsRect(s, l.rect, -2));
            if (hit) problems.push(`#${i} ${size}: label ${l.id} ("${l.text}") sits on a line ${JSON.stringify(l.rect)} ${JSON.stringify(hit)}`);
          }
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
      expect(JSON.stringify(twice)).toEqual(JSON.stringify(s));
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
