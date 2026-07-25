// ─────────────────────────────────────────────────────────────────────────────
// CS shell — touch-first tooltip + glossary parsing.
// Tap a term/badge to open; tap the backdrop or the × to close. No hover
// dependency. The glossary map is injected per topic (the shell's data seam).
// See CS_SHELL_PLAN.md.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface CSTooltip { title: string; def: string; rect: DOMRect }
export interface CSGlossarySegment { type: "text" | "term"; value: string; def?: string }

// A single active-tooltip setter, registered by whichever shell is mounted.
let _setTip: ((t: CSTooltip | null) => void) | null = null;
export const registerTooltip = (fn: ((t: CSTooltip | null) => void) | null) => { _setTip = fn; };
export const showTooltip = (title: string, def: string, el: HTMLElement) =>
  _setTip?.({ title, def, rect: el.getBoundingClientRect() });

export const TooltipOverlay = ({ tip, onClose }: { tip: CSTooltip; onClose: () => void }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipRef.current) return;
    const tw = tipRef.current.offsetWidth || 260;
    const th = tipRef.current.offsetHeight || 90;
    const cx = tip.rect.left + tip.rect.width / 2;
    let left = cx - tw / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tw - 10));
    let top = tip.rect.top + window.scrollY - th - 12;
    if (top < window.scrollY + 8) top = tip.rect.bottom + window.scrollY + 12; // flip below if no room
    setPos({ top, left });
  }, [tip]);

  return (
    <>
      {/* Backdrop — any tap dismisses. Works identically for touch and mouse. */}
      <div onClick={onClose} onTouchStart={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }} />
      <div ref={tipRef}
        style={{
          position: "absolute", top: pos.top, left: pos.left, zIndex: 9999,
          background: "#0f172a", color: "#f8fafc", borderRadius: 12, padding: "12px 16px",
          fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500, width: 260,
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#7dd3fc" }}>{tip.title}</span>
          <button onClick={onClose}
            style={{ flexShrink: 0, width: 28, height: 28, marginTop: -2, marginRight: -6, borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.12)", color: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>
        <span style={{ color: "rgba(248,250,252,0.9)" }}>{tip.def}</span>
      </div>
    </>
  );
};

// Parse text into segments, wrapping glossary terms. Terms sorted longest-first so
// "Control Unit" matches before "Unit". `overrideTerms` limits which terms to wrap.
export const parseGlossaryText = (glossary: Record<string, string>, text: string, overrideTerms?: string[]): CSGlossarySegment[] => {
  const termKeys = overrideTerms?.length
    ? overrideTerms.filter(t => glossary[t])
    : Object.keys(glossary).filter(t => {
        const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return re.test(text);
      });
  const sorted = [...termKeys].sort((a, b) => b.length - a.length);
  if (!sorted.length) return [{ type: "text", value: text }];
  const pattern = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);
  const used = new Set<string>();
  return parts.filter(p => p !== "").map(part => {
    const matchedKey = sorted.find(t => t.toLowerCase() === part.toLowerCase());
    if (matchedKey && !used.has(matchedKey.toLowerCase())) {
      used.add(matchedKey.toLowerCase());
      return { type: "term" as const, value: part, def: glossary[matchedKey] };
    }
    return { type: "text" as const, value: part };
  });
};
