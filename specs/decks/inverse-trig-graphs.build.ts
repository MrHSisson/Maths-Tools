// Build script for the combined "Inverse trigonometric graphs" deck: arcsin, then arccos, then arctan.
// One title, objective, discussion and summary for the whole deck; then the animation and the domain-and-range
// slide for each function, reused unchanged from the three single-function build scripts.
//   npm run deck -- build specs/decks/inverse-trig-graphs.build.ts --replace ; npm run deck -- check inverse-trig-graphs --layout
import { S } from "/src/decks/builder";
import arcsin from "./arcsin-graph.build";
import arccos from "./arccos-graph.build";
import arctan from "./arctan-graph.build";

const part = (d: ReturnType<typeof arcsin>, kind: "animation" | "facts") => d.slides.find((s) => s.id.endsWith(`-${kind}`))!;
const [sin, cos, tan] = [arcsin(), arccos(), arctan()];

export default () => ({
  id: "inverse-trig-graphs",
  title: "Inverse trigonometric graphs: arcsin, arccos and arctan",
  summary: "Why sin x, cos x and tan x are each restricted, then an animation for each: reflect the graph in y = x and separate it into y = arcsin x, y = arccos x and y = arctan x.",
  slides: [
    S.title("it-title", "Inverse trigonometric functions", "The graphs of arcsin x, arccos x and arctan x"),
    S.objective("it-objective", "Sketch y = arcsin x, y = arccos x and y = arctan x by reflecting the restricted graph in the line y = x.", [
      "Say why sin x, cos x and tan x must be restricted before they have an inverse",
      "Give the restricted domain and the range of each",
      "State the domain and range of each inverse function",
    ]),
    sin.slides.find((s) => s.id === "as-discuss")!,
    part(sin, "animation"), part(sin, "facts"),
    part(cos, "animation"), part(cos, "facts"),
    part(tan, "animation"), part(tan, "facts"),
    S.summary("it-summary", "Summary", [
      "sin x, cos x and tan x repeat their outputs, so each is restricted to one section first.",
      "Reflecting in y = x swaps the x and y values of every point.",
      "The domain of each inverse is the range of the restricted function, and its range is the restricted domain.",
    ]),
  ],
});
