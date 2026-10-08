// validateProblem — the CI contract checker for Decision Maths tools (the analog
// of the CS validateTopic / the maths generator smoke test).
//
// It samples each template many times and, for a batch of generated problems,
// checks that: templates reference real nodes and sample weights in range; the
// generated network is connected; every SolveStep references edges/cells that
// exist; and — the key safety net that makes "generate fast" sound — the tool's
// declared answer AND its solve() running total both agree with an INDEPENDENT
// brute-force reference written from scratch here, sharing no code with the tool:
//   • reference "mst" (default) — Prim's MST (the tools use Kruskal);
//   • reference "nearestNeighbour" — Dijkstra least distances + nearest neighbour
//     from problem.start (tsp.ts uses exhaustive path search). Also checks the NN
//     choices are tie-free and the declared tour matches.
// A problem may carry a `kind`, which picks its own reference (kruskal / primNetwork / primMatrix:
// an independent Prim or Kruskal that must agree on the tree, its ORDER and its weight, on a network that is planar with
// all-different weights; tspLower / tspBounds / tspTable: Dijkstra least distances, an independent deleted-vertex
// lower bound, and — for ≤ 6 vertices — a permutation search proving lower ≤ optimal ≤ upper).

import { sampleTemplate } from "./templating";
import type { DecisionProblemExport, Network, NetworkTemplate } from "./types";

// ── Independent reference: Prim's MST (nothing shared with the tools' Kruskal) ──
export function primMST(network: Network): { total: number; connected: boolean } {
  const ids = network.nodes.map((n) => n.id);
  if (ids.length === 0) return { total: 0, connected: true };

  const adj: Record<string, { to: string; w: number }[]> = {};
  for (const id of ids) adj[id] = [];
  for (const e of network.edges) {
    adj[e.from].push({ to: e.to, w: e.weight });
    adj[e.to].push({ to: e.from, w: e.weight });
  }

  const inTree = new Set<string>([ids[0]]);
  let total = 0;
  while (inTree.size < ids.length) {
    let best: { to: string; w: number } | null = null;
    for (const u of inTree) {
      for (const { to, w } of adj[u]) {
        if (inTree.has(to)) continue;
        if (best === null || w < best.w) best = { to, w };
      }
    }
    if (best === null) return { total, connected: false }; // disconnected
    inTree.add(best.to);
    total += best.w;
  }
  return { total, connected: true };
}

// ── Independent reference: least distances by Dijkstra, then nearest neighbour ──
function dijkstra(network: Network, src: string): Record<string, number> {
  const d: Record<string, number> = {};
  for (const n of network.nodes) d[n.id] = Infinity;
  d[src] = 0;
  const done = new Set<string>();
  while (done.size < network.nodes.length) {
    let u: string | null = null;
    for (const n of network.nodes) if (!done.has(n.id) && (u === null || d[n.id] < d[u])) u = n.id;
    if (u === null || d[u] === Infinity) break;
    done.add(u);
    for (const e of network.edges) {
      const v = e.from === u ? e.to : e.to === u ? e.from : null;
      if (v !== null && d[u] + e.weight < d[v]) d[v] = d[u] + e.weight;
    }
  }
  return d;
}

export function referenceNearestNeighbour(
  network: Network,
  start: string,
): { tour: string[]; total: number; tied: boolean } {
  const all: Record<string, Record<string, number>> = {};
  for (const n of network.nodes) all[n.id] = dijkstra(network, n.id);
  const unvisited = new Set(network.nodes.map((n) => n.id));
  unvisited.delete(start);
  const tour = [start];
  let total = 0;
  let tied = false;
  let at = start;
  while (unvisited.size > 0) {
    const left = [...unvisited];
    const min = Math.min(...left.map((v) => all[at][v]));
    const nearest = left.filter((v) => all[at][v] === min);
    if (nearest.length > 1) tied = true;
    total += min;
    tour.push(nearest[0]);
    unvisited.delete(nearest[0]);
    at = nearest[0];
  }
  total += all[at][start];
  tour.push(start);
  return { tour, total, tied };
}

function checkTemplate(t: NetworkTemplate, errors: string[], samples = 60) {
  const declaredIds = new Set(t.nodes.map((n) => n.id));
  for (const e of t.edges) {
    if (!declaredIds.has(e.from) || !declaredIds.has(e.to))
      errors.push(`template "${t.id}" edge "${e.id}" references a missing node (${e.from}→${e.to})`);
    if (e.weight[0] > e.weight[1]) errors.push(`template "${t.id}" edge "${e.id}" has an inverted weight range`);
  }
  for (let i = 0; i < samples; i++) {
    const net = sampleTemplate(t);
    const nodeIds = new Set(net.nodes.map((n) => n.id));
    for (const e of net.edges) {
      if (!nodeIds.has(e.from) || !nodeIds.has(e.to))
        errors.push(`template "${t.id}" sampled edge "${e.id}" references a missing node`);
      const src = t.edges.find((x) => x.id === e.id);
      if (src && (e.weight < src.weight[0] || e.weight > src.weight[1]))
        errors.push(`template "${t.id}" sampled edge "${e.id}" weight ${e.weight} out of range [${src.weight}]`);
    }
    if (!primMST(net).connected)
      errors.push(`template "${t.id}" sampled a DISCONNECTED network — its mandatory edges must span every node`);
  }
}


// ── Independent references for the MST kinds ──────────────────────────────────
/** Prim's from `start`, written from scratch: the edges in the order they join. */
export function referencePrimOrder(network: Network, start: string): string[] {
  const have = new Set([start]);
  const order: string[] = [];
  while (have.size < network.nodes.length) {
    let best: (typeof network.edges)[number] | null = null;
    for (const e of network.edges) {
      if (have.has(e.from) === have.has(e.to)) continue;
      if (best === null || e.weight < best.weight) best = e;
    }
    if (!best) break;
    have.add(have.has(best.from) ? best.to : best.from);
    order.push(best.id);
  }
  return order;
}

/** Kruskal's, written from scratch with a label array instead of union-find: the edges in the order they are accepted. */
export function referenceKruskalOrder(network: Network): string[] {
  const label: Record<string, string> = Object.fromEntries(network.nodes.map((n) => [n.id, n.id]));
  const order: string[] = [];
  for (const e of [...network.edges].sort((a, b) => a.weight - b.weight)) {
    const la = label[e.from], lb = label[e.to];
    if (la === lb) continue;
    for (const k of Object.keys(label)) if (label[k] === lb) label[k] = la;
    order.push(e.id);
  }
  return order;
}

function crossingEdges(network: Network): boolean {
  const at = Object.fromEntries(network.nodes.map((n) => [n.id, n]));
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
  for (let i = 0; i < network.edges.length; i++)
    for (let j = i + 1; j < network.edges.length; j++) {
      const e = network.edges[i], f = network.edges[j];
      if (e.from === f.from || e.from === f.to || e.to === f.from || e.to === f.to) continue;
      const a = at[e.from], b = at[e.to], c = at[f.from], d = at[f.to];
      if (ccw(a, c, d) * ccw(b, c, d) < 0 && ccw(a, b, c) * ccw(a, b, d) < 0) return true;
    }
  return false;
}

// ── Independent references for the TSP kinds ──────────────────────────────────
function leastTable(network: Network): Record<string, Record<string, number>> {
  const all: Record<string, Record<string, number>> = {};
  for (const n of network.nodes) all[n.id] = dijkstra(network, n.id);
  return all;
}

/** Deleted-vertex lower bound, from scratch: MST of the rest (Prim on the least-distance table) + the two shortest links from the deleted vertex. */
export function referenceLowerBound(network: Network, deleted: string): { total: number; tied: boolean } {
  const all = leastTable(network);
  const rest = network.nodes.map((n) => n.id).filter((v) => v !== deleted);
  const have = new Set([rest[0]]);
  let mst = 0;
  let tied = false;
  while (have.size < rest.length) {
    const opts: { w: number; v: string }[] = [];
    for (const u of have) for (const v of rest) if (!have.has(v)) opts.push({ w: all[u][v], v });
    opts.sort((x, y) => x.w - y.w);
    if (opts.length > 1 && opts[0].w === opts[1].w && opts[0].v !== opts[1].v) tied = true;
    mst += opts[0].w;
    have.add(opts[0].v);
  }
  const links = rest.map((v) => all[deleted][v]).sort((x, y) => x - y);
  if (links.length > 2 && links[1] === links[2]) tied = true;
  return { total: mst + links[0] + links[1], tied };
}

/** The shortest closed tour through every vertex of the least-distance table, by trying every order (≤ 7 vertices). */
export function referenceOptimalTour(network: Network): number {
  const all = leastTable(network);
  const ids = network.nodes.map((n) => n.id);
  const [first, ...rest] = ids;
  let best = Infinity;
  const go = (at: string, left: string[], len: number) => {
    if (len >= best) return;
    if (!left.length) { best = Math.min(best, len + all[at][first]); return; }
    left.forEach((v, i) => go(v, [...left.slice(0, i), ...left.slice(i + 1)], len + all[at][v]));
  };
  go(first, rest, 0);
  return best;
}

export function validateProblem(exp: DecisionProblemExport, levels = exp.levels ?? [1], batch = 60): string[] {
  const errors: string[] = [];

  for (const t of exp.templates) checkTemplate(t, errors);

  for (const sub of exp.subTools ?? [undefined]) {
    for (const level of levels) {
      for (let i = 0; i < batch; i++) {
        const where = `generate(${level}${sub ? `, ${sub}` : ""})`;
        const p = exp.generate(level, sub ? { subTool: sub, options: {} } : undefined);
        const nodeIds = new Set(p.network.nodes.map((n) => n.id));
        const edgeIds = new Set(p.network.edges.map((e) => e.id));

        const mst = primMST(p.network);
        if (!mst.connected) {
          errors.push(`${where} produced a disconnected network`);
          continue;
        }
        let ref: { total: number; name: string };
        const kind = p.kind;
        if (kind === "kruskal" || kind === "primNetwork" || kind === "primMatrix") {
          ref = { total: mst.total, name: "MST weight" };
          if (new Set(p.network.edges.map((e) => e.weight)).size !== p.network.edges.length) errors.push(`${where} has two edges of equal weight — the tree would not be unique`);
          if (crossingEdges(p.network)) errors.push(`${where} drew edges that cross`);
          const want = kind === "kruskal" ? referenceKruskalOrder(p.network) : referencePrimOrder(p.network, p.start ?? "");
          if (kind !== "kruskal" && (!p.start || !nodeIds.has(p.start))) errors.push(`${where} has no valid start vertex (${p.start})`);
          if ((p.answer.edges ?? []).join() !== want.join()) errors.push(`${where} answer.edges ${p.answer.edges?.join()} ≠ independent ${kind} order ${want.join()}`);
          if (want.length !== p.network.nodes.length - 1) errors.push(`${where}: a spanning tree should have n−1 edges`);
        } else if (kind === "tspLower" || kind === "tspBounds" || kind === "tspTable") {
          if (kind === "tspTable") {
            ref = { total: p.answer.value ?? -1, name: "table" };
          } else {
            const lowerRef = referenceLowerBound(p.network, p.deleted ?? "");
            if (!p.deleted || !nodeIds.has(p.deleted)) errors.push(`${where} has no valid deleted vertex (${p.deleted})`);
            if (lowerRef.tied) errors.push(`${where} has a tie in the lower-bound working — ambiguous question`);
            const lower = p.bounds?.lower;
            if (lower !== lowerRef.total) errors.push(`${where} lower bound ${lower} ≠ independent ${lowerRef.total}`);
            if (kind === "tspBounds") {
              if (!p.start || !nodeIds.has(p.start)) errors.push(`${where} has no valid start vertex (${p.start})`);
              const nn = referenceNearestNeighbour(p.network, p.start ?? "");
              if (nn.tied) errors.push(`${where} has a tied nearest-neighbour choice from ${p.start}`);
              if (p.bounds?.upper !== nn.total) errors.push(`${where} upper bound ${p.bounds?.upper} ≠ independent ${nn.total}`);
              if (p.network.nodes.length <= 7) {
                const opt = referenceOptimalTour(p.network);
                if (!(lowerRef.total <= opt && opt <= nn.total)) errors.push(`${where}: lower ${lowerRef.total} ≤ optimal ${opt} ≤ upper ${nn.total} does not hold`);
              }
              ref = { total: nn.total, name: "upper bound" };
            } else {
              ref = { total: lowerRef.total, name: "lower bound" };
            }
          }
        } else if (exp.reference === "nearestNeighbour" || kind === "tspNN") {
          if (!p.start || !nodeIds.has(p.start)) {
            errors.push(`${where} has no valid start vertex (${p.start})`);
            continue;
          }
          const nn = referenceNearestNeighbour(p.network, p.start);
          ref = { total: nn.total, name: "nearest-neighbour tour length" };
          if (nn.tied) errors.push(`${where} has a tied nearest-neighbour choice from ${p.start} — ambiguous question`);
          if ((p.answer.tour ?? []).join("") !== nn.tour.join(""))
            errors.push(`${where} answer.tour ${p.answer.tour?.join("")} ≠ brute-force NN tour ${nn.tour.join("")}`);
        } else {
          ref = { total: mst.total, name: "MST weight" };
        }
        if (p.answer.value !== ref.total)
          errors.push(`${where} answer.value ${p.answer.value} ≠ brute-force ${ref.name} ${ref.total}`);

        const steps = exp.solve(p);
        if (steps.length === 0) {
          errors.push(`solve() returned no steps for a ${where} problem`);
          continue;
        }
        for (const s of steps) {
          for (const eid of [...Object.keys(s.edgeStates), ...Object.keys(s.edgeOrder ?? {})])
            if (!edgeIds.has(eid)) errors.push(`a SolveStep references edge "${eid}" not in the network`);
          for (const c of s.matrixCells ?? [])
            if (!nodeIds.has(c.r) || !nodeIds.has(c.c))
              errors.push(`a SolveStep matrix cell references a missing node (${c.r},${c.c})`);
          for (const v of [...Object.keys(s.matrixOrder ?? {}), ...(s.matrixCrossed ?? []), ...Object.keys(s.nodeRoles ?? {}), ...Object.keys(s.nodeStates ?? {})])
            if (!nodeIds.has(v)) errors.push(`a SolveStep references vertex "${v}" not in the network`);
          if (!s.caption.trim()) errors.push(`a SolveStep has an empty caption`);
        }
        const last = steps[steps.length - 1];
        if (last.runningTotal !== ref.total)
          errors.push(`solve() final runningTotal ${last.runningTotal} ≠ brute-force ${ref.name} ${ref.total}`);
      }
    }
  }

  return errors;
}
