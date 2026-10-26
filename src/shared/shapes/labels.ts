// Perimeter & Area — label placement. Each label is a small pill that sits just outside its edge. A greedy pass tries a handful of
// candidate spots per label (straight out, further out, slid along the edge) and keeps the first that clears the pills already
// placed and the shape: a few checks per label, never a search over every combination.

export interface PillIn { mx: number; my: number; nx: number; ny: number; w: number; h: number }

const gap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): number =>
  Math.max(Math.abs(ax - bx) - (aw + bw) / 2, Math.abs(ay - by) - (ah + bh) / 2);

export function placePills(items: PillIn[], standoff: number, blocked: (x: number, y: number) => boolean): [number, number][] {
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  return items.map((it) => {
    const tx = -it.ny, ty = it.nx;
    const slide = Math.max(it.w, it.h) * 0.9;
    const cands: [number, number][] = [];
    for (const k of [1, 1.7, 2.4]) for (const s of [0, 1, -1]) cands.push([it.mx + it.nx * standoff * k + tx * slide * s, it.my + it.ny * standoff * k + ty * slide * s]);
    let best = cands[0], bestScore = -Infinity;
    for (const c of cands) {
      let clear = 20;
      for (const p of placed) clear = Math.min(clear, gap(c[0], c[1], it.w, it.h, p.x, p.y, p.w, p.h));
      const score = (blocked(c[0], c[1]) ? -1000 : 0) + clear;
      if (score > bestScore) { best = c; bestScore = score; }
      if (score >= 6) break;
    }
    placed.push({ x: best[0], y: best[1], w: it.w, h: it.h });
    return best;
  });
}
