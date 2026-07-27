// ─────────────────────────────────────────────────────────────────────────────
// MODE: STUDY (formerly Browse) — first-pass reading, recognition only.
// Self-contained: driven entirely by the `cards` prop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { CARD_SHADOW, boldText, BeyondBadge } from "../ui";
import { GlossaryText, SpecBadge } from "../context";
import { type FlashCard } from "../types";

export const StudyMode = ({ cards }: { cards: FlashCard[] }) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  useEffect(() => setRevealed(new Set()), [cards]);
  const toggle = (id: number) => setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShown = revealed.size === cards.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280" }}>{cards.length} cards</span>
        <button onClick={() => setRevealed(allShown ? new Set() : new Set(cards.map(c => c.id)))}
          style={{ minHeight: 44, padding: "0 18px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
          {allShown ? "Hide all" : "Reveal all"}
        </button>
      </div>
      {cards.map((card, idx) => (
        <div key={card.id} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${revealed.has(card.id) ? "#a7f3d0" : "#e5e7eb"}`, boxShadow: CARD_SHADOW, overflow: "hidden", cursor: "pointer" }}>
          <div onClick={() => toggle(card.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", minHeight: 44 }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#1e3a8a", color: "#fff", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>{idx + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0, fontSize: "0.95rem" }}>{card.q}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                <SpecBadge tag={card.specTag} />{card.beyondSpec && <BeyondBadge />}
              </div>
            </div>
          </div>
          {revealed.has(card.id) && (
            <div style={{ padding: "12px 16px 14px 54px", borderTop: "2px solid #a7f3d0", background: "#ecfdf5" }}>
              <GlossaryText text={card.a} terms={card.terms} style={{ color: "#065f46", fontWeight: 600, lineHeight: 1.7, fontSize: "0.9rem", display: "block" }} />
              {card.explain && (
                <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "#047857", lineHeight: 1.55, fontWeight: 500 }}>
                  <span style={{ fontWeight: 800 }}>Why: </span>{boldText(card.explain)}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
