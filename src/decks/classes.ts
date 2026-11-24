// The class view's data: a class's decks (with their first slides, for the cards) read one class at a time, when it is clicked, and the choice of
// classes for a deck. The class view is for signed-in use, so every read and change sends the admin key.
import { useCallback, useEffect, useState } from "react";
import type { ClassDeck } from "../../api/_classes";
import { DEV_PASSWORD } from "../devAccess";

export type { ClassDeck };
const URL_ = "/api/decks";
/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");

async function read<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}?${query}`, { headers: { "x-admin-key": DEV_PASSWORD } });
    return res.ok && fromService(res) ? ((await res.json()) as T) : null;
  } catch { return null; }
}

/** How many decks each class has, which classes each deck is in, and every deck's title for the picker. null when the service is not reachable. */
const fetchClassCounts = () => read<{ counts: Record<string, number>; byDeck: Record<string, string[]>; decks: { id: string; title: string }[] }>("classes=all");
/** One class's decks, most recently made first, each with its first slide. null when the service is not reachable. */
const fetchClassDecks = async (classId: string) => (await read<{ decks: ClassDeck[] }>(`class=${encodeURIComponent(classId)}`))?.decks ?? null;

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
export function useClassDecks(classId: string | null, reload: number): ClassDeck[] | null | undefined {
  const [state, setState] = useState<{ key: string; decks: ClassDeck[] | null } | undefined>(undefined);
  const key = classId ? `${classId}|${reload}` : "";
  useEffect(() => {
    if (!classId) return;
    let on = true;
    void fetchClassDecks(classId).then((decks) => { if (on) setState({ key, decks }); });
    return () => { on = false; };
  }, [classId, key]);
  return !classId ? undefined : state?.key === key ? state.decks : undefined;
}

/** The counts, each deck's classes and the picker's titles: undefined while loading, null when unavailable. */
export function useClassCounts(reload: number) {
  const [state, setState] = useState<{ key: string; data: Awaited<ReturnType<typeof fetchClassCounts>> } | undefined>(undefined);
  const key = `${reload}`;
  useEffect(() => {
    let on = true;
    void fetchClassCounts().then((data) => { if (on) setState({ key, data }); });
    return () => { on = false; };
  }, [key]);
  return state?.key === key ? state.data : undefined;
}

/** Keeps a reload counter and a way to bump it. */
export function useReload() { const [n, setN] = useState(0); return [n, useCallback(() => setN((x) => x + 1), [])] as const; }
