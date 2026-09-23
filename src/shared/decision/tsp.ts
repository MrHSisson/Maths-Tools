// Travelling Salesperson building blocks, shared by any tool that works on a
// "complete network satisfying the triangle inequality":
//
//   • leastDistances(network)   — the table of least distances. For a PRACTICAL
//     network (not every pair joined directly, or a direct road that isn't the
//     shortest way), every entry becomes the shortest route, with that route kept
//     so a tour on the table can be expanded back into the real network.
//   • nearestNeighbour(table, start) — the nearest-neighbour upper bound, with a
//     `tied` flag so generators can reject questions whose choices are ambiguous.
//   • completeNetworkLayout(n)  — a drawing of K3–K6 where no weight label
//     collides with another label, a node or an edge it doesn't belong to
//     (placeEdgeLabels picks each label's position along its edge).
//
// validate.ts checks all of this against an independent Dijkstra + NN written
// from scratch there, so these helpers never get to mark their own homework.

import type { GNode, Network } from "./types";

export interface LeastDistances {
  ids: string[]; // sorted vertex ids
  dist: Record<string, Record<string, number>>; // least distance a→b (Infinity if unreachable)
  path: Record<string, Record<string, string[]>>; // one shortest route a→b, as a vertex list (a … b)
  unique: Record<string, Record<string, boolean>>; // is that shortest route the only one?
  direct: Record<string, Record<string, number | null>>; // direct edge weight, null when not joined
}

/** Least distances between every pair — exhaustive simple-path search, which is
 *  exact and instant at the network sizes these tools draw (≤ 9 vertices). */
export function leastDistances(network: Network): LeastDistances {
  const ids = network.nodes.map((n) => n.id).sort();
  const adj: Record<string, { to: string; w: number }[]> = {};
  const direct: LeastDistances["direct"] = {};
  for (const a of ids) {
    adj[a] = [];
    direct[a] = {};
    for (const b of ids) direct[a][b] = null;
  }
  for (const e of network.edges) {
    adj[e.from].push({ to: e.to, w: e.weight });
    adj[e.to].push({ to: e.from, w: e.weight });
    direct[e.from][e.to] = e.weight;
    direct[e.to][e.from] = e.weight;
  }

  const dist: LeastDistances["dist"] = {};
  const path: LeastDistances["path"] = {};
  const unique: LeastDistances["unique"] = {};
  for (const src of ids) {
    const best: Record<string, { d: number; p: string[]; count: number }> = {};
    for (const b of ids) best[b] = { d: Infinity, p: [], count: 0 };
    const walk = (at: string, d: number, route: string[], seen: Set<string>) => {
      const b = best[at];
      if (d < b.d) best[at] = { d, p: [...route], count: 1 };
      else if (d === b.d) b.count++;
      for (const { to, w } of adj[at]) {
        if (seen.has(to)) continue;
        seen.add(to);
        route.push(to);
        walk(to, d + w, route, seen);
        route.pop();
        seen.delete(to);
      }
    };
    walk(src, 0, [src], new Set([src]));
    dist[src] = {};
    path[src] = {};
    unique[src] = {};
    for (const b of ids) {
      dist[src][b] = best[b].d;
      path[src][b] = best[b].p;
      unique[src][b] = best[b].count === 1;
    }
  }
  return { ids, dist, path, unique, direct };
}

export interface NearestNeighbourResult {
  tour: string[]; // closed: start … start
  legs: number[]; // length of each leg, tour.length − 1 of them
  total: number;
  tied: boolean; // some "nearest" choice had a tie — the question would be ambiguous
}

/** Nearest neighbour on a complete table: from the current vertex, go to the
 *  nearest unvisited vertex; once all are visited, return to the start. */
export function nearestNeighbour(
  ids: string[],
  dist: Record<string, Record<string, number>>,
  start: string,
): NearestNeighbourResult {
  const tour = [start];
  const legs: number[] = [];
  const visited = new Set([start]);
  let tied = false;
  let at = start;
  while (visited.size < ids.length) {
    const options = ids.filter((v) => !visited.has(v)).sort((a, b) => dist[at][a] - dist[at][b] || a.localeCompare(b));
    if (options.length > 1 && dist[at][options[0]] === dist[at][options[1]]) tied = true;
    const next = options[0];
    legs.push(dist[at][next]);
    tour.push(next);
    visited.add(next);
    at = next;
  }
  legs.push(dist[at][start]);
  tour.push(start);
  return { tour, legs, total: legs.reduce((s, x) => s + x, 0), tied };
}

// ── Drawing a complete network ───────────────────────────────────────────────
// K5 and K6 can't be drawn without crossings, and at crossings the midpoint of
// one edge sits on (or next to) another — so labels can't all live at midpoints.
// Instead each edge gets its own label position `labelAt` (a fraction along the
// edge), chosen greedily so every weight label clears every node, every other
// label and every edge it doesn't belong to. K4 is drawn planar (a triangle round
// a centre vertex); K5/K6 as a jittered convex ring — the familiar textbook
// picture, where crossings are expected and harmless once the labels are clear.

const LABELS = ["A", "B", "C", "D", "E", "F"];
const NODE_R = 22;
const LABEL_TS = [0.5, 0.42, 0.58, 0.35, 0.65, 0.3, 0.7];

interface Pt { x: number; y: number }

function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** Choose a label position along every edge so each weight label (≈26×22 box)
 *  is clear of all nodes, all other labels and all other edges; null if the
 *  drawing can't be labelled cleanly (or an edge runs past a node). */
export function placeEdgeLabels(network: Network): Record<string, number> | null {
  const at: Record<string, Pt> = {};
  for (const n of network.nodes) at[n.id] = n;
  const segs = network.edges.map((e) => ({ id: e.id, a: at[e.from], b: at[e.to], from: e.from, to: e.to }));
  for (const s of segs)
    for (const n of network.nodes)
      if (n.id !== s.from && n.id !== s.to && segDist(n, s.a, s.b) < NODE_R * 2) return null;

  const placed: Pt[] = [];
  const out: Record<string, number> = {};
  for (const s of segs) {
    let chosen: number | null = null;
    for (const t of LABEL_TS) {
      const p = { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
      if (network.nodes.some((n) => Math.hypot(p.x - n.x, p.y - n.y) < NODE_R + 32)) continue;
      if (placed.some((q) => Math.abs(q.x - p.x) < 38 && Math.abs(q.y - p.y) < 32)) continue;
      if (segs.some((o) => o.id !== s.id && segDist(p, o.a, o.b) < 19)) continue;
      chosen = t;
      placed.push(p);
      break;
    }
    if (chosen === null) return null;
    out[s.id] = chosen;
  }
  return out;
}

function candidatePositions(n: number): Pt[] {
  const jitter = (v: number, r: number) => v + (Math.random() - 0.5) * r;
  if (n <= 4) {
    // planar: an outer triangle round a centre vertex, randomly flipped
    const flip = Math.random() < 0.5;
    const tri: Pt[] = [{ x: 340, y: 60 }, { x: 70, y: 470 }, { x: 610, y: 470 }, { x: 340, y: 330 }].slice(0, Math.max(n, 3));
    return tri.map((p) => ({ x: Math.round(jitter(p.x, 70)), y: Math.round(jitter(flip ? 530 - p.y : p.y, 50)) }));
  }
  const off = Math.random() * Math.PI * 2;
  return [...Array(n)].map((_, i) => {
    const a = off + (i * 2 * Math.PI) / n + (Math.random() - 0.5) * 0.35;
    const r = jitter(215, 40);
    return { x: Math.round(340 + r * 1.25 * Math.cos(a)), y: Math.round(260 + r * Math.sin(a)) };
  });
}

/** A legible straight-line drawing of the complete graph K_n (n = 3–6): vertices
 *  lettered A, B, … in reading order, every pair joined by an edge (id "AB", weight
 *  0 — the caller fills weights) with a clash-free `labelAt`. */
export function completeNetworkLayout(n: number): Network {
  for (;;) {
    const pos = candidatePositions(n);
    if (pos.some((p, i) => pos.some((q, j) => j > i && Math.hypot(p.x - q.x, p.y - q.y) < 140))) continue;
    const ordered = [...pos].sort((a, b) => Math.round(a.y / 110) - Math.round(b.y / 110) || a.x - b.x);
    const nodes: GNode[] = ordered.map((p, i) => ({ id: LABELS[i], x: p.x, y: p.y }));
    const edges = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        edges.push({ id: LABELS[i] + LABELS[j], from: LABELS[i], to: LABELS[j], weight: 0 });
    const net: Network = { nodes, edges };
    const labels = placeEdgeLabels(net);
    if (!labels) continue; // ~4% of K6 draws — just redraw
    for (const e of net.edges) e.labelAt = labels[e.id];
    return net;
  }
}
