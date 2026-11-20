// Mechanics diagrams: the one renderer. Scene in, <svg> out. Honours `step` (a worked example builds the picture), `showAnswer` (labels with an
// `ask` show it until the answer is revealed), `focus` (what a step is about stays bold, the rest fades) and `size` (the text grows for a small cell).
// The picture is the same at every size; only the label text changes, so the layout is solved per size. Plan: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md.
import { useMemo, type ReactElement } from "react";
import { layoutScene } from "./labelling";
import { LABEL_SIZE, type DiagramSize } from "./palette";
import { ArcEl, BodyEl, DimEl, ForceEl, LabelEl, MarkerEl, SurfaceEl } from "./draw";
import type { Scene, SceneElement } from "./scene";

export interface MechDiagramProps {
  scene: Scene;
  showAnswer?: boolean;
  /** Show only the elements revealed by this working step (undefined = all). */
  step?: number;
  /** Written as `data-q-index` so the shared print handler can find the picture (docs/reference/pictures.md). */
  qIndex?: number;
  size?: DiagramSize;
  /** Ids or focus tags to emphasise; everything else fades. */
  focus?: string[];
}

const isFocused = (e: SceneElement, focus?: string[]): boolean =>
  !focus || focus.length === 0 || focus.includes(e.id) || (e.focus ?? []).some((t) => focus.includes(t));

export default function MechDiagram({ scene, showAnswer = false, step, qIndex, size = "board", focus }: MechDiagramProps): ReactElement {
  const fontSize = LABEL_SIZE[size];
  const layout = useMemo(() => layoutScene(scene, { step, showAnswer, fontSize }), [scene, step, showAnswer, fontSize]);
  const dimmed = (e: SceneElement) => !isFocused(e, focus);
  const dimLabelIds = new Set(layout.visible.filter((e) => e.type === "dim").map((e) => e.id));
  const by = <T extends SceneElement["type"]>(t: T) => layout.visible.filter((e): e is Extract<SceneElement, { type: T }> => e.type === t);
  const byId = new Map(layout.visible.map((e) => [e.id, e]));

  return (
    <svg
      viewBox={`0 0 ${scene.w} ${scene.h}`}
      style={{ display: "block", width: "100%", height: "auto" }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={scene.alt}
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      {by("surface").map((e) => <SurfaceEl key={e.id} s={e} dim={dimmed(e)} />)}
      {by("line").map((e) => (
        <line key={e.id} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="#6b7280" strokeWidth={e.style === "thin" ? 1.2 : 1.8} strokeDasharray={e.style === "dashed" ? "6 4" : undefined} opacity={dimmed(e) ? 0.4 : 1} />
      ))}
      {by("body").filter((e) => e.ghost).map((e) => <BodyEl key={e.id} b={e} dim={dimmed(e)} />)}
      {by("body").filter((e) => !e.ghost).map((e) => <BodyEl key={e.id} b={e} dim={dimmed(e)} />)}
      {by("dim").map((e) => <DimEl key={e.id} d={e} dim={dimmed(e)} />)}
      {by("arc").map((e) => <ArcEl key={e.id} a={e} dim={dimmed(e)} />)}
      {by("force").map((e) => <ForceEl key={e.id} f={e} dim={dimmed(e)} />)}
      {by("marker").map((e) => <MarkerEl key={e.id} m={e} dim={dimmed(e)} />)}
      {layout.labels.map((l) => {
        const owner = byId.get(l.id);
        const dim = owner ? dimmed(owner) : false;
        return (
          <g key={`lbl-${l.id}`} opacity={dim ? 0.45 : 1}>
            {l.hasLeader && <line x1={l.lx} y1={l.ly} x2={l.x} y2={l.y} stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" />}
            <LabelEl x={l.x} y={l.y} text={l.text} size={fontSize} backing={dimLabelIds.has(l.id)} w={l.rect.w} h={l.rect.h} />
          </g>
        );
      })}
    </svg>
  );
}
