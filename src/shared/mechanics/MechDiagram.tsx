// Mechanics diagrams: the one renderer. Scene in, <svg> out. Honours `step` (a worked example builds the picture), `showAnswer` (labels with an
// `ask` show it until the answer is revealed), `focus` (what a step is about stays bold, the rest fades) and `size` (the text grows for a small cell).
// The picture is the same at every size; only the label text changes, so the layout is solved per size. Plan: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md.
import { useMemo, type ReactElement } from "react";
import { layoutScene } from "./labelling";
import { LABEL_SIZE, type DiagramSize } from "./palette";
import { ArcEl, BarsEl, Band, BodyEl, DimEl, ForceEl, GraphEl, LabelEl, MarkerEl, PulleyEl, SpringEl, SurfaceEl } from "./draw";
import { dimLine } from "./labelling";
import { displayStep, type DiagramDisplay, type DiagramView, type Scene, type SceneElement } from "./scene";

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
  /** Put a soft band behind whatever was added at exactly this step, so a worked example shows where the new part went. On by default. */
  emphasise?: boolean;
}

const isFocused = (e: SceneElement, focus?: string[]): boolean =>
  !focus || focus.length === 0 || focus.includes(e.id) || (e.focus ?? []).some((t) => focus.includes(t));

export default function MechDiagram({ scene, showAnswer = false, step, qIndex, size = "board", focus, emphasise = true }: MechDiagramProps): ReactElement {
  const asked = LABEL_SIZE[size];
  const layout = useMemo(() => layoutScene(scene, { step, showAnswer, fontSize: asked }), [scene, step, showAnswer, asked]);
  const fontSize = layout.fontSize;
  const dimmed = (e: SceneElement) => !isFocused(e, focus);
  const dimLabelIds = new Set(layout.visible.filter((e) => e.type === "dim").map((e) => e.id));
  const by = <T extends SceneElement["type"]>(t: T) => layout.visible.filter((e): e is Extract<SceneElement, { type: T }> => e.type === t);
  const byId = new Map(layout.visible.map((e) => [e.id, e]));
  const hot = (e: SceneElement) => emphasise && step != null && step > 0 && e.reveal === step;

  return (
    <svg
      viewBox={`0 0 ${scene.w} ${scene.h}`}
      style={{ display: "block", width: "100%", height: "auto" }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={scene.alt}
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      {by("surface").map((e) => <g key={e.id}>{hot(e) && <Band a={e.a} b={e.b} />}<SurfaceEl s={e} dim={dimmed(e)} /></g>)}
      {by("line").map((e) => (
        <line key={e.id} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="#6b7280" strokeWidth={e.style === "thin" ? 1.2 : 1.8} strokeDasharray={e.style === "dashed" ? "6 4" : undefined} opacity={dimmed(e) ? 0.4 : 1} />
      ))}
      {by("body").filter((e) => e.ghost).map((e) => <BodyEl key={e.id} b={e} dim={dimmed(e)} />)}
      {by("body").filter((e) => !e.ghost).map((e) => <BodyEl key={e.id} b={e} dim={dimmed(e)} />)}
      {by("graph").map((e) => <GraphEl key={e.id} g={e} dim={dimmed(e)} />)}
      {by("bars").map((e) => <BarsEl key={e.id} b={e} dim={dimmed(e)} />)}
      {by("spring").map((e) => <SpringEl key={e.id} s={e} dim={dimmed(e)} hot={hot(e)} />)}
      {by("pulley").map((e) => <PulleyEl key={e.id} p={e} dim={dimmed(e)} />)}
      {by("dim").map((e) => <g key={e.id}>{hot(e) && <Band a={dimLine(e).a} b={dimLine(e).b} />}<DimEl d={e} dim={dimmed(e)} /></g>)}
      {by("arc").map((e) => <ArcEl key={e.id} a={e} dim={dimmed(e)} />)}
      {by("force").map((e) => <g key={e.id}>{hot(e) && <Band a={e.from} b={e.to} />}<ForceEl f={e} dim={dimmed(e)} /></g>)}
      {by("marker").map((e) => <MarkerEl key={e.id} m={e} dim={dimmed(e)} />)}
      {layout.labels.map((l) => {
        const owner = byId.get(l.id.split(":")[0]);
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

export interface MechPictureProps extends Omit<MechDiagramProps, "step" | "showAnswer"> {
  /** Does the question give its diagram straight away, build it up as the working goes on, or have none? */
  display: DiagramDisplay;
  /** Where the picture is being shown. */
  view: DiagramView;
}

/** The picture as a tool shows it: `display` and `view` decide whether anything is drawn and how much (the rule is `displayStep`). Nothing is drawn for a question that gives no diagram. */
export function MechPicture({ display, view, ...rest }: MechPictureProps): ReactElement | null {
  const step = displayStep(display, view);
  if (step === null) return null;
  return <MechDiagram {...rest} step={step} showAnswer={view.stage === "answer"} />;
}
