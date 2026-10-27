// Sharing a teacher's decks between their devices: every save is kept on the device first (store.ts) and then sent
// to /api/decks in the background; opening the deck list or a deck pulls any newer copy back. If the service is not
// reachable (the local dev server, no network), everything keeps working on the device and the status says so.
import { useSyncExternalStore } from "react";
import { DEV_PASSWORD } from "../devAccess";
import type { BankQuestion, DeckDef } from "./types";

const URL_ = "/api/decks";
const headers = { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" };

type CloudState = { mode: "idle" | "shared" | "device" | "error"; message: string };
let state: CloudState = { mode: "idle", message: "" };
const listeners = new Set<() => void>();
const set = (s: CloudState) => { state = s; listeners.forEach((l) => l()); };
export const useCloudState = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => state, () => state);

/** True when the response came from the decks service (not the app's own page, which a dev server returns for any path). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");
const problem = async (res: Response) => (fromService(res) ? ((await res.json().catch(() => ({}))) as { error?: string }).error : undefined) ?? "the sharing service isn't available here";

async function post(body: unknown): Promise<boolean> {
  try {
    const res = await fetch(URL_, { method: "POST", headers, body: JSON.stringify({ ...(body as object), by: "Harry" }) });
    if (!res.ok || !fromService(res)) { set(res.status === 413 ? { mode: "error", message: await problem(res) } : { mode: "device", message: `Saved on this device only: ${await problem(res)}` }); return false; }
    set({ mode: "shared", message: "Saved for all your devices" });
    return true;
  } catch { set({ mode: "device", message: "Saved on this device only: no connection" }); return false; }
}

const timers = new Map<string, number>();
/** Sends a deck a moment after the last change (typing and dragging save many times a second). */
export function pushDeck(deck: DeckDef) {
  window.clearTimeout(timers.get(deck.id));
  timers.set(deck.id, window.setTimeout(() => { timers.delete(deck.id); void post({ deck }); }, 1500));
}
export const pushRemoveDeck = (id: string) => { window.clearTimeout(timers.get(id)); timers.delete(id); void post({ remove: id }); };
export const pushQuestion = (q: BankQuestion) => void post({ question: q });
export const pushRemoveQuestion = (id: string) => void post({ removeQuestion: id });

interface CloudSnapshot { index: Record<string, { updatedAt: string }>; questions: Record<string, BankQuestion> }
export async function fetchIndex(): Promise<CloudSnapshot | null> {
  try {
    const res = await fetch(URL_, { headers });
    if (!res.ok || !fromService(res)) { set({ mode: "device", message: `On this device only: ${await problem(res)}` }); return null; }
    const body = (await res.json()) as { index: { decks: CloudSnapshot["index"] }; questions: { questions: Record<string, BankQuestion> } };
    set({ mode: "shared", message: "Up to date with your other devices" });
    return { index: body.index.decks ?? {}, questions: body.questions.questions ?? {} };
  } catch { set({ mode: "device", message: "On this device only: no connection" }); return null; }
}
export async function fetchDeck(id: string): Promise<DeckDef | null> {
  try {
    const res = await fetch(`${URL_}?id=${encodeURIComponent(id)}`, { headers });
    return res.ok && fromService(res) ? ((await res.json()) as DeckDef) : null;
  } catch { return null; }
}
