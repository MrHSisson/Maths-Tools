// ─────────────────────────────────────────────────────────────────────────────
// MODE: FLASHCARDS (active recall) — flip-to-reveal, swipe/shuffle over a card deck.
// Self-contained: driven entirely by the `cards` prop; no topic globals.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import { shuffleArr, BeyondBadge } from "../ui";
import { GlossaryText, SpecBadge } from "../context";
import { type FlashCard } from "../types";

const FlipCard = ({ card, isFlipped, onFlip, onSwipeLeft, onSwipeRight }: {
  card: FlashCard; isFlipped: boolean; onFlip: () => void;
  onSwipeLeft: () => void; onSwipeRight: () => void;
}) => {
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const moved  = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY; moved.current = false; };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    if (Math.abs(e.touches[0].clientX - touchX.current) > 12) moved.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? onSwipeLeft() : onSwipeRight();
    } else if (!moved.current) {
      onFlip();
    }
    touchX.current = touchY.current = null;
  };

  // viewport-aware: clamp() scales with vw between sensible floors/ceilings; the
  // length tier only sets the ceiling, so long answers shrink harder on phones.
  const qMax = card.q.length > 90 ? 1.25 : card.q.length > 55 ? 1.5 : 1.8;
  const aMax = card.a.length > 110 ? 1.1 : card.a.length > 70 ? 1.3 : card.a.length > 45 ? 1.5 : 1.7;
  const qSize = `clamp(1.05rem, 5.2vw, ${qMax}rem)`;
  const aSize = `clamp(1rem, 4.6vw, ${aMax}rem)`;

  const face: CSSProperties = {
    position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "clamp(24px, 6vw, 44px)", gap: 14, textAlign: "center",
  };

  return (
    <div
      onClick={onFlip}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ perspective: "1200px", width: "100%", maxWidth: 680, height: "clamp(230px, 44vh, 360px)", cursor: "pointer", margin: "0 auto", touchAction: "pan-y" }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(0.45,0.05,0.55,0.95)", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        {/* Front */}
        <div style={{ ...face, background: "linear-gradient(140deg,#1e3a8a 0%,#1d4ed8 100%)", boxShadow: "0 8px 40px rgba(30,58,138,0.28)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Question</span>
            {card.beyondSpec && <BeyondBadge />}
          </div>
          <p style={{ color: "#fff", fontSize: qSize, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{card.q}</p>
          <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Tap to reveal · swipe to move</span>
        </div>
        {/* Back */}
        <div style={{ ...face, transform: "rotateY(180deg)", background: "linear-gradient(140deg,#064e3b 0%,#059669 100%)", boxShadow: "0 8px 40px rgba(6,78,59,0.28)" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Answer — tap a dotted word</span>
          <GlossaryText text={card.a} terms={card.terms} onCard
            style={{ color: "#fff", fontSize: aSize, fontWeight: 600, lineHeight: 1.6 }} />
        </div>
      </div>
    </div>
  );
};

export const FlashcardMode = ({ cards }: { cards: FlashCard[] }) => {
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => { setDeck(cards); setIndex(0); setIsFlipped(false); setShuffled(false); }, [cards]);

  const goTo = useCallback((i: number) => { setIsFlipped(false); setTimeout(() => setIndex(i), 160); }, []);
  const next = useCallback(() => { if (index < deck.length - 1) goTo(index + 1); }, [index, deck.length, goTo]);
  const prev = useCallback(() => { if (index > 0) goTo(index - 1); }, [index, goTo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if ((e.key === " " || e.key === "Enter") && e.target === document.body) { e.preventDefault(); setIsFlipped(f => !f); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  const current = deck[index];
  if (!current) return null;

  const iconBtn: CSSProperties = { minWidth: 44, minHeight: 44, borderRadius: 12, border: "2px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" };
  const navBtn = (active: boolean, primary: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6, padding: "0 18px", minHeight: 44,
    borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: active ? "pointer" : "not-allowed",
    background: !active ? "#f3f4f6" : primary ? "#1e3a8a" : "#fff",
    color: !active ? "#d1d5db" : primary ? "#fff" : "#374151",
    borderColor: !active ? "#e5e7eb" : primary ? "#1e3a8a" : "#d1d5db",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <FlipCard card={current} isFlipped={isFlipped} onFlip={() => setIsFlipped(f => !f)} onSwipeLeft={next} onSwipeRight={prev} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>Card {index + 1} of {deck.length}</span>
        <SpecBadge tag={current.specTag} />
        {shuffled && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "2px 10px", borderRadius: 20 }}>Shuffled</span>}
      </div>

      <div style={{ width: "100%", maxWidth: 480, height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${((index + 1) / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={navBtn(index > 0, false)} onClick={prev}><ChevronLeft size={18} /> Prev</button>
        <button style={iconBtn} title="Shuffle" onClick={() => { setDeck(shuffleArr(deck)); setIndex(0); setIsFlipped(false); setShuffled(true); }}><Shuffle size={17} /></button>
        <button style={iconBtn} title="Reset order" onClick={() => { setDeck(cards); setIndex(0); setIsFlipped(false); setShuffled(false); }}><RotateCcw size={17} /></button>
        <button style={navBtn(index < deck.length - 1, true)} onClick={next}>Next <ChevronRight size={18} /></button>
      </div>
    </div>
  );
};
