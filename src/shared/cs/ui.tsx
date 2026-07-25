// ─────────────────────────────────────────────────────────────────────────────
// CS shell — shared UI primitives (no topic-data coupling).
// Part of the Computer Science revision shell; see CS_SHELL_PLAN.md.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// Visual tokens — kept in line with the maths ToolShell house style
// (deep blue-900 primary, soft card shadows).
export const NAVY = "#1e3a8a";                                   // Tailwind blue-900
export const CARD_SHADOW = "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)";  // ~shadow-lg
export const TAB_SHADOW  = "0 10px 15px -3px rgba(0,0,0,0.12), 0 4px 6px -4px rgba(0,0,0,0.1)";   // ~shadow-xl

// Fisher–Yates shuffle (returns a new array).
export const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Split cloze text into text/slot segments. "[WORD]" marks a slot.
export const parseCloze = (text: string): { type: "text" | "slot"; value: string }[] => {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map(p =>
    p.startsWith("[") && p.endsWith("]")
      ? { type: "slot" as const, value: p.slice(1, -1) }
      : { type: "text" as const, value: p });
};

// Mobile detection (matchMedia, ≤767px).
export const useIsMobile = (): boolean => {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
};

// Renders **bold** and *italic* markers in teaching text.
export const boldText = (s: string) =>
  s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: "#111827" }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i} style={{ fontStyle: "italic", color: NAVY }}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });

// "BEYOND SPEC" pill — enrichment content flag.
export const BeyondBadge = () => (
  <span style={{ padding: "2px 9px", borderRadius: 20, border: "1.5px solid #fbbf24", background: "#fffbeb",
    color: "#92400e", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
    BEYOND SPEC
  </span>
);

// Wrapping segmented control (used for sub-mode / format selectors).
export const SegRow = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
    {options.map(o => {
      const active = value === o.key;
      return (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", border: "2px solid", cursor: "pointer",
            background: active ? NAVY : "#fff", color: active ? "#fff" : "#4b5563", borderColor: active ? NAVY : "#e5e7eb" }}>
          {o.label}
        </button>
      );
    })}
  </div>
);
