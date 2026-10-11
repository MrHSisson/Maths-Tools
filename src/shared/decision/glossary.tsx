// ═══════════════════════════════════════════════════════════════════════════
// Decision tools — the glossary behind the underlined words in a worked solution.
//
// Step captions stay short (a teacher's board line); anything that is a DEFINITION or a reason lives here instead. The first time a
// term appears in a solution it is underlined: hover (or press) it for a floating definition. No marker syntax is needed in captions —
// the shell finds the terms by their pattern — so a caption never has to be reworded to carry one.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

export interface GlossaryTerm {
  id: string;
  /** shown above the definition */
  name: string;
  /** matches the term inside a caption (no `g` flag — only the first match is used) */
  pattern: RegExp;
  definition: string;
}

export const DECISION_GLOSSARY: GlossaryTerm[] = [
  // ── Minimum spanning trees ────────────────────────────────────────────────
  {
    id: "cycle", name: "Cycle", pattern: /\bcycles?\b/i,
    definition: "A closed loop of edges that comes back to where it started. A tree has no cycles, so an edge that would complete one is never added.",
  },
  {
    id: "mst", name: "Minimum spanning tree", pattern: /\bminimum spanning tree\b/i,
    definition: "A set of edges that joins every vertex, with no cycles, and the smallest possible total weight. With n vertices it has n − 1 edges. When every weight is different the tree is unique, so Kruskal's and Prim's algorithms give the same tree (in a different order).",
  },
  // ── Route inspection ──────────────────────────────────────────────────────
  {
    id: "degree", name: "Degree", pattern: /\bdegrees?\b/i,
    definition: "The number of edges meeting at a vertex.",
  },
  {
    id: "odd", name: "Odd vertex", pattern: /\bodd vert(?:ex|ices)\b/i,
    definition: "A vertex whose degree is odd. A route that uses every edge exactly once needs every vertex to be even (apart from the start and finish of an open route), so odd vertices are where edges have to be repeated.",
  },
  {
    id: "semi", name: "Semi-Eulerian", pattern: /\bsemi-Eulerian\b/i,
    definition: "Exactly two vertices are odd. A route can use every edge exactly once if it starts at one odd vertex and finishes at the other; it cannot return to its start.",
  },
  {
    id: "eulerian", name: "Eulerian", pattern: /(?<!semi-)\bEulerian\b/i,
    definition: "Every vertex is even. A route can use every edge exactly once and return to its start, from any vertex.",
  },
  // ── Travelling salesperson ────────────────────────────────────────────────
  {
    id: "complete", name: "Complete network", pattern: /\bcomplete network\b/i,
    definition: "Every pair of vertices is joined, each edge carrying the least distance from the table. Every edge is then a shortest route (the triangle inequality holds), so the classical problem — visit every vertex once and return to the start — can be solved on it.",
  },
  {
    id: "nn", name: "Nearest neighbour", pattern: /\bnearest neighbour\b/i,
    definition: "Start at a vertex and always travel to the nearest vertex not yet visited. When every vertex has been visited, return to the start.",
  },
  {
    id: "upper", name: "Upper bound", pattern: /\bupper bound\b/i,
    definition: "A real tour found by an algorithm. The optimal tour cannot be longer than it.",
  },
  {
    id: "lower", name: "Lower bound", pattern: /\blower bound\b/i,
    definition: "Delete a vertex and find a minimum spanning tree of the rest (a tour minus that vertex is at least that long), then add the two shortest edges at the deleted vertex (a tour enters and leaves it by two edges). Every tour is at least this long.",
  },
  // ── Network flows ─────────────────────────────────────────────────────────
  {
    id: "potential", name: "Potential", pattern: /\bpotentials?\b/i,
    definition: "The spare room on an arc. Potential increase = capacity − flow (room to push along the arrow); potential decrease = flow − minimum (room to take back, against the arrow). A capacity-only network has minimum 0.",
  },
  {
    id: "path", name: "Flow-augmenting path", pattern: /\bflow-augmenting paths?\b/i,
    definition: "A path from S to T on which every step has a potential above 0 (a step against an arrow uses its potential decrease). The flow can be increased along it by the smallest potential on the path.",
  },
  {
    id: "super", name: "Supersource and supersink", pattern: /\bsuper(?:source|sink)\b/i,
    definition: "A single new source S joined to every source, and a single new sink T joined from every sink, so the algorithms have one source and one sink. The arc to a source carries whatever leaves that source, so its capacity is the total capacity of the arcs leaving it (with minimums, the total of their minimums and the total of their maximums). A supersink arc is the same over the arcs arriving.",
  },
  {
    id: "cut", name: "Cut", pattern: /\bcuts?\b/i,
    definition: "A cut splits the vertices into an S side and a T side. Its capacity is the total of the arcs going from the S side to the T side (less the minimums of any arcs coming back).",
  },
  {
    id: "maximal", name: "Maximal flow", pattern: /\bmaximal\b/i,
    definition: "Maximum flow – minimum cut theorem: the maximum flow equals the capacity of the minimum cut. A flow equal to the capacity of some cut cannot be increased.",
  },
];

export interface CaptionSegment { text: string; term?: GlossaryTerm }

/** Split a caption into plain text and the first match of every term not already `seen` (seen is updated). */
export function glossSegments(text: string, seen: Set<string>, glossary: GlossaryTerm[] = DECISION_GLOSSARY): CaptionSegment[] {
  const hits: Array<{ start: number; end: number; term: GlossaryTerm }> = [];
  for (const term of glossary) {
    if (seen.has(term.id)) continue;
    const m = term.pattern.exec(text);
    if (!m) continue;
    const start = m.index, end = m.index + m[0].length;
    if (hits.some((h) => start < h.end && end > h.start)) continue; // overlapping terms: the earlier-listed one wins
    hits.push({ start, end, term });
  }
  hits.sort((a, b) => a.start - b.start);
  const out: CaptionSegment[] = [];
  let at = 0;
  for (const h of hits) {
    if (h.start > at) out.push({ text: text.slice(at, h.start) });
    out.push({ text: text.slice(h.start, h.end), term: h.term });
    seen.add(h.term.id);
    at = h.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out.length ? out : [{ text }];
}

// ── One underlined term and its floating card ────────────────────────────────
// The card is portalled to the page (the working box scrolls and clips), sits under the word (above it when there is no room), is
// clamped inside the viewport and points at the word with an arrow. Hover opens it on a mouse; a tap opens it on a touch screen; Esc,
// a tap elsewhere, or scrolling closes it.
const CARD_W = 320;
const EDGE = 10;

function GlossTerm({ term, children }: { term: GlossaryTerm; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number; above: boolean } | null>(null);
  const [hover, setHover] = useState(false);

  const place = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(CARD_W, window.innerWidth - 2 * EDGE);
    const left = Math.max(EDGE, Math.min(window.innerWidth - w - EDGE, r.left + r.width / 2 - w / 2));
    const above = r.bottom + 190 > window.innerHeight && r.top > 190;
    setPos({ left, top: above ? r.top - 10 : r.bottom + 10, arrow: Math.max(16, Math.min(w - 16, r.left + r.width / 2 - left)), above });
  };
  const show = () => { window.clearTimeout(timer.current); place(); setOpen(true); };
  const hide = (delay = 120) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), delay); };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest?.("[data-gloss-card]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <>
      <button
        ref={ref} type="button" aria-expanded={open} aria-label={`${term.name}: definition`}
        onClick={show}
        onMouseEnter={() => { setHover(true); show(); }}
        onMouseLeave={() => { setHover(false); hide(); }}
        onFocus={show} onBlur={() => hide(0)}
        style={{
          font: "inherit", color: "inherit", cursor: "help", padding: "0 2px", margin: "0 -2px", borderRadius: 4, border: 0,
          background: open || hover ? "rgba(30,58,138,0.09)" : "transparent",
          textDecoration: "underline", textDecorationColor: open || hover ? "#1e3a8a" : "rgba(30,58,138,0.45)",
          textDecorationThickness: "2px", textUnderlineOffset: "3px", transition: "background 0.15s ease, text-decoration-color 0.15s ease",
        }}
      >
        {children}
      </button>
      {open && pos && createPortal(
        <div
          data-gloss-card role="tooltip"
          onMouseEnter={() => window.clearTimeout(timer.current)} onMouseLeave={() => hide()}
          style={{
            position: "fixed", left: pos.left, top: pos.top, width: Math.min(CARD_W, window.innerWidth - 2 * EDGE), zIndex: 2000,
            transform: pos.above ? "translateY(-100%)" : undefined,
            background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: "12px 14px 13px",
            boxShadow: "0 12px 32px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)",
            fontFamily: "inherit", animation: "glossIn 0.14s ease-out",
          }}
        >
          <style>{"@keyframes glossIn{from{opacity:0;transform:translateY(" + (pos.above ? "-100%" : "0") + ") scale(.97)}to{opacity:1}}"}</style>
          <span
            aria-hidden
            style={{
              position: "absolute", left: pos.arrow - 7, [pos.above ? "bottom" : "top"]: -8, width: 14, height: 14, background: "#ffffff",
              borderLeft: pos.above ? undefined : "1px solid #cbd5e1", borderTop: pos.above ? undefined : "1px solid #cbd5e1",
              borderRight: pos.above ? "1px solid #cbd5e1" : undefined, borderBottom: pos.above ? "1px solid #cbd5e1" : undefined,
              transform: "rotate(45deg)", borderRadius: 3,
            } as CSSProperties}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: "#1e3a8a", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#1e3a8a" }}>{term.name}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: "#334155", whiteSpace: "normal" }}>{term.definition}</div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** A caption with its newly-met terms underlined; each opens a floating definition. */
export function GlossCaption({ segments }: { segments: CaptionSegment[] }) {
  return (
    <>
      {segments.map((s, i) => (s.term ? <GlossTerm key={i} term={s.term}>{s.text}</GlossTerm> : <span key={i}>{s.text}</span>))}
    </>
  );
}
