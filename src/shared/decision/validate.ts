// validateProblem — the CI contract checker for Decision Maths tools (the analog
// of the CS validateTopic / the maths generator smoke test).
//
// It samples each template many times and, for a batch of generated problems,
// checks that: templates reference real nodes and sample weights in range; the
// generated network is connected; every SolveStep references edges/cells that
// exist; and — the key safety net that makes "generate fast" sound — the tool's
// declared answer AND its solve() running total both agree with an INDEPENDENT
// brute-force MST (Prim's, written from scratch here, sharing no code with the
// tool's Kruskal).

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

export function validateProblem(exp: DecisionProblemExport, levels = [1], batch = 60): string[] {
  const errors: string[] = [];

  for (const t of exp.templates) checkTemplate(t, errors);

  for (const level of levels) {
    for (let i = 0; i < batch; i++) {
      const p = exp.generate(level);
      const nodeIds = new Set(p.network.nodes.map((n) => n.id));
      const edgeIds = new Set(p.network.edges.map((e) => e.id));

      const ref = primMST(p.network);
      if (!ref.connected) {
        errors.push(`generate(${level}) produced a disconnected network`);
        continue;
      }
      if (p.answer.value !== ref.total)
        errors.push(`generate(${level}) answer.value ${p.answer.value} ≠ brute-force MST weight ${ref.total}`);

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
        errors.push(`solve() final runningTotal ${last.runningTotal} ≠ brute-force MST weight ${ref.total}`);
    }
  }

  return errors;
}
