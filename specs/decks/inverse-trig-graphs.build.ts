// Build script for the combined "Inverse trigonometric graphs" deck: arcsin, then arccos, then arctan.
// One title, objective, discussion and summary for the whole deck; then for each function the animation and the
// domain-and-range slide (reused unchanged from the three single-function build scripts), the other solutions, and
// whether the function and its inverse undo each other.
//   npm run deck -- build specs/decks/inverse-trig-graphs.build.ts --replace ; npm run deck -- check inverse-trig-graphs --layout
import { S } from "/src/decks/builder";
import arcsin from "./arcsin-graph.build";
import arccos from "./arccos-graph.build";
import arctan from "./arctan-graph.build";
import { practiceSlides, solvingSheetSlide } from "./inverse-trig-practice";
import { flowSlides } from "./inverse-trig-flow";

const part = (d: ReturnType<typeof arcsin>, kind: "animation" | "facts") => d.slides.find((s) => s.id.endsWith(`-${kind}`))!;
// "Finding the other solutions": the calculator gives one angle, the symmetry of the graph gives a second, then + 2kπ (or + kπ for tan).
const others = (id: string, fn: string, first: string, alt: string, eg: string, all: string) =>
  S.twoColumn(id, `Finding the other solutions: ${fn}`,
    `Calculator: $\\theta = ${first}$\n\nAlternative: $${alt}$\n\n${eg}`,
    `Every solution:\n\n${all}\n\n$k$ is any integer`);
// "Do they undo each other?": f(f⁻¹(x)) = x always, f⁻¹(f(x)) = x only on the restricted domain.
const undo = (id: string, fn: string, inv: string, domain: string, restricted: string, eg: string) =>
  S.twoColumn(id, `Do they undo each other? ${fn.replace("\\", "")} x`,
    `$${fn}(${inv}\\,x) = x$\n\nAlways, for ${domain}.\n\n$${fn}(${inv}\\,0.5) = 0.5$`,
    `$${inv}(${fn}\\,x) = x$\n\nOnly if ${restricted}.\n\n${eg}`);
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
    others("as-others", "sin x", "\\arcsin k", "\\pi - \\theta", "$\\sin x = 0.5$: $x = \\frac{\\pi}{6}$ or $\\frac{5\\pi}{6}$",
      "$x = \\theta + 2k\\pi$\n\n$x = \\pi - \\theta + 2k\\pi$"),
    undo("as-undo", "\\sin", "\\arcsin", "$-1 \\le x \\le 1$", "$-\\frac{\\pi}{2} \\le x \\le \\frac{\\pi}{2}$",
      "$\\arcsin\\left(\\sin\\frac{5\\pi}{6}\\right) = \\frac{\\pi}{6}$\n\nThis is not $\\frac{5\\pi}{6}$."),
    part(cos, "animation"), part(cos, "facts"),
    others("ac-others", "cos x", "\\arccos k", "2\\pi - \\theta", "$\\cos x = 0.5$: $x = \\frac{\\pi}{3}$ or $\\frac{5\\pi}{3}$",
      "$x = \\theta + 2k\\pi$\n\n$x = 2\\pi - \\theta + 2k\\pi$"),
    undo("ac-undo", "\\cos", "\\arccos", "$-1 \\le x \\le 1$", "$0 \\le x \\le \\pi$",
      "$\\arccos\\left(\\cos\\frac{5\\pi}{3}\\right) = \\frac{\\pi}{3}$\n\nThis is not $\\frac{5\\pi}{3}$."),
    part(tan, "animation"), part(tan, "facts"),
    others("at-others", "tan x", "\\arctan k", "\\pi + \\theta", "$\\tan x = 1$: $x = \\frac{\\pi}{4}$ or $\\frac{5\\pi}{4}$",
      "$x = \\theta + k\\pi$\n\nThe graph repeats every $\\pi$, so one formula covers both."),
    undo("at-undo", "\\tan", "\\arctan", "all real $x$", "$-\\frac{\\pi}{2} < x < \\frac{\\pi}{2}$",
      "$\\arctan\\left(\\tan\\frac{5\\pi}{4}\\right) = \\frac{\\pi}{4}$\n\nThis is not $\\frac{5\\pi}{4}$."),
    ...practiceSlides(),
    ...flowSlides(),
    solvingSheetSlide(),
    S.summary("it-summary", "Summary", [
      "sin x, cos x and tan x repeat their outputs, so each is restricted to one section first.",
      "Reflecting in y = x swaps the x and y values of every point.",
      "The domain of each inverse is the range of the restricted function, and its range is the restricted domain.",
    ]),
  ],
});
