import { hasDevSession, matchesSecret } from "./_devSession.js";
// GET  /api/decks                         → { index }: every shared deck's summary (title, filing, tool, slides by kind, first slide)
// GET  /api/decks?id=<id>                 → one deck
// POST /api/decks {deck, base?, by}       → save a deck. With `base` (the version the saver started from) the save is MERGED into the stored deck
//                                           by slide and element (api/_deckMerge.ts), so two people can edit one deck; the response then carries
//                                           `merged: true` and the merged `deck`. Without `base` the deck replaces the stored one.
// POST /api/decks {remove: <id>}          → delete a deck (its version history is kept)
// GET  /api/decks?history=<id>            → { entries }: the shared version history of a deck, newest first (snapshots kept automatically)
// GET  /api/decks?history=<id>&key=<key>  → one snapshot (a deck), to restore from; the client restores it as an ordinary save
// GET  /api/decks?published               → { decks }: the published decks (anyone may read this and the next; cached for a minute)
// GET  /api/decks?published=<id>          → one published deck, a frozen copy
// GET  /api/decks?folders=<tree>          → { folders, counts, byDeck, unfiled }: one tree's folders (any depth), the decks in each, which folders each deck is in, and how many are in none (admin)
// GET  /api/decks?folder=<id>[&previews=0] → { decks }: the decks in one folder, most recently made first, each with its first slide for the card (admin). `folder=unfiled&of=<tree>` is the decks in no folder of that tree
// GET  /api/decks?folders=topic&public=1  → the same for everyone: published decks only, only the folders that lead to one (cached a minute). `?folder=<id>&public=1` likewise. The class tree is signed-in only
// GET  /api/decks?search=<text>           → { decks }: decks whose title or summary contains the text, across every folder, most recently made first, up to 60, each with its first slide (admin; with &public=1 anyone, published decks only)
// POST /api/decks {folders: {deckId, tree, folderIds}} → set the folders a deck is in within one tree (api/_folders.ts)
// POST /api/decks {folderOp: op}          → change the folders: add / rename / move / reorder / delete one (api/_folders.ts); answers with the whole tree
// POST /api/decks {publish: deck}         → publish a copy of a deck; {unpublish: <id>} → take it down
// Everything except the published and public folder GETs needs the header  x-admin-key: <DEVELOPING_TOOLS_API_KEY> , like /api/tool-notes.
// Storage is Neon Postgres (api/_db.ts, api/_deckStore.ts), schema `maths`. A save reads the deck with its version, merges, and writes only if the
// version has not moved (retried if another save got in first), so two devices never overwrite each other.
import { getDb, ensureSchema } from "./_db.js";
import { mergeDecks } from "./_deckMerge.js";
import { addSnapshot, getDeck, getPublished, getSnapshot, listHistory, listIndex, listPublished, newestSnapshotAt, putPublished, readDeck, removeDeck, removePublished, writeDeck } from "./_deckStore.js";
import { applyFolderOp, decksInFolder, fileNewDeckByStrand, listTree, parseFolderOp, searchDecks, setDeckFolders, unfolderDeck, validFolderId, validTree } from "./_folders.js";
import { MAX_SNAPSHOTS, checkDeck, publishedBody, shouldSnapshot, snapshotKey, validId, validSnapshotKey, type HistoryEntry } from "./_decks.js";

const isDeckLike = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && Array.isArray((v as { slides?: unknown }).slides);
// The two published reads are public and identical for everyone, so the CDN may keep them briefly; everything else is private and never cached.
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const json = (body: unknown, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache, "x-deck-merge": "1" } });

function authorised(req: Request): Response | null {
  if (hasDevSession(req)) return null;
  const key = process.env.DEVELOPING_TOOLS_API_KEY;
  if (!key && !process.env.DEVELOPING_TOOLS_PASSWORD) return json({ error: "Developing tools API access is not configured" }, 503);
  return matchesSecret(req.headers.get("x-admin-key"), key) ? null : json({ error: "Not authorised" }, 401);
}

/** JSON text with object keys in a fixed order: Postgres stores JSON with its own key order, so two equal decks must compare equal whatever order they were written in. */
const canonical = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x));

/** Keeps `previous` (the stored deck as it stood before this save) as a rollback point, if the last one is old enough. Never fails the save. */
async function snapshotBefore(db: ReturnType<typeof getDb>, id: string, previous: Record<string, unknown> | null, after: Record<string, unknown>, now: string) {
  if (!previous || canonical(previous) === canonical(after)) return;          // nothing changed: nothing to roll back to
  try {
    const newest = await newestSnapshotAt(db, id);
    const entries: HistoryEntry[] = newest ? [{ key: "", at: newest, savedAt: "", title: "", slides: 0 }] : [];
    if (!shouldSnapshot({ version: 1, entries }, Date.parse(now))) return;
    const entry: HistoryEntry = { key: snapshotKey(now), at: now, savedAt: typeof previous.updatedAt === "string" ? previous.updatedAt : now, title: typeof previous.title === "string" ? previous.title.slice(0, 200) : id, slides: Array.isArray(previous.slides) ? previous.slides.length : 0 };
    await addSnapshot(db, id, entry, previous, MAX_SNAPSHOTS);
  } catch { /* the save has happened; a missed snapshot is not worth failing it */ }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const published = params.get("published");
  if (published !== null) {                          // the one part anyone may read
    const db = getDb(); await ensureSchema(db);
    if (published === "") return json(await listPublished(db), 200, PUBLIC_CACHE);
    if (!validId(published)) return json({ error: "Bad id" }, 400);
    const value = await getPublished(db, published);
    return value ? json(value, 200, PUBLIC_CACHE) : json({ error: "Not published" }, 404);
  }
  const folder = params.get("folder"), tree = params.get("folders"), search = params.get("search");
  const previews = params.get("previews") !== "0";                          // previews=0: the list view needs no pictures
  const searchText = search === null ? null : search.replace(/\s+/g, " ").trim();
  if (search !== null && (!searchText || searchText.length > 80)) return json({ error: "Search for 1 to 80 characters" }, 400);
  if (searchText !== null && params.get("public") !== null) { const db = getDb(); await ensureSchema(db); return json({ decks: await searchDecks(db, searchText, { publicOnly: true, previews }) }, 200, PUBLIC_CACHE); }
  if (params.get("public") !== null && (folder !== null || tree !== null)) {       // the read anyone may make: published decks in the topic tree
    const db = getDb(); await ensureSchema(db);
    if (tree !== null) return tree === "topic" ? json(await listTree(db, "topic", { publicOnly: true }), 200, PUBLIC_CACHE) : json({ error: "Not available" }, 404);
    if (!validFolderId(folder)) return json({ error: "Bad folder" }, 400);
    const decks = await decksInFolder(db, folder as string, { publicOnly: true, of: "topic", previews });
    return decks ? json({ decks }, 200, PUBLIC_CACHE) : json({ error: "No such folder" }, 404);
  }
  const denied = authorised(req);
  if (denied) return denied;
  const db = getDb(); await ensureSchema(db);
  if (searchText !== null) return json({ decks: await searchDecks(db, searchText, { previews }) });
  if (folder !== null) {                              // the folder view is for signed-in use only
    if (!validFolderId(folder)) return json({ error: "Bad folder" }, 400);
    const of = params.get("of");
    const decks = await decksInFolder(db, folder, { of: validTree(of) ? of : undefined, previews });
    return decks ? json({ decks }) : json({ error: "No such folder" }, 404);
  }
  if (tree !== null) return validTree(tree) ? json(await listTree(db, tree)) : json({ error: "Bad tree" }, 400);
  const hist = params.get("history");
  if (hist !== null) {
    if (!validId(hist)) return json({ error: "Bad id" }, 400);
    const key = params.get("key");
    if (key !== null) {
      if (!validSnapshotKey(key)) return json({ error: "Bad key" }, 400);
      const value = await getSnapshot(db, hist, key);
      return value ? json(value) : json({ error: "Not found" }, 404);
    }
    return json({ entries: await listHistory(db, hist) });
  }
  const id = params.get("id");
  if (id !== null) {
    if (!validId(id)) return json({ error: "Bad id" }, 400);
    const value = await getDeck(db, id);
    return value ? json(value) : json({ error: "Not found" }, 404);
  }
  return json({ index: await listIndex(db) });
}

export async function POST(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON (or the deck is too large to share)" }, 400); }
  const by = typeof body.by === "string" ? body.by : "unknown";
  const now = new Date().toISOString();
  const db = getDb(); await ensureSchema(db);

  if ("deck" in body) {
    const checked = checkDeck(body.deck);
    if ("error" in checked) return json({ error: checked.error }, checked.status);
    const id = checked.deck.id;
    const incoming = JSON.parse(checked.body) as Record<string, unknown>;
    const base = isDeckLike(body.base) ? body.base : null;
    const winner = by === "Claude" ? "current" : "incoming";          // Harry's version wins when both changed the very same thing
    let previous: Record<string, unknown> | null = null;
    let saved: { deck: Record<string, unknown>; summary: { title: string; summary: string; slides: unknown[]; updatedAt?: string }; merged: boolean; conflicts: string[] } | null = null;
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      const current = await readDeck(db, id);
      previous = current?.data ?? null;
      const result = current ? mergeDecks(base, incoming, current.data, winner) : { deck: incoming, conflicts: [] as string[], merged: false };
      const next = result.merged ? { ...result.deck, updatedAt: now } : result.deck;     // a merged deck is newer than both inputs, so every device picks it up
      const rechecked = checkDeck(next);
      if ("error" in rechecked) return json({ error: rechecked.error }, rechecked.status);
      const ok = await writeDeck(db, { id, title: rechecked.deck.title, summary: rechecked.deck.summary, slides: rechecked.deck.slides.length, updatedAt: rechecked.deck.updatedAt ?? now, updatedBy: by, body: rechecked.body }, current ? current.version : null);
      if (ok) saved = { deck: JSON.parse(rechecked.body), summary: rechecked.deck, merged: result.merged, conflicts: result.conflicts };
      else await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
    if (!saved) return json({ error: "Could not save — please try again" }, 409);
    if (previous === null) { try { await fileNewDeckByStrand(db, id, saved.deck.strand); } catch { /* the save has happened; filing can be done by hand */ } }
    await snapshotBefore(db, id, previous, saved.deck, now);
    const entry = { title: saved.summary.title.slice(0, 200), summary: saved.summary.summary.slice(0, 500), slides: saved.summary.slides.length, updatedAt: saved.summary.updatedAt ?? now, updatedBy: by };
    const unchecked = (() => { const c = checkDeck(saved.deck); return "unchecked" in c ? c.unchecked : []; })();
    return json({ saved: true, entry, merged: saved.merged, conflicts: saved.conflicts, unchecked, ...(saved.merged ? { deck: saved.deck } : {}) });
  }
  if ("publish" in body) {
    const checked = checkDeck(body.publish);
    if ("error" in checked) return json({ error: checked.error }, checked.status);
    if (checked.unchecked.length) return json({ error: `This deck uses things this version of the site cannot draw yet (${checked.unchecked.join("; ")}). Merge the code for them, then publish.` }, 409);
    const entry = await putPublished(db, checked.deck, publishedBody(checked.body, now), now);
    return json({ published: true, entry });
  }
  if ("unpublish" in body) {
    if (!validId(body.unpublish)) return json({ error: "Bad id" }, 400);
    await removePublished(db, body.unpublish);
    return json({ unpublished: true });
  }
  if ("folderOp" in body) {
    const op = parseFolderOp(body.folderOp);
    if (!op) return json({ error: "Not a folder change" }, 400);
    const result = await applyFolderOp(db, op);
    return result.ok ? json(result.data) : json({ error: result.error }, result.status);
  }
  if ("folders" in body) {
    const c = body.folders as { deckId?: unknown; tree?: unknown; folderIds?: unknown } | null;
    if (!c || !validId(c.deckId) || !validTree(c.tree) || !Array.isArray(c.folderIds) || !c.folderIds.every(validFolderId)) return json({ error: "Not a folder change" }, 400);
    const folderIds = await setDeckFolders(db, c.deckId, c.tree, c.folderIds as string[]);
    return json({ deckId: c.deckId, tree: c.tree, folderIds });
  }
  if ("remove" in body) {
    if (!validId(body.remove)) return json({ error: "Bad id" }, 400);
    await removeDeck(db, body.remove);
    await unfolderDeck(db, body.remove);
    return json({ removed: true });
  }
  return json({ error: "Nothing to do" }, 400);
}
