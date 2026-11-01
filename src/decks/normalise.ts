// Depth cards in a deck are references to the tool's Depth bank (`{ kind: "depth", tool, item }`), drawn by the same slide the tool's
// Depth section uses. Older decks hold a Depth card as a copy of the question (a one-item question set whose item says it came from
// the bank): this turns each such copy back into a reference when a deck is read, so every deck shows the one design.
import type { DeckDef, DeckElement } from "./types";

export function normaliseDeck(deck: DeckDef): DeckDef {
  let changed = false;
  const slides = deck.slides.map((s) => {
    const els = s.els.map((el): DeckElement => {
      if (el.kind !== "questions" || el.items.length !== 1) return el;
      const src = el.items[0].source;
      if (src?.kind !== "depth" || src.edited) return el;   // a copy that was changed in the deck stays the deck's own
      changed = true;
      return { id: el.id, kind: "depth", x: el.x, y: el.y, w: el.w, h: el.h, ...(el.step ? { step: el.step } : {}), tool: src.tool, item: src.id };
    });
    return els.some((e, i) => e !== s.els[i]) ? { ...s, els } : s;
  });
  return changed ? { ...deck, slides } : deck;
}
