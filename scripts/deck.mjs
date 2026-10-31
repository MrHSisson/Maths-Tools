// Decks are data. The shared copy (what Harry sees and edits) is the master; src/decks/data/<id>.json is its snapshot
// in the repo and what a fresh device starts from.
//   npm run deck -- pull <id>             write the shared copy to src/decks/data/<id>.json (always do this before changing a deck)
//   npm run deck -- push <id>             send src/decks/data/<id>.json to the shared copy (devices pick it up the next time they open decks)
//   npm run deck -- list                  every shared deck
//   npm run deck -- publish <id>          publish src/decks/data/<id>.json: a read-only copy for the Decks tab (only when Harry asks; unpublish <id> takes it down)
//   npm run deck -- build <script> [--replace]   run a build script (see src/decks/builder.ts), check the deck and write src/decks/data/<id>.json
//   npm run deck -- preflight <tool-id>   BEFORE building on a tool: is it ready for a deck (draws everywhere, mixes fairly, has Depth, has a fixed-question builder)?
//   npm run deck -- diff <id>             which slides were edited in the editor since the last build, and which were added there (pull first)
//   npm run deck -- builders              the Q builders there are, and the tools they cover
//   npm run deck -- sheet <id> 7,13,20     one picture of those slides (written to /tmp/deck-<id>-sheet.png)
//   npm run deck -- new <id> <tool-id>    preflight the tool and write a build-script skeleton (scratchpad path as a third argument)
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
    if (existsSync(file(deck.id)) && !flags.has("--replace") && !flags.has("--force")) fail(`${file(deck.id)} exists: it may hold edits made in the editor. Pull first, then build again with --replace (your edits to slides are kept) or --force (overwrites everything).`);
    const { stampBuilt, mergeRebuild } = await load("/src/decks/merge.ts");
    let out = stampBuilt(deck);
    if (existsSync(file(deck.id)) && !flags.has("--force")) {
      const r = mergeRebuild(JSON.parse(readFileSync(file(deck.id), "utf8")), out);
      out = r.deck;
      console.log(`rebuild: ${r.replaced} slides replaced, ${r.kept.length} kept because they were edited${r.kept.length ? ` (${r.kept.join(", ")})` : ""}, ${r.added.length} added in the editor kept${r.added.length ? ` (${r.added.join(", ")})` : ""}, ${r.dropped.length} no longer built and dropped${r.dropped.length ? ` (${r.dropped.join(", ")})` : ""}`);
    }
    mkdirSync("src/decks/data", { recursive: true });
    writeFileSync(file(deck.id), JSON.stringify(out, null, 1) + "\n");
    console.log(`wrote ${file(deck.id)}. Next: npm run deck -- verify ${deck.id}, then npm run deck -- push ${deck.id}`);
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
} else if (cmd === "diff" && id) {
  // which slides were changed in the editor since the last build, and which were added there (pull first)
  if (!existsSync(file(id))) fail(`diff: ${file(id)} not found (pull it first)`);
  await withVite(async (load) => {
    const { isEdited } = await load("/src/decks/merge.ts");
    const deck = JSON.parse(readFileSync(file(id), "utf8"));
    if (!deck.slides.some((s) => s.built)) { console.log(`${id}: built before slides were stamped, so edits cannot be told apart yet. Rebuild once with --replace.`); return; }
    const edited = deck.slides.filter((s) => s.built && isEdited(s)), added = deck.slides.filter((s) => !s.built);
    console.log(`${id}: ${edited.length} slide${edited.length === 1 ? "" : "s"} edited, ${added.length} added in the editor`);
    for (const s of edited) console.log(`  edited  ${s.id}  "${s.title}"`);
    for (const s of added) console.log(`  added   ${s.id}  "${s.title}"`);
  });
} else if (cmd === "builders") {
  const text = readFileSync("src/decks/builder.ts", "utf8");
  const tools = [...new Set([...text.matchAll(/"([a-z]+(?:-[a-z]+)+)"/g)].map((m) => m[1]))].filter((t) => existsSync("src/tools") && text.includes(`"${t}"`));
  const qBlock = text.slice(text.indexOf("export const Q"), text.indexOf("export const S"));
  const methods = [...qBlock.matchAll(/^  (\w+): (?:async )?\(/gm)].map((m) => m[1]);
  console.log(`Q builders: ${methods.join(", ")}\nTools named in builder.ts: ${tools.join(", ")}`);
} else if (cmd === "sheet" && id) {
  const which = args.filter((a) => !a.startsWith("--"))[2];
  if (!which || !existsSync(file(id))) fail("usage: npm run deck -- sheet <id> 7,13,20-22");
  const slides = which.split(",").flatMap((p) => { const [a, b] = p.split("-").map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
  const { createRequire } = await import("node:module");
  const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
  await withServer(async (url) => {
    const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => localStorage.setItem("mt-dev-mode", "1"));
    const shots = [];
    for (const n of slides) { await page.goto(`${url}/decks/${id}?s=${n}`); await page.waitForTimeout(1800); shots.push((await page.screenshot()).toString("base64")); }
    const cols = Math.min(2, shots.length), rows = Math.ceil(shots.length / cols);
    const sheet = await browser.newPage({ viewport: { width: 640 * cols, height: 360 * rows } });
    await sheet.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},640px)">${shots.map((b) => `<img style="width:640px;height:360px" src="data:image/png;base64,${b}">`).join("")}</body>`);
    const out = `/tmp/deck-${id}-sheet.png`;
    await sheet.screenshot({ path: out });
    await browser.close();
    console.log(`wrote ${out} (slides ${slides.join(", ")})`);
  });
} else if (cmd === "new" && id) {
  const toolId = args.filter((a) => !a.startsWith("--"))[2];
  const out = args.filter((a) => !a.startsWith("--"))[3] ?? `/tmp/deck-${id}.ts`;
  if (!toolId) fail("usage: npm run deck -- new <deck-id> <tool-id> [script path]");
  const bad = await withVite(async (load) => {
    const { preflightTool } = await load("/src/decks/preflight.ts");
    const { lines, problems } = await preflightTool(toolId);
    console.log(`Is ${toolId} ready for a deck?`); for (const l of lines) console.log(`  - ${l}`); for (const p of problems) console.error(`  PROBLEM: ${p}`);
    return problems.length;
  });
  if (bad) process.exit(1);
  writeFileSync(out, `// Build script for the "${id}" deck on the ${toolId} tool. Follow docs/design/DECK_BUILD_CHECKLIST.md (the process and the skeleton).
// Rebuild with: npm run deck -- build ${out} --replace   (slides edited in the editor are kept)
import { Q, S } from "/src/decks/builder";
import type { Slide } from "/src/decks/types";

const T = "${toolId}";

export default () => ({
  id: "${id}", title: "TITLE", tool: T, summary: "One sentence on what the lesson covers.",
  slides: [
    S.title("${id}-title", "TITLE", "Subtitle"),
    S.objective("${id}-objective", "Learning objective.", ["Success criterion", "Success criterion"]),

    // ── Idea 1 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    S.divider("${id}-d1", "Idea one", "Why it matters"),
    // teach with a picture: S.ratioTable / S.bar / S.board
    S.discuss("${id}-disc1", "A claim or two views to test, containing a question?", "Key point.", "Follow-up question", "answer"),
    S.deliberate("${id}-set1", "Practise", [/* Q.* builders only: five or more */]),
    S.general("${id}-gen1", "Whiteboards", T, { sub: "SUBTOOL", level: "level1" }, 1),
    // ONE take-home piece: pinnedSheetSlide(...) OR S.quick / S.book (3 x 4), not both
    // S.depth("${id}-dp1", T, "DEPTH-ITEM-ID", "Depth"),   // numbers the deck does not use elsewhere

    S.summary("${id}-summary", "Summary", ["Point", "Point"]),
  ] as Slide[],
});
`);
  console.log(`wrote ${out}`);
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
} else fail("usage: npm run deck -- list | pull <id> | push <id> | publish <id> | unpublish <id> | build <script> [--replace] | check <id|all> [--layout] | preflight <tool-id> | verify <id> | diff <id> | builders | sheet <id> <slides> | new <id> <tool-id>");
