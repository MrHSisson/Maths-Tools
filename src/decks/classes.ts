// The class view's data: a class's decks (light, no preview) read one class at a time, and the admin's choice of classes for a deck.
// Public reads show published decks only; the admin reads (and every change) send the admin key. Nothing here loads a deck or its first slide.
import { useCallback, useEffect, useState } from "react";
import type { ClassDeck } from "../../api/_classes";
import { DEV_PASSWORD } from "../devAccess";

export type { ClassDeck };
const URL_ = "/api/decks";
/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");
const admin = { headers: { "x-admin-key": DEV_PASSWORD } };

async function read<T>(query: string, isAdmin: boolean): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}?${query}`, isAdmin ? admin : undefined);
    return res.ok && fromService(res) ? ((await res.json()) as T) : null;
  } catch { return null; }
}

/** How many published decks each class has (public), or every deck's count (admin). null when the service is not reachable. */
const fetchClassCounts = (isAdmin: boolean) => read<{ counts: Record<string, number>; byDeck?: Record<string, string[]>; decks?: { id: string; title: string }[] }>(isAdmin ? "classes=all" : "classes", isAdmin);
/** One class's decks, most recently made first. null when the service is not reachable. */
const fetchClassDecks = async (classId: string, isAdmin: boolean) => (await read<{ decks: ClassDeck[] }>(`class=${encodeURIComponent(classId)}${isAdmin ? "&all=1" : ""}`, isAdmin))?.decks ?? null;

/** Sets the classes a deck is used with. Resolves to null when it worked, else the reason in words. */
export async function setDeckClasses(deckId: string, classIds: string[]): Promise<string | null> {
  try {
    const res = await fetch(URL_, { method: "POST", headers: { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" }, body: JSON.stringify({ classes: { deckId, classIds }, by: "Harry" }) });
    if (!fromService(res)) return "the sharing service isn't available here";
    if (!res.ok) return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "that did not work";
    return null;
  } catch { return "no connection"; }
}

/** One class's decks for a page: undefined while loading, null when unavailable. `reload` asks again (after a change). */
export function useClassDecks(classId: string | null, isAdmin: boolean, reload: number): ClassDeck[] | null | undefined {
  const [state, setState] = useState<{ key: string; decks: ClassDeck[] | null } | undefined>(undefined);
  const key = classId ? `${classId}|${isAdmin}|${reload}` : "";
  useEffect(() => {
    if (!classId) return;
    let on = true;
    void fetchClassDecks(classId, isAdmin).then((decks) => { if (on) setState({ key, decks }); });
    return () => { on = false; };
  }, [classId, isAdmin, key]);
  return !classId ? undefined : state?.key === key ? state.decks : undefined;
}

/** The counts (and, for the admin, each deck's classes and the picker's titles): undefined while loading, null when unavailable. */
export function useClassCounts(isAdmin: boolean, reload: number) {
  const [state, setState] = useState<{ key: string; data: Awaited<ReturnType<typeof fetchClassCounts>> } | undefined>(undefined);
  const key = `${isAdmin}|${reload}`;
  useEffect(() => {
    let on = true;
    void fetchClassCounts(isAdmin).then((data) => { if (on) setState({ key, data }); });
    return () => { on = false; };
  }, [isAdmin, key]);
  return state?.key === key ? state.data : undefined;
}

/** Keeps a reload counter and a way to bump it. */
export function useReload() { const [n, setN] = useState(0); return [n, useCallback(() => setN((x) => x + 1), [])] as const; }
