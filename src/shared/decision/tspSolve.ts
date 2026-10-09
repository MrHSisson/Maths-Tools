// ═══════════════════════════════════════════════════════════════════════════
// Travelling salesperson — the worked solutions as SolveStep[] (one beat = the next thing a teacher would write).
//
//   tableBeats   complete the table of least distances (practical networks only)
//   kBeat        draw that table as the COMPLETE network (every pair joined) — from here the classical problem is solved on it
//   nnBeats      nearest neighbour from a start vertex (the upper bound), on the complete network
//   routeBeat    interpret the tour as a real route in the original network (each leg replaced by its shortest route)
//   lowerBeats   delete a vertex, Kruskal on the rest of the table, add its two shortest edges (the lower bound)
// A question is a sequence of these. Every number is read off tsp.ts / tspBounds.ts, never recomputed here.
// ═══════════════════════════════════════════════════════════════════════════

import { leastDistances, nearestNeighbour, type LeastDistances } from "./tsp";
import { lowerBound } from "./tspBounds";
import { completeOf, expandRoute, pairKey, pairsToComplete } from "./tspGenerate";
import type { DecisionProblem, DistanceTable, EdgeState, MatrixCell, Network, NodeRole, SolveStep, StepListItem } from "./types";

interface Ctx {
  /** the network drawn in this phase: the original while the table is completed, the complete network after */
  net: Network;
  /** the table the algorithm reads; on the complete network every leg is a single edge */
  ld: LeastDistances;
  /** the table with the real shortest routes (for the captions and the final route) */
  real: LeastDistances;
  todo: [string, string][];
  practical: boolean;
  title: string;
}

const edgeBetween = (c: Ctx, a: string, b: string) => c.net.edges.find((e) => pairKey(e.from, e.to) === pairKey(a, b))!;
const pathEdges = (c: Ctx, route: string[]) => route.slice(1).map((v, i) => edgeBetween(c, route[i], v).id);
const routeSum = (c: Ctx, route: string[]) => route.slice(1).map((v, i) => edgeBetween(c, route[i], v).weight);
const idle = (c: Ctx) => Object.fromEntries(c.net.edges.map((e) => [e.id, "idle" as EdgeState]));
const both = (a: string, b: string, state: MatrixCell["state"]): MatrixCell[] => [
  { r: a, c: b, state },
  { r: b, c: a, state },
];

/** The table as it stands once the pairs in `filled` have been worked out. */
function tableWith(c: Ctx, filled: Set<string>): DistanceTable {
  const values: DistanceTable["values"] = {};
  const indirect: string[] = [];
  for (const a of c.ld.ids) {
    values[a] = {};
    for (const b of c.ld.ids) {
      if (a === b) values[a][b] = null;
      else if (filled.has(pairKey(a, b))) {
        values[a][b] = c.ld.dist[a][b];
        indirect.push(`${a}|${b}`);
      } else values[a][b] = c.ld.direct[a][b];
    }
  }
  return { values, indirect };
}

const fullTable = (c: Ctx) => tableWith(c, new Set(c.todo.map(([a, b]) => pairKey(a, b))));

// ── Phase 1: complete the table ──────────────────────────────────────────────
function tableBeats(c: Ctx): SolveStep[] {
  const steps: SolveStep[] = [];
  const filled = new Set<string>();
  const { ld, todo } = c;
  steps.push({
    // the table shows what is still missing (a blank, or a direct edge a shorter route may beat); no answer is shown before its own step
    caption: `Build the table of least distances. Where two vertices are not joined, or the direct edge is longer than a route through other vertices, the entry has to be worked out as the length of the shortest route. Take the entries one at a time.`,
    phase: "Complete the table",
    edgeStates: idle(c),
    matrix: tableWith(c, filled),
    matrixTitle: c.title,
  });
  todo.forEach(([a, b]) => {
    const route = ld.path[a][b];
    const sum = `${route.join("–")} = ${routeSum(c, route).join(" + ")} = ${ld.dist[a][b]}`;
    const direct = ld.direct[a][b];
    filled.add(pairKey(a, b));
    const edgeStates = idle(c);
    for (const id of pathEdges(c, route)) edgeStates[id] = "considering";
    if (direct !== null) edgeStates[edgeBetween(c, a, b).id] = "rejected";
    steps.push({
      caption:
        direct === null
          ? `${a} and ${b} are not joined directly. Shortest route: ${sum}. Enter ${ld.dist[a][b]} in the table.`
          : `${a}–${b} has a direct edge of ${direct}, but ${sum} is shorter — so the least distance is ${ld.dist[a][b]}, not ${direct}.`,
      phase: "Complete the table",
      edgeStates,
      matrix: tableWith(c, filled),
      matrixTitle: c.title,
      matrixCells: both(a, b, "highlight"),
    });
  });
  return steps;
}

// ── Phase 2: nearest neighbour ───────────────────────────────────────────────
function nnBeats(c: Ctx, start: string, tag: string, again = false): { steps: SolveStep[]; total: number; tour: string[] } {
  const { ld } = c;
  const table = fullTable(c);
  const nn = nearestNeighbour(ld.ids, ld.dist, start);
  const order: Record<string, string> = { [start]: "1" };
  const roles: Record<string, NodeRole> = { [start]: "current" };
  const legEdges = new Set<string>();
  const phase = `Nearest neighbour${tag}`;
  const steps: SolveStep[] = [];
  let total = 0;

  const dimColumns = (visited: string[]): MatrixCell[] =>
    visited.flatMap((col) => ld.ids.filter((r) => r !== col).map((r) => ({ r, c: col, state: "dim" as const })));
  const edgeStatesFor = (current: string[]) => {
    const s = idle(c);
    for (const id of legEdges) s[id] = "tree";
    for (const id of current) s[id] = "considering";
    return s;
  };

  steps.push({
    caption: again
      ? `Now start again at ${start}: cross out column ${start} and look along row ${start} for the smallest entry.`
      : c.practical || c.todo.length
        ? `Now solve the classical problem on the complete network. Apply nearest neighbour, starting at ${start}: cross out column ${start} and look along row ${start} for the smallest entry.`
        : `Every pair is joined directly and no detour is ever shorter, so apply nearest neighbour straight away. Start at ${start}: cross out column ${start} and look along row ${start} for the smallest entry.`,
    phase,
    route: [start],
    edgeStates: edgeStatesFor([]),
    nodeStates: { ...order },
    nodeRoles: { ...roles },
    matrix: table,
    matrixTitle: c.title,
    matrixCells: [...dimColumns([start]), ...ld.ids.filter((x) => x !== start).map((x) => ({ r: start, c: x, state: "considering" as const }))],
    runningTotal: 0,
    totalLabel: "Length",
  });

  for (let i = 1; i < nn.tour.length; i++) {
    const from = nn.tour[i - 1];
    const to = nn.tour[i];
    const closing = i === nn.tour.length - 1;
    const visitedBefore = nn.tour.slice(0, i);
    const leg = nn.legs[i - 1];
    total += leg;
    const via = c.real.path[from][to].length > 2 ? ` (in the original network: ${c.real.path[from][to].join("–")})` : "";
    const current = pathEdges(c, ld.path[from][to]);
    roles[from] = "visited";
    roles[to] = "current";
    if (!closing) order[to] = String(i + 1);
    const unvisited = ld.ids.filter((v) => !visitedBefore.includes(v));
    const caption = closing
      ? `Every vertex has been visited, so return to the start: ${from} → ${start} is ${leg}${via}. Running total ${total}.`
      : unvisited.length === 1
        ? `Only ${to} is left: ${from} → ${to} is ${leg}${via}. Running total ${total}.`
        : `In row ${from}, the smallest entry to an unvisited vertex is ${leg}, to ${to}. Travel ${from} → ${to}${via}. Running total ${total}.`;
    steps.push({
      caption,
      phase,
      route: nn.tour.slice(0, i + 1),
      edgeStates: edgeStatesFor(current),
      nodeStates: { ...order },
      nodeRoles: { ...roles },
      matrix: table,
      matrixTitle: c.title,
      matrixCells: [
        ...dimColumns(closing ? visitedBefore.filter((v) => v !== start) : visitedBefore),
        ...unvisited.filter((x) => x !== to).map((x) => ({ r: from, c: x, state: "considering" as const })),
        { r: from, c: to, state: "highlight" as const },
      ],
      runningTotal: total,
      totalLabel: "Length",
    });
    for (const id of current) legEdges.add(id);
  }

  const route = expandRoute(c.real, nn.tour);
  const routeNote = c.todo.length && route.join("") !== nn.tour.join("") ? " Next, interpret this tour as a route in the original network." : "";
  for (const v of ld.ids) roles[v] = "visited";
  steps.push({
    caption: `Nearest-neighbour tour: ${nn.tour.join(" → ")}, total length ${nn.total}. This is an upper bound — the optimal tour is no longer than ${nn.total}.${routeNote}`,
    phase,
    route: nn.tour,
    edgeStates: edgeStatesFor([]),
    nodeStates: { ...order },
    nodeRoles: { ...roles },
    matrix: table,
    matrixTitle: c.title,
    matrixCells: nn.tour.slice(1).map((v, k) => ({ r: nn.tour[k], c: v, state: "highlight" as const })),
    runningTotal: nn.total,
    totalLabel: "Upper bound",
  });
  return { steps, total: nn.total, tour: nn.tour };
}

// ── Lower bound: delete a vertex ─────────────────────────────────────────────
function lowerBeats(c: Ctx, deleted: string): { steps: SolveStep[]; lower: number } {
  const { ld } = c;
  const lb = lowerBound(ld, deleted);
  const table = fullTable(c);
  const phase = "Lower bound";
  const steps: SolveStep[] = [];
  const dimDeleted: MatrixCell[] = ld.ids.filter((r) => r !== deleted).map((r) => ({ r, c: deleted, state: "dim" as const }));
  const roles: Record<string, NodeRole> = { [deleted]: "deleted" };
  const chip = (e: { a: string; b: string; w: number }) => `${e.a}${e.b} ${e.w}`;
  const viaNote = (a: string, b: string) => (c.real.path[a][b].includes(deleted) ? ` (the route passes through ${deleted}, but ${ld.dist[a][b]} is still the least distance between ${a} and ${b})` : "");

  const kept = new Set<string>(); // route edges of the tree so far
  const matrixKept: MatrixCell[] = [];
  const done = new Map<string, "good" | "bad">();
  const listAt = (): SolveStep["list"] => ({
    title: `Edges between the other ${lb.rest.length} vertices`,
    items: lb.sorted.map<StepListItem>((e) => ({ text: chip(e), tone: done.get(e.a + e.b) ?? "pending" })),
  });

  steps.push({
    caption: `Lower bound. Delete vertex ${deleted} and all its edges. Find a minimum spanning tree of the other ${lb.rest.length} vertices using the table of least distances, then add the two shortest edges from ${deleted} back in.`,
    phase,
    edgeStates: idle(c),
    nodeRoles: roles,
    matrix: table,
    matrixTitle: c.title,
    matrixCrossed: [deleted],
    matrixCells: [...dimDeleted],
    runningTotal: 0,
    totalLabel: "Tree",
  });
  steps.push({
    caption: `Step 1: a minimum spanning tree of the remaining vertices, by Kruskal's algorithm. The edges between them, in order of weight, are listed. Take them in turn, skipping any that makes a cycle, until the tree has ${lb.rest.length - 1} edges.`,
    phase,
    edgeStates: idle(c),
    nodeRoles: roles,
    matrix: table,
    matrixTitle: c.title,
    matrixCrossed: [deleted],
    matrixCells: [...dimDeleted],
    list: listAt(),
    runningTotal: 0,
    totalLabel: "Tree",
  });

  let sum = 0;
  // "CE, AC = 6 + 7 = 13" (a single edge is just "CE = 6")
  const soFar = (i: number) => {
    const got = lb.mst.slice(0, lb.entries.slice(0, i + 1).filter((x) => x.accepted).length);
    return `${got.map((e) => `${e.a}${e.b}`).join(", ")} = ${got.length > 1 ? `${got.map((e) => e.w).join(" + ")} = ` : ""}${sum}`;
  };
  lb.entries.forEach((en, i) => {
    const { a, b, w } = en.edge;
    const route = ld.path[a][b];
    const states = idle(c);
    for (const id of kept) states[id] = "tree";
    const nth = i === 0 ? "the smallest edge" : "the next smallest edge";
    if (en.accepted) {
      sum += w;
      done.set(a + b, "good");
      for (const id of pathEdges(c, route)) { states[id] = "tree"; kept.add(id); }
      matrixKept.push(...both(a, b, "highlight"));
      steps.push({
        caption: `Consider ${a}${b} (${w}), ${nth}. ${a} and ${b} are not yet joined, so it makes no cycle: add it.${viaNote(a, b)}\nTree so far: ${soFar(i)}.`,
        phase,
        edgeStates: states,
        nodeRoles: roles,
        matrix: table,
        matrixTitle: c.title,
        matrixCrossed: [deleted],
        matrixCells: [...dimDeleted, ...matrixKept],
        list: listAt(),
        runningTotal: sum,
        totalLabel: "Tree",
      });
    } else {
      done.set(a + b, "bad");
      for (const id of pathEdges(c, route)) if (!kept.has(id)) states[id] = "considering";
      const cyc = en.cycle![0] === a ? en.cycle! : [...en.cycle!].reverse();
      matrixKept.push(...both(a, b, "strike"));
      steps.push({
        caption: `Consider ${a}${b} (${w}), ${nth}. ${a} and ${b} are already joined by ${cyc.join("–")}, so adding ${a}${b} would make the cycle ${[...cyc, cyc[0]].join("–")}. Reject it.`,
        phase,
        edgeStates: states,
        nodeRoles: roles,
        matrix: table,
        matrixTitle: c.title,
        matrixCrossed: [deleted],
        matrixCells: [...dimDeleted, ...matrixKept],
        list: listAt(),
        runningTotal: sum,
        totalLabel: "Tree",
      });
    }
  });

  const treeStates = idle(c);
  for (const id of kept) treeStates[id] = "tree";
  steps.push({
    caption: `The minimum spanning tree of the other vertices: ${lb.mst.map((e) => `${e.a}${e.b}`).join(", ")}.\nIts weight is ${lb.mst.map((e) => e.w).join(" + ")} = ${lb.mstTotal}.`,
    phase,
    edgeStates: treeStates,
    nodeRoles: roles,
    matrix: table,
    matrixTitle: c.title,
    matrixCrossed: [deleted],
    matrixCells: [...dimDeleted, ...matrixKept],
    list: listAt(),
    runningTotal: lb.mstTotal,
    totalLabel: "Tree",
  });

  // step 2: the two shortest edges back to the deleted vertex
  const linkStates = { ...treeStates };
  for (const l of lb.links) for (const id of pathEdges(c, ld.path[deleted][l.to])) linkStates[id] = "added";
  steps.push({
    caption: `Step 2: put ${deleted} back. Its distances to the other vertices (row ${deleted} of the table), smallest first: ${lb.row.map((r) => `${deleted}${r.to} ${r.w}`).join(", ")}.\nThe two shortest are ${deleted}${lb.links[0].to} (${lb.links[0].w}) and ${deleted}${lb.links[1].to} (${lb.links[1].w}): ${lb.links[0].w} + ${lb.links[1].w} = ${lb.linksTotal}.`,
    phase,
    edgeStates: linkStates,
    nodeRoles: roles,
    matrix: table,
    matrixTitle: c.title,
    matrixCells: [
      ...ld.ids.filter((x) => x !== deleted).map((x) => ({ r: deleted, c: x, state: "considering" as const })),
      ...lb.links.flatMap((l) => both(deleted, l.to, "highlight")),
    ],
    list: { title: `Distances from ${deleted}`, items: lb.row.map<StepListItem>((r, k) => ({ text: `${deleted}${r.to} ${r.w}`, tone: k < 2 ? "good" : "pending" })) },
    runningTotal: lb.lower,
    totalLabel: "Lower bound",
  });
  steps.push({
    caption: `Lower bound = tree + the two edges at ${deleted} = ${lb.mstTotal} + ${lb.linksTotal} = ${lb.lower}.\nThe optimal tour is at least ${lb.lower}: whatever tour is chosen, take ${deleted} out and what is left joins the other vertices (at least ${lb.mstTotal}), and the tour enters and leaves ${deleted} by two edges (at least ${lb.linksTotal}).`,
    phase,
    edgeStates: linkStates,
    nodeRoles: roles,
    matrix: table,
    matrixTitle: c.title,
    runningTotal: lb.lower,
    totalLabel: "Lower bound",
  });
  return { steps, lower: lb.lower };
}

// ── Phase 1b: the table as the complete network ──────────────────────────────
function kBeat(c: Ctx): SolveStep {
  const states = idle(c);
  for (const [a, b] of c.todo) states[edgeBetween(c, a, b).id] = "added";
  return {
    caption: `Draw the table as a complete network: every pair of vertices is joined, and each edge has the least distance from the table${c.todo.length ? ` — the ${c.todo.length} new or changed ${c.todo.length === 1 ? "entry is" : "entries are"} purple` : ""}. Every direct edge is now a shortest route, so the triangle inequality holds and the classical problem (visit every vertex once, return to the start) can be solved on this network.`,
    phase: "Complete network",
    edgeStates: states,
    matrix: fullTable(c),
    matrixTitle: c.title,
    runningTotal: c.todo.length,
    totalLabel: "Entries changed",
  };
}

// ── Interpreting a tour as a real route ──────────────────────────────────────
/** The tour is on the complete network; this is the route it stands for in the ORIGINAL network (each leg replaced by its shortest route). */
function routeBeat(c0: Ctx, tour: string[], total: number): SolveStep | null {
  const route = expandRoute(c0.ld, tour);
  if (route.join("") === tour.join("")) return null; // every leg was a single edge: nothing to interpret
  const states = idle(c0);
  const legs = tour.slice(1).map((v, i) => ({ from: tour[i], to: v, path: c0.ld.path[tour[i]][v], len: c0.ld.dist[tour[i]][v] }));
  for (const l of legs) for (const id of pathEdges(c0, l.path)) states[id] = "tree";
  const visits: Record<string, number> = {};
  for (const v of route.slice(0, -1)) visits[v] = (visits[v] ?? 0) + 1;
  const repeated = Object.keys(visits).filter((v) => visits[v] > 1);
  return {
    caption:
      `Now interpret the tour as a real route in the original network: each edge of the tour stands for the shortest route in the table.\n` +
      `${legs.map((l) => `${l.from} → ${l.to}: ${l.path.join("–")} (${l.len})`).join("\n")}\n` +
      `The route is ${route.join("–")}, length ${total}${repeated.length ? ` — it passes through ${repeated.join(", ")} more than once, which is allowed because the tour was found on the complete network` : ""}.`,
    phase: "Route in the original network",
    route,
    network: c0.net,
    edgeStates: states,
    runningTotal: total,
    totalLabel: "Route length",
  };
}

// ── The whole solution ───────────────────────────────────────────────────────
export function solveTsp(p: DecisionProblem): SolveStep[] {
  const net = p.network;
  const real = leastDistances(net);
  const todo = pairsToComplete(real);
  const practical = todo.length > 0;
  const title = practical ? "Table of least distances" : "Distance matrix";
  const kind = p.kind ?? "tspNN";
  // phase 1 works on the original network
  const c0: Ctx = { net, ld: real, real, todo, practical, title };
  const steps: SolveStep[] = practical ? tableBeats(c0) : [];

  // from here the classical problem is solved on the COMPLETE network of least distances (every leg a single edge)
  let c: Ctx = c0;
  let K: Network | undefined;
  if (practical) {
    K = p.complete ?? completeOf(net, real);
    const direct: LeastDistances = {
      ids: real.ids,
      dist: real.dist,
      direct: real.dist,
      path: Object.fromEntries(real.ids.map((a) => [a, Object.fromEntries(real.ids.map((b) => [b, a === b ? [a] : [a, b]]))])),
      unique: Object.fromEntries(real.ids.map((a) => [a, Object.fromEntries(real.ids.map((b) => [b, true]))])),
    };
    c = { net: K, ld: direct, real, todo, practical, title };
  }
  const onK = (st: SolveStep): SolveStep => (K ? { ...st, network: K } : st);

  if (kind === "tspTable") {
    steps.push({
      caption: `The table of least distances is complete. ${todo.map(([a, b]) => `${a}${b} = ${real.dist[a][b]}`).join(", ")}${todo.length ? " are the new entries." : ""}`,
      phase: "Table complete",
      edgeStates: idle(c0),
      matrix: fullTable(c0),
      matrixTitle: title,
      runningTotal: todo.length,
      totalLabel: "Entries found",
    });
    if (practical) steps.push(onK(kBeat(c)));
    return steps;
  }
  if (practical) steps.push(onK(kBeat(c)));

  const starts = p.starts?.length ? p.starts : p.start ? [p.start] : [real.ids[0]];
  let upper: number | undefined;
  if (kind === "tspNN" || kind === "tspBounds") {
    const runs = starts.map((s, i) => nnBeats(c, s, starts.length > 1 ? ` (start ${s})` : "", i > 0));
    runs.forEach((r) => steps.push(...r.steps.map(onK)));
    upper = Math.min(...runs.map((r) => r.total));
    let bestIdx = 0;
    if (runs.length > 1) {
      bestIdx = runs.findIndex((r) => r.total === upper);
      steps.push(onK({
        caption: `From ${starts[0]} the tour has length ${runs[0].total}; from ${starts[1]} it has length ${runs[1].total}. The smaller is the better upper bound: ${upper}, from ${starts[bestIdx]}.`,
        phase: "Best upper bound",
        route: runs[bestIdx].tour,
        edgeStates: idle(c),
        matrix: fullTable(c),
        matrixTitle: title,
        list: { title: "Upper bounds", items: runs.map<StepListItem>((r, k) => ({ text: `${starts[k]}: ${r.total}`, tone: k === bestIdx ? "good" : "pending" })) },
        runningTotal: upper,
        totalLabel: "Upper bound",
      }));
    }
    // the tour is on the complete network: say what route in the ORIGINAL network it is
    const rb = practical ? routeBeat(c0, runs[bestIdx].tour, upper) : null;
    if (rb) steps.push(rb);
  }
  if (kind === "tspLower" || kind === "tspBounds") {
    const r = lowerBeats(c, p.deleted!);
    steps.push(...r.steps.map(onK));
    if (kind === "tspBounds") {
      steps.push(onK({
        caption: `Upper bound ${upper} (nearest neighbour from ${starts[0]}). Lower bound ${r.lower} (deleting ${p.deleted}).\nThe length of the optimal tour lies between them: ${r.lower} ≤ optimal tour ≤ ${upper}.`,
        phase: "Interval",
        edgeStates: idle(c),
        matrix: fullTable(c),
        matrixTitle: title,
        list: { title: "The optimal tour lies in", items: [{ text: `${r.lower}`, tone: "note" }, { text: "≤ optimal ≤", tone: "pending" }, { text: `${upper}`, tone: "note" }] },
        runningTotal: upper,
        totalLabel: "Upper bound",
      }));
    }
  }
  return steps;
}
