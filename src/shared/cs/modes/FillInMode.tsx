// ─────────────────────────────────────────────────────────────────────────────
// MODE: FILL IN — tap-to-select + tap-to-place (drag also supported on desktop).
// Self-contained: driven by the `exercises` prop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { shuffleArr, parseCloze, CARD_SHADOW, BeyondBadge } from "../ui";
import { SpecBadge } from "../context";
import { type ClozeExercise } from "../types";

export const FillInMode = ({ exercises }: { exercises: ClozeExercise[] }) => {
  const [exIdx, setExIdx] = useState(0);
  const [slots, setSlots] = useState<Record<number, string>>({});
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dragWord = useRef<string | null>(null);

  const ex = exercises[exIdx];

  const initExercise = useCallback((exercise: ClozeExercise) => {
    setSlots({}); setChecked(false); setSelected(null); setWordBank(shuffleArr(exercise.words));
  }, []);

  useEffect(() => { setExIdx(0); }, [exercises]);
  useEffect(() => { if (ex) initExercise(ex); }, [ex, initExercise]);

  if (!ex) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontWeight: 600 }}>No exercises available.</div>;

  const segments = parseCloze(ex.text);
  const slotSegments = segments.filter(s => s.type === "slot");
  const totalSlots = slotSegments.length;
  const filled = Object.keys(slots).length;

  const placeWord = (slotIdx: number, word: string) => {
    setSlots(prev => { const evicted = prev[slotIdx]; const nxt = { ...prev, [slotIdx]: word }; if (evicted) setWordBank(wb => shuffleArr([...wb, evicted])); return nxt; });
    setWordBank(wb => wb.filter(w => w !== word)); setSelected(null);
  };
  const removeFromSlot = (slotIdx: number) => {
    if (checked) return; const word = slots[slotIdx]; if (!word) return;
    setSlots(prev => { const n = { ...prev }; delete n[slotIdx]; return n; });
    setWordBank(wb => shuffleArr([...wb, word]));
  };
  const slotClick = (slotIdx: number) => { if (checked) return; if (slots[slotIdx]) { removeFromSlot(slotIdx); return; } if (selected !== null) placeWord(slotIdx, selected); };
  const wordClick = (word: string) => { if (checked) return; setSelected(s => s === word ? null : word); };

  let slotCounter = -1;
  const isCorrect = (si: number) => slotSegments[si] && slots[si] === slotSegments[si].value;
  const allCorrect = slotSegments.every((_, i) => isCorrect(i));
  const score = checked ? slotSegments.filter((_, i) => isCorrect(i)).length : 0;

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>Exercise {exIdx + 1} of {exercises.length}</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>{ex.title}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}><SpecBadge tag={ex.specTag} />{ex.beyondSpec && <BeyondBadge />}</div>
        </div>
        {exercises.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button disabled={exIdx === 0} onClick={() => setExIdx(i => i - 1)} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === 0 ? "not-allowed" : "pointer", opacity: exIdx === 0 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={16} color="#6b7280" /></button>
            <button disabled={exIdx === exercises.length - 1} onClick={() => setExIdx(i => i + 1)} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === exercises.length - 1 ? "not-allowed" : "pointer", opacity: exIdx === exercises.length - 1 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={16} color="#6b7280" /></button>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "22px 22px", lineHeight: 2.4, fontSize: "1rem", fontWeight: 500, color: "#111827" }}>
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.value}</span>;
          slotCounter++; const si = slotCounter; const placed = slots[si];
          let borderColor = "#cbd5e1", bg = "#f8fafc", textColor = "#111827";
          if (checked) { if (isCorrect(si)) { borderColor = "#10b981"; bg = "#ecfdf5"; textColor = "#065f46"; } else if (placed) { borderColor = "#ef4444"; bg = "#fef2f2"; textColor = "#991b1b"; } }
          else if (placed) { borderColor = "#1e3a8a"; bg = "#eff6ff"; textColor = "#1e3a8a"; }
          else if (selected) { borderColor = "#1e3a8a"; bg = "#f0f7ff"; }
          return (
            <span key={i} onClick={() => slotClick(si)} onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragWord.current && !checked) { placeWord(si, dragWord.current); dragWord.current = null; } }}
              style={{ display: "inline-block", minWidth: 108, minHeight: 34, padding: "4px 12px", margin: "0 4px", borderRadius: 8, border: `2px dashed ${borderColor}`, background: bg, color: textColor, fontWeight: 700, fontSize: "0.9rem", textAlign: "center", verticalAlign: "middle", cursor: checked ? "default" : "pointer", lineHeight: 1.6 }}>
              {placed || (selected ? "tap to place" : "______")}
            </span>
          );
        })}
      </div>

      {checked && (
        <div style={{ background: allCorrect ? "#ecfdf5" : "#fef9c3", border: `2px solid ${allCorrect ? "#10b981" : "#fcd34d"}`, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: allCorrect ? "#065f46" : "#92400e", fontSize: "0.9rem" }}>{allCorrect ? "Perfect — all correct." : `${score} of ${totalSlots} correct.`}</span>
          <button onClick={() => initExercise(ex)} style={{ minHeight: 44, padding: "0 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><RefreshCw size={14} /> Reset</button>
        </div>
      )}

      <div>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Word bank — {checked ? "complete" : selected ? `'${selected}' selected — tap a slot` : "tap a word, then a slot"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {wordBank.map((word, i) => (
            <div key={`${word}-${i}`} draggable={!checked} onDragStart={() => { dragWord.current = word; }} onClick={() => wordClick(word)}
              style={{ minHeight: 44, display: "flex", alignItems: "center", padding: "0 16px", borderRadius: 22, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: checked ? "default" : "pointer",
                background: selected === word ? "#1e3a8a" : "#fff", color: selected === word ? "#fff" : "#374151", borderColor: selected === word ? "#1e3a8a" : "#d1d5db", userSelect: "none" }}>
              {word}
            </div>
          ))}
          {wordBank.length === 0 && !checked && <p style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>All words placed</p>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {!checked && (
          <button onClick={() => setChecked(true)} disabled={filled < totalSlots}
            style={{ minHeight: 44, padding: "0 28px", background: filled < totalSlots ? "#e5e7eb" : "#1e3a8a", color: filled < totalSlots ? "#9ca3af" : "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: filled < totalSlots ? "not-allowed" : "pointer" }}>
            Check ({filled}/{totalSlots})
          </button>
        )}
        {checked && !allCorrect && (
          <button onClick={() => initExercise(ex)} style={{ minHeight: 44, padding: "0 28px", background: "#fff", color: "#1e3a8a", border: "2px solid #1e3a8a", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Try again</button>
        )}
      </div>
    </div>
  );
};
