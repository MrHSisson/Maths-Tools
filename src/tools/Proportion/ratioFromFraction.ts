// Ratio Manipulation: the question builders for Fraction to Ratio (Level 1) and Forming Ratios (Level 1, two parts), with their
// numbers fully chosen. The tool's generator picks the numbers at random and calls these; the lesson-deck builder calls the same
// functions with fixed numbers (src/decks/builder.ts), so a fixed question has the tool's own wording and working.

import { step, mStep, tStep, fracStr, mStr, gcd, type WordedQuestion, type WorkingStep } from "../../shared";

const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;
/** A ratio as a KaTeX string, e.g. "3 : 4". */
export const rLatex = (...parts: number[]) => parts.join(" : ");

export const simplifyRatioParts = (parts: number[]): number[] => {
  const d = parts.length === 3 ? gcd(gcd(parts[0], parts[1]), parts[2]) : gcd(parts[0], parts[1]);
  return parts.map((p) => p / d);
};

/** The working that divides a ratio down by prime factors, one line per division. */
export const getSimplificationSteps = (parts: number[]): WorkingStep[] => {
  const steps: WorkingStep[] = []; let cur = [...parts];
  for (;;) {
    const p = [2, 3, 5, 7, 11, 13].find((q) => cur.every((n) => n % q === 0));
    if (!p) break;
    const next = cur.map((n) => n / p);
    steps.push(step(`${rLatex(...cur)} \\div ${p} = ${rLatex(...next)}`));
    cur = next;
  }
  return steps;
};

interface FractionRatioContext { item: string; colors: [string, string] }

/** "In a bag of beads, 2/5 are Red and the rest are Blue. Write the ratio of Red to Blue." (the fraction is of the total) */
export function fractionOfTotalToRatio(ctx: FractionRatioContext, num: number, den: number, opts: { rev?: boolean; prose?: boolean; key?: string } = {}): WordedQuestion {
  const { rev = false, prose = true } = opts, [cA, cB] = ctx.colors, pA = num, pB = den - num;
  const [first, second] = rev ? [cB, cA] : [cA, cB];
  const line = `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. ${prose ? `Write the ratio of ${first} to ${second}.` : `Find ${first} : ${second}.`}`;
  const ans = rev ? rLatex(pB, pA) : rLatex(pA, pB);
  return {
    kind: "worded", lines: [line], answer: ans, answerLatex: ans,
    working: [
      mStep(cA + " =", frac(num, den)),
      step(`${den} - ${num} = ${pB}`, `${cB} = ${pB} (${den} parts total)`),
      mStep(cB + " =", frac(pB, den)),
      mStep("Ratio =", ans),
    ],
    key: opts.key ?? `ftr-l1-${num}-${den}-${rev}`, difficulty: "level1",
  };
}

/** "The number of red beads is 2/3 of the number of blue beads. Write the ratio of red to blue." (the fraction is of the other part) */
export function fractionOfPartToRatio(ctx: FractionRatioContext, num: number, den: number, opts: { rev?: boolean; key?: string } = {}): WordedQuestion {
  const { rev = false } = opts, [cA, cB] = ctx.colors;
  const [first, second] = rev ? [cB, cA] : [cA, cB];
  const ans = rev ? rLatex(den, num) : rLatex(num, den);
  return {
    kind: "worded",
    lines: [`The number of ${cA} ${ctx.item} is ${fracStr(num, den)} of the number of ${cB} ${ctx.item}. Write the ratio of ${first} to ${second}.`],
    answer: ans, answerLatex: ans,
    working: [
      tStep(`${cA} is ${num}/${den} of ${cB}: for every ${den} ${cB} there are ${num} ${cA}.`),
      mStep(`${cA} : ${cB} =`, rLatex(num, den)),
      ...(rev ? [mStep(`${cB} : ${cA} =`, rLatex(den, num))] : []),
    ],
    key: opts.key ?? `ftr-l1p-${num}-${den}-${rev}-${ctx.item}`, difficulty: "level1",
  };
}

interface FormingContext { items: [string, string]; container: string }

/** "A basket has 12 apples and 8 oranges. Write the ratio apples:oranges." (Forming Ratios, Level 1, two parts) */
export function formTwoPartRatio(ctx: FormingContext, a: number, b: number, opts: { rev?: boolean; simplest?: boolean; wording?: "write" | "find"; key?: string } = {}): WordedQuestion {
  const { rev = false, simplest = false, wording = "write" } = opts;
  const parts = rev ? [b, a] : [a, b];
  const label = rev ? `${ctx.items[1]}:${ctx.items[0]}` : `${ctx.items[0]}:${ctx.items[1]}`;
  const sf = simplest ? " in its simplest form" : "";
  const ans = rLatex(...(simplest ? simplifyRatioParts(parts) : parts));
  const line = wording === "write"
    ? `A ${ctx.container} has ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]}. Write the ratio ${label}${sf}.`
    : `There are ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]} in a ${ctx.container}. Find ${label}${sf}.`;
  return {
    kind: "worded", lines: [line], answer: ans, answerLatex: ans,
    working: [mStep("Ratio =", rLatex(a, b)), ...(simplest ? [mStep("Original:", rLatex(...parts)), ...getSimplificationSteps(parts)] : [])],
    key: opts.key ?? `fr-l1-2w-${a}-${b}-${rev}`, difficulty: "level1",
  };
}
