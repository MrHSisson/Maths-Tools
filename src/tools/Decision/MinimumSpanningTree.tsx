import {
  DecisionShell,
  sampleTemplate,
  type DecisionProblem,
  type DecisionProblemExport,
  type Network,
  type NetworkTemplate,
  type SolveStep,
} from "../../shared/decision";

// ═══════════════════════════════════════════════════════════════════════════
// Minimum Spanning Tree — increment 1 of the Decision Maths shell.
// ONE parameterised template, Kruskal's algorithm emitting a SolveStep[] beat
// per considered edge, ONE question type, ONE level. Everything else (Prim, more
// question types, Levels 2/3, print, sandbox) is a later increment.
// See DECISION_SHELL_PLAN.md.
// ═══════════════════════════════════════════════════════════════════════════

// ── The template — a crossing-free 6-node shape. The MANDATORY (non-optional)
// edges already span every node, so every sample is connected and solvable; the
// two optional edges add alternative routes without ever disconnecting it. ──────
const MST_TEMPLATE: NetworkTemplate = {
  id: "mst-6node-a",
  nodes: [
    { id: "A", x: 140, y: 120 },
    { id: "B", x: 360, y: 90 },
    { id: "C", x: 560, y: 150 },
    { id: "D", x: 170, y: 360 },
    { id: "E", x: 400, y: 360 },
    { id: "F", x: 600, y: 380 },
  ],
  edges: [
    { id: "AB", from: "A", to: "B", weight: [3, 6] },
    { id: "AD", from: "A", to: "D", weight: [6, 9] },
    { id: "BC", from: "B", to: "C", weight: [5, 8] },
    { id: "BD", from: "B", to: "D", weight: [4, 7], optional: true },
    { id: "BE", from: "B", to: "E", weight: [6, 9], optional: true },
    { id: "CE", from: "C", to: "E", weight: [2, 5] },
    { id: "CF", from: "C", to: "F", weight: [7, 10] },
    { id: "DE", from: "D", to: "E", weight: [5, 8] },
    { id: "EF", from: "E", to: "F", weight: [3, 6] },
  ],
};

// ── Kruskal core (union–find) — the single source of the MST for this tool. ────
interface KruskalOutcome {
  order: Array<{ edgeId: string; accepted: boolean }>; // considered edges, shortest-first
  treeEdgeIds: string[];
  total: number;
}

function kruskal(network: Network): KruskalOutcome {
  const edges = [...network.edges].sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
  const parent: Record<string, string> = {};
  for (const n of network.nodes) parent[n.id] = n.id;
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: string, b: string) => {
    parent[find(a)] = find(b);
  };

  const n = network.nodes.length;
  const order: KruskalOutcome["order"] = [];
  const treeEdgeIds: string[] = [];
  let total = 0;

  for (const e of edges) {
    if (treeEdgeIds.length === n - 1) break; // spanning tree complete
    const accepted = find(e.from) !== find(e.to);
    order.push({ edgeId: e.id, accepted });
    if (accepted) {
      union(e.from, e.to);
      treeEdgeIds.push(e.id);
      total += e.weight;
    }
  }
  return { order, treeEdgeIds, total };
}

// ── generate — sample the template, compute the definite answer. ──────────────
function generate(_level: number): DecisionProblem {
  const network = sampleTemplate(MST_TEMPLATE);
  const { treeEdgeIds, total } = kruskal(network);
  return {
    network,
    templateId: MST_TEMPLATE.id,
    prompt: "Find the minimum spanning tree and its total weight.",
    answer: {
      text: `Minimum spanning tree has total weight ${total}.`,
      edges: treeEdgeIds,
      value: total,
    },
  };
}

// ── solve — Kruskal as ordered beats (one considered edge = one beat). ─────────
function solve(p: DecisionProblem): SolveStep[] {
  const network = p.network;
  const edges = [...network.edges].sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
  const byId: Record<string, (typeof edges)[number]> = {};
  for (const e of edges) byId[e.id] = e;

  const parent: Record<string, string> = {};
  for (const n of network.nodes) parent[n.id] = n.id;
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: string, b: string) => {
    parent[find(a)] = find(b);
  };

  const n = network.nodes.length;
  const tree = new Set<string>();
  const rejected = new Set<string>();
  let total = 0;
  const steps: SolveStep[] = [];

  const snapshot = () => {
    const s: Record<string, "idle" | "tree" | "rejected"> = {};
    for (const e of network.edges) s[e.id] = tree.has(e.id) ? "tree" : rejected.has(e.id) ? "rejected" : "idle";
    return s;
  };
  const label = (e: { from: string; to: string }) => `${e.from}–${e.to}`;

  for (const e of edges) {
    if (tree.size === n - 1) break;
    const cycle = find(e.from) === find(e.to);
    if (cycle) {
      rejected.add(e.id);
      steps.push({
        caption: `Consider ${label(e)} (weight ${e.weight}) — the next shortest. It joins two vertices already connected, so it would form a cycle: reject it.`,
        edgeStates: snapshot(),
        matrixCells: [
          { r: e.from, c: e.to, state: "strike" },
          { r: e.to, c: e.from, state: "strike" },
        ],
        runningTotal: total,
      });
    } else {
      union(e.from, e.to);
      tree.add(e.id);
      total += e.weight;
      steps.push({
        caption: `Consider ${label(e)} (weight ${e.weight}) — the next shortest. It connects a new vertex with no cycle, so add it to the tree. Running total ${total}.`,
        edgeStates: snapshot(),
        matrixCells: [
          { r: e.from, c: e.to, state: "highlight" },
          { r: e.to, c: e.from, state: "highlight" },
        ],
        runningTotal: total,
      });
    }
  }

  steps.push({
    caption: `The minimum spanning tree is complete — it uses ${n - 1} edges connecting all ${n} vertices. Total weight = ${total}.`,
    edgeStates: snapshot(),
    runningTotal: total,
  });

  return steps;
}

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      config={{ pageTitle: "Minimum Spanning Tree", instruction: "Kruskal's algorithm", levels: 1 }}
    />
  );
}

// CI contract surface — discovered by src/tests/decision.test.ts.
export const __problem: DecisionProblemExport = {
  templates: [MST_TEMPLATE],
  generate,
  solve,
};
