// Perimeter & Area — rectilinear shape templates. Each template is a function of whole-number sizes that returns the outline
// (and any hole) as points; the model derives everything else. `grid` shapes use the smaller ranges that fit on squared paper.
import { randInt as ri } from "../../../shared";
import { dihedral, orient, type Pt } from "../../../shared/shapes/model";

export type RectKind = "L" | "T" | "stairs2" | "stairs3" | "cross" | "U" | "comb" | "frame";

/** Kinds with no notch or hole: the perimeter equals the perimeter of the rectangle round them. */
export const CONVEX: RectKind[] = ["L", "T", "stairs2", "stairs3", "cross"];

const polysFor = (kind: RectKind, grid: boolean): Pt[][] => {
  const m = grid ? 2 : 3;                        // the smallest a part may be
  switch (kind) {
    case "L": {
      const W = grid ? ri(5, 9) : ri(8, 14), H = grid ? ri(5, 8) : ri(8, 12);
      const a = ri(m, H - m), c = ri(m, W - m);
      return [[[0, 0], [W, 0], [W, a], [c, a], [c, H], [0, H]]];
    }
    case "T": {
      const W = grid ? ri(6, 9) : ri(10, 16), a = grid ? ri(2, 3) : ri(3, 5), s = grid ? ri(2, 3) : ri(3, 5), h = grid ? ri(2, 4) : ri(4, 7);
      const o = ri(grid ? 1 : 2, W - s - (grid ? 1 : 2));
      return [[[0, 0], [W, 0], [W, a], [o + s, a], [o + s, a + h], [o, a + h], [o, a], [0, a]]];
    }
    case "stairs2": case "stairs3": {
      const k = kind === "stairs2" ? 2 : 3;
      const dx = () => (grid ? ri(2, 3) : ri(3, 5)), dy = () => (grid ? ri(2, 2) : ri(3, 4));
      const d = Array.from({ length: k - 1 }, dx), top = dx(), h = Array.from({ length: k }, dy);
      const W = d.reduce((a, b) => a + b, 0) + top;
      const pts: Pt[] = [[0, 0], [W, 0]];
      let x = W, y = 0;
      for (let i = 0; i < k; i++) { y += h[i]; pts.push([x, y]); if (i < k - 1) { x -= d[i]; pts.push([x, y]); } }
      pts.push([0, y]);
      return [pts];
    }
    case "cross": {
      const arm = () => (grid ? ri(2, 3) : ri(3, 5)), core = () => (grid ? ri(2, 3) : ri(3, 5));
      const a = arm(), b = arm(), c = arm(), d = arm(), t = core(), u = core();
      return [[[a, 0], [a + t, 0], [a + t, c], [a + t + b, c], [a + t + b, c + u], [a + t, c + u], [a + t, c + u + d], [a, c + u + d], [a, c + u], [0, c + u], [0, c], [a, c]]];
    }
    case "U": {
      const W = ri(12, 16), H = ri(9, 12), n = ri(4, 6), o = ri(3, W - n - 3), d = ri(5, H - 3);
      return [[[0, 0], [W, 0], [W, H], [o + n, H], [o + n, H - d], [o, H - d], [o, H], [0, H]]];
    }
    case "comb": {
      const g1 = ri(2, 3), n1 = ri(2, 3), g2 = ri(2, 3), n2 = ri(2, 3), g3 = ri(2, 3);
      const W = g1 + n1 + g2 + n2 + g3, H = ri(9, 12), d = ri(5, H - 3);
      const xa = g1, xb = g1 + n1, xc = xb + g2, xd = xc + n2;
      return [[[0, 0], [W, 0], [W, H], [xd, H], [xd, H - d], [xc, H - d], [xc, H], [xb, H], [xb, H - d], [xa, H - d], [xa, H], [0, H]]];
    }
    case "frame": {
      const W = ri(10, 14), H = ri(8, 11), hw = ri(4, W - 4), hh = ri(3, H - 4);
      const ox = ri(2, W - hw - 2), oy = ri(2, H - hh - 2);
      return [[[0, 0], [W, 0], [W, H], [0, H]], [[ox, oy], [ox, oy + hh], [ox + hw, oy + hh], [ox + hw, oy]]];
    }
  }
};

/** A random shape of this kind, facing a random way. */
export const buildRect = (kind: RectKind, grid = false): Pt[][] => dihedral(orient(polysFor(kind, grid)), ri(0, 7));
