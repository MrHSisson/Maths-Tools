// Build script for the "Inverse of tan x" deck (the same shape as arcsin-graph; tan x is restricted to −π/2 < x < π/2, between its asymptotes).
//   npm run deck -- build specs/decks/arctan-graph.build.ts --replace ; npm run deck -- check arctan-graph --layout
import { S } from "/src/decks/builder";

export default () => ({
  id: "arctan-graph",
  title: "Inverse of tan x: the graph of arctan x",
  summary: "Why tan x is restricted to −π/2 < x < π/2, then an animation: reflect the graph in y = x and separate it into y = arctan x.",
  slides: [
    S.title("at-title", "Inverse of tan x", "Where the graph of arctan x comes from"),
    S.objective("at-objective", "Sketch y = arctan x by reflecting the restricted graph of y = tan x in the line y = x.", [
      "Say why tan x must be restricted before it has an inverse",
      "Give the restricted domain and the range of y = tan x",
      "State the domain and range of y = arctan x, and its asymptotes",
    ]),
    S.discuss("at-discuss",
      "$\\tan \\frac{\\pi}{4} = 1$ and $\\tan \\frac{5\\pi}{4} = 1$. If $\\arctan 1$ gave both angles, what would be wrong with it?",
      "A function gives exactly one output for each input. So we keep just one branch of the tangent graph, between two asymptotes.",
      "Which section of $y = \\tan x$ do we keep?",
      "-\\frac{\\pi}{2} < x < \\frac{\\pi}{2}"),
    S.inverseTrig("at-animation", "tan"),
    S.twoColumn("at-facts", "Domain and range swap",
      "$y = \\tan x$ (restricted)\n\nDomain: $-\\frac{\\pi}{2} < x < \\frac{\\pi}{2}$\n\nRange: all real $y$",
      "$y = \\arctan x$\n\nDomain: all real $x$\n\nRange: $-\\frac{\\pi}{2} < y < \\frac{\\pi}{2}$"),
    S.summary("at-summary", "Summary", [
      "tan x repeats its outputs, so it is restricted to one branch, −π/2 < x < π/2.",
      "Reflecting in y = x swaps the x and y values of every point, and the vertical asymptotes become horizontal ones.",
      "The reflection is y = arctan x: its domain is the range of tan x, and its range is the restricted domain.",
    ]),
  ],
});
