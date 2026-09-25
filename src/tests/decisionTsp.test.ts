// TSP building blocks (src/shared/decision/tsp.ts). The tools' answers are checked
// against an independent Dijkstra + NN in validate.ts (decision.test.ts); this file
// covers the drawing side — every complete-network layout is legible — and pins
// leastDistances / nearestNeighbour on a hand-worked example.

import { describe, expect, it } from "vitest";
import { completeNetworkLayout, leastDistances, nearestNeighbour, placeEdgeLabels } from "../shared/decision/tsp";
import type { Network } from "../shared/decision/types";

describe("completeNetworkLayout", () => {
  for (const n of [3, 4, 5, 6]) {
    it(`draws K${n} with every edge present and clash-free labels`, () => {
      for (let i = 0; i < 40; i++) {
        const net = completeNetworkLayout(n);
        expect(net.nodes).toHaveLength(n);
        expect(net.edges).toHaveLength((n * (n - 1)) / 2);
        for (const e of net.edges) expect(e.labelAt).toBeGreaterThan(0);
        // re-running the placer on the same drawing must also succeed
        expect(placeEdgeLabels(net)).not.toBeNull();
      }
    });
  }
});

describe("leastDistances + nearestNeighbour (hand-worked)", () => {
  // A–B 3, B–C 4, C–D 2, A–D 10, A–C 6: A–D is beaten by A–B–C–D (9); B–D missing (6 via C).
  const net: Network = {
    nodes: ["A", "B", "C", "D"].map((id, i) => ({ id, x: i * 100, y: 0 })),
    edges: [
      { id: "AB", from: "A", to: "B", weight: 3 },
      { id: "BC", from: "B", to: "C", weight: 4 },
      { id: "CD", from: "C", to: "D", weight: 2 },
      { id: "AD", from: "A", to: "D", weight: 10 },
      { id: "AC", from: "A", to: "C", weight: 6 },
    ],
  };
  const ld = leastDistances(net);
  it("finds least distances and their routes", () => {
    expect(ld.dist.A.D).toBe(8); // A–C–D = 6 + 2 (beats A–B–C–D = 9 and A–D = 10)
    expect(ld.path.A.D).toEqual(["A", "C", "D"]);
    expect(ld.dist.B.D).toBe(6);
    expect(ld.direct.B.D).toBeNull();
    expect(ld.unique.B.D).toBe(true);
  });
  it("runs nearest neighbour on the completed table", () => {
    // from A: B(3) → C(4) → D(2) → back to A (8) = 17
    const nn = nearestNeighbour(ld.ids, ld.dist, "A");
    expect(nn.tour).toEqual(["A", "B", "C", "D", "A"]);
    expect(nn.total).toBe(17);
    expect(nn.tied).toBe(false);
  });
});
