import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// The working a student would write, as an open page that grows downward (the way the phone shows the whole solution), used by the tools whose picture is written
// working rather than a network: Formulating and the Simplex Algorithm. It is NOT scaled to fit: text stays full size, the column is centred in its panel and the
// panel scrolls. When `watch` changes the newest work (the element inside `Newest`) is scrolled into view.

const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" };

/** wraps the work added by the newest step, so the page scrolls to it */
export function Newest({ children }: { children: ReactNode }) {
  return <div data-newest="" style={{ display: "contents" }}>{children}</div>;
}

export default function WorkingPage({ children, watch, heading = "Your working", hint }: { children: ReactNode; watch: unknown; heading?: string; hint?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const first = b.querySelector<HTMLElement>("[data-newest]")?.firstElementChild as HTMLElement | null | undefined;
    if (!first) { b.scrollTo({ top: 0 }); return; }
    // keep the top of the new work in view, with a little of what came before it above
    const top = first.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop - 56;
    b.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [watch]);
  return (
    <div ref={box} style={{ position: "absolute", inset: 0, background: "#fff", overflowY: "auto", overflowX: "hidden", containerType: "inline-size" } as CSSProperties}>
      <div style={{ padding: "12px 60px 20px 18px", ...label }}>{heading}</div>
      <div style={{ width: "100%", maxWidth: "46em", margin: "0 auto", padding: "0 1.2em 3em", boxSizing: "border-box", fontSize: "clamp(18px, 3cqw, 30px)", display: "flex", flexDirection: "column", gap: "1.1em" }}>
        {children}
        {hint && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500 }}>{hint}</div>}
      </div>
    </div>
  );
}
