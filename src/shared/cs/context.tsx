// ─────────────────────────────────────────────────────────────────────────────
// CS shell — topic context. Provides the current topic's glossary and spec-tag
// descriptions to shared components (GlossaryText, SpecBadge, and the modes) so
// they don't need the data prop-drilled. CSShell wraps everything in a provider.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, type ReactNode, type CSSProperties } from "react";
import { showTooltip, parseGlossaryText } from "./tooltip";
import { NAVY } from "./ui";

interface TopicCtx {
  glossary: Record<string, string>;
  specDescriptions: Record<string, string>;
}

const Ctx = createContext<TopicCtx>({ glossary: {}, specDescriptions: {} });

export const TopicProvider = ({ value, children }: { value: TopicCtx; children: ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

export const useTopic = () => useContext(Ctx);

// Renders text with the topic's glossary terms underlined; tap a term for its
// definition (touch-first tooltip). `terms` limits which terms to wrap.
export const GlossaryText = ({ text, terms, style, onCard = false }: { text: string; terms?: string[]; style?: CSSProperties; onCard?: boolean }) => {
  const { glossary } = useTopic();
  const segments = parseGlossaryText(glossary, text, terms);
  return (
    <span style={style}>
      {segments.map((seg, i) =>
        seg.type === "text"
          ? <span key={i}>{seg.value}</span>
          : <span key={i} onClick={e => { e.stopPropagation(); showTooltip(seg.value, seg.def!, e.currentTarget as HTMLElement); }}
              style={{ borderBottom: `2px dotted ${onCard ? "rgba(255,255,255,0.75)" : NAVY}`, cursor: "pointer", padding: "0 1px" }}>
              {seg.value}
            </span>
      )}
    </span>
  );
};

// A spec-tag pill; tap for the tag's description from the topic context.
export const SpecBadge = ({ tag }: { tag: string }) => {
  const { specDescriptions } = useTopic();
  return (
    <button onClick={e => { e.stopPropagation(); showTooltip(tag, specDescriptions[tag] ?? tag, e.currentTarget as HTMLElement); }}
      style={{ minHeight: 24, padding: "2px 9px", borderRadius: 20, border: "1.5px solid #cbd5e1",
        background: "#f8fafc", color: "#475569", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      {tag}
    </button>
  );
};
