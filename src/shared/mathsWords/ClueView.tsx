import { MathRenderer } from "../components/MathRenderer";
import { PicView } from "./Pics";
import type { Clue } from "./words";

/** One clue, sized to fill its parent (the parent must have a definite height for pictures). */
export function ClueView({ clue, phone, scale = 1 }: { clue: Clue; phone?: boolean; scale?: number }) {
  if (clue.k === "def") {
    return (
      <p className="font-semibold text-slate-900 leading-tight text-center"
        style={{ fontSize: phone ? `${1.6 * scale}rem` : `clamp(${1.6 * scale}rem, ${3.6 * scale}vw, ${4.2 * scale}rem)` }}>
        {clue.s}
      </p>
    );
  }
  if (clue.k === "sym") {
    return (
      <div className="text-slate-900" style={{ fontSize: phone ? `${3 * scale}rem` : `clamp(${3 * scale}rem, ${8 * scale}vw, ${8.5 * scale}rem)` }}>
        <MathRenderer latex={clue.s} />
      </div>
    );
  }
  return <div className="mx-auto h-full w-full" style={{ maxWidth: 640 }}><PicView p={clue.p} /></div>;
}
