// ─────────────────────────────────────────────────────────────────────────────
// MODE: SPOT THE MISTAKE — misconception check. Judge each statement true/false,
// then see the correction. Self-contained: driven by the `myths` prop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { shuffleArr, CARD_SHADOW, boldText } from "../ui";
import { SpecBadge } from "../context";
import { type MythItem } from "../types";

export const SpotMistakeMode = ({ myths }: { myths: MythItem[] }) => {
  const [deck, setDeck] = useState<MythItem[]>(() => shuffleArr(myths));
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const restart = useCallback(() => { setDeck(shuffleArr(myths)); setIndex(0); setChoice(null); setScore(0); setDone(false); }, [myths]);
  useEffect(() => { restart(); }, [restart]);

  if (done) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", boxShadow: CARD_SHADOW }}>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: 0 }}>Misconception check done</p>
          <p style={{ fontSize: "3rem", fontWeight: 800, color: "#1e3a8a", margin: 0, lineHeight: 1 }}>{score}/{deck.length}</p>
          <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>{pct}% spotted</p>
          <p style={{ fontSize: "0.84rem", color: "#6b7280", lineHeight: 1.5, margin: 0 }}>Re-read the corrections on any you missed — these are the traps examiners set.</p>
          <button onClick={restart} style={{ minHeight: 44, padding: "0 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: "100%" }}>Try again</button>
        </div>
      </div>
    );
  }

  const cur = deck[index];
  if (!cur) return null;
  const answered = choice !== null;
  const gotIt = answered && choice === cur.isTrue;

  const answer = (val: boolean) => { if (answered) return; setChoice(val); if (val === cur.isTrue) setScore(s => s + 1); };
  const next = () => { if (index + 1 >= deck.length) { setDone(true); return; } setIndex(i => i + 1); setChoice(null); };

  const verdictBtn = (val: boolean, label: string) => {
    let bg = "#fff", border = "#e5e7eb", color = "#374151";
    if (answered) {
      if (val === cur.isTrue) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; }
      else if (val === choice) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; }
    }
    return (
      <button onClick={() => answer(val)} disabled={answered}
        style={{ flex: 1, minHeight: 52, borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 800, fontSize: "1rem", cursor: answered ? "default" : "pointer" }}>
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Statement {index + 1} of {deck.length}</span>
        <SpecBadge tag={cur.specTag} />
      </div>
      <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(index / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "22px 22px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9ca3af" }}>True or false?</span>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", lineHeight: 1.5, margin: 0 }}>{cur.statement}</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {verdictBtn(true, "True")}
        {verdictBtn(false, "False")}
      </div>

      {answered && (
        <div style={{ background: gotIt ? "#ecfdf5" : "#fef2f2", border: `2px solid ${gotIt ? "#10b981" : "#ef4444"}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, marginTop: 1, color: gotIt ? "#059669" : "#dc2626" }}>{gotIt ? <Check size={18} strokeWidth={3} /> : <AlertTriangle size={18} />}</span>
          <div>
            <p style={{ fontSize: "0.86rem", fontWeight: 800, color: gotIt ? "#065f46" : "#991b1b", margin: "0 0 3px" }}>
              {gotIt ? "Correct" : "Careful"} — this statement is {cur.isTrue ? "TRUE" : "FALSE"}.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{boldText(cur.why)}</p>
          </div>
        </div>
      )}

      {answered && (
        <button onClick={next} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
          {index + 1 >= deck.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
};
