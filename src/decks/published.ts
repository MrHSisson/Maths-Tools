// Published decks: a frozen copy of a deck that anyone can play and nobody can edit. The working copy (store.ts) is
// what the editor changes; publishing sends a snapshot of it to /api/decks, and the landing page lists the snapshots.
// Reading needs no password; publishing and unpublishing send the admin key like every other deck write.
import { useEffect, useState } from "react";
import { DEV_PASSWORD } from "../devAccess";
import type { DeckDef } from "./types";

const URL_ = "/api/decks";
export interface PublishedEntry { title: string; summary: string; slides: number; publishedAt: string }

/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");

/** The published decks, or null when the service is not reachable (the local dev server, no connection). */
export async function fetchPublishedIndex(): Promise<Record<string, PublishedEntry> | null> {
  try {
    const res = await fetch(`${URL_}?published`);
    if (!res.ok || !fromService(res)) return null;
    return ((await res.json()) as { decks?: Record<string, PublishedEntry> }).decks ?? {};
  } catch { return null; }
}

/** One published deck: the deck, "missing" when it is not published, null when the service is not reachable. */
export async function fetchPublishedDeck(id: string): Promise<DeckDef | "missing" | null> {
  try {
    const res = await fetch(`${URL_}?published=${encodeURIComponent(id)}`);
    if (res.status === 404 && fromService(res)) return "missing";
    return res.ok && fromService(res) ? ((await res.json()) as DeckDef) : null;
  } catch { return null; }
}

async function send(body: unknown): Promise<{ ok: true; entry?: PublishedEntry } | { ok: false; message: string }> {
  try {
    const res = await fetch(URL_, { method: "POST", headers: { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" }, body: JSON.stringify({ ...(body as object), by: "Harry" }) });
    if (!res.ok || !fromService(res)) return { ok: false, message: (fromService(res) ? ((await res.json().catch(() => ({}))) as { error?: string }).error : undefined) ?? "the sharing service isn't available here" };
    return { ok: true, entry: ((await res.json()) as { entry?: PublishedEntry }).entry };
  } catch { return { ok: false, message: "no connection" }; }
}
export const publishDeck = (deck: DeckDef) => send({ publish: deck });
export const unpublishDeck = (id: string) => send({ unpublish: id });

/** The published list for a page: undefined while loading, null when unavailable. */
export function usePublishedIndex(reload = 0): Record<string, PublishedEntry> | null | undefined {
  const [decks, setDecks] = useState<Record<string, PublishedEntry> | null | undefined>(undefined);
  useEffect(() => { let on = true; void fetchPublishedIndex().then((d) => { if (on) setDecks(d); }); return () => { on = false; }; }, [reload]);
  return decks;
}
