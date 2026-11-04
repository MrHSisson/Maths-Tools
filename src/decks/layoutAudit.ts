// Layout problems on the slide being edited, found by measuring the real drawn text (the same idea as `npm run smoke:deck-layout`, run in the
// editor). Only real text is judged: text that spills below its box, runs off the slide, or overlaps other text. A shape, line or picture
// that sits behind or around text is deliberate and never flagged.
import { CANVAS_H, CANVAS_W, type DeckElement } from "./types";

export interface LayoutIssue {
  /** The element to select (for an overlap, the first of the two). */
  id: string;
  /** The other element of an overlap. */
  other?: string;
  message: string;
}

interface Rect { l: number; t: number; r: number; b: number }
const SPILL = 8, OVERLAP = 4;                                       // slide units: how far counts as a problem

const nameOf = (el: DeckElement, text: string) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t ? `“${t.slice(0, 28)}${t.length > 28 ? "…" : ""}”` : el.kind;
};

/** `root` is the editor's canvas wrapper; `els` the slide's elements in the order the canvas draws them. */
export function auditLayout(root: HTMLElement, els: DeckElement[]): LayoutIssue[] {
  const page = root.querySelector<HTMLElement>("[data-slide-canvas] > div");
  if (!page) return [];
  const pr = page.getBoundingClientRect(), k = pr.width / CANVAS_W;
  if (!k) return [];
  const units = (r: DOMRect): Rect => ({ l: (r.left - pr.left) / k, t: (r.top - pr.top) / k, r: (r.right - pr.left) / k, b: (r.bottom - pr.top) / k });
  const wrappers = [...page.children].slice(1, 1 + els.length) as HTMLElement[];   // child 0 is the accent bar
  const measured = wrappers.map((wrap, i) => {
    const el = els[i];
    if (!el || el.kind === "ink") return null;
    const left = parseFloat(wrap.style.left), top = parseFloat(wrap.style.top);
    const box: Rect = { l: left, t: top, r: left + parseFloat(wrap.style.width), b: top + parseFloat(wrap.style.height) };
    let text: Rect | null = null;
    const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1) continue;
        const u = units(rect);
        text = text ? { l: Math.min(text.l, u.l), t: Math.min(text.t, u.t), r: Math.max(text.r, u.r), b: Math.max(text.b, u.b) } : u;
      }
    }
    return text ? { el, box, text, name: nameOf(el, wrap.innerText || "") } : null;
  });
  const items = measured.filter((m): m is NonNullable<typeof m> => !!m);
  const issues: LayoutIssue[] = [];
  for (const m of items) {
    if (m.text.b > m.box.b + SPILL) issues.push({ id: m.el.id, message: `${m.name} spills ${Math.round(m.text.b - m.box.b)} below its box` });
    if (m.text.r > CANVAS_W + 1 || m.text.b > CANVAS_H + 1 || m.text.l < -1 || m.text.t < -1) issues.push({ id: m.el.id, message: `${m.name} runs off the slide` });
  }
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
    const A = items[a].text, B = items[b].text;
    const dx = Math.min(A.r, B.r) - Math.max(A.l, B.l), dy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
    if (dx > OVERLAP && dy > OVERLAP) issues.push({ id: items[a].el.id, other: items[b].el.id, message: `${items[a].name} overlaps ${items[b].name}` });
  }
  return issues;
}
