// sampleTemplate — draw a concrete Network from a hand-authored NetworkTemplate.
//
// Walks the template's edges, samples each weight uniformly in its [min,max],
// and includes each `optional` edge by a coin-flip. Node positions are copied
// verbatim (authored, crossing-free), so the diagram is always clean and — because
// a template's MANDATORY edges are authored to already span every node — the
// sampled network is always connected and therefore always solvable.

import type { Network, NetworkTemplate } from "./types";

const randInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

export function sampleTemplate(t: NetworkTemplate): Network {
  const edges = t.edges
    .filter((e) => !e.optional || Math.random() < 0.5)
    .map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      weight: randInt(e.weight[0], e.weight[1]),
    }));
  return {
    nodes: t.nodes.map((n) => ({ ...n })),
    edges,
  };
}
