// Rules a build script can assert before it builds, so a deck cannot be built with a repeated example. They were written in plans and
// style notes and re-learned in deck after deck (Estimation's Depth cards, the primes example, the multiples book work, the factors questions);
// now one helper holds them. The deck check (`deckChecks.ts`) warns about the same thing for a deck that was not built with it, and
// `npm run deck -- build` turns that warning into a failure.
import type { CuratedQuestion } from "./types";

/** The numbers a question is about: the ones in its title (`Factors of $48$`, `HCF of $32$ and $48$`). */
export const headlineNumbers = (q: CuratedQuestion): number[] => (q.title.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

interface FreshNumbers {
  /** Numbers a slide works through (the worked examples and discussions): no question may be about them. */
  worked: number[];
  /** Each section's questions (listing, common factors, HCF ...): inside a section no number is asked about twice. */
  sections: Record<string, CuratedQuestion[]>;
  /** The exit ticket: it must use numbers asked about nowhere else. */
  exit?: CuratedQuestion[];
}

/** What is wrong, in plain words (empty when the rules hold). Also: no pair of numbers is asked about twice anywhere. */
export function freshNumberProblems({ worked, sections, exit = [] }: FreshNumbers): string[] {
  const problems: string[] = [];
  const asked = new Set<number>();
  const pairKeys = new Map<string, string>();
  const all: [string, CuratedQuestion[]][] = [...Object.entries(sections), ...(exit.length ? [["the exit ticket", exit] as [string, CuratedQuestion[]]] : [])];
  for (const [name, qs] of all) {
    const seen = new Map<number, string>();
    for (const q of qs) {
      const nums = headlineNumbers(q);
      for (const n of nums) {
        if (worked.includes(n)) problems.push(`${name}: ${q.id} asks about ${n}, which a worked example already uses`);
        if (seen.has(n)) problems.push(`${name}: ${n} is asked about twice (${seen.get(n)} and ${q.id})`);
        seen.set(n, q.id);
        if (name === "the exit ticket" && asked.has(n)) problems.push(`the exit ticket: ${q.id} asks about ${n}, which another question already uses`);
      }
      if (nums.length > 1) {
        const key = [...nums].sort((a, b) => a - b).join(",");
        if (pairKeys.has(key)) problems.push(`${nums.join(" and ")} is asked about twice (${pairKeys.get(key)} and ${q.id})`);
        pairKeys.set(key, q.id);
      }
    }
    if (name !== "the exit ticket") for (const n of seen.keys()) asked.add(n);
  }
  return problems;
}

/** Throws when a rule is broken: for a build script, so a repeated example stops the build. */
export function assertFreshNumbers(spec: FreshNumbers) {
  const problems = freshNumberProblems(spec);
  if (problems.length) throw new Error(`fresh-number rules broken:\n  ${problems.join("\n  ")}`);
}
