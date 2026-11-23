// The flow of live Solving Trig Equations questions for the inverse-trig-graphs deck: each slide is the tool's generator set to one step of the
// lesson (radians throughout), opening on a chosen question (the seed) with the graph building up beside the working; New question draws more
// of the same kind. The seeds were chosen by running the tool's own generator (a seed only gives the same question while the tool and these
// options are unchanged).
import { generatorSlide } from "/src/decks/layouts";
import type { GeneratorPreset, Slide } from "/src/decks/types";

const TOOL = "solving-trig-equations";
// every option id the tool has at Levels 1 to 3: a step switches on exactly the ones it names, so nothing is left to the tool's defaults
const ALL = ["sin", "cos", "tan", "r360", "r720", "rSym180", "rSym360", "direct", "scaled", "shifted", "negative", "deg", "rad", "exact", "decimal",
  "w360", "w180", "w720", "wSym180", "multiple", "half", "shift", "both"];
const preset = (level: GeneratorPreset["level"], on: string[]): GeneratorPreset => ({ level, multiSelect: Object.fromEntries(ALL.map((k) => [k, on.includes(k)])) });

const step = (id: string, title: string, level: GeneratorPreset["level"], on: string[], seed: number): Slide =>
  generatorSlide(`it-${id}`, TOOL, preset(level, ["rad", ...on]), title, seed);

export const flowSlides = (): Slide[] => [
  step("solve-cos", "Solve: cos, 0 to 2π", "level1", ["cos", "r360", "direct", "exact"], 6),
  step("solve-sin", "Solve: sin, 0 to 2π", "level1", ["sin", "r360", "direct", "exact"], 6),
  step("solve-tan", "Solve: tan, 0 to 2π", "level1", ["tan", "r360", "direct", "exact"], 3),
  step("solve-neg", "Solve: −π to π", "level1", ["sin", "cos", "tan", "rSym180", "direct", "exact"], 11),
  step("solve-long", "Solve: 0 to 4π", "level1", ["sin", "cos", "tan", "r720", "direct", "exact"], 6),
  step("solve-dec", "Solve: calculator values", "level1", ["sin", "cos", "tan", "r360", "rSym180", "direct", "decimal"], 8),
  step("solve-rearr", "Solve: rearrange first", "level1", ["sin", "cos", "scaled", "shifted", "r360", "rSym180", "exact"], 4),
  step("solve-multi", "Solve: a multiple of θ", "level2", ["tan", "w180", "w360", "multiple", "direct", "exact"], 1),
];
