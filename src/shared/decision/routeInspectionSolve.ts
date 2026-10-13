// ═══════════════════════════════════════════════════════════════════════════
// Route inspection — the worked solution as SolveStep[] (one beat = the next thing a teacher would write).
// Every number, vertex and route is read off inspectRoute() in routeInspection.ts. Odd vertices are ringed in amber with their degree
// on the shoulder; the edges that must be repeated are drawn purple.
// ═══════════════════════════════════════════════════════════════════════════

import { eulerRoute, inspectRoute, networkType, type InspectionRun } from "./routeInspection";
import type { DecisionProblem, EdgeState, Network, NodeRole, SolveStep, StepListItem } from "./types";

const idle = (net: Network): Record<string, EdgeState> => Object.fromEntries(net.edges.map((e) => [e.id, "idle" as EdgeState]));
const and = (ids: string[]) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}` : ids[0]);
const pathText = (path: string[]) => path.join("–");
const sumText = (xs: number[]) => (xs.length > 1 ? `${xs.join(" + ")} = ${xs.reduce((t, x) => t + x, 0)}` : String(xs[0]));

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
      caption: `Degrees: ${net.nodes.map((n) => `${n.id} ${run.degrees[n.id]}`).join(", ")}.`,
      phase: "Degrees",
      nodeStates: Object.fromEntries(net.nodes.map((n) => [n.id, String(run.degrees[n.id])])),
    }));
    steps.push(base({
      caption: run.odd.length
        ? `Odd vertices: ${and(run.odd)}.`
        : "No odd vertices: every degree is even.",
      phase: "Odd vertices",
      ...oddView(net, run),
    }));
    steps.push(base({
      caption: type === "eulerian"
        ? "All degrees even: Eulerian."
        : type === "semi"
          ? `Two odd vertices (${run.odd[0]} and ${run.odd[1]}): semi-Eulerian.`
          : `${run.odd.length} odd vertices: neither Eulerian nor semi-Eulerian.`,
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
    caption: `Total weight = ${sumText(net.edges.map((e) => e.weight))}`,
    phase: "Total weight",
    runningTotal: W,
    totalLabel: "Edges",
  }));
  steps.push(base({
    caption: `Odd vertices: ${and(run.odd)}.`,
    phase: "Odd vertices",
    ...oddView(net, run),
    runningTotal: W,
    totalLabel: "Edges",
  }));

  const finish = (repeatedEdges: string[]): void => {
    const start = p.route?.start ?? net.nodes[0].id;
    const route = eulerRoute(net, run.repeated, start);
    const states = idle(net);
    for (const id of repeatedEdges) states[id] = "added";
    steps.push(base({
      caption: `Length = ${W} + ${run.extra} = ${run.routeLength}.\nRoute: ${route.join("–")}`,
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
        caption: `Only ${start} and ${end} are odd: start at one, finish at the other. Nothing is repeated.`,
        phase: "Start and finish",
        ...oddView(net, run),
        runningTotal: W,
        totalLabel: "Edges",
      }));
      finish([]);
      return steps;
    }
    steps.push(base({
      caption: `Start at ${start}, finish at ${end}: they need no repeats. Pair up ${and(run.toPair)}.`,
      phase: "Start and finish",
      ...oddView(net, run),
      runningTotal: W,
      totalLabel: "Edges",
    }));
  }

  const conn = (a: string, b: string) => `${a}${b} = ${run.shortest.dist[a][b]} (${pathText(run.shortest.path(a, b))})`;
  const pairName = (pr: (typeof run.pairings)[number]) => pr.pairs.map(([a, b]) => a + b).join(" + ");
  const text = (pr: (typeof run.pairings)[number]) => `${pairName(pr)} = ${sumText(pr.lengths)}`;

  if (run.pairings.length > 1) {
    // several ways to pair the odd vertices: one beat per pairing (AB + CD, then AC + BD, then AD + BC), each with the shortest route
    // between the two vertices of every pair, and its total
    run.pairings.forEach((pr) => {
      const st = idle(net);
      for (const id of edgesOnPaths(net, pr.pairs.map(([a, b]) => run.shortest.path(a, b)))) st[id] = "considering";
      steps.push(base({
        caption: `Pairing ${pairName(pr)}.${pr.pairs.map(([a, b]) => `\n${conn(a, b)}`).join("")}\nTotal ${sumText(pr.lengths)}`,
        phase: "Pairings",
        edgeStates: st,
        list: { title: "Shortest routes in this pairing", items: pr.pairs.map<StepListItem>(([a, b]) => ({ text: `${a}${b} ${run.shortest.dist[a][b]}` })) },
        ...oddView(net, run),
        runningTotal: W,
        totalLabel: "Edges",
      }));
    });
    steps.push(base({
      caption: `Cheapest pairing: ${text(run.best!)}.`,
      phase: "Cheapest pairing",
      list: { title: "Ways to pair the odd vertices", items: run.pairings.map<StepListItem>((pr) => ({ text: `${pairName(pr)} = ${pr.total}`, tone: pr === run.best ? "good" : "bad" })) },
      ...oddView(net, run),
      runningTotal: run.extra,
      totalLabel: "Repeat",
    }));
  } else {
    steps.push(base({
      caption: `Shortest route ${conn(run.toPair[0], run.toPair[1])}`,
      phase: "Shortest connection",
      list: { title: "Shortest route between the odd vertices", items: [{ text: `${run.toPair[0]}${run.toPair[1]} ${run.shortest.dist[run.toPair[0]][run.toPair[1]]}` }] },
      ...oddView(net, run),
      runningTotal: W,
      totalLabel: "Edges",
    }));
  }

  const repeatedEdges = edgesOnPaths(net, run.repeated);
  const states = idle(net);
  for (const id of repeatedEdges) states[id] = "added";
  const rep = run.best!.pairs.map((_, i) => `${pathText(run.repeated[i])} (${run.best!.lengths[i]})`);
  steps.push(base({
    caption: `Repeat ${rep.join(" and ")}: extra = ${sumText(run.best!.lengths)}`,
    phase: "Repeat these edges",
    edgeStates: states,
    ...oddView(net, run),
    runningTotal: run.extra,
    totalLabel: "Repeat",
  }));
  finish(repeatedEdges);
  return steps;
}
