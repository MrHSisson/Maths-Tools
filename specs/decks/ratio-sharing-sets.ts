// The authored questions for the Sharing in a ratio deck (plan: specs/decks/ratio-sharing.md; the table Harry reads:
// specs/decks/ratio-sharing-questions.md, written by src/tests/ratioSharingSets.test.ts with WRITE_TABLE=1).
// Each question is the numbers a pupil sees, plus the answer typed by hand. The test recomputes every answer from the given
// numbers by a separate route, compares it with the tool's own builder, and runs the named wrong method to see that it gives a
// different answer. No deck build script needs to copy a number: it reads this file.

import type { ContextId } from "../../src/tools/Proportion/ratioSharing";

export type Wrong = "onePart" | "divPeople" | "knownAsPart" | "knownAsTotal" | "diffAsTotal" | "diffOverSum" | "dropPart" | "unsimplified" | "swap" | "wrongPair" | "none";

export interface SetQuestion {
  id: string;
  /** the ladder rung in plain words */
  rung: string;
  /** the ratio exactly as shown (not necessarily in simplest form) */
  ratio: number[];
  names?: string[];
  ctx?: ContextId;
  /** sharing a total */
  total?: number;
  /** a known share: whose (index) and how much */
  known?: { who: number; amount: number };
  /** a difference between two people's shares; `style` is the sentence */
  diff?: { a: number; b: number; amount: number; style: 1 | 2 | 3 };
  /** "both" (every share), "total", or the index of the person asked */
  ask: "both" | "total" | number;
  /** the answer, typed by hand, in the tool's own words ("Jack: £60", "Total: £40") */
  answer: string;
  /** the trap it is built for (T1 to T11 in the plan) and the wrong method to run on it */
  trap: string;
  wrong: Wrong;
}

/** Set A: the 3 × 3 grid, sharing from a total. A cell is the amount and the ratio; every cell asks for every share. */
export const SET_A: SetQuestion[] = [
  { id: "A1", rung: "a : b, two different parts", ratio: [2, 3], total: 65, ask: "both", answer: "£26 and £39", trap: "T1 divides by 2", wrong: "divPeople" },
  { id: "A2", rung: "a : b, bigger parts", ratio: [3, 4], total: 98, ask: "both", answer: "£42 and £56", trap: "T1 divides by 2", wrong: "divPeople" },
  { id: "A3", rung: "the larger number comes first", ratio: [5, 2], total: 42, ask: "both", answer: "£30 and £12", trap: "T2 stops at one part", wrong: "onePart" },
  { id: "A4", rung: "not money", ratio: [3, 5], total: 64, ctx: "flour", ask: "both", answer: "24 kg and 40 kg", trap: "T1 divides by 2", wrong: "divPeople" },
  { id: "A5", rung: "larger total and parts", ratio: [5, 7], total: 132, ask: "both", answer: "£55 and £77", trap: "T1 divides by 2", wrong: "divPeople" },
  { id: "A6", rung: "ratio not in simplest form", ratio: [6, 8], total: 112, ask: "both", answer: "£48 and £64", trap: "T11 mixes the forms", wrong: "unsimplified" },
  { id: "A7", rung: "parts that add to 13", ratio: [4, 9], total: 156, ask: "both", answer: "£48 and £108", trap: "T1 divides by 2", wrong: "divPeople" },
  { id: "A8", rung: "three parts", ratio: [1, 3, 4], total: 72, ask: "both", answer: "£9, £27 and £36", trap: "T10 misses a part", wrong: "dropPart" },
  { id: "A9", rung: "three parts, pounds and pence", ratio: [2, 3, 4], total: 22.5, ask: "both", answer: "£5, £7.50 and £10", trap: "T10 misses a part", wrong: "dropPart" },
];

/** Set B: a known share. A printed sheet of nine, full wording. */
export const SET_B: SetQuestion[] = [
  { id: "B1", rung: "a : b, find the total", ratio: [2, 3], names: ["Zane", "Isla"], known: { who: 0, amount: 16 }, ask: "total", answer: "Total: £40", trap: "T5 treats the known share as the total", wrong: "knownAsTotal" },
  { id: "B2", rung: "the known share is the second person's", ratio: [3, 4], names: ["Noah", "Grace"], known: { who: 1, amount: 32 }, ask: 0, answer: "Noah: £24", trap: "T3 gives the shares to the wrong people", wrong: "swap" },
  { id: "B3", rung: "a : b, find the other share", ratio: [3, 5], names: ["Lena", "Omar"], known: { who: 0, amount: 66 }, ask: 1, answer: "Omar: £110", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
  { id: "B4", rung: "not money, find the total", ratio: [4, 3], names: ["Ruth", "Sam"], ctx: "marbles", known: { who: 0, amount: 36 }, ask: "total", answer: "Total: 63 marbles", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
  { id: "B5", rung: "larger numbers, find the other", ratio: [5, 8], names: ["Finn", "Olivia"], known: { who: 0, amount: 70 }, ask: 1, answer: "Olivia: £112", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
  { id: "B6", rung: "ratio not in simplest form, find the other", ratio: [6, 9], names: ["Hugo", "Ella"], known: { who: 0, amount: 54 }, ask: 1, answer: "Ella: £81", trap: "T11 mixes the forms", wrong: "unsimplified" },
  { id: "B7", rung: "three parts, find the total", ratio: [3, 4, 5], names: ["Dev", "Maya", "Tom"], known: { who: 1, amount: 68 }, ask: "total", answer: "Total: £204", trap: "T10 misses a part", wrong: "dropPart" },
  { id: "B8", rung: "three parts, find a different share", ratio: [2, 5, 6], names: ["Eli", "Zoe", "Max"], known: { who: 0, amount: 14 }, ask: 2, answer: "Max: £42", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
  { id: "B9", rung: "three parts, not money, find the total", ratio: [2, 3, 5], names: ["Tess", "Uri", "Wen"], ctx: "stickers", known: { who: 2, amount: 55 }, ask: "total", answer: "Total: 110 stickers", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
];

/** Set C: a difference. A printed sheet of nine, full wording. */
export const SET_C: SetQuestion[] = [
  { id: "C1", rung: "2 : 5, three parts apart, find the smaller share", ratio: [2, 5], names: ["Nia", "Pete"], diff: { a: 0, b: 1, amount: 45, style: 1 }, ask: 0, answer: "Nia: £30", trap: "T7 divides by all the parts", wrong: "diffOverSum" },
  { id: "C2", rung: "\"the difference between their shares\", find the total", ratio: [4, 7], names: ["Joy", "Alan"], diff: { a: 0, b: 1, amount: 33, style: 3 }, ask: "total", answer: "Total: £121", trap: "T6/T7 the difference comes out as the total", wrong: "diffAsTotal" },
  { id: "C3", rung: "\"less than\", find the larger share", ratio: [3, 5], names: ["Ivy", "Sid"], diff: { a: 0, b: 1, amount: 26, style: 2 }, ask: 1, answer: "Sid: £65", trap: "T6 treats the difference as a share", wrong: "diffAsTotal" },
  { id: "C4", rung: "the first named has less; find the first's share", ratio: [2, 7], names: ["Lena", "Omar"], diff: { a: 0, b: 1, amount: 30, style: 1 }, ask: 0, answer: "Lena: £12", trap: "T3 gives the shares to the wrong people", wrong: "swap" },
  { id: "C5", rung: "not money, the first has more; find the total", ratio: [5, 3], names: ["Tara", "Will"], ctx: "sweets", diff: { a: 0, b: 1, amount: 34, style: 1 }, ask: "total", answer: "Total: 136 sweets", trap: "T6/T7 the difference comes out as the total", wrong: "diffAsTotal" },
  { id: "C6", rung: "larger numbers, find the total", ratio: [7, 4], names: ["Rhys", "Cleo"], diff: { a: 0, b: 1, amount: 96, style: 3 }, ask: "total", answer: "Total: £352", trap: "T6 treats the difference as the total", wrong: "diffAsTotal" },
  { id: "C7", rung: "three parts, the difference between two people, find the third", ratio: [3, 4, 8], names: ["Abe", "Beth", "Cole"], diff: { a: 0, b: 2, amount: 25, style: 3 }, ask: 1, answer: "Beth: £20", trap: "T10 compares the wrong parts", wrong: "wrongPair" },
  { id: "C8", rung: "three parts, the difference, find the total", ratio: [3, 5, 7], names: ["Dana", "Eric", "Fay"], diff: { a: 0, b: 2, amount: 52, style: 1 }, ask: "total", answer: "Total: £195", trap: "T10 compares the wrong parts", wrong: "wrongPair" },
  { id: "C9", rung: "three parts, not money, find the total (the stretch)", ratio: [3, 4, 6], names: ["Xia", "Yan", "Zed"], ctx: "marbles", diff: { a: 1, b: 2, amount: 28, style: 3 }, ask: "total", answer: "Total: 182 marbles", trap: "T10 compares the wrong parts", wrong: "wrongPair" },
];

/** Worksheet D: mixed, fifteen, textbook layout. The kinds are never labelled; five of each, interleaved, climbing. */
export const SET_D: SetQuestion[] = [
  { id: "D1", rung: "sharing, two parts, one share asked", ratio: [2, 3], names: ["Kim", "Raj"], total: 85, ask: 1, answer: "Raj: £51", trap: "T8 answers a different question", wrong: "onePart" },
  { id: "D2", rung: "known share, find the total", ratio: [3, 4], names: ["Ola", "Pat"], known: { who: 0, amount: 39 }, ask: "total", answer: "Total: £91", trap: "T5 treats the known share as the total", wrong: "knownAsTotal" },
  { id: "D3", rung: "difference, \"less than\", find the total", ratio: [2, 5], names: ["Quin", "Rae"], diff: { a: 0, b: 1, amount: 57, style: 2 }, ask: "total", answer: "Total: £133", trap: "T6 treats the difference as the total", wrong: "diffAsTotal" },
  { id: "D4", rung: "sharing, the larger number first", ratio: [5, 3], names: ["Sia", "Tim"], total: 104, ask: 0, answer: "Sia: £65", trap: "T3 gives the shares to the wrong people", wrong: "swap" },
  { id: "D5", rung: "known share, the larger part is known", ratio: [2, 7], names: ["Uma", "Vik"], known: { who: 1, amount: 49 }, ask: 0, answer: "Uma: £14", trap: "T4 treats the known share as one part", wrong: "knownAsPart" },
  { id: "D6", rung: "sharing, ratio not in simplest form", ratio: [8, 12], names: ["Walt", "Xena"], total: 130, ask: 0, answer: "Walt: £52", trap: "T11 mixes the forms", wrong: "unsimplified" },
  { id: "D7", rung: "known share, not money", ratio: [3, 5], names: ["Yara", "Zack"], ctx: "paint", known: { who: 1, amount: 20 }, ask: "total", answer: "Total: 32 litres", trap: "T5 treats the known share as the total", wrong: "knownAsTotal" },
  { id: "D8", rung: "difference, not money", ratio: [4, 9], names: ["Abel", "Bea"], ctx: "flour", diff: { a: 0, b: 1, amount: 10, style: 1 }, ask: "total", answer: "Total: 26 kg", trap: "T6/T7 the difference comes out as the total", wrong: "diffAsTotal" },
  { id: "D9", rung: "sharing, larger numbers, the second share asked", ratio: [7, 5], names: ["Cy", "Di"], total: 228, ask: 1, answer: "Di: £95", trap: "T3 gives the shares to the wrong people", wrong: "swap" },
  { id: "D10", rung: "known share, unsimplified, the second is known", ratio: [10, 4], names: ["Eve", "Fox"], known: { who: 1, amount: 12 }, ask: 0, answer: "Eve: £30", trap: "T11 mixes the forms", wrong: "unsimplified" },
  { id: "D11", rung: "sharing, three parts", ratio: [1, 2, 3], names: ["Gus", "Hana", "Ian"], total: 144, ask: 1, answer: "Hana: £48", trap: "T10 misses a part", wrong: "dropPart" },
  { id: "D12", rung: "known share, three parts, find the total", ratio: [2, 3, 4], names: ["Jo", "Kai", "Liv"], known: { who: 1, amount: 51 }, ask: "total", answer: "Total: £153", trap: "T5 treats the known share as the total", wrong: "knownAsTotal" },
  { id: "D13", rung: "difference, three parts, a middle share", ratio: [3, 5, 7], names: ["Mo", "Ned", "Pia"], diff: { a: 0, b: 2, amount: 8, style: 3 }, ask: 1, answer: "Ned: £10", trap: "T7 divides by all the parts", wrong: "diffOverSum" },
  { id: "D14", rung: "difference, three parts, unsimplified, find the total", ratio: [4, 6, 10], names: ["Ron", "Sue", "Ted"], diff: { a: 1, b: 2, amount: 44, style: 1 }, ask: "total", answer: "Total: £220", trap: "T11 mixes the forms", wrong: "unsimplified" },
  { id: "D15", rung: "difference, three parts, not money (the stretch)", ratio: [2, 3, 6], names: ["Una", "Vic", "Wes"], ctx: "flour", diff: { a: 1, b: 2, amount: 27, style: 3 }, ask: "total", answer: "Total: 99 kg", trap: "T10 compares the wrong parts", wrong: "wrongPair" },
];

export const ALL_SETS = { A: SET_A, B: SET_B, C: SET_C, D: SET_D };
