// Travelling salesperson bounds — the deleted-vertex lower bound, the generator and the working
// (src/shared/decision/tspBounds.ts, tspGenerate.ts, tspSolve.ts). validate.ts (decision.test.ts) re-derives every generated
// answer independently; here the hand-worked example is pinned and the whole chain is checked by brute force.

import { describe, expect, it } from "vitest";
import { leastDistances, nearestNeighbour } from "../shared/decision/tsp";
import { lowerBound } from "../shared/decision/tspBounds";
import { generateTsp, pairsToComplete, type TspKind } from "../shared/decision/tspGenerate";
import { solveTsp } from "../shared/decision/tspSolve";
import { referenceOptimalTour } from "../shared/decision/validate";
import type { Network } from "../shared/decision/types";

// K5, every direct edge already the shortest way:
//   AB 4 AC 7 AD 9 AE 6 · BC 5 BD 8 BE 10 · CD 3 CE 11 · DE 12
// Delete A → remaining B C D E. Kruskal on the table: CD 3 ✓, BC 5 ✓, BD 8 ✗ (B–C–D), BE 10 ✓ → tree 3+5+10 = 18.
// A's two shortest: AB 4, AE 6 = 10. Lower bound 28.   NN from A: A B C D E A = 4+5+3+12+6 = 30.
const W: Record<string, number> = { AB: 4, AC: 7, AD: 9, AE: 6, BC: 5, BD: 8, BE: 10, CD: 3, CE: 11, DE: 12 };
const K5: Network = {
  nodes: ["A", "B", "C", "D", "E"].map((id, i) => ({ id, x: i * 120, y: (i % 2) * 120 })),
  edges: Object.entries(W).map(([id, weight]) => ({ id, from: id[0], to: id[1], weight })),
};

describe("hand-worked K5", () => {
  const ld = leastDistances(K5);
  it("lower bound: tree, links and total", () => {
    const lb = lowerBound(ld, "A");
    expect(lb.mst.map((e) => e.a + e.b)).toEqual(["CD", "BC", "BE"]);
    expect(lb.mstTotal).toBe(18);
    expect(lb.links.map((l) => [l.to, l.w])).toEqual([["B", 4], ["E", 6]]);
    expect(lb.lower).toBe(28);
    expect(lb.unique).toBe(true);
    expect(lb.entries.map((e) => [e.edge.a + e.edge.b, e.accepted])).toEqual([["CD", true], ["BC", true], ["BD", false], ["BE", true]]);
    expect(lb.entries[2].cycle).toEqual(["B", "C", "D"]);
  });
  it("sits between the optimal tour and nothing above the nearest-neighbour tour", () => {
    expect(nearestNeighbour(ld.ids, ld.dist, "A").total).toBe(30);
    expect(referenceOptimalTour(K5)).toBeGreaterThanOrEqual(28);
    expect(referenceOptimalTour(K5)).toBeLessThanOrEqual(30);
  });
  it("a tie in the tree is NOT unique", () => {
    // CE = 10 ties BE = 10 for the last tree edge: either would do, so the question would be ambiguous
    const tie: Network = { ...K5, edges: K5.edges.map((e) => (e.id === "CE" ? { ...e, weight: 10 } : e)) };
    expect(lowerBound(leastDistances(tie), "A").unique).toBe(false);
  });
});

const KINDS: TspKind[] = ["tspNN", "tspLower", "tspBounds", "tspTable"];

describe("generated questions", () => {
  for (const kind of KINDS)
    for (const level of [1, 2, 3] as const)
      it(`${kind} L${level}: answer consistent, working ends on the answer, no broken captions`, () => {
        for (let i = 0; i < 12; i++) {
          const p = generateTsp(level, kind, { starts: i % 2 ? 2 : 1, setting: i % 3 ? "plain" : "context" });
          const ld = leastDistances(p.network);
          const todo = pairsToComplete(ld);
          if (level === 1 && kind !== "tspTable") {
            // a complete network whose weights need not satisfy the triangle inequality: 0–3 entries are replaced by a shorter route
            const n = p.network.nodes.length;
            expect(p.network.edges.length).toBe((n * (n - 1)) / 2);
            expect(todo.length).toBeLessThanOrEqual(3);
          }
          if (level > 1 || kind === "tspTable") expect(todo.length).toBeGreaterThan(0);
          if (level === 3) expect(p.network.edges.some((e) => ld.dist[e.from][e.to] < e.weight)).toBe(true); // a detour beats a direct edge
          const steps = solveTsp(p);
          const last = steps[steps.length - 1];
          for (const s of steps) {
            expect(s.caption).not.toMatch(/undefined|NaN|null/);
            expect(s.caption.trim().length).toBeGreaterThan(10);
          }
          if (kind === "tspNN") {
            const starts = p.starts!;
            const totals = starts.map((s) => nearestNeighbour(ld.ids, ld.dist, s).total);
            expect(last.runningTotal).toBe(Math.min(...totals));
            expect(p.answer.value).toBe(Math.min(...totals));
          }
          if (kind === "tspLower" || kind === "tspBounds") {
            const lb = lowerBound(ld, p.deleted!);
            expect(lb.unique).toBe(true);
            expect(p.bounds!.lower).toBe(lb.lower);
            expect(p.answer.text).toContain(String(lb.lower));
            const opt = referenceOptimalTour(p.network);
            expect(lb.lower).toBeLessThanOrEqual(opt);
            if (kind === "tspBounds") {
              expect(opt).toBeLessThanOrEqual(p.bounds!.upper!);
              expect(lb.lower).toBeLessThan(p.bounds!.upper!);
              expect(last.runningTotal).toBe(p.bounds!.upper);
              expect(last.caption).toContain(`${lb.lower} ≤ optimal tour ≤ ${p.bounds!.upper}`);
            } else expect(last.runningTotal).toBe(lb.lower);
            // the lower-bound beats: the tree beats add up to the tree, the links beat to the total
            const treeBeat = steps.find((s) => s.caption.startsWith("The minimum spanning tree of the other vertices"))!;
            expect(treeBeat.runningTotal).toBe(lb.mstTotal);
            expect(treeBeat.nodeRoles![p.deleted!]).toBe("deleted");
          }
          if (kind === "tspTable") {
            expect(last.runningTotal).toBe(todo.length);
            for (const [a, b] of todo) expect(last.matrix!.values[a][b]).toBe(ld.dist[a][b]);
            expect(steps.length).toBe(todo.length + 2);
          }
        }
      });

  it("the working never needs the deleted vertex's own edges in the tree", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateTsp(2, "tspLower", { starts: 1, setting: "plain" });
      const lb = lowerBound(leastDistances(p.network), p.deleted!);
      expect(lb.mst.every((e) => e.a !== p.deleted && e.b !== p.deleted)).toBe(true);
      expect(lb.mst.length).toBe(p.network.nodes.length - 2);
    }
  });
});

describe("the initial network need not satisfy the triangle inequality — the table of least distances always does", () => {
  const holds = (ld: ReturnType<typeof leastDistances>) =>
    ld.ids.every((a) => ld.ids.every((b) => ld.ids.every((c) => ld.dist[a][c] <= ld.dist[a][b] + ld.dist[b][c])));
  it("Level 1 draws complete networks with 0 to 3 entries beaten by a route, and about a quarter are genuine distances", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const p = generateTsp(1, "tspNN", { starts: 1, setting: "plain" });
      const ld = leastDistances(p.network);
      seen.add(pairsToComplete(ld).length);
      expect(holds(ld)).toBe(true); // however the weights were drawn, the table of least distances is a metric
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
  it("Level 2 allows at most one beaten direct edge, Level 3 requires one to three — and both leave some pairs unjoined", () => {
    let l2Beaten = 0, l2None = 0;
    for (let i = 0; i < 60; i++) {
      for (const [level, lo, hi] of [[2, 0, 1], [3, 1, 3]] as const) {
        const p = generateTsp(level, "tspNN", { starts: 1, setting: "plain" });
        const ld = leastDistances(p.network);
        const beaten = p.network.edges.filter((e) => ld.dist[e.from][e.to] < e.weight).length;
        expect(beaten).toBeGreaterThanOrEqual(lo);
        expect(beaten).toBeLessThanOrEqual(hi);
        const n = p.network.nodes.length;
        expect(p.network.edges.length).toBeLessThan((n * (n - 1)) / 2); // not every pair joined
        expect(holds(ld)).toBe(true);
        if (level === 2) beaten ? l2Beaten++ : l2None++;
      }
    }
    expect(l2Beaten, "Level 2 sometimes has a beaten edge").toBeGreaterThan(0);
    expect(l2None, "…and sometimes none").toBeGreaterThan(0);
  });
  it("the nearest-neighbour tour is worked on the table of least distances, and never just the outline of the drawing", () => {
    for (const level of [1, 2, 3] as const)
      for (let i = 0; i < 30; i++) {
        const p = generateTsp(level, "tspNN", { starts: 1, setting: i % 2 ? "context" : "plain" });
        const ld = leastDistances(p.network);
        expect(nearestNeighbour(ld.ids, ld.dist, p.start!).total).toBe(p.answer.value);
        expect(p.prompt).toContain("not drawn to scale");
        // a direct leg beaten by a detour is never described as a plain distance
        if (p.network.edges.some((e) => ld.dist[e.from][e.to] < e.weight) && p.prompt.includes("must visit")) expect(p.prompt).toMatch(/journey times|cost in pounds/);
      }
  });

  it("the Initial weights option: 'holds' never has a beaten direct edge, 'breaks' always does, at every level and for every question type", () => {
    for (const level of [1, 2, 3] as const)
      for (const kind of ["tspNN", "tspLower", "tspBounds", "tspTable"] as const)
        for (let i = 0; i < 15; i++) {
          const beaten = (p: ReturnType<typeof generateTsp>) => { const ld = leastDistances(p.network); return p.network.edges.filter((e) => ld.dist[e.from][e.to] < e.weight).length; };
          const h = generateTsp(level, kind, { starts: 1, setting: i % 2 ? "context" : "plain", weights: "holds" });
          expect(beaten(h), `${kind} L${level} holds`).toBe(0);
          if (h.prompt.includes("must visit")) expect(h.prompt).toMatch(/distances in/); // nothing beaten: a plain distance is fine
          const b = generateTsp(level, kind, { starts: 1, setting: i % 2 ? "context" : "plain", weights: "breaks" });
          expect(beaten(b), `${kind} L${level} breaks`).toBeGreaterThanOrEqual(1);
          if (b.prompt.includes("must visit")) expect(b.prompt).toMatch(/journey times|cost in pounds/);
          // either way the working is on the table of least distances, and the answer agrees with the table
          for (const p of [h, b]) {
            const ld = leastDistances(p.network);
            if (kind === "tspNN") expect(nearestNeighbour(ld.ids, ld.dist, p.start!).total).toBe(p.answer.value);
          }
        }
  });
  it("with 'holds', Level 3 always has a table entry that needs a route of three or more edges", () => {
    for (let i = 0; i < 30; i++) {
      const ld = leastDistances(generateTsp(3, "tspNN", { starts: 1, setting: "plain", weights: "holds" }).network);
      expect(pairsToComplete(ld).some(([x, y]) => ld.path[x][y].length >= 4)).toBe(true);
    }
  });
});
