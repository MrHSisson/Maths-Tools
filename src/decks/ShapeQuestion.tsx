import "./ShapeQuestion.css";
import { ShapeDiagram } from "../shared/shapes/Diagram";
import type { Drawing, Focus } from "../shared/shapes/drawing";

/** The tool's own picture in a slide. Earlier missing-side reveals remain visible when the working advances. */
export function ShapeQuestion({ drawing, focuses = [], shown = 0, answer = false }: { drawing: Drawing; focuses?: (Focus | undefined)[]; shown?: number; answer?: boolean }) {
  const active = focuses.slice(0, shown);
  const current = active[active.length - 1];
  const focus = shown ? { ...current, reveal: [...new Set(active.flatMap(f => f?.reveal ?? []))], revealHelpers: [...new Set(active.flatMap(f => f?.revealHelpers ?? []))] } : undefined;
  return <div data-shape-question="" style={{ width: "100%", height: "100%", minHeight: 0 }}><ShapeDiagram hideCaption d={drawing} focus={focus} showAnswer={answer} fillBox /></div>;
}
