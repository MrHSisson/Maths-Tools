// ═══════════════════════════════════════════════════════════════════════════
// Route inspection — the worked solution as SolveStep[] (one beat = the next thing a teacher would write).
// Every number, vertex and route is read off inspectRoute() in routeInspection.ts. Odd vertices are ringed in amber with their degree
// on the shoulder; the edges that must be repeated are drawn purple.
// ═══════════════════════════════════════════════════════════════════════════

import { eulerRoute, inspectRoute, networkType, routeEdgeName, type InspectionRun } from "./routeInspection";
import type { DecisionProblem, EdgeState, Network, NodeRole, SolveStep, StepListItem } from "./types";

const idle = (net: Network): Record<string, EdgeState> => Object.fromEntries(net.edges.map((e) => [e.id, "idle" as EdgeState]));
const joinIds = (ids: string[]) => ids.join(", ");
const and = (ids: string[]) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}` : ids[0]);
const pathText = (path: string[]) => path.join("–");
const sumText = (xs: number[]) => (xs.length > 1 ? `${xs.join(" + ")} = ${xs.reduce((t, x) => t + x, 0)}` : String(xs[0]));
const oddWord = (n: number) => (n === 2 ? "two" : n === 4 ? "four" : String(n));

/** the edges a list of vertex paths runs along */
function edgesOnPaths(net: Network, paths: string[][]): string[] {
  const ids: string[] = [];
  for (const p of paths) for (let i = 0; i + 1 < p.length; i++) {
    const e = net.edges.find((x) => (x.from === p[i] && x.to === p[i + 1]) || (x.from === p[i + 1] && x.to === p[i]));
    if (e) ids.push(e.id);
  }
  return ids;
}

function oddView(net: Network, run: InspectionRun): Pick<SolveStep, "nodeStates" | "nodeRoles"> {
  return {
    nodeStates: Object.fromEntries(net.nodes.map((n) => [n.id, String(run.degrees[n.id])])),
    nodeRoles: Object.fromEntries(run.odd.map((v) => [v, "current" as NodeRole])),
  };
}

export function solveRoute(p: DecisionProblem): SolveStep[] {
  const net = p.network;
  const kind = p.kind;
  const ends = kind === "routeOpen" && p.route?.end ? { start: p.route.start, end: p.route.end } : undefined;
  const run = inspectRoute(net, ends);
  const type = networkType(run.odd.length);
  const steps: SolveStep[] = [];
  const base = (extra: Partial<SolveStep> & Pick<SolveStep, "caption">): SolveStep => ({ edgeStates: idle(net), ...extra });
  const W = run.totalWeight;

  // ── classify: degrees → type ───────────────────────────────────────────────
  if (kind === "routeClassify") {
    steps.push(base({
      caption: `The degree of a vertex is the number of edges meeting at it. Count them at every vertex:\n${net.nodes.map((n) => `${n.id}: ${run.degrees[n.id]}`).join(", ")}.`,
      phase: "Degrees",
      nodeStates: Object.fromEntries(net.nodes.map((n) => [n.id, String(run.degrees[n.id])])),
    }));
    steps.push(base({
      caption: run.odd.length
        ? `The odd vertices (odd degree) are ${and(run.odd)}: ${oddWord(run.odd.length)} of them.`
        : "Every vertex has an even degree: there are no odd vertices.",
      phase: "Odd vertices",
      ...oddView(net, run),
    }));
    steps.push(base({
      caption: type === "eulerian"
        ? "All the degrees are even, so the network is Eulerian: a route can use every edge exactly once and return to its start (from any vertex)."
        : type === "semi"
          ? `Exactly two vertices are odd, so the network is semi-Eulerian: a route can use every edge exactly once if it starts at one odd vertex and finishes at the other (${run.odd[0]} and ${run.odd[1]}). It cannot return to its start.`
          : `${run.odd.length} vertices are odd (more than two), so the network is neither Eulerian nor semi-Eulerian: no route can use every edge exactly once. Some edges must be repeated — that is the route inspection problem.`,
      phase: "Conclusion",
      ...oddView(net, run),
      runningTotal: run.odd.length,
      totalLabel: "Odd vertices",
    }));
    return steps;
  }

  // ── closed / open route ────────────────────────────────────────────────────
  const open = !!ends;
  steps.push(base({
    caption: `Every edge has to be used at least once, so the route is at least as long as all the edges added up:\n${sumText(net.edges.map((e) => e.weight))}\nTotal weight of the network = ${W}.`,
    phase: "Total weight",
    runningTotal: W,
    totalLabel: "Edges",
  }));
  steps.push(base({
    caption: `A route that uses each edge exactly once needs every vertex to be even (apart from the start and finish of an open route). Find the degrees:\n${net.nodes.map((n) => `${n.id}: ${run.degrees[n.id]}`).join(", ")}.\nThe odd vertices are ${and(run.odd)}: ${oddWord(run.odd.length)} of them.`,
    phase: "Odd vertices",
    ...oddView(net, run),
    runningTotal: W,
    totalLabel: "Edges",
  }));

  const finish = (repeatedEdges: string[], captionTop: string): void => {
    const start = p.route?.start ?? net.nodes[0].id;
    const route = eulerRoute(net, run.repeated, start);
    const states = idle(net);
    for (const id of repeatedEdges) states[id] = "added";
    steps.push(base({
      caption: `${captionTop}\nLength of the route = ${W} + ${run.extra} = ${run.routeLength}.\n${open ? `A route from ${ends!.start} to ${ends!.end}` : `A route starting and finishing at ${start}`}: ${route.join("–")}.`,
      phase: "Length of the route",
      edgeStates: states,
      ...oddView(net, run),
      runningTotal: run.routeLength,
      totalLabel: "Route",
    }));
  };

  if (open) {
    const { start, end } = ends!;
    if (!run.toPair.length) {
      steps.push(base({
        caption: `The route starts at ${start} and finishes at ${end}, and these are the only two odd vertices. A route can pass through every other vertex using each edge once, and it can start and finish at an odd vertex without repeating anything.\nNo edges need to be repeated.`,
        phase: "Start and finish",
        ...oddView(net, run),
        runningTotal: W,
        totalLabel: "Edges",
      }));
      finish([], `The shortest route uses each edge exactly once.`);
      return steps;
    }
    steps.push(base({
      caption: `The route starts at ${start} and finishes at ${end}, so those two odd vertices need no repeated edges. Only the other odd vertices, ${and(run.toPair)}, must be paired up and joined by repeating the shortest route between them.`,
      phase: "Start and finish",
      ...oddView(net, run),
      runningTotal: W,
      totalLabel: "Edges",
    }));
  }

  // the shortest connections between the vertices that must be paired
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < run.toPair.length; i++) for (let j = i + 1; j < run.toPair.length; j++) pairs.push([run.toPair[i], run.toPair[j]]);
  const conn = (a: string, b: string) => `${a}${b} = ${run.shortest.dist[a][b]} (${pathText(run.shortest.path(a, b))})`;
  steps.push(base({
    caption: run.toPair.length === 2
      ? `Pair the two vertices: the shortest route between ${run.toPair[0]} and ${run.toPair[1]} is the one to repeat.\n${conn(run.toPair[0], run.toPair[1])}`
      : `The odd vertices must be paired up. For every possible pair, find the shortest route between them (not always the edge joining them):\n${pairs.map(([a, b]) => conn(a, b)).join("\n")}`,
    phase: "Shortest connections",
    list: { title: "Shortest routes between odd vertices", items: pairs.map<StepListItem>(([a, b]) => ({ text: `${a}${b} ${run.shortest.dist[a][b]}` })) },
    ...oddView(net, run),
    runningTotal: W,
    totalLabel: "Edges",
  }));

  if (run.pairings.length > 1) {
    const text = (pr: (typeof run.pairings)[number]) => `${pr.pairs.map(([a, b]) => a + b).join(" + ")} = ${sumText(pr.lengths)}`;
    steps.push(base({
      caption: `${run.pairings.length} ways to pair ${and(run.toPair)}, each costing the sum of its shortest routes:\n${run.pairings.map(text).join("\n")}\nThe cheapest is ${run.best!.pairs.map(([a, b]) => a + b).join(" and ")}, costing ${run.best!.total}.`,
      phase: "Pairings",
      list: { title: "Ways to pair the odd vertices", items: run.pairings.map<StepListItem>((pr) => ({ text: `${pr.pairs.map(([a, b]) => a + b).join(" + ")} = ${pr.total}`, tone: pr === run.best ? "good" : "bad" })) },
      ...oddView(net, run),
      runningTotal: run.extra,
      totalLabel: "Repeat",
    }));
  }

  const repeatedEdges = edgesOnPaths(net, run.repeated);
  const states = idle(net);
  for (const id of repeatedEdges) states[id] = "added";
  const rep = run.best!.pairs.map((_, i) => `${pathText(run.repeated[i])} (${run.best!.lengths[i]})`);
  steps.push(base({
    caption: `Repeat ${rep.length > 1 ? "these routes" : "this route"}: ${rep.join(" and ")}. ${repeatedEdges.length > 1 ? "These edges" : "This edge"} (${joinIds(repeatedEdges.map((id) => routeEdgeName(net.edges.find((e) => e.id === id)!)))}) will be used twice, so every vertex is now even${open ? " (apart from the start and finish)" : ""}.\nExtra distance = ${sumText(run.best!.lengths)}.`,
    phase: "Repeat these edges",
    edgeStates: states,
    ...oddView(net, run),
    runningTotal: run.extra,
    totalLabel: "Repeat",
  }));
  finish(repeatedEdges, open ? `The route starts at ${ends!.start} and finishes at ${ends!.end}; only ${and(run.toPair)} needed joining.` : `Every vertex is now even, so a route can use every edge (the repeated ones twice) and return to its start.`);
  return steps;
}
