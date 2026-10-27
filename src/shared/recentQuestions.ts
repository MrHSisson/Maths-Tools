import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// No repeats in the last few questions (Whiteboard, Worked Example, the phone single-question view, and the Decision shell).
//
// "The same question" is decided by what the student would see, never by a key somebody typed. Each question gets TWO fingerprints and
// is a repeat if EITHER matches one in the window, so the check errs towards refusing a question rather than letting a repeat through:
//   - the full fingerprint: all of its content (numbers, wording, answer, picture data) with the bookkeeping left out (`key`, `_seed`,
//     the calibration scores and the working, which follow from the content);
//   - the shown fingerprint: only the words and answer on screen. It catches a repeat that differs in an incidental field (a random
//     id, a shuffled order, a colour), at the cost of also refusing a question whose picture alone differs. Left out when the
//     question carries no wording of its own (a picture-only question).
// Kept in memory for this visit only, like the question keeper.
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

const SHOWN_FIELDS = ["kind", "display", "displayLatex", "lines", "answer", "answerLatex", "answerSuffix"];

/** The text that identifies a question by the words and answer on screen; "" when it has no wording to go by. */
export function shownFingerprint(q: object): string {
  const rec = q as Record<string, unknown>;
  const wording = [rec.display, rec.displayLatex, rec.lines].some((v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== ""));
  if (!wording) return "";
  try { return "shown:" + JSON.stringify(stable(Object.fromEntries(SHOWN_FIELDS.map((k) => [k, rec[k]])))).replace(/\s+/g, ""); }
  catch { return ""; }
}

/** Every fingerprint a question is checked by (see the header). */
export function fingerprintsOf(q: object): string[] {
  const shown = shownFingerprint(q);
  return shown ? [questionFingerprint(q), shown] : [questionFingerprint(q)];
}

/** The window of recent questions, each as its list of fingerprints. */
export type Recent = readonly (readonly string[])[];

/** True when any fingerprint of `fps` appears in the window. */
export function isRepeat(seen: Recent, fps: readonly string[]): boolean {
  return seen.some((entry) => entry.some((f) => fps.includes(f)));
}

/** `seen` with this question as the newest entry (an earlier entry that matches it is dropped), at most `max` long. */
export function remember(seen: Recent, fps: readonly string[], max = RECENT_WINDOW): Recent {
  return [...seen.filter((entry) => !entry.some((f) => fps.includes(f))), fps].slice(-max);
}

/** Generate until the result is not a repeat of anything in `seen`, up to `attempts` tries; then accept what the last try gave. */
export function pickFresh<T extends object>(gen: () => T, seen: Recent, attempts = FRESH_ATTEMPTS, fingerprints: (q: T) => string[] = fingerprintsOf): T {
  let q = gen();
  for (let i = 1; i < attempts && isRepeat(seen, fingerprints(q)); i++) q = gen();
  return q;
}

/** The shells' view of it: the question on screen (and every one it replaces) joins the window; `fresh` draws a new one that is not in it. */
export function useRecentQuestions<T extends object>(current: T, attempts = FRESH_ATTEMPTS) {
  const seen = useRef<Recent>([]);
  useEffect(() => { seen.current = remember(seen.current, fingerprintsOf(current)); }, [current]);
  return { fresh: (gen: () => T): T => pickFresh(gen, seen.current, attempts) };
}
