import { useEffect, useMemo, useRef, useState } from "react";
import type { SolveStep } from "./types";
import { GlossCaption, glossSegments } from "./glossary";

// The step-by-step working as a cascade: every step so far, the newest lit, earlier ones dimmed, auto-scrolled to follow the newest. Shared by the
// stepped worked example and the exam parts' working.
function FadeIn({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div style={{ opacity: on ? 1 : 0, transition: "opacity 0.7s ease" }}>{children}</div>;
}

export default function StepCascade({ steps, idx, answer, all, big }: { steps: SolveStep[]; idx: number; answer: string | null; all: boolean; big?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // underline each glossary term the first time it appears in the solution; hover or press gives the definition
  const gloss = useMemo(() => {
    const seen = new Set<string>();
    return steps.slice(0, idx + 1).map((st) => glossSegments(st.caption, seen));
  }, [steps, idx]);
  // Follow the newest step: show it from its TOP when it is taller than the box (never cut off its first line),
  // otherwise keep the end in view so the earlier steps stay above it.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      const last = el.querySelector<HTMLElement>("[data-newest]");
      if (last && last.offsetHeight > el.clientHeight - 24) el.scrollTo({ top: Math.max(0, last.offsetTop - 14), behavior: "smooth" });
      else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 30);
    return () => window.clearTimeout(t);
  }, [idx, answer, all, big]);
  const dim = (now: boolean) => (all || now ? 1 : 0.5);
  return (
    <div
      ref={box}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        height: "100%", overflowY: "auto", overflowX: "hidden", padding: "6px 12px 16px",
        ...(scrolled ? { WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)", maskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)" } : null),
      }}
    >
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 22, top: 16, bottom: 16, width: 2, background: "#e2e8f0" }} />
        {steps.slice(0, idx + 1).map((st, i) => {
          const now = i === idx && !answer;
          return (
            <FadeIn key={i}>
              <div
                {...(i === idx && !answer ? { "data-newest": "1" } : {})}
                style={{
                  position: "relative", display: "flex", gap: 12, padding: "10px 10px", borderRadius: 12,
                  opacity: dim(now), transition: "opacity 0.3s ease",
                  background: now ? "#eff6ff" : "transparent", boxShadow: now ? "0 0 0 2px rgba(30,58,138,0.25)" : "none",
                }}
              >
                <div
                  style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 800, zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: now ? "#1e3a8a" : "#e2e8f0", color: now ? "#ffffff" : "#334155", border: "2px solid #ffffff",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {(st.phase || (now && st.runningTotal !== undefined)) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {st.phase && <span style={{ background: "#e0e7ff", color: "#1e3a8a", fontWeight: 800, fontSize: 12, borderRadius: 999, padding: "2px 9px" }}>{st.phase}</span>}
                      {now && st.runningTotal !== undefined && (
                        <span style={{ marginLeft: "auto", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: 8, padding: "2px 9px", fontWeight: 800, fontSize: 14 }}>
                          {st.totalLabel ?? "Total"} {st.runningTotal}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: big ? 16 : 15, fontWeight: 500, color: "#0f172a", lineHeight: 1.5, whiteSpace: "pre-line", overflowWrap: "anywhere" }}><GlossCaption segments={gloss[i]} /></div>
                </div>
              </div>
            </FadeIn>
          );
        })}
        {answer && (
          <FadeIn>
            <div data-newest="1" style={{ position: "relative", display: "flex", gap: 12, padding: "10px 10px", borderRadius: 12, background: "#f0fdf4", boxShadow: "0 0 0 2px rgba(22,163,74,0.35)" }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 800, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#16a34a", color: "#ffffff", border: "2px solid #ffffff" }}>A</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: big ? 16 : 15, fontWeight: 700, color: "#166534", lineHeight: 1.4, paddingTop: 1, overflowWrap: "anywhere" }}>{answer}</div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}


/** The progress dots on ONE line: the question square, a dot per step and the answer pill, but only a window around where the class is, with the dots at either edge fading out (a long working never wraps onto more rows). */
export function StepDots({ n, cur, hasAnswer, onJump, reach = 5 }: { n: number; cur: number; hasAnswer: boolean; onJump: (i: number) => void; reach?: number }) {
  // positions: -1 = the question, 0 … n − 1 = the steps, n = the answer
  const lo = -1, hi = hasAnswer ? n : n - 1;
  const from = Math.max(lo, Math.min(cur - reach, hi - 2 * reach)), to = Math.min(hi, Math.max(cur + reach, lo + 2 * reach));
  const out: JSX.Element[] = [];
  for (let i = from; i <= to; i++) {
    const edge = Math.min(i - from, to - i);
    const fade = (i === from && from > lo) || (i === to && to < hi) ? 0.3 : (i === from + 1 && from > lo) || (i === to - 1 && to < hi) ? 0.6 : 1;
    const on = i === cur;
    const style: React.CSSProperties = i === -1
      ? { width: 10, height: 10, borderRadius: 2, background: on ? "#1e3a8a" : "#d1d5db" }
      : i === n ? { width: 24, height: 10, borderRadius: 5, background: on ? "#16a34a" : "#d1d5db" }
      : { width: 10, height: 10, borderRadius: 5, background: on ? "#1e3a8a" : "#d1d5db" };
    void edge;
    out.push(<button key={i} onClick={() => onJump(i)} title={i === -1 ? "Question" : i === n ? "Answer" : `Step ${i + 1}`} style={{ ...style, border: "none", cursor: "pointer", opacity: fade, flexShrink: 0 }} />);
  }
  return <div className="flex justify-center items-center gap-1.5 min-w-0 overflow-hidden flex-nowrap">{out}</div>;
}
