// A fixed random stream for tests that assert a statistic over random draws ("at most 3% bad", "spread over the bands"). With the real
// Math.random those fail now and then by chance (two bad draws in forty), which turns CI red for no reason. Seeded, the same draws are
// made every run, so the test is a fixed regression sample: it fails only when the generator really changed.

/** mulberry32: a small, fast, well-spread seeded generator returning numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs `fn` with `Math.random` replaced by a seeded stream, and puts the real one back afterwards (even if `fn` throws). */
export function withSeededRandom<T>(seed: number, fn: () => T): T {
  const real = Math.random;
  Math.random = seededRandom(seed);
  try { return fn(); } finally { Math.random = real; }
}
