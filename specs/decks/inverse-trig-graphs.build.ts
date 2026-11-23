// Build script for the combined "Inverse trigonometric graphs" deck: arcsin, then arccos, then arctan.
// Each part is the unchanged slide set of its own build script (slide ids keep their as-/ac-/at- prefixes).
//   npm run deck -- build specs/decks/inverse-trig-graphs.build.ts --replace ; npm run deck -- check inverse-trig-graphs --layout
import arcsin from "./arcsin-graph.build";
import arccos from "./arccos-graph.build";
import arctan from "./arctan-graph.build";

export default () => ({
  id: "inverse-trig-graphs",
  title: "Inverse trigonometric graphs: arcsin, arccos and arctan",
  summary: "Why sin x, cos x and tan x are each restricted, then an animation for each: reflect the graph in y = x and separate it into y = arcsin x, y = arccos x and y = arctan x.",
  slides: [...arcsin().slides, ...arccos().slides, ...arctan().slides],
});
