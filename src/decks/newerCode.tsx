// A deck can be saved before the code that draws part of it is merged (the shared service keeps what it does not recognise: api/_decks.ts).
// A slide element this version of the site cannot draw shows a plain placeholder instead of failing or taking the slide down with it.
import { Component, type ReactNode } from "react";
import { classifyQuestion } from "../../api/_questions";
import type { DeckElement } from "./types";

const NEWER_CODE_MESSAGE = "This needs a newer version of the site; it will appear once its code is merged.";

const cache = new WeakMap<object, boolean>();
/** Does this element use something this version of the site cannot read (a question format or a shape it has not been taught)? */
export function needsNewerCode(el: DeckElement): boolean {
  let known = cache.get(el);
  if (known === undefined) {
    const e = el as unknown as { items?: unknown; authored?: unknown };
    known = (Array.isArray(e.items) && e.items.some((q) => classifyQuestion(q) !== "ok"))
      || (Array.isArray(e.authored) && e.authored.some((q) => classifyQuestion(q) !== "ok"));
    cache.set(el, known);
  }
  return known;
}

export function NewerCodePlaceholder({ detail }: { detail?: string }) {
  return (
    <div role="note" data-newer-code="" style={{ width: "100%", height: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, border: "2px dashed #94a3b8", borderRadius: 16, background: "#f8fafc", color: "#475569", fontSize: 28, lineHeight: 1.3 }}>
      <div>{NEWER_CODE_MESSAGE}{detail ? <div style={{ marginTop: 8, fontSize: 18, opacity: 0.8 }}>{detail}</div> : null}</div>
    </div>
  );
}

/** One element that throws while drawing shows the placeholder; the rest of the slide, and the deck, carry on. */
export class ElementBoundary extends Component<{ children: ReactNode; resetKey?: unknown }, { failed: string | null }> {
  state = { failed: null as string | null };
  static getDerivedStateFromError(e: unknown) { return { failed: e instanceof Error ? e.message : "could not be drawn" }; }
  componentDidUpdate(prev: { resetKey?: unknown }) { if (this.state.failed !== null && prev.resetKey !== this.props.resetKey) this.setState({ failed: null }); }
  render() { return this.state.failed === null ? this.props.children : <NewerCodePlaceholder detail={this.state.failed} />; }
}
