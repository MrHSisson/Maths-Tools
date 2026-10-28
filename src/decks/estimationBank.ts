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
  q("est-06", "level1", "round-truncate", "451 - 123", "400", [["Round to 1 s.f.:", "451 \\to 500, \\quad 123 \\to 100"], ["Calculate:", "500 - 100 = 400"]]),
  q("est-03", "level1", "round-wrong-place", "794 \\div 38", "20", [["Round to 1 s.f.:", "794 \\to 800, \\quad 38 \\to 40"], ["Calculate:", "800 \\div 40 = 20"]]),
  // Level 2 — decimals
  q("est-07", "level2", "leading-zeros", "4.8 \\times 0.39", "2", [["Round to 1 s.f.:", "4.8 \\to 5, \\quad 0.39 \\to 0.4"], ["Calculate:", "5 \\times 0.4 = 2"]]),
  q("est-10", "level2", "leading-zeros", "0.73 \\times 8.6", "6.3", [["Round to 1 s.f.:", "0.73 \\to 0.7, \\quad 8.6 \\to 9"], ["Calculate:", "0.7 \\times 9 = 6.3"]]),
  q("est-09", "level2", "round-to-whole", "9.7 + 0.82", "10.8", [["Round to 1 s.f.:", "9.7 \\to 10, \\quad 0.82 \\to 0.8"], ["Calculate:", "10 + 0.8 = 10.8"]]),
  q("est-08", "level2", "divide-decimal", "6.1 \\div 0.48", "12", [["Round to 1 s.f.:", "6.1 \\to 6, \\quad 0.48 \\to 0.5"], ["Calculate:", "6 \\div 0.5 = 12"]]),
  q("est-11", "level2", "divide-decimal", "31.2 \\div 0.62", "50", [["Round to 1 s.f.:", "31.2 \\to 30, \\quad 0.62 \\to 0.6"], ["Calculate:", "30 \\div 0.6 = 50"]]),
  // Level 3 — fractions
  q("est-12", "level3", "round-result", "\\dfrac{34 + 21}{11}", "5", [["Round to 1 s.f.:", "34 \\to 30, \\quad 21 \\to 20, \\quad 11 \\to 10"], ["Numerator:", "30 + 20 = 50"], ["Calculate:", "50 \\div 10 = 5"]]),
  q("est-14", "level3", "round-result", "\\dfrac{58 + 47}{19}", "5.5", [["Round to 1 s.f.:", "58 \\to 60, \\quad 47 \\to 50, \\quad 19 \\to 20"], ["Numerator:", "60 + 50 = 110"], ["Calculate:", "110 \\div 20 = 5.5"]]),
  q("est-13", "level3", "calc-zeros", "\\dfrac{82 \\times 19}{41}", "40", [["Round to 1 s.f.:", "82 \\to 80, \\quad 19 \\to 20, \\quad 41 \\to 40"], ["Numerator:", "80 \\times 20 = 1600"], ["Calculate:", "1600 \\div 40 = 40"]]),

  // Further fixed examples: ordered to vary place value and structure within the same misconception.
  q("est-15", "level1", "calc-zeros", "63 \\times 42", "2400", [["Round to 1 s.f.:", "63 \\to 60, \\quad 42 \\to 40"], ["Calculate:", "60 \\times 40 = 2400"]]),
  q("est-16", "level1", "calc-zeros", "214 \\times 18", "4000", [["Round to 1 s.f.:", "214 \\to 200, \\quad 18 \\to 20"], ["Calculate:", "200 \\times 20 = 4000"]]),
  q("est-17", "level1", "calc-zeros", "596 \\times 81", "48000", [["Round to 1 s.f.:", "596 \\to 600, \\quad 81 \\to 80"], ["Calculate:", "600 \\times 80 = 48000"]]),
  q("est-18", "level1", "round-truncate", "368 + 421", "800", [["Round to 1 s.f.:", "368 \\to 400, \\quad 421 \\to 400"], ["Calculate:", "400 + 400 = 800"]]),
  q("est-19", "level1", "round-truncate", "586 \\div 29", "20", [["Round to 1 s.f.:", "586 \\to 600, \\quad 29 \\to 30"], ["Calculate:", "600 \\div 30 = 20"]]),
  q("est-20", "level1", "round-wrong-place", "647 \\div 21", "30", [["Round to 1 s.f.:", "647 \\to 600, \\quad 21 \\to 20"], ["Calculate:", "600 \\div 20 = 30"]]),
  q("est-21", "level1", "round-wrong-place", "183 \\div 46", "4", [["Round to 1 s.f.:", "183 \\to 200, \\quad 46 \\to 50"], ["Calculate:", "200 \\div 50 = 4"]]),
  q("est-22", "level1", "round-wrong-place", "926 \\div 31", "30", [["Round to 1 s.f.:", "926 \\to 900, \\quad 31 \\to 30"], ["Calculate:", "900 \\div 30 = 30"]]),
  q("est-23", "level1", "round-wrong-place", "251 \\div 48", "6", [["Round to 1 s.f.:", "251 \\to 300, \\quad 48 \\to 50"], ["Calculate:", "300 \\div 50 = 6"]]),
  q("est-24", "level2", "leading-zeros", "0.043 \\times 6.8", "0.28", [["Round to 1 s.f.:", "0.043 \\to 0.04, \\quad 6.8 \\to 7"], ["Calculate:", "0.04 \\times 7 = 0.28"]]),
  q("est-25", "level2", "leading-zeros", "0.0062 \\times 48", "0.3", [["Round to 1 s.f.:", "0.0062 \\to 0.006, \\quad 48 \\to 50"], ["Calculate:", "0.006 \\times 50 = 0.3"]]),
  q("est-26", "level2", "leading-zeros", "2.7 \\times 0.081", "0.24", [["Round to 1 s.f.:", "2.7 \\to 3, \\quad 0.081 \\to 0.08"], ["Calculate:", "3 \\times 0.08 = 0.24"]]),
  q("est-27", "level2", "round-to-whole", "6.8 + 0.43", "7.4", [["Round to 1 s.f.:", "6.8 \\to 7, \\quad 0.43 \\to 0.4"], ["Calculate:", "7 + 0.4 = 7.4"]]),
  q("est-28", "level2", "round-to-whole", "5.4 - 0.76", "4.2", [["Round to 1 s.f.:", "5.4 \\to 5, \\quad 0.76 \\to 0.8"], ["Calculate:", "5 - 0.8 = 4.2"]]),
  q("est-29", "level2", "round-to-whole", "3.6 + 0.27", "4.3", [["Round to 1 s.f.:", "3.6 \\to 4, \\quad 0.27 \\to 0.3"], ["Calculate:", "4 + 0.3 = 4.3"]]),
  q("est-30", "level2", "round-to-whole", "7.6 - 0.64", "7.4", [["Round to 1 s.f.:", "7.6 \\to 8, \\quad 0.64 \\to 0.6"], ["Calculate:", "8 - 0.6 = 7.4"]]),
  q("est-31", "level2", "divide-decimal", "9.3 \\div 0.29", "30", [["Round to 1 s.f.:", "9.3 \\to 9, \\quad 0.29 \\to 0.3"], ["Calculate:", "9 \\div 0.3 = 30"]]),
  q("est-32", "level2", "divide-decimal", "15.8 \\div 0.41", "50", [["Round to 1 s.f.:", "15.8 \\to 20, \\quad 0.41 \\to 0.4"], ["Calculate:", "20 \\div 0.4 = 50"]]),
  q("est-33", "level2", "divide-decimal", "3.8 \\div 0.19", "20", [["Round to 1 s.f.:", "3.8 \\to 4, \\quad 0.19 \\to 0.2"], ["Calculate:", "4 \\div 0.2 = 20"]]),
  q("est-34", "level3", "round-result", "\\dfrac{46 + 35}{18}", "4.5", [["Round to 1 s.f.:", "46 \\to 50, \\quad 35 \\to 40, \\quad 18 \\to 20"], ["Numerator:", "50 + 40 = 90"], ["Calculate:", "90 \\div 20 = 4.5"]]),
  q("est-35", "level3", "round-result", "\\dfrac{68 + 26}{22}", "5", [["Round to 1 s.f.:", "68 \\to 70, \\quad 26 \\to 30, \\quad 22 \\to 20"], ["Numerator:", "70 + 30 = 100"], ["Calculate:", "100 \\div 20 = 5"]]),
  q("est-36", "level3", "round-result", "\\dfrac{76 + 35}{28}", "4", [["Round to 1 s.f.:", "76 \\to 80, \\quad 35 \\to 40, \\quad 28 \\to 30"], ["Numerator:", "80 + 40 = 120"], ["Calculate:", "120 \\div 30 = 4"]]),
  q("est-37", "level3", "calc-zeros", "\\dfrac{63 \\times 42}{28}", "80", [["Round to 1 s.f.:", "63 \\to 60, \\quad 42 \\to 40, \\quad 28 \\to 30"], ["Numerator:", "60 \\times 40 = 2400"], ["Calculate:", "2400 \\div 30 = 80"]]),
  q("est-38", "level3", "calc-zeros", "\\dfrac{214 \\times 18}{46}", "80", [["Round to 1 s.f.:", "214 \\to 200, \\quad 18 \\to 20, \\quad 46 \\to 50"], ["Numerator:", "200 \\times 20 = 4000"], ["Calculate:", "4000 \\div 50 = 80"]]),
  q("est-39", "level3", "calc-zeros", "\\dfrac{596 \\times 81}{21}", "2400", [["Round to 1 s.f.:", "596 \\to 600, \\quad 81 \\to 80, \\quad 21 \\to 20"], ["Numerator:", "600 \\times 80 = 48000"], ["Calculate:", "48000 \\div 20 = 2400"]]),
  q("est-40", "level3", "calc-zeros", "\\dfrac{0.62 \\times 418}{0.31}", "800", [["Round to 1 s.f.:", "0.62 \\to 0.6, \\quad 418 \\to 400, \\quad 0.31 \\to 0.3"], ["Numerator:", "0.6 \\times 400 = 240"], ["Calculate:", "240 \\div 0.3 = 800"]]),
];

// Each expected response is worked for this exact example, not a generic label.
const TEACHING: Record<string, [string, string, string]> = {
  "est-01": ["$150$", "Loses a factor of ten in $50 \\times 30$.", "What does tens times tens represent?"],
  "est-05": ["$180$", "Treats $90 \\times 20$ as nine times two tens.", "Compare $9 \\times 2$, $90 \\times 2$ and $90 \\times 20$."],
  "est-02": ["$2400$", "Truncates $48$ to $40$, giving $60 \\times 40$.", "Is 48 closer to 40 or 50?"],
  "est-04": ["$700$", "Truncates $593$ to $500$, giving $200+500$.", "Which two hundreds surround 593?"],
  "est-06": ["$300$", "Truncates $451$ to $400$, giving $400-100$.", "Which digit decides whether 451 rounds up?"],
  "est-03": ["$19.75$", "Rounds to tens: $790 \\div 40$ instead of $800 \\div 40$.", "Where is the first significant digit of 794?"],
  "est-07": ["$0$", "Replaces the small decimal $0.39$ by zero.", "Where is the first non-zero digit in 0.39?"],
  "est-10": ["$0$", "Replaces $0.73$ by zero instead of preserving its first significant digit.", "Does one significant figure mean a whole number?"],
  "est-09": ["$11$", "Rounds $0.82$ to the whole number 1, then calculates $10+1$.", "What is the place value of the first significant digit in 0.82?"],
  "est-08": ["$3$", "Multiplies $6$ by $0.5$ instead of dividing.", "How many halves fit into six?"],
  "est-11": ["$18$", "Multiplies $30$ by $0.6$ instead of dividing.", "Should dividing by a number below one increase or decrease the result?"],
  "est-12": ["$6$", "Adds the numerator first: $55$ rounds to $60$, giving $60 \\div 10$.", "Which numbers in the original expression must be rounded first?"],
  "est-14": ["$5$", "Adds the numerator first: $105$ rounds to $100$, giving $100 \\div 20=5$.", "Compare rounding 58 and 47 separately with rounding their sum."],
  "est-13": ["$4$", "Loses a zero in $80 \\times 20$, then divides by 40.", "What should the numerator be before dividing?"],
  "est-15": ["$240$", "Loses a factor of ten in $60 \\times 40$.", "How many tens are in each factor, and what are tens times tens?"],
  "est-16": ["$400$", "Keeps only two zeros in $200 \\times 20$ instead of three.", "Compare 2 times 2 with 200 times 20. How has each factor changed?"],
  "est-17": ["$4800$", "Computes $6 \\times 8$ but loses one place-value factor in $600 \\times 80$.", "Say hundreds times tens aloud before calculating."],
  "est-18": ["$700$", "Drops digits to get $300+400$; the 6 in 368 should round the hundreds up.", "Is 368 nearer 300 or 400? What decides?"],
  "est-19": ["$25$", "Truncates both numbers and calculates $500 \\div 20$.", "Place 586 between two hundreds and 29 between two tens. Which neighbours are closer?"],
  "est-20": ["$32.5$", "Rounds 647 to the nearest ten, giving $650 \\div 20$, instead of to one significant figure.", "Which place contains the first significant digit in 647?"],
  "est-21": ["$3.6$", "Rounds 183 to 180 and calculates $180 \\div 50$.", "Why does one significant figure in a three-digit number mean rounding to hundreds?"],
  "est-22": ["$31$", "Rounds 926 to 930, giving $930 \\div 30$.", "Compare rounding 926 to one significant figure and to the nearest ten."],
  "est-23": ["$5$", "Rounds 251 to the nearest ten, giving $250 \\div 50$.", "Which digit decides whether the hundreds digit rounds up?"],
  "est-24": ["$0$", "Replaces $0.043$ by zero rather than retaining its first significant digit in the hundredths column.", "Which zeros locate the 4, and which digit is significant?"],
  "est-25": ["$0$", "Replaces $0.0062$ by zero, so the product is zero.", "What is the place value of the 6? How do the leading zeros preserve it?"],
  "est-26": ["$0$", "Treats $0.081$ as zero instead of eight hundredths.", "Would three lots of about eight hundredths be close to nothing?"],
  "est-27": ["$7$", "Rounds $0.43$ to the whole number zero, giving $7+0$.", "Why does 0.43 still contribute to the estimate?"],
  "est-28": ["$4$", "Rounds $0.76$ to the whole number one, giving $5-1$.", "Compare one significant figure with zero decimal places for 0.76."],
  "est-29": ["$4$", "Rounds $0.27$ to a whole number instead of one significant figure.", "Which digit in 0.27 is the first significant figure, and which digit decides?"],
  "est-30": ["$7$", "Rounds $0.64$ to one and calculates $8-1$.", "Does the first significant digit of 0.64 sit in the units column?"],
  "est-31": ["$2.7$", "Multiplies $9$ by $0.3$ instead of dividing by it.", "How many tenths are in nine, and how many groups of three tenths?"],
  "est-32": ["$8$", "Multiplies $20$ by $0.4$, making the result smaller instead of finding how many groups fit.", "How many groups of four tenths fit into twenty?"],
  "est-33": ["$0.8$", "Finds $4 \\times 0.2$ instead of $4 \\div 0.2$.", "How many fifths fit into each whole? How many fit into four?"],
  "est-34": ["$4$", "Adds first: $46+35=81$ rounds to 80, giving $80 \\div 20$.", "Why does rounding each addend first differ from rounding their sum?"],
  "est-35": ["$4.5$", "Adds first: $68+26=94$ rounds to 90, giving $90 \\div 20$.", "Write the rounded version of the original expression before doing any arithmetic."],
  "est-36": ["$\\dfrac{10}{3}$", "Adds first: $76+35=111$ rounds to 100, giving $100 \\div 30$.", "Circle the three original numbers. Which ones are rounded before calculating?"],
  "est-37": ["$8$", "Loses a zero in the numerator, using $240 \\div 30$.", "Check the numerator using tens times tens before dividing."],
  "est-38": ["$8$", "Uses $400 \\div 50$ after losing a zero in $200 \\times 20$.", "How many zeros come from the factors before dividing by 50?"],
  "est-39": ["$240$", "Uses $4800 \\div 20$ after losing one place-value factor in the numerator.", "Track multiplication and division scale factors separately."],
  "est-40": ["$80$", "Loses a factor of ten in the product, then uses $24 \\div 0.3$.", "Use six tenths of four hundred to check the numerator before dividing."],
};
for (const item of ESTIMATION_BANK) {
  const [response, reasoning, followUp] = TEACHING[item.id];
  item.title = `Estimate $${item.latex}$`;
  item.teaching = { rationale: `Use this example to discuss the incorrect response ${response}. ${reasoning} Ask for working: a final answer alone does not establish the student's misconception.`, expectedErrors: [{ response, reasoning }], followUp };
}
