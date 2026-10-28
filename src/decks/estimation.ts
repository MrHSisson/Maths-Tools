import type { DeckDef } from "./types";
import { boardSlide, generatorSlide, worksheetSlide, definitionSlide, depthSlide, discussionSlide, dividerSlide, gridSlide, objectiveSlide, plenarySlide, practiceSlide, titleSlide, vocabSlide } from "./layouts";

// Estimation: rounding to 1 significant figure, then calculating. One lesson, directed: objective and language,
// boards to fill in live, then practice slides that each catch one named misconception.
const L1 = (ops: [boolean, boolean, boolean, boolean]) => ({ add: ops[0], subtract: ops[1], multiply: ops[2], divide: ops[3] });

const ESTIMATION_THREAD: Record<string, NonNullable<import("./types").Slide["intent"]>> = {
  "est-title": {"purpose": "Introduce estimation as a useful approximation.", "questionFocus": "Use an estimation context; do not start with an exact calculation.", "evidence": "Pupils describe why an approximate answer can be useful.", "next": "State the learning goal."},
  "est-objective": {"purpose": "Make the round-first-then-calculate goal explicit.", "questionFocus": "Separate rounding, calculation and checking size.", "evidence": "Pupils can name all three actions.", "next": "Agree the language used in working."},
  "est-vocab": {"purpose": "Establish estimate, significant figure and approximately equal.", "questionFocus": "Include decimal place value; distinguish approximate from exact.", "evidence": "Pupils identify the first non-zero digit.", "next": "Use the definition to frame the method."},
  "est-definition": {"purpose": "Agree the estimation method used in this lesson.", "questionFocus": "Round every operand to one significant figure before calculating.", "evidence": "Pupils say round first rather than round the exact answer.", "next": "Check rounding separately before combining skills."},
  "est-div-rounding": {"purpose": "Signal a focus on rounding alone.", "questionFocus": "No calculations yet.", "evidence": "Pupils know which skill they are rehearsing.", "next": "Use the rounding board to check readiness."},
  "est-board-round": {"purpose": "Check whole-number and decimal rounding to one significant figure.", "questionFocus": "Use the five fixed values; vary digit position including leading zeros.", "evidence": "Pupils retain place value and use the next digit to decide.", "next": "Revisit any errors before moving to calculations."},
  "est-div-calc": {"purpose": "Connect rounding to estimation of a calculation.", "questionFocus": "Whole numbers first; keep decimals for the next section.", "evidence": "Pupils can explain why rounding makes calculation manageable.", "next": "Model the complete method."},
  "est-board-calc": {"purpose": "Model round first, then multiply with place value intact.", "questionFocus": "Use 48 × 31; show 50 × 30 before 1500.", "evidence": "Pupils account for both zero factors.", "next": "Probe the lost-zeros misconception."},
  "est-p-zeros": {"purpose": "Expose losing place value when multiplying rounded numbers.", "questionFocus": "Five fixed whole-number products; vary zero factors while keeping multiplication.", "evidence": "Pupils explain why 50 × 30 is 1500, not 150.", "next": "If zeros are secure, check how operands were rounded."},
  "est-p-truncate": {"purpose": "Distinguish rounding from truncating operands.", "questionFocus": "Five fixed whole-number examples with rounding-up cases; vary operations deliberately.", "evidence": "Pupils use the deciding digit instead of always rounding down.", "next": "Then check the place to which each number is rounded."},
  "est-p-place": {"purpose": "Expose rounding to the wrong place.", "questionFocus": "Five fixed whole-number division estimates; keep one-significant-figure rounding central.", "evidence": "Pupils preserve the magnitude of each rounded operand.", "next": "Use a diagnostic comparison to combine these checks."},
  "est-depth-who": {"purpose": "Diagnose whether pupils can justify a valid estimate.", "questionFocus": "Compare the fixed claims; ask for reasoning before revealing correctness.", "evidence": "Pupils identify and explain the invalid rounding or calculation.", "next": "Use whole-number whiteboards to check independent transfer."},
  "est-gen-l1": {"purpose": "Check independent whole-number estimation after targeted practice.", "questionFocus": "Level 1 estimation only. Mixed add/subtract/multiply/divide; whole-number operands. This is a transfer check, not a bank for one misconception.", "evidence": "Both operands rounded to one significant figure; correct arithmetic and sensible scale.", "next": "Sample several boards. Return to the relevant fixed misconception sequence if errors persist; otherwise introduce decimals."},
  "est-div-decimals": {"purpose": "Extend the method to decimal operands.", "questionFocus": "Keep the method fixed while the size of operands changes.", "evidence": "Pupils expect the same rounding rule to apply.", "next": "Model division by a decimal."},
  "est-board-decimal": {"purpose": "Model why dividing by a number below one increases the result.", "questionFocus": "Use 6.1 ÷ 0.48, then 6 ÷ 0.5.", "evidence": "Pupils interpret how many halves fit into six.", "next": "Contrast decimal rounding choices explicitly."},
  "est-discuss-039": {"purpose": "Distinguish one significant figure from decimal places.", "questionFocus": "Use the fixed 0.39 discussion; justify the retained digit.", "evidence": "Pupils explain why the rounded value is 0.4.", "next": "Practise recognising leading zeros."},
  "est-p-zeros-dec": {"purpose": "Expose treating leading zeros as significant figures.", "questionFocus": "Five fixed decimal examples; preserve small magnitudes and the same misconception.", "evidence": "Pupils locate the first non-zero digit before rounding.", "next": "Check that small decimals are not rounded to whole numbers."},
  "est-p-whole": {"purpose": "Expose rounding every decimal to a whole number.", "questionFocus": "Five fixed decimal addition/subtraction estimates; include values below one.", "evidence": "Pupils distinguish one significant figure from nearest integer.", "next": "Apply these rounded values in division."},
  "est-p-divide": {"purpose": "Expose the belief that division must make a number smaller.", "questionFocus": "Five fixed division examples with decimal divisors below one.", "evidence": "Pupils explain and calculate the larger quotient.", "next": "Check the conceptual claim before independent practice."},
  "est-depth-divide": {"purpose": "Explain division by a decimal using meaning as well as procedure.", "questionFocus": "Use the fixed dividing-by-a-half diagnostic.", "evidence": "Pupils count fractional groups rather than rely on a slogan.", "next": "Move to a mixed decimal book activity when secure."},
  "est-book-l2": {"purpose": "Practise decimal estimation independently across operations.", "questionFocus": "Eight Level 2 estimation questions in two columns; decimal operands, mixed operations.", "evidence": "Written rounding of each operand and a sensible estimate.", "next": "Review errors by misconception before introducing compound fractions."},
  "est-div-fractions": {"purpose": "Introduce compound fraction estimates.", "questionFocus": "Keep rounding rule fixed; change the calculation structure.", "evidence": "Pupils see numerator and denominator as whole expressions.", "next": "Start with a diagnostic fraction example."},
  "est-depth-frac": {"purpose": "Check whether pupils round the numbers within a fraction expression.", "questionFocus": "Use the fixed fraction diagnostic before generating variations.", "evidence": "Pupils round operands before evaluating numerator and denominator.", "next": "Target rounding the final result as a separate misconception."},
  "est-p-result": {"purpose": "Expose calculating exactly and rounding the final result.", "questionFocus": "Five fixed Level 3 fraction-bar examples; contrast round-first working with the wrong order.", "evidence": "Working shows each operand rounded before calculation.", "next": "Check place value within the resulting fraction calculation."},
  "est-p-zeros-frac": {"purpose": "Preserve zero factors when evaluating rounded fractions.", "questionFocus": "Five fixed Level 3 fraction-bar questions targeting lost place value.", "evidence": "Numerator and denominator calculations retain all zero factors.", "next": "Move to mixed fraction transfer once both stages are secure."},
  "est-gen-l3": {"purpose": "Check transfer across fraction-bar and fraction-term estimation.", "questionFocus": "Level 3 estimation, both fracbar and fracterm enabled. Keep whole expressions visible; do not replace this with Level 2 arithmetic.", "evidence": "Pupils round every operand first, respect the fraction structure and justify the estimate size.", "next": "Use several boards; return to result-order or zero-factor practice if needed, then complete the exit ticket."},
  "est-exit": {"purpose": "Check retention across whole numbers, decimals and fractions.", "questionFocus": "Three fixed short questions, one from each section; keep this a short check.", "evidence": "Independent round-first working with correct scale.", "next": "Use the responses to choose the next lesson’s retrieval focus."},
  "est-plenary": {"purpose": "Consolidate the method and the reasonableness check.", "questionFocus": "Summarise the three actions without introducing new question types.", "evidence": "Pupils articulate round every operand, calculate, check size.", "next": "Revisit any exit-ticket misconceptions in retrieval."},
};

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
    practiceSlide("est-p-zeros", "estimation", "estimation-calc-zeros", ["est-01", "est-05", "est-15", "est-16", "est-17"], { level: "level1", multiSelect: L1([false, false, true, false]) }),
    practiceSlide("est-p-truncate", "estimation", "estimation-round-truncate", ["est-02", "est-04", "est-06", "est-18", "est-19"], { level: "level1", multiSelect: L1([true, true, true, false]) }),
    practiceSlide("est-p-place", "estimation", "estimation-round-wrong-place", ["est-03", "est-20", "est-21", "est-22", "est-23"], { level: "level1", multiSelect: L1([false, false, false, true]) }),
    depthSlide("est-depth-who", "estimation", "est-who-l1", "Who estimated well?"),
    generatorSlide("est-gen-l1", "estimation", { sub: "estimation", level: "level1" }, "Whiteboards: whole numbers", 11),

    dividerSlide("est-div-decimals", "Decimals"),
    boardSlide("est-board-decimal", "Estimate $6.1 \\div 0.48$", "What happens when we divide by a number less than 1?",
      { head: ["Calculation", "Round each number", "Calculate"], given: 1, rows: [["$6.1 \\div 0.48$", "$6 \\div 0.5$", "$12$"]] }, "structure"),
    discussionSlide("est-discuss-039"),
    practiceSlide("est-p-zeros-dec", "estimation", "estimation-leading-zeros", ["est-07", "est-10", "est-24", "est-25", "est-26"], { level: "level2", multiSelect: L1([false, false, true, false]) }),
    practiceSlide("est-p-whole", "estimation", "estimation-round-to-whole", ["est-09", "est-27", "est-28", "est-29", "est-30"], { level: "level2", multiSelect: L1([true, true, false, false]) }),
    practiceSlide("est-p-divide", "estimation", "estimation-divide-decimal", ["est-08", "est-11", "est-31", "est-32", "est-33"], { level: "level2", multiSelect: L1([false, false, false, true]) }),
    depthSlide("est-depth-divide", "estimation", "est-divide-half", "Dividing by a decimal"),
    worksheetSlide("est-book-l2", "estimation", { sub: "estimation", level: "level2" }, 8, 2, "Book activity: decimals", 21),

    dividerSlide("est-div-fractions", "Fractions"),
    depthSlide("est-depth-frac", "estimation", "est-frac-57", "A fraction to estimate"),
    practiceSlide("est-p-result", "estimation", "estimation-round-result", ["est-12", "est-14", "est-34", "est-35", "est-36"], { level: "level3", multiSelect: { fracbar: true, fracterm: false } }),
    practiceSlide("est-p-zeros-frac", "estimation", "estimation-calc-zeros", ["est-13", "est-37", "est-38", "est-39", "est-40"], { level: "level3", multiSelect: { fracbar: true, fracterm: false } }),

    generatorSlide("est-gen-l3", "estimation", { sub: "estimation", level: "level3", multiSelect: { fracbar: true, fracterm: true } }, "Whiteboards: fractions", 31),
    gridSlide("est-exit", "Exit ticket", ["est-06", "est-11", "est-14"], 3, "retrieval"),
    plenarySlide("est-plenary", "Summary", ["Round every number to 1 significant figure first.", "Then calculate with the rounded numbers.", "Check the size of the answer: is it sensible?"]),
  ].map((slide) => ({ ...slide, intent: ESTIMATION_THREAD[slide.id] })),
};
