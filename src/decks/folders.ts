// The folder view's data: a tree's folders (any depth) read once, and one folder's decks (with their first slides, for the cards) read when it is opened.
// It is for signed-in use, so every read and change sends the admin key.
import { useCallback, useEffect, useState } from "react";
import type { Folder, FolderDeck, FolderOp, Tree } from "../../api/_folders";
import { DEV_PASSWORD } from "../devAccess";

export type { Folder, FolderDeck, FolderOp, Tree };
interface TreeData { folders: Folder[]; /** Decks held directly in each folder. */ counts: Record<string, number>; /** deck id → the folders it is in. */ byDeck: Record<string, string[]>; /** Every deck's id and title, for the Add a deck picker. */ decks: { id: string; title: string }[] }
const URL_ = "/api/decks";
/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");

async function read<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}?${query}`, { headers: { "x-admin-key": DEV_PASSWORD } });
    return res.ok && fromService(res) ? ((await res.json()) as T) : null;
  } catch { return null; }
}
const fetchTree = (tree: Tree) => read<TreeData>(`folders=${tree}`);
const fetchFolderDecks = async (folderId: string) => (await read<{ decks: FolderDeck[] }>(`folder=${encodeURIComponent(folderId)}`))?.decks ?? null;

/** Sets the folders a deck is in within one tree. Resolves to null when it worked, else the reason in words. */
export async function setDeckFolders(deckId: string, tree: Tree, folderIds: string[]): Promise<string | null> {
  try {
    const res = await fetch(URL_, { method: "POST", headers: { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" }, body: JSON.stringify({ folders: { deckId, tree, folderIds }, by: "Harry" }) });
    if (!fromService(res)) return "the sharing service isn't available here";
    if (!res.ok) return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "that did not work";
    return null;
  } catch { return "no connection"; }
}

/** Makes one change to the folders (add, rename, move, reorder, delete). Resolves to null when it worked, else the reason in words. */
export async function sendFolderOp(op: FolderOp): Promise<string | null> {
  try {
    const res = await fetch(URL_, { method: "POST", headers: { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" }, body: JSON.stringify({ folderOp: op, by: "Harry" }) });
    if (!fromService(res)) return "the sharing service isn't available here";
    if (!res.ok) return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "that did not work";
    return null;
  } catch { return "no connection"; }
}

/** One folder's decks for a page: undefined while loading, null when unavailable. `reload` asks again (after a change). */
export function useFolderDecks(folderId: string | null, reload: number): FolderDeck[] | null | undefined {
  const [state, setState] = useState<{ key: string; decks: FolderDeck[] | null } | undefined>(undefined);
  const key = folderId ? `${folderId}|${reload}` : "";
  useEffect(() => {
    if (!folderId) return;
    let on = true;
    void fetchFolderDecks(folderId).then((decks) => { if (on) setState({ key, decks }); });
    return () => { on = false; };
  }, [folderId, key]);
  return !folderId ? undefined : state?.key === key ? state.decks : undefined;
}

/** A tree's folders, counts and each deck's folders: undefined while loading, null when unavailable. */
export function useTree(tree: Tree, reload: number): TreeData | null | undefined {
  const [state, setState] = useState<{ key: string; data: TreeData | null } | undefined>(undefined);
  const key = `${tree}|${reload}`;
  useEffect(() => {
    let on = true;
    void fetchTree(tree).then((data) => { if (on) setState({ key, data }); });
    return () => { on = false; };
  }, [tree, key]);
  return state?.key === key ? state.data : undefined;
}

/** Keeps a reload counter and a way to bump it. */
export function useReload() { const [n, setN] = useState(0); return [n, useCallback(() => setN((x) => x + 1), [])] as const; }

/** A folder's ancestors from the top down, ending with the folder itself (empty when it is not in the list). */
export function pathTo(folders: Folder[], id: string): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const out: Folder[] = [];
  for (let f = byId.get(id); f && out.length < 20; f = f.parent ? byId.get(f.parent) : undefined) out.unshift(f);
  return out;
}
