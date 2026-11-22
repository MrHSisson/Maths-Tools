import { useEffect, useRef } from "react";

// Fireworks over the whole screen: rockets climb from the bottom and burst into sparks that trail and fall. Mount it when
// something is revealed; it plays once (about seven seconds), draws nothing afterwards and never catches a tap. People
// who ask their device for reduced motion get no fireworks at all, unless `force` is set. `scale` above 1 means more bursts.

interface Spark { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number; colour: string }
interface Rocket { x: number; y: number; targetY: number; at: number; colour: string; launched: boolean; spent: boolean }

export function Fireworks({ colours, scale = 1, force = false }: { colours: string[]; scale?: number; force?: boolean }): JSX.Element | null {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colours.join(",");

  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!force && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const palette = [...key.split(",").filter(Boolean), "#fde68a", "#ffffff"];
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const bursts = Math.round((W < 640 ? 6 : 9) * scale), size = Math.min(1, Math.max(0.6, Math.min(W, H) / 700));
    const rockets: Rocket[] = Array.from({ length: bursts }, (_, i) => ({
      x: rnd(0.12, 0.88) * W, y: H, targetY: rnd(0.12, 0.45) * H, at: 300 + i * rnd(420, 620), launched: false, spent: false,
      colour: palette[Math.floor(Math.random() * palette.length)],
    }));
    const sparks: Spark[] = [];
    const explode = (r: Rocket) => {
      const other = palette[Math.floor(Math.random() * palette.length)], n = Math.round(70 * size + 20);
      for (let k = 0; k < n; k++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(1.2, 6.5) * size * (Math.random() < 0.35 ? 0.55 : 1), max = rnd(55, 100);
        sparks.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max, colour: k % 3 ? r.colour : other });
      }
    };

    let raf = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const t = now - start, f = Math.min(3, (now - last) / 16.67);
      last = now;
      ctx.clearRect(0, 0, W, H);
      let live = false;
      for (const r of rockets) {
        if (r.spent) continue;
        live = true;
        if (t < r.at) continue;
        r.launched = true;
        const py = r.y;
        r.y -= Math.max(4, (r.y - r.targetY) * 0.07) * f;   // quick off the ground, easing to a stop where it bursts
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, py + 10); ctx.lineTo(r.x, r.y); ctx.stroke();
        if (r.y - r.targetY < 6) { r.spent = true; explode(r); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += f;
        if (s.life > s.max) { sparks.splice(i, 1); continue; }
        live = true;
        s.px = s.x; s.py = s.y;
        s.vy += 0.05 * f; s.vx *= Math.pow(0.985, f); s.vy *= Math.pow(0.985, f);
        s.x += s.vx * f; s.y += s.vy * f;
        const a = 1 - s.life / s.max;
        ctx.globalAlpha = a; ctx.strokeStyle = s.colour; ctx.lineWidth = 2 * size + 0.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (live && t < 14000) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, [key, scale, force]);

  return <canvas ref={ref} aria-hidden="true" data-fireworks className="pointer-events-none fixed inset-0 z-[59] h-full w-full" />;
}
