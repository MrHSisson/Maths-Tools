import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  randInt, pick, step, mStep,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "findingPercentages" | "percentageChange" | "reversePercentages";

// ── 2. Maths helpers ──────────────────────────────────────────────────────────

// Strips binary floating-point noise (e.g. 0.1 + 0.2) without forcing a fixed
// number of decimal places — the values here are already "nice" GCSE numbers.
const clean = (n: number): number => Math.round(n * 1e6) / 1e6;
// Rounds to the nearest penny — every currency amount is re-rounded at each
// step, so chained multiplications (e.g. a compound percentage change) never
// pick up extra decimal places from multiplying two already-rounded amounts.
const money = (n: number): number => Math.round(n * 100) / 100;
const gbp = (n: number): string => `\\pounds ${n}`; // KaTeX currency — never a literal £ inside KaTeX

const ITEMS = ["shirt", "laptop", "phone", "TV", "watch", "bag", "book", "desk", "bicycle", "camera"];

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const FP_METHOD_DD = {
  key: "method", label: "Method",
  options: [
    { value: "multiplier", label: "Multiplier" },
    { value: "chunking", label: "Chunking" },
  ],
  defaultValue: "multiplier",
};
const FP_DECIMALS_VAR = { key: "useDecimals", label: "Decimal amounts", defaultValue: false };

const PC_DIRECTION_DD = {
  key: "direction", label: "Direction",
  options: [
    { value: "increase", label: "Increase" },
    { value: "decrease", label: "Decrease" },
    { value: "mixed", label: "Mixed" },
  ],
  defaultValue: "mixed",
};
const PC_SHOWMULT_VAR = { key: "showMultiplier", label: "Show multiplier working", defaultValue: false };

const RP_CONTEXT_DD = {
  key: "context", label: "Context",
  options: [
    { value: "sales", label: "Sales / Discounts" },
    { value: "vat", label: "VAT / Tax" },
    { value: "general", label: "General" },
  ],
  defaultValue: "sales",
};
const RP_UNITARY_VAR = { key: "unitaryMethod", label: "Unitary method", defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Percentages",
  tools: {

    findingPercentages: {
      name: "Finding Percentages",
      variables: [FP_DECIMALS_VAR],
      dropdown: FP_METHOD_DD,
      difficultySettings: null,
    },

    percentageChange: {
      name: "Percentage Change",
      variables: [PC_SHOWMULT_VAR],
      dropdown: PC_DIRECTION_DD,
      difficultySettings: null,
    },

    reversePercentages: {
      name: "Reverse Percentages",
      variables: [RP_UNITARY_VAR],
      dropdown: RP_CONTEXT_DD,
      difficultySettings: null,
    },

  },
};

// ── 4. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Finding Percentages", icon: "%", content: [
    { label: "Overview",         detail: "Find a percentage of an amount using the multiplier or chunking method." },
    { label: "Level 1 — Green",  detail: "Friendly percentages (multiples of 10, or 25%/75%) of multiples of 10." },
    { label: "Level 2 — Yellow", detail: "Any whole-number percentage of any whole-number amount." },
    { label: "Level 3 — Red",    detail: "Percentages over 100%, or fractional percentages such as 12.5%." },
    { label: "Method",           detail: "Multiplier converts the percentage to a decimal and multiplies; Chunking builds the percentage from 10%s and 1%s (and 50%/25% at Level 1)." },
    { label: "Decimal amounts",  detail: "Switches the base amount from a whole number to one decimal place." },
  ]},
  { title: "Percentage Change", icon: "📈", content: [
    { label: "Overview",         detail: "Find a new value after a percentage increase or decrease, using the multiplier method." },
    { label: "Level 1 — Green",  detail: "Simple integer percentages of amounts under 100." },
    { label: "Level 2 — Yellow", detail: "Realistic contexts — VAT-style increases, sale-style decreases — with 1 d.p. prices." },
    { label: "Level 3 — Red",    detail: "Large single changes, or a compound two-step change (increase then decrease)." },
    { label: "Show multiplier working", detail: "Reveals how the multiplier is built from 100% ± the percentage." },
  ]},
  { title: "Reverse Percentages", icon: "🔄", content: [
    { label: "Overview",         detail: "Work backwards from a percentage of an original amount to find the original (100%)." },
    { label: "Level 1 — Green",  detail: "Friendly percentages (20%, 25%, 40%, 50% …) of a clean original." },
    { label: "Level 2 — Yellow", detail: "Sales/discount or VAT/tax contexts with realistic prices." },
    { label: "Level 3 — Red",    detail: "Large increases (over 100%) or very small percentage changes." },
    { label: "Unitary method",   detail: "Finds 1% first, then scales up to 100% — the alternative to dividing by the multiplier directly." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Single question on the left, working space on the right." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "Grid of questions with adjustable count and PDF export." },
  ]},
];

// ── 5. Finding Percentages ────────────────────────────────────────────────────

const FP_FRIENDLY_PCT = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
const FP_FRACTIONAL_PCT = [0.1, 0.2, 0.4, 0.5, 12.5, 37.5, 62.5, 87.5];

const chunkingSteps = (percent: number, amount: number, level: DifficultyLevel): WorkingStep[] => {
  const ten = clean(amount * 0.1);
  const one = clean(amount * 0.01);
  const steps: WorkingStep[] = [
    mStep("Find 10% and 1% of the amount:", [`10\\% = ${amount} \\div 10 = ${ten}`, `1\\% = ${amount} \\div 100 = ${one}`]),
  ];

  type Part = { label: string; calc: string; value: number };
  const parts: Part[] = [];
  let remaining = percent;

  if (level === "level1" && remaining >= 50) {
    const n = Math.floor(remaining / 50);
    if (n > 0) {
      const fifty = clean(amount * 0.5);
      const calc = n > 1 ? `${n} \\times 50\\% = ${n} \\times ${fifty}` : `${amount} \\div 2`;
      parts.push({ label: `${n * 50}\\%`, calc, value: clean(fifty * n) });
      remaining = clean(remaining - n * 50);
    }
  }
  if (level === "level1" && (percent === 25 || percent === 75) && remaining >= 25) {
    const n = Math.floor(remaining / 25);
    if (n > 0) {
      const twentyFive = clean(amount * 0.25);
      const calc = n > 1 ? `${n} \\times 25\\% = ${n} \\times ${twentyFive}` : `${amount} \\div 4`;
      parts.push({ label: `${n * 25}\\%`, calc, value: clean(twentyFive * n) });
      remaining = clean(remaining - n * 25);
    }
  }
  if (remaining >= 10) {
    const n = Math.floor(remaining / 10);
    parts.push({ label: `${n * 10}\\%`, calc: `${n} \\times 10\\% = ${n} \\times ${ten}`, value: clean(ten * n) });
    remaining = clean(remaining - n * 10);
  }
  if (remaining > 0) {
    parts.push({ label: `${remaining}\\%`, calc: `${remaining} \\times 1\\% = ${remaining} \\times ${one}`, value: clean(remaining * one) });
  }

  parts.forEach(p => steps.push(step(`${p.calc} = ${p.value}`)));

  if (parts.length > 1) {
    const labels = parts.map(p => p.label).join(" + ");
    const values = parts.map(p => p.value).join(" + ");
    const total = clean(parts.reduce((s, p) => s + p.value, 0));
    steps.push(mStep(`${percent}\\% = ${labels}:`, `${values} = ${total}`));
  }

  return steps;
};

const genFindingPercentages = (level: DifficultyLevel, method: string, useDecimals: boolean): AnyQuestion => {
  const id = randInt(0, 999_999);

  let amount: number;
  let percent: number;

  if (level === "level1") {
    percent = pick(FP_FRIENDLY_PCT);
    amount = useDecimals ? clean(randInt(100, 1500) / 10) : randInt(1, 100) * 10;
  } else if (level === "level2") {
    percent = randInt(5, 94);
    amount = useDecimals ? clean(randInt(100, 1500) / 10) : randInt(10, 250);
  } else {
    percent = Math.random() < 0.5 ? randInt(105, 254) : pick(FP_FRACTIONAL_PCT);
    amount = useDecimals ? clean(randInt(100, 1500) / 10) : randInt(10, 250);
  }

  const result = clean((percent / 100) * amount);
  const useChunking = method === "chunking";

  const working: WorkingStep[] = useChunking
    ? chunkingSteps(percent, amount, level)
    : [
        mStep("Convert to a decimal:", [`${percent}\\% \\div 100`, `= ${clean(percent / 100)}`]),
        mStep("Multiply by the amount:", [`${clean(percent / 100)} \\times ${amount}`, `= ${result}`]),
      ];

  return {
    kind: "worded",
    lines: [`Find ${percent}% of ${amount}`],
    answer: `${result}`, answerLatex: `${result}`,
    working,
    key: `findingPercentages-${level}-${method}-${useDecimals}-${percent}-${amount}-${id}`,
    difficulty: level,
  } as AnyQuestion;
};

// ── 6. Percentage Change ──────────────────────────────────────────────────────

const PC_L1_PCT = [10, 15, 20, 25, 30, 40, 50];

const genPercentageChange = (level: DifficultyLevel, direction: string, showMultiplier: boolean): AnyQuestion => {
  const id = randInt(0, 999_999);
  const isIncrease = direction === "increase" ? true : direction === "decrease" ? false : Math.random() < 0.5;

  if (level === "level3" && Math.random() < 0.3) {
    const percent1 = randInt(10, 29);
    const percent2 = randInt(10, 29);
    const vOrig = randInt(50, 199);
    const mult1 = clean(1 + percent1 / 100);
    const mult2 = clean(1 - percent2 / 100);
    const intermediate = money(vOrig * mult1);
    const vNew = money(intermediate * mult2);

    return {
      kind: "worded",
      lines: [
        `A value starts at £${vOrig}.`,
        `It increases by ${percent1}%, then decreases by ${percent2}%.`,
        "Find the final value.",
      ],
      answer: `£${vNew}`, answerLatex: gbp(vNew),
      working: [
        mStep("Initial value:", gbp(vOrig)),
        mStep(`After a ${percent1}% increase:`, [`${gbp(vOrig)} \\times ${mult1}`, `= ${gbp(intermediate)}`]),
        mStep(`After a ${percent2}% decrease:`, [`${gbp(intermediate)} \\times ${mult2}`, `= ${gbp(vNew)}`]),
      ],
      key: `percentageChange-level3-compound-${percent1}-${percent2}-${vOrig}-${id}`,
      difficulty: level,
    } as AnyQuestion;
  }

  let percent: number;
  let vOrig: number;

  if (level === "level1") {
    percent = pick(PC_L1_PCT);
    vOrig = randInt(10, 99);
  } else if (level === "level2") {
    percent = isIncrease ? randInt(5, 20) : randInt(10, 70);
    vOrig = clean(randInt(100, 2000) / 10);
  } else {
    percent = isIncrease ? randInt(50, 149) : randInt(60, 89);
    vOrig = randInt(50, 149);
  }

  const mult = clean(isIncrease ? 1 + percent / 100 : 1 - percent / 100);
  const vNew = money(vOrig * mult);
  const item = pick(ITEMS);
  const changeWord = isIncrease ? "increased" : "decreased";

  const multiplierStep = showMultiplier
    ? mStep("Find the multiplier:", isIncrease
        ? [`100\\% + ${percent}\\%`, `= ${100 + percent}\\%`, `= ${mult}`]
        : [`100\\% - ${percent}\\%`, `= ${100 - percent}\\%`, `= ${mult}`])
    : mStep("Multiplier:", `${mult}`);

  return {
    kind: "worded",
    lines: [
      `A ${item} costs £${vOrig}.`,
      `The price ${changeWord} by ${percent}%.`,
      "Find the new price.",
    ],
    answer: `£${vNew}`, answerLatex: gbp(vNew),
    working: [
      multiplierStep,
      mStep("Multiply the original price:", [`${gbp(vOrig)} \\times ${mult}`, `= ${gbp(vNew)}`]),
    ],
    key: `percentageChange-${level}-${isIncrease}-${percent}-${vOrig}-${id}`,
    difficulty: level,
  } as AnyQuestion;
};

// ── 7. Reverse Percentages ────────────────────────────────────────────────────

const RP_L1_PCT = [20, 25, 40, 50, 60, 75, 80];
const RP_VAT_RATES = [5, 10, 12.5, 20];
const RP_SMALL_PCT = [0.1, 0.2, 0.5, 1.5, 2.5];

const genReversePercentages = (level: DifficultyLevel, context: string, unitaryMethod: boolean): AnyQuestion => {
  const id = randInt(0, 999_999);

  if (level === "level1") {
    const percent = pick(RP_L1_PCT);
    const vOrig = randInt(1, 19) * 10;
    const vNew = money((percent / 100) * vOrig);

    const working: WorkingStep[] = unitaryMethod
      ? [
          mStep(`${percent}% of the original is:`, gbp(vNew)),
          mStep("Find 1%:", [`${gbp(vNew)} \\div ${percent}`, `= ${gbp(money(vNew / percent))}`]),
          mStep("Find 100% (the original):", [`${gbp(money(vNew / percent))} \\times 100`, `= ${gbp(vOrig)}`]),
        ]
      : [
          mStep(`${percent}% of the original is:`, gbp(vNew)),
          mStep("Divide by the percentage as a decimal:", [`${gbp(vNew)} \\div ${percent / 100}`, `= ${gbp(vOrig)}`]),
        ];

    return {
      kind: "worded",
      lines: [`${percent}% of a value is £${vNew}.`, "Find the original value (100%)."],
      answer: `£${vOrig}`, answerLatex: gbp(vOrig),
      working,
      key: `reversePercentages-level1-${percent}-${vOrig}-${id}`,
      difficulty: level,
    } as AnyQuestion;
  }

  if (level === "level2") {
    const isIncrease = context === "vat" ? true : context === "sales" ? false : Math.random() < 0.5;
    const percent = context === "vat" ? pick(RP_VAT_RATES) : randInt(15, 55);
    const vOrig = randInt(10, 150);
    const totalPercent = clean(isIncrease ? 100 + percent : 100 - percent);
    const mult = clean(totalPercent / 100);
    const vNew = money(vOrig * mult);
    const item = pick(ITEMS);
    const changeDesc = isIncrease ? `including ${percent}% tax` : `after a ${percent}% discount`;

    const working: WorkingStep[] = unitaryMethod
      ? [
          mStep(`New price (${totalPercent}% of the original):`, gbp(vNew)),
          mStep("Find 1%:", [`${gbp(vNew)} \\div ${totalPercent}`, `= ${gbp(money(vNew / totalPercent))}`]),
          mStep("Find 100% (the original):", [`${gbp(money(vNew / totalPercent))} \\times 100`, `= ${gbp(vOrig)}`]),
        ]
      : [
          mStep(`New price represents ${totalPercent}% of the original:`, gbp(vNew)),
          mStep("Divide by the percentage as a decimal:", [`${gbp(vNew)} \\div ${mult}`, `= ${gbp(vOrig)}`]),
        ];

    return {
      kind: "worded",
      lines: [`A ${item} costs £${vNew} ${changeDesc}.`, "Find the original price."],
      answer: `£${vOrig}`, answerLatex: gbp(vOrig),
      working,
      key: `reversePercentages-level2-${isIncrease}-${percent}-${vOrig}-${id}`,
      difficulty: level,
    } as AnyQuestion;
  }

  // Level 3 — large increase, or a very small percentage change
  if (Math.random() < 0.5) {
    const percent = randInt(100, 199);
    const vOrig = randInt(20, 70);
    const totalPercent = 100 + percent;
    const mult = clean(totalPercent / 100);
    const vNew = money(vOrig * mult);

    const working: WorkingStep[] = unitaryMethod
      ? [
          mStep(`New value (${totalPercent}% of the original):`, gbp(vNew)),
          mStep("Find 1%:", [`${gbp(vNew)} \\div ${totalPercent}`, `= ${gbp(money(vNew / totalPercent))}`]),
          mStep("Find 100% (the original):", [`${gbp(money(vNew / totalPercent))} \\times 100`, `= ${gbp(vOrig)}`]),
        ]
      : [
          mStep(`New value represents ${totalPercent}% of the original:`, gbp(vNew)),
          mStep("Divide by the percentage as a decimal:", [`${gbp(vNew)} \\div ${mult}`, `= ${gbp(vOrig)}`]),
        ];

    return {
      kind: "worded",
      lines: [`The value of a cryptocurrency increased by ${percent}% to £${vNew}.`, "Find the original value."],
      answer: `£${vOrig}`, answerLatex: gbp(vOrig),
      working,
      key: `reversePercentages-level3-large-${percent}-${vOrig}-${id}`,
      difficulty: level,
    } as AnyQuestion;
  }

  const percent = pick(RP_SMALL_PCT);
  const isIncrease = Math.random() < 0.5;
  const vOrig = randInt(100, 999);
  const totalPercent = clean(isIncrease ? 100 + percent : 100 - percent);
  const mult = clean(totalPercent / 100);
  const vNew = money(vOrig * mult);
  const changeWord = isIncrease ? "increased" : "decreased";

  const working: WorkingStep[] = unitaryMethod
    ? [
        mStep(`New population (${totalPercent}% of the original):`, `${vNew}`, "thousand"),
        mStep("Find 1%:", [`${vNew} \\div ${totalPercent}`, `= ${money(vNew / totalPercent)}`], "thousand"),
        mStep("Find 100% (the original):", [`${money(vNew / totalPercent)} \\times 100`, `= ${vOrig}`], "thousand"),
      ]
    : [
        mStep(`New population represents ${totalPercent}% of the original:`, `${vNew}`, "thousand"),
        mStep("Divide by the percentage as a decimal:", [`${vNew} \\div ${mult}`, `= ${vOrig}`], "thousand"),
      ];

  return {
    kind: "worded",
    lines: [`A population ${changeWord} by ${percent}% to ${vNew} thousand.`, "Find the original population."],
    answer: `${vOrig} thousand`, answerLatex: `${vOrig}`, answerSuffix: "thousand",
    working,
    key: `reversePercentages-level3-small-${percent}-${isIncrease}-${vOrig}-${id}`,
    difficulty: level,
  } as AnyQuestion;
};

// ── 8. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  _multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;

  if (t === "findingPercentages") {
    return genFindingPercentages(level, dropdownValue || "multiplier", variables.useDecimals ?? false);
  }
  if (t === "percentageChange") {
    return genPercentageChange(level, dropdownValue || "mixed", variables.showMultiplier ?? false);
  }
  return genReversePercentages(level, dropdownValue || "sales", variables.unitaryMethod ?? false);
};

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
    />
  );
}
