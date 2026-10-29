// Decks are data. The shared copy (what Harry sees and edits) is the master; src/decks/data/<id>.json is its snapshot
// in the repo and what a fresh device starts from.
//   npm run deck -- pull <id>   write the shared copy to src/decks/data/<id>.json (always do this before changing a deck)
//   npm run deck -- push <id>   send src/decks/data/<id>.json to the shared copy (devices pick it up the next time they open decks)
//   npm run deck -- list        every shared deck
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const key = readFileSync("src/devAccess.ts", "utf8").match(/DEV_PASSWORD = "([^"]*)"/)?.[1];
const BASE = process.env.DECKS_URL ?? "https://maths-tools-phi.vercel.app/api/decks";
const headers = { "x-admin-key": key, "content-type": "application/json" };
const [cmd, id] = process.argv.slice(2);
const file = (i) => `src/decks/data/${i}.json`;
const fail = (m) => { console.error(m); process.exit(1); };

if (cmd === "list") {
  const { index } = await (await fetch(BASE, { headers })).json();
  for (const [i, e] of Object.entries(index.decks)) console.log(`${i}\t${e.slides} slides\t${e.updatedAt}\t${e.updatedBy}`);
} else if (cmd === "pull" && id) {
  const res = await fetch(`${BASE}?id=${encodeURIComponent(id)}`, { headers });
  if (!res.ok) fail(`pull ${id}: ${res.status}`);
  const deck = await res.json();
  delete deck.updatedAt; // the snapshot has no timestamp: push stamps one
  mkdirSync("src/decks/data", { recursive: true });
  writeFileSync(file(id), JSON.stringify(deck, null, 1) + "\n");
  console.log(`pulled ${id}: ${deck.slides.length} slides`);
} else if (cmd === "push" && id) {
  const deck = JSON.parse(readFileSync(file(id), "utf8"));
  deck.updatedAt = new Date().toISOString();
  const res = await fetch(BASE, { method: "POST", headers, body: JSON.stringify({ deck, by: "Claude" }) });
  if (!res.ok) fail(`push ${id}: ${res.status} ${await res.text()}`);
  console.log(`pushed ${id}: ${deck.slides.length} slides`);
} else fail("usage: npm run deck -- list | pull <id> | push <id>");
