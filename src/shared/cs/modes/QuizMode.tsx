// ─────────────────────────────────────────────────────────────────────────────
// MODE: QUIZ (MCQ) — warm-up / confidence check, explicitly lower-rigor.
// Self-contained: `cards` supplies both the questions and the distractor pool.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { shuffleArr, CARD_SHADOW, boldText } from "../ui";
import { SpecBadge } from "../context";
import { type FlashCard } from "../types";

// Build four MCQ choices for a card. Prefer the card's own authored distractors;
// otherwise fall back to other cards' answers drawn from the visible `pool`.
const buildChoices = (card: FlashCard, pool: FlashCard[]): string[] => {
  if (card.distractors && card.distractors.length >= 3)
    return shuffleArr([card.a, ...card.distractors.slice(0, 3)]);
  const others = pool.map(c => c.a).filter(a => a !== card.a);
  return shuffleArr([card.a, ...shuffleArr(others).slice(0, 3)]);
};

interface QuizState { deck: FlashCard[]; index: number; score: number; selected: string | null; complete: boolean; choices: string[] }

export const QuizMode = ({ cards }: { cards: FlashCard[] }) => {
  const [st, setSt] = useState<QuizState>(() => {
    const d = shuffleArr(cards).slice(0, Math.min(10, cards.length));
    return { deck: d, index: 0, score: 0, selected: null, complete: false, choices: d[0] ? buildChoices(d[0], cards) : [] };
  });

  const start = useCallback(() => {
    const d = shuffleArr(cards).slice(0, Math.min(10, cards.length));
    setSt({ deck: d, index: 0, score: 0, selected: null, complete: false, choices: d[0] ? buildChoices(d[0], cards) : [] });
  }, [cards]);

  useEffect(() => { start(); }, [start]);

  const { deck, index, score, selected, complete, choices } = st;

  const select = (choice: string) =>
    setSt(s => s.selected !== null ? s : { ...s, selected: choice, score: choice === s.deck[s.index].a ? s.score + 1 : s.score });
  const nextQ = () => setSt(s => {
    const n = s.index + 1;
    if (n >= s.deck.length) return { ...s, complete: true };
    return { ...s, index: n, selected: null, choices: buildChoices(s.deck[n], cards) };
  });

  if (complete) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: 0 }}>Warm-up complete</p>
          <p style={{ fontSize: "3rem", fontWeight: 800, color: "#1e3a8a", margin: 0, lineHeight: 1 }}>{score}/{deck.length}</p>
          <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>{pct}% recognised</p>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5, margin: 0 }}>
              Recognising an answer is easier than recalling it. A high score here isn't exam-readiness — test yourself with <strong>Flashcards</strong> and <strong>Exam</strong> next.
            </p>
          </div>
          <button onClick={start} style={{ minHeight: 44, padding: "0 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: "100%" }}>Try again</button>
        </div>
      </div>
    );
  }

  const current = deck[index];
  if (!current) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 660, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Q{index + 1} of {deck.length}</span>
        <SpecBadge tag={current.specTag} />
      </div>
      <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(index / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "20px 22px", textAlign: "center" }}>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0 }}>{current.q}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {choices.map((choice, i) => {
          let bg = "#fff", border = "#e5e7eb", color = "#111827", lc = "#9ca3af";
          if (selected !== null) {
            if (choice === current.a) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; lc = "#065f46"; }
            else if (choice === selected) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; lc = "#991b1b"; }
            else { bg = "#f9fafb"; color = "#9ca3af"; }
          }
          return (
            <button key={i} onClick={() => select(choice)}
              style={{ width: "100%", minHeight: 44, padding: "12px 16px", textAlign: "left", borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: "0.9rem", cursor: selected ? "default" : "pointer", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: lc, marginRight: 10 }}>{["A", "B", "C", "D"][i]}.</span>{choice}
            </button>
          );
        })}
      </div>
      {selected !== null && current.explain && (
        <div style={{ background: "#eff6ff", borderLeft: "4px solid #1e3a8a", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontSize: "0.84rem", color: "#334155", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
            <span style={{ fontWeight: 800, color: selected === current.a ? "#059669" : "#b45309" }}>{selected === current.a ? "Why: " : "Not quite — "}</span>
            {boldText(current.explain)}
          </p>
        </div>
      )}
      {selected !== null && (
        <button onClick={nextQ} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
          {index + 1 >= deck.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
};
