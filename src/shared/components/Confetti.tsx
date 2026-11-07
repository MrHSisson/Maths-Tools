import { useEffect, useRef } from "react";

// A short confetti burst over the whole screen: two fountains from the lower corners and a shower from the top.
// Mount it when something is revealed; it plays once (about four seconds), draws nothing afterwards and never
// catches a tap. People who ask their device for reduced motion get no confetti at all.

interface Piece { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; colour: string; round: boolean; delay: number }

const DURATION = 4200;   // ms before the animation stops for good

export function Confetti({ colours }: { colours: string[] }): JSX.Element | null {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colours.join(",");

  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const palette = key.split(",");
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const piece = (x: number, y: number, vx: number, vy: number, delay: number): Piece => ({
      x, y, vx, vy, delay, w: rnd(6, 11), h: rnd(4, 7), rot: rnd(0, Math.PI * 2), vr: rnd(-0.3, 0.3),
      colour: palette[Math.floor(Math.random() * palette.length)], round: Math.random() < 0.25,
    });
    const power = Math.min(1, Math.max(0.6, H / 800));
    const pieces: Piece[] = [];
    for (let i = 0; i < 70; i++) {
      pieces.push(piece(-10, H + 10, rnd(5, 14) * power, -rnd(13, 25) * power, rnd(0, 250)));
      pieces.push(piece(W + 10, H + 10, -rnd(5, 14) * power, -rnd(13, 25) * power, rnd(0, 250)));
    }
    for (let i = 0; i < 70; i++) pieces.push(piece(rnd(0, W), -20, rnd(-2, 2), rnd(1, 4), rnd(200, 1400)));

    let raf = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const t = now - start, f = Math.min(3, (now - last) / 16.67);   // frames' worth of time, so it runs the same at any refresh rate
      last = now;
      ctx.clearRect(0, 0, W, H);
      if (t > DURATION) return;
      const fade = t > DURATION - 800 ? Math.max(0, (DURATION - t) / 800) : 1;
      for (const p of pieces) {
        if (t < p.delay) continue;
        p.vy += 0.42 * f; p.vx *= Math.pow(0.985, f); p.vy *= Math.pow(0.992, f);
        p.x += p.vx * f; p.y += p.vy * f; p.rot += p.vr * f;
        if (p.y > H + 20) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.colour;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h / 2 + 1, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)) + 1);   // the cos makes each piece flutter edge-on
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, [key]);

  return <canvas ref={ref} aria-hidden="true" data-confetti className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
