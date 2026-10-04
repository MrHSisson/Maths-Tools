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

import type { AnyQuestion, QOSnapshot, WorkingStep } from "./types";

type QuestionRenderer = (
  q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string,
) => JSX.Element | null;

interface DiagramStepExtra { kind: "diagramStep"; view: AnyQuestion; reveal: boolean }

/** Wrap a tool's generateQuestion so every working step carries the question's diagram for the picture slot. */
export const withDiagramSteps = <A extends unknown[]>(generate: (...args: A) => AnyQuestion) =>
  (...args: A): AnyQuestion => {
    const q = generate(...args);
    if (!(q as unknown as { _diagram?: unknown })._diagram) return q;
    const view = { ...q, working: [] } as AnyQuestion;   // no circular reference back to the steps
    const last = q.working.length - 1;
    const working: WorkingStep[] = q.working.map((w, i) => ({
      ...w,
      extra: { kind: "diagramStep", view, reveal: i === last } satisfies DiagramStepExtra,
    }));
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
export const diagramSplitQuestion = (render: QuestionRenderer, opts: { promptInDiagram?: boolean } = {}): QuestionRenderer =>
  (q, showAnswer, colorScheme, compact, idx, qo, fontClass) => {
    const inWorkedExample = compact === false && !qo?.fullscreen;
    const prompt = (q as unknown as { display?: string }).display;
    // The diagram already carries its own prompt (Bearings, Circles): don't repeat it above.
    if (inWorkedExample && showAnswer && opts.promptInDiagram) return null;
    if (inWorkedExample && showAnswer && prompt) {
      return <div className={`${fontClass ?? "text-3xl"} font-semibold`} style={{ color: "#000" }}>{prompt}</div>;
    }
    return render(q, showAnswer, colorScheme, compact, idx, qo, fontClass);
  };
