// Local browser test: finds slide text that spills out of its box, runs off the slide or overlaps another element.
//   npm run dev, then: npm run smoke:deck-layout -- <deck id>   (default: estimation; reads the deck in src/decks/data)
// Measures the real text on every slide of a deck at 1366×768 (slides scale as one, so one size is enough).
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const id = process.argv[2] ?? "estimation";
const slides = JSON.parse(fs.readFileSync(`src/decks/data/${id}.json`, "utf8")).slides;
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });

const measure = () => {
  const canvas = [...document.querySelectorAll("div")].find((d) => d.style.width === "1600px" && d.style.height === "900px");
  if (!canvas) return null;
  const cr = canvas.getBoundingClientRect(), k = cr.width / 1600;
  const toUnits = (r) => ({ l: (r.left - cr.left) / k, t: (r.top - cr.top) / k, r: (r.right - cr.left) / k, b: (r.bottom - cr.top) / k });
  return [...canvas.children].slice(1).map((wrap) => {
    const left = parseFloat(wrap.style.left), top = parseFloat(wrap.style.top);
    const box = { l: left, t: top, r: left + parseFloat(wrap.style.width), b: top + parseFloat(wrap.style.height) };
    const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
    let text = null;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1) continue;
        const u = toUnits(rect);
        text = text ? { l: Math.min(text.l, u.l), t: Math.min(text.t, u.t), r: Math.max(text.r, u.r), b: Math.max(text.b, u.b) } : u;
      }
    }
    return { box, text, name: (wrap.innerText || "").replace(/\s+/g, " ").slice(0, 40) };
  });
};

const problems = [];
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => localStorage.setItem("mt-dev-mode", "1")); // the working copy needs Developing-tools mode
  await page.route("**/api/decks*", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  for (let s = 1; s <= slides.length; s++) {
    await page.goto(`${base}/decks/${id}?s=${s}`);
    await page.waitForFunction(() => [...document.querySelectorAll("div")].some((d) => d.style.width === "1600px" && d.style.height === "900px"), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);
    const els = await page.evaluate(measure);
    if (!els) { problems.push(`slide ${s} (${slides[s - 1].id}): did not render`); continue; }
    const at = `slide ${s} (${slides[s - 1].id})`;
    for (const e of els) {
      if (!e.text) continue;
      if (e.text.b > e.box.b + 8) problems.push(`${at}: "${e.name}" spills ${Math.round(e.text.b - e.box.b)} below its box`);
      if (e.text.r > 1600 || e.text.b > 900) problems.push(`${at}: "${e.name}" runs off the slide`);
    }
    for (let a = 0; a < els.length; a++) for (let b = a + 1; b < els.length; b++) {
      if (!els[a].text && !els[b].text) continue;
      const A = els[a].text ?? els[a].box, B = els[b].text ?? els[b].box;
      const dx = Math.min(A.r, B.r) - Math.max(A.l, B.l), dy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
      if (dx > 4 && dy > 4) problems.push(`${at}: "${els[a].name}" overlaps "${els[b].name}" (${Math.round(dx)}×${Math.round(dy)})`);
    }
  }
} finally { await browser.close(); }
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`ok ${slides.length} slides of ${id}: no text spills, runs off the slide or overlaps`);
