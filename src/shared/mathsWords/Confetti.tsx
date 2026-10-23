const PIECES = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 37) % 100, delay: ((i * 53) % 100) / 100, dur: 1.8 + ((i * 29) % 15) / 10, hue: (i * 47) % 360,
}));

/** A burst of falling confetti; mount it to start it, unmount to stop. */
export function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[90]" aria-hidden>
      <style>{"@keyframes mw-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:.9}}"}</style>
      {PIECES.map((c, i) => (
        <span key={i} className="absolute top-0 block w-3 h-5 rounded-sm"
          style={{ left: `${c.left}%`, background: `hsl(${c.hue} 80% 55%)`, animation: `mw-fall ${c.dur}s ${c.delay}s linear both` }} />
      ))}
    </div>
  );
}
