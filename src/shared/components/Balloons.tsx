import { useEffect, useRef } from "react";

// Balloons that rise from the bottom of the screen, sway a little and float off the top. Mount it when something is
// revealed; it plays once (the last balloon leaves in about ten seconds), draws nothing afterwards and never catches a
// tap. People who ask their device for reduced motion get no balloons at all.

interface Balloon { x: number; y: number; r: number; speed: number; sway: number; swayHz: number; phase: number; colour: string; delay: number }

const MAX_MS = 14000;

/** Mix a colour with white (amount 0 to 1) or black (below 0) so each balloon has a highlight and a shaded side. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const t = amount < 0 ? 0 : 255, k = Math.abs(amount);
  return `rgb(${c.map(v => Math.round(v + (t - v) * k)).join(",")})`;
}

export function Balloons({ colours }: { colours: string[] }): JSX.Element | null {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colours.join(",");

  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const palette = key.split(",").filter(c => /^#[0-9a-f]{6}$/i.test(c));
    if (!palette.length) return;
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const count = W < 640 ? 10 : 16;
    const size = Math.min(1, Math.max(0.65, W / 1100));
    const balloons: Balloon[] = Array.from({ length: count }, (_, i) => {
      const r = rnd(26, 42) * size;
      return {
        x: ((i + rnd(0.1, 0.9)) / count) * W, y: H + r * 4, r, speed: rnd(1.1, 2.3) * (H / 800 > 0.6 ? 1 : 0.7),
        sway: rnd(8, 22), swayHz: rnd(0.0008, 0.0016), phase: rnd(0, Math.PI * 2),
        colour: palette[Math.floor(Math.random() * palette.length)], delay: rnd(0, 2600),
      };
    }).sort(() => Math.random() - 0.5);

    let raf = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const t = now - start, f = Math.min(3, (now - last) / 16.67);
      last = now;
      ctx.clearRect(0, 0, W, H);
      let live = false;
      for (const b of balloons) {
        if (t < b.delay) { live = true; continue; }
        b.y -= b.speed * f;
        const top = b.y - b.r * 1.2, string = b.r * 2.6;
        if (top + b.r * 2.4 + string < 0) continue;   // fully off the top
        live = true;
        const cx = b.x + Math.sin(t * b.swayHz * 2 * Math.PI + b.phase) * b.sway;
        const bw = b.r * 0.92, bh = b.r * 1.15, knotY = b.y + bh;
        // string
        ctx.strokeStyle = "rgba(71,85,105,.7)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx, knotY + 4);
        for (let k = 1; k <= 4; k++) ctx.lineTo(cx + Math.sin(k * 1.4 + t * 0.004 + b.phase) * 4, knotY + 4 + (string / 4) * k);
        ctx.stroke();
        // body, shaded from a highlight at the upper left
        const g = ctx.createRadialGradient(cx - bw * 0.35, b.y - bh * 0.4, bw * 0.1, cx, b.y, bh * 1.1);
        g.addColorStop(0, shade(b.colour, 0.45)); g.addColorStop(0.55, b.colour); g.addColorStop(1, shade(b.colour, -0.3));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(cx, b.y, bw, bh, 0, 0, Math.PI * 2); ctx.fill();
        // knot
        ctx.fillStyle = shade(b.colour, -0.25);
        ctx.beginPath(); ctx.moveTo(cx, knotY - 1); ctx.lineTo(cx - 4.5, knotY + 6); ctx.lineTo(cx + 4.5, knotY + 6); ctx.closePath(); ctx.fill();
        // shine
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath(); ctx.ellipse(cx - bw * 0.38, b.y - bh * 0.42, bw * 0.16, bh * 0.28, -0.5, 0, Math.PI * 2); ctx.fill();
      }
      if (live && t < MAX_MS) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, [key]);

  return <canvas ref={ref} aria-hidden="true" data-balloons className="pointer-events-none fixed inset-0 z-[58] h-full w-full" />;
}
