// Build script for the "Composite shapes" deck (plan: specs/decks/composite-shapes.md; Year 7, end of the area topic, one lesson).
// Fully authored: no generator. Pictures are drawn by composite-shapes-art.ts and saved in the deck as images.
//   npm run deck -- looks specs/decks/composite-shapes.build.ts     the look card
//   npm run deck -- build specs/decks/composite-shapes.build.ts --replace
//   npm run deck -- review composite-shapes                         look at every contact sheet before showing the deck
import { Q, S, makeSlide, textEl, titleEls, LOOK } from "/src/decks/builder";
import { COL, drawArt, shoelace, toSrc, type Art, type P, type Piece } from "/specs/decks/composite-shapes-art";
import type { PictureSheetItem } from "/src/decks/pictureSheet";
import type { DeckDef, DeckElement, Slide } from "/src/decks/types";

const ID = "composite-shapes";
const B: P = [0, -1], R: P = [1, 0], L: P = [-1, 0], U: P = [0, 1];
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const area = (n: number) => `${+n.toFixed(2)}`;
const rect = (x0: number, y0: number, x1: number, y1: number): P[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ---------- a worked question: the picture as given, the picture split, the working a line a click ----------
interface Q { id: string; set: string; prompt: string; given: Art; worked: Partial<Art>; pieces: Piece[]; steps: string[]; answer: number; brief?: string }
/** The answer is each piece's area added (or taken away) and the outline's own area; no question has more than one decimal place in any area, or
 *  more than one decimal length (so two decimals are never multiplied together). */
function check(q: Q) {
  const got = q.pieces.reduce((t, p) => t + (p.sign ?? 1) * shoelace(p.pts), 0);
  must(Math.abs(got - q.answer) < 1e-9, `${q.id}: the pieces give ${got}, the answer says ${q.answer}`);
  const outer = shoelace(q.given.outline) - (q.given.hole ? shoelace(q.given.hole) : 0);
  must(Math.abs(outer - q.answer) < 1e-9, `${q.id}: the outline gives ${outer}, the answer says ${q.answer}`);
  const labels = [...q.given.dims, ...(q.worked.dims ?? [])].map((d) => Number(d.label.replace(" cm", "")));
  must(labels.filter((n) => !Number.isInteger(n)).length <= 1, `${q.id}: more than one decimal length`);
  must(labels.every((n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9), `${q.id}: a length has more than one decimal place`);
  for (const p of q.pieces) { const a = shoelace(p.pts); must(Math.abs(a * 10 - Math.round(a * 10)) < 1e-9, `${q.id}: a piece area ${a} has more than one decimal place`); }
}
/** The slide's working in plain text, for the printed sheet. */
const plain = (t: string) => t.replace(/\$/g, "").replace(/\\tfrac12/g, "½").replace(/\\times/g, "×").replace(/\\ /g, " ").replace(/ - /g, " − ");
const splitArt = (q: Q): Art => ({ ...q.given, ...q.worked, dims: [...q.given.dims, ...(q.worked.dims ?? [])], dashed: [...(q.given.dashed ?? []), ...(q.worked.dashed ?? [])], texts: [...(q.given.texts ?? []), ...(q.worked.texts ?? [])], pieces: q.pieces.filter((p) => (p.sign ?? 1) > 0).map((p) => ({ pts: p.pts, fill: p.fill, name: p.name, dx: p.dx, dy: p.dy })) });

let askCount = 0;
const ASKS: Record<string, string[]> = { "Work out the area of this shape.": ["Work out the area of this shape.", "Find the area of this shape.", "Calculate the area of this shape."], "Work out the shaded area.": ["Work out the shaded area.", "Find the shaded area.", "Calculate the shaded area."], "Work out the area of this trapezium.": ["Work out the area of this trapezium.", "Find the area of this trapezium.", "Calculate the area of this trapezium."] };
function questionSlide(q: Q): Slide {
  check(q);
  q = { ...q, prompt: ASKS[q.prompt]?.[askCount++ % 3] ?? q.prompt };
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
    img(q.given), img(splitArt(q), 1), ...lines,
  ] as never, q.brief);
}

// ---------- shapes ----------
const apexH = (w: number, h: number, ah: number): Art["outline"] => [[0, 0], [w, 0], [w, h], [w / 2, h + ah], [0, h]];
/** A house: a rectangle (wall height `h`) with a triangle on top. The picture gives the wall height and the total height; the triangle's height
 *  (`ah`, the difference) is found in the working. */
function house(id: string, set: string, w: number, h: number, ah: number, o: { slant?: string; brief?: string } = {}): Q {
  const rectArea = w * h, tri = (w * ah) / 2, total = h + ah;
  const dims: Art["dims"] = [{ a: [0, 0], b: [w, 0], label: `${w} cm`, side: B }, { a: [w, 0], b: [w, h], label: `${h} cm`, side: R }, { a: [0, 0], b: [0, total], label: `${total} cm`, side: L }];
  if (o.slant) dims.push({ a: [w, h], b: [w / 2, total], label: o.slant, side: [0.7, 0.7], off: 30 });
  const given: Art = { outline: apexH(w, h, ah), dims, dashed: [[[w / 2, total], [0, total]]], right: [[[0, 0], [w, 0], [0, h]], [[w, 0], [0, 0], [w, h]]] };
  const worked: Partial<Art> = { dashed: [[[0, h], [w, h]], [[w / 2, h], [w / 2, total]]], dims: [{ a: [w / 2, h], b: [w / 2, total], label: `${ah} cm`, side: R, off: 22 }] };
  const steps = [
    `Triangle height: $${total} - ${h} = ${ah}$ cm`,
    `A: rectangle  $${w} \\times ${h} = ${area(rectArea)}$ cm²`,
    `B: triangle  $\\tfrac12 \\times ${w} \\times ${ah} = ${area(tri)}$ cm²`,
    `Total: $${area(rectArea)} + ${area(tri)} = ${area(rectArea + tri)}$ cm²`,
  ];
  return { id, set, prompt: "Work out the area of this shape.", given, worked, steps, answer: rectArea + tri, brief: o.brief,
    pieces: [{ pts: rect(0, 0, w, h), fill: COL.rect, name: "A" }, { pts: [[0, h], [w, h], [w / 2, total]], fill: COL.tri, name: "B", dx: -w * 0.22 }] };
}
/** A rectangle (width `w`, height `h`) with a triangle beside it on the right. The picture gives the rectangle's width and the total width; the
 *  triangle's height (`th`, the difference) is found in the working. Its base is the rectangle's side (h). */
function beside(id: string, set: string, w: number, h: number, th: number, brief: string): Q {
  const total = w + th;
  const given: Art = { outline: [[0, 0], [w, 0], [total, h / 2], [w, h], [0, h]], dims: [{ a: [0, 0], b: [total, 0], label: `${total} cm`, side: B }, { a: [0, h], b: [w, h], label: `${w} cm`, side: U }, { a: [0, 0], b: [0, h], label: `${h} cm`, side: L }],
    dashed: [[[total, h / 2], [total, 0]]], right: [[[0, 0], [w, 0], [0, h]], [[0, h], [0, 0], [w, h]]] };
  const ra = w * h, ta = (h * th) / 2;
  return { id, set, prompt: "Work out the area of this shape.", given, worked: { dashed: [[[w, 0], [w, h]], [[w, h / 2], [total, h / 2]]], dims: [{ a: [w, h / 2], b: [total, h / 2], label: `${th} cm`, side: U, off: 26 }] }, brief, answer: ra + ta,
    steps: [`Triangle height: $${total} - ${w} = ${th}$ cm`, `A: rectangle  $${w} \\times ${h} = ${ra}$ cm²`, `B: triangle  base $${h}$, height $${th}$:  $\\tfrac12 \\times ${h} \\times ${th} = ${area(ta)}$ cm²`, `Total: $${ra} + ${area(ta)} = ${area(ra + ta)}$ cm²`],
    pieces: [{ pts: rect(0, 0, w, h), fill: COL.rect, name: "A" }, { pts: [[w, 0], [total, h / 2], [w, h]], fill: COL.tri, name: "B", dx: -0.25, dy: -1.4 }] };
}
/** A bowtie: a rectangle (width `w`, height `h`) with an identical triangle on each side (base `h`, height `th`). The picture gives the rectangle's
 *  width and the total width; each triangle's height (the difference, halved) is found in the working. The two split lines are drawn. */
function bowtie(id: string, set: string, w: number, h: number, th: number, o: { slant?: string; brief?: string } = {}): Q {
  const total = w + 2 * th, ra = w * h, ta = (h * th) / 2;
  const dims: Art["dims"] = [{ a: [0, 0], b: [total, 0], label: `${total} cm`, side: B }, { a: [th, h], b: [th + w, h], label: `${w} cm`, side: U }, { a: [th, 0], b: [th, h], label: `${h} cm`, side: R }];
  if (o.slant) dims.push({ a: [0, h / 2], b: [th, h], label: o.slant, side: [-0.7, 0.7] });
  const given: Art = { outline: [[th, 0], [th + w, 0], [total, h / 2], [th + w, h], [th, h], [0, h / 2]], dims,
    dashed: [[[th, 0], [th, h]], [[th + w, 0], [th + w, h]], [[0, h / 2], [0, 0]], [[total, h / 2], [total, 0]]], right: [[[th, 0], [th + 1, 0], [th, 1]], [[th + w, 0], [th + w - 1, 0], [th + w, 1]]] };
  return { id, set, prompt: "Work out the area of this shape. The two triangles are the same.", given, worked: { dashed: [[[0, h / 2], [th, h / 2]]], dims: [{ a: [0, h / 2], b: [th, h / 2], label: `${th} cm`, side: U }] }, brief: o.brief, answer: ra + 2 * ta,
    steps: [`Triangle height: $(${total} - ${w}) \\div 2 = ${th}$ cm`, `A: rectangle  $${w} \\times ${h} = ${ra}$ cm²`, `B and C: two triangles  $2 \\times \\tfrac12 \\times ${h} \\times ${th} = ${area(2 * ta)}$ cm²`, `Total: $${ra} + ${area(2 * ta)} = ${area(ra + 2 * ta)}$ cm²`],
    pieces: [{ pts: rect(th, 0, th + w, h), fill: COL.rect, name: "A" }, { pts: [[0, h / 2], [th, 0], [th, h]], fill: COL.tri, name: "B", dx: 0.5, dy: -1.3 }, { pts: [[th + w, 0], [total, h / 2], [th + w, h]], fill: COL.tri, name: "C", dx: -0.5, dy: -1.3 }] };
}
/** A shaded outline with a cut-out; the working subtracts. */
function shaded(id: string, set: string, outline: P[], hole: P[], dims: Art["dims"], dashed: [P, P][], right: [P, P, P][], steps: string[], answer: number, brief: string, prompt = "Work out the shaded area."): Q {
  const given: Art = { outline, hole, base: COL.shade, dims, dashed, right };
  return { id, set, prompt, given, worked: { holeFill: COL.hole }, steps, answer, brief, pieces: [{ pts: outline, fill: COL.shade }, { pts: hole, fill: COL.hole, sign: -1 }] };
}
/** A rectangle w × h with a triangular hole (base `tb` along the bottom, height `th`), the hole placed inside. */
function triHole(id: string, set: string, w: number, h: number, tb: number, th: number, brief: string): Q {
  const x0 = (w - tb) / 2, y0 = (h - th) / 2, hole: P[] = [[x0, y0], [x0 + tb, y0], [w / 2, y0 + th]];
  const ra = w * h, ta = (tb * th) / 2;
  return shaded(id, set, rect(0, 0, w, h), hole,
    [{ a: [0, h], b: [w, h], label: `${w} cm`, side: U }, { a: [w, 0], b: [w, h], label: `${h} cm`, side: R }, { a: [x0, y0], b: [x0 + tb, y0], label: `${tb} cm`, side: B, off: 30 }, { a: [w / 2, y0], b: [w / 2, y0 + th], label: `${th} cm`, side: R, off: 24 }],
    [[[w / 2, y0], [w / 2, y0 + th]]], [[[0, 0], [w, 0], [0, h]]],
    [`Rectangle: $${w} \\times ${h} = ${area(ra)}$ cm²`, `Hole: $\\tfrac12 \\times ${tb} \\times ${th} = ${area(ta)}$ cm²`, `Shaded: $${area(ra)} - ${area(ta)} = ${area(ra - ta)}$ cm²`], ra - ta, brief);
}
/** A rectangle w × h with a square hole of side `s`. */
function squareHole(id: string, set: string, w: number, h: number, s: number, brief: string): Q {
  const x0 = (w - s) / 2, y0 = (h - s) / 2, ra = w * h;
  return shaded(id, set, rect(0, 0, w, h), rect(x0, y0, x0 + s, y0 + s),
    [{ a: [0, h], b: [w, h], label: `${w} cm`, side: U }, { a: [w, 0], b: [w, h], label: `${h} cm`, side: R }, { a: [x0, y0], b: [x0 + s, y0], label: `${s} cm`, side: B, off: 30 }, { a: [x0 + s, y0], b: [x0 + s, y0 + s], label: `${s} cm`, side: R, off: 24 }],
    [], [[[0, 0], [w, 0], [0, h]]],
    [`Rectangle: $${w} \\times ${h} = ${area(ra)}$ cm²`, `Hole: $${s} \\times ${s} = ${s * s}$ cm²`, `Shaded: $${area(ra)} - ${s * s} = ${area(ra - s * s)}$ cm²`], ra - s * s, brief);
}
/** A rectangle under a parallelogram (base × perpendicular height), or a parallelogram with a rectangular hole. */
function parallelogram(id: string, set: string, base: number, rectH: number, ph: number, off: number, o: { slant?: string; hole?: [number, number, number, number]; brief: string }): Q {
  const para: P[] = [[0, rectH], [base, rectH], [base + off, rectH + ph], [off, rectH + ph]];
  const lower = rectH > 0, hy = rectH;
  const outline: P[] = lower ? [[0, 0], [base, 0], [base, rectH], [base + off, rectH + ph], [off, rectH + ph], [0, rectH]] : [[0, 0], [base, 0], [base + off, ph], [off, ph]];
  const dims: Art["dims"] = [{ a: [0, 0], b: [base, 0], label: `${base} cm`, side: B }];
  if (lower) dims.push({ a: [base, 0], b: [base, rectH], label: `${rectH} cm`, side: R });
  dims.push({ a: [off, hy], b: [off, hy + ph], label: `${ph} cm`, side: R, off: 24 });
  if (o.slant) dims.push({ a: [base, hy], b: [base + off, hy + ph], label: o.slant, side: [0.8, -0.6], off: 28 });
  const given: Art = { outline, dims, dashed: [[[off, hy], [off, hy + ph]]], right: [[[off, hy], [off + 1, hy], [off, hy + 1]]] };
  if (o.hole) {
    const [x0, y0, hw, hh] = o.hole, hole = rect(x0, y0, x0 + hw, y0 + hh), pa = base * ph;
    given.hole = hole; given.base = COL.shade;
    dims.push({ a: [x0, y0], b: [x0 + hw, y0], label: `${hw} cm`, side: B, off: 30 }, { a: [x0 + hw, y0], b: [x0 + hw, y0 + hh], label: `${hh} cm`, side: R, off: 24 });
    return { id, set, prompt: "Work out the shaded area.", given, worked: { holeFill: COL.hole }, brief: o.brief, answer: pa - hw * hh,
      steps: [`Parallelogram: $${base} \\times ${ph} = ${pa}$ cm²`, `Hole: $${hw} \\times ${hh} = ${hw * hh}$ cm²`, `Shaded: $${pa} - ${hw * hh} = ${pa - hw * hh}$ cm²`],
      pieces: [{ pts: para, fill: COL.shade }, { pts: hole, fill: COL.hole, sign: -1 }] };
  }
  const total = base * rectH + base * ph;
  return { id, set, prompt: "Work out the area of this shape.", given, worked: {}, brief: o.brief, answer: total,
    steps: [`A: rectangle  $${base} \\times ${rectH} = ${base * rectH}$ cm²`, `B: parallelogram  $${base} \\times ${ph} = ${base * ph}$ cm²`, `Total: $${base * rectH} + ${base * ph} = ${total}$ cm²`],
    pieces: [{ pts: rect(0, 0, base, rectH), fill: COL.rect, name: "A" }, { pts: para, fill: COL.para, name: "B", dx: 1.5 }] };
}
// Trapezia are never split: pupils already have the formula, so a trapezium here is a piece that gets ½ × (a + b) × h. Every one is symmetrical
// (bottom edge longer than the top edge, the slanted sides equal), drawn with its perpendicular height.
const trapArea = (bottom: number, top: number, h: number) => ((bottom + top) * h) / 2;
const trapPts = (bottom: number, top: number, y0: number, h: number): P[] => { const o = (bottom - top) / 2; return [[0, y0], [bottom, y0], [o + top, y0 + h], [o, y0 + h]]; };

/** A rectangle (width `w`, height `rh`) with a symmetrical trapezium on top (bottom edge `w`, top edge `top`). The picture gives the rectangle's
 *  height and the total height; the trapezium's height is found by subtraction. */
function rectAndTrapezium(id: string, set: string, w: number, rh: number, top: number, total: number, brief: string): Q {
  const th = total - rh, o = (w - top) / 2, ta = trapArea(w, top, th), ra = w * rh;
  const given: Art = { outline: [[0, 0], [w, 0], [w, rh], [o + top, total], [o, total], [0, rh]], dims: [{ a: [0, 0], b: [w, 0], label: `${w} cm`, side: B }, { a: [w, 0], b: [w, rh], label: `${rh} cm`, side: R }, { a: [o, total], b: [o + top, total], label: `${top} cm`, side: U }, { a: [0, 0], b: [0, total], label: `${total} cm`, side: L }],
    dashed: [[[o, total], [0, total]]], right: [[[0, 0], [w, 0], [0, rh]], [[w, 0], [0, 0], [w, rh]]] };
  return { id, set, prompt: "Work out the area of this shape.", given, worked: { dashed: [[[0, rh], [w, rh]], [[o, rh], [o, total]]], dims: [{ a: [o, rh], b: [o, total], label: `${th} cm`, side: R, off: 24 }] }, brief, answer: ra + ta,
    steps: [`Trapezium height: $${total} - ${rh} = ${th}$ cm`, `A: rectangle  $${w} \\times ${rh} = ${ra}$ cm²`, `B: trapezium  $\\tfrac12 \\times (${w} + ${top}) \\times ${th} = ${area(ta)}$ cm²`, `Total: $${ra} + ${area(ta)} = ${area(ra + ta)}$ cm²`],
    pieces: [{ pts: rect(0, 0, w, rh), fill: COL.rect, name: "A" }, { pts: trapPts(w, top, rh, th), fill: COL.trap, name: "B", dx: 1.2 }] };
}
/** A symmetrical trapezium (`bottom`, `top`, height `h`) with a rectangular hole: whole minus hole, the whole worked with the formula. */
function trapHole(id: string, set: string, bottom: number, top: number, h: number, hole: [number, number], brief: string): Q {
  const o = (bottom - top) / 2, [hw, hh] = hole, x0 = (bottom - hw) / 2, y0 = 1.5, ta = trapArea(bottom, top, h);
  const holePts = rect(x0, y0, x0 + hw, y0 + hh);
  return shaded(id, set, trapPts(bottom, top, 0, h), holePts,
    [{ a: [0, 0], b: [bottom, 0], label: `${bottom} cm`, side: B }, { a: [o, h], b: [o + top, h], label: `${top} cm`, side: U }, { a: [o, 0], b: [o, h], label: `${h} cm`, side: R, off: 24 }, { a: [x0, y0], b: [x0 + hw, y0], label: `${hw} cm`, side: B, off: 30 }, { a: [x0 + hw, y0], b: [x0 + hw, y0 + hh], label: `${hh} cm`, side: R, off: 24 }],
    [[[o, 0], [o, h]]], [[[o, 0], [o + 1, 0], [o, 1]]],
    [`Trapezium: $\\tfrac12 \\times (${bottom} + ${top}) \\times ${h} = ${area(ta)}$ cm²`, `Hole: $${hw} \\times ${hh} = ${hw * hh}$ cm²`, `Shaded: $${area(ta)} - ${hw * hh} = ${area(ta - hw * hh)}$ cm²`], ta - hw * hh, brief);
}
/** A symmetrical trapezium with a triangle on its top edge. The picture gives the trapezium's height and the total height; the triangle's height is found by subtraction. */
function trapAndTriangle(id: string, set: string, bottom: number, top: number, th: number, total: number, brief: string): Q {
  const o = (bottom - top) / 2, ah = total - th, ta = trapArea(bottom, top, th), tri = (top * ah) / 2, mid = bottom / 2;
  const given: Art = { outline: [[0, 0], [bottom, 0], [o + top, th], [mid, total], [o, th]], dims: [{ a: [0, 0], b: [bottom, 0], label: `${bottom} cm`, side: B }, { a: [o, th], b: [o + top, th], label: `${top} cm`, side: [0, -1], off: 26 }, { a: [o, 0], b: [o, th], label: `${th} cm`, side: R, off: 24 }, { a: [0, 0], b: [0, total], label: `${total} cm`, side: L }],
    dashed: [[[o, 0], [o, th]], [[mid, total], [0, total]]], right: [[[o, 0], [o + 1, 0], [o, 1]]] };
  return { id, set, prompt: "Work out the area of this shape.", given, worked: { dashed: [[[o, th], [o + top, th]], [[mid, th], [mid, total]]], dims: [{ a: [mid, th], b: [mid, total], label: `${ah} cm`, side: R, off: 22 }] }, brief, answer: ta + tri,
    steps: [`Triangle height: $${total} - ${th} = ${ah}$ cm`, `A: trapezium  $\\tfrac12 \\times (${bottom} + ${top}) \\times ${th} = ${area(ta)}$ cm²`, `B: triangle  $\\tfrac12 \\times ${top} \\times ${ah} = ${area(tri)}$ cm²`, `Total: $${area(ta)} + ${area(tri)} = ${area(ta + tri)}$ cm²`],
    pieces: [{ pts: trapPts(bottom, top, 0, th), fill: COL.trap, name: "A" }, { pts: [[o, th], [o + top, th], [mid, total]], fill: COL.tri, name: "B", dx: -1.1 }] };
}

// ---------- the lesson (about 60 minutes) ----------
// Add: model + three (house, bowtie with a sloping side, beside) + a parallelogram. Trap. Subtract: model + two. Stretch: model + two. Worksheet (8). Exit.
const M1 = house("m1", "Model", 8, 3, 3, { brief: "Models splitting a house shape: find the triangle's height from the wall and total heights, then each area, then add." });
const A1 = house("a1", "Set A", 6, 4, 3, { brief: "Rectangle and triangle. The wall and total heights are given, so the triangle's height is found first (7 − 4). Catches forgetting the half." });
const A2 = bowtie("a2", "Set A", 7, 6, 4, { slant: "5 cm", brief: "A box with an identical triangle on each side. The sloping side (5) is marked as a distractor: the height is the width each triangle sticks out." });
const A3 = beside("a3", "Set A", 8, 5, 3, "The triangle sits beside the rectangle, not on top: its base is the side of the rectangle, and its height is found from the widths (11 − 8).");
const C1 = parallelogram("c1", "Set A", 9, 3, 4, 3, { slant: "5 cm", brief: "A parallelogram on a rectangle. The sloping side (5) is marked: catches using it as the height." });
const M2 = triHole("m2", "Model", 9, 6, 6, 3, "Models whole minus cut-out for a shaded shape: the hole is a triangle.");
const B1 = triHole("b1", "Set B", 13, 7.5, 9, 5, "First subtract: a triangular hole in a rectangle, with one decimal length. Catches adding the two areas.");
const B2 = squareHole("b2", "Set B", 20, 12, 5, "The simplest subtraction: a square hole, no triangle.");
const M4 = rectAndTrapezium("m4", "Model", 10, 3, 6, 7, "Models a trapezium as a piece of a composite shape: find its height from the total, then use the trapezium formula (no splitting) and add the rectangle.");
const D1 = trapHole("d1", "Set D", 12, 8, 5, [3, 2], "A trapezium with a rectangular hole: the formula for the whole, then subtract. Catches not halving the sum of the parallel sides.");
const D2 = trapAndTriangle("d2", "Set D", 14, 8, 5, 9, "A trapezium with a triangle on top: two formulas in one shape, and the triangle's height found from the total (9 \u2212 5).");

// ---------- the worksheet: eight questions, fading support (split shown, then independent), one decimal at most ----------
const W: { q: Q; split: boolean }[] = [
  { q: house("w1", "Sheet", 9, 5, 4), split: true },
  { q: beside("w2", "Sheet", 12, 6, 5, ""), split: true },
  { q: bowtie("w3", "Sheet", 10, 4, 5), split: false },
  { q: triHole("w4", "Sheet", 15, 8, 8, 4, ""), split: false },
  { q: squareHole("w5", "Sheet", 14, 9.5, 3, ""), split: false },
  { q: parallelogram("w6", "Sheet", 14, 0, 6, 3, { hole: [6, 1, 5, 4], brief: "" }), split: false },
  { q: trapAndTriangle("w7", "Sheet", 12, 6, 5, 8, ""), split: false },
  { q: rectAndTrapezium("w8", "Sheet", 8, 4, 4, 7, ""), split: false },
];
must(W.map((w) => w.q.answer).join() === [63, 87, 60, 104, 124, 64, 54, 50].join(), `the worksheet answers are ${W.map((w) => w.q.answer).join()}`);
const sheetItems: PictureSheetItem[] = W.map(({ q, split }) => {
  check(q);
  const asked: Art = split ? { ...q.given, dashed: [...(q.given.dashed ?? []), ...(q.worked.dashed ?? [])] } : q.given;
  return { src: toSrc(drawArt(asked, 560, 420, 72)), answerSrc: toSrc(drawArt(splitArt(q), 560, 420, 72)), working: q.steps.map(plain), answer: `Area = ${area(q.answer)} cm²` };
});
const worksheetSlide = (): Slide => {
  const s = S.pictureSheet("cs-worksheet", { title: "Composite shapes", note: "Work out the area of each shape. Questions 1 and 2 show the split; after that, split the shape yourself. In question 3 the two triangles are the same.", items: sheetItems }, "perimeter-and-area");
  return { ...s, brief: "Eight authored questions, printed four to an A4 page with a worked answer copy. Support fades: the split is drawn for 1 and 2, then it is independent; every house or side-triangle gives the total and the part, so the triangle's height is found by subtraction; 4 to 6 are shaded, 7 is a trapezium with a triangle on top, 8 a trapezium on a rectangle (the trapezium formula is used, never a split). Answers appear on a click." };
};

// ---------- the exit ticket ----------
const E1 = house("e1", "Exit", 11, 4, 6);
const E2 = triHole("e2", "Exit", 17, 9, 8, 5, "");
must(E1.answer === 77 && E2.answer === 133, "the exit ticket answers are 77 and 133");
check(E1); check(E2);
const exitSlide = (): Slide => makeSlide("cs-exit", "retrieval", "Exit ticket", [
  ...titleEls("Exit ticket", "Find each area. Then write how you chose between adding and subtracting."),
  { kind: "image", x: 40, y: 240, w: 760, h: 560, src: toSrc(drawArt(E1.given, 760, 560, 110)) },
  { kind: "image", x: 800, y: 240, w: 760, h: 560, src: toSrc(drawArt(E2.given, 760, 560, 110)) },
  textEl(40, 810, 760, 70, "$\\tfrac12 \\times 11 \\times 6 = 33$, so $44 + 33 = 77$ cm²", 36, { align: "center", bold: true, colour: LOOK.green, step: 1 }),
  textEl(800, 810, 760, 70, "$153 - 20 = 133$ cm²  (subtract the hole)", 36, { align: "center", bold: true, colour: LOOK.green, step: 1 }),
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
const trapPicture: Art = { outline: [[0, 0], [10, 0], [5, 12]], dims: [{ a: [0, 0], b: [10, 0], label: "10 cm", side: B }, { a: [10, 0], b: [5, 12], label: "13 cm", side: [0.9, 0.4], off: 40 }, { a: [5, 0], b: [5, 12], label: "12 cm", side: R, off: 36 }], dashed: [[[5, 0], [5, 12]]], right: [[[5, 0], [0, 0], [5, 12]]] };
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
  Q.open("cs-s4", "perimeter-and-area", "level1", "A trapezium has parallel sides $6$ cm and $10$ cm, and height $4$ cm. What is its area?", "$32$ cm²"),
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
    questionSlide(M1), questionSlide(A1), questionSlide(A2), discussTrap(), questionSlide(A3), questionSlide(C1),
    questionSlide(M2), questionSlide(B1), questionSlide(B2),
    questionSlide(M4), questionSlide(D1), questionSlide(D2),
    worksheetSlide(),
    exitSlide(),
    S.summary("cs-summary", "Summary", ["Split the shape into rectangles, triangles and parallelograms.", "Find any missing length first.", "Add the pieces, or take the hole away.", "The height is always at right angles to the base."]),
  ],
});
