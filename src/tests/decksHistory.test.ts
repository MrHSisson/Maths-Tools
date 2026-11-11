// The shared version history (kept in Postgres): a snapshot of the deck as it stood before a burst of edits, at most one per gap, newest 40 kept.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_SNAPSHOTS, SNAPSHOT_GAP_MS, emptyHistory, historyWith, shouldSnapshot, snapshotKey, validSnapshotKey } from "../../api/_decks";

import { setDb } from "../../api/_db";
import { makeTestDb } from "./testDb";

const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const slide = (id: string, text: string) => ({ id, family: "teach", title: id, els: [{ id: `${id}-1`, kind: "text", x: 0, y: 0, w: 10, h: 10, text, size: 40 }] });
const deck = (text: string, at: string) => ({ id: "d", title: "D", summary: "", slides: [slide("a", text)], updatedAt: at });
const post = (body: unknown) => POST(new Request("http://x/api/decks", { method: "POST", headers: { "x-admin-key": "k" }, body: JSON.stringify(body) }));
const get = (q: string) => GET(new Request(`http://x/api/decks?${q}`, { headers: { "x-admin-key": "k" } }));
const text = (d: { slides: { els: { text: string }[] }[] }) => d.slides[0].els[0].text;

describe("pure history rules", () => {
  it("snapshots when there is none, or the newest is older than the gap", () => {
    const e = { key: "k", at: "2026-11-05T10:00:00.000Z", savedAt: "", title: "D", slides: 1 };
    expect(shouldSnapshot(emptyHistory(), 0)).toBe(true);
    expect(shouldSnapshot({ version: 1, entries: [e] }, Date.parse(e.at) + SNAPSHOT_GAP_MS - 1)).toBe(false);
    expect(shouldSnapshot({ version: 1, entries: [e] }, Date.parse(e.at) + SNAPSHOT_GAP_MS)).toBe(true);
  });
  it("keeps the newest MAX_SNAPSHOTS and reports the ones dropped", () => {
    let h = emptyHistory(), dropped: string[] = [];
    for (let i = 0; i < MAX_SNAPSHOTS + 3; i++) { const r = historyWith(h, { key: `k${i}`, at: "", savedAt: "", title: "", slides: 1 }); h = r.history; dropped = [...dropped, ...r.dropped]; }
    expect(h.entries).toHaveLength(MAX_SNAPSHOTS);
    expect(dropped).toEqual(["k0", "k1", "k2"]);
    expect(h.entries[h.entries.length - 1].key).toBe(`k${MAX_SNAPSHOTS + 2}`);
  });
  it("a snapshot key from a timestamp is valid, and path tricks are not", () => {
    expect(validSnapshotKey(snapshotKey("2026-11-05T10:00:00.123Z"))).toBe(true);
    expect(validSnapshotKey("../published/x")).toBe(false);
  });
});

describe("the live copy keeps a rollback", () => {
  beforeEach(async () => { await db.reset(); vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-05T10:00:00.000Z")); });
  afterEach(() => vi.useRealTimers());

  it("the first save has nothing before it; the next one keeps what was there", async () => {
    await post({ deck: deck("one", "2026-11-05T10:00:00.000Z"), by: "Harry" });
    expect((await (await get("history=d")).json()).entries).toHaveLength(0);
    vi.setSystemTime(new Date("2026-11-05T10:01:00.000Z"));
    await post({ deck: deck("two", "2026-11-05T10:01:00.000Z"), by: "Harry" });
    const { entries } = await (await get("history=d")).json();
    expect(entries).toHaveLength(1);
    expect(entries[0].savedAt).toBe("2026-11-05T10:00:00.000Z");
    expect(text(await (await get(`history=d&key=${entries[0].key}`)).json())).toBe("one");
  });

  it("a burst of saves makes one snapshot (the state before the burst), and the next burst after the gap another", async () => {
    await post({ deck: deck("start", "2026-11-05T10:00:00.000Z"), by: "Harry" });
    for (const [i, t] of ["a", "ab", "abc"].entries()) { vi.setSystemTime(new Date(Date.parse("2026-11-05T10:01:00.000Z") + i * 5000)); await post({ deck: deck(t, new Date().toISOString()), by: "Harry" }); }
    let { entries } = await (await get("history=d")).json();
    expect(entries).toHaveLength(1);
    expect(text(await (await get(`history=d&key=${entries[0].key}`)).json())).toBe("start");
    vi.setSystemTime(new Date("2026-11-05T10:30:00.000Z"));
    await post({ deck: deck("later", "2026-11-05T10:30:00.000Z"), by: "Claude" });
    ({ entries } = await (await get("history=d")).json());
    expect(entries).toHaveLength(2);
    expect(text(await (await get(`history=d&key=${entries[0].key}`)).json())).toBe("abc");        // newest first
  });

  it("a save that changes nothing does not make a snapshot", async () => {
    const d = deck("same", "2026-11-05T10:00:00.000Z");
    await post({ deck: d, by: "Harry" });
    vi.setSystemTime(new Date("2026-11-05T11:00:00.000Z"));
    await post({ deck: d, by: "Harry" });
    expect((await (await get("history=d")).json()).entries).toHaveLength(0);
  });

  it("history needs the admin key and refuses a bad key", async () => {
    expect((await GET(new Request("http://x/api/decks?history=d"))).status).toBe(401);
    expect((await get("history=d&key=../x")).status).toBe(400);
  });
});
