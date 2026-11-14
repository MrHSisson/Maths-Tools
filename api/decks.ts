// GET  /api/decks                         → { index, questions }: every shared deck's summary, and the shared questions
// GET  /api/decks?id=<id>                 → one deck
// POST /api/decks {deck, base?, by}       → save a deck. With `base` (the version the saver started from) the save is MERGED into the stored deck
//                                           by slide and element (api/_deckMerge.ts), so two people can edit one deck; the response then carries
//                                           `merged: true` and the merged `deck`. Without `base` the deck replaces the stored one.
// POST /api/decks {remove: <id>}          → delete a deck (its version history is kept)
// POST /api/decks {question}              → save one question; {removeQuestion: <id>} → drop one
// GET  /api/decks?history=<id>            → { entries }: the shared version history of a deck, newest first (snapshots kept automatically)
// GET  /api/decks?history=<id>&key=<key>  → one snapshot (a deck), to restore from; the client restores it as an ordinary save
// GET  /api/decks?published               → { decks }: the published decks (anyone may read this and the next; cached for a minute)
// GET  /api/decks?published=<id>          → one published deck, a frozen copy
// GET  /api/decks?categories              → { categories, filing }: the two-level category tree and which published deck is filed where (anyone may read; cached a minute)
// GET  /api/decks?categories=all          → the same with every deck's filing (admin)
// POST /api/decks {categories: <op>}      → change the tree or the filing: add / rename / move / setParent / delete a category, or file a deck (api/_categories.ts); answers with the whole tree and filing
// POST /api/decks {publish: deck}         → publish a copy of a deck; {unpublish: <id>} → take it down
// Everything except the published and categories GETs needs the header  x-admin-key: <ADMIN_KEY>  (the Developing-tools password), like /api/tool-notes.
// Storage is Neon Postgres (api/_db.ts, api/_deckStore.ts), schema `maths`. A save reads the deck with its version, merges, and writes only if the
// version has not moved (retried if another save got in first), so two devices never overwrite each other.
import { getDb, ensureSchema } from "./_db.js";
import { mergeDecks } from "./_deckMerge.js";
import { addSnapshot, getDeck, getPublished, getSnapshot, listHistory, listIndex, listPublished, listQuestions, newestSnapshotAt, putPublished, putQuestion, readDeck, removeDeck, removePublished, removeQuestion, writeDeck } from "./_deckStore.js";
import { applyOp, listCategories, parseOp, unfileDeck } from "./_categories.js";
import { MAX_SNAPSHOTS, checkDeck, checkQuestion, publishedBody, shouldSnapshot, snapshotKey, validId, validSnapshotKey, type HistoryEntry } from "./_decks.js";

const isDeckLike = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && Array.isArray((v as { slides?: unknown }).slides);
// The two published reads are public and identical for everyone, so the CDN may keep them briefly; everything else is private and never cached.
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const json = (body: unknown, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache, "x-deck-merge": "1" } });

function authorised(req: Request): Response | null {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: "ADMIN_KEY is not configured" }, 503);
  return req.headers.get("x-admin-key") === key ? null : json({ error: "Not authorised" }, 401);
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
  const cats = params.get("categories");
  if (cats === "") { const db = getDb(); await ensureSchema(db); return json(await listCategories(db, { publishedOnly: true }), 200, PUBLIC_CACHE); }   // the public read: published decks only
  const denied = authorised(req);
  if (denied) return denied;
  const db = getDb(); await ensureSchema(db);
  if (cats === "all") return json(await listCategories(db));
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
  const [index, questions] = await Promise.all([listIndex(db), listQuestions(db)]);
  return json({ index, questions });
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
    await snapshotBefore(db, id, previous, saved.deck, now);
    const entry = { title: saved.summary.title.slice(0, 200), summary: saved.summary.summary.slice(0, 500), slides: saved.summary.slides.length, updatedAt: saved.summary.updatedAt ?? now, updatedBy: by };
    return json({ saved: true, entry, merged: saved.merged, conflicts: saved.conflicts, ...(saved.merged ? { deck: saved.deck } : {}) });
  }
  if ("publish" in body) {
    const checked = checkDeck(body.publish);
    if ("error" in checked) return json({ error: checked.error }, checked.status);
    const entry = await putPublished(db, checked.deck, publishedBody(checked.body, now), now);
    return json({ published: true, entry });
  }
  if ("unpublish" in body) {
    if (!validId(body.unpublish)) return json({ error: "Bad id" }, 400);
    await removePublished(db, body.unpublish);
    return json({ unpublished: true });
  }
  if ("categories" in body) {
    const op = parseOp(body.categories);
    if (!op) return json({ error: "Not a category change" }, 400);
    const result = await applyOp(db, op);
    return result.ok ? json(result.data) : json({ error: result.error }, result.status);
  }
  if ("remove" in body) {
    if (!validId(body.remove)) return json({ error: "Bad id" }, 400);
    await removeDeck(db, body.remove);
    await unfileDeck(db, body.remove);
    return json({ removed: true });
  }
  if ("question" in body) {
    const q = checkQuestion(body.question);
    if (!q) return json({ error: "The question is invalid or exceeds the 20 KB library limit. Keep the draft in your deck or shorten it." }, 400);
    await putQuestion(db, q.id, q.q);
    return json({ saved: true });
  }
  if ("removeQuestion" in body) {
    if (!validId(body.removeQuestion)) return json({ error: "Bad id" }, 400);
    await removeQuestion(db, body.removeQuestion);
    return json({ removed: true });
  }
  return json({ error: "Nothing to do" }, 400);
}
