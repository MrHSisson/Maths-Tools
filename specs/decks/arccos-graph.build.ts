// Build script for the "Inverse of cos x" deck (the same shape as arcsin-graph; cos x is restricted to 0 ≤ x ≤ π).
//   npm run deck -- build specs/decks/arccos-graph.build.ts --replace ; npm run deck -- check arccos-graph --layout
import { S } from "/src/decks/builder";

export default () => ({
  id: "arccos-graph",
  title: "Inverse of cos x: the graph of arccos x",
  summary: "Why cos x is restricted to 0 ≤ x ≤ π, then an animation: reflect the graph in y = x and separate it into y = arccos x.",
  slides: [
    S.title("ac-title", "Inverse of cos x", "Where the graph of arccos x comes from"),
    S.objective("ac-objective", "Sketch y = arccos x by reflecting the restricted graph of y = cos x in the line y = x.", [
      "Say why cos x must be restricted before it has an inverse",
      "Give the restricted domain and the range of y = cos x",
      "State the domain and range of y = arccos x",
    ]),
    S.discuss("ac-discuss",
      "$\\cos \\frac{\\pi}{3} = 0.5$ and $\\cos \\frac{5\\pi}{3} = 0.5$. If $\\arccos 0.5$ gave both angles, what would be wrong with it?",
      "A function gives exactly one output for each input. So we keep just one section of the cosine graph that does not repeat any output.",
      "Which section of $y = \\cos x$ do we keep?",
      "0 \\le x \\le \\pi"),
    S.inverseTrig("ac-animation", "cos"),
    S.twoColumn("ac-facts", "Domain and range swap",
      "$y = \\cos x$ (restricted)\n\nDomain: $0 \\le x \\le \\pi$\n\nRange: $-1 \\le y \\le 1$",
      "$y = \\arccos x$\n\nDomain: $-1 \\le x \\le 1$\n\nRange: $0 \\le y \\le \\pi$"),
    S.summary("ac-summary", "Summary", [
      "cos x repeats its outputs, so it is restricted to 0 ≤ x ≤ π first.",
      "Reflecting in y = x swaps the x and y values of every point.",
      "The reflection is y = arccos x: its domain is the range of cos x, and its range is the restricted domain.",
    ]),
  ],
});
