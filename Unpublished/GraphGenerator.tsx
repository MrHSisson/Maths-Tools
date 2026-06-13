import { useState, useCallback, useRef } from "react";

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const NODE_R = 22;
const W = 680, H = 520, CX = 340, CY = 260;

type Vec = { x: number; y: number };
type Node = { id: number; label: string; x: number; y: number };
type Edge = { a: number; b: number; w: number };
interface GraphState { nodes: Node[]; edges: Edge[]; degrees: number[] }

// ─── Math helpers ─────────────────────────────────────────────────────────────

function rand(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function randf(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function segmentsIntersect(
  p1x: number, p1y: number, p2x: number, p2y: number,
  p3x: number, p3y: number, p4x: number, p4y: number
): boolean {
  const d1x = p2x - p1x, d1y = p2y - p1y;
  const d2x = p4x - p3x, d2y = p4y - p3y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const dx = p3x - p1x, dy = p3y - p1y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  const eps = 0.02;
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
}

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegDist(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// Does the straight line a→b cross any existing edge (ignoring edges that share endpoints)?
function crossesAnyEdge(
  pos: Vec[], edges: Edge[], a: number, b: number
): boolean {
  for (const e of edges) {
    if (e.a === a || e.a === b || e.b === a || e.b === b) continue;
    if (segmentsIntersect(
      pos[a].x, pos[a].y, pos[b].x, pos[b].y,
      pos[e.a].x, pos[e.a].y, pos[e.b].x, pos[e.b].y
    )) return true;
  }
  return false;
}

// Does node k sit on the straight line between a and b?
function nodeOccludesEdge(pos: Vec[], nodes: Node[], a: number, b: number): boolean {
  const na = pos[a], nb = pos[b];
  const segLenSq = (nb.x - na.x) ** 2 + (nb.y - na.y) ** 2 || 1;
  for (let k = 0; k < pos.length; k++) {
    if (k === a || k === b) continue;
    const nk = pos[k];
    const t = ((nk.x - na.x) * (nb.x - na.x) + (nk.y - na.y) * (nb.y - na.y)) / segLenSq;
    if (t < 0.08 || t > 0.92) continue;
    if (pointToSegDist(nk, na, nb) < NODE_R * 1.35) return true;
  }
  return false;
}

// ─── Node placement ────────────────────────────────────────────────────────────
// Place n nodes with good separation, slight randomness, no circles.

function placeNodes(n: number): Vec[] {
  const MARGIN = 80;
  const xMin = MARGIN, xMax = W - MARGIN;
  const yMin = MARGIN, yMax = H - MARGIN;
  const MIN_DIST = 130;

  const pos: Vec[] = [];
  let attempts = 0;

  while (pos.length < n && attempts < 5000) {
    attempts++;
    const p: Vec = { x: randf(xMin, xMax), y: randf(yMin, yMax) };
    if (pos.every(q => dist(p, q) >= MIN_DIST)) {
      pos.push(p);
    }
  }

  // If we couldn't place with MIN_DIST, relax and retry
  if (pos.length < n) {
    pos.length = 0;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cw = (xMax - xMin) / cols;
    const ch = (yMax - yMin) / rows;
    for (let i = 0; i < n; i++) {
      pos.push({
        x: xMin + (i % cols) * cw + cw / 2 + randf(-cw * 0.2, cw * 0.2),
        y: yMin + Math.floor(i / cols) * ch + ch / 2 + randf(-ch * 0.2, ch * 0.2),
      });
    }
  }

  return pos.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

// ─── Graph generation ─────────────────────────────────────────────────────────
//
// Strategy:
//   1. Place n nodes with good separation
//   2. Build a spanning tree using only non-crossing edges (planar by construction)
//   3. Add extra non-crossing edges until budget exhausted — these stay straight
//   4. Only AFTER the planar base is done, consider remaining desired edges;
//      add them as curves if they don't introduce crossings with other curves
//   5. Patch any degree-1 nodes (max 1 allowed)

function buildGraph(n: number, lo: number, hi: number, routeInspection = false): GraphState {
  const pos = placeNodes(n);
  const degrees = Array(n).fill(0);
  const edgeSet = new Set<string>();
  const edges: Edge[] = [];

  function key(a: number, b: number) {
    return [Math.min(a, b), Math.max(a, b)].join("-");
  }

  function canAddStraight(a: number, b: number): boolean {
    if (degrees[a] >= 5 || degrees[b] >= 5) return false;
    if (edgeSet.has(key(a, b))) return false;
    if (crossesAnyEdge(pos, edges, a, b)) return false;
    if (nodeOccludesEdge(pos, [], a, b)) return false; // pos-only check
    return true;
  }

  function addEdge(a: number, b: number): boolean {
    if (a === b) return false;
    if (degrees[a] >= 5 || degrees[b] >= 5) return false;
    if (edgeSet.has(key(a, b))) return false;
    edgeSet.add(key(a, b));
    edges.push({ a, b, w: rand(lo, hi) });
    degrees[a]++;
    degrees[b]++;
    return true;
  }

  // ── Step 1: Planar spanning tree ──────────────────────────────────────────
  // Order nodes by proximity (nearest-neighbour-ish) to get natural-looking trees
  const remaining = [...Array(n).keys()];
  const inTree = new Set<number>();
  const startNode = rand(0, n - 1);
  inTree.add(startNode);
  remaining.splice(remaining.indexOf(startNode), 1);

  while (remaining.length > 0) {
    // Find the closest (remaining, in-tree) pair that can be connected straight
    let bestDist = Infinity, bestSrc = -1, bestDst = -1;

    for (const src of inTree) {
      for (const dst of remaining) {
        const d = dist(pos[src], pos[dst]);
        if (d < bestDist && canAddStraight(src, dst)) {
          bestDist = d;
          bestSrc = src;
          bestDst = dst;
        }
      }
    }

    if (bestSrc === -1) {
      // No non-crossing edge found — fall back to any pair
      for (const src of inTree) {
        for (const dst of remaining) {
          if (!edgeSet.has(key(src, dst)) && degrees[src] < 5 && degrees[dst] < 5) {
            bestSrc = src;
            bestDst = dst;
            break;
          }
        }
        if (bestSrc !== -1) break;
      }
    }

    if (bestSrc === -1) break;
    addEdge(bestSrc, bestDst);
    inTree.add(bestDst);
    remaining.splice(remaining.indexOf(bestDst), 1);
  }

  // ── Step 2: Add extra straight (planar) edges ─────────────────────────────
  const extraBudget = rand(0, n);

  // Sort candidate pairs by length (shorter edges first — less likely to cross)
  const pairs: [number, number][] = [];
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      if (!edgeSet.has(key(a, b))) pairs.push([a, b]);
  pairs.sort(([a1, b1], [a2, b2]) => dist(pos[a1], pos[b1]) - dist(pos[a2], pos[b2]));

  let straightAdded = 0;
  for (const [a, b] of pairs) {
    if (straightAdded >= extraBudget) break;
    if (canAddStraight(a, b)) {
      addEdge(a, b);
      straightAdded++;
    }
  }

  // ── Step 3: Patch degree-1 nodes (at most one allowed) ───────────────────
  function deg1Nodes() { return [...Array(n).keys()].filter(i => degrees[i] === 1); }
  let d1 = deg1Nodes();
  while (d1.length > 1) {
    let patched = false;
    outer: for (let i = 0; i < d1.length - 1; i++) {
      for (let j = i + 1; j < d1.length; j++) {
        if (addEdge(d1[i], d1[j])) { patched = true; break outer; }
      }
    }
    if (!patched) {
      const target = d1[0];
      const cands = [...Array(n).keys()].filter(k =>
        k !== target && !edgeSet.has(key(k, target)) && degrees[k] < 5
      );
      if (!cands.length) break;
      // Pick closest candidate
      cands.sort((a, b) => dist(pos[a], pos[target]) - dist(pos[b], pos[target]));
      addEdge(target, cands[0]);
    }
    d1 = deg1Nodes();
  }

  // ── Step 4: Route inspection — ensure exactly 2 or 4 odd-degree nodes ───────
  if (routeInspection) {
    const oddNodes = () => [...Array(n).keys()].filter(i => degrees[i] % 2 !== 0);
    const evenNodes = () => [...Array(n).keys()].filter(i => degrees[i] % 2 === 0);

    let odds = oddNodes();
    let safety = 60;

    // Phase 1: reduce excess odds — pair them up until ≤ 4 remain
    while (odds.length > 4 && safety-- > 0) {
      let patched = false;
      outer: for (let i = 0; i < odds.length - 1; i++) {
        for (let j = i + 1; j < odds.length; j++) {
          const ok = canAddStraight(odds[i], odds[j])
            ? addEdge(odds[i], odds[j])
            : addEdge(odds[i], odds[j]);
          if (ok) { patched = true; break outer; }
        }
      }
      if (!patched) break;
      odds = oddNodes();
    }

    // Phase 2: if 0 odd nodes, add an edge between two even nodes to create 2 odds
    if (oddNodes().length === 0) {
      const evens = evenNodes();
      for (let i = 0; i < evens.length - 1; i++) {
        for (let j = i + 1; j < evens.length; j++) {
          if (!edgeSet.has(key(evens[i], evens[j])) && degrees[evens[i]] < 5 && degrees[evens[j]] < 5) {
            addEdge(evens[i], evens[j]);
            i = evens.length; break; // break both loops
          }
        }
      }
    }
    // Result is now 2 or 4 odd-degree nodes (handshaking lemma guarantees even count always)
  }

  const nodes: Node[] = pos.map((p, i) => ({ id: i, label: LABELS[i], x: p.x, y: p.y }));
  return { nodes, edges, degrees };
}

// ─── Pill position ───────────────────────────────────────────────────────────
// Samples the path at multiple t values and picks the position with best
// clearance from nodes and already-placed pills.
function evalPath(d: string, t: number): { x: number; y: number } {
  const q = d.match(/M([-\d.]+) ([-\d.]+)Q([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/);
  if (q) {
    const ax = +q[1], ay = +q[2], cpx = +q[3], cpy = +q[4], bx = +q[5], by = +q[6];
    const mt = 1 - t;
    return { x: mt*mt*ax + 2*mt*t*cpx + t*t*bx, y: mt*mt*ay + 2*mt*t*cpy + t*t*by };
  }
  const l = d.match(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/);
  if (l) return { x: +l[1] + t*(+l[3] - +l[1]), y: +l[2] + t*(+l[4] - +l[2]) };
  return { x: 0, y: 0 };
}

function pillPosition(
  d: string,
  nodes: Node[],
  placedPills: { x: number; y: number }[]
): { x: number; y: number } {
  const PILL_HALF = 22; // half-width clearance from other pills
  const candidates = [0.25, 0.33, 0.4, 0.5, 0.6, 0.67, 0.75];
  let best = evalPath(d, 0.5);
  let bestScore = -Infinity;

  for (const t of candidates) {
    const p = evalPath(d, t);
    // Min distance to any node centre
    const nodeMin = nodes.reduce((m, n) => Math.min(m, Math.hypot(p.x - n.x, p.y - n.y)), Infinity);
    // Min distance to any already-placed pill
    const pillMin = placedPills.reduce((m, pp) => Math.min(m, Math.hypot(p.x - pp.x, p.y - pp.y)), Infinity);
    // Score: prefer node clearance, then pill clearance, slight preference for t=0.5
    const score = Math.min(nodeMin, NODE_R * 3) + Math.min(pillMin, PILL_HALF * 3) * 0.5 - Math.abs(t - 0.5) * 4;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

// ─── Edge path builder ────────────────────────────────────────────────────────
// For edges that need a curve, try both sides x multiple bend amounts,
// picking whichever quadratic bezier crosses the fewest other edges.

function curveCrossings(
  nodes: Node[], edges: Edge[], eIdx: number,
  ax: number, ay: number, cpx: number, cpy: number, bx: number, by: number
): number {
  const SEGS = 14;
  const pts: [number, number][] = [];
  for (let s = 0; s <= SEGS; s++) {
    const t = s / SEGS, mt = 1 - t;
    pts.push([mt*mt*ax + 2*mt*t*cpx + t*t*bx, mt*mt*ay + 2*mt*t*cpy + t*t*by]);
  }
  let count = 0;
  for (let j = 0; j < edges.length; j++) {
    if (j === eIdx) continue;
    const f = edges[j];
    if (f.a === edges[eIdx].a || f.a === edges[eIdx].b ||
        f.b === edges[eIdx].a || f.b === edges[eIdx].b) continue;
    const fx1 = nodes[f.a].x, fy1 = nodes[f.a].y;
    const fx2 = nodes[f.b].x, fy2 = nodes[f.b].y;
    for (let s = 0; s < SEGS; s++) {
      if (segmentsIntersect(pts[s][0], pts[s][1], pts[s+1][0], pts[s+1][1], fx1, fy1, fx2, fy2)) {
        count++; break;
      }
    }
  }
  return count;
}

// Build all paths together so later curves can avoid earlier ones
function buildAllPaths(nodes: Node[], edges: Edge[]): string[] {
  const pos = nodes as Vec[];
  const paths: string[] = new Array(edges.length).fill("");

  // Committed control points for already-placed curves (to repel later curves)
  const committedCPs: { cpx: number; cpy: number }[] = [];

  // Approximate a bezier with points for proximity checking
  function bezierPts(ax: number, ay: number, cpx: number, cpy: number, bx: number, by: number, segs = 14): [number,number][] {
    const pts: [number,number][] = [];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs, mt = 1 - t;
      pts.push([mt*mt*ax + 2*mt*t*cpx + t*t*bx, mt*mt*ay + 2*mt*t*cpy + t*t*by]);
    }
    return pts;
  }

  // Min distance between two polylines
  function polylineMinDist(pa: [number,number][], pb: [number,number][]): number {
    let minD = Infinity;
    for (const [ax, ay] of pa)
      for (const [bx, by] of pb)
        minD = Math.min(minD, Math.hypot(ax - bx, ay - by));
    return minD;
  }

  // Count crossings of a candidate bezier against already-placed paths
  function crossingsAgainstPaths(
    eIdx: number, ax: number, ay: number, cpx: number, cpy: number, bx: number, by: number
  ): number {
    const pts = bezierPts(ax, ay, cpx, cpy, bx, by);
    let count = 0;
    // Against straight edges of other edges
    for (let j = 0; j < edges.length; j++) {
      if (j === eIdx) continue;
      const f = edges[j];
      if (f.a === edges[eIdx].a || f.a === edges[eIdx].b ||
          f.b === edges[eIdx].a || f.b === edges[eIdx].b) continue;
      if (paths[j] === "") {
        // Not yet placed — check against straight line
        const fx1 = nodes[f.a].x, fy1 = nodes[f.a].y;
        const fx2 = nodes[f.b].x, fy2 = nodes[f.b].y;
        for (let s = 0; s < pts.length - 1; s++) {
          if (segmentsIntersect(pts[s][0], pts[s][1], pts[s+1][0], pts[s+1][1], fx1, fy1, fx2, fy2)) {
            count++; break;
          }
        }
      } else if (paths[j].includes("Q")) {
        // Already placed curved path — check bezier vs bezier
        const qm = paths[j].match(/M([\d.]+) ([\d.]+)Q([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)/);
        if (qm) {
          const jPts = bezierPts(+qm[1], +qm[2], +qm[3], +qm[4], +qm[5], +qm[6]);
          if (polylineMinDist(pts, jPts) < 18) count++; // too close = penalise
        }
      }
    }
    // Penalise if control point is very close to a committed CP (curves overlapping)
    for (const cp of committedCPs) {
      if (Math.hypot(cpx - cp.cpx, cpy - cp.cpy) < 55) count += 2;
    }
    return count;
  }

  for (let eIdx = 0; eIdx < edges.length; eIdx++) {
    const e = edges[eIdx];
    const na = nodes[e.a], nb = nodes[e.b];
    const otherEdges = edges.filter((_, i) => i !== eIdx);

    const needsCurve =
      nodeOccludesEdge(pos, nodes, e.a, e.b) ||
      crossesAnyEdge(pos, otherEdges, e.a, e.b);

    if (!needsCurve) {
      paths[eIdx] = `M${na.x} ${na.y}L${nb.x} ${nb.y}`;
      continue;
    }

    const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
    const dx = nb.x - na.x, dy = nb.y - na.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;

    const bendAmounts = [
      len * 0.35, len * 0.5, len * 0.65, len * 0.85,
      len * 1.1, len * 1.4, len * 1.8, len * 2.2, len * 2.8
    ];

    let bestPath = "";
    let bestScore = Infinity;
    let bestCP = { cpx: 0, cpy: 0 };

    for (const side of [1, -1]) {
      for (const bend of bendAmounts) {
        const cpx = mx + nx * bend * side;
        const cpy = my + ny * bend * side;
        if (cpx < -60 || cpx > W + 60 || cpy < -60 || cpy > H + 60) continue;
        const score = crossingsAgainstPaths(eIdx, na.x, na.y, cpx, cpy, nb.x, nb.y) * 100 + bend * 0.002;
        if (score < bestScore) {
          bestScore = score;
          bestPath = `M${na.x} ${na.y}Q${cpx} ${cpy} ${nb.x} ${nb.y}`;
          bestCP = { cpx, cpy };
        }
      }
    }

    if (!bestPath) {
      const cpx = mx + nx * Math.min(120, len * 0.65);
      const cpy = my + ny * Math.min(120, len * 0.65);
      bestPath = `M${na.x} ${na.y}Q${cpx} ${cpy} ${nb.x} ${nb.y}`;
      bestCP = { cpx, cpy };
    }

    paths[eIdx] = bestPath;
    committedCPs.push(bestCP);
  }

  return paths;
}

// ─── Single edge path (for drag updates) ─────────────────────────────────────
// Only checks node occlusion (no cross-edge logic) — other edges are frozen.
function buildSinglePath(nodes: Node[], edges: Edge[], eIdx: number): string {
  const e = edges[eIdx];
  const na = nodes[e.a], nb = nodes[e.b];
  const pos = nodes as Vec[];

  // Only curve if a node sits on the straight line — ignore other edges entirely
  if (!nodeOccludesEdge(pos, nodes, e.a, e.b)) {
    return `M${na.x} ${na.y}L${nb.x} ${nb.y}`;
  }

  // Simple curve away from graph centroid — no scoring, no cross-checks
  const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
  const dx = nb.x - na.x, dy = nb.y - na.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;

  const gcx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const gcy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
  const dot = nx * (gcx - mx) + ny * (gcy - my);
  const side = dot > 0 ? -1 : 1;

  const bend = Math.min(120, len * 0.65);
  const cpx = mx + nx * bend * side;
  const cpy = my + ny * bend * side;
  return `M${na.x} ${na.y}Q${cpx} ${cpy} ${nb.x} ${nb.y}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GraphGenerator() {
  const [nodeCount, setNodeCount] = useState(6);
  const [routeInspection, setRouteInspection] = useState(false);
  const [graph, setGraph] = useState<GraphState>(() => buildGraph(6, 3, 15, false));
  const [selected, setSelected] = useState<number | null>(null);

  const generate = useCallback(() => {
    setGraph(buildGraph(nodeCount, 3, 15, routeInspection));
    setSelected(null);
  }, [nodeCount, routeInspection]);

  // ── Drag handling ──────────────────────────────────────────────────────────
  const dragging = useRef<{ nodeId: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function svgPoint(e: PointerEvent | React.PointerEvent<SVGElement>): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onNodePointerDown(e: React.PointerEvent<SVGElement>, nodeId: number) {
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    const pt = svgPoint(e);
    const node = graph.nodes[nodeId];
    dragging.current = { nodeId, ox: pt.x - node.x, oy: pt.y - node.y };
  }

  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    const { nodeId, ox, oy } = dragging.current;
    const pt = svgPoint(e);
    const x = Math.max(NODE_R + 4, Math.min(W - NODE_R - 4, pt.x - ox));
    const y = Math.max(NODE_R + 4, Math.min(H - NODE_R - 4, pt.y - oy));
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n),
    }));
  }

  function onSvgPointerUp() {
    dragging.current = null;
  }


  const { nodes, edges, degrees } = graph;
  const n = nodes.length;
  const oddSet = new Set(degrees.map((d, i) => d % 2 !== 0 ? i : -1).filter(i => i >= 0));

  const mat: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  edges.forEach(e => { mat[e.a][e.b] = e.w; mat[e.b][e.a] = e.w; });

  // Path cache: full recompute when not dragging, partial update during drag
  const pathCache = useRef<string[]>([]);
  const dragNodeId = dragging.current?.nodeId ?? null;

  if (dragNodeId === null) {
    // Not dragging — full recompute and store in cache
    pathCache.current = buildAllPaths(nodes, edges);
  } else {
    // Dragging — ONLY update edges directly touching the dragged node.
    // All other edges read from cache unchanged — no recalculation whatsoever.
    edges.forEach((e, i) => {
      if (e.a === dragNodeId || e.b === dragNodeId) {
        pathCache.current[i] = buildSinglePath(nodes, edges, i);
      }
      // else: leave pathCache.current[i] exactly as it was
    });
  }
  const paths = pathCache.current;

  return (
    <div style={{
      fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
      background: "#f0ede8",
      minHeight: "100vh",
      padding: "20px",
      boxSizing: "border-box",
    }}>
      {/* Control bar */}
      <div style={{
        background: "#fff", border: "1px solid #ddd8d0", borderRadius: 10,
        padding: "14px 18px", marginBottom: 14,
        display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#aaa49a", marginBottom: 6 }}>Nodes</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[5, 6, 7, 8, 9].map(v => (
              <ChipBtn key={v} active={nodeCount === v} onClick={() => setNodeCount(v)}>{v}</ChipBtn>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 36, background: "#e8e4de", flexShrink: 0 }} />

        {/* Route inspection checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
          <div
            onClick={() => setRouteInspection(v => !v)}
            style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${routeInspection ? "#1e4d32" : "#c4bfb5"}`,
              background: routeInspection ? "#1e4d32" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {routeInspection && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e4d32", lineHeight: 1.2 }}>Route inspection</div>
            <div style={{ fontSize: 11, color: "#aaa49a", lineHeight: 1.3 }}>Max 4 odd-degree nodes</div>
          </div>
        </label>

        <button onClick={generate} style={{
          background: "#1e4d32", color: "#fff", border: "none", borderRadius: 7,
          padding: "8px 22px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", marginLeft: "auto", whiteSpace: "nowrap",
        }}>
          Generate ↻
        </button>
      </div>

      {/* Graph + Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={{ background: "#fff", border: "1px solid #ddd8d0", borderRadius: 10, overflow: "hidden" }}>
          <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", touchAction: "none" }}
            onPointerMove={onSvgPointerMove} onPointerUp={onSvgPointerUp} onPointerLeave={onSvgPointerUp}>
            {(() => {
              const PILL_W = 32, PILL_H = 20, PILL_R = 10;
              const placedPills: { x: number; y: number }[] = [];
              return edges.map((e, i) => {
                const hl = selected !== null && (e.a === selected || e.b === selected);
                const edgeColor = hl ? "#d97706" : "#9ca3af";
                const mid = pillPosition(paths[i], nodes, placedPills);
                placedPills.push(mid);
                return (
                  <g key={i}>
                    <path d={paths[i]} fill="none"
                      stroke={edgeColor}
                      strokeWidth={hl ? 4.5 : 3}
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                    {/* Weight pill */}
                    <rect
                      x={mid.x - PILL_W / 2} y={mid.y - PILL_H / 2}
                      width={PILL_W} height={PILL_H} rx={PILL_R}
                      fill="#fff" stroke={edgeColor} strokeWidth={hl ? 2.5 : 1.8}
                    />
                    <text
                      x={mid.x} y={mid.y}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={13} fontWeight={700} fill={edgeColor}
                      fontFamily="'Inter',sans-serif"
                    >{e.w}</text>
                  </g>
                );
              });
            })()}
            {nodes.map(node => {
              const hl = node.id === selected;
              const isOdd = routeInspection && oddSet.has(node.id);
              return (
                <g key={node.id}
                  style={{ cursor: "grab" }}
                  onPointerDown={e => onNodePointerDown(e, node.id)}
                  onClick={() => { if (!dragging.current) setSelected(selected === node.id ? null : node.id); }}>
                  {isOdd && (
                    <circle cx={node.x} cy={node.y} r={NODE_R + 6}
                      fill="none" stroke="#dc2626" strokeWidth={2.5} strokeDasharray="4 3" />
                  )}
                  <circle cx={node.x} cy={node.y} r={NODE_R}
                    fill={hl ? "#d97706" : "#1e4d32"}
                    stroke={hl ? "#92400e" : "#163828"} strokeWidth={2.5} />
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={15} fontWeight={700} fill="#fff" fontFamily="'Inter',sans-serif">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ddd8d0", borderRadius: 10, padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa49a", marginBottom: 10 }}>
            Distance matrix
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle()}></th>
                {nodes.map(nd => (
                  <th key={nd.id} style={{ ...thStyle(), background: selected === nd.id ? "#fef3c7" : "#f5f2ee", color: selected === nd.id ? "#92400e" : "#374151" }}>
                    {nd.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((row, i) => (
                <tr key={i}>
                  <th style={{ ...thStyle(), background: selected === i ? "#fef3c7" : "#f5f2ee", color: selected === i ? "#92400e" : "#374151" }}>
                    {row.label}
                  </th>
                  {nodes.map((_, j) => {
                    const isDiag = i === j;
                    const val = mat[i][j];
                    const hl = selected !== null && (selected === i || selected === j) && !isDiag && val !== null;
                    return (
                      <td key={j} style={{
                        border: "1px solid #e8e4de", padding: "8px 14px", textAlign: "center",
                        fontSize: 13, minWidth: 42,
                        background: isDiag ? "#f5f2ee" : hl ? "#fffbeb" : "#fff",
                        color: isDiag ? "#c4bfb5" : val !== null ? (hl ? "#92400e" : "#111827") : "#d1cdc5",
                        fontWeight: hl ? 600 : 400,
                      }}>
                        {isDiag ? "—" : val !== null ? val : "–"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

function thStyle(): React.CSSProperties {
  return { border: "1px solid #e8e4de", padding: "8px 14px", textAlign: "center", background: "#f5f2ee", color: "#374151", fontWeight: 600, fontSize: 13, minWidth: 42 };
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: "5px 11px",
      border: `1px solid ${active ? "#1e4d32" : "#d6d0c8"}`,
      borderRadius: 6, background: active ? "#1e4d32" : "#fff",
      color: active ? "#fff" : "#6b7280", cursor: "pointer",
      fontFamily: "inherit", fontWeight: active ? 600 : 400,
    }}>
      {children}
    </button>
  );
}
