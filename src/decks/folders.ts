// The folder view's data: a tree's folders (any depth) read once, and one folder's decks (with their first slides, for the cards) read when it is opened.
// Signed in, every read and change sends the admin key. `pub` is the read anyone may make: the topic tree's published decks only, no key.
import { useCallback, useEffect, useState } from "react";
import type { Folder, FolderDeck, FolderOp, Tree } from "../../api/_folders";
import { DEV_PASSWORD } from "../devAccess";

export type { Folder, FolderDeck, FolderOp, Tree };
interface TreeData { folders: Folder[]; /** Decks held directly in each folder. */ counts: Record<string, number>; /** deck id → the folders it is in. */ byDeck: Record<string, string[]>; /** How many decks are in no folder of this tree. */ unfiled: number; /** Every deck's id and title, for the Add a deck picker (empty on the public read). */ decks: { id: string; title: string }[] }
/** Not a real folder: the decks that are in no folder of a tree (the same id as `UNFILED` in api/_folders.ts). */
export const UNFILED = "unfiled";
const URL_ = "/api/decks";
/** True when the response came from the decks service (a dev server answers every path with the app's own page). */
const fromService = (res: Response) => (res.headers.get("content-type") ?? "").includes("json");

async function read<T>(query: string, pub: boolean): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}?${query}${pub ? "&public=1" : ""}`, pub ? undefined : { headers: { "x-admin-key": DEV_PASSWORD } });
    return res.ok && fromService(res) ? ((await res.json()) as T) : null;
  } catch { return null; }
}
const fetchTree = (tree: Tree, pub: boolean) => read<TreeData>(`folders=${tree}`, pub);
const fetchFolderDecks = async (folderId: string, tree: Tree, pub: boolean) => (await read<{ decks: FolderDeck[] }>(`folder=${encodeURIComponent(folderId)}${folderId === UNFILED ? `&of=${tree}` : ""}`, pub))?.decks ?? null;

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
export function useFolderDecks(folderId: string | null, tree: Tree, reload: number, pub = false): FolderDeck[] | null | undefined {
  const [state, setState] = useState<{ key: string; decks: FolderDeck[] | null } | undefined>(undefined);
  const key = folderId ? `${folderId}|${tree}|${reload}|${pub}` : "";
  useEffect(() => {
    if (!folderId) return;
    let on = true;
    void fetchFolderDecks(folderId, tree, pub).then((decks) => { if (on) setState({ key, decks }); });
    return () => { on = false; };
  }, [folderId, tree, pub, key]);
  return !folderId ? undefined : state?.key === key ? state.decks : undefined;
}

/** A tree's folders, counts and each deck's folders: undefined while loading, null when unavailable. */
export function useTree(tree: Tree, reload: number, pub = false): TreeData | null | undefined {
  const [state, setState] = useState<{ key: string; data: TreeData | null } | undefined>(undefined);
  const key = `${tree}|${reload}|${pub}`;
  useEffect(() => {
    let on = true;
    void fetchTree(tree, pub).then((data) => { if (on) setState({ key, data }); });
    return () => { on = false; };
  }, [tree, pub, key]);
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

/** Every folder as a flat list for a menu or a checklist: each folder after its parent, in the order set, with how deep it sits (0 for a top-level folder). */
export function flatten(folders: Folder[]): { folder: Folder; depth: number }[] {
  const out: { folder: Folder; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const f of folders.filter((x) => x.parent === parent).sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : 1))) { out.push({ folder: f, depth }); if (depth < 20) walk(f.id, depth + 1); }
  };
  walk(null, 0);
  return out;
}
