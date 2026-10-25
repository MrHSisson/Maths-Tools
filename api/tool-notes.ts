// GET  /api/tool-notes                      → every tool's notes
// POST /api/tool-notes {tool, fields, by}   → merge fields into one tool's note
// Both need the header  x-admin-key: <ADMIN_KEY>  (the Developing-tools password).
// Notes live in one private Vercel Blob (tool-notes.json); writes use the blob's ETag so two
// writers (the dashboard and a Claude session) can never overwrite each other's change.
import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import { applyNoteUpdate, emptyStore, sanitiseFields, type NoteStore } from "./_notes.js";

const PATH = "tool-notes.json";
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

function authorised(req: Request): Response | null {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: "ADMIN_KEY is not configured" }, 503);
  return req.headers.get("x-admin-key") === key ? null : json({ error: "Not authorised" }, 401);
}

// The ETag must be the blob's strong one from its metadata (head): the ETag on a download response
// turns weak (W/"…") once the file is compressed, and a conditional write rejects a weak tag.
async function read(): Promise<{ store: NoteStore; etag: string | null }> {
  let etag: string;
  try { etag = (await head(PATH)).etag; } catch (e) {
    if (e instanceof BlobNotFoundError) return { store: emptyStore(), etag: null };
    throw e;
  }
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return { store: emptyStore(), etag: null };
  const store = JSON.parse(await new Response(res.stream).text()) as NoteStore;
  return { store: store && store.tools ? store : emptyStore(), etag };
}

const write = (store: NoteStore, etag: string | null) =>
  put(PATH, JSON.stringify(store), {
    access: "private", contentType: "application/json", addRandomSuffix: false,
    allowOverwrite: etag !== null, ...(etag ? { ifMatch: etag } : {}),
  });

async function GET(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  const { store } = await read();
  return json(store);
}

export async function POST(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  let body: { tool?: unknown; fields?: unknown; by?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (typeof body.tool !== "string" || !body.tool || body.tool.length > 100) return json({ error: "tool is required" }, 400);
  const fields = sanitiseFields(body.fields);
  if (Object.keys(fields).length === 0) return json({ error: "No valid fields" }, 400);
  const by = typeof body.by === "string" ? body.by : "unknown";

  for (let attempt = 0; attempt < 4; attempt++) {
    const { store, etag } = await read();
    const next = applyNoteUpdate(store, body.tool, fields, by, new Date().toISOString());
    try {
      await write(next, etag);
      return json({ note: next.tools[body.tool] });
    } catch (e) {
      console.error("tool-notes write failed", attempt, etag, e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      if (!(e instanceof BlobPreconditionFailedError) && !String(e).includes("already exists")) throw e;
      await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  return json({ error: "Could not save — please try again" }, 409);
}
