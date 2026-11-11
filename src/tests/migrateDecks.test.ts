// The one-off Blob → Postgres import (api/migrate-decks.ts): copies decks, history, published copies and questions; safe to run twice; never overwrites a newer edit.
import { beforeEach, describe, expect, it, vi } from "vitest";

const blobs = new Map<string, unknown>();
vi.mock("@vercel/blob", () => ({ get: async (p: string) => (blobs.has(p) ? { statusCode: 200, stream: new Response(JSON.stringify(blobs.get(p))).body } : null) }));
import { setDb } from "../../api/_db";
import { makeTestDb } from "./testDb";
const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST: migrate } = await import("../../api/migrate-decks");
const { GET, POST } = await import("../../api/decks");

const slide = (id: string) => ({ id, family: "teach", title: id, els: [] });
const deck = (id: string, title: string, at: string) => ({ id, title, summary: "S", slides: [slide("a"), slide("b")], updatedAt: at });
const run = (body: unknown = {}, key = "k") => migrate(new Request("http://x/api/migrate-decks", { method: "POST", headers: { "x-admin-key": key }, body: JSON.stringify(body) }));
const get = (q = "", key: string | null = "k") => GET(new Request(`http://x/api/decks${q}`, { headers: key ? { "x-admin-key": key } : {} }));

describe("importing the Blob store into Postgres", () => {
  beforeEach(async () => {
    await db.reset(); blobs.clear();
    blobs.set("decks-index.json", { version: 1, decks: { a: { title: "A", summary: "S", slides: 2, updatedAt: "2026-11-01T10:00:00.000Z", updatedBy: "Harry" }, gone: { title: "G", summary: "", slides: 0, updatedAt: "x", updatedBy: "" } } });
    blobs.set("decks/a.json", deck("a", "A", "2026-11-01T10:00:00.000Z"));          // "gone" is in the index but its blob is missing
    blobs.set("history/a/index.json", { version: 1, entries: [{ key: "2026-10-31T10-00-00-000Z", at: "2026-10-31T10:00:00.000Z", savedAt: "2026-10-30T10:00:00.000Z", title: "A old", slides: 1 }] });
    blobs.set("history/a/2026-10-31T10-00-00-000Z.json", deck("a", "A old", "2026-10-30T10:00:00.000Z"));
    blobs.set("published-index.json", { version: 1, decks: { a: { title: "A", summary: "S", slides: 2, publishedAt: "2026-11-02T10:00:00.000Z" } } });
    blobs.set("published/a.json", { ...deck("a", "A", "2026-11-01T10:00:00.000Z"), publishedAt: "2026-11-02T10:00:00.000Z" });
    blobs.set("deck-questions.json", { version: 1, questions: { "my-q-1": { id: "my-q-1", latex: "1", answer: "1", working: [] } } });
  });

  it("needs the admin key", async () => { expect((await run({}, "wrong")).status).toBe(401); });

  it("a dry run reports what it would copy and writes nothing", async () => {
    const r = await (await run({ dryRun: true })).json();
    expect(r).toMatchObject({ dryRun: true, decks: { found: 2, written: 0, missing: ["gone"] }, history: { found: 1 }, published: { found: 1 }, questions: { found: 1 } });
    expect((await (await get()).json()).index.decks).toEqual({});
  });

  it("copies everything, in the shape the app reads", async () => {
    const r = await (await run()).json();
    expect(r).toMatchObject({ decks: { found: 2, written: 1, missing: ["gone"] }, history: { found: 1 }, published: { found: 1, written: 1 }, questions: { found: 1 } });
    const all = await (await get()).json();
    expect(all.index.decks.a).toEqual({ title: "A", summary: "S", slides: 2, updatedAt: "2026-11-01T10:00:00.000Z", updatedBy: "Harry" });
    expect(Object.keys(all.questions.questions)).toEqual(["my-q-1"]);
    expect((await (await get("?history=a")).json()).entries).toHaveLength(1);
    const pub = await (await get("?published", null)).json();
    expect(pub.decks.a).toMatchObject({ title: "A", slides: 2, publishedAt: "2026-11-02T10:00:00.000Z", preview: { id: "a" } });
    expect((await (await get("?published=a", null)).json()).slides).toHaveLength(2);
  });

  it("running it again changes nothing, and never overwrites a deck edited since", async () => {
    await run();
    await POST(new Request("http://x/api/decks", { method: "POST", headers: { "x-admin-key": "k" }, body: JSON.stringify({ deck: deck("a", "Edited after the move", "2026-11-05T10:00:00.000Z"), by: "Harry" }) }));
    const again = await (await run()).json();
    expect(again.decks.written).toBe(0);
    expect((await (await get("?id=a")).json()).title).toBe("Edited after the move");
  });
});
