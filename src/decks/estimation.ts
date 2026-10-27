import type { DeckDef } from "./types";

// Estimation: rounding to 1 significant figure, then calculating. One lesson, directed: objective and language,
// a board to fill in live, then practice slides that each catch one named misconception.
export const ESTIMATION_DECK: DeckDef = {
  id: "estimation",
  title: "Estimation",
  summary: "Round each number to 1 significant figure, then calculate: whole numbers, decimals and fractions.",
  tool: "estimation",
  toolPath: "/estimation",
  slides: [
    { type: "title", title: "Estimation", subtitle: "Round first, then calculate" },
    { type: "objective", objective: "Estimate the answer to a calculation by rounding each number to 1 significant figure.",
      success: ["Round a number to 1 significant figure", "Calculate with the rounded numbers", "Say whether an estimate is sensible"] },
    { type: "vocab", terms: [
      { term: "Estimate", meaning: "An approximate answer, found by rounding the numbers first." },
      { term: "Significant figure", meaning: "A digit that carries value. The first significant figure is the first digit that is not zero." },
      { term: "Approximately equal to", meaning: "Close to, but not exactly equal to. The symbol is $\\approx$." },
    ] },
    { type: "definition", term: "Estimate", definition: "To estimate is to find an approximate answer by rounding each number to 1 significant figure before calculating." },

    { type: "divider", title: "Rounding to 1 significant figure" },
    { type: "board", title: "Round to 1 significant figure", prompt: "Which digit decides the rounding?", fill: "blank",
      grid: { head: ["Number", "To 1 s.f."], given: 1, rows: [["$48$", "$50$"], ["$794$", "$800$"], ["$0.39$", "$0.4$"], ["$0.082$", "$0.08$"], ["$3.7$", "$4$"]] } },

    { type: "divider", title: "Estimating a calculation" },
    { type: "board", title: "Estimate $48 \\times 31$", prompt: "Set out the working on the board.", fill: "structure",
      grid: { head: ["Calculation", "Round each number", "Calculate"], given: 1, rows: [["$48 \\times 31$", "$50 \\times 30$", "$1500$"]] } },
    { type: "practice", intention: "estimation-calc-zeros", prompt: "Estimate.", bank: ["est-01", "est-05"],
      generator: { level: "level1", multiSelect: { add: false, subtract: false, multiply: true, divide: false } } },
    { type: "practice", intention: "estimation-round-truncate", prompt: "Estimate.", bank: ["est-02", "est-04", "est-06"],
      generator: { level: "level1", multiSelect: { add: true, subtract: true, multiply: true, divide: false } } },
    { type: "practice", intention: "estimation-round-wrong-place", prompt: "Estimate.", bank: ["est-03"],
      generator: { level: "level1", multiSelect: { add: false, subtract: false, multiply: false, divide: true } } },

    { type: "divider", title: "Decimals" },
    { type: "board", title: "Estimate $6.1 \\div 0.48$", prompt: "What happens when we divide by a number less than 1?", fill: "structure",
      grid: { head: ["Calculation", "Round each number", "Calculate"], given: 1, rows: [["$6.1 \\div 0.48$", "$6 \\div 0.5$", "$12$"]] } },
    { type: "practice", intention: "estimation-leading-zeros", prompt: "Estimate.", bank: ["est-07", "est-10"],
      generator: { level: "level2", multiSelect: { add: false, subtract: false, multiply: true, divide: false } } },
    { type: "practice", intention: "estimation-round-to-whole", prompt: "Estimate.", bank: ["est-09"],
      generator: { level: "level2", multiSelect: { add: true, subtract: true, multiply: false, divide: false } } },
    { type: "practice", intention: "estimation-divide-decimal", prompt: "Estimate.", bank: ["est-08", "est-11"],
      generator: { level: "level2", multiSelect: { add: false, subtract: false, multiply: false, divide: true } } },

    { type: "divider", title: "Fractions" },
    { type: "practice", intention: "estimation-round-result", prompt: "Estimate.", bank: ["est-12", "est-14"],
      generator: { level: "level3", multiSelect: { fracbar: true, fracterm: false } } },
    { type: "practice", intention: "estimation-calc-zeros", prompt: "Estimate.", bank: ["est-13"],
      generator: { level: "level3", multiSelect: { fracbar: true, fracterm: false } } },

    { type: "plenary", points: ["Round every number to 1 significant figure first.", "Then calculate with the rounded numbers.", "Check the size of the answer: is it sensible?"] },
  ],
};
