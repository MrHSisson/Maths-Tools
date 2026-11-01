// The 1 to 100 number grid: the pure logic behind the deck's Number grid slide piece and the printable 100 grid.
// Marks are hand-drawn scribbles (one colour per prime) and circles, never coloured cells. A scribble's wobble is seeded by the
// number it sits on, so it looks the same on every redraw and in print. No React in here.

export const GRID_MAX = 100;
/** The primes the sieve needs up to 100: sieving stops at 7 because 11 × 11 is already past 100. */
export const SIEVE_PRIMES: readonly number[] = [2, 3, 5, 7];
export const PRIME_COLOURS: Record<number, string> = { 2: "#2563eb", 3: "#16a34a", 5: "#ea580c", 7: "#9333ea" };
/** Primes left over once the sieve has run, circled in this colour; 1 is crossed out in grey. */
export const LEFTOVER_COLOUR = "#1e3a8a";
export const ONE_COLOUR = "#64748b";

export const isPrime = (n: number): boolean => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
export const primesUpTo = (max = GRID_MAX): number[] => Array.from({ length: max }, (_, i) => i + 1).filter(isPrime);
/** The times table of `p` on the grid: p, 2p, 3p … up to 100. */
export const multiplesOf = (p: number, max = GRID_MAX): number[] => Array.from({ length: Math.floor(max / p) }, (_, i) => (i + 1) * p);

/** One mark on one number. `colour` decides the ink; `circle` is a ring (the prime itself) and otherwise a scribble. */
export interface GridMark { colour: string; circle: boolean }
export type GridMarks = ReadonlyMap<number, GridMark>;

const mark = (prime: number, circle: boolean): GridMark => ({ colour: PRIME_COLOURS[prime] ?? LEFTOVER_COLOUR, circle });

/** Completes the times table of `p`: p is circled and every other multiple scribbled, in p's colour. Marks already on the grid
 *  are kept (a number already scribbled in another colour keeps it), so tapping first and then completing never loses a tap. */
export function fillTimesTable(marks: GridMarks, p: number): Map<number, GridMark> {
  const next = new Map(marks);
  for (const n of multiplesOf(p)) if (!next.has(n)) next.set(n, mark(p, n === p));
  return next;
}

/** The sieve as it stands after `stages` steps: step 1 crosses out 1, then each further step does one prime's times table; once
 *  every prime in `primes` has run, the numbers left are the primes and are circled. Each number is marked once, by the first prime
 *  that reaches it. */
export function sieveAt(stages: number, primes: readonly number[] = SIEVE_PRIMES): Map<number, GridMark> {
  let marks = new Map<number, GridMark>();
  if (stages >= 1) marks.set(1, { colour: ONE_COLOUR, circle: false });
  primes.slice(0, Math.max(0, stages - 1)).forEach((p) => { marks = fillTimesTable(marks, p); });
  if (stages - 1 >= primes.length) for (let n = 2; n <= GRID_MAX; n++) if (!marks.has(n)) marks.set(n, { colour: LEFTOVER_COLOUR, circle: true });
  return marks;
}
/** How many steps the whole sieve takes (the click count of a staged grid). */
export const sieveSteps = (primes: readonly number[] = SIEVE_PRIMES): number => 1 + primes.length;

/** The numbers still unmarked after the whole sieve: exactly the primes (a test checks there are 25). */
export const sieveSurvivors = (primes: readonly number[] = SIEVE_PRIMES): number[] => {
  const marks = new Map<number, GridMark>([[1, { colour: ONE_COLOUR, circle: false }]]);
  let m: Map<number, GridMark> = marks;
  for (const p of primes) m = fillTimesTable(m, p);
  // the primes themselves are circled (marked); a survivor is a number that is circled or never marked
  return Array.from({ length: GRID_MAX }, (_, i) => i + 1).filter((n) => !m.has(n) || m.get(n)!.circle);
};

// ── hand-drawn strokes, in a box of the given size ──
const rng = (seed: number) => { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const f = (x: number) => Math.round(x * 10) / 10;

/** A loose scribble-out across the middle of a w × h box (a number's cell): a few flat back-and-forth strokes, the same every time
 *  for the same number. Flat and light so the number underneath can still be read. */
export function scribblePath(n: number, w: number, h: number): string {
  const r = rng(n * 101 + 7);
  const passes = 3 + Math.floor(r() * 2);                     // 3 or 4 long strokes
  const x0 = w * (0.14 + r() * 0.05), x1 = w * (0.82 + r() * 0.05);
  let d = `M${f(x0)} ${f(h * (0.4 + r() * 0.04))}`;
  for (let i = 1; i <= passes; i++) {
    const x = i % 2 ? x1 : x0, y = h * (0.4 + (0.24 * i) / passes) + (r() - 0.5) * h * 0.05;
    d += ` L${f(x + (r() - 0.5) * w * 0.05)} ${f(y)}`;
  }
  return d;
}
/** A loose ring around a number, slightly open and wobbling, the same every time for the same number. */
export function circlePath(n: number, w: number, h: number): string {
  const r = rng(n * 53 + 3);
  const cx = w / 2 + (r() - 0.5) * w * 0.04, cy = h / 2 + (r() - 0.5) * h * 0.04, rx = w * 0.4, ry = h * 0.38, a0 = r() * Math.PI * 2;
  const pts = Array.from({ length: 25 }, (_, i) => { const a = a0 + (i / 24) * Math.PI * 2 * 1.05, k = 1 + (r() - 0.5) * 0.12; return `${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`; });
  return `M${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(" ")}`;
}
