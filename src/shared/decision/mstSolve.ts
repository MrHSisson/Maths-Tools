// ═══════════════════════════════════════════════════════════════════════════
// Minimum spanning trees — the worked solution as SolveStep[] (one beat = the next thing a teacher would write).
// Every number and edge name is read off the traces in mst.ts. Three methods share one look: tree edges green with
// the number they were chosen at, the edges being weighed amber, a rejected edge red and dashed.
// ═══════════════════════════════════════════════════════════════════════════

import { componentsOf, edgeName, ends, kruskalTrace, primTrace, treePath } from "./mst";
import type { EdgeState, GEdge, MatrixCell, Network, NodeRole, SolveStep, StepListItem } from "./types";

const label = (e: GEdge) => `${edgeName(e)} (${e.weight})`;
const chip = (e: GEdge) => `${edgeName(e)} ${e.weight}`;
const setText = (ids: string[]) => `{${ids.join(", ")}}`;
const piecesText = (parts: string[][]) => parts.map(setText).join(" ");
const sumText = (edges: GEdge[]) => `${edges.map((e) => e.weight).join(" + ")} = ${edges.reduce((t, e) => t + e.weight, 0)}`;
const idle = (net: Network): Record<string, EdgeState> => Object.fromEntries(net.edges.map((e) => [e.id, "idle" as EdgeState]));
const orderBadges = (edges: GEdge[]): Record<string, string> => Object.fromEntries(edges.map((e, i) => [e.id, String(i + 1)]));

function finalBeat(net: Network, tree: GEdge[], total: number, notNeeded: GEdge[], start?: string): SolveStep {
  const n = net.nodes.length;
  const states = idle(net);
  for (const e of tree) states[e.id] = "tree";
  const roles: Record<string, NodeRole> | undefined = start ? Object.fromEntries(net.nodes.map((v) => [v.id, "visited" as NodeRole])) : undefined;
  return {
    caption:
      `The tree has ${n - 1} edges (one fewer than the ${n} vertices) and joins every vertex, so it is a minimum spanning tree.\n` +
      `Edges in the order chosen: ${tree.map(edgeName).join(", ")}\n` +
      `Total weight = ${sumText(tree)}` +
      (notNeeded.length ? `\n${notNeeded.map(edgeName).join(", ")} ${notNeeded.length > 1 ? "were" : "was"} never needed.` : ""),
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
    caption: `Kruskal's algorithm. List the edges in order of weight (smallest first). Take them in turn, adding an edge to the tree unless it would form a cycle. Stop when the tree has ${n - 1} edges (one fewer than the ${n} vertices).`,
    phase: "Kruskal's algorithm",
    edgeStates: idle(net),
    list: listAt(),
    runningTotal: 0,
    totalLabel: "Weight",
  });

  run.entries.forEach((en, i) => {
    const e = en.edge;
    const states = idle(net);
    for (const t of accepted) states[t.id] = "tree";
    for (const id of rejected) states[id] = "rejected";
    const nth = i === 0 ? "the smallest edge" : "the next smallest edge";
    if (en.accepted) {
      const before = componentsOf(net, accepted); // pieces before adding
      accepted.push(e);
      done.set(e.id, "good");
      states[e.id] = "tree";
      const total = accepted.reduce((t, x) => t + x.weight, 0);
      const pieceOf = (v: string) => before.find((p) => p.includes(v))!;
      const [u, w] = ends(e);
      steps.push({
        caption: `Consider ${label(e)}, ${nth}.\n${u} is in ${setText(pieceOf(u))} and ${w} is in ${setText(pieceOf(w))}: different pieces, so adding ${edgeName(e)} makes no cycle. Add it.\nPieces now: ${piecesText(en.components)}`,
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
      const [u2, w2] = ends(e);
      const cyc = en.cycle![0] === u2 ? en.cycle! : [...en.cycle!].reverse();
      const tree = accepted;
      for (let k = 1; k < cyc.length; k++) {
        const hop = tree.find((t) => (t.from === cyc[k - 1] && t.to === cyc[k]) || (t.to === cyc[k - 1] && t.from === cyc[k]));
        if (hop) states[hop.id] = "considering";
      }
      states[e.id] = "rejected";
      steps.push({
        caption: `Consider ${label(e)}, ${nth}.\n${u2} and ${w2} are already joined by ${cyc.join("–")}, so adding ${edgeName(e)} would make the cycle ${[...cyc, cyc[0]].join("–")}. Reject it.`,
        phase: "Makes a cycle",
        edgeStates: states,
        edgeOrder: orderBadges(accepted),
        list: listAt(),
        runningTotal: accepted.reduce((t, x) => t + x.weight, 0),
        totalLabel: "Weight",
      });
    }
  });

  const considered = new Set(run.entries.map((en) => en.edge.id));
  const unused = run.sorted.filter((e) => !considered.has(e.id));
  const fin = finalBeat(net, run.tree, run.total, unused);
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
    caption: `Prim's algorithm, starting at ${start}. Put ${start} in the tree. Then repeat: look at every edge that joins a vertex in the tree to a vertex not yet in it, and add the smallest. Stop when all ${n} vertices are in the tree.`,
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
      caption:
        `Tree: ${setText([...en.inTree].sort())}. Edges joining the tree to a new vertex: ${en.candidates.map(chip).join(", ")}.\n` +
        (others.length ? `The smallest is ${label(e)}: add ${edgeName(e)}, bringing in ${en.added}.` : `Only one edge is on offer, ${label(e)}: add it, bringing in ${en.added}.`),
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

  steps.push(finalBeat(net, run.tree, run.total, [], start));
  return steps;
}

// ── Prim on a table ──────────────────────────────────────────────────────────
// The table is the question; the working numbers columns and crosses out rows as vertices join the tree. Two beats per
// edge: look down the numbered columns (candidates amber, smallest green), then cross out the new row and number its column.
export function solvePrimMatrix(net: Network, start: string): SolveStep[] {
  const run = primTrace(net, start);
  const n = net.nodes.length;
  const steps: SolveStep[] = [];
  const tree: GEdge[] = [];
  const order: Record<string, string> = { [start]: "1" };
  const crossed: string[] = [start];
  const colText = (vs: string[]) => [...vs].sort().join(", ");

  steps.push({
    caption: `Prim's algorithm on the table, starting at ${start}. Write 1 above column ${start} and cross out row ${start}: ${start} is now in the tree.\nThen repeat: look down the numbered columns, ignoring crossed-out rows, and take the smallest entry.`,
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
    const rows = en.candidates.map((c) => `${cell(c, "considering").r}${cell(c, "considering").c} ${c.weight}`);
    steps.push({
      caption:
        `Numbered columns: ${colText(en.inTree)}. Entries in rows that are not crossed out: ${rows.join(", ")} (row then column).\n` +
        `The smallest is ${e.weight}, in row ${en.added}, column ${en.from}.`,
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
      caption: `Choose ${label(e)}: write ${i + 2} above column ${en.added} and cross out row ${en.added}. Add ${edgeName(e)} to the tree.\nWeight so far ${en.total}.`,
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

  steps.push(finalBeat(net, run.tree, run.total, [], start));
  return steps;
}

export { treePath };
