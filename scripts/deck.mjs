// Decks are data. The shared copy (what Harry sees and edits) is the master; src/decks/data/<id>.json is its snapshot
// in the repo and what a fresh device starts from.
//   npm run deck -- pull <id>             write the shared copy to src/decks/data/<id>.json (always do this before changing a deck)
//   npm run deck -- push <id>             send src/decks/data/<id>.json to the shared copy (devices pick it up the next time they open decks)
//   npm run deck -- list                  every shared deck
//   npm run deck -- publish <id>          publish src/decks/data/<id>.json: a read-only copy for the Decks tab (only when Harry asks; unpublish <id> takes it down)
//   npm run deck -- build <script> [--replace]   run a build script (see src/decks/builder.ts), check the deck and write src/decks/data/<id>.json
//   npm run deck -- preflight <tool-id>   BEFORE building on a tool: is it ready for a deck (draws everywhere, mixes fairly, has Depth, has a fixed-question builder)?
//   npm run deck -- verify <id>           BEFORE showing a deck: content, layout, printed worksheets (one page each) and its Depth cards, in one go
//   npm run deck -- check <id|all> [--layout]    the content checks (src/decks/deckChecks.ts); --layout also starts the app and measures every slide
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const [cmd, id] = args.filter((a) => !a.startsWith("--"));
const file = (i) => `src/decks/data/${i}.json`;
const fail = (m) => { console.error(m); process.exit(1); };

const remote = () => {
  const key = readFileSync("src/devAccess.ts", "utf8").match(/DEV_PASSWORD = "([^"]*)"/)?.[1];
  return { base: process.env.DECKS_URL ?? "https://maths-tools-phi.vercel.app/api/decks", headers: { "x-admin-key": key, "content-type": "application/json" } };
};

/** TypeScript from the command line through Vite's own loader (the same one the app and tests use). */
async function withVite(fn) {
  const { createServer } = await import("vite");
  const server = await createServer({ logLevel: "error", appType: "custom", server: { middlewareMode: true, fs: { strict: false } } });
  try { return await fn((p) => server.ssrLoadModule(p)); } finally { await server.close(); }
}
const print = (name, { problems, warnings }) => {
  for (const w of warnings) console.log(`  warning: ${w}`);
  for (const p of problems) console.error(`  PROBLEM: ${p}`);
  console.log(problems.length ? `${name}: ${problems.length} problem${problems.length > 1 ? "s" : ""}` : `${name}: content checks pass${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""}`);
  return problems.length;
};

/** The app on a local port for the browser checks (started and stopped here). */
async function withServer(fn) {
  const port = 5191, url = `http://127.0.0.1:${port}`;
  const dev = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore", detached: true });
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 500)); }
    return await fn(url);
  } finally { try { process.kill(-dev.pid); } catch { dev.kill(); } }
}
const runScript = (script, scriptArgs, url, extraEnv = {}) => new Promise((resolve) => spawn("node", [script, ...scriptArgs], { stdio: "inherit", env: { ...process.env, SMOKE_URL: url, ...extraEnv } }).on("exit", (code) => resolve(code ?? 1)));
const layoutCheck = (deckId) => withServer((url) => runScript("scripts/deckLayoutSmoke.mjs", [deckId], url));

if (cmd === "list") {
  const { base, headers } = remote();
  const { index } = await (await fetch(base, { headers })).json();
  for (const [i, e] of Object.entries(index.decks)) console.log(`${i}\t${e.slides} slides\t${e.updatedAt}\t${e.updatedBy}`);
} else if (cmd === "pull" && id) {
  const { base, headers } = remote();
  const res = await fetch(`${base}?id=${encodeURIComponent(id)}`, { headers });
  if (!res.ok) fail(`pull ${id}: ${res.status}`);
  const deck = await res.json();
  delete deck.updatedAt; // the snapshot has no timestamp: push stamps one
  mkdirSync("src/decks/data", { recursive: true });
  writeFileSync(file(id), JSON.stringify(deck, null, 1) + "\n");
  console.log(`pulled ${id}: ${deck.slides.length} slides`);
} else if (cmd === "push" && id) {
  const { base, headers } = remote();
  const deck = JSON.parse(readFileSync(file(id), "utf8"));
  deck.updatedAt = new Date().toISOString();
  const res = await fetch(base, { method: "POST", headers, body: JSON.stringify({ deck, by: "Claude" }) });
  if (!res.ok) fail(`push ${id}: ${res.status} ${await res.text()}`);
  console.log(`pushed ${id}: ${deck.slides.length} slides`);
} else if ((cmd === "publish" || cmd === "unpublish") && id) {
  const { base, headers } = remote();
  const body = cmd === "publish" ? { publish: { ...JSON.parse(readFileSync(file(id), "utf8")), updatedAt: new Date().toISOString() }, by: "Claude" } : { unpublish: id, by: "Claude" };
  const res = await fetch(base, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) fail(`${cmd} ${id}: ${res.status} ${await res.text()}`);
  console.log(`${cmd === "publish" ? "published" : "unpublished"} ${id}`);
} else if (cmd === "build" && id) {
  const script = path.resolve(id);
  if (!existsSync(script)) fail(`build: ${script} not found`);
  const problems = await withVite(async (load) => {
    const make = (await load(script)).default;
    const input = typeof make === "function" ? await make() : make;
    const { buildDeck } = await load("/src/decks/builder.ts");
    const { checkDeckContent } = await load("/src/decks/deckChecks.ts");
    const deck = await buildDeck(input);
    const count = print(`${deck.id} (${deck.slides.length} slides)`, await checkDeckContent(deck));
    if (count) return count;
    if (existsSync(file(deck.id)) && !flags.has("--replace")) fail(`${file(deck.id)} exists: it may hold edits made in the player. Pull first, or build again with --replace to overwrite it.`);
    mkdirSync("src/decks/data", { recursive: true });
    writeFileSync(file(deck.id), JSON.stringify(deck, null, 1) + "\n");
    console.log(`wrote ${file(deck.id)}. Next: npm run deck -- check ${deck.id} --layout, then npm run deck -- push ${deck.id}`);
    return 0;
  });
  process.exit(problems ? 1 : 0);
} else if (cmd === "check" && id) {
  const ids = id === "all" ? readdirSync("src/decks/data").filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : [id];
  let bad = 0;
  await withVite(async (load) => {
    const { checkDeckContent } = await load("/src/decks/deckChecks.ts");
    for (const i of ids) { if (!existsSync(file(i))) fail(`check: ${file(i)} not found`); bad += print(i, await checkDeckContent(JSON.parse(readFileSync(file(i), "utf8")))); }
  });
  if (flags.has("--layout")) for (const i of ids) bad += (await layoutCheck(i)) ? 1 : 0;
  process.exit(bad ? 1 : 0);
} else if (cmd === "preflight" && id) {
  const bad = await withVite(async (load) => {
    const { preflightTool } = await load("/src/decks/preflight.ts");
    const { lines, problems } = await preflightTool(id);
    console.log(`Is ${id} ready for a deck?`);
    for (const l of lines) console.log(`  - ${l}`);
    for (const p of problems) console.error(`  PROBLEM: ${p}`);
    return problems.length;
  });
  process.exit(bad ? 1 : 0);
} else if (cmd === "verify" && id) {
  if (!existsSync(file(id))) fail(`verify: ${file(id)} not found`);
  let bad = 0;
  await withVite(async (load) => { const { checkDeckContent } = await load("/src/decks/deckChecks.ts"); bad += print(id, await checkDeckContent(JSON.parse(readFileSync(file(id), "utf8")))); });
  const deck = JSON.parse(readFileSync(file(id), "utf8"));
  const pinned = deck.slides.some((sl) => sl.els.some((e) => e.kind === "worksheet" && e.pin));
  const hasDepth = deck.slides.some((sl) => sl.els.some((e) => e.kind === "depth" || (e.kind === "questions" && e.items?.some((q) => q.source?.kind === "depth"))));
  bad += await withServer(async (url) => {
    let n = 0;
    console.log("-- layout"); n += (await runScript("scripts/deckLayoutSmoke.mjs", [id], url)) ? 1 : 0;
    if (pinned) { console.log("-- printed worksheets (one page each)"); n += (await runScript("scripts/deckPrintSmoke.mjs", [id], url)) ? 1 : 0; }
    if (hasDepth) { console.log("-- Depth cards"); n += (await runScript("scripts/depthSlideAudit.mjs", [], url, { DEPTH_DECK: id })) ? 1 : 0; }
    return n;
  });
  console.log(bad ? `verify ${id}: ${bad} part${bad > 1 ? "s" : ""} need attention` : `verify ${id}: everything passes`);
  process.exit(bad ? 1 : 0);
} else fail("usage: npm run deck -- list | pull <id> | push <id> | publish <id> | unpublish <id> | build <script> [--replace] | check <id|all> [--layout] | preflight <tool-id> | verify <id>");
