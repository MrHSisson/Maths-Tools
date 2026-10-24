// Shared number helpers — one home for the small maths every generator needs.
// Import from the barrel ("../../shared"); inside src/shared use "./math".

/** Greatest common divisor — always non-negative; gcd(0, 0) is 0. */
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** Lowest common multiple — always non-negative; 0 if either input is 0. */
export const lcm = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b));

/** GCD of a whole list (0 for an empty list). */
export const gcdAll = (nums: number[]): number => nums.reduce((acc, n) => gcd(acc, n), 0);

/** A new array in uniformly random order (Fisher–Yates). Never mutates the input. */
export const shuffle = <T,>(arr: readonly T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
