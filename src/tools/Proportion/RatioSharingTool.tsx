import {
  ToolShell, getQuestionBg,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type WorkingStep,
  mStep, mStr, pick, randInt, pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "sharing" | "known" | "difference" | "mixed";

// ── 2. Number helpers ─────────────────────────────────────────────────────────

const NAMES = ["Alice","Ben","Charlie","Diana","Emma","Finn","Grace","Harry","Isla","Jack","Kate","Liam","Mia","Noah","Olivia","Peter"];
const twoNames = (): string[] => [...NAMES].sort(() => Math.random() - 0.5).slice(0, 2);

const fmtAmt = (n: number): string => n % 1 === 0 ? String(n) : n.toFixed(2);
const fp = (n: number): string => `£${fmtAmt(n)}`;
const fc = (n: number): string => `\\pounds ${fmtAmt(n)}`;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const isCoprime = (a: number, b: number): boolean => gcd(a, b) === 1;

// ── 3. Bar color helpers ──────────────────────────────────────────────────────

const getBarEmptyBg = (cs: string) => getQuestionBg(cs);
const getBarKnownBg = (cs: string) => ({ blue: "#7eb8e0", pink: "#e07eb8", yellow: "#e0e07e" }[cs] ?? "#93c5fd");
const getBarDiffBg  = (cs: string) => ({ blue: "#d8b4fe", pink: "#fed8b4", yellow: "#b4fed8" }[cs] ?? "#e9d5ff");

// ── 4. Bar step builder ───────────────────────────────────────────────────────

const bStep = (t: string, data: Record<string, unknown>): WorkingStep => ({
  type: t, latex: "", plain: "", extra: data,
});

// ── 5. Bar step builders ──────────────────────────────────────────────────────

const sharingBarSteps = (
  parts: number[], total: number, ratioSum: number, partValue: number, shares: number[], names: string[],
): WorkingStep[] => [
  bStep("bar_empty", { bars: parts.map((p, i) => ({ person: names[i], boxes: p })) }),
  bStep("bar_total", { sum: ratioSum }),
  bStep("bar_part",  { total, sum: ratioSum, value: partValue }),
  bStep("bar_filled", { bars: parts.map((p, i) => ({ person: names[i], boxes: p, value: partValue, total: shares[i] })) }),
];

const knownBarSteps = (
  parts: number[], knownAmount: number, knownPerson: number, partValue: number,
  shares: number[], total: number, qtype: string, names: string[],
): WorkingStep[] => {
  const other = knownPerson === 0 ? 1 : 0;
  return [
    bStep("ka_bar_known", { bars: parts.map((p, i) => ({ person: names[i], boxes: p, isKnown: i === knownPerson, knownAmount: i === knownPerson ? knownAmount : null })) }),
    bStep("ka_identify",  { knownPerson: names[knownPerson], ratioPart: parts[knownPerson] }),
    bStep("ka_part_val",  { knownAmount, ratioPart: parts[knownPerson], partValue }),
    bStep("bar_filled",   { bars: parts.map((p, i) => ({ person: names[i], boxes: p, value: partValue, total: shares[i] })) }),
    ...(qtype === "total"
      ? [bStep("ka_total_bar", { shares, total })]
      : [bStep("ka_other_bar", { otherPerson: names[other], share: shares[other] })]),
  ];
};

const diffBarSteps = (
  parts: number[], difference: number, largerPerson: number, partValue: number,
  shares: number[], total: number, qtype: string, names: string[],
): WorkingStep[] => {
  const partDiff = Math.abs(parts[1] - parts[0]);
  return [
    bStep("diff_bar",     { bars: parts.map((p, i) => ({ person: names[i], boxes: p })), difference, largerPerson }),
    bStep("diff_identify", { difference, partDiff }),
    bStep("diff_part_val", { difference, partDiff, partValue }),
    bStep("bar_filled",    { bars: parts.map((p, i) => ({ person: names[i], boxes: p, value: partValue, total: shares[i] })) }),
    ...(qtype === "total"
      ? [bStep("ka_total_bar", { shares, total })]
      : qtype === "personA"
      ? [bStep("diff_read", { person: names[0], share: shares[0] })]
      : [bStep("diff_read", { person: names[1], share: shares[1] })]),
  ];
};

// ── 6. QO options ─────────────────────────────────────────────────────────────

const SHARE_OPTIONS = [
  { value: "personA", label: "Person A", defaultActive: true },
  { value: "personB", label: "Person B", defaultActive: true },
  { value: "both",    label: "Both",     defaultActive: true },
];

const KNOWN_OPTIONS = [
  { value: "total", label: "Total",        defaultActive: true },
  { value: "other", label: "Other person", defaultActive: true },
];

const DIFF_OPTIONS = [
  { value: "total",   label: "Total",    defaultActive: true },
  { value: "personA", label: "Person A", defaultActive: true },
  { value: "personB", label: "Person B", defaultActive: true },
];

const MIXED_OPTIONS = [
  { value: "sharing",    label: "Sharing",    defaultActive: true },
  { value: "known",      label: "Known",      defaultActive: true },
  { value: "difference", label: "Difference", defaultActive: true },
];

// ── 7. TOOL_CONFIG ────────────────────────────────────────────────────────────

const NUMERICAL_VAR = [{ key: "numerical", label: "Numerical method", defaultValue: false }];

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Dividing Into Ratios",
  tools: {
    sharing: {
      name: "Sharing in a Ratio",
      variables: NUMERICAL_VAR,
      dropdown: null,
      multiSelect: { key: "shareType", label: "Find", options: SHARE_OPTIONS },
      difficultySettings: { level3: { variables: [] } },
    },
    known: {
      name: "Known Amounts",
      variables: NUMERICAL_VAR,
      dropdown: null,
      multiSelect: { key: "knownType", label: "Find", options: KNOWN_OPTIONS },
      difficultySettings: { level3: { variables: [] } },
    },
    difference: {
      name: "Given Difference",
      variables: NUMERICAL_VAR,
      dropdown: null,
      multiSelect: { key: "diffType", label: "Find", options: DIFF_OPTIONS },
      difficultySettings: { level3: { variables: [] } },
    },
    mixed: {
      name: "Mixed",
      variables: NUMERICAL_VAR,
      dropdown: null,
      multiSelect: { key: "mixedPool", label: "Include", options: MIXED_OPTIONS },
      difficultySettings: { level3: { variables: [] } },
    },
  },
};

// ── 8. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Dividing Into Ratios", icon: "⚖️",
    content: [
      { label: "Overview",          detail: "Practice sharing amounts in a ratio using three different problem types, each at three difficulty levels." },
      { label: "Level 1 — Green",   detail: "Times-table-friendly ratios and totals (shares within the 12×12 table), ideal for introducing the method." },
      { label: "Level 2 — Yellow",  detail: "Randomly generated coprime ratios; all shares stay within 144 for mental arithmetic." },
      { label: "Level 3 — Red",     detail: "Larger ratios with totals up to 600. Algebraic method always used regardless of the toggle." },
    ],
  },
  {
    title: "Question Types", icon: "❓",
    content: [
      { label: "Sharing in a Ratio", detail: "Given the total and the ratio, find one or both shares. Use Question Options to choose which to ask for." },
      { label: "Known Amounts",      detail: "One person's share is given — find the total or the other person's share." },
      { label: "Given Difference",   detail: "The difference between the two shares is given — find a share or the total." },
      { label: "Mixed",              detail: "Random mix of all three types. Use Question Options to choose which types to include." },
    ],
  },
  {
    title: "Methods", icon: "📐",
    content: [
      { label: "Bar Model (default)", detail: "Proportional bar diagram shown at Level 1 & 2. Toggle 'Numerical method' in Question Options to switch to the algebraic method." },
      { label: "Numerical method",    detail: "Algebraic step-by-step solution. Always used at Level 3 regardless of the toggle." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard",     detail: "Single large question for whole-class discussion." },
      { label: "Worked Example", detail: "Step-by-step solution shown below the question." },
      { label: "Worksheet",      detail: "Grid of questions. Use Differentiated to show all three levels side by side." },
    ],
  },
];

// ── 9. Sharing generator ──────────────────────────────────────────────────────

const generateSharingQuestion = (
  level: DifficultyLevel, questionType: string, variables: Record<string, boolean>,
): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);

  for (let att = 0; att < 200; att++) {
    const names = twoNames();
    let parts: number[] = [];
    let total = 0;
    let ratioSum = 0;

    if (level === "level1") {
      parts = pick([[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,5],[3,4]]);
      ratioSum = parts[0] + parts[1];
      const mult = randInt(2, 12);
      total = ratioSum * mult;
      if (total > 84) continue;
    } else if (level === "level2") {
      const a = randInt(1, 5), b = randInt(1, 5);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b]; ratioSum = a + b;
      if (ratioSum < 4 || ratioSum > 10) continue;
      const mult = randInt(2, 12);
      total = ratioSum * mult;
      if (Math.max(a, b) * mult > 144) continue;
      if (total < 60) continue;
    } else {
      const a = randInt(3, 9), b = randInt(3, 9);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b]; ratioSum = a + b;
      if (ratioSum < 8 || ratioSum > 25) continue;
      total = ratioSum * (Math.random() < 0.7 ? randInt(10, 30) : randInt(10, 30) + 0.5);
    }

    if (parts.length < 2 || parts[0] === parts[1]) continue;
    if (!isCoprime(parts[0], parts[1])) continue;
    if (total < 10 || total > 500) continue;

    const partValue = total / ratioSum;
    const shares = parts.map(p => p * partValue);

    const qLine =
      questionType === "personA" ? `How much does ${names[0]} receive?` :
      questionType === "personB" ? `How much does ${names[1]} receive?` :
      "Find both shares.";

    const answer =
      questionType === "personA" ? `${names[0]}: ${fp(shares[0])}` :
      questionType === "personB" ? `${names[1]}: ${fp(shares[1])}` :
      `${names[0]}: ${fp(shares[0])}, ${names[1]}: ${fp(shares[1])}`;

    const working: WorkingStep[] = useBar
      ? sharingBarSteps(parts, total, ratioSum, partValue, shares, names)
      : [
          mStep("Total parts:", `${parts.join(" + ")} = ${ratioSum}`),
          mStep("1 part =", `${fc(total)} \\div ${ratioSum} = ${fc(partValue)}`),
          ...(questionType === "personA"
            ? [mStep(`${names[0]}'s share:`, `${parts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`)]
            : questionType === "personB"
            ? [mStep(`${names[1]}'s share:`, `${parts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`)]
            : [
                mStep(`${names[0]}:`, `${parts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`),
                mStep(`${names[1]}:`, `${parts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`),
              ]),
        ];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share £${fmtAmt(total)} in the ratio ${mStr(parts.join(":"))}`,
        qLine,
      ],
      answer, working,
      key: `ratio-sharing-${level}-${parts.join("_")}-${total}-${questionType}-${id}`,
      difficulty: level,
    };
  }

  const fb = twoNames();
  return {
    kind: "worded",
    lines: [`${fb[0]} and ${fb[1]} share £90 in the ratio ${mStr("1:2")}`, "Find both shares."],
    answer: `${fb[0]}: £30, ${fb[1]}: £60`,
    working: useBar
      ? sharingBarSteps([1, 2], 90, 3, 30, [30, 60], fb)
      : [
          mStep("Total parts:", "1 + 2 = 3"),
          mStep("1 part =", "\\pounds 90 \\div 3 = \\pounds 30"),
          mStep(`${fb[0]}:`, "1 \\times \\pounds 30 = \\pounds 30"),
          mStep(`${fb[1]}:`, "2 \\times \\pounds 30 = \\pounds 60"),
        ],
    key: `ratio-sharing-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 10. Known Amounts generator ───────────────────────────────────────────────

const generateKnownAmountsQuestion = (
  level: DifficultyLevel, questionType: string, variables: Record<string, boolean>,
): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);

  for (let att = 0; att < 200; att++) {
    const names = twoNames();
    let parts: number[] = [];
    let partValue = 0;
    let knownPerson = 0;

    if (level === "level1") {
      const a = randInt(1, 4), b = randInt(1, 4);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 2 || rs > 7) continue;
      partValue = randInt(1, Math.floor(49 / rs));
      if (rs * partValue < 2 || rs * partValue > 49) continue;
      knownPerson = Math.random() < 0.5 ? 0 : 1;
    } else if (level === "level2") {
      const a = randInt(1, 8), b = randInt(1, 8);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 5 || rs > 12) continue;
      const lo = Math.ceil(60 / rs), hi = Math.floor(144 / rs);
      if (lo > hi) continue;
      partValue = randInt(lo, hi);
      const t = rs * partValue;
      if (t < 60 || t > 144) continue;
      knownPerson = Math.random() < 0.5 ? 0 : 1;
    } else {
      const a = randInt(2, 12), b = randInt(2, 12);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 10 || rs > 20) continue;
      const lo = Math.ceil(40 / rs), hi = Math.floor(600 / rs);
      if (lo > hi) continue;
      partValue = randInt(lo, hi);
      const t = rs * partValue;
      if (t < 40 || t > 600) continue;
      knownPerson = Math.random() < 0.5 ? 0 : 1;
    }

    const knownAmount = parts[knownPerson] * partValue;
    const shares = parts.map(p => p * partValue);
    const total = shares[0] + shares[1];
    const other = knownPerson === 0 ? 1 : 0;

    if (knownAmount < 1 || knownAmount > 400) continue;
    if (total < 2 || total > 600) continue;

    const qLine = questionType === "total"
      ? "What is the total amount shared?"
      : `How much does ${names[other]} receive?`;

    const answer = questionType === "total"
      ? `Total: ${fp(total)}`
      : `${names[other]}: ${fp(shares[other])}`;

    const working: WorkingStep[] = useBar
      ? knownBarSteps(parts, knownAmount, knownPerson, partValue, shares, total, questionType, names)
      : [
          mStep(`${names[knownPerson]} has ${parts[knownPerson]} part${parts[knownPerson] !== 1 ? "s" : ""}:`, fc(knownAmount)),
          mStep("1 part =", `${fc(knownAmount)} \\div ${parts[knownPerson]} = ${fc(partValue)}`),
          ...(questionType === "total"
            ? [
                mStep("Total parts:", `${parts.join(" + ")} = ${parts[0] + parts[1]}`),
                mStep("Total =", `${parts[0] + parts[1]} \\times ${fc(partValue)} = ${fc(total)}`),
              ]
            : [mStep(`${names[other]}'s share:`, `${parts[other]} \\times ${fc(partValue)} = ${fc(shares[other])}`)]),
        ];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share money in the ratio ${mStr(parts.join(":"))}`,
        `${names[knownPerson]} receives £${fmtAmt(knownAmount)}`,
        qLine,
      ],
      answer, working,
      key: `ratio-known-${level}-${parts.join("_")}-${knownAmount}-${knownPerson}-${questionType}-${id}`,
      difficulty: level,
    };
  }

  const fb = twoNames();
  return {
    kind: "worded",
    lines: [
      `${fb[0]} and ${fb[1]} share money in the ratio ${mStr("2:3")}`,
      `${fb[0]} receives £40`,
      "What is the total amount shared?",
    ],
    answer: "Total: £100",
    working: useBar
      ? knownBarSteps([2, 3], 40, 0, 20, [40, 60], 100, "total", fb)
      : [
          mStep(`${fb[0]} has 2 parts:`, "\\pounds 40"),
          mStep("1 part =", "\\pounds 40 \\div 2 = \\pounds 20"),
          mStep("Total parts:", "2 + 3 = 5"),
          mStep("Total =", "5 \\times \\pounds 20 = \\pounds 100"),
        ],
    key: `ratio-known-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 11. Given Difference generator ───────────────────────────────────────────

const generateDifferenceQuestion = (
  level: DifficultyLevel, questionType: string, variables: Record<string, boolean>,
): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);

  for (let att = 0; att < 200; att++) {
    const names = twoNames();
    let parts: number[] = [];
    let partValue = 0;

    if (level === "level1") {
      const a = randInt(1, 4), b = randInt(1, 4);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 2 || rs > 7) continue;
      partValue = randInt(1, Math.floor(49 / rs));
      if (rs * partValue < 2 || rs * partValue > 49) continue;
    } else if (level === "level2") {
      const a = randInt(1, 8), b = randInt(1, 8);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 5 || rs > 12) continue;
      const lo = Math.ceil(60 / rs), hi = Math.floor(144 / rs);
      if (lo > hi) continue;
      partValue = randInt(lo, hi);
      const t = rs * partValue;
      if (t < 60 || t > 144) continue;
    } else {
      const a = randInt(2, 12), b = randInt(2, 12);
      if (!isCoprime(a, b) || a === b) continue;
      parts = [a, b];
      const rs = a + b;
      if (rs < 10 || rs > 20) continue;
      const lo = Math.ceil(40 / rs), hi = Math.floor(600 / rs);
      if (lo > hi) continue;
      partValue = randInt(lo, hi);
      const t = rs * partValue;
      if (t < 40 || t > 600) continue;
    }

    if (Math.abs(parts[0] - parts[1]) < 1) continue;

    const shares = parts.map(p => p * partValue);
    const difference = Math.abs(shares[1] - shares[0]);
    const total = shares[0] + shares[1];
    const largerPerson = shares[0] > shares[1] ? 0 : 1;
    const smallerPerson = largerPerson === 0 ? 1 : 0;
    const partDiff = Math.abs(parts[1] - parts[0]);

    if (difference < 1) continue;

    const style = randInt(1, 3);
    const compLine =
      style === 1 ? `${names[largerPerson]} receives £${fmtAmt(difference)} more than ${names[smallerPerson]}` :
      style === 2 ? `${names[smallerPerson]} receives £${fmtAmt(difference)} less than ${names[largerPerson]}` :
      `The difference in their amounts is £${fmtAmt(difference)}`;

    const qLine =
      questionType === "total"   ? "What is the total amount shared?" :
      questionType === "personA" ? `How much does ${names[0]} receive?` :
                                   `How much does ${names[1]} receive?`;

    const answer =
      questionType === "total"   ? `Total: ${fp(total)}` :
      questionType === "personA" ? `${names[0]}: ${fp(shares[0])}` :
                                   `${names[1]}: ${fp(shares[1])}`;

    const ratioSum = parts[0] + parts[1];
    const working: WorkingStep[] = useBar
      ? diffBarSteps(parts, difference, largerPerson, partValue, shares, total, questionType, names)
      : [
          mStep(`Difference = ${partDiff} part${partDiff !== 1 ? "s" : ""}:`, fc(difference)),
          mStep("1 part =", `${fc(difference)} \\div ${partDiff} = ${fc(partValue)}`),
          ...(questionType === "total"
            ? [
                mStep("Total parts:", `${parts.join(" + ")} = ${ratioSum}`),
                mStep("Total =", `${ratioSum} \\times ${fc(partValue)} = ${fc(total)}`),
              ]
            : questionType === "personA"
            ? [mStep(`${names[0]}'s share:`, `${parts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`)]
            : [mStep(`${names[1]}'s share:`, `${parts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`)]),
        ];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share money in the ratio ${mStr(parts.join(":"))}`,
        compLine,
        qLine,
      ],
      answer, working,
      key: `ratio-diff-${level}-${parts.join("_")}-${difference}-${questionType}-${id}`,
      difficulty: level,
    };
  }

  const fb = twoNames();
  return {
    kind: "worded",
    lines: [
      `${fb[0]} and ${fb[1]} share money in the ratio ${mStr("2:3")}`,
      `The difference in their amounts is £20`,
      "What is the total amount shared?",
    ],
    answer: "Total: £100",
    working: useBar
      ? diffBarSteps([2, 3], 20, 1, 20, [40, 60], 100, "total", fb)
      : [
          mStep("Difference = 1 part:", "\\pounds 20"),
          mStep("1 part =", "\\pounds 20 \\div 1 = \\pounds 20"),
          mStep("Total parts:", "2 + 3 = 5"),
          mStep("Total =", "5 \\times \\pounds 20 = \\pounds 100"),
        ],
    key: `ratio-diff-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 12. Mixed generator ───────────────────────────────────────────────────────

const generateMixedQuestion = (
  level: DifficultyLevel, variables: Record<string, boolean>, multiSelectValues: Record<string, boolean>,
): WordedQuestion => {
  const subTool = pickActive(multiSelectValues, MIXED_OPTIONS);
  if (subTool === "sharing")    return generateSharingQuestion(level, pick(["personA","personB","both"]), variables);
  if (subTool === "known")      return generateKnownAmountsQuestion(level, pick(["total","other"]), variables);
  return generateDifferenceQuestion(level, pick(["total","personA","personB"]), variables);
};

// ── 13. generateQuestion ──────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "sharing")    return generateSharingQuestion(level, pickActive(multiSelectValues, SHARE_OPTIONS), variables);
  if (t === "known")      return generateKnownAmountsQuestion(level, pickActive(multiSelectValues, KNOWN_OPTIONS), variables);
  if (t === "difference") return generateDifferenceQuestion(level, pickActive(multiSelectValues, DIFF_OPTIONS), variables);
  return generateMixedQuestion(level, variables, multiSelectValues);
};

// ── 14. generateUniqueQ ───────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do {
    q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
    attempts++;
  } while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ── 15. Bar component ─────────────────────────────────────────────────────────

const BOX_W = 52, BOX_H = 48, BOX_GAP = 3, NAME_W = 110;

const BarRow = ({ person, boxes, fillBg, borderColor, cellLabel, totalLabel }: {
  person: string; boxes: number;
  fillBg: string; borderColor: string;
  cellLabel?: string; totalLabel?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="font-bold text-base text-right flex-shrink-0" style={{ width: NAME_W, color: "#000" }}>{person}</div>
    <div className="flex flex-shrink-0" style={{ gap: BOX_GAP }}>
      {Array.from({ length: boxes }, (_, bi) => (
        <div key={bi} className="flex items-center justify-center rounded"
          style={{ width: BOX_W, height: BOX_H, border: `3px solid ${borderColor}`, backgroundColor: fillBg, flexShrink: 0 }}>
          {cellLabel && (
            <span className="font-bold text-center leading-tight" style={{ color: "#000", fontSize: "0.7rem" }}>{cellLabel}</span>
          )}
        </div>
      ))}
    </div>
    {totalLabel && <span className="text-lg font-bold ml-2" style={{ color: "#000" }}>= {totalLabel}</span>}
  </div>
);

// ── 16. ratioStepRenderer ─────────────────────────────────────────────────────

type BarEntry = { person: string; boxes: number; isKnown?: boolean; knownAmount?: number | null; value?: number; total?: number };

const ratioStepRenderer = (step: WorkingStep, cs: string): JSX.Element | null => {
  if (!step.extra) return null;
  const d = step.extra as Record<string, unknown>;
  const T = step.type;
  const bars = d.bars as BarEntry[] | undefined;

  if (T === "bar_empty" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model:</h4>
      <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
        {bars.map((bar, i) => (
          <BarRow key={i} person={bar.person} boxes={bar.boxes}
            fillBg={getBarEmptyBg(cs)} borderColor="#1e3a8a" />
        ))}
      </div>
    </div>
  );

  if (T === "bar_total") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Total parts:</h4>
      <div className="text-3xl font-medium" style={{ color: "#000" }}>{d.sum as number} parts</div>
    </div>
  );

  if (T === "bar_part") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Value of 1 part:</h4>
      <div className="text-3xl font-medium" style={{ color: "#000" }}>
        {fp(d.total as number)} ÷ {d.sum as number} = {fp(d.value as number)}
      </div>
    </div>
  );

  if (T === "bar_filled" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Calculate shares:</h4>
      <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
        {bars.map((bar, i) => (
          <BarRow key={i} person={bar.person} boxes={bar.boxes}
            fillBg={getBarEmptyBg(cs)} borderColor="#1e3a8a"
            cellLabel={bar.value !== undefined ? fp(bar.value) : undefined}
            totalLabel={bar.total !== undefined ? fp(bar.total) : undefined} />
        ))}
      </div>
    </div>
  );

  if (T === "ka_bar_known" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model — Given information:</h4>
      <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
        {bars.map((bar, i) => (
          <BarRow key={i} person={bar.person} boxes={bar.boxes}
            fillBg={bar.isKnown ? getBarKnownBg(cs) : getBarEmptyBg(cs)}
            borderColor="#1e3a8a"
            totalLabel={bar.isKnown && bar.knownAmount != null ? fp(bar.knownAmount) : undefined} />
        ))}
      </div>
    </div>
  );

  if (T === "ka_identify") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Identify the ratio part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {d.knownPerson as string} has {d.ratioPart as number} part{(d.ratioPart as number) !== 1 ? "s" : ""}
      </div>
    </div>
  );

  if (T === "ka_part_val") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Calculate value of 1 part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {fp(d.knownAmount as number)} ÷ {d.ratioPart as number} = {fp(d.partValue as number)}
      </div>
    </div>
  );

  if (T === "ka_total_bar") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Add all parts to find total:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {(d.shares as number[]).map(s => fp(s)).join(" + ")} = {fp(d.total as number)}
      </div>
    </div>
  );

  if (T === "ka_other_bar") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Read {d.otherPerson as string}'s share from bar:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>{fp(d.share as number)}</div>
    </div>
  );

  if (T === "diff_bar" && bars) {
    const smallerCount = Math.min(bars[0].boxes, bars[1].boxes);
    return (
      <div>
        <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model — showing the difference:</h4>
        <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
          {bars.map((bar, i) => {
            const isLarger = i === (d.largerPerson as number);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="font-bold text-base text-right flex-shrink-0" style={{ width: NAME_W, color: "#000" }}>{bar.person}</div>
                <div className="flex flex-shrink-0" style={{ gap: BOX_GAP }}>
                  {Array.from({ length: bar.boxes }, (_, bi) => {
                    const isDiff = isLarger && bi >= smallerCount;
                    return (
                      <div key={bi} className="rounded flex-shrink-0"
                        style={{ width: BOX_W, height: BOX_H, border: `3px solid ${isDiff ? "#a855f7" : "#1e3a8a"}`, backgroundColor: isDiff ? getBarDiffBg(cs) : getBarEmptyBg(cs) }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 mt-1" style={{ marginLeft: NAME_W + 12 }}>
            <div className="rounded" style={{ width: Math.round(BOX_W * 0.55), height: Math.round(BOX_H * 0.55), border: "3px solid #a855f7", backgroundColor: getBarDiffBg(cs), flexShrink: 0 }} />
            <span className="text-base font-bold" style={{ color: "#000" }}>= {fp(d.difference as number)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (T === "diff_identify") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>The difference represents:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {d.partDiff as number} part{(d.partDiff as number) !== 1 ? "s" : ""} = {fp(d.difference as number)}
      </div>
    </div>
  );

  if (T === "diff_part_val") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Calculate value of 1 part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {fp(d.difference as number)} ÷ {d.partDiff as number} = {fp(d.partValue as number)}
      </div>
    </div>
  );

  if (T === "diff_read") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Read {d.person as string}'s share from bar:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>{fp(d.share as number)}</div>
    </div>
  );

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      stepRenderer={ratioStepRenderer}
      defaults={{ displayFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 2 }}
    />
  );
}
