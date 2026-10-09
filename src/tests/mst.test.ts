// Minimum spanning tree — the traces, the generator and the working (src/shared/decision/mst*.ts).
// The tool's answers are also checked against independent Prim / Kruskal references in validate.ts (decision.test.ts);
// here a brute force over EVERY set of n−1 edges proves the tree is the minimum AND the only one, and the working is
// checked beat by beat against the traces.

import { describe, expect, it } from "vitest";
import { generateMstNetwork, kruskalTrace, primTrace, MST_HUGE, MST_LEVELS, treePath, type MstKind } from "../shared/decision/mst";
import { solveKruskal, solvePrimMatrix, solvePrimNetwork } from "../shared/decision/mstSolve";
import type { Network } from "../shared/decision/types";

// A hand-worked network: A–B 4, A–C 2, B–C 5, B–D 10, C–D 3, C–E 8, D–E 7, D–F 6, E–F 9
//   Kruskal: AC 2, CD 3, AB 4, (BC 5 rejected: B–A–C), DF 6, DE 7, [stop at 5 edges] → 22.
//   Prim from A: AC 2, CD 3, AB 4, DF 6, DE 7 → 22.
const HAND: Network = {
  nodes: ["A", "B", "C", "D", "E", "F"].map((id, i) => ({ id, x: i * 100, y: 0 })),
  edges: [
    ["AB", 4], ["AC", 2], ["BC", 5], ["BD", 10], ["CD", 3], ["CE", 8], ["DE", 7], ["DF", 6], ["EF", 9],
  ].map(([id, weight]) => ({ id: id as string, from: (id as string)[0], to: (id as string)[1], weight: weight as number })),
};

describe("traces on a hand-worked network", () => {
  it("Kruskal: the order, the rejection and its cycle", () => {
    const k = kruskalTrace(HAND);
    expect(k.tree.map((e) => e.id)).toEqual(["AC", "CD", "AB", "DF", "DE"]);
    expect(k.total).toBe(22);
    expect(k.entries.map((e) => [e.edge.id, e.accepted])).toEqual([["AC", true], ["CD", true], ["AB", true], ["BC", false], ["DF", true], ["DE", true]]);
    const rej = k.entries.find((e) => !e.accepted)!;
    expect(rej.cycle).toEqual(["B", "A", "C"]);
  });
  it("Prim from A and from E give the same tree, in different orders", () => {
    const a = primTrace(HAND, "A");
    expect(a.tree.map((e) => e.id)).toEqual(["AC", "CD", "AB", "DF", "DE"]);
    expect(a.entries[2].candidates.map((c) => c.id)).toEqual(["AB", "BC", "DF", "DE", "CE", "BD"]); // 4, 5, 6, 7, 8, 10
    const e = primTrace(HAND, "E");
    expect(e.total).toBe(22);
    expect(e.tree.map((x) => x.id)).toEqual(["DE", "CD", "AC", "AB", "DF"]);
  });
  it("treePath finds the path or null", () => {
    expect(treePath([{ id: "AC", from: "A", to: "C", weight: 2 }, { id: "CD", from: "C", to: "D", weight: 3 }], "A", "D")).toEqual(["A", "C", "D"]);
    expect(treePath([], "A", "D")).toBeNull();
  });
});

// every set of n−1 edges that connects the network, with its weight
function allSpanningTrees(net: Network): { ids: string[]; weight: number }[] {
  const n = net.nodes.length;
  const out: { ids: string[]; weight: number }[] = [];
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === n - 1) {
      const label: Record<string, string> = Object.fromEntries(net.nodes.map((v) => [v.id, v.id]));
      for (const i of chosen) {
        const e = net.edges[i];
        const la = label[e.from], lb = label[e.to];
        if (la === lb) return; // a cycle
        for (const k of Object.keys(label)) if (label[k] === lb) label[k] = la;
      }
      out.push({ ids: chosen.map((i) => net.edges[i].id), weight: chosen.reduce((t, i) => t + net.edges[i].weight, 0) });
      return;
    }
    for (let i = from; i < net.edges.length; i++) pick(i + 1, [...chosen, i]);
  };
  pick(0, []);
  return out;
}

const KINDS: MstKind[] = ["kruskal", "primNetwork", "primMatrix"];

describe("generated networks", () => {
  for (const level of [1, 2, 3] as const)
    for (const kind of KINDS)
      it(`L${level} ${kind}: the tree is the ONE minimum spanning tree (brute force over every spanning tree)`, () => {
        for (let i = 0; i < (level === 3 ? 6 : 12); i++) {
          const { network, start } = generateMstNetwork(level, kind);
          const spec = MST_LEVELS[level];
          expect(network.nodes.length).toBeGreaterThanOrEqual(spec.nodes[0]);
          expect(network.nodes.length).toBeLessThanOrEqual(spec.nodes[1]);
          expect(new Set(network.edges.map((e) => e.weight)).size).toBe(network.edges.length);
          const trees = allSpanningTrees(network);
          const min = Math.min(...trees.map((t) => t.weight));
          const best = trees.filter((t) => t.weight === min);
          expect(best.length).toBe(1);
          const k = kruskalTrace(network);
          const p = primTrace(network, start);
          expect(k.total).toBe(min);
          expect(p.total).toBe(min);
          expect([...k.tree.map((e) => e.id)].sort()).toEqual([...best[0].ids].sort());
          expect([...p.tree.map((e) => e.id)].sort()).toEqual([...best[0].ids].sort());
          expect(k.entries.filter((e) => !e.accepted).length).toBeGreaterThanOrEqual(spec.minRejected);
          for (const e of network.edges) expect(e.labelAt).toBeGreaterThan(0);
        }
      });
});

describe("very large networks (10–12 vertices)", () => {
  for (const kind of ["kruskal", "primNetwork"] as MstKind[])
    it(`${kind}: planar, all weights different, Kruskal = Prim, the tree unique by the strict cycle property (too big to enumerate every tree)`, () => {
      for (let i = 0; i < 30; i++) {
        const { network, start } = generateMstNetwork(2, kind, true);
        const n = network.nodes.length;
        expect(n).toBeGreaterThanOrEqual(MST_HUGE.nodes[0]);
        expect(n).toBeLessThanOrEqual(MST_HUGE.nodes[1]);
        expect(new Set(network.edges.map((e) => e.weight)).size).toBe(network.edges.length);
        const k = kruskalTrace(network), p = primTrace(network, start);
        expect(p.total).toBe(k.total);
        expect([...p.tree.map((e) => e.id)].sort()).toEqual([...k.tree.map((e) => e.id)].sort());
        expect(k.entries.filter((e) => !e.accepted).length).toBeGreaterThanOrEqual(MST_HUGE.minRejected);
        // every edge outside the tree is strictly heavier than every edge on the tree path between its ends: nothing can replace a tree edge
        const treeIds = new Set(k.tree.map((e) => e.id));
        for (const e of network.edges) {
          if (treeIds.has(e.id)) continue;
          const path = treePath(k.tree, e.from, e.to)!;
          for (let j = 1; j < path.length; j++) {
            const hop = k.tree.find((t) => (t.from === path[j - 1] && t.to === path[j]) || (t.to === path[j - 1] && t.from === path[j]))!;
            expect(hop.weight).toBeLessThan(e.weight);
          }
        }
      }
    });
  it("Prim on a table never gets the very large size (the table would be unreadable)", () => {
    for (let i = 0; i < 20; i++) expect(generateMstNetwork(3, "primMatrix", true).network.nodes.length).toBeLessThanOrEqual(MST_LEVELS[3].nodes[1]);
  });
});

describe("the working", () => {
  it("Kruskal: one beat per edge considered, plus the intro and the result; every rejection names a real cycle", () => {
    for (let i = 0; i < 20; i++) {
      const { network } = generateMstNetwork(2, "kruskal");
      const run = kruskalTrace(network);
      const steps = solveKruskal(network);
      expect(steps.length).toBe(run.entries.length + 2);
      expect(steps[steps.length - 1].runningTotal).toBe(run.total);
      expect(Object.keys(steps[steps.length - 1].edgeOrder!)).toEqual(run.tree.map((e) => e.id));
      run.entries.forEach((en, k) => {
        const s = steps[k + 1];
        expect(s.edgeStates[en.edge.id]).toBe(en.accepted ? "tree" : "rejected");
        // the chip of the edge just dealt with is green (added) or struck through (rejected); none is still "pending" before it
        expect(s.list!.items[run.sorted.findIndex((x) => x.id === en.edge.id)].tone).toBe(en.accepted ? "good" : "bad");
        expect(s.list!.items.slice(0, run.sorted.findIndex((x) => x.id === en.edge.id)).every((c) => c.tone !== "pending")).toBe(true);
        if (!en.accepted) {
          const cyc = en.cycle!;
          for (let j = 1; j < cyc.length; j++) {
            const hop = run.tree.find((t) => (t.from === cyc[j - 1] && t.to === cyc[j]) || (t.to === cyc[j - 1] && t.from === cyc[j]));
            expect(hop, `cycle hop ${cyc[j - 1]}–${cyc[j]}`).toBeTruthy();
            expect(s.edgeStates[hop!.id]).toBe("considering");
          }
          expect([cyc.join("–"), [...cyc].reverse().join("–")].some((t) => s.caption.includes(t))).toBe(true);
        }
      });
    }
  });
  it("Prim on the network: the chosen edge is always the smallest on offer and every candidate crosses the tree boundary", () => {
    for (let i = 0; i < 20; i++) {
      const { network, start } = generateMstNetwork(2, "primNetwork");
      const run = primTrace(network, start);
      const steps = solvePrimNetwork(network, start);
      expect(steps.length).toBe(run.entries.length + 2);
      run.entries.forEach((en, k) => {
        const inside = new Set(en.inTree);
        expect(en.candidates.every((c) => inside.has(c.from) !== inside.has(c.to))).toBe(true);
        expect(en.candidates.every((c) => c.weight >= en.edge.weight)).toBe(true);
        // and no crossing edge was left out
        expect(network.edges.filter((e) => inside.has(e.from) !== inside.has(e.to)).length).toBe(en.candidates.length);
        expect(steps[k + 1].list!.items[0].tone).toBe("good");
        expect(steps[k + 1].runningTotal).toBe(en.total);
      });
    }
  });
  it("Prim on a table: two beats per edge; columns are numbered in order and rows crossed out as vertices join", () => {
    for (let i = 0; i < 20; i++) {
      const { network, start } = generateMstNetwork(3, "primMatrix");
      const run = primTrace(network, start);
      const steps = solvePrimMatrix(network, start);
      expect(steps.length).toBe(2 * run.entries.length + 2);
      expect(steps[0].matrixOrder).toEqual({ [start]: "1" });
      expect(steps[0].matrixCrossed).toEqual([start]);
      run.entries.forEach((en, k) => {
        const look = steps[1 + 2 * k], done = steps[2 + 2 * k];
        // looking: candidate cells sit in rows NOT crossed out and columns that ARE numbered
        for (const c of look.matrixCells!) {
          expect(look.matrixCrossed).not.toContain(c.r);
          expect(Object.keys(look.matrixOrder!)).toContain(c.c);
        }
        expect(look.matrixCells!.filter((c) => c.state === "highlight").length).toBe(1);
        expect(done.matrixOrder![en.added]).toBe(String(k + 2));
        expect(done.matrixCrossed).toContain(en.added);
      });
      const fin = steps[steps.length - 1];
      expect(fin.runningTotal).toBe(run.total);
    }
  });
  it("no caption names an edge back to front (BA) — edges are always named alphabetically", () => {
    for (const kind of KINDS) {
      const { network, start } = generateMstNetwork(3, kind);
      const steps = kind === "kruskal" ? solveKruskal(network) : kind === "primNetwork" ? solvePrimNetwork(network, start) : solvePrimMatrix(network, start);
      for (const s of steps) for (const m of s.caption.matchAll(/\b([A-H])([A-H])\b(?= \()/g)) expect(m[1] < m[2], `${m[0]} in "${s.caption}"`).toBe(true);
    }
  });
});
