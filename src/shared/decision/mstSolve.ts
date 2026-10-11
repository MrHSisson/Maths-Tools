// ═══════════════════════════════════════════════════════════════════════════
// Minimum spanning trees — the worked solution as SolveStep[] (one beat = the next thing a teacher would write).
// Every number and edge name is read off the traces in mst.ts. Three methods share one look: tree edges green with
// the number they were chosen at, the edges being weighed amber, a rejected edge red and dashed.
// ═══════════════════════════════════════════════════════════════════════════

import { edgeName, ends, kruskalTrace, primTrace, treePath } from "./mst";
import type { EdgeState, GEdge, MatrixCell, Network, NodeRole, SolveStep, StepListItem } from "./types";

const label = (e: GEdge) => `${edgeName(e)} (${e.weight})`;
const chip = (e: GEdge) => `${edgeName(e)} ${e.weight}`;
const sumText = (edges: GEdge[]) => `${edges.map((e) => e.weight).join(" + ")} = ${edges.reduce((t, e) => t + e.weight, 0)}`;
const idle = (net: Network): Record<string, EdgeState> => Object.fromEntries(net.edges.map((e) => [e.id, "idle" as EdgeState]));
const orderBadges = (edges: GEdge[]): Record<string, string> => Object.fromEntries(edges.map((e, i) => [e.id, String(i + 1)]));

function finalBeat(net: Network, tree: GEdge[], total: number, start?: string): SolveStep {
  const n = net.nodes.length;
  const states = idle(net);
  for (const e of tree) states[e.id] = "tree";
  const roles: Record<string, NodeRole> | undefined = start ? Object.fromEntries(net.nodes.map((v) => [v.id, "visited" as NodeRole])) : undefined;
  return {
    caption:
      `${n - 1} edges join all ${n} vertices: a minimum spanning tree.\n` +
      `Order: ${tree.map(edgeName).join(", ")}\n` +
      `Total weight = ${sumText(tree)}`,
    phase: "Minimum spanning tree",
    edgeStates: states,
    edgeOrder: orderBadges(tree),
    nodeRoles: roles,
    runningTotal: total,
    totalLabel: "Weight",
  };
}

// ── Kruskal ──────────────────────────────────────────────────────────────────
export function solveKruskal(net: Network): SolveStep[] {
  const run = kruskalTrace(net);
  const n = net.nodes.length;
  const steps: SolveStep[] = [];
  const done = new Map<string, "good" | "bad">();
  const listAt = (currentId?: string): SolveStep["list"] => ({
    title: "Edges in order of weight",
    items: run.sorted.map<StepListItem>((e) => ({ text: chip(e), tone: e.id === currentId ? "current" : (done.get(e.id) ?? "pending") })),
  });
  const accepted: GEdge[] = [];
  const rejected = new Set<string>();

  steps.push({
    caption: `Smallest edge first; add it unless it makes a cycle. Stop at ${n - 1} edges.`,
    phase: "Kruskal's algorithm",
    edgeStates: idle(net),
    list: listAt(),
    runningTotal: 0,
    totalLabel: "Weight",
  });

  run.entries.forEach((en) => {
    const e = en.edge;
    const states = idle(net);
    for (const t of accepted) states[t.id] = "tree";
    for (const id of rejected) states[id] = "rejected";
    if (en.accepted) {
      accepted.push(e);
      done.set(e.id, "good");
      states[e.id] = "tree";
      const total = accepted.reduce((t, x) => t + x.weight, 0);
      steps.push({
        caption: `${label(e)}: add.`,
        phase: `Edge ${accepted.length} of ${n - 1}`,
        edgeStates: states,
        edgeOrder: orderBadges(accepted),
        list: listAt(),
        runningTotal: total,
        totalLabel: "Weight",
      });
    } else {
      rejected.add(e.id);
      done.set(e.id, "bad");
      const cyc = en.cycle![0] === ends(e)[0] ? en.cycle! : [...en.cycle!].reverse();
      const tree = accepted;
      for (let k = 1; k < cyc.length; k++) {
        const hop = tree.find((t) => (t.from === cyc[k - 1] && t.to === cyc[k]) || (t.to === cyc[k - 1] && t.from === cyc[k]));
        if (hop) states[hop.id] = "considering";
      }
      states[e.id] = "rejected";
      steps.push({
        caption: `${label(e)}: ${cyc.join("–")} already joined → cycle. Reject.`,
        phase: "Makes a cycle",
        edgeStates: states,
        edgeOrder: orderBadges(accepted),
        list: listAt(),
        runningTotal: accepted.reduce((t, x) => t + x.weight, 0),
        totalLabel: "Weight",
      });
    }
  });

  const fin = finalBeat(net, run.tree, run.total);
  fin.list = listAt();
  steps.push(fin);
  return steps;
}

// ── Prim on the network ──────────────────────────────────────────────────────
export function solvePrimNetwork(net: Network, start: string): SolveStep[] {
  const run = primTrace(net, start);
  const n = net.nodes.length;
  const steps: SolveStep[] = [];
  const tree: GEdge[] = [];
  const roles = (inTree: string[], current?: string): Record<string, NodeRole> =>
    Object.fromEntries(inTree.map((v) => [v, (v === current ? "current" : "visited") as NodeRole]));

  steps.push({
    caption: `Start at ${start}. Add the smallest edge from the tree to a new vertex, until all ${n} are in.`,
    phase: "Prim's algorithm",
    edgeStates: idle(net),
    nodeRoles: roles([start], start),
    runningTotal: 0,
    totalLabel: "Weight",
  });

  run.entries.forEach((en, i) => {
    const e = en.edge;
    const states = idle(net);
    for (const t of tree) states[t.id] = "tree";
    for (const c of en.candidates) states[c.id] = "considering";
    tree.push(e);
    states[e.id] = "tree";
    const others = en.candidates.slice(1);
    steps.push({
      caption: others.length ? `Smallest on offer: ${label(e)} → ${en.added}.` : `Only ${label(e)} on offer → ${en.added}.`,
      phase: `Edge ${i + 1} of ${n - 1}`,
      edgeStates: states,
      edgeOrder: orderBadges(tree),
      nodeRoles: roles([...en.inTree, en.added], en.added),
      list: {
        title: "Edges on offer",
        items: en.candidates.map<StepListItem>((c, k) => ({ text: chip(c), tone: k === 0 ? "good" : "pending" })),
      },
      runningTotal: en.total,
      totalLabel: "Weight",
    });
  });

  steps.push(finalBeat(net, run.tree, run.total, start));
  return steps;
}

// ── Prim on a table ──────────────────────────────────────────────────────────
// The table is the question; the working numbers columns and crosses out rows as vertices join the tree. Two beats per
// edge at Level 1: look down the numbered columns (candidates amber, smallest green), then cross out the new row and number its column.
// With `merge` (Levels 2–3) the two are one beat.
export function solvePrimMatrix(net: Network, start: string, merge = false): SolveStep[] {
  const run = primTrace(net, start);
  const n = net.nodes.length;
  const steps: SolveStep[] = [];
  const tree: GEdge[] = [];
  const order: Record<string, string> = { [start]: "1" };
  const crossed: string[] = [start];

  steps.push({
    caption: `Start at ${start}: write 1 above column ${start}, cross out row ${start}.\nRepeat: take the smallest entry in the numbered columns, ignoring crossed-out rows.`,
    phase: "Prim's algorithm on a table",
    edgeStates: idle(net),
    matrixOrder: { ...order },
    matrixCrossed: [...crossed],
    nodeRoles: { [start]: "current" },
    runningTotal: 0,
    totalLabel: "Weight",
  });

  run.entries.forEach((en, i) => {
    const e = en.edge;
    // the cell for an edge: its row is the vertex OUTSIDE the tree (not crossed out), its column the numbered one
    const cell = (c: GEdge, state: MatrixCell["state"]): MatrixCell => {
      const inside = en.inTree.includes(c.from) ? c.from : c.to;
      const outside = inside === c.from ? c.to : c.from;
      return { r: outside, c: inside, state };
    };
    const lookStates = idle(net);
    for (const t of tree) lookStates[t.id] = "tree";
    for (const c of en.candidates) lookStates[c.id] = "considering";
    if (merge) {
      tree.push(e);
      order[en.added] = String(i + 2);
      crossed.push(en.added);
      const states = { ...lookStates, [e.id]: "tree" as EdgeState };
      steps.push({
        caption: `Smallest entry ${e.weight} (row ${en.added}, column ${en.from}): add ${edgeName(e)}.\nWrite ${i + 2} above column ${en.added}, cross out row ${en.added}.`,
        phase: `Edge ${i + 1} of ${n - 1}`,
        edgeStates: states,
        matrixOrder: { ...order },
        matrixCrossed: [...crossed],
        matrixCells: [...en.candidates.slice(1).map((c) => cell(c, "considering")), cell(e, "highlight"), { r: cell(e, "highlight").c, c: cell(e, "highlight").r, state: "highlight" }],
        edgeOrder: orderBadges(tree),
        nodeRoles: Object.fromEntries([...en.inTree, en.added].map((v) => [v, (v === en.added ? "current" : "visited") as NodeRole])),
        runningTotal: en.total,
        totalLabel: "Weight",
      });
      return;
    }
    steps.push({
      caption: `Smallest entry ${e.weight} (row ${en.added}, column ${en.from}).`,
      phase: `Edge ${i + 1} of ${n - 1}`,
      edgeStates: lookStates,
      matrixOrder: { ...order },
      matrixCrossed: [...crossed],
      matrixCells: [...en.candidates.slice(1).map((c) => cell(c, "considering")), cell(e, "highlight")],
      edgeOrder: orderBadges(tree),
      nodeRoles: Object.fromEntries(en.inTree.map((v) => [v, "visited" as NodeRole])),
      runningTotal: i === 0 ? 0 : run.entries[i - 1].total,
      totalLabel: "Weight",
    });
    tree.push(e);
    order[en.added] = String(i + 2);
    crossed.push(en.added);
    const doneStates = idle(net);
    for (const t of tree) doneStates[t.id] = "tree";
    steps.push({
      caption: `Add ${edgeName(e)}: write ${i + 2} above column ${en.added}, cross out row ${en.added}.`,
      phase: `Edge ${i + 1} of ${n - 1}`,
      edgeStates: doneStates,
      matrixOrder: { ...order },
      matrixCrossed: [...crossed],
      matrixCells: [cell(e, "highlight"), { r: cell(e, "highlight").c, c: cell(e, "highlight").r, state: "highlight" }],
      edgeOrder: orderBadges(tree),
      nodeRoles: Object.fromEntries([...en.inTree, en.added].map((v) => [v, (v === en.added ? "current" : "visited") as NodeRole])),
      runningTotal: en.total,
      totalLabel: "Weight",
    });
  });

  steps.push(finalBeat(net, run.tree, run.total, start));
  return steps;
}

export { treePath };
