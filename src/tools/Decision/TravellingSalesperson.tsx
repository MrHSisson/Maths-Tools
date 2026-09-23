import {
  DecisionShell,
  completeNetworkLayout,
  generateRandomNetwork,
  leastDistances,
  nearestNeighbour,
  placeEdgeLabels,
  type DecisionProblem,
  type DecisionProblemExport,
  type DistanceTable,
  type EdgeState,
  type LeastDistances,
  type MatrixCell,
  type Network,
  type NodeRole,
  type SolveStep,
} from "../../shared/decision";

// ═══════════════════════════════════════════════════════════════════════════
// Travelling Salesperson — first slice: the NEAREST NEIGHBOUR upper bound.
//
//   Level 1  Complete network (K4–K6) that already satisfies the triangle
//            inequality — apply nearest neighbour straight away.
//   Level 2  A practical network (not every pair joined). First complete the
//            table of least distances by finding shortest routes, then run
//            nearest neighbour on that table and expand the tour back into the
//            real network.
//   Level 3  As Level 2, but one direct edge is NOT the shortest way between its
//            ends (a detour beats it), so its table entry must be replaced too.
//
// Every question is tie-free (each "nearest" choice is unique) and every indirect
// entry has a single shortest route, so the answer is definite. validate.ts
// re-derives the tour with its own Dijkstra + NN. Lower bounds (deleted-vertex
// MST) and more TSP question types are the next slices.
// See docs/architecture/DECISION_SHELL_PLAN.md (increment 5).
// ═══════════════════════════════════════════════════════════════════════════

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Weights roughly to scale with the drawing (±15%), so the picture never lies
// about which vertex is nearer — board distances of 140–650 give weights ≈ 7–32.
function scaledWeight(net: Network, from: string, to: string): number {
  const a = net.nodes.find((n) => n.id === from)!;
  const b = net.nodes.find((n) => n.id === to)!;
  return Math.max(3, Math.round((Math.hypot(a.x - b.x, a.y - b.y) / 20) * (0.85 + Math.random() * 0.3)));
}

const pairKey = (a: string, b: string) => (a < b ? `${a}${b}` : `${b}${a}`);

// Pairs whose table entry differs from the drawn network: not joined directly,
// or joined by an edge that a detour beats.
function pairsToComplete(ld: LeastDistances): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < ld.ids.length; i++)
    for (let j = i + 1; j < ld.ids.length; j++) {
      const a = ld.ids[i], b = ld.ids[j];
      const d = ld.direct[a][b];
      if (d === null || ld.dist[a][b] < d) out.push([a, b]);
    }
  return out;
}

// A start vertex whose nearest-neighbour run has no ties, or null.
function tieFreeStart(ld: LeastDistances): string | null {
  for (const s of shuffle(ld.ids)) if (!nearestNeighbour(ld.ids, ld.dist, s).tied) return s;
  return null;
}

// ── Level 1 — complete network ────────────────────────────────────────────────
function completeQuestion(): { network: Network; start: string } {
  for (;;) {
    const net = completeNetworkLayout(pick([4, 5, 6]));
    for (const e of net.edges) e.weight = scaledWeight(net, e.from, e.to);
    const ld = leastDistances(net);
    if (pairsToComplete(ld).length > 0) continue; // triangle inequality must already hold
    const start = tieFreeStart(ld);
    if (start) return { network: net, start };
  }
}

// ── Levels 2 & 3 — practical network ─────────────────────────────────────────
function practicalQuestion(shortcut: boolean): { network: Network; start: string } {
  for (;;) {
    const n = shortcut ? pick([5, 6]) : pick([4, 5, 6]);
    const net = generateRandomNetwork({ nodeCount: n, weightRange: [1, 1], maxDegree: 4 });
    const missing = n * (n - 1) / 2 - net.edges.length;
    if (missing < (n === 4 ? 1 : 2) || missing > 6) continue; // enough to complete, not a slog
    for (const e of net.edges) e.weight = scaledWeight(net, e.from, e.to);

    if (shortcut) {
      // Lengthen one non-bridge edge so a detour beats it (a road over a hill).
      const cand = shuffle(net.edges).find((e) => {
        const without = { ...net, edges: net.edges.filter((x) => x.id !== e.id) };
        return leastDistances(without).dist[e.from][e.to] < Infinity;
      });
      if (!cand) continue;
      const without = { ...net, edges: net.edges.filter((x) => x.id !== cand.id) };
      cand.weight = leastDistances(without).dist[cand.from][cand.to] + randInt(2, 6);
    }

    const ld = leastDistances(net);
    const shortcuts = net.edges.filter((e) => ld.dist[e.from][e.to] < e.weight);
    if (shortcuts.length !== (shortcut ? 1 : 0)) continue;
    if (pairsToComplete(ld).some(([a, b]) => !ld.unique[a][b])) continue; // one clear route each

    const labels = placeEdgeLabels(net);
    if (!labels) continue;
    for (const e of net.edges) e.labelAt = labels[e.id];

    const start = tieFreeStart(ld);
    if (start) return { network: net, start };
  }
}

function generate(level: number): DecisionProblem {
  const { network, start } = level === 1 ? completeQuestion() : practicalQuestion(level === 3);
  const ld = leastDistances(network);
  const nn = nearestNeighbour(ld.ids, ld.dist, start);
  const route = expandRoute(ld, nn.tour);
  const practical = level > 1;
  return {
    network,
    start,
    prompt: practical
      ? `Complete a table of least distances, then use the nearest neighbour algorithm starting at ${start} to find an upper bound for the travelling salesperson problem.`
      : `Use the nearest neighbour algorithm starting at ${start} to find an upper bound for the travelling salesperson problem.`,
    answer: {
      text:
        `Tour ${nn.tour.join(" → ")}, length ${nn.total} (an upper bound).` +
        (practical && route.join("") !== nn.tour.join("") ? ` In the original network: ${route.join("–")}.` : ""),
      value: nn.total,
      tour: nn.tour,
    },
  };
}

// The tour as actually driven in the drawn network — each leg replaced by its
// shortest route (so a vertex may be passed through more than once).
function expandRoute(ld: LeastDistances, tour: string[]): string[] {
  const out = [tour[0]];
  for (let i = 1; i < tour.length; i++) out.push(...ld.path[tour[i - 1]][tour[i]].slice(1));
  return out;
}

// ── solve — table completion (practical only), then nearest neighbour ────────
function solve(p: DecisionProblem): SolveStep[] {
  const net = p.network;
  const ld = leastDistances(net);
  const start = p.start ?? ld.ids[0];
  const edgeBetween = (a: string, b: string) => net.edges.find((e) => pairKey(e.from, e.to) === pairKey(a, b))!;
  const pathEdges = (route: string[]) => route.slice(1).map((v, i) => edgeBetween(route[i], v).id);
  const routeSum = (route: string[]) =>
    route.slice(1).map((v, i) => edgeBetween(route[i], v).weight);

  const todo = pairsToComplete(ld);
  const practical = todo.length > 0;
  const TITLE = practical ? "Table of least distances" : "Distance matrix";

  // The table as it stands once the pairs in `filled` have been worked out.
  const tableWith = (filled: Set<string>): DistanceTable => {
    const values: DistanceTable["values"] = {};
    const indirect: string[] = [];
    for (const a of ld.ids) {
      values[a] = {};
      for (const b of ld.ids) {
        if (a === b) values[a][b] = null;
        else if (filled.has(pairKey(a, b))) {
          values[a][b] = ld.dist[a][b];
          indirect.push(`${a}|${b}`);
        } else values[a][b] = ld.direct[a][b];
      }
    }
    return { values, indirect };
  };
  const both = (a: string, b: string, state: MatrixCell["state"]): MatrixCell[] => [
    { r: a, c: b, state },
    { r: b, c: a, state },
  ];
  const idle = () => Object.fromEntries(net.edges.map((e) => [e.id, "idle" as EdgeState]));

  const steps: SolveStep[] = [];

  // ── Phase 1: complete the table ──
  const filled = new Set<string>();
  if (practical) {
    steps.push({
      caption: `Nearest neighbour needs a complete network. Here not every table entry is the shortest way between its two vertices, so first find the least distance for each of those ${todo.length} pair${todo.length === 1 ? "" : "s"}.`,
      edgeStates: idle(),
      matrix: tableWith(filled),
      matrixTitle: TITLE,
    });
    for (const [a, b] of todo) {
      const route = ld.path[a][b];
      const parts = routeSum(route);
      const sum = `${route.join("–")} = ${parts.join(" + ")} = ${ld.dist[a][b]}`;
      const direct = ld.direct[a][b];
      filled.add(pairKey(a, b));
      const edgeStates = idle();
      for (const id of pathEdges(route)) edgeStates[id] = "considering";
      if (direct !== null) edgeStates[edgeBetween(a, b).id] = "rejected";
      steps.push({
        caption:
          direct === null
            ? `${a} and ${b} are not joined directly. Shortest route: ${sum}. Enter ${ld.dist[a][b]} in the table.`
            : `${a}–${b} has a direct edge of ${direct}, but ${sum} is shorter — so the least distance is ${ld.dist[a][b]}, not ${direct}.`,
        edgeStates,
        matrix: tableWith(filled),
        matrixTitle: TITLE,
        matrixCells: both(a, b, "highlight"),
      });
    }
  }
  const table = tableWith(filled);

  // ── Phase 2: nearest neighbour ──
  const nn = nearestNeighbour(ld.ids, ld.dist, start);
  const order: Record<string, string> = {};
  const roles: Record<string, NodeRole> = {};
  const legEdges = new Set<string>();
  let total = 0;

  const dimColumns = (visited: string[]): MatrixCell[] =>
    visited.flatMap((c) => ld.ids.filter((r) => r !== c).map((r) => ({ r, c, state: "dim" as const })));
  const edgeStatesFor = (current: string[]) => {
    const s = idle();
    for (const id of legEdges) s[id] = "tree";
    for (const id of current) s[id] = "considering";
    return s;
  };

  order[start] = "1";
  roles[start] = "current";
  steps.push({
    caption: practical
      ? `The table is complete. Now apply nearest neighbour, starting at ${start}: cross out column ${start} and look along row ${start} for the smallest entry.`
      : `Every pair is joined directly and no detour is ever shorter, so apply nearest neighbour straight away. Start at ${start}: cross out column ${start} and look along row ${start} for the smallest entry.`,
    edgeStates: edgeStatesFor([]),
    nodeStates: { ...order },
    nodeRoles: { ...roles },
    matrix: table,
    matrixTitle: TITLE,
    matrixCells: [
      ...dimColumns([start]),
      ...ld.ids.filter((c) => c !== start).map((c) => ({ r: start, c, state: "considering" as const })),
    ],
    runningTotal: 0,
  });

  for (let i = 1; i < nn.tour.length; i++) {
    const from = nn.tour[i - 1];
    const to = nn.tour[i];
    const closing = i === nn.tour.length - 1;
    const visitedBefore = nn.tour.slice(0, i);
    const leg = nn.legs[i - 1];
    total += leg;
    const route = ld.path[from][to];
    const via = route.length > 2 ? ` (in the network: ${route.join("–")})` : "";
    const current = pathEdges(route);

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
      edgeStates: edgeStatesFor(current),
      nodeStates: { ...order },
      nodeRoles: { ...roles },
      matrix: table,
      matrixTitle: TITLE,
      matrixCells: [
        ...dimColumns(closing ? visitedBefore.filter((v) => v !== start) : visitedBefore),
        ...unvisited.filter((c) => c !== to).map((c) => ({ r: from, c, state: "considering" as const })),
        { r: from, c: to, state: "highlight" },
      ],
      runningTotal: total,
    });
    for (const id of current) legEdges.add(id);
  }

  const route = expandRoute(ld, nn.tour);
  const routeNote =
    practical && route.join("") !== nn.tour.join("")
      ? ` Driven in the original network this is ${route.join("–")}, passing through some vertices more than once.`
      : "";
  for (const v of ld.ids) roles[v] = "visited";
  steps.push({
    caption: `Nearest-neighbour tour: ${nn.tour.join(" → ")}, total length ${nn.total}. This is an upper bound — the optimal tour is no longer than ${nn.total}.${routeNote}`,
    edgeStates: edgeStatesFor([]),
    nodeStates: { ...order },
    nodeRoles: { ...roles },
    matrix: table,
    matrixTitle: TITLE,
    matrixCells: nn.tour.slice(1).map((v, i) => ({ r: nn.tour[i], c: v, state: "highlight" as const })),
    runningTotal: nn.total,
  });

  return steps;
}

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      config={{
        pageTitle: "Travelling Salesperson",
        instruction: "Nearest neighbour algorithm",
        levels: 3,
        levelLabels: [
          "Complete network (K4–K6)",
          "Practical network — complete the table of least distances first",
          "Practical network where a direct edge isn't the shortest route",
        ],
        questionMatrix: true,
      }}
    />
  );
}

// CI contract surface — discovered by src/tests/decision.test.ts.
export const __problem: DecisionProblemExport = {
  templates: [],
  levels: [1, 2, 3],
  reference: "nearestNeighbour",
  generate,
  solve,
};
