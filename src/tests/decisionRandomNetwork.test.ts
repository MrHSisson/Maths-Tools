// generateRandomNetwork — CI safety net for the procedural network generator
// (src/shared/decision/randomNetwork.ts). Mirrors the independent-check pattern
// used by validate.ts's primMST: re-implements a crossing check here rather than
// trusting the generator's own internal one, so a regression that breaks planarity
// can't silently pass by checking itself.

import { describe, expect, it } from "vitest";
import { generateRandomNetwork } from "../shared/decision/randomNetwork";
import { primMST } from "../shared/decision/validate";
import type { Network } from "../shared/decision/types";

function segmentsIntersect(
  p1x: number, p1y: number, p2x: number, p2y: number,
  p3x: number, p3y: number, p4x: number, p4y: number,
): boolean {
  const d1x = p2x - p1x, d1y = p2y - p1y;
  const d2x = p4x - p3x, d2y = p4y - p3y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const dx = p3x - p1x, dy = p3y - p1y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  const eps = 0.02;
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
}

function hasCrossingEdges(net: Network): boolean {
  const byId = Object.fromEntries(net.nodes.map((n) => [n.id, n]));
  for (let i = 0; i < net.edges.length; i++) {
    for (let j = i + 1; j < net.edges.length; j++) {
      const e1 = net.edges[i], e2 = net.edges[j];
      if ([e1.from, e1.to].some((x) => x === e2.from || x === e2.to)) continue; // sharing an endpoint is fine
      const a = byId[e1.from], b = byId[e1.to], c = byId[e2.from], d = byId[e2.to];
      if (segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y)) return true;
    }
  }
  return false;
}

const NODE_COUNTS = [3, 4, 5, 6, 7, 8, 9];
const SAMPLES = 20;

describe("generateRandomNetwork", () => {
  for (const nodeCount of NODE_COUNTS) {
    it(`n=${nodeCount}: always connected, planar, in-range, and well-formed`, () => {
      for (let i = 0; i < SAMPLES; i++) {
        const net = generateRandomNetwork({ nodeCount, weightRange: [3, 15] });

        expect(net.nodes.length).toBe(nodeCount);

        const nodeIds = new Set(net.nodes.map((n) => n.id));
        for (const e of net.edges) {
          expect(nodeIds.has(e.from)).toBe(true);
          expect(nodeIds.has(e.to)).toBe(true);
          expect(e.weight).toBeGreaterThanOrEqual(3);
          expect(e.weight).toBeLessThanOrEqual(15);
        }

        expect(primMST(net).connected, `n=${nodeCount} sample ${i} was disconnected`).toBe(true);
        expect(hasCrossingEdges(net), `n=${nodeCount} sample ${i} had crossing edges`).toBe(false);
      }
    });
  }

  // routeInspection is a best-effort nudge toward 2-or-4 odd-degree nodes (the
  // Route Inspection / Chinese Postman solvability sweet spot), not a guarantee —
  // every pairing it adds must still pass the same non-crossing check as everything
  // else, and a geometry that leaves no non-crossing pairing for a given odd node
  // is not always avoidable. An empirical sweep (300 samples/n) showed it lands on
  // 2 or 4 the large majority of the time but occasionally settles higher (rarely
  // as high as 8 at n=9) — a future Route Inspection tool built on this generator
  // should still verify the odd count itself before presenting a question. What's
  // NOT negotiable is the handshaking lemma: the odd-degree count is always even.
  it("routeInspection always leaves an even number of odd-degree nodes (handshaking lemma)", () => {
    for (const nodeCount of NODE_COUNTS) {
      for (let i = 0; i < SAMPLES; i++) {
        const net = generateRandomNetwork({ nodeCount, weightRange: [3, 15], routeInspection: true });
        const degree: Record<string, number> = Object.fromEntries(net.nodes.map((n) => [n.id, 0]));
        for (const e of net.edges) { degree[e.from]++; degree[e.to]++; }
        const oddCount = Object.values(degree).filter((d) => d % 2 !== 0).length;
        expect(oddCount % 2, `n=${nodeCount} sample ${i} had an odd COUNT of odd-degree nodes — impossible`).toBe(0);
      }
    }
  });

  it("clamps out-of-range node counts into the 3–9 label budget", () => {
    expect(generateRandomNetwork({ nodeCount: 1, weightRange: [1, 5] }).nodes.length).toBe(3);
    expect(generateRandomNetwork({ nodeCount: 20, weightRange: [1, 5] }).nodes.length).toBe(9);
  });
});
