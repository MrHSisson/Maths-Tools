import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, assignCast } from "../shared/components/DepthArt";
import { InlineMath } from "../shared/components/MathRenderer";

const colours = ["#7c3aed", "#e11d48", "#059669", "#d97706", "#2563eb"];
/** Keep a long KaTeX claim inside its speech bubble, including narrow editor previews. Measurements use
 *  layout pixels so the containing slide’s CSS transform does not change the fitting calculation. */
function ClaimLine({ text }: { text: string }) {
  const outer = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });
  useLayoutEffect(() => {
    const box = outer.current!, content = inner.current!;
    const measure = () => {
      const scale = Math.min(1, box.clientWidth / Math.max(1, content.scrollWidth));
      const height = content.offsetHeight * scale;
      setFit((old) => Math.abs(old.scale - scale) < 0.005 && Math.abs(old.height - height) < 0.5 ? old : { scale, height });
    };
    measure(); const ro = new ResizeObserver(measure); ro.observe(box); ro.observe(content);
    return () => ro.disconnect();
  }, [text]);
  return <div ref={outer} className="depth-claim-line" style={{ height: fit.height || undefined }}><div ref={inner} style={{ transform: `scale(${fit.scale})`, transformOrigin: "top left" }}><InlineMath text={text} /></div></div>;
}
export function DepthClaims({ claims }: { claims: { name: string; text: string }[] }) {
  const cast = assignCast(claims.map((c) => c.name));
  return <div className="depth-speakers">{claims.map((c, i) => <div key={i} className="depth-speaker" data-depth-speaker={c.name} style={{ "--speaker-colour": colours[i % colours.length] } as CSSProperties}>
    <span className="depth-avatar" data-cast-member={cast[i]}><Avatar member={cast[i]} size="2.7em" /></span>
    <div className="depth-speech"><div className="depth-speaker-name">{c.name}</div>{c.text.split("\n").map((line, j) => <ClaimLine key={j} text={line} />)}</div>
  </div>)}</div>;
}
