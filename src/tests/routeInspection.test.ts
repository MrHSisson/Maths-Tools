// ─────────────────────────────────────────────────────────────────────────────
// Route Inspection — the maths (shared/decision/routeInspection.ts) against hand-worked numbers and against an independent
// reference (validate.ts: Bellman–Ford + bitmask DP), plus properties of every generated question and its working.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { degreeMap, eulerRoute, generateRouteNetwork, inspectRoute, oddVertices, pairingsOf, shortestPaths, solveRoute } from "../shared/decision";
import { referenceRoute } from "../shared/decision/validate";
import type { Network } from "../shared/decision";

const node = (id: string, x: number, y: number) => ({ id, x, y });
const edge = (a: string, b: string, weight: number) => ({ id: a + b, from: a, to: b, weight });

// A hand-worked network: odd vertices A, B, D, E (degrees 3, 3, 3, 3) — see the pairings below.
//   A–B 4, A–C 3, B–C 5, B–D 6, C–D 2, C–E 7, D–E 3, A–E 8
const NET: Network = {
  nodes: [node("A", 0, 0), node("B", 100, 0), node("C", 0, 100), node("D", 100, 100), node("E", 200, 100)],
  edges: [edge("A", "B", 4), edge("A", "C", 3), edge("B", "C", 5), edge("B", "D", 6), edge("C", "D", 2), edge("C", "E", 7), edge("D", "E", 3), edge("A", "E", 8)],
};

describe("route inspection maths", () => {
  it("degrees and odd vertices", () => {
    expect(degreeMap(NET)).toEqual({ A: 3, B: 3, C: 4, D: 3, E: 3 });
    expect(oddVertices(NET)).toEqual(["A", "B", "D", "E"]);
  });
  it("shortest paths (a route through other vertices beats the direct edge)", () => {
    const sp = shortestPaths(NET);
    expect(sp.dist.A.D).toBe(5); // A–C–D, not via B (10)
    expect(sp.path("A", "D")).toEqual(["A", "C", "D"]);
    expect(sp.dist.A.E).toBe(8); // A–C–D–E = 8 ties with the direct edge A–E
    expect(sp.count("A", "E")).toBe(2);
    expect(sp.dist.B.E).toBe(9); // B–D–E
  });
  it("pairings of four odd vertices: three, each cost the sum of its shortest routes", () => {
    expect(pairingsOf(["A", "B", "D", "E"]).length).toBe(3);
    const run = inspectRoute(NET);
    // AB + DE = 4 + 3 = 7 ; AD + BE = 5 + 9 = 14 ; AE + BD = 8 + 6 = 14
    expect(run.pairings.map((p) => p.total).sort((a, b) => a - b)).toEqual([7, 14, 14]);
    expect(run.best!.pairs).toEqual([["A", "B"], ["D", "E"]]);
    expect(run.totalWeight).toBe(38);
    expect(run.routeLength).toBe(45);
    expect(run.tied).toBe(false);
  });
  it("open route: the start and finish are not paired", () => {
    const run = inspectRoute(NET, { start: "A", end: "B" });
    expect(run.toPair).toEqual(["D", "E"]);
    expect(run.extra).toBe(3);
    expect(run.routeLength).toBe(41);
    expect(() => inspectRoute(NET, { start: "A", end: "C" })).toThrow();
  });
  it("matches the independent reference on the hand-worked network", () => {
    expect(referenceRoute(NET).length).toBe(45);
    expect(referenceRoute(NET, { start: "A", end: "B" }).length).toBe(41);
  });
  it("eulerRoute uses every edge once plus each repeat once, and starts / ends where it should", () => {
    const run = inspectRoute(NET);
    const route = eulerRoute(NET, run.repeated, "C");
    expect(route[0]).toBe("C");
    expect(route[route.length - 1]).toBe("C");
    const w = (u: string, v: string) => NET.edges.find((e) => (e.from === u && e.to === v) || (e.from === v && e.to === u))!.weight;
    const len = route.slice(1).reduce((t, v, i) => t + w(route[i], v), 0);
    expect(len).toBe(run.routeLength);
    const open = inspectRoute(NET, { start: "A", end: "B" });
    const r2 = eulerRoute(NET, open.repeated, "A");
    expect(r2[0]).toBe("A");
    expect(r2[r2.length - 1]).toBe("B");
  });
});

describe("generated questions", () => {
  for (const level of [1, 2, 3] as const)
    for (const kind of ["routeClassify", "routeClosed", "routeOpen"] as const)
      it(`L${level} ${kind}: answer matches the reference; the working ends on it; the route is real`, () => {
        for (let i = 0; i < 25; i++) {
          const r = generateRouteNetwork(level, kind);
          const ends = kind === "routeOpen" ? { start: r.start, end: r.end! } : undefined;
          const ref = referenceRoute(r.network, ends);
          if (kind !== "routeClassify") expect(ref.tied).toBe(false);
          if (kind === "routeClassify") expect(r.run.odd.length).toBe(ref.odd);
          else {
            expect(r.run.routeLength).toBe(ref.length);
            expect([2, 4]).toContain(ref.odd);
            const route = eulerRoute(r.network, r.run.repeated, r.start);
            const w = (u: string, v: string) => r.network.edges.find((e) => (e.from === u && e.to === v) || (e.from === v && e.to === u))!.weight;
            expect(route.slice(1).reduce((t, v, k) => t + w(route[k], v), 0)).toBe(r.run.routeLength);
            expect(route[0]).toBe(r.start);
            expect(route[route.length - 1]).toBe(kind === "routeOpen" ? r.end : r.start);
          }
          const steps = solveRoute({ network: r.network, kind, route: { start: r.start, end: r.end }, prompt: "", answer: { text: "" } });
          expect(steps.length).toBeGreaterThanOrEqual(3);
          if (kind !== "routeClassify") expect(steps[steps.length - 1].runningTotal).toBe(r.run.routeLength);
          for (const s of steps) expect(s.caption.trim()).not.toBe("");
        }
      });
  it("the odd-vertex option is honoured", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateRouteNetwork(2, "routeClosed", "two").run.odd.length).toBe(2);
      expect(generateRouteNetwork(2, "routeClosed", "four").run.odd.length).toBe(4);
    }
  });
});
