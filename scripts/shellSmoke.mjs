// Opens every screen of the shell in a real browser and fails if any part reports a fault.
//
//   npm run smoke:shell               starts the dev server itself (needs Playwright and a Chromium: it is not a project dependency)
//   SMOKE_URL=http://localhost:5173 npm run smoke:shell   uses a server that is already running
//   SMOKE_TOOLS=/rounding,/surds npm run smoke:shell      checks only these tool routes
//
// For each representative tool it visits Whiteboard, Worked Example, Worksheet (standard, differentiated, fullscreen) and Depth at laptop
// size, then the phone and tablet layouts. A failure names the screen, the tool and the setup (the shell records it in `window.__mtFaults`).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { console.error("Playwright is not installed. Install it (and a Chromium) to run the shell smoke check."); process.exit(2); }

const PORT = 5188;
const base = process.env.SMOKE_URL ?? `http://localhost:${PORT}`;
let server;
if (!process.env.SMOKE_URL) {
  server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ } await new Promise(r => setTimeout(r, 500)); }
}

const TOOLS = (process.env.SMOKE_TOOLS ?? "/order-of-operations,/rounding,/angles-in-triangles").split(",");   // default: text, scaffold + number line, diagram
const LAPTOP = [
  ["whiteboard", ""], ["worked example", "?mode=example"], ["worksheet", "?mode=worksheet&n=6"],
  ["differentiated worksheet", "?mode=worksheet&diff=1&n=4"], ["depth", "?mode=depth"],
];
const failures = [];

async function visit(browser, viewport, label, url, extra) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message));
  try {
    await page.goto(base + url, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    if (extra) await extra(page);
    const faults = await page.evaluate(() => (window.__mtFaults ?? []).map(f => `${f.part}: ${f.message} ${JSON.stringify(f.context)}`));
    const boundary = await page.$$eval("[data-shell-fault]", els => els.map(e => e.getAttribute("data-shell-fault")));
    if (faults.length || boundary.length || pageErrors.length) failures.push({ label, url, faults, boundary, pageErrors });
    else console.log(`ok   ${label}  ${url}`);
  } catch (e) { failures.push({ label, url, faults: [String(e.message).split("\n")[0]], boundary: [], pageErrors }); }
  await page.close();
}

const browser = await chromium.launch();
for (const tool of TOOLS) {
  for (const [name, qs] of LAPTOP) await visit(browser, { width: 1366, height: 768 }, `laptop ${name}`, tool + qs);
  await visit(browser, { width: 1366, height: 768 }, "laptop worksheet fullscreen", `${tool}?mode=worksheet&n=6`, async p => {
    const b = p.locator('button[title="Fullscreen"]'); if (await b.count()) { await b.first().click(); await p.waitForTimeout(1500); }
  });
  await visit(browser, { width: 390, height: 800 }, "phone start screens", tool);
  await visit(browser, { width: 1024, height: 768 }, "tablet", `${tool}?mode=example`);
}
await browser.close();
server?.kill();

if (failures.length) {
  console.error(`\n${failures.length} screen(s) reported a fault:`);
  for (const f of failures) console.error(`FAIL ${f.label}  ${f.url}\n   faults: ${f.faults.join(" | ") || "-"}\n   screens: ${f.boundary.join(", ") || "-"}\n   page errors: ${f.pageErrors.join(" | ") || "-"}`);
  process.exit(1);
}
console.log("\nEvery screen drew without a fault.");
