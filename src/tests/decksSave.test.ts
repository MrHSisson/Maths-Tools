// POST /api/decks with an in-memory blob store: two savers editing one deck merge instead of overwriting each other.
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, { body: string; etag: number }>();
class Missing extends Error {}
class Precondition extends Error {}
let writesBeforeConflict = 0;       // make the next N conditional writes fail, as if another save got in first
vi.mock("@vercel/blob", () => ({
  BlobNotFoundError: Missing, BlobPreconditionFailedError: Precondition,
  head: async (p: string) => { const e = store.get(p); if (!e) throw new Missing(); return { etag: `"${e.etag}"` }; },
  get: async (p: string) => { const e = store.get(p); return e ? { statusCode: 200, stream: new Response(e.body).body } : null; },
  put: async (p: string, body: string, opts: { allowOverwrite?: boolean; ifMatch?: string }) => {
    const e = store.get(p);
    if (writesBeforeConflict > 0 && e) { writesBeforeConflict--; store.set(p, { body: e.body, etag: e.etag + 1 }); throw new Precondition(); }
    if (e && !opts.allowOverwrite) throw new Error("already exists");
    if (e && opts.ifMatch && opts.ifMatch !== `"${e.etag}"`) throw new Precondition();
    store.set(p, { body, etag: (e?.etag ?? 0) + 1 });
    return {};
  },
  del: async (p: string) => { store.delete(p); },
}));
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const el = (id: string, text: string) => ({ id, kind: "text", x: 0, y: 0, w: 10, h: 10, text, size: 40 });
const slide = (id: string, text: string) => ({ id, family: "teach", title: id, els: [el(`${id}-1`, text)] });
const base = { id: "d", title: "D", summary: "", slides: [slide("a", "a"), slide("b", "b"), slide("c", "c")], updatedAt: "2026-11-01T10:00:00.000Z" };
const post = (body: unknown) => POST(new Request("http://x/api/decks", { method: "POST", headers: { "x-admin-key": "k" }, body: JSON.stringify(body) }));
const stored = async () => (await (await GET(new Request("http://x/api/decks?id=d", { headers: { "x-admin-key": "k" } }))).json()) as typeof base;
const edit = (d: typeof base, s: string, text: string) => ({ ...d, slides: d.slides.map((x) => (x.id === s ? slide(s, text) : x)), updatedAt: new Date().toISOString() });

describe("saving a deck that someone else has also changed", () => {
  beforeEach(() => { store.clear(); writesBeforeConflict = 0; });

  it("a save with no base replaces the stored deck, as before", async () => {
    await post({ deck: base, by: "Harry" });
    const res = await (await post({ deck: edit(base, "a", "replaced"), by: "Harry" })).json();
    expect(res.merged).toBe(false);
    expect((await stored()).slides[0].els[0].text).toBe("replaced");
  });

  it("Harry's save and Claude's save, both made from the same base, both survive, in either order", async () => {
    for (const order of [["Harry", "Claude"], ["Claude", "Harry"]]) {
      store.clear();
      await post({ deck: base, by: "Harry" });
      const saves: Record<string, unknown> = { Harry: edit(base, "a", "Harry's words"), Claude: edit(base, "c", "Claude's words") };
      for (const who of order) await post({ deck: saves[who], base, by: who });
      const d = await stored();
      expect([d.slides[0].els[0].text, d.slides[2].els[0].text]).toEqual(["Harry's words", "Claude's words"]);
    }
  });

  it("the response carries the merged deck when it differs from what was sent, so the saver can adopt it", async () => {
    await post({ deck: base, by: "Harry" });
    await post({ deck: edit(base, "a", "Harry's words"), base, by: "Harry" });
    const res = await (await post({ deck: edit(base, "c", "Claude's words"), base, by: "Claude" })).json();
    expect(res.merged).toBe(true);
    expect(res.deck.slides[0].els[0].text).toBe("Harry's words");
    expect(res.deck.slides[2].els[0].text).toBe("Claude's words");
    expect(res.deck.updatedAt > base.updatedAt).toBe(true);
  });

  it("when both changed the same thing, Harry's wins whoever saves last", async () => {
    await post({ deck: base, by: "Harry" });
    await post({ deck: edit(base, "b", "Harry's"), base, by: "Harry" });
    const res = await (await post({ deck: edit(base, "b", "Claude's"), base, by: "Claude" })).json();
    expect(res.conflicts).toEqual(["b/b-1.text"]);
    expect((await stored()).slides[1].els[0].text).toBe("Harry's");
    // and if Claude saved first, Harry's later save wins too
    store.clear();
    await post({ deck: base, by: "Harry" });
    await post({ deck: edit(base, "b", "Claude's"), base, by: "Claude" });
    await post({ deck: edit(base, "b", "Harry's"), base, by: "Harry" });
    expect((await stored()).slides[1].els[0].text).toBe("Harry's");
  });

  it("retries when another save lands between the read and the write", async () => {
    await post({ deck: base, by: "Harry" });
    writesBeforeConflict = 1;
    const res = await post({ deck: edit(base, "a", "after a retry"), base, by: "Harry" });
    expect(res.status).toBe(200);
    expect((await stored()).slides[0].els[0].text).toBe("after a retry");
  });

  it("an out-of-date editor that did not touch a slide cannot wipe another saver's edit to it", async () => {
    await post({ deck: base, by: "Harry" });
    await post({ deck: edit(base, "c", "Claude's words"), base, by: "Claude" });
    await post({ deck: edit(base, "a", "Harry's later words"), base, by: "Harry" });     // Harry's screen never saw Claude's change
    const d = await stored();
    expect([d.slides[0].els[0].text, d.slides[2].els[0].text]).toEqual(["Harry's later words", "Claude's words"]);
  });
});
