import type { DeckDef } from "./types";
import { boardSlide, definitionSlide, depthSlide, discussionSlide, dividerSlide, gridSlide, objectiveSlide, plenarySlide, practiceSlide, titleSlide, vocabSlide } from "./layouts";

// Estimation: rounding to 1 significant figure, then calculating. One lesson, directed: objective and language,
// boards to fill in live, then practice slides that each catch one named misconception.
const L1 = (ops: [boolean, boolean, boolean, boolean]) => ({ add: ops[0], subtract: ops[1], multiply: ops[2], divide: ops[3] });

export const ESTIMATION_DECK: DeckDef = {
  id: "estimation",
  title: "Estimation",
  summary: "Round each number to 1 significant figure, then calculate: whole numbers, decimals and fractions.",
  tool: "estimation",
  toolPath: "/estimation",
  slides: [
    titleSlide("est-title", "Estimation", "Round first, then calculate"),
    objectiveSlide("est-objective", "Estimate the answer to a calculation by rounding each number to 1 significant figure.",
      ["Round a number to 1 significant figure", "Calculate with the rounded numbers", "Say whether an estimate is sensible"]),
    vocabSlide("est-vocab", [
      { term: "Estimate", meaning: "An approximate answer, found by rounding the numbers first." },
      { term: "Significant figure", meaning: "A digit that carries value. The first significant figure is the first digit that is not zero." },
      { term: "Approximately equal to", meaning: "Close to, but not exactly equal to. The symbol is $\\approx$." },
    ]),
    definitionSlide("est-definition", "Estimate", "To estimate is to find an approximate answer by rounding each number to 1 significant figure before calculating."),

    dividerSlide("est-div-rounding", "Rounding to 1 significant figure"),
    boardSlide("est-board-round", "Round to 1 significant figure", "Which digit decides the rounding?",
      { head: ["Number", "To 1 s.f."], given: 1, rows: [["$48$", "$50$"], ["$794$", "$800$"], ["$0.39$", "$0.4$"], ["$0.082$", "$0.08$"], ["$3.7$", "$4$"]] }, "blank"),

    dividerSlide("est-div-calc", "Estimating a calculation"),
    boardSlide("est-board-calc", "Estimate $48 \\times 31$", "Set out the working on the board.",
      { head: ["Calculation", "Round each number", "Calculate"], given: 1, rows: [["$48 \\times 31$", "$50 \\times 30$", "$1500$"]] }, "structure"),
    practiceSlide("est-p-zeros", "estimation", "estimation-calc-zeros", ["est-01", "est-05"], { level: "level1", multiSelect: L1([false, false, true, false]) }),
    practiceSlide("est-p-truncate", "estimation", "estimation-round-truncate", ["est-02", "est-04", "est-06"], { level: "level1", multiSelect: L1([true, true, true, false]) }),
    practiceSlide("est-p-place", "estimation", "estimation-round-wrong-place", ["est-03"], { level: "level1", multiSelect: L1([false, false, false, true]) }),
    depthSlide("est-depth-who", "estimation", "est-who-l1", "Who estimated well?"),

    dividerSlide("est-div-decimals", "Decimals"),
    boardSlide("est-board-decimal", "Estimate $6.1 \\div 0.48$", "What happens when we divide by a number less than 1?",
      { head: ["Calculation", "Round each number", "Calculate"], given: 1, rows: [["$6.1 \\div 0.48$", "$6 \\div 0.5$", "$12$"]] }, "structure"),
    discussionSlide("est-discuss-039"),
    practiceSlide("est-p-zeros-dec", "estimation", "estimation-leading-zeros", ["est-07", "est-10"], { level: "level2", multiSelect: L1([false, false, true, false]) }),
    practiceSlide("est-p-whole", "estimation", "estimation-round-to-whole", ["est-09"], { level: "level2", multiSelect: L1([true, true, false, false]) }),
    practiceSlide("est-p-divide", "estimation", "estimation-divide-decimal", ["est-08", "est-11"], { level: "level2", multiSelect: L1([false, false, false, true]) }),
    depthSlide("est-depth-divide", "estimation", "est-divide-half", "Dividing by a decimal"),

    dividerSlide("est-div-fractions", "Fractions"),
    depthSlide("est-depth-frac", "estimation", "est-frac-57", "A fraction to estimate"),
    practiceSlide("est-p-result", "estimation", "estimation-round-result", ["est-12", "est-14"], { level: "level3", multiSelect: { fracbar: true, fracterm: false } }),
    practiceSlide("est-p-zeros-frac", "estimation", "estimation-calc-zeros", ["est-13"], { level: "level3", multiSelect: { fracbar: true, fracterm: false } }),

    gridSlide("est-exit", "Exit ticket", ["est-06", "est-11", "est-14"], 3, "retrieval"),
    plenarySlide("est-plenary", "Summary", ["Round every number to 1 significant figure first.", "Then calculate with the rounded numbers.", "Check the size of the answer: is it sensible?"]),
  ],
};
