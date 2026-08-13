// randomNetwork — procedurally generate a connected, crossing-free weighted
// Network from nothing but a node count, instead of sampling a hand-authored
// NetworkTemplate.
//
// Harvested from an old, never-registered v1 draft (Unpublished/GraphGenerator.tsx)
// that solved exactly this problem for its own standalone tool: place nodes with
// good separation, build a planar spanning tree (straight edges only, nearest
// node first), then add extra planar edges up to a random budget, then patch any
// degree-1 leaves. That draft also routed curved Bézier edges for pairs that
// couldn't be connected without crossing — dropped here, because NetworkView
// (src/shared/decision/representations/NetworkView.tsx) only ever draws straight
// `<line>` edges. Restricting this generator to edges that pass the same
// non-crossing check NetworkView implicitly relies on keeps every network it
// produces renderable with zero shell changes. A curved-edge NetworkView variant
// would be the natural next step if a future tool wants denser random graphs.
//
// The `routeInspection` option is the other piece worth keeping: it nudges the
// edge set until exactly 2 or 4 nodes have odd degree — the solvability
// condition for the Route Inspection (Chinese Postman) problem, one of the
// Decision Maths topics still unbuilt (see docs/PROJECTS.md).

import type { GEdge, GNode, Network } from "./types";

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randFloat = (min: number, max: number) => min + Math.random() * (max - min);

// Same board scale as the hand-authored templates (see MinimumSpanningTree's
// MST_TEMPLATE) so a generated network sits at a familiar size in NetworkView.
const BOARD_W = 680;
const BOARD_H = 520;
const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

interface Pt { x: number; y: number }

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function segmentsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const dx = p3.x - p1.x, dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  const eps = 0.02;
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
}

function pointToSegDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

interface WorkingEdge { a: number; b: number }

// Does the straight line a→b cross any already-placed edge (sharing an endpoint doesn't count)?
function crossesAnyEdge(pos: Pt[], edges: WorkingEdge[], a: number, b: number): boolean {
  for (const e of edges) {
    if (e.a === a || e.a === b || e.b === a || e.b === b) continue;
    if (segmentsIntersect(pos[a], pos[b], pos[e.a], pos[e.b])) return true;
  }
  return false;
}

// Does some other node sit on top of the straight line a→b?
function nodeOccludesEdge(pos: Pt[], a: number, b: number, nodeR = 22): boolean {
  const na = pos[a], nb = pos[b];
  const segLenSq = (nb.x - na.x) ** 2 + (nb.y - na.y) ** 2 || 1;
  for (let k = 0; k < pos.length; k++) {
    if (k === a || k === b) continue;
    const nk = pos[k];
    const t = ((nk.x - na.x) * (nb.x - na.x) + (nk.y - na.y) * (nb.y - na.y)) / segLenSq;
    if (t < 0.08 || t > 0.92) continue;
    if (pointToSegDist(nk, na, nb) < nodeR * 1.35) return true;
  }
  return false;
}

function placeNodes(n: number): Pt[] {
  const MARGIN = 80;
  const xMin = MARGIN, xMax = BOARD_W - MARGIN;
  const yMin = MARGIN, yMax = BOARD_H - MARGIN;
  const MIN_DIST = 130;

  const pos: Pt[] = [];
  let attempts = 0;
  while (pos.length < n && attempts < 5000) {
    attempts++;
    const p: Pt = { x: randFloat(xMin, xMax), y: randFloat(yMin, yMax) };
    if (pos.every((q) => dist(p, q) >= MIN_DIST)) pos.push(p);
  }

  // Couldn't place with the minimum separation (dense n) — fall back to a grid.
  if (pos.length < n) {
    pos.length = 0;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cw = (xMax - xMin) / cols;
    const ch = (yMax - yMin) / rows;
    for (let i = 0; i < n; i++) {
      pos.push({
        x: xMin + (i % cols) * cw + cw / 2 + randFloat(-cw * 0.2, cw * 0.2),
        y: yMin + Math.floor(i / cols) * ch + ch / 2 + randFloat(-ch * 0.2, ch * 0.2),
      });
    }
  }
  return pos.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

export interface RandomNetworkOptions {
  /** Node count, 3–9 (letters A–I; higher counts are clamped). */
  nodeCount: number;
  /** Inclusive weight range each edge is sampled from. */
  weightRange: [min: number, max: number];
  /** Force the edge set to exactly 2 or 4 odd-degree nodes — the Route
   *  Inspection (Chinese Postman) solvability condition. Default false. */
  routeInspection?: boolean;
  /** Cap on node degree while adding edges. Default 5. */
  maxDegree?: number;
}

/** Procedurally generate a connected, crossing-free weighted Network. */
export function generateRandomNetwork(opts: RandomNetworkOptions): Network {
  const n = Math.max(3, Math.min(NODE_LABELS.length, Math.floor(opts.nodeCount)));
  const [lo, hi] = opts.weightRange;
  const maxDegree = opts.maxDegree ?? 5;

  const pos = placeNodes(n);
  const degrees = Array(n).fill(0);
  const edgeSet = new Set<string>();
  const edges: WorkingEdge[] = [];

  const key = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)].join("-");

  const canAddStraight = (a: number, b: number): boolean =>
    degrees[a] < maxDegree &&
    degrees[b] < maxDegree &&
    !edgeSet.has(key(a, b)) &&
    !crossesAnyEdge(pos, edges, a, b) &&
    !nodeOccludesEdge(pos, a, b);

  const addEdge = (a: number, b: number): boolean => {
    if (a === b || degrees[a] >= maxDegree || degrees[b] >= maxDegree || edgeSet.has(key(a, b))) return false;
    edgeSet.add(key(a, b));
    edges.push({ a, b });
    degrees[a]++;
    degrees[b]++;
    return true;
  };

  // ── Step 1: the true Euclidean minimum spanning tree ──────────────────────────
  // A greedy "nearest reachable, skip if it crosses" walk (the original draft's
  // approach) can paint itself into a corner at higher node counts, where every
  // remaining node can only be reached by a crossing edge — the draft's fallback
  // then added that crossing edge anyway, which its own curve-routing step (not
  // ported here — see the file header) was there to visually resolve. Building
  // the actual Euclidean MST instead sidesteps the problem rather than papering
  // over it: it is a classical result that an EMST's edges never cross (any
  // crossing pair could always be swapped for a shorter, non-crossing one,
  // contradicting minimality), so this step needs no crossing check at all —
  // Prim's algorithm by raw distance is both connected and provably planar.
  const inTree = new Set<number>([0]);
  const remaining = new Set([...Array(n).keys()].filter((i) => i !== 0));
  while (remaining.size > 0) {
    let bestDist = Infinity, bestSrc = -1, bestDst = -1;
    for (const src of inTree) {
      for (const dst of remaining) {
        const d = dist(pos[src], pos[dst]);
        if (d < bestDist) { bestDist = d; bestSrc = src; bestDst = dst; }
      }
    }
    addEdge(bestSrc, bestDst);
    inTree.add(bestDst);
    remaining.delete(bestDst);
  }

  // ── Step 2: extra planar edges, shortest candidates first, up to a random budget ──
  const extraBudget = randInt(0, n);
  const pairs: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!edgeSet.has(key(a, b))) pairs.push([a, b]);
  pairs.sort(([a1, b1], [a2, b2]) => dist(pos[a1], pos[b1]) - dist(pos[a2], pos[b2]));

  let straightAdded = 0;
  for (const [a, b] of pairs) {
    if (straightAdded >= extraBudget) break;
    if (canAddStraight(a, b)) { addEdge(a, b); straightAdded++; }
  }

  // ── Step 3: patch degree-1 leaves (at most one allowed) ──────────────────────
  // Every candidate pairing goes through canAddStraight — if no non-crossing
  // patch exists for a leaf, it stays a leaf rather than gaining a crossing edge.
  const deg1 = () => [...Array(n).keys()].filter((i) => degrees[i] === 1);
  let d1 = deg1();
  let d3safety = n * n;
  while (d1.length > 1 && d3safety-- > 0) {
    let patched = false;
    outer: for (let i = 0; i < d1.length - 1; i++) {
      for (let j = i + 1; j < d1.length; j++) if (canAddStraight(d1[i], d1[j]) && addEdge(d1[i], d1[j])) { patched = true; break outer; }
    }
    if (!patched) {
      const target = d1[0];
      const cands = [...Array(n).keys()]
        .filter((k) => k !== target && canAddStraight(target, k))
        .sort((a, b) => dist(pos[a], pos[target]) - dist(pos[b], pos[target]));
      if (cands.length) addEdge(target, cands[0]);
      else break; // no non-crossing patch for this leaf (or any remaining leaf pair) — leave it
    }
    d1 = deg1();
  }

  // ── Step 4 (optional): nudge toward exactly 2 or 4 odd-degree nodes ──────────
  // Same rule: only ever add a pairing that passes canAddStraight. Perfect 2-or-4
  // isn't geometrically guaranteed under that constraint, so this is a best-effort
  // nudge, not a hard guarantee — callers building a Route Inspection tool on top
  // of this should still confirm the odd count before presenting a question.
  if (opts.routeInspection) {
    const oddNodes = () => [...Array(n).keys()].filter((i) => degrees[i] % 2 !== 0);
    let odds = oddNodes();
    let safety = 60;
    while (odds.length > 4 && safety-- > 0) {
      let patched = false;
      outer: for (let i = 0; i < odds.length - 1; i++) {
        for (let j = i + 1; j < odds.length; j++) if (canAddStraight(odds[i], odds[j]) && addEdge(odds[i], odds[j])) { patched = true; break outer; }
      }
      if (!patched) break;
      odds = oddNodes();
    }
    if (oddNodes().length === 0) {
      const evens = [...Array(n).keys()].filter((i) => degrees[i] % 2 === 0);
      outer: for (let i = 0; i < evens.length - 1; i++) {
        for (let j = i + 1; j < evens.length; j++) {
          if (canAddStraight(evens[i], evens[j])) { addEdge(evens[i], evens[j]); break outer; }
        }
      }
    }
  }

  const nodes: GNode[] = pos.map((p, i) => ({ id: NODE_LABELS[i], x: p.x, y: p.y }));
  const gEdges: GEdge[] = edges.map((e) => ({
    id: `${NODE_LABELS[e.a]}${NODE_LABELS[e.b]}`,
    from: NODE_LABELS[e.a],
    to: NODE_LABELS[e.b],
    weight: randInt(lo, hi),
  }));
  return { nodes, edges: gEdges };
}
