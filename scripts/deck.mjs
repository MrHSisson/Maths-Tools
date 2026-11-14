// Decks are data. The shared copy (what Harry sees and edits) is the LIVE one and the master; src/decks/data/<id>.json is its backup
// in the repo: git's history of it and what the tests read. The app does not bundle it (since 2026-11-11): a device gets decks from the shared copy.
//   npm run deck -- check <id|all> --live  check the LIVE copy(ies) directly: nothing is read from or written to the repo (add --layout to measure every slide too)
//   npm run deck -- backup [<id>|all]     write the live copy(ies) into src/decks/data as the repo snapshot (commit it); a file with unpushed edits is left alone
//   npm run deck -- pull <id>             write the shared copy to src/decks/data/<id>.json (always do this before changing a deck)
//   npm run deck -- push <id>             send src/decks/data/<id>.json to the shared copy (devices pick it up the next time they open decks)
//   npm run deck -- list                  every shared deck
//   npm run deck -- publish <id>          publish the LIVE copy: a read-only copy for the Decks tab, then back it up into the repo (only when Harry asks; unpublish <id> takes it down; --file publishes the file instead)
//   npm run deck -- build <script> [--replace]   run a build script (see src/decks/builder.ts), check the deck and write src/decks/data/<id>.json
//   npm run deck -- preflight <tool-id>   BEFORE building on a tool: is it ready for a deck (draws everywhere, mixes fairly, has Depth, has a fixed-question builder)?
//   npm run deck -- diff <id>             which slides were edited in the editor since the last build, and which were added there (pull first)
//   npm run deck -- builders              the Q builders there are, and the tools they cover
//   npm run deck -- categories            the category tree Harry controls on the Decks page (strands with topics) and the decks filed in each; `categories add "<name>" [--under "<strand>"]` adds one
//   npm run deck -- file <deck-id> "<Strand>" | "<Strand> > <Topic>" | none    file a deck (Harry can also drag its card on the Decks page). Needs the deployment that has categories: DECKS_URL=<it>/api/decks until the branch is merged
//   npm run deck -- sheet <id> 7,13,20     one picture of those slides (written to /tmp/deck-<id>-sheet.png)
//   npm run deck -- looks <script>        THE LOOK CARD, before the deck is built: builds the script to a temp file (the repo is untouched) and writes contact sheets of ONE slide of each kind, every state (each question, the working open, answers shown). Harry approves this first
//   npm run deck -- review <id> [--file f] [--kinds]   contact sheets of every slide of a built deck with all its clicks revealed (--kinds: one of each kind). Look at them before showing the deck
//   npm run deck -- new <id> <tool-id>    preflight the tool and write a build-script skeleton (scratchpad path as a third argument)
//   npm run deck -- verify <id>           BEFORE showing a deck: content, layout, printed worksheets (one page each) and its Depth cards, in one go
//   npm run deck -- check <id|all> [--layout]    the content checks (src/decks/deckChecks.ts); --layout also starts the app and measures every slide
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execSync, spawn, spawnSync } from "node:child_process";
import { serveDeck } from "./deckPage.mjs";
import path from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const [cmd, id] = args.filter((a) => !a.startsWith("--"));
const file = (i) => `src/decks/data/${i}.json`;
// The base of a pull: the shared copy as it was when pulled. A push sends it, and the server merges the push into whatever is stored by
// slide and element (api/_deckMerge.ts), so a push can no longer overwrite what Harry changed since. Local only (git ignores .deck-base/).
const baseFile = (i) => `.deck-base/${i}.json`;
const fail = (m) => { console.error(m); process.exit(1); };

/** The live site runs main. A deck that relies on code this branch has changed (the player, the shared components) looks different there until it is merged and deployed. */
function skewWarning() {
  try {
    const changed = execSync("git diff --name-only origin/main -- src api", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n")
      .filter((f) => /\.(tsx|css)$/.test(f) || /^src\/shared\/[^/]+\.ts$/.test(f) || f.startsWith("api/"))
      .filter((f) => !f.startsWith("src/tests/") && !f.startsWith("src/decks/data/") && !f.startsWith("src/generated/"));
    if (changed.length) console.warn(`\nWARNING: this branch changes code that is not on main (${changed.slice(0, 8).join(", ")}${changed.length > 8 ? `, and ${changed.length - 8} more` : ""}).\nThe live site runs main, so a deck that relies on any of it will not look there as it does here until the branch is merged and deployed. Merge first, or send Harry the branch preview link with the deck.`);
  } catch { /* no origin/main to compare with */ }
}

const remote = () => {
  const key = readFileSync("src/devAccess.ts", "utf8").match(/DEV_PASSWORD = "([^"]*)"/)?.[1];
  return { base: process.env.DECKS_URL ?? "https://maths-tools-phi.vercel.app/api/decks", headers: { "x-admin-key": key, "content-type": "application/json" } };
};

/** The live (shared) copy of a deck, or null when there is none. */
async function fetchLive(i) {
  const { base, headers } = remote();
  const res = await fetch(`${base}?id=${encodeURIComponent(i)}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) fail(`could not read the live copy of ${i}: ${res.status}`);
  return res.json();
}
/** Every live deck id. */
async function liveIds() {
  const { base, headers } = remote();
  const res = await fetch(base, { headers });
  if (!res.ok) fail(`could not list the live decks: ${res.status}`);
  return Object.keys((await res.json()).index.decks);
}
const stripStamp = (d) => { const { updatedAt: _t, ...rest } = d; return JSON.stringify(rest); };
/** Writes the live copy into the repo as its snapshot, unless the file holds edits that were never pushed (it differs from the version it was pulled at). */
function writeSnapshot(deck) {
  const f = file(deck.id), b = baseFile(deck.id);
  if (existsSync(f) && existsSync(b) && stripStamp(JSON.parse(readFileSync(f, "utf8"))) !== stripStamp(JSON.parse(readFileSync(b, "utf8")))) return "kept (has unpushed edits: push or discard them first)";
  const { updatedAt: _t, ...snapshot } = deck;
  mkdirSync("src/decks/data", { recursive: true });
  const text = JSON.stringify(snapshot, null, 1) + "\n";
  if (existsSync(f) && readFileSync(f, "utf8") === text) return "already up to date";
  writeFileSync(f, text);
  return "written";
}

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
const layoutCheck = (deckId, deckFile) => withServer((url) => runScript("scripts/deckLayoutSmoke.mjs", [deckId], url, { DECK_FILE: deckFile ?? file(deckId) }));   // the app does not bundle decks: the page is served this file

if (cmd === "list") {
  const { base, headers } = remote();
  const { index } = await (await fetch(base, { headers })).json();
  for (const [i, e] of Object.entries(index.decks)) console.log(`${i}\t${e.slides} slides\t${e.updatedAt}\t${e.updatedBy}`);
} else if (cmd === "pull" && id) {
  const { base, headers } = remote();
  const res = await fetch(`${base}?id=${encodeURIComponent(id)}`, { headers });
  if (!res.ok) fail(`pull ${id}: ${res.status}`);
  const deck = await res.json();
  mkdirSync(".deck-base", { recursive: true });
  writeFileSync(baseFile(id), JSON.stringify(deck));
  delete deck.updatedAt; // the snapshot has no timestamp: push stamps one
  mkdirSync("src/decks/data", { recursive: true });
  writeFileSync(file(id), JSON.stringify(deck, null, 1) + "\n");
  console.log(`pulled ${id}: ${deck.slides.length} slides`);
} else if (cmd === "push" && id) {
  const { base, headers } = remote();
  const deck = JSON.parse(readFileSync(file(id), "utf8"));
  deck.updatedAt = new Date().toISOString();
  // an older deployment of the service replaces the whole deck and ignores the base: never push to one of those
  const probe = await fetch(base, { headers });
  if (probe.headers.get("x-deck-merge") !== "1" && !flags.has("--replace-whole")) fail(`push ${id}: the shared service does not merge saves yet (this branch is not deployed there). Pushing now would overwrite the whole deck. Use DECKS_URL=<a deployment of this branch>/api/decks, or --replace-whole if you really mean to replace it.`);
  const ancestor = existsSync(baseFile(id)) ? JSON.parse(readFileSync(baseFile(id), "utf8")) : null;
  if (!ancestor && !flags.has("--replace-whole")) fail(`push ${id}: no base. Pull first (that records the version this change starts from, so the push can be merged into anything saved since). --replace-whole sends the file as the whole deck instead, overwriting the shared copy.`);
  const res = await fetch(base, { method: "POST", headers, body: JSON.stringify({ deck, ...(ancestor ? { base: ancestor } : {}), by: "Claude" }) });
  if (!res.ok) fail(`push ${id}: ${res.status} ${await res.text()}`);
  const out = await res.json();
  const final = out.merged && out.deck ? out.deck : deck;
  mkdirSync(".deck-base", { recursive: true });
  writeFileSync(baseFile(id), JSON.stringify(final));
  if (out.merged && out.deck) {                                   // someone else's changes were in the shared copy: take the merged deck as the file
    const { updatedAt: _t, ...snapshot } = out.deck;
    writeFileSync(file(id), JSON.stringify(snapshot, null, 1) + "\n");
  }
  console.log(`pushed ${id}: ${final.slides.length} slides${out.merged ? ` (merged with changes saved since the pull; ${out.conflicts?.length ? `${out.conflicts.length} clash${out.conflicts.length > 1 ? "es" : ""} resolved in Harry's favour: ${out.conflicts.slice(0, 8).join(", ")}` : "no clashes"})` : ""}`);
  skewWarning();
} else if ((cmd === "publish" || cmd === "unpublish") && id) {
  const { base, headers } = remote();
  let live = null;
  if (cmd === "publish" && !flags.has("--file")) { live = await fetchLive(id); if (!live) fail(`publish ${id}: there is no live copy of it. Push it first, or use --file to publish ${file(id)}`); }
  const body = cmd === "publish" ? { publish: { ...(live ?? JSON.parse(readFileSync(file(id), "utf8"))), updatedAt: new Date().toISOString() }, by: "Claude" } : { unpublish: id, by: "Claude" };
  const res = await fetch(base, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) fail(`${cmd} ${id}: ${res.status} ${await res.text()}`);
  console.log(`${cmd === "publish" ? "published" : "unpublished"} ${id}${live ? " (the live copy)" : ""}`);
  if (live) console.log(`repo snapshot: ${writeSnapshot(live)} (${file(id)}); commit it so git keeps what was published`);
} else if (cmd === "backup") {
  const ids = !id || id === "all" ? await liveIds() : [id];
  const counts = {};
  for (const i of ids) {
    const deck = await fetchLive(i);
    if (!deck) { console.log(`${i}: no live copy`); continue; }
    const r = writeSnapshot(deck);
    counts[r.split(" ")[0]] = (counts[r.split(" ")[0]] ?? 0) + 1;
    if (r !== "already up to date") console.log(`${i}: ${r}`);
  }
  console.log(`backup: ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(", ") || "nothing to do"}. Commit src/decks/data to keep the snapshot in git.`);
} else if (cmd === "build" && id) {
  const script = path.resolve(id);
  if (!existsSync(script)) fail(`build: ${script} not found`);
  const problems = await withVite(async (load) => {
    const make = (await load(script)).default;
    const input = typeof make === "function" ? await make() : make;
    const { buildDeck } = await load("/src/decks/builder.ts");
    const { checkDeckContent } = await load("/src/decks/deckChecks.ts");
    const deck = await buildDeck(input);
    const report = await checkDeckContent(deck);
    // a question that asks about a number a slide already works through is a failure when BUILDING a deck (it is only a warning for an older one); --allow-repeats overrides
    const AGAIN = "already shows or works through";
    if (!flags.has("--allow-repeats")) { const again = report.warnings.filter((w) => w.includes(AGAIN)); report.warnings = report.warnings.filter((w) => !again.includes(w)); report.problems.push(...again.map((w) => `${w} (fresh numbers: a worked example is not asked again; --allow-repeats to build anyway)`)); }
    const count = print(`${deck.id} (${deck.slides.length} slides)`, report);
    if (count) return count;
    const outArg = args.indexOf("--out") >= 0 ? args[args.indexOf("--out") + 1] : null;
    if (outArg) {                                                       // a look card or a trial: write the deck there and leave the repo alone
      const { stampBuilt } = await load("/src/decks/merge.ts");
      mkdirSync(path.dirname(path.resolve(outArg)), { recursive: true });
      writeFileSync(outArg, JSON.stringify(stampBuilt(deck), null, 1) + "\n");
      console.log(`wrote ${outArg} (not the repo)`);
      return 0;
    }
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
  const live = flags.has("--live");
  const ids = id === "all" ? (live ? await liveIds() : readdirSync("src/decks/data").filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))) : [id];
  const decks = {};
  for (const i of ids) {
    if (live) { decks[i] = await fetchLive(i); if (!decks[i]) fail(`check: no live copy of ${i}`); }
    else { if (!existsSync(file(i))) fail(`check: ${file(i)} not found`); decks[i] = JSON.parse(readFileSync(file(i), "utf8")); }
  }
  let bad = 0;
  await withVite(async (load) => {
    const { checkDeckContent } = await load("/src/decks/deckChecks.ts");
    for (const i of ids) bad += print(live ? `${i} (live)` : i, await checkDeckContent(decks[i]));
  });
  if (flags.has("--layout")) for (const i of ids) {
    let f;
    if (live) { mkdirSync(".deck-work", { recursive: true }); f = `.deck-work/${i}.live.json`; writeFileSync(f, JSON.stringify(decks[i])); }     // the layout check draws this copy, not the repo's
    bad += (await layoutCheck(i, f)) ? 1 : 0;
  }
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
    await serveDeck(page, id, JSON.parse(readFileSync(process.env.DECK_FILE ?? file(id), "utf8")));
    const shots = [];
    const slideData = JSON.parse(readFileSync(process.env.DECK_FILE ?? file(id), "utf8")).slides;
    for (const n of slides) {
      await page.goto(`${url}/decks/${id}?s=${n}`);
      await page.waitForFunction(() => [...document.querySelectorAll("div")].some((d) => d.style.width === "1600px" && d.style.height === "900px"), null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(900);
      const steps = Math.max(0, ...(slideData[n - 1]?.els ?? []).map((e) => e.step ?? 0));       // every click revealed, as the class sees it at the end of the slide
      for (let i = 0; i < steps; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(220); }
      await page.waitForTimeout(300);
      shots.push((await page.screenshot()).toString("base64"));
    }
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
    console.log("-- layout"); n += (await runScript("scripts/deckLayoutSmoke.mjs", [id], url, { DECK_FILE: file(id) })) ? 1 : 0;
    if (pinned) { console.log("-- printed worksheets (one page each)"); n += (await runScript("scripts/deckPrintSmoke.mjs", [id], url, { DECK_FILE: file(id) })) ? 1 : 0; }
    if (hasDepth) { console.log("-- Depth cards"); n += (await runScript("scripts/depthSlideAudit.mjs", [], url, { DEPTH_DECK: id })) ? 1 : 0; }
    return n;
  });
  console.log(bad ? `verify ${id}: ${bad} part${bad > 1 ? "s" : ""} need attention` : `verify ${id}: everything passes`);
  console.log(`Now LOOK at it: npm run deck -- review ${id}   (checks cannot tell you whether it looks right)`);
  skewWarning();
  process.exit(bad ? 1 : 0);
} else if (cmd === "categories" || (cmd === "file" && id)) {
  const { base, headers } = remote();
  const asJson = async (res, what) => { if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) fail(`${what}: ${res.status}. Categories are on the deployment that has this branch's api/decks.ts: use DECKS_URL=<that deployment>/api/decks until it is merged`); return res.json(); };
  const read = async () => asJson(await fetch(`${base}?categories=all`, { headers }), "categories");
  const send = async (op) => asJson(await fetch(base, { method: "POST", headers, body: JSON.stringify({ categories: op, by: "Claude" }) }), "categories");
  const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  /** "Number" or "Number > Factors & multiples" to a category id. */
  const find = (data, text) => {
    const [a, b] = text.split(">").map((x) => x.trim());
    const strand = data.categories.find((c) => c.parent === null && same(c.name, a));
    const hit = b === undefined ? strand : data.categories.find((c) => strand && c.parent === strand.id && same(c.name, b));
    if (!hit) fail(`no category called "${text}". Categories: ${data.categories.filter((c) => c.parent === null).map((c) => c.name).join(", ")}`);
    return hit.id;
  };
  const pos = args.filter((a) => !a.startsWith("--"));
  if (cmd === "file") {
    const where = pos[2];
    if (!where) fail('usage: npm run deck -- file <deck-id> "<Strand>" | "<Strand> > <Topic>" | none');
    const data = await read();
    const result = await send({ op: "file", deckId: id, categoryId: where === "none" ? null : find(data, where) });
    console.log(`${id}: ${where === "none" ? "not filed" : `filed under ${where}`} (${Object.keys(result.filing).length} decks filed)`);
  } else if (id === "add") {
    const name = pos[2];
    if (!name) fail('usage: npm run deck -- categories add "<name>" [--under "<strand>"]');
    const data = await read();
    const under = args.indexOf("--under") >= 0 ? args[args.indexOf("--under") + 1] : null;
    await send({ op: "add", name, parent: under ? find(data, under) : null });
    console.log(`added ${under ? `${under} > ` : ""}${name}`);
  } else {
    const data = await read();
    const index = await asJson(await fetch(base, { headers }), "decks");
    const ids = Object.keys(index.index?.decks ?? {});
    const kids = (id2) => data.categories.filter((c) => c.parent === id2).sort((a, b) => a.position - b.position);
    const decksIn = (cid) => ids.filter((d) => data.filing[d] === cid);
    for (const st of kids(null)) {
      console.log(`${st.name}${decksIn(st.id).length ? `: ${decksIn(st.id).join(", ")}` : ""}`);
      for (const t of kids(st.id)) console.log(`  ${t.name}${decksIn(t.id).length ? `: ${decksIn(t.id).join(", ")}` : ""}`);
    }
    const loose = ids.filter((d) => !data.filing[d]);
    console.log(`Not filed: ${loose.length ? loose.join(", ") : "(none)"}`);
  }
} else if (cmd === "review" && id) {
  const deckFile = args.indexOf("--file") >= 0 ? args[args.indexOf("--file") + 1] : file(id);
  if (!existsSync(deckFile)) fail(`review: ${deckFile} not found`);
  const outDir = args.indexOf("--out") >= 0 ? args[args.indexOf("--out") + 1] : undefined;
  const code = await withServer((url) => runScript("scripts/deckReview.mjs", [id], url, { DECK_FILE: deckFile, REVIEW_KINDS: flags.has("--kinds") ? "1" : "", ...(outDir ? { REVIEW_OUT: outDir } : {}) }));
  skewWarning();
  process.exit(code ? 1 : 0);
} else if (cmd === "looks" && id) {
  // the look card: build the script into a temp file (so the repo is untouched), then one slide of each kind in every state
  const tmp = `.deck-work/looks-${path.basename(id).replace(/\W+/g, "-")}.json`;
  mkdirSync(".deck-work", { recursive: true });
  const built = spawnSync("node", ["scripts/deck.mjs", "build", id, "--out", tmp, ...(flags.has("--allow-repeats") ? ["--allow-repeats"] : [])], { stdio: "inherit" });
  if (built.status) fail("looks: the script did not build, fix that first");
  const deckId = JSON.parse(readFileSync(tmp, "utf8")).id;
  const outDir = args.indexOf("--out") >= 0 ? args[args.indexOf("--out") + 1] : undefined;
  const code = await withServer((url) => runScript("scripts/deckReview.mjs", [deckId], url, { DECK_FILE: tmp, REVIEW_KINDS: "1", ...(outDir ? { REVIEW_OUT: outDir } : {}) }));
  console.log("Show Harry these sheets and get a yes on them BEFORE building the rest of the deck.");
  skewWarning();
  process.exit(code ? 1 : 0);
} else fail("usage: npm run deck -- list | pull <id> | push <id> | publish <id> | unpublish <id> | backup [<id>|all] | build <script> [--replace] | check <id|all> [--live] [--layout] | preflight <tool-id> | verify <id> | diff <id> | builders | sheet <id> <slides> | categories | file <id> <category> | looks <script> | review <id> [--kinds] | new <id> <tool-id>");
