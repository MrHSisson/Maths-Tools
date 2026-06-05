import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WordedQuestion,
  mStep, mStr, pick, randInt, pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "sharing" | "known" | "difference" | "mixed";

// ── 2. Helpers ────────────────────────────────────────────────────────────────

const NAMES = ["Alice","Ben","Charlie","Diana","Emma","Finn","Grace","Harry","Isla","Jack","Kate","Liam","Mia","Noah","Olivia","Peter"];

const twoNames = (): string[] =>
  [...NAMES].sort(() => Math.random() - 0.5).slice(0, 2);

const fmtAmt = (n: number): string => n % 1 === 0 ? String(n) : n.toFixed(2);
const fp = (n: number): string => `£${fmtAmt(n)}`;          // plain text
const fc = (n: number): string => `\\pounds ${fmtAmt(n)}`;  // KaTeX

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const isCoprime = (a: number, b: number): boolean => gcd(a, b) === 1;

// ── 3. QO option arrays ───────────────────────────────────────────────────────

const SHARE_OPTIONS = [
  { value: "personA", label: "Person A", defaultActive: true },
  { value: "personB", label: "Person B", defaultActive: true },
  { value: "both",    label: "Both",     defaultActive: true },
];

const KNOWN_OPTIONS = [
  { value: "total", label: "Total", defaultActive: true },
  { value: "other", label: "Other", defaultActive: true },
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

// ── 4. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Dividing Into Ratios",
  tools: {
    sharing: {
      name: "Sharing in a Ratio",
      variables: [],
      dropdown: null,
      multiSelect: { key: "shareType", label: "Find", options: SHARE_OPTIONS },
      difficultySettings: null,
    },
    known: {
      name: "Known Amounts",
      variables: [],
      dropdown: null,
      multiSelect: { key: "knownType", label: "Find", options: KNOWN_OPTIONS },
      difficultySettings: null,
    },
    difference: {
      name: "Given Difference",
      variables: [],
      dropdown: null,
      multiSelect: { key: "diffType", label: "Find", options: DIFF_OPTIONS },
      difficultySettings: null,
    },
    mixed: {
      name: "Mixed",
      variables: [],
      dropdown: null,
      multiSelect: { key: "mixedPool", label: "Include", options: MIXED_OPTIONS },
      difficultySettings: null,
    },
  },
};

// ── 5. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Dividing Into Ratios", icon: "⚖️",
    content: [
      { label: "Overview",          detail: "Practice sharing amounts in a ratio using three different problem types, each at three difficulty levels." },
      { label: "Level 1 — Green",   detail: "Simple ratios from a fixed list (1:2, 2:3, etc.) with small, clean values." },
      { label: "Level 2 — Yellow",  detail: "Randomly generated coprime ratios with moderate values." },
      { label: "Level 3 — Red",     detail: "Larger ratio parts and totals, sometimes involving non-integer step values." },
    ],
  },
  {
    title: "Question Types", icon: "❓",
    content: [
      { label: "Sharing in a Ratio", detail: "Given the total and the ratio, find one or both shares. Use Question Options to choose which to ask for." },
      { label: "Known Amounts",      detail: "Given one person's share and the ratio, find the total or the other person's share." },
      { label: "Given Difference",   detail: "Given the difference between shares and the ratio, find the total or a specific share." },
      { label: "Mixed",              detail: "Random mix of all three types. Use Question Options to choose which types to include." },
    ],
  },
  {
    title: "Method", icon: "📐",
    content: [
      { label: "Sharing",    detail: "1. Add ratio parts to get total parts. 2. Divide total by total parts to get 1 part. 3. Multiply each ratio part by 1 part." },
      { label: "Known",      detail: "1. Read the known person's ratio part. 2. Divide their amount by their part to get 1 part. 3. Scale up to find total or other share." },
      { label: "Difference", detail: "1. Subtract the smaller ratio part from the larger to get the parts difference. 2. Divide the given difference by that to get 1 part. 3. Scale up to find the required amount." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard",     detail: "Single large question for whole-class discussion." },
      { label: "Worked Example", detail: "Step-by-step algebraic solution." },
      { label: "Worksheet",      detail: "Grid of questions. Use Differentiated to show all three levels side by side." },
    ],
  },
];

// ── 6. Sharing generator ──────────────────────────────────────────────────────

const generateSharingQuestion = (level: DifficultyLevel, questionType: string): WordedQuestion => {
  for (let att = 0; att < 100; att++) {
    const names = twoNames();
    let ratioParts: number[];

    if (level === "level1") {
      ratioParts = pick([[1,2],[1,3],[1,4],[2,3],[3,4]]);
    } else if (level === "level2") {
      const a = randInt(1, 6), b = randInt(1, 6);
      if (!isCoprime(a, b) || a === b) continue;
      ratioParts = [a, b];
    } else {
      const a = randInt(3, 9), b = randInt(3, 9);
      if (!isCoprime(a, b) || a === b) continue;
      ratioParts = [a, b];
    }

    const ratioSum = ratioParts[0] + ratioParts[1];
    if (level === "level2" && (ratioSum < 5 || ratioSum > 15)) continue;
    if (level === "level3" && (ratioSum < 8 || ratioSum > 25)) continue;

    const mult = level === "level3"
      ? randInt(10, 30) + (Math.random() < 0.2 ? 0.5 : 0)
      : level === "level2" ? randInt(8, 15) : randInt(10, 20);
    const total = ratioSum * mult;
    if (total < 20 || total > 500) continue;

    const partValue = total / ratioSum;
    const shares = ratioParts.map(p => p * partValue);

    const qLine =
      questionType === "personA" ? `How much does ${names[0]} receive?` :
      questionType === "personB" ? `How much does ${names[1]} receive?` :
      "Find both shares.";

    const answer =
      questionType === "personA" ? `${names[0]}: ${fp(shares[0])}` :
      questionType === "personB" ? `${names[1]}: ${fp(shares[1])}` :
      `${names[0]}: ${fp(shares[0])}, ${names[1]}: ${fp(shares[1])}`;

    const shareSteps =
      questionType === "personA" ? [mStep(`${names[0]}'s share:`, `${ratioParts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`)] :
      questionType === "personB" ? [mStep(`${names[1]}'s share:`, `${ratioParts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`)] :
      [
        mStep(`${names[0]}:`, `${ratioParts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`),
        mStep(`${names[1]}:`, `${ratioParts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`),
      ];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share £${fmtAmt(total)} in the ratio ${mStr(ratioParts.join(":"))}`,
        qLine,
      ],
      answer,
      working: [
        mStep("Total parts:", `${ratioParts.join(" + ")} = ${ratioSum}`),
        mStep("1 part =", `${fc(total)} \\div ${ratioSum} = ${fc(partValue)}`),
        ...shareSteps,
      ],
      key: `ratio-sharing-${level}-${ratioParts.join("_")}-${total}-${questionType}-${id}`,
      difficulty: level,
    };
  }
  const fb = twoNames();
  return {
    kind: "worded",
    lines: [`${fb[0]} and ${fb[1]} share £90 in the ratio ${mStr("1:2")}`, "Find both shares."],
    answer: `${fb[0]}: £30, ${fb[1]}: £60`,
    working: [
      mStep("Total parts:", "1 + 2 = 3"),
      mStep("1 part =", "\\pounds 90 \\div 3 = \\pounds 30"),
      mStep(`${fb[0]}:`, "1 \\times \\pounds 30 = \\pounds 30"),
      mStep(`${fb[1]}:`, "2 \\times \\pounds 30 = \\pounds 60"),
    ],
    key: `ratio-sharing-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 7. Known Amounts generator ────────────────────────────────────────────────

const generateKnownAmountsQuestion = (level: DifficultyLevel, questionType: string): WordedQuestion => {
  for (let att = 0; att < 100; att++) {
    const names = twoNames();
    let ratioParts: number[];
    let partValue: number, knownPerson: number;

    if (level === "level1") {
      ratioParts = pick([[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5]]);
      knownPerson = Math.random() < 0.5 ? 0 : 1;
      partValue = randInt(2, 10);
    } else if (level === "level2") {
      const a = randInt(1, 7), b = randInt(1, 7);
      if (!isCoprime(a, b) || a === b) continue;
      ratioParts = [a, b];
      knownPerson = a === 1 ? 1 : b === 1 ? 0 : Math.random() < 0.5 ? 0 : 1;
      partValue = randInt(5, 25);
    } else {
      const a = randInt(5, 15), b = randInt(5, 15);
      if (!isCoprime(a, b) || Math.abs(a - b) < 2) continue;
      ratioParts = [a, b];
      knownPerson = Math.random() < 0.5 ? 0 : 1;
      partValue = randInt(3, 20);
    }

    const otherPerson = knownPerson === 0 ? 1 : 0;
    const knownAmount = ratioParts[knownPerson] * partValue;
    const shares = ratioParts.map(p => p * partValue);
    const ratioSum = ratioParts[0] + ratioParts[1];
    const total = shares[0] + shares[1];

    if (level === "level1" && (knownAmount >= 50 || total >= 50)) continue;
    if (knownAmount < 10 || knownAmount > 400) continue;
    if (total < 20 || total > 600) continue;

    const qLine = questionType === "total"
      ? "What is the total amount shared?"
      : `How much does ${names[otherPerson]} receive?`;

    const answer = questionType === "total"
      ? `Total: ${fp(total)}`
      : `${names[otherPerson]}: ${fp(shares[otherPerson])}`;

    const findSteps = questionType === "total"
      ? [
          mStep("Total parts:", `${ratioParts.join(" + ")} = ${ratioSum}`),
          mStep("Total =", `${ratioSum} \\times ${fc(partValue)} = ${fc(total)}`),
        ]
      : [mStep(`${names[otherPerson]}'s share:`, `${ratioParts[otherPerson]} \\times ${fc(partValue)} = ${fc(shares[otherPerson])}`)];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share money in the ratio ${mStr(ratioParts.join(":"))}`,
        `${names[knownPerson]} receives £${fmtAmt(knownAmount)}`,
        qLine,
      ],
      answer,
      working: [
        mStep(`${names[knownPerson]} has ${ratioParts[knownPerson]} part${ratioParts[knownPerson] !== 1 ? "s" : ""}:`, fc(knownAmount)),
        mStep("1 part =", `${fc(knownAmount)} \\div ${ratioParts[knownPerson]} = ${fc(partValue)}`),
        ...findSteps,
      ],
      key: `ratio-known-${level}-${ratioParts.join("_")}-${knownAmount}-${knownPerson}-${questionType}-${id}`,
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
    working: [
      mStep(`${fb[0]} has 2 parts:`, "\\pounds 40"),
      mStep("1 part =", "\\pounds 40 \\div 2 = \\pounds 20"),
      mStep("Total parts:", "2 + 3 = 5"),
      mStep("Total =", `5 \\times \\pounds 20 = \\pounds 100`),
    ],
    key: `ratio-known-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 8. Given Difference generator ────────────────────────────────────────────

const generateDifferenceQuestion = (level: DifficultyLevel, questionType: string): WordedQuestion => {
  for (let att = 0; att < 100; att++) {
    const names = twoNames();
    let ratioParts: number[];
    let partValue: number;

    if (level === "level1") {
      ratioParts = pick([[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5]]);
      partValue = randInt(3, 12);
    } else if (level === "level2") {
      const a = randInt(1, 8), b = randInt(1, 8);
      if (!isCoprime(a, b) || a === b) continue;
      ratioParts = [a, b];
      partValue = randInt(5, 20);
    } else {
      const a = randInt(3, 12), b = randInt(3, 12);
      if (!isCoprime(a, b) || Math.abs(a - b) < 2) continue;
      ratioParts = [a, b];
      partValue = randInt(4, 25);
    }

    const shares = ratioParts.map(p => p * partValue);
    const difference = Math.abs(shares[1] - shares[0]);
    const total = shares[0] + shares[1];
    const largerPerson = shares[0] > shares[1] ? 0 : 1;
    const smallerPerson = largerPerson === 0 ? 1 : 0;
    const partDiff = Math.abs(ratioParts[1] - ratioParts[0]);

    if (level === "level1" && (difference >= 50 || total >= 100)) continue;
    if (difference < 5 || difference > 400) continue;
    if (total < 20 || total > 700) continue;

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

    const ratioSum = ratioParts[0] + ratioParts[1];
    const findSteps =
      questionType === "total"
        ? [
            mStep("Total parts:", `${ratioParts.join(" + ")} = ${ratioSum}`),
            mStep("Total =", `${ratioSum} \\times ${fc(partValue)} = ${fc(total)}`),
          ]
        : questionType === "personA"
          ? [mStep(`${names[0]}'s share:`, `${ratioParts[0]} \\times ${fc(partValue)} = ${fc(shares[0])}`)]
          : [mStep(`${names[1]}'s share:`, `${ratioParts[1]} \\times ${fc(partValue)} = ${fc(shares[1])}`)];

    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "worded",
      lines: [
        `${names[0]} and ${names[1]} share money in the ratio ${mStr(ratioParts.join(":"))}`,
        compLine,
        qLine,
      ],
      answer,
      working: [
        mStep(`Difference = ${partDiff} part${partDiff !== 1 ? "s" : ""}:`, fc(difference)),
        mStep("1 part =", `${fc(difference)} \\div ${partDiff} = ${fc(partValue)}`),
        ...findSteps,
      ],
      key: `ratio-diff-${level}-${ratioParts.join("_")}-${difference}-${questionType}-${id}`,
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
    working: [
      mStep("Difference = 1 part:", "\\pounds 20"),
      mStep("1 part =", "\\pounds 20 \\div 1 = \\pounds 20"),
      mStep("Total parts:", "2 + 3 = 5"),
      mStep("Total =", "5 \\times \\pounds 20 = \\pounds 100"),
    ],
    key: `ratio-diff-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  };
};

// ── 9. Mixed generator ────────────────────────────────────────────────────────

const generateMixedQuestion = (level: DifficultyLevel, multiSelectValues: Record<string, boolean>): WordedQuestion => {
  const subTool = pickActive(multiSelectValues, MIXED_OPTIONS);
  if (subTool === "sharing")    return generateSharingQuestion(level, pick(["personA","personB","both"]));
  if (subTool === "known")      return generateKnownAmountsQuestion(level, pick(["total","other"]));
  return generateDifferenceQuestion(level, pick(["total","personA","personB"]));
};

// ── 10. generateQuestion ──────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "sharing")    return generateSharingQuestion(level, pickActive(multiSelectValues, SHARE_OPTIONS));
  if (t === "known")      return generateKnownAmountsQuestion(level, pickActive(multiSelectValues, KNOWN_OPTIONS));
  if (t === "difference") return generateDifferenceQuestion(level, pickActive(multiSelectValues, DIFF_OPTIONS));
  return generateMixedQuestion(level, multiSelectValues);
};

// ── 11. generateUniqueQ ───────────────────────────────────────────────────────

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
      defaults={{ displayFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 2 }}
    />
  );
}
