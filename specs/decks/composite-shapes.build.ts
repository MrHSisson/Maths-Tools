// Build script for the "Composite shapes" deck (plan: specs/decks/composite-shapes.md; Year 7, end of the area topic).
// Fully authored: no generator. Pictures are drawn by composite-shapes-art.ts and saved in the deck as images.
//   npm run deck -- looks specs/decks/composite-shapes.build.ts     the look card
//   npm run deck -- build specs/decks/composite-shapes.build.ts --replace
//   npm run deck -- review composite-shapes                         look at every contact sheet before showing the deck
import { Q, S, makeSlide, textEl, titleEls, LOOK } from "/src/decks/builder";
import { COL, drawArt, shoelace, toSrc, type Art, type P, type Piece } from "/specs/decks/composite-shapes-art";
import type { DeckDef, DeckElement, Slide } from "/src/decks/types";

const ID = "composite-shapes";
const B: P = [0, -1], R: P = [1, 0], L: P = [-1, 0], U: P = [0, 1];
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const area = (n: number) => `${+n.toFixed(2)}`;
const rect = (x0: number, y0: number, x1: number, y1: number): P[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ---------- a worked question: the picture as given, the picture split, the working a line a click ----------
interface Q { id: string; set: string; prompt: string; given: Art; worked: Partial<Art>; pieces: Piece[]; steps: string[]; answer: number; brief?: string }
function check(q: Q) {
  const got = q.pieces.reduce((t, p) => t + (p.sign ?? 1) * shoelace(p.pts), 0);
  must(Math.abs(got - q.answer) < 1e-9, `${q.id}: the pieces give ${got}, the answer says ${q.answer}`);
  const outer = shoelace(q.given.outline) - (q.given.hole ? shoelace(q.given.hole) : 0);
  must(Math.abs(outer - q.answer) < 1e-9, `${q.id}: the outline gives ${outer}, the answer says ${q.answer}`);
}
let askCount = 0;
const ASKS: Record<string, string[]> = { "Work out the area of this shape.": ["Work out the area of this shape.", "Find the area of this shape.", "Calculate the area of this shape."], "Work out the shaded area.": ["Work out the shaded area.", "Find the shaded area.", "Calculate the shaded area."], "Work out the area of this trapezium.": ["Work out the area of this trapezium.", "Find the area of this trapezium.", "Calculate the area of this trapezium."] };
function questionSlide(q: Q): Slide {
  check(q);
  q = { ...q, prompt: ASKS[q.prompt]?.[askCount++ % 3] ?? q.prompt };
  const split: Art = { ...q.given, ...q.worked, dims: [...q.given.dims, ...(q.worked.dims ?? [])], dashed: [...(q.given.dashed ?? []), ...(q.worked.dashed ?? [])], texts: [...(q.given.texts ?? []), ...(q.worked.texts ?? [])], pieces: q.pieces.filter((p) => (p.sign ?? 1) > 0).map((p) => ({ pts: p.pts, fill: p.fill, name: p.name })) };
  const img = (art: Art, step?: number) => ({ kind: "image", x: 40, y: 110, w: 880, h: 700, src: toSrc(drawArt(art)), ...(step ? { step } : {}) }) as DeckElement;
  let y = 290;
  const lines = q.steps.map((t, i) => {
    const chars = t.replace(/\\[a-z]+|[${}]/g, "").length, n = Math.max(1, Math.ceil((chars * 40 * 0.5) / 580)), h = n * 58 + 30;
    const el = textEl(960, y, 600, h, t, 40, { step: i + 1, ...(i === q.steps.length - 1 ? { bold: true, colour: LOOK.green } : {}) });
    y += h + 14; return el;
  });
  return makeSlide(`cs-${q.id}`, q.set === "Model" ? "teach" : "practice", `${q.set} ${q.id.toUpperCase()}`, [
    textEl(960, 60, 600, 40, q.set === "Model" ? "MODEL" : q.id.toUpperCase().replace(/(\D)(\d)/, "$1 · $2"), 28, { bold: true, colour: LOOK.grey }),
    textEl(960, 110, 600, 150, q.prompt, 40, { bold: true }),
    img(q.given), img(split, 1), ...lines,
  ] as never, q.brief);
}

// ---------- shapes ----------
const apexH = (w: number, h: number, ah: number): Art["outline"] => [[0, 0], [w, 0], [w, h], [w / 2, h + ah], [0, h]];
/** A house: rectangle w × h with a triangle on top whose apex is `ah` above it. */
function house(id: string, set: string, w: number, h: number, ah: number, o: { slant?: string; total?: number; brief?: string } = {}): Q {
  const rectArea = w * h, tri = (w * ah) / 2;
  const total = o.total !== undefined;
  const dims: Art["dims"] = [{ a: [0, 0], b: [w, 0], label: `${w} cm`, side: B }];
  if (total) dims.push({ a: [w, 0], b: [w, h + ah], label: `${o.total} cm`, side: R, off: 70 }); else dims.push({ a: [w, 0], b: [w, h], label: `${h} cm`, side: R });
  dims.push({ a: [w / 2, h], b: [w / 2, h + ah], label: `${ah} cm`, side: R, off: 22 });
  if (o.slant) dims.push({ a: [0, h], b: [w / 2, h + ah], label: o.slant, side: [-0.7, 0.7], off: 30 });
  const given: Art = { outline: apexH(w, h, ah), dims, dashed: [[[w / 2, h], [w / 2, h + ah]], ...(total ? [[[w / 2, h + ah], [w, h + ah]] as [P, P]] : [])], right: [[[0, 0], [w, 0], [0, h]], [[w, 0], [0, 0], [w, h]], [[w / 2, h], [0, h], [w / 2, h + ah]]] };
  const worked: Partial<Art> = {
    dashed: [[[0, h], [w, h]]],
    dims: total ? [{ a: [0, 0], b: [0, h], label: `${h} cm`, side: L, off: 38 }] : [],
  };
  const steps = [
    ...(total ? [`Rectangle height: $${o.total} - ${ah} = ${h}$ cm`] : []),
    `A: rectangle  $${w} \\times ${h} = ${area(rectArea)}$ cm²`,
    `B: triangle  $\\tfrac12 \\times ${w} \\times ${ah} = ${area(tri)}$ cm²`,
    `Total: $${area(rectArea)} + ${area(tri)} = ${area(rectArea + tri)}$ cm²`,
  ];
  return { id, set, prompt: "Work out the area of this shape.", given, worked, steps, answer: rectArea + tri, brief: o.brief,
    pieces: [{ pts: rect(0, 0, w, h), fill: COL.rect, name: "A" }, { pts: [[0, h], [w, h], [w / 2, h + ah]], fill: COL.tri, name: "B", dx: -w * 0.22 }] };
}

// ---------- the sets (every answer is re-derived from its pieces by check()) ----------
const M1 = house("m1", "Model", 8, 3, 3, { brief: "Models splitting a house shape into a rectangle and a triangle, finding each area and adding." });
const A1 = house("a1", "Set A", 6, 4, 3, { brief: "Rectangle and triangle, every length given. Catches forgetting the half for a triangle." });
const A2 = house("a2", "Set A", 10, 6, 4, { brief: "As A1 with bigger numbers: checks the method is secure before anything changes." });
const A3: Q = (() => {
  const given: Art = { outline: [[0, 0], [8, 0], [11, 2.5], [8, 5], [0, 5]], dims: [{ a: [0, 0], b: [8, 0], label: "8 cm", side: B }, { a: [0, 0], b: [0, 5], label: "5 cm", side: L }, { a: [8, 2.5], b: [11, 2.5], label: "3 cm", side: U, off: 26 }],
    dashed: [[[8, 2.5], [11, 2.5]]], right: [[[0, 0], [8, 0], [0, 5]], [[0, 5], [0, 0], [8, 5]], [[8, 2.5], [8, 5], [11, 2.5]]] };
  return { id: "a3", set: "Set A", prompt: "Work out the area of this shape.", given, worked: { dashed: [[[8, 0], [8, 5]]], dims: [{ a: [8, 0], b: [8, 5], label: "5 cm", side: B, off: 0 }] },
    steps: ["A: rectangle  $8 \\times 5 = 40$ cm²", "B: triangle  base $5$, height $3$:  $\\tfrac12 \\times 5 \\times 3 = 7.5$ cm²", "Total: $40 + 7.5 = 47.5$ cm²"], answer: 47.5,
    brief: "The triangle sits beside the rectangle, not on top: its base is the side of the rectangle.",
    pieces: [{ pts: rect(0, 0, 8, 5), fill: COL.rect, name: "A" }, { pts: [[8, 0], [11, 2.5], [8, 5]], fill: COL.tri, name: "B", dy: -0.9 }] };
})();
const A4 = house("a4", "Set A", 12, 7, 8, { slant: "10 cm", brief: "A sloping side is marked as a distractor. The height is the dashed line at right angles to the base." });
const A5 = house("a5", "Set A", 7, 5, 3, { total: 8, brief: "The total height is given, so the rectangle's height must be found first (8 − 3)." });
const A6: Q = (() => {
  const given: Art = { outline: [[0, 0], [10, 0], [10, 12], [0, 8]], dims: [{ a: [0, 0], b: [10, 0], label: "10 cm", side: B }, { a: [0, 0], b: [0, 8], label: "8 cm", side: L }, { a: [10, 0], b: [10, 12], label: "12 cm", side: R }],
    right: [[[0, 0], [10, 0], [0, 8]], [[10, 0], [0, 0], [10, 12]]] };
  return { id: "a6", set: "Set A", prompt: "Work out the area of this shape.", given, worked: { dashed: [[[0, 8], [10, 8]]], dims: [{ a: [10, 8], b: [10, 12], label: "4 cm", side: L, off: 36 }] },
    steps: ["Height of triangle: $12 - 8 = 4$ cm", "A: rectangle  $10 \\times 8 = 80$ cm²", "B: triangle  $\\tfrac12 \\times 10 \\times 4 = 20$ cm²", "Total: $80 + 20 = 100$ cm²"], answer: 100,
    brief: "A missing length again, but no triangle is drawn: the learner has to see the rectangle and the triangle. Catches using 12 as the rectangle's height.",
    pieces: [{ pts: rect(0, 0, 10, 8), fill: COL.rect, name: "A" }, { pts: [[0, 8], [10, 8], [10, 12]], fill: COL.tri, name: "B" }] };
})();

/** A shaded rectangle with a cut-out; the working subtracts. */
function shaded(id: string, set: string, outline: P[], hole: P[], dims: Art["dims"], dashed: [P, P][], right: [P, P, P][], steps: string[], answer: number, outer: number, brief: string, prompt = "Work out the shaded area."): Q {
  const given: Art = { outline, hole, base: COL.shade, dims, dashed, right };
  return { id, set, prompt, given, worked: { holeFill: COL.hole }, steps, answer, brief,
    pieces: [{ pts: outline, fill: COL.shade, name: undefined }, { pts: hole, fill: COL.hole, sign: -1 }] };
}
const M2 = shaded("m2", "Model", rect(0, 0, 9, 6), [[2.5, 1], [6.5, 1], [4.5, 4]],
  [{ a: [0, 0], b: [9, 0], label: "9 cm", side: B }, { a: [9, 0], b: [9, 6], label: "6 cm", side: R }, { a: [2.5, 1], b: [6.5, 1], label: "4 cm", side: B, off: 30 }, { a: [4.5, 1], b: [4.5, 4], label: "3 cm", side: R, off: 24 }],
  [[[4.5, 1], [4.5, 4]]], [[[0, 0], [9, 0], [0, 6]], [[4.5, 1], [6.5, 1], [4.5, 4]]],
  ["Rectangle: $9 \\times 6 = 54$ cm²", "Hole: $\\tfrac12 \\times 4 \\times 3 = 6$ cm²", "Shaded: $54 - 6 = 48$ cm²"], 48, 54,
  "Models whole minus cut-out for a shaded shape: the hole is a triangle.");
const B1 = shaded("b1", "Set B", rect(0, 0, 13, 7.5), [[2, 1.5], [11, 1.5], [6.5, 6.5]],
  [{ a: [0, 7.5], b: [13, 7.5], label: "13 cm", side: U }, { a: [13, 0], b: [13, 7.5], label: "7.5 cm", side: R }, { a: [2, 1.5], b: [11, 1.5], label: "9 cm", side: B, off: 30 }, { a: [6.5, 1.5], b: [6.5, 6.5], label: "5 cm", side: R, off: 24 }],
  [[[6.5, 1.5], [6.5, 6.5]]], [[[0, 0], [13, 0], [0, 7.5]]],
  ["Rectangle: $13 \\times 7.5 = 97.5$ cm²", "Hole: $\\tfrac12 \\times 9 \\times 5 = 22.5$ cm²", "Shaded: $97.5 - 22.5 = 75$ cm²"], 75, 97.5,
  "First subtract: a triangular hole in a rectangle. Catches adding the two areas.");
const B2 = shaded("b2", "Set B", rect(0, 0, 20, 12), rect(7.5, 3.5, 12.5, 8.5),
  [{ a: [0, 12], b: [20, 12], label: "20 cm", side: U }, { a: [20, 0], b: [20, 12], label: "12 cm", side: R }, { a: [7.5, 3.5], b: [12.5, 3.5], label: "5 cm", side: B, off: 30 }, { a: [12.5, 3.5], b: [12.5, 8.5], label: "5 cm", side: R, off: 24 }],
  [], [[[0, 0], [20, 0], [0, 12]]],
  ["Rectangle: $20 \\times 12 = 240$ cm²", "Hole: $5 \\times 5 = 25$ cm²", "Shaded: $240 - 25 = 215$ cm²"], 215, 240,
  "The simplest subtraction: a square hole, no triangle. Builds the habit of whole minus hole.");
const B3: Q = (() => {
  const outline: P[] = [[0, 0], [18, 0], [18, 10], [13, 10], [9, 4], [5, 10], [0, 10]];
  const notch: P[] = [[5, 10], [13, 10], [9, 4]];
  const given: Art = { outline, base: COL.shade, dims: [{ a: [0, 0], b: [18, 0], label: "18 cm", side: B }, { a: [18, 0], b: [18, 10], label: "10 cm", side: R }, { a: [5, 10], b: [13, 10], label: "8 cm", side: U }, { a: [9, 4], b: [9, 10], label: "6 cm", side: R, off: 26 }],
    dashed: [[[9, 4], [9, 10]], [[5, 10], [13, 10]]], right: [[[0, 0], [18, 0], [0, 10]], [[18, 0], [0, 0], [18, 10]]] };
  return { id: "b3", set: "Set B", prompt: "Work out the area of this shape.", given, worked: { pieces: undefined, texts: [] },
    steps: ["Rectangle: $18 \\times 10 = 180$ cm²", "Notch: $\\tfrac12 \\times 8 \\times 6 = 24$ cm²", "Area: $180 - 24 = 156$ cm²"], answer: 156,
    brief: "A notch cut from an edge, so it looks like an add question. Catches treating the notch as a rectangle (8 × 6).",
    pieces: [{ pts: rect(0, 0, 18, 10), fill: COL.shade, name: undefined }, { pts: notch, fill: COL.hole, sign: -1 }] };
})();
const B4 = shaded("b4", "Set B", [[0, 0], [14.4, 0], [0, 12]], rect(3, 2, 6, 5.5),
  [{ a: [0, 0], b: [14.4, 0], label: "14.4 cm", side: B }, { a: [0, 0], b: [0, 12], label: "12 cm", side: L }, { a: [3, 2], b: [6, 2], label: "3 cm", side: B, off: 30 }, { a: [6, 2], b: [6, 5.5], label: "3.5 cm", side: R, off: 24 }],
  [], [[[0, 0], [14.4, 0], [0, 12]]],
  ["Triangle: $\\tfrac12 \\times 14.4 \\times 12 = 86.4$ cm²", "Hole: $3 \\times 3.5 = 10.5$ cm²", "Shaded: $86.4 - 10.5 = 75.9$ cm²"], 75.9, 86.4,
  "Decimals, and the whole shape is now a triangle with a rectangular hole. Catches adding.");

// parallelograms: a rectangle under a parallelogram, a parallelogram with a hole, a triangle on top
function paraOver(id: string, set: string, base: number, rectH: number, ph: number, off: number, o: { slant?: string; tri?: number; brief: string; hole?: [number, number, number, number]; model?: boolean }): Q {
  const para: P[] = [[0, rectH], [base, rectH], [base + off, rectH + ph], [off, rectH + ph]];
  const lower = rectH > 0;
  const outline: P[] = lower ? [[0, 0], [base, 0], [base, rectH], [base + off, rectH + ph], [off, rectH + ph], [0, rectH]] : [[0, 0], [base, 0], [base + off, ph], [off, ph]];
  const top = rectH + ph, tri = o.tri ?? 0;
  const dims: Art["dims"] = [{ a: [0, 0], b: [base, 0], label: `${base} cm`, side: B }];
  if (lower) dims.push({ a: [base, 0], b: [base, rectH], label: `${rectH} cm`, side: R });
  const hy = lower ? rectH : 0;
  dims.push({ a: [off, hy], b: [off, hy + ph], label: `${ph} cm`, side: R, off: 24 });
  if (o.slant) dims.push({ a: [base, hy], b: [base + off, hy + ph], label: o.slant, side: [0.8, -0.6], off: 28 });
  const dashed: [P, P][] = [[[off, hy], [off, hy + ph]]];
  const parts: Piece[] = [];
  let area = 0, steps: string[] = [];
  if (lower) { parts.push({ pts: rect(0, 0, base, rectH), fill: COL.rect, name: "A" }); area += base * rectH; steps.push(`A: rectangle  $${base} \\times ${rectH} = ${base * rectH}$ cm²`); }
  parts.push({ pts: para, fill: COL.para, name: lower ? "B" : undefined, dx: 1.5 }); area += base * ph;
  if (lower) steps.push(`B: parallelogram  $${base} \\times ${ph} = ${base * ph}$ cm²`);
  const ol = [...outline];
  let hole: P[] | undefined;
  if (tri) {
    const ap: P = [(off + base + off) / 2, top + tri];
    ol.splice(ol.findIndex((p) => p[0] === base + off && p[1] === top) + 1, 0, ap);
    parts.push({ pts: [[off, top], [base + off, top], ap], fill: COL.tri, name: "B" }); area += (base * tri) / 2;
    dims.push({ a: [ap[0], top], b: ap, label: `${tri} cm`, side: R, off: 22 });
    dashed.push([[ap[0], top], ap]);
  }
  if (o.hole) {
    const [x0, y0, hw, hh] = o.hole; hole = rect(x0, y0, x0 + hw, y0 + hh); area -= hw * hh;
    dims.push({ a: [x0, y0], b: [x0 + hw, y0], label: `${hw} cm`, side: B, off: 30 }, { a: [x0 + hw, y0], b: [x0 + hw, y0 + hh], label: `${hh} cm`, side: R, off: 22 });
  }
  const finalOutline = tri ? ol : outline;
  const given: Art = { outline: finalOutline, hole, base: o.hole ? COL.shade : COL.plain, dims, dashed: dashed.slice(0, tri ? 2 : 1), right: [[[off, hy], [off + 1, hy], [off, hy + 1]]] };
  let st: string[];
  if (o.hole) st = [`Parallelogram: $${base} \\times ${ph} = ${base * ph}$ cm²`, `Hole: $${o.hole[2]} \\times ${o.hole[3]} = ${o.hole[2] * o.hole[3]}$ cm²`, `Shaded: $${base * ph} - ${o.hole[2] * o.hole[3]} = ${area}$ cm²`];
  else if (tri) st = [`A: parallelogram  $${base} \\times ${ph} = ${base * ph}$ cm²`, `B: triangle  $\\tfrac12 \\times ${base} \\times ${tri} = ${(base * tri) / 2}$ cm²`, `Total: $${base * ph} + ${(base * tri) / 2} = ${area}$ cm²`];
  else st = [...steps, `Total: $${base * rectH} + ${base * ph} = ${area}$ cm²`];
  const pcs: Piece[] = o.hole ? [{ pts: para, fill: COL.shade }, { pts: hole!, fill: COL.hole, sign: -1 }] : parts;
  const q: Q = { id, set, prompt: o.hole ? "Work out the shaded area." : "Work out the area of this shape.", given, worked: o.hole ? { holeFill: COL.hole } : {}, steps: st, answer: area, brief: o.brief, pieces: pcs };
  if (o.hole) { q.given.outline = para.map((p) => [p[0], p[1] - hy] as P); q.given.dashed = [[[off, 0], [off, ph]]]; }
  return q;
}
const M3 = paraOver("m3", "Model", 7, 2, 3, 4, { slant: "5 cm", brief: "Models the parallelogram as a piece: its height is the perpendicular height, not the sloping side." });
const C1 = paraOver("c1", "Set C", 9, 3, 4, 3, { slant: "5 cm", brief: "Parallelogram on a rectangle. The sloping side (5) is marked: catches using it as the height." });
const C2 = paraOver("c2", "Set C", 12, 0, 7, 3, { hole: [5, 2, 4, 3], brief: "A rectangular hole in a parallelogram: whole minus hole again, with a new whole shape." });
const C3 = paraOver("c3", "Set C", 10, 0, 6, 3, { tri: 4, brief: "Two different formulas in one shape: parallelogram plus triangle. Catches forgetting the half." });

// trapezia: split into a rectangle and one or two triangles, then the formula agrees
interface Trap { id: string; set: string; bottom: number; top: number; h: number; iso: boolean; brief: string; rectAbove?: number; model?: boolean }
function trapezium(t: Trap): Q {
  const d = t.bottom - t.top, sp = t.iso ? d / 2 : d;
  const x0 = t.iso ? 0 : 0, tl: P = t.iso ? [sp, t.h] : [0, t.h], tr: P = [tl[0] + t.top, t.h];
  const base: P[] = [[0, 0], [t.bottom, 0], tr, tl];
  const dims: Art["dims"] = [{ a: [0, 0], b: [t.bottom, 0], label: `${t.bottom} cm`, side: B }, { a: tl, b: tr, label: `${t.top} cm`, side: U }];
  const dashed: [P, P][] = [];
  const right: [P, P, P][] = [];
  if (t.iso) { dims.push({ a: [sp, 0], b: [sp, t.h], label: `${t.h} cm`, side: R, off: 22 }); dashed.push([[sp, 0], [sp, t.h]]); right.push([[sp, 0], [0, 0], [sp, t.h]]); }
  else { dims.push({ a: [0, 0], b: [0, t.h], label: `${t.h} cm`, side: L }); right.push([[0, 0], [t.bottom, 0], [0, t.h]], [[0, t.h], [0, 0], tr]); }
  let pieces: Piece[], steps: string[], answer: number;
  const rectW = t.top, rectArea = rectW * t.h;
  if (t.iso) {
    const triA = (sp * t.h) / 2;
    pieces = [{ pts: rect(sp, 0, sp + rectW, t.h), fill: COL.rect, name: "A" }, { pts: [[0, 0], [sp, 0], [sp, t.h]], fill: COL.tri, name: "B" }, { pts: [[sp + rectW, 0], [t.bottom, 0], [sp + rectW, t.h]], fill: COL.tri, name: "C" }];
    steps = [`A: rectangle  $${rectW} \\times ${t.h} = ${rectArea}$ cm²`, `B and C: two triangles, base $${sp}$, height $${t.h}$:  $2 \\times \\tfrac12 \\times ${sp} \\times ${t.h} = ${area(2 * triA)}$ cm²`, `Total: $${rectArea} + ${area(2 * triA)} = ${area(rectArea + 2 * triA)}$ cm²`];
    answer = rectArea + 2 * triA;
  } else {
    const triA = (sp * t.h) / 2;
    pieces = [{ pts: rect(0, 0, rectW, t.h), fill: COL.rect, name: "A" }, { pts: [[rectW, 0], [t.bottom, 0], [rectW, t.h]], fill: COL.tri, name: "B" }];
    steps = [`Triangle base: $${t.bottom} - ${t.top} = ${area(sp)}$ cm`, `A: rectangle  $${t.top} \\times ${t.h} = ${rectArea}$ cm²`, `B: triangle  $\\tfrac12 \\times ${area(sp)} \\times ${t.h} = ${area(triA)}$ cm²`, `Total: $${rectArea} + ${area(triA)} = ${area(rectArea + triA)}$ cm²`];
    answer = rectArea + triA;
  }
  const formula = (t.top + t.bottom) * t.h / 2;
  must(Math.abs(formula - answer) < 1e-9, `${t.id}: the formula gives ${formula}, the split gives ${answer}`);
  void x0;
  const worked: Partial<Art> = { dashed: t.iso ? [[[sp + rectW, 0], [sp + rectW, t.h]]] : [[[rectW, 0], [rectW, t.h]]] };
  void base;
  return { id: t.id, set: t.set, prompt: "Work out the area of this trapezium.", given: { outline: base, dims, dashed, right }, worked, steps, answer, brief: t.brief, pieces };
}
const M4 = trapezium({ id: "m4", set: "Model", bottom: 9, top: 5, h: 4, iso: false, brief: "Models a trapezium as a rectangle and a triangle; the formula comes after, as a shortcut for the same thing." });
const D1 = trapezium({ id: "d1", set: "Set D", bottom: 11, top: 5, h: 4, iso: false, brief: "A trapezium with one right-angled side, split into a rectangle and a triangle. Catches adding the parallel sides without halving." });
const D2 = trapezium({ id: "d2", set: "Set D", bottom: 14, top: 8, h: 5, iso: true, brief: "A symmetrical trapezium: a rectangle and two triangles. Links the split to the formula." });
const D3 = trapezium({ id: "d3", set: "Set D", bottom: 9, top: 6.4, h: 5, iso: false, brief: "The same idea with a decimal side." });
const D4: Q = (() => {
  const outline: P[] = [[-4, 0], [10, 0], [6, 9], [6, 14], [0, 14], [0, 9]];
  const given: Art = { outline, dims: [{ a: [-4, 0], b: [10, 0], label: "14 cm", side: B }, { a: [0, 14], b: [6, 14], label: "6 cm", side: U }, { a: [6, 9], b: [6, 14], label: "5 cm", side: R, off: 30 }, { a: [0, 0], b: [0, 9], label: "9 cm", side: R, off: 30 }],
    dashed: [[[0, 0], [0, 9]], [[0, 9], [6, 9]]], right: [[[0, 0], [10, 0], [0, 9]], [[0, 9], [0, 0], [6, 9]]] };
  return { id: "d4", set: "Set D", prompt: "Work out the area of this shape.", given, worked: {},
    steps: ["A: rectangle  $6 \\times 5 = 30$ cm²", "B: trapezium  $\\tfrac12 \\times (6 + 14) \\times 9 = 90$ cm²", "Total: $30 + 90 = 120$ cm²"], answer: 120,
    brief: "A trapezium inside a composite shape. Catches not halving the sum of the parallel sides.",
    pieces: [{ pts: rect(0, 9, 6, 14), fill: COL.rect, name: "A" }, { pts: [[-4, 0], [10, 0], [6, 9], [0, 9]], fill: COL.trap, name: "B", dx: 2.5 }] };
})();

// ---------- the sheet of six, and the exit ticket ----------
const sheetArts: { art: Art; answer: string; pieces: Piece[]; total: number }[] = (() => {
  const items: Q[] = [
    house("k-a", "Book", 9, 5, 4),
    shaded("k-b", "Book", rect(0, 0, 14, 9), [[4, 2], [10, 2], [7, 6]],
      [{ a: [0, 9], b: [14, 9], label: "14 cm", side: U }, { a: [14, 0], b: [14, 9], label: "9 cm", side: R }, { a: [4, 2], b: [10, 2], label: "6 cm", side: B, off: 30 }, { a: [7, 2], b: [7, 6], label: "4 cm", side: R, off: 24 }], [[[7, 2], [7, 6]]], [], [], 114, 126, ""),
    paraOver("k-c", "Book", 11, 3, 6, 3, { brief: "" }),
    (() => { const w = 16, hh = 6, tb = 6, th = 5; const given: Art = { outline: [[0, 0], [w, 0], [w + th, hh / 2], [w, hh], [0, hh]], dims: [{ a: [0, 0], b: [w, 0], label: "16 cm", side: B }, { a: [0, 0], b: [0, hh], label: "6 cm", side: L }, { a: [w, hh / 2], b: [w + th, hh / 2], label: "5 cm", side: U, off: 22 }], dashed: [[[w, hh / 2], [w + th, hh / 2]]], right: [[[0, 0], [w, 0], [0, hh]], [[0, hh], [0, 0], [w, hh]]] };
      void tb; return { id: "k-d", set: "Book", prompt: "", given, worked: { dashed: [[[w, 0], [w, hh]]] }, steps: [], answer: 111, brief: "", pieces: [{ pts: rect(0, 0, w, hh), fill: COL.rect, name: "A" }, { pts: [[w, 0], [w + th, hh / 2], [w, hh]], fill: COL.tri, name: "B" }] } as Q; })(),
    (() => { const q = trapezium({ id: "k-e", set: "Book", bottom: 13, top: 7, h: 6, iso: true, brief: "" }); return q; })(),
    (() => { const given: Art = { outline: [[0, 0], [10, 0], [10, 4], [8, 9], [2, 9], [0, 4]], dims: [{ a: [0, 0], b: [10, 0], label: "10 cm", side: B }, { a: [10, 0], b: [10, 4], label: "4 cm", side: R }, { a: [2, 9], b: [8, 9], label: "6 cm", side: U }, { a: [9, 4], b: [9, 9], label: "5 cm", side: R, off: 30 }], dashed: [[[0, 4], [10, 4]], [[9, 4], [9, 9]]], right: [[[0, 0], [10, 0], [0, 4]], [[10, 0], [0, 0], [10, 4]]] };
      return { id: "k-f", set: "Book", prompt: "", given, worked: {}, steps: [], answer: 80, brief: "", pieces: [{ pts: rect(0, 0, 10, 4), fill: COL.rect, name: "A" }, { pts: [[0, 4], [10, 4], [8, 9], [2, 9]], fill: COL.trap, name: "B" }] } as Q; })(),
  ];
  const expected = [63, 114, 99, 111, 60, 80];
  return items.map((q, i) => {
    must(Math.abs(q.answer - expected[i]) < 1e-9, `book work (${"abcdef"[i]}): ${q.answer} is not ${expected[i]}`);
    check(q);
    const split: Art = { ...q.given, ...q.worked, dims: [...q.given.dims, ...(q.worked.dims ?? [])], dashed: [...(q.given.dashed ?? []), ...(q.worked.dashed ?? [])], pieces: q.pieces.filter((p) => (p.sign ?? 1) > 0 && p.name).map((p) => ({ pts: p.pts, fill: p.fill })) };
    return { art: q.given, answer: `${q.answer} cm²`, pieces: q.pieces, total: q.answer, split } as never;
  });
})();
function sheetSvg(answers: boolean): string {
  const cell = (i: number) => {
    const item = sheetArts[i] as unknown as { art: Art; split: Art; answer: string };
    const x = (i % 3) * 500, y = Math.floor(i / 3) * 380;
    const art = answers ? item.split : item.art;
    const inner = drawArt(art, 600, 410, 92).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    const label = `<text x="${x + 12}" y="${y + 34}" font-size="30" font-weight="700" fill="#0f172a" font-family="sans-serif">(${"abcdef"[i]})</text>`;
    const ans = answers ? `<text x="${x + 250}" y="${y + 368}" font-size="30" font-weight="700" fill="${LOOK.green}" text-anchor="middle" font-family="sans-serif">${item.answer}</text>` : "";
    return `<svg x="${x}" y="${y}" width="500" height="340" viewBox="0 0 600 410">${inner}</svg>${label}${ans}`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 760" width="1500" height="760"><rect width="1500" height="760" fill="#fff"/>${[0, 1, 2, 3, 4, 5].map(cell).join("")}</svg>`;
}
const bookSlide = (): Slide => makeSlide("cs-book", "practice", "Book work", [
  textEl(100, 14, 1400, 50, "Work out the area of each shape. Show your splitting.", 36, { bold: true }),
  { kind: "image", x: 50, y: 74, w: 1500, h: 760, src: toSrc(sheetSvg(false)) },
  { kind: "image", x: 50, y: 74, w: 1500, h: 760, src: toSrc(sheetSvg(true)), step: 1 },
] as never, "Six mixed shapes, (a) to (f), as on the reference sheet. (e) and (f) include a trapezium; any method is fine. Answers appear on a click.");

const E1 = house("e1", "Exit", 11, 4, 6);
const E2 = shaded("e2", "Exit", rect(0, 0, 17, 9), [[5, 1.5], [11, 1.5], [8, 8.5]],
  [{ a: [0, 9], b: [17, 9], label: "17 cm", side: U }, { a: [17, 0], b: [17, 9], label: "9 cm", side: R }, { a: [5, 1.5], b: [11, 1.5], label: "6 cm", side: B, off: 30 }, { a: [8, 1.5], b: [8, 8.5], label: "7 cm", side: R, off: 24 }], [[[8, 1.5], [8, 8.5]]], [], [], 132, 153, "");
must(E1.answer === 77 && E2.answer === 132, "the exit ticket answers are 77 and 132");
const exitSlide = (): Slide => makeSlide("cs-exit", "retrieval", "Exit ticket", [
  ...titleEls("Exit ticket", "Find each area. Then write how you chose between adding and subtracting."),
  { kind: "image", x: 40, y: 240, w: 760, h: 560, src: toSrc(drawArt(E1.given, 760, 560, 110)) },
  { kind: "image", x: 800, y: 240, w: 760, h: 560, src: toSrc(drawArt(E2.given, 760, 560, 110)) },
  textEl(40, 810, 760, 70, "$\\tfrac12 \\times 11 \\times 6 = 33$, so $44 + 33 = 77$ cm²", 36, { align: "center", bold: true, colour: LOOK.green, step: 1 }),
  textEl(800, 810, 760, 70, "$153 - 21 = 132$ cm²  (subtract the hole)", 36, { align: "center", bold: true, colour: LOOK.green, step: 1 }),
] as never, "Two shapes: one add, one subtract. The written part checks they can say why.");

// ---------- the discussion slides ----------
const houseBare = (): Art => ({ outline: apexH(6, 4, 3), dims: [], dashed: [], right: [] });
const discussSplit = (): Slide => makeSlide("cs-discuss-split", "discussion", "Discuss", [
  textEl(100, 60, 700, 50, "DISCUSS", 30, { bold: true, colour: "#be185d" }),
  textEl(100, 130, 700, 330, "This shape is not a rectangle, a triangle or a parallelogram. How could you find its area?", 48),
  textEl(100, 560, 700, 280, "Split it into shapes we know. Find each area, then add them.", 44, { bold: true, step: 2 }),
  { kind: "image", x: 800, y: 110, w: 740, h: 700, src: toSrc(drawArt(houseBare(), 740, 700, 110)) },
  { kind: "image", x: 800, y: 110, w: 740, h: 700, src: toSrc(drawArt({ ...houseBare(), pieces: [{ pts: rect(0, 0, 6, 4), fill: COL.rect, name: "A" }, { pts: [[0, 4], [6, 4], [3, 7]], fill: COL.tri, name: "B" }], dashed: [[[0, 4], [6, 4]]] }, 740, 700, 110)), step: 1 },
] as never, "Opens the lesson: the class finds that a rectangle and a triangle make the house.");
const trapPicture: Art = { outline: [[0, 0], [10, 0], [5, 12]], dims: [{ a: [0, 0], b: [10, 0], label: "10 cm", side: B }, { a: [10, 0], b: [5, 12], label: "13 cm", side: [0.9, 0.4], off: 40 }, { a: [5, 0], b: [5, 12], label: "12 cm", side: L, off: 36 }], dashed: [[[5, 0], [5, 12]]], right: [[[5, 0], [0, 0], [5, 12]]] };
const discussTrap = (): Slide => makeSlide("cs-discuss-trap", "discussion", "Discuss", [
  textEl(100, 60, 700, 50, "FIND THE MISTAKE", 30, { bold: true, colour: "#be185d" }),
  textEl(100, 130, 700, 330, "Sam says the area is $\\tfrac12 \\times 10 \\times 13 = 65$ cm². What went wrong?", 48),
  textEl(100, 540, 700, 140, "The height must be at right angles to the base. The sloping side is not the height.", 40, { bold: true, step: 1 }),
  textEl(100, 710, 700, 100, "Area $= \\tfrac12 \\times 10 \\times 12 = 60$ cm²", 44, { bold: true, colour: LOOK.green, step: 2 }),
  { kind: "image", x: 800, y: 110, w: 740, h: 700, src: toSrc(drawArt(trapPicture, 740, 700, 120)) },
] as never, "The sloping-side trap, named once for the whole lesson.");

// ---------- the deck ----------
const startItems = [
  Q.open("cs-s1", "perimeter-and-area", "level1", "A rectangle is $9$ cm by $4$ cm. What is its area?", "$36$ cm²"),
  Q.open("cs-s2", "perimeter-and-area", "level1", "A triangle has base $10$ cm and perpendicular height $6$ cm. What is its area?", "$30$ cm²"),
  Q.open("cs-s3", "perimeter-and-area", "level1", "A parallelogram has base $7$ cm, height $5$ cm and sloping side $6$ cm. What is its area?", "$35$ cm²"),
  Q.open("cs-s4", "perimeter-and-area", "level1", "A triangle has base $8$ cm, height $7$ cm and sloping side $9$ cm. What is its area?", "$28$ cm²"),
];

export default (): Omit<DeckDef, "toolPath"> => ({
  id: ID, title: "Composite shapes", tool: "perimeter-and-area", pitch: "middle",
  summary: "Find the area of a shape made from rectangles, triangles and parallelograms, by adding pieces or taking away a cut-out; trapezia as the stretch.",
  slides: [
    S.title("cs-title", "Composite shapes", "Area of shapes made from simpler shapes"),
    S.objective("cs-objective", "Work out the area of a shape made from simpler shapes.", ["Split a shape into rectangles, triangles and parallelograms", "Find a missing length before I calculate", "Add the areas, or subtract a cut-out"]),
    S.quick("cs-starter", "Quick recall", startItems, 2, "Areas of single shapes"),
    S.vocab("cs-vocab", [
      { term: "Composite shape", meaning: "A shape made by joining simpler shapes together." },
      { term: "Perpendicular height", meaning: "The height measured at right angles to the base, not along a sloping side." },
      { term: "Trapezium", meaning: "A quadrilateral with one pair of parallel sides." },
    ]),
    discussSplit(),
    S.divider("cs-div-add", "Adding areas", "Split the shape, find each area, add"),
    questionSlide(M1), questionSlide(A1), questionSlide(A2), questionSlide(A3), questionSlide(A4), questionSlide(A5), questionSlide(A6),
    discussTrap(),
    S.divider("cs-div-sub", "Subtracting a cut-out", "Whole shape, minus the hole"),
    questionSlide(M2), questionSlide(B1), questionSlide(B2), questionSlide(B3), questionSlide(B4),
    S.divider("cs-div-para", "Parallelograms", "Use the perpendicular height"),
    questionSlide(M3), questionSlide(C1), questionSlide(C2), questionSlide(C3),
    S.divider("cs-div-trap", "Stretch: trapezia", "A trapezium is a rectangle and triangles"),
    questionSlide(M4), questionSlide(D1), questionSlide(D2), questionSlide(D3), questionSlide(D4),
    bookSlide(),
    exitSlide(),
    S.summary("cs-summary", "Summary", ["Split the shape into rectangles, triangles and parallelograms.", "Find any missing length first.", "Add the pieces, or take the hole away.", "The height is always at right angles to the base."]),
  ],
});
