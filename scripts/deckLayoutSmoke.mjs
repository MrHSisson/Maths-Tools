// Local browser test: finds slide text that spills out of its box, runs off the slide or overlaps other text. The same rules as the editor's
// layout warnings (src/decks/layoutAudit.ts): keep the two in step. It goes further than the editor: it also measures every question of a
// question set, the view that opens beside the working ("Show working") and the answers of a book-work grid, because a slide that fits
// at rest can overflow once the working opens; and it WARNS (does not fail) when a short word or number is left alone on the last
// line of a wrapped text (a number dropped onto its own line is hard to read).
//   npm run dev, then: npm run smoke:deck-layout -- <deck id>   (default: estimation; draws the deck in src/decks/data, or DECK_FILE)
// Measures the real text of every slide of a deck at 1366×768 (slides scale as one, so one size is enough).
import { createRequire } from "node:module";
import { loadDeck, serveDeck } from "./deckPage.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const id = process.argv[2] ?? "estimation";
const deck = loadDeck(id);
const slides = deck.slides;
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });

const measure = () => {
  const canvas = [...document.querySelectorAll("div")].find((d) => d.style.width === "1600px" && d.style.height === "900px");
  if (!canvas) return null;
  const cr = canvas.getBoundingClientRect(), k = cr.width / 1600;
  const toUnits = (r) => ({ l: (r.left - cr.left) / k, t: (r.top - cr.top) / k, r: (r.right - cr.left) / k, b: (r.bottom - cr.top) / k });
  // the lines a text element is drawn on: each character of plain text and each maths expression is a token placed by its middle
  const linesOf = (wrap) => {
    const tokens = [];
    const walk = (node) => {
      if (node.nodeType === 3) {
        const t = node.textContent;
        for (let i = 0; i < t.length; i++) {
          if (!t[i].trim()) continue;
          const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
          const b = range.getBoundingClientRect();
          if (b.width >= 0.5) tokens.push({ mid: b.top + b.height / 2, h: b.height, left: b.left, text: t[i] });
        }
        return;
      }
      if (node.nodeType !== 1) return;
      if (getComputedStyle(node).visibility === "hidden") return;      // the hidden copy the auto-fit measures with
      if (node.classList.contains("katex")) {
        const b = node.getBoundingClientRect();
        tokens.push({ mid: b.top + b.height / 2, h: b.height, left: b.left, text: (node.querySelector(".katex-html")?.textContent ?? "").replace(/[​\s]/g, "") });
        return;
      }
      for (const c of node.childNodes) walk(c);
    };
    walk(wrap);
    tokens.sort((a, b) => a.mid - b.mid || a.left - b.left);
    const lines = [];
    for (const tk of tokens) {
      const last = lines[lines.length - 1];
      if (last && tk.mid - last.mid < Math.max(tk.h, last.h) * 0.5) { last.tokens.push(tk); last.mid = (last.mid + tk.mid) / 2; last.h = Math.max(last.h, tk.h); } else lines.push({ mid: tk.mid, h: tk.h, tokens: [tk] });
    }
    return lines.map((l) => l.tokens.sort((a, b) => a.left - b.left).map((x) => x.text).join(""));
  };
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
    return { box, text, name: (wrap.innerText || "").replace(/\s+/g, " ").slice(0, 40), lines: linesOf(wrap) };
  });
};

const problems = [], warnings = [];
/** The same tests at every state: spills, runs off the slide, overlaps (failures); a short last line (a warning). */
const judge = (els, at) => {
  if (process.env.DEBUG_LINES) console.log(`${at}: ${JSON.stringify(els.map((e) => e.lines))}`);   // how each text breaks into lines
  for (const e of els) {
    if (!e.text) continue;
    if (e.text.b > e.box.b + 8) problems.push(`${at}: "${e.name}" spills ${Math.round(e.text.b - e.box.b)} below its box`);
    if (e.text.r > 1601 || e.text.b > 901 || e.text.l < -1 || e.text.t < -1) problems.push(`${at}: "${e.name}" runs off the slide`);
    const l = e.lines ?? [];
    if (l.length > 1 && l[l.length - 1].length <= 4 && l[l.length - 2].length > 8) warnings.push(`${at}: "${e.name}" leaves "${l[l.length - 1]}" alone on its last line`);
  }
  for (let a = 0; a < els.length; a++) for (let b = a + 1; b < els.length; b++) {
    if (!els[a].text || !els[b].text) continue;           // only text against text: a shape or line behind text is deliberate
    const A = els[a].text, B = els[b].text;
    const dx = Math.min(A.r, B.r) - Math.max(A.l, B.l), dy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
    if (dx > 4 && dy > 4) problems.push(`${at}: "${els[a].name}" overlaps "${els[b].name}" (${Math.round(dx)}×${Math.round(dy)})`);
  }
};
const press = async (page, name) => { const b = page.getByRole("button", { name }); if (await b.count()) { await b.first().click(); return true; } return false; };

try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => localStorage.setItem("mt-dev-mode", "1")); // the working copy needs Developing-tools mode
  await serveDeck(page, id, deck);
  for (let s = 1; s <= slides.length; s++) {
    await page.goto(`${base}/decks/${id}?s=${s}`);
    await page.waitForFunction(() => [...document.querySelectorAll("div")].some((d) => d.style.width === "1600px" && d.style.height === "900px"), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);
    const els = await page.evaluate(measure);
    const at = `slide ${s} (${slides[s - 1].id})`;
    if (!els) { problems.push(`${at}: did not render`); continue; }
    judge(els, at);
    // every question of a question set, each with the working open (the question moves beside it and can overflow there)
    const items = slides[s - 1].els.find((e) => e.kind === "questions")?.items?.length ?? 0;
    for (let q = 0; q < items; q++) {
      if (q > 0) { if (!(await press(page, /next question/i))) break; await page.waitForTimeout(500); judge(await page.evaluate(measure), `${at}, question ${q + 1}`); }
      if (await press(page, /show working/i)) { await page.waitForTimeout(1000); judge(await page.evaluate(measure), `${at}, question ${q + 1} with the working open`); }
    }
    // a grid or book activity with its answers shown (a long answer can overflow its cell)
    if (slides[s - 1].els.some((e) => e.kind === "grid" || e.kind === "worksheet") && (await press(page, /show answers/i))) {
      await page.waitForTimeout(600); judge(await page.evaluate(measure), `${at}, answers shown`);
    }
  }
} finally { await browser.close(); }
for (const w of warnings) console.log(`warning: ${w}`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`ok ${slides.length} slides of ${id}: no text spills, runs off the slide or overlaps, at rest, with the working open and with the answers shown${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""}`);
