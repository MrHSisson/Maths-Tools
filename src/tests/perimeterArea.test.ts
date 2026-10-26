// Perimeter & Area: every picture, answer and label re-derived independently from the question's own points.
import { describe, it, expect } from "vitest";
import { __test } from "../tools/Geometry/PerimeterArea";
import { cutRects, splitRects, rectArea, boxOf, type Pt } from "../shared/shapes/model";
import { buildRect, type RectKind } from "../tools/Geometry/perimeterArea/rectilinear";
import type { Drawing } from "../shared/shapes/drawing";
import { aspectOf } from "../shared/shapes/Diagram";

const { generateQuestion } = __test as any;
type Q = { display: string; answer: string; answerLatex?: string; answerSuffix?: string; working: { latex: string; plain: string; label?: string }[]; key: string; _diagram: Drawing; _stepFocus: unknown[]; _aspect: number; _printAnswer: string };
type L = "level1" | "level2" | "level3";
const LEVELS: L[] = ["level1", "level2", "level3"];
const gen = (tool: string, level: L, ms: Record<string, boolean> = {}, vars: Record<string, boolean> = {}): Q => generateQuestion(tool, level, vars, "", ms);
const N = 80;

// independent geometry
const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const perim = (polys: Pt[][]) => polys.reduce((s, p) => s + p.reduce((t, a, i) => t + len(a, p[(i + 1) % p.length]), 0), 0);
const shoelace = (p: Pt[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;
const area = (polys: Pt[][]) => shoelace(polys[0]) - polys.slice(1).reduce((s, h) => s + shoelace(h), 0);
const asked = (q: Q) => (/perimeter/.test(q._diagram.caption[q._diagram.caption.length - 1]) ? "perimeter" : "area");

/** "70 mm", "1.5 m", "12 cm" → centimetres. */
const toCm = (t: string): number => { const m = t.match(/^([\d.]+) (mm|cm|m)$/)!; return Number(m[1]) * (m[2] === "mm" ? 0.1 : m[2] === "m" ? 100 : 1); };

describe("every question", () => {
  it("has a key that describes it, a prompt in the picture, a unit on the answer and one focus per step", () => {
    for (const tool of ["grid", "shapes", "compound", "algebraic"]) for (const level of LEVELS) for (let i = 0; i < 20; i++) {
      const q = gen(tool, level);
      expect(q.key).toBe(q.key.replace(/\d{6,}$/, q.key));          // no random id on the end
      expect(q._diagram.caption.length).toBeGreaterThan(0);
      expect(q._stepFocus.length).toBe(q.working.length);
      expect(q._aspect).toBeCloseTo(aspectOf(q._diagram), 6);
      expect(q._printAnswer).toBe(q.answerSuffix ? `${q.answer} ${q.answerSuffix}` : q.answer);
      expect(q.working[q.working.length - 1].latex.replace(/\s/g, "")).toContain(q.answer.replace(/^x = /, "").replace(/\s/g, "").replace(/−/g, "-").replace(/²/g, "^2"));
    }
  });
  it("has a pool big enough for a worksheet (at least 24 different keys in 300 questions)", () => {
    for (const tool of ["grid", "shapes", "compound", "algebraic"]) for (const level of LEVELS) {
      const keys = new Set(Array.from({ length: 300 }, () => gen(tool, level).key));
      expect(keys.size, `${tool} ${level}`).toBeGreaterThanOrEqual(24);
    }
  });
});

describe("Counting on a Grid", () => {
  it("answers match the squares and unit lengths of the shape", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("grid", level, { perimeter: true, area: true, two: true, five: true });
      const s = Number(q._diagram.caption[0].match(/^Each square is (\d+) cm/)![1]);
      const polys = q._diagram.polys;
      const want = asked(q) === "perimeter" ? perim(polys) * s : area(polys) * s * s;
      expect(Number(q.answer)).toBe(want);
      expect(q.answerSuffix).toBe(asked(q) === "perimeter" ? "cm" : "cm²");
      expect(polys.flat().every(([x, y]) => Number.isInteger(x) && Number.isInteger(y))).toBe(true);
      if (level === "level1") expect(polys[0].length).toBe(4);
    }
  });
  it("Level 2 shapes have no notch: the perimeter is the bounding rectangle's", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("grid", "level2", { perimeter: true, area: false });
      const b = boxOf(q._diagram.polys);
      expect(Number(q.answer)).toBe(2 * (b.x1 - b.x0 + b.y1 - b.y0));
    }
  });
});

describe("Standard Shapes", () => {
  it("Levels 1-2: the answer is the real perimeter or area of the drawn shape, and every label is a real length", () => {
    for (const level of ["level1", "level2"] as L[]) for (const units of [false, true]) for (let i = 0; i < N; i++) {
      const q = gen("shapes", level, units ? { mixed: true, same: false } : {});
      const d = q._diagram;
      const want = asked(q) === "perimeter" ? perim(d.polys) : area(d.polys);
      expect(Number(q.answer)).toBeCloseTo(want, 6);
      expect(Number.isInteger(Number(q.answer))).toBe(true);
      // labelled sides are as long as they say; a labelled height is the drawn dashed line
      const sides = d.edges.filter((e) => e.label);
      sides.forEach((e) => expect(toCm(e.label)).toBeCloseTo(len(e.a, e.b), 6));
      d.helpers.filter((h) => h.label).forEach((h) => expect(toCm(h.label!)).toBeCloseTo(len(h.a, h.b), 6));
      // the height line is perpendicular to the base it stands on (or a right angle is drawn)
      d.corners.forEach(([p, v, r]) => expect((p[0] - v[0]) * (r[0] - v[0]) + (p[1] - v[1]) * (r[1] - v[1])).toBeCloseTo(0, 6));
    }
  });
  it("a regular polygon is only ever a perimeter question", () => {
    let polygons = 0;
    for (let i = 0; i < N * 3; i++) {
      const q = gen("shapes", "level1", { perimeter: true, area: true, rectangle: true, square: true, regularPolygon: true });
      if (q._diagram.caption[0].startsWith("Regular")) { polygons++; expect(q._diagram.caption[q._diagram.caption.length - 1]).toBe("Find the perimeter."); }
    }
    expect(polygons).toBeGreaterThan(0);
  });
  it("the working states every conversion it needs and never mentions the answer's own length", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("shapes", "level2", { mixed: true, same: false });
      const converts = q.working[0].label === "Write every length in cm:";
      const hasNonCm = q._diagram.edges.some((e) => /mm|\d m$/.test(e.label)) || q._diagram.helpers.some((h) => h.label && /mm/.test(h.label));
      expect(converts).toBe(hasNonCm);
    }
  });
  it("Level 3: the length found makes the stated perimeter or area true", () => {
    for (let i = 0; i < N * 2; i++) {
      const q = gen("shapes", "level3", { perimeter: true, area: true, trapezium: true });
      const d = q._diagram;
      const stated = Number(d.caption[0].match(/is (\d+) cm/)![1]);
      const isPerimeter = /perimeter/.test(d.caption[0]);
      const found = d.edges.find((e) => e.kind === "find") ?? d.helpers.find((h) => h.find);
      const foundLen = "a" in found! && "kind" in found! && (found as any).kind === "find" ? len((found as any).a, (found as any).b) : len((found as any).a, (found as any).b);
      expect(Number(q.answer)).toBeCloseTo(foundLen, 6);
      expect(isPerimeter ? perim(d.polys) : area(d.polys)).toBeCloseTo(stated, 6);
      expect(d.caption.some((c) => /Give your answer in cm/.test(c))).toBe(false);
    }
  });
});

describe("Compound Shapes", () => {
  it("answers match the shape, in every option", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("compound", level, { perimeter: true, area: true, boundingRectangle: i % 2 === 0, addSides: i % 2 === 1, subtract: i % 3 === 0, split: i % 3 !== 0, mixed: level === "level3" && i % 2 === 0, same: !(level === "level3" && i % 2 === 0) });
      const d = q._diagram;
      expect(Number(q.answer)).toBeCloseTo(asked(q) === "perimeter" ? perim(d.polys) : area(d.polys), 6);
      expect(d.polys.flat().every(([x, y]) => Number.isInteger(x) && Number.isInteger(y))).toBe(true);
    }
  });
  it("Levels 1-2 never have a notch or a hole; Level 3 always does", () => {
    for (let i = 0; i < N; i++) {
      const q1 = gen("compound", i % 2 ? "level1" : "level2", { perimeter: true, area: true }), b = boxOf(q1._diagram.polys);
      expect(q1._diagram.polys.length).toBe(1);
      expect(perim(q1._diagram.polys)).toBe(2 * (b.x1 - b.x0 + b.y1 - b.y0));
      const q3 = gen("compound", "level3", { perimeter: true, area: true }), b3 = boxOf(q3._diagram.polys);
      expect(perim(q3._diagram.polys)).toBeGreaterThan(2 * (b3.x1 - b3.x0 + b3.y1 - b3.y0));
    }
  });
  it("a missing side can be found from the others: at most one across and one up, and its value is its real length", () => {
    let seen = 0;
    for (let i = 0; i < N * 2; i++) {
      const q = gen("compound", "level2", { perimeter: true, area: true, missing: true, all: false });
      const missing = q._diagram.edges.filter((e) => e.kind === "missing");
      expect(missing.length).toBeGreaterThanOrEqual(1);
      expect(missing.length).toBeLessThanOrEqual(2);
      const horizontals = missing.filter((e) => e.a[1] === e.b[1]).length;
      expect(horizontals).toBeLessThanOrEqual(1);
      expect(missing.length - horizontals).toBeLessThanOrEqual(1);
      missing.forEach((e) => expect(toCm(e.value!)).toBeCloseTo(len(e.a, e.b), 6));
      // the working finds each one before it uses it
      expect(q.working.filter((w) => w.label === "So the missing side is:").length).toBe(missing.length);
      seen += missing.length;
    }
    expect(seen).toBeGreaterThan(0);
  });
  it("labelled sides are as long as they say, and metres are only whole tens of cm from 50 up", () => {
    for (let i = 0; i < N * 2; i++) {
      const q = gen("compound", "level3", { mixed: true, same: false });
      q._diagram.edges.filter((e) => e.kind === "plain").forEach((e) => {
        expect(toCm(e.label)).toBeCloseTo(len(e.a, e.b), 6);
        if (/ m$/.test(e.label)) { const cm = toCm(e.label); expect(cm).toBeGreaterThanOrEqual(50); expect(Math.round(cm) % 10).toBe(0); expect(e.label).not.toMatch(/^0\.0/); }
      });
    }
  });
  it("splitting into rectangles and taking pieces away both give the area", () => {
    for (const kind of ["L", "T", "stairs2", "stairs3", "cross", "U", "comb", "frame"] as RectKind[]) for (let i = 0; i < 40; i++) {
      const polys = buildRect(kind), b = boxOf([polys[0]]);
      if (kind !== "frame") expect(splitRects(polys).reduce((s, r) => s + rectArea(r), 0)).toBeCloseTo(area(polys), 6);
      expect((b.x1 - b.x0) * (b.y1 - b.y0) - (kind === "frame" ? rectArea({ x0: 0, y0: 0, x1: boxOf([polys[1]]).x1 - boxOf([polys[1]]).x0, y1: boxOf([polys[1]]).y1 - boxOf([polys[1]]).y0 }) : cutRects(polys).reduce((s, r) => s + rectArea(r), 0))).toBeCloseTo(area(polys), 6);
    }
  });
});

// a tiny evaluator for "3x − 2" and "x² + 9x + 14"
const ev = (s: string, x: number): number => new Function("x", `return ${s.replace(/−/g, "-").replace(/x²/g, "(x*x)").replace(/(\d)x/g, "$1*x")}`)(x);

describe("With Algebra", () => {
  it("Level 1: the answer is the sum of the labelled sides, for every x", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("algebraic", "level1");
      for (const x of [1, 2, 5, 9]) expect(q._diagram.edges.reduce((s, e) => s + ev(e.label, x), 0)).toBe(ev(q.answer, x));
      expect(q.answer).toMatch(/^(\d+x)( [+−] \d+)?$|^x( [+−] \d+)?$/);
    }
  });
  it("Level 2: x makes the sides add up to the stated perimeter, and every side is positive", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("algebraic", "level2");
      const x = Number(q.answer.replace("x = ", "")), P = Number(q._diagram.caption[0].match(/is (\d+) cm/)![1]);
      const sides = q._diagram.edges.map((e) => ev(e.label, x));
      expect(Number.isInteger(x)).toBe(true);
      expect(sides.every((s) => s > 0)).toBe(true);
      expect(sides.reduce((a, b) => a + b, 0)).toBe(P);
      if (sides.length === 3) { const [a, b, c] = sides; expect(a + b > c && a + c > b && b + c > a).toBe(true); }
    }
  });
  it("Level 3: an expanded area equals the product of the sides, and an L-shape's perimeter is the rectangle round it", () => {
    let l = 0, a = 0;
    for (let i = 0; i < N * 2; i++) {
      const q = gen("algebraic", "level3");
      const e = q._diagram.edges;
      for (const x of [1, 2, 3, 7]) {
        if (e.length === 6) { l++; expect(2 * (ev(e[0].label, x) + ev(e[5].label, x))).toBe(ev(q.answer, x)); }
        else if (q._diagram.helpers.length) { a++; expect(0.5 * Number(q._diagram.helpers[0].label) * ev(e[0].label, x)).toBe(ev(q.answer, x)); }
        else { a++; expect(ev(e[0].label, x) * ev(e[1].label, x)).toBe(ev(q.answer, x)); }
      }
    }
    expect(l).toBeGreaterThan(0); expect(a).toBeGreaterThan(0);
  });
});
