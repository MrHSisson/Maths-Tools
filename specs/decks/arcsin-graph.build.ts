// Build script for the "Inverse of sin x: the graph of arcsin x" deck: a short animated explanation, not a whole lesson (no practice slides).
//   npm run deck -- build specs/decks/arcsin-graph.build.ts --replace ; npm run deck -- check arcsin-graph --layout
import { S } from "/src/decks/builder";

export default () => ({
  id: "arcsin-graph",
  title: "Inverse of sin x: the graph of arcsin x",
  summary: "Why sin x is restricted to −π/2 ≤ x ≤ π/2, then an animation: reflect the graph in y = x and separate it into y = arcsin x.",
  slides: [
    S.title("as-title", "Inverse of sin x", "Where the graph of arcsin x comes from"),
    S.objective("as-objective", "Sketch y = arcsin x by reflecting the restricted graph of y = sin x in the line y = x.", [
      "Say why sin x must be restricted before it has an inverse",
      "Give the restricted domain and the range of y = sin x",
      "State the domain and range of y = arcsin x",
    ]),
    S.discuss("as-discuss",
      "$\\sin \\frac{\\pi}{6} = 0.5$ and $\\sin \\frac{5\\pi}{6} = 0.5$. If $\\arcsin 0.5$ gave both angles, what would be wrong with it?",
      "A function gives exactly one output for each input. So we keep just one section of the sine graph that does not repeat any output.",
      "Which section of $y = \\sin x$ do we keep?",
      "-\\frac{\\pi}{2} \\le x \\le \\frac{\\pi}{2}"),
    S.inverseTrig("as-animation", "Inverse of sin x"),
    S.twoColumn("as-facts", "Domain and range swap",
      "$y = \\sin x$ (restricted)\n\nDomain: $-\\frac{\\pi}{2} \\le x \\le \\frac{\\pi}{2}$\n\nRange: $-1 \\le y \\le 1$",
      "$y = \\arcsin x$\n\nDomain: $-1 \\le x \\le 1$\n\nRange: $-\\frac{\\pi}{2} \\le y \\le \\frac{\\pi}{2}$"),
    S.summary("as-summary", "Summary", [
      "sin x repeats its outputs, so it is restricted to −π/2 ≤ x ≤ π/2 first.",
      "Reflecting in y = x swaps the x and y values of every point.",
      "The reflection is y = arcsin x: its domain is the range of sin x, and its range is the restricted domain.",
    ]),
  ],
});
