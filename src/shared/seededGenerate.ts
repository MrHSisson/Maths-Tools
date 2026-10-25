import type { AnyQuestion } from "./types";

/** A small seeded random source (mulberry32). */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run `fn` with `Math.random` replaced by a seeded source, so the same seed draws the same numbers. */
function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random;
  Math.random = seededRandom(seed);
  try { return fn(); } finally { Math.random = original; }
}

/** Generate a question and remember the seed it came from (`_seed`). Every number a generator draws goes through
 *  `Math.random`, so the question can later be regenerated with the same numbers under different display options. */
export function generateSeeded(gen: () => AnyQuestion): AnyQuestion {
  const seed = Math.floor(Math.random() * 4294967296);
  return { ...withSeed(seed, gen), _seed: seed } as unknown as AnyQuestion;
}

/** Regenerate `q` from its saved seed with the generator now reading the new options: same numbers, new display.
 *  Returns null when `q` carries no seed. */
export function replaySeeded(q: AnyQuestion, gen: () => AnyQuestion): AnyQuestion | null {
  const seed = (q as unknown as { _seed?: number })._seed;
  if (typeof seed !== "number") return null;
  return { ...withSeed(seed, gen), _seed: seed } as unknown as AnyQuestion;
}
