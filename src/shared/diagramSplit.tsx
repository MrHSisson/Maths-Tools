// Split worked example for diagram-first tools (the geometry tools). The question IS a diagram, so in the
// two-view Worked Example the diagram moves into the picture slot beside the steps, and the question box above
// shrinks to the one-line prompt (q.display) once the answer is up — the diagram is never shown twice.
//
// A tool opts in with three one-liners at module level (stable identities — ToolShell uses them in effects):
//
//   const gen   = withDiagramSteps(generateQuestion);          // stamps each step with the question's diagram
//   const qr    = diagramSplitQuestion(questionRenderer);       // diagram → prompt line in the worked example
//                 (pass { promptInDiagram: true } when the drawing already carries its own prompt)
//   const visual = diagramStepVisual(questionRenderer);         // the picture slot
//   <ToolShell generateQuestion={gen} questionRenderer={qr} stepVisualRenderer={visual} stepVisualKeepsWorking … />
//
// Convention: the question stores its drawing data on `_diagram` and a short prompt on `display`. The picture shows
// the diagram with the answer revealed on the final step.
//
// Per-step emphasis (optional): a question may carry `_stepFocus`, one entry per working step (any shape the tool's
// renderer understands — Triangles uses the indices of the angles the step is about; undefined = no emphasis). Each
// step's picture is rendered from a copy of the question with that entry on `_focus`, so a tool's questionRenderer
// just reads `(q as any)._focus` and lights up what the step is talking about. `(q as any)._step` is the step's index,
// so a diagram can also reveal things the working has just found (a derived angle, a computed length).

import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { AnyQuestion, QOSnapshot, WorkingStep } from "./types";
import { splitAnswerStep } from "./helpers";
import { ScaleToFit } from "./components/ScaleToFit";

type QuestionRenderer = (
  q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string,
) => JSX.Element | null;

const usePhone = () => {
  const query = "(max-width: 640px)";   // ToolShell's narrow layout
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
};

/** Phone question: the prompt, then the diagram SMALL (so the page is not just a huge picture); tap it to enlarge and tap
 *  again to shrink. Once the answer is showing the diagram is in the step picture slot and this is no longer drawn. */
function PhoneDiagramQuestion({ prompt, children }: { prompt?: string; children: ReactNode }) {
  const [zoom, setZoom] = useState(false);
  return (
    <div>
      {prompt && <div className="text-xl font-semibold mb-2" style={{ color: "#000" }}>{prompt}</div>}
      <button type="button" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Shrink the diagram" : "Enlarge the diagram"}
        className="relative block w-full rounded-2xl border border-slate-200 bg-white active:bg-slate-50 pb-6">
        {zoom ? children : <div className="w-full" style={{ height: "22dvh" }}><ScaleToFit maxScale={1}><div className="px-2">{children}</div></ScaleToFit></div>}
        <span className="absolute right-3 bottom-1.5 flex items-center gap-1 text-xs font-semibold text-slate-400">
          {zoom ? <Minimize2 size={13} /> : <Maximize2 size={13} />}{zoom ? "Tap to shrink" : "Tap to enlarge"}
        </span>
      </button>
    </div>
  );
}

interface DiagramStepExtra { kind: "diagramStep"; view: AnyQuestion; reveal: boolean }

/** Wrap a tool's generateQuestion so every working step carries the question's diagram for the picture slot. */
export const withDiagramSteps = <A extends unknown[]>(generate: (...args: A) => AnyQuestion) =>
  (...args: A): AnyQuestion => {
    const q = generate(...args);
    if (!(q as unknown as { _diagram?: unknown })._diagram) return q;
    // A last step that is an inline chain ending "= result" becomes working + a separate green answer step.
    const split = splitAnswerStep(q.working);
    let stepFocus = (q as unknown as { _stepFocus?: unknown[] })._stepFocus;
    if (stepFocus && split.length > q.working.length) stepFocus = [...stepFocus, stepFocus[stepFocus.length - 1]];   // the answer step is about the same thing
    const last = split.length - 1;
    const working: WorkingStep[] = split.map((w, i) => {
      // A copy per step, no circular reference back to the steps; `_focus` is what this step is about.
      const view = { ...q, working: [], _focus: stepFocus?.[i], _step: i } as unknown as AnyQuestion;
      return { ...w, extra: { kind: "diagramStep", view, reveal: i === last } satisfies DiagramStepExtra };
    });
    return { ...q, working } as AnyQuestion;
  };

/** `stepVisualRenderer`: the tool's own diagram, with the answer shown on the final step. Null for other steps. */
export const diagramStepVisual = (render: QuestionRenderer) =>
  (step: WorkingStep, colorScheme: string, qo?: QOSnapshot): JSX.Element | null => {
    const e = step.extra as DiagramStepExtra | undefined;
    if (e?.kind !== "diagramStep") return null;
    return <div className="w-full flex justify-center">{render(e.view, e.reveal, colorScheme, false, undefined, qo)}</div>;
  };

/** `questionRenderer`: unchanged everywhere except the worked example once the answer is showing, where the diagram
 *  has moved to the picture slot and only the prompt remains. */
export const diagramSplitQuestion = (render: QuestionRenderer, opts: { promptInDiagram?: boolean } = {}): QuestionRenderer => {
  // the phone question view is a component (it holds the enlarge state), so the renderer hands it over to one
  const Phone = ({ q, colorScheme, qo, fontClass, prompt }: { q: AnyQuestion; colorScheme: string; qo?: QOSnapshot; fontClass?: string; prompt?: string }) => {
    const phone = usePhone();
    const picture = render(q, false, colorScheme, false, undefined, qo, fontClass);
    return phone ? <PhoneDiagramQuestion key={q.key} prompt={opts.promptInDiagram ? undefined : prompt}>{picture}</PhoneDiagramQuestion> : picture;
  };
  return (q, showAnswer, colorScheme, compact, idx, qo, fontClass) => {
    const inWorkedExample = compact === false && !qo?.fullscreen;
    const prompt = (q as unknown as { display?: string }).display;
    if (inWorkedExample && !showAnswer) return <Phone q={q} colorScheme={colorScheme} qo={qo} fontClass={fontClass} prompt={prompt} />;
    // The diagram already carries its own prompt (Bearings, Circles): don't repeat it above.
    if (inWorkedExample && showAnswer && opts.promptInDiagram) return null;
    if (inWorkedExample && showAnswer && prompt) {
      return <div className={`${fontClass ?? "text-3xl"} font-semibold`} style={{ color: "#000" }}>{prompt}</div>;
    }
    return render(q, showAnswer, colorScheme, compact, idx, qo, fontClass);
  };
};
