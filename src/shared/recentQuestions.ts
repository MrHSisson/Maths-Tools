import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// No repeats in the last few questions (Whiteboard, Worked Example, the phone single-question view, and the Decision shell).
//
// "The same question" is decided by what the student would see, never by a key somebody typed: a question's FINGERPRINT is its content
// (the numbers, the wording, the answer, the picture data) with the bookkeeping left out (`key`, `_seed`, the calibration scores and the
// working, which follow from the content). Two questions with the same fingerprint are the same question, so a repeat can only be missed
// (when an incidental field differs), never wrongly refused (a hand-made key that was too coarse). Kept in memory for this visit only,
// like the question keeper.
// ═══════════════════════════════════════════════════════════════════════════

/** How many of the most recent questions a new one must differ from. */
export const RECENT_WINDOW = 15;
/** Tries to find a question not in the window before giving up and accepting a repeat (a tiny question pool cannot always avoid one). */
const FRESH_ATTEMPTS = 30;

/** What every question carries that says nothing about what the student sees. */
const BOOKKEEPING = new Set(["key", "_seed", "_qo", "_difficultyScore", "_rawDifficulty", "_category", "working"]);

/** JSON with sorted keys, so the same content always gives the same text; copes with bigints, sets, maps, functions and cycles. */
function stable(v: unknown, path = new WeakSet<object>()): unknown {
  if (typeof v === "bigint") return `${v}n`;
  if (typeof v === "function" || typeof v === "symbol") return undefined;
  if (!v || typeof v !== "object") return v;
  if (path.has(v)) return "[circular]";
  path.add(v);
  const out = v instanceof Set || v instanceof Map ? [...v].map((x) => stable(x, path))
    : Array.isArray(v) ? v.map((x) => stable(x, path))
    : Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable((v as Record<string, unknown>)[k], path)]));
  path.delete(v);
  return out;
}

/** The text that identifies a question by its content. */
export function questionFingerprint(q: object, ignore: ReadonlySet<string> = BOOKKEEPING): string {
  try {
    return JSON.stringify(stable(Object.fromEntries(Object.entries(q).filter(([k]) => !ignore.has(k)))));
  } catch {
    return String((q as { key?: unknown }).key ?? "");     // something unserialisable: fall back to the key, never throw
  }
}

/** `seen` with `fp` as the newest entry (no repeats in the list), at most `max` long. */
export function remember(seen: string[], fp: string, max = RECENT_WINDOW): string[] {
  return [...seen.filter((x) => x !== fp), fp].slice(-max);
}

/** Generate until the result is not in `seen`, up to `attempts` tries; then accept what the last try gave. */
export function pickFresh<T extends object>(gen: () => T, seen: readonly string[], attempts = FRESH_ATTEMPTS, fingerprint: (q: T) => string = questionFingerprint): T {
  let q = gen();
  for (let i = 1; i < attempts && seen.includes(fingerprint(q)); i++) q = gen();
  return q;
}

/** The shells' view of it: the question on screen (and every one it replaces) joins the window; `fresh` draws a new one that is not in it. */
export function useRecentQuestions<T extends object>(current: T, attempts = FRESH_ATTEMPTS) {
  const seen = useRef<string[]>([]);
  useEffect(() => { seen.current = remember(seen.current, questionFingerprint(current)); }, [current]);
  return { fresh: (gen: () => T): T => pickFresh(gen, seen.current, attempts) };
}
