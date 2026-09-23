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

export function validateProblem(exp: DecisionProblemExport, levels = exp.levels ?? [1], batch = 60): string[] {
  const errors: string[] = [];

  for (const t of exp.templates) checkTemplate(t, errors);

  for (const level of levels) {
    for (let i = 0; i < batch; i++) {
      const p = exp.generate(level);
      const nodeIds = new Set(p.network.nodes.map((n) => n.id));
      const edgeIds = new Set(p.network.edges.map((e) => e.id));

      const mst = primMST(p.network);
      if (!mst.connected) {
        errors.push(`generate(${level}) produced a disconnected network`);
        continue;
      }
      let ref: { total: number; name: string };
      if (exp.reference === "nearestNeighbour") {
        if (!p.start || !nodeIds.has(p.start)) {
          errors.push(`generate(${level}) has no valid start vertex (${p.start})`);
          continue;
        }
        const nn = referenceNearestNeighbour(p.network, p.start);
        ref = { total: nn.total, name: "nearest-neighbour tour length" };
        if (nn.tied) errors.push(`generate(${level}) has a tied nearest-neighbour choice from ${p.start} — ambiguous question`);
        if ((p.answer.tour ?? []).join("") !== nn.tour.join(""))
          errors.push(`generate(${level}) answer.tour ${p.answer.tour?.join("")} ≠ brute-force NN tour ${nn.tour.join("")}`);
      } else {
        ref = { total: mst.total, name: "MST weight" };
      }
      if (p.answer.value !== ref.total)
        errors.push(`generate(${level}) answer.value ${p.answer.value} ≠ brute-force ${ref.name} ${ref.total}`);

      const steps = exp.solve(p);
      if (steps.length === 0) {
        errors.push(`solve() returned no steps for a generate(${level}) problem`);
        continue;
      }
      for (const s of steps) {
        for (const eid of Object.keys(s.edgeStates))
          if (!edgeIds.has(eid)) errors.push(`a SolveStep references edge "${eid}" not in the network`);
        for (const c of s.matrixCells ?? [])
          if (!nodeIds.has(c.r) || !nodeIds.has(c.c))
            errors.push(`a SolveStep matrix cell references a missing node (${c.r},${c.c})`);
      }
      const last = steps[steps.length - 1];
      if (last.runningTotal !== ref.total)
        errors.push(`solve() final runningTotal ${last.runningTotal} ≠ brute-force ${ref.name} ${ref.total}`);
    }
  }

  return errors;
}
