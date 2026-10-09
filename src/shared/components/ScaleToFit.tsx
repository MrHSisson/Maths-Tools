import { useState, useRef, useLayoutEffect, type ReactNode } from "react";

/** Scales its content to fit the available space — up to fill when the panel
 *  collapse frees room (like dragging the splitter wide, past the tool's own
 *  maxWidth cap), and DOWN below 1x when the content wouldn't fit (short
 *  screens, answer revealed under a tall diagram) so the top of a centred
 *  diagram is never clipped. Content renders at its natural size first
 *  (width:100% preserved), then a CSS transform scales it. */
export function ScaleToFit({ children, maxScale = 3 }: { children: ReactNode; maxScale?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const o = outerRef.current, n = innerRef.current;
        if (!o || !n) return;
        const availW = o.clientWidth, availH = o.clientHeight;
        // Measure the *natural* content size with the transform neutralised, so
        // the reading never depends on the current scale. Use the union of the
        // inner's children rather than querySelector("svg") — KaTeX renders roots
        // (\sqrt) as inline <svg>, which the old selector grabbed instead of the
        // content, producing a wild zoom whenever a root appeared.
        const prev = n.style.transform;
        n.style.transform = "none";
        const kids = Array.from(n.children) as HTMLElement[];
        let natW = 0, natH = 0;
        if (kids.length) {
          let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
          for (const k of kids) {
            const r = k.getBoundingClientRect();
            left = Math.min(left, r.left); top = Math.min(top, r.top);
            right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
          }
          natW = right - left; natH = bottom - top;
        } else {
          const r = n.getBoundingClientRect();
          natW = r.width; natH = r.height;
        }
        n.style.transform = prev;
        if (!natW || !natH) return;
        const s = Math.min((availW * 0.96) / natW, (availH * 0.96) / natH);
        // No lower clamp: when the natural content is taller than the box the
        // flex-centred overflow would clip it at BOTH ends (the top being the
        // visible casualty) — shrinking to fit is always better than clipping.
        const clamped = Math.min(maxScale, s);
        if (Math.abs(clamped - scaleRef.current) > 0.01) setScale(clamped);
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer); ro.observe(inner);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [maxScale]);
  return (
    <div ref={outerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div ref={innerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}

