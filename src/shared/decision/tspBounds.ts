// ═══════════════════════════════════════════════════════════════════════════
// Travelling salesperson — the deleted-vertex LOWER bound (pure, no React).
//
//   1. delete a vertex X (and its edges) from the table of least distances;
//   2. find a minimum spanning tree of the remaining n − 1 vertices (Kruskal on the table);
//   3. add the two shortest edges back to X;
//   4. the lower bound is the total.   (Any tour minus X is a spanning path of the rest, so it is at least the MST; and the
//      tour enters and leaves X by two edges, so it is at least the two shortest.)
//
// `unique` is true only when the answer is unambiguous: every edge outside the tree is STRICTLY heavier than the heaviest
// edge on the tree path between its ends (so the MST is the only one), and the second-shortest and third-shortest edges at X
// differ (so the two links are the only choice). The generator rejects anything else, so the working never needs a tie-break.
// validate.ts re-derives the bound independently and src/tests/tspBounds.test.ts checks lower ≤ optimal ≤ NN by brute force.
// ═══════════════════════════════════════════════════════════════════════════

import type { LeastDistances } from "./tsp";
import { treePath } from "./mst";

export interface TableEdge {
  a: string; // alphabetically first end
  b: string;
  w: number;
}

export interface LowerBoundEntry {
  edge: TableEdge;
  accepted: boolean;
  /** rejected only: the path in the tree built so far that already joins the two ends */
  cycle?: string[];
}

export interface LowerBoundResult {
  deleted: string;
  rest: string[];
  sorted: TableEdge[]; // every pair among the remaining vertices, smallest first
  entries: LowerBoundEntry[]; // the edges considered (Kruskal stops with n − 2 tree edges)
  mst: TableEdge[]; // in the order added
  mstTotal: number;
  row: Array<{ to: string; w: number }>; // X's distances to the others, smallest first
  links: Array<{ to: string; w: number }>; // the two shortest
  linksTotal: number;
  lower: number;
  unique: boolean;
}

const asTree = (edges: TableEdge[]) => edges.map((e) => ({ id: e.a + e.b, from: e.a, to: e.b, weight: e.w }));

export function lowerBound(ld: LeastDistances, deleted: string): LowerBoundResult {
  const rest = ld.ids.filter((v) => v !== deleted);
  const sorted: TableEdge[] = [];
  for (let i = 0; i < rest.length; i++)
    for (let j = i + 1; j < rest.length; j++) sorted.push({ a: rest[i], b: rest[j], w: ld.dist[rest[i]][rest[j]] });
  sorted.sort((x, y) => x.w - y.w || (x.a + x.b).localeCompare(y.a + y.b));

  const entries: LowerBoundEntry[] = [];
  const mst: TableEdge[] = [];
  for (const e of sorted) {
    if (mst.length === rest.length - 1) break;
    const path = treePath(asTree(mst), e.a, e.b);
    if (path) entries.push({ edge: e, accepted: false, cycle: path });
    else {
      mst.push(e);
      entries.push({ edge: e, accepted: true });
    }
  }
  const mstTotal = mst.reduce((t, e) => t + e.w, 0);
  const row = rest.map((to) => ({ to, w: ld.dist[deleted][to] })).sort((x, y) => x.w - y.w || x.to.localeCompare(y.to));
  const links = row.slice(0, 2);
  const linksTotal = links[0].w + links[1].w;

  // uniqueness: every non-tree edge strictly heavier than the heaviest tree edge on its cycle, and a strict gap after the 2nd link
  const tree = asTree(mst);
  const inTree = new Set(mst.map((e) => e.a + e.b));
  let unique = row.length < 3 || row[1].w < row[2].w;
  for (const e of sorted) {
    if (inTree.has(e.a + e.b)) continue;
    const path = treePath(tree, e.a, e.b)!;
    let heaviest = 0;
    for (let k = 1; k < path.length; k++) heaviest = Math.max(heaviest, ld.dist[path[k - 1]][path[k]]);
    if (e.w <= heaviest) unique = false;
  }
  return { deleted, rest, sorted, entries, mst, mstTotal, row, links, linksTotal, lower: mstTotal + linksTotal, unique };
}
