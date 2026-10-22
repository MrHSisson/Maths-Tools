// Maths Words Bingo — board building and win checking (the word bank is in src/shared/mathsWords).
import {
  eligibleWords, groupMates, pickWords, maxDistinct, shuffle,
  type MathsWord, type Rng, type WordFilter,
} from "../../shared/mathsWords/words";

export const BOARD_SIZE = 25;

export const maxBoardSize = (f: WordFilter): number => maxDistinct(f);

export const buildBoard = (f: WordFilter, rng: Rng, size = BOARD_SIZE): MathsWord[] | null => pickWords(f, rng, size);

/** A fresh word to replace one the class doesn't know yet: same pack where possible, never conflicting, never one already cycled out. */
export function swapWord(board: MathsWord[], outId: string, f: WordFilter, exclude: Set<string>, rng: Rng): MathsWord | null {
  const out = board.find(w => w.id === outId);
  if (!out) return null;
  const rest = board.filter(w => w.id !== outId);
  const blocked = new Set<string>([...exclude, outId, ...rest.map(w => w.id), ...rest.flatMap(w => groupMates(w.id))]);
  const cands = shuffle(eligibleWords(f).filter(w => !blocked.has(w.id)), rng);
  return cands.find(w => w.pack === out.pack) ?? cands[0] ?? null;
}

export const newRoundOrder = (board: MathsWord[], rng: Rng): string[] => shuffle(board.map(w => w.id), rng);

// ── Winning ──────────────────────────────────────────────────────────────────

export type WinMode = "line" | "corners" | "house";

export const WIN_MODES: { id: WinMode; name: string; count: number; blurb: string }[] = [
  { id: "line", name: "A line", count: 3, blurb: "3 in a row on the 3×3 grid" },
  { id: "corners", name: "Four corners", count: 4, blurb: "All 4 corners of the grid" },
  { id: "house", name: "Full house", count: 9, blurb: "All 9 words" },
];

/** A claim is valid when every claimed word has been called. */
export function checkClaim(claimed: string[], called: Set<string>): { ok: boolean; missing: string[] } {
  const missing = claimed.filter(id => !called.has(id));
  return { ok: claimed.length > 0 && missing.length === 0, missing };
}
