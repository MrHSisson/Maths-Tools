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
    const stepFocus = (q as unknown as { _stepFocus?: unknown[] })._stepFocus;
    const last = q.working.length - 1;
    const working: WorkingStep[] = q.working.map((w, i) => {
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
