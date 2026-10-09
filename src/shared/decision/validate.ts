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
  given = false,
): { tour: string[]; total: number; tied: boolean } {
  const all = leastTable(network, given);
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

// ── Independent reference for Route Inspection ────────────────────────────────
// Bellman–Ford distances and a bitmask DP over the odd vertices (nothing shared with routeInspection.ts's Floyd–Warshall + recursion).
export function referenceRoute(network: Network, ends?: { start: string; end: string }): { length: number; odd: number; tied: boolean } {
  const ids = network.nodes.map((n) => n.id);
  const deg: Record<string, number> = {};
  for (const id of ids) deg[id] = 0;
  for (const e of network.edges) { deg[e.from]++; deg[e.to]++; }
  const odd = ids.filter((id) => deg[id] % 2 === 1);
  const need = ends ? odd.filter((v) => v !== ends.start && v !== ends.end) : odd;
  const dist = (a: string, b: string): number => {
    const d: Record<string, number> = Object.fromEntries(ids.map((id) => [id, Infinity]));
    d[a] = 0;
    for (let i = 0; i < ids.length; i++)
      for (const e of network.edges) {
        if (d[e.from] + e.weight < d[e.to]) d[e.to] = d[e.from] + e.weight;
        if (d[e.to] + e.weight < d[e.from]) d[e.from] = d[e.to] + e.weight;
      }
    return d[b];
  };
  const m = need.length;
  const cost = need.map((a) => need.map((b) => (a === b ? 0 : dist(a, b))));
  // best[mask] = [cheapest cost, how many pairings achieve it] for pairing exactly the vertices in mask
  const best = new Map<number, [number, number]>([[0, [0, 1]]]);
  for (let mask = 1; mask < 1 << m; mask++) {
    if (popcount(mask) % 2) continue;
    const i = lowestBit(mask);
    let min = Infinity, count = 0;
    for (let j = i + 1; j < m; j++) {
      if (!(mask & (1 << j))) continue;
      const rest = best.get(mask & ~(1 << i) & ~(1 << j));
      if (!rest) continue;
      const c = rest[0] + cost[i][j];
      if (c < min) { min = c; count = rest[1]; } else if (c === min) count += rest[1];
    }
    best.set(mask, [min, count]);
  }
  const all = best.get((1 << m) - 1)!;
  return { length: network.edges.reduce((t, e) => t + e.weight, 0) + all[0], odd: odd.length, tied: all[1] > 1 };
}
const popcount = (x: number): number => { let n = 0; for (; x; x &= x - 1) n++; return n; };
const lowestBit = (x: number): number => { let i = 0; while (!(x & (1 << i))) i++; return i; };

// ── Independent references for the TSP kinds ──────────────────────────────────
function leastTable(network: Network, given = false): Record<string, Record<string, number>> {
  const all: Record<string, Record<string, number>> = {};
  if (given) {
    // a table of journey times as given: the weights ARE the table (no shorter-route replacement)
    for (const a of network.nodes) { all[a.id] = {}; for (const b of network.nodes) all[a.id][b.id] = a.id === b.id ? 0 : Infinity; }
    for (const e of network.edges) { all[e.from][e.to] = e.weight; all[e.to][e.from] = e.weight; }
    return all;
  }
  for (const n of network.nodes) all[n.id] = dijkstra(network, n.id);
  return all;
}

/** Deleted-vertex lower bound, from scratch: the MST of the rest (found by trying EVERY set of n−2 edges of the table — so a tie for the
 *  minimum shows up as "tied") + the two shortest links from the deleted vertex (a tie for second place also counts). */
export function referenceLowerBound(network: Network, deleted: string, given = false): { total: number; tied: boolean } {
  const all = leastTable(network, given);
  const rest = network.nodes.map((n) => n.id).filter((v) => v !== deleted);
  const pairs: { a: string; b: string; w: number }[] = [];
  for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) pairs.push({ a: rest[i], b: rest[j], w: all[rest[i]][rest[j]] });
  let best = Infinity;
  let bestCount = 0;
  const pickEdges = (from: number, chosen: number[]) => {
    if (chosen.length === rest.length - 1) {
      const label: Record<string, string> = Object.fromEntries(rest.map((v) => [v, v]));
      let w = 0;
      for (const k of chosen) {
        const la = label[pairs[k].a], lb = label[pairs[k].b];
        if (la === lb) return;
        for (const key of Object.keys(label)) if (label[key] === lb) label[key] = la;
        w += pairs[k].w;
      }
      if (w < best) { best = w; bestCount = 1; } else if (w === best) bestCount++;
      return;
    }
    for (let k = from; k < pairs.length; k++) pickEdges(k + 1, [...chosen, k]);
  };
  pickEdges(0, []);
  const links = rest.map((v) => all[deleted][v]).sort((x, y) => x - y);
  return { total: best + links[0] + links[1], tied: bestCount !== 1 || (links.length > 2 && links[1] === links[2]) };
}

/** The shortest closed tour through every vertex of the least-distance table, by trying every order (≤ 7 vertices). */
export function referenceOptimalTour(network: Network, given = false): number {
  const all = leastTable(network, given);
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

  for (const entry of exp.subTools ?? [undefined]) {
    const ctx = entry === undefined ? undefined : typeof entry === "string" ? { subTool: entry, options: {} } : entry;
    const sub = ctx?.subTool;
    for (const level of levels) {
      for (let i = 0; i < batch; i++) {
        const opts = ctx && Object.keys(ctx.options).length ? ` ${JSON.stringify(ctx.options)}` : "";
        const where = `generate(${level}${sub ? `, ${sub}${opts}` : ""})`;
        const p = exp.generate(level, ctx);
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
        } else if (kind === "routeClassify" || kind === "routeClosed" || kind === "routeOpen") {
          if (crossingEdges(p.network)) errors.push(`${where} drew edges that cross`);
          const ends = kind === "routeOpen" && p.route?.end ? { start: p.route.start, end: p.route.end } : undefined;
          const r = referenceRoute(p.network, ends);
          if (kind !== "routeClassify" && r.tied) errors.push(`${where} has two equally cheap pairings — ambiguous question`);
          if (kind === "routeClosed" && r.odd === 0) errors.push(`${where} has no odd vertices — nothing to pair`);
          if (kind !== "routeClassify" && r.odd !== 2 && r.odd !== 4) errors.push(`${where} has ${r.odd} odd vertices (a route question has 2 or 4)`);
          if (ends && (!nodeIds.has(ends.start) || !nodeIds.has(ends.end))) errors.push(`${where} has an invalid start / finish`);
          ref = kind === "routeClassify" ? { total: r.odd, name: "odd vertices" } : { total: r.length, name: "route length" };
        } else if (kind === "tspLower" || kind === "tspBounds" || kind === "tspTable") {
          if (kind === "tspTable") {
            // the pairs whose table entry is not simply the drawn edge, by an independent Dijkstra
            const all = leastTable(p.network);
            let count = 0;
            for (const a of p.network.nodes) for (const b of p.network.nodes) {
              if (a.id >= b.id) continue;
              const direct = p.network.edges.find((e) => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id));
              if (!direct || all[a.id][b.id] < direct.weight) count++;
            }
            ref = { total: count, name: "entries to complete" };
            const lastT = exp.solve(p).slice(-1)[0];
            for (const a of p.network.nodes) for (const b of p.network.nodes)
              if (a.id !== b.id && lastT.matrix?.values[a.id][b.id] !== all[a.id][b.id]) errors.push(`${where}: final table entry ${a.id}${b.id} is ${lastT.matrix?.values[a.id][b.id]}, Dijkstra says ${all[a.id][b.id]}`);
          } else {
            const lowerRef = referenceLowerBound(p.network, p.deleted ?? "", !!p.givenTable);
            if (!p.deleted || !nodeIds.has(p.deleted)) errors.push(`${where} has no valid deleted vertex (${p.deleted})`);
            if (lowerRef.tied) errors.push(`${where} has a tie in the lower-bound working — ambiguous question`);
            const lower = p.bounds?.lower;
            if (lower !== lowerRef.total) errors.push(`${where} lower bound ${lower} ≠ independent ${lowerRef.total}`);
            if (kind === "tspBounds") {
              if (!p.start || !nodeIds.has(p.start)) errors.push(`${where} has no valid start vertex (${p.start})`);
              const nn = referenceNearestNeighbour(p.network, p.start ?? "", !!p.givenTable);
              if ((p.answer.tour ?? []).join("") !== nn.tour.join("")) errors.push(`${where} answer.tour ${p.answer.tour?.join("")} ≠ brute-force NN tour ${nn.tour.join("")}`);
              if (nn.tied) errors.push(`${where} has a tied nearest-neighbour choice from ${p.start}`);
              if (p.bounds?.upper !== nn.total) errors.push(`${where} upper bound ${p.bounds?.upper} ≠ independent ${nn.total}`);
              if (p.network.nodes.length <= 7) {
                const opt = referenceOptimalTour(p.network, !!p.givenTable);
                if (!(lowerRef.total <= opt && opt <= nn.total)) errors.push(`${where}: lower ${lowerRef.total} ≤ optimal ${opt} ≤ upper ${nn.total} does not hold`);
              }
              ref = { total: nn.total, name: "upper bound" };
            } else {
              ref = { total: lowerRef.total, name: "lower bound" };
            }
          }
        } else if (exp.reference === "nearestNeighbour" || kind === "tspNN") {
          const starts = p.starts?.length ? p.starts : p.start ? [p.start] : [];
          if (!starts.length || starts.some((s) => !nodeIds.has(s))) {
            errors.push(`${where} has no valid start vertex (${starts.join()})`);
            continue;
          }
          const runs = starts.map((s) => referenceNearestNeighbour(p.network, s, !!p.givenTable));
          const best = runs.reduce((a, b) => (b.total < a.total ? b : a));
          ref = { total: best.total, name: "nearest-neighbour tour length" };
          if (runs.some((r) => r.tied)) errors.push(`${where} has a tied nearest-neighbour choice from ${starts.join(" / ")} — ambiguous question`);
          if (new Set(runs.map((r) => r.total)).size !== runs.length) errors.push(`${where} asks for two starts with the same tour length`);
          if ((p.answer.tour ?? []).join("") !== best.tour.join(""))
            errors.push(`${where} answer.tour ${p.answer.tour?.join("")} ≠ brute-force NN tour ${best.tour.join("")}`);
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
