// Local browser audit: every Depth item in every tool's bank, drawn as a deck slide, in both beats (question, then answer).
//   npm run dev, then: SMOKE_URL=http://127.0.0.1:5173 node scripts/depthSlideAudit.mjs
// Reports page errors, an item that overflows its slide, and how far the slide had to shrink its text to fit (the scale, and the
// size in slide units the options end up at). Writes the full table to /tmp/depth-audit.json.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => localStorage.setItem("mt-dev-mode", "1"));
await page.goto(`${base}/decks`);
// every Depth item, from the banks the site itself loads
const toolIds = JSON.parse(fs.readFileSync("src/generated/toolFacts.json", "utf8")).tools.filter((x) => x.depth && x.shell === "ToolShell").map((x) => x.id);
const items = await page.evaluate(async (ids) => {
  const { loadDepthItems } = await import("/src/decks/generators.ts");
  const out = [];
  for (const t of ids) for (const i of await loadDepthItems(t)) out.push({ tool: t, id: i.id });
  return out;
}, toolIds);
console.log(`${items.length} Depth items in ${new Set(items.map((i) => i.tool)).size} tools`);
const deck = {
  id: "depth-audit", title: "Depth audit", summary: "", slides: items.map((it, n) => ({ id: `a${n}`, family: "depth", title: it.id, els: [{ id: `a${n}-e`, kind: "depth", x: 24, y: 24, w: 1552, h: 852, tool: it.tool, item: it.id }] })),
};
await page.evaluate((d) => localStorage.setItem("mt-deck:depth-audit", JSON.stringify(d)), deck);
const rows = [];
for (const [n, it] of items.entries()) {
  await page.goto(`${base}/decks/depth-audit?s=${n + 1}`);
  await page.waitForSelector("[data-fit-outer]", { timeout: 15000 }).catch(() => undefined);
  const beats = [];
  for (const beat of ["question", "answer"]) {
    if (beat === "answer") { await page.keyboard.press("ArrowRight"); }
    await page.waitForTimeout(350);
    beats.push(await page.evaluate(() => {
      const outer = document.querySelector("[data-fit-outer]"), inner = document.querySelector("[data-fit-inner]");
      if (!outer || !inner) return { missing: true };
      const m = /scale\(([\d.]+)\)/.exec(inner.style.transform ?? "");
      const scale = m ? Number(m[1]) : 1;
      const spill = inner.getBoundingClientRect().height > outer.getBoundingClientRect().height + 2;
      const alert = !!document.querySelector("[role=alert]");
      return { scale, spill, alert };
    }));
  }
  rows.push({ ...it, beats });
}
fs.writeFileSync("/tmp/depth-audit.json", JSON.stringify(rows, null, 1));
const bad = rows.filter((r) => r.beats.some((b) => b.missing || b.alert || b.spill || b.scale < 0.45));
const worst = [...rows].sort((a, b) => Math.min(...a.beats.map((x) => x.scale ?? 1)) - Math.min(...b.beats.map((x) => x.scale ?? 1))).slice(0, 12);
console.log("smallest scales:", worst.map((r) => `${r.id} ${Math.min(...r.beats.map((x) => x.scale ?? 1)).toFixed(2)}`).join(", "));
console.log(`${bad.length} to look at`);
for (const r of bad) console.log(" ", r.tool, r.id, JSON.stringify(r.beats));
console.log(errors.length ? `PAGE ERRORS:\n${[...new Set(errors)].join("\n")}` : "no page errors");
await browser.close();
if (bad.length || errors.length) process.exit(1);
