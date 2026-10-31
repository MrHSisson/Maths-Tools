// Local browser test: every worksheet pinned to a deck prints on ONE page (questions, and the answer sheet).
//   npm run dev, then: npm run smoke:deck-print -- <deck id>
// Opens the deck, presses Print sheet / Answer sheet on each pinned worksheet slide, takes the HTML the print window would get
// (KaTeX read from node_modules, since a sandbox has no CDN), renders it to PDF at its own page size and counts the pages.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const id = process.argv[2] ?? "manipulating-ratios";
const slides = JSON.parse(fs.readFileSync(`src/decks/data/${id}.json`, "utf8")).slides;
const pinned = slides.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s.els.some((e) => e.kind === "worksheet" && e.pin));
const katex = `file://${process.cwd()}/node_modules/katex/dist/`;
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
let bad = 0;
for (const { s, n } of pinned) for (const button of ["Print sheet", "Answer sheet"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { localStorage.setItem("mt-dev-mode", "1"); window.__cap = []; window.open = () => ({ document: { write: (h) => window.__cap.push(h), close() {} }, print() {}, focus() {} }); });
  await page.goto(`${base}/decks/${id}?s=${n}`);
  await page.getByRole("button", { name: button }).first().click();
  await page.waitForTimeout(1500);
  const html = (await page.evaluate(() => window.__cap.join(""))).replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/katex@[\d.]+\/dist\//g, katex);
  const file = `/tmp/deck-print-${id}-${n}.html`;
  fs.writeFileSync(file, html);
  const q = await browser.newPage();
  await q.goto(`file://${file}`);
  await q.waitForTimeout(2000);
  const pdf = await q.pdf({ preferCSSPageSize: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`${pages === 1 ? "ok " : "BAD"} slide ${n} (${s.id}) ${button}: ${pages} page${pages === 1 ? "" : "s"}`);
  if (pages !== 1) bad++;
  await page.close(); await q.close();
}
await browser.close();
if (bad) { console.error(`${bad} print${bad > 1 ? "s" : ""} spill onto more than one page`); process.exit(1); }
