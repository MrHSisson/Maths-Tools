import type { ReactNode } from "react";

/** Secondary teaching actions stay available without competing with the question. */
export function SlideMore({ children, live }: { children: ReactNode; live: boolean }) {
  if (!live) return <span style={{ marginLeft: "auto", color: "#64748b" }}>More ···</span>;
  return <details className="slide-more" onKeyDown={(e) => { if (e.key === "Escape") { e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); e.stopPropagation(); } }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) e.currentTarget.open = false; }}>
    <summary>More ···</summary><div className="slide-more-panel" onClick={(e) => { if ((e.target as HTMLElement).closest("button")) e.currentTarget.parentElement?.removeAttribute("open"); }}>{children}</div>
  </details>;
}
