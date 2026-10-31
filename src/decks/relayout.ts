// Change a slide's layout without losing what is on it, and keep your own slides as templates. A new layout's pieces take over the
// content of the old slide's matching pieces (the first text for the first text, the questions for the questions, the picture for the
// picture), in the new layout's places and sizes. Anything on the old slide with nothing to take its place stays where it was, so no
// content is lost: delete it, or move it, afterwards.
import type { DeckElement, Slide } from "./types";

const POSITION = new Set(["id", "x", "y", "w", "h", "size", "fixed", "step"]);
const DECORATION = new Set(["line", "shape"]);
const hasContent = (e: DeckElement) => !DECORATION.has(e.kind) && !(e.kind === "text" && !e.text.trim());

export function applyLayout(old: Slide, layout: Slide): Slide {
  const free = old.els.filter(hasContent);
  const used = new Set<string>();
  const els = layout.els.map((le, i): DeckElement => {
    const base = { ...le, id: `${old.id}-L${i + 1}` } as DeckElement;
    if (DECORATION.has(le.kind)) return base;
    const from = free.find((o) => o.kind === le.kind && !used.has(o.id));
    if (!from) return base;
    used.add(from.id);
    const carried = Object.fromEntries(Object.entries(from).filter(([k]) => !POSITION.has(k)));
    return { ...base, ...carried, id: base.id } as DeckElement;
  });
  const left = old.els.filter((e) => hasContent(e) && !used.has(e.id));
  return { ...old, family: layout.family, els: [...els, ...left] };
}

// ── Templates: slides kept on this device ─────────────────────────────────────────────────────────────────────────────────────────────
const KEY = "mt-deck-templates";
export interface SlideTemplate { name: string; slide: Slide }
export const loadTemplates = (): SlideTemplate[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SlideTemplate[]; } catch { return []; } };
export function saveTemplate(name: string, slide: Slide): boolean {
  const all = [...loadTemplates().filter((t) => t.name !== name), { name, slide: structuredClone(slide) }];
  try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch { return false; }
}
export function removeTemplate(name: string): void {
  try { localStorage.setItem(KEY, JSON.stringify(loadTemplates().filter((t) => t.name !== name))); } catch { /* storage unavailable */ }
}
