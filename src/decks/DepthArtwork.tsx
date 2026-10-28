import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, Mascot, assignCast } from "../shared/components/DepthArt";
import { InlineMath } from "../shared/components/MathRenderer";
import { feathersLine } from "../shared/depth";
import { loadDepthItems } from "./generators";
import type { CuratedQuestion } from "./types";

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
export function DepthFeathers({ question, answer, base }: { question: CuratedQuestion; answer: boolean; base: number }) {
  const [legacy, setLegacy] = useState<{ id: string; prompt: string; takeaway: string } | null>(null);
  const source = question.source;
  useEffect(() => {
    let active = true;
    if (!question.depth && source?.kind === "depth") void loadDepthItems(source.tool).then((items) => {
      const item = items.find((i) => i.id === source.id);
      if (active && item) setLegacy({ id: source.id, prompt: feathersLine(item, false), takeaway: feathersLine(item, true) });
    }).catch(() => { /* Keep the generic classroom nudge if the old source is unavailable. */ });
    return () => { active = false; };
  }, [question.depth, source?.kind, source?.tool, source?.id]);
  const hints = question.depth ?? (legacy?.id === source?.id ? legacy : null);
  const line = answer ? hints?.takeaway || "Explain the idea you want to remember." : hints?.prompt || (question.format === "error" ? "Tap the line where it first goes wrong." : question.format === "claims" ? "Decide who you agree with, then say why." : "Think on your own first, then compare with a partner.");
  return <aside className="depth-feathers" aria-label="Feathers" data-depth-feathers="" style={{ fontSize: base }}><Mascot mood={answer ? "know" : "think"} size="1.9em" tone="light" /><div className="depth-feathers-bubble"><span className="depth-speaker-name">Feathers</span><InlineMath text={line} /></div></aside>;
}
