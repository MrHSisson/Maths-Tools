// Flashcards: memory and settings kept on the student's device (localStorage), one record per card set. Every read and write is guarded: a private window, blocked
// site data or a full quota must never stop the cards working, they just forget. Nothing leaves the device.
import type { Memory } from "./schedule";

export interface Prefs {
  /** The statements chosen (empty means all of them). */
  statements: string[];
  course: "AS" | "all";
  kinds: string[];
  bothWays: boolean;
  /** How many prompts in a session; null is every one. */
  size: number | null;
}

export const DEFAULT_PREFS: Prefs = { statements: [], course: "all", kinds: [], bothWays: true, size: 10 };

const key = (setId: string, part: "memory" | "prefs") => `fm-flashcards:v1:${setId}:${part}`;

function read<T>(k: string): T | null {
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function write(k: string, v: unknown): void {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* the cards still work without a memory */ }
}

const isMemory = (v: unknown): v is Memory =>
  !!v && typeof v === "object" && Object.values(v as Record<string, unknown>).every((s) => {
    const x = s as { box?: unknown; due?: unknown; seen?: unknown };
    return !!x && (x.box === 1 || x.box === 2 || x.box === 3) && typeof x.due === "number" && typeof x.seen === "number";
  });

export const loadMemory = (setId: string): Memory => { const m = read<unknown>(key(setId, "memory")); return isMemory(m) ? m : {}; };
export const saveMemory = (setId: string, mem: Memory): void => write(key(setId, "memory"), mem);
export const clearMemory = (setId: string): void => { try { localStorage.removeItem(key(setId, "memory")); } catch { /* nothing to clear */ } };

/** Stored settings, with anything stale or malformed falling back to the default (an old record must never break the page). */
export function loadPrefs(setId: string): Prefs {
  const p = read<Partial<Prefs>>(key(setId, "prefs"));
  if (!p || typeof p !== "object") return DEFAULT_PREFS;
  return {
    statements: Array.isArray(p.statements) ? p.statements.filter((s): s is string => typeof s === "string") : [],
    course: p.course === "AS" ? "AS" : "all",
    kinds: Array.isArray(p.kinds) ? p.kinds.filter((s): s is string => typeof s === "string") : [],
    bothWays: p.bothWays !== false,
    size: p.size === null ? null : typeof p.size === "number" && p.size > 0 ? p.size : 10,
  };
}
export const savePrefs = (setId: string, p: Prefs): void => write(key(setId, "prefs"), p);
