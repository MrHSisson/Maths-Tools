// The deck categories as the pages use them: read from /api/decks (the public view, or the full one with the admin key) and changed through
// the admin key. One shared copy, so the Decks page, the deck editor's list, the About-the-deck menu and the dashboard always agree.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { CategoryOp } from "../../api/_categories";
import { DEV_PASSWORD } from "../devAccess";
import type { CategoryData } from "./categoryTree";

const URL_ = "/api/decks";
/** undefined: not asked yet. null: the service is not reachable (a local dev server, no connection). */
type Slot = CategoryData | null | undefined;
const slots: { admin: Slot; open: Slot } = { admin: undefined, open: undefined };
const asking = { admin: false, open: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");

async function load(admin: boolean) {
  const key = admin ? "admin" : "open";
  if (asking[key]) return;
  asking[key] = true;
  try {
    const res = await fetch(`${URL_}?categories${admin ? "=all" : ""}`, admin ? { headers: { "x-admin-key": DEV_PASSWORD } } : undefined);
    slots[key] = res.ok && fromService(res) ? ((await res.json()) as CategoryData) : null;
  } catch { slots[key] = null; }
  asking[key] = false;
  emit();
}

/** Sends one change; resolves to null when it worked, else the reason in words. */
async function send(op: CategoryOp): Promise<string | null> {
  try {
    const res = await fetch(URL_, { method: "POST", headers: { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" }, body: JSON.stringify({ categories: op, by: "Harry" }) });
    if (!fromService(res)) return "the sharing service isn't available here";
    const body = (await res.json().catch(() => ({}))) as CategoryData & { error?: string };
    if (!res.ok) return body.error ?? "that did not work";
    slots.admin = { categories: body.categories, filing: body.filing };
    slots.open = undefined;                       // the public view is asked again the next time a page wants it
    emit();
    return null;
  } catch { return "no connection"; }
}

/** The tree and the filing: undefined while loading, null when the service is not reachable. `act` makes a change (null back when it worked, else why not). */
export function useCategories(admin: boolean) {
  const data = useSyncExternalStore(subscribe, () => slots[admin ? "admin" : "open"], () => undefined);
  useEffect(() => { if (data === undefined) void load(admin); }, [admin, data]);
  const act = useCallback((op: CategoryOp) => send(op), []);
  const reload = useCallback(() => load(admin), [admin]);
  return { data, act, reload };
}
