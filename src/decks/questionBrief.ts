import type { DeckDef, Slide } from "./types";

// The slide brief: one optional note per slide saying what its questions test (or the key skill), so Claude can write
// them or Harry can see what a planned slide is for. Older decks kept four teaching-note boxes and a brief form; those
// are folded into the one note when a deck opens in the editor.

/** The one-note brief for an older slide that still carries the four-part notes or the brief form. */
export function legacyBrief(s: Pick<Slide, "intent" | "questionBrief">): string {
  const parts = [s.intent?.purpose, s.intent?.questionFocus, s.questionBrief?.exclude && `Avoid: ${s.questionBrief.exclude}`, s.questionBrief?.progression];
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" ");
}

/** Folds older notes into `brief` and drops them, so the editor (and anything it saves) only knows the one note. */
export function withBriefs(deck: DeckDef): DeckDef {
  if (!deck.slides.some((s) => s.intent || s.questionBrief)) return deck;
  return { ...deck, slides: deck.slides.map((s) => {
    if (!s.intent && !s.questionBrief) return s;
    const { intent: _i, questionBrief: _q, ...rest } = s;
    const brief = s.brief?.trim() || legacyBrief(s);
    return brief ? { ...rest, brief } : rest;
  }) };
}

/** One slide's brief as text to paste into chat. */
export function briefText(context: { title: string; brief?: string }, identity: string, tool: string): string {
  return [`Slide: ${identity}`, `Title: ${context.title}`, `Brief: ${context.brief?.trim() || "Not written yet"}`,
    `Write the questions directly on this slide, each with an answer and worked steps that follow the ${tool} generator's method.`].join("\n");
}

/** Every written brief in the deck, in slide order, to paste into chat. */
export function deckBriefsText(deck: Pick<DeckDef, "title" | "slides">): string {
  const lines = deck.slides.map((s, i) => (s.brief?.trim() ? `${i + 1}. ${s.title.replace(/\$/g, "")}: ${s.brief.trim()}` : "")).filter(Boolean);
  return [`Deck: ${deck.title}`, ...(lines.length ? lines : ["No slide briefs written yet."])].join("\n");
}
