import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Scales its content down (never up) so it always fits the box it is given — a slide never needs a scrollbar.
 *  The content is laid out at width W/s and scaled by s, so as it shrinks the text re-wraps wider (needing less
 *  height) and the scale settles on the largest size that fits. Re-measured on resize and whenever the content's
 *  own size changes (KaTeX finishing, an option picked, the line shown or hidden). */
export function FitBox({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ s: 1, top: 0, w: 0 });
  useLayoutEffect(() => {
    const o = outer.current, n = inner.current;
    if (!o || !n) return;
    let raf = 0;
    let last = "";   // box + content height at the last settle: when nothing has changed, skip the (layout-forcing) fitting loop
    const measure = () => {
      const W = o.clientWidth, H = o.clientHeight;
      if (!W || !H) return;
      const key = `${W}x${H}x${n.offsetHeight}`;
      if (key === last) return;
      const heightAt = (s: number) => { n.style.width = `${W / s}px`; return n.offsetHeight; };
      let s = 1;
      for (let i = 0; i < 4; i++) {
        const next = Math.min(1, H / heightAt(s));
        if (Math.abs(next - s) < 0.004) break;
        s = next;
      }
      // the loop can overshoot (a wider box needs less height, a bigger scale needs a narrower one): settle conservatively
      let h = heightAt(s);
      while (h * s > H && s > 0.2) { s *= 0.97; h = heightAt(s); }
      last = `${W}x${H}x${n.offsetHeight}`;
      setFit((f) => (Math.abs(f.s - s) < 0.003 && Math.abs(f.w - W / s) < 1 && Math.abs(f.top - Math.max(0, (H - h * s) / 2)) < 1 ? f : { s, top: Math.max(0, (H - h * s) / 2), w: W / s }));
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(o); ro.observe(n);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return (
    <div ref={outer} data-fit-outer style={{ position: "relative", flex: "1 1 auto", minHeight: 0, width: "100%", overflow: "hidden" }}>
      <div ref={inner} data-fit-inner style={{ position: "absolute", left: 0, top: fit.top, width: fit.w || "100%", transformOrigin: "top left", transform: `scale(${fit.s})` }}>
        {children}
      </div>
    </div>
  );
}

