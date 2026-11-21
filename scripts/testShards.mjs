// Splits test files over the CI runners so each takes about as long as the others: the longest files first, each to the runner with the least work so far.
// The weights are the seconds each file took on a laptop (scripts/testTimes.json, refreshed with `npm run test:times`); a file not in it counts as the median.
import { readFileSync } from "node:fs";

export const loadTimes = () => { try { return JSON.parse(readFileSync("scripts/testTimes.json", "utf8")); } catch { return {}; } };

/** `files`: paths like "src/tests/x.test.ts". `weightOf(file)` → seconds. Returns `n` arrays of files, each in a stable order. */
export function balance(files, weightOf, n) {
  const shards = Array.from({ length: n }, () => ({ load: 0, files: [] }));
  for (const f of [...files].sort((a, b) => weightOf(b) - weightOf(a) || a.localeCompare(b))) {
    const lightest = shards.reduce((m, s) => (s.load < m.load ? s : m), shards[0]);
    lightest.files.push(f); lightest.load += weightOf(f);
  }
  return shards.map((s) => ({ load: s.load, files: s.files.sort() }));
}

const START_UP = 0.6;

/** A weight function from the recorded times; `scale(file)` lets a caller count a file as lighter than recorded (e.g. a check that will run for one tool, not all). */
export function weights(times, scale = () => 1) {
  const known = Object.values(times).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 1;
  // every file also costs a fixed start-up (loading and transforming what it imports), which the recorded time leaves out: measured about 0.6 s a file
  return (file) => (times[file.split("/").pop()] ?? median) * scale(file) + START_UP;
}
