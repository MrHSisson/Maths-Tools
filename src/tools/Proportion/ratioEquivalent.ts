// Ratio Manipulation → Equivalent Ratios. The level sets the method: pick the equivalent ratio (A–D), scale directly by a
// whole number to find a missing value, then simplify first and scale (the ratio table carries both missing-value levels).
import {
  mStep, tStep, randInt, pickActive, gcd, rStepSolve, resolveMultiSelectValues,
  type DifficultyLevel, type WordedQuestion, type WorkingStep, type ToolMultiSelect,
} from "../../shared";

export const EQ_ASKED: ToolMultiSelect = {
  key: "askedPart", tab: "questions", label: "Ask for", balanced: true,
  options: [
    { value: "secondPart", label: "Second Part", defaultActive: true },
    { value: "firstPart", label: "First Part", defaultActive: false },
  ],
};

export const EQ_DIRECTION: ToolMultiSelect = {
  key: "direction", tab: "questions", label: "Direction", balanced: true,
  options: [
    { value: "up", label: "Scale Up", defaultActive: true },
    { value: "down", label: "Scale Down", defaultActive: false },
  ],
};

const LETTERS = ["A", "B", "C", "D"];
const PROMPT_MISSING = "Find the missing value:";
const ratio = (p: number, q: number) => `${p} : ${q}`;
const idOf = () => randInt(0, 999999);
const shuffle = <T,>(xs: T[]): T[] => [...xs].sort(() => Math.random() - 0.5);

const coprimePair = (max: number): [number, number] => {
  for (let i = 0; i < 200; i++) {
    const a = randInt(1, max), b = randInt(1, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
  return [2, 3];
};

// ── Level 1: pick the equivalent ratio ────────────────────────────────────────

interface Option { p: number; q: number; correct: boolean; explain: string }

const genPick = (): WordedQuestion => {
  for (let i = 0; i < 300; i++) {
    const [a, b] = coprimePair(9);
    const k = randInt(2, 6);
    if (k * Math.max(a, b) > 54) continue;
    const add = (k - 1) * a;
    const candidates: Option[] = [
      { p: k * a, q: b + add, correct: false, explain: `This added ${add} to both parts instead of multiplying: ${a} + ${add} = ${k * a} but ${b} + ${add} = ${b + add}. Multiply both parts by ${k}.` },
      { p: k * a, q: b, correct: false, explain: `Only the first part was multiplied by ${k}. The second part must be multiplied by ${k} too.` },
      { p: k * b, q: k * a, correct: false, explain: `The parts are in the wrong order. The first part must stay the ${a < b ? "smaller" : "larger"} one.` },
      { p: k * a, q: k * b + (Math.random() < 0.5 ? 1 : -1), correct: false, explain: `The second part is one out. ${b} × ${k} = ${k * b}.` },
    ];
    const wrong = shuffle(candidates).slice(0, 3);
    const options: Option[] = [{ p: k * a, q: k * b, correct: true, explain: `Multiply both parts by ${k}: ${a} × ${k} = ${k * a} and ${b} × ${k} = ${k * b}.` }, ...wrong];
    const keys = new Set(options.map((o) => ratio(o.p, o.q)));
    const valid = keys.size === 4 && wrong.every((o) => o.q > 0 && o.p * b !== o.q * a);
    if (!valid) continue;
    const shuffled = shuffle(options);
    const correctIdx = shuffled.findIndex((o) => o.correct);
    const working: WorkingStep[] = [tStep(`Compare the first parts: ${a} × ${k} = ${k * a}. Do the same to the second part: ${b} × ${k} = ${k * b}.`)];
    shuffled.forEach((o, n) => {
      working.push(mStep(`${LETTERS[n]}:`, ratio(o.p, o.q)));
      working.push(tStep(o.explain));
    });
    working.push(mStep("Answer:", ratio(k * a, k * b)));
    return {
      kind: "worded",
      lines: [`Which of these ratios is equivalent to $${ratio(a, b)}$?`, ...shuffled.map((o, n) => `${LETTERS[n]}) $${ratio(o.p, o.q)}$`)],
      answer: `${LETTERS[correctIdx]} (${ratio(k * a, k * b)})`,
      working,
      key: `eq-l1-${a}-${b}-${k}-${idOf()}`,
      difficulty: "level1",
    };
  }
  return {
    kind: "worded", lines: ["Which of these ratios is equivalent to $2 : 5$?", "A) $8 : 20$", "B) $8 : 11$", "C) $8 : 5$", "D) $20 : 8$"],
    answer: "A (8 : 20)", working: [mStep("Answer:", "8 : 20")], key: `eq-l1-fallback-${idOf()}`, difficulty: "level1",
  };
};

// ── Levels 2 and 3: missing value, worked on a ratio table ────────────────────

const HEADERS = ["First", "Second"];

const missing = (
  given: [number, number], target: [number, number], rows: number[][], operations: string[], askFirst: boolean, key: string, level: DifficultyLevel,
): WordedQuestion => {
  const answer = askFirst ? target[0] : target[1];
  const targetText = askFirst ? `\\,? : ${target[1]}` : `${target[0]} : \\,?`;
  return {
    kind: "worded",
    lines: [PROMPT_MISSING, `$${ratio(given[0], given[1])} = ${targetText}$`],
    answer: String(answer), answerLatex: String(answer),
    working: rStepSolve("Scale the ratio:", HEADERS, rows, operations, askFirst ? 1 : 0),
    key, difficulty: level,
  };
};

const genScale = (msv: Record<string, boolean>): WordedQuestion => {
  const values = resolveMultiSelectValues([EQ_ASKED, EQ_DIRECTION], msv);
  const askFirst = pickActive(values, EQ_ASKED.options) === "firstPart";
  const down = pickActive(values, EQ_DIRECTION.options) === "down";
  for (let i = 0; i < 300; i++) {
    const [a, b] = coprimePair(9);
    const k = randInt(2, 9);
    if (k * Math.max(a, b) > 90) continue;
    const key = `eq-l2-${down ? "down" : "up"}-${a}-${b}-${k}-${askFirst ? "first" : "second"}-${idOf()}`;
    return down
      ? missing([k * a, k * b], [a, b], [[k * a, k * b], [a, b]], [`\\div ${k}`], askFirst, key, "level2")
      : missing([a, b], [k * a, k * b], [[a, b], [k * a, k * b]], [`\\times ${k}`], askFirst, key, "level2");
  }
  return missing([2, 5], [4, 10], [[2, 5], [4, 10]], ["\\times 2"], false, `eq-l2-fallback-${idOf()}`, "level2");
};

const genSimplifyThenScale = (msv: Record<string, boolean>): WordedQuestion => {
  const values = resolveMultiSelectValues([EQ_ASKED], msv);
  const askFirst = pickActive(values, EQ_ASKED.options) === "firstPart";
  for (let i = 0; i < 400; i++) {
    const [a, b] = coprimePair(8);
    const g = randInt(2, 6), m = randInt(2, 7);
    // the factor from the given ratio to the target must not be a whole number either way
    if (g % m === 0 || m % g === 0) continue;
    if (Math.max(g, m) * Math.max(a, b) > 60) continue;
    const key = `eq-l3-${a}-${b}-${g}-${m}-${askFirst ? "first" : "second"}-${idOf()}`;
    return missing([g * a, g * b], [m * a, m * b], [[g * a, g * b], [a, b], [m * a, m * b]], [`\\div ${g}`, `\\times ${m}`], askFirst, key, "level3");
  }
  return missing([4, 10], [6, 15], [[4, 10], [2, 5], [6, 15]], ["\\div 2", "\\times 3"], false, `eq-l3-fallback-${idOf()}`, "level3");
};

export const genEquivalent = (level: DifficultyLevel, msv: Record<string, boolean>): WordedQuestion =>
  level === "level1" ? genPick() : level === "level2" ? genScale(msv) : genSimplifyThenScale(msv);
