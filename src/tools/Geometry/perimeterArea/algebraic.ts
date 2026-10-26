// Perimeter & Area — With Algebra: sides written as expressions in x. The picture is a schematic (rough proportions only).
import { mStep, randInt as ri, pickActive, resolveMultiSelectValues, type DifficultyLevel } from "../../../shared";
import type { Pt } from "../../../shared/shapes/model";
import type { DEdge, DHelper, Drawing } from "../../../shared/shapes/drawing";
import { chance, pickOne, type Beat, type Built } from "./build";
import { ALG_SHAPES, ALG_TYPES } from "./pools";

/** kx + c */
interface Lin { k: number; c: number }
const lin = (k: number, c: number): Lin => ({ k, c });
const plus = (...xs: Lin[]): Lin => ({ k: xs.reduce((s, x) => s + x.k, 0), c: xs.reduce((s, x) => s + x.c, 0) });
const times = (m: number, a: Lin): Lin => ({ k: m * a.k, c: m * a.c });
const at = (a: Lin, x: number) => a.k * x + a.c;
/** `3x - 2`, written with a real minus for a label and a plain one for KaTeX. */
const show = (a: Lin, tex = false): string => {
  const minus = tex ? "-" : "−";
  const x = a.k === 0 ? "" : `${a.k === 1 ? "" : a.k}x`;
  if (!x) return a.c < 0 ? `${minus}${-a.c}` : `${a.c}`;
  return a.c === 0 ? x : `${x} ${a.c > 0 ? "+" : minus} ${Math.abs(a.c)}`;
};
const paren = (a: Lin, tex = true) => (a.k !== 0 && a.c !== 0 ? `(${show(a, tex)})` : show(a, tex));

/** An expression for a side that stays positive for every whole x from 1. */
const side = (): Lin => {
  const k = ri(1, 3);
  const cs = k === 1 ? [0, 1, 2, 3, 4, 5, 6] : k === 2 ? [-1, 0, 1, 2, 3, 4, 5, 6] : [-2, -1, 0, 1, 2, 3, 4, 5, 6];
  return lin(k, pickOne(cs));
};
const same = (a: Lin, b: Lin) => a.k === b.k && a.c === b.c;
const differentSide = (than: Lin[]): Lin => { for (let i = 0; i < 50; i++) { const s = side(); if (!than.some((t) => same(s, t))) return s; } return lin(2, 1); };

const sq = (a: number, b: number, c: number): string => {
  const t = (n: number, v: string, first: boolean) => (n === 0 ? "" : `${first ? (n < 0 ? "−" : "") : n < 0 ? " − " : " + "}${Math.abs(n) === 1 && v ? "" : Math.abs(n)}${v}`);
  return t(a, "x²", true) + t(b, "x", !a) + t(c, "", !a && !b);
};
const sqTex = (a: number, b: number, c: number): string => sq(a, b, c).replace(/−/g, "-").replace(/x²/g, "x^2");

const edge = (a: Pt, b: Pt, label: string, kind: DEdge["kind"] = "plain", value?: string, ticks?: number): DEdge => ({ a, b, label, kind, ...(value ? { value } : {}), ...(ticks ? { ticks } : {}) });

// schematic outlines
const RECT: Pt[] = [[0, 0], [6, 0], [6, 4], [0, 4]];
const SQUARE: Pt[] = [[0, 0], [5, 0], [5, 5], [0, 5]];
const TRI: Pt[] = [[0, 0], [6, 0], [2.4, 4]];
const edgesOf = (pts: Pt[], labels: string[], ticks = 0): DEdge[] => pts.map((p, i) => edge(p, pts[(i + 1) % pts.length], labels[i], "plain", undefined, ticks));

/** Perimeter of a rectangle, triangle or square from its side expressions. */
function sidesOf(shape: string): Lin[] {
  if (shape === "square") return [side()];
  if (shape === "triangle") { const a = side(), b = differentSide([a]); return [a, b, differentSide([a, b])]; }
  const a = side(); return [a, differentSide([a])];
}
const perimeterOfShape = (shape: string, s: Lin[]): { total: Lin; all: Lin[] } => {
  const all = shape === "square" ? [s[0], s[0], s[0], s[0]] : shape === "triangle" ? s : [s[0], s[1], s[0], s[1]];
  return { total: plus(...all), all };
};
const outline = (shape: string): Pt[] => (shape === "triangle" ? TRI : shape === "square" ? SQUARE : RECT);
const labelsFor = (all: Lin[]): string[] => all.map((a) => show(a));

/** The terms of a sum, written out un-collected: "x + 2x + x + 2x + 3 + 3". */
const uncollected = (all: Lin[]): string => {
  const xs = all.filter((a) => a.k !== 0).map((a) => `${a.k === 1 ? "" : a.k}x`);
  const cs = all.filter((a) => a.c !== 0).map((a) => a.c);
  return xs.join(" + ") + cs.map((c, i) => (xs.length === 0 && i === 0 ? `${c}` : c > 0 ? ` + ${c}` : ` - ${-c}`)).join("");
};

function level1(msv: Record<string, boolean>): Built {
  const v = resolveMultiSelectValues([ALG_SHAPES], msv);
  const shape = pickActive(v, ALG_SHAPES.options);
  const s = sidesOf(shape), { total, all } = perimeterOfShape(shape, s);
  const sumFrags = all.map((a, i) => `${i ? "+ " : ""}${paren(a)}`);
  const beats: Beat[] = [
    { step: mStep(shape === "square" ? "A square has four equal sides, so add four of them:" : "Add all the sides:", sumFrags), focus: { edges: all.map((_, i) => i) } },
    { step: mStep("Collect the x terms and the numbers:", [uncollected(all), `= ${show(total, true)}`]), focus: { edges: all.map((_, i) => i) } },
  ];
  const drawing: Drawing = {
    polys: [outline(shape)], edges: edgesOf(outline(shape), labelsFor(all), shape === "square" ? 1 : 0), helpers: [], corners: [], regions: [],
    caption: ["All lengths are in cm.", "Write the perimeter in its simplest form."], answerLine: `Perimeter = ${show(total)}`,
  };
  return { tool: "algebraic", level: "level1", key: `algebraic-1-${shape}-${all.map((a) => show(a)).join("|")}`, drawing, answer: show(total), answerLatex: show(total, true), beats };
}

function level2(msv: Record<string, boolean>): Built {
  const v = resolveMultiSelectValues([ALG_SHAPES], msv);
  const shape = pickActive(v, ALG_SHAPES.options);
  for (let guard = 0; guard < 200; guard++) {
    const x = ri(2, 9), s = sidesOf(shape), { total, all } = perimeterOfShape(shape, s);
    const lengths = s.map((a) => at(a, x)), P = at(total, x);
    if (total.c === 0 && chance(0.5)) continue;                              // keep a number in the equation most of the time
    if (lengths.some((n) => n < 1) || P > 80) continue;
    if (shape === "triangle" && (lengths[0] + lengths[1] <= lengths[2] || lengths[0] + lengths[2] <= lengths[1] || lengths[1] + lengths[2] <= lengths[0])) continue;
    const { k, c } = total;
    const written = shape === "square" ? `4(${show(s[0], true)})` : shape === "triangle" ? s.map((a, i) => `${i ? "+ " : ""}(${show(a, true)})`).join(" ") : `2(${show(s[0], true)}) + 2(${show(s[1], true)})`;
    const beats: Beat[] = [
      { step: mStep("Write the perimeter as an expression:", [written, `= ${show(total, true)}`]), focus: { edges: all.map((_, i) => i) } },
      { step: mStep("It equals the perimeter:", [`${show(total, true)} = ${P}`]) },
    ];
    if (c !== 0) beats.push({ step: mStep(c > 0 ? "Take away the number from both sides:" : "Add the number to both sides:", [`${k}x = ${P} ${c > 0 ? "-" : "+"} ${Math.abs(c)}`, `= ${P - c}`]) });
    beats.push({ step: mStep(`Divide both sides by ${k}:`, [`x = ${P - c} \\div ${k}`, `= ${x}`]) });
    const drawing: Drawing = {
      polys: [outline(shape)], edges: edgesOf(outline(shape), labelsFor(all), shape === "square" ? 1 : 0), helpers: [], corners: [], regions: [],
      caption: [`The perimeter is ${P} cm.`, "Find the value of x."], answerLine: `x = ${x}`,
    };
    return { tool: "algebraic", level: "level2", key: `algebraic-2-${shape}-${all.map((a) => show(a)).join("|")}-${P}`, drawing, answer: `x = ${x}`, answerLatex: `x = ${x}`, beats };
  }
  return level1(msv);
}

function level3(msv: Record<string, boolean>): Built {
  const v = resolveMultiSelectValues([ALG_TYPES], msv);
  const type = pickActive(v, ALG_TYPES.options);
  if (type === "lShapePerimeter") {
    const a = ri(1, 3), m = ri(1, 3), b = ri(2, 4);
    const w1 = lin(1, a), w2 = lin(m, 0), Wd = plus(w1, w2), h = lin(1, 0), Hd = lin(1, b);
    const X = 4, Wv = at(Wd, X), w1v = at(w1, X), hv = at(h, X), Hv = at(Hd, X);
    const pts: Pt[] = [[0, 0], [Wv, 0], [Wv, hv], [w1v, hv], [w1v, Hv], [0, Hv]];
    const edges: DEdge[] = [
      edge(pts[0], pts[1], show(Wd)), edge(pts[1], pts[2], show(h)),
      edge(pts[2], pts[3], "", "missing", show(w2)), edge(pts[3], pts[4], "", "missing", show(lin(0, b))),
      edge(pts[4], pts[5], show(w1)), edge(pts[5], pts[0], show(Hd)),
    ];
    const total = times(2, plus(Wd, Hd));
    const beats: Beat[] = [{
      step: mStep("There is no notch, so the perimeter is the same as the rectangle round it, 2 × (width + height):", [`2(${show(Wd, true)} + ${show(Hd, true)})`, `= 2(${show(plus(Wd, Hd), true)})`, `= ${show(total, true)}`]),
      focus: { edges: [0, 1, 2, 3, 4, 5] },
    }];
    const drawing: Drawing = { polys: [pts], edges, helpers: [], corners: [], regions: [], caption: ["All lengths are in cm.", "Write the perimeter in its simplest form."], answerLine: `Perimeter = ${show(total)}` };
    return { tool: "algebraic", level: "level3", key: `algebraic-3-L-${show(Wd)}|${show(Hd)}|${show(w1)}|${show(h)}`, drawing, answer: show(total), answerLatex: show(total, true), beats };
  }
  const form = pickOne(["x(x+a)", "(x+a)(x+b)", "triangle"]);
  const a = ri(2, 7);
  let b = ri(2, 7); while (b === a) b = ri(2, 7);
  const helpers: DHelper[] = [];
  let edges: DEdge[], pts: Pt[], beats: Beat[], ans: string, tex: string, key: string;
  if (form === "triangle") {
    const hh = pickOne([4, 6, 8, 10]), p = hh / 2;
    pts = TRI;
    edges = edgesOf(TRI, [show(lin(1, a)), "", ""]);
    helpers.push({ id: "h", a: [2.4, 0], b: [2.4, 4], label: `${hh}`, kind: "height" });
    ans = sq(0, p, p * a); tex = sqTex(0, p, p * a);
    beats = [{ step: mStep("Area = ½ × base × height:", [`\\tfrac{1}{2} \\times ${hh} \\times (x + ${a})`, `= ${p}(x + ${a})`, `= ${tex}`]), focus: { edges: [0], helpers: ["h"] } }];
    key = `algebraic-3-tri-${a}-${hh}`;
  } else {
    pts = RECT;
    const s1 = form === "x(x+a)" ? lin(1, 0) : lin(1, a), s2 = form === "x(x+a)" ? lin(1, a) : lin(1, b);
    edges = edgesOf(RECT, [show(s1), show(s2), show(s1), show(s2)]);
    const [qa, qb, qc] = form === "x(x+a)" ? [1, a, 0] : [1, a + b, a * b];
    ans = sq(qa, qb, qc); tex = sqTex(qa, qb, qc);
    beats = [{
      step: mStep("Area = length × width:", form === "x(x+a)"
        ? [`x(x + ${a})`, `= ${tex}`]
        : [`(x + ${a})(x + ${b})`, `= x^2 + ${b}x + ${a}x + ${a * b}`, `= ${tex}`]),
      focus: { edges: [0, 1] },
    }];
    key = `algebraic-3-rect-${form}-${a}-${b}`;
  }
  const drawing: Drawing = { polys: [pts], edges, helpers, corners: form === "triangle" ? [[[6, 0], [2.4, 0], [2.4, 4]]] : [], regions: [], caption: ["All lengths are in cm.", "Write the area in its simplest form."], answerLine: `Area = ${ans}` };
  return { tool: "algebraic", level: "level3", key, drawing, answer: ans, answerLatex: tex, beats };
}

export function genAlgebraic(level: DifficultyLevel, msv: Record<string, boolean>): Built {
  return level === "level1" ? level1(msv) : level === "level2" ? level2(msv) : level3(msv);
}
