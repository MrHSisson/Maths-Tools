// Flashcards: what comes up next. A three-box Leitner scheme kept per card and direction. The student's own rating after each card sets its box directly
// Not yet puts a card back in box 1; Got it moves it up one box (a new card goes to box 2), and the box sets when it is due again. Pure functions, no storage: store.ts keeps the memory on the device.
import type { Card, Prompt, Rating } from "./types";

export const DAY = 86_400_000;
/** When a card in each box is due again, after it is rated: box 1 straight away (it stays in the pile), box 2 in two days, box 3 in a week. */
const INTERVAL = [0, 0, 2 * DAY, 7 * DAY];

interface CardState { box: 1 | 2 | 3; due: number; seen: number }
export type Memory = Record<string, CardState>;

/** The memory after the student rates a prompt at time `now`. */
export function rate(mem: Memory, key: string, rating: Rating, now: number): Memory {
  const box: 1 | 2 | 3 = rating === "again" ? 1 : (Math.min(3, (mem[key]?.box ?? 1) + 1) as 2 | 3);
  return { ...mem, [key]: { box, due: now + INTERVAL[box], seen: (mem[key]?.seen ?? 0) + 1 } };
}

/** The prompts a set offers: each card forward, and the reverse of each card that has one. */
export function promptsOf(cards: Card[], bothWays: boolean): Prompt[] {
  return cards.flatMap((card) => {
    const list: Prompt[] = [{ key: card.id, card, reversed: false }];
    if (bothWays && card.reverse) list.push({ key: `${card.id}~r`, card, reversed: true });
    return list;
  });
}

export type Standing = "new" | "learning" | "due" | "waiting";
/** Where a prompt stands: never seen, in box 1, due again, or resting until its day comes. */
export function standing(mem: Memory, key: string, now: number): Standing {
  const s = mem[key];
  if (!s) return "new";
  if (s.box === 1) return "learning";
  return s.due <= now ? "due" : "waiting";
}

/** How many prompts are in each standing. */
export function tally(keys: string[], mem: Memory, now: number): Record<Standing, number> {
  const t: Record<Standing, number> = { new: 0, learning: 0, due: 0, waiting: 0 };
  for (const k of keys) t[standing(mem, k, now)]++;
  return t;
}

/** How many prompts are in each pile: never seen, or in box 1 (learning), box 2 (getting there) or box 3 (secure). */
export function piles(keys: string[], mem: Memory): { new: number; learning: number; getting: number; secure: number } {
  const p = { new: 0, learning: 0, getting: 0, secure: 0 };
  for (const k of keys) { const b = mem[k]?.box; if (!b) p.new++; else if (b === 1) p.learning++; else if (b === 2) p.getting++; else p.secure++; }
  return p;
}

const shuffled = <T,>(xs: T[], rand: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** The keys for one session: what the student is still learning first, then what is due, then new prompts; `size` null means every prompt, shuffled. */
export function buildSession(keys: string[], mem: Memory, now: number, size: number | null, rand: () => number = Math.random): string[] {
  if (size == null) return shuffled(keys, rand);
  const group = (s: Standing) => shuffled(keys.filter((k) => standing(mem, k, now) === s), rand);
  const pool = [...group("learning"), ...group("due"), ...group("new")];
  // nothing is due and nothing is new: practise the ones resting the longest (a student who asks for a session gets one)
  const rest = pool.length ? pool : shuffled(keys, rand);
  return rest.slice(0, size);
}

/** The statements a session went worst on: how many of each statement's prompts were rated Not yet, worst first. */
export function weakestStatements(results: { statement: string; rating: Rating }[]): { statement: string; missed: number; of: number }[] {
  const by = new Map<string, { missed: number; of: number }>();
  for (const r of results) {
    const e = by.get(r.statement) ?? { missed: 0, of: 0 };
    e.of++;
    if (r.rating !== "got") e.missed++;
    by.set(r.statement, e);
  }
  return [...by.entries()].map(([statement, v]) => ({ statement, ...v })).filter((x) => x.missed > 0).sort((a, b) => b.missed / b.of - a.missed / a.of || b.missed - a.missed);
}
