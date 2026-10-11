// ═══════════════════════════════════════════════════════════════════════════
// Decision tools — the glossary behind the underlined words in a worked solution.
//
// Step captions stay short (a teacher's board line); anything that is a DEFINITION or a reason lives here instead. The first time a
// term appears in a solution it is dotted-underlined: hover (or press) it for the definition. No marker syntax is needed in captions —
// the shell finds the terms by their pattern — so a caption never has to be reworded to carry one.
// ═══════════════════════════════════════════════════════════════════════════

import type { CSSProperties } from "react";

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
    definition: "A single new source S joined to every source (capacity = its supply) and a single new sink T joined from every sink (capacity = its demand), so the algorithms have one source and one sink.",
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

const UNDERLINE: CSSProperties = { borderBottom: "2px dotted #1e3a8a", cursor: "help", background: "transparent", padding: 0, font: "inherit", color: "inherit" };

/** A caption with its newly-met terms underlined; hover shows the definition, press opens it under the caption. */
export function GlossCaption({ segments, stepKey, open, onToggle }: {
  segments: CaptionSegment[]; stepKey: number; open: string | null; onToggle: (key: string | null) => void;
}) {
  const openTerm = segments.find((s) => s.term && open === `${stepKey}:${s.term.id}`)?.term;
  return (
    <>
      {segments.map((s, i) =>
        s.term ? (
          <button
            key={i} type="button" title={s.term.definition} style={UNDERLINE}
            onClick={() => onToggle(open === `${stepKey}:${s.term!.id}` ? null : `${stepKey}:${s.term!.id}`)}
          >
            {s.text}
          </button>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
      {openTerm && (
        <span style={{ display: "block", marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #cbd5e1", fontSize: 15, fontWeight: 500, color: "#334155", lineHeight: 1.45, whiteSpace: "normal" }}>
          <b style={{ color: "#1e3a8a" }}>{openTerm.name}.</b> {openTerm.definition}
        </span>
      )}
    </>
  );
}
