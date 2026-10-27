import type { BankQuestion } from "./types";

// Hand-picked Estimation questions, each written against one misconception (src/shared/misconceptions.ts).
// Every answer and every step is checked by src/tests/decks.test.ts.
const q = (id: string, level: BankQuestion["level"], tag: string, latex: string, answer: string, working: [string, string][]): BankQuestion =>
  ({ id, tool: "estimation", level, tag: `estimation-${tag}`, latex, answer, working: working.map(([label, l]) => ({ label, latex: l })) });

export const ESTIMATION_BANK: BankQuestion[] = [
  // Level 1 — two whole numbers
  q("est-01", "level1", "calc-zeros", "48 \\times 31", "1500", [["Round to 1 s.f.:", "48 \\to 50, \\quad 31 \\to 30"], ["Calculate:", "50 \\times 30 = 1500"]]),
  q("est-05", "level1", "calc-zeros", "87 \\times 22", "1800", [["Round to 1 s.f.:", "87 \\to 90, \\quad 22 \\to 20"], ["Calculate:", "90 \\times 20 = 1800"]]),
  q("est-02", "level1", "round-truncate", "62 \\times 48", "3000", [["Round to 1 s.f.:", "62 \\to 60, \\quad 48 \\to 50"], ["Calculate:", "60 \\times 50 = 3000"]]),
  q("est-04", "level1", "round-truncate", "218 + 593", "800", [["Round to 1 s.f.:", "218 \\to 200, \\quad 593 \\to 600"], ["Calculate:", "200 + 600 = 800"]]),
  q("est-06", "level1", "round-truncate", "451 - 187", "300", [["Round to 1 s.f.:", "451 \\to 500, \\quad 187 \\to 200"], ["Calculate:", "500 - 200 = 300"]]),
  q("est-03", "level1", "round-wrong-place", "794 \\div 38", "20", [["Round to 1 s.f.:", "794 \\to 800, \\quad 38 \\to 40"], ["Calculate:", "800 \\div 40 = 20"]]),
  // Level 2 — decimals
  q("est-07", "level2", "leading-zeros", "4.8 \\times 0.39", "2", [["Round to 1 s.f.:", "4.8 \\to 5, \\quad 0.39 \\to 0.4"], ["Calculate:", "5 \\times 0.4 = 2"]]),
  q("est-10", "level2", "leading-zeros", "0.73 \\times 8.6", "6.3", [["Round to 1 s.f.:", "0.73 \\to 0.7, \\quad 8.6 \\to 9"], ["Calculate:", "0.7 \\times 9 = 6.3"]]),
  q("est-09", "level2", "round-to-whole", "9.7 + 0.82", "10.8", [["Round to 1 s.f.:", "9.7 \\to 10, \\quad 0.82 \\to 0.8"], ["Calculate:", "10 + 0.8 = 10.8"]]),
  q("est-08", "level2", "divide-decimal", "6.1 \\div 0.48", "12", [["Round to 1 s.f.:", "6.1 \\to 6, \\quad 0.48 \\to 0.5"], ["Calculate:", "6 \\div 0.5 = 12"]]),
  q("est-11", "level2", "divide-decimal", "31.2 \\div 0.62", "50", [["Round to 1 s.f.:", "31.2 \\to 30, \\quad 0.62 \\to 0.6"], ["Calculate:", "30 \\div 0.6 = 50"]]),
  // Level 3 — fractions
  q("est-12", "level3", "round-result", "\\dfrac{34 + 21}{11}", "5", [["Round to 1 s.f.:", "34 \\to 30, \\quad 21 \\to 20, \\quad 11 \\to 10"], ["Numerator:", "30 + 20 = 50"], ["Calculate:", "50 \\div 10 = 5"]]),
  q("est-14", "level3", "round-result", "\\dfrac{58 + 41}{19}", "5", [["Round to 1 s.f.:", "58 \\to 60, \\quad 41 \\to 40, \\quad 19 \\to 20"], ["Numerator:", "60 + 40 = 100"], ["Calculate:", "100 \\div 20 = 5"]]),
  q("est-13", "level3", "calc-zeros", "\\dfrac{82 \\times 19}{41}", "40", [["Round to 1 s.f.:", "82 \\to 80, \\quad 19 \\to 20, \\quad 41 \\to 40"], ["Numerator:", "80 \\times 20 = 1600"], ["Calculate:", "1600 \\div 40 = 40"]]),
];
