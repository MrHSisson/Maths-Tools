// Where the cards of a deck's Venn element sit. Pure geometry in the element's own units (a box 1000 wide and 680 high, two circles), so a
// test can check it and the editor and the player draw the same thing. A card with a region is set out in that part of the diagram; a card
// without one (or in "neither") is scattered round the outside, in the corners and margins of the box.
import { splitPrimes, type VennRegions } from "../shared/venn";
import type { VennCard, VennRegion } from "./types";

export const BOX_W = 1000, BOX_H = 700;
export const CIRCLE_R = 235, CIRCLE_Y = 335, LEFT_X = 345, RIGHT_X = 655;
export const GAP = 10;
/** The drawing's colours, shared by the slide piece and the printed sheet so the two cannot drift. */
export const INK = "#1e293b", LEFT_C = "#6683a8", RIGHT_C = "#a58b66";   // quiet colours: the cards carry the colour, not the circles
/** The room each part of the diagram gives its cards: the centre and the widest a row of cards may be. */
const REGION_AT: Record<"left" | "middle" | "right", { cx: number; cy: number; w: number }> = {
  left: { cx: 265, cy: CIRCLE_Y + 10, w: 230 }, middle: { cx: 500, cy: CIRCLE_Y + 10, w: 138 }, right: { cx: 735, cy: CIRCLE_Y + 10, w: 230 },
};
/** Round the outside: bottom left, bottom right, left side, right side, bottom middle. A card goes to the next one it fits. */
const OUTSIDE: { cx: number; cy: number; w: number; bottom: boolean }[] = [
  { cx: 190, cy: 660, w: 340, bottom: true }, { cx: 810, cy: 660, w: 340, bottom: true },
  { cx: 95, cy: 150, w: 170, bottom: false }, { cx: 905, cy: 150, w: 170, bottom: false },
  { cx: 50, cy: CIRCLE_Y, w: 84, bottom: false }, { cx: 950, cy: CIRCLE_Y, w: 84, bottom: false },
  { cx: 500, cy: 660, w: 230, bottom: true },
];

interface PlacedCard { x: number; y: number; w: number; h: number }

/** A card's size: a tile is a square, anything else as wide as its text, both scaled by `size`. */
function cardSize(c: VennCard, size = 1): { w: number; h: number } {
  const h = (c.tile ? 64 : 56) * size;
  return { w: c.tile ? h : Math.max(64, c.text.length * 19 + 34) * size, h };
}

/** Rows of cards, greedy to `wmax`, each row centred on `cx`, the block centred on `cy` (or sitting on `cy` when `bottom`). */
function flow(items: { i: number; w: number; h: number }[], cx: number, cy: number, wmax: number, bottom: boolean, out: PlacedCard[]) {
  const rows: typeof items[] = [[]];
  let used = 0;
  for (const it of items) {
    const row = rows[rows.length - 1];
    if (row.length && used + GAP + it.w > wmax) { rows.push([it]); used = it.w; } else { row.push(it); used += (row.length > 1 ? GAP : 0) + it.w; }
  }
  const heights = rows.map((r) => Math.max(...r.map((x) => x.h)));
  const total = heights.reduce((a, b) => a + b, 0) + GAP * (rows.length - 1);
  let y = bottom ? cy + heights[heights.length - 1] / 2 - total : cy - total / 2;
  rows.forEach((row, ri) => {
    const rw = row.reduce((a, x) => a + x.w, 0) + GAP * (row.length - 1);
    let x = cx - rw / 2;
    for (const it of row) { out[it.i] = { x: x + it.w / 2, y: y + heights[ri] / 2, w: it.w, h: it.h }; x += it.w + GAP; }
    y += heights[ri] + GAP;
  });
}

/** The start position of every card, in order. */
export function layoutCards(cards: readonly VennCard[], size = 1): PlacedCard[] {
  const out: PlacedCard[] = new Array(cards.length);
  const inRegion: Record<"left" | "middle" | "right", { i: number; w: number; h: number }[]> = { left: [], middle: [], right: [] };
  const outside: { i: number; w: number; h: number }[][] = OUTSIDE.map(() => []);
  let k = 0;
  cards.forEach((c, i) => {
    const sz = cardSize(c, size), r: VennRegion | undefined = c.region;
    if (r === "left" || r === "middle" || r === "right") { inRegion[r].push({ i, ...sz }); return; }
    for (let t = 0; t < OUTSIDE.length; t++) {
      const z = (k + t) % OUTSIDE.length;
      if (sz.w <= OUTSIDE[z].w || z === OUTSIDE.length - 1) { outside[z].push({ i, ...sz }); k = z + 1; return; }
    }
  });
  for (const r of ["left", "middle", "right"] as const) if (inRegion[r].length) flow(inRegion[r], REGION_AT[r].cx, REGION_AT[r].cy, REGION_AT[r].w, false, out);
  OUTSIDE.forEach((z, zi) => { if (outside[zi].length) flow(outside[zi], z.cx, z.cy, z.w, z.bottom, out); });
  return out;
}

/** The prime tiles as the three regions of a prime Venn, or null when the cards are not all placed tiles (so there is nothing to multiply). */
export function regionsOf(cards: readonly VennCard[]): VennRegions | null {
  const r: VennRegions = { left: [], middle: [], right: [] };
  for (const c of cards) {
    const n = Number(c.text);
    if (!c.tile || !Number.isInteger(n) || n < 2 || (c.region !== "left" && c.region !== "middle" && c.region !== "right")) return null;
    r[c.region].push(n);
  }
  for (const k of ["left", "middle", "right"] as const) r[k].sort((a, b) => a - b);
  return r;
}

/** What is wrong with a prime-tile Venn: the tiles put the same prime on both sides when they should share it (matching is one for one). */
export function tileProblems(cards: readonly VennCard[]): string[] {
  const r = regionsOf(cards);
  if (!r || r.left.length + r.middle.length === 0 || r.right.length + r.middle.length === 0) return [];
  const a = r.left.concat(r.middle).reduce((x, y) => x * y, 1), b = r.right.concat(r.middle).reduce((x, y) => x * y, 1);
  const want = splitPrimes(a, b);
  const same = (x: number[], y: number[]) => x.length === y.length && x.every((v, i) => v === y[i]);
  const problems: string[] = [];
  if (!same(want.middle, r.middle)) problems.push(`the middle tiles are ${r.middle.join(", ") || "empty"} but ${a} and ${b} share ${want.middle.join(", ") || "nothing"}`);
  else if (!same(want.left, r.left) || !same(want.right, r.right)) problems.push(`the tiles are not where the prime factors of ${a} and ${b} go`);
  return problems;
}
